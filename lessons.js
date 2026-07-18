"use strict";

// Grammar micro-lessons (spec: specs/01-trainer-v2.md) — eight ~30-second
// pattern cards, the highest-leverage shapes in Quranic Arabic. Each is a
// tiny "aha": name the pattern, say what it does in plain words, then show
// two or three words the learner has likely already met wearing it.
//
// Fable-drafted 2026-07-18 — OWNER APPROVES the wording before this ships as
// finished. The pattern set and pedagogy are the deliverable; polish the
// voice freely.
//
// Cards unlock gently as the learner meets more words (so lesson two doesn't
// arrive before they've seen a verb), read from the unified strength store.
// Localised en/ur; the Arabic examples are the same in both.

const LANG = (() => {
  try { return localStorage.getItem("quran-trainer:lang") === "ur" ? "ur" : "en"; } catch { return "en"; }
})();

// mark = the Arabic fragment to spotlight; ex = [{ ar, en, ur }] examples.
const LESSONS = [
  {
    id: "verb-past", unlock: 0, glyph: "فَعَلَ",
    en: { title: "The past tense", gist: "A three-letter action that already happened. Most Quranic verbs are built on this shape — learn to spot the three root letters and you can read a whole family of words." },
    ur: { title: "ماضی کا صیغہ", gist: "تین حرفی کام جو ہو چکا۔ قرآن کے اکثر افعال اسی وزن پر ہیں — تین اصل حروف پہچان لیں تو الفاظ کا پورا خاندان کھل جاتا ہے۔" },
    ex: [
      { ar: "خَلَقَ", en: "he created", ur: "اس نے پیدا کیا" },
      { ar: "أَنْعَمْتَ", en: "You bestowed", ur: "تو نے انعام کیا" },
      { ar: "قَالَ", en: "he said", ur: "اس نے کہا" },
    ],
  },
  {
    id: "verb-present", unlock: 6, glyph: "يَفْعَلُ",
    en: { title: "The present tense", gist: "Add a letter to the front (ي، تَ، نَ، أَ) and the action is happening now or will happen. يَ = he, تَ = you/she, نَ = we, أَ = I." },
    ur: { title: "حال کا صیغہ", gist: "شروع میں ایک حرف لگائیں (ي، تَ، نَ، أَ) تو کام اب ہو رہا ہے یا ہوگا۔ يَ = وہ، تَ = تُو/وہ، نَ = ہم، أَ = میں۔" },
    ex: [
      { ar: "نَعْبُدُ", en: "we worship", ur: "ہم عبادت کرتے ہیں" },
      { ar: "نَسْتَعِينُ", en: "we ask for help", ur: "ہم مدد مانگتے ہیں" },
      { ar: "يَعْلَمُونَ", en: "they know", ur: "وہ جانتے ہیں" },
    ],
  },
  {
    id: "attached-pronouns", unlock: 12, glyph: "ـهُ ـكَ ـنَا",
    en: { title: "Little endings that mean his, your, our", gist: "A pronoun can hide at the end of a word. ـهُ = his/it, ـكَ = your, ـنَا = our, ـهُمْ = their. Spot the ending and you know who." },
    ur: { title: "چھوٹے دُم جو 'اس کا، تیرا، ہمارا' بناتے ہیں", gist: "ضمیر لفظ کے آخر میں چھپ سکتی ہے۔ ـهُ = اس کا، ـكَ = تیرا، ـنَا = ہمارا، ـهُمْ = اُن کا۔ دُم پہچانیں، معلوم کہ کس کا۔" },
    ex: [
      { ar: "رَبِّهِمْ", en: "their Lord", ur: "اُن کا رب" },
      { ar: "إِيَّاكَ", en: "You alone", ur: "صرف تجھ کو" },
      { ar: "أَنْفُسَهُمْ", en: "themselves", ur: "خود کو" },
    ],
  },
  {
    id: "definite-al", unlock: 18, glyph: "الْـ",
    en: { title: "The word 'the'", gist: "ال at the front is 'the'. When it meets a 'sun letter' (like ر، س، ن) the ل goes quiet and the next letter doubles — الرَّحْمٰن sounds like 'ar-Rahman', not 'al-Rahman'." },
    ur: { title: "لفظ 'ال' یعنی the", gist: "شروع میں ال کا مطلب 'the'۔ جب یہ 'حروفِ شمسی' (جیسے ر، س، ن) سے ملے تو ل خاموش اور اگلا حرف دُگنا — الرَّحْمٰن 'ار-رحمٰن' پڑھا جاتا ہے۔" },
    ex: [
      { ar: "الْحَمْدُ", en: "the praise", ur: "سب تعریف" },
      { ar: "الرَّحْمٰنِ", en: "the Most Gracious", ur: "بڑا مہربان" },
      { ar: "الْعَالَمِينَ", en: "the worlds", ur: "سب جہان" },
    ],
  },
  {
    id: "plurals", unlock: 26, glyph: "ـونَ ـينَ",
    en: { title: "More than one", gist: "Two common plural endings for people: ـونَ and ـينَ both mean a group doing something. And many nouns pluralise by reshuffling their letters (a 'broken' plural) — كِتاب → كُتُب." },
    ur: { title: "ایک سے زیادہ", gist: "لوگوں کے لیے دو عام جمع کے دُم: ـونَ اور ـينَ، دونوں کا مطلب ایک گروہ۔ اور بہت سے اسم حروف بدل کر جمع بنتے ہیں (جمعِ مکسر) — كِتاب → كُتُب۔" },
    ex: [
      { ar: "الْمُفْلِحُونَ", en: "the successful ones", ur: "کامیاب لوگ" },
      { ar: "الصَّالِحِينَ", en: "the righteous", ur: "نیک لوگ" },
      { ar: "رُسُل", en: "messengers", ur: "رسول (جمع)" },
    ],
  },
  {
    id: "inna-family", unlock: 34, glyph: "إِنَّ أَنَّ",
    en: { title: "Indeed, that", gist: "إِنَّ at the start of a sentence means 'indeed' — a gentle emphasis, 'truly this is so'. أَنَّ inside a sentence means 'that'. Both make the word after them carry a small 'a' ending." },
    ur: { title: "بے شک، کہ", gist: "جملے کے شروع میں إِنَّ کا مطلب 'بے شک' — ایک نرم زور، 'واقعی ایسا ہے'۔ جملے کے اندر أَنَّ کا مطلب 'کہ'۔ دونوں بعد والے لفظ پر چھوٹی 'اَ' لاتے ہیں۔" },
    ex: [
      { ar: "إِنَّا", en: "indeed we", ur: "بے شک ہم" },
      { ar: "إِنَّ اللَّهَ", en: "indeed Allah", ur: "بے شک اللہ" },
      { ar: "إِنَّهُ", en: "indeed he/it", ur: "بے شک وہ" },
    ],
  },
  {
    id: "negations", unlock: 42, glyph: "لَا مَا لَمْ لَنْ",
    en: { title: "The words for 'no' and 'not'", gist: "Four small words do the negating. لَا = no / do not, مَا = not (in the past), لَمْ = did not, لَنْ = will never. Learn these four and you catch every denial." },
    ur: { title: "'نہیں' اور 'نہ' کے الفاظ", gist: "چار چھوٹے الفاظ نفی کرتے ہیں۔ لَا = نہیں / نہ کرو، مَا = نہیں (ماضی میں)، لَمْ = نہیں کیا، لَنْ = کبھی نہیں کرے گا۔ یہ چار سیکھیں، ہر انکار پکڑ لیں۔" },
    ex: [
      { ar: "لَا رَيْبَ", en: "no doubt", ur: "کوئی شک نہیں" },
      { ar: "مَا كَانَ", en: "he was not", ur: "وہ نہ تھا" },
      { ar: "لَمْ يَلِدْ", en: "he did not beget", ur: "اس نے جنم نہ دیا" },
    ],
  },
  {
    id: "connectors", unlock: 50, glyph: "وَ فَ",
    en: { title: "And, then, so", gist: "The two most common words in the Quran are single letters stuck to the front. وَ = and (joins equals). فَ = then / so (one thing leads to the next). Tiny, everywhere, and easy to skip — but they carry the flow." },
    ur: { title: "اور، پھر، تو", gist: "قرآن کے دو سب سے عام الفاظ اکیلے حروف ہیں جو آگے جُڑ جاتے ہیں۔ وَ = اور (برابر کو جوڑے)۔ فَ = پھر / تو (ایک بات دوسری کی طرف)۔ چھوٹے، ہر جگہ، آسانی سے چھوٹ جاتے — مگر روانی اِنہی سے۔" },
    ex: [
      { ar: "وَإِيَّاكَ", en: "and You alone", ur: "اور صرف تجھ کو" },
      { ar: "فَاعْبُدْهُ", en: "so worship Him", ur: "پس اسی کی عبادت کر" },
      { ar: "وَالْعَصْرِ", en: "and by the time", ur: "زمانے کی قسم" },
    ],
  },
];

const app = document.getElementById("app");

function wordsMet() {
  try {
    return WordStrength.entries().filter((e) => e.fsrs && e.fsrs.reps > 0).length;
  } catch {
    return 0;
  }
}

function render() {
  if (LANG === "ur") {
    document.documentElement.lang = "ur";
    document.body.dir = "rtl";
    document.body.classList.add("lang-ur");
  }
  const met = wordsMet();
  const title = LANG === "ur" ? "قواعد کی جھلکیاں" : "Little patterns";
  const sub = LANG === "ur"
    ? "قرآنی عربی کی سب سے مفید شکلیں — ہر ایک آدھے منٹ میں۔"
    : "The most useful shapes in Quranic Arabic — each one in about half a minute.";
  const lockedNote = LANG === "ur" ? "اور الفاظ سیکھتے جائیں، مزید کھلتے جائیں گے" : "meet more words and more will open";

  const cards = LESSONS.map((l, i) => {
    const t = l[LANG];
    const unlocked = met >= l.unlock;
    if (!unlocked) {
      return `<div class="lesson-card locked"><div class="lesson-lock">🔒</div>
        <div class="lesson-title">${t.title}</div>
        <div class="lesson-locked-note">${LANG === "ur" ? `${l.unlock} الفاظ پر کھلے گا` : `opens at ${l.unlock} words`}</div></div>`;
    }
    const ex = l.ex
      .map((e) => `<div class="lesson-ex"><span class="lesson-ex-ar ar" lang="ar">${e.ar}</span><span class="lesson-ex-en"${LANG === "ur" ? ' lang="ur"' : ""}>${LANG === "ur" ? e.ur : e.en}</span></div>`)
      .join("");
    return `<div class="lesson-card" data-i="${i}">
      <div class="lesson-glyph ar" lang="ar">${l.glyph}</div>
      <div class="lesson-title">${t.title}</div>
      <p class="lesson-gist"${LANG === "ur" ? ' lang="ur"' : ""}>${t.gist}</p>
      <div class="lesson-ex-list">${ex}</div>
    </div>`;
  }).join("");

  app.innerHTML = `
    <section class="lessons-head">
      <h1${LANG === "ur" ? ' lang="ur"' : ""}>${title}</h1>
      <p${LANG === "ur" ? ' lang="ur"' : ""}>${sub}</p>
      <p class="lessons-note"${LANG === "ur" ? ' lang="ur"' : ""}>${met} ${LANG === "ur" ? "الفاظ سیکھے · " : "words met · "}${lockedNote}</p>
    </section>
    <div class="lessons-grid">${cards}</div>`;
}

render();
