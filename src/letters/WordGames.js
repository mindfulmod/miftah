// Word-stage games use only locally eligible, already taught Quran words.
(function (ns) {
  const MARK = /[ً-ٰٟۖ-ۭ]/u;
  const ALL_MARKS = /[ً-ٰٟۖ-ۭ]/gu;
  const SHADDA = "ّ";
  const NONJOIN = new Set(["ا", "أ", "إ", "آ", "ٱ", "د", "ذ", "ر", "ز", "و", "ؤ", "ة", "ء", "ى"]);
  const NOCROWN = new Set(["ا", "أ", "إ", "آ", "ٱ", "ى", "ة", "ء"]);
  const F = () => ns.LetterFriends;
  const norm = (value) => String(value ?? "").normalize("NFC");
  const shuffle = (list) => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  function clusters(word) {
    const out = [];
    for (const ch of norm(word || "")) {
      if (MARK.test(ch) && out.length) out[out.length - 1] += ch;
      else out.push(ch);
    }
    return out.map(norm);
  }
  const strip = (word) => norm(word || "").replace(ALL_MARKS, "");
  const speakable = (w) => (w && typeof w === "object" ? w : { id: w, display: w, speak: w });
  const itemKey = (item) => item?.id != null ? `id:${item.id}` : `display:${norm(item?.display)}`;
  const displayKey = (item) => norm(item?.display);
  const learning = () => ns.PracticeLearning;
  const eligible = (item, ctx) => {
    if (!item?.id || !item.display || item.taught === false || item.isTaught === false || item.locked === true || item.unlocked === false) return false;
    if (ctx.completedWorldIds) {
      const completed = new Set(ctx.completedWorldIds);
      if ((item.prerequisiteWorldIds || []).some((id) => id !== ctx.worldId && !completed.has(id))) return false;
    }
    return true;
  };
  // A display that occurs in both an eligible and a blocked record stays out
  // of the pool. That prevents aliases from bypassing a local learning lock.
  const localPool = (ctx, accept = () => true) => {
    const all = [...(ctx.items || []), ...(ctx.words || [])].filter((item) => item?.display);
    const seen = new Set();
    return all.filter((item) => {
      const display = displayKey(item);
      if (!eligible(item, ctx) || !accept(item) || seen.has(display)) return false;
      // Dedupe eligible aliases, but reject a display if any alias is blocked.
      const aliases = all.filter((candidate) => displayKey(candidate) === display);
      if (aliases.some((candidate) => !eligible(candidate, ctx))) return false;
      seen.add(display);
      return true;
    });
  };
  const planItems = (ctx, items, skill, count) => {
    // The helper receives only approved records; its result is intersected
    // with that same allowlist so it cannot restore excluded items.
    const allowed = new Map(items.filter((item) => eligible(item, ctx)).map((item) => [itemKey(item), item]));
    const byReference = new Map();
    for (const item of allowed.values()) {
      if (!byReference.has(String(item.id))) byReference.set(String(item.id), item);
      if (!byReference.has(norm(item.display))) byReference.set(norm(item.display), item);
    }
    let planned;
    try { planned = learning()?.plan?.(ctx, [...allowed.values()], skill, count); } catch { planned = null; }
    const raw = Array.isArray(planned) ? planned : [...allowed.values()].slice(0, count);
    const result = [];
    const seen = new Set();
    for (const value of raw) {
      const item = typeof value === "string" ? (allowed.get(`id:${value}`) || byReference.get(norm(value))) : allowed.get(itemKey(value));
      const key = item && itemKey(item);
      if (item && !seen.has(key)) { seen.add(key); result.push(item); }
      if (result.length >= count) break;
    }
    return result;
  };
  const level = (ctx, items, skill) => {
    try { return Math.max(0, Math.min(2, Number(learning()?.level?.(ctx, items, skill)) || 0)); }
    catch { return 0; }
  };
  const profile = (ctx, item, skill) => {
    try { return learning()?.profile?.(ctx, item, skill) || { choiceCount: 2, promptMode: "match" }; }
    catch { return { choiceCount: 2, promptMode: "match" }; }
  };
  const choicesFor = (game, item, skill, available) => {
    const asked = Number(profile(game.ctx, item, skill).choiceCount) || 2;
    return Math.max(2, Math.min(game.choiceCeiling, asked, available));
  };
  const asChoiceIds = (choices) => [...new Set(choices.map((choice) => choice?.sourceItemId || choice?.id).filter((id) => id != null))];
  const feedback = (callback, ...args) => {
    try {
      const result = callback?.(...args);
      if (result && typeof result.then === "function") result.catch(() => {});
    } catch {}
  };

  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.timers = []; this.roundToken = 0;
      ctx.stage.innerHTML = `<div class="wd ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
    }
    beginRound(item) {
      this.clearTimers();
      this.roundToken += 1;
      this.awaitingContinue = false;
      this.root.classList.remove("is-complete");
      this.target = item;
      this.missed = false;
      this.rejectedChoices = new Set();
      this.heard = false;
      this.busy = false;
      this.answerReady = false;
      this.setPrompt(item);
      return this.roundToken;
    }
    current(token = this.roundToken, el) {
      if (!this.alive || this.finished || token !== this.roundToken || this.ctx.stage?.firstElementChild !== this.root) return false;
      return !el || (typeof this.root.contains === "function" ? this.root.contains(el) : el.isConnected !== false);
    }
    later(fn, ms, token = this.roundToken) {
      const timer = setTimeout(() => {
        this.timers = this.timers.filter((entry) => entry !== timer);
        if (this.current(token)) fn();
      }, ms);
      this.timers.push(timer);
      return timer;
    }
    dots(n, at) {
      const last = at === n - 1;
      return `<div class="wd-tools"><div class="pz-progress" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < at ? "is-done" : i === at ? "is-on" : ""}"></i>`).join("")}</div><button type="button" class="wd-next" aria-label="${last ? 'Finish playing with words' : 'Next word'}" hidden>${ns.LettersArt?.icon?.(last ? "check" : "next", 36) || ""}</button></div>`;
    }
    clearTimers() {
      this.timers.forEach(clearTimeout);
      this.timers = [];
    }
    completeRound(token = this.roundToken) {
      if (!this.current(token) || this.awaitingContinue) return;
      // Keep the successful word in the child's hands until they leave it.
      this.clearTimers();
      this.awaitingContinue = true;
      this.busy = true;
      this.root.classList.add("is-complete");
      this.root.querySelectorAll(".wd-card, .wd-piece").forEach(button => { button.disabled = true; });
      this.root.querySelectorAll(".pz-progress i").forEach((dot, i) => {
        dot.classList.toggle("is-done", i < this.round);
        dot.classList.remove("is-on");
      });
      const next = this.root.querySelector(".wd-next");
      if (next) {
        next.hidden = false;
        next.disabled = false;
        next.onclick = event => this.continueRound(token, { keyboard: event?.detail === 0 });
        next.focus?.({ preventScroll: true });
      }
    }
    continueRound(token = this.roundToken, { keyboard = false } = {}) {
      if (!this.current(token) || !this.awaitingContinue) return;
      this.awaitingContinue = false;
      const next = this.root.querySelector(".wd-next");
      if (next) next.disabled = true;
      if (this.round >= this.queue.length) return this.finish();
      this.next();
      if (keyboard && this.current()) {
        const focus = this.listenPrompt ? this.root.querySelector(".wd-ear")
          : this.root.querySelectorAll(".wd-card, .wd-piece")[0];
        focus?.focus?.({ preventScroll: true });
      }
    }
    wobble(el) { if (!this.ctx.reducedMotion?.()) el?.animate?.([{ opacity: 1 }, { opacity: .84 }, { opacity: 1 }], { duration: 360 }); }
    setPrompt(item) {
      this.promptToken = this.roundToken;
      this.promptItemKey = itemKey(item);
      this.heard = false;
    }
    say(it, options = {}) {
      const token = this.roundToken;
      const key = itemKey(speakable(it));
      const isCurrentPrompt = key === this.promptItemKey;
      const settle = (heard) => {
        if (!this.current(token) || !isCurrentPrompt) return heard === true;
        this.heard = heard === true;
        if (isCurrentPrompt) {
          this.answerReady = true;
          if (!heard && this.listenPrompt) this.showReference?.(token);
        }
        return heard === true;
      };
      let result;
      try { result = this.ctx.say?.(speakable(it)); } catch { result = false; }
      if (!result || typeof result.then !== "function") return settle(result === true);
      let timeoutId;
      const timed = new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(false), 5000);
        this.timers.push(timeoutId);
      });
      // Both fulfillment and rejection are consumed, including a late reject
      // after timeout, so playback adapters cannot create unhandled rejections.
      return Promise.race([Promise.resolve(result).then((value) => value === true, () => false), timed])
        .then((heard) => {
          clearTimeout(timeoutId);
          this.timers = this.timers.filter((timer) => timer !== timeoutId);
          return settle(heard);
        }, () => {
          clearTimeout(timeoutId);
          this.timers = this.timers.filter((timer) => timer !== timeoutId);
          return settle(false);
        });
    }
    report(target, correct, choices, skill, selectedId, choiceIds) {
      const independent = this.constructor.name === "ListenFind" && this.listenPrompt === true
        && this.roundProfile?.promptMode === "listen" && !this.missed && this.heard === true;
      const itemId = target?.id;
      feedback(this.ctx.reportOutcome && this.ctx.reportOutcome.bind(this.ctx), { item: target, itemId, activity: this.constructor.name, skill, correct: !!correct,
        evidence: independent ? "independent_listening" : "supported_visible_matching", assisted: !!this.missed || !this.answerReady,
        ...(selectedId != null ? { selectedId } : {}), choiceIds: choiceIds || asChoiceIds(choices),
        affectsStrength: this.answerReady === true });
      return !!correct;
    }
    replayPrompt() {
      if (!this.target || !this.current()) return;
      if (this.awaitingContinue) this.clearTimers();
      this.missed = true;
      this.say(this.target);
    }
    finish() {
      if (!this.current()) return;
      this.finished = true;
      this.awaitingContinue = false;
      this.busy = true;
      this.clearTimers();
      feedback(this.ctx.sfx && this.ctx.sfx.bind(this.ctx), "cheer2");
      feedback(this.ctx.done && this.ctx.done.bind(this.ctx));
    }
    destroy() {
      this.alive = false;
      this.awaitingContinue = false;
      this.roundToken += 1;
      this.clearTimers();
    }
    validPick(token, index, button, choices) {
      return this.current(token, button) && !this.busy && this.answerReady
        && !button?.disabled && !this.rejectedChoices.has(index)
        && this.offered === choices && index >= 0 && index < choices.length && this.offered[index] === choices[index];
    }
    rejectChoice(index, button) {
      // Rest this choice before reporting: repeated input is not new evidence.
      this.rejectedChoices.add(index);
      if (button) {
        button.disabled = true;
        button.classList.add("is-tried");
      }
    }
    showArt(name) {
      try { return ns.WordWardrobeArt?.[name]?.() || ""; } catch { return ""; }
    }
  }

  const CROWN = `<svg viewBox="0 0 48 32" width="36" height="24" aria-hidden="true"><path d="M4 28V10L14 18L24 4L34 18L44 10V28Z" fill="#f3c955" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><circle cx="24" cy="16" r="3" fill="#ee806f"/></svg>`;

  class TwinCrown extends Base {
    constructor(ctx) {
      super(ctx, "wd-crown", "Twin crown");
      this.pool = localPool(ctx, (w) => strip(w.display).length >= 2);
      const pool = this.pool;
      const withS = shuffle(pool.filter((w) => norm(w.display).includes(SHADDA) && this.twin(w.display)));
      const without = shuffle(pool.filter((w) => !w.display.includes(SHADDA) && w.audioPath && this.twin(w.display)));
      const mixed = [];
      for (let i = 0; i < 4; i += 1) {
        const w = (i % 2 ? without : withS)[Math.floor(i / 2)] || withS[i] || without[i];
        if (w && !mixed.some((entry) => displayKey(entry) === displayKey(w))) mixed.push(w);
      }
      this.queue = planItems(ctx, mixed, "syllable", 4);
      this.round = 0;
      if (!this.queue.length) { ctx.cancel?.(); return; }
      this.supportLevel = level(ctx, this.queue, "syllable");
      this.choiceCeiling = this.supportLevel > 0 ? 3 : 2;
      this.next();
    }
    twin(word) {
      const canonical = norm(word);
      if (canonical.includes(SHADDA)) return norm(canonical.replace(SHADDA, ""));
      const cl = clusters(canonical);
      let k = -1;
      for (let j = cl.length - 1; j >= 0; j -= 1) if (!NOCROWN.has(cl[j][0]) && /[َُِ]/u.test(cl[j])) { k = j; break; }
      if (k < 0) return null;
      cl[k] = norm(cl[k][0] + SHADDA + cl[k].slice(1));
      const twin = norm(cl.join(""));
      return twin === canonical ? null : twin;
    }
    next() {
      if (this.round >= this.queue.length) return this.finish();
      const t = this.queue[this.round];
      const token = this.beginRound(t);
      this.roundProfile = profile(this.ctx, t, "syllable");
      const other = this.twin(t.display);
      if (!other || norm(other) === norm(t.display)) { this.round += 1; return this.next(); }
      this.choiceCeiling = 2; // Crown/no-crown is always a two-choice contrast.
      this.offered = shuffle([norm(t.display), norm(other)]);
      const alternate = this.pool.find((item) => displayKey(item) === norm(other));
      this.choiceRecords = this.offered.map((display) => ({ display, id: display === norm(t.display) ? t.id : alternate?.id }));
      const crownWord = norm(t.display).includes(SHADDA) ? norm(t.display) : norm(other);
      this.previewBase = clusters(crownWord).find((cluster) => cluster.includes(SHADDA))?.[0] || null;
      const previewFriend = this.previewBase && F()?.FRIENDS?.[this.previewBase]
        ? `<span class="wd-preview">${F().art(this.previewBase, { size: 90 })}</span>` : "";
      this.root.innerHTML = `<div class="wd-reference" dir="rtl" lang="ar" aria-label="Word reference">${norm(t.display)}</div>
        <div class="wd-crown-stage"><div class="wd-crown-stage-art" aria-hidden="true">${this.showArt("crownStage")}</div><div class="wd-twins is-preview" aria-hidden="true">${previewFriend}</div></div>
        <div class="wd-cards">${this.offered.map((w, i) => `<button type="button" class="wd-card${w.includes(SHADDA) ? " has-crown" : ""}" data-i="${i}" aria-label="${w}">${w.includes(SHADDA) ? `<span class="wd-crown-badge">${CROWN}</span>` : ""}<span class="wd-word" dir="rtl" lang="ar">${w}</span></button>`).join("")}</div>
        ${this.dots(this.queue.length, this.round)}`;
      const choices = this.offered;
      this.root.querySelectorAll(".wd-card").forEach((button) => button.addEventListener("click", () => this.pick(Number(button.dataset.i), button, token, choices)));
      this.ctx.beginRound?.(t, "syllable");
      this.answerReady = true; // The complete word reference is visible.
      this.later(() => this.say(t), 350, token);
    }
    pick(i, btn, token = this.roundToken, choices = this.offered) {
      if (!this.validPick(token, i, btn, choices)) return false;
      const chosen = choices[i];
      const selected = this.choiceRecords[i];
      const correct = norm(chosen) === norm(this.target.display);
      if (!correct) this.rejectChoice(i, btn);
      if (!this.report(this.target, correct, choices, "syllable", selected.id, this.choiceRecords.map((choice) => choice.id).filter(Boolean))) {
        this.missed = true;
        feedback(this.ctx.sfx && this.ctx.sfx.bind(this.ctx), "softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".wd-card").forEach((button, k) => button.classList.toggle("is-hint", norm(this.offered[k]) === norm(this.target.display)));
        this.later(() => this.say(this.target), 600, token);
        return true;
      }
      this.busy = true;
      btn.classList.add("is-right");
      const doubled = clusters(this.target.display).find((cluster) => cluster.includes(SHADDA));
      const base = doubled ? doubled[0] : this.previewBase;
      if (doubled && base && F()?.FRIENDS?.[base] && ns.VowelGames) {
        const twins = this.root.querySelector(".wd-twins");
        if (twins) {
          twins.innerHTML = `<span class="wd-twin">${F().art(base, { size: 90 })}</span><span class="wd-twin">${F().art(base, { size: 90 })}</span><span class="wd-one">${ns.VowelGames.wearing(base, SHADDA, 110)}</span>`;
          twins.classList.remove("is-preview");
          twins.classList.add("is-on");
        }
      }
      feedback(this.ctx.correct && this.ctx.correct.bind(this.ctx)); feedback(this.ctx.confettiAt && this.ctx.confettiAt.bind(this.ctx), btn); feedback(this.ctx.pet?.cheer && this.ctx.pet.cheer.bind(this.ctx.pet));
      this.round += 1;
      this.completeRound(token);
      this.later(() => this.say(this.target), 900, token);
    }
  }

  class ListenFind extends Base {
    constructor(ctx) {
      super(ctx, "wd-listen", "Listen and find");
      const recited = (w) => w?.display && w.audioPath;
      this.pool = localPool(ctx, recited);
      this.choiceCeiling = level(ctx, this.pool, "word-reading") > 0 ? 3 : 2;
      this.queue = planItems(ctx, this.pool, "word-reading", this.choiceCeiling > 2 ? 4 : 3);
      this.round = 0;
      if (this.pool.length < 2 || !this.queue.length) { ctx.cancel?.(); return; }
      this.next();
    }
    next() {
      if (this.round >= this.queue.length) return this.finish();
      const t = this.queue[this.round];
      const token = this.beginRound(t);
      this.roundProfile = profile(this.ctx, t, "word-reading");
      this.listenPrompt = this.roundProfile.promptMode === "listen" && this.ctx.canListen?.() !== false;
      const targetKey = displayKey(t);
      const len = strip(t.display).length;
      const others = shuffle(this.pool.filter((w) => displayKey(w) !== targetKey && strip(w.display) !== strip(t.display)))
        .sort((a, b) => Math.abs(strip(a.display).length - len) - Math.abs(strip(b.display).length - len));
      const n = choicesFor(this, t, "word-reading", Math.min(this.pool.length, this.choiceCeiling));
      if (n < 2 || others.length < 1) { this.ctx.cancel?.(); this.destroy(); return; }
      const records = shuffle([t, ...others.slice(0, n - 1)]);
      this.choiceRecords = records;
      this.offered = records.map((item) => norm(item.display));
      this.root.innerHTML = `<div class="wd-listen-scene"><div class="wd-listen-art" aria-hidden="true">${this.showArt("readingNook")}</div>
        <button type="button" class="wd-ear" aria-label="Hear the word again">${ns.LettersArt?.icon?.("speaker", 44) || "♪"}<span class="wd-ear-note" aria-hidden="true">${F()?.art("ه", { size: 56 }) || ""}</span></button>
        <div class="wd-reference" dir="rtl" lang="ar" aria-label="Word reference"${this.listenPrompt ? " hidden" : ""}>${norm(t.display)}</div></div>
        <div class="wd-cards">${records.map((item, i) => `<button type="button" class="wd-card" data-i="${i}" aria-label="${norm(item.display)}"><span class="wd-word" dir="rtl" lang="ar">${norm(item.display)}</span></button>`).join("")}</div>
        ${this.dots(this.queue.length, this.round)}`;
      this.root.querySelector(".wd-ear").onclick = () => this.replayPrompt(token);
      const choices = this.offered;
      this.root.querySelectorAll(".wd-card").forEach((button) => button.addEventListener("click", () => this.pick(Number(button.dataset.i), button, token, choices)));
      this.ctx.beginRound?.(t, "word-reading");
      this.answerReady = !this.listenPrompt;
      this.later(() => this.say(t), 350, token);
    }
    showReference(token = this.roundToken) {
      if (!this.current(token)) return;
      const reference = this.root.querySelector(".wd-reference");
      if (reference) reference.hidden = false;
      this.answerReady = true;
    }
    replayPrompt(token = this.roundToken) {
      if (!this.current(token)) return;
      if (this.awaitingContinue) this.clearTimers();
      this.missed = true;
      this.showReference(token);
      this.say(this.target);
    }
    pick(i, btn, token = this.roundToken, choices = this.offered) {
      if (!this.validPick(token, i, btn, choices)) return;
      const selected = this.choiceRecords[i];
      const correct = displayKey(selected) === displayKey(this.target);
      if (!correct) this.rejectChoice(i, btn);
      if (!this.report(this.target, correct, this.choiceRecords, "word-reading", selected.id, this.choiceRecords.map((item) => item.id))) {
        this.missed = true;
        this.showReference(token);
        feedback(this.ctx.sfx && this.ctx.sfx.bind(this.ctx), "softwrong"); this.wobble(btn);
        const wrong = selected;
        this.say(wrong);
        this.later(() => this.say(this.target), 1600, token);
        this.root.querySelectorAll(".wd-card").forEach((button, k) => button.classList.toggle("is-hint", displayKey(this.choiceRecords[k]) === displayKey(this.target)));
        return;
      }
      this.busy = true;
      btn.classList.add("is-right");
      feedback(this.ctx.correct && this.ctx.correct.bind(this.ctx)); feedback(this.ctx.confettiAt && this.ctx.confettiAt.bind(this.ctx), btn); feedback(this.ctx.pet?.cheer && this.ctx.pet.cheer.bind(this.ctx.pet));
      this.showReference(token);
      this.round += 1;
      this.completeRound(token);
      this.later(() => this.say(this.target), 600, token);
    }
  }

  const gapCandidates = (target, pool) => {
    const sourceClusters = new Map();
    const isMarkCarrier = (c) => !["ا", "أ", "إ", "آ", "ٱ", "ى", "ة"].includes(c);
    const isArabicLetter = (c) => /^\p{Letter}$/u.test(c) && /\p{Script=Arabic}/u.test(c);
    for (const item of pool) for (const cluster of clusters(item.display)) {
      const base = cluster[0];
      if (!F()?.FRIENDS?.[base] || !isMarkCarrier(base)) continue;
      const key = norm(cluster);
      if (!sourceClusters.has(key)) sourceClusters.set(key, { display: key, sourceItemId: item.id, marks: norm(cluster.slice(1)) });
    }
    const targetClusters = clusters(target.display);
    return targetClusters.map((cluster, index) => {
      const base = cluster[0];
      if (!F()?.FRIENDS?.[base] && !isArabicLetter(base)) return null;
      const options = [...sourceClusters.values()].filter((option) => option.display !== norm(cluster));
      const sameMarks = options.filter((option) => option.marks === norm(cluster.slice(1)));
      const otherMarks = options.filter((option) => option.marks !== norm(cluster.slice(1)));
      return { index, cluster: norm(cluster), options: [...sameMarks, ...otherMarks] };
    }).filter((entry) => entry && entry.options.length > 0);
  };

  class WordGap extends Base {
    constructor(ctx) {
      super(ctx, "wd-gap", "Word gap");
      const recited = (w) => w?.display && w.audioPath && clusters(w.display).length >= 2;
      this.pool = localPool(ctx, recited);
      this.pool = this.pool.filter((item) => gapCandidates(item, this.pool).length > 0);
      this.choiceCeiling = level(ctx, this.pool, "word-reading") > 0 ? 3 : 2;
      this.queue = planItems(ctx, this.pool, "word-reading", 4);
      this.round = 0;
      if (!this.pool.length || !this.queue.length) { ctx.cancel?.(); return; }
      this.next();
    }
    next() {
      this.actionCue?.destroy(); this.actionCue = null; this.fitFlight?.cancel(); this.fitFlight = null;
      this.dragResets?.forEach((reset) => reset()); this.dragResets = [];
      if (this.round >= this.queue.length) return this.finish();
      const t = this.queue[this.round];
      const token = this.beginRound(t);
      this.roundProfile = profile(this.ctx, t, "word-reading");
      const candidates = gapCandidates(t, this.pool);
      if (!candidates.length) { this.ctx.cancel?.(); this.destroy(); return; }
      const selectedGap = candidates[Math.floor(Math.random() * candidates.length)];
      this.gapIndex = selectedGap.index;
      const cl = clusters(t.display), piece = selectedGap.cluster;
      const k = this.gapIndex;
      const prefix = cl.slice(0, k).join("");
      const suffix = cl.slice(k + 1).join("");
      const pre = prefix && !NONJOIN.has(cl[k - 1][0]) ? `${prefix}ـ` : prefix;
      const suf = suffix && !NONJOIN.has(piece[0]) ? `ـ${suffix}` : suffix;
      const n = choicesFor(this, t, "word-reading", Math.min(this.choiceCeiling, selectedGap.options.length + 1));
      if (n < 2) { this.ctx.cancel?.(); this.destroy(); return; }
      const chosenOptions = selectedGap.options.slice(0, n - 1);
      this.choiceRecords = shuffle([{ display: piece, sourceItemId: t.id }, ...chosenOptions]);
      this.offered = this.choiceRecords.map((option) => option.display);
      this.root.innerHTML = `<button type="button" class="wd-ear" aria-label="Hear the word again">${ns.LettersArt?.icon?.("speaker", 44) || "♪"}</button>
        <div class="wd-reference" dir="rtl" lang="ar" aria-label="Word reference ${norm(t.display)}"><span data-fit-ink dir="rtl" lang="ar">${norm(t.display)}</span></div>
        <div class="wd-book"><div class="wd-book-art" aria-hidden="true">${this.showArt("bookCradle")}</div><div class="wd-gapword" dir="rtl" lang="ar">${pre ? `<span class="wd-fragment" data-fit-ink dir="rtl" lang="ar">${pre}</span>` : ""}<span class="wd-hole" aria-label="The missing letter"></span>${suf ? `<span class="wd-fragment" data-fit-ink dir="rtl" lang="ar">${suf}</span>` : ""}</div></div>
        <div class="wd-pieces">${this.choiceRecords.map((option, i) => `<button type="button" class="wd-piece" data-i="${i}" aria-label="${option.display}"><span data-fit-ink dir="rtl" lang="ar">${option.display}</span></button>`).join("")}</div>
        ${this.dots(this.queue.length, this.round)}`;
      this.root.querySelector(".wd-ear").onclick = () => this.replayPrompt(token);
      const choices = this.offered;
      this.root.querySelectorAll(".wd-piece").forEach((button) => button.addEventListener("click", () => this.pick(Number(button.dataset.i), button, token, choices)));
      this.wirePieceDrags(token, choices);
      this.ctx.beginRound?.(t, "word-reading");
      this.answerReady = true; // The joined reference remains visible.
      this.teachGap(token, choices);
      this.later(() => this.say(t), 350, token);
    }
    pick(i, btn, token = this.roundToken, choices = this.offered, released = null) {
      if (!this.validPick(token, i, btn, choices)) return false;
      const selected = this.choiceRecords[i];
      const clustersOfTarget = clusters(this.target.display);
      const completed = norm(clustersOfTarget.map((cluster, index) => index === this.gapIndex ? selected.display : cluster).join(""));
      const correct = completed === norm(this.target.display);
      if (!correct) this.rejectChoice(i, btn);
      if (!this.report(this.target, correct, this.choiceRecords, "word-reading", selected.sourceItemId,
        [...new Set(this.choiceRecords.map((option) => option.sourceItemId).filter((id) => id != null))])) {
        this.missed = true;
        feedback(this.ctx.sfx && this.ctx.sfx.bind(this.ctx), "softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".wd-piece").forEach((button, k) => button.classList.toggle("is-hint", norm(this.choiceRecords[k].display) === norm(clustersOfTarget[this.gapIndex])));
        this.later(() => this.say(this.target), 500, token);
        return true;
      }
      this.busy = true;
      this.clearTimers();
      this.actionCue?.destroy(); this.actionCue = null;
      const gapword = this.root.querySelector(".wd-gapword"), hole = this.root.querySelector(".wd-hole");
      const arrive = () => {
        if (!this.current(token, btn)) return;
        this.fitFlight?.cancel(); this.fitFlight = null;
        btn.classList.remove('is-fitting'); btn.classList.add('is-seated');
        this.root.querySelectorAll('.wd-piece').forEach(piece => piece.classList.remove('is-hint'));
        if (gapword) {
          // The finished word is one continuous shaped run, never separately
          // positioned letters. Fitting and replay cannot add another outcome.
          gapword.innerHTML = `<button type="button" class="wd-whole" aria-label="Hear completed word ${completed}"><span data-fit-ink dir="rtl" lang="ar">${completed}</span></button>`;
          gapword.classList.add("is-whole");
          const whole = gapword.querySelector?.('.wd-whole');
          if (whole) whole.onclick = () => { if (this.current(token, whole) && this.awaitingContinue) { this.replayPrompt(); this.wobble(whole); } };
        }
        feedback(this.ctx.correct && this.ctx.correct.bind(this.ctx));
        feedback(this.ctx.confettiAt && this.ctx.confettiAt.bind(this.ctx), gapword);
        feedback(this.ctx.pet?.cheer && this.ctx.pet.cheer.bind(this.ctx.pet));
        this.round += 1;
        this.completeRound(token);
        this.later(() => this.say(this.target), 500, token);
      };
      const a = btn.getBoundingClientRect?.(), b = hole?.getBoundingClientRect?.();
      if (a && b && a.width > 0 && b.width > 0 && !this.ctx.reducedMotion?.()) {
        const scale = btn.offsetWidth ? a.width / btn.offsetWidth : 1;
        const start = released ? `translate(${(released.left-a.left)/scale}px, ${(released.top-a.top)/scale}px)` : 'none';
        btn.classList.add('is-fitting');
        this.fitFlight = btn.animate?.([
          { transform: start, opacity: 1 },
          { transform: `translate(${(b.left+b.width/2-a.left-a.width/2)/scale}px, ${(b.top+b.height/2-a.top-a.height/2)/scale}px) scale(${Math.min(1,b.width/a.width)})`, opacity: 1 },
        ], { duration: 300, easing: 'cubic-bezier(.22,.68,0,1)', fill: 'forwards' });
      }
      if (this.fitFlight) this.later(arrive, 300, token); else arrive();
      return true;
    }
    teachGap(token = this.roundToken, choices = this.offered) {
      this.actionCue?.destroy(); this.actionCue = null;
      const wanted = norm(clusters(this.target.display)[this.gapIndex]);
      const source = [...this.root.querySelectorAll('.wd-piece')].find(b => norm(choices[Number(b.dataset.i)]) === wanted);
      const destination = this.root.querySelector('.wd-hole');
      if (!source || !destination) return;
      this.actionCue = this.ctx.setupActionCue?.({ source, destination, type: 'drag',
        automatic: this.ctx.firstActionDemo === true && !this.gapDemoShown,
        onShow: () => { if (this.current(token) && !this.busy) this.missed = true; },
      });
      this.gapDemoShown = true;
    }
    wirePieceDrags(token = this.roundToken, choices = this.offered) {
      this.dragResets?.forEach((reset) => reset()); this.dragResets = [];
      const hole = this.root.querySelector(".wd-hole");
      this.root.querySelectorAll(".wd-piece").forEach((button) => {
        const i = Number(button.dataset.i);
        const reset = ns.GardenPractice?.draggable?.(button, {
          enabled: () => this.validPick(token, i, button, choices),
          onDragMove: (x, y) => { if (this.current(token, button)) hole?.classList.toggle("is-drop-target", ns.GardenPractice.inside(hole, x, y)); },
          onDragEnd: () => { if (this.current(token)) hole?.classList.remove("is-drop-target"); },
          drop: (x, y, released) => {
            if (!this.current(token, button) || this.offered !== choices || !hole || !ns.GardenPractice.inside(hole, x, y)) return false;
            return this.pick(i, button, token, choices, released) === true;
          },
        });
        if (reset) this.dragResets.push(reset);
      });
      hole?.classList.add("is-drop-ready");
    }
    destroy() {
      this.actionCue?.destroy(); this.actionCue = null; this.fitFlight?.cancel(); this.fitFlight = null;
      super.destroy();
      this.dragResets?.forEach((reset) => reset());
      this.dragResets = [];
    }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { TwinCrown, ListenFind, WordGap });
  ns.WordGames = { KINDS: ["TwinCrown", "ListenFind", "WordGap"], clusters, strip, NONJOIN, eligible, gapCandidates };
})(window.MiftahGame || (window.MiftahGame = {}));
