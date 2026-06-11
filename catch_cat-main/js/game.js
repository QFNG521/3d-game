// Canvas 围住小猫游戏

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const messageEl = document.getElementById('message');
const resetBtn = document.getElementById('resetBtn');
const undoBtn = document.getElementById('undoBtn');
const themeBtn = document.getElementById('themeToggle');
const themeIcon = themeBtn ? themeBtn.querySelector('.theme-icon') : null;
const soundBtn = document.getElementById('soundToggle');
const moveCountEl = document.getElementById('moveCount');
const timerEl = document.getElementById('timer');
const difficultyPicker = document.getElementById('difficultyPicker');

// ===== 难度配置 =====
const DIFFICULTIES = {
  easy:   { gridSize: 7,  initialBlocks: 4 },
  normal: { gridSize: 9,  initialBlocks: 8 },
  hard:   { gridSize: 11, initialBlocks: 12 }
};
const DIFFICULTY_KEY = 'catch_cat_difficulty';
let currentDifficulty = 'normal';

// 游戏配置
const config = {
  gridSize: DIFFICULTIES.normal.gridSize,
  cellRadius: 20,
  cellGap: 5,
  colors: {
    // 实际值由 refreshColors() 从 CSS 变量读取
    background: '#e8f4f8',
    cell: '#a8d4f0',
    cellHover: '#8bc4e8',
    blocked: '#1a3a5c',
    cat: '#333333'
  }
};

// ===== 主题管理（暗色模式） =====
const THEME_KEY = 'catch_cat_theme';
let currentTheme = 'auto'; // 'auto' | 'light' | 'dark'

function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'auto') return saved;
  } catch (e) { /* localStorage 不可用时回退 auto */ }
  return 'auto';
}

function applyTheme(theme, refresh = true) {
  document.body.classList.remove('theme-light', 'theme-dark');
  if (theme === 'light') document.body.classList.add('theme-light');
  else if (theme === 'dark') document.body.classList.add('theme-dark');
  currentTheme = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* 忽略 */ }
  if (themeIcon) {
    themeIcon.textContent = theme === 'dark' ? '暗色' : theme === 'light' ? '亮色' : '自动';
  }
  if (refresh) refreshColors();
}

function refreshColors() {
  // 必须从 body 读，因为 body.theme-light/dark 的 CSS 变量覆盖设在 body 上；
  // 读 documentElement 拿不到 body 的覆盖（CSS 变量继承是父→子）
  const style = getComputedStyle(document.body);
  const v = (name) => style.getPropertyValue(name).trim();
  config.colors.background = v('--bg');
  config.colors.cell = v('--cell');
  config.colors.cellHover = v('--cell-hover');
  config.colors.blocked = v('--blocked');
  config.colors.cat = v('--cat');
}

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    // auto → dark → light → auto 循环
    const next = currentTheme === 'auto' ? 'dark'
               : currentTheme === 'dark' ? 'light'
               : 'auto';
    applyTheme(next);
  });
}

// ===== 难度管理 =====
function getSavedDifficulty() {
  try {
    const saved = localStorage.getItem(DIFFICULTY_KEY);
    if (saved && DIFFICULTIES[saved]) return saved;
  } catch (e) { /* localStorage 不可用时回退 normal */ }
  return 'normal';
}

function applyDifficulty(level) {
  currentDifficulty = level;
  config.gridSize = DIFFICULTIES[level].gridSize;
  try { localStorage.setItem(DIFFICULTY_KEY, level); } catch (e) { /* 忽略 */ }
  // 同步按钮激活态
  if (difficultyPicker) {
    difficultyPicker.querySelectorAll('.difficulty-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.difficulty === level);
    });
  }
}

if (difficultyPicker) {
  difficultyPicker.addEventListener('click', (e) => {
    const btn = e.target.closest('.difficulty-btn');
    if (!btn) return;
    const level = btn.dataset.difficulty;
    if (!DIFFICULTIES[level] || level === currentDifficulty) return;
    applyDifficulty(level);
    init(); // 重开一局
  });
}

// ===== 历史最佳记录（按难度分别保存） =====
const BEST_KEY = 'catch_cat_best';
function getBest(level) {
  try {
    const all = JSON.parse(localStorage.getItem(BEST_KEY) || '{}');
    return all[level] || null; // {moves, time}
  } catch (e) { return null; }
}
function setBest(level, moves, time) {
  try {
    const all = JSON.parse(localStorage.getItem(BEST_KEY) || '{}');
    all[level] = { moves, time };
    localStorage.setItem(BEST_KEY, JSON.stringify(all));
  } catch (e) { /* 忽略 */ }
}
function isBetter(level, moves, time) {
  const prev = getBest(level);
  if (!prev) return true;
  return moves < prev.moves || (moves === prev.moves && time < prev.time);
}

// ===== HUD（步数 + 计时） =====
function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function updateHud() {
  if (moveCountEl) moveCountEl.textContent = String(gameState.moveCount);
  if (timerEl) {
    const elapsed = gameState.finalTime > 0
      ? gameState.finalTime
      : (performance.now() - gameState.startTime) / 1000;
    timerEl.textContent = formatTime(elapsed);
  }
}

// 游戏状态
const gameState = {
  cat: { row: 4, col: 4 },
  blocks: new Set(),
  gameOver: false,
  result: null,
  isMoving: false,
  hoverCell: null,
  cells: [], // 存储每个格子的坐标
  history: [], // 撤销栈：每步玩家操作前的状态快照
  moveCount: 0,   // 玩家已下子步数
  startTime: 0,   // 当前局开始时间（performance.now()）
  finalTime: 0    // 结束时已用时（秒），用于显示与最佳记录比对
};

// 动画状态
const animation = {
  catX: 0,
  catY: 0,
  targetX: 0,
  targetY: 0,
  jumpPhase: 0, // 0: 静止, 1: 跳跃中
  jumpProgress: 0,
  escapePhase: 0, // 0: 无, 1: 逃跑中
  escapeProgress: 0,
  escapeDirection: null,
  trappedPhase: 0, // 0: 无, 1: 被困动画
  trappedProgress: 0,
  tailWag: 0, // 尾巴摆动相位
  time: 0 // 全局时间
};

// 初始化 Canvas 尺寸
function initCanvas() {
  const totalWidth = config.gridSize * (config.cellRadius * 2 + config.cellGap) + config.cellRadius;
  const totalHeight = config.gridSize * (config.cellRadius * 1.75 + config.cellGap) + config.cellRadius;

  canvas.width = totalWidth;
  canvas.height = totalHeight;

  // 计算每个格子的中心坐标
  gameState.cells = [];
  for (let row = 0; row < config.gridSize; row++) {
    const rowCells = [];
    const offsetX = (row % 2 === 1) ? config.cellRadius + config.cellGap / 2 : 0;

    for (let col = 0; col < config.gridSize; col++) {
      const x = offsetX + config.cellRadius + col * (config.cellRadius * 2 + config.cellGap);
      const y = config.cellRadius + row * (config.cellRadius * 1.75 + config.cellGap);
      rowCells.push({ x, y });
    }
    gameState.cells.push(rowCells);
  }
}

// 初始化游戏
function init() {
  // 先初始化 Canvas 和格子坐标
  initCanvas();

  // 难度：猫居中、初始障碍数取自当前难度
  const center = Math.floor(config.gridSize / 2);
  gameState.cat = { row: center, col: center };
  gameState.blocks = generateInitialBlocks(config.gridSize, gameState.cat, DIFFICULTIES[currentDifficulty].initialBlocks);
  gameState.gameOver = false;
  gameState.result = null;
  gameState.isMoving = false;
  gameState.hoverCell = null;
  gameState.history = [];
  gameState.moveCount = 0;
  gameState.startTime = performance.now();
  gameState.finalTime = 0;

  // 重置动画状态
  animation.jumpPhase = 0;
  animation.escapePhase = 0;
  animation.trappedPhase = 0;
  animation.tailWag = 0;
  animation.time = 0;

  // 设置猫咪初始位置
  const catCell = gameState.cells[gameState.cat.row][gameState.cat.col];
  animation.catX = catCell.x;
  animation.catY = catCell.y;
  animation.targetX = catCell.x;
  animation.targetY = catCell.y;

  // 清空结束面板
  messageEl.textContent = '';
  messageEl.className = 'message';

  updateHud();
  updateUndoButton();
}

// 绘制单个格子
function drawCell(x, y, isBlocked, isHovered) {
  ctx.beginPath();
  ctx.arc(x, y, config.cellRadius, 0, Math.PI * 2);

  if (isBlocked) {
    ctx.fillStyle = config.colors.blocked;
  } else if (isHovered) {
    ctx.fillStyle = config.colors.cellHover;
  } else {
    ctx.fillStyle = config.colors.cell;
  }

  ctx.fill();
}

// 绘制小猫
// pose: 'sit' = 蹲坐, 'jump' = 跳跃中
// jumpProgress: 跳跃进度 0-1
// tailWag: 尾巴摆动相位
function drawCat(x, y, pose = 'sit', jumpProgress = 0, tailWag = 0) {
  ctx.save();
  ctx.translate(x, y);

  const size = config.cellRadius * 0.9;

  if (pose === 'sit') {
    // ===== 蹲坐姿态 =====
    ctx.fillStyle = config.colors.cat;

    // 尾巴（在身体后面，带摆动）
    ctx.strokeStyle = config.colors.cat;
    ctx.lineWidth = size * 0.15;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const tailSwing = Math.sin(tailWag) * 0.2;
    ctx.moveTo(size * 0.2, size * 0.1);
    ctx.quadraticCurveTo(
      size * 0.6 + tailSwing * size,
      -size * 0.2,
      size * 0.4 + tailSwing * size * 0.5,
      -size * 0.6
    );
    ctx.stroke();

    // 后腿（蹲着的圆形）
    ctx.fillStyle = config.colors.cat;
    ctx.beginPath();
    ctx.ellipse(size * 0.15, size * 0.2, size * 0.25, size * 0.18, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 身体（椭圆，较圆润）
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.05, size * 0.28, size * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // 前腿
    ctx.beginPath();
    ctx.ellipse(-size * 0.15, size * 0.25, size * 0.1, size * 0.15, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 头
    ctx.beginPath();
    ctx.arc(0, -size * 0.4, size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // 耳朵
    ctx.beginPath();
    ctx.moveTo(-size * 0.25, -size * 0.55);
    ctx.lineTo(-size * 0.15, -size * 0.85);
    ctx.lineTo(0, -size * 0.55);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(size * 0.25, -size * 0.55);
    ctx.lineTo(size * 0.15, -size * 0.85);
    ctx.lineTo(0, -size * 0.55);
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-size * 0.1, -size * 0.42, size * 0.07, 0, Math.PI * 2);
    ctx.arc(size * 0.1, -size * 0.42, size * 0.07, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-size * 0.1, -size * 0.42, size * 0.035, 0, Math.PI * 2);
    ctx.arc(size * 0.1, -size * 0.42, size * 0.035, 0, Math.PI * 2);
    ctx.fill();

  } else if (pose === 'jump') {
    // ===== 跳跃姿态 =====
    // 根据跳跃进度调整姿态
    const t = jumpProgress;

    // 跳跃高度（抛物线）
    const jumpHeight = Math.sin(t * Math.PI) * 20;
    ctx.translate(0, -jumpHeight);

    // 身体角度（跳跃时前倾）
    let bodyAngle = 0;
    if (t < 0.3) {
      bodyAngle = -0.3 * (t / 0.3); // 起跳前倾
    } else if (t < 0.7) {
      bodyAngle = -0.3; // 空中保持
    } else {
      bodyAngle = -0.3 * (1 - (t - 0.7) / 0.3); // 落地恢复
    }
    ctx.rotate(bodyAngle);

    ctx.fillStyle = config.colors.cat;

    // 尾巴（跳跃时向后飘）
    ctx.strokeStyle = config.colors.cat;
    ctx.lineWidth = size * 0.12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const tailPhase = t * Math.PI * 2;
    ctx.moveTo(size * 0.35, size * 0.05);
    ctx.quadraticCurveTo(
      size * 0.7 + Math.sin(tailPhase) * size * 0.15,
      size * 0.15 + Math.cos(tailPhase) * size * 0.1,
      size * 0.55 + Math.sin(tailPhase + 1) * size * 0.1,
      size * 0.4
    );
    ctx.stroke();

    // 身体（横向拉伸）
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.4, size * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // 后腿（伸展蹬地/收起）
    ctx.save();
    ctx.translate(size * 0.25, size * 0.1);
    let backLegAngle = 0;
    if (t < 0.2) {
      backLegAngle = 0.8 - t * 4; // 蹬地
    } else if (t < 0.7) {
      backLegAngle = 0; // 收起
    } else {
      backLegAngle = (t - 0.7) * 2; // 准备落地
    }
    ctx.rotate(backLegAngle);
    ctx.beginPath();
    ctx.ellipse(0, size * 0.15, size * 0.08, size * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(size * 0.03, size * 0.35, size * 0.06, size * 0.12, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 前腿（向前伸/收回）
    ctx.save();
    ctx.translate(-size * 0.25, size * 0.05);
    let frontLegAngle = 0;
    if (t < 0.3) {
      frontLegAngle = -0.5 * (t / 0.3); // 向前伸
    } else if (t < 0.7) {
      frontLegAngle = -0.5 + (t - 0.3) * 0.5; // 保持/收回
    } else {
      frontLegAngle = -0.3 - (t - 0.7) * 1.5; // 落地伸出
    }
    ctx.rotate(frontLegAngle);
    ctx.beginPath();
    ctx.ellipse(0, size * 0.12, size * 0.07, size * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-size * 0.02, size * 0.3, size * 0.05, size * 0.1, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 头
    ctx.beginPath();
    ctx.arc(-size * 0.2, -size * 0.15, size * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // 耳朵
    ctx.beginPath();
    ctx.moveTo(-size * 0.35, -size * 0.3);
    ctx.lineTo(-size * 0.3, -size * 0.55);
    ctx.lineTo(-size * 0.15, -size * 0.3);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-size * 0.05, -size * 0.3);
    ctx.lineTo(-size * 0.1, -size * 0.55);
    ctx.lineTo(-size * 0.2, -size * 0.3);
    ctx.fill();

    // 眼睛
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-size * 0.27, -size * 0.18, size * 0.055, 0, Math.PI * 2);
    ctx.arc(-size * 0.13, -size * 0.18, size * 0.055, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-size * 0.27, -size * 0.18, size * 0.028, 0, Math.PI * 2);
    ctx.arc(-size * 0.13, -size * 0.18, size * 0.028, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// 绘制整个游戏画面
function draw() {
  // 清空画布
  ctx.fillStyle = config.colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制所有格子
  for (let row = 0; row < config.gridSize; row++) {
    for (let col = 0; col < config.gridSize; col++) {
      const cell = gameState.cells[row][col];
      const key = `${row},${col}`;
      const isBlocked = gameState.blocks.has(key);
      const isHovered = gameState.hoverCell &&
                        gameState.hoverCell.row === row &&
                        gameState.hoverCell.col === col &&
                        !isBlocked &&
                        !(row === gameState.cat.row && col === gameState.cat.col);

      drawCell(cell.x, cell.y, isBlocked, isHovered);
    }
  }

  // 绘制小猫
  let catX = animation.catX;
  let catY = animation.catY;
  let pose = 'sit';
  let jumpProgress = 0;

  // 跳跃动画
  if (animation.jumpPhase === 1) {
    const t = animation.jumpProgress;
    // 从起点到终点的插值
    catX = animation.catX + (animation.targetX - animation.catX) * t;
    catY = animation.catY + (animation.targetY - animation.catY) * t;
    pose = 'jump';
    jumpProgress = t;
  }

  // 逃跑动画（连续跳跃）
  if (animation.escapePhase === 1) {
    const t = animation.escapeProgress;
    const totalJumps = 4; // 总共跳4次
    const currentJump = Math.floor(t * totalJumps);
    const jumpT = (t * totalJumps) % 1; // 当前跳跃的进度

    let dx = 0, dy = 0;
    const jumpDist = 40; // 每次跳跃距离

    switch (animation.escapeDirection) {
      case 'up':
        dy = -jumpDist * (currentJump + jumpT);
        break;
      case 'down':
        dy = jumpDist * (currentJump + jumpT);
        break;
      case 'left':
        dx = -jumpDist * (currentJump + jumpT);
        break;
      case 'right':
        dx = jumpDist * (currentJump + jumpT);
        break;
    }

    catX += dx;
    catY += dy;
    pose = 'jump';
    jumpProgress = jumpT;
  }

  // 被困动画（原地挣扎）
  if (animation.trappedPhase === 1) {
    // 小幅度摇晃
    catX += Math.sin(animation.trappedProgress * Math.PI * 8) * 3;
  }

  // 只在未完全逃跑时绘制猫咪
  if (animation.escapePhase !== 1 || animation.escapeProgress < 0.9) {
    drawCat(catX, catY, pose, jumpProgress, animation.tailWag);
  }
}

// 动画循环
function gameLoop() {
  // 更新全局时间和尾巴摆动
  animation.time += 0.016;
  animation.tailWag = animation.time * 3; // 尾巴缓慢摆动

  // 更新跳跃动画
  if (animation.jumpPhase === 1) {
    animation.jumpProgress += 0.06;
    if (animation.jumpProgress >= 1) {
      animation.jumpProgress = 1;
      animation.jumpPhase = 0;
      animation.catX = animation.targetX;
      animation.catY = animation.targetY;

      // 检查是否逃跑
      if (gameState.gameOver && gameState.result === 'lose') {
        startEscapeAnimation();
      } else {
        gameState.isMoving = false;
        updateUndoButton(); // 跳跃结束（含撤销动画结束）后重新评估撤销按钮
      }
    }
  }

  // 更新逃跑动画
  if (animation.escapePhase === 1) {
    animation.escapeProgress += 0.015;
    if (animation.escapeProgress >= 1) {
      animation.escapeProgress = 1;
      animation.escapePhase = 0;
      gameState.isMoving = false;
      showEndMessage('lose');
      playLose();
      updateUndoButton();
    }
  }

  // 更新被困动画
  if (animation.trappedPhase === 1) {
    animation.trappedProgress += 0.03;
    if (animation.trappedProgress >= 1) {
      animation.trappedProgress = 0;
      animation.trappedPhase = 0;
      showEndMessage('win');
    }
  }

  // 每帧刷新 HUD（计时需要持续走动）
  updateHud();

  draw();
  requestAnimationFrame(gameLoop);
}

// 开始逃跑动画
function startEscapeAnimation() {
  const { row, col } = gameState.cat;
  const gridSize = config.gridSize;

  if (row === 0) {
    animation.escapeDirection = 'up';
  } else if (row === gridSize - 1) {
    animation.escapeDirection = 'down';
  } else if (col === 0) {
    animation.escapeDirection = 'left';
  } else {
    animation.escapeDirection = 'right';
  }

  animation.escapePhase = 1;
  animation.escapeProgress = 0;
  playEscape();
}

// 获取点击的格子
function getCellFromPoint(x, y) {
  for (let row = 0; row < config.gridSize; row++) {
    for (let col = 0; col < config.gridSize; col++) {
      const cell = gameState.cells[row][col];
      const dx = x - cell.x;
      const dy = y - cell.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= config.cellRadius) {
        return { row, col };
      }
    }
  }
  return null;
}

// 处理点击事件
function handleClick(e) {
  if (gameState.gameOver || gameState.isMoving) return;
  // 首次交互：恢复 AudioContext（浏览器策略要求）
  tryResumeAudio();

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const clicked = getCellFromPoint(x, y);
  if (!clicked) return;

  const { row, col } = clicked;
  const key = `${row},${col}`;

  // 不能点击已有障碍物或小猫位置
  if (gameState.blocks.has(key)) return;
  if (row === gameState.cat.row && col === gameState.cat.col) return;

  // 放置前先快照当前状态（用于撤销）
  gameState.history.push(snapshotState());

  // 放置障碍物
  gameState.blocks.add(key);
  gameState.moveCount += 1;
  playPlace();
  updateUndoButton();
  updateHud();

  // 小猫移动
  gameState.isMoving = true;
  setTimeout(() => {
    moveCat();
  }, 100);
}

// 处理鼠标移动
function handleMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  gameState.hoverCell = getCellFromPoint(x, y);
}

// 处理鼠标离开
function handleMouseLeave() {
  gameState.hoverCell = null;
}

// 移动小猫
function moveCat() {
  const bestMove = findBestMove(gameState.cat, gameState.blocks, config.gridSize);

  if (bestMove === null) {
    // 无路可逃，玩家获胜
    gameState.gameOver = true;
    gameState.result = 'win';
    gameState.isMoving = false;
    gameState.finalTime = (performance.now() - gameState.startTime) / 1000;

    // 播放被困动画
    animation.trappedPhase = 1;
    animation.trappedProgress = 0;
    playWin();
    updateUndoButton();
    return;
  }

  // 开始跳跃动画
  const targetCell = gameState.cells[bestMove.row][bestMove.col];
  animation.targetX = targetCell.x;
  animation.targetY = targetCell.y;
  animation.jumpPhase = 1;
  animation.jumpProgress = 0;
  playJump();

  // 更新游戏状态
  gameState.cat = bestMove;

  // 检查是否到达边界
  if (isEdge(gameState.cat, config.gridSize)) {
    gameState.gameOver = true;
    gameState.result = 'lose';
    gameState.finalTime = (performance.now() - gameState.startTime) / 1000;
  }
}

// 结束面板：胜负标题 + 本局统计 + 历史最佳 + 新纪录 + 再来一局
function showEndMessage(result) {
  const moves = gameState.moveCount;
  const time = gameState.finalTime;
  const isWin = result === 'win';
  const title = isWin ? '你赢了！' : '小猫逃跑了';
  const titleClass = isWin ? 'win' : 'lose';

  // 判定是否新纪录并落盘（仅胜利局计最佳）
  let best = getBest(currentDifficulty);
  let isNew = false;
  if (isWin) {
    if (isBetter(currentDifficulty, moves, time)) {
      setBest(currentDifficulty, moves, time);
      isNew = true;
      best = { moves, time };
    }
  }

  // 拼 HTML
  const bestText = best
    ? `历史最佳：${best.moves} 步 · ${formatTime(best.time)}`
    : '尚无最佳记录';
  messageEl.className = `message ${titleClass}`;
  messageEl.innerHTML = `
    <div class="result">${title}</div>
    <div class="result-stats">本局 ${moves} 步 · 用时 ${formatTime(time)}</div>
    <div class="${isNew ? 'result-new' : 'result-best'}">${isNew ? '🎉 新纪录！' : bestText}</div>
    <button class="play-again-btn" type="button">再来一局</button>
  `;
  const btn = messageEl.querySelector('.play-again-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      // 重新开始
      messageEl.textContent = '';
      messageEl.className = 'message';
      init();
    });
    // 自动聚焦，方便键盘直接回车
    setTimeout(() => btn.focus(), 0);
  }
}

// 生成初始障碍物
function generateInitialBlocks(gridSize, catPos, count) {
  const blocks = new Set();

  while (blocks.size < count) {
    const row = Math.floor(Math.random() * gridSize);
    const col = Math.floor(Math.random() * gridSize);
    const key = `${row},${col}`;

    if (row !== catPos.row || col !== catPos.col) {
      const neighbors = getNeighbors(catPos.row, catPos.col, gridSize);
      const isNeighbor = neighbors.some(n => n.row === row && n.col === col);

      if (!isNeighbor && !blocks.has(key)) {
        blocks.add(key);
      }
    }
  }

  return blocks;
}

// 获取六边形邻居
function getNeighbors(row, col, gridSize) {
  const isOddRow = row % 2 === 1;
  const offsets = isOddRow
    ? [[0, -1], [1, -1], [-1, 0], [1, 0], [0, 1], [1, 1]]
    : [[-1, -1], [0, -1], [-1, 0], [1, 0], [-1, 1], [0, 1]];

  return offsets
    .map(([dc, dr]) => ({ row: row + dr, col: col + dc }))
    .filter(pos => isValidPosition(pos, gridSize));
}

// 检查位置是否有效
function isValidPosition(pos, gridSize) {
  return pos.row >= 0 && pos.row < gridSize &&
         pos.col >= 0 && pos.col < gridSize;
}

// 检查是否在边界
function isEdge(pos, gridSize) {
  return pos.row === 0 ||
         pos.row === gridSize - 1 ||
         pos.col === 0 ||
         pos.col === gridSize - 1;
}

// BFS 寻找最佳移动
function findBestMove(catPos, blocks, gridSize) {
  const queue = [{ pos: catPos, firstStep: null }];
  const visited = new Set([`${catPos.row},${catPos.col}`]);

  while (queue.length > 0) {
    const { pos, firstStep } = queue.shift();

    if (isEdge(pos, gridSize) && firstStep !== null) {
      return firstStep;
    }

    for (const neighbor of getNeighbors(pos.row, pos.col, gridSize)) {
      const key = `${neighbor.row},${neighbor.col}`;

      if (!visited.has(key) && !blocks.has(key)) {
        visited.add(key);
        queue.push({
          pos: neighbor,
          firstStep: firstStep || neighbor
        });
      }
    }
  }

  return null;
}

// 事件监听（pointer 事件，原生支持鼠标 + 触摸 + 手写笔）
canvas.addEventListener('pointerdown', handleClick);
canvas.addEventListener('pointermove', handleMouseMove);
canvas.addEventListener('pointerleave', handleMouseLeave);
resetBtn.addEventListener('click', init);

// ===== 音效系统（Web Audio API 合成，零文件） =====
const SOUND_KEY = 'catch_cat_muted';
let isMuted = localStorage.getItem(SOUND_KEY) === 'true';
let audioCtx = null;

function ensureAudio() {
  if (audioCtx) return audioCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  audioCtx = new AC();
  return audioCtx;
}

function tryResumeAudio() {
  const ctx = ensureAudio();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function playTone({ freq, freqEnd, duration, type = 'sine', volume = 0.1 }) {
  if (isMuted) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration);
  }
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration + 0.01);
}

function playPlace()   { playTone({ freq: 800,  duration: 0.05, type: 'square',   volume: 0.05 }); }
function playJump()    { playTone({ freq: 300, freqEnd: 600, duration: 0.15, type: 'sine', volume: 0.08 }); }
function playEscape()  { playTone({ freq: 600, freqEnd: 200, duration: 0.4,  type: 'triangle', volume: 0.1 }); }
function playWin() {
  // C5 E5 G5 上行三音
  [523, 659, 784].forEach((freq, i) => {
    setTimeout(() => playTone({ freq, duration: 0.15, type: 'sine', volume: 0.1 }), i * 100);
  });
}
function playLose()  { playTone({ freq: 400, freqEnd: 150, duration: 0.6, type: 'triangle', volume: 0.1 }); }
function playUndo()  { playTone({ freq: 600, freqEnd: 400, duration: 0.1, type: 'sine', volume: 0.05 }); }

function updateSoundIcon() {
  if (soundBtn) soundBtn.classList.toggle('muted', isMuted);
}

if (soundBtn) {
  updateSoundIcon();
  soundBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    try { localStorage.setItem(SOUND_KEY, String(isMuted)); } catch (e) {}
    updateSoundIcon();
  });
}

// ===== 撤销系统 =====
function snapshotState() {
  return {
    cat: { row: gameState.cat.row, col: gameState.cat.col },
    blocks: new Set(gameState.blocks),
    gameOver: gameState.gameOver,
    result: gameState.result,
    moveCount: gameState.moveCount
  };
}

function undoMove() {
  if (gameState.history.length === 0) return;
  if (gameState.isMoving || gameState.gameOver) return;
  const prev = gameState.history.pop();
  gameState.cat = prev.cat;
  gameState.blocks = prev.blocks;
  gameState.gameOver = prev.gameOver;
  gameState.result = prev.result;
  gameState.moveCount = prev.moveCount;
  // 撤销可能回退到游戏未结束态：清除 finalTime，恢复计时器
  if (!gameState.gameOver) gameState.finalTime = 0;
  // 清除胜负消息
  messageEl.textContent = '';
  messageEl.className = 'message';
  // 启动反向跳跃动画：从当前视觉位置动画回到 prev.cat 所在格子
  // 不重置 jumpPhase，而是设成 1 让 gameLoop 自然播放，duration ≈ 0.28s
  const targetCell = gameState.cells[gameState.cat.row][gameState.cat.col];
  animation.targetX = targetCell.x;
  animation.targetY = targetCell.y;
  animation.jumpPhase = 1;
  animation.jumpProgress = 0;
  gameState.isMoving = true; // 阻止撤销期间新点击；gameLoop 跳完会自动设回 false
  updateUndoButton();
  updateHud();
  playUndo();
}

function updateUndoButton() {
  if (!undoBtn) return;
  const canUndo = gameState.history.length > 0 && !gameState.isMoving && !gameState.gameOver;
  undoBtn.disabled = !canUndo;
}

if (undoBtn) {
  undoBtn.addEventListener('click', undoMove);
}

// 应用保存的主题并刷新 Canvas 配色
applyTheme(getSavedTheme(), false);
refreshColors();

// 应用保存的难度（按钮激活态 + config.gridSize）
applyDifficulty(getSavedDifficulty());

// 启动游戏
init();
gameLoop();
