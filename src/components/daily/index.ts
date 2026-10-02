/**
 * Daily AI 회차 글(content/daily-ai/*.mdx)이 불러 쓰는 부품.
 *
 *   import { Core, Hook, Quiz } from "../../src/components/daily/index.ts"
 *
 * 그림 이름은 sprites.ts에 등록된 것만 쓸 수 있다.
 */
export { default as Sprite } from "./Sprite.tsx"
export {
  Card,
  Cards,
  Core,
  Diff,
  Flow,
  Hook,
  Key,
  Note,
  Quote,
  Quotes,
  Refs,
  Scene,
} from "./blocks.tsx"
export { Blank, Finish, Quiz } from "./play.tsx"
