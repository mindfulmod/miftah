# September 25 retry recording — input confirmed, listening review pending

The supplied `openai-fm-marin-audio-4.mp3` is preserved unchanged in
`../../marin-curriculum/sources/batch-4.mp3`. It is 10.848 seconds, 24 kHz mono;
SHA-256 `155b67f425b9b3ea9a135af911b6e48e91014d5e34bfa420b03357d05ce0b386`.

Waveform/spectral inspection and an unprompted, locally cached Whisper
large-v3-turbo transcript identify **16 separated utterances**. The owner has now supplied the exact 27-item text, preserving its order and
blank lines in `submitted-text.txt`. It matches the requested retry. This does
not establish a one-to-one audio mapping: the recording has fewer utterances
than submitted items.
The raw automatic transcript is saved in `../../marin-curriculum/transcript-4.json`.
Its consonant/vowel spellings are hypotheses, not approved pronunciation.

## Prepared

- Sixteen numbered WAVs, split around long low-energy gaps, not equal-duration
  slots or assumed curriculum positions. Quiet-gap estimates receive 60 ms
  leading and 80 ms trailing padding; existing 4 ms edge fades are applied.
  Original speed, pitch and level remain. Every interval and SHA is in
  `manifest.json`. No new sound is synthesized.
- The [numbered listening desk](index.html) now displays the confirmed input.
  Fifteen tentative labels use the unprompted transcript and submitted sequence;
  clip 6 stays unlabeled because its identity is ambiguous. These suggestions
  are not assignments or pronunciation approvals.
- The owner can play each clip, change its label, then mark Correct, Needs fixing
  or Unclear. Correct requires a selected label and completed clip playback.
  Changing a label clears its prior decision. Decisions, notes, selected text,
  source SHA and cut SHA are saved and exported together. Existing notes remain.
  QA uses a separate key and marks exported results `testOnly: true`.
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

Owner: play the 16 clips at the listening desk. Check consonants, vowels and
short/long vowel length against the selected label; change a label if necessary.
Mark Correct, Needs fixing or Unclear, then tell Codex the review is finished.
No more recording yet. Once reviewed, install only explicitly approved matching
clips and prepare only the still-missing/rejected sounds in short batches.

Input-confirmation follow-up checks: 3/3 focused source/cut/order/runtime tests
pass. Actual browser checks cover playback-gated decisions, the unlabeled clip,
label-change invalidation, all three decision states, note retention, hash-bound
export and reload persistence using the isolated QA key. Desktop and 390px phone
layouts were inspected; the owner state has no QA decisions. The full game test
suite was not repeated for this review-only UI change. No child-facing files or
audio bytes changed.

Local only. Pre-intake checkpoint: `22c2dc87fe209cb9897d44e51254f2d659148faa`.
The original upload, transcript, cuts, manifest, reproduction script and review
page are included in the local checkpoint and sibling recovery bundle. The wider
art/gameplay goal remains active; this intake does not complete curriculum audio.
