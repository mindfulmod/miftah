"use strict";

// Review mode: a spaced-repetition drill over the words you missed in the
// main word-by-word trainer. It unlocks only once the whole surah is complete,
// and the deck is built from the per-word mistake history the trainer records.
// Leitner box system — recall a word and it climbs to a higher box and returns
// less often; miss it and it drops back to box 1 and returns now. Real intervals
// are days long, so "Simulate +1 day" lets you watch the schedule react.

const SURAH_NUMBER =
  Number(new URLSearchParams(location.search).get("surah")) || 1;
const SURAH_FILE = `data/surah-${SURAH_NUMBER}.json`;
const PROGRESS_KEY = `quran-trainer:surah-${SURAH_NUMBER}:progress`; // written by the trainer
const STATS_KEY = `quran-trainer:stats:surah-${SURAH_NUMBER}`; // per-word mistake history
const STORAGE_KEY = `quran-trainer:review:surah-${SURAH_NUMBER}`; // this page's Leitner state
const TRAINER_URL = `trainer.html?surah=${SURAH_NUMBER}`;
const MAX_BOX = 6;
const OPTIONS = 4;
const MIN = 60 * 1000;

const wordId = (arabic, english) => `${arabic}|||${english}`;

// minutes until a card in a given box is due again
const INTERVAL_MIN = { 1: 0, 2: 10, 3: 60, 4: 1440, 5: 4320, 6: 10080 };
const BOX_LABEL = {
  1: "now",
  2: "10 min",
  3: "1 hour",
  4: "1 day",
  5: "3 days",
  6: "1 week",
};

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

// Build the deck from missed words, hardest first. Merge with any saved Leitner
// state so progress on a word survives across visits, and pick up newly-missed
// words from later sessions.
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
      return {
        id,
        arabic: s.arabic,
        english: s.english,
        translit: s.translit || "",
        miss: s.miss,
        box: prior ? prior.box : 1,
        due: prior ? prior.due : now(),
      };
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

function dueCards() {
  return deck
    .filter((c) => c.due <= now())
    .sort((a, b) => a.box - b.box || a.due - b.due);
}

function options(correct) {
  const distractors = shuffle(glossPool.filter((g) => g !== correct)).slice(
    0,
    OPTIONS - 1
  );
  return shuffle([correct, ...distractors]);
}

function render() {
  renderBoard();
  renderReview();

  const mastered = deck.filter((c) => c.box >= MAX_BOX).length;
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
    gloss.textContent = c.english;

    const dots = document.createElement("div");
    dots.className = "board-dots";
    for (let i = 1; i <= MAX_BOX; i++) {
      const d = document.createElement("span");
      d.className = "dot";
      if (i <= c.box) d.classList.add(c.box >= MAX_BOX ? "mastered" : "on");
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

  options(card.english).forEach((text) => {
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

  if (correct) {
    card.box = Math.min(card.box + 1, MAX_BOX);
    feedbackEl.innerHTML = `<span class="up">Recalled ↑ Box ${card.box} — returns in ${BOX_LABEL[card.box]}.</span>`;
  } else {
    card.box = 1; // Leitner: a miss sends it back to the start
    feedbackEl.innerHTML = `<span class="down">Missed ↓ back to Box 1 — “${card.english}”. It returns now.</span>`;
  }
  card.due = now() + INTERVAL_MIN[card.box] * MIN;
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

  glossPool = [
    ...new Set(data.ayahs.flatMap((a) => a.words.map((w) => w.english))),
  ];

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
