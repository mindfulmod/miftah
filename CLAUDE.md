# Miftah — working agreements

## Art and visual work

**All visual changes must comply with [ART.md](ART.md).** It is the art bible for
the Letter Garden and it outranks any single session's taste, including the
owner's in-the-moment preference — amend the bible first, then build.

- Before merging visual work, run `/art-review`.
- **No agent may claim visual quality without a screenshot.** "It should look
  right" is not a result.
- `docs/letter-garden-tokens.md` holds the code-level token names and the
  contour/stroke/duration scales. ART.md holds the reasons and the review bar.
- Run `node scripts/check-palette.mjs` before committing art changes; it fails on
  hex literals that aren't in the bible.

Recurring visual failures mean the bible is missing a rule. Add the rule — don't
just fix the instance.

## Locked decisions (do not relitigate)

These were settled in owner interviews and are recorded in `specs/`:

- Blobs stay as the cast. Bumble/teddy character rebuilds are rejected.
- No words anywhere in the Letter Garden — the art is the interface.
- Names-first voicing for letters (Noorani Qaida convention), not sounds-first.
- No failable moments, no guilt copy, no care-loop pet needs, no loot boxes, no
  energy/ticket pacing, no background music loops.
- Warm storybook palette. Never cold navy or grey contours.

## Shipping

- The whole repo is the GitHub Pages artifact; there is no build step. Pushing to
  `main` deploys.
- Bump the `?v=` query stamps in the HTML entry point **and** the `VERSION`
  constant in `sw.js` whenever shipping shell changes, or the service worker will
  serve stale files.
