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

## 5. Agile Development(敏捷开发)

- **核心思想**：通过短周期交付和增量式适应变化来管理不确定性

!!! note "如何创建敏捷过程来管理不确定性"
- **敏捷不需要在前期一次性完整需求收集，而是通过不断爹地啊、持续沟通来完善需求**
- **敏捷不是要求先做完整风险分析，然后再做计划**，而是要强调 **边做边反馈、边交付边调整**
- 软件增量必须在短时间周期内交付
- 软件过程必须以增量方式适应变化
!!!

### 5.1 敏捷宣言(`Agile Manifesto`)

**更重视**

- 个人和交流(`individuals and interactions`)
- 可工作的软件(`working software`)
- 客户合作(`customer collaboration`)
- 响应变化(`responding to change`)

> **敏捷不只是项目团队快速响应变化的能力**

**也认可**

- 过程和工具(`processes and tools`)
- 宽泛的文档(`comprehensive documentation`)
- 合同谈判(`contract negotiation`)
- 遵循计划(`following a plan`)

### 5.2 12条敏捷原则

1. **最高优先级**：通过尽早、持续地交付有价值的软件来满足客户
2. **欢迎变化需求**：即使是在开发后期，敏捷过程利用变化为客户创造竞争优势
3. **频繁交付可工作的软件**：建个几周到几个月，越短越好
4. 业务人员和开发人员必须每天一起工作
5. 围绕有动力的个人构建项目
6. 面对面交谈是最有效的传达信息的方式
7. **可工作的软件**是衡量进度的主要标准
8. 敏捷过程促进可持续发展
9. 持续关注技术卓越和良好设计
10. 简单性——尽量减少不必要工作的艺术——至关重要
11. 最好的架构、需求和设计来自 **自组织团队**
12. 团队定期反省如何变得更有效，并相应调整行为

!!! note
将敏捷性应用于软件过程

- 只生产必要的工作产品
- 流程允许团队简化任务(`streamline tasks`)
- 使用增量产品交付策略
!!!

### 5.3 XP(极限边编程)——最广泛使用的敏捷方法

- **Planning**：创建用户故事 (User stories) → 评估成本 → **分组为可交付增量** → 使用"项目速度"估算
- **Designing**:KIS(Keep It Simple) 原则；CRC 卡识别和组织类；对困难问题创建"尖峰解决方案" (spike solution)/原型；鼓励重构 (refactoring)
- **coding**:
  - 编码前先写单元测试(`Unit tests before coding`)
  - **结对编程**(`Pair programming`)
  - 连续集成(`Continuous integration`)
- **Testing**:
  - 所有单元测试每天执行
  - **验收测试**(`Acceptance tests`)由客户规定技术条件

> XP中,`metaphor`被用作促进客户、团队成员和经理之间通信的设备

### 5.4  Scrum框架

- **Backlog**(待定项)：为用户提供商业价值的项目需求或者特性优先级列表，可以随时加入新项
- **Sprint**(冲刺)：预定时段内(通常30天)完成的工作单元，**过程中不允许变更**
- **Daily Scrum**(每日例会)：15min，成员回答三个问题
- **Scrum Master**:教练角色，确保`Scrum`实践被正确执行

**每日例会三问题**

> 要掌握

- 自上次会议以来完成了什么
- 遇到了什么困难
- 下次会议前计划做什么'


> **关键判断**
>
> - 敏捷重视**可工作的软件**作为进度的主要标准
> - 可工作的程序不是敏捷中的唯一交付物(还有用户故事、backing、测试、设计说民、文档、原型、发布计划等)
> - `Agile`过程中最高优先级是通过**尽早持续交付有价值的软件**来满足客户

### 5.5 一些碎考点

- `Agile Modeling`在分析和设计中为实践者提供指导
- `Agile Unified Process`使用经典的`UP`阶段活动(`inception,elaboration,construction,transition,production`)来帮助团队可视化整个流程
- `Dynamic Systems Development Method, DSDM`:基于`Pareto principle`的软件开发思想：一个应用中大约80%的有用功能可以用开发完整应用所需时间的20%开发(基于该原则，应用中80%的功能可以在构建完整应用所需时间的20%交付)

## 6. Human Aspects

### 6.1 优秀软件工程师的特质

> 考

- 个人责任感
- 注意细节(`Attentive to details`)
- 善于沟通和协作
- `Brutally honest`
- `Resilient under pressure`

### 6.2 有效的软件团队属性

- 目标感
- 参与感
- 信任感
- 团队多样性
- 自我组织

### 6.3 团队毒性因素(`Team Toxicity`)

- `Frenzied work atmosphere`
- `Inadequate budget`
- `Poor communication`
- 缺乏明确的角色和责任

> **`Poorly coordinated software process`**

### 6.4 一些考点

- 允许敏捷团队自行组织并做出自己的技术决策
- 使用云服务可以加速软件团队成员之间的信息共享
- 使全球软件团队决策复杂化的因素
  - 问题的复杂性
  - 对问题的不同看法
  - 意外后果的法律
  - 与决策相关的风险

## 7. Principles that Guide Practice

**核心原则**

1. `KISS`:简单设计
2. `Travel Light`:不要创建超出需要的模型
3. 关注点分离：将复杂问题分解为更容易管理的部分
4. **抽象**：每次只关注一个表示层级
5. 软件系统存在的唯一目的就是为用户提供价值

- 软件工程原则相对稳定且长期有效，具体工具和技术可能快速变化；软件工程原则本身不会有半衰期
- 迭代客户沟通和协作的`agile view`适用于所有软件工程实践
- 项目计划被采纳之后依然可以不断修改
- 需求模型描述了`information.function,behavior`
- 设计模型可以可以溯源到需求模型
- **`refactorign`不属于良好编码的原则**，更偏向于代码的改进
- 手机有关交付软件客户反馈的正当理由
  - 允许开发人员对交付的增量进行更改
  - 可以修改交货时间表以反映变化
  - 开发人员可以识别要纳入下一个增量的变更

## 第八章 Understanding Requirements

### 8.1 需求工程任务

- 起始(`Inception`):建立对**问题、参与人员、解决方案性质**的基本理解
- 获取/启发(`Elicitation`):询问客户/用户系统目标、业务要求、日常使用
- 细化(`Elaboration`):扩展和提炼信息，开发精确的需求模型
- 协商(`Negotiation`):排序需求，评估成本和风险，化解冲突
- 规格说明(`Specification`):以文档、图形模型、数学形式、用例、原型或组合描述
- 确认(`validation`):对需求工程工作产品进行质量评估
- 需求管理(`Requirements Management`):帮助项目组标识、控制和跟踪需求以及变更
- 监控(`Monitoring`):跟踪需求状态变化

!!! note 
在项目开始期间，任务的目的是确定

- 基本问题的理解
- 所需解决方案的性质
- 想要解决方案的人
!!!

### 8.2 QFD 质量功能部署 — 三种需求类型

| 需求类型     | English               | 定义                                           | 示例                   |
| ------------ | --------------------- | ---------------------------------------------- | ---------------------- |
| **正常需求** | Normal requirements   | 明确写在需求文档中的要求                       | 建一个漂亮的博物馆模型 |
| **期望需求** | Expected requirements | 未明确写出的隐含需求，成熟软件应当实现         | 运行流畅、软件安全     |
| **兴奋需求** | Exciting requirements | 超出预期的功能，不实现不影响功能但大幅提升体验 | 特别精细的建模         |

### 8.3 利益相关者 (Stakeholders)

至少应识别三类：用户 (users)、客户 (customers)、开发者 (developers)、项目经理 (managers)、测试人员 (testers)

### 8.4 非功能性需求 (Non-Functional Requirements, NFR)

- 安全性 (Security)
- 可用性 (Usability)
- 可靠性 (Reliability)
- 性能 (Performance)
- 可维护性 (Maintainability)

### 8.5 需求确认要关注的方面

- **一致性 (Consistency)** — 需求之间没有冲突
- **遗漏 (Omissions)** — 没有遗漏的需求
- **模糊性 (Ambiguity)** — 需求没有歧义

## 第9章 需求建模：基于场景的方法 (Scenario-Based Methods)

### 9.1 四种需求模型

| 模型类别                                | 内容                                     |
| --------------------------------------- | ---------------------------------------- |
| **Scenario-Based Models（基于场景的）** | 用例图、活动图、泳道图 — 从用户视角描述  |
| **Class-Based Models（基于类的）**      | 类图、CRC卡 — 表示系统操作的对象及其关系 |
| **Behavioral Models（行为模型）**       | 状态图、顺序图 — 系统如何响应事件        |
| **Flow-Oriented Models（面向流的）**    | 数据流图 (DFD)                           |

### 9.2 Use Case (用例)

用例描述了一个角色(actor)与系统之间的交互，定义了系统为角色提供的可观察结果。

#### 用例关键要素

| 要素                          | 说明                     |
| ----------------------------- | ------------------------ |
| **Actor（角色/参与者）**      | 与系统交互的人或外部系统 |
| **Goal（目标）**              | 用例的目的               |
| **Pre-condition（前置条件）** | 用例开始前必须满足的条件 |
| **Trigger（触发器）**         | 启动用例的事件           |
| **Scenario（场景）**          | 正常流程（基本流）       |
| **Exceptions（异常）**        | 备选流程                 |
| **Priority（优先级）**        | 重要程度                 |

#### 用例图三大要素

1. **角色 (Actor)** — 系统方框外，用小人表示
2. **用例 (Use Case)** — 系统方框内，用椭圆表示
3. **关系/第三方系统** — 连线表示关联

#### 用例关系

- **&lt;<include>&gt;** — 一个用例总是包含另一个用例的行为
- **&lt;<extend>&gt;** — 一个用例在特定条件下扩展另一个用例

### 9.3 Activity Diagram (活动图)

- 通过动作流的图形表示来补充用例
- 表示业务流程中的活动序列

### 9.4 Swimlane Diagram (泳道图)

- 活动图的一种变体
- 指示**哪个参与者或分析类**负责哪个活动
