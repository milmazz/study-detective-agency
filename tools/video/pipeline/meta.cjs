// Ask a video page for its duration and sound-effect cues -> <video-dir>/build/meta.json.
//   node meta.cjs <video-dir>
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const dir = path.resolve(process.argv[2]);
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(dir, 'video.html'));
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  const m = await p.evaluate(() => ({ dur: DURATION, fps: TL.fps, sfx: SFX() }));
  fs.writeFileSync(path.join(dir, 'build', 'meta.json'), JSON.stringify(m));
  console.log(`video: ${m.dur.toFixed(1)}s, ${Math.ceil(m.dur * m.fps)} frames, ${m.sfx.length} sound cues`);
  await b.close();
})();
