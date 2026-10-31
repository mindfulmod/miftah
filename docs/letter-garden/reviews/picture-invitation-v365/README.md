# Created-picture invitation — v365

The previous save-preservation work is closed. This pass addresses a separate child-facing gap: after saving, the normal completion scene did not show the child's creation or provide a route to place it. Children had to find the decorating garden and locate the picture themselves.

## Completed

- Standalone Letter Studio and Colour a Friend finishes show the last successfully saved picture beside the pet. The earned star remains clear of the picture; the existing Continue and Replay controls remain available.
- Tapping the picture opens the real decorating garden, reveals the matching shelf item and selects it. An already displayed picture is selected in its current space. No layout, ownership or wallet changes happen on entry.
- The child chooses where to place it. Existing placement and Undo behavior are reused. Missing/changed pictures fall back safely to the normal garden.
- Connected adventure routes and direct-return activities keep their existing finish behavior. Failed/cancelled saves and older artwork alone do not create an invitation. Completion choices share the one-shot/stale-screen guard; the invitation never pays a reward.
- Local only. No audio calls, acoustic checks, commits, pushes or deployment. The requested natural-flow command was supplied again during this pass, without running it.

## Evidence

1,706 game tests pass. Six new route tests cover actual activity-context saving, exact picture identity, no automatic placement, reward count, failed/cancelled saves, adventure/direct-return routing, stale screens and valid picture sources. Added presenter and decorating tests cover one-shot actions, optional Continue, initial selection, existing placements and Undo. Legacy source assertions were updated for the added optional finish argument.

The isolated `.qa/picture-route-v365.html` harness runs production activity, finish and garden code, with prepared save data and silent speech. Browser play exercised real stamp placement/save/finish → picture invitation → garden selection → deliberate placement → Undo. A real colouring save/finish showed its own picture, and Continue returned without a decorating detour. Browser evidence confirms wallet unchanged through invitation/placement/Undo and layout unchanged on entry. Phone 390×844, small phone 320×568, landscape 667×375 and desktop 1280×800 keep all three finish controls in view and at least 56px. Reduced-motion finish has no animation or button transition. No physical device or child-observation claim is made.

Files: `browser-evidence.json`, `phone-finish.png`, focused logs and `game-suite.log`. Harness controls: `.qa/picture-route-v365-controls.js`.

## Recovery and next work

Starting copies: `.qa/baselines/v365/RESTORE.md`. Restore only individual files, preserving earlier uncommitted work. New files: `src/letters/tests/created-picture-v365.test.cjs`, this review directory and the two scratch harness files.

User confirmed children want more things to do with earned rewards. A targeted code check found that owned treasures such as pebbles and leaves still receive the generic keepsake animation in `DecoratingGarden.playToy`; this is the next interaction opportunity. Do not reopen the finished saved-art choice or this invitation route without new evidence.
