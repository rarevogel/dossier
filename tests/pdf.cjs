// Simulates the Android PDF path in a phone-sized browser: a stand-in bridge takes a screenshot for every tile,
// the way the app copies the screen, and the tiles are pasted into one image per page.
const { chromium, devices } = require('playwright');
const fs = require('fs');
(async () => {
  const out = process.argv[2], b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ ...devices['Pixel 7'] }); const p = await ctx.newPage(), errs = [];
  const img = fs.readFileSync(__dirname + '/standin.jpg');
  await ctx.route(/pollinations\.ai/, r => r.fulfill({ status: 200, contentType: 'image/jpeg', body: img }));
  p.on('pageerror', e => errs.push(e.message));
  const log = { pages: [], name: '' }; let n = 0;
  await p.exposeFunction('pwBegin', (name, vw, vh) => { log.name = name; log.vw = vw; log.vh = vh; });
  await p.exposeFunction('pwPage', (w, h) => { log.pages.push({ w, h, tiles: [] }); });
  await p.exposeFunction('pwTile', async (tx, ty) => { const f = `${out}/tile-${n++}.png`; await p.screenshot({ path: f }); log.pages[log.pages.length - 1].tiles.push({ tx, ty, f }); });
  await p.exposeFunction('pwEnd', () => { log.done = true; });
  await p.addInitScript(() => { window.DossierApp = { pdfBegin: (n, w, h) => pwBegin(n, w, h), pdfPage: (w, h) => pwPage(w, h), pdfTile: (x, y) => pwTile(x, y).then(() => window.__tileDone()), pdfEnd: () => pwEnd() }; });
  await p.goto('file://' + __dirname + '/../dist/dossier.html#DEMO4.RU..F');
  await p.click('#print');
  await p.waitForFunction(() => document.querySelectorAll('.scan canvas').length === 10, null, { timeout: 240000 });
  for (let t = 0; t < 120 && !log.done; t++) await p.waitForTimeout(500);
  fs.writeFileSync(`${out}/tiles.json`, JSON.stringify(log));
  console.log(log.name, log.vw + 'x' + log.vh, log.pages.map(pg => `${pg.w}x${pg.h}:${pg.tiles.length} tiles`).join(' | '));
  await p.evaluate(() => window.__pdfDone(true, 'PDF saved.')); await p.waitForTimeout(300);
  console.log('restored:', await p.evaluate(() => !document.documentElement.classList.contains('pdf') && !document.querySelector('.page.cap')), await p.textContent('#pdfmsg'));
  console.log('errors', errs.length ? errs : 'none'); await b.close();
})();
