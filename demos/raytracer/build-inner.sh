#!/usr/bin/env bash
# Runs inside the emscripten/emsdk container. See build.sh.
set -euo pipefail

SRC=/src
OUT=/out
BUILD=/build
TOOLS=/tools
export EM_CACHE=$BUILD/emcache

LIBCONFIG=1.7.3
if [ ! -f "$BUILD/libconfig/lib/.libs/libconfig++.a" ]; then
    cd "$BUILD"
    curl -fsSL -o libconfig.tar.gz \
        "https://github.com/hyperrealm/libconfig/releases/download/v$LIBCONFIG/libconfig-$LIBCONFIG.tar.gz"
    rm -rf libconfig && mkdir libconfig
    tar -xzf libconfig.tar.gz --strip-components=1 -C libconfig
    cd libconfig
    # libconfig++ catches its own exceptions internally (lookupValue), so it needs
    # exception support just like the raytracer itself.
    emconfigure ./configure --disable-shared --disable-examples --disable-tests \
        CFLAGS="-O2" CXXFLAGS="-O2 -fexceptions" >/dev/null
    emmake make -C lib -j"$(nproc)" >/dev/null
fi

INCLUDES=(
    -I"$TOOLS/shim"
    -I"$BUILD/libconfig/lib"
    -I"$SRC/project/includes/core" -I"$SRC/project/includes/core/reader"
    -I"$SRC/project/includes/core/reader/cfgReader" -I"$SRC/project/includes/core/reader/libld"
    -I"$SRC/project/includes/render"
    -I"$SRC/shared" -I"$SRC/shared/LIght" -I"$SRC/shared/Object" -I"$SRC/shared/Texture"
    -I"$SRC/shared/math" -I"$SRC/shared/Error" -I"$SRC/shared/printer"
)
FLAGS=(-std=c++20 -O2 -fexceptions)

mkdir -p "$BUILD/obj"
cd "$BUILD/obj"

# Every plugin exports the same symbol names, which is fine for separate .so files
# but not for one module: prefix them per plugin at compile time.
plugin() { # <name> <source>
    em++ "${FLAGS[@]}" "${INCLUDES[@]}" \
        -DgetSOType="$1_getSOType" -DgetObject="$1_getObject" -DgetLight="$1_getLight" \
        -c "$SRC/plugins/$2" -o "plugin_$1.o"
}
plugin sphere spheres/Sphere.cpp
plugin plane planes/Plane.cpp
plugin cylinder cylinders/Cylinder.cpp
plugin triangle triangles/Triangle.cpp
plugin ambient ambient/AmbientLight.cpp
plugin directional directional/DirectionalLight.cpp
plugin point point/PointLight.cpp

for unit in project/src/render/Renderer.cpp project/src/render/Camera.cpp project/src/core/Readers/CfgReader.cpp; do
    em++ "${FLAGS[@]}" "${INCLUDES[@]}" -c "$SRC/$unit" -o "$(basename "$unit" .cpp).o"
done
em++ "${FLAGS[@]}" "${INCLUDES[@]}" -c "$TOOLS/wasm_entry.cpp" -o wasm_entry.o

em++ "${FLAGS[@]}" ./*.o "$BUILD/libconfig/lib/.libs/libconfig++.a" \
    -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=worker \
    -sALLOW_MEMORY_GROWTH=1 \
    -sEXPORTED_FUNCTIONS=_malloc,_free \
    -sEXPORTED_RUNTIME_METHODS=cwrap,HEAPU8,UTF8ToString \
    -o "$OUT/raytracer.mjs"

ls -l "$OUT"
