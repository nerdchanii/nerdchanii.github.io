export const SITE_NAME = "chanii's notes"
export const SITE_URL = "https://nerdchanii.github.io"

export function formatDate(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  })
}
