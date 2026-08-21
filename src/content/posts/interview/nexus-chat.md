---
title: 面试材料准备——nexus-chat项目
date: '2026-05-23 15:30:00'
tags:
  - 面试
  - nexus-chat
categories:
  - 面试
cover: >-
  https://i.pcmag.com/imagery/reviews/07td46ju7p6lLVb0QGwc5VF-30.fit_lim.size_1200x630.v1756229870.png
description: >-
  1. 项目概览：一句话讲清楚 项目本质是一个企业协作聊天系统，支持频道、私信、线程回复、附件、@提及、未读计数、通知偏好和 MCP 工具接入 技术上
  Next.js 14 App Router + React 18 做前后端一体化，PostgreSQL + Prisma 做关系数据建模，Socket.IO
  做实时通信，
published: true
legacyPath: 2026/05/23/interview/nexus-chat
sourcePath: interview/nexus-chat.md
---

## 1. 项目概览：一句话讲清楚

项目本质是一个企业协作聊天系统，支持频道、私信、线程回复、附件、@提及、未读计数、通知偏好和 MCP 工具接入

技术上 Next.js 14 App Router + React 18 做前后端一体化，PostgreSQL + Prisma 做关系数据建模，Socket.IO 做实时通信，Zustand 做前端状态缓存，OSS 做附件存储，Docker/Dokploy/Traefik 做部署。核心难点是高并发聊天场景下消息要低延迟、可达、权限正确，同时未读数和通知不能靠每次全量扫描

推荐讲述顺序：先讲项目目标和个人职责，再讲总体架构，然后展开数据模型、实时消息链路、未读数和通知，最后补充 MCP、部署、Redis 扩展、测试保障和高频追问。

## 2. 简历亮点：三条经历怎么展开

### 2.1 牵头负责 `nexus-chat` 全生命周期

把整个系统拆成用户、频道、频道成员、线程回复、消息、线程、附件、提及、通知这些领域对象，然后用`Next.js`统一页面和API，`PgSQL`保证关系一致性，`Socket.IO`承担实时链路。后续我实现了`API`、前端消息流、`WebSocket`连接管理、未读消息数、通知、MCP server并补了Docker/Dokploy部署配置和测试脚本

代码对应：

- `src/app/api/*`:Next.js API routes
- `src/components/ChannelView.tsx 、 src/components/DirectMessageView.tsx`：频道和私信主界面
- `src/lib/websocket-server.ts` ：Socket.IO 服务端
- `server.ts` ：自定义 Next HTTP server，挂载 WebSocket
- `prisma/schema.prisma` ：核心数据库模型
- `mcp-server/` ：独立 MCP server
- `Dockerfile 、 docker-compose.dokploy.yml` ：部署配置

### 2.2 用数据模型和状态缓存优化实时体验

在这个项目里面，缓存策略主要不是 `Redis`，而是两层：服务端读模型缓存和前端状态缓存。服务端我把高频读取的未读数、线程回复数、最后消息时间反范式到关系表字段里，比如 `ChannelMember.unreadCount`、`DMConversationMember.unreadCount`、`Message.threadReplyCount`、`DMConversation.lastMessageAt`。这样侧边栏、未读徽标、线程入口不需要每次从 `message` 表 count。**前端用 `Zustand` 缓存未读数和线程状态，`Socket.IO` 推送到达后直接更新局部状态**

<aside class="admonition note">
Zustand 就是 React 里的一个轻量级全局状态仓库，用来让多个组件共享和同步状态

当多个组件都需要共享同一份数据时，不用一层一层传 props，而是把数据放到一个“全局小仓库”里，任何组件都可以直接读取和修改。

```
Socket.IO 收到 new-message
        ↓
更新 Zustand 里的 unreadCount
        ↓
侧边栏未读红点立刻变化
```

**不用每次都重新请求后端，也不用把状态从父组件一层层传下去**。
</aside>
**实时消息延迟的优化点**：
- 从发送后依赖轮询或刷新列表改为写库成功后按照`room`推送；
- 从 *每个组件可能建立连接*改为`SocketProvider`维护单例`socket`
- 从 *全局广播*改为`channel:[id]`、`dm:[id]`、`user:[id]`房间定向推送
- 客户端增加重连、去重和`room join`重试

**60%的说法建议这样解释**：

这不是指吞吐量提升60%，而是指在同一测试场景下，消息在目标时间窗口内被接收端UI追加展示的比例提升

*实时送达率 =指定时间窗口内接收端收到并渲染的消息数/发送成功消息数*

优化之前主要受轮询间隔、多连接竞争、重连后未及时`join room`影响

优化之后通过`Socket.IO room`、连接复用、重连机制和读模型缓存，实时到达比例明显提升

### 2.3 打通 Next.js、PostgreSQL、MCP Server 与部署链路

这个项目是我在企业项目里把 Next.js 和 PostgreSQL 落地到完整业务链路的一次实践。Next.js 负责页面和 API routes，但由于实时通信需要长期连接，我用了自定义 server.ts 把 Next handler 和 Socket.IO 挂到同一个 HTTP server 上。PostgreSQL 用来表达强关系模型，比如频道成员权限、私信成员、消息线程、消息反应和通知偏好。MCP server 是独立子项目，支持 HTTP JSON-RPC/SSE 和 stdio 两种模式，通过工具注册表暴露认证、频道、消息、用户、私信、通知、附件、线程等工具，部署时可以作为单独容器跑在 3002 端口，经 Traefik 暴露。

<aside class="admonition note">
`Traefik`是一个反向代理+网关+自动HTTPS管理工具。

> 反向代理就是客户端不直接访问后端服务，而是先访问代理服务器，代理服务器再转发给真正的后端

用户访问网站的时候，**不是直接访问next.js容器或者MCP容器**，而是先经过`Traefik`，再由其决定请求应该转发到哪一个服务

- **统一入口**：项目中包含主应用、MCP server、数据库管理工具等，它可以作为一个统一的入口，把不同域名或者路径转发到不同的容器中
- **自动配置了HTTPS**：Traefik 可以自动申请和续期 SSL 证书，也就是让你的服务支持 https://
  - Traefik 可以自动处理 HTTPS 证书，外部用户通过 HTTPS 访问，Traefik 负责 TLS 终止，然后把请求转发给内部 HTTP 服务。这样应用容器本身不需要单独处理证书逻辑。
- **支持WebSocket转发**：WebSocket 需要反向代理正确处理 upgrade 请求。Traefik 可以负责把 /socket.io 这类请求正确转发到后端
- **适合`Dokploy`部署**：Dokploy 底层常用 Traefik 来做服务路由。你部署多个容器时，只需要配置服务对应的域名，Traefik 就能**把外部请求导到正确容器**。

**几个核心概念**

- EntryPoint：入口端口，比如 80 / 443
- Router：匹配请求规则，比如域名、路径
- Middleware：中间处理，比如重定向、鉴权、限流
- Service：真正被转发到的后端服务
- Provider：服务发现来源，比如 Docker、Kubernetes

**Traefik和Nginx的区别**

- Nginx 更传统，配置通常偏静态；Traefik 更适合容器化和云原生环境，能自动发现 Docker/Kubernetes 服务，并根据 label 或 ingress 配置自动生成路由。
- 在 Dokploy、Docker Compose 这类部署环境中，Traefik 用起来更方便，因为新增服务时可以通过 labels 自动接入路由。

**负载均衡**

- Traefik 可以把请求分发到多个后端实例（把外部链接分发到不同的app实例）
- 如果 Next.js app 有多个实例，Traefik 可以做负载均衡，**把请求分发到不同容器**。但对于 WebSocket，需要注意连接是长连接，建立后通常会持续绑定到某个实例。多实例下还需要 Socket.IO Redis Adapter 来做跨实例消息广播。
- Traefik 解决“请求怎么分发到多个实例”，Redis Adapter 解决“不同实例之间的 socket room 怎么同步”。
</aside>
## 3. 总体架构：HTTP、WebSocket、MCP 三条链路

![架构讲解图](/my-blog/2026/05/23/interview/nexus-chat/image-7.png)

![整体关系图](/my-blog/2026/05/23/interview/nexus-chat/image-6.png)
![架构图](/my-blog/2026/05/23/interview/nexus-chat/image.png)

浏览器通过`HTTP API`完成认证、发消息、查历史、上传附件，通过`Socket.IO`接收实时事件。API 写 `PgSQL`，写库成功之后通过全局`Socket.IO`实例推送到对应`room`

`MCP server`本质是把主应用能力包装成AI/客户端可以调用的工具层

## 4. 核心数据模型：用户、会话与消息

### 4.1 用户与权限

- `User`：账号、邮箱、头像、在线状态、验证码字段。
- `UserSession`：保存 token hash、IP、UA、过期时间。
- `TeamMember`：团队成员身份和角色。

讲法：

认证用 JWT，登录后写入 `auth_token` httpOnly cookie，同时给 WebSocket 设置 `ws_token`。API 每次从 cookie 验证 JWT，WebSocket 在 handshake 阶段验证 token 并把 `userId` 写入 `socket.data`。

<aside class="admonition note">
JWT 是一种无状态认证方案。用户登录成功后，服务端生成包含用户身份信息和过期时间的 token，并用密钥签名。客户端后续请求会携带 JWT，服务端验证签名和过期时间后，就能识别用户身份。我的项目中，HTTP API 通过 cookie 中的 auth_token 验证用户，WebSocket 在 handshake 阶段也会验证 token，把 userId 写入 socket.data，后续 join channel 或 join dm 时再做权限校验

它和传统Session的区别是

```
传统 Session：
用户登录后，服务端保存 session
浏览器只保存 sessionId
每次请求服务端根据 sessionId 查用户

JWT：
用户登录后，用户信息直接放在 token 里
服务端主要验证 token 签名和过期时间
不一定需要查 session 表
```

JWT的作用流程大概是：

```
用户登录成功
   ↓
后端生成一个 JWT
   ↓
浏览器保存这个 JWT
   ↓
之后每次请求 API / 连接 WebSocket 时带上 JWT
   ↓
后端验证 JWT，判断“你是谁、有没有权限”
```
</aside>
### 4.2 频道和私信

- `Channel`：频道本体，支持公开/私有、归档、创建人。
- `ChannelMember`：频道成员关系，包含角色、最后已读、未读数、通知级别。
- `DMConversation`：私信会话，保存 `lastMessageAt`。
- `DMConversationMember`：私信成员关系，包含未读数、星标、通知级别。

讲法：

我把成员关系单独建表，而不是在频道表里存数组。这样可以做权限校验、成员角色、未读计数、通知偏好，还能用 `(channelId, userId)` 和 `(conversationId, userId)` 唯一约束避免重复加入。

### 4.3 消息、附件与通知

- `Message`：统一承载频道消息、私信消息和线程回复。
- `channelId` 与 `dmConversationId` 二选一。
- `parentMessageId` 表示线程回复。
- `threadReplyCount`、`lastReplyAt`、`isThreadRoot` 是线程读模型。
- `MessageMention`、`MessageRead`、`MessageReaction` 拆成独立表。
- `Attachment` 保存 OSS key、bucket、文件名、大小、MIME、缩略图。
- `Notification` 和 `NotificationSettings` 支持通知偏好。

讲法：

消息表没有拆成 channel_message 和 dm_message 两张表，**因为它们的行为非常相似**，**统一模型能复用编辑、删除、附件、反应、线程、搜索逻辑**。通过 **nullable 外键区分频道和私信**，再在 API 层保证二选一。

!!! example "nullable外键"
```
Message
------------------------------------------------
id
content
senderId
channelId          可以为空
dmConversationId   可以为空
createdAt
updatedAt
```

这里的`channelId`和`dmConversation`就是两个`nullable`外键
</aside>
## 5. 核心链路一：实时消息发送与接收

### 5.1 发送消息完整流程

1. 用户在频道或私信输入框发送消息。
2. 前端请求 `POST /api/messages`，带 `channelId` 或 `dmConversationId`。
3. API 验证 `auth_token`，确认用户是频道成员或私信成员。
4. Prisma transaction 创建 `Message` 和 `Attachment`，保证消息和附件一致。
5. 解析 @mention，写入 `MessageMention`，通过 `NotificationService` 生成通知。
6. 更新未读数和私信 `lastMessageAt`。
7. API 从 `global.io` 取 Socket.IO 实例，向 `channel:{id}` 或 `dm:{id}` room emit `new-message`。
8. 客户端 `useWebSocketMessages` 收到事件，校验是否属于当前 room，按 message id 去重，再追加到消息列表。

### 5.2 为什么用 Socket.IO

可回答：

原生 WebSocket 更轻，但我需要的是业务可靠性和开发效率：鉴权、房间、重连、心跳、fallback polling、跨浏览器处理，Socket.IO 都已经封装好了。对这个项目来说，延迟瓶颈不在协议的极限性能，而在连接管理、权限校验、room 粒度推送和客户端状态同步。

### 5.3 如何保证权限

- WebSocket 连接阶段校验 JWT。
- `join-channel` 时查询 `ChannelMember`，不是成员不能 join room。
- `join-dm` 时查询 `DMConversationMember`，不是成员不能 join room。
- HTTP 写消息前再次校验成员关系。

回答重点：

即使有人**绕过前端直接 emit join 事件**，服务端也会**查数据库做权限确认**。HTTP API 和 WebSocket room 都有权限防线。

### 5.4 如何处理重复和重连

- `SocketProvider` 维护单例 socket，避免多组件重复连接。
- 客户端开启自动重连、最大延迟、失败后 30 秒 fallback reconnect。
- `useWebSocketMessages` 有 room join 重试。
- 客户端用 `previousMessageIds` 和当前 state 双重去重。
- 服务端记录一个用户多个 socket id，多标签页只在最后一个 socket 断开时标记离线。

### 5.5 如果实时性出现问题我们怎么排查

我们排查 Socket 延迟时，不会直接认为是 WebSocket 慢，而是先把一条消息链路拆成多个阶段：**发送端点击、HTTP 请求到达后端、JWT 鉴权、权限校验、数据库写入、未读数和通知更新、Socket.IO emit、接收端收到事件、前端状态更新和 UI 渲染**。每个阶段都加时间戳和日志，这样可以判断延迟到底发生在写入链路、广播链路，还是前端渲染链路。

- 如果发送 API 本身很慢，我会重点看 Prisma transaction、消息写入、未读数 updateMany、通知生成这些数据库相关逻辑。
- 如果 API 很快但接收端慢，我会检查 Socket.IO 的连接状态、room 是否正确 join、重连后有没有重新 join、前端是否重复创建 socket，以及事件是否收到了但被前端过滤或去重逻辑误丢。

另外，我会重点关注广播粒度。早期如果使用全局广播，会导致大量无效事件。优化后应该按 channel:{id}、dm:{id}、user:{id} 这几类 room 定向推送，只把消息发给有权限且需要接收的用户。

如果是多实例部署，还要检查 Socket.IO Redis Adapter，因为单机 room 只存在当前进程内存里。用户连接分布在不同实例时，必须通过 **Redis Pub/Sub 做跨实例广播**。最后再检查网络层，比如 **WebSocket 是否成功 upgrade、ping/pong 延迟、是否频繁重连，以及 Traefik 这类反向代理是否正确转发 /socket.io**。

!!! note "排查工具"
- 前端问题——优先使用`Chrome DevTools`
  - 看`NetWork`里面的`HTTP`请求耗时
  - 看`Network`里面的websocket连接
  - 看控制台日志
- 如果 DevTools 的 *WebSocket Frames 里已经能看到 new-message 事件，但页面没有变化*，我会用 **React DevTools 或 Zustand DevTools**看状态有没有更新。这个时候问题通常不在 Socket，而在前端状态同步，比如闭包旧值、去重逻辑、当前频道判断或渲染条件错误。
- Socket.IO 有 *debug 日志*，开发时可以打开 DEBUG=socket.io:*，用来观察连接、断开、重连、事件发送和 transport 类型。这个对排查连接不稳定、没有成功 upgrade、频繁重连很有帮助。
- 数据库层我会用 *Prisma query log 和 PostgreSQL 慢查询日志*，看消息发送时具体执行了哪些 SQL，是否存在 N+1 查询、索引缺失、事务过长或者 updateMany 影响范围过大。很多实时延迟实际上来自数据库事务，而不是 WebSocket 本身。
- 如果问题只在部署环境出现，我会重点看 Traefik 和容器日志。**WebSocket 对反向代理配置比较敏感**，需要确认 /socket.io 路由正确、支持 Upgrade header、连接超时时间合理。如果代理没有正确处理 WebSocket，前端可能会退化成 polling，或者频繁断连重连。
</aside>
## 6. 核心链路二：未读数与通知

### 6.1 未读数读模型

服务端读模型：

- 频道未读存在 `ChannelMember.unreadCount`。
- 私信未读存在 `DMConversationMember.unreadCount`。
- 读消息时 `POST /api/messages/read` 把当前会话未读清零，更新 `lastReadAt` 和 `lastReadMessageId`。

前端缓存：

- `src/store/unreadStore.ts` 用 Zustand 保存 `unreadMap` 和总未读。
- 初次加载从 `/api/users/unread-counts` 拉取。
- 收到 `new-message` 时，如果不是当前用户发的消息，局部递增。
- 收到 `unread-count-update` 时以服务端值为准。

面试讲法：

未读数**不能每次都 `count messages where createdAt > lastReadAt`**，因为侧边栏会频繁展示多个频道和私信。把未读数放在成员关系表里，本质是为读场景建立读模型，写消息时付出一次 `updateMany` 成本，换取高频读的 O(1) 查询。

### 6.2 通知生成与推送

- @mention：解析消息内容，查用户，写 `MessageMention`，生成 `mention` 通知。
- DM：给其他成员生成 `dm` 通知。
- 线程回复：通知线程参与者。
- 通知偏好：`notificationLevel = all | mentions | nothing`，频道和私信都支持。
- 推送：`NotificationService` 写库后向 `user:{userId}` room emit `new-notification`。
- 前端：`useNotifications` 显示 Slack-style toast，页面后台时触发浏览器原生 Notification。

## 7. 产品能力补充：搜索、附件和富文本

搜索：

当前 API 主要使用 Prisma 的 `contains + mode: insensitive`，并限制在用户已加入频道和私信范围内，避免越权搜索。数据库初始化脚本里有 PostgreSQL 全文检索/Gin index 的预留和早期实现思路，后续可以把消息搜索升级到 `tsvector + GIN` 或 trigram。

附件：

附件上传通过 OSS。前端先请求 `/api/upload/presign` 获取预签名 URL，校验 MIME 和大小后直传 OSS，发消息时把 `s3Key`、`s3Bucket`、`fileUrl`、`thumbnailUrl` 作为 attachment 元数据写入数据库。这样大文件流量不经过 Next.js API，降低服务端压力。

富文本：

消息支持 Markdown、代码高亮、引用消息、emoji reaction、线程面板。引用消息存的是快照字段，比如 `quotedContent`、`quotedUserName`，这样原消息变化或删除时引用展示仍可控。


## 8. AI 扩展：MCP Server 接入

一句话：

MCP server 是给 AI 客户端或外部工具使用的能力层，把聊天系统里的认证、频道、消息、搜索、通知、附件等能力注册成 MCP tools，并通过 HTTP JSON-RPC/SSE 或 stdio 暴露。

关键实现：

- `mcp-server/src/index.ts`：根据 `MCP_MODE` 启动 HTTP 或 stdio。
- `mcp-server/src/server-http.ts`：提供 `/health`、`/login`、`/mcp/messages`，处理 JSON-RPC。
- `mcp-server/src/mcp-server-factory.ts`：注册 MCP SDK 的 tools/resources handler。
- `mcp-server/src/tools/index.ts`：合并 auth、channels、messages、users、conversations、notifications、attachments、threads。
- `mcp-server/src/executor.ts`：用 `Cookie: auth_token={userToken}` 调用主应用内部 API。

可讲细节：

MCP 不是直接绕过业务逻辑操作数据库，而是**大部分工具通过 APIExecutor 调主应用 API**，所以权限校验、数据校验、消息广播这些逻辑仍复用主系统。鉴权上，登录工具返回 JWT，后续工具通过 Bearer token 或参数里的 `userToken` 传入。

部署：

开发时 `server.ts` 支持拉起 MCP 子进程；生产部署建议拆成独立容器，`docker-compose.dokploy.yml` 里 app 和 `mcp-server` 分服务部署，MCP 暴露 3002，经 Traefik 配 HTTPS 域名。

## 9. 测试与稳定性

可以说：

我做了多层验证。单元测试层面项目配置了 Jest/ts-jest；接口层有 `test-api-features.sh` 按 Auth、Channels、Messaging、Search、Users、DM、Notifications、Threads、Attachments 分类跑；MCP 层有 `test-mcp-all.sh` 和 `mcp-server/src/test/mcp-coverage-test.ts`，会检查 tools/list、SSE 连接、工具定义和调用结果。线上/容器层有 `/api/health` 检查数据库、WebSocket 和 auth 状态。

如果被问“测试覆盖率多少”：

不要硬编数字。可以回答：

这个项目更偏功能型集成验证，覆盖重点是核心 API 和 MCP 工具链路。Jest 基础配置已经有，但主要保障来自自动化 shell 集成测试、MCP coverage test 和健康检查。后续如果继续生产化，我会补 Playwright 端到端测试和对实时消息链路的压测。

## 10. 部署链路与生产化注意事项

可讲版本：

应用用 Docker 构建，Node 20 运行。主应用容器跑 Next build 后通过 `npx tsx server.ts` 启动自定义 server。数据库使用 PostgreSQL，生产环境通过 Dokploy 的外部 Postgres 服务连接。Traefik 负责 HTTPS、域名路由和 `/socket.io` WebSocket 路由。MCP server 作为单独容器暴露 3002。构建和发布流程里通过 Prisma generate/migrate 保证数据库结构同步。

注意事项：

- WebSocket 要在反向代理层正确处理 `/socket.io` 路径和 upgrade。
- app server 必须监听 `0.0.0.0`，否则容器外访问不到。
- 生产多实例时，Socket.IO 不能只靠单机内存 room，需要 Redis adapter 或消息队列做跨实例广播。

## 11. 生产化扩展：Redis 方案

### 11.1 Redis 是什么

Redis 可以理解成一个**速度非常快的内存数据库**，它和传统关系型数据库的区别是

- PostgreSQL / MySQL：主要把数据存在磁盘里，适合长期保存、复杂查询、事务关系
- Redis：主要把数据存在内存里，读写特别快，适合高频访问、临时状态、热点数据

<aside class="admonition example">
用户打开聊天系统侧边栏的时候，需要显示未读数，如果每一次都查数据库：

```
用户访问页面
  ↓
查 PostgreSQL
  ↓
统计未读消息
  ↓
返回结果
```

用`redis`之后，可以这样：

```
用户访问页面
  ↓
先查 Redis
  ↓
Redis 有结果：直接返回
  ↓
Redis 没结果：再查 PostgreSQL，并把结果写入 Redis
```

其实就是缓存
</aside>
### 11.2 在 nexus-chat 里怎么定位 Redis

在 `nexus-chat` 里面，我会把 Redis 定位为 **加速层和分布式协调层**，而不是核心业务数据源。消息、频道成员关系、私信成员关系、通知记录、未读数权威值都仍然以 PostgreSQL 为准。

### 11.3 Redis 主要解决的四类问题

**1. 用`Socket.IO Redis Adapter`支持多实例下的`room`广播**

在聊天系统里，实时消息推送是核心能力

单机部署时，`Socket.IO`的`room`存在当前`Node.js`进程内存里。例如：

```
channel:{channelId}
dm:{conversationId}
user:{userId}
```

一个用户加入频道后，就进入对应的`room`。后端发消息时，只需要向这个`room`推送事件

但是多实例部署后，每个`Node`进程都有自己的`room`内存。**某个实例并不知道其他实例上有哪些`socket`连接**

所以我们选择引入`Socket.IO Redis Adapter`,它的作用是

```
App Server 1 收到消息
        ↓
通过 Redis Pub/Sub 通知其他实例
        ↓
App Server 2 / Server 3 收到事件
        ↓
各自推送给本机连接的用户
```

Redis Adapter 不是用来存消息历史的，它**只负责跨实例转发实时事件**。消息本身已经先写入 PostgreSQL，所以即使 Redis 的实时转发短暂失败，用户刷新或者重连后，也可以通过历史消息接口从数据库补齐，不会造成业务数据丢失。

**2. 缓存用户未读摘要、最近消息第一页、用户资料和频道信息，降低数据库高频读取压力**

- 未读数缓存方案

    未读数是聊天系统里非常高频的数据，因为侧边栏每次都要展示每个频道和私信的未读数量。

    但是我不会把未读数完全放到 Redis 里，因为**未读数不是单纯的展示数据**，它是**业务状态**。用户**有没有读过某个频道，会影响通知、侧边栏状态和消息阅读进度**。

    未读数的权威值仍然在 PostgreSQL 的成员关系表中，Redis 只是缓存用户侧边栏需要的**聚合摘要**。用户进入系统时先查 Redis，如果命中就快速返回；如果没有命中，就回源查 PostgreSQL，然后再写入 Redis。发消息时，数据库先完成未读数递增，再同步更新或删除 Redis 缓存。

    > 聚合摘要就是把底层大量明细数据提前汇总成一个更轻量的结果。在聊天系统里，未读数的明细来源是消息表和成员阅读状态，但是前端侧边栏并不需要完整的消息，只需要每个频道和私信的未读数量。所以我会把这些结果聚合成用户未读的`unread summary`缓存到`Redis`中，用来提升读取速度、减少数据库统计压力，并方便前端快速展示

    如果面试官追问一致性，可以回答：

    一致性上我会以 PostgreSQL 为准。Redis key 会设置较短 TTL，比如 30 到 60 秒。即使 Redis 更新失败，也不会影响发消息主流程，只会造成短时间缓存不准确，后续回源数据库会修正。

- 最近消息缓存方案

    聊天系统里另一个高频场景是：用户进入频道后，需要拉取最近几十条消息。这个数据可以放入 Redis 缓存，减少数据库压力。

    但是我没有一开始就把所有消息列表都复杂地维护在`Redis List`中，因为消息不只是新增，还可能有

    ```
    编辑
    删除
    附件变化
    reaction
    引用
    线程回复
    ```

    如果每个变化都去精确维护`Redis`中的消息列表，复杂度会很高，而且容易出错。我们选择的是更稳妥的方案：**只缓存最近第一条消息，写操作后删除缓存，下一次读取时回源数据库重建缓存**

    面试可以这样讲：

    *对最近消息缓存，我会采用**比较保守的 cache-aside 策略**。只缓存最近 50 条消息，并设置较短 TTL。发新消息、编辑消息、删除消息后，直接删除对应频道或私信的最近消息缓存。这样虽然牺牲了一些缓存命中率，但一致性更容易保证，实现也更稳定。*

    如果面试官问为什么不缓存深分页，可以回答：

    **深分页命中率低**，而且一致性维护复杂。我只缓存最近第一页。用户继续向上翻历史消息时，直接走数据库索引查询。

**3. 用TTL管理在线状态和typing状态**

在线状态和正在输入状态非常适合 Redis。因为它们有几个特点：

- 变化频繁
- 生命周期短
- 允许短暂误差
- 不需要长期持久化

如果每次用户上线、下线、心跳都写 PostgreSQL，会产生大量写入，得不偿失。所以可以用 Redis TTL 来维护在线状态。

- 用户连接 WebSocket 时，设置 presence 状态
- 用户心跳时，刷新过期时间
- 用户断开时，删除状态
- 如果异常断开，TTL 自动过期

面试可以这样讲：

*在线状态我会用 Redis 的 TTL 机制来做。用户建立 socket 连接时写入在线状态，并设置 60 秒过期时间；心跳时续期；正常断开时删除；如果异常断开没有执行删除逻辑，TTL 到期后也会自动下线。这样比把在线状态频繁写入数据库更自然。*

typing 状态也类似：

*typing 状态更短，一般设置 3 到 5 秒 TTL。**用户输入时设置，停止输入后自然过期，不需要持久化。***

**4. 用原子计数实现验证码、登录和发消息限流**

Redis 也适合做限流和验证码，因为它支持高性能原子计数和过期时间。

在 nexus-chat 这种系统里，可以限制：

- 邮箱验证码发送频率
- 登录尝试次数
- 发消息频率
- 上传附件频率

<aside class="admonition example">
比如发消息限流：

同一个用户 10 秒内最多发送 20 条消息

</aside>
面试时不用讲具体代码，可以讲方案：

*我会用 Redis 记录某个用户在一个时间窗口内的操作次数。每次请求时对计数器做原子递增，如果是第一次访问就设置过期时间。如果计数超过阈值，就拒绝请求。这样可以实现**跨实例统一限流**，避免多实例部署时每个实例各自计数导致限流被绕过。*

验证码也类似：

*验证码适合放 Redis，因为它本身就是短期数据。比如邮箱验证码**设置 5 分钟 TTL，验证成功后立即删除**。*

### 11.4 为什么这个项目后续需要 Redis

在单机版本里，nexus-chat 可以只依赖 PostgreSQL 和 Socket.IO。但如果系统进入生产环境，**部署多个后端实例，就会出现几个问题**

#### 第一，WebSocket 连接分散在不同实例上。

<aside class="admonition example">
用户 A 连接到 App Server 1，用户 B 连接到 App Server 2。A 发消息后，Server 1 只知道自己进程内的 socket，不知道 Server 2 上有哪些用户连接，所以无法直接把消息推给 B。

这个时候就需要 **Redis 作为 Socket.IO 多实例之间的事件中转层。**
</aside>
#### 第二，部分数据读取频率很高。

比如侧边栏未读数、最近消息、频道列表、用户基础资料，这些数据会被频繁读取。如果每次都直接查 PostgreSQL，数据库压力会比较大。

Redis 可以**缓存这些热点数据，减少数据库重复查询**。

#### 第三，有些状态生命周期很短，不适合落数据库。

比如*在线状态、正在输入状态、临时限流计数*。这些数据变化频繁，而且允许短暂不精确，用 PostgreSQL 存会带来很多无意义写入。Redis 的 TTL 自动过期机制非常适合这种场景。

### 11.5 Redis 宕机如何降级

可以这样回答：

*我会把 Redis 设计成可降级依赖。Redis 宕机时，缓存读失败就直接查 PostgreSQL；**缓存写失败只记录日志，不阻塞主流程**。**消息仍然可以写入数据库，历史消息也可以正常读取**。受影响较大的是多实例 WebSocket 实时广播、在线状态和限流能力。*

然后补充：

*如果 Socket.IO Redis Adapter 不可用，多实例之间的实时推送会受影响，但消息不会丢，因为消息已经落库。**用户刷新或重连后可以重新拉取历史消息**。限流可以临时降级为单机内存限流，但防刷能力会下降。*
 
### 11.6 Redis 面试追问

#### 1. 为什么未读数不完全放在 `Redis`

因为未读数是**业务状态**，**不只是展示缓存**。如果 `Redis` 数据丢失，用户的阅读状态不能永久丢，所以未读数的权威值应该放在 `PostgreSQL` 成员关系表里面，`Redis` 只缓存用户维度的聚合结果，用来加速侧边栏展示

#### 2. `Redis Pub/Sub` 会不会导致消息丢失

`Redis Pub/Sub` 只负责实时推送，不负责消息持久化。消息流程是先写 PostgreSQL，写库成功后再通过 `Socket.IO` 推送。所以即使 `Redis Pub/Sub` 瞬时失败，消息也不会丢，用户可以通过历史消息接口补齐

#### 3. 为什么在线状态不用数据库

在线状态变化频繁，而且允许短暂不精确。如果频繁写数据库，会增加数据库写的压力。`Redis TTL` 更适合这种短生命周期状态。异常断开时，即使没有执行下线逻辑，`key` 过期后也能自动恢复正确状态

#### 4. 缓存和数据库不一致怎么办

我会以数据库为准。缓存设置短 `TTL`，并且写操作后删除或者更新相关缓存。如果 `Redis` 更新失败，不影响主流程，后续缓存过期或 `miss` 后会从数据库重新构建


#### 5. `Redis` 在多实例部署里面解决了什么问题

主要解决两个问题

- `Socket.IO` 多实例之间的 `room` 广播同步
- 限流、验证码、在线状态这些实例共享状态

如果没有 `Redis`，每个实例只知道自己的内存状态，部署多个实例后就会出现广播不到、限流不统一的问题

#### 6. 最近消息为什么只缓存第一页

最近第一页访问频率最高、缓存收益最大。深分页命中率低，而且消息编辑、删除、`reaction` 等操作会让缓存维护复杂。所以我只缓存最近 50 条，历史翻页直接查数据库的索引

#### 7. `Redis` 里会不会存敏感数据

不会明文密码，也不会存长期 token。验证码只存短 TTL。如果需要存 session 相关信息，也应该存 hash 或 session id。Redis 不暴露公网，只走内网访问，并配置认证和访问控制。

## 12. 高频追问与参考答案

### Q1：为什么不用 Firebase / Supabase Realtime？

我希望对权限、消息模型和 MCP 工具层有更强控制。这个项目不只是实时列表，还涉及频道/私信权限、线程、附件、通知偏好、MCP tools 和企业部署。PostgreSQL + Prisma + Socket.IO 更适合做可控的业务系统，也方便后续自部署和接入内部环境。

### Q2：为什么 Next.js 还要自定义 server？

Next.js API routes 适合无状态 HTTP，但 Socket.IO 需要挂在同一个 HTTP server 上处理长连接、心跳和 upgrade。`server.ts` 创建 HTTP server，把 Next request handler 和 `setupWebSocket(httpServer)` 放在一起，API 写库后可以通过 `global.io` 推送实时事件。

### Q3：消息发送为什么先写库再广播？

为了保证客户端看到的是已经持久化的消息。如果先广播再写库，写库失败时接收端会看到一条不存在的消息，后续刷新又消失。当前设计是事务写库成功后广播；广播失败不影响 HTTP 成功，因为消息已经持久化，用户刷新或重新拉取历史仍能看到。

### Q4：如何避免越权读取私有频道消息？

读取消息和写消息 API 都会先查成员关系。频道查 `ChannelMember`，私信查 `DMConversationMember`。WebSocket join room 也会查成员关系。搜索时也只在当前用户加入的频道和私信会话范围内查。

### Q5：高并发下 unreadCount 会不会不准？

当前用数据库原子递增 `increment` 和 `updateMany`，比前端自行计算可靠。进一步生产化时，我会把未读计数更新放在同一个事务或明确的事件处理链路里，并用幂等消息事件避免重复消费。如果水平扩展，需要把 Socket.IO 和未读事件通过 Redis/队列统一。

### Q6：为什么不用 Redis 缓存未读数？

这个阶段我先用 PostgreSQL 读模型，因为未读数是强一致业务数据，不能只是临时缓存。把它放在成员关系表里可以和权限模型一致维护。Redis 更适合后续做跨实例 Socket.IO adapter、在线状态、限流和热点列表缓存，而不是替代数据库里的权威未读数。

### Q7：MCP 工具如何保证安全？

MCP 登录后拿 JWT，后续工具调用必须带 `userToken`，HTTP server 会验证 token。工具执行大多走主应用 API，所以复用原来的权限校验。无认证工具只保留 register、login、health_check、send_verification 这类入口。

### Q8：附件上传为什么用预签名 URL？

避免大文件经过应用服务器。服务端只负责鉴权、校验文件类型/大小、生成 OSS 预签名 URL 和最终保存附件元数据；实际文件直传 OSS。这能降低 API 压力，也方便 CDN/对象存储做后续下载和预览。

### Q9：这个项目最大的技术难点是什么？

最大难点不是做一个输入框，而是让实时链路和关系权限模型一致。消息要先正确持久化，再只推给有权限的人；未读数、通知、线程和附件都要跟着同一条消息事件更新；前端还要处理重连、重复消息、分页加载和滚动位置。我的重点是把这些拆成清晰的数据模型和事件链路。

### Q10：如果继续优化，你会怎么做？

第一，引入 Redis adapter 支持 Socket.IO 多实例，解决横向扩展。第二，把全文搜索切到 PostgreSQL FTS/GIN 或 OpenSearch。第三，补 Playwright E2E 和压测脚本，量化 P50/P95 延迟和实时送达率。第四，收紧安全配置，比如生产 cookie `secure: true`、WebSocket token 短期化、rate limiter 从内存迁到 Redis。

## 13. STAR 故事 1：实时消息延迟

Situation：

早期消息发送后，接收端并不总是马上看到，需要依赖刷新或重新拉取；多个页面组件各自处理连接，也导致重连和房间订阅不稳定。

Task：

目标是在频道和私信场景下实现稳定的实时送达，并且在重连、多标签页、切换频道时不丢消息、不重复展示。

Action：

我把 WebSocket 抽成 `SocketProvider` 单例，服务端用 Socket.IO room 区分 `channel:{id}`、`dm:{id}`、`user:{id}`。连接时校验 JWT，join room 时校验成员权限。发送消息 API 改成写库事务成功后定向广播。客户端 `useWebSocketMessages` 增加 room join 重试、message id 去重、回调 ref 避免监听器频繁重建，并保留分页拉取作为兜底。

Result：

接收端不再依赖轮询刷新，消息可以在目标 room 内实时追加展示。简历里的“实时送达率提升 60%”可以解释为：在相同并发测试场景下，目标时间窗口内被接收端成功渲染的消息比例提升，而不是单机极限吞吐提升。

## 14. STAR 故事 2：未读数和读模型

Situation：

聊天产品侧边栏会高频展示每个频道/私信的未读数。如果每次都按消息表扫描，随着消息量增长会越来越慢。

Task：

需要让未读数读取足够快，并且和消息发送、已读动作保持一致。

Action：

我把未读数放到成员关系表中，频道用 `ChannelMember.unreadCount`，私信用 `DMConversationMember.unreadCount`。发消息时给除发送者外的成员递增；读消息时通过 `/api/messages/read` 清零并记录 `lastReadAt`。前端启动时从 `/api/users/unread-counts` 拉取权威值，后续通过 WebSocket 事件局部更新 Zustand store。

Result：

侧边栏读取变成按用户查成员表，而不是反复 count 消息表。这个设计牺牲了一点写入复杂度，换来了高频读取的稳定性。

## 15. STAR 故事 3：MCP Server 接入

Situation：

项目需要让外部 AI 客户端可以操作聊天系统，比如列频道、发消息、查用户、搜索消息。

Task：

需要提供一层标准化工具协议，同时不能绕开主系统权限。

Action：

我拆了独立 `mcp-server` 子项目，支持 HTTP JSON-RPC/SSE 和 stdio。工具按 auth、channels、messages、users、conversations、notifications、attachments、threads 分类注册。工具调用通过 `APIExecutor` 带 `auth_token` cookie 调主应用 API，复用已有鉴权和业务校验。部署上独立容器跑 3002，经 Traefik 暴露。

Result：

MCP 客户端可以通过标准 tools 调用聊天系统能力；主系统不需要为每个客户端重写一套业务逻辑，权限和数据一致性也保持在同一套 API 中。


## 15. STAR故 4：优化 @mention 候选弹窗的触发时机

我们在做 @mention 的时候，遇到的核心问题不是输入 @ 后怎么弹出列表，而是列表什么时候应该及时收起。因为产品上允许用户输入 @ 后立刻出现候选列表，但如果后续输入的内容已经明显不是在搜索用户，列表就不能一直悬浮在输入框上，否则会干扰正常输入。

所以我把这个问题抽象成一个 mention 输入状态机。用户输入 @ 后进入 mention 搜索状态；之后每次输入变化时，不是只判断文本里有没有 @，而是基于当前光标位置往前找最近的 @，然后分析 @ 到光标之间的内容。

如果这段内容是连续的合法搜索词，比如 @al，就继续展示候选列表，并用 al 作为搜索关键词。如果中间出现空格，比如 @alice hello，说明 mention 输入已经结束，就立即收起列表。如果出现 /、#、标点这类不符合用户名搜索的字符，也会退出 mention 状态。如果用户删除了 @，或者光标移动到了 mention 区间之外，也会关闭弹窗。

这样做之后，列表不会因为输入过一个 @ 就一直存在，而是能随着用户输入状态及时出现和消失。这个改动虽然是一个交互细节，但它体现了我在处理复杂输入组件时，不只是做静态 UI，而是会把用户输入过程建模成状态流，针对边界情况做精确控制。

我们后来意识到，@mention 弹窗不能只由“输入框里有没有 @”决定，也不能完全由“搜索有没有结果”决定。更合理的是把它拆成两层：第一层判断用户当前是否还处于 mention 输入状态，第二层才是根据关键词做模糊搜索。

*用户输入 @ 后可以立即进入 mention 状态，后续输入会不断作为关键词去搜索候选用户。如果关键词合法，比如 @al，就持续更新候选列表。如果当前没有匹配用户，我倾向于显示“无匹配用户”，而不是立刻关闭，因为这样用户能明确知道系统仍在处理 mention，只是没有找到结果。但是如果输入内容已经从语义上不再是 mention，比如 @ 后面出现空格、非法字符，或者用户删除了 @、光标移出 mention 区间、按 Esc、选择了候选人，这些情况就应该立即退出 mention 状态并收起列表。所以我的判断逻辑是：@ 是进入状态的触发条件，空格/非法字符/光标变化是退出状态的条件，模糊搜索结果只影响弹窗内容，而不一定直接决定弹窗是否存在*

## 16. 需要主动暴露的边界和改进

面试时可以主动说，显得真实：

- 当前 Socket.IO 使用单机内存 room，水平扩展需要 Redis adapter。
- 当前 rate limiter 是内存版，生产多实例需要 Redis。
- 当前搜索 API 主要是 Prisma contains，后续应升级 PostgreSQL FTS/GIN 或专门搜索服务。
- 当前 `next.config.js` 忽略 TypeScript/ESLint 构建错误，这是部署阶段的临时策略，生产化应收敛。
- 当前 WebSocket 用可读 `ws_token`，生产可改成短期 token 或 handshake 直接解析安全 cookie。
- 当前 session 校验如果按 token hash 遍历会有性能问题，后续可用 session id + HMAC hash 做可索引查询。
