# Potting-table art and exploratory play — September 25

Local live implementation: `letters.html?v=20260925-potting1`.
Pre-pass checkpoint: `ecda849`. No push or deployment.

## What changed

Dot Garden now begins with a short, freely skippable exploration when at least
two taught letters share a verified body. Children can tap or drag a dot-pattern
tile onto a large paper label, hear its existing letter-name audio, undo changes,
and continue immediately. Only taught members of that family are offered.
A small potted seedling grows as distinct familiar forms are explored, without
currency, mastery evidence, saved growth, or a penalty for undoing.

The existing guided repair → related-letter repair → recall sequence follows.
Its content, difficulty policy, assisted/independent evidence and progression
rules remain intact. Exploration does not submit answer evidence. Single-member
families still start with guided repair. Keyboard continuation focuses the seed
tool; old controls and canceled drags cannot affect a later round.

The activity has a shared potting station across all three phases: rounded timber,
a raised paper label, a fixed-proportion seedling and garden scoop, stronger touch
contours and restrained contact shadows. The existing pond, paper boat, reeds and
hills remain visible. A larger companion and one large exploration letter reduce
competing focal points; the smaller reference returns for repair. Tablet sizing
is capped to avoid a stretched, oversized table; short landscape uses a side
presenter and keeps all controls below the top navigation.

The art bible now records the owner's requested Animal Crossing inspiration as
purposeful places, tactile materials and small environmental responses alongside
the existing Toca/paper direction. Native assets are registered in the existing
asset manifest. This is original Letter Garden art, not copied Nintendo assets.

## Evidence

- **286 automated tests pass.** Four new behavioral tests cover taught-family
  eligibility, undo without evidence/rewards, continuation and stale handlers,
  missed/canceled/secondary-pointer drags, muted play and teardown.
- Actual browser play: tap and undo, dragging a pattern onto the label, keyboard
  continuation, a wrong dot followed by undo/repair, both repairs, recall and
  return to the hub. Wallet remained 3 earned / 0 spent; existing Boat best and
  completed chapter stayed unchanged in the disposable fixture.
- Rendered at 320×568, 390×780, 568×320, 768×1024 and 1280×800. The smallest phone
  had no offscreen activity buttons and a minimum 48px touch dimension; landscape
  uses at least 44px. Checked Boat-body letters and the ح/خ family, with Mina and
  Rafi. All three landscape pattern tiles received center-point hits.
- Reduced motion: letter animation `none`, leaf transition 0s; selection and undo
  still worked. Full motion: one 220ms letter settle and 240ms leaf transition.
- The normal local preview opened to Dot Garden with the owner's existing save;
  no seeding/reset on that origin. No console errors there. QA used 127.0.0.1.
  An obsolete older QA fixture initially failed because it lacked LettersSound;
  it was replaced with a fixture using the current live entry-point dependencies.
- Existing audio files and approvals are unchanged. The audio regression now
  checks actual audio precache membership instead of requiring the entire service
  worker to retain an obsolete checksum after unrelated art updates.

## Sighted art review

[Matched baseline](reviews/potting-play/before-phone.png) and
[current repair](reviews/potting-play/repair-phone.png) use the same 390×780 viewport,
night backdrop, Mina and the first ب repair. Other evidence:
[small phone](reviews/potting-play/explore-small-phone.png),
[landscape](reviews/potting-play/explore-landscape.png),
[tablet](reviews/potting-play/explore-tablet.png),
[desktop with Rafi](reviews/potting-play/explore-desktop-rafi.png).

The new materials, glyph separation, touch surfaces and fixed-proportion props
were inspected in these composed frames. Input zones, top navigation and the
Arabic marks remain clear. New colours/stroke widths use the existing bible.
The repository has no callable `/art-review` command; this is the documented
sighted review against ART.md, not an assertion that the whole game passes it.

Palette report: unchanged **663 distinct off-palette values / 920 uses**, with
**18 off-scale stroke widths / 210 uses** in existing art. This pass adds none.
The broader cleanup remains open. The composed-frame numeric quotas are still
unmet: the matched repair frame is 47.84% light / 14.76% mid / 2.30% dark; the
historical dark quota is 5%. Desktop also misses the mid quota. See
[measurements](reviews/potting-play/frame-values.json). Full legacy palette,
material, silhouette and accessory qualification is not completed by this pass.

## Remaining work toward the full goal

Continue the art/gameplay direction through Garden Paths, the joining workbench,
Pairs/Catch, and broader pet/garden responses and chapter continuity. Dot Garden
is one completed local slice, not completion of the whole game-art objective.
The unreviewed audio queue remains separate. Physical-phone input, child sessions
and Arabic-educator observation are still needed; adult browser checks do not
prove enjoyment or learning effectiveness.

Next owner action: try Dot Garden from the practice garden. Change a dot pattern,
undo it, then use the arrow to repair and recall. No new recording task is needed
for this art/gameplay pass.

## Recovery

Current work is committed in the durable checkout, with a verified sibling
`letter-garden-next-major.bundle`. To inspect the prior state without overwriting
current work, create a separate checkout of `ecda849`.
