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

function feedFixture(ns) {
  const timers = [], outcomes = [], speech = [];
  const calls = { paid: 0, correct: 0, wrong: 0, starts: 0, clearedHint: 0 };
  const food = id => ({ id, disabled: false, innerHTML: id, attributes: {}, classList: classes(),
    style: { setProperty(key, value) { this[key] = value; } },
    setAttribute(key, value) { this.attributes[key] = value; },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 20, height: 20 }) });
  const a = food('ba'), b = food('ta');
  const game = Object.create(ns.LettersMiniGames.feed.prototype);
  const finishEl = { hidden: true }, nextBtn = { disabled: true }, replayBtn = { disabled: true };
  Object.assign(game, {
    alive: true, feeding: false, completionReady: false, roundIndex: 0, slips: 0,
    rounds: [{ target: { id: 'ba' } }, { target: { id: 'ta' } }], timers: new Set(),
    creatureEl: { classList: classes(), offsetWidth: 0, getBoundingClientRect: () => ({ left: 100, top: 100, width: 40, height: 40 }) },
    scene: { classList: classes() }, finishEl, nextBtn, replayBtn, delivered: { innerHTML: '' }, basket: null,
    tray: { querySelectorAll: () => [a, b], querySelector: () => null },
    ctx: { sfx(name) { if (name === 'correct') calls.correct++; if (name === 'wrong') calls.wrong++; }, clearLearningHint() { calls.clearedHint++; }, confettiAt() {},
      say(target) { speech.push(target.id); }, reportOutcome(outcome) { outcomes.push(outcome); }, onDone() { calls.paid++; }, reducedMotion: () => false },
    startRound() { calls.starts++; this.completionReady = false; this.feeding = false; },
  });
  return { game, a, b, finishEl, nextBtn, replayBtn, delivered: game.delivered, timers, outcomes, speech, calls,
    later(fn) { timers.push(fn); }, runTimers() { while (timers.length) timers.shift()(); } };
}

test('Feed records a successful offer once, locks choices, and exposes completion immediately', () => {
  const { ns } = runtime(); const f = feedFixture(ns); f.game.later = (fn) => f.later(fn);
  f.game.offer({ id: 'ba' }, f.a, { left: 20, top: 30, width: 20, height: 20 });
  f.game.offer({ id: 'ba' }, f.a, { left: 20, top: 30, width: 20, height: 20 });
  assert.equal(f.outcomes.length, 1); assert.equal(f.calls.correct, 1);
  assert.equal(f.calls.clearedHint, 1);
  assert.equal(f.game.completionReady, true); assert.equal(f.game.roundIndex, 0);
  assert.equal(f.a.disabled, true); assert.equal(f.b.disabled, true);
  assert.equal(f.finishEl.hidden, false); assert.equal(f.nextBtn.disabled, false); assert.equal(f.replayBtn.disabled, false);
  assert.equal(f.a.style['--fly-start-x'], '20px'); assert.equal(f.a.style['--fly-start-y'], '30px');
});

test('Feed replay speaks the current target without recording another outcome', () => {
  const { ns } = runtime(); const f = feedFixture(ns);
  f.game.completionReady = true; f.game.replayDelivered();
  assert.deepEqual(f.speech, ['ba']); assert.equal(f.outcomes.length, 0); assert.equal(f.calls.correct, 0);
});

test('Feed Continue advances only when ready and clears readiness synchronously', () => {
  const { ns } = runtime(); const f = feedFixture(ns);
  f.game.continueDelivery(); assert.equal(f.game.roundIndex, 0);
  f.game.completionReady = true; f.game.continueDelivery();
  assert.equal(f.game.completionReady, false); assert.equal(f.game.roundIndex, 1); assert.equal(f.calls.starts, 1);
  f.game.completionReady = true; f.game.continueDelivery(); f.game.continueDelivery();
  assert.equal(f.calls.paid, 1);
});

test('Feed landing art settles only while its delivery round is still current', () => {
  const { ns } = runtime(); const f = feedFixture(ns); f.game.later = (fn) => f.later(fn);
  f.game.offer({ id: 'ba' }, f.a); f.game.continueDelivery(); f.runTimers();
  assert.equal(f.delivered.innerHTML, ''); assert.equal(f.game.roundIndex, 1);
});

test('Feed replay during landing is not interrupted by delayed speech', () => {
  const { ns } = runtime(); const f = feedFixture(ns); f.game.later = (fn) => f.later(fn);
  f.game.offer({ id: 'ba' }, f.a);
  assert.deepEqual(f.speech, ['ba'], 'success speaks as soon as the choice is accepted');
  f.game.replayDelivered();
  assert.deepEqual(f.speech, ['ba', 'ba'], 'Replay speaks immediately');
  f.runTimers();
  assert.deepEqual(f.speech, ['ba', 'ba'], 'the landing timer only settles art');
  assert.equal(f.outcomes.length, 1);
});

test('Feed ignores stale landing callbacks after Next or destroy', () => {
  const { ns } = runtime();
  for (const destroy of [false, true]) {
    const f = feedFixture(ns); f.game.later = (fn) => f.later(fn); f.game.offer({ id: 'ba' }, f.a);
    if (destroy) f.game.destroy(); else f.game.continueDelivery();
    f.runTimers(); assert.equal(f.delivered.innerHTML, ''); assert.deepEqual(f.speech, ['ba']); assert.equal(f.calls.paid, 0);
  }
});

test('Feed wrong and missed drops do not advance; one wrong choice is reported once', () => {
  const { ns } = runtime(); const f = feedFixture(ns); f.game.later = (fn) => f.later(fn);
  f.game.offer({ id: 'ta' }, f.b); f.game.offer({ id: 'ta' }, f.b);
  assert.equal(f.calls.wrong, 1); assert.equal(f.outcomes.length, 1); assert.equal(f.outcomes[0].correct, false);
  assert.equal(f.game.roundIndex, 0); assert.equal(f.game.completionReady, false);
  f.game.basket = { getBoundingClientRect: () => ({ left: 100, top: 100, right: 160, bottom: 160, width: 60, height: 60 }) };
  if (f.game.deliveryContains(600, 600)) f.game.offer({ id: 'ba' }, f.a);
  assert.equal(f.game.roundIndex, 0); assert.equal(f.outcomes.length, 1);
});

test('Feed accepts the whole friend and forgiving edges while excluding the tray and empty stage', () => {
  const { ns } = runtime(); const f = feedFixture(ns);
  const box=(left,top,width,height)=>({getBoundingClientRect:()=>({left,top,width,height})});
  let friend=box(100,80,120,160);
  f.game.creatureEl.querySelector=()=>friend;
  f.game.creatureEl.getBoundingClientRect=()=>({left:0,top:80,width:400,height:160});
  f.game.basket=box(120,248,80,70);
  f.game.tray.getBoundingClientRect=()=>({left:40,top:330,width:300,height:70});
  for(const [x,y] of [[160,90],[105,210],[75,150],[245,150],[95,290],[225,290],[160,245]]){
    assert.equal(f.game.deliveryContains(x,y),true,`${x},${y} should be reachable`);
  }
  for(const [x,y] of [[25,150],[375,150],[160,360],[130,335],[160,20]]){
    assert.equal(f.game.deliveryContains(x,y),false,`${x},${y} should not answer`);
  }
  // Pose changes replace the SVG; rotation changes its bounds. Never cache it.
  friend=box(20,90,70,150);
  assert.equal(f.game.deliveryContains(40,150),true);
  assert.equal(f.game.deliveryContains(200,120),false);
  friend=null;
  assert.equal(f.game.deliveryContains(160,290),true);
  assert.equal(f.game.deliveryContains(10,150),false);
});

test('Feed destroy suppresses delayed landing feedback and completion', () => {
  const { ns } = runtime(); const f = feedFixture(ns); f.game.later = (fn) => f.later(fn);
  f.game.offer({ id: 'ba' }, f.a); f.game.destroy(); f.runTimers();
  assert.equal(f.delivered.innerHTML, ''); assert.deepEqual(f.speech, ['ba']);
  assert.equal(f.calls.paid, 0); assert.equal(f.game.alive, false);
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
