/** 콘텐츠가 아닌 앱 고유 경로. 글 URL이 이 경로와 겹치면 빌드를 실패시킨다. */
export const STATIC_ROUTES = ["/", "/blog"]

/** 404.html을 만들 때 렌더하는 경로 (prerender 전용) */
export const NOT_FOUND_ROUTE = "/404"

export const RESERVED_ROUTES = [...STATIC_ROUTES, NOT_FOUND_ROUTE]
