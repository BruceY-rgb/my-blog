---
title: 'ReAct: Synergizing Reasoning and Acting in Language Models'
date: '2026-07-05 10:21:47'
authors: >-
  Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan,
  Yuan Cao
venue: ICLR 2023（国际学习表征会议）
tags:
  - ReAct
  - LLM Agent
  - Chain-of-Thought
  - Tool Use
cover: 'https://react-lm.github.io/files/diagram.png'
description: >-
  论文信息 项目 内容 ----------
  --------------------------------------------------------------------------------------
  标题 ReAct: Synergizing Reasoning and Acting in Langu
categories:
  - 科研训练
  - Agent
  - 论文阅读
published: true
legacyPath: 2026/07/05/scientific-research/paper-reading/ReAct/ReAct
sourcePath: scientific-research/paper-reading/ReAct/ReAct.md
---


**论文信息**

| 项目       | 内容                                                                                   |
| ---------- | -------------------------------------------------------------------------------------- |
| **标题**   | ReAct: Synergizing Reasoning and Acting in Language Models                             |
| **作者**   | Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan, Yuan Cao |
| **机构**   | Princeton University; Google Research, Brain Team                                      |
| **会议**   | ICLR 2023                                                                              |
| **GitHub** | https://github.com/ysymyth/ReAct                                                       |
| **主页**   | https://react-lm.github.io/                                                            |
| **原文**   | [论文链接](https://arxiv.org/pdf/2210.03629)                                           |

---

**章节结构**

1. Abstract（摘要）
2. 1. Introduction（引言）
3. 2. ReAct: Synergizing Reasoning + Acting（ReAct 方法）⭐
4. 3. Knowledge-Intensive Reasoning Tasks（知识密集型推理任务）
5. 4. Decision Making Tasks（交互式决策任务）
6. 5. Related Work（相关工作）
7. 6. Conclusion（结论）
8. Appendix（附录：实验细节、Prompts、Trajectories、错误分析）

---

## 0. 阅读方式：论文 + 代码仓库

这篇论文不能只按“论文摘要 -> 方法 -> 实验结果”的方式读。`ReAct` 的贡献本质上是一个可以落地到代码中的 `agent loop`，所以后面的阅读笔记会采用 **文字解释 + 代码对应** 的方式展开。

官方代码仓库：

| 项目 | 链接 |
| ---- | ---- |
| GitHub | https://github.com/ysymyth/ReAct |
| Project Page | https://react-lm.github.io/ |

后续讲解时重点对应下面这些代码位置：

| 论文概念 | 代码位置 | 讲解重点 |
| -------- | -------- | -------- |
| ReAct 的核心循环：`Thought -> Action -> Observation` | `hotpotqa.ipynb` 中的 `webthink()` | 模型如何生成 Thought 和 Action，环境如何返回 Observation，并继续拼回 prompt |
| Wikipedia 外部环境 | `wikienv.py` | `search[]`、`lookup[]`、`finish[]`、`think[]` 这些动作如何被环境解析 |
| HotpotQA / FEVER 任务封装 | `wrappers.py` | 问题、标签、reward、EM/F1 评估如何接入环境 |
| ReAct / CoT / Act-only 的 prompt 差异 | `prompts/prompts_naive.json`、`prompts/fever.json` | 为什么 ReAct 不是简单的 CoT，而是将检索动作和推理轨迹交错 |
| ALFWorld 长程决策 | `alfworld.ipynb`、`prompts/alfworld_3prompts.json` | 稀疏 Thought 如何帮助目标分解、状态追踪和异常恢复 |
| WebShop 网页交互 | `WebShop.ipynb` | `think[]` 如何帮助模型筛选商品、检查选项、决定购买 |

一个最小化的 ReAct 运行逻辑可以概括为：

```python
prompt += question + "\n"

for i in range(1, max_steps):
    thought_action = llm(prompt + f"Thought {i}:")
    thought, action = parse(thought_action)

    observation, reward, done, info = env.step(action)

    prompt += (
        f"Thought {i}: {thought}\n"
        f"Action {i}: {action}\n"
        f"Observation {i}: {observation}\n"
    )

    if done:
        break
```

这段伪代码对应论文中的核心思想：**语言模型不是一次性给出答案，而是在环境反馈中不断更新自己的推理轨迹和行动计划。**

---

## 1. Abstract（摘要）

大语言模型在两类能力上表现比较好

- `reasoning`:推理能力，比如`chain-of-thought`，让模型一步步写出中间推理过程
- `acting`:：行动能力，比如让模型调用搜索、浏览网页、操作环境和执行任务

但是在`ReAct`框架提出之前，这两件事情大多数是分开研究的

- `CoT`关注模型是怎么想的
- `WebGPT/SayCan/text-game-agent`关注模型怎么行动
- `ReAct`关注的是 **能不能让模型一边想，一边行动**

> 这就是标题中提到的`Synergizing Reasoning + Acting`,也就是把推理和行动协同起来


**ReAct的核心思想**：模型以`interleaved manner`生成`reasoning traces`和`task-specific actions`,也就是交错产生

```
Thought 1 -> Action 1 -> Observation 1
Thought 2 -> Action 2 -> Observation 2
Thought 3 -> Action 3 -> ...
```

而普通的`CoT`是:`Question -> Thought -> Answer`

所以`ReAct`不是单纯 **让模型想得更详细**，而是 **让模型的思考过程被环境反馈不断修正**

<aside class="admonition note">
**Thought和Action分别解决什么问题**：
`reasoning traces`有几个作用
- `induce action plans`:生成行动计划
- `track action plans`:追踪当前计划执行到哪一步
- `update action plans`:根据新观察更新计划
- `handle exceptions`:处理异常情况

`Action`的作用**是让模型接触外部世界**：
- 查找`Wikipedia`(调用Wikipedia API)
- 点击网页
- 搜索商品

总结起来就是：`Thought`负责想清楚，`Action`负责拿到新信息或改变环境
</aside>
`ReAct`的核心贡献不是提出新的模型结构，而是提出了一种让大模型同时具备推理和行动能力的交互范式。它让模型在任务执行过程中交替生成`Thought`,`Action`和`Observation`,从而既能利用语言推理进行计划、状态追踪和异常处理，又能通过外部环境获取新的信息，减少纯`CoT`种常见的幻觉和错误传播问题。从今天的`Agent`视角看，`ReAct`可以被看做许多工具调用型LLM Agent的基础模板；模型不再只是生成答案，而是在一个循环中持续观察、思考和行动

## 2. 引言

这里作者提出了一个核心观点：`A unique feature of human intelligence is the ability to seamlessly combine task-oriented actions with verbal reasoning`。也就是说人类解决复杂问题时，本来就不是只想不做或者只做不想，而是不断在 **语言化思考**和 **外部行动**之间切换

<aside class="admonition example">
作者举了这样一个例子，人类在两个特定的动作之间，
- 我们会进行`reason in language`来进行进度追踪：我已经切好菜了，下一步该烧水。
- `handle exceptions`或者`adjust the plan`根据所处的`situaion`：没有盐，那我可以用酱油和胡椒替代。
- `realize when external information is needed`：我不知道怎么和面团上网查一下
</aside>
这个例子是形象且重要的，三个场景分别就对应着

- `Thought`:规划下一步做什么
- `Action`:与外部环境交互
- `Observation`:观察产生的结果得到信息并根据新信息改变计划

### 2.1 **为什么CoT不够**

它的有时是可以让模型写出中间推理步骤，但是存在一个根本问题：**CoT的推理是封闭的**

也就是说，模型只能依赖自己参数中的内部只是，如果内部只是错了、过时了或者问题需要外部信息，`CoT`仍然会一本正经地继续推理

这就会导致两个严重的问题：

- `hallucination`:编造事实
- `error propogation`:前面一步错了，后面一直沿着错误方向推

这也是为什么论文在 HotpotQA 和 FEVER 里特别强调 Wikipedia API。ReAct 让模型不只是“自己想”，而是能搜索、查找、再根据观察结果继续推理。代码的对应动作实际上也就是

```python
search[entity]
lookup[keyword]
finish[answer]
```

### 2.2 **为什么Act-Only也不够**

一些研究也在尝试让语言模型直接行动，比如网页浏览、机器人规划、文本游戏等

流程大概是`Observation -> Action -> Observation -> Action`

但是这种方法缺少推理过程会导致模型可以执行动作，但是不一定知道自己为什么执行这个动作，也不一定能维护长期目标

<aside class="admonition example">
在`ALFWorld`中，任务是`put a clean lettuce in diningtable`

- `Act-only`可能会找到`lettuce`,也可能会去`sinkbasin`，但是它容易忘记
  - 我是否已经拿到了`lettuce`
  - `lettuce`是否已经`clean`
  - 下一步应该回`diningtable`还是继续搜索
  - 动作失败之后应该怎么做？更换策略还是重复执行

模型会在需要规划或者更新状态的时候产生类似

```
think: Now I take a lettuce. Next, I need to go to sinkbasin and clean it.
```

这就是论文中提到的`sparse reasoning traces`
</aside>
所以对于长程任务，`Thought`承担了**工作记忆**和**子目标管理**的功能

### 2.3 ReAct的核心主张

引言中最关键的主张就是 **Reason to act, and act to reason**

也就是

- 用推理来指导行动：想清楚下一步要做什么
- 用行动来支持推理：通过搜索、观察、环境反馈等

所以`ReAct`的结构不是简单的`CoT+Tool Calling`，而是一个闭环：`Thought -> Action -> Observation -> Thought -> Action -> Observation`

这个闭环的代码逻辑是

```python
thought_action = llm(prompt + f"Thought {i}:")
obs, r, done, , info = step(env, action)

prompt += (
    f"Thought {i}: {thought}\n"
    f"Action {i}: {action}\n"
    f"Observation {i}: {obs}\n"
)
```

## 3. ReAct: Synergizing Reasoning + Acting

> 核心方法

这一届是整篇论文最重要的部分，它回答了一个问题：**ReAct到底在技术上做了什么？**

简单说：`ReAct`把`LLM Agent`的动作空间扩展了，模型不知能执行外部工作，还能生成语言化的`Thought`，并把这个`Thought`**放回上下文**，影响后续行动

### 3.1 普通agent的形式化

在时间步`t`，agent从环境得到观察：$o_t$

然后根据已有上下文选择动作：$a_t ~ π(a_t | c_t)$

其中上下文是之前所有观察和动作的历史：$c_t = (o_1, a_1, o_2, a_2, ..., o_t)$

普通agent的流程是`Observation -> Action -> Observation -> Action -> ...`

问题是，如果当前任务需要复杂推理，直接从$c_t$映射到$a_t$很难

<aside class="admonition example">
模型看到`Wikipedia`的几段搜索结果，必须判断下一步应该是

- 继续搜索哪个实体
- `look up`哪个关键词
- 是否移进可以`finish`
- 当前证据是否足够
</aside>
如果没有显式推理它就很容易直接乱选动作

### 3.2 ReAct的关键：扩展动作空间

$$
A_{hat} = A \cup L
$$

- `A`是真实动作空间，比如`searh()`,`lookup()`,`click()`,`goto ...`
- `L`是语言空间，也就是`Thought`
- $A_{hat}$是扩展后的动作空间

它意味着`Thought`在`ReAct`里面不是解释文本，而是`agent`本身的一个行为动作

但是`Thought`和普通动作不同

|类型|是否改变外部环境|作用|
|--|--|--|
|`Action`|会|搜索、点击、移动|
|`Thought`|不会|规划、记忆、判断、更新策略|

所以`Thought`的本质是：**不改变世界，但改变agent自己的上下文**

```python
if action.startswith("search["):
    ...
elif action.startswith("lookup["):
    ...
elif action.startswith("finish["):
    ...
elif action.startswith("think["):
    self.obs = "Nice thought."
```

也就是说`search()`,`lookup()`,`finish()`会真正影响到任务状态，而`think()`只是一个`no-op`风格的思考动作· 
