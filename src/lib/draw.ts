/**
 * 선 그림이 화면에 들어올 때 선이 그어지며 나타나게 한다 (styles/line.css).
 *
 * `ref={draw}`로 붙인다. 붙은 요소 안의 도형에 그리는 순서를 매기고, 화면에 들어오면 한 번 그린다.
 * 서버가 그린 HTML에는 손대지 않으므로 스크립트가 없어도 그림은 그대로 보인다.
 */
const SHAPES = "path, line, rect, circle, ellipse, polyline"
/** 선 하나가 앞 선보다 늦게 시작하는 시간 (s) */
const STEP = 0.03
/** 도형이 많아도 마지막 선은 이때까지 긋기 시작한다 (s). 그림이 커질수록 간격을 좁힌다 */
const BUDGET = 1.2

export function arm(root: Element) {
  const lines: SVGElement[] = []
  for (const el of root.querySelectorAll<SVGElement>(SHAPES)) {
    if (el.closest("defs, clipPath, [data-nodraw]")) continue
    // 채워진 점(눈, 코)과 그림자는 선이 다 그어진 뒤에 옅게 나타난다
    if (el.matches(".ink, .hl, .sh, .f")) {
      el.classList.add("f")
      continue
    }
    lines.push(el)
  }
  const step = Math.min(STEP, BUDGET / Math.max(1, lines.length))
  let i = 0
  for (const el of lines) {
    el.setAttribute("pathLength", "1")
    // 그림이 제 크기보다 크게 놓였으면 그 배율만큼 길게 그어야 선이 끝까지 닿는다 (line.css의 --k)
    const m = (el as SVGGraphicsElement).getScreenCTM?.()
    // 가로와 세로가 따로 늘어난 그림(책장 테두리)은 더 많이 늘어난 쪽에 맞춘다
    const k = m ? Math.max(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d)) : 1
    if (k > 1) el.style.setProperty("--k", k.toFixed(3))
    el.classList.add("d")
    el.style.setProperty("--d", `${(i++ * step).toFixed(3)}s`)
  }
  const after = `${(i * step + 0.25).toFixed(2)}s`
  for (const el of root.querySelectorAll<SVGElement>(".f")) {
    if (!el.style.getPropertyValue("--d")) el.style.setProperty("--d", after)
  }
  // 채운 점이 나타나는 때. 이름표처럼 그림 뒤에 나타날 것도 이 값을 기다린다 (line-room.css)
  const host = root as HTMLElement
  host.style.setProperty("--after", after)
  root.classList.add("armed")
}

export function play(root: Element) {
  root.classList.remove("play")
  // 다시 그릴 때 애니메이션이 처음부터 돌도록 레이아웃을 한 번 읽는다
  void (root as HTMLElement).offsetWidth
  root.classList.add("play")
}

/** `ref={draw}`: 화면에 들어오면 한 번 그린다 */
export function draw(root: Element) {
  // ref는 요소가 문서에 붙기 전에 불리므로 한 틱 미룬다
  queueMicrotask(() => {
    arm(root)
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        io.disconnect()
        play(root)
      },
      { threshold: 0.2 },
    )
    io.observe(root)
  })
}
