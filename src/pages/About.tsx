import { A } from "@solidjs/router"
import { For } from "solid-js"
import Cast from "../components/Cast.tsx"
import Seo from "../components/Seo.tsx"
import { draw } from "../lib/draw.ts"
import { localize, type Lang } from "../lib/i18n.ts"
import { ABOUT_INTRO, IDENTITIES, PRINCIPLES, TIMELINE } from "../lib/profile.ts"
import { GITHUB_URL } from "../lib/site.ts"
import "../styles/pages-line.css"

/** 번호를 담은 선 도형. 축은 원, 일하는 방식은 네모 */
const Num = (props: { shape: "circle" | "square"; label: string }) => (
  <svg class="ln mark" viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
    {props.shape === "circle" ? (
      <circle class="thin" cx="14" cy="14" r="12" />
    ) : (
      <rect class="thin" x="2" y="2" width="24" height="24" />
    )}
    <text class="f" x="14" y="17.5">
      {props.label}
    </text>
  </svg>
)

/** 연혁의 레일 위에 놓는 속이 빈 점 */
const Dot = () => (
  <svg class="ln mark" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <circle class="paper" cx="8" cy="8" r="5" />
  </svg>
)

export default function About(props: { lang: Lang }) {
  const t = (text: Record<Lang, string>) => text[props.lang]
  const ko = () => props.lang === "ko"

  return (
    <div class="page page-line">
      <Seo
        title="About"
        description={t(ABOUT_INTRO[0])}
        path={localize(props.lang, "/about")}
        lang={props.lang}
        bilingual
      />

      <header class="page-head with-cast">
        <div>
          <p class="eyebrow">§ 4 — ABOUT</p>
          <h1>{ko() ? "김예찬" : "Yechan Kim"}</h1>
          <p class="page-sub">nerdchanii</p>
        </div>
        {/* 크기는 CSS(.head-cast)가 화면 폭에 맞춰 정한다 */}
        <Cast who="laptop" height={168} class="head-cast" />
      </header>

      <section class="split">
        <p class="eyebrow">{ko() ? "소개" : "INTRO"}</p>
        <div class="split-body lead">
          <For each={ABOUT_INTRO}>{(p) => <p>{t(p)}</p>}</For>
        </div>
      </section>

      <section ref={draw} class="split">
        <p class="eyebrow">{ko() ? "세 가지 축" : "THREE AXES"}</p>
        <ol class="axis-list split-body">
          <For each={IDENTITIES}>
            {(item) => (
              <li>
                <Num shape="circle" label={item.key} />
                <span class="eyebrow">{item.label}</span>
                <span>{t(item.line)}</span>
              </li>
            )}
          </For>
        </ol>
      </section>

      <section ref={draw} class="split">
        <p class="eyebrow">{ko() ? "일하는 방식" : "HOW I WORK"}</p>
        <div class="principles split-body">
          <For each={PRINCIPLES}>
            {(item, i) => (
              <div>
                <Num shape="square" label={`P${i() + 1}`} />
                <h3>{t(item.title)}</h3>
                <p>{t(item.body)}</p>
              </div>
            )}
          </For>
        </div>
      </section>

      <section ref={draw} class="split">
        <p class="eyebrow">{ko() ? "지나온 길" : "PATH"}</p>
        <ol class="timeline split-body">
          <For each={TIMELINE}>
            {(item, n) => (
              <li style={{ "--i": n() }}>
                <Dot />
                <span class="eyebrow">{item.when}</span>
                <span>{t(item.what)}</span>
              </li>
            )}
          </For>
        </ol>
      </section>

      <section ref={draw} class="split">
        <p class="eyebrow">{ko() ? "연락" : "CONTACT"}</p>
        <div class="split-body">
          <p>
            {ko()
              ? "이슈, PR, 협업 제안 모두 GitHub로 편하게 연락 주세요."
              : "Issues, PRs, or collaboration ideas — reach me on GitHub."}
          </p>
          <p class="link-row">
            <a href={GITHUB_URL} rel="noopener">
              GitHub ↗
            </a>
            <a href="/index.xml">RSS ↗</a>
            <A href={localize(props.lang, "/work")}>{ko() ? "작업 보기 →" : "See work →"}</A>
          </p>
        </div>
      </section>
    </div>
  )
}
