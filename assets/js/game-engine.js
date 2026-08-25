/*
  Shared "detective agency" game engine — random-helpers, the home/play/
  trail screens, every question-type renderer and click-wiring, and the
  summary screen. Used by every game page under games/<subject>/.

  A page defines its own data + question generators + a MODES array
  (each entry: {id, caseNo, title, icon, blurb, gen}), then calls:

    DetectiveGame.start({
      modes: MODES,
      homeIntro: 'Seven case files. Every case pulls fresh numbers...',
      trailAllFilesWord: 'seven'
    });

  DetectiveGame also exposes randInt/choice/shuffle/fmt so a page's own
  generators can reuse them instead of redefining them.
*/
var DetectiveGame = (function(){
  "use strict";

  /* ================= CORE HELPERS ================= */
  function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function choice(arr){ return arr[randInt(0,arr.length-1)]; }
  function shuffle(arr){
    var a = arr.slice();
    for (var i=a.length-1;i>0;i--){ var j=randInt(0,i); var t=a[i]; a[i]=a[j]; a[j]=t; }
    return a;
  }
  function fmt(n){ return n.toLocaleString('en-US'); }

  /* ================= STATE ================= */
  var state = {
    screen:'home', modeId:null, qIndex:0, total:8,
    score:0, streak:0, current:null, answered:false,
    orderPicks:[], tfPick:null, msPick:[], badges:0,
    trailSeq:[], trailIdx:0, trailWrongTurns:0, trailCurrentMissed:false
  };
  var TRAIL_LENGTH = 10;
  var solvedCases = {};

  var MODES = [];
  var HOME_INTRO = '';
  var TRAIL_ALL_WORD = '';

  /* ================= RENDER: HOME ================= */
  function renderHome(){
    var trailCaseNo = String(MODES.length + 1).padStart(2, '0');
    var html = '<p class="home-intro">' + HOME_INTRO + '</p>';
    html += '<div class="case-grid">';
    MODES.forEach(function(m){
      html += '<button class="case-card" data-mode="'+m.id+'">' +
        (solvedCases[m.id] ? '<span class="case-solved-tag">✓ Solved before</span>' : '') +
        '<span class="case-no">CASE NO. '+m.caseNo+'</span>' +
        '<span class="case-title">'+m.icon+' '+m.title+'</span>' +
        '<span class="case-blurb">'+m.blurb+'</span>' +
        '<span class="case-cta">Take the case →</span>' +
        '</button>';
    });
    html += '</div>';
    html += '<button class="case-card trail-card" id="trailCard" style="margin-top:14px;">' +
      '<span class="case-no">CASE NO. '+trailCaseNo+' · THE BIG ONE</span>' +
      '<span class="case-title">🗺️ The Trail — Follow the Numbers</span>' +
      '<span class="case-blurb">A winding trail of '+TRAIL_LENGTH+' clues pulled from all '+TRAIL_ALL_WORD+' files. Solve each one to move down the path to the finish.</span>' +
      '<span class="case-cta">Start the trail →</span>' +
      '</button>';
    document.getElementById('app').innerHTML = html;
    document.querySelectorAll('.case-card:not(.trail-card)').forEach(function(btn){
      btn.addEventListener('click', function(){ startMode(btn.getAttribute('data-mode')); });
    });
    document.getElementById('trailCard').addEventListener('click', startTrail);
  }

  function startMode(modeId){
    state.screen='play'; state.modeId=modeId; state.qIndex=0; state.score=0; state.streak=0;
    nextQuestion();
  }

  function nextQuestion(){
    state.answered=false; state.orderPicks=[]; state.tfPick=null; state.msPick=[];
    var mode = MODES.filter(function(m){return m.id===state.modeId;})[0];
    state.current = mode.gen();
    renderPlay();
  }

  /* ================= RENDER: PLAY ================= */
  function renderPlay(){
    var mode = MODES.filter(function(m){return m.id===state.modeId;})[0];
    var q = state.current;
    var html = '';
    html += '<div class="playbar">';
    html += '<button class="back-btn" id="backBtn">← Case Files</button>';
    html += '<span class="progress-pill">Clue '+(state.qIndex+1)+' of '+state.total+'</span>';
    html += '<span class="streak-pill">🔥 Streak: '+state.streak+'</span>';
    html += '</div>';

    html += '<div class="case-file" id="caseFile">';
    html += '<p class="q-mode-label">'+mode.icon+' Case No. '+mode.caseNo+' — '+mode.title+'</p>';
    html += '<div class="q-prompt">'+q.prompt+'</div>';

    html += buildInteractiveBody(q);
    html += '</div>'; // case-file
    document.getElementById('app').innerHTML = html;

    document.getElementById('backBtn').addEventListener('click', function(){ state.screen='home'; renderHome(); });
    wireInteractive(q, finishAnswer);
  }

  /* ================= SHARED: QUESTION BODY (used by case mode + trail mode) ================= */
  // A small "mark as wrong" toggle overlaid on an .opt-btn, for process of
  // elimination. Purely a scratch mark — see wireStrikeToggles().
  function strikeBadge(){
    return '<span class="opt-strike" role="button" tabindex="0" aria-pressed="false" aria-label="Mark as wrong">✕</span>';
  }

  function buildInteractiveBody(q){
    var html = '';
    if (q.type==='click-digit'){
      html += renderDigitDisplay(q.number, null);
    } else if (q.type==='value-compare'){
      if (q.sameNumber){
        html += renderDigitDisplayHighlight(q.numA, [q.aIdx, q.bIdx]);
      } else {
        html += '<div class="two-numbers">' +
          '<div class="num-card"><div class="who">Number A</div><div class="val">'+numWithHighlight(q.numA,q.aIdx)+'</div></div>' +
          '<div class="num-card"><div class="who">Number B</div><div class="val">'+numWithHighlight(q.numB,q.bIdx)+'</div></div>' +
          '</div>';
      }
      html += '<div class="options-grid" id="optGrid">' + q.options.map(function(o){
        return '<button class="opt-btn" data-key="'+o.key+'">'+strikeBadge()+'<span class="opt-label">'+o.label+'</span></button>';
      }).join('') + '</div>';
    } else if (q.type==='mcq-simple'){
      html += '<div class="options-grid" id="optGrid">' + q.options.map(function(o){
        return '<button class="opt-btn" data-key="'+o.key+'">'+strikeBadge()+'<span class="opt-label">'+o.label+'</span></button>';
      }).join('') + '</div>';
    } else if (q.type==='multiselect'){
      html += '<div class="options-grid" id="optGrid">' + q.options.map(function(o){
        return '<button class="opt-btn" data-key="'+o.key+'">'+strikeBadge()+'<span class="chk">☐</span><span class="opt-label">'+o.label+'</span></button>';
      }).join('') + '</div>';
      html += '<button class="check-btn" id="checkBtn">Check My Answers</button>';
    } else if (q.type==='true-false'){
      html += '<div class="tf-row" id="tfRow">' +
        '<button class="tf-btn" data-v="true">TRUE</button>' +
        '<button class="tf-btn" data-v="false">FALSE</button>' +
        '</div>';
    } else if (q.type==='order'){
      html += '<div class="order-row" id="orderRow">' + q.numbers.map(function(v){
        return '<button class="order-tile" data-v="'+v+'">'+fmt(v)+'</button>';
      }).join('') + '</div>';
      html += '<p class="order-hint">Click smallest first, largest last. <button class="clear-link" id="clearOrder">Clear picks</button></p>';
    } else if (q.type==='symbol'){
      html += '<div class="two-numbers">' +
        '<div class="num-card"><div class="val">'+fmt(q.a)+'</div></div>' +
        '<div class="num-card"><div class="val">'+fmt(q.b)+'</div></div>' +
        '</div>';
      html += '<div class="symbol-row" id="symRow">' +
        ['<','>','='].map(function(s){ return '<button class="symbol-btn" data-v="'+s+'">'+s+'</button>'; }).join('') +
        '</div>';
    }
    return html;
  }

  function renderDigitDisplay(num, highlightIdxArr){
    var formatted = fmt(num);
    var raw = String(num);
    var ptr = 0;
    var out = '<div class="number-display">';
    for (var i=0;i<formatted.length;i++){
      var ch = formatted[i];
      if (ch===','){ out += '<span class="comma-sep">,</span>'; }
      else {
        var placeIdx = raw.length-1-ptr;
        out += '<span class="digit-box" tabindex="0" data-place="'+placeIdx+'" data-digit="'+ch+'">'+ch+'</span>';
        ptr++;
      }
    }
    out += '</div>';
    return out;
  }
  function renderDigitDisplayHighlight(num, idxArr){
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

  /* ================= INTERACTION WIRING (shared by case mode + trail mode) ================= */
  function wireInteractive(q, onAnswered){
    if (q.type==='click-digit'){
      document.querySelectorAll('.digit-box').forEach(function(el){
        el.addEventListener('click', function(){
          if (state.answered) return;
          var placeIdx = parseInt(el.getAttribute('data-place'),10);
          var correct = placeIdx === q.targetPlaceIdx;
          document.querySelectorAll('.digit-box').forEach(function(d){ d.classList.remove('picked'); });
          el.classList.add('picked');
          onAnswered(correct, q.explain());
        });
      });
    } else if (q.type==='value-compare' || q.type==='mcq-simple'){
      document.querySelectorAll('#optGrid .opt-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          if (state.answered) return;
          var key = btn.getAttribute('data-key');
          var correct = key === q.correctKey;
          document.querySelectorAll('#optGrid .opt-btn').forEach(function(b){
            b.disabled = true;
            if (b.getAttribute('data-key')===q.correctKey) b.classList.add('is-correct');
          });
          if (!correct) btn.classList.add('is-wrong');
          onAnswered(correct, q.explain());
        });
      });
    } else if (q.type==='multiselect'){
      var picked = [];
      document.querySelectorAll('#optGrid .opt-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          if (state.answered) return;
          var key = btn.getAttribute('data-key');
          var idx = picked.indexOf(key);
          if (idx>-1){ picked.splice(idx,1); btn.classList.remove('chosen'); btn.querySelector('.chk').textContent='☐'; }
          else { picked.push(key); btn.classList.add('chosen'); btn.querySelector('.chk').textContent='☑'; }
        });
      });
      document.getElementById('checkBtn').addEventListener('click', function(){
        if (state.answered) return;
        var correctSet = q.correctKeys.slice().sort();
        var pickedSet = picked.slice().sort();
        var correct = JSON.stringify(correctSet)===JSON.stringify(pickedSet);
        document.querySelectorAll('#optGrid .opt-btn').forEach(function(b){
          b.disabled = true;
          var k = b.getAttribute('data-key');
          if (q.correctKeys.indexOf(k)>-1) b.classList.add('is-correct');
          else if (picked.indexOf(k)>-1) b.classList.add('is-wrong');
        });
        onAnswered(correct, q.explain());
      });
    } else if (q.type==='true-false'){
      document.querySelectorAll('#tfRow .tf-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          if (state.answered) return;
          var val = btn.getAttribute('data-v')==='true';
          var correct = val === q.correctAnswer;
          // Mark the right answer whatever was clicked, so a wrong guess still
          // shows what the answer was (same as the mcq-simple branch above).
          document.querySelectorAll('#tfRow .tf-btn').forEach(function(b){
            b.disabled = true;
            if ((b.getAttribute('data-v')==='true') === q.correctAnswer) b.classList.add('is-correct');
          });
          if (!correct) btn.classList.add('is-wrong');
          onAnswered(correct, q.explain());
        });
      });
    } else if (q.type==='order'){
      var picks = [];
      document.querySelectorAll('#orderRow .order-tile').forEach(function(tile){
        tile.addEventListener('click', function(){
          if (state.answered) return;
          var v = parseInt(tile.getAttribute('data-v'),10);
          if (picks.indexOf(v)>-1) return;
          picks.push(v);
          var slot = document.createElement('span');
          slot.className='slot'; slot.textContent = picks.length;
          tile.appendChild(slot);
          tile.classList.add('locked');
          if (picks.length === q.numbers.length){
            var correct = JSON.stringify(picks)===JSON.stringify(q.correctOrder);
            onAnswered(correct, q.explain());
          }
        });
      });
      document.getElementById('clearOrder').addEventListener('click', function(){
        if (state.answered) return;
        picks = [];
        document.querySelectorAll('#orderRow .order-tile').forEach(function(tile){
          tile.classList.remove('locked');
          var s = tile.querySelector('.slot'); if (s) s.remove();
        });
      });
    } else if (q.type==='symbol'){
      document.querySelectorAll('#symRow .symbol-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          if (state.answered) return;
          var v = btn.getAttribute('data-v');
          var correct = v === q.correctKey;
          document.querySelectorAll('#symRow .symbol-btn').forEach(function(b){
            b.disabled = true;
            if (b.getAttribute('data-v')===q.correctKey) b.classList.add('is-correct');
          });
          if (!correct) btn.classList.add('is-wrong');
          onAnswered(correct, q.explain());
        });
      });
    }
    wireStrikeToggles();
  }

  // Process-of-elimination toggles on .opt-btn options (see strikeBadge()).
  // Purely a scratch mark: doesn't affect answer selection, and doesn't
  // block the option underneath from still being clicked as the answer.
  function wireStrikeToggles(){
    document.querySelectorAll('#optGrid .opt-strike').forEach(function(el){
      function toggle(e){
        if (state.answered) return;
        e.stopPropagation();
        var btn = el.closest('.opt-btn');
        var active = btn.classList.toggle('struck');
        el.setAttribute('aria-pressed', active ? 'true' : 'false');
        el.setAttribute('aria-label', active ? 'Unmark' : 'Mark as wrong');
      }
      el.addEventListener('click', toggle);
      el.addEventListener('keydown', function(e){
        if (e.key==='Enter' || e.key===' '){ e.preventDefault(); toggle(e); }
      });
    });
  }

  function finishAnswer(correct, explainText){
    state.answered = true;
    if (correct){ state.score++; state.streak++; } else { state.streak = 0; }

    var cf = document.getElementById('caseFile');
    var stamp = document.createElement('div');
    stamp.className = 'stamp ' + (correct ? 'ok':'no');
    stamp.textContent = correct ? 'Case Matches!' : 'Re-examine';
    cf.appendChild(stamp);

    var explainBox = document.createElement('div');
    explainBox.className = 'explain-box';
    explainBox.textContent = explainText;
    cf.appendChild(explainBox);

    var nextBtn = document.createElement('button');
    nextBtn.className = 'next-btn';
    nextBtn.textContent = (state.qIndex+1 < state.total) ? 'Next Clue →' : 'See Case Summary →';
    nextBtn.addEventListener('click', function(){
      state.qIndex++;
      if (state.qIndex >= state.total){ renderSummary(); }
      else { nextQuestion(); }
    });
    cf.appendChild(nextBtn);
  }

  /* ================= SUMMARY ================= */
  function renderSummary(){
    var mode = MODES.filter(function(m){return m.id===state.modeId;})[0];
    var pct = Math.round((state.score/state.total)*100);
    var rank, note;
    if (pct===100){ rank='Ace Investigator'; note='Every clue matched. Case fully cracked!'; }
    else if (pct>=90){ rank='Master Detective'; note='Sharp work — almost every clue matched.'; }
    else if (pct>=75){ rank='Detective'; note='Solid case work. A couple of clues to revisit.'; }
    else if (pct>=50){ rank='Junior Detective'; note='Good progress — reopen this file for more practice.'; }
    else { rank='Rookie Detective'; note='Every detective starts here. Try this case again — new numbers, same skill.'; }

    if (pct>=75) solvedCases[state.modeId] = true;
    state.badges = Object.keys(solvedCases).length;
    document.getElementById('badgeNum').textContent = state.badges;

    var html = '<div class="summary">';
    html += '<div class="stamp-big">Case Closed</div>';
    html += '<p class="rank">'+rank+'</p>';
    html += '<p class="rank-note">'+note+'</p>';
    html += '<div class="stat-row">' +
      '<div class="stat"><div class="n">'+state.score+'/'+state.total+'</div><div class="l">Clues Solved</div></div>' +
      '<div class="stat"><div class="n">'+pct+'%</div><div class="l">Accuracy</div></div>' +
      '</div>';
    html += '<div class="summary-btns">' +
      '<button class="check-btn" id="replayBtn">Reopen This Case</button>' +
      '<button class="next-btn" id="homeBtn">Back to Case Files</button>' +
      '</div>';
    html += '</div>';
    document.getElementById('app').innerHTML = html;
    document.getElementById('replayBtn').addEventListener('click', function(){ startMode(mode.id); });
    document.getElementById('homeBtn').addEventListener('click', function(){ state.screen='home'; renderHome(); });
  }

  /* ================= TRAIL MODE (the "big one" case) ================= */
  function genTrailSequence(){
    var ids = MODES.map(function(m){ return m.id; });
    var seq = shuffle(ids); // all skills, random order
    while (seq.length < TRAIL_LENGTH){ seq.push(choice(ids)); }
    return seq.slice(0, TRAIL_LENGTH);
  }

  function buildTrailMapSVG(n, currentIdx){
    var W=760, H=170;
    var xStep = (W-60)/(n-1);
    var pts = [];
    for (var i=0;i<n;i++){
      pts.push({ x: 30+i*xStep, y: (i%2===0) ? 42 : 128 });
    }
    var pathAll = pts.map(function(p){ return p.x+','+p.y; }).join(' ');
    var progressPts = pts.slice(0, currentIdx+1).map(function(p){ return p.x+','+p.y; }).join(' ');

    var svg = '<div class="trail-map-wrap"><svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg">';
    svg += '<polyline points="'+pathAll+'" fill="none" stroke="#cbb98d" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>';
    if (currentIdx>0) svg += '<polyline points="'+progressPts+'" fill="none" stroke="#3E7C7B" stroke-width="4" stroke-linecap="round"/>';
    pts.forEach(function(p,i){
      var st = i<currentIdx ? 'done' : (i===currentIdx ? 'current' : 'future');
      var fill = st==='done' ? '#3E7C7B' : (st==='current' ? '#D9A441' : '#F5EFE0');
      var stroke = st==='future' ? '#cbb98d' : '#16233A';
      var r = st==='current' ? 15 : 12;
      svg += '<circle cx="'+p.x+'" cy="'+p.y+'" r="'+r+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2"/>';
      var content = st==='done' ? '✓' : String(i+1);
      var textColor = st==='future' ? '#a89568' : (st==='done' ? '#ffffff' : '#241a08');
      svg += '<text x="'+p.x+'" y="'+(p.y+4)+'" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="'+(st==='current'?13:11)+'" fill="'+textColor+'">'+content+'</text>';
      if (i===0 || i===n-1){
        var labelY = p.y<80 ? p.y-20 : p.y+26;
        svg += '<text x="'+p.x+'" y="'+labelY+'" class="trail-node-label">'+(i===0?'START':'FINISH')+'</text>';
      }
    });
    svg += '</svg></div>';
    return svg;
  }

  function startTrail(){
    state.screen='trail';
    state.trailSeq = genTrailSequence();
    state.trailIdx = 0;
    state.trailWrongTurns = 0;
    nextTrailNode();
  }

  function nextTrailNode(){
    state.answered = false;
    var modeId = state.trailSeq[state.trailIdx];
    state._trailMode = MODES.filter(function(m){ return m.id===modeId; })[0];
    state.current = state._trailMode.gen();
    renderTrail();
  }

  function renderTrail(){
    var mode = state._trailMode;
    var q = state.current;
    var html = '';
    html += '<div class="playbar">';
    html += '<button class="back-btn" id="backBtn">← Case Files</button>';
    html += '<span class="progress-pill">Stop '+(state.trailIdx+1)+' of '+TRAIL_LENGTH+'</span>';
    html += '<span class="streak-pill">🚧 Wrong turns: '+state.trailWrongTurns+'</span>';
    html += '</div>';

    html += buildTrailMapSVG(TRAIL_LENGTH, state.trailIdx);
    html += '<p class="trail-legend">' +
      '<span><span class="trail-dot" style="background:#3E7C7B;"></span>Solved</span>' +
      '<span><span class="trail-dot" style="background:#D9A441;"></span>You are here</span>' +
      '<span><span class="trail-dot" style="background:#F5EFE0;border:1px solid #cbb98d;"></span>Ahead</span>' +
      '</p>';

    html += '<div class="case-file" id="caseFile">';
    html += '<p class="q-mode-label">'+mode.icon+' '+mode.title+'</p>';
    html += '<div class="q-prompt">'+q.prompt+'</div>';
    html += buildInteractiveBody(q);
    html += '</div>';

    document.getElementById('app').innerHTML = html;
    document.getElementById('backBtn').addEventListener('click', function(){ state.screen='home'; renderHome(); });
    wireInteractive(q, trailAnswered);
  }

  function trailAnswered(correct, explainText){
    state.answered = true;
    if (!correct) state.trailWrongTurns++;

    var cf = document.getElementById('caseFile');
    var stamp = document.createElement('div');
    stamp.className = 'stamp ' + (correct ? 'ok':'no');
    stamp.textContent = correct ? 'Right Way!' : 'Wrong Turn';
    cf.appendChild(stamp);

    var explainBox = document.createElement('div');
    explainBox.className = 'explain-box';
    explainBox.textContent = explainText;
    cf.appendChild(explainBox);

    var isLast = state.trailIdx+1 >= TRAIL_LENGTH;
    var nextBtn = document.createElement('button');
    nextBtn.className = 'next-btn';
    nextBtn.textContent = isLast ? 'Reach the Finish →' : 'Continue the Trail →';
    nextBtn.addEventListener('click', function(){
      state.trailIdx++;
      if (state.trailIdx >= TRAIL_LENGTH){ renderTrailFinale(); }
      else { nextTrailNode(); }
    });
    cf.appendChild(nextBtn);
  }

  function renderTrailFinale(){
    var wrong = state.trailWrongTurns;
    var perfect = wrong===0;
    solvedCases['trail'] = true;
    state.badges = Object.keys(solvedCases).length;
    document.getElementById('badgeNum').textContent = state.badges;

    var rank, note;
    if (perfect){ rank='Ace Investigator'; note='You followed the whole trail without a single wrong turn.'; }
    else if (wrong<=2){ rank='Master Detective'; note='A couple of wrong turns, but you found the way through.'; }
    else if (wrong<=5){ rank='Detective'; note='You made it to the end — walk the trail again to tighten it up.'; }
    else { rank='Junior Detective'; note='You reached the finish. Every trail gets easier with another walk.'; }

    var html = '<div class="summary">';
    html += '<div class="stamp-big">Case Closed</div>';
    html += '<p class="rank">'+rank+'</p>';
    html += '<p class="rank-note">'+note+'</p>';
    html += '<div class="stat-row">' +
      '<div class="stat"><div class="n">'+TRAIL_LENGTH+'/'+TRAIL_LENGTH+'</div><div class="l">Stops Reached</div></div>' +
      '<div class="stat"><div class="n">'+wrong+'</div><div class="l">Wrong Turns</div></div>' +
      '</div>';
    html += '<div class="summary-btns">' +
      '<button class="check-btn" id="replayBtn">Walk the Trail Again</button>' +
      '<button class="next-btn" id="homeBtn">Back to Case Files</button>' +
      '</div>';
    html += '</div>';
    document.getElementById('app').innerHTML = html;
    document.getElementById('replayBtn').addEventListener('click', startTrail);
    document.getElementById('homeBtn').addEventListener('click', function(){ state.screen='home'; renderHome(); });
  }

  /* ================= PUBLIC API ================= */
  function start(config){
    MODES = config.modes;
    HOME_INTRO = config.homeIntro;
    TRAIL_ALL_WORD = config.trailAllFilesWord;
    renderHome();
  }

  return {
    randInt: randInt,
    choice: choice,
    shuffle: shuffle,
    fmt: fmt,
    start: start
  };
})();

// No-op in the browser; lets `node --test` require() this file directly
// without a bundler. See test/game-engine.test.js.
if (typeof window !== 'undefined') { window.DetectiveGame = DetectiveGame; }
if (typeof module !== 'undefined' && module.exports) { module.exports = DetectiveGame; }
