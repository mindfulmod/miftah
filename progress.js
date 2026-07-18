"use strict";

// The coverage heat-map (spec: specs/01-trainer-v2.md) — "my understanding of
// the Book, at a glance." All 114 surahs in mushaf order, each cell filling
// with warmth as you work through it. Two honest signals per surah:
//   • how far you've decoded it (ayahs passed / total) drives the fill;
//   • how much of what you've met has become STRONG (FSRS stability) adds a
//     gold bloom — so a surah you finished long ago and still hold looks
//     different from one you rushed once.
//
// Read-only: progress keys are written by the trainer, strength by the store.

const MANIFEST = "data/surahs.json?v=20260703-audio-refs";
const LANG = (() => {
  try { return localStorage.getItem("quran-trainer:lang") === "ur" ? "ur" : "en"; } catch { return "en"; }
})();
const T = LANG === "ur"
  ? { title: "کتاب میں آپ کا سفر", sub: "ہر سورت آپ کے سیکھنے کے ساتھ روشن ہوتی ہے",
      met: "چھوا", strong: "پختہ", legend: (a, b) => `${a} سورتیں شروع · ${b} مکمل` }
  : { title: "Your journey through the Book", sub: "Each surah warms as you decode it",
      met: "touched", strong: "strong", legend: (a, b) => `${a} surahs begun · ${b} complete` };

const LS = (k, fb) => { try { const r = localStorage.getItem(k); return r == null ? fb : JSON.parse(r); } catch { return fb; } };

function passedOf(n) {
  const d = LS(`quran-trainer:surah-${n}:progress`, {});
  return Number.isInteger(d.passed) ? d.passed : 0;
}

// Fraction of THIS surah's met words that are strong (stability >= 7 days),
// via the unified store — surahs listed on each entry. Cheap approximation of
// "how well do I hold this surah" without fetching every surah file.
function strengthOf(n) {
  const entries = WordStrength.entries().filter((e) => (e.surahs || []).includes(n) && e.fsrs && e.fsrs.reps > 0);
  if (!entries.length) return 0;
  const strong = entries.filter((e) => (e.fsrs.stability || 0) >= 7).length;
  return strong / entries.length;
}

async function init() {
  const app = document.getElementById("app");
  let manifest;
  try {
    manifest = await (await fetch(MANIFEST)).json();
  } catch {
    app.textContent = "Could not load the surah list.";
    return;
  }
  const surahs = manifest.surahs || [];

  let begun = 0;
  let complete = 0;
  const cells = surahs
    .map((s) => {
      const passed = passedOf(s.number);
      const frac = s.ayahCount ? Math.min(passed / s.ayahCount, 1) : 0;
      const done = passed >= s.ayahCount && s.ayahCount > 0;
      if (passed > 0) begun++;
      if (done) complete++;
      const strong = frac > 0 ? strengthOf(s.number) : 0;
      // Fill = green intensity by progress; gold bloom by strength.
      const fill = frac === 0 ? 0.06 : 0.14 + frac * 0.6;
      const style =
        `--fill:${fill.toFixed(3)};--strong:${strong.toFixed(3)}`;
      return `
        <a class="hm-cell${done ? " done" : ""}${frac > 0 ? " begun" : ""}"
           href="trainer.html?surah=${s.number}" style="${style}"
           title="${s.englishName} — ${passed}/${s.ayahCount}">
          <span class="hm-num">${s.number}</span>
          <span class="hm-name">${LANG === "ur" ? s.name : s.englishName}</span>
        </a>`;
    })
    .join("");

  app.innerHTML = `
    <section class="hm-head">
      <h1${LANG === "ur" ? ' lang="ur"' : ""}>${T.title}</h1>
      <p${LANG === "ur" ? ' lang="ur"' : ""}>${T.sub}</p>
      <p class="hm-legend"${LANG === "ur" ? ' lang="ur"' : ""}>${T.legend(begun, complete)}</p>
    </section>
    <div class="hm-grid">${cells}</div>`;

  if (LANG === "ur") {
    document.documentElement.lang = "ur";
    document.body.dir = "rtl";
    document.body.classList.add("lang-ur");
  }
}

init();
