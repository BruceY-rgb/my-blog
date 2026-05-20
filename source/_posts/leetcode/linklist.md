---
title: leetcode-hot 100 链表系列
date: 2026-05-19 16:30:00
tags: 
    - leetcode
    - 链表
categories: 
    - leetcode
cover: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSg2VwASYtNKAYrFpKO_WPtU9t60gBMWYXlyA&s
---

## 1. 反转链表

**题目的主要信息**：给定一个长度为`n`的链表，反转该链表，输出表头

**具体做法**：

- `step1`:先处理空链表，空链表不需要反转
- `step2`:我们可以设置两个指针，一个当前节点的指针，一个上一个节点的指针(初始为空，这里我们设计了一个dummy节点，防止了返回为空的情况)
- `step3`:遍历整个链表，每到一个节点,断开当前节点与后面节点的指针，并用临时节点保存后一个节点，然后当前节点指向上一个节点
- `step4`:再轮换当前指针与上一个指针，让它们进入下一个节点及下一个节点的前序节点

```java
public class Solution {
    public ListNode ReverseList(ListNode head) {
        if(head == null) {
            return null;
        }

        ListNode pre = null;
        ListNode cur = head;

        while(cur != null) {
            ListNode temp = cur.next;
            cur.next = pre;
            pre = cur;
            cur = temp;
        }

        return pre;
    }
}
```

{% raw %}
<link rel="stylesheet" href="/my-blog/css/linklist-anim.css">
<div class="ll-viz" data-algorithm="reverse-list" data-values="1,2,3,4,5" data-autoplay="true" data-interval="1600"></div>
<script src="/my-blog/js/linklist-anim.js"></script>
{% endraw %}


## 2. 链表内指定区间反转

**题目主要信息**：

- 将一个节点数为 size 链表 m 位置到 n 位置之间的区间反转
- 链表其他部分不变，返回头结点

```java
import java.util.*;
public class Solution {
    public ListNode reverseBetween (ListNode head, int m, int n) {
        ListNode dummy = new ListNode(0);
        dummy.next = head;
        ListNode pre = dummy;
        for(int i = 0; i < m-1; i++) {
            pre = pre.next;
        }

        ListNode cur = pre.next;
        for(int i = 0; i < n-m+1; i++){
            ListNode temp = cur.next;
            cur.next = pre;
            pre = temp;
            cur = 
        }
    }
}
```

{% raw %}

(% endrow %)