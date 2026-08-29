/*
  Shared "detective agency" game engine — random-helpers, the home/play/
  trail screens, every question-type renderer and click-wiring, and the
  summary screen. Used by every game page under games/<subject>/.

  The page must provide two elements the engine writes into:

    <div id="app">              required -- every screen renders here
    ...id="badgeNum"...         optional -- closed-case counter

  A page defines its own data + question generators + a MODES array
  (each entry: {id, caseNo, title, icon, blurb, gen}), then calls:

    DetectiveGame.start({
      modes: MODES,
      homeIntro: 'Seven case files. Every case pulls fresh numbers...',
      trailAllFilesWord: 'seven',
      trailTitle: 'The Trail — Follow the Clues',   // optional, see below
      questionsPerCase: 8,         // optional, defaults to 8
      onCaseStart: fn              // optional, fires when a case or trail starts
    });

  Built-in question types are the subject-neutral three: 'mcq-simple',
  'multiselect' and 'true-false'. A page needing its own renders it via

    DetectiveGame.registerType(name, { build(q, ui), wire(q, onAnswered, ui) })

  before calling start() -- see assets/js/numeration-types.js for the
  place-value widgets the math game registers this way.

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
    modeId:null, qIndex:0, total:8,
    score:0, streak:0, current:null, answered:false, badges:0,
    trailSeq:[], trailIdx:0, trailWrongTurns:0
  };
  var TRAIL_LENGTH = 10;
  var solvedCases = {};

  var MODES = [];
  var HOME_INTRO = '';
  var TRAIL_ALL_WORD = '';
  // The big final case's name. Configurable because the default is about
  // numbers, and three of the games on this site are not: a Texas geography
  // trail called "Follow the Numbers" is just wrong copy on the biggest card
  // on the page.
  var TRAIL_TITLE = 'The Trail — Follow the Numbers';
  // Clues per case. Was hard-coded at 8, which is why the ELA game -- with item
  // pools of 5-8 -- repeated a passage in every single case it generated.
  var QUESTIONS_PER_CASE = 8;
  // Optional. Called when a case or the trail starts, so a page that draws from
  // fixed item pools can reshuffle them. Without it a pool carried across cases
  // and a mid-case refill could re-deal something the kid had already seen in
  // that same case.
  var ON_CASE_START = null;

  // The closed-case counter is optional page furniture. It used to be written
  // before the summary was rendered, so a page missing #badgeNum threw here and
  // left the kid on the last question with no summary and no way forward.
  function setBadgeCount(){
    state.badges = Object.keys(solvedCases).length;
    var el = document.getElementById('badgeNum');
    if (el) el.textContent = state.badges;
  }

  // Move focus to the top of whatever just rendered. Screens replace #app
  // wholesale, so the previously focused element no longer exists.
  var firstRender = true;
  function focusScreen(sel){
    if (firstRender){ firstRender = false; return; } // don't steal focus on load
    var el = document.querySelector(sel);
    if (!el) return;
    el.setAttribute('tabindex','-1');
    el.focus();
  }

  // A generator throwing used to take the whole page down: a bare console trace
  // and a frozen #app. Now one bad clue degrades to a skippable one.
  function generate(mode){
    try {
      var q = mode.gen();
      if (!q || !q.type) throw new Error('generator returned no question object');
      return q;
    } catch (err){
      console.error('DetectiveGame: generator for mode "' + mode.id + '" failed:', err);
      return { type:'__failed__', prompt:'This clue could not be generated.',
               explain:function(){ return 'Something went wrong building this clue.'; } };
    }
  }

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
      '<span class="case-title">🗺️ '+TRAIL_TITLE+'</span>' +
      '<span class="case-blurb">A winding trail of '+TRAIL_LENGTH+' clues pulled from all '+TRAIL_ALL_WORD+' files. Solve each one to move down the path to the finish.</span>' +
      '<span class="case-cta">Start the trail →</span>' +
      '</button>';
    document.getElementById('app').innerHTML = html;
    document.querySelectorAll('.case-card:not(.trail-card)').forEach(function(btn){
      btn.addEventListener('click', function(){ startMode(btn.getAttribute('data-mode')); });
    });
    document.getElementById('trailCard').addEventListener('click', startTrail);
    focusScreen('.home-intro');
  }

  function startMode(modeId){
    state.modeId=modeId; state.qIndex=0; state.score=0; state.streak=0;
    state.total = QUESTIONS_PER_CASE;
    if (ON_CASE_START) ON_CASE_START();
    nextQuestion();
  }

  function nextQuestion(){
    state.answered=false;
    var mode = MODES.filter(function(m){return m.id===state.modeId;})[0];
    state.current = generate(mode);
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

    document.getElementById('backBtn').addEventListener('click', function(){ renderHome(); });
    wireInteractive(q, finishAnswer);
    focusScreen('.q-mode-label');
  }

  /* ================= QUESTION TYPES ================= */
  /*
    Question types are a registry, not a hard-coded if/else chain. The engine
    ships only the three that aren't tied to a subject (mcq-simple, multiselect,
    true-false); anything subject-specific is registered by the page that needs
    it -- see assets/js/numeration-types.js, which adds the place-value widgets
    the math game uses. That stops a future ELA or history game from carrying
    renderers that only make sense for numbers.

    A type is { build(q, ui) -> html, wire(q, onAnswered, ui) }. `ui` is the
    small set of engine helpers a renderer legitimately needs, and it is
    subject-neutral the whole way through: fmt, the options grid, the answer
    reveal, and whether the question has been graded. The place-value digit
    renderers used to sit here too, reachable as ui.digits/digitsHighlight/
    numWithHighlight -- 55 lines of data-place semantics that mean nothing
    outside a numeration game, shipped to every game that loads the engine.
    They live with the types that use them now.
  */
  // Null prototype, not {}: TYPES['constructor'] on a plain object returns
  // Object, which is truthy, so a lookup sails past the "no renderer" guard and
  // then throws on t.build -- landing on exactly the dead end that guard exists
  // to prevent, instead of the skippable clue.
  var TYPES = Object.create(null);
  function registerType(name, def){ TYPES[name] = def; }
  function hasType(name){ return Object.prototype.hasOwnProperty.call(TYPES, name); }

  // Strip tags and quotes so option text is safe to put in an aria-label.
  //
  // aria-hidden subtrees come out first. An option whose label carries a
  // decorative drawing hides that drawing and names itself with an .sr-only
  // sentence instead -- and stripping tags alone put BOTH into the toggle's
  // label, so it read the sentence and then the bag of numbers underneath it
  // ("...holding $195 + $210 - $110.m$195 + $210 - $110"), which is the exact
  // thing the sentence was written to replace.
  function textOf(html){
    var src = String(html);
    if (typeof document !== 'undefined') {
      var holder = document.createElement('div');
      holder.innerHTML = src;
      holder.querySelectorAll('[aria-hidden="true"]').forEach(function(n){
        n.parentNode.removeChild(n);
      });
      src = holder.textContent;
    }
    return src.replace(/<[^>]*>/g,'').replace(/"/g,'&quot;').trim();
  }

  // The options grid. The strike toggle is a SIBLING of the option button, never
  // a child: <button> may not contain interactive content, and while it was
  // nested the option's accessible name absorbed the toggle's label -- screen
  // readers announced "Mark as wrong, Value is ten times the value of".
  function renderOptions(opts, cfg){
    cfg = cfg || {};
    return '<div class="options-grid" id="optGrid">' + opts.map(function(o){
      return '<div class="opt-wrap">' +
        '<button class="opt-btn" data-key="'+o.key+'">' +
          (cfg.checkbox ? '<span class="chk">&#9744;</span>' : '') +
          '<span class="opt-label">'+o.label+'</span>' +
        '</button>' +
        '<button type="button" class="opt-strike" aria-pressed="false" ' +
          'aria-label="Rule out: '+textOf(o.label)+'">&#10005;</button>' +
      '</div>';
    }).join('') + '</div>';
  }

  // Lock the controls and mark the right answer, whatever was clicked. Shared so
  // every type reveals the answer the same way -- true-false and symbol used to
  // mark only the button the kid pressed, so a wrong guess never showed what the
  // answer actually was.
  function revealOptions(sel, isCorrect){
    document.querySelectorAll(sel).forEach(function(b){
      b.disabled = true;
      if (isCorrect(b)) b.classList.add('is-correct');
    });
  }

  var ui = {
    fmt: fmt,
    options: renderOptions,
    reveal: revealOptions,
    answered: function(){ return state.answered; }
  };

  /* ---- built-in, subject-neutral types ---- */
  registerType('mcq-simple', {
    build: function(q, ui){ return ui.options(q.options); },
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

  registerType('multiselect', {
    build: function(q, ui){
      return ui.options(q.options, {checkbox:true}) +
        '<button class="check-btn" id="checkBtn">Check My Answers</button>';
    },
    wire: function(q, onAnswered, ui){
      var picked = [];
      document.querySelectorAll('#optGrid .opt-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          if (ui.answered()) return;
          var key = btn.getAttribute('data-key');
          var i = picked.indexOf(key);
          if (i>-1){ picked.splice(i,1); btn.classList.remove('chosen'); btn.querySelector('.chk').innerHTML='&#9744;'; }
          else { picked.push(key); btn.classList.add('chosen'); btn.querySelector('.chk').innerHTML='&#9745;'; }
        });
      });
      var check = document.getElementById('checkBtn');
      check.addEventListener('click', function(){
        if (ui.answered()) return;
        var correct = JSON.stringify(q.correctKeys.slice().sort())===JSON.stringify(picked.slice().sort());
        document.querySelectorAll('#optGrid .opt-btn').forEach(function(b){
          b.disabled = true;
          var k = b.getAttribute('data-key');
          if (q.correctKeys.indexOf(k)>-1) b.classList.add('is-correct');
          else if (picked.indexOf(k)>-1) b.classList.add('is-wrong');
        });
        // The options go disabled but this didn't, so a graded question still
        // offered an active-looking "Check My Answers". ui.answered() already
        // stopped it double-scoring; this is about not lying with the button.
        // (.check-btn[disabled] has had a style waiting for it in game.css.)
        check.disabled = true;
        onAnswered(correct, q.explain());
      });
    }
  });

  registerType('true-false', {
    build: function(){
      return '<div class="tf-row" id="tfRow">' +
        '<button class="tf-btn" data-v="true">TRUE</button>' +
        '<button class="tf-btn" data-v="false">FALSE</button>' +
        '</div>';
    },
    wire: function(q, onAnswered, ui){
      document.querySelectorAll('#tfRow .tf-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          if (ui.answered()) return;
          var correct = (btn.getAttribute('data-v')==='true') === q.correctAnswer;
          ui.reveal('#tfRow .tf-btn', function(b){ return (b.getAttribute('data-v')==='true') === q.correctAnswer; });
          if (!correct) btn.classList.add('is-wrong');
          onAnswered(correct, q.explain());
        });
      });
    }
  });

  /* ================= SHARED: QUESTION BODY (used by case mode + trail mode) ================= */
  function buildInteractiveBody(q){
    var t = TYPES[q.type];
    if (t) return t.build(q, ui);
    // No renderer for this type. Without this branch the prompt rendered with no
    // controls, no Check button and no Next button -- a silent dead end whose
    // only escape was the back link. Say so, and always leave a way forward.
    console.error('DetectiveGame: no question type registered for "' + q.type + '".');
    return '<p class="load-error">This clue could not be loaded.</p>' +
      '<button class="next-btn" id="skipBtn">Skip this clue &#8594;</button>';
  }

  /* ================= INTERACTION WIRING (shared by case mode + trail mode) ================= */
  function wireInteractive(q, onAnswered){
    var t = TYPES[q.type];
    if (t){
      t.wire(q, onAnswered, ui);
      wireStrikeToggles();
      return;
    }
    var skip = document.getElementById('skipBtn');
    if (skip) skip.addEventListener('click', function(){
      skip.remove();
      onAnswered(false, 'This clue could not be loaded, so it was skipped.');
    });
  }

  // Process-of-elimination toggles (see renderOptions()). Purely a scratch mark:
  // it doesn't answer the question, and doesn't stop the option beside it from
  // being clicked as the answer. It's a real <button>, so Enter and Space work
  // without a keydown handler, and it no longer needs stopPropagation now that
  // it sits outside the option rather than inside it.
  function wireStrikeToggles(){
    document.querySelectorAll('#optGrid .opt-strike').forEach(function(el){
      el.addEventListener('click', function(){
        if (state.answered) return;
        var btn = el.parentNode.querySelector('.opt-btn');
        el.setAttribute('aria-pressed', btn.classList.toggle('struck') ? 'true' : 'false');
      });
    });
  }

  // Everything both modes do once an answer lands: lock the scratch toggles,
  // stamp the verdict, announce it, and hand focus to the way forward.
  //
  // Focus matters more here than it looks. Every screen replaces #app wholesale,
  // so the focused element is destroyed and focus falls back to <body> -- a
  // keyboard user was re-tabbing from the top of the document for each of the 8
  // clues in a case and 10 stops in a trail. role="status" on the explanation
  // means a screen reader hears the verdict instead of it only being drawn.
  function closeOutAnswer(cf, correct, explainText, okWord, noWord, nextLabel, onNext){
    document.querySelectorAll('#optGrid .opt-strike').forEach(function(el){ el.disabled = true; });

    var stamp = document.createElement('div');
    stamp.className = 'stamp ' + (correct ? 'ok':'no');
    stamp.textContent = correct ? okWord : noWord;
    cf.appendChild(stamp);

    var explainBox = document.createElement('div');
    explainBox.className = 'explain-box';
    explainBox.setAttribute('role','status');
    explainBox.textContent = explainText;
    cf.appendChild(explainBox);

    var nextBtn = document.createElement('button');
    nextBtn.className = 'next-btn';
    nextBtn.textContent = nextLabel;
    nextBtn.addEventListener('click', onNext);
    cf.appendChild(nextBtn);
    nextBtn.focus();
  }


  function finishAnswer(correct, explainText){
    state.answered = true;
    if (correct){ state.score++; state.streak++; } else { state.streak = 0; }
    closeOutAnswer(
      document.getElementById('caseFile'), correct, explainText,
      'Case Matches!', 'Re-examine',
      (state.qIndex+1 < state.total) ? 'Next Clue →' : 'See Case Summary →',
      function(){
        state.qIndex++;
        if (state.qIndex >= state.total){ renderSummary(); }
        else { nextQuestion(); }
      });
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
    setBadgeCount();

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
    document.getElementById('homeBtn').addEventListener('click', function(){ renderHome(); });
    focusScreen('.stamp-big');
  }

  /* ================= TRAIL MODE (the "big one" case) ================= */
  function genTrailSequence(){
    var ids = MODES.map(function(m){ return m.id; });
    var seq = shuffle(ids); // all skills, random order
    while (seq.length < TRAIL_LENGTH){ seq.push(choice(ids)); }
    return seq.slice(0, TRAIL_LENGTH);
  }

  /*
    The map is one wide zigzag scaled to its container with width:100%. On a
    phone that means a scale factor around 0.39, which rendered the node numbers
    at ~4px and START/FINISH at ~3.5px — a decorative squiggle with unreadable
    labels. Narrow screens get the same zigzag folded into two rows instead, so
    the viewBox is about half as wide and everything lands roughly twice the
    size. The radii and font sizes below scale with the layout to match.

    Chosen at render time rather than by a media query, because the geometry
    lives here. The trail re-renders at every stop, so rotating mid-question
    keeps the previous layout until the next clue — fine for a progress map.
  */
  function buildTrailMapSVG(n, currentIdx){
    var narrow = (typeof window !== 'undefined') && window.innerWidth <= 560;
    var perRow = narrow ? Math.ceil(n/2) : n;
    var rows = Math.ceil(n/perRow);
    var W = narrow ? 400 : 760;
    var rowH = 170;
    var H = rowH * rows;
    var xStep = (W-60)/(perRow-1);
    var pts = [];
    for (var i=0;i<n;i++){
      var row = Math.floor(i/perRow);
      var col = i % perRow;
      // Serpentine: odd rows run right-to-left, so the path stays continuous
      // where one row hands over to the next.
      if (row % 2 === 1) col = perRow-1-col;
      // Zigzag phase follows the COLUMN, not the running index. Keying it to the
      // index left each new row starting on the opposite phase, which stretched
      // the row-to-row link into a long vertical drop.
      pts.push({ x: 30+col*xStep, y: row*rowH + ((col%2===0) ? 42 : 128) });
    }
    // The two-row layout uses bigger labels sitting further from their node, so
    // START would render above y=0 and get clipped. Give the viewBox headroom
    // rather than moving the labels back in toward the circles.
    var padTop = narrow ? 14 : 0;
    var vbH = H + (narrow ? 20 : 0);
    var pathAll = pts.map(function(p){ return p.x+','+p.y; }).join(' ');
    var progressPts = pts.slice(0, currentIdx+1).map(function(p){ return p.x+','+p.y; }).join(' ');

    var svg = '<div class="trail-map-wrap"><svg viewBox="0 '+(-padTop)+' '+W+' '+vbH+'" xmlns="http://www.w3.org/2000/svg">';
    svg += '<polyline points="'+pathAll+'" fill="none" stroke="#cbb98d" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>';
    if (currentIdx>0) svg += '<polyline points="'+progressPts+'" fill="none" stroke="#3E7C7B" stroke-width="4" stroke-linecap="round"/>';
    pts.forEach(function(p,i){
      var st = i<currentIdx ? 'done' : (i===currentIdx ? 'current' : 'future');
      var fill = st==='done' ? '#3E7C7B' : (st==='current' ? '#D9A441' : '#F5EFE0');
      var stroke = st==='future' ? '#cbb98d' : '#16233A';
      var r = (st==='current' ? 15 : 12) * (narrow ? 1.5 : 1);
      svg += '<circle cx="'+p.x+'" cy="'+p.y+'" r="'+r+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2"/>';
      var content = st==='done' ? '✓' : String(i+1);
      var textColor = st==='future' ? '#a89568' : (st==='done' ? '#ffffff' : '#241a08');
      svg += '<text x="'+p.x+'" y="'+(p.y+4)+'" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="'+Math.round((st==='current'?13:11)*(narrow?1.6:1))+'" fill="'+textColor+'">'+content+'</text>';
      if (i===0 || i===n-1){
        var off = narrow ? 32 : 20;
        var labelY = (p.y % rowH) < 80 ? p.y-off : p.y+off+6;
        svg += '<text x="'+p.x+'" y="'+labelY+'" class="trail-node-label"'
          + (narrow ? ' style="font-size:17px;"' : '') + '>'+(i===0?'START':'FINISH')+'</text>';
      }
    });
    svg += '</svg></div>';
    return svg;
  }

  function startTrail(){
    if (ON_CASE_START) ON_CASE_START();
    state.trailSeq = genTrailSequence();
    state.trailIdx = 0;
    state.trailWrongTurns = 0;
    nextTrailNode();
  }

  function nextTrailNode(){
    state.answered = false;
    var modeId = state.trailSeq[state.trailIdx];
    state._trailMode = MODES.filter(function(m){ return m.id===modeId; })[0];
    state.current = generate(state._trailMode);
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
    document.getElementById('backBtn').addEventListener('click', function(){ renderHome(); });
    wireInteractive(q, trailAnswered);
    focusScreen('.q-mode-label');
  }

  function trailAnswered(correct, explainText){
    state.answered = true;
    if (!correct) state.trailWrongTurns++;

    var isLast = state.trailIdx+1 >= TRAIL_LENGTH;
    closeOutAnswer(
      document.getElementById('caseFile'), correct, explainText,
      'Right Way!', 'Wrong Turn',
      isLast ? 'Reach the Finish →' : 'Continue the Trail →',
      function(){
        state.trailIdx++;
        if (state.trailIdx >= TRAIL_LENGTH){ renderTrailFinale(); }
        else { nextTrailNode(); }
      });
  }

  function renderTrailFinale(){
    var wrong = state.trailWrongTurns;
    var perfect = wrong===0;
    solvedCases['trail'] = true;
    setBadgeCount();

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
    document.getElementById('homeBtn').addEventListener('click', function(){ renderHome(); });
    focusScreen('.stamp-big');
  }

  /* ================= PUBLIC API ================= */
  // Fail loudly and early. Every one of these used to be an undocumented
  // requirement that blew up somewhere far from the actual mistake.
  function start(config){
    config = config || {};
    var app = document.getElementById('app');
    if (!app){
      console.error('DetectiveGame: this page has no <div id="app"> to render into.');
      return;
    }
    if (!config.modes || !config.modes.length){
      console.error('DetectiveGame: start() needs a non-empty `modes` array.');
      app.innerHTML = '<p class="load-error">This game has no case files configured.</p>';
      return;
    }
    var bad = config.modes.filter(function(m){ return !m || typeof m.gen !== 'function'; });
    if (bad.length){
      console.error('DetectiveGame: every mode needs a gen() function; ' + bad.length + ' do not.');
      app.innerHTML = '<p class="load-error">This game has a case file that could not be opened.</p>';
      return;
    }
    MODES = config.modes;
    HOME_INTRO = config.homeIntro || '';
    TRAIL_ALL_WORD = config.trailAllFilesWord || String(config.modes.length);
    TRAIL_TITLE = config.trailTitle || 'The Trail — Follow the Numbers';
    QUESTIONS_PER_CASE = config.questionsPerCase || 8;
    ON_CASE_START = typeof config.onCaseStart === 'function' ? config.onCaseStart : null;
    renderHome();
  }

  return {
    randInt: randInt,
    choice: choice,
    shuffle: shuffle,
    fmt: fmt,
    registerType: registerType,
    hasType: hasType,
    start: start
  };
})();

// No-op in the browser; lets `node --test` require() this file directly
// without a bundler. See test/game-engine.test.js.
if (typeof window !== 'undefined') { window.DetectiveGame = DetectiveGame; }
if (typeof module !== 'undefined' && module.exports) { module.exports = DetectiveGame; }
