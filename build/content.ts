import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"
import { globSync } from "tinyglobby"
import type { Plugin } from "vite"
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
  date: string | null
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

/** content/ 아래의 모든 글을 스캔해서 URL이 확정된 목록을 만든다. */
export function loadContent(): ContentEntry[] {
  const files = globSync("**/*.{md,mdx}", { cwd: CONTENT_DIR }).sort()

  // 폴더 index의 frontmatter slug는 그 폴더의 URL 조각을 바꾼다.
  const dirSlugs = new Map<string, string>()
  for (const id of files) {
    if (path.basename(id, path.extname(id)) !== "index") continue
    const slug = readFrontmatter(path.join(CONTENT_DIR, id)).slug
    if (slug) dirSlugs.set(path.dirname(id), slugifySegment(slug))
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
    const name = path.basename(id, path.extname(id))
    const dir = path.dirname(id)
    const isIndex = name === "index"

    // 루트 index는 사이트 홈이 따로 있으므로 글로 취급하지 않는다.
    if (isIndex && dir === ".") continue

    const url = normalizePath(
      isIndex ? dirUrl(dir) : `${dirUrl(dir)}/${slugifySegment(fm.slug ?? name)}`,
    )

    const existing = byUrl.get(url)
    if (existing) throw new Error(`URL 충돌: ${url} ← ${existing}, ${id}`)
    byUrl.set(url, id)

    entries.push({
      id,
      file,
      url,
      title: fm.title ?? (isIndex ? path.basename(dir) : name).normalize("NFC"),
      section: dir === "." ? "" : id.split("/")[0].normalize("NFC"),
      isIndex,
      tags: fm.tags ?? [],
      date: fm.date ? new Date(fm.date).toISOString() : null,
      description: fm.description ?? null,
      draft: fm.draft ?? false,
      comments: fm.comments ?? true,
    })
  }

  return entries.filter((e) => !e.draft)
}

const VIRTUAL_ID = "virtual:content"
const RESOLVED_ID = "\0" + VIRTUAL_ID

/**
 * `virtual:content` 모듈을 제공한다.
 * 글 메타데이터는 그대로 싣고, 본문은 글마다 lazy import로 분리한다.
 */
export function contentPlugin(): Plugin {
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
    configureServer(server) {
      // 글이 추가·삭제·수정되면 목록(frontmatter, URL)을 다시 만든다.
      const refresh = (file: string) => {
        if (!file.startsWith(CONTENT_DIR)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: "full-reload" })
      }
      server.watcher.on("add", refresh)
      server.watcher.on("unlink", refresh)
      server.watcher.on("change", refresh)
    },
  }
}
