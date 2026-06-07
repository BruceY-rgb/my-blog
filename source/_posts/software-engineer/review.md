---
title: 软件工程分章系统学习笔记
date: 2026-06-02 17:40:00
cover: https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1920
categories:
  - CS课程笔记
  - 软件工程
tags:
  - 软件工程
---

## 第一章 The Nature of Software

### 1.1 什么是软件

软件是构成一个配置的**一系列元素或者对象的集合**，主要包括：

- **指令**(计算机程序)：`Instructions`(`Computer Program`)
- **数据结构**
- **文档**

### 1.2 软件 VS 硬件

| 对比维度 | 软件 (Software)                          | 硬件 (Hardware)                      |
| -------- | ---------------------------------------- | ------------------------------------ |
| 生产方式 | 工程化**开发**的（engineered/developed） | 传统意义上**制造**的（manufactured） |
| 退化方式 | **不磨损**，但会**退化**（`deteriorate`）  | 会**磨损**（`wear out`）               |
| 故障曲线 | 变更引入错误导致退化                     | 浴盆曲线（早期故障→稳定→磨损）       |

**关键考点**

- 软件不能用和工程制品相同的制造技术来制造
- 硬件成本不再是现代软件工程师关注的最核心的问题
- 软件退化是因为**多个变更请求在组建交互中引入错误**(`Multiple change requests introduce errors in component interactions`)

### 1.3 现代软件工程师的核心关注点


- 软件开发成本(`Software development cost`)
- 开发时间(`Development time`)
- 软件错误/缺陷(`Software errors/defects`)
- 软件质量(`Software quality`)
- 软件维护(`Software maintenance`)

> **硬件成本已经不再是核心问题**

### 1.4 Legacy Software(遗留软件)为什么要演变

- 必须适应新的计算环境或技术
- 必须增强以实现新的业务需求
- 必须扩展与其他现代系统或数据库交互操作
- 必须重新构建以在网络环境中可行

### 1.5 WebApps

`WebApps`是运行在`Web`环境中的应用程序(在线购物、在线文档、博客系统等)

- `WebApps`**没有超出**软件工程实践的范围
- `WebApps`也需要：**需求分析、系统设计、测试**

### 1.6 WebApp VS MobileApp

||WebApp|MobileApp|
|---|---|---|
|访问方式|浏览器访问|安装在手机上|
|跨平台|能力强|需要适配不同的系统|
|系统能力|有限|可调用相机、GPS、推送通知、传感器等|
|更新|方便(服务端更新)|需要用户升级|

> **创建WebApp和MobileApp之间有真实区别**

### 1.7 云计算

用户通过网络访问远程计算资源、存储资源和软件服务。最简单的形式中，外部计算设备用 **Web浏览器**访问云数据服务

### 1.8 产品线软件

产品线软件开发依赖于现有软件组件的 **复用**(`reuse`)，以提供**工程杠杆作用**(`engineering leverage`)

### 1.9 软件应用类型

1. System software（系统软件）
2. Application software（应用软件）
3. Engineering/scientific software（工程/科学软件）
4. Embedded software（嵌入式软件）
5. Product-line software（产品线软件）
6. Web applications（Web应用）
7. Artificial intelligence software（人工智能软件）


## 第二章 Software Engineering

### 2.1 软件工程的分层结构(`A layered Technology`)

```
┌──────────────┐
│   Tools      │ 工具层 → 为过程和方法提供自动化或半自动化支持
├──────────────┤
│   Methods    │ 方法层 → 提供技术上的"如何做"（沟通、需求分析、设计、
│              │           编程、测试、技术支持）
├──────────────┤
│   Process    │ 过程层 → 基础，将各技术层次结合在一起，是管理控制的基础
├──────────────┤
│  Quality Focus│ 质量关注点 → 整个软件工程的根基 (bedrock)
└──────────────┘
```

> **关键考点：Manufacturing不是软件工程的层次之一**

### 2.2 通用过程框架(`Generic Process Framework`)

五个框架活动，适用于**所有软件项目**，无论规模和复杂度

- 沟通(`Communication`):与客户/利益相关者交流，理解项目目标、收集需求
- 策划/规划(`Planning`)：定义技术任务、评估风险、资源需求、制作进度计划
- 建模(`Modeling`):包含 **需求分析`analysis`**和 **设计`design`**
- 构建(`Construction`):包含 **编码**和 **测试** 
- 部署(`Deployment`):交付软件给用户、手机反馈并评估

### 2.3 伞形活动(`Umbrella Activities`)

**贯穿整个软件过程**，不是只在初期使用(关键判断)：

- `Software project tracking and control`:根据计划评估进度，采取措施保持正轨
- `Risk management`:评估可能影响项目或产品质量的风险
- `Software quality assurance`(`SQA`):确定和执行**保证软件质量所需要的活动**
- `Technical reviews`：评估产品，在错误传播到下一个活动前发现和清除
- `Measurement`:定义和收集过程、项目及产品的度量
- `Software configuration management`(`SCM`)：管理变更带来的影响
- `Reusability management`:定义**复用标准**，**建立构建复用机制**
- `Work product preparation and production`:创建产品(模型、文档、数据等)所必需的活动

### 2.4 通用原则(`Hooker's General Principles`)

1. `The reason it all exists`:软件系统存在的理由是为用户提供价值
2. `KISS(Keep It Simple, Stupid)`:保持简单
3. `Maintain the vision`:保持清晰的愿景
4. `What you produce, others will consume`:你生产的，别人会消费
5. `Be Open to the Future`:面向未来设计
6. `Plan Ahead for Reuse`:提前规划复用
7. `Think!`:思考清楚再行动

### 2.5 软件工程实践的本质

1. 理解问题(`Understand the problem`)
2. 制定计划(`Plan a solution`)
3. 执行计划(`Carry out the plan`)
4. 检查结果准确性(`Examine the result for accuracy`)

## 第三章 Software Process Structure

> **人们普遍认为不能拥有薄弱的软件流程还能创造出高质量的最终产品**

### 3.1 过程定义

软件过程值工作产品构建时所执行的一系列 **活动**(`activities`)、**动作**(`actions`)和 **任务**(`tasks`)的集合

### 3.2 四种过程流

- 线性过程流(`Linear`):按顺序依次执行五个框架活动
- 迭代过程流(`Iterative`):在进入下一个活动前重复执行一个或多个活动
- 演化过程流(`Evolutionary`):以循环方式执行活动，每个循环产出更完善的版本
- 并行过程流(`Parallel/concurrent`):同时执行一个或多个活动

### 3.3 过程模式

过程模式描述在软件开发中遇到的与过程相关的问题以及解决方案

- `initial context`:描述模式适用的条件
- `problem`:描述模式解决的具体问题
- `solution`:描述如何实现模式
- `resulting context`:描述模式实现后的结果
- `related patterns`:列出与该模式相关的其他模式
- `known uses/examples`"该模式的实际应用

### 3.4 过程评估标准

- `CMMI`:能力成熟度模型集成(`Capability Maturity Model Integration`)，6个等级
- `ISO 9001:2000`：指令管理体系在软件中的应用标准
- `SPICE`:软件过程改进和能力测定(`Software Process Improvement and Capability Determination`)

> - **不能拥有薄弱的软件过程而创造高质量的最终产品**
>
> - **优秀团队不是为每个项目都使用相同的任务集**

## 第四章 Process Models

### 4.1 Waterfall Model

又称为经典生命周期(`Classic Life Cycle`)，提出系统、顺序的软件开发方法

- 使用条件：**需求明确定义**(`well defined`)
- 优点：有利于大模型软件开发中的人员组织管理，提高质量和效率
- 缺点：过于理想，缺乏灵活性；客户难以一开始就描述所有需求；客户需求等到项目尾声才能看到可执行程序
- 本质：**线性顺序模型**

> **瀑布模型不是一种很少使用的老式模型。也不是用于大型团队的最佳方法**

### 4.2 V-Model

- 改进瀑布模型，描述质量保证动作与各阶段的关系
- 核心：开发和测试活动 **并行**(`parallel`).几乎同时开始
- 缺点：错误发现时间较晚

### 4.3 Incremental Model

- 每个增量都提交一个可运行的产品
- 适用：需要**快速交付核心工作产品**(`a working core product is required quickly`)
- 要求软件体系结构必须是开放的

### 4.4 Evolutionary Model

- 本质上是 **Iterative in nature**
- 可以轻松适应（`accommodate`）产品变化要求的变化
- 一般不生产一次性系统(`throwaway systems`)

**原型模型`Prototyping`**

- 适用：客户 **无法明确定义需求**
- 缺点
  - 客户可能想把原型当工作产品
  - 开发者可能为**快速构建**使用*不合适的算法/工具*

**螺旋模型`Spiral Model`**

- 核心特征：每次迭代包含 **项目风险评估**
- 兼顾了原型的迭代特征和瀑布模型的系统化控制
- 适用于 **大型、昂贵**的系统软件

### 4.5 Concurrent Development Model


> 是`concurrent engineering`的另一个名称

- 所有活动 **并行但处于不同状态**
- 定义 **事件**来触发工程活动状态转换(`state transitions`)
- 表示任何过程模型的迭代和并发元素

### 4.6 统一过程(`Unified Process`)

**特征**

- `use-case driven`
- `architecture-centric`
- `iterative and incremental`
- `tightly aligned with UML`

**五个阶段**

```
Inception → Elaboration → Construction → Transition → Production
```

> **Validation phase不是统一过程定义的阶段名称**

### 4.7 其他模型

- `Component-Based Development`:依赖**对象技术**(`object technologies`)支持
- `Formal Methods Model`：利用数学方法定义基于计算机的系统的规范、开发无缺陷系统(`detect free computer-based systems`)、验证正确性
- `Personal Software Process`(`PSP`):
  - 强调个人测量
  - `Practitioner`可以控制质量,并负责估计和测量(`estimate and schedule`)
  - **不需要项目经理的仔细监督**
- `Team Software Process`(`TSP`)：
  - 目标是**建立自导软件团队(`self-directed  teams`)**
  - 允许训练有素的专业人员提供更好的 **时间管理**
  - **不会加速软件过程改进也不需要向manager展示如何降低成本和保持质量**

### 4.8 核心关键词速记

|模型|关键词|
|-|-|
|Waterfall|需求明确、线性|
|V-Model|并行、测试同步|
|Incremental|核心产品快速交付|
|Prototyping|需求模糊|
|Spiral|风险分析|
|Concurrent|状态转换、事件触发|
|UP|用例驱动、架构为中心|
|CBD/Component-Based Development|对象技术|