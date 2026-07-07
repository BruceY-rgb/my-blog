'use strict';

/**
 * Copy post assets to public directory
 * This is a workaround for hexo-renderer-marked 7.x postAsset bug with Hexo 8
 *
 * IMPORTANT: The URL structure in Hexo is /:year/:month/:day/:title/
 * For posts in subdirectories like _posts/toffel/toffel-write.md,
 * the URL is /2026/02/09/toffel/toffel-write/
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(BASE_DIR, 'public');
const SOURCE_DIR = path.join(BASE_DIR, 'source');
const POSTS_DIR = path.join(SOURCE_DIR, '_posts');

function walkFiles(dir, predicate, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(entryPath, predicate, results);
      continue;
    }

    if (!predicate || predicate(entryPath)) {
      results.push(entryPath);
    }
  }

  return results;
}

function copyFile(sourcePath, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

function shouldCopyArticleAsset(file) {
  const name = path.basename(file);
  return !file.endsWith('.md') && name !== '.DS_Store';
}

function copyPostAssets() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.log('No _posts directory found.');
    return 0;
  }

  let copied = 0;
  const mdFiles = walkFiles(POSTS_DIR, file => file.endsWith('.md'));

  for (const mdFilePath of mdFiles) {
    const mdContent = fs.readFileSync(mdFilePath, 'utf-8');

    // Extract date from frontmatter
    const dateMatch = mdContent.match(/^date:\s*(\d{4})-(\d{2})-(\d{2})/m);
    if (!dateMatch) continue;

    const [, year, month, day] = dateMatch;
    const articleDir = path.dirname(mdFilePath);
    const relativeMdPath = path
      .relative(POSTS_DIR, mdFilePath)
      .replace(/\\/g, '/')
      .replace(/\.md$/, '');
    const targetDir = path.join(PUBLIC_DIR, year, month, day, relativeMdPath);

    for (const assetPath of walkFiles(articleDir, shouldCopyArticleAsset)) {
      const relativeAssetPath = path.relative(articleDir, assetPath);
      const targetPath = path.join(targetDir, relativeAssetPath);
      copyFile(assetPath, targetPath);
      copied += 1;
    }
  }

  return copied;
}

function copyAssets() {
  console.log('Copying post assets...');
  const postAssets = copyPostAssets();
  console.log(`Done. Copied ${postAssets} post assets.`);
}

if (typeof hexo !== 'undefined' && hexo.extend) {
  hexo.extend.filter.register('after_generate', copyAssets);
} else {
  copyAssets();
}
