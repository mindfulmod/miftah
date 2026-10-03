const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..", "..", "..");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const palette = (() => {
  const art = fs.readFileSync(path.join(root, "ART.md"), "utf8");
  return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()));
})();
const off = text => (text.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h));
function load() {
  const window = { MiftahGame: {} };
  const ctx = vm.createContext({ window, console, Math, JSON, Map, Set, setTimeout, clearTimeout });
  for (const f of ["../data/letters.js", "LettersStrokes.js", "LetterFriends.js", "PuzzleGames.js"]) vm.runInContext(source(f), ctx, { filename: f });
  return window.MiftahGame;
}

test("v31 Puzzle Tree: dot-siblings, alphabet order, perceptual certainty", () => {
  const ns = load();
  const P = ns.PuzzleGames;
  const all = Object.keys(ns.LettersStrokes.LETTERS);
  assert.deepEqual(P.siblings("ب", all).sort(), ["ت", "ث"].sort());
  assert.deepEqual(P.siblings("ج", all).sort(), ["ح", "خ"].sort());
  assert.deepEqual(P.siblings("ا", all), [], "alif has no dot-sibling");
  assert.equal(P.ORDER().join(""), "ابتثجحخدذرزسشصضطظعغفقكلمنهوي", "hija'i order");
  // Certainty is what a child can see: dot count and side, never coordinates.
  const D = ns.GardenPractice.DotsLast;
  const t = (target, offered, revealed, settled) => { const o = Object.create(D.prototype); Object.assign(o, { target, offered, revealed, settled, dotList: P.dotsOf(target) }); return o.determined(); };
  assert.equal(t("ب", ["ب", "ت", "ث"], 1), true, "one dot below can only be ب");
  assert.equal(t("ت", ["ب", "ت", "ث"], 1), false, "one dot on top could still be ث");
  assert.equal(t("ث", ["ت", "ث"], 2), false);
  assert.equal(t("ث", ["ت", "ث"], 3), true);
  assert.equal(t("ح", ["ح", "خ"], 0, false), false, "a dotless letter waits for a dot that never comes");
  assert.equal(t("ح", ["ح", "خ"], 0, true), true);
});

test("v31 Puzzle Tree: honest, untimed, unscored; fair puzzles", () => {
  const src = source("PuzzleGames.js");
  assert.doesNotMatch(src, /spendStars|earnStars|saveJSON|setInterval/);
  assert.match(src, /if \(chosen !== this\.target && !certain\) \{/, "a guess before the dots is 'not yet', never a miss");
  assert.match(src, /if \(certain\) this\.report\(/);
  assert.match(src, /this\.len = Math\.max\(2, Math\.min\(this\.max, this\.len \+ \(this\.missed \? -1 : 1\)\)\);/, "Echo grows and shrinks");
  assert.match(src, /this\.max = ctx\.beginner \? 2 : 4;/, "a sprout never holds more than two");
  assert.match(src, /const SYMMETRIC = new Set\(\["ا", "ب", "ت", "ث", "ن"\]\);/, "no mirror trap on symmetric letters");
  assert.match(src, /class="pz-singers is-hidden"/, "the singers are heard, not seen, until the line is done");
  assert.match(src, /skill: "alphabet-order", evidence: "motor_assembly_participation",\n?\s*correct: this\.missed \? undefined : true, affectsStrength: false/);
  assert.deepEqual(off(src), []);
  const game = source("LettersGame.js");
  assert.match(game, /renderPuzzleTree\(\) \{/);
  assert.match(game, /choices\.splice\(2,0,'PuzzleTree'\)/);
  assert.match(source("GardenBrain.js"), /"DotsLast", "SameLetter", "EchoParade"/);
  assert.match(fs.readFileSync(path.join(root, "sw.js"), "utf8"), /"src\/letters\/PuzzleGames\.js"/);
  assert.match(fs.readFileSync(path.join(root, "docs", "letter-garden", "RELEASES.md"), "utf8"), /## v31 /);
});
