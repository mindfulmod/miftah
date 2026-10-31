const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

function runtime(files = ["LettersLearning.js", "PracticeLearning.js", "WaterGarden.js"]) {
  const timers = [];
  const cleared = new Set();
  class Element {
    constructor() {
      this.dataset = {}; this.style = {}; this.attrs = {}; this.hidden = false; this.disabled = false;
      this.classes = new Set(); this._innerHTML = "";
      this.classList = {
        add: (...names) => names.forEach(name => this.classes.add(name)),
        remove: (...names) => names.forEach(name => this.classes.delete(name)),
        toggle: (name, force) => force === undefined ? (this.classes.has(name) ? this.classes.delete(name) : this.classes.add(name)) : (force ? this.classes.add(name) : this.classes.delete(name)),
        contains: name => this.classes.has(name),
      };
    }
    set innerHTML(value) { this._innerHTML = String(value); }
    get innerHTML() { return this._innerHTML; }
    setAttribute(name, value) { this.attrs[name] = String(value); }
    getAttribute(name) { return this.attrs[name] ?? null; }
    focus() { this.focused = true; }
    animate(...args) { this.animationCalls = [...(this.animationCalls || []), args]; return { cancel() {} }; }
    getAnimations() { return []; }
    querySelector(selector) { return this.map?.[selector] || null; }
    querySelectorAll(selector) { return this.lists?.[selector] || []; }
    click(detail = 1) { this.onclick?.({ detail, currentTarget: this }); }
  }
  const svg = new Element();
  const laneParts = Array.from({ length: 3 }, (_, i) => {
    const elbow = new Element(), turn = new Element(), cue = new Element();
    const water = [new Element(), new Element(), new Element()];
    elbow.map = { ".wg-turn": turn, ".wg-turn-cue": cue };
    elbow.lists = { ".wg-elbow-water, .wg-inlet-water, .wg-basin-water": water };
    const board = new Element(), bloom = new Element(), bud = new Element(), flower = new Element(), puddle = new Element();
    flower.map = { ".wg-bloom": bloom, ".wg-bud": bud };
    const flows = [new Element(), new Element()];
    flows.forEach(el => { el.dataset.lane = String(i); }); puddle.dataset.lane = String(i);
    return { elbow, turn, cue, water, board, bloom, bud, flower, puddle, flows };
  });
  svg.querySelector = selector => {
    const match = selector.match(/data-lane="(\d+)"/), part = match ? laneParts[Number(match[1])] : null;
    if (selector.startsWith(".wg-elbow")) return selector.includes(".wg-turn") ? part?.turn || null : part?.elbow || null;
    if (selector.startsWith(".wg-gate")) return part?.board || null;
    if (selector.startsWith(".wg-flower")) return part?.flower || null;
    if (selector.startsWith(".wg-puddle")) return part?.puddle || null;
    return null;
  };
  svg.querySelectorAll = selector => {
    if (selector === ".wg-flow, .wg-flow-light") return laneParts.flatMap(part => part.flows);
    if (selector === ".wg-puddle") return laneParts.map(part => part.puddle);
    const match = selector.match(/data-lane="(\d+)"/);
    if (match && selector.includes(".wg-flow")) return laneParts[Number(match[1])].flows;
    return [];
  };
  const gates = Array.from({ length: 3 }, () => new Element());
  const bends = Array.from({ length: 3 }, () => new Element());
  const progress = new Element(), next = new Element(), help = new Element(), done = new Element(), root = new Element(), stage = new Element();
  root.map = { ".wg-scene": svg, ".wg-progress": progress, ".wg-next": next, ".wg-help": help, ".wg-done": done };
  root.lists = { ".wg-gate-tag": gates, ".wg-bend": bends, "*": [] };
  stage.map = { ".water-garden": root };
  const ns = { LettersArt: { icon: () => "<svg/>", fitGlyphs() {} }, GardenPractice: {} };
  const sandbox = { window: { MiftahGame: ns }, localStorage: { getItem: () => null, setItem() {} }, setTimeout(fn, ms) { const timer = { fn, ms }; timers.push(timer); return timer; }, clearTimeout(timer) { cleared.add(timer); }, Math, Date };
  for (const file of files) vm.runInNewContext(source(file), sandbox);
  const flush = (predicate = () => true) => {
    let guard = 0;
    for (let i = 0; i < timers.length && guard++ < 100;) {
      const timer = timers[i];
      if (cleared.has(timer)) { timers.splice(i, 1); continue; }
      if (!predicate(timer)) { i++; continue; }
      timers.splice(i, 1); timer.fn();
    }
    assert.ok(guard < 100, "timer queue settles");
  };
  return { ns, timers, flush, stage, root, svg, gates, bends, progress, next, help, done, laneParts };
}
const plain = value => JSON.parse(JSON.stringify(value));
const ITEMS = ["ب", "ت", "ث", "ج"].map(id => ({ id, display: id, speak: id }));
const asyncTurn = async () => { await Promise.resolve(); await Promise.resolve(); };
const listeningReady = { strength: { skillProfile: () => ({ listening: { r: 4, streak: 2, sessions: ["visit-a", "visit-b"] } }) } };
function bloom(game, f) {
  const lane = game.targetLane, round = game.roundToken;
  game.tapGate(lane);
  game.arrive(lane, game.arrivalTokens[lane], round);
}

test("state normalization accepts only three boolean lanes", () => {
  const { ns } = runtime();
  assert.deepEqual(plain(ns.WaterGardenState.normalize({ open: [true, 1], away: [false, true, true, true], bloomed: [true, false, "yes"] })), {
    open: [true, false, false], away: [false, true, true], bloomed: [true, false, false],
  });
  assert.deepEqual(plain(ns.WaterGardenState.normalize(null)), { open: [false, false, false], away: [false, false, false], bloomed: [false, false, false] });
});

test("default support is visible two-choice matching and offers distinct glyphs", () => {
  const f = runtime();
  const game = new f.ns.GardenPractice.WaterGarden({ stage: f.stage, items: ITEMS, say: () => true });
  assert.equal(game.choiceCount, 2);
  assert.equal(game.modelVisible, true);
  assert.equal(game.allowRecall, false);
  assert.equal(game.offered.filter(Boolean).length, 2);
  assert.equal(new Set(game.offered.filter(Boolean).map(item => item.display)).size, 2);
  assert.equal(game.gates.filter(gate => !gate.hidden).length, 2);
  game.destroy();
});

test("two-item and explicit three-choice requests never duplicate visible glyphs", () => {
  const f = runtime();
  const two = new f.ns.GardenPractice.WaterGarden({ stage: f.stage, items: ITEMS.slice(0, 2), choiceCount: 3, say: () => true });
  assert.equal(two.choiceCount, 2);
  assert.equal(new Set(two.offered.filter(Boolean).map(item => item.display)).size, 2);
  two.destroy();
  const three = runtime();
  const game = new three.ns.GardenPractice.WaterGarden({ stage: three.stage, items: ITEMS, choiceCount: 3, ...listeningReady, say: () => true });
  assert.equal(game.offered.filter(Boolean).length, 3);
  assert.equal(new Set(game.offered.filter(Boolean).map(item => item.display)).size, 3);
  game.destroy();
});

test("two-choice lane placement rotates and a valid scheduled plan is honored", () => {
  const f = runtime();
  const game = new f.ns.GardenPractice.WaterGarden({ stage: f.stage, items: ITEMS, choiceCount: 2, rounds: 99, targets: ["ب", "ث", "ت"], say: () => true });
  assert.equal(game.rounds, 6);
  const emptyLanes = [];
  for (const target of ["ب", "ث", "ت"]) {
    assert.equal(game.target.id, target);
    assert.equal(game.offered[game.targetLane].id, target);
    emptyLanes.push(game.gates.findIndex(gate => gate.hidden));
    bloom(game, f); game.continue();
  }
  assert.deepEqual(emptyLanes, [2, 0, 1]);
  game.destroy();
});

test("guided bloom saves only flowers and waits for the child before the next round or free play", () => {
  const f = runtime(); const snapshots = []; let milestones = 0;
  const game = new f.ns.GardenPractice.WaterGarden({ stage: f.stage, items: ITEMS, rounds: 2,
    waterState: { open: [false, true, false], away: [false, true, false], bloomed: [true, false, false] }, say: () => true,
    saveWaterState: snapshot => snapshots.push(plain(snapshot)), onGuidedDone: snapshot => { milestones++; assert.deepEqual(Object.keys(snapshot), ["bloomed"]); } });
  bloom(game, f);
  assert.equal(game.round, 1);
  assert.equal(game.resolvedRound, true);
  assert.equal(game.target, game.offered[game.targetLane]);
  assert.equal(f.next.hidden, false);
  assert.deepEqual(plain(snapshots.at(-1)), { bloomed: plain(game.bloomed) });
  assert.equal(milestones, 0);
  f.next.click();
  assert.equal(game.round, 1);
  assert.equal(game.mode, "guided");
  bloom(game, f);
  assert.equal(milestones, 0);
  f.next.click();
  assert.equal(milestones, 1);
  assert.equal(game.mode, "free");
  assert.deepEqual(plain(game.open), [false, true, false]);
  assert.deepEqual(plain(game.away), [false, true, false]);
  game.finish();
});

test("pending speech blocks answers; help reveals the model and unlocks the gates", async () => {
  const f = runtime(); let resolveSpeech; const outcomes = [];
  const game = new f.ns.GardenPractice.WaterGarden({ stage: f.stage, items: ITEMS, ...listeningReady,
    say: () => new Promise(resolve => { resolveSpeech = resolve; }), reportOutcome: outcome => outcomes.push(outcome) });
  assert.equal(game.waiting, true);
  assert.ok(game.gates.filter(gate => !gate.hidden).every(gate => gate.disabled));
  game.tapGate(game.targetLane);
  assert.equal(outcomes.length, 0);
  assert.equal(game.round, 0);
  f.help.click();
  assert.equal(game.waiting, false);
  assert.equal(game.modelVisible, true);
  assert.equal(game.assisted, true);
  assert.ok(game.gates.filter(gate => !gate.hidden).every(gate => !gate.disabled));
  resolveSpeech(true); await asyncTurn();
  assert.equal(game.heard, false, "help invalidates the earlier speech result");
  game.tapGate(game.targetLane);
  assert.equal(outcomes[0].assisted, true);
  game.destroy();
});

test("a speech deadline reveals help after six seconds, and late results stay stale", async () => {
  const f = runtime(); let resolveSpeech;
  const game = new f.ns.GardenPractice.WaterGarden({ stage: f.stage, items: ITEMS, ...listeningReady,
    say: () => new Promise(resolve => { resolveSpeech = resolve; }) });
  f.flush(timer => timer.ms === 6000);
  assert.equal(game.waiting, false);
  assert.equal(game.modelVisible, true);
  assert.equal(game.assisted, true);
  resolveSpeech(true); await asyncTurn();
  assert.equal(game.heard, false);
  game.destroy();
});

test("replay invalidates earlier speech and immediately releases supported matching", async () => {
  const f = runtime(); const resolves = [];
  const game = new f.ns.GardenPractice.WaterGarden({ stage: f.stage, items: ITEMS, ...listeningReady,
    say: () => new Promise(resolve => resolves.push(resolve)) });
  game.replayPrompt();
  assert.equal(game.waiting, false);
  resolves[0](true); await asyncTurn();
  assert.equal(game.waiting, false);
  assert.equal(game.heard, false);
  resolves[1](true); await asyncTurn();
  assert.equal(game.waiting, false);
  assert.equal(game.heard, true);
  assert.equal(game.modelVisible, true);
  assert.equal(game.assisted, true, "completed replay does not restore independence");
  game.destroy();
});

test("duplicate arrival and next clicks cannot skip a round or claim completion twice", () => {
  const f = runtime(); let done = 0;
  const game = new f.ns.GardenPractice.WaterGarden({ stage: f.stage, items: ITEMS, rounds: 2, say: () => true, onGuidedDone: () => done++, done: () => {} });
  const lane = game.targetLane, token = game.roundToken;
  game.tapGate(lane); const arrival = game.arrivalTokens[lane]; game.arrive(lane, arrival, token); game.arrive(lane, arrival, token);
  assert.equal(game.round, 1);
  f.next.click(); f.next.click();
  assert.equal(game.round, 1, "the second next click is ignored until the next bloom");
  bloom(game, f); game.arrive(game.targetLane, game.arrivalTokens[game.targetLane], game.roundToken);
  assert.equal(game.round, 2);
  f.next.click(); f.next.click();
  assert.equal(done, 1);
  game.destroy();
});

test("free play restores persisted channels, allows every lane, and saves edits once", () => {
  const f = runtime(), saved = { open: [true, false, false], away: [true, false, false], bloomed: [true, false, false] };
  const snapshots = []; let done = 0;
  const game = new f.ns.GardenPractice.WaterGarden({ stage: f.stage, items: ITEMS, freePlay: true, waterState: saved,
    saveWaterState: snapshot => snapshots.push(plain(snapshot)), done: () => done++ });
  assert.equal(game.mode, "free");
  assert.deepEqual(plain(game.open), saved.open); assert.deepEqual(plain(game.away), saved.away); assert.deepEqual(plain(game.bloomed), saved.bloomed);
  assert.equal(f.gates.every(gate => !gate.hidden && !gate.disabled), true);
  game.turnBend(0); assert.deepEqual(snapshots.at(-1).away, [false, false, false]);
  game.tapGate(1); assert.equal(snapshots.at(-1).open[1], true);
  game.finish(); game.finish(); assert.equal(done, 1);
});

test("late audio after cancellation cannot change the lesson", async () => {
  const f = runtime(); let resolveSpeech;
  const game = new f.ns.GardenPractice.WaterGarden({ stage: f.stage, items: ITEMS, say: () => new Promise(resolve => { resolveSpeech = resolve; }) });
  game.destroy(); resolveSpeech(true); await asyncTurn();
  assert.equal(game.heard, false); assert.equal(game.alive, false);
});
