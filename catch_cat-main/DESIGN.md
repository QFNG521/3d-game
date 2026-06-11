# 围住小猫游戏 - 设计方案

## 一、项目概述

### 游戏简介
"围住小猫"（Catch the Cat）是一款经典的策略小游戏。玩家通过点击空白格子设置障碍物，目标是在小猫逃到边界之前将其围住。

### 游戏规则
1. 游戏在六边形蜂窝网格上进行
2. 小猫初始位于网格中央
3. 玩家每次点击一个空白格子，该格子变成障碍物
4. 小猫每回合会向最优方向移动一步（试图逃到边界）
5. 小猫到达边界 → 玩家失败
6. 小猫无路可走 → 玩家获胜

---

## 二、技术方案

### 技术栈
- **HTML5**: 页面结构
- **CSS3**: 样式、动画效果
- **JavaScript (ES6+)**: 游戏逻辑

### 项目结构（分离版）
```
catch_cat/
├── DESIGN.md         # 设计方案文档（本文件）
├── index.html        # 页面结构
├── css/
│   └── style.css     # 样式文件
└── js/
    └── game.js       # 游戏逻辑
```

---

## 三、核心数据结构

### 3.1 游戏状态
```javascript
const gameState = {
  gridSize: 9,              // 网格大小 9x9
  cat: { row: 4, col: 4 },  // 小猫位置（中心）
  blocks: new Set(),        // 障碍物坐标集合，格式: "row,col"
  gameOver: false,          // 游戏是否结束
  result: null              // 结果: 'win' | 'lose' | null
}
```

### 3.2 格子状态
```javascript
const CellState = {
  EMPTY: 0,      // 可通行（浅色）
  BLOCKED: 1,    // 障碍物（深色）
  CAT: 2         // 小猫位置
}
```

---

## 四、核心算法

### 4.1 六边形网格邻居计算

六边形网格中，每个格子有 6 个邻居。由于采用偏移坐标系，奇数行和偶数行的邻居偏移量不同。

```
    偶数行 (row % 2 === 0):
         ●  ●
        ● ○ ●
         ●  ●

    偏移: [(-1,-1), (0,-1), (-1,0), (1,0), (-1,1), (0,1)]

    奇数行 (row % 2 === 1):
         ●  ●
        ● ○ ●
         ●  ●

    偏移: [(0,-1), (1,-1), (-1,0), (1,0), (0,1), (1,1)]
```

```javascript
function getNeighbors(row, col, gridSize) {
  const isOddRow = row % 2 === 1
  const offsets = isOddRow
    ? [[0, -1], [1, -1], [-1, 0], [1, 0], [0, 1], [1, 1]]
    : [[-1, -1], [0, -1], [-1, 0], [1, 0], [-1, 1], [0, 1]]

  return offsets
    .map(([dc, dr]) => ({ row: row + dr, col: col + dc }))
    .filter(pos => isValidPosition(pos, gridSize))
}

function isValidPosition(pos, gridSize) {
  return pos.row >= 0 && pos.row < gridSize &&
         pos.col >= 0 && pos.col < gridSize
}
```

### 4.2 边界检测

```javascript
function isEdge(pos, gridSize) {
  return pos.row === 0 ||
         pos.row === gridSize - 1 ||
         pos.col === 0 ||
         pos.col === gridSize - 1
}
```

### 4.3 小猫寻路算法 (BFS)

使用广度优先搜索（BFS）找到小猫到边界的最短路径：

```javascript
function findBestMove(catPos, blocks, gridSize) {
  const queue = [{ pos: catPos, firstStep: null }]
  const visited = new Set([`${catPos.row},${catPos.col}`])

  while (queue.length > 0) {
    const { pos, firstStep } = queue.shift()

    // 到达边界，返回第一步方向
    if (isEdge(pos, gridSize)) {
      return firstStep
    }

    // 遍历邻居
    for (const neighbor of getNeighbors(pos.row, pos.col, gridSize)) {
      const key = `${neighbor.row},${neighbor.col}`

      if (!visited.has(key) && !blocks.has(key)) {
        visited.add(key)
        queue.push({
          pos: neighbor,
          firstStep: firstStep || neighbor  // 记录第一步
        })
      }
    }
  }

  // 无路可逃
  return null
}
```

---

## 五、模块设计

### 5.1 Grid 模块 - 网格渲染
- `createGrid()`: 创建网格 DOM 结构
- `renderGrid()`: 根据状态渲染网格
- `updateCell()`: 更新单个格子状态

### 5.2 Cat 模块 - 小猫管理
- `initCat()`: 初始化小猫位置
- `moveCat()`: 移动小猫到新位置
- `renderCat()`: 渲染小猫（带动画）

### 5.3 PathFinder 模块 - 寻路算法
- `findBestMove()`: BFS 寻找最优移动
- `getNeighbors()`: 获取邻居格子
- `isEdge()`: 判断是否为边界

### 5.4 GameController 模块 - 游戏控制
- `init()`: 初始化游戏
- `handleClick()`: 处理点击事件
- `checkGameOver()`: 检查游戏结束条件
- `reset()`: 重置游戏

---

## 六、UI 设计

### 6.1 布局结构
```
┌─────────────────────────────────┐
│            404                  │
│    您所访问的页面不存在或已删除    │
│                                 │
│       点击小圆点，围住小猫        │
│                                 │
│     ● ● ● ● ● ● ● ● ●          │
│      ● ● ● ● ● ● ● ● ●         │  ← 奇数行偏移
│     ● ● ● ● ● ● ● ● ●          │
│      ● ● ● ● 🐱 ● ● ● ●         │
│     ● ● ● ● ● ● ● ● ●          │
│      ● ● ● ● ● ● ● ● ●         │
│     ● ● ● ● ● ● ● ● ●          │
│                                 │
│    [重置]                       │
└─────────────────────────────────┘
```

### 6.2 配色方案
- 背景色: `#e8f4f8` (浅灰蓝)
- 空白格子: `#a8d4f0` (浅蓝)
- 障碍物: `#1a3a5c` (深蓝)
- 小猫: 黑色剪影图标

### 6.3 CSS 关键样式

```css
/* 网格容器 */
.grid {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* 每行 */
.row {
  display: flex;
  gap: 5px;
  justify-content: center;
}

/* 奇数行偏移 */
.row:nth-child(odd) {
  margin-left: 22px;
}

/* 格子 */
.cell {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #a8d4f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cell:hover {
  transform: scale(1.1);
}

.cell.blocked {
  background: #1a3a5c;
  cursor: not-allowed;
}

/* 小猫 */
.cat {
  position: absolute;
  font-size: 30px;
  transition: all 0.3s ease;
}
```

---

## 七、游戏流程

```
┌─────────────────┐
│     init()      │
│  初始化游戏状态   │
│  生成网格        │
│  随机放置障碍物   │
│  小猫居中        │
└────────┬────────┘
         ↓
┌─────────────────┐
│  等待玩家点击    │ ←──────────────────┐
└────────┬────────┘                    │
         ↓                             │
┌─────────────────┐                    │
│  handleClick()  │                    │
│  格子变障碍物    │                    │
└────────┬────────┘                    │
         ↓                             │
┌─────────────────┐                    │
│ findBestMove()  │                    │
│  小猫 BFS 寻路   │                    │
└────────┬────────┘                    │
         ↓                             │
    ┌────┴────┐                        │
    │ 有路径？ │                        │
    └────┬────┘                        │
    是 ↓    ↓ 否                       │
┌────────┐  ┌─────────┐                │
│移动小猫 │  │ 玩家获胜 │                │
└───┬────┘  └─────────┘                │
    ↓                                  │
┌────────────┐                         │
│ 到达边界？  │                         │
└─────┬──────┘                         │
  是 ↓    ↓ 否                         │
┌────────┐  └──────────────────────────┘
│小猫逃跑 │
│玩家失败 │
└────────┘
```

---

## 八、初始障碍物生成

为了增加游戏可玩性，开局随机生成若干障碍物：

```javascript
function generateInitialBlocks(gridSize, catPos, count = 8) {
  const blocks = new Set()

  while (blocks.size < count) {
    const row = Math.floor(Math.random() * gridSize)
    const col = Math.floor(Math.random() * gridSize)
    const key = `${row},${col}`

    // 不能是小猫位置，不能是已有障碍物
    if (row !== catPos.row || col !== catPos.col) {
      if (!blocks.has(key)) {
        blocks.add(key)
      }
    }
  }

  return blocks
}
```

---

## 九、扩展功能（可选）

1. **难度选择**: 调整网格大小和初始障碍物数量
2. **步数统计**: 记录玩家用了多少步围住小猫
3. **音效**: 点击音效、胜利/失败音效
4. **动画优化**: 小猫移动时的跳跃动画
5. **排行榜**: 本地存储最佳成绩

---

## 十、预计代码量

| 文件 | 预计行数 |
|------|----------|
| index.html | ~40 行 |
| css/style.css | ~120 行 |
| js/game.js | ~250 行 |
| **总计** | **~410 行** |

---

## 十一、开发步骤

1. [ ] 创建基础 HTML 结构
2. [ ] 实现 CSS 网格布局和样式
3. [ ] 实现网格渲染逻辑
4. [ ] 实现六边形邻居计算
5. [ ] 实现 BFS 寻路算法
6. [ ] 实现游戏主循环
7. [ ] 添加动画效果
8. [ ] 测试和调优
