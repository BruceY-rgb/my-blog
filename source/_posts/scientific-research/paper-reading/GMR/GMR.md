---
title: General Motion Retargeting for Humanoid Motion Tracking
authors: João Pedro Araújo, Yanjie Ze, Pei Xu, Jiajun Wu, C. Karen Liu
venue: Stanford University（斯坦福大学）
category: 
    - 科研训练
    - 机器人与大模型
    - 论文阅读
tags:
    - GMR
    - excessive reward tuning
cover: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJ151aXrDgIVVQFeGAnyN_aR9uLLKdHKkOGg&s
---


**论文信息**

| 项目       | 内容                                                                         |
| ---------- | ---------------------------------------------------------------------------- |
| **标题**   | Retargeting Matters: General Motion Retargeting for Humanoid Motion Tracking |
| **作者**   | João Pedro Araújo, Yanjie Ze, Pei Xu, Jiajun Wu, C. Karen Liu                |
| **机构**   | Stanford University                                                          |
| **GitHub** | https://github.com/YanjieZe/GMR                                              |
| **原文**   |[论文链接](https://arxiv.org/pdf/2510.02252)|

---

**章节结构**

1. Abstract（摘要）
2. I. Introduction（引言）
3. II. Related Work（相关工作）
4. III. Evaluation Method（评估方法）
5. IV. General Motion Retargeting（GMR方法）⭐
6. V. Evaluation Results（实验结果）
7. VI. Conclusion（结论）
8. References（参考文献）


---

## 1. 摘要

> 一句话总结：本文评估了运动重定向质量对人形机器人策略性能的影响，提出了GMR方法来解决现有重定向方法中的伪影问题。

- 原有的人形机器人运动跟踪策略：构建遥控操作管道和分层控制器
- 但是这个策略的一个根本性的挑战是:人类和人形机器人之间的形态差异(`embodiment gap`)
- 当前的方法
  - 将人类运动数据`retargeting`到人形机器人本体
  - 使用强化学习
  - 模仿参考轨迹
- 方法的问题：重定向过成会引入`artifacts`也就是伪影(**这是本文要解决的核心问题**)，比如脚步滑动、自我穿透和物理上不可行的运动会留在参考轨迹中
  - 这种方法的本质是：**用强化学习纠正或掩盖问题而不是解决根本问题**
- 论文的核心假设：不依赖奖励工程，重定向质量是至关重要的。
- 本文的评估对象：当抑制过渡奖励(`excessive reward tuning`)调整时，重定向质量如何影响策略性能
- 论文核心贡献
  - `GMR`:`general motion regarding`
  - 为了解决现有重定向方法(`PHC`,`ProtoMotions`)的缺陷
- 论文使用的`RL`训练框架:`BeyondMimic`
- 实验发现：通过对`LAFAN1`数据集分析发现 **伪影会显著降低鲁棒性**

!!! note "如何理解Retargeting"
就是通过数据将人类的运动映射到机器人上
!!!

## 2. 引言

- 开发真正泛化到真是世界环境的人形机器人策略的关键是**来自真实世界的数据**
- 人类和人形机器人之间形态差异的具体方面
  - `bone length`
  - `joint range of motion`
  - `kinematic structure`
  - `body shape`
  - `mass distribution`:质量分布
- 克服形态差异才能使三维人类运动数据充分用于人形机器人学习
- 克服的方法就是 **运动学重定向**(`kinematic retargeting`)
- 当前的方法
  - 模仿参考运动进行强化学习
  - `zero-shot`，0样本迁移(直接从机器人上)，不在每一个实体上进行微调
- 问题：忽略了重定向过程中产生的`artifacts`
- 过去的方法想要将带有严重伪影的重定向数据迁移到真实数据需要**大量试错、奖励塑造和参数调整**(trial-and-error, reward shaping, and parameter tuning)
- 论文假设：通过足够的**奖励工程和领域随机化**，重定向导致的伪影大部分可以被缓解或者消除
- 如果没有这些工程化的努力。重定向结果的质量起着重要作用
- **论文的核心目标**：验证假设
- 实验设置：纯运动跟踪(无物体交互)
- 伪影的主要来源：**缩放**`scaling`
  - `PHC`和`Proto`的缩放方法是有问题de
- `GMR`的核心创新：非均匀局部缩放(`non-uniform local scaling procedure`)和两阶段优化(`two-stage optimization`)
- `BeyondMimic`=公平的评估框架，训练和评估跟踪给定参考运动的强化学习策略，可以
  - **隔离重定向方法的影响**
  - 不依赖奖励调整
- `LAFAN1`数据集：动作捕捉数据
  - 排除复杂接触(排除脚步以外与外物有接触的动作)、
- 比较成功的标准：完成整个参考运动且不摔倒
- 还可以获知：策略是在学习我们期望他们完成的动作还是在学习一个可能更容易或更难跟踪的变体
- 核心发现：重定向方法的选择严重影响人形机器人的性能
- 大多数运动可以跟踪
- 某些运动因为伪影而失败
- 三种关键伪影
  - 脚部穿透(`foot penetration`)
  - 自我交叉(`self-intersection`)
  - 速度突变(`abrupt velocity spikes`)
- 参考运动的起始帧会极大影响策略是否能够开始跟踪它

!!! tip "一些概念的理解"
- 奖励工程：通过奖励机制告诉机器人什么动作的实现是好的
  - 机器人没摔倒+5分，脚不滑+10分
- 领域随机化：训练时故意制造各种困难环境，让他在各种情况下都能适应
  - 房展训练故意加入各种随机干扰
  - 随机改变地面摩擦力、随机添加噪声、随机改变光照
  - 核心目的：让机器人在真实世界里遇到没有见过的环境也不慌
- 伪影：重定向数据中那些不自然的地方
  - 脚部滑动：脚应该在地面上摩擦移动，但伪影中脚会"滑冰"
  - 地面穿透：脚应该站在地面上，但伪影中脚会"穿过"地面
  - 自我穿透/交叉：自己的身体穿透了自己
!!!

## 3. Related Work

### 3.1 运动重定向的两大类方法

| 方法 | 特点 |
|------|------|
| 经典方法 | 基于优化+启发式约束 |
| 数据驱动方法 | 深度学习+需要成对数据/标签 |


### 3.2 机器人领域的挑战

- 真实机器人上**难以获取训练数据**
- 过去只关注简单的手臂/上半身运动

### 3.3 现有重定向方法的缺陷

- 朴素方法：直接复制关节→浮空、脚滑、穿透
- `PHC`:忽略脚的接触状态、计算慢、无法实时
- `ProtoMotions`:使用全局统一缩放→比例不对

### 3.4 论文的主要改进方向

- **全身运动**：解决只关注上半身的问题
- **无需预收集数据**
  - 直接把人类的动作捕捉数据(`LAFAN1`等数据集)拿来用
  - 不需要专门为某个机器人先收集一堆数据
  - 更加通用，任何机器人都能用
- **非均匀局部缩放**：解决比例问题

## 4. Evaluation Method（评估方法）

### 4.1 三个研究问题

1. 重定向方法是否影响策略性能
2. 哪些伪影会影响学习
3. 不同方法的视觉保真度如何(`preserve the look of the source motion`)

### 4.2 四种对比方法

| 方法 | 类型 |
|------|------|
| PHC | 开源基线 |
| ProtoMotions | 开源基线 |
| GMR | 本文提出 |
| Unitree | 闭源上限 |

### 4.3 评估环境

| 环境 | 评估次数 | 说明 |
|------|----------|------|
| `sim` | 100次 | IsaacSim训练，无领域随机化 |
| `sim-dr` | 4096次 | 有领域随机化 |
| `sim2sim` | 100次 | MuJoCo/ROS跨模拟器 |

### 4.4 评估指标

- **成功率**：完成整个运动且不摔倒
- **跟踪误差**
  - 全局位置误差(`E_g-mpbpe`)
    - `Global Mean Per-Body Position Error`
    - **机器人整体**在全局坐标系中的位置与参考运动的差距
  - 相对位置误差(`E-mpbpe`)
    - `Mean Per-Body Part Position Error`
    - 机器人身体各部位相对于**自身重心**的位置与参考运动的差距
  - 关节角度误差(`E_mpjpe`)：
    - `Mean Per-Joint Position Error`
    - 机器人每个关节的角度与**参考运动**中关节角度的差距

## 5. General Motion Retargeting(GMR) ⭐

> 这是论文的核心部分，一共包含五个步骤

![alt text](image-1.png)

### 5.1 整体流程

![alt text](image.png)

### 5.2 Step 1: 关键身体部位匹配

> Human-Robot KeyBody Matching

- 从`source human skeleton`和`target humanoid skeleton`的身体列表开始，用户首先定义**人类和机器人关键身体部位之间的映射**——`M`


```json
// 关键身体部位映射举例
{
    "ik_match_table1": {
        "pelvis": ["Hips", 0, 10, [0, 0, 0], [0.5, 0.5, 0.5, 0.5]],
        "left_hip_yaw_link": ["LeftUpleg", 0, 10, ...],
        "left_ankle_yaw_link": ["LeftFootMod", 50, 10, ...]
    }
}

// 格式说明: "机器人部位": ["人类部位", 位置权重，旋转权重，位置偏移，旋转偏移]
// 就是SMPL模型中的四个重要参数
```

### 5.3 Step 2: 静止姿态对齐

> Human-Robot Cartesian Space Alignment

- 人类-机器人笛卡尔空间静止姿态对齐。我们偏移人类身体的方向，使其与机器人在静止姿态时的方向相匹配
- 解决人机方向不一致的问题，让人类的姿态方向与机器人的静止姿态对齐 

```python
# 使用四元数处理旋转，先旋转后平移
def offset_human_data(self, human_data, pos_offsets, rot_offsets):
    # 遍历人体数据中的每个部位(如头部、手臂、腿部等)
    for body_name in human_data.keys():
        # 提取当前部位的原始位置(pos)和旋转四元数quat
        pos, quat = human_data[body_name]
        # 步骤一：更新旋转姿态
        # R.from_quat(quat):将原始旋转四元数转为旋转矩阵
        # * rot_offsets[body_name]：将旋转矩阵乘以旋转偏移量(实现旋转叠加)
        updated_quat = (R.from_quat(quat)*rot_offsets[body_name]).as_quat()

        # 步骤二：计算位置偏移(考虑旋转后的坐标系)
        # R.from_quat(quat):用更新后的旋转创建旋转矩阵
        # .apply(pos_offsets[body_name]):将位置偏移量转换到旋转后的全局坐标系
        global_pos_offset = R.from_quat(updated_quat).apply(pos_offsets[body_name])

        # 步骤三：更新位置和旋转(核心赋值)
        offset_human_data[body_name][0] = pos + global_pos_offset # 位置 = 原始位置 + 全局位置偏移
        offset_human_data[body_name][1] = updated_quat # 旋转 = 更新后的四元数

    # 返回偏移后的人体数据
    return offset_human_data
```

**重要说明**

- **依赖库**：代码中的`R`是`scipy.spatial.transform.Rotation`的简写，需要提前导入

```python
from scipy.spatial.transform import Rotation as R
```

- 输入数据格式
  - `human_data`:字典：键为人体身体部位名称(`head`/`left_arm`),值为元组`(pos, quat)`
    - `pos`:3维数组/列表(x,y,z),表示**部位的原始位置**
    - `quat`:4维数组/列表(x, y, z, w),表示**部位的原始旋转四元数**(scipy默认格式)
  - `pos_offsets`:字典，键与`human_data`一致，值为3维数组/列表(x, y, z)，表示该 **位置的偏移**
  - `rot_offsets`:字典，键与`human_data`一致，值为`scipy.spacial.transsform.Rotation`对象，表示该部位的旋转偏移矩阵

### 5.4 Step 3: 非均匀局部缩放

> Human Data Non-uniform Local Scaling

- 论文发现其他重定向方法中的大多数伪影都是在缩放`source motion`的过程中引入的
- **核心发现**：缩放是伪影的主要来源
- 论文中实现的缩放程序
  - 基于人类骨骼的高度计算通用的 **缩放因子**
  - 这个通用因子的作用是 **调整为每个关键身体部位定义的自定义局部缩放因子**
  - 每个身体部位有独立的缩放因子，这其实就是 **非均匀**的含义
  - 这种自定义缩放因子可以让我们能够考虑 **下半身和上半身之间的缩放差异**

**核心公式**

$$
p_{target} = s_b · \frac{h}{h_{ref}} · ({p_{source} - p_{ref}}) + s_b · \frac{h}{h_{ref}}· p_{ref}
$$

当身体部位为根部时可以将公式简化为

$$
p_{target} = s_b · \frac{h}{h_{ref}}· p_{ref}
$$

**符号说明**

- $p_{target}$:目标位置(机器人)
- $p_{source}$:源位置(人类)
- $p_{ref}$:参考位置(静止姿态)，标准站立姿势下各个部位的位置
- $h$:实际身高
- $h_{ref}$:参考身高=标准人形的身高，比如1.8米
  - 这是一个**固定的参考值**，用来归一化处理
- $s_b$:身体部位b的缩放因子

```python
# 输入：人类运动数据
# 输出：缩放后的运动数据
def scale_human_data(self, human_data, human_root_name, human_scale_table):
    # 获取根部位(身体重心)的原始位置和旋转
    root_pos, root_quat = human_data[human_root_name]

    # 缩放根部的位置(旋转不缩放)
    scaled_root_pos = human_scale_table[human_root_name] * root_pos

    # 处理其他部位：先根据局部坐标系再缩放
    for body_name in human_data.keys():
        # 跳过无缩放系数，根部位的部位
        if body_name not in human_scale_table:
            continue
        if body_name == human_root_name:
            continue
        
        # 局部坐标 = 全局坐标-根部坐标  → 缩放 → 暂存
        human_data_local[body_name] = (
            human_data[body_name][0] - root_pos
        ) * human_scale_table[body_name]

    # 构建缩放后的全局坐标数据
    # 先初始化根部位的缩放后数据
    human_data_global = {human_root_name: (scaled_root_pos, root_quat)}
    # 其他部位:局部缩放后坐标+缩放后的根部位坐标 = 全局坐标
    for body_name in human_data_local.keys():
        human_data_global[bosy_name] = (
            human_data_local[body_name] + scaled_root_pos * human_data[body_name][1] # 旋转保持不变
        )
    
```

!!! tip 
- 论文中提到的根部我们认为是 **骨盆/髋部**，这是人体运动的中心
- 在机器人中，根部就是`plevis`(盆骨)
!!!

**流程理解**

```
输入：人的运动数据（手在1.5m位置，骨盆在1.0m）

Step 1: 骨盆位置 × 0.9 = 0.9m 直接缩放

Step 2: 手相对于骨盆 = 1.5 - 1.0 = 0.5m（局部坐标）

Step 3: 0.5 × 0.75(手臂缩放) = 0.375m

Step 4: 手的新位置 = 0.375 + 0.9 = 1.275m

输出：机器人的运动数据
```

**缩放因子配置**

```json
"human_scale_table": {
    "Hips": 0.9,
    "Spine2": 0.9,
    "LeftUpLeg": 0.9,
    "RightUpLeg": 0.9,
    "LeftLeg": 0.9,
    "RightLeg": 0.9,
    "LeftFootMod": 0.9,
    "RightFootMod": 0.9,
    "LeftArm": 0.75,
    "RightArm": 0.75,
    "LeftForeArm": 0.75,
    "RightForeArm": 0.75
}
```

> 不同位置这个因子数值大小不同，这就是非均匀局部缩放的具体含义

### 5.5 Step 4: 逆运动学(IK)求解

- 给定机器人关节随时间变化的目标位置$p_{target} = J_f(\beta_r, \theta_h)$，我们将重定向问题表述为一个优化问题
  - $p_{target}$:机器人关节的目标位置
  - $J_f$:前向运动学函数
  - $\beta_r$:机器人身体参数(肢体长度)
  - $\theta_h$:人类关节角度
- 重定向问题通过最小化期望位置与机器人实际达到位置之间的误差来求解
  - 约束 1：关节限位(joint limits)
  - 约束 2：自碰撞避免(self collision avoidance)

**IK优化问题公式**



📐 **公式**：

$$\min_{\theta_r} \sum_{i} \| p_i^{target} - p_i(\theta_r) \|^2$$

$$\text{s.t.} \quad \theta_{min} \leq \theta_r \leq \theta_{max}$$

---

**📝 公式解释**

这是一个带约束的优化问题，目标是在满足关节限位的条件下，让机器人末端执行器的实际位置**尽可能接近目标位置**。

---

**📐 符号说明**

| 符号            | 含义                         |
| --------------- | ---------------------------- |
| $\theta_r$      | 机器人关节角度向量（待求解） |
| $p_i^{target}$  | 第 $i$ 个身体部位的目标位置  |
| $p_i(\theta_r)$ | 通过前向运动学计算的实际位置 |
| $\theta_{min}$  | 关节角度下限                 |
| $\theta_{max}$  | 关节角度上限                 |
| $\| \cdot \|^2$ | 欧氏距离的平方               |

---

**📐 推导过程**

第一步：目标函数

$$\sum_{i} \| p_i^{target} - p_i(\theta_r) \|^2$$

展开为：

$$\| p_1^{target} - p_1(\theta_r) \|^2 + \| p_2^{target} - p_2(\theta_r) \|^2 + \cdots + \| p_n^{target} - p_n(\theta_r) \|^2$$

物理意义：所有身体部位的**位置误差平方和**。(我们的最终目的是找到这个能使位置误差平方和达到最小的机器人关节角度也就是$\theta_r$)

第二步：约束条件

$$\theta_{min} \leq \theta_r \leq \theta_{max}$$

例如：机器人手臂的肘关节角度范围是 $[-150^\circ, 0^\circ]$，表示肘关节只能向后弯曲。

---

**📐 具体数值举例**

假设：

- 机器人有2个关节 $\theta_r = [\theta_1, \theta_2]$
- 目标：左手位置 $p_1^{target} = [0.3, 0.2, 1.0]$
- 当前关节角度 $\theta_r = [0.1, 0.2]$（弧度）
- 前向运动学计算：$p_1(\theta_r) = [0.28, 0.22, 1.02]$

计算误差：

$$\| p_1^{target} - p_1(\theta_r) \|^2 = (0.3-0.28)^2 + (0.2-0.22)^2 + (1.0-1.02)^2$$

$$= 0.02^2 + (-0.02)^2 + (-0.02)^2 = 0.0012$$

IK求解器会调整 $\theta_r$，使这个误差最小化。

---

**💻 代码实现(motion_retarget.py)**

```python
# 求解IK
def retarget(self, human_data, offset_to_ground=False):
    # 1. 更新任务目标：将human_data(人体运动数据)转换为IK任务的目标位姿(如末端执行器目标位置姿态)
    # offset_to_ground用于调整目标位姿的地面偏移，确保模型脚不穿地
    # 2. 计算初始误差：当前模型状态与目标位姿的误差(如欧式距离/姿态角偏差)
    curr_error = self.error1()

    # 3. 获取仿真时间步长：控制IK求解的积分精度，通常是固定值
    dt = self.configuration.model.opt.timestep

    # 4. 第一次IK求解：基于当前误差，求解关节速度vel1(核心是解雅可比伪逆)
    # self_tasks1: 第一组优先级最高的IK任务(如根节点位置，脚的位姿)
    # self.solver: 求解器类型(如damped least squares, 阻尼最小二乘，对应self.damping)
    # self.ik_limits:关节角度/速度限制，避免超范围

    vel1 = mink.solve_ik(
        self.configuration,
        self.self_tasks1,
        dt,
        self.solver,
        self.damping,
        self.ik_limits
    )

    # 5. 积分更新关节角度：用求解得到的关节速度更新模型状态（q_new = q_old + vel * dt）
    # integrate_inplace是原地更新，避免复制开销
    self.configuration。intergrate_inplace(vel1, dt)
    next_error = self.error1() # 更新后计算新的误差

    # 6. 迭代优化，通过多次IK求解减小误差，直到满足收敛条件
    num_iter = 0

    # 收敛条件：误差下降量<0.001(精度阈值)或达到最大迭代次数(防止死循环)
    while curr_error - nexterror > 0.001 and num_iter < self.max_iter:
        curr_error = next_error
        vel1 = mink.solve_ik(
            self.configuration,
            self.self_tasks1,
            dt,
            self.solver,
            self.damping,
            self.ik_limits
        )
        self.configuration.integrate_inplace(velt1, dt) # 再次更新关节角度
        next_error = self.error1() # 计算新误差
        num_iter += 1
    
    # 7. 返回优化后的关节角度：copy()避免外部修改影响内部状态
    return self.configuration.data.gpos.copy()
```

`self.tasks1` 存储了每个身体部位的目标位置 $p_i^{target}$，IK求解器通过优化 $\theta_r$ 使 $p_i(\theta_r)$ 接近 $p_i^{target}$。


!!! note
`mink.solve_ik` 底层采用**阻尼最小二乘法（DLS）** 求解关节速度，核心公式为：
$$
\dot{\boldsymbol{q}} = (\boldsymbol{J}^\top \boldsymbol{J} + \lambda^2 \boldsymbol{I})^{-1} \boldsymbol{J}^\top \boldsymbol{v}_{\text{task}}
$$

#### 公式参数解析
| 参数                           | 含义与对应代码                     | 作用说明                                                                                                         |
| ------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| $\dot{\boldsymbol{q}}$         | 求解输出的关节速度（代码中`vel1`） | 最终返回值，用于积分更新关节角度：$\boldsymbol{q}_{new} = \boldsymbol{q}_{old} + \dot{\boldsymbol{q}} \times dt$ |
| $\boldsymbol{J}$               | 任务雅可比矩阵                     | 映射关节速度到任务空间速度，从`self.configuration`中读取模型实时计算                                             |
| $\lambda$                      | 阻尼系数（代码中`self.damping`）   | 避免雅可比矩阵奇异时求解失败，取值通常为$10^{-4} \sim 10^{-2}$                                                   |
| $\boldsymbol{I}$               | 单位矩阵                           | 保证矩阵可逆，维度与$\boldsymbol{J}^\top \boldsymbol{J}$一致                                                     |
| $\boldsymbol{v}_{\text{task}}$ | 任务空间期望速度                   | 由任务误差和时间步计算：$\boldsymbol{v}_{\text{task}} = e / dt$（$e$为位姿误差，$dt$为仿真步长）                 |

!!!

---


📖 **代码工作流程**：

```
输入：人类运动数据（目标位置）

Step 1: update_targets() 
  → 将人类姿态转换为机器人IK任务目标

Step 2: error1() 
  → 计算当前误差（如 0.224）

Step 3: solve_ik() 
  → 求解使误差最小的关节速度（如 [0.01, 0.02, 0.01]）

Step 4: integrate_inplace() 
  → 积分得到新关节角度

Step 5: 迭代
  → 重复Step 2-4直到误差收敛（<0.001）

输出：机器人关节角度数组
```

### 5.6 Step 5: 约束处理与完整算法流程

- 为了处理人与机器人之间的本体差距，我们引入了**具有约束的两阶段重定向管道**
 - 第一阶段：处理主要关节，跟踪具有高跟踪优先级的**末端执行器**(例如手和脚)
 - 第二阶段：精细调整，专注于剩余关节以确保**自然姿态**

📐 **两阶段IK公式**：

第一阶段(高精度任务)

$$
min_{\theta_r}\Sigma_{i\in{high}}||p_i^{target}-p_i(\theta_r)||^2
$$

第二阶段(自然姿态)

$$
min_{\theta_r}\Sigma_{i\in{low}}||p_j^{target}-p_j(\theta_r)||^2 + \lambda||\theta_r - \theta_r^{prev}||^2
$$

- $\lambda||\theta_r - \theta_r^{prev}||^2$的主要作用是防止机器人动作过于僵硬，保证流畅
  - $\theta_r^{prev}$是上一帧的关节角度：如果上一帧习概弯曲30度，这一帧突然弯曲90度，动作就会卡一下，显得非常僵硬
  - $\lambda$是平滑系数，相当于流畅度权重：
    - $\lambda$越大，越要求当前帧的关节角度和上一帧**越接近，动作越顺滑**，但是可能**牺牲一点次要部位的精准度**
    - $\lambda$越小，次要部位越精准，但是**动作可能不会太丝滑**

**约束**

- `joints`:关节限位(防止**关节角度超出物理范围**)
- `self_collision`:自碰撞避免(防止机器人**肢体与自身碰撞**)
- `ground contact`:地面接触(**脚平放在地面上**)

**我们对任务分类和限制的配置文件**

```json
{
    // 第一阶段任务
    "task1": {
        "end_effectors": [
            "left_hand",
            "right_hand",
            "left_foot",
            "right_foot"
        ], 
        "priorty": "high"
    },
    // 第二阶段任务
    "task2": {
        "joints": ["spine", "elbow", "knee"],
        "priority": "low",
        "regularization": 0.1 //这就是说的lambda(平滑正则系数)
    },
    // 全局物理约束
    "constraints": {
        "joints_limits": true,
        "self_collision": true,
        "groud_contact": true
    }
}
```


```python
# 第一阶段:处理末端执行器(高优先级)
if self.use_ik_match_table1:
    curr_error = self.error1() # 只计算高优先级任务的误差
    well = mink.solve_ik(
        self.confiuration,
        self.task1,
        dt, 
        self.solver,
        self.damping,
        self.ik_limits
    )

# 第二阶段:处理剩余关节(低优先级)
if self.use_ik_match_table2:
    curr_error = self.error2() # 计算低优先级任务的误差
    vel2 = mink.solve_ik(
        self.confiuration,
        self.task2,
        dt, 
        self.solver,
        self.damping,
        self.ik_limits
    )
```

## 6. Evaluation Results

### 6.1 实验设置

*三种评估设置(`sim`, `sim-dr`, `sim2sim`)下的成功率*

| 环境 | 评估次数 | 说明 |
|------|----------|------|
| `sim` | 100次 | IsaacSim训练 simulator，无领域随机化 |
| `sim-dr` | 4096次 | 带领域随机化的模拟器 |
| `sim2sim` | 100次 | MuJoCo/ROS跨模拟器迁移 |

![alt text](image-2.png)

### 6.2 跟踪误差指标

*21个动作的跟踪误差统计数据报告*

| 指标 | 全称 | 含义 |
|------|------|------|
| $E_{g-mpbpe}$ | Global Mean Per-Body Position Error | 机器人整体在全局坐标系中的位置与参考运动的差距 |
| $E_{mpbpe}$ | Mean Per-Body Part Position Error | 机器人身体各部位相对于自身重心的位置与参考运动的差距 |
| $E_{mpjpe}$ | Mean Per-Joint Position Error | 机器人每个关节的角度与参考运动中关节角度的差距 |

![alt text](image-3.png)

### 6.3 主要发现

#### Q1: 重定向方法是否影响策略性能？

- **结论：影响显著**
  - Unitree官方数据效果最好
  - GMR和ProtoMotions次之
  - PHC效果最差（如Dance1/Dance2成功率为0%）

#### Q2: 哪些伪影会影响学习？

| 伪影类型 | 原因 | 示例动作 |
|----------|------|----------|
| 地面穿透 | 脚穿过地面（60cm） | PHC+Dance1 |
| 自我交叉 | 腿部相互交叉 | ProtoMotions+Run(stop&go) |
| 关节突变 | 腰部角度瞬间大幅变化 | GMR+Dance5 |

#### Q3: 不同方法的视觉保真度如何？

- 用户研究结果：GMR > ProtoMotions > PHC
- 用户认为GMR更忠于原始运动

---

## 7. 结论

### 7.1 主要贡献

1. 提出GMR方法（非均匀局部缩放 + 两阶段IK）
2. 系统评估了重定向质量对策略性能的影响
3. 证明了默认参数适用于多种动作

### 7.2 局限性

- 数据源单一（仅LAFAN1数据集）
- 仅在Unitree G1上测试
- 未考虑物体交互场景

### 7.3 未来方向

- 扩展到AMASS等其他数据源
- 支持更多机器人平台（如Unitree H1）
- 研究涉及交互的动作序列重定向

---

## 核心公式汇总

| 公式 | 名称 | 作用 |
|------|------|------|
| $p_{target} = s_b \cdot \frac{h}{h_{ref}} \cdot (p_{source} - p_{ref}) + s_b \cdot \frac{h}{h_{ref}} \cdot p_{ref}$ | 非均匀局部缩放 | 将人类运动映射到机器人 |
| $\min_{\theta_r} \sum_{i} \| p_i^{target} - p_i(\theta_r) \|^2$ | IK优化目标 | 最小化位置误差 |
| $\theta_{min} \leq \theta_r \leq \theta_{max}$ | 关节限位约束 | 防止关节超限 |

---

## 代码关键函数

| 函数 | 文件 | 功能 |
|------|------|------|
| `scale_human_data()` | motion_retarget.py | 非均匀局部缩放 |
| `offset_human_data()` | motion_retarget.py | 姿态对齐 |
| `retarget()` | motion_retarget.py | IK求解 |
| `solve_ik()` | mink库 | 阻尼最小二乘求解 |

