const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..", "..", "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const palette = (() => { const art = read("ART.md"); return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase())); })();
const off = (t) => (t.match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase()).filter((h) => !palette.has(h));
const load = () => { const window = { MiftahGame: {} }; const ctx = vm.createContext({ window, Math, String, Number, Array, Object, JSON, Set, Map, setTimeout, clearTimeout }); vm.runInContext(read("src/letters/PictureWords.js"), ctx); vm.runInContext(read("src/letters/EarsGames.js"), ctx); return window.MiftahGame; };

test("v61 Ears First: beats are counted from vowel marks, one per syllable (pausal reading)", () => {
  const { EarsGames } = load();
  const want = { "فِيل": 1, "شَمْس": 1, "عُشّ": 1, "بَيْضَة": 2, "رُمَّان": 2, "ثُعْبَان": 2, "جَمَل": 2, "هُدْهُد": 2, "سَمَكَة": 3, "عَنْكَبُوت": 3, "سُلَحْفَاة": 3, "يَمَامَة": 3 };
  for (const [w, n] of Object.entries(want)) assert.equal(EarsGames.beats(w), n, w);
});

test("v61 Ears First: first-sound groups exist for SameStart / OddSound (at least two pictures each)", () => {
  const { EarsGames } = load();
  const g = EarsGames.groups();
  assert.ok(g.length >= 6);
  for (const set of g) { assert.ok(set.length >= 2); assert.equal(new Set(set.map((p) => p.char)).size, 1); }
});

test("v61 Ears First: three listening games, no letters shown, in the practice garden's listen group", () => {
  const src = read("src/letters/EarsGames.js");
  assert.deepEqual(off(src), []);
  assert.doesNotMatch(src.replace(/\/\/[^\n]*/g, ""), /Amiri|reportOutcome/, "no letters drawn, nothing reported to the letter model");
  const game = read("src/letters/LettersGame.js");
  assert.match(game, /\['listen',\['BeatDrum','SameStart','OddSound'\]\]/);
  assert.match(game, /\.\.\.\(ns\.EarsGames\?\.KINDS\|\|\[\]\),/);
  assert.match(game, /if\(ns\.EarsGames\)choices\.push\('BeatDrum','SameStart',\.\.\.\(this\.sprout\?\[\]:\['OddSound'\]\)\);/);
  assert.match(read("letters.html"), /src\/letters\/EarsGames\.js\?v=20261016-v61/);
  assert.match(read("styles/letters-friends.css"), /@media \(prefers-reduced-motion: reduce\) \{ \.ea-beats i\.is-pulse \{ animation: none; \}/);
});
