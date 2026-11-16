"""Warm faded Polaroid grade, seeded light leaks, classic white frame.

The grade itself is fixed. Only three things are adjustable per photo, and
they live in a "look" dict: fade, leaks, leak_seed. normalize_look() fills in
defaults and clamps, so callers can pass partial dicts safely.
"""

import math
import random

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps

# ---------------------------------------------------------------------------
# Frame. Real Polaroid 600 card is 88 x 107 mm with a 79 mm square image:
# 4.5 mm borders on the sides and top, 23.5 mm at the bottom.
# ---------------------------------------------------------------------------

PHOTO_SIZE = 2000                 # rendered photo square, in pixels
BORDER_RATIO = 4.5 / 79           # sides and top, relative to the photo
BOTTOM_RATIO = 23.5 / 79
FRAME_COLOR = (255, 255, 255)

JPEG_QUALITY = 95

# ---------------------------------------------------------------------------
# Fixed grade parameters. Tune here.
# ---------------------------------------------------------------------------

SATURATION = 0.86
BLOOM_STRENGTH = 0.12
BLOOM_RADIUS_RATIO = 1 / 120
VIGNETTE_STRENGTH = 0.14
GRAIN_STRENGTH = 0.08
GRAIN_SIGMA = 14

# Control points (input, output) on 0-255, interpolated into per-channel LUTs.
# Blacks are lifted (milky, slightly cyan shadows), midtones get a soft S,
# highlights warm up on R/G while B rolls off.
CURVE_POINTS = {
    "r": [(0, 18), (32, 48), (96, 104), (160, 172), (224, 234), (255, 252)],
    "g": [(0, 20), (32, 48), (96, 101), (160, 168), (224, 230), (255, 248)],
    "b": [(0, 30), (32, 56), (96, 100), (160, 160), (224, 218), (255, 238)],
}

# Every leak carries at least one cool (blue/violet) and one gold blob.
LEAK_COOL = [
    (96, 132, 240), (120, 110, 235), (76, 160, 245), (150, 120, 250), (64, 118, 224),
]
LEAK_GOLD = [
    (255, 206, 92), (250, 224, 140), (246, 188, 64), (255, 232, 170), (255, 180, 60),
]
LEAK_SHAPES = ("streak", "wash", "burst", "wedge", "band")
LEAK_TARGET_PEAK = 205.0   # keeps reroll-to-reroll leak strength comparable

DEFAULT_LOOK = {
    "fade": 1.0,      # 1 = full milky blacks, 0 = blacks pulled back down
    "leaks": 0.35,    # 0..1 light leak strength, 0 = off
    "leak_seed": 1,
}


def normalize_look(look=None):
    """Fill in defaults and clamp. Unknown keys (from older state files) drop."""
    incoming = dict(look or {})
    resolved = dict(DEFAULT_LOOK)
    for name in ("fade", "leaks"):
        try:
            resolved[name] = max(0.0, min(1.0, float(incoming[name])))
        except (KeyError, TypeError, ValueError):
            pass
    try:
        resolved["leak_seed"] = int(incoming["leak_seed"]) & 0x7FFFFFFF
    except (KeyError, TypeError, ValueError):
        pass
    return resolved


# ---------------------------------------------------------------------------
# Tone curve
# ---------------------------------------------------------------------------

def _interpolate(points):
    """Build a 256-entry LUT from control points with a smooth (cosine) blend."""
    lut = []
    for value in range(256):
        left = points[0]
        right = points[-1]
        for i in range(len(points) - 1):
            if points[i][0] <= value <= points[i + 1][0]:
                left, right = points[i], points[i + 1]
                break
        span = right[0] - left[0]
        if span == 0:
            out = right[1]
        else:
            t = (value - left[0]) / span
            smooth = (1 - math.cos(t * math.pi)) / 2
            out = left[1] + (right[1] - left[1]) * smooth
        lut.append(max(0, min(255, int(round(out)))))
    return lut


_BASE_LUT = {name: _interpolate(points) for name, points in CURVE_POINTS.items()}
_lut_cache = {}


def build_lut(fade):
    """768-entry LUT for Image.point().

    fade == 1 is the curve exactly as authored. Below that, the lifted black
    point is pulled back down and the range restretched, so the image loses
    the milky wash and regains contrast.
    """
    key = round(float(fade), 3)
    cached = _lut_cache.get(key)
    if cached is not None:
        return cached

    removed = 1.0 - key
    lut = []
    for name in ("r", "g", "b"):
        base = _BASE_LUT[name]
        drop = base[0] * removed          # the lift this channel is giving up
        scale = 255.0 / max(1.0, 255.0 - drop)
        lut.extend(
            max(0, min(255, int(round((value - drop) * scale)))) for value in base
        )

    if len(_lut_cache) > 32:
        _lut_cache.clear()
    _lut_cache[key] = lut
    return lut


# ---------------------------------------------------------------------------
# Vignette + light leaks
# ---------------------------------------------------------------------------

_vignette_cache = {}
_leak_cache = {}
_LEAK_BASE = 128


def _vignette_mask(size):
    """Radial falloff mask, generated small and upscaled. Cached per size."""
    cached = _vignette_cache.get(size)
    if cached is not None:
        return cached

    small = 128
    mask = Image.new("L", (small, small))
    pixels = []
    center = (small - 1) / 2
    max_dist = math.hypot(center, center)
    for y in range(small):
        dy = (y - center) / max_dist
        for x in range(small):
            dx = (x - center) / max_dist
            dist = math.hypot(dx, dy)
            falloff = 1.0 - VIGNETTE_STRENGTH * (dist ** 2.2)
            pixels.append(max(0, min(255, int(round(falloff * 255)))))
    mask.putdata(pixels)

    mask = mask.resize(size, Image.BICUBIC)
    if len(_vignette_cache) > 8:
        _vignette_cache.clear()
    _vignette_cache[size] = mask
    return mask


def _draw_blob(draw, rng, shape, cx, cy, base):
    """Paint one leak shape anchored at (cx, cy), pointing inward (+y before
    the caller rotates it). Returns the blur radius that suits the shape."""
    if shape == "streak":
        radius_x = rng.uniform(0.04, 0.11) * base
        radius_y = rng.uniform(0.45, 1.00) * base
        draw.ellipse([cx - radius_x, cy - radius_y, cx + radius_x, cy + radius_y], fill=255)
        draw.ellipse(
            [cx - radius_x * 0.45, cy - radius_y * 0.7,
             cx + radius_x * 0.45, cy + radius_y * 0.7], fill=255)
        return rng.uniform(0.05, 0.09)

    if shape == "wash":
        radius_x = rng.uniform(0.30, 0.55) * base
        radius_y = rng.uniform(0.18, 0.45) * base
        draw.ellipse([cx - radius_x, cy - radius_y, cx + radius_x, cy + radius_y], fill=255)
        return rng.uniform(0.11, 0.17)

    if shape == "burst":
        radius = rng.uniform(0.16, 0.34) * base
        draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=255)
        draw.ellipse(
            [cx - radius * 0.5, cy - radius * 0.5,
             cx + radius * 0.5, cy + radius * 0.5], fill=255)
        return rng.uniform(0.07, 0.13)

    if shape == "wedge":
        half = rng.uniform(0.05, 0.16) * base
        reach = rng.uniform(0.55, 1.10) * base
        spread = rng.uniform(1.8, 4.5)
        draw.polygon(
            [(cx - half, cy), (cx + half, cy),
             (cx + half * spread, cy + reach), (cx - half * spread, cy + reach)],
            fill=255)
        return rng.uniform(0.09, 0.15)

    # band: a few offset lobes down one axis, so the streak breaks up
    steps = rng.randrange(3, 6)
    reach = rng.uniform(0.5, 1.0) * base
    widest = rng.uniform(0.06, 0.16) * base
    for step in range(steps):
        t = step / max(1, steps - 1)
        y = cy + t * reach
        radius_x = widest * rng.uniform(0.45, 1.25)
        radius_y = reach / steps * rng.uniform(0.7, 1.6)
        offset = rng.uniform(-0.05, 0.05) * base
        draw.ellipse(
            [cx + offset - radius_x, y - radius_y,
             cx + offset + radius_x, y + radius_y], fill=255)
    return rng.uniform(0.06, 0.11)


def _leak_layer(size, seed):
    """Procedural light leaks: blue/violet and gold blobs anchored to the edges,
    heavily blurred. Built at low resolution and upscaled, so one seed gives the
    same leak at preview size and at full size."""
    key = (size, seed)
    cached = _leak_cache.get(key)
    if cached is not None:
        return cached

    base = _LEAK_BASE
    layer = Image.new("RGB", (base, base), (0, 0, 0))
    rng = random.Random(seed)

    # always one cool and one gold, plus an optional third of either family
    colors = [rng.choice(LEAK_COOL), rng.choice(LEAK_GOLD)]
    if rng.random() < 0.45:
        colors.append(rng.choice(rng.choice((LEAK_COOL, LEAK_GOLD))))
    rng.shuffle(colors)

    # distinct edges, so the cool and gold blobs never stack on top of each other
    edges = rng.sample(range(4), len(colors))

    for index, color in enumerate(colors):
        blob = Image.new("L", (base, base), 0)
        draw = ImageDraw.Draw(blob)

        # Anchor on an edge so the leak reads as coming from outside the frame.
        # Shapes are drawn pointing +y; rotate(90) sends +y to +x, so the angle
        # per edge is the one that turns the shape inward.
        edge = edges[index]
        along = rng.uniform(0.10, 0.90) * base
        depth = rng.uniform(-0.10, 0.08) * base
        if edge == 0:                                          # top, inward +y
            cx, cy, angle = along, depth, rng.uniform(-40, 40)
        elif edge == 1:                                        # right, inward -x
            cx, cy, angle = base - depth, along, rng.uniform(230, 310)
        elif edge == 2:                                        # bottom, inward -y
            cx, cy, angle = along, base - depth, rng.uniform(140, 220)
        else:                                                  # left, inward +x
            cx, cy, angle = depth, along, rng.uniform(50, 130)

        blur = _draw_blob(draw, rng, rng.choice(LEAK_SHAPES), cx, cy, base)
        blob = blob.rotate(angle, resample=Image.BILINEAR, center=(cx, cy))
        blob = blob.filter(ImageFilter.GaussianBlur(base * blur))

        weight = rng.uniform(0.55, 1.0) * (1.0 if index == 0 else 0.75)
        tinted = ImageOps.colorize(
            blob, black=(0, 0, 0),
            white=tuple(int(component * weight) for component in color),
        )
        layer = ImageChops.add(layer, tinted)

    layer = layer.filter(ImageFilter.GaussianBlur(base * 0.03))

    # Shapes differ wildly in area, so raw brightness swings between rerolls.
    # Normalise the peak (not the mean, which would force a thin streak to
    # blow out to match a broad wash) so the slider means the same thing
    # whichever shapes came up.
    # measured on the brightest pixel, not a percentile: most of the frame is
    # unlit, so any percentile over the whole image just tracks the background
    peak = layer.convert("L").getextrema()[1]
    if peak > 2:
        gain = max(0.5, min(6.0, LEAK_TARGET_PEAK / peak))
        if abs(gain - 1.0) > 0.02:
            layer = layer.point(lambda v, g=gain: min(255, int(v * g)))

    layer = layer.resize(size, Image.BICUBIC)
    if len(_leak_cache) > 12:
        _leak_cache.clear()
    _leak_cache[key] = layer
    return layer


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

def load_working(path, rotate90=0, straighten=0.0):
    """Open an image, honour EXIF orientation, then apply user rotation.

    The result defines the coordinate space crop rectangles are stored in, so
    the UI and the final render always agree.
    """
    img = Image.open(path)
    img = ImageOps.exif_transpose(img)
    if img.mode != "RGB":
        img = img.convert("RGB")

    rotate90 = int(rotate90) % 4
    if rotate90:
        img = img.rotate(-90 * rotate90, expand=True)

    straighten = float(straighten)
    if abs(straighten) > 0.01:
        img = img.rotate(
            straighten, resample=Image.BICUBIC, expand=True, fillcolor=(0, 0, 0)
        )
    return img


def apply_grade(img, look=None, intensity=1.0):
    """Warm faded look: saturation, tone curve, bloom, leaks, vignette, grain."""
    look = normalize_look(look)
    intensity = max(0.0, min(1.0, float(intensity)))
    if intensity == 0.0:
        return img.copy()

    original = img
    graded = ImageEnhance.Color(img).enhance(SATURATION)
    graded = graded.point(build_lut(look["fade"]))

    radius = max(1.0, min(img.size) * BLOOM_RADIUS_RATIO)
    bloom = ImageChops.screen(graded, graded.filter(ImageFilter.GaussianBlur(radius)))
    graded = Image.blend(graded, bloom, BLOOM_STRENGTH)

    if look["leaks"] > 0.001:
        leak = _leak_layer(graded.size, look["leak_seed"])
        graded = Image.blend(graded, ImageChops.screen(graded, leak), look["leaks"])

    mask = _vignette_mask(graded.size)
    graded = ImageChops.multiply(graded, Image.merge("RGB", (mask, mask, mask)))

    noise = Image.effect_noise(
        (max(1, graded.size[0] // 2), max(1, graded.size[1] // 2)), GRAIN_SIGMA
    ).resize(graded.size, Image.BILINEAR)
    grain = ImageChops.overlay(graded, Image.merge("RGB", (noise, noise, noise)))
    graded = Image.blend(graded, grain, GRAIN_STRENGTH)

    if intensity < 1.0:
        graded = Image.blend(original, graded, intensity)
    return graded


def mount(square, photo_size=PHOTO_SIZE):
    """Paste a square photo into the white Polaroid card."""
    border = round(photo_size * BORDER_RATIO)
    bottom = round(photo_size * BOTTOM_RATIO)
    card = Image.new(
        "RGB", (photo_size + 2 * border, photo_size + border + bottom), FRAME_COLOR
    )
    if square.size != (photo_size, photo_size):
        square = square.resize((photo_size, photo_size), Image.LANCZOS)
    card.paste(square, (border, border))
    return card


def clamp_crop(crop, img_size):
    """Force a crop dict to a valid square inside the image."""
    width, height = img_size
    limit = min(width, height)
    size = int(round(crop.get("size", limit)))
    size = max(16, min(limit, size))
    x = int(round(crop.get("x", (width - size) / 2)))
    y = int(round(crop.get("y", (height - size) / 2)))
    x = max(0, min(width - size, x))
    y = max(0, min(height - size, y))
    return {"x": x, "y": y, "size": size}


def scale_crop(crop, ratio, img_size):
    """Map a crop rectangle into a resized copy of the same image."""
    return clamp_crop(
        {"x": crop["x"] * ratio, "y": crop["y"] * ratio, "size": crop["size"] * ratio},
        img_size,
    )


def default_crop(img_size):
    """Largest centred square."""
    width, height = img_size
    size = min(width, height)
    return {"x": (width - size) // 2, "y": (height - size) // 2, "size": size}


def render(path, crop=None, rotate90=0, straighten=0.0, intensity=1.0,
           look=None, photo_size=PHOTO_SIZE, working=None):
    """Full pipeline: load -> crop -> grade -> frame. Returns an RGB image."""
    img = working if working is not None else load_working(path, rotate90, straighten)
    box = clamp_crop(crop or default_crop(img.size), img.size)
    square = img.crop(
        (box["x"], box["y"], box["x"] + box["size"], box["y"] + box["size"])
    )
    if square.size != (photo_size, photo_size):
        square = square.resize((photo_size, photo_size), Image.LANCZOS)
    return mount(apply_grade(square, look, intensity), photo_size)


def save(img, path):
    img.save(path, "JPEG", quality=JPEG_QUALITY, subsampling=0, optimize=True)
