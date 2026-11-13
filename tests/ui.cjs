const { chromium, devices } = require('playwright');
const fs = require('fs');
(async () => {
  const out = process.argv[2], b = await chromium.launch(), errs = [], seen = [];
  const url = 'file://' + __dirname + '/../dist/dossier.html';
  const img = fs.readFileSync(__dirname + '/standin.jpg');
  for (const [name, opt, hash, mode] of [['desktop', { viewport: { width: 1280, height: 900 } }, '#DEMO1.NL..M', 'ok'], ['phone', devices['Pixel 7'], '#DEMO2.JP..F', 'ok'], ['fail', { viewport: { width: 1280, height: 900 } }, '#DEMO3.US.af.F', 'fail']]) {
    const ctx = await b.newContext({ ...opt, deviceScaleFactor: 1 }); const p = await ctx.newPage();
    await ctx.route(/pollinations\.ai/, (r) => { seen.push(r.request().url()); return mode === 'ok' && r.request().url().includes('gen.pollinations') ? r.fulfill({ status: 200, contentType: 'image/jpeg', body: img }) : r.abort(); });
    p.on('pageerror', e => errs.push(name + ' ' + e.message)); p.on('console', m => m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text()) && errs.push(name + ' ' + m.text()));
    await p.goto(url + hash); await p.waitForTimeout(1800);
    await p.screenshot({ path: `${out}/e-${name}.png`, fullPage: true });
    console.log(name, 'overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), await p.evaluate(() => __dossier.current.name), '| photo:', await p.evaluate(() => document.querySelector('.ph img') ? 'img' : document.querySelector('.ph .wait').innerText.replace(/\n/g, ' ')));
    if (name === 'desktop') {
      await p.click('#photoBtn'); await p.fill('#pkey', 'sk_test123'); await p.check('#pside'); await p.waitForTimeout(800);
      await p.screenshot({ path: `${out}/e-settings.png` });
      console.log('side figs', await p.locator('.ph').count(), 'imgs', await p.locator('.ph img').count());
      console.log('prompt:', await p.evaluate(() => __dossier.photoPrompt(__dossier.current, 'front')));
    }
    await ctx.close();
  }
  console.log('urls tried', seen.length, seen.slice(0, 2).map(u => u.slice(0, 110)));
  console.log('errors', errs.length ? errs : 'none'); await b.close();
})();
