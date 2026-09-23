import { fileURLToPath } from "node:url"
import mdx from "@mdx-js/rollup"
import rehypeKatex from "rehype-katex"
import rehypeSlug from "rehype-slug"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import remarkMdxFrontmatter from "remark-mdx-frontmatter"
import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import { contentPlugin } from "./build/content.ts"
import { rehypeKatexRaw } from "./build/rehype/katex-raw.ts"
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
        rehypePlugins: [rehypeSlug, rehypeKatex, rehypeKatexRaw],
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
