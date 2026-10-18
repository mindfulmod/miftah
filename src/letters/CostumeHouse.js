// The Costume House (v62, 2026-10-16) — the positional-forms land.
// A letter changes shape with its place in a word: at the start it reaches
// forward (بـ), in the middle it holds hands both ways (ـبـ), at the end it
// lets go (ـب). Reading real words needs this, and until now the garden only
// joined letters in its joining chapters. Here the letter friends "wear a
// costume" for each place:
//
//   Disguise     a friend, a picture and its word — tap where the friend is
//                hiding inside the word, in its costume.
//   CostumeRail  a word with one letter missing; which costume of that SAME
//                letter fits the gap (start, middle or end shape)?
//   ShapeTrain   a letter's costumes ride a train whose couplings match their
//                joining tails: the front car couples only behind, middle cars
//                both ways, the last car only in front.
//
// Words are drawn letter by letter, each piece forced into its joined shape
// with zero-width joiners, laid side by side right-to-left — they read as one
// connected word but every letter is its own tappable, highlightable piece.
(function (ns) {
  const ZWJ = "‍", TATWEEL = "ـ";
  // Letters that never join to the letter after them.
  const RIGHT_ONLY = new Set([..."اأإآدذرزوؤةء"]);
  const MARK = /[ً-ٰٟ]/;
  const P = () => ns.PictureWords;
  const F = () => ns.LetterFriends;
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // A word as letter clusters (a letter with its marks).
  function clusters(word) { const out = []; for (const ch of String(word)) { if (MARK.test(ch) && out.length) out[out.length - 1] += ch; else out.push(ch); } return out; }
  // Each letter's place: how it joins its neighbours.
  function forms(word) {
    const cl = clusters(word);
    return cl.map((c, i) => {
      const base = c[0], prev = cl[i - 1]?.[0], next = cl[i + 1];
      const joinPrev = !!prev && !RIGHT_ONLY.has(prev), joinNext = !!next && !RIGHT_ONLY.has(base);
      const form = joinPrev && joinNext ? "middle" : joinPrev ? "end" : joinNext ? "start" : "alone";
      return { cluster: c, base, form, text: (joinPrev ? ZWJ : "") + c + (joinNext ? ZWJ : "") };
    });
  }
  // A letter shown alone in one costume, with a visible joining tail.
  function costume(letter, form) {
    if (form === "start") return letter + TATWEEL;
    if (form === "middle") return TATWEEL + letter + TATWEEL;
    if (form === "end") return TATWEEL + letter;
    return letter;
  }
  const canStart = (letter) => !RIGHT_ONLY.has(letter);
  const wordHTML = (pieces, cls = "") => `<div class="ch-word ${cls}" dir="rtl" lang="ar">${pieces.map((p, i) => `<span class="ch-piece" data-i="${i}">${p.text}</span>`).join("")}</div>`;

  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.timers = [];
      ctx.stage.innerHTML = `<div class="ch ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
      this.rounds = ctx.beginner ? 3 : 4; this.round = 0;
      this.known = [...new Set([...(ctx.items || []), ...(ctx.known || [])].map((i) => i?.display).filter((c) => c && F()?.FRIENDS?.[c]))];
    }
    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); return t; }
    sayWord(p) { try { return this.ctx.say?.(P().item(p)); } catch { return false; } }
    sayLetter(c) { try { return this.ctx.say?.(F().item(c)); } catch { return false; } }
    dots() { return `<div class="bk-progress" aria-hidden="true">${Array.from({ length: this.rounds }, (_, i) => `<i class="${i < this.round ? "is-done" : i === this.round ? "is-on" : ""}"></i>`).join("")}</div>`; }
    wobble(el) { if (!this.ctx.reducedMotion?.()) el?.animate?.([{ transform: "rotate(0)" }, { transform: "rotate(-6deg)" }, { transform: "rotate(6deg)" }, { transform: "rotate(0)" }], { duration: 360 }); }
    cheer(el) { this.ctx.correct?.(); this.ctx.confettiAt?.(el); this.ctx.pet?.cheer?.(); }
    report(target, correct, chosen, offered) {
      this.ctx.reportOutcome?.({ item: { id: target, display: target }, itemId: target, activity: this.constructor.name, skill: "letter-form", correct,
        evidence: "supported_visible_matching", assisted: !!this.missed, selectedId: chosen, choiceIds: offered, affectsStrength: true });
    }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 900); }
    destroy() { this.alive = false; this.timers.forEach(clearTimeout); }
  }

  // Picture words containing a known letter somewhere (not only first),
  // with the letter's place in the word.
  function hides(known) {
    const out = [];
    for (const p of P()?.LIST || []) forms(p.word).forEach((f, i) => { if (known.includes(f.base)) out.push({ p, i, letter: f.base, form: f.form }); });
    return out;
  }

  // ---------- Friend in Disguise ----------
  class Disguise extends Base {
    constructor(ctx) {
      super(ctx, "ch-disguise", "Find the friend in the word");
      // Prefer letters hiding in the middle or end — the costumes worth learning.
      const all = shuffle(hides(this.known));
      const pool = [...all.filter((h) => h.form !== "start"), ...all.filter((h) => h.form === "start")];
      const seen = new Set();
      this.qs = pool.filter((h) => { const k = h.p.word; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, this.rounds);
      if (this.qs.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.rounds = this.qs.length;
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      const q = this.q = this.qs[this.round]; this.busy = false; this.missed = false; this.misses = 0;
      this.pieces = forms(q.p.word);
      this.root.innerHTML = `<div class="ch-top"><button type="button" class="ch-friend" aria-label="${F().get(q.letter).en}">${F().art(q.letter, { size: 84 })}</button>
          <button type="button" class="ch-pic" aria-label="Hear the word">${P().art(q.p, 84)}</button></div>
        ${wordHTML(this.pieces, "is-tappable")}${this.dots()}`;
      this.root.querySelector(".ch-friend").onclick = () => this.sayLetter(q.letter);
      this.root.querySelector(".ch-pic").onclick = () => this.sayWord(q.p);
      this.root.querySelectorAll(".ch-piece").forEach((s) => s.addEventListener("click", () => this.pick(Number(s.dataset.i), s)));
      this.later(() => this.sayLetter(q.letter), 300);
      this.later(() => this.sayWord(q.p), 1400);
    }
    replayPrompt() { if (this.q) this.sayLetter(this.q.letter); }
    pick(i, el) {
      if (this.busy) return;
      const right = this.pieces[i].base === this.q.letter;
      this.report(this.q.letter, right, this.pieces[i].base, [...new Set(this.pieces.map((p) => p.base))]);
      if (!right) {
        this.missed = true; this.misses += 1; this.ctx.sfx?.("softwrong"); this.wobble(el);
        if (this.misses >= 2) this.root.querySelectorAll(".ch-piece").forEach((s, k) => s.classList.toggle("is-hint", this.pieces[k].base === this.q.letter));
        return;
      }
      this.busy = true;
      this.root.querySelectorAll(".ch-piece").forEach((s, k) => { if (this.pieces[k].base === this.q.letter) s.classList.add("is-found"); });
      const svg = this.root.querySelector(".ch-friend svg.lf");
      if (svg && !this.ctx.reducedMotion?.()) { svg.classList.add("is-wiggle"); this.later(() => svg.classList.remove("is-wiggle"), 950); }
      this.cheer(el);
      this.later(() => this.sayWord(this.q.p), 500);
      this.round += 1;
      this.later(() => this.next(), 2400);
    }
  }

  // ---------- Costume Rail ----------
  class CostumeRail extends Base {
    constructor(ctx) {
      super(ctx, "ch-rail", "Pick the right costume");
      // A gap a letter with at least two costumes can fill.
      const all = shuffle(hides(this.known).filter((h) => h.form !== "alone"));
      const seen = new Set();
      this.qs = all.filter((h) => { if (seen.has(h.p.word)) return false; seen.add(h.p.word); return true; }).slice(0, this.rounds);
      if (this.qs.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.rounds = this.qs.length;
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      const q = this.q = this.qs[this.round]; this.busy = false; this.missed = false; this.misses = 0;
      this.pieces = forms(q.p.word);
      const options = canStart(q.letter) ? ["start", "middle", "end"] : ["alone", "end"];
      this.options = shuffle(options);
      this.root.innerHTML = `<button type="button" class="ch-pic ch-pic-big" aria-label="Hear the word">${P().art(q.p, 96)}</button>
        <div class="ch-word is-gapped" dir="rtl" lang="ar">${this.pieces.map((p, i) => i === q.i ? `<span class="ch-piece ch-gap" data-i="${i}"><span class="ch-gap-ghost">${p.text}</span></span>` : `<span class="ch-piece" data-i="${i}">${p.text}</span>`).join("")}</div>
        <div class="ch-costumes">${this.options.map((f, k) => `<button type="button" class="ch-costume" data-k="${k}" aria-label="${f} shape" dir="rtl" lang="ar">${costume(q.letter, f)}</button>`).join("")}</div>${this.dots()}`;
      this.root.querySelector(".ch-pic").onclick = () => this.sayWord(q.p);
      this.root.querySelectorAll(".ch-costume").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.k), b)));
      this.later(() => this.sayWord(q.p), 300);
    }
    replayPrompt() { if (this.q) this.sayWord(this.q.p); }
    pick(k, btn) {
      if (this.busy) return;
      const right = this.options[k] === this.q.form;
      this.report(this.q.letter, right, this.options[k], this.options);
      if (!right) {
        this.missed = true; this.misses += 1; this.ctx.sfx?.("softwrong"); this.wobble(btn);
        if (this.misses >= 2) this.root.querySelectorAll(".ch-costume").forEach((b, j) => b.classList.toggle("is-hint", this.options[j] === this.q.form));
        return;
      }
      this.busy = true;
      btn.classList.add("is-right");
      // The costume steps into the gap; the word is whole again.
      const gap = this.root.querySelector(".ch-gap");
      gap.classList.add("is-filled");
      this.cheer(gap);
      this.later(() => this.sayWord(this.q.p), 450);
      this.round += 1;
      this.later(() => this.next(), 2300);
    }
  }

  // ---------- Shape Train ----------
  // A car with couplers on the side(s) it joins — matching the costume's tails.
  const CAR = (left, right) => `<svg viewBox="0 0 120 80" aria-hidden="true"><rect x="10" y="10" width="100" height="50" rx="10" fill="#fffaf0" stroke="#4a3620" stroke-width="3"/>${right ? `<rect x="110" y="30" width="10" height="10" rx="3" fill="#c69434" stroke="#4a3620" stroke-width="2.4"/>` : ""}${left ? `<rect x="0" y="30" width="10" height="10" rx="3" fill="#c69434" stroke="#4a3620" stroke-width="2.4"/>` : ""}<circle cx="34" cy="66" r="10" fill="#70501b" stroke="#4a3620" stroke-width="3"/><circle cx="86" cy="66" r="10" fill="#70501b" stroke="#4a3620" stroke-width="3"/></svg>`;
  class ShapeTrain extends Base {
    constructor(ctx) {
      super(ctx, "ch-train", "Shape train");
      this.letters = shuffle(this.known.filter(canStart)).slice(0, this.rounds);
      if (this.letters.length < 1) { this.later(() => ctx.done?.(), 300); return; }
      this.rounds = this.letters.length;
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      this.letter = this.letters[this.round]; this.busy = false; this.placed = 0; this.missed = false;
      // Right to left: the front car (start), the middle, the last car (end).
      // [form, coupler on left, coupler on right]: a start shape's tail points
      // left (to the next letter), an end shape's tail points right.
      const cars = [["start", true, false], ["middle", true, true], ["end", false, true]];
      this.cards = shuffle(["start", "middle", "end"]);
      this.root.innerHTML = `<button type="button" class="ch-friend" aria-label="${F().get(this.letter).en}">${F().art(this.letter, { size: 76 })}</button>
        <div class="ch-cars" dir="rtl"><span class="ch-engine" aria-hidden="true"><svg viewBox="0 0 70 80"><rect x="6" y="18" width="50" height="42" rx="8" fill="#ee806f" stroke="#4a3620" stroke-width="3"/><rect x="34" y="4" width="14" height="18" rx="4" fill="#4a3620"/><rect x="12" y="26" width="18" height="16" rx="4" fill="#ccfbef" stroke="#4a3620" stroke-width="2.4"/><circle cx="20" cy="66" r="10" fill="#70501b" stroke="#4a3620" stroke-width="3"/><circle cx="46" cy="66" r="10" fill="#70501b" stroke="#4a3620" stroke-width="3"/></svg></span>${cars.map(([f, left, right]) => `<button type="button" class="ch-car" data-form="${f}" aria-label="${f} car"><span class="ch-car-body">${CAR(left, right)}</span><span class="ch-car-seat" dir="rtl" lang="ar"></span></button>`).join("")}</div>
        <div class="ch-costumes">${this.cards.map((f, k) => `<button type="button" class="ch-costume" data-k="${k}" aria-label="${f} shape" dir="rtl" lang="ar">${costume(this.letter, f)}</button>`).join("")}</div>${this.dots()}`;
      this.root.querySelector(".ch-friend").onclick = () => this.sayLetter(this.letter);
      this.selected = null;
      this.root.querySelectorAll(".ch-costume").forEach((b) => b.addEventListener("click", () => { if (this.busy || b.classList.contains("is-used")) return; this.root.querySelectorAll(".ch-costume").forEach((o) => o.classList.toggle("is-picked", o === b)); this.selected = Number(b.dataset.k); this.ctx.sfx?.("click"); }));
      this.root.querySelectorAll(".ch-car").forEach((car) => car.addEventListener("click", () => this.drop(car)));
      this.later(() => this.sayLetter(this.letter), 300);
    }
    replayPrompt() { if (this.letter) this.sayLetter(this.letter); }
    drop(car) {
      if (this.busy || this.selected == null || car.classList.contains("is-full")) {
        // Nothing picked: the costumes hop to show where to start.
        if (this.selected == null && !this.busy) this.root.querySelectorAll(".ch-costume:not(.is-used)").forEach((b) => { b.classList.remove("is-soon"); void b.offsetWidth; b.classList.add("is-soon"); });
        return;
      }
      const f = this.cards[this.selected], btn = this.root.querySelector(`.ch-costume[data-k="${this.selected}"]`);
      const right = car.dataset.form === f;
      this.report(this.letter, right, f, ["start", "middle", "end"]);
      if (!right) {
        this.missed = true; this.ctx.sfx?.("softwrong"); this.wobble(car);
        this.root.querySelectorAll(".ch-car").forEach((c) => c.classList.toggle("is-hint", c.dataset.form === f));
        return;
      }
      this.root.querySelectorAll(".ch-car").forEach((c) => c.classList.remove("is-hint"));
      car.classList.add("is-full");
      car.querySelector(".ch-car-seat").textContent = costume(this.letter, f);
      btn.classList.add("is-used"); btn.classList.remove("is-picked");
      this.selected = null; this.placed += 1;
      this.ctx.sfx?.("drop");
      if (this.placed < 3) return;
      // All aboard: the train toots and rolls a little.
      this.busy = true;
      this.ctx.sfx?.("chime");
      const cars = this.root.querySelector(".ch-cars");
      if (!this.ctx.reducedMotion?.()) cars.animate?.([{ transform: "none" }, { transform: "translateX(-16px)" }, { transform: "none" }], { duration: 900, easing: "ease-in-out" });
      this.cheer(cars);
      this.later(() => this.sayLetter(this.letter), 400);
      this.round += 1;
      this.later(() => this.next(), 2200);
    }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { Disguise, CostumeRail, ShapeTrain });
  ns.CostumeHouse = { KINDS: ["Disguise", "CostumeRail", "ShapeTrain"], forms, costume, clusters, hides, canStart };
})(window.MiftahGame || (window.MiftahGame = {}));
