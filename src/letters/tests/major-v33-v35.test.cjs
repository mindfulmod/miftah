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
function load(files) {
  const window = { MiftahGame: {} };
  const ctx = vm.createContext({ window, console, Math, JSON, Map, Set, setTimeout, clearTimeout });
  for (const f of files) vm.runInContext(source(f), ctx, { filename: f });
  return window.MiftahGame;
}
const game = source("LettersGame.js");

test("v33 Vowel Hats: every mark is worn along its own stroke; alif never wears one", () => {
  const ns = load(["LettersStrokes.js", "LetterFriends.js", "VowelGames.js"]);
  const V = ns.VowelGames;
  for (const [m, id] of Object.entries(V.MARK_IDS)) {
    const art = V.markArt(m);
    assert.match(art, new RegExp(`data-mark="${id}"`));
    for (const d of ns.LettersStrokes.MARKS[m]) assert.ok(art.includes(`d="${d}"`), `${id} follows its handwriting stroke`);
    assert.deepEqual(off(art), []);
  }
  assert.equal(V.baseOf("بُ"), "ب"); assert.equal(V.markOf("بُ"), "ُ");
  assert.match(V.wearing("ب", "ُ"), /class="vh-on"/);
  const src = source("VowelGames.js");
  assert.match(src, /this\.letters = known\.filter\(\(c\) => c !== "ا"\);/);
  assert.match(src, /this\.mode = this\.marks\.length >= 2 \? "hat" : "friend";/, "one mark taught: choose the friend instead");
  assert.match(src, /skill: "syllable"/);
  assert.match(src, /assisted: !!this\.missed/);
  assert.doesNotMatch(src, /spendStars|earnStars|saveJSON/);
  assert.match(game, /fatha: "HatShop", "kasra-damma": "HatShop", tanween: "HatShop",/);
});

test("v34 Letter Workshop: body then dots; outline or memory; pictures never give the answer", () => {
  const src = source("WorkshopGames.js");
  assert.match(src, /this\.fromMemory = !this\.ctx\.beginner && shape >= 0\.4 && this\.ctx\.canListen\?\.\(\) !== false;/);
  assert.match(src, /const independent = this\.fromMemory && !this\.missed && this\.heard !== false;/, "only a letter built from its sound is independent");
  assert.match(src, /replace\('class="lf"', 'class="lf is-bodiless"'\)/, "a friend without its body when there is no picture");
  assert.match(src, /while \(cut < chars\.length && \/\[ًٌٍَُِّْٰ\]\/\.test\(chars\[cut\]\)\) cut \+= 1;/, "the gap takes the letter's marks with it");
  assert.doesNotMatch(src, /spendStars|earnStars|saveJSON/);
  assert.deepEqual(off(src), []);
  assert.match(game, /\['BuildLetter',2,/);
  assert.match(game, /\['FillGap',2,/);
});

test("v35 Syllables: the Sand Table writes letter + mark; Echo Parade sings syllables; long-vowel stops", () => {
  const sand = source("SandTable.js");
  assert.match(sand, /const ok = \(i\) => i\?\.display && ns\.LettersStrokes\?\.forItem\?\.\(i\);/);
  assert.match(sand, /if \(last\.display !== "ا"\)/, "never a mark on alif");
  const echo = source("PuzzleGames.js");
  assert.match(echo, /this\.syllables = syl\.length >= 2;/);
  assert.match(echo, /skill: this\.syllables \? "syllable" : "letter-name"/);
  assert.match(game, /standing: "EchoParade", "long-sounds": "EchoParade", leen: "EchoParade",/);
  assert.match(game, /marks:kind==='SoundLab'\|\|kind==='HatShop'\|\|kind==='SandTable'\?this\.taughtMarks\(\):undefined,/);
  const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  for (const f of ["VowelGames.js", "WorkshopGames.js"]) assert.match(sw, new RegExp(`"src/letters/${f}"`));
  const notes = fs.readFileSync(path.join(root, "docs", "letter-garden", "RELEASES.md"), "utf8");
  for (const v of ["v33", "v34", "v35"]) assert.match(notes, new RegExp(`## ${v} `));
});
