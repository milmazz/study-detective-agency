/*
  Question generators and content for the Numbers Division.

  The engine renders these; the place-value renderers they rely on are
  registered by numeration-types.js.

  Lives here rather than inline in the page for two reasons. Assets under
  /assets/ are served immutable and cached for a year against their ?v= token,
  where the page's own HTML expires in 300s -- and this file is ~89% of what
  that page used to weigh, so a returning player was re-downloading all of it
  every five minutes. And a module can be require()d directly by the tests
  instead of being regex'd out of the HTML and run in a vm.

  Exports the config object DetectiveGame.start() takes. The page calls start();
  this file deliberately does not, so requiring it has no side effects.

  Load AFTER game-engine.js. Order relative to numeration-types.js does not
  matter -- the generators only name types, which the engine resolves at render
  time -- but both must be in place before start() runs.
*/
var NUMERATION_QUESTIONS = (function(){
  "use strict";

  // Browser: the engine is already a global. Node: pull it in directly, so the
  // tests get the real randInt/choice/shuffle/fmt rather than stand-ins.
  var DG = (typeof DetectiveGame !== 'undefined') ? DetectiveGame
         : (typeof require === 'function') ? require('./game-engine.js')
         : null;
  if (!DG) throw new Error('assets/js/numeration-questions.js: load game-engine.js first');

  var randInt = DG.randInt, choice = DG.choice,
      shuffle = DG.shuffle, fmt = DG.fmt;

  /* ================= CORE DATA ================= */
  var PLACES = [
    {name:'ones', short:'ones', value:1},
    {name:'tens', short:'tens', value:10},
    {name:'hundreds', short:'hundreds', value:100},
    {name:'thousands', short:'thousands', value:1000},
    {name:'ten thousands', short:'ten-thousands', value:10000},
    {name:'hundred thousands', short:'hundred-thousands', value:100000},
    {name:'millions', short:'millions', value:1000000},
    {name:'ten millions', short:'ten-millions', value:10000000},
    {name:'hundred millions', short:'hundred-millions', value:100000000}
  ];
  var RATIO_LABEL = {
    '-3':'one-thousandth the value of', '-2':'one-hundredth the value of', '-1':'one-tenth the value of',
    '0':'equal in value to', '1':'ten times the value of', '2':'one hundred times the value of', '3':'one thousand times the value of'
  };

  function digitAt(num, placeValue){ return Math.floor(num/placeValue) % 10; }

  // generates an n-digit whole number, first digit 1-9
  function genDigits(n){
    var d = [randInt(1,9)];
    for (var i=1;i<n;i++) d.push(randInt(0,9));
    return d;
  }
  // Filler digits that never collide with `avoid`, so a prompt can state how
  // many times that digit appears and be telling the truth. genDigits alone
  // made "the digit 4 appears twice" false for 34% of value-compare questions
  // (941,445 has three 4s) -- correctly scored, but a false claim about a
  // number in the one lesson whose whole skill is looking carefully at digits.
  // Leading digit stays non-zero, as in genDigits.
  function genDigitsAvoiding(n, avoid){
    function pick(lo){ var v = randInt(lo,8); return v>=avoid ? v+1 : v; }
    var d = [pick(1)];
    for (var i=1;i<n;i++) d.push(pick(0));
    return d;
  }
  function digitsToNum(d){ return parseInt(d.join(''),10); }
  function roundToPlace(n, placeValue){ return Math.round(n/placeValue)*placeValue; }

  /* ================= QUESTION GENERATORS ================= */

  function genSpotPlace(){
    var n = randInt(4,7);
    var digits = genDigits(n);
    var num = digitsToNum(digits);
    var placeIdx = randInt(0, n-1); // index into PLACES
    return {
      type:'click-digit', number:num,
      targetPlaceIdx: placeIdx,
      prompt: 'Click the digit in the <span class="hl">' + PLACES[placeIdx].short + '</span> place.',
      explain: function(){
        var correctDigit = digitAt(num, PLACES[placeIdx].value);
        return 'In ' + fmt(num) + ', the digit in the ' + PLACES[placeIdx].short + ' place is ' + correctDigit + '.';
      }
    };
  }

  function genValueCompare(){
    var sameNumber = Math.random() < 0.5;
    // The distractor pool offers "equal in value to" (0) and "one thousand times"
    // (+/-3), so those have to be reachable answers -- otherwise a kid learns to
    // strike them on sight and beats the question without doing the place-value
    // reasoning. 0 only works across two numbers: within one number the prompt
    // says the digit appears twice, which needs two different places.
    var diff = sameNumber ? choice([-3,-2,-1,1,2,3]) : choice([-3,-2,-1,0,1,2,3]);
    var lowIdx = randInt(0,4);
    var hiIdx = lowIdx + Math.abs(diff);
    // Unreachable while lowIdx tops out at 4 and |diff| at 3, but it is the
    // bound that keeps PLACES[hiIdx] in range if either is ever widened.
    var TOP = PLACES.length - 2;
    if (hiIdx > TOP) { hiIdx = TOP; lowIdx = hiIdx - Math.abs(diff); }
    var aIdx, bIdx;
    if (diff > 0){ aIdx = hiIdx; bIdx = lowIdx; } else { aIdx = lowIdx; bIdx = hiIdx; }
    var d = randInt(1,9);

    var numA, numB;
    // Filler avoids d so the count the prompt states is exactly the count on
    // screen: twice within one number, once in each of two numbers.
    if (sameNumber){
      var n = Math.max(aIdx,bIdx)+2;
      var digits = genDigitsAvoiding(n, d);
      digits[n-1-aIdx] = d; digits[n-1-bIdx] = d;
      numA = numB = digitsToNum(digits);
    } else {
      var nA = aIdx+2, nB = bIdx+2;
      var da = genDigitsAvoiding(nA, d); da[nA-1-aIdx] = d;
      var db = genDigitsAvoiding(nB, d); db[nB-1-bIdx] = d;
      numA = digitsToNum(da); numB = digitsToNum(db);
    }

    var correctDiff = aIdx - bIdx; // positive => A's place is bigger

    // Every option has to name BOTH sides of the comparison. A bare
    // "Value is one-tenth the value of" is a fragment with no object, and in
    // the two-number variant nothing established which number was the subject
    // — so the inverse option (always in the set) read as equally correct.
    var subjA = sameNumber ? 'the ' + PLACES[aIdx].short + ' digit' : "Number A's digit";
    var subjB = sameNumber ? 'the ' + PLACES[bIdx].short + ' digit' : "Number B's digit";
    function cap(t){ return t.charAt(0).toUpperCase() + t.slice(1); }
    var distractorPool = shuffle([-3,-2,-1,0,1,2,3].filter(function(v){ return v!==correctDiff; }));
    var opts = [correctDiff].concat(distractorPool.slice(0,3));
    opts = shuffle(opts);

    return {
      type:'value-compare', sameNumber:sameNumber, numA:numA, numB:numB, aIdx:aIdx, bIdx:bIdx, d:d,
      prompt: sameNumber
        ? 'In the number <span class="num-sub">' + fmt(numA) + '</span>, the digit ' + d + ' appears twice. Compare the value of the digit in the <span class="hl">' + PLACES[aIdx].short + '</span> place to the value of the digit in the <span class="hl">' + PLACES[bIdx].short + '</span> place.'
        : 'Compare the value of the digit ' + d + ' in <span class="hl">Number A</span> to its value in <span class="hl">Number B</span>.',
      options: opts.map(function(v){ return {key:String(v), label: cap(subjA) + ' is ' + RATIO_LABEL[String(v)] + ' ' + subjB}; }),
      correctKey: String(correctDiff),
      explain: function(){
        var valA = d*PLACES[aIdx].value, valB = d*PLACES[bIdx].value;
        return cap(subjA) + ' is worth ' + fmt(valA) + '. ' + cap(subjB) + ' is worth ' + fmt(valB) + '. So ' + subjA + ' is ' + RATIO_LABEL[String(correctDiff)] + ' ' + subjB + '.';
      }
    };
  }

  function genOp10(){
    var op = choice(['x10','d10','x100','d100']);
    var base;
    if (op==='d10') base = randInt(2,999)*10;
    else if (op==='d100') base = randInt(2,99)*100;
    else base = randInt(2,9999);
    var correct, eqText;
    if (op==='x10'){ correct = base*10; eqText = fmt(base)+' × 10 ='; }
    else if (op==='d10'){ correct = base/10; eqText = fmt(base)+' ÷ 10 ='; }
    else if (op==='x100'){ correct = base*100; eqText = fmt(base)+' × 100 ='; }
    else { correct = base/100; eqText = fmt(base)+' ÷ 100 ='; }

    var distractors = [];
    if (op==='x10' || op==='x100'){
      var factor = op==='x10' ? 10:100;
      distractors.push(base*factor*10, Math.floor(base*factor/10)||base, base+factor);
    } else {
      var f2 = op==='d10' ? 10 : 100;
      // Multiplied instead of divided, and didn't operate at all -- the two real
      // misconceptions. The old third option was correct/10, fractional for
      // every division question (45% of all options here): off-topic for a
      // whole-number unit and eliminable at a glance. Note correct*10 would
      // equal base for the /10 case anyway, so it was never a fourth option.
      // The loop below fills the last slot with a whole-number place slip.
      distractors.push(base*f2, base);
    }
    var opts = [correct].concat(distractors).filter(function(v,i,a){ return a.indexOf(v)===i && v>=0; });
    while(opts.length<4){ opts.push(correct + choice([-10,10,-100,100,-1000,1000])); opts = opts.filter(function(v,i,a){return a.indexOf(v)===i && v>=0;}); }
    opts = shuffle(opts.slice(0,4));

    return {
      type:'mcq-simple',
      prompt:'Solve: <span class="num-sub" style="font-size:1.15em;">' + eqText + ' ___</span>',
      options: opts.map(function(v){ return {key:String(v), label: fmt(v)}; }),
      correctKey:String(correct),
      explain: function(){
        var opWord = op==='x10' ? 'Multiplying by 10 shifts every digit one place to the left.'
          : op==='d10' ? 'Dividing by 10 shifts every digit one place to the right.'
          : op==='x100' ? 'Multiplying by 100 shifts every digit two places to the left.'
          : 'Dividing by 100 shifts every digit two places to the right.';
        return opWord + ' ' + eqText + ' ' + fmt(correct) + '.';
      }
    };
  }

  function genExpandedOnce(){
    var n = randInt(4,7);
    var digits = genDigits(n);
    // sometimes zero out a middle digit to test skipping zero terms
    if (Math.random()<0.4 && n>=5){ digits[randInt(1,n-2)] = 0; }
    var num = digitsToNum(digits);

    function correctExpr(useParens){
      var terms = [];
      for (var i=0;i<n;i++){
        var pv = PLACES[n-1-i].value, dg = digits[i];
        if (dg===0) continue;
        terms.push(useParens ? '(' + dg + ' × ' + fmt(pv) + ')' : fmt(dg*pv));
      }
      return terms.join(' + ');
    }
    var correctA = correctExpr(true);
    var correctB = correctExpr(false);

    // wrong option: shift one (guaranteed nonzero) digit's place value by one
    var nonzeroIdxs = [];
    for (var i=0;i<n-1;i++){ if (digits[i]!==0) nonzeroIdxs.push(i); }
    if (nonzeroIdxs.length===0) nonzeroIdxs.push(0);
    var shiftPos = choice(nonzeroIdxs);
    function wrongExpr1(){
      var terms=[];
      for (var i=0;i<n;i++){
        var placeIdx = n-1-i;
        if (i===shiftPos) placeIdx = placeIdx-1<0?placeIdx:placeIdx-1;
        var dg = digits[i];
        if (dg===0) continue;
        terms.push('(' + dg + ' × ' + fmt(PLACES[placeIdx].value) + ')');
      }
      return terms.join(' + ');
    }
    // wrong option: collapse the last three digits (hundreds/tens/ones) into one plain number (a common real trap)
    function wrongExpr2(){
      if (n<4) return null;
      var terms=[];
      for (var i=0;i<n-3;i++){
        var pv = PLACES[n-1-i].value, dg=digits[i];
        if (dg===0) continue;
        terms.push(fmt(dg*pv));
      }
      var lastThree = '' + digits[n-3] + digits[n-2] + digits[n-1];
      var stripped = lastThree.replace(/^0+/,'');
      if (stripped) terms.push(stripped);
      return terms.length ? terms.join(' + ') : null;
    }

    var w1 = wrongExpr1();
    var w2 = wrongExpr2();
    var candidates = [
      {key:'A', label:correctA, ok:true},
      {key:'B', label:correctB, ok:true},
      {key:'C', label:w1, ok:false},
      {key:'D', label:w2, ok:false}
    ];
    if (candidates.some(function(c){ return !c.label; })) return null;
    var labels = candidates.map(function(c){ return c.label; });
    var uniq = labels.filter(function(v,i,a){ return a.indexOf(v)===i; });
    if (uniq.length !== labels.length) return null; // collision — caller retries

    var opts = shuffle(candidates);
    return {
      type:'multiselect', number:num,
      prompt:'The number <span class="num-sub" style="font-size:1.2em;">' + fmt(num) + '</span> is written in standard form. Select ALL expressions that correctly show it in expanded form.',
      options: opts,
      correctKeys: opts.filter(function(o){return o.ok;}).map(function(o){return o.key;}),
      explain: function(){
        return 'Expanded form: ' + correctA + ' — one correct way is to multiply each digit by its place value; another is to write those products as a sum: ' + correctB + '. '
          + 'Watch out for an option that adds up to the right number but bundles several digits together, like ending in "+ ' + fmt(num % 1000) + '" — expanded form needs every digit multiplied by its own place value, one at a time.';
      }
    };
  }
  function genExpanded(){
    for (var attempt=0; attempt<20; attempt++){
      var q = genExpandedOnce();
      if (q) return q;
    }
    // 0 of 50,000 measured generations needed even a second attempt, so getting
    // here means something upstream changed. Throw rather than fall back to an
    // empty multiselect: the engine compares [] to [] and scores that CORRECT,
    // so the kid would be awarded the point for clicking Check on a blank
    // question. The engine catches this and degrades to one skippable clue.
    throw new Error('genExpanded: no valid question after 20 attempts');
  }

  function genTrueFalse(){
    var n = randInt(6,9);
    var digits = genDigits(n);
    var num = digitsToNum(digits);
    // Only ask about a NON-ZERO digit. "The digit in the tens place has a
    // value of (0 x 100)" is 0 = 0 whichever place the statement names, so
    // the "move the place" branch below can't actually make it false.
    var nonZero = [];
    for (var i=0;i<n;i++) if (digitAt(num, PLACES[i].value) !== 0) nonZero.push(i);
    var posIdx = choice(nonZero); // genDigits() forces a non-zero leading digit, so never empty
    var actualDigit = digitAt(num, PLACES[posIdx].value);
    var isTrue = Math.random() < 0.5;
    var statedDigit = actualDigit, statedPlaceIdx = posIdx;
    if (!isTrue){
      if (Math.random()<0.5){
        statedPlaceIdx = posIdx + choice([-1,1,-2,2]);
        // Stay inside the places this number actually has (n-1, not 8), so
        // the statement never names a place value bigger than the number.
        if (statedPlaceIdx<0 || statedPlaceIdx>n-1 || statedPlaceIdx===posIdx) statedPlaceIdx = (posIdx+1)%n;
      } else {
        do { statedDigit = randInt(0,9); } while (statedDigit===actualDigit);
      }
    }
    var statedValue = statedDigit * PLACES[statedPlaceIdx].value;
    return {
      type:'true-false', number:num,
      // The statement names the PLACE, not the digit's value. "The digit 8
      // has a value of..." is true of the OTHER 8 whenever a number repeats
      // that digit, which made the false branch above produce true claims.
      prompt:'In the number <span class="num-sub" style="font-size:1.15em;">' + fmt(num) + '</span>, is this statement True or False?<br><br>"The digit in the <span class="hl">' + PLACES[posIdx].short + '</span> place has a value of (' + statedDigit + ' × ' + fmt(PLACES[statedPlaceIdx].value) + ')."',
      correctAnswer: isTrue,
      explain: function(){
        return 'The digit in the ' + PLACES[posIdx].short + ' place is ' + actualDigit + ', so its real value is ' + actualDigit + ' × ' + fmt(PLACES[posIdx].value) + ' = ' + fmt(actualDigit*PLACES[posIdx].value) + '. ' + (isTrue ? 'That matches the statement.' : 'The statement claimed ' + fmt(statedValue) + ', which does not match.');
      }
    };
  }

  function genOrderCompare(){
    if (Math.random() < 0.55){
      // ordering 4 numbers least to greatest
      var n = randInt(4,6);
      var nums = [];
      while (nums.length<4){
        var v = digitsToNum(genDigits(n));
        if (nums.indexOf(v)===-1) nums.push(v);
      }
      var sorted = nums.slice().sort(function(a,b){return a-b;});
      return {
        type:'order', numbers: shuffle(nums), correctOrder: sorted,
        prompt:'Click the numbers in order from LEAST to GREATEST.',
        explain: function(){ return 'From least to greatest: ' + sorted.map(fmt).join(' < ') + '.'; }
      };
    } else {
      // compare two numbers with symbol
      var nA = randInt(4,7), nB = randInt(4,7);
      var a = digitsToNum(genDigits(nA)), b = digitsToNum(genDigits(nB));
      // Two random numbers are essentially never equal, so resampling on a===b
      // meant '=' was correct in 0 of 45,299 measured questions while the button
      // was always on screen -- the game never once taught that two numbers can
      // be equal. Make it come up deliberately about one time in eight.
      if (Math.random() < 0.125) b = a;
      else while (a===b) b = digitsToNum(genDigits(nB));
      var correctSym = a<b ? '<' : (a>b ? '>' : '=');
      return {
        type:'symbol', a:a, b:b, correctKey:correctSym,
        prompt:'Which symbol correctly compares these two numbers?',
        explain: function(){ return fmt(a) + ' ' + correctSym + ' ' + fmt(b) + '.'; }
      };
    }
  }

  function genRounding(){
    var n = randInt(5,8);
    var digits = genDigits(n);
    var num = digitsToNum(digits);
    var roundIdxOptions = [1,2,3,4,5].filter(function(i){ return i < n; });
    var roundIdx = choice(roundIdxOptions.length ? roundIdxOptions : [1]);
    var pv = PLACES[roundIdx].value;
    var correct = roundToPlace(num, pv);
    var down = Math.floor(num/pv)*pv;
    var up = down + pv;
    var opts = [correct, down, up, num].filter(function(v,i,a){ return a.indexOf(v)===i; });
    while (opts.length<4){ opts.push(correct + pv*choice([-2,2,3])); opts = opts.filter(function(v,i,a){return a.indexOf(v)===i && v>=0;}); }
    opts = shuffle(opts.slice(0,4));
    return {
      type:'mcq-simple',
      prompt:'Round <span class="num-sub" style="font-size:1.15em;">' + fmt(num) + '</span> to the nearest <span class="hl">' + PLACES[roundIdx].short.replace('-',' ') + '</span>.',
      options: opts.map(function(v){ return {key:String(v), label:fmt(v)}; }),
      correctKey:String(correct),
      explain: function(){
        return 'Look at the digit to the right of the ' + PLACES[roundIdx].short + ' place in ' + fmt(num) + '. ' + fmt(num) + ' rounds to ' + fmt(correct) + '.';
      }
    };
  }

  /* ================= MODE CONFIG ================= */
  var MODES = [
    { id:'spot', caseNo:'01', title:'Spot the Place', icon:'🔎',
      blurb:'Click the exact digit hiding in a named place value.', gen: genSpotPlace },
    { id:'value', caseNo:'02', title:'Value Detective', icon:'🕵️',
      blurb:'Work out how many times greater one digit\u2019s value is than another\u2019s.', gen: genValueCompare },
    { id:'op10', caseNo:'03', title:'The ×10 ÷10 Case', icon:'⚡',
      blurb:'Quick-fire multiplying and dividing by 10 and 100.', gen: genOp10 },
    { id:'expand', caseNo:'04', title:'Expanded Form Match', icon:'📂',
      blurb:'Pick every expression that correctly expands the number.', gen: genExpanded },
    { id:'tf', caseNo:'05', title:'True or False Files', icon:'✅',
      blurb:'Decide if a claim about a digit\u2019s value holds up.', gen: genTrueFalse },
    { id:'order', caseNo:'06', title:'Order Up!', icon:'📊',
      blurb:'Compare and order numbers from least to greatest.', gen: genOrderCompare },
    { id:'round', caseNo:'07', title:'Round Round-Up', icon:'🎯',
      blurb:'Round big numbers to the place the case calls for.', gen: genRounding }
  ];
  return {
    modes: MODES,
    homeIntro: 'Seven case files. Every case pulls fresh numbers, so you can reopen a file as many times as you need to practice.',
    trailAllFilesWord: 'seven'
  };
})();

if (typeof window !== 'undefined') { window.NUMERATION_QUESTIONS = NUMERATION_QUESTIONS; }
if (typeof module !== 'undefined' && module.exports) { module.exports = NUMERATION_QUESTIONS; }
