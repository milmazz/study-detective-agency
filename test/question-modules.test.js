'use strict';
// Run with: node --test
//
// The contract between a game page and the question module it loads.
//
// Game content used to live in an inline <script> in each page. Moving it to
// assets/js/ is what lets the other suites require() it instead of pulling it
// out of the HTML with a regex -- and it is what gets that content the
// year-long immutable cache /assets/* has, where the page's own HTML expires in
// 300s. Both of those depend on the wiring staying right, and nothing else
// checks it: a page that re-inlines its generators, or links a module it does
// not have, still renders fine right up until it doesn't.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { GAMES, loadModes, pageModules, ROOT, ENGINE } = require('../test-support/load-game.js');

const GAME_KEYS = Object.keys(GAMES);

/* ================= the page/module wiring ================= */

for (const key of GAME_KEYS) {
  test(`${key}: the page loads exactly one question module`, () => {
    // loadModes throws on none or on two; this states the requirement directly
    // rather than relying on that throw to be the failure a reader sees.
    const cfg = loadModes(key);
    assert.ok(cfg.questionModule, 'no module the page links exports a modes array');

    const exporters = cfg.modules
      .filter((rel) => rel !== ENGINE)
      .filter((rel) => {
        const m = require(path.join(ROOT, rel));
        return m && Array.isArray(m.modes);
      });
    assert.equal(exporters.length, 1,
      `expected one question module, found: ${exporters.join(', ') || 'none'}`);
  });

  test(`${key}: the question module is served from /assets/`, () => {
    // This is the whole point of extracting it. Anywhere else -- next to the
    // page under /games/ -- and _headers gives it max-age=300 instead of a
    // year, so a returning player re-downloads the generators every 5 minutes.
    const cfg = loadModes(key);
    assert.match(cfg.questionModule.split(path.sep).join('/'), /^assets\/js\/.+\.js$/,
      `${cfg.questionModule} would not get the immutable caching /assets/* has`);
  });

  test(`${key}: every module the page links carries a ?v= token`, () => {
    // Assets are immutable for a year, so the token in the HTML is the only
    // thing that busts a returning visitor's cache.
    const html = fs.readFileSync(path.join(ROOT, GAMES[key].page), 'utf8');
    const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
    assert.ok(srcs.length > 0, 'the page links no scripts at all');
    for (const src of srcs) {
      assert.match(src, /\?v=\d+$/, `${src} has no ?v= cache-buster`);
    }
  });

  test(`${key}: the page starts the game from the module it loaded`, () => {
    // The page keeps a one-line inline script; if it stops calling start(), or
    // calls it with something the module doesn't export, the game never renders.
    const html = fs.readFileSync(path.join(ROOT, GAMES[key].page), 'utf8');
    const call = html.match(/DetectiveGame\.start\(\s*([A-Z_][A-Z0-9_]*)\s*\)/);
    assert.ok(call, 'the page never calls DetectiveGame.start(<GLOBAL>)');

    const cfg = loadModes(key);
    const source = fs.readFileSync(path.join(ROOT, cfg.questionModule), 'utf8');
    assert.ok(
      source.includes(`window.${call[1]} = ${call[1]}`),
      `the page starts from ${call[1]}, but ${cfg.questionModule} never assigns that global`
    );
  });

  test(`${key}: requiring the module has no side effects`, () => {
    // It must not call start(), touch the DOM, or need the engine to already be
    // a global -- that is what makes it requirable from a test at all. There is
    // no document in this process, so anything reaching for one would throw.
    assert.equal(typeof globalThis.document, 'undefined');
    assert.equal(typeof globalThis.DetectiveGame, 'undefined');
    const cfg = loadModes(key);
    const fresh = path.join(ROOT, cfg.questionModule);
    delete require.cache[require.resolve(fresh)];
    assert.doesNotThrow(() => require(fresh));
  });
}

/* ================= what the module has to export ================= */

for (const key of GAME_KEYS) {
  test(`${key}: the exported config is one the engine can start`, () => {
    const cfg = loadModes(key);

    assert.ok(Array.isArray(cfg.modes) && cfg.modes.length > 0, 'modes must be a non-empty array');
    assert.equal(typeof cfg.homeIntro, 'string');
    assert.ok(cfg.homeIntro.trim().length > 0, 'homeIntro is what the home screen reads');
    assert.equal(typeof cfg.trailAllFilesWord, 'string');
    assert.ok(cfg.trailAllFilesWord.trim().length > 0);

    if (cfg.trailTitle !== undefined) {
      // Optional: it names the biggest card on the home screen, and an empty
      // string would render that card with no title at all.
      assert.equal(typeof cfg.trailTitle, 'string');
      assert.ok(cfg.trailTitle.trim().length > 0, 'trailTitle names the trail card');
    }
    if (cfg.questionsPerCase !== undefined) {
      assert.ok(Number.isInteger(cfg.questionsPerCase) && cfg.questionsPerCase > 0,
        'questionsPerCase must be a positive integer');
    }
    if (cfg.onCaseStart !== undefined) {
      assert.equal(typeof cfg.onCaseStart, 'function');
      assert.doesNotThrow(() => cfg.onCaseStart(), 'onCaseStart runs at the start of every case');
    }
  });

  test(`${key}: a game that is not about numbers names its own trail`, () => {
    // The engine's default trail title is "Follow the Numbers" -- right for the
    // math games, wrong copy on the biggest card on the page for any other
    // subject. That is how Words Division shipped: trailTitle was added for
    // exactly this reason and then only two of the three prose games set it.
    // Nothing else catches it, because a wrong title renders perfectly.
    const cfg = loadModes(key);
    if (cfg.page.startsWith('games/math/')) return;
    assert.equal(typeof cfg.trailTitle, 'string',
      `${cfg.page} is not a math game, so it has to name its own trail rather ` +
      `than fall back to the engine's "Follow the Numbers"`);
    assert.doesNotMatch(cfg.trailTitle, /Numbers/,
      'a trail on a non-math game should not be named after numbers');
  });

  test(`${key}: every case file is fully described`, () => {
    // These fields are what the home screen draws. A missing one renders as
    // "undefined" on a card rather than failing, so nothing else catches it.
    const cfg = loadModes(key);
    for (const mode of cfg.modes) {
      for (const field of ['id', 'caseNo', 'title', 'icon', 'blurb']) {
        assert.equal(typeof mode[field], 'string', `mode ${mode.id}: ${field} must be a string`);
        assert.ok(mode[field].trim().length > 0, `mode ${mode.id}: ${field} is empty`);
      }
      assert.equal(typeof mode.gen, 'function', `mode ${mode.id}: gen must be a function`);
    }

    const ids = cfg.modes.map((m) => m.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate mode ids: ${ids.join(', ')}`);

    // The trail card numbers itself one past the last case, so a duplicate or a
    // gap here shows up as two cards claiming the same number.
    const caseNos = cfg.modes.map((m) => m.caseNo);
    assert.equal(new Set(caseNos).size, caseNos.length, `duplicate case numbers: ${caseNos.join(', ')}`);
    assert.deepEqual(
      caseNos,
      cfg.modes.map((_, i) => String(i + 1).padStart(2, '0')),
      'case numbers should run 01, 02, 03... in the order the cards are listed'
    );
  });
}

/* ================= the pages agree with each other ================= */

/* ================= the page/stylesheet wiring ================= */

for (const key of GAME_KEYS) {
  test(`${key}: the page declares a subject theme its stylesheets know`, () => {
    // data-theme on <html> stopped being only an accent colour: game.css keys
    // the widened options grid off it, so a page that omits the attribute or
    // misspells the value silently lays sentence-long options out in the math
    // games' narrow columns. While that rule was copied into each subject
    // sheet, linking the sheet was the whole opt-in and nothing could drift;
    // keying it off the theme is what makes this worth asserting.
    const html = fs.readFileSync(path.join(ROOT, GAMES[key].page), 'utf8');
    const declared = /<html[^>]*\sdata-theme="([^"]+)"/.exec(html);
    assert.ok(declared, `${GAMES[key].page} sets no data-theme on <html>`);

    // Read the themes out of the sheets the page actually links, for the same
    // reason pageModules() does: a list written here goes on passing after the
    // stylesheets stop defining the theme it names.
    const pageDir = path.dirname(path.join(ROOT, GAMES[key].page));
    const css = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^"]*)"/g)]
      .map((m) => fs.readFileSync(path.resolve(pageDir, m[1].split('?')[0]), 'utf8'))
      .join('\n');
    const known = new Set(
      [...css.matchAll(/\[data-theme="([^"]+)"\]/g)].map((m) => m[1])
    );
    assert.ok(known.has(declared[1]),
      `${GAMES[key].page} declares data-theme="${declared[1]}", which none of ` +
      `the stylesheets it links define — its subject styling is a no-op`);
  });

  test(`${key}: every class a question emits has a CSS rule behind it`, () => {
    // A generator can invent any class it likes, and an unstyled one renders as
    // plain text that looks almost right -- which is how .q-prompt-lead shipped
    // matching no rule at all, inheriting the UA's `p { margin:1em 0 }` and
    // opening a gap no other game page has. dom.test.js's header names this
    // same shape ("classes were added that matched no CSS rule") but only ever
    // checked the two grading classes by hand.
    //
    // The stylesheets are read from the page rather than listed here, for the
    // reason pageModules() gives: a hardcoded list keeps passing after the page
    // stops linking a sheet.
    const html = fs.readFileSync(path.join(ROOT, GAMES[key].page), 'utf8');
    const pageDir = path.dirname(path.join(ROOT, GAMES[key].page));
    const sheets = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^"]*)"/g)]
      .map((m) => path.relative(ROOT, path.resolve(pageDir, m[1].split('?')[0])));
    assert.ok(sheets.length > 0, 'the page links no stylesheet at all');

    // Inline <style> counts too: the pages carry a deliberate render-blocking
    // block, and a rule living there is still a rule.
    const css = sheets.map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') +
      '\n' + [...html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');

    const cfg = loadModes(key);
    const used = new Set();
    for (const mode of cfg.modes) {
      if (cfg.onCaseStart) cfg.onCaseStart();
      for (let i = 0; i < 400; i++) {
        for (const m of String(mode.gen().prompt).matchAll(/class="([^"]+)"/g)) {
          for (const cls of m[1].split(/\s+/)) if (cls) used.add(cls);
        }
      }
    }
    assert.ok(used.size > 0, 'no question emitted a single class');

    for (const cls of used) {
      assert.match(css, new RegExp(`\\.${cls.replace(/-/g, '\\-')}(?![\\w-])`),
        `questions render class "${cls}" but no stylesheet the page links defines it`);
    }
  });
}

test('no two games share a question module or a global', () => {
  const seen = new Map();
  for (const key of GAME_KEYS) {
    const cfg = loadModes(key);
    const previous = seen.get(cfg.questionModule);
    assert.equal(previous, undefined,
      `${key} and ${previous} both load ${cfg.questionModule}`);
    seen.set(cfg.questionModule, key);
  }
});

test('every question module under assets/js is actually linked by a page', () => {
  // A module nobody loads is dead weight that still gets deployed, and worse,
  // it goes on passing every other assertion in this suite.
  const linked = new Set(
    GAME_KEYS.flatMap((key) => pageModules(GAMES[key].page).map((p) => p.split(path.sep).join('/')))
  );
  const onDisk = fs.readdirSync(path.join(ROOT, 'assets', 'js'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => `assets/js/${f}`);

  for (const file of onDisk) {
    const mod = require(path.join(ROOT, file));
    if (mod && Array.isArray(mod.modes)) {
      assert.ok(linked.has(file), `${file} exports a game but no page loads it`);
    }
  }
});
