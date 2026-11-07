// Run with: node --test
//
// The bonus study pages (Mochi's Energy Lab, Pepita's Texas Trail) are not
// DetectiveGame case files, so test/question-modules.test.js and the
// generator suite don't cover them. Their content is hand-written rather than
// generated, which makes the answer key the part that can be wrong without
// looking wrong: an answer index off by one, a "pick 2" with three right
// answers, a sort row pointing at a label that doesn't exist. All of those
// render perfectly and mark a correct answer wrong. This suite checks the
// keys, plus the same page wiring the case-file pages are held to.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.join(import.meta.dirname, '..');
const ENGINE = 'assets/js/bonus-quiz.js';

const BONUS = {
  energy: { page: 'games/science/energy-lab.html', content: 'assets/js/energy-lab-content.js', url: 'games/science/energy-lab' },
  texasTrail: { page: 'games/social-studies/texas-trail.html', content: 'assets/js/texas-trail-content.js', url: 'games/social-studies/texas-trail' },
};

const TYPES = new Set(['mc', 'multi', 'sort', 'order', 'write']);
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const load = async (rel) => (await import(pathToFileURL(path.join(ROOT, rel)).href)).default;

test('importing the bonus modules has no side effects', async () => {
  // Same contract as the question modules: start() is the only way in.
  assert.equal(typeof globalThis.document, 'undefined');
  const engine = await load(ENGINE);
  assert.equal(typeof engine.start, 'function');
  assert.equal(engine.modes, undefined, 'the bonus engine must not look like a case-file module');
  for (const { content } of Object.values(BONUS)) {
    const cfg = await load(content);
    assert.equal(cfg.modes, undefined, `${content} must not export modes`);
  }
  assert.equal(typeof globalThis.document, 'undefined');
});

for (const [key, b] of Object.entries(BONUS)) {
  test(`${key}: the page runs one module script that starts its own content`, () => {
    const html = read(b.page);
    const tags = [...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
    assert.equal(tags.length, 1, `expected one script tag, found: ${tags.join(' ')}`);
    assert.match(tags[0], /type="module"/);
    assert.ok(!/\bsrc=/.test(tags[0]));

    const script = /<script type="module">([\s\S]*?)<\/script>/.exec(html)[1];
    const imports = [...script.matchAll(/^import ([A-Za-z_$][\w$]*) from '([^']+)';/gm)]
      .map((m) => ({ name: m[1], rel: path.relative(ROOT, path.resolve(path.dirname(path.join(ROOT, b.page)), m[2])).split(path.sep).join('/') }));
    for (const { rel } of imports) assert.ok(fs.existsSync(path.join(ROOT, rel)), `${rel} is imported but missing`);
    const engine = imports.find((i) => i.rel === ENGINE);
    const content = imports.find((i) => i.rel === b.content);
    assert.ok(engine, `${b.page} does not import ${ENGINE}`);
    assert.ok(content, `${b.page} does not import ${b.content}`);
    assert.match(script, new RegExp(`${engine.name}\\.start\\(\\s*${content.name}\\s*\\)`),
      'the page never starts the engine with the content it imported');
  });

  test(`${key}: the page links one stylesheet that pulls in bonus.css`, () => {
    const html = read(b.page);
    const links = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => m[1]);
    assert.equal(links.length, 1);
    const sheet = path.relative(ROOT, path.resolve(path.dirname(path.join(ROOT, b.page)), links[0]));
    assert.ok(fs.existsSync(path.join(ROOT, sheet)), `${sheet} is missing`);
    assert.match(read(sheet), /^@import '\.\/bonus\.css';/);
    // data-theme is the site's subject switch; the bonus pages theme
    // themselves and must not collide with it.
    assert.doesNotMatch(read(sheet), /data-theme/);
  });

  test(`${key}: the homepage lists the page`, () => {
    const index = read('index.html');
    assert.ok(index.includes(`url: '${b.url}'`), `index.html has no card for ${b.url}`);
    assert.ok(fs.existsSync(path.join(ROOT, b.url + '.html')));
  });

  test(`${key}: every question has a valid answer key`, async () => {
    const cfg = await load(b.content);
    const qs = cfg.questions;
    assert.ok(Array.isArray(qs) && qs.length > 0);
    const ids = qs.map((q) => q.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate ids: ${ids.join(', ')}`);

    for (const q of qs) {
      const where = `question ${q.id}`;
      assert.ok(TYPES.has(q.type), `${where}: unknown type ${q.type}`);
      assert.ok(cfg.tags[q.tag], `${where}: unknown tag ${q.tag}`);
      assert.ok(typeof q.q === 'string' && q.q.trim(), `${where}: no prompt`);
      assert.ok(typeof q.explain === 'string' && q.explain.trim(), `${where}: no explanation`);
      if (q.type !== 'write') assert.ok(typeof q.hint === 'string' && q.hint.trim(), `${where}: no hint for the retry`);

      if (q.type === 'mc' || q.type === 'multi') {
        assert.ok(q.opts.length >= 3, `${where}: too few options`);
        assert.equal(new Set(q.opts).size, q.opts.length, `${where}: duplicate options`);
      }
      if (q.type === 'mc') {
        assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.opts.length, `${where}: answer out of range`);
      }
      if (q.type === 'multi') {
        assert.ok(q.answers.length >= 2 && q.answers.length < q.opts.length, `${where}: bad number of answers`);
        assert.equal(new Set(q.answers).size, q.answers.length, `${where}: repeated answer`);
        for (const a of q.answers) assert.ok(Number.isInteger(a) && a >= 0 && a < q.opts.length, `${where}: answer ${a} out of range`);
        // The prompt says how many to pick; it has to agree with the key.
        const words = { 2: 'TWO', 3: 'THREE' };
        assert.ok(q.q.includes(words[q.answers.length]), `${where}: prompt doesn't say pick ${q.answers.length}`);
      }
      if (q.type === 'sort') {
        assert.ok(q.labels.length >= 2, `${where}: a sort needs two labels`);
        assert.ok(q.items.length >= 2);
        for (const it of q.items) assert.ok(Number.isInteger(it.a) && it.a >= 0 && it.a < q.labels.length, `${where}: "${it.t}" points at no label`);
        // A sort where every row has the same answer can be passed by tapping
        // one column all the way down.
        assert.ok(new Set(q.items.map((it) => it.a)).size > 1, `${where}: every row has the same answer`);
      }
      if (q.type === 'order') {
        assert.ok(q.items.length >= 3);
        assert.equal(new Set(q.items).size, q.items.length, `${where}: duplicate cards`);
      }
      if (q.type === 'write') {
        assert.ok(Array.isArray(q.checklist) && q.checklist.length > 0, `${where}: no checklist`);
      }
    }
  });

  test(`${key}: the report card and Learn games point at real things`, async () => {
    const cfg = await load(b.content);
    const html = read(b.page);
    for (const [tag, t] of Object.entries(cfg.tags)) {
      assert.ok(cfg.questions.some((q) => q.tag === tag && q.type !== 'write'), `tag ${tag} has no scored question`);
      assert.ok(html.includes(`id="${t.link}"`), `tag ${tag} links to #${t.link}, which the page doesn't have`);
    }
    for (const [name, s] of Object.entries(cfg.sorters || {})) {
      assert.ok(html.includes(`data-sorter="${name}"`), `sorter ${name} is never placed on the page`);
      for (const it of s.items) assert.ok(it.a >= 0 && it.a < s.labels.length, `sorter ${name}: "${it.t}" points at no label`);
    }
    for (const name of Object.keys(cfg.orderers || {})) {
      assert.ok(html.includes(`data-orderer="${name}"`), `orderer ${name} is never placed on the page`);
    }
    for (const m of html.matchAll(/data-sorter="([^"]+)"/g)) assert.ok(cfg.sorters[m[1]], `page uses unknown sorter ${m[1]}`);
    for (const m of html.matchAll(/data-orderer="([^"]+)"/g)) assert.ok(cfg.orderers[m[1]], `page uses unknown orderer ${m[1]}`);
  });
}
