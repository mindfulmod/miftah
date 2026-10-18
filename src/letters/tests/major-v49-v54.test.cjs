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
const widths = text => text.split("<").filter(tag => !tag.includes("data-ribbon")).flatMap(tag => [...tag.matchAll(/stroke-width="([\d.]+)"/g)].map(m => m[1])).filter(w => !["1.6", "2.4", "3", "4", "6", "8"].includes(w));
function load(files) {
  const window = { MiftahGame: {} };
  const ctx = vm.createContext({ window, console, Math, JSON, Map, Set, Date, setTimeout, clearTimeout });
  for (const f of files) vm.runInContext(source(f), ctx, { filename: f });
  return window.MiftahGame;
}
const game = source("LettersGame.js");

test("v49 Friend Moves: every one of the 28 friends has its own move, and none under reduced motion", () => {
  const css = read("styles/letters-friends.css");
  const ns = load(["LettersStrokes.js", "LetterFriends.js"]);
  for (const c of ns.LetterFriends.CHARS) assert.match(css, new RegExp(`\\.lf\\.is-wiggle\\[data-friend="${c}"\\][^{]*\\{ animation-name: lf-m-`), `${c} has a move`);
  for (const m of [...css.matchAll(/animation-name: (lf-m-[a-z]+)/g)].map(x => x[1])) assert.match(css, new RegExp(`@keyframes ${m} `), `${m} is defined`);
  assert.match(css, /\.lf\.is-wiggle, \.lf\.is-wiggle \.lf-fill, \.lf\.is-wiggle \.lf-fill-dot \{ animation: none !important; \}/, "reduced motion still stops every move");
  assert.match(game, /svg\._wiggle = setTimeout\(\(\) => svg\.classList\.remove\("is-wiggle"\), 950\);/);
});

test("v50 Smart Choices: new letters get unlike choices, known letters their look-alikes", () => {
  const ns = load(["LettersStrokes.js", "GardenBrain.js"]);
  const B = ns.gardenBrain;
  const pool = ["ت", "ث", "ا", "م", "و", "ه", "ج"];
  B.skills = () => ({ name: 0.9, friend: 0.9, shape: 0.9 });
  assert.deepEqual([...B.others("ب", pool, 2)].sort(), ["ت", "ث"], "a known ب stands beside ت and ث");
  B.skills = () => ({ name: 0 });
  for (let i = 0; i < 10; i++) assert.ok(!B.others("ب", pool, 2).some(c => c === "ت" || c === "ث"), "a new ب never meets its twins");
  B.skills = () => ({ name: 0.9 });
  assert.ok(!B.others("ب", pool, 2, { beginner: true }).some(c => c === "ت" || c === "ث"), "a little sprout always gets the easy choices");
  assert.deepEqual([...B.others("ب", ["ب", "ت"], 3)], ["ت"], "never the answer itself, never more than there is");
  for (const f of ["FriendFind.js", "BookGames.js", "ShadowGames.js", "WorkshopGames.js", "ToyBoxGames.js", "LookGames.js"]) assert.match(source(f), /gardenBrain\?\.others/, `${f} asks the Brain`);
});

test("v51–v52 Looking games: families from the handwriting model; honest, gentle, in the palette", () => {
  const ns = load(["LettersStrokes.js", "LetterFriends.js", "LookGames.js"]);
  assert.deepEqual([...ns.LookGames.KINDS], ["SpotChange", "FamilyBuses"]);
  const fams = ns.LookGames.families(["ث", "ب", "ت", "ج", "ح", "ا"]).map(f => f.join(""));
  assert.ok(fams.includes("بتث") || fams.includes("ثتب") || fams.some(f => [...f].sort().join("") === [..."بتث"].sort().join("")), "ب ت ث are one family");
  assert.ok(fams.some(f => f.length === 2 && f.includes("ج") && f.includes("ح")));
  assert.ok(fams.includes("ا"));
  const src = source("LookGames.js");
  assert.match(src, /const right = this\.report\(`\$\{this\.at\}:\$\{this\.into\}`, ids\[i\], ids, \{ affects: false \}\);/, "spotting a change leans on memory: recorded, never moves strength");
  assert.match(src, /replayPrompt\(\) \{\n\s+if \(this\.phase !== "find" \|\| this\.busy\) return;\n\s+this\.missed = true;/, "look again counts as help");
  assert.match(src, /const into = \(!this\.ctx\.beginner && shuffle\(sibsOf\(was\)\)\[0\]\)/, "older children see a dot change");
  assert.match(src, /this\.rounds = ctx\.beginner \? 3 : 4;/);
  assert.deepEqual(off(src), []);
  assert.deepEqual(widths(src), []);
  const bonus = game.slice(game.indexOf("    chapterBonus(world) {"), game.indexOf("    finishWorld() {"));
  assert.match(bonus, /"join-1": \["FamilyBuses", "LetterShadows"\], "join-2": \["SpotChange", "SameLetter"\],/);
  assert.match(bonus, /const pick = \(this\.progress\?\.done \|\| \[\]\)\.includes\(world\.id\) \? list\[Math\.floor\(Math\.random\(\) \* list\.length\)\] : list\[0\];/, "first run meets the new stop; replays take turns");
  assert.match(source("LettersState.js"), /\|SpotChange\|FamilyBuses\)\$\//);
  assert.match(read("letters.html"), /src\/letters\/LookGames\.js\?v=/);
  assert.match(read("sw.js"), /"src\/letters\/LookGames\.js",/);
});

test("v53 Big screens: games grow into the stage, never shrink, never overflow", () => {
  const fit = game.slice(game.indexOf("    fitStage(stage){"), game.indexOf("    gardenReward("));
  assert.match(fit, /if\(window\.innerWidth<700\|\|window\.innerHeight<560\)\{root\.style\.zoom='';/, "phones are untouched");
  assert.match(fit, /Math\.max\(0\.72,Math\.min\(1\.4,\(stage\.clientHeight\*0\.97\)\/h\)\),floor=Math\.min\(1,next\);/, "1× to 1.4×, or down to 0.72× only when the game itself is taller than the stage (v58)");
  assert.match(fit, /root\.style\.width=`\$\{\(100\/v\)\.toFixed\(2\)\}%`/, "the root's width is divided by the zoom");
  assert.match(fit, /const overY=stage\.scrollHeight-stage\.clientHeight,overX=stage\.scrollWidth-stage\.clientWidth;/, "real overflow is checked and corrected");
  assert.match(game, /this\.fitStage\(ctx\.stage\);\n\s+this\.keepFocus\(ctx\.stage\);/);
});

test("v54 Keyboard and switch access: tracing, colouring and focus", () => {
  const strokes = source("LettersStrokes.js");
  assert.match(strokes, /svg\.setAttribute\("tabindex", "0"\);\n\s+svg\.setAttribute\("role", "button"\);/);
  assert.match(strokes, /if \(!alive \|\| !part \|\| svg\.classList\.contains\("is-demo"\)\) return;\n\s+onSnap\?\.\(\);/, "a keyboard stroke is a helped stroke");
  assert.match(source("ToyBoxGames.js"), /el\.setAttribute\("tabindex", "0"\); el\.setAttribute\("role", "button"\);/, "every colouring part is reachable");
  assert.match(game, /if\(a&&a!==document\.body&&a\.isConnected\)return;/, "focus is only moved when it was lost");
  const css = read("styles/letters-toybox.css");
  assert.match(css, /\.lg-app svg\.trace-guided:focus-visible \{ outline: 4px solid var\(--lg-focus\);/);
  assert.deepEqual(off(css), []);
});
