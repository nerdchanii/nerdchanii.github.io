/**
 * 글을 펼친 책으로 볼지, 평범한 글로 볼지(읽기 모드).
 * 첫 페인트 전에 index.html의 인라인 스크립트가 `data-view`를 정하고, 여기서는 바꾸기만 한다.
 * 같은 HTML을 CSS로만 달리 놓으므로 서버가 그린 HTML은 이 값을 모른다.
 */
const STORE = "post-view"

export function togglePostView() {
  const root = document.documentElement
  const plain = root.dataset.view !== "plain"
  if (plain) root.dataset.view = "plain"
  else delete root.dataset.view
  try {
    localStorage.setItem(STORE, plain ? "plain" : "book")
  } catch {
    // 저장소를 쓸 수 없는 환경이면 이번 방문에만 적용한다.
  }
}
