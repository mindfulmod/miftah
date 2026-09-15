# Letter Garden 100-item batch

Baseline: local commit `31a540b`. Scope selected from current source and prior browser checks. Completed as one local integration batch. These are fixes and enhancements, not 100 claimed user-reported bugs. No curriculum or reward formula changes.

1. [x] Malformed JSON loads recoverably.
2. [x] Wrong-shaped saved roots cannot crash consumers.
3. [x] Storage read denial is tolerated.
4. [x] Failed writes return a detectable result.
5. [x] Malformed original save is backed up.
6. [x] Existing recovery backup is never overwritten.
7. [x] Completed-world IDs are validated.
8. [x] Completed-world IDs are deduplicated.
9. [x] Skip flag is normalized to boolean.
10. [x] World-star values are finite and bounded.
11. [x] Activity best values are finite and bounded.
12. [x] Earned wallet amount is normalized safely.
13. [x] Spent wallet amount is normalized safely.
14. [x] Pet root is validated without dropping valid fields.
15. [x] Pet hue has a finite fallback.
16. [x] Pet species has a string fallback.
17. [x] Worn items are validated and deduplicated.
18. [x] Owned accessories are validated and deduplicated.
19. [x] Owned bodies retain the selected species.
20. [x] Sticker ownership is validated and deduplicated.
21. [x] Skill score/date records are validated.
22. [x] Stamp dates are calendar-valid and unique.
23. [x] Reduced-motion preference is a boolean.
24. [x] Strength records have safe numeric fields.
25. [x] Invalid elapsed/future timestamps cannot distort strength.
26. [x] Blend ignores nonprimary pointers.
27. [x] Blend keeps one active pointer.
28. [x] Blend ignores other-pointer move/end/cancel.
29. [x] Blend releases capture on end and exit.
30. [x] Blend rejects zero-size geometry.
31. [x] Chain ignores nonprimary pointers.
32. [x] Chain keeps one active pointer.
33. [x] Chain ignores other-pointer move/end/cancel.
34. [x] Chain releases capture on end and exit.
35. [x] Chain rejects zero-size geometry.
36. [x] Unfuse ignores nonprimary pointers.
37. [x] Unfuse keeps one active pointer.
38. [x] Unfuse ignores other-pointer move/end/cancel.
39. [x] Unfuse releases capture on end and exit.
40. [x] Unfuse rejects zero-size geometry.
41. [x] Trace bounds coordinates and rejects empty geometry.
42. [x] Trace clears obsolete cluster hints on restart.
43. [x] Trace clear tool reflects readiness and ink.
44. [x] Pop finishes by removing its resize listener.
45. [x] Empty option pools cannot create undefined rounds.
46. [x] Practice drag ignores nonprimary pointers.
47. [x] Cancelled practice drag cannot emit a selection click.
48. [x] Disabled practice drag resets its translation.
49. [x] Zero-size drop zones cannot accept delivery.
50. [x] Dot Garden shows construction/recall progress.
51. [x] Dot beds announce their initial counts.
52. [x] Guided dot ghosts are decorative for accessibility.
53. [x] Full dot beds disable the seed tool.
54. [x] Undo restores the seed tool below capacity.
55. [x] Disabled recall options ignore direct callbacks.
56. [x] Keyboard recall transitions retain usable focus.
57. [x] Final dot completion releases the drag.
58. [x] Dot undo clears stale selected-seed state.
59. [x] Recall speaker art is decorative.
60. [x] Empty dot construction disables Check.
61. [x] Paths ignores another pointer ending its stroke.
62. [x] Paths releases capture before replacing the paper.
63. [x] Copy stage keeps an external letter reference.
64. [x] Practice eraser art becomes a reusable helper.
65. [x] Guide toggle references its controlled guide.
66. [x] Startup immediately shows a garden loading scene.
67. [x] Font wait has a bounded fallback.
68. [x] Word requests have bounded timeouts.
69. [x] Font rejection cannot prevent startup.
70. [x] Malformed word data is skipped safely.
71. [x] Repeated word loading does not duplicate the pool.
72. [x] Partial word failures preserve valid results.
73. [x] Word loading allows normal browser caching.
74. [x] Late startup cannot replace a newer screen.
75. [x] Late font load refreshes glyph fitting.
76. [x] Loading indicator respects reduced motion.
77. [x] All Letter Garden save routes use validation.
78. [x] Grown-ups can see when saving failed.
79. [x] Invalid earned-star amounts are rejected.
80. [x] Invalid spending amounts are rejected.
81. [x] Egg hatching works by keyboard and touch.
82. [x] Retired hatch input cannot hatch again.
83. [x] Hatched pet preview is a real button.
84. [x] Hatch colors have names and selected states.
85. [x] Hatch Continue has an accessible name.
86. [x] Lesson assembly pieces work by keyboard.
87. [x] Retired lesson assembly callbacks cannot navigate.
88. [x] Lesson exploration tracks and releases its pointer.
89. [x] Lesson Continue ignores repeated retired input.
90. [x] Reward stars have a meaningful accessible label.
91. [x] Reward navigation ignores retired actions.
92. [x] Album completion checks actual known sticker IDs.
93. [x] Completed album state has an accessible label.
94. [x] Stamp cells expose full dates and today state.
95. [x] Stamp return goes to the grown-up area.
96. [x] World trail realigns on resize.
97. [x] World stops announce completion and stars.
98. [x] Practice replay uses consistent speaker artwork.
99. [x] Unknown practice requests return safely.
100. [x] Empty learning pools offer retry without rewards.


## Integration and evidence

The 100 entries describe acceptance cases, grouped into five implementation areas. Shared code fixes several cases at once; this is not a claim of 100 independent bugs or 100 automated tests.

| Items | Implementation | Verification |
| --- | --- | --- |
| 1–25 | `LettersState.js`, `LettersStrength.js` | 15 state tests: damaged/wrong-shaped saves, exact recovery backup, denied storage, retained valid legacy fields, finite records, safe map IDs. |
| 26–45 | `MiniGames.js` | Pointer ownership, cross-piece input, cancellation, capture release, bounds, hint cleanup, empty pools and one-time Pop completion; existing game regression suite. Desktop Blend completed four rounds using drag and Enter/Space, awarded three stars, and returned to a wallet of 8 from 5. |
| 46–65 | `GardenPractice.js`, practice CSS | Full phone Dot Garden construction + recall, one wrong recall, seed drag, capacity/undo; all six Paths guided/copy steps, erase/redraw, guide toggle, unchanged rewards and return. Deterministic cancellation and stale-pointer tests. |
| 66–80 | `LettersBoot.js`, `LettersWorlds.js`, shared save routes | Boot and shell tests; real browser stalled font/network fixture reached home in 5,077 ms, loading animation computed as `none` with reduced motion. Malformed-save fixture retained 10 spendable stars, completed Boat with three stars, pink Mina and worn scarf. Failed-save notice visible in grown-up area. |
| 81–100 | `LettersGame.js`, shell CSS | Enter + Space + click hatch, named selected colors; joining assembly by keyboard, interrupted assembly returns home; full-date stamp cells and return to grown-ups; map resize viewBox changed from width 305 to 470; empty-word retry loaded playable Quran word choices. Reward and album state reviewed against existing rules. |

Final automated check: `node --test src/letters/tests/*.test.cjs` — **96 passed, 0 failed**. Syntax checks and `git diff --check` pass. Palette checker ran in its repository-configured report-only mode and reports existing art debt; strict palette compliance is not claimed.

Browser fixtures used disposable state at `127.0.0.1:8790`, separate from the child's named preview origin. Phone layout: 320×568. Desktop layout: 1024×768, plus direct 1280×720 startup testing and a live width-change fixture. Browser pointer emulation is not physical multi-touch hardware testing. Speech lifecycle regressions pass; audible voice evaluation remains paused as requested.

Root reviewed and repaired delegated changes, replaced insufficient assertions with behavioral tests, and performed browser checks. Delegation used two bounded Luna jobs for input/practice and one Sol job for save validation, without full-history forks. No measured token or cost saving is claimed.

## Visual comparison

The baseline is the preceding journey commit, `31a540b`, with screenshots and walkthrough in `JOURNEY_REVIEW.md`. This batch retains that scenery, pond, chapter sequence, pets, wardrobe and reward compositions. Added visual work is limited to the warm loading scene, practice progress and letter reference, control readiness, and accessible interaction states. No new art family or disconnected prototype was introduced.

Evidence images:

- [Phone album](reviews/batch100/batch100-album-phone.png)
- [Phone rewards](reviews/batch100/batch100-rewards-phone.png)
- [Phone hatch](reviews/batch100/batch100-hatch-phone.png)
- [Phone dot recall](reviews/batch100/batch100-dot-recall-phone.png)
- [Phone copy reference](reviews/batch100/batch100-path-copy-phone.png)
- [Desktop loading](reviews/batch100/batch100-loading-desktop.png)
- [Desktop assembly](reviews/batch100/batch100-assembly-desktop.png)
- [Resized world map](reviews/batch100/batch100-map-resized.png)

Manual ART.md review: retained world scenery and warm existing surfaces; no visible instructions added to child flows; phone controls and drawing tools remain within the viewport; reference glyph and hatch colors remain visible; loading respects reduced motion. No `/art-review` command definition is present in this checkout, so the documented art checks were performed directly.

## Recovery and remaining release work

All edits are confined to the isolated `codex/letter-garden-next-major` worktree. The original mixed workspace was not staged or reset. To inspect or recover the preceding version without disturbing current changes:

```sh
git -C /Users/main/Documents/GitHub/miftah/.local-work/letter-garden-next-major worktree add --detach /tmp/letter-garden-before100 31a540b
```

Raw damaged saves are retained once at their original key plus `:recovery`; startup validation does not overwrite the original live value. Valid older progress and unknown record fields remain preserved. Reopening a baseline code checkout alone does not roll back browser storage.

This selected 100-item batch is complete. The wider major release still needs the approved decorating garden, gentle daily practice with optional Burst, later chapter/art propagation, physical-device and child-session qualification, and publishing approval. Production and `sw.js` shipping version are unchanged.
