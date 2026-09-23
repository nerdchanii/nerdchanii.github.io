/**
 * Obsidian 문법을 일반 마크다운 노드로 바꾼다.
 *
 * - `[[글]]`, `[[글|표시]]`, `[[글#제목]]`, `[[#제목]]` → 링크
 * - `![[image.png]]` → 이미지
 * - `> [!type] 제목` → callout (class가 붙은 blockquote)
 * - `#태그` → 태그 페이지 링크
 * - 일반 마크다운의 상대 경로(`[글](../other.md)`, `![](images/a.png)`) → 글 URL, `/_media/…`
 */
import GithubSlugger from "github-slugger"
import type {
  Blockquote,
  Definition,
  Image,
  Link,
  Paragraph,
  PhrasingContent,
  Root,
  Text,
} from "mdast"
import { SKIP, visit } from "unist-util-visit"
import type { VFile } from "vfile"
import { tagUrl } from "../../src/lib/tags.ts"
import { isLinkText, matchTags, splitWikilink, WIKILINK } from "../markdown.ts"
import { isNotRelative, type Resolver } from "../resolve.ts"

const CALLOUT = /^\[!(\w+)\][+-]?[ \t]*([^\n]*)\n?/

/** rehype-slug와 같은 규칙으로 제목 anchor를 만든다 */
const headingId = (heading: string) => new GithubSlugger().slug(heading.trim())

export function remarkObsidian({ resolver }: { resolver: () => Resolver }) {
  return (tree: Root, file: VFile) => {
    const from = file.path
    const warn = (message: string) => console.warn(`[obsidian] ${file.path}: ${message}`)

    visit(tree, "text", (node: Text, index, parent) => {
      // 링크 글자 안은 그대로 둔다 (scanBody와 같은 규칙).
      if (!parent || index === undefined || isLinkText(parent) || !node.value.includes("[[")) return

      const parts: PhrasingContent[] = []
      let last = 0
      for (const match of node.value.matchAll(WIKILINK)) {
        const [raw, bang, rawTarget, hash, rawLabel] = match
        const { embedsFile, target, heading } = splitWikilink(bang, rawTarget, hash)
        const label = rawLabel?.trim()
        if (match.index > last)
          parts.push({ type: "text", value: node.value.slice(last, match.index) })
        last = match.index + raw.length

        // ![[image.png]] → 이미지
        if (embedsFile) {
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

    // 위키링크를 바꾼 뒤에 돈다. 링크 안의 글자는 건너뛴다.
    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index === undefined || isLinkText(parent)) return
      const found = matchTags(node.value)
      if (found.length === 0) return

      const parts: PhrasingContent[] = []
      let last = 0
      for (const { index: at, raw, tag } of found) {
        if (at > last) parts.push({ type: "text", value: node.value.slice(last, at) })
        parts.push({
          type: "link",
          url: tagUrl(tag),
          data: { hProperties: { className: ["tag-link"] } },
          children: [{ type: "text", value: raw }],
        })
        last = at + raw.length
      }
      if (last < node.value.length) parts.push({ type: "text", value: node.value.slice(last) })
      parent.children.splice(index, 1, ...parts)
      return [SKIP, index + parts.length]
    })

    // 일반 마크다운 링크·이미지(참조식 정의 포함)의 상대 경로를 사이트 URL로 바꾼다.
    visit(tree, ["link", "image", "definition"], (node) => {
      const target = node as Link | Image | Definition
      if (!target.url || isNotRelative(target.url)) return
      const found = resolver().resolve(target.url, from)
      if (!found) {
        warn(`링크 대상을 찾을 수 없음: ${target.url}`)
        return
      }
      target.url =
        found.kind === "media"
          ? found.url
          : found.entry.url + (found.hash ? `#${headingId(found.hash)}` : "")
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
