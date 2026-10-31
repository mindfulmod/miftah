# Letter Garden v362 — playful game motion

Local follow-up, 2026-10-28. Owner request: check remaining game-specific animations against the gentler direction without making games static. Reused the existing inventory and review controls. No audio, learning/progression changes or publishing.

## Findings and treatment

| Game / element | Previous motion | Treatment |
|---|---|---|
| Fishing catch | 32px upward launch and 106% midpoint size | 10px shallow arc following the bucket destination; shrinking continuously |
| Hunt collection / parcel delivery | 28–30px arcs, Hunt overshoot, parcel rotation | 8–10px arcs, no overshoot or parcel spin |
| Water gate / bend | Gate rattles on a wrong answer; bend rocks through four turns | Quiet opacity acknowledgement; one 6° turn cue around its actual orientation |
| Hunt retry / scenery | Repeated rotation shared by errors and discovery | Errors acknowledge through opacity; discovery retains a small lift, kite flight, flag breeze, rain and boat bob |
| Drum | 6% compression, large expanding ring and 5px seed jump | Small surface compression, subdued local ring and 2px seed lift; immediate beat response retained |
| Looking / Friend Find / Garden Together | Overshooting eye hint, tilted retry, 7px pet hop | Small eye response, quiet retry, 3px pet hop |
| Fishing pail / ripple | Squash and opposing rotations, ripple grows to 240% | 2px pail settle; ripple grows to 170% |
| Balloon play | Strong press, wide petal expansion, endless release bob | Small press/petals; release cue nods twice then rests |
| Workshop / shadow | Repeated hints, animated empty hole, overshooting word and shadow arrival | One 1px hint nudge plus retained outline; still hole; monotonic arrival |
| Walking friends | Broad sideways/upward steps and alternating rotations | Smaller steps, same walking cadence |

Purposeful actions remain: fish swimming where learning mode permits, water flow and elbow turns, balloon pumping/inflation/release, stamp placement, puppet play, bus departure, drag tracking and toy assembly. Action completion durations and callback contracts are unchanged. Hint repetition is deliberately reduced.

The browser review caught two cascade leftovers: removing a component animation exposed an older glowing hole animation, and a shared toy rule restored two hint repetitions. The component now explicitly disables the hole animation and gives its one-cycle hint sufficient specificity. The helpful outline stays after movement finishes.

## Verification

- 1,685 automated tests pass, including fishing arrival once/fallback/destruction, Hunt flight cleanup, Water gate input, balloon pumping, drum replay interruption and reduced-motion outcomes. After the final CSS cascade corrections, 20 focused workshop/shadow/attention tests pass.
- Desktop 1280×800: fishing two-catch visit → earned-star finish → Continue; Water Garden wrong gate → matching gate → flower arrival → child-operated Next.
- Phone 390×844: three balloon pumps → release → slot replenishes; Hunt scenery play, wrong answer, successful collection and continuation. Reduced-motion Hunt collects immediately, has no flight overlay and retains its Next control.
- Phone: Shadow match → playable puppet; two drum taps → free beats, replay and Next controls. Workshop wrong choice → one 700ms hint, retained 3px outline, still empty hole; correct choice assembles the word.
- Final computed workshop styles: hole animation none, hint iterations 1, settled transform none, gold outline 3px. Balloon release invitation: two 2.4s cycles. No browser errors observed in the review tab.
- Palette scan: no off-palette colours; existing 36 structural stroke uses unchanged. Whitespace and syntax checks pass.

This is targeted adult browser verification, not a complete playthrough of every mini-game or a child sensory-comfort study. Screenshots show composition and resting states; source/runtime checks establish the motion changes. Review speech is silenced, and user progress is untouched on the isolated review origin.

Evidence: `docs/letter-garden/reviews/game-motion-v362/` (phone balloon, Hunt reduced motion, puppet and workshop hint; test and palette summaries). Recovery: `.qa/baselines/v362/RESTORE.md` with per-file snapshots and checksums, including prior uncommitted work. The earlier unfinished v358 drum feature remains unfinished; only its existing animation presentation was adjusted here.

Next owner check: try Fishing, Water Garden, Balloon Pump and Hunt in v362. Look for a calm response that still clearly follows the child's action; report the specific action if anything feels too sharp or too quiet.
