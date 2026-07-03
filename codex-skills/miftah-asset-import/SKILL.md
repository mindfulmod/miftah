---
name: miftah-asset-import
description: Low-token workflow for importing Kimi, Nano Banana, or other generated sprite sheets into the Miftah game. Use when slicing asset sheets, replacing or adding prop/terrain/character PNGs, wiring assets into the editor catalog, or keeping asset iteration preview-only without browser or map inspection.
---

# Miftah Asset Import

## Default Mode

Keep asset-import turns small and predictable.

- Use the existing repo importer at `scripts/import-sprite-sheet.mjs`.
- Show the generated preview only after slicing.
- Do not open or refresh the browser unless the user explicitly asks.
- Do not inspect or edit `src/world/mapOverrides.json` unless the user explicitly asks to update the current saved map.
- Do not edit `src/world/MapData.js` unless the user explicitly asks to place assets on the default map.
- Avoid broad diffs and full repo status output. Check only files relevant to the requested asset.
- Treat sheet rows and columns from the user as 1-indexed.

## Import Workflow

1. Verify the source image path exists.
2. Create a temporary JSON manifest under `/private/tmp/miftah-imports/`.
3. Run `node scripts/import-sprite-sheet.mjs <manifest>`.
4. Use magenta background removal for Nano/Kimi free outputs when requested. Start near `#ff00ff` with tolerance `100-120`; avoid going above `130` for pink or purple flowers unless artifacts remain.
5. Crop watermark areas in the manifest with per-asset `crop` values instead of discussing or editing the source image.
6. Show the generated preview image path in Markdown.
7. Stop unless the user asks for game wiring, browser verification, or a commit.

## Wiring Assets

For prop variants, prefer editor availability over map placement.

- Add new prop image paths in `src/data/assets.js` under `props`.
- Add placeable entries in `src/editor/editorCatalog.js`.
- Use clear names such as `flowersPink`, `flowersPurple`, `flowersYellow`, or `grassFlowers`.
- Run `node --check` only on edited JavaScript files.
- Leave map placement for a separate explicit request.

## Commit Scope

When the user asks to commit, stage only the files touched for the asset change:

- Generated PNGs under `assets/generated/`.
- Source sheet PNGs only when the user wants them kept.
- Scoped JS catalog/asset registry files.
- Importer docs or manifests only if they were intentionally changed.

Do not stage unrelated working tree changes.

## Reusable User Prompt

For a new generated flower sheet, the user can say:

```text
Use $miftah-asset-import on this 4x3 flower sheet. Background is #ff00ff with tolerance. Ignore/crop out the bottom-right watermark area. Replace prop_flowers.png with row 1 col 2. Export row 1 col 1 as flowersPink and row 2 col 4 as flowersPurple. Show preview only.
```
