import { MetaProvider, Title } from "@solidjs/meta"
import { A, Route, Router, useLocation, type RouteSectionProps } from "@solidjs/router"
import { createEffect, For, on, Show, Suspense } from "solid-js"
import ThemeToggle from "../components/ThemeToggle.tsx"
import { trackPageView } from "../lib/analytics.ts"
import { findEntry } from "../lib/content.ts"
import { counterpart, langOf, localize } from "../lib/i18n.ts"
import { AUTHOR, GITHUB_URL, NAV, SITE_NAME } from "../lib/site.ts"
import About from "../pages/About.tsx"
import Blog from "../pages/Blog.tsx"
import Home from "../pages/Home.tsx"
import NotFound from "../pages/NotFound.tsx"
import Post from "../pages/Post.tsx"
import Tag from "../pages/Tag.tsx"
import Tags from "../pages/Tags.tsx"
import Work from "../pages/Work.tsx"
import "katex/dist/katex.min.css"
import "../styles/global.css"

/** 넓은 레이아웃을 쓰는 소개 페이지. 글과 목록은 읽기 좋은 폭을 유지한다 */
const WIDE = new Set(["/", "/about", "/work", "/en", "/en/about", "/en/work"])

function Layout(props: RouteSectionProps) {
  // 첫 페이지와 클라이언트 이동마다 page_view를 보낸다. 제목(<Title>)이 바뀐 뒤에 읽도록 한 틱 미룬다.
  // effect는 브라우저에서만 돌기 때문에 prerender 결과에는 영향이 없다.
  const route = useLocation()
  const lang = () => langOf(route.pathname)
  createEffect(
    on(
      () => route.pathname,
      () => setTimeout(trackPageView),
    ),
  )
  // prerender가 `<html lang>`을 정하지만, 클라이언트 이동으로 언어가 바뀌면 여기서 맞춘다.
  createEffect(() => (document.documentElement.lang = lang()))

  return (
    <div class="shell" classList={{ wide: WIDE.has(route.pathname) }}>
      <Title>{SITE_NAME}</Title>
      <header class="site-header">
        <A href={localize(lang(), "/")} class="site-name" end>
          <svg viewBox="0 0 16 16" aria-hidden="true" class="site-mark">
            <rect x="1.5" y="1.5" width="13" height="13" fill="none" stroke="currentColor" />
            <circle cx="8" cy="8" r="2.5" fill="currentColor" />
          </svg>
          <span>NERDCHANII</span>
        </A>
        <nav class="site-nav" aria-label={lang() === "ko" ? "주 메뉴" : "Main menu"}>
          <For each={NAV}>
            {(item) => (
              <A href={item.localized ? localize(lang(), item.href) : item.href}>
                <span class="nav-key">{item.key}</span>
                {item.label}
              </A>
            )}
          </For>
          <A
            href={counterpart(route.pathname)}
            class="lang-switch"
            hreflang={lang() === "ko" ? "en" : "ko"}
            aria-label={lang() === "ko" ? "Read in English" : "한국어로 보기"}
          >
            {lang() === "ko" ? "EN" : "KO"}
          </A>
          <ThemeToggle />
        </nav>
      </header>
      <main class="site-main">
        <Suspense>{props.children}</Suspense>
      </main>
      <footer class="site-footer">
        <span>
          © {AUTHOR} <span class="footer-dim">· nerdchanii</span>
        </span>
        <span class="footer-links">
          <a href={GITHUB_URL} rel="noopener">
            GitHub
          </a>
          <a href="/index.xml">RSS</a>
          <A href="/tags">Tags</A>
        </span>
      </footer>
    </div>
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
        <Route path="/" component={() => <Home lang="ko" />} />
        <Route path="/about" component={() => <About lang="ko" />} />
        <Route path="/work" component={() => <Work lang="ko" />} />
        <Route path="/en" component={() => <Home lang="en" />} />
        <Route path="/en/about" component={() => <About lang="en" />} />
        <Route path="/en/work" component={() => <Work lang="en" />} />
        <Route path="/blog" component={Blog} />
        <Route path="/tags" component={Tags} />
        <Route path="/tags/:tag" component={Tag} />
        <Route path="*" component={ContentRoute} />
      </Router>
    </MetaProvider>
  )
}
