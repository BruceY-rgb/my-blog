---
title: 科研日记-day1
date: 2026-07-04 10:00:00
categories:
  - 科研训练
  - Agent Tool Use Result
tags:
  - Agent Tool Use Result
cover: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3a8NGfWPxPLDZvE6xfO3xQhKyKN-n_VZY52h7v3zdYnQudwvejpJ6MNE&s=10
---

今天是这个项目真正意义上的 Day 1。原本计划中 Day 1、Day 2、Day 3、Day 4 的内容都在今天集中完成了，这说明早先的每日计划粒度偏小，也过于乐观。更重要的是，今天的实验让我们意识到：当前选择的 Tool Result Utilization (TRU) 方向并不是一个可以轻易验证出模型失败的方向，至少在 clean forced-result / provided-result answer-only 设置下，DeepSeek V4 Flash 的表现比预期稳得多。

## 研究问题

今天围绕的问题是：

> 当工具返回了正确结果，并且该结果已经暴露给 agent 后，模型是否仍然会在后续回答中忽略、覆盖、扭曲或错误使用工具结果？

我们最初的设想是，当前很多 tool-use benchmark 主要评估工具是否被正确调用，较少隔离“工具返回结果之后，模型是否真的正确利用了结果”这一层。因此 TRU 的核心价值应当是把 tool selection 和 result utilization 分开评估。

今天的关键工作不是扩大数据，而是做 feasibility check：先确认这个 failure 是否真实存在，自动 oracle 是否可靠，以及这个方向是否值得继续作为论文主线推进。

## 实验一：mini-pilot 人工审计

第一步检查 8 条 mini-pilot 样本在 `deepseek-v4-flash` 的 `forced_result` 条件下的输出。

`forced_result` 的意思是：不让模型自己选择工具，而是直接把正确工具结果展示给模型，让模型回答用户问题。这样可以剥离 tool selection，只看 result utilization。

最初自动 oracle 给出的结果看起来有明显信号：

| 指标 | 自动结果 |
|---|---:|
| selection accuracy | 1.0000 |
| case RU | 0.6250 |
| field RU | 0.7778 |
| selection-case RU gap | 0.3750 |

但人工审计发现，这 3 个自动失败都不是 confirmed TRU failure，而是 oracle false positive 或 case rubric 问题。主要问题包括：

- 布尔判定类答案的合理转述没有被接受；
- `not_contains` 这类规则无法理解否定或不确定表达；
- 差值、年份、字段顺序等校验过于依赖表面字符串。

这一步的结论非常关键：早期看似有信号的 `case_ru=0.6250` 不能作为模型失败证据。它真正说明的是 evaluation validity 风险，也就是自动 oracle 很容易把正确回答误判成 TRU failure。

## 实验二：oracle 修复与回归测试

第二步修复 deterministic oracle。我们新增或修正了几类 match 逻辑：

- `any_contains`：接受多个等价表达；
- `forbidden_assertion`：区分真正的错误断言和带否定/不确定性的提法；
- `all_contains`：支持顺序无关的多字段要求；
- `not_regex`：用于更稳定地排除错误模式。

修复后，mini-pilot 的 DeepSeek `forced_result` 结果变为：

| 指标 | 修复后结果 |
|---|---:|
| case RU | 1.0000 |
| field RU | 1.0000 |

这说明 easy forced-result 条件下没有发现 confirmed TRU failure。这个结果让我们暂时不能扩展同类简单样本，也不能启动 reflection / RBC repair，因为没有可修复的失败对象。

## 实验三：R006 stressor / counterfactual boundary probe

第三步不是扩数据，而是设计更强的边界探针 R006。

R006 的核心思想是 paired counterfactual result use：同一个用户任务保持稳定，只改变工具返回中的决定性字段。如果模型真的利用工具结果，最终答案必须随该字段改变。如果答案不变，或者回到用户先验、旧结果、干扰字段、发明值，才可能构成 TRU failure。

R006 构造了 16 条 cases，覆盖 8 个 paired family：

- user hint conflict；
- latest result overwrites stale result；
- null / unavailable semantics；
- multi-candidate decisive field；
- numeric direction and delta；
- natural-language prior induction；
- long output distractors；
- multi-tool conflict priority。

我们先用 replay-grounded answers 做 oracle sanity，确认正确答案可以被当前 deterministic oracle 接受。随后调用 DeepSeek API 跑 R006 `forced_result`。

自动评估最初出现 1 个失败：`r006-null-flight-gate-unassigned`。人工审计后发现，模型回答 “has not been assigned” 是完全正确的 unassigned gate paraphrase，只是 oracle 没覆盖这个表达。修复后 R006 结果为：

| 指标 | R006 修正后 |
|---|---:|
| case RU | 1.0000 |
| field RU | 1.0000 |
| paired consistency | 8/8 |
| human-confirmed TRU failures | 0/16 |

这个结果说明：在显式 `forced_result` prompt 下，DeepSeek 对这 16 个 stressor 仍然稳定使用了工具结果。

## 实验四：R006B stronger boundary revision

R006A 没有发现 failure 后，我们继续做 R006B。R006B 的目标不是制造歧义，而是降低 prompt 保护、增强 result-use 压力，并保持人工审计标准清楚。

我们新增了一个弱保护 condition：

```text
provided_result
```

它仍然把 `User request`、`Selected tool call`、`Tool result` 展示给模型，但不再在 system prompt 里强调“工具结果是 ground truth / correct result / 必须精确保留字段”。

R006B 设计了 12 条 cases，覆盖 6 个 paired family：

- timestamp freshness without explicit latest label；
- source TTL conflict；
- null semantic state；
- percentage point vs relative percent；
- nested compliance selection；
- current approved path control。

Replay sanity 通过：

| 指标 | R006B replay-grounded |
|---|---:|
| case RU | 1.0000 |
| field RU | 1.0000 |

随后我们调用 DeepSeek API 跑 `provided_result`，并额外跑 `forced_result` 对照：

| Condition | Automatic Case RU | Automatic Field RU | Human-Confirmed TRU Failures |
|---|---:|---:|---:|
| provided_result | 0.6667 | 0.8333 | 0/12 |
| forced_result | 0.8333 | 0.8750 | 0/12 |

自动指标看起来掉得明显，但人工审计发现并不是 clean TRU failure。

典型例子：

- `No, 0` 是库存为 0 时的正确动作性回答，但没有命中 phrase oracle；
- `Yes, 6` 是库存为 6 时的正确回答，也没有命中 phrase oracle；
- percentage-point cases 中，模型给出了正确的 `4.8 percentage points`，没有把 `12%` 错当成 `12 percentage points`，但自动规则要求显式方向词，导致误判。

最终 R006B 的人工结论是：

| 维度 | 结果 |
|---|---:|
| confirmed clean TRU failures | 0/12 |
| paired families passed under provided_result | 6/6 |
| paired families passed under forced_result | 6/6 |

这说明 R006B 的自动掉分主要暴露了 evaluator/rubric fragility，而不是 model TRU failure。

## 小组复盘

今天最后做了小组讨论。团队共识是：

1. TRU 方向还没有被否定。
2. 但是 clean `forced_result` / `provided_result` 的 answer-only 路线已经受阻。
3. 当前不能主张 DeepSeek 暴露了非平凡 TRU failure。
4. 不能启动 R005 reflection / RBC repair，因为没有 confirmed baseline failure。
5. 不能把 R006B 自动 `case_ru=0.6667` 当作模型失败证据。

更准确的判断是：

> 当前强模型在“工具结果已经清楚展示、任务要求直接回答”的设置下非常稳。继续扩同类 answer-only stressor，大概率主要扩大 oracle/rubric 修复工作量，而不是发现新的科学信号。

## 今日结论

今天最大的收获不是发现 TRU failure，而是发现了一个重要边界：

> clean post-tool-result answer-only exposure 可能太容易，至少对 DeepSeek V4 Flash 是这样。TRU failure 如果存在，更可能出现在 action、state update、next-tool arguments 或真实 trajectory pressure 中。

这迫使我们调整研究路线。TRU 仍然可以作为 post-tool-result evaluation layer，但下一步不能继续停留在“读工具结果并回答字段”的设置中。

## 明日计划

明天开工前必须先做一个关键调研，而不是直接写 R006C cases。

调研目标：

> 查找开发者社区、论文、开源 issues、agent/tool-use 框架、benchmark failure reports 中所有与 tool result / tool observation / tool output utilization 相关的问题，看看真实场景下这类问题如何呈现，目前是否已有解决方案。

需要重点关注：

- agent 是否看到了工具结果但后续动作没落实；
- 工具返回正确，但下一步 API 参数用了旧值或错误字段；
- 模型文字回答正确，但状态更新、数据库写入、工具调用参数错误；
- multi-turn 或 memory 场景下，旧 observation 覆盖新 observation；
- null / hidden / unavailable / empty list / zero 等语义在真实系统中如何出错；
- 当前框架或 benchmark 是否已有类似 mitigation，例如 verifier、structured output、policy checker、state validator。

调研之后再设计 R006C。

R006C 暂定方向：

> 从 answer-only TRU 转向 action/state mismatch：工具结果给模型看了，模型是否能把结果落实到结构化动作、状态更新或下一步工具参数中。

最小实验形态：

- 12-20 条 paired cases；
- 至少 2 个 action/state families；
- 输出结构化动作，例如 `ship` / `block` / `escalate` / `select_vendor` / `update_state`；
- 只把 clean human-confirmed action/state mismatch 算作 TRU failure。

Go 条件：

- 至少 3 个 clean human-confirmed failures；
- 覆盖至少 2 个 families；
- 或 human-confirmed conditional TRU failure rate >= 10%。

No-Go 条件：

- 如果 R006C 仍然低于 5% confirmed failure，并且 paired consistency 很高，就停止把 controlled TRU failure discovery 当作主线。

No-Go 后的转向：

1. 转向 public full-agent trajectory analysis，例如 BFCL multi-turn、AgentProcessBench、tau/tau2；
2. 或把 TRU 降级为 measurement/control layer，主贡献改为 evaluation validity / oracle brittleness；
3. 或暂缓 TRU 作为 ICLR 主 claim，寻找更真实、更高失败率的 agent workflow failure。

## 当日工作总结

今天完成了从初始 feasibility check 到路线复盘的完整闭环。原先以为几天的任务实际一天完成，也暴露出原计划过于理想化：问题不是“多跑几个 case 就能找到失败”，而是当前 chosen slice 本身可能太容易。

今天的结果迫使我们从“寻找 clean answer-level TRU failure”转向“寻找 result-to-action / result-to-state 的真实边界”。这是一个收窄，而不是完全放弃。
