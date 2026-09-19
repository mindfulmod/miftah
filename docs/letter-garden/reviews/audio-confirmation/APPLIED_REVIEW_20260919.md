# Owner audio review applied — September 19, 2026

The original owner export is preserved verbatim in [20260919.json](owner-reviews/20260919.json). All reviewed signatures and audio hashes were checked before applying it. This is a local update only.

## Applied result

- 106 individual clips reviewed: 85 approved, 21 rejected. All 28 alphabet names are approved.
- 31 approved candidates promoted without changing a single audio byte. Three rejected active recordings removed from both the voice bank and offline precache.
- The bank now contains 85 approved exact clips (28 names, four mark names, 53 curriculum words), plus 149 reusable name sequences. The owner approved 55 sequences; the other 94 have no verdict.
- All original notes, rejected excerpts and sources are preserved. Changed cuts cannot inherit an approval.
- 349 of the 409 additional requested recordings still use device speech: 21 rejected/revised cuts and 328 items without isolated mappings. The 29 assembly-policy requests remain separate. Audio is not complete.

## Four revised candidates

Open [Revised cuts from your notes](index.html?section=revised). These are review-only hypotheses, excluded from runtime until approved. No speed, pitch or loudness change was made.

| Item | Previous bounds | Revised bounds | Reason |
|---|---|---|---|
| كَسَبَ | 39.270–39.905 | 39.270–39.620 | Remove the following word fragment reported as “kasabadat”. |
| وَلَمْ | 40.990–41.965 | 40.990–41.820 | Remove the following ya onset reported as “walamya”. |
| يَكُن | 41.965–42.150 | 41.820–42.150 | Restore the onset cut off from “yakun”. |
| بِحَمْدِ | 71.210–71.855 | 71.210–71.600 | Remove the following word onset reported as “behamdilhar”. |

These times are supported by owner notes and matching token/original ASR alignment boundaries. They do not certify the resulting pronunciation. Existing neighbouring approved files remain byte-identical. The importer keeps the original WAV paths and creates `-r1.wav` candidates, recording prior bounds and reviews in `cuts.json`.

## Every rejected item

The other 17 excerpts remain quarantined for further source inspection or an isolated replacement recording. No assertion is made that their sounds are absent from the source. In particular, a too-short clip is not automatically repaired by slowing it, and an ASR spelling match does not overrule the owner’s listening. The owner does not need to review these unchanged rejected excerpts again.

| Arabic | Owner’s note (verbatim) | Current disposition |
|---|---|---|
| ذَاتَ | sounds liks sazad | Rejected; no replacement approved. |
| ٱللَّهِ | sounds like hillah | Rejected; no replacement approved. |
| ٱلْحَمْدُ | sounds like ilhamdu | Rejected; no replacement approved. |
| عَن | sounds like manni | Rejected; no replacement approved. |
| إِنَّ | sounds way too short, the audio needs to be slowed down | Rejected; no replacement approved. |
| لَكُمْ | sounds like kum | Rejected; no replacement approved. |
| كَسَبَ | sounds like kasabadat | Revised boundary candidate; needs a new listen. |
| وَلَمْ | sounds like walamya | Revised boundary candidate; needs a new listen. |
| يَكُن | sounds like kun | Revised boundary candidate; needs a new listen. |
| خَلَقَ | sounds like beqhalaqa | Rejected; no replacement approved. |
| وَمِن | sounds like waminwa | Rejected; no replacement approved. |
| وَقَبَ | sounds like kaba | Rejected; no replacement approved. |
| إِلَـٰهِ | sounds like ilah | Rejected; no replacement approved. |
| ٱلْبَيْتِ | sounds like albaitu | Rejected; no replacement approved. |
| يُكَذِّبُ | sounds like yukazibu | Rejected; no replacement approved. |
| بِحَمْدِ | sounds like behamdilhar | Revised boundary candidate; needs a new listen. |
| ٱلْفَلَقِ | sounds like ulfalaq | Rejected; no replacement approved. |
| غَاسِقٍ | sounds like igasikin | Rejected; no replacement approved. |
| ٱلْعُقَدِ | sounds like kinaluqad | Rejected; no replacement approved. |
| حَاسِدٍ | sounds like ihasidin | Rejected; no replacement approved. |
| صُدُورِ | sounds like usudur | Rejected; no replacement approved. |

## Recovery and reproduction

Baseline before applying feedback: `2b6c8a3f2a5cbffa833c82538d02f7d6f944654f`. Create a separate checkout at that commit to recover the prior bank; do not reset over new work. The sibling Git bundle is refreshed after the local checkpoint.

The feedback application script checks owner/non-QA origin, exact signatures, complete listening for approvals, audio hashes and source bounds before writing `cuts.json`. It intentionally refuses this older export against the four revised clips; a new review is required for new bytes.

```sh
node scripts/apply-letter-garden-audio-review.cjs <saved-owner-export.json>       # validate / preview
node scripts/apply-letter-garden-audio-review.cjs <saved-owner-export.json> --apply
../letter-garden-voice-runtime/venv/bin/python scripts/import-marin-curriculum-audio.py
node scripts/export-letter-garden-audio.mjs
node scripts/build-letter-garden-audio-review.cjs
node --test src/letters/tests/*.test.cjs
```

HTML stamps and service worker advance to `20260919-audio-reviewed1` / `miftah-v49-letter-garden-audio-reviewed-20260919`. The generated remaining-recording list excludes promoted clips. No external generation, payment, push or deployment.

## Validation

266 automated tests pass. They cover exact reviewed bytes, exclusion of rejected clips, stale/QA/incomplete-review guards, retained rejection notes, revised-clip approval reset, native fallback and offline cache membership. Browser QA decoded all 85 runtime files and played three names, three newly
approved words, another word and a joined-name sequence through the actual game
voice methods. Cancellation, rapid replay, mute and saved-progress integrity
passed. All four revised review clips completed playback and enabled the decision
control without any pronunciation vote being cast by the agent. The original
owner tab retained 140 approvals and 17 rejections, and marked exactly four clips
as changed with the old notes intact.

The isolated fixture's first all-localStorage equality check was affected by a
concurrent QA review playback saving its heard status on the same test origin.
With that tab closed, the full fixture passed including unchanged storage. No
owner game or review storage was cleared. Browser console had no errors.

The review layout was inspected at the actual 734 px in-app viewport. A requested
390 px override did not take effect, so no new phone-width check is claimed.
Palette check completed in report-only mode with existing repository debt.

Evidence: [browser checks](evidence/browser-20260919.txt),
[266 tests](evidence/tests-20260919.txt), [review screenshot](evidence/review-20260919.png).
 A bounded Luna audit compared rejected cuts with existing alignment data; integration and verification stayed with the primary agent.
