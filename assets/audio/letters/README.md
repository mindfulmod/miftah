# Bundled AI learning voice

`marin-v1/` contains 25 short WAV clips from the owner's OpenAI.fm Marin export.
The explicit name-to-file map is `src/letters/LetterVoiceClips.js`; placing an
unlisted file here does not automatically activate it. The game never probes
missing filenames or calls an AI service during playback.

The complete bank now contains **252 approved recordings** across `marin-v1/`
and `marin-curriculum-v1/`: all 28 letter names, vowel-mark names, and reviewed
syllables/words. Seen (س), Waw (و) and Ya (ي) came from a later supplied source.
The available Sheen (ش) clip was identified by the owner before mapping it.
The 149 letter-name sequences reuse the exact approved names; syllables are never
assembled from arbitrary name clips. Prompts without an approved exact recording
retain existing browser speech. The last retry added 15 distinct sounds from
16 accepted clips; a duplicate وَ remains archived, not mapped to وُ.

The adapter decodes the local files through the game's unlocked WebAudio context.
Effects duck during speech; voice is routed separately. Replay, mute and screen
changes cancel old playback. A missing/corrupt file falls back to browser speech;
learning counts audio as heard only after playback actually ends.

See `docs/letter-garden/reviews/marin-letters/` for the original source, timestamps,
hashes, listening page and remaining work. All mapped clips are in the service
worker's offline shell. No voice server or model is needed for these files.

Names stay distinct: `haa`=ح / `ha`=ه, `taa`=ط / `ta`=ت, `zaa`=ظ / `zay`=ز.
Installed curriculum cuts retain their owner listening evidence and hashes.
Waveform and transcription checks are not a substitute for Arabic listening
qualification. Unapproved candidates never enter the runtime bank. See
`docs/letter-garden/reviews/audio-confirmation/RETRY_REVIEW_APPLIED_20260926.md`
for the current review record and remaining coverage.
