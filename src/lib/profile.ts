/**
 * 홈, About, Work에 쓰는 소개 문구와 프로젝트 정보.
 * 공개된 저장소, 이슈, PR처럼 누구나 눌러서 확인할 수 있는 근거만 적는다.
 */
import type { Lang } from "./i18n.ts"

type Text = Record<Lang, string>

export type Link = { label: string; href: string }

export type Identity = { key: string; label: string; line: Text; href: string }

export const IDENTITIES: Identity[] = [
  {
    key: "01",
    label: "AGENTS",
    line: {
      ko: "에이전트가 쓰는 도구와 상태, 사람이 개입할 지점을 설계합니다.",
      en: "Agent engineering: tools, state, and where a human steps in.",
    },
    href: "/work#mit",
  },
  {
    key: "02",
    label: "ROOT CAUSE",
    line: {
      ko: "증상에서 원인까지 따라가서, 재현 방법과 수정안으로 정리합니다.",
      en: "Trace symptoms to causes, then give back a repro and a fix.",
    },
    href: "/work#open-source",
  },
  {
    key: "03",
    label: "SYSTEMS",
    line: {
      ko: "C로 짠 셸부터 Rust로 짠 패키지 매니저까지, 도구를 바닥부터 만듭니다.",
      en: "Tools built from the ground up, from a C shell to a Rust package manager.",
    },
    href: "/work#rpm",
  },
]

/** Work 페이지의 대표작. 증상 → 원인·판단 → 결정 → 결과 순서로 적는다 */
export type Work = {
  id: string
  title: string
  period: string
  tags: string[]
  problem: Text
  insight: Text
  decision: Text
  result: Text
  links: Link[]
}

export const SELECTED_WORKS: Work[] = [
  {
    id: "mit",
    title: "MIT — Meeting-based organizational knowledge",
    period: "2026.01 – 2026.03",
    tags: ["LangGraph", "Function Calling", "HITL", "FastAPI", "Neo4j"],
    problem: {
      ko: "회의록은 금방 현재 맥락과 어긋납니다. 회의와 결정 사항을 추적하는 에이전트가 필요했지만, 에이전트가 팀원 초대나 회의 삭제처럼 데이터를 바꾸는 일을 마음대로 하면 되돌리기 어렵습니다.",
      en: "Meeting notes drift from reality fast. We needed an agent that tracks meetings and decisions, but an agent that freely invites members or deletes meetings makes changes that are hard to undo.",
    },
    insight: {
      ko: "Planning/Executing 구조에 evaluator 게이트까지 두니 응답이 느려지고 컨텍스트가 복잡해졌습니다. 에이전트의 자율성은 모델보다, 도구를 어떤 단위로 열어 주고 언제 다시 판단하게 하느냐에 달려 있었습니다.",
      en: "A planner/executor split with an evaluator gate was slow and bloated the context. Autonomy came less from the model than from how tools were exposed and when the agent re-decides.",
    },
    decision: {
      ko: "ReAct 구조로 바꾸고, 데이터를 바꾸는 도구 호출에만 사람의 승인(HITL) 게이트를 뒀습니다. 매번 현재 시각을 묻던 도구 호출은 없애고, 시스템 프롬프트에 현재 시각을 넣었습니다. 팀에 도메인 용어집도 제안했습니다.",
      en: "Moved to ReAct and put a human-approval (HITL) gate only on mutating tool calls. Replaced the per-turn time lookup tool with the current time injected into the system prompt. Proposed a shared domain glossary for the team.",
    },
    result: {
      ko: "에이전트 파트를 맡아 최종 발표까지 마쳤고, 프로젝트가 끝난 뒤에는 LLM-as-a-Judge로 프롬프트를 정량 평가했습니다.",
      en: "Owned the agent part through the final demo, then evaluated prompts quantitatively with LLM-as-a-Judge after the project.",
    },
    links: [
      {
        label: "Repository",
        href: "https://github.com/boostcampaitech8/pro-nlp-finalproject-nlp-14",
      },
      { label: "회고 (KO)", href: "/projects/MIT" },
    ],
  },
  {
    id: "codex",
    title: "One cache file, two different Codex products",
    period: "2026.07",
    tags: ["Debugging", "Rust", "Caching", "Open source"],
    problem: {
      ko: "같은 설정인데 Codex 서브에이전트 도구가 어떤 세션에서는 보이고 어떤 세션에서는 사라졌습니다.",
      en: "With the same setup, Codex subagent tools appeared in some sessions and vanished in others.",
    },
    insight: {
      ko: "같은 바이너리를 쓰는 두 프로세스가 originator 값 때문에 서로 다른 모델 카탈로그를 받고, 캐시 파일 하나를 번갈아 덮어쓰고 있었습니다. 캐시 키에 어느 쪽 요청인지 구분하는 값이 빠져 있었던 거예요.",
      en: "Two processes on the same binary received different model catalogs because of their originator, and kept overwriting one shared cache file. The cache key lacked the request's identity.",
    },
    decision: {
      ko: "증상 보고(#33559)에서 멈추지 않고, 원인을 좁혀 별도 이슈(#33593)로 정리했습니다. 이 상태가 만들어지기까지의 PR 7개도 거슬러 올라가 확인했습니다.",
      en: "Went past the symptom report (#33559) and narrowed the cause into its own issue (#33593), tracing the seven PRs that produced the state.",
    },
    result: {
      ko: "재현 방법, 원인, 수정 방향을 담은 이슈와 devlog 글.",
      en: "An issue with repro, cause, and fix direction, plus a devlog write-up.",
    },
    links: [
      { label: "openai/codex #33593", href: "https://github.com/openai/codex/issues/33593" },
      { label: "Devlog", href: "/devlog/codex-model-cache-bug" },
    ],
  },
  {
    id: "rpm",
    title: "RPM — Rapid node Package Manager",
    period: "2023.03 – now",
    tags: ["Rust", "CLI", "Package resolution", "Spec-driven"],
    problem: {
      ko: "Node 패키지 매니저가 실제로 무엇을 하는지, 직접 만들어 보지 않으면 알 수 없었습니다.",
      en: "I couldn't really know what a Node package manager does without building one.",
    },
    insight: {
      ko: "설치, 의존성 해석, 스크립트 실행을 Rust로 하나씩 구현하면서, 동작을 먼저 명세로 고정해 두지 않으면 변경이 쌓일수록 흔들린다는 걸 배웠습니다.",
      en: "Implementing install, resolution, and script running in Rust taught me that behavior drifts as changes pile up unless it is pinned down in a spec first.",
    },
    decision: {
      ko: "워크스페이스 lockfile 같은 동작을 스펙 문서로 먼저 정의하고, 검증 게이트와 에이전트 기반 개발 흐름을 이 저장소에서 실험합니다.",
      en: "Define behavior such as the workspace lockfile in spec documents first, and use the repo to experiment with validation gates and agent-assisted development.",
    },
    result: {
      ko: "2023년부터 이어 온, 가장 오래된 개인 프로젝트.",
      en: "My longest-running personal project, since 2023.",
    },
    links: [{ label: "Repository", href: "https://github.com/nerdchanii/rpm" }],
  },
  {
    id: "socket-store",
    title: "socket-store / react-socket-store",
    period: "2022 – 2026",
    tags: ["TypeScript", "React", "WebSocket", "npm"],
    problem: {
      ko: "React에서 WebSocket 메시지를 상태로 다루는 코드가 컴포넌트마다 흩어져 있었습니다.",
      en: "Code that turned WebSocket messages into React state was scattered across components.",
    },
    insight: {
      ko: "프레임워크와 무관한 메시지 처리와 React 연결부를 한 패키지에 섞으면 둘 다 바꾸기 어려워집니다.",
      en: "Mixing framework-agnostic message handling with React bindings in one package makes both hard to change.",
    },
    decision: {
      ko: "코어(socket-store)와 React 어댑터(react-socket-store)로 경계를 나누고, 구독은 useSyncExternalStore로 연결했습니다. 버전 호환성 문서도 따로 두었습니다.",
      en: "Split a core (socket-store) from a React adapter (react-socket-store), wired subscriptions through useSyncExternalStore, and documented version compatibility.",
    },
    result: {
      ko: "npm에 배포한 라이브러리 두 개와 문서 사이트.",
      en: "Two libraries published on npm, with a docs site.",
    },
    links: [
      { label: "react-socket-store", href: "https://github.com/nerdchanii/react-socket-store" },
      { label: "socket-store", href: "https://github.com/nerdchanii/socket-store" },
      { label: "Docs", href: "https://nerdchanii.github.io/react-socket-store/" },
    ],
  },
]

export type Contribution = {
  repo: string
  ref: string
  title: string
  status: string
  href: string
}

/** 이 세션에서 GitHub로 확인한 기여만 적는다 */
export const CONTRIBUTIONS: Contribution[] = [
  {
    repo: "solidjs/templates",
    ref: "#271",
    title: "fix(with-tanstack-router): use per-request router for SSR",
    status: "MERGED · 2026-08",
    href: "https://github.com/solidjs/templates/pull/271",
  },
  {
    repo: "solidjs-community/solid-cli",
    ref: "#87",
    title: "feat(create): let you type to filter starter templates",
    status: "MERGED · 2026-08",
    href: "https://github.com/solidjs-community/solid-cli/pull/87",
  },
  {
    repo: "solidjs-community/solid-cli",
    ref: "#78 #79 #80",
    title: "fix: clean up v1/v2 templates list",
    status: "MERGED · 2026-07",
    href: "https://github.com/solidjs-community/solid-cli/pulls?q=is%3Apr+author%3Anerdchanii",
  },
  {
    repo: "openai/codex",
    ref: "#33593",
    title: "Shared models_cache.json oscillates between originator-specific catalogs",
    status: "OPEN · 2026-07",
    href: "https://github.com/openai/codex/issues/33593",
  },
]

export type Experiment = { title: string; line: Text; status: Text; href: string }

export const EXPERIMENTS: Experiment[] = [
  {
    title: "solid-tanstack-router-ssr-race",
    line: {
      ko: "동시에 들어온 SSR 요청끼리 라우터 상태가 섞이는 문제를 재현한 저장소. templates #271로 이어졌습니다.",
      en: "A reproducer for router state leaking across concurrent SSR requests; led to templates #271.",
    },
    status: { ko: "완료", en: "Done" },
    href: "https://github.com/nerdchanii/solid-tanstack-router-ssr-race",
  },
  {
    title: "Realtime Markdown Editor",
    line: {
      ko: "TipTap, Yjs, Hocuspocus로 만든 동시 편집 문서 워크스페이스. 오프라인 복구와 체크포인트까지 구현했습니다.",
      en: "A collaborative document workspace on TipTap, Yjs, and Hocuspocus, with offline recovery and checkpoints.",
    },
    status: { ko: "과제 범위 완료", en: "Scope complete" },
    href: "https://github.com/nerdchanii/realtime-markdown-editor",
  },
  {
    title: "Jindo",
    line: {
      ko: "Ollama 기반 로컬 MCP 에이전트. 대화 모델과 함수 호출 모델을 나눠, 도구 호출을 작은 모델에 맡겨 본 실험.",
      en: "A local MCP agent on Ollama, splitting the chat model from a small function-calling model.",
    },
    status: { ko: "실험", en: "Experiment" },
    href: "https://github.com/nerdchanii/jindo",
  },
  {
    title: "MCQA — 수능형 문제 풀이",
    line: {
      ko: "Query Planning 기반 Advanced RAG와 학습 환경 구축. 부스트캠프 팀 프로젝트.",
      en: "Query-planning Advanced RAG and a training setup for Korean exam MCQA (boostcamp team project).",
    },
    status: { ko: "완료", en: "Done" },
    href: "/projects/수능형-문제-풀이(MCQA)",
  },
]

export type Milestone = { when: string; what: Text }

export const TIMELINE: Milestone[] = [
  {
    when: "2020 – 2023",
    what: {
      ko: "한국방송통신대학교 컴퓨터과학과",
      en: "Computer Science, Korea National Open University",
    },
  },
  {
    when: "2022",
    what: {
      ko: "첫 토이 프로젝트 코드스파링. 실시간으로 함께 코딩 테스트를 푸는 서비스",
      en: "First side project, Code Sparring: solving coding tests together in real time",
    },
  },
  {
    when: "2023 –",
    what: {
      ko: "42서울 10기. C로 만든 셸, C++로 만든 IRC 서버, 팀으로 만든 멀티플레이 웹 게임",
      en: "42 Seoul, 10th cohort: a shell in C, an IRC server in C++, a multiplayer web game as a team",
    },
  },
  {
    when: "2025 – 2026",
    what: {
      ko: "네이버 부스트캠프 AI Tech 8기 NLP. MRC, MCQA, 최종 프로젝트 MIT",
      en: "NAVER boostcamp AI Tech, 8th cohort (NLP): MRC, MCQA, and the final project MIT",
    },
  },
  {
    when: "2026",
    what: {
      ko: "Codex 캐시 버그 분석, SolidJS 생태계 PR 병합. 에이전트가 어디까지 스스로 하고 어디서 사람에게 물을지 고민하는 중",
      en: "Codex cache bug analysis, merged PRs in the SolidJS ecosystem, work on agent autonomy and human boundaries",
    },
  },
]

export const PRINCIPLES: { title: Text; body: Text }[] = [
  {
    title: { ko: "용어를 먼저 맞춘다", en: "Agree on words first" },
    body: {
      ko: "같은 단어로 다른 것을 떠올리면 설계가 흔들립니다. MIT에서도 도메인 용어집을 먼저 만들었습니다.",
      en: "When the same word means different things, the design wobbles. On MIT, the domain glossary came first.",
    },
  },
  {
    title: { ko: "계약을 먼저 세운다", en: "Contracts before code" },
    body: {
      ko: "입력과 출력, 바뀌면 안 되는 것을 먼저 정하고, 유연해도 되는 곳과 단단해야 하는 곳을 나눕니다.",
      en: "Pin down inputs, outputs, and invariants first; decide where to stay flexible and where to be strict.",
    },
  },
  {
    title: { ko: "실측으로 확인한다", en: "Measure, don't assume" },
    body: {
      ko: "모델이 스스로 됐다고 하는 말이나 느낌 대신, 재현과 테스트, 기록을 보고 판단합니다.",
      en: "Judge by reproduction, tests, and records rather than self-reports or hunches.",
    },
  },
]

export const ABOUT_INTRO: Text[] = [
  {
    ko: "김예찬입니다. 에이전트가 스스로 일하되, 사람이 결정해야 하는 곳에서는 멈추고 묻는 시스템을 만듭니다.",
    en: "I'm Yechan Kim. I build systems where agents work on their own, and stop to ask where a person should decide.",
  },
  {
    ko: "42서울에서는 C로 셸을, C++로 IRC 서버를 만들며 시스템의 바닥을 익혔습니다. 부스트캠프에서는 RAG와 에이전트를 만들면서, 품질을 가르는 건 모델 바깥의 설계라는 걸 배웠어요. 요즘은 그 둘 사이에서, 에이전트에게 무엇을 맡기고 어디서 사람에게 물을지 정하는 일에 관심이 있습니다.",
    en: "At 42 Seoul I learned the bottom of the stack by writing a shell in C and an IRC server in C++. At boostcamp, building RAG and agents taught me that the design around the model decides the quality. Now I work on connecting the two: deciding what to hand to an agent and what to give back to a person.",
  },
  {
    ko: "버그를 만나면 증상에서 멈추지 않고 원인까지 따라가는 편입니다. 그렇게 찾은 원인은 재현 저장소나 이슈, PR로 남겨서 원래 프로젝트에 보태려고 해요.",
    en: "When I hit a bug, I follow it past the symptom to the cause, and try to give it back as a reproducer, an issue, or a PR.",
  },
]

/** 홈(타임라인)의 문구 */
export const HOME: {
  hello: Text
  /** 인사 아래의 인용. 원문을 크게, 번역과 출처를 작게 보인다 */
  quote: { text: string; lang: string; translation: Text; source: Text }
  /** 검색 결과와 공유 카드에 보이는 설명 */
  description: Text
  /** 인사 위의 한 줄. 이곳이 누구의 어떤 기록인지 */
  tagline: Text
  short: Text[]
  /** {n}을 채운다 */
  records: Text
  railLabel: Text
  counter: Text
  allFound: Text
  outro: Text
  outroLinks: { label: Text; href: string }[]
  secretFound: Text
  secretHidden: Text
  close: Text
} = {
  hello: { ko: "안녕하세요, 김예찬입니다.", en: "Hello, I'm Yechan Kim." },
  quote: {
    // 『나와 너』(Ich und Du, 1923) 1부, 예술의 근원을 말하는 대목. 번역은 원문에서 직접 옮겼다.
    text: "Diene ich ihm nicht recht, so zerbricht es, oder es zerbricht mich.",
    lang: "de",
    translation: {
      ko: "제대로 섬기지 않으면 작품이 부서지거나, 작품이 나를 부순다.",
      en: "If I do not serve it rightly, it breaks, or it breaks me.",
    },
    source: { ko: "마르틴 부버, 『나와 너』", en: "Martin Buber, I and Thou" },
  },
  description: {
    ko: "'왜?'가 풀릴 때까지 파고드는 개발자 김예찬(nerdchanii)의 기록입니다. 요즘 파고 있는 건 AI 에이전트예요.",
    en: 'Notes from Yechan Kim (nerdchanii), a developer who digs until the "why" is answered. These days I\'m digging into AI agents.',
  },
  tagline: {
    ko: "'왜?'가 풀릴 때까지 파고드는 개발자",
    en: 'A developer who digs until the "why" is answered',
  },
  short: [
    {
      ko: "에이전트에게 무엇을 맡기고 무엇을 사람에게 물을지 고민하며 도구를 만듭니다.",
      en: "I build tools around what to hand to an agent and what to ask a person.",
    },
    { ko: "그 과정을 여기에 적어 두고 있어요.", en: "This is where I write it down." },
  ],
  records: { ko: "기록 {n}개", en: "{n} records" },
  railLabel: { ko: "연도로 이동", en: "Go to year" },
  counter: { ko: "찾은 이야기", en: "Stories found" },
  allFound: {
    ko: "다 찾으셨네요. 끝까지 봐 주셔서 고맙습니다.",
    en: "You found them all. Thank you for looking this closely.",
  },
  outro: { ko: "지금까지의 기록은 여기까지예요.", en: "That's the record so far." },
  outroLinks: [
    { label: { ko: "Writing", en: "Writing" }, href: "/blog" },
    { label: { ko: "Notes", en: "Notes" }, href: "/notes" },
    { label: { ko: "Work", en: "Work" }, href: "/work" },
    { label: { ko: "GitHub", en: "GitHub" }, href: "https://github.com/nerdchanii" },
  ],
  secretFound: { ko: "년의 숨은 이야기 (발견함)", en: ": hidden story (found)" },
  secretHidden: { ko: "년의 숨은 이야기", en: ": hidden story" },
  close: { ko: "닫기", en: "Close" },
}
