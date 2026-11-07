/*
  Fraction practice: Mango’s page. Round 2, cat theme, with cross-out buttons.

  Ported unchanged from the stand-alone practice page: the helpers and the
  question list (Q) below are pure -- they build SVG and HTML strings and
  touch no DOM -- so importing this module has no side effects and
  test/bonus-pages.test.js can check the answer key directly. Everything
  that reads or writes the page runs inside start().
*/
/* ---------- helpers ---------- */
const F = s => s.replace(/\{(?:(\d+) )?(\d+)\/(\d+)\}/g, (m, w, n, d) =>
  (w ? `<span class="whole">${w}</span>` : '') + `<span class="fr"><span>${n}</span><span>${d}</span></span>`);

function cat(cls=''){
  return `<svg class="cat ${cls}" viewBox="0 0 100 100" aria-hidden="true">
    <path d="M16 46 L21 8 L46 28 Z" fill="#F4A15D"/><path d="M84 46 L79 8 L54 28 Z" fill="#F4A15D"/>
    <path d="M24 36 L26 17 L38 28 Z" fill="#FFC1C7"/><path d="M76 36 L74 17 L62 28 Z" fill="#FFC1C7"/>
    <ellipse cx="50" cy="58" rx="40" ry="34" fill="#F4A15D"/>
    <path d="M50 26 v10 M41 28 l2.5 8 M59 28 l-2.5 8 M12 56 h8 M80 56 h8" stroke="#D9772F" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="50" cy="71" rx="16" ry="12" fill="#FFF1E4"/>
    <ellipse cx="25" cy="69" rx="6.5" ry="4" fill="#FF9E93" opacity=".75"/><ellipse cx="75" cy="69" rx="6.5" ry="4" fill="#FF9E93" opacity=".75"/>
    <ellipse cx="35" cy="55" rx="6.5" ry="8" fill="#6CC37A"/><ellipse cx="65" cy="55" rx="6.5" ry="8" fill="#6CC37A"/>
    <ellipse cx="35" cy="55.5" rx="2.6" ry="6.5" fill="#2B1D30"/><ellipse cx="65" cy="55.5" rx="2.6" ry="6.5" fill="#2B1D30"/>
    <circle cx="37" cy="51.5" r="1.8" fill="#fff"/><circle cx="67" cy="51.5" r="1.8" fill="#fff"/>
    <path d="M45.5 65 L54.5 65 L50 70 Z" fill="#F07A8E"/>
    <path d="M50 70 Q50 75 44.5 75 M50 70 Q50 75 55.5 75" stroke="#3E2A47" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M34 70 L10 66 M34 74 L11 77 M66 70 L90 66 M66 74 L89 77" stroke="#3E2A47" stroke-width="1.6" stroke-linecap="round"/>
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
const bars3 = (arr, n) => `<div class="b3">${arr.map(s => bar(n, s, {w:n===3?66:n===4?68:84, h:24})).join('<span class="plus">+</span>')}</div>`;
const br = (label, n, s) => `<div class="br"><span class="bl">${F(label)}</span>${bar(n, s, {w:200, h:28})}</div>`;
const stack = (...rows) => `<div class="stack">${rows.join('')}</div>`;
const table = (head, rows) => `<table class="data"><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${F(c)}</td>`).join('')}</tr>`).join('')}</table>`;
const fig = (...items) => `<div class="fig">${items.join('')}</div>`;
const pz = (svg, cap) => `<figure>${svg}<figcaption>${F(cap)}</figcaption></figure>`;

const HALF = [{v:'gt', l:'Greater than {1/2}'}, {v:'lt', l:'Less than {1/2}'}, {v:'eq', l:'Equal to {1/2}'}];
const SYM  = [{v:'<', l:'<', big:true}, {v:'>', l:'>', big:true}, {v:'=', l:'=', big:true}];
const CI   = [{v:'c', l:'Correct'}, {v:'i', l:'Incorrect'}];

/* ---------- questions ---------- */
const Q = [
{ prompt:'The table shows how long four cats napped. <b>Whose nap is best shown by point N?</b>',
  figure: fig(table(['Cat','Nap time (hours)'], [['Luna','{1 2/3}'],['Milo','{2 1/3}'],['Pepper','{1 1/3}'],['Tiger','{2 2/3}']]),
              numberLine({max:3, parts:3, points:[{v:7/3, l:'N'}]})),
  type:'single', answer:['B'],
  options:[
    {k:'A', t:'Luna', why:'Luna napped {1 2/3} hours. That point is between 1 and 2. N is past the 2.'},
    {k:'B', t:'Milo'},
    {k:'C', t:'Pepper', why:'Pepper napped {1 1/3} hours. That point is between 1 and 2. N is past the 2.'},
    {k:'D', t:'Tiger', why:'Tiger napped {2 2/3} hours. That would be 2 ticks after the 2. N is only 1 tick after the 2.'}],
  yay:'Yes! N is at {2 1/3}, and that’s Milo’s nap.',
  steps:[
    {t:'Look at the space between 0 and 1. It’s cut into 3 equal jumps, so each tick mark is {1/3}.', v:numberLine({max:3, parts:3, tickLabels:true, points:[{v:7/3,l:'N'}]})},
    {t:'N is past the 2. Start at 2 and count the jumps to N: just 1 jump. So N is 2 and {1/3}, or {2 1/3}.'},
    {t:'Milo napped {2 1/3} hours. 🐾'}]},

{ prompt:'Is each sum or difference greater than, less than, or equal to {1/2}? Pick one answer in each row.',
  type:'grid', cols:HALF,
  rows:[
    {e:'{3/10} + {4/10}', a:'gt', why:'3 + 4 = 7, so it’s {7/10}. Half of 10 is 5, and 7 is more than 5.'},
    {e:'{7/8} − {4/8}', a:'lt', why:'7 − 4 = 3, so it’s {3/8}. Half of 8 is 4, and 3 is less than 4.'},
    {e:'{2/6} + {1/6}', a:'eq', why:'2 + 1 = 3, so it’s {3/6}. Half of 6 is exactly 3!'},
    {e:'{9/12} − {5/12}', a:'lt', why:'9 − 5 = 4, so it’s {4/12}. Half of 12 is 6, and 4 is less than 6.'}],
  yay:'All four right! You added, subtracted, and compared to one half like a pro.',
  steps:[
    {t:'The top number is the <b>numerator</b>. The bottom number is the <b>denominator</b>. When the denominators match, just add or subtract the numerators. The denominator stays the same.'},
    {t:'To compare with {1/2}, find half of the denominator. If the numerator is bigger, the fraction is greater than {1/2}. If it’s smaller, it’s less. If it’s the same, it’s equal. The green line shows half.'},
    {t:'{3/10} + {4/10} = {7/10}. Half of 10 is 5. 7 is bigger → <b>greater than {1/2}</b>.', v:fig(bar(10,7,{w:216,half:true}))},
    {t:'{7/8} − {4/8} = {3/8}. Half of 8 is 4. 3 is smaller → <b>less than {1/2}</b>.', v:fig(bar(8,3,{w:216,half:true}))},
    {t:'{2/6} + {1/6} = {3/6}. Half of 6 is 3 → <b>equal to {1/2}</b>.', v:fig(bar(6,3,{w:216,half:true}))},
    {t:'{9/12} − {5/12} = {4/12}. Half of 12 is 6. 4 is smaller → <b>less than {1/2}</b>.', v:fig(bar(12,4,{w:216,half:true}))}]},

{ prompt:'Nora’s kitten ate {1/10} cup of food in the morning and {1/12} cup at night. Nora thinks the kitten ate about 1 cup in all. <b>Is her estimate reasonable?</b>',
  type:'single', answer:['B'],
  options:[
    {k:'A', t:'Yes, both fractions are close to {1/2}, so the sum is close to 1.', why:'{1/10} and {1/12} are tiny pieces, much less than {1/2}. Half of 10 would be {5/10}, not {1/10}.'},
    {k:'B', t:'No, both fractions are close to 0, so the sum is close to 0.'},
    {k:'C', t:'Yes, because 10 + 12 is a big number.', why:'The denominator tells how many pieces the whole is cut into. More pieces means each piece is <b>smaller</b>, not bigger!'},
    {k:'D', t:'No, the sum is close to 2.', why:'Each fraction is just 1 tiny piece. Two tiny pieces can’t get close to 2 whole cups.'}],
  yay:'Right! Two tiny amounts make a small amount, not a whole cup.',
  steps:[
    {t:'{1/10}: the cup is cut into 10 pieces and only 1 is filled. That’s <b>close to 0</b>.', v:fig(bar(10,1,{w:216}))},
    {t:'{1/12}: 12 pieces and only 1 is filled. That’s also <b>close to 0</b>.', v:fig(bar(12,1,{w:216}))},
    {t:'About 0 + about 0 = about 0. So 1 cup is way too much. (Together it’s less than {1/4} cup!)'}]},

{ prompt:'Two points are shown on the number line. <b>Which TWO equations find the distance between P and Q?</b>',
  figure: fig(numberLine({max:2, parts:8, points:[{v:3/8,l:'P'},{v:9/8,l:'Q'}]})),
  type:'multi', pick:2, answer:['A','B'],
  options:[
    {k:'A', t:'{9/8} − {3/8} = {6/8}'},
    {k:'B', t:'{3/8} + {6/8} = {9/8}'},
    {k:'C', t:'{9/8} + {3/8} = {12/8}', why:'Adding P and Q makes a bigger number. To find how far apart they are, subtract, or count up from P.'},
    {k:'D', t:'{9/8} − {4/8} = {5/8}', why:'Check P again: it’s 3 ticks from 0, so P is {3/8}, not {4/8}.'},
    {k:'E', t:'{6/8} − {3/8} = {3/8}', why:'Q isn’t {6/8}. Q is past the 1, at 9 ticks, so it’s {9/8}.'}],
  yay:'Yes! Subtracting and counting up both find the 6 jumps from P to Q.',
  steps:[
    {t:'Between 0 and 1 there are 8 jumps, so each tick is {1/8}.'},
    {t:'P is 3 ticks from 0, so P = {3/8}. Q takes 8 ticks to reach 1, plus 1 more. That’s 9 ticks, so Q = {9/8}.'},
    {t:'Count the jumps from P to Q: there are 6. So the distance is {6/8}.', v:numberLine({max:2, parts:8, points:[{v:3/8,l:'P'},{v:9/8,l:'Q'}], jump:{from:3/8, to:9/8, l:'6 jumps = 6/8'}})},
    {t:'Two ways to write it: take away, {9/8} − {3/8} = {6/8} (A), or count up from P, {3/8} + {6/8} = {9/8} (B).'}]},

{ prompt:'Two cats ate parts of their tuna pies, as shown. <b>Which TWO comparisons are correct?</b>',
  figure: fig(pz(pie(3,2,120),'Coco'), pz(pie(6,5,120),'Max')),
  type:'multi', pick:2, answer:['B','D'],
  options:[
    {k:'A', t:'{2/3} > {5/6}', why:'Coco ate less than Max. The > sign means “is greater than,” so this one is backwards.'},
    {k:'B', t:'{2/3} < {5/6}'},
    {k:'C', t:'{5/6} = {2/3}', why:'They aren’t the same. Look at the pies: Max’s has more shaded.'},
    {k:'D', t:'{5/6} > {2/3}'},
    {k:'E', t:'{5/6} < {2/3}', why:'{5/6} is the bigger amount, so it can’t be less than {2/3}.'}],
  yay:'Perfect! Both say the same thing, just flipped around.',
  steps:[
    {t:'Coco: 3 slices, 2 shaded → {2/3}. Max: 6 slices, 5 shaded → {5/6}.'},
    {t:'Cut each of Coco’s slices in half. Now there are 6 slices and 4 are shaded. Multiply the numerator and denominator by 2: {2/3} = {4/6}.', v:fig(pz(pie(6,4,100),'{4/6}'), pz(pie(6,5,100),'{5/6}'))},
    {t:'{4/6} is less than {5/6}. So {2/3} < {5/6} (B) and {5/6} > {2/3} (D).'},
    {t:'Tip: the open side of < or > always faces the bigger number.'}]},

{ prompt:'Choose <, >, or = for each pair.',
  type:'grid', cols:SYM, slot:true,
  rows:[
    {e:'{4/5} %s {5/6}', a:'<', why:'Missing-piece trick: {4/5} is missing {1/5}, and {5/6} is missing {1/6}. Fifths are bigger pieces, so {4/5} is missing more. That makes it smaller.'},
    {e:'{3/8} %s {6/16}', a:'=', why:'Multiply the numerator and denominator of {3/8} by 2: 3 × 2 = 6 and 8 × 2 = 16. That’s {6/16}. Same amount!'},
    {e:'{7/10} %s {3/5}', a:'>', why:'Multiply the numerator and denominator of {3/5} by 2 to get {6/10}. {7/10} is more than {6/10}.'}],
  yay:'All three correct! Great comparing.',
  steps:[
    {t:'{4/5} and {5/6}: use the missing-piece trick. {4/5} is missing one fifth. {5/6} is missing one sixth, which is a smaller piece. Missing more means less is left, so {4/5} <b>&lt;</b> {5/6}.', v:fig(stack(br('{4/5}',5,4), br('{5/6}',6,5)))},
    {t:'{3/8} and {6/16}: multiply the numerator and denominator of {3/8} by 2 → {6/16}. The bars are the same length, so they’re <b>equal</b>.', v:fig(stack(br('{3/8}',8,3), br('{6/16}',16,6)))},
    {t:'{7/10} and {3/5}: multiply the numerator and denominator of {3/5} by 2 → {6/10}. 7 tenths is more than 6 tenths, so {7/10} <b>&gt;</b> {3/5}.', v:fig(stack(br('{7/10}',10,7), br('{3/5}',5,3)))}]},

{ prompt:'Whiskers the cat walked these distances: Monday {2/5} mile, Tuesday {5/10} mile, Wednesday {3/4} mile, Thursday {1/3} mile. <b>Is each comparison correct or incorrect?</b>',
  type:'grid', cols:CI,
  rows:[
    {e:'{2/5} < {5/10}', a:'c', why:'Multiply the numerator and denominator of {2/5} by 2 to get {4/10}. {4/10} is less than {5/10}, so this is correct.'},
    {e:'{5/10} = {1/3}', a:'i', why:'{5/10} is exactly half. {1/3} is less than half, so they aren’t equal.'},
    {e:'{3/4} > {5/10}', a:'c', why:'{5/10} is exactly half, and {3/4} is more than half. Correct!'},
    {e:'{1/3} > {3/4}', a:'i', why:'{1/3} is less than half, and {3/4} is more than half. So {1/3} is the smaller one.'}],
  yay:'You got all four! Using one half as a helper really works.',
  steps:[
    {t:'{5/10} is exactly {1/2}, because 5 is half of 10. Use it as a helper!'},
    {t:'{3/4} is more than half. {1/3} is less than half. So {3/4} > {5/10} is <b>correct</b>, {5/10} = {1/3} is <b>incorrect</b>, and {1/3} > {3/4} is <b>incorrect</b>.', v:fig(stack(br('{1/3}',3,1), br('{5/10}',10,5), br('{3/4}',4,3)))},
    {t:'{2/5} and {5/10}: multiply the numerator and denominator of {2/5} by 2 → {4/10}. {4/10} is less than {5/10}, so {2/5} < {5/10} is <b>correct</b>.', v:fig(stack(br('{2/5}',5,2), br('{5/10}',10,5)))}]},

{ prompt:'A cat needs <b>at least</b> {3/4} cup of water each day. <b>Which TWO bowls have enough water?</b>',
  figure: fig(table(['Bowl','Water (cups)'], [['A','{5/8}'],['B','{9/10}'],['C','{2/4}'],['D','{4/6}'],['E','{7/8}']])),
  type:'multi', pick:2, answer:['B','E'],
  options:[
    {k:'A', t:'Bowl A', why:'{3/4} is the same as {6/8}. {5/8} is less than {6/8}, so it’s not enough.'},
    {k:'B', t:'Bowl B'},
    {k:'C', t:'Bowl C', why:'{2/4} is exactly half. {3/4} is more than half, so it’s not enough.'},
    {k:'D', t:'Bowl D', why:'Change both to twelfths: {3/4} = {9/12} and {4/6} = {8/12}. {8/12} is less, so it’s not enough.'},
    {k:'E', t:'Bowl E'}],
  yay:'Yes! Bowls B and E both have more than {3/4} cup.',
  steps:[
    {t:'“At least {3/4}” means {3/4} or more.'},
    {t:'B: {9/10} is missing only one tiny tenth. {3/4} is missing a bigger fourth. So {9/10} is more ✔', v:fig(stack(br('{3/4}',4,3), br('{9/10}',10,9)))},
    {t:'E: multiply the numerator and denominator of {3/4} by 2 → {6/8}. {7/8} is more than {6/8} ✔', v:fig(stack(br('{3/4}',4,3), br('{7/8}',8,7)))},
    {t:'A ({5/8}), C ({2/4}), and D ({4/6}) are all less than {3/4}, so they’re not enough.'}]},

{ prompt:'<b>Select TWO equations that show equivalent fractions.</b>',
  type:'multi', pick:2, answer:['A','B'],
  options:[
    {k:'A', t:'{3/4} = {6/8}'},
    {k:'B', t:'{1 3/5} = {8/5}'},
    {k:'C', t:'{2/3} = {4/9}', why:'You have to multiply the numerator and denominator by the same number. 2 × 2 = 4, so the denominator should be 3 × 2 = 6. {2/3} = {4/6}.'},
    {k:'D', t:'{2 1/2} = {4/2}', why:'2 wholes = {4/2}. Add {1/2} more and you get {5/2}, not {4/2}.'},
    {k:'E', t:'{5/6} = {5/12}', why:'Same numerator, but twelfths are smaller pieces than sixths. So {5/12} is less than {5/6}.'}],
  yay:'Correct! {3/4} = {6/8} and {1 3/5} = {8/5}.',
  steps:[
    {t:'Equivalent fractions show the <b>same amount</b> with different-sized pieces. To make one, multiply the numerator AND the denominator by the same number.'},
    {t:'A: multiply the numerator and denominator of {3/4} by 2 → {6/8} ✔'},
    {t:'B: 1 whole has 5 fifths, so 1 = {5/5}. Add {3/5} more: 5 + 3 = 8 → {8/5} ✔', v:fig(bars3([5,3],5))},
    {t:'D is a trap: {2 1/2} = {4/2} + {1/2} = {5/2}.'}]},

{ prompt:'The model is shaded to show a fraction. <b>Which model shows an equivalent fraction?</b>',
  figure: fig(grid(1,3,[0],40)),
  type:'single', answer:['C'], visual:true,
  options:[
    {k:'A', v:grid(2,4,[0,5]), why:'This is 2 out of 8 = {2/8}, which is the same as {1/4}. Fourths are smaller than thirds.'},
    {k:'B', v:grid(3,3,[0,4]), why:'This is 2 out of 9 = {2/9}. For {1/3}, you’d need 3 out of 9 shaded.'},
    {k:'C', v:grid(2,3,[0,4])},
    {k:'D', v:grid(2,3,[0,1,2]), why:'This is 3 out of 6 = {3/6}, which is half. {1/3} is less than half.'}],
  yay:'Yes! {2/6} is the same as {1/3}.',
  steps:[
    {t:'The top model has 3 squares with 1 shaded → {1/3}.'},
    {t:'Multiply the numerator and denominator of {1/3} by 2 → {2/6}. So we want 2 shaded out of 6.'},
    {t:'C has 6 squares with 2 shaded → {2/6} ✔', v:fig(grid(2,3,[0,4]))},
    {t:'A is {2/8}, B is {2/9}, and D is {3/6}. None of those equal {1/3}.'}]},

{ prompt:'<b>Select TWO equations that correctly decompose {9/6}.</b>',
  type:'multi', pick:2, answer:['B','E'],
  options:[
    {k:'A', t:'{4/6} + {4/6}', why:'4 + 4 = 8, so this makes {8/6}, not {9/6}.'},
    {k:'B', t:'{3/6} + {3/6} + {3/6}'},
    {k:'C', t:'{2/6} + {2/6} + {2/6} + {2/6}', why:'Count them: four {2/6}s. 2 + 2 + 2 + 2 = 8, so this makes {8/6}.'},
    {k:'D', t:'{5/6} + {3/6}', why:'5 + 3 = 8, so this makes {8/6}.'},
    {k:'E', t:'{6/6} + {3/6}'}],
  yay:'Right! Both add up to {9/6}.',
  steps:[
    {t:'Decompose means break a fraction into smaller parts that add back up to it.'},
    {t:'All the parts are sixths, so just add the numerators. They need to add up to 9.'},
    {t:'B: 3 + 3 + 3 = 9 ✔'},
    {t:'E: 6 + 3 = 9 ✔', v:fig(bars3([6,3],6))},
    {t:'A, C, and D all add up to 8, not 9.'}]},

{ prompt:'<b>Which expression shows the total shaded amount in the three fraction circles?</b>',
  figure: fig(pie(4,4,96), pie(4,3,96), pie(4,4,96)),
  type:'single', answer:['A'],
  options:[
    {k:'A', t:'{4/4} + {3/4} + {4/4}'},
    {k:'B', t:'{4/4} + {1/4} + {4/4}', why:'Count the shaded parts in the middle circle again: 3 are shaded. The 1 is the white part!'},
    {k:'C', t:'{4/4} + {3/4}', why:'There are three circles, so three fractions need to be added.'},
    {k:'D', t:'{3/4} + {3/4} + {3/4}', why:'The first and last circles are all shaded. That’s {4/4} each.'}],
  yay:'Yes! Two full circles plus {3/4}.',
  steps:[
    {t:'Each circle has 4 parts, so we use fourths.'},
    {t:'Circle 1: all 4 shaded → {4/4}. Circle 2: 3 shaded → {3/4}. Circle 3: all 4 shaded → {4/4}.'},
    {t:'Total: {4/4} + {3/4} + {4/4}. That’s 2 whole circles and {3/4} more, or {2 3/4}.'}]},

{ prompt:'<b>Which TWO models show {1/5} + {3/5} + {2/5}?</b>',
  type:'multi', pick:2, answer:['D','E'], visual:true,
  options:[
    {k:'A', v:bars3([1,2,2],5), why:'This shows {1/5} + {2/5} + {2/5}.'},
    {k:'B', v:bars3([1,4,1],5), why:'This shows {1/5} + {4/5} + {1/5}. Same total, but not the parts we need.'},
    {k:'C', v:bars3([2,2,2],5), why:'This shows {2/5} + {2/5} + {2/5}.'},
    {k:'D', v:bars3([1,3,2],5)},
    {k:'E', v:bars3([1,3,2],5)}],
  yay:'Correct! Both show 1, then 3, then 2 fifths.',
  steps:[
    {t:'Each bar has 5 parts, so each part is {1/5}.'},
    {t:'We need: first bar 1 shaded, second bar 3 shaded, third bar 2 shaded.', v:fig(bars3([1,3,2],5))},
    {t:'D and E match. B is tricky: it also adds up to {6/5}, but its parts are 1, 4, 1.'}]},

{ prompt:'Leo decomposed {7/3} into three parts. <b>Which TWO models show a total of {7/3}?</b>',
  type:'multi', pick:2, answer:['A','D'], visual:true,
  options:[
    {k:'A', v:bars3([3,3,1],3)},
    {k:'B', v:bars3([2,2,2],3), why:'2 + 2 + 2 = 6, so this is {6/3}.'},
    {k:'C', v:bars3([3,2,1],3), why:'3 + 2 + 1 = 6, so this is {6/3}.'},
    {k:'D', v:bars3([1,3,3],3)},
    {k:'E', v:bars3([3,3,2],3), why:'3 + 3 + 2 = 8, so this is {8/3}.'}],
  yay:'You got it! Both have 7 shaded thirds.',
  steps:[
    {t:'Each bar has 3 parts, so each part is {1/3}. We need 7 shaded parts in all.'},
    {t:'Count the shaded parts: A: 3 + 3 + 1 = 7 ✔ B: 2 + 2 + 2 = 6. C: 3 + 2 + 1 = 6. D: 1 + 3 + 3 = 7 ✔ E: 3 + 3 + 2 = 8.'},
    {t:'So A and D both show {7/3}.'}]},

{ prompt:'Ana played with her cat for {10/12} of an hour. She split the time into smaller parts. <b>Which one does NOT show a way she could have split her time?</b>',
  figure: fig(pie(12,10,170,true)),
  type:'single', answer:['C'],
  options:[
    {k:'A', t:'{10/12} = {6/12} + {4/12}', why:'6 + 4 = 10, so this one works. The question asks for the one that does NOT work.'},
    {k:'B', t:'{10/12} = {3/12} + {7/12}', why:'3 + 7 = 10, so this one works. Look for the one that doesn’t.'},
    {k:'C', t:'{10/12} = {5/12} + {6/12}'},
    {k:'D', t:'{10/12} = {2/12} + {8/12}', why:'2 + 8 = 10, so this one works. Look for the one that doesn’t.'}],
  yay:'Yes! 5 + 6 = 11, not 10. You didn’t fall for the NOT trap.',
  steps:[
    {t:'“NOT” means we’re looking for the <b>wrong</b> one.'},
    {t:'Add the numerators in each choice: A: 6 + 4 = 10 ✔ B: 3 + 7 = 10 ✔ C: 5 + 6 = 11 ✘ D: 2 + 8 = 10 ✔'},
    {t:'C makes {11/12}, not {10/12}. So C is the answer.'}]}
];

export function start(){
  /* ---------- state ---------- */
  const KEY = 'bianca-fractions-cats-v1';
  let saved = {solved:[], cur:0};
  try { const raw = localStorage.getItem(KEY); if(raw) saved = Object.assign(saved, JSON.parse(raw)); } catch(e){}
  const solved = new Set(saved.solved);
  let cur = Math.min(Math.max(saved.cur|0, 0), Q.length-1);
  const fresh = () => ({sel:[], crossed:[], grid:{}, fb:null, marks:{}, steps:false});
  const st = Q.map(fresh);
  function save(){ try { localStorage.setItem(KEY, JSON.stringify({solved:[...solved], cur})); } catch(e){} }

  /* ---------- render ---------- */
  document.getElementById('mascot').innerHTML = cat();

  function renderTrack(){
    document.getElementById('track').innerHTML = Q.map((q,i) =>
      `<button data-act="jump" data-i="${i}" class="${solved.has(i)?'done':''} ${i===cur?'cur':''}" aria-label="Question ${i+1}${solved.has(i)?', solved':''}" ${i===cur?'aria-current="step"':''}>${i+1}</button>`).join('');
    const n = solved.size;
    document.getElementById('count').textContent = n === Q.length ? 'All 15 solved! Purr-fect work 🐾' : `${n} of ${Q.length} solved`;
  }

  function render(){
    const q = Q[cur], s = st[cur];
    let h = `<div class="qnum">Question ${cur+1} of ${Q.length}${solved.has(cur)?' ✓':''}</div>`;
    h += `<p class="prompt">${F(q.prompt)}</p>`;
    if(q.figure) h += F(q.figure);

    if(q.type === 'grid'){
      h += '<div class="rows">' + q.rows.map((r,ri) => {
        const pick = s.grid[ri];
        const e = q.slot ? r.e.replace('%s', `<span class="slot">${pick||'?'}</span>`) : r.e;
        return `<div class="row ${s.marks[ri]||''}"><div class="expr">${F(e)}</div><div class="choices" role="group" aria-label="Row ${ri+1}">` +
          q.cols.map(c => `<button class="choice ${c.big?'big':''}" data-act="choice" data-r="${ri}" data-v="${c.v}" aria-pressed="${pick===c.v}">${F(c.l)}</button>`).join('') +
          '</div></div>';
      }).join('') + '</div>';
    } else {
      h += `<p class="tip">${q.pick ? 'Pick two answers.' : 'Pick one answer.'} Tap ✕ to cross out one you think is wrong.</p>`;
      h += '<div class="opts">' + q.options.map(o => {
        const x = s.crossed.includes(o.k);
        return `<div class="optrow ${x?'crossed':''}">
          <button class="opt ${q.visual?'vis':''} ${s.marks[o.k]||''}" data-act="opt" data-k="${o.k}" aria-pressed="${s.sel.includes(o.k)}">
            <span class="key">${o.k}</span>${o.v ? o.v : `<span class="txt">${F(o.t)}</span>`}</button>
          <button class="xbtn" data-act="cross" data-k="${o.k}" aria-pressed="${x}" aria-label="${x?'Uncross':'Cross out'} answer ${o.k}" title="${x?'Bring it back':'Cross it out'}">${x?'↺':'✕'}</button>
        </div>`; }).join('') + '</div>';
    }

    h += `<div class="actions"><button class="btn primary" data-act="check">Check</button>
          <button class="btn soft" data-act="steps" aria-expanded="${s.steps}">${s.steps?'Hide the steps':'Show me how'}</button></div>`;
    if(s.fb) h += `<div class="fb ${s.fb.kind}">${cat()}<div class="bubble">${s.fb.msg}</div></div>`;
    if(s.steps) h += `<div class="steps"><h2>How to solve it</h2><ol>${q.steps.map(x => `<li>${F(x.t)}${x.v?F(x.v):''}</li>`).join('')}</ol></div>`;
    h += `<div class="pager"><button class="btn soft" data-act="prev" ${cur===0?'disabled':''}>Back</button>
          <button class="btn ${solved.has(cur)?'primary':'soft'}" data-act="next" ${cur===Q.length-1?'disabled':''}>Next question</button></div>`;

    document.getElementById('card').innerHTML = h;
    renderTrack();
  }

  /* ---------- checking ---------- */
  function check(){
    const q = Q[cur], s = st[cur]; s.marks = {};
    if(q.type === 'grid'){
      if(q.rows.some((r,i) => !s.grid[i])){ s.fb = {kind:'hint', msg:'Pick an answer in every row, then press Check.'}; return false; }
      const wrong = q.rows.map((r,i)=>i).filter(i => s.grid[i] !== q.rows[i].a);
      q.rows.forEach((r,i) => s.marks[i] = wrong.includes(i) ? 'wrong' : 'right');
      if(!wrong.length) return win();
      s.fb = {kind:'hint', msg: `<p>${wrong.length === 1 ? 'Almost! One row needs another look:' : `${q.rows.length - wrong.length} right so far. Look again at these rows:`}</p>` +
        wrong.map(i => `<p><b>Row ${i+1}:</b> ${F(q.rows[i].why)}</p>`).join('')};
      return false;
    }
    const need = q.pick || 1;
    if(s.sel.length !== need){ s.fb = {kind:'hint', msg: need === 2 ? 'Pick two answers, then press Check.' : 'Pick an answer, then press Check.'}; return false; }
    if([...s.sel].sort().join() === [...q.answer].sort().join()){ s.sel.forEach(k => s.marks[k] = 'right'); return win(); }
    const wrong = s.sel.filter(k => !q.answer.includes(k)), right = s.sel.filter(k => q.answer.includes(k));
    wrong.forEach(k => s.marks[k] = 'wrong'); right.forEach(k => s.marks[k] = 'right');
    let msg = wrong.map(k => `<p><b>${k}:</b> ${F(q.options.find(o => o.k === k).why)}</p>`).join('');
    msg += right.length ? `<p>${right.join(' and ')} is right, so keep it and find the other one!</p>` : '<p>Try again! You can tap ✕ to cross this one out.</p>';
    s.fb = {kind:'hint', msg};
    return false;
  }
  function win(){
    st[cur].fb = {kind:'good', msg: `<p>${F(Q[cur].yay)}</p>`};
    solved.add(cur); save();
    return true;
  }
  function celebrate(btn){
    const m = document.querySelector('.hero .cat');
    if(m){ m.classList.remove('yay'); void m.offsetWidth; m.classList.add('yay'); }
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches || !btn) return;
    const r = btn.getBoundingClientRect();
    for(let i=0;i<9;i++){
      const el = document.createElement('span'); el.className = 'pawfx'; el.textContent = '🐾';
      el.style.left = (r.left + r.width/2 - 12 + (Math.random()*40-20)) + 'px';
      el.style.top = (r.top - 4) + 'px';
      el.style.setProperty('--dx', (Math.random()*120-60) + 'px');
      el.style.setProperty('--rot', (Math.random()*60-30) + 'deg');
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
      s.crossed = s.crossed.filter(x => x !== k);
      if(q.type === 'single') s.sel = [k];
      else if(s.sel.includes(k)) s.sel = s.sel.filter(x => x !== k);
      else { s.sel.push(k); if(s.sel.length > q.pick) s.sel.shift(); }
      s.marks = {}; s.fb = null; render();
    } else if(act === 'cross'){
      const k = b.dataset.k;
      if(s.crossed.includes(k)) s.crossed = s.crossed.filter(x => x !== k);
      else { s.crossed.push(k); s.sel = s.sel.filter(x => x !== k); delete s.marks[k]; }
      render();
      const again = document.querySelector(`[data-act="cross"][data-k="${k}"]`); if(again) again.focus();
    } else if(act === 'choice'){
      s.grid[b.dataset.r] = b.dataset.v; s.marks = {}; s.fb = null; render();
    } else if(act === 'check'){
      const won = check(); render();
      if(won) celebrate(document.querySelector('[data-act="check"]'));
    } else if(act === 'steps'){
      s.steps = !s.steps; render();
    } else if(act === 'prev' && cur > 0){ cur--; save(); render(); scrollTop(); }
    else if(act === 'next' && cur < Q.length-1){ cur++; save(); render(); scrollTop(); }
    else if(act === 'jump'){ cur = +b.dataset.i; save(); render(); scrollTop(); }
    else if(act === 'reset'){
      if(confirm('Start over and clear all your progress?')){
        solved.clear(); st.forEach((x,i) => st[i] = fresh()); cur = 0; save(); render(); scrollTop();
      }
    }
  });
  function scrollTop(){ document.getElementById('track').scrollIntoView({block:'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'}); }

  render();
}

export default { questions: Q, start };
