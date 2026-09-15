# Boat and second-pack journey pass

Local version: `20260909-journeys1`. Branch: `codex/letter-garden-next-major`.

Changes:
- Wordless native-SVG bud for the two reference chapters; keyboard/touch reveal has a single guarded transition. Letter-card replay also uses click so keyboard activation works.
- Activity pictures follow each chapter's existing sequence at entry and after activities. Completed steps are marked separately from reward stars.
- Pop, Trace, Feed and Pairs report actual round/board progress in the prompt area.
- First-time second-pack play gets beginner choices; its first Pairs board starts with two pairs and expands to three. Replays retain three pairs. Completion uses actual pairs, including small item pools.
- Both reference ponds keep choices visible; second-pack motion is gentle bobbing and respects reduced motion. Other chapters retain their previous moving/static behavior.
- The selected pet accompanies the boat/habitat on activity reward screens, with separate space for stars and navigation. First-two-chapter scenery shares the established garden treatment.

Verification:
- 63 automated tests pass; syntax and diff checks pass. Palette checker ran in its configured report-only mode.
- Boat: complete 320×568 browser journey with reduced motion: four introductions, four Pop rounds (including one wrong choice), three Trace targets via actual drawing gestures, four Feed deliveries, rewards, chapter celebration and map return. Wallet showed 8 stars as expected (2+3+3); next pack unlocked.
- Second pack: complete 1024×768 layout in the desktop fixture with normal motion: three introductions, two-pair then three-pair matching boards, three Trace targets, four pond rounds, rewards, celebration, map return. Wallet showed 9 stars and the next pack unlocked. Reentering the completed chapter skipped to the replay introduction and restored three pairs on board one.
- Visually checked entry glyph fit, phone reward composition, and desktop habitat reward. Boat completion screenshot is in `.qa/boat-complete.png` in this worktree.
- Lower-cost Luna implemented the bounded game changes/tests. Root reviewed and corrected integration through a follow-up: centered reference coordinates and legacy reduced-motion visibility now have regressions. Root implemented shell/art integration and browser play-throughs.

Limits: fixture state is disposable and speech muted; this is not physical-device or audible Arabic QA. Tracing checks exercised coverage and completion, not handwriting-learning effectiveness. Do not claim measured token savings. This is the first two-chapter journey pass, not completion of the full major release. Startup/save resilience, learning-evidence redesign, the decorating garden and remaining chapters are still outstanding. Nothing published.
