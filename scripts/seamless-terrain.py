#!/usr/bin/env python3
"""Make the pure-texture terrain tiles (grass, water, sand) SEAMLESS in place.

The sheet drew each tile as a standalone rounded card with a dark border, so
tiling shows a grid of blocks. Operate on the already-sliced 48px tiles
(index-independent): drop the border by centre-cropping, upscale, edge-blend an
offset copy so opposite edges match, then resize back to 48. Accent tiles with
a distinct feature (ripple, lily, plaza medallions) are left alone."""
from PIL import Image
import numpy as np

GEN = "assets/generated"
TILES = [
    "terrain/terrain_grass_01.png",
    "terrain/terrain_grass_flowers.png",
    "terrain/terrain_sand_01.png",
    "terrain/terrain_water_01.png",
    "terrain/terrain_lagoon_01.png",
]


def make_seamless(a):
    h, w = a.shape[:2]
    wy = np.minimum(np.arange(h), np.arange(h)[::-1]).astype(float)
    wx = np.minimum(np.arange(w), np.arange(w)[::-1]).astype(float)
    wy /= wy.max(); wx /= wx.max()
    weight = (np.outer(wy, wx) ** 0.6)[:, :, None]  # 1 centre → 0 edge
    rolled = np.roll(np.roll(a, w // 2, 1), h // 2, 0)
    return a * weight + rolled * (1 - weight)


for rel in TILES:
    im = Image.open(f"{GEN}/{rel}").convert("RGB")
    w, h = im.size
    inset = max(3, int(w * 0.12))
    core = im.crop((inset, inset, w - inset, h - inset)).resize((96, 96), Image.LANCZOS)
    arr = np.array(core).astype(float)
    seam = np.clip(make_seamless(arr), 0, 255).astype(np.uint8)
    tile = Image.fromarray(seam).resize((w, h), Image.LANCZOS).convert("RGBA")
    tile.save(f"{GEN}/{rel}")
    print("seamless", rel)
