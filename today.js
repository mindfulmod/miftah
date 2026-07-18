"use strict";

// The Today screen — the ritual's front door (spec: specs/01-trainer-v2.md).
// One glance answers three questions: how's my streak, what does today ask of
// me, and how far have I come. Everything else is one tap away.
//
// First run is a 3-step warm setup: language (English/اردو — the UI of this
// page switches instantly, and the choice steers the coming Urdu layer),
// pace preset, starting surah — then straight into the session. Anyone with
// existing surah progress skips the wizard and keeps their defaults.
//
// This page only READS session state; app.js owns the writes. The tiny
// helpers below mirror app.js's storage shapes — if those change, change
// these together.

const LANG_KEY = "quran-trainer:lang"; // "en" (default) | "ur"
const SETUP_KEY = "quran-trainer:setup"; // { done: true, at } once the wizard ran
const WEEKLY_KEY = "quran-trainer:weekly"; // { lastShown: dateStr } — the weekly letter
const PACE_KEY = "quran-trainer:pace";
const SESSION_KEY = "quran-trainer:session";
const STREAK_KEY = "quran-trainer:streak";
const LAST_SURAH_KEY = "quran-trainer:last-surah";

const PACES = {
  gentle: { minutes: 3 },
  steady: { minutes: 5 },
  devoted: { minutes: 10 },
};

// ---------- strings ----------
// The Today screen speaks both languages natively. Urdu copy is intentionally
// simple, warm Urdu — flag anything that reads stiff to the family reviewer.
const STRINGS = {
  en: {
    title: "Today",
    salam: "Assalamu alaikum",
    streakDays: (n) => `${n}-day streak`,
    streakNone: "Begin your first day",
    sessionReady: (m) => `Today's session — about ${m} focused minutes`,
    reviewsWaiting: (n) => (n === 1 ? "1 word is ready for review" : `${n} words are ready for review`),
    sessionDone: "Done for today ✓ — let it settle",
    keepGoing: "Keep going ›",
    begin: "Begin ▶",
    continueBtn: "Continue ▶",
    coverage: (p) => `Your words appear in ${p}% of Juz ʿAmma`,
    wordsKnown: (n) => `${n} word${n === 1 ? "" : "s"} met so far`,
    surahs: "Surahs",
    practice: "Practice",
    glossary: "Glossary",
    follow: "Follow",
    // wizard
    stepLang: "Which language feels like home?",
    stepPace: "How much time each day?",
    paceGentle: "Gentle",
    paceSteady: "Steady",
    paceDevoted: "Devoted",
    paceMin: (m) => `about ${m} min`,
    paceHintGentle: "A calm start — easy to keep",
    paceHintSteady: "A steady daily habit",
    paceHintDevoted: "For the eager",
    stepStart: "Where shall we begin?",
    startFatihah: "Start at Al-Fatihah",
    startFatihahHint: "The opening of the Book — where every reader begins",
    startChoose: "Choose a surah",
    startChooseHint: "Browse the whole list first",
    weeklyTitle: "Your week",
    weeklyReviews: (n) => `${n} review${n === 1 ? "" : "s"} this week`,
    weeklyWords: (n) => `${n} word${n === 1 ? "" : "s"} known and growing`,
    weeklyClose: "Lovely — keep going",
  },
  ur: {
    title: "آج",
    salam: "السلام علیکم",
    streakDays: (n) => `${n} دن کا سلسلہ`,
    streakNone: "آج پہلا دن شروع کریں",
    sessionReady: (m) => `آج کا سبق — تقریباً ${m} منٹ کی توجہ`,
    reviewsWaiting: (n) => `${n} الفاظ دہرائی کے منتظر ہیں`,
    sessionDone: "آج کے لیے مکمل ✓ — اب آرام",
    keepGoing: "‹ جاری رکھیں",
    begin: "شروع کریں ▶",
    continueBtn: "جاری رکھیں ▶",
    coverage: (p) => `آپ کے الفاظ جز عمّ کے ${p}٪ میں آتے ہیں`,
    wordsKnown: (n) => `اب تک ${n} الفاظ سیکھے`,
    surahs: "سورتیں",
    practice: "مشق",
    glossary: "فرہنگ",
    follow: "تلاوت",
    stepLang: "کون سی زبان اپنی لگتی ہے؟",
    stepPace: "روزانہ کتنا وقت؟",
    paceGentle: "ہلکا",
    paceSteady: "متوازن",
    paceDevoted: "بھرپور",
    paceMin: (m) => `تقریباً ${m} منٹ`,
    paceHintGentle: "آرام سے شروع — نبھانا آسان",
    paceHintSteady: "روز کی پکی عادت",
    paceHintDevoted: "شوق والوں کے لیے",
    stepStart: "شروعات کہاں سے؟",
    startFatihah: "الفاتحہ سے شروع کریں",
    startFatihahHint: "کتاب کا آغاز — ہر پڑھنے والے کی پہلی سورت",
    startChoose: "سورت خود چنیں",
    startChooseHint: "پہلے پوری فہرست دیکھیں",
    weeklyTitle: "آپ کا ہفتہ",
    weeklyReviews: (n) => `اس ہفتے ${n} دہرائیاں`,
    weeklyWords: (n) => `${n} الفاظ آتے ہیں اور بڑھ رہے ہیں`,
    weeklyClose: "بہت خوب — جاری رکھیں",
  },
};

const LS = {
  get(k, fb) {
    try {
      const r = localStorage.getItem(k);
      return r == null ? fb : JSON.parse(r);
    } catch {
      return fb;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
  raw(k) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
};

const getLang = () => (LS.raw(LANG_KEY) === "ur" ? "ur" : "en");
const T = () => STRINGS[getLang()];

function applyLang() {
  const ur = getLang() === "ur";
  document.documentElement.lang = ur ? "ur" : "en";
  document.body.classList.toggle("lang-ur", ur);
}

// ---------- session reads (shapes owned by app.js) ----------
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function sessionToday() {
  const s = LS.get(SESSION_KEY, {});
  if (s.date !== todayStr()) return { items: 0, activeMs: 0 };
  return { items: s.items || s.count || 0, activeMs: s.activeMs || 0 };
}

function paceMinutes() {
  const p = LS.raw(PACE_KEY);
  return (PACES[p] || PACES.gentle).minutes;
}

function streakCount() {
  const s = LS.get(STREAK_KEY, {});
  if (!s.count) return 0;
  // A streak is alive if it was fed today or yesterday.
  const d = new Date();
  const today = todayStr();
  d.setDate(d.getDate() - 1);
  const yesterday = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return s.lastDate === today || s.lastDate === yesterday ? s.count : 0;
}

function hasAnyProgress() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      if (/^quran-trainer:surah-\d+:progress$/.test(localStorage.key(i))) return true;
    }
  } catch {}
  return false;
}

function continueSurah() {
  const n = Number(LS.raw(LAST_SURAH_KEY));
  return Number.isInteger(n) && n > 0 ? n : 1;
}

// ---------- coverage (same key-set as picker.js, driven by the store) ----------
const DIACRITICS = /[ً-ْٰٓ-ٟؐ-ؚۖ-ۭـ]/g;
const skeleton = (s) => s.normalize("NFC").replace(DIACRITICS, "");

async function coverageLine() {
  const entries = WordStrength.entries().filter((e) => e.fsrs && e.fsrs.reps > 0);
  if (!entries.length) return "";
  try {
    const cov = await (await fetch("data/coverage.json")).json();
    const target = new Set(cov.keys);
    const known = new Set();
    for (const e of entries) {
      const key = skeleton(e.arabic);
      if (target.has(key)) known.add(key);
    }
    if (known.size) {
      const pct = Math.max(1, Math.round((known.size / cov.total) * 100));
      return T().coverage(pct);
    }
  } catch {}
  return T().wordsKnown(entries.length);
}

// ---------- rendering ----------
const app = document.getElementById("app");

function render() {
  applyLang();
  const t = T();
  const streak = streakCount();
  const s = sessionToday();
  const budget = paceMinutes() * 60000;
  const done = s.activeMs >= budget;
  const due = WordStrength.dueCount();
  const surah = continueSurah();
  const started = hasAnyProgress();

  let sessionLine;
  let cta;
  if (done) {
    sessionLine = t.sessionDone;
    cta = { label: t.keepGoing, ghost: true };
  } else {
    sessionLine = due > 0 ? t.reviewsWaiting(due) : t.sessionReady(paceMinutes());
    cta = { label: started ? t.continueBtn : t.begin, ghost: false };
  }

  app.innerHTML = `
    <section class="today-hero session-done">
      <p class="today-salam">${t.salam}</p>
      <div class="today-streak${streak ? " lit" : ""}">
        <span class="today-flame">🔥</span>
        <span>${streak ? t.streakDays(streak) : t.streakNone}</span>
      </div>
      <p class="today-session-line">${sessionLine}</p>
      <div class="session-done-cta">
        <a class="${cta.ghost ? "ghost-btn" : "primary-btn"} today-begin" href="trainer.html?surah=${surah}">${cta.label}</a>
      </div>
      <p class="today-coverage" id="today-coverage"></p>
    </section>
    <nav class="today-links">
      <a class="ghost-btn" href="surahs.html">${t.surahs}</a>
      <a class="ghost-btn" href="review.html">${t.practice}</a>
      <a class="ghost-btn" href="glossary.html">${t.glossary}</a>
      <a class="ghost-btn" href="follow.html?surah=${surah}">${t.follow}</a>
    </nav>`;

  coverageLine().then((line) => {
    const el = document.getElementById("today-coverage");
    if (el && line) el.textContent = line;
  });

  maybeWeeklyLetter();
}

// The weekly letter: a warm recap that surfaces at most once every 7 days,
// peak-end design over the numbers we already keep. Never guilt, only growth.
function daysBetween(a, b) {
  return Math.floor((a - b) / 86400000);
}
function maybeWeeklyLetter() {
  const t = T();
  const digest = WordStrength.weeklyDigest();
  if (digest.reviews < 5) return; // nothing worth writing home about yet
  const rec = LS.get(WEEKLY_KEY, null);
  const now = Date.now();
  if (rec && rec.shownAt && daysBetween(now, rec.shownAt) < 7) return;

  const card = document.createElement("div");
  card.className = "today-weekly session-done";
  card.innerHTML =
    `<div class="weekly-label">✦ ${t.weeklyTitle}</div>` +
    `<p class="weekly-line">${t.weeklyReviews(digest.reviews)}</p>` +
    `<p class="weekly-line">${t.weeklyWords(digest.wordsKnown)}</p>` +
    `<button type="button" class="ghost-btn weekly-close">${t.weeklyClose}</button>`;
  document.getElementById("app").prepend(card);
  card.querySelector(".weekly-close").onclick = () => {
    LS.set(WEEKLY_KEY, { shownAt: now });
    card.remove();
  };
}

// ---------- first-run wizard ----------
function renderWizard(step = 0) {
  applyLang();
  const t = T();

  const shell = (inner) => `
    <section class="today-hero session-done today-wizard">
      <div class="wizard-dots">${[0, 1, 2].map((i) => `<i class="${i === step ? "on" : i < step ? "done" : ""}"></i>`).join("")}</div>
      ${inner}
    </section>`;

  if (step === 0) {
    // Both languages speak for themselves — no flags, no English-first bias.
    app.innerHTML = shell(`
      <h2 class="session-done-title">${STRINGS.en.stepLang}</h2>
      <p class="today-salam" lang="ur">${STRINGS.ur.stepLang}</p>
      <div class="session-done-cta wizard-col">
        <button type="button" class="primary-btn" data-lang="en">English</button>
        <button type="button" class="primary-btn" data-lang="ur" lang="ur">اردو</button>
      </div>`);
    app.querySelectorAll("[data-lang]").forEach((b) => {
      b.onclick = () => {
        try {
          localStorage.setItem(LANG_KEY, b.dataset.lang);
        } catch {}
        renderWizard(1);
      };
    });
    return;
  }

  if (step === 1) {
    const pace = (key, label, hint) => `
      <button type="button" class="ghost-btn wizard-pace" data-pace="${key}">
        <b>${label}</b><span>${t.paceMin(PACES[key].minutes)} · ${hint}</span>
      </button>`;
    app.innerHTML = shell(`
      <h2 class="session-done-title">${t.stepPace}</h2>
      <div class="session-done-cta wizard-col">
        ${pace("gentle", t.paceGentle, t.paceHintGentle)}
        ${pace("steady", t.paceSteady, t.paceHintSteady)}
        ${pace("devoted", t.paceDevoted, t.paceHintDevoted)}
      </div>`);
    app.querySelectorAll("[data-pace]").forEach((b) => {
      b.onclick = () => {
        try {
          localStorage.setItem(PACE_KEY, b.dataset.pace);
        } catch {}
        renderWizard(2);
      };
    });
    return;
  }

  app.innerHTML = shell(`
    <h2 class="session-done-title">${t.stepStart}</h2>
    <div class="session-done-cta wizard-col">
      <button type="button" class="primary-btn wizard-pace" data-start="fatihah">
        <b>${t.startFatihah}</b><span>${t.startFatihahHint}</span>
      </button>
      <button type="button" class="ghost-btn wizard-pace" data-start="choose">
        <b>${t.startChoose}</b><span>${t.startChooseHint}</span>
      </button>
    </div>`);
  app.querySelectorAll("[data-start]").forEach((b) => {
    b.onclick = () => {
      LS.set(SETUP_KEY, { done: true, at: Date.now() });
      if (b.dataset.start === "fatihah") {
        try {
          localStorage.setItem(LAST_SURAH_KEY, "1");
        } catch {}
        location.href = "trainer.html?surah=1";
      } else {
        location.href = "surahs.html";
      }
    };
  });
}

// ---------- boot ----------
const setup = LS.get(SETUP_KEY, null);
if (setup && setup.done) {
  render();
} else if (hasAnyProgress()) {
  // Long-time learner: their choices are already made — no wizard.
  LS.set(SETUP_KEY, { done: true, at: Date.now(), inferred: true });
  render();
} else {
  renderWizard(0);
}
