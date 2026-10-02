import { A } from "@solidjs/router"
import { For } from "solid-js"
import NoteGraph from "../components/NoteGraph.tsx"
import PostList from "../components/PostList.tsx"
import Seo from "../components/Seo.tsx"
import Shelf from "../components/Shelf.tsx"
import { entries, NOTES_SECTION, topics } from "../lib/content.ts"

/** 연결 그림에 넘길 노트와 그 폴더 index (묶음 이름을 index 제목에서 읽는다) */
const inNotes = entries.filter((e) => e.url.startsWith(`/${NOTES_SECTION}/`))

/** Notes: 주제별 서가. 같은 주제의 노트를 한 칸에 쓴 순서대로 꽂는다 */
export default function Notes() {
  const rows = topics.map((t) => ({ label: t.title, href: t.url, entries: t.entries }))
  return (
    <>
      <Seo
        title="Notes"
        description="공부하면서 정리하고, 책을 읽으며 남긴 노트를 주제별로 모았습니다."
        path="/notes"
      />
      <header class="list-head">
        <p class="eyebrow">§ 3 — NOTES</p>
        <h1>Notes</h1>
        <p class="page-sub">
          공부하면서 정리하고, 책을 읽으며 남긴 노트를 주제별로 꽂아 두었습니다. 한 편으로 끝나는
          글은 <A href="/blog">Writing</A>에 있어요.
        </p>
      </header>
      <Shelf rows={rows} topics />
      <section class="note-links">
        <h2 class="eyebrow">LINKS</h2>
        <NoteGraph entries={inNotes} />
      </section>
      <div class="list-narrow">
        <For each={topics}>
          {(topic) => (
            <section class="year-group">
              <h2>
                <A href={topic.url}>{topic.title}</A> · {topic.entries.length}편
              </h2>
              <PostList entries={topic.entries} />
            </section>
          )}
        </For>
      </div>
    </>
  )
}
