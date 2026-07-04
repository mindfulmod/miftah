// The Letter Garden engine — the from-zero foundation track that comes before
// the word trainer. A child who cannot read a single letter climbs this
// ladder: letter packs (shape families) → letter forms → harakat → long
// vowels & sukun → decoding real Quran words with real recitation audio.
// Completing the track unlocks the Courtyard Codex word desk.
//
// Mirrors TrainerEngine's shape: getView() hands the UI a view model, and
// choose(value) advances the state machine. Progress and per-item stats live
// in their own quran-trainer:letters:* keys.
(function (ns) {
  const PROGRESS_KEY = "quran-trainer:letters:progress";
  const STATS_KEY = "quran-trainer:letters:stats";
  // Small surahs that supply real example words (and their recitation clips)
  // for the letter cards and the final decoding unit.
  const EXAMPLE_SURAHS = [1, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
  const TATWEEL = "ـ";

  const DIACRITICS = /[ً-ْٰٓ-ٟؐ-ؚۖ-ۭـ]/g;
  const skeleton = (s) =>
    (s || "")
      .normalize("NFC")
      .replace(DIACRITICS, "")
      .replace(/[أإآٱ]/g, "ا");

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const pad3 = (n) => String(n).padStart(3, "0");

  // Contextual letter shapes, derived with tatweel joins. Non-connectors
  // (joins: false) keep their isolated shape at the start of a word and only
  // ever attach from the right.
  function formsOf(letter) {
    return {
      isolated: letter.char,
      initial: letter.joins ? letter.char + TATWEEL : letter.char,
      medial: letter.joins ? TATWEEL + letter.char + TATWEEL : TATWEEL + letter.char,
      final: TATWEEL + letter.char,
    };
  }

  const POSITION_LABELS = { initial: "at the START of a word", medial: "in the MIDDLE of a word", final: "at the END of a word" };

  class LetterEngine {
    constructor(onUnitComplete) {
      this.onUnitComplete = onUnitComplete || (() => "");
      this.data = ns.LETTERS_DATA;
      this.letters = this.data.packs.flatMap((p) => p.letters);
      this.letterByChar = new Map(this.letters.map((l) => [l.char, l]));
      this.units = this.buildUnits();
      this.progress = this.loadProgress();
      this.stats = this.loadStats();
      this.examples = new Map(); // letter char -> example word
      this.wordPool = []; // short real words for the decode unit
      this.unitIndex = this.firstOpenUnitIndex();
      this.phase = "learn"; // learn | quiz | unitDone | trackDone
      this.cardIndex = 0;
      this.cards = [];
      this.quiz = null;
      this.unitDone = null;
      this.message = "";
      this.loading = true;
      this.ready = this.init();
    }

    async init() {
      try {
        await this.loadExamplePool();
      } catch {}
      if (this.isComplete()) {
        this.phase = "trackDone";
      } else {
        this.enterUnit(this.unitIndex);
      }
      this.loading = false;
    }

    // ---------- curriculum ----------

    buildUnits() {
      const packs = this.data.packs;
      const units = packs.map((pack) => ({
        id: `pack-${pack.id}`,
        type: "letters",
        title: pack.name,
        icon: pack.letters[1] ? pack.letters[1].char : pack.letters[0].char,
        blurb: pack.blurb,
        pack,
      }));
      const joining = (from, to) =>
        packs.slice(from, to).flatMap((p) => p.letters).filter((l) => l.joins);
      units.push({
        id: "forms-1",
        type: "forms",
        title: "Shape Shifters I",
        icon: "ﺑ",
        blurb: "Letters change costume when they hold hands inside a word. Can you still spot them?",
        letters: joining(0, 4),
      });
      units.push({
        id: "forms-2",
        type: "forms",
        title: "Shape Shifters II",
        icon: "ﻌ",
        blurb: "The rest of the crew in their word costumes — start, middle and end.",
        letters: joining(4, 7),
      });
      units.push({
        id: "fatha",
        type: "harakat",
        title: "First Sounds — Fatha",
        icon: "بَ",
        blurb: "Letters start to SPEAK! The little slash on top says “a”.",
        vowels: [this.data.harakat[0]],
      });
      units.push({
        id: "kasra-damma",
        type: "harakat",
        title: "Kasra & Damma",
        icon: "بِ",
        blurb: "Two more sounds — “i” below the letter, “u” curled on top.",
        vowels: this.data.harakat.slice(1),
        mixAll: true,
      });
      units.push({
        id: "long-sounds",
        type: "madd",
        title: "Long Sounds & Stops",
        icon: "بَا",
        blurb: "Stretch a sound for two beats — and learn the little circle that means stop.",
      });
      units.push({
        id: "decode",
        type: "decode",
        title: "Read Real Words!",
        icon: "📖",
        blurb: "Real words from the Quran — sound them out, letter by letter. You can read!",
      });
      return units;
    }

    firstOpenUnitIndex() {
      const done = new Set(this.progress.done);
      const idx = this.units.findIndex((u) => !done.has(u.id));
      return idx < 0 ? this.units.length - 1 : idx;
    }

    unitStatus(unit) {
      const done = new Set(this.progress.done);
      if (done.has(unit.id)) return "done";
      return this.units.indexOf(unit) === this.firstOpenUnitIndex() ? "current" : "locked";
    }

    ladder() {
      return this.units.map((unit) => ({
        id: unit.id,
        title: unit.title,
        icon: unit.icon,
        status: this.unitStatus(unit),
        active: this.units[this.unitIndex] === unit && this.phase !== "trackDone",
      }));
    }

    // Overall track progress, for the tab chip and the study-desk gate.
    trackProgress() {
      return { done: this.progress.done.length, total: this.units.length };
    }

    isComplete() {
      const done = new Set(this.progress.done);
      return this.units.every((u) => done.has(u.id));
    }

    wordsUnlocked() {
      return this.progress.skipped || this.isComplete();
    }

    skipToWords() {
      this.progress.skipped = true;
      this.saveProgress();
    }

    // Jump to a done unit (replay) or the current one. Locked units refuse.
    selectUnit(id) {
      const idx = this.units.findIndex((u) => u.id === id);
      if (idx < 0) return false;
      const status = this.unitStatus(this.units[idx]);
      if (status === "locked") return false;
      this.enterUnit(idx);
      return true;
    }

    enterUnit(idx) {
      this.unitIndex = idx;
      this.phase = "learn";
      this.cards = this.buildCards(this.units[idx]);
      this.cardIndex = 0;
      this.quiz = null;
      this.unitDone = null;
      this.message = "";
    }

    get unit() {
      return this.units[this.unitIndex];
    }

    // ---------- example words from real surah data ----------

    async loadExamplePool() {
      const pool = [];
      const seen = new Set();
      const results = await Promise.allSettled(
        EXAMPLE_SURAHS.map(async (n) => {
          const res = await fetch(`data/surah-${n}.json`, { cache: "no-store" });
          if (!res.ok) throw new Error(String(res.status));
          return { n, data: await res.json() };
        }),
      );
      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        const { n, data } = r.value;
        for (const ayah of data.ayahs) {
          for (const w of ayah.words) {
            const skel = skeleton(w.arabic);
            if (!skel || seen.has(skel)) continue;
            seen.add(skel);
            pool.push({
              arabic: w.arabic,
              translit: (w.translit || "").toLowerCase(),
              english: w.english || "",
              skeleton: skel,
              audioPath: w.audio || `wbw/${pad3(n)}_${pad3(ayah.number)}_${pad3(w.position)}.mp3`,
            });
          }
        }
      }
      // Example word per letter: prefer a word that STARTS with it, shortest
      // first so the child can actually find the letter in it.
      const bySize = pool.slice().sort((a, b) => a.skeleton.length - b.skeleton.length);
      for (const letter of this.letters) {
        const starts = bySize.find((w) => w.skeleton.startsWith(letter.char));
        const contains = starts || bySize.find((w) => w.skeleton.includes(letter.char));
        if (contains) this.examples.set(letter.char, contains);
      }
      // Decoding pool: short, cleanly transliterated words.
      this.wordPool = pool.filter(
        (w) =>
          w.skeleton.length >= 2 &&
          w.skeleton.length <= 4 &&
          w.translit &&
          !w.translit.includes("-"),
      );
    }

    // ---------- learn cards ----------

    buildCards(unit) {
      if (unit.type === "letters") {
        return unit.pack.letters.map((letter) => {
          const example = this.examples.get(letter.char) || null;
          return {
            kind: "letter",
            big: letter.char,
            title: letter.name,
            sub: letter.sound,
            speak: letter.arName,
            example,
            letter,
          };
        });
      }
      if (unit.type === "forms") {
        const intro = {
          kind: "note",
          big: "بـ ـبـ ـب",
          title: "Letters change shape",
          sub: "At the start, in the middle and at the end of a word, a letter wears a different costume — but keeps its dots.",
        };
        const cards = unit.letters.slice(0, 6).map((letter) => {
          const f = formsOf(letter);
          return {
            kind: "forms",
            big: `${f.initial} ${f.medial} ${f.final}`,
            title: `${letter.name} in disguise`,
            sub: `${letter.char} at the start, middle and end — the dots give it away.`,
            speak: letter.arName,
            letter,
          };
        });
        return [intro, ...cards];
      }
      if (unit.type === "harakat") {
        const cards = [];
        for (const vowel of unit.vowels) {
          cards.push({
            kind: "harakah",
            big: `بـ${vowel.char}`.replace(TATWEEL, ""),
            title: `${vowel.name} — “${vowel.sound}”`,
            sub: vowel.blurb,
            speak: `ب${vowel.char}`,
          });
          const demo = ["ت", "م", "ن"].map((ch) => ch + vowel.char).join("  ");
          const demoTranslit = ["ت", "م", "ن"]
            .map((ch) => this.letterByChar.get(ch).translit + vowel.sound)
            .join(" · ");
          cards.push({
            kind: "harakah",
            big: demo,
            title: demoTranslit,
            sub: `Every letter can carry ${vowel.name}. Say each one out loud!`,
            speak: demo.replace(/ +/g, "، "),
          });
        }
        return cards;
      }
      if (unit.type === "madd") {
        const cards = this.data.longVowels.map((lv) => ({
          kind: "harakah",
          big: `ب${lv.vowel}${lv.char}`,
          title: `${lv.name} — “b${lv.suffix}${lv.suffix}”`,
          sub: lv.blurb,
          speak: `ب${lv.vowel}${lv.char}`,
        }));
        cards.push({
          kind: "harakah",
          big: `بَتْ`,
          title: `${this.data.sukun.name} — the stop sign`,
          sub: this.data.sukun.blurb,
          speak: "بَتْ",
        });
        return cards;
      }
      // decode
      return [
        {
          kind: "note",
          big: "بِسْمِ",
          title: "You can read this!",
          sub: "Real words from the Quran. Sound them out letter by letter — then hear the reciter say them. Take it slow.",
          speak: null,
        },
      ];
    }

    // ---------- quiz building ----------

    statFor(key) {
      if (!this.stats[key]) this.stats[key] = { miss: 0, correct: 0 };
      return this.stats[key];
    }

    exposures(key) {
      const s = this.stats[key];
      return s ? s.miss + s.correct : 0;
    }

    optionCount(key) {
      const seen = this.exposures(key);
      return seen >= 4 ? 4 : 3;
    }

    masteryTier(key) {
      const s = this.stats[key];
      if (!s) return 0;
      const total = s.miss + s.correct;
      const acc = total ? s.correct / total : 0;
      if (s.correct >= 6 && acc >= 0.85) return 3;
      if (s.correct >= 4 && acc >= 0.7) return 2;
      if (s.correct >= 2) return 1;
      return 0;
    }

    learnedLetters() {
      const done = new Set(this.progress.done);
      const learned = [];
      for (const unit of this.units) {
        if (unit.type === "letters" && (done.has(unit.id) || unit === this.unit)) {
          learned.push(...unit.pack.letters);
        }
      }
      return learned;
    }

    // Letters learned in EARLIER packs, weakest first — the review mix that
    // keeps old letters warm while new ones arrive.
    reviewLetters(excludePack) {
      const done = new Set(this.progress.done);
      const out = [];
      for (const unit of this.units) {
        if (unit.type !== "letters" || unit.pack === excludePack) continue;
        if (!done.has(unit.id)) continue;
        out.push(...unit.pack.letters);
      }
      return out.sort((a, b) => {
        const sa = this.stats[a.char];
        const sb = this.stats[b.char];
        const accA = sa ? sa.correct / Math.max(1, sa.correct + sa.miss) : 0;
        const accB = sb ? sb.correct / Math.max(1, sb.correct + sb.miss) : 0;
        return accA - accB;
      });
    }

    nameOptions(letter, pack) {
      const target = this.optionCount(letter.char);
      const options = [letter.name];
      const add = (l) => {
        if (l && options.length < target && !options.includes(l.name)) options.push(l.name);
      };
      for (const l of shuffle(pack ? pack.letters : [])) if (l !== letter) add(l);
      for (const l of shuffle(this.learnedLetters())) if (l !== letter) add(l);
      for (const l of shuffle(this.letters)) if (l !== letter) add(l);
      return shuffle(options);
    }

    charOptions(letter, pack) {
      const target = this.optionCount(letter.char);
      const options = [letter.char];
      const add = (l) => {
        if (l && options.length < target && !options.includes(l.char)) options.push(l.char);
      };
      for (const l of shuffle(pack ? pack.letters : [])) if (l !== letter) add(l);
      for (const l of shuffle(this.learnedLetters())) if (l !== letter) add(l);
      for (const l of shuffle(this.letters)) if (l !== letter) add(l);
      return shuffle(options);
    }

    buildQuiz(unit) {
      let questions = [];
      if (unit.type === "letters") questions = this.buildLetterQuestions(unit);
      else if (unit.type === "forms") questions = this.buildFormQuestions(unit);
      else if (unit.type === "harakat") questions = this.buildHarakatQuestions(unit);
      else if (unit.type === "madd") questions = this.buildMaddQuestions();
      else questions = this.buildDecodeQuestions();
      return { queue: shuffle(questions), total: questions.length, asked: 0, right: 0, mistakes: 0 };
    }

    buildLetterQuestions(unit) {
      const qs = [];
      for (const letter of unit.pack.letters) {
        qs.push({
          key: letter.char,
          prompt: "What is this letter's name?",
          big: letter.char,
          bigIsArabic: true,
          speak: letter.arName,
          options: this.nameOptions(letter, unit.pack),
          answer: letter.name,
          hint: letter.sound,
        });
        qs.push({
          key: letter.char,
          prompt: `Find the letter ${letter.name}`,
          big: letter.name,
          bigIsArabic: false,
          speak: letter.arName,
          options: this.charOptions(letter, unit.pack),
          optionsAreArabic: true,
          answer: letter.char,
          hint: letter.sound,
        });
      }
      for (const letter of this.reviewLetters(unit.pack).slice(0, 3)) {
        qs.push({
          key: letter.char,
          prompt: "↻ Quick review — what is this letter's name?",
          big: letter.char,
          bigIsArabic: true,
          speak: letter.arName,
          options: this.nameOptions(letter, null),
          answer: letter.name,
          hint: letter.sound,
        });
      }
      return qs;
    }

    buildFormQuestions(unit) {
      const qs = [];
      const positions = ["initial", "medial", "final"];
      unit.letters.forEach((letter, i) => {
        const pos = positions[i % positions.length];
        qs.push({
          key: letter.char,
          prompt: `Which letter is this, ${POSITION_LABELS[pos].toLowerCase()}?`,
          big: formsOf(letter)[pos],
          bigIsArabic: true,
          speak: letter.arName,
          options: this.charOptions(letter, null).map((ch) => ch),
          optionsAreArabic: true,
          answer: letter.char,
          hint: `It keeps its dots — ${letter.name}.`,
        });
      });
      for (const letter of shuffle(unit.letters).slice(0, 3)) {
        const pos = positions[Math.floor(Math.random() * positions.length)];
        const distractors = shuffle(unit.letters.filter((l) => l !== letter)).slice(0, 2);
        qs.push({
          key: letter.char,
          prompt: `How does ${letter.name} look ${POSITION_LABELS[pos].toLowerCase()}?`,
          big: letter.name,
          bigIsArabic: false,
          speak: letter.arName,
          options: shuffle([letter, ...distractors].map((l) => formsOf(l)[pos])),
          optionsAreArabic: true,
          answer: formsOf(letter)[pos],
          hint: `Look for the dots of ${letter.name}.`,
        });
      }
      return qs;
    }

    // Letters suitable for carrying a vowel in beginner syllables — alif is
    // left out (it needs hamza rules that come much later).
    syllableLetters(count) {
      const pool = this.letters.filter((l) => l.char !== "ا");
      const strong = pool
        .slice()
        .sort((a, b) => (this.stats[b.char]?.correct || 0) - (this.stats[a.char]?.correct || 0));
      return shuffle(strong.slice(0, Math.max(count * 2, 10))).slice(0, count);
    }

    syllableQuestion(letter, vowel, allVowels) {
      const syllable = letter.char + vowel.char;
      const sound = letter.translit + vowel.sound;
      const target = this.optionCount(syllable);
      const options = [sound];
      // The honest confusables: same letter with the OTHER vowels, then other
      // letters with the SAME vowel.
      for (const v of shuffle(allVowels)) {
        if (v !== vowel && options.length < target) {
          const o = letter.translit + v.sound;
          if (!options.includes(o)) options.push(o);
        }
      }
      for (const l of shuffle(this.letters.filter((x) => x.char !== "ا" && x !== letter))) {
        if (options.length >= target) break;
        const o = l.translit + vowel.sound;
        if (!options.includes(o)) options.push(o);
      }
      return {
        key: syllable,
        prompt: "Sound it out — what does this say?",
        big: syllable,
        bigIsArabic: true,
        speak: syllable,
        options: shuffle(options),
        answer: sound,
        hint: `${letter.name} + ${vowel.name}`,
      };
    }

    reverseSyllableQuestion(letter, vowel, allVowels) {
      const syllable = letter.char + vowel.char;
      const sound = letter.translit + vowel.sound;
      const options = [syllable];
      for (const v of allVowels) {
        if (v !== vowel && options.length < 3) options.push(letter.char + v.char);
      }
      const other = shuffle(this.letters.filter((x) => x.char !== "ا" && x !== letter))[0];
      if (other) options.push(other.char + vowel.char);
      return {
        key: syllable,
        prompt: `Find “${sound}”`,
        big: sound,
        bigIsArabic: false,
        options: shuffle(options),
        optionsAreArabic: true,
        answer: syllable,
        hint: `${letter.name} + ${vowel.name}`,
      };
    }

    buildHarakatQuestions(unit) {
      const allVowels = this.data.harakat;
      const activeVowels = unit.mixAll ? allVowels : unit.vowels;
      const qs = [];
      const letters = this.syllableLetters(unit.mixAll ? 5 : 6);
      for (const letter of letters) {
        for (const vowel of unit.vowels) {
          qs.push(this.syllableQuestion(letter, vowel, allVowels));
        }
      }
      for (const letter of shuffle(letters).slice(0, 3)) {
        const vowel = activeVowels[Math.floor(Math.random() * activeVowels.length)];
        qs.push(this.reverseSyllableQuestion(letter, vowel, allVowels));
      }
      return qs;
    }

    buildMaddQuestions() {
      const qs = [];
      const letters = this.syllableLetters(4);
      for (const lv of this.data.longVowels) {
        for (const letter of letters.slice(0, 2)) {
          const word = letter.char + lv.vowel + lv.char;
          const sound = letter.translit + lv.suffix + lv.suffix;
          const short = letter.translit + lv.suffix;
          const options = shuffle([
            sound,
            short,
            letter.translit + shuffle(this.data.longVowels.filter((x) => x !== lv))[0].suffix.repeat(2),
          ]);
          qs.push({
            key: word,
            prompt: "Long or short? Sound it out.",
            big: word,
            bigIsArabic: true,
            speak: word,
            options,
            answer: sound,
            hint: lv.blurb,
          });
        }
      }
      // Sukun: tiny closed syllables like بَتْ “bat”.
      const simple = this.letters.filter((l) => /^[a-z]$/.test(l.translit));
      for (let i = 0; i < 3 && simple.length >= 2; i += 1) {
        const [a, b] = shuffle(simple).slice(0, 2);
        const word = a.char + "َ" + b.char + "ْ";
        const sound = a.translit + "a" + b.translit;
        const options = shuffle([
          sound,
          a.translit + "a" + shuffle(simple.filter((x) => x !== b && x !== a))[0].translit,
          b.translit + "a" + a.translit,
        ]);
        qs.push({
          key: word,
          prompt: "The circle means stop — what does this say?",
          big: word,
          bigIsArabic: true,
          speak: word,
          options,
          answer: sound,
          hint: `${a.name}, then ${b.name} with sukun.`,
        });
      }
      return qs;
    }

    buildDecodeQuestions() {
      const pool = this.wordPool.length
        ? this.wordPool
        : // Offline fallback: a tiny curated set with deterministic clip paths.
          [
            { arabic: "قُلْ", translit: "qul", english: "Say", audioPath: "wbw/112_001_001.mp3", skeleton: "قل" },
            { arabic: "هُوَ", translit: "huwa", english: "He", audioPath: "wbw/112_001_002.mp3", skeleton: "هو" },
            { arabic: "أَحَدٌ", translit: "aḥadun", english: "One", audioPath: "wbw/112_001_004.mp3", skeleton: "احد" },
            { arabic: "لَمْ", translit: "lam", english: "not", audioPath: "wbw/112_003_001.mp3", skeleton: "لم" },
            { arabic: "مِن", translit: "min", english: "from", audioPath: "wbw/113_002_002.mp3", skeleton: "من" },
          ];
      const picks = shuffle(pool).slice(0, 10);
      return picks.map((word, i) => {
        const distractors = shuffle(pool.filter((w) => w !== word));
        if (i % 3 === 2) {
          // Listen → find the word (real recitation audio).
          const options = [word.arabic, ...distractors.slice(0, 2).map((w) => w.arabic)];
          return {
            key: word.arabic,
            prompt: "Listen — which word did the reciter say?",
            big: "🔊",
            bigIsArabic: false,
            listen: true,
            audioPath: word.audioPath,
            options: shuffle(options),
            optionsAreArabic: true,
            answer: word.arabic,
            hint: `It means “${word.english}”.`,
            reward: word,
          };
        }
        const target = this.optionCount(word.arabic);
        const options = [word.translit];
        for (const w of distractors) {
          if (options.length >= target) break;
          if (!options.includes(w.translit)) options.push(w.translit);
        }
        return {
          key: word.arabic,
          prompt: "Sound it out — what does this word say?",
          big: word.arabic,
          bigIsArabic: true,
          options: shuffle(options),
          answer: word.translit,
          hint: `It means “${word.english}”.`,
          reward: word,
        };
      });
    }

    // ---------- state machine ----------

    startQuiz() {
      this.quiz = this.buildQuiz(this.unit);
      this.phase = "quiz";
      this.message = "";
    }

    nextCard() {
      if (this.cardIndex < this.cards.length - 1) this.cardIndex += 1;
      else this.startQuiz();
    }

    prevCard() {
      if (this.cardIndex > 0) this.cardIndex -= 1;
    }

    currentQuestion() {
      return this.quiz && this.quiz.queue.length ? this.quiz.queue[0] : null;
    }

    choose(value, game) {
      const q = this.currentQuestion();
      if (!q) return { correct: false };
      const correct = value === q.answer;
      this.quiz.asked += 1;
      const stat = this.statFor(q.key);
      if (correct) {
        stat.correct += 1;
        this.quiz.right += 1;
        this.quiz.queue.shift();
        this.message = "";
      } else {
        stat.miss += 1;
        this.quiz.mistakes += 1;
        // The missed item goes to the back of the line — the quiz only ends
        // once every item has been answered right.
        this.quiz.queue.push(this.quiz.queue.shift());
        this.message = q.hint ? `Not yet — ${q.hint}. It'll come back around.` : "Not yet — it'll come back around.";
      }
      this.saveStats();

      if (correct && !this.quiz.queue.length) {
        return { correct: true, unitComplete: true, ...this.completeUnit(game) };
      }
      return { correct, advanced: true };
    }

    completeUnit(game) {
      const unit = this.unit;
      const newlyDone = !this.progress.done.includes(unit.id);
      if (newlyDone) {
        this.progress.done.push(unit.id);
        this.saveProgress();
      }
      const trackComplete = this.isComplete();
      // Island rewards fire only on first completion — replays keep the
      // practice, not the payout.
      const summary = newlyDone ? this.onUnitComplete(game) : "";
      const nextIdx = this.firstOpenUnitIndex();
      this.unitDone = {
        title: unit.title,
        perfect: this.quiz.mistakes === 0,
        asked: this.quiz.asked,
        total: this.quiz.total,
        newlyDone,
        trackComplete,
        summary: summary || "",
        nextTitle: trackComplete ? "" : this.units[nextIdx].title,
      };
      this.phase = "unitDone";
      return { trackComplete };
    }

    continueFromUnitDone() {
      this.unitDone = null;
      if (this.isComplete()) {
        this.phase = "trackDone";
        return;
      }
      this.enterUnit(this.firstOpenUnitIndex());
    }

    // ---------- view model ----------

    getView() {
      if (this.loading) return { mode: "loading" };
      const base = {
        ladder: this.ladder(),
        track: this.trackProgress(),
        unitTitle: this.unit ? this.unit.title : "",
        unitBlurb: this.unit ? this.unit.blurb : "",
        message: this.message,
      };
      if (this.phase === "trackDone") return { ...base, mode: "trackDone" };
      if (this.phase === "unitDone") return { ...base, mode: "unitDone", unitDone: { ...this.unitDone } };
      if (this.phase === "quiz") {
        const q = this.currentQuestion();
        if (!q) return { ...base, mode: "loading" };
        return {
          ...base,
          mode: "quiz",
          prompt: q.prompt,
          big: q.big,
          bigIsArabic: !!q.bigIsArabic,
          listen: !!q.listen,
          speak: q.speak || "",
          audioPath: q.audioPath || "",
          options: q.options,
          optionsAreArabic: !!q.optionsAreArabic,
          answer: q.answer,
          reward: q.reward || null,
          meter: `${Math.min(this.quiz.right + 1, this.quiz.total)}/${this.quiz.total} · ${this.quiz.queue.length} to go`,
          mastery: this.masteryTier(q.key),
        };
      }
      const card = this.cards[this.cardIndex];
      return {
        ...base,
        mode: "learn",
        card: { ...card },
        cardIndex: this.cardIndex,
        cardTotal: this.cards.length,
        isLast: this.cardIndex >= this.cards.length - 1,
      };
    }

    // ---------- storage ----------

    loadProgress() {
      try {
        const data = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
        return {
          done: Array.isArray(data.done) ? data.done : [],
          skipped: !!data.skipped,
        };
      } catch {
        return { done: [], skipped: false };
      }
    }

    saveProgress() {
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(this.progress));
      } catch {}
    }

    loadStats() {
      try {
        const data = JSON.parse(localStorage.getItem(STATS_KEY) || "{}");
        return data && typeof data === "object" ? data : {};
      } catch {
        return {};
      }
    }

    saveStats() {
      try {
        localStorage.setItem(STATS_KEY, JSON.stringify(this.stats));
      } catch {}
    }
  }

  ns.LetterEngine = LetterEngine;
})(window.MiftahGame || (window.MiftahGame = {}));
