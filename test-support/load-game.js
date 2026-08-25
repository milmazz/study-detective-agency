'use strict';
/*
  Loading a game page for tests, two ways.

  Game content — the question generators, the MODES array, the item pools —
  lives in an inline <script> in each page under games/. That's deliberate (see
  README), but it means tests can't just require() it. These helpers pull that
  script out and run it, so the generators can be exercised directly.

  This sits outside test/ on purpose: `node --test` treats every .js file under
  a test directory as a test file, so in there this ran as a zero-test file and
  reported itself as a passing test -- inflating the count, and turning any
  import-time throw into a phantom failure against a file with no tests in it.

  loadModes()  runs the page script with a stubbed DetectiveGame and returns the
               config it passed to start(). No DOM, no dependencies.
  openPage()   builds a real DOM with jsdom, inlining the <script src> tags the
               page links so nothing has to be fetched. Returns null when jsdom
               isn't installed, so the dependency-free tests still run alone.
*/

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');

const GAMES = {
  math: { page: 'games/math/numeration-detective-agency.html' },
  ela: { page: 'games/ela/words-division.html' },
};

const SCRIPT_SRC = /<script src="([^"]+)"><\/script>/g;
const ENGINE = path.join('assets', 'js', 'game-engine.js');

// Which type modules a page loads is read from the page, never listed here. A
// hardcoded list goes on passing after the page stops loading a module, so
// "every question names a registered type" would keep asserting against types
// the real page no longer has -- the suite agreeing with itself rather than
// with what ships. The ?v= cache-buster isn't part of the filename.
function typeModulesOf(pageRelPath) {
  const html = fs.readFileSync(path.join(ROOT, pageRelPath), 'utf8');
  const pageDir = path.dirname(path.join(ROOT, pageRelPath));
  return [...html.matchAll(SCRIPT_SRC)]
    .map((m) => path.relative(ROOT, path.resolve(pageDir, m[1].split('?')[0])))
    .filter((rel) => rel !== ENGINE);
}

// The <script src=...> tags carry attributes; the page's own script doesn't.
// So this only ever matches the inline one.
const INLINE_SCRIPT = /<script>([\s\S]*?)<\/script>/g;

function inlineScriptOf(pageRelPath) {
  const html = fs.readFileSync(path.join(ROOT, pageRelPath), 'utf8');
  const blocks = [...html.matchAll(INLINE_SCRIPT)].map((m) => m[1]);
  if (!blocks.length) throw new Error(`no inline <script> found in ${pageRelPath}`);
  return blocks[blocks.length - 1];
}

// A stand-in for the engine that records what the page asks of it instead of
// rendering anything. The helpers it exposes must behave like the real ones —
// they're the same implementations, required straight from the engine.
function stubEngine() {
  const real = require(path.join(ROOT, 'assets/js/game-engine.js'));
  const registered = new Set();
  const captured = { config: null };
  return {
    captured,
    registered,
    api: {
      randInt: real.randInt,
      choice: real.choice,
      shuffle: real.shuffle,
      fmt: real.fmt,
      registerType: (name) => registered.add(name),
      hasType: (name) => registered.has(name),
      start: (config) => { captured.config = config; },
    },
  };
}

/*
  Run a game's page script headlessly and return what it passed to start(),
  plus the set of question types available to it (the engine's own built-ins
  plus anything its type modules register).
*/
function loadModes(gameKey) {
  const game = GAMES[gameKey];
  if (!game) throw new Error(`unknown game: ${gameKey}`);

  const { captured, registered, api } = stubEngine();
  const real = require(path.join(ROOT, 'assets/js/game-engine.js'));
  for (const name of ['mcq-simple', 'multiselect', 'true-false']) {
    if (real.hasType(name)) registered.add(name);
  }

  const sandbox = {
    DetectiveGame: api,
    Math, JSON, parseInt, parseFloat, String, Number, Array, Object, Date, RegExp, console,
    // Page scripts don't touch the DOM at definition time, but a stray lookup
    // should return nothing rather than throw and hide the real failure.
    document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
  };
  const ctx = vm.createContext(sandbox);

  for (const mod of typeModulesOf(game.page)) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, mod), 'utf8'), ctx, { filename: mod });
  }
  vm.runInContext(inlineScriptOf(game.page), ctx, { filename: game.page });

  if (!captured.config) throw new Error(`${game.page} never called DetectiveGame.start()`);
  return { ...captured.config, availableTypes: registered, page: game.page };
}

/*
  Build a real DOM for a game page. Returns null if jsdom isn't installed —
  callers should skip rather than fail, so `node --test` works on a fresh clone
  with no npm install.
*/
let jsdom;
let jsdomChecked = false;
function haveJsdom() {
  if (!jsdomChecked) {
    jsdomChecked = true;
    try { jsdom = require('jsdom'); } catch { jsdom = null; }
  }
  return Boolean(jsdom);
}

function openPage(gameKey) {
  if (!haveJsdom()) return null;
  const game = GAMES[gameKey];
  if (!game) throw new Error(`unknown game: ${gameKey}`);

  const pagePath = path.join(ROOT, game.page);
  const pageDir = path.dirname(pagePath);
  let html = fs.readFileSync(pagePath, 'utf8');

  // Inline the linked scripts. jsdom would otherwise try to fetch them, and the
  // ?v= cache-buster on each href isn't a real filename.
  html = html.replace(SCRIPT_SRC, (_, src) => {
    const file = path.resolve(pageDir, src.split('?')[0]);
    return '<script>' + fs.readFileSync(file, 'utf8') + '</script>';
  });

  const dom = new jsdom.JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
  return dom.window;
}

// jsdom's window doesn't share a realm with the test, so events must be built
// from the window's own constructors.
function click(win, el) {
  el.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
}
function press(win, el, key) {
  el.dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true }));
}

const stripTags = (html) => String(html).replace(/<[^>]*>/g, '');

module.exports = { GAMES, loadModes, openPage, haveJsdom, click, press, stripTags, ROOT };
