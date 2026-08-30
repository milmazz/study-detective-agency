// Run with: node --test
//
// The contract between a game page and the question module it loads.
//
// Game content used to live in an inline <script> in each page. Moving it to
// assets/js/ is what lets the other suites import it instead of pulling it
// out of the HTML with a regex -- and it is what lets Vite bundle it into the
// content-hashed, immutably-cached output, where the page's own HTML expires
// in 300s. Both of those depend on the wiring staying right, and nothing else
// checks it: a page that re-inlines its generators, or imports a module it
// does not have, still renders fine right up until it doesn't.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  GAMES, loadModes, pageModules, pageScript, pageStylesheets, siteModules, ROOT, ENGINE,
} from '../test-support/load-game.js';

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
        const m = siteModules.get(rel);
        return m && Array.isArray(m.modes);
      });
    assert.equal(exporters.length, 1,
      `expected one question module, found: ${exporters.join(', ') || 'none'}`);
  });

  test(`${key}: the question module lives under assets/js/`, () => {
    // The convention every game follows, and what keeps a page from growing
    // its content back inline: one place the tests import from, one place
    // the build bundles from.
    const cfg = loadModes(key);
    assert.match(cfg.questionModule, /^assets\/js\/.+\.js$/,
      `${cfg.questionModule} is outside the assets/js/ convention`);
  });

  test(`${key}: the page wires its game through one bundleable module script`, () => {
    // Everything a page runs lives in one inline <script type="module"> whose
    // imports Vite bundles. A classic script, or a <script src>, ships
    // un-bundled -- still pointing at a source path that does not exist in
    // dist/, so the page renders right up until it 404s in production. And an
    // import of a file that is not there fails the build, but only the build:
    // nothing else here would name the missing module.
    const html = fs.readFileSync(path.join(ROOT, GAMES[key].page), 'utf8');
    const tags = [...html.matchAll(/<script\b[^>]*>/g)].map((m) => m[0]);
    assert.equal(tags.length, 1, `expected one script tag, found: ${tags.join(' ')}`);
    assert.match(tags[0], /type="module"/, 'the page script must be a module for Vite to bundle it');
    assert.ok(!/\bsrc=/.test(tags[0]), 'the page script should be inline imports, not a src tag');

    const modules = pageModules(GAMES[key].page);
    assert.ok(modules.length > 0, 'the page imports no modules at all');
    for (const rel of modules) {
      assert.match(rel, /^assets\/js\/[^/]+\.js$/, `${rel} is outside assets/js/`);
      assert.ok(fs.existsSync(path.join(ROOT, rel)), `${rel} is imported but does not exist`);
    }
  });

  test(`${key}: the page starts the game from the module it imported`, () => {
    // If the page stops calling start(), or calls it with a binding that is
    // not the question module's default import, the game never renders.
    const script = pageScript(GAMES[key].page);
    const call = script.match(/DetectiveGame\.start\(\s*([A-Za-z_$][\w$]*)\s*\)/);
    assert.ok(call, 'the page never calls DetectiveGame.start(<imported config>)');

    const cfg = loadModes(key);
    const imported = new RegExp(`^import ${call[1]} from '([^']+)';`, 'm').exec(script);
    assert.ok(imported, `the page starts from ${call[1]}, but never imports a default by that name`);
    const pageDir = path.dirname(path.join(ROOT, GAMES[key].page));
    const rel = path.relative(ROOT, path.resolve(pageDir, imported[1])).split(path.sep).join('/');
    assert.equal(rel, cfg.questionModule,
      `the page starts from ${rel}, but its question module is ${cfg.questionModule}`);
  });

  test(`${key}: importing the question module has no side effects`, async () => {
    // It must not call start() or touch the DOM -- that is what makes it
    // importable from a test at all. There is no document in this process, so
    // anything reaching for one would throw. The ?fresh query forces the
    // module's own top-level code to run again (its imports stay cached),
    // which is where any side effect would live.
    assert.equal(typeof globalThis.document, 'undefined');
    assert.equal(typeof globalThis.DetectiveGame, 'undefined');
    const cfg = loadModes(key);
    const fresh = pathToFileURL(path.join(ROOT, cfg.questionModule)).href + `?fresh=${key}`;
    await assert.doesNotReject(() => import(fresh));
    assert.equal(typeof globalThis.document, 'undefined');
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

    // Read the themes out of the sheets the page actually loads — the one it
    // links plus that sheet's @import chain — for the same reason
    // pageModules() reads the page: a list written here goes on passing after
    // the stylesheets stop defining the theme it names.
    const css = pageStylesheets(GAMES[key].page)
      .map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8'))
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
    // The stylesheets are read from the page (and the linked sheet's @import
    // chain) rather than listed here, for the reason pageModules() gives: a
    // hardcoded list keeps passing after the page stops linking a sheet.
    const html = fs.readFileSync(path.join(ROOT, GAMES[key].page), 'utf8');
    const sheets = pageStylesheets(GAMES[key].page);
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
  const linked = new Set(GAME_KEYS.flatMap((key) => pageModules(GAMES[key].page)));
  const onDisk = fs.readdirSync(path.join(ROOT, 'assets', 'js'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => `assets/js/${f}`);

  for (const file of onDisk) {
    const mod = siteModules.get(file);
    if (mod && Array.isArray(mod.modes)) {
      assert.ok(linked.has(file), `${file} exports a game but no page loads it`);
    }
  }
});
