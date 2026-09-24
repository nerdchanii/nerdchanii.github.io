import { A } from "@solidjs/router"
import { For, Show } from "solid-js"
import { Dynamic } from "solid-js/web"
import Comments from "../components/Comments.tsx"
import Seo from "../components/Seo.tsx"
import PostList from "../components/PostList.tsx"
import TagList from "../components/TagList.tsx"
import { backlinks, entries, posts, type Entry } from "../lib/content.ts"
import { dayOf, formatDate } from "../lib/site.ts"

export default function Post(props: { entry: Entry }) {
  const entry = () => props.entry
  const isUnder = (url: string) => url.startsWith(`${entry().url}/`)

  // 폴더 index 페이지면 하위 폴더와 그 아래 글 목록을 같이 보여준다.
  const subfolders = () =>
    entries.filter(
      (e) => e.isIndex && isUnder(e.url) && !e.url.slice(entry().url.length + 1).includes("/"),
    )
  const children = () => posts.filter((p) => isUnder(p.url))
  const linkedFrom = () => backlinks(entry().url)
  const wasUpdated = () => entry().updated && dayOf(entry().updated) !== dayOf(entry().date)

  return (
    <article class="post">
      <Seo
        title={entry().title}
        description={entry().description}
        path={entry().url}
        image={entry().image}
        article={
          entry().isIndex ? undefined : { published: entry().date, modified: entry().updated }
        }
      />

      <header class="post-header">
        <h1>{entry().title}</h1>
        <p class="post-meta">
          <Show when={entry().date}>
            <time datetime={entry().date!}>{formatDate(entry().date)}</time>
          </Show>
          <Show when={wasUpdated()}>
            <span>
              {" "}
              · 수정 <time datetime={entry().updated!}>{formatDate(entry().updated)}</time>
            </span>
          </Show>
        </p>
        <TagList tags={entry().tags} />
      </header>

      <div class="prose">
        <Dynamic component={entry().Component} />
      </div>

      <Show when={entry().isIndex}>
        <Show when={subfolders().length > 0}>
          <ul class="folder-list">
            <For each={subfolders()}>
              {(folder) => (
                <li>
                  <A href={folder.url}>{folder.title}</A>
                </li>
              )}
            </For>
          </ul>
        </Show>
        <PostList entries={children()} />
      </Show>

      <Show when={linkedFrom().length > 0}>
        <section class="backlinks">
          <h2>이 글을 링크한 글</h2>
          <PostList entries={linkedFrom()} />
        </section>
      </Show>

      <Show when={entry().comments}>
        <Comments path={entry().commentPath} />
      </Show>
    </article>
  )
}
