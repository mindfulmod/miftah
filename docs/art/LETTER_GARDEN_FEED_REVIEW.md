# Feed picnic calibration

Local preview: `letters.html?v=20260906-feed1`. No publishing or audio changes.

The Boat seed activity and optional Feed practice now use folded paper seed packets with font-rendered, optically positioned letters, a woven basket with a dark opening and handle, and a picnic mat. The pet is larger on short phones. Surrounding riverbank, reeds, boat and earned flowers remain visible. The picnic surface is scoped to Feed; other activities are unchanged.

Selecting a packet highlights both packet and basket. Correct packets travel to the basket opening rather than the pet's mouth. The existing pet thanks animation remains. Wrong answers retain the existing gentle retry and removal behavior. Other chapters retain their original one-tap feeding mechanics and creature art. Curriculum, choice-count gates, reward calculations, saves and ownership are unchanged.

## Evidence

- Browser play at 320×568: four-round beginner sequence, one wrong delivery and successful retry, tap delivery, final drag delivery, result screen, replay, Home.
- Visual checks: two and four choices at 320×568, optional Feed practice with reduced motion, and 1024×768 desktop layout with reduced motion. No packet clipping observed.
- 19 automated tests pass. New regression verifies basket endpoint and repeated-input locking; existing tests cover pointer cancel/miss/teardown and late completion protection.
- Syntax checks pass. Actual preview script and stylesheet URLs verified at feed1 after reload.
- Test gameplay used an isolated QA origin, not the user's saved garden.

Not yet verified: full play-through with every pet/accessory, every later curriculum Feed chapter, optional practice completion, or physical touch-device testing. The practice menu illustration and legacy creature redraw remain future work. The selected pet itself was reused, not redrawn. This is one activity slice, not a completed all-game art pass.

## Baseline and comparison

`.codex-checkpoints/letter-garden-feed-20260906/before.tar.gz` preserves the four production files changed. Extract elsewhere and selectively restore only intended files after preserving later edits. The regression test was added after this production snapshot.

- `feed-comparison.jpg`: same-size baseline and new scene.
- `feed-desktop.jpg`: desktop layout screenshot, scaled in the QA viewer.
- QA HTML lives beside these files; its seeded state is isolated from the live origin.

Next planned family: Trace and its drawing tools, after visual review of Feed.
