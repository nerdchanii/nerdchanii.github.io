import { generateHydrationScript, getAssets, renderToString } from "solid-js/web"
import App from "./app/App.tsx"
import { entryUrls, findEntry } from "./lib/content.ts"
export { redirects } from "./lib/content.ts"
import { STATIC_ROUTES } from "./lib/routes.ts"

/** prerender 대상 경로. 고정 페이지 + 콘텐츠 전체 */
export function routes(): string[] {
  return [...STATIC_ROUTES, ...entryUrls()]
}

export async function render(url: string): Promise<{ html: string; head: string }> {
  // 본문 청크를 먼저 받아두면 lazy 컴포넌트가 동기로 렌더된다.
  await findEntry(url)?.Component.preload()

  // <Title>, <Meta> 같은 head 태그는 렌더 중에만 읽을 수 있다.
  // 트리 맨 끝에서 읽으면 앞에서 등록된 태그가 모두 모여 있다.
  let head = ""
  const html = renderToString(() => (
    <>
      <App url={url} />
      {(() => {
        head = getAssets()
        return ""
      })()}
    </>
  ))

  return { html, head: head + generateHydrationScript() }
}
