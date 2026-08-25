# Fonts

Subset `woff2` files, derived from the `latin` subsets Google Fonts serves.
Two changes from what Google hands you, for two different reasons:

**Self-hosted**, so the critical rendering path doesn't cross an origin
boundary — see the comment above the `@font-face` blocks in `../css/base.css`.

**Subset further**, because Google's `latin` files carry ~215–230 glyphs each
and this site is English 4th-grade content. Trimming to ASCII + Latin-1 (the
accents, so any Spanish that shows up still renders) + the handful of
typographic marks actually used takes all three from 119 KB to 83 KB — a 30%
cut, and the largest single asset saving available on this site.

| File | Family | Axis | Glyphs | Size | License |
|---|---|---|---|---|---|
| `baloo2-latin1.woff2` | Baloo 2 | variable, `wght` 400–800 | 170 | 17.6 KB | [OFL 1.1](Baloo2-OFL.txt) |
| `roboto-mono-latin1.woff2` | Roboto Mono | variable, `wght` 100–700 | 170 | 24.1 KB | [OFL 1.1](RobotoMono-OFL.txt) |
| `special-elite-latin1.woff2` | Special Elite | static, 400 | 170 | 39.5 KB | [Apache 2.0](SpecialElite-Apache-2.0.txt) |

Arrows (`←` `→`), checkmarks (`✓`) and ballot boxes (`☐` `☑`) are deliberately
absent: none of these three faces ever contained them, so they already fall
back to a system font and subsetting changed nothing about how they render.

## Regenerating

`../../scripts/subset-fonts.sh` — run by hand, not part of any build. It
documents the exact unicode ranges and where to re-download the full latin
sources. After running it, check that the `unicode-range` declarations in
`../css/base.css` still match what the script asks for.

## Renaming is mandatory when the contents change

These are served `immutable` for a year with **no `?v=` cache-buster**, because
a page's preload `href` has to match `base.css`'s `url()` byte-for-byte or the
browser fetches the file twice. So they version by *filename*: if you change
what a file contains, rename it and update `../css/base.css` plus the preload
`href` in all three pages. Overwriting in place would strand returning visitors
on the old file for up to a year.
