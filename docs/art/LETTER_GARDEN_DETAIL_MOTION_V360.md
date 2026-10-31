# Letter Garden v360 — detail and motion review

Completed locally, October 28, 2026. Audio and publishing remain parked.

## Review basis and expected result

Reuse the [523-sample, 44-family catalogue](LETTER_GARDEN_ART_CATALOGUE_20261028.csv)
and [v359 composed-screen review](LETTER_GARDEN_ART_SYSTEM_REVIEW_20261028.md).
These samples include variants, not 523 distinct drawings. This is a second,
purpose-and-attention review, not a claim that every drawing was replaced.

A child should recognize a silhouette, its useful part, then its decoration.
The house retains a pet-sized door, windows, leaf roof and chimney; the bench
can seat friends and the chest remains a container. Handles, basket rims, parcel
folds, boat sails and plant stems explain construction. Decorative lines should
not compete with Arabic dots, choice states or stars. Terrain can be layered;
small objects use the same warm outlines and restrained flat materials.

Motion should answer the child's action. Demonstrations must show where an
action ends; the child can interrupt or replay them. Other moving objects should
not compete during a letter task. A celebration should feel warm and then rest.
These principles are consistent with W3C guidance on
[interaction animation](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions)
and [ongoing movement](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide).
The precise timings below are design judgments, not validated thresholds for ages 4–6.

## Family decisions

The table accounts for every existing catalogue family. Retained families keep
their v359 material/proportion corrections. No unrelated redraw or gameplay
rewrite was needed to satisfy the detail review.

| Families | Detail / motion decision |
|---|---|
| Village (13), Environment kit (8) | Simplify distant trees: fewer leaf ticks, bark marks and fruits; keep trunk, roots, branches and canopy. House, stand, bench and chest scale retained. Village gets its own quiet life. |
| Landscapes (28), Weather (8) | Retain terrain, pond, boat, night colour and seasonal identity. Suppress secondary falling/creature/weather overlays during learning; remove duplicate layers behind the village. |
| Map nodes (9), Map landmarks (24) | Retain educational signs, visible stars and constructed landmarks. The village gate medallion and light pool no longer swing/pulse together. Existing still current-map-stop treatment retained. |
| Pets (8), Pet expressions (20), Shared cast (4), Wardrobe (42) | Keep anatomy, facial proportions, clothing anchors and chosen colour. Learning idle gaze rests; touched-object gaze/reach and feedback remain. Reduce wing/arm speed and idle amplitude; no perpetual reward dance. |
| Letter friends (28), shared-friend-art (1) | Retain readable letter silhouette and dots; facial details do not replace teaching ink. Short response gestures remain; group celebrations settle. |
| Controls (19), LettersArt (17) | Preserve optical alignment and coloured home control. Clear teaching paper; fade screen entry without zoom. Finite hints and smaller single particle bursts, no pointer glitter during learning. |
| Stickers (36), Sticker backings (16), Sticker scenes (4) | Retain strengthened contours, distinct silhouettes and scenery construction. No changes to placement, ownership or completed removal work. |
| Garden rewards (20), Treasures (18) | Keep recognisable reward motifs, planted-state changes and warm gold. Stars remain unobstructed. Main celebration settles; earned appearance is persistent. |
| Rooms (7), ToyChestArt (6) | Retain room materials and furniture purpose. Packs/gifts sway briefly within long rest cycles; rosettes no longer swing continuously at the old pace. |
| LettersActivityArt (36), GardenAdventurePlayArt (8), PracticeFinishArt (2) | Preserve shared scene frames, chapter-specific props and completed state. Quieter backdrops, one local burst, and still reduced-motion presentation apply across hosts. |
| WatersideArt (11), DeliveryPlayArt (5), WaterPlayArt (1), SandPlayArt (2), LetterStudioArt (8) | Retain banks, water routes, baskets, tool grips and drawing surfaces. Immediate drag/trace tracking stays unchanged. Clear paper and resting companion reduce competition. |
| PuzzlePlayArt (15), ToyStudioArt (12), FormPlayArt (7), WorkshopShadowArt (7) | Keep piece seams, slots, hinges and silhouettes that explain assembly. Two gentle hint cycles then a static outline; functional moving answers and shadow tasks remain. |
| BookPlayArt (9), LivingBookArt (5), FriendBookArt (2), WordWardrobeArt (4) | Retain bindings, page layers, stages and garment cues. Educational letter/word display remains primary; learning host applies quiet ambient treatment. |
| HuntPlayArt (29), LookPlayArt (6), BalloonPlayArt (5) | Keep readable targets and environmental hiding places. Preserve movement that is part of finding/catching; do not apply a global speed multiplier. |
| FriendPlayArt (3), TogetherPlayArt (3) | Keep shared play props and character silhouettes. Group reward gestures are finite; child-triggered reactions remain. |
| SoundLabArt (1), EarsPlayArt (6) | Retain visual distinction between listening tools and answers. Shared attention treatment applies; no audio or unfinished drum work is claimed complete. |

## Implemented behaviour

- Learning hosts retain scenery but rest secondary ambient creatures, weather,
  falling particles and pet fidgets. Pet gaze still follows the child's touched
  object. The large village cottage and existing touch areas stay intact.
- Small village trees omit fine leaf marks and use three fruits. Hero trees
  retain full detail. Clear teaching paper cannot be mistaken for letter dots.
- Village chest/sundial accents have 9–11 second cycles with substantial rest;
  smoke and small creatures move over 8–10 seconds. No duplicate global butterflies.
- Screen entry is a 280ms fade. Main cheer plays once over 850ms. The intro card
  no longer pulses while its speech bubble jumps. Ordinary hints settle after
  two cycles, retaining static shape/colour cues.
- Hand demonstrations wait 1.1s, show separate taps or a 2.6s drag with a 390ms
  destination hold, and vanish immediately on input. Help remains replayable.
- Particle bursts are capped at one layer: 8 ordinary or 14 celebration pieces,
  smaller travel and rotation. Screen changes clear leftovers. Pointer glitter
  is disabled during learning. System and in-game reduced motion stop CSS motion.

## Verification and limitations

- **1,682 automated tests pass**, including interrupted demonstrations, held
  destination, neutral learning gaze / touched-object response, bounded particle
  cleanup, smaller tree markup, scene cleanup and existing learning/reward tests.
- **523 catalogue recipes render** with no missing/undefined geometry. Palette
  scan: zero off-palette colours. The same 36 structural stroke uses across 12
  widths remain; no mechanical anatomy/path changes to satisfy a scanner.
- Adult browser checks at 320×568, 390×844 and desktop 1280×720 / 1280×800.
  Village day/night retains scenery and proportion. Smallest village control
  dimension observed at 320px: 52px. Cottage navigation works.
- Actual intro: wake, replay and continue. Matching: two boards, child-led next,
  earned three stars, chapter celebration and available return actions. Repeated
  with in-game reduced motion for a complete board and its reward transition.
- Phone feeding: replay hand demo, drag real packet into basket during guidance,
  confirm successful delivery and press Continue. No input delay was added.
- Phone chapter reward: boat, pet, three stars, friends and action buttons remain
  visible; main cheer is finite and particles are removed. Reduced-motion village
  smoke, fireflies and chest accents compute to no animation.
- Silent isolated review origin protects user progress. A fixture initially
  omitted starTotal, causing NaN in its synthetic chapter summary; fixture fixed
  and the full matching-to-three-star-party route rerun successfully. No
  production scoring code was changed. Normal preview is checked separately.
- Normal local preview loads the updated art with existing saved progress and no warning/error logs. [Preview image](../letter-garden/reviews/detail-motion-v360/live-preview.png).
- This is not a full playthrough of every game, OS-level preference emulation,
  physical-touch-device test, audio test or child sensory-comfort validation.
  System reduced-motion CSS is covered by inspection; the in-game setting was
  exercised in the browser. Child playtesting remains necessary.

## Evidence and recovery

[Before village](../letter-garden/reviews/detail-motion-v360/village-before.png) ·
[After village](../letter-garden/reviews/detail-motion-v360/village-after.png) ·
[Small night village](../letter-garden/reviews/detail-motion-v360/village-night-small.png) ·
[Introduction](../letter-garden/reviews/detail-motion-v360/meet-desktop.png) ·
[Phone feeding](../letter-garden/reviews/detail-motion-v360/feed-phone.png) ·
[Phone reward](../letter-garden/reviews/detail-motion-v360/party-phone.png).

Per-file local baseline: `.qa/baselines/v360/RESTORE.md`. Restore only affected
files, never reset the dirty checkout. v359 and suspended v358 remain preserved.

Next: try one unfamiliar-letter introduction, feeding, and its reward with a
child. Observe whether they understand the action without help, can act before
the demo finishes, and notice the reward without being distracted by the world.
Reopen a completed area only for a specific observed issue.
