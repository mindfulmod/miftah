# Letter Garden Picturebook Prototype QA

> Current default: v41 connected Boat and Smile Letters gardens. See
> [the current implementation and verification record](LETTER_GARDEN_CHAPTER_WORLD.md).
> The six-letter world and orchard checks below describe the earlier exploratory
> prototype; they are historical evidence, not the current chapter structure.

## Visual acceptance

- [x] Letter activities contain no more than three broad environmental layers and one framing prop.
- [x] The target retains at least 35 percent visual quiet around its silhouette.
- [x] Saturated coral, gold, and the darkest outlines are reserved for learning actions and progress.
- [x] Background elements read at lower contrast than the letter, answers, and companion.
- [x] The level selector is a coherent illustrated world, not a path of generic buttons.
- [x] The orchard, water courtyard, lantern hill, and moon grove read as different destinations.
- [x] Completed, current, and sleeping levels differ through growth, warmth, scale, and saturation.
- [x] The child surface reads as an illustrated place, not a map or dashboard.
- [x] The learning target is the highest-contrast object in the quiet lesson area.
- [x] The orchard, river lesson, transformation, and dressing nook use one cut-paper visual language.
- [x] Progress is represented by seeds and world growth rather than a progress bar.
- [x] Success permanently adds fruit, leaves, light, and stepping stones to the landscape.
- [x] Blob, Lumi, Mina, and Rafi remain identifiable at phone scale.
- [x] Accessories continue to use each companion's fitted rig anchors.
- [x] The desktop and phone views use deliberate, different scenic crops.
- [x] The live Pop, Trace, and Feed mechanics now share the prototype world's contour, paper, palette, horizon, and companion language.
- [x] Pop reads as a stream-meadow activity, Trace as a sand-terrace activity, and Feed as an orchard-clearing activity.
- [x] Activity scenery remains subordinate to the prompt and playable letter objects.

## Prereader acceptance

- [x] A new journey starts with no false completion and only ا available.
- [x] The first-use cue uses companion gaze and one landmark response, not text, arrows, or a hand cursor.
- [x] The cue waits before appearing, settles on its own, and cancels immediately when the child acts.
- [x] An unfinished orchard hands attention from the companion to the letter stone without animating optional hotspots.
- [x] Orchard guidance cancels on learning, discovery, dressing, or navigation input and never runs after success.
- [x] Reduced motion retains the directional pet pose and active landmark state.
- [x] No English words are visible anywhere in the child flow.
- [x] The rendered body contains only the target Arabic letter as visible text.
- [x] The current action is communicated with light, scale, placement, and motion.
- [x] The lesson is embedded in the stream instead of placed inside a generic card.
- [x] Wrong answers settle gently and can be retried without leaving the scene.
- [x] A response resolves before another stone or sound replay can create a second outcome.
- [x] Wrong-answer locking lasts only for the feedback beat, exposes a busy state, and then restores every choice.
- [x] Rapid repeated taps cannot complete, reorder, or advance a lesson during corrective feedback.
- [x] Success is communicated by the companion and the changing world, without a written reward message.
- [x] A paused child receives one local wordless cue rather than a tutorial overlay.
- [x] Assembly cues move a piece partway and never place it automatically.
- [x] Choice cues animate every option equally and do not expose the correct answer.
- [x] Correct letters occupy different positions across levels and rotate on a new attempt.
- [x] Answer placement remains fixed during an active attempt, including retries and sound replay.
- [x] Choice-based lessons require two successful recognitions before changing world progress.
- [x] The confirmation round moves the answer and never resets progress after an error.
- [x] Two-step letter assembly completes without an unnecessary additional recognition round.
- [x] A wrong answer or partial assembly step can arm one new state-specific cue.
- [x] The same task state never repeats its cue, and each lesson caps automatic cues at two.

## Interaction acceptance

- [x] Completed levels can be replayed directly from the world.
- [x] The selected Arabic letter carries into the orchard and river lesson.
- [x] Completing the current level wakes the next destination in the world.
- [x] Completing the final level awakens a persistent, wordless garden finale.
- [x] The fulfilled world has no false current marker and keeps all six landmarks replayable.
- [x] Reloading a completed chapter preserves its final environmental state without replaying the reveal.
- [x] Completed levels remain replayable while later prerequisites stay unavailable.
- [x] The first unfinished level and every completed landmark survive a full page reload.
- [x] Every child-facing control is at least 56 CSS pixels at the main phone breakpoint.
- [x] All controls are keyboard reachable and visibly focused.
- [x] The letter can be heard again at any time in the lesson.
- [x] Any lesson interaction cancels the contextual cue and prevents it from repeating.
- [x] Correct input cancels pending retry audio and hint timers before success begins.
- [x] Confirmation choices fade out before their labels or answer positions change.
- [x] The water and bird provide optional, non-blocking discoveries.
- [x] Pet selection, colors, and fitted accessories update immediately.
- [x] Pet, color, and fitted-accessory choices survive a full page reload.
- [x] Replaying a displayed letter synchronizes the sound control, letter tile, and companion response.
- [x] All six prototype lessons use the selected Hamed-C recording with an explicit letter-to-file mapping.
- [x] Recording playback falls back to an Arabic device voice only after a load, decode, or playback failure.
- [x] Visual listening feedback ends with the recording or speech event rather than a guessed duration.
- [x] Replaying cancels the previous clip, speech, timer, and callbacks before beginning again.
- [x] A browser autoplay block leaves a wordless tap-to-hear affordance and never displays false playback feedback.
- [x] The ت/ta, ط/taa, ح/haa, and ه/ha filename distinctions remain explicit.
- [x] Leaving a lesson cancels speech and clears every transient audio-feedback state.
- [x] The primary flow works at 390 by 844 and 1280 by 720.
- [x] Reduced motion preserves every state change.
- [x] The final reward uses no modal, score, streak, badge, chest, confetti, or written praise.
- [x] The prototype reuses the live mini-game implementations instead of imitating their behavior with new one-off interactions.
- [x] Pop, Trace, and Feed can be inspected directly through one wordless three-step activity trail.
- [x] Pop targets enter the playable region immediately instead of leaving several seconds of empty scenery.
- [x] Completing one activity marks its place and advances to the next live activity without leaving the chapter environment.

### Phone touch audit — 390 × 844

- [x] The dressing nook exposes 16 visible controls; every measured control is at least 56 by 56 CSS pixels.
- [x] Dense color and treasure controls keep at least 10 pixels between adjacent hit areas and never overlap.
- [x] The world, orchard, and letter lesson contain no clipped or off-screen child controls.
- [x] The boat discovery keeps its compact illustration while its actual button is 67 by 56 CSS pixels.
- [x] The letter lesson's back, sound, and assembly controls are all at least 56 by 56 CSS pixels.

## Technical acceptance

- [x] Production Letter Garden files remain unchanged.
- [x] Animal markup comes from the shared prototype rig renderer.
- [x] The production blob renderer is reused for the fourth companion.
- [x] The prototype introduces no package dependency.
- [x] JavaScript parses without errors.
- [x] The browser console has no runtime warnings or errors during the primary flow.
- [x] Personalization storage is schema-filtered and fails safely without blocking play.
- [x] Journey storage accepts only known level identifiers and derives the next level from the ordered curriculum.
- [x] Persisted attempt counters are integer-bounded and prevent reloads from restoring the same answer-position shortcut.
