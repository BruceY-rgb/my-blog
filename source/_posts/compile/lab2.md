---
title: Lab2：语义分析
date: 2026-05-07
categories:
    - CS课程笔记
    - 编译原理
    - 实验笔记
tags:
    - 编译原理
cover: https://www.dotcpp.com/assets/img/%E7%BC%96%E8%AF%91%E5%99%A8.jpeg
---

实验一种我们进行了词法分析与语法分析，对于符合语法的程序，我们可以从中构建出一个语法树

然而并不是所有符合语法的程序都是合法的程序，下面的语句完全符合`SysY`语法，但是仍然不是合法的程序，无法通过编译

```cpp
inta[5] = {1,2,3,4,5};
int b = a;
```

这是因为它不符合`SysY`的语义约束，初始化的左右两边类型不匹配。在本次实验中，我们将进行语义分析，即检查是否符合语义规则。

合法的`SysY`程序需要满足诸如**赋值语句类型匹配，函数调用类型匹配，变量定义不重复等语义约束**。为了检查这些语义约束，我们需要**遍历语法树**，同时构建符号表以查找需要的类型信息，检查每个节点是否符合语义规则

## 符号表

```cpp
int x = 1;
int y = 0;
{
    int x = 0;
    y += x;
}

y+=x;
```

上述代码两次`y+=x`的含义不同，那么编译器在生成代码的时候，仅仅看`y+=x`是判断不出来`x`和`y`的类型的，这就是符号表所需要解决的问题，**为这些使用的变量提供额外的语义信息**

在符号表中，对于一个变量，我们需要记录下它的名字以及类型等信息

对于函数我们也需要在符号表中记录，方便在调用函数时 **查询符号、检查参数列表是否一致、返回值是否一致等**。我们需要再符号表中记录下**函数的名字、参数列表(包含多个变量符号)和返回值类型**。在`SysY`中，所有函数都是全局的，并且不能重载

## 符号表实现

### 函数式风格

在每次进入新的作用域时都需要申请一个新的符号表，而当离开该作用域时，就可以将该符号表销毁，相当于维护一个符号表的 **栈**。

在寻找某个符号时，我们首先在当前的符号表中查找，如果找不到，我们就去上一个符号表中查找。

离开作用域时，，我们呢只需要销毁当前的符号表，用它的上一个符号表替代即可

### 命令式风格

不需要申请多个符号表，自始至终在单个符号表上进行动态维护。其中每一项对应的不是一个变量的定义，而是变量定义的 **栈**。每次进入新的作用域时，讲一个新的符号表压入栈中，离开作用域时弹出。

!!! example
在运行到先前程序的第2行时符号表为：

```
x -> [x1]
y -> [y1]
```

运行到第4行时，符号表变成了

```
x -> [x2, x1]
y -> [y1]
```

在每次我们想要查看某个变量的定义时，我们只需要查看栈顶的元素即可
!!!

**模板代码中的类型定义与符号表**

为了方便在符号表和类型检查时使用储存和传递类型信息，我们先对用到的类型进行定义，包括

- `Type`基类：所以类型的基类，定义了`compatible`和`to_string`方法
- `PrimitiveType`：基本数据类型(基础实验中只有`int`和`void`)
- `FunctionType`:函数类型，包含参数和返回值类型

在基类`Type`中定义的比较类型相等的`compatible`方法和转换为字符串的`to_string`方法

```cpp
class Type;
using TypePtr = std::shared_ptr<Type>;
class Type {
public:
virtual bool compatible(const TypePtr& other) const = 0;
virtual std::string to_string() const = 0;
virtual ~Type() = default;  // make the class polymorphic
};
```

在实现`compatible`方法的时候，我们使用到了`C++RTTI`的特性。例如，`PrimitiveType::compatible`函数如下：

```cpp
bool PrimitiveType::compatible(const Typeptr& other) const {
    auto other_type = std::dynamic_pointer_cast<PrimitiveType>(other);
    return other_type && basic_type == other_type->basic_type;
}
```
 
 从中我们可以看出`compatible`函数的实现方式

 - 首先尝试将`other`转换为对应的类型
 - 然后再进行比较。这里使用了`std::dynamic_pointer_cast`函数，用于在运行时检查类型，尝试将`shared_ptr`转化为指定的类型。
 - 如果转换成功，返回转换后的指针，否则返回空指针

符号表用于存储变量信息，包括符号的名称、唯一名称以及类型。在`semantic/symbol_table.hpp`中，我们定义了`Symbol`类和`SymbolTable`类

对于`Symbol`类，它用于表示一个符号，包含了`name`(符号名)、`unique_name`(符号的唯一标识符)和`type`(符号类型)

```cpp
class Symbol;
using SymbolPtr = std::shared_ptr<Symbol>;
class Symbol {
public:
/// @brief The name of the symbol
std::string name;
/// @brief The unique name of the symbol
std::string unique_name;
/// @brief The type of the symbol
TypePtr type;
#warning Symbol: need to add a member variable to store the symbol's scope
Symbol(std::string name, TypePtr type) : name(name), type(type) {}
static SymbolPtr create(std::string name, TypePtr type) {
    return std::make_shared<Symbol>(name, type);
}
};
```

这里的`unique_name`用于保存符号的唯一标识符，在实现中需要保证每个符号`unique_name`字段都是不同的。具体而言，在你将一个**新的符号**插入符号表时，需要修改`Symbol`类的`unique_name`字段：对于局部变量和数组，为其生成一个唯一的`unique_name`；对于全局变量和全局函数，直接使用其名称作为唯一标识符即可。为了方便后续IR生成时可能需要**变量所在的`Scope`语义信息**，你也可以在语义分析时将每个变量的`Scope`信息存在`Symbol`类中。

对于`SymbolTable`类，主要功能是管理符号的添加、查找以及作用域的管理。`SymbolTable`类提供以下几个函数：

- `SymbolPtr add_symbol(std::string name, TypePtr type);`:向符号表中**添加一个符号**，并返**回新创建的符号**
- `SymbolPtr find_symbol(std::string name, bool in_current_scope = false);`:在符号表中查找名为`name`的符号，如果找到则**返回该符号**，否则返回空指针。如果`is_current_scope`为`true`，则只在当前`Scope`中查找
- `void enter_scope();`:和`void exit_scope()`进入和退出一个新的作用域

## 类型检查

所谓类型，就是一组值构成的集合，对于这组集合我们可以进行其专属的操作。例如整型的加减乘除，数组的访问等。

当我们在某组值上尝试去尝试去执行其不支持的操作时，类型错误就产生了。而类型检查，就是检查我们对**这些类型的操作**有没有错误


```cpp
void f() {
    return;
}
int a;
int c = a / f();
```

例如上述代码就存在类型错误。这时我们发现变量绑定是十分重要的，如果碰到了使用某一变量如`a = b + c`时我们怎么知道`b`的类型？

答案就是使用我们实现的符号表，通过查找符号表，我们就可以知道`b`的类型了。除此之外，函数调用的**参数类型，个数和返回类型**等也都是应该检查的

### 类型检查实现

与打印语法树和符号表的建立一样，类型检查也是遍历语法树的过程。对于有类型的语法树节点(如`exp`节点)，我们可以自然将该节点的类型作为返回值，继续给父节点使用

例如，赋值语句：

```cpp
Type type_check(Assign assign, Table table) {
    Type left = type_check(assign->left, table);
    Type right = type_check(assign->right, table);
    if (equal(left, right)) 
        ...
}

Type type_check(Ident ident, Table table) {
    return table.lookup(ident);
}
```

其中的`type_check`函数负责的就是检查某个表达式的类型是否正确，并返回其类型。`table`是我们的符号表，显然符号表的建立和类型检查可以在同一遍历过程完成

`TypeChecker`类的核心：根据`AST`节点类型调用对应的`check`函数进行检查

在`main.cpp`中，我们只需要在`main`函数中创建一个`TypeChecker`对象，然后调用`check`函数即可

```cpp
class TypeChecker {
public:
TypeChecker();

TypePtr check(AST::NodePtr node);

private:
/// @brief The symbol table
SymbolTable symbol_table;

TypePtr checkIntConst(AST::IntConstPtr node);
TypePtr checkLVal(AST::LValPtr node);
// ... 对每种 AST 节点类型定义一个 check 函数 ... //
};
```

`TypeChecker`需要**初始化符号表**并在构造函数中添加**内置函数**

类型检查的核心函数是`check`，它会根据`AST`节点的类型调用对应的`check`函数。这里同样适用了C++  RTTI来判断`AST`节点的类型，并且为了方便，我们在`check`函数中使用了一个宏来简化代码

```cpp
TypePtr TypeChecker::check(AST::NodePtr node) {
#define CHECK_NODE(type)                                     \
if (auto n = std::dynamic_pointer_cast<AST::type>(node)) { \
    return check##type(n);                                   \
}

CHECK_NODE(CompUnit)
CHECK_NODE(FuncDef)
// ... 添加其他 AST 节点类型 ... //

#warning Add more AST node types if needed

#undef CHECK_NODE

ASSERT(false, "Unknown AST node type " + node->to_string() +
                    " in type checking at line " +
                    std::to_string(node->lineno));
}
```

为了存储后续步骤所需要的语义信息信息，我们在 AST 的 VarDef LVal FuncDef FuncCall 节点中添加一个 SymbolPtr symbol 成员，用于保存符号表中的对应符号。例如，对于 VarDef 节点，我们添加了一个 symbol 成员：

```cpp
class VarDef : public Node {
public:
std::string ident;
SymbolPtr symbol;
VarDef(char const *ident) : ident(ident) {}
std::string to_string() override { return "VarDef <ident: " + ident + ">"; }
};
```

在 TypeChecker 的对应节点的 check 函数中，你需要根据 AST 节点的类型进行类型检查，并将对应的符号保存在 node->symbol 中。

!!! warning
由于我们都使用了`std::shared_ptr<Type>`来储存类型信息，里面存的不是 **类型本身**而是 **指向类型对象的指针**，所以在比较两个类型是否相等时，需要使用`compatible`函数而不是直接使用`==`或`!=

> 直接使用`==`或`!=`本质上比较的是 **两个指针是不是指向同一个对象**而不是比较 **两个类型在语义上是否相同**
!!!

### 数组初始化检查

除了上面两种经典检查之外，我们还要求检查数组初始化时的元素个数是否潮湿处数组大小。例如

```cpp
int a[2][3][4] = {1, 2, 3, 4, {5}, {9}, 13, 14, 15, 16, {17}, {21}, 25};
// [0][0][0] = 1,  [0][0][1] = 2,  [0][0][2] = 3,  [0][0][3] = 4
// [0][1][0] = 5,  [0][1][1] = 0,  [0][1][2] = 0,  [0][1][3] = 0
// [0][2][0] = 9,  [0][2][1] = 0,  [0][2][2] = 0,  [0][2][3] = 0
// [1][0][0] = 13, [1][0][1] = 14, [1][0][2] = 15, [1][0][3] = 16
// [1][1][0] = 17, [1][1][1] = 0,  [1][1][2] = 0,  [1][1][3] = 0
// [1][2][0] = 21, [1][2][1] = 0,  [1][2][2] = 0,  [1][2][3] = 0
/* 25: extra element in array initializer */
```

在数组`a`的初始化时，我们发现了超出数组大小的元素25，这时应该报错

> 实际上要求我们能够分析出填充完成后的初值列表，为后续代码生成做准备

对于多维数组的初始化，我们采用C语言的初始化列表规范

1. 在初值列表中，我们可以直接使用标量进行横跨任意维度的初始化

    ```cpp
    int a[2][2] = {1, 2, 3, 4};
    ```

2. 在抵达初值列表结尾时，如果对应数组仍然未被填满，则填0直到对应数组被填满

    ```cpp
    int a[2][2] = {1}; // {1, 0, 0, 0}. {1} for int[2][2].
    ```

3. 在初值列表内，可以用嵌套的初值列表对子数组进行初始化

    ```cpp
    int a[3][2][2] = {1, 2, {3, 4}, {1, 2, 3, 4}， {1, 2, 3, 4}}; 
    //                      int[2],   int[2][2],     int[2][2] 
    //                  int[2][2],    int[2][2],     int[2][2]
    ```

4. 遇到嵌套的初值列表时，根据已经填充的元素数决定该初值列表对应的子数组(不包括自身)，并尽量选择更大的子数组

```cpp
int a[3][2][2] = {{1        }, 5, 6, {7  }, {9        }};
//               { 1, 0, 0, 0, 5, 6,  7, 0,  9, 0, 0, 0}. 
// {1} for int[2][2]. {7} for int[2], {9} for int[2][2].
```

    - 这里遇到`{1}`时，已经填充了`0`个元素，所以对一个初始化`int[0][0]`，所以对应初始化`int[2][2]`
    - 遇到`{7}`时，已经填充了6个元素，所以对应初始化`int[2]`
    - 遇到`{9}`时，已经填充了8个元素，所以对应初始化`int[2][2]`
准确来说，已经填充的元素数要能被jiang'y奥填充的子数组的总元素数整除，在此基础上选择可以填充的最大子数组

如果遇到嵌套的初值列表时，无法匹配上任何子数组，即已经填充元素数无法被最高维度的长度整除，那么说明此处只能用标量初始化，不能在这里使用嵌套列表进行初始化，这时应该报错

```
int a[2][2] = {1, {2, 3}, 4}; 
//                    ^ Error：excess elements in scalar initializer
```

这里遇到`{2,3}`时，值填充了一个元素，我们还在对第一个`int[2]`初始化，因为此时也没有遇到任意初值列表的结尾，也不能填0，所以应该报错

5. 数组初始化不应该超出数组大小

```cpp
int a[2][2] = {1, 2, {3}, 4}; 
//                        ^ Error: excess elements in array initializer
```