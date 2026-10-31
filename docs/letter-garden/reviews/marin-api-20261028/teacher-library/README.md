# Selected composed-teacher library

The owner selected the earlier composed-teacher sample on 2026-10-29 and rejected the natural-flow revision. Further voice experiments are closed.

The plan in `../teacher-library-plan.json` freezes March Marin, speed 1, WAV, the selected teacher delivery instructions, and the 389-item prepared queue. The delivery wording is unchanged; only the final task clause is adapted from two names to one exact curriculum item per file. Previously approved game audio remains installed.

## Current quality hold

The next 100 were generated and reviewed. All 100 browser review rows are saved in `batch100-owner-review.json`. Of 73 correct marks, one includes a repetition note; with 26 fix marks and one undecided item, 72 are clear approvals and 28 remain held. `batch100-diagnosis.json` preserves the exact held items and notes. No further paid generation is enabled; no new batch is installed.

The owner reports wrong letters in the single syllables and the wrong starting letter in the word. The silence-only experiment is closed. Next: `pronunciation-check/index.html` presents a bounded three-item correction test. It replaces the ambiguous instruction “direct vowel onsets” with “clear word beginnings” and adds explicit phoneme guidance, retaining March Marin, speed, input text, and the rest of the teacher delivery. This is an unproven test, not guaranteed pronunciation control. Run only `--generate --pronunciation-check`; larger generation remains held.

## Previous generation command (currently disabled)

All first 12 recordings are owner-approved, including the separately generated Rumman replacement. `owner-review.json` records exact hashes and retains the original rejection in its history. The selected voice direction is unchanged. These clips are approved for installation; runtime installation remains pending.

Generate **100 new items**, queue positions 13–112, privately in Terminal:

```sh
env -u OPENAI_API_KEY python3 "/Users/main/Documents/GitHub/miftah/.local-work/letter-garden-next-major/scripts/letter-garden-marin-api.py" --generate --teacher-batch --limit 112
```

The limit is cumulative: 112 minus 12 already attempted means 100 new files. Repeating this command cannot advance beyond item 112. It skips existing attempts and stops on a failed request; inspect any failure before another run. No automatic retries or model substitution.

The next batch uses a $5 planning reservation, not measured API billing. The prior cumulative reservation is $1.90, so this run fits the existing $20 planning guard. No paid requests were made while preparing this batch.

Refresh the review page after generation. It defaults to only the next 100 items; the approved first 12 remain accessible separately. Listen, mark correct or needing a fix, then export the review. Decisions remain tied to exact candidate hashes. No unreviewed audio is installed automatically.

## Validation

- 25 generator tests passed, with requests mocked; no paid API calls made in this implementation pass.
- New and updated review page scripts pass syntax checks.
- Browser confirmed selected reference, exact private-key command, all 12 entries, and 0/12 ready before generation.
- Baseline and restore instructions: `.qa/baselines/marin-teacher-library-20261029/RESTORE.md` at repository root.

This implements generation and review preparation, not completion of the entire audio migration. Existing review/context exceptions remain tracked separately from these 389 queued items.

The replacement uses a separate stage and file. The original rejected bytes remain intact. Repeating the command does not generate another file or repeat the 11 approved items; stale rejection hashes and approved items are blocked before reading a key. No audio listening or acoustic processing was performed during this feedback pass.

## Three-item pronunciation result

The owner approved the new كِ and تِ on 2026-10-29. The new تِمْسَاح still sounds like imsah and is rejected. Exact file decisions are in `pronunciation-check/owner-review.json`; earlier rejections remain in owner-review history. The Cairo Arabic Language Academy entry confirms the initial ت: https://www.arabicacademy.gov.eg/ar/search_engine/roots/تمساح . Across the next-100 batch, 74 now have clear approvals and 26 remain held. No runtime installation or further paid requests occurred during this review pass. Further identical isolated retries are closed; the next candidate approach for the remaining word is a short contextual utterance followed by a carefully reviewed word extraction, not a change to the correct lesson spelling.

## One contextual Timsah test

At the owner’s request, `--generate --timsah-context` creates only نَقُولُ: تِمْسَاحْ. using the selected March Marin voice at speed 1. Plan: `../timsah-context-plan.json`. Review: `timsah-context/index.html`. The literal target game key remains تِمْسَاح; this full phrase has a separate ID and is not eligible for automatic installation. Review the full phrase before isolating the word, then review the cut. Other generation remains held. No paid calls were made while preparing it.
