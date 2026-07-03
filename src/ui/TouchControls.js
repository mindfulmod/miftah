// Touch control layer — floating virtual joystick + context action button,
// per docs/touch-controls-spec.md. Purely additive: it synthesizes the same
// vector InputManager.vector() returns and the same edge-triggered interact
// press as KeyE/Space, so Player, CollisionMap and InteractionSystem are
// untouched. Keyboard keeps working underneath forever (hybrid devices).
//
// The layer exists from boot but stays hidden until the first pointerdown
// with pointerType "touch" — actual use is the only reliable touch signal.
// Once revealed it stays for the session; a later keydown does not hide it.
(function (ns) {
  const CLAMP = 60; // px from base center to knob rim
  const DEADZONE = 12; // px of resting-thumb slack
  const ZONE_FRACTION = 0.55; // joystick spawns in the left 55% of the screen

  // One-word verbs for the action button. The full hint stays on the canvas
  // hint line; the button only needs the verb.
  const VERBS = ["Feed", "Talk", "Study", "Harvest", "Plant", "Water", "Pick", "Open", "Pet", "Collect", "Read"];

  class TouchControls {
    constructor(game) {
      this.game = game;
      this.active = false; // true after the first real touch anywhere
      this.visible = true; // Game gates this while overlays are open
      this.pointerId = null;
      this.vec = { x: 0, y: 0 };
      this.interactQueued = false;
      this.lastHint = null;

      this.root = document.createElement("div");
      this.root.className = "touch-layer";
      this.root.hidden = true;
      this.root.innerHTML = `
        <div class="touch-zone"></div>
        <div class="touch-stick" hidden>
          <div class="touch-knob"></div>
        </div>
        <button class="touch-action" type="button" aria-label="Interact">
          <span class="touch-action-icon">✋</span>
          <span class="touch-action-verb"></span>
        </button>
        <div class="touch-menu">
          <button class="touch-codex" type="button" aria-label="Open the Courtyard Codex">✒</button>
          <button class="touch-album" type="button" aria-label="Open the Garden Album">🌿</button>
        </div>
      `;
      document.body.appendChild(this.root);

      this.zone = this.root.querySelector(".touch-zone");
      this.stick = this.root.querySelector(".touch-stick");
      this.knob = this.root.querySelector(".touch-knob");
      this.actionBtn = this.root.querySelector(".touch-action");
      this.actionIcon = this.root.querySelector(".touch-action-icon");
      this.actionVerb = this.root.querySelector(".touch-action-verb");

      // Reveal on first genuine touch. Passive: never steals the event, so
      // the existing audio-unlock pointerdown listener still fires.
      window.addEventListener(
        "pointerdown",
        (event) => {
          if (event.pointerType !== "touch" || this.active) return;
          this.active = true;
          this.sync();
        },
        { passive: true }
      );

      this.zone.addEventListener("pointerdown", (event) => this.onStickDown(event));
      this.zone.addEventListener("pointermove", (event) => this.onStickMove(event));
      this.zone.addEventListener("pointerup", (event) => this.onStickUp(event));
      this.zone.addEventListener("pointercancel", (event) => this.onStickUp(event));

      // pointerdown (not click) so the press registers even mid-walk with the
      // other thumb captured by the joystick.
      this.actionBtn.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.interactQueued = true;
      });

      // Same paths and guards as the T/B keydown branches in Game.update.
      this.root.querySelector(".touch-codex").addEventListener("click", () => {
        const g = this.game;
        if (g.editMode?.active) return;
        if (g.trainer.isOpen) g.trainer.close();
        else g.trainer.open();
      });
      this.root.querySelector(".touch-album").addEventListener("click", () => {
        const g = this.game;
        if (g.editMode?.active || g.trainer?.isOpen) return;
        g.album.toggle();
      });
    }

    // ---------- joystick ----------

    onStickDown(event) {
      if (event.pointerType !== "touch" || this.pointerId !== null) return;
      if (event.clientX > window.innerWidth * ZONE_FRACTION) return;
      this.pointerId = event.pointerId;
      // Capture binds the drag to this finger so a second thumb on the action
      // button can't yank the stick. Non-fatal if it fails (synthetic events).
      try {
        this.zone.setPointerCapture(event.pointerId);
      } catch {}
      this.base = { x: event.clientX, y: event.clientY };
      this.stick.hidden = false;
      this.stick.classList.remove("is-fading");
      this.stick.style.left = `${this.base.x}px`;
      this.stick.style.top = `${this.base.y}px`;
      this.moveKnob(0, 0);
      event.preventDefault();
    }

    onStickMove(event) {
      if (event.pointerId !== this.pointerId) return;
      const dx = event.clientX - this.base.x;
      const dy = event.clientY - this.base.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= DEADZONE) {
        this.vec = { x: 0, y: 0 };
        this.moveKnob(dx, dy);
        return;
      }
      const clamped = Math.min(dist, CLAMP);
      // Full deflection = magnitude 1; partial deflection walks slower for
      // free because Player.update multiplies by speed.
      const scale = clamped / CLAMP / dist;
      this.vec = { x: dx * scale, y: dy * scale };
      this.moveKnob((dx / dist) * clamped, (dy / dist) * clamped);
    }

    onStickUp(event) {
      if (event.pointerId !== this.pointerId) return;
      this.pointerId = null;
      this.vec = { x: 0, y: 0 };
      this.stick.classList.add("is-fading");
      setTimeout(() => {
        if (this.pointerId === null) this.stick.hidden = true;
      }, 140);
    }

    moveKnob(dx, dy) {
      this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }

    // ---------- public surface (see spec: Integration contract) ----------

    vector() {
      return this.vec;
    }

    // Edge-triggered: true exactly once per tap of the action button.
    consumeInteract() {
      const queued = this.interactQueued;
      this.interactQueued = false;
      return queued;
    }

    setVisible(visible) {
      if (this.visible === visible) return;
      this.visible = visible;
      if (!visible) {
        // Drop any in-flight drag so the stick can't wedge "on" behind an overlay.
        this.pointerId = null;
        this.vec = { x: 0, y: 0 };
        this.stick.hidden = true;
        this.interactQueued = false;
      }
      this.sync();
    }

    sync() {
      this.root.hidden = !(this.active && this.visible);
    }

    // Called once per frame from Game.update: mirror the interaction state
    // onto the action button (DOM writes only when the hint changes).
    update(game) {
      if (this.root.hidden) return;
      const hint = game.interaction.current ? game.interaction.actionHint : "";
      if (hint === this.lastHint) return;
      this.lastHint = hint;
      if (!hint) {
        this.actionBtn.classList.remove("is-ready");
        this.actionIcon.textContent = "✋";
        this.actionVerb.textContent = "";
        return;
      }
      const verb = VERBS.find((v) => hint.toLowerCase().startsWith(v.toLowerCase()));
      this.actionBtn.classList.add("is-ready");
      this.actionIcon.textContent = verb ? "" : "!";
      this.actionVerb.textContent = verb || "";
    }
  }

  ns.TouchControls = TouchControls;
})(window.MiftahGame || (window.MiftahGame = {}));
