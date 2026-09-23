import { Title } from "@solidjs/meta"
import { useParams } from "@solidjs/router"
import { Show } from "solid-js"
import PostList from "../components/PostList.tsx"
import { findTag } from "../lib/content.ts"
import { SITE_NAME } from "../lib/site.ts"
import NotFound from "./NotFound.tsx"

export default function Tag() {
  const params = useParams<{ tag: string }>()
  const tag = () => findTag(decodeURIComponent(params.tag))
  return (
    <Show when={tag()} fallback={<NotFound />} keyed>
      {(t) => (
        <>
          <Title>
            #{t.name} · {SITE_NAME}
          </Title>
          <h1>#{t.name}</h1>
          <PostList entries={t.entries} />
        </>
      )}
    </Show>
  )
}
