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

test("v36 Twin Crown: crowns come off or go on only where they can sit", () => {
  const ns = load(["WordGames.js"]);
  const twin = ns.GardenPractice.TwinCrown.prototype.twin;
  assert.equal(twin("رَبَّ"), "رَبَ");
  assert.equal(twin("أَحَدٌ"), "أَحَّدٌ".normalize("NFC"));
  assert.equal(twin("لَآ"), "لَّآ".normalize("NFC"), "never on the alif");
  assert.deepEqual([...ns.WordGames.clusters("رَبَّ")], ["رَ", "بَّ"]);
  const src = source("WordGames.js");
  assert.match(src, /const without = shuffle\(pool\.filter\(\(w\) => !w\.display\.includes\(SHADDA\) && w\.audioPath && this\.twin\(w\.display\)\)\);/, "uncrowned answers are real recited words");
  assert.match(game, /shaddah: "TwinCrown", "shaddah-mix": "TwinCrown", "words-2": "ListenFind", decode: "WordGap", "decode-4": "ListenFind",/);
});

test("v37 word games: real recitation, honest reading evidence, joins kept around the gap", () => {
  const src = source("WordGames.js");
  assert.match(src, /const recited = \(w\) => w\?\.display && w\.audioPath;/, "Listen & Find only uses words Alafasy recites");
  assert.match(src, /"word-reading"/);
  assert.match(src, /const pre = prefix && !NONJOIN\.has\(cl\[k - 1\]\[0\]\) \? `\$\{prefix\}ـ` : prefix;/);
  assert.match(src, /!\["ا", "أ", "إ", "آ", "ٱ", "ى", "ة"\]\.includes\(c\)/, "no vowel on an alif distractor");
  assert.doesNotMatch(src, /spendStars|earnStars|saveJSON/);
  assert.deepEqual(off(src), []);
  assert.match(game, /words:ns\.WordGames\?\.KINDS\?\.includes\(kind\)\?this\.shelfWords\(\):undefined,/);
  assert.match(source("GardenBrain.js"), /\.\.\.\(reader \? \["ListenFind", "ListenFind", "WordGap"\] : \[\]\)/);
  const css = fs.readFileSync(path.join(root, "styles", "letters-friends.css"), "utf8");
  assert.match(css, /\.wd \.wd-piece \{/, "piece size beats the button reset");
});

test("v38 Living Friends: eyes blink, calm friends breathe, a tap wiggles and lights the letter", () => {
  const F = source("LetterFriends.js");
  assert.match(F, /const eye = \(x, y, r = 1\.8\) => `<circle class="lf-eye"/);
  assert.match(F, /id: "sheep"[\s\S]*?puffs\.map\(\(\[x, y\]\) => `<circle cx="\$\{x\}" cy="\$\{y\}" r="11\.5" fill="\$\{INK\}"\/>`\)/, "the sheep's wool is one clean cloud");
  assert.deepEqual(off(F), []);
  const css = fs.readFileSync(path.join(root, "styles", "letters-friends.css"), "utf8");
  for (const k of ["lf-blink", "lf-breathe", "lf-wiggle", "lf-glow"]) assert.match(css, new RegExp(`@keyframes ${k}`));
  assert.match(css, /prefers-reduced-motion: reduce\) \{ \.lf \.lf-eye/);
  assert.match(game, /initFriendLife\(\) \{/);
  assert.match(game, /if \(this\.prefersReducedMotion\(\)\) return;\n\s*const host = e\.target\?\.closest\?\.\("button"\);/);
  const notes = fs.readFileSync(path.join(root, "docs", "letter-garden", "RELEASES.md"), "utf8");
  for (const v of ["v36", "v37", "v38"]) assert.match(notes, new RegExp(`## ${v} `));
});
