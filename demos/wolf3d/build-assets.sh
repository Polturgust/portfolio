#!/usr/bin/env bash
# Converts the Wolf3D assets (textures, sounds, font) for the browser demo.
# The story intro is not part of the web demo, so its images are left out.
#
#   ./demos/wolf3d/build-assets.sh [path-to-Wolf3D-checkout]
#
# Needs Docker (Python + Pillow + fonttools, ffmpeg). Output: public/demos/wolf3d/.
set -euo pipefail

COMMIT=3bef333
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
OUT="$ROOT/public/demos/wolf3d"
SRC="${1:-}"
if [ -z "$SRC" ]; then
    SRC="$ROOT/.cache/Wolf3D"
    [ -d "$SRC/.git" ] || git clone https://github.com/Polturgust/Wolf3D.git "$SRC"
    git -C "$SRC" checkout --quiet "$COMMIT"
fi
rm -rf "$OUT" && mkdir -p "$OUT/tex" "$OUT/sounds"

docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp \
    -v "$(cd "$SRC" && pwd)":/src:ro -v "$HERE":/tools:ro -v "$OUT":/out \
    python:3.12-slim bash -c '
        pip install -q --no-warn-script-location pillow fonttools >/dev/null 2>&1
        python3 /tools/convert_images.py /src/src/assets /out
        python3 -m fontTools.subset /src/src/assets/fonts/arcade.ttf \
            --unicodes="U+0020-007E,U+00A0-00FF,U+2190-2193,U+21A9,U+21B9" \
            --output-file=/out/arcade.ttf
    '
for f in story_back_closed story_back_open diag_box; do rm -f "$OUT/tex/$f.webp"; done
for f in "$SRC"/src/assets/sounds/*.mp3; do
    name=$(basename "$f")
    case "$name" in
        music.mp3|menu_music.mp3) rate=64k ;;
        *) rate=96k ;;
    esac
    ffmpeg -v error -y -i "$f" -ac 1 -b:a "$rate" "$OUT/sounds/$name"
done
echo "Assets from github.com/Polturgust/Wolf3D (commit $COMMIT), converted for the web." > "$OUT/SOURCE.txt"
du -sh "$OUT"
