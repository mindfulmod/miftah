// Find My Friend (v26, 2026-10-02): the first Letter Friends game, and the
// Brain's source of evidence for the friend skill (letter ↔ friend ↔ sound).
//
// Two looks, chosen by the same one-dimension-at-a-time policy every game
// uses (LettersLearning.profile):
//   match  — a letter is shown and said; which friend is wearing it? The
//            friend's body IS the letter, so this is supported visible
//            matching: the picture teaches the association.
//   listen — only a friend's NAME is heard ("بَطَّة") behind a curtain; which
//            letter does it start with? Plain letters, no pictures. This is
//            the real letter–sound link, and it is independent listening.
// The right answer always ends the same way: the plain letter grows its
// friend's features and the friend calls. A miss only wobbles; after a miss
// the round is assisted (the friend peeks) and the evidence says so.
(function (ns) {
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const charOf = (item) => [...String(item?.display || "")].find((c) => ns.LetterFriends?.FRIENDS?.[c]) || null;

  class FriendFind {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      this.timers = [];
      const F = ns.LetterFriends;
      this.items = [...new Map((ctx.items || []).filter((i) => i?.display && [...i.display].length === 1 && F?.FRIENDS?.[i.display]).map((i) => [i.display, i])).values()];
      // Distractors come from everything the child has met, so even a walk
      // that carries two letters can offer a real choice.
      this.pool = [...new Map([...this.items, ...(ctx.known || [])].filter((i) => i?.display && F?.FRIENDS?.[i.display]).map((i) => [i.display, i])).values()];
      this.rounds = Math.min(ctx.rounds || 4, Math.max(2, this.items.length + 1));
      this.round = 0;
      ctx.stage.innerHTML = `<div class="ff" role="group" aria-label="Find my friend">
        <div class="ff-top"></div>
        <div class="ff-choices"></div>
        <div class="ff-progress" aria-hidden="true">${Array.from({ length: this.rounds }, () => "<i></i>").join("")}</div>
      </div>`;
      this.top = ctx.stage.querySelector(".ff-top");
      this.board = ctx.stage.querySelector(".ff-choices");
      if (this.items.length) this.next(); else this.later(() => this.ctx.done?.(), 400);
    }

    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); return t; }

    next() {
      if (!this.alive) return;
      if (this.round >= this.rounds) return this.finish();
      const F = ns.LetterFriends;
      this.busy = false;
      this.target = this.items[this.round % this.items.length];
      const char = this.target.display;
      const policy = ns.LettersLearning?.profile?.(this.target, { skill: "friend", activity: "FriendFind", beginner: this.ctx.beginner }) || { promptMode: "match", choiceCount: 2 };
      this.mode = policy.promptMode === "listen" && this.ctx.canListen?.() !== false ? "listen" : "match";
      const n = Math.max(2, Math.min(3, policy.choiceCount || 2, this.pool.length));
      const others = shuffle(this.pool.filter((i) => i.display !== char)).slice(0, n - 1);
      this.offered = shuffle([this.target, ...others]);
      this.missed = false;
      this.heard = false;
      this.ctx.stage.querySelectorAll(".ff-progress i").forEach((dot, i) => { dot.className = i < this.round ? "is-done" : i === this.round ? "is-on" : ""; });
      if (this.mode === "match") {
        this.top.innerHTML = `<button type="button" class="ff-sign" aria-label="Hear the letter">${F.art(char, { size: 120, mode: "plain" })}</button>`;
        this.board.innerHTML = this.offered.map((item, i) => `<button type="button" class="ff-card" data-i="${i}" aria-label="${F.get(item.display).en}">${F.art(item.display, { size: 120 })}</button>`).join("");
      } else {
        this.top.innerHTML = `<button type="button" class="ff-curtain" aria-label="Hear my friend's name"><svg viewBox="0 0 120 120" aria-hidden="true"><path d="M14 18H106V102H14Z" fill="#c25a49" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/><path d="M60 18V102" stroke="#8a3a2d" stroke-width="3"/><path d="M28 18Q34 60 26 102M46 18Q50 60 44 102M74 18Q70 60 76 102M92 18Q86 60 94 102" fill="none" stroke="#ee806f" stroke-width="3"/><text x="60" y="66" text-anchor="middle" font-size="40" fill="#ffe49a" font-family="ui-rounded, system-ui">?</text></svg><span class="ff-peek" hidden>${F.art(char, { size: 90 })}</span></button>`;
        this.board.innerHTML = this.offered.map((item, i) => `<button type="button" class="ff-card is-letter" data-i="${i}" aria-label="${item.display}">${F.art(item.display, { size: 110, mode: "plain" })}</button>`).join("");
      }
      this.top.firstElementChild.onclick = () => this.speak();
      this.board.querySelectorAll(".ff-card").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      this.ctx.prompt?.(this.mode === "match" ? this.target : null);
      this.later(() => this.speak(), 250);
    }

    speak() {
      if (!this.alive || !this.target) return;
      const F = ns.LetterFriends;
      let result;
      try { result = this.mode === "match" ? this.ctx.say?.(this.target) : this.ctx.say?.(F.item(this.target.display)); } catch { result = false; }
      if (result?.then) result.then((heard) => { if (heard === true) this.heard = true; }, () => {});
      else if (result === true) this.heard = true;
    }

    replayPrompt() { this.speak(); }

    pick(i, button) {
      if (!this.alive || this.busy) return;
      const chosen = this.offered[i];
      const correct = chosen.display === this.target.display;
      // Matching with the picture is honest supported evidence; only a miss
      // (after which the friend peeks or the answer glows) makes it assisted.
      const independent = this.mode === "listen" && !this.missed;
      this.ctx.reportOutcome?.({ item: this.target, itemId: this.target.id || this.target.display, activity: "FriendFind", skill: "friend", correct,
        evidence: independent ? "independent_listening" : "supported_visible_matching", assisted: !!this.missed,
        selectedId: chosen.id || chosen.display, choiceIds: this.offered.map((o) => o.id || o.display), affectsStrength: true });
      if (!correct) {
        this.missed = true;
        this.ctx.sfx?.("softwrong");
        if (!this.ctx.reducedMotion?.()) button.animate?.([{ transform: "rotate(0)" }, { transform: "rotate(-6deg)" }, { transform: "rotate(6deg)" }, { transform: "rotate(0)" }], { duration: 360 });
        // The friend peeks out from behind the curtain: help, never a penalty.
        const peek = this.top.querySelector(".ff-peek");
        if (peek) { peek.hidden = false; this.top.firstElementChild.classList.add("is-peeking"); }
        this.board.querySelectorAll(".ff-card").forEach((b, k) => b.classList.toggle("is-hint", this.offered[k].display === this.target.display));
        this.later(() => this.speak(), 500);
        return;
      }
      this.busy = true;
      const F = ns.LetterFriends;
      const svg = button.querySelector("svg.lf");
      // The payoff: a plain letter grows its friend (or a friend card glows).
      if (svg?.classList.contains("is-plain")) {
        svg.classList.remove("is-plain");
        svg.classList.add("is-growing");
      }
      button.classList.add("is-right");
      this.board.querySelectorAll(".ff-card").forEach((b) => { if (b !== button) b.classList.add("is-away"); });
      this.ctx.correct?.();
      this.ctx.confettiAt?.(button);
      this.ctx.pet?.cheer?.();
      this.later(() => this.ctx.sfx?.(F.get(this.target.display).call), 420);
      this.later(() => this.ctx.say?.(F.item(this.target.display)), 900);
      this.round += 1;
      this.later(() => this.next(), 2600);
    }

    finish() {
      this.ctx.sfx?.("cheer2");
      this.later(() => this.ctx.done?.(), 600);
    }

    destroy() { this.alive = false; this.timers.forEach(clearTimeout); }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  ns.GardenPractice.FriendFind = FriendFind;
})(window.MiftahGame || (window.MiftahGame = {}));
