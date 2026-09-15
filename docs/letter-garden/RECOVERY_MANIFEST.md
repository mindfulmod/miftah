# Letter Garden local-checkpoint recovery manifest

Recovered on 2026-09-15 into `/Users/main/Documents/GitHub/miftah/.local-work/letter-garden-next-major`, on branch `codex/letter-garden-next-major`.

## Baseline and method

- Clean starting commit: `55f34576f0ebfc02bcf115452101b37adfbb4536` (`20260908-batch50`).
- Recovered interval: `2026-09-09T01:43:40Z` through `2026-09-10T02:41Z`.
- The replay used the literal `custom_tool_call` patch payloads and recorded shell-edit commands from the session JSONL files below. Actions were ordered by their recorded timestamp.
- Every reference to the vanished `/tmp/letter-garden-next-major` worktree was redirected to this durable clone.
- Git staging, commits, pushes, deployment, preview-server startup, deletion commands, and writes to the original mixed workspace were excluded.
- Commands that edited a file before a later check failed were retained. Patch calls that failed in the original history were allowed to fail again and were not reconstructed by inference.

Primary history:

- `/Users/main/.codex/sessions/2026/09/04/rollout-2026-09-04T20-11-47-01a06ee8-36c3-7a33-b5e1-0415177341d2.jsonl`

Delegated edit histories:

- `/Users/main/.codex/sessions/2026/09/08/rollout-2026-09-08T21-51-03-01a083dc-8752-7c02-acc1-b7221bb168f4.jsonl`
- `/Users/main/.codex/sessions/2026/09/09/rollout-2026-09-09T21-47-31-01a088ff-a81e-72d0-b23b-f52154968410.jsonl`
- `/Users/main/.codex/sessions/2026/09/09/rollout-2026-09-09T21-47-46-01a088ff-e3f3-7320-af75-ca9df25e4ea6.jsonl`
- `/Users/main/.codex/sessions/2026/09/09/rollout-2026-09-09T21-48-04-01a08900-291a-77a0-8841-8ee5dfaecebb.jsonl`
- `/Users/main/.codex/sessions/2026/09/09/rollout-2026-09-09T22-14-47-01a08918-9e07-7541-895c-0a843fd4025e.jsonl`
- `/Users/main/.codex/sessions/2026/09/09/rollout-2026-09-09T22-15-03-01a08918-de97-7303-a877-9b379b724041.jsonl`

The sibling logs under the same 2026-09-08 and 2026-09-09 session directories were searched for the vanished worktree path as an audit backstop.

## Recovered checkpoint layers

- Input reliability checkpoint previously identified as `96a90e6`.
- Boat and Smile journey checkpoint previously identified as `31a540b`.
- Selected 100-item robustness and practice checkpoint previously identified as `b67b106`.
- Earned decorating garden and gentle daily practice checkpoint previously identified as `50dde6c`.

The final layer includes the recorded `LettersBoot`, `LettersState`, `LettersDecorations`, and `DecoratingGarden` modules; the reliability, journey, batch100, daily, and decorating tests; the shared `LettersGame`, `MiniGames`, `GardenPractice`, `LettersWorlds`, `LettersStrength`, `LettersGardenArt`, HTML, and art-pass CSS edits; and the recorded review/status documents and QA fixtures that could be regenerated from text commands.

## Verification and limits

- Immediately after the recovery and before follow-up agents took ownership, `node --test src/letters/tests/*.test.cjs` passed **115 tests, 0 failures**.
- Syntax checks passed for the recovered production JavaScript, and `git diff --check` passed for the recovered shared files.
- `letters.html` was repaired to the final recorded `20260909-garden-daily1` dependency order, with `LettersDecorations.js` loaded before `LettersState.js` and `DecoratingGarden.js` before `LettersGame.js`.
- The Git object for `50dde6c` is no longer present (`git cat-file -e 50dde6c^{commit}` fails). The intermediate objects named above therefore cannot be used for a byte-for-byte tree comparison.
- This is a command-history reconstruction with behavioral verification, not a claim that every recovered byte matches the lost commit. Timestamp ordering between concurrent agent logs and originally failed post-edit checks are the main sources of uncertainty.
- Browser screenshot binaries referenced by `BATCH100_REVIEW.md` and `GARDEN_DAILY_REVIEW.md` were not embedded in replayable shell commands and were not recovered. Text QA fixtures and test/palette logs were recovered. Those image links remain provenance for the lost local review artifacts.

Files created independently after recovery began are outside this reconstruction: `LettersMapArt.js`, `letters-map-world.css`, `LettersActivityArt.js`, `letters-activities.css`, `scripts/serve-letter-garden.mjs`, `release-contracts.test.cjs`, and `docs/letter-garden/reviews/three-stages/home-before.jpg`.

The current local follow-up is tracked as three bounded packages: home
habitat/navigation, remaining activity families (including Catch gentle misses
and wider familiar Pairs retrieval), and local qualification/offline. These
packages are additive local work after recovery, not byte-exact reconstruction
of a lost commit. Current browser/offline evidence is recorded in THREE_STAGES_REVIEW.md. Physical-device and Arabic educator review remain pending.
