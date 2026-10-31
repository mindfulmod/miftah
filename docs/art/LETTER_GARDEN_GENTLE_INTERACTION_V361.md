# Letter Garden v361 — gentle interaction correction

Local revision, 2026-10-28. Scope: the owner's report that mini-game motion feels
like an action/card game. Audio and publishing remain parked. Reuses v359/v360
art review; no new catalogue or unrelated completed-work audit.

## Finding and approach

The main cause was explicit in the shared feedback implementation: a held
squash described as fighting-game “hit-stop,” bright tile flash, radial impact
lines, neighbouring-card displacement and a stage jolt. Success after a retry
could create a larger 170px burst. The previous pass focused on ambient motion
and demonstrations, leaving this layer intact. Historical tests even required
these exact effects; those expectations now check the owner's revised intent.

The new direction is gently handling toys: immediate small compression, smooth
return, clear retained answer state and quiet settling. Motion explains an
object's destination or the child's gesture. It should not imply a blow,
rejection or impact. Making a harsh animation slower does not solve its meaning.

## Audit and treatment

| Pattern | Before | Local correction |
|---|---|---|
| Shared success | Held squash, overshoot, flash, rays, neighbour and stage recoil | Removed generated impact effects and displacement; small local acknowledgement; retained game-specific success state |
| Comebacks / streaks | Larger bursts and expanding petals | Same visual intensity for every success; assistance, counters and existing audio untouched |
| Touch / release | 5–14% squash/stretch and spring past rest | 1.5% compression, 1px press, smooth 220ms return; no learning-screen finger ripples |
| Wrong choice | Shared lateral shake plus 5–8° oscillation in nine game families | Brief opacity acknowledgement, no rotation or sideways refusal; existing piece orientation preserved |
| Entry / reveal | Cards arriving from 24–30px away, rotation, large zoom; letter from 20% size | Small 3–4px arrival or fade; letter from 98%; clamped easing |
| Legacy star entry | 20% → 125% size, −40° → +8° rotation | 94% → 100%, no spin; timing unchanged |
| Matching | Lift then scale-settle on successful cards | 2px selection lift; matched cards remain fully visible and stationary with earned outline |
| Piece placement / return | Overshooting seat and spring return | Short monotonic seat; return follows a smooth path |
| Pond collection | Transfer arc with −6° rotation and 18px lift | Smaller 6px arc, no rotation; same destination, 560ms duration and finish/cancel/fallback callbacks |

Reviewed and retained: finger-following, pouring, moving game targets, functional
letter rotation, door opening, construction transfers and the existing slower
v360 hand demonstrations. Feed transfer/proximity and most newer scene-specific
movement were already restrained. No blanket slowdown, new mandatory wait,
change to learning difficulty, reward calculation or curriculum.

Implementation touches the shared feedback and CSS plus retry methods in Book,
Puzzle, Costume, Look, Shadow, ToyBox, Word, Workshop and Ears families. The
unfinished v358 drum work is preserved; changing its inherited retry presentation
does not claim that work complete. A bounded read-only audit used Luna medium.

## Validation

- **1,685 automated tests pass.** Runtime cases prove real touches do not create
  flashes/bursts or move stage/neighbours; new input interrupts feedback; six-miss
  assistance and five-success recovery still operate; reduced-motion success
  remains visible; stale touches cannot create feedback.
- Desktop/390×844 browser: wrong matching choice → correct match → next board
  available; no effect layers, stage translation or matched-card animation.
  Matched cards remain opacity 1. Peekaboo door opening preserves its useful turn
  with non-overshooting easing and Next/Close controls.
- Phone Feed: replay guidance → drag correct packet into basket → successful
  delivery → Continue. Reduced motion: select packet and tap basket → same
  delivered state and continuation, no CSS animation. Zero impact layers.
- Phone intro and party: readable letter reveal, replay/continue, three visible
  stars and reward controls. The intro uses clamped easing. Screenshot evidence
  records composition; runtime/style checks establish the motion behaviour.
- Palette scan: zero off-palette hex colours; existing 36 structural stroke uses
  unchanged. Syntax and whitespace checks pass.
- Isolated review fixture preserves real feedback hooks while silencing speech
  and sound output. User progress is untouched. This improves on a silent fixture
  that previously bypassed the shared sound-triggered feedback route.

This is targeted adult verification, not a full playthrough of every mini-game,
physical-device or child sensory-comfort testing. Exact amplitude/timing choices
still need the owner's observation with a child. Scenery and audio are preserved.

Evidence: [matching](../letter-garden/reviews/gentle-interaction-v361/matching.png),
[intro](../letter-garden/reviews/gentle-interaction-v361/intro-phone.png),
[reward](../letter-garden/reviews/gentle-interaction-v361/reward-phone.png).
Recovery: `.qa/baselines/v361/RESTORE.md`, per-file snapshots and checksums.

Next: try matching and feeding in v361. Compare a wrong choice, a correct answer,
and the reward. Flag the specific action if anything still feels like a strike,
snap or refusal; reopen that interaction only.
