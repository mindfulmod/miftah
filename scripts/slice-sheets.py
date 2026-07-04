#!/usr/bin/env python3
"""Slice the miftah-* sprite sheets into individual transparent PNGs.

Pipeline per sheet:
  1. Flood-fill the near-white background inward from the borders → alpha 0.
     (Edge flood, not a global key, so interior whites — the mosque dome,
      book pages, sheep, foam — are preserved.)
  2. Label connected components of the remaining opaque pixels → sprite boxes.
  3. Cluster boxes into rows (by y) then sort by x, giving a stable reading
     order that a hand-authored name list maps onto.

Run:
  python3 scripts/slice-sheets.py detect <sheet.png>     # numbered debug overlay
  python3 scripts/slice-sheets.py cut <sheet.png> <names.txt> <outdir>
"""
import sys
from collections import deque
from PIL import Image, ImageDraw
import numpy as np

WHITE = 244          # channel >= this (all three) counts as background-white
MIN_AREA = 220       # drop specks smaller than this many pixels
MERGE_GAP = 2        # components whose boxes are within this gap are merged
ROW_TOL = 28         # y-centres within this are treated as the same row


def background_mask(arr):
    """True where a pixel is background (near-white AND edge-connected)."""
    h, w, _ = arr.shape
    near_white = np.all(arr[:, :, :3] >= WHITE, axis=2)
    bg = np.zeros((h, w), dtype=bool)
    stack = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near_white[y, x] and not bg[y, x]:
                bg[y, x] = True; stack.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if near_white[y, x] and not bg[y, x]:
                bg[y, x] = True; stack.append((y, x))
    while stack:
        y, x = stack.pop()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and near_white[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True; stack.append((ny, nx))
    return bg


def components(fg):
    """Bounding boxes [x0,y0,x1,y1] of 8-connected opaque regions."""
    h, w = fg.shape
    seen = np.zeros((h, w), dtype=bool)
    boxes = []
    nbrs = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
    for sy in range(h):
        row = fg[sy]
        for sx in range(w):
            if not row[sx] or seen[sy, sx]:
                continue
            x0 = x1 = sx; y0 = y1 = sy; area = 0
            stack = deque([(sy, sx)]); seen[sy, sx] = True
            while stack:
                y, x = stack.pop(); area += 1
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
                for dy, dx in nbrs:
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < h and 0 <= nx < w and fg[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True; stack.append((ny, nx))
            if area >= MIN_AREA:
                boxes.append([x0, y0, x1 + 1, y1 + 1])
    return boxes


def merge_close(boxes):
    """Merge boxes that overlap or sit within MERGE_GAP (detached highlights,
    a frond drifting off a trunk, etc.)."""
    merged = True
    while merged:
        merged = False
        out = []
        while boxes:
            a = boxes.pop()
            grew = True
            while grew:
                grew = False
                rest = []
                for b in boxes:
                    if (a[0] - MERGE_GAP < b[2] and b[0] - MERGE_GAP < a[2]
                            and a[1] - MERGE_GAP < b[3] and b[1] - MERGE_GAP < a[3]):
                        a = [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]
                        grew = True; merged = True
                    else:
                        rest.append(b)
                boxes = rest
            out.append(a)
        boxes = out
    return boxes


def in_reading_order(boxes):
    boxes = sorted(boxes, key=lambda b: (b[1] + b[3]) / 2)
    rows, cur, base = [], [], None
    for b in boxes:
        cy = (b[1] + b[3]) / 2
        if base is None or cy - base <= ROW_TOL:
            cur.append(b); base = cy if base is None else base
        else:
            rows.append(sorted(cur, key=lambda b: b[0])); cur = [b]; base = cy
    if cur:
        rows.append(sorted(cur, key=lambda b: b[0]))
    return [b for row in rows for b in row]


def runs(mask1d, thresh):
    """Start/stop indices of consecutive True runs where value>thresh."""
    out, start = [], None
    for i, v in enumerate(mask1d):
        if v > thresh and start is None:
            start = i
        elif v <= thresh and start is not None:
            out.append((start, i)); start = None
    if start is not None:
        out.append((start, len(mask1d)))
    return out


def boxes_by_projection(content):
    """Grid slice via background gaps: split into row bands on empty rows,
    then into sprites on empty columns within each band, tightening each box
    to its actual content. Robust to soft shadows and interior holes that
    break connected-components."""
    h, w = content.shape
    boxes = []
    for y0, y1 in runs(content.sum(axis=1), w * 0.003):
        band = content[y0:y1]
        for x0, x1 in runs(band.sum(axis=0), (y1 - y0) * 0.02):
            sub = content[y0:y1, x0:x1]
            ys = np.where(sub.any(axis=1))[0]
            xs = np.where(sub.any(axis=0))[0]
            if len(ys) and len(xs):
                boxes.append([x0 + xs[0], y0 + ys[0], x0 + xs[-1] + 1, y0 + ys[-1] + 1])
    return boxes


def prepare(path):
    im = Image.open(path).convert("RGBA")
    arr = np.array(im)
    bg = background_mask(arr)
    arr[bg, 3] = 0
    rgb = arr[:, :, :3].astype(int)
    maxc = rgb.max(axis=2)
    sat = maxc - rgb.min(axis=2)
    # Separation mask: real sprite pixels are either coloured (saturated) or
    # dark (the outlines/shading every sprite carries). This deliberately drops
    # the soft, desaturated, light-grey drop-shadows that would otherwise link
    # neighbouring sprites into one blob. Each sprite's dark outline keeps it a
    # single connected component.
    sep = (arr[:, :, 3] > 16) & ((sat >= 20) | (maxc < 170))
    # Erode to snap the thin foliage/ground bridges that link neighbouring
    # sprites, label the separated cores, then grow each box back to the real
    # (un-eroded) sprite extent.
    core = erode(sep, 3)
    # Each eroded core is one sprite; pad back by the erosion amount to recover
    # the shrunk margin. No content re-tighten — on a densely packed sheet that
    # would grab neighbouring sprites and merge everything.
    h, w = sep.shape
    boxes = []
    for b in components(core):
        boxes.append([max(0, b[0] - 3), max(0, b[1] - 3), min(w, b[2] + 3), min(h, b[3] + 3)])
    boxes = in_reading_order(boxes)
    return Image.fromarray(arr), boxes


def erode(mask, k):
    m = mask
    for _ in range(k):
        e = m.copy()
        e[1:, :] &= m[:-1, :]
        e[:-1, :] &= m[1:, :]
        e[:, 1:] &= m[:, :-1]
        e[:, :-1] &= m[:, 1:]
        m = e
    return m


def tighten(opaque, box, pad):
    """Grow a box by pad, then shrink to the true opaque content inside it."""
    h, w = opaque.shape
    x0 = max(0, box[0] - pad); y0 = max(0, box[1] - pad)
    x1 = min(w, box[2] + pad); y1 = min(h, box[3] + pad)
    sub = opaque[y0:y1, x0:x1]
    ys = np.where(sub.any(axis=1))[0]
    xs = np.where(sub.any(axis=0))[0]
    if not len(ys) or not len(xs):
        return None
    return [x0 + int(xs[0]), y0 + int(ys[0]), x0 + int(xs[-1]) + 1, y0 + int(ys[-1]) + 1]


def detect(path):
    rgba, boxes = prepare(path)
    dbg = rgba.copy()
    d = ImageDraw.Draw(dbg)
    for i, (x0, y0, x1, y1) in enumerate(boxes):
        d.rectangle([x0, y0, x1, y1], outline=(255, 0, 0, 255), width=2)
        d.text((x0 + 2, y0 + 1), str(i), fill=(255, 0, 0, 255))
    out = path.rsplit(".", 1)[0] + ".debug.png"
    dbg.convert("RGB").save(out)
    print(f"{len(boxes)} sprites → {out}")
    for i, b in enumerate(boxes):
        print(i, b, f"{b[2]-b[0]}x{b[3]-b[1]}")


def fit(sprite, w, h, fill):
    """Resize a cropped sprite to a target box. Terrain tiles FILL the box
    (they tile edge-to-edge); everything else is CONTAIN-fit and centred on a
    transparent canvas so nothing distorts."""
    if fill:
        r = sprite.resize((w, h), Image.LANCZOS)
        # Tiles must be fully opaque squares (the sheet draws them with rounded
        # corners on white; keyed out, those corners would show the page
        # background through the tile seams). Flatten onto the tile's own
        # average colour so it stays a solid, seamless square.
        px = np.array(r)
        opaque = px[:, :, 3] > 200
        if opaque.any():
            avg = tuple(int(v) for v in px[:, :, :3][opaque].mean(axis=0))
        else:
            avg = (0, 0, 0)
        bg = Image.new("RGBA", (w, h), avg + (255,))
        bg.paste(r, (0, 0), r)
        return bg.convert("RGBA")
    s = sprite.copy()
    s.thumbnail((w, h), Image.LANCZOS)
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    canvas.paste(s, ((w - s.width) // 2, (h - s.height) // 2), s)
    return canvas


def cutmap(path, mapfile, gendir):
    """Map lines: '<sprite_index> <relpath>'. One sprite may feed several
    outputs. Each output is resized to the engine's display size for that
    asset (scripts/asset-dims.json) and written into assets/generated/."""
    import os, json
    rgba, boxes = prepare(path)
    dims = json.load(open(os.path.join(os.path.dirname(__file__), "asset-dims.json")))
    n = 0
    for line in open(mapfile):
        line = line.split("#")[0].strip()
        if not line:
            continue
        idx, rel = line.split(None, 1)
        idx = int(idx)
        if idx >= len(boxes):
            print(f"  ! index {idx} out of range ({len(boxes)} sprites) for {rel}")
            continue
        sprite = rgba.crop(boxes[idx])
        w, h = dims.get(rel, [sprite.width, sprite.height])
        fill = rel.startswith("terrain/")
        out = os.path.join(gendir, rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        fit(sprite, w, h, fill).save(out)
        n += 1
    print(f"wrote {n} assets into {gendir}")


if __name__ == "__main__":
    if sys.argv[1] == "detect":
        detect(sys.argv[2])
    elif sys.argv[1] == "cutmap":
        cutmap(sys.argv[2], sys.argv[3], sys.argv[4])
