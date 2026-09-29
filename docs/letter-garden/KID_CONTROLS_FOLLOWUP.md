# Child controls follow-up — 28 September 2026

Local preview: `20260928-kid-controls2`, service worker v66. No publishing.

The requested forgiving Feed targets, pink ink and pet-colour default were
implemented in `66cc5db`. This follow-up verifies those controls against the
current integrated branch and fixes two rotation issues found during play.

- Missed-dot hints now share the drawing canvas viewBox and contain alignment.
  Only one hint is shown at a time. Reduced motion displays a static ring.
  Coverage thresholds and the requirement to draw each disconnected mark stay
  unchanged.
- Removed Trace's conflicting landscape presenter overrides. The paper now
  starts below the pet and prompt, using the shared composition owner.
- The helper ring uses the existing warm accent palette. No assets or audio
  recordings were changed.

## Verified

- All **340 tests pass**, including all five pet hues in both drawing activities,
  ink/stroke preservation, forgiving Feed acceptance and new missing-dot tests.
- Real drags at 320×568: 13px movement within the tray did not answer; a correct
  packet dropped about 15px outside Mina's visible art was accepted. Completion
  waited for the existing Continue button.
- Trace started pink for hue 320 at 320×568. Switching to blue preserved the pink
  body. Rotating to 568×320 retained the drawing and selected ink. All seven
  colour targets measured 44×44px; the eraser measured 48×48px.
- After rotation the hint overlay and canvas had identical 514×138 CSS bounds,
  sharing a 266×154 backing frame. The ring stayed on the missing dot, with no
  animation under reduced motion. Completing the dot in blue unlocked Finish;
  drawing just the body did not.
- Garden Paths started pink on a 1100×800 desktop. Adding blue retained the
  previous pink stroke. The browser recorded no warnings or errors.
- Screenshots and measured hint geometry are in `reviews/kid-controls-followup`.
  These are browser viewport checks, not physical device or child observation.
  The Mac stayed muted. This is not a new audible-quality evaluation.
- Palette report: 639 distinct off-palette colours / 888 uses, one fewer use
  than the previous checkpoint. Legacy art debt remains. `/art-review` is not
  available; the saved screenshots were reviewed manually.

The broader art/game goal remains active. Feed, Trace and joining scenes still
need the material/contrast work identified in `SCENE_LEGIBILITY_REVIEW.md`.
This follow-up does not claim that art work is complete.

Next owner action: try a loose Feed drop onto the pet, then choose a different
pet colour and open drawing. The initial ink should follow that pet choice;
manual colour changes should only affect new strokes.
