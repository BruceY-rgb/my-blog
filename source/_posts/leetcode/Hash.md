---
title: leetcode-hot 100 哈希表系列
date: 2026-05-23 15:30:00
tags:
    - leetcode
    - 哈希表
categories:
    - leetcode
cover: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg2VwASYtNKAYrFpKO_WPtU9t60gBMWYXlyA&s
---

## 1. 两数之和

```java
public class Solution {
    public int[] twoSum (int[] numbers, int target) {
        int[] ans = new int[2];
        if(numbers.length == 0) {
            return ans;
        } 

        HashMap<Integer, Integer> map = new HashMap<Integer, Integer>();

        int n = numbers.length;

        for(int i = 0; i < n; i++) {
            if(map.containsKey(numbers[i])) {
                ans[0] = map.get(numbers[i]) + 1;
                ans[1] = i + 1;
                return ans;
            }
            map.put(target - numbers[i],i);
        }

        return ans;
    }
}
```

## 2. 数组中出现次数超过一半的数字

```python
class Solution:
    def MoreThanHalfNum_Solution(self , numbers: List[int]) -> int:
        d = dict()
        n = len(numbers)
        for i in range(n):
            d[numbers[i]] = d.get(numbers[i], 0) + 1
            if d[numbers[i]] > n//2:
                return numbers[i] 
```

## 3. 数组中只出现一次的两个数字

```python
class Solution:
    def FindNumsAppearOnce(self , nums: List[int]) -> List[int]:
        ans = []
        d = dict()
        n = len(nums)
        for i in range(n):
            d[nums[i]] = d.get(nums[i], 0) + 1
        for i in range(n):
            if d.get(nums[i]) == 1:
                ans.append(nums[i])

        return sorted(ans)
```

## 4. 缺失的第一个正整数

**题目主要信息**：

- 题目给定一个无序整型数组，没有重复元素，可能有负数或0，需要找出其中没有出现的最小正整数

**核心思路——哈希表**

长度为`n`的数组，没有重复，则如果数组填满了`1~n`，那么缺失的那个就是`n+1`;否则缺失的就是`1~n`中的数字

最核心的其实是我们怎么确定这个数字到底是谁？我们知道这个缺失的正整数最小一定是`1`，那么我们只需要从`1`开始验证，如果`1`出现过，就试`2`，重复该步骤直到这个数字没有在数组中出现过为止

```java
class Solution:
    def minNumberDisappeared(self, nums: List[int]) -> int:
        d = dict()

        for num in nums:
            d[num] = 1

        res = 1

        while res in d:
            res += 1

        return res
```

!!! warning
我最开始犯了这样一个错误：

```python
for num in nums:
    if d[res] == 1:
        res += 1
```

这样写就默认了`res`一定在`d`中作为`key`存在，而实际上并不是所有`res`都会出现在`d`中，所以要遍历`d`中存在的`res`，必须要写成：

```python
while res in d:
    res += 1
```
!!!

## 5. 三数之和

**题目主要信息**

- 给定一个长度为`n`的数组，䔄其中所有满足相加等于`0`的三元组，即数组中所有三个相加为0的数集
- 三元组内部必须非降序排列，且三元组不能有重复

**核心思想——哈希表**

官方题解给出的算法虽然写的是哈希表，但是其实质上是一个双指针的方法，每次确定一个`target`，然后从这个`target`元素后面的元素中找到相加为`-target`的所有情况。但是这实际上不能算作哈希方法

我这里用到的哈希方法是统计每一个元素的个数，每一次使用这个元素的时候就将数量-1，处理完之后再加回来，然后通过集合进行去重

- 创建元素与个数之间对应的哈希表
- 创建一个容纳所有满足条件的三元组的集合
- 在`num`中寻找是否同时存在`a`,`b`和`-a-b`，注意使用时个数要减掉，用完了以后要加回来
  - 将符合题意的三元组排序之后加入集合中
- 最后将集合中满足条件的所有列表排序之后再输出

```python
class Solution:
    def threeSum(self, num: List[int]) -> List[List[int]]:
        n = len(num)
        if n < 3:
            return []

        h_count = {}
        for x in num:
            h_count[x] = h_count.get(x, 0) + 1

        h_result = set()

        for a in num:
            h_count[a] -= 1

            for b in num:
                if h_count.get(b, 0) > 0:
                    h_count[b] -= 1

                    c = -a - b

                    if h_count.get(c, 0) > 0:
                        h_result.add(tuple(sorted([a, b, c])))

                    h_count[b] += 1

            h_count[a] += 1

        return [list(res) for res in h_result]
```

!!! warning
- `set`中只能存放 **可哈希的对象**，如果直接使用`sorted`之后的对象是一个`list`类型的可变对象，**不能放进集合里**
!!!