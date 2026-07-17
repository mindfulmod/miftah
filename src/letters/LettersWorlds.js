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
      const results = await Promise.allSettled(
        surahs.map(async (n) => {
          const res = await fetch(`data/surah-${n}.json`, { cache: "no-store" });
          if (!res.ok) throw new Error(String(res.status));
          return { n, data: await res.json() };
        }),
      );
      const seen = new Set();
      for (const r of results) {
        if (r.status !== "fulfilled") continue;
        const { n, data } = r.value;
        for (const ayah of data.ayahs) {
          for (const w of ayah.words) {
            const skel = skeleton(w.arabic);
            if (!skel || skel.length < 2 || skel.length > 5 || seen.has(skel)) continue;
            seen.add(skel);
            this.examplePool.push({
              id: w.arabic,
              display: w.arabic,
              speak: "",
              skel,
              audioPath: w.audio || `wbw/${pad3(n)}_${pad3(ayah.number)}_${pad3(w.position)}.mp3`,
            });
          }
        }
      }
    }

    // Real-word pools by skeleton length, with a graceful fallback when a
    // band is thin (offline sample, small surahs).
    wordPool(minLen, maxLen) {
      const band = this.examplePool.filter((w) => w.skel.length >= minLen && w.skel.length <= maxLen);
      return band.length >= 6 ? band : this.examplePool;
    }

    buildWorlds() {
      const hues = [150, 200, 28, 268, 190, 8, 322, 95, 230, 260, 45, 175, 15, 288, 205, 130, 335, 70, 245, 25, 165, 300];
      const worlds = [];

      this.data.packs.forEach((pack, i) => {
        worlds.push({
          id: `pack-${pack.id}`,
          hue: 0,
          icon: pack.letters[1] ? pack.letters[1].char : pack.letters[0].char,
          kind: "letters",
          meet: pack.letters.map((l) => ({ display: l.char, speak: l.arName, letter: l })),
          items: () =>
            pack.letters.map((l) => ({ id: l.char, display: l.char, speak: l.arName })),
          // Earlier letters sneak back in as extra distractors once known.
          extraItems: () =>
            this.letters
              .filter((l) => !pack.letters.includes(l))
              .map((l) => ({ id: l.char, display: l.char, speak: l.arName })),
          // Every pack writes (trace); the rest of the menu alternates so
          // neighbouring packs never feel like reruns.
          games: i % 2 === 0 ? ["pop", "trace", "feed"] : ["pairs", "trace", "pop"],
        });
      });

      const joining = (from, to) =>
        this.data.packs.slice(from, to).flatMap((p) => p.letters).filter((l) => l.joins);
      for (const [i, range] of [[0, 4], [4, 7]].entries()) {
        const letters = joining(range[0], range[1]);
        worlds.push({
          id: `forms-${i + 1}`,
          icon: i === 0 ? "ﺑ" : "ﻌ",
          kind: "forms",
          meet: letters.slice(0, 5).map((l) => {
            const f = formsOf(l);
            return { display: `${f.initial} ${f.medial} ${f.final}`, speak: l.arName, letter: l };
          }),
          // Item display is a contextual form; the "match" is the isolated
          // letter — pairs and pop teach that the costume hides the same friend.
          items: () =>
            shuffle(letters).map((l) => {
              const f = formsOf(l);
              const pos = shuffle(["initial", "medial", "final"])[0];
              return { id: l.char, display: f[pos], speak: l.arName, match: l.char };
            }),
          games: ["pairs", "pop", "feed"],
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
          },
          { display: "طه", speak: nameSeq("طه") },
          { display: "يس", speak: nameSeq("يس") },
        ],
        items: () =>
          this.data.muqattaat.map((combo) => ({
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

      const syllableLetters = () =>
        shuffle(this.letters.filter((l) => l.char !== "ا")).slice(0, 6);
      // The blending decomposition: a syllable is its letter plus its vowel,
      // shown riding a tatweel stroke (Amiri Quran has no dotted carrier).
      const syllableParts = (l, v) => [
        { display: l.char, speak: l.arName },
        { display: TATWEEL + v.char, speak: v.arName },
      ];
      const vowelWorld = (id, icon, vowels) => ({
        id,
        icon,
        kind: "syllables",
        meet: vowels.map((v) => ({ display: `ب${v.char}`, speak: `ب${v.char}`, vowel: v })),
        items: () =>
          syllableLetters().flatMap((l) =>
            vowels.map((v) => ({
              id: l.char + v.char,
              display: l.char + v.char,
              speak: l.char + v.char,
              parts: syllableParts(l, v),
            })),
          ),
        games: ["pop", "catch", "feed"],
      });
      // The blend machine leads both vowel worlds — fusing letter + haraka
      // IS the lesson; pop/trace/catch then rehearse what the fuse taught.
      worlds.push({ ...vowelWorld("fatha", "بَ", [this.data.harakat[0]]), games: ["blend", "pop", "trace"] });
      worlds.push({ ...vowelWorld("kasra-damma", "بِ", this.data.harakat.slice(1)), games: ["blend", "pop", "catch"] });

      // Noorani Qaida lesson 5–6: tanween — and lesson 6's exercise is baked
      // in: plain-harakat syllables join the pool, so بَ and بً sit side by
      // side and the child must hear one "n" of difference.
      const tanweenWorld = { ...vowelWorld("tanween", "بً", this.data.tanween), games: ["pop", "build", "feed"] };
      const tanweenBase = tanweenWorld.items;
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
      worlds.push({
        id: "standing",
        icon: "بٰ",
        kind: "syllables",
        meet: this.data.standing.map((sv) => ({
          display: `ب${sv.char}`,
          speak: sv.speakAs("ب"),
          sub: sv.blurb,
        })),
        items: () =>
          syllableLetters().flatMap((l) =>
            this.data.standing.map((sv) => ({
              id: l.char + sv.char,
              display: l.char + sv.char,
              speak: sv.speakAs(l.char),
              parts: [
                { display: l.char, speak: l.arName },
                { display: TATWEEL + sv.char, speak: sv.speakAs("ب") },
              ],
            })),
          ),
        games: ["pop", "feed", "catch"],
      });

      // Lesson 8a: pure madd — the three stretching letters, nothing else.
      worlds.push({
        id: "long-sounds",
        icon: "بَا",
        kind: "syllables",
        meet: this.data.longVowels.map((lv) => ({
          display: `ب${lv.vowel}${lv.char}`,
          speak: `ب${lv.vowel}${lv.char}`,
        })),
        items: () => {
          const letters = syllableLetters().slice(0, 4);
          const items = [];
          for (const lv of this.data.longVowels) {
            for (const l of letters) {
              items.push({
                id: l.char + lv.vowel + lv.char,
                display: l.char + lv.vowel + lv.char,
                speak: l.char + lv.vowel + lv.char,
                parts: [
                  { display: l.char + lv.vowel, speak: l.char + lv.vowel },
                  { display: lv.char, speak: letterByChar.get(lv.char).arName },
                ],
              });
            }
          }
          return items;
        },
        games: ["build", "pop", "pairs"],
      });

      // Lesson 8b: the leen glide — fatha then a resting Waw or Ya.
      worlds.push({
        id: "leen",
        icon: "بَوْ",
        kind: "syllables",
        meet: this.data.leen.map((ln) => ({
          display: `بَ${ln.char}`,
          speak: `بَ${ln.char}`,
          sub: ln.blurb,
        })),
        items: () =>
          syllableLetters().slice(0, 5).flatMap((l) =>
            this.data.leen.map((ln) => ({
              id: l.char + "َ" + ln.char,
              display: l.char + "َ" + ln.char,
              speak: l.char + "َ" + ln.char,
              parts: [
                { display: l.char + "َ", speak: l.char + "َ" },
                { display: ln.char, speak: "" },
              ],
            })),
          ),
        games: ["pop", "build", "feed"],
      });

      // Lessons 10–11: sukoon gets its own world — closed syllables with
      // every short vowel, not just fatha.
      worlds.push({
        id: "sukoon",
        icon: "بَتْ",
        kind: "syllables",
        meet: [
          { display: "بَتْ", speak: "بَتْ", sub: this.data.sukun.blurb },
          { display: "مِنْ", speak: "مِنْ" },
          { display: "كُمْ", speak: "كُمْ" },
        ],
        items: () => {
          const simple = shuffle(this.letters.filter((l) => l.char !== "ا" && /^[a-z]$/.test(l.translit)));
          const items = [];
          for (let i = 0; i + 1 < simple.length && items.length < 9; i += 2) {
            const v = this.data.harakat[items.length % 3];
            const word = simple[i].char + v.char + simple[i + 1].char + "ْ";
            items.push({
              id: word,
              display: word,
              speak: word,
              parts: [
                { display: simple[i].char + v.char, speak: simple[i].char + v.char },
                { display: simple[i + 1].char + "ْ", speak: simple[i + 1].arName },
              ],
            });
          }
          return items;
        },
        games: ["build", "pop", "catch"],
      });

      // Lessons 12–13: shaddah — the doubling mark, pressed and held.
      const shaddahLetters = () =>
        shuffle(this.letters.filter((l) => l.char !== "ا" && /^[a-z]$/.test(l.translit)));
      worlds.push({
        id: "shaddah",
        icon: "بَّ",
        kind: "syllables",
        meet: [
          { display: "بَدَّ", speak: "بَدَّ", sub: this.data.shaddah.blurb },
          { display: "رَبَّ", speak: "رَبَّ" },
        ],
        items: () => {
          const simple = shaddahLetters();
          const items = [];
          for (let i = 0; i + 1 < simple.length && items.length < 8; i += 2) {
            const word = simple[i].char + "َ" + simple[i + 1].char + "ّ" + "َ";
            items.push({
              id: word,
              display: word,
              speak: word,
              parts: [
                { display: simple[i].char + "َ", speak: simple[i].char + "َ" },
                { display: simple[i + 1].char + "َّ", speak: simple[i + 1].char + "َّ" },
              ],
            });
          }
          return items;
        },
        games: ["pop", "build", "feed"],
      });

      // Lessons 14–16: shaddah in company — with tanween (a real Quran
      // pattern: حَبٌّ) and with the madd letters.
      worlds.push({
        id: "shaddah-mix",
        icon: "بٌّ",
        kind: "syllables",
        meet: [
          { display: "حَبٌّ", speak: "حَبٌّ" },
          { display: "شَدَّا", speak: "شَدَّا" },
        ],
        items: () => {
          const simple = shaddahLetters();
          const items = [];
          for (let i = 0; i + 1 < simple.length && items.length < 4; i += 2) {
            const word = simple[i].char + "َ" + simple[i + 1].char + "ٌّ";
            items.push({
              id: word,
              display: word,
              speak: word,
              parts: [
                { display: simple[i].char + "َ", speak: simple[i].char + "َ" },
                { display: simple[i + 1].char + "ٌّ", speak: simple[i + 1].char + "ٌّ" },
              ],
            });
          }
          for (let i = 0; i + 1 < simple.length && items.length < 6; i += 2) {
            const word = simple[i].char + "َ" + simple[i + 1].char + "َّ" + "ا";
            items.push({
              id: word,
              display: word,
              speak: word,
              parts: [
                { display: simple[i].char + "َ", speak: simple[i].char + "َ" },
                { display: simple[i + 1].char + "َّا", speak: simple[i + 1].char + "َّا" },
              ],
            });
          }
          // Lesson 14: shaddah met by sukoon — three-beat builds (شَدَّتْ).
          for (let i = 0; i + 2 < simple.length && items.length < 9; i += 3) {
            const word =
              simple[i].char + "َ" + simple[i + 1].char + "َّ" + simple[i + 2].char + "ْ";
            items.push({
              id: word,
              display: word,
              speak: word,
              parts: [
                { display: simple[i].char + "َ", speak: simple[i].char + "َ" },
                { display: simple[i + 1].char + "َّ", speak: simple[i + 1].char + "َّ" },
                { display: simple[i + 2].char + "ْ", speak: simple[i + 2].arName },
              ],
            });
          }
          return items;
        },
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
      const wordItems = (minLen, maxLen, n) =>
        shuffle(this.wordPool(minLen, maxLen))
          .slice(0, n)
          .map((w) => {
            const clusters = clusterSplit(w.display);
            return {
              ...w,
              parts:
                clusters.length >= 2 && clusters.length <= 3
                  ? clusters.map((c) => ({ display: c, speak: c }))
                  : undefined,
            };
          });

      // The word ramp: two-letter words, then three, then the long ones —
      // each with the reciter's real audio.
      worlds.push({
        id: "words-2",
        icon: "مِن",
        kind: "words",
        meet: [],
        items: () => wordItems(2, 2, 8),
        games: ["feed", "build", "pop"],
      });
      worlds.push({
        id: "decode",
        icon: "📖",
        kind: "words",
        meet: [],
        items: () => wordItems(3, 3, 8),
        games: ["feed", "build", "pop"],
      });
      worlds.push({
        id: "decode-4",
        icon: "📗",
        kind: "words",
        meet: [],
        items: () => wordItems(4, 5, 8),
        games: ["feed", "pop", "pairs"],
      });

      // Biome chapters (specs/02): each stretch of the qaida ladder lives in
      // its own land, so progress feels like TRAVEL — letters meadow, syllable
      // orchard, long-sound lagoon, sukoon night-garden, shaddah peaks, and
      // the decode riverlands at the summit.
      const biomeOf = (w) => {
        if (w.kind === "letters" || w.kind === "forms" || w.kind === "muqattaat") return "meadow";
        if (["fatha", "kasra-damma", "tanween", "standing"].includes(w.id)) return "orchard";
        if (["long-sounds", "leen"].includes(w.id)) return "lagoon";
        if (w.id === "sukoon") return "night";
        if (w.id.startsWith("shaddah")) return "peaks";
        return "river";
      };
      worlds.forEach((w, i) => {
        w.hue = hues[i % hues.length];
        w.biome = biomeOf(w);
      });
      return worlds;
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
      if (doneIds.includes("forms-1")) {
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
    dailySession(doneIds) {
      const done = this.worlds.filter((w) => doneIds.includes(w.id));
      if (!done.length) return null;
      const pool = [];
      const seen = new Set();
      for (const world of done) {
        for (const item of world.items()) {
          if (seen.has(item.id)) continue;
          seen.add(item.id);
          pool.push(item);
        }
      }
      if (pool.length < 3) return null;
      const strength = ns.LettersStrength;
      const bouquet = strength ? strength.weakest(pool, 6) : pool.slice(0, 6);
      return {
        id: "daily",
        hue: 45,
        icon: "☀",
        kind: "daily",
        meet: [],
        items: () => bouquet,
        // The rest of the pool still visits as distractors, so a weak-letter
        // round is never a two-horse race between two shaky friends.
        extraItems: () => pool.filter((i) => !bouquet.includes(i)),
        games: ["burst", "pop", "feed"],
      };
    }
  }

  ns.LettersWorlds = LettersWorlds;
})(window.MiftahGame || (window.MiftahGame = {}));
