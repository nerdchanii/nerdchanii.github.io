import { assertSprite, SPRITE_RATIO, SPRITES, spriteUrl } from "./sprites.ts"

/** 픽셀 그림 한 장. 높이(px)만 정하면 폭은 비율대로 따라온다 */
export default function Sprite(props: { name: string; height?: number; class?: string }) {
  const name = props.name
  assertSprite(name)
  const height = () => props.height ?? 96
  return (
    <img
      class={`da-sprite ${props.class ?? ""}`}
      src={spriteUrl(name)}
      alt={SPRITES[name]}
      width={Math.round(height() * SPRITE_RATIO)}
      height={height()}
      loading="lazy"
      decoding="async"
    />
  )
}
