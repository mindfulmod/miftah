// Letter Balloons (v24, 2026-10-02): free play for the very youngest. Big
// balloons drift slowly up the sky, each carrying a letter; touch one and it
// pops and says its letter, and a new one floats up from below. Nothing is
// scored or reported and nothing can go wrong — it is about hearing letters
// and the joy of popping. Balloons are 96px and slow, for two-year-old hands.
(function (ns) {
  const COLORS = ["#ffa798", "#96ecff", "#b7e779", "#ffe49a", "#b49fcf", "#ee806f"];
  const balloonArt = (c, letter) => `<svg viewBox="0 0 100 140" aria-hidden="true">
    <path d="M50 104Q44 120 52 138" fill="none" stroke="#a89478" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M50 6C24 6 10 28 10 50C10 76 30 98 50 104C70 98 90 76 90 50C90 28 76 6 50 6Z" fill="${c}" stroke="#4a3620" stroke-width="3"/>
    <path d="M44 104L50 112L56 104Z" fill="${c}" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M28 30Q34 18 46 16" fill="none" stroke="#fffdf7" stroke-width="6" stroke-linecap="round" opacity=".8"/>
    <circle cx="50" cy="54" r="28" fill="#fffaf0" opacity=".9"/>
    <text x="50" y="56" text-anchor="middle" dominant-baseline="central" font-family="'Amiri Quran', serif" font-size="34" fill="#4a3620" direction="rtl">${letter}</text>
  </svg>`;

  class LetterBalloons {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      const known = (ctx.items || []).filter((i) => i?.display && [...i.display].length === 1);
      this.letters = known.length ? known : (ctx.starter || []);
      this.reduced = !!ctx.reducedMotion?.();
      this.n = 0;
      ctx.stage.innerHTML = `<div class="balloons${this.reduced ? " is-still" : ""}" role="group" aria-label="Letter balloons"></div>`;
      this.sky = ctx.stage.querySelector(".balloons");
      for (let i = 0; i < 6; i += 1) this.add(i, true);
      ctx.prompt?.(null);
    }

    add(slot, first = false) {
      if (!this.alive || !this.letters.length) return;
      // Every letter takes its turn: a simple rotation through the set.
      const item = this.letters[this.n++ % this.letters.length];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "balloon";
      b.setAttribute("aria-label", `Pop the ${item.display} balloon`);
      // Three lanes that always fit the sky; the second balloon in a lane
      // rides half a cycle behind the first, so they never overlap.
      const lane = slot % 3, rise = 15 + lane * 2;
      b.style.left = `calc(${[4, 50, 96][lane]}% - ${[0, 48, 96][lane]}px)`;
      b.style.setProperty("--rise", `${rise}s`);
      b.style.setProperty("--sway", `${lane % 2 ? 12 : -12}px`);
      if (first && !this.reduced) b.style.animationDelay = `${-(slot > 2 ? rise / 2 : 0) - lane * 1.6}s`;
      if (this.reduced) { b.style.top = `${slot > 2 ? 52 : 10}%`; }
      b.innerHTML = balloonArt(COLORS[(this.n + slot) % COLORS.length], item.display);
      b.addEventListener("click", () => this.pop(b, item, slot));
      this.sky.appendChild(b);
    }

    pop(b, item, slot) {
      if (!this.alive || b.classList.contains("is-popped")) return;
      b.classList.add("is-popped");
      this.ctx.sfx?.("pop");
      this.ctx.say?.(item);
      this.ctx.confettiAt?.(b);
      this.ctx.pet?.cheer?.();
      setTimeout(() => { b.remove(); this.add(slot); }, this.reduced ? 200 : 420);
    }

    replayPrompt() {}
    destroy() { this.alive = false; }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  ns.GardenPractice.LetterBalloons = LetterBalloons;
})(window.MiftahGame || (window.MiftahGame = {}));
