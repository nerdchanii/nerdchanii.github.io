/**
 * Daily AI 회차에 나오는 픽셀 그림.
 * 파일은 content/daily-ai/images/에 있고, 빌드가 `/_media/daily-ai/images/`로 내보낸다.
 * 모든 그림은 240×300 투명 배경 타일이다. 이름을 여기에 등록해야 회차에서 쓸 수 있다.
 */
export const SPRITES = {
  "chani-hello": "손을 흔드는 차니",
  "chani-laptop": "노트북을 가리키며 설명하는 차니",
  "chani-sleepy": "노트북을 안고 눈을 감은 차니",
  "jindo-sit": "앉아서 고개를 갸웃하는 진도",
  "jindo-excited": "앞발을 든 진도",
  "jindo-nachos": "나쵸를 흘리고 찔린 얼굴의 진도",
  dots: "OpenAI dots의 기본 아바타를 픽셀로 옮긴 그림",
  muse: "Meta Muse의 마스코트 Jolly를 픽셀로 옮긴 그림",
  grokbot: "xAI Grok Bot의 마크를 픽셀로 옮긴 그림",
  spark: "Gemini Spark를 나타내는 번개 모양 장난감 로봇",
  "google-engineer": "머쓱해하는 가상의 구글 엔지니어",
  altman: "샘 알트먼을 그린 픽셀 그림",
  zuckerberg: "마크 저커버그를 그린 픽셀 그림",
  musk: "일론 머스크를 그린 픽셀 그림",
} as const

export type SpriteName = keyof typeof SPRITES

/** 타일의 가로세로 비 (240 / 300) */
export const SPRITE_RATIO = 0.8

export function spriteUrl(name: SpriteName): string {
  return `/_media/daily-ai/images/${name}.webp`
}

/** 회차 글(MDX)은 타입 검사를 받지 않으므로, 등록되지 않은 이름은 빌드에서 멈춘다 */
export function assertSprite(name: string): asserts name is SpriteName {
  if (!(name in SPRITES)) throw new Error(`Daily AI: 등록되지 않은 그림 이름: ${name}`)
}
