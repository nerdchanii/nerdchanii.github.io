/**
 * MDX용 Solid JSX 런타임.
 *
 * MDX는 `jsx(type, props)` 호출로 컴파일된다. Solid 컴파일러를 거치지 않으므로
 * 문자열 태그(`"h1"`)와 컴포넌트를 모두 `Dynamic`으로 넘겨 SSR과 hydration이
 * 같은 경로를 타게 한다.
 */
import { createComponent, type Component, type JSX } from "solid-js"
import { Dynamic } from "solid-js/web"

type Props = Record<string, unknown> & { children?: JSX.Element }

export function Fragment(props: { children?: JSX.Element }): JSX.Element {
  return props.children
}

export function jsx(type: string | Component<Props>, props: Props): JSX.Element {
  if (type === Fragment) return props.children

  // MDX(React 관례)는 className을 쓰고, Solid는 class를 쓴다.
  const { className, ...rest } = props
  if (className !== undefined) rest.class = className

  return createComponent(Dynamic, { ...rest, component: type })
}

export const jsxs = jsx
export const jsxDEV = jsx
