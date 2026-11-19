// Run with: node --test
//
// Honey's Spelling Hive (games/ela/spelling-hive.html). The word list is
// hand-written, and the part that can be wrong without looking wrong is the
// part that gives the game away: a definition that contains the word, or a
// sentence the page can't blank, shows the kid the spelling before she tries.
// The helpers decide what counts as right, so they get pinned here too.
// Page wiring (one module script, one stylesheet, the homepage card) is
// checked with the other bonus pages in test/bonus-pages.test.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.join(import.meta.dirname, '..');
const ENGINE = 'assets/js/spelling-hive.js';
const CONTENT = 'assets/js/spelling-hive-words.js';
const imp = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);

const { default: HIVE } = await imp(CONTENT);
const H = await imp(ENGINE);
const { words, grades } = HIVE;
const byN = (n) => words.find((w) => w.n === n);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wholeWord = (s) => new RegExp(`(^|[^A-Za-z])${esc(s)}(?![A-Za-z])`, 'gi');
const spellingsOf = (w) => [w.word, ...(w.alts || [])];

test('importing the hive modules has no side effects', () => {
  assert.equal(typeof globalThis.document, 'undefined');
  assert.equal(typeof H.default.start, 'function');
  assert.equal(H.default.modes, undefined);
  assert.equal(HIVE.modes, undefined);
});

/* ---------------- the word list ---------------- */

test('words run 76-150 with no gaps, 25 per grade, each inside its grade', () => {
  assert.deepEqual(words.map((w) => w.n), Array.from({ length: 75 }, (_, i) => 76 + i));
  assert.deepEqual(grades.map((g) => [g.id, g.first, g.last]), [[4, 76, 100], [5, 101, 125], [6, 126, 150]]);
  for (const g of grades) {
    const mine = words.filter((w) => w.grade === g.id);
    assert.equal(mine.length, 25, `${g.label} has ${mine.length} words`);
    for (const w of mine) assert.ok(w.n >= g.first && w.n <= g.last, `${w.word} (#${w.n}) is outside ${g.label}`);
  }
  assert.equal(new Set(words.map((w) => w.word.toLowerCase())).size, words.length, 'a word appears twice');
});

test('every word has its information and a mark that spells it', () => {
  for (const w of words) {
    const where = `#${w.n} ${w.word}`;
    for (const f of ['word', 'pos', 'def', 'sentence', 'origin', 'tip', 'mark']) {
      assert.ok(typeof w[f] === 'string' && w[f].trim(), `${where}: no ${f}`);
    }
    assert.match(w.mark, /\[[^\]]+\]/, `${where}: the mark highlights nothing`);
    assert.equal(w.mark.replace(/[[\]]/g, ''), w.word, `${where}: the mark "${w.mark}" doesn't spell the word`);
    for (const k of ['sounds', 'alts']) if (w[k] !== undefined) assert.ok(Array.isArray(w[k]) && w[k].length, `${where}: ${k} should be a non-empty list`);
    if (w.say !== undefined) assert.ok(typeof w.say === 'string' && w.say.trim(), `${where}: empty say`);
  }
});

test('the alternate spellings the list accepts are there', () => {
  assert.deepEqual(byN(124).alts, ['fertiliser']);
  assert.deepEqual(byN(133).alts, ['materialise']);
});

test('no definition gives the word away', () => {
  for (const w of words) {
    for (const s of spellingsOf(w)) {
      assert.doesNotMatch(w.def, wholeWord(s), `#${w.n} ${w.word}: the definition contains the word`);
    }
  }
});

test('a sounds-like list never names the word itself', () => {
  // Study shows "sounds like puppy" next to puffy; listing the word itself
  // would be a mistake in the data.
  for (const w of words) for (const s of w.sounds || []) {
    assert.notEqual(H.normalize(s), H.normalize(w.word), `#${w.n}: sounds-like lists the word itself`);
  }
});

test('every sentence uses the word exactly once, so it can be blanked', () => {
  for (const w of words) {
    const hits = spellingsOf(w).reduce((n, s) => n + (w.sentence.match(wholeWord(s)) || []).length, 0);
    assert.equal(hits, 1, `#${w.n} ${w.word}: the sentence uses the word ${hits} times`);
  }
});

/* ---------------- the helpers ---------------- */

test('a spelling is right however it is capitalized or spaced', () => {
  assert.equal(H.isCorrect(byN(76), ' Buttons '), true);
  assert.equal(H.isCorrect(byN(76), 'BUTTONS'), true);
  assert.equal(H.isCorrect(byN(101), 'halloween'), true);
  assert.equal(H.isCorrect(byN(124), 'fertilizer'), true);
  assert.equal(H.isCorrect(byN(124), 'Fertiliser'), true);
  assert.equal(H.isCorrect(byN(76), 'butons'), false);
  assert.equal(H.isCorrect(byN(76), ''), false);
  assert.equal(H.isCorrect(byN(76), 'buttons buttons'), false);
});

test('the blank hides every spelling of the word', () => {
  for (const w of words) {
    const shown = H.blankWord(w.sentence, w);
    assert.ok(shown.includes('_____'), `#${w.n}: nothing was blanked`);
    for (const s of spellingsOf(w)) assert.doesNotMatch(shown, wholeWord(s), `#${w.n}: "${s}" still shows`);
  }
  assert.equal(H.blankWord('Buttons, buttons everywhere.', byN(76)), '_____, _____ everywhere.');
});

test('the letter diff highlights the letters she missed', () => {
  const flags = (typed, answer) => H.letterDiff(typed, answer).map((x) => (x.ok ? 1 : 0));
  assert.deepEqual(flags('benith', 'beneath'), [1, 1, 1, 0, 0, 1, 1]);
  assert.deepEqual(flags('beneath', 'beneath'), [1, 1, 1, 1, 1, 1, 1]);
  assert.deepEqual(flags('', 'kelp'), [0, 0, 0, 0]);
  assert.deepEqual(H.letterDiff('Lulaby', 'lullaby').map((x) => x.ch).join(''), 'lullaby');
  assert.deepEqual(flags('Lulaby', 'lullaby'), [1, 1, 1, 0, 1, 1, 1]);
});

test('a round deals unmastered words first, then fills, never twice', () => {
  const grade4 = words.slice(0, 25);
  const mastered = new Set(grade4.slice(0, 15).map((w) => w.n));
  const round = H.pickRound(grade4, mastered, 10);
  assert.equal(round.length, 10);
  assert.deepEqual(round.map((w) => w.n).sort((a, b) => a - b), grade4.slice(15).map((w) => w.n));

  const most = new Set(grade4.slice(0, 20).map((w) => w.n));
  const r2 = H.pickRound(grade4, most, 10);
  assert.equal(r2.length, 10);
  assert.deepEqual(r2.slice(0, 5).map((w) => w.n).sort((a, b) => a - b), grade4.slice(20).map((w) => w.n));
  assert.equal(new Set(r2.map((w) => w.n)).size, 10, 'a word was dealt twice');

  assert.equal(H.pickRound(grade4.slice(0, 4), new Set(), 10).length, 4, 'a short list deals what it has');
});

test('the voice picker prefers a good US English voice', () => {
  const v = (name, lang) => ({ name, lang });
  const samantha = v('Samantha', 'en-US');
  assert.equal(H.pickVoice([v('Daniel', 'en-GB'), v('Fred', 'en-US'), samantha]), samantha);
  assert.equal(H.pickVoice([v('Daniel', 'en-GB'), v('Fred', 'en-US')]).name, 'Fred');
  assert.equal(H.pickVoice([v('Thomas', 'fr-FR'), v('Daniel', 'en-GB')]).name, 'Daniel');
  assert.equal(H.pickVoice([v('Thomas', 'fr-FR')]), null);
  assert.equal(H.pickVoice([]), null);
});

test('the answer box tells keyboards not to fix her spelling', () => {
  // An iPad keyboard that autocorrects "benith" to "beneath" marks a miss
  // right, and a spellcheck underline flags a miss before she checks it.
  const src = fs.readFileSync(path.join(ROOT, ENGINE), 'utf8');
  for (const attr of ['autocomplete="off"', 'autocorrect="off"', 'autocapitalize="off"', 'spellcheck="false"']) {
    assert.ok(src.includes(attr), `the answer box is missing ${attr}`);
  }
});
