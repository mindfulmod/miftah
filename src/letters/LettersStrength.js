// The Letter Garden's quiet strength model (spec: specs/02-letter-garden-v2.md).
//
// Every answer in every mini-game feeds it — right/wrong and how fast the
// right answer came — and it never surfaces as a gate, a test, or a score the
// child can see. Its one job: know which letters/skills are shaky so the
// daily world can quietly dress the weakest ones up as a fresh bouquet.
//
// Keyed by item id (the same ids worlds use: "ب", "بَ", a decode word…), so
// the same letter aggregates across worlds and games.
//
// Storage: quran-trainer:letters:strength → { [id]: {r, w, streak, fast, slow, last} }
//   r/w     lifetime right/wrong counts
//   streak  current consecutive-right run (a miss resets it)
//   fast    right answers that arrived within FAST_MS of the prompt
//   slow    right answers that didn't (hesitation is a softer weakness signal)
//   last    ms epoch of the latest answer
(function (ns) {
  const KEY = "quran-trainer:letters:strength";
  const FAST_MS = 3500;
  const DAY = 86400000;

  class LettersStrength {
    constructor() {
      try {
        const raw = localStorage.getItem(KEY);
        const data = raw ? JSON.parse(raw) : {};
        this.map = data && typeof data === "object" ? data : {};
      } catch {
        this.map = {};
      }
    }

    save() {
      try {
        localStorage.setItem(KEY, JSON.stringify(this.map));
      } catch {}
    }

    record(id, correct, elapsedMs) {
      if (!id) return;
      const e = this.map[id] || { r: 0, w: 0, streak: 0, fast: 0, slow: 0, last: 0 };
      if (correct) {
        e.r += 1;
        e.streak += 1;
        if (Number.isFinite(elapsedMs) && elapsedMs <= FAST_MS) e.fast += 1;
        else e.slow += 1;
      } else {
        e.w += 1;
        e.streak = 0;
      }
      e.last = Date.now();
      this.map[id] = e;
      this.save();
    }

    // Weakness score — higher = needs more love. Three honest signals:
    //   • Laplace-smoothed error rate (never-seen items land mid-scale, so
    //     new material still gets its turn in the bouquet);
    //   • hesitation — right answers that came slowly count a little;
    //   • staleness — days untouched drift an item back toward "due";
    //   • a hot streak pushes an item away (it's fine, leave it alone).
    weakness(id) {
      const e = this.map[id];
      if (!e) return 1.5; // unseen: worth a look, not an emergency
      const errorRate = (e.w + 1) / (e.r + e.w + 2); // smoothed 0..1
      const hesitancy = e.r > 0 ? e.slow / (e.fast + e.slow || 1) : 0;
      const staleDays = Math.min((Date.now() - e.last) / DAY, 14);
      return errorRate * 3 + hesitancy * 0.6 + staleDays * 0.07 - Math.min(e.streak, 4) * 0.3;
    }

    // Mastery of a single skill, 0..1 — the friendly inverse of weakness,
    // driving the mastery garden's growth. A never-seen skill is 0 (a bare
    // seed); a hot, fast, well-remembered one approaches 1 (full bloom).
    mastery(id) {
      const e = this.map[id];
      if (!e) return 0;
      const seen = e.r + e.w;
      if (!seen) return 0;
      const accuracy = e.r / seen; // 0..1
      const fastShare = e.r > 0 ? e.fast / (e.fast + e.slow || 1) : 0;
      const streakBoost = Math.min(e.streak, 5) / 5;
      // Weight accuracy most, then confidence (speed + streak), gated by a
      // little exposure so one lucky tap doesn't bloom a flower.
      const exposure = Math.min(seen / 4, 1);
      return Math.max(0, Math.min(1, (accuracy * 0.6 + fastShare * 0.2 + streakBoost * 0.2) * exposure));
    }

    // Average mastery across a world's items, 0..1 — one number for how well
    // the child holds a whole chapter, for the map's mastery plants.
    worldMastery(items) {
      if (!items || !items.length) return 0;
      const sum = items.reduce((a, item) => a + this.mastery(item.id), 0);
      return sum / items.length;
    }

    // The daily bouquet: the n weakest of the given items (stable ids),
    // shuffled so the child never senses a ranking.
    weakest(items, n) {
      const scored = items
        .map((item) => ({ item, score: this.weakness(item.id) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, n)
        .map((s) => s.item);
      for (let i = scored.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [scored[i], scored[j]] = [scored[j], scored[i]];
      }
      return scored;
    }
  }

  ns.LettersStrength = new LettersStrength();
})(window.MiftahGame || (window.MiftahGame = {}));
