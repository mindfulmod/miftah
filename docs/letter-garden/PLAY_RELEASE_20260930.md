# Letter Garden play release — September 30, 2026

Owner-authorized production release of all completed local Letter Garden work.
Entry stamp: `20260930-play-release1`.
Service worker: `miftah-v71-letter-garden-play-20260930`.
Previous production commit: `b5e2990b7c2b25bde1812681e7c816a700f347bc` (v61).
Gameplay/art source checkpoint: `39ff6246922ebe4576192ca1038078eb1553f2c8`.

## Included

- Feed's grounded picnic, child-led delivered result, larger forgiving target and
  tap alternative.
- Pink drawing ink and an initial marker colour matching the selected pet;
  retained multi-colour strokes and rotation-safe drawing/hints.
- Calm Pond choices, floating-leaf contact, replay and child-led results.
- Bounded Arabic prompt rendering and consistent compact screen layouts.
- Refined Feed/Trace/joining materials and unobstructed assembly repair feedback.
- Optional drag-to-match Pairs, tappable fruit and stationary fruit delivery;
  Catch collision follows the actual basket after resize.
- Balanced Burst tray with persistent last-found feedback and a tactile Parade
  form cabinet with larger, fitted forms.
- Grounded rewards and wardrobe, safe stale-control handling, and richer night
  grass without global desaturation.

Existing curriculum, learning/progression rules, earned possessions and the
252 approved audio recordings remain in place. Unrecorded prompts keep the
existing device-speech fallback. No new voice-service dependency is introduced.

The new [five-update plan](NEXT_FIVE_WORLD_PLAY_UPDATES.md) is documentation only;
its proposed pet, exploration, adventure, game and garden work is not part of
this implementation.

## Release checks

- `node --test src/letters/tests/*.test.cjs`: **352 passed, 0 failed**.
- Syntax checks passed for all 22 changed JavaScript/test files, plus the final
  service worker stamp.
- All 44 local HTML references resolve. All 336 service-worker shell resources
  exist. The automated release contracts also verify curriculum inputs, sequential
  unlocks, reward-on-improvement rules, audio and offline behavior.
- `git diff --check` is clean. The nine implementation commits change only
  Letter Garden code/styles, its entry point/cache list, art rules and review docs.
- Palette checker was run: report-only **615 distinct off-palette colours / 842
  uses**, unchanged from the latest reviewed implementation.
- GitHub `main` was fetched and confirmed to be the previous production commit,
  with no divergent commits before preparing this release.
- Prior pass evidence includes actual browser play and saved-state checks across
  desktop, phone and short-landscape layouts. See [Pond](POND_PLAY_REVIEW.md),
  [drawing controls](KID_CONTROLS_FOLLOWUP.md), [materials](PLAY_MATERIALS_REVIEW.md),
  [Pairs/Catch](ORCHARD_TOUCH_REVIEW.md), [Burst/Parade](CABINET_CHALLENGE_REVIEW.md),
  [night colours](NIGHT_COLOUR_REVIEW.md) and [rooms](REWARD_ROOMS_REVIEW.md).

Deployment completion is verified separately against the GitHub Pages workflow
commit and byte comparisons of public release assets. A successful push alone is
not evidence that the live site has updated.

## Known limits

`/art-review` is unavailable in this environment; the existing manual screenshot
reviews are not a passed automated art gate. Palette debt remains, and the
short-landscape standard reward frame has 4.37% dark pixels against the 5% art
target. Wider sticker, hatch and later-biome art work remains open. This release
does not establish full art-bible compliance, physical-device touch coverage,
installed-PWA update behavior or child/educator validation.

## Recovery and next action

The prior production commit remains in Git history. The durable checkout is
`.local-work/letter-garden-next-major` on `codex/letter-garden-next-major`; its
sibling `letter-garden-next-major.bundle` preserves the release history locally.
Do not reset the unrelated outer working tree. A rollback should restore only
this release's changed paths from the previous production commit in a new commit,
with a fresh cache version, then rerun checks and deploy through the same workflow.
Never force-push shared history.

After deployment, open `letters.html?v=20260930-play-release1`, reload if an old
tab still displays the previous art, and try feeding, drawing and the night map.
The next development slice is update 1 in the saved plan when the owner asks to
start it; no part of that plan is silently included in this release.
