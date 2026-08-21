import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const postsDir = path.join(root, "source", "_posts");
const sourceImgDir = path.join(root, "source", "img");
const outputContentDir = path.join(root, "src", "content");
const outputPostsDir = path.join(outputContentDir, "posts");
const outputPagesDir = path.join(outputContentDir, "pages");
const publicDir = path.join(root, "astro-public");
const siteBasePath = "/my-blog";
const imageExtension = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

function removeGeneratedDirectory(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyTree(source, destination) {
  for (const file of walk(source)) {
    copyFile(file, path.join(destination, path.relative(source, file)));
  }
}

function headerValue(raw, key) {
  const match = raw.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m"));
  return match?.[1]?.trim();
}

function parseFrontmatter(raw) {
  try {
    return { ...matter(raw), repaired: false };
  } catch (error) {
    // Hexo accepted one historical title containing an unquoted colon. Quote the
    // complete title value before parsing so all source text can still migrate.
    const repaired = raw.replace(/^title:\s*(.+)$/m, (_line, title) => {
      return `title: ${JSON.stringify(title.trim())}`;
    });
    return { ...matter(repaired), repaired: true, parseError: error.message };
  }
}

function asList(value) {
  if (value === undefined || value === null || value === "") return [];
  return (Array.isArray(value) ? value : [value])
    .flat(Infinity)
    .map((item) => String(item).trim())
    .filter(Boolean);
}

function descriptionFrom(content) {
  const text = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/!?(\[[^\]]*\])\([^)]*\)/g, "$1")
    .replace(/[#>*_`|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 160);
}

function dateParts(rawDate) {
  const match = rawDate?.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return undefined;
  return {
    year: match[1],
    month: match[2].padStart(2, "0"),
    day: match[3].padStart(2, "0"),
  };
}

function transformLegacySyntax(content) {
  return content
    .replace(/\{%\s*raw\s*%\}/g, "")
    .replace(/\{%\s*endraw\s*%\}/g, "")
    .replace(/\{%\s*pyrun\s*%\}/g, '<pre class="legacy-pyrun"><code>')
    .replace(/\{%\s*endpyrun\s*%\}/g, "</code></pre>")
    .replace(/^!!!\s+([\w-]+)\s*$/gm, (_line, type) => {
      return `<aside class="admonition ${type.toLowerCase()}">`;
    })
    .replace(/^!!!\s*$/gm, "</aside>");
}

function referencedLocalAssets(content) {
  const assets = new Set();
  const expression = /!\[[^\r\n]*?\]\(([^\s)]+)(?:\s+[^)\r\n]*)?\)/g;
  for (const match of content.matchAll(expression)) {
    const reference = decodeURIComponent(match[1]).replace(/^\.\//, "");
    if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(reference)) continue;
    assets.add(reference.split(/[?#]/)[0]);
  }
  return assets;
}

function rewriteLocalAssetReferences(content, postFile, legacyPath) {
  const expression = /(!\[[^\r\n]*?\]\()([^\s)]+)((?:\s+[^)\r\n]*)?\))/g;
  return content.replace(expression, (full, prefix, reference, suffix) => {
    const cleanReference = decodeURIComponent(reference).replace(/^\.\//, "");
    if (/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(cleanReference)) return full;
    // Astro treats a relative Markdown image as a build-time import. Preserve
    // the browser URL even when an historical image file is currently missing.
    return `${prefix}${siteBasePath}/${legacyPath}/${encodeURI(cleanReference)}${suffix}`;
  });
}

function safeAssetPath(postFile, reference) {
  const candidate = path.resolve(path.dirname(postFile), reference);
  return candidate.startsWith(`${postsDir}${path.sep}`) ? candidate : undefined;
}

function renderNotes(report) {
  const issues = report.issues.length
    ? report.issues.map((issue) => "- `" + issue.file + "`: " + issue.reason).join("\n")
    : "- 无。";

  return `# Hexo → Astro 迁移说明

此文件由 \`bun run migrate:content\` 生成。脚本只读取 \`source/\`，并复制到
\`src/content/\` 与 \`astro-public/\`，不会删除任何 Hexo 文章或资源。

## 迁移规则

- 每篇文章使用原日期与相对源路径生成 \`legacyPath\`，例如
  \`source/_posts/Python/Chapter1.md\` → \`/2026/03/07/Python/Chapter1/\`。
- \`category/categories\` 统一为 \`categories\` 数组；\`tags\` 统一为字符串数组。
- \`published: false\` 原样保留，并从公开文章列表与静态路由中排除。
- 相对文章资源引用保留原写法；对应资源复制到旧文章 URL 下。全部文章资源另保留一份在
  \`astro-public/legacy-source-assets/\` 以便人工恢复。
- \`!!! type ... !!!\` 转换为带 \`.admonition\` 类的 HTML；\`{% raw %}\` 被移除；
  \`{% pyrun %}\` 保留为静态代码块，不再执行 Python。
- 当前工作区已删除、但遗留 Git 提交中仍存在的 10 个文章 URL 会生成静态跳转页，统一跳转到归档页。

## 本次统计

| 项目 | 数量 |
| --- | ---: |
| Markdown 文章 | ${report.posts} |
| 文章内图片资源 | ${report.images} |
| 分类 | ${report.categories.size} |
| 标签 | ${report.tags.size} |
| 已复制的旧 URL 资源 | ${report.legacyAssets} |

## 需人工复核

${issues}
`;
}

removeGeneratedDirectory(outputContentDir);
removeGeneratedDirectory(publicDir);

const report = {
  posts: 0,
  images: 0,
  categories: new Set(),
  tags: new Set(),
  legacyAssets: 0,
  issues: [],
};

if (fs.existsSync(sourceImgDir)) copyTree(sourceImgDir, path.join(publicDir, "img"));

const postFiles = walk(postsDir).filter((file) => /\.md$/i.test(file));
const allArticleAssets = walk(postsDir).filter((file) => !/\.md$/i.test(file));
for (const asset of allArticleAssets) {
  if (imageExtension.test(asset)) report.images += 1;
  copyFile(
    asset,
    path.join(publicDir, "legacy-source-assets", path.relative(postsDir, asset)),
  );
}

for (const sourceFile of postFiles) {
  const raw = fs.readFileSync(sourceFile, "utf8");
  const parsed = parseFrontmatter(raw);
  const relativePath = path.relative(postsDir, sourceFile).replace(/\\/g, "/");
  const sourceStem = relativePath.replace(/\.md$/i, "");
  const originalDate = headerValue(raw, "date");
  const date = originalDate ?? "1970-01-01";
  const parts = dateParts(date);
  const title = String(parsed.data.title ?? sourceStem.split("/").at(-1));
  const categories = asList(parsed.data.categories ?? parsed.data.category);
  const tags = asList(parsed.data.tags ?? parsed.data.tag);
  const published = parsed.data.published !== false;
  const legacyPath = parts
    ? `${parts.year}/${parts.month}/${parts.day}/${sourceStem}`
    : `legacy/${sourceStem}`;
  const content = rewriteLocalAssetReferences(
    transformLegacySyntax(parsed.content),
    sourceFile,
    legacyPath,
  );
  const description = String(parsed.data.description ?? descriptionFrom(content));

  if (!originalDate) {
    report.issues.push({
      file: relativePath,
      reason:
        "缺少 date Frontmatter，已临时迁移到 1970-01-01 日期路径；请补充原发布日期后重新运行迁移。",
    });
  }
  if (parsed.repaired) {
    report.issues.push({
      file: relativePath,
      reason: "Frontmatter 的 title 含未引号冒号，已自动加引号后迁移。",
    });
  }

  const data = { ...parsed.data };
  delete data.category;
  delete data.tag;
  Object.assign(data, {
    title,
    date,
    description,
    categories,
    tags,
    published,
    legacyPath,
    sourcePath: relativePath,
  });
  const destination = path.join(outputPostsDir, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, matter.stringify(content, data));

  for (const reference of referencedLocalAssets(parsed.content)) {
    const asset = safeAssetPath(sourceFile, reference);
    if (!asset || !fs.existsSync(asset) || !fs.statSync(asset).isFile()) continue;
    copyFile(asset, path.join(publicDir, legacyPath, reference));
    report.legacyAssets += 1;
  }

  categories.forEach((category) => report.categories.add(category));
  tags.forEach((tag) => report.tags.add(tag));
  report.posts += 1;
}

const aboutSource = path.join(root, "source", "about", "index.md");
if (fs.existsSync(aboutSource)) {
  const parsed = parseFrontmatter(fs.readFileSync(aboutSource, "utf8"));
  const content = transformLegacySyntax(parsed.content).replaceAll(
    'src="/img/',
    'src="/my-blog/img/',
  );
  fs.mkdirSync(outputPagesDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputPagesDir, "about.md"),
    matter.stringify(content, {
      title: String(parsed.data.title ?? "关于"),
      description: String(parsed.data.description ?? ""),
    }),
  );
}

fs.writeFileSync(path.join(root, "MIGRATION_NOTES.md"), renderNotes(report));
console.log(
  `Migrated ${report.posts} posts, ${report.images} article images, ${report.categories.size} categories, and ${report.tags.size} tags.`,
);
