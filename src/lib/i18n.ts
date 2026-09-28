/**
 * 소개 페이지(홈, About, Work)만 한국어와 영어로 나눈다. 글은 한국어 그대로 둔다.
 * 영어 페이지는 `/en` 아래에 있고, 나머지 경로는 모두 한국어다.
 */
export type Lang = "ko" | "en"

/** 두 언어로 제공하는 페이지. 이 경로들은 `/en` 짝이 있다 */
export const LOCALIZED_PATHS = ["/", "/about", "/work"] as const

export const langOf = (pathname: string): Lang =>
  pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ko"

/** 한국어 경로를 해당 언어의 경로로 바꾼다 (`/about` → `/en/about`) */
export const localize = (lang: Lang, path: string) =>
  lang === "ko" ? path : path === "/" ? "/en" : `/en${path}`

/** 지금 페이지의 다른 언어 짝. 짝이 없는 글 페이지에서는 그 언어의 홈으로 보낸다 */
export function counterpart(pathname: string): string {
  const lang = langOf(pathname)
  const base = lang === "en" ? pathname.replace(/^\/en/, "") || "/" : pathname
  const localized = (LOCALIZED_PATHS as readonly string[]).includes(base)
  const other: Lang = lang === "en" ? "ko" : "en"
  return localize(other, localized ? base : "/")
}
