# Pond play — local checkpoint, 28 September 2026

Follows `66cc5db`, including the completed feeding-target and pet-colour ink
changes. Preview: `20260928-pond1`, service worker v64. No publishing in this pass.

## Changes

- Water has material bands, a paper bank and fixed-proportion floating leaves
  beneath the live Arabic cards. Existing shoreline boat, reeds and lilies stay.
- Later lessons previously spawned choices below the visible water and moved
  them out again. Choices now appear immediately; planned gentle motion is a
  small bounded bob. Beginner and reduced-motion choices remain still. The
  separate timed Burst challenge is unchanged.
- Correct choices remain visible, with replay and a wordless Next button. The
  child controls continuation. A wrong choice receives a small nudge and the
  existing comparison/retry support. No red cross was added to later lessons.
- Held results stop their animation-frame loop. Replay adds no learning outcome;
  Next consumes readiness before advancing. Old retry callbacks cannot act on a
  later round. Existing curriculum, options, evidence, scores and rewards remain.
- Three/four stationary choices use a grid in portrait and a row in short
  landscape. Moving choices also use a safe row in short landscape. Held packets
  reflow above a bottom dock or beside a landscape dock after rotation.

## Verification

`node --test src/letters/tests/*.test.cjs`: **335 passed**. New cases exercise
held success, replay, duplicate continuation, single completion, stale callbacks,
frame-loop cancellation/restart, bounded motion, four-choice landscape layout,
and dock clearance on resize. Syntax checks and `git diff --check` pass.

Actual browser play used disposable local QA saves; the owner's preview save was
not seeded or reset. The following were checked:

- Boat Pond at 390×844 with Mina: wrong choice, correct choice, held result,
  replay, double-click Next, all four rounds, reward and return into Trace.
  One wrong answer earned two stars (wallet 20 → 22); repeating that result did
  not pay again. Reload retained wallet and activity best. Existing saved chapter
  completion was preserved by the normal monotonic save merge.
- 320×568 and 568×320 with Rafi: three-choice play, pointer selection, held-result
  rotation in both directions and dock clearance. Short landscape choices were
  approximately 74×94 CSS pixels; small portrait packets approximately 77×98.
- 768×1024 tablet, day; 1100×800 desktop and 568×320 landscape, night, with later
  word choices and Lumi. Later word selection/replay retained the same round.
  Choices appeared immediately after reload, with no empty waiting period.
- Reduced-motion held result had no animation and a zero-second transition.
  No horizontal overflow in the checked phone view; no console warnings/errors.
- Feeding and ink controls retain the previous pass's browser and regression
  coverage, documented in `KID_CONTROLS_REVIEW.md`.

Screenshots, full test output, palette report and composed-frame measurements
are in `reviews/pond-play/`. Most screenshots show the final state; the baseline
and early desktop view are named explicitly. QA labels are not production UI.

## Remaining limits

This is a gameplay/art checkpoint, not completion of the broad art goal. The
palette checker reports **639 distinct off-palette hexes / 889 uses** across the
existing art code (down from 640 / 890). `/art-review` is unavailable; screenshots
were inspected manually. Strict palette compliance is not claimed.

The phone composition's mid-value share increased from 9.16% to 29.65%, but its
dark share remains 1.59%, below ART.md's 5% quota. Other checked frames also miss
that quota; desktop night additionally has 7.34% light pixels against the 8%
target. These remain contrast work, not a passed whole-game art review. Long-word
prompt diacritics also remain crowded at the very top of the short landscape
presenter; the answer cards themselves fit.

No physical-device or child-observation session was performed. Audio content is
unchanged; the Mac remained muted. Replay state was checked without claiming a
new listening review.

Next owner action: try the loose feeding target and pet-colour drawing, then
play Pond and use replay/Next. Continue the broader art work with composed-frame
contrast and the short-landscape long-word presenter.
