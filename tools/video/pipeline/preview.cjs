// Screenshot <video-dir>/video.html at the given times (seconds) -> <out-dir>/f_<time>.png.
//   node preview.cjs <video-dir> <out-dir> <t1> [t2 ...]
// Reports any page errors. make.sh's `preview` command tiles the result.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [dir, out, ...ts] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('file://' + path.join(path.resolve(dir), 'video.html')); await p.evaluate(() => document.fonts.ready);
  for (const t of ts.map(Number)){
    await p.evaluate(t => seek(t), t);
    await p.screenshot({ path: path.join(out, `f_${t.toFixed(2).padStart(8, '0')}.png`) });
  }
  if (errs.length){ console.error('page errors:\n' + errs.join('\n')); process.exitCode = 1; }
  await b.close();
})();
