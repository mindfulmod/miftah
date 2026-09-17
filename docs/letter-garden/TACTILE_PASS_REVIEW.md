# Letter Garden — physical interaction pass

Local candidate: `20260916-touch1`. Scope: pass 1 of
[the child-experience plan](CHILD_EXPERIENCE_NEXT_FIVE.md), with Boat as the
reference chapter and shared feedback on the other activity surfaces.

## What changed for a child

- Pond packets press and lift with a small water-contact ripple. The pond,
  paper boat, habitats and existing letter artwork remain.
- A held seed packet follows the pointer directly. Its delivery starts from
  where the child releases it, fixing the old jump back to the tray. The basket
  responds to a nearby drop and visibly holds the delivered packet before the
  next round. A 16 px margin around the basket forgives motor imprecision;
  releasing elsewhere does not submit an answer.
- Catch, Build, Unfuse and the joining workbench share restrained press/lift
  feedback. Joining pieces settle with smaller deformation so their Arabic
  shapes remain readable.
- A completed Trace drawing stays on the same paper. A wordless check and
  next-arrow replace the 700 ms automatic disappearance. The child decides
  when to continue; repeated taps cannot skip a drawing or pay twice.
- Rotating the drawing screen preserves the ink's proportions. Pointer mapping
  follows the contained canvas image instead of stretching it across the paper.
- Reduced motion retains a visible delivered object and completion state while
  removing the flight, bounce and joining effects. Existing tap and keyboard
  alternatives remain available.

Learning targets, lesson order, tracing coverage/dot requirements, earned
progress, reward amounts and audio assets are unchanged. No speech service was
added. Passes 2–5 and audio generation remain parked.

## Verification

`node --test src/letters/tests/*.test.cjs`: **225 passed, 0 failed**.
New regression cases exercise completion through actual `penUp`, single-use
Continue, destruction during delivery, captured drag geometry, pointer
cancellation, and rotation coordinate mapping. Existing drawing, progression,
save, reward, voice lifecycle and learning-evidence tests pass.

Actual browser play used the live code in isolated localhost fixtures; the
owner's named-origin save and in-progress drawing were left alone:

- 390×700: completed all three Boat drawings, kept the selected blue pencil,
  waited on completed artwork, advanced with both keyboard and rapid double
  clicks, and reached the existing reward scene. One award changed the synthetic
  wallet from 20 to 23; Continue opened Feed and did not duplicate payment.
- 390×700: dragged a packet outside the basket with no verdict, then delivered
  successfully and inspected the packet sitting in the basket before advancement.
- 320×568 and 568×320: finished a drawing with reduced motion, rotated, and
  verified undistorted ink and an on-screen next-arrow.
- 1280×800: played Pond and two joining rounds; inspected the retained scenery,
  packet lift, workbench and delivery layout. Verified reduced-motion Feed by
  selecting and delivering through its tap alternative: the packet appeared in
  the basket with computed flight animation `none`.

Screenshots were inspected inline during play; no screenshot files are claimed
as archived evidence. One MutationObserver error was recorded during a joining
locator wait; it did not recur in subsequent CUA play or final Pond/Feed reloads.
Its source was not established, so this is not a claim of a clean console across
the entire session. No audible quality claim: browser fixtures were muted.

Syntax and whitespace checks pass. Palette report remains at the existing
680 distinct off-palette hex values / 950 uses; this pass does not increase it.
Physical-device touch, low-frame-rate hardware and observation with children
aged 4–6 remain release qualification, not completed tests. The remaining
chapters were covered by shared-code regression tests, not a full visual replay.

## Recovery and delivery

Pre-pass checkpoint: `e7e59c2` on `codex/letter-garden-next-major`. It includes the
previous curriculum recording scripts and child-experience plan. The sibling
`../letter-garden-next-major.bundle` is refreshed after this pass's local commit.

To inspect the baseline without overwriting current work, create a separate
worktree from the durable checkout:

```sh
git worktree add ../letter-garden-before-touch e7e59c2
```

If the durable checkout is lost, clone the sibling bundle into a new directory
and check out `codex/letter-garden-next-major`. Browser saves are separate from
Git and were not reset as part of this pass. Generated `.qa/` fixtures are not
included in the commit. Nothing was pushed or published.
