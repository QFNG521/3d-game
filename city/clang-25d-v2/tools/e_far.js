(() => {
  let fm = null;
  CL.render.scene.traverse(o => { if (o.isMesh && o.layers.mask === 4 && o.geometry.type === 'BufferGeometry' && o.geometry.attributes.position.count > 5000) fm = o; });
  const g = fm.geometry; g.computeBoundingBox(); const bb = g.boundingBox;
  const p = g.attributes.position.array, n = g.attributes.normal.array;
  let nan = 0; for (let i = 0; i < p.length; i++) if (!isFinite(p[i])) nan++;
  let nanN = 0; for (let i = 0; i < n.length; i++) if (!isFinite(n[i])) nanN++;
  const wm = new THREE.Matrix4().multiplyMatrices(CL.render.camera.projectionMatrix, CL.render.camera.matrixWorldInverse);
  let behind = 0; const v = new THREE.Vector3();
  for (let i = 0; i < p.length; i += 3) { v.set(p[i], p[i + 1], p[i + 2]).applyMatrix4(wm); if (v.z < -1 || v.z > 1) behind++; }
  g.computeBoundingSphere();
  return { bb: [bb.min.toArray().map(a => +a.toFixed(1)), bb.max.toArray().map(a => +a.toFixed(1))], nan, nanN, behind,
    attrs: Object.keys(g.attributes), posCount: g.attributes.position.count, norCount: g.attributes.normal.count,
    norItem: g.attributes.normal.itemSize, normSample: Array.from(n.slice(0, 6)).map(a => +a.toFixed(2)), normLen: Math.hypot(n[0], n[1], n[2]).toFixed(3),
    posSample: Array.from(p.slice(0, 9)).map(a => +a.toFixed(2)), frustum: fm.frustumCulled,
    bs: +g.boundingSphere.radius.toFixed(1), center: g.boundingSphere.center.toArray().map(a => +a.toFixed(1)), drawRange: g.drawRange };
})()
