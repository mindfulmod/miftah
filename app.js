"use strict";

const DATA_VERSION = "20260703-audio-refs";
const withDataVersion = (path) =>
  `${path}${path.includes("?") ? "&" : "?"}v=${DATA_VERSION}`;
const MANIFEST_FILE = withDataVersion("data/surahs.json");
const SURAH_NUMBER =
  Number(new URLSearchParams(location.search).get("surah")) || 1;
const SURAH_FILE = withDataVersion(`data/surah-${SURAH_NUMBER}.json`);
const STORAGE_KEY = `quran-trainer:surah-${SURAH_NUMBER}:progress`;
// Remember the last-opened surah so the tab bar's Continue lands here.
try {
  localStorage.setItem("quran-trainer:last-surah", String(SURAH_NUMBER));
} catch {}
const STATS_KEY = `quran-trainer:stats:surah-${SURAH_NUMBER}`; // per-word mistake history, accumulates across sessions
const CONFUSION_KEY = `quran-trainer:confusions:surah-${SURAH_NUMBER}`; // gloss-pair collision counts
const PICKER_URL = "surahs.html";
const MISTAKE_RATE = 0.2; // up to 20% wrong attempts allowed per ayah

// ---------- Today's session ----------
// A bounded daily ritual measured in focused MINUTES, not ayah count (spec:
// specs/01-trainer-v2.md). The goal is a floor, not a ceiling: reaching it
// shows a soft "done for today" panel, and Keep Going stays open. There is
// never a visible countdown, and a session only ever pauses at a card/ayah
// boundary. Due reviews warm the session up before new material.
const PACES = {
  gentle: { label: "Gentle", minutes: 3 },
  steady: { label: "Steady", minutes: 5 },
  devoted: { label: "Devoted", minutes: 10 },
};
const PACE_KEY = "quran-trainer:pace"; // "gentle" (default) | "steady" | "devoted"
const getPace = () => {
  try {
    const p = localStorage.getItem(PACE_KEY);
    return PACES[p] ? p : "gentle";
  } catch {
    return "gentle";
  }
};
const setPace = (p) => {
  if (!PACES[p]) return;
  try {
    localStorage.setItem(PACE_KEY, p);
  } catch {}
};
const paceBudgetMs = () => PACES[getPace()].minutes * 60000;

// Active time is credited between answer events, capped so a wandering-off
// phone doesn't "finish" the session by itself.
const IDLE_CAP_MS = 40000;

const SESSION_KEY = "quran-trainer:session"; // { date, items, activeMs, warmed, panelShown } — global, resets daily
const STREAK_KEY = "quran-trainer:streak"; // { count, lastDate } — consecutive days a goal was met

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

function loadSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");
    if (s.date === todayStr()) {
      return {
        date: s.date,
        items: s.items || s.count || 0, // `count` is the pre-time-goal shape
        activeMs: s.activeMs || 0,
        warmed: !!s.warmed,
        panelShown: !!s.panelShown,
      };
    }
  } catch {}
  return { date: todayStr(), items: 0, activeMs: 0, warmed: false, panelShown: false };
}

// Credit the time since the last answer toward today's session (idle-capped).
let sessionLastEvent = Date.now();
function addSessionTime() {
  const t = Date.now();
  const delta = Math.max(0, Math.min(t - sessionLastEvent, IDLE_CAP_MS));
  sessionLastEvent = t;
  const s = loadSession();
  s.activeMs += delta;
  saveSession(s);
  return s;
}

const sessionGoalMet = (s = loadSession()) => s.activeMs >= paceBudgetMs();

function saveSession(s) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {}
}

function loadStreak() {
  try {
    const s = JSON.parse(localStorage.getItem(STREAK_KEY) || "{}");
    return { count: s.count || 0, lastDate: s.lastDate || null };
  } catch {
    return { count: 0, lastDate: null };
  }
}

// Bump the day's streak the first time today's goal is met. Continues the run if
// yesterday counted, otherwise starts a fresh streak at 1.
function bumpStreak() {
  const s = loadStreak();
  const today = todayStr();
  if (s.lastDate === today) return s.count; // already counted today
  s.count = s.lastDate === yesterdayStr() ? s.count + 1 : 1;
  s.lastDate = today;
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(s));
  } catch {}
  return s.count;
}

// "Rescued" words: ones missed at least once, then answered correctly. We count
// these per day and celebrate them — reframing mistakes as the very mechanism of
// learning (a slip you recover from is a memory that sticks), which keeps the
// habit alive instead of letting a wrong answer feel like failure.
const RESCUE_KEY = "quran-trainer:rescued"; // { date, count } — resets daily

function loadRescued() {
  try {
    const s = JSON.parse(localStorage.getItem(RESCUE_KEY) || "{}");
    if (s.date === todayStr()) return { date: s.date, count: s.count || 0 };
  } catch {}
  return { date: todayStr(), count: 0 };
}

function bumpRescued() {
  const s = loadRescued();
  s.count += 1;
  try {
    localStorage.setItem(RESCUE_KEY, JSON.stringify(s));
  } catch {}
  return s.count;
}

// Option count grows with familiarity: a brand-new word gets fewer choices to
// build confidence; a well-seen word gets more to keep the retrieval honest.
const optionCountFor = (exposures) => (exposures >= 3 ? 5 : exposures >= 1 ? 4 : 3);

// Scheduling now lives in the unified FSRS store (strength.js); the trainer
// only keeps a pacing rule so in-flow reviews never stack between ayahs.
const REVIEW_MIN_GAP = 2; // never inject two review cards within this many ayahs

const progressKeyFor = (n) => `quran-trainer:surah-${n}:progress`;

function passedCount(n) {
  try {
    const d = JSON.parse(localStorage.getItem(progressKeyFor(n)) || "{}");
    return Number.isInteger(d.passed) ? d.passed : 0;
  } catch {
    return 0;
  }
}

// Some Arabic forms repeat with different contextual phrasing in English. The
// quiz should ask for the stable core meaning, while solved/revealed cells can
// still show the phrase-level context.
const answerFor = (w) => w.answer || w.english;
const displayGloss = (w) =>
  w.display || (w.context ? `${answerFor(w)} — ${w.context}` : w.english || answerFor(w));
const literalGloss = (w) => w.english || answerFor(w);

// Stable id for a word by its Arabic form + quiz answer, so the same word in
// different ayahs aggregates into one "trouble word" entry.
const wordId = (w) => `${w.arabic}|||${answerFor(w)}`;

// Real recitation playback (shared module with the island game); a silent
// stub keeps everything working if the script didn't load.
// Recitation on/off, persisted. RecitationAudio consults this before every
// play, so one switch silences word clips and ayah recitation alike.
const RECITE_KEY = "quran-trainer:recitation"; // "on" (default) | "off"
const reciteEnabled = () => {
  try {
    return localStorage.getItem(RECITE_KEY) !== "off";
  } catch {
    return true;
  }
};

const recite =
  window.MiftahGame && window.MiftahGame.RecitationAudio
    ? new window.MiftahGame.RecitationAudio(reciteEnabled)
    : { playWord() {}, playAyah() {}, stop() {} };

// Small speaker button used on ayah lines and reveals.
function hearAyahButton(ayahNumber, title = "Hear this ayah recited") {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "hear-btn";
  btn.textContent = "🔊";
  btn.title = title;
  btn.setAttribute("aria-label", title);
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    recite.playAyah(surah.number, ayahNumber);
  });
  return btn;
}

const els = {
  app: document.getElementById("app"),
  loading: document.getElementById("loading"),
  title: document.getElementById("surah-title"),
  subtitle: document.getElementById("surah-subtitle"),
  progressFill: document.getElementById("progress-fill"),
  progressLabel: document.getElementById("progress-label"),
  perfectLabel: document.getElementById("perfect-label"),
  ringFill: document.getElementById("ring-fill"),
  ringLabel: document.getElementById("ring-label"),
  sessionRing: document.getElementById("session-ring"),
  sources: document.getElementById("sources"),
  resetBtn: document.getElementById("reset-progress"),
  ayahTpl: document.getElementById("ayah-template"),
  wordTpl: document.getElementById("word-template"),
};

// Speaker toggle in the progress row mirrors and flips the recitation setting.
const reciteToggle = document.getElementById("recite-toggle");
if (reciteToggle) {
  const paintReciteToggle = () => {
    const on = reciteEnabled();
    reciteToggle.setAttribute("aria-pressed", String(on));
    reciteToggle.title = on
      ? "Recitation audio is on — tap to mute"
      : "Recitation is muted — tap to unmute";
  };
  reciteToggle.addEventListener("click", () => {
    const on = reciteEnabled();
    try {
      localStorage.setItem(RECITE_KEY, on ? "off" : "on");
    } catch {}
    if (on) recite.stop();
    paintReciteToggle();
  });
  paintReciteToggle();
}

let surah = null;
let uniqueWords = []; // one representative word per gloss: {arabic, english, translit, root}
let glossInfo = new Map(); // english gloss -> that representative word
let rootIndex = new Map(); // root -> [{arabic, english}] sharing it (for "same root" hints)
let currentIndex = 0; // index into surah.ayahs of the active (not-yet-passed) ayah
let perfectSet = new Set(); // ayah numbers passed with zero mistakes
let stats = {}; // wordId -> { arabic, english, translit, root, miss, correct } (legacy per-surah view; strength.js is the scheduler)
let confusions = loadConfusions(); // "glossA||glossB" (sorted) -> collision count
let lastReviewIndex = -REVIEW_MIN_GAP; // ayah index of the last injected review card

// ---------- helpers ----------

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The reveal line, built straight from the word glosses the learner just
// matched, so it always aligns with them. Parentheses in glosses mark implied
// words (e.g. "(of) Allah") — we keep the text but drop the brackets so it
// reads as one literal sentence.
function literalMeaning(ayah) {
  return ayah.words
    .map(literalGloss)
    .join(" ")
    .replace(/[()[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mistakeBudget(wordCount) {
  // Always forgive at least one slip, even on very short ayahs.
  return Math.max(1, Math.ceil(MISTAKE_RATE * wordCount));
}

// Roots shared by 2+ words anywhere in the surah, restricted to those that
// actually appear in this ayah. Teaches that a new word is a sibling of one the
// learner has already met (e.g. ٱلرَّحْمَـٰن and ٱلرَّحِيم both from ر-ح-م).
function ayahRootFamilies(ayah) {
  const seen = new Set();
  const families = [];
  for (const w of ayah.words) {
    if (!w.root || seen.has(w.root)) continue;
    seen.add(w.root);
    const members = rootIndex.get(w.root) || [];
    if (members.length >= 2) families.push({ root: w.root, members });
  }
  return families;
}

// Render the "shared roots" chips into a reveal box (idempotent — clears first).
function fillRevealRoots(reveal, ayah) {
  reveal.querySelector(".reveal-roots")?.remove();
  const families = ayahRootFamilies(ayah);
  if (!families.length) return;

  const box = document.createElement("div");
  box.className = "reveal-roots";
  for (const fam of families) {
    const chip = document.createElement("div");
    chip.className = "root-chip";
    const r = document.createElement("span");
    r.className = "root-letters";
    r.dir = "rtl";
    r.textContent = fam.root.split("").join(" ");
    const glosses = document.createElement("span");
    glosses.className = "root-glosses";
    glosses.textContent = fam.members.map((m) => m.english).join(" · ");
    chip.append(r, glosses);
    box.appendChild(chip);
  }
  reveal.appendChild(box);
}

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Reverent glow (manuscript-warmth celebration, locked 2026-07-16): a soft
// gold bloom, one expanding halo, and a few slow motes rising like sparks
// from a lamp. A "perfect" pass burns brighter and lifts a couple more
// motes — never louder, only warmer. No confetti in this house.
function celebrate(anchorEl, perfect) {
  if (prefersReducedMotion()) return;
  const rect = anchorEl.getBoundingClientRect();
  const layer = document.createElement("div");
  layer.className = "glow-layer";
  layer.style.left = rect.left + rect.width / 2 + "px";
  layer.style.top = rect.top + 56 + "px";

  const bloom = document.createElement("i");
  bloom.className = "glow-bloom" + (perfect ? " perfect" : "");
  layer.appendChild(bloom);

  const halo = document.createElement("i");
  halo.className = "glow-halo";
  layer.appendChild(halo);

  const motes = perfect ? 7 : 4;
  for (let i = 0; i < motes; i++) {
    const m = document.createElement("i");
    m.className = "glow-mote";
    const drift = (Math.random() - 0.5) * 90;
    m.style.setProperty("--dx", drift + "px");
    m.style.setProperty("--dy", -(50 + Math.random() * 70) + "px");
    m.style.left = (Math.random() - 0.5) * 120 + "px";
    m.style.animationDelay = i * 90 + "ms";
    layer.appendChild(m);
  }

  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1800);
}

function closeAllMenus() {
  document.querySelectorAll(".dd.open").forEach((dd) => {
    dd.classList.remove("open");
    const menu = dd.querySelector(".dd-menu");
    if (menu) menu.hidden = true;
    const trig = dd.querySelector(".dd-trigger");
    if (trig) trig.setAttribute("aria-expanded", "false");
  });
}

// Strip diacritics to a bare consonant skeleton so we can judge how similar two
// Arabic words *look*. Harakat, tanwin, dagger alif, Quranic annotations, tatweel.
const DIACRITICS = /[ً-ْٰٓ-ٟؐ-ؚۖ-ۭـ]/g;
const skeleton = (s) => s.normalize("NFC").replace(DIACRITICS, "");

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = prev[j];
      prev[j] =
        a[i - 1] === b[j - 1]
          ? diag
          : 1 + Math.min(diag, prev[j], prev[j - 1]);
      diag = tmp;
    }
  }
  return prev[n];
}

function arabicSimilarity(a, b) {
  const x = skeleton(a);
  const y = skeleton(b);
  if (!x || !y) return 0;
  return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
}

// A different word sharing this word's root that appeared in an ayah the
// learner has already passed — fuel for the root-family micro-lesson.
function knownRootSibling(word) {
  if (!word || !word.root || !surah) return null;
  const meKey = arabicConceptKey(word.arabic);
  for (const past of surah.ayahs.slice(0, currentIndex)) {
    for (const w of past.words) {
      if (w.root === word.root && arabicConceptKey(w.arabic) !== meKey) return w;
    }
  }
  return null;
}

// Production-direction options: the word itself plus the three most
// look-alike Arabic forms in the surah (skeleton similarity), so recalling
// the script takes real discrimination, not shape-spotting.
function reverseOptions(word) {
  const seen = new Set([arabicConceptKey(word.arabic)]);
  const pool = uniqueWords
    .filter((w) => {
      const key = arabicConceptKey(w.arabic);
      if (seen.has(key)) return false;
      if (glossKey(answerFor(w)) === glossKey(answerFor(word))) return false;
      seen.add(key);
      return true;
    })
    .sort(
      (a, b) =>
        arabicSimilarity(b.arabic, word.arabic) -
        arabicSimilarity(a.arabic, word.arabic)
    );
  return shuffle([word.arabic, ...pool.slice(0, 3).map((w) => w.arabic)]);
}

// Glosses that differ only in case/punctuation ("The Most Gracious" vs "the
// Most Gracious") mean the same thing, so one must never be a distractor for the
// other. Collapse to a comparison key for that check.
const glossKey = (g) =>
  g
    .toLowerCase()
    .replace(/[()[\].,;:!?'"-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeArabicLetters = (s) =>
  skeleton(s || "")
    .replace(/[^\u0621-\u064A]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ى/g, "ي");

function arabicConceptKey(value) {
  let core = normalizeArabicLetters(value);
  while (/^[وف]/.test(core) && core.length > 3) core = core.slice(1);
  if (core === "لله") return "الله";
  if (/^[بك]/.test(core) && core[1] === "ا" && core.length > 4) {
    core = core.slice(1);
  }
  if (core === "لله") return "الله";
  if (core.startsWith("لل") && core.length > 4) {
    core = "ال" + core.slice(2);
  } else if (core[0] === "ل" && core[1] === "ا" && core.length > 4) {
    core = core.slice(1);
  }
  return core === "لله" ? "الله" : core;
}

const BEGINNER_CONTEXT_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "be",
  "belong",
  "belongs",
  "but",
  "by",
  "for",
  "from",
  "had",
  "has",
  "have",
  "in",
  "is",
  "of",
  "on",
  "so",
  "that",
  "the",
  "then",
  "to",
  "upon",
  "was",
  "were",
  "while",
  "with",
]);

function beginnerGlossKey(g) {
  const words = (g || "")
    .toLowerCase()
    .replace(/\[[^\]]*\]|\([^)]*\)/g, " ")
    .replace(/['’]s\b/g, "")
    .replace(/[.,;:!?'"’\-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);

  while (words.length && BEGINNER_CONTEXT_WORDS.has(words[0])) words.shift();
  while (words.length && BEGINNER_CONTEXT_WORDS.has(words[words.length - 1])) {
    words.pop();
  }
  return words.join(" ");
}

function optionKeys(word, gloss) {
  const keys = new Set();
  const exact = glossKey(gloss || "");
  const beginner = beginnerGlossKey(gloss || "");
  const arabic = word ? arabicConceptKey(word.arabic) : "";
  if (exact) keys.add(`gloss:${exact}`);
  if (beginner) keys.add(`meaning:${beginner}`);
  if (arabic) keys.add(`arabic:${arabic}`);
  return keys;
}

const hasBannedKey = (keys, bannedKeys) => [...keys].some((key) => bannedKeys.has(key));

function rememberOption(keys, bannedKeys) {
  keys.forEach((key) => bannedKeys.add(key));
}

// The gloss of another word whose Arabic looks closest to this one — a
// confusable distractor that forces the learner to read the letters, not guess.
function lookalikeWord(word, bannedKeys) {
  let best = null;
  let bestScore = -1;
  for (const cand of uniqueWords) {
    const answer = answerFor(cand);
    if (hasBannedKey(optionKeys(cand, answer), bannedKeys)) continue;
    const score = arabicSimilarity(word.arabic, cand.arabic);
    if (score > bestScore) {
      bestScore = score;
      best = cand;
    }
  }
  return bestScore > 0.34 ? best : null; // ignore words that aren't actually alike
}

// The gloss of another word from the same triliteral root — semantically near,
// so picking it apart reinforces the fine distinction between siblings.
function sameRootWord(word, bannedKeys) {
  if (!word.root) return null;
  const family = (rootIndex.get(word.root) || []).filter(
    (m) => !hasBannedKey(optionKeys(m, answerFor(m)), bannedKeys)
  );
  if (!family.length) return null;
  return family[Math.floor(Math.random() * family.length)];
}

// Build the option set: always the correct gloss, then (when available) one
// look-alike and one same-root distractor, padded with random glosses. The
// total grows with how many times the learner has already seen this word.
function buildOptions(word) {
  const correct = answerFor(word);
  const id = wordId(word);
  const stat = stats[id];
  const exposures = stat
    ? stat.miss + stat.correct
    : (word.miss || 0) + (word.correct || 0); // strength entries carry their own counters
  const target = Math.min(optionCountFor(exposures), uniqueWords.length);

  const bannedKeys = optionKeys(word, correct);
  const distractors = [];
  const add = (candidate) => {
    if (!candidate) return;
    const answer = answerFor(candidate);
    const keys = optionKeys(candidate, answer);
    if (!answer || hasBannedKey(keys, bannedKeys)) return;
    rememberOption(keys, bannedKeys);
    distractors.push(answer);
  };

  add(lookalikeWord(word, bannedKeys));
  add(sameRootWord(word, bannedKeys));
  for (const candidate of shuffle(uniqueWords)) {
    if (distractors.length >= target - 1) break;
    add(candidate);
  }

  return shuffle([correct, ...distractors]);
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { passed: 0, perfect: [] };
    const data = JSON.parse(raw);
    return {
      passed: Number.isInteger(data.passed) ? data.passed : 0,
      perfect: Array.isArray(data.perfect) ? data.perfect : [],
    };
  } catch {
    return { passed: 0, perfect: [] };
  }
}

function saveProgress() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ passed: currentIndex, perfect: [...perfectSet] })
    );
  } catch {
    /* storage unavailable — progress just won't persist */
  }
}

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function saveStats() {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* storage unavailable — stats just won't persist */
  }
}

function statEntry(word) {
  const id = wordId(word);
  const fresh = {
    arabic: word.arabic,
    english: answerFor(word),
    display: displayGloss(word),
    translit: word.translit || "",
    root: word.root || "",
    audioPath: word.audioPath || "",
  };
  if (!stats[id]) {
    stats[id] = {
      ...fresh,
      miss: 0,
      correct: 0,
    };
  } else {
    Object.assign(stats[id], fresh);
    stats[id].miss = stats[id].miss || 0;
    stats[id].correct = stats[id].correct || 0;
  }
  return stats[id];
}

function syncStatsWithCurrentSurah() {
  if (!surah || !stats) return;
  let changed = false;
  for (const ayah of surah.ayahs) {
    for (const word of ayah.words) {
      const stat = stats[wordId(word)];
      if (!stat) continue;
      const fresh = {
        arabic: word.arabic,
        english: answerFor(word),
        display: displayGloss(word),
        translit: word.translit || "",
        root: word.root || "",
        audioPath: word.audioPath || "",
      };
      for (const [key, value] of Object.entries(fresh)) {
        if (stat[key] !== value) {
          stat[key] = value;
          changed = true;
        }
      }
    }
  }
  if (changed) saveStats();
}

// Pick one FSRS-due word to resurface between ayahs — this surah's words
// first, then anything due store-wide — skipping the ayah just completed.
function pickDueReview(justFinishedAyah) {
  if (currentIndex - lastReviewIndex < REVIEW_MIN_GAP) return null;
  const exclude = new Set(justFinishedAyah.words.map((w) => wordId(w)));
  const due = WordStrength.dueWords({ surahFirst: SURAH_NUMBER, limit: 12 }).filter(
    (e) => !exclude.has(e.id)
  );
  return due[0] || null;
}

// ---------- confusion pairs ----------
// When a wrong pick is itself a real gloss from this surah, the learner isn't
// guessing randomly — they're swapping two specific words. Count those
// collisions per (sorted) gloss pair; at two, a tell-apart drill becomes due.
function loadConfusions() {
  try {
    const data = JSON.parse(localStorage.getItem(CONFUSION_KEY) || "{}");
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function saveConfusions() {
  try {
    localStorage.setItem(CONFUSION_KEY, JSON.stringify(confusions));
  } catch {
    /* storage unavailable — confusion tracking just won't persist */
  }
}

function recordConfusion(correctGloss, pickedGloss) {
  if (!pickedGloss || pickedGloss === correctGloss) return;
  if (!glossInfo.has(pickedGloss)) return; // free-form miss, not a swap
  const key = [correctGloss, pickedGloss].sort().join("||");
  confusions[key] = (confusions[key] || 0) + 1;
  saveConfusions();
}

// A pair is due for a tell-apart round once it has collided twice and both
// words are present in this surah. Shares the interleave gap so drills and
// reviews don't stack between consecutive ayahs.
function pickDueContrast() {
  if (currentIndex - lastReviewIndex < REVIEW_MIN_GAP) return null;
  const due = Object.entries(confusions)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1]);
  for (const [key] of due) {
    const [g1, g2] = key.split("||");
    const w1 = glossInfo.get(g1);
    const w2 = glossInfo.get(g2);
    if (w1 && w2) return { key, words: [w1, w2] };
  }
  return null;
}

// The single write path for every answer: legacy per-surah stats (trouble
// lists, Memory Forge) AND the unified FSRS store, in one call. Time is
// credited to the session here too — every answer is an activity heartbeat.
function recordMiss(word) {
  statEntry(word).miss += 1;
  saveStats();
  WordStrength.review(word, 1, { source: "trainer", surah: SURAH_NUMBER });
  addSessionTime();
}

function recordCorrect(word) {
  statEntry(word).correct += 1;
  saveStats();
  WordStrength.review(word, 3, { source: "trainer", surah: SURAH_NUMBER });
  addSessionTime();
}

// Words missed at least once, hardest first. Drives the review-mode unlock.
function missedWords() {
  return Object.values(stats)
    .filter((s) => s.miss > 0)
    .sort((a, b) => b.miss - a.miss);
}

function updateHeaderProgress() {
  const total = surah.ayahs.length;
  const pct = Math.round((currentIndex / total) * 100);
  els.progressFill.style.width = pct + "%";
  els.progressLabel.textContent =
    currentIndex >= total
      ? "Complete ✓"
      : `Ayah ${currentIndex + 1} of ${total}`;

  if (perfectSet.size > 0) {
    els.perfectLabel.hidden = false;
    els.perfectLabel.textContent = `★ Perfect ${perfectSet.size}/${total}`;
  } else {
    els.perfectLabel.hidden = true;
  }
}

// Draw today's session ring: a circular arc that fills as the day's ayahs are
// completed. r=19 → circumference ≈ 119.38; we shrink the dash offset toward 0
// as progress climbs. Goes gold and shows a check once the goal is met.
const RING_CIRC = 2 * Math.PI * 19;

function updateSessionRing() {
  if (!els.ringFill) return;
  const s = loadSession();
  const budget = paceBudgetMs();
  const frac = Math.min(s.activeMs / budget, 1);
  els.ringFill.style.strokeDasharray = `${RING_CIRC}`;
  els.ringFill.style.strokeDashoffset = `${RING_CIRC * (1 - frac)}`;
  const complete = sessionGoalMet(s);
  els.sessionRing.classList.toggle("complete", complete);
  els.sessionRing.classList.toggle("lit", s.activeMs > 0 && !complete);
  const mins = Math.floor(s.activeMs / 60000);
  const goalMins = PACES[getPace()].minutes;
  els.ringLabel.textContent = complete ? "✓" : `${mins}/${goalMins}m`;
  els.sessionRing.title = complete
    ? "Today's session complete — keep going if you like"
    : `Today's session — ${mins} of ${goalMins} focused minutes (${PACES[getPace()].label} pace)`;
}

// ---------- rendering ----------

function scrollToCurrentPanel(behavior = "smooth") {
  const target =
    currentIndex >= surah.ayahs.length
      ? els.app.querySelector(".completion")
      : els.app.querySelector(".ayah.active");
  if (!target) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      target.scrollIntoView({
        block: "start",
        behavior: prefersReducedMotion() ? "auto" : behavior,
      });
    });
  });
}

function render({ focusCurrent = false, focusBehavior = "smooth" } = {}) {
  els.app.innerHTML = "";
  updateHeaderProgress();
  updateSessionRing();

  surah.ayahs.forEach((ayah, idx) => {
    if (idx < currentIndex) els.app.appendChild(renderPassedAyah(ayah));
    else if (idx === currentIndex) els.app.appendChild(renderActiveAyah(ayah));
    // future ayahs stay hidden until reached
  });

  if (currentIndex >= surah.ayahs.length) {
    els.app.appendChild(renderCompletion());
  }

  if (focusCurrent) scrollToCurrentPanel(focusBehavior);
}

function renderCompletion() {
  const done = document.createElement("section");
  done.className = "ayah passed completion";

  const head = document.createElement("div");
  head.className = "ayah-head";
  const status = document.createElement("span");
  status.className = "ayah-status";
  status.textContent = `🎉 You completed ${surah.englishName} — every word matched.`;
  head.appendChild(status);
  done.appendChild(head);

  const missed = missedWords();
  const cta = document.createElement("div");
  cta.className = "completion-cta";

  // The surah-complete celebration unlock: follow the whole recitation with
  // meaning arriving live — both the reward and the honest fluency test.
  const followMsg = document.createElement("p");
  followMsg.className = "completion-msg";
  followMsg.textContent =
    "✨ Unlocked: follow the full recitation and see if the meaning keeps up.";
  const followLink = document.createElement("a");
  followLink.className = "primary-link";
  followLink.href = `follow.html?surah=${SURAH_NUMBER}`;
  followLink.textContent = "▶ Follow the recitation";
  cta.append(followMsg, followLink);

  if (missed.length > 0) {
    const total = missed.reduce((n, s) => n + s.miss, 0);
    const wordLabel = missed.length === 1 ? "word" : "words";
    const p = document.createElement("p");
    p.className = "completion-msg";
    p.textContent = `You tripped on ${missed.length} ${wordLabel} (${total} slip${
      total === 1 ? "" : "s"
    } in total). Drill just those until they stick.`;
    const link = document.createElement("a");
    link.className = "primary-link";
    link.href = `review.html?surah=${SURAH_NUMBER}`;
    link.textContent = `Review missed words →`;
    cta.append(p, link);
  } else {
    const p = document.createElement("p");
    p.className = "completion-msg";
    p.textContent =
      "Flawless — you passed every word without a single slip. Nothing to drill.";
    cta.appendChild(p);
  }

  done.appendChild(cta);
  return done;
}

// The bounded-session end-state: shown once today's goal is met. Frames a clean
// stopping point ("come back tomorrow") while leaving the door open to keep going.
// Render today's session as a 1080×1080 share image (canvas, house palette)
// and hand it to the native share sheet; fall back to a download. Rare-moment
// delight: this only exists behind the session-complete panel.
async function shareSessionCard({ streak, rescued }) {
  const W = 1080;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = W;
  const x = c.getContext("2d");

  x.fillStyle = "#13110d";
  x.fillRect(0, 0, W, W);
  const glow = x.createRadialGradient(W / 2, -80, 0, W / 2, -80, 950);
  glow.addColorStop(0, "#2a2114");
  glow.addColorStop(1, "rgba(42, 33, 20, 0)");
  x.fillStyle = glow;
  x.fillRect(0, 0, W, W);

  x.strokeStyle = "rgba(227, 183, 95, 0.55)";
  x.lineWidth = 3;
  x.strokeRect(48.5, 48.5, W - 97, W - 97);

  // Khatim (8-point star): two squares, one rotated 45°.
  const star = (cx, cy, r, rot) => {
    x.save();
    x.translate(cx, cy);
    x.rotate(rot);
    x.strokeRect(-r, -r, r * 2, r * 2);
    x.restore();
  };
  x.strokeStyle = "#e3b75f";
  x.lineWidth = 4;
  star(W / 2, 210, 52, 0);
  star(W / 2, 210, 52, Math.PI / 4);

  x.textAlign = "center";
  x.fillStyle = "#f1ece3";
  x.font = "700 62px Inter, system-ui, sans-serif";
  x.fillText("Session complete", W / 2, 412);

  const items = loadSession().items;
  x.fillStyle = "#46b187";
  x.font = "700 170px Inter, system-ui, sans-serif";
  x.fillText(String(items), W / 2, 610);
  x.fillStyle = "#a89a87";
  x.font = "400 44px Inter, system-ui, sans-serif";
  x.fillText(`ayah${items === 1 ? "" : "s"} decoded today`, W / 2, 676);

  x.fillStyle = "#e3b75f";
  x.font = "600 46px Inter, system-ui, sans-serif";
  const surahName = surah ? surah.englishName : "";
  x.fillText(
    `${surahName}${surahName ? " · " : ""}${streak}-day streak`,
    W / 2,
    780
  );

  if (rescued > 0) {
    x.fillStyle = "#a89a87";
    x.font = "400 38px Inter, system-ui, sans-serif";
    x.fillText(
      `${rescued} slip${rescued === 1 ? "" : "s"} turned into wins`,
      W / 2,
      850
    );
  }

  x.fillStyle = "#a89a87";
  x.font = "500 38px Inter, system-ui, sans-serif";
  x.fillText("Miftah — Quranic Arabic Trainer", W / 2, W - 96);

  const blob = await new Promise((r) => c.toBlob(r, "image/png"));
  if (!blob) return;
  const file = new File([blob], "miftah-session.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: "Miftah",
        text: "My Quran vocabulary practice today",
      });
      return;
    } catch (err) {
      if (err && err.name === "AbortError") return; // user closed the sheet
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "miftah-session.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}

function renderSessionComplete(streak) {
  els.app.innerHTML = "";
  updateHeaderProgress();
  updateSessionRing();

  const panel = document.createElement("section");
  panel.className = "session-done";

  const ring = document.createElement("div");
  ring.className = "session-done-ring";
  ring.innerHTML = `
    <svg viewBox="0 0 96 96" width="96" height="96" aria-hidden="true">
      <circle class="sdr-bg" cx="48" cy="48" r="42"></circle>
      <circle class="sdr-fill" cx="48" cy="48" r="42"></circle>
    </svg>
    <span class="session-done-check">✓</span>`;

  const h = document.createElement("h2");
  h.className = "session-done-title";
  h.textContent = "Session complete";

  const sub = document.createElement("p");
  sub.className = "session-done-sub";
  sub.textContent = `That's your ${PACES[getPace()].minutes} focused minutes for today. Resting now beats rushing — let it settle and come back tomorrow.`;

  // Pace presets, not a slider (locked 2026-07-16): who are you today?
  const paceRow = document.createElement("div");
  paceRow.className = "session-done-cta pace-row";
  for (const [key, p] of Object.entries(PACES)) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = key === getPace() ? "primary-btn" : "ghost-btn";
    b.textContent = `${p.label} · ${p.minutes}m`;
    b.title = `Daily goal becomes about ${p.minutes} focused minutes`;
    b.addEventListener("click", () => {
      setPace(key);
      updateSessionRing();
      renderSessionComplete(loadStreak().count);
    });
    paceRow.appendChild(b);
  }

  const streakEl = document.createElement("p");
  streakEl.className = "session-done-streak";
  streakEl.innerHTML =
    streak > 1
      ? `🔥 <strong>${streak}-day streak</strong> — keep it alive tomorrow.`
      : `🔥 <strong>Day 1</strong> — come back tomorrow to start a streak.`;

  // Positive reinforcement: misses you recovered from are the ones that stuck.
  const rescued = loadRescued().count;
  let rescuedEl = null;
  if (rescued > 0) {
    rescuedEl = document.createElement("p");
    rescuedEl.className = "session-done-rescued";
    rescuedEl.innerHTML = `💪 <strong>${rescued} word${
      rescued === 1 ? "" : "s"
    } rescued</strong> today — slips you turned into wins. That's where it sticks.`;
  }

  const cta = document.createElement("div");
  cta.className = "session-done-cta";

  const more = document.createElement("button");
  more.type = "button";
  more.className = "primary-btn";
  more.textContent = "Keep going ›";
  more.addEventListener("click", () => render({ focusCurrent: true }));

  const share = document.createElement("button");
  share.type = "button";
  share.className = "ghost-btn gold";
  share.textContent = "Share today's progress";
  share.addEventListener("click", () => shareSessionCard({ streak, rescued }));

  const back = document.createElement("a");
  back.className = "ghost-btn";
  back.href = PICKER_URL;
  back.textContent = "Back to surahs";

  cta.append(more, share, back);
  panel.append(ring, h, sub, streakEl);
  if (rescuedEl) panel.append(rescuedEl);
  panel.append(cta, paceRow);
  els.app.appendChild(panel);

  // Fill the big ring after paint so the stroke animates in.
  const big = panel.querySelector(".sdr-fill");
  const c = 2 * Math.PI * 42;
  big.style.strokeDasharray = `${c}`;
  big.style.strokeDashoffset = `${c}`;
  requestAnimationFrame(() =>
    requestAnimationFrame(() => (big.style.strokeDashoffset = "0"))
  );
}

// In-flow spaced review: a single card for a word missed in an earlier ayah,
// shown between ayahs so hard words resurface while you're still progressing
// rather than only after the whole surah is done. Leaves the ayah test itself
// untouched — this is a brief detour, then we continue.
function renderReviewCard(word, onDone, { inflow = true, banner = null } = {}) {
  if (!onDone) onDone = () => render({ focusCurrent: true });
  if (inflow) lastReviewIndex = currentIndex; // keep the between-ayah gap honest
  els.app.innerHTML = "";
  updateHeaderProgress();
  updateSessionRing();

  // Three ways a word can resurface — recognition (Arabic → meaning),
  // listening (audio → meaning) and production (meaning → Arabic script).
  // Ear and recall are different skills; rotating the direction randomly
  // also stops the learner pattern-matching the card instead of the word.
  const modes = ["classic"];
  if (word.audioPath && reciteEnabled()) modes.push("listen");
  if (uniqueWords.length >= 4) modes.push("reverse");
  const mode = modes[Math.floor(Math.random() * modes.length)];

  const card = document.createElement("section");
  card.className = "ayah review-card";

  const head = document.createElement("div");
  head.className = "ayah-head";
  const tag = document.createElement("span");
  tag.className = "ayah-status";
  tag.textContent =
    banner ||
    (mode === "listen"
      ? "↻ Quick review — by ear this time"
      : mode === "reverse"
        ? "↻ Quick review — now produce it"
        : "↻ Quick review — this one was due");
  head.appendChild(tag);

  const arabic = document.createElement("div");
  arabic.className = "review-card-arabic";
  arabic.dir = "rtl";
  arabic.textContent = word.arabic;

  const prompt = document.createElement("p");
  prompt.className = "review-card-prompt";
  prompt.textContent = "What does it mean?";

  const opts = document.createElement("div");
  opts.className = "review-card-options";

  const feedback = document.createElement("p");
  feedback.className = "ayah-message";

  let listenBtn = null;
  if (mode === "listen") {
    arabic.hidden = true; // revealed after answering
    prompt.textContent = "Listen — which meaning is it?";
    listenBtn = document.createElement("button");
    listenBtn.type = "button";
    listenBtn.className = "listen-btn";
    listenBtn.textContent = "🔊 Play the word";
    listenBtn.addEventListener("click", () => recite.playWord(word.audioPath));
  } else if (mode === "reverse") {
    arabic.hidden = true; // the script IS the answer
    prompt.textContent = `Which word means “${displayGloss(word)}”?`;
  }

  const correctText = mode === "reverse" ? word.arabic : answerFor(word);

  const finish = (recalled, chosen) => {
    // recordCorrect/recordMiss carry the answer into BOTH stores (legacy
    // stats + unified FSRS) — the one write path for every answer.
    if (recalled) recordCorrect(word);
    else {
      recordMiss(word);
      // Track the swap: chosen is a gloss in classic/listen mode, an Arabic
      // form in reverse mode — map the latter back to its gloss.
      const chosenSource =
        mode === "reverse" ? uniqueWords.find((w) => w.arabic === chosen) : null;
      const chosenGloss = mode === "reverse" ? (chosenSource ? answerFor(chosenSource) : "") : chosen;
      recordConfusion(answerFor(word), chosenGloss);
    }
    updateSessionRing();

    arabic.hidden = false; // listen/reverse reveal the script now
    if (listenBtn) listenBtn.disabled = true;

    [...opts.children].forEach((b) => {
      b.disabled = true;
      if (b.textContent === correctText) b.classList.add("correct");
    });

    feedback.textContent = recalled
      ? "Recalled ✓ — it'll come back less often now."
      : `Not yet — this word means “${displayGloss(word)}”. It'll return soon.`;
    feedback.className = "ayah-message " + (recalled ? "pass" : "reset");

    const cont = document.createElement("button");
    cont.type = "button";
    cont.className = "primary-link";
    cont.textContent = "Continue →";
    cont.addEventListener("click", onDone);
    card.appendChild(cont);
  };

  const options = mode === "reverse" ? reverseOptions(word) : buildOptions(word);
  options.forEach((g) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "review-opt" + (mode === "reverse" ? " ar" : "");
    if (mode === "reverse") btn.dir = "rtl";
    btn.textContent = g;
    btn.addEventListener("click", () => finish(g === correctText, g));
    opts.appendChild(btn);
  });

  card.append(head, arabic, prompt);
  if (listenBtn) card.appendChild(listenBtn);
  card.append(opts, feedback);
  els.app.appendChild(card);
}

// Two glosses the learner keeps swapping get a dedicated tell-apart round:
// both words back to back with only those two choices. Direct discrimination
// practice beats meeting each word alone — the contrast is the lesson.
function renderContrastDrill(drill) {
  els.app.innerHTML = "";
  updateHeaderProgress();

  const pair = shuffle([...drill.words]);
  const glosses = drill.words.map((w) => answerFor(w));
  let round = 0;
  let clean = true;

  const card = document.createElement("section");
  card.className = "ayah review-card contrast-drill";

  const head = document.createElement("div");
  head.className = "ayah-head";
  const tag = document.createElement("span");
  tag.className = "ayah-status";
  head.appendChild(tag);

  const arabic = document.createElement("div");
  arabic.className = "review-card-arabic";
  arabic.dir = "rtl";

  const prompt = document.createElement("p");
  prompt.className = "review-card-prompt";
  prompt.textContent = "Only two choices — which is it?";

  const opts = document.createElement("div");
  opts.className = "review-card-options";

  const feedback = document.createElement("p");
  feedback.className = "ayah-message";

  const ask = () => {
    const word = pair[round];
    tag.textContent = `⚡ Tell-apart ${round + 1}/2 — you keep swapping these`;
    arabic.textContent = word.arabic;
    feedback.textContent = "";
    feedback.className = "ayah-message";
    opts.innerHTML = "";
    for (const g of shuffle([...glosses])) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "review-opt";
      btn.textContent = g;
      btn.addEventListener("click", () => pick(word, g, btn));
      opts.appendChild(btn);
    }
  };

  const pick = (word, g, btn) => {
    if (g === answerFor(word)) {
      btn.classList.add("correct");
      [...opts.children].forEach((b) => (b.disabled = true));
      recordCorrect(word);
      recite.playWord(word.audioPath);
      round += 1;
      if (round < pair.length) {
        setTimeout(ask, 700);
        return;
      }
      // Success clears the tangle; a slip keeps the pair warm for one more round.
      confusions[drill.key] = clean ? 0 : 1;
      saveConfusions();
      lastReviewIndex = currentIndex;
      feedback.textContent = clean
        ? "Untangled ✓ — both told apart, first try."
        : "Done — one slip, so this pair will visit once more.";
      feedback.className = "ayah-message " + (clean ? "pass" : "reset");
      const cont = document.createElement("button");
      cont.type = "button";
      cont.className = "primary-link";
      cont.textContent = "Continue →";
      cont.addEventListener("click", () => render({ focusCurrent: true }));
      card.appendChild(cont);
      return;
    }
    clean = false;
    btn.classList.add("wrong");
    btn.disabled = true;
    recordMiss(word);
    const other = drill.words.find((w) => answerFor(w) === g);
    feedback.innerHTML =
      `“${g}” is <span dir="rtl">${other ? other.arabic : ""}</span> — ` +
      `this one is <strong>“${displayGloss(word)}”</strong>.`;
    feedback.className = "ayah-message reset contrast";
  };

  card.append(head, arabic, prompt, opts, feedback);
  els.app.appendChild(card);
  ask();
}

function renderPassedAyah(ayah) {
  const node = els.ayahTpl.content.firstElementChild.cloneNode(true);
  node.classList.add("passed");
  node.querySelector(".ayah-num").textContent = `${surah.number}:${ayah.number}`;

  const isPerfect = perfectSet.has(ayah.number);
  node.classList.add(isPerfect ? "perfect-pass" : "complete-pass");
  const statusEl = node.querySelector(".ayah-status");
  statusEl.textContent = "Passed ✓";
  statusEl.after(hearAyahButton(ayah.number));
  if (isPerfect) {
    const badge = document.createElement("span");
    badge.className = "badge-perfect";
    badge.textContent = "★ Perfect";
    statusEl.after(badge);
  }
  node.querySelector(".mistake-meter").textContent = "";

  const reveal = node.querySelector(".ayah-reveal");
  reveal.hidden = false;
  reveal.querySelector(".reveal-badge").remove();
  reveal.querySelector(".reveal-literal").textContent = literalMeaning(ayah);
  reveal.querySelector(".reveal-translation").textContent =
    "Saheeh International: " + ayah.translation;
  fillRevealRoots(reveal, ayah);

  const words = node.querySelector(".words");
  ayah.words.forEach((w) => {
    const cell = els.wordTpl.content.firstElementChild.cloneNode(true);
    cell.classList.add("correct");
    if (w.root && (rootIndex.get(w.root) || []).length >= 2) {
      cell.classList.add("shares-root");
    }
    cell.querySelector(".arabic").textContent = w.arabic;
    cell.querySelector(".dd-label").textContent = displayGloss(w);
    const trigger = cell.querySelector(".dd-trigger");
    trigger.disabled = true;
    trigger.setAttribute("aria-disabled", "true");
    words.appendChild(cell);
  });
  return node;
}

// The active ayah — the same play pattern as the Courtyard Codex: read the
// whole verse first, then decode it word by word in reading order. One word
// card at a time, tappable option buttons (no dropdowns), the ayah line
// lighting up as words are solved. All the teaching rules are unchanged:
// bounded mistake budget, full-ayah reset with contrast explanations,
// rescues, and the reveal as the reward.
function renderActiveAyah(ayah) {
  const node = els.ayahTpl.content.firstElementChild.cloneNode(true);
  node.classList.add("active");
  node.querySelector(".ayah-num").textContent = `${surah.number}:${ayah.number}`;

  // Reading stage that doubles as the live progress map.
  const readLine = document.createElement("div");
  readLine.className = "ayah-read";
  readLine.dir = "rtl";
  readLine.lang = "ar";
  const wordSpans = ayah.words.map((w, i) => {
    if (i > 0) readLine.appendChild(document.createTextNode(" "));
    const span = document.createElement("span");
    span.className = "read-word";
    span.textContent = w.arabic;
    readLine.appendChild(span);
    return span;
  });
  const readCue = document.createElement("p");
  readCue.className = "ayah-read-cue";
  readCue.textContent = "Read the verse through first — then decode each word below.";
  readCue.appendChild(hearAyahButton(ayah.number, "Hear this ayah recited before you begin"));
  const readWrap = document.createElement("div");
  readWrap.className = "ayah-read-wrap";
  readWrap.append(readLine, readCue);
  node.querySelector(".ayah-head").after(readWrap);

  const budget = mistakeBudget(ayah.words.length);
  const statusEl = node.querySelector(".ayah-status");
  const meterEl = node.querySelector(".mistake-meter");
  const msgEl = node.querySelector(".ayah-message");

  // The play zone replaces the old per-word dropdown grid.
  const playEl = document.createElement("div");
  playEl.className = "play-zone";
  const card = document.createElement("div");
  card.className = "play-card";
  const cardArabic = document.createElement("div");
  cardArabic.className = "review-card-arabic play-card-arabic";
  cardArabic.dir = "rtl";
  cardArabic.title = "Hear this word";
  const cardTranslit = document.createElement("div");
  cardTranslit.className = "play-card-translit";
  card.append(cardArabic, cardTranslit);
  const prompt = document.createElement("p");
  prompt.className = "review-card-prompt";
  prompt.textContent = "What does this word mean?";
  const optsEl = document.createElement("div");
  optsEl.className = "review-card-options";
  playEl.append(card, prompt, optsEl);
  node.querySelector(".words").replaceWith(playEl);

  // attempt-local state (same rules as before, now sequential)
  const state = {
    mistakes: 0,
    budget,
    solved: new Set(),
    idx: 0,
    total: ayah.words.length,
    clean: true, // no wrong picks AND no hints — the bar for "Perfect"
    resets: 0, // full-ayah failures so far; gates the teaching contrast feedback
    missedNow: new Set(), // word indexes slipped on, for rescue detection
  };

  statusEl.textContent = "Decode the verse, word by word";

  const activeWord = () => ayah.words[state.idx];
  cardArabic.addEventListener("click", () => recite.playWord(activeWord()?.audioPath));

  function updateMeter() {
    meterEl.textContent = `Slips: ${state.mistakes} / ${state.budget} · Word ${Math.min(state.idx + 1, state.total)}/${state.total}`;
    meterEl.classList.toggle("danger", state.mistakes >= state.budget);
  }

  function paintLine() {
    wordSpans.forEach((span, i) => {
      span.classList.toggle("is-active-word", i === state.idx);
      span.classList.toggle("is-solved-word", i < state.idx);
    });
  }

  function resetAyah() {
    state.resets += 1;
    state.mistakes = 0;
    state.clean = false;
    state.solved.clear();
    state.missedNow.clear();
    state.idx = 0;
    msgEl.textContent =
      `Let's run this ayah again — no penalty. ` +
      `From here I'll explain each slip as you go, so it sticks.`;
    msgEl.className = "ayah-message reset";
    updateMeter();
    askWord();
  }

  function useHint(hintBtn) {
    state.clean = false;
    hintBtn.remove();
    // Narrow the field to the correct gloss plus one distractor.
    const correctAnswer = answerFor(activeWord());
    const opts = [...optsEl.querySelectorAll(".review-opt")];
    const keep = new Set([correctAnswer]);
    const wrong = opts.find((b) => b.textContent !== correctAnswer && !b.disabled);
    if (wrong) keep.add(wrong.textContent);
    opts.forEach((b) => {
      if (!keep.has(b.textContent)) b.remove();
    });
    msgEl.textContent =
      "Narrowed to two. This won't count as Perfect, but it's free.";
    msgEl.className = "ayah-message";
  }

  function askWord() {
    const word = activeWord();
    cardArabic.textContent = word.arabic;
    cardTranslit.textContent = word.translit || "";
    optsEl.innerHTML = "";
    for (const opt of buildOptions(word)) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "review-opt";
      btn.textContent = opt;
      btn.addEventListener("click", () => choose(opt, btn));
      optsEl.appendChild(btn);
    }
    const hintBtn = document.createElement("button");
    hintBtn.type = "button";
    hintBtn.className = "play-hint";
    hintBtn.textContent = "🤔 Not sure — narrow it down";
    hintBtn.addEventListener("click", () => useHint(hintBtn));
    optsEl.appendChild(hintBtn);
    paintLine();
    updateMeter();
  }

  function choose(value, btn) {
    const word = activeWord();
    if (!word) return;

    if (value === answerFor(word)) {
      btn.classList.add("correct", "pop");
      for (const b of optsEl.querySelectorAll("button")) b.disabled = true;
      recordCorrect(word);
      recite.playWord(word.audioPath);
      state.solved.add(word.position);

      // Recovered from an earlier slip on this word → a "rescue": the moment
      // a mistake becomes mastery feels like a reward, not a blemish.
      if (state.missedNow.delete(state.idx)) {
        bumpRescued();
        msgEl.textContent = "💪 Got it — a slip turned into a win.";
        msgEl.className = "ayah-message pass";
      } else {
        // Root-family micro-lesson: at the moment of success, connect this
        // word to a sibling met in an earlier ayah — after answering, so the
        // sibling's gloss can't leak the answer.
        const sib = knownRootSibling(word);
        if (sib) {
          msgEl.innerHTML =
            `Same root <strong dir="rtl">${word.root.split("").join(" ")}</strong> as ` +
            `<span dir="rtl">${sib.arabic}</span> — “${answerFor(sib)}”, which you met earlier.`;
          msgEl.className = "ayah-message root-moment";
        } else {
          msgEl.textContent = "";
          msgEl.className = "ayah-message";
        }
      }

      state.idx += 1;
      wordSpans[state.idx - 1]?.classList.add("pop");
      if (state.solved.size === state.total) {
        paintLine();
        updateMeter();
        checkComplete();
        return;
      }
      setTimeout(askWord, 320);
      return;
    }

    // wrong pick
    btn.classList.add("wrong");
    btn.disabled = true; // must pick a different option — re-clicking teaches nothing
    state.mistakes += 1;
    state.clean = false;
    state.missedNow.add(state.idx);
    recordMiss(word);
    recordConfusion(answerFor(word), value);
    updateMeter();

    if (state.mistakes > state.budget) {
      resetAyah();
      return;
    }

    const remaining = state.budget - state.mistakes;

    // Once the learner has failed the whole ayah at least once, stop clearing
    // the slip silently — spell out the contrast so the wrong↔right pairing
    // actually teaches instead of just resetting.
    if (state.resets >= 1) {
      const owner = glossInfo.get(value);
      const belongsTo = owner ? ` — that's “${owner.arabic}”` : "";
      msgEl.innerHTML =
        `<strong>“${value}”</strong>${belongsTo}. This word means ` +
        `<strong>“${displayGloss(word)}”</strong>. ${remaining} slip${
          remaining === 1 ? "" : "s"
        } left.`;
      msgEl.className = "ayah-message reset contrast";
      return;
    }

    msgEl.textContent = `Not quite — ${remaining} mistake${
      remaining === 1 ? "" : "s"
    } left before this ayah resets.`;
    msgEl.className = "ayah-message reset";
  }

  function checkComplete() {
    const perfect = state.clean;
    if (perfect) perfectSet.add(ayah.number);

    const reveal = node.querySelector(".ayah-reveal");
    const badge = reveal.querySelector(".reveal-badge");
    badge.textContent = perfect ? "★ Perfect — no mistakes" : "Complete ✓";
    badge.classList.toggle("perfect", perfect);
    reveal.querySelector(".reveal-literal").textContent = literalMeaning(ayah);
    reveal.querySelector(".reveal-translation").textContent =
      "Saheeh International: " + ayah.translation;
    fillRevealRoots(reveal, ayah);
    reveal.querySelector(".reveal-badge").after(hearAyahButton(ayah.number));
    reveal.hidden = false;
    playEl.hidden = true;
    node.classList.add("revealing");
    node.classList.add(perfect ? "perfect-pass" : "complete-pass");
    // Confetti caps the choreography: pulse (0ms) → reveal (120ms) →
    // badge stamp (340ms, see styles.css) → burst.
    setTimeout(() => celebrate(node, perfect), 400);
    // The reward for finishing the test: hear the whole ayah recited.
    recite.playAyah(surah.number, ayah.number);
    msgEl.textContent = "";
    msgEl.className = "ayah-message";

    currentIndex += 1;
    saveProgress();
    updateHeaderProgress();

    // Count this ayah toward today's session and refresh the ring. The time
    // itself accrued answer by answer (recordCorrect/recordMiss); the goal
    // check only ever happens HERE, on an ayah boundary — never mid-word.
    const session = loadSession();
    session.items += 1;
    const justHitGoal = sessionGoalMet(session) && !session.panelShown;
    saveSession(session);
    updateSessionRing();

    // The moment today's goal is reached, pause and show the session-complete
    // end-state instead of auto-advancing — the natural place to stop for the day.
    if (justHitGoal) {
      const streak = bumpStreak();
      const s = loadSession();
      s.panelShown = true;
      saveSession(s);
      setTimeout(() => renderSessionComplete(streak), 1600);
      return;
    }

    // After a short beat: a tell-apart drill if two glosses keep colliding,
    // else a review of an earlier missed word, else straight on.
    const drill = pickDueContrast();
    const review = drill ? null : pickDueReview(ayah);
    setTimeout(() => {
      if (drill) renderContrastDrill(drill);
      else if (review) renderReviewCard(review);
      else render({ focusCurrent: true });
    }, 1600);
  }

  askWord();
  return node;
}

// ---------- boot ----------

// A surah is unlocked if it's the first in the manifest, the one before it (in
// manifest order) has every ayah passed, OR it already has progress of its own.
// That last (sticky) clause must match the home screen's unlock rule (picker.js)
// exactly — otherwise a surah can look open on the home grid yet refuse to load
// here, e.g. after an earlier surah is reset while you're deep in a later one.
// Returns null when unlocked, or the previous surah's entry when locked, so we
// can tell the user what to finish.
async function lockedBehind() {
  let manifest;
  try {
    manifest = await (await fetch(MANIFEST_FILE)).json();
  } catch {
    return null; // no manifest — don't block, fall through to normal load
  }
  const list = Array.isArray(manifest.surahs) ? manifest.surahs : [];
  const idx = list.findIndex((s) => s.number === SURAH_NUMBER);
  if (idx <= 0) return null; // first surah (or unknown) is always available
  if (passedCount(SURAH_NUMBER) > 0) return null; // sticky: keep started surahs open
  const prev = list[idx - 1];
  return passedCount(prev.number) >= prev.ayahCount ? null : prev;
}

function showLocked(prev) {
  els.title.textContent = "Locked";
  if (els.subtitle) els.subtitle.textContent = "";
  els.loading.remove();
  const box = document.createElement("section");
  box.className = "ayah passed completion";
  const head = document.createElement("div");
  head.className = "ayah-head";
  const status = document.createElement("span");
  status.className = "ayah-status";
  status.textContent = "🔒 This surah is locked";
  head.appendChild(status);
  const cta = document.createElement("div");
  cta.className = "completion-cta";
  const p = document.createElement("p");
  p.className = "completion-msg";
  p.textContent = `Finish ${prev.englishName} first — every ayah must be passed before this one opens.`;
  const link = document.createElement("a");
  link.className = "primary-link";
  link.href = PICKER_URL;
  link.textContent = "← Back to all surahs";
  cta.append(p, link);
  box.append(head, cta);
  els.app.appendChild(box);
}

async function init() {
  const prev = await lockedBehind();
  if (prev) {
    showLocked(prev);
    return;
  }

  let data;
  try {
    const res = await fetch(SURAH_FILE);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    els.loading.textContent =
      "Could not load the Quran data file. Run `node scripts/build-data.mjs` and serve the folder over http.";
    console.error(err);
    return;
  }

  surah = { ...data.surah, ayahs: data.ayahs };

  // Every word learns its recitation clip path (the build verifies the
  // deterministic pattern and stores explicit paths only for exceptions).
  const pad3 = (n) => String(n).padStart(3, "0");
  for (const a of data.ayahs) {
    for (const w of a.words) {
      w.audioPath =
        w.audio || `wbw/${pad3(surah.number)}_${pad3(a.number)}_${pad3(w.position)}.mp3`;
    }
  }

  // Build the distractor/root lookups once: one representative word per gloss,
  // and an index of which words share each triliteral root.
  glossInfo = new Map();
  rootIndex = new Map();
  const rootSeen = new Map(); // root -> Set of glosses already indexed (dedupe)
  for (const a of data.ayahs) {
    for (const w of a.words) {
      const answer = answerFor(w);
      if (!glossInfo.has(answer)) glossInfo.set(answer, w);
      if (w.root) {
        if (!rootIndex.has(w.root)) {
          rootIndex.set(w.root, []);
          rootSeen.set(w.root, new Set());
        }
        const key = glossKey(answer);
        if (!rootSeen.get(w.root).has(key)) {
          rootSeen.get(w.root).add(key);
          rootIndex.get(w.root).push({ arabic: w.arabic, english: answer });
        }
      }
    }
  }
  uniqueWords = [...glossInfo.values()];

  els.title.textContent = `${surah.englishName} · ${surah.name}`;
  if (els.subtitle)
    els.subtitle.textContent = `${surah.englishTranslation} — word-by-word meaning trainer`;
  els.sources.textContent =
    "Arabic verified across two independent sources: " + (data.sources || []).join(" + ");

  const progress = loadProgress();
  currentIndex = Math.min(progress.passed, surah.ayahs.length);
  perfectSet = new Set(progress.perfect);
  stats = loadStats();
  syncStatsWithCurrentSurah();

  els.loading.remove();
  sessionLastEvent = Date.now();
  startWarmup();
}

// Due reviews open the session (warm-up first, then new material — locked
// 2026-07-16). A handful of the most-due words run as review cards before the
// active ayah appears; once per day, capped so it never eats the whole sitting.
const WARMUP_CAP = 8;

function startWarmup() {
  const done = () =>
    render({ focusCurrent: currentIndex > 0, focusBehavior: "auto" });

  const session = loadSession();
  if (session.warmed || currentIndex >= surah.ayahs.length) return done();

  const queue = WordStrength.dueWords({ surahFirst: SURAH_NUMBER, limit: WARMUP_CAP });
  session.warmed = true; // marked up front so a mid-warm-up refresh can't loop it
  saveSession(session);
  if (!queue.length) return done();

  const total = queue.length;
  const step = () => {
    const next = queue.shift();
    if (!next || sessionGoalMet()) return done();
    renderReviewCard(next, step, {
      inflow: false,
      banner: `☀ Warm-up ${total - queue.length}/${total} — due from earlier days`,
    });
  };
  step();
}

els.resetBtn.addEventListener("click", () => {
  currentIndex = 0;
  perfectSet.clear();
  saveProgress();
  render();
});

document.addEventListener("click", closeAllMenus);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllMenus();
});

init();
