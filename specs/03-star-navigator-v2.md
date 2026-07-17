# Star Navigator v2 — the direction (discovery interview 2026-07-16)

Interviewed and locked 2026-07-16. This supersedes the *direction* of
`docs/navigator-phases-3-6.md` (P1–P4 built content all stays; P5/P6 are
absorbed — see "Old phases" below). Declined options at the bottom.

## Identity

- **Job in the family: THE RETENTION ENGINE.** The trainer teaches; the
  navigator makes reviewing already-learned words so fun you volunteer for it.
  Fun leads no tradeoff at the expense of this job.
- **Player:** the owner (adult learner). Full roguelite depth is fine.
- **Session: one sea per sitting (~8–12 min).** Voyages = 2–3 seas with
  safe-harbor saves between; a full voyage spans a few sittings.
- **Proof metric: voluntary review share** — the logbook tracks what fraction
  of weekly FSRS reviews happened in-game vs in-trainer. Target ~30% within a
  month of sync landing; ~0% ⇒ the game isn't fun enough to volunteer for.

## The learning contract (REVISES the old invariant #1)

Old rule "never touch `quran-trainer:*`" becomes:

- **Game state** still lives only under `star-navigator:*`.
- **Word strength** flows through the trainer's unified FSRS store (see
  `specs/01-trainer-v2.md`), both directions, with these semantics:
  - **Trainer → game:** trainer-known words + strength flow in; voyages draw
    ~70% of encounter words from the FSRS due/weak queue, ~30% strong words as
    satisfying fast kills (pacing + cheap honest reps).
  - **Game → trainer (asymmetric honesty):** a game MISS = full FSRS lapse
    (weakness under pressure is real evidence). A game HIT = counted, but
    weighted slightly below a calm trainer rep. Errs toward over-review, never
    under.
  - **The game keeps its own path:** it may introduce words from its own
    lexicon as today; a game-only player hits that ceiling fast — accepted,
    not a problem to solve. Game-discovered words are NOT pushed into the
    trainer's queue.
- Words missed during a lost sea still count as lapses — the ledger stays
  honest even when the game forgives.

## Combat & challenge (recall stays the ammo)

- **Enemies bend the recall task** — each creature attacks the *answering*:
  fog hides options until commit, starsnare shuffles positions, squall adds a
  countdown every third word, leviathan demands a 3-word streak. Variety
  scales by authoring enemies, not inflating numbers.
- **Speed as damage** — fast recall crits; directly trains the under-a-second
  retrieval the trainer's outcome wants.
- **Voyage resource decisions** — hull/supplies/pearls route gambles space out
  the word bursts.
- **Failure: lose the sea, keep the voyage** — sink ⇒ back to last harbor,
  that sea's loot gone.
- **Long arc: heat system** — post-first-win optional modifiers (tighter
  timers, hidden options, elites) for better rewards; player-controlled.
- **Verse encounters = THE BOSS IDENTITY** — every sea's climax is an ayah
  from a completed surah; the sea builds toward it. Regular nodes stay
  word-format. (Whole-verse voyages parked as a possible later special.)
- **Review-only stays strict for combat** — first meetings of trainer-track
  words happen in the trainer's calm, never mid-fight.

## Sea's end (peak-end)

- **Warm logbook page:** words strengthened, words that struggled, streak
  moments, "3 words sent to tomorrow's morning session." The sync made
  visible.
- **Marked-enemy bounties:** missed words return next sea as visibly 'marked'
  enemies — a genuine spaced re-test as a revenge beat.

## Story & world

- **Chaptered arc with a TRUE ENDING** (lift the Watcher's eclipse / find the
  lost star-haven — final framing open), told across successful voyages; heat
  system carries post-game.
- **One Piece crew model (owner directive):** you start with ZERO crew and
  recruit through the adventure — found-family, each member met inside the
  story. Pacing: **one per early chapter** — voyage 1 solo (pure-recall runs =
  tutorial in disguise), Yusuf joins at its climax, Layla and Idris across
  chapters 2–3, each with a rescue/meeting set-piece and **their current
  unlocking with them**. Recruitment IS the mechanics-onboarding ramp.
- **Three resolving crew arcs** — ~8–10 beats each, unlocked by voyage
  milestones, resolving inside the main arc (anchor / atlas page / night-dive
  backstories already seeded in relic lore).
- **Home = YOUR ISLAND (the oasis dream, landed here):** one illustrated
  island scene replaces the menu lobby — dock, shipwright's yard, atlas-house,
  crew idling, rescued passengers settling in and wandering, bounty posters,
  unlocked vessels moored in the cove. Grows visibly with meta-progress. All
  existing menus open from island spots. (Placement agency + suite-wide shared
  island explicitly deferred, not declined forever.)
- **Day voyages — "sun-runs" (owner directive, scoped):** randomly rolled at
  set-sail. Day = the gentle contrast verse that keeps night sacred: no
  bosses, no marked enemies — salvage dives, trade winds, passenger rescues
  (the source of guest passengers and island settlers), lighter strong-word
  review as the activity verb, gold/coral palette flip within the same art
  system. Night stays the hunt; day is the harvest.
- **Variety growth (all four lanes approved):** guest passengers (one-voyage
  legible quirks), bestiary growth (each new creature = a new recall-bend),
  sea events & weather fronts, steady relic/vessel cadence. Currents stay
  capped at 3 axes — variety never adds build axes.

## UI & art

- **UI passes, all four approved, in staring-time order:** 1) encounter-screen
  legibility (bigger Arabic in Uthmanic Hafs to match the trainer, calmer
  options, readable enemy-bend effects), 2) chart/route clarity (real
  affordance on reachable nodes, event telegraphing), 3) boon/relic/vessel/
  passenger card system unification, 4) HUD audit (what earns permanent
  residence vs tap-to-expand).
- **Art next: sea-biome backdrops** — distinct mood per sea within the
  Illuminated Star-Chart style (kelp-glow shallows, mirror doldrums, storm
  indigo, eclipse boss-waters) + the day-palette variants. Island art rides
  the island milestone. Portrait emotion sets deferred to the story milestone.

## Old phases (docs/navigator-phases-3-6.md)

**Absorbed & remapped:** P3 relics + P4 vessels are built and stay. P5 cursed
cargo folds into the night-voyage event pool (it's already "worldly salvage" —
the night mirror of day sun-run salvage). P6 becomes per-milestone balancing
instead of a finale. Header note added to that doc pointing here.

## Build order

- **Milestone 1 — retention engine on:** FSRS two-way sync + due-first word
  cargo + logbook page + marked bounties + asymmetric write-back. (Depends on
  trainer Milestone 1's unified FSRS store — coordinate.)
- **Milestone 2 — the reboot:** zero-crew start + chapter 1 + Yusuf
  recruitment set-piece + currents-unlock ramp + verse-boss framing.
- **Milestone 3 — home & heat:** island home screen + heat system + Layla/
  Idris chapters.
- **Milestone 4 — breadth:** sun-runs + passengers/settlers + weather events +
  biome backdrops + card/HUD passes (legibility pass can start earlier
  opportunistically).

### Recommended models per task

| Task | Model |
|---|---|
| FSRS sync bridge + word-cargo selection + asymmetric write-back | **Fable** (learning-critical, cross-app contract) |
| Logbook + bounties | Sonnet |
| Zero-crew restructure + currents-unlock ramp (touches run engine) | **Fable** |
| Story/dialogue writing (chapters, crew arcs, set-pieces) | **Fable** draft → owner approval |
| Island home screen (scene + growth states) | Sonnet + Fable art-review |
| Encounter legibility / HUD / chart / cards passes | Sonnet each, Fable art-review |
| Sun-run mode + weather events + passengers | Sonnet (Fable for salvage/rescue encounter design) |
| Heat system + per-milestone balance | Sonnet, one Fable numbers pass |
| Biome backdrops | Sonnet + Fable art-review |

## Declined (2026-07-16)

- Standalone-game-first identity; teen/family primary audience.
- Full-run-one-sitting and 5-min-sortie session shapes.
- Read-only or snapshot-only trainer coupling; full-equal-credit write-back;
  lapses-only write-back.
- Full teaching capability in-game (and "scouted discoveries" not chosen —
  the game's own lexicon path covers exploration instead).
- Word-count difficulty scaling (punishes learning — backwards).
- No-death score mode; energy-style pacing (never proposed, standing values).
- Endless ambient myth / seasonal-saga story models.
- Fourth crew member with a current (3-axis cap is a design invariant).
- Full walkabout hub — island is a living picture, not a walk-around game.
- Finishing P5/P6 as written before the new direction.

## Open on purpose

- Final framing of the ending (Watcher's eclipse vs lost star-haven — decide
  when story writing starts).
- Whether later recruits beyond the three (One Piece keeps recruiting) join as
  non-current roles — revisit after chapter 3 ships.
- Whole-sea verse voyages as a post-arc special.
- Exact FSRS weighting number for game hits (tune once data exists).
