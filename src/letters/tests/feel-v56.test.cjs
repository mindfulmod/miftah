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

test("v56 Feel: every right answer hits and every miss thuds, through the sound vocabulary", () => {
  assert.match(game, /if \(name === "correct"\) this\.feel\?\.hit\?\.\(\);\n\s+else if \(name === "softwrong" \|\| name === "wrong"\) this\.feel\?\.miss\?\.\(\);/);
  assert.match(game, /ns\.Haptics\.pulse\("correct"\); \/\/ the melody IS the correct-answer cue\n\s+this\.feel\?\.hit\?\.\(\);/, "world-mode streak melodies hit too");
  const feel = game.slice(game.indexOf("const recent = () =>"), game.indexOf("// Sliding off a button"));
  assert.match(feel, /performance\.now\(\) - t\.at < 1500/, "only right after a real touch — never on timed cues");
  assert.match(feel, /if \(!t \|\| this\.prefersReducedMotion\(\)\) return;/, "nothing under reduced motion");
  assert.match(feel, /if \(r\.width \* r\.height < 360 \* 360\)/, "the flash stays small (WCAG 2.3.1 small-area safe harbour)");
  assert.match(feel, /\{ translate: "0 3px" \}/, "the play-area jolt is 3px, never a big shake");
});

test("v56 Feel: hit-stop, dull misses, soft vs firm materials, all reduced-motion safe", () => {
  assert.match(css, /@keyframes lg-hit \{\n\s+0%, 14% \{ scale: \.9; translate: 0 3px;/, "the squash is HELD for the first ~70ms (hit-stop)");
  assert.match(css, /42% \{ scale: 1\.12; translate: 0 -3px; \}/, "then it pops past full size");
  assert.match(css, /@keyframes lg-miss \{\n\s+0% \{ scale: \.96 \.98; translate: 0 2px; \}/, "a miss is a soft shrug");
  assert.doesNotMatch(css.slice(css.indexOf("@keyframes lg-miss"), css.indexOf("@keyframes lg-miss") + 300), /saturate|grayscale/, "v57: never grey — grey reads as sad");
  assert.doesNotMatch(css.slice(css.indexOf("@keyframes lg-miss"), css.indexOf("@keyframes lg-miss") + 400), /scale: 1\.0[1-9]/, "a miss never bounces");
  assert.match(css, /\.lg-app \.is-pressed\.is-soft \{ scale: 1\.05 \.9; \}/, "soft things squash wide");
  assert.match(css, /@keyframes lg-hit-flash \{ 0% \{ opacity: 0; \} 12% \{ opacity: \.85; \} 100% \{ opacity: 0; \} \}/, "one flash, not a train");
  assert.match(css, /\.lg-hit-flash, \.lg-burst \{ display: none; \}/);
  assert.deepEqual(off(css), []);
  assert.match(read("styles/letters-toybox.css"), /\.lk-bus\.is-going\.is-hit \{ animation: lg-hit \.5s linear, lk-drive 1\.4s ease-in \.9s forwards; \}/);
});

test("v56 Feel: Bath Time's sponge trails the finger (friction) and flecks fly off", () => {
  const toy = read("src/letters/ToyBoxGames.js");
  assert.match(toy, /const nx = px \+ \(ax - px\) \* 0\.28, ny = py \+ \(ay - py\) \* 0\.28;/, "the lag that reads as weight");
  assert.match(toy, /const k = wrap\.offsetWidth \? r\.width \/ wrap\.offsetWidth : 1;/, "stays under the finger when the game is zoomed");
  assert.match(toy, /if \(this\.still\(\) \|\| !this\.pos\) \{ this\.pos = this\.aim\.slice\(\); this\.place\(0\); \}/, "reduced motion: no lag, no tilt");
  assert.match(toy, /class="tb-fleck"/);
  assert.deepEqual(off(toy), []);
});
