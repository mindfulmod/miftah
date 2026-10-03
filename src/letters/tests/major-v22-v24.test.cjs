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
const game = source("LettersGame.js");

test("v22 Little Sprout: per child, includes gentle, glows the right answer after a miss, hold to leave", () => {
  assert.match(source("LettersState.js"), /if \(name === "sprout"\)/);
  assert.match(game, /this\.gentle = this\.loadJSON\("quran-trainer:letters:gentle", false\) \|\| this\.sprout;/);
  assert.match(game, /if \(this\.sprout && target\) this\.glowAnswer\(el, target\);/);
  const glow = game.slice(game.indexOf("    glowAnswer(el, target) {"), game.indexOf("    // Sound Lab (v11): the marks"));
  assert.match(glow, /\.play-bubble, \.practice-replay, \.learning-hint/, "never glows the prompt itself");
  assert.doesNotMatch(glow, /reportOutcome/);
  assert.match(game, /const holdToLeave = this\.sprout && \/\\blg-\(play\|meet\|stars\)\\b\/\.test\(el\.className\);/);
  assert.match(game, /timer = setTimeout\(\(\) => \{ stop\(\); leave\(\); \}, 800\);/);
});

test("v23 World Overview: the whole world on one page; unreached lands are mist; tapping travels", () => {
  const wo = game.slice(game.indexOf("    openWorldOverview(el, scroll, yOf) {"), game.indexOf("    // Little Sprout (v22): light up"));
  assert.match(wo, /const mist = reached \? "" :/);
  assert.match(wo, /dialog\.querySelectorAll\("\.wo-land:not\(\.is-misty\)"\)/, "mist lands cannot be travelled to");
  assert.match(wo, /scroll\.scrollTo\?\.\(\{ top: Math\.max\(0, yOf\(target\)/);
  assert.deepEqual(off(wo), []);
  assert.match(game, /class="map-world-btn" aria-label="See the whole world"/);
});

test("v24 Letter Balloons: free play for the youngest, every letter takes a turn, nothing reported", () => {
  const src = source("LetterBalloons.js");
  assert.doesNotMatch(src, /reportOutcome|spendStars|saveJSON/);
  assert.match(src, /const item = this\.letters\[this\.n\+\+ % this\.letters\.length\];/);
  assert.match(src, /width="?96|96px/);
  assert.deepEqual(off(src), []);
  assert.match(game, /if\(this\.sprout\)choices\.unshift\('LetterBalloons'\);else choices\.push\('LetterBalloons'\);/);
  const notes = fs.readFileSync(path.join(root, "docs", "letter-garden", "RELEASES.md"), "utf8");
  for (const v of ["v22", "v23", "v24"]) assert.match(notes, new RegExp(`## ${v} `));
  assert.match(notes, /## Overworld refinement/);
});
