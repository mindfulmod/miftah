# Marin completion — current audit and local generation

Prepared 2026-10-28 from the current Letter Garden source. The owner has now run 13 attempts: 12 returned audio and one returned HTTP 401. The completed pilot failed listening review; full generation is held. The existing approved bank and game runtime are unchanged.

## Coverage

- 888 unique catalogue requests: 252 approved exact Marin recordings, 149 local sequences of approved names, 421 otherwise generatable requests, and 66 requests needing an appropriate teaching example. No approved clip files are missing.
- All 28 alphabet names are covered. The two missing mark names are in the API queue.
- Hank's archive was validated by exact text identity, SHA-256, WAV decoding, duration and peak level: 20 candidates, 19 technically usable/unreviewed, one almost-silent طُو queued for replacement.
- 13 contextual Quran readings from the archive's proposed triage remain separate for an Arabic reading decision. They are not silently rewritten or declared incorrect.
- Ready queue: **389** separate requests — 2 mark names, 203 syllables, 56 picture/story words, 128 Quran-reading words.
- The 19 candidate files are not yet installed, so their current game requests still fall back. The CSV lists all 487 not-yet-Marin requests, their game uses, current fallback and next action.

Coverage follows the tested curriculum, optional toys, all book casts, Sound Lab, reading surahs and treasury catalogue. Arbitrary future runtime strings and audio download failures are not guaranteed by a static catalogue audit. Existing local clips can still fall back if loading/decoding fails.

## Why use the API

OpenAI.fm is the interactive speech demo. Hank's October 20 result reports it stopped at 10 demo downloads per week. We will not bypass that limit. The official Speech API supports Marin, instructions and WAV output. Generate one exact item per request to avoid the previous omission/splitting problems. Files are generated once and bundled after review; children do not make API calls.

Use `gpt-4o-mini-tts-2025-12-15`, Marin, speed 1, the existing per-category directions. This is the documented legacy Speech API workflow, available until its announced shutdown on January 6, 2027. It is sufficient for this one-time asset batch; future generation after that date needs a different workflow. No game dependency on the service is being introduced.

## Credit and key

Current official prices: $0.60 per million text-input tokens and $12 per million audio-output tokens. The current pricing page does not publish a per-minute estimate. As an explicit planning scenario, 389 clips averaging 200 input tokens plus 200–1,000 audio-output tokens would cost about **$0.98–$4.71**. This is not a quote or a measured Arabic-prompt cost. Check the 12-item pilot in the API usage dashboard before the rest.

The local runner reserves $0.05 per attempted request and defaults to a cumulative $20 planning allowance (full queue reservation $19.45; pilot $0.60). These are conservative bookkeeping reservations, **not actual charges or an account-level hard spending cap**. No automatic top-up, purchase, retry, or background service. Failed/uncertain attempts remain reserved and are not automatically repeated. The API's actual bill remains authoritative.

The key is read from a hidden Terminal prompt, or OPENAI_API_KEY if explicitly configured. It is never a command argument, never saved in a file, and never sent to the review page. HTTP redirects are rejected. Do not put a key inside the repository: the development server serves this folder.

## Original pilot command — now held

Open Terminal on the Mac, paste this command and press Return:

```sh
python3 "/Users/main/Documents/GitHub/miftah/.local-work/letter-garden-next-major/scripts/letter-garden-marin-api.py" --generate
```

The original 12-file pilot is complete. This command and `--all` are now blocked before key entry or any network request. Do not use them to expand this batch.

The hold may be lifted only after a reviewed voice-generation approach is established. Uncertain failures still require inspection before retry. A successful file check is never pronunciation or voice approval.

## Quality and installation

Each output stays unreviewed with exact text, model, voice, request ID, file hash and technical checks. Keep raw audio intact: no aggressive trimming, pitch adjustment or arbitrary syllable cutting. Install only reviewed mappings and then test replay/cancellation/offline playback and reading sequences. Handle the 66 teaching examples and 13 reading-context cases explicitly before claiming full Marin coverage.

Official sources:
- https://developers.openai.com/api/docs/guides/text-to-speech
- https://developers.openai.com/api/docs/models/gpt-4o-mini-tts
- https://developers.openai.com/api/docs/pricing

Validation: 11 runner tests pass (dry-run, exact identity, no duplicate attempts, failed-request reservation, WAV flags, redirect protection, secret-free output, streamed WAV recovery with unchanged PCM, truncated-file rejection, explicit HTTP 401 requeue and a cumulative pilot limit). 9 existing inventory/curriculum/speech tests pass. No API call was made by these tests.

## Pilot recovery — 2026-10-28

The two successful API responses used streaming WAV headers whose length fields are unknown (0xffffffff). The original checker mistook those fields for an almost 25-hour recording and stopped. Fixed: measure received PCM samples and normalize only the playable WAV header. Ordinary truncated WAV files still fail validation.

- شَدَّة: 1.95 seconds; بَ: 1.45 seconds. Both recovered without a new API call, with every PCM sample preserved. These still need listening review.
- Original responses are preserved in `api-raw/`; playable copies are in `api-candidates/`. Corrected candidate events are appended to the ledger; prior events remain.
- The separate سُكُونْ attempt returned HTTP 401 and no audio. After inspection it was explicitly made eligible for the next owner-run command. Other failed or uncertain attempts remain held.
- Dry run now shows 10 remaining in the pilot. The $0.15 prior reservation is bookkeeping for three attempts, not measured spending. No paid request was made during this repair.

## Failed listening pilot and bounded comparison — 2026-10-28

Owner reports: سُكُونْ has static/robotic noises; مَا has a deep voice; قُلْ repeats twice and has bass noise. These three are rejected. The remaining nine are held for speaker consistency review. None is installed.

Verified all 12 request records specify Marin and the same dated model. All 12 are mono, 24 kHz PCM16, and every sample matches the original API response after WAV-header normalization. The review player uses normal playback speed; it now stops the previous clip when another starts. Overlapping playback was possible, but is not established as the cause of the reported artifacts.

The old category directions differ and include production/QA instructions such as asking the voice to flag ambiguous Quran readings. Those belong in review logic, not spoken-delivery instructions. Very short isolated inputs and varying direction are hypotheses to test; neither is a confirmed root cause. No EQ, pitch shifting, denoising, trimming, or cosmetic processing has been applied to hide defects.

The next experiment uses one concise instruction shared across all six requests, the same model and Marin voice, and speed 1. For each of Sukoon, Maa and Qul, A is the exact target alone and B adds a spoken Arabic lead-in. The B files are context experiments and cannot go into isolated game buttons as-is. No automatic splitting is introduced.

```sh
python3 "/Users/main/Documents/GitHub/miftah/.local-work/letter-garden-next-major/scripts/letter-garden-marin-api.py" --generate --calibrate
```

This generates at most six candidates in a separate folder, resumes without duplicating its own attempts, preserves the pilot and shares the same cumulative ledger/budget. Its $0.30 reservation is planning bookkeeping, not actual billing. No paid calls were made while preparing this experiment. The owner must enter the key locally as before.

Compare both variants against the previously approved Marin references on the review page. Each target must be spoken exactly once, with correct consonants/vowels, no static or bass artifacts, and a consistent natural voice. If neither approach passes, keep the production hold and revisit the generation method rather than buying the remaining batch. Even a passing comparison needs a small replication check before scaling up.

Validation for this change: 15 offline runner tests pass, including the hold before key/network access, exactly six comparison jobs, isolated output folders, resume without duplicate purchase and the shared budget. The review script also passed an offline playback-overlap check. In the browser: 12 held cards, 3 reported rejections, no comparison files yet, normal playback speed, no autoplay, no horizontal page overflow. These checks make no claim about speech quality.

## Comparison rejected — voice mismatch

The owner reports that the spoken lead-in sounds deeper and that the new audio still does not match the earlier voice. This closes the six-file experiment as unsuccessful for voice consistency; it does not fabricate individual pronunciation decisions. All generation modes, including calibration, are now held before key entry or API access. No new API calls or runtime changes were made in this response.

The original alphabet manifest records OpenAI.fm / Marin, but not the precise model snapshot or style instructions. Both original import scripts preserve pitch, speed and levels, with segmentation and tiny edge fades only. The earlier brighter voice was therefore not a pitch adjustment in our importer. The mismatch cause remains unknown. Next: recover the original FM instructions if available, before considering another bounded experiment. Preserve the approved bank and all raw comparison files.

## Original direction recovered from this chat

A scoped search of the owner-requested chat history found the actual OpenAI.fm interaction at 2026-09-15T20:03:32.016Z. The previous UI snapshot identifies the clicked button as Marin, and the following snapshot confirms the exact voice direction was entered. The complete recovered instruction and provenance are in `original-fm-direction.json`. Its core direction is a gentle, welcoming Arabic teacher for ages 4–6 with a soft, warm, natural voice. The owner now also describes the desired sound as more feminine and not deep. That new wording is recorded separately from the historical quote. The original backend model snapshot is still unknown.

This is concrete new evidence, not another guessed prompt. One separately enabled request (`--generate --reference-check`) compares Baa and Meem with existing approved recordings of those same names, using the exact recovered instruction. It makes at most one request, saves raw and playable copies separately, keeps all other generation modes held, shares the existing budget ledger, and never installs or replaces game audio. $0.05 is a planning reservation, not measured billing. No API call was made while preparing it. A matching result is not guaranteed, and missing-item generation remains blocked.

## Offline acoustic comparison completed

Owner rejected the original-direction reference as still deeper. All paid modes are now held, including the reference exception. The local comparison and gain-only listening controls are in `acoustic-comparison/index.html`, with full measurements and limitations in `measurements.json`. Both new names have lower estimated pitch (about 4–8% across methods). New Meem is about 28% longer in the energy-defined active region, +3 dB RMS, and more low-frequency concentrated; Baa has lower pitch but a brighter power spectrum. The original imported interior samples match the decoded source within one PCM16 step; new PCM exactly matches its raw API response. This localizes the difference to generated delivery, without proving whether backend model/version, input context or generation variability is responsible. No API requests or game-asset edits were made. No further owner generation/review is required now.

## Owner refinement: pronunciation, rhythm and expression

Owner reports old Baa sounds like baa while new Baa sounds like bah / a different accent; new Meem stretches its middle and sounds subdued, while the older voice is brighter and more excited. These observations are recorded separately from measurements and are not used to assign a specific regional accent. Both inputs remain the correct source letter-name strings. `voice-acceptance-profile.json` captures the desired light, feminine, smiling teacher delivery, accurate vowel quality, preserved vowel-length distinctions and natural timing. The final reference did reuse the recovered prompt, so the earlier neutral wording alone does not explain its failure. No paid mode was enabled, no request was made, and no game audio was changed.

## Authorized single-variable snapshot test

The owner now requests a concrete matching approach and one sample before the rest. Official documentation lists both `gpt-4o-mini-tts-2025-03-20` and `gpt-4o-mini-tts-2025-12-15`; its current model alias points to December. Public FM code also uses the undated alias, but historical live backend provenance remains unknown. Switching only to the undated alias would not test the earlier snapshot.

`--generate --snapshot-check` requests one Baa/Meem recording from the March snapshot, with exactly the same text, recovered instructions, Marin voice, speed and WAV format as the rejected December reference. The only changed request field is model. This is a controlled hypothesis test, not a guaranteed voice match. It preserves prior audio, uses the shared budget ledger ($0.05 planning reservation, not measured billing), and cannot retry, fall back or enable the other generation modes. All 19 offline runner tests pass. The task has no API key; no paid call was made during preparation. After a passing owner review, freeze the model/settings for subsequent work. After failure, stop rather than sweeping more paid prompts. See `snapshot-comparison-plan.json`.
