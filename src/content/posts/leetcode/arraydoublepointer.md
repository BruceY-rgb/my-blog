---
title: 数组双指针技巧
date: '2026-08-12 17:00'
categories:
  - LeetCode刷题
  - 经典数据结构算法
  - 数组算法
tags:
  - LeetCode
  - 数组
cover: >-
  https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhsjDlhTKwghl6lAYR1gRXXhaXSE0zleqE7MjTbsFTgSj3QKHy4D3r9w8&s=10
description: >-
  在处理数组和链表相关的问题时，双指针技巧是经常使用的，双指技巧主要分为两类： 左右指针和快慢指针 所谓左右指针，就是两个指针相向而行或者相背而行
  所谓快慢指针，就是两个指针同向而行，一快一慢 在数组中并没有真正意义上的指针，但是我们可以 把索引当做数组中的指针 ，这样也可以在数组中施展双指针技巧 1.
  快慢指针技巧 1
published: true
legacyPath: 2026/08/12/leetcode/arraydoublepointer
sourcePath: leetcode/arraydoublepointer.md
---

在处理数组和链表相关的问题时，双指针技巧是经常使用的，双指技巧主要分为两类：**左右指针和快慢指针**

所谓左右指针，就是两个指针相向而行或者相背而行

所谓快慢指针，就是两个指针同向而行，一快一慢

在数组中并没有真正意义上的指针，但是我们可以**把索引当做数组中的指针**，这样也可以在数组中施展双指针技巧

## 1. 快慢指针技巧

### 1.1 原地修改

数组问题中比较常见的快慢指针技巧是原地修改数组

比如力扣第26题[删除有序数组中的重复项](https://leetcode.cn/problems/remove-duplicates-from-sorted-array/description/)

```
给你一个 非严格递增排列 的数组 nums ，请你 原地 删除重复出现的元素，使每个元素 只出现一次 ，返回删除后数组的新长度。元素的 相对顺序 应该保持 一致 。然后返回 nums 中唯一元素的个数。

考虑 nums 的唯一元素的数量为 k ，你需要做以下事情确保你的题解可以被通过：

更改数组 nums ，使 nums 的前 k 个元素包含唯一元素，并按照它们最初在 nums 中出现的顺序排列。nums 的其余元素与 nums 的大小不重要。
返回 k 。
判题标准:

系统会用下面的代码来测试你的题解:

int[] nums = [...]; // 输入数组
int[] expectedNums = [...]; // 长度正确的期望答案

int k = removeDuplicates(nums); // 调用

assert k == expectedNums.length;
for (int i = 0; i < k; i++) {
    assert nums[i] == expectedNums[i];
}
如果所有断言都通过，那么您的题解将被 通过。

示例 1：

输入：nums = [1,1,2]
输出：2, nums = [1,2,_]
解释：函数应该返回新的长度 2 ，并且原数组 nums 的前两个元素被修改为 1, 2 。不需要考虑数组中超出新长度后面的元素。
示例 2：

输入：nums = [0,0,1,1,1,2,2,3,3,4]
输出：5, nums = [0,1,2,3,4]
解释：函数应该返回新的长度 5 ， 并且原数组 nums 的前五个元素被修改为 0, 1, 2, 3, 4 。不需要考虑数组中超出新长度后面的元素。
提示：

1 <= nums.length <= 3 * 104
-104 <= nums[i] <= 104
nums 已按 非严格递增 排列
```

先来解释一下什么是原地修改

如果不是原地修改的话，我们直接`new`一个`int[]`数组，把去重之后的元素放进这个新数组中，然后放回这个新数组即可

但是我们对空间复杂度是有要求的，不允许`new`一个全新的数组，只能在原数组上操作，然后返回一个长度，这样就可以通过返回的长度和原始数组得到我们去重后的元素有哪些了

由于数组已经排序，所以重复的元素一定连在一起，找出他们并不难。但是如果每找到一个重复元素就立刻原地删除。由于数组中删除元素涉及数据搬移，整个事件复杂度是会达到$O(N^2)$

高效解决这道题目可以使用快慢指针技巧：

我们让慢指针`slow`走在后面，快指针`fast`走在前面探路，找到一个不重复的元素就让`slow`前进一步，然后把`fast`处的值写到`slow`的新位置

这样就保证了`nums[0...slow]`都是无重复的元素，当`fast`指针遍历整个数组`nums`后，`nums[0...slow]`就是整个数组去重之后的结果

```python
def removeDuplicates(self, nums: List[int]) -> int:
    if len(nums) == 0:
        return 0
    fast = slow = 0
    while fast < len(nums):
        if nums[slow] != nums[fast]:
            slow += 1
            nums[slow] = nums[fast]

        fast += 1

    return slow + 1
```

链表上也可以使用完全相同的思路去解决问题，这道题目是[删除链表中的重复元素](https://leetcode.cn/problems/remove-duplicates-from-sorted-list/submissions/743447648/)

只不过是把数组赋值操作变成操作指针

```python
def deleteDuplicates(self, head: Optional[ListNode]) -> Optional[ListNode]:
    if head is None or head.next is None:
        return head

    fast = slow = head
    while fast is not None:
        if fast.val != slow.val:
            slow.next = fast
            slow = slow.next

        fast = fast.next

    slow.next = None
    return head
```

除了可以在 **有序数组/链表**中去重，题目还可能让你对数组中的某些元素进行**原地删除**

例如力扣第27题[移除元素](https://leetcode.cn/problems/remove-element/)

```
给你一个数组 nums 和一个值 val，你需要 原地 移除所有数值等于 val 的元素。元素的顺序可能发生改变。然后返回 nums 中与 val 不同的元素的数量。

假设 nums 中不等于 val 的元素数量为 k，要通过此题，您需要执行以下操作：

更改 nums 数组，使 nums 的前 k 个元素包含不等于 val 的元素。nums 的其余元素和 nums 的大小并不重要。
返回 k。
用户评测：

评测机将使用以下代码测试您的解决方案：

int[] nums = [...]; // 输入数组
int val = ...; // 要移除的值
int[] expectedNums = [...]; // 长度正确的预期答案。
                            // 它以不等于 val 的值排序。

int k = removeElement(nums, val); // 调用你的实现

assert k == expectedNums.length;
sort(nums, 0, k); // 排序 nums 的前 k 个元素
for (int i = 0; i < actualLength; i++) {
    assert nums[i] == expectedNums[i];
}
如果所有的断言都通过，你的解决方案将会 通过。

示例 1：

输入：nums = [3,2,2,3], val = 3
输出：2, nums = [2,2,_,_]
解释：你的函数函数应该返回 k = 2, 并且 nums 中的前两个元素均为 2。
你在返回的 k 个元素之外留下了什么并不重要（因此它们并不计入评测）。
示例 2：

输入：nums = [0,1,2,2,3,0,4,2], val = 2
输出：5, nums = [0,1,4,0,3,_,_,_]
解释：你的函数应该返回 k = 5，并且 nums 中的前五个元素为 0,0,1,3,4。
注意这五个元素可以任意顺序返回。
你在返回的 k 个元素之外留下了什么并不重要（因此它们并不计入评测）。
提示：

0 <= nums.length <= 100
0 <= nums[i] <= 50
0 <= val <= 100
```

如果`fast`遇到值为`val`的元素，则直接跳过，否则就赋值给`slow`指针，并让`slow`前进

这和前面说到的数组去重问题解法思路是一样的，代码为

```python
class Solution:
    def removeElement(self, nums: List[int], val: int) -> int:
        fast, slow = 0, 0
        while fast < len(nums):
            if nums[fast] != val:
                nums[slow] = nums[fast]
                slow += 1
            fast += 1
        return slow
```

> 一定要注意这里两个和去重不同的地方，第一个是当值不是val的时候，要先赋值再让slow+1;第二个是返回值是slow而不是slow+1

<aside class="admonition warning">
这里和有序数组去重的解法有一个细节差异，我们这里是把`nums[slow]`赋值然后再给`slow++`，这样可以保证`nums[0...slow-1]`是不包含值为`val`的元素的，最后的结果就是数组的长度`slow`
</aside>
实现了`removeElement`函数，接下来看力扣第283题[移动0](https://leetcode.cn/problems/move-zeroes/description/)

```python
class Solution:
    def moveZeroes(self, nums):
        # 去除 nums 中的所有 0
        # 返回去除 0 之后的数组长度
        p = self.removeElement(nums, 0)
        # 将 p 之后的所有元素赋值为 0
        for i in range(p, len(nums)):
            nums[i] = 0

    # 双指针技巧，复用 [27. 移除元素] 的解法。
    def removeElement(self, nums, val):
        fast, slow = 0, 0
        while fast < len(nums):
            if nums[fast] != val:
                nums[slow] = nums[fast]
                slow += 1
            fast += 1
        return slow
```

### 1.2 滑动窗口

数组中零一大类快慢指针的题目是 **滑动窗口算法**。这会在[滑动窗口算法核心框架](source/_posts/leetcode/slidewindow.md)提及，可以先给出框架

```c
// 滑动黄口算法框架伪码
int left = 0, right = 0;

while(right < nums.size()) {
    // 增大窗口
    window.addLast(nums[right]);
    right++;

    while(window needs shrink) {
        // 缩小窗口
        window.removeFirst(nums[left])
        left++;
    }
}
```

`left`指针在后，`right`指针在前，两个指针中间的部分就是 **窗口**。算法通过 **扩大和缩小的窗口**来解决某些问题

## 2. 左右指针的常有算法

### 2.1 二分查找

会在后续二分查找中详细讲解中详细探讨细节，这里给出一个最简单的二分算法，旨在突出它的双指针特性：

```python
def binarySearch(nums: List[int], target: int)->int:
    # 一左一右两个指针相向而行
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1 
```

### 2.2 n数之和

力扣第167题[两数之和](https://leetcode.cn/problems/two-sum-ii-input-array-is-sorted/description/)

```
给你一个下标从 1 开始的整数数组 numbers ，该数组已按 非递减顺序排列  ，请你从数组中找出满足相加之和等于目标数 target 的两个数。如果设这两个数分别是 numbers[index1] 和 numbers[index2] ，则 1 <= index1 < index2 <= numbers.length 。

以长度为 2 的整数数组 [index1, index2] 的形式返回这两个整数的下标 index1 和 index2。

你可以假设每个输入 只对应唯一的答案 ，而且你 不可以 重复使用相同的元素。

你所设计的解决方案必须只使用常量级的额外空间。

 
示例 1：

输入：numbers = [2,7,11,15], target = 9
输出：[1,2]
解释：2 与 7 之和等于目标数 9 。因此 index1 = 1, index2 = 2 。返回 [1, 2] 。
示例 2：

输入：numbers = [2,3,4], target = 6
输出：[1,3]
解释：2 与 4 之和等于目标数 6 。因此 index1 = 1, index2 = 3 。返回 [1, 3] 。
示例 3：

输入：numbers = [-1,0], target = -1
输出：[1,2]
解释：-1 与 0 之和等于目标数 -1 。因此 index1 = 1, index2 = 2 。返回 [1, 2] 。
提示：

2 <= numbers.length <= 3 * 104
-1000 <= numbers[i] <= 1000
numbers 按 非递减顺序 排列
-1000 <= target <= 1000
仅存在一个有效答案
```

**只要数组有序，就应该想到双指针技巧**。这道题的解法有点类似二分查找，通过调节`left`和`right`就可以调整`sum`的大小

```python
class Solution:
    def twoSum(self, numbers: List[int], target: int) -> List[int]:
        # 一左一右两个指针相向而行
        left, right = 0, len(numbers) - 1
        while left < right:
            sum = numbers[left] + numbers[right]
            if sum == target:
                # 题目要求的索引是从 1 开始的
                return [left + 1, right + 1]
            elif sum < target:
                # 让 sum 大一点
                left += 1
            elif sum > target:
                # 让 sum 小一点
                right -= 1
        return [-1, -1]
```

### 2.3 反转数组

一般编程语言都会提供`reverse`方法，其实这个函数的原理非常简单，力扣第344题[反转字符串](https://leetcode.cn/problems/reverse-string/description/)就是类似的需求：反转一个`char`类型的字符串

```python
def reverseString(s: List[str]) -> None:
    # 一左一右两个指针逆向而行
    left, right = 0, len(s) - 1
    while left < right:
        # 交换s[left]和s[right]
        temp = s[left]
        s[left] = s[right]
        s[right] = temp
        left += 1
        right -= 1
```

### 2.4 回文串判断

这应该和反转数组的思路完全相同的

```python
left, right = 0, len(s) - 1
while left < right:
    if s[left] != s[right]:
        return False
    left += 1
    right -= 1

    return True
```

那么如果增加一些难度，力扣第5题[最长回文子串](https://leetcode.cn/problems/longest-palindromic-substring/description/)应该怎么用双指针做？

```
给你一个字符串 s，找到 s 中最长的 回文 子串。

示例 1：

输入：s = "babad"
输出："bab"
解释："aba" 同样是符合题意的答案。
示例 2：

输入：s = "cbbd"
输出："bb"
提示：

1 <= s.length <= 1000
s 仅由数字和英文字母组成
```

找回文串的难点在于，回文串的长度可能是奇数也可能是偶数，解决该问题的核心是**从中心向两端扩散的双指针技巧**

- 如果回文串的长度是奇数，则它有一个中心字符
- 如果回文串的长度为偶数，则可以认为有两个中心字符

所以我们可以实现这样一个函数：

```python
# 在 s 中寻找以 s[l] 和 s[r]为中心的最长回文串
def palindrome(s: str, l: int, r: int) -> str:
    # 防止索引越界：
    while l >= 0 and r < len(s) and s[l] == s[r]:
        # 双指针，向两边展开
        l -= 1
        r += 1
    # 此时 s[l+1, r-1]就是最长回文串
    return s[l + 1, r]
```

这样

- 如果输入相同的`l`和`r`，就相当于寻找长度为奇数的回文串
- 如果输入相邻的`l`和`r`，则相当于寻找长度为偶数的回文串

那么大致的思路就是

```c
for(i = 0; i < len(s); i++){
    找到以s[i]为中心的回文串
    找到以s[i]和s[i + 1]为中心的字符串
    更新答案
}
```


```python
class Solution:
    def longestPalindrome(self, s: str) -> str:
        res = ""
        for i in range(len(s)):
            # 以 s[i] 为中心的最长回文子串
            s1 = self.palindrome(s, i, i)
            # 以 s[i] 和 s[i+1] 为中心的最长回文子串
            s2 = self.palindrome(s, i, i + 1)
            # res = longest(res, s1, s2)
            res = res if len(res) >= len(s1) else s1
            res = res if len(res) >= len(s2) else s2
        return res

    def palindrome(self, s: str, l: int, r: int) -> str:
        # 防止索引越界
        while l >= 0 and r < len(s) and s[l] == s[r]:
            # 向两边展开
            l -= 1
            r += 1
        # 此时 s[l+1..r-1] 就是最长回文串
        return s[l + 1:r]
```

我们可以发现最长回文子串使用的左右指针和之前题目的左右指针有一些不同：

- 之前的左右指针都是从两端向中间相向而行
- 回文子串问题是让左右指着能从中心向两端扩展

不过这种情况只有回文子串问题中会遇到，所以也作为一种左右指针的特殊情况掌握
