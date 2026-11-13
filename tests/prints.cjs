const { chromium, devices } = require('playwright');
(async () => {
  const out = process.argv[2], b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }), errs = [];
  for (const [name, opt] of [['desktop', { viewport: { width: 1280, height: 900 } }], ['phone', devices['Pixel 7']]]) {
    const ctx = await b.newContext({ ...opt, deviceScaleFactor: name === 'desktop' ? 2 : undefined }); const p = await ctx.newPage();
    await ctx.route(/pollinations\.ai/, r => r.abort());
    p.on('pageerror', e => errs.push(name + ' ' + e.message)); p.on('console', m => m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text()) && errs.push(name + ' ' + m.text()));
    const t0 = Date.now();
    await p.goto('file://' + __dirname + '/../dist/dossier.html#DEMO1.NL..M');
    await p.waitForFunction(() => document.querySelectorAll('.scan canvas').length === 10, null, { timeout: 180000 });
    console.log(name, 'ten prints in', ((Date.now() - t0) / 1000).toFixed(1), 's; gpu', await p.evaluate(() => Vinger.Gabor.gpu), '|', await p.textContent('#mintotal'));
    const pg = p.locator('.page').nth(1); await pg.scrollIntoViewIfNeeded();
    await pg.screenshot({ path: `${out}/v-${name}.png` });
    await ctx.close();
  }
  console.log('errors', errs.length ? errs : 'none'); await b.close();
})();
