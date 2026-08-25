# Fonts

Self-hosted `latin` subsets, downloaded from Google Fonts. Serving them from
this origin instead of `fonts.googleapis.com` removes a third-party origin
from the critical rendering path — see the comment above the `@font-face`
blocks in `../css/base.css`.

These files are unmodified Google Fonts binaries. Each is content-stable under
its filename, so `_headers` caches `/assets/*` as `immutable`; **to update a
font, change the filename** rather than overwriting in place (there is no
`?v=` on font URLs, because the preload `href` in each page's `<head>` has to
match the `url()` in `base.css` byte-for-byte or the file is fetched twice).

| File | Family | Axis | License |
|---|---|---|---|
| `baloo2-latin.woff2` | Baloo 2 | variable, `wght` 400–800 | [OFL 1.1](Baloo2-OFL.txt) |
| `roboto-mono-latin.woff2` | Roboto Mono | variable, `wght` 100–700 | [OFL 1.1](RobotoMono-OFL.txt) |
| `special-elite-latin.woff2` | Special Elite | static, 400 | [Apache 2.0](SpecialElite-Apache-2.0.txt) |

Source URLs are in the comment above each `@font-face` block in
`../css/base.css`. To refresh, request that Google Fonts CSS with a
modern-browser User-Agent and take the block whose `unicode-range` starts
`U+0000-00FF` (the `latin` subset).
