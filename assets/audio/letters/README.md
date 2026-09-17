# Bundled AI letter-name voice

`marin-v1/` contains 25 short WAV clips from the owner's OpenAI.fm Marin export.
The explicit name-to-file map is `src/letters/LetterVoiceClips.js`; placing an
unlisted file here does not automatically activate it. The game never probes
missing filenames or calls an AI service during playback.

Three names are absent from the supplied export: **Seen (س), Waw (و), Ya (ي)**.
They retain browser Arabic speech, as do vowel syllables and Quran words. The
available Sheen (ش) clip was identified by the owner before mapping it.

The adapter decodes the local files through the game's unlocked WebAudio context.
Effects duck during speech; voice is routed separately. Replay, mute and screen
changes cancel old playback. A missing/corrupt file falls back to browser speech;
learning counts audio as heard only after playback actually ends.

See `docs/letter-garden/reviews/marin-letters/` for the original source, timestamps,
hashes, listening page and remaining work. All mapped clips are in the service
worker's offline shell. No voice server or model is needed for these files.

Names stay distinct: `haa`=ح / `ha`=ه, `taa`=ط / `ta`=ت, `zaa`=ظ / `zay`=ز.
Pronunciation still needs human review; waveform and transcription checks are
not a substitute for Arabic listening qualification.
