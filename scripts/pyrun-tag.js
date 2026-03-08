'use strict';

/**
 * Pyodide Runner Tag Plugin
 * Usage: {% pyrun %} code {% endpyrun %}
 * With preload: {% pyrun numpy matplotlib %} code {% endpyrun %}
 */

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

hexo.extend.tag.register('pyrun', function(args, content) {
  const code = content.trim();
  const id = 'pyrun-' + Math.random().toString(36).substr(2, 9);
  const preload = args.join(',');

  const highlighted = hexo.extend.highlight.exec(hexo.config.syntax_highlighter, {
    context: hexo,
    args: [code, {
      lang: 'python',
      lines_length: code.split('\n').length
    }]
  });

  return `
<div class="pyrun-container" data-pyrun-id="${id}" data-preload="${preload}">
  ${highlighted}
  <button class="pyrun-button" data-target="${id}">
    <span class="pyrun-icon">▶</span> Run Python
  </button>
  <div class="pyrun-output" id="${id}-output"></div>
</div>`.trim();
}, { ends: true });
