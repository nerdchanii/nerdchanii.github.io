/**
 * 글 본문(마크다운 원문)에서 description으로 쓸 요약을 만든다.
 * 검색 결과·링크 미리보기용이므로 제목, 코드, 수식 블록 같은 구조는 빼고 문장만 남긴다.
 */
import { codeRanges } from "./markdown.ts"

const MAX_LENGTH = 160

/** `mdx`면 MDX 프로그램 부분(import/export, `{식}`)도 뺀다 */
export function excerpt(markdown: string, { mdx = false } = {}): string | null {
  // 코드·수식 블록은 마크다운 파서로 위치를 찾아 뺀다 (들여쓴 펜스, 인용 안 펜스, 긴 펜스 포함).
  let prose = ""
  let last = 0
  for (const [start, end] of codeRanges(markdown, { mdx })) {
    prose += markdown.slice(last, start) + " "
    last = end
  }
  prose += markdown.slice(last)

  const text = prose
    // 블록 단위로 빼는 것들
    .replace(/^#{1,6}\s.*$/gm, " ") // 제목
    .replace(/^>\s*\[![^\]]*\].*$/gm, " ") // callout 머리줄
    // 인라인 요소는 보이는 글자만 남긴다
    .replace(/!\[\[[^\]]*\]\]/g, " ") // ![[이미지]]
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // ![alt](이미지)
    .replace(/!\[[^\]]*\]\[[^\]]*\]/g, " ") // ![alt][ref] 참조식 이미지
    .replace(/^ {0,3}\[[^\]]+\]:[ \t]*\S.*$/gm, " ") // [ref]: url 정의
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, "$2") // [[글|표시]] → 표시
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // [텍스트](url) → 텍스트
    .replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1") // [텍스트][ref] → 텍스트
    .replace(/\$([^$\n]*)\$/g, (_, tex: string) => (tex.includes("\\") ? " " : tex)) // 간단한 인라인 수식만 남김
    .replace(/<[^>]+>/g, " ") // HTML 태그
    .replace(/(^|\s)#(?!\d+(?:\s|$))[^\s#]+/gu, "$1") // 본문 #태그 (#123 같은 숫자는 남김)
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__|\*|_|~~|==)(?=\S)([\s\S]*?\S)\1/g, "$2") // 강조
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, "") // 목록 기호
    .replace(/^\s*>\s?/gm, "") // 인용
    .replace(/^\s*[-*_]{3,}\s*$/gm, " ") // 구분선
    .replace(/\s+/g, " ")
    .trim()

  if (!text) return null
  if (text.length <= MAX_LENGTH) return text

  // 단어 중간에서 자르지 않도록 마지막 공백까지만 쓴다.
  const cut = text.slice(0, MAX_LENGTH)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > MAX_LENGTH * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}
