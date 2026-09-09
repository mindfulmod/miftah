# Catch keyboard movement — September 8

Basket now supports Left/Right in eight-percent stage steps and Home/End to its reachable edges. It exposes a horizontal slider position and visible focus. Pointer and keyboard movement share rendered basket/stage bounds, including a stage narrower than the basket, and movement stops after teardown. No curriculum, falling pace, catch collision or scoring changes.

Phone browser check: Home announced 0, End 100, ArrowLeft 87 after normalization to reachable space. Basket stayed within the field; focus outline was adjusted inward after observing edge clipping. Home navigation removed the slider. All 42 regression tests pass, including rendered bounds and stale movement guards.

Follow-up: normal falling mode reached completion using keyboard-only basket movement (ArrowRight and End); the existing two-star reward rendered. Replay restored falling mode and its slider. Reduced-motion mode was subsequently implemented and separately reviewed in LETTER_GARDEN_CATCH_CALM_REVIEW.md. Resize now reclamps the basket to current rendered bounds; exhaustive orientation/device coverage remains.

Local only, version 20260908-catchkeys1. Source recovery: .codex-checkpoints/letter-garden-catch-keys-20260908/MiniGames-before.js.
