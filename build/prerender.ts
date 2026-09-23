/**
 * client/SSR 빌드가 끝난 뒤 실행한다.
 * 모든 경로를 서버 번들로 렌더해서 dist/{경로}/index.html로 저장한다.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const dist = path.join(root, "dist")
const ssrEntry = path.join(root, ".ssr/entry-server.js")

type ServerEntry = {
  routes: () => string[]
  render: (url: string) => Promise<{ html: string; head: string }>
}

const { routes, render } = (await import(pathToFileURL(ssrEntry).href)) as ServerEntry
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8")

function fill(page: { html: string; head: string }): string {
  return template.replace("<!--app-head-->", page.head).replace("<!--app-html-->", page.html)
}

function write(file: string, content: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

const urls = routes()
for (const url of urls) {
  write(path.join(dist, url, "index.html"), fill(await render(url)))
}

// GitHub Pages는 없는 경로에 404.html을 보여준다.
write(path.join(dist, "404.html"), fill(await render("/404")))
// _로 시작하는 파일을 Jekyll이 무시하지 않도록 한다.
write(path.join(dist, ".nojekyll"), "")

fs.rmSync(path.join(root, ".ssr"), { recursive: true, force: true })
console.log(`prerendered ${urls.length} pages`)
