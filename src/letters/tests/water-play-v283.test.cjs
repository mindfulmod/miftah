const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

function runtime() {
  const timers = [], cleared = new Set();
  class El {
    constructor() { this.dataset = {}; this.style = {}; this.attrs = {}; this.hidden = false; this.disabled = false; this.classes = new Set(); this.classList = {
      add: (...xs) => xs.forEach(x => this.classes.add(x)), remove: (...xs) => xs.forEach(x => this.classes.delete(x)),
      toggle: (x, on) => on === undefined ? (this.classes.has(x) ? this.classes.delete(x) : this.classes.add(x)) : on ? this.classes.add(x) : this.classes.delete(x),
      contains: x => this.classes.has(x),
    }; }
    set innerHTML(s) { this._html = String(s); } get innerHTML() { return this._html || ""; }
    setAttribute(k, v) { this.attrs[k] = String(v); } getAttribute(k) { return this.attrs[k] ?? null; }
    querySelector(s) { return this.map?.[s] || null; } querySelectorAll(s) { return this.lists?.[s] || []; }
    focus() { this.focused = true; } getAnimations() { return []; } animate() { return { cancel() {} }; }
    click(detail = 1) { this.onclick?.({ detail, currentTarget: this }); }
  }
  const svg = new El(), parts = Array.from({ length: 3 }, (_, i) => {
    const elbow = new El(), turn = new El(), cue = new El(), water = [new El(), new El(), new El()];
    elbow.map = { ".wg-turn": turn, ".wg-turn-cue": cue }; elbow.lists = { ".wg-elbow-water, .wg-inlet-water, .wg-basin-water": water };
    const board = new El(), bloom = new El(), bud = new El(), flower = new El(), puddle = new El(), flows = [new El(), new El()];
    flows.forEach(el => { el.dataset.lane = String(i); }); puddle.dataset.lane = String(i); flower.map = { ".wg-bloom": bloom, ".wg-bud": bud };
    return { elbow, turn, cue, water, board, bloom, bud, flower, puddle, flows };
  });
  svg.querySelector = s => { const i = Number(s.match(/data-lane="(\d+)"/)?.[1]); const p = parts[i]; if (!p) return null;
    if (s.startsWith(".wg-elbow")) return s.includes(".wg-turn") ? p.turn : p.elbow;
    if (s.startsWith(".wg-gate")) return p.board; if (s.startsWith(".wg-flower")) return p.flower; if (s.startsWith(".wg-puddle")) return p.puddle; return null; };
  svg.querySelectorAll = s => { if (s === ".wg-flow, .wg-flow-light") return parts.flatMap(p => p.flows); if (s === ".wg-puddle") return parts.map(p => p.puddle);
    const i = s.match(/data-lane="(\d+)"/)?.[1]; return i != null && s.includes(".wg-flow") ? parts[Number(i)].flows : []; };
  const gates = Array.from({ length: 3 }, () => new El()), bends = Array.from({ length: 3 }, () => new El());
  const progress = new El(), next = new El(), help = new El(), done = new El(), root = new El(), stage = new El();
  root.map = { ".wg-scene": svg, ".wg-progress": progress, ".wg-next": next, ".wg-help": help, ".wg-done": done };
  root.lists = { ".wg-gate-tag": gates, ".wg-bend": bends, "*": [] }; stage.map = { ".water-garden": root };
  const ns = { GardenPractice: {}, LettersArt: { icon: () => "", fitGlyphs() {} } };
  const sandbox = { window: { MiftahGame: ns }, localStorage: { getItem: () => null, setItem() {} }, Math, Date,
    setTimeout(fn, ms) { const timer = { fn, ms }; timers.push(timer); return timer; }, clearTimeout(timer) { cleared.add(timer); } };
  for (const file of ["LettersLearning.js", "GardenLearning.js", "PracticeLearning.js", "LettersStrength.js", "WaterGarden.js"]) vm.runInNewContext(source(file), sandbox);
  return { ns, stage, gates, bends, next, help, done, timers, cleared, flush(ms) { const ready = timers.filter(t => t.ms === ms && !cleared.has(t)); ready.forEach(t => { cleared.add(t); t.fn(); }); } };
}
const ITEMS = ["ب", "ت", "ث", "ج"].map(id => ({ id, display: id, speak: id }));
function newGame(f, options = {}) { return new f.ns.GardenPractice.WaterGarden({ stage: f.stage, items: ITEMS, say: () => true, ...options }); }
function answer(game, f) {
  const lane = game.targetLane, round = game.roundToken;
  game.tapGate(lane); game.arrive(lane, game.arrivalTokens[lane], round);
}

test("filters locked, prerequisite-blocked, duplicate IDs and duplicate visible glyphs", () => {
  const f = runtime();
  const rows = [
    { id: "b", display: "ب" }, { id: "b-copy", display: "ب" }, { id: "t", display: "ت" },
    { id: "locked", display: "ث", locked: true }, { id: "locked-twin", display: "ث" },
    { id: "future", display: "ج", prerequisiteWorldIds: ["later"] },
  ];
  const game = new f.ns.GardenPractice.WaterGarden({ stage: f.stage, items: rows, worldId: "now", completedWorldIds: [], say: () => true });
  assert.deepEqual(game.items.map(item => item.id), ["b", "t"]);
  assert.deepEqual(new Set(game.offered.filter(Boolean).map(item => item.display)), new Set([game.target.display, game.offered.find(item => item && item.id !== game.target.id).display]));
  assert.equal(game.offered.some(item => item?.id === "locked" || item?.id === "future" || item?.id === "b-copy"), false);
  game.destroy();
});

test("an explicit plan containing no eligible target cancels instead of silently choosing another letter", async () => {
  const f = runtime(); let cancelled = 0;
  const game = new f.ns.GardenPractice.WaterGarden({ stage: f.stage, items: ITEMS, targets: ["not-taught"], say: () => true, cancel: () => cancelled++ });
  await Promise.resolve();
  assert.equal(game.alive, false);
  assert.equal(cancelled, 1);
});

test("matching outcomes unlock listening-two; listening evidence across visits unlocks listening-three", () => {
  const f = runtime(), strength = f.ns.LettersStrength;
  function visit(rounds, sessionId) {
    const learning = new f.ns.LettersLearning.LearningSession(strength, () => 100);
    learning.sessionId = sessionId;
    const game = new f.ns.GardenPractice.WaterGarden({ stage: f.stage, items: ITEMS, rounds, targets: Array(rounds).fill("ب"), strength,
      say: () => true, canListen: () => true,
      prompt: item => learning.beginPrompt(item, { activity: "WaterGarden", skill: "letter-name" }),
      beginRound: (item, skill) => learning.beginPrompt(item, { activity: "WaterGarden", skill }),
      reportOutcome: outcome => learning.report(outcome),
    });
    return game;
  }
  let game = visit(3, "matching-visit");
  assert.equal(game.choiceCount, 2); assert.equal(game.allowRecall, false); assert.equal(game.modelVisible, true);
  for (let i = 0; i < 3; i++) { answer(game, f); if (i < 2) f.next.click(); }
  let profile = strength.skillProfile("ب", "letter-name");
  assert.equal(profile.matching.r, 3);
  game.destroy();

  game = visit(2, "listening-visit-a");
  assert.equal(game.choiceCount, 2); assert.equal(game.allowRecall, true); assert.equal(game.modelVisible, false);
  answer(game, f); assert.equal(strength.skillProfile("ب", "letter-name").listening.r, 1);
  f.next.click(); answer(game, f);
  assert.equal(game.choiceCount, 2, "support is fixed for the full visit even when evidence changes during it");
  game.destroy();

  game = visit(2, "listening-visit-b");
  assert.equal(game.choiceCount, 2, "one successful listening response in this visit has not changed its starting level");
  answer(game, f); f.next.click(); answer(game, f); game.destroy();
  profile = strength.skillProfile("ب", "letter-name");
  assert.equal(profile.listening.r, 4);
  assert.equal(profile.listening.sessions.length, 2);

  const nextVisit = visit(2, "listening-visit-c");
  assert.equal(nextVisit.choiceCount, 3);
  assert.equal(nextVisit.allowRecall, true);
  nextVisit.destroy();
});

test("bend challenge waits for tier three on every planned letter and stays off for beginners", () => {
  const f = runtime();
  const advanced = { strength: { skillProfile: id => ({ listening: { r: 8, streak: 4, sessions: ["one", "two", "three"] } }) } };
  const ready = newGame(f, { ...advanced, targets: ["ب", "ت"], rounds: 4 });
  assert.equal(ready.bendChallenge, true);
  ready.round = 2; ready.startRound();
  assert.ok(ready.activeLanes.every(lane => !f.bends[lane].hidden));
  ready.destroy();

  const oneWeak = newGame(f, { targets: ["ب", "ت"], rounds: 4, strength: { skillProfile: id => id === "ب"
    ? { listening: { r: 8, streak: 4, sessions: ["one", "two", "three"] } }
    : { listening: { r: 4, streak: 2, sessions: ["one", "two"] } } } });
  assert.equal(oneWeak.bendChallenge, false);
  oneWeak.destroy();

  const beginner = newGame(f, { ...advanced, beginner: true, targets: ["ب", "ت"], rounds: 4 });
  assert.equal(beginner.bendChallenge, false);
  assert.equal(beginner.allowRecall, false);
  beginner.destroy();
});

test("hearing and help are recorded in separate evidence buckets", () => {
  const f = runtime(), strength = f.ns.LettersStrength, rows = [];
  const learning = new f.ns.LettersLearning.LearningSession(strength, () => 100);
  const game = new f.ns.GardenPractice.WaterGarden({ stage: f.stage, items: ITEMS, strength, targets: ["ب", "ت"], rounds: 2,
    canListen: () => true, say: () => true,
    prompt: item => learning.beginPrompt(item, { activity: "WaterGarden", skill: "letter-name" }),
    beginRound: (item, skill) => learning.beginPrompt(item, { activity: "WaterGarden", skill }),
    reportOutcome: raw => { const accepted = learning.report(raw); if (accepted) rows.push(accepted); return accepted; },
  });
  assert.equal(game.modelVisible, true, "no history begins with visible matching");
  answer(game, f);
  assert.equal(rows[0].evidence, "supported_visible_matching");
  assert.equal(strength.skillProfile("ب", "letter-name").matching.r, 1);
  game.destroy();

  const fHelp = runtime(), helpedStrength = fHelp.ns.LettersStrength;
  const helpedLearning = new fHelp.ns.LettersLearning.LearningSession(helpedStrength, () => 100);
  const helped = new fHelp.ns.GardenPractice.WaterGarden({ stage: fHelp.stage, items: ITEMS, strength: helpedStrength, rounds: 1,
    targets: ["ب"], say: () => true,
    prompt: item => helpedLearning.beginPrompt(item, { activity: "WaterGarden", skill: "letter-name" }),
    beginRound: (item, skill) => helpedLearning.beginPrompt(item, { activity: "WaterGarden", skill }), reportOutcome: raw => helpedLearning.report(raw),
  });
  helped.help.onclick(); answer(helped, f);
  assert.equal(helpedStrength.skillProfile("ب", "letter-name").assisted.r, 1);
  helped.destroy();

  const fHeard = runtime(), heardStrength = fHeard.ns.LettersStrength;
  for (let i = 0; i < 3; i++) heardStrength.recordOutcome({ itemId: "ب", evidence: "supported_visible_matching", correct: true,
    affectsStrength: true, skill: "letter-name", activity: "WaterGarden", sessionId: "previous-match-visit" });
  const listeningLearning = new fHeard.ns.LettersLearning.LearningSession(heardStrength, () => 100);
  const heard = new fHeard.ns.GardenPractice.WaterGarden({ stage: fHeard.stage, items: ITEMS, strength: heardStrength, rounds: 1,
    targets: ["ب"], canListen: () => true, say: () => true,
    prompt: item => listeningLearning.beginPrompt(item, { activity: "WaterGarden", skill: "letter-name" }),
    beginRound: (item, skill) => listeningLearning.beginPrompt(item, { activity: "WaterGarden", skill }),
    reportOutcome: raw => listeningLearning.report(raw),
  });
  assert.equal(heard.allowRecall, true);
  assert.equal(heard.modelVisible, false);
  answer(heard, fHeard);
  assert.equal(heardStrength.skillProfile("ب", "letter-name").listening.r, 1);
  heard.destroy();
});

test("replaying an active Water Garden prompt reveals support and remembers that letter for this visit", async () => {
  const f = runtime(), resolvers = [], outcomes = [];
  const game = newGame(f, { targets: ["ب", "ت", "ب"], rounds: 3, canListen: () => true,
    strength: { skillProfile: () => ({ listening: { r: 8, streak: 4, sessions: ["a", "b", "c"] } }) },
    say: () => new Promise(resolve => resolvers.push(resolve)), reportOutcome: outcome => outcomes.push(outcome) });
  assert.equal(game.waiting, true);
  game.replayPrompt();
  assert.equal(game.modelVisible, true);
  assert.equal(game.waiting, false);
  assert.equal(game.assisted, true);
  resolvers[0](true); await new Promise(resolve => setImmediate(resolve));
  assert.equal(game.heard, false, "speech from before replay cannot restore independent listening");
  answer(game, f);
  assert.equal(outcomes[0].independent, false);
  f.next.click();
  assert.equal(game.target.id, "ت", "the unrelated target keeps its own listening plan");
  assert.equal(game.choiceCount, 3, "help for one target does not lower another target's planned difficulty");
  resolvers.at(-1)(true); await new Promise(resolve => setImmediate(resolve));
  assert.equal(game.modelVisible, false);
  assert.equal(game.assisted, false);
  assert.equal(game.waiting, false, "second prompt finished playing");
  assert.equal(f.gates[game.targetLane].disabled, false, "second target is answerable");
  answer(game, f); f.next.click();
  assert.equal(outcomes[1].independent, true, "the unrelated target can still be answered independently");
  assert.equal(game.modelVisible, true, "the helped letter remains visible when it returns during this visit");
  assert.ok(game.offered.filter(Boolean).length <= 2);
  assert.ok(f.bends.every(bend => bend.hidden), "returning supported target has no added routing challenge");
  game.destroy();
});

test("Water Garden replay during a resolved round cannot affect the next target", () => {
  const f = runtime();
  const game = newGame(f, { targets: ["ب", "ت"], rounds: 2, say: () => true });
  answer(game, f);
  const assisted = game.assisted;
  game.replayPrompt();
  assert.equal(game.assisted, assisted);
  f.next.click();
  assert.equal(game.modelVisible, true, "the next target starts with its planned visible support");
  assert.equal(game.assisted, false);
  game.destroy();
});
