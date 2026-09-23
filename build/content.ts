import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"
import { globSync } from "tinyglobby"
import type { Plugin } from "vite"
import { MEDIA_PREFIX, RESERVED_OUTPUT_NAMES, RESERVED_ROUTES } from "../src/lib/routes.ts"
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
}

type Frontmatter = {
  title?: string
  slug?: string
  tags?: string[]
  date?: string | Date
  description?: string
  draft?: boolean
  comments?: boolean
}

function readFrontmatter(file: string): Frontmatter {
  return matter(fs.readFileSync(file, "utf8")).data as Frontmatter
}

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
  const result = { created: dates.at(-1) ?? null, updated: dates[0] ?? null }
  gitDateCache.set(file, result)
  return result
}

const toIso = (value: string | Date) => new Date(value).toISOString()

/**
 * content/ 아래의 모든 글을 스캔해서 URL이 확정된 목록을 만든다.
 * `withDates`가 false면 git을 호출하지 않는다 (링크 해석처럼 날짜가 필요 없을 때).
 */
export function loadContent({ withDates = true } = {}): ContentEntry[] {
  const files = globSync("**/*.{md,mdx}", { cwd: CONTENT_DIR }).sort()

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
  const byUrl = new Map<string, string>()

  for (const id of files) {
    const file = path.join(CONTENT_DIR, id)
    const fm = readFrontmatter(file)
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

    // 라우터는 고정 경로를 대소문자 구분 없이 매칭하고, macOS 같은 파일 시스템도
    // 대소문자를 구분하지 않으므로 검증은 소문자로 한다.
    const key = url.toLowerCase()
    if (RESERVED_ROUTES.includes(key) || RESERVED_OUTPUT_NAMES.includes(key.split("/")[1])) {
      throw new Error(`예약된 경로와 겹치는 글: ${url} ← ${id}`)
    }
    const existing = byUrl.get(key)
    if (existing) throw new Error(`URL 충돌: ${url} ← ${existing}, ${id}`)
    byUrl.set(key, id)

    const git = withDates ? gitDates(file) : { created: null, updated: null }
    entries.push({
      id,
      file,
      url,
      title: fm.title ?? (isIndex ? path.basename(dir) : name).normalize("NFC"),
      section: dir === "." ? "" : id.split("/")[0].normalize("NFC"),
      isIndex,
      tags: fm.tags ?? [],
      date: fm.date ? toIso(fm.date) : git.created,
      updated: git.updated,
      description: fm.description ?? null,
      draft: false,
      comments: fm.comments ?? true,
    })
  }

  return entries
}

/** content/ 안의 글이 아닌 파일(이미지 등). content/ 기준 상대 경로 */
export function listMediaFiles(): string[] {
  return globSync("**/*", { cwd: CONTENT_DIR, ignore: ["**/*.{md,mdx}"] }).sort()
}

/** 미디어 파일의 공개 URL (`/_media/devlog/images/x.png`) */
export function mediaUrl(relPath: string): string {
  return encodeURI(`/${MEDIA_PREFIX}/${relPath.normalize("NFC")}`)
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
      // dev 서버에서 /_media/ 요청을 content/ 파일로 응답한다.
      server.middlewares.use(`/${MEDIA_PREFIX}/`, (req, res, next) => {
        const rel = decodeURIComponent((req.url ?? "").split("?")[0]).replace(/^\/+/, "")
        const file = path.resolve(CONTENT_DIR, rel)
        if (!file.startsWith(CONTENT_DIR + path.sep) || !fs.existsSync(file)) return next()
        fs.createReadStream(file).pipe(res)
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
