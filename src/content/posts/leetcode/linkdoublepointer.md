---
title: 链表双指针技巧
date: '2026-08-12 17:00'
categories:
  - LeetCode刷题
  - 经典数据结构算法
  - 链表算法
tags:
  - LeetCode
  - 单/双链表
cover: >-
  https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhsjDlhTKwghl6lAYR1gRXXhaXSE0zleqE7MjTbsFTgSj3QKHy4D3r9w8&s=10
description: >-
  单链表的操作技巧主要有7个 1. 合并两个有序链表 2. 链表的分解 3. 合并 k 个有序链表 4. 寻找单链表的倒数第 k 个节点 5.
  寻找单链表的中点 6. 判断单链表是否包含换并找出起点 7. 判断两个单链表是否相交并找出交点 1. 合并两个有序列表
  这个算法比较简单，代码中可能会用到一个链表算法中常用的技巧
published: true
legacyPath: 2026/08/12/leetcode/linkdoublepointer
sourcePath: leetcode/linkdoublepointer.md
---

单链表的操作技巧主要有7个

1. 合并两个有序链表
2. 链表的分解
3. 合并`k`个有序链表
4. 寻找单链表的倒数第`k`个节点
5. 寻找单链表的中点
6. 判断单链表是否包含换并找出起点
7. 判断两个单链表是否相交并找出交点

## 1. 合并两个有序列表

这个算法比较简单，代码中可能会用到一个链表算法中常用的技巧：**虚拟头节点**，也就是`dummy`节点。

如果不使用虚拟节点，代码会复杂一些，需要额外处理`p`为空的情况，而用了`dummy`这个占位符，可以避免处理空指针的情况，降低代码的复杂性

!!! note "何时使用虚拟头节点"
**当需要创建一条新链表的时候，可以使用虚拟头节点简化边界情况的处理**

比如说把两个有序链表合并成一条新的有序链表，是不是要创造一条新链表？再比如你想把一条链表分解成两条链表，是不是也创建新链表？这些情况也可以使用虚拟头节点简化边界情况的处理
</aside>
## 2. 单链表的分解

在合并两个有序链表时我们将两个链表合并成一个链表，那么这里就要把原来的一个链表拆分成两个小的链表，按照之前的理论我们只需要声明两个`dummy`然后分别在它们的后面接上节点就可以了

这里要注意一个问题，当我们将两个小的链表再合并的时候，后面那个链表的`dummy`要做一个处理：**断开它的next指针**

```python
p.next = list2.next
list2.next = null
```

还有一个问题就是，我们每一次在分解出来的小链表后面添加节点的时候，是根据这个目标节点的值构造一个新的节点好一些还是直接将原有链表上的节点放到链表后面好一点？答案很明显是后者，因为这样可以节省构造的时间。但是如果这样做的话一定要注意一个问题：**要断开原链表中的每个节点的next指针**

如果我们不断开原链表的`next`指针，结果链表就会出错，其会包含一个 **环**，如下图所示

![不断开next指针导致的结果链表成环问题](/my-blog/2026/08/12/leetcode/linkdoublepointer/image.png)

## 3. 合并k个有序链表

```
给你一个链表数组，每个链表都已经按升序排列。

请你将所有链表合并到一个升序链表中，返回合并后的链表。

示例 1：

输入：lists = [[1,4,5],[1,3,4],[2,6]]
输出：[1,1,2,3,4,4,5,6]
解释：链表数组如下：
[
  1->4->5,
  1->3->4,
  2->6
]
将它们合并到一个有序链表中得到。
1->1->2->3->4->4->5->6
示例 2：

输入：lists = []
输出：[]
示例 3：

输入：lists = [[]]
输出：[]
提示：

k == lists.length
0 <= k <= 10^4
0 <= lists[i].length <= 500
-10^4 <= lists[i][j] <= 10^4
lists[i] 按 升序 排列
lists[i].length 的总和不超过 10^4
```

合并`k`个有序链表的逻辑和合并两个有序链表的逻辑类似，但是难点在于，如何快速得到`k`个节点中的最小节点？

这里我们就用到一种数据结构为 **优先队列**.我们始终维护一个大小为`k`的优先队列，堆顶为`k`个链表当前指针指向元素的最小值

> 在Python中优先队列需要导入包heapq

```python
import heapq

def mergeKLists(self, lists):
    if not lists:
        return None
    
    # 创建虚拟头节点用以维护结果链表
    dummy = ListNode(-1)

    p = dummy
    # 优先级队列(小顶堆)
    pq = []
    # 将k个链表的头节点加入最小堆
    for i, head in enumerate(lists):
        if head is not None:
            heapq.heappush(pq, (head.val, i, head))
    
    while pq:
        # 获取最小节点，接到结果链表中
        val, i, node = heapq.headpop(pq)
        p.next = node
        if not node.next:
            heapq.pushheap(pq, (node.next.val, i, node.next))
        # p指针不断前进
        p = p.next

    return dummy.next
```

优先队列`pq`中的元素个数最多是$k$，所以一次`poll`或者`add`方法的时间复杂度是$O(logk)$；所有的链表节点都会被加入和弹出`pq`

所以算法整体的时间复杂度是$O(Nlogk)$

- `k`是链表的条数
- $N$是这些链表的节点总数

> 这道题还有一个经典的解法：分治策略，后续我们会使用    

## 4. 单链表的倒数第k个节点

如果可以接受较高的时间复杂度，可以选择先遍历一次获取整个链表的长度`n`，然后遍历第`n-k+1`个节点就是目标节点

但是我们可以只遍历一次链表，那就是设计两个指针，让他们之间的距离始终保持为`k`，当前面的那个指针走到结尾的时候(不是最后一个节点，而是最后一个节点后面的那个空指针)，后面的那个节点就是目标节点

<aside class="admonition warning">
很多人可能会犯这样一个错误

```python
fast = head

for _ in range(k):
    fast = fast.next

while fast:
    fast = fast.next
    slow = slow.next
```

这里得到的`slow`确实是目标节点，但是有两个问题：

- 如果链表`[1]`，`k=1`，要删除的就是`head`自己
- 我们得不到`slow`的前驱，导致无法实现删除这一行为
</aside>
**只要涉及到删除的行为，dummy是必要的**

## 5. 单链表的中点

如果想一次遍历就得到中间节点，也可以使用 **快慢指针**

我们让`slow`和`fast`分别指向链表头节点`head`

每当慢指针`slow`前进一步，快指针`fast`就前进两步，这样，当`fast`走到链表末尾时，`slow`就指向了链表的中点

```python
class Solution:
    # 快慢指针初始化指向 head
    def middleNode(self, head: ListNode) -> ListNode:
        slow = head
        fast = head
        # 快指针走到末尾时停止
        while fast is not None and fast.next is not None:
            # 慢指针走一步，快指针走两步
            slow = slow.next
            fast = fast.next.next
        # 慢指针指向中点
        return slow
```

## 6. 判断链表是否有环

这也是一个很经典的问题了，解决方案也可以用快慢指针：

每当慢指针`slow`前进一步，快指针`fast`就前进两步

如果`fast`最终能正常走到链表末尾，说明链表中没有环；如果`fast`走着走着竟然和`slow`相遇了，那肯定是`fast`在链表中转圈了，说明链表中有环

!!! note "进阶版"
这个问题的进阶版本是在确定有环之后，怎么确定环的起点在哪里

这要通过一些数学技巧

我们假设快慢指针相遇时，慢指针`slow`走了`k`步，那么快指针走了`2k`步

![相遇点](https://labuladong.online/images/algo/linked-two-pointer/3.jpeg)

假设相遇点距离环的起点的距离为`m`，那么结合上图的`slow`指针，环的起点距离头节点`head`的距离为`k - m`，也就是说如果从`head`前进`k - m`步

巧合的是，如果从相遇点继续前进`k - m`步，也恰好到达环起点。

![头指针和相遇点与环起点之间的关系](https://labuladong.online/images/algo/linked-two-pointer/2.jpeg)

所以只需要我们把快慢指针中的一个重新指向`head`，然后两个指针同时前进，相遇之处一定是环的起点

> 但是一定要注意的是，第一次相遇点一定要确保快慢指针是从同一起点开始工作的
</aside>
## 7. 两个链表是否相交

这个问题的解法是很多的

最简单的思路就是在交点之前，两个链表的长度可能不同，我们要先将两个链表的起始指针在同一位置确保两个指针可以同时移动

还有一个非常好的思路是把其中一个链表的尾节点连接到另一个链表的头节点。所以，这个问题变成了在有环的链表里面找换的起点，也就是`Floyd`算法

## 8. 链表双指针经典习题

### 8.1 链表的分解

> 链表的分解技巧可以运用到很多单链表题目中，题目并不一定明确地要求我们把链表分解成两部分，**只要要求从链表筛选出若干节点**，都可以使用这个技巧

#### 删除排序链表中的重复元素II

> [删除排序链表中的重复元素II](https://leetcode.cn/problems/remove-duplicates-from-sorted-list-ii/description/)

给定一个已经排序的链表的头`head`，*删除原始链表中所有重复数字的节点*，只留下不同的数字。返回 *已经排序的链表*

**基本思路**

这道题目可以有多种解法

1. 这是一种比较推荐的方式，就是把这道题目转化成之前我们提到的 **链表分解技巧**。题目起始就是让我们把链表分解成 **重复元素**和 **不重复元素**两条链表，然后把不重复元素这条链表返回即可

```python
def deleteDuplicates(self, head: ListNode) -> ListNode:
    # 将原链表分解为两条链表
    # 一条链表存放不重复的节点，另一条链表存放重复的节点
    # 运用虚拟头节点技巧
    dummyUniq = ListNode(101)
    dummyDup = ListNode(101)

    pUniq, pDup = dummyUniq, dummyDup
    p = head

    while p is not None:
        if (p.next is not None and p.val == p.next.val) or p.val == pDup.val:
            # 这个if条件中判断的两个部分分别适用于原链表有重复元素中的第一个和后面的，比如1->1->2,第一个1用(p.next is not None and p.val == p.next.val)这个条件，第二个1用p.val == pDup.val这个条件
            # 发现重复节点，接到重复链表后面
            pDup.next = p
            pDup = pDup.next
        else:
            # 不是重复节点，接到不重复链表后面
            pUniq.next = p
            pUniq = pUniq.next

        p = p.next
        # 将原链表和新链表断开
        pUniq.next = None
        pDup.next = None

    return dummyUniq.next
```

2. 可以理解为双指针数组中的题目的变体
3. 用递归的思维来解决

```python
def deleteDuplicates(self, head: ListNode) -> ListNode:
    # base case
    if head is None or head.next is None:
        return head
    if head.val == head.next.val:
        head.next = self.deleteDuplicates(head.next)
        return head

    while head.next is not None and head.val != head.next.val:
        head = head.next
    # 注意这里的参数是head.next,head此时是局部重复元素的最后一个
    return self.deleteDuplicates(head.next)
```

### 8.2 链表的合并

> 有些题目虽然不是链表的题目，但是其中蕴含了合并有序链表的思想

#### 有序矩阵中第K小的元素

给你一个 `n x n` 矩阵 `matrix` ，其中每行和每列元素均按升序排序，找到矩阵中第 `k` 小的元素。
请注意，它是 排序后 的第 `k` 小元素，而不是第 `k` 个 不同 的元素。

你必须找到一个内存复杂度优于 $O(n^2)$ 的解决方案。

**基本思路**

这道题目其实就是合并k个有序链表的变体

矩阵中的每一行都是排好序的，就好比多条有序链表，我们用优先队列施展合并多条有序链表的逻辑就能找到第`k`小的元素了

```python
from queue import PriorityQueue
def kthSmallest(self, matrix: List[List[int]], k: int)->int:
    # 存储二元组(matrix[i][j], i, j)
    # i, j记录当前元素的索引位置，用于生成下一个节点
    pq = PriorityQueue()

    # 初始化优先级队列，把每一行的第一个元素装进去
    for i in range(len(matrix)):
        pq.put((matrix[i][0], i, 0))

    res = -1
    # 执行合并多个有序链表的逻辑，找到第k小的元素
    while not pq.empty() and k > 0:
        cur = pq.get()
        # 按照元素大小升序排列
        res = cur[0]
        k -= 1
        # 链表中的下一个节点加入优先级队列
        i, j = cur[1], cur[2]
        if j + 1 < len(matrix[i]):
            pq.put((matrix[i][j+1], i, j+1))

    return res
```

#### 查找和最小的K对数字

```
给定两个以 非递减顺序排列 的整数数组 nums1 和 nums2 , 以及一个整数 k 。

定义一对值 (u,v)，其中第一个元素来自 nums1，第二个元素来自 nums2 。

请找到和最小的 k 个数对 (u1,v1),  (u2,v2)  ...  (uk,vk) 。

示例 1:

输入: nums1 = [1,7,11], nums2 = [2,4,6], k = 3
输出: [1,2],[1,4],[1,6]
解释: 返回序列中的前 3 对数：
     [1,2],[1,4],[1,6],[7,2],[7,4],[11,2],[7,6],[11,4],[11,6]
示例 2:

输入: nums1 = [1,1,2], nums2 = [1,2,3], k = 2
输出: [1,1],[1,1]
解释: 返回序列中的前 2 对数：
     [1,1],[1,1],[1,2],[2,1],[1,2],[2,2],[1,3],[1,3],[2,3]
提示:

1 <= nums1.length, nums2.length <= 105
-109 <= nums1[i], nums2[i] <= 109
nums1 和 nums2 均为 升序排列
1 <= k <= 104
k <= nums1.length * nums2.length
```

**基本思路**

这道题目其实也是合并K个升序链表的变体

怎么把这道题变成合并多个有序链表的题目呢？以题目输入为例：

```python
nums1 = [1, 7, 11]
nums2 = [2, 4, 6]
```

组合出的所有数对就可以抽象成三个有序链表

```python
[1, 2] -> [1, 4] -> [1, 6]
[7, 2] -> [7, 4] -> [7, 6]
[11, 2] -> [11, 4] -> [11, 6]
```

我们为什么这样构造？因为横向纵向元素之和都是有序的。这看起来是不是就很像第K大的矩阵元素那一道题目了？

```python
def kSmallestPairs(self, nums1: List[int], nums2: List[int], k: int) -> List[List[int]]:
    # 存储三元组(num1, nums2[i], i)
    # i 用于记录nums2元素的索引位置，用于生成下一个节点
    pq = PriorityQueue()

    # 按照矩阵那个题目的相同逻辑初始化优先队列
    for i in range(len(nums1)):
        pq.put((nums1[i] + nums2[0], nums1[i], nums2[0], 0))

    res = []

    # 执行合并多个有序链表的逻辑
    while not pq.empty() and k > 0:
        _, num1, num2, idx = pq.get()
        k -= 1
        # 链表中的下一个节点加入优先级队列
        if idx + 1 < len(nums2):
            pq.put((num1 + nums2[idx + 1], num1, nums2[idx + 1], idx + 1))

        # 按照对应的元素和升序排序
        pair = [num1, num2]
        result.append(pair)
    
    return result
```

### 8.3 链表运算题

#### 两数相加

[两数相加](https://leetcode.cn/problems/add-two-numbers/description/)

!!! note "链表头插法"
这里之前写法上一直不是标准的头插法，这里做一个标准化的改良：

```python
dummy = ListNode(None)
cur = head

while cur: 
    then = cur.next
    cur.next = dummy.next
    dummy.next = cur
    cur = then
```

大概的思路就是：

1. `then = cur.next`：**提前保存下一个节点**，不然链表断了找不到后面
2. `cur.next = dummy.next`：当前节点指向已经反转好的链表头
3. `dummy.next = cur`：dummy 接上当前节点，完成头插
4. `cur = then`：cur 移动到下一个待处理节点
</aside>
**基本思路**

先做一个链表反转，可以确保我们先算低位后算高位

接着看最后结果要求我们返回什么，可能要再做一次反转

### 8.4 链表环检测

这是一道表面上看似与链表环检测无关的题目，但是实际上是非常巧妙的

#### 287. 寻找重复数

```
给定一个包含 n + 1 个整数的数组 nums ，其数字都在 [1, n] 范围内（包括 1 和 n），可知至少存在一个重复的整数。

假设 nums 只有 一个重复的整数 ，返回 这个重复的数 。

你设计的解决方案必须 不修改 数组 nums 且只用常量级 O(1) 的额外空间。

示例 1：

输入：nums = [1,3,4,2,2]
输出：2
示例 2：

输入：nums = [3,1,3,4,2]
输出：3
示例 3 :

输入：nums = [3,3,3,3,3]
输出：3
提示：

1 <= n <= 105
nums.length == n + 1
1 <= nums[i] <= n
nums 中 只有一个整数 出现 两次或多次 ，其余整数均只出现 一次
进阶：

如何证明 nums 中至少存在一个重复的数字?
你可以设计一个线性级时间复杂度 O(n) 的解决方案吗？
```

**基本思路**

这道题的约束很特别：数组长度为`n + 1`，元素全在`[1, n]`之间，不能修改数组，且空间$O(1)$

先说说元素在 `[1, n]`这个条件有什么用。当数组元素的值域限制在 `[1, n]` 时，值和下标之间存在天然的对应关系——可以把每个值 x 映射到下标 `x-1`，或者直接把值当成**指向某个索引的指针**

我们刷题见到的单链表`ListNode`类长成这样：

```python
class ListNode:
    def __init__(self, x):
        self.val = x
        self.next = None
```

我们可以类比，把数组索引下标`i`作为链表节点的值`val`，把`nums[i]`作为链表的`next`指针，指向值为`nums[i]`的链表节点

也就是说只要出现重复的数字，意味着链表不止一次可以到达同一个节点，那就说明出现环

以`nums = [1, 3, 4 ,2, 2]`为例，`nums[3] == nums[4] == 2`，即`ListNode(3)`和`ListNode(4)`同时把`ListNode(2)`当做`next`节点：

```
ListNode(0) -> ListNode(1) -> ListNode(3) -> ListNode(2) -> ListNode(4)
                                                 ↑               |
                                                 └───────────────┘
                                              （2 重复，成为环的入口）
```

这就和我们之前的 **环形链表**题目完全等价，直接按照

- 第一阶段快慢指针相遇
- 第二阶段把慢指针重置到头节点(索引`0`)后同步前进，再次相遇处即为环的入口，也就是重复数字

> 我们不需要显式创建链表数据结构，只需要以指针作为隐式链表就可以

```python
class Solution:
    def findDuplicate(self, nums: List[int]) -> int:
        # 以下是单链表环检测算法，把数组当作隐式链表
        fast = slow = 0
        while True:
            fast = nums[nums[fast]]
            slow = nums[slow]
            if fast == slow:
                break
        # 重新指向头结点（索引 0）
        slow = 0
        # 快慢指针同步前进，相交点就是环入口，即重复数字
        while slow != fast:
            fast = nums[fast]
            slow = nums[slow]
        return slow
```
