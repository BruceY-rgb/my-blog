---
title: 实现动态数组
date: 2026-08-10 17:00
categories:
    - LeetCode刷题
    - 数据结构及排序原理
tags:
    - LeetCode
    - 动态数组
cover: https://www.guru99.com/images/cpp-dynamic-allocation-of-arrays.png
---

## 1. 数组(顺序存储)基本原理

数组大体上可以分成两类：**静态数组**和 **动态数组**

- **静态数组**：一块连续的内存空间，我们可以通过索引来访问这块内存空间中的元素，这是数组的原始形态
- **动态数组**：编程语言为了方便我们使用在静态数组的基础上添加了一些常用的API，比如`push`,`insert`,`remove`等方法，这些API可以让我们更方便地操作数组元素，不用自己去写代码实现这些操作

这一章的内容就是仅仅使用最原始的静态数组，自己实现一个动态数组，实现 **增删查改**的常见API。以后在使用标准库提供的数据结构时，知道它们的底层运行原理即可。

有了动态数组，后面讲到的队列、栈、哈希表等复杂数据结构都会依赖它进行实现

### 1.1 静态数组

静态数组在创建的时候就要确定数组的元素类型和元素数量。只有在`C++`,`Java`,`Golang`这类语言中才提供了创建静态数组的方法，类似`Python`,`Javascript`这类语言并没有提供静态数组的定义方式

静态数组的用法比较原始

**定义**

```python
# 定义一个大小为10的静态数组
arr = [0]*10

# 使用索引赋值
arr[0] = 1
arr[1] = 2

# 使用索引取值
a = arr[0]
```

这是静态数组可以做的所有操作，静态数组的核心能力就是 **随机访问**和 **指定存储**，我们可以在$O(1)$的时间内直接完成操作

但是这个优势也是劣势。数组连续内存的特性给了它随机访问的能力，但是却无法顺场地完成插入与删除

### 1.2 增删查改

**数据结构的职责就是增删查改**，再无其他

刚才静态数组的两个核心操作分别对应的就是 **查和改**，也就是通过索引修改和访问对应元素的值。那么 **增和删**两个操作应该如何实现？

#### 1.2.1 增 

> 给静态数组增加元素就很复杂

**情况1：数组末尾追加元素(append)**

这种情况比较简单，直接在对应的索引位置赋值即可

```python
# 大小为10的数组已经装了4个元素
arr = [0] * 10
for i in range(4):
    arr[i] = i

# 在数组末尾追加一个元素 4
arr[4] = 4
```

**情况2：数组中间插入元素(insert)**

这种情况就要涉及到数据的迁移，给新元素腾出空间，然后才能插入元素，大概的代码逻辑是：

```python
# 大小为10的数组已经装了4个元素
arr = [0] * 10
for i in range(4):
    arr[i] = i

# 在索引2的位置插入元素5
# 需要先把索引2以及之后的元素都往后移一位
# 注意要倒着遍历以防元素被覆盖
for i in range(4, 2, -1):
    arr[i] = arr[i-1]

arr[2] = 5
```

**情况3：数组空间已满**

静态数组在创建的时候就要确定大小，但是当我们分配的所有空间都被占用的时候，没有位置留给新元素了应该怎么办？

**在原有空间后面再分配这种操作是完全不可取的**，因为连续内存必须一次性分配，分配之后不能再随意增减。因为这块内存后面的空间可能已经被占用，不能随便改变其身份

所以唯一的方案只能是 **重新申请一块更大的内存空间，把原来的数据复制过去，再插入新的元素**，这就是数组的扩容操作

```python
# 大小为10的数组已经装满了
arr = [i for i in range(10)]

# 现在想在数组末尾追加一个元素10
# 需要先扩容数组
newArr = [0] * 20

# 把原来的10个元素复制过去
for i in range(10):
    newArr[i] = arr[i]

# 释放旧的内存空间
# ...

# 在新的大数组中追加元素
newArr[10] = 10
```

数组的扩容操作会涉及到新数组的开辟和数据的复制，时间复杂度是$O(N)$

#### 1.2.2 删

> 删除元素的操作和增加元素的操作类似，也需要分情况讨论

**情况1：删除末尾元素**

这种情况是非常简单的，直接把末尾标记为一个特殊值就可以。(例如`-1`作为该位置被删除的特殊值，代表该位置已经删除)

> 后面具体实现动态数组的时候，会有更完善的方法删除数组元素

```python
# 大小为 10 的数组已经装了 5 个元素
arr = [0] * 10
for i in range(5):
    arr[i] = i

# 删除末尾元素，暂时用-1代表元素已经删除
arr[4] = -1
```

**情况2：删除中间元素**

这和增的方法类似，也要进行数据搬移，把被删除的元素后面的元素都往前移动一位，保持数组元素的连续性

要注意一下原有已经分配的内存因为数据搬移最后的几个位置会空出来，要标记为被删除

```python
# 大小为 10 的数组已经装了 5 个元素
arr = [0] * 10
for i in range(5):
    arr[i] = i

# 删除 arr[1]
# 需要把 arr[1] 之后的元素都往前移动一位
# 注意要正着遍历数组中已有元素避免覆盖，不懂的话请看下方可视化面板
for i in range(1, 4):
    arr[i] = arr[i + 1]

# 最后一个元素置为 -1 代表已删除
arr[4] = -1
```

### 1.3 动态数组

刚才讲了静态数组的能力和种种局限性，那么接下来的动态数组就可以很好解决静态数组存在的问题

首先，动态数组是无法解决数组在中间增删元素效率差的问题的。数组随机访问的能力源于数组连续的内存空间，而连续的内存空间就不可避免地面对数据搬移和扩容的问题

动态数组的底层逻辑依然是动态数组，只是将扩容、缩容的操作标准化为函数，并把增删查改操作进行封装，让我们使用起来更方便而已

下面用Python举例说一说其中的动态数组使用方法：

```python
# 创建动态数组
# 不用显式指定数组大小，它会根据实际存储的元素数量自动缩容扩容
arr = []

for i in range(10):
    # 在末尾追加元素，时间复杂度O(1)
    arr.append(i)

# 在中间插入元素，时间复杂度为O(N)
# 在索引2位置插入666
arr.insert(2, 666)

# 在头部插入元素，时间复杂度为O(N)
arr.insert(0, -1)

# 删除末尾元素，时间复杂度为O(1)
arr.pop()

# 删除中间元素
# 删除索引 2 的元素
arr.pop(2)

# 根据索引查询元素
a = arr[0]

# 根据索引修改元素
arr[0] = 100

# 根据元素值查找索引
index = arr.index(666)
```

## 2. 动态数组代码实现

### 2.1 自动扩缩容

一个简单的扩缩容策略：

- 当数组元素个数达到底层静态数组的容量上限，扩容为原来的2倍
- 当数组元素个数缩减到底层静态数组的容量的1/4时，缩容为原来的1/2

### 2.2 索引越界的检查

- `CheckElementIndex`:合法条件为`index < size`，用于检查每个元素的索引是否合法
- `CheckPositionIndex`:合法条件为`index ≤ size`，主要在插入元素的时候起作用，因为插入的位置是空隙，而不是元素的位置

### 2.3 删除元素谨防内存泄漏

单纯从算法角度，我们不需要关心被删除掉的元素应该如何处理，但是具体到代码层面，我们需要注意可能出现的内存泄漏

代码中我们的策略是删除元素的时候，我们会把被删除的元素置位`null`,以`Java`举例：

```java
// 删
public E removeLast() {
    E deletedVal = data[size - 1];
    // 删除最后一个元素
    // 必须给最后一个元素置为 null，否则会内存泄漏
    data[size - 1] = null;
    size--;

    return deletedVal;
}
```

- 如果我们不执行`data[size - 1] = null`这行代码，那么`data[size - 1]`这个引用就会一直存在，我们可以通过`data[size - 1]`访问这个对象，所以这个对象被认为是可达的，它的内存就一直不会被释放，进而造成内存泄漏
- 其他带有垃圾回收机制的语言也是类似的

### 2.4 动态数组代码实现

```python
class MyArrayList:
    # 默认初始容量
    INIT_CAP = 1

    def __init__(self, init_capacity = None):
        if init_capacity is None:
            init_capacity = MyArrayList.INIT_CAP
        self.data = [None]*init_capacity
        self.size = 0

    # 增
    def add_last(self, e):
        cap = len(self.data)
        # 看cap容量是否够用
        if cap == self.size:
            self._resize(2*cap)
        
        # 在尾部插入元素
        self.data[self.size] = e
        self.size += 1

    def add(self, index, e):
        # 检查索引越界
        self._check_position_index(index)

        cap = len(self.data)
        # 看data数组容量够不够
        if self.size == cap:
            self._resize(2*cap)
        
        # 搬移数据 data[index..] -> data[index+1...]
        # 给新元素腾出位置
        for i in range(self.size, index, -1):
            self.data[i] = self.data[i-1]

        # 插入新元素
        self.data[index] = e

        self.size += 1

    def add_first(self, e):
        self.add(0, e)

    # 删
    def remove_last(self):
        if self.size == 0:
            raise Exception("NoSuchElementException")
        cap = len(self.data)
        # 可以缩容，节约空间
        if self.size == cap//4:
            self._resize(cap//2)
        
        deleted_val = self.data[self.size - 1]
        self.size -= 1
        return deleted_val

    def remove(self, index):
        # 检查索引越界:
        self._check_element_index(index)

        cap = len(self.data)
        # 可以缩容，节约空间
        if self.size == cap//4:
            self._resize(cap//2)

        deleted_val = self.data[index]

        for i in range(index + 1, self.size):
            self.data[i - 1] = self.data[i]
        
        self.data[self.size - 1] = None
        self.size -= 1

        return deleted_val

    def remove_first(self):
        return remove(0)

    # 查
    def get(self, index):
        # 查看索引是否越界
        self._check_element_index(index)

        return self.data[index]

    # 改
    def set(self, index, element):
        # 检查索引越界
        self._check_element_index(index)
        # 修改数据
        old_val = self.data[index]
        self.data[index] = element
        return old_val
    
    # 工具方法
    def get_size(self):
        return self.size
    
    def is_empty(self):
        return self.size == 0
    
    # 将data的容量改为newCap
    def _resize(self, new_cap):
        temp = [0] * cap
        for i in range(self.size):
            temp[i] = self.data[i]
        self.data = temp

    def _is_element_index(self, index):
        return 0<=index<self.size
    
    def _is_position_index(self, index):
        return 0<=index<=self.size

    def _check_element_index(self, index):
        if not self._is_element_index(self, index):
            raise IndexError(f"Index: {index}, Size: {self.size}")
    
    def _check_position_index(self, index):
        if not self._is_position_index(self, index):
            raise IndexError(f"Index: {index}, Size: {self.size}")

    def display(self):
        print(f"size = {self.size}, cap = {len(self.data)}")
        print(self.data)
```

