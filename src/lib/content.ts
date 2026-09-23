import { entries, type Entry } from "virtual:content"

export type { Entry }

const byUrl = new Map(entries.map((e) => [e.url, e]))

/** 폴더 index가 아닌 일반 글 목록 (최신순, 날짜 없는 글은 뒤로) */
export const posts: Entry[] = entries
  .filter((e) => !e.isIndex)
  .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))

/** 브라우저 pathname(퍼센트 인코딩)과 서버 경로 모두 받아서 글을 찾는다. */
export function findEntry(pathname: string): Entry | undefined {
  let decoded = pathname
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    // 잘못된 인코딩이면 원문 그대로 찾는다.
  }
  const normalized =
    decoded
      .normalize("NFC")
      .replace(/\/index\.html$/, "")
      .replace(/\/+$/, "") || "/"
  return byUrl.get(normalized)
}

/** prerender할 글 경로 전체 */
export function entryUrls(): string[] {
  return entries.map((e) => e.url)
}
