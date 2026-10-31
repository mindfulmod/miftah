# Home gesture lifecycle — v363

Local only, 2026-10-29. No art, audio, learning, reward or publishing changes.

## Newly reproduced problem

Little Sprout's Home hold used an unguarded 800 ms timer. After the old screen was detached, that callback still navigated. Cancelling then starting another hold could also leave an old callback active; another pointer could restart/cancel the first finger's gesture. Blur and tab hiding did not cancel it. Five behavioural checks failed against the previous implementation before edits.

## Change

Each hold belongs to one primary pointer and one generation of the current screen. Releasing/cancelling that pointer, leaving the button, losing focus, hiding the tab or changing screens cancels the timer and ring. Detached controls cannot navigate. Intentional Home hold still takes 800 ms; keyboard activation remains immediate and ignores repeated keydown. Non-Sprout Home retains its normal click. All routes leave only once.

## Verification

- Five new runtime regression checks pass; 13 focused navigation/reliability/Sprout tests pass.
- Full Letter Garden suite: 1,690 tests pass. Legacy assertions tied to the old callback spelling/cache version were updated; the hold delay is now checked behaviourally.
- Current browser implementation on isolated review origin: normal short Home tap stays; simulated hold plus a real screen replacement stays on the new screen after the old timer deadline; intentional 1-second mouse hold exits once; Enter exits on a 390×844 phone layout. The review harness uses the real LettersGame.screen and wireTopBar, with controlled pointer events for the multi-finger interruption case.
- This is adult browser testing plus automated pointer/visibility tests, not physical multi-touch or child testing. Owner saves are untouched.

Recovery: `.qa/baselines/v363/RESTORE.md`. No new visual design was introduced, so prior art/palette checks were not rerun. Existing audio-generation and listening holds remain.

Next: inspect the three-slot drawing gallery and its automatic replacement behaviour for a newly evidenced child-facing loss of favourite creations. Do not reopen this Home pass without new evidence.
