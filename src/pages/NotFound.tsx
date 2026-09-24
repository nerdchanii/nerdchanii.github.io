import Seo from "../components/Seo.tsx"
import { A } from "@solidjs/router"

export default function NotFound() {
  return (
    <>
      <Seo title="404" description="페이지를 찾을 수 없습니다" />
      <h1>페이지를 찾을 수 없어요</h1>
      <p>
        <A href="/">홈으로 돌아가기</A>
      </p>
    </>
  )
}
