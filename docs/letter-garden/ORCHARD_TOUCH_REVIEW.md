# Orchard touch and material follow-up — 29 September 2026

Baseline: local `8b86a74`. Previous goal turn was verified progress. This pass
continues the broad game/art objective; it does not complete that objective.
Preview `20260929-orchard-touch1`, service worker v68. Local only.

## Changes

Pairs supports drag-to-match alongside its existing two taps. A nearby card gets
a receiving outline regardless of whether it is correct. A wrong drop retains
the reference for repair. Empty-space releases, cancelled pointers, old-board
cards and already-matched cards do not create another answer. Replay, sprouts,
board counts, beginner tiers and child-led Next retain their existing rules.
The demo timer is cleared between boards and on exit.

Catch now compares the rendered fruit body against the basket's visible opening,
using the SVG's mouth coordinates and swept vertical movement. It no longer uses
a fixed 13% field width and 78–90% field height as its collision box. This follows
phone/desktop widths and rotation. Stationary fruit can be dragged into the
basket or tapped. Moving fruit is tappable too; basket steering and keyboard
movement remain available. A wrong stationary choice keeps the basket still.
Held fruit is replayable without another award. Its delivery animation starts
at the drag release rather than snapping back to the fruit's original location.

The matching tray now has a shaded cloth surface. The orchard gets layered air,
a warmer clearing and a darker contact edge; night has its own air colours.
Harvest feedback stays grounded on the clearing with Next beside it. The basket
and front rim retain a shared anchor on rotation; a resize must not restore the
old gameplay position while the result is held.

No curriculum, scoring thresholds, reward rules, save schema or voice assets were
changed. A lower-tier helper audited the activities and added Catch geometry
regressions in the test file; production edits remained with the main agent.

## Evidence

- **346 tests pass**, including drag/cancel/retired-board input, single matching
  reports, rendered Catch bounds at three sizes, resize and vertical crossings.
  Syntax and diff checks pass. Logs are in `reviews/orchard-touch/`.
- Real browser drags at 320×568: wrong pair → retained reference → correct pair;
  empty-space fruit release → correct basket delivery. Matching completed two
  boards, supported replay and paid its two-star result once after one wrong
  match. It also remained usable at 568×320 after rotation.
- Experienced moving Catch accepted a basket offset of **50px** on a 284.16px
  field, where the old threshold was 36.94px. `edge-check.json` records the input
  and visible held result. The screenshot is under `iterations/` because the
  final clearing colour was calibrated afterward. A locator observation timed
  out while the fruit was still falling; a subsequent observation confirmed the
  same running round completed without restarting it.
- Tapping moving fruit worked at 1100×800 at night. Held replay and Next worked;
  rotated results retained one aligned basket. Reduced-motion stationary Catch
  was played through a wrong choice, comparison hint, repaired drag and finish.
- A fresh Catch result awarded two stars, moved the wallet 20 → 22, and restored
  that activity best/wallet after reload (`catch-save.json`). Fixtures enter a
  selected activity directly and can skip earlier chapter games: these checks
  prove activity payment/persistence, not the full chapter-completion average.
  An experienced fixture starts with a three-star best already seeded in memory;
  its `catch-completion.json` is not fresh-award evidence.
- Final layouts include 320×568, 568×320, 768×961 (actual tablet capture size) and
  1100×800; two- and three-pair boards, later long-vowel ink, two-/three-choice
  Catch, day/night, and normal/reduced motion. Browser warning/error logs were
  empty. These are browser viewport checks, not physical-device/child tests.
- Tests use the real modules on isolated `127.0.0.1`. The owner's preview save was
  not seeded/reset. Audio remains outside this pass; the Mac was not unmuted.

## Art review

All **nine final frames** meet ART.md's composed-frame light/mid/dark quotas
(8% / 12% / 5%). Measurements use `L=(maxRGB+minRGB)/2`, recorded with dimensions
in `frame-values.json`. Before/iteration images are excluded from that final set.
Examples: matching landscape 49.68 / 20.04 / 10.15%; Catch held phone
30.80 / 26.40 / 5.91%; Catch repair landscape 40.07 / 15.43 / 5.65%.

The palette report remains **630 distinct off-palette colours / 877 uses**:
no increase, but legacy debt remains. `/art-review` is not available; this is
manual screenshot inspection and measurement, not a claim that command passed.

## Next

The other families still need work. Parade's wardrobe has a flat interior;
Burst remains a generic panel with a large empty gap and an uneven four-choice
3+1 arrangement. Their current screens are saved under `before/` for the next
pass. Burst's immediate replacement of a correct card also warrants feedback
review while preserving its optional timed nature. Rooms/rewards and wider
palette debt remain open; the full goal is not complete.

Owner next action: replay the second matching chapter and drag a card onto its
partner. In an unlocked Catch lesson, try a fruit-to-basket drag or tap, then
rotate while the fruit is held. The main local preview is reopened for testing.
