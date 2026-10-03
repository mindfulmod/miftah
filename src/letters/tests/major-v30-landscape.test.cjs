const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..", "..", "..");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const palette = (() => {
  const art = fs.readFileSync(path.join(root, "ART.md"), "utf8");
  return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()));
})();
const off = text => (text.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h));

test("v30 Story of the Garden: restoration not gates, one moment per visit, a reverent Bismillah", () => {
  const src = source("StoryGarden.js");
  // The Bismillah is Alafasy's own word-by-word recitation of Al-Fatiha 1:1.
  const words = JSON.parse(fs.readFileSync(path.join(root, "data", "surah-1.json"), "utf8")).ayahs[0].words.map(w => w.arabic);
  for (const w of words) assert.ok(src.includes(`"${w}"`), `Bismillah word ${w} matches the data`);
  for (let i = 1; i <= 4; i += 1) assert.match(src, /audioPath: `wbw\/001_001_00\$\{i \+ 1\}\.mp3`/);
  // Celebration only after the recitation and the child's turn.
  const grad = src.slice(src.indexOf("renderGraduation({ replay = false } = {}) {"), src.indexOf("  };\n\n  if (ns.LettersGame)"));
  assert.ok(grad.indexOf("is-yours") < grad.indexOf("confettiAt"), "no confetti over the recitation");
  assert.ok(grad.indexOf("await sayWord") < grad.indexOf("confettiAt"));
  // Pale, never grey; nothing locked.
  assert.match(src, /const pale = \(1 - \(restored\[r\.land\] \|\| 0\)\) \* 0\.42;/);
  assert.doesNotMatch(src, /disabled|spendStars|earnStars|reportOutcome/);
  assert.match(src, /if \(allDone && !this\.loadJSON\(GRAD_KEY, null\)\) return later/);
  assert.deepEqual(off(src), []);
  assert.match(source("LettersGame.js"), /try \{ this\.storyOnMap\?\.\(el, \{ worlds, yOf, gap: GAP, welcome: !!welcome \}\); \} catch \{\}/);
  const state = source("LettersState.js");
  for (const k of ["story-seen", "lands-home", "graduated"]) assert.match(state, new RegExp(`name === "${k}"`));
  assert.match(fs.readFileSync(path.join(root, "sw.js"), "utf8"), /"src\/letters\/StoryGarden\.js"/);
});

test("Landscape phones: a side rail for controls, every activity gets the full height", () => {
  const css = fs.readFileSync(path.join(root, "styles", "letters-landscape.css"), "utf8");
  assert.match(css, /@media \(orientation: landscape\) and \(max-height: 500px\)/);
  assert.match(css, /\.lg-app \.lg-play \.play-prompt, \.lg-app \.lg-play \.practice-heading \{/);
  assert.match(css, /\.lg-app \.lg-meet \.meet-stage \{/, "meet keeps Next on screen");
  for (const sel of ["feed-food", "pairs-card", "catch-faller", "build-tile", "blend-part", "hunt-letter", "lb-text"]) assert.match(css, new RegExp(sel));
  assert.deepEqual(off(css), []);
  const html = fs.readFileSync(path.join(root, "letters.html"), "utf8");
  // Loaded after every other Letter Garden stylesheet so it wins.
  const links = [...html.matchAll(/href="(styles\/letters[^"?]+)/g)].map(m => m[1]);
  assert.equal(links[links.length - 1], "styles/letters-landscape.css");
  assert.match(source("LetterHunt.js"), /preserveAspectRatio", "xMidYMid meet"/, "a wide stage never crops a letter");
});

test("Audio: book words are spoken without punctuation so recordings match; supplement prepared", () => {
  const books = source("LivingBooks.js");
  assert.match(books, /const bare = \(w\) => String\(w \|\| ""\)\.replace\(\/\[؟\?\.!،\]\/g, ""\);/);
  assert.doesNotMatch(books, /speak: b\.dataset\.word \}/);
  const sup = fs.readFileSync(path.join(root, "docs", "letter-garden", "reviews", "fm-curriculum-scripts", "FRIENDS-BOOKS-SUPPLEMENT.md"), "utf8");
  assert.match(sup, /## 24-friend-names \(28\)/);
  for (const f of ["24-friend-names", "25-picture-words", "26-book-words"]) assert.ok(fs.existsSync(path.join(root, "docs", "letter-garden", "reviews", "fm-curriculum-scripts", "batches", `${f}.txt`)));
});
