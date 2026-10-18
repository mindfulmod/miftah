const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..", "..", "..");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const palette = (() => {
  const art = read("ART.md");
  return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()));
})();
const off = text => (text.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h));
// Off-scale stroke widths (a data-ribbon path is exempt, as in check-palette).
const widths = text => text.split("<").filter(tag => !tag.includes("data-ribbon")).flatMap(tag => [...tag.matchAll(/stroke-width="([\d.]+)"/g)].map(m => m[1])).filter(w => !["1.6", "2.4", "3", "4", "6", "8"].includes(w));
function load(files) {
  const window = { MiftahGame: {} };
  const ctx = vm.createContext({ window, console, Math, JSON, Map, Set, setTimeout, clearTimeout });
  for (const f of files) vm.runInContext(source(f), ctx, { filename: f });
  return window.MiftahGame;
}
const game = source("LettersGame.js");
const toy = source("ToyBoxGames.js");
const KINDS = ["FriendPairs", "DotNests", "FriendJigsaw", "BathTime", "LetterFishing", "ColourFriend"];

test("v39 Art pass: the weak friends are redrawn, in the palette", () => {
  const ns = load(["LettersStrokes.js", "LetterFriends.js"]);
  const F = ns.LetterFriends;
  assert.equal(F.FRIENDS["ن"].fill, "#f3c955", "the bee's bowl is a yellow striped bee, not a pink cup on a stem");
  assert.doesNotMatch(F.FRIENDS["ن"].back, /M52 78V99/, "no flower stem under the bee");
  assert.match(F.FRIENDS["و"].front, /d="M58 56Q64 66 52 76Q40 84 26 80" fill="none" stroke="#7fce54" stroke-width="8"/, "the rose's tail is its green stem");
  assert.match(F.FRIENDS["ل"].back, /fill="#f3c955"/, "a real yellow lemon");
  assert.doesNotMatch(F.FRIENDS["ح"].front, /M35 21l-2-7M43 19l-1-7/, "the horse's comb of spikes became a mane");
  assert.doesNotMatch(F.FRIENDS["ت"].back, /M0 48H100V90/, "the crocodile's pond is no longer a hard box");
  const src = source("LetterFriends.js");
  assert.deepEqual(off(src), []);
  assert.deepEqual(widths(src), []);
});

test("v40 Game quality: replay buttons always do something, Busy Market never strands a lens", () => {
  const book = source("BookGames.js"), puzzle = source("PuzzleGames.js");
  assert.match(book, /left\(c\) \{ return this\.goods\.filter/, "finished lenses are tracked by what is left");
  assert.match(book, /if \(this\.lenses\.every\(\(l\) => !this\.left\(l\)\)\)/, "the market ends when every lens is finished");
  assert.match(book, /if \(!manual\) for \(let step = 0; step < n && !this\.left\(this\.lenses\[k\]\); step \+= 1\)/, "auto-advance skips empty lenses");
  for (const cls of ["HoopoeTrip", "FriendShapes", "BusyMarket"]) {
    const body = book.slice(book.indexOf(`class ${cls}`), book.indexOf("class ", book.indexOf(`class ${cls}`) + 6) > 0 ? book.indexOf("class ", book.indexOf(`class ${cls}`) + 6) : undefined);
    assert.match(body, /replayPrompt\(\) \{ [^}]/, `${cls} replays its question`);
  }
  assert.match(puzzle, /replayPrompt\(\) \{ if \(!this\.busy && this\.order\?\.\[this\.at\]\) \{ this\.missed = true;/, "the train's hint marks the ride as helped");
  assert.match(puzzle, /super\(ctx, "pz-dots", "Dots last"\);\n\s+this\.noReplay = true;/);
  assert.match(puzzle, /super\(ctx, "pz-same", "Same letter"\);\n\s+this\.noReplay = true;/);
  assert.match(game, /if\(this\.game\?\.noReplay\)replay\.hidden=true;/, "seeing games hide the replay button");
});

test("v41 Polish: still hints, centred lone tiles, gentle round fades, a buzz on right answers", () => {
  const css = read("styles/letters-friends.css");
  assert.match(css, /:is\(\.ff, \.bk, \.pz, \.vh, \.ws, \.wd, \.sh, \.tb\) \.is-hint \{ box-shadow: 0 0 0 5px #f3c955/, "a hint shows even with motion reduced");
  assert.match(css, /button:last-child:nth-child\(3n\+1\) \{ grid-column: 2; \}/);
  assert.match(css, /button:last-child:nth-child\(odd\) \{ grid-column: 1 \/ -1; justify-self: center;/);
  assert.match(css, /:where\(\.lg-app :is\(\.ff, \.bk, \.pz, \.vh, \.ws, \.wd, \.sh, \.tb\) > \*\) \{ animation: lg-round-in \.28s ease-out backwards; \}/, "zero-specificity, opacity-only fade");
  assert.match(css, /@keyframes lg-round-in \{ from \{ opacity: 0; \} to \{ opacity: 1; \} \}/);
  assert.match(game, /correct:\(\)=>this\.sound\.play\('correct'\),/, "a right answer is felt through the correct cue's haptic");
  assert.deepEqual(off(css), []);
});

test("v42–v47 Toy Box: dot sides and counts read from the handwriting model", () => {
  const ns = load(["LettersStrokes.js", "LetterFriends.js", "ToyBoxGames.js"]);
  const T = ns.ToyBoxGames;
  assert.deepEqual([...T.KINDS], KINDS);
  for (const k of KINDS) assert.equal(typeof ns.GardenPractice[k], "function", k);
  assert.equal(T.sideOf("ب"), "below");
  assert.equal(T.sideOf("ي"), "below");
  assert.equal(T.sideOf("ن"), "above");
  assert.equal(T.sideOf("ق"), "above");
  assert.equal(T.sideOf("ج"), null, "ج keeps its dot inside the bowl, so it never plays where");
  assert.equal(T.sideOf("ا"), null);
  assert.deepEqual(["ا", "ب", "ت", "ث"].map(c => T.dotsOf(c).length), [0, 1, 2, 3]);
});

test("v42–v47 Toy Box: honest evidence, no timers, sprout-gentle, in the palette", () => {
  assert.match(toy, /played\(c, skill = "friend"\) \{[\s\S]*?affectsStrength: false/, "memory and puzzle play never claim letter knowledge");
  for (const cls of ["FriendPairs", "FriendJigsaw", "ColourFriend"]) {
    const body = toy.slice(toy.indexOf(`class ${cls}`), toy.indexOf("\n  }\n", toy.indexOf(`class ${cls}`)));
    assert.doesNotMatch(body, /this\.report\(/, `${cls} only records participation`);
  }
  assert.match(toy, /const right = this\.report\(this\.target, c, \[\.\.\.new Set\(this\.fish\)\], \{ listening: true \}\);/, "fishing is a listening question");
  assert.match(toy, /if \(1 - this\.mud\.children\.length \/ this\.total > 0\.8\) this\.missed = true;/, "a guess from a nearly clean friend is assisted");
  assert.match(toy, /this\.boards = ctx\.beginner \? 1 : 2;/);
  assert.match(toy, /this\.n = ctx\.beginner \? 2 : 4;/, "a little sprout's jigsaw has two halves");
  assert.match(toy, /this\.ask = !ctx\.beginner && this\.known\.length >= 2;/, "a little sprout just scrubs and hears");
  assert.doesNotMatch(toy, /countdown|timer\s*=|timeLeft/i);
  assert.deepEqual(off(toy), []);
  assert.deepEqual(widths(toy), []);
  const css = read("styles/letters-toybox.css");
  assert.deepEqual(off(css), []);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.tb-fish, \.tb-fish-body \{ animation: none; \}/, "fish hold still when motion is reduced");
  assert.match(css, /\.tb button:focus-visible \{ outline: 4px solid var\(--lg-focus\); outline-offset: 3px; \}/);
  assert.match(css, /\.tb-piece svg\.lf, \.tb-slot svg\.lf \{ overflow: hidden; \}/, "pieces are cut, not whole friends");
});

test("v48 World integration: the toys are on the journey, the walk, the garden and the shell", () => {
  const bonus = game.slice(game.indexOf("    chapterBonus(world) {"), game.indexOf("    finishWorld() {"));
  for (const [id, kind] of [["pack-boat", "FriendFind"], ["pack-little", "FriendPairs"], ["pack-wave", "DotNests"], ["pack-tall", "FriendJigsaw"], ["pack-strong", "LetterFishing"], ["pack-round", "BathTime"]])
    assert.match(bonus, new RegExp(`"${id}": "${kind}"`));
  assert.match(bonus, /if \(pick === "DotNests" && new Set\(letters\.map/, "Dot Nests only where the chapter's letters differ in dots");
  assert.match(game, /\.\.\.\(ns\.ToyBoxGames\?\.KINDS\|\|\[\]\).*?\]\.includes\(kind\)\)return back\?\.\(\);/);
  assert.match(game, /ns\.ToyBoxGames\?\.KINDS\?\.includes\(kind\)(\|\|ns\.LookGames\?\.KINDS\?\.includes\(kind\))?\?`toy-\$\{kind\.toLowerCase\(\)\}`/);
  for (const k of KINDS) {
    assert.match(game, new RegExp(`${k}:'`), `${k} has a tile label`);
    assert.match(source("LettersGardenArt.js"), new RegExp(`kind==='${k}'`), `${k} has tile art`);
  }
  assert.match(source("LettersState.js"), /\|FriendPairs\|DotNests\|FriendJigsaw\|BathTime\|LetterFishing\|ColourFriend[|)]/);
  const brain = source("GardenBrain.js");
  for (const k of ["FriendPairs", "FriendJigsaw", "BathTime", "LetterFishing", "DotNests"]) assert.match(brain, new RegExp(`"${k}"`), `${k} can appear on Today's Walk`);
  const html = read("letters.html"), sw = read("sw.js");
  assert.match(html, /src\/letters\/ToyBoxGames\.js\?v=2026\d{4}-v\d+/);
  assert.match(html, /styles\/letters-toybox\.css\?v=2026\d{4}-v\d+[\s\S]*styles\/letters-landscape\.css/, "landscape stays last");
  assert.match(sw, /"src\/letters\/ToyBoxGames\.js",/);
  assert.match(sw, /"styles\/letters-toybox\.css",/);
  assert.match(sw, /const VERSION = "miftah-v[1-9]\d\d-letter-garden-v\d+-2026\d{4}";/);
});
