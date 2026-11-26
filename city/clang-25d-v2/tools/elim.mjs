// Elimination harness: hides layer objects one at a time and reads a pixel grid.
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(execSync('npm root -g').toString().trim() + '/');
const puppeteer = require('puppeteer-core');
const layer = +(process.argv[2] || 2);
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
await page.setViewport({ width: 640, height: 360, deviceScaleFactor: 1 });
await page.goto('file://' + resolve(here, '../index.html'));
await page.evaluate(() => { document.getElementById('boot').classList.add('hidden'); document.getElementById('title').classList.add('hidden'); });
await new Promise(r => setTimeout(r, 400));
const res = await page.evaluate((layer) => {
  const R = CL.render, r = R.renderer, sc = R.scene, cam = new THREE.PerspectiveCamera();
  cam.copy(R.camera); cam.layers.set(layer); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
  const gl = r.getContext(), px = new Uint8Array(4);
  const read = (x, y) => { r.setRenderTarget(null); r.setClearColor(0xff00ff); r.clear(); r.render(sc, cam); gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return px[0] + ',' + px[1] + ',' + px[2]; };
  const c = () => read(innerWidth / 2 | 0, innerHeight / 2 | 0) + ' / ' + read(innerWidth / 2 | 0, (innerHeight * .9) | 0);
  const objs = []; sc.traverse(o => { if (o.layers.mask === (1 << layer) && o.visible && o.material) objs.push(o); });
  const out = { base: c() };
  for (const o of objs) { o.visible = false; const k = o.type + '#' + (o.geometry && o.geometry.type) + '@' + o.position.toArray().map(x => x.toFixed(0)).join('/') + ' sc' + o.scale.x.toFixed(1) + ' op' + (+o.material.opacity).toFixed(2) + ' ' + (o.material.color ? o.material.color.getHexString() : '') + ' n' + (o.geometry && o.geometry.attributes.position ? o.geometry.attributes.position.count : 0); out[k] = c(); o.visible = true; }
  return out;
}, layer);
for (const [k, v] of Object.entries(res)) console.log(v.padEnd(22), k);
console.log('errs', JSON.stringify(errs));
await browser.close();
