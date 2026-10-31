const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../../..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");
const plain = (value) => JSON.parse(JSON.stringify(value));

function loadWorlds(seed = 1) {
  let state = seed >>> 0;
  const math = Object.create(Math);
  math.random = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const window = { MiftahGame: {} };
  const context = { window, Math: math, AbortController, setTimeout, clearTimeout };
  vm.runInNewContext(source("src/data/letters.js"), context);
  vm.runInNewContext(source("src/letters/LettersBoot.js"), context);
  vm.runInNewContext(source("src/letters/LettersWorlds.js"), context);
  return new window.MiftahGame.LettersWorlds();
}

const visualize = (worlds, done) => worlds.checkupPlan(done)?.find((entry) => entry.skill === "visualize");
const packs = (worlds) => worlds.data.packs.map((pack) => `pack-${pack.id}`);

test("join-1 unlocks one sampled joining form for each eligible completed-pack letter", () => {
  const expected = ["ب", "ت", "ث", "ج", "ح", "خ", "س", "ش", "ص", "ض"];
  const worlds = loadWorlds();
  const items = visualize(worlds, [...packs(worlds), "join-1"]).items;
  assert.deepEqual(plain(items.map((item) => item.id).sort()), expected);
  assert.equal(new Set(items.map((item) => item.id)).size, expected.length);
  assert.ok(items.every((item) => ["initial", "medial", "final"].includes(item.formPosition)));
});

test("join-2 adds its later family and supports all eligible positions across deterministic samples", () => {
  const expected = ["ب", "ت", "ث", "ج", "ح", "خ", "س", "ش", "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه", "ي"];
  const allPositions = new Map(expected.map((id) => [id, new Set()]));
  for (let seed = 1; seed <= 160; seed += 1) {
    const worlds = loadWorlds(seed);
    const items = visualize(worlds, [...packs(worlds), "join-1", "join-2"]).items;
    assert.deepEqual(plain(items.map((item) => item.id).sort()), expected);
    for (const item of items) allPositions.get(item.id).add(item.formPosition);
  }
  for (const id of expected) {
    const expectedPositions = id === "ي" ? ["initial", "final"] : ["initial", "medial", "final"];
    assert.deepEqual([...allPositions.get(id)].sort(), expectedPositions.sort(), id);
  }
});

test("visualize omits joining forms without completed joining lessons or known packs", () => {
  const worlds = loadWorlds();
  assert.equal(visualize(worlds, ["pack-little"]), undefined);
  assert.equal(visualize(worlds, ["pack-little", "forms-1"]), undefined);
  assert.equal(visualize(worlds, ["pack-little", "join-1"]), undefined);
  assert.equal(visualize(worlds, ["join-1"]), undefined);
  assert.equal(visualize(worlds, ["pack-little", "pack-strong", "join-1"]), undefined);
  assert.equal(visualize(worlds, [...packs(worlds), "forms-1"]), undefined);
});

test("form checkup items carry source metadata and leave progress and catalogues untouched", () => {
  const worlds = loadWorlds(9);
  const beforeCatalogues = plain(worlds.worlds.map((world) => world.catalogueItems()));
  const done = [...packs(worlds), "join-1", "join-2"];
  const doneBeforeCall = [...done];
  const items = visualize(worlds, done).items;
  const letters = new Map(worlds.letters.map((letter) => [letter.char, letter]));
  const firstFamily = new Set(["ب", "ت", "ث", "ج", "ح", "خ", "س", "ش", "ص", "ض"]);
  assert.ok(items.every((item) => {
    const letter = letters.get(item.id);
    const expectedDisplay = item.formPosition === "initial" ? `${item.id}ـ`
      : item.formPosition === "medial" ? `ـ${item.id}ـ`
        : item.formPosition === "final" ? `ـ${item.id}` : null;
    return item.display === expectedDisplay && item.promptDisplay === item.id && item.speak === letter.arName
      && item.objective === "letter-form" && item.worldId === (firstFamily.has(item.id) ? "join-1" : "join-2")
      && plain(item.prerequisiteWorldIds).join() === item.worldId;
  }));
  assert.deepEqual(plain(worlds.worlds.map((world) => world.catalogueItems())), beforeCatalogues);
  assert.deepEqual(done, doneBeforeCall);
});

test("a sparse one-letter source cannot create a self-answering forms check", () => {
  const worlds = loadWorlds();
  const boat = worlds.data.packs.find(pack => pack.id === "boat");
  boat.letters = boat.letters.filter(letter => letter.char === "ب");
  const plan = worlds.checkupPlan(["pack-boat", "join-1"]);
  assert.equal(plan.some(step => step.skill === "visualize"), false);
  assert.deepEqual(plain(plan.map(step => step.skill)), ["identify", "memorize", "write"]);
});

test("existing checkup skill order and vowel blend content stay unchanged", () => {
  const worlds = loadWorlds(27);
  const plan = worlds.checkupPlan([...packs(worlds), "join-1", "fatha"]);
  assert.deepEqual(plain(plan.map((entry) => entry.skill)), ["identify", "memorize", "visualize", "blend", "write"]);
  const blend = plan.find((entry) => entry.skill === "blend");
  assert.ok(blend.items.length > 0);
  assert.ok(blend.items.every((item) => item.id.endsWith("َ")));

  const withKasraDamma = worlds.checkupPlan([...packs(worlds), "join-1", "fatha", "kasra-damma"]);
  assert.deepEqual(plain(withKasraDamma.map((entry) => entry.skill)), ["identify", "memorize", "visualize", "blend", "write"]);
  const marks = new Set(withKasraDamma.find((entry) => entry.skill === "blend").items.map((item) => item.id.slice(-1)));
  assert.deepEqual([...marks].sort(), ["َ", "ُ", "ِ"].sort());
});
