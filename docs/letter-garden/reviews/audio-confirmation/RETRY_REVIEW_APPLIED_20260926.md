# Retry audio review applied — September 26

The owner confirmed “all 16 are fine.” The exact browser export is preserved in
`owner-reviews/20260926-retry-identification.json`, with the conversation
confirmation in `owner-reviews/20260926-retry-conversation.json`.

15 distinct approved recordings are installed with exactly the bytes heard in
the listening desk. Clip 6 was identified as فِ. Clip 9 was relabelled وَ and
its form decision remained pending after that edit; the conversation approves
it as another وَ. Clip 7 is the canonical runtime وَ, and clip 9 stays preserved
as an approved alternate. It is never used for وُ. No new pronunciation was
inferred from sequence position and no stretch, pitch change or recut was applied.

The bank grows from 237 to 252 exact recordings. Every previous installed key,
path and audio file is preserved. The rejected old فِ cut and its review note
remain in history; the new approved فِ has its own versioned filename and hash.
The original 27-item request and original 100-item inventory remain historical
records, rather than being rewritten to look complete.

This closes the supplied batch, not all recorded curriculum coverage. The full
612-entry catalogue comprises 252 installed recordings, 59 unapproved candidates,
149 letter-name sequences, 123 unmapped entries and 29 teaching-policy entries.
Unapproved recordings remain excluded; exact-text device speech remains the
existing fallback. No external AI voice service is called by the bundled clips.

12 sounds from this retry request remain for a future recording:
غُ، فَ، قِ، هِ، هُ، وُ، طَا، طِي، طُو، كَا، كِي، كُو.
The text is saved in `retry-recording/remaining-after-retry.txt`. No further
review or recording is required from the owner for this release.

## Verification

- All **318 regression tests pass**, including exact reviewed hashes, preserved
  earlier mappings, rejected-source history, duplicate exclusion and game playback.
  Full output: `evidence/retry15-tests-20260926.txt`.

- Byte-for-byte validation: all 15 new runtime WAVs match the owner-heard hashes;
  all 237 earlier runtime mappings remain unchanged.
- Browser voice adapter: all 252 recordings decoded; all 15 new syllables, a
  curriculum word and a three-name sequence completed normal playback.
- Cancellation does not complete a learning prompt; rapid replay only completes
  the replacement; muting prevents completion; browser saved storage unchanged.
  Console contained no errors or warnings.
- All 334 precache file paths exist. Shell and entry stamps are
  `miftah-v61-letter-garden-audio-release-20260926` and `20260926-audio-release1`.
- Exact local evidence: `evidence/retry15-hashes-20260926.json` and
  `evidence/retry15-runtime-20260926.txt`. Final suite and deployment evidence are
  recorded in `../../RELEASE_STATUS.md`.

Next owner action: open production Letter Garden after deployment, try a lesson
and replay its audio. This batch does not need another listening review.
