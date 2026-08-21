---
title: Chapter 7 Translate to Intermediate Code
date: '2026-05-12 14:20'
categories:
  - CS课程笔记
  - 编译原理
  - 课程笔记
tags:
  - 编译原理
cover: 'https://www.dotcpp.com/assets/img/%E7%BC%96%E8%AF%91%E5%99%A8.jpeg'
description: >-
  Where are we? [编译流程] !!! note "Motivation" - 为什么我们需要 Intermediate
  Representation(IR) - 为什么不直接把AST翻译成真实机器码 - modularity 模块化 - Portability 可移植性
  [对比有无IR] 如果没有 IR ，
published: true
legacyPath: 2026/05/12/compile/Chapter7
sourcePath: compile/Chapter7.md
---

> Where are we?

![编译流程](/my-blog/2026/05/12/compile/Chapter7/image-187.png)

!!! note "Motivation"
- 为什么我们需要`Intermediate Representation(IR)`
- 为什么不直接把AST翻译成真实机器码
  - **modularity**模块化
  - **Portability**可移植性
</aside>
![对比有无IR](/my-blog/2026/05/12/compile/Chapter7/image-188.png)

如果没有`IR`，那么如果有`N`种源语言，`M`种目标机器，那么需要写$N \times M$种翻译器

如果有`IR`,所有语言先翻译成统一的`IR`，然后`IR`再翻译成不同的机器码，这样只需要$N + M$种转换逻辑

**什么是中间表示`IR`**

- **Intermediate Representation**(IR,中间表示)是一种`abstract machine language`(抽象机器语言)
  - 它能够表达目标机器上的操作，但是不会过早绑定到太多具体机器细节(具体细节可能要取决于具体的操作系统)
  - 它独立于源语言的细节
- 编译器种会使用很多不同种类的`IR`
  - `Tiger`编译器：使用 **expression trees**(表达式树)
  - `Three-Address Code`(三地址码)
    - `Static Single Assignment, SSA`静态单赋值形式
- 一个编译器可能会使用多层`IR`

**Basic Concepts**

- 编译器前端
  - 词法分析(`Lexical analysis`)
  - 语法分析(`Parsing`)
  - 语义分析(`Semantic analysis`)
  - 翻译成中间表示`IR`
- 编译器后端
  - `IR Optimization`
  - `Translation into machine language`

## 7.1 Three-Address Code

### 7.1.1 基本形式

- 三地址码最基本的指令形式是：$x = y op z$
- 一条三地址码指令可以有四个字段
  - 一个字段表示操作符
  - 三个字段表示地址

<aside class="admonition example">
```
x = y + z
```

可以拆成

```
操作符：+
地址1：x
地址2：y
地址3：z
```
</aside>
- 地址可以是以下几种
  - `name`:源程序中的名字，比如`a`,`x`
  - `constant`:常量，比如`3`
  - `compiler-generated temporary`:编译器生成的临时变量，比如`t1`

### 7.1.2 复杂表达式如何拆分

- 一条三地址指令右边最多只有一个操作符
- 因此，**一个**源语言表达式可能会被翻译成**一串**三地址码指令

<aside class="admonition example">
$$
2 * a + (b - 3)
$$

可以翻译成

```
t1 = 2 * a
t2 = b - 3
t3 = t1 + t2
```
</aside>
- 对于程序语言中的不同结构，需要改变三地址码的形式

<aside class="admonition example">
```
t2 = -t1
```

这是一个一元运算，不是标准的`x = y op z`形式
</aside>
- 三地址码没有统一的标准形式
  - 一个原因是：为了表达语言中的特殊特性，有时需要发明新的指令形式

!!! example "阶乘程序例子"
**高级语言**：

```go
read x
if 0 < x then
    fact := 1;
    repeat
        fact := fact * x;
        x := x - 1
    until x = 0;
    write fact
end
```

**三地址码**

```
read x
t1 = x > 0
if_false t1 goto L1

fact = 1

label L2
t2 = fact * x
fact = t2
t3 = x - 1
x = t3
t4 = x == 0
if_false t4 goto L2

write fact

label L1
halt
```
</aside>
### 7.1.3 三地址码的实现

- 整个三地址码指令序列可以实现为一个 **数组**或 **链表**
- 最常见的实现方式是把三地址码实现为 **四元式**(`quadruples`)
  - 一个字段表示`operation`
  - 三个字段表示`addresses`
- 对于那些不需要三个地址的指令，一个或多个地址字段会被赋值为`null`或者`empty`

<aside class="admonition example">
```go
t1 = x > 0
if_false t1 goto L1
fact = 1
label L2
```

可以表示成四元式

```
(gt,   x, 0,  t1)
(if_f, t1, L1, _)
(asn,  1, fact, _)
(lab,  L2, _, _)
```
</aside>
## 7.2 Intermediate Representation Tree

一个好的中间表示应该具备几个性质

- 方便语义分析阶段生成(前端)
- 方便翻译成所有真实机器语言(后端)
- 每一种IR构造都必须有清楚、简单的含义
  - 这样`IR`优化转换就可以很容易地被描述和实现

- 抽象语法中的单个片可能是很复杂的东西
  - 例如，*数组下标、过程调用*
  - 单条真实机器指令也可能有复杂效果，语法看起来简单，但是底层机器码要做很多事情

`IR`应该由一些 **只描述及其简单事情的独立组件组成**

```
一次读取 fetch
一次存储 store
一次加法 add
一次移动 move
一次跳转 jump
```

- 任何块状的复杂抽象语法片段，都应该被翻译成一组**合适的抽象机器指令**，也就是`IR`指令
- 多条抽象机器指令组合起来，再翻译成真实机器指令

| 类别           | IR 节点                  | 含义                                        | 类似代码理解                    | 重点说明                                                                                    |
| -------------- | ------------------------ | ------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| 表达式 `T_exp` | `CONST(i)`               | 整数常量 `i`                                | `5`                             | 表示一个立即数常量                                                                          |
| 表达式 `T_exp` | `NAME(n)`                | 符号常量，通常是汇编标签                    | `L1` 的地址                     | **使用**标签 `n`，常用于跳转目标或函数入口地址                                              |
| 表达式 `T_exp` | `TEMP(t)`                | 临时变量，也可以理解为虚拟寄存器            | `t1`                            | 后续寄存器分配时会映射到真实寄存器或栈位置                                                  |
| 表达式 `T_exp` | `BINOP(o, e1, e2)`       | 对 `e1` 和 `e2` 做二元运算 `o`              | `e1 + e2`                       | `o` 可以是 `PLUS`、`MINUS`、`MUL`、`DIV`、`AND`、`OR`、`XOR`、`LSHIFT`、`RSHIFT`、`ARSHIFT` |
| 表达式 `T_exp` | `MEM(e)`                 | 访问地址 `e` 开始的 `wordSize` 字节内存内容 | `*e`                            | 如果作为普通表达式，表示 **fetch / 读内存**                                                 |
| 表达式 `T_exp` | `CALL(f, l)`             | 调用函数 `f`，参数列表为 `l`                | `f(a, b)`                       | 参数从左到右求值，通常会产生返回值                                                          |
| 表达式 `T_exp` | `ESEQ(s, e)`             | 先执行语句 `s`，再计算表达式 `e`            | `{ s; return e; }`              | 用来把“有副作用的语句”和“有返回值的表达式”组合起来                                          |
| 语句 `T_stm`   | `MOVE(TEMP(t), e)`       | 计算 `e`，并把结果放入临时变量 `t`          | `t = e`                         | 左边是 `TEMP`，表示给虚拟寄存器赋值                                                         |
| 语句 `T_stm`   | `MOVE(MEM(e1), e2)`      | 计算地址 `e1`，再把 `e2` 的结果存入该地址   | `*e1 = e2`                      | 此时 `MEM(e1)` 表示 **store / 写内存**                                                      |
| 语句 `T_stm`   | `EXP(e)`                 | 计算表达式 `e`，但丢弃结果                  | `f();`                          | 常用于只需要副作用、不需要返回值的函数调用                                                  |
| 语句 `T_stm`   | `JUMP(e, labs)`          | 无条件跳转到地址 `e`                        | `goto L1`                       | `e` 可以是 `NAME(L1)`，也可以是计算出来的地址                                               |
| 语句 `T_stm`   | `CJUMP(o, e1, e2, t, f)` | 比较 `e1` 和 `e2`，真跳到 `t`，假跳到 `f`   | `if e1 < e2 goto t else goto f` | `o` 是关系运算符，如 `EQ`、`NE`、`LT`、`GT`、`LE`、`GE`                                     |
| 语句 `T_stm`   | `SEQ(s1, s2)`            | 先执行 `s1`，再执行 `s2`                    | `s1; s2;`                       | 用于把多个 IR 语句串联起来                                                                  |
| 语句 `T_stm`   | `LABEL(n)`               | 在当前位置定义标签 `n`                      | `L1:`                           | **定义**标签 `n`，让它代表当前机器代码地址                                                  |

## 7.3 Translation IR Trees

![抽象树向中间表达式做转化](/my-blog/2026/05/12/compile/Chapter7/image-189.png)

 ### 7.3.1 Expression


<aside class="admonition question">
在语言中，抽象语法表达式`A_exp`应该被表示成什么？
</aside>
- 有**返回值**的表达式：`T_exp`
- 没有返回值的表达式，比如某些过程调用，或者`while`表达式：`T_stm`
- 布尔值表达式，比如`a > b`可以表示成`a conditional jump`

我们把三类表达式建模为

- `Ex`:expression,一个树表达式
- `Nx`:no result, 一个`Tree statement`
- `Cx`:conditional, 一个`TreeStatement`，可能跳转到`true-label`或`false-label`

> 这里我们定义了`Translate`模块中的统一表达式类型

```cpp
typedef struct Tr_exp_ *Tr_exp;

struct Cx {
    patchList trues;
    patchList falses;
    T_stm stm;
};

struct Tr_exp_ {
    enum {
        Tr_ex;
        Tr_nx;
        Tr_cx;
    } kind;

    union {
         T_exp ex;
         T_stm nx;
         struct Cx cx;
    } u;
};

static Tr_exp Tr_Ex(T_exp ex);
static Tr_exp Tr_Nx(T_stm nx);
static Tr_exp Tr_Cx(patchList trues, patchList falses, T_stm stm);
```

![AST向IR Tree转化](/my-blog/2026/05/12/compile/Chapter7/image-190.png)

我们暂时不知道`true-destination`和`false-destination`

- 我们建立一个位置列表，这些位置先填`NULL`，等`true label`确定之后再统一**回填**(`backpatching`)
- 同时把暂时不知道`false`目标的位置也收集起来，等`false-label`确定后再统一回填

**`patchList`的数据结构**

`patchList`是一个链表类型

每个节点中有两个部分

1. `head`:指向一个`Temp_label`指针的位置
2. `tail`:指向下一个`patchList`节点

```cpp
typedef struct patchList_ *patchList;

struct patchList_ {
    Temp_label *head;
    patchList tail;
};

static patchList PatchList(Temp_label *head, patchList tail); // 用来创建一个新的patchList节点
```

**构造`true list`和`false list`**


```
s1
SEQ
├── left  = CJUMP(GT, a, b, NULL_t, z)
└── right = SEQ
           ├── left  = LABEL(z)
           └── right = CJUMP(LT, c, d, NULL_t, NULL_f)
```

- 这是整个`s1`的结构

```cpp
patchList trues = PatchList(
    &s1->u.SEQ.left->u.CJUMP.true,
    PatchList(&s1->u.SEQ.right->u.SEQ.right->u.CJUMP.true, NULL)
);
```

- 两个表达式中有一个为`true`，就跳转到`true`的目标位置

```cpp
patchList falses = PatchList(
    &s1->u.SEQ.right->u.SEQ.right->u.CJUMP.false,
    NULL
);
```

```cpp
Tr_exp e1 = Tr_Cx(trues, falses, s1);
```

- 把这整个布尔表达式包装成一个条件表达式`Cx`

有时候，我们需要**把一种类型的表达式转换成另一种等价类型的表达式**

<aside class="admonition example">
```
flag := (a>b | c<d)
```

这需要把一个`Cx`转换成一个`Ex`
</aside>
```cpp
static T_exp unEx(Tr_exp e); // 把Tr_exp转成T_exp
static T_stm unNx(Tr_exp e); // 把Tr_exp转成T_stm
static struct Cx unCx(Tr_exp e); // 把Tr_exp转成Cx
```

- `Tr_exp`表示输入表达式可以是任意一种类型
- 对于不同类的输出表达式，我们使用不同的转换函数


<aside class="admonition example">
```tiger
flag := (a>b | c<d)
```

转换成

```asm
e = Tr_Cx(trues, falses, stm)
MOVE(TEMP(flag), unEx(e))
```
</aside>
**unEx如何把Cx转成Ex**

```cpp
static T_exp unEx(Tr_exp e) {
  switch (e->kind) {
    case Tr_ex:
      return e->u.ex;

    case Tr_cx: {
      Temp_temp r = Temp_newtemp();
      Temp_label t = Temp_newlabel(), f = Temp_newlabel();

      doPatch(e->u.cx.trues, t);
      doPatch(e->u.cx.falses, f);

      return T_Eseq(
        T_Move(T_Temp(r), T_Const(1)),
        T_Eseq(e->u.cx.stm,
          T_Eseq(T_Label(f),
            T_Eseq(T_Move(T_Temp(r), T_Const(0)),
              T_Eseq(T_Label(t), T_Temp(r))))));
    }

    case Tr_nx:
      return T_Eseq(e->u.nx, T_Const(0));
  }

  assert(0);
}
```

**如果本来就是 Tr_ex**

```cpp
case Tr_ex:
    return e->u.ex;
```

- 如果输入表达式本来就是有值表达式，那直接返回它内部的`T_exp`

**如果是 Tr_cx**

```cpp
Temp_temp r = Temp_newtemp();
Temp_label t = Temp_newlabel(), f = Temp_newlabel();
```

创建一个新的临时变量`r`，用来保存**最终的布尔值**

```cpp
doPatch(e->u.cx.trues, t);
doPatch(e->u.cx.falses, f);
```

把`Cx`中所有`true`分支的空位置回填成`t`
把所有`false`分支的空位置回填成`f`

**生成ESEQ表达式**

```cpp
T_Eseq(
    T_Move(T_Temp(r), T_Const(1)),
    T_Eseq(e->u.cx.stm,
        T_Eseq(T_Label(f),
        T_Eseq(T_Move(T_Temp(r), T_Const(0)),
            T_Eseq(T_Label(t), T_Temp(r))))));
```

`ESEQ(s,e)`的意思是：先执行语句`s`，并把`e`作为结果

以上面的代码为例，其流程实际上就是：

```risc
MOVE(TEMP r, 1)
Cx
LABEL(f)
MOVE(TEMP r, 0)
LABEL(t)
TEMP(r)
```

![转化效果](/my-blog/2026/05/12/compile/Chapter7/image-191.png)

> 其中`z`是一个中间标签，作用是 **当 a > b 为假时，跳到 z，继续判断 c < d**

### 7.3.2 Simple Variables

把当前过程栈帧中声明的简单变量`v`翻译成`IR`

![栈帧结构](/my-blog/2026/05/12/compile/Chapter7/image-192.png)

```
MEM(BINOP(PLUS, TEMP fp, CONST k))
```

- `k`是变量`v`在当前栈帧中的偏移量
- `TEMP fp`表示`frame pointer`，也就是帧指针寄存器
- 对于`Tiger`编译器来说，**所有变量大小相同**，都是**机器的自然字长**

> 这里变量`v`可以用`fp+k`的形式去查找

**Semant和Translate之间的接口**

- `Semant`模块**不应该直接引用`Tree`或`Frame`模块**
- 任何对`IR Tree`的操作都应该由`Translate`完成

```cpp
Tr_exp Tr_simpleVar(Tr_access, Tr_level);
```

- `Semant`会把变量`x`的访问方式传给`Translate`，这个访问方式来自`Tr_allocLocal`
- 同时还会传入`x`被使用时所在函数的`level`

我们会把`BINOP(PLUS, e1, e2)`简写成`+(e1, e2)`

![指令的简化](/my-blog/2026/05/12/compile/Chapter7/image-193.png)

- 为了翻译变量`v`，我们需要知道
  - `frame pointer`，帧指针
  - `word size`,机器字长

这些都是机器相关的定义

我们在`Frame`模块中加入一个`frame-point register`也就是`FP`，以及一个常来那个，它的值是**机器的自然字长**

```cpp
/*frame.h*/
Temp_temp F_FP(void);
extern const int F_wordSize;
T_exp F_exp(F_access acc, T_exp framePtr);
```

- 函数`F_Exp`被`Translate`使用，用来把一个`F_access`转换成一个`IR Tree expression`

!!! warning "Translate模块不应该自己判断具体机器如何访问栈帧"

- 不同机器的`frame pointer`可能不同
- 不同机器的`word size`可能不同
- 不同机器的栈帧布局也可能不同
</aside>
<aside class="admonition exmample">
```cpp
/* frame.h */
Temp_temp F_FP(void);
extern const int F_wordSize;
T_exp F_Exp(F_access acc, T_exp framePtr);
```

- 一个访问方式`a`是：`InFrame(k)`
调用：

```cpp
F_Exp(a, T_Temp(F_FP()))
```

- 返回：`MEM(a, TEMP FP, CONST(k))


- 79一个访问方式`a`是`InReg(t832)`
- 则简单返回`TEMP t832`(寄存器名称)
</aside>
### 7.3.3 Array Variables

> 不同变成语言对 **数组值变量**的处理方法不同

**Pascal中的数组**

在`Pascal`中，一个数组变量表示的是数组的内容本身

```pascal
var a, b : array[1..12] of integer;
begin
    a := b
end.
```

这段代码会把数组`b`的内容复制到数组`a`中，也就是复制全部12个整数

也就是说，Pascal中的数组赋值是 **赋值整个数组内容**

**C中的数组**

在C中，数组更像是 **指针常量**

```c
{
    int a[12], b[12];
    a = b;
}
```

这种行为在C中是 **非法的**

因为在`C`中，数组名`a`不是一个可以**被重新赋值的普通变量**。

它更像是一个 **固定地址**，表示数组首元素的位置

```C
{
    int a[12], *b;
    b = a;
}
```

这种代码是合法的

因为`b`是一个指针变量，`a`可以退化为一个 **指向首元素的指针**，所以可以把`a`的地址赋给`b`

#### Tiger中的数组

在`Tiger`中，数组变量表现得更像指针

新的数组由下面的结构创建并初始化

``` tiger
t[n] of i
```

其中

- `t`是数组类型的名字
- `n`是元素个数
- `i`是每个元素的初始值

```tiger
let
    type intArray = array of int
    var a:= intArray[12] of 0
    var b:= intArray[12] of 7
in 
    a:=b
end
```

- `a` 最终会指向和变量 `b` 相同的那 **`12` 个值为 `7` 的数组元素**。

- 原来给 a 分配的那 **12 个值为 0 的数组元素会被丢弃**。

| 语言   | 数组变量含义                | `a := b` / `a = b` 的效果             |
| ------ | --------------------------- | ------------------------------------- |
| Pascal | 数组内容本身                | 复制整个数组内容                      |
| C      | 数组名像固定地址 / 指针常量 | `a = b` 非法，因为数组名不能被赋值    |
| Tiger  | 数组变量像指针 / 引用       | `a := b` 让 `a` 和 `b` 指向同一个数组 |


- `Tiger`中的`record values`也是指针
- `record assignments`和数组赋值一样，本质上是 **指针赋值**，不会复制所有字段

### 7.3.4 Structured L-Values

- `L-Value`:一种表达式的结果或，它可以出现在赋值语句的左边
  - 本质上表示可以代表 **存储位置**的表达式

<aside class="admonition example">
```
x, y.p, a[i+2]
```

这些表达式表示一个可以被赋值的位置

> 它们也可以出现在赋值语句的右边
</aside>
- `R-Value`:一种表达式的结果，它只能出现在赋值语句的右边
  - 它表示一个不可以被赋值的位置

<aside class="admonition example">
```
a + 3, f()
```
</aside>
#### 结构化左值

- 一个整数值或指针值是一个`scalar`标量：它**只有一个组成部分**
- 在`Tiger`中
  - **所有变量和左值**都是标量
  - 数组变量或记录变量实际上是一个**指针**，也是一种标量
- 在`C`或`Pascal`中存在结构化左值，例如
  - `C`中的`struct`
  - `Pascal`中的`array`和`record`

> 这些结构化左值本身不是标量

- 为了 **翻译结构化左值**，需要更新`T_Mem`

```cpp
T_exp T_Mem(T_exp, int size);
```

<aside class="admonition example">
```
Mem(+(TEMP fp, CONST k), S)
```

- `S`表示要读取或存储的对象大小
</aside>
### 7.3.5 Subscripting and Field Selection

- 为了计算`a[i]`的地址

$$
(i+l)\times s + a
$$

其中

- `a`:数组元素区域的**基地址**
- `l`:数组**下标范围的下界**
- `s`:每个数组元素的大小，单位是**字节**

如果`a`是全局变量，并且它的地址是编译器常量，那么

$$
a - s \times l
$$

这部分可以在编译器提前算好

- 为了计算`record a`中字段`f`的地址：$offset(f) + a$

<aside class="admonition question">
为什么左值要翻译成地址
</aside>
- 数组变量`a`是一个`l-value`，所以数组下标表达式`a[i]`也是一个`l-value`
- 为了获得`a[i]`的地址，我们需要对`a`的**地址做算数运算**
- 在`Pascal`编译器中
  - 如果我们把`l-value a`翻译成下面这种`IR Tree`，我们就无法对`a`的地址做算数运算
  ![IR Tree](/my-blog/2026/05/12/compile/Chapter7/image-194.png) 
  - 这个`IR Tree`是`MEM(+(TEMP fp, CONST k))`
  - 它表示的是*读取`fp+k`地址处的值*
  - 因此，我们应该把`l-value a`翻译成它地址的`Tree expression`
    - 我们真正需要的是`a 的基地址 + (i-l)*s`

因此，对于结构化左值，尤其是`Pascal`这种**数组变量本身代表整个数组内容的语言**，编译器更应该把`l-value`翻译成**表示地址的`IR`**，而**不是直接翻译成表示值的`IR`**

在`Pascal`编译器中，`l-value a`可能会发生什么

- 某个具体元素可能被下标访问，产生一个更小的`l-value`，例如`a[i]`

这时一个`+`节点会把

$$
(i-l) \times s
$$

加到`a`上

- 表示整个数组的`l-value`也可能被用在需要`r-value`的上下文中，例如`b=a`

然后这个`l-value`会通过对它应用`MEM`操作，被强制转换成`r-value`


- 在`TIger`语言中，所有`record`和`array`的值实际上都是指向`record/array`结构的**指针**
  - **Tiger的数组变量本身不是数组内容，而是一个指针**
- 数组的`base address`实际上是一个指针变量的内容，所以需要`MEM`
- `a[i]`的`IR Tree`是`MEM(+(MEM(e),BINOP(MUL, i, CONST W)))`
  - `a[i]`的地址 = 数组基地址 + i*w

![Tiger语言中a[i]的IR Tree](/my-blog/2026/05/12/compile/Chapter7/image-195.png)

- `MEM(e)`表示数组的基地址
- `W`是机器字长，也就是`word size`

这里发现我们使用了两层`MEM`

- 第一层`MEM(e)`：从变量`a`的位置读取数组基地址
- 第二层`MEM(...)`:从数组元素地址读出`a[i]`的值

> 可以将`MEM`理解成C语言中的解引用操作符`*`

<aside class="admonition warning">
**`a`的变量地址≠数组元素基地址**
</aside>
- 技术上，一个`l-value`应该被表示成一个地址，也就是**不带上最上层的`MEM`节点**
  - 给一个`l-value`赋值，表示往那个地址中存储
  - 把一个`l-value`转换成`r-value`：表示从那个地址中读取，也就是加上`MEM`

```
l-value = address
r-value = MEM(address)
```

但是在`Tiger`的`Tree IR`中，`MEM`有一个特殊约定：

```
MOVE(MEM(address), value)
```

<aside class="admonition example">
```
MOVE(MEM(addr), value)
```

意思是

```
memory[addr] = 10
```

也就是做一个 **store**操作

但是如果`BINOP(PLUS, MEM(addr), CONST 1)`

这里的`MEM(addr)`就是普通表达式，表示读取`memory[addr] + 1`，也就是`fetch`
</aside>
| 用法                        | 含义                 |
| --------------------------- | -------------------- |
| `MEM(e)` 出现在 `MOVE` 左边 | store，往地址 `e` 写 |
| `MEM(e)` 出现在其他地方     | fetch，从地址 `e` 读 |

### 7.3.6 Arithmetic

在Tiger编程语言中

- 每一个整数算数运算符都对应一个`IR Tree IR`运算符
- `Tree IR`中没有一元算数运算符
  - 整数的一元负号可以实现为从`0`中减去这个数——`-n => 0 - n`
  - 一元按位取反可以实现为和全为`1`做异或`~n  =>  n XOR 111...111`

- **Tiger中没有浮点数**
  - 浮点数的一元负号**不能简单地从`0`中减去**
  - 很多浮点数表示允许存在`-0`
  - 负0取负会变成正0，反之亦然
- **`Tree`语言不太好支持一元负号**

### 7.3.7 Conditionals

- 一个比较运算符的结果会是一个`Cx`表达式
  - 也就是一个`T_stm s`语句，它会跳转到某个`true`目标或者`false`目标

<aside class="admonition example">
```
stm = CJUMP(LT, x, CONST(5), NULLt, NULLf)
trues = {t}
falses = {f}
```

意思是

- 如果`x<5`，跳转到`true`目标
- 否则跳转到`false`目标
</aside>
但是`true`目标和`false`目标暂时还不知道，所以先用`NULLt`和`NULLf`占位，并把这些位置分别记录到`trues`和`falses`列表中

<aside class="admonition warning">
条件表达式可以很容易和`Tiger`的`&`和`|`运算符结合

例如：

```
a > b | c < d
```
</aside>
因此对于比较表达式，往往不直接翻译成 **0/1**，而是**翻译成条件跳转`Cx`**

如何把一个条件表达式的`Cx`和另一个条件表达式`Cx`组合起来

- `a > b & c < d`把条件表达式的`trues`位置填成`c>d`对应的标签
- `a > b | c < d`把条件表达式的`falses`位置填成`c<d`对应的标签

#### if 表达式

如何处理`if`表达式：`if e1 then e2 else e3`

最直接的做法是：

1. 先判断条件 e1
2. 如果 e1 为真，跳到 LABEL t
3. 在 t 分支中计算 e2，把结果放进 r
4. 跳到 join，避免继续执行 else 分支
5. 如果 e1 为假，跳到 LABEL f
6. 在 f 分支中计算 e3，把结果放进 r
7. 跳到 join
8. 在 join 处，最终表达式的值就是 TEMP r

```
unCx(e1)

LABEL t
r = unEx(e2)
JUMP join

LABEL f
r = unEx(e3)
JUMP join

LABEL join
TEMP r
```

> 写成便于理解的C语言就是

```c
if (e1) {
    r = e2;
} else {
    r = e3;
}
return r;
```

如果`e2`和`e3`都是`statements`，也就是不返回值的表达式，那么`unEx`也可以工作，但是**最好专门识别这种情况**

<aside class="admonition example">
```tiger
if a > b then print("yes") else print("no")
```

这里

```
e2 = print("yes")
e3 = print("no")
```

它们主要是产生输出这个副作用。不需要返回值，所以实际上 **不需要创建临时变量`r`**
</aside>
如果`e2`或`e3`是`Cx`条件表达式，`unEx`会产生很糟糕的一团跳转和标签，**所以应该专门识别这种情况**

<aside class="admonition example">
```tiger
if x > 0 then a > b else c < d
```

这里：

```
e1 = x > 0
e2 = a > b
e3 = c < d
```

`e2`和`e3`本身都是条件表达式`Cx`

如果使用`unEx`的思路，就会把`a>b`先变成`if a > b then return 1 else return 0`,也就是会生成很多

```
LABEL
CJUMP
MOVE r, 1
MOVE r, 0
JUMP
```

同时还要考虑外层的标签和跳转，这会使得整个流程处理跳转和标签非常复杂

</aside>
![一个特殊的例子](/my-blog/2026/05/12/compile/Chapter7/image-196.png)

### 7.3.8 While Loops

- 一个`while`循环的一般布局结构是

```
test:
  if not(condition) goto done
  body      break => JUMP done

  goto tesst
done:
```

- 如果在循环中出现了`break`语句，并且这个`break`不是嵌套在更内部的`while`循环中，那么它的翻译就是：`JUMP done`,也就是直**接跳到当前循环的结束标签**

<aside class="admonition question">
怎么知道`done`的标签是什么
</aside>
- `transExp`会增加一个新的形式参数`break`，这个参数被设置为最近一层外部循环的`done`标签

### 7.3.9 For Loops

- 翻译`for`语句的一种直接方法是
  - 把它的抽象语法重写成一个`let/while`表达式的**抽象语法**

原始形式：

``` tiger
for i:= lo to hi
do body
```

改写之后变成

```
let 
  var i:= lo
  var limit := hi
in 
  while i<= limit
  do (body: i := i + 1)
end
```

<aside class="admonition question">
当`limit = maxint`时，`i+1`会发生溢出
</aside>
我们要给出一种更安全的写法

``` tiger
i := lo
limit := hi

test:
    body
    if i >= limit goto done
    i := i + 1
    goto test

done:
```

### 7.3.10 Function Call

- 翻译函数调用`f(a1, a2. a3, ...)`总体来说比较简单，除了必须把`sstatic link`作为一个**隐式的额外参数**加入进来：`CALL(NAME lf, [sl, e1, e2, ..., en])`
  - `lf`：函数`f`的标签
  - `sl`: `static link`静态链

## 7.4 Translation of Declarations

调用`transDec`现在会对`frame`数据结构产生副作用

> 也就是说，`transDec`不只是检查声明、翻译声明，它会修改和更新当前函数的栈帧信息

- 对于函数体中的每一个**变量声明**
  - 会在当前函数的栈帧中额外保留空间，位置通常表示为`FP + offset`
- 对于每一个**函数声明**
  - 会为这个函数的函数体保存一个新的`Tree Code fragment`

![函数声明结构](/my-blog/2026/05/12/compile/Chapter7/image-197.png)

### 7.4.1 Variable Declarations

- `transDec`函数会更新 **值环境和类型环境**
- 对于变量初始化
  - `transDec`会把变量初始化翻译成**赋值表达式**
  - 这些赋值表达式对应的`Tree expression`必须放在`let`的`body`之前

<aside class="admonition example">
``` tiger
let 
  ...
in 
  ...
end
```

变量初始化的代码要插入到`in`后面的主体代码之前

``` tiger
let
  var x := 10
  type t = int
  function f(a:int) = a + 1
in
  x + f(2)
end
```

`transDec`的任务是处理`let`里面的`declarations`，不同声明的作用不同
</aside>
- 如果`transDec`处理的是**函数声明和类型声明**，那么结果或回事一个`no-op`表达式，比如`EXP(CONST(0))`
  - 实际上就是 **什么都不做的表达式**

<aside class="admonition example">
``` tiger
type intArray = array of int
```

类型声明主要是更新类型环境，它不会在运行时执行什么动作

所以它的翻译结果可以是`EXP(CONST 0)`,表示`no-op`

函数声明也类似

``` tiger
function f(a:int) = a + 1
```

函数声明主要做这些事

- 更新`value environment`
- 为函数生成一个独立`fragment`
- 记录**函数标签、参数、返回类型**等信息

但是在当前`let body`执行前，不需要立刻执行函数体

函数体只有在之后调用`f(2)`时才会执行，所以函数体声明本身在当前顺序代码里也可以看做是`no-op`
</aside>
### 7.4.2 Function Declarations

- 一个函数会被翻译成一个`assembly language segment`，也就是一段汇编语言代码片段，它由三个部分组成
  - `prologue`:函数前言
  - `body`:函数体
  - `epilogue`:函数尾声

**一个prologue包含：**

1. 用于标记函数开始的伪指令，这些伪指令取决于具体汇编语言
2. 函数名的标签定义
3. 调整栈指针的指令，用来分配新的栈帧
4. 把`escaping arguments`保存到栈帧中，包括`static link`；同时把`nonescaping arguments`移动到新的临时寄存器中
5. 保存所有在函数中会用到的`callee-save registers`，包括返回地址寄存器(被调用函数如果使用了这些寄存器，就必须在返回前恢复它们原来的值，所以`prologue`中要先保存它们，比如保存到当前栈帧中)

**Tiger函数的body是一个表达式**

- 翻译后的表达式

**一个epilogue包含：**

1. 把函数结果，也就是返回值，移动到返回值寄存器中的指令
2. 恢复`callee-save registers`的`load`指令
3. 重置栈帧的指令，用来 **释放栈帧**
4. 返回指令，也就是跳转到返回地址
5. 根据需要，加入伪指令来**声明函数结束**

```
.globl f
f:
    prologue:
        建立栈帧
        保存寄存器
        保存必要参数

    body:
        执行函数体表达式

    epilogue:
        把结果放到返回值寄存器
        恢复寄存器
        释放栈帧
        返回调用者
```

### 7.4.3 Fragment

`Translate`阶段应该为每一个函数生成一个`fragment`，其中包含

- `frame`:栈描述符，包含与机器相关的信息，比如局部变量和参数如何存放
- `body`:从`procEntryExit1`返回的结果
  - `procEntryExit1`：对函数体`IR`做进入/退出函数前的第一步包装处理

<aside class="admonition example">
比如函数体原来是`x + 1`

但是函数最终要返回这个值，所以需要变成类似`MOVE(RV, X + 1)`

其中`RV`是返回值寄存器

这个经过处理后的结果就是`fragment`的`body`
</aside>
`fragment`的大概结构：

```
ProcFrag {
    frame: 当前函数的栈帧信息
    body: 当前函数经过处理后的 IR Tree
}
```

之后后端会利用`frame`信息生成`prologue`和`epilogue`

可以理解为

```
Translate 阶段：
    生成 fragment(frame, body)

Codegen 阶段：
    根据 frame 和 body 生成：
    prologue + assembly body + epilogue
```
