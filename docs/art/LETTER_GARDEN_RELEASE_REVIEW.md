# Letter Garden local art and learning update

This branch collects the live Letter Garden work from the local review passes. It preserves the existing curriculum, game identities, pet ownership, reward storage and progression keys. It does not include other uncommitted Miftah work or a disconnected prototype. Deployment is separate from pushing this review branch.

The preceding review documents record the map, pond, Feed, Trace, Pairs/Build/Blend and five-activity batches, including their limits. The visual inventory tracks implemented versus pending work. The complete 227-item art inventory is NOT finished: collection/sticker redraws, all pets/accessories, some environment families and the full device/curriculum matrix remain.

## Final activity pass

- Burst now uses leaf-framed pieces in a harvest bed; the timer remains visible and its existing 30-second rule and score thresholds remain. Its fallback interval no longer starts extra requestAnimationFrame loops.
- Dot Garden gets a clearer practice bed, drawn seed/check/replay controls and a drawn replay cue. Exact dot count/side and subsequent recall remain unchanged.
- Garden Paths shares Trace's paper/wood direction with drawn clear, guide and finish controls. It still offers guided drawing followed by independent copying and remains participation practice rather than handwriting grading.

## Validation

- 28 Node tests pass (`node --test src/letters/tests/*.test.cjs`), including a new Burst timer scheduling/single-completion regression.
- Browser at 320×568: Burst correct selection, timed result, replay and Home; all Dot Garden construction/recall phases with wrong placement and undo; all three guided/copy pairs in Garden Paths, including clear, returning to practice hub.
- Desktop entry layouts reviewed with reduced motion for the final three activities. Prior batch reviews record their actual play coverage separately.
- Production HTML local dependencies checked in the isolated publishing checkout. JS syntax and Git whitespace checks pass.
- Test gameplay uses separate QA origins. No live player saves were seeded, reset or spent.

Remaining validation: physical touch devices, the complete tablet/orientation matrix, Burst six-choice/long-glyph extremes, all late curriculum and saved-reward persistence across reloads. Speech work remains paused.

## Local recovery

Pre-final-pass snapshot: `.codex-checkpoints/letter-garden-final-activities-20260906/before.tar.gz`. Extract elsewhere and selectively restore after preserving later edits. Earlier per-pass snapshots and screenshot comparisons remain in their respective local checkpoint directories; they are intentionally excluded from the Git branch.

Local preview: `letters.html?v=20260906-garden6`.
