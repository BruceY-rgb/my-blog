(function () {
  'use strict';

  var themes = {
    home: { id: 'barcelona.2024-2025.home', mode: 'dark' },
    away: { id: 'barcelona.2024-2025.away', mode: 'light' },
    third: { id: 'barcelona.2024-2025.third', mode: 'dark' },
    spain: { id: 'spain.2026.champions-dream', mode: 'dark' }
  };
  var selected = 'home';

  try {
    var stored = localStorage.getItem('football-reading-theme') ||
      localStorage.getItem('barca-kit-theme');

    if (themes[stored]) {
      selected = stored;
    } else {
      Object.keys(themes).some(function (key) {
        if (themes[key].id !== stored) return false;
        selected = key;
        return true;
      });
    }
  } catch (error) {
    // Storage can be unavailable in strict privacy contexts.
  }

  var theme = themes[selected];
  var root = document.documentElement;
  root.setAttribute('data-football-kit', theme.id);
  root.setAttribute('data-theme', theme.mode);
  root.style.colorScheme = theme.mode;
})();
