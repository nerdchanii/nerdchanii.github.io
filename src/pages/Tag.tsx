import { A, useParams } from "@solidjs/router"
import { Show } from "solid-js"
import PostList from "../components/PostList.tsx"
import Seo from "../components/Seo.tsx"
import { findTag } from "../lib/content.ts"
import NotFound from "./NotFound.tsx"

export default function Tag() {
  const params = useParams<{ tag: string }>()
  const tag = () => findTag(decodeURIComponent(params.tag))
  return (
    <Show when={tag()} fallback={<NotFound />} keyed>
      {(t) => (
        <>
          <Seo
            title={`#${t.name}`}
            description={`#${t.name} 태그가 붙은 글 ${t.entries.length}개`}
            path={`/tags/${t.slug}`}
          />
          <header class="list-head">
            <p class="eyebrow">§ 2.1 — TAG</p>
            <h1>#{t.name}</h1>
            <p class="page-sub">
              글 {t.entries.length}개. <A href="/tags">태그 전체 →</A>
            </p>
          </header>
          <PostList entries={t.entries} />
        </>
      )}
    </Show>
  )
}
