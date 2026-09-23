/**
 * 본문 맨 앞에 목차(`<nav class="toc">`)를 넣는다.
 *
 * rehype-slug가 붙인 id를 그대로 쓰므로 목차 링크와 제목 anchor가 어긋나지 않는다.
 * 목차도 본문 HTML의 일부라서 prerender·hydration에 따로 데이터를 넘길 필요가 없다.
 */
import type { Element, ElementContent, Root } from "hast"
import { toString } from "hast-util-to-string"
import { visit } from "unist-util-visit"

const MIN_HEADINGS = 2

export function rehypeToc() {
  return (tree: Root) => {
    const items: { depth: number; id: string; text: string }[] = []
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "h2" && node.tagName !== "h3") return
      const id = node.properties.id
      const text = toString(node).trim()
      if (typeof id === "string" && text)
        items.push({ depth: node.tagName === "h2" ? 2 : 3, id, text })
    })
    if (items.length < MIN_HEADINGS) return

    const li = (item: (typeof items)[number]): ElementContent => ({
      type: "element",
      tagName: "li",
      properties: { className: [`toc-depth-${item.depth}`] },
      children: [
        {
          type: "element",
          tagName: "a",
          properties: { href: `#${item.id}` },
          children: [{ type: "text", value: item.text }],
        },
      ],
    })

    tree.children.unshift({
      type: "element",
      tagName: "nav",
      properties: { className: ["toc"], ariaLabel: "목차" },
      children: [
        {
          type: "element",
          tagName: "p",
          properties: { className: ["toc-title"] },
          children: [{ type: "text", value: "목차" }],
        },
        { type: "element", tagName: "ol", properties: {}, children: items.map(li) },
      ],
    })
  }
}
