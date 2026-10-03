// Picture Words (v27, 2026-10-02): real things, drawn without their letter.
//
// The Letter Friends wear their letter as a body — perfect for learning, but a
// game that shows a friend gives its letter away. These are the album's own
// sticker pictures, each with its Arabic name, so the picture-book games can
// ask the real question: you hear "فِيل" and see an elephant — which letter
// does it start with? The answer has to come from the sound, not the shape.
//
// Every word is vowelled; `char` is its first letter. Where a friend and a
// picture are the same thing (the cat, the camel), they share a name.
(function (ns) {
  const W = (sticker, word, en) => ({ id: `pic:${sticker}`, sticker, word, en, char: [...word][0] });
  const LIST = [
    W("egg", "بَيْضَة", "egg"),
    W("fig", "تِين", "fig"), W("dates", "تَمْر", "dates"),
    W("snake", "ثُعْبَان", "snake"),
    W("camel", "جَمَل", "camel"), W("mountain", "جَبَل", "mountain"),
    W("whale", "حُوت", "whale"),
    W("pomegranate", "رُمَّان", "pomegranate"), W("feather", "رِيشَة", "feather"),
    W("flower", "زَهْرَة", "flower"), W("olive", "زَيْتُون", "olive"),
    W("fish", "سَمَكَة", "fish"), W("boat", "سَفِينَة", "boat"), W("turtle", "سُلَحْفَاة", "turtle"),
    W("sun", "شَمْس", "sun"),
    W("shell", "صَدَفَة", "seashell"),
    W("spider", "عَنْكَبُوت", "spider"), W("grapes", "عِنَب", "grapes"), W("nest", "عُشّ", "nest"),
    W("crow", "غُرَاب", "crow"), W("cloud", "غَيْمَة", "cloud"),
    W("butterfly", "فَرَاشَة", "butterfly"), W("lantern", "فَانُوس", "lantern"), W("elephant", "فِيل", "elephant"),
    W("moon", "قَمَر", "moon"), W("cat", "قِطَّة", "cat"), W("waterdrop", "قَطْرَة", "drop"),
    W("key", "مِفْتَاح", "key"),
    W("star", "نَجْمَة", "star"), W("palm", "نَخْلَة", "palm tree"), W("bee", "نَحْلَة", "bee"), W("ant", "نَمْلَة", "ant"),
    W("hoopoe", "هُدْهُد", "hoopoe"),
    W("dove", "يَمَامَة", "dove"),
  ];

  const byChar = (char) => LIST.filter((p) => p.char === char);
  // Pictures for a set of letters (only letters that have any).
  const forLetters = (chars) => LIST.filter((p) => chars.includes(p.char));
  const art = (p, size = 72) => ns.LettersArt?.stickerMotif?.(p.sticker, size) || "";
  const item = (p) => ({ id: p.id, display: p.word, speak: p.word, picture: p.sticker, char: p.char });

  ns.PictureWords = { LIST, byChar, forLetters, art, item };
})(window.MiftahGame || (window.MiftahGame = {}));
