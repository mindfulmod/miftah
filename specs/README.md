# Specs — the source of truth for product decisions

> **Build status (2026-07-17):** all six Fable-critical builds are DONE and
> browser-verified — unified FSRS store (`strength.js`) + time-floor session +
> warm-up reviews; follow mode (`follow.html/js`); Letter Garden strength
> model (`LettersStrength.js`) + adaptive daily world; blend-machine
> mini-game; navigator two-way FSRS sync (`SN.grade` → `syncBack`); zero-crew
> recruitment (`meta.recruited`, `SN.pendingRecruit`, `RECRUIT_SCENES`).
> Recruitment scene copy was simplified for young teens and approved-by-
> direction 2026-07-17; sailor jargon softened across navigator UI text
> (hull→health, ward→shield, vessel→ship, salvage→treasure).
>
> **Reskin ownership (owner directive 2026-07-17): Fable owns the look of
> all three games.**
>
> **All three apps' Milestones 1–4 are built and browser-verified
> (2026-07-18), plus the follow-on content/feature passes.** Trainer:
> unified FSRS, follow mode, Today screen + first-run, full Urdu layer (data
> pipeline, display overlay, Nastaliq webfont, UI localization), manuscript
> reskin + KFGQPC Uthmanic Hafs, anticipation teaser, weekly letter, coverage
> heat-map + root-gem collection (`progress.html`), eight grammar
> micro-lessons (`lessons.html`). Letter Garden: strength model + adaptive
> daily, blend machine, scaffolded retry + warm pet, biome chapters, ambient
> life + melody moments, mastery garden, grown-up corner, say-it-with-me
> beats + Quran-word capstone, pet-mastery radiance. Star Navigator: two-way
> FSRS sync, zero-crew One Piece recruitment, logbook + marked bounties,
> encounter legibility + sea moods, heat system + living island home, crew
> story arcs (pre-authored), sun-run day voyages.
>
> **Genuinely open (needs owner or infrastructure, not buildable solo):**
> owner approval of the Fable-drafted copy (grammar lessons, recruit scenes,
> crew arcs); the free recorded-audio bake-off (needs the owner's ear to pick
> a voice); opt-in reminder notifications (needs push-backend scheduling to
> fire while the app is closed); LG mini-game per-scene backdrops (art
> expansion). Everything mechanically buildable is done.

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
