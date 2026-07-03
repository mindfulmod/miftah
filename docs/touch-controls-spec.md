# Touch Controls & Mobile Play Spec

Mobile is the primary way this game will be played; desktop is the
prototyping bench. This spec makes the full island loop — walk, interact,
feed, collect, open the Codex and Album — playable with thumbs, as an
**additive layer**: keyboard behavior is untouched, and no gameplay system
(Player, CollisionMap, InteractionSystem) changes at all.

## Design decisions (settled — do not relitigate during implementation)

**Movement: floating virtual joystick, not tap-to-move.**
Tap-to-move reads as the "cozier" option, but it requires pathfinding (A*
over tiles + prop colliders), unreachable-tap handling, and path-following
that fights the sample-based CollisionMap at collider corners — a whole new
system with new failure modes. A joystick synthesizes exactly what
`InputManager.vector()` already returns, so the entire existing
movement/collision stack is reused untouched. Tap-to-move can layer on
later (a tap just becomes a vector generator toward a target); the
joystick is the foundation either way.

**Interact: one context-action button, not tap-on-entity.**
The game already computes the nearest interactable and a human label every
frame (`interaction.current` / `interaction.actionHint`). A single button
that mirrors that state is the Animal-Crossing/console pattern: walk close,
the button lights up and names the action, tap it. Tap-on-entity would
duplicate InteractionSystem's targeting in screen space, conflict with the
joystick's spawn zone, and need "too far away" messaging. One button, zero
InteractionSystem changes.

**Coexistence: additive, never a mode.**
Touch controls appear when touch is used and keyboard keeps working
underneath forever (hybrid devices exist). No settings toggle, no
exclusivity.

## Touch layer detection

- Instantiate the layer at boot but keep it `hidden`.
- Reveal it on the **first `pointerdown` with `pointerType === "touch"`**
  anywhere on the page — actual use is the only reliable signal
  (`maxTouchPoints > 0` false-positives on touch laptops driven by mouse).
- Once revealed, it stays for the session. A later keydown does not hide it.
- The existing audio unlock already listens on `pointerdown`, so the first
  touch also starts the sound/ambience — no extra work, but keep that
  listener intact.
- `#game-canvas` already sets `touch-action: none`; the touch layer's own
  elements must also set it so drags never become page scroll/zoom.

## Virtual joystick

- **Spawn zone**: the left 55% of the screen, excluding any open DOM
  overlay (Codex/Album/editor swallow their own events anyway — see
  "Overlay interplay"). On `pointerdown` in the zone, the base ring centers
  on the touch point; the knob tracks the finger.
- **Geometry**: base ring ⌀120 px, knob ⌀56 px, clamp radius 60 px from the
  base center. When the finger travels past the clamp, the knob pins to the
  rim; the base does **not** chase the finger (chasing causes constant
  overcorrection).
- **Deadzone**: 12 px — inside it the output is `{0,0}` so a resting thumb
  doesn't drift.
- **Output**: `{x, y}` scaled so full deflection = magnitude 1 (allow
  analog sub-1 magnitudes between deadzone and rim; `Player.update`
  multiplies by speed already, so partial deflection = slower walk for
  free).
- **Release** (`pointerup` / `pointercancel`): output snaps to `{0,0}`,
  ring fades out ~120 ms.
- **Multi-touch**: the joystick binds to its `pointerId` via
  `setPointerCapture`; all other pointers are ignored for movement so a
  second thumb on the interact button can't yank the stick.
- **Style**: translucent, matching the wood/gold HUD language — base
  `rgba(42, 25, 13, 0.5)` with a 2 px `var(--codex-gold-dim)` ring, knob
  gold gradient (`--codex-gold-bright` → `--codex-gold`), overall ~0.85
  opacity so the world stays visible beneath.

## Context-action button

- **Placement**: fixed bottom-right, ⌀68 px (well above the 44 px floor used
  in the Codex mobile CSS), `env(safe-area-inset-right/bottom)` padding.
- **Tap** = one edge-triggered interact press, identical to `KeyE`/`Space`.
- **State mirrors `interaction.actionHint` every frame**:
  - Nothing in range → dim hand icon (✋), ~55% opacity, still tappable
    (harmless no-op, matches E-key behavior).
  - Target in range → full opacity + soft gold pulse, plus a one-word verb
    derived from the hint ("Feed", "Study", "Harvest", "Pick up", "Talk");
    fall back to "!" if no verb maps. Full hint text is NOT squeezed into
    the button — the on-canvas hint line remains the long-form label.
- Suppressed (hidden) while Codex/Album/editor are open.

## Codex & Album access without a keyboard

- Two ⌀44 px icon buttons, top-right column under the HUD area, safe-area
  aware: ✒ opens the Codex (same path as `T`), 🌿 opens the Album (same
  path as `B`). They call the exact same `trainer.open()` / `album.toggle()`
  code the keydown branches use — including the editMode/trainer guards.
- **No touch access, deliberately**: `R` reset (destructive — if ever
  needed on mobile, bury it in a menu, never a bare button), `F2` editor
  and `C` collision debug (dev tools, keyboard-only forever).

## Mobile HUD compaction (required — the HUD overflows phones today)

The canvas HUD draws a 382 px "Oasis Progress" panel and a 218 px
"Controls" panel; at 375 px CSS width they overflow and overlap. When the
touch layer is active **or** `game.screenWidth < 560`:

- Skip the "Controls" panel entirely (keyboard text is dead weight on
  touch; the buttons themselves are the affordance).
- Draw a compact progress strip instead of the big panel: one row, full
  available width minus margins — seed icon + count, feed count,
  `Egg n/n`, and the action hint on a second line. Reuse the existing
  `panel()` helper at reduced height (~64 px) rather than inventing a new
  visual language.
- The dialogue box and tooltips already center on-screen; leave them.

## Overlay interplay

- Codex, Album, and the F2 editor are DOM overlays stacked above the
  canvas; while any is open the touch layer hides (`hidden = true` on its
  root) so its buttons can't be pressed through and the joystick can't
  spawn behind them. Re-show on close. `Game.update` already gates player
  movement on `uiOpen` — unchanged.
- Cutaways: `Game.update` skips player movement during a cutaway; joystick
  input during one is safely ignored (vector is read but unused). Keep the
  layer visible so it doesn't flicker.

## Integration contract (files and exact seams)

- **New: `src/ui/TouchControls.js`** — DOM overlay class in the
  `EditModeUI`/`TrainerOverlay` pattern: builds its own element tree on
  `document.body`, all logic self-contained. Public surface:
  - `vector()` → `{x, y}` (deadzone/clamp applied), `{0,0}` when idle
  - `consumeInteract()` → edge-triggered bool (true once per tap)
  - `active` → bool, true after first real touch (drives HUD compaction)
  - `setVisible(visible)` → called when overlays open/close
- **`src/core/InputManager.js`** — `attachTouch(touch)` stores the ref.
  `vector()`: if the touch vector is non-zero, return it, else the keyboard
  vector (priority, not blending — blended vectors feel broken on hybrids).
  `wasPressed`/`consume`: for `"KeyE"`/`"Space"` also OR in
  `touch.consumeInteract()`. Result: Player and InteractionSystem need
  **zero changes**.
- **`src/core/Game.js`** — construct `this.touch` alongside the other UI,
  call `this.input.attachTouch(this.touch)`, and pass overlay open/close
  through to `touch.setVisible(...)` (one line in the same places
  `uiOpen` is computed, or callbacks from the overlays' open/close — keep
  it in Game, the overlays shouldn't know about touch).
- **`src/ui/HUD.js`** — compaction branch per the HUD section, keyed on
  `game.touch?.active || game.screenWidth < 560`.
- **`styles/main.css`** — `.touch-*` rules using the existing custom
  properties; `touch-action: none` on every touch-layer element;
  `env(safe-area-inset-*)` on the fixed positions.
- **`index.html`** — script tag for `TouchControls.js` before `Game.js`.

## Out of scope (this pass)

- Tap-to-move / pathfinding (future layer on top of the joystick).
- Camera pan or pinch-zoom; world render scale changes.
- Haptics (Vibration API).
- Any change to Codex/Album internals — they are already touch-friendly DOM.

## Acceptance checklist

1. Desktop, mouse+keyboard only: touch layer never appears; HUD unchanged
   (≥560 px); all shortcuts (WASD/E/Space/T/B/R/F2/C) behave exactly as
   before.
2. 375×812 viewport with synthesized `pointerType:"touch"` events:
   - first touch reveals the layer and starts audio ambience;
   - joystick spawns under the touch in the left zone, walks the player in
     all 8 directions, partial deflection walks slower, release stops
     cleanly, deadzone holds still;
   - collision behavior identical to keyboard (blocked by water/props);
   - context button shows ✋ idle, lights up with a verb near the fountain
     /an animal/a gift, and a tap performs the interaction (verify one
     feed with heart+chime and one gift pickup);
   - ✒ and 🌿 buttons open/close Codex and Album; touch layer hides while
     they're open and returns after;
   - compact HUD strip replaces both panels, nothing overflows 375 px.
3. Hybrid: after using touch, WASD and E still work; keyboard use does not
   hide the touch layer.
4. No console errors; F2 editor still works with the mouse on desktop.

---
*Implementation task: Sonnet — every decision above is settled; the work
is one new file plus four small seams in existing ones.*
