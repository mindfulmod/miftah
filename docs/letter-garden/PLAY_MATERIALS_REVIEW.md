# Play materials and workbench feedback — 28 September 2026

Local continuation after `659d4cd`. Previous goal turn was verified progress;
this pass advances the same broad art/game goal. Entry `20260928-materials1`,
service worker v67. No push or deployment.

## Changes

- Feed has a folded checked cloth and a wooden-rimmed, recessed green tray.
  Delivery retains this surface under replay and Next instead of discarding it.
  The existing whole-pet/basket drop tolerance is preserved.
- Trace uses a shaded green folio, layered paper and two matching clips. Colour
  choices look like pencils and the eraser/guide use the existing palette.
  The saved pet colour still starts the activity; subsequent strokes retain
  manual colour choices. Removed competing Trace surface/clip rules from the
  art, activity and Boat styles; `letters-drawing.css` owns them now.
- Build, Blend, Fuse, Unfuse and Chain share a lit timber rim, deeper front apron,
  leg/contact shadows and a shaded mat. Build now uses the same material family.
  Its props remain visible above the mat, with a reserved strip keeping assembly
  pieces clear. Three-piece completed words, replay and Next stay inside it.
- Playing a wrong Build sequence exposed an existing short-landscape problem:
  the comparison hint covered assembly slots. It now occupies a real row above
  the desk. Compact tiles remain at least 44px wide.
- Boat's CSS night sky stays readable around Trace/Feed. The other chapters'
  native night sky remains unchanged. Materials retain lit paper and deeper
  edges rather than applying a uniform dimming filter.

No new curriculum, scoring, progression, rewards, save schema or recorded audio.
MiniGames changes are confined to Trace's guide and eraser colours. Drawing
coverage, disconnected marks, assisted assembly and child-led continuation are
unchanged. The palette test reads its allow-list from ART.md rather than keeping
an incomplete duplicate list.

## Verification

- **340 tests pass**. Syntax and diff checks pass. A lower-tier helper performed
  a bounded read-only interaction/layout audit; no parallel source edits.
- Feed: a correct packet dropped about 15px outside Mina was accepted at
  320×568. Replay/Continue remained available; Continue moved one round. Rotating
  while held to 568×320 retained the packet, basket and tray controls. A later
  Arabic-word layout was inspected at 1100×800 at night.
- Trace: drew the body of ثَ in pink, then its three dots and vowel mark in blue
  on a 320×568 phone. Finishing required the marks and held the completed drawing.
  Rotation to 568×320 retained both colours and the finish control. Desktop
  1100×800 retained all pencil choices and the matching marker illustration.
- Build: incorrect رَبَّ ordering showed the comparison, returned pieces, then
  accepted the repaired sequence in landscape. In 320×568, the three-part الم
  activity retained its prepared beginner prefix, accepted the remaining pieces,
  and showed the complete result/Next clear of the props. Three is the maximum
  part count in the current Build catalogue.
- Blend: both drag-to-join and two-tap joining worked at 390×844, then the joined
  result could be split back into replayable pieces. Chain accepted a three-letter
  drag at 320×568. Unfuse progressed through separation, explicit recall and held
  success; its shared table was inspected at 768×1024. Fuse was inspected at
  1100×800 at night. No browser warnings/errors were recorded.
- Checks used normal-motion Feed/Blend and reduced-motion drawing/joining views.
  These were browser viewport checks, not physical-device or child-observation
  sessions. The Mac stayed muted; this is not an audible-quality assessment.
- Disposable fixtures used only the isolated 127.0.0.1 origin and the real app
  modules. Some fixtures restrict the item pool to one curriculum target to
  reproduce a particular layout; they are not evidence of the ordinary choice
  count or curriculum difficulty. The owner's saved preview was not seeded/reset.

## Visual evidence

`reviews/play-materials/frame-values.json` records all 19 final captures. Every
sample clears the ART.md composed-frame quotas: light >80% occupies at least
8%, mid 45–70% at least 12%, and dark <30% at least 5%. Representative shares:

| View | Light | Mid | Dark |
|---|---:|---:|---:|
| Feed small phone | 68.18% | 12.51% | 9.18% |
| Feed held landscape | 56.55% | 19.73% | 11.00% |
| Trace small phone | 39.60% | 20.77% | 10.89% |
| Trace held landscape | 45.17% | 14.21% | 9.22% |
| Trace desktop night | 34.97% | 28.28% | 5.74% |
| Build repair landscape | 33.03% | 24.02% | 12.61% |
| Build three-piece phone | 25.17% | 27.07% | 10.71% |
| Unfuse tablet | 23.77% | 31.74% | 11.48% |
| Fuse desktop night | 9.74% | 16.10% | 44.84% |

Compare with `reviews/scene-legibility/`: the sampled pre-pass dark shares were
Feed phone 4.26%, Feed held landscape 2.48%, Trace phone 2.52% and Build landscape
1.55%. Some chapter/item choices differ; these are whole-frame comparisons, not
pixel-identical before/after pairs. An earlier Unfuse rotation capture is kept
under `iterations/` and excluded from the final image measurements.

Palette report: **630 distinct off-palette colours / 877 uses**, down from
639 / 888. Existing unrelated art debt remains. `/art-review` is unavailable;
manual screenshot inspection and measurements are recorded instead of claiming
that gate passed.

## Still open

This verifies this material pass, not the complete game-wide objective. The next
review should cover the remaining activity families (Parade, Pairs, Catch and
Burst), including failure/help/held states, and then rooms/rewards against the
same material and alignment rules. The universal palette debt and physical
child usability remain unproven; no completion claim is made for those.

Next owner action: open the main local preview and replay Boat through Trace and
Feed. Check the pencil choices, retained drawing, loose feeding drop, and the
tray behind replay/Next. Later unlocked chapters show the refreshed workbench.
