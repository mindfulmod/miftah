# Letter Garden design tokens

Locked 2026-07-24. This exists because the game had drifted into looking like a
prototype despite the work in it, and the cause was measurable rather than
aesthetic: **109 loose hex values and 19 different stroke widths in the art
layer**, with every creature outlining itself in a darker shade of its own fill.
Blue fish had blue contours, the elephant grey-purple, the crow cold navy. In
flat vector art the contour is what tells the eye "one set, drawn by one hand",
so that single inconsistency undid the cohesion of everything else.

The CSS layer already had a real token system (`--lg-ink`, `--lg-outline`, three
radii, three easings) and largely honoured it. The art layer bypassed it
entirely. These tokens close that gap.

Source of truth: the `INKS`, `STROKE` and `GOLD` constants at the top of
`src/letters/LettersArt.js`, and the `:root` block in `styles/letters.css`.

## The contour rule

**One ink family outlines everything. A fill never picks its own outline.**

| Token | Value | Use |
|---|---|---|
| `INKS.hero` | `#3b2a19` | Mascot and hero silhouettes — the darkest thing on screen |
| `INKS.base` | `#4a3620` | **The** contour: creatures, cards, props, UI |
| `INKS.soft` | `#7c5c3a` | Pale or delicate pieces that `base` would overpower |
| `INKS.faint` | `#a89478` | Recessive by design — locked stops, seeds, "not yet" |
| `INKS.night` | `#524f66` | Scenery only, after dark |

Banned: cold contours of any kind. Cool greys, navies, lavenders and
saturated fill-matched outlines were the specific thing removed in this pass.
A blue fish gets an espresso outline.

Gold is a **motif, not a contour** — coin rims, stars, treasure, the sun, the
golden egg: `GOLD.deep #b8781a`, `GOLD.mid #c47f12`, `GOLD.light #d8ab4e`,
`GOLD.glow #fff3c2`.

White (`#fff`) remains valid as a *highlight*, never as a contour.

## Contour weight

`STROKE = { hair: 1.6, fine: 2.4, base: 3, bold: 4, hero: 6, mascot: 8 }`

Snapped from the 19 ad-hoc widths previously in use. Nothing outside this set
should appear in new art. Pick by the object's role, not by trial and error.

## Duration scale

Ambient loops sit deliberately **above** this scale and keep their own long,
hand-tuned periods and easings — a 74s cloud drift is not a UI transition.

| Token | Value | Use |
|---|---|---|
| `--lg-t-tick` | 90ms | Micro-feedback |
| `--lg-t-tap` | 140ms | Press, recoil, hover |
| `--lg-t-quick` | 220ms | Small state change |
| `--lg-t-move` | 320ms | Something travels |
| `--lg-t-enter` | 460ms | An element arrives |
| `--lg-t-arrive` | 620ms | A screen or card lands |
| `--lg-t-beat` | 900ms | A deliberate pause for effect |

Easings stay as they were: `--lg-out` for UI moves, `--lg-spring` and
`--lg-spring-big` for anything that should feel physical. Raw `ease-in-out` and
`linear` are acceptable **only** on ambient loops, where they are correct.

## Reduced motion

Handled by one rule rather than a guard per selector, because 30 loops had
outrun 9 hand-written guards. Every looping animation stops after a single pass;
one-shot feedback is untouched, since a child still needs to see a tile answer a
tap. New animations are covered automatically.

## What this pass deliberately did NOT change

Honest scoping, so the next person doesn't re-litigate it:

- **Fills.** Many of the 109 colours are legitimately distinct character, biome
  and accent colours. The problem was never "109 colours exist", it was that
  contours were inconsistent. Only one fill was touched: the elephant, which was
  the last cold fill in an otherwise warm set.
- **Elevation.** Investigated and found to be fine. There are 10 hand-rolled
  `box-shadow` values and they are the intentional per-component pressable edge
  (gold, purple, hue-driven), which is correct for this language. An earlier
  count of "27" was a bad regex that also matched token-based declarations.
- **HUD safe areas.** Investigated and found to be fine. At the scroll extreme
  the topmost map stop clears the floating topbar with room to spare; stops
  passing under it mid-scroll is intended behaviour, not occlusion.
