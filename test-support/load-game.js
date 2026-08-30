/*
  Loading a game page for tests, two ways.

  This sits outside test/ on purpose: `node --test` treats every .js file under
  a test directory as a test file, so in there this ran as a zero-test file and
  reported itself as a passing test -- inflating the count, and turning any
  import-time throw into a phantom failure against a file with no tests in it.

  loadModes()   returns the config a page's question module exports, plus a
                per-game view of which question types that page's modules
                register. Synchronous: every module under assets/js is imported
                once, below, at module load.
  prepareDom()  bundles each page's module graph to a single classic script
                (jsdom does not execute <script type="module">), using Vite's
                build API -- the same bundler that builds the site. Async, run
                once from the top of dom.test.js; returns false when jsdom (or
                vite) is not installed so the dependency-free suites still run
                alone.
  openPage()    builds a real DOM for a prepared page. Synchronous and cheap on
                purpose: reachQuestion() in dom.test.js opens pages in a loop
                hundreds of times.
*/

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const ROOT = path.join(import.meta.dirname, '..');
export const ENGINE = 'assets/js/game-engine.js';

export const GAMES = {
  math: { page: 'games/math/numeration-detective-agency.html' },
  ela: { page: 'games/ela/words-division.html' },
  wordproblems: { page: 'games/math/missing-evidence-files.html' },
  ledger: { page: 'games/math/ledger-files.html' },
  kitoto: { page: 'games/ela/kitoto-files.html' },
  texas: { page: 'games/social-studies/lone-star-files.html' },
};

/*
  Which modules a page loads is read from the page, never listed here. A
  hardcoded list goes on passing after the page stops loading a module, so
  "every question names a registered type" would keep asserting against types
  the real page no longer has -- the suite agreeing with itself rather than with
  what ships. A page carries one inline <script type="module"> whose import
  statements name its modules; Vite bundles that block, and these tests parse it.
*/
const PAGE_SCRIPT = /<script type="module">([\s\S]*?)<\/script>/;
const IMPORT_LINE = /^import (?:[A-Za-z_$][\w$]* from )?'([^']+)';/gm;

export function pageScript(pageRelPath) {
  const html = fs.readFileSync(path.join(ROOT, pageRelPath), 'utf8');
  const m = PAGE_SCRIPT.exec(html);
  if (!m) throw new Error(`${pageRelPath} has no inline module script`);
  return m[1];
}

// Repo-relative paths (forward slashes) of the modules a page imports, in
// document order.
export function pageModules(pageRelPath) {
  const pageDir = path.dirname(path.join(ROOT, pageRelPath));
  return [...pageScript(pageRelPath).matchAll(IMPORT_LINE)]
    .map((m) => path.relative(ROOT, path.resolve(pageDir, m[1])).split(path.sep).join('/'));
}

/*
  The stylesheets a page loads, in cascade order. A page links exactly one
  sheet; that sheet @imports the rest of its chain (subject sheet -> game.css
  -> base.css), which is how the order is fixed against a bundler that makes
  no promise about the order of separate <link> tags. Read from the page and
  followed recursively for the same reason pageModules() reads the page: a
  list written in a test goes on passing after the wiring changes.
*/
const CSS_IMPORT = /@import\s+'([^']+)'\s*;/g;
export function pageStylesheets(pageRelPath) {
  const html = fs.readFileSync(path.join(ROOT, pageRelPath), 'utf8');
  const pageDir = path.dirname(path.join(ROOT, pageRelPath));
  const seen = new Set();
  const sheets = [];
  const visit = (file) => {
    if (seen.has(file)) return;
    seen.add(file);
    for (const m of fs.readFileSync(file, 'utf8').matchAll(CSS_IMPORT)) {
      visit(path.resolve(path.dirname(file), m[1]));
    }
    sheets.push(path.relative(ROOT, file).split(path.sep).join('/')); // imports first: cascade order
  };
  for (const m of html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)) {
    visit(path.resolve(pageDir, m[1]));
  }
  return sheets;
}

/*
  Import every module under assets/js exactly once, right here at module load.
  ES modules have no require.cache to reset, so all six games share one engine
  instance -- which would let a type registered by the math page satisfy a
  "registered type" assertion about an ELA page. Instead, registerType is
  wrapped while each module first executes, recording which names THAT module
  registered; loadModes() then answers per game from the modules its page
  actually imports. Built-ins are the names the engine knows that no module
  here registered.

  siteModules maps repo-relative path -> the module's default export
  (undefined for the side-effect type modules, which export nothing).
*/
export const siteModules = new Map();
const TYPES_BY_MODULE = new Map();

const engine = (await import(pathToFileURL(path.join(ROOT, ENGINE)).href)).default;
siteModules.set(ENGINE, engine);

{
  const original = engine.registerType;
  let current = null;
  engine.registerType = function (name, def) {
    if (current) TYPES_BY_MODULE.get(current).add(name);
    return original.call(engine, name, def);
  };
  const jsDir = path.join(ROOT, 'assets', 'js');
  for (const file of fs.readdirSync(jsDir).filter((f) => f.endsWith('.js')).sort()) {
    const rel = `assets/js/${file}`;
    if (rel === ENGINE) continue;
    current = rel;
    TYPES_BY_MODULE.set(rel, new Set());
    siteModules.set(rel, (await import(pathToFileURL(path.join(jsDir, file)).href)).default);
  }
  current = null;
  engine.registerType = original;
}

const ATTRIBUTED = new Set([...TYPES_BY_MODULE.values()].flatMap((s) => [...s]));

/*
  The config a game's question module exports, plus a view of which question
  types its page can actually render: the engine's built-ins, and whatever the
  modules this page imports registered.
*/
export function loadModes(gameKey) {
  const game = GAMES[gameKey];
  if (!game) throw new Error(`unknown game: ${gameKey}`);

  const modules = pageModules(game.page);
  if (!modules.includes(ENGINE)) {
    throw new Error(`${game.page} does not import ${ENGINE}`);
  }

  let config = null;
  let configModule = null;
  for (const rel of modules) {
    if (rel === ENGINE) continue;
    if (!siteModules.has(rel)) {
      throw new Error(`${game.page} imports ${rel}, which is not under assets/js/`);
    }
    const exported = siteModules.get(rel);
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
      `${game.page} loads no question module -- nothing it imports exports a modes array`
    );
  }

  const pageTypes = new Set(modules.flatMap((rel) => [...(TYPES_BY_MODULE.get(rel) || [])]));
  return {
    ...config,
    // Built-ins are asked of the real engine rather than listed, so this
    // cannot drift from what the engine would actually render.
    availableTypes: {
      has: (name) => pageTypes.has(name) || (engine.hasType(name) && !ATTRIBUTED.has(name)),
    },
    page: game.page,
    modules,
    questionModule: configModule,
  };
}

/*
  The DOM half. jsdom executes classic scripts only -- <script type="module">
  is silently skipped -- so each page's module graph is bundled to one classic
  IIFE by Vite's build API before any DOM test runs. The bundle also exposes
  window.DetectiveGame, which the degraded-path tests use to start the engine
  with configs no shipping page would (win.eval, see dom.test.js).
*/
let jsdom = null;
try {
  jsdom = (await import('jsdom')).default;
} catch {
  jsdom = null;
}

export function haveJsdom() {
  return Boolean(jsdom);
}

const PAGE_DOMS = new Map(); // gameKey -> page html with the bundle inlined
let preparing = null;

export function prepareDom() {
  preparing ??= (async () => {
    if (!jsdom) return false;
    let build;
    try {
      ({ build } = await import('vite'));
    } catch {
      return false; // vite and jsdom install together; treat alike
    }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sda-dom-'));
    for (const [key, game] of Object.entries(GAMES)) {
      const pageDir = path.dirname(path.join(ROOT, game.page));
      // The page's own inline script, with its relative imports rebased so the
      // entry can live in a temp dir, plus the test-only global.
      const entrySource =
        pageScript(game.page).replace(/'(\.[^']+)'/g, (_, spec) => `'${path.resolve(pageDir, spec)}'`) +
        '\nwindow.DetectiveGame = DetectiveGame;\n';
      const entryFile = path.join(tmp, `${key}.entry.js`);
      fs.writeFileSync(entryFile, entrySource);

      const result = await build({
        configFile: false, // the site config's MPA inputs and plugins do not apply here
        logLevel: 'silent',
        build: {
          write: false,
          minify: false,
          modulePreload: false,
          rollupOptions: { input: entryFile, output: { format: 'iife' } },
        },
      });
      const outputs = Array.isArray(result) ? result : [result];
      const chunk = outputs[0].output.find((o) => o.type === 'chunk');

      const html = fs.readFileSync(path.join(ROOT, game.page), 'utf8').replace(
        PAGE_SCRIPT,
        // '</script' inside the bundle would end the tag early; '<\/' is the
        // same characters to a JS string, so this cannot change behavior.
        () => '<script>' + chunk.code.replace(/<\/script/gi, '<\\/script') + '</script>'
      );
      PAGE_DOMS.set(key, html);
    }
    return true;
  })();
  return preparing;
}

export function openPage(gameKey) {
  if (!jsdom) return null;
  const html = PAGE_DOMS.get(gameKey);
  if (!html) throw new Error('openPage: await prepareDom() first');
  const dom = new jsdom.JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
  return dom.window;
}

// jsdom's window doesn't share a realm with the test, so events must be built
// from the window's own constructors.
export function click(win, el) {
  el.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
}
export function press(win, el, key) {
  el.dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true }));
}

export const stripTags = (html) => String(html).replace(/<[^>]*>/g, '');
