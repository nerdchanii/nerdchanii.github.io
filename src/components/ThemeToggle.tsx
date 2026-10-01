import type { Lang } from "../lib/i18n.ts"
import { currentTheme, setTheme } from "../lib/theme.ts"

/** 아이콘은 `[data-theme]`에 따라 CSS로 고른다. 서버 HTML과 hydration 결과가 늘 같다. */
export default function ThemeToggle(props: { lang?: Lang }) {
  const ko = () => props.lang !== "en"
  return (
    <button
      type="button"
      class="theme-toggle"
      aria-label={ko() ? "라이트/다크 테마 전환" : "Switch light/dark theme"}
      title={ko() ? "테마 전환" : "Theme"}
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
