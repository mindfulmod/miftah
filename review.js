"use strict";

// Extra practice: a direct window onto the ONE unified FSRS queue
// (strength.js) that the trainer's daily session also drains. Nothing here is
// a separate system anymore — answering a card here is exactly as real as
// answering it in the trainer's warm-up (same store, same write path).
//
// The page keeps its two teaching affordances: the board (per-word memory
// dots) and the "+1 day" clock simulator that lets you watch the schedule
// react. The simulator only moves THIS page's view of time; it never writes
// fake timestamps into the store beyond the reviews you actually do.

const SURAH_FILTER =
  Number(new URLSearchParams(location.search).get("surah")) || 0; // 0 = all words
const TRAINER_URL = SURAH_FILTER
  ? `trainer.html?surah=${SURAH_FILTER}`
  : "trainer.html";
const OPTIONS = 4;
const MIN = 60 * 1000;

// A word counts as "mastered" once its memory is stable enough to hold for
// about three weeks — the point where it no longer needs frequent drilling.
const MASTERED_DAYS = 21;
// The board's six dots fill as stability climbs past each tier (days).
const STABILITY_TIERS = [1, 2, 4, 8, 16, MASTERED_DAYS];

const answerFor = (w) => w.answer || w.english;
const displayGloss = (w) =>
  w.display || (w.context ? `${answerFor(w)} — ${w.context}` : w.english || answerFor(w));

const DIACRITICS = /[ً-ْٰٓ-ٟؐ-ؚۖ-ۭـ]/g;
const skeleton = (s) => (s || "").normalize("NFC").replace(DIACRITICS, "");
const normalizeArabicLetters = (s) =>
  skeleton(s)
    .replace(/[^ء-ي]/g, "")
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
  "a", "an", "and", "are", "be", "belong", "belongs", "but", "by", "for",
  "from", "had", "has", "have", "in", "is", "of", "on", "so", "that", "the",
  "then", "to", "upon", "was", "were", "while", "with",
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

const SIM_KEY = "quran-trainer:review:sim"; // page-local clock offset (ms)
let simOffset = 0;
try {
  simOffset = Number(localStorage.getItem(SIM_KEY)) || 0;
} catch {}

const now = () => Date.now() + simOffset;

function saveSim() {
  try {
    localStorage.setItem(SIM_KEY, String(simOffset));
  } catch {}
}

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The working set: every word with real review history, this surah's first
// when filtered. Re-read from the store on every render — other pages write it.
function deckEntries() {
  return WordStrength.entries()
    .filter((e) => e.fsrs && e.fsrs.reps > 0)
    .filter((e) => !SURAH_FILTER || (e.surahs || []).includes(SURAH_FILTER))
    .sort((a, b) => a.fsrs.due - b.fsrs.due);
}

function dueCards(deck) {
  return deck
    .filter((c) => c.fsrs.due <= now())
    .sort(
      (a, b) =>
        a.fsrs.due - b.fsrs.due || (a.fsrs.stability || 0) - (b.fsrs.stability || 0)
    );
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

function dotsFor(stability) {
  const s = stability || 0;
  return {
    on: STABILITY_TIERS.filter((t) => s >= t).length,
    mastered: s >= MASTERED_DAYS,
  };
}

function options(card, deck) {
  const correct = card.english;
  const bannedKeys = optionKeys(card, correct);
  const distractors = [];
  for (const candidate of shuffle(deck)) {
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
  const deck = deckEntries();

  if (deck.length === 0) {
    els.subtitle.textContent = SURAH_FILTER
      ? "No reviewed words in this surah yet"
      : "No reviewed words yet";
    els.reviewArea.hidden = false;
    els.board.hidden = true;
    els.reviewArea.innerHTML =
      `<div class="review-empty"><div class="big">Nothing here yet</div>` +
      `<div class="muted">Words arrive as you meet them in the trainer — every answer there feeds this queue.</div></div>`;
    const link = document.createElement("a");
    link.className = "primary-link";
    link.href = TRAINER_URL;
    link.textContent = "← To the trainer";
    els.reviewArea.firstElementChild.appendChild(link);
    return;
  }

  renderBoard(deck);
  renderReview(deck);

  const mastered = deck.filter((c) => (c.fsrs.stability || 0) >= MASTERED_DAYS).length;
  const due = dueCards(deck).length;
  els.subtitle.textContent =
    `${deck.length} word${deck.length === 1 ? "" : "s"} in the queue · ` +
    `${due} due now · ${mastered} mastered` +
    (simOffset ? ` · (clock +${Math.round(simOffset / 86400000)}d)` : "");
}

function renderBoard(deck) {
  els.board.hidden = false;
  els.boardList.innerHTML = "";
  deck.forEach((c) => {
    const row = document.createElement("div");
    row.className = "board-row";
    const isDue = c.fsrs.due <= now();
    if (isDue) row.classList.add("due");

    const ar = document.createElement("div");
    ar.className = "board-ar";
    ar.textContent = c.arabic;

    const gloss = document.createElement("div");
    gloss.className = "board-gloss";
    gloss.textContent = displayGloss(c);

    const dots = document.createElement("div");
    dots.className = "board-dots";
    const { on, mastered } = dotsFor(c.fsrs.stability);
    for (let i = 0; i < STABILITY_TIERS.length; i++) {
      const d = document.createElement("span");
      d.className = "dot";
      if (i < on) d.classList.add(mastered ? "mastered" : "on");
      dots.appendChild(d);
    }

    const dueEl = document.createElement("div");
    dueEl.className = "board-due" + (isDue ? " now" : "");
    dueEl.textContent = isDue ? "Due now" : dueInLabel(c.fsrs.due - now());

    row.append(ar, gloss, dots, dueEl);
    els.boardList.appendChild(row);
  });
}

function renderReview(deck) {
  const queue = dueCards(deck);
  els.reviewArea.hidden = false;
  els.reviewArea.innerHTML = "";

  if (queue.length === 0) {
    const next = deck[0];
    const wrap = document.createElement("div");
    wrap.className = "review-empty";
    wrap.innerHTML =
      `<div class="big">✓ Nothing due right now</div>` +
      `<div class="muted">Next word returns ${dueInLabel(
        next.fsrs.due - now()
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

  options(card, deck).forEach((text) => {
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

  // One write path: the unified store. Calm study = full-weight rep.
  const e = WordStrength.review(card.id, correct ? 3 : 1, {
    source: "review",
    now: now(),
  });

  const when = dueInLabel((e ? e.fsrs.due : now()) - now());
  if (correct) {
    feedbackEl.innerHTML = `<span class="up">Recalled ↑ — memory strengthened, returns ${when}.</span>`;
  } else {
    feedbackEl.innerHTML = `<span class="down">Missed ↓ — “${displayGloss(
      card
    )}”. Returns ${when}.</span>`;
  }

  setTimeout(render, 1200);
}

els.simBtn.addEventListener("click", () => {
  simOffset += 86400000; // +1 day
  saveSim();
  render();
});

// The old "reset deck" wiped a page-local deck; the queue is now the real
// learning record, so the only safe reset is the simulated clock.
els.resetBtn.textContent = "Reset clock";
els.resetBtn.addEventListener("click", () => {
  simOffset = 0;
  saveSim();
  render();
});

els.loading.remove();
render();
