# Marin curriculum import — local update, 2026-09-19

For the complete owner review with saved decisions and downloadable results,
use the [Audio confirmation desk](../audio-confirmation/index.html) through the
preview server. It combines all 89 approved installed clips, 23 candidates and 149 local
name sequences, and lists every remaining item without implying it has a cut.

The two owner-supplied recordings are preserved unmodified in `sources/`.
`cuts.json` records their original filenames, SHA-256 hashes, cut positions,
mapping evidence, and review status. `request-items.json` preserves all 409
requested items independently of the subsequently regenerated recording list.
The submitted text is retained in `request-1.txt` (995 characters, 274 items)
and `request-2.txt` (980 characters, 135 items).

## Coverage and outstanding review

64 curriculum-source clips are connected locally: Seen, Waw, Ya, four mark
names and 57 words. Together with the original 25 alphabet recordings, the
bank contains 89 exact clips approved in the owner's September 19 review.
31 candidates were promoted unchanged; three rejected active clips were removed.
The runtime can also queue 149 alphabet-name prompts (55 reviewed by the owner).
It does not construct syllables by splicing letter names.

345 of the 409 requested items remain on existing device speech. Of those,
17 have rejected excerpts and six have new word candidates awaiting review.
The four revised clips have been approved and installed. 322 still have no reliable individual mapping. No item is declared
missing from the source based on ASR alone. See the [applied review and all
correction notes](../audio-confirmation/APPLIED_REVIEW_20260919.md).

The owner initially reported all nine opening names present, then identified
the exact 3.70–4.85 second excerpt as **Dammataan only, not Fathataan**. This
specific listening correction supersedes the automatic positional alignment.
Dammataan now uses that excerpt, replacing the earlier 6.08–7.28 second cut.
The same excerpt is no longer offered as a candidate for Damma or Fathataan;
both retain device speech pending separate verified cuts. No neighboring clip
was relabelled based on list order. `cuts.json` retains the superseded mapping
in its review history. `opening-check.wav` and the native player near the top
of `index.html` expose the confirmed excerpt.

Word mappings were checked against unprompted full-recording and isolated-cut
transcripts. Raw recognition/alignment results are retained here. This checks
likely word identity, not accurate vowels, endings, or teaching pronunciation.
The agent could not listen to these files; the September 19 owner review is now the approval evidence for active clips.
The revised candidates and remaining mappings still need listening review.

Open `index.html` through the preview server to compare imported and candidate
clips with source recordings. Listening on this adult review page does not
change saved progress or the mapping. Corrections belong in `cuts.json`.

## Reproduce and restore

From this checkout:

```sh
../letter-garden-voice-runtime/venv/bin/python scripts/import-marin-curriculum-audio.py
node scripts/export-letter-garden-audio.mjs
node --test src/letters/tests/*.test.cjs
```

The importer verifies source hashes and retains exact NFC curriculum keys,
including vowel and length distinctions. Output is mono 24 kHz PCM WAV with
4 ms edge fades; original pitch, speed, and level are preserved. The existing
25-file Marin bank is unchanged. Only active imports enter the service-worker
cache; candidate excerpts and full recordings are review material. Playback
requires no voice-generation service or persistent local AI process.

The regenerated recording manifest reports 612 unique curriculum requests:
89 exact clips, 149 supported name sequences, 345 requiring recording/review,
and 29 assembly-policy items. A review-needed entry is not an instruction to
regenerate the entire recording; first inspect the supplied source.

Pre-import checkpoint: `7c898ad784acf50ef826152d93a26ace01de14fd` on
`codex/letter-garden-next-major`. Restore that commit in a separate checkout
instead of resetting over current work. All changes remain local; no push or
deployment was made for this import.

## Original import verification (September 18)

- 241 Letter Garden tests pass; output is retained in `tests.txt`.
- Source and active WAV hashes, bounds, exact keys, PCM durations, and offline
  cache membership are checked automatically. Unresolved items must not map.
- A real browser AudioContext decoded all 57 bundled files. The disposable
  `.qa/audio-import.html` fixture played the three new names, a curriculum word,
  and a three-name sequence using the real game voice methods.
- The browser fixture verified sequence cancellation, rapid replay, mute, and
  unchanged local storage. This was an isolated test game, not a complete
  playthrough of every curriculum chapter.
- The review page loads the 32 imported / 377 needs-review counts and exposes
  the short opening excerpt directly. The importer was rerun successfully.
- Fluent pronunciation review, separate Damma and Fathataan cuts, the remaining
  377 mappings, and native iOS/Safari playback remain unfinished.

Current verification: 268 tests pass; see the applied review above for current browser evidence.
