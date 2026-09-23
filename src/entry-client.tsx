import { hydrate, render } from "solid-js/web"
import App from "./app/App.tsx"
import { findEntry } from "./lib/content.ts"

const root = document.getElementById("app")!

if (import.meta.env.DEV) {
  // dev 서버는 prerender된 HTML이 없으므로 그냥 렌더한다.
  render(() => <App />, root)
} else {
  // hydration 전에 현재 글의 본문 청크를 미리 받아둔다.
  // 그래야 서버가 만든 DOM과 같은 트리로 바로 hydrate된다.
  await findEntry(location.pathname)?.Component.preload()
  hydrate(() => <App />, root)
}
