---
title: Learning Human Project
categories:
    - 科研训练
    - 运动数据采集
    - 索引
tags:
    - SMLP
cover: https://www.daisch.com/upload/Plupload/Img_644/20250107161046545.jpg
---

这是一个虚拟人类（Virtual  Human）工具和代码示例的学习项目，专注于人体参数化模型（SMPL系列）。以下是该项目的学习路径规划：

---
# 项目定位

这是一个人体运动研究的入门教程，涵盖从基础数学（3D旋转表示）到高级参数化人体模型（SMPL/SMPL-X）的完整知识体系。项目重度依赖 ez4d 库。

!!! tip 
**项目仓库**：<https://github.com/IsshikiHugh/LearningHumans>
!!!

---
# 学习路径规划

第一阶段：数学基础（1-2周）

| 顺序 | 内容         | 资源                                    |
| ---- | ------------ | --------------------------------------- |
| 1    | 3D旋转表示   | notebooks/rotation_representation.ipynb |
| 2    | 线性代数复习 | PyTorch 基础 tensor 操作                |

目标：理解四元数(quaternion)、旋转矩阵(rotation matrix)、轴角(axis-angle)等表示方法

---
第二阶段：骨骼系统（1周）

| 顺序 | 内容         | 资源                               |
| ---- | ------------ | ---------------------------------- |
| 1    | 抽象骨骼     | notebooks/abstract_skeletons.ipynb |
| 2    | 骨骼层级结构 | ez4d.kinematics.abstract_skeletons |

目标：理解人体骨架的层级结构、关节连接、FK/IK基础

---
第三阶段：参数化人体模型（2-3周）

这是核心内容，按顺序学习：

| 顺序 | 内容      | 资源               | 关节点数            |
| ---- | --------- | ------------------ | ------------------- |
| 1    | SMPL 基础 | SMPL_basic.ipynb   | 24 joints           |
| 2    | SMPL-H    | SMPLH_basic.ipynb  | + hands (52 joints) |
| 3    | SMPL-X    | SMPLX_basic.ipynb  | + face (55 joints)  |
| 4    | SMPL 细节 | SMPL_details.ipynb | 深入理解            |
| 5    | SKEL      | SKEL_basic.ipynb   | 另一种表示          |

目标：掌握人体参数化模型的原理、加载、渲染、姿态控制

---
第四阶段：动作识别相关扩展（2-4周）

在掌握基础后，需要补充以下知识用于大模型研究：

| 方向        | 内容                     | 推荐资源       |
| ----------- | ------------------------ | -------------- |
| 数据处理    | AMASS、BVH等动作数据格式 | 搜索相关数据集 |
| 姿态估计    | 从图像/视频估计SMPL参数  | SPIN、EMDB等   |
| Transformer | 动作序列建模             | attention机制  |
| 扩散模型    | 动作生成                 | MDM、MDM等论文 |

---
第五阶段：实践与项目（持续）

# 建议的实践路线
1. 运行所有notebook，理解每行代码
2. 尝试修改参数，观察输出变化
3. 结合ez4d库，做一个小项目（如：动作分类）
4. 深入大模型：学习MotionGPT、ActAny等前沿工作

---
### 核心依赖库

ez4d          # 项目核心库 (https://github.com/IsshikiHugh/ez4d)
smplx         # SMPL系列模型
torch         # 深度学习框架
torchgeometry # 几何计算
wis3d         # 3D可视化

---
### 建议的学习顺序

```
rotation_representation.ipynb
    ↓
abstract_skeletons.ipynb
    ↓
SMPL_basic.ipynb
    ↓
SMPLH_basic.ipynb
    ↓
SMPLX_basic.ipynb
    ↓
SMPL_details.ipynb
    ↓
SKEL_basic.ipynb
```

---
### 人体动作识别大模型相关知识图谱

```
人体动作识别大模型
    │
    ├── 基础表示层
    │   ├── 骨骼坐标 (joint positions)
    │   ├── 旋转表示 (rotations)
    │   └── SMPL参数 (β, θ)
    │
    ├── 特征提取层
    │   ├── 图神经网络 (GNN)
    │   ├── Transformer
    │   └── CNN/LSTM
    │
    ├── 模型层
    │   ├── 动作分类模型
    │   ├── 动作生成模型 (扩散模型)
    │   └── 多模态模型 (文字→动作)
    │
    └── 数据集
        ├── AMASS (大规模动作库)
        ├── HumanAct12
        └── NTU-RGBD
```
---
