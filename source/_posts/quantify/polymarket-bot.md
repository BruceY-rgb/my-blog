---
title: Polymarket量化交易机器人
date: 2026-02-12 12:30:00
tags: [Polymarket]
categories: [量化]
description: Polymarket是基于Polygn区块链构建的全球最大去中心化预测平台。该笔记将从市场微观结构出发，深入结构二元市场与负风险市场的定价机制，推导无风险套利的数学不等式。详细探讨如何利用 Python 构建高频交易系统，涵盖从 Gamma API 市场发现、WebSocket 实时订单簿维护、到利用 Relayer 实现无 Gas 费交易执行的全流程。特别针对 Polymarket 独特的“合并（Merge）”与“赎回（Redeem）”机制，提供了完整的交互代码范例，解决了官方 CLOB 客户端功能的缺失问题。
cover: https://stat.theblock.co/cdn-cgi/image/format=webp,q=50/wp/uploads/2024/06/polymarket-news-editorial-1200x675.jpg
--- 


> Polymarket是基于Polygn区块链构建的全球最大去中心化预测平台。该笔记将从市场微观结构出发，深入结构二元市场与负风险市场的定价机制，推导无风险套利的数学不等式。详细探讨如何利用 Python 构建高频交易系统，涵盖从 Gamma API 市场发现、WebSocket 实时订单簿维护、到利用 Relayer 实现无 Gas 费交易执行的全流程。特别针对 Polymarket 独特的“合并（Merge）”与“赎回（Redeem）”机制，提供了完整的交互代码范例，解决了官方 CLOB 客户端功能的缺失问题。

## 1. 预测市场微观结构与套利原理

在深入代码之前，必须从底层理解`Polymarket`的资产属性与定价逻辑。不同于传统的体育博彩或者中心化交易所，`Polymarket`的每一笔交易资产本质上都是对ERC-1155 标准代币的所有权转移，这些代币代表了对未来事件结果的索取权(claim)


!!! info "什么是代币"
代币也就是`Token`,从技术上讲，代币只是**加密货币**或者**加密资产**的代名词。
!!!

`ERC-1155`被称为**多代币标准**，允许在一个智能合约中同时管理多种代币。

- 在`Polymarket`中的作用：每一种预测结果(比如特朗普赢和特朗普输)都被铸造成一种`ERC-1155`标准代币

!!! warning
`Polymarket`最核心的代币原理就是预测正确的那张票最终变为`$1.00`,预测失败的那张票最终变为`0.00`
!!!

### 1.1 Gnosis条件代币框架（CTF）的数学公理

- `Polymarket`的技术底座：`CTF`
- `CTF`将任何未来事件映射为一组互斥且穷尽的结果(Outcomes)


!!! note "基础二元市场示例"
最基础的二元市场：比特币在2025年底前是否会突破10万美元，结果集合为 {Yes, No}。
!!!


`CTF`的核心设计公理：**概率守恒**

- 在一个有效的预测市场中，互斥结果的价格之和必须等于1单位的抵押品价值(通常为`1USDC`)。
- 这意味着如果持有了该市场所有可能结果的各1份代币(1份yes和1份no)，无论将来发生什么，你都拥有了一对 **1USDC的绝对索取权**
- 这一公理的恒等式可以表示为

$$
\Sigma_{i = 1}^{n}{Price(Outcome_i)} = 1.00
$$

其中n是结果的总数，对于二元市场，即

$$
Price(Yes) + Price(No) = 1.00
$$

我们以更通俗的方式理解一下：由于所有结果的和必定是1美元，那么在二级市场上，大家对某张票(代币)的出价就等同于大家任务这件事发生的概率

- 场景：如果大家都觉得明天有70%的概率开演唱会
- 价格变化：人们会争相购买`Yes`代币，直到它的价格涨到`$0.70`
- 自动对齐：既然$Yes + No$必须等于1，那么No代币的价格自然就变成了`$0.30`
- 公理含义：市场通过价格发现功能，**将原本主观的信心**转化为**客观的金融**

### 1.2 套利的定义与类型

当市场由于流动性碎片化、做市商报价延迟或非理性交易行为导致上述恒等式被打破时，套利机会(`Arbitrage Opportunity`)就产生了

!!! example 
- 流动性碎片化：同一个时间，如果平台A的Yes卖0.58美元、平台B的No卖0.4美元
    - 那么如果在平台 A 买 Yes，在平台 B 买 No
    - 总成本 = 0.58+ 0.4 = 0.98
    - 到期汇报 = 无论结果如何必然能兑现1.00
    - 净利润 = 1.00 - 0.98 = 0.02
- 做市商报价延迟：
    - 当突发新闻发生（例如比赛进球），做市商的算法如果反应慢了几个毫秒，其挂出的旧价格仍留在订单簿上。
    - 套利者（通常是高频交易机器人）会利用速度优势，在做市商撤单前“吃掉”这些已经过时的错误报价。
- 非理性交易行为
    - 预测市场常受“粉丝情绪”影响。例如，某知名人士的粉丝会不计成本地买入其获胜的代币，导致 Yes 的价格被推高至不合理水平
    - 当 $Price(Yes) + Price(No) > 1.0 $ 时套利者可以进行反向套利
    - 套利者可以向系统存入1美元，**铸造** (Mint)出一对`Yes`和`No`代币，然后立即在市场上以总价1.05美元卖掉
!!!


在`Polymarket`中，套利分为两类

- **市场内再平衡套利** (`Intramarket Rebalancing Arbitrage`)
- **组合套利**(`Combinational Arbitrage`)

#### 1.2.1 市场内再平衡套利(荷兰书)

> 低价买齐所有门票，坐等领奖。
> 
> 这种套利方式利用的是 **二元结果市场的定价失误**

- 基本原理：就想一场关于天气的赌局，天气只有“会下雨”和“不会下雨”两种结果。因为结果必然是其中之一，所以这两张票加起来的价值 **必须**等于1美元 
- 数学模型:设$P_{ask}(Yes)$为买入`Yes`的成本，$P_{ask}(No)$为买入`No`的成本，$$C_{friction}$$代表交易摩擦（包括潜在的 Taker 费和链上 Gas 费）
  
$$
P_{ask}(Yes) + P_{ask}(No) < 1.00 - C_{friction}
$$

> 如果上式成立则存在套利空间

- 套利机会：如果市场上的卖单(Ask)由于某些原因(比如乱出价)导致买一张`Yes`和一张`No`的成本加起来小于 **1美元**(扣除手续费之后)，那么就是稳赚不赔的

!!! example "美联储降息事件"
~~- `Yes`卖`$0.35`，`No`卖`$0.63`
- 你花`$0.98`把两种可能都买下来
- 因为最后必然会有一种情况发生，我们手里的票必然有一张可以兑换为`$1.00`
- 最终利润：`$0.02`
!!!

#### 1.2.2 负风险市场套利

> 在“多选一”的大乱斗中寻找落单的低价
>
> `Polymarket`为多候选人事件(如美国大选提名)引入了负风险结构

- 基本原理：如果有五个候选人，最后只能有一个赢，那么这五个人的`Yes`价格加起来理论上也应该是1
- 为什么叫做负风险
  - 当你在这种市场上买入某个候选人的`No`时，本质上你是在买 **除了他以外的所有人赢**
- 套利场景
  - **全买Yes**：全买`Yes`:如果所有候选人的`Yes`价格加起来小于1，则全部买入，最后必有一个能兑现

  $$
  \Sigma_{i=1}^{m}P_{ask}(Yes_i) \le 1.00
  $$

  - **No价格偏差**：这是最常见的，比如某个边缘候选人`No`卖的很便宜，打不但是 **其他候选人的Yes**加起来价格更高，此时你买入这个偏移的`No`，就相当于用更低的价格买入了所有`Yes`

  $$
  P_ask(No_A) < \Sigma_{j ≠ A} P_{bid}{Yes_j}
  $$

  或者更常见的形式是

  $$
  P_{ask}(No_A) + P_{ask}(Yes_A) < 1.00
  $$

!!! info "底层黑科技"
系统通过一个`NegRiskAdapter`的合约，把多个独立的是/否小市场串联起来。前端一个买入`Trump : No`的操作，后台可能正在进行复杂的代币铸造和销毁操作，以确保数学上的平衡
!!!

#### 1.2.3 混合去中心化架构的影响

Polymarket 并非纯链上 DEX，而是采用 “链下订单簿 + 链上结算” 的混合架构。

- 架构组成
    - 链下订单簿 (Off-chain CLOB)：订单提交与撮合在链下服务器完成。类似于币安或纳斯达克，支持高频交易与毫秒级策略。
    - 链上结算 (On-chain Settlement)：撮合成功后，交易数据提交至 Polygon 链上的 CTF Exchange 合约进行原子结算。
- 对套利策略的双重影响
    - 速度优势：无需等待区块确认即可确认成交，允许执行极高频率的套利算法。
    - 状态同步挑战：程序维护的“余额”需同时兼顾链上已确认余额与链下已成交但未上链余额。若同步失败，可能导致资金占用判断错误而无法成功下单。
  
## 2. 技术基础设施与环境搭建

### 2.1 开发环境依赖

| 库名称             | 用途              | 关键功能                                    |
| ------------------ | ----------------- | ------------------------------------------- |
| `py-clob-client`   | 官方CLOB客户端    | 订单签名、下单、撤单、获取API凭证           |
| `web3.py`          | 以太坊/Polygn交互 | 链上合约调用(Merge/Reedem)、余额查询        |
| `requests`         | HTTP请求          | 查询Gamma API(市场元数据)                   |
| `websocket-client` | WebSocket连接     | 订阅实时订单簿推送，维持本地`Orderbook`镜像 |
| `pythhon-dotenv`   | 环境变量管理      | 安全存储私钥和API key                       |
| `aiohttp/asyncio`  | **异步并发**      | 实现高并发扫描和下单                        |

```bash
pip install py-clob-client web3 requests websocket-client python-dotenv aiohttp
```

### 2.2 账户体系：EOA与Proxy钱包

这是`Polymarket`开发中最容易混淆但是也最关键的部分。

两种不同的账号模式对套利成本有决定性影响

#### 2.2.1 外部拥有账户(EOA)

即 **直接通过MetaMask生成**的私钥控制的账户

- 优点：简单、直接控制
- 缺点：每次链上操作(如USDC授权、合并代币)都需要消耗`MATIC`作为`Gas`费(支付给区块链网络节点的费用，作为消耗的计算资源的补偿)
- 套利适用性：**低**。因为高频套利涉及频繁的资金合并，Gas费会吞噬微薄的利润

#### 2.2.2 代理钱包（Proxy Wallet/Gnosis safe）

`Polymarket`为每个用户部署的一个智能合约钱包(Gnosis Safe)

- 优点：支持**Relayer即中继器**机制。用户只需要对交易进行签名（元交易）,由`Polymarket`的`Relayer`服务器代为上链支付Gas费
- 缺点：交互逻辑复杂，需要特定的签名类型
- 套利适用性：**高**。这是实现零Gas成本套利的基础

!!! info "为什么Polymarket愿意帮你付钱"
- 提升流动性：套利者能抹平市场差价，让预测价格更准确
- 降低门槛：用户不需要去买`Magic`币也能交易，大大降低了上手难度
- 规模效应：Polymarket通过同一支付Gas，可以利用 **批量交易**等技术优化成本
!!!


**强烈建议**：所有套利机器人都应基于 **Proxy钱包**构建。在`py-clob-client`中，通过指定`signature_type = 1`(对于`Magic Link`)或`signature_type = 2`(对于`Gnosis Safe`)来启用代理模式


### 2.3 节点与RPC配置

虽然 CLOB 交互通过 HTTP/WS 进行，但代币的合并（Merge）和赎回（Redeem）是链上操作。Polymarket 官方的 Relayer 会处理大部分 Gas，但在某些情况下（或为了监控链上状态），你仍然需要直接读取 Polygon 链数据。

!!! note
- `clob`:中央限价丁单薄(Central Limit Order Book),是`Polymarket`的证券交易所，是核心交易引擎
- `RPC`:远程过程调用(Remote Procedure Call),通往区块链世界的翻译官，是电脑与区块链之间沟通的唯一通道
!!!

- **公共RPC**： https://polygon-rpc.com
  - 免费但是速率限制严格、不稳定
- **私有RPC**：推荐使用 Alchemy, Infura 或 QuickNode。对于高频套利，稳定的 RPC 连接是必须的，以防止在关键时刻（如合并资金以进行下一笔交易时）超时。

### 2.4 Gamma API与CLOB API的分工

`Polymarket`的数据层分为两部分，套利系统需要同时使用

#### 1. Gamma API(gamma-api.polymarket.com)

- 性质：只读，提供富文本元数据
- 用途：市场发现，获取所有活跃市场的 QuestionID, ConditionID, TokenID, Slug 等信息
- 频率：低频(如每分钟扫描一次)

#### 2. CLOB API(clob-api.polymarket.com)

- 性质：读写，处理订单
- 用途：获取实时价格(Level 2数据)、下单、撤单
- 频率：高频(毫秒级)

## 3. 自动套利系统的架构设计

> 一个乘数的自动化套利系统应该包含四个核心模块：市场扫描器(Scanner),行情监控器(Monitor),执行引擎(Executor)和结算引擎(Settler)

### 3.1 市场扫描器(Scanner)

- 功能：该模块负责从Gamma API拉取所有潜在的可交易市场，并过滤出具备流动性的目标
- 筛选逻辑
  - `active = true`:仅关注活跃市场
  - `closed = false`:排除已经结束的市场
  - `enable_order_book = true`:确保市场在CLOB上交易(排除旧的AMM市场)
  - **流动性过滤**：通过`volume`或`liquidity`字段过滤掉死盘。对于套利者，没有流动性的市场即使有差价也无法成交

```python
import requests # 查询gamma API元数据
import time # 计时
import json

def fetch_arbitrage_candidates():
    """
    从Gamma API获取活跃且开启丁单薄的市场列表
    """
    url = "https://gamma-api.polymarket.com/markets"
    markets = []
    limit = 100
    offset = 0

    while True:
        params = {
            "limit":limit, # 控制单页返回数据的最大量
            "offset": offset,
            "active": "true",
            "closed": "false",
            "enable_order_book": "true",
            "order": "volume:desc" #按交易量排序，优先关注热点
        }
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if not data:
                break;

            markets.extend(data) # 先填充数据，确保所有数据都能被读到
            
            # 如果数量少于limit，说明已经到末尾

            if len(data) < limit:
                break

            offset+=limit
            time.sleep(0.1) # 礼貌性限流

        except Exception as e:
            print(f"Error fetching markets: {e}")
            break
    return markets

# 解析市场数据，提取Token IDs

def parse_market_metadata(market):
    # 二元市场通常有两个Token: Yes和No
    # 负风险市场可能有多个
    tokens = market.get('clobTokenIds') # 该市场在CLOB中每一个代币的唯一数字标识
    condition_id = market.get('conditionId') # CTF中定义的该事件的唯一标识符
    # 它将几个不同的 TokenID 绑定在一起。比如它告诉合约：这两个 Token 是属于“特朗普是否获胜”这个同一个事件的。
    question = market.get('question') # 给人类看的描述语言，该预测市场的具体内容
    # 例如："Will Bitcoin reach $100,000 by the end of 2025?"（比特币在2025年底前会达到10万美元吗？）

    return{
        "question": question,
        "condition_id": condition_id,
        "token_ids": json.loads(tokens) if isinstance(tokens, str) else tokens
        # Web API交互中，数据通常以字符串的形式在网络上传输，Python无法直接操作字符串内部的逻辑，所以在遇见字符串时要将其转化为列表
    }
```


### 3.2 行情监控器(Monitor)

这是系统的核心，由于`REST API`的速率限制(通常每秒10个请求)，对于数百个市场进行轮询是不现实的。必须使用WebSocket订阅关键市场的book频道

**套利判定算法**

对于任意给定的市场$M$，其结果集合为$O={o_1,\dotsb, o_n}$

从CLOB获取每个结果$o_i$的最优卖单价格$Ask_i$和对应的数量$Size_i$

#### 1. 计算单位成本

$$
Cost_{unit} = \Sigma_{i=1}^{n}Ask_i
$$

> - `Ask`(卖价)：卖家挂出来的价格，比如卖家说：“这双鞋 980 元我才卖”。如果你现在立刻想要这双鞋，你就必须付这 980 元。
>
> - `Bid`(买价)：你想砍的价格。比如你说：“我只想出 950 元”。（这时交易不会立即发生，除非卖家妥协）。
>
> 在 Polymarket 套利时，我们只看 $Ask$。因为套利讲究“快”，我们要像“扫货”一样，直接按照卖家的开价（$Ask$）把货秒走。



#### 2. 判断套利机会

若$Cost_{unit} < 1.00 - Threshold$(`Threshold`设置为0.005或更高以覆盖潜在滑点)

#### 3. 计算最大可套利量(Capacity)

由于每个Ask档位的数量不同，最大成交量受限于最薄弱的一环

$$
Capacity = min(Size_1,Size_2,\dotsb, Size_n)
$$

#### 4. 深度穿透(Depth Penetration)

如果第一档流动性(Ask的数量太少)*不足以满足预设的最小利润额*，算法应该向后遍历`Orferbook`的`Level2, Level3...`重新计算加权平均成本


```python
import json
import threading 
from websocket import WebSocketApp

class OrderBookMonitor:
    def __init__(self, market_tokens, threshold = 0.005):
        self.ws_url = "wss://ws-subscriptions-clob.polymarket.com/ws/market" # 作为WebSocket客户端连接的URL
        self.market_tokens = market_tokens # token_id -> market_info的映射
        self.order_books = {} # 本地镜像，实时记录每个代币最新的买卖价格和数量
        self.threshold = threshold

    def on_open(self, ws):
        """连接建立时，发送订阅请求"""
        print("WebSocket Connected. Sending Subscriptions...")
        # 提取所有需要监控的 token_id
        all_token_ids = list(self.market_tokens.keys())
        
        # 构造订阅消息
        subscribe_msg = {
            "type": "subscribe",
            "assets_ids": all_token_ids,
            "channels": ["book"]  # 订阅订单簿频道
        }
        ws.send(json.dumps(subscribe_msg))
    # 处理推送消息
    def on_message(self, ws, message):
        """
        处理推送的价格信息
        """
        # ws: WebSocketApp实例
        data = json.loads(message) 
        # Polymarket会推送快照(Snapshot,全部订单)或更新(Update,价格变动)。代码要根据这些信息更新本地的order_books
        # 只要某个代币价格一变，立即触发check_arbitrage
        # Polymarket WS 返回的数据通常包含 'asset_id', 'asks', 'bids'
        # 我们只关注最优卖价 (Best Ask)
        asset_id = data.get('asset_id')
        asks = data.get('asks', [])

        if asset_id in self.market_tokens:
             # 获取当前最新的best Tokens
             best_ask = float(asks[0].get("price"))

             # 找到该token属于哪个市场及其类型(Yes/No)
             info = self.market_tokens[asset_id]
             m_id = info["market_id"]
             side = info["side"] # 'yes' 或 'no'

             # 更新本地账本
             if m_id not in self.order_books:
                 self.order_books[m_id] = {"Yes":None, "No":None}
             
             self.order_books[m_id][side] = best_ask

             # 尝试触发套利检查
             self.check_arbitrage(m_id)
    
    def check_arbitrage(self, market_id):
        """核心套利判定算法"""

        book = self.order_books.get(market_id)
        if not book or book["Yes"] is None or book["No"] is None:
            return # 订单簿不完整，无法判断

        # 计算单位成本：Cost = Ask(Yes) + Ask(No)
        total_cost = book["Yes"] + book["No"]

        # 判断套利机会Cost < 1 - threshold
        if total_cost < 1 - self.threshold:
            print(f"!!! ARBITRAGE DETECTED in Market {market_id} !!!")
            print(f"Yes: {book['Yes']}, No: {book['No']}, Total: {total_cost:.4f}")
            print("Action: Triggering Execution Engine...")
            # 这里调用下单模块（Executor）

        else:
            # 仅做日志观察
            print(f"Market {market_id} cost: {total_cost:.4f}")
            pass
    def on_error(self, ws, error):
        print(f"WS Error: {error}")

    def on_close(self, ws, close_status_code, close_msg):
        print("WS Closed")

    def start(self):
        """在独立线程中启动WebSocket"""
        self.ws = WebSocketApp(
            self.ws_url,
            on_open=self.on_open,
            on_message=self.on_message,
            on_error=self.on_error,
            on_close=self.on_close
        )

        # 运行连接
        self.ws.run_forever()

# --- 使用示例 ---
if __name__ == "__main__":
    # 映射表由gamma API代码生成
    mock_tokens = {
        "TOKEN_ID_FOR_YES":{"market_id": "M1", "side":"Yes"},
        "TOKEN_ID_FOR_NO":{"market_id": "M1", "side":"No"},
    }

    monitor = OrderBookMonitor(mock_tokens)
    monitor.start()
```

### 3.3 执行引擎(Executor)

执行引擎负责将套利信号转化为链上的实际资产

**并发下单的重要性**

- 我们必须要同时买入`Yes`和`No`
- 如果先后下单，则会存在 **单腿风险**(`Legging Risk`)

!!! example 
    我们买入了`Yes`，正要买`No`时，`No`的价格突然飙升，此时我们不仅还没有赚到钱，反而持有了单边的风险敞口（让我们自身暴露在风险之下）


> 在`python`中，应该使用`asyncio.gather`或者多线程来实现并发`HTTP`请求
>
> 因为套利机器人本身是一种 **IO密集型**任务，`asyncio.gather`往往可以实现更高的性能

`Polynarket`的API需要较为复杂的认证头(`L1/L2` Headers)。`py-clob-client`封装了这部分逻辑

```python
import os
import asyncio # 引入异步库，更适合IO密集型的任务
from py_clob_client import ClobClient
from py_clob_client.clob_types import OrderArgs
from py_clob_client.constants import BUY

# 1. 初始化保持不变
key = os.getenv("PRIVATE_KEY") # 在Polygon链上的数字签名盖章
chain_id = 137 # 137是Polygon的链ID，是Polygon主网(Mainnet)的唯一识别码
host = "https://clob.polymarket.com" # 这是Polymarket的CLOB(链下订单簿服务器，实际上的证券交易所地址)的API入口

# 根据配置信息，在内存中实例化一个客户端对象
client = ClobClient(host, key = key, chain_id=chain_id, sighature_type = 1)

# 安全步骤：保护私钥不被频繁使用(降低泄露风险并提高处理速度)
client.set_api_creds(client.create_or_derive_api_creds())
# 调用set_api_creds()之后，SDK会自动使用这套凭证在HTTP请求头里盖章，而不需要再次动用我们的原始私钥

async def place_order_safe(order_args):
    """
    封装单个下单动作，增加异常捕获
    """
    try:
        # 实际操作中,SDK的异步版本通常为client.create_and_post_order_async
        # 这里为了演示核心逻辑,假设其为异步调用
        resp = client.create_and_post_order(order_args) # 本地签名+网络发送
        return {"status":"success", "resp":resp}
    except Exception as e:
        return {"status":"failed", "error":str(e)}
    
async def execute_arbitrage(token_yes, token_no, price_yes, price_no, size):
    """
    并发下单+风险对冲检查
    """

    print("发起并发套利: Yes@(price_yes), No@(price_no), Size:(size)")

    # 准备两个订单的参数
    order_yes = OrderArgs(
        price = price_yes,
        size=size,
        side=BUY,
        token_id=token_yes
    )

    order_no = OrderArgs(
        price = price_no,
        size=size,
        side=BUY,
        token_id=token_no
    )

    # 使用asyncio.gather同时发出两个请求
    # 这可以显著降低因为先后顺序导致的风险敞口

    results = await asyncio.gather(
        place_order_safe(order_yes),
        place_order_safe(order_no),
        return_exceptions=True # 保证并发任务之间互不干扰 
    )

    res_yes, res_no = results

    # --- 逻辑判定与风险处理 ---
    
    # 情况1：双边都成功
    if res_yes["status"] == "success" and res_no["status"] == "success":
        print("✅ 套利指令已全部成交，等待利润到账。")
        return True

    # 情况2：致命的单边风险
    elif res_yes["status"] == "success" and res_no["status"] == "failed":
        print(f"⚠️ 警报：Yes成交但No失败！错误: {res_no['error']}")
        print("🚨 正在启动紧急避险：尝试撤单或市价卖出Yes...")
        # 此处应调用回滚逻辑，例如：client.cancel_order(...)
        return False

    elif res_no["status"] == "success" and res_yes["status"] == "failed":
        print(f"⚠️ 警报：No成交但Yes失败！错误: {res_yes['error']}")
        print("🚨 正在启动紧急避险：尝试撤单或市价卖出No...")
        return False

    # 情况3：两边都失败
    else:
        print("❌ 交易全部失败，未产生损失。")
        return False
    
# 运行入口
if __name__ == "__main__":
    # 模拟数据
    asyncio.run(execute_arbitrage(
        "TOKEN_YES_ID",
        "TOKEN_NO_ID",
        0.45, 0.53, 100
    ))
```

### 3.4 结算引擎(Settler): Merge 与Redeem

买入之后，我们持有一篮子代币。资金被占用。为了复利，必须尽快将其合并为USDC

由于`py_clob_client`暂时不支持Merge，我们需要使用web3.py直接调用CTF合约

**合约信息**

- **CTF合约地址Polygon**:0x4D97DCd97eC945f40cF65F87097ACe5EA0476045
  - 这是`Polymarket`定义在链上的条件代币合约地址，是所有代币的管理中心
  - `CTF_ADDRESS`相当于一个**自动办公大厅**。所有的 Yes/No 代币都是由这个合约管理的。你想把代币合并成 USDC，必须跑到这个特定的地址（门牌号）去办理。
- **ABI**:必须包含`mergePostions`函数的定义，告诉Python如何正确传参
  - ABI 全称是 Application Binary Interface（应用二进制接口）
  - 智能合约在链上是以机器码形式存在的，人类（和 Python）看不懂。ABI 就像是一份说明书或者接口标准。
  - 它是**业务申请表的模板**。如果不加载这个 ABI，Python 就不知道该按什么格式往合约发指令。
- **USDC ADDRESS**:
  - 这是 Polygon 链上 USDC 代币合约的地址
  - 在合并（Merge）操作中，合约需要知道你最终想换回哪种资产
  - 它是**真钞（也就是USDC）的防伪标准**

