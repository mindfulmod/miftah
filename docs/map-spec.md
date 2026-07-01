# Miftah Island Garden — Map Spec (tile-map foundation rebuild)

Source of truth: `src/world/MapData.js` generates every tile, zone, gate and
default prop; `src/world/mapOverrides.json` is the production prop placement
layer saved by the F2 in-game editor. When present with `replaceProps: true`,
it replaces the full prop layer so any visible prop can be moved or removed.
The baked `world_oasis_backdrop.png` stays in `assets/` but is no longer
referenced by the live map — tiles + props render directly, so what you see is
exactly what collides.

Grid: 58 × 56 tiles, 48 px each (2784 × 2688 px world).

## Layout overview

```
        NW Garden Isle          HUB           NE Farmstead Isle
        (bee ant dove)       Reading Arch      (cow sheep horse)
                              farm plots
        W  Aviary Isle      fountain plaza    E  Grove Isle
        (hoopoe ababeel        hatchery          (cat dog)
         crow)                pavilion
        SW Wildwood Isle        dock          SE Grotto Isle
        (elephant camel fish)  (spawn)          (snake spider)
```

- **Hub** — vertical ellipse centered (28, 28), radii 9 × 22 → x 19–37, y 6–50.
  Always open. Contains everything needed before any unlock.
- **Six biome isles** — ellipses radii 6 × 6.5, three per side:
  west column cx 8, east column cx 48; rows cy 12 / 28 / 44.
  All start locked; each opens when its first animal hatches.

## Hub contents (always available)

| Feature        | Tiles (x, y)        | Notes |
|----------------|---------------------|-------|
| Reading Arch   | 27, 8 (128×128 px)  | Study entry; spine path ends beneath it |
| Farm           | 30–34, 14–22        | 6 plots + irrigation channels + sign/crate/barrel; forced-grass rect so it reads as one coherent zone |
| Fountain plaza | courtyard circle r≈3.6 around (28, 28), star tile at center | |
| Hatchery       | cradle at (30, 27), east plaza edge | egg wobbles here; collider-only blocker under the cradle |
| Pavilion home  | 20, 31              | west of plaza |
| Dock + spawn   | platform 26–30 × 48–53, dock tiles (28, 54–55), spawn (28, 52) | arrival point |
| Spine path     | x 28, y 10–47       | plus three E/W stubs per side to each bridge mouth |

## Bridges, gates, clue markers

Each isle is reached by one horizontal bridge, 2 tiles tall, rows cy−1..cy
(11–12, 27–28, 43–44). Everything else around the hub is water = hard blocked.

- **Gate** (locked state): pasture-gate sprites on both bridge rows at the
  hub-side mouth + one 2×2-tile collider spanning the full crossing. No gap,
  no edge walk-around. Gate disappears the moment the isle unlocks.
- **Clue marker** (always visible, hub side): a sign prop beside each bridge
  mouth with Hades-2-style companion tease dialogue hinting at who will live
  there ("Something hums softly across the water…"). Locked isles also get a
  soft dark tint + a wooden plaque label drawn by the renderer; when the
  active egg belongs to that isle the plaque switches to "an egg is stirring"
  (preview state).

## Biome isles

| Isle | Id | Zones (animals) | Anchor props |
|------|----|-----------------|--------------|
| NW Garden    | `nw` | honey (bee, ant), dove         | honeycomb hub, dove nesting tree |
| W  Aviary    | `w`  | aviary (hoopoe, ababeel), orchard (crow) | ababeel perches, crow rocky orchard |
| SW Wildwood  | `sw` | grove (elephant), spring (camel), lagoon (fish) | elephant grove, camel spring, lagoon inlet + fish motif |
| NE Farmstead | `ne` | barn (cow), meadow (sheep, horse) | barn, stable, fenced pens, hay |
| E  Grove     | `e`  | pets (cat, dog)                | dog house, cat nook, orange tree |
| SE Grotto    | `se` | snake, spider                  | snake habitat, spider grotto, sand patch |

Animal spawn points and wander bounds sit in each isle's interior (≥1 tile
from the shore ring); the tile-walkability predicate is the second fence.
The fish is aquatic and bound to the SW lagoon tiles.

## Collision rules by type

- **Strict (hard block)**: water/lagoon tiles (tile layer), buildings, the
  fountain, gate colliders on locked bridges, rocks, hatchery cradle.
- **Forgiving (no collider)**: flowers, hay, reeds, lily pads, fences
  (decorative pen framing), signs' surroundings, ground decals/mats,
  fish motif. Trees and lanterns keep a small base-only collider so trunks
  block but canopies overlap.
- Acceptance: looks walkable ⇒ walkable; looks solid ⇒ blocks at the visible
  base; no invisible walls; no standing in water or inside buildings.

## MapData.js vs mapOverrides.json

- **MapData.js**: terrain tiles, island shapes, paths/bridges, zone + island
  metadata, gates, clue markers, buildings, habitat anchors, farm plots,
  NPCs, spawn — everything gameplay-loading depends on.
- **mapOverrides.json**: production prop placement authored in the F2 editor.
  Newer saves use `{ replaceProps: true, props: [...] }`, so the file can
  persist moves/removals for MapData-authored props as well as new decorative
  dressing.

## Dev tooling

- **F2** in-game editor: place/move/remove/save to `mapOverrides.json`
  (dev server `/api/save-map`).
- **C** collision debug overlay: player hitbox, sampled collision points,
  nearby prop colliders, tile type + walkability under the player.
- **T** opens the Courtyard Codex trainer directly.
