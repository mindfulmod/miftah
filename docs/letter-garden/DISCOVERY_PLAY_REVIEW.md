# Unfuse and Parade — local review, September 25

Unfuse now belongs to the timber joining desk. Parade becomes a small form
cabinet: three folded doors open onto letter cards resting on a shelf. The
original garden, pets and live Arabic glyphs remain. Native SVG/CSS extends the
existing paper-diorama family; no generated bitmap or borrowed game asset.

## Child experience

- **Unfuse:** pull the connected piece apart, or use the pictorial separation
  button. The freed letters stay large and replayable. Choose the orange arrow
  to start the existing recognition question. A correct answer stays available
  to hear; another explicit arrow starts the next pair.
- **Parade:** open the three forms in any order. Each remains replayable, with
  the selected form shown larger beside its original letter. Only the arrow
  begins the existing two-choice recognition question. Success waits for the
  child's next action instead of disappearing on a timer.
- Wrong answers retain the existing gentle comparison and retry. In short
  landscape screens the comparison now occupies its own row instead of covering
  the cards. The smaller layout still keeps controls at least 44px.

Exploration remains unscored motor participation. Parade's participation now
explicitly identifies `contextual_forms`; previously the shell could classify
it as `letter-name` while the explore prompt was null. Recognition retains the
existing supported-matching evidence and scoring. Joining speech stays names
based; each replay uses the existing voice path. Unfuse delegates the joined
name sequence to that path rather than interrupting it with a fixed second-name
timer. This pass makes no pronunciation approval or audio-bank changes.

Unfuse respects the supplied round count (the live lesson still supplies four).
Parade still visits up to three distinct eligible joining letters. Authored
lesson/game order, eligibility, progression, rewards, save schema and pets are
unchanged. Duplicate continuation, detached controls and actions after exit are
guarded. A real double-click test exposed the new round's separation button
receiving the second click from Next; it now ignores that multi-click without
introducing a timed wait.

## Verification

`node --test src/letters/tests/*.test.cjs`: **307 passed**. Four new behavioral
tests cover unscored exploration, replay without added outcomes, explicit quiz
entry, result ownership, stale controls and duplicate continuation. Existing
timer-based expectations were updated to check the new explicit continuation;
pointer release and learning-strength protections remain covered. A bounded Luna
task supplied the four tests and reviewed learning/transition contracts. Root
owned implementation, integration, visual review and actual browser play.

Browser checks used the real live modules in an isolated `127.0.0.1:8790` test
session. The owner's preview origin and saved progress were not changed.

- Unfuse: four rounds with a real pointer pull, tap separation, letter replay,
  intentional wrong choice/recovery and explicit Next. One mistake produced
  two stars and wallet 20 → 22. A second complete two-star run through Play again
  kept wallet 22 and the same best score; no repeated payment. A double-click
  on Next leaves the next connected pair intact after the guard fix.
- Parade: all three letters and their three forms, repeat replay, original/form
  comparison, recognition retry, held success and Next. One mistake produced
  two stars, wallet 20 → 22, and preserved existing completed chapters.
- 390×780 and 320×640 phones; 568×320 landscape; a 768×1024 tablet layout;
  1280×800 desktop. Tablet DOM reported the requested 1024px height, but the
  screenshot is 768×961, so it is not evidence for the bottom 63px. No horizontal
  overflow in the checked layouts. The smallest landscape reference/control
  measures 44px; phone arrows are 80×48px.
- Keyboard entry/continuation, rotation, day/night and Lumi/Mina/Rafi. App reduced
  motion gives the same result immediately with `animation-name: none` on the
  freed letters. CSS also retains the system preference override; a real OS
  preference switch and physical-device testing were not performed.
- Captured browser warning/error log was empty. Game play was muted, so this is
  not an audible pronunciation review. Audio sequencing/replay contracts passed
  in the automated suite; owner-approved recordings remain unchanged.

## Art evidence and limits

See [evidence folder](reviews/discovery-play/), especially:

- Unfuse [before](reviews/discovery-play/unfuse-before-phone.png),
  [new table](reviews/discovery-play/unfuse-pull-phone.png),
  [freed letters](reviews/discovery-play/unfuse-freed-phone.png), and
  [landscape retry](reviews/discovery-play/unfuse-landscape-retry.png).
- Parade [before](reviews/discovery-play/parade-before-phone.png),
  [closed cabinet](reviews/discovery-play/parade-closed-phone.png),
  [open forms](reviews/discovery-play/parade-open-phone.png), and
  [night desktop](reviews/discovery-play/parade-desktop-night.png).

The phone before/after pairs use the same activity, first prompt, pet and
viewport; cloud timing may differ. Full-frame HSL measurements are saved in
`reviews/discovery-play/frame-values.json`. Unfuse phone light/mid/dark changes
from 59.60/14.98/1.57% to 24.39/27.38/2.23%; Parade from 54.52/14.38/1.62% to
24.19/40.78/3.92%. Both still miss the Art Bible's 5% dark quota. The night
desktop cabinet measures 8.72/19.10/31.74%, meeting all three numeric quotas.

The report-only palette check finds **656 distinct off-palette hexes / 909
uses**, down from 658/912; off-scale widths remain **18 distinct / 208 uses**.
New art uses the established palette and stroke scale. Manual sighted review
was performed; no callable `/art-review` command is available and none is claimed
to have run. Whole-game Art Bible compliance, the full accessory matrix, child
observation, Arabic educator review and physical-device testing remain open.

## Recovery and next action

Pre-pass checkpoint: `2dbad9ffa03feb9af42b5bfe680336fa1eb68d37` on
`codex/letter-garden-next-major`. To inspect the previous version without losing
current work, use `git worktree add ../letter-garden-before-discovery 2dbad9f`.
The sibling `letter-garden-next-major.bundle` is refreshed after the local commit.
Browser saves are separate from Git recovery. Nothing was pushed or deployed.

Next owner action: try Unfuse's pull/separate → hear → find flow, then Parade's
three doors → hear → find flow. Use the arrows when ready and check that the
pacing feels comfortable. Development continues with the remaining activity
families and pet/garden responses; the broader art/game goal remains active.
