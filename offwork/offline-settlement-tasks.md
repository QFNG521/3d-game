# 技术任务卡拆解 · 离线产出结算模块

> 来源：survival-prd.md 第 4.5 / 6 / 7 节
> 定位：**需求级任务卡**（状态机 + 接口契约 + 结算规则 + 验收标准），技术选型与实现由研发定，本卡为需求验收基线。
> 声明：所有时长/速率系数标"待原型验证"，不预填定值；本内容为设计草稿参考，正式落地前需经团队评审与合规审核。

---

## 0. 模块目标与边界
- **目标**：玩家离线期间，基地按设施等级自动产出资源；回归时一次性正确结算，展示明细，形成"收菜"正反馈。
- **边界**：只结算"基础资源产出"（食物/水/木材/金属），不含战斗掉落、事件奖励。
- **非目标（本期不做）**：付费加速离线、离线期间的随机事件、跨服同步。

---

## 1. 核心设计决策（先定规则，再写代码）
| 决策点 | 规则 | 理由 |
|---|---|---|
| 时间基准 | **只用服务端时间**，客户端时间仅用于展示 | 防改手机时间刷资源 |
| 离线起点 | 服务端在"登出/心跳超时"时记录 `lastActiveAt` | 客户端不可篡改 |
| 结算封顶 | `settledSeconds = min(now - lastActiveAt, maxOfflineSeconds)` | 防长时间挂机通胀，`maxOfflineSeconds` 待原型验证（如 8–24h） |
| 容量约束 | 单资源结算量 ≤ 仓库剩余容量 | 防溢出 |
| 幂等 | 每次结算生成 `settlementId`，领取幂等 | 防重复领取 |
| 展示 | 回归弹窗展示"离线时长 + 各资源产出明细" | 反馈可感知 |

---

## 2. 状态机设计

### 2.1 状态定义
| 状态 | 含义 |
|---|---|
| `ONLINE` | 玩家在线，资源实时/正常结算 |
| `OFFLINE` | 玩家离线，服务端已记录 `lastActiveAt`，等待回归 |
| `SETTLING` | 玩家回归，正在计算离线产出（事务中） |
| `SETTLED` | 结算完成，产出已发放，转回 ONLINE |

### 2.2 状态转移
```
ONLINE --登出 / 心跳超时--> OFFLINE（写入 lastActiveAt = 服务端 now）
OFFLINE --玩家登录--> SETTLING（计算 delta 与产出）
SETTLING --校验通过--> SETTLED（发放资源，生成 settlementId）
SETTLED --> ONLINE
SETTLING --校验失败(时间倒挂/异常)--> OFFLINE（按 0 结算，记异常日志）
```

### 2.3 前端状态（客户端）
```
进入游戏 → 请求结算接口 → 拿到 rewards
  → 有产出：弹"收菜"结算弹窗（明细 + 领取按钮）
  → 无产出/封顶为0：直接进主界面，不弹窗
领取 → 调用领取接口（或结算即发放）→ 播放资源入库动效
```

---

## 3. 接口契约（需求级）

### 3.1 记录离线起点（服务端内部 / 登出）
```
POST /session/logout
请求：{ playerId }
响应：{ ok: true }
副作用：服务端写 player.lastActiveAt = serverNow()
```
> 心跳超时（如 5 分钟无心跳）也触发同样记录，防止异常退出漏记。

### 3.2 回归结算
```
POST /offline/settle
请求：{ playerId }              // 不信任客户端时间，不传 clientTime 参与计算
响应：{
  settlementId: string,
  rawSeconds: number,           // 实际离线秒数
  settledSeconds: number,       // 封顶后参与结算的秒数
  cappedByTime: boolean,        // 是否被时长封顶
  cappedByCapacity: boolean,    // 是否受仓库容量限制
  rewards: [ { resourceId, amount } ],
  serverNow: number
}
```

### 3.3 领取（若采用"先结算后领取"两步）
```
POST /offline/claim
请求：{ playerId, settlementId }
响应：{ ok: true, granted: [ { resourceId, amount } ] }
幂等：同一 settlementId 重复调用返回首次结果，不重复发放
```

---

## 4. 数据结构（需求级字段）
```
PlayerBase {
  playerId
  facilities: [ { facilityId, level } ]
  resources: { food, water, wood, metal }
  warehouseCapacity: { food, water }   // 软货币容量
  lastActiveAt: serverTimestamp
}

OfflineSettlement {
  settlementId
  playerId
  startAt          // = lastActiveAt
  endAt            // = 结算时 serverNow
  rawSeconds
  settledSeconds
  rewards: [ { resourceId, amount } ]
  createdAt
}

ProductionRate {           // 配置表
  facilityId
  level
  resourceId
  perSecond                // 每秒产出，系数待原型验证
}
```

---

## 5. 结算公式（结构固定，系数待原型验证）
```
rawSeconds      = max(0, serverNow - lastActiveAt)
settledSeconds  = min(rawSeconds, maxOfflineSeconds)

for each 产出设施:
    amount = rate(facilityId, level, resourceId) * settledSeconds
    amount = min(amount, 剩余容量[resourceId])      // 容量约束
    rewards[resourceId] += amount

// 软货币满仓：该资源产出停，cappedByCapacity = true
```

---

## 6. 任务卡拆解（T1–T8）

| 卡片 | 任务 | 输入 | 输出 | 验收标准 | 依赖 | 优先级 |
|---|---|---|---|---|---|---|
| T1 | 产出速率配置表 | 设施列表/等级/资源 | `ProductionRate` 配置 | 表可配、可热更，非法值有校验 | — | P0 |
| T2 | 服务端记录 `lastActiveAt` | 登出/心跳超时事件 | 写入服务端时间戳 | 异常退出也能靠心跳超时记录 | — | P0 |
| T3 | 离线时长计算与封顶 | `lastActiveAt` + serverNow | `rawSeconds/settledSeconds` | 时长倒挂按0处理；超上限正确封顶 | T2 | P0 |
| T4 | 产出计算（含容量约束） | 设施等级 + `settledSeconds` | rewards 明细 | 满仓资源停止产出，`cappedByCapacity` 正确 | T1,T3 | P0 |
| T5 | 结算接口（幂等） | playerId | 结算响应 + `settlementId` | 重复调用不重复发放 | T4 | P0 |
| T6 | 客户端"收菜"结算弹窗 | 结算响应 | 明细展示 + 入库动效 | 有产出才弹；无产出不打扰 | T5 | P1 |
| T7 | 异常处理 | 时间倒挂/重复结算/满仓 | 安全回退 + 日志 | 任何异常不崩溃、不误发 | T3,T5 | P0 |
| T8 | 埋点与验证 | 结算过程数据 | 埋点上报 | 可统计离线时长分布/领取率/封顶率 | T5 | P1 |

### 卡片模板（每张卡开发时补齐）
```
【任务】T? 名称
【背景】为什么要做（对应 PRD 哪条）
【输入/输出】字段与语义
【规则】边界与异常
【验收标准】可测试的通过条件
【依赖】前置卡片
【优先级】P0/P1
【待确认】系数/阈值等待原型验证项
```

---

## 7. 异常处理清单
| 场景 | 处理 |
|---|---|
| 客户端时间被改 | 忽略客户端时间，只用服务端时间，结果不变 |
| 登录时 serverNow < lastActiveAt（时间倒挂） | `rawSeconds` 按 0 处理，记异常日志，不发放 |
| 同一 settlementId 重复领取 | 幂等返回首次结果，不重复发 |
| 仓库满仓 | 该资源产出停，`cappedByCapacity=true`，其余资源正常 |
| 结算事务中途失败 | 回滚，状态回 `OFFLINE`，下次登录重算 |
| 离线超长（如数月） | 按 `maxOfflineSeconds` 封顶，不补超出部分 |
| 新号首次登录无 lastActiveAt | 视为 0 秒，跳过结算 |

---

## 8. 埋点与验证指标（均标"待原型验证"）
- `offline_raw_seconds` 分布（玩家实际离线时长）
- `offline_settled_seconds` / 封顶率（`cappedByTime` 比例）
- `offline_reward_amount` 各资源均值
- `capped_by_capacity` 比例（满仓是否频繁 → 调容量或产出）
- 领取率（弹出后是否领取）、结算弹窗关闭率
- 判据：领取率高 + 无频繁满仓 + 结算不卡顿 → 模块成立。

---

## 9. 验收标准（模块级）
- [ ] 离线 1h / 8h / 超上限三档，结算量符合公式。
- [ ] 修改客户端时间，结算结果不变。
- [ ] 重复调用结算/领取，资源不重复发放。
- [ ] 满仓时对应资源停止产出且标记正确。
- [ ] 结算接口 P95 响应 < 200ms（阈值待压测确认）。
- [ ] 无产出时不弹窗打扰。

---
本内容为设计草稿参考，正式落地前需经团队评审与合规审核。
