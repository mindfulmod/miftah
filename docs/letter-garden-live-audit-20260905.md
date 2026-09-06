# Letter Garden: local live baseline and first implementation slice

Status: baseline and audit complete; implementation awaiting the owner's direction agreement. No live code changed during this audit. No publishing.

## Recoverable baseline

Checkpoint: `.codex-checkpoints/letter-garden-live-20260905/` (ignored, local only).

- HEAD: `31afafa7ee67b35f9e4a94badaf69932092dd987`; branch `codex/juz-amma-memorizer`.
- `snapshot.tar.gz`: 409 files, including current live entry/runtime/data, Letter Garden art assets, untracked prototype/reference files, and ignored audio auditions. Every archived member was re-read and SHA-256 verified.
- `manifest.json`: exact path list, sizes, hashes, tracked status, archive hash. `letter-garden-working.patch`: existing scoped changes against HEAD. `working-tree-status.txt`: repository status inventory only.
- `README.md` and `restore.py`: selective recovery instructions and a verified complete overlay. `python3 restore.py --verify` checks the current repository; `--restore` overwrites only manifest-listed files. Save later work before restoring. It does not delete subsequently added files or alter Git history/index.
- Preserved local changes include hatch/map exit buttons and pet color controls. Unrelated modified Miftah source is excluded. Shared runtime dependencies directly used by Letter Garden are included.
- This represents the repository's **local live implementation**, not an independently verified deployed version. Remote fonts/recitation CDN files and browser storage are not in the archive.

Audit play used `letter-garden-baseline.localhost:8788`, separate from the user's existing origin. No user progress was cleared or migrated. A local inspection-only iframe in the checkpoint renders the actual `/letters.html` at 390×844; it contains no substitute gameplay. Screens are archived separately with hashes in `screens.json`.

## Existing experience to preserve

The implementation has 22 world stops (older source comments saying 13 are stale): seven shape-family letter packs → joining 1 and 2 → muqattaat → fatha → kasra/damma → tanween → standing vowels → long sounds → leen → sukoon → shaddah → shaddah mix → two-letter words → decode → four-letter decode. The exact IDs/order remain in `src/letters/LettersWorlds.js` and the letter curriculum in `src/data/letters.js`.

First entry hatches a blob with three taps, chooses its color, and enters the scrolling journey map. The first unfinished world is current; completed worlds replay freely. Normal chapter flow is interactive introductions → existing activity sequence → stars after each activity → chapter celebration → world. Completed chapters shorten the introduction to one replay card. Letter names remain names-first; joining and vowel assembly retain their existing teaching behavior. Say-it-with-me is an invitation with an echo, without recording or a microphone.

**Boat Letters (`pack-boat`, ا ب ت ث)** introduces all four letters, then Pop → Trace → Feed. Pop matches the prompt among floating choices; wrong choices scaffold away. Trace samples a drawn glyph, requiring at least 55% overall coverage and 45% coverage of each connected cluster, including dots; it selects three targets. Feed selects the requested letter for the creature. Other worlds retain Pairs, Catch, Burst, Build, Fuse/Blend, Unfuse, Chain and Parade wherever assigned. No mini-game replacement is proposed. Distractor selection and scoring remain unchanged; the live first pack can currently include unfamiliar letters as distractors.

The pet retains its hue, body/species, owned bodies, worn accessories, tap-to-recite behavior, expressions, and mastery-driven growth/radiance. Wardrobe purchases and the sticker album use the existing wallet. Body prices are 20–30 stars, accessories 8–10. Existing local color controls remain functional; their visible “Pet color” heading is an existing exception to the wordless art direction.

Games award 1–3 stars based on slips. Currency is paid only for improvement over the previous best for that world/activity, so replay does not repeatedly pay the same reward. Chapter stars keep the best result; completion unlocks the next world and records a daily stamp. The daily review/check-up, skill flower, sticker inventory, strength model and mastery plants remain. The island integration is currently inactive (`island = null`); environmental rewards should be implemented inside Letter Garden.

## Audio baseline

`LettersGame.say()` uses recorded single-letter files if `assets/audio/letters/<name>.mp3` exists, otherwise device Arabic speech. The directory currently contains a README, not the live recordings; startup probes for Alif. TTS selects an available Arabic voice, rate 0.55, pitch 0.9, volume 0.85. Compound syllables also use TTS. Real Quran words and pet recitation use external Quran audio via `RecitationAudio`.

SoundSystem synthesizes one-shot interaction sounds, star notes and celebration/biome flourishes. There is no background music loop. The sound toggle stops speech and recorded playback and mutes the effects bus. Existing touch unlock behavior is important on iOS.

The prototype points to `assets/audio/bakeoff/shipped-hamed-c-2026-07-19`, but the directory name is misleading: `.gitignore` explicitly records those auditions as local-only and an earlier decision to retain existing audio. They are archived as references, not treated as an approved live voice.

Audio routing was inspected in source and replay controls exercised during the live flow. Audible pronunciation quality, recording completeness, real iPhone autoplay, and end-to-end recorded replay have **not** been certified in this audit. These are implementation acceptance checks, not claimed passes.

## Findings and prioritized plan

| Priority / live surface | Evidence and consequence | Proposed change |
| --- | --- | --- |
| P0: Trace completion | Actual play reached rewards after tracing Tha and Ba, despite the configured three targets. `penUp()` permits more successful strokes to schedule advance timers during the 700ms success interval. | Make success/advance single-shot; guard all delayed work against destroyed games/screens. Preserve coverage and reward rules. Add a regression test for input during success. |
| P0: audio/replay/exit | Intro and reward choreography uses delayed callbacks; some lack connection/lifetime guards. Screen replacement destroys the game but does not consistently cancel all screen audio/timers. These are source-confirmed risks, not every one a reproduced failure. | One scoped playback/animation lifecycle per screen; cancel stale echoes and celebrations, make replay restart predictably, keep the current mute behavior. |
| P1: Boat map stop → entry | The map already has a clear current-stop marker and mastery plants; scenery repeats across chapters and progress is mostly small icons. | Keep the journey map. Give the Boat stop a distinctive riverside meadow/boat landmark in the existing warm paper palette, with a clear entry focus. |
| P1: introductions → Pop/Trace/Feed | The introduction has a large expressive character. Gameplay reduces companions to a small header. Trace uses cool blue guide material; Feed's creature differs from the outlined cast. Large generic panels/backgrounds weaken continuity. | Reuse live SVG cast/expressions and activity code. Make companions larger where they help; keep the glyph primary. Carry the same restrained garden materials and ground plane through each activity. Keep scenery away from the interaction zone. |
| P1: activity rewards → return | Stars celebrate progress, but the generic reward panel does not show a lasting chapter-world change. | Add a brief garden-growth acknowledgement alongside stars. Derive permanent growth from existing completion/bests, including already-completed saves. Keep mastery plants as the separate existing learning signal. No new currency or gate. |
| P2: pet/reward presentation | The live pet room already provides substantial expressive art and earned customization. | Carry its live proportions and expression language into lesson feedback; retain ownership, purchases, species and outfits. Avoid importing the prototype's alternative pet roster. |
| P2: reduced motion / input | CSS reduces many ambient animations, but JavaScript-driven floating gameplay and success timers need explicit review. Many wordless controls lack useful accessible names; some meaningful actions are pointerdown-only. | Preserve usable learning interaction with reduced motion, add accessible action labels and keyboard activation where applicable, and test rapid/repeated input without skips or duplicate rewards. |

**Recommended first slice:** Boat Letters end to end, including its current map entry, four introductions, Pop, Trace, Feed, activity stars, chapter celebration, environmental acknowledgement, and return to the same map. Local changes should be scoped to this chapter where possible. Shared fixes must be regression-checked against the neighboring Smile chapter and pet system.

Transfer the prototype's clear focus, larger landmark art, grounded scenery and visible garden growth. Reuse selected lifecycle/replay patterns after checking them against the live implementation. Keep the live journey, blobs, curriculum, economy and storage keys. Do not port the prototype's independent chapter state, replacement activity navigation, pet roster or audio choice wholesale.

The existing ART.md supplies the warm paper world and blob cast. Its fixed decoration-count/always-moving rules should yield to the owner's calmer-screen requirement and reduced-motion needs; update those narrow clauses with the agreed slice rather than adding scenery merely to meet a quota.

## Baseline evidence and limits

Archived screens cover hatch, world, introduction, Pop, Trace, Feed, stars, chapter celebration, and pet room. Desktop capture is mainly 1280×800 (hatch 1280×720); the natural narrow world is 454×653. Phone inspection uses a real 390×844 iframe; the browser screenshot backend reduces iframe content in full-page exports, so those image dimensions are not the frame's CSS viewport. No horizontal body overflow was observed on the phone introduction (390px body and scroll width).

Actual desktop play: hatch → all four introductions → four Pop rounds → Trace (premature completion defect) → four Feed rounds → party → map. Reload retained `pack-boat` complete, `pack-smile` current and wallet 9. This proves persistence of that run, **not** correct Trace coverage of all three targets. The captured error/warning log was empty. Phone world, pet room and introduction were inspected; a complete phone chapter, reward replay farming regression, reduced-motion gameplay and physical-device audio are still pending.

Before calling the implementation complete: play every activity on desktop and phone; test correct and scaffolded retry, repeated taps/strokes during transitions, exit/re-entry, sound mute and replay, recorded audio if selected, save/reload, old-progress compatibility, best-score payouts, earned pet items, completion exactly once, reduced motion, and Smile shared-code regressions. Compare corresponding baseline states at matching dimensions and day/night phase. Run the palette check for art changes and focused regression tests for the lifecycle/reward bugs.

## Direction choices for agreement

1. Recommend the Boat Letters slice and riverside meadow treatment above, with permanent completion-based garden growth alongside existing mastery plants.
2. Recommend retaining the current voice source for this first pass while improving replay/timing and effect balance. Reopening the recording audition would be a separate explicit choice; the prototype's recording is not assumed approved.

## Audio follow-up — implemented locally

Owner direction: no recorded audio; improve naturalness of generated speech. The initial baseline above remains a historical record.

- Letter Garden now ignores recording paths and uses curriculum speech/display text for all prompts. Removed the MP3 probe and the entry page's unused RecitationAudio dependency. Other Miftah features and the reference recordings are unchanged.
- Speech rate is 0.85 (previously 0.55), pitch 1 (previously 0.9). Available enhanced/natural Arabic voices take preference, with the utterance language matched to the selected voice. These are tuning choices for audition, not a claim of verified pronunciation quality.
- Say-it-with-me now waits for the speech end event before its 1.6-second child response interval. Replay, mute and navigation invalidate stale speech callbacks/echoes. Delayed introduction audio checks that its screen is still present.
- Four focused tests pass: generated speech for recording-backed items, replay cancellation, stop/mute cancellation, and empty/late-loaded voice lists. Browser smoke check exercised replay, mute/unmute and entry to Pop, with no captured warnings/errors. The user's existing preview map and wallet were preserved on reload.
- Actual voice naturalness and pronunciation still need the owner's listening check; physical iPhone audio is not certified. This turn did not implement the broader chapter visual slice or the earlier Trace defect fix.

Browser API references: [speech rate](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/rate), [speech end event](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/end_event). Run `node --test src/letters/tests/speech.test.cjs` for the audio regression checks.


## Boat visual slice — implemented locally, 2026-09-05

Owner approved the visual pass and paused voice work. The future voice direction is to generate AI speech once and bundle the assets, without a runtime speech service. No additional voice changes or generated recordings were made in this visual pass.

- Added a native SVG boat landmark and quiet riverbank to the existing Boat chapter. Introductions, Pop, Trace, Feed, activity results and chapter completion share larger art, warm paper surfaces and muted garden colors. Existing live pets remain central.
- One flower appears for each activity with an existing positive best; completed older saves receive the finished three-flower landmark. Existing stars, mastery plants, unlocks and purchases remain intact.
- Fixed Trace accepting extra input during its success delay, which could skip the next target. Added lifecycle guards to prevent abandoned activities completing later. Pop choices fit a four-option replay at 320 pixels without overlap. Pet and game choice buttons support keyboard activation.
- Added a saved grown-up Reduce motion preference alongside system reduced-motion support. Stationary Pop targets preserve the same recognition task.

### Validation

Played the whole Boat chapter on desktop (1280×720), including an imperfect Pop run and repeated perfect replays, all three Trace targets, all Feed rounds, results, completion and return. The wallet reached nine stars (2 + improvement of 1 + 3 + 3); another perfect replay added zero. Reload preserved chapter completion and the flower landmark.

Played the entire chapter again in the actual live page at 320×568 with reduced motion, including pointer drawing on all three trace targets. Checked the final screen at 390×844. The replay retained nine stars. Entered the next chapter and its Pairs activity with its original theme. In the isolated test save, an eight-star pet accessory purchase reduced the wallet from nine to one. User-origin progress was not used for these tests.

Eight focused Node regression tests cover speech lifecycle, garden growth, Trace success input and abandoned activity callbacks. The palette checker reports the same existing off-palette count as the baseline (139 distinct / 286 uses); this pass introduces no additional palette debt.

Evidence is saved under `.codex-checkpoints/letter-garden-live-20260905/visual-pass/`, including `baseline-meet-day.jpg`, `meet-desktop.jpg`, `feed-desktop.jpg`, `pop-phone-320.jpg`, `trace-phone-320.jpg`, `feed-phone-320.jpg` and `party-phone-320.jpg`. A frozen baseline page and phone-size QA wrapper are internal test fixtures, not alternate game implementations. `before-visual.tar.gz` preserves the state immediately before this pass; the original baseline and selective restore instructions remain unchanged.

### Remaining limits

This is the Boat chapter slice, not an art replacement across every chapter. Voice generation remains paused. Phone layouts were played in a browser viewport, not on physical phone hardware. Reduced motion was exercised through the saved preference; the operating-system setting itself and the existing grown-up hold gesture were not automated. No changes were published.
