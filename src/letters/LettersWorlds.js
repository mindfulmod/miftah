// The Letter Garden game's curriculum: the same 13 units as the Codex track
// (identical ids, identical quran-trainer:letters:progress storage), mapped
// into wordless game worlds. Each world supplies "items" — things a child
// can see and hear (Arabic display + something to speak or a real clip) —
// and the mini-games quiz those items without a single written instruction.
(function (ns) {
  const TATWEEL = "ـ";
  const DIACRITICS = /[ً-ْٰٓ-ٟؐ-ؚۖ-ۭـ]/g;
  const skeleton = (s) =>
    (s || "").normalize("NFC").replace(DIACRITICS, "").replace(/[أإآٱ]/g, "ا");
  const pad3 = (n) => String(n).padStart(3, "0");
  const MARKS = /[ً-ْٰٓ-ٟؐ-ؚۖ-ۭ]/g;
  const BASE_MARKS = new Set(["َ", "ِ", "ُ"]);
  const TANWEEN_MARKS = new Set(["ً", "ٍ", "ٌ"]);
  const STANDING_MARKS = new Set(["ٰ", "ٖ", "ٗ"]);

  const formsOf = (l) => ({
    isolated: l.char,
    initial: l.joins ? l.char + TATWEEL : l.char,
    medial: l.joins ? TATWEEL + l.char + TATWEEL : TATWEEL + l.char,
    final: TATWEEL + l.char,
  });

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  class LettersWorlds {
    constructor() {
      this.data = ns.LETTERS_DATA;
      this.letters = this.data.packs.flatMap((p) => p.letters);
      this.examplePool = []; // real short Quran words, loaded async
      this.worlds = this.buildWorlds();
    }

    // Same sources as LetterEngine: the short surahs give the decode world
    // its real words with real recitation clips.
    async loadWords() {
      const surahs = [1, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
      const results = await Promise.allSettled(surahs.map(async n => {
        const controller = new AbortController();
        const request = (async () => {
          const res = await fetch(`data/surah-${n}.json`, {signal:controller.signal});
          if (!res.ok) throw new Error(String(res.status));
          return {n,data:await res.json()};
        })();
        return ns.LettersBoot.settle(request, 5000, () => controller.abort());
      }));
      const seen = new Set(this.examplePool.map(w=>w.skel));
      for (const result of results) {
        if (result.status !== 'fulfilled' || !result.value) continue;
        const {n,data}=result.value;
        if (!Array.isArray(data?.ayahs)) continue;
        // Ayah Garden (v15) reads whole surahs, so keep them, not just words.
        (this.surahs ||= new Map()).set(n, { number: n, name: data.surah?.name || '', ayahs: data.ayahs.filter(a => Array.isArray(a?.words)).map(a => ({ number: a.number, words: a.words.filter(w => typeof w?.arabic === 'string').map(w => ({ arabic: w.arabic, audioPath: w.audio || `wbw/${pad3(n)}_${pad3(a.number)}_${pad3(w.position)}.mp3` })) })) });
        for (const ayah of data.ayahs) {
          if (!Array.isArray(ayah?.words)) continue;
          for (const w of ayah.words) {
            if(typeof w?.arabic !== 'string')continue;
            const skel=skeleton(w.arabic);
            if (!skel || skel.length<2 || skel.length>5 || seen.has(skel))continue;
            seen.add(skel);
            this.examplePool.push({id:w.arabic,display:w.arabic,speak:'',skel,
              audioPath:w.audio || `wbw/${pad3(n)}_${pad3(ayah.number)}_${pad3(w.position)}.mp3`});
          }
        }
      }
      this.refreshWordCatalogues();
    }

    // A thin band stays thin. Borrowing a longer or not-yet-taught word makes
    // an apparently easy chapter dishonest; callers repeat or omit instead.
    wordPool(minLen, maxLen, prerequisiteWorldIds = this.worlds?.map((w) => w.id) || []) {
      const taught = new Set(prerequisiteWorldIds);
      return this.examplePool.filter((word) => {
        const tags = this.wordTags(word.display);
        return tags.wordLength >= minLen && tags.wordLength <= maxLen
          && tags.valid && tags.prerequisiteWorldIds.every((id) => taught.has(id));
      });
    }

    wordTags(arabic) {
      const normalized = (arabic || "").normalize("NFC");
      const knownLetters = new Set(this.letters.map((l) => l.char));
      const baseLetters = [...skeleton(normalized)];
      const rawMarks = normalized.match(MARKS) || [];
      const recognized = rawMarks.every((mark) =>
        BASE_MARKS.has(mark) || TANWEEN_MARKS.has(mark) || STANDING_MARKS.has(mark) || mark === "ْ" || mark === "ّ"
      );
      const validBases = baseLetters.every((letter) => knownLetters.has(letter));
      const prerequisiteWorldIds = [];
      const require = (id) => { if (!prerequisiteWorldIds.includes(id)) prerequisiteWorldIds.push(id); };
      if (rawMarks.some((m) => BASE_MARKS.has(m))) require(rawMarks.some((m) => m === "ِ" || m === "ُ") ? "kasra-damma" : "fatha");
      if (rawMarks.some((m) => TANWEEN_MARKS.has(m))) require("tanween");
      if (rawMarks.some((m) => STANDING_MARKS.has(m))) require("standing");
      if (rawMarks.includes("ْ")) require("sukoon");
      if (rawMarks.includes("ّ")) require("shaddah");
      return {
        valid: !!normalized && recognized && validBases,
        prerequisiteWorldIds,
        wordLength: skeleton(normalized).length,
        marks: [...new Set(rawMarks)],
        joiningFeatures: baseLetters.some((letter, i) => i < baseLetters.length - 1 && this.letters.find((l) => l.char === letter)?.joins)
          ? ["connected"] : ["disconnected"],
      };
    }

    buildWorlds() {
      const hues = [150, 200, 28, 268, 190, 8, 322, 95, 230, 260, 45, 175, 15, 288, 205, 130, 335, 70, 245, 25, 165, 300];
      const worlds = [];

      this.data.packs.forEach((pack, i) => {
        const catalogue = pack.letters.map((l) => ({ id: l.char, display: l.char, speak: l.arName }));
        worlds.push({
          id: `pack-${pack.id}`,
          hue: 0,
          icon: pack.letters[1] ? pack.letters[1].char : pack.letters[0].char,
          kind: "letters",
          meet: pack.letters.map((l) => ({ display: l.char, speak: l.arName, letter: l })),
          catalogue,
          items: () => catalogue.slice(),
          // Earlier letters sneak back in as extra distractors once known.
          extraItems: (doneIds = []) =>
            this.data.packs.slice(0, i)
              .filter((earlier) => doneIds.includes(`pack-${earlier.id}`))
              .flatMap((earlier) => earlier.letters.map((l) => ({
                id: l.char, display: l.char, speak: l.arName, objective: "letter-name",
                prerequisiteWorldIds: [`pack-${earlier.id}`],
              }))),
          // Every pack writes (trace); the rest of the menu alternates so
          // neighbouring packs never feel like reruns.
          games: i % 2 === 0 ? ["pop", "trace", "feed"] : ["pairs", "trace", "pop"],
        });
      });

      // The joining stage (locked 2026-07-18, replaces the old forms worlds):
      // Noorani Qaida lesson 2 — murakkabat. A fused shape speaks its
      // letters' NAMES in reading order ("ba… ta"), never a vowelled sound,
      // so the lesson is purely "letters change shape when they hold hands".
      // The merge EVENT is the curriculum — fuse, un-fuse, chain, parade.
      for (const [i, range] of [[0, 4], [4, 7]].entries()) {
        const rangeLetters = this.data.packs.slice(range[0], range[1]).flatMap((p) => p.letters);
        const firsts = rangeLetters.filter((l) => l.joins);
        // Canonical partners (each joiner holds the NEXT letter's hand) keep
        // item ids stable across sessions, so the strength model can track
        // each pair as one skill instead of chasing random couples.
        const partnerOf = (l) => rangeLetters[(rangeLetters.indexOf(l) + 1) % rangeLetters.length];
        const pairItem = (l1, l2) => ({
          id: l1.char + l2.char,
          display: l1.char + l2.char,
          speak: `${l1.arName}، ${l2.arName}`,
          // join2 marks pairs whose SECOND letter also joins — only those can
          // grow a third letter in the chain game.
          join2: !!l2.joins,
          parts: [
            { display: l1.char, speak: l1.arName },
            { display: l2.char, speak: l2.arName },
          ],
        });
        const catalogue = firsts.map((l) => pairItem(l, partnerOf(l)));
        worlds.push({
          id: `join-${i + 1}`,
          icon: i === 0 ? "بت" : "عم",
          kind: "join",
          meet: firsts.slice(0, 3).map((l) => {
            const item = pairItem(l, partnerOf(l));
            return { display: item.display, speak: item.speak, parts: item.parts };
          }),
          catalogue,
          items: () => shuffle(catalogue),
          // The range's single letters ride along: un-fuse verdicts, chain
          // thirds and decoys all draw from here.
          extraItems: () =>
            rangeLetters.map((l) => ({
              id: l.char, display: l.char, speak: l.arName, joins: !!l.joins,
              objective: "letter-name", prerequisiteWorldIds: [`join-${i + 1}`],
            })),
          games: i === 0 ? ["fuse", "unfuse", "parade"] : ["fuse", "chain", "unfuse"],
        });
      }

      // Noorani Qaida lesson 3: the mystery letters that open surahs, read
      // by their letter NAMES — a beloved early win, and pure letter review.
      const letterByChar = new Map(this.letters.map((l) => [l.char, l]));
      const nameSeq = (combo) =>
        [...combo].map((ch) => (letterByChar.get(ch) || { arName: ch }).arName).join("، ");
      worlds.push({
        id: "muqattaat",
        icon: "الم",
        kind: "muqattaat",
        meet: [
          {
            display: "الم",
            speak: nameSeq("الم"),
            title: "The mystery letters",
            sub: "Some surahs open with secret letters. Read each one by its NAME: Alif… Lam… Meem.",
            parts: [..."الم"].map((ch) => ({
              display: ch,
              speak: (letterByChar.get(ch) || { arName: ch }).arName,
            })),
          },
          {
            display: "طه",
            speak: nameSeq("طه"),
            parts: [..."طه"].map((ch) => ({
              display: ch,
              speak: (letterByChar.get(ch) || { arName: ch }).arName,
            })),
          },
          {
            display: "يس",
            speak: nameSeq("يس"),
            parts: [..."يس"].map((ch) => ({
              display: ch,
              speak: (letterByChar.get(ch) || { arName: ch }).arName,
            })),
          },
        ],
        catalogue: this.data.muqattaat.map((combo) => ({
            id: combo,
            display: combo,
            speak: nameSeq(combo),
            parts: [...combo].map((ch) => ({
              id: ch,
              display: ch,
              speak: (letterByChar.get(ch) || { arName: ch }).arName,
            })),
          })),
        games: ["pop", "build", "feed"],
      });
      const muqattaatWorld = worlds[worlds.length - 1];
      muqattaatWorld.items = () => shuffle(muqattaatWorld.catalogue);

      const syllableLetters = () =>
        shuffle(this.letters.filter((l) => l.char !== "ا")).slice(0, 6);
      // The blending decomposition: a syllable is its letter plus its vowel,
      // shown riding a tatweel stroke (Amiri Quran has no dotted carrier).
      const syllableParts = (l, v) => [
        { display: l.char, speak: l.arName },
        { display: TATWEEL + v.char, speak: v.arName },
      ];
      const meetBa = this.letters.find((l) => l.char === "ب");
      const vowelWorld = (id, icon, vowels) => {
        const makeItem = (l, v) => ({
          id: l.char + v.char,
          display: l.char + v.char,
          speak: l.char + v.char,
          marks: [v.char],
          parts: syllableParts(l, v),
        });
        const catalogue = this.letters.filter((l) => l.char !== "ا")
          .flatMap((l) => vowels.map((v) => makeItem(l, v)));
        return {
        id, icon, kind: "syllables", catalogue,
        // parts feed the make-it-happen intro: the child fuses ب + the mark
        // to cause the reveal.
        meet: vowels.map((v) => ({
          display: `ب${v.char}`,
          speak: `ب${v.char}`,
          vowel: v,
          parts: meetBa ? syllableParts(meetBa, v) : undefined,
        })),
        items: () => syllableLetters().flatMap((l) => vowels.map((v) => makeItem(l, v))),
        games: ["pop", "catch", "feed"],
      }};
      // The blend machine leads both vowel worlds — fusing letter + haraka
      // IS the lesson; pop/trace/catch then rehearse what the fuse taught.
      worlds.push({ ...vowelWorld("fatha", "بَ", [this.data.harakat[0]]), games: ["blend", "pop", "trace"] });
      worlds.push({ ...vowelWorld("kasra-damma", "بِ", this.data.harakat.slice(1)), games: ["blend", "pop", "catch"] });

      // Noorani Qaida lesson 5–6: tanween — and lesson 6's exercise is baked
      // in: plain-harakat syllables join the pool, so بَ and بً sit side by
      // side and the child must hear one "n" of difference.
      const tanweenWorld = { ...vowelWorld("tanween", "بً", this.data.tanween), games: ["pop", "build", "feed"] };
      const tanweenBase = tanweenWorld.items;
      const baseContrastCatalogue = this.letters.filter((l) => l.char !== "ا").flatMap((l) =>
        this.data.harakat.slice(0, 2).map((v) => ({
          id: l.char + v.char, display: l.char + v.char, speak: l.char + v.char,
          marks: [v.char], parts: syllableParts(l, v),
        })),
      );
      tanweenWorld.catalogue = tanweenWorld.catalogue.concat(baseContrastCatalogue);
      tanweenWorld.items = () => {
        const items = tanweenBase();
        for (const l of shuffle(this.letters.filter((x) => x.char !== "ا")).slice(0, 2)) {
          for (const v of this.data.harakat.slice(0, 2)) {
            items.push({
              id: l.char + v.char,
              display: l.char + v.char,
              speak: l.char + v.char,
              parts: syllableParts(l, v),
            });
          }
        }
        return items;
      };
      worlds.push(tanweenWorld);

      // Lesson 7: standing vowels. The display wears the tiny mark; the
      // spoken form is its long-vowel twin so TTS says the right sound.
      const standingItem = (l, sv) => ({
        id: l.char + sv.char,
        display: l.char + sv.char,
        speak: sv.speakAs(l.char),
        marks: [sv.char],
        parts: [
          { display: l.char, speak: l.arName },
          { display: TATWEEL + sv.char, speak: sv.speakAs("ب") },
        ],
      });
      const standingCatalogue = this.letters.filter((l) => l.char !== "ا")
        .flatMap((l) => this.data.standing.map((sv) => standingItem(l, sv)));
      worlds.push({
        id: "standing",
        icon: "بٰ",
        kind: "syllables",
        meet: this.data.standing.map((sv) => ({
          display: `ب${sv.char}`,
          speak: sv.speakAs("ب"),
          sub: sv.blurb,
        })),
        catalogue: standingCatalogue,
        items: () => syllableLetters().flatMap((l) => this.data.standing.map((sv) => standingItem(l, sv))),
        games: ["pop", "feed", "catch"],
      });

      // Lesson 8a: pure madd — the three stretching letters, nothing else.
      const longSoundItem = (l, lv) => ({
        id: l.char + lv.vowel + lv.char,
        display: l.char + lv.vowel + lv.char,
        speak: l.char + lv.vowel + lv.char,
        marks: [lv.vowel],
        joiningFeatures: ["long-vowel"],
        parts: [
          { display: l.char + lv.vowel, speak: l.char + lv.vowel },
          { display: lv.char, speak: letterByChar.get(lv.char).arName },
        ],
      });
      const longSoundCatalogue = this.letters.filter((l) => l.char !== "ا")
        .flatMap((l) => this.data.longVowels.map((lv) => longSoundItem(l, lv)));
      worlds.push({
        id: "long-sounds",
        icon: "بَا",
        kind: "syllables",
        meet: this.data.longVowels.map((lv) => ({
          display: `ب${lv.vowel}${lv.char}`,
          speak: `ب${lv.vowel}${lv.char}`,
        })),
        catalogue: longSoundCatalogue,
        items: () => {
          const letters = syllableLetters().slice(0, 4);
          const items = [];
          for (const lv of this.data.longVowels) {
            for (const l of letters) {
              items.push(longSoundItem(l, lv));
            }
          }
          return items;
        },
        games: ["build", "pop", "pairs"],
      });

      // Lesson 8b: the leen glide — fatha then a resting Waw or Ya.
      const leenItem = (l, ln) => ({
        id: l.char + "َ" + ln.char,
        display: l.char + "َ" + ln.char,
        speak: l.char + "َ" + ln.char,
        marks: ["َ", "ْ"],
        joiningFeatures: ["leen"],
        parts: [
          { display: l.char + "َ", speak: l.char + "َ" },
          { display: ln.char, speak: "" },
        ],
      });
      const leenCatalogue = this.letters.filter((l) => l.char !== "ا")
        .flatMap((l) => this.data.leen.map((ln) => leenItem(l, ln)));
      worlds.push({
        id: "leen",
        icon: "بَوْ",
        kind: "syllables",
        meet: this.data.leen.map((ln) => ({
          display: `بَ${ln.char}`,
          speak: `بَ${ln.char}`,
          sub: ln.blurb,
        })),
        catalogue: leenCatalogue,
        items: () => syllableLetters().slice(0, 5).flatMap((l) => this.data.leen.map((ln) => leenItem(l, ln))),
        games: ["pop", "build", "feed"],
      });

      // Lessons 10–11: sukoon gets its own world — closed syllables with
      // every short vowel, not just fatha.
      const sukoonCatalogue = [
        { id: "بَتْ", display: "بَتْ", speak: "بَتْ", marks: ["َ", "ْ"], parts: [
          { display: "بَ", speak: "بَ" }, { display: "تْ", speak: "تَاءْ" },
        ] },
        { id: "مِنْ", display: "مِنْ", speak: "مِنْ", marks: ["ِ", "ْ"], parts: [
          { display: "مِ", speak: "مِ" }, { display: "نْ", speak: "نُونْ" },
        ] },
        { id: "كُمْ", display: "كُمْ", speak: "كُمْ", marks: ["ُ", "ْ"], parts: [
          { display: "كُ", speak: "كُ" }, { display: "مْ", speak: "مِيمْ" },
        ] },
      ];
      worlds.push({
        id: "sukoon",
        icon: "بَتْ",
        kind: "syllables",
        meet: [
          { display: "بَتْ", speak: "بَتْ", sub: this.data.sukun.blurb },
          { display: "مِنْ", speak: "مِنْ" },
          { display: "كُمْ", speak: "كُمْ" },
        ],
        catalogue: sukoonCatalogue,
        items: () => shuffle(sukoonCatalogue),
        games: ["build", "pop", "catch"],
      });

      // Lessons 12–13: shaddah — the doubling mark, pressed and held.
      const shaddahCatalogue = [
        { id: "بَدَّ", display: "بَدَّ", speak: "بَدَّ", marks: ["َ", "ّ"], parts: [
          { display: "بَ", speak: "بَ" }, { display: "دَّ", speak: "دَّ" },
        ] },
        { id: "رَبَّ", display: "رَبَّ", speak: "رَبَّ", marks: ["َ", "ّ"], parts: [
          { display: "رَ", speak: "رَ" }, { display: "بَّ", speak: "بَّ" },
        ] },
      ];
      worlds.push({
        id: "shaddah",
        icon: "بَّ",
        kind: "syllables",
        meet: [
          { display: "بَدَّ", speak: "بَدَّ", sub: this.data.shaddah.blurb },
          { display: "رَبَّ", speak: "رَبَّ" },
        ],
        catalogue: shaddahCatalogue,
        items: () => shuffle(shaddahCatalogue),
        games: ["pop", "build", "feed"],
      });

      // Lessons 14–16: shaddah in company — with tanween (a real Quran
      // pattern: حَبٌّ) and with the madd letters.
      const shaddahMixCatalogue = [
        { id: "حَبٌّ", display: "حَبٌّ", speak: "حَبٌّ", marks: ["َ", "ٌ", "ّ"], parts: [
          { display: "حَ", speak: "حَ" }, { display: "بٌّ", speak: "بٌّ" },
        ] },
        { id: "شَدَّا", display: "شَدَّا", speak: "شَدَّا", marks: ["َ", "ّ"], joiningFeatures: ["long-vowel"], parts: [
          { display: "شَ", speak: "شَ" }, { display: "دَّا", speak: "دَّا" },
        ] },
      ];
      worlds.push({
        id: "shaddah-mix",
        icon: "بٌّ",
        kind: "syllables",
        meet: [
          { display: "حَبٌّ", speak: "حَبٌّ" },
          { display: "شَدَّا", speak: "شَدَّا" },
        ],
        catalogue: shaddahMixCatalogue,
        items: () => shuffle(shaddahMixCatalogue),
        games: ["pop", "build", "pairs"],
      });

      // A word's build-parts: its letter clusters (base + marks), so real
      // words can be blended piece by piece.
      const clusterSplit = (arabic) => {
        const clusters = [];
        for (const ch of arabic.normalize("NFC")) {
          if (/[ً-ْٰٓ-ٟؐ-ؚۖ-ۭ]/.test(ch) && clusters.length) clusters[clusters.length - 1] += ch;
          else clusters.push(ch);
        }
        return clusters;
      };
      this.clusterSplit = clusterSplit;
      const addWordWorld = (id, icon, minLen, maxLen, games) => {
        const world = { id, icon, kind: "words", meet: [], catalogue: [], wordBand: [minLen, maxLen], games };
        world.items = () => shuffle(world.catalogue).slice(0, 8);
        worlds.push(world);
      };

      // The word ramp: two-letter words, then three, then the long ones —
      // each with the reciter's real audio.
      addWordWorld("words-2", "مِن", 2, 2, ["feed", "build", "pop"]);
      addWordWorld("decode", "📖", 3, 3, ["feed", "build", "pop"]);
      addWordWorld("decode-4", "📗", 4, 5, ["feed", "pop", "pairs"]);

      // Biome chapters (specs/02): each stretch of the qaida ladder lives in
      // its own land, so progress feels like TRAVEL — letters meadow, syllable
      // orchard, long-sound lagoon, sukoon night-garden, shaddah peaks, and
      // the decode riverlands at the summit.
      const biomeOf = (w) => {
        if (w.kind === "letters" || w.kind === "join" || w.kind === "muqattaat") return "meadow";
        if (["fatha", "kasra-damma", "tanween", "standing"].includes(w.id)) return "orchard";
        if (["long-sounds", "leen"].includes(w.id)) return "lagoon";
        if (w.id === "sukoon") return "night";
        if (w.id.startsWith("shaddah")) return "peaks";
        return "river";
      };
      worlds.forEach((w, i) => {
        w.hue = hues[i % hues.length];
        w.biome = biomeOf(w);
        w.objective = w.kind === "letters" ? "letter-name"
          : w.kind === "join" || w.kind === "muqattaat" ? "sequence-recognition"
          : w.kind === "words" ? "word-reading" : "syllable";
        w.prerequisiteWorldIds = i ? [worlds[i - 1].id] : [];
        w.onboarding = w.kind === "join" || w.kind === "muqattaat"
          ? { voicing: "letter-names", support: "visible" }
          : w.kind === "words" ? { voicing: "decoding", support: "visible" }
          : undefined;
        const originalItems = w.items;
        w.items = () => originalItems().map((item) => this.tagItem(item, w));
        w.catalogue.forEach((item) => this.tagItem(item, w));
        w.catalogueItems = () => w.catalogue.slice();
      });
      return worlds;
    }

    tagItem(item, world) {
      item.objective = item.objective || world.objective;
      item.worldId = item.worldId || world.id;
      const requirements = [...world.prerequisiteWorldIds, ...(item.prerequisiteWorldIds || [])];
      item.prerequisiteWorldIds = [...new Set(requirements)];
      if (world.kind === "words" && item.wordLength === undefined) item.wordLength = skeleton(item.display).length;
      return item;
    }

    refreshWordCatalogues() {
      if (!this.worlds) return;
      const taughtBeforeWords = this.worlds.slice(0, this.worlds.findIndex((w) => w.id === "words-2")).map((w) => w.id);
      for (const world of this.worlds.filter((w) => w.kind === "words")) {
        const [minLen, maxLen] = world.wordBand;
        world.catalogue.length = 0;
        for (const word of this.wordPool(minLen, maxLen, taughtBeforeWords)) {
          const clusters = this.clusterSplit(word.display);
          const tags = this.wordTags(word.display);
          world.catalogue.push(this.tagItem({
            ...word,
            ...tags,
            parts: clusters.length >= 2 && clusters.length <= 3
              ? clusters.map((cluster) => ({ display: cluster, speak: cluster })) : undefined,
          }, world));
        }
      }
    }

    // The check-up (Big Brain Academy's Test mode, kid-sized): one quick
    // round per SKILL, drawn only from material the child has already met.
    // Skills without material yet simply aren't tested — their petal stays
    // a bud. Returns null until at least one letter pack is done.
    checkupPlan(doneIds) {
      const doneLetters = this.data.packs
        .filter((p) => doneIds.includes(`pack-${p.id}`))
        .flatMap((p) => p.letters);
      if (!doneLetters.length) return null;
      const letterItems = () =>
        shuffle(doneLetters).map((l) => ({ id: l.char, display: l.char, speak: l.arName }));

      const plan = [];
      plan.push({ skill: "identify", game: "pop", items: letterItems().slice(0, 8) });
      plan.push({ skill: "memorize", game: "pairs", items: letterItems() });
      if (doneIds.includes("join-1") || doneIds.includes("forms-1")) {
        const joining = doneLetters.filter((l) => l.joins);
        plan.push({
          skill: "visualize",
          game: "pop",
          // Bubbles wear the in-word costume; the prompt shows the isolated
          // letter — match the disguise to the friend.
          items: shuffle(joining).map((l) => {
            const f = formsOf(l);
            const pos = shuffle(["initial", "medial", "final"])[0];
            return { id: l.char, display: f[pos], promptDisplay: l.char, speak: l.arName };
          }),
        });
      }
      if (doneIds.includes("fatha")) {
        const vowels = doneIds.includes("kasra-damma") ? this.data.harakat : [this.data.harakat[0]];
        const ls = shuffle(doneLetters.filter((l) => l.char !== "ا")).slice(0, 6);
        plan.push({
          skill: "blend",
          game: "build",
          items: ls.flatMap((l) =>
            vowels.map((v) => ({
              id: l.char + v.char,
              display: l.char + v.char,
              speak: l.char + v.char,
              parts: [
                { display: l.char, speak: l.arName },
                { display: TATWEEL + v.char, speak: v.arName },
              ],
            })),
          ),
        });
      }
      plan.push({ skill: "write", game: "trace", items: letterItems().slice(0, 6) });
      return plan;
    }

    // The daily ritual, now the strength model's mouth (spec:
    // specs/02-letter-garden-v2.md): a short session whose items are always
    // the child's weakest skills from every finished world, dressed as a
    // fresh bouquet. No meet phase, no unlocks — and no visible ranking:
    // the pick is shuffled so it never smells like a remedial list.
    dailySession(doneIds, { challenge = false } = {}) {
      const done = this.worlds.filter((w) => doneIds.includes(w.id));
      if (!done.length) return null;
      const pool = [];
      const seen = new Set();
      for (const world of done) {
        const catalogue = world.catalogueItems ? world.catalogueItems() : world.items();
        for (const item of catalogue) {
          const key = `${item.objective || world.objective || "item"}:${item.id}`;
          if (seen.has(key)) continue;
          seen.add(key);
          pool.push(item);
        }
      }
      if (pool.length < 3) return null;
      const strength = ns.LettersStrength;
      const hasReviewPlanner = typeof strength?.reviewItems === "function";
      const proposed = hasReviewPlanner
        ? strength.reviewItems(pool, 6)
        : strength?.weakest ? strength.weakest(pool, 6) : pool.slice(0, 6);
      const selected = Array.isArray(proposed) ? proposed : [];
      const poolByKey = new Map(pool.map((item) => [`${item.objective || "item"}:${item.id}`, item]));
      const bouquet = [];
      for (const candidate of selected) {
        const item = poolByKey.get(`${candidate.objective || "item"}:${candidate.id}`);
        if (item && !bouquet.includes(item)) bouquet.push(item);
        if (bouquet.length === 6) break;
      }
      if (bouquet.length < 3) return null;

      // Plans are data only. reviewItems is explicitly read-only; beginReview
      // belongs at the play boundary so opening/re-rendering Daily changes no
      // scheduler cursor or history.
      let plan;
      if (!challenge && hasReviewPlanner) {
        const learnedGames = new Set(done.flatMap((world) => world.games));
        const middleGame = learnedGames.has("catch") ? "catch" : learnedGames.has("pairs") ? "pairs" : "feed";
        const rotate = (offset) => bouquet.slice(offset).concat(bouquet.slice(0, offset)).slice(0, Math.min(4, bouquet.length));
        const uniformSkill = (items) => {
          const objectives = [...new Set(items.map((item) => item.objective).filter(Boolean))];
          return objectives.length === 1 ? objectives[0] : undefined;
        };
        const step = (game, items, skill = uniformSkill(items)) => ({
          game, items, rounds: 2, ...(skill ? { skill } : {}),
        });
        const buildable = done.slice().reverse()
          .filter((world) => world.games.includes("build"))
          .map((world) => bouquet.filter((item) => item.worldId === world.id && item.parts?.length >= 2))
          .find((items) => items.length >= 2);
        const traceable = learnedGames.has("trace")
          ? bouquet.filter((item) => item.objective === "letter-name").slice(0, 4) : [];
        plan = [
          step("pop", rotate(0)),
          step(middleGame, rotate(1)),
          buildable
            ? step("build", buildable.slice(0, 4), "construction")
            : traceable.length >= 2 ? step("trace", traceable) : step("feed", rotate(2)),
        ];
      }
      const games = challenge ? ["burst"] : plan ? plan.map((step) => step.game) : ["pop", "feed"];
      return {
        id: "daily",
        hue: 45,
        icon: "☀",
        kind: "daily",
        optional: challenge,
        timed: challenge,
        meet: [],
        items: () => bouquet,
        plan,
        // Keep distractors within completed content. Gentle practice shows
        // two choices; the optional challenge keeps its larger field.
        extraItems: () => pool.filter((i) => !bouquet.includes(i)),
        games,
      };
    }
  }

  ns.LettersWorlds = LettersWorlds;
})(window.MiftahGame || (window.MiftahGame = {}));
