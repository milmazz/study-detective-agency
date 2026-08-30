// Run with: node --test
//
// The rendering and wiring half of the engine, driven through a real DOM.
//
// These need jsdom, which is the repo's only dependency and a dev-only one —
// nothing here ships. If it isn't installed the whole file skips, so a fresh
// clone can still run `node --test` and get the dependency-free suites. Install
// it with `npm install` to get this coverage too; CI always runs it.
//
// Every assertion below stands in for a defect that survived manual play,
// because in each case the page still looked like it worked: classes were added
// that matched no CSS rule, elements carried a focus ring but no key handler,
// and a missing element threw after the last question rather than at load.

import test from 'node:test';
import assert from 'node:assert/strict';
import { GAMES, openPage, prepareDom, click, press } from '../test-support/load-game.js';

// Bundles each page's module graph to a classic script once, up front — jsdom
// does not execute <script type="module">. Everything below stays synchronous.
const skip = (await prepareDom()) ? false : 'jsdom is not installed — run `npm install`';

// Controls, in the order a player would reach for them. A single selector list
// would match by DOCUMENT order instead, which picks up the decorative digit
// spans that value-compare renders above its options — those have no handler.
const CONTROLS = [
  '#optGrid .opt-btn:not([disabled])',
  '#tfRow .tf-btn:not([disabled])',
  '#symRow .symbol-btn:not([disabled])',
  '#orderRow .order-tile:not(.locked)',
  '.digit-box[role="button"]',
];

// #skipBtn is deliberately NOT a control. A clue that failed to load still
// offers a way forward, and that button carries class="next-btn" -- so
// playToSummary's own "click the next button" step swallowed it and reported
// success on a game whose question types had all failed to register. Deleting
// the numeration-types.js tag from the math page disabled four of its seven
// types and still left 44 of 47 tests green, including "a case plays through
// to its summary". The degraded path has dedicated tests further down; reaching
// it anywhere else means the game is broken.
function assertPlayable(doc) {
  assert.equal(doc.querySelector('.load-error'), null,
    'a clue failed to load during what should be a normal playthrough');
  assert.equal(doc.querySelector('#skipBtn'), null,
    'a clue degraded to a skip button during what should be a normal playthrough');
}

function firstControl(doc) {
  assertPlayable(doc);
  for (const sel of CONTROLS) {
    const el = doc.querySelector(sel);
    if (el) return el;
  }
  return null;
}

/*
  Answer whatever question is on screen, however that question takes input.
  Returns false when nothing on the screen can be answered.

  The Ledger Files answers two of its cases through controls no other game has
  -- a number the kid types, and one chip picked per group -- and both submit
  through a Check button rather than by clicking an option. Everything that
  drives a playthrough goes through here, so a new input shape has to be taught
  to the suite once rather than to each test that plays a game.
*/
function answerCurrent(win, doc) {
  assertPlayable(doc);

  // A typed answer. Deliberately not the correct value: a wrong answer still
  // has to lead somewhere, and that is the path worth exercising.
  const entry = doc.querySelector('#numEntry');
  if (entry && !entry.readOnly) {
    entry.value = '7';
    entry.dispatchEvent(new win.Event('input', { bubbles: true }));
    click(win, doc.querySelector('#checkBtn'));
    return true;
  }

  // One pick per group, then submit -- Check stays disabled until every group
  // has one, so a partial answer would stall here rather than grade.
  const groups = [...doc.querySelectorAll('.chip-group')];
  if (groups.length) {
    for (const group of groups) click(win, group.querySelector('.chip'));
    click(win, doc.querySelector('#checkBtn'));
    return true;
  }

  // multiselect grades on its own button, so pick something then submit
  const check = doc.querySelector('#checkBtn');
  if (check) {
    const opt = doc.querySelector('#optGrid .opt-btn:not([disabled])');
    if (opt) click(win, opt);
    click(win, check);
    return true;
  }

  const control = firstControl(doc);
  if (!control) return false;
  click(win, control);
  return true;
}

// Open a case and keep going until a question of the wanted shape turns up.
// Question types are drawn at random, so a fixed number of attempts is the only
// way to reach the rarer ones.
function reachQuestion(game, selector, attempts = 300) {
  for (let i = 0; i < attempts; i++) {
    const win = openPage(game);
    const doc = win.document;
    for (const card of doc.querySelectorAll('.case-card:not(.trail-card)')) {
      click(win, card);
      if (doc.querySelector(selector)) return { win, doc };
      const back = doc.querySelector('#backBtn');
      if (back) click(win, back);
    }
  }
  return null;
}

// Answer questions until the summary appears. Returns false if it stalls.
function playToSummary(win, doc, limit = 200) {
  for (let i = 0; i < limit; i++) {
    if (doc.querySelector('.summary')) return true;
    assertPlayable(doc);
    const next = doc.querySelector('.next-btn');
    if (next) { click(win, next); continue; }
    if (!answerCurrent(win, doc)) return false;
  }
  return false;
}

/* ================= every game renders and plays ================= */

/*
  Driven off GAMES, not a literal list. Both loops in this file used to name
  ['math', 'ela'], so the third game was added to the site and to
  generators.test.js while every assertion below silently skipped it -- the
  suite still went green, and the page had no rendering coverage at all.
  question-modules.test.js already derives from GAMES and picked the new game
  up for free, which is the pattern.
*/
for (const game of Object.keys(GAMES)) {
  test(`${game}: the home screen lists its case files`, { skip }, () => {
    const doc = openPage(game).document;
    assert.ok(doc.querySelectorAll('.case-card:not(.trail-card)').length > 0);
    assert.ok(doc.querySelector('#trailCard'), 'the trail card should be offered');
  });

  test(`${game}: a case plays through to its summary`, { skip }, () => {
    const win = openPage(game);
    const doc = win.document;
    click(win, doc.querySelector('.case-card:not(.trail-card)'));
    assert.ok(doc.querySelector('.q-prompt'), 'a question should render');
    assert.ok(playToSummary(win, doc), 'the case should reach its summary');
  });

  test(`${game}: focus follows the screen instead of falling back to <body>`, { skip }, () => {
    // Each screen replaces #app wholesale, destroying whatever had focus. Without
    // moving it, a keyboard user re-tabs from the top of the document for every
    // single clue.
    const win = openPage(game);
    const doc = win.document;
    click(win, doc.querySelector('.case-card:not(.trail-card)'));
    assert.equal(doc.activeElement, doc.querySelector('.q-mode-label'),
      'focus should land on the case heading');

    assert.ok(answerCurrent(win, doc), 'the question should be answerable');
    assert.equal(doc.activeElement, doc.querySelector('.next-btn'),
      'focus should move to the way forward once an answer lands');
  });

  test(`${game}: the verdict is announced, not just drawn`, { skip }, () => {
    const win = openPage(game);
    const doc = win.document;
    click(win, doc.querySelector('.case-card:not(.trail-card)'));
    assert.ok(answerCurrent(win, doc), 'the question should be answerable');
    const explain = doc.querySelector('.explain-box');
    assert.ok(explain, 'an explanation should appear');
    assert.equal(explain.getAttribute('role'), 'status',
      'the explanation should be a live region so a screen reader hears it');
  });

  test(`${game}: the trail runs all the way to its finale`, { skip }, () => {
    const win = openPage(game);
    const doc = win.document;
    click(win, doc.querySelector('#trailCard'));
    assert.ok(doc.querySelector('.trail-legend'), 'the trail map should render');
    assert.ok(playToSummary(win, doc), 'the trail should reach its finale');
    assert.equal(doc.activeElement, doc.querySelector('.stamp-big'),
      'focus should land on the finale heading');
  });
}

/* ================= the process-of-elimination toggle ================= */

test('the strike toggle is a sibling of the option, not a child', { skip }, () => {
  // A <button> may not contain interactive content. While it was nested, the
  // option's accessible name absorbed the toggle's label and screen readers
  // announced "Mark as wrong, Value is ten times the value of".
  const found = reachQuestion('ela', '#optGrid .opt-strike');
  assert.ok(found, 'expected to reach a question with options');
  const { doc } = found;

  assert.equal(doc.querySelectorAll('.opt-btn .opt-strike').length, 0,
    'no strike toggle should sit inside an option button');
  assert.ok(doc.querySelector('.opt-wrap > .opt-btn'));
  assert.ok(doc.querySelector('.opt-wrap > .opt-strike'));

  const strike = doc.querySelector('.opt-strike');
  assert.equal(strike.tagName, 'BUTTON', 'a real button gets Enter and Space for free');
  assert.match(strike.getAttribute('aria-label'), /^Rule out: .+/,
    'the toggle should name the option it rules out');
});

test('striking an option marks it without answering the question', { skip }, () => {
  const found = reachQuestion('ela', '#optGrid .opt-strike');
  assert.ok(found);
  const { win, doc } = found;

  const strike = doc.querySelector('.opt-strike');
  const option = strike.parentNode.querySelector('.opt-btn');

  click(win, strike);
  assert.equal(strike.getAttribute('aria-pressed'), 'true');
  assert.ok(option.classList.contains('struck'));
  assert.equal(doc.querySelector('.stamp'), null,
    'a scratch mark must not grade the question');

  click(win, strike);
  assert.equal(strike.getAttribute('aria-pressed'), 'false', 'the toggle should untoggle');
  assert.ok(!option.classList.contains('struck'));
});

test('strike toggles lock once the question is answered', { skip }, () => {
  const found = reachQuestion('ela', '#optGrid .opt-btn');
  assert.ok(found);
  const { win, doc } = found;
  click(win, doc.querySelector('#optGrid .opt-btn'));
  for (const s of doc.querySelectorAll('.opt-strike')) {
    assert.ok(s.disabled, 'a graded question should not accept more scratch marks');
  }
});

/* ================= every type reveals the answer the same way ================= */

for (const [label, selector] of [
  ['options', '#optGrid .opt-btn'],
  ['true/false', '#tfRow .tf-btn'],
  ['symbol', '#symRow .symbol-btn'],
]) {
  test(`${label}: the correct answer is revealed even on a wrong guess`, { skip }, () => {
    // true/false and symbol used to mark only the button that was clicked, and
    // the classes they added matched no CSS rule at all — so those cases graded
    // with no colour and never showed what the answer was.
    const found = reachQuestion('math', selector);
    assert.ok(found, `expected to reach a ${label} question`);
    const { win, doc } = found;

    const buttons = [...doc.querySelectorAll(selector)];
    click(win, buttons[0]);

    assert.ok(buttons.some((b) => b.classList.contains('is-correct')),
      'the correct answer should be marked whatever was clicked');
    assert.ok(buttons.every((b) => b.disabled),
      'answering should lock the remaining choices');
  });
}

/* ================= keyboard ================= */

test('digit boxes answer to the keyboard, not only the mouse', { skip }, () => {
  // They carry tabindex and a focus ring, so they look operable. Until the
  // keydown handler existed they were not, which is worse than not being
  // focusable at all — the affordance was a lie.
  const found = reachQuestion('math', '.digit-box[role="button"]');
  assert.ok(found, 'expected to reach a click-digit question');
  const { win, doc } = found;

  const box = doc.querySelector('.digit-box[role="button"]');
  assert.equal(box.getAttribute('tabindex'), '0', 'digit boxes should be reachable by tab');

  press(win, box, 'Enter');
  assert.ok(doc.querySelector('.stamp'), 'Enter should answer the question');
});

test('Space also answers a digit box', { skip }, () => {
  const found = reachQuestion('math', '.digit-box[role="button"]');
  assert.ok(found);
  const { win, doc } = found;
  press(win, doc.querySelector('.digit-box[role="button"]'), ' ');
  assert.ok(doc.querySelector('.stamp'), 'Space should answer the question');
});

test('digit boxes stop being operable once the answer lands', { skip }, () => {
  // Same argument as above, one step later in the flow. Once the question is
  // graded the boxes do nothing, but they kept role=button and tabindex=0 — so
  // a screen reader went on announcing 4-7 buttons that silently ignore you.
  const found = reachQuestion('math', '.digit-box[role="button"]');
  assert.ok(found, 'expected to reach a click-digit question');
  const { win, doc } = found;

  click(win, doc.querySelector('.digit-box[role="button"]'));
  assert.ok(doc.querySelector('.stamp'), 'the question should be graded');

  const boxes = [...doc.querySelectorAll('.digit-box')];
  assert.ok(boxes.length > 0, 'the number should still be on screen');
  for (const box of boxes) {
    assert.equal(box.getAttribute('aria-disabled'), 'true',
      'a graded digit box should announce itself as disabled');
    assert.equal(box.getAttribute('tabindex'), '-1',
      'a graded digit box should drop out of the tab order');
  }
});

/* ================= a graded question stops offering to be answered ================= */

test('the Check button goes dead once a multiselect is graded', { skip }, () => {
  // The options were disabled on grading and this wasn't, so a resolved
  // question still showed an active-looking "Check My Answers".
  const found = reachQuestion('math', '#checkBtn');
  assert.ok(found, 'expected to reach a multiselect question');
  const { win, doc } = found;

  click(win, doc.querySelector('#optGrid .opt-btn'));
  click(win, doc.querySelector('#checkBtn'));
  assert.ok(doc.querySelector('.stamp'), 'the question should be graded');
  assert.ok(doc.querySelector('#checkBtn').disabled,
    'Check My Answers should be disabled once the answer is in');
});

test('order tiles go dead once the sequence is graded', { skip }, () => {
  const found = reachQuestion('math', '#orderRow .order-tile');
  assert.ok(found, 'expected to reach an ordering question');
  const { win, doc } = found;

  const tiles = [...doc.querySelectorAll('#orderRow .order-tile')];
  for (const tile of tiles) click(win, tile);
  assert.ok(doc.querySelector('.stamp'), 'the question should be graded');

  for (const tile of doc.querySelectorAll('#orderRow .order-tile')) {
    assert.ok(tile.disabled, 'a graded order tile should be disabled');
  }
  assert.ok(doc.querySelector('#clearOrder').disabled,
    'Clear picks should be disabled once the answer is in');
});

/* ================= degraded paths ================= */

test('a question type with no renderer says so and offers a way out', { skip }, () => {
  // There was no final else. A q.type typo — or a type added to the builder but
  // not the wirer — rendered the prompt with no controls, no Check button and no
  // Next button, and nothing in the console. The only escape was the back link.
  const win = openPage('math');
  const doc = win.document;
  win.eval(`
    DetectiveGame.start({
      modes: [{ id:'x', caseNo:'01', title:'T', icon:'i', blurb:'b',
        gen: function(){ return { type:'no-such-type', prompt:'p',
          explain: function(){ return 'e'; } }; } }],
      homeIntro: 'i', trailAllFilesWord: 'one'
    });
  `);
  click(win, doc.querySelector('.case-card:not(.trail-card)'));

  assert.ok(doc.querySelector('.load-error'), 'the failure should be visible');
  assert.ok(doc.querySelector('#skipBtn'), 'there should still be a way forward');

  click(win, doc.querySelector('#skipBtn'));
  assert.ok(doc.querySelector('.next-btn'), 'skipping should advance');
});

test('a generator that throws costs one clue, not the whole page', { skip }, () => {
  const win = openPage('math');
  const doc = win.document;
  win.eval(`
    DetectiveGame.start({
      modes: [{ id:'x', caseNo:'01', title:'T', icon:'i', blurb:'b',
        gen: function(){ throw new Error('boom'); } }],
      homeIntro: 'i', trailAllFilesWord: 'one'
    });
  `);
  click(win, doc.querySelector('.case-card:not(.trail-card)'));
  assert.ok(doc.querySelector('.load-error'),
    'a throwing generator should degrade rather than leave #app frozen');
});

test('a page without #badgeNum still reaches its summary', { skip }, () => {
  // renderSummary wrote the counter BEFORE rendering, so a page missing that
  // element threw after the kid had answered every clue and left them on the
  // last question with no summary and no way forward.
  const win = openPage('math');
  const doc = win.document;
  doc.getElementById('badgeNum').remove();
  click(win, doc.querySelector('.case-card:not(.trail-card)'));
  assert.ok(playToSummary(win, doc),
    'the optional counter must not be able to strand the player');
});

test('start() refuses a config it cannot render', { skip }, () => {
  const win = openPage('math');
  win.eval(`DetectiveGame.start({ modes: [] });`);
  assert.ok(win.document.querySelector('.load-error'),
    'an empty modes array should say so rather than fail silently');

  const win2 = openPage('math');
  win2.eval(`DetectiveGame.start({ modes: [{ id:'x', caseNo:'01', title:'T', icon:'i', blurb:'b' }] });`);
  assert.ok(win2.document.querySelector('.load-error'),
    'a mode without gen() should say so');
});

/* ================= the Ledger Files' own two question types ================= */

// The engine has no idea a question can be typed into, so `input` events have
// to be raised the way a keystroke would.
function type(win, input, text) {
  input.value = text;
  input.dispatchEvent(new win.Event('input', { bubbles: true }));
}

test('a typed answer will not submit until there is a number in the box', { skip }, () => {
  // The alternative is grading an empty box as a wrong answer, which turns
  // "press the only button on screen" into the fastest way through a case that
  // exists precisely because there is nothing to guess between.
  const found = reachQuestion('ledger', '#numEntry');
  assert.ok(found, 'expected to reach a typed-answer question');
  const { win, doc } = found;

  const input = doc.querySelector('#numEntry');
  const check = doc.querySelector('#checkBtn');
  assert.ok(check.disabled, 'Check should start disabled with an empty box');

  type(win, input, 'abc');
  assert.ok(check.disabled, 'letters are not an answer');

  type(win, input, '1,250');
  assert.ok(!check.disabled, 'a number typed with a comma is still a number');
});

test('Enter submits a typed answer', { skip }, () => {
  // There is no <form> here, so nothing submits on Enter by itself — and Enter
  // is exactly what a kid presses after typing a number.
  const found = reachQuestion('ledger', '#numEntry');
  assert.ok(found, 'expected to reach a typed-answer question');
  const { win, doc } = found;

  const input = doc.querySelector('#numEntry');
  type(win, input, '425');
  press(win, input, 'Enter');
  assert.ok(doc.querySelector('.stamp'), 'Enter should grade the answer');
});

test('a graded typed answer stays readable and cannot be sent twice', { skip }, () => {
  // readOnly rather than disabled: the explanation underneath is about the
  // number in that box, and a disabled input drops out of the accessibility
  // tree — a screen reader would hear the verdict on an answer it can no
  // longer read back.
  const found = reachQuestion('ledger', '#numEntry');
  assert.ok(found, 'expected to reach a typed-answer question');
  const { win, doc } = found;

  const input = doc.querySelector('#numEntry');
  type(win, input, '425');
  click(win, doc.querySelector('#checkBtn'));

  assert.ok(doc.querySelector('.stamp'), 'the question should be graded');
  assert.equal(input.value, '425', 'the answer should still be on screen');
  assert.ok(input.readOnly, 'a graded box should not take another answer');
  assert.ok(!input.disabled, 'but it should stay in the accessibility tree');
  assert.ok(doc.querySelector('#checkBtn').disabled,
    'Check should be disabled once the answer is in');
  assert.equal(doc.querySelectorAll('.stamp').length, 1,
    'the verdict should be stamped once');
});

test('Enter on a graded typed answer does not wake the Check button', { skip }, () => {
  // The keydown handler re-read the box on every Enter, so a second press
  // after grading set check.disabled back to false — leaving an enabled button
  // that does nothing sitting beside "Next Clue →".
  const found = reachQuestion('ledger', '#numEntry');
  assert.ok(found, 'expected to reach a typed-answer question');
  const { win, doc } = found;

  const input = doc.querySelector('#numEntry');
  type(win, input, '425');
  press(win, input, 'Enter');
  assert.ok(doc.querySelector('.stamp'), 'the first Enter should grade the answer');

  press(win, input, 'Enter');
  assert.ok(doc.querySelector('#checkBtn').disabled,
    'Check should stay disabled once the answer is in');
  assert.equal(doc.querySelectorAll('.stamp').length, 1,
    'the verdict should be stamped once');
});

test('a rule-out toggle reads the option, not the drawing it hides', { skip }, () => {
  // The strip-diagram options hide their bar model from screen readers and
  // name themselves with an .sr-only sentence instead. textOf() stripped tags
  // without honouring aria-hidden, so the toggle's label read the sentence and
  // then the bag of numbers underneath it — the exact soup the sentence
  // replaces.
  const found = reachQuestion('ledger', '.mini-model');
  assert.ok(found, 'expected to reach a strip-diagram question');
  const { doc } = found;

  const wrap = doc.querySelector('.mini-model').closest('.opt-wrap');
  const label = wrap.querySelector('.opt-strike').getAttribute('aria-label');
  const spoken = wrap.querySelector('.sr-only').textContent;

  assert.equal(label, 'Rule out: ' + spoken,
    'the toggle should name the option the way a screen reader hears it');
  assert.ok(!/aria-hidden/.test(label), 'no markup should leak into the label');
});

test('a chip group holds one pick at a time', { skip }, () => {
  const found = reachQuestion('ledger', '.chip-group');
  assert.ok(found, 'expected to reach a choose-from-each-group question');
  const { win, doc } = found;

  const chips = [...doc.querySelectorAll('.chip-group')[0].querySelectorAll('.chip')];
  click(win, chips[0]);
  click(win, chips[1]);
  assert.ok(!chips[0].classList.contains('chosen'), 'the first pick should be replaced');
  assert.ok(chips[1].classList.contains('chosen'), 'the second pick should be held');
  // aria-pressed is how the state reaches a screen reader; the class only
  // reaches the eye.
  assert.equal(chips[0].getAttribute('aria-pressed'), 'false');
  assert.equal(chips[1].getAttribute('aria-pressed'), 'true');
});

test('a half-finished statement cannot be submitted', { skip }, () => {
  // The two halves are scored as one answer, so submitting one of them is not
  // a partial answer — it is a free way past the half that was left blank.
  const found = reachQuestion('ledger', '.chip-group');
  assert.ok(found, 'expected to reach a choose-from-each-group question');
  const { win, doc } = found;

  const groups = [...doc.querySelectorAll('.chip-group')];
  assert.ok(groups.length >= 2, 'the statement should have at least two groups');
  const check = doc.querySelector('#checkBtn');
  assert.ok(check.disabled, 'Check should start disabled');

  click(win, groups[0].querySelector('.chip'));
  assert.ok(check.disabled, 'one group answered is not the whole statement');

  for (const group of groups.slice(1)) click(win, group.querySelector('.chip'));
  assert.ok(!check.disabled, 'every group answered should unlock Check');
});

test('grading a statement shows the answer in every group', { skip }, () => {
  // Scored all-or-nothing, revealed group by group: a kid who got the number
  // right and the reason wrong has to be able to see which half they lost.
  const found = reachQuestion('ledger', '.chip-group');
  assert.ok(found, 'expected to reach a choose-from-each-group question');
  const { win, doc } = found;

  const groups = [...doc.querySelectorAll('.chip-group')];
  for (const group of groups) click(win, group.querySelector('.chip'));
  click(win, doc.querySelector('#checkBtn'));

  assert.ok(doc.querySelector('.stamp'), 'the statement should be graded');
  for (const group of groups) {
    const chips = [...group.querySelectorAll('.chip')];
    assert.equal(chips.filter((c) => c.classList.contains('is-correct')).length, 1,
      'each group should show exactly one right answer, whatever was picked');
    assert.ok(chips.every((c) => c.disabled), 'a graded group should stop taking picks');
  }
  assert.ok(doc.querySelector('#checkBtn').disabled,
    'Check should be disabled once the statement is graded');
});

test('the trail card is named by the game, not by the engine', { skip }, () => {
  // The default name talks about numbers, which is wrong on three of the six
  // games here. It stays the default so the math pages are untouched, and a
  // game that says otherwise has to actually get its own name onto the card.
  const MODE = `[{ id:'x', caseNo:'01', title:'T', icon:'i', blurb:'b', gen:function(){
    return { type:'mcq-simple', prompt:'p', options:[{key:'a',label:'A'}],
             correctKey:'a', explain:function(){ return 'e'; } };
  } }]`;

  const win = openPage('math');
  win.eval(`DetectiveGame.start({ modes: ${MODE} });`);
  assert.match(win.document.querySelector('#trailCard').textContent, /Follow the Numbers/,
    'a game that names no trail keeps the default');

  const win2 = openPage('math');
  win2.eval(`DetectiveGame.start({ modes: ${MODE}, trailTitle: 'The Trail \u2014 Cross the State' });`);
  assert.match(win2.document.querySelector('#trailCard').textContent, /Cross the State/,
    'a configured trail title should reach the card');
  assert.doesNotMatch(win2.document.querySelector('#trailCard').textContent, /Follow the Numbers/);
});

/* ================= structure ================= */

for (const game of Object.keys(GAMES)) {
  test(`${game}: the page has the landmarks and fallbacks it claims`, { skip }, () => {
    const doc = openPage(game).document;
    assert.ok(doc.querySelector('main'), 'there should be a main landmark to skip to');
    assert.ok(doc.querySelector('noscript'),
      'the page renders entirely from JS, so it needs a no-JS message');
  });
}
