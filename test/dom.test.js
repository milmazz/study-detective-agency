'use strict';
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

const test = require('node:test');
const assert = require('node:assert/strict');
const { openPage, haveJsdom, click, press } = require('../test-support/load-game.js');

const skip = haveJsdom() ? false : 'jsdom is not installed — run `npm install`';

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
    // multiselect grades on its own button, so pick something then submit
    const check = doc.querySelector('#checkBtn');
    if (check) {
      const opt = doc.querySelector('#optGrid .opt-btn:not([disabled])');
      if (opt) click(win, opt);
      click(win, check);
      continue;
    }
    const control = firstControl(doc);
    if (!control) return false;
    click(win, control);
  }
  return false;
}

/* ================= both games render and play ================= */

for (const game of ['math', 'ela']) {
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

    click(win, firstControl(doc));
    assert.equal(doc.activeElement, doc.querySelector('.next-btn'),
      'focus should move to the way forward once an answer lands');
  });

  test(`${game}: the verdict is announced, not just drawn`, { skip }, () => {
    const win = openPage(game);
    const doc = win.document;
    click(win, doc.querySelector('.case-card:not(.trail-card)'));
    click(win, firstControl(doc));
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

/* ================= structure ================= */

for (const game of ['math', 'ela']) {
  test(`${game}: the page has the landmarks and fallbacks it claims`, { skip }, () => {
    const doc = openPage(game).document;
    assert.ok(doc.querySelector('main'), 'there should be a main landmark to skip to');
    assert.ok(doc.querySelector('noscript'),
      'the page renders entirely from JS, so it needs a no-JS message');
  });
}
