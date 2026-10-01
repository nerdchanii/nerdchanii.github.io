/**
 * 선으로 그린 등장인물. 예전 픽셀 그림(room-home 브랜치의 public/room/chani-wave.png 등)을 밑그림으로 놓고 선을 땄다.
 * 각 함수는 <svg> 안에 넣을 마크업을 돌려준다. id는 clipPath 이름이 겹치지 않게 붙이는 접두어다.
 *
 * 클래스 (src/styles/line.css):
 * - paper: 바탕색으로 채워 뒤의 선을 가린다 / thin, soft: 가는 선 / ink: 먹색 채움 / hl: 눈의 반짝임
 * - sh: 그림자. 빛은 왼쪽 위에서 오고, 그 반대쪽과 아래에만 옅게 넣는다. 면 전체를 칠하지 않는다
 * - head, hand, typing, tail, ear, eyes: 살아 있는 움직임이 붙는 묶음
 */

/** 그림마다의 viewBox 크기 */
export const CAST_SIZE = { wave: [220, 370], laptop: [220, 360], jindo: [161, 212] } as const
export type CastKind = keyof typeof CAST_SIZE

/* 머리 (서 있는 자세 기준 좌표). 다른 자세에서는 옮겨서 쓴다 */
const headDefs = (id: string) =>
  `<clipPath id="${id}hair"><path d="M52 122 C40 120 30 108 36 96 C24 92 22 76 34 70 C24 60 30 44 44 44 C40 30 54 20 66 26 C70 12 90 8 100 16 C108 4 130 4 136 14 C148 6 168 14 166 28 C182 24 196 36 190 50 C206 52 214 68 204 78 C214 88 208 104 196 104 C200 116 190 126 180 122 C176 128 170 128 166 124 C160 112 146 100 134 94 C132 86 130 80 130 76 C128 84 126 90 122 94 C118 102 108 104 104 97 C100 106 90 106 85 100 C79 107 70 106 66 100 C58 104 54 112 52 122 Z"/></clipPath><clipPath id="${id}face"><path d="M52 122 C50 142 66 164 96 168 C122 170 144 160 153 147 L170 120 C150 96 80 92 52 120 Z"/></clipPath>`
const head = (id: string) => `<g class="head">
    <!-- 얼굴 -->
    <path class="paper" d="M52 120 C50 142 66 164 96 168 C122 170 144 160 152 146 L170 120 C150 96 80 92 52 120 Z" style="stroke:none"/>
    <path d="M52 122 C50 142 66 164 96 168 C122 170 144 160 153 147"/>
    <path class="paper" d="M160 129 C172 122 181 134 173 146 C168 153 158 153 153 147"/><path class="soft" d="M164 135 c5 0 6 6 2 9"/>
    <!-- 머리 -->
    <path class="paper" d="M52 122 C40 120 30 108 36 96 C24 92 22 76 34 70 C24 60 30 44 44 44 C40 30 54 20 66 26 C70 12 90 8 100 16 C108 4 130 4 136 14 C148 6 168 14 166 28 C182 24 196 36 190 50 C206 52 214 68 204 78 C214 88 208 104 196 104 C200 116 190 126 180 122 C176 128 170 128 166 124 C160 112 146 100 134 94 C132 86 130 80 130 76 C128 84 126 90 122 94 C118 102 108 104 104 97 C100 106 90 106 85 100 C79 107 70 106 66 100 C58 104 54 112 52 122 Z"/>
    <g clip-path="url(#${id}hair)"><path class="sh" d="M202 34 C188 70 166 98 126 110 C94 120 60 116 34 106 L26 140 L232 140 L232 34 Z"/></g>
    <g clip-path="url(#${id}face)"><path class="sh" d="M50 118 C56 110 64 106 68 106 C74 112 80 112 86 106 C92 112 102 110 106 103 C112 108 120 106 124 100 C128 96 131 90 132 84 C138 100 152 108 166 124 L172 112 L130 70 L48 100 Z"/><path class="sh" d="M148 100 C152 124 144 152 120 172 L172 172 L178 104 Z"/></g>
    <path class="thin" d="M58 64 c8 -12 25 -5 18 9 c-4 7 -14 5 -11 -3"/>
    <path class="thin" d="M92 42 c10 -12 29 -3 20 11 c-5 7 -15 4 -11 -4"/>
    <path class="thin" d="M140 44 c13 -10 27 4 15 16 c-6 6 -15 2 -10 -6"/>
    <path class="thin" d="M168 78 c11 -8 23 4 13 14 c-5 5 -13 2 -9 -5"/>
    <path class="thin" d="M42 90 c6 -9 18 -4 14 6"/><path class="thin" d="M114 68 c10 -8 20 0 14 10"/><path class="thin" d="M76 84 c8 -8 18 -2 13 7"/><path class="thin" d="M150 88 c9 -6 17 2 11 10"/>
    <path class="thin" d="M72 30 c8 -4 16 0 16 8"/><path class="thin" d="M120 22 c9 -3 16 3 14 10"/><path class="thin" d="M178 46 c8 0 12 7 9 14"/><path class="thin" d="M186 100 c6 2 8 9 4 14"/>
    <path class="thin" d="M130 12 c2 -8 10 -10 15 -6"/><path class="thin" d="M34 58 c-8 -1 -11 -9 -6 -15"/><path class="thin" d="M206 70 c8 -2 10 -10 5 -15"/><path class="thin" d="M60 24 c-4 -6 -1 -12 5 -13"/>
    <!-- 눈썹 · 눈 · 볼 · 입 -->
    <path class="thin" d="M110 113 q11 -5 21 1"/>
    <g class="eyes">
      <ellipse class="ink f" cx="75" cy="128" rx="7" ry="9"/><circle class="hl f" cx="72.5" cy="124.5" r="2.5"/>
      <ellipse class="ink f" cx="121" cy="134" rx="7" ry="9"/><circle class="hl f" cx="118.5" cy="130.5" r="2.5"/>
    </g>
    <path class="soft" d="M55 144 l4 -3 M61 146 l4 -3"/><path class="soft" d="M134 153 l4 -3 M140 154 l4 -3"/>
    <path class="thin" d="M98 141 l2 3"/>
    <path d="M87 150 Q95 158 106 151"/>
    <!-- 안경 -->
    <circle cx="76" cy="126" r="20"/><circle cx="122" cy="132" r="20"/><path d="M96 127 Q100 123 103 128"/><path class="thin" d="M142 132 L159 134"/>
  </g>`

/* 서서 손 흔드는 차니 (220×370) */
export function chaniWave(id: string): string {
  return `<defs>${headDefs(id)}<clipPath id="${id}body"><path d="M68 190 C60 208 60 236 66 256 C90 263 126 263 152 258 C164 252 172 240 172 222 C172 204 164 190 150 184 L92 182 Z"/></clipPath>
    <clipPath id="${id}legs"><path d="M66 256 C64 282 67 306 71 322 C82 328 96 328 105 322 C107 302 109 282 109 260 Z"/><path d="M109 260 C111 290 114 314 117 334 C130 341 146 341 157 336 C161 312 162 284 158 257 Z"/></clipPath>
    <clipPath id="${id}sleeve"><path d="M70 190 C56 192 44 188 38 180 L20 185 C20 201 30 214 46 217 C54 218 62 214 66 208 Z"/></clipPath>
    <clipPath id="${id}hand"><path d="M21 184 C13 176 10 164 14 156 C12 148 14 141 18 141 C22 141 23 148 23 152 C22 143 24 135 28 135 C32 135 33 144 32 151 C33 143 36 138 39 139 C43 141 41 149 40 154 C42 150 46 148 48 151 C50 155 45 161 43 167 C41 173 40 177 39 180 Z"/></clipPath>
    <clipPath id="${id}shoes"><path d="M72 324 C60 326 52 334 56 344 C70 351 94 349 106 340 C107 334 106 328 104 323 Z"/><path d="M118 336 C113 346 115 357 122 361 C134 367 151 365 159 358 C161 350 160 342 156 337 Z"/></clipPath></defs>
  
  <ellipse class="sh" cx="124" cy="361" rx="62" ry="6"/>
  <!-- 바지 -->
  <path class="paper" d="M66 256 C64 282 67 306 71 322 C82 328 96 328 105 322 C107 302 109 282 109 260 Z"/>
  <path class="paper" d="M109 260 C111 290 114 314 117 334 C130 341 146 341 157 336 C161 312 162 284 158 257 Z"/>
  <path class="soft" d="M84 268 C82 286 84 300 86 312"/><path class="soft" d="M136 272 C140 292 138 310 136 324"/>
  <g clip-path="url(#${id}legs)"><path class="sh" d="M96 256 C100 280 98 306 94 330 L112 330 L112 256 Z"/><path class="sh" d="M146 254 C150 284 150 314 146 342 L166 342 L166 254 Z"/><path class="sh" d="M60 254 H164 V266 C130 272 96 272 60 266 Z"/></g>
  <!-- 신발 -->
  <path class="paper" d="M72 324 C60 326 52 334 56 344 C70 351 94 349 106 340 C107 334 106 328 104 323"/>
  <path class="thin" d="M57 339 C72 345 92 343 106 334"/><path class="thin" d="M66 328 C70 333 69 340 65 344"/><path class="soft" d="M78 327 l8 7 M86 325 l8 7"/>
  <path class="paper" d="M118 336 C113 346 115 357 122 361 C134 367 151 365 159 358 C161 350 160 342 156 337"/>
  <g clip-path="url(#${id}shoes)"><path class="sh" d="M54 340 C72 348 94 345 108 334 L108 354 L54 354 Z"/><path class="sh" d="M112 352 C130 360 150 358 164 350 L164 370 L112 370 Z"/></g>
  <path class="thin" d="M117 354 C130 359 148 358 160 352"/><path class="thin" d="M124 347 C132 343 146 343 154 347"/><path class="soft" d="M130 339 h14 M131 344 h12"/>
  <!-- 스웨트셔츠 -->
  <path class="paper" d="M68 190 C60 208 60 236 66 256 C90 263 126 263 152 258 C164 252 172 240 172 222 C172 204 164 190 150 184 L92 182 Z"/>
  <g clip-path="url(#${id}body)"><path class="sh" d="M138 180 C152 202 150 240 136 266 L182 266 L182 178 Z"/><path class="sh" d="M66 186 C82 206 128 212 150 196 L150 180 L66 180 Z"/></g>
  <path class="soft" d="M68 249 C92 255 126 255 150 251"/>
  <!-- 주머니에 넣은 팔 -->
  <path d="M150 204 C156 222 152 238 142 248"/>
  <path class="paper" d="M136 250 C133 258 139 266 146 263 C151 261 153 256 151 251"/>
  <!-- 흔드는 팔 -->
  <g class="hand">
    <path class="paper" d="M70 190 C56 192 44 188 38 180 L20 185 C20 201 30 214 46 217 C54 218 62 214 66 208 Z"/>
    <path class="thin" d="M21 190 C28 190 34 187 39 183"/>
    <path class="paper" d="M21 184 C13 176 10 164 14 156 C12 148 14 141 18 141 C22 141 23 148 23 152 C22 143 24 135 28 135 C32 135 33 144 32 151 C33 143 36 138 39 139 C43 141 41 149 40 154 C42 150 46 148 48 151 C50 155 45 161 43 167 C41 173 40 177 39 180 Z"/>
    <g clip-path="url(#${id}sleeve)"><path class="sh" d="M16 198 C34 208 54 208 72 200 L72 226 L14 226 Z"/></g>
    <g clip-path="url(#${id}hand)"><path class="sh" d="M41 148 C46 160 44 172 37 186 L52 186 L56 146 Z"/></g>
  </g>
  <!-- 헤드폰 -->
  <path d="M88 172 C96 182 106 182 112 176"/>
  <ellipse class="paper" cx="78" cy="183" rx="11" ry="17" transform="rotate(-8 78 183)"/><ellipse class="thin" cx="76" cy="183" rx="5" ry="11" transform="rotate(-8 76 183)"/>
  <ellipse class="paper" cx="121" cy="190" rx="15" ry="17" transform="rotate(12 121 190)"/><ellipse class="thin" cx="123" cy="191" rx="8" ry="10" transform="rotate(12 123 191)"/>
  <path class="sh" d="M81 166 C92 172 92 196 80 200 C86 190 87 176 81 166 Z"/><path class="sh" d="M127 174 C140 181 139 202 124 207 C133 198 134 184 127 174 Z"/>
  ${head(id)}`
}

/* 앉아서 노트북 하는 차니 (220×360) */
export function chaniLaptop(id: string): string {
  const pants =
    "M14 282 C0 290 -2 312 12 322 C40 334 70 336 100 322 C130 338 172 336 192 320 C204 308 200 290 188 284 L110 286 Z"
  const torso =
    "M58 200 C46 214 44 240 48 262 L60 286 L186 286 C198 270 200 244 190 224 C182 208 168 200 150 196 L96 194 Z"
  const lid = "M-2 212 L94 218 L110 286 L12 278 Z"
  return `<defs>${headDefs(id)}<clipPath id="${id}pants"><path d="${pants}"/></clipPath><clipPath id="${id}torso"><path d="${torso}"/></clipPath><clipPath id="${id}lid"><path d="${lid}"/></clipPath></defs>
  
  <ellipse class="sh" cx="104" cy="346" rx="98" ry="7"/>
  <path class="paper" d="${pants}"/>
  <g clip-path="url(#${id}pants)"><path class="sh" d="M0 314 C50 332 150 334 204 306 L204 344 L0 344 Z"/><path class="sh" d="M150 282 C176 290 190 300 196 316 L206 280 Z"/></g>
  <path class="thin" d="M62 300 C92 304 122 316 150 330"/><path class="thin" d="M150 296 C124 302 96 316 72 328"/>
  <path class="paper" d="M36 316 C24 320 20 336 30 344 C44 351 62 347 70 336 C68 326 56 318 46 315"/><path class="soft" d="M40 324 l12 10 M52 322 l-12 12"/>
  <path class="paper" d="M130 330 C122 338 126 350 138 353 C152 355 164 349 166 340 C162 332 150 328 140 328"/><path class="soft" d="M138 334 h14 M139 340 h12"/>
  <path class="paper" d="${torso}"/>
  <g clip-path="url(#${id}torso)"><path class="sh" d="M156 194 C172 216 172 256 158 288 L206 288 L206 194 Z"/><path class="sh" d="M70 204 C92 226 136 228 160 210 L160 194 L70 194 Z"/></g>
  <path d="M176 214 C194 228 200 256 192 270 C180 280 162 278 150 273"/><path class="soft" d="M168 236 C174 246 174 256 170 264"/>
  <g class="typing"><path class="paper" d="M152 258 C140 253 124 255 118 264 C116 272 126 277 134 275 L152 273 Z"/><path class="soft" d="M124 262 l6 8 M131 259 l5 9"/></g>
  <path d="M110 286 L160 277"/>
  <path class="paper" d="${lid}"/>
  <g clip-path="url(#${id}lid)"><path class="sh" d="M30 214 L112 290 L-4 290 Z"/></g>
  <circle class="soft" cx="52" cy="248" r="5"/>
  <path d="M96 196 C104 206 116 206 124 198"/>
  <ellipse class="paper" cx="85" cy="206" rx="11" ry="17" transform="rotate(-6 85 206)"/><ellipse class="thin" cx="83" cy="206" rx="5" ry="11" transform="rotate(-6 83 206)"/>
  <ellipse class="paper" cx="138" cy="206" rx="15" ry="17" transform="rotate(8 138 206)"/><ellipse class="thin" cx="140" cy="207" rx="8" ry="10" transform="rotate(8 140 207)"/>
  <path class="sh" d="M88 189 C99 195 99 219 87 223 C93 213 94 199 88 189 Z"/><path class="sh" d="M144 190 C157 197 156 218 141 223 C150 214 151 200 144 190 Z"/>
  <g transform="translate(-4 17) rotate(-3 100 130)">${head(id)}</g>`
}

/* 앉은 진돗개 (161×212) */
export function jindo(id: string): string {
  const headP =
    "M35 32 L53 10 C61 8 70 18 73 28 C84 30 92 38 96 46 L120 41 C124 52 114 74 104 86 C104 100 96 112 84 118 C64 127 30 125 12 108 C2 98 -2 78 2 64 C6 50 18 38 35 32 Z"
  const bodyP =
    "M10 108 C2 130 6 160 14 184 L12 196 C16 204 34 204 38 198 L42 200 C48 208 64 208 68 200 C72 206 80 208 90 204 C112 206 124 200 124 190 C120 160 110 130 98 112 Z"
  const tailP =
    "M100 126 C104 106 134 100 148 116 C162 134 152 166 130 172 C120 174 112 170 110 162 Z"
  return `<defs><clipPath id="${id}h"><path d="${headP}"/></clipPath><clipPath id="${id}b"><path d="${bodyP}"/></clipPath><clipPath id="${id}t"><path d="${tailP}"/></clipPath></defs>
  
  <ellipse class="sh" cx="72" cy="205" rx="66" ry="5"/>
  <g class="tail"><path class="paper" d="${tailP}"/><g clip-path="url(#${id}t)"><path class="sh" d="M152 112 C152 140 138 160 108 168 L162 182 L166 110 Z"/></g><path class="thin" d="M122 164 C130 156 130 146 122 142 C116 140 112 146 116 152"/></g>
  <path class="paper" d="${bodyP}"/>
  <g clip-path="url(#${id}b)"><path class="sh" d="M96 110 C108 140 112 176 104 208 L130 208 L130 110 Z"/><path class="sh" d="M0 106 C30 132 70 134 100 114 L100 104 L0 104 Z"/></g>
  <path d="M40 160 L39 198"/><path d="M44 172 L42 200"/><path d="M70 178 L68 200"/>
  <path d="M70 178 C78 170 90 174 92 184 C94 194 92 200 90 204"/>
  <path class="soft" d="M20 198 v5 M28 199 v5 M50 202 v4 M58 202 v4 M76 202 v4 M84 201 v4"/>
  <path class="soft" d="M20 126 C36 136 60 136 80 126"/>
  <path class="paper" d="${headP}" style="stroke:none"/>
  <g class="ear"><path class="paper" d="M35 32 L53 10 C61 8 70 18 73 28 Z"/><path class="soft" d="M45 30 L55 17 L63 27"/></g>
  <g class="ear"><path class="paper" d="M96 46 L120 41 C124 52 114 74 104 86 Z"/><path class="soft" d="M101 54 L115 49 L107 72"/></g>
  <path d="M35 32 C18 38 6 50 2 64 C-2 78 2 98 12 108 C30 125 64 127 84 118 C96 112 104 100 104 86"/><path d="M73 28 C84 30 92 38 96 46"/>
  <g clip-path="url(#${id}h)"><path class="sh" d="M98 44 C100 74 84 106 44 122 L130 132 L130 40 Z"/></g>
  <circle class="soft" cx="46" cy="55" r="3.2"/><circle class="soft" cx="71" cy="72" r="3.2"/>
  <g class="eyes"><circle class="ink f" cx="33" cy="66" r="5.6"/><circle class="hl f" cx="31.2" cy="64" r="1.9"/><circle class="ink f" cx="69" cy="88" r="5.6"/><circle class="hl f" cx="67.2" cy="86" r="1.9"/></g>
  <ellipse class="ink f" cx="43" cy="90" rx="7" ry="5" transform="rotate(18 43 90)"/>
  <path d="M22 90 C24 100 34 103 41 96 C45 105 55 105 59 98"/>
  <path class="paper" d="M30 100 C30 109 39 109 39 101"/>`
}

export const CAST: Record<CastKind, (id: string) => string> = {
  wave: chaniWave,
  laptop: chaniLaptop,
  jindo,
}
