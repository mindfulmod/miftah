# Letter Garden: a coherent version 3

2026-10-20. Local implementation. Audio generation remains parked.

## Product decision

Make learning something the child does **to create a place**, with a clear end after a small adventure. The owner chose a 5–8 minute target with an optional next adventure. This is a pacing hypothesis, not a timer or a claim about measured child sessions.

Keep the curriculum route, all existing games, pets, owned items, and earned progress. The existing village, Today’s Walk entrance, Delivery, drawing and Water Garden are the foundation. Do not add a competing prototype or another grid of games.

## Audit: why another cosmetic batch is insufficient

- There are already dozens of toys, connected chapter journeys, a decorating garden and daily review. More activities alone do not solve the fragmented experience.
- Today’s Walk is a fixed list of 3–5 activities. Playing one for 20 seconds can mark it complete; that is participation, not evidence of remembering a letter.
- Water Garden already progresses from guided choices to free experimentation. Its channels, bends and plants currently disappear when the instance is destroyed.
- Legacy aggregate strength includes matching and assisted answers. New adaptive decisions must read separate evidence buckets without rewriting historic mastery or removing earned progress.
- Some custom activities use fixed choice counts. Two distinct choices and a visible model are a safer starting point; independent listening can be introduced before a third choice.
- Completing a toy often returns to a menu. The child needs to see what their action changed and choose whether to continue.

## The coordinated build

1. **Purpose and agency.** Two pictured destinations: a butterfly patch and a bird nook. Choose a place, then follow three pictured steps: seed delivery → draw a sign → water the garden. No child-facing instructions that require reading.
2. **Learning across activities.** Select only taught letters: a familiar opening, a due/review item, and limited variation. Carry an item that needed help into the later water activity. Match-two → listen-two → listen-three; help returns after difficulty. Drawing remains motor participation, never an assertion of letter recall.
3. **Persistent playable world.** Keep the child’s sign, grown flowers and free-play channel arrangement separately for each destination. Returning to the village or personal garden leads back to the actual playable place. Revisits do not grant repeated completion rewards.
4. **Physical continuity and art.** Show seeds, the sign and watered plants accumulating in one scene. Use the established warm contours, paper, timber, water and foliage. One primary invitation at a time; no floating decoration over teaching glyphs or progress.
5. **A satisfying finish.** Complete the guided goal once, then offer optional water experimentation. Home is always available. Resuming does not reshuffle the project. A finished scene offers home, revisit the garden, or explicitly choose another adventure. The existing daily stamp and practice reward limits remain authoritative.

## Learning basis and limits

The [IES guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/1) recommends delayed review, active retrieval and alternating supported examples with independent practice. These are principles informing the design, not proof that this particular game teaches Arabic effectively. A [preschool retrieval study](https://pmc.ncbi.nlm.nih.gov/articles/PMC11087082/) found no discernible later recall advantage for expanding over equally spaced retrieval in its small sample; avoid claiming one exact interval algorithm is scientifically optimal.

Arabic letter features require explicit attention. [Tibi et al., 2022](https://zai.zu.ac.ae/zairesources/651362/c7295b97-7703-41ff-a73a-5c4dd6217977.pdf) studies letter-feature contributions in Arabic-speaking kindergartners. Preserve the existing names-first curriculum and taught-only item filters; do not infer that an English phonics sequence should replace it.

## Release gates

- New child: only taught material; two choices; no skipped curriculum unlocks.
- After help: later practice remains supported. Assisted, motor and visible matching cannot become independent listening evidence.
- One play session across three activities counts as one evidence session, not three visits.
- Interrupted/reloaded adventure resumes its saved step; old unfinished walks remain accessible.
- Repeated taps, replay, pending speech, turning a channel during flow, and leaving during a transition cannot duplicate completion/rewards.
- Saved projects and drawings are bounded, validated and profile-scoped; old keys are untouched.
- Desktop, narrow phone, landscape and reduced-motion screenshots/play checks; controls remain large and glyphs centered.
- Actual child playtest still required: time to first purposeful action, unprompted continuation, mistaken taps, requests for adult help, reaction to finishing, and recognition on a later visit. No analytics upload added.

## Recovery

Pre-build snapshot: `../letter-garden-v3-baseline-20261020/` next to this checkout. It includes the prior local audio and v266 interaction work. See that snapshot’s RESTORE.md; restore into a separate checkout, never reset the active worktree.


## Implemented and verified

Local build v267 implements the connected route, two persistent destinations, selected drawing signs, per-skill planning/support, gentle drawing support and the Water Garden lifecycle fixes. Completed places remain accessible during a later unfinished adventure. The village entrance shows a visitor once a project is complete. Existing games and chapter progression remain available.

- **919 automated tests passed** across the Letter Garden suite. Coverage includes evidence classification, planning, one shared session across activities, one-letter fallback, stale/duplicate completion, bounded saves, free-play persistence and speech/arrival races.
- **Actual browser play:** seed delivery with tap controls; drawing with native pointer drags and pink pencil; full water sequence with a deliberate wrong answer; channel turning; reduced-motion completion; finish and optional replay; reload at an unfinished step and after completion; saved third-channel open/away restored; village entrance returned to the finished project.
- **Layouts checked:** 1280×720 desktop, 390×844 phone, 320×568 small phone, 844×390 landscape. Screenshots are in `.qa/shots/v3-*`. Water finish was moved clear of flowers, with a separate right-side control in landscape. Browser error/warning log was empty during the final play checks.
- Palette report has existing repository debt; the new adventure files were not flagged. `git diff --check` passed. No commit, publish, or production sync performed.

Still requires observation with a real child: whether the pictured goal is understandable, whether the 5–8 minute pacing feels right, whether they choose to revisit what they made, and whether recognition carries to a later session. Native device touch and audio pronunciation were not validated in this pass. The remaining recorded-audio work is still parked.

### Existing mini-game follow-through — v268, 2026-10-21

The ordinary chapter games now use the derived learning policy as well. Recognition rounds keep one chapter visit identity and carry helped item IDs between activities; a later encounter with a helped target returns to two still, visible options. Construction practice uses its own motor evidence and session gates; participation never counts as an answer. First expose an additional piece, then introduce a decoy on a later successful practice step. Matching, drawing and construction get practice-specific ordering without turning that experience into listening recall.

The child-facing implementation covers the orchard, matching bed, letter building, joining/splitting, picnic and drawing finish. It retains each existing mini-game and its learning action. See v268 in `RELEASES.md` for changes and verification. Arabic contextual-form content review and broader fallback-word handwriting scaffolding remain future work; neither was silently replaced in this pass. Audio remains parked.

## Finite release closeout — 2026-10-23

Later October 23 direction: the owner replaced the finite overall goal with ongoing development through finite, closed revisions. The v267–v291 closure below remains valid. Its instruction to stop all further development is superseded; `work-state.json` identifies the current objective, batch and distinct backlog. Completed work is still not automatically reopened.

The owner accepted the new strategy after repeated returns to completed work. This section is the current scope and stopping rule; historical "next pass" suggestions in individual release notes are not an automatic backlog.

| Release area | Existing evidence | Status |
| --- | --- | --- |
| Core chapter games and shared learning support | v268; chapter/session tests | Complete |
| Toy, book, puzzle, workshop, shadow, word, costume and listening families | v269–v278; recorded family play/layout checks | Complete |
| Practice completion, reward integrity and pictured toy shelves | v279–v280; v290 nested-return checks | Complete |
| Sand/drawing, stamp studio and Water Garden | v281–v283; lifecycle/save checks | Complete |
| Hunt, friends and balloons | v284–v285; recorded interaction/layout checks | Complete |
| Sound Lab interaction, shared picnic and reading books | v286–v289; recorded interaction/layout checks | Complete; audio production excluded |
| Connected adventure, persistence and return journeys | v267 and v290; save/retry/resume/reward checks | Complete |
| Delivery art, learning support and child-operated progression | v291; phone playthrough, desktop/landscape checks | Complete |
| Combined local integration | 1,245 passing checks; syntax/diff checks; existing palette debt unchanged | Complete |

The evidence index is `.qa/release-closeout-evidence.json`; detailed changes remain in `RELEASES.md`. Previous passing browser checks were reused where their relevant code was unchanged. The final combined suite checks the integrated tree. This closes the local implementation batch; it does not establish that every child will understand it or that the game has commercial-console production quality.

### Goal wording and execution contract

Finish one finite local release of the existing Letter Garden art and mini-games, using the completed v267–v290 work as the foundation and completing the pending v291 Delivery integration. Preserve curriculum order, learning mechanics, pets, earned items, saved progress and all unrelated uncommitted work. Make actions legible to a non-reading child aged 4–6, keep beginner difficulty gradual, and use responsive physical feedback without forcing the child through animations.

Use `work-state.json` as the continuation record. Work on one unfinished release item at a time. Name its child-visible outcome and acceptance checks before editing. Completed items stay closed unless there is a new reproducible defect, a directly relevant dependency change or an explicit user request. Do not add a new pass, numerical fix quota or speculative feature to prolong the goal.

Read only relevant code and evidence. Reuse passing tests and screenshots until a change invalidates them. Run focused tests during editing and the combined suite at integration; rerun only after a relevant change or failure. Delegate only bounded independent work that saves more effort than coordination costs; use a lower-cost model for straightforward tasks, concise context and a specific output. Keep design decisions, shared-file integration and final review together. Do not start agents simply to fill available slots.

The finish condition is a closed checklist, passing relevant checks, visual evidence for changed scenes, documented limitations and a usable local preview. Then report what changed, what was checked and the user's next action, and stop. Audio generation/import, parent-page work and publishing are outside this release. Future ideas require a new finite scope rather than automatic continuation.

### Human review and deferred work

Next, play one 5–8 minute adventure on a phone with a child if possible. Observe whether they understand the first action, can drag or use the tap alternative, recognize the garden's response, find Continue, and accept the stopping point. Report specific confusing moments for a bounded follow-up. Physical-device touch, learning retention and session length still require human observation.

Remaining audio generation/verification, Arabic contextual-form content review, broader fallback-word handwriting scaffolding and existing global palette debt are deferred. They are not hidden claims of completion and do not reopen this release automatically. Production remains unchanged.
