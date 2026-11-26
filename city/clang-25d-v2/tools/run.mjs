// Generic headless runner: node tools/run.mjs <expr | @file.js> [print | shotName] [w h]
// The expression may return a Promise; page errors / console errors are reported.
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(execSync('npm root -g').toString().trim() + '/');
const puppeteer = require('puppeteer-core');
const w = +(process.argv[4] || 1280), h = +(process.argv[5] || 720);
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${w},${h}`] });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
page.on('requestfailed', r => errs.push('REQFAIL: ' + r.url()));
await page.goto('file://' + resolve(here, '../index.html'));
await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
await new Promise(r => setTimeout(r, 500));
const arg = process.argv[2] && process.argv[2].startsWith('@') ? readFileSync(resolve(here, '../' + process.argv[2].slice(1)), 'utf8') : process.argv[2];
const mode = process.argv[3] || 'print';
const extra = process.argv.slice(6);
let res;
try {
  await page.evaluate(mode => {
    document.getElementById('boot').classList.add('hidden'); if (mode !== 'title') document.getElementById('title').classList.add('hidden');
    // 最小渲染循环（表达式可覆盖 CL.game / 相机）
    const G = window.CL.game = { mouse: new THREE.Vector2(.1, 0), aim: new THREE.Vector3(6, 2, 0), P: { x: 0, y: 0 } };
    let last = performance.now(); window.__frame = 0;
    const L = t => { requestAnimationFrame(L); const r = Math.min((t - last) / 1000, .05); last = t; window.__frame++;
      CL.render.U.uTime.value = t / 1000; if (!window.__noCam) CL.render.updateCamera(r); CL.world.update(r, r, t / 1000);
      if (!window.__noDraw && window.__fxReady) { CL.fx.draw && CL.fx.draw(); CL.bullets.draw && CL.bullets.draw(); }
      CL.render.render(); };
    requestAnimationFrame(L);
  }, mode);
  await new Promise(r => setTimeout(r, 300));
  await page.evaluate(a => { window.__args = a; }, extra);
  res = await page.evaluate(async code => {
    const out = await new Function('return (' + code + ')')();
    return out === undefined ? null : out;
  }, arg);
} catch (e) { errs.push('EVAL: ' + e.message + ' @ ' + String(e.stack || '').split('\n').slice(1, 4).join(' | ')); }
if (mode === 'print') console.log('RESULT', JSON.stringify(res));
else { await new Promise(r => setTimeout(r, 1300)); await page.screenshot({ path: resolve(here, '../shots/' + mode) }); console.log('shot -> shots/' + mode); }
console.log('errs', JSON.stringify(errs, null, errs.length > 3 ? 1 : 0));
await browser.close();
