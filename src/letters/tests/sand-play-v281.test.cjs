const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..", "..", "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

function classes() {
  const values = new Set();
  return { add: (...items) => items.forEach(x => values.add(x)), remove: (...items) => items.forEach(x => values.delete(x)),
    contains: item => values.has(item), toggle: (item, force) => { const add = force ?? !values.has(item); add ? values.add(item) : values.delete(item); return add; } };
}
function element() {
  return { classList: classes(), dataset: {}, style: {}, attrs: {}, disabled: false, innerHTML: "", isConnected: true, offsetWidth: 0,
    setAttribute(name, value) { this.attrs[name] = String(value); }, getAttribute(name) { return this.attrs[name]; }, getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; } };
}

function harness(options = {}) {
  const logs = { guides: [], prompts: [], rounds: [], outcomes: [], done: 0, cancel: 0, correct: 0, cheers: 0, sounds: [], plans: [] };
  const stage = element();
  const nodes = Object.fromEntries([".sand", ".sand-paper", ".sand-friend", ".sand-grains", ".sand-next", ".sand-help", ".sand-rake", ".sand-progress"].map(key => [key, element()]));
  const dots = Array.from({ length: 8 }, element);
  stage.querySelector = key => nodes[key] || null;
  stage.querySelectorAll = key => key === ".sand-progress i" ? dots : [];
  const timers = new Map(); let timerId = 1;
  const later = (fn, ms) => { const id = timerId++; timers.set(id, { fn, ms }); return id; };
  const cancelTimer = id => timers.delete(id);
  const runTimers = ms => {
    for (const [id, timer] of [...timers]) if (ms == null || timer.ms <= ms) { timers.delete(id); timer.fn(); }
  };
  const known = new Set(["ب", "ت", "ث", "ا", "بَ", "تَ", "بُ"]);
  const ns = {
    LettersStrokes: {
      LETTERS: Object.fromEntries(["ب", "ت", "ث", "ا"].map(c => [c, []])),
      forItem(item) { return item && known.has(item.display) ? { display: item.display, id: item.id } : null; },
      guide(paper, strokes, callbacks) { const guide = { paper, strokes, callbacks, destroyed: false, demonstrations: [], demonstrate(options) { this.demonstrations.push(options); }, destroy() { this.destroyed = true; } }; logs.guides.push(guide); return guide; },
    },
    SandPlayArt: { setting: () => "", rake: () => "" },
    PracticeLearning: {
      plan(ctx, pool, skill, count) {
        logs.plans.push({ pool: pool.map(i => i.id), skill, count });
        if (options.plan) return options.plan(ctx, pool, skill, count);
        return pool.slice(0, count);
      },
      level(ctx, pool, skill) { return typeof options.level === "function" ? options.level(ctx, pool[0], skill) : (options.level ?? 0); },
    },
  };
  const ctx = vm.createContext({ window: { MiftahGame: ns }, setTimeout: later, clearTimeout: cancelTimer, performance: { now: () => 1000 }, Promise, console });
  vm.runInContext(read("src/letters/SandTable.js"), ctx, { filename: "SandTable.js" });
  const items = options.items || [{ id: "b", display: "ب" }, { id: "t", display: "ت" }, { id: "th", display: "ث" }];
  const activity = {
    items, syllables: options.syllables || [], worldId: "w1", completedWorldIds: ["w1"], beginner: !!options.beginner,
    stage, canListen: options.canListen || (() => true), say: options.say || (() => true), prompt: item => logs.prompts.push(item?.id ?? null),
    beginRound: (item, skill) => logs.rounds.push([item.id, skill]), reportOutcome: outcome => logs.outcomes.push(outcome),
    done: () => logs.done++, cancel: () => logs.cancel++, correct: () => logs.correct++, pet: { cheer: () => logs.cheers++ },
    sfx: name => logs.sounds.push(name), strength: options.strength || { skillProfile: () => options.profile || {} }, reducedMotion: () => false,
  };
  const table = new ns.GardenPractice.SandTable(activity);
  return { table, activity, logs, nodes, dots, timers, runTimers, ns, stage, openGuide: () => logs.guides.at(-1) };
}

test("eligibility excludes untaught, locked, prerequisite-blocked and ambiguous duplicate displays; plan preserves curriculum IDs", () => {
  const { table } = harness({
    items: [
      { id: "keep", display: "ب" }, { id: "untaught", display: "ت", taught: false },
      { id: "locked", display: "ث", locked: true }, { id: "prereq", display: "ا", prerequisiteWorldIds: ["w2"] },
      { id: "ambiguous", display: "ب", taught: false }, { id: "unknown", display: "?" },
      { id: "other", display: "تَ" },
    ],
    plan: (_ctx, pool) => pool.map(i => i.id),
  });
  assert.deepEqual(Array.from(table.letters, i => i.id), ["other"]);
  assert.deepEqual(Array.from(table.letters, i => i.display), ["تَ"]);
});

test("empty and invalid explicit plans cancel without completing the activity", () => {
  for (const plan of [() => [], () => ["unknown-id"], () => null]) {
    const h = harness({ plan });
    assert.equal(h.table.letters.length, 0);
    assert.equal(h.logs.done, 0);
    assert.equal(h.logs.cancel, 0, "cancellation is deferred to the activity tick");
    h.runTimers(0);
    assert.equal(h.logs.cancel, 1);
    assert.equal(h.logs.done, 0);
    assert.equal(h.logs.outcomes.length, 0);
  }
});

test("only taught syllable items can return; the table never invents a mark or changes the selected ID", () => {
  const syllable = { id: "ba-fatha", display: "بَ" };
  const h = harness({ items: [{ id: "b", display: "ب" }, { id: "t", display: "ت" }], syllables: [syllable, { id: "made-up", display: "ثَ", taught: false }] });
  assert.deepEqual(Array.from(h.table.letters, i => [i.id, i.display]), [["b", "ب"], ["ba-fatha", "بَ"]]);
  assert.equal(h.table.letters.some(i => i.id === "made-up"), false);
});

test("guidance is frozen per item: show, dotted, start, then memory after four motor sessions", () => {
  const item = { id: "b", display: "ب" };
  const profile = visits => ({ motor: { r: 12, streak: 5, sessions: Array.from({ length: visits }, (_, i) => `visit-${i}`) } });
  const visitLevel = visits => harness({ items: [item], level: visits === 1 ? 0 : visits === 2 ? 1 : 2, profile: profile(visits) });
  assert.equal(visitLevel(1).table.paper.dataset.level, "show");
  assert.equal(visitLevel(2).table.paper.dataset.level, "dotted");
  assert.equal(visitLevel(3).table.paper.dataset.level, "start");
  const four = visitLevel(4);
  assert.equal(four.table.paper.dataset.level, "memory");
  assert.deepEqual(four.logs.rounds, [["b", "drawing"]]);
  assert.deepEqual(four.logs.prompts, [null]);
  assert.equal(harness({ items: [item], beginner: true, level: 3, profile: profile(4) }).table.paper.dataset.level, "show");

  const frozen = harness({ items: [item], level: 2, profile: profile(3) });
  frozen.activity.strength.skillProfile = () => profile(4);
  frozen.table.draw(false);
  assert.equal(frozen.table.paper.dataset.level, "start", "later motor evidence cannot upgrade an item already in this visit");
});

test("drawing reports supported motor participation, and completion waits for the child to press Next", () => {
  const h = harness({ items: [{ id: "b", display: "ب" }] });
  const guide = h.openGuide(); guide.callbacks.onDone();
  assert.equal(h.logs.outcomes.length, 1);
  assert.deepEqual({ itemId: h.logs.outcomes[0].itemId, skill: h.logs.outcomes[0].skill, evidence: h.logs.outcomes[0].evidence,
    correct: h.logs.outcomes[0].correct, affectsStrength: h.logs.outcomes[0].affectsStrength },
  { itemId: "b", skill: "drawing", evidence: "motor_assembly_participation", correct: true, affectsStrength: false });
  assert.equal(h.logs.done, 0);
  assert.equal(h.nodes[".sand-next"].disabled, false);
  h.nodes[".sand-next"].onclick();
  assert.equal(h.logs.done, 1);
  assert.equal(h.logs.outcomes.length, 1);
  assert.equal(h.logs.rounds.length, 0, "drawing participation is not independent listening evidence");
});

test('real learning storage advances drawing support without raising recall, while helped traces restore support', () => {
  const storage = new Map(), window = { MiftahGame: {} };
  let now = 1000;
  class Clock extends Date { static now() { return now; } }
  const context = vm.createContext({ window, Date: Clock, performance: { now: () => now },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, String(value)) } });
  for (const file of ['LettersLearning', 'LettersStrength', 'PracticeLearning']) {
    vm.runInContext(read(`src/letters/${file}.js`), context);
  }
  const ns = window.MiftahGame, strength = ns.LettersStrength, item = { id: 'b', display: 'ب' };
  const finish = helped => {
    now += 1000;
    const h = harness({ items: [item] });
    if (helped) h.openGuide().callbacks.onSnap();
    h.openGuide().callbacks.onDone();
    const learning = new ns.LettersLearning.LearningSession(strength);
    learning.beginPrompt(item, { activity: 'SandTable', skill: 'drawing' });
    const result = learning.report(h.logs.outcomes[0]);
    assert.equal(learning.report(h.logs.outcomes[0]), false, 'duplicate completion cannot record twice');
    return result;
  };
  for (let i = 0; i < 3; i++) assert.equal(finish(false).evidence, 'motor_assembly_participation');
  assert.equal(strength.skillProfile('b', 'drawing').motor.r, 3);
  assert.equal(ns.PracticeLearning.level({ strength }, [item], 'drawing'), 1, 'successful drawing across visits can fade the guide');
  assert.equal(strength.map.b.r, 0);
  assert.equal(strength.mastery('b'), 0, 'drawing cannot inflate aggregate letter mastery');
  assert.equal(strength.skillProfile('b', 'letter-name').attempts, 0);
  assert.equal(finish(true).evidence, 'assisted_response');
  assert.equal(strength.skillProfile('b', 'drawing').motor.r, 3, 'assistance cannot add an unassisted drawing success');
  assert.equal(ns.PracticeLearning.level({ strength }, [item], 'drawing'), 0, 'recent help restores the visible guide');
  assert.equal(strength.map.b.r, 0);
  const saved = JSON.parse(storage.get('quran-trainer:letters:strength'));
  assert.equal(saved.b.skills.drawing.motor.r, 3);
  assert.equal(saved.b.skills.drawing.assisted.r, 1);
  assert.equal(saved.b.skills.drawing.listening, undefined);
});

test("rake and advance retire stale guide callbacks and late speech; raking the same item never duplicates its outcome", async () => {
  let resolveSpeech;
  const h = harness({ items: [{ id: "b", display: "ب" }, { id: "t", display: "ت" }], say: () => new Promise(resolve => { resolveSpeech = resolve; }) });
  const first = h.openGuide();
  h.nodes[".sand-rake"].onclick();
  const reraked = h.openGuide();
  assert.equal(first.destroyed, true);
  first.callbacks.onDone();
  assert.equal(h.logs.outcomes.length, 0);
  reraked.callbacks.onDone();
  reraked.callbacks.onDone();
  assert.equal(h.logs.outcomes.length, 1);
  assert.equal(h.logs.outcomes[0].assisted, true);
  h.nodes[".sand-next"].onclick();
  assert.equal(h.table.item.id, "t");
  reraked.callbacks.onDone();
  resolveSpeech(false);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(h.logs.outcomes.length, 1);
  assert.equal(h.table.item.id, "t");
});

test("raking a completed item lets the child draw it again without duplicating its outcome", () => {
  const h = harness({ items: [{ id: "b", display: "ب" }] });
  h.openGuide().callbacks.onDone();
  assert.equal(h.logs.outcomes.length, 1);
  h.nodes[".sand-rake"].onclick();
  assert.equal(h.table.item.id, "b");
  assert.equal(h.table.ready, false);
  h.openGuide().callbacks.onDone();
  assert.equal(h.logs.outcomes.length, 1);
  assert.equal(h.nodes[".sand-next"].disabled, false);
});

test("a memory item reveals its path when audio cannot be confirmed, and destroy invalidates callbacks", async () => {
  const profile = { motor: { r: 12, streak: 5, sessions: ["a", "b", "c", "d"] } };
  const h = harness({ items: [{ id: "b", display: "ب" }], level: 2, profile, say: () => Promise.resolve(false) });
  await Promise.resolve(); await Promise.resolve();
  assert.equal(h.table.paper.dataset.level, "show");
  const guide = h.openGuide();
  h.table.destroy();
  assert.equal(guide.destroyed, true);
  guide.callbacks.onDone();
  assert.equal(h.logs.outcomes.length, 0);
  assert.equal(h.logs.done, 0);
});

test('confirmed speech keeps memory mode after the timeout; a hung prompt reveals support', async () => {
  const profile = { motor: { r: 12, streak: 5, sessions: ['a', 'b', 'c', 'd'] } };
  const heard = harness({ items: [{ id: 'b', display: 'ب' }], level: 2, profile, say: () => Promise.resolve(true) });
  await Promise.resolve(); heard.runTimers(5000);
  assert.equal(heard.table.paper.dataset.level, 'memory');
  const hung = harness({ items: [{ id: 'b', display: 'ب' }], level: 2, profile, say: () => new Promise(() => {}) });
  const original = hung.openGuide(); hung.runTimers(5000);
  assert.equal(hung.table.paper.dataset.level, 'show');
  assert.equal(hung.openGuide(), original, 'fallback preserves any strokes already drawn');
  assert.equal(hung.table.assisted, true);
});

test('Show me how demonstrates on the existing guide without discarding the child work', () => {
  const h = harness({ items: [{ id: 'b', display: 'ب' }], level: 1 });
  const previous = h.openGuide(); h.nodes['.sand-help'].onclick();
  assert.equal(previous.destroyed, false);
  assert.equal(h.openGuide(), previous);
  assert.equal(h.table.paper.dataset.level, 'show');
  assert.equal(previous.demonstrations.length, 1);
  assert.equal(h.logs.outcomes.length, 0, 'showing help does not complete the letter');
  h.openGuide().callbacks.onDone();
  assert.equal(h.logs.outcomes.length, 1);
  assert.equal(h.logs.outcomes[0].assisted, true);
  h.runTimers(); assert.equal(h.logs.done, 0, 'the completed letter stays until Next');
});
