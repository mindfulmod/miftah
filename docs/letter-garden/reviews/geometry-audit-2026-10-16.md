# Geometry audit: one shape language for every style (2026-10-16)

Owner's note: "our art asset geometry is all over the place and doesn't have a
design language; rounder edges that match our mascot pets will make more
sense." All 11 explored styles (`.qa/style-explorations.html`) share the same
geometry, so this audit stays valid whichever style is picked. It's read-only:
nothing has changed in the game.

## The shape rules (proposed, style-independent)
1. **Built from soft primitives.** Circles, ellipses, capsules, rounded
   rectangles and blobs. Each object should pass the "squishy toy" test: it
   could be a soft toy next to the pets.
2. **Corner radius ≥ 25% of the shorter side** on any rectangle wider than
   about 12px. Furniture, signs and boards included.
3. **No hard polygon corners.** Straight-edged closed paths get rounded
   joins, with a curve or arc at every corner.
   - Exempt (sharpness is the point): stars, sparkles, letter glyphs, and the
     tips of leaves and beaks.
4. **Round line joins and caps** on every stroke
   (`stroke-linejoin="round"`, `stroke-linecap="round"`).
5. **Scalloped or soft edges for big masses.** Grass and hill horizons use
   soft bumps, never a ruler line.
6. **Proportion.** Props sit chunky and low, like the pets: a wide base, a
   slightly oversized top (roof, canopy, lid) and short legs or posts.

## What the code has today (literal SVG in the art modules)
| Module | Closed straight-edged shapes | ≈ Hard corners | Rects without `rx` | Stroked paths without round joins |
|---|---|---|---|---|
| LettersArt.js (icons, stickers, map stops, mascots) | 65 | 281 | 2 | 319 |
| LettersGardenArt.js (pond, potting, picnic scenes) | 30 | 96 | 0 | 125 |
| LettersRoomArt.js (stand, treasures, room props) | 17 | 85 | 0 | 112 |
| LettersMapArt.js (map landmarks) | 15 | 43 | 1 | 49 |
| LettersActivityArt.js | 8 | 33 | — | — |
| StickerScenes.js | 5 | 15 | 8 | 23 |
| VillageArt.js (village, new today) | 4 | 16 | 2 | 61 |
| LettersAnimalArt.js (the cast) | 2 | 2 | — | — |

Some of the hard corners are exempt stars and sparkles, so the real count is
lower. The cast (pets and friends) is already round, which is the bar the
rest should meet.

## Priority order once a style is chosen
1. **Shared UI kit:** buttons, tabs, cards, plaques and progress seeds. They
   appear on every screen.
2. **Village and map landmarks**, VillageArt and LettersMapArt. They're the
   first impression and few in number.
3. **Room props and the sticker stand**, LettersRoomArt.
4. **Game scenes**, LettersGardenArt: the pond, potting table and picnic.
5. **Icons and sticker motifs**, LettersArt. It's the biggest file, but each
   asset is small.

Suggested models: steps 1–2 Fable (they set the language); steps 3–5 Sonnet
(applying an established rule set).
