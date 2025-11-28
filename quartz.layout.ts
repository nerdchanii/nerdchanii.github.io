import { h } from "preact"
import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [
    Component.Comments({
      provider: "giscus",
      options: {
        repo: "nerdchanii/nerdchanii.github.io",
        repoId: "R_kgDOP1UnAw",
        category: "Announcements",
        categoryId: "DIC_kwDOP1UnA84CzHKQ",
        mapping: "pathname",
        reactionsEnabled: true,
        inputPosition: 'top',
        lang: 'ko',
      }
    })
  ],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/jackyzha0/quartz",
      "Discord Community": "https://discord.gg/cRFFHYye7t",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs({
        rootName: "Home",
        spacerSymbol: " / ",
        showCurrentPage: true,
      }),
      condition: (page) => page.fileData.slug !== "index" || page.fileData.filePath !== "index.md",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    // Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer({
      title: "Notes 📕",
      folderClickBehavior: "link",
      folderDefaultState: "open",
      useSavedState: true,
      sortFn: (a, b) => {
        if (a.isFolder && !b.isFolder) return 1
        if (!a.isFolder && b.isFolder) return -1
        return a.displayName.localeCompare(b.displayName)
      },
    }),
  ],
  right: [
    // Component.Graph({}),
    Component.Backlinks({
      hideWhenEmpty: true,
    }),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.TagList(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta({
      showComma: true,
      showReadingTime: true,
    }),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer(),
  ],
  right: [],
}
