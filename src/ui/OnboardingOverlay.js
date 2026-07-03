// First-visit onboarding — three warm cards that explain the whole game in
// under thirty seconds: the island premise, how to move and interact, and the
// Courtyard Codex loop. Shows once (persisted flag), gates player movement
// while open, and ends on a choice: explore first, or study right away.
(function (ns) {
  const SEEN_KEY = "miftah-oasis:onboarded";

  const STEPS = [
    {
      icon: "🏝",
      title: "Welcome to Miftah Island",
      body:
        "A little island that grows as you learn the Quran, word by word. " +
        "Every ayah you master feeds its gardens, hatches its animals, and " +
        "wakes up its village.",
    },
    {
      icon: "🧭",
      title: "Explore your island",
      body:
        "Walk with WASD or the arrow keys — on a phone, drag anywhere on the " +
        "left of the screen. When something lights up, press E (or tap the ✋ " +
        "button) to feed a friend, plant a seed, or say salaam.",
    },
    {
      icon: "✒",
      title: "The Courtyard Codex",
      body:
        "Your study desk lives under the Reading Archway — press T or tap ✒ " +
        "any time. Decode ayahs word by word, hear them recited, earn seeds " +
        "and eggs, and collect a badge for every juz. Gold words bloom into " +
        "flowers on the island.",
    },
  ];

  class OnboardingOverlay {
    constructor(game) {
      this.game = game;
      this.step = 0;
      this.isOpen = false;

      this.root = document.createElement("section");
      this.root.className = "onboard-overlay";
      this.root.hidden = true;
      this.root.innerHTML = `
        <div class="onboard-card" role="dialog" aria-modal="true" aria-labelledby="onboard-title">
          <div class="onboard-icon"></div>
          <h2 id="onboard-title"></h2>
          <p class="onboard-body"></p>
          <div class="onboard-dots"></div>
          <div class="onboard-actions"></div>
        </div>
      `;
      document.body.appendChild(this.root);
      this.iconEl = this.root.querySelector(".onboard-icon");
      this.titleEl = this.root.querySelector("#onboard-title");
      this.bodyEl = this.root.querySelector(".onboard-body");
      this.dotsEl = this.root.querySelector(".onboard-dots");
      this.actionsEl = this.root.querySelector(".onboard-actions");
    }

    shouldShow() {
      try {
        return !localStorage.getItem(SEEN_KEY);
      } catch {
        return false;
      }
    }

    open() {
      this.step = 0;
      this.isOpen = true;
      this.root.hidden = false;
      this.render();
    }

    close(thenOpenCodex = false) {
      this.isOpen = false;
      this.root.hidden = true;
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {}
      this.game.sound.play("page");
      if (thenOpenCodex) this.game.trainer.open();
    }

    render() {
      const step = STEPS[this.step];
      this.iconEl.textContent = step.icon;
      this.titleEl.textContent = step.title;
      this.bodyEl.textContent = step.body;

      this.dotsEl.innerHTML = "";
      STEPS.forEach((_, i) => {
        const dot = document.createElement("span");
        dot.className = "onboard-dot" + (i === this.step ? " is-here" : "");
        this.dotsEl.appendChild(dot);
      });

      this.actionsEl.innerHTML = "";
      const last = this.step === STEPS.length - 1;
      if (!last) {
        const skip = this.button("Skip", () => this.close(), "onboard-skip");
        const next = this.button("Next →", () => {
          this.step += 1;
          this.game.sound.play("page");
          this.render();
        });
        this.actionsEl.append(skip, next);
      } else {
        const explore = this.button("🧭 Explore first", () => this.close());
        const study = this.button("✒ Study my first ayah", () => this.close(true));
        this.actionsEl.append(explore, study);
      }
    }

    button(label, onClick, extraClass = "") {
      const b = document.createElement("button");
      b.type = "button";
      b.className = ("onboard-btn " + extraClass).trim();
      b.textContent = label;
      b.addEventListener("click", onClick);
      return b;
    }
  }

  ns.OnboardingOverlay = OnboardingOverlay;
})(window.MiftahGame || (window.MiftahGame = {}));
