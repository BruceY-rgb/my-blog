---
title: leetcode-hot 100 二分查找与排序
date: 2026-05-23 10:30:00
tags:
    - leetcode
    - 二分查找与排序
categories:
    - leetcode
cover: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg2VwASYtNKAYrFpKO_WPtU9t60gBMWYXlyA&s
---

## 1. 二分查找-I

**题目主要信息**：

- 给定一个元素的升序，无重复数组的整型数组`nums`和一个目标值`target`
- 找到目标值的下标
- 如果找不到，返回`-1`

```java
public class Solution {
    /**
     * 代码中的类名、方法名、参数名已经指定，请勿修改，直接返回方法规定的值即可
     *
     * 
     * @param nums int整型一维数组 
     * @param target int整型 
     * @return int整型
     */
    public int BinarySearch(int[] nums, int left, int right, int target) {
        if(left > right) return -1;

        int mid = (left + right) / 2;
        if(nums[mid] ==  target) {
            return mid;
        }
        else if(nums[mid] > target) {
            return BinarySearch(nums, left, mid - 1, target);
        }else {
            return BinarySearch(nums, mid + 1, right, target);
        }
    }
    public int search (int[] nums, int target) {
        return BinarySearch(nums, 0, nums.length - 1, target);
    }
}
```

## 2. 二维数组中的查找

**题目主要信息**

- 矩阵的行元素和列元素都是有序的，从左到右递增，从上到下递增，完全递增元素不会有重复
- 找到矩阵中有没有给定元素即可

**核心思路——二分查找**

- 既然整个二维数组是从左到右从上到下依次递增的，那么说明左上角一定是最小值，右下角一定是最大值
- 为了保证我们能从一个中间的值开始，可以随时控制我们访问的元素既可以增大也可以减小，那么左下角是一个非常好的选择
- 我们以左下角为起点，如果小于目标元素就向右移动；如果大于目标就向上移动
- 如果移动到边界没有找到，说明矩阵中不存在目标值

```java
public class Solution {
    /**
     * 代码中的类名、方法名、参数名已经指定，请勿修改，直接返回方法规定的值即可
     *
     * 
     * @param target int整型 
     * @param array int整型二维数组 
     * @return bool布尔型
     */
    public boolean Find (int target, int[][] array) {
        if(array.length == 0) {
            return false;
        }
        if(array[0].length == 0) {
            return false;
        }

        int row = array.length;
        int column = array[0].length;

        for(int i = row - 1, j = 0; i >= 0 && j < column; ) {
            if(array[i][j] > target) {
                i--;
            }
            else if(array[i][j] < target) {
                j++;
            }else {
                return true;
            }
        } 

        return false;
    }
}
```

**复杂度分析**

- 时间复杂度：$O(m+n)$,最多经过**一行一列**
- 空间复杂度：$O(1)$，没有使用额外的空间

## 3. 寻找峰值

**题目主要信息**：

- 给定一个长度为`n`的数组，返回其中任何一个峰值的索引
- 峰值元素使指其严格大于左右相邻值的元素
- 数组两个边界可以看成是最小，$nums[-1] = nums[n] = -\infin$
- 峰值不存在平的情况，即相邻元素不会相等

**核心思路——二分法**

- 这道题目的本质其实也是二分法，我们不断将峰值可能存在的区间减半直至找到峰值
- 峰值满足的核心条件就是比左边的大，比右边的小，所以这道题目缩小区间的核心依据就是根据相邻两个元素之间的单调关系去判断
  - 如果是一个递增关系，则左区间右移
  - 如果是一个递减关系，则右区间左移
- 当两个区间端点重合的时候，我们就找到了那个峰值

```java
public class Solution {
    /**
     * 代码中的类名、方法名、参数名已经指定，请勿修改，直接返回方法规定的值即可
     *
     * 
     * @param nums int整型一维数组 
     * @return int整型
     */
    public int findPeakElement (int[] nums) {
        if(nums.length == 1) {
            return 0;
        }

        int left = 0;
        int right = nums.length - 1;

        while(left < right) {
            int mid = (left + right) / 2;
            if(nums[mid] > nums[mid + 1]) {
                right = mid;
            }
            else{
                left = mid + 1;
            }
        }

        return left;
    }
} 
```

**复杂度分析**：

- 时间复杂度：$O(log_2 n)$
- 空间复杂度:$O(1)$

## 4. 计算数组中的逆序对

> 这是一道非常综合的题目，结合了二分的思想和归并排序的思想

**题目的主要信息**：

- 在数组中的两个数字，如果前面一个数字大于后面一个数字，则这两个数字组成一个逆序对
- 输入一个数组，球一个数组的全部逆序对，答案对1000000007取模
- 保证输入的数组中没有相同的数字

**核心思路——归并排序**

- 对于大多数人来说，看到这道题目的第一反应可能是使用暴力方法：枚举每一个位置 `j`，再从它前面扫描所有位置 `i`，只要满足 `i < j` 且 `nums[i] > nums[j]`，就说明找到了一对逆序对。但是这种做法本质上需要枚举所有数对，时间复杂度是 $O(n^2)$，在数据规模较大时显然不够高效。

- 如果想降低时间复杂度，就不能再逐个枚举所有数对。我们可以换一个角度思考：逆序对的本质是“前面的元素比后面的元素大”。因此，如果能够先把数组划分成两个部分，并且**分别让这两个部分变得有序**，那么在**统计跨越左右两个部分的逆序对**时，就可以**利用有序性一次性完成计数**。

- 这正是归并排序的思想。我们先**不断将数组拆分，直到每个区间只剩下一个元素**。单个元素内部显然没有逆序对。然后在回溯合并的过程中，分别统计三类逆序对：**左半部分内部的逆序对、右半部分内部的逆序对，以及横跨左右两个部分的逆序对**。

- 关键在于第三类，也就是跨区间逆序对的统计。假设左右两个区间都已经排好序，左半部分当前指针指向 `i`，右半部分当前指针指向 `j`。如果 `nums[i] <= nums[j]`(这里要有`=`，否则归并排序就不是稳定排序)，说明左边当前元素不会和右边当前元素形成逆序对，可以直接把左边元素放入结果数组。反之，如果 `nums[i] > nums[j]`，由于左半部分已经有序，那么从 `i` 到 `mid` 的所有元素都一定大于 `nums[j]`，它们都可以和 `nums[j]` 形成逆序对。因此这一步可以一次性增加 `mid - i + 1` 个逆序对，而不是一个一个去比较。

- 所以，归并排序统计逆序对的核心优势在于：它不是暴力枚举每一对元素，而是在合并两个有序区间时，利用**有序性批量统计逆序对**。这样总共只需要进行归并排序级别的操作，时间复杂度可以从 $O(n^2)$ 降到 $O(n \log n)$。


```java
import java.util.*;


public class Solution {

    private static final int MOD = 1000000007;
    /**
     * 代码中的类名、方法名、参数名已经指定，请勿修改，直接返回方法规定的值即可
     *
     * 
     * @param nums int整型一维数组 
     * @return int整型
     */
    public int InversePairs (int[] nums) {
        if(nums.length < 2) {
            return 0;
        }
        int n = nums.length;
        int[] copy = new int[n];

        for(int i = 0; i < n; i++) {
            copy[i] = nums[i];
        }

        int[] temp = new int[n];

        return reversePairsNum(copy, 0, nums.length-1, temp);
    }
    /**
     * @param nums: 原始的数组对象
     * nums[left..right]是我们要操作的区间
     * @param temp: 原始的数组对象在排序之后会被修改，temp用来作为一个原始数组的拷贝
     */
    public int reversePairsNum(int[] nums, int left, int right, int[] temp) {
        if(right == left) {
            return 0;
        }

        int mid = left + (right - left)/2;
        int leftCount = reversePairsNum(nums, left, mid, temp);
        int rightCount = reversePairsNum(nums, mid + 1, right, temp);

        if(nums[mid] <= nums[mid + 1]) {
            return (leftCount + rightCount) % MOD;
        }

        return (leftCount + rightCount + mergeAndCount(nums, left, mid, right, temp)) % MOD;
    }

    public int mergeAndCount(int[] nums, int left, int mid, int right, int[] temp) {
        for(int i = left; i <= right; i++) {
            temp[i] = nums[i];
        }

        int i = left;
        int j = mid + 1;

        int count = 0;

        for(int k = left; k <= right; k++) {
            if(i == mid + 1){
                nums[k] = temp[j];
                j++;
            }else if(j == right + 1) {
                nums[k] = temp[i];
                i++;
            }else if(temp[i] <= temp[j]) {
                nums[k] = temp[i];
                i++;
            }else {
                nums[k] = temp[j];
                count = (count + mid - i + 1) % MOD;
                j++;
            }
        }

        return count;
    }
}
```

{% raw %}
<link rel="stylesheet" href="/my-blog/css/sorting-anim.css">
<div
    class="sort-viz"
    data-algorithm="inverse-pairs"
    data-autoplay="false"
    data-interval="1600">
</div>
<script src="/my-blog/js/sorting-anim.js"></script>
{% endraw %}


## 5. 旋转数组的最小数字

```java
public class Solution {
    /**
     * 代码中的类名、方法名、参数名已经指定，请勿修改，直接返回方法规定的值即可
     *
     * 
     * @param nums int整型一维数组 
     * @return int整型
     */
    public int minNumberInRotateArray (int[] nums) {
        if(nums.length == 1) {
            return nums[0];
        }

        int n = nums.length;

        int[] temp = new int[n];
        Mergesort(nums, 0, n-1, temp);

        return nums[0];

    }


    public void Mergesort(int[] nums, int left, int right, int[] temp) {
        if(left == right) {
            return ;
        }

        int mid = left + (right - left)/2;
        Mergesort(nums, left, mid, temp);
        Mergesort(nums, mid + 1, right, temp);

        if(nums[mid] <= nums[mid + 1]) {
            return ;
        }

        CrossMerge(nums, left, mid, right, temp);
    }

    public void CrossMerge(int[] nums, int left, int mid, int right, int[] temp) {
        for(int i = left; i <= right; i++) {
            temp[i] = nums[i];
        }
        int i = left;
        int j = mid + 1;
        for(int k = left; k <= right; k++) {
            if(i == mid + 1) {
                nums[k] = temp[j];
                j++;
            }else if(j == right + 1) {
                nums[k] = temp[i];
                i++;
            }else if(temp[i] <= temp[j]) {
                nums[k] = temp[i];
                i++;
            }else {
                nums[k] = temp[j];
                j++;
            }
        }

    }
}
```

## 6. 比较版本号

**题目主要信息**

- 给出2个版本号version1和version2，比较它们的大小
- 版本号是由修订号组成，修订号与修订号之间由一个"."连接
- 修订号可能有前导0，按从左到右的顺序依次比较它们的修订号，比较修订号时，只需比较忽略任何前导零后的整数值
- 如果版本号没有指定某个下标处的修订号，则该修订号视为0
- 版本号中每一节可能超过int的表达范围

**核心思路——截取**：

- 这里有的思路是设计两个指针，顺着字符串作遍历
- 但是学过Python的同学应该很快能够意识到这种题目非常适合使用分割截取转化成列表然后直接比较
- 但是一定要注意的一点是一定要注意这种`1.0`和`1.0.1`这种长度不同的版本号，所以这里我们要设计一个逻辑：遍历的时候要找到最长的那个版本号，如果长度超过某一个版本号对这个版本的值取`0`处理

```python
class Solution:
    def compare(self, version1: str, version2: str) -> int:
        v1 = list(map(int, version1.split('.')))
        v2 = list(map(int, version2.split('.')))

        n = max(len(v1), len(v2))

        for i in range(n):
            num1 = v1[i] if i < len(v1) else 0
            num2 = v2[i] if i < len(v2) else 0

            if num1 > num2:
                return 1
            elif num1 < num2:
                return -1

        return 0
```

