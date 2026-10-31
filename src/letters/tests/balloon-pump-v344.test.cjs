const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class Element {
  constructor(document) {
    this.document = document;
    this.children = [];
    this.listeners = {};
    this.attrs = {};
    this.style = {};
    this.classes = new Set();
    this.classList = {
      add: (...names) => names.forEach(name => this.classes.add(name)),
      contains: name => this.classes.has(name),
      toggle: (name, force) => force ? this.classes.add(name) : this.classes.delete(name),
    };
    this._disabled = false;
  }
  set innerHTML(value) { this.html = String(value); if (this.html.includes('class="balloons')) this.root = new Element(this.document); }
  get innerHTML() { return this.html || ""; }
  querySelector(selector) { return selector === ".balloons" ? this.root || null : null; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  get disabled() { return this._disabled; }
  set disabled(value) {
    this._disabled = value;
    if (value && this.document.activeElement === this) this.document.activeElement = this.document.body;
  }
  focus() { this.focused = true; this.document.activeElement = this; }
  matches(selector) { return selector === ":focus-visible" && this.focusVisible === true; }
  appendChild(child) { this.children.push(child); child.parent = this; return child; }
  remove() {
    if (!this.parent) return;
    this.parent.children = this.parent.children.filter(child => child !== this);
    this.parent = null;
  }
  click() { this.listeners.click?.({ currentTarget: this }); }
}

function harness({ items, reduced = false, chooseBalloonPlay = true, say } = {}) {
  const timers = new Map();
  let nextTimer = 1;
  const document = { activeElement: null };
  document.body = new Element(document);
  document.createElement = () => new Element(document);
  const observer = { disconnected: false, observe() {}, disconnect() { this.disconnected = true; } };
  class ResizeObserverMock { constructor() { return observer; } }
  const namespace = { GardenPractice: {}, BalloonPlayArt: {
    balloon: (color, glyph) => `<svg data-color="${color}">${glyph}</svg>`,
    pump: (color, glyph, air) => `<svg data-color="${color}" data-air="${air}">${glyph}</svg>`,
    modeIcon: mode => mode,
  }, LettersArt: { fitGlyphs() {} } };
  const sandbox = {
    window: { MiftahGame: namespace }, document, ResizeObserver: ResizeObserverMock,
    setTimeout(fn, ms) { const id = nextTimer++; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
    Promise, Set, Map, String, Array, Math,
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "LetterBalloons.js"), "utf8"), sandbox);
  const stage = new Element(document);
  const calls = { say: [], prompt: [], sfx: [], outcome: 0, save: 0, reward: 0, spend: 0, done: 0 };
  const context = {
    stage, items, chooseBalloonPlay, reducedMotion: () => reduced,
    worldId: "now", completedWorldIds: [],
    say(item) { calls.say.push(item); return say ? say(item, calls.say.length) : true; },
    prompt(item) { calls.prompt.push(item); }, sfx(name) { calls.sfx.push(name); },
    reportOutcome() { calls.outcome++; }, saveDrawing() { calls.save++; }, saveJSON() { calls.save++; },
    reward() { calls.reward++; }, spendStars() { calls.spend++; }, done() { calls.done++; }, complete() { calls.done++; },
  };
  const game = new namespace.GardenPractice.LetterBalloons(context);
  return { game, calls, timers, observer, document, tick(ms) {
    const due = [...timers].filter(([, timer]) => timer.ms === ms);
    for (const [id, timer] of due) { timers.delete(id); timer.fn(); }
  } };
}

const letter = (id, display, extra = {}) => ({ id, display, ...extra });
const choosePump = game => game.modeButtons[1].click();
const assertNoProgressWrites = calls => assert.deepEqual(
  [calls.outcome, calls.save, calls.reward, calls.spend, calls.done], [0, 0, 0, 0, 0],
  "free-play pump interactions do not report outcomes, save, reward, spend stars, or complete",
);

test("pump mode advances three stages then releases and replaces only that balloon after 650ms", () => {
  const h = harness({ items: [letter("b", "ب"), letter("t", "ت"), letter("th", "ث"), letter("j", "ج")] });
  choosePump(h.game);
  const first = h.game.slots[0], siblings = h.game.slots.slice(1);
  first.click(); first.click(); first.click();
  assert.deepEqual(Array.from(h.game.inflation), [3, 0, 0]);
  assert.equal(first.attrs["aria-label"], "Release the ب balloon");
  assert.equal(h.game.slots[0], first);
  first.click();
  assert.equal(first.disabled, true);
  first.click(); first.click();
  assert.equal([...h.timers.values()].filter(timer => timer.ms === 650).length, 1, "extra release taps cannot schedule duplicate replacements");
  assert.equal(h.game.slots[0], first);
  assert.deepEqual(h.game.slots.slice(1), siblings);
  assert.equal([...h.timers.values()].some(timer => timer.ms === 650), true);
  h.tick(650);
  assert.notEqual(h.game.slots[0], first);
  assert.deepEqual(Array.from(h.game.inflation), [0, 0, 0]);
  assert.deepEqual(h.game.slots.slice(1), siblings);
  assertNoProgressWrites(h.calls);
  h.game.destroy();
});

test("pump progress is independent by slot and speech retains only the newest queued letter", async () => {
  let resolveSpeech;
  const h = harness({ items: [letter("b", "ب"), letter("t", "ت"), letter("th", "ث")],
    say: () => new Promise(resolve => { resolveSpeech = resolve; }) });
  choosePump(h.game);
  h.game.slots[0].click(); h.game.slots[0].click();
  h.game.slots[1].click(); h.game.slots[1].click();
  h.game.slots[2].click();
  assert.deepEqual(Array.from(h.game.inflation), [2, 2, 1]);
  assert.deepEqual(h.calls.say.map(item => item.id), ["b"]);
  assert.equal(h.game.queuedItem.id, "th");
  assert.equal(h.game.slots[0].attrs["data-air"], "2");
  assert.equal(h.game.slots[1].attrs["data-air"], "2");
  assertNoProgressWrites(h.calls);
  resolveSpeech(true);
  await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(h.calls.say.map(item => item.id), ["b", "th"]);
  h.game.destroy();
});

test("pump keeps the taught-letter filter and preserves the initial three eligible letters", () => {
  const items = [letter("b", "ب"), letter("b-alias", "ب"), letter("t", "ت"), letter("th", "ث"),
    letter("blocked", "ج", { taught: false }), letter("blocked-alias", "ج"), letter("locked", "ح", { locked: true }), letter("latin", "A")];
  const h = harness({ items });
  choosePump(h.game);
  assert.deepEqual(Array.from(h.game.letters, item => item.id), ["b", "t", "th"]);
  assert.deepEqual(Array.from(h.game.slotItems, item => item.id), ["b", "t", "th"]);
  assert.deepEqual(Array.from(h.game.inflation), [0, 0, 0]);
  h.game.destroy();
});

test("switching modes during release retains each item and color, resets air, and makes the old callback harmless", () => {
  const h = harness({ items: [letter("b", "ب"), letter("t", "ت"), letter("th", "ث"), letter("j", "ج")] });
  choosePump(h.game);
  const items = [...h.game.slotItems], colors = [...h.game.slotColors];
  const oldButton = h.game.slots[0];
  h.game.slots[0].click(); h.game.slots[0].click(); h.game.slots[0].click(); h.game.slots[0].click();
  const [timerId, timer] = [...h.timers][0];
  assert.equal(timer.ms, 650);
  assert.equal(h.game.setMode("pop"), true);
  const popSlots = [...h.game.slots];
  assert.deepEqual(Array.from(h.game.slotItems), items);
  assert.deepEqual(Array.from(h.game.slotColors), colors);
  assert.deepEqual(Array.from(h.game.inflation), [0, 0, 0]);
  assert.equal(h.timers.size, 0);
  const callsBeforeStaleClick = { speech: h.calls.say.length, sounds: h.calls.sfx.length };
  oldButton.click();
  assert.equal(h.calls.say.length, callsBeforeStaleClick.speech);
  assert.equal(h.calls.sfx.length, callsBeforeStaleClick.sounds);
  timer.fn();
  assert.equal(h.game.slots.length, popSlots.length);
  popSlots.forEach((button, slot) => assert.equal(h.game.slots[slot], button, "a captured cleared callback cannot replace the retained slot"));
  assert.equal(h.game.mode, "pop");
  assertNoProgressWrites(h.calls);
  h.game.destroy();
});

test("replacement restores keyboard focus only when focus stayed on the disabled balloon", () => {
  const h = harness({ items: [letter("b", "ب"), letter("t", "ت"), letter("th", "ث"), letter("j", "ج")] });
  choosePump(h.game);
  const focused = h.game.slots[0]; focused.focusVisible = true; h.document.activeElement = focused;
  focused.click(); focused.click(); focused.click(); focused.click();
  h.tick(650);
  assert.equal(h.game.slots[0].focused, true);
  const moving = h.game.slots[1]; moving.focusVisible = true; h.document.activeElement = moving;
  moving.click(); moving.click(); moving.click(); moving.click();
  const elsewhere = new Element(h.document); h.document.activeElement = elsewhere;
  h.tick(650);
  assert.equal(h.game.slots[1].focused, undefined);
  assert.equal(h.document.activeElement, elsewhere);
  h.game.destroy();
});

test("reduced motion uses 180ms replacement and destroy cancels pending release work", () => {
  const h = harness({ items: [letter("b", "ب"), letter("t", "ت"), letter("th", "ث")], reduced: true });
  choosePump(h.game);
  const first = h.game.slots[0];
  first.click(); first.click(); first.click(); first.click();
  assert.equal([...h.timers.values()].some(timer => timer.ms === 180), true);
  h.game.destroy();
  assert.equal(h.timers.size, 0);
  h.tick(180);
  assert.equal(h.game.slots.length, 0);
  assert.equal(h.observer.disconnected, true);
  assertNoProgressWrites(h.calls);
});

test("without opt-in mode controls are absent and balloons stay in pop mode", () => {
  const h = harness({ items: [letter("b", "ب"), letter("t", "ت"), letter("th", "ث")], chooseBalloonPlay: false });
  assert.equal(h.game.mode, "pop");
  assert.equal(h.game.chooseMode, false);
  assert.equal(h.game.modeButtons, undefined);
  assert.equal(h.game.setMode("pump"), false);
  const first = h.game.slots[0];
  first.click();
  assert.equal(h.calls.sfx[0], "pop");
  assert.equal(h.game.mode, "pop");
  assertNoProgressWrites(h.calls);
  h.game.destroy();
});
