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

No build tools required. From the project root:

```bash
python3 scripts/dev-server.py
```

Then open `http://localhost:8000/`. This isn't plain `http.server` — the
site is deployed on Cloudflare with clean URLs (`/games/math/foo`, no
`.html`), so this script mimics that resolution locally too (see the
script's docstring). Responses are also sent with no-cache headers, so
edits always show up on refresh.

## Testing

The site itself needs no build tools, but the test suite runs on Node
(`test/*.test.js`, using Node's built-in test runner — no dependencies to
install). This repo pins Node 24 via [mise](https://mise.jdx.dev) in
`mise.toml`; with mise installed, `cd` into the repo and it picks up the
right version automatically.

```bash
node --test
```

Coverage is intentionally narrow: the pure helpers `DetectiveGame` exposes
(`randInt`/`choice`/`shuffle`/`fmt`) for question generators to reuse. The
rendering/DOM-wiring half of the engine isn't unit tested — verify that by
hand in a browser via `scripts/dev-server.py`.

## Deployment

Hosted on Cloudflare (Workers with static assets), deployed automatically
on push to `main`. A few repo-root files exist only for that and aren't
part of the site itself:

- `wrangler.jsonc` — deploy config (asset directory, clean-URL handling)
- `_headers` — Cache-Control rules Cloudflare applies per path
- `.assetsignore` — repo/tooling files excluded from what gets deployed
  (this repo's `.git`, `README.md`, etc.) — `scripts/dev-server.py` reads
  the same file so local dev matches

## Project structure

```
index.html                       Homepage — the game catalog (GAMES_DATA/
                                  SUBJECTS) and its own layout CSS live
                                  inline (fewer render-blocking requests);
                                  base.css stays linked since it's shared
scripts/
  dev-server.py                  Local dev server (see "Running it locally")
test/
  game-engine.test.js            node --test coverage (see "Testing")
assets/
  css/
    base.css                     Shared tokens (colors, reset) + per-subject theme
    game.css                     Shared game shell (masthead, cards, question
                                  types, summary) used by every game page
    ela.css                      ELA-only question styles (reading passages)
  js/
    game-engine.js                Shared game engine (home/play/trail screens,
                                  every question-type renderer, click-wiring)
games/
  math/numeration-detective-agency.html
  ela/words-division.html
```

## Adding a new game

1. Drop the new game's HTML file into `games/<subject>/`.
2. Link `../../assets/css/base.css`, `../../assets/css/game.css`, and
   `../../assets/js/game-engine.js` in its `<head>`/before its own script,
   and set `data-theme="math" | "ela" | "social-studies"` on the `<html>`
   tag to pick up that subject's accent color.
3. In the page's own inline script, define your question generators and a
   `MODES` array (`{id, caseNo, title, icon, blurb, gen}` per case), then
   call `DetectiveGame.start({ modes: MODES, homeIntro: '...',
   trailAllFilesWord: '...' })`. `DetectiveGame` also exposes `randInt`,
   `choice`, `shuffle`, and `fmt` for generators to reuse.
4. Add one entry to the `GAMES_DATA` array inside `index.html`'s own
   `<script>` (near the top, above `render()`) — the homepage rebuilds
   itself from that array automatically.

## License

MIT — see [LICENSE](LICENSE). This is a hobby project shared as-is, with no
warranty and no guarantee it's bug-free; use it at your own risk.
