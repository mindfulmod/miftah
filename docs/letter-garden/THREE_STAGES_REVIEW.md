# Letter Garden — three local upgrade stages

Completed locally on September 15, 2026. Preview version: `20260915-world-journeys1`. This is an implementation checkpoint, not production publication or a claim of validated learning outcomes.

## What changed

1. **Home and habitats.** Layered riverbanks and substantial orchard trees, reeds, seed baskets, lanterns, peaks and bridges replace the isolated small map decorations. The Boat landmark, sky, garden, route and earned growth remain. The toolbar uses warm raised surfaces; the current stop and pet have more space. Desktop stops are larger. Flowers sit below the star area. The completed route opens on the final chapters instead of a large empty sky.
2. **Activity families.** Matching beds, an orchard Catch scene, a shared joining/building workbench and a Parade wardrobe give eight activities related physical settings. Glyphs remain live fitted Arabic text. Beginner Pairs uses remaining familiar letters on its second board before repeating. A missed falling target slows and returns without counting a motor miss as a wrong letter. Stationary Catch now accepts taps (an inherited `pointer-events:none` rule had blocked them). Build pieces fit the 320px portrait and short landscape workbenches.
3. **Local release qualification.** Added contracts for every generated world, assets, sequential unlocks, best-score payouts, invalid filtered game pools and the offline shell. An unusable game pool opens the existing retry/home screen before a game can award completion. Letter Garden scripts/styles and all eleven word-data files are precached. The existing Amiri Quran face now loads from the already-owned local font files; there is no typeface substitution or new voice service.

The stage work preserves all 22 worlds and their learning order, existing pets/possessions, earned progress and reward rules. The earlier small decorating garden, gentle daily sessions and optional timed Burst were recovered and retained.

## Verification

- **127/127 automated tests pass.** The suites exercise state normalization, earned layouts, daily rewards, input cancellation, replay/best payouts, generated curriculum pools, and service-worker cache installation/fallback/update behavior. Syntax and diff checks pass.
- **Actual browser play:** completed both beginner Pairs boards; observed the second board's additional familiar letter and three-star reward. Completed all four stationary Catch rounds using taps, then replayed all four: balance stayed **23 → 23**, so replay did not pay twice. Build placement and three assembled rounds, keyboard joining, Unfuse activation/follow-up quiz, Chain activation and Parade reveals were exercised. Landscape Build placement and keyboard undo also worked.
- **Visual review:** inspected all eight activity families, 320×568 portrait Build/Catch/Pairs/joining/Parade, 568×320 Build, a 1280×720 desktop home, first/current/completed route states, orchard and night compositions, and the phone sticker album. Caught and repaired Build overflow and the completed-route scroll position during review. No claim of full physical-device or every-state coverage.
- **Offline:** installed the real service worker on isolated `127.0.0.1`, stopped the preview server, confirmed connection refusal with curl, reloaded the actual `letters.html`, and opened gentle daily practice. Local font checks also loaded both Amiri Quran subsets through the worker. Restarted the server and removed only the isolated QA worker/caches afterward. Offline use requires a prior successful online cache installation; first-ever offline access cannot work.
- **Existing save:** reloaded the user's named preview origin without seeding it. Its **20 stars**, completed Boat/Smile chapters, current ذ chapter and blue pet remained intact. Test fixtures ran only on a different origin.
- **Art checks:** manual screenshot comparison; the palette report includes every Letter Garden stylesheet. Existing palette/stroke debt remains report-only, as documented in `ART.md`; this is not a strict palette-clean release. The original Amiri Quran family was checked against production source and retained.

Evidence is in [reviews/three-stages](reviews/three-stages), including [before](reviews/three-stages/home-before.jpg), [after at the same size](reviews/three-stages/home-after.jpg), phone/desktop/night views, completion/replay results, and the [test output](reviews/three-stages/tests.txt). Older lost screenshot links in previous reviews are historical provenance; see [RECOVERY_MANIFEST.md](RECOVERY_MANIFEST.md).

## Resume and recovery

Durable checkout: `/Users/main/Documents/GitHub/miftah/.local-work/letter-garden-next-major`, branch `codex/letter-garden-next-major`. The original mixed workspace was not reset or used as the source of production edits. Its release-status pointer is updated separately.

Run from this checkout:

```sh
node scripts/serve-letter-garden.mjs 8790
node scripts/generate-letter-garden-qa.cjs
node --test src/letters/tests/*.test.cjs
```

The generated `.qa` pages are disposable, excluded from the commit, and reject the user's named origin. Use `http://127.0.0.1:8790/.qa/stages-phone.html?scene=build` for fixture checks. The user preview is `http://letter-garden-next.localhost:8790/letters.html?v=20260915-world-journeys1`.

A durable local Git checkpoint and bundle preserve this recovered-and-upgraded tree. The original production baseline is `55f34576f0ebfc02bcf115452101b37adfbb4536`. Recover by cloning the sibling `letter-garden-next-major.bundle` into a new folder and checking out `codex/letter-garden-next-major`; do not reset an existing mixed checkout. Prior vanished `/tmp` commit IDs cannot be restored directly.

## Remaining major-release gates

Physical iPhone/Android multi-touch, rotation and installed-PWA update checks; audible speech/sound balance across devices; Arabic educator review (especially connected forms/marks); supervised sessions with children aged 4–6. The eight-body/accessory fitting matrix and adult progress/backup experience remain future stages. Moving Catch's no-penalty misses have automated coverage; this pass's complete browser Catch runs used reduced motion. No production push or deployment was made.
