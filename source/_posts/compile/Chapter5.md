---
title: Chapter 5 Semantic Analysis
date: 2026-05-5 17:20
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

```cpp
string x;
int z;

x = "hello world";
z = x + 1;
```

> `parser`很可能会接受这个程序的结构，其很类似于一个合法程序

`parser`只能判断上形式上能不能写成`exp + exp`，但是不能判断这**两个表达式的类型能不能真的相加**

这就是CFG的局限：

- 它只能处理 **syntax**(句法/结构)
- 不能处理很多需要**上下文信息、类型信息、运行环境信息**的问题

!!! note
许多事情无法仅仅通过语法分析来决定：

- 变量声明的类型是否与赋给它的值的类型匹配
- 数组访问是否越界
- 一个变量应该存储在哪里(`heap`, `stack`,...)
!!!

> 语义分析阶段做了什么

前面我们提到，`CFG`和`parser`只能判断程序的**语法结构**是否合法,例如判断下面的语句是否符合赋值语句的**形式**

```c
x = y + 1;
```

但是它不能判断

- `x`有没有声明
- `y`有没有声明
- `y + 1`的类型对不对
- `x`的类型能不能接收右边的结果

这些就是语义分析阶段要做的事情：

- 通过AST确定程序的一些 **静态属性**(`static analysis phase`)
  - 变量名的作用域和可见性
    - 每个变量在使用前都已经被声明
  - 变量、函数和表达式类型
    - 每个表达式都有一个合适的类型
    - 函数调用符合函数定义
- 将AST翻译成一种更简单的表示形式，这种表示适合生成机器代码，也就是 **中间表示**(`Intermediate Representation`)


## 5.1 Symbol Tables

- 语义分析阶段的特点是 **符号表**(`symbol tables`)，也叫 **环境**(`environment`)，它们把标识符映射到对应的 **类型和位置**
- **Binding绑定**：**给一个符号赋予含义**，记作$\mapsto$

!!! example 
```c
int a;
string g;
```

那么就有

$$
a \mapsto int
$$
$$
g \mapsto string
$$

意思是

- 名字`a`代表一个int类型变量
- 名字`g`代表一个string类型

所以`binding`解决的问题是：**这个名字到底是什么意思**
!!!

例如：

| Name/Symbol         | Meaning/Attribute           |
| ------------------- | --------------------------- |
| type identifier     | type，例如 int、string      |
| variable identifier | type、value、access info 等 |
| function identifier | 参数类型和返回值类型等      |

- **Environment**(环境)：一组绑定
  - eg. $\sigma_0 = \{g \mapsto string, a \mapsto int\}$
  - 可以理解成：当前语义分析器 **认识哪些名字，以及它们分别代表什么**
- **Symbol table**(符号表)：环境的具体实现
  - `Environment`是一个抽象概念；`Symbol table`是它在程序中的具体实现

> 语义分析阶段会按照一定顺序**遍历抽象语法树**(AST)，同时维护符号表

!!! tip
符号表就是语义分析器回答的是 **这个名字是什么意思**的数据结构
!!!

### 5.1.1 Motivating Example of Symbol Tables

- 假设在第一行引入之前，当前环境是$\sigma_0$

代码：

```go
function f(a: int, b: int, c: int)=
  (
    print_int(a+c);
    let var j:=a + b
        var a:= "hello"
    in print(a);
    print_int(j)
    end;
    print_int(b)
  )
```

- `function f(a: int, b: int, c: int)=`:$\sigma_1 = \sigma_0 + {a \mapsto int, b \mapsto int, c \mapsto int}$
- `let var j:=a + b`:$\sigma_2 = \sigma_1 + \{j \mapsto int\}$
- `var a:= "hello"`:$\sigma_3 = \sigma_2 + \{a \mapsto string\}$

- 标识符声明：`ID`会在符号表中被绑定到某种含义
- 标识符使用：在符号表中查找ID
  - 在第3行，标识符`a`和`b`可以在$\sigma_1$中查到

!!! question
在第3行中，编译器如何知道标识符`j`的类型?

`let var j := a + b`这里右侧表达式是`a + b`

编译器先在当前环境$\sigma_1$中查找$a \mapsto int$和$b \mapsto int$

所以$a + b$的类型是`int`，因此变量$j$的类型可以被推断为$j \mapsto int$

于是环境扩展为$\sigma_2 = \sigma_1 + \{j + \mapsto int\}$
!!!

!!! question
第4行：`var a := "hello"`,$\sigma_2$中包含$a \mapsto int$，现在在`let`的局部作用域中又声明了一个新的变量：`var a := "hello"`,那么a在$\sigma_3$中的绑定是什么？

因为`hello`是字符串，所以新的绑定是$a \mapsto string$

于是环境变成$\sigma_3 = \sigma_2 + \{a \mapsto string\}$

这表示在当前更内层的作用域中，新的`a`会 **override**外层的`a`

所以在$\sigma_3$中查找`a`，得到的是：$a \mapsto string$

而不是原来的：$a \mapsto int$
!!!

!!! warning
$$
X + Y \neq Y + X
$$

这里的`+`不是普通数学加法，而是 **环境扩展/表合并**

例如：$\sigma_2 + \{a \mapsto string\}$

表示：在$\sigma_2$的基础上加上一个新的`a`绑定；如果旧环境里已经有`a`，那么**新的绑定会覆盖旧的绑定**

所以：$\{a \mapsto int\} + \{a \mapsto string\}$

结果查`a`得到：$a \mapsto string$

但是如果反过来查找会导致出现不一样的`a`类型
!!!

- 每个局部变量都有一个它可见的 **作用域**(`scope`)
- 对于`let D in E end`，在D中声明的每个标识符，它的作用域从声明处开始，到`end`结束
- 当语义分析器到达每个作用域的结尾时，属于该作用域的局部标识符绑定会被丢弃
  - 例如，在第6行，$\sigma_3$被丢弃，$\sigma_1$被恢复


**局部变量只在自己的作用域内可见；离开作用域后，它的绑定要从符号表中移除**

### 5.1.2 The Interface of Symbol Tables

- `insert`:向表中插入一个绑定
- `lookup`:查找一个名字，并获得绑定到该名字上的信息
- `beginScope`:进入一个新的作用域
- `endScope`:退出一个作用域，并将符号表恢复到进入该作用域之前的状态

### 5.1.3 Multiple Symbol Tables

在某些语言中，可能同时存在多个活跃环境

- 程序中的每个模块、类或记录都有属于自己的符号表$\sigma$

**Java允许forward reference**

![Java符号表结构](image-167.png)

在同一个包/类集合中，类之间可以互相引用，即使某个类的文本位置在后面

**所以`E,N,D`可以一起放在同一个完整环境$\sigma_7$中编译**

也就是说编译`D`的时候可以知道`N`,即使`N`在文本上可能出现在前面或者后面

**ML也有多个structure，每个structure也有自己的环境，但是它的编译顺序更顺序化**

![ML符号表分析](image-168.png)

举个例子，比如下面这条语句

```sml
structure N = struct
    val b = 10
    val a = E.a + b
end
```

此时N能看到的是$\sigma_0 + \sigma_2$，也就是说，它可以看到

- 外部原始环境$\sigma_0$
- 之前已经定义好的`E`

ML不是一开始就把所有`structure`都放进完整环境，而是按照**变量声明的顺序**进行编译

所以N中可以使用：$E.a$，但是不能使用还没有定义的`D`,这就是ML和Java的最大区别

> 每个`class/structure`都有自己的符号表

有些语言中，一个程序里不只有一张符号表，而是会有**多张符号表同时存在**

原因是

- 每个模块有自己的命名空间
- 每个类有自己的成员表
- 每个结构体/record也有自己的字段表

所以符号表并不是简单的一张全局表，而可能是：

$$
\text{模块名}\mapsto\text{该木块自己的环境}
$$
$$
\text{类名}\mapsto\text{该类自己的环境}
$$

!!! note
- Java是 **先知道所有类名，再编译类体**
- ML是 **按照顺序逐个扩展环境**
!!!

### 5.1.4 Implementing Symbol Tables

#### Imperative Style(命令式风格)

- 修改$\sigma_1$，直到它变成$\sigma_2$
- 当$\sigma_2$存在时，我们不能再在$\sigma_1$中查找东西
- 当我们用完$\sigma_2$后，可以撤销修改，使$\sigma_1$再次恢复回来

![命令式符号表](image-169.png)

**命令式符号表如何高效实现**

命令式风格是直接修改同一张符号表。例如$\sigma_2 = \sigma_1 + {a \mapsto int}$

在命令式实现里，这不是创建一张全新的表，而是把`<a, int>`直接插入当前

!!! question "为什么要用哈希表"
因为大型程序里可能会有非常多标识符，比如

- 变量名
- 函数名
- 类型名
- 类名
- 字段名
!!!

**符号表要支持删除操作**

```c
{
  int a;
}
```

- 进入`{}`时，要插入：$a \mapsto int$
- 离开`{}`时，这个局部变量`a`就不再可见，所以必须删除这个绑定

因此符号表不仅要支持快速查找，还要支持方便删除最近加入的绑定

**哈希表使用外部链式法则**

哈希表可能会出现冲突，也就是不同名字`hash`到同一个桶。

**外部链式法**(external chaining):每个`hash`桶后面挂一条链表，所有hash到这个位置的绑定都放在这条链上

!!! example
```
hash(a) -> <a, string> -> <a, int>
```

这表示同一个名字`a`可能在不同作用域里有多个绑定

最前面的绑定通常是 **最新、最内层**的绑定

```
<a, string> -> <a, int>
```

表示当前查找`a`时，先找到$a \mapsto string$,这会覆盖外层的$a \mapsto int$

这正好支持了 **内层变量遮蔽外层变量**
!!!

**哈希表结构——一个桶数组**

符号表用哈希表实现，每个位置可能挂一条链表，用来解决哈希冲突

```c
struct bucket {
  string key;
  void *binding;
  struct bucket *next;
};
```

定义一个桶节点

- `key`:标识符名字，比如`"a"`,`"x"`
- `binding`:这个名字绑定的语义信息，比如类型、变量位置、函数信息
- `next`:指向同一个哈希桶中的下一个节点，用于外部链式法则

```c
#define SIZE 109
struct bucket *table[SIZE];
```

定义一个大小为109的哈希表数组，每个数组位置是一个桶链表的头指针

```c
unsigned int hash(char *s0) {
  unsigned int h = 0;
  char* s;
  for(s = s0; *s; s++) {
    h = h * 65599 + *s;
  }
  return h;
}
```

这是哈希函数，它把字符串标识符转换成一个整数哈希值。后面通常会用`hash(key)%SIZE`得到它应该放入哪个桶

```c
struct bucket *Bucket(string key, void *binding, struct bucket *next) {
    struct bucket *b = checked_malloc(sizeof(*b));
    b->key = key;
    b->binding = binding;
    b->next = next;
    return b;
}
```

这是创建桶节点的函数。它创建一个新节点，保存`key`、`binding`，并让`next`指向原来的链表头

![哈希表结构示意图](image-171.png)

**insert操作**

```c
void insert(string key, void *binding) {
  int index = hash(key) % SIZE;
  table[index] = Bucket(key, binding, table[index]);
}
```

!!! example
如果原来已经有$a \mapsto int$,现在进入内层作用域，又插入$a \mapsto string$

那么链表会变成$hash(a) \rightarrow <a, string> \rightarrow <a, int>$

也就是说新的绑定放在旧的绑定前面

这样查找`a`时，先找到的是：$a \mapsto string$

它会遮蔽外层的$a \mapsto int$
!!!

- 先通过找到桶的位置
- 创建一个新的桶节点
- 把新节点插入到当前桶链表的最前面

![插入操作的实例](image-170.png)

**lookup操作**

```c
void *lookup(string key) {
  int index = hash(key) % SIZE;
  struct bucket* b;
  for(b = table[index];b;b = b->next) {
    if(strcmp(b -> key, key) == 0){
      return b->binding; // 返回这个名字绑定的语义
    }
  }
}
```

- 这个函数在符号表中查找标识符`key`对应的表项
- 通过哈希函数为`key`计算数组下标`index`
- 遍历`table[index]`这一桶中的bucket链表，寻找匹配项

![lookup操作的流程图](image-173.png)

**pop操作**

```c
void pop(string key) {
  int index = hash(key) % SIZE;
  table[index] = table[index]->next;
}
```

- 找到`key`对应的哈希桶
- 删除链表最前面的节点
- 让桶指针指向下一个节点

![pop操作实例](image-172.png)

#### Functional Style(函数式风格)

- 在常见$\sigma_2$和$\sigma_3$的同时，保持$\sigma_1$处于原始、未被破坏的状态
- 退出作用域的时候只是把当前环境指针从$\sigma_3$切回$\sigma_1$，不需要`undo`

**函数式符号表在不修改旧环境的前提下，高效创建新环境**

前面命令式符号表的做法是：$\sigma_2 = \sigma_1 + \{a \mapsto int\}$。直接修改原来的哈希表，把**新的绑定插进去**。这样效率很高，但是问题是：$\sigma_1$被破坏了。之后如果还想使用旧的环境就必须靠 **undo stack**操作进行恢复

函数式风格的目标正好相反：

> 创建新环境$\sigma'$，但是旧环境$\sigma$仍然保持不变

原来的表是

$$
m1={bat↦1, camel↦2, dog↦3}
$$

现在要创建：$m2=m1+{mouse↦4}$，也就是说，$m_2$比$m_1$多一个绑定：$mouse \mapsto 4$，但是要求是$m_1$仍然可用不能被修改

![m1被修改](image-174.png)

一种看似可行的方法是：**复制整个哈希数组，然后新表`m2`使用新数组，旧表`m1`使用旧数组**

同时为了省一点空间，旧的`bucket`链表可以共享

- 两个表有不同的哈希数组
- 旧的bucket可以共享
- 新增的`mouse`只出现在`m2`里

这样可以确保

- `m1`不变
- `m2`多了`mouse`

但是问题是：**复制整个哈希数组不高效**

因为哈希表的数组通常很大，每插入一个新绑定旧复制整个数组，代价太高

![数组方案](image-175.png)

> 复制数组、共享旧桶，虽然逻辑正确，但效率不好。

为了既保证不改变旧表，还能够高效进行函数式操作，我们可以使用 **二叉搜索树**(`binary search trees`)

- 每个节点包含一个绑定
- 使用字符串比较来排序

$$
m_2 = m_1 + \{mouse \mapsto 4\}
$$

!!! note
前面提到的函数式风格要求

- $m_1$仍然要能使用
- $m_2$是在$m_1$基础上新增了`mouse -> 4`
- 但是不能直接原地修改$m_1$
!!!

- 原来的树是$m_1$
- 其中有
  - `dog -> 3`
  - `bat -> 1`
  - `camel -> 2`
- 要插入新的绑定
  - `mouse -> 4`

> 每个节点都存一个名字和它对应的绑定值

**Insert**:采用**路径复制**(`path copying`)的方法

- 只复制从根到插入为止这条路径上的节点，其他不受影响的子树直接共享

!!! example "插入节点mouse"
- 插入`mouse`时，需要经过根节点`dog`
- 所以复制一个新的`dog`节点
- 新的`dog`左子树仍然指向旧的`bat`子树
- 新的`dog`右子树指向新插入的`mouse`

于是：

- 旧的$m_1$仍然指向旧的`dog`
- 新的$m_2$指向新的`dog`
- `bat`和`camel`这些旧节点可以共享

![函数式风格采用路径复制的例子](image-176.png)

这就实现了 **m1不变**同时 **m2**
!!!

**Lookup**:对于一棵有$n$个节点的平衡树，查找复杂度是 $O(log n)$

!!! note
- `Imperative Style`
  - 进入一个作用域后，通过 **副作用**把绑定加入表中
  - 退出一个作用域时，使用辅助信息来移除之前加入的绑定。旧表可以被重新构造出来
- `Functional Style`
  - 进入一个作用域后，通过在旧环境的基础上添加绑定来创建一个新环境
  - 旧表保持完整，不被破坏
  - 退出一个作用域时，直接取回旧表
!!!

## 5.2 Symbols in the Tiger Compiler

### 5.2.1 Issues with Table Implementations

```c
void *lookup(string key) {
  int index = hash(key) % SIZE;
  struct bucket *b;
  for(b = table[index]; b; b = b -> next){
    if(0 == strcmp(b -> key, key)){
      return binding;
    }
  }
  return null;
}
```

**Problem**:在执行查找时，我们需要进行代价较高的 **字符串比较**(`string comparisons`)

**Solution**:把每个字符串转换成一个 **symbol**(符号对象)

- 每个`symbol object`都关联一个整数值
- 同一个字符串的所有出现都会映射到同一个`symbol`，不同的字符串会映射到不同的`symbol`

!!! warning
- 同一个字符必须映射到同一个symbol
- 不同字符串必须映射到不同`symbol`
!!!

**Important Properties of Symbol**

- 提取一个整数形式的`hash-key`非常快；可以直接使用`Symbol`**指针本身**作为整数`hahs-key`(用于哈希表)

> 这解释了为什么编译器里常常不直接用字符串作为符号表key，而是先把字符串转换为Symbol

- 比较两个`symbol`是否 **相等**很快
- 比较两个`symbol`的 **大于关系**也非常快
  - 这里的 **大于是某种任意规定的顺序**(用于二叉搜索树)

> 因为直接编号就可以

### 5.2.2 Symbols in the Tiger Compiler

- `void*`:在编译器中，我们希望针对不同用途有不同类型的绑定
  - 类型名需要绑定到类型信息
  - 变量和函数名需要绑定到值相关信息

```c
// Symbol接口
typedef struct S_symbol *S_symbol;
S_symbol S_symbol(string); // 把字符串转化为唯一的S_symbol
string S_name(S_symbol); // 将symbol转化为它对应的字符串名字

// Symbol Table接口
typedef struct TAB_table_ *S_table;
S_table S_empty(void); // 创建一个空的符号表
void S_enter(S_table, S_symbol sym, void *value); // 把一个绑定加入符号表 sym ↦ value
void *S_look(S_table, S_symbol sym); // 查找某个symbol对应的绑定信息
void S_beginScope(S_table); // 进入一个新的作用域
void S_endScope(S_table); // 退出当前作用域
```

!!! note
这里最重要的是`void* value`(一个通用指针)

因为不同名字绑定的信息可能不同

- 类型名绑定到类型结构
- 变量名绑定到变量类型、访问位置等
- 函数名绑定到参数类型和返回类型
!!!

#### Symbol接口实现

**创建一个新的symbol对象**

```c
static S_symbol mksymbol(string name, S_symbol next) {
  S_symbol s = checked_malloc(sizeod(*s));
  s -> name = name;
  s -> next = next;
  return s;
}
```

- `name`:保存原始字符串
- `next`:指向同一个哈希桶里的下一个`symbol`

> symbol本身也是要能够哈希表+链表来管理的

**根据字符串返回唯一对应的symbol**

```c
S_symbol S_symbol(string name) {
  int index = hash(name) % SIZE;
  S_symbol syms = hashtable[index];
  S_symbol sym;

  for(sym = syms; sym; sym = sym -> next) {
    if(0 == strcmp(sym -> name, name)){
      return sym;
    }
  }

  sym = mksymbol(name, syms);
  hashtable[index] = sym;
  return sym;
}
```

给定一个字符串`name`，返回唯一对应的`S_symbol`

**从symbol取回原来的字符串名字**

```c
string S_name(S_symbol sym) {
    return sym->name;
}
```

**Symbol的实现本质**：字符串驻留，相同字符串只创建一个唯一的symbol，以后比较名字时只需要比较`symbol`指针即可

#### Symbol Table接口实现

- Tiger编译器的C实现使用`destructive-update environments`
  - 也就是破坏式更新环境(命令式环境)
  - 意思是：进入作用域时直接修改当前符号表，退出作用域再恢复 
- 命令式表使用哈希表实现
- `TAB`:一个通用哈希表模块

**创建一个新的符号表**

```c
S_table S_empty(void) {
  return TAB_empty();
}
```

本质上是调用表模块`TAB_empty()`

**插入一个绑定**

```c
void S_enter(S_table t, S_symbol sym, void *value) {
  TAB_enter(t, sym, value);
}
```

!!! example
```c
S_enter(t, S_Symbol("x"), int_type);
```

意思是：

$$
x \mapsto int
$$
!!!

**查找一个symbol的绑定信息**

```c
void * S_look(S_table t, S_symbol sym) {
  return TAB_look(t, sym);
}
```

**对于destructive-update environments:**

- `S_beginScope`:记录当前符号表状态
- `S_endScope`:把符号表恢复到最近一次尚未结束的`beginScope`之前的状态


```c
static struct S_symbol_marksym = {"<mark>", 0};
```

> 这里定义了一个特殊的`symbol`：`<mark>`。它**不是用户程序中的变量名**，而是一个 **作用域标记**

```c
void S_beginScope(S_table t) {
  S_enter(t, &marksym, NULL);
}
```

进入一个新作用域时，往符号表里插入一个 **特殊标记**

$$
<mark> \mapsto NULL
$$

它的作用是：**记住这个作用域从哪里开始**，之后在这个作用域里插入的变量，都会位于这个`mark`之后

```c
void S_endScope(S_table t) {
  S_symbol s;
  do{
    s = TAB_pop(t);
  }while(s != &marksym);
}
```

退出作用域时不断执行：`TAB_pop(t)`,也就是不断弹出最近插入的绑定，直到弹到`<mark>`为止。

这表示：**把当前作用域内声明的所有局部变量全部删除**，然后**把`<mark>`也删除。**

这样符号表就恢复到了进入该作用域之前的状态

!!! example 
![作用域进入与退出的例子](image-177.png)
!!!

!!! question "如何精确弹出那些绑定"
在`beginScope`之后，我们如何准确地弹出那些绑定
!!!

#### **Auxiliary stack**

- 显示`symbol`被压入符号栈的顺序
- 当这个栈中的每个`symbol`被弹出时，它所在哈希桶中的头部绑定也会被移除
- `beginScope`:向栈中压入一个特殊标记
- `endScope`:不断从栈中弹出`symbol`，直到找到最上面的那个标记

- 可以把辅助栈集成到`Binder`结构中，方法是使用一个全局变量`top`，表示**表中最近一次被绑定的symbol**
- `Pushing`:把当前的`top`复制到`Binder`的`prevtop`字段中

```c
struct TAB_table_ {
  binder table[TABLESIZE];
  void *top;
}
```

一张符号表中有

- `table[TABLESIZE]`:哈希表数组
- `top`：记录最近一次插入的symbol

```c
t -> table[index] = Binder(key, value, t->table[index], t->top);
```

意思是：向哈希桶中插入一个新的绑定，同时把旧的`top`传给新的`Binder`

**函数创建一个新的绑定节点Binder**

```c
static binder Binder(void *key, void *value, binder next, void *prevtop) {
    binder b = checked_malloc(sizeof(*b));
    b->key = key;
    b->value = value;
    b->next = next;
    b->prevtop = prevtop;
    return b;
}
```

- `key`:symbol
- `value`:绑定的语义信息
- `next`:指向同一个哈希桶里的下一个绑定
- `prevtop`:记录插入当前绑定之前的`top`

!!! example
![辅助栈的操作流程](image-178.png)
!!!

## 5.3 Type Checking

!!! question
- 什么是合法的类型表达式？
  - 例如`int`, `string`, `nil`, `array of int`...
- 如何定义两个类型是等价的？
- 类型检查规则是什么
!!!

### 5.3.1 Types in Tiger Programming Language

- 原始类型：`int`, `string`
> 它们是语言内置的基本类型
- 构造类型：由其他类型构造出来的 **record**和 **array**
  - 其他类型可以是原始类型、`record`和`array`

!!! example
```tiger
type point = {x:int, y:int}
type intArray = array of int
```

这里

- `point`是一个`record`类型
- `intArray`是一个`array`类型

它们都是由其他类型构造出来的
!!!

- 一个类型标识符的绑定是什么

![tiger语法实例](image-179.png)

- 类型标识符的绑定是什么

> 左侧文法同上

```c
typedef struct Ty_ty_ *Ty_ty; // 指向类型结构体的指针
struct Ty_ty_ {
  enum{
    Ty_record, Ty_nil, Ty_int, Ty_string,Ty_array, Ty_name, Ty_void
  } kind;
  // union用来保存不同类型需要的具体信息
  union {
    Ty_fieldList record;
    Ty_ty array;
    struct {
      S_symbol sym;
      Ty_ty ty;
    } name;
  } u;
};
```

| kind        | 含义              |
| ----------- | ----------------- |
| `Ty_record` | record 类型       |
| `Ty_nil`    | nil 类型          |
| `Ty_int`    | int 类型          |
| `Ty_string` | string 类型       |
| `Ty_array`  | array 类型        |
| `Ty_name`   | 类型名 / 类型别名 |
| `Ty_void`   | 无返回值类型      |

`nil`和`void`也被作为类型表示出来

```
nil  -> Ty_nil
void -> Ty_void
```

- `nil`通常用于`record`的空值
  - `var r : recordType := nil`
- `void`通常表示没有返回值，比如某些语句表达式或过程调用 

```c
Ty_Name(sym, NULL)
```

> 先知道有一个类型名`sym`，但是它具体指向什么类型暂时还没填，等后面执行完，再把`NULL`填成真正的类型

用于处理`mutually recursive types`，相互递归类型

!!! example
```tiger
type a = {next: b}
type b = {prev: a}
```

这里`a`和`b`互相引用，但是问题是

- 分析`a`时，需要知道`b`
- 分析`b`时，需要知道`a`
!!!
所以编译器不能等完全知道真实类型后再加入符号表，而是先放一个**占位符**

**总结**：类型名在符号表中绑定到`Ty_ty`,而`Ty_ty`是Tiger编译器内部表示各种类型的统一数据结构

### 5.3.2 Type Equivalence

- `Name equivalence(NE)`:当且仅当`T1`和`T2`是由 **完全相同的类型声明**定义出来的**相同类型名**时，`T1`和`T2`等价

!!! example
```tiger
type A = {x:int, y:int}
type B = {x:int, y:int}
```

虽然A和B结构完全一样，但是它们来自两个不同的类型声明，所以在名字等价下：`A≠B`

也就是说：**结构一样，不代表类型一样**

如果是

```tiger
type A = {x:int, y:int}
type B = A
```

那么B是基于A定义的别名或引用，这时通常会认为它们指向同一个类型声明
!!!

- `Structural equivalence(SE)`:当且仅当`T1`和`T2`**是由完全相同的构造器**按 **相同的顺序**组成时，`T1`和`T2`等价

!!! example
```tiger
type A = {x:int, y:int}
type B = {x:int, y:int}
```

在结构等价下，它们都是由相同字段组成的`record`类型，所以：`A=B`
!!!

**Tiger使用name等价**

#### Type Equivalence in Tiger

- 每一个Tiger语言中的`record type expression`都会创建一个新的、不同的`record`类型

**Tiger非法表达式**

```tiger
let type a = {x: int, y: int}
    type b = {x: int, y: int}
    var i : a := ...
    var j : b := ...
in i = j
end
```

在`Tiger`中，a和b虽然是结构完全一样的变量，但是它们是由两个不同的`record type expression`创建出来的，所以`a≠b`

**Tiger合法表达式**

```tiger
let type a = {x: int, y: int}
    type b = a
    var i : a := ...
    var j : b := ...
in i = j
end
```

这里`b`不是重新创建一个新的`record`结构，而是直接引用已有的类型`a`，所以`a = b`

#### Namespaces in Tiger

- Tiger有两个彼此独立的命名空间
  - `Types`:类型
  - `Functions and variables`:函数和变量

类型名和变量/函数名分属两个命名空间，所以`type a`和`var a`可以共存；但是变量名和函数名**在同一命名空间**，所以`var a`会遮蔽`function a`

![不同绑定属于命名空间的例子](image-180.png)

#### Environments for Type Checking

Tiger维护两个环境

- **Type Environment**
  - 把类型`symbol`映射到它们对应的类型对象:$symbol \rightarrow Ty\_ty$

**类型环境记录**：类型名对应什么**真实类型**

!!! example
```tiger
type a = int
```

那么环境中加入：$a↦Ty\_Int$
也就是`symbol(a) -> Ty_int`

所以当编译器看到`var(char) : a := 5`,这里的`a`出现在类型位置，编译器就去**类型环境**中查出`a`，得到它代表`int`类型 
!!!

- **Value Environment**
  - 把变量`symbol`映射到它们对应的类型对象
  - 把函数`symbol`映射到它们的参数类型和返回值类型对象：$symbol \rightarrow \{Ty\_tyList formals, Ty\_ty result;\}$

值环境记录**变量和函数的类型**

!!! example

对于变量：

```tiger
var a : a : = 5
```

这里**左边第一个`a`是变量名**，**冒号后面的`a`是类型名**

这条声明会在值环境中加入$a \mapsto Ty\_int$

也就是`symbol(a) -> Ty_int`表示变量`a`的类型是`int`。
!!!

变量环境中存的是：**变量名 -> 变量类型**

对于函数，值环境要保存更多信息

比如函数：

```tiger
function f(x:int, y:string): int = ...
```

值环境中药记录

- 参数类型列表
- 返回值类型

!!! example
$$
symbol→struct \{Ty\_tyList formals, Ty\_ty result;\}
$$

意思是函数名绑定到一个结构体

```c
struct {
    Ty_tyList formals;
    Ty_ty result;
}
```

其中：

- `formals`:参数类型列表
- `result`:返回值类型
!!!

> 为什么变量环境不映射到类型名symbol（变量名为什么不绑定到类型名`a`这个symbol而是直接绑定到`Ty_ty`类型对象）

**类型名可能是别名，可能还会继续指向别的类型**

!!! example 
```tiger
type a = int
type b = a
var x : b := 5
```

如果变量`x`只绑定到类型名symbol `b`，那么之后还要再查：`b -> a -> int`这回增加复杂度
!!!

所以更好的做法是：变量 **直接绑定到真实类型对象**

$$
x \mapsto Ty\_Int
$$

这样类型检查时更方便判断

!!! example
```tiger
let type a = int
    var a : a := 5
    var b : a := a
in b+a
end
```

这里用到了很多`a`，我们来逐个分析

- `type a = int`:这里的a是类型名，加入类型环境 $type\_env(a) = Ty\_Int$
- `var a:a`:
  - 第一个`a`是变量名，属于值环境
  - 第二个`a`是类型名，属于类型环境
  - 含义：声明一个变量`a`，它的类型是类型名`a`所代表的类型，也就是`int`
  - 加入值环境：$value\_env = Ty\_Int$
- `var b : a := a`
  - `: a`:是类型名，去类型环境查$type\_env(a) = Ty\_Int$
  - `:= a`:是表达式中的变量，去值环境查$value\_env = Ty\_Int$
  - 所以`b`也是`int`
- `in b+a`:
  - 这里的`b`和`a`都出现在表达式中，所以都去 **值环境**查找
  - `a`和`b`的值类型都是`int`
  - 因此`b+a`是合法的整数加法表达式
!!!


!!! note
```tiger
var a : a := 5
```

- `var`后面的`a`是变量名
- `:`后面的`a`是类型名
- `:=`右边表达式里的`a`是变量名
!!!

#### 值环境条目(environment entry)

主要用于记录

- 变量名绑定到什么类型
- 函数名绑定到什么参数类型和返回类型

**1. 定义环境条目类型**

```c
typedef struct E_eventry_ *E_eventry;
```

这里定义了一个指针类型`E_eventry`，它指向结构体`struct E_enventry_`，也就是说我们可以用`E_eventry x;`表示一个 **环境条目**

**2. 环境条目的具体结构**

```c
struct E_eventry_ {
  enum {E_varEntry, E_funEntry} kind; 
  union {
    struct {Ty_ty ty;} var; // 变量只需要记录一个信息
    struct {
      PTy_tyList formals;
       Ty_ty result;
    } fun; // 函数记录两个信息：参数类型列表和返回值类型
  } u;
}
```

- `kind`函数表示条目是 **变量条目**还是 **函数条目**

**3. 构造函数接口**

```c
E_enventry E_VarEntry(Ty_ty ty);
```

- 用来创建**变量条目**

```c
E_enventry E_FunEntry(Ty_tyList formals, Ty_ty result);
```

- 用来创建 **函数条目**


!!! example
```c
E_VarEntry(Ty_Int()) //创建一个表示变量类型为int的环境条目
E_enventry E_FunEntry(Ty_tyList formals, Ty_ty result); // 函数参数类型为 int, string，返回类型为 int
```
!!!

```c
S_table E_base_tenv(void); /*Ty_ty environment*/
S_table E_base_venv(void); /* E_enventry environment */
```

- 用于创建基础环境
- 通常会预先放入`Tiger`内置类型

### 5.3.3 Type-Checking for Tiger

- `Semant`模块(`semant.h`,`semant.c`)对**抽象语法树**进行**语义分析**，包括**类型检查**
- 语义分析模块包含四个在语法树上递归遍历的函数

```c
struct expty transVar(S_table venv, S_table tenv, A_var v);
struct expty transExp(S_table venv, S_table tenv, A_exp a);
void transDec(S_table venv, S_table tenv, A_dec d);
Ty_ty transTy(S_table tenv, A_ty a);
```

- 类型检查器是抽象语法树上的一个递归语法树——`transExp`
- 这四个函数同时执行类型检查和IR生成
  - 目前我们只考虑类型检查

#### Type-checking for Expressions

**transExp的输入和输出**

```c
struct expty transVar(S_table venv, S_table tenv, A_var v);
struct expty transExp(S_table venv, S_table tenv, A_exp a);
void transDec(S_table venv, S_table tenv, A_dec d);
Ty_ty transTy(S_table tenv, A_ty a);
```

- `transExp`:类型检查表达式；查询并更新环境
- 参数
  - 一个值环境`venv`
  - 一个类型环境`tenv`
  - 一个表达式`a`
- 结果：一个翻译后的表达式，以及它在`Tiger`语言中的类型
 
```c
struct expty {
  Tr_exp exp; 
  Ty_ty ty;
};
```

> `transExp`接收两个环境`venv`和`tenv`，然后对表达式`AST`递归检查，最后返回一个`struct expty`

!!! example
```tiger
a + b
```

如果查`venv`得到：

```
a : int
b : int
```

那么整个表达式类型就是`int`

所以`transExp(venv, tenv, a+b)`会返回`expty(..., Ty_Int)`
!!!

#### 加法表达式的类型检查
`Tiger`对`+`表达式采用**非重载的类型检查**

- 对于`e1+e2`，二者的类型必须都是`int`
- 整个表达式的类型也是`int`

```c
struct expty transExp(S_table venv, S_table tenv, A_exp a) {
  switch(a->kind) {
    ...
    case A_opExp: {
      A_oper oper = a->u.op.oper;
      struct expty left = transExp(venv tenv, a->u.op.left);
      struct expty expty_right = transExp(venv, tenv, a->u.op.right);

      if(oper == A_plusOp) {
        if (left.ty->kind != Ty_int) {
          EM_error(a->u.op.left->pos, "integer required");
        }
        if (right.ty->kind != Ty_int)
          EM_error(a->u.op.right->pos, "integer required");
      }
      return expty expTy(NULL, Ty_Int());
    }
  }
}
assert(0);
```

- 代码逻辑
  - 先递归检查`+`左侧的表达式
  - 再递归检查右表达式
  - 然后检查左右是否类型为`int`
- 规则：
  $$
  \frac{e_1:int\ e_2:int}{e_1 + e_2:int}
  $$

#### Type-Checking Variables, Subscripts(数组下标) and Fields

文法：

```
lvalue→id
       lvalue.id
       lvalue[exp]
```

- 一个`I-value`是一个位置，它的值可以被**读取或赋值**
- 变量、过程参数、`record`字段、`array`元素都是`I-value`

```c
struct expty transVar(S_table venv, S_table tenv, A_var v) {
    switch(v->kind) {

    case A_simpleVar: {
        E_enventry x = S_look(venv, v->u.simple); // 在值环境查找变量名

        // 如果找到了并且这个条目是变量
        if (x && x->kind == E_varEntry)
            // 返回实际值
            return expTy(NULL, actual_ty(x->u.var.ty)); //actual_ty的作用是展开类型别名

        else {
            EM_error(v->pos, "undefined variable %s", S_name(v->u.simple));
            return expTy(NULL, Ty_Int()); //通过Ty_Int()返回一个默认类型，这是一种错误恢复策略，避免一个错误导致后面全部无法检查
        }
    }

    case A_fieldVar:
        ...
    }
}
```

## 5.4 Type-Checking Declarations

- 环境是由声明构造并扩展的
- 在`Tiger`中，声明只出现在`let`表达式中：`let decs in body end`

**代码实现表达式同时管理let内部声明的作用域**

核心作用

- 进入let的新作用域
  - `venv`管变量和函数
  - `tenv`管类型
  - 两个环境都要开启新作用域

```c
S_beginScope(venv);
S_beginScope(tenv);
```

- 处理let中的声明decs
  - 遍历`let`中的所有声明，并逐个处理
  - `transDec`的作用是：**检查声明是否合法，并把声明产生的新绑定加入环境**

```c
for (d = a->u.let.decs; d; d = d->tail)
    transDec(venv, tenv, d->head);
```

!!! example
```tiger
let
  var x := 1
  var y := x + 2
in
  y
end
```

处理`var x := 1`后,`venv`中加入`x -> int`

处理`var y := x + 2`时，就可以查到`x`的类型
!!!

- 用扩展后的环境检查body

```c
exp = transExp(venv, tenv, a->u.let.body);
```

!!! example
```tiger
let 
  var x := 1
in
   x + 2
end
```

这里的`body`是`x + 2`

由于前面已经把`x -> int`加入`venv`，所以这里可以正确判断`x + 2 : int`
!!!

- 退出作用域，恢复原来的环境
  - 把刚才在 let 中声明的局部名字都删掉

```c
S_endScope(tenv);
S_endScope(venv);
```

- 返回`body`的类型

```c
return exp;
```

### 5.4.1 Variable Declarations

> 在这里变量声明是一种非递归声明

当我们处理一个 **没有类型约束的变量**的变量声明：`var x := exp`

```c
void transDec(S_table venv, S_table tenv, A_dec d) {
    switch(d->kind) {
        case A_varDec: {
            struct expty e = transExp(venv, tenv, d->u.var.init);
            S_enter(venv, d->u.var.var, E_VarEntry(e.ty));
        }
        ...
    }
    ...
}
```

这里因为没有显式给变量`x`写类型，所以编译器会先检查右侧初始化表达式`exp`的类型

```c
struct expty e = transExp(venv, tenv, d->u.var.init);
```

`x`的类型取决于`exp`的类型，然后把`x`加入`venv`

```c
S_enter(venv, d->u.var.var, E_VarEntry);
```

意思就是：$x \mapsto e.ty$

!!! example 
```tifer
var x := 10
```

右侧10的类型是`int`，所以加入：$x \mapsto int$
!!!

当我们处理一个 **带有类型约束**的变量声明

$$
\text{var x : type-id := exp}
$$

- 必须检查这个类型约束和初始化表达式 **是否兼容**
- 此外类型为`Ty_Nil`的初始化表达式必须接受到某个`Ty_Record`类型的约束

!!! example
```tiger
var x : int := 10
```


这是编译器不能只看`10`，还要看显式写出的类型`int`

流程是

1. 去`venv`中查找`type-id`
2. 检查**初始化表达式**`exp`的类型
3. 判断两者是否兼容
4. 如果兼容，把变量加入`venv`

```tiger
var x : int := "hello"
```

左边要求`int`，右边是`string`，不兼容，应该报类型错误
!!!

### 5.4.2 Type Declaration

- 非递归类型声明：$\text{type type-id = ty}$
  - `type-id`是类型名，比如`myint`,`point`
  - `ty`是右边的类型表达式，比如`int`、`{x:int, y:int}`、`array of int`
- `transTy`:递归地把`A_ty`翻译成`Ty_ty`

```c
void transDec(S_table venv, S_table tenv, A_dec d) {
    ...
    case A_typeDec: {
        S_enter(tenv, d->u.type->head->name,
                transTy(d->u.type->head->ty));
    }
    ...
}
```

> 这个程序片段只处理长度为1的类型声明列表

**代码中的核心是**

```c
S_enter(tenv, d->u.type->head->name,
        transTy(d->u.type->head->ty));
```

- 第一步：`transTy(d->u.type->head->ty)`
  - 把`AST`中的类型语法`A_ty`翻译成编译器内部的类型对象`Ty_ty`
  - 例如：
    - `int`会翻译成`Ty_Int`
    - `{x:int, y:int}`会翻译成`Ty_Record(...)`
    - `array of int`会翻译成`Ty_Array(Ty_Int)`
- 第二步：`S_enter(tenv, name, Ty_ty)`
  - 把这个类型名加入类型环境`tenv`

!!! example
```tiger
type point = {x:int, y:int}
```
会加入：

$$
point↦Ty_Record(x:int, y:int)
$$

所以之后看到：

```tiger
var p : point := ...
```

编译器就能在 tenv 中查到 point 是一个 record 类型。
!!!

!!! warning
上述代码 **只有一个类型声明**的情况

它可以处理`type a = int`

但是不能完整处理连续的类型声明组，比如：

```tiger
type a = {x:b}
type b = {y:int}
```

因为这肯呢个涉及互相引用，需要更复杂的两遍处理
!!!

**非递归类型声明是“先算右边类型，再把类型名加入 tenv”；因此右边不能引用正在定义的类型名**

### 5.4.3 Function Declaration

$$
\text{function id(tyfields):type-id = exp}
$$

- `id`:函数名，例如`f`
- `tyfields`是参数列表，比如`a:int.b:string`
- `type-id`是返回类型，比如`int`
- `exp`是函数体

!!! example
```tiger
function f(a:int, b:string):int = body
```
!!!

```c
void transDec(S_table venv, S_table tenv, A_dec d) {
    switch(d->kind) {
    ...
    case A_functionDec: {
        A_fundec f = d->u.function->head;

        Ty_ty resultTy = S_look(tenv, f->result);
        Ty_tyList formalTys = makeFormalTyList(tenv, f->params);

        S_enter(venv, f->name, E_FunEntry(formalTys, resultTy));

        S_beginScope(venv);

        {
            A_fieldList l;
            Ty_tyList t;

            for(l = f->params, t = formalTys; l; l = l->tail, t = t->tail)
                S_enter(venv, l->head->name, E_VarEntry(t->head));
        }

        transExp(venv, tenv, d->u.function->body);

        S_endScope(venv);
        break;
    }
    ...
}
```

- `makeFormalTyList`:遍历形参列表，并返回这些形参的类型列表
- 上面的代码是一个非常简化的视线
  - 它只处理单个函数的情况
  - 它只处理带返回值的函数
  - 它没有处理程序错误
  - 它没有检查**函数体表达式的类型**是否匹配**声明的返回类型**


$$
\text{function f(a:ta, b:tb):rt=body}
$$

**代码的整体思路**

1. 找到函数付安徽类型
2. 找到参数类型列表
3. 把函数名加入`venv`
4. 进入函数体作用域
5. 把形参作为局部变量加入`venv`
6. 检查函数体表达式
7. 退出函数体作用域

```c
A_fundec f = d->u.function->head;  
```

这里取出函数声明列表中的**第一个函数声明**

> 因为这份代码是简化版，只处理一个函数，所以直接取`head`

```c
Ty_ty resultTy = S_looik(tenv, f->result);
```

这一步在类型环境`tenv`中查找返回类型

!!! example
```tiger
function f(): int = 1
```

这里`f->result`是`int`，所以`S_look(tenv, int) = Ty_Int`得到函数返回类型`resultTy = Ty_Int`
!!!

```c
Ty_tyList formalTys = makeFormalTyList(tenv, f->params);
```

这一步处理**函数形参列表**，得到**参数类型列表**

!!! example
```tiger
function f(a:int,b:string):int = ...
```

参数列表是：`a:int, b:string`

`makeFormaTyList`会去`tenv`查每个参数的类型，然后返回`[int, string]`
!!!

```c
S_enter(venv, f->name, E_FunEntry(formalTys, resultTy))
```

这一步把函数名加入值环境`venv`

!!! example
```tiger
function f(a:int, b:string):int = ...
```

会加入

```
f -> E_FunEntry([int, string], int)
```

也就是：$f \mapsto ([int,string] \rightarrow int)$

这样之后如果遇到函数调用

```tiger
f(1,"hello")
```

编译器就可以查`venv`，知道

- `f`需要两个参数
- 第一个参数是`int`
- 第二个参数是`stromg`
- 返回值是`int`
!!!

```c
S_beginScope(venv);
```

进入函数体的新作用域

!!! question
为什么这里只对`venv`开作用域
!!!

因为函数参数是变量名，属于值环境。这里不是在声明新的类型名，所以不需要对`tenv`开新作用域


```c
for(l = f->params, t = formalTys; l; l = l->tail, t = t->tail)
    S_enter(venv, l->head->name, E_VarEntry(t->head));
```

这一步把每个形参作为局部变量加入`venv`

!!! example
```tiger
function f(a:int, b:string):int = a + 1
```

进入函数体时，加入：

```
a -> E_VarEntry(int)
b -> E_VarEntry(string)
```

所以在函数体`a+1`中，编译器可以查到`a`是`int`
!!!

```c
transExp(venv, tenv, d->u.function->body);
```

检查函数体表达式

!!! example
```tiger
function f(a:int):int = a + 1
```

这里会检查

```tiger
a + 1
```

并得出它的类型是`int`
!!!

!!! warning
这段代码非常简化，有很多问题并没有处理

**1. 只处理单个函数**

只取了`d->u.function->head`,没有处理函数声明列表中多个函数的情况

但是`Tiger`中可能有：

```tiger
function f(...) = ...
function g(...) = ...
```

**2. 只处理有返回值的函数**

有些函数可能没有显式返回类型，类似过程，返回`void`

简化代码没有处理这种情况

**3. 没有处理程序错误**

比如返回类型不存在：

```tiger
function f():unknownType = ...
```

如果`unknownType`不在`tenv`中，应该报错

**4. 没有检查函数体类型是否匹配声明返回类型**

```tiger
function f(): int = "hello"
```

声明返回`int`，但是函数体是`string`，这应该报错，但是代码只是`transExp(...)`。没有把返回的`body`类型和`resultTy`比较

正确逻辑应该类似

```c
struct expty body = transExp(venv, tenv, f->body);
if (!type_equal(body.ty, resultTy))
    EM_error(...);
```

**5. 没有完整处理递归函数**

如果函数可以递归调用自己：

```tiger
function fact(n:int):int =
    if n = 0 then 1 else n * fact(n-1)
```

那么必须在**检查函数体**之前，先把`fact`加入`venv`.这段代码确实先加入了函数名，再检查函数体，所以对单个递归函数有一定支持。

但如果是多个**互相递归函数**：

```tiger
function even(n:int):int = if n=0 then 1 else odd(n-1)
function odd(n:int):int = if n=0 then 0 else even(n-1)
```

就需要更完整的两遍处理：

- 先把所有函数名加入`venv`
- 再逐个**检查函数体**
!!!

### 5.4.4 Recursive Declarations

#### 递归类型声明的问题

```tiger
type list = {first: int, rest: list}
```

- 如何把这个声明转换成**编译器内部的类型**表示
- 在把`list`加入类型环境之前，我们需要先处理`{first: int, rest: list}`
- 问题：处理`{first: int, rest: list}`时，又需要从类型环境中查找`list`
  - 但此时`list`还没有加入类型环境
  - 所以会出现`undefined type!`

!!! question
如何处理这个问题
!!!

#### 两遍处理

对于上述问题，我们的解决方案是使用 **两遍处理**

1. 先把所有`header`放入环境中，尽管它们的`body`还没有被处理

> 在这个例子中，`header`是`type list =`

    如何把这个`header`放入环境中？

-  `S_enter(tenv, name, Ty_Name(name, NULL));`

> 我知道有一个类型叫`list`，但是它具体等于什么类型暂时还没有处理完

1. 对类型声明的`body`调用`TransTy`,也就是处理record的类型表达式

```tiger
{first: int, rest: list}
```

- `transTy`返回的类型随后可以被赋值到`Ty_Name`结构体中的`ty`字段里
  - `list -> Ty_Name(list, Ty_Record(first:int, rest:list))`

#### 递归调用的合法性限制

- 一组相互递归类型声明中的每一个循环，都必须经过一个`record`或`array`声明
  - **否则类型检查器永远不会停止**

```tiger
type a = b
type b = a
```

这样纯粹的类型别名循环是不合法的。**没有任何真正的类型结构出现**，只是对两个变量进行展开

每个递归必须经过`record`或`array`，它们相当于给类型结构提供了一个 **实际够构造点**

!!! example "合法例子"
```tiger
type a = b
type b = {i:a}
```

这里循环是

```
a -> b -> record field i:a
```

它经过`record`，所以合法
!!!

#### 相互递归函数

相互递归函数的典型例子：

```tiger
function f(x:int):int = g(x)
function g(x:int):int = f(x)
```

!!! question
当我们处理`f`的函数体时，会遇到`g`，但是此时`g`还不能再变量环境中找到
!!!

**解决方案**

- 第一遍：收集每个函数的`header`信息，包括
  - 函数名
  - 形参类型列表
  - 返回类型
  - **但是暂时不处理函数体**
- 第二遍：在已经**扩展好的环境**中处理所有函数体