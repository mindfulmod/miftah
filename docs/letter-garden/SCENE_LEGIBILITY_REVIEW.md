# Prompt and scene legibility — 28 September 2026

Local continuation after `d52ff4d`. Entry stamp `20260928-legibility1`, service
worker v65. No push or deployment. Previous goal turn was verified progress;
the broad art/game goal remains active.

## What changed

The activity prompt used Canvas font-box metrics to shift an HTML line box. In
short landscape this moved complex Arabic words upward, cutting off marks at the
top of the bubble/viewport. The same prompt now renders live SVG text using the
bounded ink fitting already used by answer cards. Width and height follow the
measured text at the current CSS size, with a safety inset and a capped frame.
This retains a large word without sacrificing its dots, shaddah or vowel marks.
The compact grid rows can grow to fit the ink. Replay remains the same button.

Fitting reuses its SVG/text nodes after creation, avoiding a child-mutation loop.
It remeasures on font readiness and resize, respects the text's font weight, and
fits immediately when a listening prompt is revealed. Strings remain textContent,
not injected markup. Learning outcomes, prompt modes and assistance are unchanged.

Pond now has a deeper near bank, layered foreground grass by the boat and a more
distinct night value range with a lit paper rim. The shoreline boat, reeds,
floating leaves, cards and open learning area remain. No added decorative motion,
currency, learning content, saved-state schema or audio assets.

## Verification

- **338 automated tests pass.** A bounded lower-tier helper updated the real
  alignment tests. They cover tall/wide ink bounds, hidden/empty/disconnected
  prompts, font changes, resize, stable SVG reuse, Latin weight/direction and
  watcher teardown. One old canvas mock was corrected to parse the px font size
  rather than mistake a leading font weight for a size.
- Actual 568×320 before/after screenshots show the same `كَيْدَهُمْ` prompt with
  all marks inside the bubble. Its fitted font is approximately 27.4px against a
  30px maximum; the fix does not rely on a tiny font. Answer targets remained
  approximately 71×73px in that later-word landscape round.
- Later-word Feed at 320×568 retains its 48×57px packet target, readable prompt
  and no horizontal overflow. Correct delivery, held result and rotation to
  568×320 worked with replay/Next still visible.
- Pond at 320×568: wrong-word comparison → correct answer → replay → rotation
  while held → Next. Checked normal motion and reduced-motion layouts. No audible
  quality claim is made, and the Mac stayed muted.
- Trace/Fatha at 320×568 retains a 272×193px drawing canvas and all seven colours,
  with pink selected for a pink pet. A Build/Shaddah round at 568×320 completed
  `رَ` + `بَّ` into `رَبَّ`, with replay and Next available.
- Pond day at 390×844 and 768×1024, and night at 1100×800, were inspected. No
  console warnings/errors occurred in the checked views. Syntax and diff checks
  pass. Disposable QA saves used the isolated 127.0.0.1 origin; the owner's local
  save was not seeded or reset.

## Composed-frame values

Light means HSL lightness above 80%; mid is 45–70%; dark is below 30%. Required
frame shares are 8% / 12% / 5%. Full measurements are in
`reviews/scene-legibility/frame-values.json`.

| Pond view | Light | Mid | Dark |
|---|---:|---:|---:|
| Phone day | 49.06% | 23.16% | 7.43% |
| Tablet day | 45.34% | 26.98% | 5.59% |
| Desktop night | 9.32% | 24.69% | 11.50% |
| Small phone night | 16.87% | 27.33% | 12.72% |
| Small phone held result | 14.92% | 31.62% | 10.85% |
| Landscape held result | 12.91% | 32.62% | 12.41% |

All six final Pond views clear the three quotas. Earlier phone day had 1.59%
dark pixels; earlier desktop night had 7.34% light and 1.91% dark. Randomized
lesson items differ in some composition comparisons. The prompt before/after
pair uses the same word and predates the bank contrast adjustment.

## Still open

This does not establish whole-game art completion. The sampled Feed, Trace and
Build frames still fall below the dark-value quota (see JSON), and their
materials/foreground contrast are the next shared art target. The repository
palette report remains at 639 distinct off-palette hexes / 889 uses; no new hexes
were added. `/art-review` is unavailable, so manual screenshots and measurements
are recorded rather than claiming that gate passed. No physical-device or child
observation session was performed.

Next owner action: try a later word chapter in landscape and inspect its full
prompt, then compare Pond in day/night. The open local preview includes the
earlier forgiving Feed target and pet-colour drawing controls.
