# Individual audio review applied — 22 boundary revisions ready

Owner reviewed all 100 individual candidates: **46 correct, 54 needs fixing**. The complete export and all notes are preserved in `owner-reviews/20260919-individuals.json`.

**Next action:** open [Recheck 22 revised cuts](http://letter-garden-next.localhost:8790/docs/letter-garden/reviews/audio-confirmation/index.html?section=boundary-recheck). Play each revised clip and optionally its previous cut. Confirm that the extra sound is gone and the intended sound is complete. Mark Correct / Needs fixing / Unsure and amend notes as needed. Download and attach the results, or leave the page open and say done. The other 78 items do not need repeating.

## Applied and held

- Installed the **46 approved excerpts byte-for-byte unchanged**. There are now **138 approved exact recordings**: 28 letter names, four mark names, 21 short-vowel syllables, four tanween syllables, 20 glides and 61 words.
- All **54 newly rejected clips remain excluded**, along with the 20 earlier rejected clips. No review decision was inferred from a comment resembling the expected sound.
- Prepared **22 revised candidates**: nine short-vowel trims, six tanween revisions, four corrected early glide assignments, one sukun-example trim, and two word-boundary revisions. These remain review-only.
- Held **32 other new rejections** for isolated replacements or pronunciation clarification. A proposed earlier بُ onset was declined because it overlaps the unchanged approved بِ clip. Four small replacement text batches are ready in `replacements-individuals/`, for later use.

## Why the spillover happened

The earlier group analysis identified several boundaries at the next vowel or release, after the next consonant had already started. A playable file and an unprompted transcript did not prove clean phonetic isolation. Some original speech also merged syllables or used a different vowel/ending; a trim cannot repair those pronunciation problems.

This revision uses the owner's descriptions together with stop closures, fricative onsets, source waveform and spectrogram context. Ends are moved before the unwanted consonant rather than shortening every clip by the same amount. Natural vowel and tanween endings still require the owner's listening check. No speed-up, global duration normalization, new synthesis or alteration of approved recordings was used.

The early glide assignments were also corrected using the owner’s observations: the original بَوْ clip included بَيْ, and the clips labeled بَيْ and تَوْ were heard as تَوْ and تَيْ. All reassigned excerpts require fresh approval under their corrected labels.

## Review safeguards

Each revision is a separate `-r1.wav`; rejected original WAVs and their hashes remain intact. Cut history retains the old bounds, source evidence and owner decision. Changed signatures invalidate the old listening decision while keeping the notes.

“Play previous cut” plays verified original bytes for comparison and **cannot mark the revised clip as heard or enable Correct**. Only complete playback of the revised clip enables approval. The prior review queues remain accessible; the focused recheck contains exactly the 22 changed candidates.

## Verification

- **275 tests pass**, including approval integrity, original-byte preservation, rejection exclusion, changed-audio reapproval, exact queue membership and source-boundary checks.
- All **138 installed recordings** and all **22 revised candidates** decode in the browser.
- Runtime playback exercised approved short vowels, tanween, glides, the new word, a curriculum word and a three-name sequence. Replay, cancellation and mute checks pass; saved progress remains unchanged.
- Browser comparison test: playing the old version leaves Correct disabled; playing the revised version enables it only at completion.
- Source hashes and owner-export hashes verified; catalogue reproducibility, JavaScript syntax and whitespace checks pass. Palette audit continues to report pre-existing project debt only.

The runtime bank and offline cache include only the approved additions. HTML query stamps and service-worker version are advanced for the local update. No push or deployment.

Previous recovery checkpoint: `3b0b00a349db9fa018c70770b75190c9b3d130b3`. Use a separate recovery checkout at that commit to inspect the pre-review state without discarding the current branch or browser decisions. The sibling Git bundle is refreshed after this pass is committed.
