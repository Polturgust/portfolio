#!/usr/bin/env bash
# Builds the my-shell demo: a small Linux guest that boots straight into 42sh.
#
#   ./demos/myshell/build.sh [path-to-my-shell-checkout]
#
# Needs Docker. Output: public/demos/myshell/{bzImage,initramfs.cpio.gz}.
set -euo pipefail

COMMIT=c128b38
IMAGE=i386/alpine:3.20

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
OUT="$ROOT/public/demos/myshell"
mkdir -p "$OUT"

SRC="${1:-}"
if [ -z "$SRC" ]; then
    SRC="$ROOT/.cache/my-shell"
    [ -d "$SRC/.git" ] || git clone https://github.com/Polturgust/my-shell.git "$SRC"
    git -C "$SRC" fetch --quiet origin
    git -C "$SRC" checkout --quiet "$COMMIT"
fi

docker run --rm --platform linux/386 \
    -v "$(cd "$SRC" && pwd)":/src:ro \
    -v "$HERE":/tools:ro \
    -v "$OUT":/out \
    "$IMAGE" sh /tools/build-inner.sh
