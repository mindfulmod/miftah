# Familiar friend in practice — September 8

Feed's practice-menu illustration now renders the child's selected pet and worn accessories using the same pet renderer as the activity. The basket and packet cue remain, with no written label dependency. The fallback illustration is retained for other callers without a supplied pet.

Reviewed 320 × 568 three-choice and four-choice Workshop-unlocked layouts. Fixed the composed illustration's sizing to match the existing cards rather than expanding the first row. Clicking Feed opened the activity with the same Mina pet. All 41 existing tests pass. Follow-up: reviewed a 1024 × 768 three-card desktop layout with the legacy dragon wearing crown, balloon and wand, and the 320 × 568 four-card layout with Lumi wearing the same outfit. Picture, basket and play arrow remain separate in both. These are representative checks, not exhaustive outfit coverage.

Local version 20260908-practicepet1; not deployed. Pre-change art, game and styles are in .codex-checkpoints/letter-garden-practice-pet-20260908/.
