(function () {
  'use strict';

  var STORAGE_KEY = 'barca-kit-theme';
  var BUTTON_ID = 'barca-kit-theme';
  var THEMES = {
    home: {
      id: 'barcelona.2024-2025.home',
      role: 'home',
      label: 'H',
      mode: 'dark',
      metaColor: '#050814',
      title: 'Barca home kit theme'
    },
    away: {
      id: 'barcelona.2024-2025.away',
      role: 'away',
      label: 'A',
      mode: 'light',
      metaColor: '#e9ffd2',
      title: 'Barca away kit theme'
    },
    third: {
      id: 'barcelona.2024-2025.third',
      role: 'third',
      label: 'T',
      mode: 'dark',
      metaColor: '#060b18',
      title: 'Barca third kit theme'
    }
  };
  var ORDER = ['home', 'away', 'third'];

  function normalizeTheme(value) {
    if (THEMES[value]) return value;
    return ORDER.find(function (key) {
      return THEMES[key].id === value;
    }) || 'home';
  }

  function readTheme() {
    try {
      return normalizeTheme(localStorage.getItem(STORAGE_KEY));
    } catch (error) {
      return 'home';
    }
  }

  function saveTheme(themeKey) {
    try {
      localStorage.setItem(STORAGE_KEY, themeKey);
    } catch (error) {
      // localStorage can be unavailable in strict privacy contexts.
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

  function updateButton(theme) {
    var button = document.getElementById(BUTTON_ID);
    if (!button) return;

    button.dataset.kitRole = theme.role;
    button.setAttribute('aria-label', theme.title);
    button.setAttribute('title', theme.title);
    button.innerHTML = '<span>' + theme.label + '</span>';
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
    if (text) {
      text.textContent = theme.role === 'home'
        ? 'Home kit'
        : theme.role === 'away'
          ? 'Away kit'
          : 'Third kit';
    }
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

  function markSection() {
    var root = document.documentElement;
    var bodyWrap = document.getElementById('body-wrap');
    var isTaxonomy = Boolean(
      document.getElementById('archive') ||
      (bodyWrap && (bodyWrap.classList.contains('type-tags') || bodyWrap.classList.contains('type-categories')))
    );

    if (isTaxonomy) {
      root.setAttribute('data-football-section', 'taxonomy');
    } else {
      root.removeAttribute('data-football-section');
    }
  }

  function applyTheme(themeKey, options) {
    var settings = options || {};
    var normalized = normalizeTheme(themeKey);
    var theme = THEMES[normalized];

    document.documentElement.setAttribute('data-football-kit', theme.id);
    document.documentElement.style.colorScheme = theme.mode;
    syncButterflyMode(theme);
    setMetaThemeColor(theme.metaColor);
    updateButton(theme);
    updateKitBadge(theme);

    if (settings.persist) saveTheme(normalized);
  }

  function toggleTheme() {
    var current = readTheme();
    var next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
    applyTheme(next, { persist: true });
  }

  function createButton() {
    var existing = document.getElementById(BUTTON_ID);
    if (existing) return existing;

    var button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.addEventListener('click', toggleTheme);

    var rightsideShow = document.getElementById('rightside-config-show');
    var goUp = document.getElementById('go-up');
    if (rightsideShow) {
      rightsideShow.insertBefore(button, goUp || rightsideShow.firstChild);
    } else {
      button.className = 'barca-kit-theme--floating';
      document.body.appendChild(button);
    }

    return button;
  }

  function setup() {
    createButton();
    markSection();
    decorateHomeTitle();
    applyTheme(readTheme(), { persist: false });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }

  document.addEventListener('pjax:complete', setup);

  if (window.btf && typeof window.btf.addGlobalFn === 'function') {
    window.btf.addGlobalFn('pjaxComplete', setup, 'barcaKitTheme');
  }
})();
