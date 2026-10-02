import { A, useNavigate } from "@solidjs/router"
import { For, onCleanup, onMount, Show } from "solid-js"
import type { Entry } from "../lib/content.ts"
import { arm, play } from "../lib/draw.ts"
import { abortFlight, flightPhase, flightUrl, pull, reducedMotion, shelve } from "../lib/flight.ts"
import { spineColor, spineSize } from "../lib/shelf.ts"

/** 선반 한 칸. Writing은 한 해, Notes는 한 주제다. `href`가 있으면 칸 이름이 그곳으로 가는 링크가 된다 */
export type ShelfRow = { label: string; href?: string; entries: Entry[] }

/**
 * 책장. 선반 한 칸에 책을 꽂고, 책 한 권이 글 하나다.
 * 책은 그 글로 가는 링크라서 스크립트 없이도 눌린다. 스크립트가 있으면 책이 빠져나와 펼쳐진 뒤에 옮겨 간다.
 * `topics`면 칸 이름이 연도보다 길어서 책을 조금 더 오른쪽부터 꽂는다 (book.css).
 */
export default function Shelf(props: { rows: ShelfRow[]; topics?: boolean }) {
  const navigate = useNavigate()
  let root!: HTMLDivElement

  onMount(() => {
    const returning = flightPhase() === "return"
    if (returning) {
      // 글에서 돌아오는 길: 책장은 이미 서 있고, 책 한 권만 제자리에 내려앉는다
      const url = flightUrl()
      void shelve(() =>
        [...root.querySelectorAll<HTMLElement>(".book")].find((el) => el.dataset.url === url),
      )
      return
    }
    arm(root)
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        play(root)
      },
      { threshold: 0.15 },
    )
    io.observe(root)
    onCleanup(() => io.disconnect())
  })

  // 책을 뽑거나 꽂는 도중에 방문자가 다른 곳으로 가면 겹을 걷는다.
  // 우리가 글로 옮길 때는 이미 "cover"(글 페이지를 기다림)라서 걸리지 않는다
  onCleanup(() => {
    const phase = flightPhase()
    if (phase === "pull" || phase === "shelve") abortFlight()
  })

  /** 앞 선반들에 꽂힌 책 수. 책이 떨어지는 차례를 매길 때 쓴다 */
  const before = (row: number) => props.rows.slice(0, row).reduce((n, r) => n + r.entries.length, 0)

  function open(entry: Entry, e: MouseEvent & { currentTarget: HTMLAnchorElement }) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || reducedMotion())
      return
    // 다른 책이 이미 움직이는 중이면 평범한 링크로 둔다 (화면이 바뀌면서 그 겹은 걷힌다)
    if (flightPhase() !== "idle") return
    e.preventDefault()
    void pull(
      e.currentTarget,
      {
        url: entry.url,
        title: entry.title,
        section: entry.section,
        color: spineColor(entry.url),
      },
      () => navigate(entry.url),
    )
  }

  return (
    <div class="shelf" classList={{ topics: props.topics }} ref={root}>
      <svg
        class="ln shelf-frame"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 100 V0 H100 V100" />
      </svg>
      <svg
        class="ln shelf-frame inner"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path class="soft" d="M0 100 V0 H100 V100" />
      </svg>
      <For each={props.rows}>
        {(shelf, row) => (
          <section class="shelf-row">
            <h2 class="shelf-year">
              <Show when={shelf.href} fallback={shelf.label}>
                {(href) => <A href={href()}>{shelf.label}</A>}
              </Show>
            </h2>
            <div class="shelf-books">
              <For each={shelf.entries}>
                {(entry, i) => {
                  const { w, h } = spineSize(entry)
                  // 책이 많아도 기다리는 시간이 늘어지지 않게 차례에 끝을 둔다
                  const turn = Math.min(before(row()) + i(), 30)
                  return (
                    <A
                      href={entry.url}
                      class="book"
                      data-url={entry.url}
                      data-nodraw
                      style={{
                        "--w": `${w}px`,
                        "--h": `${h}px`,
                        "--c": spineColor(entry.url),
                        "--d": `${(0.9 + turn * 0.06).toFixed(2)}s`,
                      }}
                      onClick={[open, entry]}
                    >
                      <span class="book-in">
                        <svg
                          class="ln"
                          viewBox={`0 0 ${w} ${h}`}
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <rect x="0" y="0" width={w} height={h} />
                          <line class="band" x1="3" y1="9" x2={w - 3} y2="9" />
                          <line class="band" x1="3" y1={h - 9} x2={w - 3} y2={h - 9} />
                        </svg>
                        <span class="book-title">{entry.title}</span>
                      </span>
                    </A>
                  )
                }}
              </For>
              <Show when={row() === 0}>
                <span class="shelf-deco">
                  <Plant />
                </span>
              </Show>
              <Show when={row() === 1}>
                <span class="shelf-deco">
                  <Mug />
                </span>
              </Show>
            </div>
          </section>
        )}
      </For>
    </div>
  )
}

function Plant() {
  return (
    <svg class="ln" viewBox="700 146 106 126" width="106" height="126" aria-hidden="true">
      <path d="M726 270 L732 232 L776 232 L782 270 Z" />
      <line class="soft" x1="728" y1="244" x2="780" y2="244" />
      <path d="M754 232 C750 200 730 180 706 176 C712 198 730 214 754 232" />
      <path d="M754 232 C758 196 776 170 800 164 C798 192 780 214 754 232" />
      <path d="M754 232 C752 206 756 180 762 150" />
      <path d="M762 150 C772 160 776 176 770 192 C764 184 760 166 762 150" />
    </svg>
  )
}

function Mug() {
  return (
    <svg class="ln" viewBox="740 438 52 64" width="52" height="64" aria-hidden="true">
      <path d="M744 500 L744 470 L776 470 L776 500" />
      <path d="M776 476 C790 476 790 494 776 494" />
      <path class="soft" d="M752 462 C748 454 758 450 754 442" />
      <path class="soft" d="M764 462 C760 454 770 450 766 442" />
    </svg>
  )
}
