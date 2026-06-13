---
title: Lab4：RISC-V 目标代码生成
date: 2026-06-09
categories:
    - CS课程笔记
    - 编译原理
    - 实验笔记
tags:
    - 编译原理
cover: https://www.dotcpp.com/assets/img/%E7%BC%96%E8%AF%91%E5%99%A8.jpeg
---

本次实验的目标是从实验3生成的中间表示出发，生成`RISC-V32`的汇编代码，并在`Venus`模拟器或`QEMU`上运行


现在，我们要从在一个自定义虚拟机器上解释执行变成在实际机器的有限寄存器中生成最终的代码，我们需要先解决下面的问题

## 1.指令选择

首先我注意到中间代码和汇编代码格式是不一样的，我们要对每一种中间代码找到一个特定的模式，翻译成对应的目标代码，这个过程就是指令选择。本实验中实现的中间表示是线性的，最直接的方式就是将每一条中间代码翻译成一条或多条目标代码。下标是不分中间代码与`RISC-V 32`指令对应的一个示例，大部分的逻辑都是显然的

| 中间代码              | 目标代码                     | 中间代码                       | 目标代码                     |
| --------------------- | ---------------------------- | ------------------------------ | ---------------------------- |
| `a = b + c`           | `add reg(a), reg(b), reg(c)` | `a = b - c`                    | `sub reg(a), reg(b), reg(c)` |
| `a = b + #t`          | `addi reg(a), reg(b), t`     | `a = b - #t`                   | `addi  reg(a), reg(b), -t`   |
| `a = b`               | `mv reg(a), reg(b)`          | `a = #t`                       | `li reg(a), t`               |
| `LABEL label:`        | `label:`                     | `GOTO label`                   | `j label`                    |
| `a = CALL f`          | `jal f ; move reg(a), a0`    | `RETURN a`                     | `mv a0, reg(a) ; ret`        |
| `x = *y`              | `lw reg(x), 0(reg(y))`       | `*x = y`                       | `sw reg(y), 0(reg(x))`       |
| `x = *(y + #k)`       | `lw reg(x), k(reg(y))`       | `*(x + #k) = y`                | `sw reg(y), k(reg(x))`       |
| `IF x > y GOTO label` | `bgt reg(x), reg(y), label`  | `IF x <= y GOTO label`         | `ble reg(x), reg(y), label`  |
| `x = &y`              | `la reg(x), y`               | `GLOBAL x: #k`                 | `x:`, `.zero k`/`.byte 0`*k  |
| `FUNCTION f:`         | `f:`                         | `GLOBAL x: #k = #v1, #v2, ...` | `x:`, `.word v1, v2, ...`    |

对于`x = DEC #k`，需要在栈上分配`k`个字节的空间，然后将该空间的起始地址存入`x`中

`RISC-V 32`仍然有许多其他繁杂的注意事项，如调用参数多余8个时用栈传参、部分二元运算符没有直接对应的汇编指令、部分指令没有立即数版本、立即数的大小限制、偏移量的大小限制等等

我们可以发现，在目标代码中对于某一个中间代码中的变量`a`使用的是虚拟寄存器`reg(a)`，意为储存该变量的寄存器。所以，这其实仍然不是最终的汇编代码，而是一种`Machine-level IR`。我们接下来需要进行寄存器分配，将这些虚拟寄存器映射到真实的物理寄存器上

那么我们怎么知道每个虚拟寄存器应该用哪个物理寄存器存储呢？这就引出了下一个问题：**寄存器分配**

!!! note "模板代码中的ASM结构定义与指令选择"
与`AST`和`IR`类似，我们需要定义一些结构体来表示汇编指令，包括指令的类型、操作数等。

```cpp
class Inst;
using InstPtr = std::shared_ptr<Inst>;
class Inst {
public:
virtual std::string to_string() const = 0;
virtual ~Inst() = default;  // make the class polymorphic

/// @brief 获取指令使用的寄存器
/// @return 使用的寄存器集合
virtual std::set<Reg> get_uses() const = 0;

/// @brief 获取指令定义的寄存器
/// @return 定义的寄存器集合
virtual std::set<Reg> get_defs() const = 0;

/// @brief 替换指令使用的寄存器
/// @param reg_map 寄存器映射 (old_reg -> new_reg)
virtual void replace_uses(const RegMap &reg_map) = 0;

/// @brief 替换指令定义的寄存器
/// @param reg_map 寄存器映射 (old_reg -> new_reg)
virtual void replace_defs(const RegMap &reg_map) = 0;

/// @brief 替换指令使用和定义的寄存器
/// @param reg_map 寄存器映射 (old_reg -> new_reg)
virtual void replace_all(const RegMap &reg_map) {
    replace_uses(reg_map);
    replace_defs(reg_map);
}
};
```

其中，to_string 函数用于将指令转换为字符串，get_uses 和 get_defs 函数用于获取指令使用和定义的寄存器，replace_uses 和 replace_defs 函数用于替换指令使用和定义的寄存器。这些方法可以方便你实现寄存器分配。

我们使用 Reg 类对虚拟和物理寄存器进行管理。Reg 类定义如下：

```cpp
class Reg {
public:
static const Reg zero, ra, sp, /* more physical regs */ t5, t6;

std::string name;

Reg(std::string name) : name(name), physical(false) {
    static const std::set<std::string> physical_registers = {
        "zero", "ra", "sp", /* more physical regs */ "t5", "t6"};
    if (physical_registers.find(name) != physical_registers.end()) {
    physical = true;
    }
}

bool operator==(const Reg &other) const {
    return name == other.name && physical == other.physical;
}
bool operator!=(const Reg &other) const { return !(*this == other); }
bool operator<(const Reg &other) const {
    return name < other.name ||
        (name == other.name && physical < other.physical);
}
bool is_phys() const { return physical; }

private:
bool physical;
Reg(std::string name, bool physical) : name(name), physical(physical) {}
};
```

接下来，我们需要将`IR`代码转换为`ASM`代码

`InstSelector`类负责将`Zero IR`中的代码节点转换为汇编指令，每个`IR`节点都有对应的`select`函数。以下是如何将一个`Assign`节点转换为汇编指令的示例：

```cpp
ASM::Code InstSelector::selectAssign(const IR::AssignPtr &node) {
ASM::Code code;
// a = b    -> mv reg(a), reg(b)
code.push_back(ASM::Mv::create(ASM::Reg(node->x), ASM::Reg(node->y)));
return code;
}
```

每个 IR 类型（如 Assign, Load, Branch 等）都需要实现类似的选择函数。通过 InstSelector::select 函数，你可以将不同类型的 IR 节点转换为相应的汇编指令。

为了保存生成的 ASM 指令，我们需要修改 BasicBlock 类，添加一个 asm_code 成员变量：

```cpp
class BasicBlock {
public:
ASM::Code asm_code;

// ... 其他成员变量和函数 ... //
};
```

在`InstSelector`类中，将生成的`ASM`指令添加到`BasicBlock`类的`asm_code`成员变量中

由于我们还没做寄存器分配，因此这一步生成的汇编代码中的 Reg 就有可能是虚拟寄存器，即 Reg::physical 为 false。在寄存器分配阶段，就需要将物理寄存器分配给这些虚拟寄存器。
!!!

## 2. 寄存器分配

对于中间代码中的全局变量，我们可以直接映射到目标代码，这是比较简单的。但是除此之外，我们还使用了数目不受限的变量和临时变量。但是处理器所拥有的寄存器数量是有限的。因此我们需要将中间代码中的变量映射到寄存器上，这个过程就是寄存器分配

在本次实验中，我们只需要完成一个朴素的寄存器分配。最朴素的寄存器分配方法就是把所有临时变量都存储在栈上。每翻译一条中间代码之前，我们把要用到的变量先加载到寄存器中，得到计算结果后又将结果写回内存。这种方法的确能将中间代码翻译成可以正常运行的目标代码，而且实现和调试都特别容易。


!!! example 
```cpp
add reg(a), reg(b), reg(c)
```

假设我们为`a,b,c`分配的空间在`sp+4,sp+8,sp+12`，那么我们可以生成下面的代码

```asm
lw t1, 8(sp) # load b
lw t2, 12(sp) # load c
add t0, t1, t2 # add reg(a), reg(b), reg(c)
sw t0, 4(sp) # store a
```

实际上，这种方法就是对所有临时变量都做了`spilling`
!!!

!!! note "模板代码中的寄存器分配"
寄存器分配阶段需要实现一个`RegAllocator`类，用于将虚拟寄存器分配到物理寄存器上。对于每一个函数，我们在完成寄存器分配后可以得到一个`RegMap`用于将虚拟寄存器映射到物理寄存器上。我们可以将保存在`Function`类中，方便在后续的汇编指令发射中使用
!!!’

**朴素spill-all-to-stack的核心思路**：

1. 遍历函数中所有指令，收集所有**非物理寄存器名**
2. 为每个虚拟寄存器调用`alloc_temp(4)`分配一个4字节的栈槽，记录`{变量名 → sp偏移}`
3. 再次遍历每条指令
   - 指令的每个虚拟`use`：指令 **前**插入`lw tN, offset(sp)`
   - 把指令的虚拟机寄存器替换成`tN`
   - 指令的每个虚拟`def`:指令 **后**插入`sw tN, offset(sp)`
4. 使用3个临时寄存器`t0/t1/t2`轮转(大部分指令最多`2use + 1def`)

## 3. 栈帧管理

在朴素的寄存器分配方法中，所有临时变量存储在栈上。除此之外，函数调用还需要保存一些关键的寄存器值，例如保存返回地址的`ra`寄存器等。因此，每次函数调用都会创建一个栈帧，用于保存必要的数据

### 3.1 栈帧布局

栈是从高地址向低地址增长的，一个最基本的栈帧结构如下：

```
                    │               │ ▲ High Address
                    │               │ │
                    │      ...      │
                    ├───────────────┤
                    │  argument n   │
        incoming    │      ...      │    previous
        arguments   │  argument 2   │     frame
                    │  argument 1   │
   frame pointer ──►├───────────────┼────────────────
                    │    return     │
                    │    address    │
                    ├───────────────┤
                    │ callee-saved  │
                    │   registers   │
                    ├───────────────┤
                    │    loacal     │    current
                    │   variables   │     frame
                    │       &       │
                    │  temporaries  │
                    ├───────────────┤
                    │  argument m   │
        outgoing    │      ...      │
        arguments   │  argument 2   │
                    │  argument 1   │
   stack pointer ──►├───────────────┼────────────────
                    │               │
                    │               │     next
                    │               │     frame
                    │               │ │
                    │               │ ▼ Low Address
```

每一个函数的栈帧中，从高地址到低地址依次包括：

1. **返回地址**：保存调用者的返回地址`ra`，用于函数执行完成后跳转回调用点
2. **保存后的寄存器**：某些寄存器需要由被调用者保存，如`s0-s11`(保存跨函数调用的数据)
3. **局部变量和临时变量**：函数中定义的局部变量和临时变量，例如调用者负责保存的临时寄存器`t0-t6`
4. **参数溢出空间**：如果传递给函数的参数超过寄存器能容纳的数量(例如，超过`a0-a7`的8个参数)，多余的参数会存储在栈帧中
   - 这里在调用者和被调用者都要体现‘
   - 当超过8个参数的时候被调用方要先压栈
   - 调用方取参的时候要先`+8` 绕过`ra`和`fp`

当前函数的栈帧的地址范围由栈指针`sp`和帧指针`s0/fp`确定，为`[sp,fp)]`。对于较低的地址，可以用`sp`加上偏移量来访问栈帧中的变量；对于较高的地址则可以使用`fp`。因此，在处理函数调用过程中，我们要维护好这两个指针

### 3.2 函数调用流程

在`RISC-V`的函数调用中，调用者(`Caller`)和被调用者(`Callee`)需要分工协作，维护栈帧并完成寄存器管理。调用者需要完成一下任务：

1. 将参数放入寄存器`r0-r7`中，如果参数数量超过了`8`个，多余的参数需要存放在自己的栈帧的参数溢出空间中
2. 保存必要的`Caller-saved`临时寄存器到栈上，以防被调用者覆盖。比如我们用到了`t0``t1`，则需要将这两个寄存器的值保存到栈上
3. 跳转到被调用函数的入口地址
4. 被调用函数执行完毕后，从`a0`中获取返回值，恢复之前保存的临时寄存器

被调用者需要完成一下任务

1. 创建自己的栈帧
   1. 调整栈指针`sp`，为自己的栈帧分配空间
   2. 将`ra`和必要的`Callee-saved`寄存器保存到栈上。例如，如果你在函数中只用了`s0/fp s1`,则只需要将这两个寄存器的值保存到栈上
   3. 将帧指针`fp`设置为当前栈帧，用于访问局部变量和保存的寄存器。如果当前函数栈帧较小用不到`fp`，也可以不设置
2. 从参数寄存器`a0-a7`中读取参数。如果参数数量超过了`8`个，多余的参数需要使用`fp`从前一个栈帧的参数溢出空间中读取
3. 指向函数体，完成函数逻辑
4. 返回结果到`a0`中
5. 销毁当前的栈帧
   1. 恢复`ra`和`Callee-saved`寄存器
   2. 调整栈指针`sp`，释放当前栈帧的空间
   3. 返回到调用者

## 4. 活度分析与栈槽复用——从独占分配到共享复用

### 4.1 问题

朴素`spill-all`策略给每个虚拟寄存器分配一个 **永久独占**的4字节栈槽。函数中有`N`个虚拟寄存器，帧就需要`4N`字节的溢留区。`far_label`有`1300+`个虚拟寄存器，帧溢留区高达`5200`字节，大量`lw/sw offset(sp)`的`offset`超过`RISC-V 12`位立即数范围(`±2048`)，每条都要分解成`lui+add+lw/sw`三条指令

### 4.2 核心洞察

虚拟寄存器的**生命周期是局部的**。在一个巨型`if-else`链中：

```c
if(a == 1) (...)
else(a == 2) {...}
```

分支1和分支2的虚拟寄存器 **永远不会同时存活**——它们可以共用一个栈槽。


### 4.3 算法

**第一步：展开指令并构建活度区间**。将函数内所有指令展平编号，扫描每条指令的`get_uses()`和`get_defs()`，记录每个虚拟寄存器首次出现`first_def`和最后出现`last_use`的指令序号，得到`[first, last]`区间

```c++
struct Indexed {
    int idx;
    ASM::InstPtr inst;
};
std::vector<Indexed> indexed;
for(auto& block: func->blocks){
    for(auto& inst: block->insts){
        indexed.push_back({(int)indexed.size(), inst});
    }
}
```

然后扫描每一条指令，通过`get_uses()`和`get_defs()`获取该指令读写(定义/使用)的寄存器集合。跳过`a0`,`sp`等物理寄存器，只记录虚拟寄存器的首次定义位置`first`和最后使用位置`last`:

```c++
struct Range { int first = INT_MAX, last = -1; };
std::map<std::string, Range> ranges;

for (auto& item : indexed) {
    for (auto& r : item.inst->get_uses())
        if (!r.is_phys()) {
            auto& rg = ranges[r.name];
            rg.first = std::min(rg.first, item.idx);
            rg.last  = std::max(rg.last,  item.idx);
        }
    for (auto& r : item.inst->get_defs())
        if (!r.is_phys()) {
            auto& rg = ranges[r.name];
            rg.first = std::min(rg.first, item.idx);
            rg.last  = std::max(rg.last,  item.idx);
        }
}
```

这一步得到每个虚拟寄存器的`[first, last]`区间。例如`@tmp5`在指令100处定义、在指令350和500处使用，则区间`[100. 500]`

**第二步：处理循环，修正活度区间**。识别反向跳转(`j label`跳回前面)，将循环体内虚拟寄存器的`last_use`延长到循环末尾，确保跨迭代不冲突

线性扫描的区间有一个致命缺陷：它只考虑了代码的 **书写顺序**，没考虑循环的 **执行顺序**。考虑这段代码

```SQL
指令 10:  DEC x           (定义 x，first=10)
指令 20:  LABEL L_loop:   (循环头)
指令 30:  ...使用 x...     (last=30)
指令 40:  ...定义 @tmp8... (first=40)
指令 50:  GOTO L_loop      (跳回指令 20)
```

在扁平序列中，`x`的区间是`[10,30]`，`@tmp8`的区间是`[40,40]`，因为`30 < 40`，算法会认为两者不重叠，把`@tmp8`复用给`x`的槽位

但是执行时会：

- 第一轮：执行 `30`（使用 `x`），执行 `40`（定义 `@tmp8`，覆盖了 x 的槽位）
- 跳回 20，第二轮：执行 `30`（再次使用 `x`，但槽位已被 `@tmp8` 覆盖！）

所以需要检测**所有反向跳转**(`j label`的目标在跳转之前)，将循环体内所有虚拟寄存器的`last`延长到循环末尾

```c++
// 先建立标签→索引的映射
std::map<std::string, int> label_idx;
for(auto& item : indexed) {
    if(auto lab = std::dynamic_pointer_cast<ASM::Label>(item.inst)) {
        label_idx[lab->name] = item.idx;
    }
}

// 检测反向跳转(GOTO到更小的索引)
for(auto& item : indexed) {
    if(auto jmp = std::dynamic_pointer_cast<ASM::Jump>(item.inst)) {
        auto it = label_idx.find(jmp->label);
        if(it != label_idx.end() && it->second < item.idx) {
            int loop_start = it->second;
            int loop_end = item.idx;
            for(auto& [name, reg] : ranges) {
                if(rg.first < loop_end && rg.last >= loop_start) {
                    rg.last = std::max(rg.last, loop_end);
                }
            }
        }
    }
}
```

处理后，上例中`x`的区间变为`[10,50]`，`@tmp8`变为`[40,50]`，两者重叠(`30<40`不再成立，因为`x`的last现在是50)，不会共用槽位

**第三步：贪心槽位分配**。按活度区间排序，对每个虚拟寄存器：
- 遍历已有槽位，若某槽位的占用者在当前虚拟寄存器`first`之前已经死亡(`slot_free_at[s] < vr.first`)，则复用该槽位
- 若无可用槽位，分配新槽位

```c++
for (auto& vr : vregs) {
    bool reused = false;
    for(int s = 0; s < slot_free_at.size(); s++) {
        if(slot_free_at[s] < vr.first) { // 槽位已经释放
            slot_free_at[s] = vr.last;
            vreg_offset[vr.name] = base + s * 4;
            reused = true;
            break;
        }
    }
}
```