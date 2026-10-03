// The Puzzle Tree (v31, 2026-10-03): four thinking games, each a Big Brain
// Academy activity rebuilt around Arabic letters for ages 2–6.
//
//   EchoParade  ← "Sound Bites" (DS) / "Reverse Retention" (Wii, Switch):
//               hear friends sing 2–4 letters, tap them back in order.
//               Holding sounds in sequence is the working memory blending
//               will need (ب + َ + ت). Always forwards for children.
//   DotsLast    ← "Fast Focus" (Wii, Switch) and "Get in Shape" (DS): a
//               letter's body draws itself, then its dots arrive one at a
//               time. Which letter is it? The dots are the whole difference
//               between ب ت ث — the hardest thing a beginner must see.
//   LetterTrain ← "Balloon Burst" (Wii): pop the balloons in alphabet order
//               (ا ب ت ث …) and each one becomes a carriage on the train.
//   SameLetter  ← "Train Turn" (Wii) and "Odd One Out" (Wii): one letter has
//               tumbled over — find it among its dot-siblings (and, later,
//               a mirror-image trap). Orientation and dots, together.
//
// Big Brain Academy's kindest ideas come with them: questions grow a little
// harder after right answers and easier after misses; a miss makes a soft
// sound and never ends anything; Little Sprout stays on the easiest level
// (its "Sprout Support"). Unlike the original, nothing here is timed or scored.
(function (ns) {
  const INK = "#4a3620";
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const F = () => ns.LetterFriends;
  const S = () => ns.LettersStrokes;
  const ORDER = () => (ns.LETTERS_DATA?.packs || []).flatMap((p) => p.letters.map((l) => l.char));
  const nameOf = (c) => (ns.LETTERS_DATA?.packs || []).flatMap((p) => p.letters).find((l) => l.char === c)?.arName || c;
  const item = (c) => ({ id: c, display: c, speak: nameOf(c) });
  const knownChars = (ctx) => [...new Set([...(ctx.items || []), ...(ctx.known || [])].map((i) => i?.display).filter((c) => F()?.FRIENDS?.[c]))];
  // Letters that share a body and differ only by dots: ب ت ث, ج ح خ, د ذ …
  const bodyKey = (c) => (S()?.LETTERS?.[c] || []).filter((s) => typeof s === "string").join("|");
  const dotsOf = (c) => (S()?.LETTERS?.[c] || []).filter((s) => s && s.dot).map((s) => s.dot);
  const siblings = (c, pool) => pool.filter((o) => o !== c && bodyKey(o) === bodyKey(c));

  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.timers = [];
      ctx.stage.innerHTML = `<div class="pz ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
    }
    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); return t; }
    wait(ms) { return new Promise((ok) => this.later(ok, ms)); }
    dots(n, at) { return `<div class="pz-progress" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < at ? "is-done" : i === at ? "is-on" : ""}"></i>`).join("")}</div>`; }
    wobble(el) { if (!this.ctx.reducedMotion?.()) el?.animate?.([{ transform: el.style.transform || "none" }, { transform: `${el.style.transform || ""} rotate(-7deg)` }, { transform: `${el.style.transform || ""} rotate(7deg)` }, { transform: el.style.transform || "none" }], { duration: 360 }); }
    cheer(el) { this.ctx.correct?.(); this.ctx.confettiAt?.(el); this.ctx.pet?.cheer?.(); }
    report(target, chosen, offered, { skill = "letter-name", listening = false } = {}) {
      const correct = chosen === target;
      const independent = listening && !this.missed && this.heard !== false;
      this.ctx.reportOutcome?.({ item: item(target), itemId: target, activity: this.constructor.name, skill, correct,
        evidence: independent ? "independent_listening" : "supported_visible_matching", assisted: !!this.missed,
        selectedId: chosen, choiceIds: offered, affectsStrength: true });
      return correct;
    }
    replayPrompt() {}
    destroy() { this.alive = false; this.timers.forEach(clearTimeout); }
  }

  // ---------- Echo Parade ----------
  // A leafy hedge the singers hide behind (UI pass 2026-10-03).
  const HEDGE = `<svg viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">${[[20, 60], [60, 40], [100, 58], [140, 36], [180, 56], [220, 40], [262, 58], [40, 82], [120, 84], [200, 82], [280, 84]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${30 + (i % 3) * 6}" fill="${["#7fce54", "#4e9677", "#b7e779"][i % 3]}"/>`).join("")}${[[50, 50], [130, 46], [210, 52], [250, 70]].map(([x, y]) => `<path d="M${x} ${y}q6-8 12 0" fill="none" stroke="#2f5c46" stroke-width="3" stroke-linecap="round"/>`).join("")}</svg>`;
  class EchoParade extends Base {
    constructor(ctx) {
      super(ctx, "pz-echo", "Echo parade");
      // v35: in the vowel chapters the friends sing syllables (بَا بِي بُو),
      // wearing their vowel hats; elsewhere, letter names.
      const syl = (ctx.items || []).filter((i) => i?.display && [...i.display].length > 1 && /[ًٌٍَُِّْٰ]/.test(i.display) && F()?.FRIENDS?.[[...i.display][0]]);
      this.syllables = syl.length >= 2;
      this.byText = new Map(syl.map((i) => [i.display, i]));
      this.pool = this.syllables ? [...this.byText.keys()] : knownChars(ctx);
      this.len = 2;
      this.max = ctx.beginner ? 2 : 4;
      this.rounds = 4; this.round = 0;
      if (this.pool.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      this.missed = false; this.heard = true; this.busy = true; this.at = 0;
      const n = Math.min(this.len, this.pool.length);
      const want = (this.ctx.items || []).map((i) => i.display).filter((c) => this.pool.includes(c));
      this.seq = shuffle([...new Set([...shuffle(want), ...shuffle(this.pool)])]).slice(0, n);
      // The board: the sequence's letters plus one extra, shuffled.
      const extra = shuffle(this.pool.filter((c) => !this.seq.includes(c))).slice(0, this.ctx.beginner ? 0 : 1);
      this.board = shuffle([...this.seq, ...extra]);
      this.root.innerHTML = `
        <div class="pz-singers is-hidden" aria-hidden="true"><span class="pz-hedge">${HEDGE}</span>${this.seq.map((c, i) => `<span class="pz-singer" data-i="${i}">${this.singer(c)}</span>`).join("")}</div>
        <div class="pz-slots" dir="rtl">${this.seq.map((_, i) => `<span class="pz-slot" data-i="${i}"></span>`).join("")}</div>
        <div class="pz-board">${this.board.map((c, i) => `<button type="button" class="pz-tile" data-i="${i}" aria-label="${c}">${this.tile(c)}</button>`).join("")}</div>
        ${this.dots(this.rounds, this.round)}`;
      this.root.querySelectorAll(".pz-tile").forEach((b) => b.addEventListener("click", () => this.tap(Number(b.dataset.i), b)));
      this.later(() => this.sing(), 500);
    }
    singer(c) {
      if (!this.syllables) return F().art(c, { size: 74 });
      const base = [...c][0], mark = ns.VowelGames?.markOf?.(c);
      return ns.VowelGames?.wearing?.(base, mark, 74) || F().art(base, { size: 74 });
    }
    tile(c) { return this.syllables ? `<span class="pz-syl" dir="rtl" lang="ar">${c}</span>` : F().art(c, { size: 84, mode: "plain" }); }
    sayable(c) { return this.syllables ? (this.byText.get(c) || { id: c, display: c, speak: c }) : item(c); }
    // The friends sing behind a curtain of leaves: you hear them, not see them.
    async sing() {
      this.busy = true;
      const singers = [...this.root.querySelectorAll(".pz-singer")];
      this.root.querySelector(".pz-singers")?.classList.add("is-hidden");
      for (let i = 0; i < this.seq.length; i += 1) {
        if (!this.alive) return;
        singers[i]?.classList.add("is-singing");
        const heard = await this.ctx.say?.(this.sayable(this.seq[i]));
        if (heard === false) this.heard = false;
        singers[i]?.classList.remove("is-singing");
        await this.wait(260);
      }
      this.ctx.beginRound?.(this.sayable(this.seq[this.at]), this.syllables ? "syllable" : "letter-name");
      this.busy = false;
    }
    replayPrompt() { if (!this.busy) { this.missed = true; this.sing(); } }
    tap(i, btn) {
      if (this.busy || this.at >= this.seq.length) return;
      const want = this.seq[this.at], chosen = this.board[i];
      const right = this.report(want, chosen, this.board, { listening: true, skill: this.syllables ? "syllable" : "letter-name" });
      this.ctx.say?.(this.sayable(chosen));
      if (!right) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        // After a miss the next letter's tile glows (errorless help).
        this.root.querySelectorAll(".pz-tile").forEach((b, k) => b.classList.toggle("is-hint", this.board[k] === want));
        return;
      }
      this.root.querySelectorAll(".pz-tile").forEach((b) => b.classList.remove("is-hint"));
      const slot = this.root.querySelectorAll(".pz-slot")[this.at];
      slot.innerHTML = this.syllables ? this.singer(chosen).replace(/width="74" height="74"/, 'width="64" height="64"') : F().art(chosen, { size: 64 });
      slot.classList.add("is-full");
      this.ctx.sfx?.("pop");
      this.at += 1;
      if (this.at < this.seq.length) { this.ctx.beginRound?.(this.sayable(this.seq[this.at]), this.syllables ? "syllable" : "letter-name"); return; }
      // The whole line: the friends come out and sing it once more, together.
      this.busy = true;
      this.root.querySelector(".pz-singers")?.classList.remove("is-hidden");
      this.cheer(this.root.querySelector(".pz-slots"));
      // Big Brain Academy's rubber band: a clean line grows by one, a missed
      // one shrinks by one.
      this.len = Math.max(2, Math.min(this.max, this.len + (this.missed ? -1 : 1)));
      this.round += 1;
      this.later(() => this.next(), 2400);
    }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800); }
  }

  // ---------- Dots Last ----------
  class DotsLast extends Base {
    constructor(ctx) {
      super(ctx, "pz-dots", "Dots last");
      const known = knownChars(ctx);
      // Only letters that have a dot-sibling the child knows can be asked.
      this.targets = shuffle(known.filter((c) => dotsOf(c).length && siblings(c, known).length));
      const firsts = (ctx.items || []).map((i) => i.display).filter((c) => this.targets.includes(c));
      this.targets = [...new Set([...firsts, ...this.targets])];
      this.known = known;
      this.rounds = Math.min(4, Math.max(1, this.targets.length)); this.round = 0;
      if (!this.targets.length) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      const target = this.targets[this.round % this.targets.length];
      this.target = target; this.missed = false; this.busy = false; this.revealed = 0;
      const sib = siblings(target, this.known);
      const n = Math.min(this.ctx.beginner ? 2 : 3, sib.length + 1);
      this.offered = shuffle([target, ...shuffle(sib).slice(0, n - 1)]);
      const body = S().LETTERS[target].filter((s) => typeof s === "string");
      this.dotList = dotsOf(target);
      this.root.innerHTML = `
        <div class="pz-reveal"><svg viewBox="0 0 100 100" aria-hidden="true">
          ${body.map((d) => `<path class="pz-body" d="${d}" pathLength="1" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" data-ribbon/>`).join("")}
          ${this.dotList.map(([x, y], i) => `<circle class="pz-dot" data-i="${i}" cx="${x}" cy="${y}" r="6" fill="${INK}"/>`).join("")}
        </svg></div>
        <div class="pz-board">${this.offered.map((c, i) => `<button type="button" class="pz-tile" data-i="${i}" aria-label="${c}">${F().art(c, { size: 92, mode: "plain" })}</button>`).join("")}</div>
        ${this.dots(this.rounds, this.round)}`;
      this.root.querySelectorAll(".pz-tile").forEach((b) => b.addEventListener("click", () => this.tap(Number(b.dataset.i), b)));
      this.ctx.beginRound?.(item(target), "letter-name");
      // Body first, then each dot on its own beat.
      const slow = this.ctx.reducedMotion?.() ? 0 : 1;
      this.later(() => this.root.querySelector(".pz-reveal")?.classList.add("is-drawn"), 80);
      this.settled = false;
      this.dotList.forEach((_, i) => this.later(() => this.showDot(i), (slow ? 1500 : 700) + i * 1100));
      if (!this.dotList.length) this.later(() => { this.settled = true; }, slow ? 1600 : 800);
    }
    showDot(i) {
      if (this.busy) return;
      this.root.querySelector(`.pz-dot[data-i="${i}"]`)?.classList.add("is-on");
      this.revealed = i + 1;
      this.ctx.sfx?.("drip");
    }
    // Is the letter already certain from what a child can SEE — how many dots
    // have appeared, and whether they are above or below? (Not coordinates: one
    // dot on top could still become ت or ث.) Only then is a tap honest
    // evidence; before that it is a brave guess.
    determined() {
      // A letter with no dots is only certain once a dot would have arrived.
      if (!this.dotList.length) return !!this.settled;
      if (this.revealed >= this.dotList.length) return true;
      const side = (d) => (d[1] > 60 ? "below" : "above");
      const shown = this.dotList.slice(0, this.revealed);
      const want = shown.length ? side(shown[0]) : null;
      return !this.offered.some((c) => {
        if (c === this.target) return false;
        const d = dotsOf(c).filter((p) => !want || side(p) === want);
        return d.length >= shown.length;
      });
    }
    tap(i, btn) {
      if (this.busy) return;
      const chosen = this.offered[i];
      const certain = this.determined();
      if (chosen !== this.target && !certain) {
        // A guess before the dots have arrived: "not yet" — keep watching.
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        return;
      }
      if (certain) this.report(this.target, chosen, this.offered);
      if (chosen !== this.target) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".pz-tile").forEach((b, k) => b.classList.toggle("is-hint", this.offered[k] === this.target));
        return;
      }
      this.busy = true;
      // Show every dot, then celebrate — a little extra sparkle for knowing early.
      this.root.querySelectorAll(".pz-dot").forEach((d) => d.classList.add("is-on"));
      this.root.querySelector(".pz-reveal")?.classList.add(this.revealed < this.dotList.length ? "is-early" : "is-done");
      this.cheer(btn);
      this.ctx.say?.(item(this.target));
      this.round += 1;
      this.later(() => this.next(), 2200);
    }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800); }
  }

  // ---------- Letter Train ----------
  const BALLOON = (c) => `<svg viewBox="0 0 100 130" aria-hidden="true"><path d="M50 98Q44 112 52 128" fill="none" stroke="#a89478" stroke-width="2.4"/><path d="M50 6C26 6 12 26 12 48C12 72 30 92 50 98C70 92 88 72 88 48C88 26 74 6 50 6Z" fill="${c}" stroke="${INK}" stroke-width="3"/><path d="M28 28Q34 18 44 16" fill="none" stroke="#fffdf7" stroke-width="6" stroke-linecap="round" opacity=".8"/><circle cx="50" cy="50" r="27" fill="#fffaf0" opacity=".92"/></svg>`;
  const COLORS = ["#ffa798", "#96ecff", "#b7e779", "#ffe49a", "#b49fcf"];
  const CAR = `<svg viewBox="0 0 80 60" aria-hidden="true"><path d="M6 10H74V46H6Z" fill="#ee806f" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="20" cy="50" r="8" fill="#4a3620"/><circle cx="60" cy="50" r="8" fill="#4a3620"/><circle cx="20" cy="50" r="3" fill="#c9bda4"/><circle cx="60" cy="50" r="3" fill="#c9bda4"/></svg>`;

  class LetterTrain extends Base {
    constructor(ctx) {
      super(ctx, "pz-train", "Letter train");
      const order = ORDER();
      const known = new Set(knownChars(ctx));
      // A run of letters the child knows, in alphabet order.
      this.run = order.filter((c) => known.has(c));
      this.size = Math.min(ctx.beginner ? 3 : 4, this.run.length);
      this.rides = Math.min(3, Math.max(1, this.run.length - this.size + 1));
      this.ride = 0;
      if (this.size < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    next() {
      if (this.ride >= this.rides) return this.finish();
      const start = Math.min(this.run.length - this.size, this.ride * this.size);
      this.order = this.run.slice(Math.max(0, start), Math.max(0, start) + this.size);
      this.at = 0; this.missed = false; this.busy = false;
      const balloons = shuffle(this.order);
      this.root.innerHTML = `
        <div class="pz-sky">${balloons.map((c, i) => `<button type="button" class="pz-balloon" data-c="${c}" style="--x:${8 + i * (84 / Math.max(1, balloons.length - 1))}%;--d:${(i % 3) * .4}s" aria-label="${c}">${BALLOON(COLORS[i % COLORS.length])}<span class="pz-balloon-letter">${F().art(c, { size: 50, mode: "plain" })}</span></button>`).join("")}</div>
        <div class="pz-rails" dir="rtl"><span class="pz-engine" aria-hidden="true">${ENGINE}</span><span class="pz-cars"></span></div>
        ${this.dots(this.rides, this.ride)}`;
      this.root.querySelectorAll(".pz-balloon").forEach((b) => b.addEventListener("click", () => this.pop(b)));
      this.ctx.beginRound?.(item(this.order[0]), "alphabet-order");
    }
    pop(b) {
      if (this.busy || b.classList.contains("is-popped")) return;
      const c = b.dataset.c, want = this.order[this.at];
      this.ctx.say?.(item(c));
      if (c !== want) {
        // Out of order: the balloon bobs and says its name; nothing is lost.
        this.missed = true;
        this.ctx.sfx?.("boing"); this.wobble(b);
        this.root.querySelectorAll(".pz-balloon").forEach((o) => o.classList.toggle("is-hint", o.dataset.c === want));
        return;
      }
      this.root.querySelectorAll(".pz-balloon").forEach((o) => o.classList.remove("is-hint"));
      b.classList.add("is-popped");
      this.ctx.sfx?.("pop");
      this.ctx.confettiAt?.(b);
      this.root.querySelector(".pz-cars").insertAdjacentHTML("beforeend", `<span class="pz-car">${CAR}<span class="pz-car-letter">${F().art(c, { size: 44, mode: "plain" })}</span></span>`);
      this.at += 1;
      if (this.at < this.order.length) return;
      // The train pulls away, singing its letters in order.
      this.busy = true;
      this.ctx.reportOutcome?.({ item: item(this.order[0]), itemId: this.order[0], activity: "LetterTrain", skill: "alphabet-order", evidence: "motor_assembly_participation",
        correct: this.missed ? undefined : true, affectsStrength: false });
      this.ctx.pet?.cheer?.();
      this.chant();
    }
    async chant() {
      const rails = this.root.querySelector(".pz-rails");
      rails?.classList.add("is-leaving");
      const cars = [...this.root.querySelectorAll(".pz-car")];
      for (let i = 0; i < this.order.length; i += 1) {
        if (!this.alive) return;
        cars[i]?.classList.add("is-singing");
        await this.ctx.say?.(item(this.order[i]));
        cars[i]?.classList.remove("is-singing");
      }
      this.ride += 1;
      this.later(() => this.next(), 900);
    }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800); }
  }
  const ENGINE = `<svg viewBox="0 0 110 70" aria-hidden="true"><path d="M30 14H86V54H30Z" fill="#62cdf4" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M86 24H104V54H86Z" fill="#3a8fc4" stroke="${INK}" stroke-width="3"/><path d="M40 4H56V14H40Z" fill="#4a3620"/><circle cx="44" cy="60" r="8" fill="#4a3620"/><circle cx="76" cy="60" r="8" fill="#4a3620"/><circle cx="96" cy="60" r="6" fill="#4a3620"/><path d="M50 22H76V38H50Z" fill="#ccfbef" stroke="${INK}" stroke-width="2.4"/></svg>`;

  // ---------- Same Letter ----------
  const SYMMETRIC = new Set(["ا", "ب", "ت", "ث", "ن"]);
  class SameLetter extends Base {
    constructor(ctx) {
      super(ctx, "pz-same", "Same letter");
      this.known = knownChars(ctx);
      const firsts = (ctx.items || []).map((i) => i.display).filter((c) => this.known.includes(c));
      this.targets = [...new Set([...firsts, ...shuffle(this.known)])];
      this.rounds = Math.min(4, this.targets.length); this.round = 0;
      this.level = ctx.beginner ? 0 : 1;
      if (this.known.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      const target = this.targets[this.round];
      this.target = target; this.missed = false; this.busy = false;
      // Distractors: dot-siblings first (they look most alike), then others.
      const sib = siblings(target, this.known);
      const others = shuffle(this.known.filter((c) => c !== target && !sib.includes(c)));
      const n = this.ctx.beginner ? 2 : 3;
      const picks = [...shuffle(sib), ...others].slice(0, n - 1);
      // Level 0: upright. Level 1: everyone tumbles. Level 2: plus a mirror trap.
      const turns = [0, 90, 180, 270];
      const spin = () => (this.level >= 1 ? turns[1 + Math.floor(Math.random() * 3)] : 0);
      const tiles = [{ c: target, rot: spin(), flip: false, right: true }, ...picks.map((c) => ({ c, rot: spin(), flip: false, right: false }))];
      // A mirror trap only for letters that change when mirrored — ا ب ت ث ن
      // are left-right symmetric, so their mirror image IS the same letter.
      if (this.level >= 2 && !this.ctx.beginner && !SYMMETRIC.has(target)) tiles[tiles.length - 1] = { c: target, rot: spin(), flip: true, right: false };
      this.tiles = shuffle(tiles);
      this.root.innerHTML = `
        <div class="pz-target"><span>${F().art(target, { size: 120, mode: "plain" })}</span></div>
        <div class="pz-board">${this.tiles.map((t, i) => `<button type="button" class="pz-tile" data-i="${i}" aria-label="Letter ${i + 1}"><span class="pz-turned" style="transform:rotate(${t.rot}deg)${t.flip ? " scaleX(-1)" : ""}">${F().art(t.c, { size: 88, mode: "plain" })}</span></button>`).join("")}</div>
        ${this.dots(this.rounds, this.round)}`;
      this.root.querySelectorAll(".pz-tile").forEach((b) => b.addEventListener("click", () => this.tap(Number(b.dataset.i), b)));
      this.ctx.beginRound?.(item(target), "letter-form");
    }
    tap(i, btn) {
      if (this.busy) return;
      const t = this.tiles[i];
      const chosen = t.right ? this.target : t.flip ? `${this.target}~mirror` : t.c;
      this.report(this.target, chosen, this.tiles.map((x) => x.right ? this.target : x.flip ? `${x.c}~mirror` : x.c), { skill: "letter-form" });
      if (!t.right) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".pz-tile").forEach((b, k) => b.classList.toggle("is-hint", this.tiles[k].right));
        return;
      }
      this.busy = true;
      // The tumbled letter stands back up, then becomes its friend.
      const turned = btn.querySelector(".pz-turned");
      if (turned) turned.style.transform = "rotate(0deg)";
      btn.querySelector("svg.lf")?.classList.remove("is-plain");
      this.cheer(btn);
      this.ctx.say?.(item(this.target));
      // A clean answer makes the next one a little harder; a miss, easier.
      this.level = Math.max(0, Math.min(this.ctx.beginner ? 0 : 2, this.level + (this.missed ? -1 : 1)));
      this.round += 1;
      this.later(() => this.next(), 2200);
    }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800); }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { EchoParade, DotsLast, LetterTrain, SameLetter });
  ns.PuzzleGames = { KINDS: ["EchoParade", "DotsLast", "LetterTrain", "SameLetter"], siblings, dotsOf, bodyKey, ORDER };
})(window.MiftahGame || (window.MiftahGame = {}));
