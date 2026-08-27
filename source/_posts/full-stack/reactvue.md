---
title: React/Vue框架到底是什么
date: 2026-08-26 17:00
categories:
    - 全栈开发
    - 前端基础
tags:
    - 全栈
    - 前端
cover: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmz_1azD7YGPwhw4jSG-BtDPr91VrAb6QEtS9XeivmOihN5sYH22_KMwc&s=10
---

`HTML/CSS/JavaScript`是前端的基础，用它们可以搭出任何页面，但是一旦页面复杂，原生写法有很明显的痛点

## 1. 原生写法的痛点

### 1.1 痛点一：手动同步DOM太复杂

之前我们例子中的计数器，每一次数据变化都需要手动调用`document.getElementById`来更新页面

```js
let count = 0;

function increment() {
    count++;
    // 每次数据变了都要手动找到元素、手动更新
    document.getElementById('count').textCount = count;
}
```

计数器只有一个数字要更新手动同步还是可以接受的，但是如果一个待办事项列表呢？添加一项要往DOM里面插入一个节点，删除一项要移除节点，修改一项要定位到对应节点再更新内容，标记完成要修改样式。每个操作都得手动操作DOM，一旦忘记更新一个地方，页面就和数据不一样了

### 1.2 痛点二：代码无法复用

假设页面需要两个计数器，用原生的`HTML`只能把整段`HTML + CSS + JS`复制粘贴一遍，还要小心地把每个元素换成不同的`id`避免冲突。如果后面要改一个按钮样式，每个副本都要修改

```html

<div id="count-1">0</div>
<button onclick="increment1()">增加</button>


<div id="count-2">0</div>
<button onclick="increment2()">增加</button>
```

!!! note "框架解决了什么"
`React`、`Vue`这些框架同时解决了这两个问题：**数据变了页面自动更新，而且可以把UI封装成可复用的组件**

写一个`<Counter />`组件，就可以像调用函数一样在页面中多次使用，每个实例互相不会干扰
!!!

## 2. React

`React`是由`FaceBook`开发的前段框架。它的核心理念是 **组件化和声明式编程**：只需要描述 **数据是什么状态时，UI应该长成什么样**，`React`自动会将数据变化同步到页面上

!!! example "计数器"
文件结构：

```
|-public-
         |-index.html
|-App.jsx
|-Counter.jsx
|-index.js
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>React Counter</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

```jsx
// App.jsx
import Counter from './Counter';

export default function App() {
    return (
        <div>
            <Counter title="计数器 A" />
            <Counter title="计数器 B" />
        </div>
    );

// Counter.jsx
import { useState } from 'react';

export default function Counter(props) {
    const [count, setCount] = useState(0);

    return (
        <div style={{ textAlign: 'center', padding: 20, fontFamily: 'sans-serif' }}>
            <h2>{props.title}</h2>
            <p style={{ fontSize: 48, margin: '10px 0' }}>{count}</p>
            <button onClick={() => setCount(count + 1)}
                style={{ fontSize: 16, padding: '8px 16px', margin: 4, cursor: 'pointer', background: '#4CAF50', color: 'white', border: 'none', borderRadius: 4 }}>
                增加
            </button>
            <button onClick={() => setCount(count - 1)}
                style={{ fontSize: 16, padding: '8px 16px', margin: 4, cursor: 'pointer', background: '#2196F3', color: 'white', border: 'none', borderRadius: 4 }}>
                减少
            </button>
        </div>
    );
}
```

```js
// index.js
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
```
!!!

### 2.1 JSX:在JS里面写HTML

`.jsx`文件中的代码内容看起来很像`html`，但是它本身是一个`JavaScript`文件

这就是`jsx`语法，`React`用它使得我们可以在`JavaScript`代码里面直接写类似`HTML`的标签。比如`Counter.jsx`里面的`return{...}`部分，看起来就是`HTML`

例如下面是`Counter`里面的`JSX`(省略了样式部分)

```jsx
function Counter(props) {
    const [count, setCount] = useState(0);
    return{
        <div style={{ textAlign: 'center' }}>
            <h2>{props.title}</h2>
            <p style = {{ font-size: 48 }}>{count}</p>
            <button onClick={() => setCount(count + 1)}>增加</button>
        </div>
    };
}
```

这段代码渲染之后的`HTML`即为

```html
<div style="text-align: center;">
    <h2>计数器 A</h2>
    <p style="font-size: 48px;">0</p>
    <button>增加</button>
</div>
```

> 可以看到`JSX`和`HTML`几乎完全一样，区别就在于`{}`里面能嵌套`JavaScript`变量(渲染时换成实际的值)、`onClick`能绑定用户交互逻辑

下面逐个看这些语法：

- `{...}`是`JSX`的插值语法，花括号里面可以放任何JavaScript表达式或者变量，`React`会把计算结果渲染到页面上。比如`Counter.jsx`代码中的`{count}`就是把`count`变量的值渲染到页面上，`{props.title}`就是把`props`对象的`title`属性渲染出来
- 组件中的样式写成`style={{ color: 'red' }}`嵌套两层花括号是什么意思？
  - 外层的花括号是插值语法
  - 内层花括号是一个**JavaScript的对象**，定义若干`key-value`对，最后被渲染成`CSS`样式
- `() => setCount(count + 1)`是JavaScript的一个箭头函数，等价于`function() { setCount(count + 1) }`，意思是每次点击按钮时执行这个含糊，给`count + 1`

> 也就是说，一个`React`组件可以同时包含`HTML`、`CSS`和`JavaScript`交互逻辑


### 2.2 文件结构

- `public/index.html`是最终的`HTML`页面。几乎是空的，只有一个`<div id="root">`。页面上那些按钮和数字是来自于下面几个文件
- `index.js`:是整个应用的入口，可以理解成写程序时的`main`函数。它做的事情很简单：导入`App`组件，然后把它渲染到`index.html`里面那个空的`<div id="root">`中
  - 所有的页面内容，都是通过这一步 **挂载**到`html`文件去
- `App.jsx`是整个页面的骨架。一个正常的网页包含 *导航栏、侧边栏、主体内容、页脚*这些区域，`App`组件就负责**把这些区域的子组件组合在一起**，至于每个子组件内部的细节，不在这个文件中展开
  - 上述例子中页面里就出现两个计数器，所以`App.jsx`导入了`Counter`组件，放了两个`<Counter />`标签就完事了
  - 当然这是一种常见模式而不是硬性规定，我们完全可以在`index.js`中放两个`<Counter />`组件，效果是一样的
- `Counter.jsx`是我们写的计数器组件封装了计数器的全部逻辑和样式。这个组件是可以 **复用**的，`App.jsx`里面用了两次，页面上就出现了两个独立的计数器，各自维护自己的状态，互不干扰

这个调用链是这样的：

1. `index.html`提供了一个空的`HTML`容器
2. `index.js`把`App`组件挂载进去
3. `App.jsx`组合各个子组件
4. `Counter.jsx`实现具体功能

其中`index.html`和`index.js`是固定的样板代码，每个项目长得都差不多，不用理解细节，直到它们的作用即可

后面我们写代码主要就是在写各种(`.jsx`文件)，入口文件和`HTML`基本不用动

### 2.3 UseState:状态管理

`const [count, setCount] = useState(0)`是`React`最核心的`API`之一

`useState(0)`返回一个包含两个元素的数组

- `const [count, setCount]`是`JS`的解构赋值把它们分别赋给两个变量
  - `count`是当前值
  - `setCount`是修改函数

!!! question
给`count`加1，直接写`count++`不行吗？

在`React`里面不行，`count++`只是改变变量的值，`React`不知道我们是否更改了
!!!

在前端的世界里，必须对页面重新渲染，才能让用户看到页面内容的改变。如果不重新渲染，页面内容就不会改变

因为这个`count`变量是要显示到页面的，所以必须通过`setCount(count+1)`来修改。因为`setCount`除了更新值，还会**通知`React`重新渲染这个组件**，`React`才会把新的值渲染到页面上给用户

可以理解为`setCount`就是`React`的 **触发器**：我们调用它，`React`就知道数据变了，自动更新发生变化的`DOM`节点。不需要亲子写`document.getElementById`这样的JavaScript代码来操作DOM

### 2.4 组件和Props

`Counter`就是一个组件，本质上是一个返回`JSX`函数，`React`把传给组件的参数叫做`Props`,它是一个普通的`JavaScript`对象，包含了外部传入的所有属性

比如`Counter`组件的函数签名是`function Counter(props)`，在`App.jsx`里面写`<Counter title="计数器 A" />`，`React`就会把`{title: "计数器 A"}`作为`props`传进来，组件内部用`props.title`就能拿到这个值

我们可以把`Props`理解成函数的参数：把会变的数据作为参数传进去，组件就能根据不同的参数渲染出不同的内容。`App.jsx`里面传入不同的`title`，就得到了两个标题不同、互不干扰的计数器，各自维护自己的`count`状态

如果用原生`HTML`，我们要复制粘贴整段代码，还得手动给每个元素换`id`。组件化的好处很直接：写一次，可以多次复用

> 接下来我们简单说一说`Vue`。它的本质和`React`是类似的：数据变化的时候，自动帮我们渲染页面，从而简化开发流程。只是`Vue`和`React`有些差别而已


## 3. Vue

`Vue`是另一个主流的前端框架，模板语法更接近原生`HTML`，上手更直观

同样的计数器代码实现

`public/index.html`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Vue Counter</title>
</head>
<body>
  <div id="app"></div>
</body>
</html>
```

`src/App.vue`

```vue
<template>
  <div>
    <Counter title="计数器 A" />
    <Counter title="计数器 B" />
  </div>
</template>

<script setup>
import Counter from './Counter.vue';
</script>
```

`app/main.vue`

```vue
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

`app/Counter.vue`

```vue
<template>
  <div class="counter">
    <h2>{{ title }}</h2>
    <p class="count">{{ count }}</p>
    <button class="btn green" @click="increment">增加</button>
    <button class="btn blue" @click="decrement">减少</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps(['title']);
const count = ref(0);

function increment() {
    count.value++;
}

function decrement() {
    count.value--;
}
</script>

<style scoped>
.counter { text-align: center; padding: 20px; font-family: sans-serif; }
.count { font-size: 48px; margin: 10px 0; }
.btn { font-size: 16px; padding: 8px 16px; margin: 4px; cursor: pointer; color: white; border: none; border-radius: 4px; }
.green { background: #4CAF50; }
.blue { background: #2196F3; }
</style>
```

Vue 项目的文件结构和 React 类似，调用链也是一样的：index.html 提供空容器 → src/main.js 把 App 挂载进去 → App.vue 组合子组件 → Counter.vue 实现具体功能。

区别主要是：Vue 的源码文件都放在 src/ 目录下，组件用 .vue 扩展名而不是 .jsx，入口文件是 src/main.js 而不是 index.js。写法和 React 不同，但做的事情一样。

重点看 .vue 文件。Vue 的单文件组件结构非常清晰，一个文件里分三段。

`<template>` 是 HTML 模板：

`{{ count }}` 是 Vue 的插值语法，和 React 的 {count} 作用一样，自动显示变量的值。

`@click="increment"` 是 Vue 的事件绑定语法，作用类似原生 HTML 的 onclick，点击时调用 increment 函数。

`<script setup>` 是 JavaScript 逻辑：

`const count = ref(0)` 声明一个响应式变量，和 `React` 类似，直接写 `let count = 0; count++` 的话 Vue 无法感知变化重新渲染页面。

用 `ref()` 包装一层，然后修改 `count.value`，Vue 就能自动把变化同步到模板中所有用到 `{{ count }}` 的地方，将最新的数据渲染到页面。所以 `increment` 函数里写的是 `count.value++`。

`defineProps(['title'])` 声明这个组件接受一个 `title` 参数。

`<style scoped>` 部分是 CSS 样式，加上 scoped 后，这段样式只作用于当前组件，不会影响页面其他部分。

最后看 App.vue：import Counter 后直接用 `<Counter title="..." />`，组件复用和 React 一样简单。

## 4. 浏览器只认识`HTML/CSS/JS`


最后再强调一点：浏览器不认识`React`，也不认识`Vue`

不管是`React`的`JSX`还是`Vue`的`.vue`文件，浏览器都不能直接运行。它们需要通过 **构建工具**(如`Vite`,`Webpack`)编译成原生的`HTML + CSS + JavaScript`文件，浏览器才能运行

我们在项目里面运行`npm run build`，构建工具做的事情就是：把我们写的`Jsx/Vue`模板或者`TypeScript`全部编译成浏览器能直接运行的`.html/.css/.js`文件，输出到一个`/dist`目录里面。部署上线时，服务器只需要提供这个`dist`目录里面的文件就可以了

开发阶段执行`npm run dev`,构建工具会启动一个本地开发服务器，实时编译我们的代码，修改文件后浏览器自动热更新(无需手动刷新页面)

!!! note
`npm`是前端的包管理工具

- `package.json`记录依赖
- `npm install`安装依赖
- `npm run dev`启动开发服务器

所有框架代码最终都要通过构建工具编译成原生的`HTML/CSS/JS`，浏览器才能运行
!!!