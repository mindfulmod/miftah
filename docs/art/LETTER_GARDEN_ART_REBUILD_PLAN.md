# Letter Garden — inventory-first art and game improvement plan

Status: proposal only. No game code, CSS, assets, progression, audio, or preview version changed for this review. This plan supersedes treating the September 6 shared-CSS pass as a completed art overhaul.

## What went wrong

The screenshots show two different classes of failure: scene composition and drawing quality. Improving component borders did not solve either adequately.

1. **Flowers cover stars.** `renderHome()` independently places `map-bloom` at the completed stop's anchor. `.map-bloom` adds a 26px vertical offset. The enlarged star plaque occupies the lower portion of that same stop. There is no shared layout contract or reserved reward area. Enlarging stars without relocating the bloom created a collision. The bloom animation also animates `transform` on the same SVG group that has a positioning transform; that is a separate risk to investigate under normal motion, not an established sole explanation for the screenshot.
2. **The pond becomes a generic panel.** The curved aqua pond rule is scoped to `.lg-boat-chapter [data-activity="pop"]`. The new `letters-art-pass.css` rule gives *every* non-Boat `.play-stage` the same cream rectangular surface. The same activity therefore changes its visual identity by chapter. The screenshots show different chapters/targets, not a fair before/after of one exact state; the code confirms the unwanted inconsistency.
3. **Meadow decorations look like balloons.** `biomeDeco('meadow')` draws three colored ellipses on bare stems. They lack petals, leaves, grouping and a ground plane. Restoring their visibility did not improve their design.
4. **Shared selectors caused collateral changes.** `.lg-home` named both a map screen and a Home button. Similar broad selectors conflate a game's surface with its chapter. Successive override blocks make final styling difficult to reason about.
5. **The review was too shallow.** Automated checks mainly verified logic and bounds. Contact sheets and small screenshots were used too heavily for art judgment. Reduced-motion fixtures missed normal-animation interactions. A completed first stop near the viewport edge was not inspected at full size with every decoration active. Calling that a full art pass overstated the evidence.

These are failures of my implementation and review process. A newer model does not fix an SVG merely because it loads it; deliberately redrawing and checking the asset is still necessary.

## Inventory and scope

`LETTER_GARDEN_VISUAL_INVENTORY.csv` is the working checklist: **227 logical review items** extracted and organized from the live art renderers, game screens, CSS and mini-games. Counts include reusable elements and game-specific uses, not 227 unique asset files. Color, pose, progress and interaction variants are recorded in each row rather than expanded into thousands of duplicate entries.

| Inventory family | Count | Coverage |
| --- | ---: | --- |
| Individual sticker drawings | 36 | Every named sticker, ownership and reveal states |
| Individual accessories | 14 | All original accessories and species-fitted variants |
| Selectable pets | 8 | Blob, Lumi, Mina, Rafi, bunny, chick, cat, dragon |
| Legacy expression definitions | 7 | Plus the corresponding animal pose mapping |
| Named UI icons | 14 | Including speaker, Home, replay, next, star, calendar, book |
| Biome decoration kits | 6 | Meadow, orchard, lagoon, night, peaks, river |
| World and pond components | 18 | Sky, water, shore, trees, hills, boat, reeds, flowers, etc. |
| Map/progression elements | 18 | Coins, trail, stars, current marker, growth stages, toolbar, etc. |
| Other character/hatch components | 6 | Key, card presenter, legacy Feed creature, egg/cracks/nest |
| Shared interface elements | 12 | Controls, prompt, progress, tiles, wallet, adult panels |
| Introduction elements | 5 | Bud, parts, card, reveal, listen cue |
| Practice-entry pictures | 3 | Feed, dots, paths |
| Reward, pet-room and collection elements | 14 | Results, skill flower, shelves, album, pack, stamps, etc. |
| Effects and motion families | 12 | Butterfly, firefly, sparks, confetti, feedback, shadows, etc. |
| Props across 14 activity entries | 54 | Every named game's stage and interaction-specific parts |

All 36 sticker IDs: sun, moon, star, rainbow, palm, flower, butterfly, bee, dove, fish, boat, lantern, key, egg, cat, cloud, camel, elephant, ant, spider, crow, hoopoe, whale, fig, olive, dates, pomegranate, grapes, honeycomb, waterdrop, mountain, nest, feather, shell, turtle, snake.

All 14 accessory IDs: cap, crown, bow, glasses, scarf, flower, balloon, wand, taqiyah, cape, medal, kite, sprout, moonpin.

Scope is live Letter Garden. Prototype art is reference or a reusable source only. Unloaded prototype experiments and other Miftah pages are excluded. Speech remains paused. Curriculum letters and Arabic text remain live font-rendered content, not generated pictures.

## The proposed visual direction

Use the older pond screenshot as the scene anchor: curved shoreline, aqua water, visible garden beyond the play area, a grounded boat/reeds, and a large friendly animal presenting the letter. Preserve the established garden palette and approved animals. Improve craft through intentional silhouettes, clear ground contact, consistent light and better proportions.

The priority order on a learning screen is **target letter → usable answer/action → friendly guide → scenery**. On the map it is **current level → earned progress → destinations → decorative growth**. Decoration must never cross the glyph, stars, controls or input area.

- Water looks like water: curved bank, restrained aqua depth and a few edge ripples; no rectangular translucent sheet replacing it.
- Plants look like plants: identifiable petal groups, tapered stems, a few leaves and a grounded cluster. Avoid three circles on sticks.
- Materials have different identities: paper boat folds, seed packet corners, woven basket, soft soil, water reflections. Reusing the same rounded rectangle for every object is not cohesion.
- Characters keep recognizable silhouettes and large open eyes. Refine existing art without retiring owned pets or changing accessory behavior.
- Shapes carry most detail. Use a small consistent outline/value system, not extra outlines, arbitrary gradients or glow everywhere.
- Keep learning glyphs isolated from decorative spots and marks, especially dots that could be confused with Arabic dots/harakat.
- Animate a child action briefly. Ambient motion belongs behind play; reduced motion retains the same meaning and final layout.

## A plan for every existing game

Each row is a proposal, not a silent mechanics change. Existing item selection, answer keys, curriculum order, ownership, scores and payouts remain the starting constraints. New teaching aids or difficulty changes require separate comparison against that game's current rules.

| Activity | Existing learning task | Proposed scene and interaction refinement | Acceptance focus |
| --- | --- | --- | --- |
| **Pop** | Hear/recognize the correct letter | A pond in every chapter, with large floating letter pieces and a short ripple on a correct choice. Keep beginner two-choice introduction. Decide moving versus resting advanced targets explicitly rather than changing it incidentally in CSS. | No offscreen or overlapping options; 2/3/4 choices, every chapter, normal/reduced motion. |
| **Catch** | Identify and catch the requested falling item | Orchard canopy above and a grounded woven basket below. Clear entrance/landing lanes and a readable target; briefly celebrate a correct landing. | Visibility throughout fall; no clipping behind prompt; basket reach on phone and keyboard/tap alternatives where supported. |
| **Pairs** | Match duplicates or form to isolated letter | Matching bed of leaf/paper cards. Clear selected and paired states; matched pieces settle into a small pair grouping. Preserve the current open matching mechanic; do not assume this is a hidden-card memory game. | Identical/form matching, selected state, errors, last pair, replay; no color-coded answer giveaway. |
| **Feed** | Select the requested letter and deliver it | A garden picnic: selected pet, coherent seed/food packets, a substantial basket/drop zone. Pet attention leads toward the basket; thank-you follows delivery. | All pets, tap and drag, missed drops, cancel, repeated input and ownership preserved. |
| **Trace** | Follow the letter's coverage shape | A tactile drawing bed with a clear guide, clean stroke trail and gentle completed-letter reveal. Calibrate warm sand versus existing paper before adoption. | Real letter shapes/dots, responsive canvas, pointer exit/re-entry and input during success; no new handwriting mastery claims. |
| **Burst** | Rapid recognition within the existing timed round | Compact flower/seed sorting area with restrained round progress. Keep timing legible without making it visually dominant. Recommend a separately approved relaxed option for beginners. | Timer/score integrity, pause/background behavior, no distracting burst effects; do not silently remove time rules. |
| **Build** | Assemble a whole from ordered parts | Garden workbench with clearly shaped part sockets and a tray. Reveal the real whole at completion, showing how the pieces relate. | RTL order, decoys, wrong placement and joined glyph accuracy. |
| **Blend** | Combine a base with its mark/sound component | A calm combining station where the mark visibly moves to its correct position. Use the same part sizes and mark presentation as the curriculum. | Harakat positioning, replay, input while combining, final sound/letter alignment. |
| **Fuse** | Join two letters | Connected stem/path metaphor around the real letters. Demonstrate the joining seam and final shape; do not warp letters as decorative vines. | Connectable/nonconnecting forms, correct ligature/text shaping and retained mechanics. |
| **Unfuse** | Split a joined form and recognize parts | A clear join with two grasp points; separate smoothly and keep both parts visible for the follow-up question. | Original/split shape relationship, pull/tap affordance, reset/replay and no ambiguous handles. |
| **Chain** | Extend a joined pair | A growing garden path with one unmistakable open connection. Show the chosen addition and the resulting real word/form. | Third-part choices, RTL flow, long strings, contact point and no offscreen result. |
| **Parade** | Explore letter position forms | Three distinct but equally readable form places, with the isolated reference above. A brief contextual reveal explains each position visually. | Initial/medial/final forms, order, all three targets visible; do not add graded rules without agreement. |
| **Dot Garden** | Place exact dot count/side, then recall | Clear soil/seed placement area with a large letter skeleton. Seeds become crisp Arabic dots; decorative seeds stay away from the learning glyph. | Count AND side, triangular three dots, undo, recall stage, missed input and saved-progress neutrality. |
| **Garden Paths** | Guided drawing, then independent copy | The same drawing material as Trace, with a clear guided-to-copy transition and the reference outside the drawing region. | Touch coverage, clear/guide controls, no accidental completion; still participation practice, not graded handwriting. |

Feed's permanent-practice entry reuses Feed rather than inventing a fifteenth mechanic. Daily practice and check-up orchestrate these activities; they receive their own entry/result review, not duplicate game implementations.

## Plan for every non-game screen and art family

- **World map:** make one level-stop composition own the coin, glyph and star plaque. Put completion flowers in a separate side bed and mastery growth in another reserved slot. Define safe areas before drawing. Refine all six biome kits into recognizable habitat miniatures; start with meadow flowers. Keep current-level navigation and saved rewards.
- **Hatch/introduction:** refine egg, nest and key/card presenter as an introduction family. Review all crack states, bud wake-up, assembly and replay, not just the final revealed card.
- **Pets:** calibrate one approved animal plus the key and legacy blob together at actual sizes. Then review all eight pets, all supported colors/stages/poses and all 14 accessories. Keep large characters; simplify shelf density or allow scrolling before shrinking the pet out of prominence.
- **Stickers:** make a contact sheet of all 36 actual motifs, then redraw each individually in themed batches (sky/garden, creatures, food, objects). Preserve IDs and ownership. A better sticker rim does not count as redrawing the picture.
- **Rewards:** compose stars, pet and earned environmental change together. Keep the boat visible where appropriate. Later habitat rewards should relate to the chapter rather than adding the same boat everywhere as a quick filler; introduce no new payout or progress state without agreement.
- **Practice hub:** its three pictures must reuse the finished Feed/dot/tracing art, so the destination looks like the button. No text dependency.
- **Wardrobe/album/stamps:** reserve fixed spaces for pet, prices, selected states and collection art. Test empty/full/partial collections and long months. Preserve the existing currency model.
- **Icons/controls:** one source for each icon; clear default/pressed/focus/disabled/muted states. Keep the Home-button style separate from map layout. Replace platform-dependent emoji/tool glyphs when a consistent drawn control is appropriate.
- **Effects:** independently review every effect listed in the inventory. No ambient butterfly over a star count, no confetti over Continue, no transform animation replacing an asset's placement transform.
- **Grown-up area:** preserve readable text and data; focus on clarity, not child-facing decorative metaphors.

## How to use the model more effectively

Use the available model for detailed scene diagnosis, deliberate vector redraws, consistent family variations and comparison against concrete acceptance conditions. The useful output is a better individual flower, boat, basket or character pose in the live scene—not a claim of improvement based on the model name.

Native SVG remains suitable for this game's scalable art, animated characters and props. Image generation can help explore an unresolved illustration direction or create a genuinely needed raster background; it should not indiscriminately replace working SVGs. Generated pictures must never bake in the Arabic curriculum text or become a source of unverified letter shapes. No generation batch starts until the representative scene reads well at gameplay size.

## Order of work and review gates

1. **Inventory and direction (this deliverable).** Keep the current build unchanged. Agree on the pond/garden anchor and the per-game identity before another implementation pass.
2. **Repair/calibration slice.** Build a completed Boat map stop showing all stars and flowers, the next chapter's Pop pond, and that activity's result screen. Include a new meadow flower cluster and one refined basket/boat asset as craft samples. These are real live-game scenes, not another disconnected prototype. Present full-size before/after captures for review before spreading changes.
3. **Asset-family pass.** Finalize environment, prop, character, icon and effect rules from those samples. Redraw assets in small named batches with the inventory tracking each item as pending, revised, reviewed or accepted. Never mark a family complete merely because shared CSS changed.
4. **One activity end to end.** Begin with Pop, then Feed and Trace, then matching/assembly/joining activities, then Burst and the optional practice activities. Include entry, hint, action, mistake, success, completion, replay and world return for each.
5. **Collection and long-progression pass.** Finish all pets/accessories/stickers, late chapter forms, daily/check-up outputs and fully progressed maps. Review both artwork and saved-state compatibility.

## What must pass before a batch is called done

- Full-size evidence at 320×568 and 390×844, tablet and desktop. Contact sheets help compare families but cannot approve detailed artwork or clipping on their own.
- Map states: untouched, current, completed with 1/2/3 stars, all four mastery stages, neighboring completed levels and all-complete; inspect normal animation as well as static/reduced motion.
- Every activity: first encounter and replay, supported choice counts, shortest/tallest/widest relevant glyphs, correct/wrong input, interrupted animations, resizing and return navigation.
- Automated geometry checks for protected areas: no intersection between map plaque and decorative art; no option overlaps or offscreen required targets. Normal-animation checks include the motion envelope, not only the resting rectangle.
- Per-activity screenshots from more than Boat Letters. Surface selection must follow activity/habitat intentionally; no broad non-Boat selector can replace it accidentally.
- Representative real play-throughs and existing progress/reward tests. Separate “looked at” from “played through” in the report.
- Verify the document and CSS/JS versions actually loaded in the local preview. The previous cache issue must not invalidate comparisons.
- No publishing. Keep a recoverable per-batch baseline and show the proposed slice before expanding it.

Recommended first approval target: **one complete map-stop composition + restored/refined Pop pond in Boat and the next chapter + its result screen**. This resolves the supplied screenshots and establishes a reliable art anchor for the rest.
