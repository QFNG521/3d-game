// Preview harness: loads the page over file://, runs a minimal loop, captures console errors + screenshot.
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(execSync('npm root -g').toString().trim() + '/');
const puppeteer = require('puppeteer-core');
const out = process.argv[2] || resolve(here, '../shots/preview.png');
const w = +(process.argv[3] || 1280), h = +(process.argv[4] || 720), theme = +(process.argv[5] || 0), storm = +(process.argv[6] || 0);
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${w},${h}`],
});
const page = await browser.newPage();
const errs = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
page.on('requestfailed', r => errs.push('REQFAIL: ' + r.url()));
await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
await page.goto('file://' + resolve(here, '../index.html'));
await page.evaluate(() => document.getElementById('boot').classList.add('hidden'));
if (process.argv[7] !== 'title') await page.evaluate(() => { document.getElementById('title').classList.add('hidden'); });
if(!errs.length===false && errs.some(e=>e.startsWith('PAGEERROR'))){console.log(JSON.stringify({errs},null,1));await browser.close();process.exit(2)}
if(!errs.length===false && errs.some(e=>e.startsWith('PAGEERROR'))){console.log(JSON.stringify({errs},null,1));await browser.close();process.exit(2)}
await page.evaluate(async ({ theme, storm, view }) => {
  if (view) CL.render.setView(view === 'ink' ? view : isNaN(+view) ? view : +view);
  await new Promise(r => setTimeout(r, 300));
  CL.world.setTheme(theme); CL.world.storm(storm);
  const G = window.CL.game = { mouse: new THREE.Vector2(0.1, 0), aim: new THREE.Vector3(6, 2, 0), P: { x: 0, y: 0 } };
  let last = performance.now();
  const L = t => { requestAnimationFrame(L); const r = Math.min((t - last) / 1000, .05); last = t;
    CL.render.U.uTime.value = t / 1000; CL.render.updateCamera(r); CL.world.update(r, r, t / 1000); CL.render.render(); };
  requestAnimationFrame(L);
}, { theme, storm, view: process.argv[8] });
await new Promise(r => setTimeout(r, 3500));
await page.screenshot({ path: out });
const info = await page.evaluate(() => { const i = CL.render.renderer.info; return { inkCalls: CL.render.stats.ink, beautyCalls: CL.render.stats.beauty, tris: i.render.triangles, inkRoots: CL.ink.roots.size, geos: i.memory.geometries }; });
const fps = await page.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); const L = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(L); else res((n / (performance.now() - t0) * 1000).toFixed(1)); }; requestAnimationFrame(L); }));
info.fps = fps;
console.log(JSON.stringify({ out, info, errs }, null, 1));
await browser.close();
