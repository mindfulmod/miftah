# Letter Garden v2 — locked decisions (discovery interview 2026-07-16)

Interviewed and locked 2026-07-16. Declined options at the bottom.

## The child & the truth standard

- **Learner:** 5–7 years old, learning Arabic and English scripts simultaneously.
  Decode worlds are genuinely in reach; tracing is age-appropriate motor work.
- **Proof the garden works:** (1) the child asks to play unprompted, and (2) can
  read fresh letters/syllables to a grown-up outside the app (the grown-up
  corner's "try asking them to read these 3" cards make this a 30-second
  ritual). Either signal missing for weeks ⇒ redesign.

## Learning engine

- **Quiet strength model:** per-letter/skill strength tracked invisibly from
  every tap (right/wrong/speed). No visible gates, no failable tests; worlds
  still unlock by play-through.
- **Delivery of weak-letter practice:** the existing `daily` world becomes
  adaptive — its items are always the child's 5–6 weakest skills. (Sprinkled
  distractors / pet-courier delivery declined for now.)
- **Blend-machine mini-game** (new, highest learning value): child drags letter
  + haraka together, the merged syllable pops out and speaks.
- **Say-it-with-me beats:** audio call-and-response — game says "ba!", pauses
  with inviting animation for the child to say it aloud. No mic; the pause is
  the feature.
- **Names-first, sounds with harakat** — faithful to qaida convention; no
  mixed messages with mosque/home teaching.
- **Tracing upgrade:** stroke-order/direction guidance (animated arrow, gentle
  snap-back) and tracing of CONNECTED forms in the forms worlds.
- **Summit: real Quran words capstone** — final decode worlds use short common
  Quran words (رَبِّ، نُور، كِتَاب) with a "this word is in the Quran!" sparkle
  moment. (Bismillah graduation ceremony not chosen — revisit later if wanted.)

## Child UX

- **Map:** gentle beacon + free roam — everything replayable; one stop glows as
  "today's adventure", pet wanders toward it.
- **Session shape:** daily bouquet — pet offers 3 short activities (frontier
  game, one adaptive-daily round, one trace); finishing blooms a daily flower +
  reward moment; then pure free play. ~5 min of structure, freedom after.
- **Wrong answers:** scaffolded retry, NO sadness — friendly wobble, audio
  replays, one wrong option leaves (success within 2 tries). **The pet's
  existing is-sad droop on wrong answers is removed** — pet stays warm/curious.
- **Grown-up corner:** parent-gated (hold 3s) single screen — letter-strength
  grid (strong/growing/needs-love), play-day streak, "try asking them to read
  these 3" cards. Audio/voice settings live here.

## Rewards & pet

- **Economy simplifies to two parts:** stars = single currency (earned by play,
  spent on bodies/accessories/stickers); sticker album = the collection.
  **Stamps retire**, existing stamps convert to stickers so nothing is lost.
- **Pet grows with mastery:** growth/unlocks tie to learning milestones, not
  star spending — new tricks/animations as letter families strengthen, a
  glow-up at each qaida rung. Accessory unlocks hang off mastery milestones.
- **Reward style: earn the choice** — daily bouquet completion earns a sticker
  stand visit, child chooses 1 of 3. No blind packets/loot-box mechanics.
- **Mastery garden:** every letter/skill has a plant along the map — seeded
  when met, sprouting with strength, blooming at mastery. The strength model
  made visible; the child's heat-map equivalent.

## Look & sound

- **Characters: current blob monsters STAY.** Bumble teddy-rig redesign
  REJECTED 2026-07-16 — parked until the owner works out an AI art-asset
  generation workflow. Do not re-propose.
- **Art investment (in order):** 1) biome chapters — qaida chapters become
  distinct biomes (letters meadow, harakat orchard, sukoon night-garden,
  shaddah peaks, decode riverlands…), mastery-garden plants get chapter-native
  species; 2) ambient life pass (butterflies, critters, day-phase birdsong,
  pet naps); 3) mini-game scene upgrades (each of the 7 games gets its own
  staged setting). Sticker-album scrapbook pass declined for now.
- **Sound: adaptive melody moments, no background music loop** — ascending
  pentatonic chimes on correct streaks, biome arrival flourishes, day-phase
  ambient texture. Respects families' varying music comfort.

## Audio set (the garden's teacher)

- Target: complete coverage — letter names, harakat syllables, blends, decode
  words (~300–400 clips). TTS leaves the learning path.
- **Constraint: free.** Path: **sample bake-off** — gather 3–4 free candidates
  (open-licensed letter/qaida recordings e.g. Wikimedia Commons; local neural
  TTS e.g. Piper/Edge; existing qurancdn word audio for the Quran words),
  produce the same 10 test clips from each, owner picks by ear, then batch the
  winner. Family-voice recording remains a $0 fallback if all samples fail.

## Build order

- **Milestone 1 — learning core:** strength model + adaptive daily world +
  daily bouquet + scaffolded retry (de-sad the pet) + blend machine.
- **Milestone 2:** audio bake-off + winner batch-wired; say-it-with-me beats.
- **Milestone 3:** mastery garden + economy merge + pet-mastery growth +
  grown-up corner.
- **Milestone 4:** biomes → ambient life → mini-game scenes; melody moments.

### Recommended models per task

| Task | Model |
|---|---|
| Strength model + adaptive daily world | **Fable** (learning-critical) |
| Blend machine game | **Fable** (new core mechanic + audio timing) |
| Daily bouquet + beacon + scaffolded retry | Sonnet |
| Economy merge + stamp→sticker conversion | Sonnet |
| Mastery garden rendering | Sonnet + Fable art-review pass |
| Biomes / ambient life / scenes | Sonnet per pack, Fable art-review each |
| Audio bake-off research + batch pipeline | Sonnet |
| Grown-up corner | Haiku |
| Melody moments (WebAudio) | Sonnet |

## Declined (2026-07-16)

- Bumble/teddy cast rebuild — owner dislikes Bumble; blobs stay (see above).
- Visible mastery gates / celebration tests — no failable moments.
- Sounds-first phonics ordering — qaida names-first convention wins.
- Care-loop pet needs (feed/wash timers) — guilt pressure, competing game.
- Surprise sticker packets — no loot-box training for a 5-year-old.
- Energy/ticket session pacing — artificial scarcity punishes enthusiasm.
- Paid voice (qari commission) and family recording session (for now) — free
  sourced/generated audio preferred; family mic is the fallback.
- Background music loops — melody moments instead.
- Rich parent dashboard — small corner is enough.

## Open on purpose

- Which free voice wins the bake-off (owner's ear decides).
- Whether a Bismillah graduation ceremony caps the Quran-words summit (revisit
  after milestone 3).
- Character art direction long-term (blocked on owner's AI-art workflow research).
