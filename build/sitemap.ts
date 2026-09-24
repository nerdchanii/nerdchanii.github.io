/**
 * sitemap.xml. Quartz가 쓰던 경로(`/sitemap.xml`)를 그대로 쓴다.
 */
import { SITE_URL } from "../src/lib/site.ts"

export const SITEMAP_PATH = "/sitemap.xml"

export type SitemapItem = { url: string; lastmod: string | null }

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

export function renderSitemap(items: SitemapItem[]): string {
  const urls = items
    .map(({ url, lastmod }) =>
      [
        "  <url>",
        `    <loc>${escapeXml(SITE_URL + encodeURI(url))}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
}
