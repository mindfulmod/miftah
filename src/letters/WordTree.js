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

  function pieces(word) {
    const cl = [];
    for (const ch of String(word)) { if ((MARK.test(ch) || ch === TATWEEL) && cl.length) cl[cl.length - 1] += ch; else cl.push(ch); }
    return cl.map((c, i) => {
      const base = c[0], prev = cl[i - 1]?.[0], next = cl[i + 1];
      const joinPrev = !!prev && !RIGHT_ONLY.has(prev), joinNext = !!next && !RIGHT_ONLY.has(base);
      return { base, text: (joinPrev ? ZWJ : "") + c + (joinNext ? ZWJ : "") };
    });
  }
  // Which letters of a word belong to its root (each root letter used once,
  // first match wins — enough to show the family resemblance).
  function rootMarks(word, root) {
    const want = [...String(root)].map(norm);
    const ps = pieces(word);
    return ps.map((p) => { const k = want.indexOf(norm(p.base)); if (k < 0) return false; want.splice(k, 1); return true; });
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
  const item = (w) => ({ id: w.arabic, display: w.arabic, speak: w.arabic, audioPath: w.audioPath });

  // ---------- Leaf Home ----------
  class LeafHome {
    constructor(ctx) {
      this.ctx = ctx; this.alive = true; this.timers = [];
      ctx.stage.innerHTML = `<div class="wt-game" role="group" aria-label="Leaf home"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
      this.fams = (ctx.families || []).slice(0, Math.max(2, ctx.branches || 4));
      this.rounds = ctx.beginner ? 3 : 4; this.round = 0;
      if (this.fams.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); return t; }
    say(w) { try { return this.ctx.say?.(item(w)); } catch { return false; } }
    next() {
      if (this.round >= this.rounds) { this.ctx.sfx?.("cheer2"); return this.later(() => this.ctx.done?.(), 900); }
      const homes = shuffle(this.fams).slice(0, this.ctx.beginner ? 2 : 3);
      this.home = homes[0]; this.homes = shuffle(homes); this.leaf = shuffle(this.home.words)[0]; this.misses = 0; this.busy = false;
      this.root.innerHTML = `<button type="button" class="wt-falling" aria-label="Hear the word">${LEAF}<span class="wt-falling-word">${wordHTML(this.leaf, this.home.root)}</span></button>
        <div class="wt-homes">${this.homes.map((f, i) => `<button type="button" class="wt-home" data-i="${i}" aria-label="Branch ${f.root}">${BRANCH}${seedHTML(f.root)}</button>`).join("")}</div>
        <div class="bk-progress" aria-hidden="true">${Array.from({ length: this.rounds }, (_, i) => `<i class="${i < this.round ? "is-done" : i === this.round ? "is-on" : ""}"></i>`).join("")}</div>`;
      // The leaf's root letters are hidden until it finds home.
      this.root.querySelector(".wt-falling").classList.add("is-plain");
      this.root.querySelector(".wt-falling").onclick = () => this.say(this.leaf);
      this.root.querySelectorAll(".wt-home").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      this.later(() => this.say(this.leaf), 300);
    }
    replayPrompt() { if (this.leaf) this.say(this.leaf); }
    pick(i, btn) {
      if (this.busy) return;
      const f = this.homes[i], right = f === this.home;
      this.ctx.reportOutcome?.({ item: item(this.leaf), itemId: this.leaf.arabic, activity: "LeafHome", skill: "root-family", correct: right,
        evidence: "supported_visible_matching", assisted: this.misses > 0, selectedId: f.root, choiceIds: this.homes.map((h) => h.root), affectsStrength: false });
      if (!right) {
        this.misses += 1; this.ctx.sfx?.("softwrong");
        if (!this.ctx.reducedMotion?.()) btn.animate?.([{ transform: "rotate(0)" }, { transform: "rotate(-5deg)" }, { transform: "rotate(5deg)" }, { transform: "rotate(0)" }], { duration: 360 });
        // A miss shows the family resemblance: the leaf's root letters light up.
        this.root.querySelector(".wt-falling").classList.remove("is-plain");
        if (this.misses >= 2) this.root.querySelectorAll(".wt-home").forEach((b, k) => b.classList.toggle("is-hint", this.homes[k] === this.home));
        return;
      }
      this.busy = true;
      this.root.querySelector(".wt-falling").classList.remove("is-plain");
      btn.classList.add("is-right");
      this.ctx.correct?.(); this.ctx.confettiAt?.(btn); this.ctx.pet?.cheer?.();
      this.later(() => this.say(this.leaf), 400);
      this.round += 1;
      this.later(() => this.next(), 2400);
    }
    destroy() { this.alive = false; this.timers.forEach(clearTimeout); }
  }

  const LEAF = `<svg class="wt-leaf-art" viewBox="0 0 120 70" aria-hidden="true"><path d="M6 35Q40 0 114 30Q80 70 6 35Z" fill="#b7e779" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M10 35Q60 30 112 31" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/></svg>`;
  const BRANCH = `<svg class="wt-branch-art" viewBox="0 0 120 60" aria-hidden="true"><path d="M4 52Q40 44 60 30Q80 16 116 12" fill="none" stroke="#4a3620" stroke-width="14" stroke-linecap="round"/><path d="M4 52Q40 44 60 30Q80 16 116 12" fill="none" stroke="#c69434" stroke-width="8" stroke-linecap="round"/><path d="M14 48Q36 43 52 34" fill="none" stroke="#ffe49a" stroke-width="2.4" stroke-linecap="round"/><path d="M60 30Q66 14 80 8Q74 24 60 30Z" fill="#7fce54" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M90 16Q100 2 114 0Q106 16 90 16Z" fill="#7fce54" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M64 26L76 12M94 14L108 4" stroke="#4e9677" stroke-width="1.6" stroke-linecap="round"/></svg>`;

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { LeafHome });
  ns.WordTree = { pieces, rootMarks, families, wordHTML, seedHTML, item, LEAF, KINDS: ["LeafHome"] };
})(window.MiftahGame || (window.MiftahGame = {}));
