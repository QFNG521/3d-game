// Probe: dump runtime values and run an A/B experiment (expr before/after).
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(execSync('npm root -g').toString().trim() + '/');
const puppeteer = require('puppeteer-core');
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
page.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE: ' + m.text()); });
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
await page.goto('file://' + resolve(here, '../index.html'));
await page.evaluate(() => { document.getElementById('boot').classList.add('hidden'); document.getElementById('title').classList.add('hidden'); });
await new Promise(r => setTimeout(r, 400));
const vals = await page.evaluate(() => {
  const R = CL.render, g = CL.world.groundMat;
  return { fog: { c: R.fog.color.getHexString(), n: R.fog.near, f: R.fog.far }, clear: R.clearColor.getHexString(),
    hemi: { c: R.lights.hemi.color.getHexString(), g: R.lights.hemi.groundColor.getHexString(), i: R.lights.hemi.intensity },
    key: { c: R.lights.key.color.getHexString(), i: R.lights.key.intensity, pos: R.lights.key.position.toArray() },
    ground: { color: g.color.getHexString(), type: g.type, hasMap: !!g.map, tone: !!g.map?.toneMapping, fog: g.fog, mapImg: g.map ? [g.map.image.width, g.map.image.height] : null },
    rev: THREE.REVISION, legacy: R.renderer.useLegacyLights, toneMapping: R.renderer.toneMapping, out: R.renderer.outputColorSpace, cm: THREE.ColorManagement.enabled };
});
console.log(JSON.stringify(vals, null, 1));
if (process.argv[3]) {
  await page.evaluate(() => { window.CL.game = { mouse: new THREE.Vector2(0, 0), aim: new THREE.Vector3(6, 2, 0), P: { x: 0, y: 0 } };
    let last = performance.now(); const L = t => { requestAnimationFrame(L); const r = Math.min((t - last) / 1000, .05); last = t; CL.render.U.uTime.value = t / 1000; CL.render.updateCamera(r); CL.world.update(r, r, t / 1000); CL.render.render(); }; requestAnimationFrame(L); });
  await new Promise(r => setTimeout(r, 1500));
  const arg = process.argv[2] && process.argv[2].startsWith('@') ? (await import('fs')).readFileSync(resolve(here, process.argv[2].slice(1)), 'utf8') : process.argv[2];
  const res = await page.evaluate(code => new Function('return (' + code + ')')(), arg);
  if (process.argv[3] === 'print') console.log('RESULT', JSON.stringify(res));
  if (process.argv[3] === 'print') { console.log('errs', JSON.stringify(errs)); await browser.close(); process.exit(0); }
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: resolve(here, '../shots/' + process.argv[3]) }); console.log('shot -> shots/' + process.argv[3]);
}
console.log('errs', JSON.stringify(errs));
await browser.close();
