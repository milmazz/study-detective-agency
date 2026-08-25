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
index.html                       Homepage — reads assets/games-data.js
assets/
  games-data.js                  Single source of truth for the game catalog
  css/
    base.css                     Shared tokens (colors, reset) + per-subject theme
    site.css                     Homepage-only styles
    game.css                     Shared game shell (masthead, cards, question
                                  types, summary) used by every game page
    ela.css                      ELA-only question styles (reading passages)
games/
  math/numeration-detective-agency.html
  ela/words-division.html
```

## Adding a new game

1. Drop the new game's HTML file into `games/<subject>/`.
2. Link `../../assets/css/base.css` and `../../assets/css/game.css` in its
   `<head>`, and set `data-theme="math" | "ela" | "social-studies"` on the
   `<html>` tag to pick up that subject's accent color.
3. Add one entry to `window.GAMES_DATA` in `assets/games-data.js` — the
   homepage rebuilds itself from that file automatically.

## License

MIT — see [LICENSE](LICENSE). This is a hobby project shared as-is, with no
warranty and no guarantee it's bug-free; use it at your own risk.
