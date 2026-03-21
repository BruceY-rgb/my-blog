---
title: Git之GitFlow工作流 | Gitflow Workflow
date: 2026-03-20 17:53:00
cover: https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1920
categories:
  - Git
  - 版本控制
tags:
  - Git
  - GitFlow
  - 工作流
---

# Git之GitFlow工作流 | Gitflow Workflow

## 写在前面

在工作场合实施Git的时候，有很多种工作流程可供选择，此时反而会让你手足无措。企业团队最常用的一些Git工作流程，包括Centralized Workflow、Feature Branch Workflow、Gitflow Workflow、Forking Workflow。

在你开始阅读之前，请记住：这些Git工作流程应被视作为指导方针，而非"铁律"。我们只是想告诉你可能的做法。因此，如果有必要的话，你可以组合使用不同的流程。

本文主要介绍Gitflow Workflow。

---

## 一、 GitFlow 介绍

### 1.1 什么是 GitFlow

**GitFlow** 是一种 Git 工作流，这个工作流程围绕着project的发布(release)定义了一个严格的如何建立分支的模型。它是团队成员遵守的一种代码管理方案。

Git建分支是非常cheap的，我们可以任意建立分支，对任意分支再分支，分支开发完后再合并。

比较推荐、多见的做法是特性驱动(Feature Driven)的建立分支法(Feature Branch Workflow)。

简而言之，就是每一个特性(feature)的开发并不直接在主干上开发，而是在分支上开发，分支开发完毕后再合并到主干上。

这样做的好处是：

1. 还处于半成品状态的feature不会影响到主干
2. 各个开发人员之间做自己的分支，互不干扰
3. 主干永远处于可编译、可运行的状态

GitFlow则在这个基础上更进一步，规定了如何建立、合并分支，如何发布，如何维护历史版本等工作流程。

### 1.2 GitFlow 常用分支说明

| 分支名称 | 分支说明 |
|---------|---------|
| **Production** | 生产分支，即 Master分支。只能从其他分支合并，不能直接修改 |
| **Release** | 发布分支，基于 Develop 分支创建，待发布完成后合并到 Develop 和 Production 分支去 |
| **Develop** | 主开发分支，包含所有要发布到下一个 Release 的代码，该分支主要合并其他分支内容 |
| **Feature** | 新功能分支，基于 Develop 分支创建，开发新功能，待开发完毕合并至 Develop 分支 |
| **Hotfix** | 修复分支，基于 Production 分支创建，待修复完成后合并到 Develop 和 Production 分支去，同时在 Master 上打一个tag |

### 1.3 Git flow中的分支介绍

Git Flow的核心就是分支(Branch)，通过在项目的不同阶段对分支的不同操作（包括但不限于创建、合并、变基等）来实现一个完整的高效率的工作流程。Git Flow模型中定义了**主分支**和**辅助**分支两类分支。其中主分支包含主要分支和开发分支，用于组织与软件开发、部署相关的活动；辅助分支包含功能分支、预发分支、热修复分支以及其他自定义分支，是为了解决特定的问题而进行的各种开发活动。与主分支不同，这些分支总是有有限的生命时间，因为它们最终将被移除。

> 主分支：master分支、develop分支
> 辅助分支：feature分支、release分支、hotfix分支

#### 1.3.1 主要分支（Master）

主要分支上存放的是**最稳定的正式版本**，并且该分支的代码应该是**随时可在生产环境中使用的代码**。当一个版本开发完毕后，产生了一份新的稳定的可供发布的代码时，主要分支上的代码要被更新。同时，每一次更新，都需要在主要分支上打上对应的版本号。

任何人**不允许在主要分支上进行代码的直接提交**，**只接受其他分支的合入**。原则上主要分支上的代码必须是合并自经过多轮测试及已经发布一段时间且线上稳定的预发分支。

> master分支只存放历史发布(release)版本的源代码。即用于存放对外发布的版本，任何时候在这个分支获取到的都是稳定的已发布的版本。各个版本通过tag来标记。

#### 1.3.2 开发分支（Develop）

开发分支是主开发分支，其上更新的代码始终反映着下一个发布版本需要交付的新功能。当开发分支到达一个稳定的点并准备好发布时，应该从该点拉取一个预发分支并附上发布版本号。也有人称开发分支为集成分支，因为会基于该分支和持续集成工具做自动化的构建。

开发分支接受其他辅助分支的合入，最常见的就是功能分支，开发一个新功能时拉取新的功能分支，开发完成后再并入开发分支。需要注意的是，合入开发的分支必须保证功能完整，不影响开发分支的正常运行。

> develop分支则用来整合各个feature分支。开发中的版本的源代码存放在这里。即用于日常开发，存放最新的开发版。

#### 1.3.3 功能分支（Feature）

功能分支一般命名为 Feature/xxx，用于开发即将发布版本或未来版本的新功能或者探索新功能。该分支通常存在于开发人员的本地代码库而不要求提交到远程代码库上，除非几个人合作在同一个功能分支开发。

功能分支只能拉取自开发分支，开发完成后要么合并回开发分支，要么因为新功能的尝试不如人意而直接丢弃。

> 每一个特性(feature)都必须在自己的分支里开发，feature分支派生自develop分支。
>
> feature分支只存在于开发者本地，不能被提交到远程库。当feature开发完毕后，要合并回develop分支。feature分支永远不会和master分支打交道。

#### 1.3.4 预发分支（Release）

预发分支一般命名为 Release/1.2（后面是版本号），该分支专为测试—发布新的版本而开辟，允许做小量级的Bug修复和准备发布版本的元数据信息（版本号、编译时间等）。通过创建预发分支，使得开发分支得以空闲出来接受下一个版本的新的功能分支的合入。

预发分支需要提交到服务器上，交由测试工程师进行测试，并由开发工程师修复Bug。同时根据该分支的特性我们可以部署自动化测试以及生产环境代码的自动化更新和部署。

预发分支只能拉取自开发分支，合并回开发分支和主要分支。

> release分支不是一个放正式发布产品的分支，你可以将它理解为"待发布"分支。
>
> 我们用这个分支干所有和发布有关的事情，比如：
> 1. 把这个分支打包给测试人员测试
> 2. 在这个分支里修复bug
> 3. 编写发布文档
>
> 所以，在这个分支里面**绝对不会添加新的特性**。
>
> 当和发布相关的工作都完成后，release分支合并回develop和master分支。
>
> 单独搞一个release分支的好处是，当一个团队在做发布相关的工作时，另一个团队则可以接着开发下一版本的东西。

#### 1.3.5 热修复分支（Hotfix）

热修复分支一般命名为Hotfix/1.2.1（后面是版本号），当生产环境的代码（主要分支上代码）遇到严重到必须立即修复的缺陷时，就需要从主要分支上指定的tag版本（比如1.2）拉取热修复分支进行代码的紧急修复，并附上版本号（比如1.2.1）。这样做的好处是不会打断正在进行的开发分支的开发工作，能够让团队中负责功能开发的人与负责代码修复的人并行、独立的开展工作。

热修复分支只能主要分支上拉取，测试通过后合并回主要分支和开发分支。

> 一个项目发布后或多或少肯定会有一些bug存在，而bug的修复工作并不适合在develop上做，这是因为
> 1. develop分支上包含还未验证过的feature
> 2. 用户未必需要develop上的feature
> 3. develop还不能马上发布，而客户急需这个bug的修复。
>
> 这时就需要新建hotfix分支，hotfix分支派生自master分支，仅仅用于修复bug，当bug修复完毕后，马上回归到master分支，然后发布一个新版本，比如，v0.1.1。
>
> 同时hotfix也要合并回develop分支，这样develop分支就能享受到bug修复的好处了。

### 1.4 GitFlow 工作流程

GitFlow工作流程通过不同的分支从源代码管理的角度对软件开发活动进行了约束，为我们的软件开发提供了一个可供参考的管理模型。

---

## 二、GitFlow 实践

### 2.1 创建 develop 分支

```bash
# 创建 develop 分支
git branch develop
# 将 develop 分支推送到远端仓库
git push -u origin develop
```

### 2.2 开始新的 Feature

```bash
# 通过develop新建feaeure分支
git checkout -b Feature分支名 develop
# 可选，将分支推送到远端仓库
git push -u origin Feature分支名
```

### 2.3 编辑 Feature 分支

```bash
# 查看状态
git status
# 添加提交内容
git add XXXfile
# 提交
git commit
```

### 2.4 完成 Feature 分支

```bash
# 拉取远端仓库 develop 分支合并到本地 develop 分支
git pull origin develop
# 切换到 develop 分支
git checkout develop
# 将 Feature 分支合并到 develop 分支
# --no-ff：不使用 fast-forward 方式合并，保留分支的 commit 历史
# --squash：使用 squash 方式合并，把多次分支 commit 历史压缩为一次
git merge --no-ff Feature分支名
# 将分支推送远端仓库
git push origin develop
# 删除 Feature分支
git branch -d Feature分支名
```

### 2.5 开始Release

```bash
# 创建 Relase 分支并切换到 Release 分支上
git checkout -b release-0.1.0 develop
```

### 2.6 完成Release

```bash
# 切换到 master 分支上
git checkout master
# 合并 release-0.1.0 分支
git merge --no-ff release-0.1.0
# 推送到远端仓库
git push
# 切换到 develop 分支上
git checkout develop
# 合并 release-0.1.0 分支
git merge --no-ff release-0.1.0
# 推送到远端仓库
git push
# 删除 release-0.1.0 分支
git branch -d release-0.1.0
```

### 2.7 开始Hotfix

```bash
# 创建 hotfix 分支并切换到 hotfix 分支上
git checkout -b hotfix-0.1.1 master
```

### 2.8 完成Hotfix

```bash
# 切换到 master 分支
git checkout master
# 合并 hotfix-0.1.1 分支
git merge --no-ff hotfix-0.1.1
# 推送到远端仓库
git push
# 切换到 develop 分支
git checkout develop
# 合并 hotfix-0.1.1 分支
git merge --no-ff hotfix-0.1.1
# 推送到远端仓库
git push
# 删除 release-0.1.0 分支
git branch -d hotfix-0.1.1
# 为主分支打上版本标签
git tag -a v0.1.1 master
# 将标签推送到远端仓库
git push --tags
```

---

## 三、GitFlow 模拟

下面的例子将演示Gitflow流程如何被用来管理一次产品发布。假设你已经创建好了一个中央仓库。

### 3.1 创建develop分支

第一步是给默认的master配备一个develop分支。一种简单的做法是：让一个开发者在本地建立一个空的develop分支，然后把它推送到服务器。

```bash
git branch develop
git push -u origin develop
```

develop分支将包含项目的所有历史，而master会是一个缩减版本。现在，其他开发者应该克隆（clone）中央仓库，并且为develop创建一个追踪分支。

```bash
git clone ssh://user@host/path/to/repo.git
git checkout -b develop origin/develop
```

到现在，所有人都把包含有完整历史的分支（develop）在本地配置好了。

### 3.2 小马和小明开始开发新功能

我们的故事从小马和小明要分别开发新功能开始。他们俩各自建立了自己的分支。注意，他们在创建分支时，父分支不能选择master，而要选择develop。

```bash
git checkout -b some-feature develop
```

他们俩都在自己的功能开发分支上开展工作。通常就是这种Git三部曲：edit，stage，commit：

```bash
git status
git add <some-file>
git commit
```

### 3.3 小马把她的功能开发好了

在提交过几次代码之后，小马觉得她的功能做完了。如果她所在的团队使用"拉拽请求"，此刻便是一个合适的时机——她可以提出一个将她所完成的功能合并入develop分支的请求。要不然，她可以自行将她的代码合并入本地的develop分支，然后再推送到中央仓库，像这样：

```bash
git pull origin develop
git checkout develop
git merge some-feature
git push
git branch -d some-feature
```

第一条命令确保了本地的develop分支拥有最新的代码——这一步必须在将功能代码合并之前做！注意，新开发的功能代码永远不能直接合并入master。必要时，还需要解决在代码合并过程中的冲突。

### 3.4 小马开始准备一次发布

尽管小明还在忙着开发他的功能，小马却可以开始准备这个项目的第一次正式发布了。类似于功能开发，她使用了一个新的分支来做产品发布的准备工作。在这一步，发布的版本号也最初确定下来。

```bash
git checkout -b release-0.1 develop
```

这个分支专门用于发布前的准备，包括一些清理工作、全面的测试、文档的更新以及任何其他的准备工作。它与用于功能开发的分支相似，不同之处在于它是专为产品发布服务的。

一旦小马创建了这个分支并把它推向中央仓库，这次产品发布包含的功能也就固定下来了。任何还处于开发状态的功能只能等待下一个发布周期。

### 3.5 小马完成了发布

一切准备就绪之后，小马就要把发布分支合并入master和develop分支，然后再将发布分支删除。注意，往develop分支的合并是很重要的，因为开发人员可能在发布分支上修复了一些关键的问题，而这些修复对于正在开发中的新功能是有益的。

```bash
git checkout master
git merge release-0.1
git push
git checkout develop
git merge release-0.1
git push
git branch -d release-0.1
```

发布分支扮演的角色是功能开发（develop）与官方发布（master）之间的一个缓冲。无论什么时候你把一些东西合并入master，你都应该随即打上合适的标签。

```bash
git tag -a 0.1 -m"Initial public release" master
git push --tags
```

### 3.6 用户发现了一个bug

当一次发布完成之后，小马便回去与小明一起开发其他功能了。突然，某个用户提出抱怨说当前发布的产品里有一个bug。为了解决这个问题，小马（或者小明）基于master创建了一个用于维护的分支。她在这个分支上修复了那个bug，然后把改动的代码直接合并入master。

```bash
git checkout -b issue-#001 master
# Fix the bug
git checkout master
git merge issue-#001
git push
```

跟用于发布的分支一样，在维护分支上的改动也需要合并入develop分支，这一点是很重要的！因此，小马务必不能忘了这一步。随后，她就可以将维护分支删除。

```bash
git checkout develop
git merge issue-#001
git push
git branch -d issue-#001
```

---

## 四、 GitFlow 工具推荐

### 4.1 Git flow script(命令行)

Git Flow不仅仅是一种规范，还提供了一套方便的工具。大大简化了执行GitFlow的过程。

#### 安装

**OSX**

```bash
$ brew install git-flow
```

**Debian/Ubuntu Linux**

```bash
$ apt-get install git-flow
```

**Windows(cygwin)**

```bash
$ wget -q -O - --no-check-certificate https://github.com/nvie/gitflow/raw/develop/contrib/gitflow-installer.sh
```

#### 初始化（Initialize）

对一个git仓库配置一下git flow。主要是一些命名规范，比如feature分支的前缀，hotfix分支的前缀等。一般用默认值就行。

```bash
git flow init
```

#### 功能分支（Feature）

**——开始新Feature:**

从develop开启一个新的分支

```bash
git flow feature start MYFEATURE
```

这个命令会从develop分出一个分支，然后切换到这个分支上面。

**——Publish一个Feature(也就是push到远程):**

如果你想让别人和你一起开发MYFEATURE分支，那就把这个分支push到服务器上

```bash
git flow feature publish MYFEATURE
```

**—— 获取Publish的Feature:**

获得一个别人publish到服务器上的feature分支

```bash
git flow feature pull origin MYFEATURE
```

**—— 完成一个Feature:**

一个feature分支开发完毕后，要做以下事情：
- 把 MYFEATURE 合并到 develop
- 把这个分支干掉
- 切换回develop分支

```bash
git flow feature finish MYFEATURE
```

#### 预发分支（Release）

**—— 开始一个Release:**

创建一个release分支，派生自develop分支。

```bash
git flow release start RELEASE [BASE]
```

**—— Publish一个Release:**

```bash
git flow release publish RELEASE
```

**—— 发布一个Release:**

一个release分支结束后，需要做以下工作：
- 把release分支合并回master
- 给本次发布打tag
- 同时把release分支合并回develop
- 干掉release分支

```bash
git flow release finish RELEASE
git push --tags
```

> **注：**最后不要忘记把tag push到服务器**`git push --tags`**

#### 热修复分支（Hotfix）

**—— 开始一个Hotfix:**

```bash
git flow hotfix start VERSION [BASENAME]
```

**—— 发布一个Hotfix:**

结束一个hotfix分支，和release一样，同时合并回develop和master

```bash
git flow hotfix finish VERSION
```

### 4.2 Git Flow SourceTree (图形化)

SourceTree是一个免费的Git图形化客户端，支持Windows和Mac。

#### Gitflow结合SourceTree实践

1. 创建本地仓库 + 远程仓库
2. 打开该仓库SourceTree控制界面
3. 添加完成之后点击Gitflow按钮
4. 初始化完成
5. 开发功能模块
6. 完成功能模块
7. 进行发布
8. 完成发布
9. 开始热修复
10. 完成热修复

---

## 五、Git Flow模型总结

Git Flow模型通过不同的分支从源代码管理的角度对软件开发活动进行了约束，为我们的软件开发提供了一个可供参考的管理模型。Git Flow模型让代码仓库保持整洁，让小组各个成员之间的开发相互隔离，能够有效避免处于开发状态中的代码相互影响而导致的效率低下和混乱。但同时，不同的开发团队存在不同的文化，在不同的项目背景情况下都可能根据该模型进行适当的精简或扩充。

---

## 参考文献

- [Git Flow - A successful branching model](https://nvie.com/posts/a-successful-git-branching-model/)
- [Git Flow of Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows)
- [Another Git Flow introduction](https://docs.syntevo.com/SmartGit/Latest/)
- [Git Flow Cheatsheet](http://danielkummer.github.io/git-flow-cheatsheet/)
