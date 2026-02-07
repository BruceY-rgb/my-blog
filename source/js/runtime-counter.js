/*!
 * 运行时间统计系统
 * Runtime Counter System
 * 显示网站已运行的时间，支持实时更新
 * 版本: v1.0
 */

(function() {
  'use strict';

  // 配置对象
  const CONFIG = {
    startDate: null,         // 网站运行开始日期（留空则自动获取或使用默认值）
    storageKey: 'site_start_date', // LocalStorage 键名
    updateInterval: 1000,    // 更新间隔（毫秒）
    showSeconds: true,       // 是否显示秒数
    autoSave: true,          // 自动保存到 LocalStorage
    format: {
      days: '天',
      hours: '小时',
      minutes: '分钟',
      seconds: '秒'
    },
    position: 'footer',     // 插入位置：'footer' 或 'custom'
    customSelector: null     // 自定义选择器（如果 position 为 'custom'）
  };

  // 运行时间计数器类
  class RuntimeCounter {
    constructor() {
      this.startTime = null;
      this.element = null;
      this.intervalId = null;
      this.init();
    }

    init() {
      this.getStartTime();
      this.createElement();
      this.bindEvents();
      this.start();
    }

    // 获取开始时间
    getStartTime() {
      // 优先级：配置 > LocalStorage > 默认（当前时间）
      if (CONFIG.startDate) {
        this.startTime = new Date(CONFIG.startDate);
      } else if (CONFIG.autoSave) {
        const saved = localStorage.getItem(CONFIG.storageKey);
        if (saved) {
          this.startTime = new Date(saved);
        } else {
          this.startTime = new Date();
          this.saveStartTime();
        }
      } else {
        this.startTime = new Date();
      }

      console.log('[Runtime Counter] Start time:', this.startTime.toLocaleString());
    }

    // 保存开始时间到 LocalStorage
    saveStartTime() {
      if (CONFIG.autoSave && localStorage) {
        localStorage.setItem(CONFIG.storageKey, this.startTime.toISOString());
      }
    }

    // 创建显示元素
    createElement() {
      this.element = document.createElement('div');
      this.element.id = 'runtime-stat';
      this.element.innerHTML = this.generateHTML();
      this.insertElement();
    }

    // 生成 HTML 内容
    generateHTML() {
      return `
        <div class="runtime-icon">⏱️</div>
        <span class="runtime-text">本站已运行 </span>
        <span class="runtime-value">
          <span class="runtime-days">0</span>${CONFIG.format.days}
          <span class="runtime-hours">0</span>${CONFIG.format.hours}
          <span class="runtime-minutes">0</span>${CONFIG.format.minutes}
          ${CONFIG.showSeconds ? `<span class="runtime-seconds">0</span>${CONFIG.format.seconds}` : ''}
        </span>
      `;
    }

    // 插入元素到页面
    insertElement() {
      let target = null;

      if (CONFIG.position === 'footer') {
        target = document.querySelector('footer') || document.querySelector('#footer');
      } else if (CONFIG.position === 'custom' && CONFIG.customSelector) {
        target = document.querySelector(CONFIG.customSelector);
      }

      if (target) {
        target.appendChild(this.element);
        console.log('[Runtime Counter] Element inserted successfully');
      } else {
        console.warn('[Runtime Counter] Target element not found, appending to body');
        document.body.appendChild(this.element);
      }
    }

    // 绑定事件
    bindEvents() {
      // 页面可见性变化事件（节能）
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stop();
        } else {
          this.start();
        }
      });

      // 窗口失焦/获焦事件
      window.addEventListener('blur', () => this.stop());
      window.addEventListener('focus', () => this.start());
    }

    // 计算运行时间
    calculateRuntime() {
      const now = new Date();
      const diff = now.getTime() - this.startTime.getTime();

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    }

    // 更新显示
    update() {
      const runtime = this.calculateRuntime();
      const daysEl = this.element.querySelector('.runtime-days');
      const hoursEl = this.element.querySelector('.runtime-hours');
      const minutesEl = this.element.querySelector('.runtime-minutes');

      if (daysEl) daysEl.textContent = runtime.days;
      if (hoursEl) hoursEl.textContent = runtime.hours.toString().padStart(2, '0');
      if (minutesEl) minutesEl.textContent = runtime.minutes.toString().padStart(2, '0');

      if (CONFIG.showSeconds) {
        const secondsEl = this.element.querySelector('.runtime-seconds');
        if (secondsEl) {
          secondsEl.textContent = runtime.seconds.toString().padStart(2, '0');
        }
      }

      // 添加闪烁动画（每秒一次）
      this.addTickAnimation();
    }

    // 添加跳动动画
    addTickAnimation() {
      const valueElements = this.element.querySelectorAll('.runtime-value span');
      valueElements.forEach(el => {
        el.style.animation = 'none';
        // 强制重绘
        el.offsetHeight;
        el.style.animation = 'runtime-tick 0.5s ease';
      });
    }

    // 开始更新
    start() {
      if (this.intervalId) return;

      this.update(); // 立即更新一次
      this.intervalId = setInterval(() => {
        this.update();
      }, CONFIG.updateInterval);

      console.log('[Runtime Counter] Started');
    }

    // 停止更新
    stop() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
        console.log('[Runtime Counter] Stopped');
      }
    }

    // 销毁
    destroy() {
      this.stop();
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }

    // 重新开始计时
    reset(startDate = null) {
      this.stop();
      if (startDate) {
        this.startTime = new Date(startDate);
      } else {
        this.startTime = new Date();
      }
      this.saveStartTime();
      this.start();
      console.log('[Runtime Counter] Reset to:', this.startTime.toLocaleString());
    }

    // 获取运行时间（毫秒）
    getRuntime() {
      return new Date().getTime() - this.startTime.getTime();
    }
  }

  // 添加 CSS 动画样式
  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes runtime-tick {
        0% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
        100% {
          transform: scale(1);
        }
      }

      #runtime-stat {
        text-align: center;
        padding: 15px 0;
        font-size: 14px;
        color: var(--text-color-muted, #999);
        transition: color 0.3s ease;
        cursor: default;
      }

      #runtime-stat:hover {
        color: var(--primary-color, #49B1F5);
      }

      #runtime-stat .runtime-icon {
        display: inline-block;
        margin-right: 8px;
        animation: runtime-pulse 2s ease-in-out infinite;
      }

      @keyframes runtime-pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.2);
          opacity: 0.8;
        }
      }

      #runtime-stat .runtime-value {
        font-weight: 600;
        color: var(--primary-color, #49B1F5);
      }

      #runtime-stat .runtime-value span {
        display: inline-block;
        transition: transform 0.3s ease;
      }

      /* 深色模式适配 */
      [data-theme="dark"] #runtime-stat {
        color: var(--text-color-muted, #aaa);
      }
    `;
    document.head.appendChild(style);
  }

  // 初始化运行时间计数器
  function initRuntimeCounter() {
    // 注入样式
    injectStyles();

    // 创建计数器实例
    window.runtimeCounter = new RuntimeCounter();

    console.log('[Runtime Counter] Runtime counter initialized');
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRuntimeCounter);
  } else {
    initRuntimeCounter();
  }

})();
