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

  var WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  function threeConsecutiveDays(){
    var start = randInt(0, WEEKDAYS.length-3);
    return WEEKDAYS.slice(start, start+3);
  }

  function money(n){ return '$' + fmt(n); }
  function pct(part, whole){ return (part/whole*100).toFixed(2); }

  function contextTable(rows){
    return '<div class="q-context"><table>' + rows.map(function(r){
      return '<tr><td>' + r[0] + '</td><td class="v">' + r[1] + '</td></tr>';
    }).join('') + '</table></div>';
  }
  function equationLine(html){ return '<div class="equation-line">' + html + '</div>'; }
  function unk(){ return '<span class="unk">?</span>'; }
  function stripLabel(text){ return '<p class="strip-label">' + text + '</p>'; }
  function stripHeader(left, right){
    return '<div class="strip-label" style="display:flex; justify-content:space-between;">' +
      '<span>' + left + '</span><span style="color:var(--red-dark);">' + right + '</span></div>';
  }
  function seg(cls, widthPct, label){
    return '<div class="strip-seg ' + cls + '" style="flex:0 0 ' + widthPct + '%;">' + label + '</div>';
  }
  function stripRow(segsHtml){ return '<div class="strip-row">' + segsHtml.join('') + '</div>'; }
  // A strip-row sized to `shortPct` of the wrap's width, paired with a bracket
  // that fills the rest -- the "how many more" comparison. Both are flex
  // siblings in one row, so they line up without any hand-tuned pixel offsets.
  function compareRow(shortPct, singleSegHtml, tagText){
    return '<div class="compare-row" style="display:flex; align-items:stretch; height:34px; margin-bottom:6px;">' +
      '<div class="strip-row" style="flex:0 0 ' + shortPct + '%; margin-bottom:0;">' + singleSegHtml + '</div>' +
      '<div class="compare-bracket" style="flex:1; display:flex; align-items:center; justify-content:flex-end; padding-right:6px; margin-left:-1.5px; border-top:2px solid var(--red); border-bottom:2px solid var(--red); border-right:2px solid var(--red); border-radius:0 6px 6px 0;">' +
      '<span class="tag">' + tagText + '</span></div></div>';
  }
  // Builds a numeric mcq-simple options array from a correct value and a pool
  // of specific wrong values (real mistakes), filling any remaining slots
  // with nearby offsets. Mirrors genRounding's fill-loop in numeration-questions.js.
  function numericOptions(correct, wrongPool, fmtFn){
    var opts = [correct].concat(wrongPool).filter(function(v,i,a){ return a.indexOf(v)===i && v>0; });
    while (opts.length<4){
      opts.push(correct + choice([-90,-40,30,70,150]));
      opts = opts.filter(function(v,i,a){ return a.indexOf(v)===i && v>0; });
    }
    opts = shuffle(opts.slice(0,4));
    return opts.map(function(v){ return { key:String(v), label:(fmtFn||fmt)(v) }; });
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
    var a = randInt(120,4800), b = randInt(120,4800);
    var combined = a+b;
    var diff = randInt(4, Math.floor(combined*0.3));
    var c = combined - diff;

    var prompt =
      '<p class="q-prompt-lead">How many more ' + subj.noun + ' were ' + subj.verbed +
      ' on <b>' + days[0] + '</b> and <b>' + days[1] + '</b> combined than on <b>' + days[2] + '</b>?</p>' +
      contextTable([[days[0], fmt(a)], [days[1], fmt(b)], [days[2], fmt(c)]]) +
      equationLine('(' + fmt(a) + ' + ' + fmt(b) + ') − ' + fmt(c) + ' = ' + unk()) +
      '<div class="strip-block">' +
      stripLabel(days[0] + ' + ' + days[1]) +
      stripRow([seg('c-teal', pct(a,combined), fmt(a)), seg('c-mustard', pct(b,combined), fmt(b))]) +
      stripLabel(days[2]) +
      compareRow(pct(c,combined), seg('c-teal','100',fmt(c)), '? more') +
      '</div>';

    return {
      type:'mcq-simple',
      prompt: prompt,
      options: numericOptions(diff, [combined, Math.abs(a-c)]),
      correctKey: String(diff),
      explain: function(){
        return 'First combine ' + days[0] + ' and ' + days[1] + ': ' + fmt(a) + ' + ' + fmt(b) + ' = ' + fmt(combined) +
          '. Then subtract ' + days[2] + '’s ' + fmt(c) + ': ' + fmt(combined) + ' − ' + fmt(c) + ' = ' + fmt(diff) + '.';
      }
    };
  }

  /* ================= ARCHETYPE 2: missing part of a total ================= */

  var SUBJECTS_2 = [
    { noun:'calls', verbed:'came in on the tip line' },
    { noun:'photos', verbed:'were filed as evidence' },
    { noun:'visitors', verbed:'signed the guest log' },
    { noun:'pages', verbed:'were added to the case file' }
  ];

  function genMissingPart(){
    var subj = choice(SUBJECTS_2);
    var days = threeConsecutiveDays();
    var values = [randInt(100,3000), randInt(100,3000), randInt(100,3000)];
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
      '<p class="q-prompt-lead">The ' + subj.noun + ' log shows <b>' + fmt(total) + '</b> total ' + subj.noun +
      ' over three days, but ' + days[missingIdx] + '’s count is missing. How many ' + subj.noun + ' ' + subj.verbed +
      ' on <b>' + days[missingIdx] + '</b>?</p>' +
      contextTable(days.map(function(d,i){ return [d, i===missingIdx ? '?' : fmt(values[i])]; })) +
      equationLine(fmt(total) + ' − ' + fmt(known1) + ' − ' + fmt(known2) + ' = ' + unk()) +
      '<div class="strip-block">' +
      stripLabel('Total: ' + fmt(total) + ' ' + subj.noun) +
      stripRow(segs) +
      '</div>';

    return {
      type:'mcq-simple',
      prompt: prompt,
      options: numericOptions(correct, [total, known1+known2, total-known1]),
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
    var more = randInt(20,500);
    var d2 = d1 + more;
    var total = d1 + d2;
    var spent = randInt(80, Math.floor(total*0.6));
    var left = total - spent;

    var prompt =
      '<p class="q-prompt-lead">Day 2’s reward was <b>' + money(more) + ' more</b> than Day 1’s. The agency then spent <b>' +
      money(spent) + '</b> on supplies. How much reward money is <b>left</b>?</p>' +
      contextTable([
        ['Day 1 collected', money(d1)],
        ['Day 2 collected', money(d1) + ' + ' + money(more)],
        ['Spent on supplies', money(spent)]
      ]) +
      equationLine('(' + fmt(d1) + ' + (' + fmt(d1) + ' + ' + fmt(more) + ')) − ' + fmt(spent) + ' = ' + unk()) +
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
      options: numericOptions(left, [d2-spent, total, d1-spent > 0 ? d1-spent : d1+spent], money),
      correctKey: String(left),
      explain: function(){
        return 'Day 2 collected ' + fmt(d1) + ' + ' + fmt(more) + ' = ' + fmt(d2) + '. Together the two days collected ' +
          fmt(d1) + ' + ' + fmt(d2) + ' = ' + fmt(total) + '. After spending ' + fmt(spent) + ' on supplies, ' +
          fmt(total) + ' − ' + fmt(spent) + ' = ' + fmt(left) + ' is left.';
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

    function optLabel(teamName, na, nb){
      return teamName + ' ahead — needs ' + fmt(na) + ' / ' + fmt(nb) + ' more';
    }
    var optA = optLabel('Team A', neededA, neededB); // correct if A ahead
    var optB = optLabel('Team B', neededA, neededB); // correct if B ahead
    var optC = optLabel('Team A', teamA, teamB);     // mistakes "needed" for "collected"
    var optD = optLabel('Team B', teamB, teamA);
    var candidates = [optA, optB, optC, optD];
    var uniq = candidates.filter(function(v,i,a){ return a.indexOf(v)===i; });
    if (uniq.length !== candidates.length) return null; // caller retries

    var correctLabel = aAhead ? optA : optB;
    var opts = shuffle(candidates.map(function(label, i){ return { key:'opt'+i, label:label, ok:label===correctLabel }; }));

    var itemSingular = item.replace(/s$/,'');
    var prompt =
      '<p class="q-prompt-lead">Two field teams are each filing ' + item + ' toward a <b>' + fmt(goal) + '-' + itemSingular +
      '</b> goal. Which team is ahead, and how many more ' + item + ' does each team still need?</p>' +
      contextTable([
        ['Team A — ' + names[0], fmt(a1)],
        ['Team A — ' + names[1], fmt(a2)],
        ['Team B — ' + names[2], fmt(b1)],
        ['Team B — ' + names[3], fmt(b2)]
      ]) +
      equationLine(fmt(goal) + ' − (' + fmt(a1) + ' + ' + fmt(a2) + ') = ' + unk() + '&nbsp;·&nbsp;' +
        fmt(goal) + ' − (' + fmt(b1) + ' + ' + fmt(b2) + ') = ' + unk()) +
      '<div class="strip-block">' +
      stripHeader('Team A', 'Goal ' + fmt(goal)) +
      stripRow([seg('c-teal', pct(a1,goal), fmt(a1)), seg('c-mustard', pct(a2,goal), fmt(a2)), seg('c-unknown', pct(neededA,goal), '? more')]) +
      stripLabel('Team B') +
      stripRow([seg('c-teal', pct(b1,goal), fmt(b1)), seg('c-mustard', pct(b2,goal), fmt(b2)), seg('c-unknown', pct(neededB,goal), '? more')]) +
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
    homeIntro: 'Four case files. Every case is a word-problem mystery — build the equation, read the strip diagram, and solve for the missing number.',
    trailAllFilesWord: 'four'
  };
})();

if (typeof window !== 'undefined') { window.WORD_PROBLEMS_QUESTIONS = WORD_PROBLEMS_QUESTIONS; }
if (typeof module !== 'undefined' && module.exports) { module.exports = WORD_PROBLEMS_QUESTIONS; }
