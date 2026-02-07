# 🚀 GitHub 关联指南

## ✅ 已完成的配置

您的博客已经配置好了 Git 仓库：

```
✅ Git 仓库已初始化
✅ 用户信息已配置：
   - 用户名: BruceY-rgb
   - 邮箱: 1038794832@qq.com
✅ .gitignore 已创建（忽略 node_modules、public 等）
✅ 初始提交已创建（35 个文件，14,846 行代码）
✅ 远程仓库已添加: https://github.com/BruceY-rgb/my-blog.git
```

## 📋 下一步操作

### 1. 在 GitHub 上创建仓库

1. **访问 GitHub**: https://github.com
2. **登录您的账户** (BruceY-rgb)
3. **点击 "New Repository"**
4. **填写仓库信息**:
   - **Repository name**: `my-blog` 或您喜欢的名称
   - **Description**: `🌃 Cyberpunk Style Blog with Hexo + Butterfly`
   - **Public** ✅ (必须公开才能使用 GitHub Pages 免费版)
   - **不要** 勾选 "Add a README file"
   - **不要** 勾选 "Add .gitignore"
   - **不要** 选择 license
5. **点击 "Create repository"**

### 2. 推送代码到 GitHub

创建仓库后，运行以下命令：

```bash
git push -u origin main
```

### 3. 启用 GitHub Pages

1. **进入仓库设置**:
   - 点击您的仓库名称
   - 点击 "Settings" 标签

2. **找到 Pages 设置**:
   - 在左侧菜单中找到 "Pages"

3. **配置部署源**:
   - **Source**: 选择 "GitHub Actions"

4. **创建 Actions 工作流**:
   在仓库根目录创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy Hexo site to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          ref: main

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Setup Hexo
        run: |
          npm install -g hexo-cli
          npm install

      - name: Deploy
        run: |
          hexo clean
          hexo generate
        env:
          NODE_ENV: production

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

### 4. 等待部署完成

1. **进入 Actions 页面**:
   - 点击仓库顶部的 "Actions" 标签

2. **查看工作流状态**:
   - 点击最新的工作流运行
   - 等待 "deploy" 作业完成（通常 2-3 分钟）

3. **获取访问地址**:
   - 工作流完成后，访问: `https://BruceY-rgb.github.io/my-blog`
   - （替换为您的实际用户名和仓库名）

## 🎨 自定义域名（可选）

如果您有自定义域名：

1. **在 GitHub 仓库设置**:
   - 进入 Settings → Pages
   - 在 "Custom domain" 中输入您的域名
   - 点击 "Save"

2. **配置 DNS**:
   - 添加 CNAME 记录指向 `BruceY-rgb.github.io`

3. **启用 HTTPS**:
   - 在 GitHub Pages 设置中勾选 "Enforce HTTPS"

## 📝 日常使用

### 写新文章
```bash
hexo new post "文章标题"
# 编辑 source/_posts/文章标题.md
```

### 本地预览
```bash
hexo server
# 访问 http://localhost:4000
```

### 部署更新
```bash
git add .
git commit -m "✨ Update: 您的更新说明"
git push origin main
# GitHub Actions 自动部署
```

## 🎯 仓库结构

```
BruceY-rgb/my-blog/
├── .github/workflows/deploy.yml  # GitHub Actions 工作流
├── source/
│   ├── custom_components/        # 自定义组件
│   │   ├── global_cyberpunk_style/  # 赛博朋克风格
│   │   ├── weather/             # 天气组件
│   │   └── clock/               # 时钟组件
│   └── _posts/                  # 文章目录
├── _config.yml                  # Hexo 配置
├── _config.butterfly.yml        # Butterfly 主题配置
└── package.json                 # 项目依赖
```

## 🔗 有用的链接

- **您的 GitHub**: https://github.com/BruceY-rgb
- **GitHub Pages 文档**: https://docs.github.com/en/pages
- **Hexo 文档**: https://hexo.io/docs/
- **Butterfly 主题**: https://butterfly.js.org/

## ❓ 常见问题

### Q: 推送时提示认证失败？
**A**: 需要配置 GitHub 认证，推荐使用 Personal Access Token:
1. GitHub → Settings → Developer settings → Personal access tokens
2. 生成新 token，勾选 `repo` 权限
3. 使用 token 替代密码

### Q: Pages 访问 404？
**A**:
- 检查 Actions 是否成功运行
- 确认分支是 `main`（不是 `master`）
- 等待 5-10 分钟 DNS 传播

### Q: 如何更新主题？
**A**:
```bash
npm update hexo-theme-butterfly
git add .
git commit -m "🎨 Update theme"
git push
```

## 🎉 完成检查清单

- [ ] 在 GitHub 创建仓库
- [ ] 运行 `git push -u origin main`
- [ ] 创建 GitHub Actions 工作流
- [ ] 等待部署完成
- [ ] 访问 https://BruceY-rgb.github.io/my-blog
- [ ] 验证赛博朋克风格显示正常

---

**完成以上步骤后，您的赛博朋克风格博客就成功部署到 GitHub Pages 了！** 🌟