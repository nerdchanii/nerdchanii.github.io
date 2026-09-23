import { Title } from "@solidjs/meta"
import { A } from "@solidjs/router"
import { For } from "solid-js"
import { tags } from "../lib/content.ts"
import { SITE_NAME } from "../lib/site.ts"

export default function Tags() {
  return (
    <>
      <Title>Tags · {SITE_NAME}</Title>
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
