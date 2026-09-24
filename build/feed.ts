/**
 * RSS 2.0 피드. Quartz가 쓰던 경로(`/index.xml`)를 그대로 써서 기존 구독자가 이어서 받게 한다.
 */
import { SITE_NAME, SITE_URL } from "../src/lib/site.ts"

export const FEED_PATH = "/index.xml"

export type FeedItem = {
  url: string
  /** GUID로 쓸 경로. 옮긴 글은 예전 주소(Quartz 피드의 GUID)를 넘긴다 */
  guidPath: string
  title: string
  date: string | null
  /** 마지막 수정일. 없으면 date */
  updated: string | null
  description: string | null
  tags: string[]
}

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const absolute = (url: string) => SITE_URL + encodeURI(url)

export function renderFeed(items: FeedItem[], description: string): string {
  // Quartz(defaultDateType: "modified")처럼 수정일을 피드 날짜로 써서, 글을 고치면 구독자에게도 반영되게 한다.
  const revised = (item: FeedItem) => item.updated ?? item.date
  const latest = items
    .map(revised)
    .filter((d): d is string => d !== null)
    .sort()
    .at(-1)
  // 고친 글도 최신 글과 함께 위로 올라오도록 수정일 순으로 둔다 (날짜 없는 글은 맨 뒤).
  const entries = [...items]
    .sort((a, b) => (revised(b) ?? "").localeCompare(revised(a) ?? "", "en"))
    .map((item) => {
      const link = escapeXml(absolute(item.url))
      const guid = escapeXml(absolute(item.guidPath))
      return [
        "    <item>",
        `      <title>${escapeXml(item.title)}</title>`,
        `      <link>${link}</link>`,
        guid === link
          ? `      <guid isPermaLink="true">${guid}</guid>`
          : `      <guid isPermaLink="false">${guid}</guid>`,
        revised(item) ? `      <pubDate>${new Date(revised(item)!).toUTCString()}</pubDate>` : "",
        item.description ? `      <description>${escapeXml(item.description)}</description>` : "",
        ...item.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n")
    })
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(description)}</description>
    <language>ko</language>
    <atom:link href="${absolute(FEED_PATH)}" rel="self" type="application/rss+xml"/>
${latest ? `    <lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>\n` : ""}${entries}
  </channel>
</rss>
`
}
