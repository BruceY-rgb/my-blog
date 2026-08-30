---
title: 前端开发的常用工具
date: 2026-08-28 10:00
categories:
    - 全栈开发
    - 前端基础
tags:
    - 全栈
    - 前端
cover: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmz_1azD7YGPwhw4jSG-BtDPr91VrAb6QEtS9XeivmOihN5sYH22_KMwc&s=10
---

之前我们提到过，实现了组件，我们是靠着`npm run dev`将整个项目运行起来的，靠`npm run build`打包上线的，中间还提到了构建工具`Vite`

但是这些命令到底在干什么？`package.json`的作用是什么？为什么前端项目会存在`node_modules`文件夹

以之前我们实现的计数器项目为例

首先我们需要确保我们的主机已经安装好了`Node.js`(`npm`会随`Node.js`一起安装)，进入解压之后的目录一次运行

```shell
npm install # 安装依赖
npm run dev # 启动开发服务器
```

执行完`npm run dev`,终端会打印出一个本地访问地址

```
  VITE v6.4.3  ready in 391 ms

  ➜  Local:   http://localhost:5173/
```

浏览器打开`http://localhost:5173/`就能看到和网页里一模一样的计数器，这个项目就能在本地跑起来

再使用另一种常用命令`npm run build`:

```shell
$ npm run build
vite v6.4.3 building for production...
✓ 29 modules transformed.
dist/index.html                  0.21 kB │ gzip:  0.18 kB
dist/assets/index-Dweo0F-0.js  195.22 kB │ gzip: 61.15 kB
✓ built in 326ms
```

跑完之后项目目录里面多了一个`dist`文件夹，里面就是编译打包好的静态文件`(HTML+JS+CSS)文件`

这两条命令对应**开发**和**上线**两个阶段：

- `npm run dev`是开发时用的。它在本地启动一个服务器，**不产出任何编译文件**，代码**实时编译、实时预览**
  - 最方便的一点是 **热更新**：我们改了代码——保存，浏览器页面会自动刷新，不用重启服务器，所以开发阶段基本就是**开着`dev`服务器，边看边改效果**
- `npm run build`是要上线时用的。它把源代码一次性编译、打包、压缩，产出最终的静态文件
  - 我们看`dist`里面其实就是一个`HTML`加一个`JS`，这就是用户浏览器实际加载的东西。把这些文件放到服务器上，用户浏览器会自动加载这些文件，就能看到网页内容了

项目目录里面大概是这些文件：

```
counter/
├── index.html          # 页面入口
├── index.jsx           # 应用入口
├── App.jsx             # 根组件
├── Counter.jsx         # 计数器组件（我们写的）
├── package.json        # 项目清单
├── package-lock.json   # 依赖版本锁定
├── vite.config.js      # 构建工具配置
├── node_modules/       # 装完依赖才会出现
└── dist/               # 打包后才会出现
```

这几个`jsx`文件是计数器组件的核心代码，`index.html`是页面入口

## 1. package.json:项目的说明书

```json
{
  "name": "counter",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0"
  }
}
```

它是整个项目的项目清单，记录了项目叫什么名字、依赖了哪些第三方库、有哪些可以执行的命令

- `name`:是项目的名
- `private: true`:表示这是个**私有项目**，防止手滑把它发布到`npm`公共仓库中

### 1.1 dependencies 和 devDependencies

任何一个编程语言都有自己的依赖管理系统。比如`Java`项目有`pom.xml`，`Python`项目有`requirements.txt`，`Go`有`go.mod`等等。对于前端项目，就用`package.json`来记录**第三方依赖库**

`dependencies`和`devDependencies`都是在列项目依赖的第三方库，区别在于 **什么时候用得上**

- `dependencies`是项目**运行时真正需要的库**.我们的代码中`import`了`react`库，所以`react`和`react-dom`放在这里，在我们这个纯前端项目里，它们最终会被打包进发给用户的页面
- `devDependencies`是只在 **开发和打包阶段用到的库**，项目真正跑在用户浏览器上时并不需要它们
  - 这里的`vite`和`vitejs/plugin-react`库的功能是`npm run build`阶段负责编译打包代码的，用户浏览器不需要这些库，所以把他们放在`devDependencies`中

> 打个形象的比方：最终的构建产物`dist`就好比提供给用户的一栋房子，`dependencies`是房子里要长期要用的东西，`devDependencies`是盖房子时搭的脚手架，房子盖完脚手架就拆了

### 1.2 版本号的规则

一个版本号由三段数字组成，`major.minor.patch`，也就是 **主版本.次版本.修订号**，比如`19.2.7`

- 主版本(`19`):有破坏性的不兼容改动时才会增加
- 次版本(`2`):加了新功能，但向后兼容
- 修订号(`7`):只是修了`bug`，向后兼容

版本号前面的符号，决定了`npm`允许自动升级到了什么范围：

- `^19.0.0`:允许升次版本，但是不跨主版本。也就是`19.x.x`都可以，但是不会升到`20`
- `~19.0.0`:更保守，只允许升修订号。
- `19.0.0`:写死只允许这一个版本

默认用得最多的是`^`，我们`npm install`一个包，`npm`默认就会帮我们加上`^`。这样既能自动获得`bug`修复和兼容的新功能，又不会偷偷升级到可能有破坏性改动的大版本

## 2. npm install与node_modules

`package.json`只是列出了依赖清单，光有清单不够，还得把这些库下载下来，这就是`npm install`干的事

`npm`是`Node.js`自带的包管理工具，作用类似`Java`的`Maven`、`Python`的`pip`。在项目目录下执行：`npm install`

`npm`会读`package.json`里面的`dependencies`和`devDependencies`，去`npm`仓库把这些库下载下来，放进项目根目录的`ndoe_modules`文件夹

跑完后会看到这样的输出

```
added 64 packages in 25s
```

我们的`package.json`里面明明只写了4个依赖没怎么装了64个包？

因为我们依赖的库自己也依赖别的库。比如`vite`内部用到了一堆工具，这些 **依赖的依赖**会被一并装上，一层套一层，最后累计出几十个包。

**这就是为什么`node_modules`通常非常大**。我们这个只有一个计数器的小项目，`node_modules`就已经有42MB

```shell
$ du -sh node_modules
42M	node_modules
```

真实项目里`node_modules`几百MB、上千个包都很常见

因为它很大，而且能**随时重新装出来**，所以`node_modules`**不需要也不应该提交到`Git`**。前端项目的`.gitignore`里几乎一定有`node_modules`这一行

> 别人拿到代码，只要有`package.json`，自己跑一遍`npm install`就能还原出一样的`node_modules`

### 2.1 lock文件：锁死确切版本

但是这里有个隐患。前面说`^19.0.0`允许装任意`19.x.x`版本，那今天我们装下来是`19.2.7`，下一次别人拿到代码安装，`react`可能已经发布了`19.3.0`，它装下来就成了`19.3.0`

两个人装的版本不一样，万一新版本某个细节行为变了，就会出现 **在我的电脑上是可以的，在别人的电脑有bug**这种最让人头疼的问题

`lock`文件就是来解决这个的。如果我们第一次`npm install`时,npm会在根目录生成一个`package-lock.json`,把这次实际装下来的每一个包(包括那几十个传递依赖)的**确切版本号**都记录下来

我们可能会想，那我们把版本号写死就可以了。但是装的这几十个包，它们的内部又各自依赖别的包，那些版本我们是看不到的，照样会浮动。与其一个一个写死，不如用`lock`文件把整棵依赖树一次锁住

打开看看，能看到我们在`package.json`里面写的是`^19.0.0`,这次实际锁定的是`19.2.7`:

···json
"node_modules/react": {
  "version": "19.2.7",
  "resolved": "https://registry.npmjs.org/react/-/react-19.2.7.tgz",
  "integrity": "sha512-HNe9WslTbXmFK8o8cmwgAeJFSBvt1bPdHCVKt..."
}
···

有了这个文件，之后任何人再使用`npm install`，`npm`会优先按照`lock`文件里记的版本装，保证所有人装出来的依赖完全一致

所以和`node_modules`相反，`package-lock.json`必须 **提交到Git**，它是保证团队和线上环境装出同一套依赖的关键。

### 2.2 npm、pnpm、bun

它们三个都是用相同的工具，都是读`package.json`、下载依赖、管理`node_modules`，可以相互替代，区别主要在 **速度和磁盘占用上**

`npm`是`Node`自带的，最通用，但是它给每个项目都把依赖完整复制一份，电脑上项目一多，同样的包会被重复下载好几次，很占磁盘

`pnpm`解决的就是`npm`的这个问题。它把下载过的包在全局只存一份，各个项目用 **硬链接**指过去，十个项目用到同一个包也只占一份空间。**项目一多，磁盘占用会少很多**

`bun`可以理解成不只是包管理器，而是一套完整的`JS`工具，既能读`package.json`、下载依赖、管理`ndoe_modules`，还能直接替代`Node`跑代码、跑测试、做打包，命令风格和`npm/pnpm`很接近，但是底层完全重新写，最大的标签就是 **快**

## 3. scripts与npm run:给命令起别名

回头再看`package.json`，还剩`scripts`这个字段，还剩一块`scripts`没讲

```json
"scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
}
```

`scripts`字段是给常用命令起的别名，**每一项的`key`是别名，`value`是真正要执行的命令**

我们执行`npm run dev`，`npm`做的事情就是去`scripts`里面找`dev`这个`key`，然后执行它对应的值`vite`。所以`npm run dev`完全等价于直接敲`vite`这个命令

为什么要绕这么一层？因为真实项目里的命令往往又长又带一串参数，比如`vite build --mode production --outDir ../public`,又难记又容易敲错

在`scripts`里起个`build`别名，团队所有人统一敲`npm run build`就行，命令的细节都藏在`package.json`。这和后端开发中用`Makefile`给一长串命令起短名字是一个思路

## 4. vite和webpack

`scripts`里面真正执行的是`vite`。那`vite`到底在干什么？

上一篇`React/Vue`框架结尾说过，浏览器只认识原生的`HTML/CSS/JavaScript`，不认识`React`的`JSX`文件，也不认识`Vue`的`.vue`文件

前面我们用的`npm run dev`和`npm run build`，背后干活的就是`Vite`这类构建工具(也叫打包工具)，它负责把`JSX`编译成浏览器能懂的`JS`,把分散的源码和第三方依赖打包压缩成最终的文件

`build`操作产出的`dist`目录结构是：

```
dist/
├── index.html
└── assets/
    └── index-Dweo0F-0.js
```

我们写的好几个`.jsx`组件文件，加上`react`、`react-dom`这些第三方库，全被**编译打包成了一个`HTML`加上一个`JS`**。浏览器拿到这两个文件就能渲染出完整的页面，这就是构建工具做的事情

那webpack又是什么？它和`vite`一样都是构建工具。`webpack`出现更早，配置能力强，很多老项目和大型项目还在用

现代化前端项目一般都是用`vite`作为构建工具，开发服务器启动和热更新通常更快

!!! note "小结"
每次打开一个前端项目，我们先看`package.json`

- `dependencies`和`devDependencies`告诉我们项目依赖什么，`scripts`告诉我们应该怎么启动和打包。版本号前的`^`和`~`控制允许自动升级的范围
- `npm`(或`pnpm`)会根据这份清单安装依赖到`node_modules`。`node_modules`又大又能重新生成，不进`Git`
- `package-lock.json`负责把每个包的确切版本锁住，保证团队和`CI`装出来完全一致，要提交进`Git`
- `vite`和`webpack`这类构建工具，核心作用是把我们写的`JSX`、组件代码和第三方依赖，变成浏览器能直接运行的`HTML/CSS/JS`

以后`AI`生成一个前端项目，我们可以考虑先看`package.json`：依赖在不在、启动命令叫什么、用的是`vite`还是`webpack`
!!!