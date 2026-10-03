// Letter Friends (v26, 2026-10-02): every letter has a friend whose Arabic
// name starts with it, and whose body IS the letter. The duck بَطَّة floats on
// the bowl of ب; the cat قِطَّة wears the two dots of ق as ears. This is the
// embedded picture mnemonic from the reading research (Ehri; Letterland): a
// letter drawn as a familiar thing is learned faster and remembered longer
// than the same letter beside an unrelated picture.
//
// Arabic names are taught as names. A child who doesn't speak Arabic doesn't
// need to know بَطَّة means duck — Batta is simply who she is, and her name
// starts with ب. The friend has the face; the letter never does.
//
// The body is drawn FROM the handwriting model (LettersStrokes), so the letter
// a child traces and the friend they love are the same shape. Three looks:
//   full  — the dressed friend
//   soft  — the friend fading (the Brain has seen the letter is known)
//   plain — just the letter, in ink
// The scaffold is meant to fade: once a child knows the letter, the picture
// steps back until the bare letter is enough.
(function (ns) {
  const INK = "#4a3620";
  const ink = (w) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const line = (d, color, w) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const eye = (x, y, r = 1.8) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/>`;
  const legs = (pts) => pts.map(([x, y, x2, y2]) => line(`M${x} ${y}L${x2} ${y2}`, INK, 3)).join("");

  // word: the friend's Arabic name, fully vowelled. en: grown-up gloss only.
  // call: the friend's sound (LettersSound cue). fill/dot: body and dot paint.
  const FRIENDS = {
    "ا": { id: "rabbit", word: "أَرْنَب", en: "rabbit", call: "friend-rabbit", fill: "#e5dcc8",
      back: `<path d="M58 72Q70 50 80 56Q84 62 64 78Z" fill="#e5dcc8" ${ink(3)}/>`,
      front: `${line("M50 24L50 62", "#ffa798", 3)}<circle cx="52" cy="82" r="14" fill="#e5dcc8" ${ink(3)}/>${eye(47, 80)}${eye(58, 80)}<path d="M51 86h4l-2 2.4Z" fill="#c25a49"/><circle cx="43" cy="86" r="2.4" fill="#ffa798"/><circle cx="62" cy="86" r="2.4" fill="#ffa798"/>${line("M44 89L34 91M60 89L70 91", INK, 1.6)}` },
    "ب": { id: "duck", word: "بَطَّة", en: "duck", call: "friend-duck", fill: "#ffe49a", dot: "#e8743c",
      back: line("M2 80Q14 74 26 80T50 80T74 80T98 80", "#62cdf4", 3),
      front: `<circle cx="16" cy="36" r="10" fill="#ffe49a" ${ink(3)}/><path d="M8 35Q-2 36 6 41Q10 42 10 38Z" fill="#e8743c" ${ink(2.4)}/>${eye(15, 33)}<path d="M36 56Q50 50 64 58Q52 64 38 60Z" fill="#f3c955" ${ink(2.4)}/><path d="M82 47L93 37L88 50Z" fill="#ffe49a" ${ink(2.4)}/>` },
    "ت": { id: "crocodile", word: "تِمْسَاح", en: "crocodile", call: "friend-crocodile", fill: "#7fce54", dot: "#fffdf7",
      back: `<path d="M0 48H100V90Q100 96 94 96H6Q0 96 0 90Z" fill="#96ecff" opacity=".55"/><path d="M34 42Q36 26 50 28Q64 26 66 42Z" fill="#7fce54" ${ink(3)}/>`,
      front: `${eye(58, 33, 2)}${eye(42, 33, 2)}<path d="M17 46Q6 43 3 49Q7 54 18 53" fill="#7fce54" ${ink(3)}/><circle cx="7" cy="48" r="1.6" fill="${INK}"/><path d="M84 47L97 41L87 53Z" fill="#7fce54" ${ink(2.4)}/>${line("M40 64l3 3 3-3 3 3 3-3 3 3 3-3", "#4e9677", 2.4)}` },
    "ث": { id: "fox", word: "ثَعْلَب", en: "fox", call: "friend-fox", fill: "#ee806f", dot: "#f3c955",
      front: `<path d="M78 50Q76 36 86 34L88 25L92 34Q99 38 97 48Q90 55 78 50Z" fill="#ee806f" ${ink(3)}/>${line("M84 43q3 2 6 0", INK, 1.6)}<circle cx="97" cy="47" r="1.6" fill="${INK}"/><path d="M17 47Q3 36 10 25Q21 30 21 45Z" fill="#ee806f" ${ink(3)}/><path d="M10 25Q8 32 13 34Q16 30 10 25Z" fill="#fffdf7" ${ink(1.6)}/>${line("M36 62Q50 66 64 62", "#ffa798", 3)}` },
    "ج": { id: "camel", word: "جَمَل", en: "camel", call: "friend-camel", fill: "#e5dcc8", dot: "#ee806f",
      back: `<path d="M38 26Q50 -8 68 26Z" fill="#e5dcc8" ${ink(3)}/>`,
      front: `<ellipse cx="22" cy="27" rx="9" ry="7" fill="#e5dcc8" ${ink(3)}/><path d="M25 21l2-6 3 6Z" fill="#e5dcc8" ${ink(2.4)}/>${eye(21, 25, 1.6)}${line("M14 29q2 1 4 0", INK, 1.6)}${legs([[40, 87, 38, 98], [64, 89, 66, 98]])}${line("M80 82l8-4", INK, 2.4)}` },
    "ح": { id: "horse", word: "حِصَان", en: "horse", call: "friend-horse", fill: "#c25a49",
      front: `<path d="M30 22Q18 17 11 26Q9 33 18 33Q25 32 30 30Z" fill="#c25a49" ${ink(3)}/><path d="M25 20l2-7 4 6Z" fill="#c25a49" ${ink(2.4)}/>${eye(21, 24, 1.6)}<circle cx="13" cy="29" r="1.4" fill="${INK}"/>${line("M35 21l-2-7M43 19l-1-7M51 19v-7M59 20l1-7M66 23l2-7", "#8a3a2d", 4)}${legs([[40, 87, 38, 98], [64, 89, 66, 98]])}${line("M80 82Q92 78 94 90", "#8a3a2d", 4)}` },
    "خ": { id: "sheep", word: "خَرُوف", en: "sheep", call: "friend-sheep", fill: "#c9bda4", dot: "#fffdf7",
      back: [[34, 56], [28, 70], [38, 82], [54, 86], [70, 85], [46, 64], [58, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#fffdf7" ${ink(2.4)}/>`).join(""),
      front: `<ellipse cx="22" cy="28" rx="8" ry="9" fill="#a89478" ${ink(3)}/><circle cx="19" cy="26" r="1.8" fill="#fffdf7"/><circle cx="26" cy="26" r="1.8" fill="#fffdf7"/><path d="M14 24Q8 22 10 28M30 24Q36 22 34 28" fill="none" ${ink(2.4)}/>${legs([[40, 90, 40, 99], [64, 92, 64, 99]])}` },
    "د": { id: "bear", word: "دُبّ", en: "bear", call: "friend-bear", fill: "#c69434",
      back: `<circle cx="30" cy="15" r="4.6" fill="#c69434" ${ink(2.4)}/><circle cx="46" cy="14" r="4.6" fill="#c69434" ${ink(2.4)}/>`,
      front: `<circle cx="38" cy="24" r="11" fill="#c69434" ${ink(3)}/><ellipse cx="34" cy="29" rx="5" ry="4" fill="#ffe49a" ${ink(1.6)}/><circle cx="32" cy="28" r="1.6" fill="${INK}"/>${eye(41, 21, 1.6)}${line("M54 50Q59 56 57 62", "#ffe49a", 4)}<ellipse cx="28" cy="67" rx="6" ry="4.4" fill="#c69434" ${ink(2.4)}/>` },
    "ذ": { id: "corn", word: "ذُرَة", en: "corn", call: "pop", fill: "#7fce54", dot: "#f3c955",
      back: `<g transform="rotate(-30 46 44)"><ellipse cx="46" cy="44" rx="9" ry="20" fill="#f3c955" ${ink(3)}/>${line("M38 36H54M37 44H55M38 52H54M46 26V62", "#c69434", 1.6)}</g>`,
      front: `<path d="M64 62Q80 56 86 40Q74 46 62 56Z" fill="#4e9677" ${ink(2.4)}/>` },
    "ر": { id: "pomegranate", word: "رُمَّان", en: "pomegranate", call: "rustle", fill: "#4e9677",
      front: `<circle cx="60" cy="26" r="13" fill="#ee806f" ${ink(3)}/><path d="M55 14l2-5 3 4 3-4 2 5Z" fill="#c25a49" ${ink(2.4)}/>${line("M52 22q2-5 7-6", "#ffa798", 3)}<path d="M50 72Q44 62 54 58Q56 66 50 72Z" fill="#7fce54" ${ink(2.4)}/>` },
    "ز": { id: "giraffe", word: "زَرَافَة", en: "giraffe", call: "friend-giraffe", fill: "#f3c955", dot: "#f3c955",
      back: line("M60 40L62 28", "#f3c955", 8),
      front: `<ellipse cx="65" cy="22" rx="10" ry="7" fill="#f3c955" ${ink(3)}/>${line("M60 15l-1-6M68 15l1-6", INK, 2.4)}<circle cx="59" cy="9" r="2" fill="#c69434"/><circle cx="69" cy="9" r="2" fill="#c69434"/>${eye(67, 20, 1.6)}<circle cx="74" cy="24" r="1.2" fill="${INK}"/>${[[61, 50], [57, 62], [47, 73]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#c69434"/>`).join("")}<ellipse cx="17" cy="86" rx="10" ry="6" fill="#f3c955" ${ink(3)}/>${legs([[12, 91, 12, 99], [23, 91, 23, 99]])}` },
    "س": { id: "fish", word: "سَمَكَة", en: "fish", call: "friend-fish", fill: "#62cdf4",
      front: `<path d="M18 56L3 46L5 65Z" fill="#62cdf4" ${ink(3)}/><circle cx="54" cy="66" r="3.2" fill="#fffdf7" ${ink(1.6)}/>${eye(54, 66, 1.4)}${line("M46 60q-3 6 0 12", INK, 1.6)}<circle cx="96" cy="30" r="2.4" fill="#ccfbef" ${ink(1.6)}/><circle cx="92" cy="20" r="1.6" fill="#ccfbef" ${ink(1.6)}/>` },
    "ش": { id: "sun", word: "شَمْس", en: "sun", call: "glow", fill: "#7fce54", dot: "#ffe49a",
      back: `${line("M76 5V1M95 27h4M57 27h-4M90 13l3-3M62 13l-3-3", "#c69434", 3)}<circle cx="76" cy="27" r="15" fill="#f3c955" ${ink(3)}/>` },
    "ص": { id: "shell", word: "صَدَفَة", en: "seashell", call: "ripple", fill: "#ee806f",
      back: `<path d="M0 84Q50 76 100 84V98H0Z" fill="#e5dcc8"/><path d="M56 60Q54 20 80 22Q106 26 102 60Z" fill="#ffa798" ${ink(3)}/>${line("M62 30L64 24M74 26V20M86 26L88 20M97 34L101 30", "#c25a49", 2.4)}` },
    "ض": { id: "frog", word: "ضِفْدَع", en: "frog", call: "friend-frog", fill: "#b7e779", dot: "#fffdf7",
      back: `<ellipse cx="50" cy="88" rx="42" ry="8" fill="#4e9677"/>`,
      front: `${eye(78, 28, 2)}<circle cx="91" cy="35" r="5" fill="#fffdf7" ${ink(2.4)}/>${eye(91, 35, 2)}${line("M70 53Q80 57 90 51", INK, 1.6)}<path d="M16 54Q6 58 8 66L19 64" fill="#b7e779" ${ink(2.4)}/>` },
    "ط": { id: "peacock", word: "طَاوُوس", en: "peacock", call: "friend-peacock", fill: "#62cdf4",
      back: `<path d="M60 56Q70 10 100 20Q104 50 74 62Z" fill="#7fce54" ${ink(3)}/>${[[84, 28], [91, 42], [76, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="#f3c955" ${ink(1.6)}/><circle cx="${x}" cy="${y}" r="1.6" fill="#3a8fc4"/>`).join("")}`,
      front: `<circle cx="40" cy="14" r="6" fill="#62cdf4" ${ink(3)}/>${line("M38 8l-2-6M41 8V1M44 8l2-6", INK, 1.6)}<path d="M34 13l-5 1.6 5 2Z" fill="#e8743c"/>${eye(41, 13, 1.4)}${line("M40 66l-4 6M48 64l2 7", INK, 2.4)}` },
    "ظ": { id: "envelope", word: "ظَرْف", en: "envelope", call: "page", fill: "#ee806f", dot: "#c25a49",
      back: `<path d="M22 30H86V70H22Z" fill="#fffaf0" ${ink(3)}/>${line("M22 30L54 54L86 30", INK, 2.4)}` },
    "ع": { id: "grapes", word: "عِنَب", en: "grapes", call: "pop", fill: "#4e9677",
      back: [[50, 63], [60, 63], [70, 65], [55, 73], [65, 73], [60, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.2" fill="#b49fcf" ${ink(1.6)}/><circle cx="${x - 1.6}" cy="${y - 1.6}" r="1.4" fill="#e6d6f0"/>`).join(""),
      front: `<path d="M70 26Q84 14 92 26Q84 36 70 30Z" fill="#7fce54" ${ink(2.4)}/>` },
    "غ": { id: "gazelle", word: "غَزَال", en: "gazelle", call: "friend-gazelle", fill: "#c69434", dot: INK,
      back: `${line("M50 12Q42 0 36 3M58 11Q56 -1 49 -3", INK, 3)}<path d="M64 12l10-5-3 9Z" fill="#c69434" ${ink(2.4)}/>`,
      front: `<path d="M44 20Q46 8 58 9Q68 10 67 20Q64 28 54 27Q46 26 44 20Z" fill="#c69434" ${ink(3)}/>${eye(54, 16, 2)}<circle cx="46" cy="21" r="1.4" fill="${INK}"/>${line("M56 24q4 2 8-1", "#ffe49a", 3)}${legs([[60, 88, 58, 99], [76, 83, 78, 99]])}${line("M82 80l6-6", INK, 2.4)}` },
    "ف": { id: "elephant", word: "فِيل", en: "elephant", call: "friend-elephant", fill: "#c9bda4", dot: "#96ecff",
      back: `<path d="M62 50Q60 70 70 72H90Q98 66 92 48Z" fill="#c9bda4" ${ink(3)}/><path d="M80 30Q98 26 96 46Q92 58 80 50Z" fill="#e5dcc8" ${ink(3)}/>`,
      front: `${eye(72, 38, 2)}${line("M66 51q-4 4-9 3", "#fffdf7", 3)}${legs([[70, 72, 70, 80], [86, 72, 86, 80]])}<circle cx="12" cy="30" r="2" fill="#96ecff"/><circle cx="8" cy="24" r="1.6" fill="#96ecff"/>` },
    "ق": { id: "cat", word: "قِطَّة", en: "cat", call: "friend-cat", fill: "#f3c955", dot: "#ffa798",
      back: `<path d="M58 23L60 7L69 18Z" fill="#f3c955" ${ink(3)}/><path d="M70 18L78 7L79 25Z" fill="#f3c955" ${ink(3)}/>`,
      front: `${eye(64, 32)}${eye(72, 32)}<path d="M67 37h3l-1.5 2Z" fill="#c25a49"/>${line("M60 38l-8 1M60 41l-8 3M76 38l8 1M76 41l8 3", INK, 1.6)}<ellipse cx="27" cy="57" rx="6" ry="4" fill="#f3c955" ${ink(2.4)}/>` },
    "ك": { id: "book", word: "كِتَاب", en: "book", call: "page", fill: "#3a8fc4",
      back: `<path d="M24 22H80V64H24Z" fill="#fffaf0" ${ink(3)}/>${line("M62 32H74M62 40H74M62 48H74M28 32H40M28 40H40M28 48H40", "#c9bda4", 2.4)}`,
      front: line("M56 34Q46 38 54 42Q46 46 54 50", "#ee806f", 4) },
    "ل": { id: "lemon", word: "لَيْمُون", en: "lemon", call: "drip", fill: "#4e9677",
      back: `<ellipse cx="42" cy="66" rx="12" ry="9" fill="#ffe49a" ${ink(3)}/>${line("M36 62q3-3 7-3", "#fffdf7", 3)}`,
      front: `<path d="M64 18Q76 8 86 16Q76 24 64 20Z" fill="#7fce54" ${ink(2.4)}/>` },
    // Meem's friend is the key — مِفْتَاح, the word this whole app is named for.
    "م": { id: "key", word: "مِفْتَاح", en: "key", call: "clink", fill: "#f3c955",
      front: `<circle cx="56" cy="42" r="3.6" fill="#fffaf0" ${ink(1.6)}/><path d="M43 71h-9v5h9Z" fill="#f3c955" ${ink(2.4)}/><path d="M43 79h-9v5h9Z" fill="#f3c955" ${ink(2.4)}/>${line("M50 36q3-3 7-3", "#fffdf7", 3)}` },
    "ن": { id: "bee", word: "نَحْلَة", en: "bee", call: "friend-bee", fill: "#ee806f", dot: "#f3c955",
      back: `${line("M52 78V99", "#4e9677", 4)}<path d="M22 42Q14 30 26 28Q30 36 26 44Z" fill="#ffa798" ${ink(2.4)}/><path d="M82 40Q90 28 78 26Q74 34 78 42Z" fill="#ffa798" ${ink(2.4)}/>`,
      front: `<ellipse cx="48" cy="23" rx="5" ry="3.6" fill="#ccfbef" ${ink(1.6)}/><ellipse cx="56" cy="23" rx="5" ry="3.6" fill="#ccfbef" ${ink(1.6)}/>${line("M51 27v6M54 27v6", INK, 1.6)}${line("M58 32q10 4 15-6", INK, 1.6)}` },
    "ه": { id: "hoopoe", word: "هُدْهُد", en: "hoopoe", call: "friend-hoopoe", fill: "#ffa798",
      back: `<path d="M40 30L34 10L42 22L46 5L50 22L58 10L54 30Z" fill="#e8743c" ${ink(2.4)}/>`,
      front: `<path d="M31 50Q16 50 9 58Q18 56 31 56Z" fill="#a89478" ${ink(1.6)}/>${eye(37, 52, 2)}${line("M65 52l6 2M65 60l7 1M63 68l6 3", INK, 3)}${line("M45 79l-2 11M56 79l2 11", INK, 2.4)}` },
    "و": { id: "rose", word: "وَرْدَة", en: "rose", call: "chime", fill: "#ee806f",
      back: `<path d="M38 44Q34 28 50 28Q66 28 64 44Q66 60 50 60Q34 60 38 44Z" fill="#ffa798" ${ink(3)}/>`,
      front: `<path d="M44 72Q34 62 30 70Q36 78 44 72Z" fill="#7fce54" ${ink(2.4)}/>` },
    "ي": { id: "dove", word: "يَمَامَة", en: "dove", call: "friend-dove", fill: "#fffdf7", dot: "#ffa798",
      back: `<path d="M40 66Q54 54 70 64Q56 76 40 72Z" fill="#ccfbef" ${ink(2.4)}/>`,
      front: `${eye(64, 41)}<path d="M70 38l7 2-7 3Z" fill="#f3c955" ${ink(1.6)}/><path d="M30 54L15 46L19 59Z" fill="#fffdf7" ${ink(2.4)}/>` },
  };

  const CHARS = Object.keys(FRIENDS);

  function art(char, { size = 120, mode = "full", label = false } = {}) {
    const f = FRIENDS[char];
    const strokes = ns.LettersStrokes?.LETTERS?.[char];
    if (!f || !strokes) return "";
    const paths = strokes.filter((s) => typeof s === "string");
    const dots = strokes.filter((s) => s && s.dot).map((s) => s.dot);
    const body = paths.map((d) => `<path class="lf-ink" d="${d}" fill="none" stroke="${INK}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" data-ribbon/>`).join("")
      + paths.map((d) => `<path class="lf-fill" d="${d}" fill="none" stroke="${f.fill}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" data-ribbon/>`).join("")
      + dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.4" fill="${INK}"/><circle class="lf-fill-dot" cx="${x}" cy="${y}" r="3.6" fill="${f.dot || f.fill}"/>`).join("");
    const cls = mode === "full" ? "" : ` is-${mode}`;
    return `<svg class="lf${cls}" data-friend="${char}" viewBox="-6 -6 112 112" width="${size}" height="${size}" ${label ? `role="img" aria-label="${f.en}"` : 'aria-hidden="true"'}><g class="lf-dress lf-back">${f.back || ""}</g><g class="lf-body">${body}</g><g class="lf-dress lf-front">${f.front || ""}</g></svg>`;
  }

  // How much of the friend a letter still needs, from the Brain's friend skill:
  // full while the association is new, soft as it takes hold, plain once the
  // bare letter is enough. Never a gate — any look can always be tapped.
  function look(knowledge) {
    if (!(knowledge > 0)) return "full";
    return knowledge >= 0.85 ? "plain" : knowledge >= 0.5 ? "soft" : "full";
  }

  // The friend as a speakable item: says the friend's name (taught as a name).
  const item = (char) => FRIENDS[char] ? { id: `friend:${char}`, display: FRIENDS[char].word, speak: FRIENDS[char].word, friendOf: char } : null;

  ns.LetterFriends = { FRIENDS, CHARS, art, look, item, get: (char) => FRIENDS[char] || null };
})(window.MiftahGame || (window.MiftahGame = {}));
