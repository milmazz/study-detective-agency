/*
  Shared runtime for the lesson-video scenes (tools/video/videos/<name>/video.html).

  Loaded as a classic script after build/timeline.js and before the video's
  own script. The video's script defines the globals this file reads at call
  time:
    C         palette (ink, muted, line, accent, pop, ...)
    SPEAKERS  { speakerId: { name, color } } for the caption chip
    VIDEO     { titles: {sceneNumber: 'chip text'}, icon: '⚡', label: 'top-right text' }
  and then calls runVideo({ scenes, background, bg, defs?, overlay? }).

  Everything is a pure function of t (seconds): seek(t) rebuilds the whole
  SVG for that instant, which is what lets render.cjs capture frames in any
  order, split across workers, and get the same video every time.
*/

/* ---------- timing ---------- */
const TL = window.TL, FPS = TL.fps;
const L = Object.fromEntries(TL.lines.map(l => [l.id, l]));
const S = id => L[id].start, E = id => L[id].start + L[id].dur;          // line start / end
const norm = w => w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9']/g, '');
/* Time the nth word of line `id` starting with `prefix` is spoken (accents and punctuation ignored). */
function W(id, prefix, n = 0){ const ws = L[id].words.filter(w => norm(w.w).startsWith(prefix)); const w = ws[n] || ws[0]; if (!w) throw new Error(`no word ${prefix} in ${id}`); return w.s; }
const SC = k => TL.scenes[k];                                              // scene start
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const backOut = x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const pop = (t, a, d = .4) => { const p = prog(t, a, a + d); return p <= 0 ? 0 : backOut(p); };   // 0 -> overshoot -> 1
const fade = (t, a, b, d = .3) => Math.min(prog(t, a, a + d), 1 - prog(t, b - d, b));          // in at a, out by b
const lerp = (a, b, p) => a + (b - a) * p;
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const until = (t, b) => t < b ? 1 : 0;

/* Mouth openness 0..1 for a speaker at t, from the narration's loudness envelope. */
function mouthAt(spk, t){
  for (const l of TL.lines) if (l.speaker === spk && t >= l.start && t < l.start + l.dur) return l.mouth[Math.floor((t - l.start) * FPS)] || 0;
  return 0;
}

/* ---------- drawing primitives ---------- */
function txt(x, y, s, size, o = {}){
  return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${o.w || 700}" fill="${o.fill || C.ink}" text-anchor="${o.anchor || 'middle'}" ${o.op != null ? `opacity="${o.op}"` : ''}>${esc(s)}</text>`;
}
function pill(cx, cy, s, size, bg, fg, sc = 1, op = 1){
  if (sc <= 0 || op <= 0) return '';
  const w = s.length * size * .52 + size * 1.4, h = size * 1.7;
  return `<g transform="translate(${cx} ${cy}) scale(${sc})" opacity="${op}"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="${h/2}" fill="${bg}" stroke="${C.ink}" stroke-width="3"/>${txt(0, size * .35, s, size, {fill: fg})}</g>`;
}
function banner(cx, cy, s, size, sc){
  if (sc <= 0) return '';
  const w = s.length * size * .5 + size * 2, h = size * 2;
  return `<g transform="translate(${cx} ${cy}) scale(${sc}) rotate(-2)"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="18" fill="${C.pop}" stroke="${C.ink}" stroke-width="4"/>${txt(0, size * .35, s, size, {w: 800})}</g>`;
}
function wrap(s, max){ const out = []; let cur = ''; for (const w of s.split(' ')){ if ((cur + ' ' + w).trim().length > max && cur){ out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); } if (cur) out.push(cur); return out; }
function burst(cx, cy, r, sc, fill = C.pop){
  if (sc <= 0) return '';
  const pts = Array.from({length: 20}, (_, i) => { const a = i / 20 * Math.PI * 2, rr = i % 2 ? r * .55 : r; return `${cx + Math.cos(a) * rr * sc},${cy + Math.sin(a) * rr * sc}`; }).join(' ');
  return `<polygon points="${pts}" fill="${fill}" stroke="${C.ink}" stroke-width="3"/>`;
}
function card(cx, cy, w, h, sc, inner, o = {}){
  if (sc <= 0) return '';
  return `<g transform="translate(${cx} ${cy}) scale(${sc})" opacity="${o.op ?? 1}"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="22" fill="${o.bg || '#fff'}" stroke="${o.stroke || C.ink}" stroke-width="4"/>${inner}</g>`;
}
/* Speech bubble; `crossed` (0..1) draws a red X over it. */
function bubble(cx, cy, s, size, sc, crossed){
  if (sc <= 0) return '';
  const w = s.length * size * .52 + size * 2, h = size * 2.2;
  return `<g transform="translate(${cx} ${cy}) scale(${sc})"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="${h/2}" fill="#fff" stroke="${C.ink}" stroke-width="3.5"/><path d="M${w*.15} ${h/2 - 2}l14 22l6 -24" fill="#fff" stroke="${C.ink}" stroke-width="3.5" stroke-linejoin="round"/><rect x="${w*.15 - 2}" y="${h/2 - 8}" width="24" height="8" fill="#fff"/>${txt(0, size * .35, s, size, {w: 800, fill: C.muted})}
    ${crossed ? `<g stroke="${C.oops}" stroke-width="10" stroke-linecap="round" transform="scale(${crossed})"><line x1="${-w*.35}" y1="${-h*.6}" x2="${w*.35}" y2="${h*.6}"/><line x1="${w*.35}" y1="${-h*.6}" x2="${-w*.35}" y2="${h*.6}"/></g>` : ''}</g>`;
}
/* A row of round emoji badges, each popping in at its own time: items = [[emoji, label, atTime], ...]. */
function emojiRow(cx, cy, items, t, gap = 170){
  return items.map(([e, label, at], i) => { const sc = pop(t, at); if (sc <= 0) return ''; const x = cx + (i - (items.length - 1) / 2) * gap;
    return `<g transform="translate(${x} ${cy}) scale(${sc})"><circle r="56" fill="#fff" stroke="${C.ink}" stroke-width="3.5"/>${txt(0, 18, e, 50)}${txt(0, 92, label, 26)}</g>`; }).join('');
}
function check(x, y, sc){ return sc > 0 ? `<g transform="translate(${x} ${y}) scale(${sc})"><circle r="20" fill="${C.good}" stroke="${C.ink}" stroke-width="3"/><path d="M-9 0l6 7l12 -13" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>` : ''; }

/* ---------- captions (word-by-word highlight) ---------- */
const CHUNKS = {};
for (const l of TL.lines){
  const ch = []; let cur = [];
  const flush = () => { if (cur.length) ch.push(cur); cur = []; };
  l.words.forEach(w => {
    cur.push(w);
    const len = cur.map(x => x.w).join(' ').length;
    if (/[.!?]$/.test(w.w) && len > 20) flush();
    else if (len > 92){ const ci = cur.map(x => /,$/.test(x.w)).lastIndexOf(true); if (ci > 3 && ci < cur.length - 1){ const rest = cur.splice(ci + 1); flush(); cur = rest; } else flush(); }
  });
  flush(); CHUNKS[l.id] = ch;
}
function captions(t){
  const l = TL.lines.find(l => t >= l.start - .05 && t < l.start + l.dur + .45);
  if (!l) return '';
  const ch = CHUNKS[l.id]; let k = 0;
  for (let i = 0; i < ch.length; i++) if (t >= ch[i][0].s - .05) k = i;
  const words = ch[k];
  let cur = -1; words.forEach((w, i) => { if (t >= w.s) cur = i; });
  const lines = []; let line = [], n = 0;
  words.forEach((w, i) => { if (n + w.w.length > 54 && line.length){ lines.push(line); line = []; n = 0; } line.push([w, i]); n += w.w.length + 1; });
  lines.push(line);
  const spk = SPEAKERS[l.speaker] || {name: l.speaker, color: C.accent};
  const name = spk.name, col = spk.color;
  const y0 = lines.length > 1 ? 652 : 668;
  const body = lines.map((ln, j) => `<text x="210" y="${y0 + j * 38}" font-size="31" font-weight="600">${ln.map(([w, i]) =>
    `<tspan fill="${i === cur ? col : C.ink}" ${i === cur ? 'font-weight="800"' : ''} ${i > cur ? 'opacity=".55"' : ''}>${esc(w.w)} </tspan>`).join('')}</text>`).join('');
  return `<g><rect x="40" y="612" width="1200" height="96" rx="22" fill="#fff" stroke="${C.line}" stroke-width="3"/>
    <rect x="58" y="642" width="130" height="38" rx="19" fill="${col}"/>${txt(123, 670, name, 24, {fill: '#fff', w: 800})}${body}</g>`;
}

/* ---------- top chrome: scene chip (left) + lesson name (right) ---------- */
function chrome(t, sc){
  const title = VIDEO.titles[sc];
  return `<rect x="24" y="20" width="${title.length * 13.2 + 56}" height="46" rx="23" fill="#fff" stroke="${C.line}" stroke-width="3"/>
  <text x="48" y="51" font-size="24" font-weight="800" fill="${C.accent}">${VIDEO.icon} ${esc(title)}</text>
  <text x="1250" y="51" font-size="22" font-weight="700" fill="${C.muted}" text-anchor="end">${esc(VIDEO.label)}</text>`;
}

/* ---------- frame loop ----------
   opts.scenes      {sceneNumber: t => svgString}
   opts.background  () => svgString, drawn first
   opts.bg          page colour, used for scene cross-fades and the final fade
   opts.defs        optional <defs> markup (markers etc.)
   opts.overlay     optional t => svgString drawn over everything (e.g. an intro fade) */
function runVideo(opts){
  const SCN = Object.keys(TL.scenes).map(Number).sort((a, b) => a - b);
  const END = TL.total;
  const sceneAt = t => { let k = SCN[0]; for (const n of SCN) if (t >= TL.scenes[n]) k = n; return k; };
  window.seek = t => {
    const k = sceneAt(t);
    let s = opts.background() + (opts.defs || '') + chrome(t, k) + opts.scenes[k](t) + captions(t);
    for (const n of SCN.slice(1)){ const d = Math.abs(t - TL.scenes[n]); if (d < .3) s += `<rect width="1280" height="720" fill="${opts.bg}" opacity="${1 - d / .3}"/>`; }
    if (opts.overlay) s += opts.overlay(t);
    const endFade = prog(t, END + 1.2, END + 2.2);
    if (endFade > 0) s += `<rect width="1280" height="720" fill="${opts.bg}" opacity="${endFade}"/>`;
    document.getElementById('v').innerHTML = s;
  };
  window.DURATION = END + 2.4;
}
