#!/usr/bin/env bash
# Build a lesson video. See tools/video/README.md.
#
#   tools/video/make.sh <video-dir>                  narrate (cached) + render + encode -> <video-dir>/build/<name>.mp4
#   tools/video/make.sh <video-dir> preview T1 T2..  stills at those seconds -> <video-dir>/build/preview.png
#   tools/video/make.sh <video-dir> install          copy the MP4 + a poster frame into assets/video/
#
# WORKERS=4 (default) sets how many browser processes render in parallel.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
[ $# -ge 1 ] || { sed -n '2,9p' "$0"; exit 1; }
DIR="$(cd "$1" && pwd)"; shift
NAME="$(basename "$DIR")"
BUILD="$DIR/build"; mkdir -p "$BUILD"
CMD="${1:-video}"; [ $# -gt 0 ] && shift

case "$CMD" in
  preview)
    [ $# -ge 1 ] || { echo "usage: make.sh <video-dir> preview T1 [T2 ...]"; exit 1; }
    python3 "$HERE/pipeline/gen_audio.py" "$DIR"
    rm -rf "$BUILD/preview"; mkdir -p "$BUILD/preview"
    node "$HERE/pipeline/preview.cjs" "$DIR" "$BUILD/preview" "$@"
    cols=$(( $# < 4 ? $# : 4 ))
    ffmpeg -v error -y -pattern_type glob -i "$BUILD/preview/f_*.png" \
      -vf "scale=640:360,tile=${cols}x$(( ($# + cols - 1) / cols )):padding=6:color=black" -frames:v 1 "$BUILD/preview.png"
    echo "preview: $BUILD/preview.png"
    ;;

  video)
    python3 "$HERE/pipeline/gen_audio.py" "$DIR"
    node "$HERE/pipeline/meta.cjs" "$DIR"
    python3 "$HERE/pipeline/sfx.py" "$DIR"
    frames=$(python3 -c "import json,math;m=json.load(open('$BUILD/meta.json'));print(math.ceil(m['dur']*m['fps']))")
    workers="${WORKERS:-4}"
    per=$(( (frames + workers - 1) / workers ))
    rm -f "$BUILD"/seg*.mp4 "$BUILD/segs.txt"
    start=$(date +%s); pids=()
    for (( i = 0; i < workers; i++ )); do
      from=$(( i * per )); to=$(( (i + 1) * per < frames ? (i + 1) * per : frames ))
      [ "$from" -lt "$to" ] || continue
      node "$HERE/pipeline/render.cjs" "$DIR" "$from" "$to" "$BUILD/seg$i.mp4" & pids+=($!)
      echo "file 'seg$i.mp4'" >> "$BUILD/segs.txt"
    done
    for p in "${pids[@]}"; do wait "$p"; done
    echo "rendered $frames frames in $(( $(date +%s) - start ))s"
    # One final encode: flat cartoon art compresses well with -tune animation,
    # which keeps a 5-7 minute video near 18 MB (Cloudflare's limit is 25 MiB per file).
    ffmpeg -v error -y -f concat -safe 0 -i "$BUILD/segs.txt" -i "$BUILD/mix.wav" -map 0:v -map 1:a \
      -c:v libx264 -preset slow -crf 24 -tune animation -pix_fmt yuv420p -c:a aac -b:a 128k \
      -shortest -movflags +faststart "$BUILD/$NAME.mp4"
    rm -f "$BUILD"/seg*.mp4
    ls -lh "$BUILD/$NAME.mp4" | awk '{print "video: " $NF " (" $5 ")"}'
    ;;

  install)
    [ -f "$BUILD/$NAME.mp4" ] || { echo "no $BUILD/$NAME.mp4 yet; run make.sh $DIR first"; exit 1; }
    poster_at=$(python3 -c "import importlib.util as u;s=u.spec_from_file_location('l','$DIR/lines.py');m=u.module_from_spec(s);s.loader.exec_module(m);print(getattr(m,'POSTER_AT',5))")
    mkdir -p "$REPO/assets/video"
    cp "$BUILD/$NAME.mp4" "$REPO/assets/video/$NAME.mp4"
    ffmpeg -v error -y -ss "$poster_at" -i "$BUILD/$NAME.mp4" -frames:v 1 -q:v 4 "$REPO/assets/video/$NAME-poster.jpg"
    echo "installed assets/video/$NAME.mp4 and $NAME-poster.jpg"
    ;;

  *) echo "unknown command: $CMD (preview | install, or none for the full video)"; exit 1 ;;
esac
