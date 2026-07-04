# Procedural Island — Phase 1: Seeded Coastlines & Badge Archipelago

The map is already *constructed*, not painted: `createMapData()` builds every
tile and prop from primitives, and the tile array renders live with no cache
(`TileMap.render` reads it per frame; `CollisionMap` samples it per move).
That makes seeding cheap and runtime tile mutation safe. Phase 1 exploits
exactly that, without touching a single play-tested gameplay tile.

## Design decisions (settled)

**Gameplay geometry is sacred.** The hub layout, farm, courtyard, dock,
bridges, isle centers, gates and every authored/editor-placed prop stay
byte-identical. The map spec calls this geometry settled; procedural variety
must never move a collider a player relies on, and the editor's
`replaceProps` override layer keeps owning the prop list unchallenged.

**Variety is expansion-only.** The coastline noise only turns *water* tiles
into beach — it never erodes land, never touches a tile adjacent to a
bridge/dock (boat lanes stay clean), and never approaches the map border.
Worst case is extra beach to walk on; pathing, zones and camera bounds are
untouched.

**Badge islets are scenic monuments.** One islet per earned juz badge rises
in the outer water ring — visible from the hub shores, unreachable on foot
(no bridge, no colliders needed), each with a palm and a lantern that glows
at night. They are the island-side mirror of the Codex badge shelf: the
archipelago *is* your Quran progress. Reachability (boats?) is future work.

**Decor is draw-only.** Islet palms/lanterns are drawn by the shaper
(like WordGardenSystem's flowers), not added as props — so the F2 editor
never sees them, saves never bake them, and regeneration can't duplicate
them.

**One seed per player.** `miftah-oasis:island-seed` (localStorage), random
on first boot, overridable with `?seed=` for testing and sharing. Every
shape decision flows from `mulberry32(hash(seed | purpose | n))` so each
subsystem is independently deterministic.

## Components

`src/world/IslandShaper.js` — everything lives here:

- `constructor()` resolves the seed (URL param → localStorage → random+save).
- `apply(mapData)` — called in `Game.start` after `applyMapOverrides`:
  1. **Coastline noise**: 2 passes over water tiles with ≥2 land neighbours
     (land = grass/sand/lagoon-shore); seeded chance turns them `sand`;
     tiles that end up mostly surrounded by land are promoted to `grass`.
     Skips tiles within 2 tiles of any `bridgeH/bridgeV/dock` and 2 tiles
     of the map border.
  2. **Water detail scatter**: ~14 extra `waterRipple` + ~8 `lilyWater`
     seeded onto plain water tiles away from bridges.
  3. **Islet anchors**: 30 candidate spots (one per juz) precomputed from
     the seed on a jittered ring in the outer water margin, each validated
     ≥3 tiles from land, bridges and other islets; invalid candidates get
     nudged along the ring until valid or skipped.
- `syncBadgeIslets(game, { animate })` — reads `quran-trainer:badges`,
  raises tiles for any earned-but-unrisen islet (sand blob, grass core).
  With `animate: true` (a badge earned this session): camera cutaway to the
  spot, splash ripples, "hatch" chime. Called once at boot (silent) and from
  `TrainerOverlay.close()` (animated), same place the word garden refreshes.
- `draw(renderer)` — ground-level decor for risen islets: palm sprite,
  night lantern glow (sinusoidal alpha, mirrors WordGarden's style).
  Hooked in `Renderer` beside `wordGarden.draw`.

## Acceptance

1. Two different seeds → visibly different coastlines and water detail;
   the same seed → identical map every load.
2. All bridges, paths, farm, courtyard, dock, spawn and props are identical
   across seeds (diff the tile array over the authored feature mask).
3. With N juz badges in storage, N islets exist after boot; earning a badge
   in the Codex raises one more on close, with cutaway + sound.
4. No islet is reachable on foot; no coastline tile blocks any path.
5. `?seed=miftah` reproduces the same island on every device.

## Phase 2 (future, not this pass)

- Full layout variation (isle positions/count from seed) once animal zones
  and the editor learn to follow generated anchors.
- Prerendered low-poly sprite pipeline (Blender + CC0 kits) for the art
  direction switch — orthogonal to this work.
- Boats/bridges to visit badge islets; per-islet juz inscriptions.
