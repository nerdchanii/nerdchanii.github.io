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
    description: string | null
    draft: boolean
    comments: boolean
    /** 본문. 글마다 별도 청크로 lazy 로드된다. */
    Component: Component & { preload: () => Promise<unknown> }
  }

  export const entries: Entry[]
}
