/**
 * 홈 타임라인 데이터. `content/timeline.yml`의 사건과 글 frontmatter를 합쳐 연도별로 묶는다.
 *
 * - devlog, projects 글은 날짜를 보고 자동으로 들어간다.
 * - 다른 글은 frontmatter `timeline: true`일 때만, `timeline: false`면 어느 글이든 빠진다.
 * - `timeline: { title, desc, kind }`로 글의 제목·설명·분류를 바꿀 수 있다.
 *
 * 단독 실행하면 JSON을 쓴다: `tsx build/timeline.ts out.json`
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"
import type { Plugin } from "vite"
import { z } from "zod"
import { CONTENT_DIR, loadContent } from "./content.ts"

export const TIMELINE_FILE = path.join(CONTENT_DIR, "timeline.yml")

/** 글이 자동으로 들어가는 섹션과 그 분류 이름 */
const AUTO_SECTIONS: Record<string, string> = { devlog: "조사 기록", projects: "회고" }
const SECTION_KIND: Record<string, string> = { ...AUTO_SECTIONS, notes: "노트" }
/** 영어 홈에서 쓰는 분류 이름. 글 제목과 설명은 한국어 그대로 둔다 */
const SECTION_KIND_EN: Record<string, string> = {
  devlog: "Devlog",
  projects: "Retrospective",
  notes: "Note",
}

const itemTextSchema = z.object({
  kind: z.string(),
  title: z.string(),
  desc: z.string().optional(),
  preview: z.string().optional(),
})

const itemSchema = itemTextSchema.extend({
  href: z.string().optional(),
  /** 영어 홈에서 바꿔 보여줄 값. 없는 필드는 한국어 그대로 쓴다 */
  en: itemTextSchema.partial().optional(),
})

const fileSchema = z.object({
  years: z.array(
    z.object({
      year: z.number().int(),
      theme: z.string(),
      secret: z.string().optional(),
      en: z.object({ theme: z.string().optional(), secret: z.string().optional() }).optional(),
      items: z.array(itemSchema).default([]),
    }),
  ),
})

export type TimelineItem = z.infer<typeof itemSchema> & {
  /** 글에서 온 항목이면 true */
  post?: boolean
  /** 글 날짜 (YYYY-MM-DD). 사건 항목에는 없다 */
  date?: string
}

export type TimelineYear = Omit<z.infer<typeof fileSchema>["years"][number], "items"> & {
  items: TimelineItem[]
}

/** frontmatter `timeline` 값 */
const postOptionSchema = z
  .union([
    z.boolean(),
    z.object({
      title: z.string().optional(),
      desc: z.string().optional(),
      kind: z.string().optional(),
    }),
  ])
  .optional()

function readTimelineFile(): z.infer<typeof fileSchema> {
  const raw = fs.readFileSync(TIMELINE_FILE, "utf8")
  // 의존성을 늘리지 않으려고, 글 frontmatter를 읽는 gray-matter의 YAML 파서를 그대로 쓴다.
  const data: unknown = matter(`---\n${raw}\n---\n`).data
  const result = fileSchema.safeParse(data)
  if (result.success) return result.data
  const issues = result.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n")
  throw new Error(`timeline.yml 형식 오류\n${issues}`)
}

export function loadTimeline(): TimelineYear[] {
  const file = readTimelineFile()
  const years = new Map<number, TimelineYear>(
    file.years.map((y) => [y.year, { ...y, items: [...y.items] }]),
  )

  for (const entry of loadContent()) {
    if (entry.isIndex || entry.draft || !entry.date) continue
    const source = matter(fs.readFileSync(entry.file, "utf8")).data as Record<string, unknown>
    const option = postOptionSchema.safeParse(source.timeline)
    if (!option.success) throw new Error(`frontmatter timeline 형식 오류: ${entry.id}`)
    const value = option.data
    const included = value === undefined ? entry.section in AUTO_SECTIONS : value !== false
    if (!included) continue

    const custom = typeof value === "object" ? value : {}
    const date = new Date(entry.date).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" })
    const year = Number(date.slice(0, 4))
    const bucket = years.get(year) ?? { year, theme: "", items: [] }
    bucket.items.push({
      kind: custom.kind ?? SECTION_KIND[entry.section] ?? "글",
      title: custom.title ?? entry.title,
      desc: custom.desc ?? undefined,
      href: entry.url,
      preview: entry.description ?? undefined,
      post: true,
      date,
      en: { kind: SECTION_KIND_EN[entry.section] ?? "Post" },
    })
    years.set(year, bucket)
  }

  return [...years.values()].sort((a, b) => a.year - b.year)
}

const VIRTUAL_ID = "virtual:timeline"
const RESOLVED_ID = "\0" + VIRTUAL_ID

/** `virtual:timeline` 모듈을 제공한다. timeline.yml이나 글이 바뀌면 다시 만든다 */
export function timelinePlugin(): Plugin {
  return {
    name: "timeline",
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id !== RESOLVED_ID) return
      this.addWatchFile(TIMELINE_FILE)
      return `export const years = ${JSON.stringify(loadTimeline())}\n`
    },
    configureServer(server) {
      // 새로고침은 contentPlugin이 보낸다. 여기서는 옛 데이터가 남지 않게 모듈만 무효화한다.
      const refresh = (file: string) => {
        if (!file.startsWith(CONTENT_DIR)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
      }
      server.watcher.on("add", refresh)
      server.watcher.on("unlink", refresh)
      server.watcher.on("change", refresh)
    },
  }
}

// 단독 실행: 시안이나 디버깅용 JSON을 쓴다.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out = process.argv[2]
  const json = JSON.stringify({ years: loadTimeline() }, null, 2)
  if (out) {
    fs.writeFileSync(out, json)
    console.log(`timeline → ${out}`)
  } else {
    console.log(json)
  }
}
