const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const stateSource = fs.readFileSync(path.join(__dirname, "../LettersState.js"), "utf8");
const strengthSource = fs.readFileSync(path.join(__dirname, "../LettersStrength.js"), "utf8");
const key = (name) => `quran-trainer:letters:${name}`;

function storage(initial = {}, options = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem(name) {
      if (options.denyRead) throw new Error("denied");
      return values.has(name) ? values.get(name) : null;
    },
    setItem(name, value) {
      if (options.denyWrite) throw new Error("denied");
      values.set(name, String(value));
    },
  };
}

function load(store, withStrength = false) {
  const context = { window: { MiftahGame: {} }, localStorage: store, console };
  vm.runInNewContext(stateSource, context);
  if (withStrength) vm.runInNewContext(strengthSource, context);
  return context.window.MiftahGame;
}

const plain = (value) => JSON.parse(JSON.stringify(value));

test("read tolerates malformed JSON, wrong roots, denied storage, and leaves live data untouched", () => {
  const malformed = "{earned nope";
  const store = storage({ [key("wallet")]: malformed, [key("progress")]: "[]" });
  const state = load(store).LettersState;
  assert.deepEqual(plain(state.read(key("wallet"), { earned: 0, spent: 0 })), { earned: 0, spent: 0 });
  assert.equal(store.values.get(key("wallet")), malformed);
  assert.equal(store.values.get(`${key("wallet")}:recovery`), malformed);
  assert.deepEqual(plain(state.read(key("progress"), { done: [], skipped: false })), { done: [], skipped: false });
  assert.deepEqual(plain(load(storage({}, { denyRead: true })).LettersState.read(key("progress"), { done: [], skipped: false })), { done: [], skipped: false });
});

test("recovery stores the exact first damaged value once", () => {
  const store = storage({ [key("progress")]: '{"done":[3,"pack-a"]}', [`${key("progress")}:recovery`]: "first-copy" });
  const state = load(store).LettersState;
  assert.deepEqual(plain(state.read(key("progress"), { done: [], skipped: false })), { done: ["pack-a"], skipped: false });
  assert.equal(store.values.get(`${key("progress")}:recovery`), "first-copy");
  assert.equal(store.values.get(key("progress")), '{"done":[3,"pack-a"]}');
});

test("writes report success and storage or serialization failure", () => {
  assert.equal(load(storage()).LettersState.write(key("wallet"), { earned: 2 }), true);
  assert.equal(load(storage({}, { denyWrite: true })).LettersState.write(key("wallet"), { earned: 2 }), false);
  assert.equal(load(storage()).LettersState.write(key("wallet"), undefined), false);
  const cyclic = {}; cyclic.self = cyclic;
  assert.equal(load(storage()).LettersState.write(key("wallet"), cyclic), false);
});

test("progress filters and deduplicates done ids and requires a boolean skipped flag", () => {
  const normalized = load(storage()).LettersState.normalize(key("progress"), {
    done: ["pack-a", 4, "pack-a", "pack-b", null], skipped: "yes", future: 9,
  }, { done: [], skipped: false });
  assert.deepEqual(plain(normalized), { done: ["pack-a", "pack-b"], skipped: false, future: 9 });
});

test("stars and bests retain ids and clamp only finite nonnegative numbers", () => {
  const state = load(storage()).LettersState;
  assert.deepEqual(plain(state.normalize(key("stars"), { a: 2, b: 9, c: -1, d: "2", e: Infinity }, {})), { a: 2, b: 3 });
  assert.deepEqual(plain(state.normalize(key("bests"), { "pack:pop": 1.5, bad: NaN }, {})), { "pack:pop": 1.5 });
});

test("map ids named __proto__ survive as safe own properties", () => {
  const state = load(storage()).LettersState;
  const input = JSON.parse('{"__proto__":2,"constructor":1}');
  const result = state.normalize(key("stars"), input, {});
  assert.equal(Object.prototype.hasOwnProperty.call(result, "__proto__"), true);
  assert.equal(result.__proto__, 2);
  assert.equal(result.constructor, 1);
  assert.notEqual(Object.getPrototypeOf(result), null);
  assert.equal(Object.getPrototypeOf(result).polluted, undefined);
});

test("wallet accepts nonnegative numeric strings and preserves unknown earned data", () => {
  const state = load(storage()).LettersState;
  assert.deepEqual(plain(state.normalize(key("wallet"), { earned: "12.5", spent: "3", bonus: 7 }, { earned: 0, spent: 0 })), { earned: 12.5, spent: 3, bonus: 7 });
  assert.deepEqual(plain(state.normalize(key("wallet"), { earned: -2, spent: "no" }, { earned: 4, spent: 1 })), { earned: 4, spent: 1 });
});

test("pet repairs known fields, deduplicates inventories, and retains the selected body", () => {
  const state = load(storage()).LettersState;
  const pet = state.normalize(key("pet"), {
    hue: Infinity, species: "fox", worn: ["hat", 3, "hat"],
    accessories: ["hat", "hat", null], bodies: ["blob", 2], xp: 44,
  }, null);
  assert.deepEqual(plain(pet), {
    hue: 200, species: "fox", worn: ["hat"], accessories: ["hat"], bodies: ["blob", "fox"], xp: 44,
  });
  assert.equal(state.normalize(key("pet"), [], null), null);
  assert.deepEqual(plain(state.normalize(key("pet"), { hue: 12, species: 2 }, null)), {
    hue: 12, species: "blob", worn: [], accessories: [], bodies: ["blob"],
  });
});

test("stickers and stamps filter strings, invalid dates, and duplicates", () => {
  const state = load(storage()).LettersState;
  assert.deepEqual(plain(state.normalize(key("stickers"), { owned: ["moon", 1, "moon", "boat"], note: true }, { owned: [] })), { owned: ["moon", "boat"], note: true });
  assert.deepEqual(plain(state.normalize(key("stamps"), { dates: ["2026-02-28", "2026-02-30", "no", "2026-02-28", "2024-02-29"], old: 1 }, { dates: [] })), {
    dates: ["2026-02-28", "2024-02-29"], old: 1,
  });
});

test("skills retain valid score/date records and their unknown fields", () => {
  const state = load(storage()).LettersState;
  const skills = state.normalize(key("skills"), {
    listen: { score: 3, at: "2026-09-09", note: "legacy" },
    build: { score: 4, at: "2026-09-09" },
    trace: { score: 2, at: "2026-13-01" }, bad: 2,
  }, {});
  assert.deepEqual(plain(skills), { listen: { score: 3, at: "2026-09-09", note: "legacy" } });
});

test("reduced motion accepts booleans only", () => {
  const state = load(storage()).LettersState;
  assert.equal(state.normalize(key("reduced-motion"), true, false), true);
  assert.equal(state.normalize(key("reduced-motion"), "true", false), false);
});

test("strength validates records while retaining valid legacy values and fields", () => {
  const state = load(storage()).LettersState;
  const result = state.normalize(key("strength"), {
    alef: { r: 3, w: -2, streak: 1, fast: 2, slow: NaN, last: 100, legacy: "kept" },
    baa: { r: 0, w: 1, streak: 0, fast: 0, slow: 0, last: 0 }, broken: 7,
  }, {});
  assert.deepEqual(plain(result), {
    alef: { r: 3, w: 0, streak: 1, fast: 2, slow: 0, last: 100, legacy: "kept" },
    baa: { r: 0, w: 1, streak: 0, fast: 0, slow: 0, last: 0 },
  });
});

test("strength uses resilient state, rejects negative fast times, and clamps future staleness", () => {
  const now = Date.now();
  const store = storage({ [key("strength")]: JSON.stringify({ a: { r: 1, w: 0, streak: 1, fast: 1, slow: 0, last: now + 86400000 } }) });
  const strength = load(store, true).LettersStrength;
  const futureWeakness = strength.weakness("a");
  strength.record("a", true, -10);
  assert.equal(strength.map.a.fast, 1);
  assert.equal(strength.map.a.slow, 1);
  const expectedWithoutNegativeStaleness = (0 + 1) / (2 + 0 + 2) * 3 - 2 * 0.3;
  assert.ok(Math.abs(strength.weakness("a") - expectedWithoutNegativeStaleness) < 0.01);
  assert.ok(Number.isFinite(futureWeakness));
});

test("strength still loads and saves when the state helper is absent", () => {
  const store = storage({ [key("strength")]: JSON.stringify({ legacy: { r: 2, w: 0, streak: 2, fast: 2, slow: 0, last: 1 } }) });
  const context = { window: { MiftahGame: {} }, localStorage: store, console };
  vm.runInNewContext(strengthSource, context);
  assert.equal(context.window.MiftahGame.LettersStrength.map.legacy.r, 2);
  assert.equal(context.window.MiftahGame.LettersStrength.save(), true);
});

 test("failed strength saves surface through shared storage status",()=>{
  const ns=load(storage({}, {denyWrite:true}),true);
  assert.equal(ns.LettersState.hasWriteFailure(),false);
  assert.equal(ns.LettersStrength.save(),false);
  assert.equal(ns.LettersState.hasWriteFailure(),true);
 });
