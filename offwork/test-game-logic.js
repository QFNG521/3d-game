/* 无头逻辑测试：提取 offwork-escape-3d-v2.html 中的 game-logic 并驱动真实游戏循环 */
'use strict';
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'offwork-escape-3d-v2.html'), 'utf8');
const m = html.match(/<script id="game-logic">([\s\S]*?)<\/script>/);
if (!m) { console.error('FAIL: 找不到 game-logic 脚本'); process.exit(1); }

const win = {};
new Function('window', 'module', m[1])(win, { exports: {} });
const GL = win.GL;
if (!GL) { console.error('FAIL: GL 未导出'); process.exit(1); }

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('  ✗ FAIL:', msg); }
}
function section(t) { console.log('\n== ' + t + ' =='); }

const DT = 1 / 60;

/* ---------- 1. 地图完整性 ---------- */
section('地图完整性');
{
  const g = GL.newGame('normal');
  ok(GL.W === 30 && GL.H === 20, '地图尺寸 30x20');
  // 所有目标点 / 出生点 / 出口可行走
  const walk = (x, y) => !GL.blocksMove(Math.floor(x), Math.floor(y));
  ok(walk(GL.SPAWN.x, GL.SPAWN.y), '出生点可行走');
  ok(walk(GL.EXIT.x, GL.EXIT.y), '出口可行走');
  GL.OBJECTS.forEach(o => ok(walk(o.x, o.y), '目标可行走: ' + o.name));
  GL.ZONES.forEach(z => ok(walk(z.x, z.y), '区域标签位于可行走格: ' + z.t));
  // 巡逻路径点可行走
  const routes = [GL.ROUTES.boss].concat(GL.ROUTES.mates);
  routes.forEach((r, ri) => r.forEach((p, pi) =>
    ok(walk(p[0] + 0.5, p[1] + 0.5), `路线${ri} 路径点${pi} (${p}) 可行走`)));
  // 巡逻直线段不被家具打断（按 NPC 半径 0.3 采样）
  routes.forEach((r, ri) => {
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const steps = Math.ceil(len / 0.1);
      let clear = true;
      for (let s = 0; s <= steps; s++) {
        const x = a[0] + 0.5 + (b[0] - a[0]) * s / steps;
        const y = a[1] + 0.5 + (b[1] - a[1]) * s / steps;
        for (let rr = Math.floor(y - 0.3); rr <= Math.floor(y + 0.3); rr++)
          for (let cc = Math.floor(x - 0.3); cc <= Math.floor(x + 0.3); cc++)
            if (GL.blocksMove(cc, rr)) clear = false;
      }
      ok(clear, `路线${ri} 段${i} (${a}→${b}) 无遮挡`);
    }
  });
}

/* ---------- 2. 连通性 ---------- */
section('连通性（从出生点 BFS）');
{
  const reached = new Set();
  const q = [[Math.floor(GL.SPAWN.x), Math.floor(GL.SPAWN.y)]];
  reached.add(q[0][0] + ',' + q[0][1]);
  while (q.length) {
    const [cx, cy] = q.shift();
    [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx, dy]) => {
      const nx = cx + dx, ny = cy + dy, k = nx + ',' + ny;
      if (nx < 0 || ny < 0 || nx >= GL.W || ny >= GL.H || reached.has(k) || GL.blocksMove(nx, ny)) return;
      reached.add(k); q.push([nx, ny]);
    });
  }
  const conn = (x, y) => reached.has(Math.floor(x) + ',' + Math.floor(y));
  GL.OBJECTS.forEach(o => ok(conn(o.x, o.y), '目标连通: ' + o.name));
  ok(conn(GL.EXIT.x, GL.EXIT.y), '出口连通');
  [GL.ROUTES.boss].concat(GL.ROUTES.mates).forEach((r, ri) =>
    r.forEach((p, pi) => ok(conn(p[0] + 0.5, p[1] + 0.5), `路线${ri} 点${pi} 连通`)));
  // 所有非玻璃的可走格都应连通（无孤岛房间）
  let isolated = 0;
  for (let y = 0; y < GL.H; y++) for (let x = 0; x < GL.W; x++)
    if (!GL.blocksMove(x, y) && !reached.has(x + ',' + y)) isolated++;
  ok(isolated === 0, '无孤立区域（不可达地板格: ' + isolated + '）');
}

/* ---------- 3. 机器人通关（win 机械可达） ---------- */
section('机器人通关');
{
  GL._test.noSense = true; // 只验证目标链/交互/出口流程
  const g = GL.newGame('easy');
  let interactHeld = false, frames = 0, done = false;
  while (frames++ < 60 * 120 && !done) {
    const p = g.player;
    let inp = { mx: 0, mz: 0, sprint: false, interact: false };
    if (g.channel > 0) {
      // 原地等待交互完成
    } else {
      const target = g.doorOpen ? GL.EXIT : g.objs[g.taskIdx];
      if (target) {
        const d = GL.dist(p.x, p.y, target.x, target.y);
        if (!g.doorOpen && d < 1.4) {
          if (!interactHeld) { inp.interact = true; interactHeld = true; }
        } else {
          interactHeld = false;
          const pathArr = GL.findPath(p.x, p.y, target.x, target.y);
          const wp = pathArr && pathArr.length ? pathArr[0] : target;
          const dx = wp.x - p.x, dy = wp.y - p.y, l = Math.hypot(dx, dy) || 1;
          inp.mx = dx / l; inp.mz = dy / l;
          if (d < 0.3 && pathArr && pathArr.length > 1) { /* 继续 */ }
        }
      }
    }
    GL.update(DT, inp);
    if (g.state === 'win') done = true;
    if (g.state === 'lose') break;
  }
  ok(done, '机器人完成全部清单并走出大门（帧数: ' + frames + ', 状态: ' + g.state +
    (g.over ? '/' + g.over.reason : '') + ', 任务进度: ' + g.taskIdx + '）');
  ok(g.winInfo && ['S','A','B','C'].includes(g.winInfo.grade), '结算评级有效: ' + (g.winInfo && g.winInfo.grade));
  GL._test.noSense = false;
}

/* ---------- 4. 侦测 → 追击 → 抓住 ---------- */
section('侦测系统');
{
  const g = GL.newGame('normal');
  // 把玩家放到上司巡逻路线的侧前方：视野窗口长（>1.8s）、LOS 畅通、横向间隔 0.7 不会先触发碰撞
  g.player.x = 26.2; g.player.y = 8.0;
  let sawChase = false, frames = 0;
  while (frames++ < 60 * 30 && g.state === 'play') {
    GL.update(DT, { mx: 0, mz: 0, sprint: false, interact: false });
    if (g.boss.mode === 'chase') sawChase = true;
  }
  ok(sawChase, '上司视野内玩家触发追击');
  ok(g.state === 'lose' && g.over.reason === 'caught', '站着不动被上司抓住');
  ok(g.spotted > 0, '暴露计数生效: ' + g.spotted);
}

/* ---------- 5. 超时失败 ---------- */
section('超时失败');
{
  const g = GL.newGame('easy');
  g.t = 0.5;
  for (let i = 0; i < 90 && g.state === 'play'; i++)
    GL.update(DT, { mx: 0, mz: 0, sprint: false, interact: false });
  ok(g.state === 'lose' && g.over.reason === 'time', '倒计时结束判定加班失败');
}

/* ---------- 6. 同事打小报告 ---------- */
section('同事告状');
{
  const g = GL.newGame('hard');
  const mate = g.npcs.find(n => !n.isBoss);
  // 玩家站到同事正前方
  g.player.x = mate.x + Math.cos(mate.dir) * 1.4;
  g.player.y = mate.y + Math.sin(mate.dir) * 1.4;
  let sawReport = false, bossInvestigated = false, frames = 0;
  while (frames++ < 60 * 60 && g.state === 'play') {
    GL.update(DT, { mx: 0, mz: 0, sprint: false, interact: false });
    if (mate.mode === 'report') sawReport = true;
    if (sawReport && (g.boss.mode === 'investigate' || g.boss.mode === 'chase')) bossInvestigated = true;
    if (bossInvestigated) break;
  }
  ok(sawReport, '同事发现玩家后进入告状状态');
  ok(bossInvestigated, '告状后上司前来搜捕/追击');
}

/* ---------- 7. NPC 活性 ---------- */
section('NPC 活性（巡逻不卡死）');
{
  const g = GL.newGame('hard');
  GL._test.noSense = true;
  const start = g.npcs.map(n => ({ x: n.x, y: n.y }));
  for (let i = 0; i < 60 * 12; i++)
    GL.update(DT, { mx: 0, mz: 0, sprint: false, interact: false });
  g.npcs.forEach((n, i) => {
    const moved = Math.hypot(n.x - start[i].x, n.y - start[i].y);
    ok(n.moveAmt > 3, n.name + ' 累计移动量充足: ' + n.moveAmt.toFixed(1));
  });
  GL._test.noSense = false;
}

/* ---------- 8. 随机压力测试 ---------- */
section('随机压力（20000 帧）');
{
  let g = GL.newGame('hard');
  let err = null, restarts = 0;
  const codes = [0, 1, 2, 3];
  try {
    for (let i = 0; i < 20000; i++) {
      const inp = {
        mx: (Math.random() * 2 - 1), mz: (Math.random() * 2 - 1),
        sprint: Math.random() < 0.4, interact: Math.random() < 0.05
      };
      GL.update(DT, inp);
      GL.drainEvents();
      if (g.state === 'win' || g.state === 'lose') { g = GL.newGame('hard'); restarts++; }
    }
  } catch (e) { err = e; }
  ok(!err, '20000 帧无异常' + (err ? ': ' + err.stack : ''));
}

console.log('\n========================================');
console.log(`通过 ${pass} 项，失败 ${fail} 项`);
process.exit(fail ? 1 : 0);
