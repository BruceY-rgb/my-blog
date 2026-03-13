---
title: 深度学习基础 - Deep Learning Basics
date: 2026-03-10 10:30:00
cover: https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1920
categories:
  - CS课程笔记
  - NLP
  - 深度学习
tags:
  - Deep Learning
  - 神经网络
  - 机器学习
---

# Deep Learning Basics

> 讲师：汤斯亮（Siliang Tang）
> Email: siliang@zju.edu.cn

---

## 1. Machine Learning ≈ Looking for a Function

机器学习的本质是寻找一个函数（Function），可以应用于多种场景：

- **语音识别（Speech Recognition）**
  输入："How are you" → 输出：文字

- **图像识别（Image Recognition）**
  输入：图片 → 输出："Cat"

- **围棋对弈（Playing Go）**
  输入：棋盘状态 → 输出："5-5"（下一步）

- **对话系统（Dialogue System）**
  输入："Hi"（用户说的话） → 输出："Hello"（系统回复）

---

## 2. Machine Learning Framework

以图像识别为例，机器学习的基本框架包括三个步骤：

### Step 1: 定义一个函数集合（Model）
- 使用某种模型结构（如神经网络）定义一组候选函数

### Step 2: 评估函数的好坏（Goodness of Function）
- 使用训练数据（Training Data）来评估每个函数的表现
- 监督学习（Supervised Learning）：提供输入和对应的输出标签
  - 输入：图片
  - 输出：标签（"dog", "monkey", "cat"）

### Step 3: 选择最佳函数（Pick the Best Function）
- 从函数集合中选出表现最好的函数
- 用于测试（Testing）新的输入数据

---

## 3. 人工智能的诞生

### 3.1 AI 概念的提出（1955年）

**四位先驱学者**在 1955 年提出了"人工智能"这一术语及研究范畴：

1. **John McCarthy**
   - 时任 Dartmouth 数学系助理教授
   - 1971 年度图灵奖获得者

2. **Marvin Lee Minsky**
   - 时任哈佛大学数学系和神经学系 Junior Fellow
   - 1969 年度图灵奖获得者

3. **Claude Shannon**
   - Bell Lab，信息理论之父

4. **Nathaniel Rochester**
   - IBM，第一代通用计算机 701 主设计师

**AI 的定义：**
让机器能像人那样认知、思考和学习，即用计算机模拟人的智能。

### 3.2 Dartmouth 会议提出的七类问题

1. **自动计算机（Automatic Computers）**
2. **语言编程（How Can a Computer be Programmed to Use a Language）**
3. **神经网络（Neuron Nets）**
   - 如何排列假设的神经元以形成概念
4. **计算规模理论（Theory of the Size of a Calculation）**
5. **自我提升（Self-improvement）**
   - 自我学习与提高
6. **抽象能力（Abstractions）**
   - 从感官形成抽象概念
7. **随机性与创造力（Randomness and Creativity）**
   - 随机性必须由直觉引导才能高效

### 3.3 AI 的曲折历程

人工智能经历了三次低谷（AI Winter），但最终实现了伟大的逆袭。

---

## 4. Neural Network（神经网络）

### 4.1 神经元（Neuron）

神经元是一个简单的函数，包含以下要素：

- **输入（Inputs）**：多个输入值
- **权重（Weights）**：每个输入对应一个权重
- **偏置（Bias）**：一个偏置值
- **激活函数（Activation Function）**：如 Sigmoid 函数

**示例：**
```
输入: [1, -2, -1]
权重: [2, -1, 1]
偏置: 4
激活函数: Sigmoid

计算过程:
z = (1×2) + (-2×-1) + (-1×1) + 4 = 2 + 2 - 1 + 4 = 7
输出 = Sigmoid(7) ≈ 0.999
```

### 4.2 Sigmoid 激活函数

Sigmoid 函数将任意实数映射到 (0, 1) 区间：

```
σ(z) = 1 / (1 + e^(-z))
```

### 4.3 神经网络结构

- **不同的连接方式** 导致不同的网络结构
- **不同的权重和偏置** 导致不同的函数

---

## 5. Fully Connected Feedforward Network（全连接前馈网络）

### 5.1 网络结构

```
输入层（Input Layer）
  ↓
隐藏层 1（Hidden Layer 1）
  ↓
隐藏层 2（Hidden Layer 2）
  ↓
...
  ↓
隐藏层 L（Hidden Layer L）
  ↓
输出层（Output Layer）
```

**特点：**
- 每一层的神经元与下一层的所有神经元相连（全连接）
- 信息单向流动，从输入到输出（前馈）

### 5.2 Deep Learning = Many Hidden Layers

**深度学习的"深度"指的是隐藏层的数量很多。**

**历年突破：**

| 模型 | 年份 | 层数 | 错误率 |
|------|------|------|--------|
| AlexNet | 2012 | 8 层 | 16.4% |
| VGG | 2014 | 19 层 | 7.3% |
| GoogleNet | 2014 | 22 层 | 6.7% |
| **Residual Net** | 2015 | **152 层** | **3.57%** |

**为什么需要深度网络？**

在相同参数数量的情况下：
- **浅而宽的网络**：分段能力较弱（Less pieces）
- **深而窄的网络**：分段能力更强（More pieces）

深度网络能用更少的参数学习到更复杂的函数。

---

## 6. Deep Learning 的三个步骤

### Step 1: Define a Function Set（定义函数集合）
- 使用神经网络结构定义函数集合

### Step 2: Goodness of Function（评估函数好坏）
- 准备训练数据
- 定义损失函数（Loss Function）

### Step 3: Pick the Best Function（选择最佳函数）
- 使用梯度下降等优化算法

---

## 7. Training Data（训练数据）

### 7.1 准备数据

以手写数字识别为例：
- **输入**：16×16 像素的图片（256 维向量）
  - 有墨水 → 1
  - 无墨水 → 0
- **输出标签**：数字 "0" 到 "9"

### 7.2 Learning Target（学习目标）

使用 **Softmax 层** 作为输出层：

**输入示例：数字 "1" 的图片**
```
期望输出:
y1 (是1) → 最大值
y2 (是2) → 0
...
y10 (是0) → 0
```

**Softmax 函数的作用：**
- 将普通层的任意实数输出转换为概率分布
- 所有输出值和为 1

**示例：**
```
普通层输出: [3, 1, -3, 2.7]
↓ Softmax
概率输出: [0.88, 0.12, ≈0, 0.05]
```

---

## 8. Loss Function（损失函数）

### 8.1 单个样本的损失

一个好的函数应该使**网络输出**尽可能接近**目标输出**。

**常用损失函数：**
1. **均方误差（Square Error）**
2. **交叉熵（Cross Entropy）**

### 8.2 Total Loss（总损失）

对所有训练数据的损失求和：

```
Total Loss L = Σ (所有训练样本的损失)
```

**目标：**
找到使 Total Loss L 最小的函数（参数组合）。

---

## 9. Gradient Descent（梯度下降）

### 9.1 为什么需要梯度下降？

**问题：**
现代神经网络有数百万个参数，无法枚举所有可能的参数值。

**示例：**
- 语音识别模型：8 层，每层 1000 个神经元
- 参数数量：约 10^6（百万级别）

### 9.2 梯度下降算法

**步骤：**

1. **初始化参数 w**
   - 随机初始化
   - 或使用预训练（如 RBM pre-train）

2. **重复以下步骤：**
   ```
   计算梯度: ∂L/∂w (损失函数对参数 w 的偏导数)

   更新参数:
   w ← w - η × (∂L/∂w)

   其中 η 是学习率（Learning Rate）
   ```

3. **停止条件：**
   - 当更新量很小时停止
   - 或达到最大迭代次数

### 9.3 梯度下降的直觉理解

- 如果 ∂L/∂w > 0（正值）→ 减小 w
- 如果 ∂L/∂w < 0（负值）→ 增大 w

目标是找到损失函数的最小值点。

### 9.4 局部最小值问题（Local Minima）

**梯度下降不能保证找到全局最小值（Global Minimum）。**

**可能遇到的问题：**
1. **陷入局部最小值**（Stuck at local minima）
2. **卡在鞍点**（Stuck at saddle point）
3. **平台区域收敛很慢**（Very slow at plateau）

**不同的初始点** → 到达不同的最小值 → 不同的结果

---

## 10. Backpropagation（反向传播）

反向传播是高效计算梯度的算法，是深度学习训练的核心。

**深度学习框架都实现了自动反向传播：**

- **TensorFlow**（Google）
- **PyTorch**（Facebook）
- **Theano**
- **Caffe**
- **CNTK**（Microsoft）
- **Torch**
- **MXNet**

**重要说明：**
> 即使是 AlphaGo 这样的系统，也是使用梯度下降来学习的。
> 深度学习的"学习"本质上就是梯度下降优化。

---

## 11. Recent Advances in Deep Learning Theory（深度学习理论的最新进展）

### 11.1 Neural Tangent Kernel (NTK)

**核心观点：**
- 深度神经网络的泛化能力不能用传统机器学习理论完全解释
- NTK 和 NNGP（Neural Network Gaussian Process）从数学上证明：
  - 在**无限参数条件**下
  - 深度神经网络会退化为 NTK/NNGP

**参考资源：**
- Google AI Blog: Fast and Easy Infinitely Wide Networks

### 11.2 Deep Networks from First Principles

**Rate Reduction 理论：**
- 目前主流卷积神经网络的设计可以从 **Rate Reduction** 原理导出
- 提供了从第一性原理理解深度网络的新视角

### 11.3 Deep Networks are Kernel Machines

**核心发现：**

```
测试样本的预测 = Σ (训练样本 × 核函数)
```

**核函数是学习得到的。**

**重要结论：**
> 以往的观点认为神经网络可以发现新的特征，但这篇论文证明了：
> 只要模型使用的优化方式是**梯度下降**，那么实际上模型只是在**记忆之前的样本**。

**论文链接：**
https://arxiv.org/abs/2012.00152

---

## 总结

本节课介绍了深度学习的基础知识：

1. **机器学习 = 寻找函数**
2. **神经网络** 是一种强大的函数表示方法
3. **深度学习的三步骤**：
   - 定义函数集合（神经网络结构）
   - 定义损失函数（衡量好坏）
   - 梯度下降优化（找到最佳参数）
4. **深度的重要性**：更多隐藏层能学习更复杂的函数
5. **理论新进展**：NTK、Rate Reduction、Kernel Machines 等

---

## Any Questions?

如有疑问，欢迎与讲师交流！
