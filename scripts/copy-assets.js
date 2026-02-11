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

console.log('Copying post assets...');

if (!fs.existsSync(POSTS_DIR)) {
  console.log('No _posts directory found.');
  process.exit(0);
}

// Find all subdirectories in _posts
const subDirs = fs.readdirSync(POSTS_DIR);

for (const subDir of subDirs) {
  const subDirPath = path.join(POSTS_DIR, subDir);

  // Skip if not a directory
  if (!fs.statSync(subDirPath).isDirectory()) continue;

  // Find markdown files in this directory
  const mdFiles = fs.readdirSync(subDirPath).filter(f => f.endsWith('.md'));

  for (const mdFile of mdFiles) {
    const mdFilePath = path.join(subDirPath, mdFile);
    const mdContent = fs.readFileSync(mdFilePath, 'utf-8');

    // Extract date from frontmatter
    const dateMatch = mdContent.match(/^date:\s*(\d{4})-(\d{2})-(\d{2})/m);
    if (!dateMatch) continue;

    const [, year, month, day] = dateMatch;

    // Get the article name (without .md extension)
    const articleName = mdFile.replace(/\.md$/, '');

    // The URL path includes the parent directory name
    // e.g., toffel/toffel-write
    const urlPath = subDir + '/' + articleName;

    // Target directory in public: /year/month/day/toffel/articleName/
    const targetDir = path.join(PUBLIC_DIR, year, month, day, urlPath);

    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Copy all non-markdown files from the source subdirectory
    const files = fs.readdirSync(subDirPath);
    for (const file of files) {
      if (file.endsWith('.md')) continue;

      const sourcePath = path.join(subDirPath, file);
      const targetPath = path.join(targetDir, file);

      fs.copyFileSync(sourcePath, targetPath);
      console.log(`  Copied: ${file} -> ${year}/${month}/${day}/${urlPath}/`);
    }
  }
}

console.log('Done!');
