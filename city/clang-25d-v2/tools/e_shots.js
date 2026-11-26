// HUD 截图：参数 [起始关, 帧数, 模式(hud|cards|boss|dead|win|pause|codex|settings)]
(() => {
  const CL = window.CL, G = CL.G, a = window.__args || [];
  const lvl = +(a[0] || 3), N = +(a[1] || 90), mode = a[2] || 'hud';
  document.getElementById('title').classList.add('hidden');
  CL.game = G; G.mouse = new THREE.Vector2(.2, .05); G.aim = new THREE.Vector3(6, 1.4, 0); G.press = {};
  document.getElementById('hud').classList.remove('hidden');
  CL.fx.init(); window.__fxReady = 1;
  CL.flow.start(lvl, { level: lvl });
  const P = G.P; P.cards.grapple = 1; P.cards.vest = 1; CL.player.addWeapon('rifle'); CL.player.addWeapon('shotgun'); CL.player.switchTo(1, true); CL.player.recompute();
  CL.player.giveCard('pistol-hammer');
  G.score = 12345; G.combo.n = 7; G.combo.pts = 30; G.combo.t = 3;
  for (let f = 0; f < N; f++) {
    P.inv = 9; P.hp = 62;
    G.t += 1 / 60;
    CL.stepCombat(1 / 60); CL.enemies.update(1 / 60); CL.player.update(1 / 60); CL.boss.update(1 / 60); CL.flow.update(1 / 60); G.press = {};
    if (mode === 'cards' && G.state !== 'cards') { CL.flow.F.cardsNext = true; for (const e of G.enemies.slice()) CL.killEnemy(e, {}); CL.flow.F.queue.length = 0; }
    if (mode === 'boss' && !G.boss && CL.flow.F.phase === 'bossIntro') CL.flow.F.t = 0;
    if (mode === 'boss' && G.boss) { CL.hitEnemy(G.boss, 400, { x: G.boss.x, y: 2, fromFront: true, dir: 1, weapon: 'pistol' }); G.boss.weakT = 1; }
    if (mode === 'dead') { G.state = 'dead'; CL.ui.showDead('撕裂者'); break; }
    if (mode === 'win') { G.state = 'win'; CL.ui.showWin(); break; }
    if (mode === 'pause') { CL.ui.pause(); break; }
    if (mode === 'codex') { document.getElementById('hud').classList.add('hidden'); CL.ui.codex(2); break; }
    if (mode === 'settings') { document.getElementById('hud').classList.add('hidden'); CL.ui.settings(); break; }
  }
  CL.ui.hud();
  return { state: G.state, phase: CL.flow.F.phase, event: CL.flow.F.event, enemies: G.enemies.map(e => e.id + '/' + e.state), level: G.level, boss: G.boss ? G.boss.id + '/' + G.boss.state : null, cards: CL.flow.F.cards ? CL.flow.F.cards.list.map(c => c.id) : null };
})()
