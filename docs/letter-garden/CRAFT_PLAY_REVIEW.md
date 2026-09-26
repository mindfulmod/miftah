# Drawing and joining craft pass — September 25, 2026

Local preview: `letters.html?v=20260925-craft1`. Baseline: `696909f`.
The live implementation remains the foundation. This advances the full art/game
objective; it does not complete the other activity families or chapter journeys.

## What changed for the child

Garden Paths has a layered green sketchpad, clipped warm paper, a curled page
corner, pencil-shaped colour choices, centered tools and a larger companion.
Undo removes one stroke while retaining earlier colours. Finish holds the actual
ink with a small leaf stamp; the child can keep drawing or turn the page. At the
end, all six drawings can be revisited in a session sketchbook. Their original
proportions survive the gallery and viewport rotation. These are session pages,
not permanent saved possessions; leaving practice or reloading discards them.

Build has a timber table with an apron, legs and floor shadow, a recessed green
assembly mat and a shallow piece tray. Writing props retain their proportions
and sit on the tabletop. Shared workshop tiles now use the established palette.
After pieces join, the completed word stays available to replay; an arrow advances
only when the child chooses. Prepared pieces and correction of a partial suffix
remain. Wrong-order feedback retains the correct prefix; it no longer shakes the
whole assembly. The comparison hint clears after a successful build.

The Animal Crossing cue is purposeful making and time to enjoy the result,
within the existing Letter Garden paper world. No Nintendo artwork is reused.

## Preserved learning and progress

Only supplied isolated letters enter Paths: the existing rotation of up to three
letters, full guide then partial guide. A page turn reports drawing participation
once, never correct handwriting, accuracy or mastery. Merely drawing, undoing,
reviewing and revisiting pages grants no reward. Empty pages cannot continue.

Build retains curriculum pools, names-first prompts where specified, syllable/
word voicing, assembly support, prepared prefixes, decoys, slips and star scoring.
Its existing success evidence is recorded once when assembled; completion and
reward payout wait for the child's final Next action. Old timers and controls
cannot advance a replacement round or act after exit. Workshop practice also
gets the new scenery and still returns without payout. No save schema changes.

## Verification

291 automated tests pass. Five new behavioral tests cover multicolour undo,
held drawing/edit/page-turn states, the actual gallery ink, stale pointer events,
participation counts, child-led Build completion, replay and exit during reveal.
Existing progression, reward, audio approval and learning tests remain green.

Real browser input on the isolated QA origin covered:

- A six-page drawing session, pencil changes, undo, finish/edit, partial guide,
  gallery selection and return to practice. Wallet 3, existing bests and completed
  chapters remained unchanged. A second six-page run checked all gallery targets
  at 320×568 and after rotation. Empty/retired input guards also have unit coverage.
- Four Build rounds: wrong order and retry, returning a piece, keyboard assembly,
  prepared prefixes, held result, replay, explicit continuation, reward screen,
  next activity and home. Wallet stayed 20 until final Next, then became 22 for
  the existing two-star result. Repeated completion is covered by behavioral tests.
- Later marked word عَنْهُ and the three-name sequence طسم; word and diacritic fit,
  correction-hint clearing, reduced-motion reveal and landscape controls.
- Shared tile material in Blend, including a successful two-tap join and next round.
- 320×568, 390×780, 568×320, 768px tablet width, and desktop; Mina, Rafi and Lumi; day/night
  drawing views. Smallest gallery targets are 44×50px; landscape colours are 44px.

Screenshots and test/palette output are in `reviews/craft-play/`. Review found and
fixed two legacy-style interactions: a landscape board covering its header and a
large inherited line box displacing the sketchbook home icon. Final views were
checked after correcting those rules. No callable `/art-review` command exists in
this checkout; this is a manual sighted review, not a claimed command execution.

Palette debt decreased from 663 distinct / 920 off-palette uses to 658 / 912;
legacy off-scale contour uses decreased from 210 to 208 (18 widths). New native
props use the existing ramp and contour scales. User-drawn brush ink retains its
existing 14 canvas-unit width. The whole-game strict palette and composed-frame
value quotas are still outstanding; see the measured frame-value artifact.
Matched 1280×720 views improved Paths from 75.44/11.02/0.57 to
73.52/14.13/1.20 percent light/mid/dark, and Build from 46.39/20.14/0.35
to 40.10/23.67/0.77. Both still miss the historical 5% dark quota.

Browser play was muted. Existing audio lifecycle/approval tests passed; this pass
makes no new pronunciation or sound-quality claim. Physical-device touch, child
sessions and Arabic-educator observation remain unperformed. An invalid manually
requested QA target initially failed its fixture precondition; it was replaced
with an actual curriculum entry, not added to the game.

## Next work and recovery

Next: extend experimentation and material responses through Blend/Fuse/Chain,
then Pairs/Catch and the participating-pet/garden connections. Keep the full art,
learning and world-cohesion objective open. The 76-item audio-review queue stays
separate and unapproved.

The work is local. A local commit and verified sibling Git bundle preserve it.
For the prior state, create a separate checkout of `696909f`; do not reset the
current checkout or the unrelated outer repository.

Next owner action: open the practice garden, try Garden Paths, use Undo and the
pencil colours, then complete the pages to browse the sketchbook. In an unlocked
Build lesson or Workshop, tap the finished word to replay and use the arrow to
continue.
