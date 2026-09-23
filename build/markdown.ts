/**
 * 빌드 단계에서 글 본문을 읽는 도구. 렌더링(remark)과 같은 파서로 mdast를 만들어서,
 * 코드·수식 안의 글자를 링크나 태그로 잘못 읽지 않게 한다.
 */
import type { Root } from "mdast"
import { fromMarkdown } from "mdast-util-from-markdown"
import { gfmFromMarkdown } from "mdast-util-gfm"
import { mathFromMarkdown } from "mdast-util-math"
import { gfm } from "micromark-extension-gfm"
import { math } from "micromark-extension-math"
import { visit } from "unist-util-visit"

/** `[[글]]`, `![[파일]]`, `[[글#제목|표시]]`: 1=`!`, 2=대상, 3=`#제목`, 4=표시 */
export const WIKILINK = /(!?)\[\[([^\]|#]*)(#[^\]|]*)?(?:\|([^\]]*))?\]\]/g
export const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)$/i

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
 * 위키링크 대상이 이미지 파일인지 가린다. `![[diagram#1.png]]`처럼 `#`까지 합쳐 이미지 파일명이면
 * 제목 조각이 아니라 파일명으로 본다.
 */
export function splitWikilink(bang: string, rawTarget: string, hash: string | undefined) {
  const embedsFile = Boolean(bang) && IMAGE_EXT.test(rawTarget + (hash ?? ""))
  return {
    embedsFile,
    target: (embedsFile ? rawTarget + (hash ?? "") : rawTarget).trim(),
    heading: embedsFile ? undefined : hash?.slice(1).trim(),
  }
}

/** 링크 글자(`[글자](…)`, `[글자][ref]`)인지. 그 안의 위키링크·태그는 링크로 바꾸지 않는다 (a 안에 a가 생긴다). */
export const isLinkText = (parent: { type: string } | undefined) =>
  parent?.type === "link" || parent?.type === "linkReference"

export function parseMarkdown(markdown: string): Root {
  return fromMarkdown(markdown, {
    extensions: [gfm(), math()],
    mdastExtensions: [gfmFromMarkdown(), mathFromMarkdown()],
  })
}

/** 본문에 보이는 순서대로 나오는 참조. 코드·수식은 text 노드가 아니므로 저절로 빠진다. */
export type BodyRef =
  | { kind: "wikilink"; target: string; heading: string | undefined; embedsFile: boolean }
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
  visit(tree, (node, _index, parent) => {
    if (node.type === "link") refs.push({ kind: "link", url: node.url })
    else if (node.type === "image") refs.push({ kind: "image", url: node.url })
    else if (node.type === "linkReference" || node.type === "imageReference") {
      const url = definitions.get(node.identifier)
      if (url !== undefined)
        refs.push({ kind: node.type === "linkReference" ? "link" : "image", url })
    } else if (node.type === "text") {
      // 링크 글자 안은 렌더할 때도 위키링크·태그로 바꾸지 않는다.
      if (isLinkText(parent)) return
      for (const [, bang, rawTarget, hash] of node.value.matchAll(WIKILINK)) {
        refs.push({ kind: "wikilink", ...splitWikilink(bang, rawTarget, hash) })
      }
      for (const { tag } of matchTags(node.value.replace(WIKILINK, " ")))
        refs.push({ kind: "tag", tag })
    }
  })
  return refs
}
