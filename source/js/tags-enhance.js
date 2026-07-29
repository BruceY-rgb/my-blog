/**
 * Tags page enhancement: accessible search and category filters.
 */
(function () {
  'use strict';

  var pageEl = document.getElementById('page');
  var tagsPage = document.querySelector('.type-tags');
  if (!pageEl || !tagsPage) return;

  var tagCloud = pageEl.querySelector('.tag-cloud-list');
  if (!tagCloud || tagCloud.dataset.enhanced === 'true') return;
  tagCloud.dataset.enhanced = 'true';
  tagCloud.id = tagCloud.id || 'tag-collection';

  var tagCategories = {
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

  var categoryOrder = ['全部', 'CS课程笔记', '科研训练', '量化', '英语', '开发工具', '其他'];
  var allTags = Array.from(tagCloud.querySelectorAll('a'));
  var activeCategory = '全部';
  var searchQuery = '';

  function getTagName(element) {
    return element.textContent.trim();
  }

  function getCategory(tagName) {
    return tagCategories[tagName] || '其他';
  }

  var usedCategories = new Set(
    allTags.map(function (element) {
      return getCategory(getTagName(element));
    })
  );

  var searchWrap = document.createElement('div');
  searchWrap.className = 'tags-search-wrap';
  searchWrap.innerHTML =
    '<label class="visually-hidden" for="tags-search-input">搜索标签</label>' +
    '<i class="fas fa-search search-icon" aria-hidden="true"></i>' +
    '<input id="tags-search-input" type="search" inputmode="search" autocomplete="off" ' +
      'placeholder="输入标签名称" aria-controls="' + tagCloud.id + '" aria-describedby="tags-results-status">' +
    '<button class="tags-search-clear" type="button" aria-label="清空标签搜索" hidden>' +
      '<i class="fas fa-times" aria-hidden="true"></i>' +
    '</button>';

  var tabsWrap = document.createElement('div');
  tabsWrap.className = 'tags-category-tabs';
  tabsWrap.setAttribute('role', 'group');
  tabsWrap.setAttribute('aria-label', '按主题筛选标签');

  categoryOrder.forEach(function (category) {
    if (category !== '全部' && !usedCategories.has(category)) return;

    var tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'tags-category-tab' + (category === '全部' ? ' active' : '');
    tab.textContent = category;
    tab.dataset.category = category;
    tab.setAttribute('aria-pressed', String(category === '全部'));
    tabsWrap.appendChild(tab);
  });

  var resultStatus = document.createElement('p');
  resultStatus.id = 'tags-results-status';
  resultStatus.className = 'tags-results-status';
  resultStatus.setAttribute('role', 'status');
  resultStatus.setAttribute('aria-live', 'polite');

  var noResult = document.createElement('div');
  noResult.className = 'tags-no-result';
  noResult.textContent = '没有找到匹配的标签。请尝试缩短关键词或切换分类。';
  noResult.hidden = true;

  tagCloud.parentNode.insertBefore(searchWrap, tagCloud);
  tagCloud.parentNode.insertBefore(tabsWrap, tagCloud);
  tagCloud.parentNode.insertBefore(resultStatus, tagCloud);
  tagCloud.parentNode.insertBefore(noResult, tagCloud.nextSibling);

  var searchInput = searchWrap.querySelector('input');
  var clearButton = searchWrap.querySelector('.tags-search-clear');

  function updatePressedState() {
    tabsWrap.querySelectorAll('.tags-category-tab').forEach(function (tab) {
      var selected = tab.dataset.category === activeCategory;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-pressed', String(selected));
    });
  }

  function filterTags() {
    var visibleCount = 0;

    allTags.forEach(function (element) {
      var name = getTagName(element);
      var category = getCategory(name);
      var normalizedName = name.toLocaleLowerCase('zh-CN');
      var matchesCategory = activeCategory === '全部' || category === activeCategory;
      var matchesSearch = !searchQuery || normalizedName.includes(searchQuery);
      var visible = matchesCategory && matchesSearch;

      element.classList.toggle('tag-hidden', !visible);
      element.setAttribute('aria-hidden', String(!visible));
      if (visible) visibleCount += 1;
    });

    noResult.hidden = visibleCount !== 0;
    clearButton.hidden = searchQuery.length === 0;
    resultStatus.textContent = '显示 ' + visibleCount + ' 个标签，共 ' + allTags.length + ' 个';
  }

  searchInput.addEventListener('input', function () {
    searchQuery = this.value.trim().toLocaleLowerCase('zh-CN');
    filterTags();
  });

  searchInput.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !this.value) return;
    this.value = '';
    searchQuery = '';
    filterTags();
  });

  clearButton.addEventListener('click', function () {
    searchInput.value = '';
    searchQuery = '';
    filterTags();
    searchInput.focus();
  });

  tabsWrap.addEventListener('click', function (event) {
    var tab = event.target.closest('.tags-category-tab');
    if (!tab) return;

    activeCategory = tab.dataset.category;
    updatePressedState();
    filterTags();
  });

  filterTags();
})();
