/*!
 * 粒子背景系统
 * Particle Background System
 * 轻量级 Canvas 粒子效果
 * 版本: v1.0
 */

(function() {
  'use strict';

  // 粒子配置
  const PARTICLE_CONFIG = {
    particleCount: 80,        // 粒子数量
    particleSpeed: 0.5,       // 粒子移动速度
    particleSize: 2,          // 粒子大小
    particleColor: 'rgba(73, 177, 245, 0.6)', // 粒子颜色
    mouseRadius: 100,        // 鼠标影响半径
    connectionDistance: 120,  // 连线距离阈值
    maxConnections: 5,       // 每个粒子最大连接数
    enableMouse: true,       // 启用鼠标交互
    enableMobile: false      // 移动端禁用
  };

  // 粒子类
  class Particle {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.reset();
    }

    reset() {
      this.x = Math.random() * this.canvas.width;
      this.y = Math.random() * this.canvas.height;
      this.vx = (Math.random() - 0.5) * PARTICLE_CONFIG.particleSpeed;
      this.vy = (Math.random() - 0.5) * PARTICLE_CONFIG.particleSpeed;
      this.size = Math.random() * PARTICLE_CONFIG.particleSize + 0.5;
    }

    update(mouse) {
      // 移动粒子
      this.x += this.vx;
      this.y += this.vy;

      // 边界检测和反弹
      if (this.x < 0 || this.x > this.canvas.width) {
        this.vx *= -1;
      }
      if (this.y < 0 || this.y > this.canvas.height) {
        this.vy *= -1;
      }

      // 鼠标交互
      if (PARTICLE_CONFIG.enableMouse && mouse.x && mouse.y) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < PARTICLE_CONFIG.mouseRadius) {
          const force = (PARTICLE_CONFIG.mouseRadius - distance) / PARTICLE_CONFIG.mouseRadius;
          this.vx += (dx / distance) * force * 0.01;
          this.vy += (dy / distance) * force * 0.01;
        }
      }

      // 限制速度
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > PARTICLE_CONFIG.particleSpeed * 2) {
        this.vx = (this.vx / speed) * PARTICLE_CONFIG.particleSpeed * 2;
        this.vy = (this.vy / speed) * PARTICLE_CONFIG.particleSpeed * 2;
      }
    }

    draw() {
      this.ctx.beginPath();
      this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      this.ctx.fillStyle = PARTICLE_CONFIG.particleColor;
      this.ctx.fill();

      // 添加发光效果
      this.ctx.beginPath();
      this.ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(73, 177, 245, 0.1)';
      this.ctx.fill();
    }

    connect(particles) {
      for (let i = 0; i < particles.length; i++) {
        if (this === particles[i]) continue;

        const dx = this.x - particles[i].x;
        const dy = this.y - particles[i].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < PARTICLE_CONFIG.connectionDistance) {
          const opacity = 1 - (distance / PARTICLE_CONFIG.connectionDistance);
          this.ctx.beginPath();
          this.ctx.moveTo(this.x, this.y);
          this.ctx.lineTo(particles[i].x, particles[i].y);
          this.ctx.strokeStyle = `rgba(73, 177, 245, ${opacity * 0.2})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
  }

  // 粒子系统主类
  class ParticleSystem {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.particles = [];
      this.mouse = {};
      this.animationId = null;

      this.isMobile = this.checkMobile();
      this.init();
    }

    checkMobile() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    init() {
      // 如果是移动端且未启用移动端显示，则退出
      if (this.isMobile && !PARTICLE_CONFIG.enableMobile) {
        console.log('[Particle BG] Mobile device detected, particle background disabled');
        return;
      }

      this.createCanvas();
      this.createParticles();
      this.bindEvents();
      this.animate();
    }

    createCanvas() {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'particle-canvas';
      this.ctx = this.canvas.getContext('2d');

      // 设置画布大小
      this.resizeCanvas();

      // 添加到页面
      document.body.appendChild(this.canvas);
    }

    resizeCanvas() {
      if (!this.canvas) return;

      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;

      // 重新调整粒子位置
      if (this.particles.length > 0) {
        this.particles.forEach(particle => {
          if (particle.x > this.canvas.width) particle.x = Math.random() * this.canvas.width;
          if (particle.y > this.canvas.height) particle.y = Math.random() * this.canvas.height;
        });
      }
    }

    createParticles() {
      this.particles = [];
      const count = this.isMobile ? Math.floor(PARTICLE_CONFIG.particleCount * 0.5) : PARTICLE_CONFIG.particleCount;

      for (let i = 0; i < count; i++) {
        this.particles.push(new Particle(this.canvas));
      }
    }

    bindEvents() {
      // 鼠标移动事件
      window.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      });

      // 鼠标离开事件
      window.addEventListener('mouseleave', () => {
        this.mouse.x = null;
        this.mouse.y = null;
      });

      // 窗口大小变化事件
      window.addEventListener('resize', () => {
        this.resizeCanvas();
      });

      // 页面可见性变化事件（节能）
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.stop();
        } else {
          this.animate();
        }
      });
    }

    animate() {
      if (!this.canvas || !this.ctx) return;

      // 清空画布
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // 更新和绘制粒子
      this.particles.forEach(particle => {
        particle.update(this.mouse);
        particle.draw();
      });

      // 绘制连接线
      this.particles.forEach(particle => {
        particle.connect(this.particles);
      });

      // 继续动画
      this.animationId = requestAnimationFrame(() => this.animate());
    }

    stop() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }

    destroy() {
      this.stop();
      if (this.canvas) {
        this.canvas.remove();
      }
      window.removeEventListener('mousemove', this.onMouseMove);
      window.removeEventListener('resize', this.onResize);
    }
  }

  // 页面加载完成后初始化
  function initParticleBackground() {
    // 等待 DOM 就绪
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', createParticleSystem);
    } else {
      createParticleSystem();
    }
  }

  function createParticleSystem() {
    // 防止重复初始化
    if (window.particleSystem) {
      return;
    }

    window.particleSystem = new ParticleSystem();

    // 暴露到全局（用于调试）
    window.debugParticleSystem = {
      stop: () => window.particleSystem.stop(),
      start: () => window.particleSystem.animate(),
      destroy: () => {
        window.particleSystem.destroy();
        window.particleSystem = null;
      }
    };
  }

  // 启动
  initParticleBackground();

})();
