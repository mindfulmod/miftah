const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classes() {
  const values = new Set();
  return {
    add: (...names) => names.forEach(name => values.add(name)),
    remove: (...names) => names.forEach(name => values.delete(name)),
    toggle: (name, force) => {
      const enabled = force === undefined ? !values.has(name) : force;
      enabled ? values.add(name) : values.delete(name);
      return enabled;
    },
    contains: name => values.has(name),
  };
}

function runtime() {
  const cancelledFrames = [];
  const ns = {
    LettersLearning: { profile: (_item, ctx) => ({ choiceCount: 3, promptMode: ctx.canListen?.() === false ? 'match' : 'listen' }) },
    LettersStrength: { skillProfile: () => ({}) },
    LetterFriends: {
      FRIENDS: { 'ب': {}, 'ت': {}, 'ث': {} },
      art: () => '<svg/>', item: c => ({ id: c, display: c }),
      get: c => ({ en: c, call: `friend-${c}`, word: c }),
    },
    LettersStrokes: { LETTERS: {} },
  };
  const context = {
    window: { MiftahGame: ns }, Math, Date,
    setTimeout: () => 1, clearTimeout() {},
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: id => cancelledFrames.push(id),
    performance: { now: () => 1 },
    getComputedStyle: () => ({ left: '30px' }),
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'PracticeLearning.js'), 'utf8'), context, { filename: 'PracticeLearning.js' });
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'ToyBoxGames.js'), 'utf8'), context, { filename: 'ToyBoxGames.js' });
  return { ns, cancelledFrames };
}

function node(rect = { left: 100, top: 100, width: 40, height: 40 }) {
  rect = { ...rect, right: rect.right ?? rect.left + rect.width, bottom: rect.bottom ?? rect.top + rect.height };
  return {
    classList: classes(), dataset: {}, style: {}, innerHTML: '', disabled: false,
    listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; },
    getBoundingClientRect: () => rect,
    querySelectorAll: () => [],
    setAttribute() {},
  };
}

function pondRoot() {
  const pond = node();
  return { pond, querySelector: selector => selector === '.tb-pond' ? pond : null };
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test('Bath Time keeps one primary scrub pointer and releases capture and RAF on cancel', () => {
  const { ns, cancelledFrames } = runtime();
  const svg = node();
  const captured = new Set(), released = [];
  svg.setPointerCapture = id => captured.add(id);
  svg.hasPointerCapture = id => captured.has(id);
  svg.releasePointerCapture = id => { released.push(id); captured.delete(id); };
  const game = Object.create(ns.GardenPractice.BathTime.prototype);
  const moves = [];
  Object.assign(game, { alive: true, clean: false, svg, scrubPointer: null, scrubMove: e => moves.push(e.pointerId) });
  game.wireScrub();

  const prevent = { count: 0 };
  svg.listeners.pointerdown({ pointerId: 7, button: 0, isPrimary: true, preventDefault() { prevent.count += 1; } });
  svg.listeners.pointerdown({ pointerId: 8, button: 0, isPrimary: true, preventDefault() { prevent.count += 1; } });
  svg.listeners.pointerdown({ pointerId: 9, button: 0, isPrimary: false, preventDefault() { prevent.count += 1; } });
  svg.listeners.pointermove({ pointerId: 8 });
  svg.listeners.pointermove({ pointerId: 7 });
  assert.equal(game.scrubPointer, 7);
  assert.deepEqual(moves, [7, 7], 'only the owning pointer starts and moves the scrub');
  assert.equal(prevent.count, 1, 'ignored pointers do not take over or suppress their event');
  assert.deepEqual([...captured], [7]);

  game.lastScrub = { x: 3, y: 4 };
  game.raf = 33;
  game.cursor = node();
  game.cursor.classList.add('is-scrubbing');
  svg.listeners.pointercancel({ pointerId: 8 });
  assert.equal(game.scrubPointer, 7, 'a secondary pointer cancellation leaves the owner intact');
  svg.listeners.pointercancel({ pointerId: 7 });
  assert.deepEqual(released, [7]);
  assert.deepEqual(cancelledFrames, [33]);
  assert.equal(game.scrubPointer, null);
  assert.equal(game.lastScrub, null);
  assert.equal(game.raf, 0);
  assert.equal(game.cursor.classList.contains('is-scrubbing'), false);
});

test('Bath Time fills fast scrub gaps and breaks the path outside the tub bounds', () => {
  const { ns } = runtime();
  const game = Object.create(ns.GardenPractice.BathTime.prototype);
  const marks = [];
  Object.assign(game, {
    alive: true, clean: false, lastScrub: null, cursor: node(),
    toBox: e => e.point,
    follow() {}, scrubAt: (x, y) => marks.push([x, y]),
  });
  game.scrubMove({ point: { x: 0, y: 0 } });
  marks.length = 0;
  game.scrubMove({ point: { x: 21, y: 0 } });
  assert.deepEqual(marks, [[7, 0], [14, 0], [21, 0]], 'a 21-unit swipe is sampled at no more than 7 units apart');

  game.scrubMove({ point: { x: 113, y: 0 } });
  assert.equal(game.lastScrub, null, 'leaving the SVG box breaks the current scrub segment');
  marks.length = 0;
  game.scrubMove({ point: { x: 30, y: 0 } });
  assert.deepEqual(marks, [[30, 0]], 're-entry starts a new segment instead of bridging across the outside area');
});

test('Fishing reveals the target after a rejected prompt while leaving its fish playable', async () => {
  const { ns } = runtime();
  const { pond, ...root } = pondRoot();
  const prompts = [], outcomes = [];
  const pending = deferred();
  const game = Object.create(ns.GardenPractice.LetterFishing.prototype);
  Object.assign(game, {
    alive: true, busy: false, target: 'ب', promptVersion: 1, listenPrompt: true, heard: false, missed: false, root,
    fish: ['ب', 'ت'], ctx: {
      say: () => pending.promise, prompt: value => prompts.push(value),
      reportOutcome: outcome => outcomes.push(outcome), sfx() {},
    },
    cast() {}, landFish(_button, letter) { this.landed = letter; },
  });
  const prompt = game.presentPrompt('ب', 1);
  pending.reject(new Error('audio unavailable'));
  assert.equal(await prompt, false);
  assert.equal(game.listenPrompt, false);
  assert.equal(game.missed, true);
  assert.equal(prompts.at(-1).id, 'ب', 'the requested letter is shown after audio fails');
  assert.equal(pond.classList.contains('is-still'), true);
  assert.equal(game.busy, false, 'prompt fallback does not block fish selection');
  assert.equal(game.pick(0, node()), true, 'a fish remains selectable after the prompt fallback');
  assert.equal(game.landed, 'ب');
  assert.equal(outcomes[0].evidence, 'supported_visible_matching');
});

test('Fishing replay is assisted and cannot earn independent-listening evidence', () => {
  const { ns } = runtime();
  const { root } = pondRoot();
  const prompts = [], outcomes = [];
  const game = Object.create(ns.GardenPractice.LetterFishing.prototype);
  Object.assign(game, {
    alive: true, busy: false, target: 'ب', promptVersion: 1, listenPrompt: true, heard: true, missed: false, root,
    ctx: { say: () => true, prompt: value => prompts.push(value), reportOutcome: outcome => outcomes.push(outcome) },
  });
  game.replayPrompt();
  assert.equal(game.missed, true);
  assert.equal(game.listenPrompt, false, 'replay immediately displays the target');
  assert.equal(prompts.at(-1).id, 'ب');
  game.report('ب', 'ب', ['ب', 'ت'], { listening: true });
  assert.equal(outcomes[0].assisted, true);
  assert.equal(outcomes[0].evidence, 'supported_visible_matching');
});

test('Fishing ignores a prompt promise that completes after its round becomes stale or is destroyed', async () => {
  const { ns } = runtime();
  const { root } = pondRoot();
  const pending = deferred();
  const game = Object.create(ns.GardenPractice.LetterFishing.prototype);
  Object.assign(game, {
    alive: true, busy: false, target: 'ب', promptVersion: 4, listenPrompt: true, heard: false, root, timers: [],
    ctx: { say: () => pending.promise, prompt() {} },
  });
  const oldRound = game.presentPrompt('ب', 4);
  game.promptVersion += 1;
  pending.resolve(true);
  assert.equal(await oldRound, true, 'the caller still receives the speech result');
  assert.equal(game.heard, false, 'a stale round cannot claim the late speech');

  const afterDestroySpeech = deferred();
  game.promptVersion += 1;
  game.ctx.say = () => afterDestroySpeech.promise;
  const afterDestroy = game.presentPrompt('ب', game.promptVersion);
  game.destroy();
  afterDestroySpeech.resolve(true);
  await afterDestroy;
  assert.equal(game.heard, false, 'destroyed games ignore late speech completion');
});

function flyingFishGame(ns, { still = false } = {}) {
  const bucket = node({ left: 220, top: 120, width: 50, height: 50 });
  const slot = node();
  const fish = node({ left: 20, top: 30, width: 40, height: 30 });
  let resolveFlight;
  const flight = {
    finished: new Promise(resolve => { resolveFlight = resolve; }),
    cancelCount: 0,
    cancel() { this.cancelCount += 1; },
  };
  fish.animate = () => flight;
  const pending = [];
  const game = Object.create(ns.GardenPractice.LetterFishing.prototype);
  Object.assign(game, {
    alive: true, busy: true, target: 'ب', promptVersion: 5, round: 0, caught: [], flights: new Set(), timers: [], dragResets: [],
    ctx: { reducedMotion: () => still },
    root: { querySelector: selector => selector === '.tb-bucket' ? bucket : null, querySelectorAll: () => [slot] },
    still: () => still,
    later: (fn, ms) => { pending.push({ ms, run: () => { if (game.alive) fn(); } }); return pending.length; },
    cheer() {}, nextCount: 0, next() { this.nextCount += 1; },
  });
  return { game, bucket, slot, fish, flight, pending, resolveFlight };
}

test('Fishing lands an animated catch once even when animation completion and fallback both fire', async () => {
  const { ns } = runtime();
  const { game, slot, fish, flight, pending, resolveFlight } = flyingFishGame(ns);
  game.landFish(fish, 'ب');
  assert.equal(game.flights.size, 1);
  resolveFlight();
  await Promise.resolve();
  assert.deepEqual(game.caught, ['ب']);
  assert.equal(game.round, 1);
  assert.equal(pending.filter(timer => timer.ms === 1100).length, 1, 'arrival schedules one next-round transition');
  assert.equal(slot.classList.contains('is-filled'), true);
  assert.equal(fish.classList.contains('is-landed'), true);
  assert.equal(flight.cancelCount, 1);
  pending.find(timer => timer.ms === 720)?.run();
  assert.deepEqual(game.caught, ['ب'], 'the fallback cannot append a second copy');
  assert.equal(game.round, 1);
  pending.find(timer => timer.ms === 1100)?.run();
  assert.equal(game.nextCount, 1);
});

test('Fishing lands immediately under reduced motion and destruction during flight cannot award or advance', async () => {
  const { ns } = runtime();
  const reduced = flyingFishGame(ns, { still: true });
  reduced.game.landFish(reduced.fish, 'ب');
  assert.deepEqual(reduced.game.caught, ['ب']);
  assert.equal(reduced.game.round, 1);
  assert.equal(reduced.pending.filter(timer => timer.ms === 1100).length, 1);
  assert.equal(reduced.flight.cancelCount, 0, 'reduced motion skips creating an animation flight');

  const destroyed = flyingFishGame(ns);
  destroyed.game.landFish(destroyed.fish, 'ب');
  destroyed.game.destroy();
  destroyed.resolveFlight();
  await Promise.resolve();
  destroyed.pending.forEach(timer => timer.run());
  assert.deepEqual(destroyed.game.caught, []);
  assert.equal(destroyed.game.round, 0);
  assert.equal(destroyed.game.nextCount, 0);
});
