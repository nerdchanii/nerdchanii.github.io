import { A } from "@solidjs/router"
import { For, Show } from "solid-js"
import { tagUrl } from "../lib/tags.ts"

export default function TagList(props: { tags: string[] }) {
  return (
    <Show when={props.tags.length > 0}>
      <ul class="tag-list">
        <For each={props.tags}>
          {(tag) => (
            <li>
              <A href={tagUrl(tag)} class="tag">
                #{tag}
              </A>
            </li>
          )}
        </For>
      </ul>
    </Show>
  )
}
