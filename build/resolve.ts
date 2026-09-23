import path from "node:path"
import { CONTENT_DIR, listMediaFiles, loadContent, mediaUrl, type ContentEntry } from "./content.ts"

/** Obsidian식 `[[이름]]`, `![[파일]]`을 실제 URL로 바꾸는 조회기 */
export type Resolver = {
  /** 글 이름(파일명·경로·제목)으로 글을 찾는다 */
  page(target: string, fromFile: string): ContentEntry | undefined
  /** 파일 이름으로 미디어 파일을 찾아 공개 URL을 돌려준다 */
  media(name: string, fromFile: string): string | undefined
  /**
   * 일반 마크다운 링크의 상대 경로(`../other.md#제목`, `images/a.png`)를 글 기준으로 풀어 글이나 미디어를 찾는다.
   * 외부 URL, 사이트 절대 경로(`/…`), 같은 글 안의 `#제목`은 대상이 아니다.
   */
  resolve(href: string, fromFile: string): Resolved | undefined
}

export type Resolved =
  | { kind: "page"; entry: ContentEntry; query: string; hash: string | undefined }
  | { kind: "media"; url: string }

/** `https:`, `mailto:`, `//host`, `/path`, `#hash`처럼 글 기준 상대 경로가 아닌 링크 */
export const isNotRelative = (href: string) => /^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(href)

const norm = (s: string) => s.normalize("NFC").trim().toLowerCase()
const stripExt = (s: string) => s.replace(/\.mdx?$/i, "")

/**
 * 후보가 여러 개면 Obsidian처럼 링크한 글과 가까운 것을 고른다.
 * 같은 폴더 → 같은 폴더의 images/ → 경로가 짧은 순.
 */
function pickClosest(candidates: string[], fromDir: string): string | undefined {
  const rank = (rel: string) => {
    const dir = path.dirname(rel)
    if (dir === fromDir) return 0
    if (dir === path.join(fromDir, "images")) return 1
    return 2
  }
  return [...candidates].sort((a, b) => rank(a) - rank(b) || a.length - b.length)[0]
}

/** `entries`를 넘기면 그 목록으로, 아니면 content/를 새로 스캔해서 조회기를 만든다 */
export function createResolver(
  entries: ContentEntry[] = loadContent({ withDates: false }),
): Resolver {
  const media = listMediaFiles()
  const byId = new Map(entries.map((e) => [e.id, e]))
  const pageByPath = new Map(entries.map((e) => [norm(e.id), e]))
  const mediaByPath = new Map(media.map((rel) => [norm(rel), rel]))

  return {
    page(target, fromFile) {
      const fromDir = path.dirname(path.relative(CONTENT_DIR, fromFile))
      const wanted = norm(stripExt(target))
      const candidates = entries
        .filter((e) => {
          const id = norm(stripExt(e.id))
          const name = norm(path.basename(stripExt(e.id)))
          // 경로가 들어 있으면 경로 끝으로, 아니면 파일명이나 제목으로 찾는다.
          return wanted.includes("/")
            ? id === wanted || id.endsWith(`/${wanted}`)
            : name === wanted || norm(e.title) === wanted
        })
        .map((e) => e.id)
      const id = pickClosest(candidates, fromDir)
      return id ? byId.get(id) : undefined
    },
    media(name, fromFile) {
      const fromDir = path.dirname(path.relative(CONTENT_DIR, fromFile))
      const wanted = norm(name)
      const candidates = media.filter((rel) =>
        wanted.includes("/") ? norm(rel).endsWith(wanted) : norm(path.basename(rel)) === wanted,
      )
      const rel = pickClosest(candidates, fromDir)
      return rel ? mediaUrl(rel) : undefined
    },
    resolve(href, fromFile) {
      if (!href || isNotRelative(href)) return undefined
      const [, rawPath, rawQuery = "", rawHash] = href.match(/^([^?#]*)(\?[^#]*)?(?:#(.*))?$/) ?? []
      if (!rawPath) return undefined
      let target: string = rawPath
      let hash: string | undefined = rawHash
      try {
        target = decodeURIComponent(rawPath)
        hash = rawHash === undefined ? undefined : decodeURIComponent(rawHash)
      } catch {}
      if (!target) return undefined

      const fromDir = path.dirname(path.relative(CONTENT_DIR, fromFile))
      const rel = path.posix.normalize(path.posix.join(fromDir.split(path.sep).join("/"), target))
      if (rel.startsWith("../")) return undefined

      // 확장자 없이 쓴 링크(`[글](other)`)도 글로 본다.
      const entry =
        pageByPath.get(norm(rel)) ??
        pageByPath.get(norm(`${rel}.md`)) ??
        pageByPath.get(norm(`${rel}.mdx`))
      if (entry) return { kind: "page", entry, query: rawQuery, hash }
      // `images/a#1.png`처럼 파일명에 `#`이 그대로 들어간 경우도 받아 준다 (`%23`이 맞는 표기).
      // 미디어의 `?query`, `#t=30` 같은 꼬리는 쓴 그대로 붙여 준다.
      const file = mediaByPath.get(norm(rel))
      if (file) {
        const suffix = rawQuery + (rawHash === undefined ? "" : `#${rawHash}`)
        return { kind: "media", url: mediaUrl(file) + suffix }
      }
      const hashed = hash === undefined ? undefined : mediaByPath.get(norm(`${rel}#${hash}`))
      if (hashed) return { kind: "media", url: mediaUrl(hashed) }
      return undefined
    },
  }
}
