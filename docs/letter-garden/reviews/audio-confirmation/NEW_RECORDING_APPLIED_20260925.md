# Latest recording review applied · September 25

The owner completed all 76 clips in the new-recording queue: **73 correct,
3 needs fixing, 0 unsure**. The exact browser export is preserved in
[owner-reviews/20260925-new-recording.json](owner-reviews/20260925-new-recording.json).
Only those 76 decisions were applied; the earlier evidence and notes remain intact.

73 files were reproduced and installed with the exact SHA-256 hashes the owner
heard. They add two vowel-mark names, 21 short syllables and 50 long syllables.
The local bank now has **237 recordings**, with all 370 pre-intake playable
signatures unchanged. No time stretching, pitch change or recutting was applied.
The 149 existing name sequences still reuse alphabet clips.

| Excluded clip | Owner note |
|---|---|
| فَ | sounds like faf |
| فِ | sounds like fif |
| قِ | sounds like fee |

The inspected cut ends are in low-energy intervals before the following
utterance rises: Fa ends at 13.710s before the next strong onset around 13.720s;
Fi ends at 14.000s before the next strong onset around 14.010s; Qi ends at
15.170s before following activity. This does not establish a safe trim that
fixes the reported extra/wrong consonant. No speculative repaired clip was
installed. The source and rejected WAVs remain preserved.

## Next owner action

[Generate the focused 27-item retry](recording-retry/index.html), then attach
the downloaded recordings. It contains these three rejections plus the 24
unresolved source entries. Ten batches of at most three items keep short and
long exercises separate; all are below 999 characters. Use one batch per
recording with the displayed pause instructions. Pauses still require checking.
No previously approved item is requested again.

This closes the review of this particular recording, not all curriculum audio.
The full 612-request catalogue now partitions into 237 installed, 60 candidates
(58 rejected and two undecided), 149 name sequences, 137 unmapped, and 29
teaching-policy requests. Existing device speech remains the fallback where an
exact approved recording is unavailable. No external voice service is called
by the newly bundled clips.

## Verification

- 32 focused audio tests pass; 307 tests pass in the working tree, including the
  separate in-progress Unfuse/Parade pass. Exact approvals, rejection exclusion,
  historical signatures, request partition, no duplicate retry items and
  idempotent import are covered.
- Real browser decoding and SHA-256 verification passed all 76 reviewed clips.
  All 237 installed files decoded successfully through the actual voice adapter.
- The game's `sayForLearning` completed eight new names/syllables, a curriculum
  word and a three-name queue. Cancellation returned false, rapid replay only
  completed the replacement, mute prevented completion and saved storage stayed
  unchanged. Browser console: no errors or warnings in the playback fixture.
- The owner review reloaded with all 444 existing decisions preserved, including
  73 correct / 3 fix in this queue. The review now reports the import and focused
  next step. Its old completed-listen signatures still match every item.
- The retry page presents the exact scripts and individual download links. Its
  copy button reported success; the browser clipboard bridge returned an empty
  readback, so clipboard contents were not independently verified. Selectable
  text and downloadable files are available.

Audio bank and offline shell updated locally. Production is unchanged. The
separate art/gameplay changes remain uncommitted for their own completion pass.
