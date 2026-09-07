# Chapter-specific garden rewards — September 7

Activity results and chapter completion previously rendered Boat's paper-boat reward for every chapter. Boat retains that scene. Other chapters now use their existing meadow, orchard, lagoon, night, peaks or river identity on a small garden island, with a separate bed of earned blooms. Habitat artwork is reused from the individually refined map miniatures.

Growth is derived from distinct successful activities in the current world's existing `bests` keys, capped at three. A completed legacy world receives the full three blooms. Unrelated Boat progress cannot grow another chapter's reward. The art writes no saved state, creates no new payout and does not change star thresholds. Completed worlds already have the matching three-flower bed on the map; this pass does not move any map controls.

Reward screens pause the floating ambient butterfly/firefly layer so it cannot cross the garden picture or stars. The static scenic background, existing success effects and chapter-completion characters remain. Flower-bed rendering accepts an optional count while retaining its existing full-bed default for map uses.

Validation: all 37 tests pass, including distinct/current-world progress derivation, legacy completion, Boat preservation and no-write rendering. Reviewed all 18 habitat/growth combinations in a sheet, orchard activity result on 320×568, night result against the actual dark backdrop, and river completion on both 1024×768 and 320×568 (reduced motion). Garden art, star plaque and navigation were visually separate in these samples. The fixture seeds progress before establishing its read-only fingerprint; that seeding is not a production write.

Local version: `letters.html?v=20260907-rewardhabitats1`. Not deployed. Recovery archive and QA evidence: `.codex-checkpoints/letter-garden-reward-habitats-20260907/`; `styles-before.css` separately preserves the pre-pass art stylesheet. Other art families, full device coverage and child learning evaluation remain unfinished.
