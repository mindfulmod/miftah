# Letter Garden — next major release brief

Status: approved for local implementation, including My Garden and gentle daily practice with optional Burst. Follow `RELEASE_STATUS.md` for completed work and remaining gates. Prepared September 8, 2026 against production `55f34576f0ebfc02bcf115452101b37adfbb4536` / `20260908-batch50`. This document is the starting context for the next release; earlier pass logs are supporting evidence, not required reading every task.

## Release promise

A child aged 4–6 who is new to Arabic can understand what to do, practise without unnecessary pressure, and see their garden become more personal as they learn. Keep the live game, its curriculum and earned possessions. Improve its execution and the relationship between learning, play and rewards.

Do not use a target number of fixes as the release definition. Use completed journeys and verified outcomes. No framework rewrite, new curriculum, voice service, recorded audio, external navigation, account system or unrelated Miftah work. The approved daily-practice change is an exception to preserving orchestration, not a change to the chapter curriculum. Publication requires a separate request.

## What exists

Source inventory: 22 worlds across meadow, orchard, lagoon, night, peaks and river; 12 core game implementations plus Dot Garden and Garden Paths. Daily review, check-up, and Word Workshop reuse activities. Seven initial letter packs lead into joining, muqattaat, vowels and later decoding; retain that order.

Supporting screens: hatch, interactive meet/reveal, world map, per-game stars, chapter completion, practice hub, wardrobe, sticker album/inspector, grown-up summary and stamp calendar. Eight pet bodies, 14 accessories and 36 stickers are already represented in the 227-row visual inventory. The inventory needs reconciliation with the current 22-world source: some rows and deployment statuses predate recent releases.

Preserve the corrected pond, garden scenery, visible character eyes, centered glyph fitting, separated flower/star areas, wordless child controls, alternative tap interactions, and reward-on-improvement rules. The latest release has 53 passing tests; many are isolated logic tests, not exhaustive browser or device coverage.

## Findings and priorities

Evidence labels: **observed** means exercised or viewed in the browser during this audit; **source** means a concrete current code path; **risk** requires a reproduction before treating it as a bug; **proposal** changes product behavior and needs agreement.

| Priority | Finding | Evidence / location | Smallest useful response |
|---|---|---|---|
| P1 | Keyboard cannot split a joined form | Observed Enter and Space do not advance `unfuse-whole`; `MiniGames.js`, Unfuse handlers use pointer events only | One shared activation path for tap, keyboard and drag completion |
| P1 | Learning evidence mixes different tasks and motor speed | Source: `LettersGame.startGame` records strength from sound-effect names; `LettersStrength` uses a 3.5-second fast threshold for all tracked activities | Explicit learning outcomes with activity, assistance and task type; separate recognition evidence from drawing/assembly participation; preserve old data |
| P1 | Beginner support is concentrated in Boat | Source: `startGame` sets `beginner` only for `pack-boat` | Use experience with the current skill to introduce each new mechanic gently; keep chapter order and content |
| P1 | Daily review begins with a 30-second Burst round | Source: `LettersWorlds.dailySession`; Burst uses an elapsed deadline even in a background tab | Approved direction: untimed daily default; keep Burst as an optional challenge; specify foreground pause behavior |
| P1 | Initial UI depends on network/font completion | Source: constructor waits for `loadWords` and ink warmup before first screen, no loading state or explicit fetch timeout | Render a friendly local shell immediately; bounded font/data fallback; progressively prepare late-word pools |
| P1 | Trace does not track the stroke's pointer identity | Source: boolean `drawing`, every pointermove is accepted while drawing; any window pointerup calls penUp | Record active pointer ID and test two fingers, unrelated pointer-up, resize and cancellation on real touch hardware |
| P1 | Keyboard replay and adult gate are incomplete | Source: main play speech bubble uses pointerdown only; adult gate has pointer hold handlers only | Accessible activation for replay; keyboard hold equivalent with repeat/exit cancellation for the gate |
| P1 | Adult sound toggle does not immediately cancel speech | Source: grown-up toggle changes SoundSystem only, unlike topbar mute | Route both through a single mute action; verify actual spoken utterance cancellation |
| P1 | Valid JSON with the wrong shape can break saved state | Source: generic loadJSON accepts arbitrary non-null values; wallet/pet/collection consumers expect shapes | Validate and migrate each stored record; preserve valid fields and original backup; never silently reset earned state |
| P1 | Render and timer lifecycle differs by activity | Source: repeated local `alive`, `busy`, timeout and capture patterns | Small shared cleanup/round contract, introduced incrementally; test interruption before spreading |
| P2 | Main map has competing destinations | Observed: activity toolbar plus separate practice button; two different destinations use flower imagery | Stronger current-stop emphasis; distinct picture for each destination; retain accessible collection shortcuts |
| P2 | Later joining surfaces feel less like places | Observed Unfuse is a large lightly decorated panel; source uses common backdrop outside Boat/Pop | Dedicated workbench/connection details within the established garden materials; preserve legibility and space |
| P2 | Wardrobe spends much of the narrow screen on shelves | Observed 320×568: small pet relative to three shelf bands | More prominent pet, stable preview area, clearer shelf browsing and owned/locked/selected states |
| P2 | Learning views can show the same glyph as the correct answer | Source: standard prompt displays current target; useful matching, not pure auditory recall | Explicit supported matching versus listening modes, initially in optional practice; do not mislabel matching success as independent recall |
| P2 | Garden Paths accepts any mark as participation | Source: `hasInk` enables advancement | Keep it explicitly exploratory; improve guide/copy cue and feedback without pretending it grades handwriting |
| P2 | Styles and art rules have accumulated exceptions | Source: large base stylesheet plus successive art overrides; duplicated pet accessory drawing; stale comments and art rules | Consolidate touched families only; shared safe areas and tokens; remove superseded declarations after visual comparison |
| P2 | Existing tests cannot prove every visual state | Risk: mocked DOM/timers, muted fixture play; prior clipping regressions occurred in combinations | Maintain deterministic live-code fixtures, geometry checks and selected full-size state captures |

Other release investigations: slow/offline first launch, missing Arabic voice, long diacritics/words in all tile families, multi-tab save conflicts, storage failure messaging, browser back behavior, orientation changes, updated service worker with old open tabs. These are test targets, not claimed failures.

## Learning and game improvements

Use a short cycle: demonstrate → supported action → less help → revisit later. A missed drop is a motor action, not a wrong letter answer. Track assisted success separately; avoid ranking a careful child as weaker solely for being slow. Do not infer pronunciation from a tap.

NAEYC recommends playful, scaffolded experiences responsive to the child; IES recommends spaced learning and retrieval practice. These support the direction, not a claim that this specific Arabic game has demonstrated learning effectiveness. Test with children and an Arabic literacy educator before describing outcomes as validated.

| Existing game | Next-release improvement | Acceptance condition |
|---|---|---|
| Pop | Keep pond; stronger listen/replay cue; skill-appropriate choice counts and optional listening-only practice | First exposure is understandable; no answer revealed by decorative cues; protected floating bounds |
| Catch | Separate motor challenge from letter evidence; clear basket target, forgiving control and calm alternative | Pointer, keyboard and calm versions reach the same targets; motor misses do not become false recognition errors |
| Pairs | Introduce a new mechanic with fewer pairs, then expand; visually pair related forms | Matching stays distinct from hidden-card memory and independent recall |
| Feed | Stronger pet anticipation, delivery path and basket feedback; reuse packets in hub | Drag/tap equivalence, clean cancellation, one learning verdict per delivery |
| Trace | Active-pointer fixes; material/guide consistent with Paths; clear dot hints | All required glyph clusters accessible; orientation safe; no handwriting-mastery claim |
| Burst | Approved optional challenge direction; pause contract; clear visual pacing | Cannot consume a beginner's daily practice while backgrounded; no reward-rule change without agreement |
| Build | Make RTL slot order and joined result easier to see; retain reversible partial assembly | Short/long words, marks, decoys and repeated pieces render and behave correctly |
| Blend | Show the mark moving into its real position | Exact harakat preserved at the end; keyboard and touch equivalent |
| Fuse | Make the joining seam and final shape legible | Valid contextual shaping and no decorative glyph distortion |
| Unfuse | Fix keyboard path; clearer pull affordance and resting split halves | Touch, keyboard, cancellation and follow-up quiz complete end to end |
| Chain | Clear open connection and final combined form | Long result fits phone; chosen addition stays understandable |
| Parade | Show forms in understandable word-position context | Do not report passive reveals as recall; Arabic educator review of examples |
| Dot Garden | Extend the existing construction/recall pattern to suitable already-taught dot families | Verified dot counts/positions; no introduction of untaught letters; assistance fades gently |
| Garden Paths | Clearer guide → copy progression and a more satisfying drawing surface | Drawing remains exploratory; clear/undo/exit preserve correct state |

New-game recommendation: first deepen these games. The optional new learning variation would be a short **listen-and-find garden trail** using taught letters and existing selection components, with a letter revisited after intervening turns. This should be built as a reusable practice mode, not a fifteenth near-duplicate engine. Do not commit it until the supported-versus-independent outcome model is sound.

Approved headline feature: a small **My Garden** decorating space. Place already-earned flowers, stickers or props into a few generous slots; pets react to placement. Start with a single scene and a limited approved asset set. Save layout separately from ownership. No new currency, random reward system, attendance penalties or account requirement. This provides agency and a reason to enjoy earned rewards; it is not itself proof of letter learning. It can be deferred without blocking the core release.

## Art direction and coverage

Keep the warm outlined storybook garden. Give each activity a recognizable place through ground shape, a few substantial props and purposeful action, not more background clutter. Arabic glyphs remain real text or verified vector/text rendering, never baked into generated illustrations.

1. **Map and habitats:** reserve stable rectangles for glyph, stars, flower growth and current-pet marker. Give all six habitats a coherent prop kit. Check dense neighboring completions, 1/2/3 stars and every growth state in motion.
2. **Characters:** eight-body expression and accessory fitting matrix at actual gameplay/wardrobe sizes. Define body anchors for facewear, headwear and held props; preserve visible pupils and ownership.
3. **Lesson presenters and rewards:** A zero-growth later-chapter QA state currently shows a bare reward island; reproduce the real first-win state before classifying it as a defect, and design a satisfying minimum composition.  egg, key, letter sign, boat/habitat and celebratory stars share contour and lighting rules. Keep Continue and Replay outside motion envelopes.
4. **Activities:** pond, picnic, drawing paper, matching bed and joining workbench each receive a reference composition. Demonstration, retry and success are designed together.
5. **Collections and controls:** preserve the completed sticker motifs; correct remaining fit/contrast rather than redraw all 36 again. Distinct wordless destination icons, unified tool states, stable dialog focus.
6. **Effects and sound:** short, purposeful press, success and placement cues. Duck effects beneath existing speech; test actual audible behavior. Voice replacement remains paused.
7. **Adult surfaces:** honest learning summaries, accessible settings, progress backup/restore and clear distinction between exposure and independent responses. Stamps remain adult-facing.

Use native SVG for the established animated/vector family. Consider image generation only for an explicitly unresolved illustration need. A new model does not, by itself, make an asset better. Compare silhouette, expression, readability and layering at actual sizes.

## September 15 implementation checkpoint

The three local packages are implemented; see THREE_STAGES_REVIEW.md for verification and remaining external gates. These are implementation
packages, not release approval or publication steps.

1. **Home habitat and navigation:** qualify the native SVG habitat bank,
   biome landmarks, current-stop halo, earned growth, daily/practice destinations
   and map safe zones across the 22-world route. Keep map art decorative; unlocks,
   stars and rewards remain owned by the game state.
2. **Remaining activity families:** carry the native SVG activity families into
   the remaining game surfaces and finish the interaction pass for Catch's gentle
   misses and Pairs' wider familiar retrieval. Preserve the distinction between
   motor assistance, matching and independent letter evidence.
3. **Local qualification and offline:** run focused contract tests, resolve all
   local `letters.html` asset references, then qualify the local shell/update path,
   existing saves, representative late worlds, real devices and Arabic content.
   Browser, physical-device, audible, educator and offline evidence remain pending
   until root records them.

## Implementation order

| Milestone | Work package | Exit gate |
|---|---|---|
| 0 — Reproducible release base | Fresh isolated main branch; preserve mixed local work; compact code map; deterministic QA fixtures and current screenshots | One command/fixture can reach each required state; recovery proven |
| 1 — Reliability | Startup fallback, pointer ownership, keyboard/replay/mute, save validation, lifecycle contract | Targeted regression tests and interruption checks pass |
| 2 — Reference journey | Boat entry → Pop → Trace → Feed → rewards → map; next letter pack adds Pairs; introduce approved learning evidence and art patterns | User reviews one complete live journey, phone and desktop, before visual propagation |
| 3 — Remaining activity families | Matching/catching, assembly/joining, later vowels and decoding; verify all 22 worlds | Every game has first-time/retry/success/replay/exit evidence and representative late content |
| 4 — World, pets and practice | Apply calibrated habitat kits, wardrobe and collection polish; approved daily changes; optional small My Garden | Reward/pet/save migration and whole-map state checks pass |
| 5 — Release qualification | Browser/device matrix, existing-save upgrade, offline/update check, Arabic content review, short supervised child play sessions | No unresolved release-blocking defects; known limitations written; separate publish request |

Milestones are bounded implementation tasks, not six unreviewed deployments. Keep a running release checklist; publish once the coordinated release is ready.

## Efficient Astra medium workflow

Astra supports medium reasoning. Use the user's chosen setting; no claim of guaranteed token savings or fixed cost. The guidance below is a project workflow recommendation, not an account billing estimate.

- Keep this brief as stable context. Create a short `RELEASE_STATUS.md` when implementation starts: current SHA, approved decisions, finished milestones, next task, known failures and exact test commands. Update it in place, not with growing daily narratives.
- One focused task per milestone or game family. Stay in that task through implementation and repair; start a fresh task at a milestone boundary when the old conversation is mostly obsolete. Do not paste the entire historical conversation into every task.
- Each task receives the objective, relevant source symbols/files, acceptance cases and baseline screenshots. Read dependency neighbors only when needed. Avoid reading all art logs and all 8,000+ source/style lines repeatedly.
- Group fixes sharing a component or lifecycle; do not group unrelated work merely to reach 50 items. Fix the underlying shared behavior once and verify representative callers.
- Keep one agent by default. Additional agents are not automatically more economical and can duplicate context or collide in shared art/game files.
- Use one controlled comparison per asset family, then propagate. Capture full-size affected states; use contact sheets to navigate coverage, not as the only visual sign-off.
- Run focused tests after behavioral edits; full suite at milestone completion and release. Rerun only when new changes/failures warrant it. Save concise results rather than long repeated tool output.
- Keep ordinary updates brief: decision, changed behavior, test result, blocker. Spend effort on implementation and play-through evidence rather than repeated planning prose.
- Record observed task usage if budgeting is important, then adjust package size. Do not invent token totals from file size or promise that medium ensures correctness.

Suggested task prompt after approval:

> Implement milestone [N] from docs/letter-garden/NEXT_MAJOR_RELEASE.md using Astra medium. Read RELEASE_STATUS.md first, then only the relevant source and baseline fixtures. Preserve Letter Garden curriculum, earned progress and approved art direction. Complete this bounded milestone, including its acceptance checks; fix discovered regressions within scope. Update the compact status and report changed behavior, evidence and remaining release blockers. Keep changes local. Do not re-audit the whole app or expand into unrelated Miftah features.

## Decision points

Approved September 8: include the small earned-reward decorating garden; make beginner daily practice untimed and retain timed Burst as an optional challenge. Overall implementation has not started. Learning-evidence changes must be explicitly included in the agreed direction before modifying interpretation of existing strength data. Never reduce already-earned rewards during migration.

## Sources and audit limits

- OpenAI Astra model documentation: https://developers.openai.com/api/docs/models/gpt-6-astra (medium reasoning supported; no API pricing extrapolated to Codex subscription usage).
- NAEYC developmentally appropriate teaching: https://www.naeyc.org/node/3812
- IES organizing instruction and study: https://ies.ed.gov/ncee/wwc/PracticeGuide/1
- Existing source, art inventory and release reviews; browser spot checks of current map, Unfuse keyboard interaction, wardrobe and reward composition, plus the immediately preceding release's phone/desktop checks.

This is a source-led release audit with representative browser checks, not an exhaustive play-through of every chapter, device, outfit or learner. Confirmation of the listed risk cases belongs in milestone 0/1 and the release matrix. No production/game code was changed for this proposal.
