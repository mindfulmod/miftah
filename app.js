"use strict";

const DATA_VERSION = "20260703-audio-refs";
const withDataVersion = (path) =>
  `${path}${path.includes("?") ? "&" : "?"}v=${DATA_VERSION}`;
const MANIFEST_FILE = withDataVersion("data/surahs.json");
const SURAH_NUMBER =
  Number(new URLSearchParams(location.search).get("surah")) || 1;
const SURAH_FILE = withDataVersion(`data/surah-${SURAH_NUMBER}.json`);
const STORAGE_KEY = `quran-trainer:surah-${SURAH_NUMBER}:progress`;
const STATS_KEY = `quran-trainer:stats:surah-${SURAH_NUMBER}`; // per-word mistake history, accumulates across sessions
const INTERLEAVE_KEY = `quran-trainer:interleave:surah-${SURAH_NUMBER}`; // in-flow review schedule
const PICKER_URL = "surahs.html";
const MISTAKE_RATE = 0.2; // up to 20% wrong attempts allowed per ayah

// ---------- Today's session ----------
// A bounded daily ritual: finish this many ayahs and you've "done your bit" for
// the day. Keeps each sitting small and completable (à la Drops) so the app is a
// habit, not a marathon — and so the pressure is to focus, not to rush to a far
// finish line.
const SESSION_GOAL_AYAHS = 5;
const SESSION_KEY = "quran-trainer:session"; // { date, count, panelShown } — global, resets daily
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
      return { date: s.date, count: s.count || 0, panelShown: !!s.panelShown };
    }
  } catch {}
  return { date: todayStr(), count: 0, panelShown: false };
}

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

// How long (measured in ayahs completed, not wall-clock) a correctly-recalled
// review word waits before it's due again — longer each time it survives a box.
const REVIEW_SPACING = [2, 4, 8, 16];
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
const recite =
  window.MiftahGame && window.MiftahGame.RecitationAudio
    ? new window.MiftahGame.RecitationAudio()
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

let surah = null;
let uniqueWords = []; // one representative word per gloss: {arabic, english, translit, root}
let glossInfo = new Map(); // english gloss -> that representative word
let rootIndex = new Map(); // root -> [{arabic, english}] sharing it (for "same root" hints)
let currentIndex = 0; // index into surah.ayahs of the active (not-yet-passed) ayah
let perfectSet = new Set(); // ayah numbers passed with zero mistakes
let stats = {}; // wordId -> { arabic, english, translit, root, miss, correct }
let interleave = {}; // wordId -> { box, dueIndex } drives in-flow review timing
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

// Lightweight, dependency-free confetti burst centered just below an element's
// top edge. A "perfect" run gets more particles and gold-dominant colours.
function celebrate(anchorEl, perfect) {
  if (prefersReducedMotion()) return;
  const rect = anchorEl.getBoundingClientRect();
  const layer = document.createElement("div");
  layer.className = "confetti-layer";
  layer.style.left = rect.left + rect.width / 2 + "px";
  layer.style.top = rect.top + 48 + "px";

  const colors = perfect
    ? ["#e3b75f", "#f0d68a", "#d8b25a", "#46b187", "#ffffff"]
    : ["#46b187", "#e3b75f", "#7fc9a6"];
  const count = perfect ? 30 : 16;

  for (let i = 0; i < count; i++) {
    const p = document.createElement("i");
    p.className = "confetti";
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
    const dist = 70 + Math.random() * (perfect ? 120 : 80);
    p.style.setProperty("--dx", Math.cos(angle) * dist + "px");
    p.style.setProperty("--dy", Math.sin(angle) * dist - 30 + "px");
    p.style.setProperty("--rot", Math.random() * 720 - 360 + "deg");
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = Math.random() * 60 + "ms";
    layer.appendChild(p);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1200);
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
  const exposures = stat ? stat.miss + stat.correct : 0;
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

function loadInterleave() {
  try {
    const data = JSON.parse(localStorage.getItem(INTERLEAVE_KEY) || "{}");
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function saveInterleave() {
  try {
    localStorage.setItem(INTERLEAVE_KEY, JSON.stringify(interleave));
  } catch {
    /* storage unavailable — review schedule just won't persist */
  }
}

// Pick one previously-missed word that's due to resurface and isn't part of the
// ayah just completed. Newly-missed words (no schedule yet) are due immediately.
function pickDueReview(justFinishedAyah) {
  if (currentIndex - lastReviewIndex < REVIEW_MIN_GAP) return null;
  const exclude = new Set(justFinishedAyah.words.map((w) => wordId(w)));
  const due = Object.entries(stats)
    .filter(([id, s]) => s.miss > 0 && !exclude.has(id))
    .filter(([id]) => {
      const sched = interleave[id];
      return !sched || sched.dueIndex <= currentIndex;
    })
    .sort((a, b) => b[1].miss - a[1].miss);
  if (!due.length) return null;
  return due[0][1]; // the stat entry doubles as a word ({arabic, english, root})
}

function scheduleReview(word, recalled) {
  const id = wordId(word);
  const box = recalled ? Math.min((interleave[id]?.box || 1) + 1, REVIEW_SPACING.length) : 1;
  interleave[id] = { box, dueIndex: currentIndex + REVIEW_SPACING[box - 1] };
  lastReviewIndex = currentIndex;
  saveInterleave();
}

function recordMiss(word) {
  statEntry(word).miss += 1;
  saveStats();
}

function recordCorrect(word) {
  statEntry(word).correct += 1;
  saveStats();
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
  const { count } = loadSession();
  const done = Math.min(count, SESSION_GOAL_AYAHS);
  const frac = done / SESSION_GOAL_AYAHS;
  els.ringFill.style.strokeDasharray = `${RING_CIRC}`;
  els.ringFill.style.strokeDashoffset = `${RING_CIRC * (1 - frac)}`;
  const complete = count >= SESSION_GOAL_AYAHS;
  els.sessionRing.classList.toggle("complete", complete);
  els.sessionRing.classList.toggle("lit", count > 0 && !complete);
  els.ringLabel.textContent = complete ? "✓" : `${done}/${SESSION_GOAL_AYAHS}`;
  els.sessionRing.title = complete
    ? "Today's session complete"
    : `Today's session — ${done} of ${SESSION_GOAL_AYAHS} ayahs`;
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
  sub.textContent = `You finished your ${SESSION_GOAL_AYAHS} ayahs for today. Resting now beats rushing — let it settle and come back tomorrow.`;

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

  const back = document.createElement("a");
  back.className = "ghost-btn";
  back.href = PICKER_URL;
  back.textContent = "Back to surahs";

  cta.append(more, back);
  panel.append(ring, h, sub, streakEl);
  if (rescuedEl) panel.append(rescuedEl);
  panel.append(cta);
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
function renderReviewCard(word) {
  els.app.innerHTML = "";
  updateHeaderProgress();

  const card = document.createElement("section");
  card.className = "ayah review-card";

  const head = document.createElement("div");
  head.className = "ayah-head";
  const tag = document.createElement("span");
  tag.className = "ayah-status";
  tag.textContent = "↻ Quick review — you missed this earlier";
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

  const finish = (recalled) => {
    scheduleReview(word, recalled);
    if (recalled) recordCorrect(word);
    else recordMiss(word);

    [...opts.children].forEach((b) => {
      b.disabled = true;
      if (b.textContent === answerFor(word)) b.classList.add("correct");
    });

    feedback.textContent = recalled
      ? "Recalled ✓ — it'll come back less often now."
      : `Not yet — this word means “${displayGloss(word)}”. It'll return soon.`;
    feedback.className = "ayah-message " + (recalled ? "pass" : "reset");

    const cont = document.createElement("button");
    cont.type = "button";
    cont.className = "primary-link";
    cont.textContent = "Continue →";
    cont.addEventListener("click", () => render({ focusCurrent: true }));
    card.appendChild(cont);
  };

  buildOptions(word).forEach((g) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "review-opt";
    btn.textContent = g;
    btn.addEventListener("click", () => finish(g === answerFor(word)));
    opts.appendChild(btn);
  });

  card.append(head, arabic, prompt, opts, feedback);
  els.app.appendChild(card);
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
        msgEl.textContent = "";
        msgEl.className = "ayah-message";
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
    celebrate(node, perfect);
    // The reward for finishing the test: hear the whole ayah recited.
    recite.playAyah(surah.number, ayah.number);
    msgEl.textContent = "";
    msgEl.className = "ayah-message";

    currentIndex += 1;
    saveProgress();
    updateHeaderProgress();

    // Count this ayah toward today's bounded session and refresh the ring.
    const session = loadSession();
    session.count += 1;
    const justHitGoal = session.count === SESSION_GOAL_AYAHS && !session.panelShown;
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

    // After a short beat, either slip in a review of an earlier missed word or
    // move straight on to the next ayah.
    const review = pickDueReview(ayah);
    setTimeout(() => {
      if (review) renderReviewCard(review);
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
  interleave = loadInterleave();

  els.loading.remove();
  render({
    focusCurrent: currentIndex > 0,
    focusBehavior: "auto",
  });
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
