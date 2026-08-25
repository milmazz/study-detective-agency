/*
  Place-value question types for the Numbers Division.

  These four used to live in the shared engine, where they were five renderers
  serving exactly one caller: 'value-compare' hard-codes numA/numB/aIdx/bIdx,
  and 'order' parses its tiles with parseInt, so neither means anything outside
  a numeration game. Registering them from here keeps a future ELA or history
  game from carrying renderers it can't use.

  Load AFTER game-engine.js and BEFORE the page's own script, so the types are
  registered by the time DetectiveGame.start() runs.
*/
(function(){
  "use strict";

  // Browser: the engine is already a global. Node: pull it in, so the tests can
  // require() this file and register against the real engine rather than a stub.
  var DG = (typeof DetectiveGame !== 'undefined') ? DetectiveGame
         : (typeof require === 'function') ? require('./game-engine.js')
         : null;
  if (!DG) throw new Error('numeration-types.js: load game-engine.js first');

  var fmt = DG.fmt;

  /*
    Rendering a number as place-addressable digits. These used to live in the
    engine and reach the types through ui.digits/digitsHighlight/
    numWithHighlight, which meant every game that loaded the engine carried
    them -- but data-place only means something to a game about place value.
    The engine's `ui` is subject-neutral now; these belong here, with their
    only callers.
  */
  function digitDisplay(num){
    var formatted = fmt(num);
    var raw = String(num);
    var ptr = 0;
    var out = '<div class="number-display">';
    for (var i=0;i<formatted.length;i++){
      var ch = formatted[i];
      if (ch===','){ out += '<span class="comma-sep">,</span>'; }
      else {
        var placeIdx = raw.length-1-ptr;
        // role=button because these ARE operable -- see the click-digit type in
        // numeration-types.js, which wires Enter/Space alongside the click.
        out += '<span class="digit-box" role="button" tabindex="0" data-place="'+placeIdx+'" data-digit="'+ch+'">'+ch+'</span>';
        ptr++;
      }
    }
    out += '</div>';
    return out;
  }
  function digitDisplayHighlight(num, idxArr){
    var formatted = fmt(num);
    var raw = String(num);
    var ptr = 0;
    var out = '<div class="number-display">';
    for (var i=0;i<formatted.length;i++){
      var ch = formatted[i];
      if (ch===','){ out += '<span class="comma-sep">,</span>'; }
      else {
        var placeIdx = raw.length-1-ptr;
        var cls = idxArr.indexOf(placeIdx)>-1 ? 'digit-box num-highlight' : 'digit-box';
        out += '<span class="'+cls+'" data-place="'+placeIdx+'">'+ch+'</span>';
        ptr++;
      }
    }
    out += '</div>';
    return out;
  }
  function numWithHighlight(num, hlIdx){
    var formatted = fmt(num);
    var raw = String(num);
    var ptr = 0;
    var out = '';
    for (var i=0;i<formatted.length;i++){
      var ch = formatted[i];
      if (ch===','){ out += ch; }
      else {
        var placeIdx = raw.length-1-ptr;
        out += placeIdx===hlIdx ? '<span class="num-highlight">'+ch+'</span>' : ch;
        ptr++;
      }
    }
    return out;
  }

  // Click the digit sitting in a named place.
  DG.registerType('click-digit', {
    build: function(q){ return digitDisplay(q.number); },
    wire: function(q, onAnswered, ui){
      document.querySelectorAll('.digit-box').forEach(function(el){
        function pick(){
          if (ui.answered()) return;
          var correct = parseInt(el.getAttribute('data-place'),10) === q.targetPlaceIdx;
          document.querySelectorAll('.digit-box').forEach(function(d){
            d.classList.remove('picked');
            // The answer has landed, so the boxes are inert. Left as-is they
            // kept role=button and tabindex=0, so a screen reader went on
            // announcing 4-7 buttons that silently do nothing -- the same lie
            // the keydown handler below exists to fix, one step later on.
            d.setAttribute('aria-disabled','true');
            d.setAttribute('tabindex','-1');
          });
          el.classList.add('picked');
          onAnswered(correct, q.explain());
        }
        el.addEventListener('click', pick);
        // The boxes carry tabindex and a focus ring, so they look operable to a
        // keyboard user. Until this handler existed they weren't -- which is
        // worse than not being focusable, because the affordance was a lie.
        el.addEventListener('keydown', function(e){
          if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); pick(); }
        });
      });
    }
  });

  // How many times bigger is one digit's value than another's?
  DG.registerType('value-compare', {
    build: function(q, ui){
      var head = q.sameNumber
        ? digitDisplayHighlight(q.numA, [q.aIdx, q.bIdx])
        : '<div class="two-numbers">' +
            '<div class="num-card"><div class="who">Number A</div><div class="val">'+numWithHighlight(q.numA,q.aIdx)+'</div></div>' +
            '<div class="num-card"><div class="who">Number B</div><div class="val">'+numWithHighlight(q.numB,q.bIdx)+'</div></div>' +
          '</div>';
      return head + ui.options(q.options);
    },
    wire: function(q, onAnswered, ui){
      document.querySelectorAll('#optGrid .opt-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          if (ui.answered()) return;
          var correct = btn.getAttribute('data-key') === q.correctKey;
          ui.reveal('#optGrid .opt-btn', function(b){ return b.getAttribute('data-key')===q.correctKey; });
          if (!correct) btn.classList.add('is-wrong');
          onAnswered(correct, q.explain());
        });
      });
    }
  });

  // Put whole numbers in order, least to greatest.
  DG.registerType('order', {
    build: function(q, ui){
      return '<div class="order-row" id="orderRow">' + q.numbers.map(function(v){
        return '<button class="order-tile" data-v="'+v+'">'+ui.fmt(v)+'</button>';
      }).join('') + '</div>' +
      '<p class="order-hint">Click smallest first, largest last. ' +
      '<button class="clear-link" id="clearOrder">Clear picks</button></p>';
    },
    wire: function(q, onAnswered, ui){
      var picks = [];
      var clear = document.getElementById('clearOrder');
      document.querySelectorAll('#orderRow .order-tile').forEach(function(tile){
        tile.addEventListener('click', function(){
          if (ui.answered()) return;
          var v = parseInt(tile.getAttribute('data-v'),10);
          if (picks.indexOf(v) > -1) return;
          picks.push(v);
          var slot = document.createElement('span');
          slot.className = 'slot';
          slot.textContent = picks.length;
          tile.appendChild(slot);
          tile.classList.add('locked');
          if (picks.length === q.numbers.length){
            // The question is graded now. Nothing else switched these off, so
            // the tiles and Clear picks stayed active-looking and keyboard-
            // reachable on a resolved question. ui.answered() already stopped
            // them doing anything; this stops them claiming they would.
            document.querySelectorAll('#orderRow .order-tile').forEach(function(t){ t.disabled = true; });
            clear.disabled = true;
            onAnswered(JSON.stringify(picks)===JSON.stringify(q.correctOrder), q.explain());
          }
        });
      });
      clear.addEventListener('click', function(){
        if (ui.answered()) return;
        picks = [];
        document.querySelectorAll('#orderRow .order-tile').forEach(function(tile){
          tile.classList.remove('locked');
          var s = tile.querySelector('.slot');
          if (s) s.remove();
        });
      });
    }
  });

  // Which of < > = compares these two numbers?
  DG.registerType('symbol', {
    build: function(q, ui){
      return '<div class="two-numbers">' +
        '<div class="num-card"><div class="val">'+ui.fmt(q.a)+'</div></div>' +
        '<div class="num-card"><div class="val">'+ui.fmt(q.b)+'</div></div>' +
        '</div>' +
        '<div class="symbol-row" id="symRow">' +
        ['<','>','='].map(function(s){ return '<button class="symbol-btn" data-v="'+s+'">'+s+'</button>'; }).join('') +
        '</div>';
    },
    wire: function(q, onAnswered, ui){
      document.querySelectorAll('#symRow .symbol-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          if (ui.answered()) return;
          var correct = btn.getAttribute('data-v') === q.correctKey;
          ui.reveal('#symRow .symbol-btn', function(b){ return b.getAttribute('data-v')===q.correctKey; });
          if (!correct) btn.classList.add('is-wrong');
          onAnswered(correct, q.explain());
        });
      });
    }
  });
})();
