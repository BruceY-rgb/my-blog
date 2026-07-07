'use strict';

// Fix static asset paths for subdirectory deployment
// This adds the root path prefix to CSS, JS, and image assets

const ABSOLUTE_URL_RE = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i;

function normalizeRoot(root) {
  if (!root || root === '/') return '/';
  return `/${root.replace(/^\/+|\/+$/g, '')}/`;
}

function shouldPrefix(value, rootPath) {
  return value &&
    value.startsWith('/') &&
    !value.startsWith(rootPath) &&
    !ABSOLUTE_URL_RE.test(value);
}

function prefixRoot(value, rootPath) {
  return `${rootPath}${value.replace(/^\/+/, '')}`;
}

hexo.extend.filter.register('after_render:html', function(html, data) {
  const { root } = this.config;
  if (!root || root === '/') return html;

  const rootPath = normalizeRoot(root);

  return html.replace(/\b(href|src)="([^"]+)"/g, (match, attr, value) => {
    if (!shouldPrefix(value, rootPath)) return match;
    return `${attr}="${prefixRoot(value, rootPath)}"`;
  });
});
