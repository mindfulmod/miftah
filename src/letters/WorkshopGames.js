// The Letter Workshop (v34, 2026-10-03): the last two Big Brain Academy ideas
// worth keeping (multiplayer set aside on purpose).
//
//   BuildLetter ← DS "Get in Shape": "select the pieces used to build it".
//               A letter is made of a body and its dots. Pick the body, then
//               the dots, and the letter comes together — then grows into its
//               friend. At first a dotted outline shows the letter (matching);
//               once its shape is known, the letter is only HEARD and built
//               from memory (that is real evidence). A sprout gets the body
//               already in place and just chooses the dots.
//   FillGap     ← Switch "Frame Filler": a picture and its Arabic name, with
//               the first letter missing. Which letter fills the gap? The word
//               comes together and is said. Pictures never wear their letter;
//               where a letter has no picture, its friend appears WITHOUT its
//               body (features only), so the answer must come from the sound.
//
// Same rules: nothing timed or scored; a miss only wobbles and the right piece
// glows; evidence only when honest.
(function (ns) {
  const INK = "#4a3620";
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const F = () => ns.LetterFriends;
  const S = () => ns.LettersStrokes;
  const nameOf = (c) => (ns.LETTERS_DATA?.packs || []).flatMap((p) => p.letters).find((l) => l.char === c)?.arName || c;
  const item = (c) => ({ id: c, display: c, speak: nameOf(c) });
  const knownChars = (ctx) => [...new Set([...(ctx.items || []), ...(ctx.known || [])].map((i) => i?.display).filter((c) => F()?.FRIENDS?.[c]))];
  const bodyOf = (c) => (S()?.LETTERS?.[c] || []).filter((s) => typeof s === "string");
  const dotsOf = (c) => (S()?.LETTERS?.[c] || []).filter((s) => s && s.dot).map((s) => s.dot);
  const bodyKey = (c) => bodyOf(c).join("|");
  const dotKey = (c) => dotsOf(c).map((d) => d.join(",")).join(";");

  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.timers = [];
      ctx.stage.innerHTML = `<div class="ws ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
    }
    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); }
    dots(n, at) { return `<div class="pz-progress" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < at ? "is-done" : i === at ? "is-on" : ""}"></i>`).join("")}</div>`; }
    wobble(el) { if (!this.ctx.reducedMotion?.()) el?.animate?.([{ rotate: "0deg" }, { rotate: "-8deg" }, { rotate: "8deg" }, { rotate: "0deg" }], { duration: 360 }); }
    say(it) {
      let r; try { r = this.ctx.say?.(it); } catch { r = false; }
      if (r?.then) r.then((h) => { if (h === false) this.heard = false; }, () => {});
      return r;
    }
    replayPrompt() {}
    destroy() { this.alive = false; this.timers.forEach(clearTimeout); }
  }

  // ---------- Build the Letter ----------
  const bodySVG = (c, cls = "", size = 80) => `<svg class="ws-piece-art ${cls}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${bodyOf(c).map((d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" data-ribbon/>`).join("")}</svg>`;
  // A dot choice shows the dots where they sit, over a faint ghost of the body.
  const dotsSVG = (dots, ghostOf, size = 80) => `<svg class="ws-piece-art" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${bodyOf(ghostOf).map((d) => `<path d="${d}" fill="none" stroke="#e5dcc8" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" data-ribbon/>`).join("")}${dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${INK}"/>`).join("")}</svg>`;

  class BuildLetter extends Base {
    constructor(ctx) {
      super(ctx, "ws-build", "Build the letter");
      this.known = knownChars(ctx).filter((c) => bodyOf(c).length);
      // A sprout's body is already in place, so only letters with dots to add.
      if (ctx.beginner && this.known.filter((c) => dotsOf(c).length).length >= 2) this.known = this.known.filter((c) => dotsOf(c).length);
      const firsts = (ctx.items || []).map((i) => i.display).filter((c) => this.known.includes(c));
      this.order = [...new Set([...firsts, ...shuffle(this.known)])];
      this.rounds = Math.min(4, this.order.length); this.round = 0;
      if (this.known.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      const c = this.order[this.round];
      this.target = c; this.missed = false; this.heard = true; this.busy = false;
      // Outline until the letter's shape is known; then build it from its sound.
      const shape = ns.gardenBrain?.skills?.(c)?.shape || 0;
      this.fromMemory = !this.ctx.beginner && shape >= 0.4 && this.ctx.canListen?.() !== false;
      this.step = this.ctx.beginner ? "dots" : "body";
      if (this.ctx.beginner && !dotsOf(c).length) this.step = "body"; // a dotless letter is all body
      this.root.innerHTML = `
        <div class="ws-frame">
          <svg class="ws-target" viewBox="0 0 100 100" aria-hidden="true">
            ${this.fromMemory ? "" : `${bodyOf(c).map((d) => `<path class="ws-ghost" d="${d}" fill="none" stroke="#c9bda4" stroke-width="12" stroke-dasharray="2 6" stroke-linecap="round" stroke-linejoin="round" data-ribbon/>`).join("")}${dotsOf(c).map(([x, y]) => `<circle class="ws-ghost" cx="${x}" cy="${y}" r="7" fill="none" stroke="#c9bda4" stroke-width="2.4" stroke-dasharray="2 3"/>`).join("")}`}
            <g class="ws-built-body"></g><g class="ws-built-dots"></g>
          </svg>
          <span class="ws-friend" aria-hidden="true"></span>
        </div>
        <div class="ws-tray"></div>
        ${this.dots(this.rounds, this.round)}`;
      if (this.ctx.beginner) this.place("body");
      this.offer();
      this.ctx.beginRound?.(item(c), "letter-form");
      if (this.fromMemory) this.later(() => this.say(item(c)), 300);
    }
    // The tray offers the pieces for the current step.
    offer() {
      const c = this.target, n = this.ctx.beginner ? 2 : 3;
      if (this.step === "body") {
        const others = shuffle([...new Set(this.known.filter((o) => bodyKey(o) !== bodyKey(c)).map(bodyKey))]).slice(0, n - 1)
          .map((k) => this.known.find((o) => bodyKey(o) === k));
        this.choices = shuffle([c, ...others]).map((o) => ({ key: bodyKey(o), char: o }));
        this.tray(this.choices.map((ch) => bodySVG(ch.char)));
      } else {
        // Dot patterns from the target's own family first (the real trap),
        // then any other pattern; "no dots" only appears as a real option.
        const fam = this.known.filter((o) => bodyKey(o) === bodyKey(c));
        const pool = [...new Set([...fam, ...shuffle(this.known)].map(dotKey))].filter((k) => k !== dotKey(c));
        const keys = shuffle([dotKey(c), ...pool.slice(0, n - 1)]);
        this.choices = keys.map((k) => ({ key: k, dots: k ? k.split(";").map((p) => p.split(",").map(Number)) : [] }));
        this.tray(this.choices.map((ch) => dotsSVG(ch.dots, c)));
      }
    }
    tray(arts) {
      const tray = this.root.querySelector(".ws-tray");
      tray.innerHTML = arts.map((a, i) => `<button type="button" class="ws-piece" data-i="${i}" aria-label="Piece ${i + 1}">${a}</button>`).join("");
      tray.querySelectorAll(".ws-piece").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
    }
    place(step) {
      const c = this.target;
      if (step === "body") this.root.querySelector(".ws-built-body").innerHTML = bodyOf(c).map((d) => `<path class="ws-in" d="${d}" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" data-ribbon/>`).join("");
      else this.root.querySelector(".ws-built-dots").innerHTML = dotsOf(c).map(([x, y]) => `<circle class="ws-in" cx="${x}" cy="${y}" r="7" fill="${INK}"/>`).join("");
    }
    pick(i, btn) {
      if (this.busy) return;
      const want = this.step === "body" ? bodyKey(this.target) : dotKey(this.target);
      const right = this.choices[i].key === want;
      if (!right) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".ws-piece").forEach((b, k) => b.classList.toggle("is-hint", this.choices[k].key === want));
        return;
      }
      this.ctx.sfx?.("click");
      this.place(this.step);
      if (this.step === "body" && dotsOf(this.target).length) { this.step = "dots"; this.offer(); return; }
      this.complete();
    }
    complete() {
      this.busy = true;
      const c = this.target;
      // One honest report per letter: built from memory, or matched to the outline.
      const independent = this.fromMemory && !this.missed && this.heard !== false;
      this.ctx.reportOutcome?.({ item: item(c), itemId: c, activity: "BuildLetter", skill: "letter-form", correct: true,
        evidence: independent ? "independent_listening" : "supported_visible_matching", assisted: !!this.missed, affectsStrength: true });
      this.root.querySelector(".ws-tray").innerHTML = "";
      // The letter grows into its friend.
      this.root.querySelector(".ws-friend").innerHTML = F().art(c, { size: 200 });
      this.root.querySelector(".ws-frame").classList.add("is-built");
      this.ctx.correct?.(); this.ctx.confettiAt?.(this.root.querySelector(".ws-frame")); this.ctx.pet?.cheer?.();
      this.later(() => this.ctx.sfx?.(F().get(c).call), 400);
      this.later(() => this.say(item(c)), 900);
      this.round += 1;
      this.later(() => this.next(), 2700);
    }
    replayPrompt() { if (this.target) this.say(item(this.target)); }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800); }
  }

  // ---------- Fill the Gap ----------
  class FillGap extends Base {
    constructor(ctx) {
      super(ctx, "ws-gap", "Fill the gap");
      this.known = knownChars(ctx);
      const P = ns.PictureWords;
      // A picture for each letter where we have one; else the friend's name.
      const wanted = (ctx.items || []).map((i) => i.display).filter((c) => this.known.includes(c));
      const letters = [...new Set([...wanted, ...shuffle(this.known)])];
      this.cards = letters.slice(0, ctx.beginner ? 3 : 4).map((c) => {
        const pics = P?.byChar(c) || [];
        const p = pics.length ? pics[Math.floor(Math.random() * pics.length)] : null;
        return p ? { char: c, word: p.word, art: P.art(p, 130) } : { char: c, word: F().get(c).word, art: F().art(c, { size: 130 }).replace('class="lf"', 'class="lf is-bodiless"') };
      });
      this.round = 0;
      if (this.known.length < 2 || !this.cards.length) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.cards.length) return this.finish();
      const card = this.cards[this.round];
      this.card = card; this.missed = false; this.heard = true; this.busy = false;
      // The word without its first letter (and that letter's marks).
      const chars = [...card.word];
      let cut = 1;
      while (cut < chars.length && /[ًٌٍَُِّْٰ]/.test(chars[cut])) cut += 1;
      this.rest = chars.slice(cut).join("");
      const n = this.ctx.beginner ? 2 : 3;
      this.offered = shuffle([card.char, ...shuffle(this.known.filter((c) => c !== card.char)).slice(0, n - 1)]);
      this.root.innerHTML = `
        <div class="ws-card"><span class="ws-pic">${card.art}</span>
          <div class="ws-word" dir="rtl" lang="ar"><span class="ws-hole" aria-label="The missing letter"></span><span class="ws-rest">${this.rest}</span></div>
        </div>
        <div class="pz-board">${this.offered.map((c, i) => `<button type="button" class="pz-tile" data-i="${i}" aria-label="${c}">${F().art(c, { size: 84, mode: "plain" })}</button>`).join("")}</div>
        ${this.dots(this.cards.length, this.round)}`;
      this.root.querySelectorAll(".pz-tile").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      this.ctx.beginRound?.(item(card.char), "friend");
      this.later(() => this.say({ id: card.word, display: card.word, speak: card.word }), 350);
    }
    replayPrompt() { if (this.card) this.say({ id: this.card.word, display: this.card.word, speak: this.card.word }); }
    pick(i, btn) {
      if (this.busy) return;
      const c = this.offered[i], want = this.card.char;
      const independent = !this.missed && this.heard !== false && this.ctx.canListen?.() !== false;
      this.ctx.reportOutcome?.({ item: item(want), itemId: want, activity: "FillGap", skill: "friend", correct: c === want,
        evidence: independent ? "independent_listening" : "supported_visible_matching", assisted: !!this.missed,
        selectedId: c, choiceIds: this.offered, affectsStrength: true });
      if (c !== want) {
        this.missed = true;
        this.say(item(c));
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".pz-tile").forEach((b, k) => b.classList.toggle("is-hint", this.offered[k] === want));
        return;
      }
      this.busy = true;
      // The gap closes: the whole word, shaped as one, and said.
      const word = this.root.querySelector(".ws-word");
      word.innerHTML = `<span class="ws-whole">${this.card.word}</span>`;
      word.classList.add("is-whole");
      this.root.querySelector(".lf.is-bodiless")?.classList.replace("is-bodiless", "is-whole");
      this.ctx.correct?.(); this.ctx.confettiAt?.(word); this.ctx.pet?.cheer?.();
      this.later(() => this.say({ id: this.card.word, display: this.card.word, speak: this.card.word }), 500);
      this.round += 1;
      this.later(() => this.next(), 2700);
    }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800); }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { BuildLetter, FillGap });
  ns.WorkshopGames = { KINDS: ["BuildLetter", "FillGap"], bodyKey, dotKey };
})(window.MiftahGame || (window.MiftahGame = {}));
