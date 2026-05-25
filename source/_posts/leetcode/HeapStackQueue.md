---
title: leetcode-hot 100 堆/栈/队列系列
date: 2026-05-23 15:30:00
tags:
    - leetcode
    - 堆
    - 栈
    - 列表
categories:
    - leetcode
cover: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg2VwASYtNKAYrFpKO_WPtU9t60gBMWYXlyA&s
---

## 1. 用两个栈实现队列

```java
public class Solution {
    Stack<Integer> stack1 = new Stack<Integer>();
    Stack<Integer> stack2 = new Stack<Integer>();
    
    public void push(int node) {
        stack1.push(node);
    }
    
    public int pop() {
        while(!stack1.isEmpty()) {
            stack2.push(stack1.pop());
        }
        int res = stack2.pop();

        while(!stack2.isEmpty()) {
            stack1.push(stack2.pop());
        }

        return res;
    }
}
```

## 2. 包含min函数的栈
 
 ```java
 public class Solution {

    Stack<Integer> stack1 = new Stack<Integer>();
    Stack<Integer> min = new Stack<Integer>();

    
    public void push(int node) {
        stack1.push(node);

        if(min.isEmpty() || min.peek() > node) {
            min.push(node);
        }
        else {
            min.push(min.peek());
        }
    }
    
    public void pop() {
        stack1.pop();
        min.pop();
    }
    
    public int top() {
        return stack1.peek();
    }
    
    public int min() {
        return min.peek();
    }
}
```

!!! warning
我们一定要将`min`设计一个栈，而且当新入栈的`node`不是最小值的时候一定要在`min`这个栈上再入栈一个当前的最小值，确保不会出现最小值在`stack1`中已经被弹出但是`min`中没有被弹出的情况
!!!

## 3. 有效括号序列

```python
class Solution:
    def isValid(self, s: str) -> bool:
        if s == "":
            return True

        stack = []

        left = "{[("
        right = "}])"

        pairs = {
            ")": "(",
            "]": "[",
            "}": "{"
        }

        for ch in s:
            if ch in left:
                stack.append(ch)

            elif ch in right:
                if not stack:
                    return False

                if stack[-1] == pairs[ch]:
                    stack.pop()
                else:
                    return False

        return not stack
```

## 4. 滑动窗口的最大值


**题目主要信息**：

- 要寻找每个滑动窗口的最大值，每次只滑动一位
- `size`等于`0`或者大于数组长度都返回空值

**核心思路——双向队列**

一个数字`A`进入窗口之后，若是比窗口内其他数字都大，那么这个数字之前的数字都没有用了，因为它们一定会比`A`早离开窗口，而且在`A`离开之前这些数一定不是最大的，所以`A`在进入的时候要依次从后面排除前面的小值。

因为窗口符合先进先出的原理，因此可以考虑双向队列

- 维护一个双向队列，用来存储数列的下标

!!! question
为什么`q`存储下标而不是存储值

这道题目中，我们不只是关心 **谁最大**，还关心**这个元素有没有滑出窗口**
!!!

- 我们对`num`中的元素逐个扫描处理
- `step 1`:将新的元素加入到队列中，如果把比当前元素小或等于的都从队尾弹出去，直到队列中已经存在的元素比当前元素大，我们将当前元素入队
- `step 2`:判断队列中最大元素是否已经滑出窗口(根据下标计算)
- `step 3`:判断一下窗口是否形成，只有当扫描的元素达到窗口大小时，我们开始在答案列表中追加

```python
class Solution:
    def maxInWindows(self, num:List(int), size: int) -> List[int]:
        if size == 0:
            return []
        for i, x in enumerate(num):

            while q and num[q[-1]] <= x:
                q.pop()
            q.append()

            if i - q[0] >= size:
                q.popleft()
            
            ifi >= size - 1:
                ans.append(num[q[0]])

        return ans
```

## 5. 最小的K个数

```java
public class Solution {
    /**
     * 代码中的类名、方法名、参数名已经指定，请勿修改，直接返回方法规定的值即可
     *
     * 
     * @param input int整型一维数组 
     * @param k int整型 
     * @return int整型ArrayList
     */
    public ArrayList<Integer> GetLeastNumbers_Solution (int[] input, int k) {
        if(input.length < k || k == 0) {
            return new ArrayList<Integer>();
        }

        PriorityQueue<Integer> queue = new PriorityQueue<Integer>((a,b)->b-a);
        for(int num: input) {
            if(queue.size() < k) {
                queue.add(num);
            }else {
                if(num < queue.peek()){
                    queue.poll();
                    queue.add(num);
                }
            }
        }

        ArrayList<Integer> ans = new ArrayList<Integer>();
        while(!queue.isEmpty()) {
            ans.add(queue.peek());
            queue.poll();
        }

        Collections.sort(ans);

        return ans;

    }
}
```

## 6. 寻找第k大

**题目主要信息**：


- 利用快速排序的思想寻找数组中的第`k`大元素
- 有重复数字，不用去重，也不用管稳定性

**核心思路——快速排序**：

- 我首先用了归并排序的思路，使用降序排序的方式返回`a[K-1]`就是第`K`大的元素

```java
import java.util.*;


public class Solution {
    /**
     * 代码中的类名、方法名、参数名已经指定，请勿修改，直接返回方法规定的值即可
     *
     * 
     * @param a int整型一维数组 
     * @param n int整型 
     * @param K int整型 
     * @return int整型
     */
    public int findKth (int[] a, int n, int K) {
        if(n < K){
            return -1;
        }

        int[] temp = new int[n];
        
        divideMerge(a, 0, n-1, temp);

        return a[K-1];
    }

    public void divideMerge(int[] a, int left, int right, int[] temp) {
        if(left >= right) {
            return ;
        }

        int mid = left + (right - left)/2;
        divideMerge(a, left, mid, temp);
        divideMerge(a, mid + 1, right, temp);

        if(a[mid] >= a[mid + 1]) {
            return ;
        }

        crossMerge(a, left, mid, right, temp);
    }

    public void crossMerge(int[] a, int left, int mid, int right, int[] temp) {
        for(int i = left; i <= right; i++) {
            temp[i] = a[i];
        }

        int i = left;
        int j = mid + 1;

        for(int k = left; k <= right; k++) {
             if(i == mid + 1) {
                a[k] = temp[j];
                j++;
             }else  if(j == right + 1) {
                a[k] = temp[i];
                i++;
             }else if(temp[i] >= temp[j]) {
                a[k] = temp[i];
                i++;
             }else{
                a[k] = temp[j];
                j++;
             }
        }
    }
}
```

!!! note
- `peek()`:查看堆顶元素(例如这道题目我们维护的是一个大顶堆，那么peek()出来的元素就是最大值)
- `poll()`:弹出堆顶元素
!!!

- 但是这种方法的弊端在于它需要将所有元素都排序才能解决问题。那么我们自然想到了另一种思路：就是使用堆排序——一个典型处理`TopK`问题的思路
  - 暂存K个较大的值，优先队列默认是**升序排序**，队头元素是堆内的最小元素，也就是小根堆
  - 遍历每一个元素，调整小根堆
  - 对于小根堆来说，只要没满就加入；如果没满，判断是否需要替换掉第一个元素
  - 最终我们要返回的就是这个小根堆中最小的那个元素

```java
public class Solution {
    /**
     * 代码中的类名、方法名、参数名已经指定，请勿修改，直接返回方法规定的值即可
     *
     * 
     * @param a int整型一维数组 
     * @param n int整型 
     * @param K int整型 
     * @return int整型
     */
    public int findKth (int[] a, int n, int K) {
        PriorityQueue<Integer> queue = new PriorityQueue<Integer>();

        for(int num: a) {
            if(queue.size() < K) {
                queue.add(num);
            }else {
                if(num > queue.peek()) {
                    queue.poll();
                    queue.add(num);
                }
            }
        }

        return queue.isEmpty() ? 0 : queue.peek();
    }
}
```

这种题目找第几大或者第几小的元素，最好的方法其实是 **快速排序**

## 7. 数据流中的中位数

**题目主要信息**：

- 寻找数据的中位数
- 数据量在不断输入增长

**核心思路**

### 7.1 插入排序

```java
import java.util.*;

public class Solution {
    ArrayList<Integer> nums = new ArrayList<Integer>();

    public void Insert(Integer num) {
        if (nums.isEmpty()) {
            nums.add(num);
        } else {
            int i = 0;
            for (; i < nums.size(); i++) {
                if (num <= nums.get(i)) {
                    break;
                }
            }

            nums.add(i, num);
        }
    }

    public Double GetMedian() {
        int n = nums.size();

        if (n % 2 == 0) {
            return ((double) nums.get(n / 2 - 1) + (double) nums.get(n / 2)) / 2;
        } else {
            return (double) nums.get(n / 2);
        }
    }
}
```

### 7.2 使用一个堆

```java
import java.util.*;

public class Solution {
    PriorityQueue<Integer> queue = new PriorityQueue<Integer>();

    public void Insert(Integer num) {
        queue.add(num);
    }

    public Double GetMedian() {
        PriorityQueue<Integer> temp = new PriorityQueue<>(queue);

        int len = temp.size();
        int mid = len / 2;

        if (len % 2 == 1) {
            for (int i = 0; i < mid; i++) {
                temp.poll();
            }

            return temp.peek().doubleValue();

        } else {
            for (int i = 0; i < mid - 1; i++) {
                temp.poll();
            }

            int val1 = temp.poll();
            int val2 = temp.peek();

            return (val1 + val2) / 2.0;
        }
    }
}
```

### 7.3 使用两个堆

```java
import java.util.*;

public class Solution {
    // left 是大根堆，保存较小的一半
    PriorityQueue<Integer> left = new PriorityQueue<>((a, b) -> b - a);

    // right 是小根堆，保存较大的一半
    PriorityQueue<Integer> right = new PriorityQueue<>();

    public void Insert(Integer num) {
        // 先放入 right
        right.offer(num);

        // 把 right 中最小的元素移动到 left
        left.offer(right.poll());

        // 保证 right 的元素个数 >= left 的元素个数
        if (left.size() > right.size()) {
            right.offer(left.poll());
        }
    }

    public Double GetMedian() {
        int total = left.size() + right.size();

        if (total % 2 == 1) {
            return right.peek().doubleValue();
        } else {
            return (left.peek() + right.peek()) / 2.0;
        }
    }
}
```

## 8.表达式求值

**题目的主要信息**

- 写一个支持`+`,`-`,`*`三种符号的运算器，其中优先级是一级，`*`更高一级
- 支持括号运算

**核心思路**：

这道题目我们主要考虑的是两个问题：

- 处理运算优先级的问题
- 处理括号的问题

官方给出的解法是将加法作为默认运算符，如果遇到括号就递归处理；如果遇到`*`就弹出一个操作数算乘法再将结果压入栈中

1. 用栈保存各部分的计算和
2. 遍历表达式，使用`op`变量记录运算符，初始化是`+`，使用`number`变量记录字符串中的数字部分的数字值是多少
    - 遇到空格跳过
    - 遇到数字时继续遍历这个完整的数字的值
    - 遇到左括号递归处理括号中的表达式
      - 先找到对应的右括号，因为肯呢个里面还嵌套很多对括号，使用一个变量`counterPartition`统计括号对数直到变量为`0`
    - 遇到运算符时或者到达表达式末尾时，就去计算上一个运算符并把计算结果`push`进栈
      - 如果是`+`,直接入栈
      - 如果是`-`,取反入栈
      - 如果是`*`，弹出一个操作数做乘法得到结果入栈
3. 最后将栈中的结果相加即可


```java
public class Solution {
    /**
     * 代码中的类名、方法名、参数名已经指定，请勿修改，直接返回方法规定的值即可
     *
     * 返回表达式的值
     * @param s string字符串 待计算的表达式
     * @return int整型
     */
    public int solve (String s) {
        Stack<Integer> stack = new Stack<Integer>();

        int num = 0;
        char op = '+';

        int n = s.length();
        for (int i = 0; i < n; i++) {
            if (s.charAt(i) == ' ') {
                continue;
            }

            if (Character.isDigit(s.charAt(i))) {
                num = num * 10 + s.charAt(i) - '0';
            }

            if (s.charAt(i) == '(') {
                int j = i + 1;
                int partitionCount = 1;
                while (partitionCount > 0) {
                    if (s.charAt(j) == '(') {
                        partitionCount++;
                    }
                    if (s.charAt(j) == ')') {
                        partitionCount--;
                    }
                    j++;
                }

                num = solve(s.substring(i + 1, j - 1));
                i = j - 1; //这一步真的很重要
            }

            if(!Character.isDigit(s.charAt(i)) || i == n - 1) {
                if(op == '+') {
                    stack.push(num);
                }else if(op == '-') {
                    stack.push(-1 * num);
                }else if(op == '*') {
                    stack.push(stack.pop() * num);
                }

                num = 0;
                op = s.charAt(i);
            }

        }
        int ans = 0;
        while(!stack.isEmpty()) {
            ans += stack.pop();
        }
        return ans;
    }
}
```

!!! warning
- 递归处理括号内部的表达式之后，`i`一定要向后移动到`j-1`的位置上
- 入栈的条件不只有字符不是数字，还有一个很重要的字符串遍历到最后的位置
!!!