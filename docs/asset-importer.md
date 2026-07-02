# Asset Importer

Use `scripts/import-sprite-sheet.mjs` when Kimi or Nano Banana gives you a strict grid sheet. This keeps Codex work deterministic: no hunting around a large image, no browser check unless you ask for one.

## Best Source Format

Ask for small sheets:

```text
Create a production-ready pixel-art prop spritesheet.
Grid: 4 columns x 3 rows.
Each cell: exactly 64x64 pixels.
Background: actual transparent alpha. If transparency is not possible, use pure #ff00ff magenta.
One isolated asset per cell. No labels, no shadows outside the sprite, no extra objects.
Keep each prop centered and anchored to the same bottom baseline.
```

Magenta is much easier to remove than white or gray because white creates matte halos around anti-aliased edges.

## Command

```bash
node scripts/import-sprite-sheet.mjs assets/imports/flowers-v1.json
```

The script writes sliced PNGs and a preview image. By default the preview goes to `/tmp`/`/private/tmp`; override it with:

```bash
node scripts/import-sprite-sheet.mjs assets/imports/flowers-v1.json --preview /private/tmp/flowers-preview.png
```

## Flower Manifest Example

```json
{
  "source": "assets/tilesets/nano-flowers-v1.png",
  "grid": {
    "cols": 4,
    "rows": 3,
    "cell": 64
  },
  "background": {
    "type": "magenta",
    "color": "#ff00ff",
    "tolerance": 3
  },
  "output": {
    "dir": "assets/generated/props",
    "width": 48,
    "height": 48,
    "padding": 4,
    "anchor": "bottom",
    "preview": "/private/tmp/flowers-v1-preview.png"
  },
  "assets": [
    { "file": "prop_flowers.png", "row": 0, "col": 0, "maxWidth": 42, "maxHeight": 38 },
    "prop_flowers_pink",
    "prop_flowers_yellow",
    "prop_flowers_purple",
    "prop_flowers_white",
    "prop_flowers_blue",
    "prop_flowers_bush_pink",
    "prop_flowers_bush_purple",
    "prop_flowers_desert_bloom",
    "prop_flowers_ring",
    "prop_flowers_dense",
    "prop_flowers_sparse"
  ]
}
```

Use `crop` when a model leaves a watermark or stray mark inside a cell:

```json
{ "file": "prop_flowers_white.png", "row": 0, "col": 3, "crop": { "x": 12, "y": 8, "width": 240, "height": 180 } }
```

## Background Types

- `transparent`: only removes pixels with low alpha.
- `magenta`: removes pure magenta, recommended when models fake transparency.
- `color`: removes a specific color such as `#ffffff`.
- `corner`: samples the cell corners and removes that background color.
- `auto`: default; removes alpha, magenta, or a consistent corner background.

For lowest token use, prefer `transparent` or `magenta`.

## Fast Workflow

1. Generate a small strict sheet in Kimi/Nano.
2. Add a manifest with exact grid and filenames.
3. Ask Codex to run the importer and show the preview only.
4. You verify in the game and give feedback.

Avoid giant catalog sheets unless we are doing art discovery.
