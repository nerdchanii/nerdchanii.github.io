import { hydrate, render } from "solid-js/web"
import App from "./app/App.tsx"
import { initAnalytics } from "./lib/analytics.ts"
import { findEntry } from "./lib/content.ts"

const root = document.getElementById("app")!

// 정적 호스트는 `/글/index.html`처럼 파일 경로로 들어와도 같은 페이지를 준다.
// 라우터와 글 목록은 `/글` 형태만 알므로, 주소를 먼저 맞춘 뒤 렌더한다.
const canonical = location.pathname.replace(/\/index\.html$/, "/")
if (canonical !== location.pathname) {
  history.replaceState(history.state, "", canonical + location.search + location.hash)
}

initAnalytics()

if (import.meta.env.DEV) {
  // dev 서버는 prerender된 HTML이 없으므로 그냥 렌더한다.
  render(() => <App />, root)
} else {
  // hydration 전에 현재 글의 본문 청크를 미리 받아둔다.
  // 그래야 서버가 만든 DOM과 같은 트리로 바로 hydrate된다.
  await findEntry(location.pathname)?.Component.preload()
  hydrate(() => <App />, root)
}
