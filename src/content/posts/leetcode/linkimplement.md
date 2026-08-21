---
title: 实现链表
date: '2026-08-10 17:00'
categories:
  - LeetCode刷题
  - 数据结构及排序原理
tags:
  - LeetCode
  - 单/双链表
cover: 'https://www.guru99.com/images/cpp-dynamic-allocation-of-arrays.png'
description: >-
  1. 链表(链式存储)基本原理 LeetCode 上的单链表节点定义为:
  这只是一个简单的单链表节点，但是在实际的编程语言中，我们使用的链表节点会稍微复杂一点： 主要区别有两个： 1.
  编程语言标准库一般都会提供泛型，也就是说我们可以指定 val 字段为任意类型，而 leetcode 的单链表节点的 val 字段只有 
published: true
legacyPath: 2026/08/10/leetcode/linkimplement
sourcePath: leetcode/linkimplement.md
---

## 1. 链表(链式存储)基本原理

`LeetCode`上的单链表节点定义为:

```python
class ListNode:
    def __init__(self, x):
        self.val = x
        self.next = NULL
```

这只是一个简单的单链表节点，但是在实际的编程语言中，我们使用的链表节点会稍微复杂一点：

```python
class Node:
    def __init__(self, prev, element, next):
        self.val = element
        self.prev = prev
        self.next = next
```

主要区别有两个：

1. 编程语言标准库一般都会提供泛型，也就是说我们可以指定`val`字段为任意类型，而`leetcode`的单链表节点的`val`字段只有`int`类型
2. 编程语言标准库一般使用的都是双链表而非单链表，单链表节点只有一个`next`指针，指向下一个节点；而双链表节点有两个指针，`prev`指向前一个节点，`next`指向下一个节点

有了`prev`前驱指针，链表支持双向遍历，但是由于要多维护一个指针，增删查改的时候会稍微复杂一些

### 1.1 为什么需要链表

链表和数组不同的是，一个链表不需要一整块连续的内存空间存储元素。链表的元素可以分散在内存空间的任何地方，通过每个节点上的`next`和`prev`指针将零散的内存块串联起来形成一个链式结构

这样的好处是

- 可以提高内存的利用效率
- 节点要用的时候插入，不用的时候拆除即可，不需要考虑扩容和数据搬移的问题。理论上讲，链表是没有容量限制的

但是链表也有自己的缺点，那就是查找只能通过遍历的方式，而无法通过索引的方式访问

### 1.2 单链表的基本操作

> 先实现一个工具函数

```python
class ListNode:
    def __init__(self, x):
        self.val = x
        self.next = None
    
# 输入一个数组，转化为一条单链表
def createLinkedList(arr: List[int]) -> ListNode:
    if arr is None or len(arr) == 0:
        return None
    
    head = ListNode(arr[0])
    cur = head
    for i in range(1, len(arr)):
        cur.next = ListNode(arr[i])
        cur = cur.next
    
    return head
```

#### 1. 查/改

> 单链表的遍历/查找/修改

**访问单链表的每一个节点并打印其值**

```python
# 创建一条单链表
head = createLinkedList([1,2,3,4,5])

# 遍历单链表
p = head
while p is not None:
    print(p.val)
    p = p.next
```

#### 2. 增

**头插法**

我们会持有单链表的头节点，所以只需要将插入的节点接到头节点后面即可(也就是头插法)

```python
# 创建一条单链表
head = createLinkedList([1, 2, 3, 4, 5])

# 在单链表头部插入一个新节点0
newNode = new ListNode(0)
newNode.next = head
head = newNode

# 现在链表变成了 0 -> 1 -> 2 -> 3 -> 4 -> 5
```

**尾插法**

```python
# 创建一条单链表
head = createLinkedList([1, 2, 3, 4, 5])

# 在单链表尾部插入一个6
p = head
while p.next is not None:
    p = p.next
# 现在 p 就是链表的最后一个节点
# 在 p 后面插入新节点
newNode = new ListNode(6)
p.next = newNode
```

**在单链表中间插入新元素**

> 这个操作稍微有一点复杂，我们还是要先找到要插入位置的前驱节点，然后操作前驱节点把新节点插进去

```python
# 创建一条单链表
head = createLinkedList([1, 2, 3, 4, 5])

# 在第 3 个节点后面插入一个新节点 66
# 先要找到前驱节点，即第 3 个节点
p = head
for _ in range(2):
    p = p.next
# 此时 p 指向第 3 个节点
# 组装新节点的后驱指针
new_node = ListNode(66)
new_node.next = p.next

# 插入新节点
p.next = new_node

# 现在链表变成了 1 -> 2 -> 3 -> 66 -> 4 -> 5
```

#### 3. 删

**在单链表中删除一个节点**

删除一个节点，要先找到被删除节点的前驱节点，然后把这个前驱节点的`next`指针指向被删除节点的下一个节点。这样就能把被删除节点从链表中摘除了

```python
# 创建一条单链表
head = createLinkedList([1, 2, 3, 4, 5])

# 删除第4个元素，要操作前驱节点
p = head
for i in range(2):
    p = p.next

# 此时 p 指向第 3 个节点，即要删除节点的前驱节点
# 把第 4 个节点从链表中摘除

p.next = p.next.next
```

<aside class="admonition warning">
被删除的节点在`Java`,`Python`,`Javascript`这类带有垃圾回收机制的语言中是可以被自动回收的。但是`C/C++`这类没有垃圾回收机制的语言需要手动调用`free/delete`进行释放，否则就会造成内存泄漏
</aside>
### 1.3 双链表的基本实现

先实现一下工具函数用于实现后续的双链表创建

```python
class DoublyListNode:
    def __init__(self, x):
        self.val = x
        self.prev = None
        self.next = None
def createDoublyLinkedList(arr: List[int]) -> Optional[DoublyListNode]:
    # Optional表示可以是DoubltListNode也可以是None
    if not arr:
        return None
    
    head = DoublyLiatNode(arr[0])
    p = head
    for i in arr[1:]:
        p.next = DoublyLinkList(i)
        p.next.prev = p
        p = p.next
    
    return head
```

#### 1. 查/改

**双链表的遍历/查找/修改**

对于双链表的遍历和查找，我们可以从头节点或者为节点开始，根据需要向前或者向后遍历

```python
head = createDoublyLinkedList([1, 2, 3, 4, 5])
tail = None

# 从头节点向后遍历双链表
p = head
while p:
    print(p.val)
    tail = p
    p = p.next

# 从尾节点向前遍历双链表
p = tail
while p:
    print(p.val)
    p = p.prev
```

#### 2. 增

**在双链表头部插入新元素**

```python
# 创建一条双链表
head = create_doubly_linked_list([1, 2, 3, 4, 5])

# 在双链表头部插入新节点 0
new_head = DoublyLinkList(0)
new_head.next = head
head.prev = new_head
head = new_head
```

**在双链表尾部插入新元素**

```python
# 创建一条双链表
head = createDoublyLinkedList([1, 2, 3, 4, 5])

tail = head
# 先走到链表的最后一个节点
while tail.next is not None:
    tail = tail.next

# 在双链表尾部插入新节点 6
newNode = DoublyListNode(6)
tail.next = newNode
newNode.prev = tail
# 更新尾节点引用
tail = newNode

# 现在链表变成了 1 -> 2 -> 3 -> 4 -> 5 -> 6
```

**在双链表的中间插入元素**

```python
# 创建一条双链表
head = createDoublyLinkedList([1, 2, 3, 4, 5])

# 想要插入到索引 3（第 4 个节点）
# 需要操作索引 2（第 3 个节点）的指针
p = head
for _ in range(2):
    p = p.next

newNode = DoublyLinkList(66)
newNode.next = p.next
newNode.prev = p.prev

p.next.prev = newNode
p.next = newNode 
```

#### 3. 删

在双链表中删除节点的时候，需要吊证前驱节点和后继节点的指针来摘除目标节点

```python
# 创建一条双链表
head = createDoublyLinkedList([1, 2, 3, 4, 5])

# 删除第4个节点
# 先找到第3个节点
p = head
for _ in range(2):
    p = p.next

# 现在 p 指向第 3 个节点，我们将它后面的那个节点摘除出去
toDelete = p.next

# 把 toDelete 从链表中摘除
p.next = toDelete.next
toDelete.next.prev = p

# 把 toDelete 的前后指针都置为 null 是个好习惯（可选）
toDelete.next = None
toDelete.prev = None
```

## 2. 链表代码实现

### 2.1 虚拟头尾节点

它的原理很简单，就是在创建双链表的时候创建一个虚拟的头节点和尾节点，无论双链表是否为空，这两个节点都存在，这样就不会出现空指针的情况，可以避免很多边界处理的特殊情况

<aside class="admonition example">
举例来说，假设虚拟头尾节点分别是 dummyHead 和 dummyTail，那么一条空的双链表长这样：

```
dummyHead <-> dummyTail
```

如果你添加 1,2,3 几个元素，那么链表长这样：

```
dummyHead <-> 1 <-> 2 <-> 3 <-> dummyTail
```

你以前要把在头部插入元素、在尾部插入元素和在中间插入元素几种情况分开讨论，现在有了头尾虚拟节点，无论链表是否为空，都只需要考虑在中间插入元素的情况就可以了，这样代码会简洁很多。

当然，虚拟头结点会多占用一点内存空间，但是比起给你解决的麻烦，这点空间消耗是划算的。

对于单链表，虚拟头结点有一定的简化作用，但虚拟尾节点没有太大作用。
</aside>
### 2.2 内存泄漏

假设单链表头节点：`head = 1 -> 2 -> 3 -> 4 -> 5`

```python
// 删除单链表头结点
head = head.next;

// 此时 head = 2 -> 3 -> 4 -> 5
```

我们会发现:*原来的那个头节点1的next指针没有断开，依然指向节点2*。

但是实际上这样写是可以的，因为原有的头节点不再会被任何人引用

### 2.3 双链表的实现

```python
class Node:
    def __init__(self, val):
        self.val = val
        self.prev = None
        self.next = None

class MyLinkedList:
    # 虚拟头尾节点
    def __init__(self):
        self.head = Node(None)
        self.tail = Node(None)
        self.head.next = self.tail
        self.tail.prev = self.head
        self.size = 0
    
    # 增
    def add_last(self, e):
        p = self.tail
        newNode = Node(e)
        newNode.prev = p.prev
        p.prev.next = newNode
        newNode.next = p
        p.prev = newNode

        self.size += 1

    def add_first(self, e):
        p = self.head

        newNode = Node(e)
        newNode.prev = p
        newNode.next = p.next
        p.next.prev = newNode
        p.next = newNode

        self.size += 1

    def add(self, index, element):
        self.check_position_index(index)
        if index == self.size:
            self.add_last(element)
            return
        p = self.head

        for _ in range(index):
            p = p.next
        
        newNode = Node(element)
        newNode.next = p.next
        newNode.prev = p
        p.next.prev = newNode
        p.next = newNode

        self.size += 1
    
    # 删
    def remove_first(self):
        if self.size < 1:
            raise IndexError("No element to remove")
        
        # 虚拟节点的存在使我们不用考虑空指针的问题
        p = self.head.next
        h = self.head
        p.next.prev = h
        h.next = p.next
        p.next = None
        p.prev = None

        self.size -= 1
        return p.val

    def remove_last(self):
        if self.size < 1:
            raise IndexError("No element to remove")
        
        p = self.tail.prev
        t = self.tail

        p.prev.next = t
        t.prev = p.prev

        p.next = None
        p.prev = None

        self.size -= 1

        return p.val

    def remove(self, index):
        self.check_element_index(index)

        p = self.head
        for _ in range(index):
            p = p.next
        
        delNode = p.next
        delNode.next.prev = p
        p.next = delNode.next

        delNode.prev = None
        delNode.next = None

        self.size -= 1

        return delNode.val

    # 查
    def get(self, index):
        self.check_element_index(index)
        # 找到index对应的Node
        p = self.get_node(index)

        return p.val

    def get_first(self):
        if self.size < 1:
            raise IndexError("No elements in the list")

        return self.head.next.val

    def get_last(self):
        if self.size < 1:
            raise IndexError("No elements in the list")

        return self.tail.prev.val
    # ***** 改 *****

    def set(self, index, val):
        self.check_element_index(index)
        # 找到 index 对应的 Node
        p = self.get_node(index)

        old_val = p.val
        p.val = val

        return old_val

    # ***** 其他工具函数 *****

    def size(self):
        return self.size

    def is_empty(self):
        return self.size == 0

    def get_node(self, index):
        self.check_element_index(index)
        p = self.head.next
        # TODO: 可以优化，通过 index 判断从 head 还是 tail 开始遍历
        for _ in range(index):
            p = p.next
        return p

    def is_element_index(self, index):
        return 0 <= index < self.size

    def is_position_index(self, index):
        return 0 <= index <= self.size

    # 检查 index 索引位置是否可以存在元素
    def check_element_index(self, index):
        if not self.is_element_index(index):
            raise IndexError(f"Index: {index}, Size: {self.size}")

    # 检查 index 索引位置是否可以添加元素
    def check_position_index(self, index):
        if not self.is_position_index(index):
            raise IndexError(f"Index: {index}, Size: {self.size}")
```

