import type { Entry } from "./content.ts"

/**
 * 책장의 책 한 권 = 글 하나.
 * 두께는 글 길이, 띠 색은 글이 속한 폴더, 높이는 주소에서 뽑은 값이라 새로 고쳐도 같다.
 */
const COLORS: Record<string, string> = {
  devlog: "#7765b8",
  projects: "#e27a45",
  "notes/math": "#5f9be8",
  "notes/reading": "#4a9757",
  "notes/research": "#3f7fc9",
}
/** 색을 정해 두지 않은 폴더가 돌려 쓰는 색 */
const SPARE = ["#b0647a", "#3f9a94", "#b08a3a", "#6b7bb8"]

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

export function spineColor(url: string): string {
  const [, top, sub] = url.split("/")
  return COLORS[`${top}/${sub}`] ?? COLORS[top] ?? SPARE[hash(top ?? "") % SPARE.length]
}

/** 책등의 폭과 높이 (px) */
export function spineSize(entry: Entry): { w: number; h: number } {
  return {
    w: Math.round(Math.min(46, 22 + Math.sqrt(entry.chars) / 4.4)),
    h: 150 + (hash(entry.url) % 6) * 8,
  }
}
