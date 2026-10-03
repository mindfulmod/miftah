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

function stateWith(store = {}) {
  const localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
  const window = { MiftahGame: { LettersDecorations: { normalize: v => v } } };
  vm.runInNewContext(source("LettersState.js"), { window, localStorage, console });
  return { S: window.MiftahGame.LettersState, store };
}

test("v9 Family Garden: the first child keeps the original keys; siblings are scoped; settings are shared", () => {
  const { S, store } = stateWith();
  S.write("quran-trainer:letters:pet", { hue: 320, species: "cat" });
  assert.ok("quran-trainer:letters:pet" in store, "child one writes the original key");
  const id = S.addProfile();
  assert.equal(id, "p2");
  S.setActive("p2");
  assert.equal(S.activeProfile(), "p2");
  assert.equal(S.read("quran-trainer:letters:pet", null), null, "a new child starts empty");
  S.write("quran-trainer:letters:pet", { hue: 200, species: "blob" });
  assert.ok("quran-trainer:letters:@p2:pet" in store);
  assert.equal(S.readAs("p1", "quran-trainer:letters:pet", null).species, "cat", "child one's pet is untouched");
  S.write("quran-trainer:letters:reduced-motion", true);
  assert.ok("quran-trainer:letters:reduced-motion" in store, "device settings are shared");
  assert.equal(JSON.stringify(S.profiles().map(p => p.id)), JSON.stringify(["p1", "p2"]));
  const game = source("LettersGame.js");
  assert.match(game, /if \(!chosen && \(ns\.LettersState\?\.profiles\?\.\(\)\.length \|\| 1\) > 1\) return this\.renderWhoIsPlaying\(\);/);
  assert.match(game, /setTimeout\(\(\) => location\.reload\(\), 120\);/, "switching reloads so every system starts clean");
});

test("v10 Moon Calendar: Ramadan and both Eids from the Islamic calendar; the Eid gift is once per Eid and only adds", () => {
  const ctx = { getImageData: () => ({ data: [] }), fillText() {}, clearRect() {}, measureText: () => ({ width: 0 }) };
  const window = { MiftahGame: {} };
  vm.runInNewContext(source("LettersArt.js"), { window, document: { createElement: () => ({ getContext: () => ctx }) }, console, Math, Date, Intl });
  const Art = window.MiftahGame.LettersArt;
  assert.equal(Art.season(new Date(2027, 1, 15)), "ramadan");
  assert.equal(Art.season(new Date(2027, 2, 10)), "eid-fitr");
  assert.equal(Art.season(new Date(2026, 9, 2)), null);
  for (const k of ["ramadan", "eid-fitr", "eid-adha"]) assert.deepEqual(off(Art.seasonLayer(k, "night")), [], k);
  assert.equal(Art.seasonLayer(null), "");
  const game = source("LettersGame.js");
  const gift = game.slice(game.indexOf("    giveSeasonGift(el, rig) {"), game.indexOf("    // Family Garden (v9, 2026"));
  assert.match(gift, /if \(given\.includes\(tag\)\) return;/);
  assert.doesNotMatch(gift, /splice|filter\(/, "gifts only add");
  assert.match(source("LettersState.js"), /if \(name === "season-gifts"\)/);
});

test("v11 Sound Lab: only taught marks, free play with no reports, output shown as a measured sign", () => {
  const lab = source("SoundLab.js");
  assert.doesNotMatch(lab, /reportOutcome/);
  assert.match(lab, /ns\.LettersArt\?\.letterSign/);
  assert.doesNotMatch(lab, /◌/, "no dotted-circle base (missing from the Quran font)");
  const game = source("LettersGame.js");
  const marks = game.slice(game.indexOf("    taughtMarks() {"), game.indexOf("    // Moon Calendar (v10):"));
  for (const [world, n] of [["fatha", 1], ["kasra-damma", 2], ["tanween", 3], ["sukoon", 1], ["shaddah", 1]]) assert.match(marks, new RegExp(`done\\.has\\("${world}"\\)`));
  assert.match(game, /if\(this\.petKnowledge\(\)\.length&&this\.taughtMarks\(\)\.length\)choices\.push\('SoundLab'\);/);
});

test("v12 Garden Visitors: only owned animal stickers visit, up to three a day, play only", () => {
  const game = source("LettersGame.js");
  const visit = game.slice(game.indexOf("    addGardenVisitors(el) {"), game.indexOf("    // Sound Lab (v11):"));
  assert.match(visit, /const pool = Object\.keys\(VISITORS\)\.filter\(id => owned\.has\(id\)\);/);
  assert.match(visit, /\.slice\(0, 3\)/);
  assert.doesNotMatch(visit, /saveJSON|spendStars|reportOutcome/);
  assert.match(source("LettersArt.js"), /function stickerMotif\(id, size = 56\)/);
});

test("v13 Letter Studio: stamps known letters and owned friends; hanging saves a garden sign; nothing is judged", () => {
  const studio = source("LetterStudio.js");
  assert.doesNotMatch(studio, /reportOutcome/);
  assert.match(studio, /this\.ctx\.saveDrawing\?\.\(url\)/);
  assert.match(studio, /c\.width = c\.height = 160;/, "the garden-sign thumbnail format");
  assert.deepEqual(off(studio), []);
  const game = source("LettersGame.js");
  assert.match(game, /saveDrawing:url=>\{const kept=\{\.\.\.\(this\.savedDrawings\|\|\{\}\)\};/);
  const notes = fs.readFileSync(path.join(root, "docs", "letter-garden", "RELEASES.md"), "utf8");
  for (const v of ["v9", "v10", "v11", "v12", "v13"]) assert.match(notes, new RegExp(`## ${v} `));
  const html = fs.readFileSync(path.join(root, "letters.html"), "utf8"), sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  for (const f of ["SoundLab.js", "LetterStudio.js", "LetterHunt.js"]) { assert.match(html, new RegExp(f)); assert.match(sw, new RegExp(f)); }
});
