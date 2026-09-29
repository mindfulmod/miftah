# Feeding and drawing controls — 28 September 2026

Local follow-up to `3429ccb`. Preview stamp: `20260928-kid-controls1`;
service worker v63. Production is unchanged.

## Changes

- Feed accepts a drop over the entire visible pet or basket, plus 32 CSS pixels
  of tolerance around each. It measures the current art, so replacement poses
  and rotation do not leave an old hitbox behind. The full-width pet wrapper is
  not a drag target. Moving a packet within the tray does not submit an answer.
- Both destinations highlight when a drag can be accepted. Children can also
  select a packet and tap either the pet or basket. Correctness, retries and
  explicit Continue retain their existing rules.
- Pink joins the shared drawing palette. Its five pet colours use the same hue
  values as the wardrobe; honey gold is included so every pet choice has an ink.
  Brown and coral remain available. These use ART.md's generated-colour bands.
- A new Trace or Garden Paths activity starts in the saved pet colour. Manual
  colour changes persist through its rounds, clear and undo. Existing strokes
  keep their original colours. The desktop marker illustration follows the ink.
- Seven 44px-or-larger colour controls fit in two rows on narrow phones and two
  columns beside Garden Paths on short landscape screens.

## Verification

- `node --test src/letters/tests/*.test.cjs`: **327 passed**. Tests cover all five
  pet hues in both drawing activities, old hue fallback, previous-session colour
  reset, stroke preservation, pointer release, enlarged Feed bounds, tray
  exclusion, live pose geometry, retries and completion integrity.
- Actual browser drags at 320×568: a 13px movement inside the tray did not answer;
  a correct packet dropped 15px outside Mina's art was accepted. A wrong packet
  dropped on Mina stayed on the same round and offered a retry. Selecting the
  correct packet then tapping Mina completed it.
- At 568×320, dropping beside Mina still succeeded after rotating between rounds.
  Normal-motion Feed was exercised. No console warnings or errors were recorded.
- Garden Paths at 320×568: pink pet started with pink ink; changing to blue kept
  the earlier pink stroke; finishing and turning the page retained blue. Both
  portrait and landscape controls were visible and at least 44×44px.
- Trace at 390×844 drew pink by default. At 1100×800 the marker illustration
  matched the pink stroke. At 320×568 and 568×320 all seven colours and the eraser
  fit; a honey-coloured pet selected honey ink. Drawing used reduced motion.
- Saved screenshots and test output are in `reviews/kid-controls/`. These were
  browser viewport checks, not physical touch-device or child-observation tests.
  Audio was unchanged and the Mac remained muted.
- Palette report: 640 distinct off-palette hexes / 890 uses, down from 647 / 897
  after retiring the old marker colours. Existing art debt remains. `/art-review`
  is unavailable; this report records manual screenshot inspection instead.

Next owner action: try a loose drop onto the pet, then change the pet colour and
enter a drawing activity to check its starting ink. No publishing was requested.
