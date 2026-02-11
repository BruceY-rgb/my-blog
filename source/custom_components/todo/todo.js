/*!
 * 待办事项组件脚本
 * Todo Component JavaScript
 * 版本: v1.0
 */

(function() {
  'use strict';

  // 待办事项数据管理
  class TodoManager {
    constructor() {
      this.todos = [];
      this.storageKey = 'cc_todos';
      this.init();
    }

    init() {
      this.loadTodos();
      this.createTodoElement();
      this.bindEvents();
      this.render();
    }

    loadTodos() {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          this.todos = JSON.parse(stored);
        }
      } catch (error) {
        console.error('[Todo Component] Failed to load todos:', error);
        this.todos = [];
      }
    }

    saveTodos() {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.todos));
      } catch (error) {
        console.error('[Todo Component] Failed to save todos:', error);
      }
    }

    createTodoElement() {
      const container = document.querySelector('.cc-todo');
      if (!container) {
        console.warn('[Todo Component] 容器元素未找到');
        return;
      }

      container.innerHTML = `
        <div class="cc-todo__header">
          <h3 class="cc-todo__title">
            <span>📝</span>
            <span>待办事项</span>
          </h3>
          <button class="cc-todo__add-btn" onclick="todoManager.showInput()">
            <span>➕</span>
            <span>添加</span>
          </button>
        </div>
        <div class="cc-todo__input-container" style="display: none;">
          <input type="text" class="cc-todo__input" placeholder="输入待办事项..." maxlength="100">
        </div>
        <ul class="cc-todo__list"></ul>
        <div class="cc-todo__stats">
          <span class="cc-todo__count">总计: <span class="cc-todo__total">0</span></span>
          <span class="cc-todo__count">已完成: <span class="cc-todo__completed">0</span></span>
        </div>
      `;
    }

    showInput() {
      const inputContainer = document.querySelector('.cc-todo__input-container');
      const input = document.querySelector('.cc-todo__input');
      if (inputContainer && input) {
        inputContainer.style.display = 'block';
        input.focus();
      }
    }

    hideInput() {
      const inputContainer = document.querySelector('.cc-todo__input-container');
      if (inputContainer) {
        inputContainer.style.display = 'none';
      }
    }

    addTodo(text) {
      const trimmedText = text.trim();
      if (!trimmedText) return;

      const todo = {
        id: Date.now(),
        text: trimmedText,
        completed: false,
        createdAt: new Date().toISOString()
      };

      this.todos.unshift(todo);
      this.saveTodos();
      this.render();
      this.hideInput();
    }

    toggleTodo(id) {
      const todo = this.todos.find(t => t.id === id);
      if (todo) {
        todo.completed = !todo.completed;
        this.saveTodos();
        this.render();
      }
    }

    deleteTodo(id) {
      this.todos = this.todos.filter(t => t.id !== id);
      this.saveTodos();
      this.render();
    }

    render() {
      const list = document.querySelector('.cc-todo__list');
      const totalEl = document.querySelector('.cc-todo__total');
      const completedEl = document.querySelector('.cc-todo__completed');

      if (!list) return;

      if (this.todos.length === 0) {
        list.innerHTML = `
          <li style="text-align: center; padding: 20px; color: var(--text-color-muted, #999); font-size: 14px;">
            暂无待办事项，添加一个吧！✨
          </li>
        `;
      } else {
        list.innerHTML = this.todos.map(todo => `
          <li class="cc-todo__item ${todo.completed ? 'completed' : ''}">
            <input type="checkbox" class="cc-todo__checkbox" ${todo.completed ? 'checked' : ''}
                   onchange="todoManager.toggleTodo(${todo.id})">
            <span class="cc-todo__text">${this.escapeHtml(todo.text)}</span>
            <button class="cc-todo__delete" onclick="todoManager.deleteTodo(${todo.id})" title="删除">
              🗑️
            </button>
          </li>
        `).join('');
      }

      // 更新统计
      if (totalEl) totalEl.textContent = this.todos.length;
      if (completedEl) completedEl.textContent = this.todos.filter(t => t.completed).length;
    }

    bindEvents() {
      const input = document.querySelector('.cc-todo__input');
      if (input) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            this.addTodo(input.value);
          } else if (e.key === 'Escape') {
            this.hideInput();
            input.value = '';
          }
        });

        input.addEventListener('blur', () => {
          setTimeout(() => {
            if (!input.matches(':focus')) {
              this.hideInput();
            }
          }, 100);
        });
      }
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  // 页面加载完成后初始化
  function initTodoComponent() {
    window.todoManager = new TodoManager();
    console.log('[Todo Component] Todo component initialized');
  }

  // DOM 就绪后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTodoComponent);
  } else {
    initTodoComponent();
  }

})();
