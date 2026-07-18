"use strict";

// Shared UI strings for the trainer chrome (spec: specs/01-trainer-v2.md).
// The learning content (Arabic, glosses, tarjuma) is localized in app.js via
// the Urdu data layer; THIS file localizes the interface around it — buttons,
// prompts, session copy — so an Urdu-first learner meets an Urdu app, not an
// English app with Urdu words pasted in.
//
// Urdu copy is deliberately simple, warm Urdu — a family reviewer should skim
// it and flag anything that reads stiff. Callable as I18N.t("key", ...args).
(function (root) {
  const LANG = (() => {
    try {
      return localStorage.getItem("quran-trainer:lang") === "ur" ? "ur" : "en";
    } catch {
      return "en";
    }
  })();

  const S = {
    en: {
      progressAyah: (n, total) => `Ayah ${n} of ${total}`,
      progressComplete: "Complete ✓",
      perfect: (n, total) => `★ Perfect ${n}/${total}`,
      decodePrompt: "Decode the verse, word by word",
      readCue: "Read the verse through first — then decode each word below.",
      wordMeaning: "What does this word mean?",
      slips: (m, budget, idx, total) => `Slips: ${m} / ${budget} · Word ${idx}/${total}`,
      notSure: "🤔 Not sure — narrow it down",
      narrowed: "Narrowed to two. This won't count as Perfect, but it's free.",
      rescued: "💪 Got it — a slip turned into a win.",
      runAgain:
        "Let's run this ayah again — no penalty. From here I'll explain each slip as you go, so it sticks.",
      slipsLeft: (n) => `Not quite — ${n} mistake${n === 1 ? "" : "s"} left before this ayah resets.`,
      badgePerfect: "★ Perfect — no mistakes",
      badgeComplete: "Complete ✓",
      warmup: (i, total) => `☀ Warm-up ${i}/${total} — due from earlier days`,
      reviewByEar: "↻ Quick review — by ear this time",
      reviewProduce: "↻ Quick review — now produce it",
      reviewDue: "↻ Quick review — this one was due",
      reviewMeaningPrompt: "What does it mean?",
      listenPrompt: "Listen — which meaning is it?",
      playWord: "🔊 Play the word",
      recalled: "Recalled ✓ — it'll come back less often now.",
      notYet: (g) => `Not yet — this word means “${g}”. It'll return soon.`,
      continue: "Continue →",
      contrastTag: (n) => `⚡ Tell-apart ${n}/2 — you keep swapping these`,
      contrastPrompt: "Only two choices — which is it?",
      untangled: "Untangled ✓ — both told apart, first try.",
      oneSlip: "Done — one slip, so this pair will visit once more.",
      passed: "Passed ✓",
      sessionTitle: "Session complete",
      sessionSub: (m) =>
        `That's your ${m} focused minutes for today. Resting now beats rushing — let it settle and come back tomorrow.`,
      keepGoing: "Keep going ›",
      shareProgress: "Share today's progress",
      backToSurahs: "Back to surahs",
      teaserTitle: "Waiting for you tomorrow",
      teaserSub: "One word from the ayahs ahead — let it turn over in your mind until then.",
    },
    ur: {
      progressAyah: (n, total) => `آیت ${n} از ${total}`,
      progressComplete: "مکمل ✓",
      perfect: (n, total) => `★ بے عیب ${n}/${total}`,
      decodePrompt: "آیت کو لفظ بہ لفظ سمجھیں",
      readCue: "پہلے پوری آیت پڑھیں — پھر نیچے ہر لفظ کھولیں۔",
      wordMeaning: "اس لفظ کا کیا مطلب ہے؟",
      slips: (m, budget, idx, total) => `غلطیاں: ${m} / ${budget} · لفظ ${idx}/${total}`,
      notSure: "🤔 یقین نہیں — آپشن کم کریں",
      narrowed: "دو تک محدود۔ اس سے ”بے عیب“ نہیں رہے گا، مگر مفت ہے۔",
      rescued: "💪 مل گیا — غلطی جیت میں بدل گئی۔",
      runAgain: "آئیے یہ آیت دوبارہ کریں — کوئی سزا نہیں۔ اب ہر غلطی سمجھاؤں گا تاکہ یاد رہے۔",
      slipsLeft: (n) => `بالکل نہیں — آیت دوبارہ ہونے سے پہلے ${n} غلطی${n === 1 ? "" : "اں"} باقی ہیں۔`,
      badgePerfect: "★ بے عیب — کوئی غلطی نہیں",
      badgeComplete: "مکمل ✓",
      warmup: (i, total) => `☀ دہرائی ${i}/${total} — پچھلے دنوں سے باقی`,
      reviewByEar: "↻ فوری دہرائی — اِس بار سن کر",
      reviewProduce: "↻ فوری دہرائی — اب خود بتائیں",
      reviewDue: "↻ فوری دہرائی — اس کا وقت آ گیا تھا",
      reviewMeaningPrompt: "اس کا کیا مطلب ہے؟",
      listenPrompt: "سنیں — کون سا مطلب ہے؟",
      playWord: "🔊 لفظ سنیں",
      recalled: "یاد آ گیا ✓ — اب یہ کم دہرایا جائے گا۔",
      notYet: (g) => `ابھی نہیں — اس لفظ کا مطلب ”${g}“ ہے۔ یہ جلد واپس آئے گا۔`,
      continue: "جاری رکھیں →",
      contrastTag: (n) => `⚡ فرق پہچانیں ${n}/2 — آپ اِن دونوں کو الجھاتے ہیں`,
      contrastPrompt: "صرف دو آپشن — کون سا ہے؟",
      untangled: "سلجھ گیا ✓ — دونوں پہلی بار میں پہچان لیے۔",
      oneSlip: "ہو گیا — ایک غلطی، تو یہ جوڑا ایک بار اور آئے گا۔",
      passed: "مکمل ✓",
      sessionTitle: "سبق مکمل",
      sessionSub: (m) =>
        `آج کے ${m} منٹ مکمل۔ جلدی سے بہتر آرام ہے — اسے جمنے دیں اور کل واپس آئیں۔`,
      keepGoing: "‹ جاری رکھیں",
      shareProgress: "آج کی پیش رفت شیئر کریں",
      backToSurahs: "سورتوں کی طرف",
      teaserTitle: "کل آپ کا انتظار",
      teaserSub: "آنے والی آیتوں میں سے ایک لفظ — تب تک اسے ذہن میں گھلنے دیں۔",
    },
  };

  const dict = S[LANG];

  root.I18N = {
    lang: LANG,
    isUrdu: LANG === "ur",
    t(key, ...args) {
      const v = dict[key];
      if (v == null) return S.en[key] != null ? call(S.en[key], args) : key;
      return call(v, args);
    },
  };

  function call(v, args) {
    return typeof v === "function" ? v(...args) : v;
  }
})(window);
