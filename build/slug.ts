/**
 * URL 한 조각(폴더명·파일명·frontmatter slug)을 정규화한다.
 * 한글은 그대로 두고, 공백은 `-`로 바꾸며, URL에 문제가 되는 문자는 제거한다.
 * macOS에서 만든 파일명은 NFD(자모 분리)일 수 있으므로 NFC로 맞춘다.
 */
export function slugifySegment(segment: string): string {
  const slug = segment
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[?#%\\"'<>`^{}|]/g, "")

  // URL 조각은 그대로 dist/ 아래 경로가 되므로, 한 단계짜리 이름만 허용한다.
  // `.`으로 시작하는 이름(`..`, `.nojekyll` 등)도 막는다.
  // 모든 페이지는 `{경로}/index.html`로 저장되므로 `index.html`은 어느 단계에서도 쓸 수 없다.
  if (slug === "" || slug.startsWith(".") || slug.includes("/") || slug === "index.html") {
    throw new Error(`사용할 수 없는 slug: ${JSON.stringify(segment)}`)
  }
  return slug
}

/** `/a/b/` 형태의 경로를 `/a/b`로 맞춘다. 루트는 `/`. */
export function normalizePath(path: string): string {
  const trimmed = path.replace(/\/+$/, "")
  return trimmed === "" ? "/" : trimmed.startsWith("/") ? trimmed : `/${trimmed}`
}
