// Garden Together (v20, 2026-10-02): siblings play side by side on one
// device. A cooperative letter-pairs game — the two children's pets take
// turns, every match goes into one shared basket, and when the last pair is
// found both pets celebrate together. No winner, no score, nothing reported.
(function (ns) {
  const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(([, v]) => v);

  class GardenTogether {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      const letters = shuffle((ctx.items || []).filter((i) => i?.display && [...i.display].length === 1)).slice(0, 4);
      this.cards = shuffle(letters.flatMap((l, k) => [{ ...l, pair: k }, { ...l, pair: k }]));
      this.turn = 0;
      this.open = [];
      this.found = 0;
      this.pairs = letters.length;
      ctx.stage.innerHTML = `<div class="together">
        <div class="together-pets">
          <span class="together-pet is-turn" data-player="0" aria-label="First player's turn">${ctx.petA}</span>
          <span class="together-basket" aria-label="Pairs found together"></span>
          <span class="together-pet" data-player="1" aria-label="Second player">${ctx.petB}</span>
        </div>
        <div class="together-board" role="group" aria-label="Find the matching letters">${this.cards.map((c, i) => `<button type="button" class="together-card" data-card="${i}" aria-label="Card ${i + 1}"><span class="together-back" aria-hidden="true"></span><span class="together-face" aria-hidden="true">${c.display}</span></button>`).join("")}</div>
      </div>`;
      this.pets = [...ctx.stage.querySelectorAll(".together-pet")];
      this.basket = ctx.stage.querySelector(".together-basket");
      ctx.stage.querySelectorAll(".together-card").forEach((b) => b.addEventListener("click", () => this.flip(Number(b.dataset.card), b)));
      ctx.prompt?.(null);
    }

    flip(i, button) {
      if (!this.alive || this.busy || button.classList.contains("is-up") || button.classList.contains("is-matched")) return;
      button.classList.add("is-up");
      button.setAttribute("aria-label", `Letter ${this.cards[i].display}`);
      this.ctx.say?.(this.cards[i]);
      this.open.push([i, button]);
      if (this.open.length < 2) return;
      this.busy = true;
      const [[a, ba], [b, bb]] = this.open;
      this.open = [];
      const match = this.cards[a].pair === this.cards[b].pair;
      setTimeout(() => {
        if (!this.alive) return;
        if (match) {
          ba.classList.add("is-matched"); bb.classList.add("is-matched");
          this.found += 1;
          const tag = document.createElement("i");
          tag.textContent = this.cards[a].display;
          this.basket.appendChild(tag);
          this.ctx.sfx?.("chime");
          this.cheer(this.turn);
          this.ctx.confettiAt?.(ba);
        } else {
          ba.classList.remove("is-up"); bb.classList.remove("is-up");
          ba.setAttribute("aria-label", "Card"); bb.setAttribute("aria-label", "Card");
          this.ctx.sfx?.("rustle");
        }
        // Turns always pass: it is a game of taking turns, not of streaks.
        this.turn = 1 - this.turn;
        this.pets.forEach((p, k) => p.classList.toggle("is-turn", k === this.turn));
        this.busy = false;
        if (this.found >= this.pairs) this.finish();
      }, match ? 500 : 1100);
    }

    cheer(k) {
      const p = this.pets[k];
      if (!p) return;
      p.classList.remove("is-cheer"); void p.offsetWidth; p.classList.add("is-cheer");
      this.ctx.voice?.(k);
    }

    finish() {
      this.pets.forEach((p, k) => { p.classList.remove("is-turn"); setTimeout(() => this.cheer(k), k * 260); });
      this.ctx.sfx?.("cheer2");
      setTimeout(() => this.alive && this.ctx.done?.(), 2200);
    }

    replayPrompt() {}
    destroy() { this.alive = false; }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  ns.GardenPractice.GardenTogether = GardenTogether;
})(window.MiftahGame || (window.MiftahGame = {}));
