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

test("v28 Sand Table: the Writing Garden engine, a fading guide, honest motor evidence", () => {
  const src = source("SandTable.js");
  assert.match(src, /ns\.LettersStrokes\.guide\(this\.paper, ns\.LettersStrokes\.forItem\(item\)/, "same engine: order, direction, tolerance");
  assert.match(src, /const LEVELS = \["show", "dotted", "start", "memory"\];/);
  assert.match(src, /const lv = w >= 0\.75 \? 3 : w >= 0\.5 \? 2 : w >= 0\.25 \? 1 : 0;/, "the Brain's write skill picks the help");
  assert.match(src, /return this\.ctx\.beginner \? Math\.min\(lv, 1\) : lv;/, "a sprout always sees the path");
  // Shown letters only participate; bare-sand letters finished without wandering count.
  assert.match(src, /correct: bare && this\.snaps <= 1 \? true : undefined, affectsStrength: bare/);
  assert.match(src, /if \(this\.lv >= 3\) \{ this\.ctx\.prompt\?\.\(null\); this\.ctx\.beginRound\?\.\(item, "drawing"\); \}/, "memory never prints the letter");
  assert.match(src, /replace\('class="lf"', 'class="lf is-bodiless"'\)/, "the reminder friend has no body to copy");
  assert.doesNotMatch(src, /spendStars|earnStars|saveJSON/);
  assert.deepEqual(off(src), []);
  const css = fs.readFileSync(path.join(root, "styles", "letters-friends.css"), "utf8");
  assert.match(css, /\.sand-paper\[data-level="memory"\] \.tg-arrow, \.sand-paper\[data-level="memory"\] \.tg-start \{ display: none; \}/);
  assert.match(source("LettersLearning.js"), /\["trace", "GardenPaths", "SandTable"\]\.includes\(activity\)\) return "drawing"/);
  assert.match(source("LetterFriends.js"), /function dress\(char\)/);
  assert.match(source("LettersSound.js"), /sand: \[N\(0/);
  assert.match(source("LettersGame.js"), /const choices=\['Feed','DotGarden','GardenPaths','SandTable','WaterGarden'\];/);
  assert.match(source("GardenBrain.js"), /pickOne\(\["SandTable", "SandTable", "GardenPaths", "DotGarden", "BuildLetter"\]\)/);
  assert.match(fs.readFileSync(path.join(root, "sw.js"), "utf8"), /"src\/letters\/SandTable\.js"/);
  assert.match(fs.readFileSync(path.join(root, "docs", "letter-garden", "RELEASES.md"), "utf8"), /## v28 /);
});
