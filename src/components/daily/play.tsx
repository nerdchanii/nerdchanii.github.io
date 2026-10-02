/**
 * Daily AI 회차의 누르는 부품: 빈칸, 문제, 도장.
 * 서버가 만든 화면은 아직 아무것도 누르지 않은 상태이고, 브라우저에서 이어받아 움직인다.
 */
import { createSignal, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import Sprite from "./Sprite.tsx"

/** 오늘의 세 줄에 넣는 빈칸. 누르면 답이 열린다 */
export function Blank(props: { a: string }) {
  const [open, setOpen] = createSignal(false)
  return (
    <button
      type="button"
      class="da-blank"
      classList={{ "da-blank-open": open() }}
      aria-label={open() ? undefined : "빈칸 열기"}
      disabled={open()}
      onClick={() => setOpen(true)}
    >
      {open() ? props.a : ""}
    </button>
  )
}

/** 문제를 다 풀었는지. 문제(Quiz)가 쓰고 도장(Finish)이 읽는다 */
const [solved, setSolved] = createStore<Record<string, boolean>>({})

export type QuizItem = {
  /** 질문 */
  q: string
  /** 정답 보기의 위치 (0부터) */
  a: number
  /** [보기, 이 보기가 왜 맞거나 틀린지] */
  o: [string, string][]
}

function Question(props: { item: QuizItem; index: number; onAnswer: (right: boolean) => void }) {
  const [picked, setPicked] = createSignal<number | null>(null)
  const pick = (i: number) => {
    if (picked() !== null) return
    setPicked(i)
    props.onAnswer(i === props.item.a)
  }
  return (
    <fieldset class="da-q">
      <legend>
        {props.index + 1}. {props.item.q}
      </legend>
      <div class="da-opts">
        <For each={props.item.o}>
          {([text, why], i) => (
            <div class="da-optwrap">
              <button
                type="button"
                class="da-opt"
                classList={{
                  "da-opt-right": picked() !== null && i() === props.item.a,
                  "da-opt-wrong": picked() === i() && i() !== props.item.a,
                }}
                disabled={picked() !== null}
                onClick={() => pick(i())}
              >
                {text}
                <Show when={picked() !== null && i() === props.item.a}>
                  <span class="da-opt-tag">정답</span>
                </Show>
                <Show when={picked() === i() && i() !== props.item.a}>
                  <span class="da-opt-tag">오답</span>
                </Show>
              </button>
              <Show when={picked() !== null}>
                <p
                  class="da-why"
                  classList={{
                    "da-why-right": i() === props.item.a,
                    "da-why-picked": picked() === i() && i() !== props.item.a,
                  }}
                >
                  {why}
                </p>
              </Show>
            </div>
          )}
        </For>
      </div>
    </fieldset>
  )
}

/** 오늘의 문제. 보기를 누르면 모든 보기의 해설이 열린다 */
export function Quiz(props: { id: string; items: QuizItem[]; cheer?: string }) {
  const [done, setDone] = createSignal(0)
  const [right, setRight] = createSignal(0)
  const answer = (ok: boolean) => {
    setDone(done() + 1)
    if (ok) setRight(right() + 1)
    if (done() === props.items.length) setSolved(props.id, true)
  }
  return (
    <div class="da-quiz">
      <For each={props.items}>
        {(item, i) => <Question item={item} index={i()} onAnswer={answer} />}
      </For>
      <Show when={done() > 0}>
        <p class="da-score" aria-live="polite">
          {done()} / {props.items.length} 풀었고 {right()}개 맞았어요.
        </p>
      </Show>
      <Show when={done() === props.items.length && right() === props.items.length}>
        <div class="da-cheer">
          <Sprite name={props.cheer ?? "jindo-excited"} height={96} />
          <p>다 맞혔어요! 진도가 폴짝 뛰어요.</p>
        </div>
      </Show>
    </div>
  )
}

/** 도장. 같은 id의 문제를 다 풀면 찍힌다 */
export function Finish(props: { quiz: string; sprite?: string }) {
  const stamped = () => solved[props.quiz] === true
  return (
    <div class="da-finish" classList={{ "da-finish-done": stamped() }}>
      <Sprite name={props.sprite ?? "jindo-sit"} height={96} />
      <div>
        <strong>
          {stamped()
            ? "다 읽었어요. 진도가 도장을 찍었어요."
            : "끝까지 읽으면 진도가 도장을 찍어 드려요."}
        </strong>
        <p>문제까지 다 풀면 찍혀요.</p>
      </div>
    </div>
  )
}
