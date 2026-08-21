---
title: Chapter 8 Basic Blocks and Traces
date: '2026-05-18 11:50'
categories:
  - CS课程笔记
  - 编译原理
  - 课程笔记
tags:
  - 编译原理
cover: 'https://www.dotcpp.com/assets/img/%E7%BC%96%E8%AF%91%E5%99%A8.jpeg'
description: >-
  Motivation - IR 必须被翻译成汇编代码或者机器代码 - Tree 语言中的操作符是经过仔细选择的，目的是尽量匹配大多数机器的能力 - 然而 -
  Tree 语言中某些方面并不能和机器语言完全对应 - Tree 语言中的某些方面会干扰编译器优化分析 Mismatches: IR Trees vs
  Machin
published: true
legacyPath: 2026/05/18/compile/Chapter8
sourcePath: compile/Chapter8.md
---

**Motivation**

- `IR`必须被翻译成汇编代码或者机器代码
- `Tree`语言中的操作符是经过仔细选择的，目的是尽量匹配大多数机器的能力
- 然而
  - `Tree`语言中某些方面并不能和机器语言完全对应
  - `Tree`语言中的某些方面会干扰编译器优化分析

**Mismatches: IR Trees vs Machine code**

1. `CJUMP`的问题

- `Tree IR`中的`CJUMP`是可以**跳到两个标签之一**
  - 如果`e`为真，跳转到`t`
  - 如果`e`为假，跳到`f`

```
CJUMP(e,t,f)
```

- 但是实际上机器中的条件跳转通常不是这样饿的，真实机器更常见的是

```asm
evaluate e
JNZ t
if-false code
t:...
```

> 也就是说真是机器的条件跳转通常**只有一个显式跳转目标**

- 如果条件成立，跳转到某个`label`
- 如果条件不成立，直接顺序执行下一条指令

这叫 **fall through**，也就是*自然落到下一条指令*


2. `ESEQ`出现在表达式内部很麻烦

表达式里面出现`ESEQ`节点是很不方便的

`ESEQ(s,e)`的意思是：

**先执行语句`s`，再计算表达式`e`，并返回`e`的值**

问题在于`s`是语句，可能有副作用


<aside class="admonition example">
![ESEQ语句的问题例子](/my-blog/2026/05/18/compile/Chapter8/image-198.png)

- 如果先算`a+5`，再执行`ESEQ(a=5, e2)`，结果是一种情况
- 但如果先执行右边 `ESEQ(a = 5, e2)`，再算左边 `a + 5`，左边的 a 已经被改成 5，结果就可能不同。
</aside>
- 理想情况下，编译器希望表达式的子表达式可以**按照任意顺序计算**，或者至少顺序非常明确
- 但是`ESEQ`把 *语句副作用*嵌套到表达式里面，就会破坏这种简单性


3. `CALL`出现在表达式内部也会有类似的问题

<aside class="admonition example">
```
BINOP(PLUS, CALL(f), CALL(g))
```

如果先调用`f`再调用`g`，结果和反过来调用可能不同，尤其当两个函数都有副作用时
</aside>
编译器通常希望把`CALL`提出来，放到单独语句中，**先保存结果到临时变量，再继续计算**

4. 嵌套`CALL`的参数传递问题

如果一个`CALL`出现在另一个`CALL`的参数表达式中，那么编译器试图**把参数放进固定额的数寄存器**时，会产生问题

<aside class="admonition example">
```
CALL(f, [e1, CALL(g, [e2, ...])])
```

问题是现代机器通常使用**固定的参数寄存器**进行参数传递。

假设`e1`的结果先放到了`r1`，然后为了计算第二个参数，需要调用`g`。但是调用`g`时，它也可能要用`r1`传自己的参数或保存返回值，于是会覆盖原来`e1`放在`r1`中的值

因此嵌套调用需要被改写成更线性的形式

```
t1 := e1
t2 := CALL(g, [e2, ...])
CALL(f, [t1,t2])
```
</aside>
!!! note "总结"
`Tree IR` 规范化前的四个主要问题：

- `CJUMP` 有两个跳转目标，但真实机器通常只有一个显式条件跳转目标，另一个方向靠 `fall through`。
- `ESEQ` 嵌在表达式里不方便，因为它包含有副作用的语句。
- `CALL` 嵌在表达式里也会造成求值顺序和副作用问题。
- `CALL` 嵌套在另一个 `CALL` 的参数中，会影响固定参数寄存器的使用。
</aside>
**解决方案**

- 如何消除这些不匹配的情况？
- 我们可以把`Tree`分成三个阶段进行转换

1. 一棵树可以被重新写成一组`canonical tree`，也就是**规范化树**

    - 这些规范化树中**没有`SEQ`或`ESEQ`节点**
    - 这一步主要消除 **没有
    
<aside class="admonition example">
原来的`BINOP(PLUS, ESEQ(s, e1), e2)`规范化之后应该变成类似

```
s;
BINOP(PLUS, e1, e2)
```

也就是把副作用提前拿出来
</aside>
2. 这组`canonical trees`会被分组成一组`basic blocks`，也就是基本块

   - 基本块内部不包含**跳转或标签**
   - 一个基本块的结构：一段顺序执行的代码，中间不能有`label`，也不能有`jump`，只有最后可以跳转

<aside class="admonition example">
```
LABEL L1
  stm1
  stm2
  stm3
  JUMP L2
```

这就是一个基本块
</aside>
3. 基本块会被重新排列成一组`traces`

    - 在这些`traces`中，每个`CJUMP`后面会紧跟着它的`false label`
    - 这一步主要消除与`CJUMP`有关的不匹配，把`basic blocks`重新排列成`traces`
    - `trace`可以理解成：**按照可能执行的路径把基本块串起来**

## 8.1 Canonical  Trees

**第一阶段**：一棵`Tree`会被重写成一个`canonical trees`的列表

- `Canonical Trees`被定义为具有以下性质 
  - 没有`SEQ`或`ESEQ`节点
  - 每个`CALL`节点的父节点只能是`Exp(...)`或`MOVE(TEMP t, ...)`
    - `Exp(...)`：只需要调用函数，不关心返回值
    - `MOVE(TEMP t, ...)`：如果函数调用有返回值，函数调用结果必须先**保存到临时变量**
- `Property 1`:每棵`canonical tree`最多只包含一个`statement`节点，也就是根节点,其他节点全部都是非`ESEQ`的`expression`节点
- `Property 2`:`CALL`节点的子节点不能是子节点
- `Property 1 and Property 2`
  - `CALL`节点的父节点必须是`canonical tree`的根节点
  - 一棵`canonical tree`中最多只能有一个`CALL`节点，因为`Exp(...)`或`MOVE(TEMP t, ...)`最多只能包含一个`CALL`

为了执行第一阶段转换，我们需要：

1. 消除`ESEQ`

<aside class="admonition example">
```
BINOP(PLUS, ESEQ(s,e1), e2)
```

变成

```
s;
BINOP(PLUS, e1, e2)
```
</aside>
2. 把`CALL`移动到顶层

<aside class="admonition example">
```
BINOP(PLUS, CALL(f), CONST 1)
```

规范化后变成

```
MOVE(TEMP t, CALL(f))
BINOP(PLUS, TEMP t, CONST 1)
```
</aside>
3. 消除`SEQ`

<aside class="admonition example">
```
SEQ(s1, SEQ(s2, s3))
```

变成

```
s1
s2
s3
```
</aside>
### 8.1.1 Transformations on ESEQ

如何消除`ESEQ`节点？

```
ESEQ(s,e)
```

- 消除`ESEQ`的基本思路是：**不断把`ESEQ`往树的上层提升，直到它能变成`SEQ`**

![消除ESEQ的实例](/my-blog/2026/05/18/compile/Chapter8/image-199.png)

> 含义保持不变：先执行`s1`，再执行`s2`，最后计算`e`

#### 1. 当`ESEQ`出现在左操作数时

```
BINOP(op, ESEQ(s, e1), e2)
    =>
ESEQ(s, BINOP(op, e1, e2))
```


```
MEM(ESEQ(s, e1))
    =>
ESEQ(s, MEM(e1))
```

- 先执行`s`再把`e1`当地址进行内存读取

```
JUMP(ESEQ(s, e1))
    =>
SEQ(s, JUMP(e1))
```

- 先执行`s`,再把`e1`当地址进行内存读取

```
CJUMP(op, ESEQ(s, e1), e2, l1, l2)
    =>
SEQ(s, CJUMP(op, e1, e2, l1, l2))
```

- 如果条件跳转的左操作数里有`ESEQ`，那就先执行`s`，再用`e1`和`e2`做比较

![ESEQ在左操作数的转化](/my-blog/2026/05/18/compile/Chapter8/image-200.png)

#### 2. 当`ESEQ`出现在右操作时，不能总是直接提

![ESEQ位于右操作数](/my-blog/2026/05/18/compile/Chapter8/image-201.png)

这种情况是比较麻烦的

```
BINOP(op, e1, ESEQ(s, e2))
```

直觉上我们想变成

```
ESEQ(s, BINOP(op, e1, e2))
```

**但是这是不一定正确的**

原来的计算顺序通常应该是

```
先计算 e1
再执行 s
再计算 e2
最后做 BINOP
```

如果你直接改成

```
先执行 s
再计算 e1
再计算 e2
```

那`s`就被提前到了`e1`前面，可能改变程序结果


<aside class="admonition example">
```
s = MOVE(MEM(x), y)
e1 = MEM(x)
```

- `e1`会读取`x`指向的内存
- `s`会修改`x`指向的内存

这种操作就会导致执行的结果完全不同了，所以这类情况不能随便交换顺序
</aside>
- 我们的解决方案是：**把`e1`保存到临时变量**

我们将`BINOP(op, e1, ESEQ(s, e2))`改成

```
ESEQ(
  MOVE(TEMP t, e1),
  ESEQ(
    s,
    BINOP(op, TEMP t, e2)
  )
)
```

这样就保留了原来的求值顺序：`e1->s->e2`

对于条件跳转也类似:`CJUMP(op, e1, ESEQ(s, e2), l1, l2)`不能直接变成`SEQ(s, CJUMP(op, e1, e2, l1, l2))`，而是要变成

```
SEQ(
  MOVE(TEMP t, e1),
  SEQ(
    s,
    CJUMP(op, TEMP t, e2, l1, l2)
  )
)
```

#### 3. 什么时候可以直接提s

![commute可优化的情况](/my-blog/2026/05/18/compile/Chapter8/image-202.png)

这里之所以可以直接写成：

```
BINOP(op, e1, ESEQ(s, e2))
    =>
ESEQ(s, BINOP(op, e1, e2))
```

这里的关键条件是：`s`和`e1`是`commute`的

> `commute`也就是`s 和 e1 commute`和`先计算 e1 再执行 s`结果没有区别

如果`s`改动的临时变量和内存位置不会被`e1`引用，并且`s`和`e1`不会同时进行外部`I/O`，那么它们可以认为是`commute`

![commute行为](/my-blog/2026/05/18/compile/Chapter8/image-203.png)

<aside class="admonition question">
怎么知道一个语句`s`是否能和一个表达式`e`交换顺序
</aside>
我们在编译时并不总是能确定这一点，例如

```
s = MOVE(MEM(x), y)
e = MEM(z)
```

问题是`x`是否等于`z`(地址)，编译器可能是运行时才确定的地址

- 因此我们**保守地近似判断** (`conservatively approximate`) 语句是否可以交换：`commute(s,e)=True`
- 如果`s`和`e`确定可以交换：`commute(s,e)=False`

否则就认为不能交换

`commute`函数会非常朴素地估计一个语句能否和一个表达式交换

- 一个常量可以和任何语句交换
- 一个空语句可以和任何表达式交换
  - `EXP(CONST X)`
- 其他情况下不能交换

```cpp
// 判断一个语句是不是空操作
static bool isNop(T_stm x) {
    return x->kind == T_EXP && x -> u.EXP->kind == T_CONST;
}
// 判断语句x和表达式y交换顺序
static bool commute(T_stmt x, T_exp y) {
    return isNop(x) || y->kind == T_NAME || y->kind == T_CONST;
}
```

```
x是statement，也就是可能有副作用的语句s
y是expression，也就是要被求值的表达式e
```

判断语句`x`能不能和表达式`y`交换顺序，返回`true`的情况只有三种

- `x`是空语句
- `T_NAME`通常表示一个标签地址，例如`NAME L1`
  - 它只是一个符号地址，没有副作用，也不会受到普通语句影响，所以可以交换
- `y`是`T_CONST`(常量)，常量表达式不会被任何语句改变，所以可以和任何语句交换

<aside class="admonition example">
```
MOVE(TEMP x, CONST 10)
CONST 5
```

不管先执行哪个，`CONST 5`都是5
</aside>
**核心规则总结**

| 原形式                                        | 安全转换                                                  |
| --------------------------------------------- | --------------------------------------------------------- |
| `ESEQ(s1, ESEQ(s2, e))`                       | `ESEQ(SEQ(s1, s2), e)`                                    |
| `BINOP(op, ESEQ(s, e1), e2)`                  | `ESEQ(s, BINOP(op, e1, e2))`                              |
| `MEM(ESEQ(s, e1))`                            | `ESEQ(s, MEM(e1))`                                        |
| `JUMP(ESEQ(s, e1))`                           | `SEQ(s, JUMP(e1))`                                        |
| `CJUMP(op, ESEQ(s, e1), e2, l1, l2)`          | `SEQ(s, CJUMP(op, e1, e2, l1, l2))`                       |
| `BINOP(op, e1, ESEQ(s, e2))` 且 `s,e1` 可交换 | `ESEQ(s, BINOP(op, e1, e2))`                              |
| `BINOP(op, e1, ESEQ(s, e2))` 且不可交换       | `ESEQ(MOVE(TEMP t,e1), ESEQ(s, BINOP(op,TEMP t,e2)))`     |
| `CJUMP(op, e1, ESEQ(s,e2),l1,l2)` 且不可交换  | `SEQ(MOVE(TEMP t,e1), SEQ(s, CJUMP(op,TEMP t,e2,l1,l2)))` |

### 8.1.2 General Rewriting Rules

- 对于每一种`Tree statement`或`expression`，都可以制定类似的规则，把其中的`ESEQ`从`statement`或`expression`里面提取出来
- 给定一个`Tiger`程序，也就是一个`T_stm`，我们可以递归地执行这种转换，把所有`ESEQ`越提越高，直到它们可以变成`SEQ`节点

实际上，**任何Tree节点，只要它的子表达式里面有ESEQ，都可以类似处理**

所有编译器会递归地做

```
先处理子表达式
把子表达式中的ESEQ提出来
再重建当前节点
```

一直重复，直到整棵树里面不再有嵌套的ESEQ

- 一般来说，对于每一种`Tree statement/expression`，我们都可以识别出它的子表达式

例如

```
[e1. e2, ESEQ(s, e3)]
```

- `Rewrite`的作用是：从这些子表达式中提取出`statement`，并更新这个`statement/expression`的子表达式
  - 情况一：s可以和前面的`e1,e2`交换
  - 情况二：`e2`不可以和`s`交换
  - 情况三：`e2`可以和`s`交换，但是`e1`不可以

![Rewrite的三种情况](/my-blog/2026/05/18/compile/Chapter8/image-204.png)

**算法**

- `step 1`:为每一种`Tree statement`或`expression`制作一个子表达式(`subexpression-extraction`)提取方法
  - 从子表达式中提取出其中的`statement`，并把每个子表达式转换成`ESEQ-clean version`，也就是没有`ESEQ`的干净版本

<aside class="admonition example">
一个`Tree`节点通常有若干子表达式

例如`BINOP(op, e1, e2)`，它的子表达式是`[e1,e2,e3]`；`CALL(f,[e1,e2,e3])`的子表达式是`[e1,e2,e3]`

如果其中某个子表达式是`ESEQ(s,e)`，那么说明这个表达式里面藏着一个`statement s`

那么这时我们要做的事情就是

- 把`s`抽出来，把原来的`ESEQ(s,e)`替换成干净的`e`

比如:`[e1,e2,ESEQ(s,e3)]`，经过提取后变成

- 提取出的`statement:s`
- 清理后的表达式列表`[e1,e2,e3]`
- 如果`s`不能和前面的`e1/e2`交换，就还要先**把前面的表达式保存到临时变量**中
</aside>
- `step 2`:用干净子表达式**重新构造原节点**

<aside class="admonition example">
```
BINOP(op,e1,ESEQ(s,e2))
```

清理后重新构造为：

```
BINOP(op, e1, e2)
```

然后再和抽出来的`s`组合


```
ESEQ(s, BINOP(op, e1, e2))
```

如果原来是`statement`，比如

```
MOVE(dst, src)
```

那么清理子表达式后，也要重新构造一个新的

```
MOVE(clean_dst, clean_src)
```

然后用`SEQ`和提取出来的`statement`连接
</aside>
<aside class="admonition question">
为什么有时候用`SEQ`，有时候用`ESEQ`
</aside>
因为要看最终结果是`statement`还是`expression`

- 如果最终节点是`statement`，就用`SEQ(s, new_statement)`
  - 先执行提取出的`s`
  - 再执行新的`statement`

<aside class="admonition example">
```
JUMP(ESEQ(s,e))
```

会变成

```
SEQ(s, JUMP(e))
```
</aside>
- 如果最终节点是`expression`，就用`ESEQ(s, new_expression)`
  - 先执行提取出的`s`
  - 再计算出新的`expression`，并返回它的值

<aside class="admonition example">
```
BINOP(op, ESEQ(s, e1), e2)
```

会变成

```
ESEQ(s, BINOP(op, e1, e2))
```
</aside>
**核心流程**

```
处理一个 Tree 节点 node：

1. 找出 node 的所有子表达式。
2. 对每个子表达式递归消除 ESEQ。
3. 如果子表达式中提取出了 statement，就把这些 statement 收集起来。
4. 用清理后的子表达式重新构造 node。
5. 如果 node 是 statement：
       用 SEQ(statement, new_node) 连接。
   如果 node 是 expression：
       用 ESEQ(statement, new_node) 连接。
```

### 8.1.3 Move CALLs to Top Level

- `Tree`语言允许`CALL`节点作为子表达式使用

也就是说，`Tree IR`里可以出现这种形式：`BINOP(PLUS,CALL(...),CALL(...))`

- 调用一个函数，得到一个返回值
- 再调用一个函数，得到另一个返回值
- 最后把两个返回值相加 

然而，每个函数都会把自己的返回值放到**同一个专门的返回值寄存器**中：

```
TEMP(RV)
```

> 这里`RV`可以理解成`return value register`，也就是返回值寄存器

<aside class="admonition example">
```
BINOP(PLUS, CALL(...), CALL(...))
```

第二个`CALL`会在`PLUS`执行之前覆盖`RV`寄存器
</aside>
**idea**:立即把*每个返回值赋给一个新的临时寄存器*

**转换规则**：

```
CALL(f,args)
```

变成

```
ESEQ(
  MOVE(TEMP t, CALL(f, args)),
  TEMP t
)
```

### 8.1.4 A Linear List of Statements

- 当整个函数体`s0`按照重写规则处理之后，结果是一棵新的树`s0'`，其中所有的`SEQ`节点都靠近树的顶部

<aside class="admonition example">
```
SEQ(SEQ(SEQ(..., sx),sy),sz)
```

也就是很多`SEQ`嵌套在一起
</aside>
- 我们反复应用下面的规则：

```
SEQ(SEQ(a, b), c) = SEQ(a, SEQ(b, c))
```

意思是：把左嵌套的`SEQ`改成右嵌套的`SEQ`

- `s0'`会被线性化成下面这种形式的语句：

```
SEQ(s1, SEQ(s2, ..., SEQ(sn-1, sn)...))
```

![转化后的结构](/my-blog/2026/05/18/compile/Chapter8/image-205.png)

这样我们就可以把它看成一个简单的语句列表：`s1,s2...sn`，并且每个`si`都不包含`SEQ`或`ESEQ`节点

## 8.2 Taming Conditional Branches

### 8.2.1 Basic Blocks

#### 1. Motivation

- 在判断程序中的跳转应该挑到哪里时，我们其实是在分析程序的`control flow`
- `control flow`指的是**程序中指令的执行顺序**
  - 不考虑寄存器和内存中的具体数据值
  - 不考虑具体的算数计算
- 我们无法提前知道条件跳转到底会跳转到`true`标签还是`false`标签，所以我们简单地认为这种跳转**可能走任意一个方向**
- 在分析程序控制流时，任何不是跳转的指令，其行为都没有特别值得关注的地方
- 因此，我们可以把一串连续的、没有分支的指令合并成一个`basic block`，然后只分析**基本块之间的控制流关系**

#### 2. Definition

- 一个`basic block`是一串语句序列，它总是：*从开头进入，从结尾退出*，也就是说
  - 第一条语句必须是一个`LABEL`
  - 最后一条语句必须是一个`JUMP`或`CJUMP`
  - 中间不能再出现其他`LABEL`,`JUMP`,`CJUMP`

**基本块的形式**：

```
LABEL XX
... # no LABELS,JUMPs,CJUMPs
JUMP/CJUMP
```

#### 3. Algorithm

- 把一串语句划分成`basic blocks`的算法如下
  - 从头到尾扫描整个语句序列
  - 每当遇到一个`LABEL`，就开始一个新的`block`，前一个`block`结束
  - 每当遇到一个`JUMP`或`CJUMP`，当前`block`结束，并且下一个`block`开始
  - 如果某个`block`最后没有以`JUMP`或`CJUMP`结尾，那么就在这个`block`后面追加一个跳转到下一个`block`标签的`JUMP`
  - 如果某个`block`开头没有`LABEL`，就新建一个`label`，并把它放在这个`block`的开头


<aside class="admonition example">
```
(1)  x := input
(2)  y := x - 1
(3)  z := x * y
(4)  if z < x goto (7)
(5)  p := x / y
(6)  q := p + y
(7)  a := q
(8)  b := x + a
(9)  c := a - b
(10) if p == q goto (12)
(11) goto (3)
(12) return
```

**算法**：

- 从头到尾扫描语句序列
- 每当遇到一个`LABEL`，就开始一个新的基本块，前一个基本块结束
- 每当遇到一个`JUMP`或`CJUMP`，当前基本块结束，下一个基本块开始
- 添加必要的`LABEL`和`JUMP`

**分块**

- 新`block`从`(3),(7),(12)`开始
- `block`在`(4),(10),(12)`结束

> 这个三地址代码例子里面暂时省略了补`LABEL`和`JUMP`，但是如果是`Tree IR`，应该补上

![如何将程序划分为basic block](/my-blog/2026/05/18/compile/Chapter8/image-206.png)
![更完整的basic block](/my-blog/2026/05/18/compile/Chapter8/image-207.png)
</aside>
### 8.2.2 Traces

> 执行轨迹

#### 1. Motivation

基本块可以按照任意顺序，**程序执行结果仍然相同**，因为每一个基本块的最后我们规定了跳转的准确位置

基于这一点，我们可以选择一种基本块排列顺序，使得每个`CJUMP`后面紧跟它的`false label`

```
CJUMP(op, a, b, t, f)
label(f)
```

我们还可以让许多无条件`JUMP`后面紧跟着它们的 **目标标签**，这样就可以**删除这些`jump`**，使编译后的程序运行得稍微快一点


<aside class="admonition example">
例如：

```
...
JUMP(NAME next)
LABEL(next)
```

可以优化成

```
...
LABEL(next)
```

因为`JUMP`的目标正好就是下一条语句，所以这个`JUMP`没有必要存在
</aside>
#### 2. Definition

- 一个`trace`是一串语句序列，它们在程序执行过程中可能被连续执行，并且可以包含条件分支
- 一个程序有许多不同的、相互重叠的`traces`
- 对于我们现在排列`CJUMP`和`false-label`的目的来说，我们希望构造一组`traces`，能够**刚好覆盖整个程序**
  - 每个`basic block`必须恰好出现在一个`trace`中
  - 每个`trace`不能包含循环
- 我们希望覆盖整个程序所需的`trace`数量越少越好
  - 这样可以减少从一个`trace`跳到另一个`trace`所需要的`JUMP`数量

<aside class="admonition example">
前面`basic block`已经把程序切成了一块一块的代码：`B1,B2,B3,B4...`

每个`basic block`内部是顺序执行的，只有最后一条可能跳转

现在`trace`的目标是：**把可能连续执行的**`basic blocks`串起来

比如控制流是：

```
B1->B2->B3
```

那我们就可以把它们放在同一个`trace`里
</aside>
这样生成代码的时候，`B1`执行完可以自然进入`B2`再进入到`B3`，中间很多`JUMP`就可以省掉

#### 3. Algorithm

如何找到一组覆盖整个程序的`traces`？

- **idea**:从某个`basic block`开始，这个`block`是一条`trace`的开头，然后沿着一条可能的执行路径继续往下走，后面的`block`就构成这条`trace`的剩余部分 
  - 如果遇见条件跳转，我们要把`false`的分支加入到前一个`trace`中

<aside class="admonition example">
![构建trace的例子](/my-blog/2026/05/18/compile/Chapter8/image-208.png)

如图，像b1,b4,b6就可以构成一个`trace`

同时这里有`CJUMP(cond, b7, b3)`的条件跳转，我们会选择**把`b3`加到当前`trace`中**，并在`b3`后继续寻找后续`trace`
</aside>
```
while Q is not empty:
  开始一条新的空trace T
  从0中取出头部元素b
  
  while b 没有做标记:
    标记b
    把b追加到当前trace T的末尾
    检查b的successors，也就是b会跳向的那些block

    如果存在某个没有标记的successors c:
      b ← c

  当前trace T结束
```

**整个过程看起来很像是DFS**

- 从某个`block`开始，沿着一串`jump`往下走，标记每个`block`，并把它加入当前`trace`
- 当走到一个`block`，它的**所有`successors`都已经被标记**时每当前`trace`结束。然后选择一个还诶呦标记的`block`，开始下一条`trace`


#### 4. Finishing up

为了简化后续阶段的实现，`Tiger`编译器会把已经排好序的`trace`列表重新展开成一长串语句，燃弧进行一些小的调整

- 如果某个`CJUMP`后面紧跟着它的`false label`，那么保持不变
- 如果某个`CJUMP`后面紧跟着它的`true label`，那么交换`true label`和`false label`，并且把条件取反

<aside class="admonition example">
```
CJUMP(LT, a, b, Ltrue, Lfalse)
LABEL(Ltrue)
```

可以改成

```
CJUMP(GE, a, b, Lfalse, Ltrue)
LABEL(Ltrue)
```

**`a<b`为真等价于`a>=b`为假**
</aside>
- 如果某个`CJUMP(cond, a, b, lt, lf)`后面既不是`true label`也不是`false label`，那么
  - 新造一个`false label`，记作`lf`
  - 把一个`CJUMP`改写成三条语句
  ![改写的形式](/my-blog/2026/05/18/compile/Chapter8/image-209.png)


#### 5. Optimal Traces

- 任何**经常执行的指令序列**，比如循环体，都应该占据它自己的`trace`

这样做有两个好处

1. 有助于 **最小化无条件跳转的数量**
2. 有助于其他优化，例如
  - 寄存器分配
  - 指令调度

![不同的结构比较](/my-blog/2026/05/18/compile/Chapter8/image-210.png)

为了保证有最少的`jump`应该尽量让`loop`自己占据`trace`

!!! note "总结"
- 问题：中间表示树（IR trees）与机器指令之间存在不匹配
  - 条件跳转指令（CJUMP）与机器条件跳转指令的差异
  - 序列求值节点（ESEQ）和函数调用节点（CALL）的子树求值顺序会影响结果
  - 函数调用（CALL）作为另一个函数调用的参数时，存在求值顺序与副作用问题
- 解决方法：分三个阶段对树进行转换
  - 将原始树重写为一组规范树（canonical trees），去除所有序列节点（SEQ）和序列求值节点（ESEQ）
  - 消除与 ESEQ 和 CALL 相关的不匹配问题
  - 将这组规范树分组为若干基本块（basic blocks），基本块内部不包含跳转或标签
  - 将基本块整理为若干迹（traces），在迹中，每一条条件跳转指令（CJUMP）后都紧跟其 “假分支” 的标签
    - 消除与 CJUMP 相关的不匹配问
</aside>
**Rules for Canonical Tree Construction**

| 原始 Tree 形式                       | 转换后形式                                                     | 作用说明                                                                                                                     |
| ------------------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `ESEQ(s1, ESEQ(s2, e))`              | `ESEQ(SEQ(s1, s2), e)`                                         | 合并嵌套的 `ESEQ`，把两个语句 `s1` 和 `s2` 顺序执行后，再计算表达式 `e`。                                                    |
| `BINOP(op, ESEQ(s, e1), e2)`         | `ESEQ(s, BINOP(op, e1, e2))`                                   | 如果 `ESEQ` 出现在 `BINOP` 左操作数中，把语句 `s` 提到外面。                                                                 |
| `MEM(ESEQ(s, e1))`                   | `ESEQ(s, MEM(e1))`                                             | 如果 `ESEQ` 出现在 `MEM` 的地址表达式中，先执行 `s`，再访问 `MEM(e1)`。                                                      |
| `JUMP(ESEQ(s, e1))`                  | `SEQ(s, JUMP(e1))`                                             | 如果 `ESEQ` 出现在 `JUMP` 目标中，先执行 `s`，再跳转到 `e1`。                                                                |
| `CJUMP(op, ESEQ(s, e1), e2, l1, l2)` | `SEQ(s, CJUMP(op, e1, e2, l1, l2))`                            | 如果 `ESEQ` 出现在 `CJUMP` 的左比较表达式中，先执行 `s`，再做条件跳转。                                                      |
| `BINOP(op, e1, ESEQ(s, e2))`         | `ESEQ(MOVE(TEMP t, e1), ESEQ(s, BINOP(op, TEMP t, e2)))`       | 如果 `ESEQ` 出现在 `BINOP` 右操作数中，为了保持求值顺序，先把 `e1` 保存到临时变量 `t`，再执行 `s`，最后计算 `TEMP t op e2`。 |
| `CJUMP(op, e1, ESEQ(s, e2), l1, l2)` | `SEQ(MOVE(TEMP t, e1), SEQ(s, CJUMP(op, TEMP t, e2, l1, l2)))` | 如果 `ESEQ` 出现在 `CJUMP` 的右比较表达式中，先保存 `e1`，再执行 `s`，最后用保存的 `TEMP t` 和 `e2` 比较。                   |
| `MOVE(ESEQ(s, e1), e2)`              | `SEQ(s, MOVE(e1, e2))`                                         | 如果 `ESEQ` 出现在赋值目标位置，先执行 `s`，再把 `e2` 存入 `e1`。                                                            |
| `CALL(f, a)`                         | `ESEQ(MOVE(TEMP t, CALL(f, a)), TEMP t)`                       | 把 `CALL` 从复杂表达式中提升出来：先调用函数并把返回值保存到临时变量 `t`，再用 `TEMP t` 表示调用结果。                       |
