/**
 * 책장에서 뽑은 책이 글 페이지의 펼친 책이 되기까지 (그리고 다시 꽂히기까지)의 움직임.
 *
 * 책장(/blog)과 글 페이지는 서로 다른 라우트라서, 둘 사이를 잇는 그림은 라우터 바깥(document.body)에
 * 잠깐 떠 있는 겹(.flight) 하나가 맡는다.
 *   뽑기: 책등 → 선반 위로 → 가운데에서 표지로 넓어짐 → (주소 이동) → 글 페이지의 두 면 자리로 펼쳐짐
 *   꽂기: 두 면 → 표지 → (주소 이동) → 책등으로 좁아져 제자리에 내려앉음
 * 모양만 바꾸는 2D 움직임이고, 회전이나 3D는 쓰지 않는다.
 * 동작 줄이기에서는 아무것도 하지 않고 바로 이동한다.
 */
type Box = { x: number; y: number; w: number; h: number }
export type BookMeta = { url: string; title: string; section: string; color: string }

const EASE = "cubic-bezier(0.7, 0, 0.2, 1)"
const POP = "cubic-bezier(0.3, 1.5, 0.5, 1)"
const COVER = { w: 250, h: 340 }

/**
 * 지금 어디쯤인지.
 *   pull → cover → land : 책장에서 뽑는 중 → 글 페이지가 뜨기를 기다림 → 글 페이지에서 펼치는 중
 *   fold → return → shelve : 글에서 덮는 중 → 책장이 뜨기를 기다림 → 책장에 꽂는 중
 * "기다림"을 따로 두어서, 우리가 옮겨서 화면이 바뀐 것과 방문자가 도중에 다른 곳으로 간 것을 가른다.
 */
type Phase = "idle" | "pull" | "cover" | "land" | "fold" | "return" | "shelve"
let phase: Phase = "idle"
let meta: BookMeta | null = null
let root: HTMLElement | null = null
let book: HTMLElement
let left: HTMLElement
let veil: HTMLElement
/** 뽑혀서 자리를 비운 책등. 도중에 그만두면 다시 보이게 한다 */
let gone: HTMLElement | null = null

/** 옮긴 뒤 이만큼 기다려도 받아 줄 화면이 뜨지 않으면 겹을 걷는다 (ms). 글 본문을 내려받는 시간을 넉넉히 본다 */
const PATIENCE = 6000

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
/**
 * 움직임을 줄여야 하는지. 시스템의 동작 줄이기를 따르되,
 * 개발 중 확인용으로 움직임을 켜 두었으면(`data-motion="full"`, index.html이 정한다) 그대로 움직인다.
 */
export const reducedMotion = () =>
  document.documentElement.dataset.motion !== "full" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches
export const flightPhase = () => phase
export const flightUrl = () => meta?.url

const boxOf = (el: Element): Box => {
  const r = el.getBoundingClientRect()
  return { x: r.left, y: r.top, w: r.width, h: r.height }
}
/** 책등의 상자. 링크(.book)는 선반 칸 높이를 다 차지하므로, 눈에 보이는 책(.book-in)을 잰다 */
const spineBox = (spine: Element): Box => boxOf(spine.querySelector(".book-in") ?? spine)
const css = (b: Box) => ({
  left: `${b.x}px`,
  top: `${b.y}px`,
  width: `${b.w}px`,
  height: `${b.h}px`,
})
const place = (el: HTMLElement, b: Box) => Object.assign(el.style, css(b))
// 다음 단계는 애니메이션의 끝이 아니라 시계로 넘긴다. 탭이 가려지면 애니메이션은 멈추지만 타이머는 가므로,
// 돌아왔을 때 겹이 화면에 남아 있지 않다.
const morph = (el: HTMLElement, b: Box, duration: number, easing = EASE) => {
  el.animate([{}, css(b)], { duration, easing, fill: "forwards" })
  return wait(duration)
}
const fade = (el: Element, from: number, to: number, duration: number, delay = 0) => {
  el.animate([{ opacity: from }, { opacity: to }], { duration, delay, fill: "forwards" })
  return wait(duration + delay)
}

const coverBox = (): Box => ({
  x: innerWidth / 2 - COVER.w / 2,
  y: innerHeight / 2 - COVER.h / 2,
  ...COVER,
})

/** 화면에 보이는 만큼만의 상자 (긴 글의 면은 화면 아래로 이어진다) */
function visible(el: Element): Box {
  const b = boxOf(el)
  return { ...b, h: Math.max(120, Math.min(b.y + b.h, innerHeight - 16) - b.y) }
}

function mount(m: BookMeta) {
  unmount()
  meta = m
  root = document.createElement("div")
  root.className = "flight"
  root.style.setProperty("--c", m.color)
  root.innerHTML = `<div class="flight-veil"></div><div class="flight-left"></div>
    <div class="flight-book"><span class="flight-spine"></span>
      <div class="flight-cover"><span class="flight-sec"></span><span class="flight-title"></span><i></i></div></div>`
  veil = root.querySelector(".flight-veil")!
  left = root.querySelector(".flight-left")!
  book = root.querySelector(".flight-book")!
  root.querySelector(".flight-spine")!.textContent = m.title
  root.querySelector(".flight-sec")!.textContent = m.section.toUpperCase()
  root.querySelector(".flight-title")!.textContent = m.title
  document.body.append(root)
  // 뒤로·앞으로 가기는 방문자가 다른 곳으로 가겠다는 뜻이다. 겹을 걷고 따라가지 않는다
  addEventListener("popstate", abortFlight)
  return root
}

function unmount() {
  removeEventListener("popstate", abortFlight)
  root?.remove()
  gone?.classList.remove("away")
  root = null
  meta = null
  gone = null
  phase = "idle"
}

/** 도중에 그만둔다. 화면이 바뀌어 받아 줄 곳이 없어졌을 때 부른다 */
export function abortFlight() {
  unmount()
}

/** 겹을 흐려 없앤다. 뜬 화면이 책 모양이 아닐 때 (좁은 화면, 읽기 모드) */
export async function dismiss() {
  const mine = root
  if (!mine) return
  phase = "land"
  await fade(mine, 1, 0, 260)
  if (root === mine) unmount()
}

/** 주소를 옮긴 뒤, 받아 줄 화면이 끝내 뜨지 않으면 겹을 걷는다 */
function handOver(mine: HTMLElement, waiting: "cover" | "return", go: () => void) {
  phase = waiting
  setTimeout(() => {
    if (root === mine && phase === waiting) void dismiss()
  }, PATIENCE)
  go()
}

/** 책장에서: 책등이 빠져나와 가운데에서 표지가 된다. 끝나면 go()로 글 주소로 옮긴다 */
export async function pull(spine: HTMLElement, m: BookMeta, go: () => void) {
  if (phase !== "idle") return
  if (reducedMotion()) return go()
  const mine = mount(m)
  phase = "pull"
  const b = spineBox(spine)
  place(book, b)
  // 왼쪽 면은 글 페이지에서 펼쳐질 때에야 나타난다. 그 전에는 폭이 없어도 테두리가 세로줄로 보인다
  left.style.visibility = "hidden"
  gone = spine
  spine.classList.add("away")
  await morph(book, { ...b, y: b.y - Math.round(b.h * 0.55) }, 420)
  if (root !== mine) return
  fade(veil, 0, 1, 500)
  fade(mine.querySelector(".flight-spine")!, 1, 0, 180)
  await morph(book, coverBox(), 620)
  if (root !== mine) return
  await fade(mine.querySelector(".flight-cover")!, 0, 1, 260)
  await wait(320)
  // 그 사이 방문자가 다른 곳으로 갔으면 글로 끌고 가지 않는다
  if (root !== mine) return
  handOver(mine, "cover", go)
}

/** 글 페이지에서: 표지가 오른쪽 면이 되고, 제본선에서 왼쪽 면이 자라난다 */
export async function land(leftPage: Element, rightPage: Element) {
  const mine = root
  if (phase !== "cover" || !mine) return
  phase = "land"
  // 라우터가 주소를 바꾸며 맨 위로 올리는 것은 화면이 뜬 직후다. 그 뒤에 자리를 잰다
  await wait(40)
  if (root !== mine) return
  const [l, r] = pages(leftPage, rightPage)
  place(left, { x: r.x, y: r.y, w: 0, h: r.h })
  left.style.visibility = ""
  fade(mine.querySelector(".flight-cover")!, 1, 0, 160)
  morph(book, r, 640)
  left.animate([css(coverSide()), css(l)], { duration: 640, easing: EASE, fill: "forwards" })
  await wait(660)
  if (root !== mine) return
  await fade(mine, 1, 0, 260)
  if (root === mine) unmount()
}

/**
 * 표지의 왼쪽 가장자리에 붙은, 폭이 없는 상자 (왼쪽 면이 자라나기 시작하는 곳).
 * 표지 자리는 재지 않고 셈한다. 탭이 가려져 애니메이션이 멈춰 있으면 잰 값이 책등 자리로 나온다.
 */
function coverSide(): Box {
  const c = coverBox()
  return { x: c.x, y: c.y, w: 0, h: c.h }
}

/**
 * 펼친 책의 두 면이 화면에서 차지하는 상자.
 * 왼쪽 면(.post-header)은 내용만큼만 키가 있으므로, 높이는 오른쪽 면에 맞춘다.
 */
function pages(leftPage: Element, rightPage: Element): [Box, Box] {
  const r = visible(rightPage)
  return [{ ...boxOf(leftPage), y: r.y, h: r.h }, r]
}

/** 글 페이지에서: 두 면이 접혀 표지가 된다. 끝나면 go()로 책장으로 옮긴다 */
export async function fold(leftPage: Element, rightPage: Element, m: BookMeta, go: () => void) {
  if (phase !== "idle") return
  if (reducedMotion()) return go()
  const mine = mount(m)
  phase = "fold"
  const c = coverBox()
  const [l, r] = pages(leftPage, rightPage)
  place(book, r)
  place(left, l)
  mine.querySelector<HTMLElement>(".flight-spine")!.style.opacity = "0"
  await fade(veil, 0, 1, 180)
  if (root !== mine) return
  morph(book, c, 460)
  await morph(left, { x: c.x, y: c.y, w: 0, h: c.h }, 460)
  if (root !== mine) return
  // 다 접힌 왼쪽 면은 치운다. 두면 책이 책장으로 간 뒤에도 가운데에 세로줄이 남는다
  left.style.visibility = "hidden"
  await fade(mine.querySelector(".flight-cover")!, 0, 1, 200)
  if (root !== mine) return
  handOver(mine, "return", go)
}

/** 책장에서: 표지가 책등으로 좁아져 제자리에 내려앉는다 */
export async function shelve(find: () => HTMLElement | null | undefined) {
  const mine = root
  if (phase !== "return" || !mine) return
  phase = "shelve"
  // land와 같다: 라우터가 맨 위로 올린 뒤에 책을 찾아 자리를 잰다
  await wait(40)
  if (root !== mine) return
  const spine = find()
  if (!spine) return dismiss()
  gone = spine
  spine.classList.add("away")
  spine.scrollIntoView({ block: "center" })
  const b = spineBox(spine)
  fade(veil, 1, 0, 500)
  fade(mine.querySelector(".flight-cover")!, 1, 0, 160)
  fade(mine.querySelector(".flight-spine")!, 0, 1, 300, 220)
  await morph(book, { ...b, y: b.y - Math.round(b.h * 0.55) }, 520)
  if (root !== mine) return
  await morph(book, b, 380, POP)
  if (root === mine) unmount()
}
