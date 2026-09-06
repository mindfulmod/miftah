# Letter Garden Environment Philosophy

## Purpose

The environment should make a child curious before an activity and calm once learning begins. Wonder comes from meaningful transformation and memorable places, not from filling every empty area.

## Reference classification

The current live Letter Garden is the production density reference. Its play scenes use broad sky, two or three low-detail landscape bands, and a small number of distant silhouettes. The picturebook prototype is the style reference for material, palette, and world identity. The new system keeps the prototype's cut-paper warmth while adopting the live game's restraint.

## The quiet-stage rule

Every learning scene is divided into three attention zones:

1. Learning zone: the target and answers. This receives the darkest ink, brightest cream, and clearest interaction motion.
2. Companion zone: the pet and one repeat-sound control. This supports the task without competing with it.
3. Environment zone: large low-contrast shapes that establish place. It never contains small high-contrast objects near the learning target.

The learning zone must have at least 35 percent uninterrupted visual quiet around it.

## Density budget

During a letter activity:

- Use no more than three large environmental layers: sky, land, and water or ground.
- Use no more than one framing prop, such as a branch, arch, or window edge.
- Use no more than two small decorative motifs across the entire viewport.
- Keep decorative motifs at least 96 CSS pixels from the target and 64 CSS pixels from answer choices.
- Reserve coral, gold, bright cream, and the darkest outline for interactive objects.
- Background outlines are thinner, softer, or lower opacity than gameplay outlines.
- Only one environmental motion system may loop during a question.

During world selection:

- Richness may increase because place recognition is the task.
- Each destination gets one unmistakable silhouette and one supporting detail.
- Empty land and sky between destinations are intentional navigation space.
- Progress decoration appears only around completed and current levels.
- Repeated scatter, equal-detail landmarks, and ornament without interaction are removed.

## Motion hierarchy

- First: the current letter or answer feedback.
- Second: the companion's reaction.
- Third: one slow environmental cue.
- Ambient motion pauses or becomes visually negligible during correctness feedback.
- Reduced-motion mode preserves state changes without looping movement.

## Color hierarchy

- Background: low-to-middle contrast apricot, pistachio, and turquoise masses.
- Learning surface: light cream against the calmer background.
- Current action: one gold or coral accent.
- Completed state: leaf green and small botanical growth.
- Future state: lower saturation and value contrast, never a noisy blur or heavy lock symbol.

## Removal test

Before adding any environmental object, ask:

1. Does it identify the location?
2. Does it communicate progress or interaction?
3. Does it guide the eye toward the task?

If the answer is no to all three, remove it.

## World-selection and growth-state contract

- A selectable letter belongs to a physical object in the landscape; it is not a repeated circular UI badge laid over the scene.
- Completed letters carry one small blossom. The current letter carries one warm pulse. Sleeping letters rest on a closed pair of leaves and never pulse.
- State must remain understandable without relying on opacity alone.
- The current object is the only continuously animated object on the world-selection screen.
- Orchard growth uses five authored stages: sleeping, first leaves, fuller canopy, blossom and fruit, and fully awakened.
- Later stages replace sleeping details and open traversal features. They do not accumulate unlimited flowers, particles, or collectibles.
- A fully awakened scene may add one path change and one ambient-light motif beyond the previous stage.

## Acceptance tests

- A grayscale screenshot still makes the target read first.
- Squinting at the screen leaves no more than five dominant shapes during a lesson.
- The child can find the repeat-sound control and all answers without scanning the background.
- The scene remains recognizable after half of its decorative objects are removed.
- The background never animates more strongly than the current learning action.
