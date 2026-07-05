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
            if (!skel || skel.length < 2 || skel.length > 4 || seen.has(skel)) continue;
            seen.add(skel);
            this.examplePool.push({
              id: w.arabic,
              display: w.arabic,
              speak: "",
              audioPath: w.audio || `wbw/${pad3(n)}_${pad3(ayah.number)}_${pad3(w.position)}.mp3`,
            });
          }
        }
      }
    }

    buildWorlds() {
      const hues = [150, 200, 28, 268, 190, 8, 322, 95, 230, 45, 175, 288, 130];
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
      worlds.push({ ...vowelWorld("fatha", "بَ", [this.data.harakat[0]]), games: ["pop", "build", "trace"] });
      worlds.push({ ...vowelWorld("kasra-damma", "بِ", this.data.harakat.slice(1)), games: ["pop", "build", "catch"] });

      worlds.push({
        id: "long-sounds",
        icon: "بَا",
        kind: "syllables",
        meet: this.data.longVowels
          .map((lv) => ({ display: `ب${lv.vowel}${lv.char}`, speak: `ب${lv.vowel}${lv.char}` }))
          .concat([{ display: "بَتْ", speak: "بَتْ" }]),
        items: () => {
          const letters = syllableLetters().slice(0, 4);
          const items = [];
          const letterByChar = new Map(this.letters.map((l) => [l.char, l]));
          for (const lv of this.data.longVowels) {
            for (const l of letters.slice(0, 2)) {
              items.push({
                id: l.char + lv.vowel + lv.char,
                display: l.char + lv.vowel + lv.char,
                speak: l.char + lv.vowel + lv.char,
                // Blend: the open syllable plus its stretching letter.
                parts: [
                  { display: l.char + lv.vowel, speak: l.char + lv.vowel },
                  { display: lv.char, speak: letterByChar.get(lv.char).arName },
                ],
              });
            }
          }
          const simple = shuffle(this.letters.filter((l) => /^[a-z]$/.test(l.translit)));
          for (let i = 0; i + 1 < simple.length && i < 6; i += 2) {
            const word = simple[i].char + "َ" + simple[i + 1].char + "ْ";
            items.push({
              id: word,
              display: word,
              speak: word,
              // Blend: CV syllable + closing letter with sukun.
              parts: [
                { display: simple[i].char + "َ", speak: simple[i].char + "َ" },
                { display: simple[i + 1].char + "ْ", speak: simple[i + 1].arName },
              ],
            });
          }
          return items;
        },
        games: ["build", "pop", "pairs"],
      });

      worlds.push({
        id: "decode",
        icon: "📖",
        kind: "words",
        meet: [],
        items: () => shuffle(this.examplePool).slice(0, 8),
        games: ["feed", "pop", "pairs"],
      });

      worlds.forEach((w, i) => {
        w.hue = hues[i % hues.length];
      });
      return worlds;
    }

    // The Brain Age ritual: a short daily review session mixing items from
    // every world the child has already finished. Not a world — no meet
    // phase, no unlocks, just warm bread: burst (speed), pop, feed.
    dailySession(doneIds) {
      const done = this.worlds.filter((w) => doneIds.includes(w.id));
      if (!done.length) return null;
      const items = [];
      const seen = new Set();
      for (const world of done) {
        for (const item of world.items()) {
          if (seen.has(item.id)) continue;
          seen.add(item.id);
          items.push(item);
        }
      }
      if (items.length < 3) return null;
      return {
        id: "daily",
        hue: 45,
        icon: "☀",
        kind: "daily",
        meet: [],
        items: () => items,
        games: ["burst", "pop", "feed"],
      };
    }
  }

  ns.LettersWorlds = LettersWorlds;
})(window.MiftahGame || (window.MiftahGame = {}));
