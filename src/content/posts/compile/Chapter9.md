---
title: Chapter 9 Instruction Selection
date: '2026-05-22 11:00'
categories:
  - CS课程笔记
  - 编译原理
  - 课程笔记
tags:
  - 编译原理
cover: 'https://www.dotcpp.com/assets/img/%E7%BC%96%E8%AF%91%E5%99%A8.jpeg'
description: >-
  Chapter 9 的核心任务是把 CHapter 8 得到的 canonical IR Trees 翻译成 abstract assembly code
  ，也就是为 IR Tree 重的表达式和语句选择合适的机器指令。此时生成的汇编仍然使用抽象寄存器或者临时变量，因此叫 pseudo-assembly 或
  abstr
published: true
legacyPath: 2026/05/22/compile/Chapter9
sourcePath: compile/Chapter9.md
---

`Chapter 9`的核心任务是把`CHapter 8`得到的`canonical IR Trees`翻译成`abstract assembly code`，也就是为`IR Tree`重的表达式和语句选择合适的机器指令。此时生成的汇编仍然使用抽象寄存器或者临时变量，因此叫`pseudo-assembly`或`abstract assembly`。真正把这些临时变量映射到真实寄存器，是后续`Register Allocation`的任务

 ## 9.1 Instruction Selection

 ### 9.1.1 Why and What

 - 中间表示语言，也就是Tree IR，每个树节点只表示一个操作
   - `fetch,store,addition,subtraction,conditional jump, ...`
   - `Tree IR`的设计比较原子化，也就是说，每个节点只负责一个简单操作
- 但是，真实机器的一条指令通常可以同时完成多个基本操作

<aside class="admonition example">
![一条机器指令完成多个基本操作的示例](/my-blog/2026/05/22/compile/Chapter9/image-211.png)
</aside>
- 指令选择阶段的任务是 **给指定的中间表示树找到合适的机器指令来实现它**

### 9.1.2 Implementation

使用`pattern matching techniques`来选择机器指令，使这些机器指令能够匹配程序`IR`的某些片段

- 如果`IR`是树形的，那么自然适合在树上做匹配
  - 输入是`tree pattern`，也就是树形模式
  - 例如：动态规划的匹配方法

> 线性结构的适合使用某种字符串匹配方法，这里我们暂时不会讨论 

### 9.1.3 Tree Patterns

- 每一条机器指令都可以表示成`IR Tree`的一个片段，这个片段称为`tree pattern`
- `Instruction`：**用最少数量的`tree pattern`来填满这棵树**
  - `Tiling`:用互不重叠的`tree pattern`覆盖整棵`IR Tree`

<aside class="admonition example">
**细粒度覆盖**

```
TEMP fp
CONST 8
BINOP(PLUS, TEMP fp, CONST 8)
MEM(...)
```

可能生成

```asm
r1 <- fp
r2 <- 8
r3 <- r1 + r2
r4 <- M[r3]
```

这是很低效的

**用大pattern覆盖**

直接用一个pattern：`MEM(BINOP(PLUS, TEMP fp, CONST 8))`

生成

```asm
LOAD r4 <- M[fp*8]
```
</aside>
- 为了说明指令选择，我们使用教材中虚构的`Jouette architecture`

![Jouette架构](/my-blog/2026/05/22/compile/Chapter9/image-212.png)

一些关于`Jouette Architecture`的说明

- 寄存器`r0`总是存储0
- 一些指令和不止一种`tree pattern`相关

### 9.1.4 Tree Pattern Example

- 使用`tree-based IR`做指令选择的基本思想是：**tilling the IR tree**，也就是用指令模板去覆盖`IR Tree`
- 这些`tiles`是合法机器指令对应的一组`tree patterns`

<aside class="admonition example">
下面这棵树就是`a[i]:= x`的`IR Tree`

![a[i]:=x的IR Tree](/my-blog/2026/05/22/compile/Chapter9/image-213.png)
</aside>
这条指令的`IR Tree`可以用两种方式`tiled`

![两种不同的tiled方式](/my-blog/2026/05/22/compile/Chapter9/image-214.png)

- `Tiles 1,3,7`不会和机器指令产生关联，因为它们只是寄存器
- 我们总是可以用很小的`tiles`来覆盖树，每个`tile`只覆盖一个节点
- 对于`a[i]:=x`,这种`tiling`如下

![用小的tile进行覆盖](/my-blog/2026/05/22/compile/Chapter9/image-215.png)

### 9.1.5 Optimal and Optimum Tilings

- 一棵`IR Tree`可以有多种`tiling`方式
- `Best tiling`：成本最低的指令序列
  - 对于**单发射固定延迟**（`single issue fixed-latency`）的机器来说，通常意味着使用最少数量的指令
- `Optimum tiling`:所有`tile`的总代价达到全局最低的`tiling`，也就是全局意义上的 **最好**
- `Optimal tiling`:不存在两个相邻的`tiling`可以被合并成一个更低成本`tile`的`tiling`，也就是局部意义上的 **最好**


如果某个`tree pattern`可以被拆成几个`tile`，而且拆开之后总代价更低，那么就应该把这个`pattern`从`tile catalog`中删除

> 全局最优肯定不会有局部能改进的地方；但是局部不能改进，不代表全局一定最优

!!! example "Optimal and Optimum Tilings"
- 假设每条指令的代价都是`1`，除了`MOVEN`，它的代价是`m`个单位

![Tiling分析](/my-blog/2026/05/22/compile/Chapter9/image-217.png)
</aside>
## 9.2 Algorithms for Instruction Selection

### 9.2.1 Maximal Munch

> 最大匹配算法

**Maximal Munch**:用于得到`optimal tiling`的算法

- 假设：*更大的tile=更好的tile*
- 主要思想：**贪心思想**
  - 采用自顶向下策略
  - 对当前节点，用能够匹配的最大`tile`覆盖它

<aside class="admonition example">
![最大匹配算法的例子](/my-blog/2026/05/22/compile/Chapter9/image-218.png)

- 蓝色框表示当前能匹配的较大`tile`，它覆盖了从`MOVE`开始的一部分树
- 剩下`leaf1`,`leaf2`作为子树继续处理
</aside>
**整体过程**

1. 从树的根节点开始，找到能匹配的最大`tile`
2. 用这个`tile`覆盖根节点，以及根节点附近的若干其他节点，剩下几个子树
3. 对每个剩余子树重复同样的算法

**最大tile**：指包含最多节点的`tile`

![一个tile可以含有多个节点](/my-blog/2026/05/22/compile/Chapter9/image-219.png)

- 指令会以`reverse order`(逆序)生成
- 如果根节点处有两个大小相同的`tile`都能匹配，那么任选一个即可


<aside class="admonition example">
- 采用自顶向下策略
- 用最大的`tile`覆盖当前节点
- 对剩下的子树重复这个过程

`a[i] = x`这个表达式的树可以简化写成：

```
MOVE
├── MEM( MEM(fp+a) + i*4 )
└── MEM(fp+x)
```

- 左边地址：`address(a[i]) = MEM(fp+a) + i*4`
- 右边值：`value(x) = MEM(fp+x)`
- 最终赋值：`M[address(a[i])] = value(x)`
</aside>
#### Implementation

- 两个递归函数
  - `munchStm`:用于处理`statements`
  - `munchExp`:用于处理`expressions`
- `munchExp`的每个分支都会匹配一个`tile`
- 这些分支按照`tile`的优先级排列，也就是 **最大的tile**放在最前面

下面是`muchStm`处理`MOVE`语句的一部分伪代码

```cpp
zstatic void munchStm(T_stm s) {
    switch(s->kind) {
        case T_MOVE: {
            T_exp dst = s->u.MOVE.dst;
            T_exp src = s->u.MOVE.src;

            if (dst->kind == T_MEM) {
                ...
            }
        }
    }
}
```

`...`内部会包含各种`if-else`语句是在匹配不同的`tree pattern`

**匹配MOVE(MEM(BINOP(PLUS, e1, CONST(i))), e2)**

```c
/* MOVE(MEM(BINOP(PLUS, e1, CONST(i))), e2) */
munchExp(e1);
munchExp(e2);
emit("STORE");
```

这匹配的`IR`的形状是

```
MOVE
├── MEM
│   └── BINOP(PLUS)
│       ├── e1
│       └── CONST(i)
└── e2
```

- munchExp(e1) 生成地址基址 r1
- munchExp(e2) 生成要存储的值 r2
- emit("STORE") 输出 store 指令

![Maximal Munch处理MOVE语句中含有MEM的方法](/my-blog/2026/05/22/compile/Chapter9/image-220.png)

### 9.2.2 Dynamical Programming

`Maximal munch`总是能找到一个`optimal tilling`，但是不一定能找到`optimum tilling`

> 主要是因为它是自顶向下工作的

**Dynamic Programming**:可以基于每个子问题的最优解，找到整体的最优解

- 它是 **自底向上**工作的
- 给树中的每个节点分配一个`cost`(代价)
- 节点`x`的代价，记作`f(x)`，表示：*覆盖以`x`为根的子树的最佳tiling的代价*
  - $f(x) = min_{\forall\text{tile t covering x}}(c_t + \Sigma_{\forall\text{leaf i of t}}f(i))$
  - 对于节点x，尝试所有能覆盖它的`tile`，计算每种选择的总代价，然后**取最小值**
  - 每种选择的总代价由两部分组成：**当前tile的代价+剩余子树的最优代价**

#### 1. Detail

给定一棵节点为`n`的`IR Tree`:

- 首先，递归地求出节点`n`的所有孩子节点，孙子节点等的代价
- 然后，把每一种`tree pattern`，也就是每一种`tile`类型，尝试和节点`n`进行匹配
- 每个`tile`由零个或者多个叶子节点，这些`leaf`位置可以继续接上子树
- 对于每一个能够在节点`n`处匹配成功的`tile t`，如果它的代价是$c_t$，那么这个`tile`的总代价是$c_t + \text{这个tile各个leaf子树的最优代价之和}$

> 因为动态规划是自底向上做的，所以`leaf`对应子树的最优代价`f(i)`已经提前算好了

<aside class="admonition example">
- `(a,b)`:
  - `a`表示最小代价
  - `b`表示对应的`pattern`编号

> `(1,8)`:覆盖这个节点的最小代价是`1`,采用的是第`8`号`pattern`

![自底向上处理树](/my-blog/2026/05/22/compile/Chapter9/image-221.png)

考虑`CONST`节点：

- 唯一能匹配`CONST`的`tile`是`ADDI`指令，代价是`1`
- 第`8`号`pattern`没有`leaves`

| Pattern(Tile) | Cost | Leaves Cost | Total |
| ------------- | ---: | ----------: | ----: |
| `(8) CONST`   |    1 |           0 |     1 |

所以我们在每个`CONST`节点旁边标注`(1, 8)`

考虑`+`节点：有好几个`tree pattern`都可以匹配这个`+`节点

| Pattern(Tile)      | Cost | Leaves Cost | Total |
| ------------------ | ---: | ----------: | ----: |
| `(2) +(e1, e2)`    |    1 |           2 |     3 |
| `(6) +(CONST, e1)` |    1 |           1 |     2 |
| `(7) +(e1, CONST)` |    1 |           1 |     2 |

在动态规划算法中我们总是要选择小的`pattern`，所以`+`可以标记为`(2,6)`或`(2, 7)`
</aside>
#### 2. Instruction Emission（指令发射）

- 一旦根节点的`cost`被找到，也就是整棵树的`cost`被找到，`instruction emission`阶段就开始了
- 对于接地啊`n`(`Emission(node n)`):
  - 对于在节点`n`处选中的`tile`的每一个`leaf li`，执行`Emission(li)`
  - 然后发射在节点`n`处匹配到的指令，类似于`reverse order`思想：先处理子树，再发射当前节点对应的指令


![最终生成的指令](/my-blog/2026/05/22/compile/Chapter9/image-222.png)

#### 3. Fast Matching

`Maximal Munch`和动态规划算法都会检查所有能够匹配某个节点的`tiles`

- 优化思想：**根据当前节点的label，也就是节点类型，快速缩小匹配范围**
- 一个`tile`能够匹配，当且仅当：**这个`tile`中每个非叶子节点的标签都和`IR Tree`中对应节点的操作符相同**
  - 例如操作符包括：`MEM, CONST, BINOP 等`

<aside class="admonition example">
`IR Tree`中每个节点都有自己的类型，例如

```
MEM
BINOP
CONST
TEMP
MOVE
CALL
```

这些节点类型就可以看作是`label`

比如这棵树：

```
     MEM
      |
    BINOP
  /   |  \
op   TEMP CONST
```

- 根节点的`label`是`MEM`
- 中间节点的`label`是`BINOP(PLUS)`
- 叶子结点可能是`TEMP,CONST`
</aside>
- 为了在树的节点`n`处匹配`tile`,可以使用节点`n`的标签写一个`case`语句

```cpp
match(n) {
    switch(label(n)) {
        case MEM: ...
        case BINOP: ...
        case CONST: ...
    }
}
```

<aside class="admonition example">
一个`tile`是机器指令对应的`tree pattern

```
MEM
 |
 +
/ \
e CONST
```

它要匹配某棵`IR Tree`的某个位置，就要求 *tile的非叶子节点结构和`IR Tree`对应位置一致*

如果当前`IR Tree`是：

```
MEM
 |
 +
/ \
TEMP CONST
```

那么它就可以匹配上面的`LOAD` tile，因为`tile`根节点是`MEM`，树根也是`MEM`
</aside>
- 目标：保证`IR Tree`中的每个节点都不需要重复查看两次

#### 4. Efficiency of Tiling Algorithms

假设

- `K`:平均每个匹配到的`tile`包含`K`个非叶子结点，也就是带标签的节点
- `N`:输入`IR Tree`中节点的总数
- `K'`:为了判断某个子树处有哪些`tile`能匹配，最多需要检查的节点数
- `T'`：平均每个`tree node`处能匹配到的不同`patterns`,也就是`tile`的数量

`Maximal Munch`的时间开销正比于$(K' + T')N/K$

`Dynamic Programming`的时间开销正比于$(K'+T')N$

如果`K`,`K'`和`T'`都是常数，那么这些算法的运行时间都是线性的

<aside class="admonition example">
假设有这棵`IR Tree`:`MEM(BINOP(PLUS, TEMP fp, CONST 8))`。它表示 *读取内存地址 fp + 8 处的值*对应机器指令可以是：`LOAD r1 <- M[fp + 8]`

```
        MEM
         |
         +
       /   \
    TEMP   CONST
```

- `N = 4`
- `K`:平均一个`tile`覆盖多少个非叶子节点
  - 这里`TEMP`是一个表达式，不算`tile`内部的固定节点，所以这个`tile`覆盖3个非叶子节点
  - `K`是**整棵树的平均情况**
- `K'`：为了判断匹配，最多要看多少个节点
  - 比如要判断当前根节点能否匹配`MEM(+(e, CONST))`，我们需要检查
    - 当前节点是不是`MEM`
    - `MEM`的孩子是不是`+`
    - `+`的右孩子是不是`CONST`
  - 最多要看三个节点
  - 可以认为`K' = 3`
- `T'`：每个节点平均有多少个`pattern`可以尝试。假设当前节点是`MEM`，可能有这些`pattern`
  - `MEM(e)`
  - `MEM(+(e, CONST))`
  - `MEM(+(CONST, e))`
  - `MEM(CONST)`
  - 也就是说一个`MEM`节点附近可能有`4`种`tile`可以尝试
</aside>
## 9.3 CISC Machines

| RISC machine                                           | CISC machine                                                            |
| ------------------------------------------------------ | ----------------------------------------------------------------------- |
| 32 个寄存器                                            | 寄存器较少，例如 16 个、8 个或 6 个                                     |
| 只有一类整数/指针寄存器                                | 寄存器被分成不同类别，有些操作只能在特定寄存器上执行                    |
| 算术操作只能在寄存器之间进行                           | 算术操作可以通过 addressing modes 访问寄存器或内存                      |
| 三地址指令形式：`r1 ← r2 ⊕ r3`                         | 二地址指令形式：`r1 ← r1 ⊕ r2`                                          |
| load 和 store 指令只支持 `M[reg + const]` 这种寻址方式 | 支持多种不同的寻址方式                                                  |
| 每条指令长度固定，都是 32 bits                         | 指令长度可变，由可变长度的 opcode 和可变长度的寻址方式组成              |
| 每条指令通常只产生一个结果或效果                       | 指令可能带有副作用，例如 autoincrement addressing modes（自增寻址模式） |

### 9.3.1 Problems and Solutions of CISC

#### 1. 寄存器少

**解决方案**：把中间代码/抽象汇编阶段可以自由地产生`TEMP`节点，然后*假设后面的寄存器分配器(`register allocator`)会把它们处理好*

> 指令选择阶段先生成逻辑上正确的带阿米，寄存器够不够的问题交给寄存器分配阶段

#### 2. 寄存器分类

在`Pentium`上做惩罚时，左操作数必须放在`eax`中，结果的高位会被放在`edx`中。类似的寄存器规则说明`CISC`在很多情况下受到真实机器规则的限制

但是对于`Tiger`程序来说，高位结果没有用

**解决方法**：显式地移动操作数和结果

<aside class="admonition example">
```asm
mov eax, t2      /* eax ← t2 */
mul t3           /* eax ← eax × t3; edx ← garbage */
mov t1, eax      /* t1 ← eax */
```

- 第一步把`t2`移动到寄存器`eax`中，因为乘法要求左操作数必须在`eax`
- 第二步执行乘法操作，`eax = t2 × t3`,同时`edx`会存放高位结果，但是`Tiger`只关心普通整数结果，所以这里说`edx`被污染了
- 第三步把结果从`eax`移动到临时变量`t1`
</aside>
#### 3. 二地址指令

目标寄存器必须和第一个源寄存器相同

**解决方案**：添加额外的`mov`指令

```asm
mov t1, t2       /* t1 ← t2 */
add t1, t3       /* t1 ← t1 + t3 */
```

我们希望寄存器分配器能够把`t1`和`t2`分配到同一个真是寄存器中，这样这条`mov`指令就可以被删除

#### 4. 算术操作可以直接访问内存

- 指令选择阶段会把每个`TEMP`节点都变成一个 *寄存器*引用。很多这样的寄存器最后实际上可能会变成内存位置
- **解决方案**：在执行运算之前，把所有操作数都取到寄存器中；运算完成后，再把结果存回内存

<aside class="admonition example">
下面这两段指令序列计算的是同一件事

```asm
mov eax, [ebp-8]
add eax, ecx
mov [ebp - 8], eax
```

```asm
add [ebp - 8], ecx # M[ebp - 8] ← M[ebp - 8] + ecx
``` 

下面的指令序列虽然更加简洁，但是两种序列的速度差不多
</aside>
虽然上述例子中下面的指令更短，但是机器内部仍然要完成三个动作

1. 从内存`[ebp - 8]`读取值
2. 和`ecx`相加
3. 把结果写回`[ebp - 8]`

所以本质上并没有少做这些工作

#### 5. 多种选址方式

- 一个能够完成六件事的寻址方式，通常也需要六个步骤来执行
  - `CISC`指令看起来很短，但是硬件内部不一定真的只花费一步

<aside class="admonition example">
```asm
mov eax, [base + index * 4 + offset]
```

表面上是一条指令，但是机器内部可能要做

```
1. 读取 base
2. 读取 index
3. 计算 index * 4
4. 加上 base
5. 加上 offset
6. 访问内存
```
</aside>
- 它有两个优点
  - 会破坏更少的寄存器(`trash fewer registers`)
  - 指令编码更短
- 经过一些额外工作，基于`tree matching`的指令选择器可以选择`CISC`的寻址方式；但是程序使用简单的`RISC-like`指令也可能一样快

#### 6. 变长指令

- 对于编译器来说，这不算真正的问题
- 一旦指令已经选好，让编译器输出对应的机器编码是一件简单但是繁琐的事情

#### 7. 带副作用的指令

**问题**：有些机器有一种`autoincrement memory fetch instruction`，也就是**自增式内存读取指令**，它的效果是

```asm
r2 <- M[r1];
r1 <- r1 + 4
```

- 这种指令很难用`tree patterns`建模，因为它会产生**两个后果**

<aside class="admonition note">
这里我们来说明一下，什么是所谓的两个结果

一棵普通的`IR Tree`通常表达的是：**一个表达式树 + 一个计算结果**；但是存在`autoincrement`情况的指令不只是取值还修改了`r1`,这相当于 **一个操作 + 两个效果**，这就是两个结果的来源，因此 **很难用树模式来描述**
</aside>
- 有三种解决方案
  - 忽略`autoincrement`指令，不使用它们，希望这些复杂指令不会影响整体代码生成
  - 在`tree pattern-matching code generator`中，用临时的、特殊的方式匹配某些特殊惯用模式(`idom`)
  - 完全使用另一种指令选择算法，即基于`DAG patterns`，而不是基于`tree patterns`

### 9.3.2 Algorithns for Instructions Selection

- 用于寻找`optimal tiling`算法，比寻找`optimum tiling`的算法更简单
- 对于`CISC`，`optimum tiling`和`optimal tiling`之间的差别比较明显
  - 因为有些`CISC`指令一条就可以完成多个操作
- 对于`RISC`，二者通常没有区别
  - 因为`RISC`的`tile`通常比较小，而且代价比较统一
- 因此对于`RISC`，使用更简单的`tiling`算法通常就足够了

## 9.4 Instruction Selection for the Tiger Compiler

在一棵由指令模式`tiled`的树中**每个`tile`的根节点都会对应某个中间结果**，这个中间结果**保存在寄存器**中

<aside class="admonition question">
应该使用哪个寄存器？
</aside>
**寄存器分配**的任务，就是给这些需要保存结果的节点**分配具体的寄存器编号**

寄存器分配的很多方面并不依赖于特定目标机器的指令集,本质上更依赖于 **程序中变量的使用关系**

寄存器分配应该在指令之前还是之后进行？

- 如果在指令选择之前进行；甚至还不知道哪些`tree nodes`的结果需要寄存器保存
- 因此不可能很准确
- 所以我们会在**指令选择之后进行寄存器分配**

### 9.4.1 Abstract Assembly Language Instructions

!!! note "为什么需要抽象汇编"
前面我们说过，`instruction selection`会把`IR Tree`翻译成类似汇编的指令，例如

```asm
add `d0, `s0, `s1
mov `d0, `s0
jmp L1
```

但是这个时候还没有真正决定 *`t1`、`t2`、`t3` 到底对应 eax、ebx、ecx 还是别的寄存器*

所以`Tiger`会先生成一种 **抽象汇编指令结构**。它记录：

- 这条指令长什么样
-  它读了哪些临时寄存器
-  它写了哪些临时寄存器
-  它可能跳转到哪些`label`

后续寄存器分配完成后，再把临时寄存器替换成真实寄存器的名字
</aside>
```cpp
typedef struct {
  Temp_labelList labels;
} *AS_targets;

typedef struct {
  enum {
    I_OPER,
    I_LABEL,
    I_MOVE
  } kind;
  union {
    struct {
      string assem;
      Temp_tempList dst, src;
      AS_targets jumps;
    } OPER;

    struct {
      string assem;
      Temp_label label;
    } LABEL;

    struct {
      string assem;
      Temp_tempList dst, src;
    } MOVE;
  } u;
} *AS_instr;

void AS_print(FILE *out, AS_instr i, Temp_map m);
```

- `OPER`包含
  - `assem`:一条汇编语言指令
  - `src`:操作数寄存器列表，可以为空
  - `dst`:结果寄存器列表，可以为空
  - `jumps`:可能跳转到的目标`label`列表
    - 如果某条指令总是顺序执行到下一条指令，那么`jumps = NULL`

<aside class="admonition example">
```asm
add `d0, `s0, `s1
```

这是一条加法指令，用抽象汇编语言表示为

```
assem = "add `d0, `s0, `s1"
src = [t1, t2]
dst = [t3]
jumps = NULL
```
</aside>
- `LABEL`包含
  - `assem`:这个`label`在汇编语言程序里长什么样(打印出来给汇编器看的字符串)
  - `label`:使用的是哪个`label`符号（编译器内部使用的符号对象）

<aside class="admonition example">
```asm
L1:
```

在抽象汇编中，`LABEL`记录的两个东西

```
assem = "L1:"
label = L1
```
</aside>
- `MOVE`类似于`OPER`，但是它只能执行数据传送
- `AS_print(f, j, m)`会把一条抽象汇编指令`i`格式化成字符串，并打印到文件`f`
  - `m`是一个`temp mapping`，用来告诉每个`temp`最终被分配到哪个寄存器

### 9.4.2 机器无关性(`Machine-independence`)

- `AS_instr`类型独立于所选择的目标机器汇编语言
  - 它不是某一种具体机器的最终汇编代码，而是一种统一的数据结构
  - 其中包含的信息对所有机器都是通用额
  - 所有指令都可以抽象成 *一段汇编字符串+源寄存器+目标寄存器+跳转目标*
- 这里使用`Jouette assemnly language`

![使用Jouette assembly language的例子](/my-blog/2026/05/22/compile/Chapter9/image-225.png)

- `assem`：汇编模板字符串
- `dst`：目标临时寄存器列表
- `src`：源临时寄存器列表
- `jumps`：跳转目标，这里没有跳转，所以是 NULL

寄存器分配之后，真实的`Jouette`汇编可能是

```asm
LOAD r1 <- M[r27+8]
```

- `Assem`指令本身并不知道寄存器分配结果。它用`s0`表示第一个源寄存器，用`d0`表示目标寄存器

<aside class="admonition example">
![例子的IR Tree](/my-blog/2026/05/22/compile/Chapter9/image-226.png)

| assem                    | dst    | src          |
| ------------------------ | ------ | ------------ |
| ADDI d0 <- `s0 + 3`    | `t908` | `t87`        |
| LOAD d0 <- `M[s0 + 0]` | `t909` | `t92`        |
| MUL d0 <- `s0` * `s1`   | `t910` | `t908, t909` |

> 其中 t908、t909 和 t910 是由指令选择器新选择出来的临时变量。

寄存器分配之后，汇编代码可能变成

```asm
ADDI    r1 <- r12 + 3
LOAD    r2 <- M[r13 + 0]
MUL     r1 <- r1 * r2
```
</aside>
### 9.4.3 Procedure Calls

- 过程调用（调用没有返回值）表示为：`EXP(CALL(f, args))`
- 函数调用（有返回值）表示为：`MOVE(TEMP t, CALL(f, args))`

这些`Tree IR`可以被下面这样的`tile`匹配

```cpp
case EXP(CALL(e, args)) {
  Temp_temo r = munchExp(e);
  Temp_tempList l = munchArgs(0, args);
  emit(AS_Oper("CALL `s0\n", calldefs, L(r,l),NULL));
}
```

1. 用`munchExp(e)`生成代码，计算被调用函数的**地址或标签**
2. 用`munchArgs(0, args)`生成代码，把所有参数放到正确位置
3. 发射一条抽象汇编`CALL`指令

> `munchArgs`会生成代码，把所有实参移动到它们正确的位置，可能是寄存器，也可能是内存

<aside class="admonition example">
函数调用前，参数必须按照`calling convention`放到固定位置

对于`CALL(f, [a,b,c,d])`，`munchArgs(0, args)`就负责生成下面的代码

```asm
MOVE r1 <- a
MOVE r2 <- b
MOVE r3 <- c
STORE d -> stack
```

所以`munchArgs`的作用不是 **调用函数**，而是：**在调用函数之前，把实参摆放到正确的位置**
</aside>
- 一次`CALL`预计会 **破坏某些寄存器**，例如
  - `caller-save registers`:调用者保存寄存器
  - `return-address register`:返回地址寄存器
  - `return-value register`:返回值寄存器

这些被调用破坏的寄存器列表`calldefs`，应该被列为`CALL`指令的`destination`，其核心作用就是告诉寄存器分配器：**这些寄存器在CALL后会被重新定义，旧值不可靠**

### 9.4.4 If there's no frame 

使用`frame pointer`时，在每次过程调用中

- 栈指针寄存器会被赋值到帧指针寄存器 
- 栈指针会按照新栈帧的大小进行增加

**Virtual frame pointer**

- 可以节省时间，因为不需要复制指令
- 可以节省空间，因为多出来一个寄存器可以用于其他目的
- `codegen`函数必须把所有`FP+k`的引用替换成：`SP+k+fs`

> 原本通过帧指针访问的位置，可以通过栈指针—+一个修正后的偏移访问

> 其中`fs`是`frame size`，也就是当前栈帧的大小

<aside class="admonition question">
![练习](/my-blog/2026/05/22/compile/Chapter9/image-227.png)

**step 1:构建IR树**

1. 根节点是`MOVE`
2. `MOVE`左操作数是`MEM(...)`，右操作数是`CONST 1`
3. 内部`MEM`的地址表达式是`+(MEM(+ (CONST a, TEMP fp)), + (TEMP i, CONST 4))`
4. 拆分加法
  - 左子树：`MEM(+(CONST a, TEMP fp))`
  - 右子树：`+(TEMP i, CONST 4)`

最终`IR`树如下(文字表示)：

```
          MOVE
         /    \
      MEM       CONST 1
       |
       +
      / \
   MEM   +
   |    / \
  +   TEMP i CONST 4
 / \
CONST a TEMP fp
```

**step2:使用`Maximal Munch`和`Jouette`架构对`IR`树进行`tiling`**

- 我们按照 **自底向上`Bottom-Up`**的`Maximal Munch`方法，每个节点选择匹配模式`tile`
- 典型`Jouette`模式
  - `MEM(TEMP x)`:生成`LOAD`指令
  - `CONST`:直接使用立即数
  - `+`：`ADDI`或`ADD`指令
  - `MOVE`：对一个到存储操作或寄存器赋值

**Bottom-Up分块**

1. 最底层
  - `+(CONST a, TEMP fp)`→`+(CONST, TEMP)`→使用临时寄存器`t1`
  - `+(TEMP i, CONST 4)`→`+(TEMP, CONST)`→使用临时寄存器`t2`
2. 中间层
  - `MEM(+ (CONST a, TEMP fp))` → 匹配 `MEM(TEMP) → LOAD` 到 `t3`
  - `+ (t3, t2)` → 匹配 `+(TEMP, TEMP) → ADD → t4`
3. MOVE
  - MOVE(MEM(...), CONST 1) → 对最终值 1 赋值到内存 → STORE

**step 3:生成 Jouette 汇编指令序列**

```
# 计算 MEM(+ (CONST a, TEMP fp)) 到 t3
ADDI t1 <- fp + a        # t1 = fp + a
LOAD t3 <- M[t1]         # t3 = MEM(fp + a)

# 计算 +(TEMP i, CONST 4) 到 t2
ADDI t2 <- i + 4          # t2 = i + 4

# 计算 MEM(...) 的加法
ADD t4 <- t3 + t2         # t4 = t3 + t2

# 最终 MOVE 到内存
STORE M[t4] <- 1          # MEM(t4) = 1
```
</aside>
