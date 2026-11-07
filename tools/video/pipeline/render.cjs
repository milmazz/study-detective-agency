// Render frames [from, to) of <video-dir>/video.html into an H.264 segment.
//   node render.cjs <video-dir> <from> <to> <out.mp4>
// make.sh runs several of these in parallel and joins the segments; every
// frame is seek(frame / fps), so the split never changes the result.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
(async () => {
  const [dir, from, to, out] = [path.resolve(process.argv[2]), Number(process.argv[3]), Number(process.argv[4]), process.argv[5]];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('file://' + path.join(dir, 'video.html')); await p.evaluate(() => document.fonts.ready);
  const fps = await p.evaluate(() => TL.fps);
  // Near-lossless intermediate; make.sh does the one final (smaller) encode.
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = from; f < to; f++){
    await p.evaluate(t => seek(t), f / fps);
    const buf = await p.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close();
})();
