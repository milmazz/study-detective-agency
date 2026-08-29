/*
  Helpers shared by the question modules under assets/js/.

  Two things every pool-driven game needs and gets wrong the same way:

  - drawer(pool)  draws WITHOUT replacement. The obvious choice() samples with
                  replacement, so a 6-item pool across a 6-clue case repeats
                  something almost every time -- and a kid answering a passage
                  she has just read answers it from memory rather than by
                  reading. This is the fix the Words Division shipped first;
                  it lives here so the next game does not have to rediscover it.
  - buildOptionsFromPool()  assembles a fixed-vocabulary MCQ, guaranteeing the
                  correct option is in the list and that the list is shuffled.

  Load AFTER game-engine.js and BEFORE the game's own questions module.
  Exports no game content and registers nothing, so requiring it is free.
*/
var QUESTION_KIT = (function(){
  "use strict";

  // Browser: the engine is already a global. Node: pull it in directly, so the
  // tests get the real shuffle rather than a stand-in.
  var DG = (typeof DetectiveGame !== 'undefined') ? DetectiveGame
         : (typeof require === 'function') ? require('./game-engine.js')
         : null;
  if (!DG) throw new Error('assets/js/question-kit.js: load game-engine.js first');

  var shuffle = DG.shuffle;

  /*
    Draw from a fixed pool without replacement. Each drawer keeps its own bag
    and reshuffles when it runs dry, so the bag carries across a replay and
    across trail stops rather than restarting from the same top card.
  */
  function drawer(pool){
    var bag = [];
    var last = null;
    function draw(){
      if (!bag.length){
        bag = shuffle(pool);
        // A refill can deal the item just shown straight back off the top. In
        // a case that never happens (the bag is reset when a case starts and
        // outlasts it), but a trail draws 10 stops across a handful of modes,
        // so one mode can be drawn more times than its pool holds. Swap it away
        // from the top so a repeat is at least never back-to-back.
        if (pool.length > 1 && bag[bag.length-1] === last){
          var t = bag[bag.length-1]; bag[bag.length-1] = bag[0]; bag[0] = t;
        }
      }
      last = bag.pop();
      return last;
    }
    draw.reset = function(){ bag = shuffle(pool); };
    return draw;
  }

  /*
    Build one drawer per named pool, plus the reset() a game hands to
    onCaseStart. Refilling every bag when a case starts is what makes the
    "no repeats inside a case" guarantee hold: draining alone isn't enough,
    because a bag carried over from a previous case can run dry mid-case and
    refill with items the kid has already seen in that same case.
  */
  function drawers(pools){
    var out = {};
    Object.keys(pools).forEach(function(k){ out[k] = drawer(pools[k]); });
    out.resetAll = function(){
      Object.keys(pools).forEach(function(k){ out[k].reset(); });
    };
    return out;
  }

  /*
    A 4-option (or n-option) MCQ drawn from a fixed pool of {key,label},
    guaranteeing the correct one is included and no option is duplicated.
  */
  function buildOptionsFromPool(pool, correctKey, count){
    count = count || 4;
    var correct = pool.filter(function(o){ return o.key===correctKey; })[0];
    // The likeliest typo when adding content. Without this the engine reads
    // .key off undefined and the page dies with a stack trace that doesn't say
    // which key is missing; named here, the engine turns it into one skippable
    // clue and the console says which key is missing.
    if (!correct) throw new Error('buildOptionsFromPool: no option with key "' + correctKey + '" in the pool');
    var rest = shuffle(pool.filter(function(o){ return o.key!==correctKey; }));
    var picked = [correct].concat(rest.slice(0, Math.min(count-1, rest.length)));
    return shuffle(picked);
  }

  /*
    An MCQ whose options are authored per item: the item's own correct label
    plus its own distractors. Keys are positional, so they carry no meaning a
    kid could learn -- and the list is shuffled, so neither does the order.
  */
  function buildAuthoredOptions(correctLabel, distractors){
    var labels = [correctLabel].concat(distractors);
    var opts = labels.map(function(label, i){
      return { key: 'o' + i, label: label };
    });
    return { options: shuffle(opts), correctKey: 'o0' };
  }

  return {
    drawer: drawer,
    drawers: drawers,
    buildOptionsFromPool: buildOptionsFromPool,
    buildAuthoredOptions: buildAuthoredOptions
  };
})();

if (typeof window !== 'undefined') { window.QUESTION_KIT = QUESTION_KIT; }
if (typeof module !== 'undefined' && module.exports) { module.exports = QUESTION_KIT; }
