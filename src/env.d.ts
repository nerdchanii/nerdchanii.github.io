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
    /** 댓글(giscus)을 이어 붙일 경로 (옮기기 전 URL이 있으면 그 경로) */
    commentPath: string
    /** 본문. 글마다 별도 청크로 lazy 로드된다. */
    Component: Component & { preload: () => Promise<unknown> }
  }

  export const entries: Entry[]
}
