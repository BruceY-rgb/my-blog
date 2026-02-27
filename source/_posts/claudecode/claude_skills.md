---
title: The Complete Guide to building Skills for Claude
date: 2026-02-26 12:30:00
tags: [claude code, skill, MCP]
categories: [claude code]
description: Claude Skills完整指南：如何为Claude AI构建自定义技能。从基础概念、规划设计、测试迭代到分发共享的完整教程。
cover: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4ICV1g1S94_JcMkMcm2qPmb9yI6xD_Z09Vw&s
---

# Claude Skills 完整指南

> 参考文档：[The Complete Guide to Building Skills for Claude](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf)
>
> 官方GitHub仓库：[anthropics/skills](https://github.com/anthropics/skills) - 14.3k+ Stars

> 官方文档：[Skills Documentation](https://docs.anthropic.com/en/docs/claude-code/skills) | [MCP Documentation](https://modelcontextprotocol.io/introduction)

## Introduction

### 什么是 Skills？

**Skills（技能）** 是一组指令，以简单的文件夹形式打包，用来教 Claude 如何处理特定的任务或工作流。Skills 是自定义 Claude 以满足你特定需求的最强大方式之一。

![Skills概念图](https://baike.sogou.com/pic/v8261213.htm)

### 为什么使用 Skills？

- **无需重复解释**：不再需要在每次对话中重新解释你的偏好、流程和领域专业知识
- **可重复的工作流**：适用于生成前端设计、进行一致性研究、创建遵循团队风格指南的文档，或编排多步骤流程
- **与内置功能配合**：可以与 Claude 的内置功能（如代码执行和文档创建）配合使用
- **为 MCP 增强层次**：对于构建 MCP 集成，Skills 增加了强大的层，帮助将原始工具访问转变为可靠的优化工作流

### 谁适合使用 Skills？

- 希望 Claude 遵循特定工作流的**开发者**
- 希望 Claude 遵循特定流程的**高级用户**
- 希望标准化 Claude 在组织内工作方式的**团队**

---

## 1. Fundamentals（基础）

### 1.1 Skills 的结构

一项技能包含以下内容：

```
your-skill-name/
├── SKILL.md              # 必选 - 主技能文件（Markdown格式，包含YAML frontmatter）
├── scripts/              # 可选 - 可执行脚本（Python, Bash等）
│   ├── process_data.py
│   └── validate.sh
├── references/           # 可选 - 参考文档（按需加载）
│   ├── api-guide.md
│   └── examples/
└── assets/               # 可选 - 模板、字体、图标等资源
    └── report-template.md
```

### 1.2 核心设计原则

#### 1. Progressive Disclosure（渐进式显示）

Skills 采用**三级系统**来最小化 token 使用，同时保持专业化知识：

| 级别 | 内容 | 加载时机 |
|------|------|----------|
| **第一级** | YAML frontmatter | 始终加载到 Claude 的系统提示词中 |
| **第二级** | SKILL.md 正文 | 当 Claude 认为该技能相关时加载 |
| **第三级** | 关联文件（scripts/references/assets） | 仅当需要时导航和发现 |

> 这种渐进式披露确保 Claude 只加载必要的信息，极大地节省了 token 消耗。

#### 2. Composability（可组合性）

- Claude 可以同时加载多个 skills
- 你的 skill 应该与其他 skills 良好协作
- 不要假设它是唯一可用的能力

#### 3. Portability（可移植性）

- Skills 在 **Claude.ai**、**Claude Code** 和 **API** 三种平台上表现完全一致
- 创建一次，即可在所有平台使用
- 前提是环境支持所需依赖

### 1.3 Skills + MCP：协同工作

| MCP（连接性） | Skills（知识） |
|---------------|----------------|
| 将 Claude 连接到你的服务（Notion, Asana, Linear 等） | 教 Claude 如何有效地使用你的服务 |
| 提供实时数据访问和工具调用 | 捕获工作流和最佳实践 |
| **Claude 可以做什么** | **Claude 应该怎么做** |

**厨房的比喻**：
- **MCP** = 专业厨房：提供工具、食材和设备
- **Skills** = 食谱：逐步说明如何创造有价值的东西

**为什么 Skills 对 MCP 用户很重要**：

| 没有 Skills | 具备 Skills |
|-------------|--------------|
| 用户连接 MCP 但不知道下一步做什么 | 预建工作流在需要时自动激活 |
| 每次对话从零开始 | 一致的、可靠的工具使用 |
| 结果不一致 | 最佳实践嵌入每次交互 |
| 用户责怪连接器（实际问题在 workflow） | 学习曲线降低 |

---

## 2. Planning and Design（规划与设计）

### 2.1 从用例开始

在编写任何代码之前，识别你的 skill 应该实现的 **2-3 个具体用例**。

**良好的用例定义示例**：

```markdown
Use Case: Project Sprint Planning
Trigger: User says "help me plan this sprint" or "create sprint tasks"
Steps:
1. Fetch current project status from Linear (via MCP)
2. Analyze team velocity and capacity
3. Suggest task prioritization
4. Create tasks in Linear with proper labels and estimates
Result: Fully planned sprint with tasks created
```

**自我检查问题**：
- 用户希望实现什么目标？
- 这需要哪些多步骤工作流？
- 需要哪些工具（内置或 MCP）？
- 应该嵌入哪些领域知识或最佳实践？

### 2.2 常见 Skills 使用场景类别

#### 类别 1：文档与资产创建

- **用途**：创建一致、高质量的输出，包括文档、演示文稿、应用程序、设计、代码等
- **真实示例**：[frontend-design skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design)

> "Create distinctive, production-grade frontend interfaces with high design quality. Use when building web components, pages, artifacts, posters, or applications."

**关键技术**：
- 内嵌样式指南和品牌标准
- 模板结构用于一致的输出
- 质量检查清单
- 使用 Claude 内置能力，无需外部工具

#### 类别 2：工作流自动化

- **用途**：多步骤流程，需要一致的方法论，包括跨多个 MCP 服务器的协调
- **真实示例**：[skill-creator skill](https://github.com/anthropics/skills/tree/main/skill-creator)

> "Interactive guide for creating new skills. Walks the user through use case definition, frontmatter generation, instruction writing, and validation."

**关键技术**：
- 步骤式工作流，带验证门控
- 常见结构模板
- 内置评审和优化建议
- 迭代优化循环

#### 类别 3：MCP 增强

- **用途**：工作流指导，增强 MCP 服务器提供的工具访问
- **真实示例**：sentry-code-review skill（来自 Sentry）

> "Automatically analyzes and fixes detected bugs in GitHub Pull Requests using Sentry's error monitoring data via their MCP server."

**关键技术**：
- 协调多个 MCP 调用顺序
- 嵌入领域专业知识
- 提供用户通常需要指定的上下文
- 常见 MCP 问题的错误处理

### 2.3 定义成功标准

**定量指标**：
- Skill 在 90% 的相关查询上触发
- 工作流在 X 次工具调用内完成
- 每个工作流 0 次失败的 API 调用

**定性指标**：
- 用户不需要提示 Claude 下一步
- 工作流完成无需用户纠正
- 跨会话的结果一致
- 新用户可以首次尝试即完成任务

---

## 3. Technical Requirements（技术要求）

### 3.1 YAML Frontmatter：最重要的部分

YAML frontmatter 是 Claude 决定是否加载你的 skill 的方式。

**最小必需格式**：

```yaml
---
name: your-skill-name
description: What it does. Use when user asks to [specific phrases].
---
```

**字段要求**：

| 字段 | 要求 |
|------|------|
| `name` | 必填，kebab-case（小写连字符），无空格，无大写 |
| `description` | 必填，包含 WHAT + WHEN，**不超过 1024 字符** |
| `license` | 可选，如 MIT, Apache-2.0 |
| `compatibility` | 可选，1-500 字符，指示环境需求 |
| `metadata` | 可选，自定义键值对，建议：author, version, mcp-server |

**关键规则**：
- ❌ 禁止：XML 尖括号（`<` `>`）
- ❌ 禁止：名称中包含 "claude" 或 "anthropic"（保留）
- ✅ frontmatter 出现在 Claude 的系统提示词中，恶意内容可能注入指令

### 3.2 描述字段的最佳实践

**好的描述示例**：

```yaml
# ✅ 好 - 具体且可操作
description: Analyzes Figma design files and generates developer handoff documentation. Use when user uploads .fig files, asks for "design specs", "component documentation", or "design-to-code handoff".

# ✅ 好 - 包含触发短语
description: Manages Linear project workflows including sprint planning, task creation, and status tracking. Use when user mentions "sprint", "Linear tasks", "project planning", or asks to "create tickets".

# ✅ 好 - 清晰的价值主张
description: End-to-end customer onboarding workflow for PayFlow. Handles account creation, payment setup, and subscription management. Use when user says "onboard new customer", "set up subscription", or "create PayFlow account".
```

**不好的描述示例**：

```yaml
# ❌ 太模糊
description: Helps with projects.

# ❌ 缺少触发条件
description: Creates sophisticated multi-page documentation systems.

# ❌ 太技术化，没有用户触发
description: Implements the Project entity model with hierarchical relationships.
```

### 3.3 编写有效的指令

**推荐结构**：

```markdown
# Your Skill Name

## Instructions
[核心指令]

## Step 1: [第一步]
清晰解释会发生什么

## Troubleshooting
### Error: [常见错误消息]
Cause: [原因]
Solution: [解决方案]
```

**最佳实践**：

✅ **好**：
```
Run `python scripts/validate.py --input {filename}` to check data format.
If validation fails, common issues include:
- Missing required fields (add them to the CSV)
- Invalid date formats (use YYYY-MM-DD)
```

❌ **不好**：
```
Validate the data before proceeding.
```

**使用渐进式披露**：
- 保持 SKILL.md 专注于核心指令
- 将详细文档移到 `references/` 并链接到它
- 保持 SKILL.md 在 5,000 字以下

---

## 4. Testing and Iteration（测试与迭代）

### 4.1 测试方法

#### 1. 手动测试（Claude.ai）
- 直接运行查询并观察行为
- 快速迭代，无需设置

#### 2. 脚本测试（Claude Code）
- 自动化测试用例
- 跨更改可重复验证

#### 3. 编程测试（Skills API）
- 构建评估套件
- 跨定义测试集系统运行

### 4.2 推荐测试方法

#### 1. 触发测试
目标：确保 skill 在正确的时间加载

**应该触发**：
- "Help me set up a new ProjectHub workspace"
- "I need to create a project in ProjectHub"
- "Initialize a ProjectHub project for Q4 planning"

**不应该触发**：
- "What's the weather in San Francisco?"
- "Help me write Python code"
- "Create a spreadsheet"

#### 2. 功能测试
目标：验证 skill 产生正确的输出

**测试用例**：
- 有效的输出生成
- API 调用成功
- 错误处理工作
- 边缘案例覆盖

#### 3. 性能比较
目标：证明 skill 改进结果 vs 基线

| 指标 | 没有 Skill | 有 Skill |
|------|------------|----------|
| 消息往返 | 15 次 | 2 次 |
| 失败的 API 调用 | 3 次 | 0 次 |
| Token 消耗 | 12,000 | 6,000 |

### 4.3 使用 skill-creator skill

**skill-creator** 是内置于 Claude.ai 并可用于 Claude Code 的技能。

**功能**：
- 从自然语言描述生成 skills
- 生成正确格式的 SKILL.md 和 frontmatter
- 建议触发短语和结构
- 审查并标记常见问题
- 基于 skill 目的建议测试用例

**使用方法**：
```
"Use the skill-creator skill to help me build a skill for [your use case]"
```

### 4.4 迭代信号

**触发不足的信号**：
- Skill 在应该加载时不加载
- 用户手动启用它
- 有关于何时使用的支持问题
- **解决方案**：在描述中添加更多细节和触发短语

**过度触发的信号**：
- Skill 为无关查询加载
- 用户禁用它
- 对目的感到困惑
- **解决方案**：添加负面触发，更具体

---

## 5. Distribution and Sharing（分发与共享）

### 5.1 当前分发模型（2026年1月）

#### 个人用户获取 Skills
1. 下载 skill 文件夹
2. 压缩为 ZIP（如需要）
3. 通过 Settings > Capabilities > Skills 上传到 Claude.ai
4. 或放入 Claude Code skills 目录

#### 组织级别 Skills
- 管理员可以在工作区范围内部署（2025年12月18日发布）
- 自动更新
- 集中管理

### 5.2 通过 API 使用 Skills

**关键能力**：
- `/v1/skills` 端点用于列出和管理 skills
- 通过 `container.skills` 参数添加到 Messages API 请求
- 通过 Claude Console 进行版本控制和管理
- 与 Claude Agent SDK 配合使用

**使用场景**：

| 场景 | 推荐平台 |
|------|----------|
| 最终用户直接交互 | Claude.ai / Claude Code |
| 开发期间手动测试和迭代 | Claude.ai / Claude Code |
| 个人的、临时的工作流 | Claude.ai / Claude Code |
| 使用 skills 编程的应用程序 | API |
| 生产级大规模部署 | API |
| 自动化管道和代理系统 | API |

### 5.3 推荐的分发方式

**步骤 1：托管在 GitHub**
- 公开仓库
- 清晰的 README 和安装说明
- 示例用法和截图

**步骤 2：在 MCP 文档中链接**
- 从 MCP 文档链接到 skills
- 解释一起使用的价值
- 提供快速入门指南

**步骤 3：创建安装指南**

```markdown
# Installing the [Your Service] skill

1. Download the skill:
   - Clone repo: `git clone https://github.com/yourcompany/skills`
   - Or download ZIP from Releases

2. Install in Claude:
   - Open Claude.ai > Settings > Skills
   - Click "Upload skill"
   - Select the skill folder (zipped)

3. Enable the skill:
   - Toggle on the [Your Service] skill
   - Ensure your MCP server is connected

4. Test:
   - Ask Claude: "Set up a new project in [Your Service]"
```

---

## 6. Patterns and Troubleshooting（模式与故障排除）

### 6.1 模式 1：顺序工作流编排

**使用场景**：用户需要特定顺序的多步骤流程

**示例结构**：

```markdown
## Workflow: Onboard New Customer

### Step 1: Create Account
Call MCP tool: `create_customer`
Parameters: name, email, company

### Step 2: Setup Payment
Call MCP tool: `setup_payment_method`
Wait for: payment method verification

### Step 3: Create Subscription
Call MCP tool: `create_subscription`
Parameters: plan_id, customer_id (from Step 1)

### Step 4: Send Welcome Email
Call MCP tool: `send_email`
Template: welcome_email_template
```

**关键技术**：
- 明确的步骤顺序
- 步骤之间的依赖关系
- 每个阶段的验证
- 失败时的回滚指令

### 6.2 模式 2：多 MCP 协调

**使用场景**：工作流跨越多个服务

**示例**：设计到开发交接

```markdown
### Phase 1: Design Export (Figma MCP)
1. Export design assets from Figma
2. Generate design specifications
3. Create asset manifest

### Phase 2: Asset Storage (Drive MCP)
1. Create project folder in Drive
2. Upload all assets
3. Generate shareable links

### Phase 3: Task Creation (Linear MCP)
1. Create development tasks
2. Attach asset links to tasks
3. Assign to engineering team

### Phase 4: Notification (Slack MCP)
1. Post handoff summary to #engineering
2. Include asset links and task references
```

### 6.3 模式 3：迭代优化

**使用场景**：输出质量通过迭代改进

**示例**：报告生成

```markdown
### Initial Draft
1. Fetch data via MCP
2. Generate first draft report
3. Save to temporary file

### Quality Check
1. Run validation script: `scripts/check_report.py`
2. Identify issues:
   - Missing sections
   - Inconsistent formatting
   - Data validation errors

### Refinement Loop
1. Address each identified issue
2. Regenerate affected sections
3. Re-validate
4. Repeat until quality threshold met

### Finalization
1. Apply final formatting
2. Generate summary
3. Save final version
```

### 6.4 模式 4：上下文感知工具选择

**使用场景**：相同结果，不同工具取决于上下文

**示例**：智能文件存储

```markdown
### Decision Tree
1. Check file type and size
2. Determine best storage location:
   - Large files (>10MB): Use cloud storage MCP
   - Collaborative docs: Use Notion/Docs MCP
   - Code files: Use GitHub MCP
   - Temporary files: Use local storage

### Execute Storage
Based on decision:
- Call appropriate MCP tool
- Apply service-specific metadata
- Generate access link
```

### 6.5 模式 5：领域特定智能

**使用场景**：你的 skill 添加超越工具访问的专业知识

**示例**：金融合规

```markdown
### Before Processing (Compliance Check)
1. Fetch transaction details via MCP
2. Apply compliance rules:
   - Check sanctions lists
   - Verify jurisdiction allowances
   - Assess risk level
3. Document compliance decision

### Processing
IF compliance passed:
   - Call payment processing MCP tool
   - Apply appropriate fraud checks
   - Process transaction
ELSE:
   - Flag for review
   - Create compliance case

### Audit Trail
- Log all compliance checks
- Record processing decisions
- Generate audit report
```

### 6.6 故障排除

#### Skill 无法上传
**错误**："Could not find SKILL.md in uploaded folder"
**原因**：文件未精确命名为 SKILL.md
**解决方案**：
- 重命名为 SKILL.md（区分大小写）
- 验证：`ls -la` 应显示 SKILL.md

#### Skill 不触发
**症状**：Skill 从不自动加载
**解决方案**：
- 重新审视描述字段
- 检查是否太模糊？
- 是否包含用户会说的触发短语？
- 是否提及相关文件类型？

**调试方法**：
问 Claude："When would you use the [skill name] skill?" Claude 会引用描述回来。根据缺失的内容进行调整。

#### Skill 触发太频繁
**症状**：Skill 为无关查询加载
**解决方案**：
1. 添加负面触发
2. 更具体
3. 澄清范围

```yaml
# ❌ 太宽泛
description: Processes documents

# ✅ 更具体
description: Processes PDF legal documents for contract review. Use for legal document workflows, not general text processing.
```

#### 指令未遵循
**症状**：Skill 加载但 Claude 不遵循指令
**常见原因**：
1. 指令太冗长
   - 保持指令简洁
   - 使用项目符号和编号列表
   - 将详细参考移到单独文件

2. 指令被埋没
   - 将关键指令放在顶部
   - 使用 ## Important 或 ## Critical 标题

3. 语言模糊
   - 添加明确的检查清单
   - 包括具体例子

#### MCP 连接问题
**症状**：Skill 加载但 MCP 调用失败
**检查清单**：
1. 验证 MCP 服务器已连接
   - Claude.ai: Settings > Extensions > [Your Service]
   - 应显示 "Connected" 状态

2. 检查身份验证
   - API 密钥有效且未过期
   - 正确的权限/范围
   - OAuth 令牌已刷新

3. 独立测试 MCP
   - 直接调用 MCP（不带 skill）
   - 如果失败，问题在 MCP 不是 skill

4. 验证工具名称
   - Skill 引用的 MCP 工具名称正确
   - 工具名称区分大小写

---

## 7. Resources and References（资源与参考）

### 7.1 官方资源

**文档**：
- [Skills 最佳实践指南](https://docs.anthropic.com/en/docs/claude-code/skills)
- [Skills API 文档](https://docs.anthropic.com/en/docs/claude-api/skills)
- [MCP 文档](https://modelcontextprotocol.io/introduction)

**官方博客**：
- [Introducing Agent Skills](https://www.anthropic.com/blog/agent-skills)
- [Engineering Blog: Equipping Agents for the Real World](https://www.anthropic.com/engineering/building-effective-agents)
- [Skills Explained](https://www.anthropic.com/blog/skills-explained)

**GitHub 仓库**：
- [anthropics/skills](https://github.com/anthropics/skills) - 官方技能库（14.3k+ Stars）
- 包含 Anthropic 创建的 skills 你可以自定义

### 7.2 工具和实用程序

**skill-creator skill**：
- 内置 Claude.ai 并可用于 Claude Code
- 可以从描述生成 skills
- 审查并提供建议
- 使用："Help me build a skill using skill-creator"

### 7.3 示例 Skills

**生产级技能仓库**：
- **Document Skills** - PDF, DOCX, PPTX, XLSX 创建
- **Example Skills** - 各种工作流模式
- **Partner Skills Directory** - 来自各种合作伙伴的 skills（Asana, Atlassian, Canva, Figma, Sentry, Zapier 等）

### 7.4 社区支持

**技术问题**：
- 一般问题：[Claude Developers Discord](https://discord.gg/anthropic)
- 详细文档：[菜鸟教程 - Agent Skills](https://www.runoob.com/claude-code/claude-agent-skills.html)

**Bug 报告**：
- GitHub Issues: anthropics/skills/issues
- 包括：Skill 名称、错误消息、复现步骤

---

## 8. 使用已有 Skills 的示例

在笔记中我们已经了解了如何构建 Skills，现在让我们看看如何**使用现有的 Skills** 来提高工作效率：

### 示例 1：使用 PDF Skill 处理文档

如果你需要处理 PDF 文件，可以使用 **document-skills:pdf** skill：

```bash
# 使用 Skill 工具调用 PDF 技能
Skill: document-skills:pdf
```

这个技能可以帮助你：
- 读取和提取 PDF 文本
- 合并或拆分 PDF
- 提取表格数据
- 添加水印
- 旋转页面

### 示例 2：使用前端设计 Skill

**document-skills:frontend-design** skill 可以帮助你：

> "Create distinctive, production-grade frontend interfaces with high design quality."

```bash
Skill: document-skills:frontend-design
```

### 示例 3：使用 xlsx Skill 处理电子表格

**document-skills:xlsx** skill 用于：

- 打开、读取、编辑现有 .xlsx, .xlsm, .csv, .tsv 文件
- 添加列、计算公式、格式化
- 从头创建新电子表格
- 清理混乱的表格数据

### 示例 4：使用 PPTX Skill 创建演示文稿

**document-skills:pptx** skill 用于：

- 创建幻灯片、演示文稿
- 读取、解析 .pptx 文件
- 编辑、修改现有演示文稿
- 合并或拆分幻灯片文件

### 示例 5：使用 Word 文档 Skill

**document-skills:docx** skill 用于：

- 创建、读取、编辑 .docx 文件
- 添加格式（表格、标题、页码）
- 插入或替换图片
- 查找和替换

### 示例 6：使用 skill-creator 创建自己的 Skill

要创建自定义 Skill，使用 **document-skills:skill-creator**：

```bash
Skill: document-skills:skill-creator
```

这个 skill 会引导你完成：
- 用例定义
- frontmatter 生成
- 指令编写
- 验证

---

## 附录：Quick Checklist（快速检查清单）

### 上传前
- [ ] 识别 2-3 个具体用例
- [ ] 确定工具（内置或 MCP）
- [ ] 查看示例 skills
- [ ] 规划文件夹结构

### 开发期间
- [ ] 文件夹命名为 kebab-case
- [ ] SKILL.md 文件存在（精确拼写）
- [ ] YAML frontmatter 有 --- 分隔符
- [ ] name 字段：kebab-case，无空格，无大写
- [ ] description 包含 WHAT 和 WHEN
- [ ] 无 XML 标签（< >）
- [ ] 指令清晰且可操作
- [ ] 包含错误处理
- [ ] 提供示例
- [ ] 引用清晰链接

### 上传后
- [ ] 在真实对话中测试
- [ ] 监控触发不足/过度
- [ ] 收集用户反馈
- [ ] 迭代描述和指令
- [ ] 更新版本号

---

## 参考资源汇总

| 资源 | 链接 |
|------|------|
| 完整指南 PDF | [The Complete Guide to Building Skills for Claude](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf) |
| 官方 Skills 仓库 | [github.com/anthropics/skills](https://github.com/anthropics/skills) |
| Skills 文档 | [docs.anthropic.com/en/docs/claude-code/skills](https://docs.anthropic.com/en/docs/claude-code/skills) |
| MCP 文档 | [modelcontextprotocol.io](https://modelcontextprotocol.io/introduction) |
| 菜鸟教程 | [Agent Skills 教程](https://www.runoob.com/claude-code/claude-agent-skills.html) |
| Claude Code | [claude.ai/code](https://claude.ai/code) |

---

*本文档基于 Anthropic 官方发布的《The Complete Guide to Building Skills for Claude》整理，持续更新中。*