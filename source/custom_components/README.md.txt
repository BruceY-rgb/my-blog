# 自定义组件目录 (Custom Components)

## 📁 目录结构

此目录用于存放所有自定义组件，严格遵循**注入原则**，不修改主题源码。

```
source/custom_components/
├── README.md              # 说明文档
├── components.config.yml   # 组件配置文件
├── weather/                # 天气组件
│   ├── weather.css
│   └── weather.js
├── clock/                  # 时钟组件
│   ├── clock.css
│   └── clock.js
├── todo/                   # 待办事项组件
│   ├── todo.css
│   └── todo.js
└── analytics/               # 数据分析组件
    ├── analytics.css
    └── analytics.js
```

## 🚀 使用方法

### 1. 创建新组件

```bash
# 在 custom_components/ 下创建新目录
mkdir source/custom_components/your_component
```

### 2. 组件文件结构

每个组件必须包含：
- `your_component.css` - 样式文件
- `your_component.js` - 脚本文件
- (可选) `README.md` - 组件说明文档

### 3. 注册组件

编辑 `components.config.yml` 文件，注册您的组件：

```yaml
components:
  weather:
    enable: true
    css: /custom_components/weather/weather.css
    js: /custom_components/weather/weather.js
    priority: 1  # 加载优先级，数字越大越先加载

  clock:
    enable: false  # 可通过此选项快速禁用组件
    css: /custom_components/clock/clock.css
    js: /custom_components/clock/clock.js
    priority: 2
```

### 4. 在主题配置中引入

编辑根目录的 `_config.butterfly.yml`，在 `inject` 部分添加：

```yaml
inject:
  head:
    # 根据 components.config.yml 中启用的组件自动注入 CSS
    - <link rel="stylesheet" href="/custom_components/weather/weather.css">
  bottom:
    # 根据 components.config.yml 中启用的组件自动注入 JS
    - <script src="/custom_components/weather/weather.js"></script>
```

## ⚡ 快速启用/禁用组件

编辑 `components.config.yml` 文件，将对应组件的 `enable` 字段设置为 `true` 或 `false`。

## 🔧 开发原则

1. **绝对不修改** `node_modules/hexo-theme-butterfly/` 目录下的任何文件
2. 所有样式和脚本都通过 `inject` 配置项注入
3. 组件之间应保持独立，避免依赖冲突
4. 使用 CSS 变量和 BEM 命名规范，避免样式污染
5. 为每个组件编写清晰的文档说明

## 📝 组件开发规范

### CSS 规范
- 使用 BEM 命名：`component-name__element--modifier`
- 所有样式前缀：`cc-` (custom component)
- 使用 CSS 变量定义主题色彩
- 遵循移动优先的响应式设计

### JavaScript 规范
- 使用立即执行函数表达式 (IIFE) 避免全局污染
- 组件初始化函数：`init[ComponentName]()`
- 使用事件监听而非内联事件
- 遵循 ES6+ 语法

### 示例代码结构

```css
/* weather.css */
.cc-weather {
  /* 组件根元素 */
}

.cc-weather__title {
  /* 组件元素 */
}

.cc-weather--dark {
  /* 组件修饰器 */
}
```

```javascript
// weather.js
(function() {
  'use strict';

  function initWeather() {
    // 组件初始化逻辑
    console.log('Weather component initialized');
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWeather);
  } else {
    initWeather();
  }

})();
```

## 🆘 故障排除

### 组件不显示
1. 检查 `components.config.yml` 中的 `enable` 是否为 `true`
2. 检查 `_config.butterfly.yml` 中的 `inject` 配置是否正确
3. 检查浏览器控制台是否有 JavaScript 错误
4. 检查 CSS 文件路径是否正确

### 样式冲突
1. 使用更具体的选择器
2. 检查 BEM 命名是否规范
3. 使用 `!important` 作为最后手段

### JavaScript 错误
1. 检查语法错误
2. 确保 DOM 元素存在
3. 检查事件监听器是否正确绑定

## 📚 已有组件列表

- [ ] 天气组件 (weather) - 显示实时天气信息
- [ ] 时钟组件 (clock) - 显示实时时间
- [ ] 待办事项 (todo) - 管理个人任务
- [ ] 数据分析 (analytics) - 访问统计和图表