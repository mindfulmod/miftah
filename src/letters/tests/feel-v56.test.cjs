const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..", "..", "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const palette = (() => {
  const art = read("ART.md");
  return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()));
})();
const off = text => (text.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h));
const game = read("src/letters/LettersGame.js");
const css = read("styles/letters-friends.css");

test("shared feedback remains connected to real outcomes without impact effects", () => {
  assert.match(game, /if \(name === "correct"\) this\.feel\?\.hit\?\.\(\);/);
  const feel=game.slice(game.indexOf("const recent = () =>"),game.indexOf("// Sliding off a button"));
  assert.match(feel,/performance\.now\(\) - t\.at < 1500/);
  assert.doesNotMatch(feel,/lg-hit-flash|lg-burst|stage\?\.animate|n\.animate/);
  assert.match(feel,/replay\(el, "is-hit", 520\)/);
});

test("gentle feedback uses no held squash, overshoot or directional refusal", () => {
  const hit=css.slice(css.indexOf("@keyframes lg-hit {"),css.indexOf(".lg-app .is-miss"));
  const miss=css.slice(css.indexOf("@keyframes lg-miss {"),css.indexOf("/* Legacy effect names"));
  assert.doesNotMatch(hit,/14%|scale: 1\.1|cubic-bezier/);
  assert.doesNotMatch(miss,/translate|rotate|grayscale|saturate/);
  assert.match(css,/\.lg-hit-flash, \.lg-burst \{ display: none; \}/);
  assert.deepEqual(off(css), []);
});

test("v56 Feel: Bath Time's sponge trails the finger (friction) and flecks fly off", () => {
  const toy = read("src/letters/ToyBoxGames.js");
  assert.match(toy, /const nx = px \+ \(ax - px\) \* 0\.28, ny = py \+ \(ay - py\) \* 0\.28;/, "the lag that reads as weight");
  assert.match(toy, /const k = wrap\.offsetWidth \? r\.width \/ wrap\.offsetWidth : 1;/, "stays under the finger when the game is zoomed");
  assert.match(toy, /if \(this\.still\(\) \|\| !this\.pos\) \{ this\.pos = this\.aim\.slice\(\); this\.place\(0\); \}/, "reduced motion: no lag, no tilt");
  assert.match(toy, /class="tb-fleck"/);
  assert.deepEqual(off(toy), []);
});
