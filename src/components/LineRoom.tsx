import { useNavigate } from "@solidjs/router"
import { createUniqueId, For, type JSX, Show } from "solid-js"
import { years } from "virtual:timeline"
import { CAST, CAST_SIZE, type CastKind } from "../lib/cast.ts"
import { posts } from "../lib/content.ts"
import { draw } from "../lib/draw.ts"
import { localize, type Lang } from "../lib/i18n.ts"
import { SELECTED_WORKS } from "../lib/profile.ts"
import { spineColor } from "../lib/shelf.ts"
import { GITHUB_URL, LINKEDIN_URL } from "../lib/site.ts"
import "../styles/line-room.css"

/*
 * 홈의 방. 선으로 그린 정면 그림이고, 물건 하나하나가 사이트의 한 곳으로 가는 링크다.
 *   책장 → 글, 게시판 → 아래 타임라인, 책상 → 가장 최근 글, 진열장 → 작업,
 *   차니 → 소개, 우편함 → GitHub, 명패 → LinkedIn
 * 그림은 1000×330 좌표에 그려서 폭에 맞게 줄어든다. 이름표는 늘 보이고, 올려 두면 물건이 톡 올라온다.
 */

type Text = Record<Lang, string>

const yearRange = () => {
  const list = years.map((y) => y.year)
  return `${Math.min(...list)} — ${Math.max(...list)}`
}

/** 그림 안에 넣는 등장인물. 발이 (x, 바닥선)에 닿게 놓는다 */
function Actor(props: { who: CastKind; x: number; floor: number; height: number }) {
  const id = createUniqueId()
  const [w, h] = CAST_SIZE[props.who]
  const width = (props.height * w) / h
  return (
    <svg
      class="cast"
      x={props.x - width / 2}
      y={props.floor - props.height}
      width={width}
      height={props.height}
      viewBox={`0 0 ${w} ${h}`}
      innerHTML={CAST[props.who](id)}
    />
  )
}

export default function LineRoom(props: { lang: Lang }) {
  const navigate = useNavigate()
  const t = (text: Text) => text[props.lang]
  const latest = posts[0]
  // 책장에 꽂는 책: 최근 글부터, 위 칸 다섯 권과 아래 칸 여섯 권
  const top = posts.slice(0, 5)
  const bottom = posts.slice(5, 11)

  /** 사이트 안 주소는 새로 불러오지 않고 옮긴다 */
  function Thing(p: { href: string; label: string; x: number; y: number; children: JSX.Element }) {
    const inside = p.href.startsWith("/") || p.href.startsWith("#")
    // 맨 바깥이 <g>여야 Solid가 안쪽 <a>를 SVG 요소로 만든다 (<a>만 있으면 HTML 링크가 된다)
    return (
      <g>
        <a
          class="thing"
          href={p.href}
          rel={inside ? undefined : "noopener"}
          onClick={(e) => {
            if (!inside || p.href.startsWith("#")) return
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
            e.preventDefault()
            navigate(p.href)
          }}
        >
          <g class="thing-art">{p.children}</g>
          <text class="thing-label" x={p.x} y={p.y} text-anchor="middle">
            {p.label}
          </text>
        </a>
      </g>
    )
  }

  const books = (list: typeof posts, x0: number, floor: number) => {
    let x = x0
    return (
      <For each={list}>
        {(entry, i) => {
          const w = 12 + Math.min(8, Math.round(Math.sqrt(entry.chars) / 16))
          const h = 40 + ((i() * 7) % 4) * 4
          const at = x
          x += w + 2
          return (
            <>
              <rect x={at} y={floor - h} width={w} height={h} class="paper" />
              <line
                x1={at + 2}
                y1={floor - h + 7}
                x2={at + w - 2}
                y2={floor - h + 7}
                style={{ stroke: spineColor(entry.url), "stroke-width": "2.5" }}
              />
            </>
          )
        }}
      </For>
    )
  }

  return (
    <section class="line-room" aria-label={t({ ko: "차니의 방", en: "Chanii's room" })} ref={draw}>
      <svg class="ln" viewBox="0 0 1000 330">
        {/* 바닥과 걸레받이 */}
        <line x1="0" y1="280" x2="1000" y2="280" />
        <line class="soft" x1="0" y1="266" x2="1000" y2="266" />

        {/* 창 */}
        <rect x="40" y="52" width="104" height="96" />
        <line class="soft" x1="92" y1="52" x2="92" y2="148" />
        <line class="soft" x1="40" y1="100" x2="144" y2="100" />
        <path class="soft" d="M54 130 C68 108 84 124 92 110 M100 92 c8 -10 20 -6 22 4" />

        {/* 책장 → 글 */}
        <Thing
          href="/blog"
          label={t({ ko: `글 ${posts.length}편`, en: `${posts.length} posts` })}
          x={279}
          y={58}
        >
          <rect x="194" y="70" width="170" height="196" class="paper" />
          <line x1="194" y1="136" x2="364" y2="136" />
          <line x1="194" y1="202" x2="364" y2="202" />
          {books(top, 206, 136)}
          {books(bottom, 206, 202)}
          <path d="M312 202 L316 178 L342 178 L346 202" />
          <path
            class="soft"
            d="M329 178 C326 164 318 158 310 158 M329 178 C332 162 340 156 348 156"
          />
          <path class="soft" d="M208 262 h60 M212 254 h52 M208 246 h58" />
        </Thing>

        {/* 게시판 → 타임라인 */}
        <Thing href="#timeline" label={yearRange()} x={625} y={44}>
          <rect x="550" y="56" width="150" height="92" class="paper" />
          <rect class="soft" x="564" y="70" width="34" height="26" />
          <rect class="soft" x="612" y="80" width="30" height="34" />
          <rect class="soft" x="656" y="68" width="30" height="24" />
          <rect class="soft" x="570" y="110" width="28" height="24" />
          <path class="soft" d="M581 70 L627 80 L671 68 M627 114 L584 110" />
        </Thing>

        {/* 책상 → 가장 최근 글 */}
        <Show when={latest}>
          <Thing href={latest.url} label={t({ ko: "최근 글", en: "Latest" })} x={625} y={236}>
            <rect x="520" y="196" width="210" height="8" class="paper" />
            <line x1="536" y1="204" x2="536" y2="266" />
            <line x1="714" y1="204" x2="714" y2="266" />
            <rect x="590" y="158" width="62" height="38" rx="2" class="paper" />
            <path class="soft" d="M600 170 h30 M600 178 h42 M600 186 h22" />
            <line x1="580" y1="196" x2="662" y2="196" />
            <path d="M680 196 v-16 h18 v16" />
            <path class="soft" d="M698 184 c8 0 8 9 0 9 M686 174 c-3 -5 3 -7 0 -12" />
          </Thing>
        </Show>

        {/* 진열장 → 작업 */}
        <Thing
          href={localize(props.lang, "/work")}
          label={t({
            ko: `작업 ${SELECTED_WORKS.length}개`,
            en: `${SELECTED_WORKS.length} works`,
          })}
          x={825}
          y={98}
        >
          <rect x="770" y="110" width="110" height="156" class="paper" />
          <line x1="770" y1="162" x2="880" y2="162" />
          <line x1="770" y1="214" x2="880" y2="214" />
          <line class="soft" x1="825" y1="110" x2="825" y2="266" />
          <path d="M786 162 v-6 h14 v6 M788 156 c-6 -4 -6 -16 0 -18 h10 c6 2 6 14 0 18" />
          <rect class="soft" x="838" y="140" width="24" height="22" />
          <circle class="soft" cx="796" cy="198" r="10" />
          <path class="soft" d="M840 214 l10 -22 l10 22" />
        </Thing>

        {/* 우편함 → GitHub */}
        <Thing href={GITHUB_URL} label="GitHub" x={938} y={196}>
          <line x1="938" y1="232" x2="938" y2="280" />
          <path class="paper" d="M916 232 V216 C916 206 960 206 960 216 V232 Z" />
          <path class="soft" d="M926 222 h24" />
          <path d="M960 214 v-12 h9 v6 h-9" />
        </Thing>

        {/* 명패 → LinkedIn */}
        <Show when={LINKEDIN_URL}>
          <Thing href={LINKEDIN_URL} label="LinkedIn" x={92} y={222}>
            <path d="M74 280 L82 236 M110 280 L102 236" />
            <rect x="72" y="232" width="40" height="30" class="paper" />
            <path class="soft" d="M82 242 v12 M82 240 v0.5 M90 254 v-8 c0 -5 9 -5 9 0 v8" />
          </Thing>
        </Show>

        {/* 러그와 등장인물 */}
        <ellipse class="soft" cx="446" cy="298" rx="96" ry="12" />
        <Thing
          href={localize(props.lang, "/about")}
          label={t({ ko: "차니", en: "Chanii" })}
          x={446}
          y={326}
        >
          <Actor who="wave" x={446} floor={302} height={196} />
        </Thing>
        <Actor who="jindo" x={748} floor={304} height={84} />
      </svg>
    </section>
  )
}
