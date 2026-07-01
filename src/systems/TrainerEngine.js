(function (ns) {
  const MANIFEST_FILE = "data/surahs.json";
  const MISTAKE_RATE = 0.2;
  const REVIEW_SPACING = [2, 4, 8, 16];
  const REVIEW_MIN_GAP = 2;

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
  const answerFor = (w) => w.answer || w.english;
  const wordId = (w) => `${w.arabic}|||${answerFor(w)}`;
  const optionCountFor = (exposures) => (exposures >= 3 ? 5 : exposures >= 1 ? 4 : 3);
  const mistakeBudget = (wordCount) => Math.max(1, Math.ceil(MISTAKE_RATE * wordCount));

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  class TrainerEngine {
    constructor(onAyahComplete) {
      this.onAyahComplete = onAyahComplete || (() => "");
      this.manifest = null;
      this.surah = null; // { number, name, englishName, englishTranslation, ayahCount, ayahs }
      this.uniqueWords = [];
      this.rootIndex = new Map();
      this.currentAyahIndex = 0; // index into surah.ayahs
      this.wordIndex = 0; // index into current ayah's words
      this.wordOrder = [];
      this.stats = {};
      this.interleave = {};
      this.lastReviewIndex = -REVIEW_MIN_GAP;
      this.attempt = null; // per-ayah attempt state
      this.reviewWord = null; // set when presenting an interleaved review card
      this.message = "";
      this.locked = false;
      this.loading = true;
      this.error = null;
      this.ready = this.init();
    }

    async init() {
      try {
        const manifestRes = await fetch(MANIFEST_FILE);
        this.manifest = (await manifestRes.json()).surahs || [];
        await this.loadSurah(this.pickStartingSurahNumber());
      } catch (err) {
        this.error = err;
      } finally {
        this.loading = false;
      }
    }

    pickStartingSurahNumber() {
      for (const entry of this.manifest) {
        const progress = this.loadProgressFor(entry.number);
        if (progress.passed < entry.ayahCount) return entry.number;
      }
      return this.manifest.length ? this.manifest[this.manifest.length - 1].number : 1;
    }

    manifestEntry(number) {
      return this.manifest.find((s) => s.number === number) || null;
    }

    async loadSurah(number) {
      const entry = this.manifestEntry(number);
      if (!entry) {
        this.locked = true;
        return;
      }
      this.locked = false;
      const res = await fetch(entry.file);
      const data = await res.json();
      this.surah = { ...data.surah, ayahs: data.ayahs };

      const glossInfo = new Map();
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
      this.currentAyahIndex = Math.min(progress.passed, this.surah.ayahs.length - 1);
      this.stats = this.loadStatsFor(number);
      this.interleave = this.loadInterleaveFor(number);
      this.lastReviewIndex = -REVIEW_MIN_GAP;
      this.startAyah();
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
      };
      this.wordOrder = shuffle(ayah.words.map((_, i) => i));
      this.wordIndex = 0;
      this.reviewWord = null;
      this.message = "";
    }

    resetAyah() {
      const ayah = this.ayah;
      this.attempt.resets += 1;
      this.attempt.mistakes = 0;
      this.attempt.clean = false;
      this.attempt.solved.clear();
      this.wordOrder = shuffle(ayah.words.map((_, i) => i));
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
          translit: word.translit || "",
          root: word.root || "",
          miss: 0,
          correct: 0,
        };
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

    // ---------- view model ----------

    getView(game) {
      if (this.loading) return { mode: "loading" };
      if (this.error) return { mode: "error", message: "Could not load the trainer data." };
      if (this.locked || !this.surah) return { mode: "locked" };

      const ayah = this.ayah;
      const word = this.activeWord();
      const surahMeta = this.manifestEntry(this.surah.number);
      const progressText = `${this.surah.number}. ${this.surah.englishName || this.surah.name} · ${this.currentAyahIndex}/${this.surah.ayahs.length} ayahs`;

      if (!word) return { mode: "loading" };

      const options = this.reviewWord ? this.buildOptions(this.reviewWord) : this.buildOptions(word);
      return {
        mode: this.reviewWord ? "review" : "word",
        surahRef: `${this.surah.number}:${ayah.number}`,
        surahMeta,
        progressText,
        ayahWords: ayah.words.map((w) => w.arabic),
        activeWordIndex: this.reviewWord ? -1 : this.wordOrder[this.wordIndex],
        arabic: word.arabic,
        translit: word.translit || "",
        prompt: this.reviewWord ? "Review: what does this word mean?" : "What does this word mean?",
        options,
        answer: answerFor(word),
        mistakes: this.attempt ? this.attempt.mistakes : 0,
        budget: this.attempt ? this.attempt.budget : 0,
        message: this.message,
        ayahCount: this.surah.ayahs.length,
      };
    }

    // ---------- interaction ----------

    choose(value, game) {
      if (this.locked || !this.surah) return { correct: false };

      if (this.reviewWord) {
        const correct = value === answerFor(this.reviewWord);
        this.scheduleReview(this.reviewWord, correct);
        if (correct) {
          this.recordCorrect(this.reviewWord);
          this.message = "Nice recall — that word is sticking.";
        } else {
          this.recordMiss(this.reviewWord);
          this.message = `Close — that one means "${answerFor(this.reviewWord)}". It'll come back around.`;
        }
        this.reviewWord = null;
        return { correct, advanced: true };
      }

      const ayah = this.ayah;
      const word = this.activeWord();
      const correct = value === answerFor(word);

      if (!correct) {
        this.attempt.mistakes += 1;
        this.attempt.clean = false;
        this.recordMiss(word);
        if (this.attempt.mistakes > this.attempt.budget) {
          this.resetAyah();
          return { correct: false, reset: true };
        }
        const remaining = this.attempt.budget - this.attempt.mistakes;
        this.message =
          this.attempt.resets >= 1
            ? `Not quite — this word comes from the root "${word.root || "?"}" and means "${answerFor(word)}". ${remaining} mistake${remaining === 1 ? "" : "s"} left before we restart the ayah.`
            : `Not quite. ${remaining} mistake${remaining === 1 ? "" : "s"} left before we restart the ayah.`;
        return { correct: false };
      }

      this.recordCorrect(word);
      this.attempt.solved.add(this.wordOrder[this.wordIndex]);
      this.wordIndex += 1;
      this.message = "";

      if (this.attempt.solved.size < this.attempt.total) {
        return { correct: true };
      }

      // ayah complete
      const perfect = this.attempt.clean;
      const summary = this.onAyahComplete(game);
      this.currentAyahIndex += 1;
      this.saveProgressFor(this.surah.number);

      const finishedAyah = ayah;
      const atSurahEnd = this.currentAyahIndex >= this.surah.ayahs.length;
      const review = atSurahEnd ? null : this.pickDueReview(finishedAyah);

      if (atSurahEnd) {
        this.message = perfect
          ? `★ Perfect surah pass! ${summary || ""}`.trim()
          : `Surah complete! ${summary || ""}`.trim();
        const nextEntry = this.manifest.find((s) => s.number === this.surah.number + 1);
        if (nextEntry) {
          this.loadSurah(nextEntry.number);
        } else {
          this.locked = true;
        }
        return { correct: true, ayahComplete: true, surahComplete: true };
      }

      this.message = perfect ? `★ Perfect ayah! ${summary || ""}`.trim() : (summary || "Correct. The oasis grows with your reading.");
      if (review) {
        this.reviewWord = review;
      } else {
        this.startAyah();
      }
      return { correct: true, ayahComplete: true };
    }

    // ---------- storage ----------

    loadProgressFor(number) {
      try {
        const raw = localStorage.getItem(`quran-trainer:surah-${number}:progress`);
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
          `quran-trainer:surah-${number}:progress`,
          JSON.stringify({ passed: this.currentAyahIndex, perfect: [] }),
        );
      } catch {}
    }

    loadStatsFor(number) {
      try {
        const raw = localStorage.getItem(`quran-trainer:stats:surah-${number}`);
        const data = raw ? JSON.parse(raw) : {};
        return data && typeof data === "object" ? data : {};
      } catch {
        return {};
      }
    }

    saveStatsFor(number) {
      try {
        localStorage.setItem(`quran-trainer:stats:surah-${number}`, JSON.stringify(this.stats));
      } catch {}
    }

    loadInterleaveFor(number) {
      try {
        const data = JSON.parse(localStorage.getItem(`quran-trainer:interleave:surah-${number}`) || "{}");
        return data && typeof data === "object" ? data : {};
      } catch {
        return {};
      }
    }

    saveInterleaveFor(number) {
      try {
        localStorage.setItem(`quran-trainer:interleave:surah-${number}`, JSON.stringify(this.interleave));
      } catch {}
    }
  }

  ns.TrainerEngine = TrainerEngine;
})(window.MiftahGame || (window.MiftahGame = {}));
