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
  const norm = (value) => typeof value === "string" ? value.normalize("NFC") : "";
  const item = (c) => ({ id: c, display: c, speak: nameOf(c) });
  const eligible = (i, ctx) => i && i.id != null && norm(i.display) && i.taught !== false && i.isTaught !== false
    && i.locked !== true && i.unlocked !== false
    && (!ctx.completedWorldIds || !(i.prerequisiteWorldIds || []).some((id) => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
  const knownItems = (ctx) => {
    const all = [...(ctx.items || []), ...(ctx.known || []), ...(ctx.extraItems || [])].map((v) => typeof v === "string" ? { id: v, display: v } : v).filter(Boolean);
    const blocked = new Set(all.filter((i) => !eligible(i, ctx)).map((i) => norm(i.display)).filter(Boolean));
    const seen = new Set(), result = [];
    for (const i of all) {
      const display = norm(i.display);
      if (!eligible(i, ctx) || blocked.has(display) || seen.has(display) || !F()?.FRIENDS?.[display]) continue;
      seen.add(display); result.push({ ...i, display });
    }
    return result;
  };
  const planItems = (ctx, candidates, count, skill = "letter-form") => {
    const pool = knownItems(ctx).filter((i) => candidates.some((c) => c.display === i.display));
    const planned = ns.PracticeLearning?.plan?.(ctx, pool.slice(), skill, count);
    const valid = new Map(pool.map((i) => [String(i.id), i]));
    const byDisplay = new Map(pool.map((i) => [i.display, i]));
    if (Array.isArray(planned)) return [...new Set(planned.map((v) => v && typeof v === "object"
      ? (v.id != null ? valid.get(String(v.id)) : byDisplay.get(norm(v.display)))
      : valid.get(String(v)) || byDisplay.get(norm(v))).filter(Boolean))].slice(0, count);
    const ordered = ns.PracticeLearning?.orderChars?.(ctx, pool.map((i) => i.display), skill, count);
    if (Array.isArray(ordered)) return [...new Set(ordered.map((v) => v && typeof v === "object"
      ? (v.id != null ? valid.get(String(v.id)) : byDisplay.get(norm(v.display)))
      : byDisplay.get(norm(v))).filter(Boolean))].slice(0, count);
    return shuffle(pool).slice(0, count);
  };
  const practiceItem = (ctx, c) => knownItems(ctx).find((i) => i.display === norm(c)) || item(c);
  const level = (ctx, chars, skill) => Math.max(0, Math.min(2, Number(ns.PracticeLearning?.level?.(ctx, chars.map((c) => practiceItem(ctx, c)), skill)) || 0));
  const bodyKey = (c) => (S()?.LETTERS?.[c] || []).filter((s) => typeof s === "string").join("|");
  const smart = (target, pool, n, skill, beginner) => {
    const safe = [...new Set(pool.filter((c) => c !== target))];
    const raw = ns.gardenBrain?.others ? ns.gardenBrain.others(target, safe.slice(), n, { skill, beginner }) : shuffle(safe);
    const valid = [...new Set((Array.isArray(raw) ? raw : []).filter((c) => safe.includes(c)))].slice(0, n);
    return [...valid, ...shuffle(safe.filter((c) => !valid.includes(c)))].slice(0, n);
  };
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
      this.ctx = ctx; this.alive = true; this.timers = []; this.dragResets = []; this.roundToken = 0;
      ctx.stage.innerHTML = `<div class="tb lk ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
    }
    later(fn, ms, token = this.roundToken, root = this.root) { const t = setTimeout(() => { if (this.current(token, root)) fn(); }, ms); this.timers.push(t); return t; }
    current(token = this.roundToken, root = this.root) { return this.alive && token === this.roundToken && this.root === root && root?.isConnected !== false && (!this.ctx.stage?.contains || this.ctx.stage.contains(root)); }
    dots(n, at) { return `<div class="tb-progress" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < at ? "is-done" : i === at ? "is-on" : ""}"></i>`).join("")}</div>`; }
    still() { return !!this.ctx.reducedMotion?.(); }
    wobble(el) { if (!this.still()) el?.animate?.([{ opacity: 1 }, { opacity: .84 }, { opacity: 1 }], { duration: 360 }); }
    cheer(el) { this.ctx.correct?.(); this.ctx.confettiAt?.(el); this.ctx.pet?.cheer?.(); }
    say(it) { try { const result = this.ctx.say?.(it); return result?.then ? result.catch(() => false) : result; } catch { return false; } }
    report(target, chosen, offered, { skill = "letter-form", affects = true, itemId = target } = {}) {
      if (!this.alive) return false;
      const correct = chosen === target;
      const targetItem = knownItems(this.ctx).find((i) => String(i.id) === String(itemId)) || practiceItem(this.ctx, target);
      this.ctx.reportOutcome?.({ item: targetItem, itemId: targetItem.id, activity: this.constructor.name, skill, correct,
        evidence: "supported_visible_matching", assisted: !!this.missed, selectedId: chosen, choiceIds: offered, affectsStrength: affects });
      return correct;
    }
    finish(ms = 800) { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), ms); }
    replayPrompt() {}
    cancel() { if (typeof this.ctx.cancel === "function") this.ctx.cancel(); else this.ctx.done?.(); }
    destroy() { this.alive = false; this.timers.forEach(clearTimeout); this.dragResets.forEach((reset) => reset()); }
  }

  // ---------- v51 Spot the Change ----------
  const STONE = `<svg class="lk-stone-art" viewBox="0 0 100 70" aria-hidden="true"><path d="M8 44Q6 14 50 12Q94 14 92 44Q92 64 50 64Q8 64 8 44Z" fill="#e5dcc8" stroke="${INK}" stroke-width="3"/><path d="M20 52Q50 60 80 52" fill="none" stroke="#c9bda4" stroke-width="3" stroke-linecap="round"/></svg>`;
  const EYE = `<svg viewBox="0 0 100 60" aria-hidden="true"><path d="M6 30Q50 -10 94 30Q50 70 6 30Z" fill="#fffdf7" stroke="${INK}" stroke-width="4"/><circle cx="50" cy="30" r="14" fill="#3a8fc4"/><circle cx="50" cy="30" r="7" fill="${INK}"/><circle cx="45" cy="25" r="3" fill="#fffdf7"/></svg>`;

  class SpotChange extends Base {
    constructor(ctx) {
      super(ctx, "lk-spot", "Spot the change");
      this.noReplay = true;
      this.known = knownItems(ctx);
      this.visitLevel = level(ctx, this.known.map((i) => i.display), "letter-form");
      this.level = this.visitLevel;
      this.rounds = this.visitLevel ? 4 : 3; this.round = 0;
      this.planned = planItems(ctx, this.known, this.known.length, "letter-form");
      this.known = this.planned;
      this.boardSize = Math.min(this.visitLevel > 0 ? 3 : 2, this.known.length - 1);
      this.choiceCount = this.boardSize;
      if (this.known.length < 3 || this.choiceCount < 2) { this.later(() => this.cancel(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      const token = ++this.roundToken, root = this.root;
      this.missed = false; this.busy = false; this.phase = "look";
      const n = this.boardSize;
      const chosen = this.known[this.round % this.known.length];
      const boardPool = this.known.filter((i) => i.display !== chosen.display);
      const board = [chosen, ...shuffle(boardPool).slice(0, n - 1)];
      this.beforeItems = shuffle(board);
      const unused = this.known.filter((i) => !this.beforeItems.includes(i));
      // Choose the position as well as the replacement for the intended
      // difficulty. A random beginner position could force a dot-only swap
      // even when another stone has an obvious body-shape change available.
      const positions = this.beforeItems.map((item, at) => ({ item, at })).filter(({ item }) =>
        unused.some(other => this.level ? bodyKey(other.display) === bodyKey(item.display) : bodyKey(other.display) !== bodyKey(item.display)));
      this.at = positions.length ? shuffle(positions)[0].at : Math.floor(Math.random() * n);
      this.wasItem = this.beforeItems[this.at];
      const sibling = unused.filter((o) => bodyKey(o.display) === bodyKey(this.wasItem.display));
      const differentBody = unused.filter((o) => bodyKey(o.display) !== bodyKey(this.wasItem.display));
      const candidates = this.level && sibling.length ? sibling : !this.level && differentBody.length ? differentBody : unused;
      const intoItem = shuffle(candidates)[0];
      if (!intoItem) { this.roundToken += 1; this.round = this.rounds; return this.next(); }
      this.intoItem = intoItem; this.was = this.wasItem.display; this.into = intoItem.display;
      this.before = this.beforeItems.map((i) => i.display);
      this.after = this.before.slice(); this.after[this.at] = this.into;
      this.afterItems = this.beforeItems.slice(); this.afterItems[this.at] = this.intoItem;
      this.offered = this.beforeItems.map((i) => i.id);
      this.changedChoice = `${this.wasItem.id}->${this.intoItem.id}`;
      this.root.innerHTML = `
        <button type="button" class="lk-eye is-looking" aria-label="Ready to spot the change">${ns.LookPlayArt?.observe?.("look") || EYE}</button>
        <div class="lk-row" data-count="${n}" style="--n:${n};--cols:${n}">${this.before.map((c, i) => `<button type="button" class="lk-stone" data-i="${i}" aria-label="${c}" disabled>${ns.LookPlayArt?.stone?.() || STONE}<span class="lk-letter">${F().art(c, { size: 110, mode: "plain" })}</span></button>`).join("")}<span class="lk-curtain" aria-hidden="true"></span></div>
        <div class="lk-change-pair" data-change="${bodyKey(this.was) === bodyKey(this.into) ? 'dots' : 'body'}" role="group" aria-label="What changed" hidden><span class="lk-change-card" role="img" aria-label="Before: ${this.was}">${F().art(this.was, { size: 140, mode: "plain" })}</span><svg class="lk-change-arrow" viewBox="0 0 40 40" aria-hidden="true"><path d="M32 20H9M17 11L8 20L17 29" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="lk-change-card" role="img" aria-label="After: ${this.into}">${F().art(this.into, { size: 140, mode: "plain" })}</span></div>
        ${this.dots(this.rounds, this.round)}`;
      const eye = this.root.querySelector(".lk-eye");
      eye?.addEventListener("click", () => { if (!this.current(token, root) || this.busy) return; if (this.phase === "look") this.blink(token, root); else if (this.phase === "find") this.replayPrompt(token, root); else if (this.phase === "compare") this.continue(token, root); });
      this.root.querySelectorAll(".lk-stone").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b, token, root)));
      // Tapping while it's still "look" time: the eye bounces — keep looking
      // (v57), so an eager tap is answered, not ignored.
      this.root.querySelector(".lk-row").addEventListener("pointerdown", () => {
        if (!this.current(token, root) || this.phase !== "look") return;
        const eye = this.root.querySelector(".lk-eye");
        if (eye && !this.still()) eye.animate?.([{ scale: "1" }, { scale: "1.03" }, { scale: "1" }], { duration: 320, easing: "ease-in-out" });
        this.ctx.sfx?.("glow");
      });
      this.ctx.beginRound?.(intoItem, "letter-form");
      this.ctx.pet?.watch?.(this.root.querySelector(".lk-row"));
    }
    blink(token = this.roundToken, root = this.root) {
      if (!this.current(token, root) || this.phase !== "look" || this.busy) return false;
      this.busy = true; this.phase = "blink";
      const eye = this.root.querySelector(".lk-eye"); if (eye) eye.disabled = true;
      const row = this.root.querySelector(".lk-row");
      row?.classList.add("is-dark");
      this.ctx.sfx?.("glow");
      this.later(() => {
        if (!this.current(token, root)) return;
        this.paint(this.after);
        this.root.querySelectorAll(".lk-stone").forEach(stone => stone.classList.remove("is-was"));
        row?.classList.remove("is-dark");
        const button = this.root.querySelector(".lk-eye");
        if (button) { button.disabled = false; button.classList.remove("is-looking"); button.classList.add("is-asking"); button.setAttribute("aria-label", "Look again"); button.innerHTML = ns.LookPlayArt?.observe?.("find") || EYE; }
        this.phase = "find"; this.busy = false;
        this.root.querySelectorAll(".lk-stone").forEach((b) => { b.disabled = false; });
      }, 900);
      return true;
    }
    paint(list) {
      this.root.querySelectorAll(".lk-stone").forEach((b, i) => {
        b.setAttribute("aria-label", list[i]);
        b.querySelector(".lk-letter").innerHTML = F().art(list[i], { size: 110, mode: "plain" });
      });
    }
    // Review is another child-led look, not a second memory deadline.
    replayPrompt(token = this.roundToken, root = this.root) {
      if (!this.current(token, root) || this.phase !== "find" || this.busy) return false;
      this.missed = true; this.busy = false; this.phase = "look";
      const eye = this.root.querySelector(".lk-eye");
      if (eye) { eye.disabled = false; eye.classList.remove("is-asking"); eye.classList.add("is-looking"); eye.setAttribute("aria-label", "Ready to spot the change"); eye.innerHTML = ns.LookPlayArt?.observe?.("look") || EYE; }
      this.root.querySelectorAll(".lk-stone").forEach((stone) => { stone.disabled = true; });
      this.paint(this.before);
      this.root.querySelector(`.lk-stone[data-i="${this.at}"]`)?.classList.add("is-was");
      return true;
    }
    continue(token = this.roundToken, root = this.root) {
      if (!this.current(token, root) || this.phase !== "compare" || this.busy) return false;
      this.busy = true; this.round += 1; this.next();
      return true;
    }
    pick(i, btn, token = this.roundToken, root = this.root) {
      if (!this.current(token, root) || btn !== this.root.querySelectorAll(".lk-stone")[i] || this.busy || this.phase !== "find" || !Number.isInteger(i) || i < 0 || i >= this.after.length) return false;
      const ids = this.beforeItems.map((before, k) => `${before.id}->${this.afterItems[k].id}`);
      // Noticing a change leans on memory as well as on seeing the letter, so
      // it is recorded honestly but never moves a letter's strength.
      const right = this.report(this.changedChoice, ids[i], ids, { affects: false, itemId: this.intoItem.id });
      if (!right) {
        this.missed = true;
        this.busy = true;
        const eye = this.root.querySelector(".lk-eye"); if (eye) eye.disabled = true;
        this.root.querySelectorAll(".lk-stone").forEach((stone) => { stone.disabled = true; });
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        if (this.missed) this.root.querySelectorAll(".lk-stone").forEach((b, k) => b.classList.toggle("is-hint", k === this.at));
        this.later(() => { if (!this.current(token, root) || this.phase !== "find") return; this.busy = false; if (eye) eye.disabled = false; this.root.querySelectorAll(".lk-stone").forEach((stone) => { stone.disabled = false; }); }, 650, token, root);
        return true;
      }
      this.busy = true; this.phase = "compare";
      const eye = this.root.querySelector(".lk-eye"); if (eye) eye.disabled = true;
      this.root.querySelectorAll(".lk-stone").forEach((stone) => { stone.disabled = true; });
      btn.classList.add("is-found");
      this.root.querySelector(".lk-row").hidden = true;
      const pair = this.root.querySelector(".lk-change-pair");
      if (pair) pair.hidden = false;
      this.cheer(pair || btn);
      this.ctx.sfx?.(F().get(this.into).call);
      this.later(() => this.say(this.intoItem), 500, token, root);
      if (eye) { eye.classList.remove("is-asking", "is-looking"); eye.classList.add("is-next"); eye.setAttribute("aria-label", this.round === this.rounds - 1 ? "Finish finding changes" : "Next letter change"); eye.innerHTML = ns.LettersArt?.icon?.(this.round === this.rounds - 1 ? "check" : "next", 48) || `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 20H31M23 11L32 20L23 29" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`; }
      this.later(() => { this.busy = false; if (eye) eye.disabled = false; }, 320, token, root);
      return true;
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
      this.items = knownItems(ctx);
      this.level = level(ctx, this.items.map((i) => i.display), "letter-form");
      this.choiceCount = this.level ? 3 : 2;
      this.rounds = this.level ? 4 : 3;
      this.known = this.items.map((i) => i.display);
      this.fams = families(this.known);
      this.big = this.fams.filter((f) => f.length > 1);
      if (!this.big.length || this.fams.length < 2) { this.later(() => this.cancel(), 300); return; }
      this.planned = planItems(ctx, this.items, this.items.length, "letter-form");
      this.items = this.planned;
      this.fams = families(this.planned.map((i) => i.display)); this.big = this.fams.filter((f) => f.length > 1);
      this.choiceCount = Math.min(this.choiceCount, this.fams.length);
      this.riderItems = this.planned.filter((i) => this.famOf(i.display)?.length > 1);
      if (this.fams.length < 2 || !this.riderItems.length) { this.later(() => this.cancel(), 300); return; }
      this.queue = this.riderItems.slice(0, this.rounds);
      if (!this.queue.length) { this.later(() => this.cancel(), 300); return; }
      this.round = 0;
      this.next();
    }
    famOf(c) { return this.fams.find((f) => f.includes(c)); }
    next() {
      if (this.round >= this.queue.length) return this.finish();
      const token = ++this.roundToken, root = this.root;
      this.readyToLeave = false; this.boardedBus = null;
      this.root.classList.remove("is-comparing");
      this.dragResets.forEach((reset) => reset());
      this.dragResets.length = 0;
      const riderItem = this.queue[this.round], c = riderItem.display;
      this.c = c; this.riderItem = riderItem; this.missed = false; this.busy = false;
      const home = this.famOf(c);
      const n = Math.min(this.choiceCount, this.fams.length);
      // The other buses: families whose bodies look least alike for a little
      // sprout (and while the shape is new), more alike once it is known.
      const targetDriver = home.find((letter) => letter !== c);
      const decoys = this.fams.filter((f) => f !== home).map((f) => f[0]);
      const others = smart(targetDriver, decoys, n - 1, "shape", n === 2);
      this.buses = shuffle([targetDriver, ...others]).slice(0, n);
      if (this.buses.length < n || this.buses.includes(c)) { this.busy = true; this.round += 1; return this.next(); }
      this.driverItems = this.buses.map((d) => this.items.find((it) => it.display === d) || practiceItem(this.ctx, d));
      this.want = targetDriver;
      this.offered = this.driverItems.map((i) => i.id);
      this.wantItem = this.items.find((i) => i.display === targetDriver) || practiceItem(this.ctx, targetDriver);
      const offeredSnapshot = this.buses.slice();
      this.root.innerHTML = `
        <div class="lk-stop"><span class="lk-stop-art" aria-hidden="true">${ns.LookPlayArt?.busStop?.() || ""}</span><button class="lk-family-help" type="button" aria-label="Show the shared letter shape">${EYE}</button><span class="lk-rider" role="img" aria-label="Waiting letter ${c}">${F().art(c, { size: 92, mode: "plain" })}</span><span class="lk-family-peer" role="img" aria-label="Same body, different letter ${targetDriver}" hidden>${F().art(targetDriver, { size: 92, mode: "plain" })}</span></div>
        <div class="lk-road" data-count="${n}" style="--n:${this.buses.length}">${offeredSnapshot.map((d, i) => `<button type="button" class="lk-bus" data-i="${i}" aria-label="The bus driven by ${d}">${ns.LookPlayArt?.bus?.(BUS_COLORS[i % BUS_COLORS.length]) || BUS(BUS_COLORS[i % BUS_COLORS.length])}<span class="lk-driver">${F().art(d, { size: 40, mode: "plain" })}</span><span class="lk-seats"></span></button>`).join("")}</div>
        ${this.dots(this.queue.length, this.round)}`;
      const buses = Array.from(this.root.querySelectorAll(".lk-bus"));
      buses.forEach((b, i) => b.addEventListener("click", () => {
        if (b === this.boardedBus && this.readyToLeave) this.depart(token, root);
        else this.pick(i, b, token, root, offeredSnapshot);
      }));
      this.root.querySelector(".lk-family-help")?.addEventListener("click", () => this.showFamily(token, root));
      const rider = this.root.querySelector(".lk-rider");
      if (rider && ns.GardenPractice?.draggable) {
        const reset = ns.GardenPractice.draggable(rider, {
          enabled: () => this.current(token, root) && !this.busy && !rider.classList.contains("is-boarded"),
          onDragMove: (x, y) => { if (this.current(token, root) && !this.busy) { const receiving = this.receivingBus(buses, x, y); buses.forEach((bus) => bus.classList.toggle("is-receiving", bus === receiving)); } },
          onDragEnd: () => { if (this.current(token, root)) buses.forEach((bus) => bus.classList.remove("is-receiving")); },
          drop: (x, y) => {
            const currentBuses = Array.from(this.root.querySelectorAll(".lk-bus"));
            if (!this.current(token, root) || currentBuses.length !== buses.length || currentBuses.some((bus, i) => bus !== buses[i])) return false;
            const receiving = this.receivingBus(buses, x, y), index = receiving ? buses.indexOf(receiving) : -1;
            return index >= 0 ? this.pick(index, buses[index], token, root, offeredSnapshot) === true : false;
          },
        });
        if (typeof reset === "function") this.dragResets.push(reset);
      }
      this.ctx.beginRound?.(riderItem, "letter-form");
      this.later(() => this.say(riderItem), 300, token, root);
    }
    showFamily(token = this.roundToken, root = this.root, assist = true) {
      if (!this.current(token, root) || (assist && this.busy)) return false;
      if (assist) this.missed = true;
      this.root.classList.add("is-comparing");
      const peer = this.root.querySelector(".lk-family-peer"), help = this.root.querySelector(".lk-family-help");
      if (peer) peer.hidden = false;
      if (help) help.hidden = true;
      this.root.querySelectorAll(".lk-bus").forEach((bus, i) => bus.classList.toggle("is-family", this.buses[i] === this.want));
      return true;
    }
    depart(token = this.roundToken, root = this.root) {
      if (!this.current(token, root) || !this.readyToLeave || !this.boardedBus) return false;
      this.readyToLeave = false;
      const bus = this.boardedBus;
      bus.disabled = true; bus.classList.remove("is-ready"); bus.classList.add("is-going");
      this.ctx.sfx?.("chime");
      this.round += 1;
      this.later(() => this.next(), this.still() ? 220 : 2200, token, root);
      return true;
    }
    insideRect(el, x, y) { const r = el?.getBoundingClientRect?.(); return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; }
    centerDistance(el, x, y) { const r = el?.getBoundingClientRect?.(); return r ? Math.hypot(x - (r.left + r.right) / 2, y - (r.top + r.bottom) / 2) : Infinity; }
    edgeDistance(el, x, y) { const r = el?.getBoundingClientRect?.(); if (!r) return Infinity; const dx = Math.max(r.left - x, 0, x - r.right), dy = Math.max(r.top - y, 0, y - r.bottom); return Math.hypot(dx, dy); }
    near(el, x, y) { return this.insideRect(el, x, y) || this.edgeDistance(el, x, y) <= 28; }
    receivingBus(buses, x, y) {
      const actual = buses.filter((bus) => this.insideRect(bus, x, y)).sort((a, b) => this.centerDistance(a, x, y) - this.centerDistance(b, x, y));
      if (actual.length) return actual[0];
      return buses.filter((bus) => this.edgeDistance(bus, x, y) <= 28).sort((a, b) => this.centerDistance(a, x, y) - this.centerDistance(b, x, y))[0] || null;
    }
    pick(i, btn, token = this.roundToken, root = this.root, offeredSnapshot = this.buses) {
      const buses = this.root.querySelectorAll(".lk-bus");
      if (!this.current(token, root) || !Number.isInteger(i) || i < 0 || i >= this.buses.length || buses[i] !== btn
        || offeredSnapshot?.length !== this.buses.length || offeredSnapshot.some((d, k) => d !== this.buses[k]) || this.busy) return false;
      const selected = this.driverItems[i];
      const right = this.report(this.wantItem.id, selected.id, this.offered, { affects: false, itemId: this.riderItem.id });
      if (!right) {
        this.missed = true;
        this.showFamily(token, root);
        this.busy = true;
        this.root.querySelectorAll(".lk-bus").forEach((bus) => { bus.disabled = true; });
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".lk-bus").forEach((b, k) => b.classList.toggle("is-hint", this.buses[k] === this.want));
        this.later(() => { if (!this.current(token, root)) return; this.busy = false; this.root.querySelectorAll(".lk-bus").forEach((bus) => { bus.disabled = false; }); }, 650, token, root);
        return true;
      }
      this.busy = true;
      this.showFamily(token, root, false);
      this.boardedBus = btn; this.readyToLeave = false;
      // The rider hops on beside the driver: same body, different dots.
      this.root.querySelectorAll(".lk-bus").forEach((bus) => { bus.disabled = true; });
      btn.querySelector(".lk-seats").insertAdjacentHTML("beforeend", `<i class="lk-passenger" aria-label="${this.riderItem.speak}">${F().art(this.c, { size: 68, mode: "plain" })}</i>`);
      this.root.querySelector(".lk-rider")?.classList.add("is-boarded");
      this.cheer(btn);
      btn.insertAdjacentHTML("beforeend", `<span class="lk-depart-sign" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M8 20H31M23 11L32 20L23 29" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`);
      this.later(() => {
        this.readyToLeave = true; btn.disabled = false; btn.classList.add("is-ready");
        btn.setAttribute?.("aria-label", "Send this bus on its way");
      }, 320, token, root);
      this.later(() => this.say(this.wantItem), 500, token, root);
      this.later(() => this.say(this.riderItem), 1500, token, root);
      return true;
    }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { SpotChange, FamilyBuses });
  ns.LookGames = { KINDS: ["SpotChange", "FamilyBuses"], families };
})(window.MiftahGame || (window.MiftahGame = {}));
