/*
  Content for games/math/decimal-bakery.html (bonus page, bunny theme).
  Source: the Decimal Test 1 study guide -- tenths and hundredths, mixed
  numbers and decimals, money, place value and the x10 pattern, expanded
  notation, decimal grids, number lines and rulers.
  Questions are hand-written and fixed (no generators); answer keys are
  checked by test/bonus-pages.test.js. Ported from the page drafted as an
  artifact; the figures (grids, coins, number lines, rulers) are drawn by G.
*/
export function bunSVG(mood){
  const L = 'var(--bunline)';
  const eyes = mood === 'happy'
    ? `<path d="M38 82q7-8 14 0M68 82q7-8 14 0" stroke="${L}" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : mood === 'think'
    ? `<circle cx="45" cy="80" r="6" fill="${L}"/><circle cx="75" cy="80" r="6" fill="${L}"/><circle cx="47" cy="78" r="2" fill="#fff"/><circle cx="77" cy="78" r="2" fill="#fff"/><path d="M106 52q5 8 0 12q-5-4 0-12z" fill="#8FD3FF"/>`
    : `<circle cx="45" cy="81" r="6.5" fill="${L}"/><circle cx="75" cy="81" r="6.5" fill="${L}"/><circle cx="47" cy="79" r="2.2" fill="#fff"/><circle cx="77" cy="79" r="2.2" fill="#fff"/>`;
  const mouth = mood === 'think'
    ? `<path d="M55 100q5-3 10 0" stroke="${L}" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : `<path d="M52 96q4 5 8 0q4 5 8 0" stroke="${L}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return `<svg class="mascot" viewBox="0 0 120 130" aria-hidden="true">
  <g transform="rotate(-10 40 40)"><ellipse cx="40" cy="34" rx="13" ry="32" fill="var(--bun)" stroke="${L}" stroke-width="3.5"/><ellipse cx="40" cy="36" rx="6" ry="22" fill="var(--earin)"/></g>
  <g transform="rotate(12 80 40)"><ellipse cx="80" cy="34" rx="13" ry="32" fill="var(--bun)" stroke="${L}" stroke-width="3.5"/><ellipse cx="80" cy="36" rx="6" ry="22" fill="var(--earin)"/></g>
  <ellipse cx="60" cy="86" rx="48" ry="39" fill="var(--bun)" stroke="${L}" stroke-width="3.5"/>
  <path d="M84 52q8-8 16-2q-6 2-6 8q-6-6-10-6z" fill="var(--accent)"/><circle cx="92" cy="52" r="3" fill="var(--pop)"/>
  ${eyes}
  <ellipse cx="33" cy="95" rx="8" ry="5" fill="var(--blush)"/><ellipse cx="87" cy="95" rx="8" ry="5" fill="var(--blush)"/>
  <circle cx="60" cy="90" r="4" fill="var(--nose)"/>
  ${mouth}
</svg>`;
}

/* ---------- drawing helpers (figures in the questions and the Learn widgets) ---------- */
const G = {
  fr(n, d){ return `<span class="fr"><span>${n}</span><span>${d}</span></span>`; },
  mx(w, n, d){ return `<span class="mx">${w}${G.fr(n, d)}</span>`; },
  grid(n, size){
    const s = size || 110, c = s / 10, full = Math.floor(n / 10), part = n % 10;
    let r = '';
    if (full) r += `<rect x="0" y="0" width="${s}" height="${full * c}" class="gshade"/>`;
    if (part) r += `<rect x="0" y="${full * c}" width="${part * c}" height="${c}" class="gshade"/>`;
    let d = ''; for (let i = 1; i < 10; i++) d += `M${i * c} 0V${s}M0 ${i * c}H${s}`;
    return `<svg viewBox="-2 -2 ${s + 4} ${s + 4}" width="${s + 4}" height="${s + 4}" aria-hidden="true"><rect x="0" y="0" width="${s}" height="${s}" fill="var(--surface)"/>${r}<path d="${d}" class="glines"/><rect x="0" y="0" width="${s}" height="${s}" class="gborder"/></svg>`;
  },
  labeled(label, svg){ return `<div class="gbox">${svg}<span>${label}</span></div>`; },
  smallSquares(n){
    let r = ''; for (let i = 0; i < n; i++) r += `<rect x="${i * 16}" y="0" width="11" height="11" class="gshade" stroke="var(--gline)" stroke-width="1.5"/>`;
    return `<svg viewBox="-2 -2 ${n * 16} 15" width="${n * 16}" height="15" aria-hidden="true">${r}</svg>`;
  },
  fmt(v){ return String(+v.toFixed(2)); },
  line(o){
    const w = o.w || 640, pad = 24, h = o.pts && o.pts.length ? 92 : 60, base = h - 30;
    const X = v => pad + (v - o.min) / (o.max - o.min) * (w - 2 * pad);
    const n = Math.round((o.max - o.min) / o.minor);
    let t = `<line x1="${pad - 8}" y1="${base}" x2="${w - pad + 8}" y2="${base}" class="tk" stroke-width="2"/>`;
    for (let k = 0; k <= n; k++) {
      const v = o.min + k * o.minor, x = X(v).toFixed(1);
      const isLab = Math.abs((v - o.min) / o.lab - Math.round((v - o.min) / o.lab)) < 1e-6;
      const isMaj = o.major && Math.abs((v - o.min) / o.major - Math.round((v - o.min) / o.major)) < 1e-6;
      const len = isLab ? 9 : isMaj ? 7 : 4.5;
      t += `<line x1="${x}" y1="${base - len}" x2="${x}" y2="${base + len}" class="tk"/>`;
      if (isLab) t += `<text x="${x}" y="${base + 26}" text-anchor="middle" font-size="${o.fs || 13}">${G.fmt(v)}</text>`;
    }
    (o.pts || []).forEach(([l, v]) => {
      const x = X(v).toFixed(1);
      t += `<line x1="${x}" y1="${base - 20}" x2="${x}" y2="${base}" class="pt"/><circle cx="${x}" cy="${base}" r="4.5" fill="var(--accent)"/><text x="${x}" y="${base - 26}" text-anchor="middle" font-size="16" class="ptl">${l}</text>`;
    });
    return `<svg class="nl" viewBox="0 0 ${w} ${h}" width="${w}" aria-hidden="true">${t}</svg>`;
  },
  ruler(max, ribbon){
    const w = 640, pad = 20, X = v => pad + v / max * (w - 2 * pad);
    let t = `<rect x="${pad - 10}" y="38" width="${w - 2 * pad + 20}" height="46" rx="6" fill="var(--pop-soft)" stroke="var(--pop)" stroke-width="2"/>`;
    for (let k = 0; k <= max * 10; k++) {
      const x = X(k / 10).toFixed(1), whole = k % 10 === 0, half = k % 5 === 0;
      t += `<line x1="${x}" y1="38" x2="${x}" y2="${38 + (whole ? 20 : half ? 14 : 8)}" stroke="var(--ink)" stroke-width="${whole ? 1.8 : 1.1}"/>`;
      if (whole) t += `<text x="${x}" y="76" text-anchor="middle" font-size="14" fill="var(--ink)" font-weight="800">${k / 10}</text>`;
    }
    if (ribbon != null) t += `<rect x="${X(0)}" y="16" width="${X(ribbon) - X(0)}" height="12" rx="6" fill="var(--accent)"/><line x1="${X(ribbon)}" y1="12" x2="${X(ribbon)}" y2="44" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    t += `<text x="${w - pad}" y="76" text-anchor="end" font-size="12" fill="var(--muted)" dx="0" dy="0"></text>`;
    return `<svg class="nl" viewBox="0 0 ${w} 92" width="${w}" aria-hidden="true">${t}</svg>`;
  },
  COIN: {
    bill: { w: 74, h: 38, label: '$1' },
    q: { r: 19, label: '25¢', fill: '#D7DCE3' }, d: { r: 14, label: '10¢', fill: '#D7DCE3' },
    n: { r: 17, label: '5¢', fill: '#C9CFD6' }, p: { r: 15, label: '1¢', fill: '#E3A06E' }
  },
  coin(k){
    if (k === 'bill') return `<svg viewBox="0 0 76 40" width="76" height="40" aria-hidden="true"><rect x="1" y="1" width="74" height="38" rx="5" fill="#A8DDB0" stroke="#3E7C4A" stroke-width="2"/><rect x="7" y="6" width="62" height="28" rx="3" fill="none" stroke="#3E7C4A" stroke-width="1.2"/><text x="38" y="27" text-anchor="middle" font-size="17" fill="#245A30">$1</text></svg>`;
    const c = G.COIN[k], s = c.r * 2 + 4;
    return `<svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" aria-hidden="true"><circle cx="${s / 2}" cy="${s / 2}" r="${c.r}" fill="${c.fill}" stroke="#6A6F78" stroke-width="2"/><text x="${s / 2}" y="${s / 2 + 4}" text-anchor="middle" font-size="${c.r > 15 ? 12 : 10}" fill="#333">${c.label}</text></svg>`;
  },
  money(o){
    let r = '';
    [['bill', o.b], ['q', o.q], ['d', o.d], ['n', o.n], ['p', o.p]].forEach(([k, c]) => { for (let i = 0; i < (c || 0); i++) r += G.coin(k); });
    return `<div class="money">${r}</div>`;
  }
};
const F = G.mx, FR = G.fr;

const DECIMAL_BAKERY = {
  key: 'bianca-decimal-bakery-v1',
  mascot: bunSVG,
  confetti: ['#D63F86','#FFC531','#8ED1DC','#4FCB9F','#FFB3C7'],
  confettiEmoji: '🧁',
  cheers: ['Sweet!','Hoppy day!','Sprinkle-tastic!','Some-bunny is smart!','Fresh from the oven!','Un-carrot-ly good!'],
  oops: ['Hmm, not quite.','Close, but not yet.','Dottie thinks you can fix this.','Almost!'],
  report: {
    start: 'Ready when you are. Dottie has the oven warmed up.',
    great: 'Perfectly baked! You really know your decimals.',
    good: 'Great work! Review the topics marked below and you’ll be a decimal chef.',
    keep: 'Good start! Visit the bakery stations for the topics below, then try again.'
  },
  tags: {
    mixed: { name: 'Mixed numbers ↔ decimals', link: 'mixed' },
    money: { name: 'Money', link: 'money' },
    place: { name: 'Place value and ×10', link: 'places' },
    models: { name: 'Decimal grids', link: 'tenths' },
    lines: { name: 'Number lines and comparing', link: 'lines' }
  },
  sorters: {
    half: {
      labels: ['⬇️ Less than 0.5', '⬆️ More than 0.5'],
      items: [
        { e: '🧁', t: '0.48 pound', a: 0, why: '0.5 = 0.50, and 48 hundredths is less than 50 hundredths.' },
        { e: '🎂', t: '0.6 pound', a: 1, why: '6 tenths is more than 5 tenths.' },
        { e: '🍩', t: '0.09 pound', a: 0, why: '0.09 has 0 tenths. That’s much less than 5 tenths.' },
        { e: '🥧', t: '0.52 pound', a: 1, why: '0.50 vs 0.52: 52 hundredths is more than 50 hundredths.' },
        { e: '🍰', t: '0.45 pound', a: 0, why: '4 tenths is less than 5 tenths.' },
        { e: '🍪', t: '0.7 pound', a: 1, why: '7 tenths is more than 5 tenths.' }
      ]
    }
  },
  orderers: {},
  questions: [
    { id: 'd1', tag: 'mixed', type: 'sort',
      q: 'Dottie labels her cake boxes. Match each mixed number to its equivalent decimal.',
      howto: 'Pick a decimal for every row. Not every decimal is used in each row.',
      labels: ['25.03', '25.3', '41.9', '41.09'],
      items: [
        { t: F(25, 3, 100), aria: '25 and 3 hundredths', a: 0 },
        { t: F(41, 9, 10), aria: '41 and 9 tenths', a: 2 },
        { t: F(25, 3, 10), aria: '25 and 3 tenths', a: 1 },
        { t: F(41, 9, 100), aria: '41 and 9 hundredths', a: 3 }
      ],
      hint: 'Out of 10 means 1 digit after the point. Out of 100 means 2 digits after the point.',
      explain: `<ul><li>${F(25, 3, 100)} → 3 hundredths needs 2 places: <b>25.03</b></li><li>${F(41, 9, 10)} → 9 tenths needs 1 place: <b>41.9</b></li><li>${F(25, 3, 10)} → <b>25.3</b></li><li>${F(41, 9, 100)} → <b>41.09</b></li></ul><p>The 0 in 25.03 holds the tenths place so the 3 can sit in the hundredths place.</p>` },

    { id: 'd2', tag: 'money', type: 'sort',
      q: 'Dottie’s tip jar has 3 one-dollar bills, 1 quarter, 2 dimes, and 2 pennies. Complete the equation.',
      fig: G.money({ b: 3, q: 1, d: 2, p: 2 }),
      labels: ['3.47', '3.047', F(3, 47, 100), F(3, 47, 10)],
      items: [
        { t: '$ ______ (a decimal)', aria: 'decimal', a: 0 },
        { t: '= ______ (a mixed number)', aria: 'mixed number', a: 2 }
      ],
      hint: 'Add the coins first: 25 + 10 + 10 + 1 + 1 cents.',
      explain: '<ol><li>Bills: <b>3</b> whole dollars.</li><li>Coins: 25 + 10 + 10 + 1 + 1 = <b>47 cents</b> = 47 hundredths of a dollar.</li><li>So the total is <b>$3.47</b> = ' + F(3, 47, 100) + '.</li></ol><p>' + F(3, 47, 10) + ' is wrong because cents are hundredths, not tenths.</p>' },

    { id: 'd3', tag: 'mixed', type: 'multi',
      q: 'A carrot cake is 5.6 inches tall. Which TWO mixed numbers are equivalent to 5.6?',
      opts: [F(5, 6, 100), F(5, 6, 10), FR('5.6', 10), FR(56, 100), F(5, 60, 100)],
      answers: [1, 4], hint: '5.6 has 6 tenths. How many hundredths is that?',
      explain: '<ol><li>5.6 is 5 wholes and <b>6 tenths</b>: ' + F(5, 6, 10) + '.</li><li>6 tenths = <b>60 hundredths</b>, so 5.6 = 5.60 = ' + F(5, 60, 100) + '.</li><li>' + F(5, 6, 100) + ' is 5.06, and ' + FR(56, 100) + ' is only 0.56.</li></ol>' },

    { id: 'd4', tag: 'place', type: 'multi',
      q: 'Pick TWO true statements about the number 733,448.33.',
      opts: [
        'The 4 in the tens place is 10 times the 4 in the hundreds place.',
        'The 3 in the ten-thousands place is 10 times the 3 in the thousands place.',
        'The 3 in the hundredths place is 10 times the 3 in the tenths place.',
        'The 4 in the hundreds place is 100 times the 4 in the tens place.',
        'The 3 in the tenths place is 10 times the 3 in the hundredths place.'
      ],
      answers: [1, 4], hint: 'The digit further to the LEFT is the bigger one. Neighbors differ by ×10.',
      explain: '<ol><li>7 3 3 , 4 4 8 . 3 3 → the 3s are in the <b>ten-thousands</b>, <b>thousands</b>, <b>tenths</b>, and <b>hundredths</b> places.</li><li>Ten-thousands is one place left of thousands, so 30,000 is <b>10 times</b> 3,000. ✔</li><li>Tenths is one place left of hundredths, so 0.3 is <b>10 times</b> 0.03. ✔</li><li>The others go the wrong way, or say 100 times for places that are next to each other (that’s only 10 times).</li></ol>' },

    { id: 'd5', tag: 'models', type: 'mc',
      q: 'Each grid is one whole. Compare the shaded parts of Model 1 and Model 2.',
      fig: G.labeled('Model 1', G.grid(30, 120)) + G.labeled('Model 2', G.grid(3, 120)),
      opts: ['Model 1 is 100 times Model 2.', 'Model 1 is one tenth of Model 2.', 'Model 1 is 3 times Model 2.', 'Model 1 is 10 times Model 2.'],
      answer: 3, hint: 'Write each model as a decimal first.',
      explain: '<ol><li>Model 1 has 3 full rows = <b>0.3</b> (3 tenths).</li><li>Model 2 has 3 little squares = <b>0.03</b> (3 hundredths).</li><li>The 3 moved one place to the left, so Model 1 is <b>10 times</b> Model 2.</li></ol>' },

    { id: 'd6', tag: 'place', type: 'sort',
      q: 'A bag of flour weighs 36.9 pounds. Complete the expanded notation.',
      scene: '<p class="eq" style="margin:0;text-align:center">(3 × ___) + (6 × ___) + (9 × ___)</p>',
      labels: ['0.01', '0.1', '1', '10', '100'],
      items: [
        { t: '3 × ___', a: 3 }, { t: '6 × ___', a: 2 }, { t: '9 × ___', a: 1 }
      ],
      hint: 'Which place is each digit in? Tens, ones, or tenths?',
      explain: '<ol><li>The 3 is in the <b>tens</b> place: 3 × 10 = 30.</li><li>The 6 is in the <b>ones</b> place: 6 × 1 = 6.</li><li>The 9 is in the <b>tenths</b> place: 9 × 0.1 = 0.9.</li></ol><p>36.9 = (3 × 10) + (6 × 1) + (9 × 0.1)</p>' },

    { id: 'd7', tag: 'place', type: 'multi',
      q: 'A number has a 4 worth 4,000, a 7 worth 70, and a 2 worth 0.02. Pick TWO numbers that fit.',
      opts: ['14,572.02', '4,172.20', '34,079.12', '47,270.02', '24,707.02'],
      answers: [0, 2], hint: 'Check each clue: 4 in the thousands, 7 in the tens, 2 in the hundredths.',
      explain: '<ul><li><b>14,572.02</b>: 4 thousands ✔, 7 tens ✔, 2 hundredths ✔</li><li><b>34,079.12</b>: 4 thousands ✔, 7 tens ✔, 2 hundredths ✔</li><li>4,172.20: the 2 after the point is in the tenths (0.2). ✘</li><li>47,270.02: the 4 is worth 40,000. ✘</li><li>24,707.02: the 7s are worth 700 and 7, not 70. ✘</li></ul>' },

    { id: 'd8', tag: 'place', type: 'sort',
      q: 'Dottie paid $27.63 for sprinkles. What is the value of the digit 6?',
      howto: 'Pick one choice in each row to finish the sentence.',
      items: [
        { t: 'The value is…', labels: ['6 × 0.1', '6 × 0.01'], a: 0 },
        { t: 'because the 6 is in the…', labels: ['hundredths place', 'tenths place'], a: 1 }
      ],
      hint: 'Which place comes right after the decimal point?',
      explain: '<ol><li>In 27.63, the first digit after the point is the <b>tenths</b> place. That’s the 6.</li><li>So the 6 is worth <b>6 × 0.1 = 0.6</b> (60 cents, or 6 dimes).</li></ol>' },

    { id: 'd9', tag: 'models', type: 'input',
      q: 'Each decimal grid is one whole. What decimal number do all three grids show together?',
      fig: G.grid(100, 110) + G.grid(100, 110) + G.grid(37, 110),
      answer: 2.37, show: '2.37', hint: 'Count the full grids first. Then count full rows (tenths) and extra squares (hundredths).',
      explain: '<ol><li>2 grids are full: <b>2 wholes</b>.</li><li>The last grid has 3 full rows = <b>3 tenths</b>, plus 7 squares = <b>7 hundredths</b>.</li><li>Together: <b>2.37</b></li></ol>' },

    { id: 'd10', tag: 'models', type: 'multi',
      q: 'Which TWO grids show an amount greater than 0.48?',
      fig: G.labeled('A', G.grid(42, 90)) + G.labeled('B', G.grid(50, 90)) + G.labeled('C', G.grid(39, 90)) + G.labeled('D', G.grid(47, 90)) + G.labeled('E', G.grid(61, 90)),
      opts: ['Grid A', 'Grid B', 'Grid C', 'Grid D', 'Grid E'],
      answers: [1, 4], hint: 'Write each grid as hundredths: count full rows ×10, then add the extra squares.',
      explain: '<ul><li>A = 0.42, C = 0.39, D = 0.47 → all <b>less</b> than 0.48.</li><li>B = 0.50 and E = 0.61 → <b>greater</b> than 0.48. ✔</li></ul><p>D is the sneaky one: 0.47 is just 1 hundredth less than 0.48.</p>' },

    { id: 'd11', tag: 'models', type: 'mc',
      q: 'One large flat is 1 whole. Each small square is 0.01. Which decimal is shown?',
      fig: G.grid(100, 110) + G.grid(100, 110) + G.smallSquares(4),
      opts: ['2.4', '0.24', '2.04', '20.4'],
      answer: 2, hint: 'The small squares are hundredths, not tenths.',
      explain: '<ol><li>2 flats = <b>2 wholes</b>.</li><li>4 small squares = <b>4 hundredths</b>, and there are 0 tenths.</li><li>So it’s <b>2.04</b>. The 0 holds the tenths place.</li></ol>' },

    { id: 'd12', tag: 'mixed', type: 'multi',
      q: 'Pick TWO equations that correctly match a mixed number and a decimal.',
      opts: [F(23, 5, 100) + ' = 23.5', F(23, 8, 10) + ' = 23.08', F(23, 5, 10) + ' = 23.50', F(23, 8, 100) + ' = 23.80', F(23, 8, 100) + ' = 23.08'],
      answers: [2, 4], hint: 'Is the fraction out of 10 or out of 100? That decides the places.',
      explain: '<ul><li>' + F(23, 5, 10) + ' = 23.5 = <b>23.50</b> ✔ (5 tenths = 50 hundredths)</li><li>' + F(23, 8, 100) + ' = <b>23.08</b> ✔</li><li>' + F(23, 5, 100) + ' is 23.05, not 23.5.</li><li>' + F(23, 8, 10) + ' is 23.8, not 23.08.</li></ul>' },

    { id: 'd13', tag: 'lines', type: 'mc',
      q: 'Dottie has 1 quarter, 4 dimes, and 3 pennies. Which point on the number line shows her total in dollars?',
      fig: G.money({ q: 1, d: 4, p: 3 }) + G.line({ min: 0, max: 1, minor: 0.02, lab: 0.1, pts: [['A', 0.58], ['B', 0.68], ['C', 0.78], ['D', 0.86]] }),
      opts: ['Point A', 'Point B', 'Point C', 'Point D'],
      answer: 1, hint: 'Add the cents: 25 + 40 + 3. Each small tick is 0.02.',
      explain: '<ol><li>25 + 40 + 3 = <b>68 cents = $0.68</b>.</li><li>0.68 is 8 hundredths past 0.6. Each small tick is 0.02, so count 4 ticks past 0.6.</li><li>That’s <b>Point B</b>.</li></ol>' },

    { id: 'd14', tag: 'lines', type: 'mc',
      q: 'Dottie lays a ribbon on the ruler, starting at 0 cm. How long is the ribbon?',
      fig: G.ruler(9, 4.8),
      opts: ['4.5 cm', '4.08 cm', '8.4 cm', '4.8 cm'],
      answer: 3, hint: 'Count whole centimeters, then the small tenth-spaces after the last number.',
      explain: '<ol><li>The ribbon passes the 4, so it has <b>4 whole cm</b>.</li><li>It goes <b>8 small spaces</b> past 4. Each space is 0.1 cm.</li><li>4 + 0.8 = <b>4.8 cm</b>.</li></ol>' },

    { id: 'd15', tag: 'lines', type: 'mc',
      q: 'The number line shows the weights of four cakes, in pounds. Which cake weighs more than 1.7 pounds?',
      fig: G.line({ min: 0, max: 3, minor: 0.1, major: 0.5, lab: 0.5, pts: [['A', 1.4], ['B', 1.9], ['C', 1.6], ['D', 1.1]] }),
      opts: ['Cake A', 'Cake B', 'Cake C', 'Cake D'],
      answer: 1, hint: 'Find 1.7 on the line first. Which point is to its right?',
      explain: '<ol><li>Each small tick is 0.1. The cakes are A = 1.4, B = 1.9, C = 1.6, D = 1.1.</li><li>On a number line, bigger numbers are to the <b>right</b>.</li><li>Only <b>Cake B (1.9)</b> is to the right of 1.7.</li></ol>' },

    { id: 'd16', tag: 'lines', type: 'sort',
      q: 'Is each number less than or greater than 0.6?',
      labels: ['Less than 0.6', 'Greater than 0.6'],
      items: [{ t: '0.59', a: 0 }, { t: '0.7', a: 1 }, { t: '0.06', a: 0 }, { t: '0.65', a: 1 }, { t: '0.5', a: 0 }],
      hint: 'Write 0.6 as 0.60 and line up the decimal points.',
      explain: '<p>0.6 = <b>0.60</b>.</p><ul><li>0.59, 0.06, 0.50 are <b>less</b> than 0.60.</li><li>0.70 and 0.65 are <b>greater</b> than 0.60.</li></ul>' },

    { id: 'd17', tag: 'money', type: 'input',
      q: 'Dottie has 2 one-dollar bills, 3 quarters, 1 nickel, and 4 pennies. How much money is that?',
      fig: G.money({ b: 2, q: 3, n: 1, p: 4 }),
      prefix: '$', answer: 2.84, show: '2.84', hint: 'Quarters are 25¢ each. Add all the cents, then add the dollars.',
      explain: '<ol><li>3 quarters = 75¢, 1 nickel = 5¢, 4 pennies = 4¢.</li><li>75 + 5 + 4 = <b>84 cents</b>.</li><li>2 dollars and 84 cents = <b>$2.84</b>.</li></ol>' },

    { id: 'd18', tag: 'mixed', type: 'mc',
      q: 'Which decimal means “seven and nine hundredths”?',
      opts: ['7.9', '7.09', '7.009', '709'],
      answer: 1, hint: '“And” is the decimal point. Hundredths need 2 places.',
      explain: '<ol><li>“Seven” is the whole number: <b>7</b>.</li><li>“And” means the decimal point.</li><li>“Nine hundredths” is ' + FR(9, 100) + ', so it needs 2 places: <b>.09</b></li><li>Together: <b>7.09</b></li></ol>' },

    { id: 'd19', tag: 'lines', type: 'order',
      q: 'Put the cupcake weights in order from least to greatest.',
      items: ['0.07', '0.17', '0.7', '0.71'],
      hint: 'Line up the points and add zeros: 0.70 and 0.07 look different now!',
      explain: '<p>Write them all with 2 decimal places: 0.07, 0.17, 0.70, 0.71.</p><ol><li><b>0.07</b> (7 hundredths)</li><li><b>0.17</b></li><li><b>0.70</b></li><li><b>0.71</b></li></ol>' }
  ]
};

/* The Learn section's own interactives; bonus-quiz.js calls this from start(). */
function setupLearn({ confetti } = {}){
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  $('#heroBun').innerHTML = bunSVG('idle');
  $('#remBun1').innerHTML = bunSVG('happy');
  $('#remBun2').innerHTML = bunSVG('happy');
  const ONES = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
  const TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  const words = n => n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  const pl = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

  /* cookie tray */
  let tray = 34;
  const TS = 300, TC = 26, TO = 20;
  function drawTray(){
    let s = `<svg viewBox="0 0 ${TS} ${TS}" role="img" aria-label="Cookie tray with ${tray} of 100 cookies"><rect x="4" y="4" width="${TS - 8}" height="${TS - 8}" rx="18" class="trayframe"/>`;
    for (let i = 0; i < 100; i++) {
      const r = Math.floor(i / 10), c = i % 10, cx = TO + 6 + c * TC, cy = TO + 6 + r * TC;
      if (i < tray) s += `<circle cx="${cx}" cy="${cy}" r="11" class="on"/><circle cx="${cx - 4}" cy="${cy - 3}" r="1.8" class="chipdot"/><circle cx="${cx + 3}" cy="${cy + 3}" r="1.8" class="chipdot"/><circle cx="${cx + 4}" cy="${cy - 4}" r="1.4" class="chipdot"/>`;
      else s += `<circle cx="${cx}" cy="${cy}" r="10" class="ck"/>`;
    }
    $('#traySvg').innerHTML = s + '</svg>';
    const t = Math.floor(tray / 10), h = tray % 10;
    const dec = (tray / 100).toFixed(2);
    $('#trayOut').innerHTML = tray === 100
      ? `<p class="bignum">1.00</p><p class="eq">${FR(100, 100)} = 1 whole tray!</p><p>10 tenths = 100 hundredths = <b>1</b></p>`
      : `<p class="bignum">${dec}</p><p class="eq">= ${FR(tray, 100)}</p><p><b>${pl(t, 'tenth')}</b> and <b>${pl(h, 'hundredth')}</b></p><p class="small">Say it: “${words(tray)} hundredth${tray === 1 ? '' : 's'}”${h === 0 && t ? ` · same as ${(t / 10).toFixed(1)}` : ''}</p>`;
  }
  $('#traySvg').addEventListener('click', e => {
    const svg = $('#traySvg svg'), b = svg.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width * TS, y = (e.clientY - b.top) / b.height * TS;
    const c = Math.min(9, Math.max(0, Math.floor((x - TO + TC / 2 - 6) / TC))), r = Math.min(9, Math.max(0, Math.floor((y - TO + TC / 2 - 6) / TC)));
    const n = r * 10 + c + 1; tray = tray === n ? n - 1 : n; drawTray();
  });
  $$('[data-tray]').forEach(b => b.addEventListener('click', () => {
    const d = +b.dataset.tray; tray = d === 0 ? 0 : Math.max(0, Math.min(100, tray + d)); drawTray();
  }));
  drawTray();

  /* mixed numbers */
  const MIX = [[18, 4, 100], [36, 7, 10], [14, 6, 100], [5, 60, 100], [9, 3, 10], [2, 45, 100]];
  $('#mixChips').innerHTML = MIX.map((m, i) => `<button type="button" class="chipbtn" data-m="${i}" aria-pressed="false">${F(...m)}</button>`).join('');
  function showMix(i){
    const [w, n, d] = MIX[i];
    const after = d === 10 ? String(n) : String(n).padStart(2, '0');
    const dec = w + '.' + after;
    const ws = String(w).padStart(2, ' ');
    const tens = w >= 10 ? ws[0] : '', ones = ws[1];
    const t = after[0], h = after[1] || '';
    $$('#mixChips .chipbtn').forEach(b => b.setAttribute('aria-pressed', +b.dataset.m === i));
    const note = d === 10
      ? `Out of <b>10</b> means <b>tenths</b>, so ${n} goes in the tenths place. One digit after the point.`
      : n < 10 ? `Out of <b>100</b> means <b>hundredths</b>. ${n} hundredths has no tenths, so a <b>0</b> holds the tenths place.`
      : `Out of <b>100</b> means <b>hundredths</b>. ${n} hundredths = ${t} tenths and ${h} hundredths.`;
    $('#mixOut').innerHTML = `<p class="eq" style="text-align:center;font-size:1.8rem;margin:14px 0 4px">${F(w, n, d)} = <span style="color:var(--accent-text)">${dec}</span></p>
      <table class="pvtable" aria-label="Place value chart"><tr><th>Tens</th><th>Ones</th><th></th><th>Tenths</th><th>Hundredths</th></tr>
      <tr><td><span class="dig static" style="display:grid;place-items:center">${tens}</span></td><td><span class="dig static" style="display:grid;place-items:center">${ones}</span></td><td class="pvdot">.</td>
      <td><span class="dig static dec" style="display:grid;place-items:center">${t}</span></td><td><span class="dig static dec" style="display:grid;place-items:center">${h}</span></td></tr></table>
      <p style="text-align:center">${note}</p>`;
  }
  $$('#mixChips .chipbtn').forEach(b => b.addEventListener('click', () => showMix(+b.dataset.m)));
  showMix(0);

  /* tip jar */
  const VAL = { bill: 100, q: 25, d: 10, n: 5, p: 1 }, NAME = { bill: 'Dollar', q: 'Quarter', d: 'Dime', n: 'Nickel', p: 'Penny' };
  let jar = [];
  $('#coinBtns').innerHTML = Object.keys(VAL).map(k => `<button type="button" class="coinbtn" data-c="${k}">${G.coin(k)}<span>${NAME[k]}</span></button>`).join('');
  function drawJar(){
    const order = ['bill', 'q', 'd', 'n', 'p'];
    const sorted = jar.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b));
    $('#pile').innerHTML = sorted.length ? sorted.map(G.coin).join('') : '<span class="empty">The jar is empty.</span>';
    const c = jar.reduce((s, k) => s + VAL[k], 0), d = Math.floor(c / 100), r = c % 100;
    $('#bankOut').innerHTML = `<p class="bignum">$${(c / 100).toFixed(2)}</p>
      <p class="eq">= ${r ? F(d, r, 100) : d} dollar${c === 100 ? '' : 's'}</p>
      <p>${pl(d, 'one')}, ${pl(Math.floor(r / 10), 'tenth')}, and ${pl(r % 10, 'hundredth')}</p>`;
  }
  $$('.coinbtn').forEach(b => b.addEventListener('click', () => { if (jar.length < 30) jar.push(b.dataset.c); drawJar(); }));
  $('#bankClear').addEventListener('click', () => { jar = []; drawJar(); });
  jar = ['bill', 'bill', 'bill', 'bill', 'd', 'd', 'n', 'p', 'p', 'p']; drawJar();

  /* place value */
  const PLACES = [['hundred-thousands', 100000, '100,000'], ['ten-thousands', 10000, '10,000'], ['thousands', 1000, '1,000'], ['hundreds', 100, '100'], ['tens', 10, '10'], ['ones', 1, '1'], ['tenths', 0.1, '0.1'], ['hundredths', 0.01, '0.01']];
  const NUMS = ['466,334.44', '24.7', '53.47', '733,448.33'];
  let pvNum = 0, pvSel = -1;
  $('#pvChips').innerHTML = NUMS.map((n, i) => `<button type="button" class="chipbtn" data-n="${i}" aria-pressed="false">${n}</button>`).join('');
  function digitsOf(s){
    const [a, b = ''] = s.replace(/,/g, '').split('.');
    const out = [];
    a.split('').forEach((d, i) => out.push({ d: +d, p: 6 - a.length + i }));
    b.split('').forEach((d, i) => out.push({ d: +d, p: 6 + i }));
    return out;
  }
  function fmtVal(v){ return v >= 1 ? v.toLocaleString('en-US') : String(+v.toFixed(2)); }
  function drawPV(){
    const D = digitsOf(NUMS[pvNum]);
    $$('#pvChips .chipbtn').forEach(b => b.setAttribute('aria-pressed', +b.dataset.n === pvNum));
    const first = D[0].p;
    const cols = D.map((x, i) => ({ ...x, i }));
    let head = '', row = '';
    cols.forEach((c, k) => {
      if (PLACES[c.p][0] === 'tenths') { head += '<th></th>'; row += '<td class="pvdot">.</td>'; }
      head += `<th scope="col">${PLACES[c.p][0]}</th>`;
      const sel = k === pvSel, nbr = pvSel >= 0 && Math.abs(k - pvSel) === 1 && cols[pvSel].d === c.d;
      row += `<td><button type="button" class="dig ${c.p >= 6 ? 'dec' : ''} ${nbr ? 'nbr' : ''}" data-k="${k}" aria-pressed="${sel}" aria-label="${c.d} in the ${PLACES[c.p][0]} place">${c.d}</button></td>`;
    });
    $('#pvChart').innerHTML = `<table class="pvtable"><tr>${head}</tr><tr>${row}</tr></table>`;
    $$('#pvChart .dig').forEach(b => b.addEventListener('click', () => { pvSel = +b.dataset.k; drawPV(); }));
    $('#pvExp').innerHTML = cols.filter(c => c.d !== 0).map(c => `<span class="${c.i === pvSel ? 'hl' : ''}">(${c.d} × ${PLACES[c.p][2]})</span>`).join(' + ');
    if (pvSel < 0) { $('#pvInfo').innerHTML = 'Tap a digit in the chart.'; return; }
    const c = cols[pvSel], pn = PLACES[c.p][0], v = c.d * PLACES[c.p][1];
    let msg = `This <b>${c.d}</b> is in the <b>${pn}</b> place. Its value is ${c.d} × ${PLACES[c.p][2]} = <b>${fmtVal(v)}</b>.`;
    const L = cols[pvSel - 1], R = cols[pvSel + 1];
    if (R && R.d === c.d) msg += `<br>The ${c.d} to its right is worth ${fmtVal(R.d * PLACES[R.p][1])}, so this one is <b>10 times</b> as much.`;
    else if (L && L.d === c.d) msg += `<br>The ${c.d} to its left is worth ${fmtVal(L.d * PLACES[L.p][1])}, which is <b>10 times</b> this one.`;
    else msg += '<br>The place to its left is worth 10 times as much; the place to its right is worth one tenth as much.';
    $('#pvInfo').innerHTML = msg;
  }
  $$('#pvChips .chipbtn').forEach(b => b.addEventListener('click', () => { pvNum = +b.dataset.n; pvSel = -1; drawPV(); }));
  drawPV();

  /* carrot hop */
  const TARGETS = [0.3, 0.73, 0.5, 0.08, 0.91, 0.45, 0.6, 0.27];
  let ti = 0;
  const hr = $('#hopRange');
  function drawHop(){
    const v = +hr.value / 100, w = 640, pad = 24, X = pad + v * (w - 2 * pad);
    let svg = G.line({ min: 0, max: 1, minor: 0.01, major: 0.05, lab: 0.1, fs: 13 });
    svg = svg.replace('</svg>', `<text x="${X}" y="12" font-size="26" text-anchor="middle">🐰</text><path d="M${X - 5} 16l5 7 5-7z" fill="var(--accent)"/></svg>`).replace('viewBox="0 0 640 60"', 'viewBox="0 -18 640 78"');
    $('#hopLine').innerHTML = svg;
    $('#hopNow').textContent = G.fmt(v);
    $('#hopTarget').textContent = G.fmt(TARGETS[ti]);
  }
  hr.addEventListener('input', () => { $('#hopFb').textContent = ''; $('#hopFb').className = 'hopfb'; drawHop(); });
  $('#hopBtn').addEventListener('click', () => {
    const v = +hr.value, t = Math.round(TARGETS[ti] * 100), f = $('#hopFb');
    if (v === t) {
      f.className = 'hopfb good'; f.innerHTML = `<b>Carrot found!</b> ${G.fmt(t / 100)} is ${pl(Math.floor(t / 10), 'tenth')} and ${pl(t % 10, 'hundredth')}. Next target!`;
      if (confetti) confetti($('#hopBtn'));
      ti = (ti + 1) % TARGETS.length; drawHop();
    } else {
      f.className = 'hopfb oops'; f.innerHTML = `Dottie is at ${G.fmt(v / 100)}. That’s ${v < t ? 'less' : 'more'} than ${G.fmt(t / 100)}, so hop ${v < t ? 'right' : 'left'}. Each tiny tick is 0.01.`;
    }
  });
  drawHop();
  $('#rulerDemo').innerHTML = `<div class="fig" style="padding:6px">${G.ruler(5, 3.6)}</div><p class="small" style="margin:0">The ribbon is 3 whole cm and 6 small spaces: <b>3.6 cm</b>.</p>`;
}

DECIMAL_BAKERY.setupLearn = setupLearn;

export default DECIMAL_BAKERY;
