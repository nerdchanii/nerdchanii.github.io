import { Title } from "@solidjs/meta"
import PostList from "../components/PostList.tsx"
import { posts } from "../lib/content.ts"
import { SITE_NAME } from "../lib/site.ts"

export default function Blog() {
  return (
    <>
      <Title>Blog · {SITE_NAME}</Title>
      <h1>Blog</h1>
      <PostList entries={posts} />
    </>
  )
}
