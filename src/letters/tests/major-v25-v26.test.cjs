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

// A tiny browser: the modules attach to window.MiftahGame.
function load(files, { now } = {}) {
  const store = new Map();
  const window = { MiftahGame: {} };
  const ctx = vm.createContext({
    window, console, Math, JSON, Map, Set, Date: now ? class extends Date { constructor(...a) { super(...(a.length ? a : [now])); } static now() { return now; } } : Date,
    localStorage: { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) },
    performance: { now: () => 0 }, setTimeout, clearTimeout,
  });
  for (const f of files) vm.runInContext(source(f), ctx, { filename: f });
  return window.MiftahGame;
}

test("v26 Letter Friends: 28 friends, each drawn from the handwriting model, on palette", () => {
  const ns = load(["LettersStrokes.js", "LetterFriends.js"]);
  const F = ns.LetterFriends;
  const letters = Object.keys(ns.LettersStrokes.LETTERS);
  assert.equal(F.CHARS.length, 28);
  assert.deepEqual([...F.CHARS].sort(), [...letters].sort(), "every letter has exactly one friend");
  for (const char of F.CHARS) {
    const f = F.get(char);
    // The friend's name starts with its letter (hamza-carrying alif counts as alif).
    const first = [...f.word][0];
    assert.ok(first === char || (char === "ا" && first === "أ"), `${f.en} starts with ${char}`);
    assert.match(f.word, /[َُِْ]/, `${f.en} is vowelled`);
    const svg = F.art(char);
    // The body IS the letter: every handwriting stroke appears in the friend.
    for (const s of ns.LettersStrokes.LETTERS[char]) if (typeof s === "string") assert.ok(svg.includes(`d="${s}"`), `${f.en} body uses ${char}'s stroke`);
    assert.deepEqual(off(svg), [], `${f.en} stays on palette`);
    assert.match(svg, /class="lf"/);
    assert.match(F.art(char, { mode: "plain" }), /class="lf is-plain"/);
  }
  assert.equal(F.get("م").word, "مِفْتَاح", "Meem's friend is the key the app is named for");
  assert.doesNotMatch(source("LetterFriends.js"), /كَلْب/, "no dog keyword");
  assert.deepEqual(off(source("LetterFriends.js")), []);
});

test("v26 friend looks fade with the friend skill and never hide the letter", () => {
  const { LetterFriends: F } = load(["LettersStrokes.js", "LetterFriends.js"]);
  assert.equal(F.look(0), "full");
  assert.equal(F.look(0.3), "full");
  assert.equal(F.look(0.6), "soft");
  assert.equal(F.look(0.9), "plain");
  const css = fs.readFileSync(path.join(root, "styles", "letters-friends.css"), "utf8");
  assert.match(css, /\.lf\.is-plain \.lf-fill \{ stroke: #4a3620; \}/, "plain keeps the letter, in ink");
  assert.match(css, /prefers-reduced-motion: reduce\) \{ \.lf \.lf-dress/);
});

test("v25 Garden Brain: five skills per letter, spaced due-ness, a deterministic walk", () => {
  const now = Date.UTC(2026, 9, 2, 12);
  const ns = load(["LettersStrength.js", "LettersLearning.js", "GardenBrain.js"], { now });
  const brain = new ns.GardenBrain(ns.LettersStrength);
  const s = ns.LettersStrength;
  assert.deepEqual(Object.keys(brain.skills("ب")), ["name", "sound", "write", "friend", "shape"]);
  assert.equal(brain.due("ب", now), 1.2, "never seen sits at a steady 1.2");
  // Practised just now: resting. A long-remembered letter rests longer.
  s.map["ب"] = { r: 3, w: 0, streak: 3, fast: 0, slow: 3, last: now - 86400000 };
  s.map["ت"] = { r: 1, w: 0, streak: 0, fast: 0, slow: 1, last: now - 86400000 };
  assert.ok(brain.due("ب", now) < brain.due("ت", now), "a streak lengthens the rest");
  // Friend evidence moves the friend skill.
  s.recordOutcome({ itemId: "ب", correct: true, evidence: "supported_visible_matching", skill: "friend", sessionId: "a" });
  assert.ok(brain.skills("ب").friend > 0);
  // The walk: same day, same child → same plan; ends with the book.
  const opts = { known: ["ا", "ب", "ت", "ث", "ج"], marks: [], date: "2026-10-02", profile: "p1" };
  const a = brain.planWalk(opts), b = brain.planWalk(opts);
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  assert.ok(a.stops.length >= 4 && a.stops.length <= 6);
  assert.equal(a.stops[a.stops.length - 1].kind, "FriendBook");
  assert.ok(a.stops.some(st => st.kind === "FriendFind"));
  for (const st of a.stops) for (const c of st.letters) assert.ok(opts.known.includes(c), "walks only carry met letters");
  // A little sprout gets three gentle stops, opening with balloons.
  const sprout = brain.planWalk({ ...opts, sprout: true });
  assert.equal(sprout.stops.length, 3);
  assert.equal(sprout.stops[0].kind, "LetterBalloons");
  assert.equal(brain.planWalk({ ...opts, known: [] }), null);
  // Read-only: planning never writes outcomes.
  assert.doesNotMatch(source("GardenBrain.js"), /recordOutcome\(|\.record\(|saveJSON|write\(/);
});

test("v25 friend skill joins the learning policy and can graduate to listening", () => {
  const ns = load(["LettersStrength.js", "LettersLearning.js"]);
  assert.equal(ns.LettersLearning.skillFor({ display: "ب" }, "FriendFind"), "friend");
  for (let i = 0; i < 3; i += 1) ns.LettersStrength.recordOutcome({ itemId: "ب", correct: true, evidence: "supported_visible_matching", skill: "friend", sessionId: `s${i}` });
  const p = ns.LettersLearning.profile({ id: "ب", display: "ب" }, { skill: "friend" });
  assert.equal(p.promptMode, "listen", "three clean matches move friend rounds to listening");
});

test("v26 Find My Friend: honest evidence — matching unless a miss, listening only unassisted", () => {
  const src = source("FriendFind.js");
  assert.match(src, /skill: "friend"/);
  assert.match(src, /const independent = this\.mode === "listen" && !this\.missed;/);
  assert.match(src, /assisted: !!this\.missed/);
  assert.doesNotMatch(src, /spendStars|earnStars|saveJSON/);
  assert.deepEqual(off(src), []);
  const book = source("FriendBook.js");
  assert.doesNotMatch(book, /reportOutcome/, "reading is presentation, not evidence");
  assert.match(book, /measureText/, "first letter measured, never split into a span");
});

test("v25 Today's Walk: planned once a day, stamped not paid, early leaving is fine", () => {
  assert.match(game, /const WALK_KEY = "quran-trainer:letters:walk";/);
  const walk = game.slice(game.indexOf("    todaysWalk() {"), game.indexOf("    renderPracticeGarden() {"));
  assert.match(walk, /saved\.date===today&&saved\.known===known\.length/);
  assert.match(walk, /this\.stampToday\?\.\(\);/);
  assert.doesNotMatch(walk, /earnStars|spendStars/, "no new currency");
  assert.match(walk, /completed\|\|Date\.now\(\)-started>=20000/);
  assert.deepEqual(off(walk), []);
  assert.match(game, /class="map-walk/);
  // State keeps only well-formed walks.
  const ns = load(["LettersDecorations.js", "LettersState.js"]);
  const norm = (v) => ns.LettersState.normalize("quran-trainer:letters:walk", v, null);
  assert.equal(norm({ date: "nope", stops: [] }), null);
  const ok = norm({ date: "2026-10-02", known: 4, stops: [{ kind: "Feed", skill: "name", letters: ["ب"] }, { kind: "Evil", letters: [] }], done: [0, 5, "x"], stamped: true });
  assert.equal(ok.stops.length, 1);
  assert.equal(JSON.stringify(ok.done), "[0]");
});

test("v25/v26 ship: files registered, cache bumped, notes written", () => {
  const html = fs.readFileSync(path.join(root, "letters.html"), "utf8");
  const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  for (const f of ["GardenBrain.js", "LetterFriends.js", "FriendFind.js", "FriendBook.js"]) {
    assert.match(html, new RegExp(`src/letters/${f}\\?v=20261002-v26`));
    assert.match(sw, new RegExp(`"src/letters/${f}"`));
  }
  assert.match(html, /styles\/letters-friends\.css\?v=20261002-v26/);
  assert.match(sw, /"styles\/letters-friends\.css"/);
  assert.match(sw, /const VERSION = "miftah-v99-letter-garden-v26-20261002";/);
  const notes = fs.readFileSync(path.join(root, "docs", "letter-garden", "RELEASES.md"), "utf8");
  for (const v of ["v25", "v26"]) assert.match(notes, new RegExp(`## ${v} `));
});
