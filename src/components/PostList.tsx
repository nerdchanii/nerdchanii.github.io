import { A } from "@solidjs/router"
import { For, Show } from "solid-js"
import { SECTION_LABEL, type Entry } from "../lib/content.ts"
import { formatDate } from "../lib/site.ts"
import styles from "./PostList.module.css"

export default function PostList(props: { entries: Entry[] }) {
  return (
    <ul class={styles.list}>
      <For each={props.entries}>
        {(entry) => (
          <li class={styles.item}>
            <A href={entry.url} class={styles.title}>
              {entry.title}
            </A>
            <span class={styles.meta}>
              {SECTION_LABEL[entry.section] ?? entry.section}
              <Show when={entry.date}> · {formatDate(entry.date)}</Show>
            </span>
          </li>
        )}
      </For>
    </ul>
  )
}
