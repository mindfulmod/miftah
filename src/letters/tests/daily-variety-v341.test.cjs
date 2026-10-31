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

const ids = (step) => plain(step.items.map((item) => item.id));
const boat = ["pack-boat"];

function strengthFor(cursor, { choose } = {}) {
  return {
    review: { cursor },
    reviewItems(pool, count) { return choose ? choose(pool, count) : pool.slice(0, count); },
  };
}

test("Boat preserves its first visit and cursor one swaps Pop and Feed", () => {
  const first = loadWorlds(strengthFor(0)).dailySession(boat);
  const rotated = loadWorlds(strengthFor(1)).dailySession(boat);
  assert.deepEqual(plain(first.games), ["pop", "feed", "trace"]);
  assert.deepEqual(plain(rotated.games), ["feed", "pop", "trace"]);
  assert.deepEqual(plain(rotated.plan.slice(0, 2).map((step) => step.game)), ["feed", "pop"]);
});

test("later completed Catch and Pairs chapters rotate only among learned recognition games", () => {
  const done = ["pack-boat", "pack-smile", "pack-little", "pack-wave", "pack-tall", "pack-strong", "pack-round", "join-1", "join-2", "muqattaat", "fatha", "kasra-damma"];
  const learnedWorlds = loadWorlds(strengthFor(0));
  const learned = new Set(learnedWorlds.worlds.filter((world) => done.includes(world.id)).flatMap((world) => world.games));
  const plans = Array.from({ length: 6 }, (_, cursor) => loadWorlds(strengthFor(cursor)).dailySession(done));
  const recognition = (daily) => plain(daily.plan.slice(0, 2).map((step) => step.game));
  assert.deepEqual(recognition(plans[0]), ["pop", "catch"]);
  assert.deepEqual(recognition(plans[1]), ["catch", "feed"]);
  assert.deepEqual(recognition(plans[2]), ["feed", "pairs"]);
  assert.ok(plans.every((daily) => daily.plan.slice(0, 2).every((step) => learned.has(step.game))));
});

test("cursor rotation leaves the proposed bouquet and per-step target ordering stable", () => {
  const selectedIds = ["ا", "ب", "ت", "ث"];
  const choose = (pool) => selectedIds.map((id) => pool.find((item) => item.id === id));
  const atZero = loadWorlds(strengthFor(0, { choose })).dailySession(boat);
  const atOne = loadWorlds(strengthFor(1, { choose })).dailySession(boat);
  assert.deepEqual(plain(atZero.items().map((item) => item.id)), selectedIds);
  assert.deepEqual(plain(atOne.items().map((item) => item.id)), selectedIds);
  assert.deepEqual(ids(atZero.plan[0]), ids(atOne.plan[0]));
  assert.deepEqual(ids(atZero.plan[1]), ids(atOne.plan[1]));
  assert.deepEqual(ids(atZero.plan[2]), ids(atOne.plan[2]));
});

test("Build keeps its selected chapter family while recognition order rotates", () => {
  const done = ["pack-boat", "pack-smile", "pack-little", "pack-wave", "pack-tall", "pack-strong", "pack-round", "join-1", "join-2", "muqattaat", "fatha", "kasra-damma", "tanween"];
  const choose = (pool) => {
    const tanween = pool.filter((item) => item.worldId === "tanween").slice(0, 2);
    return tanween.concat(pool.filter((item) => item.worldId === "pack-boat").slice(0, 4));
  };
  for (const cursor of [0, 1]) {
    const daily = loadWorlds(strengthFor(cursor, { choose })).dailySession(done);
    const build = daily.plan[2];
    assert.equal(build.game, "build");
    assert.equal(build.skill, "construction");
    assert.deepEqual([...new Set(build.items.map((item) => item.worldId))], ["tanween"]);
  }
});

test("planning is repeatable and does not mutate cursor or a saved plan", () => {
  const strength = strengthFor(1);
  let beginCalls = 0;
  strength.beginReview = () => { beginCalls += 1; };
  const worlds = loadWorlds(strength);
  const first = worlds.dailySession(boat);
  const saved = plain(first.plan);
  worlds.dailySession(boat);
  assert.deepEqual(plain(first.plan), saved);
  assert.equal(strength.review.cursor, 1);
  assert.equal(beginCalls, 0);
  strength.review.cursor = 2;
  assert.deepEqual(plain(first.plan), saved, "a previously returned plan is detached from cursor changes");
  assert.deepEqual(plain(worlds.dailySession(boat).games), ["pop", "feed", "trace"]);
});

test("malformed cursors fall back to Pop, while challenge and legacy routes stay unchanged", () => {
  for (const cursor of [-1, 1.5, NaN, "2"]) {
    const daily = loadWorlds(strengthFor(cursor)).dailySession(boat);
    assert.deepEqual(plain(daily.games), ["pop", "feed", "trace"]);
  }
  const noRecognition = loadWorlds({
    review: { cursor: 0 }, reviewItems: (pool) => pool.slice(0, 4),
  });
  noRecognition.worlds.find((world) => world.id === "pack-boat").games = ["trace"];
  assert.equal(noRecognition.dailySession(boat), null);

  const strength = strengthFor(1);
  const worlds = loadWorlds(strength);
  const challenge = worlds.dailySession(boat, { challenge: true });
  assert.deepEqual(plain(challenge.games), ["burst"]);
  assert.equal(challenge.plan, undefined);
  const legacy = loadWorlds({ weakest: (pool, count) => pool.slice(0, count) }).dailySession(boat);
  assert.deepEqual(plain(legacy.games), ["pop", "feed"]);
  assert.equal(legacy.plan, undefined);
});
