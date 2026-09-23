import { fileURLToPath } from "node:url"
import mdx from "@mdx-js/rollup"
import rehypeShiki from "@shikijs/rehype"
import rehypeKatex from "rehype-katex"
import rehypeSlug from "rehype-slug"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkMdxFrontmatter from "remark-mdx-frontmatter"
import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import { CONTENT_DIR, contentPlugin } from "./build/content.ts"
import { preprocessObsidian } from "./build/markdown.ts"
import { rehypeStaticHtml } from "./build/rehype/static-html.ts"
import { rehypeToc } from "./build/rehype/toc.ts"
import { remarkObsidian } from "./build/remark/obsidian.ts"
import { createResolver, type Resolver } from "./build/resolve.ts"

// 링크·이미지 조회용 인덱스. 글이 바뀌면 다시 만든다.
let resolver: Resolver | undefined
const getResolver = () => (resolver ??= createResolver())

export default defineConfig({
  resolve: {
    alias: {
      "@mdx-runtime": fileURLToPath(new URL("./src/mdx", import.meta.url)),
    },
  },
  plugins: [
    contentPlugin({ onChange: () => (resolver = undefined) }),
    {
      // Obsidian 주석을 지우고, 표 안 위키링크의 `|`가 GFM 열 구분자로 읽히지 않게 MDX 전에 맞춘다.
      name: "obsidian-preprocess",
      enforce: "pre",
      transform(code, id) {
        // frontmatter와 코드는 건드리지 않는다. .mdx는 import/export, `{식}`, JSX 태그도 건드리지 않는다.
        if (!id.startsWith(CONTENT_DIR)) return
        if (id.endsWith(".md")) return preprocessObsidian(code)
        if (id.endsWith(".mdx")) return preprocessObsidian(code, { mdx: true })
      },
    },
    {
      enforce: "pre",
      ...mdx({
        jsxImportSource: "@mdx-runtime",
        remarkPlugins: [
          remarkFrontmatter,
          remarkMdxFrontmatter,
          remarkGfm,
          remarkMath,
          [remarkObsidian, { resolver: getResolver }],
        ],
        rehypePlugins: [
          rehypeSlug,
          rehypeToc,
          rehypeKatex,
          [
            rehypeShiki,
            {
              // 색은 CSS 변수로만 넣고 라이트/다크 전환은 global.css가 맡는다.
              themes: { light: "github-light", dark: "github-dark" },
              defaultColor: false,
              fallbackLanguage: "text",
              defaultLanguage: "text",
            },
          ],
          rehypeStaticHtml,
        ],
      }),
    },
    solid({ ssr: true }),
  ],
  ssr: {
    noExternal: ["@solidjs/router", "@solidjs/meta"],
  },
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        // 글 청크 이름에 한글·공백이 들어가지 않도록 해시만 쓴다.
        chunkFileNames: (chunk) =>
          chunk.facadeModuleId?.includes("/content/")
            ? "assets/content-[hash].js"
            : "assets/[name]-[hash].js",
      },
    },
  },
})
