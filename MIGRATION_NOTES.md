# Hexo → Astro 迁移说明

此文件由 `bun run migrate:content` 生成。脚本只读取 `source/`，并复制到
`src/content/` 与 `astro-public/`，不会删除任何 Hexo 文章或资源。

## 迁移规则

- 每篇文章使用原日期与相对源路径生成 `legacyPath`，例如
  `source/_posts/Python/Chapter1.md` → `/2026/03/07/Python/Chapter1/`。
- `category/categories` 统一为 `categories` 数组；`tags` 统一为字符串数组。
- `published: false` 原样保留，并从公开文章列表与静态路由中排除。
- 相对文章资源引用保留原写法；对应资源复制到旧文章 URL 下。全部文章资源另保留一份在
  `astro-public/legacy-source-assets/` 以便人工恢复。
- `!!! type ... !!!` 转换为带 `.admonition` 类的 HTML；`{% raw %}` 被移除；
  `{% pyrun %}` 保留为静态代码块，不再执行 Python。
- 当前工作区已删除、但遗留 Git 提交中仍存在的 10 个文章 URL 会生成静态跳转页，统一跳转到归档页。

## 本次统计

| 项目                | 数量 |
| ------------------- | ---: |
| Markdown 文章       |   83 |
| 文章内图片资源      |  690 |
| 分类                |   35 |
| 标签                |   88 |
| 已复制的旧 URL 资源 |  653 |

## 需人工复核

- `leetcode/source/_posts/leetcode/slidewindow.md`: 缺少 date Frontmatter，已临时迁移到 1970-01-01 日期路径；请补充原发布日期后重新运行迁移。
- `leetcode/slidewindow.md`: 缺少 date Frontmatter，已临时迁移到 1970-01-01 日期路径；请补充原发布日期后重新运行迁移。
- `scientific-research/paper-reading/ToolSandBox/Paper.md`: Frontmatter 的 title 含未引号冒号，已自动加引号后迁移。
