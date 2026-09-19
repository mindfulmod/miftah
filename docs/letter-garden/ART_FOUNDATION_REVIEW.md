# Art and shared alignment foundation — 2026-09-18

Local preview: `http://letter-garden-next.localhost:8790/letters.html?v=20260918-art-foundation1`.
Pre-pass checkpoint: `d6f3267`. No publishing or remote push in this pass.

## Implemented

- Shared activity presenter layout, with a larger proportional pet, a separate
  progress row, and centered no-prompt states. Removed conflicting presenter and
  pet sizing from older chapter/art rules. `letters-composition.css` owns this
  layout; the offline shell includes it.
- Arabic prompt offsets now use the actual computed font size. Font loading and
  root resize trigger a fresh fit. Existing SVG glyph/sticker ink fitting stays.
- Fixed-proportion pencil pot, tied paper roll, water lilies, orchard fruit,
  memory-bed leaves and wardrobe hangers. Broad background planes can stretch;
  the props cannot. A shared workshop serves Build/Blend/Fuse/Unfuse/Chain.
- Calmer Build trays and reserved prop margins in small portrait and landscape.
  Picnic fabric, planting and drawing-board clips extend the existing Boat art.
  The pond, paper boat, reeds, flowers and learning targets are retained.
- Garden teaching alcove around the existing bud/letter reveal; the presenter,
  multi-piece introduction and furniture use a shared frame. A pet-room diorama
  places the character and furniture in one coordinate system; absolute art
  frames eliminate intrinsic grid overflow. The existing species/poses remain.
- Boat reward art uses the celebration's ground instead of adding a second
  miniature island. Stars and navigation remain separate and unobstructed.
- Sticker supply controls occupy one compact row; owned art has larger usable
  cells and stronger contrast than empty slots. Wardrobe thumbnails have a
  consistent frame. Existing inspection dialogs and purchases are unchanged.

Curriculum, chapter IDs/order, difficulty policy, learning evidence, rewards,
progression, owned items and voice files were not changed. The earlier home-map
continuity work remains present. This is the art/alignment foundation from the
four-pass plan; it does not implement the proposed learning-engine/game passes.

## Verification

- **230/230 automated tests pass**, including two new executable regressions for
  computed-size Arabic ink offsets, hidden/empty prompts and resize-observer
  disposal. Existing reward/save, curriculum, audio, drawing and input checks pass.
- Browser screenshots at 390×780, 320×568, 568×320, 768×1024 and 1280×800.
  Reviewed Boat entry/Pond/Trace/Feed/results; Build, Blend, Catch, Pairs, Parade;
  album/detail view; blob, Mina, Rafi and Lumi in representative contexts.
  Later stacked marks were inspected with `shaddah-mix` content.
- Actually placed both Build pieces, selected/delivered a correct Feed packet,
  changed pencil color and drew/erased in landscape, revealed a first-time
  letter, opened/closed a sticker, and equipped an owned scarf. Feedback and
  relevant controls remained usable. No physical-phone touch trial this pass.
- Reduced-motion fixtures and one full-motion night Pond were inspected.
  Browser error log was empty. Audio was muted during these visual checks;
  audible voice quality was not requalified.
- An initial nested-grid overflow let the pet exceed its room frame; corrected
  and rechecked. Compact/desktop tools initially met the tray edge; reserved
  margins and fixed prop scales now keep them outside the active tray.
- QA uses the isolated `127.0.0.1:8790` origin with disposable synthetic data.
  The named-origin user's progress was not seeded or reset. The small footer in
  screenshots belongs to the QA fixture, not the live game interface.

Screenshots and command reports: [art-foundation](reviews/art-foundation/).
Some before/after glyphs differ because the existing planner responds to the
isolated QA learning history; scene, viewport and art comparison remain usable.

## Sighted art review

The bounded composition pass is implemented and reviewed. This is **not** a claim
that the entire existing game passes every rule in ART.md.

| Check | Result and evidence |
|---|---|
| Readable letters, faces, rewards and controls | Pass in reviewed scenes, including small-phone Build and stacked marks. |
| Stable props and room grounding | Pass after correction; native props preserve aspect ratio and the pet stands on the dais. |
| Warm contours and material separation | Pass for new props; paper, wood, fabric and water remain visually distinct. |
| Safe learning zone and a clear next action | Pass in reviewed states; decorative props stay out of trays and reward stars. Existing primary orange continuation remains. |
| Reduced motion and interaction | Pass for exercised flows; decorative art has no input handlers or required animation waits. |
| Complete palette/stroke compliance | Fail, existing project debt remains. Palette report is 666 distinct off-palette values / 928 uses, down from 680 / 950. Off-scale strokes remain 18 distinct / 212 uses. |
| Numeric composed-frame value quotas | Fail. Measured HSL lightness: Build after 56.04% light / 21.0% mid / 1.38% dark; before 49.83 / 24.37 / 1.28. The historical 5% dark quota is unmet. Pond also misses the 12% mid quota. See frame-values.json. |
| Every existing shape ramped, every legacy node budget | Fail: the wider existing asset family still contains flat fills and complex legacy shapes. This pass does not claim a whole-game art-bible cleanup. |

Remaining release qualification: physical devices, installed/offline update,
Arabic educator/child observation and the complete species/accessory matrix.
Further asset-family refinement can use these fixed layout contracts without
rebuilding the scenes or touching learning rules.

## Recovery

To compare or recover without overwriting current work:

```sh
git worktree add ../letter-garden-before-art-foundation d6f3267
```

Run from the durable checkout. The sibling `letter-garden-next-major.bundle`
contains the local committed history. `.qa/` remains disposable and uncommitted.
