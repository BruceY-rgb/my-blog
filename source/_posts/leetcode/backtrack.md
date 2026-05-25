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