---
title: 'ContractBench: Can LLM Agents Preserve Observation Contracts?'
date: '2026-07-13 10:00:00'
authors: icheng Wang，Yifeng He，Zili Wang，Hanwen Xing，Arkaprava De，Hao Chen
venue: arXiv
tags:
  - Observation Contracts
cover: 'https://pic2.zhimg.com/v2-5028304e998fa00e06e673036e25e873_1440w.jpg'
description: >-
  这篇论文研究的是： LLM Agent在调用API/工具时能不能正确保存和使用工具返回的关键中间结果 。这些中间结果包括presigned
  URL、session token、OAuth state 等.作者把它们叫做 observation contracts ，也就是观察契约
  这里的契约主要有两个要求： 1. 时间
categories:
  - 科研训练
  - Agent
  - 论文阅读
published: true
legacyPath: 2026/07/13/scientific-research/paper-reading/ContractBench/ContractBench
sourcePath: scientific-research/paper-reading/ContractBench/ContractBench.md
---

这篇论文研究的是：**LLM Agent在调用API/工具时能不能正确保存和使用工具返回的关键中间结果**。这些中间结果包括presigned URL、session token、OAuth state 等.作者把它们叫做`observation contracts`，也就是观察契约

这里的契约主要有两个要求：

1. 时间上不能失效：比如`token`或链接有效期，`Agent`必须在过期之前使用
2. 内容上不能改动：比如`URL`、`token`、签名参数是必须原样传递，不能重新编码、阶段、改字符、乱排序

论文的核心问题是：**现在的大模型Agent不只是会调用工具，还要能严格遵守这些中间结果的使用规则**

为此，作者提出了`ContractBench`，一个专门测试这类能力的`benchmark`。它有33个任务，主要测试两类失败

- `validity failure`：东西过期了采用
- `integrity failure`:东西还没有过期，但是被`Agent`改坏了

评测方式比较严格，它不用人工打分，也不用LLM当裁判，而是用程序自动评判。时间用虚拟始终控制，内容完整性用SHA-256 哈希检查

整篇文章最重要的四个实验结论分别是

- 没有模型超过 80% 成功率。即使最好的 Claude Opus 4.6 也只有 77.8%，说明前沿模型也还不稳定。
- Qwen 3.5 出现能力跳变。4B 模型是 0%，9B 突然到 56.6%，说明这种能力可能是某个规模或训练阶段后才突然出现的。
- 模型变新不一定更好。GPT-5 系列里出现了回退，说明后训练可能会削弱这种“严格遵守契约”的能力。
- 失败标签有帮助。如果告诉模型它上次错在哪里，比如 token 被改了、链接过期了，它下一次有一定概率改正。

所以摘要的核心意思概括起来就是：**LLM Agent现在还不能稳定地像真实软件系统一样，按时、原样、可靠地使用API返回的关键中间结果**

## 1. Introduction

### 1.1 Background

> LLM Agent正在进入真实人物

现在的LLM不再只是聊天工具，而是会在真实环境里行动，比如调用API、浏览网页、执行shell命令、读写文件等。它们每一步都会根据环境反馈继续决定下一步。

所以问题变成：**Agent不仅要理解任务，还要可靠地执行任务**

如果`Agent`在真实系统里面做错一步，可能会导致流程失败、数据库损坏、甚至产生不可逆后果

### 1.2 现有benchmark的不足

接着作者回顾了一些已有`agent benchmark`比如`WebArena`,`WE-bench、ToolBench、AgentBench、TravelPlanner、τ-bench、Terminal-Bench

这些 benchmark 确实已经把 Agent 放进真实或接近真实的环境里评测，但作者认为它们漏掉了一个关键点：**现有benchmark通常只看最后任务有没有万恒，而不太检查中间步骤返回的东西有没有被正确保留**

比如工具返回一个 URL、token、state 参数，很多 benchmark 只把它当成“信息”。只要 Agent 最后完成任务，中间怎么转述、总结、复制，通常不会被单独惩罚。

但真实 API 不是这样。真实 API 里，中间结果经常不是普通文本，而是后续步骤必须严格遵守的对象

### 1.3 Observation Contract

> 这是整篇论文的核心概念

简单说就是：工具返回了一个中间`artifact`，而这个`artifact`后续怎么用，是被外部系统严格约束的

<aside class="admonition example">
`presigned S3 URL`这个URL有两个要求
- 必须在过期前使用
- URL里的签名参数必须原样保留，不能阶段、重新编码、该顺序
</aside>
`Agent`可能完全理解用户目标，也调用了正确的API，但是如果它把URL用晚了，或者复制时改坏了，整个任务还是会失败

作者想说的是：**会调用工具，不等于会遵守工具返回结果的使用契约**

### 1.4 两个核心约束：事件有效性和字节完整性

作者把`observation contract`拆成两个正交的约束

- `Temporal validity`:时间有效性，比如 token、URL、rate-limit window 都有时间限制，必须在正确时间内使用
- `Byte-level integrity`：字节级完整性。比如`token`、签名`URL`、`OAuth state`、`HMAC`签名等，必须逐字节保持不变，不能改写、重排、重新编码

这两个约束是独立的：你刷新一个过期 URL，只解决了时间问题，不保证 Agent 不会再次复制错；反过来，Agent 即使能原样复制，也不代表它会在有效期内使用

这是`Introduction`的一个关键思想：**时间问题和内容完整性问题必须同时测，单独测一个不够**

### 1.5 为什么需要Contract Bench

作者用 Table 1 对比了已有 benchmark。结论是：已有 benchmark 要么不测时间有效性，要么不测字节完整性，更没有同时测两者

![Table 1: Agent benchmark landscape](/my-blog/2026/07/13/scientific-research/paper-reading/ContractBench/ContractBench/image.png)

所以 据此提出了`ContractBench`，专门评测 LLM Agent 是否能遵守 observation contracts。它包含 33 个任务，覆盖 presigned URL、OAuth state、signed request、HMAC webhook、rate limit、多步 token workflow 等真实 API 契约模式

这个`benchmark`的特点是

- 同时测试时间有效性和字节完整性
- 用虚拟时钟控制时间
- 程序化`validator`判断成功失败
- 会给失败`episode`分配一个具体失败标签

也就是说它不是让人或者另一个`LLM`判断 **看起来对不对**，而是用程序直接看`Agent`行为是否满足契约

![Figure 1](/my-blog/2026/07/13/scientific-research/paper-reading/ContractBench/ContractBench/image-1.png)

## 2. Observation Contract

作者说，在真实API工作流里，工具返回的中间值不是普通文本，而是带有约束的`artifact`，比如

- presigned URL；
- signed token；
- OAuth state；
- HMAC 签名；
- ETag；
- session token

这些东西之后还要被`Agent`再次使用，而且使用方式受到外部系统限制，作者把这种中间值叫做`observation contract`

### 2.1 两类约束

- 第一个是 `temporal validity`，时间有效性。
    - 比如 token 或 URL 只能在某个时间窗口内使用，过期后就不行。
- 第二个是 `byte-level integrity`，字节级完整性。
    - 比如 URL、token、签名参数必须原样保留，不能改字符、不能重编码、不能截断、不能重排。

这两个约束是独立的。一个 Agent 可能时间上没问题，但把 token 改坏了；也可能 token 没改，但用得太晚，已经过期。

### 2.2 形式化定义

一个`observation contract`可以写成：$C = (o, t_{issue}, τ, π)$

- `o`:工具返回的`artifact`,比如一个`URL`或`token`
- $t_{issue}$:它被生成的时间
- $\tau$:它的有效期，也就是TTL
- $\pi$:完整性检查函数，用来判断提交回来的东西有没有被改动

它的有效期时间窗口是：$[t_{issue}, t_{issue} + τ)$

在论文实现里，完整性检查主要通过`SHA-256`哈希做：如果Agent后续提交的内容和原始`artifact`哈希一致，就说明字节没变；否则就是被破坏了

<aside class="admonition note">
`SHA-256（Secure Hash Algorithm 256-bit`，256 位安全哈希算法）

属于` SHA-2` 哈希家族（同系列还有 `SHA-224、SHA-384、SHA-512`），由美国 NSA 设计、NIST 标准化（FIPS 180-4，2001 年发布），是目前互联网最通用的密码散列函数。

- 输入：任意长度文本、文件、二进制数据
- 输出：固定 256 bit（32 字节），日常展示为 64 位十六进制字符串
- 本质：给数据生成唯一 “数字指纹”，不是加密算法（不可逆、无密钥解密）
</aside>
### 2.3 什么叫满足契约

作者定义，一个提交$(o^{'},t^{'})$满足契约，需要同时满足两点：

- $t'$在有效时间窗口内 ，也就是没过期
- $o'$通过完整性检查，也就是内容没有被改

只要其中一个不满足，就失败，所以这里的成功条件非常严格：**按时+原样**

### 2.4 整条trace合规的定义


一个contract $C$可以理解成一个工具/API返回的中间产物，比如token、签名 URL、OAuth state。Agent 后续提交它时，要满足两个条件：

$$
Sat(C,o',t') = 1
$$

意思是：提交的内容$o'$和提交时间$t'$满足这个`contract`

这里的$Sat$是一个`0/1`指示函数：

- 如果这个提交既没有过期，有没有被改坏，则$Sat = 1$
- 否则，$Sat = 0$

进一步考虑一整条执行轨迹，现实里的Agent往往不是只处理一个`token`，而是连续处理多个中间产物：$\{C_i\}_{i=1}^n$

也就是`Agent`对第`i`个`contract`提交了某个值$o_i'$,提交时间是$t_i'$

整条轨迹是否compilant:

$$
Compilant(\{C_i\},\{o_i',t_i'\}) := \Pi_{i=1}^nSat(C,o',t') = 1
$$

### 2.5 时间和完整性是正交的

对于任意一个正常的contract，只要满足两个条件：

- `validity window`非空
- `integrity predicate`非平凡

所有提交都可以被分到一个2×2表格里：

|          | 内容完整         | 内容损坏          |
| -------- | ---------------- | ----------------- |
| 时间有效 | 成功             | integrity failure |
| 时间无效 | validity failure | 两者都失败        |

这四种情况都是真实可发生的，不是理论上空着的

## 3. ContractBench

CONTRACTBENCH 是一个专门测试 LLM Agent 是否能遵守 observation contracts 的 benchmark。

它有几个基本特点：

- 一共 33 个任务；
- 所有任务都来自真实 API 里的契约模式；
- 每个任务都用程序自动评测；
- 时间由 virtual clock 控制；
- 字节完整性用哈希或协议校验判断；
- 失败时会给出明确的 failure label 
 
所以它不是让另一个 LLM 判断“这个 Agent 做得对不对”，而是直接看 Agent 的实际 HTTP 请求日志是否满足契约。

### 3.1 Building Tasks that Probe Both Axes Simultaneously

#### 1. `Two-level taxonomy`:任务的两层分类

![两层分类](/my-blog/2026/07/13/scientific-research/paper-reading/ContractBench/ContractBench/image-2.png)

**第一层**

- Q1:Control/sanity check
  - 低时间压力、低完整性压力的任务，主要用来确认`Agent`能不能完成基本流程，可以理解成`sanity check`
- Q2:Validity
  - 这一类主要考察时间规划，比如Agent是否会在资源过期前使用它，是否会等待正确的`backoff`时间，是否会避开`scheduled downtime`
- Q3：Integrity
  - 这一类主要考察字节保留。比如`Agent`能不能原样传递`token`、URL、HMAC payload，不被截断、不被重编码、不被改写
- Q4：Both axes
  - 这一类同时考察时间有效性和字节完整性。也就是说，`Agent`不仅要在正确时间内行动，还要保证`artifact`

这里最重要的是`ContractBench`是`Q4-heavy`的

33 个任务里有 24 个任务属于 Q4。这说明作者认为真实 API 工作流中，最常见、也最重要的问题不是单纯的“时间问题”或单纯的“复制问题”，而是二者同时存在

比如 presigned URL：
它既有过期时间，又有签名参数，必须按时且原样使用。
OAuth state：
它既可能和会话时序相关，又必须 round-trip 不变。
HMAC webhook：
它既可能和请求时间窗口相关，又必须保证 payload 和签名字节一致。

**第二层**

在Q4内部再按照`contract pattern`分类

这一层分类的意义是：作者不是随便设计33个小题，而是希望这些任务覆盖真实API系统中常见的`contract`类型

#### 2. Task Structure

`ContractBench`的每个任务都由4个文件构成

##### 1. TOML metadata header

这是任务的第一个文件

它主要记录任务的隐藏配置，比如

- 任务难度
- 属于哪一个双轴类别
- 时间预算
- TTL、rate limit 等 timing budgets

这个文件`Agent`看不到，它更像是`benchmark`内部使用的 **任务配置文件**

##### 2. Markdown Instruction

这是第二个文件，是 **Agent能看到的任务说明**

比如它会告诉`Agent`你需要访问某个本地`API`；先调用哪个`endpoint`,拿到`token`、`URL`或者`state`之后应该做什么，最终需要提交什么结果

相当于是给agent的用户说明

##### 3. FastAPI Server

这是任务运行时的API服务。Agent会真的向这个server发HTTP请求

这个`server`的作用有两个

- 它模拟真实API行为，比如发`token`、返回`presigned url`、设置`rate limit`、检查`HMAC`签名等
- 它记录`Agent`的请求日志，并在发现违规时写入`failure event`。论文里提到，它会通过一个共享的`append_log()`调用，在虚拟时钟下记录每次请求对应的失败标签

> 注意这里的server不是事后凭个感觉判断，而是在`Agent`行动时就按照确定性规则记录事件

<aside class="admonition example">
- `Agent`过期之后才使用`url`，`server`可能记录`EXPIRED_BEFORE_USE`
- `Agent`把`token`改坏了，`server`可能记录`MUTAED_TOKEN`
- `Agent`违反`backoff`窗口，`server`可能记录`BACKOFF_VIOLATION`
</aside>
##### 4. pytest validator

它负责在`episode`结束后读取`HTTP request log`,然后计算`reward`，也就是说`validator`会根据日志判断：

- 这次任务是否成功
- 如果失败主要失败标签是什么
- 失败细节是什么

#### 3. Failure taxonomy

前面作者已经说，每个任务的`server`会记录`Agent`在`API`交互中犯了什么错

但是一个`episode`里可能出现很多事件，所以作者需要一套统一规则，把失败归纳成一个主要标签

因此`ContractBench`设计了15个`failure labels`。每个失败`episode`最后会被分配一个`primary label`，也就是主要失败原因。这个标签由`validator`根据请求日志和`most-serve rule`聚合出来

也就是说`Failure taxonomy`的作用是：不只告诉你`Agent`失败了，还告诉你它为什么失败

![Failure Taxonomy](/my-blog/2026/07/13/scientific-research/paper-reading/ContractBench/ContractBench/image-3.png)

15个标签分成三组

1. `validaity failure`:时间有效性失败
    - `Agent`不是完全不会调用`API`，而是没有正确管理时间、版本或等待窗口
2. `Integrity failures`:内容、协议或字节完整性失败
    - `Agent`可能知道下一步要做什么。但是在执行时没有保持协议对象的精准性，或者没有完整遵守请求格式
3. `Meta labels`:成功或无法归类

##### failure taxonomy怎么用

任务`server`会把执行过程中的违规事件按照时间顺序写进`request log`

然后`validator`会把这些事件聚合成一个`primary label`。也就是说，最终结果不是一句失败，而是能给出具体的`failure label`

如果一个`episode`里面有多个错误，就用`most-servere-label rule`选出最主要的那一个。成功`episode`中正常出现的协议状态事件，比如`challenge issued`不会被算进失败分布

##### 为什么这部分重要

- 它让`ContractBench`不只是一个排行榜，而是一个诊断工具
  - 我们可以知道某个模型到底是时间规划差，还是字节保留差，还是协议字段经常漏
- 它可以为后面的实验做铺垫
  - `Section 4`里面作者会用这些标签分析不同模型的失败模式，还会测试：如果把正确失败标签反馈给模型，模型下一次是否能够修正

##### Two sources of difficulty stack in ContractBench

- 真实`Agent pipeline`本身可能破坏字节
  - 作者指出，真实生产环境里，从`API`返回值到`Agent`下一次调用工具，中间并不是一个完全 **字节保真的过程**
  - 也就是说，`API`返回一个`token,URL`,签名字符串之后，它通常会经过：`API response → Agent context window → LLM 生成动作 → tool-call interface → HTTP library / middleware → 下一个 API 请求`
  - 在这个过程中，**中间值可能被系统悄悄改掉**

<aside class="admonition example">
论文中举了几个例子

- `tool-call interface`可能会截断很长的输入
- `HTTP library`可能会重新编码`URL`，比如把`%2F`变成`/`
- `middleware`可能会在签名前重新排序`query parameters`
- 页面上显示的`link text`可能和真实的`href`不一致
- 长`token`可能在上下文里面被替换，复制错或者部分丢失

一个简单的例子：

API返回

```
https://example.com/file?X-Amz-Signature=abc%2Fdef&Expires=60
```

`Agent`后续传给下载工具时变成

```
https://example.com/file?Expires=60&X-Amz-Signature=abc/def
```

从人类角度看，好像还是同一个`URL`；但是从签名验证角度看，字节已经变了，所以服务器会拒绝

这就是`ContractBench`想捕捉的完整性问题
</aside>
- 即使没有字节损坏，双轴任务本身也难
  - 原因是双轴任务要求`Agent`同时做到两件事
    - 一方面要围绕`tight TTLs`做时间规划:比如某些URL或`token`很快到期，`Agent`不能随便按照列表顺序慢慢处理，而要判断哪一个最紧急
    - 另一方面，要保持`exact byte content`：也就是 token、URL、签名、哈希值不能被改写

### 3.2 Evaluation Protocal

`ContractBench`的评测是`deterministic,programmatic validators`的，也就是 **确定性的、程序化的验证器**

这意味着它不用人工评分，也不用另一个`LLM`当裁判，模型到底成功还是失败，完全由程序根据实际请求日志判断

#### 1. validator输出什么

> vilidator会输出几类`reward details`

- `binary success flag`也就是一个二值成功标志：成功或失败
- `most-severe failure label`
  - 如果失败，就从前面`Table 2`的15个failure labels里面选一个最主要的失败标签
- `failure detail`也就是更具体的失败信息。比如哪个资源过期了、过期多久、哪个`token`被改了等等
- `trace metadata`:包括任务`ID`、seed、执行步数、工具调用次数、虚拟时间消耗、trace hash 等。这部分在 Appendix G 的 episode result schema 里有示例。


#### 2. Metrics

接下来作者定义了三个指标

##### Success Rate,成功率

每个模型在33个任务上运行，每个任务跑`3`次，所以每个模型总共跑`99`个`episode`

成功率就是这`99`个`episode`里面`label`是`SUCCESS`的比例


##### Per-task pass rate, 单任务通过率

这个指标看的是某一个模型在某一个任务上的表现

因为每个任务跑3次，所以一个任务的`pass rate`可能是$0,\ 1/3,\ 2/3,\ 1$

##### failure-label distribution,失败标签分布

这个指标只看`episode`，它统计一个模型失败时，主要失败原因分别是什么，也就是根据最终结果中的`failure label`进行统计

这个指标很重要，因为`ContractBench`不是想只做排行榜，而是想诊断模型到底是哪类能力不行

#### 3. Success criteria:什么才算成功

一个`episode`被标记为`SUCCESS`，当且仅当它的`HTTP request log`满足前面的定义2.2中的`contract`:

1. 每个`required abservation`都必须时间有效：$t_{fetch}\leq t_{issue} + \tau$
2. 每个`required observation`都必须字节完整：$SHA-256(payload) = expected$，也就是提交出去的`payload`和原始和原始`artifact`的哈希必须一致

> 两个条件同时满足视为成功

#### 4. 为什么只看`HTTP-level events`

作者特别强调：`validator`只读取`HTTP-level events`，不读取`Agent`的文本解释

这点很关键，因为LLM很可能会在文本里说

- 我会原样使用这个token
- 我已经在有效期内完成请求
- 我保证没有修改`URL`

但是`ContractBench`不看这些自我声明，它只看`Agent`实际发出去的`HTTP`请求

所以

- 如果 Agent 文本说自己合规，但实际请求里的 URL 被改坏了，还是失败。
- 如果 Agent 说自己及时使用了 token，但请求时间已经超过 TTL，也还是失败。

这能避免一种问题：**模型靠语言描述装作完成任务**，`ContractBench`要测的是实际行为，而不是解释能力

## 4. Experiment

### 4.1 Frontier Models on Observation Contracts

- 作者结论：**即便是前沿闭源模型也还没有稳定解决observation contract compilance**
- 也就是说，`claude`,`GPT`,`Gemini`这些模型虽然整体能力很强，但是在 **按时原样使用`API`返回的中间`artifact`**这件事情上，仍然会频繁失败

![ContractBnech Leaderboard](/my-blog/2026/07/13/scientific-research/paper-reading/ContractBench/ContractBench/image-4.png)

**Finding 1**:**前沿模型存在明显上限，而且不同供应商模型之间分歧很大**

### 4.2 Within-Family Scaling: A Capability Cliff

> RQ2:同一个模型家族内部，`contract compilance`会不会随着参数规模变大而提升

`Qwen 3.5 dense family`出现了很明显的能力悬崖

- `Qwen 3.5B Instruct`:0%
- `Qwen 3.5 9B Instruct`：56.6%
- `Qwen 3.5 27B`：64.6%
- `Qwen 3.5 397B-A17B MoE`：70.7%

也就是说从4B到9B之间，模型不是缓慢提升，而是突然从完全不会变成可以解决一般以上任务。作者把这种称为`capability cliff`

这里最重要的不是`9B`会调用工具了，`4B`模型也能发出有效`tool calls`,但是它通常在一两次失败之后就放弃，很多`episode`在真正出发`contract`检查之前就结束了，所以失败标签主要是`OTHER`

而 9B 之后，模型开始表现出更像 Agent 的中途调整能力，比如：• 失败后会换工具方式，例如从 curl 换到 python3 urllib；

• 遇到 scheduled maintenance 会等待；
• 遇到 rate limit 会 back off；
• 会继续推进流程，而不是一失败就停。所以作者说，跨过这个 `cliff` 后出现的不是简单的“工具调用能力”，而是：`mid-trajectory restraint`也就是在任务执行中途的克制、恢复和约束跟踪能力。

模型变强的地方不是“**会不会动手**”，而是“**出错后能不能不乱来，并继续按规则推进**”

**Finding 2**:观察契约遵守能力确实可能像 emergent capability 一样突然出现，但这个出现点不是固定在某个参数规模上，而是和模型家族、训练方法、后训练方式有关

**Finding 3**：观察契约尊抽能力主要不是预训练自然产生的，而是在后训练或指令微调中获得的

下面整理的是**从 4.3 开始到论文结尾，以及附录中值得放进博客的重点笔记**。前面已经讲过的 Abstract、Introduction、Observation Contracts、CONTRACTBENCH、Evaluation Protocol、4.1 和 4.2 我这里先不重复。内容按照论文原文顺序组织，适合直接复制到博客。

---


### 4.3 Post-Training Regression: A V-Shape in GPT-5

这一节讨论的是第三个研究问题：

**在预训练基座基本相同的情况下，post-training 更新会不会影响 observation contract compliance？**

前面 4.2 已经说明，contract compliance 很大程度上来自 post-training：Base 模型几乎都不能完成这类任务，而 Instruct / post-trained 模型才可能具备这种能力。于是 4.3 进一步问了一个反向问题：

**既然 post-training 能带来这种能力，那它会不会也能破坏这种能力？**

作者选择 GPT-5 系列做实验，因为论文认为 GPT-5、GPT-5.1 和 GPT-5.2 共享同一个 pretrained base，主要差异来自 post-training 更新。因此，这个系列适合观察：在参数规模和预训练基座基本不变的情况下，后训练如何影响 contract compliance。

实验结果显示，GPT-5 系列在 CONTRACTBENCH 上呈现明显的 **V-shape**：

- GPT-4o：23.2%
- GPT-5：70.7%
- GPT-5.1：48.5%
- GPT-5.2：74.7% / 74.8%

也就是说，从 GPT-4o 到 GPT-5，contract compliance 大幅提升；但从 GPT-5 到 GPT-5.1，成功率又明显下降；到了 GPT-5.2，又重新恢复并超过 GPT-5。

这说明模型版本更新并不一定让 agent 可靠性单调提升。一个模型可能在通用能力、对话能力、用户偏好对齐上变得更好，但在“按时、原样使用 API 中间产物”这种细粒度执行能力上反而退化。

作者进一步指出，GPT-5.1 的退化不是随机分布在所有失败类型上，而是**集中在 integrity axis，也就是字节完整性维度**。换句话说，GPT-5.1 更容易重新出现 GPT-5 已经较好抑制的错误，比如：

- 把 artifact 的值改错；
- 没有保持 token / URL / 签名参数的字节级一致；
- 重新引入 `WRONG_VALUE`、`MUTATED_TOKEN`、`SIGNATURE_MISMATCH` 等完整性类失败。

论文将这种现象称为一种 **post-training regression**：后训练更新可能削弱模型在中途执行过程中的某些“抑制能力”。

这里的“抑制能力”包括：

- 该等待时等待，而不是急着重试；
- 该原样复制时原样复制，而不是改写或总结；
- 该拒绝捷径时拒绝捷径，而不是为了完成目标乱走旁门。

作者认为，contract compliance 依赖的不是单纯的“会调用工具”，而是一种更脆弱的执行约束能力。模型需要在多步过程中持续克制自己，不要乱改、不要乱试、不要过早重试。post-training 如果过度强化“积极帮助用户完成任务”的倾向，可能会让模型更容易采取激进操作，从而破坏 contract compliance。

这一节的核心发现是：

**Finding 4：Version regression: post-training may erode byte-level integrity**

也就是：

**在相同 base model 的条件下，GPT-5 系列出现了明显的 V 形 contract-compliance 退化。GPT-5.1 的失败集中在字节级完整性问题上，说明 post-training 可能会削弱 agent 所需的等待、字节保留和拒绝错误捷径等能力。**

---

### 4.4 Failure Labels as an Actionable Reward Signal

这一节讨论的是第四个研究问题：

**CONTRACTBENCH 的 failure labels 是否不仅能诊断错误，还能帮助模型修正错误？**

前面介绍过，CONTRACTBENCH 每次失败不仅输出一个失败结果，还会给出具体标签，比如：

- `EXPIRED_BEFORE_USE`
- `MUTATED_TOKEN`
- `WRONG_VALUE`
- `SIGNATURE_MISMATCH`
- `MISSING_CONSTRAINT`
- `RATE_LIMITED`

4.4 这一节就是要验证：这些标签有没有实际纠错价值。

作者选择 GPT-5.1 的 42 个失败 episode 作为测试对象，因为 GPT-5.1 在 4.3 中表现出较明显的完整性退化，比较适合观察失败标签是否能帮助恢复。

实验设置有三种 retry 条件：

1. **No hint**：直接重试，不给任何提示；
2. **Correct-label hint**：重试时告诉模型真实失败标签；
3. **Wrong-label hint**：重试时给一个错误标签，作为对照组。

这个设计很重要。因为如果只比较“给标签”和“不给标签”，我们不知道提升到底来自标签内容，还是来自“再试一次”本身。加入 wrong-label hint 后，就可以隔离出标签内容是否真的有用。

实验结果如下：

- No hint：6 / 42，通过率 14.3%
- Wrong-label hint：5 / 42，通过率 11.9%
- Correct-label hint：8 / 42，通过率 19.0%
- Correct-label 相比 wrong-label 高 7.1 个百分点

这说明，正确 failure label 确实携带了方向性的纠错信号。模型不是因为“多试一次”才变好，而是因为“知道自己错在哪里”才更可能改正。

不过这个提升并不是对所有错误类型都一样有效。

对于一些 **integrity-style failures**，标签比较有帮助。比如：

- `WRONG_VALUE`
- `MISSING_CONSTRAINT`
- 某些 token 或字段相关错误

这些错误通常可以通过下一次更谨慎地复制、补全字段、遵守格式来修正。

但对于一些 **temporal failures**，标签帮助有限。比如：

- 已经过期；
- 触发 rate limit；
- 错过 backoff 窗口。

原因是，这些错误往往不是一句提示就能修好的。比如告诉模型“你刚才等太久了”，它下一次也不一定知道该如何调度时间；告诉模型“你刚才 rate-limited 了”，甚至可能让模型更着急重试，反而继续失败。

作者提到一个很有意思的现象：在唯一一个 `RATE_LIMITED` case 中，错误标签反而成功了，而正确标签没成功。原因可能是：如果直接告诉模型“你被 rate limited 了”，模型可能会更激进地尝试重试，而不是耐心等待。

因此，这一节的结论是：

**failure labels 可以作为一种有用的 in-context reward signal，但它更适合修复完整性类错误；对于时间类错误，可能需要架构层面的支持，比如机器可读 TTL、自动 backoff middleware、handle-based artifact storage 等。**

论文的 Finding 5 是：

**CONTRACTBENCH labels are an actionable reward signal**

也就是：

**CONTRACTBENCH 的失败标签不仅能做诊断，还能作为一种可操作的反馈信号。正确标签比错误标签多带来 7.1 个百分点提升，说明这些标签未来可以用于 reward modeling 或 RL post-training。**

---

## 5 Related Work

Related Work 部分主要把这篇论文放到已有研究脉络中。作者分了三个方向讨论。

### 5.1 Agent benchmarks

第一类相关工作是已有的 agent benchmark。

已有 benchmark 包括：

- WebArena
- SWE-bench
- ToolBench
- AgentBench
- TravelPlanner
- τ-bench
- Terminal-Bench
- TicToc

这些 benchmark 大多关注的是 agent 能不能完成任务，比如能不能浏览网页、修复代码、使用工具、规划旅行、完成终端任务等。

作者认为，这些 benchmark 的问题是：它们通常关注最终任务完成情况，而没有专门检查工具返回的中间 artifact 是否被 agent 按时、原样地保留下来。

最接近 CONTRACTBENCH 的工作是 TicToc。TicToc 研究的是 agent 的 temporal blindness，也就是模型是否会使用过期信息，是否知道重新调用工具获取新信息。但 CONTRACTBENCH 在两个方面扩展了这类工作：

第一，它不只是测试 reactive staleness detection，也就是发现信息过期后再重新调用工具；它还测试 proactive temporal planning，也就是 agent 是否能提前根据 deadline 安排行动顺序。

第二，它加入了 orthogonal integrity axis，也就是字节级完整性。CONTRACTBENCH 不只问“信息是不是过期”，还问“token、URL、签名、state 参数是否被原样保留”。

因此，CONTRACTBENCH 和已有 agent benchmark 的区别在于：

**它不是一般性地评测 agent 是否完成任务，而是专门评测 agent 是否遵守工具/API 返回中间产物所携带的 inter-step constraints。**

---

### 5.2 Emergent capabilities and inverse scaling

第二类相关工作是 emergent capabilities 和 inverse scaling。

**Emergent capabilities** 指的是某些能力不是随着模型规模平滑提升，而是在某个规模或训练阶段后突然出现。论文把 Qwen 3.5 的结果放在这个背景下理解：Qwen 3.5 从 4B 的 0% 到 9B 的 56.6%，出现了明显的能力跃迁。

但作者也强调，这个跃迁不是固定发生在某个参数规模上，而是和模型家族、训练 recipe、post-training 方法有关。其他模型家族并没有复现完全相同的 cliff。

**Inverse scaling** 指的是模型变大或变强后，在某些任务上反而表现更差。CONTRACTBENCH 中也有类似现象，例如 `api-rate-limit-patience` 任务中，更强的模型可能因为更积极地重试而触发 rate limit，从而得分更低。

这说明 agentic 能力并不是越强越好。某些任务需要的不只是主动解决问题，还需要克制、等待、遵守协议。越积极的模型，如果缺少约束意识，反而可能更容易失败。

---

### 5.3 Iterative refinement and self-correction

第三类相关工作是 iterative refinement 和 self-correction，例如 Reflexion 和 Self-Refine。

这些方法通常让模型在失败后生成自我反思，然后基于自我反思进行重试。CONTRACTBENCH 的不同之处在于，它不依赖模型自己生成 critique，而是使用服务器和 validator 自动产生的 deterministic failure label。

这有两个优点：

第一，failure label 是程序化产生的，不依赖人工标注或 LLM judge。

第二，作者加入了 wrong-label control，因此可以更清楚地验证：真正起作用的是标签内容，而不是简单的 retry。

从这个角度看，CONTRACTBENCH 的 failure taxonomy 不只是评测工具，也可能成为未来 agentic RL post-training 的过程奖励信号。

---

## 6 Conclusion

结论部分重新总结了全文的核心贡献。

作者首先再次强调 **observation contracts** 的定义：它是工具/API 返回的中间 artifact，受到两个约束：

- **temporal validity**：必须在有效时间窗口内使用；
- **byte-level integrity**：必须原样保留，不得破坏字节内容。

随后，作者总结 CONTRACTBENCH 的设计：它是一个确定性的 benchmark，包含 33 个任务，任务来自真实 API contract patterns，并且同时评测 validity 和 integrity 这两个既正交又都很重要的维度。每个 episode 都在 virtual clock 下运行，由 programmatic validator 判分，并输出结构化 failure label。

实验结论主要有三点：

第一，**frontier models 还没有解决 observation contract compliance**。最好的模型 Claude Opus 4.6 也没有超过 80%。

第二，**这种能力不会随着规模或模型版本单调提升**。Qwen 3.5 出现了 family-specific capability cliff，而 GPT-5 系列出现了 post-training regression。

第三，**failure labels 有实际反馈价值**。它们不仅可以诊断失败原因，还可以作为 test-time correction 或未来训练中的 reward signal。

论文最后指出，CONTRACTBENCH 的目标是让 observation contracts 成为 agent evaluation 中的一等公民。真实 API 系统中的中间产物不是普通文本，而是带有严格约束的对象。一个可靠的 LLM Agent 不仅要“理解任务”和“调用工具”，还要能在多步执行中持续遵守外部系统强加的 inter-step constraints。

一句话总结结论：

**CONTRACTBENCH 证明了当前 LLM Agent 在真实 API 工作流中的可靠性仍然不足，尤其是在按时、原样传递关键中间 artifact 方面；未来的 agent 系统需要在模型能力和系统架构两方面共同改进。**

---

# 附录重点笔记

## Appendix A Discussion

附录 A 是对实验发现的进一步讨论。这里最重要的观点是：

**observation-contract compliance 不应该只靠模型升级来解决。**

作者认为，实验结果说明这种能力具有三个特征：

1. 它是 post-training 驱动的；
2. 它可能突然出现，也可能突然退化；
3. 它可以被 failure label 部分修正，但不能完全靠提示解决。

因此，对 agent framework 设计者来说，更实际的方向是做系统层面的防护。作者提出了四个工程建议：

第一，**让 artifact TTL 显式且机器可读**。  
不要把有效期藏在 HTTP header 或自然语言描述里，而应该让 agent framework 能直接读到结构化 TTL。

第二，**使用 handle-based artifact storage**。  
不要让长 URL、token、签名字符串一直暴露在上下文里反复复制，而是把 artifact 存在系统侧，给模型一个短 handle，例如 `@HANDLE:url_1`。真正调用工具时，再由系统把 handle 解析成完整 artifact。

第三，**实现 back-off middleware**。  
对于 rate limit、Retry-After 之类的规则，不要完全指望模型自己记住和等待，而应该由中间件自动管理重试节奏。

第四，**把 structured failure label 用作 correction signal**。  
失败标签可以在 retry 时作为 coaching note，也可以未来作为 RL post-training 的过程奖励。

这部分的核心思想是：

**更大的模型不一定解决 contract compliance；可靠 agent 需要模型能力和系统架构共同设计。**

---

## Appendix B Limitations and Broader Impact

附录 B 讲论文局限和影响。

主要局限有三个。

第一，**virtual clock 简化了真实时间环境**。  
虚拟时钟提高了可复现性，但不能完全模拟真实网络延迟、API 波动、服务端不稳定等现实因素。

第二，**没有提供 human baseline**。  
论文有 oracle solution 来证明任务可解，但没有做人类实验，因此无法量化人类和 LLM Agent 在这些任务上的差距。

第三，**闭源 frontier models 无法放到参数规模图里分析**。  
Claude、GPT、Gemini 等模型没有公开参数量，所以它们只能出现在 leaderboard 中，无法纳入参数规模曲线。

Broader impact 方面，作者认为 CONTRACTBENCH 的主要价值是帮助发现和诊断 agent 可靠性问题，尤其是 general benchmark 可能漏掉的 post-training regression。论文认为该 benchmark 主要用于 robustness evaluation，不会引入新的有害能力。

---

## Appendix C Full Benchmark Landscape

附录 C 扩展了正文 Table 1，比较了 11 个已有 agent benchmark 和 CONTRACTBENCH。

比较维度是：

- 是否测试 temporal validity；
- 是否测试 byte-level integrity；
- 是否是 programmatic evaluation。

表格的核心结论是：

**已有 benchmark 即使部分涉及时间约束，也基本没有测试字节级 artifact preservation，更没有同时测试 validity 和 integrity。**

CONTRACTBENCH 是表中唯一同时满足：

- Validity ✓
- Integrity ✓
- Programmatic ✓

的 benchmark。

---

## Appendix D Full Task Catalog

附录 D 给出 33 个完整任务列表。任务被分成 Q2、Q3、Q4 等不同象限。

几个代表性任务包括：

- `scheduled-maintenance`
- `api-rate-limit-patience`
- `token-refresh-workflow`
- `presigned-url-download`
- `csrf-form-submit`
- `url-trap-ellipsis`
- `long-token-handling`
- `presigned-url-integrity`
- `oauth-pkce-with-rotation`
- `signed-request-canonicalization`
- `etag-conditional-get`
- `distributed-lock-acquire`
- `multi-service-saga`
- `cascading-token-revocation`

这个任务目录说明 CONTRACTBENCH 覆盖了多类真实 API 契约场景，包括 OAuth/Auth、Signed requests、State chains、Resource management、Multi-service flows、Timing/Backoff、Byte-exact 等。

---

## Appendix E Task File Anatomy

附录 E 展示了一个具体任务的四文件结构，以 `presigned-url-download` 为例。

每个任务包括：

1. `task.toml`：任务元数据；
2. `instruction.md`：agent 可见的任务说明；
3. `server.py`：FastAPI server，负责返回 artifact、记录请求和 failure events；
4. `test_outputs.py`：pytest validator，负责最终判分。

这部分补充说明了 CONTRACTBENCH 的工程实现方式：Agent 只能看到任务说明和 server response，看不到 hidden metadata 和 validator，因此可以避免 test-set leakage 和 LLM-as-judge ambiguity。

---

## Appendix F Contract Abstraction: Implementation

附录 F 给出 contract 的代码抽象。一个 contract 主要包含：

- `contract_id`
- `issued_at`
- `expires_at`
- `expected_bytes_hash`
- `resource_metadata`

验证逻辑分成两步：

第一，检查当前时间是否小于 `expires_at`；  
第二，检查提交内容的 SHA-256 是否等于 expected hash。

如果时间失败，返回 `EXPIRED_BEFORE_USE`。  
如果完整性失败，返回 `MUTATED_TOKEN`。  
如果两者都通过，返回 `SUCCESS`。

这个实现和第 2 节的形式化定义是一一对应的。

---

## Appendix G Episode Result Schema

附录 G 展示了每个 episode 的输出 JSON 格式。一个结果对象包含：

- `task_id`
- `category`
- `seed`
- `agent`
- `success`
- `failure_label`
- `failure_detail`
- `steps`
- `tool_calls`
- `virtual_time_elapsed`
- `trace_hash`

这个 schema 的意义是：CONTRACTBENCH 不只是输出一个分数，而是输出可追踪、可复现、可诊断的结构化结果。

---

## Appendix H Two Illustrative Tasks

附录 H 用两个例子解释 validity-heavy 和 integrity-heavy 任务。

**Validity-heavy 示例**：  
Agent 收到三个 presigned download URLs，TTL 分别是 10 秒、30 秒、60 秒，每次下载花 8 秒。一个 naive agent 如果按列表顺序处理，可能导致短 TTL 的 URL 过期。一个 validity-aware agent 应该按截止时间排序，优先处理最紧急的 URL。

**Integrity-heavy 示例**：  
工具返回一个很长的 presigned S3 URL，query string 中包含 HMAC signature，但 agent 的 tool-call interface 有 200 字符输入限制。如果 agent 直接提交，URL 会被截断，导致 HMAC 验证失败。更可靠的方案是用 handle-based storage：先把完整 URL 存到系统里，再让 agent 使用短 handle 引用它。

这两个例子很好地说明了：  
**时间规划和字节保留是两类不同能力，真实 agent 系统都需要。** 

---

## Appendix I Proof Sketch: Orthogonality of Validity and Integrity

附录 I 给出了 Proposition 1 的证明草图。

证明思路很简单：

给定一个 contract，只要它的时间窗口非空、完整性谓词非平凡，就可以选：

- 一个有效时间 `tin`
- 一个无效时间 `tout`
- 一个完整 artifact `ook`
- 一个损坏 artifact `obad`

于是可以构造四种提交：

- `(ook, tin)`：时间有效，内容完整；
- `(ook, tout)`：时间无效，内容完整；
- `(obad, tin)`：时间有效，内容损坏；
- `(obad, tout)`：时间无效，内容损坏。

所以 validity 和 integrity 的 2×2 四个格子都非空。这证明了两个轴在逻辑上是独立的。

---

## Appendix J Production Path Mutations

附录 J 是非常适合放进博客的一部分，因为它解释了为什么字节完整性在真实 agent 系统里很容易出问题。

作者列出了五类 production path mutations：

第一，**Truncation**。  
工具调用接口可能截断过长 artifact。

第二，**Line-wrap insertion**。  
长 token 在上下文或 UI 中被软换行，插入 `\n`。

第三，**URL re-encoding**。  
HTTP 库可能把 `%2F` 规范化成 `/`，导致签名字节不一致。

第四，**Query reorder**。  
中间件可能重排 query 参数，而签名算法往往依赖精确参数顺序。

第五，**UI trap**。  
页面显示文本和真实 href 不一致。Agent 如果复制可见文本而不是底层链接，就会提交错误值。

这部分强调了一个关键点：

**很多 integrity failure 不是模型凭空犯错，而是 agent stack 中 observation-to-action pipeline 本身不保证 byte-preserving。**

因此，仅靠模型更聪明不一定能解决问题，系统框架也要负责保护 artifact。

---

## Appendix K Severity-Weighted Failure-Label Mapping

附录 K 把 failure labels 映射到更具体的 capability deficits，并给出 severity weights。

例如：

- `EXPIRED_BEFORE_USE`：时间意识和 deadline planning 不足；
- `MUTATED_TOKEN`：字节级保留能力不足；
- `SHORTCUT_TAKEN`：不能抵抗 adversarial shortcut；
- `WRONG_VALUE`：约束满足能力不足；
- `MISSING_CONSTRAINT`：协议完整性不足；
- `RATE_LIMITED`：耐心和 backoff 策略不足；
- `OTHER`：一般任务完成能力不足。

这个映射有两个用途：

第一，用于 most-severe-label aggregation。  
如果一个 episode 里出现多个错误，就根据严重程度选主标签。

第二，用于 retry coaching 或未来 reward modeling。  
模型失败后，可以把最严重标签作为纠错提示。未来也可以把这些标签作为 process-level reward。

---

## Appendix L Run-to-Run Reproducibility and Episode Budgets

附录 L 讨论可复现性。

CONTRACTBENCH 通过四个设计保证 determinism：

1. virtual clock 消除真实时间依赖；
2. seeded randomness 控制随机元素；
3. 每个 episode 记录 SHA-256 trace hash；
4. 所有 LLM 实验使用 temperature 0 和 pinned model IDs。

实验发现，在有重复运行的样本中，**86.6% 的 model-task pairs 在 k=3 runs 中完全确定**。剩下 13.4% 的变异主要集中在少数 timing-sensitive tasks 上，比如：

- `oauth-pkce-with-rotation`
- `webhook-hmac-verify`
- `multi-token-workflow`
- `oauth-authorization-code`
- `presigned-url-download`
- `api-rate-limit-patience`
- `cumulative-hash-chain`
- `long-token-handling`

这些变异不是 validator 噪声，而是 agent 在紧张 TTL 或 rate-limit 压力下策略不同造成的。

---

## Appendix M Compute Resources and Pinned Model Checkpoints

附录 M 说明实验资源。

评测分成两类后端：

第一，API-served models。  
包括 Claude、OpenAI GPT、Gemini、Qwen、Mistral、MiniMax、Llama、DeepSeek 等。作者使用 pinned model identifiers，以便未来复现和追踪模型漂移。

第二，local vLLM-served models。  
较小的开源模型在本地 vLLM 上运行，例如 Qwen3.5-9B、Qwen3.5-4B、Phi-4 14B 等。

作者还说明，完整 38-row evaluation 的 API 成本约为 200 美元；如果跨 provider 并行，一个完整 leaderboard pass 约需 30 小时，如果串行则需要 5 到 7 天。

---

## Appendix N Full Master Leaderboard

附录 N 给出完整 38 个模型的 leaderboard。

正文 Table 3 只展示了部分代表模型，而附录 Table 10 包含所有模型变体。

几个值得注意的结果：

- Claude Opus 4.6：77.8%
- GPT-5.2：74.7%
- GPT-5：70.7%
- Qwen3.5-397B-A17B：70.7%
- MiniMax-M2.5：62.6%
- Qwen3.5-27B：64.6%
- GPT-5.1：48.5%
- Gemini 2.5 Pro：51.5%
- Llama-3.3-70B-Instruct：7.1%
- DeepSeek-R1：0%
- Phi-4 14B Base：0%

这张表支撑了论文的核心观点：

**contract compliance 不完全由通用模型能力、参数规模或是否是 reasoning model 决定。** 

---

## Appendix O Base vs. Instruct: Post-Training Lifts the Floor

附录 O 进一步强调 Base vs. Instruct 的差异。

所有被评测的 Base 变体都是 0%，包括：

- Qwen 3.5 Base
- Qwen 2.5 Base
- Ministral Base
- Phi-4 Base

作者解释说，Base models 通常缺乏 chat template 和 tool-call format，因此在所有任务都需要工具调用的 CONTRACTBENCH 上会产生不接地的文本，validator 最终记录为 `OTHER`。

这部分补强了 4.2 的 Finding 3：

**contract compliance 是 post-training 产生的能力，而不是单靠预训练规模自然产生的能力。**

---

## Appendix P V-Shape Regression: Detailed Decomposition

附录 P 补充 GPT-5 系列 V-shape regression 的详细分解。

从 GPT-5 到 GPT-5.1，下降最明显的是 integrity 维度：

- Integrity：0.80 → 0.47，下降 0.33；
- Validity：下降 0.25；
- Hybrid：下降 0.20。

在 failure label 层面，GPT-5.1 的失败主要由 `WRONG_VALUE` 和 `MUTATED_TOKEN` 这类字节级完整性标签主导。

这进一步支持正文 4.3 的判断：

**GPT-5.1 的退化不是均匀能力下降，而是集中在 byte-level integrity 上的结构性退化。** 

---

## Appendix Q Per-Task Heatmaps

附录 Q 给出 33 个任务的 per-task heatmap。

作者从 heatmap 中指出三个 universal frontiers。

第一，**universal floor**。  
`multi-turn-recall` 对所有模型都是 0。这个任务要求模型在多轮对话历史中保留 8192-byte URL，所有模型都失败，说明这是上下文字节保真方面的架构限制。

第二，**intra-family inverse scaling**。  
在 `api-rate-limit-patience` 上，一些更强模型反而表现更差。原因是它们更倾向于积极重试，结果耗尽 rate limit quota。

第三，**universal ceiling**。  
没有模型超过 Claude Opus 4.6 的 77.8%。

这些结果说明，有些问题不是简单靠更大模型或更好 post-training 就能解决，而需要 agent 架构介入。

---

## Appendix R Per-Task Breakdown

附录 R 给出 heatmap 的具体数值表。每个 cell 是某个模型在某个任务上 k=3 runs 的平均 reward。

这个附录适合用于更细粒度分析，比如：

- 哪些任务所有模型都难；
- 哪些任务只有 frontier model 能过；
- 哪些任务开源模型接近闭源模型；
- 哪些任务体现 GPT-5.1 退化。

正文中不需要逐项展开，但写博客时可以引用它说明：CONTRACTBENCH 的结论不只是来自总分，也来自 per-task 层面的结构化差异。

---

## Appendix S Per-Label Retry Breakdown

附录 S 分解了 4.4 中 GPT-5.1 的 42 个失败 episode 在不同标签上的 retry 成功情况。

主要结论是：

- `WRONG_VALUE` 上 correct-label hint 有一定帮助；
- `MISSING_CONSTRAINT` 虽然样本少，但 correct-label 能帮助恢复；
- `EXPIRED_BEFORE_USE` 的恢复有限；
- `RATE_LIMITED` 出现 inversion：正确标签没成功，错误标签反而成功。

这说明 failure label 的作用是有条件的：

**对于能通过重新提交正确值来修复的完整性类错误，标签很有用；对于时间类或策略类错误，标签不一定足够，可能需要架构级机制。** 

---

## Appendix T Full Failure-Mode Profiles

附录 T 展示不同模型的完整 failure-mode profile。

作者把模型按成功率排成 capability ladder，发现 dominant failure type 会随着模型能力变化而转移：

- 低能力模型主要是 `OTHER`，说明还没进入真正 contract 检查就失败；
- 中等能力模型主要是 integrity failures，例如 `WRONG_VALUE`；
- frontier 模型中 temporal failures 比例上升，例如 `EXPIRED_BEFORE_USE`。

这个现象很有解释力：

**模型能力越弱，越容易在进入协议之前就失败；模型能力提升后，开始能完成基本流程，但会暴露出字节完整性问题；再往前沿推进后，剩余瓶颈更多变成时间规划、rate limit、deadline 等问题。**

这说明 CONTRACTBENCH 的 failure taxonomy 能揭示模型能力发展的阶段性结构，而不只是给一个总分。

---

# 论文整体总结

这篇论文的核心贡献是提出了 **observation contract** 这个概念，并用 CONTRACTBENCH 系统评测 LLM Agent 是否能遵守这类契约。

所谓 observation contract，就是工具/API 返回的中间 artifact，它后续使用时必须满足外部系统的约束。最典型的两个约束是：

1. **时间有效性**：不能过期、不能违反 rate limit、不能错过 backoff；
2. **字节完整性**：不能改写 token、URL、签名、OAuth state、HMAC payload 等。

CONTRACTBENCH 通过 33 个任务测试这两个轴，并使用 virtual clock、SHA-256、programmatic validator 和 structured failure labels 实现确定性评测。

实验表明：

- 当前最强模型也没有突破 80%；
- Qwen 3.5 出现 4B 到 9B 的能力跃迁；
- Base models 基本无法完成任务，说明 contract compliance 主要来自 post-training；
- GPT-5 系列出现 V-shape regression，说明 post-training 也可能破坏这种能力；
- failure labels 能作为有用的纠错信号，但对时间类失败帮助有限。

这篇论文最重要的启发是：

**LLM Agent 的可靠性不能只看它会不会调用工具、能不能完成最终任务，还要看它能不能在多步 API 工作流中按时、原样地传递关键中间状态。真实系统里的 token、URL、签名和状态参数不是普通文本，而是带有严格契约的对象。**

因此，未来更可靠的 agent 系统需要两方面改进：

一方面，模型需要更强的中途约束跟踪能力，包括等待、复制、拒绝捷径和按协议执行。  
另一方面，agent framework 也需要提供系统级保护，例如 handle-based artifact storage、机器可读 TTL、自动 backoff middleware 和 failure-label-aware retry。
