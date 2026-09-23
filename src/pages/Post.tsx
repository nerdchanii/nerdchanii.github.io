import { Meta, Title } from "@solidjs/meta"
import { Show } from "solid-js"
import { Dynamic } from "solid-js/web"
import PostList from "../components/PostList.tsx"
import { posts, type Entry } from "../lib/content.ts"
import { SITE_NAME, formatDate } from "../lib/site.ts"

export default function Post(props: { entry: Entry }) {
  const entry = () => props.entry
  // 폴더 index 페이지면 그 폴더 아래 글 목록을 같이 보여준다.
  const children = () => posts.filter((p) => p.url.startsWith(`${entry().url}/`))

  return (
    <article>
      <Title>
        {entry().title} · {SITE_NAME}
      </Title>
      <Show when={entry().description}>
        {(description) => <Meta name="description" content={description()} />}
      </Show>

      <header class="post-header">
        <h1>{entry().title}</h1>
        <Show when={entry().date}>
          <time datetime={entry().date!}>{formatDate(entry().date)}</time>
        </Show>
      </header>

      <div class="prose">
        <Dynamic component={entry().Component} />
      </div>

      <Show when={entry().isIndex}>
        <PostList entries={children()} />
      </Show>
    </article>
  )
}
