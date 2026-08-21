---
title: 第四章 复合数据类型
date: '2026-04-11 10:40:00'
categories:
  - CS课程笔记
  - Python
  - 课程笔记
tags:
  - Python
  - 数据类型
cover: >-
  https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgFnjkHPu6S3XkALLfI3JgtiLDIrtDbHvxEpkgSw2BVLnNB4I9Y3ZeeQqMUewro4UyiLeRGQAJ45gbvOsxIx7bDFMmbd_UPPn6WYsjlgZLcTHPiWtnd7DspsgKxPA6JWWUe9YVjOJZTROZZ/s1600/python-programming.jpg
description: >-
  1. 数据容器 1.1 数据容器的概念 为了满足程序中复杂的数据表示，Python 支持复合数据类型 (compound data
  type)，可以将一批数据作为一个整体进行数据操作，这也是数据容器的概念。 常用的内置容器类型： - 序列 - 列表(list) - 字符串(string)
  - 元组(tuple) - 字
published: true
legacyPath: 2026/04/11/Python/Chapter4
sourcePath: Python/Chapter4.md
---

## 1. 数据容器

### 1.1 数据容器的概念

为了满足程序中复杂的数据表示，Python 支持复合数据类型 (compound data type)，可以将一批数据作为一个整体进行数据操作，这也是数据容器的概念。

常用的内置容器类型：

- 序列
    - 列表(list)
    - 字符串(string)
    - 元组(tuple)
    - 字典
- 集合

### 1.2 容器分类

![容器分类](/my-blog/2026/04/11/Python/Chapter4/image-4.png)

<aside class="admonition note">
- **是否有序**：决定我们能否用`[0]`这种索引下标去访问元素，能就是有序，不能就是无序
- **是否可变**:不可变对象想修改只能重新赋值；可变对象可以直接对原有对象进行修改
</aside>
## 2. 序列

### 2.1 序列概述

这种容器中可包含多个数据(元素)，容器中的数据(元素)有**先后次序**，每个元素通过**下标(索引)**来访问。序列的下标从 0 开始，后面下标依次为 1, 2, 3, .....

> 序列是其中一大类数据容器的统称，不是具体的数据类型

|类型|字面量|可变性|
|-|-|-|
|字符串|`hello`|不可变对象|
|列表|`['h','e','l','l','o']`|可变对象|
|元组|`('h','e','l','l','o')`|不可变对象|

### 2.2 通用的序列操作

![通用序列操作表](/my-blog/2026/04/11/Python/Chapter4/image-5.png)

#### 索引访问 []

- 正向索引：以`0`为起点，表示元素想杜宇序列其实位置开始的偏移量，范围是(`[0,n-1]`)
- 反向索引：以`-1`为起点，从序列末尾向前定位
- **索引不能越界**

| 操作 | 语法示例 | 说明 |
|------|----------|------|
| 正向索引 | `seq[0]` | 访问第一个元素 |
| 负向索引 | `seq[-1]` | 访问最后一个元素 |

#### 切片访问 [:]

切片是截取一个区间，返回一个新序列，不破坏原始数据。

- **正向索引**：以0为起点，表示元素相对于序列起始位置的偏移量，范围为 `[0, n-1]`
- **负向索引**：以-1为起点，从序列末尾向前定位
- **左闭右开**：返回 `[start, end)` 区间

**示例：**
```python
prompt = 'hello'
prompt[0]     # 结果: 'h'
prompt[-1]    # 结果: 'o'
prompt[1:4]   # 结果: 'ell'
prompt[1:10]  # 结果: 'ello'
```

#### 切片练习

假设 `a = [2, 3, 5, 7, 11, 13]`

| 切片表达式 | 结果 | 说明 |
|------------|------|------|
| `a[1:-3]` | `[3, 5]` | 切片使用负的下标访问 |
| `a[2:]` | `[5, 7, 11, 13]` | 省略第二个下标 |
| `a[:3]` | `[2, 3, 5]` | 省略第一个下标，第二个下标为正数 |
| `a[:-3]` | `[2, 3, 5]` | 省略第一个下标，第二个下标为负数 |
| `a[:-3:-1]` | `[13, 11]` | 第三个参数是负数时逆序 |
| `a[4::-1]` | `[11, 7, 5, 3, 2]` | 切片第三参数为负数时逆序 |

<aside class="admonition tip">
- 步长是正数顺序访问
- 步长为负数逆序访问
- 步长不能为0
</aside>
#### 序列的运算符

| 运算符 | 说明 | 示例 |
|--------|------|------|
| `+` | 连接两个序列 | `[1,2,3] + [4,5,6]` → `[1,2,3,4,5,6]` |
| `*` | 重复序列 | `[1,2,3] * 3` → `[1,2,3,1,2,3,1,2,3]` |

> 重复序列重复的是元素，比如`[[1,2,3]]*3`的结果是`[[1,2,3],[1,2,3],[1,2,3]]`

<aside class="admonition warning">
必须是同类序列之间进行操作
</aside>
#### 序列的通用方法

- `index()`
- `count()`

> `my_tuple.index("green", 2):从索引2开始寻找`green`,返回`3`。找不到会报错 **ValueError**

```python
# index() - 获取元素首次出现的索引，不存在报错
my_list = ["apple", "banana", "cherry", "apple", "date"]
my_list.index("banana")  # 1

my_tuple = ("red", "green", "blue", "green", "yellow")
my_tuple.index("green", 2)  # 3，从索引2开始查找

# count() - 统计元素出现次数
my_tuple.count("green")  # 2
my_tuple.count("purple") # 0
```

<aside class="admonition warning">
`find()`方法是字符串特有的方法
</aside>
#### 序列的内置函数

**内置函数**：len(), max(), min(), sum(), sorted()

```python
# len() - 返回元素个数
len([2,3,5,7])      # 4
len('hello world')  # 11

# min()/max() - 返回最小/最大值
max([21, 3, 55, -7, 11])  # 55
min('浙江大学')             # '大'

# sum() - 求和（仅数值序列）
sum([2,3,5,7])  # 17

# sorted() - 返回排序后的新列表（不修改原序列）
sorted([21,3,55,-7,11])  # [-7, 3, 11, 21, 55]
sorted('world')           # ['d', 'l', 'o', 'r', 'w']
```

<aside class="admonition warning">
- `sum()`只能对数字类型求和

```python
sum([[1, 2, 3]]) # error
```
</aside>
#### 遍历序列

序列是典型的可迭代对象，使用 `for` 循环可以遍历访问每个元素。

```python
# 方法1：直接遍历
for item in sequence:
    print(item)

# 方法2：使用 enumerate()（同时获取索引和值）
for index, item in enumerate(sequence):
    print(f"{index}: {item}")

# 方法3：使用 range() 和 len()
for i in range(len(sequence)):
    print(f"{i}: {sequence[i]}")
```

## 3. 列表

### 3.1 列表的概念

列表是 Python 中最核心的数据容器之一，具有三个关键特性：

1. **有序性**：元素按顺序存储
2. **可变性**：内容可以随时修改
3. **通用性**：支持存储不同类型的数据


### 3.2 创建列表

底层实现：列表采用动态数组结构，内部维护连续的内存空间，用于**存储元素对象地址**（指针），**而不是对象本身**。

**创建方式**

```python
# 1. 直接使用字面量
a = []                  # 空列表
a = [2, 3, 5, 7, 11, 13]
a = [0] * 5             # 快速生成 [0, 0, 0, 0, 0]

# 2. 使用 list() 转换
a = list('hello')               # ['h', 'e', 'l', 'l', 'o']
a = list(range(1, 10, 2))        # [1, 3, 5, 7, 9]
```

### 3.3 多维列表

列表的元素可以是任何类型，包括列表本身。当元素是列表时，可以构成多维列表（矩阵）。

```python
matrix = [
    [1, 2, 3, 4, 5],
    [3, 0, 8, 11, 14],
    [5, 6, 9, 12, 16],
    [7, 0, 0, 0, 0],
    [9, 11, 17, 0, 15]
]
```

使用 matrix[0][0] 访问第一行第一列的元素

![多维列表行列序号对应](/my-blog/2026/04/11/Python/Chapter4/image-6.png)

### 3.4 修改列表元素

#### 单个元素修改
```python
a = [1, 3, 5, 7, 11]
a[0] = 2
print(a)  # [2, 3, 5, 7, 11]
```

<aside class="admonition warning">
`id(a)`在修改前后不会发生变化，是直接在原有对象上修改对象内容
</aside>
#### 切片修改

切片修改可以实现替换、插入和删除：

- 替换
  - step 1:删除`[start,end)`中的所有元素
  - step 2:将等号右侧的可迭代对象(如列表、元组、字符串等)里面的元素，逐一插入到**刚刚腾出来的空隙中**
- 插入
  - 所有切片的赋值原理都是先删除一个范围内的元素，然后在这个元素范围内进行追加
  - `numbers[1:1]= [100, 200]`是**在`numbers[1]`的位置进行插入而不是`numbers[1]`后面**

```python
numbers = [10, 20, 30, 40, 50]

# 替换
numbers[1:4] = [25, 35]
print(numbers)  # [10, 25, 35, 50]

# 插入
numbers[1:1] = [100, 200]
print(numbers)  # [10, 100, 200, 25, 35, 50]

# 删除
numbers[3:5] = []
print(numbers)  # [10, 100, 200, 50]
```

<aside class="admonition warning">
- 索引不要越界
- 赋值的对象必须是 **列表**
</aside>
### 3.5 列表的方法

#### 增（添加）

| 方法 | 语法 | 功能 |
|------|------|------|
| `append()` | `ls.append(x)` | 在列表**末尾**添加**一个元素** |
| `extend()` | `ls.extend(iterable)` | 将可迭代对象的所有元素逐一添加至末尾 |
| `insert()` | `ls.insert(i, x)` | 在指定索引 i 处插入元素 |

<aside class="admonition note">
**extend(iterable)**:

- 要求传入的参数必须是一个可迭代的对象
- python会遍历该对象，将其内部的元素 **逐一解包**，并按照顺序追加到原列表的末尾。
  - 列表是可变对象
- 它的效果等同于针对列表切片的尾部赋值`ls(len(ls):)=iterable`
</aside>
```python
# append() - 追加
a = [6, 3, 5, 7, 1]
a.append(13)
print(a)  # [6, 3, 5, 7, 1, 13]

# extend() - 扩展
lst = [1, 2]
lst.extend([3, 4])
print(lst)  # [1, 2, 3, 4]
lst.extend("ab")
print(lst)  # [1, 2, 3, 4, 'a', 'b']
```

<aside class="admonition tip">
`insert()` 灵活但时间复杂度高，使用频率不如 `append()`
</aside>
<aside class="admonition warning">
```python
a = [1,2,3,4]
a.append([5,6])
len(a) # 5
print(a) # [1,2,3,4,[5,6]]
```
</aside>
#### 删（移除）

| 方法 | 语法 | 功能 |
|------|------|------|
| `pop()` | `ls.pop([i])` | 移除并**返回指定位置的元素**（默认末尾） |
| `remove()` | `ls.remove(x)` | 移除列表中第一个值为 x 的元素 |
| `clear()` | `ls.clear()` | 清空列表中的所有元素 |

```python
# pop() - 弹出
a = [2, 3, 5, 7, 11]
print(a.pop())   # 11
print(a.pop(2))   # 5
print(a)          # [2, 3, 7]

# remove() - 删除第一个匹配元素
a = [2, 3, 5, 7, 5, 11]
a.remove(5)
print(a)  # [2, 3, 7, 5, 11]

# clear() - 清除
a.clear()
print(a)  # []
```

<aside class="admonition warning">
在使用remove方法的时候，如果**要删除的数据不在列表中**，则会**发生错误**
</aside>
<aside class="admonition example">
```python
a = [1,2,3,3,5]
for i in a:
    if i == 3:
        a.remove(i)

print(a) # [1,2,3,5]
```

- 结果没有删除全部的`3`是因为删掉第一个3之后第二个3会被跳过

```python
a = [1,2,3,3,5]
for i in a[:]:
    if i==3:
        a.remove(i);
print(a) # 1,2,5
```

- 这里`a[:]`的作用是创建列表副本，相当于每次循环都会在副本中去遍历元素，不会遗漏
</aside>
<aside class="admonition warning">
- `del`关键词用于直接删除对象本身
</aside>
#### 改/排（变形）

| 方法 | 语法 | 功能 |
|------|------|------|
| `sort()` | `ls.sort()` | 对列表元素进行原地排序 |
| `reverse()` | `ls.reverse()` | 反转列表中元素的顺序 |

> `reverse`方法没有返回值

```python
# reverse() - 反转
a = [21, 3, 5, 7, 1]
a.reverse()
print(a)  # [1, 7, 5, 3, 21]

# sort() - 排序（无返回值）
a = [8, 2, 10, 5, 3, 11]
a.sort()
print(a)  # [2, 3, 5, 8, 10, 11]
a.sort(reverse=True)
print(a)  # [11, 10, 8, 5, 3, 2]
```

<aside class="admonition tip">
- `sorted()` 是内置函数，返回新列表，不会修改原列表；
- `list.sort()` 是列表方法，原地排序
</aside>
#### 复制

| 方法 | 语法 | 功能 |
|------|------|------|
| `copy()` | `new_ls = ls.copy()` | 生成列表的一个浅拷贝 |

```python
original = [1, 2, 3]
copied = original.copy()
print(original is copied)  # False 说明不是同一个对象
print(original == copied) # True 值相等
```

![列表复制](/my-blog/2026/04/11/Python/Chapter4/image-7.png)

!!! note "直接赋值、浅拷贝、深拷贝的差异"
```python
# 直接赋值
a = [1,2,3]
b = a # b和a指向同一个列表
b.append(4) # 修改b会影响a
print(a) # [1,2,3,4]
```
![直接赋值](/my-blog/2026/04/11/Python/Chapter4/image-8.png)

```python
a = [[1,2],[3,4]]
b=a[:] # 浅拷贝(只是对第一层进行浅拷贝)
b[0].append(5) # 修改嵌套列表会影响a
print(a) # [[1,2,5],[3,4]]
```

![浅拷贝](/my-blog/2026/04/11/Python/Chapter4/image-9.png)

```python
import copy
a = [[1,2],[3,4]]
b = copy.deepcopy(a)
b[0].append(5) # 不影响a
print(a) # [[1,2],[3,4]]
```

![深拷贝](/my-blog/2026/04/11/Python/Chapter4/image-10.png)
</aside>
#### 查（检索）

| 方法 | 语法 | 功能 |
|------|------|------|
| `index()` | `ls.index(x)` | 返回第一个值为 x 的元素的索引 |
| `count()` | `ls.count(x)` | 统计某个元素在列表中出现的次数 |

### 3.6 直接赋值、浅拷贝、深拷贝的差异

```python
import copy

# 直接赋值 - 指向同一对象
a = [[1, 2], [3, 4]]
b = a
b.append(4)
print(a)  # [1, 2, 3, 4]  # a 也会被修改

# 浅拷贝 - 只拷贝第一层
a = [[1, 2], [3, 4]]
b = a[:]  # 或 b = a.copy()
b[0].append(5)
print(a)  # [[1, 2, 5], [3, 4]]  # 嵌套列表受影响

# 深拷贝 - 完全独立
a = [[1, 2], [3, 4]]
b = copy.deepcopy(a)
b[0].append(5)
print(a)  # [[1, 2], [3, 4]]  # 完全不受影响
```

### 3.7 列表推导式

列表推导式是将某种操作应用到序列，从一个或多个列表快速简洁地创建新列表的方法，又称列表解析。

它还可以将循环和条件判断结合，从而避免语法冗长的代码，同时提高程序性能

#### 基本推导式

```python
[expression for item in iterable]
```

> 这里的`expression`可以是多种形式，基本表达式、函数、条件表达式等等

```python
nl = [2 * number for number in [1, 2, 3, 4, 5]]
# 结果: [2, 4, 6, 8, 10]

slen = [len(s) for s in ['apple', 'banana', 'peach', 'watermelon']]
# 结果: [5, 6, 5, 10]

cl = [number if number % 2 else -number for number in range(1, 8)]
# 结果: [1, -2, 3, -4, 5, -6, 7]
```

#### 条件过滤

添加条件过滤，将原有迭代对象中符合条件的元素找出来形成新列表

```python
[expression for item in iterable if condition]
```

```python
nl = [number for number in range(1, 8) if number % 2 == 1]
# 结果: [1, 3, 5, 7]
```

<aside class="admonition warning">
新列表的元素个数一定≤原有列表元素的个数
</aside>
#### 嵌套循环

```python
[exp for outer in outer_iterable for inner in inner_iterable]

pl = [(x, y) for x in range(2) for y in range(2)]
# 结果: [(0, 0), (0, 1), (1, 0), (1, 1)]

flat_pl = [item for row in pl for item in row]
# 结果: [0, 0, 0, 1, 1, 0, 1, 1]
```

#### 推导式练习

```python
# 生成数列求和：计算 1+1/2+...+1/20 之和
result = sum([1/i for i in range(1, 21)])
# 结果: 3.597739657143682

# 多条件文本处理
# 要求：从word中筛选出同时满足长度大于等于5且以`s`结尾单词，并转为全大写
words = ['apples', 'Students', 'cats', 'people']
result = [word.upper() for word in words if len(word) >= 5 and word[-1] == 's']
# 结果: ['APPLES', 'STUDENTS']
```

### 3.8 列表的实际应用

- **`append() + pop()`**：天然栈（LIFO，后进先出），适合撤销、括号匹配、路径回退、DFS
- **`append() + pop(0)`**：可以实现队列（FIFO，先进先出），但效率较低，可使用 `collections.deque`

## 4. 元组

### 4.1 元组的概念

元组是**不可修改的任意类型的数据序列**，其字面量用**圆括号** `()` 表示。

```python
# 创建方式
weekend = ("周六", "周日")          # 1. 直接用圆括号
point = (100, 200)

rgb = 255, 128, 0                   # 2. 不用括号（逗号分隔）

single = (42,)                      # 3. 单元素元组（必须加逗号）
# 若写成 (42)，则是整数42

chars = tuple("hello")              # 4. tuple() 转换
# ('h', 'e', 'l', 'l', 'o')

nums = tuple([1, 2, 3])            # (1, 2, 3)
```

<aside class="admonition warning">
```python
a = [0]
type(a) # list
a = (0)
type(a) # int
```
</aside>
### 4.2 元组的特点

元组只有序列的通用方法：`index()` 和 `count()`

1. **不可变性（核心特性）**：不支持添加、删除或修改元素，能**有效防止数据被意外修改**，**起到数据保护作用**
2. **结构简单**：不需要支持动态扩展等机制，运行开销更低
3. **内存占用少**：创建时按需分配，不需要预留额外空间，适合大规模数据
4. **可哈希**：可以作为字典的"键"，也可作为集合的元素

<aside class="admonition note">
在选择数据结构时，更重要的是根据数据是否需要修改来选择合适的数据结构
</aside>
### 4.3 练习题

#### 打分程序

设计一个打分程序，计算去掉一个最高分、一个最低分后一名选手的最后平均得分。

**思路：**
1. 输入若干分数
2. 如何获得最高分和最低分
3. 如何去掉这两个分数
4. 如何计算平均分

```python
score = list(map(float, input().split()))

slen = len(score)
smin = min(score)
smax = max(score)

average = sum(score) / (slen-2)
print(average)
```

#### 排序

在一行中输入若干个整数，至少输入一个整数，整数之间用空格分割，要求将数据按从小到大排序输出。

**示例：**
- 输入：`5 -76 8 345 67 2`
- 输出：`[-76, 5, 8, 67, 2, 345]`

```python
nums = input()
numl = [int(n) for n in nums.split()]
num.sort()
print(numl)
```

#### 统计单词

在一个英文句子中，统计单词数量（包括重复单词），并找出所有以元音字母（a, e, i, o, u）开头的单词并输出。

**思路：**
1. 如何分词
2. 识别元音字母开头
3. 大小写处理

```python
s = input()
tokens = s.split()
count = len(tokens)

vowels = []
for t in tokens:
    if t and t[0].lower() in 'aeiou':
        vowels.append(t)
```

#### 凯撒密码加密

编写一个明文密文转换程序，加密方法为凯撒密码（A→C、B→D…Y→A、Z→B）。

**示例：**
- 输入：`CHINA`
- 输出：`EJKPC`

```python
table = [chr(i) for i in range(65, 91)]
new_table = table[2:] + table[:2] 
s = input()
news = [new_table[table.index(i)] for i in s]
print(''.join(news))
```

#### 输出图形

提示用户输入图形的行数，然后输出相应图形。

**思路：**
1. 输入行数
2. 循环输出每一行
3. 每一行可以看着两部分空格和字母

#### 书号验证

设计一个查询书号是否正确的程序，以13位书号为例：

**验证方法：**
1. 前12位数依次乘以1和3，然后求它们的和
2. 求和除以10的余数
3. 用10减去这个余数，得到校验码
4. 如果余数为0，则校验码为0

**示例：** 书号 `9787308189774` 的验证过程
```
9  7  8  7  3  0  8  1  8  9  7  7  4
1  3  1  3  1  3  1  3  1  3  1  3
-----------------------------------------
9 21  8 21  3  0  8  3  8 27  7 21 = 136
136 % 10 = 6
10 - 6 = 4  ✓
```

## 5. 字典

### 5.1 概念 

字典是一个用来 **存储键值对**的数据结构

- **条目**：一个键和它所对应的数据形成字典中的一个 **条目**。

- **映射**：这种通过名称来访问其各个值来得到数据结构称为映射
- 用`{}`表示，每个元素用冒号分隔 **键**和**数据(值)**

![字典举例](/my-blog/2026/04/11/Python/Chapter4/image-16.png)

- **字典的键**：必须是**不可变对象**，如数字、字符串、元组(元组内的数据也应该是不可变对象)

<aside class="admonition warning">
键一定是不可重复的 
</aside>
- **字典的值**：任意类型

> JSON格式：一种与编程语言无关的数据交换格式，结构与字典很相似

### 5.2 创建字典

|方法|示例|适用场景|
|-|-|-|
|`{}`|`d={}`|创建空字典|
|显式键值对|`s = {'name':'Alice','age':30}`|需要**复杂键或非字符串键**时|
|关键字参数|`s = dict(name='Alice',age = 30)`|键是**简单字符串**且**符合标识符规则**|
|`zip()`组合|`dict(zip(keys,values))`|从两个列表构建键值对|

<aside class="admonition warning">
**关键字参数不能用于键是整数的情况**

```python
s = dict(name='Alice',age = 30) # ok
s = dict(name='Alice',1 = 30) # error
```
</aside>
如何实现该字典的构建？

![键值对](/my-blog/2026/04/11/Python/Chapter4/image-17.png)

### 5.3 访问字典数据

```python
response = {
  "id": "qwen-chat-98765",
  "model": "qwen-turbo",
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 100
  }
}
```

![代码的示意图](/my-blog/2026/04/11/Python/Chapter4/image-18.png)

#### 1. `[]`运算符

- 获取模型名称：`response["model"]`
- 获取输入token数：`response["usage"]["prompt_tokens"]`

<aside class="admonition warning">
若提供的键不存在，**会抛出`keyerror`异常**
</aside>
#### 2. `get()`方法

- 语法：`dict.get(key, default_value)`
- 获取模型名称：`response.get("model")`
- 获取输入token数：`response.get("usage").get("prompt_tokens")`

<aside class="admonition warning">
若提供的键不存在，返回 **None**(或指定的`default_value`)
</aside>
!!! note "提取API返回数据"
```python
response = {
    'id': 'chatcmpl-8xyZ123',
    'object': 'chat.completion',
    'choices': [
        {
            'index': 0,
            'message': {
                'role': 'assistant',
                'content': 'python 中列表是可变的，而元组是不可变的。'
            },
            'finish_reason': 'stop'
        }
    ],
    'usage': {
        'prompt_tokens': 12,
        'completion_tokens': 15,
        'total_tokens': 27
    }
}
```

**response结构**

```
response
├── id
├── object
├── choices
│   └── [0]
│       ├── index
│       ├── message
│       │   ├── role
│       │   └── content
│       └── finish_reason
└── usage
    ├── prompt_tokens
    ├── completion_tokens
    └── total_tokens
```

**任务**

| 任务            | 代码                                                  |
| --------------- | ----------------------------------------------------- |
| 获取 AI 回复    | `print(response['choices'][0]['message']['content'])` |
| 获取总 token 数 | `print(response['usage']['total_tokens'])`            |
| 获取角色信息    | `print(response['choices'][0]['message']['role'])`    |

> `choices`得到的是一个列表
</aside>
<aside class="admonition warning">
`get()`方法是字典的成员方法，**不是Python全局内置函数**
</aside>
### 5.4 修改与更新

字典属于**可变容器**，所以可以**修改或增加键值对**

- **语法**：字典名`[key]` = 新值
  - 如果键已存在，则更新其值
  - 如果键已不存在，则添加这个新的键值对
- `update()`
  - **修改存在的键对应的值**
  - **添加新的**键/值对到字典中

> 存在多处可以更新的时候更适合使用`update()`

1. `student['age']=21`:把student中键位`age`的数据修改为21
2. `student['grade']='B'`：在student中添加新的键值对
3. `student.update({'id':'0001','grade':'A'})`


![修改与更新键值对](/my-blog/2026/04/11/Python/Chapter4/image-20.png)

### 5.5 删除数据

- `pop()`方法：删除指定键及对应的值，并返回值
  - 语法：`dict.pop(key, default_value)`

> 如果不设置`default_value`,那么指定键不存在，就会抛出`KeyError`异常。若设置后，则会返回`default_value`

- 用`del`语句：直接**删除键值对**
  -  删除对象本身
- `clear()`方法：清空字典所有的键值对
  - 只是清除，不会释放内存

![删除数据示意图](/my-blog/2026/04/11/Python/Chapter4/image-19.png)

```python
student.pop('grade') #返回'A'
del student['age']
student.clear()
```

### 5.6 字典的遍历

- `dict.keys()`:返回由所有 **键**组成的字典视图对象
- `sict.values()`:返回由所有值组成的字典视图对象
- `dict.items()`:返回由**所有键值对`(key, value)`**元组组成的字典视图对象可使用`for`循环进行遍历返回

```python
for key in response.keys():
  print(key)
for value in response.values():
  print(value)
for key,value in response.items():
  print(key,value,sep=": ")
```

### 5.7 字典推导式

类似于列表推导式，字典推导式提供了一种间接的方式来创建字典

- 基本语法：`{key_expression:value_expression for item in iterable [if condition]}`


<aside class="admonition example">
从列表中创建字典：

```python
names = ['Alice', 'Bob', 'Charlie'] # 键是人名，值是名字的长度
name_lengths = {name:len(name) for name in names}

# 结果：{'Alice':5, 'Bob': 3, 'Charlie': 7}
```
</aside>
!!! note "字典与JSON"
作为一种标准化的轻量级格式，在不同的编程语言和系统之间高效地序列化、传输并存储结构化的数据

- **核心本质是字符串**：通过特定的语法规则来**标识结构化数据**，便于网络传输
- **独立于编程语言**：`Python`,`Java`等语言都能轻松生成和解析`JSON`数据
- **映射自然**：`JSON`的结构与`Python`的字典和列表几乎完美对应，使得数据在不同系统间交换变得极为方便

![Python字典与JSON对比](/my-blog/2026/04/11/Python/Chapter4/image-21.png)
</aside>
## 6. 集合

### 6.1 集合概念

- 集合`set`是无序、不重复的元素集，可以看作是 **只有键、没有值的特殊字典**
- 集合的字面量也是用`{}`包裹，常用于**去重和逻辑运算**(**交并补**)

![列表与集合对比](/my-blog/2026/04/11/Python/Chapter4/image-22.png)

<aside class="admonition warning">
集合中的元素必须是可哈希的 **不可变类型**

集合`set`的底层是用 **哈希表**实现的，集合要快速判断一个元素在不在里面，，Python会先根据`x`计算一个哈希值，再根据这个哈希值快速定位它的位置

所以集合元素必须满足一个要求：**放进去之后，它的哈希值不能随便改变**
</aside>
### 6.2 创建集合

- 直接给变量赋值给一个集合字面量
  - `fruit={'apple','orange','pear','banana'}`
- 使用`set()`创建一个空集合
  - `emp=set()`
> `emp={}`创建一个空字典
- 使用`set()`将列表或元组转换成集合
  - `prime=set([10, 3, 5, 7, 11])`
  - 结果是：`{10, 3, 5, 7, 11}`

<aside class="admonition warning">
转换集合的时候，会 **消除重复的值**

```python
fruit={'apple', 'orange', 'apple', 'pear', 'orange'}
```

结果是：`{'orange', 'pear', 'apple'}`
</aside>
### 6.3 操作集合元素

- 查询元素：使用`in`或`not in`关键字判断元素是否存在于集合中，效率极高
- 遍历元素：通过`for`循环可以遍历集合中**所有元素**，但是**顺序是不确定的**
- 增加元素
  - `add()`:添加单个元素
  - `update()`:以**可迭代对象**形式添加多个元素
- 删除元素
  - `discard()`:如果存在删除，**不存在无效果**
  - `remove()`:如果存在删除，不存在**抛出异常**
  - `pop()`:如果存在删除**任意一个元素并返回**，不存在会**抛出异常**
  - `clear()`:删除所有元素，剩下一个空集合

```python
s = {10, 20, 30, 40}

for x in s:
    print(x) # 输出顺序是不确定的

s.add(50)
s.update([60,70]) # 添加多个元素s = {10,20,30,40,50,60,70}
s = set()
s.update("abc") # s = {'a', 'b', 'c'}
s.discard(10) # ok
s.discard(80) # ok
s.remove(10) # ok
s.remove(80) # 抛出异常
s.pop() # 删除任意一个元素并返回
s.clear() # 删除所有元素，剩下一个空集合
```

### 6.4 集合的关系运算

如果集合`s1`中的元素，都在集合`s2`中，则称`s1`为`s2`的子集，`s2`则为`s1`的超集

**使用方法进行判断**

```python
s1 = {2,3,9,4}
s2 = {1,2,4,3,9,8}
s1.issubset(s2) # True
s1.issuperset(s1) # True
```

![集合关系示例](/my-blog/2026/04/11/Python/Chapter4/image-23.png)

**使用关系运算符**

- 如果s1是s2的真子集，则`s1<s2`是True
- 如果s1是s2的子集，则`s1<=s2`是True
- 如果s1是s2的真超集，则`s1>s2`是True
- 如果s1是s2的超集，则`s1>=s2`是True
- 如果s1和s2元素相同，则`s1==s2`是True
- 如果s1和s2元素不同，则`s1!=s2`是True

### 6.5 核心集合运算

通过集合的函数或运算符进行集合的 **并集、交集、差集**和对称差的集合运算

> 假设2个集合：`s1={3,5,7,11},s2={3,4,5,6,7}`

![核心集合运算](/my-blog/2026/04/11/Python/Chapter4/image-24.png)

```python
s1 = (1,2,3)
s2 = [4,5,6]

s1 | s2 # error
s1.union(s2) # {1,2,3,4,5,6}
```

!!! example "集合运算案例"
一家科技公司有两个主要项目组

1. **A组**(`project alpha`):负责核心技术研发，员工技术要求高
2. **B组**(`project beta`):负责产品迭代和市场部署，员工具备跨职能能力

```python
A_Group = {"E001","E002","E003","E005"}
B_Group = {"E001", "E003", "E004", "E006", "E008"}
```

输出该公司有多少员工以及只参加一个组的员工

```python
A_Group = {"E001","E002","E003","E005"}
B_Group = {"E001", "E003", "E004", "E006", "E008"}
Total_Participation = A_Group | B_Group
print(f"所有参与者：{Total_Participation}")
print(f"总参与人数：{len(Total_Participation)}")
Single_Project_Employees = A_Group ^ B_Group
print(f"仅参加一组：{Single_Project_Employees}")
```
</aside>
!!! note "各容器类型性能比较"
![各容器类型性能比较](/my-blog/2026/04/11/Python/Chapter4/image-25.png)
</aside>
### 6.6 字典的排序操作

使用内置的`sorted()`函数

参数`key`:接受一个函数(通常用`lambda`表达式表示)，告诉`Python`按照什么规则来比较大小

- 将键排序输出
- 将值排序输出
- 按键排序输出全部信息
- 按值排序输出全部信息

```python
my_dict = {'z':3, 'b':1, 'a':2, 'c': 4}
s_items_by_key = sorted(my_dict.keys()) # 按照值排序
s_items_by_item = sorted(my_dict.items()) # 按照键排序
s_items_by_key = sorted(my_dict.items(), key=lambda item: item[0]) # 默认按照元组的第0项排序，所以也可以省略不写
s_items_by_value = sorted(my_dict.items(), key=lambda item: item[1])
```

- `sorted()`函数：这是`Python`的内置函数，用于对**可迭代对象**(如列表、字典的键值对等)进行排序。它**不会修改原数据**，而是**返回一个新的列表**

<aside class="admonition warning">
`sorted()`不只可以排列表，元组、字符串、字典、集合全部都能排序，排序结果**统一返回列表**
</aside>
- `dict.items()`方法：字典本身是无序的(`Python 3.7`保持插入顺序)，如果你想对**字典的内容进行排序**，通常需要先调用`.items()`方法。这会将字典转换成一个由(键，值)元组组成的列表
- `key`参数：这是`sorted()`函数的灵魂。它接受一个函数(通常用`lambda`表达式表示)，告诉`Python`按照什么规则来比较大小

### 6.7 字典的合并

- 合并字典1，字典2：`{**字典1，**字典2}`
- `**`:字典的拆包操作，取字典的所有条目

下面语句合并字典`name1`和`name2`

![合并例子](/my-blog/2026/04/11/Python/Chapter4/image-26.png)


<aside class="admonition example">
要求：合并一下多项式，输入`x`，计算多项式的值

$$
y_1 = 5x^5 + 6x^3 - 10x - 2
$$
$$
y_2 = 7x^5 + 3x^4 -8x^2 + 10
$$

```python
poly1 = {5:5, 3:6, 1:-10, 0:2}
poly2 = {5:7, 4:3, 2:-8, 0:10}
poly3 = {} # 两个多项式的和字典
deg = set(poly1) | set(poly2) # 多项式可能的指数集合
for i in deg: # 遍历指数
  coeff=poly1.get(i,0) + poly2.get(i,0)

  if coeff != 0:
    poly3[i] = coeff
```

> get(i, 0)表示：如果字典中有指数`i`，就取对应系数；如果没有，就当做系数是`0`
</aside>
## 题目练习

### 集合运算

求指定区间内能被 3、5 和 7 整除的数的个数

**输入格式**：

在一行中从键盘输入 2 个正整数 `a, b`（`1 <= a < b <= 10000000`），用空格隔开。

**输出格式**：

在一行输出大于等于 `a` 且小于等于 `b` 的能被 `3`、`5` 和 `7` 整除的数的个数。

**输入样例 1**：

在这里给出一组输入。例如：

```text
10 100
```

**输出样例 1**

```
0
```

```python
s1 = {x for x in range(a, b+1) if x % 3 == 0}
s2 = {x for x in range(a, b+1) if x % 5 ==0}
s3 = {x for x in range(a, b+1) if x % 7 ==0}
res = s1 & s2 & s3
print(len(res))
```

### 字典：实现分支结构

编写一个程序，输入数字，输出对应的星期几英文

**输入样例**

```
1
```

**输出样例**

```
Mon
```

```python
days = {
  1:"Mon",
  2:"Tue",
  3:"Wed",
  4:"Thu",
  5:"Fri",
  6:"Sat",
  7:"Sun"
  }
num = int(input())
print(days[num])
```

国内普通快递费用一般按寄件目的地、寄件重量、是否加急等多种因素计费。

某快递计费规则为：

- 同城：首重 `1KG` 内 `10` 元，续重 `2` 元/KG，加急 `5` 元；
- 省内：首重 `1KG` 内 `12` 元，续重 `3` 元/KG，加急 `6` 元；
- 省外：首重 `1KG` 内 `20` 元，续重 `5` 元/KG，加急 `10` 元。

**输入格式**：

输入一行，分别表示同城（`TC`）、省内（`SN`）、省外（`SW`），寄件重量（单位 `KG`），是否加急（`Y` 表示加急，`N` 表示不加急）。

**输出格式**：

输出寄件费用。

**输入样例**：

在这里给出一组输入。例如：

```text
SN 1.5 Y
```

```python
import math
data = input().split()
w = math.ceil(float(data[1])) # 向上取整
rate = {
  'TC':[10, 2, {'Y':5, 'N': 0}],
  'SN':[12, 3, {'Y':6, 'N': 0}],
  'SW':[20, 5, {'Y':10, 'N': 0}]
} # 构建费率字典 目的地:[首重价格，续重价格，加急费用字典]
cost = rate[data[0]][0] + rate[data[0]][1] * (w-1) + rate[data[0]][2][data[2]]
print(f"cost = {cost:.0f}RMB")
```

### 尝试编写程序实现四则运算’

- 分行输入运算对象和运算符
- 输出运算结果(考虑除数为0的问题)

```python
num1 = float(input())
op = input()
num2 = float(input())

result_menu = {
  '+': num1 + num2,
  '-': num1 - num2,
  '*': num1 * num2,
  '/': num1 / num2 if num2 != 0 else "除数不能为0"
}

if op in result_menu:
  result = result_menu[op]
else:
  result = "输入运算符有误"
```

### 编写一个程序，输入一行字符，求每个字符出现的次数

```python
s = input()
d = {}
for i in s:
    d[i] = d.get(i, 0) + 1
# item是(字符,次数)，拆成k,v
for k, v in sorted(d.items(), key=lambda x: x[1], reverse=True):
    print(f"{k} : {v}")
```
