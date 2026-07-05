// The Letter Garden's curriculum data — the 28 hijaiyah letters grouped into
// small shape-family packs (letters that look alike are learned together so
// their differences are the lesson), plus the harakat and long vowels.
//
// `joins: false` marks the six letters that never connect to the letter after
// them (ا د ذ ر ز و) — their initial form is just their isolated shape, and
// the engine derives contextual forms with tatweel (ـ) joining.
(function (ns) {
  const L = (char, name, arName, translit, sound, joins = true) => ({
    char, name, arName, translit, sound, joins,
  });

  ns.LETTERS_DATA = {
    packs: [
      {
        id: "boat",
        name: "The Boat Letters",
        blurb: "One tall stick, then three little boats — only their dots are different.",
        letters: [
          L("ا", "Alif", "أَلِفْ", "a", "“aa” as in father", false),
          L("ب", "Ba", "بَاءْ", "b", "“b” as in boat — one dot below"),
          L("ت", "Ta", "تَاءْ", "t", "“t” as in tent — two dots on top"),
          L("ث", "Tha", "ثَاءْ", "th", "“th” as in think — three dots on top"),
        ],
      },
      {
        id: "smile",
        name: "The Smile Letters",
        blurb: "Three big smiles — a dot inside, no dot, or a dot on top.",
        letters: [
          L("ج", "Jeem", "جِيمْ", "j", "“j” as in jam — dot inside the smile"),
          L("ح", "Haa", "حَاءْ", "ḥ", "a big breathy “h” from the throat — no dot"),
          L("خ", "Khaa", "خَاءْ", "kh", "“kh” like clearing your throat — dot on top"),
        ],
      },
      {
        id: "little",
        name: "The Little Ones",
        blurb: "Four small letters that never hold hands with the letter after them.",
        letters: [
          L("د", "Dal", "دَالْ", "d", "“d” as in door", false),
          L("ذ", "Dhal", "ذَالْ", "dh", "“th” as in this — Dal with a dot", false),
          L("ر", "Ra", "رَاءْ", "r", "a rolled “r”, like a cat purring", false),
          L("ز", "Zay", "زَايْ", "z", "“z” as in zoo — Ra with a dot", false),
        ],
      },
      {
        id: "wave",
        name: "The Wave Letters",
        blurb: "Wavy teeth and big scoops — listen for the strong, heavy sounds.",
        letters: [
          L("س", "Seen", "سِينْ", "s", "“s” as in sun — three little teeth"),
          L("ش", "Sheen", "شِينْ", "sh", "“sh” as in ship — Seen with three dots"),
          L("ص", "Saad", "صَادْ", "ṣ", "a strong, heavy “s” — round like an egg"),
          L("ض", "Daad", "ضَادْ", "ḍ", "a strong, heavy “d” — Saad with a dot"),
        ],
      },
      {
        id: "tall",
        name: "The Tall & Deep Letters",
        blurb: "Two tall towers and two deep-throat sounds you make way down low.",
        letters: [
          L("ط", "Taa", "طَاءْ", "ṭ", "a strong, heavy “t” — a tower on an egg"),
          L("ظ", "Zaa", "ظَاءْ", "ẓ", "a strong, heavy “z” — the tower with a dot"),
          L("ع", "Ayn", "عَيْنْ", "ʿ", "a deep sound from the middle of your throat"),
          L("غ", "Ghayn", "غَيْنْ", "gh", "a gargled “g”, like a gentle growl — Ayn with a dot"),
        ],
      },
      {
        id: "strong",
        name: "The Strong Sounds",
        blurb: "A circle with a dot, a deep “q”, a tall hook and a lasso.",
        letters: [
          L("ف", "Fa", "فَاءْ", "f", "“f” as in fish — one dot on top"),
          L("ق", "Qaf", "قَافْ", "q", "a deep “k” from the back of your mouth — two dots"),
          L("ك", "Kaf", "كَافْ", "k", "“k” as in kite"),
          L("ل", "Lam", "لَامْ", "l", "“l” as in lamp — a tall lasso"),
        ],
      },
      {
        id: "round",
        name: "The Round Crew",
        blurb: "The last five friends — round shapes, and two that love long sounds.",
        letters: [
          L("م", "Meem", "مِيمْ", "m", "“m” as in moon — a little circle with a tail"),
          L("ن", "Noon", "نُونْ", "n", "“n” as in nest — a bowl with a dot"),
          L("ه", "Ha", "هَاءْ", "h", "a soft, gentle “h” as in hello"),
          L("و", "Waw", "وَاوْ", "w", "“w” as in water", false),
          L("ي", "Ya", "يَاءْ", "y", "“y” as in yes — two dots below"),
        ],
      },
    ],

    harakat: [
      {
        char: "َ", // fatha
        name: "Fatha",
        arName: "فَتْحَة",
        sound: "a",
        blurb: "A little slash ABOVE the letter. It says “a” — بَ is “ba”.",
      },
      {
        char: "ِ", // kasra
        name: "Kasra",
        arName: "كَسْرَة",
        sound: "i",
        blurb: "A little slash BELOW the letter. It says “i” — بِ is “bi”.",
      },
      {
        char: "ُ", // damma
        name: "Damma",
        arName: "ضَمَّة",
        sound: "u",
        blurb: "A tiny curl above the letter. It says “u” — بُ is “bu”.",
      },
    ],

    sukun: {
      char: "ْ",
      name: "Sukun",
      arName: "سُكُونْ",
      blurb: "A small circle above a letter. It means STOP — no vowel, just the letter's sound. بَتْ is “bat”.",
    },

    // Long vowels: a harakah followed by its stretching letter holds the
    // sound for two beats. vowel = the harakah to put on the first letter.
    longVowels: [
      { char: "ا", vowel: "َ", name: "Long aa", suffix: "a", blurb: "Fatha + Alif stretches “a” into “aa” — بَا is “baa”." },
      { char: "ي", vowel: "ِ", name: "Long ee", suffix: "i", blurb: "Kasra + Ya stretches “i” into “ee” — بِي is “bee”." },
      { char: "و", vowel: "ُ", name: "Long oo", suffix: "u", blurb: "Damma + Waw stretches “u” into “oo” — بُو is “boo”." },
    ],
  };
})(window.MiftahGame || (window.MiftahGame = {}));
