'use strict';

// Fix static asset paths for subdirectory deployment
// This adds the root path prefix to CSS, JS, and image assets

const rootPath = '/my-blog/';

hexo.extend.filter.register('after_render:html', function(html, data) {
  const { root } = this.config;
  if (!root || root === '/') return html;

  // Fix CSS and JS paths that start with / but not //
  // Skip external URLs (starting with // or http)
  let result = html;

  // Fix stylesheet links
  result = result.replace(/href="\/([^"][^"]+)"/g, (match, path) => {
    // Skip if already has root or is external
    if (path.startsWith(rootPath.replace('/', '')) || path.startsWith('//') || path.startsWith('http')) {
      return match;
    }
    return `href="${rootPath}${path}"`;
  });

  // Fix script src
  result = result.replace(/src="\/([^"][^"]+)"/g, (match, path) => {
    // Skip if already has root or is external
    if (path.startsWith(rootPath.replace('/', '')) || path.startsWith('//') || path.startsWith('http')) {
      return match;
    }
    return `src="${rootPath}${path}"`;
  });

  return result;
});
