#!/usr/bin/env bash
# Builds the raytracer demo: the original C++ compiled to WebAssembly.
#
#   ./demos/raytracer/build.sh [path-to-Raytracer-checkout]
#
# Needs Docker. Without an argument the Raytracer repository is cloned at the
# commit the demo was last built from. Output goes to public/demos/raytracer/.
set -euo pipefail

COMMIT=c4268d7b768d5098080bd181c5506087b670ab71
IMAGE=emscripten/emsdk:3.1.74

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
WORK="${RAYTRACER_BUILD_DIR:-$ROOT/.cache/raytracer-wasm}"
mkdir -p "$WORK" "$ROOT/public/demos/raytracer"

SRC="${1:-}"
if [ -z "$SRC" ]; then
    SRC="$WORK/src"
    if [ ! -d "$SRC/.git" ]; then
        git clone https://github.com/Polturgust/Raytracer.git "$SRC"
    fi
    git -C "$SRC" fetch --quiet origin
    git -C "$SRC" checkout --quiet "$COMMIT"
fi

docker run --rm -u "$(id -u):$(id -g)" -e HOME=/build \
    -v "$(cd "$SRC" && pwd)":/src:ro \
    -v "$HERE":/tools:ro \
    -v "$WORK":/build \
    -v "$ROOT/public/demos/raytracer":/out \
    "$IMAGE" bash /tools/build-inner.sh
