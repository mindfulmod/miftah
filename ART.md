# ART.md — Letter Garden Art Bible

Every visual change must comply with this file. When in doubt, this file wins over
anyone's taste — including the user's in-the-moment whims (amend the bible first,
then build). Owner instructions take precedence over this document. Companion doc: `docs/letter-garden-tokens.md` holds the code-level
token names; this file holds the *reasons* and the review bar.

## 1. North star
- Visual foundation: **Toca Life World**. Owner direction also requests **Animal Crossing** cues: welcoming places, tactile materials, purposeful props and gentle environmental responses. Preserve Letter Garden’s existing cast and native paper-diorama style.
- One-sentence look: *warm storybook paper diorama where the cast carries all the
  colour and the world quietly frames them.*
- Gut test: new assets must belong to Letter Garden’s warm paper world; references inform its craft, not a replica of another game's assets. Existing blob pets remain available. Owner-approved prototype animals Lumi, Mina and Rafi now join the live selectable cast, preserving their anatomy and wardrobe.
- No words anywhere. The art IS the interface.

## 2. Palette (LOCKED — no other hexes may appear in code)
Derived from the shipped build, not imported: this is the existing palette
disciplined into ramps. Shadow shades shift **cooler**, light shades shift
**warmer** — never just darker/lighter of one hue. Cooler must never reach cold
navy or grey; it stops at warm mauve.

| Ramp | Light | Base | Shadow | Dark |
|---|---|---|---|---|
| Ink (contour) | `#a89478` | `#4a3620` | `#3b2a19` | `#2b1e12` |
| Paper / surface | `#fffdf7` | `#fffaf0` | `#e5dcc8` | `#c9bda4` |
| Gold (motif only) | `#ffe49a` | `#f3c955` | `#c69434` | `#70501b` |
| Foliage | `#b7e779` | `#7fce54` | `#4e9677` | `#2f5c46` |
| Sky — day | `#ccfbef` | `#96ecff` | `#62cdf4` | `#3a8fc4` |
| Sky — night | `#6064a0` | `#4a4d84` | `#34375f` | `#23253f` |
| Accent-warm (the live/next thing) | `#ffa06e` | `#e8743c` | `#b0501f` | `#7a3512` |
| Accent-coral (delight, rewards) | `#ffa798` | `#ee806f` | `#c25a49` | `#8a3a2d` |
| Sage (olive, dates, snake, dry herbs — fruit-world greens only) | `#c4d39b` | `#93ab6c` | `#647d4e` | `#3e5236` |
| Lavender (grapes, figs, spider, the check-up button) | `#e6d6f0` | `#b49fcf` | `#8c74b0` | `#5e4680` |

*Sage and Lavender added 2026-10-01 (palette pass 2): the fruit stickers and the
map check-up button carried ~40 hand-mixed olives and lilacs with no ramp to land
on — forcing them to Foliage or Sky-day turned olives neon and grapes blue. Both
ramps obey the warm-light / cool-shadow rule. They are subject colours: never use
them for UI chrome, ground, or sky.*

**Generated colour** (pet hue, biome hue) is allowed but must obey these bands —
this is how hue-driven code stays on-palette:
- Fill: `S 52–76%`, `L 54–70%`.
- Light band: rotate hue **toward the warm anchor (45°)** by 8°, `S −8`, `L +14`.
- Shadow band: rotate hue **toward the cool anchor (250°)** by 6°, `S +6`,
  `L −18` but never below `L × 0.55`.
- *Corrected after the ramp build: this was originally written as a fixed `H +4` /
  `H −6`, which is hue-direction-naive — for a green (H≈140) `+4` moves toward
  cyan, i.e. colder, the exact opposite of the rule. Warmth is a direction toward
  an anchor, not an offset. The proportional shadow floor was added because a flat
  `−18` collapsed night's ground (L≈31) to `#0a1f1a`, a near-black hole that made
  the trees disappear.* Implemented as `ramp()` in `LettersArt.js`.
- Never `S > 80%` (neon), never fill `L < 34%` or `L > 88%` (mud / blowout).

## 3. Contour law — weight means interactivity
The single most important rule, and the one that separates this from a sticker
sheet. Toca outlines objects and leaves scenery bare; contour therefore carries
*meaning* here:

| What it is | Contour |
|---|---|
| Touchable — tiles, cards, buttons, pet, map stops, tappable props | Chunky ink `3 / 4 / 6 / 8` |
| Small discrete props, and detail on a touchable thing | `1.6 / 2.4` |
| **Masses — sky, hill/ground bands, biome fills, anything in the FAR layer** | **NO contour.** Value separation only |
| Discrete celestial objects (moon, sun) | `INKS.night` at `1.6 / 3` — they must read as objects |

Rule of thumb (added after review 1, which the original wording got wrong): if it
spans more than roughly a third of the frame, or sits in the far layer, it gets no
contour. Size and layer decide this — not whether the child can touch it. Toca
leaves big masses bare but *does* outline small props thinly.

One ink family only (§2 Ink ramp). Never cold, never grey, never a darker shade
of the object's own fill.

## 4. Depth & light (2D recipe — mandatory before art is judged)
Three layers, always:
- **Far** (backdrop): desaturate −15%, lighten +12% toward sky. No contours.
- **Mid** (world, scenery, props): muted fills, contact shadows, no contours on masses.
- **Near** (interactive): full saturation, full chunky contour, contact shadow.

Rules:
- Any filled shape wider than ~24px uses a ramp (light band + base + shadow band).
  Single flat fills are for shapes smaller than that only.
- **Warm light pool:** **at most one** per screen — a radial gold glow (alpha
  `0.35–0.5`) behind whatever the child should touch next. **Required** when the
  next action is ambiguous (the map). Screens with one obvious action (a meet
  card, a single tile) may have none: a glow on an already-unmistakable button is
  noise. Never two. *(Loosened after review 1, which failed meet and play for
  having zero — wrongly.)*
- **Value tiers are mandatory and measured on the COMPOSED FRAME:** at least **8%**
  of pixels above `L 80`, at least **12%** within `L 45–70`, and at least **5%**
  below `L 30`. Presence alone is not enough.
  *Measure the whole rendered screen, never the backdrop SVG alone. The sky is a
  CSS gradient on the app root and the path, cards and topbar are cream — so a
  backdrop-only sample excludes every major light source and understated light by
  ~22 points, which is how review 1 graded this a FAIL when the real frame passes.*
- **Characters carry the colour.** Scenery saturation stays at or below `S 60%`;
  the pet and letter cards are the most saturated things on screen.
- Day/night phases must differ in *value and temperature*, not just sky hue.

## 5. World density (anti-empty rules)
- Group scenery at the edges around a clear learning zone. The live Boat chapter
  uses one boat-and-flower cluster and one reed cluster; no fixed prop quota.
  The owner prioritized calmer screens on 2026-09-05.
- Every placed object gets ground-cover or a contact shadow ellipse touching its
  base. **Nothing floats.**
- The interactive zone keeps a clear margin: no set dressing within ~15% of the
  active card, tile or glyph. Density frames the subject, never competes with it.
- Repeated props exist in **3 sizes** with ±6% lightness/hue jitter.
- Ground is never one flat fill across more than ~40% of the width — band it.

## 6. Cast: proportions & charm
- Blob: the dome **is** the body, head:body ≈ 1:1. Eyes 22–26% of body width
  each, pupils 42–46% of eye, spacing 0.9–1.1× eye width, ±3° outward tilt.
- Silhouette rule: every character readable as a black shape at 64px.
- SVG node budget: rigged pet ≤ 120, creature/sticker ≤ 25, prop ≤ 25, scenery mass ≤ 8.
  *Raised by the owner 2026-09-30 (was pet ≤ 40, prop ≤ 12): a pet that tracks,
  reaches and holds props needs separate pivot groups for head, ears, arms and
  pupils plus per-part ramps, which cannot fit in 40. Shared `<defs>` (gradients,
  filters, clip paths) do not count toward the budget; drawn nodes do. Budgets
  are ceilings, not targets.*
- **Charm comes from three levers only** (locked this interview):
  1. **Expression range** — minimum 6 face states: neutral, curious, delighted,
     sleepy, proud, thinking. Real eyebrow/mouth/pupil variation, not recolours.
  2. **Secondary motion** — sprout, cheeks and feet lag the body by 60–120ms.
     This is the difference between animated and alive.
  3. **Costume/accessory variety** earned through play.

## 7. Ban-list (universal — extend, never trim)
1. No hex codes outside §2. Need a new color? Amend the bible first.
2. No pure white or pure black anywhere.
3. Every material is a ramp (≥3 shades), not a single color.
4. No default/white/black outlines. If outlines exist, §2 defines them (darkened fill).
5. Nothing on bare ground (see §5 base treatment).
6. No lone props — clusters from the grammar or nothing.
7. No uniform copies — 3 sizes + jitter.
8. Post/lighting stack ON before judging any art.
9. Use restrained idle motion where it supports attention; reduced motion may keep the entire scene still.
10. No screenshot, no opinion — art may not be called done unseen.

Project extensions (from this interview's pain points):
11. **No cold or grey contours, ever** — including a darker shade of the object's
    own fill. One warm ink family (§3).
12. **No stroke width outside `1.6 / 2.4 / 3 / 4 / 6 / 8`.**
13. **No contours on scenery masses** (§3) — that flatness is what reads as sticker art.
14. **No mid-tone mush** — the three value tiers in §4 are not optional.
15. **No second light pool.** One warm glow per screen marks one next action.

## 8. Acceptance checklist (reviews grade against THIS)
- [ ] Only §2 hexes / §2 HSL bands present (validator clean)
- [ ] Contour law obeyed: touchable = chunky, scenery = none
- [ ] Every shape >24px shows a ramp, not a flat fill
- [ ] Three value tiers present; scenery `S ≤ 60%`; cast is the most saturated thing
- [ ] Exactly one warm light pool, on the next action
- [ ] Scenery clusters frame a clear learning zone; nothing floating; varied prop sizes
- [ ] Silhouette test passes at 64px; node budgets respected
- [ ] Restrained idle/secondary motion where useful; reduced motion remains fully usable
- [ ] Screenshots attached (map, meet card, one mini-game) at tablet size
- [ ] Gut test: passes as a Toca Life World screenshot

## 9. Known debt against this bible
Measured baseline from `node scripts/check-palette.mjs` on the day the bible
landed — recorded so reviews don't rediscover it and so progress is countable:

- **141 distinct off-palette hexes, 296 uses** (ban 1). Biggest offenders:
  `#fff` ×37, `#ffc22e` ×13, `#ffd23e` ×12, `#54c6ff` ×9, `#5cc23e` ×8.
  *Up from 130/280 on 2026-07-25: the twelve new stickers added 13 fills. They
  obey the enforced rules — contour law and stroke scale (off-scale widths held
  at 15, none of them new) — but their fills are picked, not ramped, so they join
  the same debt every other fill is in.*
- **37 pure-white uses** (ban 2) — nudge to `#fffdf7`.
- **15 off-scale stroke widths** across `1.4 / 2.5 / 10 / 13 / 17`, all in
  `LettersGame.js` and `MiniGames.js`. `LettersArt.js` is already clean on widths.
- ~~Scenery masses (hills) still carry contours~~ — **fixed in review 1**: the
  three full-width hill bands are now unstroked and separate by value alone.
- Still contoured against §3: the **cloud group** (group-level stroke, so the
  first audit query missed it) plus three unnamed scenery groups (bushes, grass,
  flowers). Clouds are masses and should lose it; the small props may keep
  `1.6/2.4` under the amended §3.
- ~~Value range is compressed~~ — **resolved, and the original grade was wrong.**
  Measured on the composed frame the build sits at **26.5 / 27.2 / 7.1**, clearing
  8 / 12 / 5. The earlier 4.0 / 20.7 / 4.4 came from sampling the backdrop SVG in
  isolation, which excludes the CSS sky and every cream surface. I cannot claim the
  ramp work caused the pass — it likely passed before. What the ramps did fix is
  measurable separately: the backdrop's own dead-band share fell from **71% → 54%**
  and the ground planes now read with depth.
- Ground planes and trees are ramped (§4, ban 3). **Still flat single fills:** map
  stop faces, the meet/prompt cards, tiles, pet bodies, stickers.
- Most fills are single flat colours, not ramps — violates ban 3.
- Scene density is ~3 props per screen, well under the 6–10 in §5.
- Only one warm light pool exists (the map's current-stop halo); other screens
  have none.

Turn on `--strict` in CI once the hex and width rows reach zero. The contour law
(§3) and the value tiers (§4) are the two highest-value items — they are what the
Toca comparison actually turned on.

## Live animal port — owner direction 2026-09-05

Lumi, Mina and Rafi reuse the approved prototype anatomy and wardrobe palette as a bounded exception to the older blob-only and palette rules. Keep their live styles scoped. Celebrations retain visible pupils, with no opaque lid covering the eyes. Existing pets remain selectable.

## World map usability — 2026-09-06

Child navigation is wordless: use action pictures and accessible names, not visible written labels. Preserve the established sky, hills and garden scenery; refine assets rather than covering the world with flat UI. No child-facing button exits Letter Garden. Live SVG glyph bounds govern card fit after font loading.

## Native SVG ownership — next-major local package

- `LettersMapArt.js` owns decorative home-trail terrain banks and biome
  landmarks. It may provide native SVG scenery and material ramps; it does not
  own world IDs, unlocks, stars, flowers or saved progress.
- `LettersActivityArt.js` owns the quiet native SVG scenery layer for the pairs,
  catch, workbench and parade families. Live glyphs, prompts, hit targets and
  game state remain in the activity/game modules.
- Home landmarks and activity scenery must stay behind the learning zone. Keep
  the current-stop warm pool, star row, flower growth and pet marker inside the
  map's reserved safe zones; scenery must never overlap those controls or become
  a second destination cue.
- These ownership notes describe local implementation boundaries only. Visual
  browser review and final qualification remain pending.

## Home landscape continuity — 2026-09-16

- The home journey is one continuous landscape in scroll space. A chapter may
  change the planting and landmarks, but cannot restart a full-width ground slab,
  waterline or horizon. Do not mirror disconnected river slices at each stop.
- Draw shorelines across chapter boundaries with shared endpoints and tangents.
  Blend habitat materials through overlapping irregular clearings; keep the
  trail, water and land in the same perspective and coordinate system.
- Scenery continues behind the floating home controls. Protect their readability
  and keep the current stop, stars and pet clear in portrait and short landscape.
  Decorative progress plants must stay within the visible map, not at -2/102%.
- Judge several adjacent chapters in the composed scrolling view, including a
  habitat boundary and day/night, rather than reviewing each island in isolation.

## Shared art alignment — 2026-09-18

- Activity presenters have one layout owner, `letters-composition.css`. Scene
  styles may not independently resize the pet, prompt or progress row. Arabic
  prompt alignment uses the computed font size and is remeasured on font load
  and viewport resize; a hard-coded 38 px measurement is not a fit contract.
- Stretchable scenery planes and fixed-proportion props are separate SVGs.
  `preserveAspectRatio="none"` is for broad terrain/material planes, never fruit,
  hangers, pencils, paper rolls, characters or lettering.
- Room furniture and its pet share one aspect-ratio frame and a common ground
  reference. An SVG's box being centered does not prove the feet are grounded.
  Check actual feet/shadows on the composed floor, including a second species.
- Reserve the bottom prop strip outside Build's letter trays. Validate the
  smallest portrait and short landscape, not just a single phone screenshot.
- Reward scenery uses one ground plane. The Boat landmark may suppress its own
  terrain when it is placed on the shared celebration clearing.

## Potting-table play — owner direction, 2026-09-25

- Dot Garden is a place to experiment, then repair and recall. Use a warm wooden
  potting table, a paper letter label, and grounded seedling/tool clusters at the
  edges. Preserve the outdoor garden and pond behind it.
- Dot patterns are movable seeds. Full Arabic letters use fitted live type, never
  distorted artwork. Only already-taught members of the same explicit body family
  may appear in exploration. Playful exploration does not award recognition credit.
- The paper label and movable seeds carry strong contours; broad timber/ground
  planes use value changes. Use existing palette ramps and fixed-proportion props.
- A touch changes the object immediately. A short settle may acknowledge it; no
  repeated bounce, compulsory wait or new success currency. Reduced motion uses
  the same states without movement. Reserve controls/glyph margins at phone size.

## Picnic delivery — 2026-09-28

- Feed uses one selected friend, a grounded cloth, paper packets and the orchard
  basket material across chapters. Prompt alignment belongs to composition;
  the picnic playfield layout belongs to `letters-picnic.css`. Remove superseded
  family layout rules instead of accumulating a second conflicting owner.
- Layer received packets between the basket opening and rim. Keep their live
  Arabic ink above the rim and below the friend's face at the smallest viewport.
- A completed delivery stays visible for replay and child-led continuation.
  Landing callbacks are decorative and round-bound; they must not advance,
  score, or interrupt replay after the child presses Next.

## Pond play — 2026-09-28

- `letters-pond.css` owns Pond's bank, water field, floating-card geometry and
  result dock; shared composition still owns the presenter. Retire superseded
  Pond layout rules when changing this family.
- Water planes may stretch, but lily leaves and their contact ripples retain
  their proportions. Keep the existing shoreline boat, reeds and learning ink.
- All answer choices appear immediately and stay within reach while a child
  thinks. Later lessons may bob gently; success never makes choices race away.
- A found packet stays visible until the child's Next action. Reserve space for
  its replay dock, including after rotation. On short landscape screens the
  dock sits beside the water and choices use one row.

## Prompt ink and scene depth — 2026-09-28

- Prompt Arabic uses a bounded live SVG text frame, including vowel marks and
  descenders. Do not translate an HTML line box using Canvas font-box metrics;
  the two baselines disagree. Fit the actual ink at the current CSS size and
  font weight, retaining a safety inset. Refit on font load, resize and reveal.
- Compact presenter rows grow to the fitted ink height. A fixed row must not
  push a word above the bubble or viewport, or shrink the word unnecessarily.
- The pond's near shaded bank and the boat's foreground grass provide the dark
  value plane. Preserve their material ramps and open learning zone. Night
  keeps a lit paper rim against the darker sky; do not dim all surfaces equally.

## Drawing coordinates — 2026-09-28

- Drawing helpers share the canvas backing frame and its `contain` alignment.
  Do not place a missed-dot hint using original pixel coordinates in a resized
  CSS box. Hint pulses change opacity only, preserving their anchor. Reduced
  motion keeps the same guidance without a pulse.
- Landscape Trace reserves an in-flow presenter above its drawing board. The
  shared composition stylesheet owns that presenter; a palette layout must not
  move the board underneath the pet or prompt.

## Work surfaces and feedback — 2026-09-28

- `letters-drawing.css` owns Trace's folio, paper, clips and tool positions.
  Boat wrappers must not add a competing seam or board treatment. Colours are
  recognisable pencils, with the same 44px minimum hit targets and saved-pet ink.
- Picnic fabric keeps its folded hem and a recessed packet tray. Keep the tray
  under replay/Next after delivery so feedback remains attached to the same toy.
- The joinery mat has one fixed frame. Reserve a front strip for props during
  assembly and keep the completed word/Next in its centre. Props may cover an
  empty mat corner, never letter ink, slots or tray controls.
- A correction is part of the learning layout. In short landscape, Build's
  comparison row takes real space above the desk instead of covering its slots.
  Verify the wrong-answer state as well as the clean first and success screens.

## Orchard touch and contact — 2026-09-29

- Matching trays share the folio/workbench's lit green cloth, recessed shade and
  warm wooden rim. Keep live cards legible in the small six-card arrangement.
- A receiving highlight marks any reachable partner, not only the correct one.
  Empty-space releases and cancelled gestures never report a wrong answer.
- Catch collision follows the rendered basket opening and the fruit's body,
  including after rotation. Paper fruit can also be tapped; motor misses do not
  become learning mistakes. The stationary delivery destination stays still on
  a wrong answer.
- Hold the harvest on its grounded clearing, with replay on the fruit and Next
  beside it. Basket and front rim share the same responsive anchor. Night changes
  orchard air without dimming the learning ink or basket.


## Cabinet and challenge controls — 2026-09-29

- Burst reuses the matching seed tray. Balance four choices as 2×2 and center
  the last row of five. Keep the last-found card in a small inert pocket, apart
  from the active answer grid. Its flight is decorative: it cannot delay the
  next prompt, affect the clock, or award anything. Pause and teardown cancel it.
- Parade's cabinet lining has a shaded recess and a warm timber apron. Form
  folders can be tapped or placed onto the large display. A missed drop is
  exploration, not a wrong answer. Clear every drag and flight on a phase change.
- Enlarged contextual forms retain live Arabic ink with a paper-safe inset.
  Never shrink connected forms merely because connection strokes add characters.
  Exploration remains separate from the explicit recognition step.
- `letters-craft.css` owns both activity layouts. Landscape retry hints must
  leave room for the cabinet; old playfield minimum heights may not crop it.
  Standard activity results place controls beside the clearing in short
  landscape. The Boat journey retains its own established result composition.

## Welcoming light and shared rooms — 2026-09-30

- Night keeps grass recognisably green. Change the sky, water and selected
  material ramps instead of desaturating an entire landscape or darkening all
  artwork. Keep large grass planes in the middle foliage values; the darkest
  green belongs to limited banks, recesses and contact shadows. Owner direction
  prioritises colourful, readable surroundings at every time of day.
- Reward habitats suppress their separate terrain when placed on a shared
  clearing. Planters, pet feet and mascot feet use one fixed-proportion frame;
  only the surrounding ground may stretch. Keep that terrain behind every
  return, replay and reward control, including in short landscape.
- The wardrobe uses a shaded alcove and a grounded timber shelf. Its picture
  tabs, colours and earned accessories retain their existing behaviour. Check
  both the original blob and animal cast against the floor.

## Flat cast — owner direction 2026-09-30

- Pets stay **flat**: solid fills, no gradients, no cast-shadow layers between
  body parts, no grain or texture filters. A volumetric/paper-material Mina was
  built and rejected because modelling the form made her less cute. This
  overrides the §4 ">24px uses a ramp" rule for the cast only; scenery ramps stand.
- Character life comes from motion (rig, gaze, reach, squash, secondary lag),
  not from rendering.
- Still open, judged on flat art: the chunky ink contour (§3) and one solid
  flat highlight shape per mass ("flat shine").

## Participating pet — update 1, 2026-09-30

- `LettersPetRig.js` owns companion motion: gaze, head turn, ear lag, arm
  reach, hop, inspect, ponder and wave. It writes transforms only to
  `data-rig` wrapper groups, so existing CSS poses keep working underneath.
  It never decides answers, scores, rewards or progress.
- The pet looks at and reaches for only what the child touched or holds:
  their pick, their pen, their delivery. Never the correct choice.
- Head-worn items (headwear, glasses, bow, flower) live inside the head pivot
  and turn with it; body items stay on the body.
- Animals carry the flat ink contour (`.ink`, 6) on silhouette parts only.
  Faces, pads and inner ears stay unoutlined.
- Propagated to every chapter on 2026-10-01 after the Boat review. Pond,
  Trace and Feed keep hand-written moments; every other activity reacts
  through the shared learning report (correct → hop then look at the child's
  pick; miss → look then "hmm") and a stage touch hook (follow what is held).
  Stars and party screens animate the pet in every chapter.

## Pet life and personalities — 2026-10-01

- Blob pets use the same warm ink outline (`INK`, 3 body / 2.4 feet) as the
  animals. One outline family for the whole cast.
- Each species keeps one recognisable celebration and idle fidget: Mina
  double-bounce and ear twitch, Rafi stomp and sway, Lumi wing-flap and head
  bob, blob squish and wobble. New species must declare a `style` in
  `LettersPetRig.js` rather than reuse another's.
- The pet is alive on hatch, wardrobe, map, meet, activity, practice and
  reward screens. Timed Burst keeps it a quiet watcher.

## Overworld travel and toys — update 2, 2026-10-01

- The map pet waits beside the stop the child last entered (a new learner
  finds it at the next lesson). Tapping another unlocked stop walks it along
  the drawn trail in its species gait, then enters; tapping where it waits,
  or the destination again mid-walk, enters at once. Long trips start two
  stops away. Reduced motion skips the walk. Locked stops stay locked.
- `LettersMapArt.play` owns the toys: orchard shake (fruit drops and regrows),
  reed leaf lift (ladybug beneath), lantern glow with rising fireflies; the
  Boat chapter's paper boat sails out and back. Toys are decorative buttons:
  they never save, score or reward, and always return to rest.
- Toys sit opposite their stop and must never take a tap from a stop, star or
  control (verified with elementFromPoint across all 22 stops).

## Brooks, bridges and the waterwheel — update 2, 2026-10-01

- Brooks (`LettersMapArt.brooks`) join the habitats: one at every habitat
  change and a rhythm brook in long single-habitat stretches, so the first
  bridge appears by chapter 3. Each brook runs from a small spring, level
  across the trail, then falls toward the river. Brooks are filled value
  bands (no wide strokes, no contour) like every other scenery mass.
- A footbridge (`bridge()`) is laid along the trail's own tangent at every
  brook crossing: small prop, ink 2.4, rails along the path.
- One waterwheel turns slowly (14 s) where a brook meets the river; a tap
  spins it with a splash. It is seated after layout settles at the first
  brook mouth whose drawn area clears every stop, star plaque, landmark
  drawing and plant, and fades in. Reduced motion keeps it still.

## Connected adventures, Water Garden, playable garden — 2026-10-01

- Chapter stories (`LettersJourney` table) follow each chapter's existing game
  order: Pop→Trace→Feed picnic, Pairs→Trace→Pop seed bed (sprouts → the
  child's own signs → blooms), Pop→Build→Feed parcels (the built word labels
  the packet). Phase comes only from completed steps. Finished chapters keep a
  keepsake at their map stop, derived from saved progress.
- Water Garden is drawn as one SVG with real buttons over it. Water is an 8px
  stroke inside 14px troughs (on-scale widths). Gate letters are live fitted
  Arabic on paper tags; the listening prompt hides the letter until a miss.
- Catch shows a slot per fruit inside the basket's own drawing and fills it.
  Build sends a parcel copy of each finished word to a small shelf on the
  bench rim; the lesson never waits for it.
- In the decorating garden, placed rewards are toys. Tapping toy after toy
  plays them and never swaps them; moves go to empty spaces or come from the
  tray. Keepsakes and the child's saved drawings (as signs) join the shelf.

## Later-chapter stories, bend and basket — 2026-10-01

- All 22 chapters now have a story. The remaining 11 use four projects whose
  steps follow each chapter's own activity order: a lantern string (join-1,
  join-2), a fruit tree (fatha, kasra-damma, standing, sukoon), seed jars
  (long-sounds, shaddah-mix, decode-4) and a raft (words-2, decode). Each scene
  is a still frame per completed step; items or drawings label the result
  (lanterns, fruit, jar labels, raft planks — right to left).
- These projects are presentation only. They do not set the reference-journey
  flag, so those chapters keep their moving Pop and Catch.
- Water Garden bend: a turning spout disc with an orange knob and a curved
  arrow. Down feeds the flower; turned right it spills into the puddle. It
  rocks once when it first matters (skipped under reduced motion).
- Catch: the caught fruit is held above the basket, not over it, so the
  filling pile (bigger fruit, dashed empty slots) stays visible.

## Pond jetty, picnic blanket, watering can — 2026-10-01

- Pond: a wooden jetty on the far shore has one dashed slot per round. After a
  find, Continue (or a second tap on the found packet, after a 500 ms guard
  against double taps) sails it to the jetty as a page-level ghost; the next
  round starts at once. Docking never reports. The two-row grid now starts at
  17% so choices sit below the jetty.
- Garden: the picnic blanket (from any finished picnic chapter) and watering
  can (from any finished seed-bed chapter) are earned props, not purchases.
  Tapping the blanket brings the pet over to sit until it is tapped or the
  garden is rearranged. The can flies to up to three placed flower patches or
  seed/fruit keepsakes, tips spout-down and pours; with none placed it waters
  the grass.

## Boat ride and the map spot — 2026-10-01

- Garden boat: tapping it brings the pet over; it shrinks to boat size, sits
  in the hull and sails the boat's little loop with it (both move by the same
  pixels), cheers, then walks home. Reduced motion keeps the look-and-cheer.
- Map: the chapter the pet last walked to is saved (`map-pet`, a plain chapter
  id) so it waits there after a reload; a locked or unknown chapter falls back
  to the current lesson.

## Open art items — 2026-10-01

- Stickers: camel, hoopoe, elephant, whale, turtle and ant redrawn on the
  locked palette with scale strokes, centred inside the backing and checked at
  52px and 150px. Cat, crow, spider and snake already read well and are kept.
  The older stickers still use the muted pre-palette colours, so the album is
  mid-migration; the palette cleanup pass finishes it.
- Hatch: the egg is flat with the ink contour (no gradient, no shine) and sits
  in a woven nest drawn with it. Taps: fissure; then a second fissure and a
  chip with warm light and the pet's eyes peeking out; then the hatch. Only the
  shell wobbles. The hatch island no longer draws its own grey dish.
- Rewards: a garden with no growth shows three seedlings in dark soil instead
  of a bare planter; the podium planter has a dark wood face and a balancing
  foreground clump. In short landscape the reward scene uses its whole column
  (up to 400px), which takes that frame from 3.87% to 5.56% dark (target 5%).
- Later regions' reward habitats reuse their map landmark (orchard tree,
  reeds, lantern, peaks, river landing with water) instead of the older muted
  miniatures, so the reward shows the place the child walked to.

## Palette pass 2, stroke scale and chapter lands — 2026-10-01
- **Palette:** every hex outside the pet cast files is now in §2. Two subject
  ramps were added (Sage, Lavender) for the fruit stickers and the map check-up
  button; sticker contours that were tinted teal or slate now use the Ink or
  Sky-day ramp. The cast files (`LettersAnimalArt.js`, `letters-animals.css`)
  are untouched pending the owner's call.
- **Stroke scale:** every contour outside the cast is on `1.6 / 2.4 / 3 / 4 / 6 / 8`.
  A **ribbon** — a stroke used as a filled band (map trail, snake body, river,
  garden arch) — is a mass, not a contour: mark it `data-ribbon` and its width
  is free. Never use `data-ribbon` to excuse a real outline.
- **Chapter lands:** `backdrop(phase, biome)` dresses the shared activity
  backdrop with the chapter's land from the map — orchard fruit trees and a far
  tree row, a lagoon between the middle and near bands with reeds and a lily
  pad, night-garden lanterns (lit only at night), snowy peaks behind the far
  hills, and a river ribbon with sandy banks. Only activity screens take a land;
  home, map and menus stay meadow. Land art lives in the outer fifth or below
  the ridge line; the centre belongs to the cards, and phone portrait may crop
  the edge props (the bands and peaks still show).

## Sky and light, icons and controls, map stops — 2026-10-01
- **No scenery filter.** `.art-scenery-tint` used to saturate every scene ×1.28
  and rotate hues by up to 65° per chapter, so the locked palette never reached
  the screen. It is retired; chapter identity comes from the land art.
- **Sky lights glow, they don't cast shadows.** Sun: two soft `#ffe49a` light
  rings. Moon: a `#6064a0` halo. Night stars are cream four-point glints and
  dots — never the gold five-point star, which means "earned". Clouds are
  far-layer masses: no contour, a lit top over a cooler underside (warm
  `#ffa798` at sunset).
- **Icons:** one 64-unit grid, live area 8–56, optical centre 32,32, round
  joins and caps everywhere. Two weights by role: action glyphs (next, check,
  arrow) 8, other linework 6; solids carry a 4-unit self-colour stroke to soften
  corners. Muted sound is wordless: waves hide, an X shows.
- **Home** is the one filled round control (`.lg-home-btn`, foliage shadow
  ramp) and never shares a class with the map screen.
- **Map stops:** locked stops recede by size and muted warm colour only — a
  paper inset holding a seed, no opacity. Mastery plants grow through four
  stages that each read alone at 46px (seed in soil, one-leaf sprout, closed
  bud, open flower), in the warm ink; thresholds unchanged.

## Tools, effects, album and stamps — 2026-10-01
- **Undo** has its own icon (a U-turn back to the left) on every undo button.
  The replay circle only ever means "hear it again" or "play again".
- **Try again** is a small wobble (≤4px, ≤1.5°), never a head-shake "no";
  reduced motion drops it and the sound remains. Confetti is one garden shape
  family: petals and round seeds. Drag sparkles obey the in-app motion switch.
- **Album:** an uncollected sticker shows its own motif as a flat `#c9bda4`
  silhouette on paper, so the page shows what is still to find.
- **Stamp calendar:** today keeps its gold once stamped; future days recede by
  a dashed edge and lighter digits, never opacity; past unplayed days stay plain
  paper — there is no "missed" mark (no guilt pressure).

## Focus, wardrobe and map header — 2026-10-01
- **Focus:** one keyboard-focus ring everywhere — `outline: 4px solid
  var(--lg-focus)` (accent-warm), or `var(--lg-focus-on-dark)` (pale gold) on
  dark boards. Offsets may follow each control's shape; colour and weight may not.
- **Wardrobe:** items not yet owned show in full colour; the gold star price
  chip carries "not yours yet". (Reverses the earlier grey-out: a grey hat on a
  grey pet hid the thing to save up for.) Cards 104px wide with 90px art.
- **Map header, phone portrait (≥360px):** the activity tray sits in the top
  bar's empty left side, so the header is two rows, not three. Below 360px it
  keeps its own row.
- Checked and left alone: the result and party screens (habitat scene, full
  star tray) and the prompt bubble (no overflow on long words).

## Sound world, living lands, meeting a letter — 2026-10-01
- **Sound world** (`LettersSound`): 18 material cues synthesized from the
  shared engine's tone/noise (splash, drip, pour, ripple, dock, creak, rustle,
  snip, thread, clink, turn, pop, boing, chime, thud, crack, tryon, glow), a
  short happy call per pet species, and a quiet bed per land (filtered-noise
  floor plus occasional birds, bees, plips or crickets). Beds play under
  activity screens and the child's garden, stop while the page is hidden, and
  sit under speech through the same master gain. Cue gains ≤ 0.07, beds ≤
  0.015. `correct`, `wrong` and reward cues keep their meanings; toys and
  crafts never use them.
- **Living lands** (`landLife`): each land has a few creatures by day and by
  night — butterflies, a bee and falling petals, a jumping fish and dragonfly,
  gliding birds, a leaf boat on the river, moths at the lanterns, fireflies.
  They live in the outer fifth, the sky corners or the water bands, take no
  pointer events, and are removed entirely under reduced motion. The garden
  backdrop carries them in its own unstretched layer.
- **Meeting a letter:** the presenter creature is replaced by a paper garden
  sign (`letterSign`) so the letter is the hero (118px for a single letter).
  On reveal the ink wipes open in writing direction — right to left for
  Arabic — with a reed pen along the edge; reduced motion shows it inked. The
  progress dots become a trail of seed tags carrying the letters already met;
  letters still to come stay unopened. The "your turn" cue is a drawn bubble,
  not an emoji.

## Pack ceremony, land gates, material bursts — 2026-10-01
- **Sticker pack ceremony:** spending stars and saving the sticker happen
  first; then a ceremony dialog: drag along the perforation (or tap three
  times; once under reduced motion) to tear, the top flies off, the sticker
  rises and flips from its backing to its face, the pet calls, and the child
  places it — it flies into its waiting silhouette in the album. Escape at any
  point still lands it.
- **Land gates:** a banner pole on the bank beside each land-boundary bridge,
  banner hanging over the trail with the new land's sign (fruit, reeds and
  water, moon, peak, waves). Rolled up until the land is reached. The first
  time a land opens, the map glides to its pole, the banner unfurls with the
  arrival chord and the pet looks. Remembered in `lands-seen`. (An arch over
  the trail was tried first; at the phone's 170px stop spacing it hid behind
  the next stop, so the gate is a pole beside the bridge.)
- **Material bursts:** right answers burst in the activity's material — pond
  water (drops + ripple ring), wood chips, seeds, glass glints or petals — with
  a soft matching cue under the streak melody. A craft chapter's material
  wins (garland petals, harvest seeds, jars glints, raft wood). Golden reward
  bursts are unchanged.

## Back on the map, weather, My letters, playroom, land boards — 2026-10-01
- **Back on the map:** a newly finished chapter is remembered for the next map
  visit, which plays once: scroll to the stop, the keepsake drops in, the
  mastery plant grows, the next stop pops open and the pet walks there (and
  stays — it never enters). Any new-land arrival plays after.
- **Weather:** one per calendar day from the date (clear 40%, breezy, drizzle,
  rainbow 20% each; never a rainbow at night). It lives behind each screen's
  content (`.lg-screen` isolates) and over the map under every control. Drizzle
  adds a soft rain layer to the soundscape. Reduced motion hides rain and
  leaves; the rainbow is still.
- **My letters:** a second album tab. Every letter met so far, as small garden
  signs grouped by land with the land's sign and plant; tap to hear. Lands not
  reached are an unopened packet — nothing ahead is shown. Read-only.
- **Playroom:** a ball, a drum and a bubble wand in the pet's room. Ball rolls
  and the pet chases; three quick drum beats and the pet dances; bubbles rise
  and pop. No stars, no needs, nothing saved. Toys ≥ 48px.
- **Land boards:** the shared activity board reads `--lg-board`; each land sets
  its material — orchard crate planks, lagoon shell tiles, lantern-lit night
  board, cracked stone slab, woven reed mat. Mid-to-dark so tiles keep contrast.

## Major versions v3–v5 — 2026-10-01
See `docs/letter-garden/RELEASES.md`. Art rules they add:
- **Handwriting model** (`LettersStrokes`): 100×100 box, bodies in y 16–86,
  harakat above (2–14) and below (88–98). The guided-trace guide is drawn from
  the model (paper-white road with a `#c9bda4` edge), so guide and path never
  disagree. Meem's tail drops from the left and heh carries its inner curl — the
  numerals ٩ and ٥ are the shapes to avoid.
- **Tricks** animate the pet's drawing, never the element that centres it.
- **Sticker stand**: what is offered is always shown face up.

## Letter Friends — v26, 2026-10-02
- Each friend's body is the letter, drawn from `LettersStrokes` geometry as a
  14-unit ink ribbon under an 8-unit fill ribbon (`data-ribbon`: a stroke used
  as a filled mass, ART §3), with dots as ink-ringed discs. Features (heads,
  tails, ears, water, fruit) sit on a back and a front layer around it.
- Flat cast rules apply: solid fills, one flat shine at most, chunky ink on the
  friend (it is touchable), thin 1.6/2.4 ink on small features.
- Faces belong to friends, never to letters. A friend's features may sit on a
  letter's dots (the cat's ears are ق's dots) but never redraw the letter.
- "Plain" turns the fill ribbon to ink and hides the dress, so the bare letter
  is always the same chunky letter the child traces.
- Today's Walk: stones are touchable discs (paper with 4 ink); the next stone
  is ringed in accent-warm; walked stones go foliage-light with a check.
