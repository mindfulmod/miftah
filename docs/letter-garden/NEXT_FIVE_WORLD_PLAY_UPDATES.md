# Letter Garden — next five major world and play updates

Planned September 30, 2026 against local implementation `39ff624`.
Status: recommendations saved at the owner's request; these five updates are
not implemented by the September 30 production release.

## Release direction

Make Letter Garden feel like a place children can play in, with a companion who
participates and activities that visibly change their world. Serve children aged
4–6 who are new to Arabic, through pictorial interactions they can understand
without reading instructions.

The current implementation already has tactile controls, drawing, exploration,
decorating, gradual learning support and the connected Boat adventure. Extend
those foundations rather than rebuilding the game or presenting them as new.
Preserve curriculum and chapter order, existing learning mechanics, pet ownership,
earned rewards and saved progress. Keep gentle untimed defaults, optional timed
Burst, bundled audio and the warm native paper-diorama direction. No parent-page
work, running voice service, unrelated Miftah expansion or new economy.

## 1. A pet that acts alongside the child

Move beyond switching facial expressions into contextual character animation.

- Follow a held object with the eyes, reach toward a delivery, steady the drawing
  board and inspect the child's finished picture.
- Give each species a recognizable walk, anticipation, celebration and gentle
  retry response. Preserve visible eyes and accessory alignment throughout.
- Let children initiate small interactions: wave, offer an object or invite their
  pet to investigate something.
- Keep the pet quietly attentive while the child is choosing an answer. Animate
  the action without revealing the answer or competing with the letter.

Feeding should feel like giving something to a friend; drawing should feel like
making something together. Build shared character animation and prop attachment,
not another general bounce effect.

First implementation slice: the complete Boat entry → Pond → Trace → Feed →
reward → return journey. Extend existing pet rendering and journey events;
species-specific anchors may differ, but lifecycle and action semantics are shared.

Acceptance: actions respond immediately, remain readable at phone size, cancel
cleanly on exit, and preserve tap/keyboard alternatives and reduced motion.
Animations never own scoring, rewards or progression. No guilt, hunger or care
pressure. Review the complete Boat slice before propagation.

## 2. An overworld children can explore

Turn the chapter map into a connected journey while keeping lessons easy to reach.

- Tap a destination and watch the pet walk or sail there; repeat visits can enter
  immediately.
- Add a few substantial interactive landmarks: launch a boat, turn a waterwheel,
  shake a tree or reveal something beneath a leaf.
- Connect the existing habitats through paths, bridges, river travel and coherent
  movement. Preserve the continuous landscape rather than adding separate strips.
- Show completed projects in their actual locations, with something children can
  touch afterward.

The home screen becomes a place worth visiting between lessons. Exploration is
optional; the next lesson stays clearly visible. Avoid precision movement controls,
a joystick/open-world rewrite, compulsory travel or unmarked navigation traps.

Acceptance: a new learner can reach the next lesson without exploring first;
returning children can revisit unlocked places; travel is interruptible; landmarks
do not cover chapter letters, stars or controls. Existing unlock rules remain intact.

## 3. Connected adventures throughout the curriculum

Boat already connects Pond → Trace → Feed. Extend that structure across the
remaining chapters without changing their curriculum or game order.

- Give each chapter a simple pictorial purpose: prepare a picnic, assemble a
  garden sign, carry supplies or finish a habitat project.
- Carry recognizable objects, including the child's actual creations, between
  activities.
- Make each existing activity contribute to the same outcome.
- Use short object handoffs between activities, followed by one satisfying
  chapter ending and a lasting world change.

Children should understand why they are doing the next activity. Start with one
complete chapter after Boat, then expand through shared chapter presentation data
and components rather than separate story systems. Select chapter purposes around
their actual existing activity sequence.

Acceptance: a child can connect the result of one activity to the next scene;
replay and interruption do not duplicate rewards; completed-world changes derive
from saved progress; repeated visits do not force a cinematic. Preserve honest
distinctions between supported participation and independent recognition.

## 4. Deeper games with more experimentation

Offer more interesting decisions and physical consequences instead of increasing
difficulty mainly through additional answer choices.

- Extend Pond play with retrieving and docking selected objects.
- Give Catch short collection projects where fruit visibly fills and changes a
  basket, building on the existing delivery and held-result interactions.
- Make joining activities produce something usable: a completed sign or labelled
  parcel that leaves the workbench. Keep verified Arabic shaping and joins.
- Add one new permanent toy: **Water Garden**. Children open letter-labelled gates
  and arrange simple channels to send water toward flowers. Guided rounds use
  taught letters and existing reviewed audio; free play allows experimentation
  with water. No new recording batch is required to start this slice.

Learning happens through finding, constructing and testing. Introduce one new
interaction at a time, with generous targets and tap alternatives. A difficult
gesture must never count as a letter mistake. Free play supplies no fabricated
mastery evidence or extra reward payouts.

Acceptance: guided goals are pictorial, experimentation is reversible, no
unintroduced letters enter independent challenges, and motion, option count and
time pressure do not all increase together. Validate Water Garden as one complete
toy before expanding the permanent game catalogue.

## 5. A personal garden that becomes playable

The existing garden supports placing rewards in four slots. Expand what happens
after placement, building on current ownership, layout persistence and undo.

- Launch an earned boat, invite the pet onto a picnic blanket or water a planted
  flower.
- Turn saved drawings into garden signs or flags children can revisit.
- Offer choices between small creative projects using existing earned possessions.
- Let the pet approach and use placed objects, with persistent arrangements and
  undo.

Rewards become toys and memories rather than objects to collect and leave behind.
Nothing wilts or becomes unhappy when a child stops playing. No new currency,
random rewards, attendance pressure or mandatory care loop.

Acceptance: creations and placements survive reload; owned items remain owned;
undo is clear; replaying a prop interaction is safe and deterministic; the garden
offers a satisfying stopping point as well as a route back into lessons.

## Implementation order and efficiency

Follow the numbered order. First demonstrate the companion animation foundation
through the entire Boat journey. Reuse that foundation for world travel, chapter
handoffs and garden play. Existing integration points include `LettersGame.js`,
`LettersJourney.js`, `MiniGames.js`, `LettersMapArt.js` and `DecoratingGarden.js`.

Use one recoverable checkpoint, a compact state/acceptance matrix and selected
matched before/after captures per phase. Extend shared behavior and configuration
instead of duplicating screens or re-auditing the whole repository each time.
Previously authorized lower-cost delegation is appropriate for bounded tests,
asset fitting and inventory tasks with clear file ownership. Integration and the
complete child-experience review stay coordinated; do not promise token savings
without measurement.

For every phase verify phone, short landscape and desktop; first exposure, retry,
replay, rapid input, cancellation, navigation during animation, saved progress,
reward integrity, mute and reduced motion. Touch response begins immediately;
secondary animation can settle afterward. Physical-device and child-observation
results must be distinguished from browser viewport and automated tests.

Observe whether a child discovers the action without reading, understands its
consequence, recovers comfortably and chooses to repeat it. These are design
hypotheses; code tests alone cannot establish enjoyment or learning effectiveness.

Next owner action after reviewing the production release: say “start update 1”
to begin the participating-pet Boat slice. Publishing future phases still requires
an explicit request.
