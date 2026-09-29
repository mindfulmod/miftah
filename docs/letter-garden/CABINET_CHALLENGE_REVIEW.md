# Cabinet and challenge — 29 September 2026

Local follow-up to `81467b3`, preview `20260929-cabinet-challenge1`, service worker
v69. No publishing. The broader art/game goal remains active.

## What changed

- Burst now uses the native matching seed tray, with balanced 2×2, 3+2 and 3×2
  arrangements instead of a stranded fourth tile. The clock and pause remain
  distinct from the answer grid. A small last-found pocket keeps correct feedback
  visible while the next question becomes playable immediately.
- The receipt flight is visual only. Next success, pause, deadline and destruction
  cancel it; it cannot advance, speak, change time or add a reward. Reduced motion
  updates the receipt without a flight. The 30-second budget, adaptive choice
  count, scoring thresholds and optional challenge entry are unchanged.
- Parade gets a deeper lined cabinet, timber apron, contact edges and larger
  teaching ink. Connected forms use measured bounds, not string-length shrinking,
  with an inset inside the paper. Native SVG shapes and live Arabic are preserved.
- A folder can be dragged onto the display or tapped. The receiving area includes
  18px of tolerance. Empty and cancelled drops are unscored. All three reveals
  still precede the explicit two-choice recognition step; participation never
  becomes recognition credit. Each phase cleans up gestures and decorative flight.
- Removed superseded Burst and Parade styles from the base, art-pass and activity
  sheets. `letters-craft.css` owns the family layouts. A legacy 210px minimum
  height no longer crops Parade when a landscape comparison hint appears.
- Play-through exposed cropped result controls in short landscape. Standard
  activity results now keep replay/Next beside the clearing. Boat retains its
  own established result composition. This is a layout fix, not a completed
  reward-scene art pass.

## Verification

- All **350 tests pass**. A bounded lower-tier helper added Burst receipt,
  stale-tap, pause/teardown/deadline and reduced-motion tests; Parade tests cover
  drag cancellation, missed drops, repeated input, explicit recall and full
  three-round completion. Syntax and whitespace checks pass.
- Actual Burst play grew from four to five to six choices. The pocket retained
  the latest successful letter and the active prompt changed immediately. Pause
  disabled the grid, resume replayed the prompt path, and portrait-to-landscape
  kept the held count. At 320×568 the five answer buttons measured 66.7×83.8px.
- A reduced-motion Burst run completed after its active budget with five finds:
  one star, `daily:burst:1`, and wallet 20→21. There were no console warnings or
  errors in the tested scenes. The Mac stayed muted; audio quality was not judged.
- Actual Parade play at 320×568 accepted a folder drop on the display; an empty
  drop left it closed. Taps and drag shared the same reveals. Three rounds of
  reveal→explicit recall→Next completed after one intentional wrong answer,
  recording a two-star `join-1:parade` best and wallet 20→22. Both persisted after
  a reload on the isolated QA origin. No owner-origin save was modified.
- The 568×320 retry view now leaves the full cabinet within the screen: stage
  y=134…314, height 180px. Its answer cards are 78×82.5px; the replay display is
  72×76.1px. All current controls remain usable. Result replay/Next are visible
  together without scrolling. Desktop and night tablet views were also reviewed.
- Normal-motion drag and Burst delivery, reduced-motion tapping, pause, rotation,
  and wrong/correct feedback were exercised. These are browser viewport checks,
  not physical touch-device testing or observation of children.

## Visual evidence

Before images are from the unchanged `81467b3` activity baseline. Final images,
full test output and palette report are in `reviews/cabinet-challenge/`.
Light/mid/dark percentages below use composed-frame HSL lightness
`(max(R,G,B)+min(R,G,B))/2`, with ART.md thresholds 8/12/5 percent.

| Capture | Size | Light | Mid | Dark | Result |
|---|---|---:|---:|---:|---|
| burst-desktop.png | 1100×800 | 23.55 | 29.85 | 5.24 | Pass |
| burst-landscape.png | 568×320 | 28.24 | 22.56 | 9.48 | Pass |
| burst-phone.png | 390×844 | 23.65 | 32.47 | 6.91 | Pass |
| burst-small-phone.png | 320×568 | 26.05 | 26.37 | 8.32 | Pass |
| parade-desktop.png | 1100×800 | 23.81 | 26.87 | 5.35 | Pass |
| parade-landscape-retry.png | 568×320 | 30.8 | 22.87 | 8.4 | Pass |
| parade-phone.png | 320×568 | 24.72 | 24.93 | 7.62 | Pass |
| parade-tablet-night.png | 768×960 | 12.88 | 16.87 | 39.35 | Pass |
| results-landscape.png | 568×320 | 35.34 | 29.13 | 1.55 | Art debt |

The eight activity frames clear all three quotas. The standard reward clearing
still lacks a strong near-dark plane (1.55% in its landscape capture) and needs a
more coherent grounded scene. It is explicitly unfinished art work. The palette
report has **619 distinct off-palette colours / 863 uses**, down from 630/877;
remaining debt is across older artwork. `/art-review` is unavailable; screenshots
were reviewed manually, not presented as a passed automated art gate.

## Recovery and next action

The scoped checkpoint is recorded in the outer `docs/letter-garden/RELEASE_STATUS.md`.
The sibling `letter-garden-next-major.bundle` is refreshed after the commit.
Restore into a new directory with `git clone ../letter-garden-next-major.bundle
<new-directory> --branch codex/letter-garden-next-major`; do not reset the owner's
unrelated outer checkout. `.qa/` remains untracked and is not in the checkpoint.

Owner next action: try the optional timed challenge, then drag/tap the cabinet's
three forms and complete its recall. The isolated local cabinet fixture is
`http://127.0.0.1:8790/.qa/stages.html?scene=parade&world=join-1&motion=full`.
It uses the real local game and a separate test save. The main preview retains
the owner's progress. Next broader work: grounded reward scenes and room art,
then the remaining shared-world art debt and wider game review.
