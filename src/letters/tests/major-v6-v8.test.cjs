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

function huntHarness({ canListen = true } = {}) {
  const window = { MiftahGame: {} };
  const timers = [];
  vm.runInNewContext(source("LetterHunt.js"), { window, setTimeout: fn => timers.push(fn), Math, console, document: { createElement: () => ({}) } });
  const Hunt = window.MiftahGame.GardenPractice.LetterHunt;
  const listeners = new Map();
  const spot = i => ({ dataset: { spot: String(i), kind: "rock" }, classList: { add() {} }, addEventListener(type, fn) { listeners.set(`${i}:${type}`, fn); }, querySelector: () => ({ animate() {} }) });
  const spots = Array.from({ length: 6 }, (_, i) => spot(i));
  const svg = { querySelectorAll: () => spots, querySelector: sel => spots[Number(sel.match(/\d+/)[0])] };
  const stage = { clientWidth: 800, clientHeight: 600, set innerHTML(v) { this.html = v; }, querySelector: sel => sel === ".hunt-scene" ? svg : { appendChild() {} } };
  const reports = [], prompts = [];
  let done = 0;
  const items = ["ا", "ب", "ت", "ث", "ج", "ح"].map(c => ({ id: c, display: c }));
  const game = new Hunt({ stage, items, land: "lagoon", canListen: () => canListen, say() {}, prompt: p => prompts.push(p), reportOutcome: o => reports.push(o), correct() {}, sfx() {}, done: () => done++, pet: {} });
  timers.shift()();
  return { game, reports, prompts, timers, tap: i => listeners.get(`${i}:click`)(), done: () => done, stage };
}

test("v6 Letter Hunt: heard-not-shown prompts, one report per letter tap, plain scenery reports nothing, five finds finish", () => {
  const h = huntHarness();
  assert.equal(h.prompts[0], null, "with sound on the letter is heard, not shown");
  assert.match(h.stage.html, /class="hunt-scene"/);
  const targetIdx = () => h.game.letters.findIndex(l => l.id === h.game.target.id);
  const wrong = (targetIdx() + 1) % 6;
  h.tap(wrong);
  assert.equal(h.reports.length, 1);
  assert.equal(h.reports[0].correct, false);
  assert.equal(h.reports[0].evidence, "independent_listening");
  assert.equal(h.prompts.at(-1)?.id, h.game.target.id, "a miss shows the letter it wants");
  for (let round = 0; round < 5; round += 1) {
    h.tap(targetIdx());
    while (h.timers.length) h.timers.shift()();
  }
  assert.equal(h.done(), 1);
  assert.ok(h.reports.slice(1).every(r => r.correct && r.activity === "LetterHunt" && r.skill === "letter-name"));
  const quiet = huntHarness({ canListen: false });
  assert.ok(quiet.prompts[0], "sound off shows the letter (supported matching)");
});

test("v6 Letter Hunt: every land has six places, things exist, art on palette, portrait layout keeps letters big", () => {
  const window = { MiftahGame: {} };
  vm.runInNewContext(source("LetterHunt.js"), { window, setTimeout() {}, Math });
  const Hunt = window.MiftahGame.GardenPractice.LetterHunt;
  for (const [land, spec] of Object.entries(Hunt.LANDS)) {
    assert.equal(spec.spots.length, 6, land);
    for (const [, , kind] of spec.spots) assert.ok(Hunt.THINGS[kind], `${land}: ${kind}`);
    const letters = Array.from({ length: 6 }, (_, i) => ({ display: "ب" }));
    assert.deepEqual(off(Hunt.scene(land, letters)), [], land);
    assert.match(Hunt.scene(land, letters, true), /class="hunt-scene is-portrait"[\s\S]*scale\(1\.3\)/);
  }
  const game = source("LettersGame.js");
  assert.match(game, /'LetterDelivery','LetterHunt',/);
  assert.match(game, /if\(this\.petKnowledge\(\)\.length>=3\)choices\.push\('LetterHunt'\);/);
});

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
