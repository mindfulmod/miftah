const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..", "..", "..");
const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
const palette = (() => { const art = read("ART.md"); return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase())); })();
const off = (t) => (t.match(/#[0-9a-fA-F]{6}/g) || []).map((h) => h.toLowerCase()).filter((h) => !palette.has(h));
const load = () => { const window = { MiftahGame: {} }; vm.runInContext(read("src/letters/WordTree.js"), vm.createContext({ window, Math, String, Number, Array, Object, JSON, Set, Map, setTimeout, clearTimeout })); return window.MiftahGame.WordTree; };
const surahs = () => [1, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114].map((n) => { const d = JSON.parse(read(`data/surah-${n}.json`)); return { ayahs: d.ayahs.map((a) => ({ words: a.words.map((w) => ({ arabic: w.arabic, root: w.root || "", audioPath: "x" })) })) }; });

test("v63 Word Tree: families from the corpus roots — biggest first, two or more words each", () => {
  const W = load();
  const fams = W.families(surahs());
  assert.ok(fams.length >= 20);
  assert.equal(fams[0].root, "عبد");
  for (const f of fams) assert.ok(f.words.length >= 2);
});

test("v63 Word Tree: the root letters light inside each word (hamza seats count as hamza)", () => {
  const W = load();
  const lit = (w, r) => W.pieces(w).filter((p, i) => W.rootMarks(w, r)[i]).map((p) => p.base).join("");
  assert.equal(lit("نَعْبُدُ", "عبد"), "عبد");
  assert.equal(lit("ٱلرَّحْمَـٰنِ", "رحم"), "رحم");
  assert.equal(lit("أَعْبُدُ", "عبد"), "عبد");
  assert.equal(lit("رَبِّ", "ربب"), "رب", "a doubled root letter written once (shadda) lights once");
});

test("v63 Word Tree: opens with the Ayah Garden, grows a branch a day, Leaf Home is wired", () => {
  const game = read("src/letters/LettersGame.js");
  assert.match(game, /if \(!tabs \|\| !ns\.WordTree \|\| !this\.ayahGardenOpen\?\.\(\) \|\| this\.treeFamilies\(\)\.length < 2/);
  assert.match(game, /if \(s\.day !== today\) \{ s\.grew = s\.branches < total \? s\.branches : null; s\.branches = Math\.min\(total, s\.branches \+ 1\);/);
  assert.match(game, /\.\.\.\(kind==='LeafHome'\?\{families:this\.treeFamilies\(\),branches:this\.treeState\(\)\.branches\}:\{\}\)/);
  assert.match(read("src/letters/LettersWorlds.js"), /root: typeof w\.root === 'string' \? w\.root : ''/);
  assert.deepEqual(off(read("src/letters/WordTree.js")), []);
  assert.match(read("styles/letters-rooms.css"), /@media \(prefers-reduced-motion: reduce\)\{\.wt-falling,\.wt-branch\.is-new,\.wt-word\.is-glow \.wt-l\.is-root\{animation:none\}\}/);
  assert.match(read("letters.html"), /src\/letters\/WordTree\.js\?v=20261016-v63/);
});
