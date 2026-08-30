---
title: 组件的生命周期
date: 2026-08-29 10:00
categories:
    - 全栈开发
    - 前端基础
tags:
    - 全栈
    - 前端
cover: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmz_1azD7YGPwhw4jSG-BtDPr91VrAb6QEtS9XeivmOihN5sYH22_KMwc&s=10
---

之前我们写的计数器，从头到尾都写在页面上。但是真实的页面不是这样，一个页面由很多组件组成，有的组件始终要在页面上(如导航栏)，有的组件则需要被关闭(有些弹窗需要人为关掉)

也就是说，组件本身是有存活周期的：它会被创建，也会被销毁。而有些代码对执行时机有要求，比如 **组件出现之后启动一个定时器，组件小时之后把定时器关掉**。如果我们不清楚组件从生到死的过程，，这种代码就写不对，`bug`也很难排查

组件从生到死的过程就是 **声明周期**(`Lifecycle`)。

## 1. 组件的一生：挂载、更新、卸载

`React`组件的一生可以分成三个阶段：

- **挂载**(`Mount`):组件第一次被渲染到页面上，从无到有
- **更新**(`Update`):`state`或者`props`变了，`React`重新渲染这个组件，页面跟着变化
- **卸载**(`Unmount`):组件从页面上被移除，从有到无

**更新**其实是最常见的，比如说我们的计数器每点一次按钮，`setCount`就触发一次重新渲染，这就是一次更新。挂载和卸载的逻辑如下

`App.jsx`

```jsx
import { useState } from 'react';
import Counter from './Counter';

export default function App() {
    // show 控制 Counter 组件是挂载还是卸载
    const [show, setShow] = useState(true);

    return (
        <div style={{ fontFamily: 'sans-serif', padding: 8 }}>
            <button onClick={() => setShow(!show)}>
                {show ? '隐藏计数器' : '显示计数器'}
            </button>
            {show && <Counter />}
        </div>
    );
}
```

核心逻辑就是`{show && <Counter />}`

这是`JSX`中常见的条件渲染写法：`show`为`true`时渲染`<Counter />`，为`false`时什么都不渲染

所以点 **隐藏计数器**，`Counter`组件就被卸载了；再点 **显示计数器**，一个新的`Counter`组件就被挂载出来

> 如果我们点击几次+1之后隐藏计数器，再点击显示的时候计数器会变成0

这是因为，组件卸载时，**它的`state`会被一起销毁**

`count`这个状态是属于`Counter`组件的运行时内存数据，组件从页面上被移除，相关的运行时数据会被清理，`React`就把它的`state`一起丢掉了。之后再挂载出来的是一个全新的`Counter`，`useState(0)`**老老实实从初始值`0`开始**

这个特征就是`React`的规则：**state的寿命和组件一样长，组件卸载了，state的值跟着被清理**

把三个阶段串起来，一个组件的生命周期就是一条时间轴：

```
挂载 ──> 更新 ──> 更新 ──> ... ──> 更新 ──> 卸载
（出现）  （用户交互，state 变化）          （消失）
```

随着用户在页面上交互，`React`会自动推进这条时间轴，我们无法控制什饿时候挂载、更新、卸载组件

但是我们可以往时间轴上 **挂**自己的代码，比如组件挂载时做点什么、卸载之前做点什么、更新时做什么，`useEffect`就是用来解决这个问题的

```jsx
export default function Example() {
    const [time, setTime] = useState(new Date().toLocalTimeString());

    useEffect(() => {
        // 这部分代码在组件挂载时执行一次

        return () => {
            // 这部分代码在组件卸载(销毁)时执行一次
        }
    }, []);

    useEffect(() => {
        // 这部分代码在组件挂载时，以及每次 time 变量发生变化时执行
    }, [time]);

    return <p>{time}</p>
}
```

这个规则看起来很复杂，但是都是固定套路，而且AI会处理的很好，我们只需要了解这些套路，大概看懂代码即可

## 2. useEffect:在合适的时机做正确的事

现在我们实现一个新的组件：一个每秒走字的时钟，显示当前时间

显示时间本身很简单，用`JavaScript`内置对象`new Date().toLocalTimeString()`就能拿到`14:23:05`这样的字符串

关键是每秒走字，`JavaScript`的内置函数`setInterval`可以设置定时器，做到每隔一秒更新一次`state`

