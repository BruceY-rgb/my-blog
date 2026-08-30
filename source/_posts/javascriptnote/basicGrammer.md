---
title: JavaScript基础语法
date: 2026-08-30 11:00
categories:
    - JavaScript基础入门
tags:
    - JavaScript
cover: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSxKSDQ00eU7fPVuCLmLucTkI2m4WNiwCR1GQGwJAQNdObeM8g8h-36dFE&s=10
---

在开始之前，我们先提及一个经常看到的词：**ES6**。`JavaScript`的正式名称叫`ECMAScript`，ES6 就是它在 2015 年发布的第 6 个大版本。这个版本加了很多好用的新语法，比如 let/const、箭头函数、class、模板字符串等等。现在这些语法已经是标准写法了，所有主流浏览器和 Node.js 都支持。后面教程中提到「ES6 引入的」，你知道它就是指这次更新就行。

## 1. 输出

`JavaScript`最常用的输出方式是`console.log()`，它会在控制台打印内容，并**自动换行**

```js
// 打印一个字符串
console.log("Hello, world!");

// 打印数字
console.log(42);

// 打印多个值，用逗号分隔，输出时用空格隔开
console.log("姓名:", "Alice", "年龄", 25);

// 也可以用模板字符串（反引号 + ${}）
let name = "Bob";
let age = 30;
console.log(`${name} 今年 ${age} 岁`);
```

`console.log()`每次调用都会 **自动换行**。如果不想换行，可以用`process.stdout.write()`

> 该方法只能输出字符串，数字要先转成字符串

```js
// process.stdout.write 不会自动换行
// 注意：它只能输出字符串，数字要先转成字符串
process.stdout.write("A");
process.stdout.write("B");
process.stdout.write("C");
// 输出：ABC（都在同一行）
console.log(); // 手动换一行

// 数字要转成字符串才能用 write
process.stdout.write(String(100));
console.log();
```

## 2. 输入处理

在算法题中，经常需要从标准输入读取数据。`JavaScript`用`readline`模块来逐行读取输入，这是最常用的方式：

```js
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin
});

let lines = []
rl.on("line", (line) => {
    lines.push(line);
});

rl.on("close", () => {
    // 输入结束后，lines数组里存着每一行的内容
    let name = lines[0]
    let age = lines[1];
    console.log("姓名：" + name);
    console.log("年龄：" + age);
});
```

1. `readline.createInterface()`：创建一个读取器，绑定到标准输入`process.stdin`
2. `rl.on("line", ...)`每读到一行就把它存进`lines`数组
3. `rl.on("close", ...)`输入全部读完之后，在这个回调函数里处理数据

> 这可以看做一个模板，核心思路就是 **先把所有输入收集起来，等输入结束之后再统一处理**