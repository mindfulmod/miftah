// Lantern Hunt and Letter Shadows (v32, 2026-10-03): two more Big Brain
// Academy activities, rebuilt for Arabic letters and small hands.
//
//   LanternHunt   ← Wii / Switch "Species Spotlight": the night garden is dark;
//                 a lantern lights a circle around it. The pet asks for a
//                 letter; find every one hiding in the dark. A tap in the dark
//                 moves the lantern there (no dragging needed for a two-year-
//                 old); a tap on something lit picks it. Found letters fly
//                 into the jar and glow.
//   LetterShadows ← DS "Shadow Shift": shadows stand on a puppet-theatre
//                 screen; tap the letter each shadow belongs to and it steps
//                 into the light as itself. First a friend's shadow (its
//                 features help), then more choices, then a second still
//                 shadow. Plain letters follow a later evidence milestone.
//
// Same garden rules: nothing timed or scored, a miss only wobbles and the
// right answer glows after it, little sprouts keep the gentlest version, and
// only honest answers become evidence.
(function (ns) {
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const F = () => ns.LetterFriends;
  const nameOf = (c) => (ns.LETTERS_DATA?.packs || []).flatMap((p) => p.letters).find((l) => l.char === c)?.arName || c;
  const item = (c) => ({ id: c, display: c, speak: nameOf(c) });
  const practiceItem = (ctx, c) => [...(ctx.items || []), ...(ctx.known || [])].find((i) => i?.display === c) || item(c);
  const eligible = (it, ctx) => it && it.taught !== false && it.isTaught !== false && it.locked !== true && it.unlocked !== false
    && (!ctx.completedWorldIds || !(it.prerequisiteWorldIds || []).some((id) => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
  const knownChars = (ctx) => {
    const declared = [...(ctx.items || []), ...(ctx.known || [])].filter((i) => i?.display && F()?.FRIENDS?.[i.display]);
    const allowed = new Set(declared.filter((i) => eligible(i, ctx)).map((i) => i.display));
    for (const it of declared) if (!eligible(it, ctx)) allowed.delete(it.display);
    const taught = [...allowed];
    const planned = ns.PracticeLearning?.orderChars?.(ctx, taught, "letter-form", taught.length);
    const ordered = Array.isArray(planned) && planned.length ? planned : taught;
    return [...new Set(ordered.filter((c) => allowed.has(c)))];
  };
  const profile = (ctx, c, skill = "letter-form") => ns.PracticeLearning?.profile?.(ctx, practiceItem(ctx, c), skill) || { choiceCount: 2, promptMode: "match" };
  const level = (ctx, chars, skill) => Math.max(0, Math.min(2, Number(ns.PracticeLearning?.level?.(ctx, chars.map((c) => practiceItem(ctx, c)), skill)) || 0));
  const state = (ctx, it, skill) => (ctx.strength || ns.LettersStrength)?.skillProfile?.(it.id, skill) || {};

  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.timers = []; this.dragResets = [];
      ctx.stage.innerHTML = `<div class="sh ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      this.roundToken = 0;
      ctx.prompt?.(null);
    }
    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); return t; }
    dots(n, at) { return `<div class="pz-progress" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < at ? "is-done" : i === at ? "is-on" : ""}"></i>`).join("")}</div>`; }
    wobble(el) { if (!this.ctx.reducedMotion?.()) el?.animate?.([{ opacity: 1 }, { opacity: .84 }, { opacity: 1 }], { duration: 360 }); }
    say(it) {
      try {
        const result = this.ctx.say?.(it);
        // Feedback calls are often fire-and-forget; keep a failed clip from
        // becoming an unhandled rejection without changing the prompt result.
        if (result?.then) Promise.resolve(result).catch(() => {});
        return result;
      } catch { return false; }
    }
    report(target, chosen, offered, { skill = "letter-name", listening = false, itemId = target } = {}) {
      if (!this.alive) return false;
      const correct = chosen === target;
      const independent = listening && !this.missed && !this.assisted && this.heard === true;
      const targetItem = practiceItem(this.ctx, itemId);
      this.ctx.reportOutcome?.({ item: targetItem, itemId: targetItem.id, activity: this.constructor.name, skill, correct,
        evidence: independent ? "independent_listening" : "supported_visible_matching", assisted: !!(this.missed || this.assisted || (listening && !independent)),
        selectedId: chosen, choiceIds: offered,
        affectsStrength: !listening || this.heard === true || this.assisted === true });
      return correct;
    }
    replayPrompt() {}
    cancel() { if (typeof this.ctx.cancel === "function") this.ctx.cancel(); else this.ctx.done?.(); }
    destroy() { this.alive = false; this.pointerCancel?.({}); this.timers.forEach(clearTimeout); this.dragResets.forEach((reset) => reset()); }
  }

  // ---------- Lantern Hunt ----------
  const JAR = `<svg viewBox="0 0 60 70" aria-hidden="true"><path d="M14 10H46V18Q54 24 54 36V60Q54 66 48 66H12Q6 66 6 60V36Q6 24 14 18Z" fill="#ccfbef" opacity=".55" stroke="#fffdf7" stroke-width="3" stroke-linejoin="round"/><path d="M12 4H48V12H12Z" fill="#c69434" stroke="#fffdf7" stroke-width="2.4"/></svg>`;
  const LANTERN = `<svg viewBox="0 0 60 80" aria-hidden="true"><path d="M30 2V12" stroke="#4a3620" stroke-width="3" stroke-linecap="round"/><path d="M18 12H42L46 22H14Z" fill="#c69434" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M16 22H44V60H16Z" fill="#ffe49a" stroke="#4a3620" stroke-width="3"/><path d="M30 30Q38 40 30 52Q22 40 30 30Z" fill="#e8743c"/><path d="M14 60H46L42 70H18Z" fill="#c69434" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/></svg>`;

  class LanternHunt extends Base {
    constructor(ctx) {
      super(ctx, "sh-lantern", "Lantern hunt");
      this.known = knownChars(ctx);
      const planned = ns.PracticeLearning?.orderChars?.(ctx, this.known, "letter-name", 2);
      const ordered = Array.isArray(planned) && planned.length ? planned : shuffle(this.known);
      this.asks = [...new Set(ordered.filter((c) => this.known.includes(c)))].slice(0, 2);
      this.round = 0;
      this.radius = 30; // percent of the scene's width; keep the beam generous throughout a visit
      if (this.known.length < 2) { this.later(() => this.cancel(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.asks.length) return this.finish();
      this.roundToken = (Number(this.roundToken) || 0) + 1;
      const token = this.roundToken;
      this.busy = false; this.pointerOwner = null; this.suppressClickTarget = null;
      const target = this.asks[this.round];
      this.target = target; this.missed = false; this.assisted = false; this.heard = false; this.found = 0; this.sweeps = 0;
      // Smart Choices (v50): look-alike decoys hide in the dark once a letter is known.
      const choiceCount = Math.max(2, Math.min(3, profile(this.ctx, target, "letter-name").choiceCount || 2));
      const nTarget = Math.min(3, choiceCount);
      const distractors = this.known.filter((c) => c !== target);
      const brainChoices = ns.gardenBrain?.others ? ns.gardenBrain.others(target, distractors, Math.max(0, choiceCount - 1), { skill: "name", beginner: choiceCount === 2 }) : shuffle(distractors).slice(0, choiceCount - 1);
      const others = [...new Set((brainChoices || []).filter((c) => distractors.includes(c)))].slice(0, choiceCount - 1);
      for (const c of shuffle(distractors)) if (others.length < choiceCount - 1 && !others.includes(c)) others.push(c);
      const choices = [target, ...others];
      // Beginners search two copies of the target and one decoy: exactly two
      // distinct answers appear in the garden.
      const labels = choiceCount === 2 ? [target, target, others[0] || target] : [...Array(nTarget).fill(target), ...others];
      // Hiding places on a jittered grid, so nothing overlaps.
      // Upright screens get a tall night garden (3 across, 4 down).
      const tall = (this.ctx.stage.clientHeight || 0) > (this.ctx.stage.clientWidth || 1) * 1.05;
      this.tall = tall;
      const cols = tall ? 3 : 4, rows = tall ? 4 : 3;
      const stageW = this.ctx.stage.clientWidth || 600, stageH = this.ctx.stage.clientHeight || 0;
      const sceneH = tall ? stageW * 4 / 3 : (stageH > 0 && stageH < 500 ? Math.max(1, stageH - 50) : stageW * 3 / 5);
      const sceneW = tall ? Math.min(stageW, sceneH * 3 / 4) : (stageH > 0 && stageH < 500 ? Math.min(stageW, sceneH * 5 / 3) : Math.min(stageW, 720));
      const cardSize = Math.min(Math.min(sceneW, sceneH) * .9, Math.max(62, sceneW * (tall ? .22 : .15)));
      const insetX = Math.min(49, cardSize / 2 / sceneW * 100), insetY = Math.min(49, cardSize / 2 / sceneH * 100);
      const slots = shuffle(Array.from({ length: 12 }, (_, i) => ({
        x: insetX + (100 - 2 * insetX) * (((i % cols) + 0.5) / cols),
        y: insetY + (100 - 2 * insetY) * ((Math.floor(i / cols) + 0.5) / rows),
      })));
      this.hidden = shuffle(labels).map((c, i) => ({ c, ...slots[i] }));
      this.choices = choices;
      const gardenArt = ns.WorkshopShadowArt?.nightGarden?.() || "";
      const treeArt = ns.WorkshopShadowArt?.nightTree?.() || "";
      const lanternArt = ns.WorkshopShadowArt?.lantern?.() || LANTERN;
      const jarArt = ns.WorkshopShadowArt?.jar?.() || JAR;
      this.root.innerHTML = `
        <div class="sh-night${this.tall ? " is-tall" : ""}">
          ${gardenArt ? `<span class="sh-garden-art" aria-hidden="true">${gardenArt}</span>` : ""}
          ${treeArt ? `<span class="sh-garden-tree" aria-hidden="true">${treeArt}</span>` : ""}
          ${this.hidden.map((h, i) => `<button type="button" class="sh-thing" data-i="${i}" style="left:${h.x}%;top:${h.y}%" aria-label="Something in the dark"><span class="sh-glow">${F().art(h.c, { size: 64, mode: "plain" })}</span></button>`).join("")}
          <div class="sh-dark" aria-hidden="true"></div>
          <span class="sh-lantern-icon" aria-hidden="true">${lanternArt}</span>
          ${Array.from({ length: 6 }, (_, i) => `<i class="sh-firefly" style="--i:${i}" aria-hidden="true"></i>`).join("")}
        </div>
        <div class="sh-footer"><span class="sh-jar" aria-label="Letters found">${jarArt}<span class="sh-jar-in"></span></span>
        ${this.dots(this.asks.length, this.round)}</div>`;
      this.scene = this.root.querySelector(".sh-night");
      this.moveTo(50, 50);
      this.scene.addEventListener("pointerdown", (e) => this.pointerDown(e));
      this.scene.addEventListener("pointermove", (e) => this.pointerMove(e));
      this.scene.addEventListener("pointerup", (e) => this.pointerUp(e));
      this.scene.addEventListener("pointercancel", (e) => this.pointerCancel(e));
      this.scene.addEventListener("lostpointercapture", (e) => this.pointerCancel(e));
      this.root.querySelectorAll(".sh-thing").forEach((b) => b.addEventListener("click", (e) => {
        if (!this.isCurrent(token) || this.pointerOwner !== null) return;
        e.stopPropagation();
        if (this.suppressClickTarget === b) { this.suppressClickTarget = null; return; }
        if (!this.isLit(b)) { this.reveal(b); return; }
        this.pick(Number(b.dataset.i), b);
      }));
      const listen = profile(this.ctx, target, "letter-name").promptMode === "listen";
      this.listening = listen && this.ctx.canListen?.() !== false;
      this.ctx.beginRound?.(item(target), "letter-name");
      if (!this.listening) { this.assisted = true; this.ctx.prompt?.(item(target)); }
      this.later(() => {
        if (!this.isCurrent(token)) return;
        let result = this.say(item(target));
        if (!this.listening) return;
        if (result === true) { this.heard = true; return; }
        if (!result || typeof result.then !== "function") { this.playbackFailed(token); return; }
        let settled = false;
        const timeout = setTimeout(() => { if (settled) return; settled = true; this.playbackFailed(token); }, 5000);
        this.timers.push(timeout);
        Promise.resolve(result).then((heard) => {
          if (settled) return; settled = true; clearTimeout(timeout);
          if (!this.isCurrent(token)) return;
          if (heard === true) this.heard = true; else this.playbackFailed(token);
        }, () => { if (settled) return; settled = true; clearTimeout(timeout); this.playbackFailed(token); });
      }, 300);
    }
    isCurrent(token) { return this.alive && token === this.roundToken; }
    playbackFailed(token) {
      if (!this.isCurrent(token)) return;
      this.heard = false; this.assisted = true; this.ctx.prompt?.(item(this.target));
    }
    reveal(b) {
      const h = this.hidden[Number(b.dataset.i)];
      if (h) { this.moveTo(h.x, h.y); this.ctx.sfx?.("glow"); }
    }
    pointerDown(e) {
      if (!this.alive || this.busy || e.isPrimary === false || (e.pointerType === "mouse" && e.button !== 0) || this.pointerOwner !== null) return;
      const thing = e.target?.closest?.(".sh-thing");
      if (thing && this.isLit(thing)) return; // a second tap selects through its click
      this.pointerOwner = e.pointerId;
      this.pointerStartTarget = thing;
      this.scene.setPointerCapture?.(e.pointerId);
      this.point(e);
    }
    pointerMove(e) {
      if (!this.alive || this.busy || e.pointerId !== this.pointerOwner || e.isPrimary === false) return;
      this.point(e);
    }
    pointerUp(e) {
      if (e.pointerId !== this.pointerOwner) return;
      this.pointerOwner = null;
      this.suppressClickTarget = this.pointerStartTarget;
      this.pointerStartTarget = null;
      const target = this.suppressClickTarget, token = this.roundToken;
      this.later(() => { if (token === this.roundToken && this.suppressClickTarget === target) this.suppressClickTarget = null; }, 500);
      if (this.scene.hasPointerCapture?.(e.pointerId)) this.scene.releasePointerCapture?.(e.pointerId);
    }
    pointerCancel(e) {
      if (this.pointerOwner === null || (e.pointerId !== undefined && e.pointerId !== this.pointerOwner)) return;
      const id = this.pointerOwner; this.pointerOwner = null;
      this.pointerStartTarget = null;
      if (this.scene.hasPointerCapture?.(id)) this.scene.releasePointerCapture?.(id);
    }
    point(e) {
      if (!this.alive || this.busy) return;
      const r = this.scene.getBoundingClientRect();
      if (!r.width) return;
      this.moveTo(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
      // Searching the dark for a long time is not failing, but it can feel like
      // it: after six empty sweeps the lantern drifts to a letter being looked
      // for (that find counts as helped).
      if (e.type !== "pointerdown") return;
      const found = this.root.querySelectorAll(".sh-thing.is-lit:not(.is-found)").length;
      this.sweeps = found ? 0 : (this.sweeps || 0) + 1;
      if (this.sweeps >= 6) {
        this.sweeps = 0;
        const k = this.hidden.findIndex((h, j) => h.c === this.target && !this.root.querySelector(`.sh-thing[data-i="${j}"]`)?.classList.contains("is-found"));
        if (k >= 0) { this.missed = true; this.assisted = true; const token = this.roundToken; this.later(() => { if (!this.isCurrent(token)) return; this.moveTo(this.hidden[k].x, this.hidden[k].y); this.ctx.sfx?.("glow"); }, 350); }
      }
    }
    moveTo(x, y) {
      if (!this.alive || !this.scene) return;
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
      if (!this.alive || this.busy) return false;
      if (b.classList.contains("is-found")) return false;
      if (!this.isLit(b)) { this.reveal(b); return false; }
      const c = this.hidden[i].c;
      const right = this.report(this.target, c, this.choices || [...new Set(this.hidden.map((h) => h.c))], { listening: this.listening });
      this.say(item(c));
      if (!right) {
        this.missed = true; this.assisted = true;
        this.ctx.sfx?.("softwrong"); this.wobble(b);
        // Encouragement pass (v57): a second miss lights one of the letters
        // being looked for — nobody wanders the dark for long.
        this.misses = (this.misses || 0) + 1;
        if (this.misses >= 2) {
          const k = this.hidden.findIndex((h, j) => h.c === this.target && !this.root.querySelector(`.sh-thing[data-i="${j}"]`)?.classList.contains("is-found"));
          const t = this.root.querySelector(`.sh-thing[data-i="${k}"]`);
          if (t) { this.moveTo(this.hidden[k].x, this.hidden[k].y); this.root.querySelectorAll(".sh-thing").forEach((o) => o.classList.toggle("is-hint", o === t)); }
        }
        return true;
      }
      this.misses = 0; this.sweeps = 0;
      this.root.querySelectorAll(".sh-thing.is-hint").forEach((o) => o.classList.remove("is-hint"));
      b.classList.add("is-found");
      this.ctx.sfx?.("glow");
      this.ctx.confettiAt?.(b);
      this.root.querySelector(".sh-jar-in").insertAdjacentHTML("beforeend", `<i>${F().art(c, { size: 26, mode: "plain" })}</i>`);
      this.found += 1;
      const total = this.hidden.filter((h) => h.c === this.target).length;
      if (this.found < total) { this.ctx.beginRound?.(item(this.target), "letter-name"); return true; }
      // All found: the whole garden lights up for a moment.
      this.scene.classList.add("is-dawn");
      this.ctx.correct?.(); this.ctx.pet?.cheer?.();
      this.busy = true;
      const token = this.roundToken;
      this.round += 1;
      this.later(() => { if (token === this.roundToken) this.next(); }, 2600);
      return true;
    }
    replayPrompt() {
      if (!this.target || !this.alive) return;
      this.missed = true; this.assisted = true; this.heard = false; this.ctx.prompt?.(item(this.target));
      this.say(item(this.target));
    }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800); }
  }

  // ---------- Letter Shadows ----------
  class LetterShadows extends Base {
    constructor(ctx) {
      super(ctx, "sh-shadows", "Letter shadows");
      this.noReplay = true; // A visual matching toy; the previous replay hook did nothing.
      this.known = knownChars(ctx);
      const planned = ns.PracticeLearning?.orderChars?.(ctx, this.known, "letter-form", this.known.length);
      const ordered = Array.isArray(planned) && planned.length ? planned : shuffle(this.known);
      this.order = [...new Set(ordered.filter((c) => this.known.includes(c)))];
      this.rounds = Math.min(4, this.order.length); this.round = 0;
      // Freeze this visit's challenge. Add choices first, then a second shadow,
      // then plain forms after a later, stronger evidence milestone.
      this.level = level(ctx, this.known, "letter-form");
      const evidence = this.known.map((c) => state(ctx, practiceItem(ctx, c), "letter-form").matching || {});
      if (evidence.length >= 2 && evidence.every((e) => e.r >= 9 && e.streak >= 4 && new Set((e.sessions || []).filter(Boolean)).size >= 4)) this.level = 3;
      this.cursor = 0;
      if (this.known.length < 2) { this.later(() => this.cancel(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      this.roundToken = (Number(this.roundToken) || 0) + 1;
      const token = this.roundToken;
      this.missed = false; this.assisted = false; this.busy = false; this.phase = "matching";
      this.dragResets.forEach((reset) => reset()); this.dragResets = [];
      const count = this.level >= 2 && this.known.length >= 3 ? 2 : 1;
      this.targets = Array.from({ length: count }, () => this.order[this.cursor++ % this.order.length]).filter((c, i, a) => a.indexOf(c) === i);
      this.left = this.targets.slice();
      const n = Math.min(this.level >= 1 ? 3 : 2, this.known.length);
      this.offered = shuffle([...this.targets, ...shuffle(this.known.filter((c) => !this.targets.includes(c))).slice(0, Math.max(0, n - this.targets.length))]);
      const plain = this.level >= 3;
      const moving = false;
      const theatreArt = ns.WorkshopShadowArt?.theatreFrame?.() || "";
      const offered = this.offered;
      this.root.innerHTML = `
        <div class="sh-screen${moving ? " is-moving" : ""}">
          ${theatreArt ? `<span class="sh-theatre-art" aria-hidden="true">${theatreArt}</span>` : ""}
          ${this.targets.map((c, i) => `<span class="sh-shadow" data-c="${c}" style="--i:${i};--n:${this.targets.length}">${F().art(c, { size: 150, mode: plain ? "plain" : "full" })}</span>`).join("")}
        </div>
        <div class="pz-board">${this.offered.map((c, i) => `<button type="button" class="pz-tile" data-i="${i}" aria-label="${c}">${F().art(c, { size: 84, mode: "plain" })}</button>`).join("")}</div>
        <div class="sh-play-controls" hidden>
          <button type="button" class="sh-light-switch" aria-label="Show puppet shadows" aria-pressed="false">${LANTERN}<span class="sh-switch-track" aria-hidden="true"><i></i></span></button>
          <button type="button" class="sh-next" aria-label="${this.round + 1 < this.rounds ? "Next shadow scene" : "Finish shadow theatre"}">${ns.LettersArt?.icon?.("next", 40) || '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 20h24M22 10l10 10-10 10" fill="none" stroke="#4a3620" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'}</button>
        </div>
        ${this.dots(this.rounds, this.round)}`;
      this.root.querySelector(".sh-light-switch")?.addEventListener("click", () => this.toggleLights(token));
      this.root.querySelector(".sh-next")?.addEventListener("click", () => this.nextScene(token));
      this.root.querySelectorAll(".pz-tile").forEach((b) => {
        b.addEventListener("click", () => { this.pick(Number(b.dataset.i), b, null, token, offered); });
        if (ns.GardenPractice?.draggable) this.dragResets.push(ns.GardenPractice.draggable(b, {
          enabled: () => this.isActiveAnswer(token, b, offered),
          onDragStart: () => b.classList.add("is-picked"),
          onDragEnd: () => b.classList.remove("is-picked"),
          drop: (x, y) => {
            if (!this.isActiveAnswer(token, b, offered)) return false;
            const target = Array.from(this.root.querySelectorAll(".sh-shadow")).find((sh) => {
              const r = sh.getBoundingClientRect();
              return r.width > 0 && r.height > 0 && x >= r.left - 24 && x <= r.right + 24 && y >= r.top - 24 && y <= r.bottom + 24;
            });
            if (!target) return false;
            return this.pick(Number(b.dataset.i), b, target.dataset.c, token, offered) === true;
          },
        }));
      });
      this.ctx.beginRound?.(item(this.left[0]), "letter-form");
      this.ctx.sfx?.("creak");
    }
    isActiveAnswer(token, b, offered) {
      return this.alive && !this.busy && token === this.roundToken && offered === this.offered && !b.disabled
        && b.isConnected !== false && Array.from(this.root.querySelectorAll(".pz-tile")).includes(b);
    }
    pick(i, b, expected = null, token = this.roundToken, offered = this.offered) {
      if (!this.isActiveAnswer(token, b, offered) || !Number.isInteger(i) || i < 0 || i >= offered.length) return false;
      const keyboard = b.matches?.(":focus-visible");
      const c = offered[i];
      // Any shadow still on the screen is a right answer (DS-style: any order).
      const right = expected ? c === expected && this.left.includes(expected) : this.left.includes(c);
      const reportTarget = expected || (right ? c : this.left[0]);
      this.report(reportTarget, c, offered, { skill: "letter-form" });
      if (!right) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(b);
        this.root.querySelectorAll(".pz-tile").forEach((t, k) => t.classList.toggle("is-hint", expected ? offered[k] === expected : this.left.includes(offered[k])));
        return true;
      }
      this.left = this.left.filter((x) => x !== c);
      b.disabled = true; b.classList.add("is-used");
      this.root.querySelectorAll(".pz-tile").forEach((t) => t.classList.remove("is-hint"));
      // The shadow steps into the light as itself.
      const sh = this.root.querySelector(`.sh-shadow[data-c="${c}"]`);
      if (sh) {
        sh.classList.add("is-lit", "is-arriving");
        sh.querySelector("svg.lf")?.classList.remove("is-plain");
        if (!this.ctx.reducedMotion?.()) sh.animate?.([{ opacity: .65, transform: "translate(-50%, -58%) scale(.9)" }, { opacity: 1, transform: "translate(-50%, -50%) scale(1)" }], { duration: 540, easing: "cubic-bezier(.2,.7,.2,1)" });
        this.later(() => sh.classList.remove("is-arriving"), 620);
      }
      this.ctx.sfx?.(F().get(c).call);
      this.say(F().item(c));
      this.ctx.confettiAt?.(sh || b);
      if (this.left.length) { this.ctx.beginRound?.(item(this.left[0]), "letter-form"); return true; }
      this.busy = true;
      this.ctx.correct?.(); this.ctx.pet?.cheer?.();
      this.openTheatre(keyboard);
      return true;
    }
    openTheatre(keyboard = false) {
      const token = this.roundToken;
      this.phase = "playing"; this.lights = true;
      this.dragResets.forEach((reset) => reset()); this.dragResets = [];
      this.poses = this.targets.map((_, i) => ({ x: 50 + (i - (this.targets.length - 1) / 2) * 34, y: 50 }));
      const screen = this.root.querySelector(".sh-screen");
      if (screen) screen.innerHTML = `<span class="sh-theatre-art" aria-hidden="true">${ns.WorkshopShadowArt?.theatreFrame?.() || ""}</span><span class="sh-puppet-field">${this.targets.map((c, i) => `<button type="button" class="sh-puppet" data-puppet="${i}" aria-label="Play with ${c}" style="left:${this.poses[i].x}%;top:50%"><span class="sh-puppet-art">${F().art(c, { size: 150, mode: "full" })}</span></button>`).join("")}</span>`;
      const board = this.root.querySelector(".pz-board"), controls = this.root.querySelector(".sh-play-controls");
      if (board) board.hidden = true;
      if (controls) controls.hidden = false;
      this.root.querySelectorAll(".sh-puppet").forEach((puppet, i) => {
        puppet.addEventListener("click", () => this.playPuppet(i, puppet, token));
        puppet.addEventListener("keydown", (event) => {
          const moves = { ArrowLeft: [-6, 0], ArrowRight: [6, 0], ArrowUp: [0, -5], ArrowDown: [0, 5] };
          const move = moves[event.key];
          if (!move || !this.activePuppet(i, puppet, token)) return;
          event.preventDefault();
          this.posePuppet(i, this.poses[i].x + move[0], this.poses[i].y + move[1], puppet, token);
        });
        if (ns.GardenPractice?.draggable) this.dragResets.push(ns.GardenPractice.draggable(puppet, {
          enabled: () => this.activePuppet(i, puppet, token),
          onDragStart: () => puppet.classList.add("is-held"),
          onDragEnd: () => puppet.classList.remove("is-held"),
          drop: (x, y, released) => {
            if (!this.activePuppet(i, puppet, token)) return false;
            const r = screen.getBoundingClientRect();
            if (!(r.width > 0 && r.height > 0) || x < r.left - 24 || x > r.right + 24 || y < r.top - 24 || y > r.bottom + 24) return false;
            // Retain where the small hand grabbed the puppet instead of snapping its centre to the finger.
            const px = released ? released.left + released.width / 2 : x;
            const py = released ? released.top + released.height / 2 : y;
            return this.posePuppet(i, (px - r.left) / r.width * 100, (py - r.top) / r.height * 100, puppet, token);
          },
        }));
      });
      if (keyboard) this.root.querySelector(".sh-puppet")?.focus?.({ preventScroll: true });
    }
    activePuppet(i, puppet, token) {
      return this.alive && this.phase === "playing" && token === this.roundToken
        && Number.isInteger(i) && this.root.querySelectorAll(".sh-puppet")[i] === puppet;
    }
    posePuppet(i, x, y, puppet, token = this.roundToken) {
      if (!this.activePuppet(i, puppet, token) || !Number.isFinite(x) || !Number.isFinite(y)) return false;
      const stage = this.root.querySelector(".sh-screen")?.getBoundingClientRect(), r = puppet.getBoundingClientRect();
      if (!stage?.width || !stage?.height) return false;
      const hx = r.width / stage.width * 50, hy = r.height / stage.height * 50;
      const clamp = (v, lo, hi) => lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v));
      this.poses[i] = { x: clamp(x, 14 + hx, 86 - hx), y: clamp(y, 20 + hy, 77 - hy) };
      puppet.style.left = `${this.poses[i].x}%`; puppet.style.top = `${this.poses[i].y}%`;
      return true;
    }
    playPuppet(i, puppet, token = this.roundToken) {
      if (!this.activePuppet(i, puppet, token)) return false;
      const art = puppet.querySelector(".sh-puppet-art");
      puppet.classList.add("is-waving");
      if (!this.ctx.reducedMotion?.()) {
        puppet.wave?.cancel();
        puppet.wave = art?.animate?.([{ translate: "0 0" }, { translate: "0 -8px" }, { translate: "0 0" }], { duration: 430, easing: "ease-out" });
      }
      this.say(F().item(this.targets[i]));
      this.later(() => { if (token === this.roundToken) puppet.classList.remove("is-waving"); }, 500);
      return true;
    }
    toggleLights(token = this.roundToken) {
      if (!this.alive || this.phase !== "playing" || token !== this.roundToken) return false;
      this.lights = !this.lights;
      this.root.querySelector(".sh-screen")?.classList.toggle("is-shadow-play", !this.lights);
      const toggle = this.root.querySelector(".sh-light-switch");
      toggle?.setAttribute("aria-pressed", String(!this.lights));
      toggle?.setAttribute("aria-label", this.lights ? "Show puppet shadows" : "Light up the puppets");
      this.ctx.sfx?.("pop");
      return true;
    }
    nextScene(token = this.roundToken) {
      if (!this.alive || this.phase !== "playing" || token !== this.roundToken) return false;
      const keyboard = this.root.querySelector(".sh-next")?.matches?.(":focus-visible");
      this.phase = "leaving";
      this.root.querySelectorAll(".sh-puppet").forEach((p) => p.wave?.cancel());
      this.round += 1; this.next();
      if (keyboard && this.phase === "matching") this.root.querySelector(".pz-tile")?.focus?.({ preventScroll: true });
      return true;
    }
    finish() {
      if (!this.alive || this.phase === "finished") return;
      this.phase = "finished"; this.busy = true; this.roundToken += 1;
      this.dragResets.forEach((reset) => reset()); this.dragResets = [];
      this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800);
    }
    destroy() { this.root.querySelectorAll(".sh-puppet").forEach((p) => p.wave?.cancel()); super.destroy(); }

  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { LanternHunt, LetterShadows });
  ns.ShadowGames = { KINDS: ["LanternHunt", "LetterShadows"] };
})(window.MiftahGame || (window.MiftahGame = {}));
