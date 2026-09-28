import { A } from "@solidjs/router"
import { For, Show } from "solid-js"
import Illustration from "../components/Illustration.tsx"
import NoteGraph from "../components/NoteGraph.tsx"
import Seo from "../components/Seo.tsx"
import SmartLink, { isExternal } from "../components/SmartLink.tsx"
import { posts } from "../lib/content.ts"
import { localize, type Lang } from "../lib/i18n.ts"
import { ESSAY, IDENTITIES, INDEX_CARDS, MANIFESTO, TICKER } from "../lib/profile.ts"

/** 사이트 안 링크는 언어에 맞는 경로로, 글(한국어만 있음)과 바깥 링크는 그대로 */
const hrefFor = (lang: Lang, href: string) =>
  isExternal(href) || !["/about", "/work"].some((p) => href.startsWith(p))
    ? href
    : localize(lang, href)

export default function Home(props: { lang: Lang }) {
  const t = (text: Record<Lang, string>) => text[props.lang]
  const count = (section: string) => posts.filter((p) => p.section === section).length

  return (
    <div class="home">
      <Seo
        path={localize(props.lang, "/")}
        lang={props.lang}
        bilingual
        description={`${t(MANIFESTO.lead)} ${t(MANIFESTO.rest)}`}
      />

      <section class="hero">
        <div class="hero-text">
          <p class="eyebrow">INDEX 00 — MANIFEST</p>
          <h1 class="manifesto">
            <span>{t(MANIFESTO.lead)}</span> <span class="manifesto-rest">{t(MANIFESTO.rest)}</span>
          </h1>
        </div>
        <NoteGraph lang={props.lang} />
      </section>

      <ol class="identities">
        <For each={IDENTITIES}>
          {(item) => (
            <li>
              <A href={hrefFor(props.lang, item.href)}>
                <span class="eyebrow">
                  {item.key} · {item.label}
                </span>
                <span>{t(item.line)}</span>
              </A>
            </li>
          )}
        </For>
      </ol>

      <div class="ticker" aria-hidden="true">
        <div class="ticker-track">
          <For each={[...TICKER, ...TICKER]}>{(item) => <span>{item}</span>}</For>
        </div>
      </div>

      <section class="essay">
        <p class="eyebrow">{t(ESSAY.label)}</p>
        <div class="essay-body">
          <blockquote>“{t(ESSAY.quote)}”</blockquote>
          <For each={ESSAY.body}>{(p) => <p>{t(p)}</p>}</For>
          <A class="more" href={localize(props.lang, "/about")}>
            {t(ESSAY.more)} →
          </A>
        </div>
      </section>

      <section class="index">
        <header class="index-head">
          <p class="eyebrow">INDEX — {INDEX_CARDS.length} ENTRIES</p>
          <p class="eyebrow">↓ {props.lang === "ko" ? "들어갈 곳 고르기" : "PICK A THREAD"}</p>
        </header>
        <div class="cards">
          <For each={INDEX_CARDS}>
            {(card) => (
              <SmartLink class="card" href={hrefFor(props.lang, card.href)}>
                <Illustration art={card.art} />
                <span class="card-key eyebrow">
                  {card.key}
                  <Show when={card.section}>{(section) => <> · {count(section())} POSTS</>}</Show>
                </span>
                <h2>{t(card.title)}</h2>
                <p>{t(card.line)}</p>
                <span class="card-foot eyebrow">
                  {props.lang === "ko" ? "열기" : "OPEN"} <span aria-hidden="true">→</span>
                </span>
              </SmartLink>
            )}
          </For>
        </div>
      </section>
    </div>
  )
}
