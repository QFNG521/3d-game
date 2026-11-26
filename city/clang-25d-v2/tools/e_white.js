(() => {
  const CL = window.CL, G = CL.G;
  document.getElementById('hint').style.display = 'none';
  CL.game = G; G.mouse = new THREE.Vector2(.2, .05); G.aim = new THREE.Vector3(6, 1.4, 0); G.press = {};
  CL.flow = { enemyMul: () => ({ hp: 1, dmg: 1 }), dropMult: () => 1, onEnemyDead() {}, onBossDead() {}, died() {} };
  CL.ui = CL.ui || {}; Object.assign(CL.ui, { hitmark() {}, toast() {}, bossIntro() {}, boss() {}, bossHide() {} });
  G.state = 'play'; CL.fx.init(); CL.clearCombat(); CL.enemies.clear(); CL.boss.clear(); CL.player.reset();
  for (let f = 0; f < 60; f++) { G.t += 1 / 60; G.P.inv = 9; CL.stepCombat(1 / 60); CL.player.update(1 / 60); G.press = {}; }
  // 列出玩家模型里所有白色 / 浅色网格
  const white = []; G.P.m.traverse(o => { if (o.isMesh) { const c = o.material.color; const l = (c.r + c.g + c.b) / 3; if (l > .8) { const v = new THREE.Vector3(); o.getWorldPosition(v); white.push(o.name + ' ' + c.getHexString() + ' w' + o.scale.x + ' @' + v.x.toFixed(2) + ',' + v.y.toFixed(2) + ',' + v.z.toFixed(2) + ' geo=' + o.geometry.type + ' p=' + o.parent.name) } } });
  const gs = []; if (G.P.gunMesh) G.P.gunMesh.traverse(o => { if (o.isMesh) { const c = o.material.color; gs.push(o.name + ' ' + c.getHexString() + ' geo=' + o.geometry.type) } });
  window.__noCam = false;
  return { white, gun: gs, gunChildren: G.P.gunMesh ? G.P.gunMesh.children.length : -1, fx: CL.fxLayer.children.map(c => c.type + (c.visible ? 'V' : 'h') + (c.material && c.material.opacity !== undefined ? ' op' + c.material.opacity.toFixed(2) : '')).join(' | ') };
})()
