// Ears First (v61, 2026-10-16): listening games that come BEFORE letters.
// Hearing that words are made of beats and begin with sounds is the strongest
// early predictor of learning to read, and the garden never trained it on its
// own — every sound game also showed a letter. These three show only
// pictures and play only words:
//
//   BeatDrum     hear a picture's name; tap the drum once for each beat
//                (syllable). The beats come from the word's vowel marks: every
//                Arabic syllable has exactly one vowel, so بَيْ-ضَة has 2.
//   SameStart    hear a word; which picture starts with the SAME sound?
//                (فِيل … فَرَاشَة, not شَمْس)
//   OddSound     three pictures, two begin alike — tap the one that doesn't.
//
// Nothing here is a letter skill, so nothing is reported to the letter
// strength model. Misses wobble and, after two, the answer glows.
(function (ns) {
  const P = () => ns.PictureWords;
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // One vowel per syllable: fatha, damma, kasra and the three tanween.
  const beats = (word) => Math.max(1, ([...String(word)].filter((ch) => ch >= "ً" && ch <= "ِ").length));
  const DRUM = `<svg viewBox="0 0 120 100" aria-hidden="true"><ellipse cx="60" cy="92" rx="48" ry="6" fill="#2f5c46" opacity=".18"/><path d="M14 30V72Q60 94 106 72V30Z" fill="#ee806f" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M14 40L38 78M38 34L62 82M62 34L86 80M86 34L106 64" fill="none" stroke="#ffe49a" stroke-width="3" stroke-linecap="round"/><ellipse cx="60" cy="30" rx="46" ry="14" fill="#fffaf0" stroke="#4a3620" stroke-width="3"/><ellipse cx="60" cy="30" rx="34" ry="9" fill="none" stroke="#e5dcc8" stroke-width="2.4"/><path d="M100 4L74 24" stroke="#c69434" stroke-width="6" stroke-linecap="round"/><circle cx="102" cy="3" r="6" fill="#ffa798" stroke="#4a3620" stroke-width="2.4"/></svg>`;

  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.timers = [];
      ctx.stage.innerHTML = `<div class="ea ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
      this.rounds = ctx.beginner ? 3 : 4;
      this.round = 0;
    }
    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); return t; }
    say(p) { try { return this.ctx.say?.(P().item(p)); } catch { return false; } }
    dots() { return `<div class="bk-progress ea-progress" aria-hidden="true">${Array.from({ length: this.rounds }, (_, i) => `<i class="${i < this.round ? "is-done" : i === this.round ? "is-on" : ""}"></i>`).join("")}</div>`; }
    pic(p, size = 96) { return P().art(p, size); }
    wobble(el) { if (!this.ctx.reducedMotion?.()) el?.animate?.([{ transform: "rotate(0)" }, { transform: "rotate(-6deg)" }, { transform: "rotate(6deg)" }, { transform: "rotate(0)" }], { duration: 360 }); }
    cheer(el) { this.ctx.correct?.(); this.ctx.confettiAt?.(el); this.ctx.pet?.cheer?.(); }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 900); }
    destroy() { this.alive = false; this.timers.forEach(clearTimeout); }
  }

  // ---------- Beat Drum ----------
  class BeatDrum extends Base {
    constructor(ctx) {
      super(ctx, "ea-drum", "Beat drum");
      const list = P()?.LIST || [];
      if (!list.length) { this.later(() => ctx.done?.(), 300); return; }
      // A mix of short and long words, never the same beat count twice in a row.
      const by = [1, 2, 3].map((n) => shuffle(list.filter((p) => beats(p.word) === n)));
      this.cards = [];
      for (let i = 0; this.cards.length < this.rounds && i < 12; i += 1) { const pool = by[(i + Math.floor(Math.random() * 3)) % 3]; const p = pool.pop(); if (p && (!this.cards.length || beats(this.cards[this.cards.length - 1].word) !== beats(p.word))) this.cards.push(p); }
      this.next();
    }
    next() {
      if (this.round >= this.rounds || !this.cards[this.round]) return this.finish();
      this.card = this.cards[this.round]; this.n = beats(this.card.word); this.hits = 0; this.busy = false;
      this.root.innerHTML = `<button type="button" class="ea-card" aria-label="Hear the picture's name">${this.pic(this.card, 120)}</button>
        <div class="ea-beats" aria-hidden="true">${Array.from({ length: this.n }, () => "<i></i>").join("")}</div>
        <button type="button" class="ea-drum-btn" aria-label="Tap the drum for each beat">${DRUM}</button>${this.dots()}`;
      this.root.querySelector(".ea-card").onclick = () => this.say(this.card);
      const drum = this.root.querySelector(".ea-drum-btn");
      drum.onclick = () => this.hit(drum);
      drum.classList.add("is-hint");
      this.later(() => this.say(this.card), 300);
    }
    replayPrompt() { if (this.card) this.say(this.card); }
    hit(drum) {
      if (this.busy) return;
      this.ctx.sfx?.("thud");
      if (!this.ctx.reducedMotion?.()) drum.querySelector("svg")?.animate?.([{ transform: "none" }, { transform: "scale(.94, .9) translateY(4px)" }, { transform: "none" }], { duration: 200 });
      const dots = [...this.root.querySelectorAll(".ea-beats i")];
      dots[this.hits]?.classList.add("is-on");
      this.hits += 1;
      if (this.hits < this.n) return;
      // All the beats: the word again, the dots pulsing in time with it.
      this.busy = true;
      drum.classList.remove("is-hint");
      this.later(() => {
        this.say(this.card);
        dots.forEach((d, k) => this.later(() => { d.classList.remove("is-pulse"); void d.offsetWidth; d.classList.add("is-pulse"); }, k * 320));
        this.cheer(this.root.querySelector(".ea-beats"));
      }, 250);
      this.round += 1;
      this.later(() => this.next(), 1500 + this.n * 320);
    }
  }

  // Pictures grouped by first sound, only sounds with two or more pictures.
  const groups = () => { const m = new Map(); for (const p of P()?.LIST || []) (m.get(p.char) || m.set(p.char, []).get(p.char)).push(p); return [...m.values()].filter((g) => g.length >= 2); };

  // ---------- Same Start ----------
  class SameStart extends Base {
    constructor(ctx) {
      super(ctx, "ea-same", "Same first sound");
      this.sets = shuffle(groups()).slice(0, this.rounds);
      if (this.sets.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.rounds = this.sets.length;
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      const [target, match] = shuffle(this.sets[this.round]);
      const others = shuffle((P().LIST || []).filter((p) => p.char !== target.char)).slice(0, this.ctx.beginner ? 1 : 2);
      this.target = target; this.match = match; this.choices = shuffle([match, ...others]); this.misses = 0; this.busy = false;
      this.root.innerHTML = `<button type="button" class="ea-card ea-target" aria-label="Hear the word">${this.pic(target, 120)}</button>
        <div class="ea-choices">${this.choices.map((p, i) => `<button type="button" class="ea-choice" data-i="${i}" aria-label="Picture ${i + 1}">${this.pic(p, 92)}</button>`).join("")}</div>${this.dots()}`;
      this.root.querySelector(".ea-target").onclick = () => this.say(this.target);
      this.root.querySelectorAll(".ea-choice").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      this.later(() => this.say(this.target), 300);
    }
    replayPrompt() { if (this.target) this.say(this.target); }
    pick(i, btn) {
      if (this.busy) return;
      const p = this.choices[i];
      this.say(p);
      if (p !== this.match) {
        this.misses += 1; this.ctx.sfx?.("softwrong"); this.wobble(btn);
        if (this.misses >= 2) this.root.querySelectorAll(".ea-choice").forEach((b, k) => b.classList.toggle("is-hint", this.choices[k] === this.match));
        this.later(() => this.say(this.target), 900);
        return;
      }
      this.busy = true;
      btn.classList.add("is-right"); this.root.querySelector(".ea-target").classList.add("is-right");
      // Hear them together: the same first sound.
      this.later(() => this.say(this.target), 900);
      this.later(() => this.say(this.match), 1900);
      this.cheer(btn);
      this.round += 1;
      this.later(() => this.next(), 3200);
    }
  }

  // ---------- Odd Sound Out ----------
  class OddSound extends Base {
    constructor(ctx) {
      super(ctx, "ea-odd", "Odd sound out");
      this.sets = shuffle(groups()).slice(0, this.rounds);
      if (this.sets.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.rounds = this.sets.length;
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      const pair = shuffle(this.sets[this.round]).slice(0, 2);
      const odd = shuffle((P().LIST || []).filter((p) => p.char !== pair[0].char))[0];
      this.odd = odd; this.choices = shuffle([...pair, odd]); this.misses = 0; this.busy = true;
      this.root.innerHTML = `<div class="ea-choices ea-three">${this.choices.map((p, i) => `<button type="button" class="ea-choice" data-i="${i}" aria-label="Picture ${i + 1}">${this.pic(p, 96)}</button>`).join("")}</div>${this.dots()}`;
      const btns = [...this.root.querySelectorAll(".ea-choice")];
      btns.forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      this.sing(btns);
    }
    // Each picture says its name in turn, lighting up as it does.
    sing(btns = [...this.root.querySelectorAll(".ea-choice")]) {
      this.busy = true;
      this.choices.forEach((p, k) => this.later(() => { btns.forEach((b) => b.classList.remove("is-saying")); btns[k]?.classList.add("is-saying"); this.say(p); }, 300 + k * 1100));
      this.later(() => { btns.forEach((b) => b.classList.remove("is-saying")); this.busy = false; }, 300 + this.choices.length * 1100);
    }
    replayPrompt() { if (!this.busy) this.sing(); }
    pick(i, btn) {
      if (this.busy) return;
      const p = this.choices[i];
      if (p !== this.odd) {
        this.say(p); this.misses += 1; this.ctx.sfx?.("softwrong"); this.wobble(btn);
        if (this.misses >= 2) this.root.querySelectorAll(".ea-choice").forEach((b, k) => b.classList.toggle("is-hint", this.choices[k] === this.odd));
        return;
      }
      this.busy = true;
      this.say(p);
      btn.classList.add("is-right");
      this.cheer(btn);
      this.round += 1;
      this.later(() => this.next(), 2000);
    }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { BeatDrum, SameStart, OddSound });
  ns.EarsGames = { KINDS: ["BeatDrum", "SameStart", "OddSound"], beats, groups, DRUM };
})(window.MiftahGame || (window.MiftahGame = {}));
