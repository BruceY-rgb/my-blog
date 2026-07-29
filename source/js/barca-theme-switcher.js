(function () {
  'use strict';

  var STORAGE_KEY = 'football-reading-theme';
  var LEGACY_STORAGE_KEY = 'barca-kit-theme';
  var PANEL_ID = 'theme-gallery-panel';
  var NAV_BUTTON_ID = 'theme-gallery-toggle';
  var lastThemeTrigger = null;
  var THEMES = {
    home: {
      id: 'barcelona.2024-2025.home',
      role: 'home',
      mode: 'dark',
      metaColor: '#050814',
      shortLabel: '主场',
      name: '巴塞罗那 · 主场',
      detail: '24/25 · 深海红蓝',
      badge: '巴塞罗那 · 主场球衣'
    },
    away: {
      id: 'barcelona.2024-2025.away',
      role: 'away',
      mode: 'light',
      metaColor: '#e9ffd2',
      shortLabel: '客场',
      name: '巴塞罗那 · 客场',
      detail: '24/25 · 绿茵晨光',
      badge: '巴塞罗那 · 客场球衣'
    },
    third: {
      id: 'barcelona.2024-2025.third',
      role: 'third',
      mode: 'dark',
      metaColor: '#060b18',
      shortLabel: '第三',
      name: '巴塞罗那 · 第三球衣',
      detail: '24/25 · 午夜海军蓝',
      badge: '巴塞罗那 · 第三球衣'
    },
    spain: {
      id: 'spain.2026.champions-dream',
      role: 'spain',
      mode: 'dark',
      metaColor: '#260806',
      shortLabel: '西班牙',
      name: '西班牙 · 冠军之梦',
      detail: '2026 · 酒红与冠军金',
      badge: '西班牙 · 冠军之梦'
    }
  };
  var ORDER = ['home', 'away', 'third', 'spain'];

  function normalizeTheme(value) {
    if (THEMES[value]) return value;
    return ORDER.find(function (key) {
      return THEMES[key].id === value;
    }) || 'home';
  }

  function readTheme() {
    try {
      return normalizeTheme(localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY));
    } catch (error) {
      return 'home';
    }
  }

  function saveTheme(themeKey) {
    try {
      localStorage.setItem(STORAGE_KEY, themeKey);
    } catch (error) {
      // Storage can be unavailable in strict privacy contexts.
    }
  }

  function syncButterflyMode(theme) {
    if (theme.mode === 'dark') {
      if (window.btf && typeof window.btf.activateDarkMode === 'function') {
        window.btf.activateDarkMode();
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } else if (window.btf && typeof window.btf.activateLightMode === 'function') {
      window.btf.activateLightMode();
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }

    if (window.btf && window.btf.saveToLocal) {
      window.btf.saveToLocal.set('theme', theme.mode, 2);
    }
  }

  function setMetaThemeColor(color) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', color);
  }

  function createKitBadge() {
    var card = document.querySelector('#aside-content .card-info');
    if (!card) return null;

    var existing = card.querySelector('.barca-kit-badge');
    if (existing) return existing;

    var badge = document.createElement('div');
    badge.className = 'barca-kit-badge';
    badge.setAttribute('aria-live', 'polite');
    badge.innerHTML = '<span class="barca-crest-mark" aria-hidden="true"></span><span class="barca-kit-badge__text"></span>';

    var authorName = card.querySelector('.author-info-name');
    if (authorName && authorName.nextSibling) {
      card.insertBefore(badge, authorName.nextSibling);
    } else if (authorName) {
      card.appendChild(badge);
    } else {
      card.insertBefore(badge, card.firstChild);
    }

    return badge;
  }

  function updateKitBadge(theme) {
    var badge = createKitBadge();
    if (!badge) return;

    badge.dataset.kitRole = theme.role;
    var text = badge.querySelector('.barca-kit-badge__text');
    if (text) text.textContent = theme.badge;
  }

  function decorateHomeTitle() {
    var title = document.querySelector('#page-header.full_page #site-title');
    if (!title || title.dataset.barcaTitleDecorated === 'true') return;

    var rawText = title.textContent.trim();
    if (!rawText) return;

    var match = rawText.match(/^(.*?)(\s+Blog)$/i);
    var mainText = match ? match[1] : rawText;
    var scriptText = match ? 'Blog' : '';

    title.textContent = '';

    var main = document.createElement('span');
    main.className = 'barca-title-main';
    main.textContent = mainText;
    title.appendChild(main);

    if (scriptText) {
      var script = document.createElement('span');
      script.className = 'barca-title-script';
      script.textContent = scriptText;
      title.appendChild(script);
    }

    title.dataset.barcaTitleDecorated = 'true';
  }

  function themeIcon() {
    return '<i class="fas fa-swatchbook fa-fw" aria-hidden="true"></i>';
  }

  function makeKeyboardClickable(control, label) {
    if (!control || control.dataset.keyboardReady === 'true') return;

    control.dataset.keyboardReady = 'true';
    control.setAttribute('role', 'button');
    control.setAttribute('tabindex', '0');
    control.setAttribute('aria-label', label);
    control.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      control.click();
    });
  }

  function ensureAccessibilityChrome() {
    var main = document.getElementById('content-inner');
    if (main) main.setAttribute('tabindex', '-1');

    if (main && !document.querySelector('.skip-to-content')) {
      var skipLink = document.createElement('a');
      skipLink.className = 'skip-to-content';
      skipLink.href = '#content-inner';
      skipLink.textContent = '跳到主要内容';
      document.body.insertBefore(skipLink, document.body.firstChild);
    }

    makeKeyboardClickable(
      document.querySelector('#search-button .site-page'),
      '打开站内搜索'
    );
    makeKeyboardClickable(
      document.querySelector('#toggle-menu .site-page'),
      '打开导航菜单'
    );

    var searchClose = document.querySelector('.search-close-button');
    if (searchClose) {
      searchClose.type = 'button';
      searchClose.setAttribute('aria-label', '关闭站内搜索');
    }
  }

  function createThemeTrigger(id, className) {
    var button = document.createElement('button');
    button.type = 'button';
    button.id = id || '';
    button.className = className;
    button.setAttribute('aria-controls', PANEL_ID);
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-haspopup', 'dialog');
    button.innerHTML = themeIcon() + '<span class="theme-trigger__label">主题</span><span class="theme-trigger__current"></span>';
    button.addEventListener('click', function (event) {
      event.preventDefault();
      toggleThemeGallery(button);
    });
    return button;
  }

  function createNavThemeTrigger() {
    var menuItems = document.querySelector('#menus > .menus_items');
    if (!menuItems) return null;

    var existing = document.getElementById(NAV_BUTTON_ID);
    if (existing) return existing;

    var item = document.createElement('div');
    item.className = 'menus_item theme-gallery-menu';
    item.appendChild(createThemeTrigger(NAV_BUTTON_ID, 'site-page theme-gallery-trigger'));
    menuItems.appendChild(item);
    return item.querySelector('button');
  }

  function createSidebarThemeTrigger() {
    var menuItems = document.querySelector('#sidebar-menus .menus_items');
    if (!menuItems || menuItems.querySelector('.theme-sidebar-menu')) return null;

    var item = document.createElement('div');
    item.className = 'menus_item theme-sidebar-menu';
    item.appendChild(createThemeTrigger('', 'site-page theme-sidebar-trigger'));
    menuItems.appendChild(item);
    return item.querySelector('button');
  }

  function createThemeCard(themeKey) {
    var theme = THEMES[themeKey];
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'theme-gallery__card theme-gallery__card--' + theme.role;
    card.dataset.themeKey = themeKey;
    card.setAttribute('aria-pressed', 'false');
    card.setAttribute('aria-label', '应用' + theme.name + '主题');
    card.innerHTML =
      '<span class="theme-gallery__art" aria-hidden="true"></span>' +
      '<span class="theme-gallery__card-copy">' +
        '<span class="theme-gallery__card-name">' + theme.name + '</span>' +
        '<span class="theme-gallery__card-detail">' + theme.detail + '</span>' +
      '</span>' +
      '<span class="theme-gallery__card-state">正在阅读</span>';
    card.addEventListener('click', function () {
      applyTheme(themeKey, { persist: true });
      closeThemeGallery();
    });
    return card;
  }

  function ensureThemeGallery() {
    var panel = document.getElementById(PANEL_ID);
    if (panel) return panel;

    panel = document.createElement('section');
    panel.id = PANEL_ID;
    panel.className = 'theme-gallery';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', '选择阅读主题');
    panel.setAttribute('aria-modal', 'false');
    panel.hidden = true;
    panel.innerHTML =
      '<div class="theme-gallery__header">' +
        '<div>' +
          '<p class="theme-gallery__eyebrow">READING ATMOSPHERE</p>' +
          '<h2>选择阅读主题</h2>' +
          '<p class="theme-gallery__hint">主题会保存在这台设备，文章内容与阅读模式不会改变。</p>' +
        '</div>' +
        '<button class="theme-gallery__close" type="button" aria-label="关闭主题选择"><i class="fas fa-times" aria-hidden="true"></i></button>' +
      '</div>';

    var cards = document.createElement('div');
    cards.className = 'theme-gallery__cards';
    cards.setAttribute('role', 'group');
    cards.setAttribute('aria-label', '可用主题');
    ORDER.forEach(function (key) { cards.appendChild(createThemeCard(key)); });
    panel.appendChild(cards);

    panel.querySelector('.theme-gallery__close').addEventListener('click', closeThemeGallery);
    document.body.appendChild(panel);
    return panel;
  }

  function positionThemeGallery(anchor) {
    var panel = ensureThemeGallery();
    if (window.matchMedia('(max-width: 768px)').matches || !anchor) return;

    var rect = anchor.getBoundingClientRect();
    var panelWidth = Math.min(632, window.innerWidth - 32);
    var left = Math.max(16, Math.min(rect.right - panelWidth, window.innerWidth - panelWidth - 16));
    panel.style.setProperty('--theme-gallery-top', Math.max(64, rect.bottom + 12) + 'px');
    panel.style.setProperty('--theme-gallery-left', left + 'px');
  }

  function getOpenTrigger() {
    return document.querySelector('[aria-controls="' + PANEL_ID + '"][aria-expanded="true"]');
  }

  function openThemeGallery(trigger) {
    var panel = ensureThemeGallery();
    var currentTrigger = getOpenTrigger();
    if (currentTrigger && currentTrigger !== trigger) currentTrigger.setAttribute('aria-expanded', 'false');

    lastThemeTrigger = trigger;
    panel.hidden = false;
    positionThemeGallery(trigger);
    trigger.setAttribute('aria-expanded', 'true');
    window.requestAnimationFrame(function () {
      panel.classList.add('is-open');
      var selectedCard = panel.querySelector('.theme-gallery__card.is-selected');
      var focusTarget = selectedCard || panel.querySelector('.theme-gallery__close');
      if (focusTarget) focusTarget.focus({ preventScroll: true });
    });
  }

  function closeThemeGallery(restoreFocus) {
    var panel = document.getElementById(PANEL_ID);
    if (!panel || panel.hidden) return;

    panel.classList.remove('is-open');
    panel.hidden = true;
    var trigger = getOpenTrigger();
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus !== false && lastThemeTrigger && document.contains(lastThemeTrigger)) {
      lastThemeTrigger.focus({ preventScroll: true });
    }
    lastThemeTrigger = null;
  }

  function toggleThemeGallery(trigger) {
    var panel = ensureThemeGallery();
    if (!panel.hidden && getOpenTrigger() === trigger) {
      closeThemeGallery();
    } else {
      openThemeGallery(trigger);
    }
  }

  function updateThemeControls(themeKey) {
    var theme = THEMES[themeKey];
    document.querySelectorAll('.theme-trigger__current').forEach(function (current) {
      current.textContent = theme.shortLabel;
    });
    document.querySelectorAll('.theme-gallery__card').forEach(function (card) {
      var selected = card.dataset.themeKey === themeKey;
      card.classList.toggle('is-selected', selected);
      card.setAttribute('aria-pressed', String(selected));
    });
  }

  function applyTheme(themeKey, options) {
    var settings = options || {};
    var normalized = normalizeTheme(themeKey);
    var theme = THEMES[normalized];

    document.documentElement.setAttribute('data-football-kit', theme.id);
    document.documentElement.setAttribute('data-football-theme-key', normalized);
    document.documentElement.style.colorScheme = theme.mode;
    syncButterflyMode(theme);
    setMetaThemeColor(theme.metaColor);
    updateKitBadge(theme);
    updateThemeControls(normalized);

    if (settings.persist) saveTheme(normalized);
  }

  function bindGlobalEvents() {
    if (document.documentElement.dataset.themeGalleryBound === 'true') return;
    document.documentElement.dataset.themeGalleryBound = 'true';

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeThemeGallery(true);
    });

    document.addEventListener('click', function (event) {
      var panel = document.getElementById(PANEL_ID);
      if (!panel || panel.hidden) return;
      if (panel.contains(event.target) || event.target.closest('[aria-controls="' + PANEL_ID + '"]')) return;
      closeThemeGallery(false);
    });

    window.addEventListener('resize', function () {
      var trigger = getOpenTrigger();
      if (trigger) positionThemeGallery(trigger);
    });
  }

  function setup() {
    var legacyButton = document.getElementById('barca-kit-theme');
    if (legacyButton) legacyButton.remove();

    createNavThemeTrigger();
    createSidebarThemeTrigger();
    ensureThemeGallery();
    ensureAccessibilityChrome();
    decorateHomeTitle();
    bindGlobalEvents();
    applyTheme(readTheme(), { persist: false });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

  document.addEventListener('pjax:complete', setup);

  if (window.btf && typeof window.btf.addGlobalFn === 'function') {
    window.btf.addGlobalFn('pjaxComplete', setup, 'footballThemeGallery');
  }
})();
