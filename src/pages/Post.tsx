import { A, useNavigate } from "@solidjs/router"
import { createSignal, For, onCleanup, onMount, Show, Suspense } from "solid-js"
import { Dynamic } from "solid-js/web"
import Comments from "../components/Comments.tsx"
import Seo from "../components/Seo.tsx"
import PostList from "../components/PostList.tsx"
import TagList from "../components/TagList.tsx"
import { backlinks, entries, posts, type Entry } from "../lib/content.ts"
import { abortFlight, dismiss, flightPhase, fold, land, reducedMotion } from "../lib/flight.ts"
import { spineColor } from "../lib/shelf.ts"
import { dayOf, formatDate } from "../lib/site.ts"
import { togglePostView } from "../lib/view.ts"

/** 본문이 오기 전에 글줄 자리에 먼저 그어지는 선 */
function GhostLines() {
  const rows = Array.from({ length: 10 }, (_, i) => i)
  return (
    <svg class="ln ghost" viewBox="0 0 100 240" preserveAspectRatio="none" aria-hidden="true">
      <For each={rows}>
        {(i) => (
          <line
            pathLength="1"
            x1="0"
            y1={12 + i * 24}
            x2={i % 5 === 4 ? 55 : 82 + ((i * 37) % 18)}
            y2={12 + i * 24}
            style={{ "--d": `${i * 0.04}s` }}
          />
        )}
      </For>
    </svg>
  )
}

export default function Post(props: { entry: Entry }) {
  const entry = () => props.entry
  const isUnder = (url: string) => url.startsWith(`${entry().url}/`)

  // 폴더 index 페이지면 하위 폴더와 그 아래 글 목록을 같이 보여준다.
  const subfolders = () =>
    entries.filter(
      (e) => e.isIndex && isUnder(e.url) && !e.url.slice(entry().url.length + 1).includes("/"),
    )
  const children = () => posts.filter((p) => isUnder(p.url))
  const linkedFrom = () => backlinks(entry().url)
  const wasUpdated = () => entry().updated && dayOf(entry().updated) !== dayOf(entry().date)

  // 맨 위 폴더의 index(/notes 등)는 분류 이름이 곧 제목이라 라벨을 겹쳐 쓰지 않는다
  const sectionLabel = () =>
    entry().isIndex && entry().url === `/${entry().section}` ? "" : entry().section

  const navigate = useNavigate()
  let header!: HTMLElement
  let body!: HTMLDivElement
  let toc!: HTMLElement
  // 책장에서 뽑혀 오는 중이면, 책이 다 펼쳐질 때까지 내용을 비워 둔다
  const [landing, setLanding] = createSignal(false)
  const [hasToc, setHasToc] = createSignal(false)

  /** 지금 펼친 책 모양인지. 좁은 화면, 읽기 모드, 폴더 index에서는 평범한 글이다 (book.css) */
  const isBook = () => getComputedStyle(header).position === "sticky"

  onMount(() => {
    if (flightPhase() === "cover") {
      if (isBook()) {
        setLanding(true)
        void land(header, body).finally(() => setLanding(false))
      } else {
        // 책 모양이 아니면 펼칠 면이 없다. 표지를 흐려 없애고 글을 바로 보여 준다
        void dismiss()
      }
    }
    // 본문 맨 앞의 목차를 왼쪽 면으로 베낀다. 본문은 늦게 올 수 있어서 바뀔 때마다 다시 본다
    const copyToc = () => {
      const list = body.querySelector(".prose .toc ol")
      toc.innerHTML = list ? list.outerHTML : ""
      setHasToc(!!list)
    }
    copyToc()
    const watch = new MutationObserver(copyToc)
    watch.observe(body, { childList: true, subtree: true })
    onCleanup(() => watch.disconnect())
  })

  // 책을 펼치거나 덮는 도중에 방문자가 다른 곳으로 가면 겹을 걷는다.
  // 우리가 책장으로 옮길 때는 이미 "return"(책장을 기다림)이라서 걸리지 않는다
  onCleanup(() => {
    const phase = flightPhase()
    if (phase === "land" || phase === "fold") abortFlight()
  })

  /** 책을 덮어 책장으로 돌려보낸다 */
  function close(e: MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || reducedMotion())
      return
    // 좁은 화면이나 읽기 모드에서는 펼친 책이 아니므로 그냥 이동한다. 책이 아직 펼쳐지는 중일 때도 그렇다
    if (!isBook() || flightPhase() !== "idle") return
    e.preventDefault()
    void fold(
      header,
      body,
      {
        url: entry().url,
        title: entry().title,
        section: entry().section,
        color: spineColor(entry().url),
      },
      () => navigate("/blog"),
    )
  }

  return (
    <article
      class="post"
      classList={{ "is-book": !entry().isIndex, landing: landing(), "has-toc": hasToc() }}
      style={{ "--c": spineColor(entry().url) }}
    >
      <Seo
        title={entry().title}
        description={entry().description}
        path={entry().url}
        image={entry().image}
        article={
          entry().isIndex ? undefined : { published: entry().date, modified: entry().updated }
        }
      />

      <header class="post-header" ref={header}>
        <Show when={sectionLabel()}>
          <p class="eyebrow post-section">{sectionLabel()}</p>
        </Show>
        <h1>{entry().title}</h1>
        {/* 날짜가 없는 글(폴더 index 등)에는 빈 줄을 남기지 않는다 */}
        <Show when={entry().date || wasUpdated()}>
          <p class="post-meta">
            <Show when={entry().date}>
              <time datetime={entry().date!}>{formatDate(entry().date)}</time>
            </Show>
            <Show when={wasUpdated()}>
              <span>
                {" "}
                · 수정 <time datetime={entry().updated!}>{formatDate(entry().updated)}</time>
              </span>
            </Show>
          </p>
        </Show>
        <TagList tags={entry().tags} />
        <i class="post-rule" />
        <nav class="book-toc" ref={toc} aria-label="목차" />
        <Show when={!entry().isIndex}>
          <p class="book-tools">
            <A href="/blog" onClick={close}>
              ← 책장
            </A>
            <button type="button" onClick={togglePostView}>
              <span class="when-book">읽기 모드</span>
              <span class="when-plain">책으로 보기</span>
            </button>
          </p>
        </Show>
      </header>

      <div class="post-body" ref={body}>
        <div class="prose">
          <Suspense fallback={<GhostLines />}>
            <Dynamic component={entry().Component} />
          </Suspense>
        </div>

        <Show when={entry().isIndex}>
          <Show when={subfolders().length > 0}>
            <ul class="folder-list">
              <For each={subfolders()}>
                {(folder) => (
                  <li>
                    <A href={folder.url}>{folder.title}</A>
                  </li>
                )}
              </For>
            </ul>
          </Show>
          <PostList entries={children()} />
        </Show>

        <Show when={linkedFrom().length > 0}>
          <section class="backlinks">
            <h2>이 글을 링크한 글</h2>
            <PostList entries={linkedFrom()} />
          </section>
        </Show>

        <Show when={entry().comments}>
          <Comments path={entry().commentPath} />
        </Show>
      </div>
    </article>
  )
}
