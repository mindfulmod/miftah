# Home map continuity pass

Local preview: `20260916-coast1`. Baseline: `3e35484`, already backed up on GitHub
as part of `codex/letter-garden-next-major`. This pass remains local.

## Cause and change

The previous map drew 22 separate full-width terrain SVGs, each with its own top
and bottom edge and a river slice that flipped sides at every chapter. Overlapping
those 300/254 px strips at 250/170 px intervals created the horizontal cut lines
the owner identified. Reviewing individual chapter screenshots had missed the
larger composition.

`LettersMapArt` now draws one continuous ground plane and meandering shoreline
over the full scroll height. Water stays on the same side; its curves share
endpoints and tangents between chapters. Layered banks, overlapping habitat
clearings, three sizes of edge planting, and existing trees/reeds/lanterns/peaks
give the route depth without separate platform edges. Riverlands use a small
shore landing in place of a bridge sitting on an isolated water patch.

The scenery extends behind the wordless controls. A compact row preserves room
for the map in short landscape layouts, with a 44 px minimum on the compact
buttons. The native scrollbar has a transparent track, and terrain width follows
the actual scroll area. Previously clipped mastery plants sit inside the map.

All 22 chapter positions and ordering, unlock/status logic, current-stop cue,
stars, flowers, pets, navigation handlers and rewards remain in `LettersGame`.
Scenery owns no progress data. No new audio or gameplay rules were introduced.

## Verification

- **228 automated tests passed.** Three home-map tests exercise actual home
  rendering: generated node order and locked attributes, current/last-stop scroll
  restoration, resize redraws and progression immutability. Existing curriculum,
  rewards, saves and audio tests remain green.
- Inspected matched 390×780 day screenshots before/after on the same two-complete
  chapter fixture. The repeated horizontal edges and alternated water slices are
  gone. Screenshots were inspected inline, not stored as image artifacts.
- Inspected orchard/lagoon and lantern/mountain transitions, day and night; the
  first chapter at 320×568; all controls at 568×320; and the completed riverlands
  at 1280×800, plus the orchard/lagoon at 768×1024. Reduced motion was enabled in these isolated fixtures; the new
  landscape itself has no animation.
- Opened Boat from the map and returned Home. Opened the decorating garden using
  Enter. Synthetic star/chapter totals remained unchanged. Browser error log was
  empty in the map review tab.
- Palette report: unchanged existing debt of 680 off-palette values / 950 uses.
  New terrain uses the established palette. JavaScript syntax and whitespace
  checks pass.

The named-origin user save was not seeded or reset; QA used the isolated
127.0.0.1 origin. Physical-phone touch, installed/offline update qualification and
child-session feedback remain release checks. No claim of measured learning or
engagement improvement is made from this art review.

## Recovery

To compare with the old map without overwriting current work, from the durable
checkout run `git worktree add ../letter-garden-before-coast 3e35484`.
The sibling `../letter-garden-next-major.bundle` is refreshed after the local
commit. Generated `.qa/` files remain disposable and uncommitted. The latest
GitHub checkpoint remains the earlier touch pass until another push is requested.
