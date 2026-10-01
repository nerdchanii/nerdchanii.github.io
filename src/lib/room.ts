/**
 * 홈의 방. 아이소메트릭 타일 격자 위에 바닥·벽 타일과 물건을 놓는다.
 * 그림은 `public/room/`에 있고, 모두 같은 2:1 아이소메트릭 카메라로 그렸다.
 *
 * 좌표: (c, r) 칸의 위 꼭짓점 = (OX + (c − r) · HW, OY + (c + r) · HH).
 * c가 커지면 오른쪽 아래, r이 커지면 왼쪽 아래로 간다. 왼쪽 벽은 c = 0 줄, 오른쪽 벽은 r = 0 줄에 선다.
 */
import type { Lang } from "./i18n.ts"

type Text = Record<Lang, string>

/** 타일 반폭·반높이와 벽 높이 (월드 단위) */
export const HW = 64
export const HH = 32
export const WALL = 192
const NMAX = 8
const OX = NMAX * HW + 40
const OY = WALL + 40

export const iso = (c: number, r: number): [number, number] => [
  OX + (c - r) * HW,
  OY + (c + r) * HH,
]

/** 월드 좌표 → 칸 좌표 (소수) */
export const cell = (x: number, y: number): [number, number] => {
  const u = (x - OX) / HW
  const v = (y - OY) / HH
  return [(u + v) / 2, (v - u) / 2]
}

/** 글이 쌓이면 방이 넓어진다 */
export const roomSize = (posts: number) => (posts < 10 ? 6 : posts < 30 ? 7 : 8)

/** N×N 방이 화면에 들어가는 월드 영역 */
export function bounds(n: number) {
  const [xl] = iso(0, n)
  const [xr] = iso(n, 0)
  const [, yb] = iso(n, n)
  const x = xl - 24
  const y = OY - WALL - 24
  return { x, y, w: xr - xl + 48, h: yb - y + 24 }
}

/** 벽 칸별 무늬. 없으면 민무늬, 오른쪽 벽 맨 끝 칸은 문이다 */
export const LEFT_WALL: Record<number, string> = { 2: "wall-l-window", 5: "wall-l-window" }
export const RIGHT_WALL: Record<number, string> = { 1: "wall-r-clock", 3: "wall-r-picture" }
/** 밤(다크 테마)에 바꿔 끼우는 타일 */
export const NIGHT: Record<string, string> = { "wall-l-window": "wall-l-window-night" }

/** 물건을 누르면 여는 것 */
export type Open =
  | "posts"
  | "latest"
  | "years"
  | "works"
  | "contributions"
  | "github"
  | "linkedin"
  | "chani"
  | "jindo"
  | "nacho"

export type Face = "R" | "L"

export type Item = {
  id: string
  /** 그림 이름. 방향이 있는 물건은 `-R`(왼쪽 벽에 등을 댐), `-L`(오른쪽 벽에 등을 댐)이 붙는다 */
  img: string
  /** 앞의 그림과 번갈아 보이는 그림 (인물의 다른 자세) */
  alt?: string
  /** 방향이 있는 물건 */
  face?: Face
  c: number
  r: number
  /** 발판 칸 수 (c, r 방향) */
  w: number
  d: number
  /** 발판 폭 대비 그림 폭 */
  k: number
  /** 이만큼 글이 쌓이면 나타나고, hide만큼 쌓이면 사라진다 (더 큰 물건으로 바뀜) */
  need?: number
  hide?: number
  /** 바닥에 깔리는 물건 (러그) */
  flat?: boolean
  /** 인물: 칸 가운데에 선다 */
  actor?: boolean
  /** 같은 칸의 다른 물건 위에 그린다 (방석 위의 진도) */
  above?: boolean
  open?: Open
  name?: Text
}

/**
 * 기본 배치. 방문자가 옮긴 배치는 그 브라우저에만 남는다.
 * 개발 서버에서 "배치 복사"를 누르면 옮긴 배치를 이 형식으로 복사할 수 있다.
 */
export const ITEMS: Item[] = [
  { id: "rug", img: "rug", c: 2, r: 2, w: 2, d: 2, k: 1, flat: true },
  { id: "plant", img: "plant", c: 0, r: 0, w: 1, d: 1, k: 0.8 },
  {
    id: "shelf-low",
    img: "shelf-low",
    face: "R",
    c: 0,
    r: 1,
    w: 1,
    d: 1,
    k: 1.05,
    hide: 20,
    open: "posts",
    name: { ko: "책장 · 글", en: "Bookshelf · Writing" },
  },
  {
    id: "shelf-tall",
    img: "shelf-tall",
    face: "R",
    c: 0,
    r: 1,
    w: 1,
    d: 1,
    k: 1.05,
    need: 20,
    open: "posts",
    name: { ko: "책장 · 글", en: "Bookshelf · Writing" },
  },
  { id: "sofa", img: "sofa", face: "R", c: 0, r: 2, w: 1, d: 2, k: 1, need: 5 },
  {
    id: "nacho",
    img: "nacho",
    c: 1,
    r: 3,
    w: 1,
    d: 1,
    k: 0.6,
    need: 10,
    open: "nacho",
    name: { ko: "나쵸", en: "Nachos" },
  },
  { id: "lamp", img: "lamp", c: 0, r: 4, w: 1, d: 1, k: 0.5 },
  { id: "record", img: "record", face: "R", c: 0, r: 5, w: 1, d: 1, k: 1, need: 25 },
  { id: "armchair", img: "armchair", face: "R", c: 1, r: 5, w: 1, d: 1, k: 0.95, need: 40 },
  { id: "beanbag", img: "beanbag", c: 2, r: 5, w: 1, d: 1, k: 0.8, need: 15 },
  {
    id: "desk",
    img: "desk",
    face: "L",
    c: 1,
    r: 0,
    w: 2,
    d: 1,
    k: 1,
    open: "latest",
    name: { ko: "책상 · 최근 글", en: "Desk · Latest" },
  },
  {
    id: "board",
    img: "board",
    face: "L",
    c: 3,
    r: 0,
    w: 1,
    d: 1,
    k: 1,
    open: "years",
    name: { ko: "게시판 · 연도", en: "Board · Years" },
  },
  {
    id: "cabinet",
    img: "cabinet",
    face: "L",
    c: 4,
    r: 0,
    w: 1,
    d: 1,
    k: 1,
    open: "works",
    name: { ko: "진열장 · 작업", en: "Cabinet · Work" },
  },
  {
    id: "trophy",
    img: "github-trophy",
    c: 5,
    r: 1,
    w: 1,
    d: 1,
    k: 0.36,
    open: "contributions",
    name: { ko: "트로피 · 오픈소스", en: "Trophy · Open source" },
  },
  {
    id: "mailbox",
    img: "github-mailbox",
    c: 5,
    r: 3,
    w: 1,
    d: 1,
    k: 0.4,
    open: "github",
    name: { ko: "우편함 · GitHub", en: "Mailbox · GitHub" },
  },
  {
    id: "linkedin",
    img: "linkedin-sign",
    c: 4,
    r: 5,
    w: 1,
    d: 1,
    k: 0.46,
    open: "linkedin",
    name: { ko: "표지판 · LinkedIn", en: "Sign · LinkedIn" },
  },
  { id: "books", img: "book-stack", c: 1, r: 1, w: 1, d: 1, k: 0.55, need: 30, open: "posts" },
  { id: "boxes", img: "boxes", c: 6, r: 5, w: 1, d: 1, k: 0.7, need: 30 },
  { id: "whiteboard", img: "whiteboard", c: 6, r: 2, w: 1, d: 1, k: 0.7, need: 50 },
  { id: "dog-bed", img: "dog-bed", c: 4, r: 3, w: 1, d: 1, k: 0.9 },
  {
    id: "chani",
    img: "chani-wave",
    alt: "chani-laptop",
    c: 3,
    r: 3,
    w: 1,
    d: 1,
    k: 0.55,
    actor: true,
    open: "chani",
    name: { ko: "차니", en: "Chanii" },
  },
  {
    id: "jindo",
    img: "jindo-lie",
    alt: "jindo-sit",
    c: 4,
    r: 3,
    w: 1,
    d: 1,
    k: 0.55,
    actor: true,
    above: true,
    open: "jindo",
    name: { ko: "진도", en: "Jindo" },
  },
]

export const ROOM_TEXT = {
  label: { ko: "차니의 방", en: "Chanii's room" },
  reset: { ko: "처음 배치로", en: "Reset layout" },
  copy: { ko: "배치 복사", en: "Copy layout" },
  copied: { ko: "복사했습니다", en: "Copied" },
  close: { ko: "닫기", en: "Close" },
  all: { ko: "전체 목록", en: "All writing" },
  timeline: { ko: "아래 타임라인에서", en: "See the timeline below" },
  work: { ko: "작업 전체", en: "All work" },
  about: { ko: "소개", en: "About" },
  linkedinSoon: { ko: "주소를 곧 걸어 둘게요.", en: "Link coming soon." },
  github: {
    ko: "코드와 이슈, 그리고 연락은 여기로.",
    en: "Code, issues, and the best way to reach me.",
  },
  chani: {
    ko: "밤샘 공부와 오픈소스 기여. 나쵸를 좋아한다.",
    en: "Late-night study and open source. Loves nachos.",
  },
  jindo: {
    ko: "호기심 많고 생각이 빠른, 가끔 사고뭉치.",
    en: "Curious, quick-witted, sometimes a troublemaker.",
  },
  nacho: { ko: "밤샘 공부의 연료.", en: "Fuel for late nights." },
} satisfies Record<string, Text>
