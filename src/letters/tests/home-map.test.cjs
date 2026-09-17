const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "LettersGame.js"), "utf8");
const ids = [
  "pack-boat", "pack-smile", "pack-little", "pack-wave", "pack-tall", "pack-strong", "pack-round",
  "join-1", "join-2", "muqattaat", "fatha", "kasra-damma", "tanween", "standing",
  "long-sounds", "leen", "sukoon", "shaddah", "shaddah-mix", "words-2", "decode", "decode-4",
];

class FakeElement {
  constructor(className = "") {
    this.className = className;
    this.style = { setProperty() {} };
    this.isConnected = true;
    this.listeners = new Map();
    this.children = [];
  }
  addEventListener(name, fn) { this.listeners.set(name, fn); }
  querySelector(selector) { return this.bySelector?.(selector) || null; }
  querySelectorAll(selector) {
    if (selector === ".map-stop[data-world]") return this.stopButtons;
    if (selector === ".map-stop.is-done") return this.stopButtons.filter((button) => button.className.includes("is-done"));
    return [];
  }
}

function runtime(progressDone, { width = 390, pathWidth = 360, scrollHeight = 620 } = {}) {
  const resizeObservers = [];
  const landscapeCalls = [];
  const window = { innerWidth: width, MiftahGame: {
    LettersArt: { icon: () => "<icon>", mapStop: () => "<stop>", dayPhase: () => "day" },
    LettersGardenArt: { practicePicture: () => "<picture>", boat: () => "<boat>", growth: () => 0, flowerBed: () => "<flowers>" },
    DecoratingGarden: { icon: () => "<decorate>" },
  } };
  const document = { body: { classList: { toggle() {} } } };
  const context = {
    window, document, performance: { now: () => 0 }, setTimeout, clearTimeout,
    ResizeObserver: class {
      constructor(callback) { this.callback = callback; this.targets = []; resizeObservers.push(this); }
      observe(target) { this.targets.push(target); }
      disconnect() {}
    },
  };
  vm.runInNewContext(source, context);
  const ns = window.MiftahGame;
  const game = Object.create(ns.LettersGame.prototype);
  const worlds = ids.map((id, i) => ({ id, icon: `W${i}`, hue: i, biome: i < 4 ? "meadow" : "river", games: ["pop"] }));
  const root = new FakeElement();
  game.root = root;
  game.progress = { done: progressDone.slice(), skipped: false };
  game.stars = {};
  game.bests = {};
  game.stamps = { dates: [] };
  game.worlds = {
    worlds,
    dailySession: () => null,
  };
  game.sound = { play() {} };
  game.topBar = () => "<top-bar>";
  game.wireTopBar = () => {};
  game.applyPhase = () => {};
  game.petSVG = () => "<pet>";
  game.masteryPlant = () => "<plant>";
  game.masteryOfWorld = () => 0;
  game.worldMasteryOf = () => 0;
  game.starBalance = () => 0;
  game.screen = (_className, inner) => {
    const el = new FakeElement("lg-home");
    el.isConnected = true;
    const pathEl = new FakeElement("map-path");
    pathEl.clientWidth = pathWidth;
    const scroll = new FakeElement("map-scroll");
    scroll.clientWidth = width;
    scroll.clientHeight = scrollHeight;
    const terrain = new FakeElement("map-landscape");
    const trail = new FakeElement("map-trail");
    trail.setAttribute = (name, value) => { trail[name] = value; };
    trail.innerHTML = "";
    const buttons = worlds.map((world) => {
      const button = new FakeElement("map-stop");
      button.dataset = { world: world.id };
      button.classList = { contains: (name) => button.className.includes(name) };
      return button;
    });
    el.stopButtons = buttons;
    el.mapScroll = scroll;
    el.bySelector = (selector) => ({
      ".map-path": pathEl, ".map-scroll": scroll, ".map-landscape": terrain, ".map-trail": trail,
      ".map-practice-garden": new FakeElement(), ".map-decorate": new FakeElement(),
      ".map-pet": new FakeElement(), ".map-album": new FakeElement(),
    }[selector] || (selector === ".map-stop.is-current" ? buttons.find((button) => button.className.includes("is-current")) : null));
    // renderHome's contract is the generated map HTML; retain it for the
    // node/status assertions below while the fake tree supplies geometry.
    el.innerHTML = inner;
    root.innerHTML = inner;
    root.screen = el;
    game._screen = el;
    return el;
  };
  ns.LettersMapArt = {
    landmark: () => "<landmark>",
    landscape(args) { landscapeCalls.push(args); return `<svg data-map-height="${args.height}"></svg>`; },
  };
  // Capture generated status classes and node order from the actual render string.
  const originalScreen = game.screen;
  game.screen = (name, inner) => {
    const el = originalScreen(name, inner);
    el.generated = inner;
    el.stopButtons.forEach((button, i) => {
      const match = inner.match(new RegExp(`class="map-stop is-([^"]+)"[^>]*data-world="${ids[i]}"`));
      button.className = `map-stop is-${match?.[1] || "missing"}`;
      button.offsetParent = el.bySelector(".map-path");
      button.closest = () => ({ offsetTop: Number(inner.match(new RegExp(`data-node-world="${ids[i]}" style="left:[^;]+; top:([0-9]+)px`))?.[1] || 0) });
    });
    return el;
  };
  return { game, worlds, root, resizeObservers, landscapeCalls, get screen() { return game._screen; } };
}

test("home map preserves the 22-stop progression and restores the current scroll position", () => {
  const done = ids.slice(0, 3);
  const env = runtime(done);
  const { game, landscapeCalls } = env;
  const before = JSON.stringify(game.progress);
  game.renderHome();
  const screen = env.screen;
  assert.deepEqual([...screen.generated.matchAll(/data-node-world="([^"]+)"/g)].map((match) => match[1]), ids);
  const markup=[...screen.generated.matchAll(/<button[^>]*class="map-stop[^>]*>/g)].map(match=>match[0]);
  assert.deepEqual(markup.map(tag=>/data-world="([^"]+)"/.exec(tag)[1]),ids);
  assert.ok(markup.slice(4).every(tag=>/\sdisabled(?:\s|>)/.test(tag)));
  assert.ok(markup.slice(0,4).every(tag=>!/\sdisabled(?:\s|>)/.test(tag)));
  assert.equal([...screen.generated.matchAll(/class="map-landscape"/g)].length,1);
  assert.equal(screen.stopButtons.filter((button) => button.className.includes("is-current")).length, 1);
  assert.equal(screen.stopButtons[3].className, "map-stop is-current");
  assert.equal(screen.stopButtons.slice(4).every((button) => button.className.includes("is-locked")), true);
  assert.equal(screen.stopButtons.filter((button) => button.className.includes("is-done")).length, done.length);
  assert.equal(screen.mapScroll.scrollTop, screen.stopButtons[3].closest().offsetTop - screen.mapScroll.clientHeight * 0.5);
  assert.equal(landscapeCalls.length, 1);
  assert.equal(JSON.stringify(game.progress), before);
});

test("home map redraws landscape on resize without changing progression", () => {
  const { game, resizeObservers, landscapeCalls } = runtime(ids.slice(0, 11));
  game.renderHome();
  const before = JSON.stringify(game.progress);
  assert.equal(resizeObservers.length, 1);
  const observer = resizeObservers[0];
  observer.callback();
  assert.equal(landscapeCalls.length, 1, "unchanged width does not rebuild artwork");
  observer.targets[1].clientWidth = 500;
  observer.callback();
  assert.equal(landscapeCalls.length, 2);
  assert.equal(JSON.stringify(game.progress), before);
});

test("completed home map still renders every stop and restores the last-stop scroll", () => {
  const env = runtime(ids);
  const { game } = env;
  game.renderHome();
  const screen = env.screen;
  assert.equal(screen.stopButtons.length, ids.length);
  assert.equal(screen.stopButtons.every((button) => button.className.includes("is-done")), true);
  assert.equal(screen.stopButtons.some((button) => button.className.includes("is-current")), false);
  assert.equal(screen.mapScroll.scrollTop, screen.stopButtons.at(-1).closest().offsetTop - screen.mapScroll.clientHeight * 0.28);
});
