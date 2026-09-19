# Audio confirmation desk

Open through the preview server:
`http://letter-garden-next.localhost:8790/docs/letter-garden/reviews/audio-confirmation/index.html`.
This adult-only review does not load or modify the game, audio mappings, rewards
or learning progress. No external service is called.

## Owner workflow

1. Choose **Start reviewing**. The first 28 items are alphabet names.
2. Play each complete clip and compare its consonants, vowels, length and ending
   with the displayed Arabic. Check for cut-off speech or a neighbouring item.
3. Choose **Correct**, **Needs fixing**, or **Unsure**. Add a note when useful.
4. Use **Next batch** for another eight items. Decisions and notes save locally.
5. Review **Candidate clips** after the installed clips. **Joined name prompts**
   are the existing name clips played in the game's order with a nominal 90 ms
   gap; check the order/transitions, not blended syllable reading.
6. **Download review results**, then attach that JSON file in the conversation.
   Download at any pause; partial feedback is useful. **Restore saved results**
   merges a prior download, preserving newer decisions.

The catalogue covers all 612 distinct current curriculum requests:

| Section | Items | Review action |
|---|---:|---|
| Installed clips | 57 | Confirm pronunciation and cut quality; 28 names first |
| Candidate excerpts | 49 | Confirm whether the proposed cut matches the item |
| Joined name prompts | 149 | Check exact name order and transitions |
| Awaiting isolated cuts | 328 | No approval needed yet; mapping work remains |
| Assembly teaching decisions | 29 | Optional pronunciation-in-context guidance |

The full three source recordings and original submitted scripts are available
under **Original recordings and submitted text**. Unmapped does not mean missing.
Listening to a source does not count as hearing its individual clips.

## Storage and integration contract

- Dedicated localStorage key: `letter-garden.audio-confirmation.v1`. This key is
  separate from every game save. Browser/address changes do not transfer it;
  download a results file for backup or use Restore on another browser.
- Each decision includes item ID, exact audio/mapping signature, verdict, note,
  completed-listen signature and timestamp. A changed clip or sequence requires
  another listen; old notes remain visible but old approval is not applied.
- Playback checks SHA-256 against the catalogue before enabling any approval.
  No speech fallback is used on this page. Interrupted or failed playback cannot
  mark a clip heard. Correct is enabled only after the whole item completes.
- Results are an owner review record, not an automatic production approval or
  edit to `cuts.json`. Review exported corrections, fix/recheck cuts, regenerate
  the bank and test playback before integrating any additional clips.
- Test mode `?qa=1` has separate storage and marks exports `testOnly:true`.
  Normal mode refuses those files. QA records are not pronunciation opinions.
- Download/clipboard are explicit user actions. No results are automatically
  uploaded. Notes remain plain text in the UI.

## Reproduce and verify

```sh
node scripts/build-letter-garden-audio-review.cjs
node scripts/build-letter-garden-audio-review.cjs --check
node --test src/letters/tests/*.test.cjs
```

The catalogue reads existing manifests and actual voice-bank paths. It preserves
exact Arabic text and includes file hashes, available source bounds and teaching
context. It never derives new cuts from list position.

Validation: **261/261 tests pass**, including eight catalogue/decision tests.
Browser QA on the isolated origin checked installed and candidate playback,
source comparison, full name sequence, interrupted playback, reload persistence,
notes, filters, batch navigation and real download/restore. Small-phone
(390×780) and desktop compositions were inspected. Console error log was empty.
These checks validate tooling, not pronunciation. The owner performs that review.

Baseline before this review desk: `708c54f` in the durable checkout. No game or
voice-bank source was changed. No push or deployment.
