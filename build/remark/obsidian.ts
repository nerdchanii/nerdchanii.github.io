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
import { linkTextNodes, matchTags, splitWikilink, WIKILINK } from "../markdown.ts"
import { isNotRelative, type Resolver } from "../resolve.ts"

/** `[!type]`, `[!multi-column]`, `[!note|meta]`, 접기 표시 `+`/`-` (Quartz와 같은 규칙) */
const CALLOUT = /^\[!([\w-]+)(?:\|([^\]]*))?\][+-]?[ \t]*/

/** rehype-slug와 같은 규칙으로 제목 anchor를 만든다 */
const headingId = (heading: string) => new GithubSlugger().slug(heading.trim())

export function remarkObsidian({ resolver }: { resolver: () => Resolver }) {
  return (tree: Root, file: VFile) => {
    const from = file.path
    const warn = (message: string) => console.warn(`[obsidian] ${file.path}: ${message}`)

    // 링크 글자 안은 그대로 둔다 (scanBody와 같은 규칙).
    const inLink = linkTextNodes(tree)
    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index === undefined || inLink.has(node) || !node.value.includes("[[")) return

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

    // 위키링크를 바꾼 뒤에 돈다. 위키링크가 만든 링크를 포함해 링크 안의 글자는 건너뛴다.
    const inLinkAfter = linkTextNodes(tree)
    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index === undefined || inLinkAfter.has(node)) return
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
          : found.entry.url + found.query + (found.hash ? `#${headingId(found.hash)}` : "")
    })

    visit(tree, "blockquote", (node: Blockquote) => {
      const first = node.children[0]
      if (first?.type !== "paragraph") return
      const head = first.children[0]
      if (head?.type !== "text") return
      const match = CALLOUT.exec(head.value)
      if (!match) return

      const [marker, type, metadata] = match
      const kind = type.toLowerCase()

      // 마커 뒤부터 첫 줄바꿈까지가 제목이다. `**굵게**` 같은 서식 노드도 제목에 그대로 둔다.
      const rest: PhrasingContent[] = [
        { type: "text", value: head.value.slice(marker.length) },
        ...first.children.slice(1),
      ]
      const title: PhrasingContent[] = []
      const body: PhrasingContent[] = []
      for (const child of rest) {
        if (body.length > 0 || title.includes(LINE_END)) body.push(child)
        else if (child.type === "break") title.push(LINE_END)
        else if (child.type === "text" && child.value.includes("\n")) {
          const cut = child.value.indexOf("\n")
          title.push({ type: "text", value: child.value.slice(0, cut) }, LINE_END)
          const after = child.value.slice(cut + 1)
          if (after) body.push({ type: "text", value: after })
        } else title.push(child)
      }
      const titleChildren = title.filter(
        (child) => child !== LINE_END && !(child.type === "text" && child.value.trim() === ""),
      )

      if (body.length > 0) first.children = body
      else node.children.shift()

      const titleNode: Paragraph = {
        type: "paragraph",
        data: { hProperties: { className: ["callout-title"] } },
        children:
          titleChildren.length > 0
            ? titleChildren
            : [{ type: "text", value: kind[0].toUpperCase() + kind.slice(1).replace(/-/g, " ") }],
      }
      node.children.unshift(titleNode)
      node.data = {
        ...node.data,
        hProperties: {
          className: ["callout", `callout-${kind}`],
          ...(metadata ? { dataCalloutMetadata: metadata.trim() } : {}),
        },
      }
    })
  }
}

/** 콜아웃 제목 줄의 끝을 표시하는 자리표시자 (결과에는 남지 않는다) */
const LINE_END: PhrasingContent = { type: "text", value: "" }

function link(url: string, value: string): PhrasingContent {
  return { type: "link", url, children: [{ type: "text", value }] }
}
