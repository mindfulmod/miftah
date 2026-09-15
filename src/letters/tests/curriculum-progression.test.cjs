const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../../..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");
const plain = (value) => JSON.parse(JSON.stringify(value));

function loadWorlds(strength) {
  const window = { MiftahGame: strength ? { LettersStrength: strength } : {} };
  const context = {
    window, AbortController, setTimeout, clearTimeout,
    fetch: async (url) => {
      const number = Number(String(url).match(/surah-(\d+)\.json$/)?.[1]);
      const file = path.join(root, "data", `surah-${number}.json`);
      return fs.existsSync(file)
        ? { ok: true, json: async () => JSON.parse(fs.readFileSync(file, "utf8")) }
        : { ok: false, status: 404 };
    },
  };
  vm.runInNewContext(source("src/data/letters.js"), context);
  vm.runInNewContext(source("src/letters/LettersBoot.js"), context);
  vm.runInNewContext(source("src/letters/LettersWorlds.js"), context);
  return new window.MiftahGame.LettersWorlds();
}

const expectedIds = [
  "pack-boat", "pack-smile", "pack-little", "pack-wave", "pack-tall", "pack-strong", "pack-round",
  "join-1", "join-2", "muqattaat", "fatha", "kasra-damma", "tanween", "standing",
  "long-sounds", "leen", "sukoon", "shaddah", "shaddah-mix", "words-2", "decode", "decode-4",
];

test("the 22 chapter boundaries form one explicit, eligible progression", async () => {
  const worlds = loadWorlds();
  await worlds.loadWords();
  assert.deepEqual(plain(worlds.worlds.map((world) => world.id)), expectedIds);

  for (const [index, world] of worlds.worlds.entries()) {
    assert.deepEqual(plain(world.prerequisiteWorldIds), index ? [expectedIds[index - 1]] : []);
    assert.ok(["letter-name", "sequence-recognition", "syllable", "word-reading"].includes(world.objective));
    const available = new Set(expectedIds.slice(0, index));
    for (const item of world.catalogueItems()) {
      assert.ok(item.objective, `${world.id}:${item.id} needs an objective`);
      assert.ok(item.prerequisiteWorldIds.every((id) => available.has(id)),
        `${world.id}:${item.id} reaches past its chapter boundary`);
    }
  }
});

test("letter-pack distractors come only from completed earlier packs", () => {
  const worlds = loadWorlds();
  const smile = worlds.worlds.find((world) => world.id === "pack-smile");
  const wave = worlds.worlds.find((world) => world.id === "pack-wave");
  assert.deepEqual(plain(smile.extraItems()), []);
  assert.deepEqual(plain(smile.extraItems(["pack-smile"])), []);
  assert.deepEqual(plain(smile.extraItems(["pack-boat"])).map((item) => item.id), ["ا", "ب", "ت", "ث"]);
  assert.deepEqual(plain(wave.extraItems(["pack-boat", "pack-little"])).map((item) => item.id),
    ["ا", "ب", "ت", "ث", "د", "ذ", "ر", "ز"]);
});

test("canonical catalogues stay complete while lesson targets may be sampled", () => {
  const worlds = loadWorlds();
  const fatha = worlds.worlds.find((world) => world.id === "fatha");
  const standing = worlds.worlds.find((world) => world.id === "standing");
  const fathaIds = plain(fatha.catalogueItems().map((item) => item.id));
  const standingIds = plain(standing.catalogueItems().map((item) => item.id));
  assert.equal(fathaIds.length, 27);
  assert.equal(standingIds.length, 81);
  assert.equal(fatha.items().length, 6);
  assert.equal(standing.items().length, 18);
  assert.deepEqual(plain(fatha.catalogueItems().map((item) => item.id)), fathaIds);
  assert.deepEqual(plain(standing.catalogueItems().map((item) => item.id)), standingIds);
  assert.ok(fatha.items().every((item) => fathaIds.includes(item.id)));
  assert.ok(standing.items().every((item) => standingIds.includes(item.id)));
});

test("word bands never fall back and reject untaught or unsupported spelling features", async () => {
  const worlds = loadWorlds();
  worlds.examplePool = [
    { id: "هُوَ", display: "هُوَ", speak: "", skel: "هو" },
    { id: "كِتَاب", display: "كِتَاب", speak: "", skel: "كتاب" },
    { id: "رَبّ", display: "رَبّ", speak: "", skel: "رب" },
    { id: "ءب", display: "ءب", speak: "", skel: "ءب" },
    { id: "بۖت", display: "بۖت", speak: "", skel: "بت" },
  ];
  assert.deepEqual(plain(worlds.wordPool(2, 2, ["kasra-damma"])).map((item) => item.id), ["هُوَ"]);
  assert.deepEqual(plain(worlds.wordPool(2, 2, ["fatha"])), []);
  assert.deepEqual(plain(worlds.wordPool(3, 3, expectedIds)), []);
  assert.deepEqual(plain(worlds.wordPool(4, 5, expectedIds)).map((item) => item.id), ["كِتَاب"]);

  worlds.examplePool = [];
  await worlds.loadWords();
  for (const world of worlds.worlds.filter((entry) => entry.kind === "words")) {
    const [min, max] = world.wordBand;
    assert.ok(world.catalogueItems().length > 0, `${world.id} should retain valid real-word content`);
    assert.ok(world.catalogueItems().every((item) => item.wordLength >= min && item.wordLength <= max));
    assert.ok(world.catalogueItems().every((item) => item.valid && item.audioPath));
  }
});

test("sukoon and shaddah practice reuses reviewed curriculum examples", () => {
  const worlds = loadWorlds();
  for (const id of ["sukoon", "shaddah", "shaddah-mix"]) {
    const world = worlds.worlds.find((entry) => entry.id === id);
    const meet = new Set(world.meet.map((item) => item.display));
    assert.ok(world.catalogueItems().every((item) => meet.has(item.display)));
  }
});

test("daily planning is read-only, bounded, and rotates only learned mechanics", () => {
  let reviewCalls = 0;
  let beginCalls = 0;
  const strength = {
    reviewItems(pool, count) { reviewCalls += 1; return pool.slice(0, count); },
    beginReview() { beginCalls += 1; },
  };
  const worlds = loadWorlds(strength);
  const done = expectedIds.slice(0, 11); // through fatha, so Catch is learned
  const daily = worlds.dailySession(done);
  assert.equal(reviewCalls, 1);
  assert.equal(beginCalls, 0, "rendering a daily plan must not consume review history");
  assert.equal(daily.plan.length, 3);
  assert.deepEqual(plain(daily.games), plain(daily.plan.map((step) => step.game)));
  assert.ok(daily.plan.every((step) => step.items.length >= 2 && step.items.length <= 4 && step.rounds === 2));
  assert.ok(daily.plan.every((step) => ["pop", "pairs", "catch", "trace", "build", "feed"].includes(step.game)));
  assert.ok(daily.items().every((item) => done.includes(item.prerequisiteWorldIds[0]) || !item.prerequisiteWorldIds.length));

  const legacy = loadWorlds({ weakest: (pool, count) => pool.slice(0, count) }).dailySession(["pack-boat"]);
  assert.deepEqual(plain(legacy.games), ["pop", "feed"]);
  assert.equal(legacy.plan, undefined);
});

test("daily activities are learned, and Build never mixes chapter rule families", () => {
  const allFromBoat = loadWorlds({ reviewItems: (pool) => pool.slice(0, 4) });
  const boatDaily = allFromBoat.dailySession(["pack-boat"]);
  assert.deepEqual(plain(boatDaily.games), ["pop", "feed", "trace"]);
  assert.ok(boatDaily.plan.every((step) => step.rounds === 2));

  const mixedStrength = {
    reviewItems(pool) {
      const pick = (worldId, offset = 0) => pool.filter((item) => item.worldId === worldId)[offset];
      return [
        pick("pack-boat"), pick("join-1"), pick("muqattaat"),
        pick("fatha"), pick("kasra-damma"), pick("tanween"),
      ];
    },
  };
  const mixedWorlds = loadWorlds(mixedStrength);
  const throughTanween = expectedIds.slice(0, expectedIds.indexOf("tanween") + 1);
  const mixedDaily = mixedWorlds.dailySession(throughTanween);
  assert.ok(mixedDaily.games.includes("catch"), "Catch is available only after a completed Catch chapter");
  assert.ok(!mixedDaily.games.includes("build"), "one item from each Build family cannot be combined");
  assert.equal(Object.hasOwn(mixedDaily.plan[0], "skill"), false, "mixed recognition has no false shared skill");

  mixedStrength.reviewItems = (pool) => {
    const tanween = pool.filter((item) => item.worldId === "tanween").slice(0, 2);
    return tanween.concat(pool.filter((item) => item.worldId === "pack-boat").slice(0, 4));
  };
  const buildDaily = mixedWorlds.dailySession(throughTanween);
  const build = buildDaily.plan.find((step) => step.game === "build");
  assert.ok(build);
  assert.equal(build.skill, "construction");
  assert.deepEqual([...new Set(build.items.map((item) => item.worldId))], ["tanween"]);
});
