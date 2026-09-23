/**
 * 라이트/다크 테마. 첫 페인트 전에 index.html의 인라인 스크립트가 `data-theme`을 정하고,
 * 여기서는 바꾸기만 한다. 서버가 그린 HTML은 테마를 모르므로 테마에 따라 달라지는 것은 CSS로만 표현한다.
 */
export type Theme = "light" | "dark"

const STORAGE_KEY = "theme"
export const THEME_EVENT = "themechange"

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light"
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // 저장소를 쓸 수 없는 환경(사생활 보호 모드 등)이면 이번 방문에만 적용한다.
  }
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }))
}
