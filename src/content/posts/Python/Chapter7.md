---
title: 第七章 面向对象编程
date: '2026-06-14 16:30:00'
categories:
  - CS课程笔记
  - Python
  - 课程笔记
tags:
  - Python
  - 面向对象
cover: >-
  https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgFnjkHPu6S3XkALLfI3JgtiLDIrtDbHvxEpkgSw2BVLnNB4I9Y3ZeeQqMUewro4UyiLeRGQAJ45gbvOsxIx7bDFMmbd_UPPn6WYsjlgZLcTHPiWtnd7DspsgKxPA6JWWUe9YVjOJZTROZZ/s1600/python-programming.jpg
description: >-
  1. 编程范式 编写程序的基本风格或模式，决定了如何组织和构建代码。 范式 核心思想 类比 ------ --------- ------ 面向过程
  程序是一系列顺序执行的指令，逐步告诉计算机做什么 流程图 面向对象 程序被组织成一组相互作用的"对象"，每个对象有自己的数据和行为 关联图 --- 2.
  面向对象编程（O
published: true
legacyPath: 2026/06/14/Python/Chapter7
sourcePath: Python/Chapter7.md
---

## 1. 编程范式

编写程序的基本风格或模式，决定了如何组织和构建代码。

| 范式 | 核心思想 | 类比 |
|------|---------|------|
| 面向过程 | 程序是一系列顺序执行的指令，逐步告诉计算机做什么 | 流程图 |
| 面向对象 | 程序被组织成一组相互作用的"对象"，每个对象有自己的数据和行为 | 关联图 |

---

## 2. 面向对象编程（OOP）基本概念

**OOP 核心思想**：程序代码通过"对象"来模拟现实世界或抽象概念的实体和事物。

**三大特点**：
- 以"对象"为核心组织代码
- 每个对象包含**数据**（属性）和**操作数据的方法**（行为），二者封装为独立逻辑单元
- 更好的代码组织、代码重用、可维护性和灵活性

**Python 中的对象**：一切皆为对象 — 基本数据、数据结构、函数、类、异常等都被视为对象。

---

## 3. 类与对象

### 3.1 核心概念

| 概念 | 含义 |
|------|------|
| **类（Class）** | 描述具有相同特征和行为的对象的**模板/蓝图** |
| **对象（Object）** | 根据类创建出来的**具体实例** |
| **属性（Attribute）** | 描写对象静态特性的数据元素 |
| **方法（Method）** | 描写对象动态特性（行为）的一组操作 |
| **实例化（Instantiation）** | 在类定义的基础上构造具体对象的过程 |

### 3.2 类的定义

Python 使用 `class` 关键字定义类：

```python
class ClassName:
    # 构造函数
    def __init__(self, param1, param2):
        self.param1 = param1
        self.param2 = param2

    # 对象方法
    def method_name(self):
        # 操作
        pass
```

---

## 4. 构造函数 `__init__`

- 当创建类的对象（实例化）时，`__init__` 被**自动调用**
- 用于**初始化对象的属性**
- 第一个参数**必须是 `self`**，用于引用当前创建的对象

```python
class Circle:
    def __init__(self, radius):
        self.radius = radius  # 对象属性
```

---

## 5. 对象方法与 `self`

- 对象方法是实例可以执行的操作，本质上是定义在类中的函数
- 定义时第一个参数**必须是 `self`**
- 调用时**无需显式传递** `self` 参数
- 访问或修改对象属性需要以 `self` 为前缀

```python
class Circle:
    def __init__(self, radius):
        self.radius = radius

    def calculate_area(self):
        return 3.14159 * self.radius ** 2

    def calculate_perimeter(self):
        return 2 * 3.14159 * self.radius

# 实例化
circle1 = Circle(5)
# 调用方法（不需要传 self）
print(circle1.calculate_area())  # 78.53975
```

---

## 6. 实例化与属性访问

```python
# 实例化：创建对象
circle1 = Circle(5)                # 创建半径为 5 的圆

# 类型检查
isinstance(circle1, Circle)        # True

# 访问属性
print(circle1.radius)              # 5

# 修改属性
circle1.radius = 10                # 修改半径为 10

# 调用方法
print(circle1.calculate_area())    # 使用新的半径计算面积
```

---

## 7. 类属性、类方法与静态方法

### 7.1 类属性

- 定义在类内部但不在任何方法中
- 所有实例**共享**
- 通过**类名或对象名**访问
- 适用场景：全局配置、计数器、常量管理

```python
class Car:
    wheels = 4          # 类属性（所有车都是4个轮子）

    def __init__(self, color):
        self.color = color  # 实例属性
```

### 7.2 类方法（`@classmethod`）

- 与类本身关联，不与特定实例关联
- 用 `@classmethod` 装饰器定义
- 第一个参数强制使用 `cls`，表示类本身
- 通常通过**类名**调用

```python
class Car:
    total = 0

    @classmethod
    def get_total(cls):
        return cls.total
```

### 7.3 静态方法（`@staticmethod`）

- 在类中定义，但**不与类或实例关联**
- 用 `@staticmethod` 装饰器定义
- **不接收** `self` 或 `cls` 作为第一个参数
- 不能直接访问实例属性或类属性
- 适用场景：工具函数

```python
class MathUtils:
    @staticmethod
    def add(a, b):
        return a + b
```

### 7.4 三类方法对比

| 类型 | 装饰器 | 第一个参数 | 访问实例属性 | 访问类属性 |
|------|--------|-----------|-------------|-----------|
| 实例方法 | 无 | `self` | ✅ | ✅ |
| 类方法 | `@classmethod` | `cls` | ❌ | ✅ |
| 静态方法 | `@staticmethod` | 无 | ❌ | ❌（需通过类名） |

---

## 8. `pass` 语句

`pass` 是空语句，用于"占位"。当暂时没有确定实现内容时使用。

```python
class A:
    pass          # 占位，后续再实现

def demo():
    pass          # 占位

if 5 > 3:
    pass          # 占位
```

---

## 9. 封装与名字空间

### 9.1 核心概念

封装是将数据（属性）和操作数据的方法绑定在一起，并控制外部访问。

### 9.2 类名字空间 vs 实例名字空间

| 特点 | 类名字空间 | 实例名字空间 |
|------|-----------|-------------|
| 存储内容 | 类变量、类方法、静态方法 | 实例变量 |
| 作用范围 | 类级别，所有实例共享 | 实例级别，每个实例独有 |
| 创建时机 | 类定义时 | 实例化时 |
| 修改影响 | 修改类变量影响所有实例 | 修改实例变量只影响该实例 |
| 名字冲突 | 可被实例同名属性遮蔽 | 优先于类名字空间中的同名项 |

```python
class Car:
    price = 100000           # 类名字空间

    def __init__(self, color):
        self.color = color   # 实例名字空间

car1 = Car("red")
print(car1.color)            # "red"（实例属性）
print(Car.price)             # 100000（类属性）
```

---

## 10. 继承

从一个通用类（**父类**）扩展出更特定的类（**子类**），实现代码重用。

```python
class Car:
    def __init__(self, brand):
        self.brand = brand

    def run(self):
        print("汽车在行驶")

# ECar 继承自 Car
class ECar(Car):
    def __init__(self, brand, battery):
        super().__init__(brand)    # 调用父类构造函数
        self.battery = battery

    def charge(self):
        print("正在充电")
```

### `super()` 函数

- 用于调用父类的方法
- 当子类需要扩展或修改从父类继承来的方法时使用
- 最常见的用法：`super().__init__()` 调用父类构造函数

```python
class MyList(list):
    def __init__(self, *args):
        super().__init__(*args)

    def random_choice(self):
        import random
        return random.choice(self)
```

---

## 11. 多态

多态指同一操作作用于不同对象时，能产生不同的行为。

### 11.1 鸭子类型（Duck Typing）

"如果一只动物走起来像鸭子，叫起来像鸭子，那么它就是鸭子。" —— 只关心对象是否有某个方法，不关心对象的具体类型。

```python
class Dog:
    def speak(self):
        return "Woof!"

class Cat:
    def speak(self):
        return "Meow!"

# 多态体现：同一个函数，不同对象不同行为
def animal_speak(animal):
    print(animal.speak())

Tom = Dog()
Alice = Cat()
animal_speak(Tom)    # 输出: Woof!
animal_speak(Alice)  # 输出: Meow!
```

### 11.2 多态的实现方式

| 方式 | 依赖关系 | 灵活性 | 典型场景 |
|------|---------|--------|---------|
| 继承 + 方法重写 | 强（继承） | 低 | 明确的类层级结构 |
| 鸭子类型 | 无（方法存在性） | 高 | 插件系统、协议实现 |
| 运算符重载 | 魔法方法 | 中 | 数学计算、容器类 |
| 抽象基类（ABC） | 显式接口 | 中 | 框架设计、强制约束 |

### 11.3 运算符重载示例

```python
print(12 + 6)       # 18
print('12' + '6')   # '126' — 同一个 +，不同类型不同行为
```

---

## 12. 命名约定与编码风格

Python 通过命名约定表明变量或方法的访问级别：

| 命名方式 | 含义 |
|---------|------|
| `name` | 公共变量/方法，可被外部自由访问 |
| `_name` | "受保护的"，约定不应被外部直接访问（不影响实际访问） |
| `__name` | 名称改写为 `_ClassName__name`，避免子类意外覆盖 |
| `__name__` | 系统定义的特殊成员，**不要**自己创建这种标识符 |

---

## 13. 代码示例合集

### 13.1 学生类

```python
class Student:
    def __init__(self, name, stu_id, major, score):
        self.name = name
        self.stu_id = stu_id
        self.major = major
        self.score = score

    def show_info(self):
        print(f"姓名: {self.name}, 学号: {self.stu_id}")

s1 = Student("张三", "2024001", "计算机", 85)
s2 = Student("李四", "2024002", "数学", 90)
```

### 13.2 BMI 计算类

```python
class BMI:
    def __init__(self, name, age, weight, height):
        self.name = name
        self.age = age
        self.weight = weight
        self.height = height

    def calculate_bmi(self):
        return self.weight / (self.height ** 2)

    def get_category(self):
        bmi = self.calculate_bmi()
        if bmi < 18.5:
            return "偏瘦"
        elif bmi < 24:
            return "正常"
        elif bmi < 28:
            return "偏胖"
        else:
            return "肥胖"

    def __str__(self):
        return f"{self.name} 的 BMI 为 {self.calculate_bmi():.2f}，属于{self.get_category()}"
```

### 13.3 计数器类

```python
class Counter:
    def __init__(self):
        self.count = 0

    def press(self):
        self.count += 1

    def reset(self):
        self.count = 0

    def get_count(self):
        return self.count
```

### 13.4 Shape 继承体系

```python
import math

class Shape:
    def area(self):
        pass

    def perimeter(self):
        pass

class Circle(Shape):
    def __init__(self, radius):
        self.radius = radius

    def area(self):
        return math.pi * self.radius ** 2

    def perimeter(self):
        return 2 * math.pi * self.radius

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height

    def area(self):
        return self.width * self.height

    def perimeter(self):
        return 2 * (self.width + self.height)
```

---

## 14. 本章核心速记

```python
# 定义类
class MyClass:
    class_var = 0                    # 类属性（所有实例共享）

    def __init__(self, name):        # 构造函数，自动调用
        self.name = name             # 实例属性

    def method(self):                # 实例方法（self 必须）
        return self.name

    @classmethod
    def cls_method(cls):             # 类方法（cls 必须）
        return cls.class_var

    @staticmethod
    def util(x):                     # 静态方法（无 self/cls）
        return x * 2

# 实例化
obj = MyClass("hello")
obj.method()                         # 调用实例方法

# 继承
class Child(MyClass):
    def __init__(self, name, age):
        super().__init__(name)       # 调用父类构造
        self.age = age
```
