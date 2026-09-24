import { onCleanup, onMount } from "solid-js"
import { GISCUS } from "../lib/site.ts"
import { THEME_EVENT, currentTheme, type Theme } from "../lib/theme.ts"

/**
 * giscus 댓글. 브라우저에서만 스크립트를 붙이므로 서버 HTML에는 빈 영역만 있다.
 *
 * Quartz 시절에는 `pathname` 매핑이라 토론 제목이 그때의 경로(퍼센트 인코딩, 앞 `/` 제외)였다.
 * URL이 바뀐 글도 기존 댓글을 찾도록 `specific` 매핑에 같은 형식의 문자열을 직접 넘긴다.
 */
export default function Comments(props: { path: string }) {
  let container!: HTMLDivElement

  onMount(() => {
    const script = document.createElement("script")
    const attrs: Record<string, string> = {
      repo: GISCUS.repo,
      "repo-id": GISCUS.repoId,
      category: GISCUS.category,
      "category-id": GISCUS.categoryId,
      mapping: "specific",
      term: encodeURI(props.path).slice(1) || "index",
      strict: "0",
      "reactions-enabled": "1",
      "emit-metadata": "0",
      "input-position": "top",
      theme: currentTheme(),
      lang: "ko",
      loading: "lazy",
    }
    for (const [key, value] of Object.entries(attrs)) script.setAttribute(`data-${key}`, value)
    script.src = "https://giscus.app/client.js"
    script.async = true
    script.crossOrigin = "anonymous"
    container.appendChild(script)

    // 사이트 테마를 바꾸면 이미 떠 있는 giscus iframe에도 알린다.
    const onTheme = (event: Event) => {
      const theme = (event as CustomEvent<Theme>).detail
      container
        .querySelector<HTMLIFrameElement>("iframe.giscus-frame")
        ?.contentWindow?.postMessage({ giscus: { setConfig: { theme } } }, "https://giscus.app")
    }
    window.addEventListener(THEME_EVENT, onTheme)
    onCleanup(() => window.removeEventListener(THEME_EVENT, onTheme))
  })

  return (
    <section class="comments" aria-label="댓글">
      <div ref={container} />
    </section>
  )
}
