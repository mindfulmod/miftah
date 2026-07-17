#!/usr/bin/env python3
"""Extract a checkerboard-backed character and export transparent web assets.

Nano Banana sometimes paints a transparency checkerboard into an opaque PNG.
This script exploits the neutral gray background and the character's closed,
saturated outline to recover the central connected subject without a model.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


def flood(mask: np.ndarray, seeds: list[tuple[int, int]], diagonals: bool = False) -> np.ndarray:
    """Return the part of boolean *mask* connected to *seeds*."""
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    queue: deque[tuple[int, int]] = deque()
    for x, y in seeds:
        if 0 <= x < width and 0 <= y < height and mask[y, x] and not seen[y, x]:
            seen[y, x] = True
            queue.append((x, y))

    steps = ((1, 0), (-1, 0), (0, 1), (0, -1))
    if diagonals:
        steps += ((1, 1), (1, -1), (-1, 1), (-1, -1))

    while queue:
        x, y = queue.popleft()
        for dx, dy in steps:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and mask[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                queue.append((nx, ny))
    return seen


def extract_subject(source: Image.Image, gray_tolerance: int = 14) -> Image.Image:
    rgba = source.convert("RGBA")
    rgb = np.asarray(rgba, dtype=np.uint8)[..., :3]
    height, width = rgb.shape[:2]

    # The fake transparency grid is neutral gray. Flood only neutral pixels
    # from the canvas edges so enclosed white eyes and cream details survive.
    chroma = rgb.max(axis=2).astype(np.int16) - rgb.min(axis=2).astype(np.int16)
    neutral = chroma <= gray_tolerance
    edge_seeds = (
        [(x, 0) for x in range(width)]
        + [(x, height - 1) for x in range(width)]
        + [(0, y) for y in range(height)]
        + [(width - 1, y) for y in range(height)]
    )
    outside = flood(neutral, edge_seeds)

    # Keep only the connected foreground component containing the canvas
    # center. This rejects the decorative white sparkle and compression noise.
    candidate = ~outside
    center = (width // 2, height // 2)
    if not candidate[center[1], center[0]]:
        ys, xs = np.where(candidate & (chroma > gray_tolerance * 2))
        if len(xs) == 0:
            raise ValueError("Could not locate a foreground subject")
        nearest = np.argmin((xs - center[0]) ** 2 + (ys - center[1]) ** 2)
        center = (int(xs[nearest]), int(ys[nearest]))
    subject = flood(candidate, [center], diagonals=True)

    # Recover one antialiasing pixel without retaining the gray checker halo.
    hard = Image.fromarray((subject * 255).astype(np.uint8), "L")
    expanded = np.asarray(hard.filter(ImageFilter.MaxFilter(3))) > 0
    rgb_clean = rgb.copy()
    # Alpha blur reaches beyond the hard mask, so propagate real outline
    # colors through a wider invisible guard band before creating the matte.
    color_zone = np.asarray(hard.filter(ImageFilter.MaxFilter(7))) > 0
    # Start one pixel inside the recovered silhouette. The original outermost
    # pixels are already blended with the fake checkerboard, so treating them
    # as authoritative would preserve a pale fringe on dark web backgrounds.
    known = np.asarray(hard.filter(ImageFilter.MinFilter(3))) > 0
    for _ in range(5):
        fringe = color_zone & ~known
        if not fringe.any():
            break
        total = np.zeros_like(rgb_clean, dtype=np.uint32)
        count = np.zeros((height, width), dtype=np.uint16)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0:
                    continue
                shifted_known = np.roll(np.roll(known, dy, axis=0), dx, axis=1)
                shifted_rgb = np.roll(np.roll(rgb_clean, dy, axis=0), dx, axis=1)
                usable = fringe & shifted_known
                total[usable] += shifted_rgb[usable]
                count[usable] += 1
        usable = fringe & (count > 0)
        rgb_clean[usable] = (total[usable] / count[usable, None]).astype(np.uint8)
        known[usable] = True

    alpha = np.asarray(
        Image.fromarray((expanded * 255).astype(np.uint8), "L").filter(
            ImageFilter.GaussianBlur(0.55)
        )
    ).copy()
    alpha[alpha < 4] = 0
    result = Image.fromarray(rgb_clean, "RGB").convert("RGBA")
    result.putalpha(Image.fromarray(alpha, "L"))
    return result


def crop_with_padding(image: Image.Image, padding: int) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 4 else 0).getbbox()
    if not bbox:
        raise ValueError("The extracted image is fully transparent")
    left = max(0, bbox[0] - padding)
    top = max(0, bbox[1] - padding)
    right = min(image.width, bbox[2] + padding)
    bottom = min(image.height, bbox[3] + padding)
    return image.crop((left, top, right, bottom))


def fit(image: Image.Image, max_dimension: int) -> Image.Image:
    scale = min(1.0, max_dimension / max(image.size))
    if scale == 1.0:
        return image.copy()
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    return image.resize(size, Image.Resampling.LANCZOS)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--name", default="character_idle")
    parser.add_argument("--padding", type=int, default=40)
    parser.add_argument("--gray-tolerance", type=int, default=14)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    source = Image.open(args.input)
    extracted = crop_with_padding(
        extract_subject(source, gray_tolerance=args.gray_tolerance), args.padding
    )

    master_path = args.output_dir / f"{args.name}_master.png"
    webp_2x_path = args.output_dir / f"{args.name}@2x.webp"
    webp_1x_path = args.output_dir / f"{args.name}.webp"

    extracted.save(master_path, optimize=True)
    fit(extracted, 960).save(webp_2x_path, "WEBP", quality=92, method=6, exact=True)
    fit(extracted, 480).save(webp_1x_path, "WEBP", quality=90, method=6, exact=True)

    print(f"master={master_path} size={extracted.width}x{extracted.height}")
    print(f"webp_2x={webp_2x_path}")
    print(f"webp_1x={webp_1x_path}")


if __name__ == "__main__":
    main()
