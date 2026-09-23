# 사이트 재구축 계획

Quartz 기반 블로그를 **직접 만든 정적 사이트(Vite + Solid + MDX + 자체 prerender)** 로 옮긴다.
사이트는 두 가지 역할을 한다.

1. **공개 글 공간**: 외부에 보여줘도 되는 아티클·devlog·공부 노트
2. **나를 보여주는 인덱스**: 레이어 UI(Three.js)로 표현한 "나"와 프로젝트 목록

> 이 저장소는 public이다. 저장소에 커밋된 글은 사이트에서 숨겨도(`draft`) 누구나 볼 수 있다.
> **사적인 노트·초안은 이 저장소에 두지 않는다.** 공개할 글만 옮겨온다.

---

## 1. 기술 스택

| 영역              | 선택                                               | 비고                                            |
| ----------------- | -------------------------------------------------- | ----------------------------------------------- |
| 빌드              | Vite                                               | dev 서버, client/SSR 번들                       |
| UI                | Solid (`solid-js`, `@solidjs/router`)              | SSR `renderToString` + hydrate                  |
| 콘텐츠            | MDX (`@mdx-js/rollup`)                             | `.md`, `.mdx` 모두 지원                         |
| 마크다운 플러그인 | remark-gfm, remark-math + rehype-katex, shiki      | 위키링크·callout은 직접 만든 remark 플러그인    |
| frontmatter       | gray-matter + zod                                  | 스키마 검증                                     |
| 스타일            | CSS Modules + 전역 CSS 변수(토큰, 다크모드)        | 본문(prose)은 전역 스타일 한 벌                 |
| 3D                | Three.js 직접 사용                                 | Solid `onMount`에서 씬 생성, signal로 UI와 연결 |
| 언어 / 런타임     | TypeScript, Node 22, npm                           |                                                 |
| 배포              | GitHub Actions → GitHub Pages (workflow 방식 유지) |                                                 |

스타일은 CSS Modules와 Tailwind 중 CSS Modules로 시작한다. MDX 본문 스타일링이 자연스럽고, 의존성이 없어서 "직접 만드는" 방향과 맞는다.

---

## 2. 디렉터리 구조

```
/
├── content/                  # 글 원본 (source of truth)
│   ├── devlog/
│   ├── notes/
│   │   ├── math/
│   │   └── reading/
│   ├── research/
│   └── projects/             # 프로젝트 소개 + 회고
├── public/                   # 정적 파일 (favicon, og 기본 이미지)
├── src/
│   ├── entry-client.tsx      # hydrate
│   ├── entry-server.tsx      # renderToString(url) → { html, head }
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes.tsx        # 라우트 테이블
│   ├── pages/                # Home, PostList, Post, Tag, Project, About, NotFound
│   ├── components/
│   │   ├── layout/           # Header, Footer, Toc, Backlinks
│   │   └── mdx/              # MDX에서 쓰는 컴포넌트 (Callout, Figure, ...)
│   ├── features/
│   │   └── layers/           # 랜딩 레이어 UI (Three.js)
│   ├── lib/                  # 날짜, url 유틸 등
│   └── styles/               # tokens.css, prose.css, global.css
├── build/                    # 직접 만드는 SSG
│   ├── content.ts            # content 스캔 → 인덱스 생성
│   ├── slug.ts               # slug 규칙
│   ├── remark/               # wikilink, callout, 이미지 경로 플러그인
│   ├── prerender.ts          # 라우트별 HTML 생성
│   └── outputs.ts            # rss, sitemap, search index, redirects
├── vite.config.ts
└── .github/workflows/deploy.yaml
```

---

## 3. 콘텐츠 모델

### frontmatter

```yaml
title: 미분 # 필수
slug: derivative # 선택. 없으면 파일명에서 만든다
date: 2025-09-23 # 선택. 없으면 git 최초 커밋 날짜
updated: ... # 선택. 없으면 git 마지막 커밋 날짜
tags: [math]
description: ... # 선택. 없으면 본문 앞부분에서 추출
draft: false # true면 빌드에서 제외 (저장소에는 남는다는 점 주의)
comments: true # giscus 표시 여부
aliases: [] # 예전 URL. 리다이렉트 페이지를 만든다
cover: ./images/x.png # 선택. OG 이미지
```

### slug 규칙 (한글·영문 모두 지원)

1. frontmatter `slug`가 있으면 그 값을 쓴다. 영문이든 한글이든 상관없다.
2. 없으면 **파일명**에서 만든다. 공백은 `-`로 바꾸고, URL에 문제가 되는 문자(`?`, `#`, `%` 등)는 제거한다. 한글은 그대로 둔다.
3. 최종 URL은 `/{폴더 경로}/{slug}`이다. 폴더 이름도 같은 규칙을 따르고, 폴더의 `index.md`에 `slug`를 둬서 바꿀 수 있다.

예시:

| 파일                              | frontmatter        | URL                             |
| --------------------------------- | ------------------ | ------------------------------- |
| `notes/math/미분.md`              | 없음               | `/notes/math/미분`              |
| `notes/math/미분.md`              | `slug: derivative` | `/notes/math/derivative`        |
| `devlog/codex-model-cache-bug.md` | 없음               | `/devlog/codex-model-cache-bug` |

slug가 겹치면 빌드를 실패시킨다.

### 기존 URL 호환

Quartz 시절 URL(예: `/수학정리/미분`)은 마이그레이션할 때 각 글의 `aliases`에 넣는다.
빌드 시 alias마다 `<meta http-equiv="refresh">`와 `<link rel="canonical">`을 가진 리다이렉트 HTML을 만든다.

### 기존 문법 지원

| 문법                              | 처리                                                                  |
| --------------------------------- | --------------------------------------------------------------------- |
| `[[글 제목]]`, `[[파일명\|표시]]` | remark 플러그인. 콘텐츠 인덱스로 실제 URL을 찾고, 못 찾으면 빌드 경고 |
| `![[image.png]]`                  | 같은 폴더나 `images/`에서 찾아 일반 이미지로 변환                     |
| `> [!note]` callout               | remark 플러그인 → `<Callout type="note">`                             |
| `$...$`, `$$...$$`                | remark-math + rehype-katex                                            |

---

## 4. 라우팅

`@solidjs/router`를 서버(`url` 지정)와 클라이언트에서 같은 라우트 테이블로 쓴다.

| 경로                                            | 페이지      | 내용                                                  |
| ----------------------------------------------- | ----------- | ----------------------------------------------------- |
| `/`                                             | Home        | 레이어 UI + 최근 글. JS가 없거나 모바일이면 목록 화면 |
| `/about`                                        | About       | 소개, 이력, 연락처                                    |
| `/projects`                                     | ProjectList | 프로젝트 인덱스                                       |
| `/projects/:slug`                               | Project     | 프로젝트 상세 (회고 포함)                             |
| `/blog`                                         | Blog        | 전체 글 (섹션·태그 필터)                              |
| `/devlog/:slug`, `/notes/**`, `/research/:slug` | Post        | 글 본문 + 목차 + 백링크 + 댓글                        |
| `/{섹션}`                                       | Section     | 폴더 인덱스 (`index.md` 내용 + 글 목록)               |
| `/tags/:tag`                                    | Tag         | 태그별 목록                                           |
| `*`                                             | NotFound    | `404.html`로 출력                                     |

prerender는 콘텐츠 인덱스에서 만든 **모든 경로 목록**을 돌면서 `dist/{경로}/index.html`을 만든다.
그래서 GitHub Pages에서 어떤 URL로 바로 들어와도 정적 HTML이 뜨고, 그 뒤 hydrate된다.

각 글은 **자기 청크로 lazy import**해서 첫 로딩에 모든 글이 딸려오지 않게 한다.

---

## 5. 데이터 / "API"

서버가 없는 정적 사이트이므로 API는 **빌드 시점에 만드는 데이터**를 뜻한다.

### 빌드 타임 (앱 내부)

`build/content.ts`가 `content/`를 스캔해서 Vite 가상 모듈로 넘긴다.

```ts
import { posts, getPost, tags, backlinks } from "virtual:content"

type PostMeta = {
  id: string // content 기준 파일 경로
  url: string
  title: string
  section: "devlog" | "notes" | "research" | "projects"
  date: string
  updated: string
  tags: string[]
  description: string
  draft: boolean
  links: string[] // 이 글이 링크하는 글 id (백링크 계산용)
  load: () => Promise<MDXModule> // 본문 lazy import
}
```

### 정적 출력 파일 (외부용)

| 파일                  | 용도                                             |
| --------------------- | ------------------------------------------------ |
| `/index.xml`          | RSS 피드 (Quartz 시절 주소 유지)                 |
| `/sitemap.xml`        | 검색엔진                                         |
| `/search.json`        | 클라이언트 검색 인덱스 (나중 단계)               |
| `/graph.json`         | 글 연결 그래프. 레이어 UI의 조각 데이터로도 쓴다 |
| `/{alias}/index.html` | 예전 URL 리다이렉트                              |

### 외부 서비스

- **giscus**: `specific` 매핑으로 글마다 `commentPath`를 넘긴다. 옮긴 글은 첫 번째 절대 경로 alias(= Quartz 시절 URL)를 쓰고, 형식은 giscus `pathname` 매핑과 같게 퍼센트 인코딩 + 앞 `/` 제외로 맞췄다. 배포 후 기존 댓글이 붙는지 한 번 확인할 것.
- 분석 도구는 현재 Quartz 설정을 확인한 뒤 유지 여부를 정한다.

---

## 6. 빌드 파이프라인

```
npm run build
 1. content 스캔 → frontmatter 검증(zod) → slug·URL 확정 → 링크 그래프 계산
 2. vite build            (client 번들 → dist/)
 3. vite build --ssr      (entry-server → .ssr/)
 4. prerender             (경로마다 renderToString → head(title, OG) 삽입 → dist/**/index.html)
 5. outputs               (rss, sitemap, graph.json, redirects, 404.html, .nojekyll)
```

---

## 7. 진행 단계

- [x] **Phase 1. 뼈대**: Quartz 제거, Vite + Solid + MDX 설정, SSR entry, 모든 글을 prerender해서 정적 HTML로 출력, hydration 확인
- [x] **Phase 2. 콘텐츠 파이프라인**: 콘텐츠 인덱스, slug 규칙, 위키링크·callout·이미지·KaTeX·코드 하이라이팅(shiki), git 기반 날짜, 자동 description, frontmatter 스키마 검증(zod), 폴더 매핑과 예전 URL `aliases` 리다이렉트
- [x] **Phase 3. 페이지**: 헤더·푸터 레이아웃, 다크모드 토글(깜빡임 없음), 연도별 글 목록, 태그 목록·태그별 페이지, 목차, 백링크, 폴더 index의 하위 폴더·글 목록, giscus 댓글
- [ ] **Phase 4. 출력과 배포**: OG 메타, sitemap, GitHub Actions 배포 (RSS `/index.xml`과 리다이렉트는 먼저 반영됨)
- [ ] **Phase 5. 랜딩**: 레이어 UI (Three.js) + 목록 대체 화면, 프로젝트 데이터 연결
- [ ] **Phase 6. 추가 기능**: 클라이언트 검색 등

Phase 1~4가 끝나면 지금 블로그를 완전히 대체한다. 그 시점에 배포를 전환한다.

---

## 8. 결정 사항

- [x] 폴더 매핑: `수학정리 → notes/math`, `reading → notes/reading`, `project/memo → research`, `project/회고 → projects`. 예전 URL은 각 글의 `aliases`로 리다이렉트한다.
- [x] 글 목록 경로: `/blog`
- [ ] 42 SEOUL, MIT, MCQA 회고를 프로젝트 페이지로 볼지, 글로 둘지
- [ ] 레이어 UI에 넣을 레이어와 조각 내용

## 9. 구현 메모

- **MDX → Solid**: MDX는 `@mdx-runtime`(`src/mdx/jsx-runtime.ts`)로 컴파일된다. 모든 태그를 `Dynamic`으로 넘겨서 SSR과 hydration이 같은 경로를 탄다. Solid 컴파일러는 MDX 파일을 거치지 않는다.
- **글 본문 lazy 로딩**: 글마다 `lazy()` 청크. 서버는 렌더 전에, 클라이언트는 hydrate 전에 현재 글 청크를 `preload()`한다.
- **head 태그**: `@solidjs/meta`의 태그는 렌더 중에만 `getAssets()`로 읽을 수 있어서, 트리 맨 끝에서 읽는다 (`src/entry-server.tsx`).
- **로컬 확인**: `vite preview`는 `/devlog`처럼 끝에 `/`가 없는 경로에 루트 `index.html`을 돌려줘서 hydration이 깨진 것처럼 보인다. GitHub Pages처럼 동작하는 정적 서버(`python3 -m http.server -d dist`)로 확인한다.
- **giscus**: 기존 설정은 `mapping: pathname`이다. URL이 바뀌면 기존 댓글과 연결이 끊기므로, Phase 3에서 옛 경로를 `term`으로 넘기는 방식을 검토한다. (repo `nerdchanii/nerdchanii.github.io`, category `Announcements`)
- **분석**: 기존 Quartz 설정에 Google Analytics(`G-P68QDJ67M0`)가 있었다. 유지 여부는 Phase 4에서 정한다.
