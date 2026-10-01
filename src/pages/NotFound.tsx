import { A, useLocation } from "@solidjs/router"
import Cast from "../components/Cast.tsx"
import Seo from "../components/Seo.tsx"
import { langOf, localize } from "../lib/i18n.ts"

export default function NotFound() {
  const location = useLocation()
  const lang = () => langOf(location.pathname)
  const ko = () => lang() === "ko"
  return (
    <>
      <Seo title="404" description="페이지를 찾을 수 없습니다" />
      <div class="lost">
        <Cast who="jindo" height={150} />
        <header class="list-head">
          <p class="eyebrow">404 — NOT FOUND</p>
          <h1>{ko() ? "페이지를 찾을 수 없어요" : "Page not found"}</h1>
          <A href={localize(lang(), "/")} class="more">
            {ko() ? "홈으로 돌아가기" : "Back to home"}
          </A>
        </header>
      </div>
    </>
  )
}
