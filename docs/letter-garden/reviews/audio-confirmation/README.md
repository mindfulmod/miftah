# Audio confirmation desk

Open through the preview server:
`http://letter-garden-next.localhost:8790/docs/letter-garden/reviews/audio-confirmation/index.html`.
This adult-only review does not load or modify the game, audio mappings, rewards
or learning progress. No external service is called.

## Current handoff · September 21

[76 new candidates](index.html?section=new-recording) are prepared from the
owner's new `openai-fm-marin-audio-3.mp3`: 2 mark names, 24 short syllables and
50 long syllables. They remain outside the game until reviewed. Another 24 of
the original 100 requests have uncertain identities/boundaries and remain held.
See [source audit and handoff](NEW_RECORDING_20260921.md).

All nine prior glides were approved in the browser and installed unchanged.
The bank now has **164 approved exact recordings**. The catalogue also has
133 candidates (55 rejected, 2 undecided, 76 new), 149 reviewed name sequences,
137 unmapped items and 29 teaching-policy entries: 612 requests in total.

Next: listen to the new 76, choose Correct / Needs fixing / Unsure, and leave
notes. Tell Codex “done” with the page open, or attach the downloaded results.
Do not regenerate the full list. Prior notes, clips and signatures are preserved.
تً and ثً remain undecided: expected endings tan/than, not tun/thun.

## Queue preparation (historical)

The four revised words are approved and installed: 89 exact recordings now use
owner-approved files. Open [the next 100 items](index.html?section=next100): six
new whole-word excerpts plus 94 undecided joined-name prompts, in ten batches.
Notes save automatically; the queue counter tracks just these 100. No prior
approved/rejected item is repeated. See [the full list and limits](NEXT_100_20260919.md).

## Original September 19 review (before the four-clip follow-up)

At that checkpoint, 85 approved individual recordings were installed. At that point 21 rejections were excluded, including four proposed boundary revisions. The follow-up above supersedes those counts. All owner notes are preserved. See [the applied review and remaining corrections](APPLIED_REVIEW_20260919.md). The remaining 17 rejected clips are unchanged and do not need another listen yet.

## Owner workflow

1. Open **New recording · 76 clips**. No approved clip needs another listen.
2. Play each complete clip and compare its consonants, vowels, length and ending
   with the displayed Arabic. Check for cut-off speech or a neighbouring item.
3. Choose **Correct**, **Needs fixing**, or **Unsure**. Add a note when useful.
4. Use **Next batch** for another ten items. Decisions and notes save locally.
5. Historical **Joined name prompts**
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
