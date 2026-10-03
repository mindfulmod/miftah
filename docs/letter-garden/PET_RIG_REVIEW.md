# Participating pet — update 1, Boat slice

September 30, 2026. Local, uncommitted, on `codex/letter-garden-next-major`.
Cache stamp `20260930-pet-rig1`, service worker `miftah-v72-letter-garden-pet-rig-20260930`.

## What changed

- New `src/letters/LettersPetRig.js`, a shared rig for blob, Lumi, Mina and Rafi.
  Per-species pivots, shared action semantics.
- Animal art: rig wrapper groups, head-worn accessories moved into the head
  pivot, flat ink contour, mammal brows and a curious "o" mouth. Blob art:
  gaze, head and root pivots; the ground shadow stays put during a hop.
- Boat journey wiring:

| Moment | Pet does |
|---|---|
| Meet: card or speaker tapped | Looks at the letter card |
| Pond: wrong pick | Looks at the child's pick, then a head-tilt "hmm" |
| Pond: found | Squash, hop, then inspects the found packet |
| Trace: drawing | Follows the pen tip, paw toward the board, "o" mouth |
| Trace: finished | Hop, then inspects the picture |
| Feed: packet held or selected | Turns to it, "o" mouth, reaches on that side |
| Feed: wrong delivery | Looks at it, then ponders |
| Feed: delivered | Hop, then leans into the basket to look |
| Stars / party | Hop, then looks over the cargo / basket. Tap = hop |
| Tap the pet in any activity | Wave |

## Evidence

- `node --test src/letters/tests/*.test.cjs`: 359 pass, 0 fail. This includes
  the new `pet-rig.test.cjs`: markup pivots and balance, headwear in the head
  pivot, cancel on destroy and on screen replacement, reduced motion keeps the
  body still, ordered chains, and an allow-list proving games never pass the
  answer to the pet.
- Palette checker unchanged at 615 distinct / 842 uses.
- Browser run through the whole Boat slice at phone size (375×812) with Mina:
  every row above was screenshot-checked. A cast sheet confirmed blob, Lumi,
  Mina and Rafi all track and reach, with the cap turning with Rafi's head.
  Leaving the party mid-hop logged no errors.

## Not verified

- The preview tab was hidden, so frames were stepped by hand. Real-time
  smoothness and iPad Air 4 frame rate are unmeasured.
- Short landscape and desktop layouts; the reduced-motion setting in the
  browser (covered by unit test only).
- Physical touch and child observation: discovery, understanding and
  repetition remain design hypotheses.

## Propagation — October 1, 2026

Owner approved the Boat slice and asked to propagate. Stamp
`20261001-pet-rig2`, service worker `miftah-v73-letter-garden-pet-rig-20261001`.

- The rig now runs in every activity of every chapter (no Boat gate).
- Shared hooks in `LettersGame.startGame`, so no per-game code was needed:
  - Stage touch hook: whatever button the child presses or drags, the pet
    follows and reaches toward until release.
  - `reportOutcome` hook: correct → hop, then inspect the child's last pick;
    miss → inspect it, then ponder. Throttled to one reaction per 600 ms and
    only within 2.5 s of a child touch, so batch reports cannot set it off.
  - Pond, Trace and Feed opt out (`ownChoreography`) and keep their own moments.
- Stars (`.reward-friend`) and party (`.party-pet`) screens in every chapter:
  hop, then look at the planter, flower or mascot friend. Tap = hop.
- Not included: the meet screen outside Boat (it has no pet), and the
  practice/daily-garden hub screens.

Evidence: 360 tests pass, including a contract that the outcome reaction never
reads the answer (`currentTarget`, `round.target`, `itemId`). In the browser at
375×812: chapter ح Pairs mismatch → ponder, match → hop; ح stars screen → hop,
then looks at the planter; joining chapter Fuse, holding a piece → turn, "o"
mouth and reach, then settles on release. No console errors.
Untested in the browser: Catch, Burst, Build, Un-fuse, Chain, Parade (same
shared hooks, covered by the contract test), real-time smoothness, iPad.

## Step 0 hardening and Step 1 pet life — October 1, 2026

Stamp `20261001-pet-life3`, service worker `miftah-v74-letter-garden-pet-life-20261001`.

Step 0:
- Rig naps (400 ms polls, no frames) while its pet is off screen or zero-sized.
- Burst (timed) keeps the pet a quiet watcher: no answer reactions.
- A quick correct answer right after a miss now always celebrates; only
  repeats of the same verdict within 600 ms are dropped.
- Blob family switched to the shared warm ink outline (body, ears, tails,
  arms, feet, chick tuft/feet).
- Browser at 375×812: Un-fuse (miss → ponder, quick fix → hop), Parade (held
  folder → turn, "o", reach), Catch (miss → ponder, catch → hop), Build
  (wrong order → inspect then ponder). Short landscape 812×375 and desktop
  1280×800: presenter pet stays in its slot during the hop.
- iPad: not measured by me. `.qa/rig-games.html?fps` shows a frame meter.

Step 1:
- Species personalities: Mina double-bounce + ear twitch, Rafi stomp + sway,
  Lumi wing-flap + head bob, blob squish + wobble. Idle fidgets every 6–10 s.
- Hatch: closed eyes open, stretch, look at the child, wave. Colour picks
  celebrate; touched swatches are watched.
- Wardrobe: outfit or colour changes celebrate (tab switches stay quiet);
  tapping the pet waves; touched shelf items are watched.
- Map: the pet beside the current stop watches the stop or control the child
  presses; the toolbar pet idles.
- Meet: the companion pet appears in every chapter, not only Boat.
- Practice screens: pet watches touches and reacts to answers (Feed keeps its
  own moments; Burst stays calm).
- Browser-verified: hatch wake, map watch, wardrobe colour cheer, four
  distinct species celebrations, ح meet companion. Practice screens are
  covered by tests only.
- 364 tests pass (one unrelated timing flake seen once in 12 runs).

## Update 2 — overworld, first slice (October 1, 2026)

Stamp `20261001-overworld1`, service worker `miftah-v75-letter-garden-overworld-20261001`.

Built: trail travel with per-species walk gaits and facing, instant entry at
the pet's stop or on a repeat tap, redirect mid-walk, reduced-motion skip;
the pet remembers the last chapter entered (session only); three toy kinds
(orchard, reeds, lantern) across the map plus the sailing Boat landmark; the
map pet inspects a toy and celebrates; a locked stop gets a look and "hmm".

Browser at 375×812: walk from stop 3 to ح along the trail, facing flips,
arrival enters the chapter; back on the map the pet waits at ح and a tap
enters at once; orchard fruit drops then regrows; leaf lifts 38°; boat sails;
lantern glows. No toy intercepts any stop or control tap.
Tests: 366 pass, including travel/lock contracts and a check that toy code
never touches progress, stars, saves or rewards.

Not yet in this slice: bridges/river crossings between habitats, a
waterwheel, persistence of the pet's spot across reloads, iPad smoothness.

## Update 2 — bridges and waterwheel (October 1, 2026)

Stamp `20261001-overworld3`, service worker `miftah-v77-letter-garden-bridges-20261001`.

- 7 brooks (after chapters 3, 7, 10, 14, 16, 17, 19 in 1-based terms) with a
  spring, a level crossing and a fall to the river; a footbridge on the trail
  at each crossing; one waterwheel at the first free brook mouth.
- Verified at 375×812 and 820×1180: the waterwheel sits on the first brook
  (between ذ and ش); no stop or control loses a tap to any toy; stroke widths
  back at the 17/205 baseline after redrawing brooks as filled bands; palette
  unchanged; 367 tests pass; no console errors.
- Fixed on the way: placement originally measured before layout settled and
  against landmark button boxes taller than their drawings; it now runs after
  paint/fonts and guards the drawings.
- Still open for update 2: persisting the pet's spot across reloads; river
  travel by boat for long trips.

## Updates 3, 4 and 5 — first passes (October 1, 2026)

Stamp `20261001-garden1`, service worker `miftah-v79-letter-garden-play-20261001`.
377 tests pass; palette and stroke counts unchanged (615/842, 17/205).

Update 3 — connected adventures (11 of 22 chapters):
- Shared `LettersJourney` table: picnic (Boat, ذ, …), seed bed (ح, …), parcel
  (muqattaat, tanween, leen, shaddah). Each journey chapter now gets Boat's
  reference presentation (round dots, route, handoff scenes, ending).
- Browser: ح played end to end at 375×812 — sprouts after Pairs, the child's
  drawings as signs after Trace, blooms + watering can after Pond, and the
  bloomed bed stays at the ح stop on the map. ذ plays as a picnic chapter;
  tanween shows the parcel handoff with the workbench as the next tool.
- Open: stories for the other 11 chapters (joining, vowel, word chapters).

Update 4 — deeper games:
- Water Garden (practice garden): 4 guided rounds (taught letters only,
  listening-first), the bend introduced from round 3, then free play with no
  reports or rewards. Browser-verified: wrong gate rattles and reveals; right
  gate waters a flower; spilled water hints the bend; turning it blooms the
  flower; free play toggles gates.
- Catch: the basket shows a slot per fruit and fills (verified 2/4).
- Build: finished words fly to a parcel shelf on the bench (verified طه, يس).
- Open: Pond retrieving/docking.

Update 5 — playable garden:
- Keepsakes from finished chapters and the child's saved drawings (validated,
  newest 8, survive reload) join the decoration shelf as signs.
- Placed items are toys; the pet walks over, inspects, celebrates. Tapping toy
  after toy never moves anything (verified layout unchanged).
- Open: picnic-blanket/watering-can interactions with the pet; real-time
  motion and iPad checks for everything above.

Pass — bend, basket, remaining stories (2026-10-01)
- Stamp `20261001-stories1`, service worker `miftah-v80-letter-garden-stories-20261001`.
  380 tests pass; palette and stroke counts unchanged (615/842, 17/205).
- Bend redrawn as a turning spout; browser-verified that a turned bend spills,
  glows, and turning it back blooms the flower and advances the round.
- Catch pile visible after each catch (phone portrait 2/4, landscape 3/4).
- Stories for the other 11 chapters (lanterns, fruit tree, seed jars, raft):
  every phase of each scene and all keepsakes checked in the browser; sukoon's
  hand-off screen and join-2's ending checked in the app.
- Bug fixed from update 3: the chapter ending referenced an undefined `s`
  for the replay label, so every story chapter's ending threw. It now reads
  `this.session`, with a test.

Pass — Pond docking, blanket, watering can (2026-10-01)
- Stamp `20261001-props1`, service worker `miftah-v81-letter-garden-props-20261001`.
  383 tests pass; palette and stroke counts unchanged (615/842, 17/205).
- Pond: browser-verified at 375×812 and 812×375 with tiles (ح) and seed
  packets (Boat): finds sail to the jetty; a second tap continues; the
  three-choice grid clears the jetty.
- Garden: blanket sit, pet-tap return, can watering two targets in turn, and
  the pet returning home.
- Bug fixed from update 5: tapping a toy repainted its slot after the animation
  started, so toy animations ran on detached art (only the pet walk showed).
  The slot is now painted first.

Pass — boat ride, map spot (2026-10-01)
- Stamp `20261001-ride1`, service worker `miftah-v82-letter-garden-ride-20261001`.
  385 tests pass; palette and stroke counts unchanged.
- Browser: the pet rides the garden boat seated in the hull; after entering ذ
  and reloading, the map pet waits at ذ.

Pass — whole-app sweep before release (2026-10-01)
- Stamp `20261001-sweep1`, service worker `miftah-v83-letter-garden-sweep-20261001`. 386 tests pass.
- New local QA tools (untracked `.qa/`): `make-rig-games.py` regenerates the QA
  page; `sweep.js` adds `lgSweep()` (opens every chapter's meet, activity,
  hand-off and ending screen plus 17 other screens; flags errors, empty stages,
  sideways overflow, off-screen buttons) and `lgPlay()` (plays all 66
  activities to their hand-off with one wrong answer first and counts the
  learning outcomes). Open `.qa/rig-games.html?sweep` and run them in the
  console; saved progress is restored afterwards.
- Results: `lgSweep` 193/193 clean at 375×812, at 812×375 with reduced motion,
  and at 820×1180 at night. `lgPlay` 66/66 finish with no errors in portrait
  and in landscape with reduced motion; each activity records its rounds as
  correct plus exactly the one deliberate miss (Trace has none; fatha's blend
  has no decoy by design).
- Save check: a profile with all 22 chapters done and a stale garden item
  loads every screen cleanly. Fixed: the map waterwheel could land on a
  chapter keepsake (ش's seed bed at phone width); it now avoids keepsakes.

Pass — open art items (2026-10-01)
- Stamp `20261001-art1`, service worker `miftah-v84-letter-garden-art-20261001`.
  389 tests pass. Palette debt down from 615/842 to 520/729; off-scale stroke
  uses down from 205 to 158 (17 distinct widths unchanged).
- Browser: sticker sheet at 52/150/200px; hatch at 375×812 through all three
  states; short-landscape reward at 667×375 measured 5.56% dark (was 3.87%),
  portrait reward 13.1%; habitat miniatures for every region side by side.
  Spot sweep of three chapters plus all other screens: 41 steps clean.
- Note: chapter endings now show their story scenes, so the habitat reward
  appears mainly in daily practice, check-ups and plans.

Pass — palette cleanup (2026-10-01, partial)
- Stamp `20261001-palette1`, service worker `miftah-v85-letter-garden-palette-20261001`. 389 tests pass.
- Off-palette colours 520/729 → 113/136 via `.qa/palmap.mjs` (Lab nearest, lightness weighted ×2,
  hue guard; passes at ΔE ≤8, ≤16, ≤30). Pet cast files (LettersAnimalArt.js, letters-animals.css)
  excluded pending the owner's call. Backup of pre-pass src/styles in the session scratchpad.
- Browser: sticker sheet, map, wardrobe, album, practice garden reviewed; crow and cat shifted greyer-brown.
- Left: 113 colours (muted olives, lavenders, mauves need hand choices or palette additions),
  17 off-scale stroke widths, activity backdrops.

## Pass — palette 2, stroke scale, chapter lands (2026-10-01)
- Palette: off-palette outside the cast 64 → 0 (one remaining hit is a code comment).
  Added Sage and Lavender ramps to ART.md §2; hand-mapped sticker contours to Ink/Sky-day/Coral.
  Cast files byte-identical to the pre-palette backup.
- Strokes: 147 contours snapped to the scale; 4 ribbons marked `data-ribbon`;
  checker skips ribbons only. Remaining 7 off-scale widths are all in the cast.
- Chapter lands: `LettersArt.backdrop(phase, biome)`; activity screens pass the world's biome.
  Craft chapters cover all six lands, so every land is seen. Reviewed orchard,
  peaks, lagoon (desktop + phone portrait) at night, and a day/night/sunset sheet of all six.
- Stamp `20261001-palette2`, sw v86. Tests 392 pass.

## Pass — sky and light, icons and controls, map stops (2026-10-01)
- Retired the scenery hue/saturate filter; sun/moon glow, glint stars, contourless clouds.
- 14 icons on one grid; Home gets `.lg-home-btn`; wordless muted sound.
- Locked stops opaque; four-stage mastery plants at 46px in warm ink.
- Stamp `20261001-skymap1`, sw v87.

## Pass — tools, effects, album and stamps (2026-10-01)
- Undo icon; gentle retry wobble; petal confetti; sparks honour the in-app switch.
- Album silhouettes; stamp calendar today/future fixes. Stamp `20261001-tools1`, sw v88.
- Targeted checks only (unit tests, palette check, screenshots of album, stamps, dot garden) per owner request.

## Pass — focus, wardrobe, map header (2026-10-01)
- Focus token across 28 rules; wardrobe colour + card size; phone map header two rows.
- Targeted checks: wardrobe (3 tabs), stars/party screens, prompt bubble overflow probe, map at 375px. Stamp `20261001-focus1`, sw v89.

## Major pass — sound world, living lands, meeting a letter (2026-10-01)
- 18 material cues + 8 species voices + 6 land beds; wired into toys, dock, bend, flow, crafts, egg, wardrobe, pet.
- Land creatures day/night in both backdrops; reduced motion removes them.
- Meet screen: letter sign with writing-direction ink reveal; met-letter trail; drawn your-turn cue.
- Targeted checks: land sheet day/night, lagoon + trace activities at 375px (bed running), meet reveal (single letter, trail, join pieces). Tests 409. Stamp `20261001-alive1`, sw v90.

## Major pass — pack ceremony, land gates, material bursts (2026-10-01)
- Pack: tear → rise → flip → place, sticker flies into its silhouette slot; owned before the ceremony.
- Gates: banner poles at land-boundary bridges; one-time arrival with scroll, unfurl, chord, pet look; `lands-seen` state.
- Bursts: water/wood/seeds/glints/petals by activity (craft overrides) + material cue on correct.
- Targeted checks: full ceremony run, orchard + lagoon arrivals at phone width, frozen burst sheet. Tests 412. Stamp `20261001-ceremony1`, sw v91.

## Major pass ×5 — map welcome, weather, My letters, playroom, land boards (2026-10-01)
- Targeted checks: welcome sequence on a 3-chapter save (pet settled on next stop), drizzle on activity + breezy on map, book with 40 letters / 4 unopened lands, toys (bubbles, ball), boards in orchard/lagoon/peaks. Tests 417. Stamp `20261001-world5`, sw v92.
