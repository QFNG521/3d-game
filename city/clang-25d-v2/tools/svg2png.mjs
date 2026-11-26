// rasterize svg files: node tools/svg2png.mjs out.png a.svg b.svg (stacked vertically)
import { createRequire } from 'module';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
const require = createRequire(execSync('npm root -g').toString().trim() + '/');
const puppeteer = require('puppeteer-core');
const [out, ...files] = process.argv.slice(2);
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
const svgs = files.map(f => readFileSync(f, 'utf8'));
await page.setContent('<body style="margin:0;background:#e9dcc3">' + svgs.join('') + '</body>');
await page.screenshot({ path: out, fullPage: true });
await browser.close();
