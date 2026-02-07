# 🌃 赛博朋克 DeFi 平台风格

## 🎨 设计理念

这是一套专为 Hexo + Butterfly 主题设计的**赛博朋克 DeFi 平台风格**样式系统，采用深色背景和高饱和霓虹色彩，营造出科技感十足的视觉体验。

## ✨ 核心特性

### 🎯 视觉设计
- **深色背景**: 采用 #0a0a0a 和 #1a1a2e 作为主色调
- **霓虹色彩**: 高饱和度的青色 (#00f0ff)、洋红 (#ff0099)、琥珀色 (#ffcc00)
- **科幻字体**: Orbitron、Rajdhani、Exo 2 等未来感字体
- **玻璃拟态**: 半透明卡片配合模糊效果
- **动态背景**: 扫描线和网格动画

### 🎭 视觉效果
- **霓虹发光**: 文字、边框、按钮的发光效果
- **悬停动画**: 元素悬停时的平滑过渡和发光
- **扫描线**: 页面滚动时的扫描线效果
- **边框动画**: 悬停时的旋转发光边框
- **故障效果**: 可选的故障风格动画

### 🖱️ 交互体验
- **平滑过渡**: 所有元素都有流畅的动画过渡
- **响应式设计**: 完美适配桌面和移动设备
- **深色模式**: 优化深色模式显示
- **无障碍支持**: 支持减少动画偏好设置

## 📁 文件结构

```
global_cyberpunk_style/
├── _variables.scss      # SCSS 变量定义文件
├── global.scss         # SCSS 源文件（开发用）
├── global.css          # 编译后的 CSS 文件（生产用）
└── README.md           # 说明文档（本文件）
```

## 🚀 使用方法

### 1. 自动注入

在 `_config.butterfly.yml` 中已自动配置：

```yaml
inject:
  head:
    # 赛博朋克风格全局样式（必须最先加载，覆盖主题默认样式）
    - <link rel="stylesheet" href="/custom_components/global_cyberpunk_style/global.css">
```

### 2. 重新构建

```bash
hexo clean && hexo generate
```

## 🎨 样式系统

### 颜色变量

```scss
// 主色调
$cyber-cyan: #00f0ff;      // 青色
$cyber-magenta: #ff0099;   // 洋红
$cyber-amber: #ffcc00;      // 琥珀色
$cyber-purple: #9d00ff;    // 紫色
$cyber-lime: #39ff14;      // 荧光绿

// 背景色
$bg-primary: #0a0a0a;       // 主背景
$bg-secondary: #1a1a2e;     // 次要背景
$bg-tertiary: #16213e;       // 三级背景
$bg-card: rgba(22, 33, 62, 0.6);  // 卡片背景
```

### 字体系统

```scss
// 标题字体（科幻感）
$font-title: 'Orbitron', 'Rajdhani', 'Exo 2', monospace;

// 正文字体（高可读性）
$font-body: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;

// 等宽字体（代码）
$font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

### 阴影系统

```scss
// 发光效果
$glow-cyan: 0 0 10px rgba(0, 240, 255, 0.5),
             0 0 20px rgba(0, 240, 255, 0.3),
             0 0 30px rgba(0, 240, 255, 0.1);

// 卡片阴影
$shadow-card: 0 4px 24px rgba(0, 240, 255, 0.1),
              0 2px 8px rgba(0, 0, 0, 0.4);
```

## 🎯 覆盖的组件

### 1. 基础元素
- 全局重置和排版
- 标题系统 (h1-h6)
- 段落和链接
- 代码块和内联代码

### 2. 交互元素
- 按钮系统（主要、次要、成功）
- 表单元素（输入框、文本域、选择框）
- 工具提示

### 3. 布局组件
- 卡片系统
- 导航栏
- 侧边栏
- 页脚

### 4. 内容组件
- 文章内容
- 文章头部和元数据
- 图片和媒体
- 表格
- 引用块

### 5. 代码高亮
- 代码块样式
- 语法高亮容器

### 6. 滚动和选择
- 自定义滚动条
- 文本选择样式

## 🎪 特殊效果

### 霓虹发光

```html
<h1 class="cyber-title">标题文字</h1>
```

### 脉冲动画

```html
<button class="cyber-pulse">脉冲按钮</button>
```

### 故障效果

```html
<span class="cyber-glitch" data-text="故障文字">故障文字</span>
```

### 闪烁动画

```html
<div class="cyber-flicker">闪烁文字</div>
```

## 🔧 自定义配置

### 修改主题色彩

编辑 `_variables.scss` 文件：

```scss
// 修改主色调
$cyber-cyan: #00ff00;      // 改为绿色
$cyber-magenta: #ff00ff;   // 改为品红
```

### 调整发光强度

```scss
// 增强发光效果
h1 {
  text-shadow: 0 0 20px rgba(0, 240, 255, 1),
               0 0 40px rgba(0, 240, 255, 0.8),
               0 0 60px rgba(0, 240, 255, 0.6);
}
```

### 禁用动画

```scss
// 全局禁用动画
* {
  animation: none !important;
  transition: none !important;
}
```

## 📱 响应式断点

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## ♿ 无障碍支持

### 减少动画
当用户系统设置为"减少动画"时，会自动禁用所有动画：

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 高对比度
支持高对比度模式：

```css
@media (prefers-contrast: high) {
  :root {
    --border-primary: rgba(0, 240, 255, 0.8);
  }
}
```

## 🎬 动画库

### 脉冲动画 (cyber-pulse)
持续的发光效果，适用于按钮和重要元素。

### 闪烁动画 (cyber-flicker)
模拟故障或错误状态。

### 故障效果 (cyber-glitch)
文字故障动画，需要配合 `data-text` 属性使用。

### 旋转发光 (cyber-rotate-glow)
边框发光旋转动画，用于卡片悬停。

## 📦 性能优化

### 硬件加速
重要元素启用 GPU 加速：

```css
.card {
  will-change: transform;
  backface-visibility: hidden;
}
```

### 减少重绘
优化动画性能：

```css
button, .btn, a {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
```

## 🔄 更新日志

### v1.0.0 (2026-02-07)
- ✅ 初始版本发布
- ✅ 完整的赛博朋克风格样式
- ✅ 响应式设计
- ✅ 无障碍支持
- ✅ 性能优化

## 📞 支持与反馈

如果您在使用过程中遇到问题或有任何建议，请：

1. 查看 `TROUBLESHOOTING.md` 文档
2. 检查浏览器控制台错误
3. 确认所有文件正确加载

## 🎓 开发指南

### SCSS 开发

如果您需要修改样式，建议使用 SCSS 文件：

1. 安装 Sass 编译器：
```bash
npm install -g sass
```

2. 编译 SCSS：
```bash
sass _variables.scss global.scss
```

3. 复制编译结果到 global.css

### 添加新组件

1. 在 `_variables.scss` 中定义变量
2. 在 `global.scss` 中编写样式
3. 编译为 CSS
4. 更新文档

## 📄 许可证

本项目遵循 MIT 许可证。

---

**享受您的赛博朋克风格博客！** 🌟