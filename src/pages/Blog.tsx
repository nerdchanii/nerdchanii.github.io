import { For } from "solid-js"
import PostList from "../components/PostList.tsx"
import Seo from "../components/Seo.tsx"
import { posts, type Entry } from "../lib/content.ts"

/** 연도별로 묶는다. 날짜가 없는 글은 맨 뒤 "기타"에 둔다 */
function byYear(list: Entry[]): [string, Entry[]][] {
  const groups = new Map<string, Entry[]>()
  for (const entry of list) {
    const year = entry.date ? new Date(entry.date).getUTCFullYear().toString() : "기타"
    groups.set(year, [...(groups.get(year) ?? []), entry])
  }
  return [...groups]
}

export default function Blog() {
  return (
    <>
      <Seo title="Blog" description="전체 글 목록" path="/blog" />
      <h1>Blog</h1>
      <For each={byYear(posts)}>
        {([year, list]) => (
          <section class="year-group">
            <h2>{year}</h2>
            <PostList entries={list} />
          </section>
        )}
      </For>
    </>
  )
}
