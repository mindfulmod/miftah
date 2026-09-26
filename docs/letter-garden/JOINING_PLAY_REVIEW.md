# Joining play — local review, September 25

Blend, Fuse and Chain now feel like activities at the same timber desk as Build.
The old tall paper panel is replaced by an inset green mat, a timber edge/apron
and legs, with the existing fixed-proportion pencil pot and paper roll. The
surrounding garden remains. This extends the established original paper-diorama
family and the purposeful-making cue from Animal Crossing; no borrowed assets.

## Child experience and learning

After the guided merge, the finished syllable/shape stays on the desk. Tap it to
hear it, separate it to hear its original pieces, and rejoin it. The arrow is the
only action that advances. Finishing the last merge cannot pay a reward until
that explicit continuation. Exploration is reversible and optional.

Blend's completed-result tray includes only existing two-part items supplied by
the current lesson, sharing the same first letter (maximum three including the
target). It never constructs a new syllable from decoys or another chapter.
The first Fatha lesson has no additional vowel choices. In Kasra/Damma the child
can change the vowel and hear/see the authored alternative. The main result and
pet replay prompt stay synchronized. Exploration does not open a learning prompt
or emit learning/reward outcomes. Fuse and Chain retain names-based speech;
Chain splits into the existing pair and its added letter. No vowel alternatives
are offered in those games. Original round order, counts, beginner scaffolding,
curriculum eligibility, rewards and saved-progress schemas remain.

Two defects were found through actual play and fixed:

- Releasing a held tile or stopping its hint restarted the entry animation before
  hit-testing; a valid drag could be rejected. Drop checks now use held geometry,
  and touched pieces do not replay their arrival animation. Both Blend and Chain
  completed actual drags after the fix.
- Fuse could show two identical glyphs with different hidden input roles (for
  example the target ضا plus a second ض decoy). Decoys now differ from both
  correct pieces. The affected third round now presents ض, ا, ت.

Wrong-choice comparisons now show the relevant two marks/letters rather than
comparing a single part with an entire word. Blend keeps the known piece still.
Success clears the comparison. Old reveal callbacks, result buttons and variant
buttons are guarded against exit, rerender and duplicate continuation.

## Verification

`node --test src/letters/tests/*.test.cjs`: **301 passed**. Ten new behavioral
checks cover result ownership, exact supplied alternatives, Fuse restrictions,
actual Chain name composition/replay, stale handlers, reduced motion, exit during
reveal, release-before-hit-test regression, and identical-decoy filtering. A
bounded Luna task wrote those tests; root implemented, reviewed and integrated
code and performed browser play. No measured token-savings claim.

Actual browser testing used the live modules and styles with seeded fixture
sessions on `127.0.0.1:8790`, separate from the owner's preview/storage:

- Chain: all four rounds, wrong choice/recovery, keyboard, held result replay,
  separation/rejoining and final Next. Wallet stayed 20 through final result,
  then became 22 for two stars. A fresh native drag succeeded after the fix.
- Kasra/Damma Blend: all four rounds, native dragging, tap and keyboard joining,
  vowel swaps, piece replay, wrong-vowel comparison/recovery, split-view Next,
  two-star completion and transition into the next Pond game. Wallet 20 → 22.
- Fuse: all four rounds under reduced motion, whole/part replay, distinct third
  round decoy, three-star completion and transition into Unfuse. Wallet 20 → 23.
- Fatha: no alternative vowel buttons, immediate result under reduced motion,
  and no result animation (`animation-name: none`).
- 390×780, 320×568 and 568×320 layouts, desktop 1280×800, and a 768px tablet
  layout. Tablet DOM reported 768×1024; the browser produced a 768×961 screenshot,
  so the screenshot is not evidence for the bottom 63px. Visible result controls
  stay at least 44px; the smallest phone tools are 48px. No horizontal overflow.
- Day/night, blob/Mina/Rafi/Lumi; original art, prompt and reward graphics remain.
  Captured browser warning/error log was empty. Tests exercised audio contracts,
  but UI play was muted: this is **not** pronunciation or audio-quality approval.
  No real device, child session or educator qualification was performed.

## Art evidence and limits

Evidence is in [reviews/joining-play](reviews/joining-play/). Phone before/after
pairs share the activity, first prompt, selected pet and viewport. Background
cloud timing can differ. Key images:

- [Blend before](reviews/joining-play/blend-before-phone.png) and
  [after](reviews/joining-play/blend-after-phone.png).
- [Chain before](reviews/joining-play/chain-before-phone.png),
  [after](reviews/joining-play/chain-after-phone.png), and
  [separated result](reviews/joining-play/chain-split-phone.png).
- [Vowel exploration](reviews/joining-play/blend-explore-phone.png),
  [small phone](reviews/joining-play/blend-split-small-phone.png), and
  [landscape](reviews/joining-play/blend-explore-landscape.png).
- [Night desktop](reviews/joining-play/fuse-desktop-night.png) and
  [Fatha tablet](reviews/joining-play/fatha-tablet-reduced.png).

`node scripts/check-palette.mjs`: unchanged existing debt, 658 distinct off-palette
hexes / 912 uses; 18 distinct off-scale widths / 208 uses. New native fills and
contours use the established palette/widths. Manual sighted review was performed;
no callable `/art-review` command is available and none is claimed to have run.
This is a local checkpoint, not a merge or deployment.

[Composed-frame HSL measurements](reviews/joining-play/value-measurements.json)
show a stronger mid-value learning surface: Blend phone light/mid/dark changes
from 62.10/15.24/1.13% to 17.93/26.30/1.76%. The dark quota still falls below 5%
on day-phone frames; the night desktop frame misses light and mid quotas.
Full Art Bible compliance is **not** established. Unfuse's older presentation,
other activity families, the full accessory matrix, participating pets and garden
ownership still need work. The complete user goal remains active.

## Recovery and next action

Pre-pass checkpoint: `57567e5d734142a149ad8d38c10c55a6f5ab9da7` on
`codex/letter-garden-next-major`. Restore into a separate checkout with
`git worktree add ../letter-garden-before-joining 57567e5` rather than discarding
uncommitted work. The sibling `letter-garden-next-major.bundle` is refreshed after
this commit. All changes are local; audio approval files and the game voice bank
are unchanged.

Next owner action: try the isolated Blend preview, join a pair, change the vowel,
separate/rejoin it, and use the orange arrow when ready. Next development: carry
this material/interaction standard into Unfuse and the remaining activity family,
then connect more pet and garden responses to the child's actions.
