'use strict';
// Run with: node --test
//
// Property tests over every question generator in every game. No dependencies
// and no DOM — see test/dom.test.js for the rendering half.
//
// This is where the educational content actually lives, and it's the part that
// can be wrong without looking wrong: a generator that emits an ambiguous
// question, two identical options, or an answer that is marked correct while
// being arithmetically false still renders perfectly. Both of the review's
// Critical bugs were of exactly that shape, and both were found by running
// these assertions rather than by reading the code.

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadModes, stripTags } = require('../test-support/load-game.js');

// Enough draws to catch a fault that shows up in a fraction of a percent.
// genTrueFalse's bug hit 4.29% of its questions; the digit-zero half of it,
// 2.16%. A few hundred draws would have missed the shape entirely.
//
// Per MODE, not per game. This used to be a game-wide budget divided by the
// mode count, so each of the seven math generators actually got 2,858 draws
// while the comment claimed tens of thousands -- enough for a 4% fault, but a
// 0.1% one had only a ~94% chance of showing up at all, and a 0.01% one ~25%.
const DRAWS = 20000;

function eachQuestion(game, fn) {
  const cfg = loadModes(game);
  for (const mode of cfg.modes) {
    for (let i = 0; i < DRAWS; i++) {
      fn(mode.gen(), mode, cfg);
    }
  }
}

/* ================= invariants every question must hold ================= */

for (const game of ['math', 'ela']) {
  test(`${game}: every question names a registered type`, () => {
    const cfg = loadModes(game);
    const seen = new Set();
    eachQuestion(game, (q) => seen.add(q.type));
    for (const type of seen) {
      assert.ok(
        cfg.availableTypes.has(type),
        `type "${type}" is emitted but no renderer is registered for it — ` +
        `it would render with no controls and no way forward`
      );
    }
    assert.ok(seen.size > 0, 'expected at least one question type');
  });

  test(`${game}: every question has a prompt and an explanation`, () => {
    eachQuestion(game, (q, mode) => {
      assert.ok(q && q.type, `${mode.id}: generator returned no question`);
      assert.equal(typeof q.prompt, 'string', `${mode.id}: prompt must be a string`);
      assert.ok(stripTags(q.prompt).trim().length > 0, `${mode.id}: prompt is empty`);
      assert.equal(typeof q.explain, 'function', `${mode.id}: explain must be a function`);
      const text = stripTags(q.explain()).trim();
      assert.ok(text.length > 0, `${mode.id}: explain() returned nothing`);
    });
  });

  test(`${game}: options are distinct and contain the answer`, () => {
    eachQuestion(game, (q, mode) => {
      if (!q.options) return;
      const keys = q.options.map((o) => o.key);
      const labels = q.options.map((o) => stripTags(o.label).trim());

      assert.equal(new Set(keys).size, keys.length,
        `${mode.id}: duplicate option keys — ${keys.join(', ')}`);
      // Two options reading the same thing means the question has more than one
      // right answer, or a distractor that can't be told apart from one.
      assert.equal(new Set(labels).size, labels.length,
        `${mode.id}: two options read identically — ${labels.join(' | ')}`);
      for (const label of labels) {
        assert.ok(label.length > 0, `${mode.id}: an option has no label`);
      }

      if (q.correctKey !== undefined) {
        assert.ok(keys.includes(q.correctKey),
          `${mode.id}: correctKey "${q.correctKey}" is not among the options`);
      }
      if (q.correctKeys !== undefined) {
        // An empty answer set scores correct against an empty selection, so the
        // kid gets the point for clicking Check without reading anything.
        assert.ok(q.correctKeys.length > 0,
          `${mode.id}: multiselect with no correct answers would score a free point`);
        for (const k of q.correctKeys) {
          assert.ok(keys.includes(k), `${mode.id}: correctKeys names a missing option "${k}"`);
        }
      }
    });
  });

  test(`${game}: no option label is a dangling sentence fragment`, () => {
    // "Value is one-tenth the value of" — of what? Labels that trail off in a
    // preposition leave the comparison without an object, so the kid has to
    // guess which way round it goes.
    eachQuestion(game, (q, mode) => {
      if (!q.options) return;
      for (const o of q.options) {
        const label = stripTags(o.label).trim();
        assert.doesNotMatch(label, /\b(of|to|than|as|for|with|by)$/i,
          `${mode.id}: option label ends mid-phrase — "${label}"`);
      }
    });
  });
}

/* ================= math: the answer must actually be correct ================= */

const PLACES = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands',
  'hundred-thousands', 'millions', 'ten-millions', 'hundred-millions'];
const PLACE_VALUE = PLACES.map((_, i) => 10 ** i);
const unformat = (s) => Number(String(s).replace(/,/g, ''));

/* ================= a prompt's claims about a number must be true ================= */

// Scored correctly, rendered correctly, and still lying to the reader. Nothing
// else in this file would catch it, because nothing here reads the prompt as a
// claim -- only as a question. A kid who actually counts the digits is the one
// who finds it, which is the worst possible reviewer to leave it to.
const COUNT_WORDS = { once: 1, twice: 2, 'three times': 3, 'four times': 4 };

for (const game of ['math', 'ela']) {
  test(`${game}: a digit count stated in a prompt is true of the number shown`, () => {
    // "In the number 941,445, the digit 4 appears twice" -- it appears three
    // times. 34% of value-compare's same-number questions made a false claim
    // like this before the filler digits were made to avoid the stated digit.
    let checked = 0;
    eachQuestion(game, (q, mode) => {
      const text = stripTags(q.prompt);
      const claims = text.matchAll(
        /number ([\d,]*\d)[\s\S]*?the digit (\d) appears (once|twice|three times|four times|(\d+) times)/g
      );
      for (const m of claims) {
        const actual = [...String(unformat(m[1]))].filter((c) => c === m[2]).length;
        const claimed = m[4] ? Number(m[4]) : COUNT_WORDS[m[3]];
        assert.equal(actual, claimed,
          `${mode.id}: "${text}" -- ${m[1]} contains ${actual} of the digit ${m[2]}, ` +
          `but the prompt says ${m[3]}`);
        checked++;
      }
    });
    if (game === 'math') {
      assert.ok(checked > 100,
        `expected plenty of digit-count claims to check, saw ${checked}`);
    }
  });
}

test('math: true/false statements are scored by arithmetic, not by phrasing', () => {
  // The original bug: the statement named the digit by VALUE ("the digit 8 has
  // a value of..."), so when the false branch moved the place it produced a
  // claim that was true of the number's OTHER 8 — and any claim about a zero
  // digit is true whichever place it names, since 0 x anything is 0.
  let checked = 0;
  eachQuestion('math', (q) => {
    if (q.type !== 'true-false') return;
    const text = stripTags(q.prompt);
    const m = text.match(
      /In the number ([\d,]+), is this statement True or False\?\s*"The digit in the ([a-z-]+) place has a value of \((\d) × ([\d,]+)\)\."/
    );
    assert.ok(m, `unparseable true/false prompt: ${text}`);

    const num = unformat(m[1]);
    const placeIdx = PLACES.indexOf(m[2]);
    assert.notEqual(placeIdx, -1, `unknown place name "${m[2]}"`);

    const actualValue = (Math.floor(num / PLACE_VALUE[placeIdx]) % 10) * PLACE_VALUE[placeIdx];
    const claimedValue = Number(m[3]) * unformat(m[4]);

    assert.equal(q.correctAnswer, actualValue === claimedValue,
      `"${text}" — the ${m[2]} digit is worth ${actualValue}, the statement claims ` +
      `${claimedValue}, so the answer should be ${actualValue === claimedValue}`);
    checked++;
  });
  assert.ok(checked > 100, `expected plenty of true/false questions, saw ${checked}`);
});

test('math: comparison questions say which number is the subject', () => {
  // Half of these compare two separate numbers. Without naming which is being
  // compared to which, the inverse answer — always present in the options — is
  // just as defensible, and correct reasoning gets marked wrong.
  let checked = 0;
  eachQuestion('math', (q) => {
    if (q.type !== 'value-compare') return;
    const prompt = stripTags(q.prompt);
    if (q.sameNumber) {
      assert.match(prompt, /place to the value of the digit in the/,
        `same-number comparison doesn't state its direction: ${prompt}`);
    } else {
      assert.match(prompt, /Number A[\s\S]*Number B/,
        `two-number comparison doesn't name its subject: ${prompt}`);
    }
    checked++;
  });
  assert.ok(checked > 100, `expected plenty of value-compare questions, saw ${checked}`);
});

test('math: every offered answer can actually be the correct one', () => {
  // A distractor that is wrong in every question ever generated teaches the kid
  // to strike it on sight, which beats the question without doing the thinking.
  //
  // Only meaningful for types drawn from a FIXED vocabulary of answers. Types
  // whose options are computed per question (a number and three near-misses)
  // have a different key every time, so "never correct" says nothing there.
  const FIXED_VOCABULARY = new Set(['value-compare', 'symbol']);
  const cfg = loadModes('math');
  const offered = new Map();   // type -> set of keys ever shown
  const correct = new Map();   // type -> set of keys ever correct
  const add = (map, type, key) => {
    if (!map.has(type)) map.set(type, new Set());
    map.get(type).add(key);
  };

  for (const mode of cfg.modes) {
    for (let i = 0; i < 12000; i++) {
      const q = mode.gen();
      if (!FIXED_VOCABULARY.has(q.type)) continue;
      if (q.options) for (const o of q.options) add(offered, q.type, String(o.key));
      if (q.correctKey !== undefined) add(correct, q.type, String(q.correctKey));
      // symbol questions render a fixed < > = row rather than an options array
      if (q.type === 'symbol') { for (const s of ['<', '>', '=']) add(offered, q.type, s); }
    }
  }

  for (const [type, keys] of offered) {
    const everCorrect = correct.get(type) || new Set();
    for (const key of keys) {
      assert.ok(everCorrect.has(key),
        `"${type}": option "${key}" is offered but is never the answer — ` +
        `it can be eliminated without reasoning`);
    }
  }
});

test('math: expanded form explains the sums-correctly-but-is-not-expanded trap', () => {
  // That distractor appears in every one of these questions and, by design, adds
  // up to the right number. It targets a real misconception, so the explanation
  // has to address it or a kid who falls for it learns nothing.
  let checked = 0;
  eachQuestion('math', (q) => {
    if (q.type !== 'multiselect') return;
    assert.match(q.explain(), /bundles several digits together/,
      'expanded-form explanation never mentions the true-but-not-expanded option');
    checked++;
  });
  assert.ok(checked > 100, `expected plenty of expanded-form questions, saw ${checked}`);
});

test('math: whole-number questions offer whole-number answers', () => {
  // This unit is about whole numbers. A fractional distractor is both off-topic
  // and trivially eliminable.
  eachQuestion('math', (q, mode) => {
    if (!q.options) return;
    for (const o of q.options) {
      const label = stripTags(o.label).trim();
      if (!/^[\d,]+(\.\d+)?$/.test(label)) continue;   // only judge bare numbers
      assert.doesNotMatch(label, /\./,
        `${mode.id}: offered a decimal answer "${label}" in a whole-number unit`);
    }
  });
});

/* ================= ela: a case must not repeat itself ================= */

test('ela: a case never shows the same item twice', () => {
  // These generators used to sample with replacement from pools of 5-8 across
  // 8 clues, so every single case repeated a passage and about three in four
  // repeated one back to back — answerable from memory rather than by reading.
  const cfg = loadModes('ela');
  const perCase = cfg.questionsPerCase || 8;

  for (const mode of cfg.modes) {
    for (let round = 0; round < 400; round++) {
      if (cfg.onCaseStart) cfg.onCaseStart();
      const seen = [];
      for (let i = 0; i < perCase; i++) seen.push(stripTags(mode.gen().prompt));
      assert.equal(new Set(seen).size, seen.length,
        `${mode.id}: a ${perCase}-clue case repeated an item`);
    }
  }
});

test('ela: a trail never shows the same item back to back', () => {
  // A case gets a fresh bag and is capped at the smallest pool, so it can't
  // repeat at all. A trail can: 10 stops over 4 modes means a mode can be drawn
  // more often than its pool holds, and MESSAGE_ITEMS holds 5. Measured at
  // 0.49% of trails. What is ruled out is showing the same passage twice in a
  // row, which is the version a kid answers from position memory.
  const cfg = loadModes('ela');
  const TRAIL_LENGTH = 10;
  const ids = cfg.modes.map((m) => m.id);
  const genOf = new Map(cfg.modes.map((m) => [m.id, m.gen]));

  // Back-to-back arose in ~0.11% of trails before the fix, so a few thousand
  // rounds would let it slip through a run every so often. This makes missing
  // it a ~1-in-50,000 event rather than a ~1-in-25 one.
  for (let trail = 0; trail < 10000; trail++) {
    if (cfg.onCaseStart) cfg.onCaseStart();
    // Mirrors the engine's genTrailSequence: every mode once, then random.
    const seq = [...ids];
    while (seq.length < TRAIL_LENGTH) seq.push(ids[Math.floor(Math.random() * ids.length)]);

    let prev = null;
    for (const id of seq.slice(0, TRAIL_LENGTH)) {
      const prompt = id + '|' + stripTags(genOf.get(id)().prompt);
      assert.notEqual(prompt, prev, `${id}: a trail showed the same item twice in a row`);
      prev = prompt;
    }
  }
});

test('ela: questionsPerCase fits inside the smallest item pool', () => {
  // The guarantee above only holds while this is true. If someone raises
  // questionsPerCase, or trims a pool, this is the assertion that says so.
  const cfg = loadModes('ela');
  const perCase = cfg.questionsPerCase || 8;
  for (const mode of cfg.modes) {
    if (cfg.onCaseStart) cfg.onCaseStart();
    const distinct = new Set();
    // Draw well past the pool size; the bag refills, so this converges on the
    // pool's true size.
    for (let i = 0; i < 500; i++) distinct.add(stripTags(mode.gen().prompt));
    assert.ok(distinct.size >= perCase,
      `${mode.id}: pool holds ${distinct.size} items but a case asks for ${perCase}`);
  }
});

test('ela: option order varies between draws of the same item', () => {
  // One generator passed its options straight through without shuffling, so a
  // repeated item came back in the same order every time and could be answered
  // from position memory.
  const cfg = loadModes('ela');
  for (const mode of cfg.modes) {
    const orders = new Set();
    for (let i = 0; i < 300; i++) {
      if (cfg.onCaseStart) cfg.onCaseStart();
      const q = mode.gen();
      if (q.options) orders.add(q.options.map((o) => o.key).join('|'));
    }
    assert.ok(orders.size > 1,
      `${mode.id}: option order never changes — options are not being shuffled`);
  }
});
