# Applied boundary review and next audio handoff · 2026-09-19

## Saved owner review

Evidence: [original exported review](owner-reviews/20260919-boundary-recheck.json).
SHA-256: `ceb6999eb5bacdbc5bb903accd7c2e80d42074c85c9f950ab9c6597cce841a8b`.

The 22 revised items received **17 approvals, 3 rejections, and 2 notes without
saved decisions**. The exact 17 approved files were promoted to the local bank;
no trimming, speed, pitch, or level change was made after approval. Source files,
previous rejected cuts, earlier decisions, and notes remain preserved.

| Still held | Owner note | Action |
|---|---|---|
| بَ | sounds like beb, needs to be slowed down | Keep excluded; replace or review an independently justified repair. |
| تَ | should be slowed down even more | Keep excluded; source pace needs a better recording. |
| جَ | sounds like jai | Keep excluded; a boundary edit cannot establish the intended vowel. |
| تً | sounds like tan, shouldnt it be, tun? | Expected tan; tun would be تٌ. Decision remains pending. |
| ثً | sounds like thanh, shouldnt it be thun? | Expected than (th as in thin); thun would be ثٌ. Decision remains pending. |

Do not infer approval from a note that resembles the expected sound. The two
pending clips remain candidates and are absent from runtime/precache.

## Source audit and nine additional candidates

The original source contains no separately identified 81-item long-vowel block:
the identified short-vowel region is followed by tanween and then glides. Many
remaining short-vowel/tanween groups and words are fused or transcribed with
consonant substitutions. Automatic transcripts alone cannot establish absence,
correct vowels, or clean edges. This audit did **not** find 100 defensible new
cuts. No reviewed name sequence or approved syllable was reused to fill a quota.

A second waveform/transcript check recovered nine review-worthy glide excerpts.
Their consonants have independent transcript evidence; the tighter boundaries
follow acoustic activity rather than equally dividing a group. These remain
**candidates**, not certified /aw/ or /ay/ pronunciations. The nine require the
owner's listening review and are not connected to the game.

| Candidate | Source | Seconds |
|---|---|---|
| ثَوْ | batch-1 | 71.905–72.150 |
| ثَيْ | batch-1 | 72.260–72.545 |
| جَوْ | batch-1 | 72.570–72.915 |
| جَيْ | batch-1 | 72.940–73.195 |
| حَوْ | batch-1 | 73.305–73.510 |
| حَيْ | batch-1 | 73.610–73.795 |
| دَوْ | batch-1 | 74.570–74.885 |
| دَيْ | batch-1 | 74.915–75.155 |
| ذَوْ | batch-1 | 75.200–75.435 |

## Next 100 recording requests

[Open the prepared pack](next-recordings/index.html), or [download scripts](next-recordings-100.zip).
This fixed inventory has **100 unique unmapped requests**: 2 mark names, 35
short vowels, and 63 long vowels. It contains no prior reviewed item and does
not count as a playable queue. The nine candidates above are separate.

There are 14 source scripts with at most 8 items each, all below 999 characters.
Directions request one second of silence and preservation of each written
vowel. Generate **batch 02** first and attach its audio in Codex to check the
approach before generating the rest. Instructions are guidance, not a guarantee
that a speech generator will preserve every item.

## Current coverage and verification

612 curriculum requests: **155 approved installed clips, 66 candidates (55
rejected, 2 undecided, 9 new), 149 reviewed name sequences, 213 unmapped items,
and 29 teaching-policy entries**. Other audio continues using existing fallback
behavior. The partial audio patch is not represented as complete.

- 279 Letter Garden tests pass, including exact approval/signature preservation,
  candidate exclusion, source non-overlap, unique new requests, and script limits.
- Actual browser playback decoded all 155 runtime clips; newly approved samples,
  name sequences, replay/cancellation, mute, and unchanged game saves passed.
- The nine new candidates were decoded in a browser and the review workflow was
  checked on the isolated QA origin; no QA decision was saved in owner storage.
- Review/recording handoff pages and copy controls checked in the browser.
- Source quality/pronunciation for the nine remains the owner's review task.

All work remains local. No push or deployment.

## Reproduce

```sh
../letter-garden-voice-runtime/venv/bin/python scripts/import-marin-curriculum-audio.py
node scripts/export-letter-garden-audio.mjs
node scripts/build-letter-garden-audio-review.cjs
node scripts/build-letter-garden-next-recordings.cjs --check
node --test src/letters/tests/*.test.cjs
```
