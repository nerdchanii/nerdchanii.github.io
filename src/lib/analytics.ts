/**
 * Google Analytics. Quartz가 하던 것처럼 첫 페이지와 클라이언트 이동마다 page_view를 보낸다.
 * 배포된 사이트(SITE_URL)에서만 켜서 dev 서버나 로컬 미리보기 방문은 세지 않는다.
 */
import { GA_TAG_ID, SITE_URL } from "./site.ts"

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function initAnalytics() {
  if (!GA_TAG_ID || location.origin !== SITE_URL || window.gtag) return
  const dataLayer = (window.dataLayer ??= [])
  window.gtag = function () {
    // gtag.js는 배열이 아니라 arguments 객체를 기대한다.
    dataLayer.push(arguments)
  }
  window.gtag("js", new Date())
  window.gtag("config", GA_TAG_ID, { send_page_view: false })

  const script = document.createElement("script")
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TAG_ID}`
  document.head.appendChild(script)
}

export function trackPageView() {
  window.gtag?.("event", "page_view", {
    page_title: document.title,
    page_location: location.href,
  })
}
