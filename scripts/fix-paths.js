'use strict';

// Fix post asset image paths in HTML
// This addresses the hexo-renderer-marked 7.x postAsset bug with Hexo 8

const { join, dirname, basename, extname } = require('path').posix;

hexo.extend.filter.register('after_post_render', function(data) {
  const { post_asset_folder } = this.config;
  if (!post_asset_folder) return data;

  const fullPath = data.source;
  if (!fullPath) return data;

  // Extract source path relative to source_dir
  let source = fullPath;
  if (source.startsWith(this.source_dir)) {
    source = source.substring(this.source_dir.length);
  }
  source = source.replace(/^[\/\\]/, '').replace(/\\/g, '/');

  const Post = this.model('Post');
  const post = Post.findOne({ source });
  if (!post) return data;

  const postSource = post.source;
  const postDir = dirname(postSource);
  const postBaseName = basename(postSource, extname(postSource));

  // Get the target URL path (year/month/day/subdir/article)
  const year = post.date.format('YYYY');
  const month = String(post.date.month() + 1).padStart(2, '0');
  const day = String(post.date.date()).padStart(2, '0');

  // The URL path includes the parent directory name
  // e.g., toffel/toffel-write
  const urlPath = postSource.replace(/^_posts\//, '').replace(/\.md$/, '');

  // Fix image paths in HTML
  const cheerio = require('cheerio');
  const $ = cheerio.load(data.content, {
    ignoreWhitespace: false,
    xmlMode: false,
    lowerCaseTags: false,
    decodeEntities: false
  });

  $('img').each(function() {
    const src = $(this).attr('src') || '';
    const lazySrc = $(this).attr('data-lazy-src') || '';

    // Fix data-lazy-src attribute
    if (lazySrc && !lazySrc.startsWith('http') && !lazySrc.startsWith('/')) {
      // This is a relative path that needs to be fixed
      const fileName = lazySrc.split('/').pop();
      const newSrc = '/' + year + '/' + month + '/' + day + '/' + urlPath + '/' + fileName;
      $(this).attr('data-lazy-src', newSrc);
    }

    // Also fix src attribute if it's a relative path
    if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('data:')) {
      const fileName = src.split('/').pop();
      const newSrc = '/' + year + '/' + month + '/' + day + '/' + urlPath + '/' + fileName;
      $(this).attr('src', newSrc);
    }
  });

  data.content = $.html();
  return data;
});
