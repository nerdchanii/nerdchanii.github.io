/** 콘텐츠가 아닌 앱 고유 경로. 글 URL이 이 경로와 겹치면 빌드를 실패시킨다. */
export const STATIC_ROUTES = ["/", "/blog"]

/** 404.html을 만들 때 렌더하는 경로 (prerender 전용) */
export const NOT_FOUND_ROUTE = "/404"

export const RESERVED_ROUTES = [...STATIC_ROUTES, NOT_FOUND_ROUTE]

/** 빌드가 dist/ 최상위에 직접 만드는 파일·폴더. 글 URL의 첫 조각으로 쓸 수 없다. */
export const RESERVED_OUTPUT_NAMES = ["assets", "index.html", "404.html"]
