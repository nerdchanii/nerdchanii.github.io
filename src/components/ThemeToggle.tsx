import { currentTheme, setTheme } from "../lib/theme.ts"

/** 아이콘은 `[data-theme]`에 따라 CSS로 고른다. 서버 HTML과 hydration 결과가 늘 같다. */
export default function ThemeToggle() {
  return (
    <button
      type="button"
      class="theme-toggle"
      aria-label="라이트/다크 테마 전환"
      title="테마 전환"
      onClick={() => setTheme(currentTheme() === "dark" ? "light" : "dark")}
    >
      <span class="theme-icon-light" aria-hidden="true">
        ☀︎
      </span>
      <span class="theme-icon-dark" aria-hidden="true">
        ☾
      </span>
    </button>
  )
}
