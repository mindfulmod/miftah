# First live calibration — ready for owner review

Scope: completed map-stop composition, meadow flower drawing, Pop pond in Boat Letters and the next chapter, and Pop results. This is a reviewable slice, not completion of the 227-item inventory.

## Changed

- A `map-node` owns the level button and a separately positioned flower bed. The flower bed begins below the button's full bounds, leaving the three-star plaque protected. Stars, glyph and button are not moved independently by decorative layout.
- New meadow flowers have five petals, tapered stems, leaves and a planted ground shape. Flower-head motion is separate from the positioning group. The old oval-on-stick meadow decal is replaced; other biome kits remain unchanged.
- Boat flowers use the same petal family. Its paper planes gained restrained crease highlights and folded-side shading. Existing flower growth thresholds remain unchanged.
- `lg-pond-activity` follows Pop and its result screen, independent of chapter. The next chapter receives the curved aqua pond and riverbank scene rather than a generic cream panel. Other activities retain their existing surfaces.
- A few edge ripples add water detail without covering letters. Boat/reed footer space is reserved on short phones and desktop layouts. Pop results retain the same riverbank and show the earned boat with unobstructed stars.
- No changes to question selection, movement rules, scoring, rewards, speech, ownership or saved progression in this slice.

## Verification

- 320×568: completed stop and next-chapter pond; beginner Boat with two choices; map neighbors with 1/2/3-star plaques and seeded/sprout/bud/mature mastery states.
- Normal motion: actual flower-head rotation confirmed; 80 samples over eight seconds found zero flower-head/plaque overlaps, including four neighboring completed levels. The phone audit reports its actual 320px layout width.
- Reduced motion: comparison scenes retain their layout, target visibility and reward-star sizes.
- 1024×768: pond and footer reviewed with large answer tiles; map matrix audited separately.
- Played four correct rounds in next-chapter Pop, reached three stars, and replayed from that result. Testing uses an isolated origin; no player currency or progress is used.
- 18 automated tests pass, including a new regression for Pop's chapter-independent theme and clearing it when leaving the activity. JS syntax checks pass.
- Same-size before/after scenes use the saved production files and deterministic fixture choices. Compare artwork and composition directly rather than different chapter screenshots.

## Review artifacts

- `.codex-checkpoints/letter-garden-calibration-20260906/map-comparison.jpg`
- `.codex-checkpoints/letter-garden-calibration-20260906/pond-comparison.jpg`
- `.codex-checkpoints/letter-garden-calibration-20260906/desktop-pond.jpg`
- `comparison.html?scene=home` and `comparison.html?scene=nextpop` in that local checkpoint directory render the actual baseline and current game classes.

Baseline: `before.tar.gz` contains the six production files touched by this slice. Restore only the intended files after preserving any later work. Remaining art families and full curriculum play-through are outside this calibration.

Next decision: review flower scale/style, pond treatment and result composition before applying this direction to more game families.

Final evidence: normal animation audits reported `320px: 80 motion samples; 0 overlaps` and `1024px: 80 motion samples; 0 overlaps`. A night-background phone fixture retained readable controls and letter targets. Night scenery is preserved, not a newly redesigned family.
