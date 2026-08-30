/*
  The two question types the Ledger Files needs and the engine does not ship.

  Both come straight from the shape of the items on the study guide this game
  practises. "Enter the correct answer in the box" is a typed answer with no
  options to eliminate down to -- half the point of the item is that there is
  nothing to guess between. "Choose the correct answer from each group to
  complete the statement" scores a value AND the reasoning behind it together,
  which no single-select type can express.

  Registered from here rather than added to the engine for the reason
  numeration-types.js gives: a renderer only one game can use shouldn't ship to
  every game that loads the engine.

  Imports the engine and registers against it as a side effect, so the page
  (and the tests) just import this file before calling DetectiveGame.start().
*/
import DetectiveGame from './game-engine.js';

(function(){
  "use strict";

  var DG = DetectiveGame;

  /*
    What counts as a typed number.

    A kid types 425, or 1,250, or "$425 " with the dollar sign they can see in
    the question. All three are the same answer. Anything else -- an empty box,
    a stray letter, a lone minus -- isn't an answer yet, which is what keeps
    Check disabled instead of grading a blank box as wrong.
  */
  function parseEntry(raw){
    var cleaned = String(raw).replace(/[\s,$]/g, '');
    if (!/^\d+$/.test(cleaned)) return null;
    return parseInt(cleaned, 10);
  }

  // An answer the kid types. q: { correctValue:Number, entryLabel:String }
  DG.registerType('numeric-entry', {
    build: function(q){
      return '<div class="entry-block">' +
        '<label class="entry-label" for="numEntry">' + q.entryLabel + '</label>' +
        '<input class="num-entry" id="numEntry" type="text" inputmode="numeric" ' +
          'autocomplete="off" spellcheck="false" aria-describedby="entryHint">' +
        '<p class="entry-hint" id="entryHint">Digits only — a comma is fine.</p>' +
        '</div>' +
        '<button class="check-btn" id="checkBtn" disabled>Check My Answer</button>';
    },
    wire: function(q, onAnswered, ui){
      var input = document.getElementById('numEntry');
      var check = document.getElementById('checkBtn');

      function typed(){ return parseEntry(input.value); }
      function sync(){ check.disabled = typed() === null; }

      input.addEventListener('input', sync);
      // Enter is what a kid presses after typing a number. There is no <form>
      // here, so without this the keypress does nothing at all and the answer
      // just sits in the box.
      input.addEventListener('keydown', function(e){
        if (e.key !== 'Enter') return;
        // Once the answer is in, sync() would read the box again and hand back
        // a Check button that is enabled but does nothing -- sitting next to
        // "Next Clue" as if the question were still open.
        if (ui.answered()) return;
        e.preventDefault();
        sync();
        if (!check.disabled) check.click();
      });

      check.addEventListener('click', function(){
        if (ui.answered()) return;
        var value = typed();
        if (value === null) return;
        var correct = value === q.correctValue;
        input.classList.add(correct ? 'is-correct' : 'is-wrong');
        // readOnly rather than disabled: what the kid typed is the thing the
        // explanation right underneath is about, and a disabled input drops out
        // of the accessibility tree -- so a screen reader would hear the
        // verdict on an answer it could no longer read back.
        input.readOnly = true;
        input.setAttribute('aria-readonly', 'true');
        check.disabled = true;
        onAnswered(correct, q.explain());
      });
    }
  });

  /*
    One pick from each group completes a statement.
    q: { groups:[{ id, lead, options:[{key,label}], correctKey }] }

    Graded all-or-nothing, the way 'multiselect' is: on the real item the value
    and the reason are one answer, and half of it is not a different amount of
    right. The reveal still marks each group separately, so a kid can see which
    half they lost.
  */
  DG.registerType('choose-each', {
    build: function(q){
      return '<div class="chip-groups">' + q.groups.map(function(g){
        // A real <fieldset>/<legend>: the groups are separate questions sharing
        // one prompt, and without the grouping a screen reader reads six chips
        // in a row with nothing saying where one choice ends and the next
        // begins.
        return '<fieldset class="chip-group">' +
          '<legend class="chip-lead">' + g.lead + '</legend>' +
          '<div class="chip-row">' + g.options.map(function(o){
            return '<button type="button" class="chip" data-group="' + g.id + '" ' +
              'data-key="' + o.key + '" aria-pressed="false">' + o.label + '</button>';
          }).join('') + '</div></fieldset>';
      }).join('') + '</div>' +
      '<button class="check-btn" id="checkBtn" disabled>Check My Answers</button>';
    },
    wire: function(q, onAnswered, ui){
      var picked = {};
      var check = document.getElementById('checkBtn');

      function chipsIn(groupId){
        return document.querySelectorAll('.chip[data-group="' + groupId + '"]');
      }

      q.groups.forEach(function(g){
        chipsIn(g.id).forEach(function(btn){
          btn.addEventListener('click', function(){
            if (ui.answered()) return;
            chipsIn(g.id).forEach(function(b){
              b.classList.remove('chosen');
              b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('chosen');
            btn.setAttribute('aria-pressed', 'true');
            picked[g.id] = btn.getAttribute('data-key');
            // Half a statement is not an answer, so Check stays off until every
            // group has a pick -- otherwise the fastest route through the
            // question is to submit it unfinished.
            check.disabled = q.groups.some(function(other){ return picked[other.id] === undefined; });
          });
        });
      });

      check.addEventListener('click', function(){
        if (ui.answered() || check.disabled) return;
        var correct = q.groups.every(function(g){ return picked[g.id] === g.correctKey; });
        q.groups.forEach(function(g){
          chipsIn(g.id).forEach(function(b){
            b.disabled = true;
            var key = b.getAttribute('data-key');
            if (key === g.correctKey) b.classList.add('is-correct');
            else if (picked[g.id] === key) b.classList.add('is-wrong');
          });
        });
        check.disabled = true;
        onAnswered(correct, q.explain());
      });
    }
  });
})();
