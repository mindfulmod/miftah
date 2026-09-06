# Combined Pairs, Build and Blend pass

Local build: `letters.html?v=20260906-three1`. This combines the next three planned activity passes. No publishing, audio-service work, curriculum replacement or progress migration.

## Changes

Pairs uses paper-faced leaf cards in a green matching bed. Selection is outlined; matched cards settle and remain subdued in their original positions. The existing two boards, three matches and optional form-to-isolated matching rules are retained. The existing brief demonstration is retained. Buttons now activate by click, supporting native keyboard activation as well as taps.

Build uses wooden pieces, recessed rectangular sockets and a distinct parts tray. Correct assembly now visibly reveals the font-rendered whole after 500ms; previously the code only spoke it despite a comment promising a reveal. Ordered parts, decoys, retry delay, target count and scoring remain the same. The whole uses the existing target display and text shaping, never a generated letter image.

Blend uses the same wooden pieces on a restrained green combining surface with a quiet center marker. Tap selection and drag remain supported. Drag coordinates now account for a scaled display; pointer cancellation returns the piece without choosing an answer. Wrong-pair retries lock repeated input until the existing retry finishes.

All three invalidate delayed success/retry work on exit. Build and Blend stop delayed speech/reveal/payout; Pairs cannot advance a board after destroy. Blend stops its guidance loop on merge or exit. Fuse shares Blend's class, so it receives the material and lifecycle improvements, but its activity-specific surface was not redesigned in this batch.

## Verification

- 320×568 browser play: both Pairs boards, mismatch and recovery, rewards, replay, Home; all four Build targets including wrong assembly and scaffolded retry, rewards, replay, Home; all four Blend targets by taps, rewards, replay, Home.
- 1024×768 scaled browser layout: visually inspected all three; actually dragged a Blend part into its partner and advanced with reduced motion.
- 390×844 and 768×1024: visually inspected all three entry layouts with reduced motion. These are layout checks, not additional full play-throughs.
- Final enlarged Pairs/Build targets checked again at 320×568. Before/after comparisons use matching dimensions, seeded content and saved production files.
- Fuse opening screen inspected for shared-renderer compatibility.
- 24 automated tests pass, including new exit-during-completion checks for each game and repeated-input locking during an incorrect Blend retry. JS syntax check passes.
- All gameplay fixtures used a separate QA origin. User saves were not seeded, reset or spent.

Remaining: physical touch hardware, every later form/diacritic and long target, full form-to-isolated Pairs play, mixed-vowel Blend retry in the browser (unit-tested), orientation changes during active input, complete Fuse review, and full saved-reward persistence replay across reloads. No claim that all 227 inventory items or every curriculum variant is finished.

## Recovery and evidence

`.codex-checkpoints/letter-garden-three-20260906/before.tar.gz` preserves pre-pass letters.html, MiniGames.js, the art stylesheet and tests. Extract to a temporary directory, preserve later work, and selectively restore intended files.

The same directory contains `pairs-comparison.jpg`, `build-comparison.jpg`, `blend-comparison.jpg`, baseline/current fixtures and phone/desktop/tablet viewers.
