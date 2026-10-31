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

test("v7 Read Together: grown-up gated, weakest-first cards, results kept apart from the strength model", () => {
  const game = source("LettersGame.js");
  const rt = game.slice(game.indexOf("    readTogetherItems() {"), game.indexOf("    // ---------- home: the journey map ----------"));
  assert.match(rt, /strength\.weakest\(items, 6\)/);
  assert.match(rt, /this\.saveJSON\("quran-trainer:letters:read-aloud", history\.slice\(-20\)\)/);
  assert.doesNotMatch(rt, /reportOutcome|LearningSession|spendStars/, "a grown-up's marks never touch the child's model or stars");
  assert.doesNotMatch(rt, /daily garden will bring/, "no promise the system does not keep");
  assert.match(game, /class="lg-big-btn gu-read-start">Start reading together<\/button>/);
  const state = source("LettersState.js");
  assert.match(state, /if \(name === "read-aloud"\)/);
});

test("v8 Quran Word Shelf: only decodable words (the word chapters' own filter), real recitation, honest fallback", () => {
  const game = source("LettersGame.js");
  assert.match(game, /this\.worlds\?\.wordPool\?\.\(2, 5, this\.progress\?\.done \|\| \[\]\)/);
  assert.match(game, /if \(item\.audioPath && this\.sound\.enabled && ns\.RecitationAudio && navigator\.onLine !== false\) return this\.recite\(item, onEnd\);/);
  assert.match(game, /this\.shelfWords\(\)\.length \? `<button type="button" role="tab" aria-selected="false" class="album-tab" data-book="words"/);
  assert.match(fs.readFileSync(path.join(root, "letters.html"), "utf8"), /src\/core\/RecitationAudio\.js/);
  assert.deepEqual(off(game.slice(game.indexOf("const REHAL"), game.indexOf("const REHAL") + 700)), []);
  const notes = fs.readFileSync(path.join(root, "docs", "letter-garden", "RELEASES.md"), "utf8");
  for (const v of ["v6", "v7", "v8"]) assert.match(notes, new RegExp(`## ${v} `));
});
