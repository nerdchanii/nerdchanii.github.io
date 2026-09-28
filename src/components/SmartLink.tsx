import { A } from "@solidjs/router"
import { Show, type JSX } from "solid-js"

export const isExternal = (href: string) => /^https?:\/\//.test(href)

/** 바깥 주소는 일반 링크로, 사이트 안 주소는 라우터 링크로 */
export default function SmartLink(props: { href: string; class?: string; children: JSX.Element }) {
  return (
    <Show
      when={isExternal(props.href)}
      fallback={
        <A href={props.href} class={props.class}>
          {props.children}
        </A>
      }
    >
      <a href={props.href} class={props.class} rel="noopener">
        {props.children}
      </a>
    </Show>
  )
}
