// Run with: node --test
// Covers the pure helpers DetectiveGame exposes for question generators
// to reuse (randInt/choice/shuffle/fmt). The rendering/DOM-wiring half
// of the engine isn't covered here — see README's "Running it locally"
// for manually verifying that in a browser.

import test from 'node:test';
import assert from 'node:assert/strict';
import DetectiveGame from '../assets/js/game-engine.js';

const { randInt, choice, shuffle, fmt } = DetectiveGame;

test('randInt stays within [min, max], inclusive on both ends', () => {
  const seen = new Set();
  for (let i = 0; i < 1000; i++) {
    const n = randInt(1, 3);
    assert.ok(Number.isInteger(n), `${n} should be an integer`);
    assert.ok(n >= 1 && n <= 3, `${n} should be within [1, 3]`);
    seen.add(n);
  }
  // With 1000 draws from a 3-value range, every value should show up —
  // this also catches an off-by-one that quietly excludes one bound.
  assert.deepEqual([...seen].sort(), [1, 2, 3]);
});

test('randInt handles min === max', () => {
  for (let i = 0; i < 20; i++) {
    assert.equal(randInt(5, 5), 5);
  }
});

test('choice only ever returns a member of the given array', () => {
  const pool = ['spot', 'value', 'op10', 'expand'];
  for (let i = 0; i < 200; i++) {
    assert.ok(pool.includes(choice(pool)));
  }
});

test('shuffle returns the same multiset of elements, without mutating the input', () => {
  const original = [1, 2, 3, 4, 5, 6];
  const originalCopy = [...original];
  const shuffled = shuffle(original);

  assert.deepEqual(original, originalCopy, 'shuffle must not mutate its argument');
  assert.equal(shuffled.length, original.length);
  assert.deepEqual([...shuffled].sort(), [...original].sort());
});

test('shuffle can actually reorder (not just clone in place)', () => {
  const original = Array.from({ length: 30 }, (_, i) => i);
  let sawDifferentOrder = false;
  for (let i = 0; i < 20; i++) {
    if (shuffle(original).join(',') !== original.join(',')) {
      sawDifferentOrder = true;
      break;
    }
  }
  assert.ok(sawDifferentOrder, 'expected at least one shuffle to change the order');
});

test('fmt adds en-US thousands separators', () => {
  assert.equal(fmt(0), '0');
  assert.equal(fmt(42), '42');
  assert.equal(fmt(1000), '1,000');
  assert.equal(fmt(1234567), '1,234,567');
});
