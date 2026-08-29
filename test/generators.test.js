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
const { GAMES, loadModes, stripTags } = require('../test-support/load-game.js');

// Enough draws to catch a fault that shows up in a fraction of a percent.
// genTrueFalse's bug hit 4.29% of its questions; the digit-zero half of it,
// 2.16%. A few hundred draws would have missed the shape entirely.
//
// Per MODE, not per game. This used to be a game-wide budget divided by the
// mode count, so each of the seven math generators actually got 2,858 draws
// while the comment claimed tens of thousands -- enough for a 4% fault, but a
// 0.1% one had only a ~94% chance of showing up at all, and a 0.01% one ~25%.
const DRAWS = 20000;

// Every game on the site, read from the same map the pages are read from, so a
// game added to test-support/load-game.js is covered by the invariants below
// without anyone remembering to list it here twice.
const ALL_GAMES = Object.keys(GAMES);

// The games whose cases deal from fixed item pools rather than generating fresh
// content each draw. These are the ones that can repeat a clue inside a single
// case, which is the fault the pool assertions at the bottom of this file exist
// to catch.
const POOL_GAMES = ['ela', 'kitoto', 'texas'];

function eachQuestion(game, fn) {
  const cfg = loadModes(game);
  for (const mode of cfg.modes) {
    for (let i = 0; i < DRAWS; i++) {
      fn(mode.gen(), mode, cfg);
    }
  }
}

/* ================= invariants every question must hold ================= */

for (const game of ALL_GAMES) {
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

for (const game of ALL_GAMES) {
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

test('math: a rounding answer is the value the number actually rounds to', () => {
  // Three of the nine cases round, and none of them was ever checked by
  // arithmetic -- only against the structural rules (four distinct options, a
  // correctKey among them), every one of which a wrong answer satisfies
  // perfectly. Two of the three build their question from the number itself
  // rather than from a place named in the prompt, so an off-by-one in the place
  // index is the whole failure mode, and it renders beautifully.
  //
  // The place is read back out of explain(), not the prompt: that is the
  // sentence shown after answering, so if it and the scoring ever disagree the
  // explanation is teaching the wrong place.
  const ROUND_MODES = new Set(['round', 'round-top', 'round-mark']);
  let checked = 0;
  eachQuestion('math', (q, mode) => {
    if (!ROUND_MODES.has(mode.id)) return;
    const prompt = stripTags(q.prompt);
    const explain = stripTags(q.explain());

    const num = unformat(prompt.match(/([\d,]*\d)/)[1]);
    const place = explain.match(/the ([a-z-]+) place/);
    assert.ok(place, `${mode.id}: the explanation names no place: ${explain}`);
    const placeIdx = PLACES.indexOf(place[1]);
    assert.notEqual(placeIdx, -1, `${mode.id}: unknown place "${place[1]}": ${explain}`);

    const pv = PLACE_VALUE[placeIdx];
    const below = Math.floor(num / pv) * pv;
    const expected = (num - below) * 2 >= pv ? below + pv : below;

    assert.equal(Number(q.correctKey), expected,
      `${mode.id}: "${prompt}" -- ${num} to the nearest ${place[1]} is ${expected}, ` +
      `but ${q.correctKey} is marked correct`);
    assert.ok(explain.includes(expected.toLocaleString('en-US')),
      `${mode.id}: the explanation never states the rounded value ${expected}: ${explain}`);
    checked++;
  });
  assert.ok(checked > 100, `expected plenty of rounding questions, saw ${checked}`);
});

test('math: the underline case marks one digit, and the one it claims', () => {
  // Here the underline IS the question -- nothing in the prompt names the place.
  // numWithUnderline used to return the number with nothing underlined at all
  // when handed an out-of-range index: an unanswerable question that every other
  // assertion in this file passes. It throws now, and this pins the digit it
  // marks to the place the explanation names.
  //
  // The aria-label check is the same question asked for a screen reader, which
  // is told nothing whatsoever by text-decoration.
  let checked = 0;
  eachQuestion('math', (q, mode) => {
    if (mode.id !== 'round-mark') return;
    const marks = [...q.prompt.matchAll(/<span class="num-underline">(\d)<\/span>/g)];
    assert.equal(marks.length, 1,
      `expected exactly one underlined digit, saw ${marks.length}: ${q.prompt}`);

    const num = unformat(stripTags(q.prompt).match(/([\d,]*\d)/)[1]);
    const placeIdx = PLACES.indexOf(stripTags(q.explain()).match(/the ([a-z-]+) place/)[1]);
    assert.equal(Number(marks[0][1]), Math.floor(num / PLACE_VALUE[placeIdx]) % 10,
      `the underlined digit is not the one in the ${PLACES[placeIdx]} place: ${q.prompt}`);

    assert.match(q.prompt, /<span role="img" aria-label="[^"]*underlined[^"]*">/,
      `the underline carries no screen-reader label, so the question is ` +
      `unanswerable without sight: ${q.prompt}`);
    checked++;
  });
  assert.ok(checked > 100, `expected plenty of underline questions, saw ${checked}`);
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

/* ================= pool-driven games: a case must not repeat itself ================= */

for (const game of POOL_GAMES) {
  test(`${game}: a case never shows the same item twice`, () => {
    // These generators used to sample with replacement from pools of 5-8 across
    // 8 clues, so every single case repeated a passage and about three in four
    // repeated one back to back — answerable from memory rather than by reading.
    //
    // Note what this asserts on: the PROMPT. A case that varies only its
    // options is repeating the item as far as a reader is concerned, and it
    // fails here — which is how the quotation case ended up putting the line
    // being punctuated into its prompt rather than leaving it in the options.
    const cfg = loadModes(game);
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
}

for (const game of POOL_GAMES) {
  test(`${game}: a trail never shows the same item back to back`, () => {
  // A case gets a fresh bag and is capped at the smallest pool, so it can't
  // repeat at all. A trail can: 10 stops over 4 modes means a mode can be drawn
  // more often than its pool holds, and MESSAGE_ITEMS holds 5. Measured at
  // 0.49% of trails. What is ruled out is showing the same passage twice in a
  // row, which is the version a kid answers from position memory.
    const cfg = loadModes(game);
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
}

for (const game of POOL_GAMES) {
  test(`${game}: questionsPerCase fits inside the smallest item pool`, () => {
    // The guarantee above only holds while this is true. If someone raises
    // questionsPerCase, or trims a pool, this is the assertion that says so.
    const cfg = loadModes(game);
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
}

for (const game of POOL_GAMES) {
  test(`${game}: option order varies between draws of the same item`, () => {
  // One generator passed its options straight through without shuffling, so a
  // repeated item came back in the same order every time and could be answered
  // from position memory.
  const cfg = loadModes(game);
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
}

/* ================= word problems: the equation, the diagram, the options ================= */

// Pull the widths and labels back out of a rendered strip diagram. The prompt
// is the only artifact these generators produce, so reading it back is the only
// way to assert on what a kid actually sees.
function stripSegments(prompt) {
  return [...prompt.matchAll(
    /<div class="strip-seg [^"]*" style="flex:0 0 ([\d.]+)%;">([\s\S]*?)<\/div>/g
  )].map((m) => ({ width: Number(m[1]), label: stripTags(m[2]).trim() }));
}

test('wordproblems: the printed equation evaluates to the answer', () => {
  // Every case shows its own equation and then scores a separate correctKey.
  // Nothing else makes the two agree: a generator that prints one sum and marks
  // a different one renders perfectly, and the kid who actually does the
  // arithmetic on the line in front of them is the one who finds it.
  let checked = 0;
  eachQuestion('wordproblems', (q, mode) => {
    const m = /<div class="equation-line">([\s\S]*?)<\/div>\s*<div class="strip-block">/
      .exec(q.prompt);
    if (!m) return;
    // The goal case prints two equations and answers in prose, so its scoring
    // key is not a number — it gets its own assertion below.
    if (!Number.isFinite(Number(q.correctKey))) return;
    const shown = stripTags(m[1]).trim();
    const lhs = shown.split('=')[0].replace(/[−–]/g, '-').replace(/[$,]/g, '').trim();
    assert.match(lhs, /^[\d\s()+*/-]+$/, `${mode.id}: unparseable equation "${shown}"`);
    const value = Function(`"use strict";return (${lhs})`)();
    assert.equal(value, Number(q.correctKey),
      `${mode.id}: the prompt shows "${shown}" but the answer is scored as ` +
      `${q.correctKey} — the equation and the scoring disagree`);
    checked++;
  });
  assert.ok(checked > 100, `expected plenty of equations to check, saw ${checked}`);
});

test('wordproblems: no strip segment is too narrow to show its own label', () => {
  // .strip-seg is nowrap + overflow:hidden and its width comes straight from
  // the drawn numbers, so a lopsided draw silently clips the label off a bar
  // the question is asking the kid to read. Before the generator ranges were
  // expressed as ratios, the Reward Fund clipped a multi-character label in
  // 5.6% of draws — rare enough that hand-checking a few questions missed it
  // every time, which is exactly what happened.
  const cfg = loadModes('wordproblems');
  const floor = cfg.minSegPct;
  assert.ok(floor > 0, 'the question module should export the floor it promises');
  let checked = 0;
  eachQuestion('wordproblems', (q, mode) => {
    const segs = stripSegments(q.prompt);
    assert.ok(segs.length > 0, `${mode.id}: the prompt renders no strip diagram`);
    for (const s of segs) {
      if (s.label.length <= 1) continue;  // a bare "?" fits anywhere
      assert.ok(s.width >= floor,
        `${mode.id}: segment "${s.label}" gets ${s.width}% of its bar, under the ` +
        `${floor}% floor — the label clips`);
      checked++;
    }
  });
  assert.ok(checked > 100, `expected plenty of labelled segments, saw ${checked}`);
});

test('wordproblems: the comparison bracket has room for its pill', () => {
  // The "? more" pill is ~52px wide and sits in whatever the shorter bar leaves
  // over. That gap is the answer itself, so a small answer used to squeeze the
  // pill until it spilled back across the bar — under 4% of the row in 13% of
  // draws before the gap was floored.
  const cfg = loadModes('wordproblems');
  const floor = cfg.minBracketPct;
  let checked = 0;
  eachQuestion('wordproblems', (q, mode) => {
    const m = /<div class="compare-row"><div class="strip-row" style="flex:0 0 ([\d.]+)%;">/
      .exec(q.prompt);
    if (!m) return;
    const bracket = 100 - Number(m[1]);
    assert.ok(bracket >= floor,
      `${mode.id}: the bracket gets ${bracket.toFixed(2)}% of the row, under the ` +
      `${floor}% floor — the pill overflows the bar`);
    checked++;
  });
  assert.ok(checked > 100, `expected plenty of comparison rows, saw ${checked}`);
});

test('wordproblems: the answer cannot be picked out by its size', () => {
  // The size version of "every offered answer can actually be the correct one".
  // That test only covers types drawn from a fixed vocabulary, so it never
  // reached this game — and every pool here held a running total ("forgot the
  // last step"), which is always larger than the answer. Measured over 200,000
  // draws, the answer was NEVER the largest option in any of the three numeric
  // cases, making "skip the biggest number" a free 4-way-to-3-way; on Missing
  // Part of the Total the answer was always one of the two smallest, so
  // guessing between those two scored 50% without reading the question.
  //
  // Asserted as a rank histogram rather than a single statistic: whichever
  // position a guesser prefers, it has to be worth about a guess.
  const cfg = loadModes('wordproblems');
  const DRAWS_PER_MODE = 8000;
  for (const mode of cfg.modes) {
    const ranks = [0, 0, 0, 0];
    let numeric = 0;
    for (let i = 0; i < DRAWS_PER_MODE; i++) {
      const q = mode.gen();
      const values = q.options.map((o) => Number(o.key));
      if (values.some(Number.isNaN)) break;   // the goal case answers in prose
      assert.equal(values.length, 4, `${mode.id}: expected four options`);
      const sorted = [...values].sort((a, b) => a - b);
      ranks[sorted.indexOf(Number(q.correctKey))]++;
      numeric++;
    }
    if (!numeric) continue;
    const names = ['smallest', 'second', 'third', 'largest'];
    ranks.forEach((count, i) => {
      const share = count / numeric;
      assert.ok(share > 0.15 && share < 0.35,
        `${mode.id}: the answer is the ${names[i]} option in ${(share * 100).toFixed(1)}% ` +
        `of draws (want roughly 25%) — its size is a usable hint`);
    });
  }
});

test('wordproblems: the goal case\'s two equations match the option it scores', () => {
  // The one case that prints two equations and answers in prose rather than
  // with a number, so the assertion above cannot reach it. Both halves have to
  // agree with the label being scored: the two shortfalls, and which team the
  // label names as ahead — the team that is ahead is the one needing less.
  let checked = 0;
  eachQuestion('wordproblems', (q, mode) => {
    if (mode.id !== 'goal') return;
    const shown = stripTags(
      /<div class="equation-line">([\s\S]*?)<\/div>\s*<div class="strip-block">/.exec(q.prompt)[1]
    ).replace(/&nbsp;/g, ' ');
    const halves = shown.split('·').map((half) =>
      Function(`"use strict";return (${half.split('=')[0].replace(/[−–]/g, '-').replace(/,/g, '').trim()})`)()
    );
    assert.equal(halves.length, 2, `${mode.id}: expected two equations, got "${shown}"`);

    const label = q.options.filter((o) => o.key === q.correctKey)[0].label;
    const m = /^Team ([AB]) ahead — A still needs ([\d,]+), B still needs ([\d,]+)$/.exec(label);
    assert.ok(m, `${mode.id}: unparseable scored option "${label}"`);
    const needA = Number(m[2].replace(/,/g, ''));
    const needB = Number(m[3].replace(/,/g, ''));
    assert.equal(needA, halves[0],
      `${mode.id}: the prompt computes ${halves[0]} for Team A but the answer says ${needA}`);
    assert.equal(needB, halves[1],
      `${mode.id}: the prompt computes ${halves[1]} for Team B but the answer says ${needB}`);
    assert.equal(m[1], needA < needB ? 'A' : 'B',
      `${mode.id}: "${label}" names Team ${m[1]} as ahead, but Team A needs ${needA} ` +
      `and Team B needs ${needB} — the team that is ahead is the one needing less`);
    checked++;
  });
  assert.ok(checked > 100, `expected plenty of goal questions, saw ${checked}`);
});

test('wordproblems: every option names which team each number belongs to', () => {
  // The goal case answers with a PAIR of numbers, one per team, and the prompt
  // asks what each team needs. The labels used to read "Team B ahead — needs
  // 686 / 661 more": which number belonged to which team was left to the
  // reader, and the two orderings in play disagreed with each other.
  let checked = 0;
  eachQuestion('wordproblems', (q, mode) => {
    if (mode.id !== 'goal') return;
    for (const o of q.options) {
      assert.match(o.label, /^Team [AB] ahead — A still needs [\d,]+, B still needs [\d,]+$/,
        `${mode.id}: option "${o.label}" doesn't say which number is which team's`);
    }
    checked++;
  });
  assert.ok(checked > 100, `expected plenty of goal questions, saw ${checked}`);
});

/* ================= kitoto: the ELA cases that can lie quietly ================= */

test('kitoto: the four dialogue options differ only in punctuation', () => {
  // The whole case rests on this. If a distractor changes a WORD as well as a
  // comma, the sentence can be picked by meaning without ever reading a
  // quotation mark — the question stops testing what it claims to test, and
  // still looks perfectly fine.
  const cfg = loadModes('kitoto');
  const mode = cfg.modes.filter((m) => m.id === 'quotes')[0];
  assert.ok(mode, 'the quotation case should exist');

  // Down to letters and spaces: quotation marks, commas, periods and capitals
  // are exactly what is allowed to differ.
  const bare = (s) => stripTags(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  let checked = 0;
  for (let i = 0; i < 4000; i++) {
    const q = mode.gen();
    const forms = new Set(q.options.map((o) => bare(o.label)));
    assert.equal(forms.size, 1,
      `the options say different things, not the same thing punctuated differently: ` +
      `${[...forms].join(' | ')}`);
    checked++;
  }
  assert.ok(checked > 100, `expected plenty of quotation questions, saw ${checked}`);
});

test('kitoto: the retell gap cannot be filled from the list itself', () => {
  // One gap, and no option that simply repeats a step already printed in the
  // box. An option that duplicates a visible step is answerable by scanning
  // rather than by knowing the order of events — and a duplicated CORRECT step
  // would make the question have two right answers.
  const cfg = loadModes('kitoto');
  const mode = cfg.modes.filter((m) => m.id === 'retell')[0];
  assert.ok(mode, 'the retelling case should exist');

  const bare = (s) => stripTags(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  let checked = 0;
  for (let i = 0; i < 4000; i++) {
    const q = mode.gen();
    const blanks = [...q.prompt.matchAll(/<li class="retell-blank">/g)];
    assert.equal(blanks.length, 1,
      `expected exactly one gap in the retelling, saw ${blanks.length}`);

    const steps = [...q.prompt.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => bare(m[1]));
    assert.ok(steps.length >= 3, 'a retelling needs enough steps around the gap to order');
    for (const o of q.options) {
      assert.ok(!steps.includes(bare(o.label)),
        `option "${stripTags(o.label)}" is already printed in the list above it`);
    }
    checked++;
  }
  assert.ok(checked > 100, `expected plenty of retelling questions, saw ${checked}`);
});

test('kitoto: the word-part case marks a real prefix or suffix of the word shown', () => {
  // The highlight IS the question — nothing in the prompt names the letters
  // otherwise. A slice that runs off the end of the base word would still
  // render as a perfectly convincing highlighted blob.
  const cfg = loadModes('kitoto');
  const mode = cfg.modes.filter((m) => m.id === 'wordparts')[0];
  assert.ok(mode, 'the prefix/suffix case should exist');

  let checked = 0;
  for (let i = 0; i < 4000; i++) {
    const q = mode.gen();
    const marks = [...q.prompt.matchAll(/<span class="affix">([a-z]+)<\/span>/g)];
    assert.equal(marks.length, 1, `expected exactly one marked word part: ${q.prompt}`);

    const word = stripTags(/<div class="word-build">([\s\S]*?)<\/div>/.exec(q.prompt)[1]);
    const affix = marks[0][1];
    const isPrefix = /prefix/.test(stripTags(q.prompt));
    assert.ok(isPrefix ? word.startsWith(affix) : word.endsWith(affix),
      `"${word}" does not ${isPrefix ? 'start' : 'end'} with the marked part "${affix}"`);
    // The base word has to survive the affix coming off, or the question is
    // asking about a word part that ate the word.
    assert.ok(word.length - affix.length >= 3,
      `"${affix}" leaves too little of "${word}" behind to be a word part`);
    checked++;
  }
  assert.ok(checked > 100, `expected plenty of word-part questions, saw ${checked}`);
});

/* ================= texas: regions, categories, and trade-offs ================= */

const TEXAS_REGION_CASES = new Set(['region', 'place', 'compare']);

test('texas: every region question offers exactly the four regions', () => {
  // Three cases score against the same four-region vocabulary. A fifth key, or
  // a case that quietly drops one region from its options, is a typo that
  // renders beautifully — and teaches a map of Texas with a hole in it.
  const cfg = loadModes('texas');
  const keys = cfg.regionKeys;
  assert.equal(keys.length, 4, 'Texas is taught as four physical regions');

  let checked = 0;
  eachQuestion('texas', (q, mode) => {
    if (!TEXAS_REGION_CASES.has(mode.id)) return;
    assert.deepEqual(q.options.map((o) => o.key).slice().sort(), keys.slice().sort(),
      `${mode.id}: the options are not the four regions`);
    assert.ok(keys.includes(q.correctKey),
      `${mode.id}: "${q.correctKey}" is not one of the four regions`);
    checked++;
  });
  assert.ok(checked > 100, `expected plenty of region questions, saw ${checked}`);
});

test('texas: a region explanation names the region it just scored', () => {
  // The explanation is the sentence the kid reads after answering. If it names
  // a different region than the key, the game teaches the wrong answer to
  // whoever got it right — and nothing about the scoring looks wrong.
  const cfg = loadModes('texas');
  let checked = 0;
  eachQuestion('texas', (q, mode) => {
    if (!TEXAS_REGION_CASES.has(mode.id)) return;
    const label = q.options.filter((o) => o.key === q.correctKey)[0].label;
    const name = stripTags(label).replace(/^The\s+/, '');
    assert.ok(q.explain().includes(name),
      `${mode.id}: the answer is "${name}" but the explanation never says so: ${q.explain()}`);
    checked++;
  });
  assert.ok(checked > 100, `expected plenty of region questions, saw ${checked}`);
});

test('texas: adapt-or-modify never gives the category away', () => {
  // Two options say Adapting and two say Modifying, so naming the category
  // right is worth half the answer and the reason carries the rest. An item
  // whose three distractors all sat in the other category would let a kid score
  // by spotting the odd one out without reading a word after the dash.
  let checked = 0;
  eachQuestion('texas', (q, mode) => {
    if (mode.id !== 'adapt') return;
    const labels = q.options.map((o) => stripTags(o.label));
    const adapting = labels.filter((l) => /^Adapting\b/.test(l)).length;
    const modifying = labels.filter((l) => /^Modifying\b/.test(l)).length;
    assert.equal(adapting, 2, `expected two Adapting options, saw ${adapting}: ${labels.join(' | ')}`);
    assert.equal(modifying, 2, `expected two Modifying options, saw ${modifying}: ${labels.join(' | ')}`);

    // And the explanation has to back the category that was scored.
    const correct = stripTags(q.options.filter((o) => o.key === q.correctKey)[0].label);
    const wanted = /^Adapting\b/.test(correct) ? /adapt/i : /modif/i;
    assert.match(q.explain(), wanted,
      `the answer is "${correct}" but the explanation argues the other way: ${q.explain()}`);
    checked++;
  });
  assert.ok(checked > 100, `expected plenty of adapt/modify questions, saw ${checked}`);
});

test('texas: every effect offered is sometimes the right answer', () => {
  // The effects case draws its distractors from the SAME change's other column,
  // which is what stops it being answerable by spotting the odd topic out. That
  // only holds while both columns are really in play: an effect that is never
  // the answer is one a kid learns to strike on sight, and an effect filed in
  // the wrong column would show up here as one that is always struck.
  const cfg = loadModes('texas');
  const mode = cfg.modes.filter((m) => m.id === 'effect')[0];
  assert.ok(mode, 'the effects case should exist');

  const offered = new Map();   // change -> set of labels ever shown
  const correct = new Map();   // change -> set of labels ever correct
  const polarity = new Map();  // change -> set of ('positive'|'negative')
  const add = (map, key, value) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(value);
  };

  for (let i = 0; i < 20000; i++) {
    const q = mode.gen();
    const change = stripTags(/<div class="brief-box">([\s\S]*?)<\/div>/.exec(q.prompt)[1]);
    assert.equal(q.options.length, 4, 'an effects question offers four effects');
    for (const o of q.options) add(offered, change, stripTags(o.label));
    add(correct, change, stripTags(q.options.filter((o) => o.key === q.correctKey)[0].label));
    add(polarity, change, /positive/.test(stripTags(q.prompt)) ? 'positive' : 'negative');
  }

  assert.ok(offered.size >= 6, `expected several changes in the pool, saw ${offered.size}`);
  for (const [change, labels] of offered) {
    const everCorrect = correct.get(change);
    for (const label of labels) {
      assert.ok(everCorrect.has(label),
        `"${change}" offers "${label}" but it is never the answer — ` +
        `it can be eliminated without reasoning`);
    }
    assert.equal(polarity.get(change).size, 2,
      `"${change}" is only ever asked one way round, so half its effects go unused`);
  }
});
