# nerdchanii.github.io

개인 사이트이자 블로그. Vite + Solid + MDX로 직접 만든 정적 사이트다.
구조와 진행 상황은 [PLAN.md](./PLAN.md)에 정리돼 있다.

## 명령어

```sh
npm install
npm run dev      # 개발 서버
npm run build    # dist/ 에 정적 사이트 생성 (client → SSR → prerender)
npm run check    # 타입 체크 + 포맷 확인
```

## 글 쓰기

`content/` 아래에 `.md` 또는 `.mdx` 파일을 추가한다. 폴더 구조가 URL이 된다.

| 폴더        | 내용                            |
| ----------- | ------------------------------- |
| `devlog/`   | 기술 글, 디버깅 기록            |
| `notes/`    | 공부 노트 (`math/`, `reading/`) |
| `research/` | 리서치 메모                     |
| `projects/` | 프로젝트와 회고                 |

Obsidian 문법(`[[위키링크]]`, `![[이미지]]`, `> [!note]` callout)과 `$수식$`을 그대로 쓸 수 있다.

```yaml
---
title: 글 제목
slug: english-slug # 선택. 없으면 파일명이 URL이 된다
tags: [tag]
draft: true # 선택. 빌드에서 제외 (저장소에는 남는다)
aliases: [/예전/주소] # 선택. 이 주소로 들어오면 이 글로 보낸다
---
```

이 저장소는 public이다. 공개할 글만 커밋한다.
