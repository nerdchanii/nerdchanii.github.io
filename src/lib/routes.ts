/** 콘텐츠가 아닌 앱 고유 경로. 글 URL이 이 경로와 겹치면 빌드를 실패시킨다. */
export const STATIC_ROUTES = ["/", "/blog", "/tags"]

/** 404.html을 만들 때 렌더하는 경로 (prerender 전용) */
export const NOT_FOUND_ROUTE = "/404"

export const RESERVED_ROUTES = [...STATIC_ROUTES, NOT_FOUND_ROUTE]

/**
 * 글 URL의 첫 조각으로 쓸 수 없는 이름. 빌드가 dist/ 최상위에 만드는 파일·폴더와
 * 앱이 하위 경로까지 쓰는 라우트(`/tags/…`)다. (`index.html`은 모든 단계에서 slug 검증이 막는다.)
 */
export const RESERVED_OUTPUT_NAMES = ["assets", "404.html", "_media", "tags"]

/** content/ 안의 이미지 등 미디어 파일이 복사되는 경로 */
export const MEDIA_PREFIX = "_media"
