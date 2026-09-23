/**
 * client/SSR 빌드가 끝난 뒤 실행한다.
 * 모든 경로를 서버 번들로 렌더해서 dist/{경로}/index.html로 저장한다.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { NOT_FOUND_ROUTE } from "../src/lib/routes.ts"

const root = fileURLToPath(new URL("..", import.meta.url))
const dist = path.join(root, "dist")
const ssrEntry = path.join(root, ".ssr/entry-server.js")

type ServerEntry = {
  routes: () => string[]
  redirects: () => [from: string, to: string][]
  render: (url: string) => Promise<{ html: string; head: string }>
}

const { routes, redirects, render } = (await import(pathToFileURL(ssrEntry).href)) as ServerEntry
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8")

function fill(page: { html: string; head: string }): string {
  // 치환 문자열의 `$&`, `$$` 같은 패턴이 해석되지 않도록 콜백으로 넣는다.
  return template
    .replace("<!--app-head-->", () => page.head)
    .replace("<!--app-html-->", () => page.html)
}

const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;")

/** 예전 URL에서 새 URL로 보내는 정적 리다이렉트 페이지 */
function redirectPage(to: string): string {
  const href = escapeAttr(encodeURI(to))
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>Redirecting…</title>
<link rel="canonical" href="${href}">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${href}">
<script>location.replace(${JSON.stringify(encodeURI(to))} + location.hash)</script>
</head>
<body><a href="${href}">${href}</a></body>
</html>
`
}

function write(file: string, content: string) {
  // URL은 slug 단계에서 검증하지만, dist/ 밖으로 쓰는 일은 여기서 한 번 더 막는다.
  if (!path.resolve(file).startsWith(dist + path.sep)) {
    throw new Error(`dist/ 밖으로 쓰려고 함: ${file}`)
  }
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

const urls = routes()
for (const url of urls) {
  write(path.join(dist, url, "index.html"), fill(await render(url)))
}

const aliases = redirects()
for (const [from, to] of aliases) {
  write(path.join(dist, from, "index.html"), redirectPage(to))
}

// GitHub Pages는 없는 경로에 404.html을 보여준다.
write(path.join(dist, "404.html"), fill(await render(NOT_FOUND_ROUTE)))
// _로 시작하는 파일을 Jekyll이 무시하지 않도록 한다.
write(path.join(dist, ".nojekyll"), "")

fs.rmSync(path.join(root, ".ssr"), { recursive: true, force: true })
console.log(`prerendered ${urls.length} pages, ${aliases.length} redirects`)
