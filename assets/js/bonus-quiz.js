/*
  Quiz engine for the bonus study pages (Mochi's Energy Lab, Pepita's Texas
  Trail). These are not detective case files: each page pairs a hands-on
  Learn section with a fixed, hand-written quiz, so they run on this small
  engine instead of DetectiveGame.

  Importing this module has no side effects; a page calls start(config) from
  its one inline module script. The config is the page's content module
  (assets/js/*-content.js): questions, tags, mascot, copy, and setupLearn()
  for the page's own Learn-section interactives.

  It deliberately exports no `modes` array, so the DetectiveGame wiring tests
  in test/question-modules.test.js treat it as a non-game module.
*/
export function start(P){
const Q = P.questions;
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LET = 'ABCDEFGH';
const strip = s => String(s).replace(/<[^>]*>/g, '');
const pick = a => a[Math.floor(Math.random() * a.length)];

let S = { cur: 0, res: {} };
try { const raw = localStorage.getItem(P.key); if (raw) { const o = JSON.parse(raw); if (o && o.res) S = o; } } catch (e) {}
if (!(S.cur >= 0 && S.cur < Q.length)) S.cur = 0;
function save(){ try { localStorage.setItem(P.key, JSON.stringify(S)); } catch (e) {} }
function R(q){ return S.res[q.id] || (S.res[q.id] = { tries: 0, solved: false, first: false, revealed: false }); }
let W = null;

/* ---------- views ---------- */
const VIEWS = ['learn', 'quiz', 'report'];
function show(v){
  VIEWS.forEach(n => {
    $('#view-' + n).hidden = n !== v;
    const t = $('#tab-' + n); if (t) t.setAttribute('aria-current', n === v ? 'page' : 'false');
  });
  if (v === 'quiz') renderQ();
  if (v === 'report') renderReport();
  updateStars();
}
function route(){
  const h = (location.hash || '').slice(1);
  if (VIEWS.includes(h)) { show(h); window.scrollTo(0, 0); return; }
  show('learn');
  if (h) { const el = document.getElementById(h); if (el) el.scrollIntoView({ block: 'start' }); }
}
window.addEventListener('hashchange', route);

function updateStars(){
  const scored = Q.filter(q => q.type !== 'write');
  const n = scored.filter(q => S.res[q.id] && S.res[q.id].first).length;
  const el = $('#starcount'); if (el) el.textContent = n + ' of ' + scored.length;
}

/* ---------- quiz ---------- */
function shuffledOrder(n){
  const a = [...Array(n).keys()];
  do { for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }
  while (n > 1 && a.every((v, i) => v === i));
  return a;
}

function renderQ(){
  const q = Q[S.cur], r = R(q);
  W = { sel: new Set(), sort: [], order: [], pool: q.type === 'order' ? shuffledOrder(q.items.length) : [] };
  let body = '';
  if (q.type === 'mc' || q.type === 'multi') {
    const n = q.type === 'multi' ? q.answers.length : 1;
    body = `<p class="howto">${n > 1 ? 'Pick ' + n + ' answers.' : 'Pick 1 answer.'} Tap ✕ to cross out a choice you think is wrong.</p>
    <div class="opts">` + q.opts.map((o, i) => `<div class="opt" data-i="${i}">
      <button class="pick" type="button" aria-pressed="false"><span class="let">${LET[i]}</span><span class="otext">${o}</span></button>
      <button class="x" type="button" aria-label="Cross out choice ${LET[i]}" title="Cross out">✕</button></div>`).join('') + '</div>';
  } else if (q.type === 'sort') {
    body = `<p class="howto">Choose an answer for every row.</p><div class="sort">` + q.items.map((it, i) => `<div class="srow" data-i="${i}">
      <span class="stext">${it.t}</span>
      <span class="sbtns" role="group" aria-label="${strip(it.t).replace(/"/g, '')}">` +
      q.labels.map((l, j) => `<button type="button" class="sbtn" data-j="${j}" aria-pressed="false">${l}</button>`).join('') +
      `</span></div>`).join('') + '</div>';
  } else if (q.type === 'order') {
    body = `<p class="howto">Tap the cards in order, first to last. Tap a placed card to send it back.</p>
    <ol class="slots" id="slots"></ol><div class="pool" id="pool"></div>`;
  } else if (q.type === 'write') {
    body = `<label class="wlabel" for="wta">Your answer</label>
    <textarea id="wta" rows="5" placeholder="Write it the way you would on the test."></textarea>
    <div class="checklist"><p>Before you check, did you…</p>${q.checklist.map(c => `<label class="ck"><input type="checkbox"> <span>${c}</span></label>`).join('')}</div>`;
  }
  $('#qbox').innerHTML = `<div class="qhead"><span class="qnum">Question ${S.cur + 1} of ${Q.length}</span><span class="chip">${P.tags[q.tag].name}</span></div>
    ${q.scene ? `<div class="scene">${q.scene}</div>` : ''}
    <h2 class="qtext" id="qtext" tabindex="-1">${q.q}</h2>${body}
    <div class="fb" id="fb" aria-live="polite"></div>
    <div class="qact"><button class="btn primary" id="check" type="button">${q.type === 'write' ? 'Show a strong answer' : 'Check my answer'}</button></div>
    <div class="explain" id="explain" hidden></div>`;
  wire(q);
  if (r.solved) showSolved(q, r, false);
  renderDots(); navState();
}

function wire(q){
  const box = $('#qbox');
  if (q.type === 'mc' || q.type === 'multi') {
    $$('.opt', box).forEach(op => {
      const i = +op.dataset.i, pb = $('.pick', op), xb = $('.x', op);
      pb.addEventListener('click', () => {
        if (R(q).solved) return;
        if (op.classList.contains('crossed')) toggleCross(op, false);
        if (q.type === 'mc') { W.sel = new Set([i]); }
        else if (W.sel.has(i)) W.sel.delete(i);
        else {
          if (W.sel.size >= q.answers.length) { fb(`You already picked ${q.answers.length}. Tap one of your picks to unpick it first.`, 'info'); return; }
          W.sel.add(i);
        }
        $$('.opt', box).forEach(o => { const on = W.sel.has(+o.dataset.i); o.classList.toggle('on', on); $('.pick', o).setAttribute('aria-pressed', on); });
        fb('', '');
      });
      xb.addEventListener('click', () => { if (!R(q).solved) toggleCross(op, !op.classList.contains('crossed')); });
    });
  }
  if (q.type === 'sort') {
    $$('.srow', box).forEach(row => {
      const i = +row.dataset.i;
      $$('.sbtn', row).forEach(b => b.addEventListener('click', () => {
        if (R(q).solved) return;
        W.sort[i] = +b.dataset.j;
        $$('.sbtn', row).forEach(x => x.setAttribute('aria-pressed', x === b));
        row.classList.remove('miss');
        fb('', '');
      }));
    });
  }
  if (q.type === 'order') drawOrder(q);
  if (q.type === 'write') {
    const ta = $('#wta'), r = R(q);
    ta.value = r.text || '';
    ta.addEventListener('input', () => { R(q).text = ta.value; save(); });
  }
  $('#check').addEventListener('click', () => check(q));
}

function toggleCross(op, on){
  op.classList.toggle('crossed', on);
  const i = +op.dataset.i, xb = $('.x', op);
  xb.textContent = on ? '↺' : '✕';
  xb.setAttribute('aria-label', (on ? 'Bring back choice ' : 'Cross out choice ') + LET[i]);
  xb.title = on ? 'Bring back' : 'Cross out';
  if (on && W.sel.has(i)) { W.sel.delete(i); op.classList.remove('on'); $('.pick', op).setAttribute('aria-pressed', 'false'); }
}

function drawOrder(q, locked){
  const slots = $('#slots'), pool = $('#pool');
  slots.innerHTML = q.items.map((_, k) => {
    const it = W.order[k];
    return it === undefined ? `<li class="slot empty"><span class="sn">${k + 1}</span><span class="st">…</span></li>`
      : `<li class="slot"><button type="button" class="placed" data-k="${k}" ${locked ? 'disabled' : ''}><span class="sn">${k + 1}</span><span class="st">${q.items[it]}</span></button></li>`;
  }).join('');
  pool.innerHTML = W.pool.filter(i => !W.order.includes(i)).map(i => `<button type="button" class="card-chip" data-i="${i}" ${locked ? 'disabled' : ''}>${q.items[i]}</button>`).join('');
  if (locked) return;
  $$('.card-chip', pool).forEach(b => b.addEventListener('click', () => { W.order.push(+b.dataset.i); drawOrder(q); fb('', ''); }));
  $$('.placed', slots).forEach(b => b.addEventListener('click', () => { W.order.splice(+b.dataset.k, 1); drawOrder(q); fb('', ''); }));
}

function grade(q){
  if (q.type === 'mc') { if (!W.sel.size) return { need: 'Pick an answer first.' }; return { ok: W.sel.has(q.answer) }; }
  if (q.type === 'multi') {
    const n = q.answers.length;
    if (W.sel.size !== n) return { need: `Pick ${n} answers before you check.` };
    const right = q.answers.filter(a => W.sel.has(a)).length;
    return { ok: right === n, note: right ? `${right} of your ${n} picks ${right === 1 ? 'is' : 'are'} right.` : 'Neither pick is right yet.' };
  }
  if (q.type === 'sort') {
    for (let i = 0; i < q.items.length; i++) if (W.sort[i] === undefined) return { need: 'Choose an answer for every row first.' };
    const wrong = q.items.filter((it, i) => W.sort[i] !== it.a).length;
    return { ok: !wrong, note: `${wrong} ${wrong === 1 ? 'row needs' : 'rows need'} another look.` };
  }
  if (q.type === 'order') {
    if (W.order.length < q.items.length) return { need: 'Place every card first.' };
    const inPlace = W.order.filter((v, i) => v === i).length;
    return { ok: inPlace === q.items.length, note: `${inPlace} of ${q.items.length} cards are in the right spot.` };
  }
  return { ok: true };
}

function check(q){
  const r = R(q);
  if (r.solved) return;
  if (q.type === 'write') { r.solved = true; r.write = true; save(); showSolved(q, r, true); return; }
  const g = grade(q);
  if (g.need) { fb(g.need, 'info'); return; }
  r.tries++;
  if (g.ok) { r.solved = true; r.first = r.tries === 1; save(); showSolved(q, r, true); }
  else if (r.tries >= 2) { r.solved = true; r.first = false; r.revealed = true; save(); showSolved(q, r, true); }
  else {
    save();
    fb(`<div class="fbrow">${P.mascot('think')}<div><strong>${pick(P.oops)}</strong> ${g.note || ''}<br>${q.hint ? 'Hint: ' + q.hint : ''}<br><em>You get one more try.</em></div></div>`, 'oops');
  }
  updateStars(); renderDots();
}

function showSolved(q, r, live){
  const box = $('#qbox');
  if (q.type === 'mc' || q.type === 'multi') {
    const ans = q.type === 'mc' ? [q.answer] : q.answers;
    $$('.opt', box).forEach(op => {
      const i = +op.dataset.i;
      op.classList.add('locked');
      $('.pick', op).disabled = true; $('.x', op).disabled = true;
      if (ans.includes(i)) op.classList.add('correct');
      else if (W.sel.has(i)) op.classList.add('wrong');
    });
  }
  if (q.type === 'sort') {
    $$('.srow', box).forEach((row, i) => {
      const a = q.items[i].a;
      $$('.sbtn', row).forEach(b => { b.disabled = true; const j = +b.dataset.j; b.setAttribute('aria-pressed', j === a); b.classList.toggle('right', j === a); });
      if (W.sort[i] !== undefined && W.sort[i] !== a) row.classList.add('was-wrong');
    });
  }
  if (q.type === 'order') { W.order = q.items.map((_, i) => i); drawOrder(q, true); $('.howto', box) && ($('.howto', box).hidden = true); }
  if (q.type === 'write') { $$('.ck input', box).forEach(c => c.disabled = false); }

  let msg;
  if (q.type === 'write') msg = `<div class="fbrow">${P.mascot('happy')}<div><strong>Compare your answer with this one.</strong> Does yours say the same big idea and give an example?</div></div>`;
  else if (r.revealed) msg = `<div class="fbrow">${P.mascot('think')}<div><strong>Here's the answer.</strong> Read the why below, and this one will be easier next time.</div></div>`;
  else msg = `<div class="fbrow">${P.mascot('happy')}<div><strong>${live ? pick(P.cheers) : 'Solved!'}</strong> ${r.first ? '⭐ First try!' : 'You got it on try two.'}</div></div>`;
  fb(msg, r.revealed ? 'oops' : 'good');

  const ex = $('#explain');
  ex.innerHTML = `<h3>${q.type === 'write' ? 'A strong answer' : 'Why?'}</h3>${q.explain}`;
  ex.hidden = false;
  const c = $('#check');
  c.textContent = S.cur < Q.length - 1 ? 'Next question' : 'See my report card';
  const clone = c.cloneNode(true); c.replaceWith(clone);
  clone.addEventListener('click', () => go(S.cur + 1));
  if (live && !r.revealed && q.type !== 'write') confetti(clone);
}

function fb(html, kind){ const el = $('#fb'); if (!el) return; el.className = 'fb' + (kind ? ' ' + kind : ''); el.innerHTML = html; }

function go(i){
  if (i >= Q.length) { location.hash = 'report'; return; }
  if (i < 0) return;
  S.cur = i; save(); renderQ();
  const t = $('#qtext'); if (t) t.focus({ preventScroll: true });
  $('#quiztop').scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
}

function renderDots(){
  $('#dots').innerHTML = Q.map((q, i) => {
    const r = S.res[q.id] || {};
    const st = !r.solved ? '' : q.type === 'write' ? 'wr' : r.first ? 'star' : r.revealed ? 'rev' : 'done';
    const label = `Question ${i + 1}${st === 'star' ? ', first try' : st === 'done' ? ', solved' : st === 'rev' ? ', answer shown' : st === 'wr' ? ', written' : ''}`;
    return `<button type="button" class="dot ${st} ${i === S.cur ? 'cur' : ''}" data-i="${i}" aria-label="${label}" ${i === S.cur ? 'aria-current="step"' : ''}>${st === 'star' ? '★' : i + 1}</button>`;
  }).join('');
  $$('#dots .dot').forEach(d => d.addEventListener('click', () => go(+d.dataset.i)));
}
function navState(){ $('#prev').disabled = S.cur === 0; $('#next').textContent = S.cur === Q.length - 1 ? 'Report card' : 'Skip ahead'; }

/* ---------- report ---------- */
function renderReport(){
  const scored = Q.filter(q => q.type !== 'write');
  const solved = scored.filter(q => (S.res[q.id] || {}).solved).length;
  const stars = scored.filter(q => (S.res[q.id] || {}).first).length;
  const left = Q.filter(q => !(S.res[q.id] || {}).solved);
  const pct = scored.length ? stars / scored.length : 0;
  const head = solved < scored.length && !stars ? P.report.start
    : pct >= .9 ? P.report.great : pct >= .7 ? P.report.good : P.report.keep;
  const rows = Object.keys(P.tags).map(t => {
    const qs = scored.filter(q => q.tag === t); if (!qs.length) return '';
    const s = qs.filter(q => (S.res[q.id] || {}).first).length;
    const d = qs.filter(q => (S.res[q.id] || {}).solved).length;
    const status = d < qs.length ? 'Not finished' : s === qs.length ? 'Got it!' : s >= qs.length / 2 ? 'Almost' : 'Review this';
    const cls = d < qs.length ? 'todo' : s === qs.length ? 'ok' : s >= qs.length / 2 ? 'mid' : 'low';
    return `<tr class="${cls}"><th scope="row">${P.tags[t].name}</th><td>${'★'.repeat(s)}<span class="dim">${'☆'.repeat(qs.length - s)}</span></td><td><span class="pill ${cls}">${status}</span></td>
      <td>${cls !== 'ok' && cls !== 'todo' ? `<a href="#${P.tags[t].link}">Review</a>` : ''}</td></tr>`;
  }).join('');
  $('#reportbox').innerHTML = `<div class="rhead">${P.mascot(pct >= .7 ? 'happy' : 'idle')}<div>
      <p class="big">${stars} <span>of ${scored.length} stars</span></p><p class="rmsg">${head}</p></div></div>
    <p class="small">A star means right on the first try. ${left.length ? `${left.length} question${left.length > 1 ? 's' : ''} still to do.` : 'Every question is done.'}</p>
    <div class="tablewrap"><table class="rtable"><thead><tr><th scope="col">Topic</th><th scope="col">Stars</th><th scope="col">How it went</th><th scope="col"><span class="vh">Link</span></th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="ractions">
      ${left.length ? `<button class="btn primary" id="resume" type="button">Finish the quiz</button>` : ''}
      <button class="btn" id="reset" type="button">Start over</button></div>`;
  const rs = $('#resume'); if (rs) rs.addEventListener('click', () => { S.cur = Q.indexOf(left[0]); save(); location.hash = 'quiz'; });
  $('#reset').addEventListener('click', () => {
    if (confirm('Start the quiz over? Your stars will be cleared.')) { S = { cur: 0, res: {} }; save(); location.hash = 'quiz'; }
  });
}

/* ---------- confetti ---------- */
function confetti(anchor){
  if (reduce) return;
  const r = anchor.getBoundingClientRect();
  for (let i = 0; i < 22; i++) {
    const s = document.createElement('span');
    s.className = 'conf';
    s.textContent = i % 4 === 0 ? P.confettiEmoji : '';
    s.style.left = (r.left + r.width / 2) + 'px'; s.style.top = (r.top + r.height / 2) + 'px';
    s.style.setProperty('--dx', (Math.random() * 260 - 130) + 'px');
    s.style.setProperty('--dy', (-Math.random() * 180 - 40) + 'px');
    s.style.setProperty('--rot', (Math.random() * 540 - 270) + 'deg');
    s.style.background = i % 4 === 0 ? 'transparent' : P.confetti[i % P.confetti.length];
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1100);
  }
}

/* ---------- shared learn helpers ---------- */
$$('[data-flip]').forEach(b => b.addEventListener('click', () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); b.classList.toggle('flipped', on); }));

/* one-at-a-time sorter: <div class="sorter" data-sorter="name"> */
$$('[data-sorter]').forEach(el => {
  const cfg = P.sorters[el.dataset.sorter]; let i = 0, right = 0;
  function draw(){
    if (i >= cfg.items.length) {
      el.innerHTML = `<p class="sorter-done">${right} of ${cfg.items.length} right on the first tap. ${right === cfg.items.length ? 'Perfect!' : 'Nice work. Try it again to beat your score.'}</p><button type="button" class="btn small-btn">Play again</button>`;
      el.querySelector('button').addEventListener('click', () => { i = 0; right = 0; draw(); });
      return;
    }
    const it = cfg.items[i];
    el.innerHTML = `<p class="sorter-count">${i + 1} of ${cfg.items.length}</p><p class="sorter-item"><span class="sorter-emoji" aria-hidden="true">${it.e || ''}</span>${it.t}</p>
      <div class="sorter-btns">${cfg.labels.map((l, j) => `<button type="button" class="btn sbig" data-j="${j}">${l}</button>`).join('')}</div><p class="sorter-fb" aria-live="polite"></p>`;
    let tried = false;
    $$('.sbig', el).forEach(b => b.addEventListener('click', () => {
      const ok = +b.dataset.j === it.a, f = $('.sorter-fb', el);
      if (ok) {
        if (!tried) right++;
        f.innerHTML = `<strong>Yes!</strong> ${it.why}`; f.className = 'sorter-fb good';
        $$('.sbig', el).forEach(x => x.disabled = true);
        const nb = document.createElement('button'); nb.type = 'button'; nb.className = 'btn primary small-btn'; nb.textContent = i < cfg.items.length - 1 ? 'Next one' : 'See my score';
        nb.addEventListener('click', () => { i++; draw(); }); f.after(nb); nb.focus();
      } else { tried = true; f.innerHTML = `<strong>Not that one.</strong> Think about it and try the other choice.`; f.className = 'sorter-fb oops'; b.disabled = true; }
    }));
  }
  draw();
});

/* tap-in-order mini game: <div data-orderer="name"> */
$$('[data-orderer]').forEach(el => {
  const cfg = P.orderers[el.dataset.orderer];
  let placed = [], pool;
  function reset(){ placed = []; pool = shuffledOrder(cfg.items.length); draw(); }
  function draw(){
    const done = placed.length === cfg.items.length;
    el.innerHTML = `<ol class="slots">${cfg.items.map((_, k) => placed[k] === undefined ? `<li class="slot empty"><span class="sn">${k + 1}</span><span class="st">…</span></li>` : `<li class="slot"><span class="placed static"><span class="sn">${k + 1}</span><span class="st">${cfg.items[placed[k]]}</span></span></li>`).join('')}</ol>
      <div class="pool">${pool.filter(i => !placed.includes(i)).map(i => `<button type="button" class="card-chip" data-i="${i}">${cfg.items[i]}</button>`).join('')}</div>
      <p class="sorter-fb ${done ? 'good' : ''}" aria-live="polite">${done ? cfg.done : ''}</p>${done ? '<button type="button" class="btn small-btn">Mix them up again</button>' : ''}`;
    $$('.card-chip', el).forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      if (i === placed.length) { placed.push(i); draw(); if (placed.length === cfg.items.length) confetti(el.querySelector('.slots')); }
      else { const f = $('.sorter-fb', el); f.className = 'sorter-fb oops'; f.innerHTML = `<strong>Not yet.</strong> ${cfg.hint}`; b.classList.add('shake'); setTimeout(() => b.classList.remove('shake'), 400); }
    }));
    const again = $('.small-btn', el); if (again) again.addEventListener('click', reset);
  }
  reset();
});

$('#prev').addEventListener('click', () => go(S.cur - 1));
$('#next').addEventListener('click', () => go(S.cur + 1));
if (typeof P.setupLearn === 'function') P.setupLearn();
route();
}

export default { start };
