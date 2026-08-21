---
title: 第六章 文件概述
date: '2026-06-12 10:40:00'
categories:
  - CS课程笔记
  - Python
  - 课程笔记
tags:
  - Python
  - 文件
cover: >-
  https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgFnjkHPu6S3XkALLfI3JgtiLDIrtDbHvxEpkgSw2BVLnNB4I9Y3ZeeQqMUewro4UyiLeRGQAJ45gbvOsxIx7bDFMmbd_UPPn6WYsjlgZLcTHPiWtnd7DspsgKxPA6JWWUe9YVjOJZTROZZ/s1600/python-programming.jpg
description: >-
  下面是一份可直接复制到 Markdown 笔记里的版本，我按“PPT 内容 + 浙大 Python
  期末常考题型”的角度整理，重点放在：概念辨析、open() 模式、路径、读写方法、with、seek/tell、文本处理综合题。 Python
  文件操作核心知识点整理 1. 文件的基本概念 文件是存储在持久化存储介质上的
published: true
legacyPath: 2026/06/12/Python/Chapter6
sourcePath: Python/Chapter6.md
---

下面是一份可直接复制到 Markdown 笔记里的版本，我按“PPT 内容 + 浙大 Python 期末常考题型”的角度整理，重点放在：概念辨析、open() 模式、路径、读写方法、with、seek/tell、文本处理综合题。

# Python 文件操作核心知识点整理
## 1. 文件的基本概念
文件是存储在持久化存储介质上的有序数据集合。
文件操作的主要目的：
- 数据持久化存储
- 数据交换
- 数据共享
Python 通过“文件对象”来操作文件。可以把文件理解为一个数据流，程序通过文件对象从文件中读取数据，或向文件中写入数据。
---
## 2. 文件类型
从逻辑上，文件主要分为两类：
### 2.1 文本文件
文本文件主要存储人类可读的字符数据。
常见编码包括：
- ASCII
- UTF-8
- GBK
常见文本文件：
- `.txt`
- `.csv`
- `.html`
- `.py`
Python 源代码文件 `.py` 本质上也是文本文件。
### 2.2 二进制文件

二进制文件存储的是任意格式的原始字节数据，不一定能被文本编辑器正常解释。

常见二进制文件：
- `.jpg`
- `.mp3`
- `.mp4`
- `.exe`
- `.zip`
- `.dat`
- `.docx`
- `.xlsx`

<aside class="admonition warning">
Word 文件、Excel 文件虽然打开后看起来是文字或表格，但它们本质上是具有复杂内部结构的二进制文件，通常需要专门的库处理。
例如：
- Word：`python-docx`
- Excel：`openpyxl`、`pandas`
- 图片：`Pillow`
<aside class="admonition ---">
## 3. 文件操作的基本流程

文件操作一般遵循三步：

```python
打开文件 -> 读写文件 -> 关闭文件
```

对应步骤：

1. 打开文件：建立程序和文件之间的连接，创建文件对象。
2. 读写文件：通过文件对象的方法读取或写入数据。
3. 关闭文件：断开连接，释放系统资源。

---

## 4. open() 函数

Python 使用内置函数 `open()` 打开文件。

基本格式：

```python
fp = open(filename, mode, encoding=None)
```

常用参数：

* filename：文件名或文件路径
* mode：打开模式
* encoding：文本文件编码方式

示例：

```python
f = open("data.txt", "r", encoding="utf-8")
```

说明：

* open() 成功后返回一个**文件对象**。
* 后续读写操作**都**通过这个文件对象完成。
* 文本文件建议显式指定 encoding="utf-8"，**避免乱码或跨平台问题**。

---

## 5. 文件打开模式

### 5.1 基本模式

|模式|含义|
|---|---|
|'r'|只读模式，文件不存在会报错，默认模式|
|'w'|覆盖写模式，文件不存在则创建，存在则清空原内容|
|'x'|创建写模式，文件不存在则创建，存在则报错|
|'a'|追加写模式，文件不存在则创建，存在则在末尾追加|
|'b'|二进制模式|
|'t'|文本模式，**默认模式**|
|'+'|读写模式，与 r/w/x/a 组合使用|

---

### 5.2 常考模式辨析

#### 1. 'r'

- 只读模式。

```python
f = open("a.txt", "r")
```

特点：

* 文件**必须存在**
* 不允许写入
* 文件不存在会抛出 `FileNotFoundError`

---

#### 2. 'w'

- 覆盖写模式。

```python
f = open("a.txt", "w")
```

特点：

* 文件不存在：创建新文件
* 文件存在：**清空原文件内容**
* 常考陷阱：w 会覆盖原内容

---

#### 3. 'a'

- 追加写模式。

```python
f = open("a.txt", "a")
```

特点：

* 文件不存在：创建新文件
* 文件存在：在**文件末尾追加内容**
* 不会清空原文件

---

#### 4. 'x'

- 独占创建模式。

```python
f = open("a.txt", "x")
```

特点：

* 文件不存在：创建文件
* 文件存在：抛出 FileExistsError

---

#### 5. 'b'

- 二进制模式。

```python
f = open("image.jpg", "rb")
```

- 常见组合：


|模式|含义|
|---|---|
|'rb'|以二进制方式读取|
|'wb'|以二进制方式写入|
|'ab'|以二进制方式追加|

> 二进制模式读写的是 `bytes`，不是字符串。

---

#### 6. '+'

- 读写模式，需要**和其他模式组合**

- 常见组合：

|模式|含义|
|'r+'|读写，文件**必须存在**|
|'w+'|读写，文件**不存在则创建**，**存在则清空**|
|'a+'|读写，写入时**追加到末尾**|

常考陷阱：

* w+ 会**清空文件**。
* a+ 写入总是**在文件末尾**。
* r+ 文件**必须已经存在**。

---

## 6. 文件路径

### 6.1 绝对路径

绝对路径是从根目录开始的完整路径。

!!! example "Windows 示例"：

```python
f = open(r"d:\python\test.txt", "r")
```

或者：

```python
f = open("d:\\python\\test.txt", "r")
```

或者：

```python       
f = open("d:/python/test.txt", "r")
```

错误写法：

```python
f = open("d:\python\test.txt", "r")
```

**原因**：

`\` 在 `Python` 字符串中有转义含义，例如 `\t` 表示制表符，`\n` 表示换行符。

**解决方法**：

1. 使用原始字符串：`r"d:\python\test.txt"`

2. 使用双反斜杠：`"d:\\python\\test.txt"`

3. 使用正斜杠：`"d:/python/test.txt"`

---

### 6.2 相对路径

相对路径是相对于**当前工作目录的路径**。

!!! example "打开当前目录下的 test.txt"
```python
f = open("test.txt", "r")
```
</aside>
## 7. 文件关闭

文件使用完后**必须关闭**。

**原因**：

* 防止数据丢失或损坏
* 防止资源泄漏
* 避免文件被锁定，影响其他程序访问


### 7.1 使用 close()

```python
f = open("data.txt", "r", encoding="utf-8")
content = f.read()
f.close()
```

**缺点**：如果读写过程中出现异常，`close()` 可能无法执行。

### 7.2 使用 with open

推荐写法：

```python
with open("data.txt", "r", encoding="utf-8") as f:
    content = f.read()
```

- **简洁**：代码更简洁，不需要显式编写`close()`
- **安全**：保证文件总是会被关闭，即使在`with`块中发生异常，也能避免资源泄露和数据丢失的风险

## 8. 文件读取操作

Python 常用的文件读取方法有三种：

|方法|含义|
|---|---|
|`file.read()`|读取**整个文件内容**，如果给出参数，读入前`size`长度的字符串或字节流。适合小文件，大文件会消耗大量内存|
|`file.readline()`|读取**一行**，如果给出参数，读入该行前`size`长度的字符串或字节流。适用于逐行读取文件，但需**手动控制循环**|
|`file.readlines()`|读取**所有行**，**返回列表**(以每行为元素形成的列表)|

- 迭代文件对象：读取文本文件内容最常用和内存效率最高的方法，尤其适用于**处理大文件**

### 8.1 read()

- 返回值类型：`str`

```python
with open("data.txt", "r", encoding="utf-8") as f:
    s = f.read()
```

特点：

* 一次性读入整个文件
* 返回字符串
* 适合小文件
* 大文件可能占用大量内存

也可以指定读取长度：

```python
s = f.read(10)
```

表示读取前 10 个字符。

### 8.2 readline()

- 返回类型：`str`

``` python
with open("data.txt", "r", encoding="utf-8") as f:
    line = f.readline()
```

特点：

* 一次读取一行
* 返回字符串
* 通常包含行尾换行符 \n
* 读到文件末尾时返回空字符串 ""

常见循环写法：

```python
with open("data.txt", "r", encoding="utf-8") as f:
    while True:
        line = f.readline()
        if line == "":
            break
        print(line, end="")
```

### 8.3 readlines()

- 返回类型：`list`

```python
with open("data.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()
```

特点：

* 一次性读取所有行
* 返回列表
* 列表中每个元素是一行字符串
* 每行通常保留换行符 \n

示例：

```
["hello\n", "world\n"]
```

### 8.4 迭代文件对象

文件对象本身是**可迭代**的。

推荐读取大文件的方式：

with open("data.txt", "r", encoding="utf-8") as f:
    for line in f:
        print(line.strip())

特点：

* 每次读取一行
* 内存效率高
* 适合处理大文件
* 常用于逐行统计、逐行处理

## 9. 文件写入操作

- 常用写入方法：

|方法|含义|
|---|---|
|`file.write(s)`|写入一个字符串或字节流|
|`file.writelines(lines)`|写入一个字符串可迭代对象(如：列表)|

- 返回值是：成功写入的字符数或字节数

### 9.1 write()

```python
with open("out.txt", "w", encoding="utf-8") as f:
    f.write("hello\n")
```

<aside class="admonition warning">
`write()` 不会自动添加换行符，需要手动写 `\n`。
</aside>
### 9.2 writelines()

```python
lines = ["hello\n", "world\n"]
with open("out.txt", "w", encoding="utf-8") as f:
    f.writelines(lines)
```

<aside class="admonition warning">
`writelines()` 也不会自动添加换行符。

如果列表中没有 `\n`：

```
["hello", "world"]
```

写入结果会变成：
```
helloworld
```

## 10.  常见文件操作题型

### 10.1 文件复制

**题型描述**：

给定一个文件，将其内容完整复制到另一个文件中。

**示例**：

```python
source = open("cj.txt", "r", encoding="utf-8")
back = open("cjback.txt", "w", encoding="utf-8")
s = source.read()
back.write(s)
source.close()
back.close()
```

推荐写法：

```python
with open("cj.txt", "r", encoding="utf-8") as source:
    with open("cjback.txt", "w", encoding="utf-8") as back:
        back.write(source.read())
```

如果是二进制文件复制：

```python
with open("a.jpg", "rb") as fin:
    with open("b.jpg", "wb") as fout:
        fout.write(fin.read())
```

常考点：

* 文本文件可用 "r" 和 "w"。
* 二进制文件必须用 "rb" 和 "wb"。
* `read()` 适合小文件整体复制。
* 大文件可逐块读取。

### 10.2 文件逐行复制

```python
with open("in.txt", "r", encoding="utf-8") as fin:
    with open("out.txt", "w", encoding="utf-8") as fout:
        for line in fin:
            fout.write(line)
```

特点：

* 适合大文件
* 不需要一次性读入内存

### 10.3 文件交替合并

**题型描述**：

有两个文本文件 `file1.txt` 和 `file2.txt`，要求把两者内容交替合并到 `file.txt` 中。

即：

file1 第一行
file2 第一行
file1 第二行
file2 第二行
...

如果某个文件行数更多，则把剩余内容全部写入目标文件。

标准写法：

```python
with open("file1.txt", "r", encoding="utf-8") as f1, \
     open("file2.txt", "r", encoding="utf-8") as f2, \
     open("file.txt", "w", encoding="utf-8") as fout:
    while True:
        line1 = f1.readline()
        line2 = f2.readline()
        if not line1 and not line2:
            break
        if line1:
            fout.write(line1)
        if line2:
            fout.write(line2)
```

常考点：

* readline() 读到文件末尾返回 ""。
* if not line: 可以判断是否读到末尾。
* 必须考虑两个文件行数不同的情况。
* 不能简单假设两个文件行数相同。



### 10.4 成绩文件处理

**题型描述**：

文件 `score.txt` 中每一行表示一个学生成绩，由笔试、平时、实验三部分构成。

要求计算总评成绩并写入 `out_score.txt`。

总评公式：

```
总评 = 笔试 * 50% + 平时 * 25% + 实验 * 25%
```

假设每行格式为：

```
学号 姓名 专业 笔试 平时 实验
```

**示例代码**：

```python
with open("score.txt", "r", encoding="utf-8") as infile, \
     open("out_score.txt", "w", encoding="utf-8") as outfile:
    lines = infile.readlines()
    # 写入表头
    outfile.write(lines[0].strip() + " 总评成绩\n")
    for line in lines[1:]:
        data = line.split()
        written = int(data[-3])
        regular = int(data[-2])
        experiment = int(data[-1])
        total = written * 0.5 + regular * 0.25 + experiment * 0.25
        outfile.write(line.strip() + f" {total:.2f}\n")
```

**常考点**：

* 使用 `readlines()` 读入多行。
* 使用切片 `lines[1:]` 跳过表头。
* 使用 `split()` 分割一行数据。
* 使用 `int()` 或 `float()` 转换数据类型。
* 使用格式化输出控制小数位数。

**格式化输出**：

```python
f"{total:.2f}"
```

表示保留两位小数。

---

### 10.5 词频统计

**题型描述**：

读入一个英文文本文件，统计不同单词出现次数，并输出词频最高的前 10% 的单词。

要求：

* 单词由大小写字母、数字、下划线组成。
* 其他字符都视为分隔符。
* 单词不区分大小写。
* 输出格式为：

```
词频:单词
```

* 词频递减排序。
* 若词频相同，按字典序递增排序。

---

#### 10.5.1 基本步骤

1. 读入文本文件。
2. 处理文本，剔除非单词字符。
3. 全部转为小写。
4. 分割单词。
5. 统计词频。
6. 排序。
7. 取前 10%。
8. 写入结果文件。

---

#### 10.5.2 文本预处理

**方法一：逐字符替换**。

```python
with open("Potter.txt", "r", encoding="utf-8") as fin:
    strs = fin.read()
for ch in set(strs):
    if not (ch.isalnum() or ch == "_"):
        strs = strs.replace(ch, " ")
words = strs.lower().split()
```

解释：

* `isalnum()` 判断字符是否为字母或数字。
* `_` 也被认为是单词的一部分。
* 其他字符替换为空格。
* `lower()` 统一转小写。
* `split()` 按空白字符分割单词。

---

#### 10.5.3 使用正则表达式处理

更简洁写法：

```python
import re
with open("Potter.txt", "r", encoding="utf-8") as fin:
    text = fin.read()
words = re.sub(r"[^a-zA-Z0-9_]", " ", text).lower().split()
```

含义：

```
r"[^a-zA-Z0-9_]"
```

表示匹配所有不是字母、数字、下划线的字符。

---

#### 10.5.4 统计词频

**写法一**：

```python
counts = {}
for word in words:
    if word not in counts:
        counts[word] = 1
    else:
        counts[word] += 1
```

**写法二**：

```python
counts = {}
for word in words:
    counts[word] = counts.get(word, 0) + 1
```

`dict.get(key, default)` 的作用：

* 如果 key 存在，返回对应值。
* 如果 key 不存在，返回默认值。

所以：

```python
counts[word] = counts.get(word, 0) + 1
```

表示把单词出现次数加 1。

---

#### 10.5.5 排序

要求：

1. 词频递减。
2. 词频相同，单词字典序递增。

正确写法：

```python
ans = sorted(counts.items(), key=lambda x: (-x[1], x[0]))
```

解释：

* `x[0]` 是单词
* `x[1]` 是词频
* `-x[1]` 表示按词频从大到小
* `x[0]` 表示词频相同时按单词字典序从小到大

---

#### 10.5.6 常考陷阱：reverse=True

错误或不完全正确写法：

```python
ans = sorted(counts.items(), key=lambda x: (x[1], x[0]), reverse=True)
```

这个写法的结果是：

1. 词频从大到小
2. 词频相同时，单词也按字典序从大到小

但题目要求词频相同时按字典序递增，所以不符合要求。

正确写法仍然是：

```python
ans = sorted(counts.items(), key=lambda x: (-x[1], x[0]))
```

这是期末题非常容易考的点。

---

#### 10.5.7 取前 10%

```python
n = int(0.1 * len(ans))
```

然后输出前 n 个：

```python
for i in range(n):
    print(str(ans[i][1]) + ":" + ans[i][0])
```

注意：

如果单词总数较少，`int(0.1 * len(ans))` 可能为 0。

更稳妥写法：

```python
n = max(1, int(0.1 * len(ans)))
```

---

#### 10.5.8 写入文件

```python
with open("Potter_result.txt", "w", encoding="utf-8") as fout:
    for i in range(n):
        fout.write(str(ans[i][1]) + ":" + ans[i][0] + "\n")
```

注意：

* `write()` 不会自动换行。
* 必须手动添加 `"\n"`。

---

#### 10.5.9 完整词频统计代码

```python
import re
with open("Potter.txt", "r", encoding="utf-8") as fin:
    text = fin.read()
words = re.sub(r"[^a-zA-Z0-9_]", " ", text).lower().split()
counts = {}
for word in words:
    counts[word] = counts.get(word, 0) + 1
ans = sorted(counts.items(), key=lambda x: (-x[1], x[0]))
n = max(1, int(0.1 * len(ans)))
with open("Potter_result.txt", "w", encoding="utf-8") as fout:
    for i in range(n):
        fout.write(str(ans[i][1]) + ":" + ans[i][0] + "\n")
```

---

### 11. 输出 Excel 文件

如果需要把结果输出为 Excel 文件，可以使用 `pandas`。

```python
import pandas as pd
df = pd.DataFrame(ans, columns=["Word", "Quantity"])
df.to_excel("result.xlsx", index=False)
```

说明：

* `pd.DataFrame()` 用于创建表格数据。
* `columns` 指定列名。
* `to_excel()` 输出 Excel 文件。
* `index=False` 表示不输出行索引。

---

### 12. 文件操作常考易错点总结

#### 12.1 w 模式会清空原文件

```python
open("a.txt", "w")
```

如果文件存在，原内容会被清空。

---

#### 12.2 write() 和 writelines() 不会自动换行

错误理解：

```python
f.write("hello")
f.write("world")
```

输出不是两行，而是：

```
helloworld
```

正确写法：

```python
f.write("hello\n")
f.write("world\n")
```

---

#### 12.3 readlines() 返回列表

```python
lines = f.readlines()
```

返回类似：

```
["abc\n", "def\n"]
```

每一行通常保留换行符。

---

#### 12.4 迭代文件对象时，每次得到一行

```python
for line in f:
    print(line)
```

`line` 通常包含末尾的 `\n`。

如果不想输出多余空行，可以写：

```python
print(line, end="")
```

或者：

```python
print(line.strip())
```

---

#### 12.5 readline() 读到末尾返回空字符串

```python
line = f.readline()
if line == "":
    break
```

这是判断文件结束的常见方法。

---

#### 12.6 文本文件和二进制文件不能混用

文本模式读写字符串：

```python
f.write("hello")
```

二进制模式读写字节：

```python
f.write(b"hello")
```

---

#### 12.7 路径中的反斜杠问题

错误写法：

```python
open("d:\python\test.txt")
```

推荐写法：

```python
open(r"d:\python\test.txt")
```

或：

```python
open("d:/python/test.txt")
```

---

#### 12.8 使用 with open 是推荐写法

推荐：

```python
with open("a.txt", "r", encoding="utf-8") as f:
    data = f.read()
```

不推荐：

```python
f = open("a.txt", "r")
data = f.read()
f.close()
```

---

#### 12.9 排序时注意多个关键字的升降序

题目要求：

* 词频降序
* 单词升序

正确：

```python
sorted(counts.items(), key=lambda x: (-x[1], x[0]))
```

错误：

```python
sorted(counts.items(), key=lambda x: (x[1], x[0]), reverse=True)
```

因为 `reverse=True` 会让两个关键字都降序。

---

### 13. 期末常考题型归纳

**题型一：判断文件打开模式**

常问：

* 文件不存在时是否报错？
* 文件存在时是否清空？
* 是否追加？
* 是否能读写？
* 是否是二进制模式？

重点记忆：

| 模式 | 文件不存在 | 文件存在 | 是否清空 |
|------|-----------|----------|---------|
| r    | 报错      | 读取     | 否      |
| w    | 创建      | 覆盖写   | 是      |
| a    | 创建      | 追加写   | 否      |
| x    | 创建      | 报错     | 否      |

---

**题型二：文件读写结果判断**

常考代码执行结果：

```python
f = open("a.txt", "w")
f.write("abc")
f.write("def")
f.close()
```

结果：

```
abcdef
```

因为 `write()` 不自动换行。

---

**题型三：read、readline、readlines 区别**

重点：

* `read()`：返回整个字符串
* `readline()`：返回一行字符串
* `readlines()`：返回行列表

---

**题型四：逐行处理文件**

常见模板：

```python
with open("data.txt", "r", encoding="utf-8") as f:
    for line in f:
        # 处理 line
        pass
```

适合：

* 统计行数
* 查找特定内容
* 逐行计算
* 处理大文件

---

**题型五：成绩统计**

核心操作：

```python
data = line.split()
score = int(data[-1])
```

常见考点：

* 跳过表头
* 字符串转数字
* 格式化输出
* 写入新文件

---

**题型六：词频统计**

核心操作：

```python
words = text.lower().split()
counts[word] = counts.get(word, 0) + 1
ans = sorted(counts.items(), key=lambda x: (-x[1], x[0]))
```

常考点：

* 忽略大小写
* 去除标点
* 字典统计
* 排序规则
* 输出前若干项
* 写入文件

---

### 14. 文件操作代码模板

#### 14.1 读取整个文件

```python
with open("data.txt", "r", encoding="utf-8") as f:
    content = f.read()
```

---

#### 14.2 逐行读取

```python
with open("data.txt", "r", encoding="utf-8") as f:
    for line in f:
        print(line.strip())
```

---

#### 14.3 写入文件

```python
with open("out.txt", "w", encoding="utf-8") as f:
    f.write("hello\n")
```

---

#### 14.4 追加写入

```python
with open("out.txt", "a", encoding="utf-8") as f:
    f.write("new line\n")
```

---

#### 14.5 复制文本文件

```python
with open("in.txt", "r", encoding="utf-8") as fin, \
     open("out.txt", "w", encoding="utf-8") as fout:
    fout.write(fin.read())
```

---

#### 14.6 复制二进制文件

```python
with open("in.jpg", "rb") as fin, \
     open("out.jpg", "wb") as fout:
    fout.write(fin.read())
```

---

#### 14.7 统计文件行数

```python
count = 0
with open("data.txt", "r", encoding="utf-8") as f:
    for line in f:
        count += 1
print(count)
```

---

#### 14.8 统计词频

```python
counts = {}
with open("data.txt", "r", encoding="utf-8") as f:
    for line in f:
        words = line.lower().split()
        for word in words:
            counts[word] = counts.get(word, 0) + 1
```

---

### 15. 本章必须掌握的核心

本章最重要的内容可以概括为：

1. 理解文本文件和二进制文件的区别。
2. 掌握 `open()` 的常见打开模式。
3. 熟悉文件路径，尤其是 Windows 路径中的反斜杠问题。
4. 会使用 `with open` 自动关闭文件。
5. 掌握 `read()`、`readline()`、`readlines()` 的区别。
6. 掌握 `write()`、`writelines()` 的使用和换行问题。
7. 会使用文件对象迭代逐行读取。
8. 理解 `seek()` 和 `tell()` 的作用。
9. 会完成文件复制、文件合并、成绩统计、词频统计等综合程序。
10. 掌握字典统计和排序规则，尤其是 `sorted(..., key=lambda x: (-x[1], x[0]))`。

---

### 16. 考前速记版

```python
# 读文件
with open("a.txt", "r", encoding="utf-8") as f:
    data = f.read()
# 写文件
with open("a.txt", "w", encoding="utf-8") as f:
    f.write("hello\n")
# 逐行读
with open("a.txt", "r", encoding="utf-8") as f:
    for line in f:
        print(line.strip())
# 词频统计
counts = {}
for word in words:
    counts[word] = counts.get(word, 0) + 1
# 词频降序，单词升序
ans = sorted(counts.items(), key=lambda x: (-x[1], x[0]))
# 写入结果
with open("result.txt", "w", encoding="utf-8") as f:
    for word, count in ans:
        f.write(f"{count}:{word}\n")
```
