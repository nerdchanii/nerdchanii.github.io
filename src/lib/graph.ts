import type { Entry } from "./content.ts"
import { spineColor } from "./shelf.ts"
import { tagSlug } from "./tags.ts"

/**
 * 글 사이의 연결을 선 그림으로 놓는 자리 계산.
 *
 * 글은 폴더(가장 가까운 index)별로 묶어 세로로 한 줄씩 세운다. 점은 왼쪽, 이름표는 오른쪽이라
 * 이름표끼리 겹치지 않는다. 연결은 점 왼쪽으로 휘는 호로 긋는다.
 * 난수를 쓰지 않아서 서버가 그린 그림과 브라우저의 첫 그림이 같다.
 */

/** 한 줄의 높이. 모든 열이 같은 줄 눈금을 쓴다 (열을 건너는 선이 줄 사이로 지나가게) */
const PITCH = 30
/** 열 하나의 폭: 호가 휘는 자리 + 점 + 이름표 */
const COL = 340
/** 열 안에서 점이 서는 곳. 그 왼쪽은 호가 휘는 자리다 */
const DOT_X = 74
/** 점에서 이름표까지 */
const LABEL_GAP = 20
const TOP = 4
/** 이름표 글자 크기 (styles/note-graph.css의 .ng-label과 같아야 한다) */
const FONT = 13
/** 이름표 한 줄에 들어가는 폭 (글자 크기의 배수) */
const LABEL_EM = (COL - DOT_X - LABEL_GAP - 8) / FONT

export type GraphDot = {
  url: string
  title: string
  /** 이름표. 길면 두 줄로 나누고, 그래도 넘치면 줄인다 */
  lines: string[]
  x: number
  y: number
  r: number
  /** 이름표가 차지하는 폭 (누르는 자리의 크기) */
  labelWidth: number
  col: number
}

export type GraphGroup = {
  key: string
  name: string
  color: string
  x: number
  y: number
  /** 묶음의 줄이 끝나는 곳 (마지막 글) */
  y2: number
}

export type GraphEdge = {
  a: string
  b: string
  /** link: 본문에서 건 링크, tie: 같은 태그 */
  kind: "link" | "tie"
  d: string
}

export type Graph = {
  width: number
  height: number
  labelX: number
  groups: GraphGroup[]
  dots: GraphDot[]
  edges: GraphEdge[]
  /** 글 → 선으로 이어진 글 */
  near: Map<string, Set<string>>
}

/** localeCompare는 실행 환경을 타므로 코드 포인트로 비교한다 (lib/content.ts와 같은 이유) */
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
const round = (v: number) => Math.round(v * 10) / 10

/** 글꼴을 잴 수 없는 서버에서도 같은 값이 나오게 글자 폭을 어림한다 */
function em(ch: string): number {
  if (ch.codePointAt(0)! >= 0x1100) return 1
  if (ch === " ") return 0.28
  if (/[A-Z0-9]/.test(ch)) return 0.64
  if (/[a-z]/.test(ch)) return 0.55
  return 0.4
}

const widthOf = (text: string) => [...text].reduce((w, ch) => w + em(ch), 0)

function clip(text: string): string {
  if (widthOf(text) <= LABEL_EM) return text
  let out = ""
  for (const ch of text) {
    if (widthOf(out + ch) > LABEL_EM - 1) break
    out += ch
  }
  return `${out.trimEnd()}…`
}

function wrap(title: string): string[] {
  if (widthOf(title) <= LABEL_EM) return [title]
  const words = title.split(" ")
  let first = ""
  let used = 0
  for (const word of words) {
    const next = first ? `${first} ${word}` : word
    if (widthOf(next) > LABEL_EM) break
    first = next
    used++
  }
  // 첫 낱말부터 한 줄을 넘으면 나눌 곳이 없다
  if (!first) return [clip(title)]
  return [first, clip(words.slice(used).join(" "))]
}

/** 점의 크기: 글이 길수록 조금 크다 */
const radius = (chars: number) => round(4 + Math.min(4.5, Math.sqrt(chars) / 28))

/**
 * 두 점을 잇는 선.
 * 같은 열이면 점 왼쪽으로 휜다 (멀수록 깊게). 다른 열이면 왼쪽 글의 윗줄 틈을 따라 건너가서
 * 오른쪽 글에 왼편으로 닿는다. 줄 틈으로 지나가므로 이름표를 긋지 않는다.
 */
function route(a: GraphDot, b: GraphDot): string {
  const [from, to] =
    a.col === b.col ? (a.y <= b.y ? [a, b] : [b, a]) : a.col < b.col ? [a, b] : [b, a]
  const tx = to.x - to.r
  if (from.col === to.col) {
    const depth = Math.min(84, 18 + (12 * (to.y - from.y)) / PITCH)
    const fx = from.x - from.r
    return `M${fx} ${from.y}C${round(fx - depth)} ${from.y} ${round(tx - depth)} ${to.y} ${tx} ${to.y}`
  }
  const k = from.r * 0.7
  const sx = round(from.x + k)
  const lane = from.y - PITCH / 2
  const gate = to.col * COL + 6
  return (
    `M${sx} ${round(from.y - k)}Q${sx + 8} ${lane} ${sx + 22} ${lane}H${gate}` +
    `C${gate + 40} ${lane} ${round(tx - 40)} ${to.y} ${tx} ${to.y}`
  )
}

/**
 * `all`은 폴더 index를 포함한 전체 글, `columns`는 묶음을 나눠 세울 열 수 (좁은 화면은 1).
 */
export function layoutGraph(all: Entry[], columns: number): Graph {
  const indexes = new Map(all.filter((e) => e.isIndex).map((e) => [e.url, e]))
  const posts = all.filter((e) => !e.isIndex)

  /** 글이 속한 묶음: 위로 올라가며 처음 만나는 폴더 index. 없으면 바로 위 폴더 */
  const folderOf = (url: string) => {
    const parent = url.slice(0, url.lastIndexOf("/"))
    for (let at = parent; at; at = at.slice(0, at.lastIndexOf("/"))) {
      if (indexes.has(at)) return at
    }
    return parent
  }

  const folders = new Map<string, Entry[]>()
  for (const post of posts) {
    const key = folderOf(post.url)
    folders.set(key, [...(folders.get(key) ?? []), post])
  }
  // 큰 묶음부터 놓는다. 글은 쓴 순서대로
  const sorted = [...folders].sort((a, b) => b[1].length - a[1].length || compare(a[0], b[0]))
  for (const [, list] of sorted) {
    list.sort((a, b) => compare(a.date ?? "", b.date ?? "") || compare(a.url, b.url))
  }

  const count = Math.max(1, Math.min(columns, sorted.length))
  /** 열마다 지금까지 쓴 줄 수 */
  const filled = new Array<number>(count).fill(0)
  const y = (slot: number) => TOP + slot * PITCH + PITCH / 2

  const groups: GraphGroup[] = []
  const dots: GraphDot[] = []
  for (const [key, list] of sorted) {
    // 가장 덜 찬 열에 놓는다. 묶음 사이는 한 줄 띈다
    const col = filled.indexOf(Math.min(...filled))
    let slot = filled[col] ? filled[col] + 1 : 0
    const x = col * COL + DOT_X
    const head = slot++
    let last = head
    for (const post of list) {
      const lines = wrap(post.title)
      dots.push({
        url: post.url,
        title: post.title,
        lines,
        x,
        y: y(slot),
        r: radius(post.chars),
        labelWidth: Math.ceil(Math.max(...lines.map(widthOf)) * FONT),
        col,
      })
      last = slot
      // 두 줄짜리 이름표는 줄을 하나 더 쓴다
      slot += lines.length
    }
    filled[col] = slot
    groups.push({
      key,
      name: indexes.get(key)?.title ?? (key.split("/").pop() || "/"),
      color: spineColor(list[0].url),
      x,
      y: y(head),
      y2: y(last),
    })
  }

  // 그림에 놓인 순서 (열, 그다음 위에서 아래). 같은 태그의 글을 이 순서로 이으면 선이 짧다
  dots.sort((a, b) => a.col - b.col || a.y - b.y)
  const place = new Map(dots.map((dot, i) => [dot.url, i]))
  const byUrl = new Map(dots.map((dot) => [dot.url, dot]))

  const kinds = new Map<string, GraphEdge["kind"]>()
  const pair = (a: string, b: string) =>
    place.get(a)! < place.get(b)! ? `${a}\n${b}` : `${b}\n${a}`
  for (const post of posts) {
    for (const link of post.links) {
      if (link !== post.url && place.has(link)) kinds.set(pair(post.url, link), "link")
    }
  }
  // 같은 태그를 가진 글은 차례로 하나씩만 잇는다 (모두 서로 이으면 선이 너무 많다)
  const tagged = new Map<string, string[]>()
  for (const dot of dots) {
    const post = posts.find((p) => p.url === dot.url)!
    for (const slug of new Set(post.tags.map(tagSlug))) {
      if (slug) tagged.set(slug, [...(tagged.get(slug) ?? []), dot.url])
    }
  }
  for (const urls of tagged.values()) {
    for (let i = 1; i < urls.length; i++) {
      const key = pair(urls[i - 1], urls[i])
      if (!kinds.has(key)) kinds.set(key, "tie")
    }
  }

  const near = new Map<string, Set<string>>(dots.map((dot) => [dot.url, new Set<string>()]))
  const edges: GraphEdge[] = []
  for (const [key, kind] of kinds) {
    const [a, b] = key.split("\n")
    near.get(a)!.add(b)
    near.get(b)!.add(a)
    edges.push({ a, b, kind, d: route(byUrl.get(a)!, byUrl.get(b)!) })
  }
  // 옅은 선을 먼저 긋고 그 위에 먹색 선을 긋는다
  edges.sort((p, q) => Number(p.kind === "link") - Number(q.kind === "link"))

  return {
    width: count * COL,
    height: TOP * 2 + Math.max(...filled, 1) * PITCH,
    labelX: LABEL_GAP,
    groups,
    dots,
    edges,
    near,
  }
}
