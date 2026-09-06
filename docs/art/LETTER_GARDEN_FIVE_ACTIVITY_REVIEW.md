# Catch, Fuse, Unfuse, Chain and Parade

Local preview: `letters.html?v=20260906-five1`. This is five activity passes, not completion of the entire art inventory. No publishing or audio-service changes.

## Changed

- Catch: leaf-framed falling pieces, orchard branches and leaves confined to the upper edges, woven basket reused from Feed. Basket movement is clamped by its visible width to prevent it disappearing off the sides. Falling content is clipped to its own field. Existing timing, heat, catch thresholds, question selection and scoring remain.
- Fuse: a defined combining surface and restrained center marker, matching the wooden pieces introduced in the preceding batch.
- Unfuse: matching wooden whole/parts, readable outward arrows and seam marks outside the glyph face. Retains both pulling and the existing three-tap fallback. Quiz choices fit the phone width.
- Chain: a connecting path beneath the pieces and a centered expanded result. Uses the same wooden letter material. Pointer coordinates account for display scaling; cancelled drags return home.
- Parade: three drawn reveal gates replace platform-dependent sparkle emoji; the isolated reference and revealed positional forms use matching paper-faced pieces. Preserves the three-form exploration, without adding grading.
- Unfuse/Chain prevent repeated input during success; delayed work stops on exit. Parade cancels delayed completion on exit. Catch removes movement/resize listeners and fallers when finished or destroyed.
- Normal-motion QA exposed a pre-existing hint bug: `transform` animation replaced the centered anchors of draggable pieces and Chain's target. Dedicated hint animations now retain those anchors. This also fixes the shared Blend hint.

Learning data, Arabic shaping, choice keys, progression storage, pet ownership and reward calculations are preserved. Garden scenery outside these activity surfaces remains.

## Verification

- All five played to rewards at 320×568 in isolated QA: Catch with basket movement and a two-star result; Fuse with a decoy retry; Unfuse through four quizzes including wrong-answer recovery, dragging and three-tap fallback; Chain with decoy retry; Parade through all three letters/three reveals.
- Replay and Home checked after completion for all five.
- Chain normal-motion audit: 80 samples over eight seconds at each of 320px and 1024px, zero required-piece bounds outside the field.
- Phone comparisons inspected with reduced motion. Desktop entry layouts reviewed separately. These are not full desktop curriculum play-throughs.
- 27 automated tests pass. New tests cover duplicate split/add/reveal protection and leaving Unfuse, Chain or Parade during delayed completion. JS syntax check passes.
- All game play used the separate `five-qa.localhost` origin. The user's saved garden was not seeded, reset or spent.

Remaining: physical touch-device testing; full phone/tablet/orientation matrix; every long word, harakat and curriculum variant; Catch spawn-overlap behavior and a broader edge-catch matrix; persistent reward checks across reloads. Catch still falls under reduced motion because falling is its existing core mechanic. Its before/after screenshot compares scene treatment, not synchronized faller positions.

## Recovery and comparisons

`.codex-checkpoints/letter-garden-five-20260906/before.tar.gz` preserves the pre-pass HTML, MiniGames source, art stylesheet and tests. Extract elsewhere and selectively restore only after preserving later work.

That directory contains `catch-comparison.jpg`, `fuse-comparison.jpg`, `unfuse-comparison.jpg`, `chain-comparison.jpg`, `parade-comparison.jpg`, and the real baseline/current QA fixtures. The CSV marks this batch implemented but awaiting owner review, not accepted or fully verified.
