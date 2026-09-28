import { A } from "@solidjs/router"
import { For } from "solid-js"
import Seo from "../components/Seo.tsx"
import { localize, type Lang } from "../lib/i18n.ts"
import { ABOUT_INTRO, IDENTITIES, PRINCIPLES, TIMELINE } from "../lib/profile.ts"
import { GITHUB_URL } from "../lib/site.ts"

export default function About(props: { lang: Lang }) {
  const t = (text: Record<Lang, string>) => text[props.lang]
  const ko = () => props.lang === "ko"

  return (
    <div class="page">
      <Seo
        title="About"
        description={t(ABOUT_INTRO[0])}
        path={localize(props.lang, "/about")}
        lang={props.lang}
        bilingual
      />

      <header class="page-head">
        <p class="eyebrow">§ 1 — ABOUT</p>
        <h1>{ko() ? "김예찬" : "Yechan Kim"}</h1>
        <p class="page-sub">nerdchanii</p>
      </header>

      <section class="split">
        <p class="eyebrow">{ko() ? "소개" : "INTRO"}</p>
        <div class="split-body lead">
          <For each={ABOUT_INTRO}>{(p) => <p>{t(p)}</p>}</For>
        </div>
      </section>

      <section class="split">
        <p class="eyebrow">{ko() ? "세 가지 축" : "THREE AXES"}</p>
        <ol class="axis-list split-body">
          <For each={IDENTITIES}>
            {(item) => (
              <li>
                <span class="eyebrow">
                  {item.key} · {item.label}
                </span>
                <span>{t(item.line)}</span>
              </li>
            )}
          </For>
        </ol>
      </section>

      <section class="split">
        <p class="eyebrow">{ko() ? "일하는 방식" : "HOW I WORK"}</p>
        <div class="principles split-body">
          <For each={PRINCIPLES}>
            {(item, i) => (
              <div>
                <p class="eyebrow">P{i() + 1}</p>
                <h3>{t(item.title)}</h3>
                <p>{t(item.body)}</p>
              </div>
            )}
          </For>
        </div>
      </section>

      <section class="split">
        <p class="eyebrow">{ko() ? "지나온 길" : "PATH"}</p>
        <ol class="timeline split-body">
          <For each={TIMELINE}>
            {(item) => (
              <li>
                <span class="eyebrow">{item.when}</span>
                <span>{t(item.what)}</span>
              </li>
            )}
          </For>
        </ol>
      </section>

      <section class="split">
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
