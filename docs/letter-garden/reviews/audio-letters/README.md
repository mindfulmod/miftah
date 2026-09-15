# Arabic letter-name voice audition

All 28 samples are generated. Free, locally generated AI speech uses the letter names already in `src/data/letters.js`. These are **letter names**, not phonemes or vowel syllables. The manifest records completed files and their hashes. The live game's audio is unchanged.

Open `index.html` through the local preview server to listen individually or use **Play all**. Once the batch is complete, `all-28-arabic-letter-names.wav` contains the alphabet in curriculum order with 0.8-second gaps. AI speech is an audition: pronunciation and voice quality have not been approved for teaching.

## Engine and settings

- [Resemble AI Chatterbox Multilingual V3](https://github.com/resemble-ai/chatterbox), with its built-in voice and Arabic language setting. No personal voice recording or voice cloning reference was supplied.
- Chatterbox source revision: `5de7a54aa4e5e2baadb0182dde554908b48b85c2` (package version 0.1.7); upstream code is MIT licensed.
- Exaggeration 0.25, temperature 0.6, CFG weight 0, repetition penalty 1.3. Lower exaggeration targets restrained delivery; it does not guarantee a softer voice or correct pronunciation.
- Outer silence is trimmed with padding, levels are capped, a gentle 7 kHz low-pass reduces bright high frequencies, and 5 ms edge fades avoid clicks. The engine's AI watermark is applied after processing. Original generated files remain in the runtime's `raw-audition` directory.
- Mono, 24 kHz, PCM 16-bit WAV. Per-letter seeds, durations, generation times and SHA-256 hashes are in `batch.json`.

## Generate once

Generation uses an isolated Python environment at `../letter-garden-voice-runtime/venv`, relative to the checkout. Model weights and package caches stay in that runtime folder, outside the tracked game files. Initial setup downloads free model weights; inference runs on the Mac. No paid API key is used, and no voice server is started.

From this checkout:

```sh
../letter-garden-voice-runtime/venv/bin/python scripts/generate-letter-name-samples.py --device mps
```

Use `--device cpu` when Apple GPU access is unavailable. The script resumes by skipping files already listed as completed. `--limit 3` generates an initial audition. After the first successful run has downloaded all dependencies, set `HF_HUB_OFFLINE=1` to load cached weights without Hugging Face requests.

To reproduce the environment, use Python 3.12 and install the pinned upstream source:

```sh
python3.12 -m venv ../letter-garden-voice-runtime/venv
../letter-garden-voice-runtime/venv/bin/python -m pip install 'git+https://github.com/resemble-ai/chatterbox.git@5de7a54aa4e5e2baadb0182dde554908b48b85c2'
```

Once generated, these are ordinary audio files. They can later be bundled with the game and played without model inference, AI service calls, or a continuously running process. This audition does not wire them into gameplay.

## Listening review

Listen to every clip for missing or extra words, clipped endings, voice consistency, and comfortable volume. Have an Arabic educator check consonants and vowel lengths before using the files for teaching, especially ح/ه, س/ص, د/ض, ت/ط and ذ/ظ. Structural file checks cannot establish correct Arabic pronunciation.

Technical verification passed for all 28 clips: curriculum names/order match, non-silent and unclipped PCM audio, hashes match, and preview HTTP downloads match the local files. The combined track is 43.17 seconds. See `verification.json` for per-clip levels and durations. Browser playback, queue completion, pause/resume and stop were also checked.
