# Live Letter Garden — Boat chapter visual pass, 2026-09-05

The live game remains the foundation. Retain existing pets, curriculum, games and reward economy. Owner-approved Lumi, Mina and Rafi now join the selectable live cast. The earlier mascot exploration below is prototype reference, now also the source for selectable live animal pets; existing pets are preserved.

The Boat chapter uses a quiet paper riverbank, a large sailboat landmark, grouped reeds and three earned flowers. Open space frames a larger letter and expressive existing pet. Warm paper, muted greens and the existing night palette connect introductions, Pop, Trace, Feed and results. Native SVG assets use the established outline family; no generated raster art or external services are needed.

Garden growth derives from existing activity bests and chapter completion, including older saves. It adds no currency or progression requirement. Motion is restrained and optional through system or grown-up reduced-motion settings. Other chapters retain their current art until separately addressed.

# Letter Garden Anchor Mascot Direction

## Product context

- Educational game for early Arabic-letter learning.
- The mascot must read clearly beside a lesson card at phone scale.
- Emotional tone: attentive, warm, gently playful, never frantic or punitive.

## Shape language

- One vertical capsule body, approximately 1.2 heads wide by 1.5 heads tall.
- Three rounded crown peaks and two leaf-shaped wings are the only silhouette cues.
- Eyes occupy 40–46% of body width. Facial detail stays inside the eye mask.
- No dark exterior contour. Use color boundaries and large value blocks.

## Palette

- Body blue: `#557BDC`; body overlay: `#3F61BA`.
- Mask: `#F7F4E8`; beak: `#FFC54A`; lower beak/feet: `#EF8D37`.
- Pupil: `#2E2B32`. No gradients, texture, rim light, or arbitrary highlights.
- Player color changes operate on the body-color family only. Preserve the fixed
  neutral muzzle/mask and species accents so the eyes, mouth, beak, and nose keep
  their contrast at every hue.

## Animation

- Idle movement under 1% of character height with a four-second cycle.
- Listen: one wing lift, pupil turn, and slow attention marks.
- Think: both wings lift to the same height in a mirrored inward pose; pupils move
  upward together and the beak closes. Bilateral states must preserve the vertical
  centerline unless a prop or directional stimulus explains the asymmetry.
- Celebrate: 0.98-second hop with full wing silhouette change, then return.
- Every state remains legible with reduced motion enabled.

## Expression and emotional safety

- Mammal eyes are rounder and slightly lower-set than Lumi's vertical bird eyes.
- Pupils remain broad, centered, and double-highlighted; avoid narrow pupils or
  strong inward gaze that can read as suspicious or overly clever.
- Mina and Rafi do not use a connected eye mask or inward-sloping eyebrow band.
- Neutral faces must read as open, trusting, and ready to help before accessories,
  animation, or lesson context are added.
- Cheek warmth, soft muzzle lobes, and an open rounded smile are preferred over
  smirks, angled brows, or compressed eyelids.

## Hard prohibitions

- No copied Duo silhouette, green brand palette, or exact facial construction.
- No thick outlines, airbrushed shading, gradients, fur strokes, or decorative seams.
- No accessory path may be copied blindly across a species collision zone. Headwear
  receives a fitted species variant; shared eye, neck, and body geometry may reuse a
  path only when the registered anchors and envelope remain identical.

## Family construction rule

The family shares behavioral grammar, not a body template. Keep the eye line,
ground pivot, emotional timing, value hierarchy, and accessory slots consistent.
Build every animal from its real visual logic:

- Lumi: one continuous avian capsule, crown feathers, leaf wings, beak.
- Mina: ear-led vertical rhythm, cheeked head, pear chest, haunches, long feet, tail.
- Rafi: broad rounded-square head, compact ears, shoulder weight, barrel belly,
  planted paws.

A silhouette must remain identifiable when ears, color, and face details are hidden.
Do not solve a new species by recoloring Lumi or swapping only ears and muzzle.

## Approved family anchor

- Lumi neutral pose is the approved character anchor.
- Family canvas: 420 × 470 SVG units; ground pivot `(210,420)`; eye centers
  `(165,180)` and `(255,180)`; neck anchor `(210,290)`; body anchor `(210,340)`.
- New animals preserve registration and behavior while using species-specific head,
  torso, limb, and secondary-motion construction.


### Owner correction — September 6
Preserve the live sky, layered hills, trees and map decorations. Calmer means clearer focus, not removal of the environment. Child navigation uses pictures, with accessible names for adults and assistive technology. Sticker motifs center on their own vector bounds and scale inside responsive cells. Updated activity vignettes, die-cut sticker presentation, pack seams and folded corner, and layered tree silhouettes are the first refreshed families; remaining game props and reward drawings still need individual art passes.

### Full live screen pass — September 6
Shared warm-paper control surfaces and restrained tile bevels now connect all chapters. Garden scenery remains exposed around play areas. Map stars sit on a dedicated light plaque. Results display the existing Boat garden across chapters using saved Boat growth; no additional reward is minted. Home buttons have explicit filled faces. Full-size static stars and stable Garden Pop rows remain legible with reduced motion. See `LETTER_GARDEN_FULL_PASS_20260906.md` for screen coverage and verification limits.

### Calibration awaiting review
The completed map stop now reserves a separate flower bed below its reward plaque. A new five-petal meadow family and matching boat flowers are implemented as the first drawing sample. Pop selects its pond by activity, including the next chapter and Pop results; the boat and reeds have reserved footer space. This is not approval to expand the style to the remaining inventory. See LETTER_GARDEN_CALIBRATION_REVIEW.md and the same-size saved comparisons.

## Shared art foundation — 2026-09-18

The existing live direction continues. Calibration anchors are a paper pencil
pot, tied paper roll, pond lily, garden teaching alcove and shared pet-room floor.
Broad surfaces can resize independently; props retain their proportions. Letter
carriers, owned stickers and the cast remain the strongest nearby shapes.

Activity prompt, presenter and progress layout now belongs to
`styles/letters-composition.css`; activity scenery belongs to
`LettersActivityArt.js`/`letters-activities.css`; pet and teaching furniture
belongs to `LettersRoomArt.js`/`letters-rooms.css`. Keep mechanics outside these
owners. See `../letter-garden/ART_FOUNDATION_REVIEW.md` for screenshots, tests,
recovery and outstanding full-bible debt.


## Potting-table family, 2026-09-25

Owner-requested Animal Crossing inspiration adds purposeful, responsive props to
Letter Garden's existing paper world. Nintendo's [island overview](https://animalcrossing.nintendo.com/new-horizons/explore/)
connects small activities, crafting and decorating; our adaptation is a seed-pattern
workbench with a responsive seedling, not Nintendo characters/assets or a new
curriculum. Existing scenery, pets and the warm contour/material system remain.

The new native family comprises a rounded timber plane (stretchable scenery),
a fixed-proportion seedling and scoop, a paper label and movable dot-pattern tiles.
Light arrives from upper left. Main letters retain fitted live Arabic type.
Scenery stays behind input; palette ramps come from ART.md. The 120×140 prop
frame puts the floor/contact shadow at y=132. Touch targets remain at least 44px
in short landscape and 48px on the checked smallest phone. Broad tabletop planes
are bounded to 640×610px so they cannot expand into a screen-filling vertical slab.

Exploration has one large letter, while the smaller reference returns for repair.
The sprout grows slightly as familiar patterns are explored, never shrinks on undo,
and has no saved mastery/currency meaning. Motion settles once; reduced motion
changes the same states instantly. Review: `docs/letter-garden/POTTING_PLAY_REVIEW.md`.

## Drawing pad and joinery, 2026-09-25

Extend the potting-table material family into the existing games. Garden Paths
uses a bound green pad, three paper levels, a small metal-coloured warm clip and
pencil-shaped colour controls. Its drawings remain real child-made ink; a leaf
stamp acknowledges a finished page without grading handwriting. Only the child
turns the page. Session thumbnails preserve the captured drawing proportions.

Build uses a 720×540 timber plane with a visible apron and legs, floor/contact
shadow at y=526, and a recessed green assembly mat. Pencil pot and tied roll keep
their 120×140 frames and sit near the tabletop's front edge. The playfield is capped
by viewport width, so portrait layouts cannot stretch it into a vertical slab.
Whole-word replay and Next share the existing warm contour/contrast grammar.
Carriers settle for 240ms; reduced motion removes the movement. Original cast,
garden surroundings and curriculum remain. See `../letter-garden/CRAFT_PLAY_REVIEW.md`.


## Joining desk, 2026-09-25

Blend, Fuse and Chain extend Build's original timber anchor. A recessed foliage
mat gives ivory pieces a clear receiving surface; the pencil pot and tied roll
sit on its near edge with fixed frames. Broad table/mat planes may resize, but
props and glyph carriers retain their proportions. Nearby sky and garden remain
visible. The finished shape has a speaker badge, a pictorial separate/join tool,
and one warm Next arrow; optional vowel pieces occupy a distinct shallow tray.

Results stay until the child continues. Changing a supplied vowel changes both
the main creation and the pet's replay bubble. Whole/part Arabic remains live,
optically fitted text. Reduced motion reveals the same result instantly. Stopping
a drag hint must also stop the tile's entry animation, so carrier geometry cannot
jump at release. See `../letter-garden/JOINING_PLAY_REVIEW.md` for composed-frame
screenshots, value measurements and remaining art-bible debt.

## Splitting desk and form cabinet, 2026-09-25

Unfuse extends the same joinery plane with a recessed green mat and larger freed
pieces. Its pictorial split tool, replay badges and orange continuation share
the joining family's materials. The furniture is capped in portrait so the
learning pieces occupy it rather than being lost in empty height.

Parade uses a 720×540 upright timber/paper cabinet, grounded at y=526, with a
recessed green back, three folded doors and a shallow shelf. Each door hints at
its connection edge. Opening reveals the original live Arabic form; a clipped
larger card and a smaller isolated-letter reference support comparison. The
shelf ends below the cards, never across teaching ink. Broad planes resize;
letter carriers and replay controls retain their proportions. Day/night garden
surroundings and the selected pet remain visible. Reduced motion removes the
arrival movement without removing the exploration state. See
`../letter-garden/DISCOVERY_PLAY_REVIEW.md` for actual play and art-review limits.

## Orchard play surfaces, 2026-09-26

Pairs adds a recessed 720×540 seed tray with fixed-proportion pots and small
seedlings. Catch adds a quiet 720×540 orchard plane, edge trees in 150×380
frames, fixed-proportion fruit in 128×150 frames, and a two-layer basket in
180×112 frames so caught fruit can sit behind its rim while the glyph remains
clear. Matching grows seedlings across boards; Catch retains moving fruit and a
child-led continuation. See `../letter-garden/ORCHARD_PLAY_REVIEW.md` for actual
play evidence, composed PNG measurements and remaining review limits. The
measurements show repository-wide value and palette debt; this pass is a local
release candidate pending final publication.

## Picnic delivery family, 2026-09-28

Feed now shares the orchard basket material, with separate rear and rim layers
around the delivered paper packet. Its 720×540 cloth plane has folded edges,
subdued checks, stitching and a ground shadow; the pet, packets and 180×112
basket retain their proportions. This extends the existing native art anchors.
The older green dome and duplicated Feed frame overrides are retired. A single
friend participates across chapters; the prompt remains separate and readable.

Nintendo's [crafting and garden overview](https://animalcrossing.nintendo.com/new-horizons/create/)
informs the use of purposeful everyday objects. The adaptation is a picnic the
child can inspect and replay, with no added currency or care requirement.
See `../letter-garden/PICNIC_PLAY_REVIEW.md` for actual play and remaining limits.
