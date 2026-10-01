import { A } from "@solidjs/router"
import { createSignal, For, type JSX, Match, onCleanup, onMount, Show, Switch } from "solid-js"
import { years } from "virtual:timeline"
import { posts } from "../lib/content.ts"
import { localize, type Lang } from "../lib/i18n.ts"
import { CONTRIBUTIONS, SELECTED_WORKS } from "../lib/profile.ts"
import {
  bounds,
  cell,
  type Face,
  HH,
  HW,
  ITEMS,
  iso,
  type Item,
  LEFT_WALL,
  NIGHT,
  type Open,
  RIGHT_WALL,
  ROOM_TEXT,
  roomSize,
  WALL,
} from "../lib/room.ts"
import { GITHUB_URL, LINKEDIN_URL } from "../lib/site.ts"
import "../styles/room.css"

/*
 * 홈의 방. 서버가 그린 HTML에서 이미 방이 보이도록 모든 위치를 방 영역 기준 %로 적는다.
 * 브라우저에서는 둘러보기(끌기, 확대)와 물건 옮기기만 더한다.
 *
 * - 마우스: 빈 곳을 끌면 방이 움직이고, 물건을 끌면 물건이 옮겨진다. Ctrl+휠(트랙패드 핀치)로 확대, 두 번 누르면 원래대로.
 * - 터치: 한 손가락은 페이지 스크롤, 두 손가락으로 방을 움직이고 확대한다. 물건은 길게 누른 뒤 끈다.
 * - 옮긴 배치는 그 브라우저에만 남는다.
 */

const src = (name: string) => `/room/${name}.png`
const STORE = "room-layout-v1"
const LONG_PRESS_MS = 350
const MAX_ZOOM = 3

type Place = { c: number; r: number; face?: Face }
type View = { x: number; y: number; s: number }

const n = posts.length
const N = roomSize(n)
const B = bounds(N)
const pctX = (x: number) => `${((x - B.x) / B.w) * 100}%`
const pctY = (y: number) => `${((y - B.y) / B.h) * 100}%`
const pctW = (w: number) => `${(w / B.w) * 100}%`
const pctH = (h: number) => `${(h / B.h) * 100}%`

const shown = ITEMS.filter(
  (o) =>
    (o.need ?? 0) <= n &&
    !(o.hide !== undefined && n >= o.hide) &&
    o.c + o.w <= N &&
    o.r + o.d <= N,
)

type Tile = { key: string; name: string; x: number; y: number; w: number; h: number; z: number }

const TILES: Tile[] = (() => {
  const tiles: Tile[] = []
  for (let c = 0; c < N; c++)
    for (let r = 0; r < N; r++) {
      const [x, y] = iso(c, r)
      const name = (c * 7 + r * 3) % 5 === 0 ? "floor-b" : "floor-a"
      // 1px 겹쳐 깔아 이음매를 없앤다
      tiles.push({
        key: `f${c}.${r}`,
        name,
        x: x - HW - 1,
        y: y - 1,
        w: HW * 2 + 2,
        h: HH * 2 + 2,
        z: 1,
      })
    }
  for (let r = 0; r < N; r++) {
    const [x, y] = iso(0, r)
    tiles.push({
      key: `l${r}`,
      name: LEFT_WALL[r] ?? "wall-l",
      x: x - HW - 0.5,
      y: y - WALL,
      w: HW + 1,
      h: WALL + HH,
      z: 2,
    })
  }
  for (let c = 0; c < N; c++) {
    const [x, y] = iso(c, 0)
    const name = c === N - 1 ? "wall-r-door" : (RIGHT_WALL[c] ?? "wall-r")
    tiles.push({ key: `w${c}`, name, x: x - 0.5, y: y - WALL, w: HW + 1, h: WALL + HH, z: 2 })
  }
  return tiles
})()

/** 발판 크기. 반대쪽 벽으로 돌리면 가로·세로가 바뀐다 */
const size = (o: Item, p: Place): [number, number] =>
  o.face && p.face && p.face !== o.face ? [o.d, o.w] : [o.w, o.d]

/** 두 물건의 발판이 겹치는지 */
function overlaps(a: Item, pa: Place, b: Item, pb: Place) {
  const [aw, ad] = size(a, pa)
  const [bw, bd] = size(b, pb)
  return pa.c < pb.c + bw && pb.c < pa.c + aw && pa.r < pb.r + bd && pb.r < pa.r + ad
}

export default function Room(props: { lang: Lang }) {
  const t = (text: Record<Lang, string>) => text[props.lang]
  const [places, setPlaces] = createSignal<Record<string, Place>>({})
  const [poses, setPoses] = createSignal<Record<string, boolean>>({})
  const [panel, setPanel] = createSignal<{ open: Open; right: boolean } | null>(null)
  const [view, setView] = createSignal<View>({ x: 0, y: 0, s: 1 })
  const [drag, setDrag] = createSignal<{ id: string; x: number; y: number; ok: boolean } | null>(
    null,
  )
  const [copied, setCopied] = createSignal(false)
  let stage!: HTMLDivElement

  const placeOf = (o: Item): Place => places()[o.id] ?? { c: o.c, r: o.r, face: o.face }

  function itemStyle(o: Item): JSX.CSSProperties {
    const d = drag()
    const p = placeOf(o)
    const [w, dd] = size(o, p)
    const [xL] = iso(p.c, p.r + dd)
    const [xR] = iso(p.c + w, p.r)
    const [, yF] = iso(p.c + w, p.r + dd)
    const width = pctW((xR - xL) * o.k)
    if (d?.id === o.id) return { left: pctX(d.x), top: pctY(d.y), width, "z-index": 900 }
    return {
      left: pctX((xL + xR) / 2),
      top: pctY(o.actor ? yF - (HH * (w + dd)) / 2 + 8 : yF),
      width,
      "z-index": o.flat ? 3 : 10 + (p.c + w + p.r + dd) * 10 + (o.above ? 5 : 0),
    }
  }

  const imgOf = (o: Item) =>
    o.alt && poses()[o.id] ? o.alt : o.face ? `${o.img}-${placeOf(o).face}` : o.img

  // ── 화면 좌표 → 월드 좌표 ──────────────────────────────────────────
  function toWorld(clientX: number, clientY: number): [number, number] {
    const rect = stage.getBoundingClientRect()
    const v = view()
    const lx = (clientX - rect.left - v.x) / v.s
    const ly = (clientY - rect.top - v.y) / v.s
    return [B.x + (lx / rect.width) * B.w, B.y + (ly / rect.height) * B.h]
  }

  /** 끌던 물건을 놓을 칸. 발판 가운데가 손가락 아래 오도록 */
  function dropPlace(o: Item, x: number, y: number): Place {
    const clampTo = (face: Face | undefined): Place => {
      const [w, d] = size(o, { c: 0, r: 0, face })
      const [c, r] = cell(x, y - HH * ((w + d) / 2))
      return {
        c: Math.min(Math.max(Math.round(c - w / 2), 0), N - w),
        r: Math.min(Math.max(Math.round(r - d / 2), 0), N - d),
        face,
      }
    }
    const p = clampTo(placeOf(o).face)
    if (!o.face) return p
    // 벽에 붙이면 그 벽을 등지게 돌린다
    if (p.c === 0 && p.r > 0) return clampTo("R")
    if (p.r === 0 && p.c > 0) return clampTo("L")
    return p
  }

  const fits = (o: Item, p: Place) =>
    o.flat ||
    o.actor ||
    shown.every((b) => b === o || b.flat || b.actor || !overlaps(o, p, b, placeOf(b)))

  function save(next: Record<string, Place>) {
    setPlaces(next)
    try {
      if (Object.keys(next).length) localStorage.setItem(STORE, JSON.stringify(next))
      else localStorage.removeItem(STORE)
    } catch {
      // 저장소를 못 쓰면 이번 방문에만 남긴다
    }
  }

  // ── 둘러보기 ───────────────────────────────────────────────────────
  function clampView(v: View): View {
    const w = stage.clientWidth
    const h = stage.clientHeight
    const s = Math.min(Math.max(v.s, 1), MAX_ZOOM)
    const mx = w * 0.25
    const my = h * 0.25
    return {
      s,
      x: Math.min(Math.max(v.x, w - w * s - mx), mx),
      y: Math.min(Math.max(v.y, h - h * s - my), my),
    }
  }

  function zoomAt(clientX: number, clientY: number, s: number, from = view()) {
    const rect = stage.getBoundingClientRect()
    const px = clientX - rect.left
    const py = clientY - rect.top
    const lx = (px - from.x) / from.s
    const ly = (py - from.y) / from.s
    setView(clampView({ s, x: px - lx * s, y: py - ly * s }))
  }

  type Gesture =
    | { kind: "pan"; sx: number; sy: number; v: View; moved: boolean }
    | { kind: "pinch"; d0: number; mx: number; my: number; v: View }
    | {
        kind: "item"
        o: Item
        sx: number
        sy: number
        started: boolean
        touch: boolean
        timer?: number
      }
  const pointers = new Map<number, { x: number; y: number }>()
  let gesture: Gesture | null = null
  let suppressClick = false

  const pinchInfo = () => {
    const [a, b] = [...pointers.values()]
    return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 }
  }

  /** 끄는 동안 손가락이 무대 밖으로 나가도 이벤트를 받는다 */
  function capture(id: number) {
    try {
      if (!stage.hasPointerCapture(id)) stage.setPointerCapture(id)
    } catch {
      // 이미 끝난 포인터면 무시한다
    }
  }

  function startItem(g: Extract<Gesture, { kind: "item" }>) {
    g.started = true
    const [x, y] = toWorld(g.sx, g.sy)
    setDrag({ id: g.o.id, x, y, ok: true })
    setPanel(null)
  }

  function onPointerDown(e: PointerEvent) {
    // 터치로 끈 뒤에는 click이 오지 않으므로, 새로 누를 때 지난 끌기의 표시를 지운다
    if (pointers.size === 0) suppressClick = false
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.size === 2) {
      if (gesture?.kind === "item") clearTimeout(gesture.timer)
      setDrag(null)
      const { d, mx, my } = pinchInfo()
      gesture = { kind: "pinch", d0: d, mx, my, v: view() }
      return
    }
    if (pointers.size > 1) return
    const el = (e.target as Element).closest<HTMLElement>("[data-item]")
    const o = el && shown.find((it) => it.id === el.dataset.item)
    if (o) {
      const touch = e.pointerType !== "mouse"
      const g: Gesture = { kind: "item", o, sx: e.clientX, sy: e.clientY, started: false, touch }
      if (touch) g.timer = window.setTimeout(() => startItem(g), LONG_PRESS_MS)
      gesture = g
    } else if (e.pointerType === "mouse" && e.button === 0) {
      gesture = { kind: "pan", sx: e.clientX, sy: e.clientY, v: view(), moved: false }
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (!pointers.has(e.pointerId)) return
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture
    if (!g) return
    if (g.kind === "pinch" && pointers.size === 2) {
      const { d, mx, my } = pinchInfo()
      const s = Math.min(Math.max((g.v.s * d) / g.d0, 1), MAX_ZOOM)
      zoomAt(g.mx, g.my, s, g.v)
      setView((v) => clampView({ ...v, x: v.x + mx - g.mx, y: v.y + my - g.my }))
    } else if (g.kind === "pan") {
      const dx = e.clientX - g.sx
      const dy = e.clientY - g.sy
      if (!g.moved && Math.hypot(dx, dy) < 4) return
      g.moved = true
      capture(e.pointerId)
      setView(clampView({ ...g.v, x: g.v.x + dx, y: g.v.y + dy }))
    } else if (g.kind === "item") {
      const far = Math.hypot(e.clientX - g.sx, e.clientY - g.sy)
      if (!g.started) {
        if (g.touch) {
          if (far > 10) clearTimeout(g.timer)
          return
        }
        if (far < 5) return
        startItem(g)
      }
      capture(e.pointerId)
      const [x, y] = toWorld(e.clientX, e.clientY)
      setDrag({ id: g.o.id, x, y, ok: fits(g.o, dropPlace(g.o, x, y)) })
    }
  }

  function onPointerUp(e: PointerEvent) {
    pointers.delete(e.pointerId)
    const g = gesture
    if (g?.kind === "item") {
      clearTimeout(g.timer)
      const d = drag()
      if (g.started && d) {
        suppressClick = true
        const p = dropPlace(g.o, d.x, d.y)
        if (e.type === "pointerup" && fits(g.o, p)) {
          const base = g.o.c === p.c && g.o.r === p.r && g.o.face === p.face
          const next = { ...places() }
          if (base) delete next[g.o.id]
          else next[g.o.id] = p
          save(next)
        }
      }
      setDrag(null)
    }
    if (g?.kind === "pan" && g.moved) suppressClick = true
    if (pointers.size === 0) gesture = null
  }

  function onItemClick(o: Item, e: MouseEvent) {
    e.stopPropagation()
    if (suppressClick) return void (suppressClick = false)
    if (o.alt) setPoses((p) => ({ ...p, [o.id]: !p[o.id] }))
    if (!o.open) return
    const same = panel()?.open === o.open
    const rect = stage.getBoundingClientRect()
    setPanel(same ? null : { open: o.open, right: e.clientX < rect.left + rect.width / 2 })
  }

  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) ?? "{}") as Record<string, Place>
      const known = Object.fromEntries(
        Object.entries(saved).filter(([id]) => shown.some((o) => o.id === id)),
      )
      setPlaces(known)
    } catch {
      // 망가진 배치는 무시한다
    }
    const onWheel = (e: WheelEvent) => {
      // 트랙패드 핀치는 ctrlKey가 붙은 휠로 온다. 보통 휠은 페이지 스크롤로 둔다.
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      zoomAt(e.clientX, e.clientY, view().s * Math.exp(-e.deltaY * 0.01))
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null)
    const onResize = () => setView((v) => clampView(v))
    stage.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("keydown", onKey)
    window.addEventListener("resize", onResize)
    onCleanup(() => {
      stage.removeEventListener("wheel", onWheel)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", onResize)
    })
  })

  async function copyLayout() {
    // ITEMS에서 같은 id의 c, r, face를 이 값으로 고친다
    const lines = Object.entries(places()).map(
      ([id, p]) => `${id}: c: ${p.c}, r: ${p.r}${p.face ? `, face: "${p.face}"` : ""}`,
    )
    await navigator.clipboard.writeText(lines.join("\n"))
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const moved = () => Object.keys(places()).length > 0
  const dragged = () => {
    const d = drag()
    const o = d && shown.find((it) => it.id === d.id)
    if (!d || !o) return null
    const p = dropPlace(o, d.x, d.y)
    const [w, dd] = size(o, p)
    const [x, y] = iso(p.c, p.r)
    // 놓일 발판을 마름모로 보여 준다
    const pts = [[x, y], iso(p.c + w, p.r), iso(p.c + w, p.r + dd), iso(p.c, p.r + dd)]
      .map(([px, py]) => `${px - B.x},${py - B.y}`)
      .join(" ")
    return { pts, ok: d.ok }
  }

  return (
    <section class="room" aria-label={t(ROOM_TEXT.label)}>
      <div
        ref={stage}
        class="room-stage"
        classList={{ dragging: !!drag() }}
        style={{
          "aspect-ratio": `${B.w} / ${B.h}`,
          // 방이 화면 높이를 넘지 않게 폭을 줄인다
          "max-width": `min(1080px, calc((100svh - 160px) * ${B.w / B.h}))`,
          "--s": String(view().s),
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => {
          if (suppressClick) suppressClick = false
          else setPanel(null)
        }}
        onDblClick={(e) => {
          if (!(e.target as Element).closest("[data-item]")) setView({ x: 0, y: 0, s: 1 })
        }}
      >
        <div
          class="room-world"
          style={{ transform: `translate(${view().x}px, ${view().y}px) scale(${view().s})` }}
        >
          <For each={TILES}>
            {(tile) => {
              const box = {
                left: pctX(tile.x),
                top: pctY(tile.y),
                width: pctW(tile.w),
                height: pctH(tile.h),
                "z-index": tile.z,
              }
              const night = NIGHT[tile.name]
              return (
                <>
                  <img
                    class="room-tile"
                    classList={{ day: !!night }}
                    src={src(tile.name)}
                    alt=""
                    style={box}
                  />
                  <Show when={night}>
                    {(name) => <img class="room-tile night" src={src(name())} alt="" style={box} />}
                  </Show>
                </>
              )
            }}
          </For>
          <Show when={dragged()}>
            {(d) => (
              <svg
                class="room-target"
                classList={{ bad: !d().ok }}
                viewBox={`0 0 ${B.w} ${B.h}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <polygon points={d().pts} />
              </svg>
            )}
          </Show>
          <For each={shown}>
            {(o) =>
              o.open ? (
                <button
                  type="button"
                  class="room-item"
                  classList={{ lifted: drag()?.id === o.id }}
                  data-item={o.id}
                  data-label={o.name && t(o.name)}
                  aria-label={o.name && t(o.name)}
                  style={itemStyle(o)}
                  onClick={(e) => onItemClick(o, e)}
                >
                  <img src={src(imgOf(o))} alt="" draggable={false} />
                </button>
              ) : (
                <div
                  class="room-item"
                  classList={{ lifted: drag()?.id === o.id }}
                  data-item={o.id}
                  style={itemStyle(o)}
                >
                  <img src={src(imgOf(o))} alt="" draggable={false} />
                </div>
              )
            }
          </For>
        </div>

        <Show when={panel()}>
          {(p) => (
            <div
              class="room-panel"
              classList={{ right: p().right }}
              role="dialog"
              aria-label={shown.find((o) => o.open === p().open)?.name?.[props.lang]}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                class="room-close"
                aria-label={t(ROOM_TEXT.close)}
                onClick={() => setPanel(null)}
              >
                ×
              </button>
              <PanelBody open={p().open} lang={props.lang} />
            </div>
          )}
        </Show>
      </div>

      <Show when={moved()}>
        <div class="room-tools">
          <button type="button" onClick={() => save({})}>
            {t(ROOM_TEXT.reset)}
          </button>
          <Show when={import.meta.env.DEV}>
            <button type="button" onClick={copyLayout}>
              {copied() ? t(ROOM_TEXT.copied) : t(ROOM_TEXT.copy)}
            </button>
          </Show>
        </div>
      </Show>
    </section>
  )
}

function PanelBody(props: { open: Open; lang: Lang }) {
  const t = (text: Record<Lang, string>) => text[props.lang]
  const label = () => shown.find((o) => o.open === props.open)?.name
  return (
    <>
      <Show when={label()}>{(name) => <p class="eyebrow">{t(name())}</p>}</Show>
      <Switch>
        <Match when={props.open === "posts"}>
          <ol>
            <For each={posts.slice(0, 12)}>
              {(e) => (
                <li>
                  <A href={e.url}>{e.title}</A>
                  <span class="meta">{e.section}</span>
                </li>
              )}
            </For>
          </ol>
          <A class="more" href="/blog">
            {t(ROOM_TEXT.all)} ({posts.length}) →
          </A>
        </Match>
        <Match when={props.open === "latest"}>
          <ol>
            <For each={posts.slice(0, 3)}>
              {(e) => (
                <li>
                  <A href={e.url}>{e.title}</A>
                  <span class="meta">{e.date?.slice(0, 10)}</span>
                </li>
              )}
            </For>
          </ol>
        </Match>
        <Match when={props.open === "years"}>
          <ol>
            <For each={[...years].reverse()}>
              {(y) => (
                <li class="row">
                  <span class="yr">{y.year}</span>
                  <span>{props.lang === "en" ? (y.en?.theme ?? y.theme) : y.theme}</span>
                </li>
              )}
            </For>
          </ol>
          <a class="more" href="#timeline">
            {t(ROOM_TEXT.timeline)} ↓
          </a>
        </Match>
        <Match when={props.open === "works"}>
          <ol>
            <For each={SELECTED_WORKS}>
              {(w) => (
                <li>
                  <span>{w.title}</span>
                  <span class="meta">{w.period}</span>
                </li>
              )}
            </For>
          </ol>
          <A class="more" href={localize(props.lang, "/work")}>
            {t(ROOM_TEXT.work)} →
          </A>
        </Match>
        <Match when={props.open === "contributions"}>
          <ol>
            <For each={CONTRIBUTIONS}>
              {(c) => (
                <li>
                  <a href={c.href} rel="noopener">
                    {c.repo} {c.ref}
                  </a>
                  <span class="meta">{c.status.split(" · ")[0]}</span>
                </li>
              )}
            </For>
          </ol>
        </Match>
        <Match when={props.open === "github"}>
          <p>{t(ROOM_TEXT.github)}</p>
          <a class="more" href={GITHUB_URL} rel="noopener">
            github.com/nerdchanii →
          </a>
        </Match>
        <Match when={props.open === "linkedin"}>
          <Show when={LINKEDIN_URL} fallback={<p>{t(ROOM_TEXT.linkedinSoon)}</p>}>
            <a class="more" href={LINKEDIN_URL} rel="noopener">
              LinkedIn →
            </a>
          </Show>
        </Match>
        <Match when={props.open === "chani"}>
          <p>{t(ROOM_TEXT.chani)}</p>
          <A class="more" href={localize(props.lang, "/about")}>
            {t(ROOM_TEXT.about)} →
          </A>
        </Match>
        <Match when={props.open === "jindo"}>
          <p>{t(ROOM_TEXT.jindo)}</p>
        </Match>
        <Match when={props.open === "nacho"}>
          <p>{t(ROOM_TEXT.nacho)}</p>
        </Match>
      </Switch>
    </>
  )
}
