# Marin import — local Letter Garden

**2026-09-18 update:** The newer [curriculum import](../marin-curriculum/README.md)
supplies Seen, Waw, and Ya from a separate recording. The original 25 files below
remain unchanged; the missing-name notes describe this earlier source only.

The owner supplied `openai-fm-marin-audio-2.mp3` on 2026-09-16. Its unmodified copy
is `original.mp3`. The export is 21.12 seconds, mono, 24 kHz, and contains 25
distinct spoken names. Source and clip SHA-256 hashes and source timestamps are
recorded in `batch.json`.

All 25 clips are active in the local game under `assets/audio/letters/marin-v1/`.
This is AI-generated OpenAI.fm Marin speech, not the earlier Chatterbox audition.
No production deployment has been made.

## Mapping and incomplete source

A local Whisper transcription was used to check order and find omissions. It
misspells several isolated Arabic names; its raw output is retained as
`automatic-transcript.json`, not treated as pronunciation certification. The
owner identified source segment 12 as **Sheen (ش)**. This prevents shifting every
later clip one letter out of place.

The source lacks **Seen (سِينْ), Waw (وَاوْ), Ya (يَاءْ)**. These names retain the
existing device voice. Do not relabel Sheen as Seen or synthesize missing letters
by splicing unrelated phonemes. The OpenAI.fm follow-up attempt displayed its
20-generations-per-day limit; no attempt was made to bypass it.
The earlier `openai-fm-marin-audio.mp3` download was also checked locally. Its
23-segment transcription did not supply the missing names, so it was not mixed
into this voice bank.

To finish the set, import a new Marin export containing:

```text
سِينْ.

وَاوْ.

يَاءْ.
```

Open `index.html` on the local preview to play individual files or download the
25-name sequence with pauses. Missing names remain disabled there.

## Processing and reproducibility

Clips are cut at quiet gaps, with up to 100 ms leading and 160 ms trailing space.
Only 4 ms edge fades are applied; pitch, tempo and original levels are preserved.
The game plays at a restrained 0.9 gain and lowers effects during speech. There
are no network voice-generation calls, subscriptions, or persistent voice process.

From this checkout, using the existing isolated runtime:

```sh
../letter-garden-voice-runtime/venv/bin/python scripts/import-marin-letter-audio.py docs/letter-garden/reviews/marin-letters/original.mp3 --sibilant sheen
```

The importer refuses a different source hash or segment count. New source files
need their own verified mapping rather than this recording's cut positions.

## Verification

- 25/25 WAVs: non-silent, unclipped, valid mono 24 kHz PCM, and HTTP bytes match hashes.
- 219 Letter Garden tests pass, including audio completion, missing/corrupt files,
  native fallback, cancellation, replay, mute, suspended context, and offline files.
- Live preview: Boat introduction and Pond entry, bundled `alif.wav` request,
  rapid replay, mute/unmute, and Home navigation; no browser console errors.
- Existing save still shows 12 rewards, Boat/Smile complete, and the next chapter
  available. No completed activity or new reward was awarded during this check.
- Native iOS/Safari and human pronunciation qualification remain outstanding.

Restore the pre-import local state from checkpoint `3ed86d4` in a separate
checkout; do not reset over unrelated work. The sibling Git bundle is the recovery
copy of this durable checkout.
