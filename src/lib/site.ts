/**
 * 사이트 이름, 주소, 링크, 외부 서비스 ID는 저장소 루트의 site.config.json에서 읽는다.
 * 값만 바꿀 때는 그 파일만 고치면 된다.
 */
import config from "../../site.config.json" with { type: "json" }

export const SITE_NAME = config.name
export const SITE_URL = config.url
export const AUTHOR = config.author
export const SITE_DESCRIPTION = config.description
/** 글에 이미지가 없을 때 쓰는 링크 미리보기 이미지 (public 기준 경로) */
export const DEFAULT_OG_IMAGE = config.ogImage
export const GITHUB_URL = config.links.github
/** 비어 있으면 방의 LinkedIn 표지판이 "곧 걸어 둘게요"로 보인다 */
export const LINKEDIN_URL = config.links.linkedin

/**
 * 헤더 메뉴. `localized`인 항목은 영어 페이지에서 `/en` 경로로 바뀐다.
 * Writing(글 목록)은 한국어 글만 있으므로 언어와 상관없이 같은 경로다.
 */
export const NAV = [
  { href: "/work", label: "Work", key: "01", localized: true },
  { href: "/blog", label: "Writing", key: "02", localized: false },
  { href: "/notes", label: "Notes", key: "03", localized: false },
  { href: "/about", label: "About", key: "04", localized: true },
]

/** Google Analytics 4 측정 ID. 빈 문자열이면 끈다. */
export const GA_TAG_ID = config.analytics.gaTagId

/** giscus 설정. 저장소의 Discussions에 댓글이 쌓인다. */
export const GISCUS = config.giscus

export function formatDate(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  })
}

/** 서울 기준 날짜(YYYY-MM-DD). 작성일과 수정일이 같은 날인지 비교할 때 쓴다 */
export function dayOf(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" })
}
