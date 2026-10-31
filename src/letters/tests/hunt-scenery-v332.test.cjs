const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const load = name => fs.readFileSync(path.join(root, name), "utf8");

function artApi() {
  const window = { MiftahGame: {} };
  vm.runInNewContext(load("HuntPlayArt.js"), { window });
  return window.MiftahGame.HuntPlayArt;
}

function harness({ reducedMotion = false } = {}) {
  const timers = new Map(); let nextTimer = 0;
  const setTimer = (fn, ms) => { const id = ++nextTimer; timers.set(id, { fn, ms }); return id; };
  const clearTimer = id => timers.delete(id);
  class Classes {
    values = new Set();
    add(value) { this.values.add(value); }
    remove(value) { this.values.delete(value); }
    contains(value) { return this.values.has(value); }
    toggle(value, force) { const on = force === undefined ? !this.contains(value) : !!force; on ? this.add(value) : this.remove(value); return on; }
  }
  class Spot {
    constructor(index, kind, letter) { this.dataset = { spot: String(index), kind }; this.letter = letter; this.classList = new Classes(); this.attrs = {}; this.listeners = {}; }
    setAttribute(key, value) { this.attrs[key] = String(value); if (key.startsWith("data-")) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value); }
    removeAttribute(key) { delete this.attrs[key]; if (key.startsWith("data-")) delete this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())]; }
    addEventListener(key, fn) { this.listeners[key] = fn; }
    querySelector(selector) { return selector === ".hunt-thing" ? this : null; }
    getAnimations() { return []; }
    animate() { return { cancel() {} }; }
    fire(type = "click") { this.listeners[type]?.({ type, detail: 1 }); }
  }
  class Svg {
    constructor(html) {
      this.spots = [...html.matchAll(/<g class="hunt-spot[^\"]*" data-spot="(\d+)" data-kind="([^\"]+)"[^>]*aria-label="(?:Letter ([^\"]+)|Play with the [^\"]+)"/g)]
        .map(m => new Spot(+m[1], m[2], m[3] || null));
    }
    querySelectorAll(sel) { return sel === ".hunt-spot" ? this.spots : []; }
    querySelector(sel) { const m = sel.match(/data-spot="?(\d+)/); return m ? this.spots.find(s => +s.dataset.spot === +m[1]) : null; }
  }
  class Root {
    constructor(html) { this.svg = new Svg(html); this.html = html; this.help = { disabled: false }; this.next = { hidden: true }; this.basket = { querySelectorAll: () => [] }; }
    querySelector(sel) { return ({ ".hunt-scene": this.svg, ".hunt-help": this.help, ".hunt-next": this.next, ".hunt-basket": this.basket })[sel] || null; }
    querySelectorAll() { return []; }
  }
  const stage = { clientWidth: 800, clientHeight: 600, set innerHTML(v) { this.html = v; this.root = new Root(v); }, querySelector(sel) { return sel === ".hunt-play" ? this.root : null; } };
  const reports = [], sounds = [];
  const window = { MiftahGame: { PracticeLearning: { plan: (_ctx, rows, _skill, count) => rows.slice(0, count), profile: () => ({ choiceCount: 3, promptMode: "match" }) } } };
  const context = vm.createContext({ window, setTimeout: setTimer, clearTimeout: clearTimer, ResizeObserver: undefined, Math, Promise, Date, console });
  vm.runInContext(load("HuntPlayArt.js"), context);
  vm.runInContext(load("LetterHunt.js"), context);
  const items = ["ا", "ب", "ت", "ث"].map((display, i) => ({ id: `i${i}`, display }));
  const ctx = { stage, items, land: "meadow", reducedMotion: () => reducedMotion, canListen: () => true, say: () => true,
    reportOutcome: result => reports.push(result), sfx: sound => sounds.push(sound), beginRound() {}, setRoundProgress() {} };
  const Game = window.MiftahGame.GardenPractice.LetterHunt;
  const game = new Game(ctx);
  return { game, ctx, stage, timers, reports, sounds, spot(i) { return game.svg.querySelector(`.hunt-spot[data-spot="${i}"]`); } };
}

test("Hunt art provides native SVG reactions for all eleven existing things", () => {
  const art = artApi();
  const kinds = Object.keys(art.things);
  assert.equal(kinds.length, 11);
  for (const kind of kinds) {
    const svg = art.reaction(kind);
    assert.match(svg, /<path\b|<g\b|<circle\b|<ellipse\b/);
    assert.doesNotMatch(svg, /<img\b|<foreignObject\b/);
  }
});

test("render includes decorative reaction layers hidden from assistive technology", () => {
  const h = harness();
  assert.match(h.stage.html, /class="hunt-reaction"[^>]*aria-hidden="true"|aria-hidden="true"[^>]*class="hunt-reaction"/);
  assert.match(h.stage.html, /class="hunt-reaction/);
});

test("scenery replacement is bounded and an old timer cannot clear the newer reaction", () => {
  const h = harness();
  const first = h.spot(0), second = h.spot(1);
  h.game.playScenery(first);
  const prior = h.game.scenery;
  assert.equal(prior.spot, first);
  assert.equal([...h.timers.values()][0].ms, 1100);
  const stale = [...h.timers.values()][0].fn;
  h.game.playScenery(second);
  assert.equal(h.game.scenery.spot, second);
  stale();
  assert.equal(h.game.scenery.spot, second);
  assert.equal(h.game.scenery.timer != null, true);
  h.game.clearScenery();
  assert.equal(h.game.scenery, null);
});

test("reduced motion selects still scenery; ordinary scenery uses motion state", () => {
  const moving = harness();
  moving.game.playScenery(moving.spot(0));
  assert.equal(moving.spot(0).dataset.playing, "motion");
  const still = harness({ reducedMotion: true });
  still.game.playScenery(still.spot(0));
  assert.equal(still.spot(0).dataset.playing, "still");
});

test("plain and found prop taps react and rustle without reporting learning evidence", () => {
  const h = harness();
  const empty = h.game.letters.findIndex(letter => !letter);
  h.game.tap(empty);
  assert.equal(h.reports.length, 0);
  assert.equal(h.sounds.at(-1), "rustle");
  assert.equal(h.game.scenery.spot, h.spot(empty));
  const targetIndex = h.game.letters.findIndex(letter => letter?.id === h.game.target.id);
  h.game.tap(targetIndex);
  assert.equal(h.reports.length, 1);
  h.game.tap(targetIndex);
  assert.equal(h.reports.length, 1);
  assert.equal(h.sounds.at(-1), "rustle");
});

test("busy and waiting states still allow decorative scenery without evidence", () => {
  const h = harness();
  const empty = h.game.letters.findIndex(letter => !letter);
  h.game.busy = true;
  h.game.tap(empty);
  assert.equal(h.game.scenery.spot, h.spot(empty));
  assert.equal(h.reports.length, 0);
  h.game.busy = false; h.game.waiting = true;
  h.game.tap(empty);
  assert.equal(h.game.scenery.spot, h.spot(empty));
  assert.equal(h.reports.length, 0);
});

test("a successful find starts scenery after rerender; wrong answers keep their learning response", () => {
  const h = harness();
  const target = h.game.letters.findIndex(letter => letter?.id === h.game.target.id);
  h.game.tap(target);
  assert.equal(h.reports[0].correct, true);
  assert.equal(h.game.scenery.spot.dataset.spot, String(target));
  const wrongHarness = harness();
  const wrong = wrongHarness.game.letters.findIndex(letter => letter && letter.id !== wrongHarness.game.target.id);
  wrongHarness.game.tap(wrong);
  assert.equal(wrongHarness.reports.length, 1);
  assert.equal(wrongHarness.reports[0].correct, false);
  assert.equal(wrongHarness.game.scenery, undefined, "a wrong answer does not start decorative scenery");
});

test("render, resize, and destroy clear active scenery", () => {
  for (const lifecycle of ["render", "resize", "destroy"]) {
    const h = harness();
    h.game.playScenery(h.spot(0));
    h.game[lifecycle]();
    assert.equal(h.game.scenery, null, `${lifecycle} clears the active scenery record`);
  }
});
