// The Puzzle Tree (v31, 2026-10-03): four thinking games, each a Big Brain
// Academy activity rebuilt around Arabic letters for ages 2–6.
//
//   EchoParade  ← "Sound Bites" (DS) / "Reverse Retention" (Wii, Switch):
//               hear friends sing 2–3 letters, tap them back in order.
//               Holding sounds in sequence is the working memory blending
//               will need (ب + َ + ت). The line stays visible until recall is
//               ready; each sequence is always forward.
//   DotsLast    ← "Fast Focus" (Wii, Switch) and "Get in Shape" (DS): a
//               a child prints the letter's dots one at a time onto a body. Which letter is it? The dots are the whole difference
//               between ب ت ث — the hardest thing a beginner must see.
//   LetterTrain ← "Balloon Burst" (Wii): pop the balloons in alphabet order
//               (ا ب ت ث …) and each one becomes a carriage on the train.
//   SameLetter  ← "Train Turn" (Wii) and "Odd One Out" (Wii): one letter has
//               tumbled over — find it among its dot-siblings (and, later,
//               a mirror-image trap). Orientation and dots, together.
//
// A miss makes a soft sound and never ends anything. Difficulty follows saved
// learning across visits, with Little Sprout kept at the gentlest level.
// Unlike the original, nothing here is timed or scored.
(function (ns) {
  const INK = "#4a3620";
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const F = () => ns.LetterFriends;
  const S = () => ns.LettersStrokes;
  const ORDER = () => (ns.LETTERS_DATA?.packs || []).flatMap((p) => p.letters.map((l) => l.char));
  const nameOf = (c) => (ns.LETTERS_DATA?.packs || []).flatMap((p) => p.letters).find((l) => l.char === c)?.arName || c;
  const item = (c) => ({ id: c, display: c, speak: nameOf(c) });
  const practiceItem = (ctx, c) => [...(ctx.items || []), ...(ctx.known || [])].find((i) => i?.display === c) || item(c);
  const taught = (entry, ctx) => entry && entry.taught !== false && entry.isTaught !== false
    && entry.locked !== true && entry.unlocked !== false
    && (!ctx.completedWorldIds || !(entry.prerequisiteWorldIds || []).some((id) => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
  const knownChars = (ctx) => {
    const declared = [...(ctx.items || []), ...(ctx.known || [])];
    const entries = new Map();
    declared.forEach((entry) => {
      const c = entry?.display;
      if (!c || !F()?.FRIENDS?.[c]) return;
      if (!entries.has(c)) entries.set(c, []);
      entries.get(c).push(entry);
    });
    // Conflicting records are unsafe: one explicit false flag or unmet
    // prerequisite excludes the character even if another duplicate is valid.
    const safe = [...entries].filter(([, records]) => records.every((entry) => taught(entry, ctx))).map(([c]) => c);
    return [...new Set((ns.PracticeLearning?.orderChars?.(ctx, safe, "letter-form", safe.length) || safe).filter((c) => safe.includes(c)))];
  };
  const profile = (ctx, c, skill = "letter-form") => ns.PracticeLearning?.profile?.(ctx, practiceItem(ctx, c), skill) || { choiceCount: 2, promptMode: "match" };
  const level = (ctx, chars, skill) => Math.max(0, Math.min(2, Number(ns.PracticeLearning?.level?.(ctx, chars.map((c) => practiceItem(ctx, c)), skill)) || 0));
  // Letters that share a body and differ only by dots: ب ت ث, ج ح خ, د ذ …
  const bodyKey = (c) => (S()?.LETTERS?.[c] || []).filter((s) => typeof s === "string").join("|");
  const dotsOf = (c) => (S()?.LETTERS?.[c] || []).filter((s) => s && s.dot).map((s) => s.dot);
  const siblings = (c, pool) => pool.filter((o) => o !== c && bodyKey(o) === bodyKey(c));

  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.timers = []; this.dragResets = [];
      ctx.stage.innerHTML = `<div class="pz ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
    }
    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); return t; }
    wait(ms) { return new Promise((ok) => {
      this.waits ||= new Set();
      const finish = () => { this.waits.delete(finish); ok(); };
      this.waits.add(finish); this.later(finish, ms);
    }); }
    sayWithin(entry, ms = 6000) {
      return new Promise((resolve) => {
        let settled = false;
        this.speechWaits ||= new Set();
        const end = (heard) => { if (settled) return; settled = true; clearTimeout(timer); this.speechWaits.delete(end); resolve(heard === true); };
        const timer = setTimeout(() => end(false), ms);
        this.speechWaits.add(end);
        try { Promise.resolve(this.ctx.say?.(entry)).then(end, () => end(false)); } catch { end(false); }
      });
    }
    dots(n, at) { return `<div class="pz-progress" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < at ? "is-done" : i === at ? "is-on" : ""}"></i>`).join("")}</div>`; }
    wobble(el) { if (!this.ctx.reducedMotion?.()) el?.animate?.([{ opacity: 1 }, { opacity: .84 }, { opacity: 1 }], { duration: 360 }); }
    cheer(el) { this.ctx.correct?.(); this.ctx.confettiAt?.(el); this.ctx.pet?.cheer?.(); }
    report(target, chosen, offered, { skill = "letter-name", listening = false, affectsStrength = true, itemId = target } = {}) {
      if (!this.alive) return false;
      const correct = chosen === target;
      const independent = listening && !this.missed && this.heard !== false;
      const targetItem = practiceItem(this.ctx, itemId);
      this.ctx.reportOutcome?.({ item: targetItem, itemId: targetItem.id, activity: this.constructor.name, skill, correct,
        evidence: independent ? "independent_listening" : "supported_visible_matching", assisted: !!this.missed,
        selectedId: chosen, choiceIds: offered, affectsStrength });
      return correct;
    }
    replayPrompt() {}
    cancel() { if (typeof this.ctx.cancel === "function") this.ctx.cancel(); else this.ctx.done?.(); }
    destroy() {
      this.alive = false; this.timers.forEach(clearTimeout); this.dragResets.forEach((reset) => reset());
      this.waits?.forEach((finish) => finish()); this.speechWaits?.forEach((finish) => finish(false));
    }
  }

  // ---------- Echo Parade ----------
  // A leafy hedge the singers hide behind (UI pass 2026-10-03).
  const HEDGE = `<svg viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">${[[20, 60], [60, 40], [100, 58], [140, 36], [180, 56], [220, 40], [262, 58], [40, 82], [120, 84], [200, 82], [280, 84]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${30 + (i % 3) * 6}" fill="${["#7fce54", "#4e9677", "#b7e779"][i % 3]}"/>`).join("")}${[[50, 50], [130, 46], [210, 52], [250, 70]].map(([x, y]) => `<path d="M${x} ${y}q6-8 12 0" fill="none" stroke="#2f5c46" stroke-width="3" stroke-linecap="round"/>`).join("")}</svg>`;
  class EchoParade extends Base {
    constructor(ctx) {
      super(ctx, "pz-echo", "Echo parade");
      // v35: in the vowel chapters the friends sing syllables (بَا بِي بُو),
      // wearing their vowel hats; elsewhere, letter names.
      const declared = [...(ctx.items || []), ...(ctx.known || [])];
      const sylGroups = new Map();
      declared.filter((i) => i?.display && [...i.display].length > 1 && /[ًٌٍَُِّْٰ]/.test(i.display) && F()?.FRIENDS?.[[...i.display][0]])
        .forEach((i) => { if (!sylGroups.has(i.display)) sylGroups.set(i.display, []); sylGroups.get(i.display).push(i); });
      const syl = [...sylGroups].filter(([, records]) => records.every((i) => taught(i, ctx))).map(([, records]) => records[0]);
      this.syllables = syl.length >= 2;
      this.byText = new Map(syl.map((i) => [i.display, i]));
      this.pool = this.syllables ? [...this.byText.keys()] : knownChars(ctx);
      const skill = this.syllables ? "syllable" : "letter-name";
      this.baseSkill = skill;
      this.len = this.pool.length ? Math.min(3, this.pool.length, ...this.pool.map((c) => profile(ctx, c, skill).choiceCount || 2)) : 2;
      this.rounds = 4; this.round = 0;
      if (this.pool.length < 2) { this.later(() => this.cancel(), 300); return; }
      this.next();
    }
    next() {
      this.roundToken = (this.roundToken || 0) + 1;
      const roundToken = this.roundToken;
      this.sequenceId = (this.sequenceId || 0) + 1;
      const sequenceId = this.sequenceId;
      if (this.round >= this.rounds) return this.finish();
      this.phase = "listening";
      this.missed = false; this.heard = true; this.busy = true; this.at = 0;
      const n = Math.min(this.len, this.pool.length);
      const ordered = ns.PracticeLearning?.orderChars?.(this.ctx, this.pool, this.syllables ? "syllable" : "letter-name", n) || this.pool;
      const previous = this.seq;
      this.seq = shuffle(ordered.slice(0, n));
      // Vary the order, never the selected learning targets or this visit's load.
      if (previous && this.seq.every((c, i) => c === previous[i])) this.seq.push(this.seq.shift());
      const profiles = this.seq.map((c) => profile(this.ctx, c, this.baseSkill));
      this.promptMode = profiles.length && profiles.every((p) => p.promptMode === "listen") ? "listen" : "match";
      this.promptSkill = this.promptMode === "listen" ? this.baseSkill : "matching-memory";
      // The board: the sequence's letters plus one extra, shuffled.
      const count = Math.max(2, Math.min(...profiles.map((p) => p.choiceCount || 2), this.pool.length));
      const extra = shuffle(this.pool.filter((c) => !this.seq.includes(c))).slice(0, Math.max(0, count - this.seq.length));
      this.board = shuffle([...this.seq, ...extra]);
      this.root.innerHTML = `
        <div class="pz-singers${this.promptMode === "listen" ? " is-hidden" : ""}" dir="rtl" aria-hidden="true"><span class="pz-echo-art" aria-hidden="true">${ns.PuzzlePlayArt?.echoStage?.() || ""}</span><span class="pz-hedge">${HEDGE}</span><span class="pz-singer-line">${this.seq.map((c, i) => `<span class="pz-singer" data-i="${i}">${this.singer(c)}</span>`).join("")}</span></div>
        <div class="pz-slots" dir="rtl" style="--sequence-count:${this.seq.length}">${this.seq.map((_, i) => `<span class="pz-slot${i === 0 ? " is-next" : ""}" data-i="${i}"></span>`).join("")}</div>
        <div class="pz-board">${this.board.map((c, i) => `<button type="button" class="pz-tile" data-i="${i}" aria-label="${c}">${this.tile(c)}</button>`).join("")}</div>
        <div class="pz-echo-actions" hidden>
          <button type="button" class="pz-echo-replay" aria-label="Hear the whole parade again"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M12 14a12 12 0 1 1-3 13M5 8v11h11" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button type="button" class="pz-echo-next" aria-label="${this.round + 1 < this.rounds ? "Next parade" : "Finish parade"}"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 20h24M22 10l10 10-10 10" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        </div>
        ${this.dots(this.rounds, this.round)}`;
      this.root.querySelectorAll(".pz-tile").forEach((b) => { b.disabled = true; b.addEventListener("click", () => { if (this.alive && roundToken === this.roundToken) this.tap(Number(b.dataset.i), b); }); });
      this.root.querySelector(".pz-echo-replay")?.addEventListener("click", () => { if (roundToken === this.roundToken) this.replayPrompt(); });
      this.root.querySelector(".pz-echo-next")?.addEventListener("click", () => this.continueParade(roundToken));
      this.later(() => { if (sequenceId === this.sequenceId) this.sing(sequenceId); }, 500);
    }
    singer(c) {
      if (!this.syllables) return F().art(c, { size: 74 });
      const base = [...c][0], mark = ns.VowelGames?.markOf?.(c);
      return ns.VowelGames?.wearing?.(base, mark, 74) || F().art(base, { size: 74 });
    }
    tile(c) { return this.syllables ? `<span class="pz-syl" dir="rtl" lang="ar">${c}</span>` : F().art(c, { size: 84, mode: "plain" }); }
    sayable(c) { return this.syllables ? (this.byText.get(c) || { id: c, display: c, speak: c }) : item(c); }
    // Recall-ready learners hear the line behind a curtain; matching learners
    // keep the singers in view while they build the same sequence.
    async sing(sequenceId = this.sequenceId) {
      this.busy = true;
      this.phase = "listening";
      this.promptReady = false;
      this.root.querySelectorAll(".pz-tile").forEach((b) => { b.disabled = true; });
      const singers = [...this.root.querySelectorAll(".pz-singer")];
      const display = this.root.querySelector(".pz-singers");
      if (this.promptMode === "listen") display?.classList.add("is-hidden");
      else display?.classList.remove("is-hidden");
      for (let i = 0; i < this.seq.length; i += 1) {
        if (!this.alive || sequenceId !== this.sequenceId) return;
        singers[i]?.classList.add("is-singing");
        const heard = this.ctx.canListen?.() === false ? false : await this.sayWithin(this.sayable(this.seq[i]));
        if (!this.alive || sequenceId !== this.sequenceId) return;
        if (!heard) {
          this.heard = false;
          this.missed = true;
          this.promptMode = "match";
          this.promptSkill = "matching-memory";
          display?.classList.remove("is-hidden");
        }
        singers[i]?.classList.remove("is-singing");
        if (!heard) break; // The visible line is ready; do not wait through more failed clips.
        await this.wait(260);
      }
      if (!this.alive || sequenceId !== this.sequenceId) return;
      this.promptReady = true;
      this.ctx.beginRound?.(this.sayable(this.seq[this.at]), this.promptSkill);
      this.busy = false;
      this.phase = "answering";
      this.showPlace();
      this.root.querySelectorAll(".pz-tile").forEach((b) => { b.disabled = false; });
      if (this.focusAnswer && (typeof document === "undefined" || !document.activeElement || document.activeElement === document.body)) this.root.querySelector(".pz-tile")?.focus?.({ preventScroll: true });
      this.focusAnswer = false;
    }
    showPlace() {
      this.root.querySelectorAll(".pz-singer").forEach((singer, i) => {
        singer.classList.toggle("is-accepted", i < this.at);
        singer.classList.toggle("is-current", this.promptMode === "match" && this.phase === "answering" && i === this.at);
      });
    }
    support() {
      this.missed = true; this.promptMode = "match"; this.promptSkill = "matching-memory";
      this.root.querySelector(".pz-singers")?.classList.remove("is-hidden");
      this.showPlace();
    }
    replayPrompt() {
      if (!this.alive) return;
      if (this.phase === "complete") { this.replayChorus(); return; }
      if (this.busy) return;
      this.support(); this.sequenceId += 1; this.sing(this.sequenceId);
    }
    async replayChorus() {
      if (!this.alive || this.phase !== "complete") return;
      this.phase = "encore";
      const id = ++this.sequenceId;
      const replay = this.root.querySelector(".pz-echo-replay");
      if (replay) replay.disabled = true;
      const singers = [...this.root.querySelectorAll(".pz-singer")];
      for (let i = 0; i < this.seq.length; i += 1) {
        if (!this.alive || id !== this.sequenceId) return;
        singers[i]?.classList.add("is-singing");
        const heard = this.ctx.canListen?.() !== false && await this.sayWithin(this.sayable(this.seq[i]));
        if (!this.alive || id !== this.sequenceId) return;
        singers[i]?.classList.remove("is-singing");
        if (!heard) break;
        await this.wait(260);
      }
      if (!this.alive || id !== this.sequenceId) return;
      this.phase = "complete";
      if (replay) replay.disabled = false;
    }
    continueParade(token = this.roundToken) {
      if (!this.alive || token !== this.roundToken || !["complete", "encore"].includes(this.phase)) return false;
      const button = this.root.querySelector(".pz-echo-next");
      const keyboard = button?.matches?.(":focus-visible");
      this.phase = "leaving"; this.sequenceId += 1; this.round += 1;
      this.focusAnswer = keyboard;
      this.next();
      return true;
    }
    tap(i, btn) {
      if (!this.alive || this.busy || !this.promptReady || this.at >= this.seq.length) return;
      if (this.root.querySelectorAll(".pz-tile")[i] !== btn || !this.board[i]) return;
      const keyboard = btn?.matches?.(":focus-visible");
      const want = this.seq[this.at], chosen = this.board[i];
      const right = this.report(want, chosen, this.board, { listening: this.promptMode === "listen", skill: this.promptSkill });
      this.sayWithin(this.sayable(chosen));
      if (!right) {
        this.support();
        this.ctx.beginRound?.(this.sayable(want), this.promptSkill);
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        // After a miss the next letter's tile glows (errorless help).
        this.root.querySelectorAll(".pz-tile").forEach((b, k) => b.classList.toggle("is-hint", this.board[k] === want));
        return;
      }
      this.root.querySelectorAll(".pz-tile").forEach((b) => b.classList.remove("is-hint"));
      const slot = this.root.querySelectorAll(".pz-slot")[this.at];
      slot.innerHTML = this.syllables ? this.singer(chosen).replace(/width="74" height="74"/, 'width="64" height="64"') : F().art(chosen, { size: 64 });
      slot.classList.add("is-full"); slot.classList.remove("is-next");
      this.ctx.sfx?.("pop");
      this.at += 1;
      this.showPlace();
      if (this.at < this.seq.length) { this.root.querySelectorAll(".pz-slot")[this.at]?.classList.add("is-next"); this.ctx.beginRound?.(this.sayable(this.seq[this.at]), this.promptSkill); return; }
      // Keep the finished chorus as a toy the child can replay or leave.
      this.busy = true; this.phase = "complete"; this.promptReady = false;
      this.root.querySelector(".pz-singers")?.classList.remove("is-hidden");
      this.root.querySelectorAll(".pz-tile").forEach((b) => { b.disabled = true; });
      const board = this.root.querySelector(".pz-board"), actions = this.root.querySelector(".pz-echo-actions");
      if (board) board.hidden = true;
      if (actions) actions.hidden = false;
      this.cheer(this.root.querySelector(".pz-slots"));
      if (keyboard) this.root.querySelector(".pz-echo-next")?.focus?.({ preventScroll: true });
    }
    finish() {
      if (!this.alive || this.phase === "finished") return;
      this.phase = "finished"; this.busy = true; this.ctx.sfx?.("cheer2");
      this.later(() => this.ctx.done?.(), 800);
    }
  }

  // ---------- Dots Last ----------
  class DotsLast extends Base {
    constructor(ctx) {
      super(ctx, "pz-dots", "Dots last");
      this.noReplay = true; // a seeing game: there is no spoken question to repeat
      const known = knownChars(ctx);
      // Only letters that have a dot-sibling the child knows can be asked.
      this.targets = known.filter((c) => dotsOf(c).length && siblings(c, known).length);
      this.targets = ns.PracticeLearning?.orderChars?.(ctx, this.targets, "letter-form", this.targets.length) || shuffle(this.targets);
      this.known = known;
      this.rounds = Math.min(4, Math.max(1, this.targets.length)); this.round = 0;
      if (!this.targets.length) { this.later(() => this.cancel(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      this.actionCue?.destroy(); this.actionCue = null;
      this.roundToken = (this.roundToken || 0) + 1;
      const roundToken = this.roundToken;
      const target = this.targets[this.round % this.targets.length];
      this.target = target; this.missed = false; this.busy = false; this.revealed = 0;
      this.phase = "printing"; this.questionStarted = false;
      const sib = siblings(target, this.known);
      const n = Math.min(profile(this.ctx, target).choiceCount || 2, sib.length + 1);
      this.offered = shuffle([target, ...shuffle(sib).slice(0, n - 1)]);
      const body = S().LETTERS[target].filter((s) => typeof s === "string");
      this.dotList = dotsOf(target);
      this.root.innerHTML = `
        <div class="pz-dot-workshop"><div class="pz-reveal is-drawn"><span class="pz-bench-art" aria-hidden="true">${ns.PuzzlePlayArt?.dotBench?.() || ""}</span><svg class="pz-letter-drawing" viewBox="0 0 100 100" aria-hidden="true">
          ${body.map((d) => `<path class="pz-body" d="${d}" pathLength="1" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" data-ribbon/>`).join("")}
          ${this.dotList.map(([x, y], i) => `<circle class="pz-dot" data-i="${i}" cx="${x}" cy="${y}" r="6" fill="${INK}"/>`).join("")}
        </svg></div><button type="button" class="pz-stamp" aria-label="Print the next dot"><span class="pz-stamp-art">${ns.PuzzlePlayArt?.dotStamp?.() || '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="20" fill="#4a3620"/></svg>'}</span></button></div>
        <div class="pz-board">${this.offered.map((c, i) => `<button type="button" class="pz-tile" data-i="${i}" aria-label="${c}">${F().art(c, { size: 92, mode: "plain" })}</button>`).join("")}</div>
        ${this.dots(this.rounds, this.round)}`;
      this.root.querySelectorAll(".pz-tile").forEach((b) => b.addEventListener("click", () => { if (roundToken === this.roundToken) this.tap(Number(b.dataset.i), b); }));
      this.root.querySelector(".pz-stamp")?.addEventListener("click", () => {
        if (!this.alive || roundToken !== this.roundToken) return;
        if (this.phase === "complete") this.nextPrint(roundToken);
        else this.printDot(roundToken);
      });
      this.teachPrinting();
    }
    teachPrinting() {
      this.actionCue?.destroy(); this.actionCue = null;
      const source = this.root.querySelector(".pz-stamp"), token = this.roundToken;
      if (!this.alive || this.phase !== "printing" || !source || source.disabled) return;
      this.actionCue = this.ctx.setupActionCue?.({ source, type: "tap",
        automatic: this.ctx.firstActionDemo === true && this.round === 0 && this.revealed === 0,
        onShow: () => { if (this.alive && token === this.roundToken && this.phase === "printing") this.missed = true; } });
    }
    printDot(token = this.roundToken) {
      if (!this.alive || this.phase !== "printing" || token !== this.roundToken || this.revealed >= this.dotList.length) return false;
      const stamp = this.root.querySelector(".pz-stamp-art");
      if (!this.ctx.reducedMotion?.()) {
        this.stampMotion?.cancel();
        this.stampMotion = stamp?.animate?.([{ translate: "0 0" }, { translate: "0 6px" }, { translate: "0 0" }], { duration: 230, easing: "ease-out" });
      }
      const control = this.root.querySelector(".pz-stamp"), keyboard = control?.matches?.(":focus-visible");
      const printed = this.showDot(this.revealed, token);
      if (printed && keyboard && control?.disabled) this.root.querySelector(".pz-tile")?.focus?.({ preventScroll: true });
      return printed;
    }
    showDot(i, roundToken = this.roundToken) {
      if (!this.alive || this.busy || roundToken !== this.roundToken || i !== this.revealed || i >= this.dotList.length) return false;
      this.root.querySelector(`.pz-dot[data-i="${i}"]`)?.classList.add("is-on");
      this.revealed = i + 1;
      this.ctx.sfx?.("drip");
      const stamp = this.root.querySelector(".pz-stamp");
      if (stamp) { stamp.disabled = this.revealed >= this.dotList.length; stamp.classList.toggle("is-empty", stamp.disabled); }
      if (!this.questionStarted && this.determined()) {
        this.questionStarted = true;
        // Reading speed starts when the visible marks distinguish the letter.
        this.ctx.beginRound?.(item(this.target), "letter-form");
      }
      this.teachPrinting();
      return true;
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
      if (!this.alive || this.busy || this.phase !== "printing" || this.root.querySelectorAll(".pz-tile")[i] !== btn) return;
      const chosen = this.offered[i];
      const certain = this.determined();
      if (!certain) {
        // Any choice before the letter can be distinguished prints another
        // dot. A lucky guess must not skip the observation/matching step.
        this.wobble(btn);
        if (this.revealed < this.dotList.length) this.showDot(this.revealed, this.roundToken);
        else this.ctx.sfx?.("drip");
        return;
      }
      if (certain) this.report(this.target, chosen, this.offered, { skill: "letter-form" });
      if (chosen !== this.target) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".pz-tile").forEach((b, k) => b.classList.toggle("is-hint", this.offered[k] === this.target));
        return;
      }
      const keyboard = btn.matches?.(":focus-visible");
      this.busy = true; this.phase = "complete"; this.actionCue?.destroy(); this.actionCue = null;
      // Show every dot, then celebrate — a little extra sparkle for knowing early.
      this.root.querySelectorAll(".pz-dot").forEach((d) => d.classList.add("is-on"));
      this.root.querySelector(".pz-reveal")?.classList.add(this.revealed < this.dotList.length ? "is-early" : "is-done");
      this.cheer(btn);
      this.sayWithin(item(this.target));
      this.root.querySelectorAll(".pz-tile").forEach((b) => { b.disabled = true; });
      const stamp = this.root.querySelector(".pz-stamp");
      if (stamp) {
        stamp.disabled = false; stamp.classList.remove("is-empty"); stamp.classList.add("is-next");
        stamp.setAttribute("aria-label", this.round + 1 < this.rounds ? "Next letter print" : "Finish printing letters");
        stamp.innerHTML = ns.LettersArt?.icon?.("next", 40) || '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 20h24M22 10l10 10-10 10" fill="none" stroke="#4a3620" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        if (keyboard) stamp.focus?.({ preventScroll: true });
      }
    }
    nextPrint(token = this.roundToken) {
      if (!this.alive || this.phase !== "complete" || token !== this.roundToken) return false;
      const keyboard = this.root.querySelector(".pz-stamp")?.matches?.(":focus-visible");
      this.phase = "leaving"; this.round += 1; this.next();
      if (keyboard && this.phase === "printing") this.root.querySelector(".pz-stamp")?.focus?.({ preventScroll: true });
      return true;
    }
    finish() {
      if (!this.alive || this.phase === "finished") return;
      this.phase = "finished"; this.busy = true; this.roundToken += 1;
      this.actionCue?.destroy(); this.actionCue = null; this.stampMotion?.cancel();
      this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800);
    }
    destroy() { this.actionCue?.destroy(); this.stampMotion?.cancel(); super.destroy(); }

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
      const allowed = order.filter((c) => known.has(c));
      // Do not compress gaps: a child can only order an uninterrupted taught run.
      const runs = []; let run = [];
      for (const c of allowed) {
        const at = order.indexOf(c), prev = order.indexOf(run.at(-1));
        if (run.length && at !== prev + 1) { runs.push(run); run = []; }
        run.push(c);
      }
      if (run.length) runs.push(run);
      this.run = runs.sort((a, b) => b.length - a.length)[0] || [];
      this.size = this.run.length ? Math.min(4, this.run.length, ...this.run.map((c) => profile(ctx, c, "alphabet-order").choiceCount || 2)) : 0;
      this.rideStarts = this.size ? [...new Set(Array.from({ length: Math.min(3, Math.ceil(this.run.length / this.size)) }, (_, i) => Math.min(this.run.length - this.size, i * this.size)))] : [];
      this.rides = this.rideStarts.length;
      this.ride = 0;
      if (this.size < 2) { this.later(() => this.cancel(), 300); return; }
      this.next();
    }
    next() {
      if (this.ride >= this.rides) return this.finish();
      this.actionCue?.destroy(); this.actionCue = null;
      const token = this.rideToken = (this.rideToken || 0) + 1;
      this.phase = 'boarding';
      this.root.classList?.remove('is-boarded');
      const start = this.rideStarts?.[this.ride] ?? Math.min(this.run.length - this.size, this.ride * this.size);
      this.order = this.run.slice(Math.max(0, start), Math.max(0, start) + this.size);
      this.at = 0; this.missed = false; this.busy = false; this.chantId = (this.chantId || 0) + 1;
      const balloons = shuffle(this.order);
      this.root.innerHTML = `
        <span class="pz-station-art" aria-hidden="true">${ns.PuzzlePlayArt?.station?.() || ""}</span>
        <span class="pz-station-shelter" aria-hidden="true">${ns.PuzzlePlayArt?.stationShelter?.() || ""}</span>
        <div class="pz-sky">${balloons.map((c, i) => `<button type="button" class="pz-balloon" data-c="${c}" style="--i:${i};--n:${balloons.length};--d:${(i % 3) * .4}s" aria-label="${c}">${ns.PuzzlePlayArt?.balloon?.(COLORS[i % COLORS.length]) || BALLOON(COLORS[i % COLORS.length])}<span class="pz-balloon-letter">${F().art(c, { size: 50, mode: "plain" })}</span></button>`).join("")}</div>
        <div class="pz-rails" dir="rtl"><button type="button" class="pz-engine pz-drive" aria-label="Drive the letter train" disabled><span class="pz-drive-engine" aria-hidden="true">${ns.PuzzlePlayArt?.engine?.() || ENGINE}</span><span class="pz-drive-cue" aria-hidden="true">${ns.LettersArt?.icon?.('next',28)||''}</span></button><span class="pz-cars" style="--car-count:${this.order.length}">${this.order.map((c, i) => `<button type="button" class="pz-car${i === 0 ? " is-next" : ""}${this.ctx.beginner ? " is-guide" : ""}" data-i="${i}" aria-label="Hear ${c} in the train" disabled><span class="pz-car-art" aria-hidden="true">${ns.PuzzlePlayArt?.carriage?.() || CAR}</span><span class="pz-car-letter" aria-hidden="true">${F().art(c, { size: 44, mode: "plain" })}</span></button>`).join("")}</span></div>
        ${this.dots(this.rides, this.ride)}`;
      this.dragResets?.forEach((reset) => reset()); this.dragResets = [];
      this.root.querySelectorAll(".pz-balloon").forEach((b) => {
        b.addEventListener("click", () => { if (token === this.rideToken) this.pop(b); });
        if (ns.GardenPractice?.draggable) this.dragResets.push(ns.GardenPractice.draggable(b, {
          enabled: () => this.alive && token === this.rideToken && !this.busy && !b.classList.contains("is-popped"),
          drop: (x, y) => { const rails = this.root.querySelector(".pz-rails") || this.root.querySelector(".pz-cars"); if (token !== this.rideToken || !rails || !ns.GardenPractice.inside?.(rails, x, y)) return false; return this.pop(b) === true; },
          onDragStart: () => this.root.querySelector(".pz-rails")?.classList.add("is-receiving"),
          onDragEnd: () => this.root.querySelector(".pz-rails")?.classList.remove("is-receiving"),
        }));
      });
      this.root.querySelector('.pz-drive')?.addEventListener('click',()=>this.depart(token));
      this.root.querySelectorAll('.pz-car').forEach((car,i)=>car.addEventListener('click',()=>this.hearCar(i,token)));
      this.ctx.beginRound?.(item(this.order[0]), "alphabet-order");
      this.teachBoarding();
      if(this.restoreDriverFocus && typeof document!=='undefined' && (!document.activeElement || document.activeElement===document.body))this.root.querySelector('.pz-balloon')?.focus?.({preventScroll:true});
      this.restoreDriverFocus=false;
    }
    teachBoarding() {
      this.actionCue?.destroy(); this.actionCue = null;
      if (!this.alive || this.phase !== 'boarding') return;
      const token=this.rideToken;
      const source=[...this.root.querySelectorAll('.pz-balloon')].find(b=>b.dataset.c===this.order[this.at]);
      const destination=this.root.querySelectorAll('.pz-car')[this.at];
      if (!source || !destination) return;
      this.actionCue=this.ctx.setupActionCue?.({source,destination,type:'drag',
        automatic:this.ctx.firstActionDemo===true && this.ride===0 && this.at===0,
        onShow:()=>{if(this.alive && token===this.rideToken && this.phase==='boarding')this.missed=true;}});
    }
    pop(b) {
      if (!this.alive || this.busy || b.classList.contains("is-popped") || (this.root.contains && !this.root.contains(b))) return false;
      const c = b.dataset.c, want = this.order[this.at];
      if (c !== want || this.at + 1 < this.order.length) this.sayWithin(item(c));
      if (c !== want) {
        // Out of order: the balloon bobs and says its name; nothing is lost.
        this.missed = true;
        this.ctx.sfx?.("boing"); this.wobble(b);
        this.root.querySelectorAll(".pz-balloon").forEach((o) => o.classList.toggle("is-hint", o.dataset.c === want));
        return false;
      }
      this.actionCue?.destroy(); this.actionCue = null;
      this.root.querySelectorAll(".pz-balloon").forEach((o) => o.classList.remove("is-hint"));
      b.classList.add("is-popped");
      this.ctx.sfx?.("pop");
      this.ctx.confettiAt?.(b);
      const car = this.root.querySelectorAll(".pz-car")[this.at];
      car?.classList.remove("is-next", "is-guide"); car?.classList.add("is-filled", "is-arriving");
      const nextCar = this.root.querySelectorAll(".pz-car")[this.at + 1];
      nextCar?.classList.add("is-next");
      this.later(() => car?.classList.remove("is-arriving"), 620);
      this.at += 1;
      if (this.at < this.order.length) { this.teachBoarding(); return true; }
      // The child keeps their assembled train and decides when it leaves.
      this.busy = true;
      this.phase = 'ready';
      this.root.classList?.add('is-boarded');
      const lead = practiceItem(this.ctx, this.order[0]);
      this.ctx.reportOutcome?.({ item: lead, itemId: lead.id, activity: "LetterTrain", skill: "alphabet-order", evidence: "motor_assembly_participation",
        correct: this.missed ? undefined : true, affectsStrength: false });
      this.ctx.pet?.cheer?.();
      const drive=this.root.querySelector('.pz-drive');
      if(drive){drive.disabled=false;drive.classList.add('is-ready');drive.focus?.({preventScroll:true});}
      this.chant();
      return true;
    }
    // The replay button hums the next balloon's name — a hint, so this train
    // no longer counts as unaided.
    replayPrompt() { if (this.alive && !this.busy && this.order?.[this.at]) { this.missed = true; this.sayWithin(item(this.order[this.at])); }
      else if(this.alive && this.phase==='ready')this.chant(); }
    async chant() {
      if(!this.alive || this.phase!=='ready')return false;
      this.phase='singing';
      const chantId = ++this.chantId;
      const cars = [...this.root.querySelectorAll(".pz-car")];
      cars.forEach(car=>car.disabled=true);
      for (let i = 0; i < this.order.length; i += 1) {
        if (!this.alive || chantId !== this.chantId) return;
        cars[i]?.classList.add("is-singing");
        const heard = this.ctx.canListen?.() === false ? false : await this.sayWithin(item(this.order[i]));
        if (!this.alive || chantId !== this.chantId) return false;
        cars[i]?.classList.remove("is-singing");
        if (!heard) break;
        if (i + 1 < this.order.length) await this.wait(280);
      }
      if (!this.alive || chantId !== this.chantId) return;
      this.phase='ready';
      cars.forEach(car=>car.disabled=false);
      return true;
    }
    async hearCar(index, token=this.rideToken) {
      if(!this.alive || token!==this.rideToken || this.phase!=='ready' || !this.order[index])return false;
      this.phase='singing';
      const chantId=++this.chantId, cars=[...this.root.querySelectorAll('.pz-car')];
      // Keep the pressed carriage focused while its short name is playing.
      cars.forEach((car,i)=>car.disabled=i!==index);cars[index]?.classList.add('is-singing');
      await this.sayWithin(item(this.order[index]));
      if(!this.alive || chantId!==this.chantId)return false;
      cars[index]?.classList.remove('is-singing');cars.forEach(car=>car.disabled=false);this.phase='ready';return true;
    }
    depart(token=this.rideToken) {
      if(!this.alive || token!==this.rideToken || !['ready','singing'].includes(this.phase))return false;
      this.phase='departing';this.chantId+=1;
      this.actionCue?.destroy();this.actionCue=null;
      const drive=this.root.querySelector('.pz-drive');
      this.restoreDriverFocus=typeof document!=='undefined' && document.activeElement===drive && !!drive?.matches?.(':focus-visible');
      if(drive){drive.disabled=true;drive.classList.remove('is-ready');}
      this.root.querySelectorAll('.pz-car').forEach(car=>{car.disabled=true;car.classList.remove('is-singing');});
      this.root.querySelector('.pz-rails')?.classList.add('is-leaving');this.ctx.sfx?.('page');
      this.ride += 1;
      this.later(() => {if(token===this.rideToken && this.phase==='departing')this.next();}, this.ctx.reducedMotion?.() ? 350 : 900);
      return true;
    }
    finish() { if(this.phase==='finished')return;this.phase='finished';this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800); }
    destroy() { this.actionCue?.destroy();this.actionCue=null;this.rideToken=(this.rideToken||0)+1;this.chantId+=1;super.destroy(); }
  }
  const ENGINE = `<svg viewBox="0 0 110 70" aria-hidden="true"><path d="M30 14H86V54H30Z" fill="#62cdf4" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M86 24H104V54H86Z" fill="#3a8fc4" stroke="${INK}" stroke-width="3"/><path d="M40 4H56V14H40Z" fill="#4a3620"/><circle cx="44" cy="60" r="8" fill="#4a3620"/><circle cx="76" cy="60" r="8" fill="#4a3620"/><circle cx="96" cy="60" r="6" fill="#4a3620"/><path d="M50 22H76V38H50Z" fill="#ccfbef" stroke="${INK}" stroke-width="2.4"/></svg>`;

  // ---------- Same Letter ----------
  const SYMMETRIC = new Set(["ا", "ب", "ت", "ث", "ن"]);
  class SameLetter extends Base {
    constructor(ctx) {
      super(ctx, "pz-same", "Same letter");
      this.noReplay = true;
      this.known = knownChars(ctx);
      const firsts = (ctx.items || []).map((i) => i.display).filter((c) => this.known.includes(c));
      this.targets = ns.PracticeLearning?.orderChars?.(ctx, this.known, "letter-form", this.known.length) || [...new Set([...firsts, ...shuffle(this.known)])];
      this.rounds = Math.min(4, this.targets.length); this.round = 0;
      const visualLevel = ctx.beginner ? 0 : level(ctx, this.known, "letter-form");
      const establishedMirror = this.known.every((c) => {
        const matching = (ctx.strength || ns.LettersStrength)?.skillProfile?.(practiceItem(ctx, c).id, "letter-form")?.matching;
        return matching?.r >= 12 && matching.streak >= 6 && new Set((matching.sessions || []).filter(Boolean)).size >= 4;
      });
      // First add an upright choice; only a later visit introduces rotation.
      // Mirror discrimination needs still more visual evidence across visits.
      this.level = visualLevel < 2 ? 0 : establishedMirror ? 2 : 1;
      this.choiceCount = ctx.beginner || !this.known.length ? 2 : Math.min(3, ...this.known.map((c) => profile(ctx, c).choiceCount || 2));
      if (this.known.length < 2) { this.later(() => this.cancel(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      this.actionCue?.destroy(); this.actionCue = null;
      const token = this.roundToken = (this.roundToken || 0) + 1;
      const target = this.targets[this.round];
      this.target = target; this.missed = false; this.busy = false; this.replaying = false;
      this.phase = "choosing"; this.wrongChoices = new Set();
      // Distractors: dot-siblings first (they look most alike), then others.
      const sib = siblings(target, this.known);
      const others = shuffle(this.known.filter((c) => c !== target && !sib.includes(c)));
      // Snapshot the choice count and visual level at the start of the visit.
      // Neither dimension changes after a round during this visit.
      const n = this.choiceCount || profile(this.ctx, target).choiceCount || 2;
      const picks = [...shuffle(sib), ...others].slice(0, n - 1);
      // Level 0: upright. Level 1: everyone tumbles. Level 2: plus a mirror trap.
      const turns = [0, 90, 180, 270];
      const spin = () => (this.level >= 1 ? turns[1 + Math.floor(Math.random() * 3)] : 0);
      const tiles = [{ c: target, rot: spin(), flip: false, right: true }, ...picks.map((c) => ({ c, rot: spin(), flip: false, right: false }))];
      // A mirror trap only for letters that change when mirrored — ا ب ت ث ن
      // are left-right symmetric, so their mirror image IS the same letter.
      if (this.level >= 2 && !SYMMETRIC.has(target)) tiles[tiles.length - 1] = { c: target, rot: spin(), flip: true, right: false };
      this.tiles = shuffle(tiles);
      this.root.innerHTML = `
        <div class="pz-target"><span class="pz-match-art" aria-hidden="true">${ns.PuzzlePlayArt?.matchFrame?.() || ""}</span><span class="pz-reference-letter">${F().art(target, { size: 120, mode: "plain" })}</span></div>
        <div class="pz-board pz-turntables">${this.tiles.map((t, i) => `<div class="pz-rotor"><span class="pz-rotor-art" aria-hidden="true">${ns.PuzzlePlayArt?.turntable?.() || ""}</span><button type="button" class="pz-tile" data-i="${i}" aria-label="Letter ${i + 1}"><span class="pz-turned" style="transform:rotate(${t.rot}deg)${t.flip ? " scaleX(-1)" : ""}">${F().art(t.c, { size: 88, mode: "plain" })}</span></button><button type="button" class="pz-turn" data-i="${i}" aria-label="Turn letter ${i + 1}" ${this.level ? "" : "hidden"}>${ns.PuzzlePlayArt?.turnHandle?.() || '<span aria-hidden="true">↻</span>'}</button></div>`).join("")}</div>
        <button type="button" class="pz-same-next" hidden aria-label="${this.round + 1 < this.rounds ? "Next letter" : "Finish matching"}"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 20h24M22 10l10 10-10 10" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
        ${this.dots(this.rounds, this.round)}`;
      this.root.querySelectorAll(".pz-tile").forEach((b) => b.addEventListener("click", () => this.tap(Number(b.dataset.i), b, token)));
      this.root.querySelectorAll(".pz-turn").forEach((b) => b.addEventListener("click", () => this.turn(Number(b.dataset.i), token)));
      this.root.querySelector(".pz-same-next")?.addEventListener("click", () => this.continueMatch(token));
      this.ctx.beginRound?.(item(target), "letter-form");
      if (this.level) this.actionCue = this.ctx.setupActionCue?.({
        source:this.root.querySelector(".pz-turn"), type:"tap",
        automatic:this.ctx.firstActionDemo === true && this.round === 0,
      });
    }
    turn(i, token = this.roundToken) {
      const t = this.tiles[i];
      if (!this.alive || token !== this.roundToken || !t || !["choosing","play"].includes(this.phase)
        || (this.phase === "choosing" && !this.level) || (this.phase === "play" && !t.right)) return false;
      this.actionCue?.stop?.();
      // A full quarter turn is immediately retargetable. Keep the accumulating
      // angle so rapid presses never rewind at 360 degrees; mirrors stay mirrors.
      t.rot += 90;
      const turned = this.root.querySelectorAll(".pz-turned")[i];
      if (turned) turned.style.transform = `rotate(${t.rot}deg)${t.flip ? " scaleX(-1)" : ""}`;
      this.ctx.sfx?.("tap");
      return true;
    }
    async replayFriend(token = this.roundToken) {
      if (!this.alive || token !== this.roundToken || this.phase !== "play" || this.replaying) return false;
      this.replaying = true;
      await this.sayWithin(item(this.target));
      if (this.alive && token === this.roundToken) this.replaying = false;
      return true;
    }
    tap(i, btn, token = this.roundToken) {
      if (!this.alive || token !== this.roundToken) return;
      const t = this.tiles[i];
      if (!t) return;
      if (this.phase === "play") { if (t.right) this.replayFriend(token); return; }
      if (this.busy || this.phase !== "choosing" || this.wrongChoices.has(i)) return;
      const chosen = t.right ? this.target : t.flip ? `${this.target}~mirror` : t.c;
      this.report(this.target, chosen, this.tiles.map((x) => x.right ? this.target : x.flip ? `${x.c}~mirror` : x.c), { skill: "letter-form" });
      if (!t.right) {
        this.missed = true; this.wrongChoices.add(i); btn.disabled = true;
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".pz-tile").forEach((b, k) => b.classList.toggle("is-hint", this.tiles[k].right));
        return;
      }
      const keyboard = btn.matches?.(":focus-visible");
      this.busy = true; this.phase = "play";
      this.actionCue?.destroy(); this.actionCue = null;
      // The matched letter stands up and remains a little toy until Next.
      const turned = btn.querySelector(".pz-turned");
      t.rot = Math.ceil(t.rot / 360) * 360;
      if (turned) turned.style.transform = `rotate(${t.rot}deg)`;
      btn.querySelector("svg.lf")?.classList.remove("is-plain");
      btn.setAttribute?.("aria-label", "Hear your matched friend");
      this.root.querySelectorAll(".pz-tile").forEach((b,k) => { b.disabled = !this.tiles[k].right; b.classList.remove("is-hint"); });
      this.root.querySelectorAll(".pz-rotor").forEach((b,k) => b.classList.toggle("is-matched", this.tiles[k].right));
      this.root.querySelectorAll(".pz-turn").forEach((b,k) => { b.hidden = !this.tiles[k].right; b.disabled = !this.tiles[k].right; });
      const next = this.root.querySelector(".pz-same-next");
      if (next) next.hidden = false;
      this.cheer(btn);
      this.replayFriend(token);
      if (keyboard) next?.focus?.({preventScroll:true});
    }
    continueMatch(token = this.roundToken) {
      if (!this.alive || token !== this.roundToken || this.phase !== "play") return false;
      const keyboard = this.root.querySelector(".pz-same-next")?.matches?.(":focus-visible");
      this.phase = "moving"; this.round++;
      this.next();
      if (keyboard && this.phase === "choosing") this.root.querySelector(".pz-tile")?.focus?.({preventScroll:true});
      return true;
    }
    finish() {
      if (!this.alive || this.phase === "finished") return;
      this.phase = "finished"; this.busy = true;
      this.ctx.sfx?.("cheer2"); this.ctx.done?.();
    }
    destroy() {
      this.actionCue?.destroy(); this.actionCue = null;
      super.destroy();
    }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { EchoParade, DotsLast, LetterTrain, SameLetter });
  ns.PuzzleGames = { KINDS: ["EchoParade", "DotsLast", "LetterTrain", "SameLetter"], siblings, dotsOf, bodyKey, ORDER };
})(window.MiftahGame || (window.MiftahGame = {}));
