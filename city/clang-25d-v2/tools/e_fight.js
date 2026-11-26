// 运行测试：主角 + 9 类敌人同场，手动步进 150 帧，返回各实体状态
(() => {
  const CL = window.CL, G = CL.G;
  CL.game = G; G.mouse = new THREE.Vector2(.2, .05); G.aim = new THREE.Vector3(6, 1.4, 0); G.press = {};
  CL.flow = { enemyMul: () => ({ hp: 1, dmg: 1 }), dropMult: () => 1, onEnemyDead() {}, died(s) { G.__died = (G.__died || 0) + 1; } };
  CL.ui = CL.ui || {}; CL.ui.hitmark = () => {}; CL.ui.toast = () => {};
  CL.AU.init && CL.AU.init();
  G.state = 'play';
  CL.fx.init(); window.__fxReady = 1; CL.clearCombat(); CL.enemies.clear();
  CL.player.reset();
  const ids = ['ripper', 'warden', 'hauler', 'spotter', 'popper', 'bulwark', 'drone', 'husk', 'worm'];
  const es = ids.map((id, i) => CL.enemies.spawn(id, i % 2 ? 6 + i * 2.2 : -6 - i * 2.2));
  const log = [];
  try {
  for (let f = 0; f < 240; f++) {
    G.t += 1 / 60;
    CL.stepCombat(1 / 60); CL.enemies.update(1 / 60); CL.player.update(1 / 60); G.press = {};
    if (f % 40 === 0) log.push(es.map(e => e.alive ? (e.id + ':' + e.state + '@' + e.x.toFixed(1) + ',' + e.y.toFixed(1)) : e.id + ':dead').join(' '));
  }
  } catch (e) { return { err: e.message, stack: String(e.stack).split('\n').slice(0, 5) }; }
  const P = G.P;
  return { log, hp: P.hp, died: G.__died || 0, score: G.score, kills: G.stats.kills, enemies: G.enemies.length, ebullets: G.ebullets.length, teles: G.teles.length, fxOk: true,
    stateNow: es.map(e => e.alive ? e.state : 'dead') };
})()
