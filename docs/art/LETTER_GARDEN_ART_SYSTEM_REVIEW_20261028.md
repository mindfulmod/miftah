# Letter Garden full art system review — October 28, 2026

## Scope and recovery

Live Letter Garden only. Audio, parent page and production publishing remain
parked. Curriculum, learning mechanics, earned progress and reward IDs remain
unchanged. The unfinished v358 drum work is preserved separately.

The pre-pass working files are preserved under `.qa/baselines/art-20261028/`:
169 working files plus two affected historical test files, with SHA-256 checksums and per-file restore instructions in `RESTORE.md`.
This baseline includes earlier uncommitted work; do not restore by resetting Git.

## Full source inventory

The source audit covers the village/map; 8 pet species and wardrobe; 28 letter
friends; 36 sticker motifs; 16 treasures plus seasonal specials; decorative
rewards; indoor rooms; 4 sticker scenes; control symbols; landscape/time/weather
layers; shared DetailKit; and the activity art modules listed below. Dormant
classic implementations and prototype/reference assets are distinguished from
live renderers. Full variant recipes and exclusions are recorded with the review.

Activity families: Balloon, Book, Delivery, Ears, Form, FriendBook, FriendPlay,
GardenAdventure, Hunt, LetterStudio, LivingBook, Look, PracticeFinish, Puzzle,
Sand, SoundLab, Together, ToyChest, ToyStudio, WaterPlay, Waterside,
WordWardrobe, WorkshopShadow, LettersActivityArt, and shared LettersArt.

Initial contact sheets covered 400 named variants (including expression and
wardrobe combinations). Corrected recipes add activity planes and shared assets.
The final catalogue contains **523 samples in 44 families**, including expressions,
size variants and time-of-day variants. These are not 523 unique drawings.
Rendered sheets distinguish intrinsic geometry from runtime placement. Review
fixture sizing failures are corrected in the fixture, not counted as game bugs.

## Expectations before implementation

| Family | Observed issue / expectation | Treatment |
|---|---|---|
| Village | House and chest almost equal width; bench larger than house; stall uses a different anchor | Larger, better-proportioned cottage facade; calibrate all three layouts together; keep minimum touch pads |
| Village companion | Animal HTML wrapper inserted into SVG leaves empty pet group | Valid embedding retaining pet hue, clothes, expressions and input |
| Landscape | Night village foreground becomes navy/muddy | Foliage green ground/shadows, dark sky; preserve daytime scenery |
| Pets / wardrobe | Glasses have detached temple stroke; accessory palette differs from world | Fix path; reconcile approved palette; preserve anatomy and selected hue |
| Letter friends | All 28 are readable at proper scale | Retain educational outlines/dots; no unnecessary redraw |
| Stickers | Pale silhouettes disappear on paper and light scenery; some legacy colours | Selective warm contour corrections; readable at small size; preserve ownership and placement |
| Treasures | Newer construction and silhouettes are consistent | Retain; check small album/scene placements |
| Shared props | Boat/baskets/wood/felt vary between old and new families | Reconcile materials and contact shadows where differences reduce coherence |
| Activity planes | Older object gradients conflict with newest flat-object language | Flat timber/felt fills with restrained detail; preserve scenery and answer space |
| Controls | Monochrome icons are legible but composition matters | Retain function; check coloured home control, optical alignment, minimum targets |
| Rewards / rooms | Need actual-screen verification beyond fitted assets | Check reward stars, pet feet, shelf art, seed packets and all glyph bounds |

## Review policy

A family may be retained after review. Redrawing everything would discard working
art without improving consistency. Every edit needs a concrete visual reason.
Final evidence must distinguish code review, contact-sheet review and live screen
checks. No claim that an entire mini-game was played merely because its art was
rendered in a catalogue.

## Implementation and verification

Completed locally as the v359 art revision; nothing published.

### What changed

- **Village:** enlarged the cottage facade and pet-sized doorway; retained its leaf roof, heart plaque, flowers, chimney smoke and night windows. Recalibrated the cottage, stall, bench, chest, sundial and companion together across phone, tablet and wide compositions. Corrected the stall's inconsistent anchor. The cottage roof is approximately 2.1–2.2 times the chest body width, while the bench stays smaller than the house.
- **Pet placement and rotation:** replaced an invalid HTML-in-SVG insertion that left the village pet invisible. The companion retains its chosen hue, wardrobe and rig inside a valid SVG foreignObject. Switching layout families during rotation now rebuilds the composition rather than leaving the previous scene size.
- **Materials and characters:** reconciled the animal/accessory palette with the approved world colours; connected the glasses' right temple; flattened legacy key/blob fills. Enlarged the fallback feeding friend's eyes, removed its duplicate mouth and replaced pointed teeth with two rounded teeth. Pet anatomy, educational letter shapes, moods and saved selections remain.
- **Stickers and props:** strengthened faint sticker silhouettes while retaining lighter internal detail. Rebuilt the packet's rounded flap/outline, clarified reed and stone silhouettes, flattened paper on the reward boat, and moved meadow reward seedlings above the terrain so they remain visible.
- **Activity materials:** flattened the older matching-board felt/timber and parade lining, preserving their frames, props, scenery and learning space. Reconciled a few remaining pale paper colours in activity CSS.
- **Night village:** foliage-green ground and shadows preserve legibility beneath the dark sky. No global scene tint or background removal was introduced.

### What was retained

The 28 educational letter friends, newer constructed game props, map landmarks, treasure silhouettes, sticker scene buildings, most room art and control symbols already fit the current direction. They are catalogued as retained, not claimed as new art. Current game backgrounds, the boat/pond vocabulary and all curriculum/reward IDs remain. The classic exports remain available but are identified as alternatives in the source inventory.

### Evidence and limits

- The combined suite passes **1,678 checks**; the directly affected legacy expectations were updated for the new cottage geometry, exports and cache version. Added runtime checks cover responsive scene families and scale relationships. Shared-art checks pass after the final packet/face refinements.
- All **523 catalogue recipes** return drawable markup without missing/undefined geometry. The palette scan covers **132 art files** and reports **zero off-palette hex colours**. It still reports 36 structural stroke uses across 12 widths; these include material ribbons, paths and anatomy and were not mechanically changed to pass a scanner.
- Adult browser review covered the village at **320×568, 390×844, 1024×768 and 1280×800**, including phone/tablet/wide rotation and day/night. The smallest measured village landmark dimension was **55.3 CSS px** at 320×568. The previously empty animal pet now has visible SVG content and a 77×89 px footprint at 390×844.
- Actual composed screens inspected: village, wardrobe, sticker album, treasure shelves, sticker scenery, journey map, practice finish, fishing pond, friend matching, drawing studio and chapter matching board. Cottage navigation and board input remain responsive. Reduced-motion village smoke reports no animation. The final ordinary preview loads the new cottage and companion with existing saved progress and no warning/error logs. This is **not** a claim of complete playthroughs of every mini-game.
- Contact sheets review silhouettes, palettes, anchors and variants. They do not verify every animation, seasonal arrangement, child gesture or physical-device rendering. Static weather/year layers and DOM-only helpers are documented separately. Child playtesting and physical-device checks remain unperformed. Audio stays parked.
- Tests/browser fixtures use an isolated local origin with a review pet/progress and silent speech stubs. No user progress was reset. The representative screenshot fixture has a small adult review toolbar.

### Inventory and comparison files

- [Named catalogue, 523 rows](LETTER_GARDEN_ART_CATALOGUE_20261028.csv)
- [Read-only contact sheet](../letter-garden/reviews/art-system-20261028/index.html)
- [World source inventory](../letter-garden/reviews/art-system-20261028/world-source-inventory.json)
- [Game source inventory](../letter-garden/reviews/art-system-20261028/games-source-inventory.json)
- [Static-review limitations](../letter-garden/reviews/art-system-20261028/review-limitations.json)
- [Render smoke check](../letter-garden/reviews/art-system-20261028/render-check.json)
- [Measured tap targets](../letter-garden/reviews/art-system-20261028/touch-target-check.json)
- [Night phone before](../letter-garden/reviews/art-system-20261028/village-before-phone.png) / [after](../letter-garden/reviews/art-system-20261028/village-final-phone-night.png)
- [Actual preview with existing saved progress](../letter-garden/reviews/art-system-20261028/live-final.png)
- [Desktop after](../letter-garden/reviews/art-system-20261028/village-final-wide.png)

Existing raster/prototype inventories remain historical references in ASSET_MANIFEST.csv and LETTER_GARDEN_VISUAL_INVENTORY.csv. The live Letter Garden entry/scripts/styles reference no external raster art; its game artwork is procedural SVG/CSS. Unrelated Miftah navigator/island art and unused squirrel prototype images were not edited.

### Why these inconsistencies accumulated

Art was previously evaluated as isolated thumbnails while runtime placement used several different anchors and scales. Older shaded-object rules also coexisted with the newer flat-object direction. This revision records a single current material rule and responsive scene contract, and separates catalogue review from composed-screen evidence. Future changes should preserve that distinction.

### Next review

Try the village on a phone, open the pet's cottage, and compare the house/bench/chest scale. Then browse stickers and play a familiar activity to judge whether the same world carries through. Reopen completed art only for a specific observed mismatch or new design request. The interrupted v358 drum work remains separate and unfinished; this art revision does not claim it complete.
