import { createEffect, createMemo, createSignal, For, on, onCleanup, onMount, Show } from "solid-js"
import { years as DATA, type TimelineItem, type TimelineYear } from "virtual:timeline"
import { draw as drawLines } from "../lib/draw.ts"
import { reducedMotion as motionReduced } from "../lib/flight.ts"
import { localize, type Lang } from "../lib/i18n.ts"
import { HOME } from "../lib/profile.ts"
import { AUTHOR } from "../lib/site.ts"
import SmartLink from "./SmartLink.tsx"
import "../styles/timeline.css"

/*
 * 홈 타임라인. 내용은 빌드할 때 content/timeline.yml과 글 frontmatter에서 온다 (build/timeline.ts).
 *
 * 움직임은 Apple의 규칙을 따른다 (HIG Motion, WWDC23 「Animate with springs」).
 * - 모든 움직임은 스프링이다. 길이(duration)와 튕김(bounce) 두 값으로 정하고, 모르겠으면 튕김 0.
 * - 스크롤은 브라우저가 한다. 가로채지 않고, 해마다 가까이 왔을 때만 붙는다 (scroll-snap proximity).
 * - 레일과 배경의 큰 연도는 스크롤 위치를 그대로 따라간다.
 * - 연도 버튼으로 이동하는 중에 다른 해를 누르면 그때의 속도를 이어받아 방향을 바꾼다.
 * - 동작 줄이기에서는 튕김과 이동을 빼고, 같은 길이의 페이드만 남긴다.
 *
 * 그 위에 선이 얹힌다 (styles/line.css의 약속). 레일과 눈금은 처음 화면에 들어올 때 한 번 그어지고,
 * 해마다 머리글 앞의 짧은 선과 숨은 이야기 표시가 그어진 다음에 카드가 나타난다.
 */

type Spring = { d: number; bounce: number }

/** Apple의 기본 스프링에 맞춘 값 (길이 s, 튕김) */
const SMOOTH: Spring = { d: 0.5, bounce: 0 }
const SNAPPY: Spring = { d: 0.5, bounce: 0.15 }
const QUICK: Spring = { d: 0.3, bounce: 0 }
/** 연도 릴: 맨 왼쪽 자리의 길이와, 오른쪽 자리로 갈수록 늘어나는 길이 (s) */
const REEL_D = 0.45
const REEL_STEP_D = 0.12
/** 연도 버튼 스크롤의 길이 (s) */
const JUMP_D = 0.55
/** 동작 줄이기에서 연도 버튼을 누르면 이만큼 흐렸다가 그해로 옮긴다 (ms) */
const VEIL_MS = 280
/** 카드가 차례로 나타나는 간격 (ms) */
const STAGGER_MS = 60
/** 그해의 선이 먼저 그어지도록 카드가 기다리는 시간 (ms) */
const LINE_LEAD_MS = 240
/** 레일이 이만큼 화면에 들어오면 긋기 시작한다 */
const RAIL_SHOWN = 0.3
/** linear()를 못 쓰는 브라우저가 스프링 대신 쓰는 곡선 */
const FALLBACK_EASE = "cubic-bezier(0.25, 1, 0.5, 1)"

/** 연도 릴은 0–9를 일곱 번 이어 붙이고, 멈춰 있을 때는 가운데(30번째 칸부터)를 보인다. 한 칸은 1.08em */
const REEL_ROWS = Array.from({ length: 70 }, (_, r) => r % 10)
const REEL_REST = 30
const ROW_EM = 1.08

const FOUND_STORE = "timeline-found"
const MOBILE = "(max-width: 800px)"

/** 스프링 위치 (0 → 1). mass 1, stiffness (2π/d)², damping 4π(1 − bounce)/d */
function springAt(t: number, s: Spring) {
  const w = (2 * Math.PI) / s.d
  const z = 1 - s.bounce
  if (z >= 1) return 1 - (1 + w * t) * Math.exp(-w * t)
  const wd = w * Math.sqrt(1 - z * z)
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t))
}

/** 스프링이 1/1000 안으로 들어와 멈추는 시간 (s). 길이에 비례하므로 튕김마다 한 번만 잰다 */
const settleRatio = new Map<number, number>()
function settleMs(s: Spring) {
  let ratio = settleRatio.get(s.bounce)
  if (ratio === undefined) {
    const unit = { d: 1, bounce: s.bounce }
    ratio = 0
    for (let t = 0; t < 6; t += 0.002) if (Math.abs(1 - springAt(t, unit)) > 1e-3) ratio = t
    settleRatio.set(s.bounce, ratio)
  }
  return Math.round(s.d * ratio * 1000)
}

/** 스프링 모양을 CSS linear()로 옮긴다. 32칸이면 눈으로 구별되지 않는다 */
function springEasing(bounce: number) {
  const unit = { d: 1, bounce }
  const settle = settleMs(unit) / 1000
  const steps = 32
  const values = Array.from({ length: steps + 1 }, (_, i) =>
    i === 0 ? 0 : i === steps ? 1 : +springAt((settle * i) / steps, unit).toFixed(4),
  )
  return `linear(${values.join(", ")})`
}

type Shape = "spiral" | "star" | "fold" | "question" | "loop"

/** 숨은 이야기 표시의 자리. 카드가 놓이는 가운데를 피해 위쪽과 아래쪽 빈칸에 둔다 */
const SPOTS: { left?: string; right?: string; top: string; shape: Shape }[] = [
  { right: "4%", top: "20%", shape: "spiral" },
  { right: "18%", top: "86%", shape: "star" },
  { right: "4%", top: "84%", shape: "fold" },
  { left: "44%", top: "20%", shape: "question" },
  { right: "10%", top: "90%", shape: "loop" },
]

function Mark(props: { shape: Shape }) {
  return (
    // 화면에 들어올 때 한 번 그어진다. 물음표의 점은 선이 다 그어진 뒤에 나타난다 (lib/draw.ts)
    <svg viewBox="0 0 24 24" aria-hidden="true" ref={drawLines}>
      {props.shape === "spiral" && (
        <path d="M12 12c0-3.5 3.5-4.5 4.5-2 1 2.5-2 4.5-4.5 3s-1.5-5.5 2-6.5c4-1.1 7 2 6 5.5" />
      )}
      {props.shape === "star" && (
        <path d="M12 3l1.4 6.9L21 12l-7.6 2.1L12 21l-1.4-6.9L3 12l7.6-2.1z" />
      )}
      {props.shape === "fold" && (
        <>
          <path d="M6 4h13v13" />
          <path d="M19 17l-6.5 0L19 10.5z" />
        </>
      )}
      {props.shape === "question" && (
        <>
          <path d="M8.5 9c0-2.4 1.8-4 3.7-4s3.6 1.4 3.6 3.5c0 2.3-1.8 2.9-2.9 4.2-.6.8-.8 1.6-.8 2.3" />
          <circle class="f" cx="12" cy="18.6" r=".9" />
        </>
      )}
      {props.shape === "loop" && (
        <>
          <path d="M6 14c0-2.8 2.2-5 5-5s5 2.2 5 5-2.2 5-5 5" />
          <path d="M8 16.5l-2-2.5 2-2.5" />
        </>
      )}
    </svg>
  )
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

const textOf = (item: TimelineItem, lang: Lang) => (lang === "en" ? { ...item, ...item.en } : item)
const yearOf = (year: TimelineYear, lang: Lang) => (lang === "en" ? { ...year, ...year.en } : year)
const fill = (text: string, values: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""))

export default function Timeline(props: { lang: Lang }) {
  const t = (text: Record<Lang, string>) => text[props.lang]
  const years = createMemo(() => DATA.map((y) => yearOf(y, props.lang)))
  const secretYears = createMemo(() => years().filter((y) => y.secret))
  const count = DATA.length
  const itemCount = DATA.reduce((sum, y) => sum + y.items.length, 0)
  const frac = (i: number) => (count > 1 ? i / (count - 1) : 0)

  // 서버가 그린 HTML과 첫 클라이언트 렌더가 같도록, 화면에 따라 달라지는 값은 onMount에서만 바꾼다
  const [current, setCurrent] = createSignal(0)
  /** 연속 위치: 해 i의 패널이 화면 맨 위에 붙어 있으면 i */
  const [pos, setPos] = createSignal(-1)
  /** 카드를 보여 준 마지막 해. 한 번 보인 카드는 다시 숨지 않는다 */
  const [seen, setSeen] = createSignal(-1)
  /** 레일을 그었는지. 한 번 그은 레일은 다시 긋지 않는다 */
  const [railDrawn, setRailDrawn] = createSignal(false)
  const [found, setFound] = createSignal<number[]>([])
  const [secret, setSecret] = createSignal<{ text: string; left: number; top: number }>()
  const [secretOpen, setSecretOpen] = createSignal(false)
  const [ready, setReady] = createSignal(false)
  const [reduced, setReduced] = createSignal(false)
  const [veiled, setVeiled] = createSignal(false)

  const progress = () => `${(clamp(pos() / Math.max(1, count - 1), 0, 1) * 100).toFixed(3)}%`
  const yearText = () => String(DATA[current()].year)

  let root!: HTMLDivElement
  let intro!: HTMLElement
  let outro!: HTMLElement
  let left!: HTMLDivElement
  let yearEl!: HTMLHeadingElement

  // onMount에서 채운다
  let jumpTo = (_index: number) => {}
  let spinReels = (_from: number, _to: number) => {}

  const closeSecret = () => {
    if (!secretOpen()) return
    setSecretOpen(false)
    setTimeout(() => !secretOpen() && setSecret(undefined), 700)
  }

  function openSecret(year: number, text: string, anchor: DOMRect) {
    const width = Math.min(280, innerWidth - 28)
    const left = clamp(anchor.left + anchor.width / 2 - width / 2, 14, innerWidth - width - 14)
    const below = anchor.bottom + 10
    const top = Math.max(14, below + 140 > innerHeight ? anchor.top - 150 : below)
    setSecret({ text, left, top })
    requestAnimationFrame(() => setSecretOpen(true))
    if (found().includes(year)) return
    setFound([...found(), year])
    try {
      localStorage.setItem(FOUND_STORE, JSON.stringify(found()))
    } catch {
      // 저장소를 쓸 수 없으면 이번 방문에만 센다.
    }
  }

  // 해가 바뀌면 연도 릴이 돌고, 열어 둔 숨은 이야기는 닫힌다
  createEffect(
    on(
      current,
      (i, prev) => {
        closeSecret()
        if (prev !== undefined && ready()) spinReels(DATA[prev].year, DATA[i].year)
      },
      { defer: true },
    ),
  )

  onMount(() => {
    // dev 서버에서만: `?motion=on`은 시스템이 "동작 줄이기"여도 움직임을 켠다 (확인용)
    const forced = import.meta.env.DEV && /[?&]motion=on\b/.test(location.search)
    // 시스템의 동작 줄이기를 따른다. `data-motion="full"`(개발 중 확인용)이면 움직인다 (lib/flight.ts)
    const reducedMotion = !forced && motionReduced()
    const isMobile = () => matchMedia(MOBILE).matches
    const html = document.documentElement
    const header = document.querySelector<HTMLElement>(".site-header")
    const topOffset = () => header?.offsetHeight ?? 0
    const panels = [...root.querySelectorAll<HTMLElement>(".tl-panel")]
    const reels = [...yearEl.querySelectorAll<HTMLElement>(".tl-reel")]
    const rails = [...root.querySelectorAll<HTMLElement>(".tl-rail")]
    const cleanups: (() => void)[] = []
    const listen = <K extends keyof WindowEventMap>(
      target: Window | Document | HTMLElement,
      type: K,
      handler: (event: WindowEventMap[K]) => void,
      options?: AddEventListenerOptions,
    ) => {
      target.addEventListener(type, handler as EventListener, options)
      cleanups.push(() => target.removeEventListener(type, handler as EventListener, options))
    }
    onCleanup(() => cleanups.forEach((fn) => fn()))

    setReduced(reducedMotion)

    // ---- 스프링: 식으로 계산해 CSS 변수로 넘긴다. linear()를 못 쓰면 CSS의 기본 곡선을 그대로 쓴다 ----
    // 동작 줄이기에서는 튕김이 있는 스프링도 튕김 없는 것으로 바꾼다
    const ease = { smooth: FALLBACK_EASE, snappy: FALLBACK_EASE }
    if (CSS.supports("transition-timing-function", "linear(0, 1)")) {
      const snappy = reducedMotion ? SMOOTH : SNAPPY
      ease.smooth = springEasing(SMOOTH.bounce)
      ease.snappy = springEasing(snappy.bounce)
      root.style.setProperty("--ease-smooth", ease.smooth)
      root.style.setProperty("--ease-snappy", ease.snappy)
      root.style.setProperty("--t-quick", `${settleMs(QUICK)}ms`)
      root.style.setProperty("--t-smooth", `${settleMs(SMOOTH)}ms`)
      root.style.setProperty("--t-snappy", `${settleMs(snappy)}ms`)
    }

    try {
      const saved: unknown = JSON.parse(localStorage.getItem(FOUND_STORE) ?? "[]")
      if (Array.isArray(saved)) setFound(saved.filter((y) => typeof y === "number"))
    } catch {
      // 저장된 값이 없거나 읽을 수 없으면 0부터 센다.
    }

    const measure = () => root.style.setProperty("--tl-top", topOffset() + "px")
    measure()

    // 넓은 화면에서만 해마다 가까이 오면 붙는다. 다른 페이지로 가면 뗀다
    html.classList.add("tl-snap")
    onCleanup(() => html.classList.remove("tl-snap", "tl-jumping"))

    // ---- 연도 릴: 슬롯머신처럼 모든 자리가 함께 돌다가 왼쪽 자리부터 하나씩 멈춘다 ----
    // 앞으로 가면 숫자가 아래에서 올라오고, 뒤로 가면 위에서 내려온다.
    const at = (row: number) => `translateY(${(-row * ROW_EM).toFixed(4)}em)`
    spinReels = (from, to) => {
      const dir = to > from ? 1 : -1
      const a = String(from)
      const b = String(to)
      reels.forEach((reel, k) => {
        if (typeof reel.animate !== "function") return
        // 도는 중에 해가 또 바뀌면 지금 보이는 자리에서 이어 돈다
        let curRow: number | undefined
        const running = reel.getAnimations()
        if (running.length) {
          const style = getComputedStyle(reel)
          const rowPx = parseFloat(style.fontSize) * ROW_EM
          curRow = -new DOMMatrixReadOnly(style.transform).m42 / rowPx
          running.forEach((animation) => animation.cancel())
        }
        const da = Number(a[k])
        const db = Number(b[k])
        const endRow = REEL_REST + db
        if (reducedMotion) {
          // 굴리지 않고 제자리에서 교차 페이드한다. 길이는 평소와 같다
          if (da === db) return
          const fromY = at(REEL_REST + da)
          reel.animate(
            [
              { transform: fromY, opacity: 1 },
              { transform: fromY, opacity: 0, offset: 0.45 },
              { transform: at(endRow), opacity: 0, offset: 0.45 },
              { transform: at(endRow), opacity: 1 },
            ],
            { duration: settleMs(SMOOTH), easing: ease.smooth },
          )
          return
        }
        const gap = dir > 0 ? (db - da + 10) % 10 : (da - db + 10) % 10
        // 오른쪽 두 자리는 한 바퀴 더 돈다
        let startRow = endRow - dir * ((k >= 2 ? 20 : 10) + gap)
        if (curRow !== undefined) {
          startRow = curRow
          while (dir * (endRow - startRow) < 10) startRow -= dir * 10
          while (dir * (endRow - startRow) >= 20) startRow += dir * 10
        }
        reel.animate([{ transform: at(startRow) }, { transform: at(endRow) }], {
          duration: settleMs({ d: REEL_D + k * REEL_STEP_D, bounce: SNAPPY.bounce }),
          easing: ease.snappy,
        })
      })
    }

    // ---- 지금 해와 연속 위치 ----
    function stopTop(el: HTMLElement) {
      if (el === intro) return 0
      const bar = isMobile() && el !== outro ? left.offsetHeight : 0
      const top = el.getBoundingClientRect().top + scrollY - topOffset() - bar
      return clamp(Math.round(top), 0, document.documentElement.scrollHeight - innerHeight)
    }

    /** 연도 버튼으로 가는 해. 가는 동안에는 이 해를 지금 해로 두어 릴이 한 번만 돈다 */
    let target = -1
    let queued = false
    const detect = () => {
      queued = false
      const rects = panels.map((panel) => panel.getBoundingClientRect())
      // 패널이 화면 맨 위(헤더 아래, 좁은 화면이면 상단 바 아래)에 붙으면 그 해의 자리다
      const anchor = topOffset() + (isMobile() ? left.offsetHeight : 0)
      let p = (anchor - rects[0].top) / Math.max(1, rects[0].height)
      rects.forEach((r, i) => {
        if (r.top <= anchor + 0.5) p = i + (anchor - r.top) / Math.max(1, r.height)
      })
      setPos(p)
      // 지금 해: 화면의 황금 분할선(위에서 38.2%)에 걸친 해
      const line = topOffset() + (innerHeight - topOffset()) * 0.382
      let index = rects[0].top > line ? 0 : -1
      rects.forEach((r, i) => {
        if (r.top <= line && r.bottom > line) index = i
      })
      if (index < 0) index = count - 1
      if (target < 0) setCurrent(index)
      // 화면 아래쪽에 들어온 해까지 카드를 보여 준다
      let last = -1
      rects.forEach((r, i) => {
        if (r.top < innerHeight - 80) last = i
      })
      if (last > seen()) setSeen(last)
      // 레일은 세로든 가로든 지금 보이는 쪽이 화면에 들어왔을 때 긋는다 (안 보이는 쪽은 높이가 0이다)
      if (!railDrawn()) {
        const shown = rails.some((rail) => {
          const r = rail.getBoundingClientRect()
          return r.height > 0 && r.top < innerHeight - r.height * RAIL_SHOWN && r.bottom > 0
        })
        if (shown) setRailDrawn(true)
      }
    }
    const queueDetect = () => {
      if (queued) return
      queued = true
      requestAnimationFrame(detect)
    }
    listen(window, "scroll", queueDetect, { passive: true })

    // ---- 연도 버튼: 스프링으로 그해까지 스크롤한다 ----
    let jumpRaf = 0
    let veilTimer = 0
    let jumpX = 0
    let jumpV = 0
    let jumpDest = 0

    function stopJump() {
      cancelAnimationFrame(jumpRaf)
      clearTimeout(veilTimer)
      jumpRaf = 0
      veilTimer = 0
      target = -1
      html.classList.remove("tl-jumping")
      setVeiled(false)
      queueDetect()
    }
    onCleanup(() => {
      cancelAnimationFrame(jumpRaf)
      clearTimeout(veilTimer)
    })

    jumpTo = (i) => {
      i = clamp(i, 0, count - 1)
      const dest = stopTop(panels[i])
      target = i
      setCurrent(i)
      if (reducedMotion) {
        // 화면을 움직이지 않고, 잠깐 흐렸다가 그해에서 다시 밝힌다
        clearTimeout(veilTimer)
        setVeiled(true)
        veilTimer = window.setTimeout(() => {
          scrollTo(0, dest)
          veilTimer = 0
          target = -1
          setVeiled(false)
          queueDetect()
        }, VEIL_MS)
        return
      }
      jumpDest = dest
      // 도는 중이면 목표만 바꾼다. 스프링이 지금 속도를 이어받아 방향을 바꾼다
      if (jumpRaf) return
      jumpX = scrollY
      jumpV = 0
      if (Math.abs(dest - jumpX) < 1) {
        target = -1
        return
      }
      // 브라우저는 스크립트가 옮긴 스크롤에도 스냅을 건다. 가는 동안에는 떼어 곡선이 끊기지 않게 한다
      html.classList.add("tl-jumping")
      const stiffness = Math.pow((2 * Math.PI) / JUMP_D, 2)
      const damping = (4 * Math.PI) / JUMP_D
      let last = performance.now()
      const step = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        for (let n = 0; n < 4; n++) {
          const h = dt / 4
          jumpV += (-stiffness * (jumpX - jumpDest) - damping * jumpV) * h
          jumpX += jumpV * h
        }
        if (Math.abs(jumpX - jumpDest) < 0.5 && Math.abs(jumpV) < 10) {
          scrollTo(0, jumpDest)
          jumpRaf = 0
          stopJump()
          return
        }
        scrollTo(0, jumpX)
        jumpRaf = requestAnimationFrame(step)
      }
      jumpRaf = requestAnimationFrame(step)
    }

    // 가는 중에 직접 스크롤하면 그 자리에서 멈춘다. 다른 연도 버튼을 누르는 것은 목표를 바꾸는 것이므로 두고 본다
    const interrupt = (e: Event) => {
      if (e.target instanceof Element && e.target.closest(".tick")) return
      if (jumpRaf || veilTimer) stopJump()
    }
    listen(window, "wheel", interrupt, { passive: true })
    listen(window, "touchstart", interrupt, { passive: true })
    listen(window, "pointerdown", interrupt)
    listen(window, "keydown", (e) => {
      if (/^(Arrow(Up|Down)|Page(Up|Down)|Home|End| )$/.test(e.key)) interrupt(e)
    })

    // 숨은 이야기는 커서가 가까워질수록 또렷해진다
    const marks = [...root.querySelectorAll<HTMLElement>(".tl-mark")]
    listen(
      window,
      "pointermove",
      (e) => {
        for (const mark of marks) {
          const r = mark.getBoundingClientRect()
          if (r.bottom < 0 || r.top > innerHeight) continue
          const d = Math.hypot(e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2)
          mark.style.setProperty("--reveal", (0.1 + Math.max(0, 1 - d / 170) * 0.8).toFixed(2))
        }
      },
      { passive: true },
    )

    listen(document, "click", (e) => {
      if (!secretOpen()) return
      if ((e.target as Element).closest(".tl-mark, .tl-secret")) return
      closeSecret()
    })
    listen(document, "keydown", (e) => {
      if (e.key === "Escape") closeSecret()
    })
    listen(window, "resize", () => {
      measure()
      queueDetect()
    })

    // 화면에 이미 들어와 있는 카드는 숨겼다가 다시 보이지 않도록, 먼저 자리를 재고 나서 준비를 마친다
    detect()
    setReady(true)
  })

  const records = (n: number) => fill(t(HOME.records), { n })

  function Rail(railProps: { class: string }) {
    return (
      <div
        class="tl-rail"
        classList={{ [railProps.class]: true, drawn: railDrawn() }}
        role="group"
        aria-label={t(HOME.railLabel)}
        style={{ "--p": progress() }}
      >
        <div class="track" />
        <div class="fill" />
        <For each={DATA}>
          {(year, i) => (
            <button
              class="tick"
              classList={{ on: i() === current(), past: i() <= current() }}
              type="button"
              style={{ "--at": `${frac(i()) * 100}%`, "--f": frac(i()) }}
              aria-current={i() === current() ? "true" : undefined}
              onClick={() => jumpTo(i())}
            >
              <span class="tick-label">{year.year}</span>
              <span class="tick-mark" aria-hidden="true" />
            </button>
          )}
        </For>
        <div class="dot" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div class="tl" classList={{ ready: ready(), reduced: reduced(), veiled: veiled() }} ref={root}>
      <section class="tl-intro" ref={intro}>
        <p class="tl-summary">
          {fill(t(HOME.summary), {
            from: DATA[0].year,
            to: DATA[count - 1].year,
            years: count,
            items: itemCount,
          })}
        </p>
        <h1>{t(HOME.hello)}</h1>
        <figure class="tl-quote">
          <blockquote lang={HOME.quote.lang}>
            <p>{HOME.quote.text}</p>
          </blockquote>
          <figcaption>
            <span class="tl-quote-translation">{t(HOME.quote.translation)}</span>
            <cite>— {t(HOME.quote.source)}</cite>
          </figcaption>
        </figure>
        {/* 아래로 이어진다는 표시. 말로 안내하지 않고, 아래로 흘러내리는 선과 화살촉으로만 알린다 */}
        <div class="tl-hint" aria-hidden="true">
          <i />
          <svg viewBox="0 0 12 8" width="14" height="9">
            <path d="M1 1 L6 6.5 L11 1" />
          </svg>
        </div>
      </section>

      <div class="tl-grid">
        <div class="tl-left" ref={left}>
          <div class="tl-left-inner">
            <div class="tl-who">
              <b class="tl-name">{props.lang === "ko" ? AUTHOR : "Yechan Kim"}</b>
              <span class="tl-handle">nerdchanii</span>
              <p class="tl-short">
                <For each={HOME.short}>
                  {(line, i) => (
                    <>
                      <Show when={i() > 0}>
                        <br />
                      </Show>
                      {t(line)}
                    </>
                  )}
                </For>
              </p>
            </div>
            <div class="tl-now">
              <div>
                <h2 class="tl-year" ref={yearEl} aria-label={yearText()}>
                  <For each={[...String(DATA[0].year)]}>
                    {(_, k) => (
                      <span class="tl-reel-col" aria-hidden="true">
                        <span
                          class="tl-reel"
                          style={{
                            transform: `translateY(${(-(REEL_REST + Number(yearText()[k()])) * ROW_EM).toFixed(4)}em)`,
                          }}
                        >
                          <For each={REEL_ROWS}>{(digit) => <span>{digit}</span>}</For>
                        </span>
                      </span>
                    )}
                  </For>
                </h2>
                <div class="tl-themes">
                  <For each={years()}>
                    {(year, i) => (
                      <p
                        class="tl-theme"
                        classList={{ on: i() === current() }}
                        aria-hidden={i() !== current()}
                      >
                        {year.theme}
                      </p>
                    )}
                  </For>
                </div>
              </div>
              <div class="tl-counter">
                <span class="tl-counter-label">{t(HOME.counter)}</span> {found().length} /{" "}
                {secretYears().length}
                <Show when={secretYears().length > 0 && found().length >= secretYears().length}>
                  <span class="tl-counter-done">{t(HOME.allFound)}</span>
                </Show>
              </div>
            </div>
          </div>
          <Rail class="tl-rail-v" />
          <div class="tl-bar-progress" style={{ width: progress() }} aria-hidden="true" />
        </div>

        <div class="tl-right">
          <Rail class="tl-rail-h" />

          {/* 배경의 큰 연도. 패널 안에 두면 경계에서 잘리므로, 화면에 붙은 한 층에서 해마다 교차 페이드한다 */}
          <div class="tl-watermark" aria-hidden="true">
            <div class="tl-watermark-inner">
              <For each={DATA}>
                {(year, i) => (
                  <div
                    class="tl-big"
                    style={{
                      opacity: clamp(1 - Math.abs(pos() - i()) * 1.6, 0, 1).toFixed(3),
                      transform: reduced()
                        ? undefined
                        : `translateY(${clamp(-(pos() - i()) * 48, -96, 96).toFixed(1)}px)`,
                    }}
                  >
                    {year.year}
                  </div>
                )}
              </For>
            </div>
          </div>

          <For each={years()}>
            {(year, yi) => {
              const spot = () => SPOTS[secretYears().indexOf(year) % SPOTS.length]
              const isFound = () => found().includes(year.year)
              return (
                <section
                  class="tl-panel"
                  classList={{ drawn: seen() >= yi() }}
                  aria-label={String(year.year)}
                >
                  <div class="tl-panel-head">
                    <p class="tl-caption">
                      {year.year} · {records(year.items.length)}
                    </p>
                    <Show when={year.secret}>
                      {(text) => (
                        <button
                          class="tl-mark"
                          classList={{ found: isFound() }}
                          type="button"
                          style={{
                            "--spot-top": spot().top,
                            "--spot-left": spot().left ?? "auto",
                            "--spot-right": spot().right ?? "auto",
                          }}
                          aria-label={
                            year.year + t(isFound() ? HOME.secretFound : HOME.secretHidden)
                          }
                          onClick={(e) =>
                            openSecret(year.year, text(), e.currentTarget.getBoundingClientRect())
                          }
                        >
                          <Mark shape={spot().shape} />
                        </button>
                      )}
                    </Show>
                  </div>
                  <div class="tl-paper">
                    <For each={year.items}>
                      {(raw, j) => {
                        const item = textOf(raw, props.lang)
                        // 설명이 없으면 미리보기 문장을 설명 자리에 쓴다
                        const desc = item.desc ?? item.preview
                        const more = item.desc ? item.preview : undefined
                        const body = (link: boolean) => (
                          <>
                            <span class="note-head">
                              <span class="kind">{item.kind}</span>
                              <Show when={item.post && item.date}>
                                <span class="stamp">{item.date}</span>
                              </Show>
                              <Show when={link}>
                                <svg class="go" viewBox="0 0 16 16" aria-hidden="true">
                                  <path d="M5 11L11 5M6 5h5v5" />
                                </svg>
                              </Show>
                            </span>
                            <b>{item.title}</b>
                            <Show when={desc}>{(text) => <span class="desc">{text()}</span>}</Show>
                            <Show when={more}>
                              {(text) => (
                                <span class="note-more">
                                  <span>
                                    <span class="note-more-text">{text()}</span>
                                  </span>
                                </span>
                              )}
                            </Show>
                          </>
                        )
                        return (
                          <div
                            class="tl-card-wrap"
                            classList={{ in: seen() >= yi() }}
                            style={{
                              // 선이 먼저, 글이 뒤
                              "transition-delay":
                                seen() >= yi() ? `${LINE_LEAD_MS + j() * STAGGER_MS}ms` : "0ms",
                            }}
                          >
                            <Show when={item.href} fallback={<div class="note">{body(false)}</div>}>
                              {(href) => (
                                <SmartLink href={href()} class="note link">
                                  {body(true)}
                                </SmartLink>
                              )}
                            </Show>
                          </div>
                        )
                      }}
                    </For>
                  </div>
                </section>
              )
            }}
          </For>
        </div>
      </div>

      <section class="tl-outro" ref={outro}>
        <p>{t(HOME.outro)}</p>
        <nav>
          <For each={HOME.outroLinks}>
            {(link) => (
              <SmartLink href={link.href === "/work" ? localize(props.lang, link.href) : link.href}>
                {t(link.label)}
              </SmartLink>
            )}
          </For>
        </nav>
      </section>

      <Show when={secret()}>
        {(s) => (
          <div
            class="tl-secret"
            classList={{ open: secretOpen() }}
            role="dialog"
            aria-label={t(HOME.secretHidden).replace(/^[:년의 ]+/, "")}
            style={{ left: s().left + "px", top: s().top + "px" }}
          >
            <button type="button" aria-label={t(HOME.close)} onClick={closeSecret}>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
            <p>{s().text}</p>
          </div>
        )}
      </Show>
    </div>
  )
}
