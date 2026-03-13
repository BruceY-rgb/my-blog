---
title: BeyondMimic
date: 2026-03-13
category: 
    - 科研训练
    - 机器人与大模型
    - 论文阅读
tags:
    - BeyondMimic
cover: https://picx.zhimg.com/v2-4619c1e2c8f4a55678859713b321ead7_720w.jpg?source=172ae18b
---

# BeyondMimic: 高质量人形机器人运动追踪与引导扩散策略

> 论文：BeyondMimic: Scalable Motion Tracking and Guided Diffusion for Humanoid Control
> 作者：Stanford University
> 来源：arXiv 2024

## 1. 摘要 (Abstract)

### 核心问题

- 缺少高质量的运动追踪框架（从人类数据到机器人动作）
- 缺少有效的蒸馏方法：将多个运动原语整合成统一策略
  - 多个技能之间可能相对独立，机器人先学习走路，再学习跑步，就有可能会忘记走路

> **蒸馏 (Distillation)**: 把多个小模型的知识，压缩进一个大而统一的模型里
> **从小模型** → **大统一策略**

### 解决方案 - BeyondMimic

- **运动追踪管道**：实现高难度动作，如跳跃旋转、冲刺、侧手翻
- **引导扩散策略**：通过成本函数在测试时零样本控制
  - 零样本泛化：训练时只学基础动作，测试时可以**组合生成未见任务的动作**
  - 给定目标坐标，自动生成行走/跑/跳的符合轨迹

### 关键技术

- **Guided Diffusion**: 引导扩散，测试时通过损失函数引导生成
- **Sim-to-Real**: 仿真到真实的迁移
- **Motion Primitives**: 运动原语，基本运动技能单元

> **简单的成本函数**:
> - 导航任务：$cost = ||current\_pos - target\_pos||$
> - 避障任务：$cost = max(0, safe\_distance - obstacle\_distance)$

---

## 2. 引言 (Introduction)

- 全身控制并形成下游任务通用、可泛化控制的模块的成功**仅仅局限于仿真**
- 真实世界的人形机器人面临未建模的动力学、硬件限制和不完美的状态估计
- 硬件上实现类似的能力需要两个缺失的能力
  1. 一个可扩展的、高质量的运动追踪框架
     - 将运动学参考转换为**鲁棒的、高度动态的**运动
     - 避免先前工作中出现的过渡随机化(为了提高鲁棒性加入过多随机扰动，导致运动质量下降)、抖动(运动不流畅)和运动质量下降(运动不自然)
  2. 一个有效的**仿真到真实**的方法
     - 将学到的运动原语蒸馏到单一策略中，能够在测试时组合结果
     - 实现灵活的、目标驱动的控制而无需重新训练

### 三大贡献

**BeyondMimic** 同时解决了上面两个问题

1. **贡献1**：引入了一个 **运动追踪管道**，能够在真实人形机器人硬件上执行高度动态的运动如跳跃旋转、冲刺和侧手翻，并具有最先进的运动质量

2. **贡献2**：不仅仅是简单地在人形机器人上模仿这些人类运动，我们的框架进一步提出了一个**引导扩散策略**(guided diffusion policy): 将这些运动或技能合成为一个 **单一的统一策略**，在测试时只是把简单的成本函数支持零成本、任务特定的控制（**task-specific control**）、灵活地解决下游任务而无需额外的重新训练

3. **贡献3**（隐含）：完整的仿真到真实管道

> **完整的仿真到真实管道(`full sim-to-real pipeline`)的三个步骤**
> 1. `training robust tracking policies`: 训练鲁棒的追踪策略(在仿真中)
> 2. `distilling them into a diffusion--based controller`: 蒸馏到基于扩散的控制器(离线蒸馏)
> 3. `deploying the result on physical hardware`: 部署在物理硬件上(真实机器人)

---

## 3. 相关工作 (Related Work)

### A. 运动追踪 (Motion Tracking)

> 回顾运动追踪领域的发展历程，从早期的任务特定控制器到多运动追踪框架

#### 早期方法：任务特定控制器

- **核心思想**：为每个任务手动设计控制器
- **问题**
  - 需要大量奖励工程，要我们手动设计复杂的奖励函数
  - 运动不自然：只关注任务目标，不关注运动风格和整体运动姿态
  - 无法扩展，泛化能力很弱，每个动作必须要单独设计

#### DeepMimic（里程碑）

> 这是任务控制器的一个里程碑

- **核心思想**：从人类运动捕捉数据中学习，减少奖励工程
- **优势**：运动自然、动态可行
- **局限**：仍然是单任务策略

#### 单任务向多任务演进

| 方法 | 类型 | 特点 |
|------|------|------|
| ASAP | 单任务 | 真实到仿真管道，提高仿真保真度 |
| KunfuBot/Hub | 单任务 | 域随机化，高质量 `sim_to_real` |
| PHC | 多任务 | 高质量，但是仅是仿真中的方案 |
| OmniH2O/Exbody/HumanPlus | 多任务 | 可行但是动作质量会下降 |
| TWIST/CLONE/UniTracker | 多任务 | 质量好，但是仅**静态**或者**低动态运动** |

> **研究空白**：在真实人形机器人硬件上，**高运动质量+高度动态技能** 尚未同时实现

---

### B. 扩散模型在机器人中的应用

#### 三种范式对比

| 范式 | 代表工作 | 核心思想 | 优势 | 问题 |
|------|----------|----------|------|------|
| **两阶段** | 运动学扩散+控制器 | 规划+控制分离 | 灵活的条件控制 | 规划和控制的差距较大 |
| **端到端** | Diffusion Policy, Diffuseloco, PDP | 直接将状态转化为动作 | 避免规划-控制差距 | 缺乏测试时引导 |
| **联合扩散** | Difusser, Decision Difusser, Diffuse-CLoC | 状态+动作联合扩散 | 灵活的测试时引导 | 未在真实机器人验证 |

> **状态 (State)**：所谓状态就是机器人对自己当前情况的**完整感知**，是智能体做出决策所需的所有信息。扩散策略使得机器人可以根据当前状态决定后面几步的动作。

#### 本文要解决的问题

- **运动追踪**：
  - 现有问题：质量差或者仅静态运动
  - **本文解决方案**：高质量+高动态+真实硬件
- **扩散模型**：
  - **现有问题**：未在真实人形机器人验证
  - **本文解决方案**：引导联合扩散+离线蒸馏

---

## 4. 可扩展运动追踪 (Scalable Motion Tracking)

> 这是整个运动追踪框架的核心，讲解如何将人类运动参考适配到机器人身上

```python
# commands.py
# 运动加载器-读取参考运动数据
class MotionLoader:
    def __init__(self, motion_file: str, body_indexes: Sequence[int], device: str="cpu"):
        data = np.load(motion)
        self.joint_pos = torch.tensor(data["joint_pos"], dtype=torch.float32)
        self.joint_vel = torch.tensor(data["joint_vel"], dtype=torch.float32)
        self._body_pos_w = torch.tensor(data["body_pos_w"], dtype=torch.float32)  # 世界坐标位置
        self._body_quat_w = torch.tensor(data["body_quat_w"], dtype=torch.float32)  # 世界坐标旋转（四元数）
        self._body_lin_vel_w = torch.tensor(data["body_lin_vel_w"], dtype=torch.float32)  # 线速度
        self._body_ang_vel_w = torch.tensor(data["body_ang_vel_w"], dtype=torch.float32)  # 角速度
```

- 这里的输入是一个 `.npz` 文件，包含运动捕捉数据

---

### A. 追踪目标 (Tracking Objective)

#### 锚点变换——核心公式

- 目的：将身体部位 `b` 相对于 $b_{ref}$ 的期望姿态锚定
- 公式主体

$$
\hat{T}_b = T_{anchor} \cdot T_{b,motion}
$$

> **期望姿态 = 锚点变换 × 参考运动姿态**

- $P_{anchor} = [p_{bref.x}, p_{bref.y}, p_{bref.z, motion}]$ —— 保持机器人 x,y, 使用参考运动的高度 z
- $R_{anchor} = R_z(yaw(R_{bref} \times R_{b \perp ref,motion}^{-1}))$ —— 保持偏航角(yaw)，忽略翻滚和俯仰

> **T** 在机器人学和运动学中代表 **姿态(Pose)**，即一个刚体在空间中的完整描述，由位置参数 $p$（手在哪里）和旋转参数 $R$ 表示（手朝向哪个方向）

```python
# commands.py
def _update_command(self):
    """每帧更新命令，计算锚点变换"""

    # 1. 获取锚点(骨盆/躯干)的当前实际位置和旋转
    anchor_pos_w_repeat = self.anchor_pos_w[:, None, :].repeat(1, len(self.cfg.body_names), 1)
    anchor_quat_w_repeat = self.anchor_quat_w[:, None, :].repeat(1, self.num_parts, 1)
    robot_anchor_pos_w_repeat = self.robot_anchor_pos_w[:, None, :].repeat(1, len(self.anchor_pos_w), 1)
    robot_anchor_quat_w_repeat = self.robot_anchor_quat_w[:, None, :].repeat(1, len(self.anchor_quat_w), 1)

    # 2. 计算锚点变换 T_anchor
    # 对应论文公式：p_anchor = [p_bref.x, p_bref.y, p_bref.z,motion]
    delta_pos_w = robot_anchor_pos_w_repeat
    delta_pos_w[..., 2] = anchor_pos_w_repeat[..., 2]  # 只替换z轴(高度)

    # 对应论文公式：R_anchor = R_z(yaw(R_bref * R_motion^-1))
    delta_ori_w = yaw_quat(quat_mul(robot_anchor_quat_w_repeat, quat_inv(anchor_quat_w_repeat)))

    # 3. 计算相对姿态
    self.body_quat_relative_w = quat_mul(delta_ori_w, self.body_quat_w)
    self.body_pos_relative_w = delta_pos_w + quat_apply(delta_ori_w, self.body_pos_w - anchor_pos_w_repeat)
```

**流程图**

```
输入1：机器人当前状态（传感器）
  p_robot = [0.10, 0.05, 0.85]
  R_robot = 偏航30°
              │
              ▼
输入2：参考运动数据（.npz文件）
  p_motion = [0.00, 0.00, 0.95]
  R_motion = 偏航0°
              │
              ▼
Step 1: 计算锚点变换 T_anchor
  p_anchor = [0.10, 0.05, 0.95]  ← 用参考的z
  R_anchor = 偏航30°  ← 对齐偏航角
              │
              ▼
Step 2: 计算相对位置
  p_rotated = rotate(p_motion_rel, 30°)
  p_relative = p_anchor + p_rotated
              │
              ▼
输出：期望目标
  左脚踝 → (0.143, -0.05, 0.975) m
  右手腕 → (0.360, 0.25, 1.100) m
```

**参数具体含义**

| 符号 | 含义 |
|------|------|
| $T_b$ | 身体部位 b 的实际姿态(机器人传感器测得) |
| $T_{b,motion}$ | 参考运动中身体部位 b 的姿态(来自运动捕捉的数据) |
| $T_{bref}$ | 参考身体(锚点，如盆骨)的当前实际姿态 |
| $T_{anchor}$ | 锚点变换矩阵，通过位置和旋转参数计算得到 |
| $\hat{T}_b$ | 身体部位 b 的期望姿态(我们要追踪的目标) |

---

### B. 观测空间 (Observations)

> 这部分讲解策略(policy)的输入是什么

**核心概念**

策略的观测空间形式化为一个 **包含三个组成部分的单时间步向量**(`single-timestamp vector`)

**观测的三个组成部分**

| 组成部分 | 符号 | 含义 |
|----------|------|------|
| 相位信息 | $c = [q_{joint,motion}, v_{joint,motion}]$ | 参考运动的关节位置和速度 |
| 锚点误差 | $\xi_{bref} \in \mathbb{R}^9$ | 锚点的追踪误差(位差、旋转、速度) |
| 追踪目标 | $g_{tracking}$ | 各身体部位的期望姿态和速度 |

> **command** 在机器人强化学习中是从外部输入给机器人的参考信息。简单来说 **command = 参考运动数据 + 锚点计算结果**

```python
class MotionCommand:
    """运动命令"""

    # 参考运动数据(来自.npz文件)
    joint_pos  # 参考关节位置
    joint_vel  # 参考关节速度
    body_pos_w # 参考身体位置(世界坐标)
    body_quat_w # 参考身体旋转(四元数)
    body_lin_vel_w # 参考线速度
    body_ang_vel_w # 参考角速度

    # 锚点相关
    anchor_pos_w # 锚点位置
    anchor_quat_w # 锚点旋转

    # 机器人实际状态
    robot_anchor_pos_w # 机器人锚点实际位置
    robot_anchor_quat_w # 机器人锚点实际旋转

    # 计算结果
    body_pos_relative_w # 身体相对位置
    body_quat_relative_w # 身体相对旋转
```

**观测的物理意义**

```
策略观测输入：
┌─────────────────────────────────────────────────────────────┐
│  [相位信息 c]                                              │
│  • 参考关节位置 q_motion                                     │
│  • 参考关节速度 v_motion                                     │
│  → 告诉策略"运动进行到哪里了"                                 │
├─────────────────────────────────────────────────────────────┤
│  [锚点误差 ξ_bref]                                          │
│  • 锚点位置误差                                              │
│  • 锚点旋转误差                                              │
│  • 锚点速度误差                                              │
│  → 告诉策略"现在偏离参考多少"                                  │
├─────────────────────────────────────────────────────────────┤
│  [追踪目标 g_tracking]                                      │
│  • 各身体部位的期望位置（相对于锚点）                          │
│  • 各身体部位的期望旋转（相对于锚点）                          │
│  → 告诉策略"应该去哪里"                                      │
└─────────────────────────────────────────────────────────────┘
```

---

### C. 关节阻抗与动作 (Joint Impedance and Actions)

> 这部分讲解如何控制机器人的关节

在动画和机器人学中，添加 `joint impedance` (关节阻抗) 是一项标准方法

#### 1. 什么是关节阻抗？

**阻抗控制** = 用弹簧-阻尼系统来控制关节

$$\tau = k_p (q_{target} - q_{actual}) - k_d \dot{q}$$

| 符号 | 含义 |
|------|------|
| $\tau$ | 输出力矩 |
| $k_p$ | 刚度系数（弹簧） |
| $k_d$ | 阻尼系数 |
| $q_{target}$ | 目标位置 |
| $q_{actual}$ | 实际位置 |
| $\dot{q}$ | 实际速度 |

#### 2. 论文中的参数设置

我们启发式地设置关节刚度和阻尼，跟随 Raibert 等人的方法。

根据二阶系统理论：

$$k_p = I \cdot \omega_n^2$$
$$k_d = 2 \cdot I \cdot \zeta \cdot \omega_n$$

| 参数 | 值 | 含义 |
|------|-----|------|
| $I$ | 各关节转动惯量 | 关节惯性 |
| $\omega_n$ | 10 Hz | 自然频率（较低值，促进柔顺性） |
| $\zeta$ | $\sqrt{2} \approx 1.414$ | 阻尼比（过阻尼） |

#### 3. 为什么用低刚度？

| 高刚度 | 低刚度 |
|--------|--------|
| 精确追踪 | 允许误差 |
| 放大传感器噪声 | 抑制噪声 |
| 冲击吸收差 | 柔顺性好 |
| ❌ 不适合硬件 | ✅ 适合真实机器人 |

#### 4. 动作设计

策略的动作设计为归一化的关节位置设定点：

$$q_{target} = \bar{q} + \alpha \cdot a$$

| 符号 | 含义 |
|------|------|
| $\bar{q}$ | 默认关节角度（标称姿态） |
| $a$ | 策略输出的归一化动作（-1 到 1） |
| $\alpha$ | 缩放因子 $= 0.25 \times \tau_{max}$ |

---

### D. 奖励函数 (Rewards)

奖励的组成：
- **任务奖励**：主要奖励，让机器人**追踪参考运动**，例如位置奖励和速度奖励
- **正则化惩罚**：辅助奖励，避免不良行为，防止损害追踪性能

#### 1. 任务奖励 (Task Reward)

**误差计算**: 为每个目标身体计算误差指标，基于期望的和实际的姿态和扭转

$T = (p, R)$：姿态(pose)
- $p$: 位置 $(x, y, z)$
- $R$: 旋转 (四元数或旋转矩阵)

$V = (v, w)$: 扭转/速度(Twist)
- $v$: 线速度
- $w$: 角速度

**四种误差类型**

- 位置误差：$e_{p,b} = \hat{p}_b - p_b$
- 旋转误差：$e_{R,b} = log(\hat{R}_b R_b^T)$
- 线速度误差：$e_{v,b} = \hat{v}_b - v_b$
- 角速度误差：$e_{w,b} = \hat{w}_b - w_b$

**指数奖励函数**：使用 **高斯风格的归一化** 将误差转换为奖励

$$r_x = exp\left(- \frac{\bar{e_x}}{2\sigma^2}\right)$$

**组合追踪奖励**：四种误差奖励的总和

$$T_{tracking} = r_p + r_R + r_v + r_w$$

#### 2. 正则化惩罚 (Regularization Penalty)

对于正则化，我们仅仅包含三个对 `sim_to_real` 对齐至关重要的惩罚项

| 惩罚 | 符号 | 作用 |
|------|------|------|
| 关节限位惩罚 | $r_{limit}$ | 防止关节超出限位 |
| 动作平滑惩罚 | $r_{smooth}$ | 防止动作抖动 |
| 自碰撞惩罚 | $r_{contact}$ | 防止身体部位碰撞 |

**总奖励公式**

$$r = r_{tracking} - \lambda_{limit} r_{limit} - \lambda_{smooth} r_{smooth} - \lambda_{contact} r_{contact}$$

---

### E. 终止与重置 (Termination and Reset)

> 这是训练过程中的关键机制，决定何时结束一个 `episode` 以及如何重置

**终止条件**：`episode` 在以下两种情况下终止，表明**跌倒或者追踪失败**

1. 当参考身体 $b_{ref}$ 的高度或者方向（仅考虑俯仰和翻滚）误差超过预定阈值时
2. 当任何末端执行器身体 $b \in B_{ee}$ 的高度与参考轨迹显著偏离时

> `pitch` 和 `roll` 是出现倾斜的体现，`yaw` 不考虑是因为我们允许机器人转向

**重置策略**：每次 `episode` 重置时，运动相位从整个参考轨迹中自适应采样。机器人在相应的参考配置和速度下初始化，并添加额外的随机扰动以增强鲁棒性

---

### F. 自适应采样 (Adaptive Sampling)

训练长序列运动不可避免面临并非所有片段都同样困难的问题。因此在先前工作中常见的对整个轨迹均匀采样，往往会过渡采样简单片段而低估困难片段，导致奖励方差较大和训练效率低下

#### 核心算法

- 将整个运动的起始索引分成 S 个 bin，每个 bin 是 1s，并根据经验失败统计对这些 bins 进行采样
- 设 $N_s$ 和 $F_s$ 分别是 bin s 中开始的 `episode` 数量和失败数量
- **失败率**：$P_s = \frac{F_s}{N_s}$
- 失败率通过**指数移动平均值**随**时间**进行平滑处理

**指数移动平均平滑**：$p_s^{smoothed} = \alpha \cdot p_s + (1 - \alpha) \cdot p_s^{old}$

#### 非因果指数衰减

失败更有可能是由终止前不久采取的次优动作引起的，**非因果指数衰减**是符合条件的

$$k_{\tau} = \gamma^{\tau}$$

最终采样概率：

$$p_s = \frac{\sum_{\tau = 0}^{K-1} \alpha^{\tau} \bar{r}_{s+\tau}}{\sum_{j=0}^{K-1} \alpha^j}$$

#### 混合均匀分布（防遗忘机制）

为了保留对简单桶的覆盖并减轻灾难性遗忘：

$$p_s' = \lambda \frac{1}{B} + (1 - \lambda) p_s$$

---

### G. 域随机化 (Domain Randomization)

#### 核心随机化参数

应用三项领域随机化：
1. **地面摩擦系数**：让机器人在不同摩擦力下如何发力，避免脚底打滑
2. **默认关节位置** $q_j$：同时应用于动作和观测，模拟关节偏移校准误差
3. **躯干的质心位置**：外部负载、电池安装位置等改变机器人的重心

#### 环境扰动和鲁棒性

- 目的：鼓励机器人学习对环境多变性具有鲁棒性的策略
- 比如机器人被踢了一脚，要能快速调整姿态，不能直接摔倒

---

## 5. 基于引导扩散的轨迹合成 (Trajectory Synthesis via Guided Diffusion)

> 在上一章中机器人学会了如何稳定地 **模仿人类动作**。而这一章将讲解如何让机器人具备 **主观意图**，利用扩散模型(Diffusion Model)来灵活生成能够完成特定任务(如避障、摇杆控制)的新轨迹

### A. 训练与推理 (Training and Reasoning)

训练本身遵循标准的去噪扩散过程：

1. 把完美的动作轨迹打碎成噪音（加噪）
2. 训练神经网络学习如何从这些噪音中一点点把原始动作恢复出来（去噪）

**训练损失函数**

通过最小化与地面真值之间的 **均方误差 (MSE)** 损失来优化网络参数：

$$L = MSE(x_{0,\theta}(\tau_t^k, O_{t, k}), \tau_t)$$

| 参数 | 含义 |
|------|------|
| $\tau_t$ | 地面真值轨迹（Clean Trajectory） |
| $\tau_t^k$ | 带噪轨迹，在第 k 步扩散步骤中被污染的轨迹 |
| $O_{t,k}$ | 观测历史（Observation History） |
| $x_{0,\theta}$ | 去噪模型，其输出是模型对原始轨迹的最佳估计值 |

---

### B. 引导 (Guidance)

> 这是 `BeyondMimic` 实现 `Zero-shot` 控制最精妙的地方

为了在推理过程中引导模型走向 **特定的目标**，我们使用了**分类器引导 (classifier guidance)**

**分类器引导函数**：通过贝叶斯定理

$$\nabla_x \log p(x|y) = \nabla_x \log p(x) + \nabla_x \log p(y|x)$$

| 梯度项 | 含义 |
|--------|------|
| $\nabla_x \log p(x\|y)$ | 条件分数 / 引导后总趋势 |
| $\nabla_x \log p(x)$ | 基础动作分数（Unconditional Score），保证机器人动作符合人体运动规律 |
| $\nabla_x \log p(y\|x)$ | 引导项（Guidance Term），由分类器提供的任务梯度 |

---

### C. 下游任务 (Downstream Tasks)

> 展示如何通过设计不同的代价函数(Cost Function)在不重新训练模型的情况下，引导扩散策略完成摇杆控制、路点导航和避障等具体任务

#### 1. 摇杆转向 (Joystick Steering)

$$G_\tau^C(\tau) = \frac{1}{2} \sum_{t'=t}^{t+H} \| V_{xy, t'}(\tau_{t'}) - g_v \|^2$$

- $V_{xy, t'}$：预测轨迹在未来时刻的**水平面根部速度**
- $g_v$：用户通过遥控器摇杆给出的**目标速度向量**

#### 2. 路点导航 (Waypoint Navigation)

$$G_\tau^{ts}(\tau) = \sum_{t'=t}^{t+H} (1-e^{-2d}) \| P_x(s_{t'}) - g_p \|^2 + e^{-2d} \| V_{x,t'}(\tau_{t'}) \|^2$$

> **动态权重**：利用指数项 $e^{-2d}$ 实现了任务重心的平滑切换：远的时候拼命跑，近的时候稳稳停

- $d$：当前预测位置与目标点之间的标量距离
- $1-e^{-2d}$：**位置权重**（距离大时接近 1）
- $e^{-2d}$：**速度惩罚权重**（距离小时接近 1）

#### 3. 避障 (Obstacle Avoidance)

$$G_\tau^C(\tau) = \sum_{t'=t}^{t+H} \sum_{b \in B_c} B(SDF(P_{b,t'}(\tau)) - r_i, \delta)$$

- **SDF (Signed Distance Field)**：能告诉机器人离最近的障碍物还有多远

---

## 6. 运动追踪实验与结果 (Motion Tracking Experiments and Results)

### A. 仿真到仿真性能 (Sim-to-Sim Performance)

使用 **LAFAN1 数据集**，包含多样化和敏捷的人类运动，如冲刺、跳跃转身和爬行，以及来自先前工作的短单运动片段。

- LAFAN1 数据集包含 40 个几分钟长的参考运动
- 每个大类中都有许多不同的运动
- 随机选择 25 个参考运动，确保每个类别至少一个

### B. 真实机器人实验设置

- 部署在 **Unitree G1** 人形机器人上
- 所有部署代码用 C++ 编写，针对实时执行优化
- 完整状态估计在 500Hz 下使用低层次广义动量观测器结合卡尔曼滤波提供
- **注意**：没有使用外部动作捕捉系统进行追踪
- 对于极端、接触丰富的行为（如从地上起身），使用 LIO（激光雷达-惯性里程计）进行位置校正
- 使用 ONNX Runtime 在机器人 CPU 上执行推理，每次推理步骤在 1.0ms 以内

### C. 真实世界性能

展示了四种不同类别的运动，展示了运动追踪框架的卓越性能、多功能性和通用性：

#### a) 之前演示过的短动态运动

- Cristiano Ronaldo 的标志性庆祝动作（来自 ASAP）
- 侧踢（来自 KungfuBot）
- 我们的系统展现出卓越的鲁棒性
- 值得注意的是，之前的工作只演示单个实例，而我们的框架可以**连续 5 次重复**执行这些动作

#### b) 需要强平衡的静态运动

- 单腿站立
- 燕子平衡（Swallow Balance）
- 与 HuB 不同（依赖于特定任务的域随机化和参数调优），我们的框架使用相同的超参数完成这些任务

#### c) 极度动态且之前未演示的运动

- 单腿和双腿跳跃
- 连续两个侧手翻
- 冲刺
- 向前跳跃带 180° 和 360° 旋转
- 这些运动对身体要求极高，甚至对成年人类来说也很困难

#### d) 风格化和表达性运动

- 查尔斯顿舞（Charleston dance）
- 太空步（Moonwalk）
- 走路到爬行的过渡
- 老人风格走路
- 羽毛球和网球运动
- 我们的框架忠实地保留了这些风格特征

### D. 自适应采样消融实验

| 运动 | 无 AS | 有 AS |
|------|-------|-------|
| Cristiano Ronaldo | 3k | 1.5k |
| Swallow Balance | 2.8k | 1.8k |
| dance1 subject1 (cartwheel) | Failed | 8k |
| dance2 subject1 (jump-spinning) | Failed | 9k |
| fightAndSports1 (balance) | Failed | 10k |

**结论**：自适应采样显著加速训练并提高鲁棒性

---

## 7. 扩散模型实验与结果 (Diffusion Experiments and Results)

### A. 数据

- 使用 **AMASS** 和 **LAFAN1** 的子集，包含多样化的行走运动
- 为每个运动技能训练运动追踪控制器以生成动作标签
- 由于扩散模型在推理时需要多个去噪步骤，存在显著延迟
- 为了处理这个问题，在训练中**加入动作延迟域随机化**

### B. 实验设置

- 观测历史：$N = 4$
- 预测视野：$H = 16$
- 动作预测视野：8 步（通过损失掩码限制）
- 模型：6 层 Transformer 解码器，4 个注意力头，512 维嵌入，总计 19.95M 参数
- 训练：20 个去噪步骤，注意力 dropout 概率 0.3

### C. 任务与指标

1. **Walk-Perturb**：在 15 秒行走过程中，每秒施加 0-0.5 m/s 的随机根部速度扰动
2. **Joystick Control**：发出方向指令序列：前进、后退、左转、右转

### D. 状态表示消融

| 状态表示 | Walk-Perturb | Joystick Control |
|----------|--------------|------------------|
| Body-Pos State | 100% | 80% |
| Joint-Rot State | 72% | 0% |

**结论**：Body-Pos 状态表示显著优于 Joint-Rot 状态

- **Body-Pos**：直接预测笛卡尔空间中的身体位置，提供明确的空间锚定
- **Joint-Rot**：理论上更马尔可夫，但关节位置的小误差会通过运动链累积

---

## 8. 讨论与未来工作 (Discussion and Future Work)

### A. 仿真到真实

- 我们在广泛的运动追踪和扩散策略上实现了强大的仿真到真实性能
- 高质量的仿真到真实迁移源于仔细的问题公式化和实现：
  - 准确的建模与有针对性的随机化，避免过度域随机化
  - 观测和动作空间的设计
  - 用于通信和策略输入/输出处理的低延迟 C++ 框架

**局限性**：偶尔仍会遇到由状态估计漂移引起的失败，特别是当末端执行器接触假设被违反时（如扩散策略的起身动作）。开发能够泛化到这种多样化运动的状态估计器是一个具有挑战性的问题。

### B. 分布外行为

- 一个值得注意的发现是，扩散模型行为与 RL 相比是**惯性**的
- 在分布外场景中（如机器人摔倒或被龙门架物理阻挡），人类操作员可以简单地安全地将其抬起恢复
- 这与典型的 RL 策略形成对比，后者在此类情况下通常产生不稳定的行为

### C. 技能转换

- 当前基于动作的扩散模型的一个关键局限性在于难以在不同技能之间转换
- 可以将这些模型概念化为学习一个流形，每个技能对应一条特定的曲线
- 分类器引导作为将模型引导到不同曲线的机制
- 当目标技能在流形上太远时，模型经常被困在当前模式中，无法进行必要的转换

---

## 9. 总结 (Conclusion)

BeyondMimic 提出了一个统一的框架，用于在真实人形机器人上实现高质量、动态的运动追踪和灵活的引导控制：

1. **可扩展的运动追踪管道**：单一 MDP 配置和通用超参数，实现分钟级参考运动的高质量追踪
2. **引导扩散策略**：通过简单的成本函数实现零样本任务特定控制
3. **成功部署**：在 Unitree G1 机器人上展示跳跃旋转、冲刺、侧手翻等多种高度动态运动

---

## 参考论文 (References)

[1] Universal humanoid motion representations for physics-based control (2023)
[2] Masked-Mimic: Unified physics-based character control through masked motion inpainting (2024)
[3] Diffuse-CLoC: Guided diffusion for physics-based character look-ahead control (2025)
[5] Walk These Ways: Tuning robot control for generalization with multiplicity of behavior (2023)
[9] DeepMimic: Example-guided deep reinforcement learning of physics-based character skills (2018)
[13] ASAP: Aligning simulation and real-world physics for learning agile humanoid whole-body skills (2025)
[14] KungfuBot: Physics-based humanoid whole-body control for learning highly-dynamic skills (2025)
[15] HuB: Learning extreme humanoid balance (2025)
[16] Perpetual Humanoid Control for real-time simulated avatars (2023)
[33] PDP: Physically-based Diffusion Policy (2024)
[38] Raibert et al. - 关节阻抗参数设置
[42] LAFAN1 dataset
[47] AMASS dataset
