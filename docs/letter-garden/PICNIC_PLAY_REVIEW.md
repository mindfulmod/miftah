# Picnic delivery — September 28

Local continuation from production commit `b5e2990`. This is an implemented Feed
art/gameplay slice; the broader art and games goal remains active. No publishing.

## Changed experience

Feed uses a folded, stitched picnic cloth with a shared ground shadow, the
orchard basket material, and fitted paper packets. Received packets sit between
the basket opening and front rim, large enough to inspect. The selected friend
now participates in later Feed chapters as well as Boat, with a single presenter
instead of a duplicate pet above the playfield. Optional Feed practice mounts the
same scenery and keeps only its main friend.

Successful delivery stays visible. A pictorial replay button repeats the item
without a new learning outcome; a separate arrow advances only when the child
chooses. Choices lock immediately after delivery. Next is usable during settling,
and late landing callbacks cannot modify another round or restart speech over a
manual replay. Correct delivery clears the old comparison hint.

Boat/practice retain drag or tap-select-then-basket delivery. Later chapters
retain their direct one-tap answer mechanic. Lesson items, difficulty planning,
choice counts, learning verdicts, best-score rules, rewards and audio clips are
unchanged. No new currency, attendance mechanic or care requirement was added.

Feed playfield styling now lives in `styles/letters-picnic.css`; superseded Feed
frame rules were removed from the older art-pass and activities sheets. Presenter
alignment lives in composition, including the formerly Boat-only layout.

## Evidence

- `reviews/picnic-play/phone-before.png`: production b5e2990 runtime/art/layout
  replayed in the isolated fixture at 390×844. Compare with `phone-ready.png`
  and `phone-delivered.png` at the same size. Their randomized letters differ;
  they compare scene composition, not identical curriculum stimuli.
- Actual Boat play: wrong packet → comparison hint → correct packet → held result
  → replay → Next. Completed all four rounds. A pointer drop outside the basket
  did not reject the letter; a second real drag delivered it successfully.
- The one-wrong-answer run paid two stars: wallet 20 → 22, best Feed score 2.
  Returning to the map and reloading retained both values. Existing isolated QA
  progress from earlier tests was retained by the normal merge behavior. No
  owner-origin save was modified. Rapid completion/replay and stale-timer guards
  are covered by deterministic tests, rather than inferred from screenshots.
- Normal-motion small-phone play and continuation checked with Rafi and three
  choices. Small phone 320×568: packet controls measured 48×57, basket 130×80,
  no horizontal overflow. Rotation to 568×320 kept controls in the playfield.
- Later `decode-4` words retain one-tap play with Lumi at desktop 1100×800 and
  tablet 768×961, at night. Word and diacritic rendering was inspected. Optional
  Feed practice with the blob pet showed one friend, mounted cloth, and the same
  held-delivery controls. Phone/landscape/tablet/desktop screenshots are saved.
- Reduced-motion and normal-motion states were exercised through the game's
  existing preference path. Console had no warnings/errors. The Mac remained
  muted as requested, so no claim of audible listening is made in this pass.
- **324 automated tests pass**; `reviews/picnic-play/tests.txt` contains the full
  output. A bounded Luna task updated Feed lifecycle and outcome regressions.

## Art review limits and next work

Composed PNG measurements are in `frame-values.json`. Phone ready moved from
baseline 78.50% light / 10.12% mid / 1.70% dark to 74.94 / 11.75 / 3.72. Tablet
night clears all three ART.md value quotas. Other saved frames still miss one
or more quotas, especially the small-phone mid and day-scene dark share. This is
improved material hierarchy, not a complete art-bible acceptance claim.

Palette report: 647 distinct off-palette hexes / 897 uses (previously 654 / 906).
Legacy stroke and palette debt remains. The `/art-review` command is unavailable
in this environment; manual composed-frame inspection and palette measurements
are recorded instead. Physical touch-device and child observation remain open.

Next game/art slice: Pond's floating packets, readable water contact and retained
success, followed by broader scene contrast and pet participation. Preserve the
live pond and learning planner. Owner next action: try the local picnic preview,
drag a packet, replay the delivered item, and use the arrow to continue.
