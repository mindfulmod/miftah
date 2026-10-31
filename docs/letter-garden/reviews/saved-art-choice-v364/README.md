# Saved-art choice — v364

A child’s fourth picture previously replaced the oldest art slot silently. Later tracing could evict art from the shared eight-entry store, and the garden catalog displayed only the newest four drawings, hiding older placed signs.

## Completed

- Both Letter Studio and Colour a Friend use the same full-shelf choice: tap a saved thumbnail, preview old → new, and explicitly confirm. Back/Escape returns to the current drawing without writing, completing the activity, or awarding anything. Nothing changes until confirmation. This is a preview/cancel flow, not a post-save undo feature.
- Three art pictures remain separate from up to eight tracing keepsakes. Each thumbnail is capped at 60,000 data-URL characters; the fixed maximum is eleven pictures (660,000 characters before JSON overhead). Existing saves load without migration. New oversized exports fail honestly instead of disappearing on reload.
- Tracing keeps displayed signs unchanged, including a new trace of the same letter. With all eight tracing keepsakes displayed, optional trace-thumbnail saving is skipped; the lesson and its temporary journey picture still complete normally. Free-art slots remain available.
- Every retained drawing is available in the garden catalog, including older placed signs. An explicitly chosen art replacement updates its existing sign; a flower badge identifies displayed art in the picker.
- Storage refusal/exception leaves both memory and page ownership unchanged. Cancelling, changing screens, or a concurrent save cannot commit an obsolete choice. Picture choices require direct taps; generous game near-miss targeting does not confirm a replacement.
- Existing art style, curriculum, creative-participation evidence, pet rules and reward amounts are preserved. No new audio, paid calls, commits, pushes or deployment.

## Verification

- 35 focused drawing/colouring/save tests and the final 1,695-test game suite pass. The old silent-rotation assertion was replaced with actual choice/cancellation/storage/preservation behavior checks. Legacy source-shape assertions were updated for the delegated save method.
- Real Letter Studio and Colour a Friend controls exercised on an isolated localhost origin. Desktop 1280×800, small phone 320×568, phone 390×844 and landscape 667×375 checked. All five picker controls fit and are at least 56px in the small-phone check.
- Preview selection, cancel with intact stamps, simulated quota failure and retry, explicit replacement, colouring cancellation with Escape, successful colour save, reduced motion, reload, and a screen change during a pending choice checked.
- Twenty controlled trace saves preserved the three art pictures. Reload retained all eleven pictures, and the oldest placed art sign remained visible. The trace loop and screen-change race use harness controls invoking production methods; they are not claims of twenty full lesson playthroughs. No child or physical touch-device test performed.
- Browser evidence: `browser-evidence.json`, `phone-preview.png`, `colour-preview.png`. Harness: `.qa/saved-art-v364.html` and `.qa/saved-art-v364-controls.js`. Owner progress was not used for tests.

## Restore

Starting copies and SHA256 hashes: `.qa/baselines/v364/RESTORE.md`. Restore only this batch’s individual files; the checkout contains substantial earlier uncommitted work. New files: `src/letters/tests/helpers/drawing-save.cjs`, this review folder, and the scratch harness files. Tests added to existing files should be restored using the corresponding copies.

## Child check

In the local game, create/save a fourth picture. Does the child understand choosing an old picture, seeing what will replace it, and using Back to keep it? The visual explanation still needs observation with a child aged 4–6. Saved-art choice and preservation are now closed; revisit only for new evidence.
