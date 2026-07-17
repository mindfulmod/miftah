#!/usr/bin/env python3
"""Build Letter Garden character pose assets from transparent PNG sources."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 3 else 0).getbbox()
    if not bbox:
        raise ValueError("image has no visible pixels")
    return bbox


def place_on_square(image: Image.Image, canvas_size: int, padding: int, foot_ratio: float) -> Image.Image:
    image = image.convert("RGBA")
    bbox = alpha_bbox(image)
    subject = image.crop(bbox)
    target_w = canvas_size - padding * 2
    target_h = round(canvas_size * foot_ratio) - padding
    scale = min(target_w / subject.width, target_h / subject.height)
    size = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    subject = subject.resize(size, Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    x = round((canvas_size - subject.width) / 2)
    y = round(canvas_size * foot_ratio) - subject.height
    canvas.alpha_composite(subject, (x, y))
    return canvas


def save_pose(source: Path, output_dir: Path, name: str, canvas_size: int, padding: int, foot_ratio: float) -> None:
    image = place_on_square(Image.open(source), canvas_size, padding, foot_ratio)
    master = output_dir / f"{name}_master.png"
    webp_2x = output_dir / f"{name}@2x.webp"
    webp_1x = output_dir / f"{name}.webp"

    image.save(master, optimize=True)
    image.save(webp_2x, "WEBP", quality=92, method=6, exact=True)
    image.resize((canvas_size // 2, canvas_size // 2), Image.Resampling.LANCZOS).save(
        webp_1x,
        "WEBP",
        quality=90,
        method=6,
        exact=True,
    )
    print(f"{name}: {image.width}x{image.height} -> {webp_1x}, {webp_2x}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("poses", nargs="+", help="name=source.png")
    parser.add_argument("--canvas-size", type=int, default=960)
    parser.add_argument("--padding", type=int, default=44)
    parser.add_argument("--foot-ratio", type=float, default=0.92)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    for pose in args.poses:
        if "=" not in pose:
            raise ValueError(f"expected name=source.png, got {pose!r}")
        name, source = pose.split("=", 1)
        save_pose(Path(source), args.output_dir, name, args.canvas_size, args.padding, args.foot_ratio)


if __name__ == "__main__":
    main()
