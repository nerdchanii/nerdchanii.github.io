import Seo from "../components/Seo.tsx"
import { A } from "@solidjs/router"
import { For } from "solid-js"
import { tags } from "../lib/content.ts"

export default function Tags() {
  return (
    <>
      <Seo title="Tags" description="태그 목록" path="/tags" />
      <h1>Tags</h1>
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
