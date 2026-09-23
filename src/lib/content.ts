import { entries, type Entry } from "virtual:content"
import { tagSlug } from "./tags.ts"

/** ISO 날짜 문자열 비교. localeCompare는 실행 환경의 로캘을 따르므로 서버와 브라우저에서 결과가 같도록 코드 포인트로 비교한다 */
const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

export type { Entry }
export { entries }

const byUrl = new Map(entries.map((e) => [e.url, e]))

/** 폴더 index가 아닌 일반 글 목록 (최신순, 날짜 없는 글은 뒤로) */
export const posts: Entry[] = entries
  .filter((e) => !e.isIndex)
  .sort((a, b) => compareText(b.date ?? "", a.date ?? ""))

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

/** 예전 URL → 현재 URL. prerender가 리다이렉트 페이지로 출력한다 */
export function redirects(): [from: string, to: string][] {
  return entries.flatMap((e) => e.aliases.map((alias): [string, string] => [alias, e.url]))
}

/** 이 글을 링크하는 다른 글 */
export function backlinks(url: string): Entry[] {
  return entries.filter((e) => e.links.includes(url))
}

export type Tag = { slug: string; name: string; entries: Entry[] }

/** 태그 목록 (글 수가 많은 순). 폴더 index에 붙은 태그도 포함한다 */
export const tags: Tag[] = (() => {
  const bySlug = new Map<string, Tag>()
  const dated = [...entries].sort((a, b) => compareText(b.date ?? "", a.date ?? ""))
  for (const entry of dated) {
    for (const name of entry.tags) {
      const slug = tagSlug(name)
      if (!slug) continue
      const tag = bySlug.get(slug) ?? { slug, name, entries: [] }
      if (!tag.entries.includes(entry)) tag.entries.push(entry)
      bySlug.set(slug, tag)
    }
  }
  return [...bySlug.values()].sort(
    (a, b) => b.entries.length - a.entries.length || a.name.localeCompare(b.name, "ko-KR"),
  )
})()

export const findTag = (slug: string) => tags.find((t) => t.slug === tagSlug(slug))
