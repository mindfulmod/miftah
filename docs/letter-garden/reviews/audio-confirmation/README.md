# Audio confirmation desk

Open through the preview server:
`http://letter-garden-next.localhost:8790/docs/letter-garden/reviews/audio-confirmation/index.html`.
This adult-only review does not load or modify the game, audio mappings, rewards
or learning progress. No external service is called.

## Current handoff · September 19

The boundary follow-up has **17 approved, 3 rejected and 2 undecided**. All 17
approved files are installed without changing their audio. See
[the applied review](BOUNDARY_APPLIED_20260919.md).

- [Nine additional listening candidates](index.html?section=additional-glides)
  are available from the existing source. They remain outside the game.
- [Next 100 recording requests](next-recordings/index.html) contain 2 mark names,
  35 short vowels and 63 long vowels, none previously reviewed. This is **not** a
  playable queue. Generate the eight-item batch 02 pilot and attach it in Codex
  before generating the rest. All 14 scripts fit within 999 characters each.
- تً and ثً remain undecided. Their expected endings are tan/than, not tun/thun.
  The notes are retained in the previous 22-item queue.

The bank has **155 approved exact recordings**. The catalogue also has 66
candidates (55 rejected, 2 undecided, 9 new), 149 reviewed name sequences,
213 unmapped items and 29 teaching-policy entries: 612 requests in total.

## Queue preparation (historical)

The four revised words are approved and installed: 89 exact recordings now use
owner-approved files. Open [the next 100 items](index.html?section=next100): six
new whole-word excerpts plus 94 undecided joined-name prompts, in ten batches.
Notes save automatically; the queue counter tracks just these 100. No prior
approved/rejected item is repeated. See [the full list and limits](NEXT_100_20260919.md).

## Original September 19 review (before the four-clip follow-up)

At that checkpoint, 85 approved individual recordings were installed. At that point 21 rejections were excluded, including four proposed boundary revisions. The follow-up above supersedes those counts. All owner notes are preserved. See [the applied review and remaining corrections](APPLIED_REVIEW_20260919.md). The remaining 17 rejected clips are unchanged and do not need another listen yet.

## Owner workflow

1. Choose **Start reviewing**. The first 28 items are alphabet names.
2. Play each complete clip and compare its consonants, vowels, length and ending
   with the displayed Arabic. Check for cut-off speech or a neighbouring item.
3. Choose **Correct**, **Needs fixing**, or **Unsure**. Add a note when useful.
4. Use **Next batch** for another ten items. Decisions and notes save locally.
5. Review **Candidate clips** after the installed clips. **Joined name prompts**
   are the existing name clips played in the game's order with a nominal 90 ms
   gap; check the order/transitions, not blended syllable reading.
6. **Download review results**, then attach that JSON file in the conversation. If downloads or the clipboard fail, use **Show results text**.
   Download at any pause; partial feedback is useful. **Restore saved results**
   merges a prior download, preserving newer decisions.

The original recordings and submitted scripts are available under **Original
recordings and submitted text**. Unmapped does not mean proven absent. An
automatic transcript cannot certify vowels or endings. Playing a source does
not count as hearing its individual clips.

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

Original desk validation: **261/261 tests passed**, including eight catalogue/decision tests.
Browser QA on the isolated origin checked installed and candidate playback,
source comparison, full name sequence, interrupted playback, reload persistence,
notes, filters, batch navigation and real download/restore. Small-phone
(390×780) and desktop compositions were inspected. Console error log was empty.
These checks validate tooling, not pronunciation. The owner performs that review.

Baseline before this review desk: `708c54f` in the durable checkout. No game or
voice-bank source was changed. No push or deployment.
