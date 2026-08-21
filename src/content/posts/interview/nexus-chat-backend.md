---
title: 面试材料准备——nexus-chat项目后端知识点总结
date: '2026-06-04 09:30:00'
tags:
  - 面试
  - nexus-chat后端知识点
categories:
  - 面试
cover: >-
  https://i.pcmag.com/imagery/reviews/07td46ju7p6lLVb0QGwc5VF-30.fit_lim.size_1200x630.v1756229870.png
description: >-
  1. 数据库( PostgreSQL ) 1.1 索引设计：为什么需要在这些场景设计索引 1. 用户进入频道→需要查成员并校验身份 - 产品功能
  ：用户点击侧边栏的一个频道，进入聊天界面。系统需要做两件事——展示右侧的成员列表以及确认当前用户确实是这个频道的成员(权限校验) - 涉及索引 ：
  @@unique([cha
published: true
legacyPath: 2026/06/04/interview/nexus-chat-backend
sourcePath: interview/nexus-chat-backend.md
---

## 1. 数据库(`PostgreSQL`)

### 1.1 索引设计：为什么需要在这些场景设计索引

#### 1. 用户进入频道→需要查成员并校验身份

- **产品功能**：用户点击侧边栏的一个频道，进入聊天界面。系统需要做两件事——展示右侧的成员列表以及确认当前用户确实是这个频道的成员(权限校验)
- **涉及索引**：`@@unique([channelId, userId]) on ChannelMember`
- **为什么需要索引**：这是全系统频率最高的查询之一，用户每一次切换频道都会触发`WHERE channel_id = ?`。
  - 没有索引就是全表扫描，随着频道和用户量增长，切频道会越来越慢
  - 发消息时也需要校验`WHERE channel_id = ? AND user_id = ?`来确认发送权限，这也是高频操作
- **为什么用唯一约束而不是普通索引**：同一个用户不能重复加入同一个频道——这是一个业务规则。如果我只用普通索引，并发场景下两个加入频道请求可能同时通过应用层的检查，产生两条重复记录
  - 唯一约束让数据库成为最后一道防线——它同时提供**查询加速和业务正确性保证**

> 私信场景完全对称，`DMConcersationMember`用了同样的`@@unique([conversationId, userId])`

!!! note "普通索引与唯一约束"
- 普通索引：给某些字段建立一个方便查询的数据结构。当我们要查询某个表的时候不需要全表扫描，而是可以通过索引快速通过索引快速找到某个频道的所有成员
  - 普通索引的重点是 **提高查询速度**，但是它 **不限制重复数据**
  - 这可能会导致同一个用户可以被插入两次到同一个频道
- 唯一约束：某个字段，或者某组字段的组合，不能出现重复值
  - 比如上面的场景中一定要保证`channelId+userId`这一组组合式唯一的

| 对比点           | 普通索引       | 唯一约束                       |
| ---------------- | -------------- | ------------------------------ |
| 主要作用         | 加快查询       | 保证不重复，同时加快查询       |
| 是否允许重复     | 允许           | 不允许                         |
| 是否保证业务规则 | 不保证         | 保证                           |
| 适合场景         | 查列表、查记录 | 邮箱唯一、用户不能重复加入频道 |
| 并发安全         | 不能防重复插入 | 可以防重复插入                 |

</aside>
#### 2. @提及 → 消息渲染时展示了`@了谁`

- **产品功能**：用户在消息中输入 `@张三`，张三收到通知。点击消息时，消息下方显示`@ 了张三、李四`
- 涉及索引：`@@unique([messageId, mentionedUserId]) on MessageMention`
- **为什么需要索引**：每条消息渲染时都要查它的`mention`列表。没有索引意味着消息列表渲染`50`条就要扫描`mention`表`50`次
- **为什么要用唯一约束**：
  - 某一条消息是可以被重新编辑的，如果该消息重新编辑之后不用唯一约束，消息保存后，后端可能会重新解析整条消息里的`@张三`并将其再次插入，那么数据库里就出现了两条完全重复的`mention`记录
  - 如果同一条消息中写了`@张三 @张三 你看一下`，如果不做去重就会在`mention`表中生成两条指向同一消息的记录。

#### 3. 已读回执——谁读了我的消息

- **产品功能**：类似 Slack 的已读标记——用户能看到自己发的消息被哪些人看过了。
- **涉及索引**：`@@unique([messageId, userId]) on MessageRead`
- **为什么需要索引**：已读标记本身就是一个高频写入操作（每条消息 × 每个频道成员），用户查看已读状态也是高频查询。没有索引的话，查询一条消息的所有已读用户会随着成员数增长越来越慢。
- **为什么用唯一约束**：一条消息对一个用户**只能有一个已读状态**。用户*可能因为网络抖动发送两次标记请求*，唯一约束保证*不会产生重复的已读记录*。

#### 4. emoji reaction → 一条消息可以被多个用户用多个表情回应

- **产品功能**：用户对消息 👍 ❤️ 🎉，消息下方聚合展示 `reaction` 统计。
- **涉及索引**：`@@unique([messageId, userId, emoji]) on MessageReaction`
- **为什么需要索引**：这是项目中查询最频繁的关联表——**每条消息渲染时都要查它的所有 reaction 来做聚合展示**。消息列表每渲染 50 条消息，就是 50 次关联查询。
- **为什么是三个字段的联合唯一**：业务规则是——同一用户可以**对同一消息用不同 emoji**（先 👍 再 ❤️），但**不能用同一 emoji 重复点击**。所以需要 `(messageId, userId, emoji)`三字段才能唯一定义一条 reaction。
- **字段顺序**：messageId 在最前，对应最高频查询——「渲染这条消息时**展示所有 reaction**」

#### 5. 线程回复 → 点击消息展开回复面板

- **产品功能**：用户点击一条消息的「X 条回复」，右侧弹出线程面板，展示这条消息下的所有回复。
- **涉及索引**：`@@index([parentMessageId]) on Message`
- **为什么需要索引**：这是一个需要即时响应的交互——用户点击后不能有明显的加载延迟。查询是 `WHERE parent_message_id = ? ORDER BY created_at`。**没有索引每次打开线程面板都要全表扫描消息表**。
- **为什么用普通索引而不是唯一约束**：一条消息下可以有任意多条回复，不需要去重。

#### 6. 线程列表 → 侧边栏展示「你参与的线程」

- **产品功能**：侧边栏有一个「线程」入口，展示用户参与过的所有线程。
- **涉及索引**：`@@index([isThreadRoot]) on Message`
- **为什么需要索引**：需要从海量消息中快速筛选出"**是线程根消息**"的记录。`isThreadRoot = true` 的消息*占总消息的比例很低*——**绝大多数消息是普通消息或线程回复**。如果没有索引，每次打开线程列表都要遍历整个消息表。
- **为什么在布尔字段上建索引**：通常低基数列（只有 true/false）不建议建索引，但这里特殊——true 值的比例极低，选择性很高。类似于 is_deleted = false 在软删除场景下适合建索引。

#### 7. 通知跳转 → 从通知定位到线程

- **产品功能**：用户收到「张三回复了你的线程」，点击通知跳转到对应线程。
- **涉及索引**：`@@index([relatedThreadId]) on Notification`
- **为什么需要索引**：查询模式单一——始终是按线程 ID 查通知。单列索引就够了。

**设计思路小结**

这 8 个索引背后的设计逻辑可以归纳为一个决策框架：

> 对于每个关联表或高频查询字段，问自己三个问题：
> 
> 1. 这个字段会被频繁地作为查询条件吗？ → 如果是，值得建索引
> 2. 这组字段在业务上能重复吗？ → 不能重复就用 @@unique，一举两得（查询加速 + 业务正确性）
> 3. 这个索引的写入成本能接受吗？ → 在写入最频繁的表（如 Message）上谨慎加索引


**为什么`Message`表本身没有加符合索引**

> Message 是写入最频繁的表。每个额外索引都会增加 INSERT 的维护成本。当前查询场景（按频道拉最近 50 条）靠外键索引和 createdAt 默认索引已经能覆盖。等消息量成为瓶颈再加 (channelId, createdAt) 复合索引，比现在过度索引更合理。索引不是免费的——每个索引都在用写入性能换读取性能。

### 1.2 深分页优化

**考点**：大 offset 的性能问题、游标分页 vs offset 分页。

**项目实现(src/app/api/messages/route.ts)**

```ts    
// 当前使用 offset 分页
const limit = parseInt(searchParams.get("limit") || "50");
const offset = parseInt(searchParams.get("offset") || "0");

const messages = await prisma.message.findMany({
  where: { channelId, deletedAt: null },
  orderBy: { createdAt: "desc" },
  take: limit,
  skip: offset,  // offset 分页
});
```

**面试讲法**：

> 当前消息列表使用了`offset`分页，`take`默认`50`条。我清楚 offset 分页在大数据量下会有性能问题——*PostgreSQL 需要扫描 offset+limit 行然后丢弃前 offset 行*。在聊天场景里，用户通常只看最近的消息，所以这个设计目前够用。如果后续需要优化，我会改成**游标分页cursor-based pagination**，用 `WHERE createdAt < :lastCursor` 替代 `OFFSET`。这样每次查询**只扫描需要的行数**，**不受数据总量影响**，而且天然避免了**新增消息导致翻页重复或跳过**的问题。

### 1.3 事务设计

项目中一共有`8`处事务，按照设计意图可以分成三类



#### 1. 主记录+关联记录必须同时存在

##### 创建频道

```ts
const channel = await prisma.$transaction(async (tx) => {
  const newChannel = await tx.channel.create({ data: { name, createdById } });
  await tx.channelMember.create({
    data: { channelId: newChannel.id, userId: createdById, role: "owner" },
  });
  return newChannel;
});
```

创建频道时必须同时把创建者加入为成员，且角色为`owner`。如果只创建了频道但是成员关系插入失败，这个频道就变成了一个没有成员的幽灵频道——没人能进入、没人能管理

##### 创建私信回话

```ts
const newConversation = await prisma.$transaction(async (tx) => {
  const conversation = await tx.dMConversation.create({ data: { createdById: currentUserId } });
  await tx.dMConversationMember.createMany({
    data: [
      { conversationId: conversation.id, userId: currentUserId },
      { conversationId: conversation.id, userId: targetUserId },
    ],
  });
  return conversation;
});
```

创建`DM`会话必须同时为双方创建成员关系。如果会话创建成功但是成员关系只写入了其中一方，另一方就永远看不到这个会话。**三连操作（一个会话 + 两个成员关系）必须原子完成**

##### 发消息

```ts
const message = await prisma.$transaction(async (tx) => {
  const newMessage = await tx.message.create({ data: { content, userId, channelId, ... } });
  if (attachments?.length > 0) {
    await tx.attachment.createMany({ data: attachmentData });
  }
  return tx.message.findUnique({ where: { id: newMessage.id }, include: { ... } });
});
```

用户发了一条带图片的消息。如果`Message`创建成功但是`Attachment`写入失败，接收端看到的是一条 **空消息**——用户明明上传了图片，聊天记录里却没有。这在产品上是不可接受的。所以消息和附件必须在同一个事务里写入，要么都有，要么都没有

##### 线程回复

```ts
const reply = await prisma.$transaction(async (tx) => {
  const newReply = await tx.message.create({
    data: { content, userId, channelId, parentMessageId: threadId, ... },
  });
  await tx.message.update({
    where: { id: threadId },
    data: {
      threadReplyCount: { increment: 1 },
      lastReplyAt: new Date(),
      isThreadRoot: true,
    },
  });
  return newReply;
});
```

线程回复时做了两件事——**创建回复消息 + 更新父消息的 threadReplyCount 和 lastReplyAt**。这两个操作如果不原子化，会出现「**回复已经创建了但父消息的回复数没有 +1**」或「**父消息显示有 3 条回复，但实际只能查到 2 条**」的不一致状态。父消息上的 `threadReplyCount` 是读模型字段（避免每次 count），**维护它的正确性依赖事务保证**

#### 2. 级联删除必须全部完成或者全部回滚

##### 删除频道

```ts
await prisma.$transaction(async (tx) => {
  await tx.messageReaction.deleteMany({ where: { message: { channelId } } });
  await tx.messageMention.deleteMany({ where: { message: { channelId } } });
  await tx.messageRead.deleteMany({ where: { message: { channelId } } });
  await tx.attachment.deleteMany({ where: { message: { channelId } } });
  await tx.message.deleteMany({ where: { channelId } });
  await tx.channelMember.deleteMany({ where: { channelId } });
  await tx.channel.delete({ where: { id: channelId } });
});
```

频道删除涉及 6 张关联表 + 频道表本身，必须按外键依赖顺序删除。如果删到一半失败了——比如消息删完了但成员关系还在——数据库就会处于「**频道已删除但残留数据还在**」的不一致状态。另外这组删除顺序是有业务含义的：先删 `reactions、mentions、reads、attachments`（关联表的关联表），再删 `messages`，再删 `channel_members`，最后删 `channel`。事务保证要么 7 步全做完，要么一步都不做。

#### 3. 状态变更+权限转移必须原子

##### owner离开频道时转移`ownership`

```ts
await prisma.$transaction([
  prisma.channelMember.delete({
    where: { channelId_userId: { channelId, userId: currentUserId } },
  }),
  prisma.channelMember.update({
    where: { channelId_userId: { channelId, userId: newOwnerId } },
    data: { role: "owner" },
  }),
]);
```

`owner`离开时，必须同时完成 **删除当前owner的成员关系**和 **把另一个成员提升为`owner`**。如果只删除了旧的`owner`但是没有转移`role`，这个频道就失去了`owner`——后续没人能删除频道、修改设置、管理成员。这两个操作的原子性直接关系到频道的数据治理。

##### 最后一个人离开时删除整个频道

```ts
await prisma.$transaction([
  prisma.channelMember.delete({
    where: { channelId_userId: { channelId, userId: currentUserId } },
  }),
  prisma.channel.delete({ where: { id: channelId } }),
]);
```

当频道只剩最后一个人时，他离开等于频道废弃。删除成员关系和删除频道本身必须原子完成，否则可能出现「**成员已删除但空频道还存在**」或「**频道已删除但成员的 channel 列表里还残留引用**」


##### 全部标记已读

```ts
await prisma.$transaction(updates);  // updates 是一个包含多个 updateMany 的数组
```

用户点击「**全部已读**」时，需要同时清零所有频道的 `ChannelMember.unreadCount` 和所有私信的 `DMConversationMember.unreadCount`。如果部分清零成功、部分失败，用户会看到侧边栏一半红点消失了、一半还在——这比全部失败更难排查。事务保证这批 updateMany 要么全部生效，要么全部回滚，用户看到的状态始终是一致的


#### 什么操作故意不放进事务？

面试官可能会问 *发消息时未读数递增为什么不在事务里？*

> 原因：未读数允许短暂延迟和不精确——就算 updateMany 失败了，用户下次进频道时靠已读标记也能修正。把它放进事务会延长事务持有锁的时间，**在高并发下增加死锁风险**。这是「**用短暂的弱一致性换更好的并发性能**」

> 同理，通知创建和 WebSocket 广播也在事务外。通知创建失败不应阻塞消息发送，WebSocket 广播失败更不能回滚已落库的消息。

#### PostgreSQL 隔离级别在这个项目里的选择

> PostgreSQL 默认是 Read Committed，我的所有事务都使用这个默认级别，没有手动提升到 Repeatable Read 或 Serializable。原因是：聊天场景的冲突模式主要是「**并发写入不同数据**」（**不同用户在不同频道发消息**），**而不是「并发修改同一条数据**」。Read Committed 足以保证**每条写入看到的是已提交的快照，不会有脏读**。更高的隔离级别会**引入额外的锁和冲突检测开销**，在这个项目里收益不大。

#### MVCC在聊天场景里面的价值

!!! note "MVCC"
`Multi-Version Concurrency Control`多版本并发控制
- 核心思想是：**当数据被修改时，数据库不一定直接覆盖旧数据，而是保留多个版本。这样读操作可以读旧版本，写操作可以写新版本，读和写就不一定互相阻塞**
- 主要解决问题：**读写并发时，读操作和写操作互相等待的问题**

如果没有 MVCC，事务 B 来读这条数据时，可能要等事务 A 提交或回滚之后才能读，否则会读到不稳定的数据。
</aside>
> MVCC 的核心是「读不阻塞写，写不阻塞读」。聊天系统里消息的读取频率远高于写入频率——每条消息写一次，但被频道里所有人读多次。PostgreSQL 通过多版本机制，让正在读取消息的用户看到的是一个一致的快照，不会因为别人在发消息而等待。这意味着高并发下读取体验不会因为写入而卡顿

### 1.4 数据库审计与`Prisma`中间件

> 我用 `Prisma` 中间件实现了一个轻量级的数据库审计系统。所有对业务表的 `INSERT/UPDATE/DELETE/UPSERT` 操作都会被自动记录到 DbWriteAudit 表里，包括操作类型、修改前后的数据快照、请求 ID、事务 ID、操作人。这个对排查数据问题、追踪 bug 很有帮助——比如用户反馈消息不见了，可以查审计表看是什么操作删掉的、什么时候删的、是谁操作的。这个审计是 `append-only` 的，通过 `$executeRaw` 直接写 `SQL`，绕过了 Prisma model API，**避免审计操作本身被审计**（无限递归）。

## 2. Redis（缓存与加速层）

> 项目中 Redis 定位为加速层和分布式协调层，核心业务数据的权威源仍然是 PostgreSQL

### 2.1 `Redis`在项目中的四重角色

```
                    ┌──────────────┐
                    │   Traefik    │ (HTTPS 终止 + 路由)
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Next.js  │ │ Next.js  │ │   MCP    │
        │ App 1    │ │ App 2    │ │  Server  │
        └────┬─────┘ └────┬─────┘ └──────────┘
             │            │
             └─────┬──────┘
                   │
         ┌─────────▼─────────┐
         │       Redis       │
         │  - Socket.IO      │
         │    Redis Adapter  │  ← 跨实例 room 广播
         │  - 热点缓存       │  ← 未读摘要/最近消息
         │  - TTL 状态       │  ← 在线状态/typing
         │  - 原子限流       │  ← 发消息/验证码频控
         └───────────────────┘
                   │
         ┌─────────▼─────────┐
         │    PostgreSQL     │  ← 权威数据源
         └───────────────────┘
```

> Redis 在这个项目里不是替代 PostgreSQL，而是作为加速层和分布式协调层。我遵循「PostgreSQL 是权威数据源」的原则——消息、频道关系、通知记录这些核心数据都以 PostgreSQL 为准。Redis 解决四类问题：Socket.IO 多实例跨节点广播、热点数据缓存、短生命周期状态管理、分布式原子限流。

### 2.2 Socket.IO Redis Adapter — 多实例 room 广播

```
App Server 1 收到消息
        ↓
通过 Redis Pub/Sub 通知其他实例
        ↓
App Server 2 / Server 3 收到事件
        ↓
各自推送给本机连接的用户
```

> Socket.IO 默认的 room 机制基于进程内存，多实例部署时会出现「广播不到」的问题。我通过 `Redis Adapter` 来解决——本质是用 Redis Pub/Sub 做**跨实例事件中转**。App Server 1 发消息后，Adapter 通过 Redis Publish 出去，其他实例 Subscribe 到事件后转发给自己进程内的 socket 连接

> Redis 里不存消息内容，只转发事件。消息权威数据已经在 PostgreSQL 里。如果 Redis 短暂不可用，消息也不会丢——用户刷新或重连后通过历史消息 API 就能补回来。

### 2.3 缓存策略：维度摘要+最近消息(`cache-aside`)

虽然 PostgreSQL 的 ChannelMember.unreadCount 已经是读模型，但侧边栏聚合 20+ 个频道和私信的未读数涉及多次数据库查询。我加了一层 Redis 聚合缓存

> 缓存策略上做了两层设计：未读摘要用较短 TTL（30 秒），因为未读数是高频变化的业务状态，缓存过时几秒不影响用户体验。最近消息用 cache-aside——只缓存最近 50 条，写操作后直接删除缓存而不是更新缓存，避免了「编辑消息后缓存不一致」的复杂维护逻辑。

> 为什么只缓存第一页？第一页的访问频率远高于深分页，缓存收益最大。深分页命中率低，加上消息编辑、删除、reaction 等操作让深分页缓存的维护成本远高于收益，所以历史翻页直接走数据库索引。

> 一致性上以 PostgreSQL 为准。缓存设短 TTL，写操作主动失效。Redis 写入失败只记录日志不阻塞主流程——缓存过期后下次查询从数据库重建，不会造成数据错误

### 2.4 TTL管理在线状态与`typing`状态

在线状态和`typing`状态变化频繁、声明周期短，允许短暂误差，不适合频繁写入`PostgreSQL`

> 在线状态用 Redis TTL 机制做，核心优势是「异常断开的自动恢复」。用户建立 WebSocket 连接时写入 presence:{userId} 并设 60 秒 TTL，心跳每 30 秒续期，正常断开时主动删除。如果浏览器崩溃没有执行到删除逻辑，key 在 60 秒后自动过期，状态自然恢复离线。typing 状态 TTL 更短，只有 5 秒，停止输入后自然过期——这种短生命周期的状态用 Redis TTL 比写数据库自然得多

### 2.5 原子计数：限流与验证码

多实例部署后，内存版限流器各自独立计数，限流效果大打折扣。Redis 的原子操作天然适合跨实例统一限流

> 限流用 Redis Sorted Set 实现滑动窗口算法，Lua 脚本保证「清理过期 + 计数 + 判断 + 记录」四个操作的原子性——如果拆成多条命令，高并发下有竞态风险。Sorted Set 的 score 存时间戳，ZREMRANGEBYSCORE 清理窗口外的旧记录，ZCARD 统计窗口内请求数。验证码设 5 分钟 TTL，验证成功后立即 DEL 删除防止重放

### 2.6 Redis降级与容灾

我把`Redis`设计为可降级依赖，每种能力都有`fallback`

![Redis降级策略](/my-blog/2026/06/04/interview/nexus-chat-backend/image-10.png)

> dis 写失败不阻塞主流程——比如发消息时未读缓存失效失败，只记录 WARN 日志，30 秒 TTL 过期后缓存自动修正。这是「宁可短暂不一致，不让缓存问题影响核心业务」的原则。
