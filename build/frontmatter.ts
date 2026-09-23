/**
 * 글 frontmatter 스키마. 형식이 틀리면 어느 파일의 어느 값인지 알려주고 빌드를 멈춘다.
 * Quartz 시절 글과 호환되도록 목록 값은 문자열 하나도 받고, 모르는 키는 그대로 둔다.
 */
import { z } from "zod"

/** YAML에서 `key:`처럼 비워 두면 null이 되므로 없는 값으로 취급한다 */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === null ? undefined : v), schema.optional())

/** 문자열 또는 숫자(`title: 2024`)만 받아 문자열로 바꾼다. 객체·배열은 오류로 둔다 */
const text = z.union([z.string(), z.number()]).transform(String)

/** `tags: [a, b]`, `tags: a, b`, 숫자 태그(`2024`) 모두 문자열 목록으로 받는다 */
const list = optional(z.union([text, z.array(text)]))

const date = z
  .union([z.string(), z.date()])
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "날짜로 읽을 수 없는 값입니다")

export const frontmatterSchema = z
  .object({
    title: optional(text),
    slug: optional(text),
    tags: list,
    date: optional(date),
    updated: optional(date),
    description: optional(z.string()),
    /** 링크 미리보기 이미지. `socialImage`는 Quartz 시절 이름 */
    image: optional(text),
    socialImage: optional(text),
    draft: optional(z.boolean()),
    comments: optional(z.boolean()),
    aliases: list,
    alias: list,
  })
  .loose()

export type Frontmatter = z.infer<typeof frontmatterSchema>

export function parseFrontmatter(data: unknown, id: string): Frontmatter {
  const result = frontmatterSchema.safeParse(data ?? {})
  if (result.success) return result.data
  const issues = result.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n")
  throw new Error(`frontmatter 형식 오류: ${id}\n${issues}`)
}
