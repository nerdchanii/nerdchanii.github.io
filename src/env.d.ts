/// <reference types="vite/client" />

declare module "virtual:content" {
  import type { Component } from "solid-js"

  export type Entry = {
    id: string
    url: string
    title: string
    section: string
    isIndex: boolean
    tags: string[]
    date: string | null
    updated: string | null
    description: string | null
    draft: boolean
    comments: boolean
    /** 예전 URL (리다이렉트 페이지로 출력) */
    aliases: string[]
    /** 이 글이 링크하는 다른 글의 URL */
    links: string[]
    /** 링크 미리보기 이미지 (절대 URL 또는 `/_media/…`) */
    image: string | null
    /** 댓글(giscus)을 이어 붙일 경로 (옮기기 전 URL이 있으면 그 경로) */
    commentPath: string
    /** 본문. 글마다 별도 청크로 lazy 로드된다. */
    Component: Component & { preload: () => Promise<unknown> }
  }

  export const entries: Entry[]
}

declare module "virtual:timeline" {
  type ItemText = { kind: string; title: string; desc?: string; preview?: string }

  export type TimelineItem = ItemText & {
    href?: string
    /** 글에서 온 항목이면 true */
    post?: boolean
    /** 글 날짜 (YYYY-MM-DD). 사건 항목에는 없다 */
    date?: string
    /** 영어 홈에서 바꿔 보여줄 값 */
    en?: Partial<ItemText>
  }

  export type TimelineYear = {
    year: number
    theme: string
    secret?: string
    en?: { theme?: string; secret?: string }
    items: TimelineItem[]
  }

  export const years: TimelineYear[]
}
