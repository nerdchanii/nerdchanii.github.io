import { A } from "@solidjs/router"
import PostList from "../components/PostList.tsx"
import Seo from "../components/Seo.tsx"
import { posts } from "../lib/content.ts"

export default function Home() {
  return (
    <>
      <Seo path="/" />
      <section class="intro">
        <h1>Hi, there!</h1>
        <p>AI와 머신러닝을 공부하고 있는 김예찬입니다.</p>
      </section>
      <section>
        <h2>최근 글</h2>
        <PostList entries={posts.slice(0, 5)} />
        <p>
          <A href="/blog">전체 글 보기 →</A>
        </p>
      </section>
    </>
  )
}
