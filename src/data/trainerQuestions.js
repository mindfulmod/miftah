(function (ns) {
  const AYAT = {
    "Al-Fatihah 1:1": {
      ayahWords: ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَـٰنِ", "ٱلرَّحِيمِ"],
      translation: "In the name of Allah, the Entirely Merciful, the Especially Merciful.",
    },
    "Al-Fatihah 1:2": {
      ayahWords: ["ٱلْحَمْدُ", "لِلَّهِ", "رَبِّ", "ٱلْعَـٰلَمِينَ"],
      translation: "[All] praise is [due] to Allah, Lord of the worlds.",
    },
    "Al-Fatihah 1:5": {
      ayahWords: ["إِيَّاكَ", "نَعْبُدُ", "وَإِيَّاكَ", "نَسْتَعِينُ"],
      translation: "It is You we worship and You we ask for help.",
    },
    "Al-Fatihah 1:6": {
      ayahWords: ["ٱهْدِنَا", "ٱلصِّرَٰطَ", "ٱلْمُسْتَقِيمَ"],
      translation: "Guide us to the straight path.",
    },
    "Al-Fatihah 1:7": {
      ayahWords: ["صِرَٰطَ", "ٱلَّذِينَ", "أَنْعَمْتَ", "عَلَيْهِمْ"],
      translation: "The path of those upon whom You have bestowed favor.",
    },
  };

  const questions = [
    {
      ayah: "Al-Fatihah 1:1",
      activeWordIndex: 0,
      prompt: "Choose the meaning",
      answer: "In the name",
      options: ["In the name", "The path", "We worship"],
    },
    {
      ayah: "Al-Fatihah 1:1",
      activeWordIndex: 2,
      prompt: "Choose the meaning",
      answer: "The Most Gracious",
      options: ["The Most Gracious", "The Lord", "The Day"],
    },
    {
      ayah: "Al-Fatihah 1:2",
      activeWordIndex: 0,
      prompt: "Choose the meaning",
      answer: "All praise",
      options: ["All praise", "Guide us", "The straight"],
    },
    {
      ayah: "Al-Fatihah 1:2",
      activeWordIndex: 2,
      prompt: "Choose the meaning",
      answer: "Lord",
      options: ["Lord", "Merciful", "Path"],
    },
    {
      ayah: "Al-Fatihah 1:5",
      activeWordIndex: 1,
      prompt: "Choose the meaning",
      answer: "We worship",
      options: ["We worship", "We ask for help", "You bestowed"],
    },
    {
      ayah: "Al-Fatihah 1:5",
      activeWordIndex: 3,
      prompt: "Choose the meaning",
      answer: "We ask for help",
      options: ["We ask for help", "Guide us", "The universe"],
    },
    {
      ayah: "Al-Fatihah 1:6",
      activeWordIndex: 0,
      prompt: "Choose the meaning",
      answer: "Guide us",
      options: ["Guide us", "The path", "Those"],
    },
    {
      ayah: "Al-Fatihah 1:6",
      activeWordIndex: 1,
      prompt: "Choose the meaning",
      answer: "The path",
      options: ["The path", "The straight", "The Judgment"],
    },
    {
      ayah: "Al-Fatihah 1:7",
      activeWordIndex: 2,
      prompt: "Choose the meaning",
      answer: "You bestowed favor",
      options: ["You bestowed favor", "Their anger", "Those astray"],
    },
  ];

  ns.TRAINER_QUESTIONS = questions.map((question) => {
    const ayah = AYAT[question.ayah];
    return {
      ...question,
      ...ayah,
      arabic: ayah.ayahWords[question.activeWordIndex],
    };
  });
})(window.MiftahGame || (window.MiftahGame = {}));
