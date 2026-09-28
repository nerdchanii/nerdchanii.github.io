import { For, Match, Switch } from "solid-js"
import type { IndexCard } from "../lib/profile.ts"

/**
 * 목차 카드의 선 그림. 색은 currentColor만 쓰므로 라이트·다크 테마를 CSS가 정한다.
 * 모두 같은 viewBox(240×120)에 그려서 카드 높이가 맞는다.
 */
export default function Illustration(props: { art: IndexCard["art"] }) {
  return (
    <svg class="art" viewBox="0 0 240 120" aria-hidden="true" fill="none" stroke="currentColor">
      <Switch>
        <Match when={props.art === "boundary"}>
          <Boundary />
        </Match>
        <Match when={props.art === "graph"}>
          <Graph />
        </Match>
        <Match when={props.art === "oscillation"}>
          <Oscillation />
        </Match>
        <Match when={props.art === "curve"}>
          <Curve />
        </Match>
        <Match when={props.art === "timeline"}>
          <Timeline />
        </Match>
        <Match when={props.art === "branch"}>
          <Branch />
        </Match>
      </Switch>
    </svg>
  )
}

/** 에이전트가 혼자 도는 영역(점선 상자)과 사람에게 넘어가는 게이트 하나 */
function Boundary() {
  const inside = [
    [40, 40],
    [72, 78],
    [104, 36],
    [128, 70],
  ]
  return (
    <>
      <rect x="20" y="16" width="140" height="88" stroke-dasharray="4 4" opacity="0.5" />
      <path d="M40 40 L72 78 L104 36 L128 70" opacity="0.6" />
      <For each={inside}>{([x, y]) => <circle cx={x} cy={y} r="5" fill="currentColor" />}</For>
      <path d="M128 70 H196" />
      <rect x="156" y="58" width="8" height="24" fill="var(--bg)" />
      <circle cx="212" cy="60" r="6" />
      <path d="M198 88 q14 -24 28 0" />
    </>
  )
}

/** 대표작 네 개를 잇는 그래프 */
function Graph() {
  const nodes = [
    [36, 34, true],
    [96, 84, false],
    [150, 30, true],
    [206, 76, false],
    [70, 58, false],
    [180, 100, true],
  ] as const
  return (
    <>
      <path
        d="M36 34 L70 58 L96 84 L150 30 L206 76 L180 100 L96 84 M70 58 L150 30"
        opacity="0.45"
      />
      <For each={nodes}>
        {([x, y, filled]) => (
          <circle cx={x} cy={y} r={filled ? 6 : 5} fill={filled ? "currentColor" : "var(--bg)"} />
        )}
      </For>
    </>
  )
}

/** 두 카탈로그(V1/V2)가 캐시 하나를 번갈아 덮어쓰는 모양 */
function Oscillation() {
  return (
    <>
      <path d="M16 96 H224" opacity="0.3" />
      <path d="M16 72 H48 V36 H88 V72 H128 V36 H168 V72 H208 V36 H224" stroke-width="2" />
      <text x="20" y="28" class="art-label" fill="currentColor" stroke="none">
        V1
      </text>
      <text x="92" y="28" class="art-label" fill="currentColor" stroke="none">
        V2
      </text>
      <text x="16" y="112" class="art-label" fill="currentColor" stroke="none">
        models_cache.json
      </text>
    </>
  )
}

/** 정규분포 곡선과 축 */
function Curve() {
  const points = Array.from({ length: 49 }, (_, i) => {
    const x = -3 + (6 * i) / 48
    const y = Math.exp((-x * x) / 2)
    return `${(24 + (i / 48) * 192).toFixed(1)} ${(100 - y * 76).toFixed(1)}`
  })
  return (
    <>
      <path d="M16 100 H224 M120 16 V104" opacity="0.3" />
      <path d={`M${points.join(" L")}`} stroke-width="2" />
      <path d="M72 100 V70 M168 100 V70" stroke-dasharray="3 3" opacity="0.6" />
    </>
  )
}

/** 프로젝트가 끝날 때마다 찍히는 눈금 */
function Timeline() {
  const ticks = [28, 64, 112, 150, 206]
  return (
    <>
      <path d="M16 64 H224" />
      <For each={ticks}>
        {(x, i) => (
          <>
            <path d={`M${x} 56 V72`} />
            <rect
              x={x - 10}
              y={i() % 2 ? 80 : 24}
              width={i() === 4 ? 30 : 20 + (i() % 3) * 8}
              height="8"
              fill="currentColor"
              opacity={i() === 4 ? 1 : 0.35}
              stroke="none"
            />
          </>
        )}
      </For>
    </>
  )
}

/** 커밋 그래프: 가지를 내고 다시 합친다 */
function Branch() {
  return (
    <>
      <path d="M16 72 H224" />
      <path d="M64 72 C88 72 88 40 112 40 H152 C176 40 176 72 200 72" />
      <For each={[40, 64, 136, 200]}>{(x) => <circle cx={x} cy="72" r="5" fill="var(--bg)" />}</For>
      <For each={[112, 152]}>{(x) => <circle cx={x} cy="40" r="5" fill="currentColor" />}</For>
      <path d="M206 72 L224 72 M216 64 L224 72 L216 80" />
    </>
  )
}
