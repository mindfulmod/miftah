"use strict";

const MANIFEST_FILE = "data/surahs.json";
const SURAH_NUMBER =
  Number(new URLSearchParams(location.search).get("surah")) || 1;
const SURAH_FILE = `data/surah-${SURAH_NUMBER}.json`;
const STORAGE_KEY = `quran-trainer:surah-${SURAH_NUMBER}:progress`;
const STATS_KEY = `quran-trainer:stats:surah-${SURAH_NUMBER}`; // per-word mistake history, accumulates across sessions
const INTERLEAVE_KEY = `quran-trainer:interleave:surah-${SURAH_NUMBER}`; // in-flow review schedule
const PICKER_URL = "index.html";
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

// Stable id for a word by its Arabic form + meaning, so the same word in
// different ayahs aggregates into one "trouble word" entry.
const wordId = (w) => `${w.arabic}|||${w.english}`;

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
let glossPool = []; // unique English glosses across the surah, for distractors
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
    .map((w) => w.english)
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

// The gloss of another word whose Arabic looks closest to this one — a
// confusable distractor that forces the learner to read the letters, not guess.
function lookalikeGloss(word, bannedKeys) {
  let best = null;
  let bestScore = -1;
  for (const cand of uniqueWords) {
    if (bannedKeys.has(glossKey(cand.english))) continue;
    const score = arabicSimilarity(word.arabic, cand.arabic);
    if (score > bestScore) {
      bestScore = score;
      best = cand.english;
    }
  }
  return bestScore > 0.34 ? best : null; // ignore words that aren't actually alike
}

// The gloss of another word from the same triliteral root — semantically near,
// so picking it apart reinforces the fine distinction between siblings.
function sameRootGloss(word, bannedKeys) {
  if (!word.root) return null;
  const family = (rootIndex.get(word.root) || []).filter(
    (m) => !bannedKeys.has(glossKey(m.english))
  );
  if (!family.length) return null;
  return family[Math.floor(Math.random() * family.length)].english;
}

// Build the option set: always the correct gloss, then (when available) one
// look-alike and one same-root distractor, padded with random glosses. The
// total grows with how many times the learner has already seen this word.
function buildOptions(word) {
  const correct = word.english;
  const id = wordId(word);
  const stat = stats[id];
  const exposures = stat ? stat.miss + stat.correct : 0;
  const target = Math.min(optionCountFor(exposures), glossPool.length);

  const bannedKeys = new Set([glossKey(correct)]); // blocks synonyms-by-case too
  const distractors = [];
  const add = (g) => {
    if (g && !bannedKeys.has(glossKey(g))) {
      bannedKeys.add(glossKey(g));
      distractors.push(g);
    }
  };

  add(lookalikeGloss(word, bannedKeys));
  add(sameRootGloss(word, bannedKeys));
  for (const g of shuffle(glossPool)) {
    if (distractors.length >= target - 1) break;
    add(g);
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
  if (!stats[id]) {
    stats[id] = {
      arabic: word.arabic,
      english: word.english,
      translit: word.translit || "",
      root: word.root || "",
      miss: 0,
      correct: 0,
    };
  } else if (!stats[id].root && word.root) {
    stats[id].root = word.root; // backfill root onto entries from before roots existed
  }
  return stats[id];
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

function render() {
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
  more.addEventListener("click", () => render());

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
      if (b.textContent === word.english) b.classList.add("correct");
    });

    feedback.textContent = recalled
      ? "Recalled ✓ — it'll come back less often now."
      : `Not yet — this word means “${word.english}”. It'll return soon.`;
    feedback.className = "ayah-message " + (recalled ? "pass" : "reset");

    const cont = document.createElement("button");
    cont.type = "button";
    cont.className = "primary-link";
    cont.textContent = "Continue →";
    cont.addEventListener("click", render);
    card.appendChild(cont);
  };

  buildOptions(word).forEach((g) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "review-opt";
    btn.textContent = g;
    btn.addEventListener("click", () => finish(g === word.english));
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
    cell.querySelector(".dd-label").textContent = w.english;
    const trigger = cell.querySelector(".dd-trigger");
    trigger.disabled = true;
    trigger.setAttribute("aria-disabled", "true");
    words.appendChild(cell);
  });
  return node;
}

function renderActiveAyah(ayah) {
  const node = els.ayahTpl.content.firstElementChild.cloneNode(true);
  node.classList.add("active");
  node.querySelector(".ayah-num").textContent = `${surah.number}:${ayah.number}`;

  // Reading stage: the whole verse as flowing Arabic, shown before the decode
  // grid. The point is to slow down — read the ayah as a whole first, calmly,
  // rather than diving straight into clicking meanings word by word.
  const readLine = document.createElement("div");
  readLine.className = "ayah-read";
  readLine.dir = "rtl";
  readLine.lang = "ar";
  readLine.textContent = ayah.words.map((w) => w.arabic).join(" ");
  const readCue = document.createElement("p");
  readCue.className = "ayah-read-cue";
  readCue.textContent = "Read the verse through first — then reveal each word below.";
  const readWrap = document.createElement("div");
  readWrap.className = "ayah-read-wrap";
  readWrap.append(readLine, readCue);
  node.querySelector(".ayah-head").after(readWrap);

  const budget = mistakeBudget(ayah.words.length);
  const statusEl = node.querySelector(".ayah-status");
  const meterEl = node.querySelector(".mistake-meter");
  const msgEl = node.querySelector(".ayah-message");
  const wordsEl = node.querySelector(".words");

  // attempt-local state
  const state = {
    mistakes: 0,
    budget,
    solved: new Set(),
    total: ayah.words.length,
    clean: true, // no wrong picks AND no hints — the bar for "Perfect"
    resets: 0, // full-ayah failures so far; gates the teaching contrast feedback
  };

  statusEl.textContent = "Pick the correct meaning under each word";

  function updateMeter() {
    meterEl.textContent = `Mistakes: ${state.mistakes} / ${state.budget}`;
    meterEl.classList.toggle("danger", state.mistakes >= state.budget);
  }
  updateMeter();

  function resetAyah() {
    state.resets += 1;
    msgEl.textContent =
      `Let's run this ayah again — no penalty. ` +
      `From here I'll explain each slip as you go, so it sticks.`;
    msgEl.className = "ayah-message reset";
    state.mistakes = 0;
    state.clean = false;
    state.solved.clear();
    // rebuild all word cells with freshly shuffled options
    wordsEl.innerHTML = "";
    ayah.words.forEach(buildWordCell);
    updateMeter();
  }

  function checkComplete() {
    if (state.solved.size !== state.total) return;

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
    reveal.hidden = false;
    node.classList.add("revealing");
    node.classList.add(perfect ? "perfect-pass" : "complete-pass");
    celebrate(node, perfect);
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
      else render();
    }, 1600);
  }

  function buildWordCell(word) {
    const cell = els.wordTpl.content.firstElementChild.cloneNode(true);
    cell.querySelector(".arabic").textContent = word.arabic;
    const dd = cell.querySelector(".dd");
    const trigger = cell.querySelector(".dd-trigger");
    const label = cell.querySelector(".dd-label");
    const menu = cell.querySelector(".dd-menu");

    for (const opt of buildOptions(word)) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dd-option";
      btn.setAttribute("role", "option");
      btn.textContent = opt;
      btn.addEventListener("click", () => choose(opt));
      menu.appendChild(btn);
    }

    // "Not sure" escape hatch: cheaper than a blind wrong guess (no mistake
    // counted, nothing logged as a miss) but it forfeits the Perfect mark and
    // narrows the field — so certainty is still rewarded over guessing.
    const hintBtn = document.createElement("button");
    hintBtn.type = "button";
    hintBtn.className = "dd-hint";
    hintBtn.setAttribute("role", "option");
    hintBtn.textContent = "🤔 Not sure — show a hint";
    hintBtn.addEventListener("click", () => useHint());
    menu.appendChild(hintBtn);

    function openMenu() {
      if (cell.classList.contains("correct")) return;
      closeAllMenus();
      dd.classList.add("open");
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
    }
    function closeMenu() {
      dd.classList.remove("open");
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    }

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      dd.classList.contains("open") ? closeMenu() : openMenu();
    });

    function useHint() {
      if (cell.classList.contains("correct") || cell.classList.contains("hinted")) {
        closeMenu();
        return;
      }
      cell.classList.add("hinted");
      state.clean = false;
      hintBtn.remove();

      // Show the transliteration as a leg-up.
      if (word.translit) {
        const tip = document.createElement("div");
        tip.className = "word-hint";
        tip.textContent = word.translit;
        cell.querySelector(".arabic").after(tip);
      }

      // Narrow the field to the correct gloss plus one distractor.
      const opts = [...menu.querySelectorAll(".dd-option")];
      const keep = new Set([word.english]);
      const wrong = opts.find((b) => b.textContent !== word.english);
      if (wrong) keep.add(wrong.textContent);
      opts.forEach((b) => {
        if (!keep.has(b.textContent)) b.remove();
      });

      msgEl.textContent =
        "Hint shown — narrowed to two. This won't count as Perfect, but it's free.";
      msgEl.className = "ayah-message";
    }

    function choose(value) {
      closeMenu();
      if (cell.classList.contains("correct")) return;

      if (value === word.english) {
        cell.classList.remove("wrong");
        cell.classList.add("correct");
        cell.classList.add("pop");
        setTimeout(() => cell.classList.remove("pop"), 460);
        label.textContent = value;
        trigger.disabled = true;
        state.solved.add(word.position);
        recordCorrect(word);

        // Recovered from an earlier slip on this word → a "rescue". Mark it with
        // a small win badge and count it toward today's tally, so the moment a
        // mistake becomes mastery feels like a reward, not a blemish.
        if (cell.dataset.missed === "1") {
          cell.classList.add("rescued");
          const tag = document.createElement("span");
          tag.className = "rescue-badge";
          tag.textContent = "💪 Got it";
          cell.appendChild(tag);
          bumpRescued();
        }

        msgEl.textContent = "";
        msgEl.className = "ayah-message";
        checkComplete();
        return;
      }

      // wrong pick
      label.textContent = value;
      cell.dataset.missed = "1"; // remember the slip so recovering counts as a rescue
      state.mistakes += 1;
      state.clean = false;
      recordMiss(word);
      cell.classList.remove("wrong");
      void cell.offsetWidth; // restart shake animation
      cell.classList.add("wrong");
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
          `<strong>“${word.english}”</strong>. ${remaining} slip${
            remaining === 1 ? "" : "s"
          } left.`;
        msgEl.className = "ayah-message reset contrast";
        return; // leave the wrong pick + explanation up until they re-choose
      }

      msgEl.textContent = `Not quite — ${remaining} mistake${
        remaining === 1 ? "" : "s"
      } left before this ayah resets.`;
      msgEl.className = "ayah-message reset";
      setTimeout(() => {
        if (!cell.classList.contains("correct")) {
          cell.classList.remove("wrong");
          label.textContent = "";
        }
      }, 700);
    }

    wordsEl.appendChild(cell);
  }

  ayah.words.forEach(buildWordCell);
  return node;
}

// ---------- boot ----------

// A surah is unlocked only if it's the first in the manifest or the one before
// it (in manifest order) has every ayah passed. Returns null when unlocked, or
// the previous surah's entry when locked, so we can tell the user what to finish.
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
  const prev = list[idx - 1];
  return passedCount(prev.number) >= prev.ayahCount ? null : prev;
}

function showLocked(prev) {
  els.title.textContent = "Locked";
  els.subtitle.textContent = "";
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

  // Build the distractor/root lookups once: one representative word per gloss,
  // and an index of which words share each triliteral root.
  glossInfo = new Map();
  rootIndex = new Map();
  const rootSeen = new Map(); // root -> Set of glosses already indexed (dedupe)
  for (const a of data.ayahs) {
    for (const w of a.words) {
      if (!glossInfo.has(w.english)) glossInfo.set(w.english, w);
      if (w.root) {
        if (!rootIndex.has(w.root)) {
          rootIndex.set(w.root, []);
          rootSeen.set(w.root, new Set());
        }
        const key = glossKey(w.english);
        if (!rootSeen.get(w.root).has(key)) {
          rootSeen.get(w.root).add(key);
          rootIndex.get(w.root).push({ arabic: w.arabic, english: w.english });
        }
      }
    }
  }
  uniqueWords = [...glossInfo.values()];
  glossPool = uniqueWords.map((w) => w.english);

  els.title.textContent = `${surah.englishName} · ${surah.name}`;
  els.subtitle.textContent = `${surah.englishTranslation} — word-by-word meaning trainer`;
  els.sources.textContent =
    "Arabic verified across two independent sources: " + (data.sources || []).join(" + ");

  const progress = loadProgress();
  currentIndex = Math.min(progress.passed, surah.ayahs.length);
  perfectSet = new Set(progress.perfect);
  stats = loadStats();
  interleave = loadInterleave();

  els.loading.remove();
  render();
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
