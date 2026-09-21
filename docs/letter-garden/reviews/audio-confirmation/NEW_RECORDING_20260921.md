# September 21 recording intake and review

The unchanged owner upload `openai-fm-marin-audio-3.mp3` is preserved as
`../marin-curriculum/sources/batch-3.mp3`: 43.152 seconds, 24 kHz mono,
SHA-256 `224a49929768b1378c21fba0fc112331d555e45ec51fa5da21883edd79a0766e`.
`request-3.txt` preserves the 100-item request. `transcript-3.json` is the raw,
unprompted local transcript, not a pronunciation certificate.

## Review handoff

[Review 76 new clips](index.html?section=new-recording): 2 mark names,
24 short-vowel syllables and 50 long-vowel syllables, in batches of ten.
All new files stay in the candidate folder, excluded from the game and offline
precache. Check exact consonants, vowel length, complete onsets/endings, and
any intrusion from a neighbouring item. Correct requires complete playback.
Choose Needs fixing or Unsure when appropriate and add what you hear.

Next owner action: review these 76, then leave the page open and say “done”
or attach the exported results. Do not regenerate the entire 100-item request.
We will combine unresolved entries and rejected cuts into a focused follow-up.

## Source limits and retained evidence

The recording runs syllables together within consonant groups. Independent
consonant activity, spectral transitions, low-energy boundaries and grouped
transcription were used to propose cuts; no equal-length allocation or list
position alone was used. The original speed, pitch and levels are retained,
with the existing 4 ms edge fades. No time stretching was used to manufacture
long vowels. The owner must confirm the actual long/short distinctions.

24 requests remain unmapped because consonant identity or separation could not
be established reliably. This is not a claim that every held item is absent:

ثَ ثِ ثُ غَ غِ غُ هِ هُ وَ وِ وُ ثَا صَا صِي صُو ضَا ضِي ضُو طَا طِي طُو كَا كِي كُو

`new-recording-assessment.json` records every proposal, exact bounds, source
hash, ambiguity and held reason. Together, candidates and held entries form an
exact 100-item partition. The final Kaf triad has no separate acoustic activity
established after the Qaf group before the source ends.

## Previous approvals installed

The browser export `owner-reviews/20260921-glides-complete.json` contains all
nine previous glide approvals, each with a matching completed-listen signature:
ثَوْ ثَيْ جَوْ جَيْ حَوْ حَيْ دَوْ دَيْ ذَوْ.
Their exact files are installed unchanged, bringing the runtime bank to 164.
55 rejected clips and two undecided clips (تً ثً) remain excluded. All 370 prior
playable signatures and their audio bytes are preserved. The 149 approved name
sequences are reused, not counted as newly generated recordings.

The full 612-entry catalogue now has 164 installed clips, 133 candidates,
149 sequences, 137 unmapped entries and 29 teaching-policy entries.

## Validation

282 automated tests pass, including unchanged owner approvals, rejection
exclusion, source hashes, nonoverlapping candidate bounds, complete request
accounting and unchanged prior playable signatures. Browser validation decoded and hash-checked all 76 candidates and decoded all
164 installed clips. Game playback completed four newly approved glides, a
curriculum word and a three-name queue; cancellation, rapid replay, mute and
unchanged saved progress passed. The isolated review page verified normal-speed
name and long-vowel playback, complete-listen approval gating, note/decision
persistence after reload, filtering and batch navigation. Console errors: zero.
[Desktop review screenshot](evidence/new-recording-desktop-20260921.png).
The owner page still shows all 368 prior decisions (313 correct, 55 fix);
QA evidence was kept on a separate origin/storage key. These checks establish
file and playback integrity; they do not substitute for pronunciation review.

Changes remain local. Recover from the local commit and refreshed sibling Git
bundle; the original upload and every prior reviewed WAV remain preserved.
