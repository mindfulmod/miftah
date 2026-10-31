// The Letter Workshop (v34, 2026-10-03): the last two Big Brain Academy ideas
// worth keeping (multiplayer set aside on purpose).
//
//   BuildLetter ← DS "Get in Shape": match the pieces used to build a letter.
//               A sprout sees the body in place and chooses its dots; later,
//               the body and dots are built in order. The outline stays visible
//               as useful shape guidance, and the completed letter grows into
//               its friend.
//   FillGap     ← Switch "Frame Filler": a picture, the complete Arabic word,
//               and its highlighted first letter guide a missing-letter match.
//               The word comes together and is said. Pictures never wear their letter;
//               where a letter has no picture, its friend appears WITHOUT its
//               body (features only), so the answer must come from the sound.
//
// Same rules: nothing timed or scored; a miss only wobbles and the right piece
// glows; evidence only when honest.
(function (ns) {
  const INK = "#4a3620";
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // Smart Choices (v50): the Garden Brain picks the wrong answers.
  const smart = (target, pool, n, skill, beginner) => (ns.gardenBrain?.others ? ns.gardenBrain.others(target, pool, n, { skill, beginner }) : shuffle(pool.filter((c) => c !== target)).slice(0, n));
  const F = () => ns.LetterFriends;
  const S = () => ns.LettersStrokes;
  const nameOf = (c) => (ns.LETTERS_DATA?.packs || []).flatMap((p) => p.letters).find((l) => l.char === c)?.arName || c;
  const item = (c) => ({ id: c, display: c, speak: nameOf(c) });
  const practiceItem = (ctx, c) => [...(ctx.items || []), ...(ctx.known || [])].find((entry) => entry?.display === c && entry.id) || item(c);
  const workshopEligible = (entry, ctx) => entry && entry.taught !== false && entry.isTaught !== false
    && entry.locked !== true && entry.unlocked !== false
    && (!ctx.completedWorldIds || !(entry.prerequisiteWorldIds || []).some((id) => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
  const knownChars = (ctx) => {
    const declarations = [...(ctx.items || []), ...(ctx.known || [])].filter((entry) => typeof entry?.display === "string");
    const grouped = new Map();
    declarations.forEach((entry) => { const list = grouped.get(entry.display) || []; list.push(entry); grouped.set(entry.display, list); });
    return [...grouped].filter(([c, entries]) => {
      const fields = ["taught", "isTaught", "locked", "unlocked", "prerequisiteWorldIds"];
      const conflict = fields.some((field) => {
        const values = entries.filter((entry) => entry[field] !== undefined).map((entry) => field === "prerequisiteWorldIds" ? JSON.stringify([...(entry[field] || [])].slice().sort()) : entry[field]);
        return new Set(values).size > 1;
      });
      return !conflict && entries.every((entry) => workshopEligible(entry, ctx)) && !!F()?.FRIENDS?.[c];
    }).map(([c]) => c);
  };
  const practiceProfile = (ctx, c, skill) => {
    const p = ns.PracticeLearning?.profile?.(ctx, practiceItem(ctx, c), skill);
    return p && typeof p === "object" ? p : { choices: 2, choiceCount: 2, promptMode: "match", level: 0 };
  };
  const practiceOrder = (ctx, pool, skill, count) => {
    const eligible = knownChars(ctx), safePool = [...new Set(pool)].filter((c) => eligible.includes(c));
    const planned = ns.PracticeLearning?.orderChars?.(ctx, safePool.slice(), skill, count);
    const chars = Array.isArray(planned) ? planned.map((v) => typeof v === "string" ? v : v?.display).filter((c) => safePool.includes(c)) : [];
    return [...new Set([...chars, ...safePool])].slice(0, count);
  };
  const practiceLevel = (ctx, chars, skill) => {
    const level = ns.PracticeLearning?.level?.(ctx, chars.map((c) => practiceItem(ctx, c)), skill);
    return Number.isFinite(level) ? Math.max(0, Math.min(2, level)) : 0;
  };
  const profileChoices = (profile, max = 3) => Math.max(2, Math.min(max, Number(profile?.choiceCount || profile?.choices) || 2));
  const inTarget = (el, x, y, slack = 28) => {
    const r = el?.getBoundingClientRect?.();
    return !!(r?.width && r?.height && x >= r.left - slack && x <= r.right + slack && y >= r.top - slack && y <= r.bottom + slack);
  };
  const bodyOf = (c) => (S()?.LETTERS?.[c] || []).filter((s) => typeof s === "string");
  const dotsOf = (c) => (S()?.LETTERS?.[c] || []).filter((s) => s && s.dot).map((s) => s.dot);
  const bodyKey = (c) => bodyOf(c).join("|");
  const dotKey = (c) => dotsOf(c).map((d) => d.join(",")).join(";");

  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.timers = [];
      this.dragResets = [];
      ctx.stage.innerHTML = `<div class="ws ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
    }
    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); }
    dots(n, at) { return `<div class="pz-progress" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < at ? "is-done" : i === at ? "is-on" : ""}"></i>`).join("")}</div>`; }
    wobble(el) { if (!this.ctx.reducedMotion?.()) el?.animate?.([{ opacity: 1 }, { opacity: .84 }, { opacity: 1 }], { duration: 360 }); }
    say(it) {
      const turn = this.turnId;
      let r; try { r = this.ctx.say?.(it); } catch { r = false; }
      if (r?.then) r.then((h) => { if (this.alive && turn === this.turnId && h === false) this.heard = false; }, () => {});
      return r;
    }
    replayPrompt() {}
    unavailable() { this.busy = true; this.later(() => this.ctx.cancel?.(), 300); }
    destroy() { this.alive = false; this.timers.forEach(clearTimeout); this.dragResets.forEach((reset) => reset()); this.dragResets = []; }
  }

  // ---------- Build the Letter ----------
  const bodySVG = (c, cls = "", size = 80) => `<svg class="ws-piece-art ${cls}" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${bodyOf(c).map((d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" data-ribbon/>`).join("")}</svg>`;
  // A dot choice shows the dots where they sit, over a faint ghost of the body.
  const dotsSVG = (dots, ghostOf, size = 80) => `<svg class="ws-piece-art" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${bodyOf(ghostOf).map((d) => `<path d="${d}" fill="none" stroke="#e5dcc8" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" data-ribbon/>`).join("")}${dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${INK}"/>`).join("")}</svg>`;

  class BuildLetter extends Base {
    constructor(ctx) {
      super(ctx, "ws-build", "Build the letter");
      this.known = knownChars(ctx).filter((c) => bodyOf(c).length);
      this.level = practiceLevel(ctx, this.known, "letter-form");
      this.order = practiceOrder(ctx, this.known, "letter-form", this.known.length);
      this.order = this.order.filter((c) => this.playable(c));
      this.rounds = Math.min(4, this.order.length); this.round = 0; this.turnId = 0; this.phaseId = 0;
      if (this.known.length < 2 || !this.rounds) { this.unavailable(); return; }
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      this.turnId += 1; this.phaseId += 1;
      const c = this.order[this.round];
      this.target = c; this.missed = false; this.heard = true; this.busy = false;
      // Listening strength never decides this visual task's difficulty.
      this.profile = practiceProfile(this.ctx, c, "letter-form");
      this.step = this.level === 0 && dotsOf(c).length ? "dots" : "body";
      this.root.innerHTML = `
        <div class="ws-frame">
          <span class="ws-board-art" aria-hidden="true">${ns.WorkshopShadowArt?.assemblyBoard?.() || ""}</span>
          <svg class="ws-target" viewBox="0 0 100 100" aria-hidden="true">
            ${bodyOf(c).map((d) => `<path class="ws-ghost" d="${d}" fill="none" stroke="#c9bda4" stroke-width="12" stroke-dasharray="2 6" stroke-linecap="round" stroke-linejoin="round" data-ribbon/>`).join("")}${dotsOf(c).map(([x, y]) => `<circle class="ws-ghost" cx="${x}" cy="${y}" r="7" fill="none" stroke="#c9bda4" stroke-width="2.4" stroke-dasharray="2 3"/>`).join("")}
            <g class="ws-built-body"></g><g class="ws-built-dots"></g>
          </svg>
          <span class="ws-friend" aria-hidden="true"></span>
        </div>
        <div class="ws-tray"></div>
        ${this.dots(this.rounds, this.round)}`;
      if (this.step === "dots") this.place("body");
      this.updateGuidance();
      this.root.querySelector(".ws-frame")?.classList.add("is-next");
      this.offer();
      this.ctx.beginRound?.(practiceItem(this.ctx, c), "letter-form");
    }
    playable(c) {
      const otherBodies = this.known.map(bodyKey).filter((key) => key !== bodyKey(c));
      const otherDots = this.known.map(dotKey).filter((key) => key !== dotKey(c));
      const hasBodyChoices = new Set(otherBodies).size > 0;
      const hasDotChoices = new Set(otherDots).size > 0;
      if (!dotsOf(c).length) return hasBodyChoices;
      if (this.level === 0) return hasDotChoices;
      return hasBodyChoices && hasDotChoices;
    }
    updateGuidance() {
      const steps = this.level === 0 && dotsOf(this.target).length ? ["body", "dots"] : ["body", ...(dotsOf(this.target).length ? ["dots"] : [])];
      const frame = this.root.querySelector(".ws-frame");
      if (!frame) return;
      frame.querySelector(".ws-step-guide")?.remove();
      frame.insertAdjacentHTML("beforeend", `<span class="ws-step-guide" aria-hidden="true">${steps.map((step, i) => `<i class="ws-step ws-step-${step}${step === this.step ? " is-active" : steps.indexOf(this.step) > i ? " is-done" : ""}">${step === "body" ? bodySVG(this.target, "", 36) : dotsSVG(dotsOf(this.target), this.target, 36)}</i>`).join("")}</span>`);
      frame.classList.toggle("is-next", true);
    }
    // The tray offers the pieces for the current step.
    offer() {
      const c = this.target, n = this.level === 2 ? 3 : 2;
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
      const phase = ++this.phaseId;
      tray.innerHTML = arts.map((a, i) => `<button type="button" class="ws-piece" data-i="${i}" aria-label="Piece ${i + 1}">${a}</button>`).join("");
      this.dragResets.forEach((reset) => reset()); this.dragResets = [];
      const frame = this.root.querySelector(".ws-frame");
      tray.querySelectorAll(".ws-piece").forEach((b) => {
        b.addEventListener("click", () => this.pick(Number(b.dataset.i), b, phase));
        const reset = ns.GardenPractice?.draggable?.(b, {
          enabled: () => this.alive && phase === this.phaseId && !this.busy && !b.disabled && this.root?.contains?.(b),
          onDragMove: (x, y) => frame?.classList.toggle("is-near", inTarget(frame, x, y)),
          onDragEnd: () => frame?.classList.remove("is-near"),
          drop: (x, y) => inTarget(frame, x, y) ? this.pick(Number(b.dataset.i), b, phase) : false,
        });
        if (reset) this.dragResets.push(reset);
      });
    }
    place(step) {
      const c = this.target;
      if (step === "body") this.root.querySelector(".ws-built-body").innerHTML = bodyOf(c).map((d) => `<path class="ws-in" d="${d}" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" data-ribbon/>`).join("");
      else this.root.querySelector(".ws-built-dots").innerHTML = dotsOf(c).map(([x, y]) => `<circle class="ws-in" cx="${x}" cy="${y}" r="7" fill="${INK}"/>`).join("");
    }
    pick(i, btn, phase = this.phaseId) {
      if (!this.alive || phase !== this.phaseId || this.busy || !this.choices?.[i] || !btn || btn.disabled) return false;
      const want = this.step === "body" ? bodyKey(this.target) : dotKey(this.target);
      const right = this.choices[i].key === want;
      if (!right) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".ws-piece").forEach((b, k) => b.classList.toggle("is-hint", this.choices[k].key === want));
        return false;
      }
      this.ctx.sfx?.("click");
      this.busy = true;
      this.dragResets.forEach((reset) => reset()); this.dragResets = [];
      this.root.querySelector(".ws-frame")?.classList.remove("is-next", "is-near");
      this.place(this.step);
      if (this.step === "body" && dotsOf(this.target).length) { this.step = "dots"; this.updateGuidance(); this.busy = false; this.offer(); return true; }
      this.complete();
      return true;
    }
    complete() {
      this.busy = true;
      const c = this.target;
      // The visible outline makes this supported form matching evidence.
      const targetItem = practiceItem(this.ctx, c);
      this.ctx.reportOutcome?.({ item: targetItem, itemId: targetItem.id, activity: "BuildLetter", skill: "letter-form", correct: true,
        evidence: "supported_visible_matching", assisted: !!this.missed, affectsStrength: true });
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
    replayPrompt() {
      if (!this.alive || !this.target) return;
      this.missed = true;
      const target = this.target, turn = this.turnId;
      if (turn === this.turnId && target === this.target) this.say(item(target));
    }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800); }
  }

  // ---------- Fill the Gap ----------
  class FillGap extends Base {
    constructor(ctx) {
      super(ctx, "ws-gap", "Fill the gap");
      this.known = knownChars(ctx);
      const P = ns.PictureWords;
      // A picture for each letter where we have one; else the friend's name.
      const letters = practiceOrder(ctx, this.known, "friend", this.known.length);
      this.level = practiceLevel(ctx, this.known, "friend");
      this.cards = letters.slice(0, this.level === 0 ? 2 : 3).map((c) => {
        const pics = P?.byChar(c) || [];
        const p = pics.length ? pics[Math.floor(Math.random() * pics.length)] : null;
        return p ? { char: c, word: p.word, art: P.art(p, 130) } : { char: c, word: F().get(c).word, art: F().art(c, { size: 130 }) };
      });
      this.round = 0; this.turnId = 0; this.phaseId = 0;
      if (this.known.length < 2 || this.cards.length < 2) { this.unavailable(); return; }
      this.next();
    }
    next() {
      if (this.round >= this.cards.length) return this.finish();
      this.turnId += 1; this.phaseId += 1;
      const card = this.cards[this.round];
      this.card = card; this.missed = false; this.heard = true; this.busy = false;
      // The word without its first letter (and that letter's marks).
      const chars = [...card.word];
      let cut = 1;
      while (cut < chars.length && /[ًٌٍَُِّْٰ]/.test(chars[cut])) cut += 1;
      this.rest = chars.slice(cut).join("");
      const profile = practiceProfile(this.ctx, card.char, "friend");
      const n = profileChoices(profile, 3);
      const suggestions = smart(card.char, this.known, n - 1, "friend", this.level === 0)
        .filter((candidate) => this.known.includes(candidate) && candidate !== card.char);
      this.offered = shuffle([card.char, ...new Set(suggestions)].slice(0, n));
      if (this.offered.length < 2) { this.unavailable(); return; }
      this.root.innerHTML = `
        <div class="ws-card"><span class="ws-easel"><span class="ws-picture-frame" aria-hidden="true">${ns.WorkshopShadowArt?.pictureFrame?.() || ""}</span><span class="ws-pic">${card.art}</span></span>
          <div class="ws-reference" aria-label="Word reference"><span class="ws-reference-word" dir="rtl" lang="ar">${card.word}</span><span class="ws-reference-initial" dir="rtl" lang="ar"><i class="is-highlighted">${card.char}</i></span></div>
          <div class="ws-word" dir="rtl" lang="ar"><span class="ws-hole ws-receiving" aria-label="Drop the missing letter here"><span class="ws-hole-cue" aria-hidden="true">${F().art(card.char, { size: 44, mode: "plain" })}</span></span><span class="ws-rest">${this.rest}</span></div>
        </div>
        <div class="pz-board">${this.offered.map((c, i) => `<button type="button" class="pz-tile" data-i="${i}" aria-label="${c}">${F().art(c, { size: 84, mode: "plain" })}</button>`).join("")}</div>
        ${this.dots(this.cards.length, this.round)}`;
      const phase = ++this.phaseId, hole = this.root.querySelector(".ws-hole");
      this.root.querySelectorAll(".pz-tile").forEach((b) => {
        b.addEventListener("click", () => this.pick(Number(b.dataset.i), b, phase));
        const reset = ns.GardenPractice?.draggable?.(b, {
          enabled: () => this.alive && phase === this.phaseId && !this.busy && this.root?.contains?.(b),
          onDragMove: (x, y) => hole?.classList.toggle("is-near", inTarget(hole, x, y)),
          onDragEnd: () => hole?.classList.remove("is-near"),
          drop: (x, y) => inTarget(hole, x, y) ? this.pick(Number(b.dataset.i), b, phase) : false,
        });
        if (reset) this.dragResets.push(reset);
      });
      this.ctx.beginRound?.(practiceItem(this.ctx, card.char), "friend");
      const turn = this.turnId, speech = { id: card.word, display: card.word, speak: card.word };
      this.later(() => { if (turn === this.turnId && this.card === card) this.say(speech); }, 350);
    }
    replayPrompt() {
      if (!this.alive || !this.card) return;
      this.missed = true;
      const card = this.card, turn = this.turnId, speech = { id: card.word, display: card.word, speak: card.word };
      if (turn === this.turnId && this.card === card) this.say(speech);
    }
    pick(i, btn, phase = this.phaseId) {
      if (!this.alive || phase !== this.phaseId || this.busy || !this.offered?.[i]) return false;
      const c = this.offered[i], want = this.card.char;
      const targetItem = practiceItem(this.ctx, want), selectedItem = practiceItem(this.ctx, c);
      this.ctx.reportOutcome?.({ item: targetItem, itemId: targetItem.id, activity: "FillGap", skill: "friend", correct: c === want,
        evidence: "supported_visible_matching", assisted: !!this.missed,
        selectedId: selectedItem.id, choiceIds: this.offered.map((choice) => practiceItem(this.ctx, choice).id), affectsStrength: true });
      if (c !== want) {
        this.missed = true;
        this.say(item(c));
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".pz-tile").forEach((b, k) => b.classList.toggle("is-hint", this.offered[k] === want));
        return false;
      }
      this.busy = true;
      this.dragResets.forEach((reset) => reset()); this.dragResets = [];
      // The gap closes: the whole word, shaped as one, and said.
      const word = this.root.querySelector(".ws-word");
      word.innerHTML = `<span class="ws-whole">${this.card.word}</span>`;
      word.classList.add("is-whole");
      this.root.querySelector(".lf.is-bodiless")?.classList.replace("is-bodiless", "is-whole");
      this.ctx.correct?.(); this.ctx.confettiAt?.(word); this.ctx.pet?.cheer?.();
      const card = this.card, turn = this.turnId, speech = { id: card.word, display: card.word, speak: card.word };
      this.later(() => { if (turn === this.turnId && this.card === card) this.say(speech); }, 500);
      this.round += 1;
      this.later(() => { if (turn === this.turnId && this.card === card) this.next(); }, 2700);
      return true;
    }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800); }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { BuildLetter, FillGap });
  ns.WorkshopGames = { KINDS: ["BuildLetter", "FillGap"], bodyKey, dotKey, practiceProfile, practiceOrder, practiceLevel };
})(window.MiftahGame || (window.MiftahGame = {}));
