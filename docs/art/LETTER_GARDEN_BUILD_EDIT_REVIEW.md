# Build: correcting partial assemblies — September 7

Children can now tap a placed Build piece to return it and all following pieces to the tray before the row is full. The surviving prefix stays in order. A small return-arrow badge identifies editable pieces; the full slot is the touch target. Native buttons support keyboard activation, and focus moves back to the first returned tray piece. The target is replayed after a correction.

Partial corrections do not add slips or trigger success/reward callbacks. Once all slots are filled, the existing complete-answer check owns the row: returns are disabled throughout success or retry feedback. The existing wrong-answer scaffold, RTL ordering, round count, star thresholds and completion callback remain. This applies to both required Build activities and the optional Word Workshop.

Validation: 35 tests pass, including new partial-suffix/prefix preservation and complete-answer/exit lock tests. Actual 320×568 play covered accidental first placement, returning a two-piece prefix using Enter, correct assembly, completed wrong answer and retry, all four rounds, and the expected two-star result for one full incorrect answer. Earlier partial returns added no penalty. Desktop reduced-motion review checked a placed-piece cue and return action. Syntax and whitespace checks pass. Child comprehension of the return affordance and physical touch-device behavior still need observation.

Local version: `letters.html?v=20260907-buildedit1`. Not deployed. Recovery archive and QA fixtures: `.codex-checkpoints/letter-garden-build-edit-20260907/`.
