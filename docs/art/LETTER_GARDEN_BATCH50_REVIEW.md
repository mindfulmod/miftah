# Fifty-fix batch — September 8

Completed locally as one coordinated batch, version `20260908-batch50`. Identified from current live source and prior rendered checks; all 50 items below are implemented. This is interaction and layout polish within the existing art direction.

1. Blend/Fuse keyboard selection and joining.
2. Blend/Fuse announced selection state.
3. Blend/Fuse lost capture recovery.
4. Blend/Fuse ignore secondary mouse buttons.
5. Blend/Fuse disable retired decoys.
6. Blend/Fuse exclude retired drop targets.
7. Blend/Fuse keep dragged pieces within scene.
8. Blend/Fuse reject old scene pieces.
9. Chain keyboard joining.
10. Chain ignore secondary buttons.
11. Chain lost capture recovery.
12. Chain release capture on pointer up.
13. Chain keep dragged pieces in scene.
14. Chain disable rejected pieces.
15. Chain disable consumed piece.
16. Chain reject old scene input.
17. Dot Garden ignore input after exit.
18. Dot Garden ignore old construction controls.
19. Dot Garden announce placed dot counts.
20. Dot Garden disable full dot beds.
21. Dot Garden initialize seed selected state.
22. Dot Garden put seed down after placement.
23. Dot Garden clear obsolete retry cue after edit.
24. Dot Garden deduplicate single-letter recall choices.
25. Dot Garden complete once.
26. Dot Garden center recall glyph ink.
27. Dot Garden compact consistent recall cards.
28. Garden Paths disable empty clear tool.
29. Garden Paths clamp strokes to paper.
30. Garden Paths ignore zero-size pointer geometry.
31. Garden Paths use recognizable eraser icon.
32. Garden Paths display guided/copy progress.
33. Garden Paths name current drawing target.
34. Garden Paths describe guide toggle action.
35. Garden Paths complete once.
36. Garden Paths ignore nonprimary pointers.
37. Pop lock all options during success.
38. Feed initialize packet selection state.
39. Feed lock packet tray during delivery.
40. Feed suppress previous-round retry callback.
41. Build reject detached tray input.
42. Build disable remaining tray during answer check.
43. Build restore usable tray after retry.
44. Trace clear cancels active stroke.
45. Trace ignore right/middle button.
46. Trace ignore strokes before guide readiness.
47. Trace ignore concurrent second stroke.
48. Album reject stale pack clicks.
49. Album disable unaffordable pack.
50. Album prevent duplicate inspector dialogs.


## Verification

- `node --test src/letters/tests/*.test.cjs`: **53 passed, 0 failed**. Added regressions for keyboard selection, drag limits and cancellation, Trace readiness, drawing geometry and completion, and Dot Garden stale views and single-option recall.
- Browser, 320 × 568 phone layout: Dot Garden completed all three construction and three recall steps; checked seed reset, dot counts, full-bed locking, wrong recall removal, centered compact glyph cards, and return to practice with the reward fingerprint unchanged.
- Browser, phone: Garden Paths fits its paper, six progress dots and tool row; actual pointer drawing, clear, redraw and guided-to-copy transition reset the controls correctly. Saved `paths-phone.png` in the checkpoint directory.
- Browser, 1024 × 768 desktop layout: Blend joined with Enter/Space and advanced; Chain joined with Enter and advanced, both with reduced motion. Build locked every tray piece during a wrong answer, restored usable choices, then accepted the corrected answer and advanced.
- Browser, normal motion: Pop disabled all four choices during success; Feed locked both packets and the basket during delivery, then reset on the next target.
- Browser, phone album: opened and closed a sticker inspector; one pack spent exactly the available five stars, showed the new sticker, and disabled further purchasing at zero.
- Desktop Garden Paths visually inspected with scenery retained; saved `paths-desktop.png` in the checkpoint directory.
- QA used disposable fixture state and muted speech. These checks do not claim physical-device or audible voice verification. No voice changes were made.

## Recovery and scope

The pre-batch files are in `.codex-checkpoints/letter-garden-batch50-20260908/before.tar.gz`. To review or restore, extract into a temporary directory and copy back only the desired files after preserving any newer edits. The archive covers `letters.html`, `MiniGames.js`, `GardenPractice.js`, `LettersGame.js`, and `styles/letters-art-pass.css`; test additions can be removed separately if reverting. Do not reset the entire working tree: it contains unrelated project work.

All changes remain local. Curriculum, reward amounts and progression rules are unchanged. This closes this 50-item batch; it does not imply every visual asset or every device/game combination has been exhaustively reviewed.
