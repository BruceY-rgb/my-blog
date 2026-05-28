---
title: leetcode-hot 100 递归与回溯
date: 2026-05-23 10:30:00
tags:
    - leetcode
    - 回溯
categories:
    - leetcode
cover: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg2VwASYtNKAYrFpKO_WPtU9t60gBMWYXlyA&s
---

## 1. 没有重复项数字的全排列

```java
public class Solution {
    ArrayList<ArrayList<Integer>> ans = new ArrayList<ArrayList<Integer>>();
    /**
     * 代码中的类名、方法名、参数名已经指定，请勿修改，直接返回方法规定的值即可
     *
     * 
     * @param num int整型一维数组 
     * @return int整型ArrayList<ArrayList<>>
     */
    public ArrayList<ArrayList<Integer>> permute (int[] num) {
        
        ArrayList<Integer> list = new ArrayList<Integer>();
        backtrack(num, list);

        return ans;
    }

    public void backtrack(int[] num, ArrayList<Integer> list) {
        if(list.size() == num.length) {
            ans.add(new ArrayList<Integer>(list));
            return ;
        }

        int len = num.length;
        for(int i = 0; i < len; i++) {
            if(list.contains(num[i])) {
                continue;
            }

            list.add(num[i]);
            backtrack(num, list);
            list.remove(list.size()-1);
        }
    }
}
```

!!! warning
这种着重注意两点

- list 是一个会被反复修改的临时路径，如果直接加入 ans，加入的是同一个对象的引用，而不是当前排列的快照。必须新创建一个对象再加入
- `remove()`方法参数是`index`，我们每次要做的是移除最后一个元素
!!!

## 2. 有重复项数字的全排列

**核心思路——回溯**

这道题目的关键就是：**要记录每个元素的使用情况**，这也是所有回溯问题的共同点

```java
class Solution {
    List<List<Integer>> res = new ArrayList<>();
    List<Integer> path = new ArrayList<>();
    boolean[] used;

    public List<List<Integer>> permute(int[] nums) {
        used = new boolean[nums.length];
        //Arrays.sort(nums) 如果要求输出结果有序加上这一行
        backtrack(nums);
        return res;
    }

    public void backtrack(int[] nums) {
        if (path.size() == nums.length) {
            res.add(new ArrayList<>(path));
            return;
        }

        for (int i = 0; i < nums.length; i++) {
            // 剪枝，用过的不能再用
            if (used[i] == true) {
                continue;
            }

            // 做选择
            path.add(nums[i]);
            used[i] = true;

            // 递归
            backtrack(nums);

            // 撤销
            path.remove(path.size() - 1);
            used[i] = false;
        }
    }
}
```

## 3. 岛屿问题

```java
import java.util.*;

public class Solution {
    int ans = 0;
    boolean isValid(char[][] grid, int x, int y) {
        int row = grid.length;
        int column = grid[0].length;
        return x >= 0 &&x < row && y >= 0 && y < grid[0].length;
    }

    public void dfs(char[][] grid, int x, int y) {
        if(!isValid(grid, x, y)) {
            return ;
        }

        if(grid[x][y] != '1') {
            return  ;
        }

        grid[x][y] = '0';

        dfs(grid, x - 1, y);
        dfs(grid, x + 1, y);
        dfs(grid, x, y - 1);
        dfs(grid, x, y + 1);
    }
    /**
     * 代码中的类名、方法名、参数名已经指定，请勿修改，直接返回方法规定的值即可
     *
     * 判断岛屿数量
     * @param grid char字符型二维数组 
     * @return int整型
     */
    public int solve (char[][] grid) {
        if(grid == null || grid.length == 0) {
            return 0;
        }

        for(int i = 0; i < grid.length; i++){
            for(int j = 0; j < grid[0].length; j++) {
                if(grid[i][j] == '1') {
                    ans++;
                    dfs(grid, i, j);
                }
            }
        }

        return ans; 
    }
}
```

## 4. 字符串的排列问题

**题目主要信息**:

- 给定一个长度为n的字符串，求其中所有字符的全排列
- 字符串中可能有重复字符，打印顺序任意
- 字符串中只包含大小写字母

**核心思路——回溯 + 递归**

这道题目和之前的排列问题的思路完全一样，但是我们会遇到的问题是是这里遇到的是字符串，同时这道题目的字符串可能很大

基本思路在这里就不赘述了，与[有重复项数字的全排列](#2-有重复项数字的全排列)完全相同，必须要注意的就是我们的剪枝操作和对字符串的处理

在有重复项数字的全排列这道题目中，我们的判断结果集中是否已经有当前`path`的方法是用`ArrayList`的`contains()`方法。但是这个方法本质上是 **非常耗时的**，在处理大量数据时并不是一个好的选择。所以我们应该在回溯的过程中做一个剪枝操作，那就是：**同一层级不能重复使用相同的元素**

这一操作的核心要求是：**在处理字符串之前对里面的字符进行排序**，字符串本身是不可变对象，无法对里面的单个元素进行操作，所以在执行操作之前必须要将其转化为一个 **字符数组**，然后再进行排序


```java
import java.util.*;

public class Solution {

    ArrayList<String> ans = new ArrayList<>();
    StringBuilder path = new StringBuilder();
    boolean[] used;

    public ArrayList<String> Permutation(String str) {
        if (str == null || str.length() == 0) {
            return ans;
        }

        char[] chars = str.toCharArray();
        Arrays.sort(chars);

        used = new boolean[chars.length];

        backtrack(chars);

        return ans;
    }

    public void backtrack(char[] chars) {
        int n = chars.length;

        if (path.length() == n) {
            ans.add(path.toString());
            return;
        }

        for (int i = 0; i < n; i++) {
            if (used[i]) {
                continue;
            }

            // 去重关键：同一层中，相同字符只使用一次
            if (i > 0 && chars[i] == chars[i - 1] && !used[i - 1]) {
                continue;
            }

            path.append(chars[i]);
            used[i] = true;

            backtrack(chars);

            path.deleteCharAt(path.length() - 1);
            used[i] = false;
        }
    }
}
```

## 5. n皇后

**题目主要信息**

- 在一个的$n \times n$棋盘上要摆放$n$个皇后，求摆的方案数，不同位置就是不同方案数
- 摆放要求：任何两个皇后不同行，不同列也不在同一条斜线上

**核心思路**：

回溯法最重要的就是找到我们怎么回溯，也就是那条路径是怎么组织的。之前我们接触到的回溯基本都是，元素都在那里，我们只需要一个一个去尝试总能找到答案

但是`n`皇后的特点决定了，它要有一个固定的回溯对象和一个可以记录的对象。我们每一行一定都是要走的，只不过走每一行的时候要看一下有没有可能在这一行的某一个位置放一个棋子，。那么纵坐标也就成了我们需要记录的对象。我们回溯深度的依据就是行的坐标

但是这里有一个比较复杂的地方，是皇后不能在同一斜线上，斜线还分为两种情况

- 正对角线：$row - col + n - 1$（我们加上一个偏移量`n-1`保证索引是非负的）
- 反对角线：$row + col$

```java
import java.util.*;

public class Solution {
    int count = 0;
    boolean[] usedCol;
    boolean[] usedDiag1;
    boolean[] usedDiag2;

    public int Nqueen(int n) {
        if (n <= 0) {
            return 0;
        }

        usedCol = new boolean[n];
        usedDiag1 = new boolean[2 * n - 1];
        usedDiag2 = new boolean[2 * n - 1];

        backtrack(0, n);

        return count;
    }

    public void backtrack(int row, int n) {
        if (row == n) {
            count++;
            return;
        }

        for (int col = 0; col < n; col++) {
            int d1 = row - col + n - 1;
            int d2 = row + col;

            if (usedCol[col] || usedDiag1[d1] || usedDiag2[d2]) {
                continue;
            }

            usedCol[col] = true;
            usedDiag1[d1] = true;
            usedDiag2[d2] = true;

            backtrack(row + 1, n);

            usedCol[col] = false;
            usedDiag1[d1] = false;
            usedDiag2[d2] = false;
        }
    }
}
```