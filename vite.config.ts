import { fileURLToPath } from "node:url"
import mdx from "@mdx-js/rollup"
import remarkFrontmatter from "remark-frontmatter"
import remarkGfm from "remark-gfm"
import remarkMdxFrontmatter from "remark-mdx-frontmatter"
import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import { contentPlugin } from "./build/content.ts"

export default defineConfig({
  resolve: {
    alias: {
      "@mdx-runtime": fileURLToPath(new URL("./src/mdx", import.meta.url)),
    },
  },
  plugins: [
    contentPlugin(),
    {
      enforce: "pre",
      ...mdx({
        jsxImportSource: "@mdx-runtime",
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
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
