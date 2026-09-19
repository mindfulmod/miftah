# Next 100 individual audio items — ready for owner review

Open http://letter-garden-next.localhost:8790/docs/letter-garden/reviews/audio-confirmation/index.html?section=individuals.

**Next action:** play each item, choose Correct / Needs fixing / Unsure, and leave what you heard when it differs. There are ten batches of ten. When finished, download the review JSON and attach it in the conversation. If downloading is unavailable, leave the page open and say the review is finished so its visible results can be collected.

The owner requested that every completed task end with a clear next action. The review page now includes instructions during review and after a queue is complete.

## What is in this batch

| Learning material | New individual clips |
| --- | ---: |
| Short-vowel syllables | 46 |
| Tanween syllables | 25 |
| Leen glides | 25 |
| Sukun example | 1 |
| Three-letter words | 3 |
| **Total** | **100** |

These are mostly syllables, not 100 whole words. None repeats a previously decided item or a joined-name sequence. The preceding 100-item queue remains accessible separately, with its original IDs, order, signatures and owner notes.

## Qualification and preservation

- Every excerpt is a new review candidate, **not a confirmed pronunciation**. All 100 remain outside the runtime voice bank and service-worker audio cache. The game retains its 92 approved recordings; its code, saved progress and audio behavior are unchanged.
- Original owner-supplied sources remain byte-identical. Cuts retain pitch, speed and level, with the importer's existing 4 ms edge fades.
- Candidate selection uses unprompted local recognition to identify consonant groups plus waveform/spectral boundaries. It does not assume every requested item was spoken or split recordings into equal intervals.
- Short-vowel length, nasal endings, glides, doubled consonants and tight cut edges still need human listening. Sixteen low-confidence candidates visibly request a careful listen. Recognition disagreement is retained in `individual-cut-evidence.json`; it is not treated as a correct pronunciation.
- One proposed عَبَدتُّمْ excerpt was excluded because its bounds overlap an owner-reviewed recording. Other source material remains unmapped where individual boundaries or identities could not be supported.
- No external speech service, newly generated voice, production publishing or game feature changes were used.

## Verification

- 272 Letter Garden tests pass, including new guards for 100 unique, previously undecided single-file candidates, file hashes, non-overlapping candidate bounds, unchanged earlier approval signatures, and runtime exclusion.
- All 100 files fetched with matching SHA-256 hashes and decoded as valid mono audio in the browser.
- Actual review UI playback reached the completed state for a short syllable, tanween syllable and word; Correct stays disabled until playback completes.
- Ten-page browser traversal displayed all 100 IDs exactly once, ending at 91–100 with Next disabled.
- QA decisions and notes survived reload in the separate QA storage namespace. Previous and new queue navigation worked. Owner decisions were not edited.
- Catalogue reproducibility, JavaScript syntax and whitespace checks pass. Palette checker reports only the existing project debt; no style or game-art changes were made.

## Reproduce or restore

The checked-in cut sheet is authoritative. Reproduce with the sibling voice-runtime Python running `scripts/import-marin-curriculum-audio.py`, then `node scripts/build-letter-garden-audio-review.cjs`. The importer verifies source hashes and previous approval evidence before writing files.

The preceding local checkpoint is `996eee9ee461c8f0736a6d65365f0394cd13a7df`. Restore by checking that commit out in a separate recovery checkout, retaining the current branch and browser review exports. The sibling Git bundle is refreshed after this review preparation is committed.
