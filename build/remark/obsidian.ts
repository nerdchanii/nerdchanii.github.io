/**
 * Obsidian 문법을 일반 마크다운 노드로 바꾼다.
 *
 * - `[[글]]`, `[[글|표시]]`, `[[글#제목]]`, `[[#제목]]` → 링크
 * - `![[image.png]]` → 이미지
 * - `> [!type] 제목` → callout (class가 붙은 blockquote)
 */
import GithubSlugger from "github-slugger"
import type { Blockquote, Paragraph, PhrasingContent, Root, Text } from "mdast"
import { SKIP, visit } from "unist-util-visit"
import type { VFile } from "vfile"
import type { Resolver } from "../resolve.ts"

const WIKILINK = /(!?)\[\[([^\]|#]*)(#[^\]|]*)?(?:\|([^\]]*))?\]\]/g
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)$/i
const CALLOUT = /^\[!(\w+)\][+-]?[ \t]*([^\n]*)\n?/

/** rehype-slug와 같은 규칙으로 제목 anchor를 만든다 */
const headingId = (heading: string) => new GithubSlugger().slug(heading.trim())

export function remarkObsidian({ resolver }: { resolver: () => Resolver }) {
  return (tree: Root, file: VFile) => {
    const from = file.path
    const warn = (message: string) => console.warn(`[obsidian] ${file.path}: ${message}`)

    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index === undefined || !node.value.includes("[[")) return

      const parts: PhrasingContent[] = []
      let last = 0
      for (const match of node.value.matchAll(WIKILINK)) {
        const [raw, bang, rawTarget, hash, rawLabel] = match
        const target = rawTarget.trim()
        const heading = hash?.slice(1).trim()
        const label = rawLabel?.trim()
        if (match.index > last)
          parts.push({ type: "text", value: node.value.slice(last, match.index) })
        last = match.index + raw.length

        // ![[image.png]] → 이미지
        if (bang && IMAGE_EXT.test(target)) {
          const url = resolver().media(target, from)
          if (url) parts.push({ type: "image", url, alt: label || target })
          else {
            warn(`이미지를 찾을 수 없음: ${target}`)
            parts.push({ type: "text", value: raw })
          }
          continue
        }

        // [[#제목]] → 같은 글 안의 제목
        if (!target && heading) {
          parts.push(link(`#${headingId(heading)}`, label || heading))
          continue
        }

        // [[글]] → 다른 글. 글이 아닌 임베드(![[글]])도 링크로 둔다.
        const entry = resolver().page(target, from)
        if (!entry) {
          warn(`글을 찾을 수 없음: ${target}`)
          parts.push({ type: "text", value: label || target })
          continue
        }
        const anchor = heading ? `#${headingId(heading)}` : ""
        parts.push(link(entry.url + anchor, label || target))
      }

      if (parts.length === 0) return
      if (last < node.value.length) parts.push({ type: "text", value: node.value.slice(last) })
      parent.children.splice(index, 1, ...parts)
      return [SKIP, index + parts.length]
    })

    visit(tree, "blockquote", (node: Blockquote) => {
      const first = node.children[0]
      if (first?.type !== "paragraph") return
      const text = first.children[0]
      if (text?.type !== "text") return
      const match = CALLOUT.exec(text.value)
      if (!match) return

      const [marker, type, title] = match
      const kind = type.toLowerCase()
      text.value = text.value.slice(marker.length)
      if (text.value === "") first.children.shift()
      if (first.children.length === 0) node.children.shift()

      const titleNode: Paragraph = {
        type: "paragraph",
        data: { hProperties: { className: ["callout-title"] } },
        children: [{ type: "text", value: title || kind[0].toUpperCase() + kind.slice(1) }],
      }
      node.children.unshift(titleNode)
      node.data = { ...node.data, hProperties: { className: ["callout", `callout-${kind}`] } }
    })
  }
}

function link(url: string, value: string): PhrasingContent {
  return { type: "link", url, children: [{ type: "text", value }] }
}
