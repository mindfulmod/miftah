# The Star Navigator — Phase 3–6 Implementation Specs

> **SUPERSEDED IN DIRECTION 2026-07-16** — see `specs/03-star-navigator-v2.md`.
> P3 (relics) and P4 (vessels) are built and stand. P5 cursed cargo is absorbed
> into the night-voyage event pool; P6 becomes per-milestone balancing. Note
> also that invariant #1 below (never touch `quran-trainer:*`) is REVISED by
> the new spec: game state stays in `star-navigator:*`, but word strength now
> syncs two-way with the trainer's unified FSRS store.

Specs for the remaining build-out phases of `navigator.html`. Written against the
codebase as of `?v=20260707-nav12`. Read this whole file before starting any phase;
later phases reuse UI built in earlier ones (the departure sheet in particular).

**Recommended models:** P3 relics — Sonnet · P4 vessels — Sonnet · P5 cursed cargo —
Fable (touches chart/encounter logic) · P6 balance/polish — Haiku, with one Fable
pass if numbers need re-deriving.

---

## Context (what exists now)

The game is a voyage roguelite where recall of Quranic Arabic words is the combat.
Five flat files, no build step: `navigator.html` (shell), `navigator.css`,
`navigator-content.js` (authored data + SVG art, exports `window.SN_CONTENT`),
`navigator-run.js` (voyage engine, loads before core), `navigator.js` (core engine,
boots). Cache-bust: one shared `?v=` string in navigator.html — **bump on every edit**.

Systems already in place that these phases build on:

- **Currents** (Phase 1): three build axes = the three crew. Resolve/Yusuf/blue
  `#7fb4d9`, Precision/Layla/violet `#b48be8`, Swiftness/Idris/teal `#5fd6c0`.
  One pip per boon drafted from that crew (`applyBoon` in navigator-run.js);
  tier per 3 pips (`tierForPips`); tier perks in `C.currents[crewId].tiers`;
  per-tier +12% scaling of that crew's boon numerics (`currentScale`).
  HUD: compact gauges via `currentsHTML(false)` inside `topHUD()`; full panel
  via `currentsHTML(true)` on the boon-draft screen.
- **Living ship** (Phase 2): `C.shipSVG(tiers)` renders the vessel with
  crew-colored fittings gated at current tiers 1–3. Called from
  `renderEncounterShell()` as `C.shipSVG(run.currentTier)`.
- **Verse encounters** (added post-P2): 5th format `"verse"` — answer through a
  fully-unlocked ayah word by word. Chart row 3 may swap one node to verse
  (`genChart`, `SN.eligibleVerses`); boss phases may be verse phases
  (`computeBossPhases`, `run.bossPhases`, `ayahRef` on nodes and `startEncounter`).
- **Word Atlas** hub overlay; `meta.versesCompleted` tracking.
- **Mods contract**: run-scoped effects flow through `applyMods(m, scale)` in
  navigator-run.js; permanent-upgrade effects through `SN.baseMods()` in
  navigator.js. `run.mods` is the single bag both write into.

Invariants (non-negotiable):

1. **Never write `quran-trainer:*` localStorage keys.** Game state lives only
   under `star-navigator:*`.
2. New `meta` fields must default-merge for existing profiles (see
   `defaultMeta()` + the `Object.assign` in `activateProfile`).
3. Mobile-first: verify everything at 375×812. Zero console errors.
4. Tone: family-warm, dignified. Words of the Quran appear only in the answer
   UI — never on enemies, never as damage, and (Phase 5) the cursed cargo is
   **worldly salvage** — gold, charts, pearls — never a sacred object.
5. No duo boons, no combo systems — depth comes from layering instrument ×
   currents × relics, all legible on sight (explicit design decision).

---

## Phase 3 — Relics (keepsake + found)

A second, rarer item class. Boons are plentiful drips that build currents;
relics are chunky, singular, run-defining, and **visible on the ship**.

### 3.1 Data — `navigator-content.js`

New `relics` array (export in the return object). Shape:

```js
{
  id: "moonpearl",
  name: "Idris's Moon-Pearl",
  crew: "idris",            // or null for neutral
  keepsake: true,           // pre-run equippable — else a found relic
  icon: `<svg …/>`,         // 24×24 stroke style matching C.icons
  desc: "Depart with Swiftness already stirring. +1 pearl per encounter cleared.",
  lore: "Pulled from the night-dive he swore he'd never make.",
  unlock: { rescued: 10 },  // keepsakes only: same metric keys as dialogue reqs
                            // (runs / wins / stars / mastered / rescued)
  mod: { startPips: { idris: 1 }, pearlsPerClear: 1 },
  fit: "moonpearl",         // ship-fitting slot id (see 3.4)
}
```

**Keepsakes (4)** — pre-run pick, exactly one equipped, unlock via metrics
(dialogue-beat gating is reserved for vessels, so the two unlock tracks stay
legible):

| id | name | crew | unlock | mod |
|---|---|---|---|---|
| `beads` | Yusuf's Prayer-Worn Beads | yusuf | `{runs: 2}` | `{startPips:{yusuf:1}, restBonus:1}` |
| `atlaspage` | Layla's Atlas Page | layla | `{wins: 1}` | `{startPips:{layla:1}, foresight:1}` |
| `moonpearl` | Idris's Moon-Pearl | idris | `{rescued: 10}` | `{startPips:{idris:1}, pearlsPerClear:1}` |
| `navlantern` | The Navigator's Lantern | null | `{stars: 7}` | `{startPips:{yusuf:1,layla:1,idris:1}}` |

The `startPips` pattern reinforces "currents ARE the crew": a keepsake is a
head start down its crew's current.

**Found relics (6)** — discovered mid-run (haven stall now; cursed cargo in P5).
Louder effects, one honest tradeoff each where flavor allows:

| id | name | mod | tradeoff/notes |
|---|---|---|---|
| `deepharpoon` | Harpoon of the Deep-Court | `{dmgMult: 1.25, hullMax: -1}` | fierce but heavy |
| `whaleblessing` | The Whale's Blessing | `{flawlessHeal: 1}` | heal 1 on every flawless encounter clear |
| `ibnyunus` | Astrolabe of Ibn Yunus | `{removeDistractor: 1, timeScale: 0.9}` | clearer but the glass runs fast |
| `bottledglow` | Bottled Bioluminescence | `{chainRate: 1.2}` | + brightest wake fit |
| `keeperstin` | The Keeper's Tin | `{pearlMult: 1.5}` | run pearls only (applies at bank) |
| `readerslate` | Star-Reader's Slate | `{revive: 1}` | second wind (no-op if already held — say so in desc) |

(Ibn Yunus was a real 10th-century Cairo astronomer — keep artifact flavor
astronomical/nautical, never devotional.)

### 3.2 Engine — `navigator-run.js`

- `applyMods` additions:
  - `startPips: {crewId: n}` → extract the pip/tier-crossing logic out of
    `applyBoon` into `addPip(crewId)` and call it n times. `applyBoon` becomes
    `addPip(b.crew.id)` + `applyMods(b.mod, currentScale(...))`.
  - `flawlessHeal: 1` → in `encounterWon()`, alongside the existing
    `flawlessBonus` check: `if (enc.flawless && run.mods.flawlessHeal) heal(run.mods.flawlessHeal)`.
  - `hullMax` negative: after applying, clamp `run.hullMax = Math.max(2, run.hullMax)`
    and `run.hull = Math.min(run.hull, run.hullMax)`.
  - `timeScale` < 1 already works through the multiplicative formula — confirm
    with a test (0.9 should shorten, not lengthen).
- `run` gains `relics: []` (ids). `SN.startRun` applies the equipped keepsake:
  `applyMods(relicById(meta.equippedKeepsake).mod, 1)` + push to `run.relics`.
- New `grantRelic(relicOrNull, done)` — renders a 1-of-2 found-relic choice
  screen (reuse `.boon-card` styling, gold border, `SN.audio.relic()`); picks
  from `C.relics.filter(r => !r.keepsake && !run.relics.includes(r.id))`.
  If the pool is empty, fall back to +20 pearls.
- Haven: add a fourth stall card — **"A salt-crusted crate"**, cost 15 ◉,
  one per voyage (`run.relicBought`), calls `grantRelic`. Disabled state and
  `spent` class match the existing charm stall.
- Summary: append relic names (and keepsake) to the "Your build" recap line.

### 3.3 State & harbor UI — `navigator.js`

- `defaultMeta()` gains `equippedKeepsake: null`. Unlock state is **derived**
  from `SN.metrics()` (no persistence): `SN.keepsakeUnlocked(relic)` mirrors the
  dialogue `req` check.
- **Departure sheet** (this is the piece Phase 4 reuses): tapping *Set sail* no
  longer starts the run directly — it opens a bottom sheet (`SN.overlay`) with:
  - keepsake row: unlocked keepsakes as tappable chips (icon + name), a "none"
    chip, locked ones greyed with their unlock hint ("Rescue 10 words from the
    deep");
  - (Phase 4 adds the vessel row above it);
  - gold CTA **"Cast off ⛵"** → persists choices to meta → `SN.startRun()`.
  - Remember last selection so a returning player is one tap from sailing.
- HUD: relic chips render at the end of the currents strip (`cur-row`) as small
  gold-bordered icons; tap → `SN.toast(desc)`. Add to `currentsHTML` so every
  run screen shows them for free.
- Audio: `relic()` — deeper, slower shimmer than `boon()` (e.g. 392/523/784
  triangle at 0.12s spacing + low 196 sine bed).

### 3.4 Ship art — `shipSVG(tiers, relicFits)`

Second parameter: array of `fit` ids. One visible marker per relic, layered
like the current fittings (additive only, nothing moves):

- `beads` — tiny blue bead-string swag under the stern rail
- `atlaspage` — small violet-tinged chart pinned at the mast foot
- `moonpearl` — pale pearl set into the bow, soft pulse
- `navlantern` — the stern lantern doubles, gold halo widened
- `deepharpoon` — the bow harpoon grows barbs (extends Swiftness fit slot; both may render)
- `whaleblessing` — faint whale-tail sigil on the mainsail
- `ibnyunus` — brass ring at the masthead gains a second, counter-rotating ring
- `bottledglow` — wake lines double and brighten (pair with Swiftness II wake)
- `keeperstin` — small chest lashed amidships
- `readerslate` — slate tablet at the helm, star-etched

Call site: `C.shipSVG(run.currentTier, run.relics.map(fitOf))`. Keep viewBox
168×112; verify no clipping at combat size (~104×74px).

### 3.5 Verify

Departure sheet flows (pick / none / locked hints); keepsake pip applies at
run start (gauge shows 1/3 before first boon); haven crate purchase; relic
choice screen; each mod observable (`SN.debugRun().run.mods`); ship fits render
at exactly the right conditions (probe `shipSVG` output strings like P2 did);
old profiles load clean; 375px screenshots; zero console errors.

---

## Phase 4 — Vessels (instruments)

Three unlockable vessels + the default. The pre-run "weapon choice": each sets
a base playstyle the currents then amplify.

### 4.1 Data — `navigator-content.js`

New `vessels` array:

```js
{
  id: "sabaq", name: "The Sabaq", meaning: "\"the race\" — سَبْق",
  crew: "idris", unlockBeat: 7,   // meta.crew.idris.beat >= 7
  desc: "Idris's racing dhow. Thin-hulled, hungry for momentum.",
  hull: 3,
  mod: {},                        // plain mods applied at cast-off
  trait: "streakDamage",          // bespoke hook, at most ONE per vessel
  art: { sail: "#5fd6c0-tinted gradient", pennant: "#5fd6c0", silhouette: "dhow" },
}
```

| id | name | crew | unlockBeat | hull | mods / trait |
|---|---|---|---|---|---|
| `miftah` | The Miftah | — | always | 4 | none (the balanced default) |
| `sabaq` | The Sabaq | idris | 7 | 3 | trait `streakDamage`: +4% dmg per current streak step, cap +40% |
| `layl` | The Layl (الليل) | layla | 7 | 4 | `{timeScale: 1.2, dmgMult: 0.9, foresight: 1}` — patient scholar |
| `rimah` | The Rimah (الرماح, "the lances") | yusuf | 7 | 2 | `{dmgMult: 1.25, flawlessHeal: 1}` — fragile, fierce, rewards clean play |

Beat 7 lands mid-arc for every crew (Idris's beat 7 is his pearl-gift scene —
thematically the moment he'd lend you his boat). Only `streakDamage` needs a
bespoke hook; the other vessels ride entirely on existing mods.

### 4.2 Engine

- `SN.baseMods()` no longer hardcodes `hullMax: 4` — it reads
  `C.vessels.find(v => v.id === (meta.vessel || "miftah")).hull` as the base,
  then applies upgrade deltas as now.
- `SN.startRun`: `run.vessel = vesselId`; `applyMods(vessel.mod, 1)`.
- `onCorrect` damage calc: after streakFire, add
  `if (vesselTrait() === "streakDamage") dmg *= 1 + Math.min(0.4, 0.04 * run.streak)`.
- Unlock detection: after a dialogue beat advances in `openDialogue`
  (navigator.js), check whether `cs.beat` just reached a vessel's `unlockBeat`;
  if so `SN.audio.tierUp()` + toast: *"{Crew}'s trust — the {Vessel} waits at
  the dock ✦"*.

### 4.3 UI

- Departure sheet (from P3) gains a vessel row above the keepsake row: cards
  with a mini ship silhouette, name + Arabic meaning, one-line trait. Locked
  cards greyed with "{Crew}'s story continues…" hint. Persist `meta.vessel`.
- Summary "Your build" line starts with the vessel name.

### 4.4 Ship art

`shipSVG(tiers, relicFits, vesselId)`. Shared geometry, param overrides only:

- `sabaq`: hull squats lower/longer, sail narrower + raked, teal pennant, wake
  always doubled (visual, no mechanics)
- `layl`: taller mast, small second sail aft, violet pennant, faint star-chart
  lines on the mainsail
- `rimah`: narrow hull, twin bow lances (distinct from the Swiftness harpoon
  fit), blue pennant

Also swap the tiny chart-map ship marker's pennant color to match — cheap,
delightful. Harbor scene silhouette swap is a nice-to-have; skip if fiddly.

### 4.5 Verify

Unlock toast fires when a beat crosses 7 (drive with `SN.state.meta.crew.idris.beat = 6`
then play the beat); hull bases correct per vessel (2/3/4) after upgrades;
`streakDamage` observable in damage floats; vessel + keepsake + tier-3 currents
+ 2 relics all render together without clutter at 375px (this is the money
screenshot); old profiles default to `miftah`.

---

## Phase 5 — Cursed cargo nodes

Opt-in risk on the chart. Never a global setting; never framed as anything
sacred — it's drowned **worldly** salvage that "the sea asks a price" for.

### 5.1 Chart — `genChart()` in navigator-run.js

- After rows are built: with 55% probability, pick one **enc** node from row 2
  or row 3 (never row 1, never the mystery, never a verse node) and set
  `type: "cursed"` (keep its `format`). Branching guarantees an alternative
  path always exists.
- Rendering (`renderChart`): new glyph — a chest with a narrowed eye-slit —
  and CSS `.chart-node.cursed`: ring stroke `var(--wrong)` `#e0635a`, red-tinged
  pulse animation (reuse `node-breathe` with a filter swap). Label: "Cursed
  cargo". `nodeLabel` → `"Cursed cargo — the sea asks a price"`.
- `enterNode`: `type === "cursed"` → `cursedIntro(n)`.

### 5.2 The pact — encounter rules

`cursedIntro(n)` splash (reuse `.boss-splash` layout, red-shifted):

> *"A cargo net of some drowned merchant fleet, still full. The knots hum.
> Answer without a single slip — the glass runs cruel — or the sea keeps it."*

Buttons: **"Break the seal"** / **"Leave it be"** (marks node visited, back to
chart, no reward, no penalty).

On accept, `startEncounter({format: n.format, cursed: true})`:

- `enc.cursed = true`; `enc.shield = 0` and shields never apply (skip the
  shield branch in `mistake()` when `enc.cursed`);
- timer ×**0.7** (`allowed *= 0.7` in `askQuestion`; pairs stays untimed but
  a single mismatch fails — see next);
- `enc.hp = Math.round(f.hp * 0.8)` — short and sharp;
- **first mistake ends it**: in `mistake()`, if `enc.cursed`, apply the normal
  1 hull damage, then immediately resolve the encounter as *failed* — enemy
  fades, toast *"The cargo slips back into the dark"*, node completes,
  `renderChart()` after a beat. Failure is lost treasure, not death (unless
  that 1 hull was your last — normal defeat rules apply).

### 5.3 Reward

Flawless clear → skip the boon draft; instead `grantRelic()` (1-of-2 found
relics, from P3) **plus 8 pearls**. Relic pool empty → 20 pearls. Track
`run.cursedCleared` for the summary ("plundered the deep" stat line if 1).

### 5.4 Audio/FX

Entry: low detuned pulse (`audio.cursed()` — 98Hz saw pair, slow beat). Clear:
`relic()` chime. Fail: muffled `hit()` + bubbling sweep down.

### 5.5 Verify

Both accept and decline paths; fail-on-first-mistake (deliberate wrong answer)
completes node without reward and doesn't soft-lock; flawless clear grants
relic choice; timer visibly crueler (inspect `allowed`); cursed node never
spawns on row 1 / never replaces mystery or verse (probe `genChart()` 50×
via eval loop); defeat-at-1-hull path still renders the defeat summary.

---

## Phase 6 — Balance & polish pass

A checklist, not a rewrite. Numbers live where noted; change constants only.

### 6.1 Economy targets

- Average victory banks **30–45 pearls** pre-Satchel (probe: 3 scripted full
  runs). Tune the per-clear bonus in `encounterWon` if outside band.
- Upgrade pacing: first fitting ≈ 2 runs (Star Glass 25◉) — unchanged check.
- Haven now sells: rest (free) / boon 12◉ / charm 8◉ / relic crate 15◉ — a
  full haven spend should require choosing, not affording everything: verify a
  typical arrival holds 15–25 pearls.
- Keepsake unlock pacing: beads by run ~2, atlas page at first win, moon-pearl
  by run ~4–6, lantern late (stars 7). Confirm against real metric curves.

### 6.2 Difficulty rails

- Knobs at extremes: `SN.knobs()` with skill floor (acc .3/spd .2) and ceiling
  (acc .95/spd .9) → options 3–5, timeMs 14000→7500. Cursed ×0.7 keeps worst
  case ≥ ~5.2s; with Ibn Yunus (×0.9) stacked, floor is ~4.7s — acceptable but
  flag if a real kid profile hits it.
- Single-crew stack: 9 Idris pips + First Pearl repeats + Sabaq — assert squalls
  still take ≥ 3 correct answers (cap `dmgPerEnc` stacking or storm HP bump if
  not).
- `hullMax` floor 2 (deepharpoon on the Rimah = hull 1? **No** — the clamp in
  applyMods must make this hull 2; test exactly this combo).

### 6.3 Presentation

- Screenshot grid at 375px: {Miftah, Sabaq, Layl, Rimah} × {bare, tier-3-mixed
  + 2 relics} — 8 shots, checking clutter/clipping in the enemy stage.
- "Your build" recap: vessel → currents → keepsake → relics, color-coded, one
  line, wraps gracefully.
- Reduced-motion: gauges, tier flash, cursed pulse all respect the existing
  `prefers-reduced-motion` kill-switch (it's global — just confirm nothing
  depends on animation to convey state; the tier badge and static fills must
  carry the information alone).
- Audio pass: `relic()`, `cursed()`, vessel-unlock reuse of `tierUp()` — ensure
  all gated behind `this.enabled`.
- Word Atlas + star map: add relic/vessel iconography **nowhere** — meta
  progression screens stay about words and sky. (Scope guard.)

### 6.4 Integrity

- Persistence audit: enumerate `localStorage` keys after a full session — only
  `star-navigator:*` (+ pre-existing site keys). Byte-compare any
  `quran-trainer:*` fixtures before/after a linked-profile run.
- Old-profile migration: load a Phase-2-era profile → `equippedKeepsake`,
  `vessel`, `versesCompleted` all default cleanly; no NaN pearls/hearts.
- Full E2E at 375px, zero console errors: victory, defeat, retreat,
  cursed-clear, cursed-fail, each vessel once, each keepsake once, boss with a
  verse phase.
- Bump `?v=` once per editing session; final bump on completion.

### 6.5 Tuning constants index

| Constant | Location | Current |
|---|---|---|
| tier size (pips) | `tierForPips`, navigator-run.js | 3 |
| tier scaling | `currentScale` | +12%/tier |
| base damage | `baseDamage` | 20 (pairs 14) |
| encounter HP | `C.formats[*].hp` | 80–100, boss 70×3 |
| timer range | `SN.knobs` | 14000→7500ms |
| cursed timer/HP | P5 spec | ×0.7 / ×0.8 |
| streakDamage cap | P4 spec | +40% |
| relic crate cost | haven, P3 | 15◉ |
| cursed spawn rate | `genChart`, P5 | 55% |
| verse node odds | `genChart` | 60% when eligible |
