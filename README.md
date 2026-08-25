# The Study Detective Agency

A small, static website of browser-based study games for 4th grade, themed
as detective "case files." Built to give my daughter another way to
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
python3 -m http.server 8000
```

Then open `http://localhost:8000/index.html`. Opening `index.html` directly
from disk also works for browsing, but a local server avoids any
same-origin quirks.

## Project structure

```
index.html                       Homepage — the game catalog (GAMES_DATA/
                                  SUBJECTS) and its own layout CSS live
                                  inline (fewer render-blocking requests);
                                  base.css stays linked since it's shared
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
