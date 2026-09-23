export const SITE_NAME = "chanii's notes"
export const SITE_URL = "https://nerdchanii.github.io"
export const AUTHOR = "김예찬"
export const GITHUB_URL = "https://github.com/nerdchanii"
export const SITE_DESCRIPTION = "AI와 머신러닝을 공부하며 남기는 기록"
/** 글에 이미지가 없을 때 쓰는 링크 미리보기 이미지 (public/og.png) */
export const DEFAULT_OG_IMAGE = "/og.png"

/** 헤더 메뉴 */
export const NAV = [
  { href: "/blog", label: "Blog" },
  { href: "/notes", label: "Notes" },
  { href: "/projects", label: "Projects" },
  { href: "/tags", label: "Tags" },
]

/** Google Analytics 4 측정 ID. Quartz 시절과 같다. 빈 문자열로 두면 끈다. */
export const GA_TAG_ID = "G-P68QDJ67M0"

/** giscus 설정. 저장소의 Discussions(Announcements)에 댓글이 쌓인다. */
export const GISCUS = {
  repo: "nerdchanii/nerdchanii.github.io",
  repoId: "R_kgDOP1UnAw",
  category: "Announcements",
  categoryId: "DIC_kwDOP1UnA84CzHKQ",
}

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
