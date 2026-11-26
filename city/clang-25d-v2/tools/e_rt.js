(() => {
  const R = CL.render, r = R.renderer, buf = new Uint8Array(4), buf2 = new Uint8Array(4);
  const out = {};
  // 1) after a normal frame: read the beauty RT at center and bottom
  R.render();
  const rt = R.getRT(), sz = rt.width + 'x' + rt.height;
  r.readRenderTargetPixels(rt, rt.width / 2 | 0, rt.height / 2 | 0, 1, 1, buf);
  out.rtCenter = Array.from(buf).join(',');
  r.readRenderTargetPixels(rt, rt.width / 2 | 0, (rt.height * .1) | 0, 1, 1, buf2);
  out.rtBottom = Array.from(buf2).join(',');
  out.rtSize = sz; out.type = rt.texture.type + ' fmt ' + rt.texture.format + ' cs ' + rt.texture.colorSpace;
  // 2) the canvas after composite
  const gl = r.getContext();
  gl.readPixels(innerWidth / 2 | 0, innerHeight / 2 | 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  out.canvasCenter = Array.from(buf).join(',');
  // 3) direct render to screen of layer 0 only
  const cam2 = R.camera.clone(); cam2.layers.set(0);
  r.setRenderTarget(null); r.setClearColor(0xff00ff); r.render(R.scene, cam2);
  gl.readPixels(innerWidth / 2 | 0, innerHeight / 2 | 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
  out.directL0Center = Array.from(buf).join(',');
  // 4) render layer 0 only into the RT
  r.setRenderTarget(rt); r.setClearColor(0xff00ff); r.render(R.scene, cam2);
  r.readRenderTargetPixels(rt, rt.width / 2 | 0, rt.height / 2 | 0, 1, 1, buf);
  out.rtL0Center = Array.from(buf).join(',');
  out.outCS = r.outputColorSpace; out.tone = r.toneMapping; out.legacy = r.useLegacyLights;
  return out;
})()
