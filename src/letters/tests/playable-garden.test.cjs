const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

function runtime() {
  const window = { MiftahGame: { LettersArt: { icon: () => "<svg></svg>" } } };
  const context = { window, document: { body: { classList: { toggle() {} } } }, setTimeout, clearTimeout };
  for (const file of ["LettersGardenArt.js", "LettersJourney.js", "LettersDecorations.js", "LettersState.js"]) vm.runInNewContext(source(file), context);
  return window.MiftahGame;
}
const png = "data:image/png;base64,iVBORw0KGgo=";

test("finished chapters and saved drawings become garden decorations; nothing else is granted", () => {
  const ns = runtime();
  const none = ns.LettersDecorations.catalog({ progress: { done: [] } });
  assert.equal(none.filter(item => item.kind === "keepsake" || item.kind === "sign").length, 0);
  const items = ns.LettersDecorations.catalog({ progress: { done: ["pack-boat", "pack-smile", "tanween"] }, savedDrawings: { "ب": png, "ت": "javascript:alert(1)" } });
  assert.deepEqual(Array.from(items.filter(i => i.kind === "keepsake"), i => i.id), ["keepsake:pack-smile", "keepsake:tanween"], "Boat's keepsake stays in its boat");
  assert.deepEqual(Array.from(items.filter(i => i.kind === "sign"), i => i.id), ["sign:ب"], "only real drawings become signs");
});

test("saved drawings are validated and capped", () => {
  const ns = runtime();
  const state = source("LettersState.js");
  assert.match(state, /if \(name === "drawings"\)/);
  assert.match(state, /url\.length <= 60000/);
  assert.match(state, /\.slice\(-8\)/);
  const game = source("LettersGame.js");
  assert.match(game, /this\.savedDrawings = Object\.fromEntries\(Object\.entries\(kept\)\.slice\(-8\)\);/);
});

test("playing with a placed toy never changes the layout or ownership", () => {
  const code = source("DecoratingGarden.js");
  const play = code.slice(code.indexOf("playToy(i,item){"), code.indexOf("wireDrag(button,idOf){"));
  assert.doesNotMatch(play, /commit\(|save\(|onChange|place\(|(?<!classList\.)remove\(/, "play is presentation only");
  assert.match(code, /this\.selected=id;this\.selectedSlot=i;this\.paint\(\);\s*this\.playToy\(i,this\.items\.get\(id\)\);/, "the toy animates the art that stays on screen");
  assert.match(code, /this\.rig=ctx\.petRig\?\.\(this\.pet\);/);
});

test("tapping one toy after another plays them and never swaps them", () => {
  const code = source("DecoratingGarden.js");
  assert.match(code, /if\(this\.selected&&!\(id&&this\.selectedSlot!==null\)\)\{this\.place\(i,this\.selected\);return;\}/);
});

test("the picnic blanket and watering can come from finished stories, not a new currency", () => {
  const ns = runtime();
  const ids = done => Array.from(ns.LettersDecorations.catalog({ progress: { done } }), item => item.id);
  assert.ok(!ids([]).includes("blanket") && !ids([]).includes("can"));
  assert.ok(ids(["pack-boat"]).includes("blanket"), "a picnic chapter brings the blanket");
  assert.ok(!ids(["pack-boat"]).includes("can"));
  assert.ok(ids(["pack-smile"]).includes("can"), "a seed-bed chapter brings the watering can");
  const code = source("DecoratingGarden.js");
  assert.match(code, /item\.kind==='blanket'/); assert.match(code, /item\.kind==='can'/);
  assert.match(code, /this\.petHome\(\);this\.save\(\);this\.react\(reaction\);/, "rearranging the garden calls the pet home");
  assert.match(code, /destroy\(\)\{this\.alive=false;this\.clearToys\(\);/, "leaving clears every toy timer and drop");
});

test("the pet's map spot is saved as a plain chapter id and read back safely", () => {
  const ns = runtime();
  const store = new Map();
  const context = { window: { MiftahGame: ns }, localStorage: { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k) } };
  vm.runInNewContext(source("LettersState.js"), context);
  const key = "quran-trainer:letters:map-pet";
  store.set(key, JSON.stringify("kasra-damma"));
  assert.equal(ns.LettersState.read(key, null), "kasra-damma");
  store.set(key, JSON.stringify("<img onerror=x>"));
  assert.equal(ns.LettersState.read(key, null), null, "anything but a chapter id is dropped");
  const game = source("LettersGame.js");
  assert.match(game, /this\.mapPetWorld = this\.loadJSON\("quran-trainer:letters:map-pet", null\);/);
  assert.match(game, /this\.saveJSON\("quran-trainer:letters:map-pet", world\.id\);/);
  assert.match(game, /visitedI >= 0 && this\.statusOf\(worlds\[visitedI\]\) !== "locked" \? visitedI : currentI/, "a locked or missing chapter falls back to the current one");
});

test("the boat ride is decoration: the pet hops in, both sail by the same pixels, then it walks home", () => {
  const code = source("DecoratingGarden.js");
  const play = code.slice(code.indexOf("playToy(i,item){"), code.indexOf("wireDrag(button,idOf){"));
  assert.match(play, /item\.kind==='boat'&&!reduced&&measurable/);
  assert.match(play, /translate:`\$\{seat\.x\+dx\*w\}px/, "the pet follows the boat's own offsets");
  assert.match(play, /this\.later\(\(\)=>\{this\.pet\.classList\.remove\('is-riding'\);this\.petTo\(0,0,800\);\},3500\);/);
});
