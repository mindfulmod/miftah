// In-game trainer engine — a faithful port of the standalone trainer's
// learning logic (app.js) driving the Courtyard Codex overlay. It shares the
// exact same quran-trainer:* localStorage keys as the standalone pages, so
// progress made in either place is the same progress. Oasis rewards are
// wired only through this engine (onAyahComplete), never from the
// standalone pages.
(function (ns) {
  const MANIFEST_FILE = "data/surahs.json";
  const JUZ_FILE = "data/juz.json";
  const BADGES_KEY = "quran-trainer:badges";
  const MISTAKE_RATE = 0.2; // up to 20% wrong attempts allowed per ayah
  const REVIEW_SPACING = [2, 4, 8, 16];
  const REVIEW_MIN_GAP = 2;
  const SESSION_GOAL_AYAHS = 5; // matches app.js's bounded daily session

  // ---------- shared storage keys (identical to app.js) ----------
  const progressKeyFor = (n) => `quran-trainer:surah-${n}:progress`;
  const statsKeyFor = (n) => `quran-trainer:stats:surah-${n}`;
  const interleaveKeyFor = (n) => `quran-trainer:interleave:surah-${n}`;
  const SESSION_KEY = "quran-trainer:session";
  const STREAK_KEY = "quran-trainer:streak";
  const RESCUE_KEY = "quran-trainer:rescued";

  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const yesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  function loadSession() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");
      if (s.date === todayStr()) return { date: s.date, count: s.count || 0, panelShown: !!s.panelShown };
    } catch {}
    return { date: todayStr(), count: 0, panelShown: false };
  }
  function saveSession(s) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch {}
  }
  function loadStreak() {
    try {
      const s = JSON.parse(localStorage.getItem(STREAK_KEY) || "{}");
      return { count: s.count || 0, lastDate: s.lastDate || null };
    } catch {
      return { count: 0, lastDate: null };
    }
  }
  function bumpStreak() {
    const s = loadStreak();
    const today = todayStr();
    if (s.lastDate === today) return s.count;
    s.count = s.lastDate === yesterdayStr() ? s.count + 1 : 1;
    s.lastDate = today;
    try { localStorage.setItem(STREAK_KEY, JSON.stringify(s)); } catch {}
    return s.count;
  }
  function loadRescued() {
    try {
      const s = JSON.parse(localStorage.getItem(RESCUE_KEY) || "{}");
      if (s.date === todayStr()) return { date: s.date, count: s.count || 0 };
    } catch {}
    return { date: todayStr(), count: 0 };
  }
  function bumpRescued() {
    const s = loadRescued();
    s.count += 1;
    try { localStorage.setItem(RESCUE_KEY, JSON.stringify(s)); } catch {}
    return s.count;
  }

  // ---------- word/gloss helpers (identical to app.js) ----------
  const answerFor = (w) => w.answer || w.english;
  const displayGloss = (w) =>
    w.display || (w.context ? `${answerFor(w)} — ${w.context}` : w.english || answerFor(w));
  const literalGloss = (w) => w.english || answerFor(w);
  const wordId = (w) => `${w.arabic}|||${answerFor(w)}`;
  const optionCountFor = (exposures) => (exposures >= 3 ? 5 : exposures >= 1 ? 4 : 3);
  const mistakeBudget = (wordCount) => Math.max(1, Math.ceil(MISTAKE_RATE * wordCount));

  const DIACRITICS = /[ً-ْٰٓ-ٟؐ-ؚۖ-ۭـ]/g;
  const skeleton = (s) => (s || "").normalize("NFC").replace(DIACRITICS, "");

  function levenshtein(a, b) {
    const m = a.length;
    const n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i);
    for (let i = 1; i <= m; i += 1) {
      let diag = prev[0];
      prev[0] = i;
      for (let j = 1; j <= n; j += 1) {
        const tmp = prev[j];
        prev[j] = a[i - 1] === b[j - 1] ? diag : 1 + Math.min(diag, prev[j], prev[j - 1]);
        diag = tmp;
      }
    }
    return prev[n];
  }

  function arabicSimilarity(a, b) {
    const x = skeleton(a);
    const y = skeleton(b);
    if (!x || !y) return 0;
    return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
  }

  const glossKey = (g) =>
    (g || "")
      .toLowerCase()
      .replace(/[()[\].,;:!?'"-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const normalizeArabicLetters = (s) =>
    skeleton(s || "")
      .replace(/[^ء-ي]/g, "")
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/ى/g, "ي");

  function arabicConceptKey(value) {
    let core = normalizeArabicLetters(value);
    while (/^[وف]/.test(core) && core.length > 3) core = core.slice(1);
    if (core === "لله") return "الله";
    if (/^[بك]/.test(core) && core[1] === "ا" && core.length > 4) core = core.slice(1);
    if (core === "لله") return "الله";
    if (core.startsWith("لل") && core.length > 4) core = "ال" + core.slice(2);
    else if (core[0] === "ل" && core[1] === "ا" && core.length > 4) core = core.slice(1);
    return core === "لله" ? "الله" : core;
  }

  const BEGINNER_CONTEXT_WORDS = new Set([
    "a", "an", "and", "are", "be", "belong", "belongs", "but", "by", "for", "from",
    "had", "has", "have", "in", "is", "of", "on", "so", "that", "the", "then", "to",
    "upon", "was", "were", "while", "with",
  ]);

  function beginnerGlossKey(g) {
    const words = (g || "")
      .toLowerCase()
      .replace(/\[[^\]]*\]|\([^)]*\)/g, " ")
      .replace(/['’]s\b/g, "")
      .replace(/[.,;:!?'"’\-/]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean);
    while (words.length && BEGINNER_CONTEXT_WORDS.has(words[0])) words.shift();
    while (words.length && BEGINNER_CONTEXT_WORDS.has(words[words.length - 1])) words.pop();
    return words.join(" ");
  }

  function optionKeys(word, gloss) {
    const keys = new Set();
    const exact = glossKey(gloss || "");
    const beginner = beginnerGlossKey(gloss || "");
    const arabic = word ? arabicConceptKey(word.arabic) : "";
    if (exact) keys.add(`gloss:${exact}`);
    if (beginner) keys.add(`meaning:${beginner}`);
    if (arabic) keys.add(`arabic:${arabic}`);
    return keys;
  }

  const hasBannedKey = (keys, bannedKeys) => [...keys].some((key) => bannedKeys.has(key));
  const rememberOption = (keys, bannedKeys) => keys.forEach((key) => bannedKeys.add(key));

  async function fetchJson(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
    return res.json();
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function literalMeaning(ayah) {
    return ayah.words
      .map(literalGloss)
      .join(" ")
      .replace(/[()[\]]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  class TrainerEngine {
    constructor(onAyahComplete) {
      this.onAyahComplete = onAyahComplete || (() => "");
      this.manifest = null;
      this.surah = null; // { number, name, englishName, englishTranslation, ayahs }
      this.uniqueWords = [];
      this.rootIndex = new Map();
      this.currentAyahIndex = 0;
      this.perfectSet = new Set(); // ayah numbers passed with zero slips (shared with app.js)
      this.wordIndex = 0;
      this.wordOrder = [];
      this.stats = {};
      this.interleave = {};
      this.lastReviewIndex = -REVIEW_MIN_GAP;
      this.attempt = null;
      this.reviewWord = null; // interleaved single review card
      this.reveal = null; // { ayahNumber, translation, literal, perfect, surahComplete, nextNumber }
      this.reviewMode = null; // { tally: {asked, right}, asked: Set, lastAnswer }
      this.focus = null; // { endsAt, count } — timed burst inside review mode
      this.focusResult = null; // { count, best, isRecord } after a round ends
      this.sessionDone = null; // daily-goal end screen state
      this.pendingContinuation = null; // reveal continuation deferred by sessionDone
      this.meaningShown = false; // translation peek during testing (forfeits Perfect)
      this.message = "";
      this.locked = false;
      this.loading = true;
      this.error = null;
      this.ready = this.init();
    }

    async init() {
      try {
        this.manifest = (await fetchJson(MANIFEST_FILE)).surahs || [];
        // Juz boundaries drive the badge shelf; the trainer works without
        // them (badges just don't render), so failures stay silent.
        try {
          this.juzs = (await fetchJson(JUZ_FILE)).juzs || [];
        } catch {
          this.juzs = [];
        }
        await this.loadSurah(this.pickStartingSurahNumber());
      } catch (err) {
        if (!this.loadFallbackTrainer(err)) this.error = err;
      } finally {
        this.loading = false;
      }
    }

    // ---------- juz badges (the "gym badge" ladder) ----------
    // A juz badge is earned when every ayah the juz spans is passed. Because
    // progress within a surah is strictly sequential (passed = ayahs 1..n),
    // coverage of a range a-b is the overlap of [1..passed] with [a..b].

    juzDone(juz) {
      let done = 0;
      for (const [surah, range] of Object.entries(juz.mapping)) {
        const passed = this.passedCount(Number(surah));
        if (!passed) continue;
        const [a, b] = range.split("-").map(Number);
        done += Math.max(0, Math.min(passed, b) - a + 1);
      }
      return done;
    }

    badges() {
      return (this.juzs || []).map((juz) => {
        const done = this.juzDone(juz);
        return { juz: juz.juz, done, total: juz.ayahCount, earned: done >= juz.ayahCount };
      });
    }

    // The juz a given ayah belongs to, with live progress — the pacing line
    // shown on every reveal so long surahs read as a ladder of near goals.
    juzFor(surahNumber, ayahNumber) {
      for (const juz of this.juzs || []) {
        const range = juz.mapping[String(surahNumber)];
        if (!range) continue;
        const [a, b] = range.split("-").map(Number);
        if (ayahNumber >= a && ayahNumber <= b) {
          return { juz: juz.juz, done: this.juzDone(juz), total: juz.ayahCount };
        }
      }
      return null;
    }

    loadEarnedBadges() {
      try {
        const list = JSON.parse(localStorage.getItem(BADGES_KEY) || "[]");
        return new Set(Array.isArray(list) ? list : []);
      } catch {
        return new Set();
      }
    }

    // Persist earned badges and report which juz (if any) was earned just
    // now, so the reveal can celebrate it exactly once.
    claimNewBadges() {
      const earnedBefore = this.loadEarnedBadges();
      let newlyEarned = null;
      const all = [];
      for (const b of this.badges()) {
        if (b.earned) {
          all.push(b.juz);
          if (!earnedBefore.has(b.juz)) newlyEarned = b.juz;
        }
      }
      if (newlyEarned !== null) {
        try {
          localStorage.setItem(BADGES_KEY, JSON.stringify(all));
        } catch {}
      }
      return newlyEarned;
    }

    // ---------- manifest / unlock rules (identical to app.js + picker.js) ----------

    manifestEntry(number) {
      return (this.manifest || []).find((s) => s.number === number) || null;
    }

    passedCount(number) {
      return this.loadProgressFor(number).passed;
    }

    isComplete(entry) {
      return this.passedCount(entry.number) >= entry.ayahCount;
    }

    // Sticky unlock: first surah, previous complete, or already-started.
    isUnlocked(number) {
      const list = this.manifest || [];
      const idx = list.findIndex((s) => s.number === number);
      if (idx < 0) return false;
      if (idx === 0) return true;
      if (this.passedCount(number) > 0) return true;
      return this.isComplete(list[idx - 1]);
    }

    pickStartingSurahNumber() {
      for (const entry of this.manifest) {
        if (!this.isComplete(entry)) return entry.number;
      }
      return this.manifest.length ? this.manifest[this.manifest.length - 1].number : 1;
    }

    // Collection view: completed + current/available + only the FIRST locked
    // surah (as a tease); everything past that stays hidden.
    collectionEntries() {
      const out = [];
      let lockedShown = false;
      for (const entry of this.manifest || []) {
        const passed = this.passedCount(entry.number);
        const complete = passed >= entry.ayahCount;
        const unlocked = this.isUnlocked(entry.number);
        if (complete) {
          out.push({ entry, passed, status: "complete" });
        } else if (unlocked) {
          out.push({
            entry,
            passed,
            status: this.surah && entry.number === this.surah.number ? "active" : "available",
          });
        } else if (!lockedShown) {
          const idx = this.manifest.indexOf(entry);
          out.push({ entry, passed: 0, status: "locked", unlockAfter: this.manifest[idx - 1] || null });
          lockedShown = true;
        }
        // deeper locked surahs stay hidden until progression reveals them
      }
      return out;
    }

    async loadSurah(number) {
      const entry = this.manifestEntry(number);
      if (!entry) {
        this.locked = true;
        return;
      }
      this.locked = false;
      const data = await fetchJson(entry.file);
      this.surah = { ...data.surah, ayahs: data.ayahs };

      // Every word learns its recitation clip path once, so the study desk,
      // reviews and the reader can all offer audio without re-deriving
      // locations. The build verifies the deterministic pattern per word and
      // stores an explicit `audio` only for the exceptions.
      const pad3 = (n) => String(n).padStart(3, "0");
      for (const ayah of data.ayahs) {
        for (const word of ayah.words) {
          word.audioPath =
            word.audio || `wbw/${pad3(number)}_${pad3(ayah.number)}_${pad3(word.position)}.mp3`;
        }
      }

      const glossInfo = new Map();
      this.glossInfo = glossInfo; // gloss -> owning word, for wrong-answer contrast
      this.rootIndex = new Map();
      const rootSeen = new Map();
      for (const ayah of data.ayahs) {
        for (const word of ayah.words) {
          const answer = answerFor(word);
          if (!glossInfo.has(answer)) glossInfo.set(answer, word);
          if (word.root) {
            if (!this.rootIndex.has(word.root)) {
              this.rootIndex.set(word.root, []);
              rootSeen.set(word.root, new Set());
            }
            const key = glossKey(answer);
            if (!rootSeen.get(word.root).has(key)) {
              rootSeen.get(word.root).add(key);
              this.rootIndex.get(word.root).push({ arabic: word.arabic, english: answer });
            }
          }
        }
      }
      this.uniqueWords = [...glossInfo.values()];

      const progress = this.loadProgressFor(number);
      this.currentAyahIndex = Math.min(progress.passed, this.surah.ayahs.length);
      this.perfectSet = new Set(progress.perfect);
      this.stats = this.loadStatsFor(number);
      this.interleave = this.loadInterleaveFor(number);
      this.lastReviewIndex = -REVIEW_MIN_GAP;
      this.reveal = null;
      this.reviewMode = null;
      this.reviewWord = null;
      if (this.currentAyahIndex >= this.surah.ayahs.length) {
        // Fully completed surah: land in endless review rather than re-testing
        // the last ayah (progress stays untouched unless the player resets).
        this.startReviewMode();
      } else {
        this.startAyah();
      }
    }

    // Explicit surah switching from the collection UI. The overlay asks for
    // confirmation first; switching discards only the unsaved solved words of
    // the ayah in progress (progress saves whole ayahs), never passed ayahs.
    async switchSurah(number) {
      if (!this.isUnlocked(number)) return false;
      this.loading = true;
      try {
        await this.loadSurah(number);
        const name = this.surah.englishName || this.surah.name;
        this.message = this.reviewMode
          ? `Reviewing ${name} — its ayahs are all complete.`
          : `Now studying ${name}.`;
        return true;
      } catch (err) {
        this.error = err;
        return false;
      } finally {
        this.loading = false;
      }
    }

    // Restart a completed (or in-progress) surah from ayah 1. Word stats and
    // the review schedule survive — same behavior as app.js's reset button.
    async resetSurah(number) {
      try {
        localStorage.setItem(progressKeyFor(number), JSON.stringify({ passed: 0, perfect: [] }));
      } catch {}
      return this.switchSurah(number);
    }

    loadFallbackTrainer(error) {
      const questions = ns.TRAINER_QUESTIONS || [];
      if (!questions.length) return false;

      this.fallback = true;
      this.manifest = [{
        number: 1,
        name: "الفاتحة",
        englishName: "Al-Fatihah",
        englishTranslation: "Offline sample",
        ayahCount: questions.length,
        file: "",
      }];
      this.surah = {
        number: 1,
        name: "الفاتحة",
        englishName: "Al-Fatihah",
        englishTranslation: "Offline sample",
        ayahs: questions.map((question, index) => ({
          number: index + 1,
          translation: question.translation || "",
          displayWords: question.ayahWords || [question.arabic],
          words: [{
            arabic: question.arabic,
            english: question.answer,
            answer: question.answer,
            translit: question.translit || "",
            root: question.root || "",
            position: index + 1,
            displayIndex: question.activeWordIndex ?? 0,
          }],
        })),
      };
      this.glossInfo = new Map(this.surah.ayahs.map((a) => [answerFor(a.words[0]), a.words[0]]));
      this.uniqueWords = this.surah.ayahs.map((ayah) => ayah.words[0]);
      this.rootIndex = new Map();
      this.currentAyahIndex = 0;
      this.perfectSet = new Set();
      this.stats = {};
      this.interleave = {};
      this.lastReviewIndex = -REVIEW_MIN_GAP;
      this.locked = false;
      this.error = null;
      console.warn("Using bundled trainer sample because full trainer data could not load.", error);
      this.message = "Offline sample loaded. Use the local dev server for the full trainer data.";
      this.startAyah();
      return true;
    }

    get ayah() {
      return this.surah ? this.surah.ayahs[this.currentAyahIndex] : null;
    }

    startAyah() {
      const ayah = this.ayah;
      if (!ayah) return;
      this.attempt = {
        mistakes: 0,
        budget: mistakeBudget(ayah.words.length),
        solved: new Set(),
        total: ayah.words.length,
        clean: true,
        resets: 0,
        missedWords: new Set(), // wordIds slipped on, for rescue detection
      };
      // Words are tested in reading order (right-to-left through the ayah),
      // matching the standalone trainer's natural flow.
      this.wordOrder = ayah.words.map((_, i) => i);
      this.wordIndex = 0;
      this.reviewWord = null;
      this.reveal = null;
      this.meaningShown = false;
      this.message = "";
    }

    resetAyah() {
      const ayah = this.ayah;
      this.attempt.resets += 1;
      this.attempt.mistakes = 0;
      this.attempt.clean = false;
      this.attempt.solved.clear();
      this.wordOrder = ayah.words.map((_, i) => i);
      this.wordIndex = 0;
      this.message = "Let's run this ayah again — no penalty. I'll explain each slip as you go, so it sticks.";
    }

    activeWord() {
      if (this.reviewWord) return this.reviewWord;
      const ayah = this.ayah;
      if (!ayah || !this.attempt) return null;
      const idx = this.wordOrder[this.wordIndex];
      return ayah.words[idx];
    }

    // Peek at the ayah translation mid-test. Free, but like the standalone
    // hint it forfeits the Perfect mark — certainty stays rewarded.
    showMeaning() {
      if (this.attempt && !this.meaningShown) {
        this.meaningShown = true;
        this.attempt.clean = false;
      }
    }

    buildOptions(word) {
      const correct = answerFor(word);
      const id = wordId(word);
      const stat = this.stats[id];
      const exposures = stat ? stat.miss + stat.correct : 0;
      const target = Math.min(optionCountFor(exposures), this.uniqueWords.length);

      const bannedKeys = optionKeys(word, correct);
      const distractors = [];
      const add = (candidate) => {
        if (!candidate) return;
        const answer = answerFor(candidate);
        const keys = optionKeys(candidate, answer);
        if (!answer || hasBannedKey(keys, bannedKeys)) return;
        rememberOption(keys, bannedKeys);
        distractors.push(answer);
      };

      add(this.lookalikeWord(word, bannedKeys));
      add(this.sameRootWord(word, bannedKeys));
      for (const candidate of shuffle(this.uniqueWords)) {
        if (distractors.length >= target - 1) break;
        add(candidate);
      }
      return shuffle([correct, ...distractors]);
    }

    lookalikeWord(word, bannedKeys) {
      let best = null;
      let bestScore = -1;
      for (const cand of this.uniqueWords) {
        const answer = answerFor(cand);
        if (hasBannedKey(optionKeys(cand, answer), bannedKeys)) continue;
        const score = arabicSimilarity(word.arabic, cand.arabic);
        if (score > bestScore) {
          bestScore = score;
          best = cand;
        }
      }
      return bestScore > 0.34 ? best : null;
    }

    sameRootWord(word, bannedKeys) {
      if (!word.root) return null;
      const family = (this.rootIndex.get(word.root) || []).filter(
        (m) => !hasBannedKey(optionKeys(m, answerFor(m)), bannedKeys),
      );
      if (!family.length) return null;
      return family[Math.floor(Math.random() * family.length)];
    }

    statEntry(word) {
      const id = wordId(word);
      if (!this.stats[id]) {
        this.stats[id] = {
          arabic: word.arabic,
          english: answerFor(word),
          display: displayGloss(word),
          translit: word.translit || "",
          root: word.root || "",
          audioPath: word.audioPath || "",
          miss: 0,
          correct: 0,
        };
      } else {
        this.stats[id].english = answerFor(word);
        this.stats[id].display = this.stats[id].display || displayGloss(word);
        if (!this.stats[id].root && word.root) this.stats[id].root = word.root;
        if (!this.stats[id].audioPath && word.audioPath) this.stats[id].audioPath = word.audioPath;
      }
      return this.stats[id];
    }

    recordMiss(word) {
      this.statEntry(word).miss += 1;
      this.saveStatsFor(this.surah.number);
    }

    recordCorrect(word) {
      this.statEntry(word).correct += 1;
      this.saveStatsFor(this.surah.number);
    }

    pickDueReview(justFinishedAyah) {
      if (this.currentAyahIndex - this.lastReviewIndex < REVIEW_MIN_GAP) return null;
      const exclude = new Set(justFinishedAyah.words.map((w) => wordId(w)));
      const due = Object.entries(this.stats)
        .filter(([id, s]) => s.miss > 0 && !exclude.has(id))
        .filter(([id]) => {
          const sched = this.interleave[id];
          return !sched || sched.dueIndex <= this.currentAyahIndex;
        })
        .sort((a, b) => b[1].miss - a[1].miss);
      if (!due.length) return null;
      return due[0][1];
    }

    scheduleReview(word, recalled) {
      const id = wordId(word);
      const box = recalled ? Math.min((this.interleave[id]?.box || 1) + 1, REVIEW_SPACING.length) : 1;
      this.interleave[id] = { box, dueIndex: this.currentAyahIndex + REVIEW_SPACING[box - 1] };
      this.lastReviewIndex = this.currentAyahIndex;
      this.saveInterleaveFor(this.surah.number);
    }

    // ---------- reader (browsable completed ayahs) ----------
    // View-ready data for the Read tab: every passed ayah of the loaded
    // surah with per-word gloss/mastery and root families for the popover.

    readerAyahs() {
      if (!this.surah) return [];
      const passed = Math.min(this.passedCount(this.surah.number), this.surah.ayahs.length);
      return this.surah.ayahs.slice(0, passed).map((ayah) => ({
        number: ayah.number,
        ref: `${this.surah.number}:${ayah.number}`,
        translation: ayah.translation || "",
        literal: literalMeaning(ayah),
        perfect: this.perfectSet.has(ayah.number),
        words: ayah.words.map((w) => ({
          arabic: w.arabic,
          translit: w.translit || "",
          gloss: displayGloss(w),
          audioPath: w.audioPath || "",
          root: w.root || "",
          mastery: this.masteryTier(wordId(w)),
          family: w.root
            ? (this.rootIndex.get(w.root) || []).filter((m) => m.arabic !== w.arabic)
            : [],
        })),
      }));
    }

    // ---------- word mastery (bronze / silver / gold) ----------
    // Derived from the shared per-word stats: repeated honest recall promotes
    // a word through tiers; shaky accuracy holds it back. Gold words shimmer
    // in the ayah line — a collection to complete, not just a quiz to pass.

    masteryTier(id) {
      const s = this.stats[id];
      if (!s) return 0;
      const total = (s.miss || 0) + (s.correct || 0);
      const acc = total ? (s.correct || 0) / total : 0;
      if (s.correct >= 6 && acc >= 0.85) return 3; // gold
      if (s.correct >= 4 && acc >= 0.7) return 2; // silver
      if (s.correct >= 2) return 1; // bronze
      return 0; // new
    }

    // ---------- focus rounds (timed review bursts) ----------

    startFocusRound(durationMs = 90000) {
      if (!this.reviewMode) return;
      this.focusResult = null;
      this.focus = { endsAt: Date.now() + durationMs, count: 0 };
      this.reviewMode.tally = { asked: 0, right: 0 };
      this.message = "";
    }

    focusSecondsLeft() {
      return this.focus ? Math.max(0, Math.ceil((this.focus.endsAt - Date.now()) / 1000)) : 0;
    }

    endFocusRound() {
      if (!this.focus) return;
      const key = `quran-trainer:focus:surah-${this.surah.number}`;
      let best = 0;
      try { best = JSON.parse(localStorage.getItem(key) || "{}").best || 0; } catch {}
      const isRecord = this.focus.count > best;
      if (isRecord) {
        try { localStorage.setItem(key, JSON.stringify({ best: this.focus.count })); } catch {}
      }
      this.focusResult = { count: this.focus.count, best: Math.max(best, this.focus.count), isRecord };
      this.focus = null;
    }

    dismissFocusResult() {
      this.focusResult = null;
    }

    // ---------- endless per-surah review mode ----------
    // Missed words first (hardest first), then weak words (shaky accuracy or
    // barely seen), then random learned words — indefinitely.

    startReviewMode() {
      this.reviewMode = { tally: { asked: 0, right: 0 }, asked: new Set() };
      this.reviewWord = null;
      this.reveal = null;
      this.attempt = null;
      this.focus = null;
      this.focusResult = null;
      this.nextReviewQuestion();
    }

    async stopReviewMode() {
      this.reviewMode = null;
      this.focus = null;
      this.focusResult = null;
      if (this.surah && this.currentAyahIndex < this.surah.ayahs.length) {
        this.startAyah();
        return;
      }
      // Reviewing a fully-completed surah: leaving lands on the first surah
      // that still has ayahs to study (loadSurah re-enters review if none do).
      await this.switchSurah(this.pickStartingSurahNumber());
    }

    reviewPool() {
      const entries = Object.entries(this.stats);
      if (entries.length) return entries;
      // Nothing attempted yet (e.g. reviewing a surah finished elsewhere with
      // cleared stats) — seed from the words of passed ayahs.
      const words = [];
      for (const ayah of this.surah.ayahs.slice(0, this.passedCount(this.surah.number))) {
        for (const w of ayah.words) words.push([wordId(w), w]);
      }
      return words;
    }

    nextReviewQuestion() {
      const rm = this.reviewMode;
      const pool = this.reviewPool();
      if (!pool.length) {
        this.reviewMode.current = null;
        this.message = "Nothing to review here yet — pass a few ayahs first.";
        return;
      }
      const unasked = pool.filter(([id]) => !rm.asked.has(id));
      const candidates = unasked.length ? unasked : pool; // loop forever
      if (!unasked.length) rm.asked.clear();

      const missed = candidates
        .filter(([, s]) => (s.miss || 0) > 0)
        .sort((a, b) => (b[1].miss || 0) - (a[1].miss || 0));
      const weak = candidates.filter(([, s]) => {
        const miss = s.miss || 0;
        const correct = s.correct || 0;
        return miss + correct > 0 && (correct < 2 || correct / (miss + correct) < 0.75);
      });

      let pick;
      if (missed.length) pick = missed[0];
      else if (weak.length) pick = weak[Math.floor(Math.random() * weak.length)];
      else pick = candidates[Math.floor(Math.random() * candidates.length)];

      rm.asked.add(pick[0]);
      rm.current = pick[1];
    }

    // ---------- view model ----------

    sessionInfo() {
      const session = loadSession();
      return {
        count: session.count,
        goal: SESSION_GOAL_AYAHS,
        streak: loadStreak().count,
        rescued: loadRescued().count,
      };
    }

    getView() {
      if (this.loading) return { mode: "loading" };
      if (this.error) return { mode: "error", message: "Could not load the trainer data." };
      if (this.locked || !this.surah) return { mode: "locked" };

      const base = {
        surahNumber: this.surah.number,
        progressText: `${this.surah.number}. ${this.surah.englishName || this.surah.name} · ${Math.min(this.currentAyahIndex, this.surah.ayahs.length)}/${this.surah.ayahs.length} ayahs`,
        session: this.sessionInfo(),
        message: this.message,
      };

      if (this.reviewMode) {
        if (this.focusResult) {
          return { ...base, mode: "focusDone", focusResult: { ...this.focusResult } };
        }
        const word = this.reviewMode.current;
        if (!word) return { ...base, mode: "reviewEmpty" };
        return {
          ...base,
          mode: "reviewMode",
          arabic: word.arabic,
          translit: word.translit || "",
          prompt: this.focus ? "⏳ Focus round — as many recalls as you can!" : "Endless review — what does this word mean?",
          options: this.buildOptions(word),
          answer: answerFor(word),
          audioPath: word.audioPath || "",
          tally: { ...this.reviewMode.tally },
          mastery: this.masteryTier(`${word.arabic}|||${answerFor(word)}`),
          focus: this.focus ? { secondsLeft: this.focusSecondsLeft(), count: this.focus.count } : null,
        };
      }

      if (this.sessionDone) {
        return { ...base, mode: "sessionDone", sessionDone: { ...this.sessionDone } };
      }

      if (this.reveal) {
        return {
          ...base,
          mode: "reveal",
          ...this.reveal,
        };
      }

      const ayah = this.ayah;
      if (!ayah) return { ...base, mode: "loading" };
      const word = this.activeWord();
      if (!word) return { ...base, mode: "loading" };

      const isInterleaved = !!this.reviewWord;
      return {
        ...base,
        mode: isInterleaved ? "review" : "word",
        surahRef: `${this.surah.number}:${ayah.number}`,
        ayahWords: ayah.displayWords || ayah.words.map((w) => w.arabic),
        ayahMastery: ayah.words.map((w) => this.masteryTier(wordId(w))),
        solvedIndexes: this.attempt ? [...this.attempt.solved] : [],
        mastery: this.masteryTier(wordId(word)),
        activeWordIndex: isInterleaved ? -1 : (word.displayIndex ?? this.wordOrder[this.wordIndex]),
        arabic: word.arabic,
        translit: word.translit || "",
        prompt: isInterleaved
          ? "↻ Quick review — you missed this earlier"
          : "What does this word mean?",
        options: this.buildOptions(word),
        answer: answerFor(word),
        audioPath: word.audioPath || "",
        mistakes: this.attempt ? this.attempt.mistakes : 0,
        budget: this.attempt ? this.attempt.budget : 0,
        solved: this.attempt ? this.attempt.solved.size : 0,
        total: this.attempt ? this.attempt.total : 0,
        meaningShown: this.meaningShown,
        translation: this.meaningShown ? ayah.translation || "" : "",
      };
    }

    // Leave the reveal panel: session-done screen first when the daily goal
    // just landed, then interleaved review, next ayah, or next surah.
    async continueFromReveal(game) {
      const reveal = this.reveal;
      this.reveal = null;
      if (!reveal) return;

      if (reveal.justHitGoal && !this.sessionDone) {
        this.sessionDone = {
          goal: SESSION_GOAL_AYAHS,
          streak: loadStreak().count,
          rescued: loadRescued().count,
        };
        this.pendingContinuation = { ...reveal, justHitGoal: false };
        return;
      }

      if (reveal.surahComplete) {
        if (reveal.nextNumber) {
          this.loading = true;
          try {
            await this.loadSurah(reveal.nextNumber);
            this.message = `Now beginning ${this.surah.englishName || this.surah.name}.`;
          } catch (err) {
            this.error = err;
          } finally {
            this.loading = false;
          }
        } else {
          this.startReviewMode();
          this.message = "Every available surah is complete — endless review keeps the words fresh.";
        }
        return;
      }

      const review = this.pickDueReview(reveal.finishedAyah);
      if (review) {
        this.reviewWord = review;
        this.message = "";
      } else {
        this.startAyah();
      }
    }

    // Dismiss the daily-goal end screen and resume where the reveal left off.
    async dismissSessionDone(game) {
      this.sessionDone = null;
      const continuation = this.pendingContinuation;
      this.pendingContinuation = null;
      if (continuation) {
        this.reveal = continuation;
        await this.continueFromReveal(game);
      }
    }

    // ---------- interaction ----------

    choose(value, game) {
      if (this.locked || !this.surah) return { correct: false };

      // Endless review mode answer.
      if (this.reviewMode) {
        const word = this.reviewMode.current;
        if (!word) return { correct: false };
        if (this.focus && Date.now() >= this.focus.endsAt) {
          this.endFocusRound();
          return { correct: false, advanced: true };
        }
        const correct = value === answerFor(word);
        this.reviewMode.tally.asked += 1;
        if (correct) {
          this.reviewMode.tally.right += 1;
          if (this.focus) this.focus.count += 1;
          this.recordCorrect(word);
          this.message = this.focus ? "" : "Recalled ✓";
        } else {
          this.recordMiss(word);
          this.message = this.focus
            ? `“${word.display || answerFor(word)}” — keep going!`
            : `Not yet — this word means “${word.display || answerFor(word)}”. It'll come back around.`;
        }
        this.nextReviewQuestion();
        return { correct, advanced: true };
      }

      // Interleaved single review card (between ayahs).
      if (this.reviewWord) {
        const correct = value === answerFor(this.reviewWord);
        this.scheduleReview(this.reviewWord, correct);
        if (correct) {
          this.recordCorrect(this.reviewWord);
          this.message = "Recalled ✓ — it'll come back less often now.";
        } else {
          this.recordMiss(this.reviewWord);
          this.message = `Not yet — this word means “${this.reviewWord.display || answerFor(this.reviewWord)}”. It'll return soon.`;
        }
        this.reviewWord = null;
        this.startAyah();
        return { correct, advanced: true };
      }

      const ayah = this.ayah;
      const word = this.activeWord();
      if (!word) return { correct: false };
      const correct = value === answerFor(word);
      const id = wordId(word);

      if (!correct) {
        this.attempt.mistakes += 1;
        this.attempt.clean = false;
        this.attempt.missedWords.add(id);
        this.recordMiss(word);
        if (this.attempt.mistakes > this.attempt.budget) {
          this.resetAyah();
          return { correct: false, reset: true };
        }
        const remaining = this.attempt.budget - this.attempt.mistakes;
        // After a full-ayah reset, spell out the contrast (app.js parity).
        if (this.attempt.resets >= 1) {
          const owner = this.glossInfo?.get(value);
          const belongsTo = owner ? ` — that's “${owner.arabic}”` : "";
          this.message = `“${value}”${belongsTo}. This word means “${displayGloss(word)}”. ${remaining} slip${remaining === 1 ? "" : "s"} left.`;
        } else {
          this.message = `Not quite. ${remaining} mistake${remaining === 1 ? "" : "s"} left before this ayah resets.`;
        }
        return { correct: false };
      }

      this.recordCorrect(word);
      const rescued = this.attempt.missedWords.delete(id);
      if (rescued) bumpRescued();
      this.attempt.solved.add(this.wordOrder[this.wordIndex]);
      this.wordIndex += 1;
      this.message = rescued ? "💪 Got it — a slip turned into a win." : "";

      if (this.attempt.solved.size < this.attempt.total) {
        return { correct: true, rescued };
      }

      // ---- ayah complete ----
      const perfect = this.attempt.clean;
      if (perfect) this.perfectSet.add(ayah.number);

      // Oasis rewards fire only here — in-game completions.
      const summary = this.onAyahComplete(game);

      this.currentAyahIndex += 1;
      this.saveProgressFor(this.surah.number);

      // Shared daily session + streak (same keys the standalone pages read).
      const session = loadSession();
      session.count += 1;
      const justHitGoal = session.count === SESSION_GOAL_AYAHS && !session.panelShown;
      if (justHitGoal) {
        session.panelShown = true;
        bumpStreak();
      }
      saveSession(session);

      const atSurahEnd = this.currentAyahIndex >= this.surah.ayahs.length;
      const nextEntry = atSurahEnd
        ? (this.manifest || []).find((s) => s.number === this.surah.number + 1)
        : null;

      // Pacing: where this ayah sits on the juz ladder, and whether the
      // whole juz just landed (the badge moment, celebrated exactly once).
      const juz = this.juzFor(this.surah.number, ayah.number);
      const badgeEarned = this.claimNewBadges();

      this.reveal = {
        juz,
        badgeEarned,
        ayahNumber: ayah.number,
        surahRef: `${this.surah.number}:${ayah.number}`,
        arabicLine: (ayah.displayWords || ayah.words.map((w) => w.arabic)).join(" "),
        translation: ayah.translation || "",
        literal: literalMeaning(ayah),
        perfect,
        summary: summary || "",
        justHitGoal,
        surahComplete: atSurahEnd,
        surahName: this.surah.englishName || this.surah.name,
        nextNumber: nextEntry ? nextEntry.number : null,
        nextName: nextEntry ? nextEntry.englishName : "",
        finishedAyah: ayah,
      };
      this.message = "";
      return { correct: true, ayahComplete: true, surahComplete: atSurahEnd, rescued };
    }

    // ---------- storage (shared quran-trainer:* keys) ----------

    loadProgressFor(number) {
      try {
        const raw = localStorage.getItem(progressKeyFor(number));
        if (!raw) return { passed: 0, perfect: [] };
        const data = JSON.parse(raw);
        return {
          passed: Number.isInteger(data.passed) ? data.passed : 0,
          perfect: Array.isArray(data.perfect) ? data.perfect : [],
        };
      } catch {
        return { passed: 0, perfect: [] };
      }
    }

    saveProgressFor(number) {
      try {
        localStorage.setItem(
          progressKeyFor(number),
          JSON.stringify({ passed: this.currentAyahIndex, perfect: [...this.perfectSet] }),
        );
      } catch {}
    }

    loadStatsFor(number) {
      try {
        const raw = localStorage.getItem(statsKeyFor(number));
        const data = raw ? JSON.parse(raw) : {};
        return data && typeof data === "object" ? data : {};
      } catch {
        return {};
      }
    }

    saveStatsFor(number) {
      try {
        localStorage.setItem(statsKeyFor(number), JSON.stringify(this.stats));
      } catch {}
    }

    loadInterleaveFor(number) {
      try {
        const data = JSON.parse(localStorage.getItem(interleaveKeyFor(number)) || "{}");
        return data && typeof data === "object" ? data : {};
      } catch {
        return {};
      }
    }

    saveInterleaveFor(number) {
      try {
        localStorage.setItem(interleaveKeyFor(number), JSON.stringify(this.interleave));
      } catch {}
    }
  }

  ns.TrainerEngine = TrainerEngine;
})(window.MiftahGame || (window.MiftahGame = {}));
