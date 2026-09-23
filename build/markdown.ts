/**
 * 빌드 단계에서 글 본문을 읽는 도구. 렌더링(remark)과 같은 파서로 mdast를 만들어서,
 * 코드·수식 안의 글자를 링크나 태그로 잘못 읽지 않게 한다.
 */
import type { Root, Text } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"
import { gfmFromMarkdown } from "mdast-util-gfm"
import { mathFromMarkdown } from "mdast-util-math"
import { gfm } from "micromark-extension-gfm"
import { math } from "micromark-extension-math"
import { SKIP, visit } from "unist-util-visit"

/** `[[글]]`, `![[파일]]`, `[[글#제목|표시]]`: 1=`!`, 2=대상, 3=`#제목`, 4=표시 */
export const WIKILINK = /(!?)\[\[([^\]|#]*)(#[^\]|]*)?(?:\|([^\]]*))?\]\]/g
/** Quartz가 이미지로 임베드하던 확장자(png, jpg, jpeg, gif, bmp, svg, webp)에 avif를 더한다 */
export const IMAGE_EXT = /\.(png|jpe?g|gif|bmp|webp|avif|svg)$/i
/** Quartz가 `![[…]]`로 임베드하던 영상·소리·PDF 확장자 (webm은 영상으로 본다) */
const VIDEO_EXT = /\.(mp4|webm|ogv|mov|mkv)$/i
const AUDIO_EXT = /\.(mp3|wav|m4a|ogg|3gp|flac)$/i
const PDF_EXT = /\.pdf$/i

export type EmbedKind = "image" | "video" | "audio" | "pdf"

/** Quartz enableVideoEmbed가 `![](…)`를 영상으로 바꾸던 확장자 */
const MARKDOWN_VIDEO = /\.(mp4|webm|ogg|avi|mov|flv|wmv|mkv|mpg|mpeg|3gp|m4v)$/i

/** 마크다운 이미지 문법 `![](url)`이 가리키는 파일 종류. 확장자를 모르면 이미지로 본다 */
export function markdownMediaKind(url: string): EmbedKind {
  const path = url.split(/[?#]/)[0]
  if (MARKDOWN_VIDEO.test(path)) return "video"
  return embedKind(path) ?? "image"
}

/** `![[파일]]`로 임베드할 수 있는 파일이면 그 종류를 돌려준다 */
export function embedKind(name: string): EmbedKind | undefined {
  if (IMAGE_EXT.test(name)) return "image"
  if (VIDEO_EXT.test(name)) return "video"
  if (AUDIO_EXT.test(name)) return "audio"
  if (PDF_EXT.test(name)) return "pdf"
  return undefined
}

/**
 * Obsidian 본문 태그(`#태그`). Quartz의 규칙을 따른다:
 * 줄 처음이나 공백 뒤의 `#`, 글자·숫자·`-`·`_`·이모지로 이루어진 이름, `/`로 계층을 나눌 수 있고, 숫자만인 것(`#123`)은 태그가 아니다.
 */
const INLINE_TAG = /(?<=^|\s)#((?:[-_\p{L}\p{Emoji}\p{M}\d])+(?:\/[-_\p{L}\p{Emoji}\p{M}\d]+)*)/gu

export type TagMatch = { index: number; raw: string; tag: string }

/** 텍스트 한 조각에서 태그를 찾는다 */
export function matchTags(value: string): TagMatch[] {
  const found: TagMatch[] = []
  for (const match of value.matchAll(INLINE_TAG)) {
    const tag = match[1]
    if (/^\d+$/.test(tag)) continue
    found.push({ index: match.index, raw: match[0], tag })
  }
  return found
}

/**
 * 위키링크 대상이 임베드할 파일(이미지·영상·소리·PDF)인지 가린다. `![[diagram#1.png]]`처럼 `#`까지 합쳐
 * 파일명이 되면 제목 조각이 아니라 파일명으로 본다.
 */
export function splitWikilink(bang: string, rawTarget: string, hash: string | undefined) {
  const whole = rawTarget + (hash ?? "")
  // 1) `#`까지 합친 이름이 파일이면 그 이름 그대로
  if (bang && embedKind(whole))
    return { embedsFile: true, target: whole.trim(), heading: undefined, fragment: undefined }
  // 2) `![[paper.pdf#page=3]]`처럼 파일 뒤의 `#…`는 미디어 URL 조각으로 붙인다
  if (bang && embedKind(rawTarget.trim()))
    return { embedsFile: true, target: rawTarget.trim(), heading: undefined, fragment: hash }
  return {
    embedsFile: false,
    target: rawTarget.trim(),
    heading: hash?.slice(1).trim(),
    fragment: undefined,
  }
}

/**
 * 링크(`[글자](…)`, `[글자][ref]`) 안의 text 노드. `[**#태그**](…)`처럼 서식에 한 겹 더 싸여 있어도 찾는다.
 * 그 안의 위키링크·태그는 링크로 바꾸지 않는다 (a 안에 a가 생긴다).
 */
export function linkTextNodes(tree: Root): Set<Text> {
  const found = new Set<Text>()
  visit(tree, (node) => {
    if (node.type !== "link" && node.type !== "linkReference") return
    visit(node, "text", (text) => {
      found.add(text)
    })
    return SKIP
  })
  return found
}

const WIKILINK_SPAN = /!?\[\[[^\]]*?\]\]/g

/**
 * 마크다운을 파싱하기 전에 Obsidian 문법을 맞춘다. Quartz도 remark 전에 같은 처리를 했다. 코드 블록은 건드리지 않는다.
 * - `%% 주석 %%`은 지운다 (발행되는 페이지와 링크·태그 수집 모두에서 빠진다).
 * - 위키링크 `[[글|표시]]`의 `|`를 `\|`로 바꾼다. 표 안에서 GFM이 열 구분자로 읽지 않게 하려는 것이다.
 *   바깥 파이프가 없는 표(`a | b`)도 있어서 표를 찾지 않고 모든 위키링크에 적용한다. `\|`는 파싱 뒤 `|`로 돌아온다.
 * 코드 블록, 인라인 코드, 수식은 건드리지 않는다.
 */
export function preprocessObsidian(markdown: string): string {
  const escape = (text: string) =>
    text.replace(WIKILINK_SPAN, (link) => link.replace(/((^|[^\\])(\\\\)*)\|/g, "$1\\|"))
  const code = codeRanges(markdown, { inline: true })

  // 코드 밖의 `%%`를 앞에서부터 둘씩 짝지어 주석 구간을 만든다. 주석이 코드 블록을 감싸면 그 코드도 함께 지운다.
  // 짝이 없는 마지막 `%%`는 그대로 둔다 (Quartz의 /%%[\s\S]*?%%/와 같다).
  const marks: number[] = []
  let from = 0
  for (const [start, end] of [...code, [markdown.length, markdown.length]]) {
    for (
      let i = markdown.indexOf("%%", from);
      i !== -1 && i + 2 <= start;
      i = markdown.indexOf("%%", i + 2)
    )
      marks.push(i)
    from = Math.max(from, end)
  }
  const comments: [number, number][] = []
  for (let i = 0; i + 1 < marks.length; i += 2) comments.push([marks[i], marks[i + 1] + 2])

  // 문서를 코드/글 조각으로 나눠, 주석 구간을 뺀 나머지만 남긴다. 글 조각에만 위키링크 이스케이프를 한다.
  const pieces: { start: number; end: number; code: boolean }[] = []
  let last = 0
  for (const [start, end] of code) {
    if (start > last) pieces.push({ start: last, end: start, code: false })
    pieces.push({ start, end, code: true })
    last = end
  }
  if (last < markdown.length) pieces.push({ start: last, end: markdown.length, code: false })

  let out = ""
  for (const piece of pieces) {
    let cursor = piece.start
    const keep = (end: number) => {
      if (end <= cursor) return
      const text = markdown.slice(cursor, end)
      out += piece.code ? text : escape(text)
    }
    for (const [start, end] of comments) {
      if (end <= cursor || start >= piece.end) continue
      keep(Math.min(start, piece.end))
      cursor = Math.max(cursor, Math.min(end, piece.end))
    }
    keep(piece.end)
  }
  return out
}

/**
 * 코드 블록(펜스·들여쓰기, 인용·목록 안 포함)과 수식 블록의 원문 위치. 마크다운 파서로 찾으므로
 * ```` ```` ```` 네 개짜리 펜스 안의 ``` 같은 경우도 CommonMark 규칙대로 처리된다.
 * `inline`이면 인라인 코드·수식도 포함한다.
 */
export function codeRanges(markdown: string, { inline = false } = {}): [number, number][] {
  const types = new Set(inline ? ["code", "math", "inlineCode", "inlineMath"] : ["code", "math"])
  const tree = fromMarkdown(markdown, {
    extensions: [gfm(), math()],
    mdastExtensions: [gfmFromMarkdown(), mathFromMarkdown()],
  })
  const ranges: [number, number][] = []
  visit(tree, (node) => {
    if (types.has(node.type) && node.position) {
      const { start, end } = node.position
      if (start.offset !== undefined && end.offset !== undefined)
        ranges.push([start.offset, end.offset])
      return SKIP
    }
  })
  return ranges.sort((a, b) => a[0] - b[0])
}

export function parseMarkdown(markdown: string): Root {
  return fromMarkdown(preprocessObsidian(markdown), {
    extensions: [gfm(), math()],
    mdastExtensions: [gfmFromMarkdown(), mathFromMarkdown()],
  })
}

/** 본문에 보이는 순서대로 나오는 참조. 코드·수식은 text 노드가 아니므로 저절로 빠진다. */
export type BodyRef =
  | {
      kind: "wikilink"
      target: string
      heading: string | undefined
      embedsFile: boolean
      fragment: string | undefined
    }
  | { kind: "link"; url: string }
  | { kind: "image"; url: string }
  | { kind: "tag"; tag: string }

export function scanBody(tree: Root): BodyRef[] {
  // 참조식 링크(`[글][ref]`)는 실제로 쓰인 정의만 센다. 쓰이지 않은 `[ref]: …`는 화면에 링크가 없다.
  const definitions = new Map<string, string>()
  visit(tree, "definition", (node) => {
    if (!definitions.has(node.identifier)) definitions.set(node.identifier, node.url)
  })

  const refs: BodyRef[] = []
  const inLink = linkTextNodes(tree)
  visit(tree, (node) => {
    if (node.type === "link") refs.push({ kind: "link", url: node.url })
    else if (node.type === "image") refs.push({ kind: "image", url: node.url })
    else if (node.type === "linkReference" || node.type === "imageReference") {
      const url = definitions.get(node.identifier)
      if (url !== undefined)
        refs.push({ kind: node.type === "linkReference" ? "link" : "image", url })
    } else if (node.type === "text") {
      // 링크 글자 안은 렌더할 때도 위키링크·태그로 바꾸지 않는다.
      if (inLink.has(node)) return
      for (const [, bang, rawTarget, hash] of node.value.matchAll(WIKILINK)) {
        refs.push({ kind: "wikilink", ...splitWikilink(bang, rawTarget, hash) })
      }
      for (const { tag } of matchTags(node.value.replace(WIKILINK, " ")))
        refs.push({ kind: "tag", tag })
    }
  })
  return refs
}
