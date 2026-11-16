// WebAssembly entry point for the raytracer demo.
//
// Uses the project's own scene reader, renderer and plugins. Only the parts that
// cannot exist in a browser are left out: the SFML window, the client/server
// managers and the thread pool. Rows are rendered on request so the page can
// show progress.

#include <cstring>
#include <fstream>
#include <memory>
#include <string>
#include <vector>

#include <emscripten/emscripten.h>

#include "Camera.hpp"
#include "CfgReader.hpp"
#include "ILight.hpp"
#include "IObject.hpp"
#include "Renderer.hpp"
#include "SoType.hpp"
#include "Tile.hpp"

using Params = std::map<std::string, std::string>;

// ---------------------------------------------------------------------------
// Statically linked plugins. Each plugin is compiled with its entry symbols
// prefixed (see build-inner.sh), e.g. getObject -> sphere_getObject.
// ---------------------------------------------------------------------------

#define OBJECT_PLUGIN(name)                          \
    extern "C" raytracer::SoTypeEnum name##_getSOType(); \
    extern "C" raytracer::IObject *name##_getObject(Params);
#define LIGHT_PLUGIN(name)                           \
    extern "C" raytracer::SoTypeEnum name##_getSOType(); \
    extern "C" raytracer::ILight *name##_getLight(Params);

OBJECT_PLUGIN(sphere)
OBJECT_PLUGIN(plane)
OBJECT_PLUGIN(cylinder)
OBJECT_PLUGIN(triangle)
LIGHT_PLUGIN(ambient)
LIGHT_PLUGIN(directional)
LIGHT_PLUGIN(point)

namespace {

struct Plugin {
    const char *file;
    void *soType;
    void *factory;
    const char *factoryName;
};

#define OBJECT_ENTRY(name) \
    {"plugins/raytracer_" #name ".so", (void *)&name##_getSOType, (void *)&name##_getObject, "getObject"}
#define LIGHT_ENTRY(name) \
    {"plugins/raytracer_" #name ".so", (void *)&name##_getSOType, (void *)&name##_getLight, "getLight"}

const Plugin plugins[] = {
    OBJECT_ENTRY(sphere),   OBJECT_ENTRY(plane), OBJECT_ENTRY(cylinder), OBJECT_ENTRY(triangle),
    LIGHT_ENTRY(ambient),   LIGHT_ENTRY(directional), LIGHT_ENTRY(point),
};

char noError[] = "";
bool lookupFailed = false;

}  // namespace

extern "C" {

void *rt_dlopen(const char *path, int)
{
    for (const Plugin &plugin : plugins)
        if (std::strcmp(plugin.file, path) == 0)
            return const_cast<Plugin *>(&plugin);
    return nullptr;
}

void *rt_dlsym(void *handle, const char *symbol)
{
    const Plugin *plugin = static_cast<const Plugin *>(handle);
    lookupFailed = false;
    if (std::strcmp(symbol, "getSOType") == 0)
        return plugin->soType;
    if (std::strcmp(symbol, plugin->factoryName) == 0)
        return plugin->factory;
    lookupFailed = true;
    return nullptr;
}

int rt_dlclose(void *)
{
    return 0;
}

char *rt_dlerror(void)
{
    static char message[] = "symbol not found";
    if (!lookupFailed)
        return nullptr;
    lookupFailed = false;
    return message;
}

}  // extern "C"

// ---------------------------------------------------------------------------
// Scene state and the functions called from JavaScript.
// ---------------------------------------------------------------------------

namespace {

std::unique_ptr<raytracer::CfgReader> reader;
std::vector<std::unique_ptr<raytracer::IObject>> objects;
std::vector<std::unique_ptr<raytracer::ILight>> lights;
raytracer::render::Camera camera;
raytracer::threading::Renderer renderer;
std::string lastError;

}  // namespace

extern "C" {

// Parses a scene. width/height of 0 keep the resolution written in the scene.
// Returns 1 on success, 0 on failure (see rt_error).
EMSCRIPTEN_KEEPALIVE int rt_load(const char *scene, int width, int height)
{
    lastError.clear();
    objects.clear();
    lights.clear();
    reader.reset();
    try {
        {
            std::ofstream file("/scene.cfg", std::ios::trunc);
            file << scene;
        }
        reader = std::make_unique<raytracer::CfgReader>("/scene.cfg");
        std::pair<std::size_t, std::size_t> size = reader->GetCameraResolution();
        if (width > 0 && height > 0)
            size = {static_cast<std::size_t>(width), static_cast<std::size_t>(height)};
        camera = raytracer::render::Camera(
            reader->GetCameraPosition(), reader->GetCameraRotation(), size, reader->GetCameraFieldOfView());
        objects = reader->GetObjects();
        lights = reader->GetLights();
    } catch (const std::exception &e) {
        lastError = e.what();
        return 0;
    }
    return 1;
}

EMSCRIPTEN_KEEPALIVE const char *rt_error()
{
    return lastError.c_str();
}

EMSCRIPTEN_KEEPALIVE int rt_width()
{
    return static_cast<int>(camera.resolution.first);
}

EMSCRIPTEN_KEEPALIVE int rt_height()
{
    return static_cast<int>(camera.resolution.second);
}

EMSCRIPTEN_KEEPALIVE int rt_object_count()
{
    return static_cast<int>(objects.size());
}

EMSCRIPTEN_KEEPALIVE int rt_light_count()
{
    return static_cast<int>(lights.size());
}

// Renders rows [y0, y1) into an RGBA buffer of width * (y1 - y0) pixels.
EMSCRIPTEN_KEEPALIVE void rt_render_rows(int y0, int y1, unsigned char *rgba)
{
    const std::size_t width = camera.resolution.first;
    raytracer::Tile tile({0, 0, 0});

    for (int y = y0; y < y1; ++y) {
        for (std::size_t x = 0; x < width; ++x) {
            renderer.ComputePixel(objects, lights, camera, tile, x, static_cast<std::size_t>(y), width);
            *rgba++ = static_cast<unsigned char>(tile.GetRed());
            *rgba++ = static_cast<unsigned char>(tile.GetGreen());
            *rgba++ = static_cast<unsigned char>(tile.GetBlue());
            *rgba++ = 255;
        }
    }
}

}  // extern "C"
