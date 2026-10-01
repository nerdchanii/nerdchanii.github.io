import { createUniqueId } from "solid-js"
import { CAST, CAST_SIZE, type CastKind } from "../lib/cast.ts"
import { draw } from "../lib/draw.ts"

/** 선으로 그린 등장인물 한 명. 높이(px)만 정하면 폭은 비율대로 따라온다 */
export default function Cast(props: { who: CastKind; height: number; class?: string }) {
  const id = createUniqueId()
  const [w, h] = CAST_SIZE[props.who]
  return (
    <svg
      ref={draw}
      class={`ln cast ${props.class ?? ""}`}
      viewBox={`0 0 ${w} ${h}`}
      width={(props.height * w) / h}
      height={props.height}
      aria-hidden="true"
      innerHTML={CAST[props.who](id)}
    />
  )
}
