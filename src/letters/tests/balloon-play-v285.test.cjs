const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

class Element {
  constructor() {
    this.children = [];
    this.listeners = {};
    this.attrs = {};
    this.style = {};
    this.classes = new Set();
    this._disabled = false;
    this.classList = {
      add: (...names) => names.forEach(name => this.classes.add(name)),
      contains: name => this.classes.has(name),
    };
  }
  set innerHTML(value) { this.html = String(value); if (this.html.includes('class="balloons')) this.root = new Element(); }
  get innerHTML() { return this.html || ""; }
  querySelector(selector) { return selector === ".balloons" ? this.root || null : null; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  addEventListener(name, fn) { this.listeners[name] = fn; }
  get disabled() { return this._disabled; }
  set disabled(value) {
    this._disabled = value;
    if (value && this.document?.activeElement === this) this.document.activeElement = this.document.body;
  }
  focus() { this.focused = true; if (this.document) this.document.activeElement = this; }
  matches(selector) { return selector === ":focus-visible" && this.focusVisible === true; }
  appendChild(child) { this.children.push(child); child.parent = this; return child; }
  remove() { if (!this.parent) return; this.parent.children = this.parent.children.filter(child => child !== this); this.parent = null; }
  click() { this.listeners.click?.({ currentTarget: this }); }
}

function harness(options = {}) {
  const timers = new Map();
  let nextTimer = 1;
  const document = { activeElement: null };
  document.body = new Element();
  document.body.document = document;
  document.createElement = () => { const el = new Element(); el.document = document; return el; };
  const fitted = [], observer = { observed: null, disconnected: false, observe(el) { this.observed = el; }, disconnect() { this.disconnected = true; } };
  class ResizeObserverMock { constructor(fn) { this.fn = fn; return observer; } }
  const ns = { GardenPractice: {}, BalloonPlayArt: {
    balloon: (color, letter) => `<svg data-color="${color}">${letter}</svg>`,
    classic: () => "classic",
  }, LettersArt: { fitGlyphs: el => fitted.push(el) } };
  const sandbox = {
    window: { MiftahGame: ns },
    document,
    ResizeObserver: ResizeObserverMock,
    setTimeout(fn, ms) { const id = nextTimer++; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
    Promise, Set, Map, String, Array, Math,
  };
  vm.runInNewContext(source("BalloonPlayArt.js"), sandbox);
  vm.runInNewContext(source("LetterBalloons.js"), sandbox);
  const stage = new Element(), said = [], prompts = [], sounds = [];
  const context = {
    stage, items: options.items, starter: options.starter, reducedMotion: () => !!options.reduced,
    worldId: "now", completedWorldIds: [],
    say(item) { said.push(item); return options.say ? options.say(item, said.length) : true; },
    prompt(item) { prompts.push(item); }, sfx(name) { sounds.push(name); },
  };
  const game = new ns.GardenPractice.LetterBalloons(context);
  return { game, ns, stage, said, prompts, sounds, timers, fitted, observer, document,
    advance(ms) { for (const [id, timer] of [...timers]) if (timer.ms === ms) { timers.delete(id); timer.fn(); } },
    run(id) { const timer = timers.get(id); if (timer) { timers.delete(id); timer.fn(); } },
  };
}

const letter = (id, display, extra = {}) => ({ id, display, ...extra });

test("three fixed slots contain only unique eligible Arabic letters and never report outcomes", () => {
  const items = [letter("alif", "ا"), letter("alif-copy", "ا"), letter("baa", "ب"), letter("ta", "ت"),
    letter("blocked-baa", "ث", { taught: false }), letter("baa-alias", "ث"), letter("locked", "ج", { locked: true }),
    letter("latin", "A"), letter("phrase", "لا")];
  let outcomes = 0, completions = 0, rewards = 0, cheers = 0;
  const h = harness({ items });
  h.game.ctx.pet = { cheer: () => cheers++ };
  h.game.ctx.reportOutcome = () => outcomes++;
  h.game.ctx.complete = () => completions++;
  h.game.ctx.reward = () => rewards++;
  assert.equal(h.game.slots.length, 3);
  assert.deepEqual(h.game.letters.map(item => item.id), ["alif", "baa", "ta"]);
  assert.equal(h.game.root.children.length, 3);
  assert.equal(h.prompts[0].id, "alif", "the replay control has a letter before the first pop");
  h.game.slots[0].click();
  assert.equal(h.prompts[0].id, "alif");
  assert.equal(h.sounds[0], "pop");
  assert.equal(cheers, 1);
  assert.equal(outcomes + completions + rewards, 0);
  h.game.destroy();
});

test("first-time starter fallback works only without declared material", () => {
  const starter = [letter("b", "ب"), letter("t", "ت")];
  assert.deepEqual(harness({ starter }).game.letters.map(item => item.id), ["b", "t"]);
  const blocked = harness({ items: [letter("blocked", "ب", { taught: false }), letter("alias", "ب")], starter });
  assert.equal(blocked.game.letters.length, 0);
  assert.equal(blocked.game.alive, false);
});

test("empty material may use starter, but invalid declared material cancels without substituting starter", async () => {
  const empty = harness({ items: [], starter: [letter("b", "ب")] });
  assert.deepEqual(empty.game.letters.map(item => item.id), ["b"]);
  let cancelled = 0;
  const invalid = harness({ items: [letter("blocked", "ب", { locked: true })], starter: [letter("t", "ت")] });
  invalid.game.ctx.cancel = () => cancelled++;
  await Promise.resolve();
  assert.equal(invalid.game.alive, false);
  assert.equal(invalid.game.root.children.length, 0);
  assert.equal(cancelled, 1);
});

test("pop replaces only its own slot, fits new glyphs, and destroy clears delayed replacements", () => {
  const h = harness({ items: [letter("b", "ب"), letter("t", "ت"), letter("th", "ث"), letter("j", "ج")] });
  const otherSlots = [h.game.slots[1], h.game.slots[2]], popped = h.game.slots[0];
  popped.focusVisible = true;
  h.document.activeElement = popped;
  popped.click();
  assert.equal(popped.disabled, true);
  h.advance(360);
  assert.equal(h.game.root.children.length, 3);
  assert.equal(h.game.slots[0] === popped, false);
  assert.equal(h.game.slots[1], otherSlots[0]);
  assert.equal(h.game.slots[2], otherSlots[1]);
  assert.deepEqual([...h.game.slots].map(button => button.style.gridColumn), ["1", "2", "3"]);
  assert.equal(h.game.slots[0].style.gridRow, "1");
  assert.equal(h.game.slots[0].focused, true, "keyboard focus stays in the replaced slot");
  assert.ok(h.fitted.length >= 4);
  const current = h.game.slots[0];
  current.focusVisible = true;
  h.document.activeElement = current;
  current.click();
  const movedFocus = new Element();
  h.document.activeElement = movedFocus;
  h.advance(360);
  assert.equal(h.game.slots[0].focused, undefined, "keyboard focus is not restored after the user moves away");
  assert.equal(h.document.activeElement, movedFocus, "a replacement does not steal focus after the user moves it");
  const touchTarget = h.game.slots[1];
  h.document.activeElement = touchTarget;
  touchTarget.click();
  h.advance(360);
  assert.equal(h.game.slots[1].focused, undefined, "a touch-focused target does not move focus to its replacement");
  h.game.destroy();
  assert.equal(h.timers.size, 0);
  assert.equal(h.game.root.children.length, 0);
  current.click();
  assert.equal(h.prompts.length, 4);
  assert.equal(h.observer.disconnected, true);
});

test("speech never overlaps a burst and retains only the newest queued letter", async () => {
  let resolveFirst;
  const h = harness({ items: [letter("b", "ب"), letter("t", "ت"), letter("th", "ث")],
    say: () => h.said.length === 1 ? new Promise(resolve => { resolveFirst = resolve; }) : true });
  h.game.slots[0].click();
  h.game.slots[1].click();
  h.game.slots[2].click();
  assert.deepEqual(h.said.map(item => item.id), ["b"]);
  assert.deepEqual(h.prompts.map(item => item.id), ["b", "b"], "the visible prompt remains on the speech that actually started");
  assert.equal(h.game.queuedItem.id, "th");
  h.game.replayPrompt();
  assert.equal(h.game.queuedItem.id, "th");
  assert.deepEqual(h.prompts.map(item => item.id), ["b", "b"]);
  resolveFirst(true);
  await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(h.said.map(item => item.id), ["b", "th"]);
  assert.deepEqual(h.prompts.map(item => item.id), ["b", "b", "th"], "the newest queued letter becomes visible when its speech starts");
  h.game.destroy();
});

test("slot art bobs while its hit target stays still, and reduced motion disables art motion", () => {
  const css = fs.readFileSync(path.join(__dirname, "../../../styles/letters-balloon-play.css"), "utf8");
  assert.match(css, /\.lg-app \.balloons \.balloon\s*\{[^}]*inset: auto;[^}]*bottom: auto;/s);
  assert.match(css, /\.balloon-art[^}]*animation: lg-balloon-bob/);
  assert.match(css, /\.balloon:active:not\(\.is-popped\) \.balloon-art\s*\{[^}]*scale: \.98/);
  assert.match(css, /\.balloon\.is-popped \.balloon-art\s*\{[^}]*opacity: 0/);
  assert.match(css, /\.lg-app\.lg-reduce-motion \.balloons \.balloon, \.lg-app\.lg-reduce-motion \.balloons \.balloon-art \{ animation: none !important/);
});

test("hung speech releases the newest queued item after six seconds and ignores late settlement", async () => {
  let resolveFirst;
  const h = harness({ items: [letter("b", "ب"), letter("t", "ت")],
    say: () => h.said.length === 1 ? new Promise(resolve => { resolveFirst = resolve; }) : true });
  h.game.slots[0].click(); h.game.slots[1].click();
  assert.equal([...h.timers.values()].some(timer => timer.ms === 6000), true);
  h.advance(6000);
  assert.deepEqual(h.said.map(item => item.id), ["b", "t"]);
  resolveFirst(false);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(h.game.speechBusy, false);
  h.game.destroy();
});

test("destroy drops pending speech and stale promise callbacks", async () => {
  let resolve;
  const h = harness({ items: [letter("b", "ب"), letter("t", "ت")], say: () => new Promise(done => { resolve = done; }) });
  h.game.slots[0].click(); h.game.slots[1].click();
  h.game.destroy();
  assert.equal(h.game.queuedItem, null);
  assert.equal(h.timers.size, 0);
  resolve(true);
  await Promise.resolve(); await Promise.resolve();
  assert.equal(h.said.length, 1);
  assert.equal(h.game.speechBusy, false);
});

test("reduced motion keeps the same usable toy without bobbing", () => {
  const h = harness({ items: [letter("b", "ب"), letter("t", "ت"), letter("th", "ث")], reduced: true });
  assert.match(h.stage.innerHTML, /is-still/);
  assert.equal(h.game.slots.length, 3);
  assert.equal(h.game.slots.every(button => !button.disabled), true);
  h.game.destroy();
});
