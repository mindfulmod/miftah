# Word Workshop — September 7 local review

The permanent practice garden previously offered only Boat's Feed, Dot Garden and Garden Paths. Word Workshop now makes the existing Build game available for independent replay after relevant curriculum progress. This fills the later-practice gap without creating another assembly mechanic or changing required lessons.

## Behavior

- The Workshop picture appears only when at least one world with Build has a positive saved Build best, or is completed in a legacy save, and supplies usable items with two or more parts.
- A wordless chapter picker uses familiar Arabic chapter glyphs; the real-word chapter uses the drawn book icon. Each chapter retains its own live item generator. Pools from different sound rules are not mixed.
- A session reuses Build's four-round selection, right-to-left assembly, decoys, retry scaffold and whole-form reveal. No currency, completion, activity-best or mastery writes occur through this optional route.
- Completion and the Home control return to the Workshop picker. The picker's Home returns to the practice garden. All routes remain inside Letter Garden.
- The Workshop prompt uses measured Arabic ink fitting, including stacked marks. Replay retains the whole target while individual placed parts are spoken.
- The practice hub becomes a two-column picture grid only when the fourth activity is unlocked. Beginners retain their existing three options.

## Evidence

32 Node tests pass. New tests cover eligibility (including legacy saves, partial Build progress, unreached chapters and empty pools), separated chapter pools, completion without reward writes, and whole-target replay. Existing Build teardown tests protect pending completion when leaving during animation.

Actual phone browser play at 320×568: selected Workshop and the Muqattaat chapter, assembled all four target combinations, and returned to the picker. Later all-unlocked testing checked marked-letter assembly, exiting during success, and an unchanged wallet/bests/progress fingerprint. The stacked-mark prompt initially exceeded the old replay card; measured fitting corrected it and was visually rechecked. The full chapter picker scrolls within its own area. A fresh-progress fixture exposes no Workshop entry.

Desktop 1024×768: inspected the four-choice hub, chapter entry and real-word Build layout. Reduced motion was exercised in the later phone chapter. Physical-device input, full late-content matrix, audible speech evaluation and child learning outcomes remain unverified. Voice redesign remains paused.

Local version: `letters.html?v=20260907-workshop1`. Not deployed. Recovery archive and isolated QA fixtures: `.codex-checkpoints/letter-garden-workshop-20260907/`. Existing local collection2 art and Burst fixes are retained.
