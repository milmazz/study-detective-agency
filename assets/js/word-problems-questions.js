/*
  Question generators and content for the Missing Evidence Files.

  Every case here uses the engine's built-in 'mcq-simple' type as-is -- the
  equation and strip diagram are just HTML built into the question's own
  `prompt` string, the same technique numeration-questions.js uses for its
  <span class="hl"> place names. No custom registerType, so unlike the
  numeration game there is no matching *-types.js module.

  See numeration-questions.js's header for why this lives under assets/js/
  and why it deliberately doesn't call DetectiveGame.start() itself.
*/
var WORD_PROBLEMS_QUESTIONS = (function(){
  "use strict";

  var DG = (typeof DetectiveGame !== 'undefined') ? DetectiveGame
         : (typeof require === 'function') ? require('./game-engine.js')
         : null;
  if (!DG) throw new Error('assets/js/word-problems-questions.js: load game-engine.js first');

  var randInt = DG.randInt, choice = DG.choice, shuffle = DG.shuffle, fmt = DG.fmt;

  /* ================= SHARED HELPERS ================= */

  /*
    Every labelled strip segment must be at least this share of its bar.

    .strip-seg is `white-space:nowrap; overflow:hidden`, so a segment narrower
    than its label silently clips it -- and the widths come straight from the
    drawn numbers, which is why the generator ranges below are all expressed as
    ratios rather than as independent randInt() calls. Measured before that
    change: the Reward Fund put a multi-character label in a segment under 3% of
    the bar (~20px on desktop, ~10px on a phone) in 5.6% of draws, and 4+
    character labels under 6% in 17.9%. A handful of hand-checked questions
    mostly look fine at those rates, which is why manual play never caught it.

    generators.test.js asserts this floor over every draw, so a future range
    change can't quietly reintroduce the clipping.
  */
  var MIN_SEG_PCT = 8;
  // The comparison bracket has to hold the "? more" pill plus its padding, so
  // it needs more room than a plain numeric segment. Measured in a real browser
  // rather than guessed: at a 394px prompt column the pill wants 58px, which is
  // 14.7% of the row, and a 12% floor left it 3px short in 1.1% of draws. The
  // matching media query below 600px shrinks the pill for the phone case.
  var MIN_BRACKET_PCT = 16;

  var WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  function threeConsecutiveDays(){
    var start = randInt(0, WEEKDAYS.length-3);
    return WEEKDAYS.slice(start, start+3);
  }

  function money(n){ return '$' + fmt(n); }
  function pct(part, whole){ return (part/whole*100).toFixed(2); }

  // The label column is <th scope="row">: this is a data table, and without it
  // a screen reader announces an unlabelled grid of numbers. The <caption>
  // names the table for the same reason, and is hidden visually because the
  // prompt right above it already says the same thing on screen.
  function contextTable(caption, rows){
    return '<div class="q-context"><table><caption>' + caption + '</caption><tbody>' +
      rows.map(function(r){
        return '<tr><th scope="row">' + r[0] + '</th><td class="v">' + r[1] + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function equationLine(html){ return '<div class="equation-line">' + html + '</div>'; }
  function unk(){ return '<span class="unk">?</span>'; }
  function stripLabel(text){ return '<p class="strip-label">' + text + '</p>'; }
  function stripHeader(left, right){
    return '<div class="strip-label strip-head"><span>' + left +
      '</span><span class="goal-mark">' + right + '</span></div>';
  }
  function seg(cls, widthPct, label){
    return '<div class="strip-seg ' + cls + '" style="flex:0 0 ' + widthPct + '%;">' + label + '</div>';
  }
  function stripRow(segsHtml){ return '<div class="strip-row">' + segsHtml.join('') + '</div>'; }
  // "? more" on a wide screen, plain "?" on a narrow one. A percentage floor
  // can't keep a label legible on every device -- the label's pixel width is
  // fixed while the bar it sits in shrinks with the viewport -- so the one
  // label here that carries a droppable word gets to drop it. See the
  // .more-word rule in word-problems.css.
  function moreLabel(){ return '? <span class="more-word">more</span>'; }
  // A strip-row sized to `shortPct` of the wrap's width, paired with a bracket
  // that fills the rest -- the "how many more" comparison. Both are flex
  // siblings in one row, so they line up without any hand-tuned pixel offsets.
  function compareRow(shortPct, singleSegHtml, tagText){
    return '<div class="compare-row">' +
      '<div class="strip-row" style="flex:0 0 ' + shortPct + '%;">' + singleSegHtml + '</div>' +
      '<div class="compare-bracket"><span class="tag">' + tagText + '</span></div></div>';
  }

  /*
    Real-mistake distractors, arranged so the answer's SIZE gives nothing away.

    The first version fed a fixed pool straight in, and every pool contained a
    running total ("forgot the last step"), which is by construction always
    larger than the answer. Measured over 200,000 draws per case, that made
    "never pick the biggest number" a 100%-reliable elimination in all three
    numeric cases -- a free 4-way-to-3-way -- and on Missing Part of the Total
    the answer was always one of the two smallest, so guessing between those two
    scored 50% without reading the question at all.

    So the number of distractors placed ABOVE the answer is drawn per question
    and the pool is sampled to fill it, which puts the answer in every position
    of the sorted list. The pool is still all genuine mistakes; near-misses
    scaled to the answer only cover the slots the pool can't supply on the
    wanted side. generators.test.js asserts the resulting rank spread.
  */
  var NEAR_MISS_RATIOS = [0.05, 0.09, 0.15, 0.24];
  function nearMisses(correct, dir){
    // Magnitudes are strictly increasing, so the four values are always
    // distinct even when `correct` is small enough to floor every ratio.
    return NEAR_MISS_RATIOS.map(function(r, i){
      return correct + dir * (Math.max(9, Math.round(correct*r)) + i*4);
    });
  }
  function numericOptions(correct, pool, fmtFn){
    var below = [], above = [];
    shuffle(pool).forEach(function(v){
      if (typeof v !== 'number' || !isFinite(v) || v <= 0 || v === correct) return;
      if (below.indexOf(v) !== -1 || above.indexOf(v) !== -1) return;
      (v < correct ? below : above).push(v);
    });

    /*
      Fill the wanted side first -- real mistakes if the pool has them, invented
      near-misses if it doesn't -- and only then fall back to the other side.

      Order matters more than it looks. Filling from the pool first and topping
      up from whichever side had spares left the split at the mercy of the pool:
      Combined vs. Single only ever yields two mistakes below the answer, so
      "all three distractors below" -- the draw where the answer IS the largest
      -- was unreachable, and Reward Fund had the mirror problem at the bottom.
      Both cases measured 0.00% for one rank over 200,000 draws. Holding the
      ABOVE/BELOW split is what makes the answer's size uninformative; which
      particular mistake lands in a slot matters less than that it lands there.
    */
    var wantAbove = randInt(0, 3), wantBelow = 3 - wantAbove;
    var ordered = above.slice(0, wantAbove)
      .concat(below.slice(0, wantBelow))
      .concat(nearMisses(correct, 1).slice(0, Math.max(0, wantAbove - above.length)))
      .concat(nearMisses(correct, -1).slice(0, Math.max(0, wantBelow - below.length)))
      .concat(above, below, nearMisses(correct, 1), nearMisses(correct, -1));

    var picks = [];
    ordered.forEach(function(v){
      if (picks.length < 3 && v > 0 && v !== correct && picks.indexOf(v) === -1) picks.push(v);
    });
    // Backstop. Strictly increasing and picks holds at most three values, so
    // this can collide at most three times before it has to terminate.
    for (var k = 1; picks.length < 3; k++){
      var v = correct + k*13;
      if (picks.indexOf(v) === -1) picks.push(v);
    }

    return shuffle([correct].concat(picks)).map(function(v){
      return { key:String(v), label:(fmtFn||fmt)(v) };
    });
  }

  /* ================= ARCHETYPE 1: combined vs. single ================= */

  var SUBJECTS_1 = [
    { noun:'hours', verbed:'logged during a stakeout' },
    { noun:'tips', verbed:'called in to the tip line' },
    { noun:'photos', verbed:'filed as evidence' },
    { noun:'pages', verbed:'added to the case file' }
  ];

  function genCombinedVsSingle(){
    var subj = choice(SUBJECTS_1);
    var days = threeConsecutiveDays();
    // b is drawn as a ratio of a (not independently) so neither segment of the
    // combined bar can shrink below MIN_SEG_PCT -- see the note there.
    var a = randInt(400, 4800);
    var b = randInt(Math.max(120, Math.ceil(a*0.25)), Math.min(4800, a*4));
    var combined = a+b;
    // Likewise the gap: it is what the comparison bracket has to hold the
    // "? more" pill in, so it can't be an arbitrarily thin slice of the bar.
    var diff = randInt(Math.ceil(combined*0.17), Math.floor(combined*0.30));
    var c = combined - diff;

    var prompt =
      '<p class="q-prompt-lead">How many more ' + subj.noun + ' were ' + subj.verbed +
      ' on <b>' + days[0] + '</b> and <b>' + days[1] + '</b> combined than on <b>' + days[2] + '</b>?</p>' +
      contextTable(subj.noun + ' by day', [[days[0], fmt(a)], [days[1], fmt(b)], [days[2], fmt(c)]]) +
      equationLine('(' + fmt(a) + ' + ' + fmt(b) + ') − ' + fmt(c) + ' = ' + unk()) +
      '<div class="strip-block">' +
      stripLabel(days[0] + ' + ' + days[1]) +
      stripRow([seg('c-teal', pct(a,combined), fmt(a)), seg('c-mustard', pct(b,combined), fmt(b))]) +
      stripLabel(days[2]) +
      compareRow(pct(c,combined), seg('c-teal','100',fmt(c)), moreLabel()) +
      '</div>';

    return {
      type:'mcq-simple',
      prompt: prompt,
      // combined: forgot to subtract. a+b+c: added all three days.
      // |a−c| / |b−c|: compared only one of the two days to the third.
      options: numericOptions(diff, [combined, a+b+c, Math.abs(a-c), Math.abs(b-c)]),
      correctKey: String(diff),
      explain: function(){
        return 'First combine ' + days[0] + ' and ' + days[1] + ': ' + fmt(a) + ' + ' + fmt(b) + ' = ' + fmt(combined) +
          '. Then subtract ' + days[2] + '’s ' + fmt(c) + ': ' + fmt(combined) + ' − ' + fmt(c) + ' = ' + fmt(diff) + '.';
      }
    };
  }

  /* ================= ARCHETYPE 2: missing part of a total ================= */

  var SUBJECTS_2 = [
    { noun:'calls', logNoun:'tip line log', verbed:'came in on the tip line' },
    { noun:'photos', logNoun:'evidence log', verbed:'were filed as evidence' },
    { noun:'visitors', logNoun:'guest log', verbed:'signed the guest log' },
    { noun:'pages', logNoun:'case file', verbed:'were added to the case file' }
  ];

  function genMissingPart(){
    var subj = choice(SUBJECTS_2);
    var days = threeConsecutiveDays();
    // Floored at 600 rather than 100: the smallest of three parts has to stay
    // above MIN_SEG_PCT of their sum, and 600/(600+3000+3000) is 9.1%.
    var values = [randInt(600,3000), randInt(600,3000), randInt(600,3000)];
    var total = values[0] + values[1] + values[2];
    var missingIdx = randInt(0,2);
    var otherIdx = [0,1,2].filter(function(i){ return i!==missingIdx; });
    var known1 = values[otherIdx[0]], known2 = values[otherIdx[1]];
    var correct = values[missingIdx];

    var colors = ['c-teal','c-mustard','c-teal'];
    var segs = values.map(function(v,i){
      return i===missingIdx ? seg('c-unknown', pct(v,total), '?') : seg(colors[i], pct(v,total), fmt(v));
    });

    var prompt =
      '<p class="q-prompt-lead">The ' + subj.logNoun + ' shows <b>' + fmt(total) + '</b> total ' + subj.noun +
      ' over three days, but ' + days[missingIdx] + '’s count is missing. How many ' + subj.noun + ' ' + subj.verbed +
      ' on <b>' + days[missingIdx] + '</b>?</p>' +
      contextTable(subj.noun + ' by day', days.map(function(d,i){ return [d, i===missingIdx ? '?' : fmt(values[i])]; })) +
      equationLine(fmt(total) + ' − ' + fmt(known1) + ' − ' + fmt(known2) + ' = ' + unk()) +
      '<div class="strip-block">' +
      stripLabel('Total: ' + fmt(total) + ' ' + subj.noun) +
      stripRow(segs) +
      '</div>';

    return {
      type:'mcq-simple',
      prompt: prompt,
      // total: answered with the total. total−known1 / total−known2: subtracted
      // only one of the two known days. known1+known2: summed the days already
      // given. known1 / known2 / |known1−known2|: reused a day already on the
      // table instead of solving for the missing one.
      options: numericOptions(correct, [
        total, total-known1, total-known2, known1+known2,
        known1, known2, Math.abs(known1-known2)
      ]),
      correctKey: String(correct),
      explain: function(){
        return 'Start from the total, ' + fmt(total) + ', and subtract the two days you already know: ' +
          fmt(total) + ' − ' + fmt(known1) + ' − ' + fmt(known2) + ' = ' + fmt(correct) + '.';
      }
    };
  }

  /* ================= ARCHETYPE 3: earn more, then spend (chained) ================= */

  function genEarnThenSpend(){
    var d1 = randInt(120,2500);
    // Both `more` and `spent` are ratios of what they sit next to in the strip
    // diagram, so neither segment can shrink below MIN_SEG_PCT of its bar.
    // `spent` carries the longest label in the game -- a struck-through
    // "−$1,082" -- and 18% is what a 320px phone needs to hold seven
    // characters, measured in Chrome rather than reasoned about.
    var more = randInt(Math.max(20, Math.ceil(d1*0.15)), Math.max(60, Math.ceil(d1*0.60)));
    var d2 = d1 + more;
    var total = d1 + d2;
    var spent = randInt(Math.ceil(total*0.18), Math.floor(total*0.60));
    var left = total - spent;

    var prompt =
      '<p class="q-prompt-lead">Day 2’s reward was <b>' + money(more) + ' more</b> than Day 1’s. The agency then spent <b>' +
      money(spent) + '</b> on supplies. How much reward money is <b>left</b>?</p>' +
      contextTable('reward money', [
        ['Day 1 collected', money(d1)],
        ['Day 2 collected', money(d1) + ' + ' + money(more)],
        ['Spent on supplies', money(spent)]
      ]) +
      equationLine('(' + money(d1) + ' + (' + money(d1) + ' + ' + money(more) + ')) − ' + money(spent) + ' = ' + unk()) +
      '<div class="strip-block">' +
      stripLabel('Step 1 — Day 2’s total') +
      stripRow([seg('c-teal', pct(d1,d2), money(d1)), seg('c-mustard', pct(more,d2), '+' + money(more))]) +
      '</div>' +
      '<div class="strip-block">' +
      stripLabel('Step 2 — total earned, minus what was spent') +
      stripRow([seg('c-spent', pct(spent,total), '−' + money(spent)), seg('c-unknown', pct(left,total), 'left = ?')]) +
      '</div>';

    return {
      type:'mcq-simple',
      prompt: prompt,
      // total: forgot the subtraction. total+spent: added the expense instead
      // of subtracting it. d2−spent / d1−spent: counted only one of the two
      // days. 2·d1−spent: missed the "$X more" and treated both days as equal.
      options: numericOptions(left, [total, total+spent, d2-spent, d1-spent, 2*d1-spent], money),
      correctKey: String(left),
      explain: function(){
        return 'Day 2 collected ' + money(d1) + ' + ' + money(more) + ' = ' + money(d2) + '. Together the two days collected ' +
          money(d1) + ' + ' + money(d2) + ' = ' + money(total) + '. After spending ' + money(spent) + ' on supplies, ' +
          money(total) + ' − ' + money(spent) + ' = ' + money(left) + ' is left.';
      }
    };
  }

  /* ================= ARCHETYPE 4: group vs. group vs. goal ================= */

  var NAME_POOL = ['Cole','Rios','Diaz','Nunez','Bianca','Omar','Priya','Sana','Marcus','Elle'];
  var ITEM_NOUNS = ['items','clues','photos','reports'];

  function genGroupVsGoalOnce(){
    var names = shuffle(NAME_POOL).slice(0,4);
    var item = choice(ITEM_NOUNS);
    var a1 = randInt(300,1200), a2 = randInt(300,1200);
    var b1 = randInt(300,1200), b2 = randInt(300,1200);
    var teamA = a1+a2, teamB = b1+b2;
    if (teamA === teamB) b2 += 7;
    teamA = a1+a2; teamB = b1+b2;
    var goal = Math.ceil((Math.max(teamA,teamB) + randInt(300,900)) / 100) * 100;
    var neededA = goal-teamA, neededB = goal-teamB;
    var aAhead = teamA > teamB;

    /*
      Each number is named with the team it belongs to.

      The labels used to read "Team B ahead — needs 686 / 661 more", an
      unlabelled pair answering a question that asks what EACH team needs. Worse,
      the ordering wasn't consistent: two options listed Team A's number first
      whichever team they named as ahead, and a third listed the named team's
      first -- so "the team I just named is the first number" was right in one
      option and wrong in another. It never flipped which option was correct,
      but it is the ambiguity generators.test.js's "comparison questions say
      which number is the subject" assertion exists to keep out.
    */
    function optLabel(leader, na, nb){
      return leader + ' ahead — A still needs ' + fmt(na) + ', B still needs ' + fmt(nb);
    }
    var optA = optLabel('Team A', neededA, neededB); // correct if A ahead
    var optB = optLabel('Team B', neededA, neededB); // correct if B ahead
    var optC = optLabel('Team A', teamA, teamB);     // mistakes "needed" for "collected"
    var optD = optLabel('Team B', teamA, teamB);
    var candidates = [optA, optB, optC, optD];
    var uniq = candidates.filter(function(v,i,a){ return a.indexOf(v)===i; });
    if (uniq.length !== candidates.length) return null; // caller retries

    var correctLabel = aAhead ? optA : optB;
    var opts = shuffle(candidates.map(function(label, i){ return { key:'opt'+i, label:label, ok:label===correctLabel }; }));

    var itemSingular = item.replace(/s$/,'');
    var prompt =
      '<p class="q-prompt-lead">Two field teams are each filing ' + item + ' toward a <b>' + fmt(goal) + '-' + itemSingular +
      '</b> goal. Which team is ahead, and how many more ' + item + ' does each team still need?</p>' +
      contextTable(item + ' filed by each agent', [
        ['Team A — ' + names[0], fmt(a1)],
        ['Team A — ' + names[1], fmt(a2)],
        ['Team B — ' + names[2], fmt(b1)],
        ['Team B — ' + names[3], fmt(b2)]
      ]) +
      equationLine(fmt(goal) + ' − (' + fmt(a1) + ' + ' + fmt(a2) + ') = ' + unk() + '&nbsp;·&nbsp;' +
        fmt(goal) + ' − (' + fmt(b1) + ' + ' + fmt(b2) + ') = ' + unk()) +
      '<div class="strip-block">' +
      stripHeader('Team A', 'Goal ' + fmt(goal)) +
      stripRow([seg('c-teal', pct(a1,goal), fmt(a1)), seg('c-mustard', pct(a2,goal), fmt(a2)), seg('c-unknown', pct(neededA,goal), moreLabel())]) +
      stripLabel('Team B') +
      stripRow([seg('c-teal', pct(b1,goal), fmt(b1)), seg('c-mustard', pct(b2,goal), fmt(b2)), seg('c-unknown', pct(neededB,goal), moreLabel())]) +
      '</div>';

    return {
      type:'mcq-simple',
      prompt: prompt,
      options: opts.map(function(o){ return { key:o.key, label:o.label }; }),
      correctKey: opts.filter(function(o){ return o.ok; })[0].key,
      explain: function(){
        var leader = aAhead ? 'Team A' : 'Team B';
        return 'Team A has collected ' + fmt(a1) + ' + ' + fmt(a2) + ' = ' + fmt(teamA) + '. Team B has collected ' +
          fmt(b1) + ' + ' + fmt(b2) + ' = ' + fmt(teamB) + '. ' + leader + ' is ahead. Team A still needs ' +
          fmt(goal) + ' − ' + fmt(teamA) + ' = ' + fmt(neededA) + ' more; Team B still needs ' +
          fmt(goal) + ' − ' + fmt(teamB) + ' = ' + fmt(neededB) + ' more.';
      }
    };
  }
  function genGroupVsGoal(){
    for (var attempt=0; attempt<20; attempt++){
      var q = genGroupVsGoalOnce();
      if (q) return q;
    }
    // Mirrors genExpanded's guard in numeration-questions.js: an option-label
    // collision here would otherwise degrade to a multiple-choice question with
    // two identical answers, one of which the engine can never mark correct.
    throw new Error('genGroupVsGoal: no valid question after 20 attempts');
  }

  /* ================= MODE CONFIG ================= */
  var MODES = [
    { id:'combined', caseNo:'01', title:'Combined vs. Single', icon:'➕',
      blurb:'Add two days together, then compare the total to a third.', gen: genCombinedVsSingle },
    { id:'missing', caseNo:'02', title:'Missing Part of the Total', icon:'🧩',
      blurb:'Work backward from a three-day total to find the missing day.', gen: genMissingPart },
    { id:'spend', caseNo:'03', title:'Reward Fund', icon:'💰',
      blurb:'Two days of collecting, then an expense — track what’s left.', gen: genEarnThenSpend },
    { id:'goal', caseNo:'04', title:'Two Teams, One Goal', icon:'🏁',
      blurb:'Compare two teams’ progress toward a shared target.', gen: genGroupVsGoal }
  ];
  return {
    modes: MODES,
    minSegPct: MIN_SEG_PCT,
    minBracketPct: MIN_BRACKET_PCT,
    homeIntro: 'Four case files. Every case is a word-problem mystery — build the equation, read the strip diagram, and solve for the missing number.',
    trailAllFilesWord: 'four'
  };
})();

if (typeof window !== 'undefined') { window.WORD_PROBLEMS_QUESTIONS = WORD_PROBLEMS_QUESTIONS; }
if (typeof module !== 'undefined' && module.exports) { module.exports = WORD_PROBLEMS_QUESTIONS; }
