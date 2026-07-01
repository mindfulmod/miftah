"use strict";

// Review mode: a spaced-repetition drill over the words you missed in the
// main word-by-word trainer. It unlocks only once the whole surah is complete,
// and the deck is built from the per-word mistake history the trainer records.
//
// Scheduling runs on FSRS (see fsrs.js): each word carries a memory model
// (difficulty / stability), and recalling it pushes the next review further
// out while a miss pulls it back in — adaptively, per word, instead of fixed
// Leitner boxes. Real intervals are days long, so "Simulate +1 day" lets you
// fast-forward the clock and watch the schedule react.

const SURAH_NUMBER =
  Number(new URLSearchParams(location.search).get("surah")) || 1;
const DATA_VERSION = "20260629-beginner-options";
const withDataVersion = (path) =>
  `${path}${path.includes("?") ? "&" : "?"}v=${DATA_VERSION}`;
const SURAH_FILE = withDataVersion(`data/surah-${SURAH_NUMBER}.json`);
const PROGRESS_KEY = `quran-trainer:surah-${SURAH_NUMBER}:progress`; // written by the trainer
const STATS_KEY = `quran-trainer:stats:surah-${SURAH_NUMBER}`; // per-word mistake history
const STORAGE_KEY = `quran-trainer:review:surah-${SURAH_NUMBER}`; // this page's FSRS state
const TRAINER_URL = `trainer.html?surah=${SURAH_NUMBER}`;
const OPTIONS = 4;
const MIN = 60 * 1000;

// A word counts as "mastered" once its memory is stable enough to hold for
// about three weeks — the point where it no longer needs frequent drilling.
const MASTERED_DAYS = 21;
// The board's six dots fill as stability climbs past each tier (days). The
// doubling ladder mirrors how memory strength grows: slow at first, then in
// ever larger leaps until the word is mastered.
const STABILITY_TIERS = [1, 2, 4, 8, 16, MASTERED_DAYS];

const wordId = (arabic, english) => `${arabic}|||${english}`;
const answerFor = (w) => w.answer || w.english;
const displayGloss = (w) =>
  w.display || (w.context ? `${answerFor(w)} — ${w.context}` : w.english || answerFor(w));

const DIACRITICS = /[ً-ْٰٓ-ٟؐ-ؚۖ-ۭـ]/g;
const skeleton = (s) => (s || "").normalize("NFC").replace(DIACRITICS, "");
const normalizeArabicLetters = (s) =>
  skeleton(s)
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

const glossKey = (g) =>
  (g || "")
    .toLowerCase()
    .replace(/[()[\].,;:!?'"-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

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
const rememberOption = (keys, bannedKeys) => keys.forEach((key) => bannedKeys.add(key));

const els = {
  loading: document.getElementById("loading"),
  subtitle: document.getElementById("deck-subtitle"),
  reviewArea: document.getElementById("review-area"),
  board: document.getElementById("board"),
  boardList: document.getElementById("board-list"),
  simBtn: document.getElementById("sim-day"),
  resetBtn: document.getElementById("reset-deck"),
  trainerLink: document.getElementById("trainer-link"),
};

if (els.trainerLink) els.trainerLink.href = TRAINER_URL;

let glossPool = [];
let deck = [];
let simOffset = 0;

const now = () => Date.now() + simOffset;

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ deck, simOffset }));
  } catch {}
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return { passed: 0 };
    const data = JSON.parse(raw);
    return { passed: Number.isInteger(data.passed) ? data.passed : 0 };
  } catch {
    return { passed: 0 };
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

// Build the deck from missed words, hardest first. Resume any saved FSRS state
// so a word's memory model survives across visits, and pick up newly-missed
// words from later sessions. Cards saved under the old Leitner format (no
// stability field) are restarted as fresh FSRS cards — harmless, since the
// deck is always rebuilt from the underlying mistake history.
function buildDeck(savedDeck) {
  const stats = loadStats();
  const byId = {};
  (savedDeck || []).forEach((c) => {
    byId[c.id] = c;
  });

  return Object.values(stats)
    .filter((s) => s.miss > 0)
    .sort((a, b) => b.miss - a.miss)
    .map((s) => {
      const id = wordId(s.arabic, s.english);
      const prior = byId[id];
      const base = {
        id,
        arabic: s.arabic,
        english: s.english,
        display: s.display || s.english,
        translit: s.translit || "",
        miss: s.miss,
      };
      if (prior && typeof prior.stability === "number") {
        return Object.assign(base, {
          stability: prior.stability,
          difficulty: prior.difficulty,
          due: prior.due,
          lastReview: prior.lastReview ?? null,
          reps: prior.reps || 0,
          lapses: prior.lapses || 0,
          state: prior.state || "review",
        });
      }
      return Object.assign(base, FSRS.newCard(), { due: now() });
    });
}

function dueInLabel(ms) {
  if (ms <= 0) return "Due now";
  const m = Math.round(ms / MIN);
  if (m < 60) return `in ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `in ${h} hr`;
  const d = Math.round(h / 24);
  return `in ${d} day${d === 1 ? "" : "s"}`;
}

// How many board dots are lit for a given stability, and whether it's mastered.
function dotsFor(stability) {
  const s = stability || 0;
  return {
    on: STABILITY_TIERS.filter((t) => s >= t).length,
    mastered: s >= MASTERED_DAYS,
  };
}

function dueCards() {
  // Earliest-due first; among ties, the weaker memory (lower stability) leads.
  return deck
    .filter((c) => c.due <= now())
    .sort((a, b) => a.due - b.due || (a.stability || 0) - (b.stability || 0));
}

function options(card) {
  const correct = card.english;
  const bannedKeys = optionKeys(card, correct);
  const distractors = [];
  for (const candidate of shuffle(glossPool)) {
    if (distractors.length >= OPTIONS - 1) break;
    const answer = answerFor(candidate);
    const keys = optionKeys(candidate, answer);
    if (!answer || hasBannedKey(keys, bannedKeys)) continue;
    rememberOption(keys, bannedKeys);
    distractors.push(answer);
  }
  return shuffle([correct, ...distractors]);
}

function render() {
  renderBoard();
  renderReview();

  const mastered = deck.filter((c) => (c.stability || 0) >= MASTERED_DAYS).length;
  const due = dueCards().length;
  els.subtitle.textContent =
    `${deck.length} missed word${deck.length === 1 ? "" : "s"} · ` +
    `${due} due now · ${mastered} mastered` +
    (simOffset ? ` · (clock +${Math.round(simOffset / 86400000)}d)` : "");
}

function renderBoard() {
  els.boardList.innerHTML = "";
  deck.forEach((c) => {
    const row = document.createElement("div");
    row.className = "board-row";
    const isDue = c.due <= now();
    if (isDue) row.classList.add("due");

    const ar = document.createElement("div");
    ar.className = "board-ar";
    ar.textContent = c.arabic;

    const gloss = document.createElement("div");
    gloss.className = "board-gloss";
    gloss.textContent = displayGloss(c);

    const dots = document.createElement("div");
    dots.className = "board-dots";
    const { on, mastered } = dotsFor(c.stability);
    for (let i = 0; i < STABILITY_TIERS.length; i++) {
      const d = document.createElement("span");
      d.className = "dot";
      if (i < on) d.classList.add(mastered ? "mastered" : "on");
      dots.appendChild(d);
    }

    const dueEl = document.createElement("div");
    dueEl.className = "board-due" + (isDue ? " now" : "");
    dueEl.textContent = isDue ? "Due now" : dueInLabel(c.due - now());

    row.append(ar, gloss, dots, dueEl);
    els.boardList.appendChild(row);
  });
}

function renderReview() {
  const queue = dueCards();
  els.reviewArea.innerHTML = "";

  if (queue.length === 0) {
    const next = deck.slice().sort((a, b) => a.due - b.due)[0];
    const wrap = document.createElement("div");
    wrap.className = "review-empty";
    wrap.innerHTML =
      `<div class="big">✓ Nothing due right now</div>` +
      `<div class="muted">Next word returns ${dueInLabel(
        next.due - now()
      )}. Use “Simulate +1 day” to jump ahead and see it resurface.</div>`;
    els.reviewArea.appendChild(wrap);
    return;
  }

  const card = queue[0];

  const prompt = document.createElement("p");
  prompt.className = "review-prompt";
  prompt.textContent = `What does this word mean?  (${queue.length} due)`;

  const arabic = document.createElement("div");
  arabic.className = "review-arabic";
  arabic.textContent = card.arabic;

  const opts = document.createElement("div");
  opts.className = "review-options";

  const feedback = document.createElement("div");
  feedback.className = "review-feedback";

  options(card).forEach((text) => {
    const btn = document.createElement("button");
    btn.className = "review-opt";
    btn.type = "button";
    btn.textContent = text;
    btn.addEventListener("click", () => answer(card, text, opts, feedback));
    opts.appendChild(btn);
  });

  els.reviewArea.append(prompt, arabic, opts, feedback);
}

function answer(card, choice, optsEl, feedbackEl) {
  const correct = choice === card.english;
  [...optsEl.children].forEach((b) => {
    b.disabled = true;
    if (b.textContent === card.english) b.classList.add("correct");
    else if (b.textContent === choice) b.classList.add("wrong");
  });

  // Binary grade → FSRS: a correct tap is "Good" (3), a miss is "Again" (1).
  const graded = FSRS.repeat(card, correct ? 3 : 1, now());
  Object.assign(card, graded); // mutate in place so the deck reference updates

  const when = dueInLabel(card.due - now());
  if (correct) {
    feedbackEl.innerHTML = `<span class="up">Recalled ↑ — memory strengthened, returns ${when}.</span>`;
  } else {
    feedbackEl.innerHTML = `<span class="down">Missed ↓ — “${displayGloss(
      card
    )}”. Returns ${when}.</span>`;
  }
  save();

  renderBoard();
  setTimeout(render, 1200);
}

function renderLocked(message) {
  els.loading.remove();
  els.simBtn.hidden = true;
  els.resetBtn.hidden = true;
  els.subtitle.textContent = message.subtitle;
  els.reviewArea.hidden = false;
  els.reviewArea.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "review-empty";
  wrap.innerHTML =
    `<div class="big">🔒 ${message.title}</div>` +
    `<div class="muted">${message.body}</div>`;
  const link = document.createElement("a");
  link.className = "primary-link";
  link.href = TRAINER_URL;
  link.textContent = "← Back to the trainer";
  link.style.marginTop = "16px";
  wrap.appendChild(link);
  els.reviewArea.appendChild(wrap);
}

async function init() {
  let data;
  try {
    data = await (await fetch(SURAH_FILE)).json();
  } catch {
    els.loading.textContent = "Could not load data. Serve the folder over http.";
    return;
  }

  glossPool = [];
  const seenGlosses = new Set();
  data.ayahs.forEach((a) =>
    a.words.forEach((w) => {
      const answer = answerFor(w);
      const id = `${w.arabic}|||${answer}`;
      if (seenGlosses.has(id)) return;
      seenGlosses.add(id);
      glossPool.push({ ...w, english: answer, display: displayGloss(w) });
    })
  );

  const totalAyahs = data.ayahs.length;
  const progress = loadProgress();
  if (progress.passed < totalAyahs) {
    renderLocked({
      subtitle: "Locked until the surah is complete",
      title: "Finish the surah first",
      body: `Review mode opens once you've matched every word in all ${totalAyahs} ayahs. You're on ${progress.passed}/${totalAyahs}.`,
    });
    return;
  }

  const saved = loadSaved();
  simOffset = saved && saved.simOffset ? saved.simOffset : 0;
  deck = buildDeck(saved && saved.deck);

  if (deck.length === 0) {
    renderLocked({
      subtitle: "Nothing to review — flawless run",
      title: "Nothing to review — flawless run",
      body: "You completed the surah without missing a single word, so there's nothing to drill. Come back if a future pass trips you up.",
    });
    return;
  }

  save();
  els.loading.remove();
  els.reviewArea.hidden = false;
  els.board.hidden = false;
  render();
}

els.simBtn.addEventListener("click", () => {
  simOffset += 86400000; // +1 day
  save();
  render();
});

els.resetBtn.addEventListener("click", () => {
  simOffset = 0;
  deck = buildDeck(null); // rebuild fresh from current mistake history
  save();
  render();
});

init();
