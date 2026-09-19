const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

function runtime() {
  const window = { MiftahGame: { LettersArt: { icon: () => "<svg></svg>" } } };
  const context = {
    window,
    document: { body: { classList: { toggle() {} } } },
    setTimeout,
    clearTimeout,
    performance: { now: () => 0 },
  };
  vm.runInNewContext(source("LettersGardenArt.js"), context);
  vm.runInNewContext(source("LettersJourney.js"), context);
  vm.runInNewContext(source("LettersGame.js"), context);
  return { ns: window.MiftahGame, context };
}

const boat = () => ({ id: "pack-boat", games: ["pop", "trace", "feed"] });
const clone = value => JSON.parse(JSON.stringify(value));

test("Boat journey metadata is exact, ordered, and frame-only", () => {
  const { ns } = runtime();
  assert.ok(ns.LettersJourney, "LettersJourney API is registered");
  const world = boat();
  const before = clone(world);
  const metadata = ns.LettersJourney.forWorld(world);
  assert.ok(metadata);
  assert.equal(metadata.id, "pack-boat");
  assert.deepEqual([...metadata.steps].map(step => step.game), ["pop", "trace", "feed"]);
  assert.deepEqual(world, before);

  const route = ns.LettersJourney.route(world, 1);
  assert.equal((route.match(/role="listitem"/g) || []).length, 3);
  assert.ok(route.indexOf("Find seed packets at the pond") < route.indexOf("Draw the packet labels"));
  assert.ok(route.indexOf("Draw the packet labels") < route.indexOf("Deliver packets to your friend"));
  assert.equal((route.match(/aria-current="step"/g) || []).length, 1);
  assert.equal((route.match(/, completed/g) || []).length, 1);
  assert.deepEqual(world, before);
});

test("Boat metadata rejects lookalike worlds and route remains decoration", () => {
  const { ns } = runtime();
  for (const world of [
    { id: "pack-boat", games: ["trace", "pop", "feed"] },
    { id: "pack-smile", games: ["pop", "trace", "feed"] },
    { id: "pack-boat", games: ["pop", "trace"] },
    { id: "pack-boat", games: ["pop", "trace", "feed", "pairs"] },
  ]) {
    assert.equal(ns.LettersJourney.forWorld(world), null);
  }
  const world = boat();
  const before = clone(world);
  ns.LettersJourney.route(world, 3);
  assert.deepEqual(world, before);
});

test("isBoatAdventure requires the registered Boat session and excludes modes", () => {
  const { ns } = runtime();
  const game = Object.create(ns.LettersGame.prototype);
  game.session = { world: boat() };
  assert.equal(game.isBoatAdventure(), true);
  for (const patch of [
    { daily: true },
    { checkup: true },
    { plan: [{ game: "pop" }] },
    { world: { id: "pack-boat", games: ["pop", "trace", "pairs"] } },
    { world: { id: "pack-smile", games: ["pop", "trace", "feed"] } },
  ]) {
    game.session = { world: boat(), ...patch };
    assert.equal(game.isBoatAdventure(), false);
  }
  game.session = null;
  assert.equal(game.isBoatAdventure(), false);
});

function screenElement() {
  const buttons = new Map();
  const element = {
    isConnected: true,
    dataset: {},
    querySelector(selector) {
      if (!buttons.has(selector)) buttons.set(selector, {
        isConnected: true,
        addEventListener(type, handler) { this[`on${type}`] = handler; },
      });
      return buttons.get(selector);
    },
    querySelectorAll() { return []; },
  };
  element.button = selector => element.querySelector(selector);
  return element;
}

test("activity replay and continue are single-use, screen-bound transitions", () => {
  const { ns } = runtime();
  const game = Object.create(ns.LettersGame.prototype);
  const el = screenElement();
  let starts = 0;
  game.session = { world: boat(), gameIndex: 1, lastStars: 2, starTotal: 5 };
  game.startGame = () => { starts += 1; };
  game.sound = { play() {} };
  game.finishWorld = () => { throw new Error("must not finish mid-adventure"); };

  game.replayActivity(el);
  game.replayActivity(el);
  assert.equal(starts, 1);
  assert.equal(game.session.gameIndex, 1);
  assert.equal(game.session.starTotal, 3);

  const next = screenElement();
  game.continueActivity(next);
  game.continueActivity(next);
  assert.equal(starts, 2);
  assert.equal(game.session.gameIndex, 2);

  const stale = screenElement();
  stale.isConnected = false;
  game.replayActivity(stale);
  assert.equal(starts, 2);
});

test("final Boat Feed reward hands off directly to one chapter celebration", () => {
  const { ns } = runtime();
  const game = Object.create(ns.LettersGame.prototype);
  let finished = 0;
  let rendered = 0;
  game.session = { world: boat(), gameIndex: 2, starTotal: 6, lastStars: 3 };
  game.finishWorld = () => { finished += 1; };
  game.screen = () => { rendered += 1; throw new Error("final Feed must not render a stars handoff"); };
  game.renderStars(3);
  assert.equal(game.session.gameIndex, 3);
  assert.equal(finished, 1);
  assert.equal(rendered, 0);
});

test("final Boat handoff is idempotent if a stale renderStars call repeats", () => {
  const { ns } = runtime();
  const game = Object.create(ns.LettersGame.prototype);
  let finished = 0;
  game.session = { world: boat(), gameIndex: 2, starTotal: 6, lastStars: 3 };
  game.finishWorld = () => { finished += 1; };
  game.renderStars(3);
  game.renderStars(3);
  assert.equal(finished, 1);
});

test("final-party replay resets to Feed without restoring spent session stars", () => {
  const { ns } = runtime();
  const game = Object.create(ns.LettersGame.prototype);
  const el = screenElement();
  let starts = 0;
  game.session = { world: boat(), gameIndex: 3, starTotal: 9, lastStars: 3 };
  game.sound = { play() {} };
  game.startGame = () => { starts += 1; };
  game.replayActivity(el, true);
  game.replayActivity(el, true);
  assert.equal(game.session.gameIndex, 2);
  assert.equal(game.session.starTotal, 6);
  assert.equal(starts, 1);
});

test("completed Boat progress renders a persisted basket memento", () => {
  const { ns } = runtime();
  const incomplete = ns.LettersJourney.memento({ done: [] });
  const complete = ns.LettersJourney.memento({ done: ["pack-boat"] });
  assert.equal(incomplete, "");
  assert.match(complete, /map-picnic-memento/);
  assert.match(complete, /<svg/);
});

test("Boat packet thumbnails accept only PNG data URLs and escape fallback labels", () => {
  const { ns } = runtime();
  const valid = "data:image/png;base64,AAAA+/==";
  const image = ns.LettersJourney.packet("ignored", valid);
  assert.match(image, /<image href="data:image\/png;base64,AAAA\+\/=="/);
  assert.doesNotMatch(ns.LettersJourney.packet("<img src=x onerror=1>", "https://example.test/x.png"), /<image/);
  assert.match(ns.LettersJourney.packet("<img src=x onerror=1>", "https://example.test/x.png"), /&lt;img src=x onerror=1&gt;/);
  assert.doesNotMatch(ns.LettersJourney.packet("safe", "data:image/svg+xml;base64,PHN2Zy8+"), /<image/);
});

test("Boat scene carries a valid drawing ahead of glyph labels without changing item text", () => {
  const { ns } = runtime();
  const valid = "data:image/png;base64,AAAA";
  const scene = ns.LettersJourney.scene({
    completed: 2,
    items: [{ id: "a", display: "ا" }, { id: "b", display: "ب" }],
    drawings: { "ب": valid },
  });
  assert.ok(scene.indexOf(`href="${valid}"`) < scene.indexOf("data-fit-box"));
  assert.match(scene, /data-fit-box/);
});

test("finishGame keeps Boat wallet best deltas while chapter unlock remains one-time", () => {
  const { ns } = runtime();
  const game = Object.create(ns.LettersGame.prototype);
  const paid = [];
  game.bests = {};
  game.earnStars = value => paid.push(value);
  game.saveJSON = () => true;
  game.renderStars = () => {};
  game.session = { world: boat(), gameIndex: 0, starTotal: 0 };
  game.finishGame(0);
  game.finishGame(0);
  assert.deepEqual(paid, [3]);
  assert.equal(game.bests["pack-boat:pop"], 3);

  game.progress = { done: [] };
  game.stars = {};
  game.stampToday = () => {};
  game.saveStars = () => true;
  game.saveProgress = () => true;
  let island = 0;
  game.island = { completeStudyStep: () => { island += 1; } };
  game.renderParty = () => {};
  game.session = { world: boat(), starTotal: 8 };
  game.finishWorld();
  game.finishWorld();
  assert.deepEqual(game.progress.done, ["pack-boat"]);
  assert.equal(island, 1);
});
