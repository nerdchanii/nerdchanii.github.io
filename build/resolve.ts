import path from "node:path"
import { CONTENT_DIR, listMediaFiles, loadContent, mediaUrl, type ContentEntry } from "./content.ts"

/** Obsidian식 `[[이름]]`, `![[파일]]`을 실제 URL로 바꾸는 조회기 */
export type Resolver = {
  /** 글 이름(파일명·경로·제목)으로 글을 찾는다 */
  page(target: string, fromFile: string): ContentEntry | undefined
  /** 파일 이름으로 미디어 파일을 찾아 공개 URL을 돌려준다 */
  media(name: string, fromFile: string): string | undefined
}

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

export function createResolver(): Resolver {
  const entries = loadContent({ withDates: false })
  const media = listMediaFiles()
  const byId = new Map(entries.map((e) => [e.id, e]))

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
  }
}
