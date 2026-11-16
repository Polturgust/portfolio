// Stand-in for <dlfcn.h> in the WebAssembly build.
//
// The native raytracer loads every shape and light from plugins/raytracer_<name>.so
// with dlopen(). A static web page has no shared objects to open, so the same
// plugins are linked into the module and looked up by name here instead.
// The loader (libld.hpp) is compiled unchanged against this header.
#pragma once

#define RTLD_LAZY 1

#define dlopen rt_dlopen
#define dlsym rt_dlsym
#define dlclose rt_dlclose
#define dlerror rt_dlerror

extern "C" {
void *rt_dlopen(const char *path, int mode);
void *rt_dlsym(void *handle, const char *symbol);
int rt_dlclose(void *handle);
char *rt_dlerror(void);
}
