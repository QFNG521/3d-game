// 全流程测试：从第 1 关自动打到通关（无敌 + 自瞄 + 自动选卡），参数: 起始关(默认1), 最大帧数(默认 90000), 关卡参数
(() => {
  const CL = window.CL, G = CL.G, a = window.__args || {};
  const startL = +(a[0] || 1), N = +(a[1] || 90000);
  document.getElementById('title').classList.add('hidden'); document.getElementById('boot').classList.add('hidden');
  const el = id => document.getElementById(id);
  CL.game = G; G.mouse = new THREE.Vector2(.2, .05); G.aim = new THREE.Vector3(6, 1.4, 0); G.press = {};
  el('hud').classList.remove('hidden');
  CL.fx.init(); window.__fxReady = 1;
  G.diff = a[3] || 'normal';
  CL.flow.start(startL, { level: startL });
  const log = []; let f = 0, lastLevel = 0, lvlFrame = 0, cards = [], errs = null, stuck = 0, lastPhase = '', bossSeen = [];
  const P = () => G.P;
  try {
    for (; f < N; f++) {
      if (G.state === 'win' || G.state === 'title') break;
      if (G.state === 'cards') { const L = CL.flow.F.cards ? CL.flow.F.cards.list : []; cards.push(G.level + ':' + L.map(c => c.id).join('/')); const wi = L.findIndex(c => c.kind === 'weapon' && !G.P.cards[c.id]); CL.flow.pickCard(wi >= 0 ? wi : 0); continue; }
      if (G.state !== 'play') { G.state = 'play'; }
      const p = P();
      p.inv = 9; p.hp = p.hpMax;
      // 自瞄：最近的敌人 / Boss
      let tgt = null, bd = 1e9;
      for (const e of G.enemies) { if (!e.alive || e.untargetable) continue; const d = Math.abs(e.x - p.x); if (d < bd) { bd = d; tgt = e; } }
      if (G.boss && G.boss.alive && !G.boss.untargetable) tgt = G.boss;
      G.mouse.down = !!tgt && (p.w.d.auto || f % 2 === 0) && CL.flow.F.phase !== 'dead';
      if (tgt) { G.aim.x = tgt.x; G.aim.y = tgt.y + tgt.def.height * (tgt.scale || 1) * .5; p.x = Math.max(-24, Math.min(24, tgt.x - 9)); }
      G.t += 1 / 60;
      CL.stepCombat(1 / 60); CL.enemies.update(1 / 60); CL.player.update(1 / 60); CL.boss.update(1 / 60); CL.flow.update(1 / 60); G.press = {};
      p.m.updateMatrixWorld(true);
      if (G.hitstop > 0) G.hitstop = 0;
      if (G.level !== lastLevel) { if (lastLevel) log.push(lastLevel + ':' + lvlFrame); lastLevel = G.level; lvlFrame = 0; }
      lvlFrame++;
      if (G.boss && !bossSeen.includes(G.boss.id)) bossSeen.push(G.boss.id);
      // 卡死检测：每关最多 60 秒模拟
      if (lvlFrame > 3600) { log.push(G.level + ':STUCK(' + CL.flow.F.phase + ' q' + CL.flow.F.queue.length + ' e' + G.enemies.map(e => e.id + '/' + e.state + '/' + Math.round(e.hp) + '@' + e.x.toFixed(0) + ',' + e.y.toFixed(1)).join(',') + ' boss' + (G.boss ? G.boss.id + '/' + G.boss.state + '/' + Math.round(G.boss.hp) : '-') + ' P' + Math.round(G.P.x) + ',' + Math.round(G.P.y) + ' dead' + G.P.dead + ')'); CL.flow.F.queue.length = 0; for (const e of G.enemies.slice()) CL.killEnemy(e, {}); if (G.boss) CL.hitEnemy(G.boss, 1e6, { x: G.boss.x, y: 1 }); lvlFrame = 0; }
      if (G.state === 'dead') { log.push(G.level + ':DEAD'); CL.ui.retry(); }
    }
  } catch (e) { errs = e.message + ' @ ' + String(e.stack).split('\n').slice(1, 4).join(' | '); }
  return { frames: f, level: G.level, phase: CL.flow.F.phase, state: G.state, score: G.score, log, cards: cards.length, cardsSample: cards.slice(0, 6), bossSeen, errs,
    kills: G.stats.kills, weapons: G.P.weapons.map(w => w.id), cardList: Object.keys(G.P.cards), event: CL.flow.F.event, best: CL.flow.best(), nan: window.__nan || null };
})()
