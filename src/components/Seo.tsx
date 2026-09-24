import { Link, Meta, Title } from "@solidjs/meta"
import { Show } from "solid-js"
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "../lib/site.ts"

type Props = {
  /** 페이지 제목. 없으면 사이트 이름만 쓴다 */
  title?: string
  description?: string | null
  /** 사이트 안의 경로(`/blog`). 없으면 canonical·og:url을 넣지 않고 검색에서 뺀다 (404) */
  path?: string
  /** 절대 URL 또는 `/…` 경로 (이미 인코딩된 값) */
  image?: string | null
  article?: { published: string | null; modified: string | null }
}

/** 문서 제목, description, canonical, Open Graph, Twitter 카드 */
export default function Seo(props: Props) {
  const title = () => (props.title ? `${props.title} · ${SITE_NAME}` : SITE_NAME)
  const description = () => props.description ?? SITE_DESCRIPTION
  const url = () => (props.path ? SITE_URL + encodeURI(props.path) : undefined)
  const image = () => {
    const src = props.image ?? DEFAULT_OG_IMAGE
    return /^https?:\/\//.test(src) ? src : SITE_URL + src
  }

  return (
    <>
      <Title>{title()}</Title>
      <Meta name="description" content={description()} />
      <Show when={url()} fallback={<Meta name="robots" content="noindex" />}>
        {(href) => (
          <>
            <Link rel="canonical" href={href()} />
            <Meta property="og:url" content={href()} />
          </>
        )}
      </Show>
      <Meta property="og:site_name" content={SITE_NAME} />
      <Meta property="og:locale" content="ko_KR" />
      <Meta property="og:type" content={props.article ? "article" : "website"} />
      <Meta property="og:title" content={props.title ?? SITE_NAME} />
      <Meta property="og:description" content={description()} />
      <Meta property="og:image" content={image()} />
      <Meta name="twitter:card" content="summary_large_image" />
      <Meta name="twitter:title" content={props.title ?? SITE_NAME} />
      <Meta name="twitter:description" content={description()} />
      <Meta name="twitter:image" content={image()} />
      <Show when={props.article?.published}>
        {(date) => <Meta property="article:published_time" content={date()} />}
      </Show>
      <Show when={props.article?.modified}>
        {(date) => <Meta property="article:modified_time" content={date()} />}
      </Show>
    </>
  )
}
