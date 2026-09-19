# Marin curriculum import — local candidate, 2026-09-18

For the complete owner review with saved decisions and downloadable results,
use the [Audio confirmation desk](../audio-confirmation/index.html) through the
preview server. It combines all 57 installed clips, 49 candidates and 149 local
name sequences, and lists every remaining item without implying it has a cut.

The two owner-supplied recordings are preserved unmodified in `sources/`.
`cuts.json` records their original filenames, SHA-256 hashes, cut positions,
mapping evidence, and review status. `request-items.json` preserves all 409
requested items independently of the subsequently regenerated recording list.
The submitted text is retained in `request-1.txt` (995 characters, 274 items)
and `request-2.txt` (980 characters, 135 items).

## Coverage and outstanding review

32 new clips are connected to the local game: Seen, Waw, Ya, four mark names,
and 25 curriculum words. Together with the original 25 alphabet recordings,
the bank contains 57 exact clips and covers all 28 alphabet names. The runtime
can also play 149 existing comma-separated alphabet-name prompts by queuing
those recordings. It does not construct syllables by splicing letter names.

377 of the 409 requested new recordings remain on the existing device voice.
49 have candidate excerpts; 328 do not yet have reliable individual mappings.
No item is labelled definitively missing. The rapid syllable runs could not be
reliably segmented and identified automatically. An ASR omission is not evidence
that the source omitted an item.

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
The agent could not listen to these files; fluent human review of the local
candidate remains necessary before considering it production-qualified.

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
57 exact clips, 149 supported name sequences, 377 requiring recording/review,
and 29 assembly-policy items. A review-needed entry is not an instruction to
regenerate the entire recording; first inspect the supplied source.

Pre-import checkpoint: `7c898ad784acf50ef826152d93a26ace01de14fd` on
`codex/letter-garden-next-major`. Restore that commit in a separate checkout
instead of resetting over current work. All changes remain local; no push or
deployment was made for this import.

## Verification

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
