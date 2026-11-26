// Boss 测试：__args[0]=boss id, __args[1]=帧数(默认 600), __args[2]=伤害每帧(默认 0)；记录状态分布
(() => {
  const CL = window.CL, G = CL.G;
  const id = (window.__args && window.__args[0]) || 'butcher', N = +((window.__args && window.__args[1]) || 600), hurt = +((window.__args && window.__args[2]) || 0);
  CL.game = G; G.mouse = new THREE.Vector2(.2, .05); G.aim = new THREE.Vector3(6, 1.4, 0); G.press = {};
  CL.flow = { enemyMul: () => ({ hp: 1, dmg: 1 }), dropMult: () => 1, onEnemyDead() {}, onBossDead() { G.__bossDead = 1; }, died(s) { G.__died = (G.__died || 0) + 1; } };
  CL.ui = CL.ui || {}; Object.assign(CL.ui, { hitmark() {}, toast() {}, bossIntro() {}, boss(e) { G.__bossUi = e; }, bossHide() {} });
  G.state = 'play';
  CL.fx.init(); window.__fxReady = 1; CL.clearCombat(); CL.enemies.clear(); CL.boss.clear();
  CL.player.reset();
  const b = CL.boss.spawn(CL.D.BOSS.find(x => x.id === id), 1);
  const hist = {}, att = {}, trans = []; let err = null; const snips = []; let lastS = '';
  try {
    for (let f = 0; f < N; f++) {
      G.t += 1 / 60; G.P.inv = 9; G.P.x = Math.sin(f / 60) * 6;
      if (hurt && f % 3 === 0) CL.hitEnemy(b, hurt, { x: b.x, y: 2, fromFront: f % 600 < 300, dir: 1, weapon: 'pistol' });
      CL.stepCombat(1 / 60); CL.enemies.update(1 / 60); CL.player.update(1 / 60); CL.boss.update(1 / 60); G.press = {};
      const k = b.state + (b.stage ? ':' + b.stage : ''); hist[k] = (hist[k] || 0) + 1;
      if (b.state !== lastS) { trans.push(b.state + '@' + f); lastS = b.state; }
      if (b.state !== 'idle' && b.state !== 'intro') att[b.state] = (att[b.state] || 0) + 1;
      if (f % 120 === 0) snips.push(b.state + '@' + b.x.toFixed(1) + ',' + b.y.toFixed(1) + ' hp' + (b.hp / b.hpMax).toFixed(2) + ' ar' + (b.armourHp / b.armourMax).toFixed(2));
      if (G.__bossDead) break;
    }
  } catch (e) { err = e.message + ' @ ' + String(e.stack).split('\n').slice(1, 4).join(' | '); }
  return { id, trans, snips, err, dead: G.__bossDead || 0, died: G.__died || 0, hp: Math.round(G.P.hp), score: G.score, enemies: G.enemies.length, ebul: G.ebullets.length, cur: !!CL.boss.cur };
})()
