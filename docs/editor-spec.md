# Miftah Island — UI Rebuild & Map Editor Spec

Written up so the intent behind both pieces of work is explicit and doesn't
have to be re-derived from chat history. Build order: **Spec A first (small,
self-contained), then Spec B.**

## Spec A — Courtyard Codex (trainer overlay) UI rebuild

**Problem:** the trainer overlay ("Courtyard Codex") looked unfinished —
proportions felt broken, MCQ option buttons spilled past the parchment
card's background image, and the arch banner at the top was a one-off
low-bit external image that didn't match the rest of the island's art style.

**Root cause:** every other piece of art in the game (terrain, buildings,
props, animals, crops) is generated procedurally by
`scripts/generate-game-assets.mjs` — a small Node script that hand-encodes
PNGs (raw zlib/CRC32 PNG writer) and draws everything with a handful of flat
primitives (`fillRect`, `ellipse`, `poly`, `line`, `strokeRect`,
`ellipseStroke`) at fixed pixel sizes (48px tiles, 96–128px props/buildings,
32px icons), using a consistent palette (gold `#f2b93e`/`#a76618` trim, teal
`#1b8aa0` accents, dark brown `#3c2414` outlines) and a reusable
`arch(p, w, h, gold)` helper already used for `buildings/building_reading_arch.png`.
The old codex header/shell PNGs were never part of this pipeline (no "codex"
references existed in the script at all) — an external asset in a different
style, which is why it visually clashed.

**Fix applied:**
- Added a `codexHeader(p, w, h)` draw function to `generate-game-assets.mjs`
  that reuses the same visual language as `arch()` (pointed arch silhouette,
  gold trim/body, teal title band, dark outline) and generates
  `assets/generated/ui/ui_codex_header.png` at 620×190.
- `styles/main.css` `.codex-header` now points at the new PNG with a matching
  `aspect-ratio: 620/190` (was stretching a 512×156 SVG to an arbitrary CSS
  box, which threw off where the title text sat).
- `.codex-title-ribbon` repositioned to align with the new banner's teal band.
- `.trainer-study-panel` no longer has a fixed `height: 300px` (which forced
  a `1fr` options row to overflow past the parchment background whenever
  there were 4–5 MCQ choices). It now uses `min-height: 300px` with
  `grid-template-rows: auto auto auto auto auto`, so the box — and its
  stretched parchment background — grows to fit however many options are
  actually rendered.
- Fixed a real bug surfaced while testing this: the "Show/Hide Collection"
  toggle button lived *inside* the `.surah-collection` aside, so collapsing
  it (`display: none`) also hid the only control that could expand it again
  — a permanent dead end once collapsed. The collapsed state now keeps a
  slim 46px rail with just the toggle button visible.

**Verification:** live preview screenshots at `http://localhost:3000/miftah/index.html`,
confirmed header renders in-style, options stay inside the parchment card,
collapse/expand round-trips correctly, no console errors.

## Spec B — Standalone map/prop placement editor

**Problem:** iterating on world layout (tile terrain, building/prop
placement) currently requires prompting Claude for every change, burning
tokens and time, with results only visible after a round trip. The user
wants to place world elements themselves, city-builder style.

**Scope (explicit, from user):** MVP fidelity is fine — no polished
graphics needed. This tool is *not* part of the shipped game; it's a
separate dev-only page.

**Requirements:**
1. **Standalone page** (`editor.html`), sharing the real `Camera`,
   `TileMap`/`WorldMap`, `AssetLoader`, and `Renderer` modules with the game
   (same tile grid, same sprites) but with no player, NPCs, or game-loop
   logic running — just a static camera over the current map plus editor
   chrome.
2. **Click a tile → inventory palette.** Clicking a tile opens a palette of
   placeable elements, grouped by category, sourced from the existing
   catalog of terrain/building/prop entries (`src/data/*.js`, `MapData.js`).
3. **Footprint preview.** Selecting an item shows a hover ghost preview
   snapped to the tile grid, sized to the item's real footprint (in tiles).
4. **Validity checks.** The preview is colored green/red based on whether
   placement is actually legal — reusing the real `WorldMap` collision/gating
   logic (not a reimplementation), so what's placeable in the editor matches
   what the game would actually allow.
5. **Click to place**, accumulating into in-memory editor state.
6. **Save → backend file write.** A "Save" button POSTs the full placement
   set to a small new server endpoint (`POST /api/save-map`) that writes it
   to a JSON override file (e.g. `src/world/mapOverrides.json`). This means
   extending the current static file server with a minimal write endpoint.
7. **Auto-load on refresh.** `MapData.js`/`WorldMap.js` load
   `mapOverrides.json` at runtime (if present) and merge it over the base
   map data, so placements persist and show up automatically next time the
   game (or the editor) loads — no manual code-merging step.
8. **Debug page**, not part of the production game bundle/build.

**Out of scope for the MVP:** undo/redo history, multi-user conflict
handling, polished UI chrome, animation/juice on placement.
