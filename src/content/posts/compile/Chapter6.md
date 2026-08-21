---
title: Chapter 6 Activation Records
date: '2026-05-9 10:20'
categories:
  - CS课程笔记
  - 编译原理
  - 课程笔记
tags:
  - 编译原理
cover: 'https://www.dotcpp.com/assets/img/%E7%BC%96%E8%AF%91%E5%99%A8.jpeg'
description: >-
  Storage Organization - 从编译器编写者的角度看，正在执行的目标程序运行在自己的 逻辑地址空间 ( logical address
  space )中，在这个地址空间里，每个程序都有一个位置 - 一个目标小程序在运行时的表示由 数据区 ( data areas 和 程序区 (
  program area
published: true
legacyPath: 2026/05/09/compile/Chapter6
sourcePath: compile/Chapter6.md
---

### Storage Organization

- 从编译器编写者的角度看，正在执行的目标程序运行在自己的 **逻辑地址空间**(`logical address space`)中，在这个地址空间里，每个程序都有一个位置
- 一个目标小程序在运行时的表示由 **数据区**(`data areas`和 **程序区**(`program areas`)组成

![逻辑存储结构划分](/my-blog/2026/05/09/compile/Chapter6/image-181.png)

- 一种典型的内存划分方式是
  - **code**：可执行的目标代码
    - 机器指令，也就是编译后的程序代码
  - **static**:在编译期间就能确定大小的 **数据对象**，例如
    - **全局常量**
    - **编译器生成的数据**
  - **stack**：过程调用时生成的数据结构，叫做`activation records`
  - **heap**:由程序控制分配和释放的数据 
    - 在C中对应`malloc`和`free`

### Activation Records(活动记录)

```tiger
function f(x:int):int = 
    let var y := x + x
    in if y < 10
        then f(y)
        else return y-1
    end
```

- 这里存在递归调用，因此会存在 **多个x同时存在的情况**

<aside class="admonition example">
```
第一次调用 f：x = 1, y = 2
第二次调用 f：x = 2, y = 4
第三次调用 f：x = 4, y = 8
```

这些`x`和`y`不是同一个变量实例，而是每次调用都有自己的一份
</aside>
- 一次函数`f`调用就是`f`的一次`activation`
- 每次调用`f`时，都会创建一个新的`x`实例，并由`f`的调用者初始化
- 在许多语言中，包括`C`,`Pascal`和`java`，函数返回时，局部变量会被 **销毁**

<aside class="admonition question">
如何保存局部变量
</aside>
- 函数调用具有 **后进先出LIFO**的行为
- 因为此使用一种`LIFO`数据结构：**stack**

- 过程调用(`Procedure calls`)和返回(`returns`)通常由一个**运行时栈**管理，这个栈叫做 **control stack**
- 每次调用一个过程时，它的局部变量空间会被 **压入栈中**
- 当过程结束时，这块栈空间会从栈中弹出

<aside class="admonition example">
- 调用函数:压入一个`frame`

```
call f()
push frame of f
```

- 函数返回时，就弹出这个`frame`

```
return from f
pop frame of f
```
</aside>
- 过程调用也叫做过程的一次`activation`
- 每个正在运行的`activation`都在`control stack`上有一个`activation record`，有时也叫`frame`


## 6.1 Stack Frames

### 6.1.1 Stack Frames

- **Stack**:支持`push`和`pop`
- 然而
  - 局部变量通常是成批地`push/pop`
  - 局部变量并不总是在创建后立刻初始化
- 我们想能持续访问

**我们可以把栈看成一个大数组**

- `Stack Pointer`:栈指针，是一个 **特殊寄存器**，指向栈中的某个位置
  - 所有超过`stack pointer`的位置都被认为是**垃圾空间**
  - 所有在`stack pointer`之前的位置都被认为**已经分配**
- 栈通常只在进入函数时增长一次，增长的大小足够容纳该函数的**所有局部变量**
  - 在函数退出前，栈**再缩小同样的大小**
- 一个函数的`activation record`或者`stack frame`是栈上专门 **分配给函数的一块区域**，用来存放
  - 局部变量
  - 参数
  - 返回地址
  - 其他临时变量
- 运行时栈通常从**高内存地址开始**，并向较小地址增长
- 栈帧连接了**调用者和被调用者**

<aside class="admonition question">
如何布置`activation record`，使调用者和被调用者能够正确通信
</aside>
![一个典型的栈帧结构](/my-blog/2026/05/09/compile/Chapter6/image-182.png)

- `incoming arguments`：由调用者传入的参数
- `local variables`:局部变量。有些局部变量存放在这个栈帧中，另一些可能保存在机器寄存器里
- `return address`：返回地址。表示函数执行结束后，控制流应该返回到调用函数中的哪个位置
  - 它由`CALL`指令创建
- `temporaries`:临时变量
- `saved registers`:保存的寄存器，为寄存器的其他用途腾出空间
- `outgoing argument`:传出函数，用于把**参数传递给其他函数**

<aside class="admonition example">
```c
int f(int x, int y) {
    int z = x + y;
    return g(z);
}
```

在`f`的栈帧中

- `x`,`y`是`incoming arguments`
- `z`是`local variable`
- 调用`g(z)`时，`z`可能被放在`outgoing arguments`区域
- `f`返回后要回到调用`f`的地方，所以需要`return address`
- 如果计算过程中用到了临时值，就可能放在`temporaries`
- 如果某些寄存器会被覆盖，就要先放到`saved registers`
</aside>
- 假设一个函数`g(...)`调用了函数：`f(a1,...,an)`
  - `g`:调用者`caller`
  - `f`:被调用者`callee`
- 当`g`调用`f`时
  - 栈指针`SP`指向`g`传给`f`的第一个参数
  - `f`通过简单地从栈指针`SP`中减去栈帧大小，为自己分配一个栈帧

![进入函数f](/my-blog/2026/05/09/compile/Chapter6/image-183.png)

- 当进入函数`f`时
  - 把旧的帧指针`FP`保存到当前栈帧的内存中
  - 执行`FP=SP`
  - 然后执行`SP = SP - framesize`
- 当函数`f`退出时
  - 执行`SP = FP`
  - 取回之前保存的旧`FP`
- 这种安排在以下情况下很有用
  - `f`的栈帧大小可能变化
  - 栈帧**在栈上不总是连续排列**

### 6.1.2 Registers

- 访问寄存器比访问内存更快
- 现代机器通常大约有32个寄存器。但是许多不同的过程和函数都需要使用寄存器
- 假设
  - 函数`f`正在使用寄存器`r`来保存一个局部变量，并且调用了过程`g`
  - `g`也需要使用寄存器`r`来进行自己的计算
  - 那么在`g`使用`r`之前，必须**先保存`r`的值**，比如把它**存到栈帧中**；等`g`用完之后，再把它**从栈帧中恢复出来**
- 如果保存和恢复`r`是`caller`的责任，也就是调用者`f`的责任，那么`r`是一个`caller-save register`

```
f 使用 r 保存局部变量
f 准备调用 g
f 先把 r 保存到自己的栈帧里
call g
g 可以随便使用 r
g 返回
f 再把 r 从栈帧中恢复
```

-  如果保存和恢复`r`是`callee`的责任，也就是被调用者`g`的责任，那么`r`是一个`callee-save register`
   -  例如：保存`frame pointer`的寄存器通常属于这类

```
f 使用 r 保存局部变量
f 调用 g
g 如果想使用 r，必须先保存 r 的旧值
g 使用 r 做自己的计算
g 返回前恢复 r
返回 f 后，f 发现 r 里的值还在
```

### 6.1.3 Parameter Passing

- Tiger使用值传递(`Pass-by-value`)
  - 实参的值会被传递给形参，并作为形参的值建立起来
  - 对形参的修改不会影响到实参

<aside class="admonition question">
如果参数只通过栈传递，会造成**不必要的内存访问开销**
</aside>
因为每次调用函数，都要把**参数写入内存中的栈帧**；被调用函数再**从栈中读出来**。内存访问比寄存器慢

现在机器的参数传递约定通常规定：

- 一个函数的前`k`个参数通常通过寄存器传递，比如`k=4`或`k=6`
- 剩下的参数再通过**内存传递**

也就是说，现代调用约定一般是：

```
前几个参数：放寄存器
多出来的参数：放栈上
```

这样可以减少内存访问，提高函数调用效率

#### 参数寄存器带来的问题

```c
void f(int a) {
    int z = ...
    h(z);
    ...
    int t = a + 2;
    ...
}
```

- 假设函数`f`在寄存器$r_1$接收参数，并调用`h(z)`
- `f`必须把`z`也放到$r_1$中传给`h`
- 因此，`f`在调用`h`之前，应该把$r_1$中旧的内容保存到自己的栈帧中
- 这种内存开销本来是希望通过**寄存器传参**来避免的

#### 如何避免额外内存访问

**情况1**：如果在调用`h(z)`的位置，参数`a`已经是一个 **dead variable**(死变量)，那么`f`可以直接覆盖`r1`，不需要保存它

> 死变量就是指这个变量**之后不会再被使用**

**情况2**：叶过程(`leaf procedure`)不需要把传入参数写到内存中

> 叶过程：不会再调用其他过程的过程

<aside class="admonition example">
```c
int f(int a) {
    return a + 1;
}
```

它不调用`g`,`h`之类的函数，所以它不会需要把参数寄存器`r1`用来给别人传参

因此参数`a`可以一直留在寄存器里，不用写到栈帧中，这可以减少内存访问
</aside>
**情况3**：一些优化编译器使用 **过程寄存器分配**(`inter-procedural register allocation`)

它们会一次性分析整个程序中的所有函数

然后给不同过程分配不同的寄存器，用来接收参数和保存局部变量

<aside class="admonition example">
如果`f`经常调用`h`，编译器可以尝试让`f`的某些长期变量不要放在`h`也会用的寄存器中
</aside>
**情况4**：有些体系结构具有 **寄存器窗口**(`register windows`)，因此每次函数调用都可以**分配一组新的寄存器**，而**不需要产生内存访问**

### 6.1.4 Dangling Reference(悬空引用)

- 允许程序员获取参数的地址

<aside class="admonition example">
在下面的函数中获取参数`x`的地址

```c
int *f(int x) {
    return &x;
}
```

- 函数`f`返回，它的栈帧会弹出，`x`所在的那块内存已经不再属于`f

```c
int *p = f(10);
```

这里`p`指向的是一个已经失效的栈帧位置

如果这个地址的生命周期超过了当前栈帧的生命周期，就可能导致`dangling reference`
</aside>
- `dangling reference`:指针还在，但是它**指向的对象已经不存在了**

为了解决这个矛盾：参数通常通过**寄存器传递**，但是参数又可能**需要有地址**

任何**被取地址的参数**，在进入函数时都必须被**写入一个内存位置**

总结起来相当于有两个问题

- 参数通过寄存器传递时，没有天然内存地址，如果代码需要`&x`，编译器必须把`x`存入栈帧，让它有地址
- 即使`x`被放到了栈帧里，这个地址也只能在函数调用期间有效。函数返回后，**栈帧销毁**，地址就失效了

### 6.1.5 Call-by-reference

- 一种更正式的获取局部变量地址的方法，是使用 **call-by-reference**
  - 使用`call-by-reference`时，如果把`x`作为参数传给`f(y)`

其中`y`是一个 **按引用传递**的参数，那么编译器生成的代码会传递`x`的地址，而不是传递`x`的内容

- 在函数内部每次使用`y`时，编译器都会**额外生成一次指针解引用操作**
- 使用引用传递时，不会出现`dangling reference`,因为`y`必须在`f`返回时消失，而`f`返回发生在`x`的作用域结束之前

<aside class="admonition example">
比如有一个函数

```c
void f(ref int y) {
    y = y + 1;
}
```

然后调用

```c
int x = 10;
f(x);
```

如果`y`是引用参数，那么调用`f(x)`时，实际传进去的不是`x`的值`10`，而是`x`的地址

每一次`y = y + 1`实际上相当于`*addr_y = *addr_y + 1;`,也就是每次读写`y`，都要先通过地址找到真正的变量位置

这种方法始终可以保证：**x的寿命比y长**
</aside>
### 6.1.6 Return Address

<aside class="admonition question">
假设函数`g`调用了函数`f`，当`f`返回时，应该返回到哪里
</aside>
- 如果`g`中的`call`指令位于地址`a`，那么通常正确的返回位置是`a+1`，也就是`g`的下一条指令

> 这里的`a+1`只是抽象表达下一条指令

这就叫做 **return address**(返回地址)

在现代机器中，`call`指令通常只是把返回地址放入一个指定寄存器

> 对于`MIPS`，这个寄存器是`$ra`

- 一个`non-leaf procedure`必须把它写入栈中(否则地址寄存器中会存入新的返回地址，原有的返回地址就会被覆盖)
  - 除非使用了`inter-procedural register allocation`(过程间寄存器分配)
- 一个`leaf prcedure`(叶过程)不需要这样做

### 6.1.7 Frame-Resident Variables

驻留在栈帧中的变量

- 现代过程调用约定通常会
  - 用寄存器传递函数参数
  - 用寄存器传递返回地址
  - 用寄存器返回函数结果
- 很多局部变量和中间结果也会被分配到寄存器中

<aside class="admonition question">
什么时候需要把值写入内存，也就是写入`stack frame`中
</aside>
只有在必要时，值才会被写入内存，也就是写入栈帧。原因包括

- 变量会被按引用传递，所以它必须有一个内存地址
  - 例如C语言中的`&`操作符
- 变量会被当前过程内部嵌套的过程访问
- 这个值太大，无法放进单个寄存器
- 变量是数组，因此需要地址运算来访问它的元素
- 保存该变量的寄存器被某些特定用途需要使用(比如前面讲过的参数传递)
- 局部变量和临时值太多，寄存器放不下，于是其中一些必须被`spill`（溢出）到栈帧中


**变量逃逸escape**

一个变量如果满足一下情况，就称为`escape`

- 它被引用传递
- 它的地址被取出（例如`&`操作符）
- 它被嵌套函数访问


<aside class="admonition note">
- 寄存器保存：
    - 一些参数
    - 返回地址
    - 返回值
    - 一些局部变量和临时变量

- 栈帧保存：
    - 按引用传递的变量，或者被取地址 & 的变量
    - 被当前过程内部嵌套过程访问的变量
    - 太大而无法放进寄存器组的变量
    - 数组变量，因为访问数组元素需要地址运算
    - spill 出来的寄存器，也就是局部变量太多，寄存器放不下，所以必须存到栈帧中
</aside>
### 6.1.8 如何实现块结构

#### 1. Static Link

- `Block Structure`:在允许嵌套函数声明的语言中(`Pascal`,`ML`,`Tiger`)，内部函数可以**使用外部函数中声明的变量**

<aside class="admonition question">
一个嵌套函数如何访问非局部变量？
</aside>
我们可以通过 **栈指针**访问**局部边变量**，但是想访问外层函数的变量，就不能只靠当前栈指针了

```go
type tree - {key: string, left:tree, right:tree}

function prettyprint(tree: tree): string = 
let
    var output := ""

    function write(s:string) = 
        output := concat(output, s)
    
    function show(n: int, t: tree) =
        let
            function indent(s: string) = 
                (for i:=1 to n
                    do_write(" ");
                output := concat(output, s);
                write("\n");
                )
        in 
            if t = nil
            then ident(" ")
            else (
                ident(t, key);
                show(n+1, t.left);
                show(n+1, t.right);
            )
        end
in
    show(0, tree);
end
```

<aside class="admonition question">
如何实现：

- `write`必须能够访问`prettyprint`的栈帧
- `ident`必须能够访问`show`和`prettyprint`的栈帧
</aside>
一种合理的解决办法是使用 **静态链**(`static links`)

每当函数`f`被调用时，系统会给它传入一个指针。这个指针指向程序文本中 **直接包围`f`的函数`g`的最近一次活动记录**。这个指针就叫做`static link`

> 更简单地说就是如果函数`f`写在函数`g`里面，那么调用`f`的时候，`f`的栈帧里面会存一个指针，指向`g`当前哪次调用的栈帧

![static link 示意图](/my-blog/2026/05/09/compile/Chapter6/image-184.png)

```
g 的栈帧
↑
static link
↑
f 的栈帧
```

这样`f`要访问`g`的变量时，就可以

- 先通过`f`的`static link`找到`g`的栈帧
- 再通过偏移量找到`g`里面的变量

<aside class="admonition example">
```c
int g(int x) {
    int f(int y) {
        ....
    }

    return f(x) + 1;
}
```

- `f`是定义在`g`里面的
- 所以`f`的栈帧中会有一个 **static link**
- 这个`static link`指向`g`的栈帧
- 这样`f`就可以访问`g`里面的变量，比如`x`
</aside>
对于前面我们给到的`prettyprint`这个函数的代码

- 我们把`prettyprint`自己的帧指针作为`show`的`static link`传进去。因为`prettyprint`是`show`在程序文本中的**直接外层函数**，也就是说，在`prettyprint`里面调用了`show(0, tree)`
- `show`调用`show`时，**传递的是它自己的`static link`**，而不是它自己的`frame pointer`，作为新的`show`的`static link`
  - `static link`看的是**词法嵌套关系**，不是运行时谁调用谁
  - 无论是第一次调用`show`还是递归调用`show`，每一个`show`的直接外层函数永远都是`prettyprint`,而不是另一个`show`

<aside class="admonition question">
`indent`如何使用来自`prettyprint`栈帧中的`output`
</aside>
`indent`函数使用了`output`和`n`两个非局部变量

- `n`是`show`的参数
- `output`在`prettyprint`中定义

词法嵌套关系是：

```
prettyprint
 └── show
      └── indent
```

所以`ident`要访问`output`,需要沿着`static link`走两层

```
indent frame
   ↓ static link
show frame
   ↓ static link
prettyprint frame
   ↓
output
```


<aside class="admonition example">
**源代码**

```c
int f(int x, int y)
{
    int m;

    int g(int z)
    {
        int h()
        {
            return m + z;
        }

        return 1;
    }

    return 0;
}
```

**编译后**

```c
int f(link, int x, int y)
{
    int m;

    int g(link, int z)
    {
        int h(link)
        {
            return link->prev->m + link->z;
        }

        return 1;
    }

    return 0;
}
```
</aside>
- 使用静态链接访问非局部变量
  - 每个函数都会被标注它的 **嵌套深度**(`enlosing depth`)
  - 当一个位于深度`n`的函数访问一个位于深度`m`的变量时
    - 编译器生成代码，让程序沿着`static link`向上爬`n-m`层，找到正确的活动记录，也就是正确的栈帧
    - **当前函数深度-变量声明所在函数深度 = 需要沿着static link走几步**
- 优点：参数传递的额外开销小，每次调用嵌套函数时只需要额外传一个参数
- 缺点：访问非局部变量时，需要沿着`static link`向上爬，会有额外开销
  - 每次访问变量，都可能需要一串间接内存引用
  - **间接引用的次数=变量声明所在函数和变量使用所在函数之间的嵌套深度差**
  - 函数可能嵌套很深

#### 2. Display 表/显示表

实现块结构(`Block Structure`)有几种方法

- `stack link`(静态链)
- `Display`:一个**全局数组**，数组中存放**指向各层栈帧的指针**
  - 每个函数都会被标注一个**静态嵌套深度**(`static nesting depth`)
  - 这个数组中第`i`个位置，指向**最近一次进入的**、**静态嵌套深度为`i`**的过程/函数

<aside class="admonition example">
![Display](/my-blog/2026/05/09/compile/Chapter6/image-185.png)
</aside>
#### 3. Lambda Lifting

当`g`调用`f`时，如果`g`中的某个变量**实际上会被`f`访问**，或者会被**嵌套在`f`内部的某个函数访问**，那么这个变量就会作为一个**额外参数**传递给`f`

- 通过把非局部变量当做形式参数重写程序
- 这种**翻译/转换**过程**从最内层的过程开始**，然后**逐步向外处理**

> 一句话总结就是把内层需要的外层变量直接作为参数传进来

<aside class="admonition example">
**原始嵌套函数**
```cpp
int f(int x, int y)
{
    int m;
    int g(int z)
    {
        int h()
        {
            return m + z;
        }
        return 1;
    }
    return 0;
}
```

**Lambda Lifting后的形式**

```cpp
int f(int x, int y)
{
    int m;
    int g(int &m, int z)
    {
        int h(int &m, int &z)
        {
            return m + z;
        }
        return 1;
    }
    return 0;
}
```

- `g`额外接收了`m`
- `h`额外接收了`m`和`z`
</aside>
### 6.1.9 Higher-Order Functions

**允许函数作为返回值就是支持高阶函数**

- 使用栈时，我们假设：当函数`f`返回之后，它的局部变量就**不会再被使用**了
- 在同时支持 **嵌套函数**和 **函数值变量**的语言中，可能需要在一个函数返回之后，仍然保留它的局部变量

```ml
fun f(x) =
  let fun g(y) = x + y
  in g
  end

val h = f(3)
val j = f(4)

val z = h(5)
val w = j(7)
```

定义函数`f(x)`:

- 在`f`内部定义函数`g(y)=x+y`;
- 然后`f`返回`g`
- 当`f(3)`执行完之后，按普通栈的规则，`f`的栈帧应该被弹出，`x=3`也应该小时，但是`f(3)`返回了内部函数`g`，并赋给了`h`
  - 随后`val z = h(5)`，此时`h`其实就是那个`g`，它还需要访问当初的`x=3
  - `x`不能简单地放在栈中，然后在`f`返回时销毁

<aside class="admonition note">
这就是 **闭包问题**

在这种语言里，`h=f(3)`得到的不是普通函数，而是一个闭包：**函数代码+它需要记住的外部变量环境**
</aside>
```c
int (*f(int x)) {
    int g(int y) {
        return x + y;
    }
    return g;
}

int (*h)() = f(3);
int (*j)() = f(4);
int z = h(5);
int w = j(7);
```

函数`f`返回一个函数`g`，而`g`内部还要使用`f`的参数`x`

这里的问题来自于：**嵌套函数**和 **函数作为返回值**这两个特性的结合

## 6.2 Frames in The Tiger Compiler

### 6.2.1 Frames in T he Tiger Compiler

`Frame`模块的接口大概长这样：

```cpp
/* frame.h */
typedef struct F_frame *F_frame;
typedef struct F_access_ *F_access;
typedef struct F_accessList_ *F_accessList;

struct F_accessList_ {
    F_access head;
    F_accessList tail;
};

F_frame F_newFrame(Temp_label name, U_boolList formals);
Temp_label F_name(F_frame f);
F_accessList F_formals(F_frame f);
F_access F_allocLocal(F_frame f, bool escape);
```

- 抽象接口`frame.h`会由一个和目标机器相关的模块来实现
  - 比如目标机器是`MIPS`，就由`mipsframe.c`来实现

```c
/* mipsframe.c */
#include "frame.h"
...
```

> `frame.h`只定义通用接口，不关心具体机器细节；真正怎么分配栈帧、寄存器、偏移量，要由具体机器版本的文件来实现

#### F_frame是什么

```cpp
/* frame.h */
typedef struct F_frame_ *F_frame;

F_frame F_newFrame(Temp_label name, U_boolList formals);
Temp_label F_name(F_frame f);
```

- `F_frame`类型保存了一个函数栈帧的信息
- `F_frame`类型保存了这个栈帧中分配的**形式参数**和**局部变量**的信息
- `F_newFrame(f,l)`:为函数`f`创建一个新的栈帧，这个函数有`k`个形式参数
  - `l`是一个长度为`k`的布尔列表 
  - 对于每一个参数，如果它会逃逸，则对应位置为`true`


```cpp
/* frame.h */
typedef struct F_access_ *F_access;
```

- `F_access`类型描述**形式参数和局部变量**的**位置**，它们可能在**栈帧**中，也可能在**寄存器**中
  - 本身是一个抽象数据类型，具体内容只在`Frame`模块内部可见

```cpp
/* mipsframe.c */
#include "frame.h"

struct F_access_ {
    enum { inFrame, inReg } kind;
    union {
        int offset;       /* InFrame */
        Temp_temp reg;    /* InReg */
    } u;
};

static F_access InFrame(int offset);
static F_access InReg(Temp_temp reg);
```

- `kind`字段用来判断变量在哪里
  - `kind==inFrame`，那么变量在栈帧中
  - `kind==inReg`,那么变量在寄存器中
- `InFrame(x)`:表示变量在栈帧中，偏移量是`x`
- `InReg(t84)`:表示变量在临时寄存器`t84`中

| 形式              | 含义                                        |
| ----------------- | ------------------------------------------- |
| `InFrame(offset)` | 变量放在当前函数栈帧里，用 FP + offset 访问 |
| `InReg(temp)`     | 变量放在寄存器/临时变量中，用 temp 访问     |


```cpp
F_accessList F_formals(F_frame f);
```

`F_formals`返回函数`f`的**形式参数访问列表**

- `F_formals`这个接口函数会取出一个包含`k`个`access`的列表，用来表示这`k`个形式参数在运行时被存放的位置

<aside class="admonition warning">
这些位置是从被调用函数`callee`内部的视角来看的
</aside>
- 同一个参数，在调用者和被调用者看来，可能**位置是不一样的**
  - 情况一：参数通过栈传递
    - 调用者视角：参数相对于 **SP栈指针**的偏移量
    - 被调用者视角：参数相对于 **FP帧指针**的偏移量
  - 情况二：参数通过寄存器传递
    - 调用者把参数放在寄存器`6`中
    - 被调用者内部可能把它看成寄存器`13`中的值
 > 这个过程叫做 `shift of view`


- 视角转换取决于**目标机器的调用约定**
- 它必须由`Frame`模块处理，而且从`newFrame`开始就要处理
- 对于每一个形式参数，`newFrame`必须计算两件事
  - 这个参数在函数内部会被怎么看到(它是在某个寄存器中，还是在某个`frame`位置中)
  - 需要生成**哪些指令**来实现这种视角转换

### 6.2.2 Representation of Frame Descriptions

`Frame`模块的视线应该把`F_frame`类型的**具体表示隐藏起来**，不让`Frame`模块之外的客户端知道

也就是说，外部模块只知道

```c
typedef struct F_frame_ *F_frame;
```

但不知道`struct F_frame_`里面**具体有什么字段**

> 因为不同目标机器的栈帧布局不一样

`F_frame`是一个数据结构，用来保存

- 所有形式参数的位置
- 实现`view shift`所需要的指令
- 到目前为止已经分类了多少个局部变量
- 函数及其代码开始位置的`label`

<aside class="admonition example">
```tiger
function g(a:int, b:int, c:int) = ...
```

编译器需要知道

- `a`在`frame`里还是寄存器里
- `b`在`frame`里还是寄存器里
- `c`在`frame`里还是寄存器里
- 函数入口时要不要把参数从机器寄存器搬到临时寄存器
- 要不要给逃逸变量分配栈空间
</aside>
### 6.2.3 Local Variables

- 有些局部变量保存在 **栈帧frame**中，另一些局部变量保存在 **寄存器**中
- 为了在某个栈帧`f`中分配一个新的局部变量，语义分析阶段会调用

```c
F_access F_allocLocal(F_frame f, bool escape);
```

> 作用是为一个新的局部变量分配位置

- 如果`escape=True`,那么 `F_allocLocal` 返回一个 InFrame 类型的访问位置
- 如果 `escape = False`，那么 `F_allocLocal` 可以返回一个 `InReg` 类型的访问位置

```tiger
function f() =
let var v := 6
in
    print(v);
    let var v := 7
    in print(v)
    end;
    print(v);
    let var v := 8
    in print(v)
    end;
    print(v)
end
```

```c
void f() {
    int v = 6;
    print(v);
    {
        int v = 7;
        print(v);
    }
    print(v);
    {
        int v = 8;
        print(v);
    }
    print(v);
}
```

> 输出结果`6 7 6 8 6`

- 在一个函数体内部，可能会嵌套变量声明块

<aside class="admonition question">
什么时候调用`F_allocLocal`
</aside>
在处理程序时，**每遇到一个变量声明**，就会调用`allocLocal`，为它分配一个**临时寄存器**或**栈帧中的新空间**，并把这个位置和名字`v`关联起来

- 当遇到每个`end`或右花括号时，当前作用域中`v`和它**存储位置的绑定关系**会被忘掉；但是已经在`frame`里分配的空间仍然保留
  - 名字绑定是语义分析阶段的环境问题：当前`v`指向哪个变量声明
- 在整个函数中，每一个变量声明都需要一个**独立的临时寄存器**(`distinct temporary`)或**独立的`frame slot`**
- 寄存器分配器会尽可能使用**更少的寄存器**来表示这些临时变量
  - 第二个和第三个`v`变量可以被放在同一个临时变量/临时寄存器中
- 一个更聪明的编译器也可能注意到：两个存放在`frame`中的变量可以被分配到同一个`frame slot`中

### 6.2.4 Calculating Escapes

- 当调用`F_allocLocal`时，了解变量是否逃逸是很重要的
- `findEscape`函数
  - 遍历整个 **抽象语法树**，查找每一个变量的*逃逸*使用情况
  - 使用 **环境**来记录特定变量是否逃逸

```c
/*escape.h*/
void Esc_findEscape(A_exp exp);
/*escape.c*/
static void traverseExp(S_table env, int depth, A_exp e);
static void traverseDec(S_table env, int depth, A_exp e);
static void traverseVar(S_table env, int depth, A_exp e);
```

## 6.3 Abstraction

### 6.3.1 Temporaries and Labels

编译器在较早阶段不能直接决定**真实寄存器和真实机器地址**，所以先用**抽象名字占位**

- `Temporary`:临时变量，表示一个暂时保存在寄存器中的值
- `Label`:标签，表示某个机器语言位置，但是它的精确地址还没有确定

在编译器中间阶段我们用`abstract registers`和`abstract addresses`作为用来占位的名字

**Temporaries and Labels的接口**

- `Temps`:局部变量的抽象名字
- `Labels`:静态内存地址的抽象名字

```cpp
/*temp.h*/
typedef struct Temp_temp_ *Temp_temp;
Temp_temp Temp_newTemp(void);// 用于创建一个新的临时变量
```

这里定义了一个`Temp_temp`，表示一个抽象的临时变量

```cpp
typedef S_symbol Temp_label; // label底层用的是符号逻辑
Team_label Temp_newlabel(void); // 创建一个新的匿名标签
Temp_label Temp_namelabel(string name); // 创建一个带名字的标签
string Temp_labelstring(Temp_label s);
```

这里定义了`Temp_label`，表示一个抽象标签

```cpp
typedef struct Temp_tempList_ *Temp_tempList;
struct Temp_tempList {
  Temp_temp head;
  Temp_tempList tail;
}
Temp_tempList Temp_TempList(Temp_temp head, Temp_tempList tail);
```

这里定义了一个 **临时变量列表**，比如一个函数调用可能需要多个参数寄存器，或者一条指令使用多个临时变量，就可以用`Temp_tempList`表示：

```
[t1,t2,t3]
```

它是一个链表结构

```
head = t1
tail = [t2,t3]
```

```cpp
typedef struct Temp_labelList_ *Temp_labelList;
struct Temp_labelList_ {
  Temp_label head;
  Temp_labelList tail;
};
Temp_labelList Temp_LabelList(Temp_label head,Temp_labelList tail);
```

这是标签列表。比如一条跳转指令可能有多个跳转目标标签，就可以用`label list`表示

<aside class="admonition example">
**源代码**：

```tiger
if a < b
then c:= a + b
else c:= a - b
```

中间代码阶段可能先生成

```
t1 = a < b
if t1 goto L_true else L_false

L_true:
t2 = a + b
c = t2
goto L_done

L_false:
t3 = a - b
c = t3

L_done:
```

这里：`t1,t2,t3`就是**temporaries**;`L_true, L_false, L_done`就是 **labels**

现在编译器还不需要知道`t1`最终在哪个寄存器或者`L_true`最终机器地址是多少，这些都会留给后续阶段去处理
</aside>
### 6.3.2 Two Layers of Abstraction 

- `Tiger`编译器在 **语义分析**和 **栈帧布局细节**之间会有两层抽象
- `frame.h`和`temp.h`接口提供了与机器无关的视角，用来描述：
  - 存在**内存**中的变量
  - 存在**寄存器**中的变量

也就是会所，我们不需要关心变量到底精确存在哪里

- `Translate`模块在此基础上进一步处理 **嵌套作用域**的概念，比如通过`static links`，并向`Semant`模块提供`translate.h`接口 

![抽象层级结构](/my-blog/2026/05/09/compile/Chapter6/image-186.png)

- 第一层：`frame.h/temp.h`，它们负责抽象
  - 栈帧中的变量位置
  - 寄存器中的临时值
  - 机器相关的访问方式
- 第二层：`translate.h/translate.c`
  - 它负责把**语义分析和底层栈帧**连接起来，尤其处理嵌套函数、`static link`、变量访问等问题



**translate.h**

- `translate`为`semant`管理局部变量和静态函数嵌套
- 它管理每个形参、局部变量和函数的`Tr_Level`

`Tr_level`表示一个函数的**静态层级**，也就是我们之前说的`static nesting depth`

<aside class="admonition example">
```tiger
function outer() =
  let
    function inner() = ...
  in 
    inner()
  end
```

那么

- `outer`是一个`level`
- `inner`是`outer`里面的新`level`
</aside>
`Tr_level`不是运行时栈帧，而是编译时对 **函数嵌套层级**的抽象描述


```cpp
Tr_level Tr_outermost(void);
```

返回最外层`level`，也就是程序最外层环境

```cpp
Tr_level Tr_newLevel(Tr_level parent, Temp_label name,
                     U_boolList formals);
```

创建一个新的函数层级

参数含义

- `parent`:当前函数的外层函数`level`
- `name`:当前函数的`label`
- `formals`:当前函数每个形参是否`escape`

```cpp
Tr_accessList Tr_formals(Tr_level level);
```

返回某个函数`level`的形参访问方式，用于告诉编译器

- 这个函数的参数放在那里
  - 在寄存器里？
  - 在栈帧里？

```cpp
Tr_access Tr_allocLocal(Tr_level level, bool escape);
```

为当前`level`中的一个局部变量分配访问方式

- 如果`escape=true`，说明**变量逃逸**，必须**放在栈帧中**
- 如果`escape=false`,说明变量不逃逸，可以 **优先放在寄存器中**

```cpp
/*new versions of VarEntry and FunEntry*/
struct E_eventry_ {
  enum {E_varEntry, E_funEntry} kind;
  union {
    struct {
      Tr_access access;
      Ty_ty ty;
    }var;
    struct {
      Tr_level level;
      Temp_label label;
      Ty_tylist formals;
      Ty_ty result;
    }fun;
  }u;
};
```

这里定义了 **新的变量条目和函数条目**

**1. 变量条目**

```cpp
struct {Tr_access access; Ty_ty ty;} var;
```

变量现在有两个信息

- `ty`：变量类型
- `access`:变量访问方式

<aside class="admonition example">
```tiger
var x:= 10
```

语义分析时需要知道：`x`的类型是`int`

代码生成时还需要知道：

- `x`在哪里
  - 寄存器？
  - 栈帧？
  - 在外层函数栈帧？

> 这些由`Tr_access`表示

所以变量条目变成：`x -> {access = ... ,ty = Ty_int}`
</aside>
**2. 函数条目**

```cpp
struct {
    Tr_level level;
    Temp_label label;
    Ty_tyList formals;
    Ty_ty result;
} fun;
```

函数条目现在有四个部分

- `level`:函数的静态层级
- `label`:函数入口标签
- `formals`:参数类型列表
- `result`:返回类型

<aside class="admonition example">
``` tiger
function f(a:int):int = a + 1
```

环境中不仅要记录：`f: int -> int`

还要记录

- `f`的`level`是什么
- `f`的代码入口`label`是什么

因为后面生成调用代码时，要知道**跳转到哪个`label`**，也要知道`static link`应该怎么传
</aside>
**3. Tr_access的内部结构**

```cpp
struct Tr_access_ {
    Tr_level level;
    F_access access;
};
```

这表示一个变量的访问方式由两部分组成

- `level`变量定义在哪个静态层级
- `access`在该层级的`frame`中如何访问

其中，`F_access`是`frame`层的访问方式，可能表示：

- `InFrame(offset)`:在栈帧某个偏移
- `InReg(temp)`:在某个临时寄存器

而`Tr_level`用来处理嵌套作用域

<aside class="admonition question">
为什么需要`level`
</aside>
因为访问变量时，**当前函数可能不是变量定义的函数**

<aside class="admonition example">
```tiger
function outer() =
  let
    var x := 1
    function inner() = x + 1
  in
    inner()
  end
```

- `x`定义在`outer`，但是在`inner`里使用

这时编译器需要知道

- `x`属于`outer`的`level`
- 当前代码在`inner`的`level`

然后通过`static link`从`inner`找到`outer`的栈帧，再访问`x`

所以`Tr_access`必须保存变量所属的`Tr_level`
</aside>
### 6.3.3 Managing Static Links

- 我们使用`Translate`模块来管理`static links`
- 为什么不使用`Frame`模块来管理`static link`
  - 许多源语言没有嵌套函数声明
  - `Frame`模块应该独立于具体正在编译的源语言
- `Translate`知道每个`frame`中都包含一个`static link`
  - 这个`static link`会像**参数**一样，通过寄存器传给函数，然后存入该函数的`frame`中
  - 就像一个**普通参数**一样
- 我们会尽可能把`static link`当做一个**参数**来处理
  - 先通过寄存器传入函数
  - 然后函数入口处把它保存到自己的栈帧中

### 6.3.4 Keeping Track of Levels

```cpp
typedef struct Tr_access_ *Tr_access;
typedef ... Tr_accessList ...

Tr_accessList Tr_AccessList(Tr_access head, Tr_accessList tail);

Tr_level Tr_outermost(void);

Tr_level Tr_newLevel(Tr_level parent, Temp_label name,
                     U_boolList formals);

Tr_accessList Tr_formals(Tr_level level);

Tr_access Tr_allocLocal(Tr_level level, bool escape);
```

`Translate`模块如何记录函数的静态前套层级？

```tiger
let
  function f() =
    let
      function g() = ...
    in
      g()
    end
in
  f()
end
```

这里可以理解为

```
outermost level
└── f 的 level
    └── g 的 level
```

编译器需要知道每个函数属于哪一层，因为后面访问非局部变量时，要通过`static link`找到外层函数的栈帧

`Tr_outermost()`的作用就是 **创建或返回一个最外层的level**

这个最外层`level`不是某个具体用户函数的栈帧，而是一个 **根层级**，可以把它理解为：

```
Tr_outermost
├── Tiger 主程序
├── print
├── flush
├── getchar
├── ord
├── chr
├── size
├── substring
├── concat
├── not
└── exit
```

这些库函数都在最外层环境中声明

<aside class="admonition question">
为什么这个最外层`level`不包含`frame`或`frame parameter list`
</aside>
**因为它不对应一次真实的函数调用**

- 普通函数`level`通常需要
  - `frame`:保存参数、局部变量、`static link`
  - `formal parameter list`:记录形参访问位置

但是，`outmost level`只是编译器为了**统一管理作用域**而设置的**根节点**，**不是运行时真正被调用的函数**，所以不需要自己的栈帧，也没有参数列表

```cpp
Tr_level Tr_outermost(void);
```

返回根`level`

```cpp
Tr_level Tr_newLevel(Tr_level parent, Temp_label name,
                     U_boolList formals);
```

创建一个新的函数`level`

- `parent`  表示外层函数的 level
- `name`    表示当前函数的 label
- `formals` 表示形参是否 escape

如果`f`定义在最外层，那么`parent = Tr_outermost()`

如果`g`定义在`f`里面，那么`parent = f的Tr_level`

```cpp
Tr_accessList Tr_formals(Tr_level level);
```

返回某个函数`level`的形参访问方式，比如参数**在寄存器中还是在栈帧中**

```cpp
Tr_access Tr_allocLocal(Tr_level level, bool escape);
```

给某个局部变量分配访问位置

