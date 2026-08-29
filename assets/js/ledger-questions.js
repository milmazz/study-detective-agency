/*
  Question generators and content for the Ledger Files.

  Built from a 4th-grade addition & subtraction study guide, so the cases are
  the item types that guide drills rather than a tour of one archetype:
  subtracting from a total, "N more than" comparisons, restoring a missing line
  in a table AND justifying it, picking the equation that models a story,
  reading a strip (bar model) diagram, estimating by rounding first, and
  profit.

  Two of those need input the engine does not ship -- an answer the kid types,
  and a statement completed from two groups of chips -- so this game has a
  matching assets/js/ledger-types.js, the way the numeration game has
  numeration-types.js. Everything else uses the built-in 'mcq-simple'.

  Numbers are drawn fresh every time, and every distractor models a mistake a
  kid actually makes on these items (added instead of subtracted, dropped a
  carry, stopped one step early, rounded the wrong way) rather than being a
  random near-miss -- picking the right wrong answers is most of what makes a
  practice question worth answering.

  See numeration-questions.js's header for why this lives under assets/js/ and
  why it deliberately doesn't call DetectiveGame.start() itself.
*/
var LEDGER_QUESTIONS = (function(){
  "use strict";

  var DG = (typeof DetectiveGame !== 'undefined') ? DetectiveGame
         : (typeof require === 'function') ? require('./game-engine.js')
         : null;
  if (!DG) throw new Error('assets/js/ledger-questions.js: load game-engine.js first');

  var randInt = DG.randInt, choice = DG.choice, shuffle = DG.shuffle, fmt = DG.fmt;

  /* ================= SHARED HELPERS ================= */

  function money(n){ return '$' + fmt(n); }
  function sum(arr){ return arr.reduce(function(a,b){ return a+b; }, 0); }
  function distinct(arr){ return new Set(arr).size === arr.length; }
  function roundTo(n, step){ return Math.round(n/step)*step; }
  function pct(part, whole){ return (part/whole*100).toFixed(2); }

  function lead(html){ return '<p class="q-prompt-lead">' + html + '</p>'; }

  // Same shape as word-problems-questions.js's, and styled by the same rules in
  // word-problems.css: <th scope="row"> so a screen reader announces what each
  // number is, and a <caption> naming the table that is hidden visually because
  // the prompt right above already says it.
  function contextTable(caption, rows){
    return '<div class="q-context"><table><caption>' + caption + '</caption><tbody>' +
      rows.map(function(r){
        return '<tr><th scope="row">' + r[0] + '</th><td class="v">' + r[1] + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function equationLine(html){ return '<div class="equation-line">' + html + '</div>'; }
  // The blanks in a "complete the equation" item. Lettered, because the chip
  // groups underneath have to say which blank they fill -- an unlabelled pair
  // of boxes leaves a screen-reader user with two groups and no way to tell
  // which is which.
  function blank(letter){ return '<span class="blank">' + letter + '</span>'; }

  /*
    Distractors arranged so the answer's SIZE gives nothing away.

    Same property, and the same construction, as numericOptions() in
    word-problems-questions.js: the number of distractors placed ABOVE the
    answer is drawn per question and the pool is sampled to fill that split, so
    the answer lands in each position of the sorted list about a quarter of the
    time. That file's header carries the measurements that motivated it -- a
    pool of "forgot the last step" mistakes is all larger than the answer, which
    made "never pick the biggest" a free elimination. generators.test.js
    asserts the rank spread for this game too.

    `step` is the one addition. Two cases here are about estimating, where every
    number on the board is a round hundred; a near-miss of +9 would be the only
    ragged number among them, which is an answer key in itself.
  */
  // Everything that could sit on one side of the answer: the real mistakes from
  // the pool that land there first, then a ladder of near-misses spaced by
  // `step` to fall back on. The ladder is deliberately longer than three, so a
  // side can still fill its share after the pool duplicates part of it.
  function sideCandidates(correct, dir, pool, step){
    var s = step || Math.max(9, Math.round(correct*0.06));
    var ladder = [];
    for (var i = 1; i <= 8; i++) ladder.push(correct + dir*s*i);
    return shuffle(pool).filter(function(v){
      return typeof v === 'number' && isFinite(v) &&
        (dir > 0 ? v > correct : v < correct);
    }).concat(ladder).filter(function(v){ return v > 0; });
  }
  function numericOptions(correct, pool, opts){
    opts = opts || {};
    var label = opts.label || fmt;
    var above = sideCandidates(correct, 1, pool, opts.step);
    var below = sideCandidates(correct, -1, pool, opts.step);

    var picks = [];
    function take(list, want){
      for (var i = 0; i < list.length && want > 0; i++){
        if (picks.indexOf(list[i]) === -1){ picks.push(list[i]); want--; }
      }
      return want; // how many that side could not supply
    }

    /*
      Each side is filled from its OWN candidates, never from the other's.

      Topping up across the middle is what the first version did, and it is a
      silent way to lose the property this whole function exists for: when a
      pool mistake happened to coincide with a near-miss -- which the estimating
      case hit in about a third of draws, since its numbers are all round
      hundreds -- the duplicate was dropped and the missing slot came back from
      the other side, so the answer was the third option 43% of the time.
    */
    var wantAbove = randInt(0,3);
    var shortAbove = take(above, wantAbove);
    var shortBelow = take(below, 3 - wantAbove);
    // Only when a side genuinely cannot supply its share -- a small answer has
    // only so many whole numbers under it -- does it borrow from the other.
    if (shortAbove) take(below, shortAbove);
    if (shortBelow) take(above, shortBelow);
    // Backstop: strictly increasing, and picks holds at most three values, so
    // it can collide at most three times before it has to terminate.
    for (var k = 1; picks.length < 3; k++){
      var v = correct + k*(opts.step || 13);
      if (picks.indexOf(v) === -1) picks.push(v);
    }

    return shuffle([correct].concat(picks)).map(function(v){
      return { key:String(v), label:label(v) };
    });
  }

  /*
    Two distractor chips, with the side each lands on drawn per question.

    The chip-group version of numericOptions' split, and it exists for the same
    reason: three chips built from "left a line out" mistakes are all smaller
    than the right answer, so the group is answered correctly every time by
    picking the biggest number without reading anything. Returns null when the
    sides between them cannot supply two usable chips, for the caller to retry.
  */
  function twoSidedChips(correct, below, above){
    var picks = [];
    function take(list, want){
      var added = 0;
      shuffle(list).forEach(function(v){
        if (added >= want || v <= 0 || v === correct || picks.indexOf(v) !== -1) return;
        picks.push(v); added++;
      });
      return want - added;
    }
    var wantAbove = randInt(0, 2);
    var shortAbove = take(above, wantAbove);
    var shortBelow = take(below, 2 - wantAbove);
    if (shortAbove) take(below, shortAbove);
    if (shortBelow) take(above, shortBelow);
    return picks.length === 2 ? [correct].concat(picks) : null;
  }

  // The classic slip on a multi-digit sum: add each column and drop every
  // carry. It is the wrong answer a kid arrives at by doing real work, which
  // makes it worth more as a distractor than any number picked near the answer.
  function noCarrySum(a, b){
    var out = 0, place = 1;
    while (a > 0 || b > 0){
      out += ((a%10 + b%10) % 10) * place;
      a = Math.floor(a/10); b = Math.floor(b/10); place *= 10;
    }
    return out;
  }

  var WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  function twoConsecutiveDays(){
    var start = randInt(0, WEEKDAYS.length-2);
    return WEEKDAYS.slice(start, start+2);
  }

  /* ================= CASE 01: subtract from a total (typed answer) ================= */

  var STOREROOMS = [
    { place:'the evidence locker', unit:'sealed bags', out:'signed out' },
    { place:'the file room', unit:'case folders', out:'checked out' },
    { place:'the supply closet', unit:'notebooks', out:'handed out' },
    { place:'the photo archive', unit:'prints', out:'pulled' }
  ];
  var ARCHIVES = [
    { thing:'cold-case files', holder:'the basement archive', slot:'shelf slots' },
    { thing:'evidence photos', holder:'the agency server', slot:'photo slots' },
    { thing:'witness statements', holder:'the record room', slot:'binder pages' }
  ];

  // Two amounts leave a starting total: 850 − 236 − 189. The step kids drop is
  // the second subtraction, which is why the distractor-free typed answer is
  // the right shape for it -- there is nothing to eliminate down to.
  function genTakeawayTwoSteps(){
    var room = choice(STOREROOMS);
    var days = twoConsecutiveDays();
    // Both amounts are drawn as a share of what is still on the shelf when they
    // are taken, so the pile can never run past empty. Drawn independently, a
    // big first day and a big second day subtracted past the total and the case
    // asked for a negative number of folders.
    var total = randInt(620, 1500);
    var a = randInt(110, Math.floor(total*0.35));
    var b = randInt(95, Math.floor((total - a)*0.5));
    var left = total - a - b;

    return {
      type:'numeric-entry',
      correctValue: left,
      entryLabel: 'How many ' + room.unit + ' are still in ' + room.place + '?',
      prompt:
        lead('At the start of the week ' + room.place + ' held <b>' + fmt(total) + '</b> ' + room.unit +
          '. Agents ' + room.out + ' <b>' + fmt(a) + '</b> on ' + days[0] + ' and <b>' + fmt(b) +
          '</b> on ' + days[1] + '. How many ' + room.unit + ' are still in ' + room.place + '?') +
        contextTable(room.unit + ' this week', [
          ['Started with', fmt(total)],
          [days[0] + ' — ' + room.out, fmt(a)],
          [days[1] + ' — ' + room.out, fmt(b)]
        ]),
      explain: function(){
        return 'Both days come out of the same starting pile, so subtract twice: ' +
          fmt(total) + ' − ' + fmt(a) + ' = ' + fmt(total-a) + ', then ' + fmt(total-a) + ' − ' +
          fmt(b) + ' = ' + fmt(left) + '. (You could also add the two days first: ' + fmt(a) + ' + ' +
          fmt(b) + ' = ' + fmt(a+b) + ', then ' + fmt(total) + ' − ' + fmt(a+b) + ' = ' + fmt(left) + '.)';
      }
    };
  }

  // One subtraction, but across a borrow-heavy five-digit pair -- 24,680 − 7,945
  // is the study guide's, and the regrouping is the whole difficulty.
  function genTakeawayOneStep(){
    var arc = choice(ARCHIVES);
    var capacity = randInt(12500, 48900);
    var used = randInt(3200, capacity - 2500);
    var open = capacity - used;

    return {
      type:'numeric-entry',
      correctValue: open,
      entryLabel: 'How many ' + arc.slot + ' are still open?',
      prompt:
        lead(arc.holder.charAt(0).toUpperCase() + arc.holder.slice(1) + ' has room for <b>' +
          fmt(capacity) + '</b> ' + arc.thing + '. <b>' + fmt(used) + '</b> ' + arc.slot +
          ' are already filled. How many ' + arc.slot + ' are still open?') +
        contextTable(arc.slot, [
          ['Room for', fmt(capacity)],
          ['Already filled', fmt(used)]
        ]),
      explain: function(){
        return 'Take the filled slots out of the total room: ' + fmt(capacity) + ' − ' + fmt(used) +
          ' = ' + fmt(open) + '.';
      }
    };
  }

  function genTakeaway(){
    return choice([genTakeawayTwoSteps, genTakeawayOneStep])();
  }

  /* ================= CASE 02: "N more than" ================= */

  var GATES = [
    { who:'people', at:'the county fair' },
    { who:'fans', at:'the ballpark' },
    { who:'visitors', at:'the museum' },
    { who:'readers', at:'the library open house' }
  ];

  function genMoreThan(){
    var gate = choice(GATES);
    var days = twoConsecutiveDays();
    var first = randInt(12000, 79000);
    var more = randInt(1200, 9800);
    var second = first + more;
    var both = first + second;
    var askBoth = randInt(0,1) === 1;

    var table = contextTable(gate.who + ' by day', [
      [days[0], fmt(first)],
      [days[1], fmt(first) + ' + ' + fmt(more)]
    ]);
    var story = 'On ' + days[0] + ', <b>' + fmt(first) + '</b> ' + gate.who + ' came to ' + gate.at +
      '. On ' + days[1] + ', <b>' + fmt(more) + ' more</b> ' + gate.who + ' came than on ' + days[0] + '. ';

    if (askBoth){
      return {
        type:'mcq-simple',
        prompt: lead(story + 'How many ' + gate.who + ' came on the <b>two days altogether</b>?') + table,
        // second: stopped at the bigger day. first+first: missed the "more".
        // 2*second: doubled the bigger day instead of adding the two days.
        // first-more: read "more than" as a subtraction.
        options: numericOptions(both, [second, 2*first, 2*second, first-more, noCarrySum(first, second)]),
        correctKey: String(both),
        explain: function(){
          return days[1] + ' had ' + fmt(first) + ' + ' + fmt(more) + ' = ' + fmt(second) + '. The two days together are ' +
            fmt(first) + ' + ' + fmt(second) + ' = ' + fmt(both) + '.';
        }
      };
    }
    return {
      type:'mcq-simple',
      prompt: lead(story + 'How many ' + gate.who + ' came on <b>' + days[1] + '</b>?') + table,
      // first-more: read "more than" as a subtraction. noCarrySum: added the
      // columns and dropped the carries. both: answered the two-day total.
      options: numericOptions(second, [first-more, noCarrySum(first, more), both, more]),
      correctKey: String(second),
      explain: function(){
        return '"' + fmt(more) + ' more than ' + days[0] + '" means start at ' + days[0] + '’s count and add: ' +
          fmt(first) + ' + ' + fmt(more) + ' = ' + fmt(second) + '.';
      }
    };
  }

  /* ================= CASE 03: the missing line, and why ================= */

  var LEDGERS = [
    { caption:'visitors by exhibit', row:'Exhibit', unit:'visitors', book:'the visitor log' },
    { caption:'tips by week', row:'Week', unit:'tips', book:'the tip-line log' },
    { caption:'miles by route', row:'Route', unit:'miles', book:'the mileage book' },
    { caption:'boxes by warehouse', row:'Warehouse', unit:'boxes', book:'the storage ledger' }
  ];

  function genMissingLine(){
    var led = choice(LEDGERS);
    var values = [0,1,2,3].map(function(){ return randInt(11000, 39000); });
    var total = sum(values);
    var missingIdx = randInt(0,3);
    var known = values.filter(function(_, i){ return i !== missingIdx; });
    var missing = values[missingIdx];
    var sumKnown = sum(known);
    // Subtracted only two of the three known lines -- the "lost track partway
    // down the column" mistake, and the one that looks most like real work.
    var droppedOne = total - known[1] - known[2];

    /*
      The value chips go through numericOptions rather than being listed.

      Listed, they were `missing`, the three knowns added up, and the
      subtraction stopped a line early -- and both of those are larger than the
      answer by construction, every single time. The whole group was answerable
      by picking the smallest number on the board. Subtracting a line twice is
      the mistake that lands under the answer, and the split decides how many
      of each get offered.
    */
    var valueChips = numericOptions(missing, [
      sumKnown, droppedOne, missing + known[1],
      missing - known[0], missing - known[1], missing - known[2]
    ]);

    var rowName = led.row + ' ' + (missingIdx+1);
    var eq = {
      right: fmt(total) + ' − ' + known.map(fmt).join(' − ') + ' = ' + fmt(missing),
      allKnown: known.map(fmt).join(' + ') + ' = ' + fmt(sumKnown),
      partial: fmt(total) + ' − ' + fmt(known[1]) + ' − ' + fmt(known[2]) + ' = ' + fmt(droppedOne)
    };

    return {
      type:'choose-each',
      prompt:
        lead('The total in ' + led.book + ' is <b>' + fmt(total) + '</b> ' + led.unit +
          ' across all four lines, but <b>' + rowName + '</b>’s line is smudged. ' +
          'Choose the correct answer from each group to complete the statement.') +
        contextTable(led.caption, values.map(function(v, i){
          return [led.row + ' ' + (i+1), i === missingIdx ? '?' : fmt(v)];
        })),
      groups: [
        { id:'g1', lead: 'The missing count for ' + rowName + ' was:',
          options: valueChips,
          correctKey: String(missing) },
        // Every equation here is arithmetically true. Only one of them answers
        // the question, which is the whole point of the item: the study guide's
        // version scores the reasoning separately from the number.
        { id:'g2', lead:'because:',
          options: shuffle([
            { key:'right', label:'<span class="eq-opt">' + eq.right + '</span>' },
            { key:'allKnown', label:'<span class="eq-opt">' + eq.allKnown + '</span>' },
            { key:'partial', label:'<span class="eq-opt">' + eq.partial + '</span>' }
          ]),
          correctKey:'right' }
      ],
      explain: function(){
        return 'The four lines add up to the total, so take all three lines you can read out of it: ' +
          fmt(total) + ' − ' + known.map(fmt).join(' − ') + ' = ' + fmt(missing) + '. Adding the three you can read gives ' +
          fmt(sumKnown) + ', which is the part of the total you already have — not the missing line.';
      }
    };
  }
  /* ================= CASE 04: which equation fits ================= */

  var PEOPLE = ['Noah','Lena','Sofia','Carlos','Ava','Mia','Jamal','Keira','Ethan','Bianca'];
  function twoPeople(){ return shuffle(PEOPLE).slice(0,2); }
  // `value` is what the equation comes to. It is not rendered -- it is what
  // genWhichEquation checks the four options against before offering them.
  function eqOpt(key, text, value){
    return { key:key, label:'<span class="eq-opt">' + text + '</span>', value:value };
  }

  // Part and whole: one part is known, the whole is known, find the other part.
  function eqPartWhole(){
    var who = twoPeople();
    var noun = choice(['trading cards','stickers','marbles','postcards']);
    var mine = randInt(45, 120);
    var other = randInt(30, 95);
    if (other === mine) other += 7;
    var whole = mine + other;

    return {
      story: who[0] + ' has <b>' + fmt(mine) + '</b> ' + noun + '. ' + who[0] + ' and ' + who[1] +
        ' have <b>' + fmt(whole) + '</b> ' + noun + ' altogether. Which equation can be used to find <b>x</b>, the number of ' +
        noun + ' ' + who[1] + ' has?',
      correct: eqOpt('sub', 'x = ' + fmt(whole) + ' − ' + fmt(mine), whole - mine),
      wrong: [
        eqOpt('add', 'x = ' + fmt(whole) + ' + ' + fmt(mine), whole + mine),
        eqOpt('twice', 'x = ' + fmt(whole) + ' − ' + fmt(mine) + ' − ' + fmt(other), whole - mine - other),
        eqOpt('addgap', 'x = ' + fmt(whole) + ' + ' + fmt(other), whole + other)
      ],
      explain: 'The two parts make the whole, so one part is the whole minus the other part: x = ' +
        fmt(whole) + ' − ' + fmt(mine) + ' = ' + fmt(other) + '.'
    };
  }

  // Two equal groups, then some are given away.
  function eqTwoGroupsMinus(){
    var who = twoPeople()[0];
    var kinds = choice([['blue','black','markers'], ['red','green','folders'], ['wide','narrow','rulers']]);
    var each = randInt(40, 95);
    var given = randInt(20, each - 8);

    return {
      story: who + ' has <b>' + fmt(each) + '</b> ' + kinds[0] + ' ' + kinds[2] + ' and <b>' + fmt(each) + '</b> ' +
        kinds[1] + ' ' + kinds[2] + '. ' + who + ' gives <b>' + fmt(given) + '</b> ' + kinds[2] +
        ' to the field team. Which equation can be used to find <b>p</b>, the number of ' + kinds[2] + ' left?',
      correct: eqOpt('both', fmt(each) + ' + ' + fmt(each) + ' − ' + fmt(given) + ' = p', each + each - given),
      wrong: [
        eqOpt('onegroup', fmt(each) + ' − ' + fmt(given) + ' = p', each - given),
        eqOpt('addgiven', fmt(each) + ' + ' + fmt(given) + ' = p', each + given),
        eqOpt('addall', fmt(each) + ' + ' + fmt(each) + ' + ' + fmt(given) + ' = p', each + each + given)
      ],
      explain: 'Both groups start on the shelf, so they are added first, and only then is what was given away taken off: ' +
        fmt(each) + ' + ' + fmt(each) + ' − ' + fmt(given) + ' = ' + fmt(each+each-given) + '.'
    };
  }

  // "N more than", asked for the TOTAL of both -- the one that needs the
  // smaller amount added twice.
  function eqMoreThanTotal(){
    var who = twoPeople();
    var noun = choice(['cans','tickets','tips','flyers']);
    var base = randInt(18, 60);
    var extra = randInt(3, 25);
    if (extra === base) extra += 3;

    return {
      story: who[0] + ' collected <b>' + fmt(base) + '</b> ' + noun + '. ' + who[1] + ' collected <b>' + fmt(extra) +
        ' more</b> ' + noun + ' than ' + who[0] + '. Which equation can be used to find <b>b</b>, the total number of ' +
        noun + ' they collected together?',
      correct: eqOpt('twice', 'b = ' + fmt(base) + ' + ' + fmt(base) + ' + ' + fmt(extra), base + base + extra),
      wrong: [
        eqOpt('once', fmt(base) + ' + ' + fmt(extra) + ' = b', base + extra),
        eqOpt('minus', fmt(base) + ' + ' + fmt(base) + ' − ' + fmt(extra) + ' = b', base + base - extra),
        eqOpt('doubleextra', 'b = ' + fmt(base) + ' + ' + fmt(extra) + ' + ' + fmt(extra), base + extra + extra)
      ],
      explain: who[1] + ' collected ' + fmt(base) + ' + ' + fmt(extra) + ' = ' + fmt(base+extra) +
        '. The total is both of them: ' + fmt(base) + ' + ' + fmt(base+extra) + ' = ' + fmt(base+base+extra) +
        ', which is why ' + fmt(base) + ' appears twice.'
    };
  }

  // "N more than", asked for the SMALLER amount -- the one where the words say
  // "more" but the work is a subtraction.
  function eqMoreThanSmaller(){
    var who = twoPeople();
    var noun = choice(['pages','laps','minutes','stamps']);
    var extra = randInt(6, 30);
    var bigger = randInt(2*extra + 12, 95);

    return {
      story: who[0] + ' read <b>' + fmt(extra) + ' more</b> ' + noun + ' than ' + who[1] + '. ' + who[0] +
        ' read <b>' + fmt(bigger) + '</b> ' + noun + '. Which equation can be used to find <b>r</b>, the number of ' +
        noun + ' ' + who[1] + ' read?',
      correct: eqOpt('sub', fmt(bigger) + ' − ' + fmt(extra) + ' = r', bigger - extra),
      wrong: [
        eqOpt('add', fmt(bigger) + ' + ' + fmt(extra) + ' = r', bigger + extra),
        eqOpt('addtwice', 'r = ' + fmt(bigger) + ' + ' + fmt(extra) + ' + ' + fmt(extra), bigger + extra + extra),
        eqOpt('subtwice', 'r = ' + fmt(bigger) + ' − ' + fmt(extra) + ' − ' + fmt(extra), bigger - extra - extra)
      ],
      explain: who[1] + ' read fewer, so the "more" comes back off the bigger number: ' + fmt(bigger) + ' − ' +
        fmt(extra) + ' = ' + fmt(bigger-extra) + '. The word "more" is in the story, but the work is a subtraction.'
    };
  }

  var EQUATION_TEMPLATES = [eqPartWhole, eqTwoGroupsMinus, eqMoreThanTotal, eqMoreThanSmaller];

  function genWhichEquation(){
    for (var attempt=0; attempt<20; attempt++){
      var t = choice(EQUATION_TEMPLATES)();
      var opts = [t.correct].concat(t.wrong);
      /*
        Two equations coming to the same number is two right answers, only one
        of which can be scored -- and the draws where it happens are ordinary
        ones, not extremes: "72 + 72 − 55 = p" and "72 + 55 = p" are both 89
        whenever the group size is twice what was given away. Checked here,
        over the values, rather than fenced off with a numeric guard per
        template, because every template has its own coincidences and a guard
        list only covers the ones somebody thought of.
      */
      if (!distinct(opts.map(function(o){ return o.value; }))) continue;
      return {
        type:'mcq-simple',
        prompt: lead(t.story) +
          '<p class="q-note">Don’t solve it — pick the equation that would.</p>',
        options: shuffle(opts).map(function(o){ return { key:o.key, label:o.label }; }),
        correctKey: t.correct.key,
        explain: function(){ return t.explain; }
      };
    }
    throw new Error('genWhichEquation: no valid question after 20 attempts');
  }

  /* ================= CASE 05: read the strip diagram ================= */

  var PARTNERSHIPS = [
    { what:'handmade bracelets', earn:'earned' },
    { what:'car-wash tickets', earn:'earned' },
    { what:'bake-sale boxes', earn:'earned' },
    { what:'dog-walking hours', earn:'were paid' }
  ];

  function miniBrace(widthPct, label){
    return '<span class="mini-brace" style="flex:0 0 ' + widthPct + '%;">' + label + '</span>';
  }
  function miniSeg(widthPct, label, cls){
    return '<span class="mini-seg ' + (cls||'') + '" style="flex:0 0 ' + widthPct + '%;">' + label + '</span>';
  }
  /*
    A bar model small enough to sit inside an option button.

    The drawing is aria-hidden and the option's accessible name comes from the
    .sr-only sentence instead. Read out, the drawing is a bag of numbers --
    "m m $135 $165 $120" -- which is the same for two of the four options and
    says nothing about the structure the question is actually asking about.
  */
  function miniModel(description, braces, segs){
    return '<span class="sr-only">' + description + '</span>' +
      '<span class="mini-model" aria-hidden="true">' +
        '<span class="mini-row mini-top">' + braces.join('') + '</span>' +
        '<span class="mini-row mini-bar">' + segs.join('') + '</span>' +
      '</span>';
  }

  function genStripModel(){
    var deal = choice(PARTNERSHIPS);
    var who = twoPeople();
    var weeks = ['first','second','third'];
    // Kept in a narrow band on purpose: the segments are drawn in proportion,
    // and a lopsided draw would squeeze a label out of its own segment. The
    // narrowest possible share here is 105/885, about 12%.
    var parts = [0,1,2].map(function(){ return randInt(21, 59) * 5; });
    var total = sum(parts);
    var labels = parts.map(money);
    var widths = parts.map(function(v){ return pct(v, total); });
    var twoTotal = parts[0] + parts[1];

    var opts = [
      { key:'ok', ok:true, label: miniModel(
          'One bar labeled m, split into three parts: ' + labels.join(', ') + '.',
          [miniBrace('100', 'm')],
          parts.map(function(v, i){ return miniSeg(widths[i], labels[i]); })) },
      { key:'twoM', label: miniModel(
          'Two bars each labeled m, side by side, over three parts: ' + labels.join(', ') + '.',
          [miniBrace('50', 'm'), miniBrace('50', 'm')],
          parts.map(function(v, i){ return miniSeg(widths[i], labels[i]); })) },
      { key:'threeM', label: miniModel(
          'Three bars labeled m, one over each part: ' + labels.join(', ') + '.',
          widths.map(function(w){ return miniBrace(w, 'm'); }),
          parts.map(function(v, i){ return miniSeg(widths[i], labels[i]); })) },
      { key:'minus', label: miniModel(
          'One bar labeled m, holding ' + labels[0] + ' + ' + labels[1] + ' − ' + labels[2] + '.',
          [miniBrace('100', 'm')],
          [miniSeg('100', labels[0] + ' + ' + labels[1] + ' − ' + labels[2], 'mini-wide')]) },
      { key:'twoParts', label: miniModel(
          'One bar labeled m, split into two parts: ' + labels[0] + ' and ' + labels[1] + '.',
          [miniBrace('100', 'm')],
          [miniSeg(pct(parts[0], twoTotal), labels[0]), miniSeg(pct(parts[1], twoTotal), labels[1])]) }
    ];
    var correct = opts[0];
    var picked = shuffle([correct].concat(shuffle(opts.slice(1)).slice(0,3)));

    return {
      type:'mcq-simple',
      prompt: lead(who[0] + ' and ' + who[1] + ' are partners ' + (deal.earn === 'earned' ? 'selling ' : 'logging ') +
        deal.what + '. Together they ' + deal.earn + ' <b>' + labels[0] + '</b> the ' + weeks[0] + ' week, <b>' +
        labels[1] + '</b> the ' + weeks[1] + ' week, and <b>' + labels[2] + '</b> the ' + weeks[2] +
        ' week. Which strip diagram represents <b>m</b>, the total amount they ' + deal.earn + '?'),
      options: picked.map(function(o){ return { key:o.key, label:o.label }; }),
      correctKey: correct.key,
      explain: function(){
        return 'm is the whole thing, so one bar labeled m sits across all three weeks, and the three weeks are the parts inside it: ' +
          labels.join(' + ') + ' = ' + money(total) + '. Two bars labeled m would say the total was collected twice, and a bar holding a subtraction would say a week was taken away.';
      }
    };
  }

  /* ================= CASE 06: estimate by rounding first ================= */

  var WALKERS = ['Jordan','Priya','Marcus','Elle','Omar'];

  // Round two of four table rows to the nearest hundred and add them. The first
  // rounded number is printed, so the item is about the SECOND rounding and the
  // sum, exactly like the study guide's fill-in-the-equation version.
  function genEstimateSumOnce(){
    var who = choice(WALKERS);
    var days = WEEKDAYS.slice(0,4);
    var vals = days.map(function(){ return randInt(2050, 3949); });
    var i = randInt(0,3);
    var j = randInt(0,3);
    if (j === i) j = (i+1) % 4;

    var r1 = roundTo(vals[i], 100), r2 = roundTo(vals[j], 100);
    if (r1 === r2) return null;  // two days that round the same way say nothing

    // Rounding the wrong way, and rounding the wrong DAY -- r1 is already on
    // the line, so offering it again is the "used that number twice" slip. It
    // goes on whichever side its own size puts it on, and the split decides how
    // many chips come from each side.
    var below = [r2-100, r2-200], above = [r2+100, r2+200];
    (r1 < r2 ? below : above).unshift(r1);
    var chips = twoSidedChips(r2, below, above);
    if (!chips || chips.some(function(v){ return v <= 0; })) return null;
    if (!distinct(chips.map(function(v){ return r1 + v; }))) return null;

    return {
      type:'choose-each',
      prompt:
        lead('Complete the equation to find the best estimate of the number of steps ' + who + ' walked on <b>' +
          days[i] + '</b> and <b>' + days[j] + '</b>.') +
        contextTable('steps by day', days.map(function(d, k){ return [d, fmt(vals[k])]; })) +
        equationLine(fmt(r1) + ' + ' + blank('A') + ' = ' + blank('B')),
      groups: [
        { id:'g1', lead:'Blank A — ' + days[j] + '’s steps, rounded to the nearest hundred:',
          options: shuffle(chips).map(function(v){ return { key:String(v), label:fmt(v) }; }),
          correctKey: String(r2) },
        // Shuffled separately from the chips above: in the same order the two
        // rows would line up, and Blank B could be answered by position.
        { id:'g2', lead:'Blank B — the estimated total:',
          options: shuffle(chips).map(function(v){ return { key:String(r1+v), label:fmt(r1+v) }; }),
          correctKey: String(r1+r2) }
      ],
      explain: function(){
        return 'Round each day to the nearest hundred first: ' + fmt(vals[i]) + ' rounds to ' + fmt(r1) + ', and ' +
          fmt(vals[j]) + ' rounds to ' + fmt(r2) + '. Then add the rounded numbers: ' + fmt(r1) + ' + ' + fmt(r2) +
          ' = ' + fmt(r1+r2) + '.';
      }
    };
  }

  // The same fill-in-the-equation shape, but a subtraction, and with the total
  // already given as a round number -- so only the amount coming off gets
  // rounded.
  function genEstimateDiffOnce(){
    var event = choice(['the block party','the fireworks show','the winter festival','the parade']);
    var total = randInt(21, 89) * 100;
    var leaving = randInt(160, 780);
    var r = roundTo(leaving, 100);
    // Rounding the wrong way, by one hundred or by two. Both directions are on
    // offer and which side they come from is drawn per question: chips of
    // r−100, r, r+100 would make "take the middle number" a free pass.
    var chips = twoSidedChips(r, [r-100, r-200], [r+100, r+200]);
    if (!chips || chips.some(function(v){ return v <= 0 || v >= total; })) return null;
    var sums = chips.map(function(v){ return total - v; });
    if (!distinct(sums)) return null;

    return {
      type:'choose-each',
      prompt:
        lead('About <b>' + fmt(total) + '</b> people came to ' + event + '. About <b>' + fmt(leaving) +
          '</b> of them left early. Complete the equation to show about how many people stayed.') +
        equationLine(fmt(total) + ' − ' + blank('A') + ' = ' + blank('B')),
      groups: [
        { id:'g1', lead:'Blank A — the number who left, rounded to the nearest hundred:',
          options: shuffle(chips.map(function(v){ return { key:String(v), label:fmt(v) }; })),
          correctKey: String(r) },
        { id:'g2', lead:'Blank B — about how many stayed:',
          options: shuffle(sums.map(function(v){ return { key:String(v), label:fmt(v) }; })),
          correctKey: String(total - r) }
      ],
      explain: function(){
        return fmt(leaving) + ' rounds to ' + fmt(r) + ' at the nearest hundred, so the estimate is ' +
          fmt(total) + ' − ' + fmt(r) + ' = ' + fmt(total - r) + ' people.';
      }
    };
  }

  var MONTHS = ['January','February','March','April','May','June','July'];

  // Five rows, all rounded and added. Every option is a round hundred: a ragged
  // number among them would be eliminable on sight, without estimating anything.
  function genEstimateTotal(){
    var who = choice(WALKERS);
    var start = randInt(0, MONTHS.length-5);
    var months = MONTHS.slice(start, start+5);
    var vals = months.map(function(){ return randInt(105, 245); });
    var rounded = vals.map(function(v){ return roundTo(v, 100); });
    var correct = sum(rounded);
    var alwaysDown = sum(vals.map(function(v){ return Math.floor(v/100)*100; }));
    var alwaysUp = sum(vals.map(function(v){ return Math.ceil(v/100)*100; }));

    return {
      type:'mcq-simple',
      prompt:
        lead('Round each month to the nearest hundred, then add. About how many minutes did ' + who +
          ' practice in all?') +
        contextTable('minutes practiced by month', months.map(function(m, i){ return [m, fmt(vals[i])]; })),
      options: numericOptions(correct, [alwaysDown, alwaysUp, correct+200, correct-200], {step:100}),
      correctKey: String(correct),
      explain: function(){
        return 'Rounded to the nearest hundred: ' + vals.map(function(v, i){
          return fmt(v) + ' → ' + fmt(rounded[i]);
        }).join(', ') + '. Adding those gives ' + fmt(correct) + ' minutes.';
      }
    };
  }

  function genEstimate(){
    var pick = randInt(0,2);
    if (pick === 2) return genEstimateTotal();
    var maker = pick === 0 ? genEstimateSumOnce : genEstimateDiffOnce;
    for (var attempt=0; attempt<20; attempt++){
      var q = maker();
      if (q) return q;
    }
    // Two chips reading the same number would be a group with two right
    // answers -- see genMissingLine's guard.
    throw new Error('genEstimate: no valid question after 20 attempts');
  }

  /* ================= CASE 07: spent, earned, profit ================= */

  var STALLS = [
    { job:'snack bags', lines:['snacks','bags','labels'] },
    { job:'friendship bracelets', lines:['beads','cord','clasps'] },
    { job:'car-wash kits', lines:['soap','sponges','towels'] },
    { job:'seed packets', lines:['seeds','envelopes','stickers'] }
  ];

  function genProfitTableOnce(){
    var stall = choice(STALLS);
    var who = twoPeople()[0];
    var costs = [randInt(24, 60), randInt(9, 22), randInt(4, 8)];
    if (costs[0] === costs[1] || costs[1] === costs[2] || costs[0] === costs[2]) costs[1] += 1;
    var spent = sum(costs);
    // The profit is floored above the biggest line that can be counted twice
    // below, so every wrong total still leaves a profit worth talking about.
    var earned = spent + randInt(45, 140);
    var profit = earned - spent;
    /*
      Each wrong total is one line miscounted -- left out of the column, or
      added into it twice -- and each wrong profit is the profit that same wrong
      total gives, so the two groups stay consistent with each other.

      Both kinds are offered, and which side they fall on is drawn per question.
      With only lines left out, every wrong total was smaller than the right
      one, and the group could be answered by picking the biggest number.
    */
    var spentChips = twoSidedChips(spent,
      [spent - costs[0], spent - costs[1], spent - costs[2]],
      [spent + costs[1], spent + costs[2]]);
    if (!spentChips) return null;

    return {
      type:'choose-each',
      prompt:
        lead(who + ' bought supplies to make ' + stall.job + ' for the school fair, and took in <b>' +
          money(earned) + '</b> in sales. Choose the correct answer from each group to complete the statements.') +
        contextTable('supplies and sales', [
          [stall.lines[0], money(costs[0])],
          [stall.lines[1], money(costs[1])],
          [stall.lines[2], money(costs[2])],
          ['Money taken in', money(earned)]
        ]),
      groups: [
        { id:'g1', lead: who + ' spent this much on supplies in total:',
          options: shuffle(spentChips).map(function(v){ return { key:String(v), label:money(v) }; }),
          correctKey: String(spent) },
        // Shuffled separately: in the same order as the totals above, the two
        // rows would line up and the second group would be answered by
        // position rather than by subtracting anything.
        { id:'g2', lead:'The profit after paying for the supplies was:',
          options: shuffle(spentChips).map(function(v){
            return { key:String(earned - v), label:money(earned - v) };
          }),
          correctKey: String(profit) }
      ],
      explain: function(){
        return 'All three supply lines are money going out: ' + costs.map(money).join(' + ') + ' = ' + money(spent) +
          '. Profit is what is left of the sales after paying for them: ' + money(earned) + ' − ' + money(spent) +
          ' = ' + money(profit) + '.';
      }
    };
  }

  function genProfitSwap(){
    var who = twoPeople()[0];
    var kit = choice(['a craft kit','a model rocket','a beading kit','a birdhouse kit']);
    var cost = randInt(12, 45);
    var profit = randInt(3, cost-2);
    var price = cost + profit;
    var askPrice = randInt(0,1) === 1;

    if (askPrice){
      return {
        type:'mcq-simple',
        prompt: lead(who + ' bought ' + kit + ' for <b>' + money(cost) + '</b>. ' + who +
          ' sold the finished project and made a profit of <b>' + money(profit) + '</b>. What was the selling price?'),
        // cost-profit: subtracted the profit instead of adding it. cost:
        // answered with what was paid. cost+2*profit / 2*cost: counted a piece
        // of the story twice.
        options: numericOptions(price, [cost-profit, cost, cost+2*profit, 2*cost], {label:money}),
        correctKey: String(price),
        explain: function(){
          return 'Profit is what is left after paying the cost back, so the selling price has to cover both: ' +
            money(cost) + ' + ' + money(profit) + ' = ' + money(price) + '.';
        }
      };
    }
    return {
      type:'mcq-simple',
      prompt: lead(who + ' sold a finished project for <b>' + money(price) + '</b> and made a profit of <b>' +
        money(profit) + '</b>. How much did ' + who + ' pay for the supplies?'),
      // price+profit: added the profit again. price: forgot the profit came out.
      options: numericOptions(cost, [price+profit, price, price-2*profit, profit], {label:money}),
      correctKey: String(cost),
      explain: function(){
        return 'The selling price is the cost plus the profit, so the cost is what is left when the profit comes off: ' +
          money(price) + ' − ' + money(profit) + ' = ' + money(cost) + '.';
      }
    };
  }

  function genProfitTable(){
    for (var attempt=0; attempt<20; attempt++){
      var q = genProfitTableOnce();
      if (q) return q;
    }
    throw new Error('genProfitTable: no valid question after 20 attempts');
  }

  function genProfit(){
    return choice([genProfitTable, genProfitSwap])();
  }

  /* ================= MODE CONFIG ================= */
  var MODES = [
    { id:'takeaway', caseNo:'01', title:'Checked Out', icon:'📦',
      blurb:'Start from a total, take away what left the room, and type what’s left.', gen: genTakeaway },
    { id:'morethan', caseNo:'02', title:'More Than the Day Before', icon:'📈',
      blurb:'One day beat another by a set amount. Find the bigger day — or both days together.', gen: genMoreThan },
    { id:'missingline', caseNo:'03', title:'The Smudged Line', icon:'🧾',
      blurb:'A total, three lines you can read, and one you can’t. Find it, and say why.', gen: genMissingLine },
    { id:'equation', caseNo:'04', title:'Which Equation Fits?', icon:'🟰',
      blurb:'Don’t solve it — pick the equation that would.', gen: genWhichEquation },
    { id:'strip', caseNo:'05', title:'Read the Strip Diagram', icon:'📊',
      blurb:'Four bar models, one story. Which diagram matches?', gen: genStripModel },
    { id:'estimate', caseNo:'06', title:'Close Enough', icon:'🎯',
      blurb:'Round the numbers first, then finish the estimate.', gen: genEstimate },
    { id:'profit', caseNo:'07', title:'The Payout', icon:'💵',
      blurb:'Add up what went out, then work out what was left over.', gen: genProfit }
  ];

  return {
    modes: MODES,
    homeIntro: 'Seven case files on adding and subtracting. Type the number, pick the equation that fits, read the strip diagram, and estimate on the fly — every case pulls fresh numbers each time you open it.',
    trailAllFilesWord: 'seven'
  };
})();

if (typeof window !== 'undefined') { window.LEDGER_QUESTIONS = LEDGER_QUESTIONS; }
if (typeof module !== 'undefined' && module.exports) { module.exports = LEDGER_QUESTIONS; }
