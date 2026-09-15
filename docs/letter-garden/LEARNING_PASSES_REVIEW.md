# Letter Garden learning passes — local review

September 15, 2026. Candidate: `20260915-learning1` on `codex/letter-garden-next-major`.
Preview: <http://letter-garden-next.localhost:8790/letters.html?v=20260915-learning1>.
Baseline: `a2c887348ba2ce55a296d0c8c768e7a523315ee3` / `20260915-garden-life1`.

## Delivered behavior

1. **Gradual difficulty.** A shared planner starts unfamiliar chapter content with two visible choices and still targets. Matching success permits two-choice listening; repeated independent success across separate sessions permits a third choice, then gentle movement. Four choices remain an explicit challenge. Stars and chapter index no longer accelerate normal recognition rounds. Distractors are restricted to the current lesson and completed prerequisite packs. These thresholds are tunable product rules, not validated developmental cutoffs.
2. **Learning evidence and helpful retries.** Pop, Feed, Catch and Delivery share prompt modes, replay and visual help. Only a hidden target with confirmed completed speech and multiple choices can count as independent listening. Muting, failed speech and help restore visible support. Wrong answers retain the selected letter and show a pictorial comparison. Matching, listening, assisted responses and construction/drawing remain distinct observations; legacy earned data is retained.
3. **Tactile practice.** Dot Garden adds ج/ح/خ, د/ذ, ر/ز and س/ش to ب/ت/ث, using explicit shared-body/dot rules and taught content. Each short visit moves from guided construction through repair to recognition, including zero-dot letters and sound-off support. Garden Paths rotates taught isolated letters and repeats each with a full, then partial guide; help can be hidden for copying. Both drawing activities now offer five wordless pencil colours, retained through clear/next and between activities during the visit. Existing strokes retain their colours. Trace's coverage checks are unchanged.
4. **A gentler assembly path.** Build starts with at most two manual pieces, preparing the prefix of longer sequences. More pieces and a single decoy follow construction practice. Incorrect assembly retains the correct prefix and returns the suffix, with a comparison at the first mismatch. Blend/Fuse, Unfuse and Chain receive prompt/feedback integration; Chain adds an opening bridge cue, and Parade follows its existing form reveal with supported two-choice form recognition. All 22 chapter IDs, order and game sequences remain intact. Word catalogues have strict length/prerequisite bands and no fallback to harder words.
5. **Shorter mixed review.** Daily practice selects a comfortable opening and due or assisted material, with bounded recent history to reduce repeated grinding. A visit has three familiar activities of two rounds each, using mechanics already encountered in completed chapters. Assembly reviews stay within one taught content family. Review history advances on launch, not when simply viewing home. Existing reward keys, pets, earned garden items, currency and unlock rules are preserved.

Independent word decoding remains supported visually until its spoken content is qualified. Drawing participation does not certify handwriting, reading or listening mastery. The optional timed Burst remains available; parent-page work and voice replacement are outside this implementation.

## Verification

- Automated suite: **199/199 passing** at this review; see [tests.txt](reviews/learning/tests.txt). Coverage includes all 22 catalogues/boundaries, separate-session promotion, eligible choices, legacy saves, review rotation, speech completion/cancellation/failure, wrong-answer assistance, assembly repair, dot families and colour/pointer behavior.
- Browser play at **320×568**: fresh third-pack Pop remained at two choices for all four rounds, wrong-answer help worked, reward increased the synthetic wallet from 20 to 22 once, and Continue opened Trace without changing chapter completion.
- Browser play at **1280×800**: completed four Muqattaat Build rounds, including a deliberately incorrect suffix; the prepared prefix stayed in place and the remaining pieces could be corrected. [Prepared assembly](reviews/learning/build-prepared-desktop.png).
- Browser play at **320×568**: completed the bowl-family Dot Garden construction → repair → muted recognition route; two-choice recall was visible and practice returned home without currency/chapter changes. [Muted recall](reviews/learning/dot-recall-phone.png).
- A native-TTS listening prompt showed its neutral cue and disabled answer input while awaiting speech. Unconfirmed playback timed out into visible matching and released input. No console errors were observed. This checks fallback behavior, **not audible pronunciation or device speech quality**.
- Drawing browser checks: Trace retained coral and blue strokes together, then cleared ink while retaining the blue selection. Garden Paths retained purple on its next partially guided drawing. Phone review caught and fixed a clipped descender, SVG guide hiding, and a crowded toolbar. Both activities now fit at **320×568** and **568×320**; Trace was also inspected at **1280×800**. [Trace colours](reviews/learning/trace-colours-phone.png), [landscape Trace](reviews/learning/trace-landscape.png), [complete Garden Paths guide](reviews/learning/paths-guide-phone.png).
- Beginner daily browser play completed two Pop rounds and two Feed rounds, then entered Trace. The synthetic wallet moved 20 → 23 → 26; the single completed chapter remained unchanged. The remainder of daily completion/replay reward handling is covered by automated contracts, not a claimed complete drawing playthrough.
- Desktop Parade: revealed three forms, entered two-choice form matching, chose an incorrect answer, used the visual comparison, then corrected the answer and advanced. [Form transfer](reviews/learning/parade-transfer-desktop.png).
- After loading the new candidate on the user's named preview origin, its visible saved state was unchanged: 12 rewards, Boat and Smile completed at three stars each, and the third pack next. Temporary viewport overrides were reset and the isolated QA tab closed.
- Palette audit still reports pre-existing debt: **680 off-palette colours / 950 uses**. This pass adds no new off-palette colours; it does not resolve the broader art debt.

Fixtures are generated by `node scripts/generate-letter-garden-learning-qa.cjs` and served at `127.0.0.1:8790/.qa/learning.html`. They seed only the isolated QA origin, not the user's named preview origin. Generated `.qa` files are disposable and excluded from the checkpoint.

## Limits and next qualification

The shared evidence thresholds and short review mix need observation with Arabic educators and children aged 4–6. Validate the actual pronunciations, interpretation of pictorial hints, transfer to later sessions and the expanded dot families. No automated test establishes learning effectiveness. Physical touch devices, native speech on target browsers and installed service-worker update paths still need release qualification. This pass extends existing games; it does not deliver a separate new Bridge game or independently qualified word-listening assessment.

For audio, GPT‑6 Astra itself has text output; a dedicated speech model can generate reusable Arabic audio files. A future voice pass should first compare a small set of letter-name and syllable samples, approve pronunciation and tone, then generate and bundle the rest. This avoids runtime AI calls. No new voice clips or external audio integration were added here.

## Recovery and publishing

Work stays in `/Users/main/Documents/GitHub/miftah/.local-work/letter-garden-next-major`, with a sibling Git bundle. To inspect/restore the pre-pass state safely, clone that bundle into a **new** directory and check out `a2c887348ba2ce55a296d0c8c768e7a523315ee3`. Do not reset the original mixed working tree. The candidate can likewise be recovered from the branch recorded in `RELEASE_STATUS.md` after the checkpoint.

Production remains `55f34576f0ebfc02bcf115452101b37adfbb4536` / `20260908-batch50`. Nothing has been pushed or deployed. Parent-page work remains deferred.
