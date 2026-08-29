'use strict';
/*
  Loading a game page for tests, two ways.

  This sits outside test/ on purpose: `node --test` treats every .js file under
  a test directory as a test file, so in there this ran as a zero-test file and
  reported itself as a passing test -- inflating the count, and turning any
  import-time throw into a phantom failure against a file with no tests in it.

  loadModes()  requires the page's own modules and returns the config its
               question module exports. No DOM, no dependencies.
  openPage()   builds a real DOM with jsdom, inlining the <script src> tags the
               page links so nothing has to be fetched. Returns null when jsdom
               isn't installed, so the dependency-free tests still run alone.
*/

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const ASSET_JS = path.join(ROOT, 'assets', 'js');
const ENGINE = path.join('assets', 'js', 'game-engine.js');

const GAMES = {
  math: { page: 'games/math/numeration-detective-agency.html' },
  ela: { page: 'games/ela/words-division.html' },
  wordproblems: { page: 'games/math/missing-evidence-files.html' },
  kitoto: { page: 'games/ela/kitoto-files.html' },
  texas: { page: 'games/social-studies/lone-star-files.html' },
};

const SCRIPT_SRC = /<script src="([^"]+)"><\/script>/g;

/*
  Which modules a page loads is read from the page, never listed here. A
  hardcoded list goes on passing after the page stops loading a module, so
  "every question names a registered type" would keep asserting against types
  the real page no longer has -- the suite agreeing with itself rather than with
  what ships. The ?v= cache-buster isn't part of the filename.
*/
function pageModules(pageRelPath) {
  const html = fs.readFileSync(path.join(ROOT, pageRelPath), 'utf8');
  const pageDir = path.dirname(path.join(ROOT, pageRelPath));
  return [...html.matchAll(SCRIPT_SRC)]
    .map((m) => path.relative(ROOT, path.resolve(pageDir, m[1].split('?')[0])));
}

/*
  Drop cached copies of the site's modules so each game gets its own engine.
  Type modules register onto the engine instance they import, and node caches
  that instance process-wide -- so without this, loading the math page would
  leave its place-value types registered while the ELA assertions ran, and
  "every question names a registered type" would pass for a type that game's
  page does not actually load.
*/
function resetSiteModules() {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(ASSET_JS)) delete require.cache[key];
  }
}

/*
  Require a game's modules the way its page loads them, and return the config
  its question module exports, plus a view of which question types the engine
  ends up knowing.
*/
function loadModes(gameKey) {
  const game = GAMES[gameKey];
  if (!game) throw new Error(`unknown game: ${gameKey}`);

  const modules = pageModules(game.page);
  if (!modules.includes(ENGINE)) {
    throw new Error(`${game.page} does not load ${ENGINE}`);
  }

  resetSiteModules();
  const engine = require(path.join(ROOT, ENGINE));

  let config = null;
  let configModule = null;
  for (const rel of modules) {
    if (rel === ENGINE) continue;
    const exported = require(path.join(ROOT, rel));
    // The question module is the one exporting a modes array; type modules
    // register themselves on the engine and export nothing of interest.
    if (exported && Array.isArray(exported.modes)) {
      if (config) {
        throw new Error(`${game.page} loads two question modules: ${configModule} and ${rel}`);
      }
      config = exported;
      configModule = rel;
    }
  }
  if (!config) {
    throw new Error(
      `${game.page} loads no question module -- nothing it links exports a modes array`
    );
  }

  return {
    ...config,
    // Asks the real engine rather than a list built alongside it, so this
    // cannot drift from what the engine would actually render.
    availableTypes: { has: (name) => engine.hasType(name) },
    page: game.page,
    modules,
    questionModule: configModule,
  };
}

/*
  Build a real DOM for a game page. Returns null if jsdom isn't installed --
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

module.exports = {
  GAMES, loadModes, openPage, haveJsdom, click, press, stripTags,
  pageModules, ROOT, ENGINE,
};
