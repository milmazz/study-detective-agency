/*
  Fraction practice: Berry’s page. Round 1, kawaii strawberry theme.

  Ported unchanged from the stand-alone practice page: the helpers and the
  question list (Q) below are pure -- they build SVG and HTML strings and
  touch no DOM -- so importing this module has no side effects and
  test/bonus-pages.test.js can check the answer key directly. Everything
  that reads or writes the page runs inside start().
*/
/* ---------- helpers ---------- */
const F = s => s.replace(/\{(?:(\d+) )?(\d+)\/(\d+)\}/g, (m, w, n, d) =>
  (w ? `<span class="whole">${w}</span>` : '') + `<span class="fr"><span>${n}</span><span>${d}</span></span>`);

function berry(cls=''){
  return `<svg class="berry ${cls}" viewBox="0 0 100 110" aria-hidden="true">
    <path d="M50 26 C40 10 24 12 18 20 C30 20 38 24 44 30 Z" fill="#45C08A"/>
    <path d="M50 26 C60 10 76 12 82 20 C70 20 62 24 56 30 Z" fill="#45C08A"/>
    <path d="M50 30 C46 18 48 10 52 6 C56 12 56 20 50 30 Z" fill="#37A877"/>
    <path d="M50 26 C80 23 95 40 90 62 C85 86 66 103 50 105 C34 103 15 86 10 62 C5 40 20 23 50 26 Z" fill="#FF4F80"/>
    <g fill="#FFE6A6"><ellipse cx="28" cy="44" rx="2" ry="3"/><ellipse cx="72" cy="44" rx="2" ry="3"/><ellipse cx="50" cy="40" rx="2" ry="3"/>
      <ellipse cx="22" cy="72" rx="2" ry="3"/><ellipse cx="78" cy="72" rx="2" ry="3"/><ellipse cx="38" cy="90" rx="2" ry="3"/><ellipse cx="62" cy="90" rx="2" ry="3"/><ellipse cx="50" cy="96" rx="2" ry="3"/></g>
    <ellipse cx="29" cy="70" rx="7" ry="4.5" fill="#FFA3C2"/><ellipse cx="71" cy="70" rx="7" ry="4.5" fill="#FFA3C2"/>
    <circle cx="38" cy="60" r="5" fill="#3B1733"/><circle cx="62" cy="60" r="5" fill="#3B1733"/>
    <circle cx="39.8" cy="58.2" r="1.7" fill="#fff"/><circle cx="63.8" cy="58.2" r="1.7" fill="#fff"/>
    <path d="M44 69 Q50 76 56 69" fill="none" stroke="#3B1733" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

function numberLine({min=0, max, parts, points=[], w=340, tickLabels=false, jump=null}){
  const pad=20, base = jump ? 64 : 40, h = jump ? 104 : 80;
  const X = v => pad + (v-min)/(max-min)*(w-2*pad);
  let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" role="img" aria-label="Number line from ${min} to ${max}">`;
  s += `<line class="axis" x1="${X(min)}" y1="${base}" x2="${X(max)}" y2="${base}"/>`;
  for(let k=min*parts; k<=max*parts; k++){
    const v=k/parts, x=X(v).toFixed(1), whole=k%parts===0, t=whole?10:6;
    s += `<line class="tick" x1="${x}" y1="${base-t}" x2="${x}" y2="${base+t}"/>`;
    if(whole) s += `<text x="${x}" y="${base+30}" text-anchor="middle" class="tl big">${v}</text>`;
    else if(tickLabels){ const W=Math.floor(k/parts), r=k%parts;
      s += `<text x="${x}" y="${base+25}" text-anchor="middle" class="tl sm">${W?W+' ':''}${r}/${parts}</text>`; }
  }
  if(jump){ const a=X(jump.from), b=X(jump.to), m=(a+b)/2;
    s += `<path class="jump" d="M${a} ${base-6} Q${m} ${base-62} ${b} ${base-6}"/>`;
    s += `<text x="${m}" y="${base-40}" text-anchor="middle" class="tl jl">${jump.l}</text>`; }
  points.forEach(p => { const x=X(p.v);
    s += `<circle class="pt" cx="${x}" cy="${base}" r="7"/>`;
    s += `<text x="${x}" y="${jump?base+30:base-16}" text-anchor="middle" class="tl pl">${p.l}</text>`; });
  return s + '</svg>';
}

function pie(n, sh, size=110, clock=false){
  const c=size/2, r=c-3;
  let o = `<svg viewBox="0 0 ${size} ${size}" width="${size}" role="img" aria-label="Circle cut into ${n} equal parts, ${sh} shaded">`;
  for(let i=0;i<n;i++){
    const a0=(-90+i*360/n)*Math.PI/180, a1=(-90+(i+1)*360/n)*Math.PI/180;
    o += `<path class="cell ${i<sh?'sh':'em'}" d="M${c} ${c} L${(c+r*Math.cos(a0)).toFixed(2)} ${(c+r*Math.sin(a0)).toFixed(2)} A${r} ${r} 0 0 1 ${(c+r*Math.cos(a1)).toFixed(2)} ${(c+r*Math.sin(a1)).toFixed(2)} Z"/>`;
  }
  if(clock) for(let i=1;i<=12;i++){ const a=(-90+i*30)*Math.PI/180;
    o += `<text class="tl clk" x="${(c+r*.8*Math.cos(a)).toFixed(1)}" y="${(c+r*.8*Math.sin(a)+5).toFixed(1)}" text-anchor="middle">${i}</text>`; }
  return o + '</svg>';
}

function bar(n, sh, {w=200, h=32, half=false}={}){
  const cw=w/n, pad=half?8:2;
  let o = `<svg viewBox="0 0 ${w+4} ${h+pad*2}" width="${w+4}" role="img" aria-label="Bar cut into ${n} equal parts, ${sh} shaded">`;
  for(let i=0;i<n;i++) o += `<rect class="cell ${i<sh?'sh':'em'}" x="${2+i*cw}" y="${pad}" width="${cw}" height="${h}"/>`;
  if(half) o += `<line class="half" x1="${2+w/2}" y1="0" x2="${2+w/2}" y2="${h+pad*2}"/>`;
  return o + '</svg>';
}
function grid(r, c, set, cell=30){
  let o = `<svg viewBox="0 0 ${c*cell+4} ${r*cell+4}" width="${c*cell+4}" role="img" aria-label="${r*c} squares, ${set.length} shaded">`;
  for(let i=0;i<r*c;i++) o += `<rect class="cell ${set.includes(i)?'sh':'em'}" x="${2+(i%c)*cell}" y="${2+Math.floor(i/c)*cell}" width="${cell}" height="${cell}"/>`;
  return o + '</svg>';
}
const bars3 = (arr, n) => `<div class="b3">${arr.map(s => bar(n, s, {w:n===4?68:84, h:24})).join('<span class="plus">+</span>')}</div>`;
const br = (label, n, s, opts={}) => `<div class="br"><span class="bl">${F(label)}</span>${bar(n, s, {w:200, h:28, ...opts})}</div>`;
const stack = (...rows) => `<div class="stack">${rows.join('')}</div>`;
const table = (head, rows) => `<table class="data"><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${F(c)}</td>`).join('')}</tr>`).join('')}</table>`;
const fig = (...items) => `<div class="fig">${items.join('')}</div>`;
const pz = (svg, cap) => `<figure>${svg}<figcaption>${cap}</figcaption></figure>`;

const HALF = [{v:'gt', l:'Greater than {1/2}'}, {v:'lt', l:'Less than {1/2}'}, {v:'eq', l:'Equal to {1/2}'}];
const SYM  = [{v:'<', l:'<', big:true}, {v:'>', l:'>', big:true}, {v:'=', l:'=', big:true}];
const CI   = [{v:'c', l:'Correct'}, {v:'i', l:'Incorrect'}];

/* ---------- questions ---------- */
const Q = [
{ prompt:'The table shows the average time spent on four hiking trails. <b>Which trail is best shown by point S?</b>',
  figure: fig(table(['Trail','Time (hours)'], [['Cedar Trail','{1 1/4}'],['Oak Trail','{2 3/4}'],['Pine Trail','{1 3/4}'],['Maple Trail','{1 1/2}']]),
              numberLine({max:3, parts:4, points:[{v:1.5, l:'S'}]})),
  type:'single', answer:['D'],
  options:[
    {k:'A', t:'Cedar Trail', why:'Cedar is {1 1/4}. That would be just 1 tick after the 1. S is 2 ticks after the 1.'},
    {k:'B', t:'Oak Trail', why:'Oak is {2 3/4}, which is past the 2. S sits between 1 and 2.'},
    {k:'C', t:'Pine Trail', why:'Pine is {1 3/4}. That would be 3 ticks after the 1. Count again from 1: S is only 2 ticks away.'},
    {k:'D', t:'Maple Trail'}],
  yay:'Yes! S is at {1 1/2}, and that’s Maple Trail.',
  steps:[
    {t:'Look at the space between 0 and 1. It’s cut into 4 equal jumps, so each tick mark is {1/4}.', v:numberLine({max:2, parts:4, tickLabels:true, points:[{v:1.5,l:'S'}]})},
    {t:'Start at 1 and count the ticks to S: 1 jump, 2 jumps. So S is 1 and {2/4}.'},
    {t:'{2/4} is the same as {1/2} (2 out of 4 is half). So S = {1 1/2}. Maple Trail is {1 1/2} hours. 🎉'}]},

{ prompt:'Is each sum or difference greater than, less than, or equal to {1/2}? Pick one answer in each row.',
  type:'grid', cols:HALF,
  rows:[
    {e:'{2/9} + {3/9}', a:'gt', why:'2 + 3 = 5, so it’s {5/9}. Half of 9 is 4½, and 5 is more than that.'},
    {e:'{5/8} − {2/8}', a:'lt', why:'5 − 2 = 3, so it’s {3/8}. Half of 8 is 4, and 3 is less than 4.'},
    {e:'{11/12} − {4/12}', a:'gt', why:'11 − 4 = 7, so it’s {7/12}. Half of 12 is 6, and 7 is more than 6.'},
    {e:'{1/6} + {2/6}', a:'eq', why:'1 + 2 = 3, so it’s {3/6}. Half of 6 is exactly 3!'}],
  yay:'All four right! You did the math and compared to one half like a pro.',
  steps:[
    {t:'The top number is the <b>numerator</b>. The bottom number is the <b>denominator</b>. When the denominators match, just add or subtract the numerators. The denominator stays the same.'},
    {t:'To compare with {1/2}, find half of the denominator. If the numerator is bigger, the fraction is greater than {1/2}. If it’s smaller, it’s less. If it’s the same, it’s equal. The green line shows half.'},
    {t:'{2/9} + {3/9} = {5/9}. Half of 9 is 4½. 5 is bigger → <b>greater than {1/2}</b>.', v:fig(bar(9,5,{w:216,half:true}))},
    {t:'{5/8} − {2/8} = {3/8}. Half of 8 is 4. 3 is smaller → <b>less than {1/2}</b>.', v:fig(bar(8,3,{w:216,half:true}))},
    {t:'{11/12} − {4/12} = {7/12}. Half of 12 is 6. 7 is bigger → <b>greater than {1/2}</b>.', v:fig(bar(12,7,{w:216,half:true}))},
    {t:'{1/6} + {2/6} = {3/6}. Half of 6 is 3 → <b>equal to {1/2}</b>.', v:fig(bar(6,3,{w:216,half:true}))}]},

{ prompt:'Maya practiced cycling. On Monday she rode {7/8} mile. On Tuesday she rode {5/6} mile. Maya thinks she rode about 2 miles altogether. <b>Is her estimate reasonable?</b>',
  type:'single', answer:['A'],
  options:[
    {k:'A', t:'Yes, both fractions are close to 1, so the sum is close to 2.'},
    {k:'B', t:'No, both fractions are close to 0, so the sum is close to 0.', why:'{7/8} and {5/6} are almost full. Only 1 small piece is missing from each, so they’re close to 1, not 0.'},
    {k:'C', t:'No, the sum is closer to {1/2} than to 2.', why:'Each fraction by itself is already more than {1/2}, so adding them gives way more than {1/2}.'},
    {k:'D', t:'Yes, because both fractions are exactly 1.', why:'Close to 1 isn’t the same as exactly 1. {7/8} is still 1 piece short of a whole.'}],
  yay:'Right! About 1 + about 1 = about 2.',
  steps:[
    {t:'{7/8}: 8 pieces, 7 filled. Only 1 tiny piece is missing, so it’s <b>close to 1</b>.', v:fig(bar(8,7,{w:216}))},
    {t:'{5/6}: 6 pieces, 5 filled. Only 1 piece is missing, so it’s also <b>close to 1</b>.', v:fig(bar(6,5,{w:216}))},
    {t:'About 1 + about 1 = about 2. Maya’s estimate makes sense! (The real total is a little less than 2, but it’s close.)'}]},

{ prompt:'Two points are shown on the number line. <b>Which TWO equations find the distance between X and Y?</b>',
  figure: fig(numberLine({max:2, parts:10, points:[{v:.4,l:'X'},{v:1.3,l:'Y'}]})),
  type:'multi', pick:2, answer:['A','C'],
  options:[
    {k:'A', t:'{13/10} − {4/10} = {9/10}'},
    {k:'B', t:'{13/10} − {5/10} = {8/10}', why:'Check X again: it’s 4 ticks from 0, so X is {4/10}, not {5/10}.'},
    {k:'C', t:'{4/10} + {9/10} = {13/10}'},
    {k:'D', t:'{13/10} + {4/10} = {17/10}', why:'Adding X and Y makes a bigger number. Distance means how far apart they are, so we subtract (or count up from X).'},
    {k:'E', t:'{9/10} − {4/10} = {5/10}', why:'Y isn’t {9/10}. Y is past the 1, at 13 ticks, so it’s {13/10}.'}],
  yay:'Yes! Subtracting and counting up both find the 9 jumps between X and Y.',
  steps:[
    {t:'Between 0 and 1 there are 10 jumps, so each tick is {1/10}.'},
    {t:'X is 4 ticks from 0 → {4/10}. Y is 10 ticks to get to 1, plus 3 more = 13 ticks → {13/10}.'},
    {t:'Count the jumps from X to Y: there are 9. So the distance is {9/10}.', v:numberLine({max:2, parts:10, points:[{v:.4,l:'X'},{v:1.3,l:'Y'}], jump:{from:.4, to:1.3, l:'9 jumps = 9/10'}})},
    {t:'Two ways to write it: take away, {13/10} − {4/10} = {9/10} (A), or count up from X, {4/10} + {9/10} = {13/10} (C).'}]},

{ prompt:'Two students ate parts of their pizzas, as shown. <b>Which TWO comparisons are correct?</b>',
  figure: fig(pz(pie(8,5,120),'Avery'), pz(pie(4,3,120),'Jordan')),
  type:'multi', pick:2, answer:['A','C'],
  options:[
    {k:'A', t:'{5/8} < {3/4}'},
    {k:'B', t:'{5/8} > {3/4}', why:'Avery ate less than Jordan. The > sign means “is bigger than,” so this one is backwards.'},
    {k:'C', t:'{3/4} > {5/8}'},
    {k:'D', t:'{3/4} = {5/8}', why:'They aren’t the same. Look at the pizzas: Jordan’s has more shaded.'},
    {k:'E', t:'{3/4} < {5/8}', why:'{3/4} is the bigger amount, so it can’t be less than {5/8}.'}],
  yay:'Perfect! Both say the same thing, just flipped around.',
  steps:[
    {t:'Avery: 8 slices, 5 shaded → {5/8}. Jordan: 4 slices, 3 shaded → {3/4}.'},
    {t:'Cut each of Jordan’s slices in half. Now there are 8 slices and 6 are shaded, so {3/4} = {6/8}.', v:fig(pz(pie(8,5,100), F('{5/8}')), pz(pie(8,6,100), F('{6/8}')))},
    {t:'{5/8} is less than {6/8}. So {5/8} < {3/4} (A) and {3/4} > {5/8} (C).'},
    {t:'Tip: the open side of < or > always faces the bigger number.'}]},

{ prompt:'Choose <, >, or = for each pair.',
  type:'grid', cols:SYM, slot:true,
  rows:[
    {e:'{4/12} %s {1/3}', a:'=', why:'Multiply the numerator and denominator of {1/3} by 4 and you get {4/12}. Same amount!'},
    {e:'{5/6} %s {3/4}', a:'>', why:'{5/6} is missing {1/6}, and {3/4} is missing {1/4}. Sixths are smaller pieces, so {5/6} is missing less. That makes it bigger.'},
    {e:'{2/5} %s {4/10}', a:'=', why:'Double the top and bottom of {2/5}: 2×2 = 4 and 5×2 = 10. That’s {4/10}.'}],
  yay:'All three correct! Equal fractions and the missing-piece trick, nice.',
  steps:[
    {t:'{4/12} and {1/3}: multiply the numerator and denominator of {1/3} by 4 → {4/12}. The bars are the same length, so they’re <b>equal</b>.', v:fig(stack(br('{4/12}',12,4), br('{1/3}',3,1)))},
    {t:'{5/6} and {3/4}: use the missing-piece trick. {5/6} is missing one small sixth. {3/4} is missing one bigger fourth. Less missing means more left, so {5/6} <b>&gt;</b> {3/4}.', v:fig(stack(br('{5/6}',6,5), br('{3/4}',4,3)))},
    {t:'{2/5} and {4/10}: multiply top and bottom of {2/5} by 2 → {4/10}. They’re <b>equal</b>.', v:fig(stack(br('{2/5}',5,2), br('{4/10}',10,4)))}]},

{ prompt:'Elijah walked these distances: Monday {3/4} mile, Tuesday {4/8} mile, Wednesday {5/6} mile, Thursday {2/3} mile. <b>Is each comparison correct or incorrect?</b>',
  type:'grid', cols:CI,
  rows:[
    {e:'{3/4} > {4/8}', a:'c', why:'{4/8} is exactly half. {3/4} is more than half, so this is correct.'},
    {e:'{5/6} = {2/3}', a:'i', why:'{2/3} is the same as {4/6}. {5/6} is more than {4/6}, so they aren’t equal.'},
    {e:'{2/3} > {3/4}', a:'i', why:'{2/3} is missing {1/3}, and {3/4} is missing only {1/4}. Thirds are bigger pieces, so {2/3} is missing more and is the smaller one.'},
    {e:'{5/6} > {4/8}', a:'c', why:'{4/8} is exactly half, and {5/6} is way more than half. Correct!'}],
  yay:'You got all four! Comparing to one half really helps here.',
  steps:[
    {t:'{4/8} is exactly {1/2}. Both {3/4} and {5/6} are more than half, so rows 1 and 4 are <b>correct</b>.', v:fig(stack(br('{4/8}',8,4), br('{3/4}',4,3), br('{5/6}',6,5)))},
    {t:'{5/6} = {2/3}? Change {2/3} to sixths: {2/3} = {4/6}. {5/6} is bigger, so they’re not equal → <b>incorrect</b>.', v:fig(stack(br('{5/6}',6,5), br('{2/3}',3,2)))},
    {t:'{2/3} > {3/4}? Look at the bars: {3/4} is longer. So {2/3} is smaller → <b>incorrect</b>.', v:fig(stack(br('{2/3}',3,2), br('{3/4}',4,3)))}]},

{ prompt:'A baker needs <b>at least</b> {2/3} cup of milk. <b>Which TWO containers have enough milk?</b>',
  figure: fig(table(['Container','Amount (cups)'], [['A','{3/8}'],['B','{5/6}'],['C','{4/9}'],['D','{7/8}'],['E','{1/2}']])),
  type:'multi', pick:2, answer:['B','D'],
  options:[
    {k:'A', t:'Container A', why:'{3/8} is less than half (half of 8 is 4). The baker needs more than half.'},
    {k:'B', t:'Container B'},
    {k:'C', t:'Container C', why:'{4/9} is less than half (half of 9 is 4½). Not enough.'},
    {k:'D', t:'Container D'},
    {k:'E', t:'Container E', why:'{1/2} is less than {2/3}. “At least {2/3}” means {2/3} or more.'}],
  yay:'Yes! B and D both have more than {2/3} cup.',
  steps:[
    {t:'“At least {2/3}” means {2/3} or more. {2/3} is more than half, so anything that is half or less is not enough. So A ({3/8}), C ({4/9}), and E ({1/2}) are out.'},
    {t:'B: {2/3} is the same as {4/6}. {5/6} is more than {4/6} ✔', v:fig(stack(br('{2/3}',3,2), br('{5/6}',6,5)))},
    {t:'D: {7/8} is missing only one tiny eighth. {2/3} is missing a whole third. So {7/8} is more ✔', v:fig(stack(br('{2/3}',3,2), br('{7/8}',8,7)))}]},

{ prompt:'<b>Select TWO equations that show equivalent fractions.</b>',
  type:'multi', pick:2, answer:['A','D'],
  options:[
    {k:'A', t:'{2/5} = {8/20}'},
    {k:'B', t:'{1 2/3} = {6/3}', why:'1 whole is {3/3}. Add {2/3} and you get {5/3}, not {6/3}.'},
    {k:'C', t:'{3/4} = {9/16}', why:'You have to multiply the top and bottom by the same number. 3×3 = 9, so the bottom should be 4×3 = 12. {3/4} = {9/12}.'},
    {k:'D', t:'{2 1/4} = {9/4}'},
    {k:'E', t:'{4/6} = {4/8}', why:'Same top number, but eighths are smaller pieces than sixths. So {4/8} is less than {4/6}.'}],
  yay:'Correct! {2/5} = {8/20} and {2 1/4} = {9/4}.',
  steps:[
    {t:'Equivalent fractions show the <b>same amount</b> with different-sized pieces. To make one, multiply the numerator AND the denominator by the same number.'},
    {t:'A: {2/5} → multiply top and bottom by 4 → {8/20} ✔'},
    {t:'D: each whole has 4 fourths. 2 wholes = {8/4}, plus {1/4} more = {9/4} ✔', v:fig(bars3([4,4,1],4))},
    {t:'B is a trap: {1 2/3} is {3/3} + {2/3} = {5/3}.'}]},

{ prompt:'The model is shaded to show a fraction. <b>Which model shows an equivalent fraction?</b>',
  figure: fig(grid(1,4,[0],36)),
  type:'single', answer:['B'], visual:true,
  options:[
    {k:'A', v:grid(2,3,[0,4]), why:'This is 2 out of 6 = {2/6}, which equals {1/3}. Thirds are bigger than fourths.'},
    {k:'B', v:grid(2,4,[0,4])},
    {k:'C', v:grid(3,3,[0,4,8]), why:'This is 3 out of 9 = {3/9}, which equals {1/3}, not {1/4}.'},
    {k:'D', v:grid(2,4,[0,1,2]), why:'This is 3 out of 8 = {3/8}. That’s more than {1/4} ({1/4} = {2/8}).'}],
  yay:'Yes! {2/8} is the same as {1/4}.',
  steps:[
    {t:'The top model has 4 squares with 1 shaded → {1/4}.'},
    {t:'For {1/4}, the total should be 4 times the shaded squares.'},
    {t:'B: 2 shaded, 8 total. 2 × 4 = 8 ✔ So {2/8} = {1/4}.', v:fig(grid(2,4,[0,4]))},
    {t:'A is {2/6}: 2 × 4 = 8, not 6. C is {3/9}: 3 × 4 = 12, not 9. D is {3/8}: 3 × 4 = 12, not 8.'}]},

{ prompt:'<b>Select TWO equations that correctly decompose {7/5}.</b>',
  type:'multi', pick:2, answer:['A','D'],
  options:[
    {k:'A', t:'{1/5} + {1/5} + {1/5} + {1/5} + {1/5} + {1/5} + {1/5}'},
    {k:'B', t:'{1/5} + {2/5} + {3/5}', why:'1 + 2 + 3 = 6, so this makes {6/5}, not {7/5}.'},
    {k:'C', t:'{1/5} + {1/5} + {1/5} + {1/5} + {1/5}', why:'Count them: only five {1/5}s. That’s {5/5}. We need seven.'},
    {k:'D', t:'{2/5} + {5/5}'},
    {k:'E', t:'{3/5} + {3/5}', why:'3 + 3 = 6, so this makes {6/5}.'}],
  yay:'Right! Both add up to {7/5}.',
  steps:[
    {t:'Decompose means break a fraction into smaller parts that add back up to it.'},
    {t:'All the parts are fifths, so just add the numerators. You need them to add to 7.'},
    {t:'A: seven {1/5}s → 1+1+1+1+1+1+1 = 7 ✔'},
    {t:'D: 2 + 5 = 7 ✔', v:fig(bars3([2,5],5))},
    {t:'B and E add to 6, and C adds to 5.'}]},

{ prompt:'<b>Which expression shows the total shaded amount in the three fraction circles?</b>',
  figure: fig(pie(8,8,96), pie(8,8,96), pie(8,5,96)),
  type:'single', answer:['B'],
  options:[
    {k:'A', t:'{8/8} + {5/8}', why:'There are three circles, so three fractions need to be added.'},
    {k:'B', t:'{8/8} + {8/8} + {5/8}'},
    {k:'C', t:'{8/8} + {8/8} + {3/8}', why:'Count the shaded slices in the last circle again: 5 are shaded. The 3 are the white ones!'},
    {k:'D', t:'{8/8} + {8/8} + {8/8}', why:'The last circle isn’t fully shaded. Some slices are white.'}],
  yay:'Yes! Two full circles plus {5/8}.',
  steps:[
    {t:'Each circle has 8 slices, so we use eighths.'},
    {t:'Circle 1: all 8 shaded → {8/8}. Circle 2: all 8 shaded → {8/8}. Circle 3: count the shaded ones → 5 → {5/8}.'},
    {t:'Total: {8/8} + {8/8} + {5/8}. That’s 2 whole circles and {5/8} more, or {2 5/8}.'}]},

{ prompt:'<b>Which TWO models show {2/6} + {3/6} + {1/6}?</b>',
  type:'multi', pick:2, answer:['A','C'], visual:true,
  options:[
    {k:'A', v:bars3([2,3,1],6)},
    {k:'B', v:bars3([1,4,1],6), why:'This shows {1/6} + {4/6} + {1/6}. Same total, but not the parts we need.'},
    {k:'C', v:bars3([2,3,1],6)},
    {k:'D', v:bars3([2,2,2],6), why:'This shows {2/6} + {2/6} + {2/6}.'},
    {k:'E', v:bars3([1,2,2],6), why:'This shows {1/6} + {2/6} + {2/6}.'}],
  yay:'Correct! Both show 2, then 3, then 1 sixths.',
  steps:[
    {t:'Each bar has 6 parts, so each part is {1/6}.'},
    {t:'We need: first bar 2 shaded, second bar 3 shaded, third bar 1 shaded.', v:fig(bars3([2,3,1],6))},
    {t:'A and C match. B is tricky: it also adds up to {6/6}, but its parts are 1, 4, 1.'}]},

{ prompt:'Lena decomposed {8/4} into three parts. <b>Which TWO models show a total of {8/4}?</b>',
  type:'multi', pick:2, answer:['A','C'], visual:true,
  options:[
    {k:'A', v:bars3([4,2,2],4)},
    {k:'B', v:bars3([3,2,2],4), why:'3 + 2 + 2 = 7, so this is {7/4}.'},
    {k:'C', v:bars3([1,3,4],4)},
    {k:'D', v:bars3([4,3,2],4), why:'4 + 3 + 2 = 9, so this is {9/4}.'},
    {k:'E', v:bars3([2,2,3],4), why:'2 + 2 + 3 = 7, so this is {7/4}.'}],
  yay:'You got it! Both have 8 shaded fourths.',
  steps:[
    {t:'Each bar has 4 parts, so each part is {1/4}. We need 8 shaded parts in total.'},
    {t:'Count the shaded parts in each model: A: 4 + 2 + 2 = 8 ✔ B: 3 + 2 + 2 = 7. C: 1 + 3 + 4 = 8 ✔ D: 4 + 3 + 2 = 9. E: 2 + 2 + 3 = 7.'},
    {t:'So A and C both show {8/4}.'}]},

{ prompt:'Susan rode her bike for {8/12} of an hour. She split her riding time into smaller parts. <b>Which one does NOT show a way she could have split her time?</b>',
  figure: fig(pie(12,8,170,true)),
  type:'single', answer:['D'],
  options:[
    {k:'A', t:'{8/12} = {5/12} + {3/12}', why:'5 + 3 = 8, so this one works. The question asks for the one that does NOT work.'},
    {k:'B', t:'{8/12} = {2/12} + {6/12}', why:'2 + 6 = 8, so this one works. Look for the one that doesn’t.'},
    {k:'C', t:'{8/12} = {4/12} + {4/12}', why:'4 + 4 = 8, so this one works. Look for the one that doesn’t.'},
    {k:'D', t:'{8/12} = {5/12} + {7/12}'}],
  yay:'Yes! 5 + 7 = 12, not 8. Watch out for NOT questions, you nailed it.',
  steps:[
    {t:'“NOT” means we’re looking for the <b>wrong</b> one.'},
    {t:'Add the top numbers in each choice: A: 5 + 3 = 8 ✔ B: 2 + 6 = 8 ✔ C: 4 + 4 = 8 ✔ D: 5 + 7 = 12 ✘'},
    {t:'D makes {12/12}, a whole hour, not {8/12}. So D is the answer.'}]}
];

export function start(){
  /* ---------- state ---------- */
  const KEY = 'bianca-fractions-v1';
  let saved = {solved:[], cur:0};
  try { const raw = localStorage.getItem(KEY); if(raw) saved = Object.assign(saved, JSON.parse(raw)); } catch(e){}
  const solved = new Set(saved.solved);
  let cur = Math.min(Math.max(saved.cur|0, 0), Q.length-1);
  const st = Q.map(() => ({sel:[], grid:{}, fb:null, marks:{}, steps:false}));
  function save(){ try { localStorage.setItem(KEY, JSON.stringify({solved:[...solved], cur})); } catch(e){} }

  /* ---------- render ---------- */
  document.getElementById('mascot').innerHTML = berry();

  function renderTrack(){
    document.getElementById('track').innerHTML = Q.map((q,i) =>
      `<button data-act="jump" data-i="${i}" class="${solved.has(i)?'done':''} ${i===cur?'cur':''}" aria-label="Question ${i+1}${solved.has(i)?', solved':''}" ${i===cur?'aria-current="step"':''}>${i+1}</button>`).join('');
    const n = solved.size;
    document.getElementById('count').textContent = n === Q.length ? 'All 15 solved! You’re a fraction star ⭐' : `${n} of ${Q.length} solved`;
  }

  function render(){
    const q = Q[cur], s = st[cur];
    let h = `<div class="qnum">Question ${cur+1} of ${Q.length}${solved.has(cur)?' ✓':''}</div>`;
    h += `<p class="prompt">${F(q.prompt)}</p>`;
    if(q.figure) h += F(q.figure);

    if(q.type === 'grid'){
      h += '<div class="rows">' + q.rows.map((r,ri) => {
        const pick = s.grid[ri];
        let e = q.slot ? r.e.replace('%s', `<span class="slot">${pick||'?'}</span>`) : r.e;
        return `<div class="row ${s.marks[ri]||''}"><div class="expr">${F(e)}</div><div class="choices" role="group" aria-label="Row ${ri+1}">` +
          q.cols.map(c => `<button class="choice ${c.big?'big':''}" data-act="choice" data-r="${ri}" data-v="${c.v}" aria-pressed="${pick===c.v}">${F(c.l)}</button>`).join('') +
          '</div></div>';
      }).join('') + '</div>';
    } else {
      if(q.pick) h += `<p style="margin:0 0 8px;color:var(--muted)">Pick ${q.pick === 2 ? 'two' : q.pick} answers.</p>`;
      h += '<div class="opts">' + q.options.map(o =>
        `<button class="opt ${q.visual?'vis':''} ${s.marks[o.k]||''}" data-act="opt" data-k="${o.k}" aria-pressed="${s.sel.includes(o.k)}">
          <span class="key">${o.k}</span>${o.v ? o.v : `<span>${F(o.t)}</span>`}</button>`).join('') + '</div>';
    }

    h += `<div class="actions"><button class="btn primary" data-act="check">Check</button>
          <button class="btn soft" data-act="steps" aria-expanded="${s.steps}">${s.steps?'Hide the steps':'Show me how'}</button></div>`;

    if(s.fb) h += `<div class="fb ${s.fb.kind}">${berry()}<div class="bubble">${s.fb.msg}</div></div>`;

    if(s.steps) h += `<div class="steps"><h2>How to solve it</h2><ol>${q.steps.map(x =>
        `<li>${F(x.t)}${x.v?F(x.v):''}</li>`).join('')}</ol></div>`;

    h += `<div class="pager"><button class="btn soft" data-act="prev" ${cur===0?'disabled style="opacity:.4"':''}>Back</button>
          <button class="btn ${solved.has(cur)?'primary':'soft'}" data-act="next" ${cur===Q.length-1?'disabled style="opacity:.4"':''}>Next question</button></div>`;

    document.getElementById('card').innerHTML = h;
    renderTrack();
  }

  /* ---------- checking ---------- */
  function check(btn){
    const q = Q[cur], s = st[cur]; s.marks = {};
    if(q.type === 'grid'){
      if(q.rows.some((r,i) => !s.grid[i])){ s.fb = {kind:'hint', msg:'Pick an answer in every row, then press Check.'}; return; }
      const wrong = q.rows.map((r,i)=>i).filter(i => s.grid[i] !== q.rows[i].a);
      q.rows.forEach((r,i) => s.marks[i] = wrong.includes(i) ? 'wrong' : 'right');
      if(!wrong.length) return win(btn);
      s.fb = {kind:'hint', msg: `<p>${wrong.length === 1 ? 'Almost! One row needs another look:' : `${q.rows.length - wrong.length} right so far. Look again at the orange rows:`}</p>` +
        wrong.map(i => `<p><b>Row ${i+1}:</b> ${F(q.rows[i].why)}</p>`).join('')};
      return;
    }
    const need = q.pick || 1;
    if(s.sel.length !== need){ s.fb = {kind:'hint', msg: need === 2 ? 'Pick two answers, then press Check.' : 'Pick an answer, then press Check.'}; return; }
    const ok = [...s.sel].sort().join() === [...q.answer].sort().join();
    if(ok){ s.sel.forEach(k => s.marks[k] = 'right'); return win(btn); }
    const wrong = s.sel.filter(k => !q.answer.includes(k)), right = s.sel.filter(k => q.answer.includes(k));
    wrong.forEach(k => s.marks[k] = 'wrong'); right.forEach(k => s.marks[k] = 'right');
    let msg = wrong.map(k => `<p><b>${k}:</b> ${F(q.options.find(o => o.k === k).why)}</p>`).join('');
    if(right.length) msg += `<p>${right.join(' and ')} is right, so keep it and find the other one!</p>`;
    else msg += '<p>Try again!</p>';
    s.fb = {kind:'hint', msg};
  }

  function win(btn){
    const s = st[cur];
    s.fb = {kind:'good', msg: `<p>${F(Q[cur].yay)}</p>`};
    solved.add(cur); save();
  }

  function celebrate(btn){
    const m = document.querySelector('.hero .berry');
    if(m){ m.classList.remove('yay'); void m.offsetWidth; m.classList.add('yay'); }
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches || !btn) return;
    const r = btn.getBoundingClientRect();
    for(let i=0;i<9;i++){
      const el = document.createElement('span'); el.className = 'heart'; el.textContent = '♥';
      el.style.left = (r.left + r.width/2 - 10 + (Math.random()*40-20)) + 'px';
      el.style.top = (r.top - 4) + 'px';
      el.style.setProperty('--dx', (Math.random()*120-60) + 'px');
      el.style.animationDelay = (i*40) + 'ms';
      document.body.appendChild(el); setTimeout(() => el.remove(), 1400);
    }
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if(!b) return;
    const q = Q[cur], s = st[cur], act = b.dataset.act;
    if(act === 'opt'){
      const k = b.dataset.k;
      if(q.type === 'single') s.sel = [k];
      else if(s.sel.includes(k)) s.sel = s.sel.filter(x => x !== k);
      else { s.sel.push(k); if(s.sel.length > q.pick) s.sel.shift(); }
      s.marks = {}; s.fb = null; render();
    } else if(act === 'choice'){
      s.grid[b.dataset.r] = b.dataset.v; s.marks = {}; s.fb = null; render();
    } else if(act === 'check'){
      const rect = b.getBoundingClientRect();
      check(b); render();
      const nb = document.querySelector('[data-act="check"]');
      if(st[cur].fb && st[cur].fb.kind === 'good') celebrate(nb || {getBoundingClientRect:()=>rect});
    } else if(act === 'steps'){
      s.steps = !s.steps; render();
    } else if(act === 'prev' && cur > 0){ cur--; save(); render(); scrollTop(); }
    else if(act === 'next' && cur < Q.length-1){ cur++; save(); render(); scrollTop(); }
    else if(act === 'jump'){ cur = +b.dataset.i; save(); render(); scrollTop(); }
    else if(act === 'reset'){
      if(confirm('Start over and clear all your progress?')){
        solved.clear(); st.forEach(x => Object.assign(x, {sel:[], grid:{}, fb:null, marks:{}, steps:false})); cur = 0; save(); render(); scrollTop();
      }
    }
  });
  function scrollTop(){ document.getElementById('track').scrollIntoView({block:'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); }

  render();
}

export default { questions: Q, start };
