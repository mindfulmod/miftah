# Connected Letter Garden chapters — v41

## Scope

This pass turns the first two live Letter Garden chapters into connected
picture-book gardens: Boat Letters (ا ب ت ث) and Smile Letters (ج ح خ).
It is a prototype slice, not a migration of the full production curriculum.
The live game and other Miftah features are outside this change.

Completing Boat Letters reveals a garden doorway. Entering it changes the letter
family, environment palette, and activity menu. Smile Letters follows the live
Pairs → Trace → Pop sequence. Its first landmark is a pair of matching water
lilies; its later pond supplies the bubble activity. A return control revisits
the completed Boat garden without losing the Smile garden's progress.

Chapter items and game menus now come from `LettersWorlds`, rather than a second
hand-maintained curriculum. The current implementation intentionally exposes only
the first two worlds while their art and transitions are evaluated.

The previous six individual-letter map mixed an exploratory learning path with
the live mini-games. The default world now represents the activities within one
real chapter. The earlier orchard, recognition studies, and dressing nook remain
available for review through `letter-garden-flow.html?review=1`.

## Reference interpretation

- **Production reference:** `letters.html`, `LettersWorlds.js`, and the live
  mini-game implementations establish the letter family and Pop → Trace → Feed
  sequence. Pop and Feed use the live four-round setting; Trace retains its
  existing three-glyph coverage rules, including separate dot coverage.
- **Style reference:** the approved picture-book prototype establishes warm paper,
  espresso contours, sage terrain, turquoise water, and the companion rigs.
- **Highest-impact discrepancies addressed:** the old map did not represent the
  live chapter; finishing Feed had no world outcome; game/world materials and
  progress states were disconnected.

## Playable world

Four right-to-left letter pebbles replay the shipped Hamed-C recordings. The
letters come directly from the live Boat Letters data pack. No English or written
instructions appear in the child view.

The pond, sand terrace, and orchard are large illustrated buttons. A small
activity symbol connects each location to its game. Only the available location
makes a quiet invitation. Future locations keep their silhouette and color, with
reduced saturation and no lock icon.

Completing the pond adds flowers. Tracing grows the terrace and opens a bridge.
Feeding brings fruit to the orchard and a butterfly to the wider scene. The
world returns after every activity so the child can see what changed and choose
the next location. Completed activities remain replayable.

Landscape bands, river, and activity locations have separate desktop and portrait
compositions. They use native SVG and CSS, building on the existing vector art
system. No new raster generation or production asset batch was needed.

## Reliability and access

- Fixed an inherited event-delegation bug: the page itself has `data-activity`,
  so matching any ancestor with that attribute restarted the game when a child
  tapped a game piece. Only activity **buttons** now match that handler.
- Chapter progress uses its own versioned prototype storage key, with separate
  completion arrays for each chapter and migration of the earlier Boat-only key. Only a
  contiguous completion sequence can unlock later activities. No production
  progress is read or written by this chapter state.
- Each activity run has an identity guard; old callbacks cannot speak, award
  progress, or navigate after leaving or restarting a game.
- Transient finish and navigation timers are cancelled when the activity ends.
- Inactive pages are inert during transitions.
- Pop and Feed pieces have Arabic accessible names and keyboard activation.
- Matching pieces have the same accessible names and keyboard activation.
- Delayed live-game methods are guarded, including matching-board rebuilds, so
  a departed game cannot replace the newly selected game stage.
- All world controls and the activity navigation meet a 56 CSS-pixel minimum.
- The review rail is opt-in with `?review=1`.

## Verification

Browser playthrough:

- Completed Pop, traced Alif, Ba and Ta including their dots, and completed Feed.
- Confirmed each next place unlocks and Feed returns to the finished world.
- Reloaded after partial and full completion; progress and visible growth stayed.
- Replayed Pop with all four rounds via keyboard; an incorrect answer preserved
  the current question, and completion returned to the world without extra credit.
- Entered Smile Letters through the unlocked doorway. Completed both matching
  boards, traced Jeem, Khaa and Haa with pointer input, and finished all four
  bubble rounds. Confirmed its world returned fully grown.
- Revisited Boat Letters, returned to Smile Letters, and reloaded: each garden's
  completion state and the selected chapter were preserved.
- Confirmed Khaa uses the shipped `khaa.mp3` recording.
- Measured the completed Boat doorway at 320 × 568: no clipped, overlapping,
  or undersized world controls. The Smile matching board's six tiles are each
  80 × 81.5 CSS pixels at that size and remain inside the play area.
- Inspected the world at the visible 454 × 653 viewport and desktop 1280 × 720.
- Used the responsive review iframe to measure 390 × 844 and 320 × 568 layouts:
  all visible world controls stayed within bounds, with no overlapping hit boxes.
- Checked the browser error log during the main flow: no runtime errors.
- JavaScript syntax checks passed.

State regression tests:

```sh
node --test prototypes/letter-garden-chapter.test.cjs
```

Seven tests cover sequential unlocks and replay, reload restoration, malformed or
noncontiguous storage, blocked storage, independent chapter progress, migration,
and attempts to bypass chapter prerequisites. All passed.

Use `prototypes/letter-garden-responsive-check.html` for repeatable phone and
desktop viewport review. It is a developer harness, separate from the child view.

## Remaining boundary

The first two families are implemented. The remaining families, production
progress migration, and child usability testing are future work. The direction
still needs visual review before extending it across the full curriculum.
