---
title: Chapter 11 Register Allocation
date: '2026-06-02 14:00'
categories:
  - CS课程笔记
  - 编译原理
  - 课程笔记
tags:
  - 编译原理
cover: 'https://www.dotcpp.com/assets/img/%E7%BC%96%E8%AF%91%E5%99%A8.jpeg'
description: >-
  为什么需要寄存器分配 - 速度：寄存器快于内存，寄存器比缓存快大约2-7倍 - 真实机器上的寄存器数量是有限的 什么是寄存器分配 -
  寄存器分配器的任务，就是把很多临时变量分配到 K 个机器寄存器中 - requirements：使用不超过 K 个寄存器生成正确的代码 - 正确性 -
  寄存器数量限制 - 效率 如何实现
published: true
legacyPath: 2026/06/02/compile/Chapter11
sourcePath: compile/Chapter11.md
---

<aside class="admonition note">
**为什么需要寄存器分配**

- 速度：寄存器快于内存，寄存器比缓存快大约2-7倍
- 真实机器上的寄存器数量是有限的

**什么是寄存器分配**

- 寄存器分配器的任务，就是把很多临时变量分配到`K`个机器寄存器中
- requirements：使用不超过`K`个寄存器生成正确的代码
  - 正确性
  - 寄存器数量限制
  - 效率

**如何实现寄存器分配**

- **Graph Coloring**:有效但是效率比较差
- **Linear Scan**:更高效，有效性比较相似

![寄存器分配的一些方法](/my-blog/2026/06/02/compile/Chapter11/image-239.png)

- 通过图着色进行寄存器分配
  - 构造一个冲突图
  - 对冲突图进行着色
- 任意一对被冲突边连接的节点，都不能被 分配相同的颜色
  - 颜色对应真实寄存器
</aside>
## 11.1 Coloring By Simplification

- 寄存器分配是一个`NP-complete`问题
  - 图着色也是`NP-complete`问题
- 有一种线性时间的近似算法，在实践中效果很好
  - 它的主要阶段包括：`Build,Simplify,Spill and Select`

### 11.1.1 Build

- 构造冲突图
  - 每个节点表示一个临时变量
  - 一条边`(t1,t2)`表示临时变量`t1`和`t2`不能被分配到同一个寄存器
  - 需要对程序中的所有位置进行分析
- 产生冲突边最常见的原因是：**`t1`和`t2`在同一时间都是活跃的**

### 11.1.2 Simplify

使用一个简单的启发式方法对图进行着色

- 假设图`G`中有一个节点`m`，其邻居数量少于`K`(`K`：机器寄存器的数量)
- 通过移除`m`，得到图`G'=G-{m}`

![简化示意](/my-blog/2026/06/02/compile/Chapter11/image-240.png)

- 这自然引出了一个 **基于栈**的或者**递归式**的图着色算法
  - 反复移除度数小于`K`的节点，并把这些节点压入栈中
  - 每进行一次这样的简化，都会降低其他节点的度数，从而带来更多可以继续简化的机会

> 也就是说，删掉一个节点后，它的邻居少了一个连接边，邻居的度数也会降低。原来不能删的节点，可能因此变成可以删

- 如果一个节点的度数小于`K`，那么它一定可以用`K`种颜色完成着色
- 递归地从图中删除可以`K`着色的节点，并把它们压入栈中，知道图中只剩下重要度数的节点，也就是 **度数≥K**的节点

### 11.1.3 Spill

- 在简化过程中，可能会出现某一时刻，图`G`中只剩下 **重要度数**的节点，也就是所有节点的度数都满足(`degree ≥ K`)
- **溢出**：我们可以选择图中的某个节点，并决定把它**表示在内存中**，而**不是放在寄存器中**
- **乐观着色**
  - 对`spill`效果的一种乐观近似是：被选择溢出的节点，不再和图中剩下的其他节点发生冲突
  - 因此可以把这个节点从图中删除并压入栈中，然后继续`Simplify`简化过程

**基本方法**

- 选择一个节点作为 **溢出的候选节点**
- 把它从图中移除并放入栈中

<aside class="admonition example">
选择节点`b`，然后继续简化，依次删除`d,a,c`

![删除阶段](/my-blog/2026/06/02/compile/Chapter11/image-241.png)

> `m`是安全可以简化的安全节点，可以最先被删除并压栈
</aside>
### 11.1.4 Select

给图中的节点分配颜色

- 从空图开始，我们不断从栈顶取出节点，把它重新加入图中，从而逐步恢复原来的图
- 当我们把一个节点加入图中时，必须给它找到一种可用的颜色
- 当一个之前通过`Spill`启发式压入栈的潜在节点`n`被弹出时，**不能保证它一定可以被着色**
- 如果`n`的邻居使用的颜色数目少于`K`，那么我们就可以给`n`着色，`n`就不会变成真正的`spill`
- 这种技术叫做 **乐观着色**

<aside class="admonition example">
![Select阶段](/my-blog/2026/06/02/compile/Chapter11/image-242.png)

根据目前栈的情况，我们`Select`的操作顺序是

1. 弹出 c，给 c 染色
2. 弹出 a，把 a 加回图中，给 a 染色
3. 弹出 d，把 d 加回图中，给 d 染色
4. 弹出 b，把 b 加回图中，尝试给 b 染色
5. 弹出 m，把 m 加回图中，给 m 染色

这个`b`是我们的`potential Spill`，这个节点在入栈时并不满足`degree < k`，所有它将来放回来时，不保证一定有颜色可选

比如此时我们`b`的邻居颜色集合可能是`{绿色, 蓝色}`,但是两种颜色都被占了，`b`就找不到颜色。此时`b`才变成真正的`spill`，需要放到内存中

但是如果`b`的邻居虽然很多，但是最终只用了少于`K`种颜色，例如`邻居颜色集合 = {绿色}`，那么`b`仍然可以用蓝色。此时`b`虽然之前是`potential spill`，但是最后不需要真正`spill`，这就是乐观着色

![乐观着色](/my-blog/2026/06/02/compile/Chapter11/image-243.png)
</aside>
- 如果节点`n`的所有邻居已经使用了`K`中不同的颜色
    - 那么就发生了真正的溢出
    - 我们不给这个节点分配任何颜色，而是继续执行`Select`阶段，以找出其他**真正需要溢出的节点**

<aside class="admonition example">
![非乐观的情况](/my-blog/2026/06/02/compile/Chapter11/image-244.png)

这里`d`成为了`actual spill`，因为`K=2`，现在`d`的邻居已经把两种颜色都占满了，也就是它最终不能放进寄存器，只能放到内存中
</aside>
### 11.1.5 Start Over

如果`Select`阶段无法为某些节点找到颜色，那么程序必须被重写

- 在每次使用这些变量之前，先从内存中把它们取出来
- 在每次定义这些变量之后，再把它们存回内存

因此，一个被溢出的临时变量会变成若干个新的临时变量，这些新临时变量的**活跃区间很短**。它们仍然会和图中的其他临时变量发生冲突

所以，需要在重写后的程序上重新执行寄存器分配算法。这个过程会不断迭代，知道`Simplify`阶段成功完成，并且不再产生`spill`


<aside class="admonition example">
假设有一个临时变量`t`，它被决定`spill`

原始代码可能是

```
t := a + b
x := t * 2
y := t + 1
```

如果`t`不能放寄存器，就要把它放到内存槽里，比如`mem[t]`，重写之后大概变成

```
t1 := a + b
mem[t] := t1

t2 := mem[t]
x := t2 * 2

t3 := mem[t]
y := t3 + 1
```
</aside>
![流程图示意](/my-blog/2026/06/02/compile/Chapter11/image-245.png)

<aside class="admonition example">
整个流程示例

- `K=4`
- `simplify`这个阶段可以从`f,h,c,f`这几个节点开始
  - 因为他们的邻居数目少于`K`


我们每次删除只需要找到当前邻居数目少于`K`的节点就可以作为候选节点

![指令与冲突图](/my-blog/2026/06/02/compile/Chapter11/image-246.png)

最初状态下，`g,h,c,f`这几个节点的度数都小于`4`，所以它们都可以作为最早被删除的候选节点

> 删除一个节点后，它相关的边也会被删除。这样其他节点的度数可能会下降，于是又会产生新的可删除节点

依据上述原则我们可以得到一个可能的入栈序列：`g → h → k → d → j → e → f → b → c → m`

> 这个顺序不是唯一的，只要每一步删除的节点当时满足`degree < 4`就是合法的

接下来进入`Select`阶段，这个阶段恰好和`Simplify`相反

- 从栈顶弹出节点
- 重新放回图中
- 给它分配一个可用的寄存器

也就是按照反向顺序处理：`m → c → b → f → e → j → d → k → h → g`。每次给一个节点分配寄存器时，只要它不能和已经着色的邻居使用同一个寄存器即可

![分配后的示意图](/my-blog/2026/06/02/compile/Chapter11/image-247.png)
</aside>
## 11.2 Coalescing

### 11.2.1 What

- 如果一条`MOVE`指令的源节点和目标节点之间，在冲突图中没有变：那么这条`MOVE`指令可以被消除
- 源节点和目标节点被 **合并**(`coalescing`)成一个新的节点。这个新节点的边，是原来两个节点的边的并集

![节点合并的例子](/my-blog/2026/06/02/compile/Chapter11/image-248.png)

### 11.2.2 Why

- 合并可能会提高图的可着色型

![合并的例子](/my-blog/2026/06/02/compile/Chapter11/image-249.png)

合并之后，`t1`和`t4`都只剩下一个邻居

### 11.2.3 Conservative Coalescing

- **问题**
  - 被引入的新节点比被删除的旧节点受到更多，因为它包含了两个节点边的并集
  - 一个在合并前可以用`k`种颜色着色的图，在鲁莽合并之后(`reckless coalescing`)可能不再能用`k`种颜色着色
- **Idea**:`conservative coalescing`(保守合并)
  - 只在安全的时候进行合并
  - **safe**:合并之后不会让图变得不可着色

> 也就是说，合并之前能用`K`个寄存器分配，合并之后仍然能够用`K`个寄存器分配

*如何判断一次合并是否安全*

- `Briggs`
- `George`

#### 1. Briggs

- 如果把节点`a`和节点`b`合并后得到新节点`ab`，并且`ab`的 **significant degree**要少于`K`个，那么`a`和`b`要合并
- 这种合并可以保证：不会把一个原本可以用`K`中颜色着色的图，变成不能用`K`种颜色着色的图
- 用寄存器分配语言就是：如果原来能用`K`个寄存器分配，那么按照`Briggs`准则合并之后，也**不会因为这次合并导致寄存器分配失败**
  - `Simplify`阶段就会把所有 **不重要度数**的节点都删除掉(`degree < K`的节点)
  - 合并后的节点最终只会和那些原本是重要度数的邻居相邻
  - 如果合并节点`ab`的重要度数邻居少于`K`个，那么`Simplify`阶段仍然可以把`ab`删除掉

<aside class="admonition example">
![Biggs准则例子](/my-blog/2026/06/02/compile/Chapter11/image-250.png)
</aside>
#### 2. George

 如果对于`a`的每一个邻居`t`，都满足下面*两个条件之一*，那么节点`a`和`b`可以合并

1. `t`本来就和`b`冲突
2. 或者`t`是低度数节点，也就是

```
degree(t) < K
```

这种合并是安全的

- 如果`t`本来就和`b`冲突，那么合并`a`和`b`之后，`(a,t)`和`(b.t)`会变成`(ab. t)`，这不会增加新节点`ab`的度数
- 如果`t`是低度数节点，那么它会在`Simplify`阶段被删除，所以也不会真正增加合并后节点的着色压力

!!! note "Summary"
- Briggs看的是 *合并后ab有多少个高度数邻居*
- `George`看的是`a`的每个邻居`t`是否安全
</aside>
### 11.2.4 Coloring with Coalescing

`coalesce,simplify,spill`这些过程应该交替进行，直到图为空

![有合并的图着色流程](/my-blog/2026/06/02/compile/Chapter11/image-252.png)

#### 1. Build

- 构造冲突图(`interference graph`)
- 把每个节点分类为`move-related`或`non-move-related`
  - 如果一个节点是某条`MOVE`指令的源操作数或目标操作数，那么它就是`move-related`

> `move-related`节点可能有机会通过`coalscing`合并，从而删除`MOVE`指令

#### 2. Simplify

依次删除一个非`move-related`且低度数节点，也就是`degree < K`的节点

#### 3. Coalesce

- 在简化后的图上执行保守合并
- 如果合并后的新节点不再与`MOVE`相关联，那么它可以在下一轮`Simplify`中被删除
- `Simplify`和`Coalesce`会反复执行直到图中只剩下高度数节点或者`move-related`节点

#### 4. Freeze

- 如果某些`MOVE`相关节点不能安全`coalesce`，但是它们又阻碍`simplify`，那么编译器可能选择一个低度数的`move-related`节点并将其参与的`move`指令`freeze`
  - `freeze`:放弃某些`MOVE`的合并机会，把相关节点当成普通节点处理
  - 这会使该节点，也可能包括与这些被冻结的`move`相关的其他节点被看做是`non-move-related`节点

> `freeze`是在节点和`move`有关，但是又不能安全合并时使用的 **折中办法**。它放弃这条`move`的合并机会，把相关节点改成普通节点，让`Simplify`可以继续进行

<aside class="admonition example">
![冻结示例](/my-blog/2026/06/02/compile/Chapter11/image-251.png)
</aside>
#### 5. Spill

如果图中已经没有低度数节点了，我们就选择一个高度数节点作为潜在溢出节点，并把它压入栈中

#### 6. Select

弹出整个栈，并为节点分配颜色

<aside class="admonition warning">
如果出现了任何真正的溢出节点，就需要重新构造冲突图

<aside class="admonition example">
```
1  t ← a + b
2  c ← t + d
3  e ← t + f
```

这里`t`在第一行被定义，在第2、3行使用，所以`t`的活跃时间较长

如果这段期间还有很多变量也活跃，那么`t`会和很多变量冲突，最后`Select`阶段可能发现：*t没有可用寄存器*。这时`t`变成了`actual spill`,要放到内存中，这时程序实际上变成了

```
1  t1 ← a + b
2  store t1 → slot_t

3  t2 ← load slot_t
4  c ← t2 + d

5  t3 ← load slot_t
6  e ← t3 + f
```

原来的一个变量`t`变成了几个新的临时变量：`r1,r2,r3`，它们的活跃区间很短,这时整个程序的冲突情况已经变了

<aside class="admonition example">
- `K=4`
- 节点`d,c,b,j`是唯一的`move-related nodes`
- `Simplify`阶段的初始工作列表中必须包含`non-move-related nodes`
- 所以初始可以放入`work-list`的节点是：`f,g,h`
- 在移除`g,h,k`之后，变化如图所示

![移除non-move-related节点](/my-blog/2026/06/02/compile/Chapter11/image-253.png)

如果我们此时执行一轮`coalescing`，会发现`c`和`d`确实可以合并，新节点继承了原来`c`和`d`的冲突边

![c，d合并](/my-blog/2026/06/02/compile/Chapter11/image-254.png)

可以进一步合并`b`和`j`，二者满足安全合并条件，可以进行合并。合并完成之后，图中不再有`move-related nodes`。也就是说，没有更多`MOVE`关系需要尝试合并，于是代码重新回到`Simplify`

![合并b，j](/my-blog/2026/06/02/compile/Chapter11/image-255.png)

- 一种可能的颜色分配结果如下

![最终分配结果](/my-blog/2026/06/02/compile/Chapter11/image-256.png)
</aside>
## 11.3 Precolored Nodes

- 有一些寄存器有特殊的用途：
  - `argument registers`:参数寄存器
  - `frame pointer`:帧指针寄存器
  - `return value register`:返回值寄存器
- 对于这类特殊的寄存器，编译器会使用一个特定的`temporary`来表示它，并且这个`temporary`永久绑定到该寄存器中，比如`FP`
- 这样的`temporary`称为 **预着色点**(`precolored`)
  - 每一种颜色只能有一个预着色节点
  - 所有的预着色节点之间都冲突
- 只要普通`temporary`和某个预着色寄存器不冲突，就可以把普通`temporary`分配到和该预着色寄存器相同的颜色
  - 例如，一个调用约定规定的寄存器，可以在某个过程内部被**重新用作临时变量寄存器**
- 我们 **不能对预着色节点执行simplify操作**
- 我们 **不应该把预着色节点`spill`到内存中**
  - 机器寄存器本来就是寄存器，不能被当做普通变量一样放到内存中

### 11.3.1 George Criterion with Precolored Nodes

- **George Criterian got Coalescing**:如果对于节点`a`的每一个邻居`t`，都满足下面两种情况之一，那么`a`和`b`可以合并
  - `t`已经和`b`冲突
  - `t`是低度数节点，也就是`degree(t) < K`
- 当把`George`准则用于包含 **预着色节点**的节点对时，总是选择那个 **不是预着色节点**的节点作为`a`来检查规则

<aside class="admonition example">
`k=3`要考虑合并`r3`和`c`

![示例](/my-blog/2026/06/02/compile/Chapter11/image-257.png)

- `r3`是一个预着色节点，也就是它已经固定对应真实寄存器`r3`
- 如果我们合并`r3`和`c`，那么就会让一个原本还没有固定颜色的节点`c`被强制着色为`r3`，并且`c`不能再被`spill`

> 因此George准则会选择非预着色节点作为`a`
</aside>
### 11.3.2 Temporary Copies of Machine Registers

- 图着色算法会反复执行`simplify,coalesce,spill`，直到图中只剩下预着色节点
- 因为预着色节点不能`spill`所以前端必须要小心，让它们的活跃区间尽量短
  - 方法是：**生成MOVE指令，把值移入或移出预着色节点**
  
<aside class="admonition example">
假设`r7`是一个`callee-save register`，也就是如果当前函数使用了`r7`，那么函数返回前必须把`r7`恢复成调用者原来的值

**不好的做法**

```
Enter: def(r7)

...

Exit: use(r7)
```

- 函数一进入，就定义/保存`r7`；函数退出时又使用/恢复`r7`
- 这样会导致 **r7从函数入口一直live到函数出口**
- 问题是`r7`是预着色节点，不能`spill`，如果它整个函数都活跃，就会和函数内部很多`temporary`冲突，导致寄存器分配压力非常大

**更好的做法**

```
Enter:
def(r7)
t231 ← r7

...

r7 ← t231
Exit:
use(r7)
```

 - 进入函数时，把`r7`的旧值复制到一个普通`temporary`(`t231←r7`)
 - 函数快结束时，再把这个`temporary`复制回`r7`(`r7←t231`)
 - 这样做`r7`本身不需要从入口一直`live`到出口；真正长期保存的是`t231`这个普通`temporary`，可以参与正常寄存器的分配。如果寄存器不够，它可以`spill`到内存
</aside>
#### Caller-save Registers and Callee-save Registers

```c
foo() {
    t = ...
    ... = ... t ...

    s = ...
    f()
    g()
    ... = ... s ...
}
```

这里有两个变量

- `t`:在函数调用`f()`,`g()`之前就已经不再需要
- `s`:定义后跨过了`f()`,`g()`，之后还要使用

- 如果一个局部变量或者编译器临时变量 **不会跨越任何函数调用仍然活跃**，通常应该把它分配到`caller-save register`
- 任何跨越多个函数调用仍然活跃的变量，应该保存在`callee-save register`中
  - 因为被调用函数使用它时必须负责恢复
  - 对于调用者来说即使调用了`f(),g()`后，`callee-save`寄存器里的值还能保持

```
Enter:
    def(r7)
    t231 ← r7

    ...

    r7 ← t231
Exit:
    use(r7)
```

- 如果变量`x`跨越一次函数调用仍然活跃，那么它会和所有`caller-save`的预着色寄存器冲突
  - `caller-save`寄存器在函数调用的时候可能被破坏
  - 如果`x`跨过函数调用之后还要用，那`x`不能放在`caller-save`寄存器里。
  - 所以在冲突图中，`x`和所有`caller-save registers`都要有冲突边
  - 并且它还会和`callee-save`寄存器**创建的新临时变量冲突**(`t231`)
  - **很可能会发生spill**
  - 如果使用常见的`spill-cost`启发式策略：优先溢出 **度数高但是使用次数少**的节点，那么哪个变量会先被`spill`？`x`还是`t231`

> `t231`通常情况下只在入口和出口附近使用;而`x`可能在程序中真正参与计算，使用次数可能更多


!!! example "带预着色节点的寄存器分配"
```c
int f(int a, int b) {
    int d = 0;
    int e = a;

    do {
        d = d + b;
        e = e - 1;
    } while (e > 0);

    return d;
}
```

- 两个参数：`a,b`
- 两个局部变量：`d,e`

**机器寄存器设定**

- 假设机器只有`3`个寄存器，并且近期约定如下
  - `r1,r2`是`caller-save registers`——调用后可能会被破坏
  - `r3`是`callee-save register`——被调用函数需要负责保存和恢复

**转化后的中间代码**

根据调用约定，参数和`callee-save`寄存器会被处理成下面形式：


```
enter:  c ← r3

        a ← r1
        b ← r2
        d ← 0
        e ← a

loop:   d ← d + b
        e ← e - 1
        if e > 0 goto loop

        r1 ← d
        r3 ← c
        return    (r1, r3 live out)
```

这里有几个关键点

- 参数传递：`a←r1,b←r2`表示函数参数`a`和`b`初始分别来自寄存器`r1`和`r2`
- 返回值：`r1←d`表示函数返回值要放到`r1`中
- 保存`callee-save`寄存器：因为`r3`是`callee-save-register`，所以函数如果可能使用`r3`，需要保存并恢复它
  - 这里`c`的作用就是 *保存r3的旧值*

```
c ← r3
...
r3 ← c
```

这道题目中，`r1,r2,r3`是`precolored nodes`，也就是说，它们的颜色已经固定

- r1 固定为颜色 1
- r2 固定为颜色 2
- r3 固定为颜色 3

所以图中一共有两类节点

| 节点类型   | 例子            | 特点                                |
| ---------- | --------------- | ----------------------------------- |
| 预着色节点 | `r1, r2, r3`    | 颜色固定，不能 spill，不能 simplify |
| 普通节点   | `a, b, c, d, e` | 可以 simplify、coalesce、spill      |

- 我们注意到这里所有`non-precolored nodes`的`degree`都`≥K`，也就是说所有普通节点都不满足低度数条件，所以我们没有机会进行`simplify`和`freeze`
- 如果我们选择合并`MOVE`两端节点从而消除`MOVE`指令，合并之后的新节点我们会发现仍然不会变成低度数节点(或者说不能安全地降低图的着色压力)

> 例如如果我们想合并`r3`和`c`。使用`George`准则的时候，需要把普通节点作为`a`，预着色节点作为`b`，这时候我们就要检查`c`的所有邻居，会发现`c`不满足`Georage`准则，所以不能和`r3`合并

综上，这道题目当前 *不能simplify, 不能freeze，不能coalesce*

因此。我们必须 **选择某个节点进行spill**，也就是需要把某个普通变量放到内存里，减少寄存器压力

<aside class="admonition warning">
不能`spill`掉预着色节点，只能从普通变量中选择：`a,b,c,d,e`
</aside>
我们选择`spill`节点的原则是：**选择`degree`较高，但是使用次数较少的节点**

![计算各个非预着色节点的spill优先级](/my-blog/2026/06/02/compile/Chapter11/image-258.png)

从表格中看，`c`的`spill priority`最低，这说明`c`的`degree`很高，但是使用次数很少

![首先spill掉c节点](/my-blog/2026/06/02/compile/Chapter11/image-259.png)
![执行合并操作](/my-blog/2026/06/02/compile/Chapter11/image-260.png)
![继续执行合并操作](/my-blog/2026/06/02/compile/Chapter11/image-261.png)

- 现在我们不能继续合并`r1ae`和`d`因为它们之间的`move`是一个受约束的`move`
  - 我们要将这条`move`从后续考虑中移除
  - `d`不再被看做`move-related`节点

接下来由于`d`不是`move-related`节点了，那么我们就可以回到`Simplify`规则

此时`d`的邻居大概是`r1ae,r2b`，所以`degree(d) = 2 < K = 3`,因此`d`可以被`simplify`。我们可以将`d`删除并压入栈中。

> 之前`c`已经在第一步`spill`时被压入栈中，所以现在栈里应该是`c,d`

**Select**

从栈中弹出节点，并为它们分配颜色

- 节点`a,b,e`已经通过`coalesce`被分配了颜色
- 选择`d`给它分配颜色`r3`
- 弹出`c`:`c`变成了一个`actual spill`，也就是真正的 **溢出节点**

> 因为到`select`阶段弹出`c`时，发现它的邻居已经占用了所有`3`个寄存器颜色

**rewrite**

- 由于前面我们发现了`c`是一个`actual spill`，所以现在必须重写程序，把`c`放到内存里
- 规则如下

```
Before each use  -> fetch
After each def   -> store
```

![代码转换图](/my-blog/2026/06/02/compile/Chapter11/image-262.png)

**Select**

![select](/my-blog/2026/06/02/compile/Chapter11/image-263.png)

- 从栈中弹出节点，并为`d`选择颜色`r3`
- 其他所有节点都已经被合并，或者本身就是预着色节点

![rewrite](/my-blog/2026/06/02/compile/Chapter11/image-264.png)
![delete](/my-blog/2026/06/02/compile/Chapter11/image-265.png)
</aside>
!!! note "一道课后作业"
## 第一阶段：活跃性分析（Liveness Analysis）

根据给定的汇编代码，进行**后向数据流分析**。

> **⚠️ 关键约定**  
> 遇到 `call f` 时，必须视其重新定义（Def）了 Caller-save 寄存器 `$r_1$`、`$r_2$`。

| # | 指令 | Use | Def | Live-Out |
|---|------|-----|-----|----------|
| 1 | `f: c ← r₃` | `{r₃}` | `{c}` | `{r₁, c}` |
| 2 | `p ← r₁` | `{r₁}` | `{p}` | `{p, c}` |
| 3 | `if p=0 goto L₁` | `{p}` | `∅` | `{p, c}` |
| 4 | `r₁ ← M[p]` | `{p}` | `{r₁}` | `{r₁, p, c}` |
| 5 | `call f` | `{r₁}` | `{r₁, r₂}` | `{r₁, p, c}` |
| 6 | `s ← r₁` | `{r₁}` | `{s}` | `{s, p, c}` |
| 7 | `r₁ ← M[p+4]` | `{p}` | `{r₁}` | `{r₁, s, c}` |
| 8 | `call f` | `{r₁}` | `{r₁, r₂}` | `{r₁, s, c}` |
| 9 | `t ← r₁` | `{r₁}` | `{t}` | `{s, t, c}` |
| 10 | `u ← s + t` | `{s, t}` | `{u}` | `{u, c}` |
| 11 | `goto L₂` | `∅` | `∅` | `{u, c}` |
| 12 | `L₁: u ← 1` | `∅` | `{u}` | `{u, c}` |
| 13 | `L₂: r₁ ← u` | `{u}` | `{r₁}` | `{r₁, c}` |
| 14 | `r₃ ← c` | `{c}` | `{r₃}` | `{r₁, r₃}` |
| 15 | `return` | `{r₁, r₃}` | `∅` | `∅` |

---

## 第二阶段：构建初始冲突图（Build Interference Graph）

根据 **Def 与 Live-Out 重叠** 规则构建**实线**（冲突边），根据 **MOVE 指令** 构建**虚线**（传送边）。

### 2.1 物理寄存器冲突（实线）

物理寄存器之间天然互斥，三者两两连接实线：

$$
(r_1, r_2),\quad (r_2, r_3),\quad (r_1, r_3)
$$

### 2.2 临时变量冲突（实线）

变量 `c` 生命周期极长，与 `r₁, r₂, p, s, t, u` 全部冲突：

$$
c \leftrightarrow \{r_1, r_2, p, s, t, u\}
$$

$$
\deg(c) = 6
$$

由于 `call f` 会破坏 `r₁`、`r₂`，因此：

- `p` 与 `r₁, r₂` 冲突
- `s` 与 `r₁, r₂` 冲突

即：

$$
p \leftrightarrow r_1, r_2 \qquad s \leftrightarrow r_1, r_2
$$

### 2.3 MOVE 指令产生虚线（传送边）

可合并偏好：

$$
(c, r_3),\quad (t, r_1),\quad (u, r_1)
$$

### 2.4 Constrain（约束操作）

原始代码中存在 `p ← r₁` 和 `s ← r₁`，理论产生两条虚线：

$$
(p, r_1),\quad (s, r_1)
$$

**但是：**

- `p` 后续生命周期中与重新定义的 `r₁` 冲突
- `s` 后续生命周期中与重新定义的 `r₁` 冲突

因此必须**删除** `(p, r₁)` 和 `(s, r₁)`。

---

## 第三阶段：第一轮图着色（Simplify, Coalesce & Spill）

机器提供 `K = 3` 个物理寄存器：`r₁, r₂, r₃`。

### 3.1 合并（Coalesce）

由于包含物理寄存器，必须使用 **George 准则**。

**尝试合并 `(t, r₁)` 和 `(u, r₁)`：**

| 变量 | 邻居 |
|------|------|
| `t` | `{c, s}` |
| `u` | `{c}` |

`c` 和 `s` 均已经与 `r₁` 冲突，满足 George 准则：

> 对于待合并节点的所有邻居，必须要么低度数，要么已经与目标节点冲突。

✅ 允许合并：`t → r₁`、`u → r₁`

---

**尝试合并 `(c, r₃)`：**

`c` 的邻居为 `{r₁, r₂, p, s}`，其中：

$$
\deg(p) = 4 > 3 \quad\text{且}\quad p \not\leftrightarrow r_3
$$

违反 George 准则 → ❌ **拒绝合并**。

### 3.2 阻塞与潜在溢出（Spill Priority）

合并后仅剩 `p, s, c` 三节点，度数均为：

$$
\deg(p) = \deg(s) = \deg(c) = 4
$$

图着色死锁。计算溢出优先级：

$$
\text{Priority} = \frac{\text{Uses} + \text{Defs}}{\text{Degree}}
$$

| 节点 | Uses | Defs | Priority | 结果 |
|------|------|------|----------|------|
| `p` | 3 | 1 | $(3+1)/4 = 1.0$ | 保留 |
| `s` | 1 | 1 | $(1+1)/4 = 0.5$ | 🥫 潜在溢出 |
| `c` | 1 | 1 | $(1+1)/4 = 0.5$ | 🥫 潜在溢出 |

选择最低优先级的 `c`、`s` 标记为潜在溢出并压栈。随后 `deg(p) < 3`，执行 **Simplify**。

### 3.3 弹栈与实际溢出（Select）

| 弹出 | 结果 |
|------|------|
| `p` | ✅ 可分配：`p → r₃` |
| `s`, `c` | ❌ 邻居 `r₁, r₂, r₃` 已占满，无可用颜色 → **Actual Spill** |

---

## 第四阶段：重写程序（Rewrite Program）

为溢出变量 `s`、`c` 分配内存位置 `c_loc`、`s_loc`，并生成短生命周期临时变量：

```asm
f:  c1 <- r3
    M[c_loc] <- c1
    p <- r1
    if p = 0 goto L1
    r1 <- M[p]
    call f
    s1 <- r1
    M[s_loc] <- s1
    r1 <- M[p+4]
    call f
    t <- r1
    s2 <- M[s_loc]
    u <- s2 + t
    goto L2
L1: u <- 1
L2: r1 <- u
    c2 <- M[c_loc]
    r3 <- c2
    return
```

---

## 第五阶段：第二轮图着色（重新分析）

旧图作废，对重写后的程序重新分析。

### 5.1 拓扑降维

长生命周期变量 `c`、`s` 被拆分。新变量：

$$
c_1,\; c_2,\; s_1,\; s_2,\; t,\; u
$$

度数降为 `deg = 1`，变量 `p` 的 `deg(p) = 2`。所有节点均满足 `deg < 3` → ✅ 死锁解除。

### 5.2 重新评估 Constrain

```asm
s1 <- r1
M[s_loc] <- s1
```

`s₁` 写入内存后立即死亡，因此 `(s₁, r₁)` 重新允许合并。

### 5.3 第二轮 Coalesce

通过 George 准则，允许合并：

$$
(c_1, r_3),\quad (c_2, r_3),\quad (s_1, r_1),\quad (t, r_1),\quad (u, r_1)
$$

### 5.4 第二轮 Select

剩余变量着色：

$$
p \to r_3,\qquad s_2 \to r_2
$$

🎉 **本轮无任何 Spill！**

---

## 第六阶段：生成最终代码（Delete Redundant Moves）

根据最终着色结果替换变量，删除冗余 MOVE（`r1 ← r1`、`r3 ← r3`）：

```asm
f:  M[c_loc] <- r3
    r3 <- r1
    if r3 = 0 goto L1
    r1 <- M[r3]
    call f
    M[s_loc] <- r1
    r1 <- M[r3+4]
    call f
    r2 <- M[s_loc]
    r1 <- r2 + r1
    goto L2
L1: r1 <- 1
L2: r3 <- M[c_loc]
    return
```
</aside>
