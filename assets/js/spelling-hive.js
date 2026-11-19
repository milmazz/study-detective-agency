/*
  Engine for Honey's Spelling Hive (games/ela/spelling-hive.html), spelling
  bee practice for the class bee.

  Not a DetectiveGame case file and not on bonus-quiz.js: a spelling drill is
  a different loop (hear a word, ask for help, type it, missed words come
  back), so this page carries its own small engine. The words live in
  spelling-hive-words.js; the page imports both and calls start(words).

  The pure helpers are named exports so test/spelling-hive.test.js can pin
  what counts as right. Importing this module has no side effects: start()
  is the only thing that touches the page.

  Three views, routed by hash like the other bonus pages:
    #study     every word with its meaning, a sentence and its tricky part
    #practice  10-word rounds; Honey says the word, the kid asks for help
               the way a real speller can, types it; a miss is locked in by
               typing it once, then the word buzzes back a few words later
    #beeday    the bee's own order from word 76, one try each, and a best
               run to beat
  A word goes into the hive (🍯) when it is spelled right on the first try.
  Nothing is ever taken back out.
*/

/* ---------------- pure helpers ---------------- */

export function normalize(s){
  return String(s == null ? '' : s).normalize('NFC').replace(/[‘’]/g, "'").trim().replace(/\s+/g, ' ').toLowerCase();
}

export function spellings(w){ return [w.word, ...(w.alts || [])]; }

export function isCorrect(w, typed){
  const t = normalize(typed);
  return !!t && spellings(w).some((s) => normalize(s) === t);
}

const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* The sentence is spoken whole but shown with the word blanked, so reading
   it never shows the spelling. */
export function blankWord(text, w){
  let out = String(text);
  for (const s of spellings(w).sort((a, b) => b.length - a.length)) {
    out = out.replace(new RegExp(`(^|[^A-Za-z])${reEsc(s)}(?![A-Za-z])`, 'gi'), '$1_____');
  }
  return out;
}

/* One { ch, ok } per letter of the answer; ok is false for the letters her
   spelling missed (outside the longest common subsequence). Walking forward
   over a suffix table, and preferring to skip an answer letter on a tie,
   marks the later of two doubled letters: "lulaby" misses lul[l]aby. */
export function letterDiff(typed, answer){
  const a = [...String(answer)], al = a.map((c) => c.toLowerCase()), t = [...normalize(typed)];
  const m = al.length, n = t.length;
  const L = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) {
    L[i][j] = al[i] === t[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  }
  const ok = new Array(m).fill(false);
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (al[i] === t[j]) { ok[i] = true; i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }
  return a.map((ch, k) => ({ ch, ok: ok[k] }));
}

function shuffled(arr, rand){
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* A round: words not yet in the hive first, then hive words to fill it. */
export function pickRound(words, mastered, size, rand = Math.random){
  const fresh = shuffled(words.filter((w) => !mastered.has(w.n)), rand);
  const done = shuffled(words.filter((w) => mastered.has(w.n)), rand);
  return [...fresh, ...done].slice(0, size);
}

/* macOS ships joke voices (Bubbles, Zarvox...) tagged en-US. */
const NOVELTY = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox/i;
const NICE = /Samantha|Google US English|Enhanced|Premium|Natural/i;
export function pickVoice(voices){
  const en = (voices || []).filter((v) => /^en\b|^en[-_]/i.test(v.lang || '') && !NOVELTY.test(v.name || ''));
  const us = en.filter((v) => /^en[-_]US/i.test(v.lang));
  return us.find((v) => NICE.test(v.name)) || us.find((v) => v.default) || us[0] || en[0] || null;
}

/* ---------------- Honey the bee ---------------- */

let beeId = 0;
export function beeSVG(mood){
  const L = 'var(--beeline)', id = 'beeclip' + (++beeId);
  const eyes = mood === 'happy' || mood === 'cheer'
    ? `<path d="M40 64q6-7 12 0M68 64q6-7 12 0" stroke="${L}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : mood === 'oops'
    ? `<circle cx="46" cy="65" r="5.5" fill="${L}"/><circle cx="74" cy="65" r="5.5" fill="${L}"/><circle cx="47.5" cy="63.5" r="1.8" fill="#fff"/><circle cx="75.5" cy="63.5" r="1.8" fill="#fff"/><path d="M38 54l12 3M82 54l-12 3" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`
    : `<circle cx="46" cy="65" r="6" fill="${L}"/><circle cx="74" cy="65" r="6" fill="${L}"/><circle cx="48" cy="63" r="2" fill="#fff"/><circle cx="76" cy="63" r="2" fill="#fff"/>`;
  const mouth = mood === 'cheer'
    ? `<path d="M50 74q10 14 20 0z" fill="${L}"/><path d="M55 79q5 4 10 0" fill="#FF8A8A"/>`
    : mood === 'oops'
    ? `<path d="M53 79q7-5 14 0" stroke="${L}" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : `<path d="M50 75q10 9 20 0" stroke="${L}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  return `<svg class="mascot bee ${mood || 'idle'}" viewBox="0 0 120 124" aria-hidden="true">
  <defs><clipPath id="${id}"><ellipse cx="60" cy="74" rx="40" ry="38"/></clipPath></defs>
  <g class="wings">
    <ellipse class="wl" cx="36" cy="34" rx="17" ry="24" transform="rotate(-28 36 34)" fill="var(--wing)" stroke="${L}" stroke-width="3"/>
    <ellipse class="wr" cx="84" cy="34" rx="17" ry="24" transform="rotate(28 84 34)" fill="var(--wing)" stroke="${L}" stroke-width="3"/>
  </g>
  <path d="M50 40q-4-16-14-22M70 40q4-16 14-22" stroke="${L}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="36" cy="18" r="4.5" fill="${L}"/><circle cx="84" cy="18" r="4.5" fill="${L}"/>
  <path d="M55 109l5 11 5-11z" fill="${L}"/>
  <ellipse cx="60" cy="74" rx="40" ry="38" fill="var(--bee)"/>
  <g clip-path="url(#${id})" fill="var(--beeline)"><rect x="0" y="88" width="120" height="8"/><rect x="0" y="102" width="120" height="8"/></g>
  <ellipse cx="60" cy="74" rx="40" ry="38" fill="none" stroke="${L}" stroke-width="3.5"/>
  ${eyes}
  <ellipse cx="36" cy="76" rx="7" ry="4.5" fill="var(--blush)"/><ellipse cx="84" cy="76" rx="7" ry="4.5" fill="var(--blush)"/>
  ${mouth}
</svg>`;
}

/* ---------------- the page ---------------- */

const RIGHT = ['Buzz-tastic!', 'Sweet as honey!', 'You’re the bee’s knees!', 'Hive five! ✋', 'Spelled like a champ!',
  'Bee-utiful spelling!', 'Un-bee-lievable!', 'Nailed it!', 'Honey-licious!', 'Queen bee spelling! 👑'];
const MISS = ['Ooh, so close! Let’s look at it together.', 'Bzzz, not quite! Here’s the trick.', 'Good try! Even champion spellers miss sometimes.',
  'Almost! Let’s lock this one in.'];
const BACK = ['You remembered it! 💪', 'It stuck this time!', 'Look at you, you learned it!'];
const ASKS = [
  { id: 'word', label: '🔁 Say it again' },
  { id: 'def', label: '📖 Definition, please' },
  { id: 'sentence', label: '💬 Sentence, please' },
  { id: 'pos', label: '🏷️ Part of speech?' },
  { id: 'origin', label: '🌍 Language of origin?' },
];
const ROUND = 10;
const COMEBACK = 3;   // a missed word comes back after this many other words

function start(P){
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const html = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const W = P.words, GRADES = P.grades;
  const byN = new Map(W.map((w) => [w.n, w]));
  const inGrade = (g) => W.filter((w) => w.grade === g);
  const gradeOf = (id) => GRADES.find((g) => g.id === id) || GRADES[0];
  const markHTML = (w) => w.mark.replace(/\[([^\]]+)\]/g, '<mark>$1</mark>');

  /* ---------- saved progress ---------- */
  let S = { mastered: [], best: 0, muted: false, grade: GRADES[0].id, beeFrom: GRADES[0].first };
  try { const o = JSON.parse(localStorage.getItem(P.key) || 'null'); if (o && typeof o === 'object') S = Object.assign(S, o); } catch (e) {}
  if (!GRADES.some((g) => g.id === S.grade)) S.grade = GRADES[0].id;
  const mastered = new Set((Array.isArray(S.mastered) ? S.mastered : []).filter((n) => byN.has(n)));
  function save(){ S.mastered = [...mastered]; try { localStorage.setItem(P.key, JSON.stringify(S)); } catch (e) {} }
  function master(w){
    if (mastered.has(w.n)) return false;
    mastered.add(w.n); save(); updateHoney(true);
    return true;
  }
  const countIn = (g) => inGrade(g).filter((w) => mastered.has(w.n)).length;

  /* ---------- Honey's voice ---------- */
  const synth = window.speechSynthesis;
  const canSpeak = !!(synth && window.SpeechSynthesisUtterance);
  let voice = null, noVoice = !canSpeak;
  function loadVoice(){ try { voice = pickVoice(synth.getVoices()); } catch (e) {} }
  if (canSpeak) {
    loadVoice();
    try { synth.addEventListener('voiceschanged', loadVoice); } catch (e) { synth.onvoiceschanged = loadVoice; }
    // Some browsers ship the API with no voices at all; offer the peek instead.
    setTimeout(() => { try { if (!synth.getVoices().length) { noVoice = true; showVoiceNote(); } } catch (e) {} }, 2500);
  }
  function say(parts){
    if (!canSpeak) return;
    try {
      if (synth.speaking || synth.pending) synth.cancel();
      for (const p of parts) {
        const u = new SpeechSynthesisUtterance(p.text);
        if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
        u.rate = p.rate || 0.95;
        synth.speak(u);
      }
    } catch (e) {}
  }
  const hush = () => { try { if (canSpeak) synth.cancel(); } catch (e) {} };
  const wordPart = (w) => ({ text: w.say || w.word, rate: 0.8 });
  function showVoiceNote(){ const n = $('#voiceNote'); if (n) n.hidden = false; $$('.ask.peek').forEach((b) => { b.hidden = false; }); }
  if (noVoice) showVoiceNote();

  /* ---------- chimes ---------- */
  let AC = null;
  function tones(seq, type){
    if (S.muted) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      let t = AC.currentTime + 0.01;
      for (const [f, d] of seq) {
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = type || 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + 0.03);
        t += d * 0.75;
      }
    } catch (e) {}
  }
  const chime = () => tones([[784, 0.14], [988, 0.14], [1319, 0.32]]);
  const fanfare = () => tones([[523, 0.13], [659, 0.13], [784, 0.13], [1047, 0.5]]);
  const bonk = () => tones([[392, 0.2], [311, 0.34]], 'sine');
  const bell = () => tones([[1568, 0.6]], 'sine');

  const muteBtn = $('#muteBtn');
  function drawMute(){
    muteBtn.textContent = S.muted ? '🔕' : '🔔';
    muteBtn.setAttribute('aria-pressed', String(!S.muted));
    muteBtn.setAttribute('aria-label', S.muted ? 'Sound effects off' : 'Sound effects on');
    muteBtn.title = S.muted ? 'Sound effects are off (Honey still talks)' : 'Sound effects are on';
  }
  muteBtn.addEventListener('click', () => { S.muted = !S.muted; save(); drawMute(); if (!S.muted) chime(); });
  drawMute();

  /* ---------- confetti (bonus.css .conf) ---------- */
  const CONF = ['#F5A300', '#FFD54A', '#3B2A12', '#8ED1DC', '#FF9F80'];
  function confetti(anchor, n){
    if (reduce || !anchor) return;
    const r = anchor.getBoundingClientRect();
    for (let i = 0; i < (n || 22); i++) {
      const s = document.createElement('span');
      s.className = 'conf';
      s.textContent = i % 4 === 0 ? (i % 8 === 0 ? '🐝' : '🍯') : '';
      s.style.left = (r.left + r.width / 2) + 'px'; s.style.top = (r.top + r.height / 2) + 'px';
      s.style.setProperty('--dx', (Math.random() * 280 - 140) + 'px');
      s.style.setProperty('--dy', (-Math.random() * 200 - 40) + 'px');
      s.style.setProperty('--rot', (Math.random() * 540 - 270) + 'deg');
      s.style.background = i % 4 === 0 ? 'transparent' : CONF[i % CONF.length];
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1100);
    }
  }

  /* ---------- honey counter + hive drawing ---------- */
  function updateHoney(bump){
    const b = $('#honeycount'); b.textContent = mastered.size;
    if (bump && !reduce) { const pill = b.parentElement; pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }
  }
  function hiveHTML(g, fresh){
    const ws = inGrade(g), full = ws.filter((w) => mastered.has(w.n)).length;
    let rows = '';
    for (let r = 0; r < ws.length; r += 5) {
      rows += `<div class="hrow">${ws.slice(r, r + 5).map((w) => `<span class="cell${mastered.has(w.n) ? ' full' : ''}${fresh === w.n ? ' fresh' : ''}"></span>`).join('')}</div>`;
    }
    return `<div class="hive" role="img" aria-label="${gradeOf(g).label} hive: ${full} of ${ws.length} cells full of honey">${rows}</div>`;
  }
  function gradeChips(sel, attr){
    return `<div class="chips" role="group" aria-label="Choose a grade">${GRADES.map((g) =>
      `<button type="button" class="gchip" ${attr}="${g.id}" aria-pressed="${g.id === sel}"><b>${g.label}</b><span>words ${g.first}–${g.last} · 🍯 ${countIn(g.id)}/${inGrade(g.id).length}</span></button>`).join('')}</div>`;
  }

  /* ---------- views ---------- */
  const VIEWS = ['study', 'practice', 'beeday'];
  function show(v){
    hush();
    VIEWS.forEach((n) => {
      $('#view-' + n).hidden = n !== v;
      const t = $('#tab-' + n); if (t) t.setAttribute('aria-current', n === v ? 'page' : 'false');
    });
    if (v === 'study') renderStudy();
    if (v === 'practice') renderPractice();
    if (v === 'beeday') renderBee();
  }
  function route(){
    const h = (location.hash || '').slice(1);
    if (VIEWS.includes(h)) { show(h); window.scrollTo(0, 0); return; }
    show('study');
    if (h) { const el = document.getElementById(h); if (el) el.scrollIntoView({ block: 'start' }); }
  }
  window.addEventListener('hashchange', route);

  /* ---------- Study ---------- */
  let studyN = null;
  function renderStudy(){
    const g = S.grade;
    $('#studyGrades').innerHTML = gradeChips(g, 'data-sg');
    const ws = inGrade(g);
    if (!ws.some((w) => w.n === studyN)) studyN = ws[0].n;
    $('#studyWords').innerHTML = ws.map((w) =>
      `<button type="button" class="wchip${mastered.has(w.n) ? ' full' : ''}" data-n="${w.n}" aria-pressed="${w.n === studyN}"><span class="wn">${w.n}</span>${html(w.word)}${mastered.has(w.n) ? ' <span aria-label="in the hive">🍯</span>' : ''}</button>`).join('');
    drawStudyCard();
    $('#studyGo').setAttribute('href', '#practice');
    $('#studyGo').textContent = `Practice the ${gradeOf(g).label} words 🐝`;
  }
  function drawStudyCard(){
    const w = byN.get(studyN);
    $('#studyCard').innerHTML = `
      <div class="wtop">
        <span class="wnum">#${w.n}</span>
        <p class="wbig">${markHTML(w)}</p>
        <button type="button" class="btn small-btn" data-hear="${w.n}">🔊 Hear it</button>
      </div>
      <dl class="facts">
        <div><dt>Part of speech</dt><dd>${w.pos}</dd></div>
        <div><dt>What it means</dt><dd>${w.def}</dd></div>
        <div><dt>In a sentence</dt><dd>${w.sentence} <button type="button" class="link" data-hear-sentence="${w.n}">🔊</button></dd></div>
        <div><dt>Comes from</dt><dd>${w.origin}</dd></div>
      </dl>
      ${w.sounds ? `<p class="heads">⚠️ Sounds like <b>${w.sounds.join('</b> or <b>')}</b>. At the bee, ask for the definition so you know which word it is!</p>`
        : w.homonym ? `<p class="heads">⚠️ This word can sound like another word. At the bee, ask for the definition!</p>` : ''}
      ${w.alts ? `<p class="heads ok">✅ Two right spellings: <b>${spellings(w).join('</b> or <b>')}</b>. Either one counts!</p>` : ''}
      <p class="tip">💡 <b>Tricky part:</b> ${w.tip}</p>`;
  }
  $('#view-study').addEventListener('click', (e) => {
    const sg = e.target.closest('[data-sg]');
    if (sg) { S.grade = +sg.dataset.sg; save(); studyN = null; renderStudy(); return; }
    const chip = e.target.closest('.wchip[data-n]');
    if (chip) {
      studyN = +chip.dataset.n;
      $$('.wchip[data-n]', $('#studyWords')).forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.n === studyN)));
      drawStudyCard(); say([wordPart(byN.get(studyN))]);
      const card = $('#studyCard'); if (card.getBoundingClientRect().top < 70 || card.getBoundingClientRect().top > innerHeight - 120) card.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      return;
    }
    const hear = e.target.closest('[data-hear]');
    if (hear) { say([wordPart(byN.get(+hear.dataset.hear))]); return; }
    const hs = e.target.closest('[data-hear-sentence]');
    if (hs) { say([{ text: byN.get(+hs.dataset.hearSentence).sentence }]); }
  });

  /* ---------- the spelling card (Practice and Bee Day) ---------- */
  /* mountCard draws one word and runs its phases:
       ask -> graded (ctx.graded decides what happens) -> optional lock-in.
     The phase latch makes a double Enter harmless, and the Next button
     ignores presses for a moment so a second Enter can't skip the feedback. */
  function mountCard(host, w, ctx){
    host.innerHTML = `
      <div class="qcard spellcard">
        <div class="qhead">${ctx.head()}</div>
        <div class="honeyrow"><div class="beebox">${beeSVG('idle')}</div><div class="bubble" aria-live="polite"></div></div>
        <div class="asks" role="group" aria-label="Ask Honey">
          ${ASKS.map((a) => `<button type="button" class="ask" data-ask="${a.id}">${a.label}</button>`).join('')}
          <button type="button" class="ask peek" data-ask="peek" ${noVoice ? '' : 'hidden'}>👀 Peek (no sound)</button>
        </div>
        <form class="spellform" novalidate>
          <label class="vh" for="spellIn">Type the spelling</label>
          <input id="spellIn" class="spell-in" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" placeholder="Type the word here">
          <button class="btn primary check" type="submit">Check it! 🍯</button>
        </form>
        <div class="fb" aria-live="polite"></div>
      </div>`;
    const card = $('.spellcard', host), bubble = $('.bubble', card), input = $('#spellIn', card), check = $('.check', card), fbEl = $('.fb', card), beeBox = $('.beebox', card);
    let phase = 'ask', readyAt = 0, peekT = 0;
    const mood = (m) => { beeBox.innerHTML = beeSVG(m); };
    const api = {
      card, w,
      mood,
      fb(cls, inner){ fbEl.className = 'fb ' + cls; fbEl.innerHTML = inner; },
      add(inner){ fbEl.insertAdjacentHTML('beforeend', inner); },
      confetti(n){ confetti(check, n); },
      next(label){
        fbEl.insertAdjacentHTML('beforeend', `<div class="qact"><button type="button" class="btn primary nextbtn">${label || 'Next word ➜'}</button></div>`);
        const b = $('.nextbtn', fbEl);
        readyAt = Date.now() + 450;
        b.addEventListener('click', () => { if (Date.now() < readyAt) return; ctx.next(); });
        setTimeout(() => b.focus({ preventScroll: true }), 30);
        setTimeout(() => { if (!reduce) b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 60);
      },
      lock(){
        phase = 'lock';
        input.readOnly = false; input.value = ''; input.placeholder = 'Type it to lock it in 🔒';
        check.disabled = false; check.textContent = 'Lock it in 🔒';
        card.classList.add('locking');
        input.focus();
      },
    };

    function present(){
      if (w.homonym) {
        bubble.innerHTML = `Your word is… 🔊<span class="heads">Heads up! This word sounds like another word. It means: ${w.def}</span>`;
        say([{ text: 'Your word is', rate: 1 }, wordPart(w), { text: 'Heads up! This word sounds like another word. It means: ' + w.def }]);
      } else {
        bubble.innerHTML = 'Your word is… 🔊 <span class="small">Tap a button if you need help.</span>';
        say([{ text: 'Your word is', rate: 1 }, wordPart(w)]);
      }
    }
    card.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ask]'); if (!b) return;
      const k = b.dataset.ask;
      if (k === 'word') { bubble.innerHTML = '🔊 Listen closely…'; say([wordPart(w)]); }
      if (k === 'def') { bubble.innerHTML = `📖 <b>Definition:</b> ${w.def}`; say([{ text: w.def }]); }
      if (k === 'sentence') { bubble.innerHTML = `💬 ${blankWord(w.sentence, w)}`; say([{ text: w.sentence }]); }
      if (k === 'pos') { const a = /^[aeiou]/i.test(w.pos) ? 'an' : 'a'; bubble.innerHTML = `🏷️ It’s ${a} <b>${w.pos}</b>.`; say([{ text: `It's ${a} ${w.pos}.` }]); }
      if (k === 'origin') { bubble.innerHTML = `🌍 It comes from <b>${w.origin}</b>.`; say([{ text: 'It comes from ' + w.origin.replace(/\(.*?\)/g, '') }]); }
      if (k === 'peek') {
        clearTimeout(peekT);
        bubble.innerHTML = `👀 <span class="peekword">${html(w.word)}</span>`;
        peekT = setTimeout(() => { bubble.innerHTML = '👀 Peek is over. Now spell it!'; }, 2000);
      }
      if (k !== 'peek') clearTimeout(peekT);
    });
    $('.spellform', card).addEventListener('submit', (e) => {
      e.preventDefault();
      if (phase === 'ask') {
        const typed = input.value;
        if (!normalize(typed)) { api.fb('info', 'Type your spelling first, then press <b>Check it!</b>'); input.focus(); return; }
        phase = 'graded';
        clearTimeout(peekT);
        input.readOnly = true; check.disabled = true;
        const right = isCorrect(w, typed);
        card.classList.add(right ? 'was-right' : 'was-wrong');
        ctx.graded(right, typed, api);
        $('.qhead', card).innerHTML = ctx.head();   // the streak / run just changed
      } else if (phase === 'lock') {
        if (isCorrect(w, input.value)) {
          phase = 'locked';
          input.readOnly = true; check.disabled = true;
          card.classList.remove('locking');
          ctx.locked(api);
        } else {
          input.classList.remove('shake'); void input.offsetWidth; input.classList.add('shake');
          input.select();
        }
      }
    });
    present();
    input.focus({ preventScroll: true });
  }

  function missHTML(w, typed){
    const tiles = letterDiff(typed, w.word).map((x) => `<span class="tile${x.ok ? '' : ' miss'}">${html(x.ch)}</span>`).join('');
    return `
      <p class="tiles" aria-label="The right spelling: ${html(w.word.split('').join(' '))}">${tiles}</p>
      <p class="small">You typed <s>${html(typed.trim())}</s>. The orange letters are the ones to watch.</p>
      <p class="tip">💡 <b>${markHTML(w)}</b>: ${w.tip}</p>`;
  }
  const capNote = (w, typed) => (/^[A-Z]/.test(w.word) && !/^[A-Z]/.test(typed.trim()) ? `<p class="small">✍️ Remember, ${html(w.word)} starts with a capital letter.</p>` : '');

  /* ---------- Practice ---------- */
  let R = null;   // the round in progress
  function startRound(g, list){
    R = { grade: g, queue: list || pickRound(inGrade(g), mastered, ROUND), i: 0, missed: new Set(), honey: 0, streak: 0, best: 0, custom: !!list };
    renderPractice();
  }
  function renderPractice(){
    const box = $('#practiceBox');
    if (!R) {
      box.innerHTML = `
        <div class="setup">
          <div class="honeyrow"><div class="beebox">${beeSVG('happy')}</div><div class="bubble">Pick a hive, and I’ll read you ${ROUND} words. Spell a word right on the first try and its cell fills with honey! 🍯</div></div>
          ${gradeChips(S.grade, 'data-pg')}
          ${hiveHTML(S.grade)}
          <p class="center"><button type="button" class="btn primary bigbtn" data-act="go">Start a round 🐝</button></p>
          <p class="small center">🔊 Turn your sound up: Honey reads every word out loud. (On an iPad, check the silent switch too.)</p>
        </div>`;
      return;
    }
    if (R.i >= R.queue.length) { renderRoundEnd(box); return; }
    const w = R.queue[R.i];
    mountCard(box, w, {
      head: () => `<span class="qnum">Word ${R.i + 1} of ${R.queue.length}</span>
        <span class="chip">${R.custom ? 'Review' : gradeOf(R.grade).label} · #${w.n}</span>
        <span class="streak${R.streak >= 3 ? ' hot' : ''}">${R.streak >= 3 ? '🔥' : '⭐'} ${R.streak} in a row</span>`,
      graded(right, typed, api){
        const comeback = R.missed.has(w.n);
        if (right) {
          R.streak++; R.best = Math.max(R.best, R.streak);
          const gained = !comeback && master(w);
          if (gained) R.honey++;
          api.mood(R.streak >= 5 ? 'cheer' : 'happy');
          (R.streak > 0 && R.streak % 5 === 0) ? fanfare() : chime();
          api.confetti(R.streak % 5 === 0 ? 40 : 22);
          const streakLine = R.streak === 3 ? ' 🔥 Three in a row!' : R.streak === 5 ? ' 🔥 FIVE in a row, hot streak!' : R.streak === 10 ? ' 👑 TEN in a row! Queen bee!' : '';
          api.fb('good', `<div class="fbrow">${beeSVG('happy')}<div>
            <p><b>${comeback ? pick(BACK) : pick(RIGHT)}</b>${streakLine}</p>
            <p>${gained ? '🍯 Another cell full of honey!' : comeback ? 'It’ll be back in a future round to earn its honey.' : 'Already in your hive, still sweet!'}</p>
            <p class="small">The tricky part: <b class="marked">${markHTML(w)}</b></p>${capNote(w, typed)}</div></div>`);
          api.next(R.i + 1 >= R.queue.length ? 'Finish the round 🎉' : 'Next word ➜');
        } else {
          R.streak = 0; R.missed.add(w.n);
          api.mood('oops'); bonk();
          api.fb('oops', `<div class="fbrow">${beeSVG('oops')}<div><p><b>${pick(MISS)}</b></p></div></div>${missHTML(w, typed)}
            <p class="lockline">Now type it once to lock it in:</p>`);
          api.lock();
        }
      },
      locked(api){
        R.queue.splice(Math.min(R.i + 1 + COMEBACK, R.queue.length), 0, w);
        chime(); api.mood('happy');
        api.add(`<p class="locked">🔒 Locked in! Honey will buzz this one back in a few words.</p>`);
        api.next('Next word ➜');
      },
      next(){ R.i++; renderPractice(); },
    });
  }
  function renderRoundEnd(box){
    const g = R.grade, full = countIn(g), total = inGrade(g).length;
    const missed = [...R.missed].map((n) => byN.get(n));
    const msg = R.honey === 0 && !missed.length ? 'Every word was already in your hive, and you spelled them all. Wow!'
      : !missed.length ? 'Not a single miss! You’re a spelling superstar! 🌟'
      : R.honey ? `You added ${R.honey} ${R.honey === 1 ? 'cell' : 'cells'} of honey. Keep going!` : 'Every round makes you a stronger speller. Keep going!';
    const nextG = GRADES.find((x) => x.id === g + 1);
    box.innerHTML = `
      <div class="roundend">
        <div class="rhead">${beeSVG('cheer')}<div><p class="big">+${R.honey} <span>🍯 this round</span></p><p class="rmsg">${msg}</p>
          ${R.best >= 3 ? `<p class="small">Best streak this round: 🔥 ${R.best} in a row</p>` : ''}</div></div>
        ${R.custom ? '' : `<p class="center"><b>${gradeOf(g).label} hive: ${full} of ${total} cells full</b></p>${hiveHTML(g)}`}
        ${!R.custom && full === total ? `<p class="heads ok">🎉 You filled the whole ${gradeOf(g).label} hive!${nextG ? ` Ready for ${nextG.label}?` : ' You’re ready for the bee!'}</p>` : ''}
        ${missed.length ? `<h3>Words to keep practicing</h3><ul class="review">${missed.map((w) =>
          `<li><button type="button" class="link" data-hear="${w.n}" aria-label="Hear ${html(w.word)}">🔊</button> <b class="marked">${markHTML(w)}</b> <span class="small">${w.tip}</span></li>`).join('')}</ul>` : ''}
        <div class="ractions">
          <button type="button" class="btn primary" data-act="again">Another round 🐝</button>
          ${missed.length ? '<button type="button" class="btn" data-act="redo">Practice my missed words</button>' : ''}
          ${!R.custom && full === total && nextG ? `<button type="button" class="btn" data-act="up" data-g="${nextG.id}">Try ${nextG.label} ➜</button>` : ''}
          <a class="btn" href="#beeday">Bee Day 🏆</a>
        </div>
      </div>`;
    R.lastMissed = missed;
    fanfare();
    confetti($('.rhead', box), 44);
  }
  $('#practiceBox').addEventListener('click', (e) => {
    const pg = e.target.closest('[data-pg]');
    if (pg) { S.grade = +pg.dataset.pg; save(); renderPractice(); return; }
    const hear = e.target.closest('[data-hear]');
    if (hear) { say([wordPart(byN.get(+hear.dataset.hear))]); return; }
    const act = e.target.closest('[data-act]'); if (!act) return;
    const a = act.dataset.act;
    if (a === 'go') startRound(S.grade);
    if (a === 'again') { const g = R.custom ? S.grade : R.grade; startRound(g); }
    if (a === 'redo') startRound(R.grade, R.lastMissed.slice());
    if (a === 'up') { S.grade = +act.dataset.g; save(); startRound(S.grade); }
  });

  /* ---------- Bee Day ---------- */
  let B = null;
  function renderBee(){
    const box = $('#beeBox');
    if (!B) {
      box.innerHTML = `
        <div class="setup">
          <div class="honeyrow"><div class="beebox">${beeSVG('happy')}</div><div class="bubble">This is just like the real bee! I read the words <b>in order</b>, and you get <b>one try</b> each. How many can you spell in a row?</div></div>
          <p class="bestline">🏆 Your best run: <b>${S.best}</b> ${S.best === 1 ? 'word' : 'words'} in a row</p>
          <div class="chips" role="group" aria-label="Where to start">${GRADES.map((g) =>
            `<button type="button" class="gchip" data-from="${g.first}" aria-pressed="${S.beeFrom === g.first}"><b>Start at word ${g.first}</b><span>${g.label}</span></button>`).join('')}</div>
          <p class="center"><button type="button" class="btn primary bigbtn" data-act="bee">Start Bee Day 🏆</button></p>
          <div class="panel tint small-panel"><b>At the real bee:</b> say the word, spell it, then say the word again. Take your time, and ask for the definition or a sentence whenever it helps.</div>
        </div>`;
      return;
    }
    if (B.i >= B.list.length || B.stopped) { renderBeeEnd(box); return; }
    const w = B.list[B.i];
    mountCard(box, w, {
      head: () => `<span class="qnum">Word #${w.n}</span>
        <span class="chip">${gradeOf(w.grade).label}</span>
        <span class="streak${B.run >= 3 ? ' hot' : ''}">🏃 Run: ${B.run} · 🏆 Best: ${S.best}</span>
        <button type="button" class="link stopbtn" data-act="stop">Stop for now</button>`,
      graded(right, typed, api){
        B.done++;
        if (right) {
          B.run++; B.right++;
          master(w);
          const newBest = B.run > S.best;
          if (newBest) { S.best = B.run; save(); }
          api.mood(newBest ? 'cheer' : 'happy');
          newBest && B.run % 5 === 0 ? fanfare() : chime();
          api.confetti(newBest ? 36 : 18);
          api.fb('good', `<div class="fbrow">${beeSVG('happy')}<div><p><b>✅ Correct! ${pick(RIGHT)}</b></p>
            <p>${newBest ? `🏆 New personal best: ${B.run} in a row!` : `🏃 That’s ${B.run} in a row.`}</p>${capNote(w, typed)}</div></div>`);
        } else {
          if (B.run >= 3) B.runs.push(B.run);
          B.run = 0; B.missed.push(w);
          api.mood('oops'); bell();
          api.fb('oops', `<div class="fbrow">${beeSVG('oops')}<div><p><b>🔔 Ding! Not quite.</b> Your run starts over, but you can keep going.</p></div></div>${missHTML(w, typed)}`);
        }
        api.next(B.i + 1 >= B.list.length ? 'See how I did 🎉' : 'Next word ➜');
      },
      locked(){},
      next(){ B.i++; renderBee(); },
    });
  }
  function renderBeeEnd(box){
    const missed = B.missed;
    box.innerHTML = `
      <div class="roundend">
        <div class="rhead">${beeSVG('cheer')}<div><p class="big">${B.right}<span> of ${B.done} spelled right</span></p>
          <p class="rmsg">🏆 Best run ever: <b>${S.best}</b> in a row${B.i >= B.list.length ? '. You made it through the whole list!' : '.'}</p></div></div>
        ${missed.length ? `<h3>Words to practice</h3><ul class="review">${missed.map((w) =>
          `<li><button type="button" class="link" data-hear="${w.n}" aria-label="Hear ${html(w.word)}">🔊</button> <b class="marked">${markHTML(w)}</b> <span class="small">${w.tip}</span></li>`).join('')}</ul>` : '<p class="center">No misses at all. You’re ready! 🌟</p>'}
        <div class="ractions">
          <button type="button" class="btn primary" data-act="beeagain">Bee Day again 🏆</button>
          ${missed.length ? '<button type="button" class="btn" data-act="beepractice">Practice these words 🐝</button>' : ''}
        </div>
      </div>`;
    if (B.done) { fanfare(); confetti($('.rhead', box), 40); }
  }
  $('#beeBox').addEventListener('click', (e) => {
    const from = e.target.closest('[data-from]');
    if (from) { S.beeFrom = +from.dataset.from; save(); renderBee(); return; }
    const hear = e.target.closest('[data-hear]');
    if (hear) { say([wordPart(byN.get(+hear.dataset.hear))]); return; }
    const act = e.target.closest('[data-act]'); if (!act) return;
    const a = act.dataset.act;
    if (a === 'bee') {
      const list = W.filter((w) => w.n >= S.beeFrom).sort((x, y) => x.n - y.n);
      B = { list, i: 0, run: 0, right: 0, done: 0, missed: [], runs: [], stopped: false };
      renderBee();
    }
    if (a === 'stop') { hush(); B.stopped = true; renderBee(); }
    if (a === 'beeagain') { B = null; renderBee(); }
    if (a === 'beepractice') { const list = B.missed.slice(); B = null; location.hash = '#practice'; startRound(list[0].grade, list); }
  });

  /* ---------- go ---------- */
  $('#heroBee').innerHTML = beeSVG('happy');
  updateHoney(false);
  route();
}

export default { start };
