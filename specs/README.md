# Specs — the source of truth for product decisions

> **Build status (2026-07-17):** all six Fable-critical builds are DONE and
> browser-verified — unified FSRS store (`strength.js`) + time-floor session +
> warm-up reviews; follow mode (`follow.html/js`); Letter Garden strength
> model (`LettersStrength.js`) + adaptive daily world; blend-machine
> mini-game; navigator two-way FSRS sync (`SN.grade` → `syncBack`); zero-crew
> recruitment (`meta.recruited`, `SN.pendingRecruit`, `RECRUIT_SCENES`).
> Recruitment scene copy is Fable-draft, pending owner approval. Remaining
> work on the milestones is the Sonnet/Haiku-tagged tasks in each spec.

Written from the 2026-07-16 discovery interviews (72 questions across the
three apps). Each spec ends with a **Declined** list — check it before
proposing a mechanic, and don't relitigate without new evidence.

| Spec | App | Headline direction |
|---|---|---|
| [01-trainer-v2.md](01-trainer-v2.md) | Trainer | Understand-while-reciting: Urdu layer (Nastaliq, full localization), unified FSRS session with time-floor presets, audio-paced follow mode as both fluency trainer and proof test, manuscript-warmth look with Uthmanic Hafs. |
| [02-letter-garden-v2.md](02-letter-garden-v2.md) | Letter Garden | Quiet strength model + adaptive daily world, blend-machine game, mastery garden (plants bloom with skill strength), real-Quran-word capstones, free recorded-audio bake-off. Blobs stay; Bumble rejected. |
| [03-star-navigator-v2.md](03-star-navigator-v2.md) | Star Navigator | THE retention engine: two-way FSRS sync (revises the old storage invariant), one-sea sessions, verse-recall bosses, One Piece zero-crew recruitment as onboarding, island home screen, day sun-runs. |

## Cross-app dependencies

1. **The unified FSRS word-strength store** (trainer Milestone 1) is the spine:
   the navigator's sync (its Milestone 1) reads/writes it; follow mode feeds it.
   Build trainer M1 before navigator M1.
2. **KFGQPC Uthmanic Hafs** rolls out in the trainer first, then the
   navigator's encounter screen (same transfer argument).
3. The Letter Garden is self-contained (its strength model is its own,
   child-scoped) — parallelizable with everything.

## Standing rules touched by these specs

- `sw.js` VERSION must be bumped on shell edits (PWA gotcha).
- Every build task carries a recommended model tag (see each spec's table).
- `docs/navigator-phases-3-6.md` is superseded in direction; P3/P4 content
  stands.
