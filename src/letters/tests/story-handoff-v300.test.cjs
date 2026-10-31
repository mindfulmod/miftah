const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

function runtime({ seen = false, done = [], mapWelcome = false, save = () => {} } = {}) {
  const timers = [], sounds = [], calls = [];
  const ns = {
    LettersGame: function LettersGame() {},
    LetterFriends: { CHARS: ["ا", "ب", "ت", "ث", "ج", "ح", "خ"], art: c => `<${c}>`, item: c => c },
    LettersArt: { icon: () => "next" },
  };
  const context = {
    window: { MiftahGame: ns },
    setTimeout: (fn, ms) => (timers.push({ fn, ms }), timers.length),
    clearTimeout() {},
  };
  vm.runInNewContext(source("StoryGarden.js"), context);
  const selectors = {};
  const scene = { className: "sg-scene is-page-0" };
  const next = { onclick: null };
  const el = {
    isConnected: true,
    querySelector(selector) { return selectors[selector] || null; },
  };
  selectors[".sg-scene"] = scene;
  selectors[".sg-next"] = next;
  const game = Object.create(ns.LettersGame.prototype);
  Object.assign(game, {
    _windStoryOffered: false,
    progress: { done },
    mapWelcome,
    loadJSON: key => key === ns.StoryGarden.STORY_KEY ? seen : null,
    saveJSON: save,
    screen: () => el,
    topBar: () => "top",
    petSVG: () => "pet",
    wireTopBar: (_el, fn) => { game.skip = fn; },
    sound: { play: sound => sounds.push(sound) },
    say: () => {},
  });
  game.renderWindStory = ns.StoryGarden.methods.renderWindStory;
  return { ns, game, el, scene, next, timers, sounds, calls };
}

test("an empty new profile is eligible for the opening story", () => {
  assert.equal(runtime().game.shouldShowWindStory(), true);
});

test("seen story, in-session offer, progress, and map welcome each skip the opening", () => {
  for (const options of [{ seen: true }, { done: ["one"] }, { mapWelcome: true }]) {
    assert.equal(runtime(options).game.shouldShowWindStory(), false);
  }
  const r = runtime();
  r.game._windStoryOffered = true;
  assert.equal(r.game.shouldShowWindStory(), false);
});

test("a failed save still renders the story and marks the offer in memory", () => {
  const r = runtime({ save: () => false });
  assert.equal(r.game.renderWindStory(), r.el);
  assert.equal(r.game._windStoryOffered, true);
  assert.equal(r.game.shouldShowWindStory(), false);
});

test("the story advances through four explicit pages without timers", () => {
  const r = runtime();
  r.game.renderWindStory();
  assert.deepEqual(r.sounds, ["chime"]);
  assert.equal(r.timers.length, 0);
  for (let page = 1; page <= 3; page += 1) {
    r.next.onclick();
    assert.equal(r.scene.className, `sg-scene is-page-${page}`);
  }
  assert.deepEqual(r.sounds, ["chime", "rustle", "pour", "creak", "glow"]);
  assert.equal(r.timers.length, 0);
});

test("completion and skip are one-shot, and detached controls are inert", () => {
  const r = runtime();
  let completed = 0;
  r.game.renderWindStory(() => completed++);
  r.next.onclick(); r.next.onclick(); r.next.onclick(); r.next.onclick();
  assert.equal(completed, 1);
  r.next.onclick(); r.game.skip();
  assert.equal(completed, 1);

  const skipped = runtime();
  let skipCount = 0;
  skipped.game.renderWindStory(() => skipCount++);
  skipped.game.skip();
  assert.equal(skipCount, 1);
  skipped.game.skip(); skipped.next.onclick();
  assert.equal(skipCount, 1);

  const detached = runtime();
  let stale = 0;
  detached.game.renderWindStory(() => stale++);
  detached.el.isConnected = false;
  detached.next.onclick(); detached.game.skip();
  assert.equal(stale, 0);
  assert.equal(detached.scene.className, "sg-scene is-page-0");
});

test("a fresh empty map has no opening-story timer, while later map moments remain", () => {
  const r = runtime();
  const map = { isConnected: true, querySelector: () => null };
  r.game.root = { contains: () => true };
  const worlds = [{ id: "one", biome: "meadow" }];
  r.ns.StoryGarden.methods.storyOnMap.call(r.game, map, { worlds, yOf: () => 100, gap: 50, welcome: false });
  assert.equal(r.timers.length, 0);

  const graduated = runtime({ done: ["one"] });
  graduated.game.root = { contains: () => true };
  graduated.game.renderGraduation = () => graduated.calls.push("graduation");
  graduated.ns.StoryGarden.methods.storyOnMap.call(graduated.game, map, { worlds, yOf: () => 100, gap: 50, welcome: false });
  assert.deepEqual(graduated.timers.map(t => t.ms), [900]);
  graduated.timers[0].fn();
  assert.deepEqual(graduated.calls, ["graduation"]);

  const homecoming = runtime({ done: ["one"] });
  homecoming.game.root = { contains: () => true };
  homecoming.game.loadJSON = key => key === homecoming.ns.StoryGarden.HOME_KEY ? [] : null;
  homecoming.game.playHomecoming = (_el, land) => homecoming.calls.push(land);
  const twoLands = [{ id: "one", biome: "meadow" }, { id: "two", biome: "forest" }];
  homecoming.game.worlds = { worlds: twoLands };
  homecoming.ns.StoryGarden.methods.storyOnMap.call(homecoming.game, map, { worlds: twoLands, yOf: () => 100, gap: 50, welcome: false });
  assert.deepEqual(homecoming.timers.map(t => t.ms), [700]);
  homecoming.timers[0].fn();
  assert.deepEqual(homecoming.calls, ["meadow"]);
});

test("renderHome routes to the story before constructing map state", () => {
  const sourceText = source("LettersGame.js");
  const start = sourceText.indexOf("    renderHome() {");
  assert.notEqual(start, -1);
  let depth = 0, end = -1;
  for (let i = sourceText.indexOf("{", start); i < sourceText.length; i += 1) {
    if (sourceText[i] === "{") depth++;
    else if (sourceText[i] === "}" && --depth === 0) { end = i + 1; break; }
  }
  const method = sourceText.slice(start, end).replace(/^\s*renderHome\(\)/, "function renderHome()");
  const renderHome = vm.runInNewContext(`(${method})`);
  const calls = [];
  const game = {
    shouldShowWindStory: () => true,
    renderWindStory: done => { calls.push("story"); return done; },
    applyPhase() { throw new Error("map setup ran before the story"); },
  };
  const result = renderHome.call(game);
  assert.equal(calls.length, 1);
  assert.equal(typeof result, "function");
});
