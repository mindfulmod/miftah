# Pop input cleanup — September 8

Wrong choices now become disabled immediately, so faded/scaffolded buttons cannot remain keyboard stops. Input from a bubble outside the current round is rejected, and delayed wrong-pick feedback checks game lifetime and round identity before touching the old bubble. Correct-answer timing, choice counts, curriculum and mistake scoring are unchanged.

Phone verification: beginner target ب with choices ث/ب; incorrect ث became disabled, then Enter on ب moved to the next target. Completed all four target rounds and reached the existing Boat reward screen. Added tests for disabling, duplicate input, teardown during retry and detached old-round input. All 41 tests pass.

Local only, entry version 20260908-popinput1. Recovery source: .codex-checkpoints/letter-garden-pop-input-20260908/MiniGames-before.js. This is a lifecycle and keyboard cleanup, not a visual redesign.
