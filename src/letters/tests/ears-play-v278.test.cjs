const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load() {
  const window = { MiftahGame: {} };
  const context = { window, Math, String, Number, Array, Object, Set, Map, Promise, Date, setTimeout, clearTimeout, document: { createElement: () => ({ className: '', attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, append() {} }) } };
  for (const file of ['PracticeLearning.js', 'PictureWords.js', 'EarsGames.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  return window.MiftahGame;
}
const classes = () => { const set = new Set(); return { add: x => set.add(x), remove: x => set.delete(x), contains: x => set.has(x), toggle: (x, on) => on ? set.add(x) : set.delete(x) }; };
function rootFixture() {
  const choices = Array.from({ length: 3 }, () => ({ disabled: false, classList: classes() }));
  const replays = Array.from({ length: 3 }, () => ({ disabled: false, classList: classes() }));
  const next = { disabled: false, hidden: true, classList: classes(), focus() { this.focused = true; } };
  const reference = { hidden: true, textContent: '', setAttribute() {}, append() {} };
  const rootClasses = classes();
  const root = { isConnected: true, classList: rootClasses, querySelectorAll: selector => selector === '.ea-choice' ? choices : selector === '.ea-choice-replay' ? replays : [], querySelector: selector => selector === '.ea-reference' ? reference : selector === '.ea-next' ? next : null };
  const stage = { contains: el => el === root };
  return { root, stage, choices, replays, reference, next };
}

test('picture pool preserves IDs, normalizes NFC and blocks duplicate displays with an ineligible alias', () => {
  const ns = load();
  const pool = ns.EarsGames.picturePool({ pictures: [
    { id: 'good', word: 'é' }, { id: 'alias', display: 'e\u0301', locked: true },
    { id: 'ok', word: 'bee' }, { id: 'ok-2', word: 'bee' }, { id: 'prereq', word: 'ant', prerequisiteWorldIds: ['prior'] },
  ], completedWorldIds: [] });
  assert.deepEqual(JSON.parse(JSON.stringify(pool.map(x => x.id))), ['ok']);
  assert.equal(pool[0].display, 'bee');
  assert.deepEqual(JSON.parse(JSON.stringify(ns.EarsGames.picturePool({ pictures: [] }))), []);
});

test('planner garbage is never added back and visit support is fixed from the eligible targets', () => {
  const ns = load();
  const original = ns.PracticeLearning.plan;
  ns.PracticeLearning.plan = (_ctx, items) => [items[0], { id: 'forbidden', display: 'bad' }];
  const ctx = { pictures: [{ id: 'a', word: 'ant' }, { id: 'b', word: 'bee' }] };
  const pool = ns.EarsGames.picturePool(ctx);
  const actual = ns.EarsGames.planned(ctx, pool, 'first-sound', 2);
  assert.deepEqual(JSON.parse(JSON.stringify(actual.map(x => x.id))), ['a']);
  assert.equal(actual[0], pool[0], 'planner results resolve to real pool records');
  ns.PracticeLearning.plan = original;
});

test('a verified initial sequence unlocks one independent first-sound result with the actual target ID', async () => {
  const ns = load(), fx = rootFixture(), results = [];
  const target = { id: 'pic:ant', word: 'نَمْلَة', char: 'ن' }, match = { id: 'pic:bee', word: 'نَحْلَة', char: 'ن' }, distractor = { id: 'pic:egg', word: 'بَيْضَة', char: 'ب' };
  const game = Object.create(ns.GardenPractice.SameStart.prototype);
  Object.assign(game, { ctx: { reportOutcome: x => results.push(x), sfx() {}, correct() {}, confettiAt() {} }, alive: true, roundToken: 4, root: fx.root, stage: fx.stage, round: 0, rounds: 3, target, match, choices: [match, distractor], mode: 'same', skill: 'first-sound', answerReady: true, initialVerified: true, assisted: false, busy: false, misses: 0, reported: new Set(), timers: new Set(), waiters: new Map() });
  game.correctChoice = p => p.id === match.id; game.targetForReport = () => target; game.lock = ns.GardenPractice.SameStart.prototype.lock; game.playWords = async () => true; game.wait = async () => true; game.cheer = () => {}; game.completeRound = ns.GardenPractice.SameStart.prototype.completeRound; game.next = () => { game.advanced = (game.advanced || 0) + 1; };
  await game.pick(0, fx.choices[0], 4, fx.root);
  assert.equal(results.length, 1); assert.equal(results[0].itemId, 'pic:ant'); assert.equal(results[0].correct, true);
  assert.equal(results[0].evidence, 'independent_listening'); assert.equal(results[0].affectsStrength, false);
  assert.equal(game.round, 1); assert.equal(game.awaitingContinue, true); assert.equal(fx.next.hidden, false);
  game.continueRound(4, fx.root, {});
  assert.equal(game.advanced, 1);
  await game.pick(0, fx.choices[0], 4, fx.root);
  assert.equal(results.length, 1, 'a completed prompt cannot report twice');
});

test('wrong feedback blocks a fast correction; replay, failed playback and reference all keep success assisted', async () => {
  const ns = load(), fx = rootFixture(), results = [];
  const target = { id: 'target', word: 'target' }, right = { id: 'right', word: 'right' }, wrong = { id: 'wrong', word: 'wrong' };
  const game = Object.create(ns.GardenPractice.SameStart.prototype);
  Object.assign(game, { ctx: { reportOutcome: x => results.push(x), sfx() {} }, alive: true, roundToken: 9, root: fx.root, stage: fx.stage, target, match: right, choices: [wrong, right], mode: 'same', skill: 'first-sound', answerReady: true, initialVerified: true, assisted: false, busy: false, misses: 0, reported: new Set(), timers: new Set(), waiters: new Map() });
  game.correctChoice = p => p.id === right.id; game.targetForReport = () => target; game.lock = ns.GardenPractice.SameStart.prototype.lock; game.playWords = async () => { game.pendingFeedback = true; return false; }; game.wobble = () => {}; game.cheer = () => {}; game.wait = async () => true; game.next = () => {};
  const pending = game.pick(0, fx.choices[0], 9, fx.root);
  assert.equal(game.busy, true); await game.pick(1, fx.choices[1], 9, fx.root); assert.equal(results.length, 1, 'rapid correct tap is ignored while wrong feedback is active');
  game.playWords = async () => false; game.busy = false; game.answerReady = true;
  await game.replayPrompt(9, fx.root);
  assert.equal(game.assisted, true); assert.equal(fx.reference.hidden, false); assert.equal(fx.root.querySelectorAll('.ea-choice')[1].classList.contains('is-hint'), true);
  game.playWords = async () => true; game.busy = false; game.answerReady = true;
  await game.pick(1, fx.choices[1], 9, fx.root);
  assert.equal(results.at(-1).evidence, 'supported_visible_matching'); assert.equal(results.at(-1).affectsStrength, false);
  await pending;
});

test('stale round callbacks and rejected speech cannot proceed or claim verified listening', async () => {
  const ns = load(), fx = rootFixture();
  const game = Object.create(ns.GardenPractice.OddSound.prototype);
  Object.assign(game, { ctx: { say: () => Promise.reject(new Error('speaker unavailable')) }, alive: true, roundToken: 2, speechToken: 0, root: fx.root, stage: fx.stage, timers: new Set(), waiters: new Map(), pendingSpeech: new Set() });
  let spoke = false; game.sayFailedHint = () => { spoke = true; };
  game.choices = [{ id: 'a', word: 'a' }, { id: 'b', word: 'b' }, { id: 'c', word: 'c' }]; game.answerReady = false;
  assert.equal(await game.say(game.choices[0]), false, 'a rejected speech promise is never marked heard');
  const token = game.roundToken; game.roundToken++;
  assert.equal(game.current(token, fx.root), false);
  assert.equal(spoke, false);
});

test('BeatDrum reports completed beats as guided motor participation, never recall', () => {
  const ns = load(), game = Object.create(ns.GardenPractice.BeatDrum.prototype), results = [];
  Object.assign(game, { ctx: { reportOutcome: x => results.push(x) }, alive: true, roundToken: 1, card: { id: 'pic:bee', word: 'نَحْلَة' }, reported: new Set(), assisted: false });
  game.report(game.card, 'syllable-beats', true, 'motor_assembly_participation', false, [], false);
  assert.deepEqual(results.map(r => [r.correct, r.evidence, r.affectsStrength]), [[true, 'motor_assembly_participation', false]]);
});

