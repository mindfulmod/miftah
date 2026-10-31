# Letter Garden audio coverage

Generated from the current source with `node scripts/audit-letter-garden-audio.mjs`.

- requests: **885**
- approvedBankClips: **252**
- approved-local: **252**
- local-name-sequence: **149**
- needs-generation: **418**
- pronunciation-decision: **66**
- missing-file: **0**

Approved-local means an existing owner-approved key and file, not a new pronunciation judgment. Name sequences reuse complete approved names. Missing items are not installed or silently marked approved. Sound Lab and bare assembly requests with unclear standalone pronunciation are held separately. The inventory covers all chapter catalogues, dynamic name chains, all friend/picture words, every book cast, Sound Lab combinations, the 11 reading surahs and the sticker treasury. It does not claim exhaustive arbitrary runtime-string coverage.

Each generation request produces one file. Keep returned files in candidates/ until mapping, decoding, duration, clipping, silence, pronunciation and replay are checked. Preserve exact text and vowel distinctions; never use fuzzy matching.
