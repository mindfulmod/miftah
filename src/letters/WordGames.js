// Word-stage games (v36–v37, 2026-10-05): the oldest children were still only
// playing the original three games per chapter. These bring the newer play to
// the shadda and word chapters, and lean on Mishary Alafasy's real word-by-
// word recitation wherever a word comes from the Quran (no device voice).
//
//   TwinCrown  (v36) shadda means the letter is said twice. A crowned friend
//              splits into twins and joins back up. Hear a word; is there a
//              crown in it or not? Real Quran words with and without shadda
//              take turns being the answer, so "always the crown" never works.
//   ListenFind (v37) Alafasy recites a word the child can decode; find it
//              among two or three written words. Listening-to-reading — the
//              real thing, and honest evidence for word reading.
//   WordGap    (v37) a decodable Quran word with one letter missing (with its
//              marks); hear it, pick the piece that fills the gap. Tatweels
//              keep the joined shape on both sides of the gap.
(function (ns) {
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const MARK = /[ً-ٰٟۖ-ۭ]/;
  const SHADDA = "ّ";
  // Letters that never join the letter after them.
  const NONJOIN = new Set(["ا", "أ", "إ", "آ", "ٱ", "د", "ذ", "ر", "ز", "و", "ؤ", "ة", "ء", "ى"]);
  const F = () => ns.LetterFriends;
  // A word as clusters: each letter with the marks that follow it.
  function clusters(word) {
    const out = [];
    for (const ch of String(word || "").normalize("NFC")) {
      if (MARK.test(ch) && out.length) out[out.length - 1] += ch;
      else out.push(ch);
    }
    return out;
  }
  const strip = (word) => String(word || "").replace(/[ً-ٰٟۖ-ۭ]/g, "");
  const speakable = (w) => (w && typeof w === "object" ? w : { id: w, display: w, speak: w });

  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.timers = [];
      ctx.stage.innerHTML = `<div class="wd ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
    }
    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); }
    dots(n, at) { return `<div class="pz-progress" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < at ? "is-done" : i === at ? "is-on" : ""}"></i>`).join("")}</div>`; }
    wobble(el) { if (!this.ctx.reducedMotion?.()) el?.animate?.([{ rotate: "0deg" }, { rotate: "-6deg" }, { rotate: "6deg" }, { rotate: "0deg" }], { duration: 360 }); }
    say(it) {
      let r; try { r = this.ctx.say?.(speakable(it)); } catch { r = false; }
      if (r?.then) r.then((h) => { if (h === false) this.heard = false; }, () => {});
      return r;
    }
    report(target, chosen, offered, skill) {
      // Compare in one Unicode form: clusters() normalizes to NFC, which
      // reorders shadda + vowel (and composes آ), so a raw compare made the
      // right piece "wrong" for 9 of 24 words.
      const correct = String(chosen).normalize("NFC") === String(target.display).normalize("NFC");
      const independent = !this.missed && this.heard !== false;
      this.ctx.reportOutcome?.({ item: target, itemId: target.id || target.display, activity: this.constructor.name, skill, correct,
        evidence: independent ? "independent_listening" : "supported_visible_matching", assisted: !!this.missed,
        selectedId: chosen, choiceIds: offered, affectsStrength: true });
      return correct;
    }
    replayPrompt() { if (this.target) this.say(this.target); }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800); }
    destroy() { this.alive = false; this.timers.forEach(clearTimeout); }
  }

  // ---------- Twin Crown (v36) ----------
  const CROWN = `<svg viewBox="0 0 48 32" width="36" height="24" aria-hidden="true"><path d="M4 28V10L14 18L24 4L34 18L44 10V28Z" fill="#f3c955" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><circle cx="24" cy="16" r="3" fill="#ee806f"/></svg>`;

  class TwinCrown extends Base {
    constructor(ctx) {
      super(ctx, "wd-crown", "Twin crown");
      const pool = [...(ctx.items || []), ...(ctx.words || [])].filter((w) => w?.display && strip(w.display).length >= 2);
      const withS = shuffle(pool.filter((w) => w.display.includes(SHADDA)));
      const without = shuffle(pool.filter((w) => !w.display.includes(SHADDA) && w.audioPath && this.twin(w.display)));
      // Alternate: a crowned word, then an uncrowned one, so both are answers.
      this.queue = [];
      for (let i = 0; i < 4; i += 1) { const w = (i % 2 ? without : withS)[Math.floor(i / 2)] || withS[i] || without[i]; if (w && !this.queue.includes(w)) this.queue.push(w); }
      this.round = 0;
      if (!withS.length) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    // The other card: the same word with the crown taken off, or put on the
    // last letter that can carry it.
    twin(word) {
      if (word.includes(SHADDA)) return word.replace(SHADDA, "");
      // Put a crown on the last letter that carries a short vowel (never an
      // alif-like letter), so the made-up twin still looks like Arabic.
      const cl = clusters(word);
      const NOCROWN = new Set(["ا", "أ", "إ", "آ", "ٱ", "ى", "ة", "ء"]);
      let k = -1;
      for (let j = cl.length - 1; j >= 0; j -= 1) if (!NOCROWN.has(cl[j][0]) && /[َُِ]/.test(cl[j])) { k = j; break; }
      if (k < 0) return null; // nowhere a crown could sit: not a question
      cl[k] = cl[k][0] + SHADDA + cl[k].slice(1);
      // Canonical order (NFC), the same as the Quran data, so equal words compare equal.
      return cl.join("").normalize("NFC");
    }
    next() {
      if (this.round >= this.queue.length) return this.finish();
      const t = this.queue[this.round];
      this.target = t; this.missed = false; this.heard = true; this.busy = false;
      const other = this.twin(t.display);
      this.offered = shuffle([t.display, other]);
      this.root.innerHTML = `
        <div class="wd-twins" aria-hidden="true"></div>
        <div class="wd-cards">${this.offered.map((w, i) => `<button type="button" class="wd-card${w.includes(SHADDA) ? " has-crown" : ""}" data-i="${i}" aria-label="${w}">${w.includes(SHADDA) ? `<span class="wd-crown-badge">${CROWN}</span>` : ""}<span class="wd-word" dir="rtl" lang="ar">${w}</span></button>`).join("")}</div>
        ${this.dots(this.queue.length, this.round)}`;
      this.root.querySelectorAll(".wd-card").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      this.ctx.beginRound?.(t, "syllable");
      this.later(() => this.say(t), 350);
    }
    pick(i, btn) {
      if (this.busy) return;
      const chosen = this.offered[i];
      if (!this.report(this.target, chosen, this.offered, "syllable")) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".wd-card").forEach((b, k) => b.classList.toggle("is-hint", this.offered[k] === this.target.display));
        this.later(() => this.say(this.target), 600);
        return;
      }
      this.busy = true;
      btn.classList.add("is-right");
      // The twins: the doubled letter's friend appears twice, then the two
      // become one under the crown.
      const doubled = clusters(this.target.display).find((c) => c.includes(SHADDA));
      const base = doubled ? doubled[0] : null;
      if (base && F()?.FRIENDS?.[base] && ns.VowelGames) {
        const twins = this.root.querySelector(".wd-twins");
        twins.innerHTML = `<span class="wd-twin">${F().art(base, { size: 90 })}</span><span class="wd-twin">${F().art(base, { size: 90 })}</span><span class="wd-one">${ns.VowelGames.wearing(base, SHADDA, 110)}</span>`;
        twins.classList.add("is-on");
      }
      this.ctx.correct?.(); this.ctx.confettiAt?.(btn); this.ctx.pet?.cheer?.();
      this.later(() => this.say(this.target), 900);
      this.round += 1;
      this.later(() => this.next(), 3200);
    }
  }

  // ---------- Listen & Find (v37) ----------
  class ListenFind extends Base {
    constructor(ctx) {
      super(ctx, "wd-listen", "Listen and find");
      const recited = (w) => w?.display && w.audioPath;
      this.pool = [...new Map([...(ctx.items || []), ...(ctx.words || [])].filter(recited).map((w) => [w.display, w])).values()];
      const firsts = (ctx.items || []).filter(recited);
      this.queue = [...new Set([...shuffle(firsts), ...shuffle(this.pool)])].slice(0, ctx.beginner ? 3 : 4);
      this.round = 0;
      if (this.pool.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.queue.length) return this.finish();
      const t = this.queue[this.round];
      this.target = t; this.missed = false; this.heard = true; this.busy = false;
      // Distractors look alike: similar length, different letters.
      const len = strip(t.display).length;
      const others = shuffle(this.pool.filter((w) => w.display !== t.display && strip(w.display) !== strip(t.display)))
        .sort((a, b) => Math.abs(strip(a.display).length - len) - Math.abs(strip(b.display).length - len));
      const n = this.ctx.beginner ? 2 : 3;
      this.offered = shuffle([t.display, ...others.slice(0, n - 1).map((w) => w.display)]);
      this.root.innerHTML = `
        <button type="button" class="wd-ear" aria-label="Hear the word again">${ns.LettersArt?.icon?.("speaker", 44) || "♪"}<span class="wd-ear-note" aria-hidden="true">${F()?.art("ه", { size: 56 }) || ""}</span></button>
        <div class="wd-cards">${this.offered.map((w, i) => `<button type="button" class="wd-card" data-i="${i}" aria-label="${w}"><span class="wd-word" dir="rtl" lang="ar">${w}</span></button>`).join("")}</div>
        ${this.dots(this.queue.length, this.round)}`;
      this.root.querySelector(".wd-ear").onclick = () => this.say(t);
      this.root.querySelectorAll(".wd-card").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      this.ctx.beginRound?.(t, "word-reading");
      this.later(() => this.say(t), 350);
    }
    pick(i, btn) {
      if (this.busy) return;
      const chosen = this.offered[i];
      if (!this.report(this.target, chosen, this.offered, "word-reading")) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        // The chosen word is recited too, so the difference is heard.
        const w = this.pool.find((x) => x.display === chosen);
        if (w) this.say(w);
        this.later(() => this.say(this.target), 1600);
        this.root.querySelectorAll(".wd-card").forEach((b, k) => b.classList.toggle("is-hint", this.offered[k] === this.target.display));
        return;
      }
      this.busy = true;
      btn.classList.add("is-right");
      this.ctx.correct?.(); this.ctx.confettiAt?.(btn); this.ctx.pet?.cheer?.();
      this.later(() => this.say(this.target), 600);
      this.round += 1;
      this.later(() => this.next(), 2800);
    }
  }

  // ---------- Word Gap (v37) ----------
  class WordGap extends Base {
    constructor(ctx) {
      super(ctx, "wd-gap", "Word gap");
      const ok = (w) => w?.display && w.audioPath && clusters(w.display).length >= 2;
      this.pool = [...new Map([...(ctx.items || []), ...(ctx.words || [])].filter(ok).map((w) => [w.display, w])).values()];
      this.letters = [...new Set(this.pool.flatMap((w) => clusters(w.display).map((c) => c[0])))].filter((c) => F()?.FRIENDS?.[c]);
      const firsts = (ctx.items || []).filter(ok);
      this.queue = [...new Set([...shuffle(firsts), ...shuffle(this.pool)])].slice(0, 4);
      this.round = 0;
      if (!this.pool.length || this.letters.length < 3) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.queue.length) return this.finish();
      const t = this.queue[this.round];
      this.target = t; this.missed = false; this.heard = true; this.busy = false;
      const cl = clusters(t.display);
      // The gap: a letter that has a friend (so the piece is a known letter).
      const spots = cl.map((c, k) => k).filter((k) => F()?.FRIENDS?.[cl[k][0]]);
      const k = spots[Math.floor(Math.random() * spots.length)] ?? 0;
      this.gapIndex = k;
      const piece = cl[k], marks = piece.slice(1);
      const prefix = cl.slice(0, k).join(""), suffix = cl.slice(k + 1).join("");
      // Tatweels keep the joins: after a prefix whose last letter reaches
      // forward, and before a suffix when the missing letter would reach it.
      const pre = prefix && !NONJOIN.has(cl[k - 1][0]) ? `${prefix}ـ` : prefix;
      const suf = suffix && !NONJOIN.has(piece[0]) ? `ـ${suffix}` : suffix;
      const n = this.ctx.beginner ? 2 : 3;
      // Distractors are real letters that can carry this piece's marks (never
      // an alif with a vowel on it).
      const others = shuffle(this.letters.filter((c) => c !== piece[0] && !["ا", "أ", "إ", "آ", "ٱ", "ى", "ة"].includes(c))).slice(0, n - 1).map((c) => c + marks);
      this.offered = shuffle([piece, ...others]);
      this.root.innerHTML = `
        <button type="button" class="wd-ear" aria-label="Hear the word again">${ns.LettersArt?.icon?.("speaker", 44) || "♪"}</button>
        <div class="wd-gapword" dir="rtl" lang="ar"><span>${pre}</span><span class="wd-hole" aria-label="The missing letter"></span><span>${suf}</span></div>
        <div class="wd-pieces">${this.offered.map((p, i) => `<button type="button" class="wd-piece" data-i="${i}" aria-label="${p}"><span dir="rtl" lang="ar">${p}</span></button>`).join("")}</div>
        ${this.dots(this.queue.length, this.round)}`;
      this.root.querySelector(".wd-ear").onclick = () => this.say(t);
      this.root.querySelectorAll(".wd-piece").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      this.ctx.beginRound?.(t, "word-reading");
      this.later(() => this.say(t), 350);
    }
    pick(i, btn) {
      if (this.busy) return;
      const chosen = this.offered[i];
      const piece = clusters(this.target.display)[this.gapIndex];
      const word = clusters(this.target.display).map((c, k) => (k === this.gapIndex ? chosen : c)).join("");
      if (!this.report(this.target, word, this.offered.map((p) => clusters(this.target.display).map((c, k) => (k === this.gapIndex ? p : c)).join("")), "word-reading")) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".wd-piece").forEach((b, k) => b.classList.toggle("is-hint", this.offered[k] === piece));
        this.later(() => this.say(this.target), 500);
        return;
      }
      this.busy = true;
      const gw = this.root.querySelector(".wd-gapword");
      gw.innerHTML = `<span class="wd-whole">${this.target.display}</span>`;
      gw.classList.add("is-whole");
      this.ctx.correct?.(); this.ctx.confettiAt?.(gw); this.ctx.pet?.cheer?.();
      this.later(() => this.say(this.target), 500);
      this.round += 1;
      this.later(() => this.next(), 2800);
    }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { TwinCrown, ListenFind, WordGap });
  ns.WordGames = { KINDS: ["TwinCrown", "ListenFind", "WordGap"], clusters, strip, NONJOIN };
})(window.MiftahGame || (window.MiftahGame = {}));
