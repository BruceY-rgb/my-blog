/*!
 * 数据分析组件脚本
 * Analytics Component JavaScript
 * 版本: v1.0
 */

(function() {
  'use strict';

  // 模拟数据分析
  class AnalyticsManager {
    constructor() {
      this.storageKey = 'cc_analytics';
      this.visitCount = 0;
      this.totalViews = 0;
      this.init();
    }

    init() {
      this.loadAnalytics();
      this.createAnalyticsElement();
      this.bindEvents();
      this.updateDisplay();
      this.startAutoUpdate();
    }

    loadAnalytics() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const data = JSON.parse(stored);
          this.visitCount = data.visitCount || 0;
          this.totalViews = data.totalViews || 0;
        }
        // 增加访问计数
        this.visitCount++;
        this.totalViews += Math.floor(Math.random() * 5) + 1; // 模拟页面浏览量
        this.saveAnalytics();
      } catch (error) {
        console.error('[Analytics Component] Failed to load analytics:', error);
        this.visitCount = 1;
        this.totalViews = Math.floor(Math.random() * 100) + 50;
      }
    }

    saveAnalytics() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify({
          visitCount: this.visitCount,
          totalViews: this.totalViews,
          lastUpdate: new Date().toISOString()
        }));
      } catch (error) {
        console.error('[Analytics Component] Failed to save analytics:', error);
      }
    }

    createAnalyticsElement() {
      const container = document.querySelector('.cc-analytics');
      if (!container) {
        console.warn('[Analytics Component] 容器元素未找到');
        return;
      }

      container.innerHTML = `
        <div class="cc-analytics__header">
          <h3 class="cc-analytics__title">
            <span>📊</span>
            <span>数据分析</span>
          </h3>
          <button class="cc-analytics__refresh" onclick="analyticsManager.refresh()" title="刷新数据">
            🔄
          </button>
        </div>
        <div class="cc-analytics__stats">
          <div class="cc-analytics__stat">
            <div class="cc-analytics__stat-value">${this.visitCount}</div>
            <div class="cc-analytics__stat-label">访问次数</div>
          </div>
          <div class="cc-analytics__stat">
            <div class="cc-analytics__stat-value">${this.totalViews}</div>
            <div class="cc-analytics__stat-label">总浏览量</div>
          </div>
        </div>
        <div class="cc-analytics__chart">
          <div class="cc-analytics__chart-text">
            📈 访问趋势图表<br>
            <small>数据实时更新中...</small>
          </div>
        </div>
        <div class="cc-analytics__footer">
          <span class="cc-analytics__last-update">最后更新: ${this.formatTime(new Date())}</span>
          <span class="cc-analytics__status">
            <span class="cc-analytics__status-dot"></span>
            实时监控
          </span>
        </div>
      `;
    }

    updateDisplay() {
      const visitValue = document.querySelector('.cc-analytics__stat-value');
      const viewsValue = document.querySelectorAll('.cc-analytics__stat-value')[1];
      const lastUpdate = document.querySelector('.cc-analytics__last-update');

      if (visitValue) visitValue.textContent = this.visitCount;
      if (viewsValue) viewsValue.textContent = this.totalViews;
      if (lastUpdate) lastUpdate.textContent = `最后更新: ${this.formatTime(new Date())}`;
    }

    refresh() {
      const container = document.querySelector('.cc-analytics');
      if (container) {
        container.classList.add('loading');

        setTimeout(() => {
          // 模拟数据刷新
          this.totalViews += Math.floor(Math.random() * 10) + 1;
          this.saveAnalytics();
          this.updateDisplay();
          container.classList.remove('loading');
        }, 1000);
      }
    }

    startAutoUpdate() {
      // 每30秒自动更新浏览量
      setInterval(() => {
        if (Math.random() > 0.7) { // 70%概率增加浏览量
          this.totalViews += Math.floor(Math.random() * 3) + 1;
          this.saveAnalytics();
          this.updateDisplay();
        }
      }, 30000);
    }

    formatTime(date) {
      const now = new Date();
      const diff = now - date;

      if (diff < 60000) { // 小于1分钟
        return '刚刚';
      } else if (diff < 3600000) { // 小于1小时
        return Math.floor(diff / 60000) + '分钟前';
      } else if (diff < 86400000) { // 小于1天
        return Math.floor(diff / 3600000) + '小时前';
      } else {
        return date.toLocaleDateString('zh-CN');
      }
    }
  }

  // 页面加载完成后初始化
  function initAnalyticsComponent() {
    window.analyticsManager = new AnalyticsManager();
    console.log('[Analytics Component] Analytics component initialized');
  }

  // DOM 就绪后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnalyticsComponent);
  } else {
    initAnalyticsComponent();
  }

})();
