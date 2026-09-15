# Letter Garden — art, learning, garden play and interaction

Local candidate: `20260915-garden-life1`. Scope approved September 15, 2026: proceed with the other four passes; leave the parent page out. No push, merge or deployment.

## What changed

| Pass | Shipped locally | Preserved |
|---|---|---|
| Art and supporting screens | A garden alcove for the larger pet; picture tabs for friends, outfits and colors; one browsable shelf; a leaf nest for hatching; a paper teaching board and shared flower reveal; a composed garden island for stars/chapter completion; a paper sticker packet and album binding | Existing bodies, species, accessories, Arabic glyph fitting, visible eyes, boat/habitats, stars and sticker art |
| Learning evidence | Explicit outcome events replace inference from sound-effect names. Separate visible matching, independent listening, assisted responses and motor/assembly participation. Per-type right/wrong/participation counts are retained alongside legacy totals. Response speed no longer lowers strength or garden growth. Verdict-free participation does not refresh answer recency. | The 22-world curriculum, activity sequence, mini-game rules, best-score rewards, learned possessions and existing strength records |
| Garden play | A selected-decoration preview and pet reactions for placing/removing/undoing. Optional Letter Delivery from the practice hub and My Garden: four untimed rounds, completed-pack letters only, two choices initially then up to three, tap or drag, replay and picture-based help, visible matching when sound is unavailable/muted. A flower grows for each delivery. | Four owned-decoration slots, ownership/cost rules, layout saves and undo. Delivery awards no currency and cannot complete a chapter |
| Interaction and sound | A Letter Garden-only sound adapter softens material/retry cues, lowers celebration volume and ducks effects during generated speech. Speech replacement/cancel/error releases ducking safely. Keyboard activation on the celebration pet; wardrobe tab/arrow navigation; stage touch targets; short-landscape scrolling and reduced-motion coverage | Existing generated browser speech; no recorded audio, voice service, microphone or continuous soundtrack; shared Miftah SoundSystem unchanged |

The child UI remains picture-based. Accessible names and QA/debug pages may contain text. The grown-up screen and its controls have not been redesigned.

## Integration corrections made before delivery

- Removed duplicate Letter Delivery distractors and excluded unlearned letters. The shell converts curriculum letter objects to the activity's item contract.
- Prevented one-choice, muted and helped answers from being labeled independent listening. Existing games with a visible prompt now correctly report supported matching.
- Fixed the first sound cue missing speech ducking when AudioContext was created late.
- Restored a compact horizontal chapter-progress row so completion navigation stays visible. Kept stars outside scenery bounds and character faces clear; repositioned the egg onto its nest.
- Corrected a wardrobe grid overflow visible at 568×320, and refresh shelf-arrow state after resize.
- Pointed placement arrows toward the garden, and kept the extra garden controls usable at 320×568.

## Verification

- **Automated:** 153 Letter Garden tests pass, including game outcome contracts, legacy strength compatibility, delivery choices/help/cancellation, shell integration, speech lifecycle, reward integrity, saved state and offline shell dependency coverage. Syntax and Git whitespace checks pass. [Test output](reviews/four-passes/tests.txt).
- **Small phone, 320×568:** completed a fresh four-round Boat Pop game with two choices; verified the pond and letter visibility. Completed all four Letter Delivery rounds using the keyboard, including wrong-answer help; returned to My Garden with the same 20 stars and two completed chapters. Placed a decoration and undid it, restoring all four prior slots. Opened a sticker pack (20→15 stars) and closed its inspector. Hatched the egg in three activations; checked color choices and entry. Joined the two Fatha introduction pieces and inspected the revealed sound/navigation.
- **Wardrobe:** purchased a cap (20→12), switched picture tabs by arrow key, changed color and switched to an already-owned animal without another charge. Confirmed all six practice choices fit the phone view. Checked the room at desktop and small-phone sizes, then rotated the same live view to 568×320 and corrected the overflow.
- **Desktop, 1280×800:** inspected the pet room and Letter Delivery; replayed its generated prompt, requested help, dragged a packet to the bed, and observed one-round advancement. Eight pet bodies were inspected in the proud pose and with cape/glasses/balloon together. This is representative fit coverage, not every possible accessory combination.
- **Motion:** the complete keyboard delivery run and beginner Pop run used the in-app reduced-motion setting; desktop delivery used full motion. New room art is static. Pointer cancellation, repeat completion and stale speech callback behavior also have automated coverage.
- **Existing user save:** reloaded the named preview into this candidate without seeding it. Its 20 stars, completed Boat/Smile chapters, current ذ chapter and blue pet remained intact. The preview is left on the pet room. No errors were reported in its current browser console.
- **Art:** screenshots below were inspected, not just generated. Palette checking is report-only due to existing project debt; [report](reviews/four-passes/palette.txt). This is not a palette-clean release.

Evidence: [pet before](reviews/four-passes/pet-before.jpg), [pet after](reviews/four-passes/pet-after.jpg), [desktop room](reviews/four-passes/pet-desktop.jpg), [landscape room](reviews/four-passes/pet-landscape.jpg), [hatch](reviews/four-passes/hatch-after.jpg), [lesson](reviews/four-passes/meet-after.jpg), [completion before](reviews/four-passes/party-before.jpg), [completion after](reviews/four-passes/party-after.jpg), [per-game stars](reviews/four-passes/stars-after.jpg), [practice hub](reviews/four-passes/practice-hub-phone.jpg), [album](reviews/four-passes/album-after.jpg), [garden](reviews/four-passes/garden-after.jpg), [phone delivery](reviews/four-passes/delivery-phone.jpg), [desktop delivery](reviews/four-passes/delivery-desktop.jpg), [eight pets](reviews/four-passes/pets-proud.jpg), [accessory fit sample](reviews/four-passes/pets-accessories.jpg).

## Resume / recovery

Durable checkout: `/Users/main/Documents/GitHub/miftah/.local-work/letter-garden-next-major`, branch `codex/letter-garden-next-major`. Starting checkpoint for these four passes: `64aa4a0e776996544182dfae2acb7e66f11df5fb`. Production remains the earlier `55f34576f0ebfc02bcf115452101b37adfbb4536` baseline. The sibling `letter-garden-next-major.bundle` is refreshed after the local checkpoint. Recover into a new directory by cloning that bundle and checking out this branch; use the starting checkpoint in that new clone to inspect the pre-pass version. Do not reset the original mixed workspace.

Run `node scripts/serve-letter-garden.mjs 8790`. The user preview is `http://letter-garden-next.localhost:8790/letters.html?v=20260915-garden-life1`.

Disposable UI fixtures: `node scripts/generate-letter-garden-qa.cjs` and `node scripts/generate-letter-garden-pet-qa.cjs`. Both use the actual game code and reject the named user origin. Generated `.qa` files are excluded from the checkpoint. Source files and evidence are retained.

## Remaining release gates

Physical iPhone/Android touch, rotation and installed-PWA update checks; audible speech/effect balance across devices; Arabic educator review and supervised sessions with children aged 4–6. Browser controls and speech lifecycle were checked, but subjective sound quality was not evaluated by listening. The full body × accessory × pose matrix is not complete. Parent-page work is deferred at the user's request. No recorded voice work or publication was performed.

Bounded implementation and test tasks used Sol and Luna; root handled visual direction, controller integration, browser checks and corrections. No measured token-savings estimate is claimed.
