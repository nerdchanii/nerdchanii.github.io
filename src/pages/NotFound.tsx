import { Title } from "@solidjs/meta"
import { A } from "@solidjs/router"
import { SITE_NAME } from "../lib/site.ts"

export default function NotFound() {
  return (
    <>
      <Title>404 · {SITE_NAME}</Title>
      <h1>페이지를 찾을 수 없어요</h1>
      <p>
        <A href="/">홈으로 돌아가기</A>
      </p>
    </>
  )
}
