(function () {
  'use strict';

  var MOBILE_QUERY = '(max-width: 768px)';
  var ROOT_SELECTOR = '.type-categories .category-lists';
  var mediaQuery = window.matchMedia(MOBILE_QUERY);

  function directChildByClass(element, className) {
    return Array.prototype.find.call(element.children, function (child) {
      return child.classList && child.classList.contains(className);
    }) || null;
  }

  function directListItems(list) {
    return Array.prototype.filter.call(list.children, function (child) {
      return child.classList && child.classList.contains('category-list-item');
    });
  }

  function parseCount(countElement) {
    if (!countElement) return 0;
    var count = Number.parseInt(countElement.textContent.trim(), 10);
    return Number.isFinite(count) ? count : 0;
  }

  function appendTextElement(parent, tagName, className, text) {
    var element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    parent.appendChild(element);
    return element;
  }

  function createMasthead(root, topItems) {
    if (root.querySelector('.category-index__masthead')) return;

    var allItems = root.querySelectorAll('.category-list-item');
    var articleTotal = topItems.reduce(function (total, item) {
      return total + parseCount(directChildByClass(item, 'category-list-count'));
    }, 0);

    var masthead = document.createElement('section');
    masthead.className = 'category-index__masthead';
    masthead.setAttribute('aria-labelledby', 'category-index-title');

    var heading = document.createElement('div');
    appendTextElement(heading, 'p', 'category-index__eyebrow', 'FIELD NOTES · KNOWLEDGE INDEX');
    var title = appendTextElement(
      heading,
      'h2',
      'category-index__title',
      '按主题浏览学习与研究档案'
    );
    title.id = 'category-index-title';

    var summary = document.createElement('div');
    summary.className = 'category-index__summary';
    appendTextElement(
      summary,
      'p',
      'category-index__description',
      '从课程笔记到研究记录，沿着主题层级找到文章，而不是在时间线里反复翻找。'
    );

    var ledger = document.createElement('p');
    ledger.className = 'category-index__ledger';
    [
      [topItems.length, '个一级主题'],
      [allItems.length, '个分类'],
      [articleTotal, '篇文章']
    ].forEach(function (entry) {
      var item = document.createElement('span');
      appendTextElement(item, 'strong', '', String(entry[0]));
      item.appendChild(document.createTextNode(entry[1]));
      ledger.appendChild(item);
    });
    summary.appendChild(ledger);

    masthead.appendChild(heading);
    masthead.appendChild(summary);
    root.insertBefore(masthead, root.firstChild);
  }

  function createHeroLabel() {
    var pageSiteInfo = document.querySelector('.type-categories #page-site-info');
    if (!pageSiteInfo || pageSiteInfo.querySelector('.category-index__hero-label')) return;

    var title = pageSiteInfo.querySelector('#site-title');
    var label = document.createElement('p');
    label.className = 'category-index__hero-label';
    label.textContent = 'KNOWLEDGE INDEX';
    pageSiteInfo.insertBefore(label, title || pageSiteInfo.firstChild);
  }

  function labelForItem(item) {
    var row = directChildByClass(item, 'category-index__row');
    var link = directChildByClass(row || item, 'category-list-link');
    return link ? link.textContent.trim() : '分类';
  }

  function setBranchState(item, expanded) {
    var button = directChildByClass(
      directChildByClass(item, 'category-index__row') || item,
      'category-index__toggle'
    );
    if (!button) return;

    item.classList.toggle('is-collapsed', !expanded);
    button.setAttribute('aria-expanded', String(expanded));
    button.setAttribute(
      'aria-label',
      (expanded ? '收起' : '展开') + labelForItem(item) + '的子分类'
    );
  }

  function createToggle(item, childList, branchIndex) {
    var button = document.createElement('button');
    var childId = 'category-index-branch-' + branchIndex;

    childList.id = childId;
    button.type = 'button';
    button.className = 'category-index__toggle';
    button.setAttribute('aria-controls', childId);
    button.setAttribute('aria-expanded', 'true');
    button.addEventListener('click', function () {
      var expanded = button.getAttribute('aria-expanded') === 'true';
      item.dataset.categoryUserToggled = 'true';
      setBranchState(item, !expanded);
    });
    return button;
  }

  function enhanceItem(item, depth, order, branchState) {
    if (item.dataset.categoryIndexReady === 'true') return;

    var link = directChildByClass(item, 'category-list-link');
    var count = directChildByClass(item, 'category-list-count');
    var childList = directChildByClass(item, 'category-list-child');
    if (!link) return;

    item.dataset.categoryIndexReady = 'true';
    item.dataset.categoryDepth = String(depth);

    var row = document.createElement('div');
    row.className = 'category-index__row';
    if (depth === 0) {
      row.classList.add('category-index__row--top');
      appendTextElement(
        row,
        'span',
        'category-index__number',
        String(order + 1).padStart(2, '0')
      ).setAttribute('aria-hidden', 'true');
    }

    item.insertBefore(row, link);
    row.appendChild(link);
    if (count) row.appendChild(count);

    if (childList) {
      item.classList.add('category-index__branch');
      branchState.value += 1;
      row.appendChild(createToggle(item, childList, branchState.value));

      directListItems(childList).forEach(function (child, childIndex) {
        enhanceItem(child, depth + 1, childIndex, branchState);
      });
    }
  }

  function syncViewport(root) {
    var mobile = mediaQuery.matches;
    root.querySelectorAll('.category-index__branch').forEach(function (item) {
      if (!mobile) {
        setBranchState(item, true);
        return;
      }

      if (item.dataset.categoryUserToggled !== 'true') {
        setBranchState(item, false);
      }
    });
  }

  function bindViewport(root) {
    if (root.dataset.categoryViewportBound === 'true') return;
    root.dataset.categoryViewportBound = 'true';

    var update = function () {
      syncViewport(root);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(update);
    }
  }

  function setup() {
    var root = document.querySelector(ROOT_SELECTOR);
    if (!root || root.dataset.categoryIndexEnhanced === 'true') return;

    var rootList = directChildByClass(root, 'category-list');
    if (!rootList) return;

    root.dataset.categoryIndexEnhanced = 'true';
    root.classList.add('category-index--enhanced');

    var topItems = directListItems(rootList);
    createHeroLabel();
    createMasthead(root, topItems);

    var branchState = { value: 0 };
    topItems.forEach(function (item, index) {
      enhanceItem(item, 0, index, branchState);
    });

    rootList.setAttribute('aria-label', '全部文章分类');
    bindViewport(root);
    syncViewport(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

  document.addEventListener('pjax:complete', setup);

  if (window.btf && typeof window.btf.addGlobalFn === 'function') {
    window.btf.addGlobalFn('pjaxComplete', setup, 'categoryEditorialIndex');
  }
})();
