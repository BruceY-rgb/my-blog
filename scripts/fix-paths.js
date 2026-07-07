'use strict';

// Fix post asset image paths in rendered post fragments.
// Hexo's post asset URLs depend on the final permalink, so build them from the
// post source path instead of the browser's current page depth.

const cheerio = require('cheerio');

const MARKDOWN_EXT_RE = /\.(md|markdown|mkd|mkdn|mdwn|mdtxt|mdtext)$/i;
const ABSOLUTE_URL_RE = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i;

function normalizeRoot(root) {
  if (!root || root === '/') return '/';
  return `/${root.replace(/^\/+|\/+$/g, '')}/`;
}

function joinUrl(...parts) {
  const [first, ...rest] = parts;
  const root = normalizeRoot(first);
  const tail = rest
    .filter(Boolean)
    .map(part => String(part).replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/');

  return tail ? `${root}${tail}` : root;
}

function isRelativeAssetPath(value) {
  return value && !value.startsWith('/') && !ABSOLUTE_URL_RE.test(value);
}

function splitSuffix(value) {
  const match = value.match(/^([^?#]*)([?#].*)?$/);
  return {
    pathname: match ? match[1] : value,
    suffix: match && match[2] ? match[2] : ''
  };
}

function normalizeRelativeAsset(value, postBaseName) {
  const { pathname, suffix } = splitSuffix(value);
  let relativePath = pathname.replace(/\\/g, '/').replace(/^\.\//, '');

  if (relativePath.startsWith(`${postBaseName}/`)) {
    relativePath = relativePath.slice(postBaseName.length + 1);
  }

  return `${relativePath}${suffix}`;
}

function getSourcePath(hexo, data) {
  const fullPath = data.source || data.full_source || data.path;
  if (!fullPath) return '';

  let source = fullPath.replace(/\\/g, '/');
  const sourceDir = hexo.source_dir.replace(/\\/g, '/').replace(/\/+$/, '');
  if (source.startsWith(sourceDir)) {
    source = source.slice(sourceDir.length);
  }

  return source.replace(/^\/+/, '');
}

hexo.extend.filter.register('after_post_render', function(data) {
  if (!this.config.post_asset_folder || !data.content) return data;

  const source = getSourcePath(this, data);
  if (!source) return data;

  const Post = this.model('Post');
  const post = Post.findOne({ source }) || Post.findOne({ source: source.replace(/^_posts\//, '') });
  if (!post || !post.date || !post.source) return data;

  const rootPath = normalizeRoot(this.config.root);
  const year = post.date.format('YYYY');
  const month = String(post.date.month() + 1).padStart(2, '0');
  const day = String(post.date.date()).padStart(2, '0');
  const postSource = post.source.replace(/\\/g, '/');
  const postRelativePath = postSource.replace(/^_posts\//, '').replace(MARKDOWN_EXT_RE, '');
  const postBaseName = postRelativePath.split('/').pop();
  const assetBaseUrl = joinUrl(rootPath, year, month, day, postRelativePath);

  const $ = cheerio.load(data.content, {
    decodeEntities: false,
    lowerCaseTags: false
  }, false);

  $('img').each(function() {
    for (const attr of ['src', 'data-lazy-src']) {
      const value = $(this).attr(attr);
      if (!isRelativeAssetPath(value)) continue;

      const relativeAsset = normalizeRelativeAsset(value, postBaseName);
      $(this).attr(attr, joinUrl(assetBaseUrl, relativeAsset));
    }
  });

  data.content = $.root().html();
  return data;
});
