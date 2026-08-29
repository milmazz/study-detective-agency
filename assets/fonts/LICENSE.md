# Fonts

Subset `woff2` files, derived from the `latin` subsets Google Fonts serves.
Two changes from what Google hands you, for two different reasons:

**Self-hosted**, so the critical rendering path doesn't cross an origin
boundary — see the comment above the `@font-face` blocks in `../css/base.css`.

**Subset further**, because Google's `latin` files carry ~215–230 glyphs each
and this site is English 4th-grade content. Trimming to ASCII + Latin-1 (the
accents, so any Spanish that shows up still renders) + the handful of
typographic marks actually used takes these two from 86 KB to 58 KB.

There is deliberately no monospace webfont here. That was Roboto Mono, 24.7 KB
subset, used for digits, pills and a few small labels — places where a system
mono is visually near-indistinguishable at these sizes. It is now the `--mono`
stack in `../css/base.css`, which downloads nothing.

| File | Family | Axis | Glyphs | Size | License |
|---|---|---|---|---|---|
| `baloo2-latin1.woff2` | Baloo 2 | variable, `wght` 400–800 | 170 | 17.6 KB | [OFL 1.1](Baloo2-OFL.txt) |
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

These are served `immutable` for a year. The build (Vite) content-hashes the
emitted filename and rewrites both `base.css`'s `url()` and every page's
preload `href` from the same source file, so cache-busting is automatic and
the two can't drift.

The *source* filename still encodes the subset: if you change what a file
contains, rename it and
update `../css/base.css` plus the preload `href` in all three pages.
Overwriting in place would strand returning visitors on the old file for up to a
year.
