"use strict";

/*
 * strength.js — the ONE word-strength store (spec: specs/01-trainer-v2.md).
 *
 * Every surface that tests a Quranic word — the trainer's ayah flow, its
 * review cards, the extra-practice page, follow mode, and the Star
 * Navigator's encounters — reads and writes THIS store. FSRS (fsrs.js) does
 * the scheduling; this module owns the entries, the migration from the old
 * split systems, and the source-weighting rules.
 *
 * Storage: quran-trainer:strength  →  { version, migratedAt, words: {id: entry} }
 * Entry:   { id, arabic, english, display, translit, root, audioPath,
 *            surahs: [n…], miss, correct, fsrs: <FSRS card>, updatedAt }
 * Word id: `${arabic}|||${gloss}` — identical to the trainer's stats ids, so
 * the same word aggregates across surahs and across the old stores.
 *
 * Source weighting (asymmetric honesty, locked 2026-07-16):
 *   • a MISS is a full FSRS lapse no matter where it happened — failure under
 *     game pressure is real evidence of weakness;
 *   • a HIT from calm study ("trainer", "review", "follow") is a full rep;
 *   • a HIT under game pressure ("game") advances stability only partway
 *     (GAME_HIT_WEIGHT) — fast-twitch recognition inflates less than recall.
 *     Erring toward over-review is the safe direction for a retention engine.
 *
 * The old per-surah stores (stats:surah-N, review:surah-N) are read once at
 * migration and left untouched — Memory Forge still reads them, and keeping
 * them costs nothing.
 */

const WordStrength = (() => {
  const KEY = "quran-trainer:strength";
  const DAY = 86400000;
  const GAME_HIT_WEIGHT = 0.6; // fraction of the stability gain a game hit keeps
  const FULL_WEIGHT_SOURCES = new Set(["trainer", "review", "follow"]);

  let store = null; // lazy singleton

  const wordId = (arabic, gloss) => `${arabic}|||${gloss}`;
  const answerFor = (w) => w.answer || w.english;

  function blank() {
    return { version: 1, migratedAt: null, words: {} };
  }

  function load() {
    if (store) return store;
    try {
      const raw = localStorage.getItem(KEY);
      const data = raw ? JSON.parse(raw) : null;
      store = data && data.words && typeof data.words === "object" ? data : blank();
    } catch {
      store = blank();
    }
    if (!store.migratedAt) migrate();
    return store;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch {
      /* storage unavailable — strength just won't persist */
    }
  }

  // ---------- entries ----------

  function get(id) {
    return load().words[id] || null;
  }

  // Find-or-create the entry for a word object ({arabic, english/answer, …}).
  // Refreshes the display fields every time so data rebuilds propagate.
  function ensure(word, surahNumber) {
    const s = load();
    const gloss = answerFor(word);
    const id = wordId(word.arabic, gloss);
    let e = s.words[id];
    if (!e) {
      e = s.words[id] = {
        id,
        arabic: word.arabic,
        english: gloss,
        display: word.display || gloss,
        translit: word.translit || "",
        root: word.root || "",
        audioPath: word.audioPath || "",
        surahs: [],
        miss: 0,
        correct: 0,
        fsrs: FSRS.newCard(),
        updatedAt: Date.now(),
      };
    } else {
      e.arabic = word.arabic;
      e.english = gloss;
      if (word.display) e.display = word.display;
      if (word.translit) e.translit = word.translit;
      if (word.root) e.root = word.root;
      if (word.audioPath) e.audioPath = word.audioPath;
    }
    if (
      Number.isInteger(surahNumber) &&
      surahNumber > 0 &&
      !e.surahs.includes(surahNumber)
    ) {
      e.surahs.push(surahNumber);
    }
    return e;
  }

  // ---------- the single write path ----------

  // Grade a word: grade 1 = forgot, 3 = recalled (2/4 pass through for a
  // future Hard/Easy UI). `source` picks the weighting; `now` lets callers
  // (the practice page's clock simulator) move time.
  function review(word, grade, { source = "trainer", surah = null, now = Date.now() } = {}) {
    const e = typeof word === "string" ? get(word) : ensure(word, surah);
    if (!e) return null;

    const before = e.fsrs && typeof e.fsrs.stability === "number" ? e.fsrs : null;
    const graded = FSRS.repeat(e.fsrs || FSRS.newCard(), grade, now);

    if (grade >= 2 && before && !FULL_WEIGHT_SOURCES.has(source)) {
      // Partial-credit hit: keep only GAME_HIT_WEIGHT of the stability gain,
      // then reschedule from the damped stability. Misses are never damped.
      const damped =
        before.stability + (graded.stability - before.stability) * GAME_HIT_WEIGHT;
      graded.stability = Math.max(damped, 0.01);
      graded.due = now + FSRS.intervalDays(graded.stability) * DAY;
    }

    e.fsrs = graded;
    if (grade === 1) e.miss += 1;
    else e.correct += 1;
    e.updatedAt = now;
    tally(source, now);
    save();
    return e;
  }

  // ---------- daily review tallies ----------
  // Lightweight per-day, per-source counters — they exist so the navigator's
  // logbook can show the voluntary-review-share proof metric ("this week,
  // 32% of your reviews happened at sea"). Pruned to the last 14 days.
  function tally(source, now) {
    const s = load();
    if (!s.daily) s.daily = {};
    const d = new Date(now);
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const rec = s.daily[day] || {};
    rec[source] = (rec[source] || 0) + 1;
    s.daily[day] = rec;
    const days = Object.keys(s.daily).sort();
    while (days.length > 14) delete s.daily[days.shift()];
  }

  // Fraction of the last `days` days' reviews that came from `source`
  // (0..1), plus the raw counts for honest display.
  function reviewShare(source = "game", days = 7, now = Date.now()) {
    const s = load();
    let from = 0;
    let total = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(now - i * DAY);
      const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const rec = (s.daily || {})[day];
      if (!rec) continue;
      for (const [src, n] of Object.entries(rec)) {
        total += n;
        if (src === source) from += n;
      }
    }
    return { share: total ? from / total : 0, from, total };
  }

  // ---------- queries ----------

  function entries() {
    return Object.values(load().words);
  }

  const inSurah = (e, surah) => !surah || (e.surahs || []).includes(surah);

  // Words due for review, most urgent first: overdue-ness beats everything,
  // then the shakier memory leads. `surahFirst` floats one surah's words to
  // the front without dropping the rest (the trainer warm-up wants this).
  function dueWords({ now = Date.now(), limit = Infinity, surah = null, surahFirst = null } = {}) {
    const due = entries()
      .filter((e) => e.fsrs && e.fsrs.reps > 0 && e.fsrs.due <= now)
      .filter((e) => inSurah(e, surah))
      .sort((a, b) => {
        if (surahFirst) {
          const af = inSurah(a, surahFirst) ? 0 : 1;
          const bf = inSurah(b, surahFirst) ? 0 : 1;
          if (af !== bf) return af - bf;
        }
        return a.fsrs.due - b.fsrs.due || (a.fsrs.stability || 0) - (b.fsrs.stability || 0);
      });
    return due.slice(0, limit === Infinity ? due.length : limit);
  }

  function dueCount(opts = {}) {
    return dueWords(opts).length;
  }

  // Strong words — the navigator's ~30% easy-hit seasoning.
  function strongWords({ now = Date.now(), limit = Infinity, minDays = 4 } = {}) {
    const strong = entries()
      .filter(
        (e) =>
          e.fsrs &&
          e.fsrs.reps > 0 &&
          (e.fsrs.stability || 0) >= minDays &&
          e.fsrs.due > now
      )
      .sort((a, b) => (b.fsrs.stability || 0) - (a.fsrs.stability || 0));
    return strong.slice(0, limit === Infinity ? strong.length : limit);
  }

  function retrievabilityOf(e, now = Date.now()) {
    if (!e || !e.fsrs || !e.fsrs.lastReview) return 0;
    return FSRS.retrievability((now - e.fsrs.lastReview) / DAY, e.fsrs.stability);
  }

  // ---------- migration from the split-brain era ----------
  //
  // Old world: per-surah exposure stats (every word ever answered) and
  // per-surah FSRS review decks (missed words only, post-completion). We fold
  // both in once. Words that only ever had exposure counters get a SEEDED
  // schedule rather than an honest one — stability grows with their correct
  // count and the due date is jittered forward — so a learner with hundreds
  // of seen words wakes up to a staggered queue, not a 500-card wall.
  function migrate() {
    const s = store;
    const statKeys = [];
    const deckKeys = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (/^quran-trainer:stats:surah-\d+$/.test(k)) statKeys.push(k);
        else if (/^quran-trainer:review:surah-\d+$/.test(k)) deckKeys.push(k);
      }
    } catch {
      s.migratedAt = Date.now();
      return;
    }

    const now = Date.now();

    for (const key of statKeys) {
      const surah = Number(key.match(/surah-(\d+)/)[1]);
      let stats;
      try {
        stats = JSON.parse(localStorage.getItem(key) || "{}");
      } catch {
        continue;
      }
      for (const [id, st] of Object.entries(stats)) {
        if (!st || !st.arabic) continue;
        const e = ensure(
          {
            arabic: st.arabic,
            english: st.english,
            display: st.display,
            translit: st.translit,
            root: st.root,
            audioPath: st.audioPath,
          },
          surah
        );
        e.miss += st.miss || 0;
        e.correct += st.correct || 0;
      }
    }

    // Seed schedules from exposure counters (see note above).
    for (const e of Object.values(s.words)) {
      if (e.fsrs && e.fsrs.reps > 0) continue;
      const exposures = e.miss + e.correct;
      if (!exposures) continue;
      const shaky = e.miss > 0 && e.miss >= e.correct;
      const stability = shaky
        ? 0.5
        : Math.min(Math.pow(2, Math.max(e.correct - 1, 0)), 8);
      e.fsrs = Object.assign(FSRS.newCard(), {
        stability,
        difficulty: shaky ? 7 : 5,
        reps: exposures,
        lapses: e.miss,
        state: "review",
        lastReview: now,
        due: now + stability * DAY * (0.5 + Math.random() * 0.5),
      });
      if (shaky) e.fsrs.due = now; // genuinely weak words ARE due
    }

    // Real FSRS state from the old review decks wins over seeded state.
    for (const key of deckKeys) {
      const surah = Number(key.match(/surah-(\d+)/)[1]);
      let saved;
      try {
        saved = JSON.parse(localStorage.getItem(key) || "null");
      } catch {
        continue;
      }
      for (const card of (saved && saved.deck) || []) {
        if (!card || typeof card.stability !== "number") continue;
        const e = ensure(
          { arabic: card.arabic, english: card.english, display: card.display, translit: card.translit },
          surah
        );
        const seeded = !e.fsrs || !e.fsrs.lastReview || e.fsrs.lastReview >= now;
        if (seeded || (card.lastReview || 0) > (e.fsrs.lastReview || 0)) {
          e.fsrs = {
            stability: card.stability,
            difficulty: card.difficulty,
            due: card.due,
            lastReview: card.lastReview ?? null,
            reps: card.reps || 0,
            lapses: card.lapses || 0,
            state: card.state || "review",
          };
        }
      }
    }

    s.migratedAt = now;
    save();
  }

  return {
    wordId,
    get,
    ensure,
    review,
    entries,
    dueWords,
    dueCount,
    strongWords,
    retrievabilityOf,
    reviewShare,
    _save: save,
  };
})();

if (typeof window !== "undefined") window.WordStrength = WordStrength;
