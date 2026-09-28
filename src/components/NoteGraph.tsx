import { useNavigate } from "@solidjs/router"
import { createSignal, onCleanup, onMount, Show } from "solid-js"
import { entries } from "../lib/content.ts"
import type { Lang } from "../lib/i18n.ts"
import { tagSlug } from "../lib/tags.ts"
import { THEME_EVENT } from "../lib/theme.ts"

/**
 * 이 블로그의 실제 연결을 세 층으로 그린다.
 * L1 구조(폴더) · L2 글 · L3 태그. 선은 폴더→글, 글→글 링크, 글→태그다.
 * 서버는 빈 캔버스만 그리고, 배치와 그리기는 브라우저에서만 한다.
 */

type Node = { id: string; label: string; href: string; layer: 0 | 1 | 2; x: number; z: number }
type Edge = [number, number]

const LAYER_NAMES = ["STRUCTURE", "WRITING", "TOPICS"]

function buildGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const index = new Map<string, number>()
  const add = (id: string, label: string, href: string, layer: Node["layer"]) => {
    if (!index.has(id)) {
      index.set(id, nodes.length)
      nodes.push({ id, label, href, layer, x: 0, z: 0 })
    }
    return index.get(id)!
  }

  for (const e of entries) add(e.url, e.isIndex ? `${e.title}/` : e.title, e.url, e.isIndex ? 0 : 1)
  const edges: Edge[] = []
  for (const e of entries) {
    const from = index.get(e.url)!
    // 폴더 index → 바로 아래 글·폴더
    const parent = e.url.slice(0, e.url.lastIndexOf("/"))
    if (parent && index.has(parent)) edges.push([index.get(parent)!, from])
    for (const link of e.links) if (index.has(link)) edges.push([from, index.get(link)!])
    if (e.isIndex) continue
    for (const tag of e.tags) {
      const slug = tagSlug(tag)
      if (slug) edges.push([from, add(`#${slug}`, `#${tag}`, `/tags/${slug}`, 2)])
    }
  }
  layout(nodes, edges)
  return { nodes, edges }
}

/** 결정적인 힘 기반 배치. 층은 고정하고 x, z만 움직인다. 매번 같은 결과가 나오도록 난수 대신 황금각을 쓴다 */
function layout(nodes: Node[], edges: Edge[]) {
  nodes.forEach((n, i) => {
    const angle = i * 2.399963
    const r = 0.25 + 0.7 * ((i * 0.618034) % 1)
    n.x = Math.cos(angle) * r
    n.z = Math.sin(angle) * r
  })
  for (let step = 0; step < 300; step++) {
    const cool = 1 - step / 300
    const fx = new Float64Array(nodes.length)
    const fz = new Float64Array(nodes.length)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const sameLayer = nodes[i].layer === nodes[j].layer
        const dx = nodes[i].x - nodes[j].x
        const dz = nodes[i].z - nodes[j].z
        const d2 = dx * dx + dz * dz + 1e-4
        const push = (sameLayer ? 0.006 : 0.001) / d2
        fx[i] += dx * push
        fz[i] += dz * push
        fx[j] -= dx * push
        fz[j] -= dz * push
      }
    }
    for (const [a, b] of edges) {
      const dx = nodes[b].x - nodes[a].x
      const dz = nodes[b].z - nodes[a].z
      fx[a] += dx * 0.05
      fz[a] += dz * 0.05
      fx[b] -= dx * 0.05
      fz[b] -= dz * 0.05
    }
    nodes.forEach((n, i) => {
      // 가운데로 약하게 당겨서 판 밖으로 나가지 않게 한다.
      // 태그는 연결이 적어서 판 가장자리로 밀려나기 쉽다. 조금 더 세게 당긴다.
      const pull = n.layer === 2 ? 0.06 : 0.02
      fx[i] -= n.x * pull
      fz[i] -= n.z * pull
      const len = Math.hypot(fx[i], fz[i])
      const max = 0.05 * cool + 0.002
      const k = len > max ? max / len : 1
      n.x = Math.max(-1, Math.min(1, n.x + fx[i] * k))
      n.z = Math.max(-1, Math.min(1, n.z + fz[i] * k))
    })
  }
}

const LAYER_Y = [1.05, 0, -1.05]
/** 판의 반 너비. 점은 [-1, 1] 안에 있다 */
const PLANE = 1.12

export default function NoteGraph(props: { lang: Lang }) {
  const navigate = useNavigate()
  const [hover, setHover] = createSignal<Node | null>(null)
  const [angles, setAngles] = createSignal({ yaw: -0.6, pitch: 0.5 })
  let canvas!: HTMLCanvasElement
  let wrap!: HTMLDivElement

  onMount(() => {
    const { nodes, edges } = buildGraph()
    const ctx = canvas.getContext("2d")!
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches
    let colors = readColors()
    let width = 0
    let height = 0
    let frame = 0
    let dragging: { x: number; y: number } | null = null
    let idle = !reduced
    let projected: { x: number; y: number; s: number }[] = []

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw()
    }

    const project = (x: number, y: number, z: number) => {
      const { yaw, pitch } = angles()
      const cx = Math.cos(yaw)
      const sx = Math.sin(yaw)
      const x1 = x * cx - z * sx
      const z1 = x * sx + z * cx
      const cp = Math.cos(pitch)
      const sp = Math.sin(pitch)
      const y2 = y * cp - z1 * sp
      const z2 = y * sp + z1 * cp
      const scale = Math.min(width * 0.34, height * 0.29)
      const persp = 3.2 / (3.2 + z2)
      return {
        // 넓은 화면에서는 왼쪽에 층 이름표 자리를 남긴다.
        x: width * (width < 480 ? 0.5 : 0.56) + x1 * scale * persp,
        y: height * 0.55 - y2 * scale * persp,
        s: persp,
      }
    }

    function draw() {
      if (!width) return
      ctx.clearRect(0, 0, width, height)
      const focus = hover()
      const focusIndex = focus ? nodes.indexOf(focus) : -1
      const linked = new Set<number>()
      if (focusIndex >= 0) {
        for (const [a, b] of edges) {
          if (a === focusIndex) linked.add(b)
          if (b === focusIndex) linked.add(a)
        }
      }

      // 층마다 격자 판
      ctx.lineWidth = 1
      LAYER_Y.forEach((y, layer) => {
        const corners = [
          [-PLANE, -PLANE],
          [PLANE, -PLANE],
          [PLANE, PLANE],
          [-PLANE, PLANE],
        ].map(([x, z]) => project(x, y, z))
        ctx.strokeStyle = colors.faint
        ctx.beginPath()
        corners.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
        ctx.closePath()
        ctx.stroke()
        ctx.globalAlpha = 0.3
        for (const t of [-0.5, 0, 0.5]) {
          const a = project(t * PLANE, y, -PLANE)
          const b = project(t * PLANE, y, PLANE)
          const c = project(-PLANE, y, t * PLANE)
          const d = project(PLANE, y, t * PLANE)
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.moveTo(c.x, c.y)
          ctx.lineTo(d.x, d.y)
          ctx.stroke()
        }
        ctx.globalAlpha = 1
        // 판의 가장 왼쪽 모서리 바깥에 층 이름을 단다. 회전해도 점과 겹치지 않는다.
        const label = corners.reduce((a, b) => (b.x < a.x ? b : a))
        ctx.fillStyle = colors.muted
        ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace"
        // 좁은 화면에서는 이름표가 판과 겹치므로 그리지 않는다.
        if (width < 480) return
        const name = `L${layer + 1} · ${LAYER_NAMES[layer]}`
        // 캔버스 왼쪽 끝에서 잘리지 않게 한다.
        const x = Math.max(label.x - 8, ctx.measureText(name).width + 2)
        ctx.textAlign = "right"
        ctx.fillText(name, x, label.y + 3)
        ctx.textAlign = "left"
      })

      projected = nodes.map((n) => project(n.x, LAYER_Y[n.layer], n.z))

      for (const [a, b] of edges) {
        const on = focusIndex >= 0 && (a === focusIndex || b === focusIndex)
        const cross = nodes[a].layer !== nodes[b].layer
        ctx.strokeStyle = on ? colors.text : colors.faint
        ctx.globalAlpha = on ? 1 : focusIndex >= 0 ? 0.25 : cross ? 0.55 : 0.9
        ctx.setLineDash(cross && !on ? [2, 3] : [])
        ctx.beginPath()
        ctx.moveTo(projected[a].x, projected[a].y)
        ctx.lineTo(projected[b].x, projected[b].y)
        ctx.stroke()
      }
      ctx.setLineDash([])
      ctx.globalAlpha = 1

      // 멀리 있는 점부터 그린다.
      const order = nodes.map((_, i) => i).sort((a, b) => projected[a].s - projected[b].s)
      for (const i of order) {
        const p = projected[i]
        const n = nodes[i]
        const dim = focusIndex >= 0 && i !== focusIndex && !linked.has(i)
        ctx.globalAlpha = dim ? 0.3 : 1
        const r = (n.layer === 1 ? 4.2 : n.layer === 0 ? 5 : 2.8) * p.s
        ctx.beginPath()
        if (n.layer === 0) ctx.rect(p.x - r, p.y - r, r * 2, r * 2)
        else ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fillStyle = n.layer === 2 ? colors.bg : colors.text
        ctx.fill()
        ctx.strokeStyle = colors.text
        ctx.stroke()
      }
      ctx.globalAlpha = 1

      if (focusIndex >= 0) {
        const p = projected[focusIndex]
        ctx.font = "12px Pretendard Variable, system-ui, sans-serif"
        const text = focus!.label
        const w = ctx.measureText(text).width
        const x = Math.min(p.x + 10, width - w - 12)
        ctx.fillStyle = colors.bg
        ctx.fillRect(x - 4, p.y - 22, w + 8, 18)
        ctx.strokeStyle = colors.text
        ctx.strokeRect(x - 4, p.y - 22, w + 8, 18)
        ctx.fillStyle = colors.text
        ctx.fillText(text, x, p.y - 9)
      }
    }

    const tick = () => {
      if (idle && !dragging && !hover()) setAngles((a) => ({ ...a, yaw: a.yaw + 0.0016 }))
      draw()
      frame = requestAnimationFrame(tick)
    }

    const pick = (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      let best: Node | null = null
      let bestD = 14
      projected.forEach((p, i) => {
        const d = Math.hypot(p.x - x, p.y - y)
        if (d < bestD) {
          bestD = d
          best = nodes[i]
        }
      })
      return best as Node | null
    }

    let moved = 0
    const onDown = (ev: PointerEvent) => {
      dragging = { x: ev.clientX, y: ev.clientY }
      moved = 0
      canvas.setPointerCapture(ev.pointerId)
    }
    const onMove = (ev: PointerEvent) => {
      if (dragging) {
        const dx = ev.clientX - dragging.x
        const dy = ev.clientY - dragging.y
        moved += Math.abs(dx) + Math.abs(dy)
        dragging = { x: ev.clientX, y: ev.clientY }
        setAngles((a) => ({
          yaw: a.yaw + dx * 0.008,
          pitch: Math.max(0.05, Math.min(1.2, a.pitch + dy * 0.006)),
        }))
        idle = false
      } else {
        setHover(pick(ev))
        canvas.style.cursor = hover() ? "pointer" : "grab"
      }
      if (reduced) draw()
    }
    const onUp = (ev: PointerEvent) => {
      if (dragging && moved < 4) {
        const node = pick(ev)
        if (node) navigate(node.href)
      }
      dragging = null
    }
    const onLeave = () => setHover(null)
    const onTheme = () => {
      // data-theme이 바뀐 뒤 계산된 색을 다시 읽는다.
      requestAnimationFrame(() => {
        colors = readColors()
        draw()
      })
    }

    canvas.addEventListener("pointerdown", onDown)
    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerup", onUp)
    canvas.addEventListener("pointerleave", onLeave)
    window.addEventListener(THEME_EVENT, onTheme)
    const observer = new ResizeObserver(resize)
    observer.observe(wrap)
    resize()
    if (reduced) draw()
    else frame = requestAnimationFrame(tick)

    onCleanup(() => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener(THEME_EVENT, onTheme)
    })
  })

  function readColors() {
    const style = getComputedStyle(wrap)
    return {
      text: style.getPropertyValue("--text").trim() || "#111",
      muted: style.getPropertyValue("--text-muted").trim() || "#666",
      faint: style.getPropertyValue("--line").trim() || "#ccc",
      bg: style.getPropertyValue("--bg").trim() || "#fff",
    }
  }

  const caption = () =>
    props.lang === "ko"
      ? "드래그로 회전 · 점을 누르면 이동"
      : "Drag to rotate · click a node to open"

  return (
    <figure class="note-graph">
      <div class="note-graph-canvas" ref={wrap}>
        <canvas
          ref={canvas}
          role="img"
          aria-label={
            props.lang === "ko"
              ? "블로그의 폴더, 글, 태그가 연결된 3층 그래프"
              : "A three-layer graph of this site's folders, posts, and tags"
          }
        />
      </div>
      <figcaption>
        <span>FIG. 01 — {props.lang === "ko" ? "이 블로그의 연결" : "How this site connects"}</span>
        <span>
          <Show when={hover()} fallback={caption()}>
            {(n) => n().label}
          </Show>
        </span>
      </figcaption>
    </figure>
  )
}
