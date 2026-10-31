const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..", "..", "..");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const palette = (() => {
  const art = fs.readFileSync(path.join(root, "ART.md"), "utf8");
  return new Set((art.slice(art.indexOf("## 2."), art.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()));
})();
const off = text => (text.match(/#[0-9a-fA-F]{6}/g) || []).map(h => h.toLowerCase()).filter(h => !palette.has(h));

function huntHarness(options = {}) {
  const timers = new Map();
  let timerId = 0;
  const setTimer = (fn, ms) => { const id = ++timerId; timers.set(id, { fn, ms }); return id; };
  const clearTimer = id => timers.delete(id);
  const observers = [];
  class Observer {
    constructor(fn) { this.fn = fn; this.disconnected = false; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
    fire() { if (!this.disconnected) this.fn(); }
  }
  class ClassList {
    constructor() { this.values = new Set(); }
    add(...names) { names.forEach(name => this.values.add(name)); }
    remove(...names) { names.forEach(name => this.values.delete(name)); }
    contains(name) { return this.values.has(name); }
    toggle(name, force) { const add = force === undefined ? !this.contains(name) : !!force; add ? this.add(name) : this.remove(name); return add; }
  }
  class Element {
    constructor(dataset = {}) { this.dataset = dataset; this.classList = new ClassList(); this.listeners = {}; this.attrs = {}; this.hidden = false; this.disabled = false; this.focused = false; this.children = []; }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    setAttribute(name, value) { this.attrs[name] = String(value); }
    getAttribute(name) { return this.attrs[name] ?? null; }
    querySelector(selector) {
      if (selector === ".hunt-thing") return this.thing ||= new Element();
      if (selector.startsWith(".hunt-spot[data-spot=\"")) return this.svg?.querySelector(selector) || null;
      return null;
    }
    querySelectorAll(selector) { return selector === "*" ? [] : []; }
    focus() { this.focused = true; }
    animate() { return { cancel() {} }; }
    getAnimations() { return []; }
    fire(type, event = {}) { (this.listeners[type] || []).forEach(fn => fn({ type, ...event, preventDefault() {} })); }
  }
  class Svg extends Element {
    constructor(html) {
      super();
      this.spots = [...html.matchAll(/<g class="hunt-spot[^\"]*" data-spot="(\d+)" data-kind="([^\"]+)"[^>]*aria-label="([^\"]*)">/g)].map(m => {
        const el = new Element({ spot: m[1], kind: m[2] }); el.svg = this; el.hasLetter = m[3].startsWith("Letter "); return el;
      });
    }
    querySelectorAll(selector) { return selector === ".hunt-spot" ? this.spots : []; }
    querySelector(selector) {
      if (selector === ".hunt-spot:focus") return this.spots.find(spot => spot.focused) || null;
      const match = selector.match(/\.hunt-spot\[data-spot="?(\d+)"?\]/);
      if (match) return this.spots.find(spot => Number(spot.dataset.spot) === Number(match[1])) || null;
      if (selector === '.hunt-spot[tabindex="0"]') return this.spots.find(spot => spot.attrs.tabindex === "0") || null;
      return null;
    }
  }
  class Root extends Element {
    constructor(html) {
      super(); this.html = html; this.svg = new Svg(html); this.svg.root = this;
      this.help = new Element(); this.next = new Element(); this.basket = new Element();
      this.svg.spots.forEach(spot => { spot.svg = this.svg; });
    }
    querySelector(selector) {
      if (selector === ".hunt-scene") return this.svg;
      if (selector === ".hunt-help") return this.help;
      if (selector === ".hunt-next") return this.next;
      if (selector === ".hunt-basket") return this.basket;
      return this.svg.querySelector(selector);
    }
    querySelectorAll(selector) { return selector === "*" ? [this.svg, ...this.svg.spots, this.help, this.next, this.basket] : []; }
  }
  const stage = {
    clientWidth: 800, clientHeight: 600,
    set innerHTML(value) { this.html = value; this.root = new Root(value); },
    querySelector(selector) { return selector === ".hunt-play" ? this.root : null; },
  };
  const items = options.items || ["ا", "ب", "ت", "ث", "ج", "ح"].map(c => ({ id: c, display: c }));
  const reports = [], prompts = [], begun = [], progress = [];
  let done = 0, canceled = 0;
  const ns = options.learningNs || { PracticeLearning: {
    plan: (ctx, pool, skill, count) => options.plan ? options.plan(ctx, pool, skill, count) : pool.slice(0, count),
    profile: (ctx, item) => options.profile ? options.profile(ctx, item) : { choiceCount: ctx.beginner ? 2 : 3, promptMode: ctx.beginner ? "match" : "listen" },
  } };
  const window = { MiftahGame: ns };
  const context = vm.createContext({ window, setTimeout: setTimer, clearTimeout: clearTimer, ResizeObserver: Observer, Math, Promise, Date,
    performance: { now: () => 100 }, localStorage: { getItem: () => null, setItem() {} }, console });
  if (options.realLearning && !options.learningNs) {
    for (const file of ["LettersLearning.js", "GardenLearning.js", "PracticeLearning.js", "LettersStrength.js"]) vm.runInContext(source(file), context);
  }
  vm.runInContext(source("HuntPlayArt.js"), context);
  vm.runInContext(source("LetterHunt.js"), context);
  let learning = null;
  if (options.realLearning) {
    learning = new ns.LettersLearning.LearningSession(ns.LettersStrength, () => 100);
    learning.sessionId = options.sessionId || "hunt-visit";
  }
  const ctx = {
    stage, items, targets: options.targets, beginner: options.beginner, choiceCount: options.choiceCount,
    allowRecall: options.allowRecall, strength: learning ? ns.LettersStrength : undefined, supportedItemIds: options.supportedItemIds || [],
    worldId: "here", completedWorldIds: [], land: "lagoon", canListen: options.canListen || (() => true),
    say: options.say || (() => true), prompt: item => prompts.push(item),
    reportOutcome: item => { const accepted = learning ? learning.report(item) : item; if (accepted) reports.push(accepted); return accepted; },
    beginRound: (...args) => { begun.push(args); learning?.beginPrompt(args[0], { activity: "LetterHunt", skill: args[1] }); },
    setRoundProgress: (...args) => progress.push(args), done: () => done++, cancel: () => canceled++,
    correct() {}, sfx() {}, confettiAt() {}, pet: { cheer() {} }, reducedMotion: () => true,
  };
  const Hunt = ns.GardenPractice.LetterHunt;
  const game = new Hunt(ctx);
  const run = (fn) => { for (const [id, timer] of [...timers]) { timers.delete(id); fn ? fn(timer) : timer.fn(); } };
  return { game, ctx, ns, stage, timers, observers, reports, prompts, begun, progress, items, learning, run, done: () => done, canceled: () => canceled,
    tap(i, event = {}) { const spot = stage.root?.svg.spots[i]; spot?.fire("click", event); },
    spotFor(id) { return game.letters.findIndex(item => item?.id === id); },
  };
}

test("v284 Hunt filters known glyphs, validates the planned targets, and cancels an unusable visit", async () => {
  const items = [
    { id: "a", display: "ا" }, { id: "a-copy", display: "ا" }, { id: "blocked-alias", display: "ب", taught: false },
    { id: "prereq-alias", display: "ت", prerequisiteWorldIds: ["later"] }, { id: "locked", display: "ث", locked: true },
    { id: "same-world", display: "ج", prerequisiteWorldIds: ["here"] }, { id: "h", display: "ح" },
  ];
  const h = huntHarness({ items, plan: (_ctx, pool) => [pool[0], { id: "blocked-alias", display: "ب" }, pool[1], pool[2]], targets: ["a", "same-world", "h"], canListen: () => true });
  assert.deepEqual(h.game.items.map(item => item.id), ["a", "same-world", "h"]);
  assert.deepEqual(Array.from(h.game.targets, item => item.id), ["a", "same-world", "h", "a"]);
  assert.equal(h.game.letters.filter(Boolean).length, 3);
  assert.equal(new Set(h.game.letters.filter(Boolean).map(item => item.display)).size, 3);
  assert.equal(h.begun.length, 1);
  const empty = huntHarness({ items, targets: ["missing"], plan: () => [] });
  await Promise.resolve();
  assert.equal(empty.canceled(), 1);
  assert.equal(empty.done(), 0);
  assert.equal(empty.game.alive, false);
  const intentionallyEmpty = huntHarness({ targets: [] });
  await Promise.resolve();
  assert.equal(intentionallyEmpty.canceled(), 1, 'an explicit empty plan does not silently start another task');
  assert.equal(intentionallyEmpty.done(), 0);
  assert.equal(intentionallyEmpty.begun.length, 0);
});

test("v284 Hunt freezes a three-choice, four-round plan; found objects go to the basket and next is child-led", () => {
  let planned = 0;
  const h = huntHarness({ plan: (_ctx, pool, skill, count) => { planned++; assert.equal(skill, "letter-name"); assert.equal(count, 4); return pool.slice(0, 4); } });
  assert.equal(planned, 1);
  assert.equal(h.game.targets.length, 4);
  assert.equal(h.game.choiceCount, 3);
  assert.equal(h.game.allowRecall, true);
  assert.equal(h.game.letters.filter(Boolean).length, 3);
  assert.equal(h.game.letters.filter(Boolean).length, h.game.choiceCount);
  assert.equal(h.stage.root.svg.spots.filter(spot => spot.hasLetter).length, 3);
  const frozenTargets = h.game.targets.map(item => item.id);
  for (let round = 0; round < 4; round++) {
    const targetId = h.game.target.id;
    h.tap(h.spotFor(targetId));
    assert.equal(h.reports.at(-1).correct, true);
    assert.equal(h.reports.at(-1).independent, true);
    assert.equal(h.game.collected.at(-1).id, targetId);
    assert.equal(h.game.busy, true);
    assert.equal(h.done(), 0, "a find never advances automatically");
    if (round < 3) {
      h.game.continue();
      assert.equal(h.game.targets.map(item => item.id).join(","), frozenTargets.join(","));
      assert.equal(h.game.letters.filter(Boolean).length, 3);
      assert.equal(h.game.letters.filter(Boolean).length, h.game.choiceCount);
      assert.equal(h.stage.root.svg.spots.filter(spot => spot.hasLetter && !spot.classList.contains("is-found")).length, 3);
    }
  }
  assert.equal(h.game.index, 3);
  h.game.continue(); h.game.continue();
  assert.equal(h.done(), 1);
});

test("v284 Hunt uses two choices for beginners and never awards evidence for plain props or repeated misses", () => {
  const h = huntHarness({ beginner: true, choiceCount: 3, canListen: () => false, say: () => false });
  assert.equal(h.game.targets.length, 3);
  assert.equal(h.game.choiceCount, 2);
  assert.equal(h.game.allowRecall, false);
  assert.ok(h.prompts[0]?.id, "muted matching starts with the model visible");
  const emptySpot = h.game.letters.findIndex(item => !item);
  h.tap(emptySpot);
  assert.equal(h.reports.length, 0);
  const wrongSpot = h.game.letters.findIndex(item => item && item.id !== h.game.target.id);
  h.tap(wrongSpot);
  assert.equal(h.reports.length, 1);
  assert.equal(h.reports[0].correct, false);
  assert.equal(h.reports[0].independent, false);
  h.tap(wrongSpot);
  assert.equal(h.reports.length, 1, "the same wrong spot cannot generate duplicate evidence");
});

test("v284 Hunt requires confirmed speech, preserves confirmation through replay, and falls back after six seconds", async () => {
  let resolveSpeech;
  const h = huntHarness({ say: () => new Promise(resolve => { resolveSpeech = resolve; }) });
  assert.equal(h.game.waiting, true);
  const targetSpot = h.spotFor(h.game.target.id);
  h.tap(targetSpot);
  assert.equal(h.reports.length, 0, "choices are disabled while speech is pending");
  resolveSpeech(true);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(h.game.heard, true);
  h.game.replayPrompt();
  assert.equal(h.game.heard, true, "replay does not clear prior confirmed speech");
  assert.equal(h.game.assisted, true);
  assert.equal(h.game.modelVisible, true);
  resolveSpeech(false);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(h.game.heard, true);
  h.tap(h.spotFor(h.game.target.id));
  assert.equal(h.reports.at(-1).independent, false, "replay makes this response assisted even after confirmed speech");

  let lateResolve;
  const timeout = huntHarness({ say: () => new Promise(resolve => { lateResolve = resolve; }) });
  const deadline = [...timeout.timers.entries()].find(([, timer]) => timer.ms === 6000)?.[0];
  assert.ok(deadline);
  assert.equal(timeout.timers.get(deadline).ms, 6000, "speech timeout is six seconds even when reduced motion is enabled");
  const fireDeadline = timeout.timers.get(deadline).fn; timeout.timers.delete(deadline); fireDeadline();
  assert.equal(timeout.game.assisted, true);
  assert.equal(timeout.game.heard, false);
  lateResolve(true);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(timeout.game.heard, false, "a late speech callback cannot undo assisted fallback");
  const wrong = timeout.game.letters.findIndex(item => item && item.id !== timeout.game.target.id);
  timeout.tap(wrong);
  assert.equal(timeout.reports.at(-1).independent, false);
});

test("v284 real learning integration: matching two, listening two, then listening three across visits", () => {
  const options = { realLearning: true, targets: ["ب", "ب", "ب", "ب"], items: ["ب", "ت", "ث", "ج"].map(id => ({ id, display: id })), allowRecall: true };
  const findCorrect = game => game.letters.findIndex(item => item?.id === game.target.id);
  const answer = game => { game.tap(findCorrect(game)); game.continue(); };
  let h = huntHarness({ ...options, sessionId: "match" });
  assert.equal(h.game.choiceCount, 2);
  assert.equal(h.game.allowRecall, false);
  for (let i = 0; i < 3; i++) answer(h.game);
  let profile = h.ns.LettersStrength.skillProfile("ب", "letter-name");
  assert.equal(profile.matching.r, 3);
  assert.equal(profile.listening?.r || 0, 0);
  h.game.destroy();

  h = huntHarness({ ...options, learningNs: h.ns, sessionId: "listen-a" });
  assert.equal(h.game.choiceCount, 2);
  assert.equal(h.game.allowRecall, true);
  assert.equal(h.game.modelVisible, false);
  for (let i = 0; i < 2; i++) answer(h.game);
  assert.equal(h.ns.LettersStrength.skillProfile("ب", "letter-name").listening.r, 2);
  h.game.destroy();

  h = huntHarness({ ...options, learningNs: h.ns, sessionId: "listen-b" });
  assert.equal(h.game.choiceCount, 2, "the second listening visit starts at two choices");
  for (let i = 0; i < 2; i++) {
    answer(h.game);
    assert.equal(h.game.choiceCount, 2, "support stays fixed after evidence changes during a visit");
  }
  profile = h.ns.LettersStrength.skillProfile("ب", "letter-name");
  assert.equal(profile.listening.r, 4);
  assert.equal(profile.listening.sessions.length, 2);
  h.game.destroy();

  h = huntHarness({ ...options, learningNs: h.ns, sessionId: "listen-c" });
  assert.equal(h.game.choiceCount, 3);
  assert.equal(h.game.allowRecall, true);
  h.game.destroy();

  h = huntHarness({ ...options, learningNs: h.ns, sessionId: "helped", supportedItemIds: ["ب"] });
  assert.equal(h.game.choiceCount, 2);
  assert.equal(h.game.allowRecall, false, "a supported item returns to visible matching");
  h.game.help();
  answer(h.game);
  profile = h.ns.LettersStrength.skillProfile("ب", "letter-name");
  assert.equal(profile.assisted.r, 1);
  assert.equal(profile.listening.r, 4, "a helped response cannot add listening evidence");
  h.game.destroy();
});

test("v284 Hunt resize preserves question and progress; stale handlers and destroyed speech cannot act", async () => {
  let resolveSpeech;
  const h = huntHarness({ say: () => new Promise(resolve => { resolveSpeech = resolve; }) });
  const oldSpot = h.stage.root.svg.spots.find(spot => spot.hasLetter);
  const oldClick = oldSpot.listeners.click[0];
  const targetId = h.game.target.id;
  h.stage.clientWidth = 560; h.stage.clientHeight = 860;
  h.observers[0].fire();
  assert.equal(h.game.target.id, targetId);
  assert.equal(h.game.letters.filter(Boolean).length, 3);
  const reports = h.reports.length;
  oldClick({ type: "click", detail: 1 });
  assert.equal(h.reports.length, reports, "pre-resize listeners are invalidated");
  h.game.destroy();
  assert.equal(h.observers[0].disconnected, true);
  assert.equal(h.timers.size, 0, "destroy clears speech deadlines");
  resolveSpeech(true);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(h.game.heard, false);
  assert.equal(h.game.alive, false);
});

test("replaying an active Hunt prompt reveals support, cancels speech evidence, and remembers the helped target", async () => {
  let resolvers = [];
  const h = huntHarness({ targets: ["ب", "ت", "ب"], allowRecall: true,
    profile: () => ({ choiceCount: 3, promptMode: "listen" }),
    say: () => new Promise(resolve => resolvers.push(resolve)) });
  assert.equal(h.game.waiting, true);
  h.game.replayPrompt();
  assert.equal(h.game.modelVisible, true);
  assert.equal(h.game.waiting, false);
  assert.equal(h.game.assisted, true);
  resolvers[0](true); await Promise.resolve(); await Promise.resolve();
  assert.equal(h.game.heard, false, "speech started before replay cannot undo its support");
  const correct = h.spotFor(h.game.target.id); h.tap(correct);
  assert.equal(h.reports[0].independent, false);
  h.game.continue();
  assert.equal(h.game.target.id, "ت", "the unrelated target keeps its own listening plan");
  assert.equal(h.game.choiceCount, 3, "help for one target does not lower another target's planned difficulty");
  resolvers.at(-1)(true); await Promise.resolve(); await Promise.resolve();
  assert.equal(h.game.modelVisible, false);
  assert.equal(h.game.assisted, false);
  h.tap(h.spotFor(h.game.target.id)); h.game.continue();
  assert.equal(h.reports[1].independent, true, "the unrelated target can still be answered independently");
  assert.equal(h.game.modelVisible, true, "a helped target returns with its model visible");
  assert.ok(h.game.letters.filter(Boolean).length <= 2);
  h.game.destroy();
});

test("Hunt replay while busy cannot change outcomes or help a later target", () => {
  const h = huntHarness({ targets: ["ب", "ت"], rounds: 2, say: () => true });
  h.tap(h.spotFor(h.game.target.id));
  const count = h.reports.length, assisted = h.game.assisted;
  h.game.replayPrompt();
  assert.equal(h.reports.length, count);
  assert.equal(h.game.assisted, assisted);
  h.game.continue();
  assert.equal(h.game.assisted, false);
  h.tap(h.spotFor(h.game.target.id)); h.game.continue();
  assert.equal(h.reports.length, 2);
});

test("v284 Hunt clears an in-flight letter before rerender and teardown so no overlay or hidden basket slot remains", () => {
  const h = huntHarness();
  let canceled = 0, removed = 0;
  const target = { style: { visibility: "hidden" } };
  const flight = { element: { remove() { removed++; } }, target, animation: { cancel() { canceled++; } } };
  h.game.flight = flight;
  h.stage.clientWidth = 560; h.stage.clientHeight = 860;
  h.game.resize();
  assert.equal(canceled, 1);
  assert.equal(removed, 1);
  assert.equal(target.style.visibility, "");
  assert.equal(h.game.flight, null);

  const second = { style: { visibility: "hidden" } };
  h.game.flight = { element: { remove() { removed++; } }, target: second, animation: { cancel() { canceled++; } } };
  h.game.destroy();
  assert.equal(canceled, 2);
  assert.equal(removed, 2);
  assert.equal(second.style.visibility, "");
  assert.equal(h.game.flight, null);
});

test("v284 Hunt keeps the six-land picture and native prop art within the palette", () => {
  const window = { MiftahGame: {} };
  const context = vm.createContext({ window, Math });
  vm.runInContext(source("HuntPlayArt.js"), context);
  vm.runInContext(source("LetterHunt.js"), context);
  const Hunt = window.MiftahGame.GardenPractice.LetterHunt;
  for (const [land, spec] of Object.entries(Hunt.LANDS)) {
    assert.equal(spec.spots.length, 6, land);
    for (const [, , kind] of spec.spots) assert.ok(Hunt.THINGS[kind], `${land}: ${kind}`);
    const scene = Hunt.scene(land, [{ id: "a", display: "ا" }, null, { id: "b", display: "ب" }, null, null, null]);
    assert.equal((scene.match(/class="hunt-label"/g) || []).length, 2);
    assert.deepEqual(off(scene), [], land);
    assert.match(Hunt.scene(land, [], true), /class="hunt-scene is-portrait"/);
  }
  assert.equal(Object.keys(window.MiftahGame.HuntPlayArt.things).length, 11);
  assert.deepEqual(off(source("HuntPlayArt.js")), []);
});

test("v6 Letter Hunt remains available only after the child has enough known letters", () => {
  const game = source("LettersGame.js");
  assert.match(game, /'LetterDelivery','LetterHunt',/);
  assert.match(game, /if\(this\.petKnowledge\(\)\.length>=3\)choices\.push\('LetterHunt'\);/);
});

