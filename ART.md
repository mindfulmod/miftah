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
- SVG node budget: pet ≤ 40, creature/sticker ≤ 25, prop ≤ 12, scenery mass ≤ 8.
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
