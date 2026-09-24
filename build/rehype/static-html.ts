/**
 * 상호작용이 없는 큰 서브트리(KaTeX 수식, shiki 코드 블록)를 HTML 문자열(`innerHTML`)로 접는다.
 *
 * - KaTeX 출력에는 MathML(`<math>`, `<mrow>` …)이 들어 있다. MDX 런타임은 모든 태그를
 *   Solid `Dynamic`으로 만드는데, `Dynamic`은 SVG 외의 namespace를 모르므로 클라이언트에서
 *   새로 그릴 때 MathML이 HTML 요소로 만들어진다.
 * - shiki는 토큰마다 `<span>`을 만들어서 코드 블록 하나가 JSX 노드 수백 개가 된다.
 *
 * 둘 다 통째로 문자열로 넘겨서 브라우저가 파싱하게 한다.
 */
import type { Element, Root } from "hast"
import { toHtml } from "hast-util-to-html"
import { SKIP, visit } from "unist-util-visit"

const STATIC_ROOTS = ["katex-display", "katex", "shiki"]

/** rehype 플러그인마다 class를 `className` 배열이나 `class` 문자열로 넣으므로 둘 다 본다 */
const classesOf = (node: Element): string[] => {
  const value = node.properties.className ?? node.properties.class
  if (Array.isArray(value)) return value.map(String)
  return typeof value === "string" ? value.split(/\s+/) : []
}

const isStaticRoot = (node: Element) => {
  const classes = classesOf(node)
  return STATIC_ROOTS.some((c) => classes.includes(c))
}

export function rehypeStaticHtml() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (!isStaticRoot(node)) return
      node.properties.innerHTML = toHtml(node.children)
      node.children = []
      return SKIP
    })
  }
}
