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

| 폴더        | 내용                                         |
| ----------- | -------------------------------------------- |
| `devlog/`   | 기술 글, 디버깅 기록                         |
| `notes/`    | 공부 노트 (`math/`, `reading/`, `research/`) |
| `projects/` | 프로젝트와 회고                              |

Obsidian 문법(`[[위키링크]]`, `![[이미지]]`, `> [!note]` callout, `#태그`)과 `$수식$`을 그대로 쓸 수 있다. 일반 마크다운의 상대 경로(`[글](../other.md)`, `![](images/a.png)`)도 사이트 주소로 바뀐다.

```yaml
---
title: 글 제목
slug: english-slug # 선택. 없으면 파일명이 URL이 된다
tags: [tag] # 본문의 #태그도 태그로 모인다
date: 2026-09-23 # 선택. 없으면 git 첫 커밋 날짜
updated: 2026-09-24 # 선택. 없으면 git 마지막 커밋 날짜
image: images/cover.png # 선택. 링크 미리보기 이미지 (`cover`도 된다). 없으면 본문 첫 이미지, 그것도 없으면 public/og.png
draft: true # 선택. 빌드에서 제외 (저장소에는 남는다)
aliases: [/예전/주소] # 선택. 이 주소로 들어오면 이 글로 보낸다
---
```

이 저장소는 public이다. 공개할 글만 커밋한다.

## PR 미리보기

PR을 열면 CI가 빌드 결과를 Cloudflare Pages에 올리고 주소를 PR 댓글로 남긴다
(`https://pr-<번호>.<프로젝트>.pages.dev`). 같은 PR에 다시 push하면 같은 주소가 갱신된다.
GitHub Pages는 저장소당 사이트 하나만 두기 때문에 미리보기는 따로 올린다.

처음 한 번만 설정한다. 설정이 없으면 미리보기 단계는 건너뛰고 빌드·검사만 한다.

1. Cloudflare 대시보드 → Workers & Pages → Create → Pages → **Upload assets**로 프로젝트를 만든다
   (이름은 `nerdchanii-github-io`. 다른 이름이면 저장소 variable `CLOUDFLARE_PAGES_PROJECT`에 적는다).
2. API 토큰을 만든다: My Profile → API Tokens → Create Token → **Edit Cloudflare Workers** 템플릿,
   또는 권한을 `Account / Cloudflare Pages / Edit`만 준 커스텀 토큰.
3. 저장소 Settings → Secrets and variables → Actions에 secret을 넣는다.
   - `CLOUDFLARE_API_TOKEN`: 위 토큰
   - `CLOUDFLARE_ACCOUNT_ID`: 대시보드 Workers & Pages 페이지 오른쪽의 Account ID

미리보기 배포에는 Cloudflare가 `X-Robots-Tag: noindex`를 붙이므로 검색에 잡히지 않고,
Google Analytics는 배포 주소(`site.config.json`의 `url`)에서만 켜지므로 미리보기 방문은 세지 않는다.
