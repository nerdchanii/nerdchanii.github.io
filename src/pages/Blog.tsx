import { A } from "@solidjs/router"
import { For } from "solid-js"
import PostList from "../components/PostList.tsx"
import Shelf, { type ShelfRow } from "../components/Shelf.tsx"
import Seo from "../components/Seo.tsx"
import { writing, type Entry } from "../lib/content.ts"
import { dayOf } from "../lib/site.ts"

/** 연도별로 묶는다. 화면의 날짜와 같이 서울 기준 연도를 쓰고, 날짜가 없는 글은 맨 뒤 "기타"에 둔다 */
function byYear(list: Entry[]): ShelfRow[] {
  const groups = new Map<string, Entry[]>()
  for (const entry of list) {
    const year = entry.date ? dayOf(entry.date).slice(0, 4) : "기타"
    groups.set(year, [...(groups.get(year) ?? []), entry])
  }
  return [...groups].map(([label, entries]) => ({ label, entries }))
}

/** Writing: 한 편으로 끝나는 글. 노트는 /notes에 따로 꽂는다 */
export default function Blog() {
  const rows = byYear(writing)
  return (
    <>
      <Seo
        title="Writing"
        description="조사 기록과 회고처럼 한 편으로 끝나는 글을 연도별로 모았습니다."
        path="/blog"
      />
      <header class="list-head">
        <p class="eyebrow">§ 2 — WRITING</p>
        <h1>Writing</h1>
        <p class="page-sub">
          조사 기록과 회고처럼 한 편으로 끝나는 글을 연도별로 모았습니다. 공부하며 이어 쓰는 노트는{" "}
          <A href="/notes">Notes</A>에 따로 꽂아 두었어요. <A href="/tags">태그로 보기 →</A>
        </p>
      </header>
      <Shelf rows={rows} />
      {/* 책장은 넓게, 그 아래 목록은 읽기 좋은 폭으로 */}
      <div class="list-narrow">
        <For each={rows}>
          {(row) => (
            <section class="year-group">
              <h2>{row.label}</h2>
              <PostList entries={row.entries} />
            </section>
          )}
        </For>
      </div>
    </>
  )
}
