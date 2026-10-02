/**
 * Daily AI 회차의 움직이지 않는 부품. 글(MDX)에서 그대로 불러 쓴다.
 * 제목, 문단, 목록, 표는 마크다운으로 쓰고, 여기 있는 것은 그 사이에 끼우는 덩어리다.
 * 스타일은 src/styles/daily-ai.css에 있고 클래스는 모두 `da-`로 시작한다.
 */
import { For, Show, type JSX } from "solid-js"
import Sprite from "./Sprite.tsx"

/** 오늘의 핵심: 회차에서 가장 먼저 읽히는 상자. 안에는 번호 목록을 쓴다 */
export function Core(props: { children: JSX.Element }) {
  return <div class="da-core">{props.children}</div>
}

/** 표지 장면: 왼쪽에 진행하는 인물, 오른쪽에 이름표가 붙은 그림들 */
export function Scene(props: {
  /** [그림 이름, 높이, 이름표] */
  us: [string, number, string?][]
  /** [그림 이름, 이름표] */
  bots: [string, string][]
  caption?: string
}) {
  return (
    <figure class="da-scene">
      <div class="da-scene-stage">
        <div class="da-scene-us">
          <For each={props.us}>
            {([name, height, label]) => (
              <span class="da-scene-bot">
                <Sprite name={name} height={height} />
                <Show when={label}>
                  <b>{label}</b>
                </Show>
              </span>
            )}
          </For>
        </div>
        <div class="da-scene-bots">
          <For each={props.bots}>
            {([name, label]) => (
              <span class="da-scene-bot">
                <Sprite name={name} height={84} />
                <b>{label}</b>
              </span>
            )}
          </For>
        </div>
      </div>
      <Show when={props.caption}>
        <figcaption>{props.caption}</figcaption>
      </Show>
    </figure>
  )
}

/**
 * 말풍선. `sprite`에 목록을 주면 여럿이 나란히 서서 말한다. 목록에서는 `[이름, 높이]`로 키를 따로 줄 수 있다.
 * 실존 인물의 그림에는 그 사람이 하지 않은 말을 붙이지 않는다.
 */
export function Hook(props: {
  who: string
  sprite: string | (string | [string, number])[]
  side?: "left" | "right"
  height?: number
  compact?: boolean
  children: JSX.Element
}) {
  const sprites = (): [string, number][] =>
    (Array.isArray(props.sprite) ? props.sprite : [props.sprite]).map((s) =>
      typeof s === "string" ? [s, props.height ?? 96] : s,
    )
  return (
    <div
      class="da-hook"
      classList={{ "da-hook-right": props.side === "right", "da-hook-compact": props.compact }}
    >
      <span class="da-hook-sprites">
        <For each={sprites()}>{([name, height]) => <Sprite name={name} height={height} />}</For>
      </span>
      <div class="da-hook-bubble">
        <b>{props.who}</b>
        <div class="da-hook-text">{props.children}</div>
      </div>
    </div>
  )
}

/** 무엇이 달라지나: 지금까지와 이제부터를 나란히 놓는다 */
export function Diff(props: {
  title: string
  beforeLabel: string
  before: string
  afterLabel: string
  after: string
}) {
  return (
    <div class="da-diff">
      <p class="da-diff-title">{props.title}</p>
      <div class="da-diff-row">
        <div class="da-diff-was">
          <small>{props.beforeLabel}</small>
          {props.before}
        </div>
        <span class="da-diff-arrow" aria-hidden="true">
          &gt;&gt;
        </span>
        <div class="da-diff-now">
          <small>{props.afterLabel}</small>
          {props.after}
        </div>
      </div>
    </div>
  )
}

/** 시간 순서로 놓인 칸. [언제, 무엇, 한 줄 설명] */
export function Flow(props: { items: [string, string, string][] }) {
  return (
    <ol class="da-flow">
      <For each={props.items}>
        {([when, title, note]) => (
          <li>
            <span class="da-flow-when">{when}</span>
            <strong>{title}</strong>
            <span>{note}</span>
          </li>
        )}
      </For>
    </ol>
  )
}

/** 나란한 항목 두세 개 */
export function Cards(props: { children: JSX.Element }) {
  return <div class="da-cards">{props.children}</div>
}

export function Card(props: { title: string; children: JSX.Element }) {
  return (
    <div class="da-card">
      <strong>{props.title}</strong>
      <div>{props.children}</div>
    </div>
  )
}

/** 회차에서 가장 중요한 문장. 한 회차에 한두 개만 쓴다 */
export function Key(props: { children: JSX.Element }) {
  return <div class="da-key">{props.children}</div>
}

/** 사실이 아니라 글쓴이의 읽기임을 밝히는 상자 */
export function Note(props: { children: JSX.Element }) {
  return <div class="da-note">{props.children}</div>
}

/** 인용 카드 묶음 */
export function Quotes(props: { children: JSX.Element }) {
  return <div class="da-quotes">{props.children}</div>
}

/** 실제로 한 말과 그에 대한 풀이. 그림은 누구의 말인지 보여 줄 뿐 대사를 하지 않는다 */
export function Quote(props: {
  sprite: string
  who: string
  quote: string
  children: JSX.Element
}) {
  return (
    <div class="da-quote">
      <Sprite name={props.sprite} height={96} />
      <strong>{props.who}</strong>
      <q>
        <span>{props.quote}</span>
      </q>
      <div class="da-quote-read">{props.children}</div>
    </div>
  )
}

/** 구역 끝의 출처 줄. 안에 마크다운 링크를 나열한다 */
export function Refs(props: { children: JSX.Element }) {
  return (
    <div class="da-refs">
      <b>ref</b>
      {props.children}
    </div>
  )
}
