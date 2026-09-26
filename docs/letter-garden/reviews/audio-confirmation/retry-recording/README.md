# September 25 retry recording — identification pending

The supplied `openai-fm-marin-audio-4.mp3` is preserved unchanged in
`../../marin-curriculum/sources/batch-4.mp3`. It is 10.848 seconds, 24 kHz mono;
SHA-256 `155b67f425b9b3ea9a135af911b6e48e91014d5e34bfa420b03357d05ce0b386`.

Waveform/spectral inspection and an unprompted, locally cached Whisper
large-v3-turbo transcript identify **16 separated utterances**. The earlier
requested retry had 27 items. The owner has been asked which exact text was
submitted; no reply has arrived at this checkpoint. `expected-request-4.txt`
records the requested 27, not a claim about what the owner actually pasted.
The raw automatic transcript is saved in `../../marin-curriculum/transcript-4.json`.
Its consonant/vowel spellings are hypotheses, not approved pronunciation.

## Prepared

- Sixteen numbered WAVs, split around long low-energy gaps, not equal-duration
  slots or assumed curriculum positions. Quiet-gap estimates receive 60 ms
  leading and 80 ms trailing padding; existing 4 ms edge fades are applied.
  Original speed, pitch and level remain. Every interval and SHA is in
  `manifest.json`. No new sound is synthesized.
- A [numbered listening desk](index.html) accepts the actual submitted text and
  optional heard-sound notes, saves locally and exports identification JSON.
  It has no Correct/approval action. The normal curriculum review is unchanged.
- All clips are **unassigned**, excluded from the runtime bank and precache.
  All 237 installed clips and 446 existing playable catalogue signatures remain
  unchanged. Previous owner notes and rejected excerpts are preserved.

Reproduce exact bytes with the existing local runtime:
`../letter-garden-voice-runtime/venv/bin/python scripts/reproduce-letter-garden-retry-intake.py`.
The script checks source and output hashes and cannot replace a differing WAV.

## Verification

309 automated tests passed after intake preparation, including two bounded Luna
integrity tests for file hashes, PCM duration, source bounds, nonoverlap, distinct
clips, existing voice mappings and exclusion from runtime/precache. The SW test
checks audio coverage rather than freezing unrelated cache-version changes.

Actual browser decoding/hash comparison passed **16/16**, recorded in
`browser-decode.json`. Normal-speed first/last playback and finished-state checks
passed; QA notes, submitted text and JSON export survived reload on the isolated
127.0.0.1 origin with a `.qa` storage key. The owner's page has no QA notes.
The initial multi-player test tab crashed; the revised desk uses one shared
player, and a fresh tab passed the playback checks. This is not audible approval.
The 390px layout has no horizontal overflow; see `review-phone.png`.

## Next action

Owner: paste the exact text used in FM, or confirm that all 27 requested items
were submitted. If that text is unavailable, label the numbered sounds at the
listening desk and download the identification notes. No regeneration is needed
yet. Once the mappings are established, prepare only the defensible individual
candidates for normal pronunciation review; do not map by list position alone.

Local only. Pre-intake checkpoint: `22c2dc87fe209cb9897d44e51254f2d659148faa`.
The original upload, transcript, cuts, manifest, reproduction script and review
page are included in the local checkpoint and sibling recovery bundle. The wider
art/gameplay goal remains active; this intake does not complete curriculum audio.
