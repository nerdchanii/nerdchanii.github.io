/**
 * RSS 2.0 피드. Quartz가 쓰던 경로(`/index.xml`)를 그대로 써서 기존 구독자가 이어서 받게 한다.
 */
import { SITE_NAME, SITE_URL } from "../src/lib/site.ts"

export const FEED_PATH = "/index.xml"

export type FeedItem = {
  url: string
  title: string
  date: string | null
  description: string | null
  tags: string[]
}

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const absolute = (url: string) => SITE_URL + encodeURI(url)

export function renderFeed(items: FeedItem[], description: string): string {
  const latest = items.find((item) => item.date)?.date
  const entries = items
    .map((item) => {
      const link = escapeXml(absolute(item.url))
      return [
        "    <item>",
        `      <title>${escapeXml(item.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        item.date ? `      <pubDate>${new Date(item.date).toUTCString()}</pubDate>` : "",
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
