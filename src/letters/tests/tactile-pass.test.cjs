const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function runtime() {
  const timers = [];
  const window = { MiftahGame: { LettersArt: {}, LettersGardenArt: {} }, addEventListener() {}, removeEventListener() {} };
  const document = { createElement: () => ({ style: {}, classList: { add() {}, remove() {}, contains() { return false; } }, setAttribute() {}, addEventListener() {} }) };
  const context = { window, document, setTimeout: fn => (timers.push(fn), fn), clearTimeout() {}, requestAnimationFrame() {}, performance: { now: () => 0 } };
  for (const file of ['GardenPractice.js', 'MiniGames.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  }
  return { ns: window.MiftahGame, timers };
}

function classes() {
  const values = new Set();
  return { add: value => values.add(value), remove: value => values.delete(value), contains: value => values.has(value), toggle: (value, on) => on ? values.add(value) : values.delete(value) };
}

function traceFixture(ns, calls) {
  const outer = { classList: classes(), parentElement: null, querySelectorAll: () => [] };
  const paper = { classList: classes(), parentElement: outer, querySelectorAll: () => [] };
  const canvas = { parentElement: paper, hasPointerCapture: () => false, getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) };
  const game = Object.create(ns.LettersMiniGames.trace.prototype);
  Object.assign(game, { alive: true, advancing: false, completionReady: false, roundIndex: 0,
    targets: [{ id: 'ba', display: 'ب' }, { id: 'ta', display: 'ت' }], guide: [[0, 0]], paint: new Set(['0|0']), clusters: [['0|0']],
    clearBtn: { disabled: false }, paletteButtons: [], canvas, finishEl: { hidden: true }, nextBtn: { disabled: true, focus() {} },
    ctx: { sfx: () => calls.sfx++, confettiAt: () => calls.confetti++, say: () => calls.say++, onDone: () => calls.done++, reportOutcome: outcome => calls.outcomes.push(outcome) },
    startRound() { calls.start++; this.advancing = false; this.completionReady = false; } });
  return game;
}

test('Trace waits for the child to press Continue and completion is idempotent', () => {
  const { ns } = runtime();
  const calls = { sfx: 0, confetti: 0, say: 0, start: 0, done: 0, outcomes: [] };
  const game = traceFixture(ns, calls);
  game.drawing = true; game.activePointer = 1;
  game.penUp({ pointerId: 1 });
  game.completeDrawing();
  assert.equal(game.completionReady, true);
  assert.equal(game.advancing, true);
  assert.equal(game.roundIndex, 0);
  assert.equal(game.clearBtn.disabled, true);
  assert.equal(calls.sfx, 1); assert.equal(calls.confetti, 1); assert.equal(calls.say, 1); assert.equal(calls.outcomes.length, 1);
  game.continueDrawing();
  game.continueDrawing();
  assert.equal(game.alive, true);
  assert.equal(game.roundIndex, 1);
  assert.equal(calls.start, 1);
  assert.equal(calls.done, 0);
  game.completeDrawing();
  game.continueDrawing();
  assert.equal(game.alive, false);
  assert.equal(calls.done, 1);
});

test('Trace destroy retires the pending Continue action and stale callbacks cannot reward twice', () => {
  const { ns } = runtime();
  const calls = { sfx: 0, confetti: 0, say: 0, done: 0, start: 0, outcomes: [] };
  const game = traceFixture(ns, calls);
  game.completeDrawing();
  game.destroy();
  game.continueDrawing();
  game.continueDrawing();
  assert.equal(game.alive, false);
  assert.equal(game.completionReady, false);
  assert.equal(game.roundIndex, 0);
  assert.equal(calls.done, 0);
});

test('Feed uses the captured release rectangle and locks duplicate delivery callbacks', () => {
  const { ns, timers } = runtime();
  let done = 0, effects = 0;
  const food = { disabled: false, classList: classes(), style: { setProperty(key, value) { this[key] = value; } }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 20, height: 20 }) };
  const creature = { classList: classes(), getBoundingClientRect: () => ({ left: 100, top: 100, width: 40, height: 40 }) };
  const game = Object.create(ns.LettersMiniGames.feed.prototype);
  Object.assign(game, {
    alive: true, feeding: false, roundIndex: 0, slips: 0, rounds: [{ target: { id: 'ba' } }], timers: new Set(),
    creatureEl: creature, tray: { querySelectorAll: () => [food] },
    ctx: { sfx: () => effects++, confettiAt: () => effects++, say: () => effects++, onDone: () => done++ },
  });
  game.offer({ id: 'ba' }, food, { left: 20, top: 30, width: 20, height: 20 });
  game.offer({ id: 'ba' }, food, { left: 20, top: 30, width: 20, height: 20 });
  assert.equal(game.feeding, true);
  assert.equal(food.style['--fly-start-x'], '20px');
  assert.equal(food.style['--fly-start-y'], '30px');
  assert.equal(food.style['--fly-x'], '110px');
  assert.equal(food.style['--fly-y'], '117.2px');
  timers[0]();
  timers[1]();
  timers[1]();
  assert.equal(done, 1);
  assert.equal(game.alive, false);
});

test('Feed destroy suppresses delayed landing feedback and completion', () => {
  const { ns, timers } = runtime();
  let done = 0, effects = 0;
  const food = { disabled: false, classList: classes(), style: { setProperty() {} }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 20, height: 20 }) };
  const creature = { classList: classes(), getBoundingClientRect: () => ({ left: 100, top: 100, width: 40, height: 40 }) };
  const game = Object.create(ns.LettersMiniGames.feed.prototype);
  Object.assign(game, { alive: true, feeding: false, roundIndex: 0, slips: 0, rounds: [{ target: { id: 'ba' } }], timers: new Set(), creatureEl: creature, tray: { querySelectorAll: () => [food] }, ctx: { sfx() {}, confettiAt: () => effects++, say: () => effects++, onDone: () => done++ } });
  game.offer({ id: 'ba' }, food);
  game.destroy();
  timers.forEach(callback => callback());
  assert.equal(effects, 0);
  assert.equal(done, 0);
  assert.equal(game.alive, false);
});

test('draggable captures release geometry before reset and pointercancel never drops', () => {
  const { ns } = runtime();
  const events = {}; let captured = null; let drops = 0; let release = null; let near = false;
  const source = { style: {}, classList: classes(), addEventListener: (name, fn) => { events[name] = fn; },
    setPointerCapture: id => { captured = id; }, hasPointerCapture: id => captured === id, releasePointerCapture: () => { captured = null; },
    getBoundingClientRect: () => source.style.transform ? ({ left: 70, top: 80, width: 20, height: 20 }) : ({ left: 0, top: 0, width: 20, height: 20 }) };
  ns.GardenPractice.draggable(source, { onDragMove: () => { near = true; }, onDragEnd: () => { near = false; }, drop: (x, y, rect) => { drops++; release = rect; } });
  const down = { pointerId: 4, pointerType: 'touch', button: 0, clientX: 10, clientY: 10 };
  events.pointerdown(down); events.pointermove({ ...down, clientX: 30, clientY: 30 });
  events.pointerup({ ...down, clientX: 70, clientY: 80 });
  assert.equal(drops, 1); assert.deepEqual(release, { left: 70, top: 80, width: 20, height: 20 }); assert.equal(near, false); assert.equal(captured, null);
  events.pointerdown(down); events.pointermove({ ...down, clientX: 30, clientY: 30 }); events.pointercancel({ pointerId: 4 });
  assert.equal(drops, 1); assert.equal(near, false); assert.equal(captured, null);
});

test('Trace maps pointer coordinates through an object-fit letterbox', () => {
  const { ns } = runtime();
  const trace = Object.create(ns.LettersMiniGames.trace.prototype);
  trace.canvas = { width: 200, height: 200, getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 200 }) };
  assert.deepEqual(Array.from(trace.pos({ clientX: 200, clientY: 100 })), [100, 100]);
  assert.equal(trace.pos({ clientX: 49, clientY: 100 }), null);
});
