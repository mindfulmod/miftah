// Looking Games (v51–v52, 2026-10-08): two games about SEEING the small
// differences that make Arabic letters different.
//
//   SpotChange   (v51) a row of letters on garden stones. Look… the lights
//                blink… one letter has changed. Which one? For older
//                children the change is usually just a dot (ب became ت), so
//                the eye learns to check dots. A little sprout sees a letter
//                swap for a very different one. "Look again" shows the
//                stones as they were (and counts as help).
//   FamilyBuses  (v52) letters that share a body are one family: ب ت ث,
//                ج ح خ, د ذ, ر ز, س ش, ص ض, ط ظ, ع غ. Each bus is driven by
//                one family member; a passenger arrives and boards the bus
//                whose driver has the same shape. Same body, different dots —
//                the idea behind the curriculum's letter packs.
//
// House rules: nothing timed (the "look" pause is a pause, not a clock), a
// miss is a soft sound and a hint, evidence is honest, reduced motion is
// respected, and Little Sprout gets the gentlest version.
(function (ns) {
  const INK = "#4a3620";
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const F = () => ns.LetterFriends;
  const S = () => ns.LettersStrokes;
  const nameOf = (c) => (ns.LETTERS_DATA?.packs || []).flatMap((p) => p.letters).find((l) => l.char === c)?.arName || c;
  const item = (c) => ({ id: c, display: c, speak: nameOf(c) });
  const knownChars = (ctx) => [...new Set([...(ctx.items || []), ...(ctx.known || [])].map((i) => i?.display).filter((c) => F()?.FRIENDS?.[c]))];
  const firstsOf = (ctx, pool) => (ctx.items || []).map((i) => i?.display).filter((c) => pool.includes(c));
  const bodyKey = (c) => (S()?.LETTERS?.[c] || []).filter((s) => typeof s === "string").join("|");
  const smart = (target, pool, n, skill, beginner) => (ns.gardenBrain?.others ? ns.gardenBrain.others(target, pool, n, { skill, beginner }) : shuffle(pool.filter((c) => c !== target)).slice(0, n));
  // Families among the given letters: same body, any dots, in alphabet order.
  function families(chars) {
    const order = (ns.LETTERS_DATA?.packs || []).flatMap((p) => p.letters.map((l) => l.char));
    const rank = (c) => { const i = order.indexOf(c); return i < 0 ? 99 : i; };
    const map = new Map();
    for (const c of chars) { const k = bodyKey(c); if (!k) continue; if (!map.has(k)) map.set(k, []); map.get(k).push(c); }
    return [...map.values()].map((f) => f.sort((a, b) => rank(a) - rank(b)));
  }

  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.timers = [];
      ctx.stage.innerHTML = `<div class="tb lk ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
    }
    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); return t; }
    dots(n, at) { return `<div class="tb-progress" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < at ? "is-done" : i === at ? "is-on" : ""}"></i>`).join("")}</div>`; }
    still() { return !!this.ctx.reducedMotion?.(); }
    wobble(el) { if (!this.still()) el?.animate?.([{ rotate: "0deg" }, { rotate: "-7deg" }, { rotate: "7deg" }, { rotate: "0deg" }], { duration: 360 }); }
    cheer(el) { this.ctx.correct?.(); this.ctx.confettiAt?.(el); this.ctx.pet?.cheer?.(); }
    say(it) { try { return this.ctx.say?.(it); } catch { return false; } }
    report(target, chosen, offered, { skill = "letter-form", affects = true } = {}) {
      const correct = chosen === target;
      this.ctx.reportOutcome?.({ item: item(target), itemId: target, activity: this.constructor.name, skill, correct,
        evidence: "supported_visible_matching", assisted: !!this.missed, selectedId: chosen, choiceIds: offered, affectsStrength: affects });
      return correct;
    }
    finish(ms = 800) { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), ms); }
    replayPrompt() {}
    destroy() { this.alive = false; this.timers.forEach(clearTimeout); }
  }

  // ---------- v51 Spot the Change ----------
  const STONE = `<svg class="lk-stone-art" viewBox="0 0 100 70" aria-hidden="true"><path d="M8 44Q6 14 50 12Q94 14 92 44Q92 64 50 64Q8 64 8 44Z" fill="#e5dcc8" stroke="${INK}" stroke-width="3"/><path d="M20 52Q50 60 80 52" fill="none" stroke="#c9bda4" stroke-width="3" stroke-linecap="round"/></svg>`;
  const EYE = `<svg viewBox="0 0 100 60" aria-hidden="true"><path d="M6 30Q50 -10 94 30Q50 70 6 30Z" fill="#fffdf7" stroke="${INK}" stroke-width="4"/><circle cx="50" cy="30" r="14" fill="#3a8fc4"/><circle cx="50" cy="30" r="7" fill="${INK}"/><circle cx="45" cy="25" r="3" fill="#fffdf7"/></svg>`;

  class SpotChange extends Base {
    constructor(ctx) {
      super(ctx, "lk-spot", "Spot the change");
      // Its replay button means "look again", so it shows an eye.
      this.replayIcon = `<svg viewBox="0 0 100 60" width="56" height="34" aria-hidden="true"><path d="M6 30Q50 -10 94 30Q50 70 6 30Z" fill="#fffdf7" stroke="${INK}" stroke-width="6"/><circle cx="50" cy="30" r="14" fill="#3a8fc4"/><circle cx="50" cy="30" r="7" fill="${INK}"/></svg>`;
      this.known = knownChars(ctx);
      this.rounds = ctx.beginner ? 3 : 4; this.round = 0;
      if (this.known.length < 3) { this.later(() => ctx.done?.(), 300); return; }
      this.firsts = firstsOf(ctx, this.known);
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      this.missed = false; this.busy = true; this.phase = "look";
      // v58: always leave one known letter off the board to change into — with
      // exactly 4 known, every round was skipped and the game ended at once.
      const n = Math.min(this.ctx.beginner ? 3 : this.round < 2 ? 4 : 5, this.known.length - 1);
      // Older children: put a letter with dot-siblings on the board, so the
      // change can be just a dot.
      const fams = families(this.known).filter((f) => f.length > 1);
      const lead = this.firsts[this.round] || (!this.ctx.beginner && fams.length ? shuffle(shuffle(fams)[0])[0] : null);
      const board = [...new Set([...(lead ? [lead] : []), ...shuffle(this.known)])].slice(0, n);
      this.before = shuffle(board);
      // Which stone changes, and into what.
      const sibsOf = (c) => this.known.filter((o) => o !== c && bodyKey(o) === bodyKey(c) && !this.before.includes(o));
      let at = this.ctx.beginner ? Math.floor(Math.random() * n) : this.before.findIndex((c) => sibsOf(c).length);
      if (at < 0) at = Math.floor(Math.random() * n);
      const was = this.before[at];
      const into = (!this.ctx.beginner && shuffle(sibsOf(was))[0])
        || smart(was, this.known.filter((o) => !this.before.includes(o)), 1, "shape", this.ctx.beginner)[0];
      if (!into) { this.round += 1; return this.next(); }
      this.at = at; this.was = was; this.into = into;
      this.after = this.before.slice(); this.after[at] = into;
      this.root.innerHTML = `
        <div class="lk-eye${this.still() ? "" : " is-looking"}" aria-hidden="true">${EYE}</div>
        <div class="lk-row" style="--n:${n};--cols:${n <= 3 ? n : n === 4 ? 2 : 3}">${this.before.map((c, i) => `<button type="button" class="lk-stone" data-i="${i}" aria-label="${c}" disabled>${STONE}<span class="lk-letter">${F().art(c, { size: 110, mode: "plain" })}</span></button>`).join("")}<span class="lk-curtain" aria-hidden="true"></span></div>
        ${this.dots(this.rounds, this.round)}`;
      this.root.querySelectorAll(".lk-stone").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      // Tapping while it's still "look" time: the eye bounces — keep looking
      // (v57), so an eager tap is answered, not ignored.
      this.root.querySelector(".lk-row").addEventListener("pointerdown", () => {
        if (this.phase !== "look") return;
        const eye = this.root.querySelector(".lk-eye");
        if (eye && !this.still()) eye.animate?.([{ scale: "1" }, { scale: "1.25" }, { scale: "1" }], { duration: 320, easing: "cubic-bezier(.3,1.6,.5,1)" });
        this.ctx.sfx?.("glow");
      });
      this.ctx.beginRound?.(item(into), "letter-form");
      this.ctx.pet?.watch?.(this.root.querySelector(".lk-row"));
      // Look… then the lights blink and one letter changes.
      const look = this.ctx.beginner ? 3200 : 2600;
      this.later(() => this.blink(), look);
    }
    blink() {
      const row = this.root.querySelector(".lk-row");
      row.classList.add("is-dark");
      this.ctx.sfx?.("glow");
      this.later(() => {
        this.paint(this.after);
        row.classList.remove("is-dark");
        this.root.querySelector(".lk-eye")?.classList.add("is-asking");
        this.phase = "find"; this.busy = false;
        this.root.querySelectorAll(".lk-stone").forEach((b) => { b.disabled = false; });
      }, 900);
    }
    paint(list) {
      this.root.querySelectorAll(".lk-stone").forEach((b, i) => {
        b.setAttribute("aria-label", list[i]);
        b.querySelector(".lk-letter").innerHTML = F().art(list[i], { size: 110, mode: "plain" });
      });
    }
    // "Look again": the stones show how they were for a moment (that's help).
    replayPrompt() {
      if (this.phase !== "find" || this.busy) return;
      this.missed = true; this.busy = true;
      this.paint(this.before);
      this.root.querySelector(`.lk-stone[data-i="${this.at}"]`)?.classList.add("is-was");
      this.later(() => { this.paint(this.after); this.root.querySelector(".lk-stone.is-was")?.classList.remove("is-was"); this.busy = false; }, 1500);
    }
    pick(i, btn) {
      if (this.busy || this.phase !== "find") return;
      const ids = this.after.map((c, k) => `${k}:${c}`);
      // Noticing a change leans on memory as well as on seeing the letter, so
      // it is recorded honestly but never moves a letter's strength.
      const right = this.report(`${this.at}:${this.into}`, ids[i], ids, { affects: false });
      if (!right) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        if (this.missed) this.root.querySelectorAll(".lk-stone").forEach((b, k) => b.classList.toggle("is-hint", k === this.at));
        return;
      }
      this.busy = true;
      btn.classList.add("is-found");
      btn.insertAdjacentHTML("beforeend", `<span class="lk-was" aria-hidden="true">${F().art(this.was, { size: 40, mode: "plain" })}</span><span class="lk-pop" aria-hidden="true">${F().art(this.into, { size: 70 })}</span>`);
      this.cheer(btn);
      this.ctx.sfx?.(F().get(this.into).call);
      this.later(() => this.say(item(this.into)), 500);
      this.round += 1;
      this.later(() => this.next(), 2800);
    }
  }

  // ---------- v52 Family Buses ----------
  const BUS_COLORS = ["#ee806f", "#62cdf4", "#f3c955", "#7fce54"];
  // 2026-10-18 (construction detail): a real little bus — roof rack, framed rounded windows (seat positions unchanged), a cream
  // stripe, front and back bumpers, head and tail lights, wheel arches and
  // spoked hubcaps.
  const BUS = (color) => `<svg class="lk-bus-art" viewBox="0 0 160 100" aria-hidden="true">
    <path d="M30 10V4M120 10V4" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><rect x="24" y="0" width="104" height="6" rx="3" fill="#c69434" stroke="${INK}" stroke-width="2.4"/>
    <path d="M10 22Q10 10 22 10H134Q150 10 152 26L156 70Q156 80 146 80H18Q10 80 10 72Z" fill="${color}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M12 58H155" stroke="#fffaf0" stroke-width="6"/><path d="M12 55H155M12 61H155" stroke="${INK}" stroke-width="1.6" opacity=".35"/>
    <path d="M96 16H140Q147 16 148 26L151 52H96Z" fill="#ccfbef" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M104 22L114 22" stroke="#fffdf7" stroke-width="3" stroke-linecap="round"/>
    ${[20, 56].map((x) => `<rect x="${x}" y="18" width="28" height="32" rx="6" fill="#fffdf7" stroke="${INK}" stroke-width="3"/>`).join("")}
    <path d="M26 92Q26 74 40 74Q54 74 54 92M110 92Q110 74 124 74Q138 74 138 92" fill="${INK}" opacity=".18"/>
    ${[40, 124].map((x) => `<circle cx="${x}" cy="82" r="12" fill="${INK}"/><circle cx="${x}" cy="82" r="6" fill="#c9bda4"/><path d="M${x - 5} 82H${x + 5}M${x} 77V87" stroke="#a89478" stroke-width="1.6"/>`).join("")}
    <rect x="148" y="66" width="12" height="9" rx="4" fill="#c9bda4" stroke="${INK}" stroke-width="2.4"/><rect x="4" y="66" width="12" height="9" rx="4" fill="#c9bda4" stroke="${INK}" stroke-width="2.4"/>
    <circle cx="151" cy="60" r="4.5" fill="#ffe49a" stroke="${INK}" stroke-width="2.4"/><rect x="9" y="56" width="6" height="8" rx="3" fill="#ee806f" stroke="${INK}" stroke-width="1.6"/>
    <ellipse cx="30" cy="16" rx="12" ry="2.4" fill="#fffdf7" opacity=".55"/></svg>`;

  class FamilyBuses extends Base {
    constructor(ctx) {
      super(ctx, "lk-buses", "Family buses");
      this.noReplay = true;
      this.known = knownChars(ctx);
      this.fams = families(this.known);
      this.big = this.fams.filter((f) => f.length > 1);
      if (!this.big.length || this.fams.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      // Passengers: family members who are not their family's driver, the
      // chapter's own letters first.
      const firsts = firstsOf(ctx, this.known);
      const riders = this.big.flatMap((f) => f.slice(1));
      this.queue = [...new Set([...firsts.filter((c) => riders.includes(c)), ...shuffle(riders)])].slice(0, ctx.beginner ? 3 : 4);
      this.round = 0;
      this.next();
    }
    famOf(c) { return this.fams.find((f) => f.includes(c)); }
    next() {
      if (this.round >= this.queue.length) return this.finish();
      const c = this.queue[this.round];
      this.c = c; this.missed = false; this.busy = false;
      const home = this.famOf(c);
      const n = Math.min(this.ctx.beginner ? 2 : 3, this.fams.length);
      // The other buses: families whose bodies look least alike for a little
      // sprout (and while the shape is new), more alike once it is known.
      const drivers = this.fams.filter((f) => f !== home).map((f) => f[0]);
      const others = smart(home[0], drivers, n - 1, "shape", this.ctx.beginner);
      this.buses = shuffle([home[0], ...others]);
      this.want = home[0];
      this.root.innerHTML = `
        <div class="lk-stop"><span class="lk-rider">${F().art(c, { size: 92, mode: "plain" })}</span></div>
        <div class="lk-road">${this.buses.map((d, i) => `<button type="button" class="lk-bus" data-i="${i}" aria-label="The bus driven by ${d}">${BUS(BUS_COLORS[i % BUS_COLORS.length])}<span class="lk-driver">${F().art(d, { size: 40, mode: "plain" })}</span><span class="lk-seats"></span></button>`).join("")}</div>
        ${this.dots(this.queue.length, this.round)}`;
      this.root.querySelectorAll(".lk-bus").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      this.ctx.beginRound?.(item(c), "letter-form");
      this.later(() => this.say(item(c)), 300);
    }
    pick(i, btn) {
      if (this.busy) return;
      const ids = this.buses.map((d) => `${this.c}:${d}`);
      const right = this.report(`${this.c}:${this.want}`, ids[i], ids);
      if (!right) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".lk-bus").forEach((b, k) => b.classList.toggle("is-hint", this.buses[k] === this.want));
        return;
      }
      this.busy = true;
      // The rider hops on beside the driver: same body, different dots.
      btn.querySelector(".lk-seats").insertAdjacentHTML("beforeend", `<i>${F().art(this.c, { size: 34, mode: "plain" })}</i>`);
      this.root.querySelector(".lk-rider")?.classList.add("is-boarded");
      btn.classList.add("is-going");
      this.cheer(btn);
      this.ctx.sfx?.("chime");
      this.later(() => this.say(item(this.want)), 500);
      this.later(() => this.say(item(this.c)), 1500);
      this.round += 1;
      this.later(() => this.next(), 3000);
    }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { SpotChange, FamilyBuses });
  ns.LookGames = { KINDS: ["SpotChange", "FamilyBuses"], families };
})(window.MiftahGame || (window.MiftahGame = {}));
