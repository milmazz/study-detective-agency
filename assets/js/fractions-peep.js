/*
  Fraction practice: Peep’s page. Round 3 (harder), chicken theme.

  Ported unchanged from the stand-alone practice page: the helpers and the
  question list (Q) below are pure -- they build SVG and HTML strings and
  touch no DOM -- so importing this module has no side effects and
  test/bonus-pages.test.js can check the answer key directly. Everything
  that reads or writes the page runs inside start().
*/
/* ---------- helpers ---------- */
const F = s => s.replace(/\{(?:(\d+) )?(\d+)\/(\d+)\}/g, (m, w, n, d) =>
  (w ? `<span class="whole">${w}</span>` : '') + `<span class="fr"><span>${n}</span><span>${d}</span></span>`);

function chick(cls=''){
  return `<svg class="chick ${cls}" viewBox="0 0 100 104" aria-hidden="true">
    <path d="M42 98 v-6 M42 98 l-5 3 M42 98 l5 3 M58 98 v-6 M58 98 l-5 3 M58 98 l5 3" stroke="#F08A2E" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M44 24 C42 12 50 10 50 20 C52 8 60 12 56 24 Z" fill="#FFB81F"/>
    <circle cx="50" cy="56" r="37" fill="#FFD94A"/>
    <ellipse cx="15" cy="62" rx="8" ry="13" transform="rotate(20 15 62)" fill="#FFC31F"/>
    <ellipse cx="85" cy="62" rx="8" ry="13" transform="rotate(-20 85 62)" fill="#FFC31F"/>
    <ellipse cx="50" cy="72" rx="20" ry="14" fill="#FFE98C"/>
    <ellipse cx="27" cy="62" rx="7" ry="4.5" fill="#FF9E93" opacity=".8"/><ellipse cx="73" cy="62" rx="7" ry="4.5" fill="#FF9E93" opacity=".8"/>
    <ellipse cx="37" cy="50" rx="4.6" ry="6" fill="#2B211C"/><ellipse cx="63" cy="50" rx="4.6" ry="6" fill="#2B211C"/>
    <circle cx="38.6" cy="47.5" r="1.7" fill="#fff"/><circle cx="64.6" cy="47.5" r="1.7" fill="#fff"/>
    <path d="M43 57 L57 57 L50 66 Z" fill="#FF8A3D"/><path d="M43 57 L57 57" stroke="#E0702A" stroke-width="1.6"/>
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
function pie(n, sh, size=110){
  const c=size/2, r=c-3;
  let o = `<svg viewBox="0 0 ${size} ${size}" width="${size}" role="img" aria-label="Circle cut into ${n} equal parts, ${sh} shaded">`;
  for(let i=0;i<n;i++){
    const a0=(-90+i*360/n)*Math.PI/180, a1=(-90+(i+1)*360/n)*Math.PI/180;
    o += `<path class="cell ${i<sh?'sh':'em'}" d="M${c} ${c} L${(c+r*Math.cos(a0)).toFixed(2)} ${(c+r*Math.sin(a0)).toFixed(2)} A${r} ${r} 0 0 1 ${(c+r*Math.cos(a1)).toFixed(2)} ${(c+r*Math.sin(a1)).toFixed(2)} Z"/>`;
  }
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
const bars3 = (arr, n) => `<div class="b3">${arr.map(s => bar(n, s, {w:n<=5?80:88, h:24})).join('<span class="plus">+</span>')}</div>`;
const br = (label, n, s, opts={}) => `<div class="br"><span class="bl">${F(label)}</span>${bar(n, s, {w:200, h:28, ...opts})}</div>`;
const stack = (...rows) => `<div class="stack">${rows.join('')}</div>`;
const table = (head, rows) => `<table class="data"><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${F(c)}</td>`).join('')}</tr>`).join('')}</table>`;
const fig = (...items) => `<div class="fig">${items.join('')}</div>`;
const pz = (svg, cap) => `<figure>${svg}<figcaption>${F(cap)}</figcaption></figure>`;

const ONE = [{v:'gt', l:'Greater than 1'}, {v:'lt', l:'Less than 1'}, {v:'eq', l:'Equal to 1'}];
const SYM = [{v:'<', l:'<', big:true}, {v:'>', l:'>', big:true}, {v:'=', l:'=', big:true}];
const CI  = [{v:'c', l:'Correct'}, {v:'i', l:'Incorrect'}];

/* ---------- questions ---------- */
const Q = [
{ prompt:'Four chickens ran laps around the coop to escape bath time. 🛁 The table shows how many laps each one ran. <b>Which chicken is shown by point R?</b>',
  figure: fig(table(['Chicken','Laps'], [['Eggatha','{2 5/8}'],['Cluckles','{2 3/8}'],['Henrietta','{1 3/8}'],['Sir Fluffington','{2 1/8}']]),
              numberLine({max:3, parts:8, points:[{v:19/8, l:'R'}]})),
  type:'single', answer:['B'],
  options:[
    {k:'A', t:'Eggatha', why:'Eggatha ran {2 5/8} laps. That would be 5 ticks after the 2. R is only 3 ticks after the 2.'},
    {k:'B', t:'Cluckles'},
    {k:'C', t:'Henrietta', why:'Henrietta ran {1 3/8} laps. That’s between 1 and 2. R is past the 2.'},
    {k:'D', t:'Sir Fluffington', why:'Sir Fluffington ran {2 1/8} laps. That would be just 1 tick after the 2. Count again: R is 3 ticks after the 2.'}],
  yay:'Yes! R is at {2 3/8}, so it’s Cluckles. Run, Cluckles, run! 🐔💨',
  steps:[
    {t:'Count the jumps between 0 and 1. There are 8, so each tick mark is {1/8}.'},
    {t:'R is past the 2. Here’s the part from 2 to 3, zoomed in. Start at 2 and count the jumps to R: 1, 2, 3.', v:numberLine({min:2, max:3, parts:8, tickLabels:true, points:[{v:19/8,l:'R'}]})},
    {t:'So R is 2 and {3/8}, or {2 3/8}. Cluckles ran {2 3/8} laps. 🐣'}]},

{ prompt:'The hens are measuring buckets of corn. 🌽 Is each answer greater than, less than, or equal to 1 whole bucket? Pick one answer in each row.',
  type:'grid', cols:ONE,
  rows:[
    {e:'{5/8} + {4/8}', a:'gt', why:'5 + 4 = 9, so it’s {9/8}. One whole is {8/8}, and 9 is more than 8.'},
    {e:'{11/10} − {3/10}', a:'lt', why:'11 − 3 = 8, so it’s {8/10}. One whole is {10/10}, and 8 is less than 10.'},
    {e:'{2/6} + {1/6} + {3/6}', a:'eq', why:'2 + 1 + 3 = 6, so it’s {6/6}. That’s exactly 1 whole!'},
    {e:'{1 2/5} − {3/5}', a:'lt', why:'First change {1 2/5} to {7/5} (1 whole is {5/5}, plus {2/5}). 7 − 3 = 4, so it’s {4/5}. That’s less than {5/5}.'}],
  yay:'All four right! You’re one smart chicken. 🐔',
  steps:[
    {t:'When the denominators match, add or subtract the numerators. The denominator stays the same.'},
    {t:'A fraction equals 1 whole when the numerator and denominator are the same, like {8/8}. If the numerator is bigger, it’s greater than 1. If it’s smaller, it’s less than 1.'},
    {t:'{5/8} + {4/8} = {9/8}. That’s 1 whole bucket and {1/8} more → <b>greater than 1</b>.', v:fig(bars3([8,1],8))},
    {t:'{11/10} − {3/10} = {8/10}. 8 is less than 10 → <b>less than 1</b>.', v:fig(bar(10,8,{w:216}))},
    {t:'{2/6} + {1/6} + {3/6} = {6/6} → <b>equal to 1</b>.', v:fig(bar(6,6,{w:216}))},
    {t:'{1 2/5} − {3/5}: change the mixed number first. 1 whole = {5/5}, so {1 2/5} = {7/5}. Then 7 − 3 = 4 → {4/5}. That’s <b>less than 1</b>.', v:fig(bars3([5,2],5))}]},

{ prompt:'Henrietta laid two eggs. 🥚🥚 One weighed {1 7/8} ounces and the other weighed {2 1/10} ounces. She bragged to the whole coop: “My eggs weigh about 4 ounces together!” <b>Is her estimate reasonable?</b>',
  type:'single', answer:['A'],
  options:[
    {k:'A', t:'Yes. {1 7/8} is close to 2 and {2 1/10} is close to 2, so the total is about 4.'},
    {k:'B', t:'No. {1 7/8} is close to 1 and {2 1/10} is close to 2, so the total is about 3.', why:'{7/8} is almost a whole (only {1/8} missing), so {1 7/8} is almost 2, not 1.'},
    {k:'C', t:'No. 8 + 10 = 18, so the eggs weigh about 18 ounces.', why:'Don’t add the denominators! They only tell you the size of the pieces.'},
    {k:'D', t:'Yes, because both eggs weigh exactly 2 ounces.', why:'Close to 2 isn’t exactly 2. {1 7/8} is a tiny bit less than 2, and {2 1/10} is a tiny bit more.'}],
  yay:'Right! About 2 + about 2 = about 4. Brag away, Henrietta!',
  steps:[
    {t:'{1 7/8}: the {7/8} part is only 1 small piece away from a whole. So {1 7/8} is <b>almost 2</b>.', v:fig(bars3([8,7],8))},
    {t:'{2 1/10}: that’s just a tiny {1/10} more than 2. So it’s <b>about 2</b>.'},
    {t:'About 2 + about 2 = about 4. Henrietta’s estimate makes sense!'}]},

{ prompt:'Pip the chick waddled from her nest (N) to a juicy worm (W). 🪱 <b>Which TWO equations find how far she waddled?</b>',
  figure: fig(numberLine({max:3, parts:6, points:[{v:5/6,l:'N'},{v:13/6,l:'W'}]})),
  type:'multi', pick:2, answer:['C','E'],
  options:[
    {k:'A', t:'{13/6} + {5/6} = {18/6}', why:'This adds the two spots together. To find how far apart they are, subtract or count up.'},
    {k:'B', t:'{2 1/6} − {5/6} = {1 4/6}', why:'Careful! Change {2 1/6} to {13/6} first. 13 − 5 = 8, so the answer is {8/6}, which is {1 2/6}, not {1 4/6}.'},
    {k:'C', t:'{13/6} − {5/6} = {8/6}'},
    {k:'D', t:'{12/6} − {5/6} = {7/6}', why:'Check W again. It takes 12 ticks to reach 2, plus 1 more. That’s 13 ticks, so W is {13/6}, not {12/6}.'},
    {k:'E', t:'{5/6} + {8/6} = {13/6}'}],
  yay:'Yes! Pip waddled {8/6}, which is {1 2/6}. Worth it for a worm! 🪱',
  steps:[
    {t:'Each whole is cut into 6 jumps, so each tick is {1/6}.'},
    {t:'N is 5 ticks from 0 → {5/6}. W is 2 wholes (12 ticks) plus 1 more → 13 ticks → {13/6}. That’s the same as {2 1/6}.'},
    {t:'Count the jumps from N to W: there are 8. So Pip waddled {8/6}.', v:numberLine({max:3, parts:6, points:[{v:5/6,l:'N'},{v:13/6,l:'W'}], jump:{from:5/6, to:13/6, l:'8 jumps = 8/6'}})},
    {t:'Take away: {13/6} − {5/6} = {8/6} (C). Or count up from N: {5/6} + {8/6} = {13/6} (E).'}]},

{ prompt:'Two hens shared cakes at a fancy chicken tea party. ☕ Lady Featherbottom ate {7/12} of her cake. Duchess Peckington ate {5/8} of hers. <b>Which TWO comparisons are correct?</b>',
  figure: fig(pz(pie(12,7,120),'Lady Featherbottom'), pz(pie(8,5,120),'Duchess Peckington')),
  type:'multi', pick:2, answer:['B','D'],
  options:[
    {k:'A', t:'{7/12} > {5/8}', why:'Cut both cakes into 24 slices: {7/12} = {14/24} and {5/8} = {15/24}. 14 is less than 15, so this is backwards.'},
    {k:'B', t:'{5/8} > {7/12}'},
    {k:'C', t:'{7/12} = {5/8}', why:'They’re super close, but not the same: {14/24} and {15/24}.'},
    {k:'D', t:'{7/12} < {5/8}'},
    {k:'E', t:'{5/8} < {7/12}', why:'{5/8} is the bigger one ({15/24}), so it can’t be less.'}],
  yay:'Correct! The Duchess wins by one tiny crumb. 🍰',
  steps:[
    {t:'Twelfths and eighths are different-sized slices, so they’re hard to compare. Let’s make both cakes have the same size slices.'},
    {t:'12 and 8 both fit into 24, because 12 × 2 = 24 and 8 × 3 = 24.'},
    {t:'{7/12}: multiply the numerator and denominator by 2 → {14/24}. {5/8}: multiply the numerator and denominator by 3 → {15/24}.', v:fig(stack(br('{7/12}',12,7), br('{5/8}',8,5)))},
    {t:'15 is more than 14, so {5/8} > {7/12} (B) and {7/12} < {5/8} (D).'}]},

{ prompt:'You’re the judge at the Great Egg Contest! 🏆 Choose <, >, or = for each pair.',
  type:'grid', cols:SYM, slot:true,
  rows:[
    {e:'{5/6} %s {7/9}', a:'>', why:'Use eighteenths: {5/6} = {15/18} and {7/9} = {14/18}. 15 is more than 14.'},
    {e:'{3/4} %s {9/12}', a:'=', why:'Multiply the numerator and denominator of {3/4} by 3 → {9/12}. Same amount!'},
    {e:'{2/3} %s {7/10}', a:'<', why:'Use thirtieths: {2/3} = {20/30} and {7/10} = {21/30}. 20 is less than 21.'}],
  yay:'All three right! You’re the top judge of the Egg Contest. 🥚',
  steps:[
    {t:'{5/6} and {7/9}: 6 and 9 both fit into 18. Multiply the numerator and denominator of {5/6} by 3 → {15/18}. Multiply the numerator and denominator of {7/9} by 2 → {14/18}. So {5/6} <b>&gt;</b> {7/9}.', v:fig(stack(br('{5/6}',6,5), br('{7/9}',9,7)))},
    {t:'{3/4} and {9/12}: multiply the numerator and denominator of {3/4} by 3 → {9/12}. They’re <b>equal</b>.', v:fig(stack(br('{3/4}',4,3), br('{9/12}',12,9)))},
    {t:'{2/3} and {7/10}: 3 and 10 both fit into 30. Multiply {2/3} by 10 on top and bottom → {20/30}. Multiply {7/10} by 3 on top and bottom → {21/30}. So {2/3} <b>&lt;</b> {7/10}. Super close!', v:fig(stack(br('{2/3}',3,2), br('{7/10}',10,7)))}]},

{ prompt:'Four hens had a corn-flinging contest. Here’s how far each one flung a kernel: Eggatha {3/5} foot, Cluckles {5/8} foot, Henrietta {4/6} foot, Pip {6/10} foot. <b>Is each comparison correct or incorrect?</b>',
  type:'grid', cols:CI,
  rows:[
    {e:'{3/5} = {6/10}', a:'c', why:'Multiply the numerator and denominator of {3/5} by 2 → {6/10}. Same!'},
    {e:'{4/6} > {5/8}', a:'c', why:'{4/6} is {1/6} more than half. {5/8} is only {1/8} more than half. {1/6} is a bigger piece, so {4/6} is bigger. Correct!'},
    {e:'{6/10} > {4/6}', a:'i', why:'{6/10} is only {1/10} more than half. {4/6} is {1/6} more than half. So {6/10} is the smaller one.'},
    {e:'{5/8} < {3/5}', a:'i', why:'{5/8} is {1/8} more than half. {3/5} = {6/10}, which is only {1/10} more than half. {1/8} is bigger than {1/10}, so {5/8} is bigger.'}],
  yay:'All four! The past-half trick is a super power. 🦸',
  steps:[
    {t:'Here’s a trick: all four fractions are a little more than half. Let’s see how much more. The blue line shows half.'},
    {t:'{4/6}: half is {3/6}, so it’s {1/6} past half. {5/8}: half is {4/8}, so it’s {1/8} past half. {3/5} = {6/10}: half is {5/10}, so it’s {1/10} past half.', v:fig(stack(br('{4/6}',6,4,{half:true}), br('{5/8}',8,5,{half:true}), br('{6/10}',10,6,{half:true})))},
    {t:'The one that goes further past half is bigger. {1/6} is bigger than {1/8}, and {1/8} is bigger than {1/10}. So from biggest to smallest: {4/6}, then {5/8}, then {3/5} and {6/10} (they’re tied).'},
    {t:'That means rows 1 and 2 are <b>correct</b>, and rows 3 and 4 are <b>incorrect</b>.'}]},

{ prompt:'Sir Fluffington is a very fancy chicken. 🎩 He will only take a dust bath if the dirt pile is <b>at least</b> {2 1/4} feet tall. <b>Which TWO piles are fancy enough?</b>',
  figure: fig(table(['Dirt pile','Height (feet)'], [['A','{2 3/8}'],['B','{2 1/8}'],['C','{9/4}'],['D','{2 1/5}'],['E','{15/8}']])),
  type:'multi', pick:2, answer:['A','C'],
  options:[
    {k:'A', t:'Pile A'},
    {k:'B', t:'Pile B', why:'{2 1/4} is the same as {2 2/8}. {2 1/8} is less, so it’s not tall enough.'},
    {k:'C', t:'Pile C'},
    {k:'D', t:'Pile D', why:'Fifths are smaller pieces than fourths, so {2 1/5} is a little less than {2 1/4}.'},
    {k:'E', t:'Pile E', why:'2 whole feet is {16/8}. {15/8} is less than 2, so it’s way too short.'}],
  yay:'Yes! Pile C is exactly {2 1/4}, and “at least” means equal counts too. Sir Fluffington is pleased.',
  steps:[
    {t:'“At least {2 1/4}” means {2 1/4} <b>or more</b>. Exactly equal counts!'},
    {t:'A: multiply the numerator and denominator of {1/4} by 2 → {2/8}. So {2 1/4} = {2 2/8}, and {2 3/8} is more ✔'},
    {t:'C: {9/4} = {4/4} + {4/4} + {1/4} = 2 and {1/4}. That’s exactly {2 1/4}, so it’s enough ✔', v:fig(bars3([4,4,1],4))},
    {t:'B ({2 1/8}), D ({2 1/5}), and E ({15/8}) are all shorter. No bath on those piles!'}]},

{ prompt:'Professor Peck says all of these are true, but she’s only right about TWO of them. 🎓 <b>Which TWO equations are true?</b>',
  type:'multi', pick:2, answer:['B','D'],
  options:[
    {k:'A', t:'{4/3} = {1 2/3}', why:'{4/3} = {3/3} + {1/3}. That’s 1 whole and {1/3}, so {1 1/3}, not {1 2/3}.'},
    {k:'B', t:'{2 3/4} = {11/4}'},
    {k:'C', t:'{6/8} = {9/16}', why:'Multiply the numerator and denominator of {6/8} by 2 → {12/16}, not {9/16}.'},
    {k:'D', t:'{3/5} = {12/20}'},
    {k:'E', t:'{10/4} = {2 1/4}', why:'{10/4} = {8/4} + {2/4}. That’s 2 wholes and {2/4}, so {2 2/4}, not {2 1/4}.'}],
  yay:'Correct! And you caught Professor Peck’s three mistakes.',
  steps:[
    {t:'B: each whole is {4/4}. So {2 3/4} = {4/4} + {4/4} + {3/4}. Add the numerators: 4 + 4 + 3 = 11 → {11/4} ✔', v:fig(bars3([4,4,3],4))},
    {t:'D: multiply the numerator and denominator of {3/5} by 4 → {12/20} ✔'},
    {t:'Remember: to make an equivalent fraction, multiply the numerator AND the denominator by the same number.'}]},

{ prompt:'Chef Cluckles ate part of a tiny waffle. 🧇 The shaded squares show what he ate. <b>Which bigger waffle has the same fraction eaten?</b>',
  figure: fig(grid(1,3,[0,1],40)),
  type:'single', answer:['D'], visual:true,
  options:[
    {k:'A', v:grid(2,4,[0,1,2,4,5,6]), why:'This is 6 out of 8 = {6/8}, which is the same as {3/4}. That’s more than {2/3}.'},
    {k:'B', v:grid(3,3,[0,1,2,3,4]), why:'This is 5 out of 9 = {5/9}. For {2/3}, you’d need 6 out of 9.'},
    {k:'C', v:grid(2,6,[0,1,2,6,7,8]), why:'This is 6 out of 12 = {6/12}, which is half. For {2/3}, you’d need 8 out of 12.'},
    {k:'D', v:grid(3,4,[0,1,2,3,4,5,6,7])}],
  yay:'Yes! {8/12} = {2/3}. Chef Cluckles approves. 🧇',
  steps:[
    {t:'The tiny waffle has 3 squares with 2 eaten → {2/3}.'},
    {t:'Multiply the numerator and denominator of {2/3} by 4 → {8/12}. So we want 8 eaten out of 12.'},
    {t:'D has 12 squares with 8 eaten ✔ Look: 2 of its 3 rows are eaten, just like 2 of the 3 squares!', v:fig(grid(3,4,[0,1,2,3,4,5,6,7]))},
    {t:'A is {6/8}, B is {5/9}, and C is {6/12}. None of those equal {2/3}.'}]},

{ prompt:'Henrietta has {2 3/8} buckets of corn. She wants to hide it in secret stashes so the sneaky raccoon can’t find it all. 🦝 <b>Which TWO ways of splitting it are correct?</b>',
  type:'multi', pick:2, answer:['B','E'],
  options:[
    {k:'A', t:'{1 1/8} + {1 1/8}', why:'1 + 1 = 2 wholes, and {1/8} + {1/8} = {2/8}. That makes {2 2/8}, not {2 3/8}.'},
    {k:'B', t:'{1 2/8} + {1 1/8}'},
    {k:'C', t:'{2/8} + {3/8}', why:'This is only {5/8}. What happened to the 2 whole buckets?'},
    {k:'D', t:'{16/8} + {5/8}', why:'{16/8} is 2 wholes, but then {5/8} makes {2 5/8}, not {2 3/8}.'},
    {k:'E', t:'{8/8} + {8/8} + {3/8}'}],
  yay:'Right! That raccoon will never find all the corn. 🌽',
  steps:[
    {t:'With mixed numbers, add the whole numbers, then add the fractions.'},
    {t:'B: 1 + 1 = 2, and {2/8} + {1/8} = {3/8}. Together that’s {2 3/8} ✔'},
    {t:'E: {8/8} is 1 whole. So {8/8} + {8/8} = 2 wholes, plus {3/8} → {2 3/8} ✔', v:fig(bars3([8,8,3],8))},
    {t:'A makes {2 2/8}, C makes {5/8}, and D makes {2 5/8}.'}]},

{ prompt:'Pip entered the Great Pie-Eating Contest. 🥧 The shaded parts show how much pie Pip ate. <b>Which one shows the total, written correctly?</b>',
  figure: fig(pie(6,6,96), pie(6,6,96), pie(6,2,96)),
  type:'single', answer:['C'],
  options:[
    {k:'A', t:'{6/6} + {6/6} + {4/6} = {2 4/6}', why:'Look at the last pie again: only 2 slices are shaded. The 4 are the white ones!'},
    {k:'B', t:'{6/6} + {6/6} + {2/6} = {2 2/18}', why:'Don’t add the denominators! The slices are still sixths, so it’s {2 2/6}.'},
    {k:'C', t:'{6/6} + {6/6} + {2/6} = {2 2/6}'},
    {k:'D', t:'{6/6} + {6/6} + {2/6} = {12/6}', why:'{12/6} is only 2 whole pies. What about the {2/6} from the last pie?'}],
  yay:'Correct! {2 2/6} pies. Pip needs a nap now. 😴',
  steps:[
    {t:'Each pie has 6 slices, so we use sixths.'},
    {t:'Pie 1: {6/6} = 1 whole. Pie 2: {6/6} = 1 whole. Pie 3: 2 shaded → {2/6}.'},
    {t:'1 + 1 + {2/6} = {2 2/6}. (That’s also {14/6}.) That’s a LOT of pie, Pip!'}]},

{ prompt:'Three hens painted fence boards, but they all got distracted by a butterfly. 🦋 The shaded parts show how much of each board they painted. <b>Which TWO show the total amount painted?</b>',
  figure: fig(bars3([5,3,6],8)),
  type:'multi', pick:2, answer:['B','E'],
  options:[
    {k:'A', t:'{14/24}', why:'Don’t add the denominators! Each board is still cut into eighths.'},
    {k:'B', t:'{5/8} + {3/8} + {6/8}'},
    {k:'C', t:'{1 4/8}', why:'The total is {14/8}. Take out 1 whole ({8/8}) and {6/8} is left, so it’s {1 6/8}, not {1 4/8}.'},
    {k:'D', t:'{5/8} + {3/8} + {2/8}', why:'Look at the last board again: 6 parts are shaded. The 2 are the white parts.'},
    {k:'E', t:'{1 6/8}'}],
  yay:'Yes! Even with a butterfly around, they painted {1 6/8} boards.',
  steps:[
    {t:'Each board has 8 parts, so we use eighths. Count the shaded parts: 5, 3, and 6.'},
    {t:'{5/8} + {3/8} + {6/8} = {14/8}, because 5 + 3 + 6 = 14.'},
    {t:'{14/8} is more than 1 whole. {8/8} makes 1 whole, and 14 − 8 = 6 are left over. So {14/8} = {1 6/8}.', v:fig(bars3([8,6],8))}]},

{ prompt:'Cluckles split {11/5} bags of birdseed into three snack piles: one for breakfast, one for lunch, and one for second lunch. 🍽️ <b>Which TWO models show a total of {11/5}?</b>',
  type:'multi', pick:2, answer:['B','C'], visual:true,
  options:[
    {k:'A', v:bars3([4,4,2],5), why:'4 + 4 + 2 = 10, so this is {10/5}.'},
    {k:'B', v:bars3([3,4,4],5)},
    {k:'C', v:bars3([5,5,1],5)},
    {k:'D', v:bars3([5,3,2],5), why:'5 + 3 + 2 = 10, so this is {10/5}.'},
    {k:'E', v:bars3([5,4,3],5), why:'5 + 4 + 3 = 12, so this is {12/5}.'}],
  yay:'You got it! Second lunch is saved.',
  steps:[
    {t:'Each bar has 5 parts, so each part is {1/5}. We need 11 shaded parts in all.'},
    {t:'Count the shaded parts: A: 4 + 4 + 2 = 10. B: 3 + 4 + 4 = 11 ✔ C: 5 + 5 + 1 = 11 ✔ D: 5 + 3 + 2 = 10. E: 5 + 4 + 3 = 12.'},
    {t:'So B and C show {11/5}. That’s the same as {2 1/5}. Enjoy second lunch, Cluckles!'}]},

{ prompt:'The chickens spent {2 4/6} hours at the Coop Talent Show. 🎤 (Eggatha’s tap dance took forever.) <b>Which one does NOT show a way to split the time?</b>',
  figure: fig(pie(6,6,96), pie(6,6,96), pie(6,4,96)),
  type:'single', answer:['D'],
  options:[
    {k:'A', t:'{1 3/6} + {1 1/6}', why:'1 + 1 = 2 and {3/6} + {1/6} = {4/6}. That’s {2 4/6}, so this one works. Find the one that doesn’t!'},
    {k:'B', t:'{2/6} + {2 2/6}', why:'{2/6} + {2/6} = {4/6}, plus 2 wholes → {2 4/6}. This one works.'},
    {k:'C', t:'{1 5/6} + {5/6}', why:'Tricky! {5/6} + {5/6} = {10/6}, which is 1 whole and {4/6}. Add the 1 from {1 5/6} → {2 4/6}. This one works!'},
    {k:'D', t:'{1 2/6} + {1 3/6}'}],
  yay:'Yes! D makes {2 5/6}. You spotted the impostor! 🕵️',
  steps:[
    {t:'“NOT” means find the one that’s wrong.'},
    {t:'For each choice, add the wholes, then add the fractions. A: 2 and {4/6} ✔ B: 2 and {4/6} ✔'},
    {t:'C: 1 and {10/6}. But {10/6} = {6/6} + {4/6}, which is 1 and {4/6}. So 1 + 1 and {4/6} = {2 4/6} ✔', v:fig(bars3([6,4],6))},
    {t:'D: 1 + 1 = 2 and {2/6} + {3/6} = {5/6}. That’s {2 5/6} ✘ Too much talent show!'}]}
];

export function start(){
  /* ---------- state ---------- */
  const KEY = 'bianca-fractions-chickens-v1';
  let saved = {solved:[], cur:0};
  try { const raw = localStorage.getItem(KEY); if(raw) saved = Object.assign(saved, JSON.parse(raw)); } catch(e){}
  const solved = new Set(saved.solved);
  let cur = Math.min(Math.max(saved.cur|0, 0), Q.length-1);
  const fresh = () => ({sel:[], crossed:[], grid:{}, fb:null, marks:{}, steps:false});
  const st = Q.map(fresh);
  function save(){ try { localStorage.setItem(KEY, JSON.stringify({solved:[...solved], cur})); } catch(e){} }

  /* ---------- render ---------- */
  document.getElementById('mascot').innerHTML = chick();

  function renderTrack(){
    document.getElementById('track').innerHTML = Q.map((q,i) =>
      `<button data-act="jump" data-i="${i}" class="${solved.has(i)?'done':''} ${i===cur?'cur':''}" aria-label="Question ${i+1}${solved.has(i)?', solved':''}" ${i===cur?'aria-current="step"':''}>${i+1}</button>`).join('');
    const n = solved.size;
    document.getElementById('count').textContent = n === Q.length ? 'All 15 solved! Smartest chicken in the coop 🐣' : `${n} of ${Q.length} solved`;
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
    if(s.fb) h += `<div class="fb ${s.fb.kind}">${chick()}<div class="bubble">${s.fb.msg}</div></div>`;
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
    const m = document.querySelector('.hero .chick');
    if(m){ m.classList.remove('yay'); void m.offsetWidth; m.classList.add('yay'); }
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches || !btn) return;
    const r = btn.getBoundingClientRect(), pics = ['🐣','🥚','🐥','🌽'];
    for(let i=0;i<9;i++){
      const el = document.createElement('span'); el.className = 'fx'; el.textContent = pics[i % pics.length];
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
