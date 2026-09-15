# Gentle daily practice and My Garden — local review

Implemented September 9, 2026. Preview version `20260909-garden-daily1`. Combines the approved daily-practice, optional-challenge, and small decorating-garden packages. This completes those packages, not the entire major release.

## What changed

- Daily practice now runs four untimed Pond/Pop rounds followed by four Feed rounds. Both offer two choices from completed content, round progress, the selected pet, and the existing garden/pond scenery. Chapter curriculum and game order are unchanged.
- Burst is a separate optional practice-hub activity. Its 30-second clock pauses on request or when the page is hidden, requires an explicit visible-page resume, and replays the target after resume. Paused answers are inert. Existing scoring thresholds remain.
- My Garden has four generous slots and a picture-only earned-item shelf. It supports tap or keyboard selection/placement, dragging, moving an item, replacing an occupied space, returning items to the shelf, and up to 20 session undo steps. The selected pet reacts to placement; reduced motion omits that reaction animation.
- Decorations derive from existing Boat growth (three flower patches and a paper boat) and six supported owned stickers: star, palm, dove, fish, boat, lantern. Unowned items are absent. Placement never spends currency or changes ownership. New players get a route back to lessons. This is deliberately one scene and a small asset set.
- The world map has distinct wordless practice/decorating destinations; chapter and daily completion include a decorating shortcut. Existing scenery, Boat reward art, stars and learning controls remain.

## Progress and recovery contracts

The existing `daily:pop`, `daily:feed`, and `daily:burst` best keys are reused. Only improvement pays stars; replay does not pay twice. Gentle daily practice and Burst share the existing daily stamp/island payout. Neither advances chapter completion.

Layout alone is stored in `quran-trainer:letters:garden-layout` as `{version:1, slots:[...]}`. Normalization repairs malformed/duplicate slots, hides unavailable decorations without discarding their saved IDs, and preserves all other save keys. Undo history lasts for the current decorating visit; the layout persists across reloads.

Pre-package recovery checkpoint: `b67b106` on `codex/letter-garden-next-major`. Earlier work is also retained at `31a540b` (reference journeys) and `96a90e6` (reliability). To inspect the old code without resetting this work, create a separate checkout:

```sh
git -C /Users/main/Documents/GitHub/miftah/.local-work/letter-garden-next-major worktree add --detach /tmp/letter-garden-before-garden-daily b67b106
```

This restores code only. Player saves remain in their browser origin and are not reset by this release. The original mixed working tree was not used for implementation or staging.

## Verification

- **115/115 automated tests pass** via `node --test src/letters/tests/*.test.cjs` (19 added in this package). New cases exercise catalog ownership, layout repair/moves, pointer ownership/cancel/teardown, undo, daily composition, timer pause/resume/deadline races, legacy reward keys, daily completion isolation, and separate layout storage. UI interaction tests load the real decoration model.
- Syntax checks of all seven touched/new production JavaScript files and `git diff --check` pass. The art palette checker runs in its configured report-only mode; existing color/contour debt remains, so this is not a strict palette pass.
- **Actual 320×568 browser play:** full four-round Pop → four-round Feed → stars → daily completion → map. Seeded legacy Pop best 2/Feed best 3 and wallet 5 ended with wallet 6; another perfect Pop replay kept it at 6. Boat stayed complete and the next chapter stayed unchanged.
- **Garden play on phone and desktop:** Enter/Space placement, tray-to-slot drag, slot-to-slot drag, remove/undo, replacement/undo, four-slot saved reload, shelf paging, empty ownership, and reward-to-garden/home routes. The fixture retained owned items and the selected scarf-wearing pet. Its ownership/wallet/progress audit remained unchanged during decorating.
- **Burst in the browser:** keyboard pause and resume, answer after resume, and timeout completion. The paused timer ring remained exactly unchanged while other testing took longer than the remaining challenge time. The rendered grid had the `inert` attribute. Hidden-tab/resume and wrong-pointer/teardown races also have deterministic tests.
- **Visual checks:** daytime desktop 1280×720 and phone 320×568, nighttime garden, reduced-motion phone, map entries, Boat completion with both optional-practice buttons, daily pond, and challenge pause. No missing pupils, hidden stars or clipped completion controls in these checked compositions.
- The old phone QA wrapper used `document.write` and produced observer warnings during frame setup. It was changed to a normal HTML iframe wrapper; the game error trap and direct desktop checks then reported no game errors. The local QA harness remains under `.qa/` and is not production code.

Screenshots: [garden phone](reviews/garden-daily/garden-phone.jpg), [garden desktop](reviews/garden-daily/garden-desktop.jpg), [daily pond phone](reviews/garden-daily/daily-pond-phone.jpg), [daily pond desktop](reviews/garden-daily/daily-pond-desktop.jpg), [Boat completion](reviews/garden-daily/boat-completion-phone.jpg), [paused Burst](reviews/garden-daily/burst-paused-phone.jpg).

## Limits and next work

Browser play used a separate localhost QA origin with deterministic, muted fixtures. It did not reset the user's preview saves. Actual audible-device quality, physical phone multi-touch, offline/service-worker upgrades, multi-tab storage conflicts, Arabic educator review and supervised child sessions remain release qualification work. Voice redesign remains paused.

Next implementation package: the remaining activity families (matching/catching, joining/assembly, later vowel/decoding content), using the established reference journeys. Propagate reviewed habitat/pet/wardrobe compositions and verify the full 22-world curriculum before release qualification. Learning evidence still needs a deliberate supported-versus-independent response model; this package does not make new learning-effectiveness claims.

Bounded Sol and Luna tasks handled the timer/daily engine, earned-layout model and regression tests. Root handled shell integration, interactions, art fitting, review, corrections and browser play. No full-history delegation or measured token-savings claim. Everything remains local; nothing was pushed or deployed.
