// The Word Tree (v63, 2026-10-16) — the roots bridge.
// Quran words come in families that share three root letters: نَعْبُدُ and
// أَعْبُدُ and عَـٰبِدُونَ all grow from ع ب د. The tree has one branch per root
// (from the surahs the child reads in the Ayah Garden), a seed at the trunk
// holding the root letters, and a leaf for each word. Tap a leaf: the word is
// recited and its root letters glow inside it. Tap a seed: they glow in every
// leaf on its branch — "these words are family". The tree grows a branch each
// new day it is visited. Leaf Home is its game: a leaf drifts down — which
// branch is its home?
//
// Roots come from the Quranic Arabic Corpus (data/surah-*.json), recitation
// from the word-by-word audio. Nothing here is a mastery gate.
(function (ns) {
  // Quranic marks (harakat, dagger alif, small high signs) ride with their letter.
  const MARK = /[ؐ-ًؚ-ٰٟۖ-ۭ]/;
  const RIGHT_ONLY = new Set([..."اأإآٱدذرزوؤةء"]);
  const ZWJ = "‍", TATWEEL = "ـ";
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // Hamza seats all count as the root's hamza.
  const norm = (c) => ("أإآءؤئ".includes(c) ? "ء" : c);
  const canonical = (value) => String(value ?? "").normalize("NFC");
  const arabicLetter = (char) => /^\p{Letter}$/u.test(char) && /\p{Script=Arabic}/u.test(char);

  function pieces(word) {
    const cl = [];
    for (const ch of String(word)) { if ((MARK.test(ch) || ch === TATWEEL) && cl.length) cl[cl.length - 1] += ch; else cl.push(ch); }
    return cl.map((c, i) => {
      const base = c[0], prev = cl[i - 1]?.[0], next = cl[i + 1];
      const joinPrev = !!prev && !RIGHT_ONLY.has(prev), joinNext = !!next && !RIGHT_ONLY.has(base);
      return { base, text: (joinPrev ? ZWJ : "") + c + (joinNext ? ZWJ : "") };
    });
  }
  // Highlight roots in their written order. Prefixes are skipped, and a
  // doubled radical written with shadda gets only its one visible base mark.
  function orderedRoot(word, root) {
    const want = [...canonical(root)].filter(arabicLetter).map(norm);
    let at = 0;
    const marks = pieces(word).map((piece) => {
      if (at < want.length && arabicLetter(piece.base) && norm(piece.base) === want[at]) { at += 1; return true; }
      return false;
    });
    return { marks, complete: want.length > 0 && at === want.length };
  }
  function rootMarks(word, root) {
    return orderedRoot(word, root).marks;
  }
  // Families from the surahs: roots with two or more different words, biggest first.
  function families(surahs) {
    const by = new Map();
    for (const s of surahs || []) for (const a of s.ayahs || []) for (const w of a.words || []) {
      if (!w?.root || !w.arabic) continue;
      const f = by.get(w.root) || by.set(w.root, new Map()).get(w.root);
      if (!f.has(w.arabic)) f.set(w.arabic, { arabic: w.arabic, audioPath: w.audioPath });
    }
    return [...by.entries()].map(([root, m]) => ({ root, words: [...m.values()] })).filter((f) => f.words.length >= 2)
      .sort((a, b) => b.words.length - a.words.length || a.root.localeCompare(b.root));
  }
  const wordHTML = (w, root, cls = "") => {
    const marks = rootMarks(w.arabic, root);
    return `<span class="wt-word ${cls}" dir="rtl" lang="ar">${pieces(w.arabic).map((p, i) => `<span class="wt-l${marks[i] ? " is-root" : ""}">${p.text}</span>`).join("")}</span>`;
  };
  const seedHTML = (root) => `<span class="wt-seed-letters" dir="rtl" lang="ar">${[...String(root)].map((c) => `<b>${c}</b>`).join("")}</span>`;
  // Give each isolated radical its own fitted ink box; Arabic ascenders and
  // descenders cannot share a reliable fixed CSS baseline.
  const gameSeedHTML = (root) => {
    const letters = [...String(root)], step = 132 / letters.length;
    return `<span class="wt-seed-letters"><svg viewBox="0 0 132 55" aria-hidden="true">${letters.map((letter, index) => {
      const x = 132 - step * (index + .5);
      return `<text x="${x}" y="29" text-anchor="middle" direction="rtl" font-family="'Amiri Quran', serif" font-size="38" fill="currentColor" data-fit-box="${x},27.5,${step - 6},43,38">${letter}</text>`;
    }).join("")}</svg></span>`;
  };
  const item = (w) => ({ ...w, id: w.id ?? w.itemId ?? canonical(w.arabic), display: canonical(w.arabic), speak: w.speak ?? canonical(w.arabic), audioPath: w.audioPath });

  const hasFullVisibleRoot = (word, root) => orderedRoot(word, root).complete;

  const eligibleWord = (word, family, ctx) => {
    if (!word || typeof word.arabic !== "string" || !word.arabic.trim() || !family?.root) return null;
    const arabic = canonical(word.arabic.trim());
    if (![...arabic].some(arabicLetter) || !rootMarks(arabic, family.root).some(Boolean) || !hasFullVisibleRoot(arabic, family.root)) return null;
    const flags = [family, word];
    if (flags.some((entry) => entry.taught === false || entry.isTaught === false || entry.locked === true || entry.unlocked === false)) return null;
    if (ctx.completedWorldIds) {
      const completed = new Set(ctx.completedWorldIds);
      if (flags.some((entry) => (entry.prerequisiteWorldIds || []).some((id) => id !== ctx.worldId && !completed.has(id)))) return null;
    }
    return { ...word, id: word.id ?? word.itemId ?? arabic, arabic, audioPath: word.audioPath };
  };

  // ---------- Leaf Home ----------
  class LeafHome {
    constructor(ctx) {
      this.ctx = ctx; this.alive = true; this.noReplay = true; this.timers = []; this.roundToken = 0; this.dragResets = [];
      ctx.stage.innerHTML = `<div class="wt-game" role="group" aria-label="Leaf home"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
      const merged = new Map();
      for (const family of ctx.families || []) {
        if (!family?.root || !Array.isArray(family.words)) continue;
        const key = canonical(family.root), existing = merged.get(key);
        if (existing) {
          existing.words.push(...family.words);
          for (const flag of ["taught", "isTaught", "unlocked"]) if (family[flag] === false) existing[flag] = false;
          if (family.locked === true) existing.locked = true;
          existing.prerequisiteWorldIds = [...new Set([...(existing.prerequisiteWorldIds || []), ...(family.prerequisiteWorldIds || [])])];
        }
        else merged.set(key, { ...family, root: key, words: family.words.slice() });
      }
      const requestedBranches = ctx.branches == null ? 4 : Number(ctx.branches);
      const branchLimit = Number.isFinite(requestedBranches) ? Math.max(0, Math.floor(requestedBranches)) : 4;
      // Branches beyond this saved visit limit are still locked. Slice before
      // word eligibility so sparse early roots cannot pull later roots in.
      const sourceFamilies = [...merged.values()].slice(0, branchLimit);
      const allWords = sourceFamilies.flatMap((family) => family.words.map((word) => ({ family, word })));
      const blockedDisplays = new Set(allWords.filter(({ family, word }) => !eligibleWord(word, family, ctx)).map(({ word }) => canonical(word?.arabic).trim()));
      const rootsByDisplay = new Map();
      allWords.forEach(({ family, word }) => {
        const key = canonical(word?.arabic).trim();
        if (key) rootsByDisplay.set(key, (rootsByDisplay.get(key) || new Set()).add(family.root));
      });
      this.fams = sourceFamilies.map((family) => {
        const seen = new Set();
        const words = family.words.flatMap((word) => {
          const allowed = eligibleWord(word, family, ctx);
          if (!allowed) return [];
          const key = canonical(allowed.arabic).trim();
          if (blockedDisplays.has(key) || (rootsByDisplay.get(key)?.size || 0) > 1 || seen.has(key)) return [];
          seen.add(key);
          return [allowed];
        });
        return { ...family, id: family.id ?? family.root, words };
      }).filter((family) => family.words.length >= 2);
      this.targets = this.fams.flatMap((family) => family.words.map((word) => ({ family, word, item: item(word) })));
      this.skill = "root-family";
      this.visitLevel = 0;
      try { this.visitLevel = Math.max(0, Math.min(2, Number(ns.PracticeLearning?.level?.(ctx, this.targets.map((target) => target.item), this.skill)) || 0)); } catch {}
      const profileItem = this.targets[0]?.item;
      let requestedChoices = 2;
      try { requestedChoices = Number(ns.PracticeLearning?.profile?.(ctx, profileItem, this.skill)?.choiceCount) || 2; } catch {}
      this.visitChoiceCount = ctx.beginner ? 2 : Math.max(2, Math.min(3, requestedChoices, this.visitLevel > 0 ? 3 : 2));
      this.rounds = ctx.beginner ? 3 : 4;
      let plan;
      try { plan = ns.PracticeLearning?.plan?.(ctx, this.targets.map((target) => target.item), this.skill, this.rounds); } catch { plan = null; }
      const byId = new Map(this.targets.map((target) => [String(target.item.id), target]));
      const byDisplay = new Map(this.targets.map((target) => [canonical(target.item.display), target]));
      if (Array.isArray(plan)) {
        const seenTargets = new Set();
        this.queue = plan.flatMap((candidate) => {
          const target = typeof candidate === "string" ? byId.get(candidate) || byDisplay.get(canonical(candidate))
            : candidate && (candidate.id != null ? byId.get(String(candidate.id)) : byDisplay.get(canonical(candidate.display)));
          if (!target || seenTargets.has(String(target.item.id))) return [];
          seenTargets.add(String(target.item.id));
          return [target];
        }).slice(0, this.rounds);
      } else this.queue = this.targets.slice(0, this.rounds);
      this.rounds = this.queue.length;
      this.round = 0;
      if (this.fams.length < 2 || !this.queue.length) {
        this.destroy();
        Promise.resolve().then(() => { if (this.ctx.stage?.firstElementChild === this.root) this.ctx.cancel?.(); });
        return;
      }
      this.next();
    }
    current(token = this.roundToken, element) {
      if (!this.alive || token !== this.roundToken || this.ctx.stage?.firstElementChild !== this.root || this.root?.isConnected === false) return false;
      return !element || (typeof this.root.contains === "function" ? this.root.contains(element) : element.isConnected !== false);
    }
    later(fn, ms, token = this.roundToken) {
      const timer = setTimeout(() => {
        this.timers = this.timers.filter((entry) => entry !== timer);
        if (this.current(token)) fn();
      }, ms);
      this.timers.push(timer);
      return timer;
    }
    say(w, token = this.roundToken) {
      if (!this.current(token)) return false;
      let result;
      try { result = this.ctx.say?.(item(w)); } catch { return false; }
      if (result && typeof result.then === "function") return Promise.resolve(result).then((heard) => heard === true, () => false);
      return result === true;
    }
    art(name, fallback) {
      try {
        const svg = ns.FormPlayArt?.[name]?.();
        if (!svg) return fallback;
        const cls = name === "leaf" ? "wt-leaf-art" : "wt-branch-art";
        return svg.replace(/<svg\b([^>]*)>/, (_match, attrs) => {
          if (/\bclass\s*=/.test(attrs)) return `<svg${attrs.replace(/\bclass\s*=\s*(["'])(.*?)\1/, (_c, quote, value) => `class=${quote}${value} ${cls}${quote}`)}>`;
          return `<svg class="${cls}"${attrs}>`;
        });
      } catch { return fallback; }
    }
    next() {
      this.dragResets.forEach((reset) => reset()); this.dragResets = [];
      if (this.round >= this.rounds) {
        try { const result = this.ctx.sfx?.("cheer2"); if (result?.catch) result.catch(() => {}); } catch {}
        return this.later(() => { try { const result = this.ctx.done?.(); if (result?.catch) result.catch(() => {}); } catch {} }, 900);
      }
      const target = this.queue[this.round];
      this.roundToken += 1;
      const token = this.roundToken;
      this.home = target.family; this.leaf = target.word; this.leafItem = target.item; this.misses = 0; this.assisted = false; this.busy = false; this.feedbackBusy = false;
      this.answerReady = true; // The root letters are highlighted from the first prompt.
      const alternatives = shuffle(this.fams.filter((family) => canonical(family.root) !== canonical(this.home.root))).slice(0, this.visitChoiceCount - 1);
      if (alternatives.length < 1) { this.ctx.cancel?.(); this.destroy(); return; }
      const homes = [this.home, ...alternatives];
      this.homes = shuffle(homes);
      this.root.innerHTML = `<div class="wt-workshop"><div class="wt-leaf-prompt"><button type="button" class="wt-falling" aria-label="Hear the word">${this.art("leaf", LEAF)}<span class="wt-falling-word">${wordHTML(this.leaf, this.home.root)}</span></button></div>
        <div class="wt-homes">${this.homes.map((family, i) => `<button type="button" class="wt-home" data-i="${i}" aria-label="Branch ${family.root}">${this.art("branch", BRANCH)}${gameSeedHTML(family.root)}</button>`).join("")}</div></div>
        <div class="bk-progress" aria-hidden="true">${Array.from({ length: this.rounds }, (_, i) => `<i class="${i < this.round ? "is-done" : i === this.round ? "is-on" : ""}"></i>`).join("")}</div>`;
      const leaf = this.root.querySelector(".wt-falling");
      const buttons = [...this.root.querySelectorAll(".wt-home")];
      this.homeButtons = buttons; this.homeOffer = this.homes;
      leaf.onclick = () => { if (this.current(token, leaf) && !this.feedbackBusy && !this.busy) this.replayPrompt(token); };
      buttons.forEach((button) => button.addEventListener("click", () => this.pick(Number(button.dataset.i), button, token, this.homeOffer)));
      this.ctx.beginRound?.(this.leafItem, this.skill);
      this.wireLeafDrag(leaf, buttons, token, this.homeOffer);
      this.later(() => this.say(this.leaf, token), 300, token);
    }
    replayPrompt(token = this.roundToken) {
      if (!this.current(token) || this.feedbackBusy || this.busy) return false;
      this.assisted = true;
      const result = this.say(this.leaf, token);
      return result;
    }
    pick(i, btn, token = this.roundToken, offered = this.homeOffer) {
      if (!this.current(token, btn) || this.busy || this.feedbackBusy || !this.answerReady || offered !== this.homeOffer || i < 0 || i >= offered.length || this.homeButtons?.[i] !== btn) return false;
      const family = offered[i], right = family === this.home;
      const outcome = { item: this.leafItem, itemId: this.leafItem.id, activity: "LeafHome", skill: this.skill, correct: right,
        evidence: "supported_visible_matching", assisted: this.misses > 0 || this.assisted, selectedId: family.id ?? family.root,
        choiceIds: offered.map((home) => home.id ?? home.root), affectsStrength: false };
      try { const result = this.ctx.reportOutcome?.(outcome); if (result?.catch) result.catch(() => {}); } catch {}
      if (!right) {
        this.feedbackBusy = true;
        this.homeButtons?.forEach((button) => { button.disabled = true; button.setAttribute?.("aria-disabled", "true"); });
        const prompt = this.root.querySelector(".wt-falling");
        if (prompt) prompt.disabled = true;
        this.misses += 1;
        try { const result = this.ctx.sfx?.("softwrong"); if (result?.catch) result.catch(() => {}); } catch {}
        if (!this.ctx.reducedMotion?.()) btn.animate?.([{ transform: "rotate(0)" }, { transform: "rotate(-5deg)" }, { transform: "rotate(5deg)" }, { transform: "rotate(0)" }], { duration: 360 });
        if (this.misses >= 2) this.root.querySelectorAll(".wt-home").forEach((button, k) => button.classList.toggle("is-hint", offered[k] === this.home));
        this.later(() => {
          this.feedbackBusy = false;
          this.homeButtons?.forEach((button) => { button.disabled = false; button.removeAttribute?.("aria-disabled"); });
          const livePrompt = this.root.querySelector(".wt-falling");
          if (livePrompt) livePrompt.disabled = false;
        }, 360, token);
        return true;
      }
      this.busy = true;
      btn.classList.add("is-right");
      btn.innerHTML = `${btn.innerHTML || ""}<span class="wt-leaf-arrived" aria-hidden="true">${this.art("leaf", LEAF)}</span>`;
      this.root.querySelector(".wt-falling")?.classList.add("is-landed");
      for (const callback of [() => this.ctx.correct?.(), () => this.ctx.confettiAt?.(btn), () => this.ctx.pet?.cheer?.()]) {
        try { const result = callback(); if (result?.catch) result.catch(() => {}); } catch {}
      }
      this.later(() => this.say(this.leaf, token), 400, token);
      this.round += 1;
      this.later(() => this.next(), 1500, token);
      return true;
    }
    wireLeafDrag(leaf, buttons, token, offered) {
      if (!leaf || !ns.GardenPractice?.draggable) return;
      const reset = ns.GardenPractice.draggable(leaf, {
        enabled: () => this.current(token, leaf) && !this.busy && !this.feedbackBusy && !leaf.disabled && this.answerReady,
        onDragStart: () => leaf.classList.add("is-dragging"),
        onDragEnd: () => leaf.classList.remove("is-dragging"),
        drop: (x, y) => {
          if (!this.current(token, leaf) || offered !== this.homeOffer) return false;
          const exact = buttons.filter((button) => {
            const r = button.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
          });
          const candidates = exact.length ? exact : buttons.filter((button) => ns.GardenPractice.inside(button, x, y));
          if (!candidates.length) return false;
          const nearest = candidates.sort((a, b) => {
            const center = (button) => { const r = button.getBoundingClientRect(); return Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)); };
            return center(a) - center(b);
          })[0];
          return this.pick(Number(nearest.dataset.i), nearest, token, offered) === true;
        },
      });
      if (typeof reset === "function") this.dragResets.push(reset);
    }
    destroy() {
      this.alive = false;
      this.roundToken += 1;
      this.timers.forEach(clearTimeout); this.timers = [];
      this.dragResets.forEach((reset) => reset()); this.dragResets = [];
    }
  }

  const LEAF = `<svg class="wt-leaf-art" viewBox="0 0 120 70" aria-hidden="true"><path d="M6 35Q40 0 114 30Q80 70 6 35Z" fill="#b7e779" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M10 35Q60 30 112 31" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/></svg>`;
  const BRANCH = `<svg class="wt-branch-art" viewBox="0 0 120 60" aria-hidden="true"><path d="M4 52Q40 44 60 30Q80 16 116 12" fill="none" stroke="#4a3620" stroke-width="14" stroke-linecap="round"/><path d="M4 52Q40 44 60 30Q80 16 116 12" fill="none" stroke="#c69434" stroke-width="8" stroke-linecap="round"/><path d="M14 48Q36 43 52 34" fill="none" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/><path d="M60 30Q66 14 80 8Q74 24 60 30Z" fill="#7fce54" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M90 16Q100 2 114 0Q106 16 90 16Z" fill="#7fce54" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M64 26L76 12M94 14L108 4" stroke="#4e9677" stroke-width="1.6" stroke-linecap="round"/></svg>`;

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { LeafHome });
  ns.WordTree = { pieces, rootMarks, families, wordHTML, seedHTML, item, LEAF, KINDS: ["LeafHome"] };
})(window.MiftahGame || (window.MiftahGame = {}));
