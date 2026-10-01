import { For } from "solid-js"
import { draw } from "../lib/draw.ts"
import SmartLink from "../components/SmartLink.tsx"
import Seo from "../components/Seo.tsx"
import { localize, type Lang } from "../lib/i18n.ts"
import { CONTRIBUTIONS, EXPERIMENTS, SELECTED_WORKS } from "../lib/profile.ts"
import "../styles/pages-line.css"

const STEPS = [
  { key: "problem", ko: "증상", en: "SYMPTOM" },
  { key: "insight", ko: "원인 · 판단", en: "CAUSE" },
  { key: "decision", ko: "결정", en: "DECISION" },
  { key: "result", ko: "결과", en: "RESULT" },
] as const

/** 단계마다 레일 위에 놓는 속이 빈 원. 뒤의 레일을 가리도록 바탕색으로 채운다 */
const Dot = () => (
  <svg class="ln mark" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <circle class="paper" cx="8" cy="8" r="6" />
  </svg>
)

export default function Work(props: { lang: Lang }) {
  const t = (text: Record<Lang, string>) => text[props.lang]
  const ko = () => props.lang === "ko"

  return (
    <div class="page page-line">
      <Seo
        title="Work"
        description={
          ko()
            ? "대표작 네 개와 오픈소스 기여, 진행 중인 실험"
            : "Selected works, open-source contributions, and experiments"
        }
        path={localize(props.lang, "/work")}
        lang={props.lang}
        bilingual
      />

      <header class="page-head">
        <p class="eyebrow">§ 2 — WORK</p>
        <h1>{ko() ? "증상에서 결정까지" : "From symptom to decision"}</h1>
        <p class="page-sub">
          {ko()
            ? "모든 항목을 증상 → 원인 → 결정 → 결과 순서로 적고, 확인할 수 있는 링크를 붙였습니다."
            : "Every entry reads symptom → cause → decision → result, with links you can check."}
        </p>
      </header>

      <section class="works">
        <For each={SELECTED_WORKS}>
          {(work, i) => (
            <article ref={draw} class="work" id={work.id}>
              <header class="work-head">
                <p class="eyebrow">
                  W{String(i() + 1).padStart(2, "0")} · {work.period}
                </p>
                <h2>{work.title}</h2>
                <ul class="chips">
                  <For each={work.tags}>{(tag) => <li>{tag}</li>}</For>
                </ul>
              </header>
              {/* 증상에서 결과까지를 세로 선 하나로 잇는다. 레일은 CSS(.flow::before), 표식과 화살촉은 선 그림 */}
              <div class="flow">
                <dl class="steps">
                  <For each={STEPS}>
                    {(step, n) => (
                      <div style={{ "--i": n() }}>
                        <dt class="eyebrow">
                          <Dot />
                          <span>{step[props.lang]}</span>
                        </dt>
                        <dd>{t(work[step.key])}</dd>
                      </div>
                    )}
                  </For>
                </dl>
                <svg
                  class="ln flow-end"
                  viewBox="0 0 16 10"
                  width="16"
                  height="10"
                  aria-hidden="true"
                >
                  <path d="M2 1 L8 9 L14 1" />
                </svg>
              </div>
              <p class="link-row">
                <For each={work.links}>
                  {(link) => (
                    <SmartLink href={link.href}>
                      {link.label} {/^https?:/.test(link.href) ? "↗" : "→"}
                    </SmartLink>
                  )}
                </For>
              </p>
            </article>
          )}
        </For>
      </section>

      <section ref={draw} class="split" id="open-source">
        <p class="eyebrow">{ko() ? "오픈소스" : "OPEN SOURCE"}</p>
        <ul class="ledger split-body">
          <For each={CONTRIBUTIONS}>
            {(item) => (
              <li>
                <a href={item.href} rel="noopener">
                  <span class="eyebrow">
                    {item.repo} {item.ref}
                  </span>
                  <span>{item.title}</span>
                  <span class="eyebrow status">{item.status}</span>
                </a>
              </li>
            )}
          </For>
        </ul>
      </section>

      <section ref={draw} class="split">
        <p class="eyebrow">{ko() ? "실험과 팀 프로젝트" : "EXPERIMENTS"}</p>
        <ul class="ledger split-body">
          <For each={EXPERIMENTS}>
            {(item) => (
              <li>
                <SmartLink href={item.href}>
                  <span class="eyebrow">{item.title}</span>
                  <span>{t(item.line)}</span>
                  <span class="eyebrow status">{t(item.status)}</span>
                </SmartLink>
              </li>
            )}
          </For>
        </ul>
      </section>
    </div>
  )
}
