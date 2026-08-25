# The Study Detective Agency

**Live at [studydetectiveagency.com](https://studydetectiveagency.com/)**

A small, static website of browser-based study games for 4th grade, themed
as detective "case files." Built to give my kid another way to
practice — no build step, no backend, no accounts, just HTML/CSS/JS.

Live divisions:
- **Numbers Division** (math) — place value, expanded form, comparing,
  ordering, rounding.
- **Words Division** (ELA) — author's purpose, central message, figurative
  language, text formatting clues.
- **History Division** (social studies) — coming soon.

## Running it locally

The deployed site itself needs no build step, but local tooling (the dev
server, the test suite) runs on Node. This repo pins Node 24 via
[mise](https://mise.jdx.dev) in `mise.toml`; with mise installed, `cd`
into the repo and it picks up the right version automatically.

```bash
node scripts/dev-server.js
```

Then open `http://localhost:8000/`. This isn't a generic static file
server — the site is deployed on Cloudflare with clean URLs
(`/games/math/foo`, no `.html`), so this script mimics that resolution
locally too (see the script's docstring). Responses are also sent with
no-cache headers, so edits always show up on refresh.

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
  module sits under `/assets/` where the year-long cache actually
  applies, that every script tag carries a `?v=`, that the page starts
  from a global its module assigns, and that requiring a module has no
  side effects.

`jsdom` is the repo's only dependency and is dev-only — **nothing here
ships**, and `.assetsignore` keeps `package.json`, the lockfile and
`node_modules` out of what gets deployed. `test/dom.test.js` skips itself
when jsdom is missing, so `node --test` still works on a fresh clone with
no install; you just get the other three suites. CI installs it so the DOM
half always runs.

Layout and visual appearance still aren't covered — check those by hand in
a browser via `scripts/dev-server.js`.

## Deployment

Hosted on Cloudflare (Workers with static assets), deployed automatically
on push to `main`. A few repo-root files exist only for that and aren't
part of the site itself:

- `wrangler.jsonc` — deploy config (asset directory, clean-URL handling)
- `_headers` — Cache-Control rules Cloudflare applies per path
- `.assetsignore` — repo/tooling files excluded from what gets deployed
  (this repo's `.git`, `README.md`, `scripts/`, `test/`, etc.) —
  `scripts/dev-server.js` reads the same file so local dev matches

Assets are cached for a year as `immutable`, so **every CSS/JS URL carries a
hand-bumped `?v=N`**. Bump it in the same commit as the asset change: the
token lives in the HTML, which expires in 300s, so visitors pick up both
within five minutes. Fonts are exempt (they version by filename) because a
preload `href` has to match the `url()` in `base.css` byte-for-byte.

## Project structure

```
index.html                       Homepage — the game catalog (GAMES_DATA/
                                  SUBJECTS) and its own layout CSS live
                                  inline (fewer render-blocking requests);
                                  base.css stays linked since it's shared
scripts/
  dev-server.js                  Local dev server (see "Running it locally")
  subset-fonts.sh                Regenerates assets/fonts/ (run by hand, not
                                  a build step — see assets/fonts/LICENSE.md)
test-support/
  load-game.js                   Requires a game page's own modules for tests.
                                  Outside test/ because `node --test` globs
                                  everything under it, and a helper is not a
                                  test
test/
  game-engine.test.js            Pure helpers
  generators.test.js             Property tests over every question generator
  dom.test.js                    Rendering + wiring, via jsdom (see "Testing")
  question-modules.test.js       How each page wires up its modules
assets/
  css/
    base.css                     Shared tokens (colors, reset) + per-subject
                                  theme, and the @font-face blocks
    game.css                     Shared game shell (masthead, cards, summary,
                                  and the subject-neutral question types)
                                  used by every game page
    numeration.css               Math-only question styles (digit boxes,
                                  Number A/B cards, order tiles, </>/=)
    ela.css                      ELA-only question styles (reading passages)
  fonts/                         Self-hosted woff2 + their licenses; see
                                  fonts/LICENSE.md
  js/
    game-engine.js                Shared game engine (home/play/trail screens,
                                  click-wiring, and the three subject-neutral
                                  question types)
    numeration-types.js           The math game's place-value question types
                                  and their digit renderers, registered via
                                  DetectiveGame.registerType
    numeration-questions.js       Numbers Division: generators + MODES
    words-questions.js            Words Division: passages, pools, generators
                                  + MODES. Both export the config start()
                                  takes; the page calls start()
games/
  math/numeration-detective-agency.html
  ela/words-division.html
```

## Adding a new game

1. Drop the new game's HTML file into `games/<subject>/`.
2. Link `../../assets/css/base.css`, `../../assets/css/game.css`, and
   `../../assets/js/game-engine.js` in its `<head>`/before its own script,
   and set `data-theme="math" | "ela" | "social-studies"` on the `<html>`
   tag to pick up that subject's accent color. If your subject has its own
   stylesheet — ELA has `ela.css` for reading passages, math has
   `numeration.css` for its place-value widgets — link that too,
   after `game.css`. Copy the `?v=N` on those
   URLs from an existing page — assets are served `immutable`, so that
   token is the only thing that busts a returning visitor's cache (see
   `_headers`). The page also needs a `<div id="app">` for the engine to
   render into, and an element with `id="badgeNum"` for the closed-case
   counter. Copying an existing game page gets all of this right.
3. Put the game's content — its question generators and a `MODES` array
   (`{id, caseNo, title, icon, blurb, gen}` per case) — in its own module
   under `assets/js/`, not inline in the page. Two reasons: `/assets/*` is
   served `immutable` and cached for a year against its `?v=` token, where
   the page's HTML expires in 300s, and the content is the overwhelming
   majority of a game's bytes; and a module can be `require()`d by the
   tests directly. Copy the export footer from an existing questions
   module so it works in both the browser and node.

   The module *returns* the config rather than starting the game, so that
   requiring it has no side effects. The page then calls:

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

   If your cases draw from fixed item pools rather than generating fresh
   content each time, use `onCaseStart` to reshuffle them and keep
   `questionsPerCase` at or below your smallest pool — that's what stops a
   case repeating an item. The ELA game does both.
4. Link that module after the engine (and after any type module), and
   start the game from the global it exports:

   ```html
   <script src="../../assets/js/game-engine.js?v=6"></script>
   <script src="../../assets/js/my-questions.js?v=1"></script>
   <script>DetectiveGame.start(MY_QUESTIONS);</script>
   ```

5. Add one entry to the `GAMES_DATA` array inside `index.html`'s own
   `<script>` (near the top, above `render()`) — the homepage rebuilds
   itself from that array automatically.

## License

MIT — see [LICENSE](LICENSE). This is a hobby project shared as-is, with no
warranty and no guarantee it's bug-free; use it at your own risk.
