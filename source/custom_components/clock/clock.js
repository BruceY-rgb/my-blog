/*!
 * Clock Component JavaScript
 * 自定义时钟组件脚本
 */

(function() {
  'use strict';

  // 组件配置
  const CLOCK_CONFIG = {
    format: '24h', // 12h 或 24h
    showSeconds: true,
    showDate: true,
    showTimezone: true,
    updateInterval: 1000, // 1秒更新一次
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  /**
   * 初始化时钟组件
   */
  function initClock() {
    const clockContainer = document.querySelector('.cc-clock');
    if (!clockContainer) {
      console.warn('[Clock Component] 容器元素未找到');
      return;
    }

    // 添加动画类
    clockContainer.classList.add('cc-clock--animated');

    // 初始渲染
    updateClock();

    // 设置定时更新
    setInterval(updateClock, CLOCK_CONFIG.updateInterval);
  }

  /**
   * 更新时钟显示
   */
  function updateClock() {
    const clockContainer = document.querySelector('.cc-clock');
    if (!clockContainer) return;

    const now = new Date();
    const timeStr = formatTime(now);
    const dateStr = formatDate(now);
    const timezoneStr = formatTimezone(now);

    clockContainer.innerHTML = `
      <div class="cc-clock__header">
        <h3 class="cc-clock__title">
          <span>🕐</span>
          <span>实时时钟</span>
        </h3>
      </div>

      <div class="cc-clock__time">
        <h2 class="cc-clock__time-value cc-clock__time-value--animated cc-clock__time-value--glow">
          ${timeStr}
        </h2>
      </div>

      ${CLOCK_CONFIG.showDate ? `
        <div class="cc-clock__date">
          <span class="cc-clock__date-value">${dateStr}</span>
        </div>
      ` : ''}

      ${CLOCK_CONFIG.showTimezone ? `
        <div class="cc-clock__timezone">
          ${timezoneStr}
        </div>
      ` : ''}
    `;

    // 检测深色模式
    checkDarkMode();
  }

  /**
   * 格式化时间
   * @param {Date} date 日期对象
   * @returns {string} 格式化后的时间字符串
   */
  function formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    if (CLOCK_CONFIG.format === '12h') {
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours === 0 ? 12 : hours;
      return CLOCK_CONFIG.showSeconds
        ? `${hours}:${minutes}:${seconds} ${period}`
        : `${hours}:${minutes} ${period}`;
    } else {
      hours = hours.toString().padStart(2, '0');
      return CLOCK_CONFIG.showSeconds
        ? `${hours}:${minutes}:${seconds}`
        : `${hours}:${minutes}`;
    }
  }

  /**
   * 格式化日期
   * @param {Date} date 日期对象
   * @returns {string} 格式化后的日期字符串
   */
  function formatDate(date) {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return date.toLocaleDateString('zh-CN', options);
  }

  /**
   * 格式化时区信息
   * @param {Date} date 日期对象
   * @returns {string} 时区信息字符串
   */
  function formatTimezone(date) {
    const timezone = CLOCK_CONFIG.timezone;
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const hours = Math.floor(Math.abs(offset) / 60).toString().padStart(2, '0');
    const minutes = (Math.abs(offset) % 60).toString().padStart(2, '0');

    return `UTC${sign}${hours}:${minutes} (${timezone})`;
  }

  /**
   * 检测深色模式
   */
  function checkDarkMode() {
    const clockContainer = document.querySelector('.cc-clock');
    if (!clockContainer) return;

    const isDark = document.body.classList.contains('dark') ||
                   window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (isDark) {
      clockContainer.classList.add('cc-clock--dark');
    } else {
      clockContainer.classList.remove('cc-clock--dark');
    }
  }

  // 监听主题变化
  const themeObserver = new MutationObserver(checkDarkMode);

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initClock();

      // 监听主题变化
      themeObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['class']
      });
    });
  } else {
    initClock();

    themeObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', checkDarkMode);

})();