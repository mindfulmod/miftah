# Letter Garden — next five learning and gameplay passes

Planning date: September 15, 2026. Audited baseline: `a2c8873` / `20260915-garden-life1`. The first implementation of these five passes is now local at `20260915-learning1`; see [LEARNING_PASSES_REVIEW.md](LEARNING_PASSES_REVIEW.md) for delivered behavior, verification and remaining qualification. The proposal below is retained as design context, not a claim that every longer-term idea is finished.

Scope: children aged 4–6 beginning Arabic letters. Keep the existing chapter order, name-first joining lessons, mini-game mechanics, earned rewards and progress. Instructions remain pictorial; practice remains untimed by default, with Burst as an optional challenge. Parent-page work, general art work, publishing and voice replacement are outside this plan.

## What the current code tells us

These are source-audit findings, not new browser-play results. Existing strengths include the gentle Boat/Smile introduction, beginner Pairs preview, tap alternatives for dragging, explicit learning outcomes, guided Blend rounds, per-dot Trace coverage, and Letter Delivery's help and muted fallback. Extend these rather than rebuilding them.

| Finding | Source and consequence | Pass |
|---|---|---|
| Untaught distractors remain possible outside beginner rounds | `LettersWorlds.js` pack `extraItems()` includes every letter outside the current pack. `LettersGame.js` passes that pool through; `MiniGames.js` `buildRounds()` uses it when not beginner. It is not restricted to earlier completed packs despite the comment. | 1 |
| Difficulty is largely based on progress and stars | The shell derives `level` from best scores/chapter stars. `buildRounds()` chooses 2/3/4 answers from that level and the beginner flag, rather than evidence of this particular skill. | 1 |
| Dot Garden can require guessing when muted | Its recall half unconditionally hides the target and speaks it. The context supplies `canListen()`, but Dot Garden does not use it or offer Delivery's visual-help fallback. | 1 |
| Early word bands are not strict | `wordPool(minLen,maxLen)` falls back to the entire example pool when the requested band contains fewer than six words. A two-letter activity can therefore receive longer items. | 1, 4 |
| Most recognition games still expose the target glyph | Pop, Feed, Catch and several later quizzes report supported visible matching correctly, but do not yet offer a consistent transition to independent listening. This is valid teaching support, not evidence of independent recognition. | 2 |
| Mistakes lack diagnostic detail | `LearningSession.report()` retains the target and evidence type, but not the selected alternative or skill/context. Repeating the sound/removing an option cannot explain whether the child confused dot position, shape, vowel or order. | 2 |
| Tactile practice has narrow coverage | Dot Garden covers ب/ت/ث and already follows construction with recall. Garden Paths covers ا/ب/ت and already offers guided/copy drawing. Trace checks glyph coverage, including disconnected dots; it does not assess handwriting quality or stroke order. | 3 |
| Some later activities demonstrate more than they test | Parade reveals contextual forms after taps. Build shows the whole target while pieces are assembled. These are useful guided stages; add supported transfer opportunities instead of relabeling them independent reading. | 4 |
| Daily practice does not yet use the new evidence distinctions | Daily selects six weak items from completed worlds and runs Pop/Feed. `weakness()` uses aggregate right/wrong, streak and recency; it does not distinguish independent recognition from supported responses. Some world's item factories also sample new subsets each call. | 5 |

## 1. Fair challenges and skill-based difficulty

**Child experience:** meet one new idea, succeed with a small choice set, then receive a little more challenge when ready. A new chapter or earned star does not abruptly make every game harder.

- Introduce one shared round planner with stable item IDs, taught prerequisites, eligible targets and distractors. Current-lesson items become eligible after their introduction; older review content comes from taught/completed material. Do not change chapter unlock rules.
- Start unfamiliar content with two meaningfully different choices; add a third after demonstrated success. Keep four-choice play for established skills or the optional challenge. Exact promotion rules are configurable and should be tuned through child play, not treated as research-derived thresholds.
- Separate choice difficulty, target movement and time pressure. Do not increase all three at once. A difficult drag/drop is not an incorrect letter answer.
- Fix Dot Garden's sound-off/failed-prompt path using visible support and replay/help. Availability of a browser speech API alone does not establish that a prompt played successfully.
- Keep word-length bands strict. When a pool is small, repeat valid content with variation or omit an unavailable task; do not silently borrow harder content.

**Done when:** fresh, returning and advanced saves receive only eligible choices; a single eligible option is treated as guided exposure; all relevant rounds are solvable with sound off; difficulty changes do not alter existing rewards or unlocks.

## 2. Recognition, remembering and feedback that teaches

**Child experience:** first see and hear a letter, then find it with less help. If ب and ت are confused, the game briefly draws attention to the different dots and lets the child try again.

- Add shared prompt modes: visible teaching/matching, listening with picture-based help, and supported retry. Reuse Letter Delivery's interaction pattern across Pop, Feed and Catch instead of creating separate listening-game copies.
- Record activity, learning objective, selected answer, available choices and help state. Separate letter-name recognition, syllable recognition, form recognition and construction.
- Keep replay free. Replaying the same sound alone need not make an answer assisted; revealing the target, highlighting the answer or eliminating choices does. A one-choice success is not independent recognition.
- Use brief, content-specific feedback for taught contrasts: dot count/location, changed vowel mark, or first incorrect piece. Avoid overwhelming a beginner with the entire similar-letter family at once.
- After a supported success, revisit that skill later with changed answer positions and a different game. Avoid immediate repetition becoming the only evidence of learning.
- Upgrade the existing check-up to sample the skill it names. Pairs measures matching/location memory; tracing measures guided motor participation; neither should imply independent reading.

**Done when:** visible matching cannot produce independent-listening evidence; wrong choices can be attributed to a specific contrast; assistance and aborted/missed drops are handled consistently; a follow-up round checks the skill without reproducing the previous answer layout.

## 3. A tactile Letter Workshop

**Child experience:** repair a letter by moving its dots, build it, then recognize it among familiar friends. Follow a drawing path and gradually try with less guidance.

- Expand Dot Garden into a **Letter Repair** mode using reviewed shared-body families. Begin with its existing ب/ت/ث material, then add appropriate taught families such as ج/ح/خ and د/ذ. Define valid bodies/dots in content data rather than altering arbitrary font glyphs.
- Move/add/remove one distinguishing feature at a time. Support tap selection plus destination as well as dragging; accept motor corrections without a learning penalty.
- Follow repair with recognition of the finished letter in another arrangement. Construction and recognition remain separate observations.
- Expand Garden Paths beyond its three current letters with staged guidance: complete model, partial guide, copy with a reference. Offer help at every stage.
- Extend Trace's existing body/dot feedback where useful. Keep tracing coverage and free drawing separate from claims about handwriting correctness. Do not add strict stroke-order scoring or automated handwriting recognition in this pass.

**Done when:** all added families have reviewed dot/shape rules, each task has a tap alternative where feasible, drawing assistance remains available, and finishing a trace/repair cannot by itself mark listening or reading as mastered.

## 4. From connected letters to decoding

**Child experience:** connect familiar pieces, notice how their forms change, take them apart, and rebuild a new combination. Later, change a taught vowel and hear how the syllable changes.

- Extend Fuse, Unfuse, Chain and Parade from demonstration into a short demonstrate → guided build → supported transfer sequence. Preserve their distinct drag, reveal, split and connection mechanics.
- Add a **Letter Bridge** challenge inside this family: choose the missing taught piece that completes a connection. Use actual Arabic joining rules, including letters that cannot connect to the following letter; avoid invented joining forms.
- Give Blend/Build targeted repair: preserve correct pieces and highlight the first relevant mismatch. Gradually reduce the visible completed answer when the learner is ready, with an immediate way to restore it.
- Tag syllable and word content by prerequisites, length, marks and joining features. Use a stable catalogue rather than treating a newly sampled subset as the entire taught skill.
- Preserve letter-name recitation in joining and muqattaat. Syllable/word decoding begins in its existing curriculum stages; concatenating letter names must not be treated as sounding out a word.
- Require Arabic educator review of new examples and the actual generated pronunciations used for listening tasks. Where pronunciation is unsuitable, retain visible support and do not label the task an independent listening assessment. No new audio service is required by this plan.

**Done when:** word tasks stay within their declared prerequisites, joining examples render correctly, children can encounter a new combination of taught parts, and guided construction is distinguished from independent identification/decoding.

## 5. Short review adventures that support retention

**Child experience:** a short sequence of familiar games with a different purpose each time—find a letter, repair one, deliver another. Previously learned material returns naturally, with an easy success among harder items.

- Upgrade the existing daily session builder instead of adding another practice hub. Mix a comfortable item, due review and a recently introduced/assisted skill drawn only from already taught material.
- Use the evidence distinctions from Pass 2 for skill-specific review. A traced ب does not postpone a needed listening review of ب.
- Vary the activity while keeping the objective clear. Use Pop/Feed/Catch/Delivery for recognition, Pairs for matching/memory, Workshop for construction, and later joining activities only after their prerequisites.
- Revisit an error after intervening play, and sample retention on a later visit. Add a bounded recent-item history so repeated launches do not cycle through the same weakest six endlessly.
- Keep sessions finite and untimed with a clear ending. Burst remains optional and its time pressure does not define beginner mastery.
- Preserve legacy counts, earned progress and visible rewards. Add new scheduling evidence alongside them; do not reinterpret historical helped answers as independent or remove earned garden growth.

**Done when:** review selection differs appropriately for independently recognized versus helped/traced items, survives reload, rotates tasks, handles sparse progress, and includes later recall without requiring timers or grinding.

## Coverage of existing games

| Existing game or route | Main learning upgrade |
|---|---|
| Lesson introductions | Track taught content; consistent demonstration and guided start (1–2) |
| Pop, Feed, Catch | Fair choices, gradual prompt fading, diagnostic retries (1–2); review reuse (5) |
| Pairs | Retain beginner preview; tune memory load separately from letter knowledge (1–2, 5) |
| Trace, Garden Paths | Broader guided practice; truthful motor evidence (3) |
| Dot Garden | Muted fallback (1); more families, repair and later recognition (2–3) |
| Letter Delivery | Reuse its help pattern; eligible targets and skill-based review (1–2, 5) |
| Blend / Fuse, Unfuse, Chain, Parade | Explicit forms/connection learning and transfer (4) |
| Build / optional Workshop | Targeted piece/order feedback and curriculum-valid composition (4) |
| Burst | Fair known-content challenge; speed separate from learning evidence (1, 5) |
| Check-up and daily practice | Skill-specific sampling and retention, without child-facing ranking (2, 5) |

## Efficient implementation order

1. **First delivery: combine Passes 1 and 2.** Define a small shared item/round/outcome contract once, then integrate it into one complete Boat → next-pack → practice journey before applying it to other game shells. This fixes the most consequential learning problems and supplies later passes.
2. **Second delivery: Pass 3.** Reuse Dot Garden and Garden Paths; add reviewed content families and repair logic without a second activity framework.
3. **Third delivery: Pass 4, then Pass 5 integration.** Build curriculum-valid composition before the review scheduler can select it. Independent content audits and scheduler fixtures may run alongside implementation after the contract is stable.

Use Astra medium for the shared learning decisions and final integration; bounded Sol tasks for individual game-family changes; Luna for catalogue audits and table-driven regression fixtures. Give each task a small brief and specific owned files. Avoid multiple agents editing `MiniGames.js` or `LettersGame.js` concurrently. Reuse one compact acceptance matrix rather than repeatedly auditing the entire application. No token-saving percentage is assumed.

For each delivery, run focused learning-contract tests and play representative desktop/phone journeys: fresh learner, returning learner, repeated mistakes, help/replay, muted/unavailable speech, corrected drag, reload and later review. Check save/reward integrity at integration. Arabic educator and supervised child sessions should assess whether children understand the contrasts and remember them later; code tests cannot establish learning effectiveness.

## Research basis and limits

The preschool IES guide recommends intentional introductions, connecting letters and sounds, repeated hands-on practice and revisiting known letters. Those principles support the scaffolded introduction and tactile/recognition sequence here. Its English examples are not an Arabic curriculum specification. [IES preschool letter/sound recommendation](https://ies.ed.gov/ncee/wwc/Docs/ReferenceResources/TO4_summary_rec_6.pdf).

The broader IES learning guide supports spacing practice, alternating demonstrations with attempts, and retrieving previously learned material. It covers a broader age range and does not validate a particular preschool app or our proposed scheduling thresholds. The game designs above are implementation hypotheses to test with Arabic educators and children. [IES learning and memory practice guide](https://ies.ed.gov/ncee/WWC/PracticeGuide/1).
