/**
 * rehype-katex가 만든 수식 트리를 HTML 문자열(`innerHTML`)로 접는다.
 *
 * KaTeX 출력에는 MathML(`<math>`, `<mrow>` …)이 들어 있다. MDX 런타임은 모든 태그를
 * Solid `Dynamic`으로 만드는데, `Dynamic`은 SVG 외의 namespace를 모르므로 클라이언트에서
 * 새로 그릴 때 MathML이 HTML 요소로 만들어진다. 수식은 상호작용이 없으니 통째로
 * 문자열로 넘겨서 브라우저가 파싱하게 한다. 수식마다 JSX 노드 수백 개가 줄어드는 효과도 있다.
 */
import type { Element, Root } from "hast"
import { toHtml } from "hast-util-to-html"
import { SKIP, visit } from "unist-util-visit"

const isKatexRoot = (node: Element) => {
  const className = node.properties.className
  return (
    Array.isArray(className) && (className.includes("katex-display") || className.includes("katex"))
  )
}

export function rehypeKatexRaw() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (!isKatexRoot(node)) return
      node.properties.innerHTML = toHtml(node.children)
      node.children = []
      return SKIP
    })
  }
}
