"use strict";

// Follow mode — the recite-along fluency trainer AND the honest proof test
// (spec: specs/01-trainer-v2.md). The surah's recitation plays at natural
// pace while words highlight in sync; the learner taps any word whose meaning
// didn't arrive in time. Every tap is a real FSRS lapse (source "follow"), so
// the words that lag behind the reciter feed tomorrow's session.
//
// Unlocks once every ayah of the surah has been passed in the trainer; freely
// replayable after. Best "kept up" percentage is remembered per surah.
//
// Word timing, two tiers:
//   1. Real per-word segments from the Quran.com API (recitation 7, Alafasy —
//      the same reciter the ayah MP3s use), fetched once and cached in
//      localStorage.
//   2. Offline/API-miss fallback: word lengths weight the ayah's duration —
//      approximate, but the highlight still travels with the recitation.

const SURAH_NUMBER =
  Number(new URLSearchParams(location.search).get("surah")) || 1;
const DATA_VERSION = "20260717-fable1";
const SURAH_FILE = `data/surah-${SURAH_NUMBER}.json?v=${DATA_VERSION}`;
const PROGRESS_KEY = `quran-trainer:surah-${SURAH_NUMBER}:progress`;
const FOLLOW_KEY = `quran-trainer:follow:surah-${SURAH_NUMBER}`; // { best, runs }
const SEGMENTS_KEY = `quran-trainer:follow-segments:${SURAH_NUMBER}`; // { ayah: [[pos,start,end]…] }
const AYAH_BASE = "https://verses.quran.com/Alafasy/mp3/";
const SEGMENTS_API = (s, a) =>
  `https://api.quran.com/api/v4/recitations/7/by_ayah/${s}:${a}`;
const pad3 = (n) => String(n).padStart(3, "0");

const els = {
  app: document.getElementById("app"),
  title: document.getElementById("surah-title"),
};

let surah = null;
let run = null; // { ayahIdx, flagged:Set(id), total, started }
const audio = new Audio();
audio.preload = "auto";

// ---------- persistence ----------

function loadFollow() {
  try {
    const d = JSON.parse(localStorage.getItem(FOLLOW_KEY) || "{}");
    return { best: d.best || 0, runs: d.runs || 0 };
  } catch {
    return { best: 0, runs: 0 };
  }
}

function saveFollow(d) {
  try {
    localStorage.setItem(FOLLOW_KEY, JSON.stringify(d));
  } catch {}
}

function loadSegmentsCache() {
  try {
    return JSON.parse(localStorage.getItem(SEGMENTS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveSegmentsCache(cache) {
  try {
    localStorage.setItem(SEGMENTS_KEY, JSON.stringify(cache));
  } catch {}
}

// ---------- segments ----------

// Normalize whatever segment shape the API returns into [[pos, startMs, endMs]…],
// 1-based positions, monotonic — or null when it can't be trusted.
function normalizeSegments(raw, wordCount) {
  if (!Array.isArray(raw) || raw.length < Math.min(wordCount, 2)) return null;
  const out = [];
  for (const seg of raw) {
    if (!Array.isArray(seg) || seg.length < 3) return null;
    const nums = seg.map(Number);
    if (nums.some((n) => !Number.isFinite(n))) return null;
    // Common shapes: [pos, start, end] or [pos, ?, start, end]
    const [pos, a, b, c] = nums;
    const start = seg.length >= 4 ? b : a;
    const end = seg.length >= 4 ? c : b;
    if (pos < 1 || pos > wordCount || end <= start) return null;
    out.push([pos, start, end]);
  }
  out.sort((x, y) => x[1] - y[1]);
  return out;
}

async function fetchSegments(ayahNumber, wordCount) {
  const cache = loadSegmentsCache();
  if (cache[ayahNumber]) return cache[ayahNumber];
  try {
    const res = await fetch(SEGMENTS_API(SURAH_NUMBER, ayahNumber), {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const file = (data.audio_files || [])[0];
    const segs = normalizeSegments(file && file.segments, wordCount);
    if (segs) {
      cache[ayahNumber] = segs;
      saveSegmentsCache(cache);
    }
    return segs;
  } catch {
    return null; // offline — estimation carries the run
  }
}

// Fallback: split the ayah's audio duration across words, weighted by their
// consonant-skeleton length (longer words take longer to recite). A small
// lead bias keeps the highlight arriving WITH the word, never after it.
const DIACRITICS = /[ً-ْٰٓ-ٟؐ-ؚۖ-ۭـ]/g;
const weightOf = (w) => w.arabic.normalize("NFC").replace(DIACRITICS, "").length + 2;

function estimatedIndex(ayah, t, duration) {
  if (!duration) return 0;
  const weights = ayah.words.map(weightOf);
  const total = weights.reduce((a, b) => a + b, 0);
  const f = Math.min((t / duration) + 0.05, 1);
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i] / total;
    if (f <= acc) return i;
  }
  return weights.length - 1;
}

function segmentIndex(segments, tMs) {
  let idx = 0;
  for (const [pos, start] of segments) {
    if (tMs >= start) idx = pos - 1;
    else break;
  }
  return idx;
}

// ---------- run flow ----------

const wordKey = (w) => `${w.arabic}|||${w.answer || w.english}`;

function startRun() {
  run = { ayahIdx: 0, flagged: new Set(), total: 0, started: Date.now() };
  for (const a of surah.ayahs) run.total += a.words.length;
  playAyah();
}

async function playAyah() {
  const ayah = surah.ayahs[run.ayahIdx];
  const segments = await fetchSegments(ayah.number, ayah.words.length);
  renderAyah(ayah, segments);
}

function renderAyah(ayah, segments) {
  els.app.innerHTML = "";

  const wrap = document.createElement("section");
  wrap.className = "ayah active follow-ayah";

  const head = document.createElement("div");
  head.className = "ayah-head";
  const num = document.createElement("span");
  num.className = "ayah-num";
  num.textContent = `${surah.number}:${ayah.number}`;
  const status = document.createElement("span");
  status.className = "ayah-status";
  status.textContent = `Follow the reciter — tap any word whose meaning lagged (${
    run.ayahIdx + 1
  }/${surah.ayahs.length})`;
  head.append(num, status);

  const line = document.createElement("div");
  line.className = "ayah-read follow-line";
  line.dir = "rtl";
  line.lang = "ar";
  const spans = ayah.words.map((w, i) => {
    if (i > 0) line.appendChild(document.createTextNode(" "));
    const span = document.createElement("span");
    span.className = "read-word follow-word";
    span.textContent = w.arabic;
    span.addEventListener("click", () => flagWord(ayah, i, span, gloss));
    line.appendChild(span);
    return span;
  });

  // The gloss ribbon shows the CURRENT word's meaning a beat AFTER the word
  // passes — so the learner checks themselves against it, not off it.
  const gloss = document.createElement("p");
  gloss.className = "follow-gloss";
  gloss.textContent = " ";

  const controls = document.createElement("div");
  controls.className = "follow-controls";
  const flagBtn = document.createElement("button");
  flagBtn.type = "button";
  flagBtn.className = "primary-btn follow-flag";
  flagBtn.textContent = "✋ Didn't catch that";
  const pauseBtn = document.createElement("button");
  pauseBtn.type = "button";
  pauseBtn.className = "ghost-btn";
  pauseBtn.textContent = "⏸";
  controls.append(flagBtn, pauseBtn);

  wrap.append(head, line, gloss, controls);
  els.app.appendChild(wrap);

  let current = -1;
  let lastShown = -1;

  const setCurrent = (idx) => {
    if (idx === current || idx < 0 || idx >= spans.length) return;
    current = idx;
    spans.forEach((s, i) => {
      s.classList.toggle("is-active-word", i === idx);
      s.classList.toggle("is-solved-word", i < idx);
    });
    // Reveal the PREVIOUS word's gloss once the reciter has moved on.
    const prev = idx - 1;
    if (prev >= 0 && prev !== lastShown) {
      lastShown = prev;
      const w = ayah.words[prev];
      gloss.textContent = `${w.arabic}  ·  ${w.english}`;
    }
  };

  flagBtn.addEventListener("click", () => {
    if (current >= 0) flagWord(ayah, current, spans[current], gloss);
  });
  pauseBtn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => {});
      pauseBtn.textContent = "⏸";
    } else {
      audio.pause();
      pauseBtn.textContent = "▶";
    }
  });

  audio.ontimeupdate = () => {
    const idx = segments
      ? segmentIndex(segments, audio.currentTime * 1000)
      : estimatedIndex(ayah, audio.currentTime, audio.duration);
    setCurrent(idx);
  };
  audio.onended = () => {
    spans.forEach((s) => s.classList.add("is-solved-word"));
    const last = ayah.words[ayah.words.length - 1];
    gloss.textContent = `${last.arabic}  ·  ${last.english}`;
    run.ayahIdx += 1;
    setTimeout(() => {
      if (run.ayahIdx < surah.ayahs.length) playAyah();
      else renderSummary();
    }, 900);
  };
  audio.onerror = () => {
    status.textContent = "Couldn't load the recitation — check your connection.";
  };

  try { audio.pause(); } catch {}
  audio.src = `${AYAH_BASE}${pad3(surah.number)}${pad3(ayah.number)}.mp3`;
  audio.currentTime = 0;
  audio.play().catch(() => {
    status.textContent = "Tap ▶ to start this ayah.";
    pauseBtn.textContent = "▶";
  });
}

function flagWord(ayah, idx, span, gloss) {
  const w = ayah.words[idx];
  const key = wordKey(w);
  if (run.flagged.has(key)) return; // one honest flag per word per run
  run.flagged.add(key);
  span.classList.add("follow-flagged");
  gloss.textContent = `✋ ${w.arabic}  ·  ${w.english} — sent to review`;
  // A lag under recitation pressure is a real lapse. Full weight.
  WordStrength.review(
    { arabic: w.arabic, english: w.english, translit: w.translit, root: w.root },
    1,
    { source: "follow", surah: SURAH_NUMBER }
  );
}

// ---------- screens ----------

function renderIntro() {
  const saved = loadFollow();
  els.app.innerHTML = "";
  const panel = document.createElement("section");
  panel.className = "session-done follow-intro";
  panel.innerHTML =
    `<h2 class="session-done-title">Follow the recitation</h2>` +
    `<p class="session-done-sub">The whole surah, recited at natural pace while the words light up. ` +
    `Your only job: notice when a meaning doesn't arrive in time, and tap that word — it goes to review. ` +
    `No score to chase; this is where reading becomes understanding.</p>` +
    (saved.runs
      ? `<p class="session-done-streak">Best run: <strong>${saved.best}% kept up</strong> · ${saved.runs} run${saved.runs === 1 ? "" : "s"}</p>`
      : "");
  const cta = document.createElement("div");
  cta.className = "session-done-cta";
  const start = document.createElement("button");
  start.type = "button";
  start.className = "primary-btn";
  start.textContent = saved.runs ? "Sail through it again ▶" : "Begin ▶";
  start.addEventListener("click", startRun);
  const back = document.createElement("a");
  back.className = "ghost-btn";
  back.href = `trainer.html?surah=${SURAH_NUMBER}`;
  back.textContent = "← Back to the trainer";
  cta.append(start, back);
  panel.appendChild(cta);
  els.app.appendChild(panel);
}

function renderSummary() {
  const flagged = run.flagged.size;
  const kept = Math.round(((run.total - flagged) / run.total) * 100);
  const saved = loadFollow();
  const newBest = kept > saved.best;
  saveFollow({ best: Math.max(saved.best, kept), runs: saved.runs + 1 });

  els.app.innerHTML = "";
  const panel = document.createElement("section");
  panel.className = "session-done follow-summary";
  panel.innerHTML =
    `<h2 class="session-done-title">${kept}% kept up${newBest && saved.runs ? " — new best" : ""}</h2>` +
    `<p class="session-done-sub">${
      flagged === 0
        ? "Every meaning arrived with the reciter. This surah is truly yours."
        : `${flagged} word${flagged === 1 ? "" : "s"} lagged behind the reciter — they're in tomorrow's warm-up now. That's exactly how this sharpens.`
    }</p>`;
  const cta = document.createElement("div");
  cta.className = "session-done-cta";
  const again = document.createElement("button");
  again.type = "button";
  again.className = "primary-btn";
  again.textContent = "Follow again ▶";
  again.addEventListener("click", startRun);
  const back = document.createElement("a");
  back.className = "ghost-btn";
  back.href = `trainer.html?surah=${SURAH_NUMBER}`;
  back.textContent = "← Back to the trainer";
  cta.append(again, back);
  panel.appendChild(cta);
  els.app.appendChild(panel);
}

function renderLocked(passed, total) {
  els.app.innerHTML = "";
  const panel = document.createElement("section");
  panel.className = "session-done";
  panel.innerHTML =
    `<h2 class="session-done-title">🔒 Not yet</h2>` +
    `<p class="session-done-sub">Follow mode opens as the celebration for finishing a surah — ` +
    `you're ${passed}/${total} ayahs through this one. Keep decoding; the recitation will wait for you.</p>`;
  const back = document.createElement("a");
  back.className = "primary-link";
  back.href = `trainer.html?surah=${SURAH_NUMBER}`;
  back.textContent = "← Back to the trainer";
  panel.appendChild(back);
  els.app.appendChild(panel);
}

// ---------- boot ----------

async function init() {
  let data;
  try {
    data = await (await fetch(SURAH_FILE)).json();
  } catch {
    els.app.textContent = "Could not load the surah data.";
    return;
  }
  surah = { ...data.surah, ayahs: data.ayahs };
  els.title.textContent = `Follow · ${surah.englishName} · ${surah.name}`;

  let passed = 0;
  try {
    passed = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}").passed || 0;
  } catch {}

  if (passed < surah.ayahs.length) renderLocked(passed, surah.ayahs.length);
  else renderIntro();
}

init();
