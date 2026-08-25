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

  // Click the digit sitting in a named place.
  DetectiveGame.registerType('click-digit', {
    build: function(q, ui){ return ui.digits(q.number); },
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
  DetectiveGame.registerType('value-compare', {
    build: function(q, ui){
      var head = q.sameNumber
        ? ui.digitsHighlight(q.numA, [q.aIdx, q.bIdx])
        : '<div class="two-numbers">' +
            '<div class="num-card"><div class="who">Number A</div><div class="val">'+ui.numWithHighlight(q.numA,q.aIdx)+'</div></div>' +
            '<div class="num-card"><div class="who">Number B</div><div class="val">'+ui.numWithHighlight(q.numB,q.bIdx)+'</div></div>' +
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
  DetectiveGame.registerType('order', {
    build: function(q, ui){
      return '<div class="order-row" id="orderRow">' + q.numbers.map(function(v){
        return '<button class="order-tile" data-v="'+v+'">'+ui.fmt(v)+'</button>';
      }).join('') + '</div>' +
      '<p class="order-hint">Click smallest first, largest last. ' +
      '<button class="clear-link" id="clearOrder">Clear picks</button></p>';
    },
    wire: function(q, onAnswered, ui){
      var picks = [];
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
            onAnswered(JSON.stringify(picks)===JSON.stringify(q.correctOrder), q.explain());
          }
        });
      });
      document.getElementById('clearOrder').addEventListener('click', function(){
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
  DetectiveGame.registerType('symbol', {
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
