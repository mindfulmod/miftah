const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "../../..");
const source = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

function loadWorlds() {
  const window = { MiftahGame: {} };
  let seed = 0x1a2b3c4d;
  const deterministicMath = Object.create(Math);
  deterministicMath.random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  const context = {
    window,
    Math: deterministicMath,
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: async (url) => {
      const number = Number(String(url).match(/surah-(\d+)\.json$/)?.[1]);
      const file = path.join(root, "data", `surah-${number}.json`);
      if (!number || !fs.existsSync(file)) return { ok: false, status: 404 };
      return { ok: true, json: async () => JSON.parse(fs.readFileSync(file, "utf8")) };
    },
  };
  vm.runInNewContext(source("../data/letters.js"), context);
  vm.runInNewContext(source("LettersBoot.js"), context);
  vm.runInNewContext(source("LettersWorlds.js"), context);
  return { context, worlds: new window.MiftahGame.LettersWorlds() };
}

function nonemptyUnicode(value, label) {
  assert.equal(typeof value, "string", `${label} must be a string`);
  assert.ok(value.length > 0, `${label} must be nonempty`);
}

function assertItem(item, label) {
  assert.ok(item && typeof item === "object", `${label} must be an item`);
  nonemptyUnicode(item.id, `${label}.id`);
  nonemptyUnicode(item.display, `${label}.display`);
  assert.equal(typeof item.speak, "string", `${label}.speak must be a string`);
}

const activityNames = new Set([
  "pop", "catch", "pairs", "feed", "trace", "burst", "build", "blend",
  "fuse", "unfuse", "chain", "parade",
]);

test("release contract: every curriculum world has usable generated inputs for each game", async () => {
  const { worlds } = loadWorlds();
  await worlds.loadWords();
  assert.equal(worlds.worlds.length, 22, "the release curriculum must preserve all 22 worlds");

  const seenWorldIds = new Set();
  for (const [worldIndex, world] of worlds.worlds.entries()) {
    assert.ok(!seenWorldIds.has(world.id), `duplicate world id: ${world.id}`);
    seenWorldIds.add(world.id);
    nonemptyUnicode(world.id, `world[${worldIndex}].id`);
    assert.ok(Array.isArray(world.games) && world.games.length > 0, `${world.id} needs games`);
    for (const game of world.games) assert.ok(activityNames.has(game), `${world.id} has unknown game ${game}`);

    const extra = world.extraItems ? world.extraItems() : [];
    for (const [i, item] of extra.entries()) assertItem(item, `${world.id}.extraItems[${i}]`);

    // Randomized item factories must remain valid across several fresh rolls.
    // This catches thin pools that happen to pass once due to shuffle order.
    for (let roll = 0; roll < 8; roll += 1) {
      const items = world.items();
      assert.ok(items.length > 0, `${world.id} produced no items on roll ${roll}`);
      const ids = new Set();
      for (const [i, item] of items.entries()) {
        assertItem(item, `${world.id}.items[${i}]`);
        assert.ok(!ids.has(item.id), `${world.id} repeated item id ${item.id} on roll ${roll}`);
        ids.add(item.id);
        if (item.parts !== undefined) {
          assert.ok(Array.isArray(item.parts) && item.parts.length >= 1, `${world.id}:${item.id} needs nonempty parts`);
          for (const [partIndex, part] of item.parts.entries()) {
            nonemptyUnicode(part.display, `${world.id}:${item.id}.parts[${partIndex}].display`);
            assert.equal(typeof part.speak, "string", `${world.id}:${item.id}.parts[${partIndex}].speak must be a string`);
          }
        }
      }

      for (const game of world.games) {
        if (["build", "blend", "fuse", "unfuse"].includes(game)) {
          assert.ok(items.some((item) => Array.isArray(item.parts) && item.parts.length >= 2), `${world.id}:${game} has no buildable target`);
        }
        if (game === "blend") {
          assert.ok(items.some((item) => item.parts.length === 2), `${world.id}:blend has no two-part target`);
        }
        if (game === "chain") {
          const joinables = items.filter((item) => item.parts?.length === 2 && item.join2);
          assert.ok(joinables.length > 0, `${world.id}:chain has no chainable pair`);
          for (const pair of joinables) {
            const candidates = extra.filter((candidate) =>
              candidate.display !== pair.parts[0].display && candidate.display !== pair.parts[1].display,
            );
            assert.ok(candidates.length >= 2, `${world.id}:chain lacks distinct third-letter candidates`);
          }
        }
        if (game === "unfuse") {
          const pairs = items.filter((item) => item.parts?.length === 2);
          assert.ok(pairs.length > 0, `${world.id}:unfuse has no pair to split`);
          assert.ok(extra.some((candidate) => pairs.some((pair) =>
            candidate.display !== pair.parts[0].display && candidate.display !== pair.parts[1].display,
          )), `${world.id}:unfuse has no distractor outside the pair`);
        }
        if (game === "parade") {
          assert.ok(extra.filter((item) => item.joins).length >= 3, `${world.id}:parade needs three joiners`);
        }
      }

      // All option-based rounds need a real wrong answer for every target;
      // this mirrors LettersRoundBuilder's id-based filtering without testing
      // the helper's source text.
      if (world.games.some((game) => ["pop", "catch", "feed"].includes(game))) {
        for (const target of items) {
          assert.ok(items.some((candidate) => candidate.id !== target.id), `${world.id} has no distractor for ${target.id}`);
        }
      }
    }
  }
});

test("release contract: letters.html local references resolve", () => {
  const html = fs.readFileSync(path.join(root, "letters.html"), "utf8");
  const refs = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
    .map((match) => match[1].split("?")[0])
    .filter((ref) => !/^(?:[a-z]+:|\/\/|#)/i.test(ref));
  assert.ok(refs.length > 0);
  for (const ref of refs) assert.ok(fs.existsSync(path.join(root, ref)), `letters.html missing local asset: ${ref}`);
});

function loadLettersGamePrototype() {
  const window = { MiftahGame: { LettersArt: {} } };
  vm.runInNewContext(source("LettersGame.js"), { window, document: {}, console });
  return window.MiftahGame.LettersGame.prototype;
}

test("release contract: actual unlock methods expose one sequential current world", () => {
  const prototype = loadLettersGamePrototype();
  const worlds = Array.from({ length: 22 }, (_, i) => ({ id: `world-${i}` }));
  const game = { worlds: { worlds }, progress: { done: [] } };
  game.firstOpenIndex = prototype.firstOpenIndex;
  for (let i = 0; i < worlds.length; i += 1) {
    assert.equal(prototype.firstOpenIndex.call(game), i);
    assert.equal(prototype.statusOf.call(game, worlds[i]), "current");
    if (i > 0) assert.equal(prototype.statusOf.call(game, worlds[i - 1]), "done");
    if (i + 1 < worlds.length) assert.equal(prototype.statusOf.call(game, worlds[i + 1]), "locked");
    game.progress.done.push(worlds[i].id);
  }
  assert.equal(prototype.firstOpenIndex.call(game), 22);
  assert.ok(worlds.every((world) => prototype.statusOf.call(game, world) === "done"));
});

test("release contract: actual finishGame bests only pay score improvements", () => {
  const prototype = loadLettersGamePrototype();
  const paid = [];
  const saved = [];
  const rendered = [];
  const game = {
    bests: {},
    session: { world: { id: "pack-boat", games: ["pop"] }, gameIndex: 0, starTotal: 0 },
    earnStars(value) { paid.push(value); },
    saveJSON(key, value) { saved.push([key, { ...value }]); },
    renderStars(value) { rendered.push(value); },
  };
  prototype.finishGame.call(game, 0);
  prototype.finishGame.call(game, 0);
  prototype.finishGame.call(game, 1);
  prototype.finishGame.call(game, 0);
  assert.deepEqual(paid, [3], "repeating the same best or scoring below it must not pay again");
  assert.equal(game.bests["pack-boat:pop"], 3);
  assert.equal(saved.length, 1);
  assert.deepEqual(rendered, [3, 3, 2, 3]);
});
