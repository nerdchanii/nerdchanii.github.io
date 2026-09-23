/**
 * Obsidian 본문 태그(`#태그`). Quartz의 규칙을 따른다:
 * 줄 처음이나 공백 뒤의 `#`, 글자·숫자·`-`·`_`·이모지로 이루어진 이름, `/`로 계층을 나눌 수 있고, 숫자만인 것(`#123`)은 태그가 아니다.
 */
import { fromMarkdown } from "mdast-util-from-markdown"
import { gfmFromMarkdown } from "mdast-util-gfm"
import { mathFromMarkdown } from "mdast-util-math"
import { gfm } from "micromark-extension-gfm"
import { math } from "micromark-extension-math"
import { visit } from "unist-util-visit"

const INLINE_TAG = /(?<=^|\s)#((?:[-_\p{L}\p{Emoji}\p{M}\d])+(?:\/[-_\p{L}\p{Emoji}\p{M}\d]+)*)/gu

/** remark 단계에서는 위키링크가 이미 링크 노드가 되어 있다. 원문을 볼 때는 직접 뺀다. */
const WIKILINK_LIKE = /!?\[\[[^\]]*\]\]/g

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

/** 마크다운 원문에 들어 있는 본문 태그 (빌드 시 글 목록을 만들 때 쓴다) */
export function inlineTags(markdown: string): string[] {
  const tree = fromMarkdown(markdown, {
    extensions: [gfm(), math()],
    mdastExtensions: [gfmFromMarkdown(), mathFromMarkdown()],
  })
  const tags: string[] = []
  // 코드·수식은 text 노드가 아니다. 링크 글자와 위키링크 안쪽은 렌더할 때도 태그로 바꾸지 않으므로 뺀다.
  visit(tree, "text", (node, _index, parent) => {
    if (parent?.type === "link") return
    for (const { tag } of matchTags(node.value.replace(WIKILINK_LIKE, " "))) tags.push(tag)
  })
  return tags
}
