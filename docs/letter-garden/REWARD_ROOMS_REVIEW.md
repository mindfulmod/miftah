# Grounded rewards and wardrobe — 30 September 2026

Local follow-up to `a684045`. Preview stamp `20260930-garden-colour1`, SW v70.
The owner’s night-colour correction is documented in `NIGHT_COLOUR_REVIEW.md`.

## Changes

- Standard activity/chapter rewards use one 600×430 frame. Removed the second
  habitat island; flowers and the biome landmark now grow from a timber planter.
  The pet, mascot and planter share a clearing with contact shadows, planted edges
  and a continuous surrounding garden. Stars and return/replay controls stay
  above the terrain. Boat retains its separate adventure composition.
- Rebuilt the wardrobe alcove with a shaded green recess, warm wooden frame,
  reflective mirror, folded cloth and timber dais. The shelf, picture tabs,
  outfit cards and colour choices use matching material ramps. Removed the
  superseded wardrobe material rules and tightened the gap above the shelf.
- Chapter return now uses the home picture. Detached wardrobe and celebration
  controls cannot recite, recolour, spend, change outfits or render an old screen.
  Current-screen outfit toggles and purchases keep their existing behaviour.
- Night room terrain uses explicit green/water colours rather than dimming and
  desaturating the completed composition, following the owner's new direction.

## Verified

- **352 tests pass**. Two new behavioural tests exercise real renderPet/renderParty
  handler wiring; the habitat-render test checks the shared-terrain contract and
  unchanged progression state. All changed JavaScript passes syntax checks;
  `git diff --check` is clean.
- Browser checks: wardrobe at 390×844, 320×568 and 568×320; Mina, Rafi and the
  original blob remain grounded. Colour controls, tabs and shelf arrows fit.
- Bought a cap for eight stars (20 → 12); removing and wearing it again kept 12.
  Recolouring kept the outfit and balance. A selected owned pet still switches.
- Standard reward at 568×320 and orchard reward at 1100×800. Replay restarts the
  same activity; Continue moves from blend to Pond without changing the wallet,
  bests or completed chapters. Chapter return returns to the in-game map.
- Normal-motion orchard rewards and reduced-motion room/reward states were
  inspected. Night chapter rewards retain readable cream controls and visible
  pet eyes. Audio was not changed or audited in this pass.
- Screenshots, test output and measured composed-frame values are in
  `reviews/reward-rooms/`. These are browser viewport checks, not observations
  with children or physical-device touch tests.

## Remaining work

The short-landscape activity reward has 4.37% dark pixels, improved from 1.55%
in the previous pass but below ART.md's 5% target. The other seven final frames
clear all three value thresholds. This pass does not establish whole-game art
compliance. Palette debt is still **615 distinct off-palette colours / 842 uses**
(previous pass: 619 / 863). `/art-review` is unavailable; screenshots were reviewed
manually. The sticker album, hatch furniture and later biome props still need
more detailed art work. No production publishing was requested.

Next owner action: finish an activity, use replay/return, then try the wardrobe
with your pet. The broader art-and-gameplay goal remains active.
