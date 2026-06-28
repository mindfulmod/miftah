"use strict";

// Glossary: every word you've learned so far, gathered from each surah up to the
// ayah you've reached in the trainer. Arabic + meaning, grouped by surah and
// searchable. The 10-word test draws at random from the whole learned pool — a
// quick multiple-choice refresh over everything you know.

const MANIFEST_FILE = "data/surahs.json";
const progressKey = (n) => `quran-trainer:surah-${n}:progress`;

const TEST_LENGTH = 10;
const OPTIONS = 4;

const els = {
  loading: document.getElementById("loading"),
  glossView: document.getElementById("gloss-view"),
  subtitle: document.getElementById("gloss-subtitle"),
  search: document.getElementById("gloss-search"),
  startTest: document.getElementById("start-test"),
  groups: document.getElementById("gloss-groups"),
  empty: document.getElementById("gloss-empty"),
  testView: document.getElementById("test-view"),
  quitTest: document.getElementById("quit-test"),
  quizFill: document.getElementById("quiz-fill"),
  quizCount: document.getElementById("quiz-count"),
  quizCard: document.getElementById("quiz-card"),
};

// learned[] = { surah, surahName, words: [{arabic, english, translit}] }
let learned = [];
let allWords = []; // flat, deduped — the test + search pool

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function passedCount(number) {
  try {
    const raw = localStorage.getItem(progressKey(number));
    if (!raw) return 0;
    const d = JSON.parse(raw);
    return Number.isInteger(d.passed) ? d.passed : 0;
  } catch {
    return 0;
  }
}

// ---------- data ----------

async function collectLearned(surahs) {
  const groups = [];
  for (const surah of surahs) {
    const passed = passedCount(surah.number);
    if (passed <= 0) continue;

    let data;
    try {
      data = await (await fetch(surah.file || `data/surah-${surah.number}.json`)).json();
    } catch {
      continue;
    }

    const seen = new Set();
    const words = [];
    data.ayahs.slice(0, passed).forEach((ayah) => {
      ayah.words.forEach((w) => {
        const id = `${w.arabic}|||${w.english}`;
        if (seen.has(id)) return;
        seen.add(id);
        words.push({
          arabic: w.arabic,
          english: w.english,
          translit: w.translit || "",
        });
      });
    });

    if (words.length) {
      groups.push({
        surah: surah.number,
        surahName: surah.englishName,
        arabicName: surah.name,
        words,
      });
    }
  }
  return groups;
}

// ---------- glossary list ----------

function renderGroups(filter = "") {
  const q = filter.trim().toLowerCase();
  els.groups.innerHTML = "";
  let shown = 0;

  learned.forEach((group) => {
    const matches = q
      ? group.words.filter(
          (w) =>
            w.arabic.includes(filter.trim()) ||
            w.english.toLowerCase().includes(q) ||
            w.translit.toLowerCase().includes(q)
        )
      : group.words;

    if (!matches.length) return;
    shown += matches.length;

    const section = document.createElement("section");
    section.className = "gloss-group";

    const head = document.createElement("div");
    head.className = "gloss-group-head";
    head.innerHTML =
      `<span class="gloss-group-name">${group.surahName}</span>` +
      `<span class="gloss-group-ar">${group.arabicName}</span>` +
      `<span class="gloss-group-count">${matches.length}</span>`;
    section.appendChild(head);

    const grid = document.createElement("div");
    grid.className = "gloss-grid";
    matches.forEach((w) => {
      const card = document.createElement("div");
      card.className = "gloss-card";
      const ar = document.createElement("div");
      ar.className = "gloss-ar";
      ar.dir = "rtl";
      ar.lang = "ar";
      ar.textContent = w.arabic;
      const en = document.createElement("div");
      en.className = "gloss-en";
      en.textContent = w.english;
      card.append(ar, en);
      if (w.translit) {
        const tr = document.createElement("div");
        tr.className = "gloss-tr";
        tr.textContent = w.translit;
        card.appendChild(tr);
      }
      grid.appendChild(card);
    });
    section.appendChild(grid);
    els.groups.appendChild(section);
  });

  if (q && shown === 0) {
    els.empty.hidden = false;
    els.empty.textContent = `No words match “${filter.trim()}”.`;
  } else {
    els.empty.hidden = true;
  }
}

// ---------- 10-word test ----------

let quiz = null; // { questions, index, score }

function buildQuestions() {
  if (allWords.length === 0) return [];
  // Prefer distinct words; if the pool is small, cycle through it to reach 10.
  const pool = shuffle(allWords);
  const questions = [];
  let i = 0;
  while (questions.length < TEST_LENGTH && pool.length) {
    questions.push(pool[i % pool.length]);
    i++;
  }
  return questions;
}

function optionsFor(correct) {
  const distractors = shuffle(
    allWords.map((w) => w.english).filter((e) => e !== correct.english)
  );
  const unique = [...new Set(distractors)].slice(0, OPTIONS - 1);
  return shuffle([correct.english, ...unique]);
}

function startTest() {
  quiz = { questions: buildQuestions(), index: 0, score: 0 };
  els.glossView.hidden = true;
  els.testView.hidden = false;
  renderQuestion();
}

function endTest() {
  quiz = null;
  els.testView.hidden = true;
  els.glossView.hidden = false;
  els.search.value = "";
  renderGroups();
}

function renderProgress() {
  const total = quiz.questions.length;
  const pct = Math.round((quiz.index / total) * 100);
  els.quizFill.style.width = pct + "%";
  els.quizCount.textContent = `${Math.min(quiz.index + 1, total)} / ${total}`;
}

function renderQuestion() {
  renderProgress();
  const card = quiz.questions[quiz.index];
  els.quizCard.innerHTML = "";

  const prompt = document.createElement("p");
  prompt.className = "quiz-prompt";
  prompt.textContent = "What does this word mean?";

  const arabic = document.createElement("div");
  arabic.className = "quiz-arabic";
  arabic.dir = "rtl";
  arabic.lang = "ar";
  arabic.textContent = card.arabic;

  const opts = document.createElement("div");
  opts.className = "quiz-options";

  const feedback = document.createElement("div");
  feedback.className = "quiz-feedback";

  optionsFor(card).forEach((text) => {
    const btn = document.createElement("button");
    btn.className = "quiz-opt";
    btn.type = "button";
    btn.textContent = text;
    btn.addEventListener("click", () => answer(card, text, opts, feedback));
    opts.appendChild(btn);
  });

  els.quizCard.append(prompt, arabic, opts, feedback);
}

function answer(card, choice, optsEl, feedbackEl) {
  const correct = choice === card.english;
  if (correct) quiz.score++;

  [...optsEl.children].forEach((b) => {
    b.disabled = true;
    if (b.textContent === card.english) b.classList.add("correct");
    else if (b.textContent === choice) b.classList.add("wrong");
  });

  feedbackEl.className = "quiz-feedback show";
  feedbackEl.innerHTML = correct
    ? `<span class="up">Correct ✓</span>`
    : `<span class="down">It means “${card.english}”${
        card.translit ? ` · ${card.translit}` : ""
      }</span>`;

  const next = document.createElement("button");
  next.className = "primary-btn quiz-next";
  next.type = "button";
  next.textContent =
    quiz.index + 1 >= quiz.questions.length ? "See results →" : "Next word →";
  next.addEventListener("click", () => {
    quiz.index++;
    if (quiz.index >= quiz.questions.length) renderResults();
    else renderQuestion();
  });
  feedbackEl.appendChild(next);
}

function renderResults() {
  els.quizFill.style.width = "100%";
  els.quizCount.textContent = `${quiz.questions.length} / ${quiz.questions.length}`;
  const total = quiz.questions.length;
  const score = quiz.score;
  const pct = Math.round((score / total) * 100);
  const verdict =
    pct === 100
      ? "Flawless — every word locked in. ✨"
      : pct >= 70
      ? "Strong recall. Keep it warm."
      : pct >= 40
      ? "Good start — a few to revisit."
      : "Worth another pass through the trainer.";

  els.quizCard.innerHTML = `
    <div class="quiz-result">
      <div class="quiz-score">${score}<span>/${total}</span></div>
      <p class="quiz-verdict">${verdict}</p>
      <div class="quiz-result-actions">
        <button id="retry-test" class="primary-btn" type="button">↻ Run another 10</button>
        <button id="done-test" class="ghost-btn" type="button">Back to glossary</button>
      </div>
    </div>`;

  document.getElementById("retry-test").addEventListener("click", startTest);
  document.getElementById("done-test").addEventListener("click", endTest);
}

// ---------- init ----------

async function init() {
  let manifest;
  try {
    manifest = await (await fetch(MANIFEST_FILE)).json();
  } catch {
    els.loading.textContent =
      "Could not load the glossary. Serve the folder over http.";
    return;
  }

  const surahs = Array.isArray(manifest.surahs) ? manifest.surahs : [];
  learned = await collectLearned(surahs);
  allWords = [];
  const seen = new Set();
  learned.forEach((g) =>
    g.words.forEach((w) => {
      const id = `${w.arabic}|||${w.english}`;
      if (seen.has(id)) return;
      seen.add(id);
      allWords.push(w);
    })
  );

  els.loading.remove();
  els.glossView.hidden = false;

  const count = allWords.length;
  els.subtitle.textContent =
    count === 0
      ? "No words learned yet — start the trainer to fill this in."
      : `${count} word${count === 1 ? "" : "s"} learned across ${
          learned.length
        } surah${learned.length === 1 ? "" : "s"}.`;

  if (count === 0) {
    els.startTest.disabled = true;
    els.search.disabled = true;
    els.empty.hidden = false;
    els.empty.innerHTML =
      `Your glossary is empty. Complete some ayahs in the ` +
      `<a class="card-link" href="index.html">trainer</a> and the words you learn will gather here.`;
    return;
  }

  renderGroups();

  els.search.addEventListener("input", () => renderGroups(els.search.value));
  els.startTest.addEventListener("click", startTest);
  els.quitTest.addEventListener("click", endTest);
}

init();
