import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"
import { globSync } from "tinyglobby"
import type { Plugin } from "vite"
import {
  canonicalPath,
  MEDIA_PREFIX,
  RESERVED_OUTPUT_NAMES,
  RESERVED_ROUTES,
} from "../src/lib/routes.ts"
import { tagSlug } from "../src/lib/tags.ts"
import { excerpt } from "./excerpt.ts"
import { parseFrontmatter, type Frontmatter } from "./frontmatter.ts"
import {
  IMAGE_EXT,
  markdownMediaKind,
  parseMarkdown,
  preprocessObsidian,
  scanBody,
  type BodyRef,
} from "./markdown.ts"
import { createResolver, type Resolver } from "./resolve.ts"
import { normalizePath, slugifySegment } from "./slug.ts"

export const CONTENT_DIR = fileURLToPath(new URL("../content", import.meta.url))

export type ContentEntry = {
  /** content/ 기준 상대 경로 (예: `devlog/codex-model-cache-bug.md`) */
  id: string
  /** 파일 절대 경로 */
  file: string
  url: string
  title: string
  /** 최상위 폴더 이름. 루트에 있는 파일은 빈 문자열 */
  section: string
  /** 폴더 index 페이지 여부 */
  isIndex: boolean
  tags: string[]
  /** 작성일. frontmatter `date`, 없으면 git 최초 커밋 */
  date: string | null
  /** 수정일. git 마지막 커밋 */
  updated: string | null
  description: string | null
  draft: boolean
  comments: boolean
  /** 예전 URL. 이 경로들에는 `url`로 보내는 리다이렉트 페이지를 만든다 */
  aliases: string[]
  /** 이 글이 링크하는 다른 글의 URL (백링크 계산용) */
  links: string[]
  /** 링크 미리보기 이미지 (절대 URL 또는 `/_media/…`) */
  image: string | null
  /**
   * 댓글(giscus)을 이어 붙일 경로. Quartz 시절 댓글은 그때 URL로 매핑돼 있으므로
   * 절대 경로로 적은 alias(= 옮기기 전 URL)가 있으면 그것을, 없으면 지금 URL을 쓴다.
   */
  commentPath: string
}

function readFrontmatter(file: string): Frontmatter {
  return readSource(file).data
}

function readSource(file: string): { data: Frontmatter; body: string } {
  const { data, content } = matter(fs.readFileSync(file, "utf8"))
  return { data: parseFrontmatter(data, path.relative(CONTENT_DIR, file)), body: content }
}

const toIso = (value: string | Date) => new Date(value).toISOString()

const gitDateCache = new Map<string, { created: string | null; updated: string | null }>()

/** 파일의 git 최초·마지막 커밋 시각. 커밋되지 않은 파일은 null. */
function gitDates(file: string) {
  const cached = gitDateCache.get(file)
  if (cached) return cached
  let dates: string[] = []
  try {
    dates = execFileSync("git", ["log", "--follow", "--format=%aI", "--", file], {
      cwd: CONTENT_DIR,
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean)
  } catch {
    // git이 없거나 저장소 밖이면 날짜 없이 진행한다.
  }
  // 커밋마다 시간대 오프셋이 달라도 문자열 정렬이 시간순이 되도록 UTC ISO로 맞춘다.
  const created = dates.at(-1)
  const updated = dates[0]
  const result = {
    created: created ? toIso(created) : null,
    updated: updated ? toIso(updated) : null,
  }
  gitDateCache.set(file, result)
  return result
}

/**
 * frontmatter 목록 값을 배열로 맞춘다. Quartz처럼 문자열 하나는 쉼표로 나눈다
 * (`aliases: old-a, old-b` → `["old-a", "old-b"]`).
 */
const toList = (value: string | string[] | undefined): string[] =>
  (value === undefined ? [] : Array.isArray(value) ? value : value.split(","))
    .map((v) => String(v).trim())
    .filter(Boolean)

/**
 * frontmatter alias를 사이트 경로로 바꾼다. Quartz와 같은 규칙을 따른다.
 * `./`, `../`로 시작하면 글이 있는 폴더 기준, 그 밖에는 사이트 루트 기준이다.
 * 각 조각은 글 URL과 같은 slug 규칙을 거친다 (`MCQA Project 회고` → `/MCQA-Project-회고`).
 */
function aliasUrl(alias: string, entryUrl: string, isIndex: boolean): string {
  const raw = alias.trim().replace(/\.mdx?$/i, "")
  // 폴더 index 파일은 그 폴더 안에 있으므로 자기 URL이 기준 폴더다.
  const folder = isIndex ? entryUrl : path.posix.dirname(entryUrl)
  const base = /^\.{1,2}\//.test(raw) ? folder : "/"
  const joined = path.posix.normalize(path.posix.join(base, raw))
  const segments = joined.split("/").filter(Boolean).map(slugifySegment)
  return normalizePath(segments.join("/"))
}

/**
 * 링크 미리보기 이미지. frontmatter `image`가 있으면 그것을, 없으면 본문의 첫 이미지를 쓴다.
 * 외부 URL은 그대로, content/ 안의 파일은 `/_media/…` 경로로 바꾼다.
 */
function previewImage(
  explicit: string | undefined,
  refs: BodyRef[],
  entry: ContentEntry,
  resolver: Resolver,
): string | null {
  const external = (url: string) => /^https?:\/\//.test(url)
  // 글 기준 상대 경로 → 없으면 파일 이름으로 찾는다 (Obsidian처럼)
  const fromUrl = (url: string) => {
    if (external(url) || url.startsWith("/")) return url
    const found = resolver.resolve(url, entry.file)
    if (found) return found.kind === "media" ? found.url : null
    let name = url
    try {
      name = decodeURIComponent(url)
    } catch {}
    return resolver.media(name, entry.file) ?? null
  }
  if (explicit) {
    const found = fromUrl(explicit)
    if (found) return found
    console.warn(
      `[content] ${entry.id}: 미리보기 이미지를 찾을 수 없음: ${explicit} (본문 이미지로 대신한다)`,
    )
  }

  for (const ref of refs) {
    const found =
      // `![](clip.mp4)`처럼 영상·소리·PDF를 가리키는 이미지 문법은 미리보기 이미지로 쓰지 않는다.
      ref.kind === "image" && markdownMediaKind(ref.url) === "image"
        ? fromUrl(ref.url)
        : ref.kind === "wikilink" && ref.embedsFile && IMAGE_EXT.test(ref.target)
          ? resolver.media(ref.target, entry.file)
          : undefined
    if (found) return found
  }
  return null
}

/** 본문에서 다른 글로 가는 링크(위키링크, 사이트 절대 경로, 글 기준 상대 경로)의 URL을 모은다 */
function outgoingLinks(
  refs: BodyRef[],
  entry: ContentEntry,
  resolver: Resolver,
  /** 글 URL과 alias(예전 URL) → 글 URL. 대소문자는 URL 검증과 같이 구분하지 않는다 */
  urls: Map<string, string>,
): string[] {
  const found = new Set<string>()
  for (const ref of refs) {
    if (ref.kind === "wikilink" && !ref.embedsFile && ref.target) {
      const url = resolver.page(ref.target, entry.file)?.url
      if (url) found.add(url)
    } else if (ref.kind === "link" && ref.url.startsWith("/") && !ref.url.startsWith("//")) {
      // 앱에서 `findEntry()`가 찾는 것과 같은 규칙으로 맞춘다 (`/a/b/index.html` → `/a/b`).
      const url = canonicalPath(ref.url.split(/[?#]/)[0])
      const target = urls.get(url.toLowerCase())
      if (target) found.add(target)
    } else if (ref.kind === "link") {
      const target = resolver.resolve(ref.url, entry.file)
      if (target?.kind === "page") found.add(target.entry.url)
    }
  }
  found.delete(entry.url)
  return [...found]
}

/** frontmatter 날짜가 있으면 ISO로 바꾸고, 없으면 git 날짜를 쓴다 */
function toIsoOr(value: string | Date | undefined, fallback: string | null): string | null {
  return value ? toIso(value) : fallback
}

function uniqueTags(tags: string[]): string[] {
  const seen = new Set<string>()
  return tags.filter((tag) => {
    const slug = tagSlug(tag)
    if (!slug || seen.has(slug)) return false
    seen.add(slug)
    return true
  })
}

/**
 * content/ 아래의 모든 글을 스캔해서 URL이 확정된 목록을 만든다.
 * `withDates`가 false면 git을 호출하지 않는다 (링크 해석처럼 날짜가 필요 없을 때).
 */
/**
 * 빌드에서 빼는 폴더. Quartz의 ignorePatterns(`private`, `templates`, `.obsidian`)와 같다.
 * 점으로 시작하는 파일·폴더(`.obsidian` 등)는 tinyglobby가 기본으로 건너뛴다.
 */
const CONTENT_IGNORE = ["**/private/**", "**/templates/**"]

export function loadContent({ withDates = true } = {}): ContentEntry[] {
  const files = globSync("**/*.{md,mdx}", { cwd: CONTENT_DIR, ignore: CONTENT_IGNORE }).sort()

  // 폴더 index의 frontmatter slug는 그 폴더의 URL 조각을 바꾼다.
  const dirSlugs = new Map<string, string>()
  for (const id of files) {
    if (path.basename(id, path.extname(id)) !== "index") continue
    const fm = readFrontmatter(path.join(CONTENT_DIR, id))
    // 초안 index의 slug는 빌드에 반영하지 않는다.
    if (fm.slug && !fm.draft) dirSlugs.set(path.dirname(id), slugifySegment(fm.slug))
  }

  const dirUrl = (dir: string): string => {
    if (dir === ".") return ""
    const parent = dirUrl(path.dirname(dir))
    return `${parent}/${dirSlugs.get(dir) ?? slugifySegment(path.basename(dir))}`
  }

  const entries: ContentEntry[] = []
  const bodyRefs = new Map<string, BodyRef[]>()
  const images = new Map<string, string>()
  const byUrl = new Map<string, string>()

  // 라우터는 고정 경로를 대소문자 구분 없이 매칭하고, macOS 같은 파일 시스템도
  // 대소문자를 구분하지 않으므로 검증은 소문자로 한다.
  const claim = (url: string, owner: string) => {
    const key = url.toLowerCase()
    if (RESERVED_ROUTES.includes(key) || RESERVED_OUTPUT_NAMES.includes(key.split("/")[1])) {
      throw new Error(`예약된 경로와 겹치는 글: ${url} ← ${owner}`)
    }
    const existing = byUrl.get(key)
    if (existing) throw new Error(`URL 충돌: ${url} ← ${existing}, ${owner}`)
    byUrl.set(key, owner)
  }

  for (const id of files) {
    const file = path.join(CONTENT_DIR, id)
    const { data: fm, body } = readSource(file)
    // 초안은 빌드에서 빠지므로 URL 검증(예약 경로·충돌)에서도 제외한다.
    if (fm.draft) continue
    const name = path.basename(id, path.extname(id))
    const dir = path.dirname(id)
    const isIndex = name === "index"

    // 루트 index는 사이트 홈이 따로 있으므로 글로 취급하지 않는다.
    if (isIndex && dir === ".") continue

    const url = normalizePath(
      isIndex ? dirUrl(dir) : `${dirUrl(dir)}/${slugifySegment(fm.slug ?? name)}`,
    )

    claim(url, id)

    const git = withDates ? gitDates(file) : { created: null, updated: null }
    const rawAliases = [...toList(fm.aliases), ...toList(fm.alias)]
    // Quartz는 permalink를 alias 목록에 더했다. 옮기기 전 주소(commentPath)를 찾을 때는 쓰지 않는다.
    const permalink = fm.permalink?.trim()
    const oldPath = rawAliases.find((a) => a.startsWith("/"))
    // Obsidian 전처리(주석, 위키링크 이스케이프)는 .md 노트에만 적용한다. .mdx는 MDX 문법으로 읽어서
    // import/export와 `{식}` 안의 글자를 링크·태그로 세지 않는다.
    const mdx = file.endsWith(".mdx")
    const refs = scanBody(parseMarkdown(body, { mdx }))
    bodyRefs.set(id, refs)
    const ogImage = fm.image ?? fm.cover ?? fm.socialImage
    if (ogImage) images.set(id, ogImage)
    entries.push({
      id,
      file,
      url,
      title: fm.title ?? (isIndex ? path.basename(dir) : name).normalize("NFC"),
      section: dir === "." ? "" : id.split("/")[0].normalize("NFC"),
      isIndex,
      // frontmatter 태그 뒤에 본문 `#태그`를 붙인다. 같은 태그는 한 번만 둔다.
      tags: uniqueTags([
        ...toList(fm.tags),
        ...toList(fm.tag),
        ...refs.flatMap((ref) => (ref.kind === "tag" ? [ref.tag] : [])),
      ]),
      date: toIsoOr(fm.date ?? fm.created ?? fm.published ?? fm.publishDate, git.created),
      updated: toIsoOr(fm.updated ?? fm.modified ?? fm.lastmod ?? fm["last-modified"], git.updated),
      // Quartz처럼 description이 없으면 본문 앞부분으로 만든다.
      description: fm.description ?? excerpt(mdx ? body : preprocessObsidian(body), { mdx }),
      draft: false,
      comments: fm.comments ?? true,
      aliases: [...rawAliases, ...(permalink ? [permalink] : [])].map((a) =>
        aliasUrl(a, url, isIndex),
      ),
      links: [],
      image: null,
      commentPath: oldPath ? aliasUrl(oldPath, url, isIndex) : url,
    })
  }

  // alias는 모든 글 URL이 정해진 뒤에 검증해야 글과의 충돌을 빠짐없이 잡는다.
  for (const entry of entries) {
    entry.aliases = [...new Set(entry.aliases)].filter((a) => a !== entry.url)
    for (const alias of entry.aliases) claim(alias, `${entry.id} (alias)`)
  }

  const resolver = createResolver(entries)
  const urls = new Map<string, string>()
  for (const entry of entries) {
    urls.set(entry.url.toLowerCase(), entry.url)
    for (const alias of entry.aliases) urls.set(alias.toLowerCase(), entry.url)
  }
  for (const entry of entries) {
    const refs = bodyRefs.get(entry.id) ?? []
    entry.links = outgoingLinks(refs, entry, resolver, urls)
    entry.image = previewImage(images.get(entry.id), refs, entry, resolver)
  }

  return entries
}

/** content/ 안의 글이 아닌 파일(이미지 등). content/ 기준 상대 경로 */
export function listMediaFiles(): string[] {
  return globSync("**/*", { cwd: CONTENT_DIR, ignore: ["**/*.{md,mdx}", ...CONTENT_IGNORE] }).sort()
}

/** 미디어 파일의 공개 URL (`/_media/devlog/images/x.png`) */
export function mediaUrl(relPath: string): string {
  // 파일명에 `?`, `#` 같은 URL 구분자가 있어도 경로로 읽히도록 조각마다 인코딩한다.
  const segments = relPath.normalize("NFC").split("/").map(encodeURIComponent)
  return `/${MEDIA_PREFIX}/${segments.join("/")}`
}

const VIRTUAL_ID = "virtual:content"
const RESOLVED_ID = "\0" + VIRTUAL_ID

/**
 * `virtual:content` 모듈을 제공하고, content/ 안의 미디어 파일을 `/_media/`로 내보낸다.
 * 글 메타데이터는 그대로 싣고, 본문은 글마다 lazy import로 분리한다.
 */
export function contentPlugin({ onChange }: { onChange?: () => void } = {}): Plugin {
  return {
    name: "content",
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      const entries = loadContent()
      const items = entries.map(({ file, ...meta }) => {
        const json = JSON.stringify(meta).slice(0, -1)
        return `${json},"Component":lazy(() => import(${JSON.stringify(file)}))}`
      })
      return `import { lazy } from "solid-js"\nexport const entries = [\n${items.join(",\n")}\n]\n`
    },
    generateBundle() {
      // 미디어 파일은 브라우저 번들에만 한 번 복사한다.
      if (this.environment.config.consumer !== "client") return
      for (const rel of listMediaFiles()) {
        this.emitFile({
          type: "asset",
          fileName: `${MEDIA_PREFIX}/${rel.normalize("NFC")}`,
          source: fs.readFileSync(path.join(CONTENT_DIR, rel)),
        })
      }
    },
    configureServer(server) {
      // dev 서버에서 /_media/ 요청을 content/ 파일로 응답한다. 빌드가 내보내는 미디어 파일만 준다.
      server.middlewares.use(`/${MEDIA_PREFIX}/`, (req, res, next) => {
        let rel: string
        try {
          rel = decodeURIComponent((req.url ?? "").split("?")[0]).replace(/^\/+/, "")
        } catch {
          return next()
        }
        const match = listMediaFiles().find((m) => m.normalize("NFC") === rel.normalize("NFC"))
        if (!match) return next()
        fs.createReadStream(path.join(CONTENT_DIR, match)).pipe(res)
      })

      // 글이 추가·삭제·수정되면 목록(frontmatter, URL)을 다시 만든다.
      // 다른 글의 위키링크·임베드도 옛 목록으로 변환돼 캐시돼 있으므로 글 모듈 전체를 무효화한다.
      const refresh = (file: string) => {
        if (!file.startsWith(CONTENT_DIR)) return
        onChange?.()
        for (const mod of server.moduleGraph.idToModuleMap.values()) {
          if (mod.id === RESOLVED_ID || mod.file?.startsWith(CONTENT_DIR)) {
            server.moduleGraph.invalidateModule(mod)
          }
        }
        server.ws.send({ type: "full-reload" })
      }
      server.watcher.on("add", refresh)
      server.watcher.on("unlink", refresh)
      server.watcher.on("change", refresh)
    },
  }
}
