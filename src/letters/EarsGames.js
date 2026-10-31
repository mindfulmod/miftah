// Ears First: picture-led listening and guided beat games for pre-readers.
(function (ns) {
  const P = () => ns.PictureWords;
  const shuffle = (xs, random = Math.random) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const beats = word => Math.max(1, [...String(word)].filter(ch => ch >= "ً" && ch <= "ِ").length);
  const DRUM = `<svg viewBox="0 0 120 100" aria-hidden="true"><ellipse cx="60" cy="92" rx="48" ry="6" fill="#2f5c46" opacity=".18"/><path d="M14 30V72Q60 94 106 72V30Z" fill="#ee806f" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M14 40L38 78M38 34L62 82M62 34L86 80M86 34L106 64" fill="none" stroke="#ffe49a" stroke-width="3" stroke-linecap="round"/><ellipse cx="60" cy="30" rx="46" ry="14" fill="#fffaf0" stroke="#4a3620" stroke-width="3"/><ellipse cx="60" cy="30" rx="34" ry="9" fill="none" stroke="#e5dcc8" stroke-width="2.4"/><path d="M100 4L74 24" stroke="#c69434" stroke-width="6" stroke-linecap="round"/><circle cx="102" cy="3" r="6" fill="#ffa798" stroke="#4a3620" stroke-width="2.4"/></svg>`;
  const ineligible = (p, ctx) => !p || !p.id || !(p.word || p.display) || p.taught === false || p.isTaught === false || p.locked === true || p.unlocked === false || (ctx.completedWorldIds && (p.prerequisiteWorldIds || []).some(id => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
  function picturePool(ctx) {
    const supplied = Object.prototype.hasOwnProperty.call(ctx, "pictures") && ctx.pictures !== undefined;
    const source = supplied ? ctx.pictures : P()?.LIST;
    if (!Array.isArray(source) || !source.length) return [];
    const blocked = new Set(source.filter(p => ineligible(p, ctx)).map(p => String(p?.word || p?.display || "").normalize("NFC")));
    const byDisplay = new Map(), seenIds = new Set();
    const blockedIds = new Set(source.filter(p => ineligible(p, ctx)).map(p => p?.id).filter(Boolean));
    for (const p of source) {
      const display = String(p?.word || p?.display || "").normalize("NFC");
      if (!display || blocked.has(display) || ineligible(p, ctx) || blockedIds.has(p.id) || seenIds.has(p.id)) continue;
      seenIds.add(p.id);
      if (!byDisplay.has(display)) byDisplay.set(display, { ...p, word: display, display, char: p.char || [...display][0] });
    }
    return [...byDisplay.values()];
  }
  function planned(ctx, pool, skill, count) {
    if (!pool.length) return [];
    const planner = ns.PracticeLearning?.plan;
    if (typeof planner !== "function") return shuffle(pool, ctx.random).slice(0, count);
    const ids = new Map(pool.map(p => [p.id, p]));
    const plannedItems = planner(ctx, pool.map(p => ({ ...p, display: p.word })), skill, count);
    if (!Array.isArray(plannedItems)) return [];
    const seen = new Set();
    return plannedItems.map(item => ids.get(item?.id)).filter(item => item && !seen.has(item.id) && seen.add(item.id)).slice(0, count);
  }
  function level(ctx, pool, skill) { return ctx.beginner ? 0 : Math.max(0, Math.min(2, Number(ns.PracticeLearning?.level?.(ctx, pool.map(p => ({ ...p, display: p.word })), skill)) || 0)); }
  const groups = (items = P()?.LIST || []) => { const m = new Map(); for (const p of items) { const c = p.char || [...String(p.word || p.display || "")][0]; if (!m.has(c)) m.set(c, []); m.get(c).push(p); } return [...m.values()].filter(g => g.length >= 2); };
  const artSpeaker = () => ns.EarsPlayArt?.speaker?.() || "";
  const artSoundPod = () => ns.EarsPlayArt?.soundPod?.() || "";
  const artStand = () => ns.EarsPlayArt?.listeningStand?.() || "";
  const artReplayAll = () => ns.EarsPlayArt?.replayAll?.() || artSpeaker();

  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.roundToken = 0; this.speechToken = 0; this.timers = new Set(); this.waiters = new Map(); this.pendingSpeech = new Set(); this.reported = new Set(); this.assisted = false;
      this.noReplay = true;
      const stage = ctx.stage;
      if (!stage) { this.alive = false; return; }
      stage.innerHTML = `<div class="ea ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = stage.firstElementChild; this.stage = stage; this.root.tabIndex = -1; this.awaitingContinue = false;
      ctx.prompt?.(null);
      const visitRounds = ctx.beginner ? 3 : 4;
      this.rounds = Math.max(1, Math.min(Math.floor(Number(ctx.rounds)) || visitRounds, visitRounds)); this.round = 0;
      this.pool = picturePool(ctx);
    }
    current(token = this.roundToken, root = this.root) { return this.alive && !this.finishing && token === this.roundToken && this.root === root && root?.isConnected !== false && (!this.stage?.contains || this.stage.contains(root)); }
    clearRoundWork() {
      this.speechToken++; this.drumMotion?.cancel?.();
      this.timers.forEach(clearTimeout); this.timers.clear();
      this.pendingSpeech.forEach(cancel => cancel()); this.pendingSpeech.clear();
      this.waiters.forEach(resolve => resolve(false)); this.waiters.clear();
    }
    beginRoundState() {
      const token = ++this.roundToken;
      this.clearRoundWork(); this.awaitingContinue = false; this.assisted = false;
      this.root.classList.remove("is-complete"); this.reported.delete(token);
      return token;
    }
    later(fn, ms, token = this.roundToken, root = this.root) { const id = setTimeout(() => { this.timers.delete(id); if (this.current(token, root)) fn(); }, ms); this.timers.add(id); return id; }
    wait(ms, token = this.roundToken, root = this.root) { return new Promise(resolve => { const done = value => { clearTimeout(id); this.timers.delete(id); this.waiters.delete(id); resolve(value); }; const id = setTimeout(() => done(this.current(token, root)), ms); this.timers.add(id); this.waiters.set(id, done); }); }
    async say(p, token = this.roundToken, root = this.root) {
      if (!this.current(token, root)) return false;
      try {
        const result = this.ctx.say?.(P().item(p));
        if (result === true) return this.current(token, root);
        if (!result || typeof result.then !== "function") return false;
        return await new Promise(resolve => {
          let settled = false, timer;
          const settle = heard => { if (settled) return; settled = true; clearTimeout(timer); this.pendingSpeech.delete(cancel); resolve(this.current(token, root) && heard === true); };
          const cancel = () => settle(false);
          timer = setTimeout(cancel, 12000); this.pendingSpeech.add(cancel);
          Promise.resolve(result).then(settle, () => settle(false));
        });
      } catch { return false; }
    }
    async playWords(pictures, onWord = () => {}, token = this.roundToken, root = this.root) {
      const speech = ++this.speechToken;
      for (let i = 0; i < pictures.length; i++) {
        if (!this.current(token, root) || speech !== this.speechToken) return false;
        onWord(i);
        if (!await this.say(pictures[i], token, root)) return false;
        if (!this.current(token, root) || speech !== this.speechToken) return false;
        if (i < pictures.length - 1 && !await this.wait(180, token, root)) return false;
      }
      return this.current(token, root) && speech === this.speechToken;
    }
    dots() {
      const last = this.round === this.rounds - 1;
      return `<div class="ea-tools"><div class="bk-progress ea-progress" aria-hidden="true">${Array.from({ length: this.rounds }, (_, i) => `<i class="${i < this.round ? "is-done" : i === this.round ? "is-on" : ""}"></i>`).join("")}</div><button type="button" class="ea-next" aria-label="${last ? "Finish listening games" : "Next picture"}" hidden>${ns.LettersArt?.icon?.(last ? "check" : "next", 36) || ""}</button></div>`;
    }
    completeRound(token = this.roundToken, root = this.root) {
      if (!this.current(token, root) || this.awaitingContinue) return;
      this.awaitingContinue = true; this.busy = true; root.classList.add("is-complete");
      root.querySelectorAll(".ea-drum-btn, .ea-choice").forEach(button => { button.disabled = true; });
      root.querySelectorAll(".ea-card, .ea-choice-replay, .ea-replay-all").forEach(button => { button.disabled = false; });
      root.querySelectorAll(".ea-progress i").forEach((dot, i) => { dot.classList.toggle("is-done", i < this.round); dot.classList.remove("is-on"); });
      const next = root.querySelector(".ea-next");
      if (next) {
        next.hidden = false; next.disabled = false;
        next.onclick = event => this.continueRound(token, root, { keyboard: event?.detail === 0 });
        next.focus?.({ preventScroll: true });
      }
    }
    continueRound(token = this.roundToken, root = this.root, { keyboard = false } = {}) {
      if (!this.current(token, root) || !this.awaitingContinue) return;
      this.awaitingContinue = false;
      const next = root.querySelector(".ea-next"); if (next) next.disabled = true;
      if (this.round >= this.rounds) return this.finish();
      this.next();
      // The next picture may still be playing; keep keyboard focus in its group.
      if (keyboard && this.current()) this.root.focus?.({ preventScroll: true });
    }
    replayCompleted(pictures, token, root) {
      if (!this.current(token, root) || !this.awaitingContinue) return;
      this.clearRoundWork();
      return this.playWords(pictures, () => {}, token, root);
    }
    pic(p, size = 96) { return P().art(p, size); }
    begin(item, skill, choices = []) { this.ctx.beginRound?.(P().item(item), skill); }
    report(item, skill, correct, evidence, assisted, choices = [], affectsStrength = false, selectedId = null) {
      if (correct && this.reported.has(this.roundToken)) return false;
      if (correct) this.reported.add(this.roundToken);
      return this.ctx.reportOutcome?.({ itemId: item.id, correct, skill, activity: this.constructor.name, evidence, assisted: !!assisted, affectsStrength, selectedId, choiceIds: choices.map(p => p.id) });
    }
    sayFailedHint(container, pictures, oddId = null) { if (!container) return; container.hidden = false; container.textContent = ""; container.setAttribute?.("aria-label", "Hear the picture names together"); pictures.forEach(p => { const img = document.createElement("span"); img.className = `ea-reference-picture${p.id === oddId ? " is-odd" : ""}`; img.setAttribute("aria-label", p.en || "Picture"); img.innerHTML = this.pic(p, 48); container.append(img); }); }
    cheer(el) { this.ctx.correct?.(); this.ctx.confettiAt?.(el); this.ctx.pet?.cheer?.(); }
    finish() { if (!this.current()) return; this.finishing = true; this.awaitingContinue = false; this.clearRoundWork(); this.ctx.sfx?.("cheer2"); this.ctx.done?.(); }
    empty() { if (!this.pool.length) { this.later(() => this.ctx.cancel?.(), 0); return true; } return false; }
    destroy() { this.alive = false; this.awaitingContinue = false; this.roundToken += 1; this.clearRoundWork(); }
    wobble(el) { if (!this.ctx.reducedMotion?.()) el?.animate?.([{ opacity: 1 }, { opacity: .84 }, { opacity: 1 }], { duration: 320 }); }
  }

  class BeatDrum extends Base {
    constructor(ctx) { super(ctx, "ea-drum", "Beat drum"); if (this.alive && !this.empty()) { const plannedPool = planned(ctx, this.pool, "syllable-beats", this.pool.length); const established = !ctx.beginner && level(ctx, plannedPool, "syllable-beats") >= 1; const ceiling = established ? 3 : 2; this.maxBeats = ceiling; if (!established) this.rounds = Math.min(3, this.rounds); this.cards = plannedPool.filter(p => beats(p.word) <= ceiling).slice(0, this.rounds); this.rounds = Math.min(this.rounds, this.cards.length); if (!this.rounds) { this.later(() => this.ctx.cancel?.(), 0); return; } this.next(); } }
    next() {
      if (this.round >= this.rounds || !this.cards[this.round]) return this.finish();
      const token = this.beginRoundState();
      this.card = this.cards[this.round]; this.n = beats(this.card.word); this.hits = 0; this.pattern = []; this.pointerHit = false; this.busy = true;
      this.root.innerHTML = `<div class="ea-prompt-prop"><button type="button" class="ea-card" aria-label="Hear ${this.card.en || "the picture name"}">${this.pic(this.card, 110)}</button><div class="ea-listening-stand">${artStand()}</div><button type="button" class="ea-replay-all" aria-label="Hear the picture name again">${artReplayAll()}</button></div><div class="ea-beats" aria-label="${this.n} beats">${Array.from({ length: this.n }, () => `<i>${ns.EarsPlayArt?.beatSeed?.() || ""}</i>`).join("")}</div><button type="button" class="ea-drum-btn" aria-label="Tap once for each beat">${ns.EarsPlayArt?.drum?.() || DRUM}<span class="ea-strike" aria-hidden="true"></span></button><button type="button" class="ea-pattern" aria-label="Play your beats" hidden>${artReplayAll()}<span class="ea-pattern-dots" aria-hidden="true"></span></button>${this.dots()}`;
      const root = this.root, drum = root.querySelector(".ea-drum-btn"), replay = root.querySelector(".ea-replay-all");
      root.querySelector(".ea-card").onclick = event => this.replayPrompt(token, root, event.currentTarget); replay.onclick = event => this.replayPrompt(token, root, event.currentTarget); drum.disabled = true; drum.classList.add("is-hint");
      this.begin(this.card, "syllable-beats");
      this.playWords([this.card], () => {}, token, root).then(heard => { if (!this.current(token, root)) return; if (!heard) this.assisted = true; this.busy = false; drum.disabled = false; });
      drum.onpointerdown = event => {
        if (event.button !== undefined && event.button !== 0) return;
        if (!this.current(token, root) || (this.busy && !this.awaitingContinue)) return;
        this.pointerHit = true;
        const r = drum.getBoundingClientRect?.();
        const point = r?.width && r?.height ? { x: (event.clientX - r.left) / r.width, y: (event.clientY - r.top) / r.height } : null;
        this.hit(drum, token, root, point);
      };
      drum.onclick = event => {
        if (event?.detail && this.pointerHit) { this.pointerHit = false; return; }
        this.hit(drum, token, root);
      };
      root.querySelector(".ea-pattern")?.addEventListener("click", () => this.playPattern(token, root));
    }
    replayPrompt(token = this.roundToken, root = this.root, source) {
      if (!this.card || !this.current(token, root) || (source && root.contains && !root.contains(source))) return;
      if (this.awaitingContinue) return this.replayCompleted([this.card], token, root);
      if (this.busy) return;
      this.assisted = true; this.busy = true;
      const drum = root.querySelector(".ea-drum-btn");
      if (drum) drum.disabled = true;
      this.playWords([this.card], () => {}, token, root).then(() => {
        if (!this.current(token, root)) return;
        this.busy = false; if (drum) drum.disabled = false;
      });
    }
    clock() { return typeof performance !== "undefined" ? performance.now() : Date.now(); }
    cancelPattern() {
      this.patternToken = (this.patternToken || 0) + 1;
      this.patternTimers?.forEach(clearTimeout); this.patternTimers?.clear();
      this.root?.querySelector(".ea-pattern")?.classList.remove("is-playing");
      this.root?.querySelectorAll(".ea-beats i")?.forEach(dot => dot.classList.remove("is-playing"));
    }
    clearRoundWork() {
      this.cancelPattern(); this.impactMotion?.cancel?.(); this.seedMotion?.cancel?.();
      super.clearRoundWork();
    }
    patternReady() {
      const button = this.root.querySelector(".ea-pattern");
      if (!button) return;
      button.hidden = !this.awaitingContinue;
      button.disabled = this.pattern.length !== this.n;
      const strip = button.querySelector(".ea-pattern-dots");
      if (strip) strip.innerHTML = Array.from({length:this.n}, (_,i) => `<i class="${i < this.pattern.length ? "is-on" : ""}"></i>`).join("");
    }
    strike(drum, point, index) {
      const x = Math.max(.12, Math.min(.88, Number.isFinite(point?.x) ? point.x : .5));
      const y = Math.max(.14, Math.min(.82, Number.isFinite(point?.y) ? point.y : .3));
      this.ctx.sfx?.("thud");
      const impact = drum.querySelector(".ea-strike"), dot = this.root.querySelectorAll(".ea-beats i")[index];
      impact?.style?.setProperty("--hit-x", `${x * 100}%`); impact?.style?.setProperty("--hit-y", `${y * 100}%`);
      this.root.querySelectorAll(".ea-beats i").forEach(d => d.classList.remove("is-playing"));
      dot?.classList.add("is-playing");
      this.drumMotion?.cancel?.(); this.impactMotion?.cancel?.(); this.seedMotion?.cancel?.();
      if (!this.ctx.reducedMotion?.()) {
        this.drumMotion = drum.querySelector("svg")?.animate?.([{transform:"none"},{transform:"scale(1.01,.985) translateY(1px)"},{transform:"none"}],{duration:180});
        this.impactMotion = impact?.animate?.([{opacity:.4,transform:"translate(-50%,-50%) scale(.85)"},{opacity:0,transform:"translate(-50%,-50%) scale(1.1)"}],{duration:240});
        this.seedMotion = dot?.animate?.([{transform:"none"},{transform:"translateY(-2px)"},{transform:"none"}],{duration:180});
      }
      return {x,y};
    }
    playPattern(token = this.roundToken, root = this.root) {
      if (!this.current(token, root) || !this.awaitingContinue || this.pattern.length !== this.n) return;
      this.clearRoundWork(); this.ctx.stopSpeech?.();
      const playback = this.patternToken, drum = root.querySelector(".ea-drum-btn");
      const pattern = this.pattern.map(beat => ({...beat}));
      this.patternTimers = new Set(); root.querySelector(".ea-pattern")?.classList.add("is-playing");
      let at = 0;
      const schedule = (fn, ms) => { const id = setTimeout(() => { this.patternTimers.delete(id); if (this.current(token,root) && playback === this.patternToken) fn(); },ms); this.patternTimers.add(id); };
      pattern.forEach((beat,i) => { at += i ? beat.gap : 0; schedule(() => this.strike(drum,beat,i),at); });
      schedule(() => this.cancelPattern(),at + 280);
    }
    async hit(drum, token = this.roundToken, root = this.root, point = null) {
      if (!this.current(token, root) || (this.busy && !this.awaitingContinue) || drum !== root.querySelector(".ea-drum-btn")) return;
      this.cancelPattern();
      const exploring = this.awaitingContinue;
      if (exploring) {
        this.clearRoundWork(); this.ctx.stopSpeech?.();
        if (this.pattern.length === this.n) { this.pattern = []; root.querySelectorAll(".ea-beats i").forEach(d => d.classList.remove("is-on")); }
      }
      const now = this.clock(), position = this.strike(drum, point, this.pattern.length);
      this.pattern.push({...position,gap:this.pattern.length ? Math.max(120,Math.min(1200,now-this.lastHitAt)) : 0}); this.lastHitAt = now;
      root.querySelectorAll(".ea-beats i")[this.pattern.length - 1]?.classList.add("is-on");
      if (exploring) { this.patternReady(); return; }
      this.hits++;
      if (this.hits < this.n) return;
      this.busy = true; drum.disabled = true; drum.classList.remove("is-hint");
      if (!await this.wait(220, token, root) || !this.current(token, root)) return;
      this.cheer(root.querySelector(".ea-beats")); this.report(this.card, "syllable-beats", true, "motor_assembly_participation", this.assisted, [], false);
      this.round++; this.completeRound(token, root);
      drum.disabled = false; drum.setAttribute("aria-label", "Make your own beats"); this.patternReady();
    }
  }

  class ListenChoice extends Base {
    configure(skill, label, choiceSize) {
      if (!this.alive || this.empty()) return false;
      this.skill = skill; this.label = label; this.choiceSize = choiceSize;
      const pool = this.pool;
      this.plannedPool = planned(this.ctx, pool, skill, pool.length);
      this.visitLevel = level(this.ctx, this.plannedPool, skill);
      this.rounds = Math.min(this.rounds, this.visitLevel > 0 ? 4 : 3);
      const available = groups(this.plannedPool).filter(g => this.plannedPool.some(p => p.char !== g[0].char));
      this.sets = available.slice(0, this.rounds).filter(g => g.length >= 2);
      this.rounds = Math.min(this.rounds, this.sets.length);
      if (!this.rounds) { this.later(() => this.ctx.cancel?.(), 0); return false; }
      return true;
    }
    cardMarkup(p, i, size) { return `<div class="ea-choice-pod"><button type="button" class="ea-choice" data-i="${i}" aria-label="Select ${p.en || "picture"}"><span class="ea-choice-shell">${artSoundPod()}</span><span class="ea-choice-picture">${this.pic(p, size)}</span></button><button type="button" class="ea-choice-replay" data-i="${i}" aria-label="Hear ${p.en || "picture"}">${artSpeaker()}</button></div>`; }
    bindChoiceNodes(root, token) {
      root.querySelectorAll(".ea-choice").forEach(btn => btn.addEventListener("click", () => { if (this.current(token, root) && (!root.contains || root.contains(btn))) this.pick(Number(btn.dataset.i), btn, token, root); }));
      root.querySelectorAll(".ea-choice-replay").forEach(btn => btn.addEventListener("click", event => { event.stopPropagation(); if (this.current(token, root) && (!root.contains || root.contains(btn))) this.replayChoice(Number(btn.dataset.i), btn, token, root); }));
      root.querySelector(".ea-replay-all")?.addEventListener("click", event => this.replayPrompt(token, root, event.currentTarget));
    }
    lock(root, value) { root.querySelectorAll(".ea-choice,.ea-choice-replay,.ea-replay-all,.ea-target").forEach(el => { el.disabled = value; }); }
    reveal(root, pics) {
      const support = this.mode === "same" ? [this.target, this.match] : this.choices;
      this.sayFailedHint(root.querySelector(".ea-reference"), support, this.mode === "odd" ? this.odd?.id : null);
      root.querySelectorAll(".ea-choice").forEach((button, i) => { if (this.choices[i]) button.classList.toggle("is-hint", this.correctChoice(this.choices[i])); });
    }
    async initialAudio(pics, token, root, highlight) {
      this.busy = true; this.answerReady = false; this.lock(root, true);
      const heard = await this.playWords(pics, highlight, token, root);
      if (!this.current(token, root)) return;
      this.initialVerified = heard; root.querySelectorAll(".ea-choice").forEach(button => button.classList.remove("is-saying")); root.querySelector(".ea-target")?.classList.remove("is-saying");
      if (!heard) { this.assisted = true; this.reveal(root, pics); }
      this.answerReady = true; this.busy = false; this.lock(root, false);
    }
    async replayChoice(i, button, token, root) {
      if (!this.current(token, root) || button !== root.querySelectorAll(".ea-choice-replay")[i]) return;
      const p = this.choices[i]; if (!p) return;
      if (this.awaitingContinue) return this.replayCompleted([p], token, root);
      if (this.busy || !this.answerReady) return;
      this.assisted = true; this.busy = true; this.lock(root, true);
      const card = root.querySelectorAll(".ea-choice")[i];
      const heard = await this.playWords([p], () => card?.classList.add("is-saying"), token, root);
      if (!this.current(token, root)) return; card?.classList.remove("is-saying"); if (!heard) this.reveal(root, [p]); this.busy = false; this.lock(root, false);
    }
    async replayTarget(token = this.roundToken, root = this.root, source) {
      if (!this.current(token, root) || !this.target || source !== root.querySelector(".ea-target")) return;
      if (this.awaitingContinue) return this.replayCompleted([this.target], token, root);
      if (this.busy || !this.answerReady) return;
      this.assisted = true; this.busy = true; this.lock(root, true);
      const heard = await this.playWords([this.target], () => source.classList.add("is-saying"), token, root);
      if (!this.current(token, root)) return;
      source.classList.remove("is-saying");
      if (!heard) this.reveal(root, [this.target]);
      this.busy = false; this.lock(root, false);
    }
    async replayPrompt(token = this.roundToken, root = this.root, source) {
      if (!this.current(token, root) || (source && root.contains && !root.contains(source))) return;
      const pics = this.mode === "same" ? [this.target, ...this.choices] : this.choices;
      if (this.awaitingContinue) return this.replayCompleted(pics, token, root);
      if (this.busy || !this.answerReady) return;
      this.assisted = true;
      await this.initialAudio(pics, token, root, i => this.markSpeaking(i, root));
    }
    markSpeaking(i, root) {
      const target = root.querySelector(".ea-target");
      target?.classList.toggle("is-saying", this.mode === "same" && i === 0);
      root.querySelectorAll(".ea-choice").forEach((b, k) => b.classList.toggle("is-saying", k === i - (this.mode === "same" ? 1 : 0)));
    }
    async pick(i, btn, token = this.roundToken, root = this.root) {
      if (!this.current(token, root) || this.busy || !this.answerReady || btn !== root.querySelectorAll(".ea-choice")[i]) return;
      const p = this.choices[i]; if (!p) return;
      const correct = this.correctChoice(p);
      if (!correct) {
        const wasAssisted = this.assisted || !this.initialVerified;
        this.busy = true; this.lock(root, true); this.misses++; this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.report(this.targetForReport(), this.skill, false, wasAssisted ? "supported_visible_matching" : "independent_listening", wasAssisted, this.choices, false, p.id);
        this.assisted = true;
        if (this.misses >= 2) root.querySelectorAll(".ea-choice").forEach((b, k) => b.classList.toggle("is-hint", this.correctChoice(this.choices[k])));
        const heard = await this.playWords(this.mode === "same" ? [p, this.target] : [p], () => {}, token, root);
        if (!this.current(token, root)) return; if (!heard) this.reveal(root, this.mode === "same" ? [p, this.target] : [p]); this.busy = false; this.lock(root, false); return;
      }
      this.busy = true; this.lock(root, true); btn.classList.add("is-right"); this.cheer(btn);
      const evidence = this.initialVerified && !this.assisted ? "independent_listening" : "supported_visible_matching";
      this.report(this.targetForReport(), this.skill, true, evidence, this.assisted || !this.initialVerified, this.choices, false, p.id);
      this.round++; this.completeRound(token, root);
      const finishPics = this.mode === "same" ? [this.target, p] : [p];
      const playback = this.playWords(finishPics, () => {}, token, root), speech = this.speechToken;
      const heard = await playback;
      if (!this.current(token, root) || speech !== this.speechToken) return;
      if (!heard) { this.assisted = true; this.reveal(root, finishPics); }
    }
  }

  class SameStart extends ListenChoice {
    constructor(ctx) { super(ctx, "ea-same", "Same first sound"); this.mode = "same"; if (this.configure("first-sound", "Same first sound", 90)) this.next(); }
    configure(skill, label) { this.mode = "same"; return super.configure(skill, label, 90); }
    targetForReport() { return this.target; }
    correctChoice(p) { return p.char === this.target.char && p.id === this.match.id; }
    next() {
      if (this.round >= this.rounds) return this.finish();
      const token = this.beginRoundState(); this.misses = 0;
      const group = this.sets[this.round], target = group[0], match = shuffle(group.slice(1), this.ctx.random)[0];
      const otherPool = this.plannedPool.filter(p => p.char !== target.char);
      const count = Math.min(this.ctx.beginner ? 2 : (this.visitLevel > 0 ? 3 : 2), otherPool.length + 1);
      const distractors = shuffle(otherPool, this.ctx.random).slice(0, count - 1);
      this.target = target; this.match = match; this.choices = shuffle([match, ...distractors], this.ctx.random); this.begin(target, "first-sound", this.choices);
      const root = this.root;
      root.innerHTML = `<div class="ea-prompt-prop"><button type="button" class="ea-card ea-target" aria-label="Hear target ${target.en || "picture"}">${this.pic(target, 110)}</button><div class="ea-listening-stand">${artStand()}</div><button type="button" class="ea-replay-all" aria-label="Hear the target and pictures again">${artReplayAll()}</button></div><div class="ea-choices">${this.choices.map((p, i) => this.cardMarkup(p, i, 88)).join("")}</div><div class="ea-reference" hidden></div>${this.dots()}`;
      root.querySelector(".ea-target").onclick = event => this.replayTarget(token, root, event.currentTarget); this.bindChoiceNodes(root, token);
      this.initialAudio([target, ...this.choices], token, root, i => this.markSpeaking(i, root));
    }
  }

  class OddSound extends ListenChoice {
    constructor(ctx) { super(ctx, "ea-odd", "Odd sound out"); this.mode = "odd"; if (this.configure("first-sound", "Odd sound out", 96)) this.next(); }
    configure(skill, label, choiceSize) { this.mode = "odd"; return super.configure(skill, label, choiceSize); }
    targetForReport() { return this.odd; }
    correctChoice(p) { return p.id === this.odd.id; }
    next() {
      if (this.round >= this.rounds) return this.finish();
      const token = this.beginRoundState(); this.misses = 0;
      const pair = shuffle(this.sets[this.round], this.ctx.random).slice(0, 2), other = this.plannedPool.filter(p => p.char !== pair[0].char);
      const odd = shuffle(other, this.ctx.random)[0]; if (!odd) { this.rounds = this.round; return this.finish(); }
      this.odd = odd; this.choices = shuffle([...pair, odd], this.ctx.random); this.begin(odd, "first-sound", this.choices); const root = this.root;
      root.innerHTML = `<div class="ea-prompt-prop"><div class="ea-listening-stand">${artStand()}</div><button type="button" class="ea-replay-all" aria-label="Hear all pictures again">${artReplayAll()}</button></div><div class="ea-choices ea-three">${this.choices.map((p, i) => this.cardMarkup(p, i, 92)).join("")}</div><div class="ea-reference" hidden></div>${this.dots()}`;
      this.bindChoiceNodes(root, token); this.initialAudio(this.choices, token, root, i => this.markSpeaking(i, root));
    }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { BeatDrum, SameStart, OddSound });
  ns.EarsGames = { KINDS: ["BeatDrum", "SameStart", "OddSound"], beats, groups, DRUM: ns.EarsPlayArt?.drum?.() || DRUM, picturePool, planned };
})(window.MiftahGame || (window.MiftahGame = {}));
