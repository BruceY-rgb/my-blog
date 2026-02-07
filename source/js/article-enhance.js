/*!
 * 文章页增强功能
 * Article Enhancement Features
 * 包含：阅读进度条、Toast通知、复制成功提示等
 * 版本: v1.0
 */

(function() {
  'use strict';

  // 配置对象
  const CONFIG = {
    progressBar: {
      enabled: true,
      height: '3px',
      color: 'linear-gradient(90deg, #49B1F5, #00c4b6)',
      position: 'top'
    },
    toast: {
      duration: 3000,
      position: 'top-right',
      maxToasts: 5
    },
    copyTip: {
      enabled: true,
      text: '复制成功！',
      duration: 2000
    }
  };

  // 阅读进度条类
  class ReadingProgressBar {
    constructor() {
      this.bar = null;
      this.init();
    }

    init() {
      if (!CONFIG.progressBar.enabled) return;

      this.createBar();
      this.bindEvents();
      this.updateProgress();
    }

    createBar() {
      this.bar = document.createElement('div');
      this.bar.className = 'reading-progress-bar';
      this.bar.style.height = CONFIG.progressBar.height;
      this.bar.style.background = CONFIG.progressBar.color;
      this.bar.style.position = 'fixed';
      this.bar.style.top = CONFIG.progressBar.position === 'top' ? '0' : 'auto';
      this.bar.style.bottom = CONFIG.progressBar.position === 'bottom' ? '0' : 'auto';
      this.bar.style.left = '0';
      this.bar.style.width = '0%';
      this.bar.style.zIndex = '1000';
      document.body.appendChild(this.bar);
    }

    bindEvents() {
      // 使用 requestAnimationFrame 优化性能
      let ticking = false;

      const updateProgress = () => {
        this.updateProgress();
        ticking = false;
      };

      const requestTick = () => {
        if (!ticking) {
          requestAnimationFrame(updateProgress);
          ticking = true;
        }
      };

      window.addEventListener('scroll', requestTick, { passive: true });
      window.addEventListener('resize', requestTick);
    }

    updateProgress() {
      if (!this.bar) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercent = (scrollTop / scrollHeight) * 100;

      this.bar.style.width = Math.min(scrollPercent, 100) + '%';
    }

    destroy() {
      if (this.bar) {
        this.bar.remove();
      }
    }
  }

  // Toast 通知系统
  class ToastManager {
    constructor() {
      this.container = null;
      this.toasts = [];
      this.init();
    }

    init() {
      this.createContainer();
    }

    createContainer() {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.style.position = 'fixed';
      this.container.style.top = '20px';
      this.container.style.right = '20px';
      this.container.style.zIndex = '9999';
      this.container.style.display = 'flex';
      this.container.style.flexDirection = 'column';
      this.container.style.gap = '10px';
      document.body.appendChild(this.container);
    }

    show(message, type = 'success', duration = CONFIG.toast.duration) {
      // 限制 Toast 数量
      if (this.toasts.length >= CONFIG.toast.maxToasts) {
        this.remove(this.toasts[0]);
      }

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      toast.innerHTML = `
        <span class="toast-icon">${this.getIcon(type)}</span>
        <span class="toast-message">${message}</span>
      `;

      // 添加点击关闭事件
      toast.addEventListener('click', () => {
        this.remove(toast);
      });

      this.container.appendChild(toast);
      this.toasts.push(toast);

      // 强制重绘
      toast.offsetHeight;

      // 显示动画
      toast.classList.add('show');

      // 自动隐藏
      if (duration > 0) {
        setTimeout(() => {
          this.remove(toast);
        }, duration);
      }

      return toast;
    }

    getIcon(type) {
      const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
      };
      return icons[type] || icons.info;
    }

    remove(toast) {
      if (!toast || !toast.parentNode) return;

      toast.classList.remove('show');

      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
        this.toasts = this.toasts.filter(t => t !== toast);
      }, 300);
    }

    success(message, duration) {
      return this.show(message, 'success', duration);
    }

    error(message, duration) {
      return this.show(message, 'error', duration);
    }

    warning(message, duration) {
      return this.show(message, 'warning', duration);
    }

    info(message, duration) {
      return this.show(message, 'info', duration);
    }

    clear() {
      this.toasts.forEach(toast => this.remove(toast));
    }
  }

  // 复制功能增强
  class CopyEnhancer {
    constructor(toastManager) {
      this.toastManager = toastManager;
      this.init();
    }

    init() {
      if (!CONFIG.copyTip.enabled) return;

      this.enhanceCodeBlocks();
      this.enhanceContent();
    }

    enhanceCodeBlocks() {
      // 为代码块添加复制按钮
      const codeBlocks = document.querySelectorAll('pre code, .code-block');
      codeBlocks.forEach(block => {
        this.addCopyButton(block);
      });
    }

    addCopyButton(element) {
      // 检查是否已经添加过复制按钮
      if (element.parentNode.querySelector('.copy-button')) return;

      const button = document.createElement('button');
      button.className = 'copy-button';
      button.innerHTML = '📋 复制';
      button.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 6px 12px;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 10;
      `;

      // 添加悬停显示效果
      const wrapper = element.parentNode;
      wrapper.style.position = 'relative';
      wrapper.appendChild(button);

      wrapper.addEventListener('mouseenter', () => {
        button.style.opacity = '1';
      });

      wrapper.addEventListener('mouseleave', () => {
        button.style.opacity = '0';
      });

      // 绑定复制事件
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.copyToClipboard(element.innerText || element.textContent);
      });
    }

    enhanceContent() {
      // 为普通文本内容添加复制功能
      document.addEventListener('click', async (e) => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length > 10) {
          await this.copyToClipboard(selectedText);
          selection.removeAllRanges();
        }
      });
    }

    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        this.toastManager.success(CONFIG.copyTip.text, CONFIG.copyTip.duration);
      } catch (err) {
        // 降级方案
        this.fallbackCopy(text);
      }
    }

    fallbackCopy(text) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        this.toastManager.success(CONFIG.copyTip.text, CONFIG.copyTip.duration);
      } catch (err) {
        this.toastManager.error('复制失败，请手动选择复制', CONFIG.copyTip.duration);
      }

      document.body.removeChild(textArea);
    }
  }

  // 阅读体验增强器
  class ReadingExperienceEnhancer {
    constructor() {
      this.progressBar = null;
      this.toastManager = null;
      this.copyEnhancer = null;
      this.init();
    }

    init() {
      // 等待 DOM 就绪
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      // 检查是否在文章页面
      if (!this.isArticlePage()) {
        console.log('[Article Enhance] Not on article page, skipping...');
        return;
      }

      console.log('[Article Enhance] Initializing article enhancements...');

      // 初始化各个组件
      this.toastManager = new ToastManager();
      this.progressBar = new ReadingProgressBar();
      this.copyEnhancer = new CopyEnhancer(this.toastManager);

      // 添加键盘快捷键
      this.bindKeyboardShortcuts();

      // 添加页面切换动画
      this.addPageTransitions();

      console.log('[Article Enhance] Article enhancements initialized');
    }

    isArticlePage() {
      return document.body.classList.contains('post-bg') ||
             document.querySelector('article.post') !== null ||
             window.location.pathname.includes('/posts/');
    }

    bindKeyboardShortcuts() {
      document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + C: 复制选中文本
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          const selection = window.getSelection();
          const selectedText = selection.toString().trim();
          if (selectedText) {
            e.preventDefault();
            this.copyEnhancer.copyToClipboard(selectedText);
          }
        }

        // 空格键: 暂停/继续阅读进度条动画（如果需要）
        if (e.key === ' ' && e.target === document.body) {
          e.preventDefault();
          // 可以添加阅读模式切换
        }
      });
    }

    addPageTransitions() {
      // 为文章内容添加淡入动画
      const article = document.querySelector('article.post, .post-content');
      if (article) {
        article.style.opacity = '0';
        article.style.transform = 'translateY(20px)';
        article.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

        setTimeout(() => {
          article.style.opacity = '1';
          article.style.transform = 'translateY(0)';
        }, 100);
      }
    }

    destroy() {
      if (this.progressBar) {
        this.progressBar.destroy();
      }
      if (this.toastManager) {
        this.toastManager.clear();
      }
    }
  }

  // 初始化阅读体验增强器
  const enhancer = new ReadingExperienceEnhancer();

  // 暴露到全局（用于调试）
  window.articleEnhancer = {
    toast: () => enhancer.toastManager,
    progressBar: () => enhancer.progressBar,
    destroy: () => enhancer.destroy()
  };

})();
