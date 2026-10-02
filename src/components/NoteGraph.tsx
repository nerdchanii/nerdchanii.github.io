import { useNavigate } from "@solidjs/router"
import { createSignal, For, onCleanup, onMount } from "solid-js"
import type { Entry } from "../lib/content.ts"
import { arm, play } from "../lib/draw.ts"
import { layoutGraph, type Graph } from "../lib/graph.ts"
import "../styles/note-graph.css"

/*
 * 글 사이의 연결. 점은 글(그 글로 가는 링크), 선은 연결이다.
 *   색 줄 → 같은 폴더의 글을 꿴다, 먹색 호 → 본문에서 건 링크, 옅은 호 → 같은 태그
 * 자리 계산은 lib/graph.ts. 서버가 SVG로 그려 두므로 스크립트 없이도 보이고 눌린다.
 * 넓은 판(세 열)과 좁은 판(한 열)을 함께 그려 두고 CSS가 화면 폭에 맞는 쪽만 보여 준다.
 * `entries`에는 묶음 이름을 읽을 폴더 index도 함께 넘긴다.
 */
export default function NoteGraph(props: { entries: Entry[] }) {
  // 난수 없이 자리를 정하므로 서버와 브라우저가 같은 그림을 그린다
  const wide = layoutGraph(props.entries, 3)
  const tall = layoutGraph(props.entries, 1)
  const navigate = useNavigate()
  /** 올려 두었거나 초점이 간 글 */
  const [focus, setFocus] = createSignal<string | null>(null)
  let root!: HTMLElement

  onMount(() => {
    // 지금 보이는 판만 숨겼다 그린다. 가려진 판은 그대로 두어서 창 폭이 바뀌면 바로 보인다
    const boards = [...root.querySelectorAll("svg")].filter((el) => el.getClientRects().length)
    for (const board of boards) arm(board)
    const io = new IntersectionObserver(
      (seen) => {
        if (!seen.some((e) => e.isIntersecting)) return
        io.disconnect()
        for (const board of boards) play(board)
      },
      { threshold: 0.15 },
    )
    io.observe(root)
    onCleanup(() => io.disconnect())
  })

  function Board(p: { graph: Graph; class: string }) {
    const g = p.graph
    const lit = (url: string) => focus() === url || g.near.get(focus() ?? "")?.has(url) === true
    return (
      <svg class={`ln ${p.class}`} viewBox={`0 0 ${g.width} ${g.height}`}>
        <For each={g.groups}>
          {(group) => (
            <g>
              <line
                class="ng-spine"
                style={{ "--c": group.color }}
                x1={group.x}
                y1={group.y + 3.5}
                x2={group.x}
                y2={group.y2}
              />
              <rect class="paper thin" x={group.x - 3.5} y={group.y - 3.5} width="7" height="7" />
              <text class="ng-head" x={group.x + g.labelX} y={group.y} dy="0.35em">
                {group.name}
              </text>
            </g>
          )}
        </For>
        <For each={g.edges}>
          {(edge) => (
            <g class="ng-edge" classList={{ on: focus() === edge.a || focus() === edge.b }}>
              <path class={edge.kind === "link" ? "thin" : "ng-tie"} d={edge.d} />
            </g>
          )}
        </For>
        <For each={g.dots}>
          {(dot, i) => (
            // 맨 바깥이 <g>여야 Solid가 안쪽 <a>를 SVG 요소로 만든다 (<a>만 있으면 HTML 링크가 된다)
            <g>
              <a
                class="ng-node"
                classList={{ on: lit(dot.url) }}
                href={dot.url}
                aria-label={dot.title}
                data-nodraw
                style={{ "--d": `${(0.45 + Math.min(i(), 30) * 0.06).toFixed(2)}s` }}
                onPointerEnter={() => setFocus(dot.url)}
                onPointerLeave={() => setFocus(null)}
                onFocus={() => setFocus(dot.url)}
                onBlur={() => setFocus(null)}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                  e.preventDefault()
                  navigate(dot.url)
                }}
              >
                {/* 점과 이름표를 함께 덮는, 보이지 않는 누르는 자리 */}
                <rect
                  class="ng-hit"
                  x={dot.x - 14}
                  y={dot.y - 13}
                  width={14 + g.labelX + dot.labelWidth + 6}
                  height={26 + (dot.lines.length - 1) * 16}
                />
                <g class="ng-dot" style={{ "transform-origin": `${dot.x}px ${dot.y}px` }}>
                  <circle class="paper" cx={dot.x} cy={dot.y} r={dot.r} />
                </g>
                <text class="ng-label" x={dot.x + g.labelX} y={dot.y} dy="0.35em">
                  {dot.lines[0]}
                </text>
                <text class="ng-label" x={dot.x + g.labelX} y={dot.y + 16} dy="0.35em">
                  {dot.lines[1] ?? ""}
                </text>
              </a>
            </g>
          )}
        </For>
      </svg>
    )
  }

  return (
    <figure
      class="note-graph"
      classList={{ focused: focus() !== null }}
      aria-label="노트 사이의 연결"
      ref={root}
    >
      <Board graph={wide} class="ng-wide" />
      <Board graph={tall} class="ng-tall" />
    </figure>
  )
}
