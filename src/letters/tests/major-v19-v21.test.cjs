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
const game = source("LettersGame.js");

test("v19 Quran Treasury: every entry matches the repo's own surah data, word for word", () => {
  const table = game.slice(game.indexOf("const TREASURY = {"), game.indexOf("const pad3 = (n)"));
  const entries = [...table.matchAll(/(\w+): \[(\d+), (\d+), (\d+), "([^"]+)", "([^"]*)", "([^"]+)"\]/g)];
  assert.ok(entries.length >= 20, `${entries.length} entries`);
  for (const [, id, s, a, w, arabic, audio, name] of entries) {
    const data = JSON.parse(fs.readFileSync(path.join(root, "data", `surah-${s}.json`), "utf8"));
    const ayah = data.ayahs.find(x => x.number === Number(a));
    const word = ayah?.words.find(x => x.position === Number(w));
    assert.ok(word, `${id}: ${s}:${a}:${w} exists`);
    assert.equal(word.arabic, arabic, `${id} is the word as written`);
    assert.equal(word.audio || "", audio, `${id} clip path`);
    assert.equal(data.surah.name, name, `${id} surah name`);
  }
  assert.match(game, /dialog\.addEventListener\('close',\(\)=>\{this\.stopSpeech\(\);/);
});

test("v20 Garden Together: siblings take turns, share one basket, and nothing is reported", () => {
  const src = source("GardenTogether.js");
  assert.doesNotMatch(src, /reportOutcome|spendStars|saveJSON/);
  assert.match(src, /this\.turn = 1 - this\.turn;/, "turns always pass");
  assert.match(game, /if\(this\.petKnowledge\(\)\.length>=4&&this\.siblingPets\(\)\.length\)choices\.push\('GardenTogether'\);/);
  const html = fs.readFileSync(path.join(root, "letters.html"), "utf8"), sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  assert.match(html, /GardenTogether\.js/); assert.match(sw, /GardenTogether\.js/);
});

test("v21 Seasons: month and hemisphere pick the season; layers on palette; calm modes hide them", () => {
  const ctx = { getImageData: () => ({ data: [] }), fillText() {}, clearRect() {}, measureText: () => ({ width: 0 }) };
  const window = { MiftahGame: {} };
  vm.runInNewContext(source("LettersArt.js"), { window, document: { createElement: () => ({ getContext: () => ctx }) }, console, Math, Date, Intl });
  const Art = window.MiftahGame.LettersArt;
  assert.equal(Art.yearSeason(new Date(2026, 9, 2)), "autumn");
  assert.equal(Art.yearSeason(new Date(2026, 9, 2), true), "spring");
  assert.equal(Art.yearSeason(new Date(2027, 0, 10)), "winter");
  assert.equal(Art.yearLayer("summer"), "");
  for (const k of ["spring", "autumn", "winter"]) assert.deepEqual(off(Art.yearLayer(k)), [], k);
  const style = fs.readFileSync(path.join(root, "styles", "letters.css"), "utf8");
  assert.match(style, /\.lg-gentle \.lg-year \{ display: none !important; \}/);
  assert.match(source("LettersState.js"), /"hemisphere"\]\);/);
  const notes = fs.readFileSync(path.join(root, "docs", "letter-garden", "RELEASES.md"), "utf8");
  for (const v of ["v19", "v20", "v21"]) assert.match(notes, new RegExp(`## ${v} `));
});
