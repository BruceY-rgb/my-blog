/**
 * Tags Page Enhancement - Search & Category Grouping
 * 赛博朋克风格标签页增强
 */
(function () {
  'use strict';

  // Only run on tags page
  const pageEl = document.getElementById('page');
  if (!pageEl || !document.querySelector('.type-tags')) return;

  const tagCloud = pageEl.querySelector('.tag-cloud-list');
  if (!tagCloud) return;

  // Tag -> categories mapping (extracted from site data embedded by Hexo)
  // We build this from the DOM: each tag <a> has an href like /tags/xxx/
  // We'll use a static mapping based on the blog's known structure
  const TAG_CATEGORIES = {
    '编译原理': 'CS课程笔记',
    '词法分析': 'CS课程笔记',
    'NLP': 'CS课程笔记',
    'Deep Learning': 'CS课程笔记',
    '软件工程': 'CS课程笔记',
    '多媒体技术': 'CS课程笔记',
    'SMLP': '科研训练',
    'SMPL': '科研训练',
    '旋转表示': '科研训练',
    '抽象骨骼': '科研训练',
    'Polymarket': '量化',
    'Cambly': '英语',
    '英语': '英语',
    '托福写作': '英语',
    '托福听力': '英语',
    '托福口语': '英语',
    'claude code': '开发工具',
    'skill': '开发工具',
    'MCP': '开发工具'
  };

  const ALL_CATEGORIES = ['全部', ...new Set(Object.values(TAG_CATEGORIES))];

  // Collect all tag elements
  const allTags = Array.from(tagCloud.querySelectorAll('a'));

  // Get tag name from element
  function getTagName(el) {
    return el.textContent.trim();
  }

  // Get category for a tag
  function getCategory(tagName) {
    return TAG_CATEGORIES[tagName] || '其他';
  }

  // --- Build UI ---

  // 1. Search bar
  const searchWrap = document.createElement('div');
  searchWrap.className = 'tags-search-wrap';
  searchWrap.innerHTML =
    '<i class="fas fa-search search-icon"></i>' +
    '<input type="text" placeholder="搜索标签..." />';

  // 2. Category tabs
  const tabsWrap = document.createElement('div');
  tabsWrap.className = 'tags-category-tabs';

  // Ensure '其他' is included if any tags fall outside known categories
  const usedCategories = new Set();
  allTags.forEach(function (el) {
    usedCategories.add(getCategory(getTagName(el)));
  });
  const categories = ['全部'];
  ALL_CATEGORIES.forEach(function (c) {
    if (c !== '全部' && usedCategories.has(c)) categories.push(c);
  });
  if (usedCategories.has('其他')) categories.push('其他');

  categories.forEach(function (cat) {
    var tab = document.createElement('span');
    tab.className = 'tags-category-tab' + (cat === '全部' ? ' active' : '');
    tab.textContent = cat;
    tab.dataset.category = cat;
    tabsWrap.appendChild(tab);
  });

  // 3. No result message
  const noResult = document.createElement('div');
  noResult.className = 'tags-no-result';
  noResult.textContent = '没有找到匹配的标签';

  // Insert UI before tag cloud
  tagCloud.parentNode.insertBefore(searchWrap, tagCloud);
  tagCloud.parentNode.insertBefore(tabsWrap, tagCloud);
  tagCloud.parentNode.insertBefore(noResult, tagCloud.nextSibling);

  // --- Filter logic ---
  var activeCategory = '全部';
  var searchQuery = '';

  function filterTags() {
    var visibleCount = 0;
    allTags.forEach(function (el) {
      var name = getTagName(el);
      var cat = getCategory(name);
      var matchCategory = activeCategory === '全部' || cat === activeCategory;
      var matchSearch = !searchQuery || name.toLowerCase().indexOf(searchQuery) !== -1;
      if (matchCategory && matchSearch) {
        el.classList.remove('tag-hidden');
        visibleCount++;
      } else {
        el.classList.add('tag-hidden');
      }
    });
    noResult.style.display = visibleCount === 0 ? 'block' : 'none';
  }

  // Search input handler
  var searchInput = searchWrap.querySelector('input');
  searchInput.addEventListener('input', function () {
    searchQuery = this.value.trim().toLowerCase();
    filterTags();
  });

  // Category tab click handler
  tabsWrap.addEventListener('click', function (e) {
    var tab = e.target.closest('.tags-category-tab');
    if (!tab) return;
    tabsWrap.querySelectorAll('.tags-category-tab').forEach(function (t) {
      t.classList.remove('active');
    });
    tab.classList.add('active');
    activeCategory = tab.dataset.category;
    filterTags();
  });
})();
