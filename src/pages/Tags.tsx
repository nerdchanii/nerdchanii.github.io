import Seo from "../components/Seo.tsx"
import { A } from "@solidjs/router"
import { For } from "solid-js"
import { tags } from "../lib/content.ts"

export default function Tags() {
  return (
    <>
      <Seo title="Tags" description="태그 목록" path="/tags" />
      <header class="list-head">
        <p class="eyebrow">§ 2.1 — TAGS</p>
        <h1>Tags</h1>
        <p class="page-sub">글과 노트에 붙인 태그 {tags.length}개. 옆의 숫자는 글 수예요.</p>
      </header>
      <ul class="tag-list tag-cloud">
        <For each={tags}>
          {(tag) => (
            <li>
              <A href={`/tags/${tag.slug}`} class="tag">
                #{tag.name} <span class="tag-count">{tag.entries.length}</span>
              </A>
            </li>
          )}
        </For>
      </ul>
    </>
  )
}
