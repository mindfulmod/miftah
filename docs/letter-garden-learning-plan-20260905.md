# Letter Garden: learning and play, ages 4–6

Owner direction: complete beginners, live Letter Garden only. Preserve curriculum, pet ownership, rewards and saved progress. Voice work remains paused. This document separates implemented changes from proposed games.

## Implemented in this pass

- Celebration and proud faces retain open eyes and pupils. The screenshot defect came from an opaque lower-lid path covering the pupils.
- Ported the native Lumi bird, Mina rabbit and Rafi bear anatomy and all 14 existing wardrobe items from the prototype into an isolated live renderer and stylesheet. They are free selectable bodies in the existing pet room. Existing bodies, owned accessories, colors, growth thresholds and pet knowledge remain available; no automatic replacement of a saved pet.
- First Boat Pop/Feed activity uses two choices from the introduced chapter letters. Pop choices stay still. The activity retains its four recognition rounds and scoring rules.
- Challenge derives from that activity's best, rather than the chapter's stars: first attempt two choices; a prior one/two-star best three; a prior three-star best four. A new Feed activity therefore stays gentle even after a perfect Pop. This threshold is a provisional design decision, not a scientifically established age norm.
- Beginner Pop misses repeat the target and highlight it without adding the large red cross. A pending wrong-choice animation cannot count repeated taps as additional mistakes.

The existing first chapter still introduces four letters before games. We have reduced simultaneous choices, not rewritten that lesson sequence. A future change to introduce one letter and immediately practice it would require an explicit curriculum-flow decision.

## What the evidence supports

1. **Explicit letter–sound links with practice.** The IES K–3 guide gives strong evidence for connecting speech-sound segments to letters and for teaching decoding, writing and word recognition. Application: let the child hear a curriculum prompt, act on the printed letter, then hear corrective feedback. Letter names and phonemes are different; do not silently replace the approved curriculum speech with improvised phonemes. [IES foundational reading guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/21/Published).
2. **Recall over time, not only copying the answer.** The IES organizing-instruction guide recommends spaced exposure and retrieval through quizzing. Application: a supported round with the visible target can teach; a later audio-only round checks recall. Revisit known letters in later sessions rather than interpreting a single perfect run as durable mastery. The guide spans school learning broadly; it does not prescribe our exact preschool session length or choice counts. [IES organizing instruction](https://ies.ed.gov/ncee/wwc/PracticeGuide/1).
3. **Constructing visual features is a promising tactile task.** A preschool study of unfamiliar letter-like symbols found better recognition after handwriting or composition than after typing, with no clear handwriting/composition difference. Composition involved dragging features into position. This supports testing a construction game, but does not prove that our proposed Arabic game will improve reading. [Seyll and Content, 2021](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.726454/full).
4. **Writing is useful; tracing is not the same as independent writing.** A small cursive-learning study found different neural activation following active production, but no behavioral recognition advantage over observation in that experiment. We should not claim that tracing is uniquely effective based on brain images. Offer increasingly independent formation and test recognition separately. [James and colleagues, 2013](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2013.00567/full).
5. **Arabic visual confusions deserve deliberate attention.** An Arabic kindergarten intervention reports benefits in early literacy tasks and notes visual similarity/adjacency as sources of confusability. Application: practice dot number and placement deliberately, while connecting the resulting shape to its name/sound. Do not assume findings from English letter games transfer unchanged. [Early literacy in Arabic: intervention study](https://www.cambridge.org/core/journals/applied-psycholinguistics/article/abs/early-literacy-in-arabic-an-intervention-study-among-israeli-palestinian-kindergartners/92B5B4C0484D9F42D882423E87F4D279).

## Prioritized next implementation

### 1. Improve existing Feed into a tactile delivery game

Preserve its hear-and-select learning task and reward identity. Offer two large seed packets to a beginner. Drag the correct packet to the animal's basket; also support tap packet → tap basket and keyboard selection. Incorrect deliveries return gently and replay the target. Correct deliveries produce a small chew/thank-you gesture and a planted seed. Never deduct progress for a dropped pointer or motor miss outside the basket.

Implementation: extend FeedGame with Pointer Events, pointer capture, a generous basket hit region and a selected-packet state. Keep `offer()` as the single validation/completion path for drag, tap and keyboard. Lock once accepted, release capture on pointercancel, restore packet on cancellation, ignore detached-screen callbacks, honor reduced motion. Keep existing `pack-boat:feed` best and star delta so the new interaction cannot duplicate rewards.

### 2. Dot Garden — recommended first new activity

Learning target: distinguish ب، ت، ث through dot count and position, followed by recognition. The garden theme makes the action concrete: arrange dark seed-dots on a large letter tray. Keep the letter itself typographically accurate; decorative plant growth happens beside it, never replaces its identifying dots.

Flow: demonstrate ب with one dot below → child places the dot with a visible guide → ت with two above → ث with three above. Then show a completed letter and ask for recognition from two choices. Later optional recall can remove the guide. A persistent reference is teaching support, not evidence of independent recall.

Implementation: use an explicit per-letter configuration of base glyph, valid dot count, above/below zones and curriculum item. Do not infer Arabic dots by stripping arbitrary Unicode marks (these dots are integral letter features). Snap zones should be large; a motor miss returns a dot without marking the letter answer wrong. Provide draggable dots and tap-to-place buttons, undo, replay and an explicit completion check. Reuse the existing mini-game context, pet feedback and lifecycle teardown.

Initially offer this as optional practice from the Boat chapter after its introduction; keep it outside required chapter completion and existing currency. Returning to the chapter restores the previous screen. Once child testing shows that the activity teaches the intended distinction, decide whether it should supplement or replace an existing activity. Do not silently add a new required curriculum step.

### 3. Garden Paths — improve Trace with fading support

Keep current tracing available. Begin with a broad visible path and a start cue, then offer an optional copy-beside-model turn. A watering trail can reveal small leaves behind the stroke; avoid spraying unrelated confetti while drawing. Do not award writing mastery merely for covering the canvas. Track shape coverage and off-path input separately in an experiment before changing scoring. Independent handwriting recognition requires more careful validation than our current coverage grid.

### 4. Sound Ferry — a later recall game

Hear a letter, choose between two boats, and drag the matching boat to the dock. Use previously introduced letters; increase visual similarity only after successful supported practice. For genuine auditory recall, replace the visible answer glyph with a listening icon, with an optional show-me hint. Keep hints distinct from independent first-attempt success. This is a proposed recognition variant, not an additional compulsory reward source.

## How to evaluate the next games

Run short accompanied playtests with ages 4–6. Observe whether the child understands the first action without adult explanation; distinguish motor-placement failures from letter confusions; note unprompted replay and requests for help. Check the same letters later in a different display/order with no target glyph visible. Compare supported success, independent first attempts and delayed recognition, not speed, raw clicks, or session length. Do not infer efficacy from one child's enjoyment or one perfect game.

Engineering checks: desktop and 320/390 phone layouts; touch cancellation; keyboard/tap alternatives; input during success animation; navigation while dragging; replay and reward idempotence; save/reload; all pet accessories; reduced motion. Physical-phone and child learning tests remain outstanding.

## Verification record for this pass

Eleven Node tests pass, including beginner choice pools, exact target inclusion, legacy celebration pupil visibility, all 14 accessories on all three animals, renderer isolation, and prior speech/progression guards. Played a fresh Boat Pop run through all four targets with Rafi; its result showed the first earned flower. A perfect replay showed four choices. Selecting all three free animals left the test wallet at zero and the selected animal persisted on a subsequent page load. Inspected the real celebration renderer in an internal QA fixture at 320×568 with dressed animals and the original blob. The fixture invokes the actual result screen; it does not certify a full chapter playthrough this turn. The earlier full Boat desktop/phone playthrough is recorded in the visual audit.

Changes are local. Recovery snapshot: `.codex-checkpoints/letter-garden-live-20260905/animals-learning/before.tar.gz` (pre-pass live source/art/docs). Restore only the listed files needed; this overlay snapshot does not remove newly added renderer/styles. Screenshot evidence is in the same directory. The future games above are designs, not implemented features. Physical touch devices, child playtesting and learning efficacy remain unverified.

## Sequence implemented — 2026-09-06

The owner requested the next sequence. Tactile Feed, Dot Garden and Garden Paths are now local live features, superseding their proposed status above. Sound Ferry remains a future idea.

- Boat Feed accepts pointer drags into a basket or selection followed by basket activation. Keyboard activates the same controls. A cancelled or off-basket drop does not count as a learning error. Existing rounds, scoring, best key and reward delta remain unchanged. The selected live pet receives the packets.
- Dot Garden is optional on Boat activity results and chapter completion. Build ب / ت / ث using one dot below, two above or a triangular three-dot cluster above. A faint placement guide supports construction; undo corrects motor mistakes. Three subsequent two-choice recognition questions hide the target glyph and retain audio replay. Completion returns to the originating result screen.
- Garden Paths is optional from the same locations. Draw ا / ب / ت over a visible model, then copy each in a blank area with a smaller reference above. The guide can be restored, and the drawing cleared. The finish button acknowledges participation, not handwriting accuracy. There is deliberately no handwriting/mastery grade and no reward payout.
- Practice never mutates curriculum completion, activity bests or wallet. Returning from practice retains the chapter session and Continue behavior. Existing required Trace remains unchanged.

Validation: played all four Feed rounds at 320×568 using drag and keyboard delivery. It earned three stars under `pack-boat:feed`. Played all six Dot Garden stages, all six Garden Paths drawing stages, and returned to the original result screen; wallet remained earned=3/spent=0, best=3, done=[]. The isolated fixture skips earlier required games for focused Feed testing; it does not represent another full chapter playthrough. Fifteen Node tests cover existing regressions plus pointer cancellation, late delivery suppression, delayed optional completion and exact dot count/side. Desktop and final visual checks supplement the phone playthrough. Browser tooling emitted a MutationObserver error without an application source URL in the QA wrapper; no corresponding observer exists in the Letter Garden source. Physical touch-device and child learning tests remain outstanding.

Recovery: `.codex-checkpoints/letter-garden-sequence-20260906/before.tar.gz` preserves the live Letter Garden files immediately before this sequence. Overlay only intended files to restore; remove the new `GardenPractice.js` separately when rolling back. Nothing was published; voice work remains paused.


## Permanent practice garden and map — 2026-09-06

The map now has a permanent Practice garden destination containing Feed a Friend, Dot Garden and Garden Paths. Access becomes available after Boat activity progress or a previously completed Boat save, keeping unintroduced letters out of the first visit. Practice Feed uses the same interaction with an independent no-payout completion callback. The existing optional result links remain.

Removed every external navigation route from the child-facing Letter Garden shell: no Home button on the map or hatch screen, and no end-of-path island link. Home in lessons returns inside Letter Garden. The grown-up hold gate remains intact. No changes to Miftah's own navigation were made.

Map improvements: quiet paper/mint ground, clearer current-stop ring without perpetual bouncing, one pet marker, grouped high-contrast activity controls, consistent focus treatment, shorter phone path spacing and a labeled practice entry. The sound toggle now exposes its pressed state to assistive technology.

Glyph correction: isolated raster SVG measurements could use a substitute font, while SVG getBBox includes Amiri's large font box. Card, map and game-choice glyphs now receive final sizing/centering from the loaded font's actual ink metrics. A scoped observer refits new text and font-load changes. The existing font is retained. Browser calibration checked 64 card/map examples (28 letters plus four marked/joined strings), with no out-of-box/centering failures; visual inspection specifically confirmed خ and nearby descending shapes. Sixteen regression tests pass. Map, practice hub, Feed entry and contained Home navigation were checked on desktop and 320×568. This does not certify every physical device/font fallback.

Recovery: `.codex-checkpoints/letter-garden-map-20260906/before.tar.gz` preserves the prior local Letter Garden implementation. No publication and no additional voice changes.

Recommended next permanent addition: Letter Hunt, a calm scene with a few large letter-bearing leaves to find from an audio prompt. Reuse only introduced curriculum items; first support a visible model, then offer optional sound-only recall. Avoid tiny hidden targets or speed scoring. Later, expose the existing blending/building mechanics as a Word Workshop after the relevant curriculum unlocks rather than creating a competing lesson sequence. These are future recommendations, not new implemented games in this pass.

### September 6 — scenery and nonreader correction
Restored the live sky/hills/clouds and full map decorations by removing the opaque map cover. Kept the centered letter fitting and contained Home navigation. Removed visible map/practice prose, replacing practice choices with action vignettes (feeding a letter, placing a dot, drawing a path), retaining accessible names. Fixed the 78px sticker overflow with responsive square cells, centered each of the 36 vector motifs by its own bounds, and refreshed paper backing, album slots, reward pack and background tree silhouettes.

Verified actual local browser map, owned album and wordless practice on a 320×568 phone fixture; all 36 desktop sticker cells measured centered without overflow. Dot Garden entry works. Existing 16 automated tests pass; modified JS syntax checks pass. No rewards purchased or saved test progress changed on the live origin. Local preview uses art4 asset versions to avoid stale cached CSS/JS. Remaining art scope: individual sticker drawings, older mini-game props and environmental asset families need separate visual refinement; this pass does not claim to replace every old asset.

Recovery: `.codex-checkpoints/letter-garden-art-correction-20260906/before.tar.gz` holds the six pre-correction live files; its README explains selective restoration.
