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
      met: "چھوا", strong: "پختہ", legend: (a, b) => `${a} سورتیں شروع · ${b} مکمل`,
      gemsTitle: "جڑوں کے نگینے", gemsSub: "ایک ہی جڑ کے دو یا زیادہ الفاظ ایک نگینہ بناتے ہیں",
      gemsEmpty: "ابھی کوئی نگینہ نہیں — ایک ہی جڑ کے دو الفاظ سیکھیں، پہلا بن جائے گا",
      gemsCount: (n) => `${n} نگینے جمع` }
  : { title: "Your journey through the Book", sub: "Each surah warms as you decode it",
      met: "touched", strong: "strong", legend: (a, b) => `${a} surahs begun · ${b} complete`,
      gemsTitle: "Root gems", gemsSub: "Two or more words from one root form a gem",
      gemsEmpty: "No gems yet — learn two words from the same root and the first forms",
      gemsCount: (n) => `${n} gems collected` };

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

// ---------- root gems ----------
// Each triliteral root the learner knows 2+ words from becomes a collectible
// gem. It cuts sharper and glows brighter as the family grows — learn رحم
// once and Rahman/Raheem/rahmat start filling the same jewel (spec: turns
// isolated words into a web you can SEE).
function gemTierOf(count) {
  return count >= 6 ? 3 : count >= 4 ? 2 : count >= 2 ? 1 : 0;
}
// Deterministic hue per root so a gem always looks the same.
function hueOf(root) {
  let h = 0;
  for (const ch of root) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}
function gemSVG(root, count) {
  const tier = gemTierOf(count);
  const hue = hueOf(root);
  const c = (l) => `hsl(${hue} ${55 + tier * 8}% ${l}%)`;
  const glow = tier >= 2
    ? `<circle cx="24" cy="26" r="21" fill="${c(60)}" opacity="${0.1 + tier * 0.05}"/>`
    : "";
  // A faceted jewel: top table, crown facets, pointed pavilion. Higher tiers
  // add inner sparkle facets.
  const inner = tier >= 3
    ? `<path d="M24 14 L31 22 L24 30 L17 22 Z" fill="${c(78)}" opacity="0.55"/>`
    : "";
  return `
    <svg viewBox="0 0 48 52" aria-hidden="true">
      ${glow}
      <path d="M14 12 H34 L42 22 L24 44 L6 22 Z" fill="${c(46)}" stroke="${c(30)}" stroke-width="1"/>
      <path d="M14 12 L24 22 L34 12 Z" fill="${c(62)}"/>
      <path d="M6 22 L24 22 L14 12 Z" fill="${c(52)}"/>
      <path d="M42 22 L24 22 L34 12 Z" fill="${c(56)}"/>
      <path d="M6 22 L24 44 L24 22 Z" fill="${c(40)}"/>
      <path d="M42 22 L24 44 L24 22 Z" fill="${c(48)}"/>
      ${inner}
      <path d="M14 12 H34" stroke="${c(80)}" stroke-width="1.2" opacity="0.7"/>
    </svg>`;
}
function renderGems() {
  const byRoot = new Map();
  for (const e of WordStrength.entries()) {
    if (!e.root || !(e.fsrs && e.fsrs.reps > 0)) continue;
    if (!byRoot.has(e.root)) byRoot.set(e.root, []);
    // one representative per distinct gloss so re-encounters don't inflate
    const list = byRoot.get(e.root);
    if (!list.some((x) => x.english === e.english)) list.push(e);
  }
  const gems = [...byRoot.entries()]
    .filter(([, words]) => words.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);

  const head = `
    <section class="hm-head gems-head">
      <h2${LANG === "ur" ? ' lang="ur"' : ""}>${T.gemsTitle}</h2>
      <p${LANG === "ur" ? ' lang="ur"' : ""}>${gems.length ? T.gemsCount(gems.length) : T.gemsSub}</p>
    </section>`;

  if (!gems.length) {
    return head + `<p class="gems-empty"${LANG === "ur" ? ' lang="ur"' : ""}>${T.gemsEmpty}</p>`;
  }

  const cells = gems
    .map(([root, words]) => {
      const glosses = words.slice(0, 4).map((w) => w.display || w.english).join(" · ");
      return `
        <div class="gem-cell tier-${gemTierOf(words.length)}" title="${root} — ${words.length} words">
          <div class="gem-art">${gemSVG(root, words.length)}</div>
          <div class="gem-root ar" lang="ar">${root.split("").join(" ")}</div>
          <div class="gem-glosses">${glosses}</div>
          <div class="gem-count">${words.length}</div>
        </div>`;
    })
    .join("");
  return head + `<div class="gems-grid">${cells}</div>`;
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
    <div class="hm-grid">${cells}</div>
    ${renderGems()}`;

  if (LANG === "ur") {
    document.documentElement.lang = "ur";
    document.body.dir = "rtl";
    document.body.classList.add("lang-ur");
  }
}

init();
