/*!
 * 全局效果系统
 * Global Effects System
 * 包含：彩色标签云、动态效果等
 * 版本: v1.0
 */

(function() {
  'use strict';

  // 配置对象
  const CONFIG = {
    tagCloud: {
      enabled: true,
      colorCount: 10,        // 颜色种类数量
      saturation: 70,       // HSL 饱和度 (0-100)
      lightness: 60,         // HSL 亮度 (0-100)
      animateOnHover: true,  // 悬停动画
      randomizeColors: true  // 随机分配颜色
    },
    effects: {
      fadeInDelay: 100,      // 淡入动画延迟
      staggerDelay: 50       // 错开动画延迟
    }
  };

  // 彩色标签云类
  class ColorfulTagCloud {
    constructor() {
      this.tags = [];
      this.colors = [];
      this.init();
    }

    init() {
      if (!CONFIG.tagCloud.enabled) return;

      this.generateColors();
      this.findTags();
      this.applyColors();
      this.addAnimations();
    }

    // 生成颜色数组
    generateColors() {
      this.colors = [];
      const count = CONFIG.tagCloud.colorCount;

      for (let i = 0; i < count; i++) {
        const hue = Math.floor((360 / count) * i);
        const color = `hsl(${hue}, ${CONFIG.tagCloud.saturation}%, ${CONFIG.tagCloud.lightness}%)`;
        this.colors.push(color);
      }

      // 洗牌颜色数组（随机化）
      if (CONFIG.tagCloud.randomizeColors) {
        this.shuffleArray(this.colors);
      }
    }

    // Fisher-Yates 洗牌算法
    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    // 查找所有标签元素
    findTags() {
      const selectors = [
        '#tag-cloud .tag-cloud-tags a',
        '.aside-content .card-tags a',
        '.tag-wrap a',
        '.article-tags a',
        '.tags a',
        '[class*="tag"] a'
      ];

      this.tags = [];
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        this.tags.push(...elements);
      });

      // 去重
      this.tags = [...new Set(this.tags)];

      console.log(`[Tag Cloud] Found ${this.tags.length} tags`);
    }

    // 应用颜色到标签
    applyColors() {
      this.tags.forEach((tag, index) => {
        // 移除默认样式类
        tag.classList.remove('tag-color-1', 'tag-color-2', 'tag-color-3',
                              'tag-color-4', 'tag-color-5', 'tag-color-6',
                              'tag-color-7', 'tag-color-8', 'tag-color-9',
                              'tag-color-10');

        // 分配颜色
        const colorIndex = index % this.colors.length;
        const color = this.colors[colorIndex];

        // 应用内联样式（保留优先级）
        tag.style.background = color;
        tag.style.backgroundColor = color;

        // 添加颜色类（如果CSS中有预定义的渐变色类）
        const classIndex = (index % 10) + 1;
        tag.classList.add(`tag-color-${classIndex}`);

        // 存储原始颜色（用于悬停效果）
        tag.dataset.originalColor = color;
      });
    }

    // 添加动画效果
    addAnimations() {
      if (!CONFIG.tagCloud.animateOnHover) return;

      this.tags.forEach(tag => {
        tag.addEventListener('mouseenter', () => {
          tag.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });

        tag.addEventListener('mouseleave', () => {
          tag.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });
      });
    }

    // 重新生成颜色
    regenerateColors() {
      this.generateColors();
      this.applyColors();
    }

    // 销毁
    destroy() {
      this.tags.forEach(tag => {
        delete tag.dataset.originalColor;
        tag.classList.remove('tag-color-1', 'tag-color-2', 'tag-color-3',
                              'tag-color-4', 'tag-color-5', 'tag-color-6',
                              'tag-color-7', 'tag-color-8', 'tag-color-9',
                              'tag-color-10');
      });
    }
  }

  // 淡入动画效果
  class FadeInEffects {
    constructor() {
      this.elements = [];
      this.init();
    }

    init() {
      this.findElements();
      this.observeElements();
    }

    findElements() {
      const selectors = [
        '.aside-content .card',
        '.article-container .post-card',
        '.recent-post-item',
        '.category-list-item',
        '.tag-list-item'
      ];

      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        this.elements.push(...elements);
      });
    }

    observeElements() {
      // 使用 Intersection Observer 实现懒加载动画
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '50px'
      });

      // 为元素添加初始样式并观察
      this.elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = `opacity 0.6s ease ${index * CONFIG.effects.staggerDelay}ms,
                                    transform 0.6s ease ${index * CONFIG.effects.staggerDelay}ms`;

        observer.observe(element);
      });
    }

    destroy() {
      this.elements.forEach(element => {
        element.style.opacity = '';
        element.style.transform = '';
        element.style.transition = '';
      });
    }
  }

  // 平滑滚动增强
  class SmoothScrollEnhancer {
    constructor() {
      this.init();
    }

    init() {
      this.addSmoothScroll();
      this.addScrollToTop();
    }

    addSmoothScroll() {
      // 为内部链接添加平滑滚动
      document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;

        const targetId = link.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    }

    addScrollToTop() {
      // 创建返回顶部按钮
      const button = document.createElement('button');
      button.innerHTML = '↑';
      button.className = 'scroll-to-top';
      button.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: var(--primary-color);
        color: white;
        border: none;
        font-size: 24px;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 999;
        box-shadow: 0 4px 16px rgba(73, 177, 245, 0.3);
      `;

      document.body.appendChild(button);

      // 监听滚动显示/隐藏按钮
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            if (window.pageYOffset > 300) {
              button.style.opacity = '1';
              button.style.visibility = 'visible';
            } else {
              button.style.opacity = '0';
              button.style.visibility = 'hidden';
            }
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });

      // 点击返回顶部
      button.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });

      // 悬停效果
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-5px)';
        button.style.boxShadow = '0 8px 24px rgba(73, 177, 245, 0.4)';
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 4px 16px rgba(73, 177, 245, 0.3)';
      });
    }
  }

  // 全局效果管理器
  class GlobalEffectsManager {
    constructor() {
      this.tagCloud = null;
      this.fadeInEffects = null;
      this.smoothScroll = null;
      this.init();
    }

    init() {
      console.log('[Global Effects] Initializing...');

      // 等待 DOM 就绪
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setup());
      } else {
        this.setup();
      }
    }

    setup() {
      this.tagCloud = new ColorfulTagCloud();
      this.fadeInEffects = new FadeInEffects();
      this.smoothScroll = new SmoothScrollEnhancer();

      console.log('[Global Effects] All effects initialized');
    }

    destroy() {
      if (this.tagCloud) this.tagCloud.destroy();
      if (this.fadeInEffects) this.fadeInEffects.destroy();
    }

    // 重新生成标签颜色
    regenerateTagColors() {
      if (this.tagCloud) {
        this.tagCloud.regenerateColors();
      }
    }
  }

  // 初始化全局效果管理器
  const globalEffects = new GlobalEffectsManager();

  // 暴露到全局（用于调试）
  window.globalEffects = {
    tagCloud: () => globalEffects.tagCloud,
    regenerateTagColors: () => globalEffects.regenerateTagColors(),
    destroy: () => globalEffects.destroy()
  };

})();
