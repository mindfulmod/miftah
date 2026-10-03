// Lantern Hunt and Letter Shadows (v32, 2026-10-03): two more Big Brain
// Academy activities, rebuilt for Arabic letters and small hands.
//
//   LanternHunt   ← Wii / Switch "Species Spotlight": the night garden is dark;
//                 a lantern lights a circle around it. The pet asks for a
//                 letter; find every one hiding in the dark. A tap in the dark
//                 moves the lantern there (no dragging needed for a two-year-
//                 old); a tap on something lit picks it. Found letters fly
//                 into the jar and glow.
//   LetterShadows ← DS "Shadow Shift": shadows drift across a puppet-theatre
//                 screen; tap the letter each shadow belongs to and it steps
//                 into the light as itself. First a friend's shadow (its
//                 features help), then a moving one, then two plain-letter
//                 shadows at once, tapped in any order.
//
// Same garden rules: nothing timed or scored, a miss only wobbles and the
// right answer glows after it, little sprouts keep the gentlest version, and
// only honest answers become evidence.
(function (ns) {
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const F = () => ns.LetterFriends;
  const nameOf = (c) => (ns.LETTERS_DATA?.packs || []).flatMap((p) => p.letters).find((l) => l.char === c)?.arName || c;
  const item = (c) => ({ id: c, display: c, speak: nameOf(c) });
  const knownChars = (ctx) => [...new Set([...(ctx.items || []), ...(ctx.known || [])].map((i) => i?.display).filter((c) => F()?.FRIENDS?.[c]))];

  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.timers = [];
      ctx.stage.innerHTML = `<div class="sh ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
    }
    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); return t; }
    dots(n, at) { return `<div class="pz-progress" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < at ? "is-done" : i === at ? "is-on" : ""}"></i>`).join("")}</div>`; }
    wobble(el) { if (!this.ctx.reducedMotion?.()) el?.animate?.([{ rotate: "0deg" }, { rotate: "-8deg" }, { rotate: "8deg" }, { rotate: "0deg" }], { duration: 360 }); }
    say(it) {
      let r; try { r = this.ctx.say?.(it); } catch { r = false; }
      if (r?.then) r.then((h) => { if (h === false) this.heard = false; }, () => {});
      return r;
    }
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

  // ---------- Lantern Hunt ----------
  const JAR = `<svg viewBox="0 0 60 70" aria-hidden="true"><path d="M14 10H46V18Q54 24 54 36V60Q54 66 48 66H12Q6 66 6 60V36Q6 24 14 18Z" fill="#ccfbef" opacity=".55" stroke="#fffdf7" stroke-width="3" stroke-linejoin="round"/><path d="M12 4H48V12H12Z" fill="#c69434" stroke="#fffdf7" stroke-width="2.4"/></svg>`;
  const LANTERN = `<svg viewBox="0 0 60 80" aria-hidden="true"><path d="M30 2V12" stroke="#4a3620" stroke-width="3" stroke-linecap="round"/><path d="M18 12H42L46 22H14Z" fill="#c69434" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M16 22H44V60H16Z" fill="#ffe49a" stroke="#4a3620" stroke-width="3"/><path d="M30 30Q38 40 30 52Q22 40 30 30Z" fill="#e8743c"/><path d="M14 60H46L42 70H18Z" fill="#c69434" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/></svg>`;

  class LanternHunt extends Base {
    constructor(ctx) {
      super(ctx, "sh-lantern", "Lantern hunt");
      this.known = knownChars(ctx);
      const firsts = (ctx.items || []).map((i) => i.display).filter((c) => this.known.includes(c));
      this.asks = [...new Set([...firsts, ...shuffle(this.known)])].slice(0, 2);
      this.round = 0;
      this.radius = ctx.beginner ? 30 : 21; // percent of the scene's width
      if (this.known.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.asks.length) return this.finish();
      const target = this.asks[this.round];
      this.target = target; this.missed = false; this.heard = true; this.found = 0;
      const nTarget = this.ctx.beginner ? 2 : 3;
      const others = shuffle(this.known.filter((c) => c !== target));
      const decoys = Array.from({ length: this.ctx.beginner ? 3 : 5 }, (_, i) => others[i % others.length]);
      // Hiding places on a jittered grid, so nothing overlaps.
      // Upright screens get a tall night garden (3 across, 4 down).
      const tall = (this.ctx.stage.clientHeight || 0) > (this.ctx.stage.clientWidth || 1) * 1.05;
      this.tall = tall;
      const cols = tall ? 3 : 4, rows = tall ? 4 : 3;
      const slots = shuffle(Array.from({ length: 12 }, (_, i) => ({ x: (100 / cols) * ((i % cols) + 0.5) + (Math.random() * 6 - 3), y: (100 / rows) * (Math.floor(i / cols) + 0.5) + (Math.random() * 6 - 3) })));
      this.hidden = shuffle([...Array(nTarget).fill(target), ...decoys]).map((c, i) => ({ c, ...slots[i] }));
      this.root.innerHTML = `
        <div class="sh-night${this.tall ? " is-tall" : ""}">
          ${this.hidden.map((h, i) => `<button type="button" class="sh-thing" data-i="${i}" style="left:${h.x}%;top:${h.y}%" aria-label="Something in the dark"><span class="sh-glow">${F().art(h.c, { size: 64, mode: "plain" })}</span></button>`).join("")}
          <div class="sh-dark" aria-hidden="true"></div>
          <span class="sh-lantern-icon" aria-hidden="true">${LANTERN}</span>
          <span class="sh-jar" aria-label="Letters found">${JAR}<span class="sh-jar-in"></span></span>
          ${Array.from({ length: 6 }, (_, i) => `<i class="sh-firefly" style="--i:${i}" aria-hidden="true"></i>`).join("")}
        </div>
        ${this.dots(this.asks.length, this.round)}`;
      this.scene = this.root.querySelector(".sh-night");
      this.moveTo(50, 50);
      this.scene.addEventListener("pointerdown", (e) => this.point(e));
      this.scene.addEventListener("pointermove", (e) => { if (e.buttons) this.point(e); });
      this.root.querySelectorAll(".sh-thing").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); this.pick(Number(b.dataset.i), b); }));
      this.ctx.beginRound?.(item(target), "letter-name");
      if (this.ctx.canListen?.() === false) { this.ctx.prompt?.(item(target)); this.heard = false; }
      this.later(() => this.say(item(target)), 300);
    }
    point(e) {
      const r = this.scene.getBoundingClientRect();
      if (!r.width) return;
      // Pointing at something already lit means picking it, not moving.
      const thing = e.target?.closest?.(".sh-thing");
      if (thing && this.isLit(thing)) return;
      // Lighting something up is its own tap: the click that follows must
      // not pick it straight out of the dark.
      this.justLit = thing || null;
      this.moveTo(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
    }
    moveTo(x, y) {
      this.lx = Math.max(0, Math.min(100, x)); this.ly = Math.max(0, Math.min(100, y));
      this.scene.style.setProperty("--lx", `${this.lx}%`);
      this.scene.style.setProperty("--ly", `${this.ly}%`);
      this.scene.style.setProperty("--lr", `${((this.scene.clientWidth || 600) * this.radius) / 100}px`);
      this.root.querySelectorAll(".sh-thing").forEach((b) => b.classList.toggle("is-lit", this.isLit(b)));
    }
    isLit(b) {
      const h = this.hidden[Number(b.dataset.i)];
      const r = this.scene.getBoundingClientRect();
      const aspect = r.height && r.width ? r.height / r.width : 0.6;
      return Math.hypot(h.x - this.lx, (h.y - this.ly) * aspect) <= this.radius * 0.95;
    }
    pick(i, b) {
      if (b.classList.contains("is-found")) return;
      if (this.justLit === b) { this.justLit = null; return; }
      if (!this.isLit(b)) { const h = this.hidden[i]; this.moveTo(h.x, h.y); this.ctx.sfx?.("glow"); return; }
      const c = this.hidden[i].c;
      const right = this.report(this.target, c, [...new Set(this.hidden.map((h) => h.c))], { listening: true });
      this.say(item(c));
      if (!right) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(b);
        return;
      }
      b.classList.add("is-found");
      this.ctx.sfx?.("glow");
      this.ctx.confettiAt?.(b);
      this.root.querySelector(".sh-jar-in").insertAdjacentHTML("beforeend", `<i>${F().art(c, { size: 26, mode: "plain" })}</i>`);
      this.found += 1;
      const total = this.hidden.filter((h) => h.c === this.target).length;
      if (this.found < total) { this.ctx.beginRound?.(item(this.target), "letter-name"); return; }
      // All found: the whole garden lights up for a moment.
      this.scene.classList.add("is-dawn");
      this.ctx.correct?.(); this.ctx.pet?.cheer?.();
      this.round += 1;
      this.later(() => this.next(), 2600);
    }
    replayPrompt() { if (this.target) this.say(item(this.target)); }
    finish() { this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800); }
  }

  // ---------- Letter Shadows ----------
  class LetterShadows extends Base {
    constructor(ctx) {
      super(ctx, "sh-shadows", "Letter shadows");
      this.known = knownChars(ctx);
      const firsts = (ctx.items || []).map((i) => i.display).filter((c) => this.known.includes(c));
      this.order = [...new Set([...firsts, ...shuffle(this.known)])];
      this.rounds = Math.min(4, this.order.length); this.round = 0;
      // 0: one friend's shadow, still · 1: one shadow, drifting · 2: two plain
      // letter shadows drifting at once.
      this.level = 0;
      this.max = ctx.beginner ? 0 : 2;
      this.cursor = 0;
      if (this.known.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      this.missed = false; this.busy = false;
      const count = this.level >= 2 && this.known.length >= 3 ? 2 : 1;
      this.targets = Array.from({ length: count }, () => this.order[this.cursor++ % this.order.length]).filter((c, i, a) => a.indexOf(c) === i);
      this.left = this.targets.slice();
      const n = Math.min(this.ctx.beginner ? 2 : this.targets.length + 2, this.known.length);
      this.offered = shuffle([...this.targets, ...shuffle(this.known.filter((c) => !this.targets.includes(c))).slice(0, Math.max(0, n - this.targets.length))]);
      const plain = this.level >= 2;
      const moving = this.level >= 1 && !this.ctx.reducedMotion?.();
      this.root.innerHTML = `
        <div class="sh-screen${moving ? " is-moving" : ""}">
          ${this.targets.map((c, i) => `<span class="sh-shadow" data-c="${c}" style="--i:${i};--n:${this.targets.length}">${F().art(c, { size: 150, mode: plain ? "plain" : "full" })}</span>`).join("")}
        </div>
        <div class="pz-board">${this.offered.map((c, i) => `<button type="button" class="pz-tile" data-i="${i}" aria-label="${c}">${F().art(c, { size: 84, mode: "plain" })}</button>`).join("")}</div>
        ${this.dots(this.rounds, this.round)}`;
      this.root.querySelectorAll(".pz-tile").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      this.ctx.beginRound?.(item(this.left[0]), "letter-form");
      this.ctx.sfx?.("creak");
    }
    pick(i, b) {
      if (this.busy || b.disabled) return;
      const c = this.offered[i];
      // Any shadow still on the screen is a right answer (DS-style: any order).
      const right = this.left.includes(c);
      this.report(right ? c : this.left[0], c, this.offered, { skill: "letter-form" });
      if (!right) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(b);
        this.root.querySelectorAll(".pz-tile").forEach((t, k) => t.classList.toggle("is-hint", this.left.includes(this.offered[k])));
        return;
      }
      this.left = this.left.filter((x) => x !== c);
      b.disabled = true; b.classList.add("is-used");
      this.root.querySelectorAll(".pz-tile").forEach((t) => t.classList.remove("is-hint"));
      // The shadow steps into the light as itself.
      const sh = this.root.querySelector(`.sh-shadow[data-c="${c}"]`);
      if (sh) { sh.classList.add("is-lit"); sh.querySelector("svg.lf")?.classList.remove("is-plain"); }
      this.ctx.sfx?.(F().get(c).call);
      this.say(F().item(c));
      this.ctx.confettiAt?.(sh || b);
      if (this.left.length) { this.ctx.beginRound?.(item(this.left[0]), "letter-form"); return; }
      this.busy = true;
      this.ctx.correct?.(); this.ctx.pet?.cheer?.();
      this.level = Math.max(0, Math.min(this.max, this.level + (this.missed ? -1 : 1)));
      this.round += 1;
      this.later(() => this.next(), 2400);
    }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800); }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { LanternHunt, LetterShadows });
  ns.ShadowGames = { KINDS: ["LanternHunt", "LetterShadows"] };
})(window.MiftahGame || (window.MiftahGame = {}));
