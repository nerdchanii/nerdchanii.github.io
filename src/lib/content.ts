import { entries, type Entry } from "virtual:content"
import { canonicalPath } from "./routes.ts"
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

/** 노트가 들어 있는 폴더. 여기 있는 글은 Notes(/notes)에, 나머지는 Writing(/blog)에 꽂는다 */
export const NOTES_SECTION = "notes"

/** Writing: 한 편으로 끝나는 글 (조사 기록, 회고) */
export const writing: Entry[] = posts.filter((p) => p.section !== NOTES_SECTION)

/** Notes: 주제별로 이어 쓰는 공부 노트와 읽기 노트 */
export const notes: Entry[] = posts.filter((p) => p.section === NOTES_SECTION)

/** 글 목록에 보이는 분류 이름. 없는 폴더는 폴더 이름 그대로 쓴다 */
export const SECTION_LABEL: Record<string, string> = {
  devlog: "조사 기록",
  projects: "회고",
  notes: "노트",
}

export type Topic = { url: string; title: string; entries: Entry[] }

/**
 * 노트를 주제별로 묶는다. 주제는 위로 올라가며 처음 만나는 폴더 index다 (lib/graph.ts와 같은 규칙).
 * 노트가 많은 주제부터 놓고, 주제 안의 노트는 쓴 순서대로 둔다 (시리즈는 01, 02 차례가 된다).
 */
export const topics: Topic[] = (() => {
  const indexes = new Map(entries.filter((e) => e.isIndex).map((e) => [e.url, e]))
  const topicOf = (url: string) => {
    const parent = url.slice(0, url.lastIndexOf("/"))
    for (let at = parent; at; at = at.slice(0, at.lastIndexOf("/"))) {
      if (indexes.has(at)) return at
    }
    return parent
  }
  const byUrl = new Map<string, Entry[]>()
  for (const note of notes) {
    const key = topicOf(note.url)
    byUrl.set(key, [...(byUrl.get(key) ?? []), note])
  }
  return [...byUrl]
    .map(([url, list]) => ({
      url,
      title: indexes.get(url)?.title ?? (url.split("/").pop() || url),
      entries: [...list].sort(
        (a, b) => compareText(a.date ?? "", b.date ?? "") || compareText(a.url, b.url),
      ),
    }))
    .sort((a, b) => b.entries.length - a.entries.length || compareText(a.url, b.url))
})()

/** 브라우저 pathname(퍼센트 인코딩)과 서버 경로 모두 받아서 글을 찾는다. */
export function findEntry(pathname: string): Entry | undefined {
  return byUrl.get(canonicalPath(pathname))
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
