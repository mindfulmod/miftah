const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..", "..", "..");
const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

function friendHarness(options = {}) {
  const timers = new Map(); let timerId = 0;
  const setTimer = (fn, ms) => { const id = ++timerId; timers.set(id, { fn, ms }); return id; };
  const clearTimer = id => timers.delete(id);
  class ClassList {
    constructor() { this.values = new Set(); }
    add(...items) { items.forEach(item => this.values.add(item)); }
    remove(...items) { items.forEach(item => this.values.delete(item)); }
    contains(item) { return this.values.has(item); }
    toggle(item, force) { const add = force === undefined ? !this.contains(item) : !!force; add ? this.add(item) : this.remove(item); return add; }
  }
  class Element {
    constructor() { this.classList = new ClassList(); this.listeners = {}; this.attrs = {}; this.disabled = false; this.hidden = false; this.focused = false; this.children = []; }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    setAttribute(name, value) { this.attrs[name] = String(value); }
    getAttribute(name) { return this.attrs[name] ?? null; }
    querySelector(selector) { if (selector === ".lf") return this.friendArt ||= new Element(); return null; }
    querySelectorAll(selector) { return selector === "*" || selector === ".ff-card" ? this.children : []; }
    focus() { this.focused = true; }
    animate() { return { cancel() {} }; }
    getAnimations() { return []; }
    fire(type, event = {}) { (this.listeners[type] || []).forEach(fn => fn({ type, detail: 1, ...event, preventDefault() {} })); this[`on${type}`]?.({ type, detail: 1, ...event, preventDefault() {} }); }
  }
  class Root extends Element {
    constructor(html) {
      super(); this.html = html;
      this.theatre = new Element(); this.board = new Element(); this.help = new Element(); this.next = new Element(); this.progress = new Element();
      this.cards = [...html.matchAll(/<button type="button" class="ff-card" data-i="(\d+)"/g)].map(() => new Element());
      this.board.children = this.cards;
      this.cards.forEach(card => { card.friendArt = new Element(); this.children.push(card); });
      this.children.push(this.theatre, this.help, this.next, this.progress);
    }
    querySelector(selector) {
      return ({ ".ff-theatre": this.theatre, ".ff-choices": this.board, ".ff-help": this.help, ".ff-next": this.next, ".ff-progress": this.progress })[selector] || null;
    }
    querySelectorAll(selector) { return selector === "*" ? this.children : []; }
  }
  const stage = { set innerHTML(html) { this.html = html; this.root = new Root(html); }, querySelector(selector) { return selector === ".ff-play" ? this.root : null; } };
  const items = options.items || ["ب", "ت", "ث", "ج"].map(c => ({ id: c, display: c }));
  const reports = [], prompted = [], spoken = [], begun = [], progress = [], sounds = [];
  let done = 0, canceled = 0;
  const ns = options.learningNs || {
    PracticeLearning: {
      plan: (ctx, pool, skill, count) => options.plan ? options.plan(ctx, pool, skill, count) : pool.slice(0, count),
      profile: (ctx, item, skill) => options.profile ? options.profile(ctx, item, skill) : { choiceCount: ctx.beginner ? 2 : 3, promptMode: ctx.beginner ? "match" : "listen" },
    },
    LetterFriends: {
      FRIENDS: Object.fromEntries(["ا", "ب", "ت", "ث", "ج", "ح", "خ", "د"].map(c => [c, {}])),
      get: c => ({ en: `friend ${c}`, call: `call-${c}` }), item: c => ({ id: `voice-${c}`, display: c }),
      art: (c, opts = {}) => `<svg class="lf ${opts.mode === "plain" ? "is-plain" : ""}" data-friend="${c}"></svg>`,
    },
    LettersArt: { icon: () => "" }, FriendPlayArt: { booth: () => "", perch: () => "", eye: () => "" },
  };
  const window = { MiftahGame: ns };
  const context = vm.createContext({ window, setTimeout: setTimer, clearTimeout: clearTimer, Math, Promise, Date, console });
  let learning = null;
  if (options.realLearning && !options.learningNs) {
    for (const file of ["LettersLearning.js", "GardenLearning.js", "PracticeLearning.js", "LettersStrength.js"]) vm.runInContext(source(file), context);
  }
  if (options.includeArt !== false) vm.runInContext(source("FriendPlayArt.js"), context);
  vm.runInContext(source("FriendFind.js"), context);
  if (options.realLearning) {
    learning = new ns.LettersLearning.LearningSession(ns.LettersStrength, () => 100);
    learning.sessionId = options.sessionId || "friend-visit";
  }
  const ctx = {
    stage, items, known: options.known, targets: options.targets, rounds: options.rounds, beginner: options.beginner,
    choiceCount: options.choiceCount, allowRecall: options.allowRecall, supportedItemIds: options.supportedItemIds || [],
    worldId: options.worldId || "here", completedWorldIds: options.completedWorldIds ?? [], canListen: options.canListen || (() => true),
    say: options.say || (item => { spoken.push(item); return true; }), prompt: item => prompted.push(item),
    reportOutcome: outcome => { const saved = learning ? learning.report(outcome) : outcome; if (saved) reports.push(saved); return saved; },
    beginRound: (...args) => { begun.push(args); learning?.beginPrompt(args[0], { activity: "FriendFind", skill: args[1] }); },
    setRoundProgress: (...args) => progress.push(args), done: () => done++, cancel: () => canceled++,
    correct() {}, sfx: sound => sounds.push(sound), confettiAt() {}, pet: { cheer() {} }, reducedMotion: () => options.reducedMotion ?? true,
  };
  const game = new ns.GardenPractice.FriendFind(ctx);
  return {
    game, ctx, ns, stage, timers, reports, prompted, spoken, begun, progress, sounds, items, learning,
    done: () => done, canceled: () => canceled,
    tap(index, detail = 1) { stage.root?.cards[index]?.fire("click", { detail }); },
    correctIndex() { return game.offered.findIndex(item => item.id === game.target.id); },
    wrongIndex() { return game.offered.findIndex(item => item.id !== game.target.id); },
    fireTimer(id) { const timer = timers.get(id); if (!timer) return false; timers.delete(id); timer.fn(); return true; },
    fireTimers(ms) { for (const [id, timer] of [...timers]) if (timer.ms === ms) this.fireTimer(id); },
  };
}

test("v285 Friend filters target and known pools by teaching, alias, prerequisite, and plan validity", async () => {
  const items = [
    { id: "a", display: "ب" }, { id: "target-alias", display: "ت", taught: false },
    { id: "good-alias", display: "ث" }, { id: "blocked-alias", display: "ث", locked: true },
    { id: "future", display: "ج", prerequisiteWorldIds: ["later"] }, { id: "same-world", display: "ح", prerequisiteWorldIds: ["here"] },
  ];
  const h = friendHarness({ items: [items[0], items[4], items[5]], known: items.slice(1), plan: (_ctx, pool) => [pool[0], { id: "future", display: "ج" }, pool[1]] });
  assert.deepEqual(Array.from(h.game.pool, item => item.id), ["a", "same-world"]);
  assert.deepEqual(Array.from(h.game.items, item => item.id), ["a", "same-world"]);
  assert.deepEqual(Array.from(h.game.targets, item => item.id), ["a", "same-world", "a", "same-world"]);
  assert.equal(h.game.offered.length, 2);
  assert.ok(h.game.offered.every(item => ["a", "same-world"].includes(item.id)));

  const invalid = friendHarness({ targets: ["missing"], plan: () => [{ id: "nope", display: "خ" }] });
  await Promise.resolve();
  assert.equal(invalid.canceled(), 1); assert.equal(invalid.done(), 0); assert.equal(invalid.game.alive, false);
  const empty = friendHarness({ targets: [], plan: () => [] });
  await Promise.resolve();
  assert.equal(empty.canceled(), 1); assert.equal(empty.begun.length, 0); assert.equal(empty.done(), 0);
});

test("v285 Friend freezes its plan and support tier for a child-led three or four round visit", () => {
  let planned = 0;
  const h = friendHarness({ beginner: true, plan: (_ctx, pool, skill, count) => { planned++; assert.equal(skill, "friend"); assert.equal(count, 3); return pool.slice(0, 2); } });
  assert.equal(planned, 1); assert.equal(h.game.rounds, 3); assert.equal(h.game.choiceCount, 2); assert.equal(h.game.allowRecall, false);
  const plan = Array.from(h.game.targets, item => item.id).join(",");
  for (let round = 0; round < 3; round++) {
    h.tap(h.correctIndex());
    assert.equal(h.reports.at(-1).correct, true); assert.equal(h.game.busy, true); assert.equal(h.done(), 0);
    assert.equal(h.stage.root.next.hidden, false);
    h.game.continue();
    if (round < 2) assert.equal(Array.from(h.game.targets, item => item.id).join(","), plan);
  }
  h.game.continue(); h.game.continue();
  assert.equal(h.done(), 1);

  const normal = friendHarness({ rounds: 4 });
  assert.equal(normal.game.rounds, 4);
  for (let round = 0; round < 4; round++) { normal.tap(normal.correctIndex()); normal.game.continue(); }
  normal.game.continue(); assert.equal(normal.done(), 1);
});

test("v285 Friend advances match-two to listen-two to listen-three only between visits", () => {
  const items = ["ب", "ت", "ث", "ج"].map(c => ({ id: c, display: c }));
  const options = { realLearning: true, items, targets: ["ب", "ب", "ب", "ب"], allowRecall: true, canListen: () => true };
  const solveRounds = (h, count) => {
    for (let i = 0; i < count; i++) { h.tap(h.correctIndex()); h.game.continue(); }
  };
  let h = friendHarness({ ...options, sessionId: "match" });
  assert.equal(h.game.choiceCount, 2); assert.equal(h.game.allowRecall, false);
  solveRounds(h, 3);
  assert.equal(h.ns.LettersStrength.skillProfile("ب", "friend").matching.r, 3);
  h.game.destroy();

  h = friendHarness({ ...options, learningNs: h.ns, sessionId: "listen-a" });
  assert.equal(h.game.choiceCount, 2); assert.equal(h.game.allowRecall, true); assert.equal(h.game.mode, "listen");
  solveRounds(h, 2); h.game.destroy();
  assert.equal(h.ns.LettersStrength.skillProfile("ب", "friend").listening.r, 2);

  h = friendHarness({ ...options, learningNs: h.ns, sessionId: "listen-b" });
  assert.equal(h.game.choiceCount, 2);
  for (let i = 0; i < 2; i++) { h.tap(h.correctIndex()); h.game.continue(); assert.equal(h.game.choiceCount, 2); }
  h.game.destroy();
  h = friendHarness({ ...options, learningNs: h.ns, sessionId: "listen-c" });
  assert.equal(h.game.choiceCount, 3); assert.equal(h.game.allowRecall, true);
});

test("v285 Friend needs confirmed name playback for independent listening and fails safe on timeout or rejection", async () => {
  let resolve;
  const pending = friendHarness({ allowRecall: true, say: () => new Promise(r => { resolve = r; }) });
  assert.equal(pending.game.waiting, true);
  pending.tap(pending.correctIndex()); assert.equal(pending.reports.length, 0, "pending speech disables all choice evidence");
  resolve(true); await Promise.resolve(); await Promise.resolve();
  assert.equal(pending.game.heard, true);
  pending.tap(pending.correctIndex());
  assert.equal(pending.reports.at(-1).evidence, "independent_listening");
  assert.equal(pending.reports.at(-1).independent, true);

  let late;
  const timeout = friendHarness({ allowRecall: true, say: () => new Promise(r => { late = r; }) });
  const deadline = [...timeout.timers].find(([, timer]) => timer.ms === 6000)?.[0];
  assert.ok(deadline); timeout.fireTimer(deadline);
  assert.equal(timeout.game.assisted, true); assert.equal(timeout.game.heard, false); assert.equal(timeout.game.modelVisible, true);
  late(true); await Promise.resolve(); await Promise.resolve(); assert.equal(timeout.game.heard, false);
  timeout.tap(timeout.correctIndex()); assert.equal(timeout.reports.at(-1).evidence, "supported_visible_matching");
  assert.equal(timeout.reports.at(-1).independent, false);

  const rejected = friendHarness({ allowRecall: true, say: () => Promise.reject(new Error("no audio")) });
  await Promise.resolve(); await Promise.resolve();
  assert.equal(rejected.game.heard, false); assert.equal(rejected.game.assisted, true);
  assert.equal(rejected.game.waiting, false); assert.equal(rejected.game.modelVisible, true);
});

test("replaying an active Friend prompt reveals support and keeps that friend helped for the visit", async () => {
  const resolvers = [];
  const h = friendHarness({ targets: ["ب", "ت", "ب"], allowRecall: true,
    profile: (_ctx, item) => ({ choiceCount: 3, promptMode: "listen" }),
    say: () => new Promise(resolve => resolvers.push(resolve)) });
  assert.equal(h.game.waiting, true);
  h.game.replayPrompt();
  assert.equal(h.game.modelVisible, true);
  assert.equal(h.game.waiting, false);
  assert.equal(h.game.assisted, true);
  resolvers[0](true); await Promise.resolve(); await Promise.resolve();
  assert.equal(h.game.heard, false, "speech started before replay cannot remove support");
  h.tap(h.correctIndex());
  assert.equal(h.reports[0].independent, false);
  h.game.continue();
  assert.equal(h.game.target.id, "ت", "the unrelated friend keeps its own listening plan");
  assert.equal(h.game.choiceCount, 3, "help for one friend does not change another friend's planned level");
  resolvers.at(-1)(true); await Promise.resolve(); await Promise.resolve();
  assert.equal(h.game.modelVisible, false);
  assert.equal(h.game.assisted, false);
  h.tap(h.correctIndex()); h.game.continue();
  assert.equal(h.reports[1].independent, true, "the unrelated friend can still be answered independently");
  assert.equal(h.game.modelVisible, true, "the helped friend returns with the model visible");
  assert.ok(h.game.offered.length <= 2);
  h.game.destroy();
});

test("Friend replay during a resolved round cannot affect the next friend or add an outcome", () => {
  const h = friendHarness({ targets: ["ب", "ت"], rounds: 2, say: () => true });
  h.tap(h.correctIndex());
  const outcomeCount = h.reports.length, assisted = h.game.assisted;
  h.game.replayPrompt();
  assert.equal(h.reports.length, outcomeCount);
  assert.equal(h.game.assisted, assisted);
  h.game.continue();
  assert.equal(h.game.assisted, false);
  h.tap(h.correctIndex()); h.game.continue();
  assert.equal(h.reports.length, 2);
});

test("v285 Friend replay races, help, wrong retries, stale handlers, and reveal teardown stay assisted and single-shot", async () => {
  let resolvers = [];
  const h = friendHarness({ allowRecall: true, say: () => new Promise(resolve => resolvers.push(resolve)) });
  const oldCard = h.stage.root.cards[h.correctIndex()];
  h.game.replayPrompt();
  resolvers[0](true); await Promise.resolve(); await Promise.resolve();
  assert.equal(h.game.heard, false, "a superseded playback cannot certify the replayed prompt");
  resolvers[1](true); await Promise.resolve(); await Promise.resolve();
  assert.equal(h.game.heard, true);
  const wrong = h.wrongIndex(), wrongCard = h.stage.root.cards[wrong]; h.tap(wrong);
  assert.equal(h.reports.length, 1); assert.equal(h.reports[0].correct, false); assert.equal(h.reports[0].independent, false, "Replay support makes even a confirmed response assisted");
  assert.equal(h.game.assisted, true); assert.equal(h.game.modelVisible, true); assert.equal(wrongCard.disabled, true);
  h.tap(wrong); assert.equal(h.reports.length, 1, "a wrong card is excluded after the first miss");
  h.tap(h.correctIndex()); assert.equal(h.reports.length, 2); assert.equal(h.reports.at(-1).evidence, "supported_visible_matching");
  h.tap(h.correctIndex()); assert.equal(h.reports.length, 2, "correct repeat taps cannot report twice");
  const oldHandler = oldCard.listeners.click[0]; h.game.continue();
  const before = h.reports.length; oldHandler({ detail: 1 }); assert.equal(h.reports.length, before, "stale card listeners cannot act on the next round");

  const reveal = friendHarness(); reveal.tap(reveal.correctIndex());
  const timerId = [...reveal.timers].find(([, timer]) => timer.ms === 0)?.[0];
  assert.ok(timerId); reveal.game.destroy(); assert.equal(reveal.timers.size, 0);
  reveal.fireTimer(timerId); assert.deepEqual(reveal.sounds, []); assert.equal(reveal.spoken.length, 1, "destroy cancels the delayed friend-name call");
});

test("v285 Friend help and keyboard flow are child-led and return focus to the next action", () => {
  const h = friendHarness({ beginner: true });
  h.game.help();
  assert.equal(h.game.assisted, true); assert.equal(h.game.modelVisible, true);
  h.tap(h.correctIndex(), 0);
  assert.equal(h.game.busy, true); assert.equal(h.stage.root.next.focused, true);
  assert.equal(h.done(), 0); h.stage.root.next.fire("click");
  assert.equal(h.game.round, 1); assert.equal(h.done(), 0);
});

test("v285 native Friend Play prop palette uses only the garden palette", () => {
  const art = source("FriendPlayArt.js");
  const bible = fs.readFileSync(path.join(root, "ART.md"), "utf8");
  const palette = new Set((bible.slice(bible.indexOf("## 2."), bible.indexOf("## 3.")).match(/#[0-9a-fA-F]{6}/g) || []).map(color => color.toLowerCase()));
  const colors = art.match(/#[0-9a-fA-F]{6}/g) || [];
  assert.ok(colors.length, "the puppet-show art declares its palette");
  assert.deepEqual(colors.map(color => color.toLowerCase()).filter(color => !palette.has(color)), []);
});
