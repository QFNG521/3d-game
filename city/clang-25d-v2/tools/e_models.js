// Model line-up: node tools/run.mjs @tools/e_models.js m0.png 1400 760 <group>
// group 0 enemies left, 1 enemies right, 2 player + guns, 3 bosses
(() => {
  const R = CL.render, MD = CL.models, T = THREE, grp = +(window.__args[0] || 0);
  window.__noCam = true; R.setView('post');
  const stage = new T.Group(); R.scene.add(stage);
  let camX = 0, dist = 13, lookY = 1.1, z = 4;
  const put = (id, x, y = 0, s = 1) => { const m = MD.spawn(id, stage); m.position.set(x, y, z); m.scale.multiplyScalar(s); return m; };
  if (grp === 0) { ['ripper', 'warden', 'hauler', 'spotter'].forEach((id, i) => put(id, -5 + i * 3.4)); }
  else if (grp === 1) { put('popper', -5); put('bulwark', -2.2); put('drone', .6, 2.2); put('husk', 3.2); put('worm', 5.6); }
  else if (grp === 2) {
    const pl = put('player', -3.2); const p = pl.userData.parts; p.armF.rotation.z = .3; p['kneeF'].rotation.z = .5; p.legF.rotation.z = -.4; p.legB.rotation.z = .5; p['kneeB'].rotation.z = -.3;
    const rifle = MD.guns.rifle(); p.armF.getObjectByName('gun').add(rifle); CL.ink.reg(rifle);
    put('player', -.6);
    ['pistol', 'shotgun', 'sniper'].forEach((k, i) => { const g = MD.guns[k](); g.position.set(1.2, 2.2 - i * .9, z); g.scale.setScalar(1.3); stage.add(g);; CL.ink.reg(g) });
    dist = 7; lookY = 1; camX = -.8;
  } else { ['butcher', 'commander', 'siege', 'carrier', 'maw', 'titan'].forEach((id, i) => { const m = put(id, -15 + i * 6, 0, i < 3 ? 1 : 1); }); dist = 24; lookY = 3.2; }
  const cam = R.camera; cam.position.set(camX, lookY + 2.4, z + dist); cam.lookAt(camX, lookY, z); cam.updateMatrixWorld();
  let meshes = 0; stage.traverse(o => { if (o.isMesh) meshes++; });
  return { meshes, calls: R.stats.beauty };
})()
