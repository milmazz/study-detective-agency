# The Study Detective Agency

**Live at [studydetectiveagency.com](https://studydetectiveagency.com/)**

A small, static website of browser-based study games for 4th grade, themed
as detective "case files." Built to give my kid another way to
practice — no backend, no accounts, no framework, just HTML/CSS/JS bundled
by [Vite](https://vite.dev).

Live divisions:
- **Numbers Division** (math) — place value, expanded form, comparing,
  ordering, rounding, multi-step addition/subtraction word problems solved
  with an equation and a strip (bar model) diagram, and a test-prep set on
  adding and subtracting: typed answers, choosing the equation that models
  a story, matching a strip diagram to it, and estimating by rounding.
- **Words Division** (ELA) — author's purpose, central message, figurative
  language, text formatting clues; plus a second file on *Kitoto the Mighty*
  covering retelling, story elements, theme, author's craft, context clues,
  prefixes and suffixes, and punctuating quotations.
- **History Division** (social studies) — the four physical regions of Texas,
  the work and traditions the land shapes, and how Texans adapt to and modify
  their environment.

## Running it locally

This repo pins Node 24 via [mise](https://mise.jdx.dev) in `mise.toml`;
with mise installed, `cd` into the repo and it picks up the right version
automatically.

```bash
npm ci
npm run dev
```

Then open the URL Vite prints. The site is deployed on Cloudflare with
clean URLs (`/games/math/foo`, no `.html`); the `cleanUrls()` plugin in
`vite.config.mjs` mimics that resolution locally, in both `npm run dev`
and `npm run preview` (which serves the built `dist/`).

## Testing

```bash
npm install   # once, for the DOM tests
node --test
```

Four suites:

- **`test/game-engine.test.js`** — the pure helpers `DetectiveGame` exposes
  (`randInt`/`choice`/`shuffle`/`fmt`) for question generators to reuse.
- **`test/generators.test.js`** — property tests over every question
  generator in every game, tens of thousands of draws each. This is where
  the educational content lives, and it's the part that can be wrong
  without *looking* wrong: an ambiguous question, two identical options, or
  an answer marked correct while being arithmetically false all render
  perfectly. Assertions run against the generated questions themselves, so
  they catch faults that show up in a fraction of a percent.
- **`test/dom.test.js`** — the rendering and wiring half, driven through a
  real DOM: focus movement between screens, answer reveal, the
  process-of-elimination toggle, keyboard operation, and the degraded paths
  (unknown question type, a generator that throws, a page missing
  `#badgeNum`).
- **`test/question-modules.test.js`** — the wiring rather than the
  content: that each page loads exactly one question module, that the
  module sits under `assets/js/` where the tests can import it, that the
  page runs everything through one inline `type="module"` script whose
  imports Vite bundles, that `start()` is called with the config that
  script imports, and that importing a module has no side effects.

Both dependencies (`vite`, `jsdom`) are dev-only — **no library code
ships**; the deployed site is this repo's own HTML/CSS/JS, bundled. The
tests run against the sources directly, no build needed first, and
`test/dom.test.js` skips itself when jsdom is missing, so `node --test`
still works on a fresh clone with no install; you just get the other three
suites. CI installs it so the DOM half always runs, then builds, so a
change that breaks `vite build` fails before merge.

Layout and visual appearance still aren't covered — check those by hand in
a browser via `npm run dev`.

## Deployment

Hosted on Cloudflare (Workers with static assets), deployed automatically
on push to `main`. What gets deployed is **`dist/`, the output of
`npm run build`** — `wrangler.jsonc` points at it, and its `build.command`
makes wrangler run that build itself before `deploy`/`versions upload`, so
the deploy cannot see a stale or missing `dist/` no matter what invokes it.
The only prerequisite is installed dependencies, which Workers Builds'
automatic `npm clean-install` step already covers.

- `wrangler.jsonc` — deploy config (asset directory, clean-URL handling)
- `public/` — files the build copies into `dist/` verbatim: `_headers`
  (Cache-Control rules Cloudflare applies per path) and the og:image,
  which needs a stable URL because social scrapers cache by URL

Everything under `/assets/` is cached for a year as `immutable`, which is
safe because Vite content-hashes every filename it emits there
(`game-engine-D41xyz.js`): changed bytes mean a changed URL, by
construction. The hashed URL lives in the HTML, which expires in 300s, so
visitors pick up an asset change within five minutes of a deploy. This
replaces the hand-bumped `?v=N` token every asset URL used to carry, the
CI script that policed it, and the fonts' filename-versioning exemption —
the preload `href` and the `url()` in `base.css` now match because the
bundler rewrites both from the same source file.

## Project structure

```
index.html                       Homepage — the game catalog (GAMES_DATA/
                                  SUBJECTS) and its own layout CSS live
                                  inline (fewer render-blocking requests);
                                  base.css stays linked since it's shared
vite.config.mjs                  Build config: every page is a Rollup input
                                  (discovered by scanning games/), plus the
                                  cleanUrls() dev/preview plugin
public/                          Copied into dist/ verbatim by the build:
                                  _headers and the stable-URL og:image
scripts/
  subset-fonts.sh                Regenerates assets/fonts/ (run by hand, not
                                  a build step — see assets/fonts/LICENSE.md)
test-support/
  load-game.js                   Imports a game page's own modules for tests,
                                  and bundles each page to a classic script
                                  for jsdom (which does not run module
                                  scripts). Outside test/ because `node --test`
                                  globs everything under it, and a helper is
                                  not a test
test/
  game-engine.test.js            Pure helpers
  generators.test.js             Property tests over every question generator
  dom.test.js                    Rendering + wiring, via jsdom (see "Testing")
  question-modules.test.js       How each page wires up its modules
assets/
  css/                           Each game page links ONE sheet — its subject
                                  sheet — and that sheet @imports the rest of
                                  its chain (subject -> game.css -> base.css),
                                  which is what fixes the cascade order in the
                                  bundled output
    base.css                     Shared tokens (colors, reset) + per-subject
                                  theme, and the @font-face blocks
    game.css                     Shared game shell (masthead, cards, summary,
                                  and the subject-neutral question types)
                                  used by every game page; imports base.css
    numeration.css               Math-only question styles (digit boxes,
                                  Number A/B cards, order tiles, </>/=)
    ela.css                      ELA-only question styles (reading passages,
                                  the retelling list, prefix/suffix display)
    word-problems.css            Word-problem styles shared by both word-
                                  problem pages (prompt lead, context table,
                                  equation line) plus the strip/bar-model
                                  diagrams the Missing Evidence Files draws
    ledger.css                   Ledger Files question styles (typed answer,
                                  chip groups, and the miniature strip
                                  diagrams that sit inside option buttons)
    social-studies.css           Social-studies-only question styles (the
                                  field-note box a question is asked about)
  fonts/                         Self-hosted woff2 + their licenses; see
                                  fonts/LICENSE.md
  js/
    game-engine.js                Shared game engine (home/play/trail screens,
                                  click-wiring, and the three subject-neutral
                                  question types)
    question-kit.js               Helpers every pool-driven game needs: drawing
                                  items without replacement, and assembling an
                                  MCQ from a fixed pool or from authored options
    numeration-types.js           The math game's place-value question types
                                  and their digit renderers, registered via
                                  DetectiveGame.registerType
    numeration-questions.js       Numbers Division: generators + MODES
    word-problems-questions.js    Missing Evidence Files: multi-step word
                                  problems on the engine's built-in
                                  mcq-simple type, so no matching *-types.js
    ledger-types.js               The Ledger Files' two question types: an
                                  answer the kid types, and a statement
                                  completed from two groups of chips
    ledger-questions.js           Ledger Files: generators + MODES
    words-questions.js            Words Division: passages, pools, generators
                                  + MODES
    kitoto-questions.js           The Kitoto Files: the Module 1 Lessons 11-15
                                  skills, drilled on the folktale itself
    texas-questions.js            The Lone Star Files: Texas regions, and
                                  adapting vs modifying the environment. All
                                  six export the config start() takes; the
                                  page calls start()
games/
  math/numeration-detective-agency.html
  math/missing-evidence-files.html
  math/ledger-files.html
  ela/words-division.html
  ela/kitoto-files.html
  social-studies/lone-star-files.html
```

## Adding a new game

1. Drop the new game's HTML file into `games/<subject>/`.
2. Link ONE stylesheet — your subject's sheet (ELA has `ela.css` for
   reading passages, math has `numeration.css` for its place-value widgets,
   `word-problems.css` for word-problem furniture and strip diagrams, and
   `ledger.css` for typed answers and chip groups). Each subject sheet
   `@import`s `game.css`, which imports `base.css`, so that single link
   carries the whole chain in the right cascade order; a new subject sheet
   starts with `@import './game.css';`. Set
   `data-theme="math" | "ela" | "social-studies"` on the `<html>` tag to
   pick up that subject's accent color. The page also needs a
   `<div id="app">` for the engine to render into, and an element with
   `id="badgeNum"` for the closed-case counter. Copying an existing game
   page gets all of this right.
3. Put the game's content — its question generators and a `MODES` array
   (`{id, caseNo, title, icon, blurb, gen}` per case) — in its own module
   under `assets/js/`, not inline in the page. Two reasons: Vite bundles it
   into a content-hashed file served `immutable` for a year, where the
   page's HTML expires in 300s, and the content is the overwhelming
   majority of a game's bytes; and a module can be imported by the tests
   directly. These are plain ES modules: import what you use
   (`import DetectiveGame from './game-engine.js'`) and end with
   `export default MY_QUESTIONS;`.

   The module *exports* the config rather than starting the game, so that
   importing it has no side effects. The page then calls:

   ```js
   DetectiveGame.start({
     modes: MODES,
     homeIntro: '...',
     trailAllFilesWord: '...',
     questionsPerCase: 8,      // optional, defaults to 8
     onCaseStart: fn           // optional, fires when a case or the trail starts
   });
   ```

   `DetectiveGame` also exposes `randInt`, `choice`, `shuffle`, and `fmt`
   for generators to reuse.

   Each generator returns a question object whose `type` names a registered
   renderer. Three ship with the engine because they aren't tied to a
   subject: `mcq-simple`, `multiselect` and `true-false`. Anything else is
   registered by the page that needs it —

   ```js
   DetectiveGame.registerType('my-type', {
     build: function(q, ui){ return ui.options(q.options); },
     wire:  function(q, onAnswered, ui){ /* ... */ }
   });
   ```

   — before `start()` runs. `assets/js/numeration-types.js` is the worked
   example: it registers the four place-value widgets the math game uses, so
   an ELA or history game never loads renderers built for numbers.
   `assets/js/ledger-types.js` is the smaller one: the typed answer and the
   chip groups the Ledger Files needs, and nothing else loads them.

   If your cases draw from fixed item pools rather than generating fresh
   content each time, `import QUESTION_KIT from './question-kit.js'` in
   your module and build your pools with `QUESTION_KIT.drawers({...})`.
   That deals items without replacement; hand its `resetAll` to `onCaseStart`
   and keep `questionsPerCase` at or below your smallest pool, and a case
   cannot repeat an item at all. All three of the ELA and social studies games
   do this. `question-kit.js` also has `buildOptionsFromPool` (an MCQ over a
   fixed answer vocabulary) and `buildAuthoredOptions` (one correct label plus
   the distractors you wrote for it).

   One thing worth knowing before you shape a question: the no-repeat
   assertion in `test/generators.test.js` compares **prompts**. A case whose
   prompt never changes and varies only its options counts as repeating
   itself — rightly, since that is what a reader sees — so put the thing being
   asked about in the prompt.
4. Wire the page with one inline `type="module"` script: import the
   engine, any type module the game registers (a side-effect import), and
   the question config, then start the game. That single block is what
   Vite bundles into the page's hashed entry chunk — a `<script src>` tag
   or a classic inline script would ship un-bundled and break in
   production, and `test/question-modules.test.js` fails the page that
   tries.

   ```html
   <script type="module">
   import DetectiveGame from '../../assets/js/game-engine.js';
   import '../../assets/js/my-types.js';        // only if the game registers types
   import MY_QUESTIONS from '../../assets/js/my-questions.js';
   DetectiveGame.start(MY_QUESTIONS);
   </script>
   ```

5. Add one entry to the `GAMES_DATA` array inside `index.html`'s own
   `<script>` (near the top, above `render()`) — the homepage rebuilds
   itself from that array automatically.

## License

MIT — see [LICENSE](LICENSE). This is a hobby project shared as-is, with no
warranty and no guarantee it's bug-free; use it at your own risk.
