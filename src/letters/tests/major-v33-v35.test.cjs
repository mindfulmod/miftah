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
  assert.match(src, /this\.mode = desired;/, "each round chooses a mode backed by real eligible syllable pairs");
  assert.match(src, /planItems\(ctx, playable, "syllable", 5\)/, "Hat Shop plans only pairable taught syllables");
  assert.match(src, /this\.promptMode === "listen" \? " hidden/, "listen rounds hide the visible reference until support is needed");
  assert.match(src, /skill: "syllable"/);
  assert.match(src, /assisted: !independent/);
  assert.match(src, /ns\.GardenPractice\.draggable/);
  assert.doesNotMatch(src, /spendStars|earnStars|saveJSON/);
  assert.match(game, /fatha: "HatShop", "kasra-damma": "HatShop", tanween: "HatShop",/);
});

test("v34 Letter Workshop: body then dots use the form profile; pictures never give the answer", () => {
  const src = source("WorkshopGames.js");
  assert.match(src, /this\.profile = practiceProfile\(this\.ctx, c, "letter-form"\);/);
  assert.match(src, /this\.step = this\.level === 0 && dotsOf\(c\)\.length \? "dots" : "body";/, "shape support sets the first visible step");
  assert.match(src, /evidence: "supported_visible_matching", assisted: !!this\.missed, affectsStrength: true/, "form construction stays in supported matching evidence");
  assert.doesNotMatch(src, /independent_listening/);
  assert.doesNotMatch(src, /art: F\(\)\.art[^\n]+replace/, "visible matching keeps the fallback friend whole, without floating features");
  assert.match(src, /while \(cut < chars\.length && \/\[ًٌٍَُِّْٰ\]\/\.test\(chars\[cut\]\)\) cut \+= 1;/, "the gap takes the letter's marks with it");
  assert.doesNotMatch(src, /spendStars|earnStars|saveJSON/);
  assert.deepEqual(off(src), []);
  assert.match(game, /\['BuildLetter',2,/);
  assert.match(game, /\['FillGap',2,/);
});

test("v35 Syllables: the Sand Table writes letter + mark; Echo Parade sings syllables; long-vowel stops", () => {
  const sand = source("SandTable.js");
  assert.match(sand, /const syllables = eligible\(\[\.\.\.\(ctx\.items \|\| \[\]\), \.\.\.\(ctx\.syllables \|\| \[\]\)\], ctx\)/, "syllables are selected from taught curriculum items");
  assert.match(sand, /\.filter\(i => \[\.\.\.i\.display\]\.length > 1 && !i\.display\.startsWith\('ا'\)\)/, "only real non-alif-starting syllables can return");
  assert.match(sand, /const marked = planned\(ctx, syllables, 1\)\[0\];/, "the syllable keeps its curriculum item identity");
  assert.match(sand, /motor\.r >= 10 && motor\.streak >= 4 && visits >= 4/, "memory requires sustained motor evidence");
  const echo = source("PuzzleGames.js");
  assert.match(echo, /this\.syllables = syl\.length >= 2;/);
  assert.match(echo, /const skill = this\.syllables \? "syllable" : "letter-name";/, "the answer keeps the letter or syllable skill");
  assert.match(echo, /profiles\.every\(\(p\) => p\.promptMode === "listen"\)/, "every item in the sequence must permit listening before the singers hide");
  assert.match(echo, /if \(!heard\)[\s\S]*?this\.promptMode = "match"[\s\S]*?display\?\.classList\.remove\("is-hidden"\)/, "unverified playback reveals the visible reference");
  assert.match(game, /standing: "EchoParade", "long-sounds": "EchoParade", leen: "EchoParade",/);
  assert.match(game, /marks:kind==='SoundLab'\|\|kind==='HatShop'\|\|kind==='SandTable'\?this\.taughtMarks\(\):undefined,/);
  const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  for (const f of ["VowelGames.js", "WorkshopGames.js"]) assert.match(sw, new RegExp(`"src/letters/${f}"`));
  const notes = fs.readFileSync(path.join(root, "docs", "letter-garden", "RELEASES.md"), "utf8");
  for (const v of ["v33", "v34", "v35"]) assert.match(notes, new RegExp(`## ${v} `));
});
