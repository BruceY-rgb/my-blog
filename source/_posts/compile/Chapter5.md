---
title: Chapter 5 Semantic Analysis
date: 2026-04-21 17:20
categories:
    - CS课程笔记
    - 编译原理
    - 课程笔记
tags:
    - 编译原理
cover: https://www.dotcpp.com/assets/img/%E7%BC%96%E8%AF%91%E5%99%A8.jpeg
---

**上下文无关文法CFG的局限性**

- 考虑下面这个文法
  - 程序由 **声明+语句**组成
  - 声明里面可以写
    - `string x`
    - `int z`
  - 语句内部可以赋值
    - `id = exp`
  - 表达式里面可以写
    - `exp + exp`
    - `id`
    - `num`

```
S→Decl Stmt
Decl→Type id ;∣Decl ; Decl
Type→string∣int
Stmt→Stmt ; Stmt∣id=Exp∣…
Exp→Exp+Exp∣id∣num∣…
```

从纯语法角度来看下面这个程序

```

```