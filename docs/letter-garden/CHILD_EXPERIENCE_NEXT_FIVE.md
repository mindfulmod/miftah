# Letter Garden — the next five child-experience passes

Planning checkpoint: 2026-09-16; pass 1 local preview `20260916-touch1`.
Scope: ages 4–6, new to Arabic. Audio generation and the FM recording package are
parked. Keep the existing bundled clips/fallback. Parent-page work and publishing
remain deferred. Pass 1 is implemented locally; see
[TACTILE_PASS_REVIEW.md](TACTILE_PASS_REVIEW.md). Pass 2 and the Boat portions of
passes 4–5 are now implemented locally in `20260918-boat-adventure1`; see
[BOAT_ADVENTURE_REVIEW.md](BOAT_ADVENTURE_REVIEW.md). Pass 3 now has a first local Dot Garden implementation (September 25): taught-family
exploration, undo, responsive seedling and potting-table art. Its Paths and joining
workbench portions and the remaining pet/garden interactions are still proposed.
None of these changes has been tested with children yet.

## Direction

The next release should make touching an object, helping a pet, discovering a
letter and returning to the garden feel connected. Preserve the existing pond,
boat, habitats, warm outlined art, lesson order, earned possessions, gradual
difficulty and distinction between supported participation and independent
recognition. Add depth through consequences and agency, with restrained scenery.

The existing game already has drawing colours, dot repair, practice, a decorating
garden, pet reactions and teaching support. Reintroducing these as new features
would waste work. Extend their relationships and the quality of their response.

## Evidence checked for this plan

- Current user tab: observed the in-progress drawing screen without interacting
  with it or changing its save.
- Isolated live-code fixture at 320×568: completed four Boat Pond rounds, inspected
  its reward island, chapter-route strip, replay/continue and two optional-practice
  controls. Pond, boat and garden scenery are present; retain them.
- Isolated live-code fixture: selected and delivered a Boat Feed packet through
  the tap alternative, and verified the next prompt. Inspected My Garden's four
  occupied slots, earned-decoration tray, pet and delivery entrance.
- Source: Trace advances 700 ms after a successful drawing (`MiniGames.js`,
  `TraceGame.penUp`). Each mini-game opens `renderStars`, and final Continue opens
  another chapter party (`LettersGame.js`). The local game has seven presenter
  moods, a separate prominent pet in Feed, and existing garden-placement reactions.
- These are adult design observations. They do not establish how a child actually
  feels, that the game teaches effectively, or that audio quality is approved.
  Isolated checks were muted; physical-device touch was not tested this turn.

## 1. Make actions feel physical — “I made that happen”

**Status:** implemented locally, including child-led Trace completion, continuous
packet handoff, basket landing, restrained Pond/workbench feedback, reduced
motion, and rotation-safe drawings. See the review for validation and limits.

**Priority:** first. Start with Pond, Feed and Trace in Boat; extend the same rules
to Catch and the joining workbench after comparison.

- Give objects consistent touch response: immediate press, clear lift/shadow when
  held, direct finger following, readable destination, and a brief landing/settle.
  Touch response must start immediately; weight must not mean input lag.
- Let the receiving place react: a small ripple where a Pond item is touched,
  basket/ground response to a delivery, and a seam closing when pieces join.
  Keep Arabic glyphs legible and correctly shaped throughout; animate the carrier.
- Distinguish material responses within the existing visual family. Paper folds
  and settles; water ripples; a planted item takes root. Reuse and tune current
  sound effects only where useful; speech stays clear.
- Preserve a child's successful drawing long enough to enjoy it. Replace the
  fixed 700 ms disappearance with a brief completion pose and a clear child-led
  continuation. Keep completion/reward issuance idempotent and independent of
  additional decorative taps.
- Retain tap/keyboard alternatives, cancellation, generous drop areas and reduced
  motion. Effects acknowledge the action and then settle; no perpetual attention
  competition or extra mandatory waits.

**Check:** a child can see which object they moved, where it landed and what
changed. Check interrupted drags, rapid taps, dropped frames and reduced motion
alongside this experience. Compare identical content before and after.

## 2. Connect a chapter into one small adventure — “I am going somewhere”

**Status:** implemented for Boat. Shared packets connect Pond → Trace → Feed;
the child's actual ink appears in the handoff, one selected pet participates,
and a single final picnic unlocks a persistent map memento. Curriculum, scoring
and progression remain unchanged. Extension to other habitats is still proposed.

**Priority:** establish alongside pass 1 in Boat before spreading across habitats.

- Keep Boat's Pond → Trace → Feed order, but carry one pictorial purpose and a
  recognizable prop through it: discover packets at the pond, make their letter
  labels, and deliver them to the pet's garden picnic.
- Use the existing boat, path and habitat as connecting landmarks. The same pet
  travels through entry, activity, reward and return. Keep transitions short and
  skippable on repeat visits; avoid a separate cinematic system.
- Give the child one obvious next action after a game. Keep the star award and
  replay function, but reduce competing practice detours at this moment; the
  practice hub remains available. A lightweight in-place reward presentation can
  replace a repeated scene change after it is verified against existing rules.
- Show a purposeful world change at chapter completion and carry it back to the
  actual map. Derive it from existing progress, never from animation completion.
- Build a reusable chapter presentation contract, with small habitat-specific
  data. Avoid a separate story engine or new curriculum sequencing.

**Check:** without written instructions, the next action is discoverable and the
child can connect an activity's result to something on the map. Existing stars,
replays, chapter unlocks and interrupted navigation behave as before.

## 3. Make learning something to experiment with — “What happens if I change this?”

**Status:** Dot Garden slice implemented locally; see [potting play review](POTTING_PLAY_REVIEW.md). Broader Paths/Build/Blend work remains open.

**Priority:** after the interaction foundation; extend Dot Garden, Paths and
Blend/Build rather than adding another disconnected game.

- Add a short optional exploration phase using taught content. Moving a dot
  changes the verified shared-body letter; moving a taught vowel changes the
  displayed syllable. The child can undo and try again. Distinguish exploratory
  taps from answers and do not manufacture mastery evidence.
- Follow exploration with a small purpose: repair a packet label or choose the
  piece that lets a delivery continue. Use a different arrangement so recall is
  not just copying the previous location.
- Give each existing game a meaningful verb: Pond finds, Catch collects, Pairs
  remembers, Feed delivers, Trace draws, Dot Garden repairs, and the joining
  family connects/separates. Art and feedback should express those differences
  while keeping the actual learning objective legible.
- Introduce variation through the situation and taught material, not simultaneous
  increases in options, movement and pressure. Extend the existing review planner;
  do not replace its eligibility/assistance rules.
- Repair feedback should demonstrate the relevant difference, then restore agency.
  Review the remaining non-beginner red-cross/shake path for consistency with that
  tone. No scolding or emotional penalty from the pet.
- With voice generation parked, qualify this first on familiar letter names and
  visual construction. Later syllables retain visible support and their existing
  audio limits; independent decoding is not claimed.

**Check:** the child voluntarily tries a second arrangement, can recover from a
mistake, and can identify the taught item later in another layout. A wrong drop
still cannot become a false letter-knowledge failure.

## 4. Let the pet participate — “My friend is doing this with me”

**Status:** Boat subset implemented: the same selected pet accompanies entry,
play and handoffs, responds to drawing/packet actions, and occupies one clear
role in Feed. Gaze tracking, workbench gestures and wider propagation remain
proposed.

**Priority:** integrate into the Boat reference; propagate once the behavior reads
clearly on small screens.

- Extend the existing pose system into short contextual actions: follow a held
  packet with its eyes, lean toward its destination, steady a workbench prop, and
  inspect a finished drawing. Actions connect the pet to the child's current act.
- Decide the pet's role per scene. Avoid a small presenter and a larger identical
  pet competing for attention in the same moment; retain prompt/replay access.
- Keep help pictorial and available on request. A hesitant child can get one clear
  gesture demonstrating the mechanic; avoid repeated automatic answer cues or
  hints that prevent an independent response from being recorded honestly.
- React to creation and discovery as well as correct selection. Keep the pet
  welcoming during retries. Idle behavior stays quiet while the child is deciding.
- Use existing species and owned accessories, with face/eye safe areas at actual
  play sizes. No hunger, affection scores, sadness on exit or attendance demands.

**Check:** the pet draws attention toward the relevant action rather than away
from the letter. Responses remain readable with sound off and reduced motion,
and never cover glyphs, stars or controls.

## 5. Make progress personal and lasting — “I changed my garden”

**Status:** Boat picnic memento and a single final stopping point implemented.
The memento derives from saved chapter completion. Interactive owned props and
the broader garden-placement follow-through remain proposed.

**Priority:** connect completion to the existing map and My Garden after the
reference chapter works end to end.

- Show what has changed because of the child's existing earned progress: follow a
  seed/flower or familiar prop from the reward scene to its map habitat, with a
  reduced-motion equivalent. No new currency, random reward or duplicate payout.
- Let the child immediately use an owned reward in the existing four-slot garden.
  Retain undo and persistent placement; make select/place/finish states clearer.
- Add a small number of deterministic, repeatable interactions to owned props:
  launch the paper boat for a short loop, tap a flower to open it, or invite the
  pet to inspect it. Keep the meaningful art already present and reserve readable
  space. These are toys, not new demands to complete more lessons.
- Give the chapter a satisfying stopping point. Offer continuing the journey or
  enjoying the garden, without streak pressure or an endless reward cascade.
- On return, make the child's existing garden changes visible and offer a clear
  route back into familiar play. Preserve the current chapter order and gentle
  daily review; do not introduce a new progression system.

**Check:** decorations survive reload, a child can rediscover something they
changed, and ending a session feels complete. Enjoyment and confidence matter
more than maximizing session length.

## Efficient implementation and review

1. Take a recoverable local checkpoint and a few matched baseline recordings or
   screenshots. The FM scripts remain intact and parked.
2. Build one Boat journey with passes 1, 2 and the necessary pass-4 pet actions.
   Review its complete entry → play → reward → return flow on phone and desktop.
3. Reuse those interaction/presentation components across activity families;
   deliver pass 3 on top of the existing teaching and review contracts.
4. Connect pass 5 through existing completion and ownership events. Propagate to
   later habitats using data and shared components, not copied page overrides.
5. At each stage, verify save/reward integrity, input during animation, mute,
   reduced motion, first exposure, retry and replay. Before release, observe short
   supervised sessions with a few children aged 4–6 and an Arabic educator.

For child sessions, record where they first touch, where they hesitate, whether
they understand cause and effect, what they choose to repeat, how they respond to
a correction, and what they remember after another activity. A small formative
session can expose confusion; it is not proof of learning effectiveness. Do not
collect microphone/video recordings or new analytics without a separate decision.

The model-efficient unit of work is one shared interaction family with a defined
acceptance check. Keep a compact before/after log and targeted regressions. Bounded
test/asset-fit work can use the previously requested lower-cost delegation;
integration and the child-experience review stay coordinated. No need for another
100-item audit or a new prototype.

## Research informing the direction

NAEYC identifies choice, wonder and delight as central features of play and
recommends developmentally responsive guidance. This supports adding meaningful
agency and exploration; it does not validate any particular animation or game.
[NAEYC development and learning principles](https://www.naeyc.org/resources/position-statements/dap/principles).

IES recommends spacing learning and using active retrieval. Retain familiar
material across separated, varied encounters rather than equating repeated
immediate taps with retention. Its guide is broad instructional evidence, not a
study of this app or Arabic preschool gameplay.
[IES practice guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/1).
