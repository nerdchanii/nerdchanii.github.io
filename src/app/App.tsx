import { MetaProvider, Title } from "@solidjs/meta"
import { A, Route, Router, useLocation, type RouteSectionProps } from "@solidjs/router"
import { createEffect, For, on, Show, Suspense } from "solid-js"
import ThemeToggle from "../components/ThemeToggle.tsx"
import { trackPageView } from "../lib/analytics.ts"
import { findEntry } from "../lib/content.ts"
import { counterpart, langOf, localize } from "../lib/i18n.ts"
import { canonicalPath } from "../lib/routes.ts"
import { AUTHOR, GITHUB_URL, NAV, SITE_NAME } from "../lib/site.ts"
import About from "../pages/About.tsx"
import Blog from "../pages/Blog.tsx"
import Home from "../pages/Home.tsx"
import NotFound from "../pages/NotFound.tsx"
import Notes from "../pages/Notes.tsx"
import Post from "../pages/Post.tsx"
import Tag from "../pages/Tag.tsx"
import Tags from "../pages/Tags.tsx"
import Work from "../pages/Work.tsx"
import "katex/dist/katex.min.css"
import "../styles/global.css"
import "../styles/line.css"
import "../styles/book.css"
import "../styles/daily-ai.css"

/** 넓은 레이아웃을 쓰는 소개 페이지. 글과 목록은 읽기 좋은 폭을 유지한다 */
const WIDE = new Set(["/", "/about", "/work", "/blog", "/notes", "/en", "/en/about", "/en/work"])

function Layout(props: RouteSectionProps) {
  // 첫 페이지와 클라이언트 이동마다 page_view를 보낸다. 제목(<Title>)이 바뀐 뒤에 읽도록 한 틱 미룬다.
  // effect는 브라우저에서만 돌기 때문에 prerender 결과에는 영향이 없다.
  const route = useLocation()
  // GitHub Pages는 `/work`를 `/work/`로 보내므로 끝의 `/` 등을 떼고 비교한다.
  const path = () => canonicalPath(route.pathname)
  const lang = () => langOf(path())
  createEffect(
    on(
      () => route.pathname,
      () => setTimeout(trackPageView),
    ),
  )
  // prerender가 `<html lang>`을 정하지만, 클라이언트 이동으로 언어가 바뀌면 여기서 맞춘다.
  createEffect(() => (document.documentElement.lang = lang()))

  return (
    <div class="shell" classList={{ wide: WIDE.has(path()) }}>
      <Title>{SITE_NAME}</Title>
      <header class="site-header">
        <A href={localize(lang(), "/")} class="site-name" end>
          {/* 사이트 표식: 차니의 얼굴 (곱슬머리와 둥근 안경). 파비콘(public/favicon.svg)과 같은 그림이다 */}
          <svg viewBox="0 0 32 32" aria-hidden="true" class="site-mark">
            <path d="M7.5 15 C7 22 11 27.5 16 27.5 C21 27.5 25 22 24.5 15.5 C24.5 14.5 23.5 13 22 13 C21 11.5 18 11 17 13.2 C16 12 13.5 12 12.5 13.5 C11.5 12.5 9 12.5 7.5 15 Z" />
            <path d="M7 15 C3.5 14.5 3 10.5 6 9.5 C5 6 9 4 11 5.5 C12 2.5 17 2 18.5 4.5 C21 2.5 25.5 4 25 7.5 C28.5 8 29 12.5 26 13.5 C26.5 15 25.5 15.5 24.5 15.5 C24.5 14.5 23.5 13 22 13 C21 11.5 18 11 17 13.2 C16 12 13.5 12 12.5 13.5 C11.5 12.5 9 12.5 7.5 15 Z" />
            <circle cx="12" cy="19.6" r="3.3" />
            <circle cx="20" cy="19.6" r="3.3" />
            <path class="open" d="M15.3 19.2 Q16 18.4 16.7 19.2" />
            <path class="open" d="M14.2 24.6 Q16 25.9 17.8 24.6" />
            <circle class="dot" cx="12.2" cy="19.8" r="1.1" />
            <circle class="dot" cx="19.8" cy="19.8" r="1.1" />
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
            href={counterpart(path())}
            class="lang-switch"
            hreflang={lang() === "ko" ? "en" : "ko"}
            aria-label={lang() === "ko" ? "Read in English" : "한국어로 보기"}
          >
            {lang() === "ko" ? "EN" : "KO"}
          </A>
          <ThemeToggle lang={lang()} />
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
        <Route path="/notes" component={Notes} />
        <Route path="/tags" component={Tags} />
        <Route path="/tags/:tag" component={Tag} />
        <Route path="*" component={ContentRoute} />
      </Router>
    </MetaProvider>
  )
}
