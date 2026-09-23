import { MetaProvider, Title } from "@solidjs/meta"
import { A, Route, Router, useLocation, type RouteSectionProps } from "@solidjs/router"
import { For, Show, Suspense } from "solid-js"
import ThemeToggle from "../components/ThemeToggle.tsx"
import { findEntry } from "../lib/content.ts"
import { AUTHOR, GITHUB_URL, NAV, SITE_NAME } from "../lib/site.ts"
import Blog from "../pages/Blog.tsx"
import Home from "../pages/Home.tsx"
import NotFound from "../pages/NotFound.tsx"
import Post from "../pages/Post.tsx"
import Tag from "../pages/Tag.tsx"
import Tags from "../pages/Tags.tsx"
import "katex/dist/katex.min.css"
import "../styles/global.css"

function Layout(props: RouteSectionProps) {
  return (
    <>
      <Title>{SITE_NAME}</Title>
      <header class="site-header">
        <A href="/" class="site-name" end>
          {SITE_NAME}
        </A>
        <nav class="site-nav" aria-label="주 메뉴">
          <For each={NAV}>{(item) => <A href={item.href}>{item.label}</A>}</For>
          <ThemeToggle />
        </nav>
      </header>
      <main class="site-main">
        <Suspense>{props.children}</Suspense>
      </main>
      <footer class="site-footer">
        <span>© {AUTHOR}</span>
        <a href={GITHUB_URL} rel="noopener">
          GitHub
        </a>
      </footer>
    </>
  )
}

/** 고정 라우트에 걸리지 않은 경로는 콘텐츠에서 찾고, 없으면 404 */
function ContentRoute() {
  const location = useLocation()
  const entry = () => findEntry(location.pathname)
  return (
    <Show when={entry()} fallback={<NotFound />} keyed>
      {(e) => <Post entry={e} />}
    </Show>
  )
}

export default function App(props: { url?: string }) {
  return (
    <MetaProvider>
      <Router url={props.url} root={Layout}>
        <Route path="/" component={Home} />
        <Route path="/blog" component={Blog} />
        <Route path="/tags" component={Tags} />
        <Route path="/tags/:tag" component={Tag} />
        <Route path="*" component={ContentRoute} />
      </Router>
    </MetaProvider>
  )
}
