#!/bin/sh
# Re-generate the subset webfonts in assets/fonts/.
#
# This is NOT a build step — the site still deploys straight from the repo
# with no toolchain. Run this by hand only when you change fonts or need a
# character the current subset doesn't cover, then commit the output.
#
# Google's "latin" subsets carry ~215-230 glyphs each. This site is English
# 4th-grade content, so most of that is dead weight: subsetting to ASCII +
# Latin-1 (accents, for any Spanish that shows up) + the handful of typographic
# marks actually used cuts these two from 86 KB to 58 KB.
#
# Monospace is deliberately absent: it's a system stack (--mono in base.css),
# not a webfont.
#
# Fonts are served immutable with no ?v= cache-buster, so if you change what
# these files CONTAIN you must also change their FILENAME, and update both
# base.css's url() and the preload href in every page's <head> to match.
#
# Requires fonttools + brotli, which is why this lives outside the site:
#   python3 -m venv /tmp/fontenv && /tmp/fontenv/bin/pip install fonttools brotli
#   PYFTSUBSET=/tmp/fontenv/bin/pyftsubset ./scripts/subset-fonts.sh <src-dir>
#
# <src-dir> holds the full latin woff2 files as downloaded from Google Fonts
# (the URLs are in the comment above each @font-face block in base.css).

set -eu
PYFTSUBSET="${PYFTSUBSET:-pyftsubset}"
SRC="${1:?usage: subset-fonts.sh <dir-with-full-latin-woff2>}"
OUT="$(dirname "$0")/../assets/fonts"

# Printable ASCII, plus:
#   00A0 nbsp   00A1 ¡   00BF ¿   00C0-00FF accented latin (á é í ó ú ñ ü ...)
#   00B7 ·      00D7 ×   00F7 ÷    <- rendered by the site today
#   2013/2014 en+em dash   2018/2019/201C/201D smart quotes   2026 ellipsis
# Arrows, checkmarks and ballot boxes are deliberately absent: none of these
# three faces ever contained them, so they already fall back to a system font.
UNICODES="U+0020-007E,U+00A0,U+00A1,U+00B7,U+00BF,U+00D7,U+00F7,U+00C0-00FF,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026"

for pair in "baloo2:baloo2-latin1" "special-elite:special-elite-latin1"; do
  src="${pair%%:*}"; dst="${pair#*:}"
  "$PYFTSUBSET" "$SRC/$src.woff2" \
    --unicodes="$UNICODES" \
    --layout-features="" \
    --flavor=woff2 \
    --output-file="$OUT/$dst.woff2"
  printf '%-28s %6s B -> %6s B\n' "$dst.woff2" \
    "$(wc -c < "$SRC/$src.woff2" | tr -d ' ')" "$(wc -c < "$OUT/$dst.woff2" | tr -d ' ')"
done
