const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function node(cls = '', dataset = {}) {
  let disabled = false;
  const values = new Set(cls ? cls.split(/\s+/) : []), listeners = {};
  return { className: cls, classList: { add: (...xs) => xs.forEach(x => values.add(x)), remove: (...xs) => xs.forEach(x => values.delete(x)), contains: x => values.has(x), toggle(x, force) { const on = force === undefined ? !values.has(x) : force; on ? values.add(x) : values.delete(x); return on; } }, dataset, style: {}, listeners, document: null, get disabled() { return disabled; }, set disabled(value) { disabled = value; if (value && this.document?.activeElement === this) this.document.activeElement = this.document.body; },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }, click() { if (!this.disabled) (this.listeners.click || []).forEach(fn => fn()); }, focus() { if (!this.disabled && this.document) this.document.activeElement = this; }, matches(selector) { return selector === ':focus-visible' && this.document?.activeElement === this; }, animate() {},
    insertAdjacentHTML(_where, html) { this.innerHTML = (this.innerHTML || '') + html; }, replaceChildren() { this.innerHTML = ''; },
    getBoundingClientRect() { return { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }; } };
}
class Root {
  constructor(document) { this.document = document; }
  set innerHTML(value) {
    this.html = value; this.nodes = {};
    const classes = ['pz-balloon','pz-car','pz-rails','pz-drive','pz-cars','pz-progress'];
    for (const m of value.matchAll(/<(button|span|div|i)[^>]*class="([^"]+)"([^>]*)>/g)) {
      const [, , raw, attrs] = m, names = raw.split(/\s+/), cls = names.find(x => classes.includes(x));
      if (!cls) continue;
      const data = Object.fromEntries([...attrs.matchAll(/data-([\w-]+)="([^"]+)"/g)].map(x => [x[1], x[2]]));
      const el = node(raw, data); el.document = this.document; el.classList.add(...names); (this.nodes[cls] ||= []).push(el);
    }
  }
  querySelectorAll(s) { return this.nodes?.[s.slice(1)] || []; }
  querySelector(s) { return this.querySelectorAll(s)[0] || null; }
  contains(el) { return Object.values(this.nodes || {}).some(xs => xs.includes(el)); }
}
function setup(opts = {}) {
  const timers = [], outcomes = [], chars = ['ا','ب','ت','ث'];
  const ns = { LetterFriends: { FRIENDS: Object.fromEntries(chars.map(c => [c, {}])), art: c => `<svg>${c}</svg>` },
    LettersStrokes: { LETTERS: Object.fromEntries(chars.map(c => [c, []])) }, LETTERS_DATA: { packs: [{ letters: chars.map((char, i) => ({ char, arName: `name ${i}` })) }] },
    PracticeLearning: { profile: () => ({ choiceCount: 2 }), level: () => 0, orderChars: (_c, pool) => pool.slice() },
    GardenPractice: { draggable(_el, options) { setup.drags.push(options); return () => {}; }, inside: (_el, x) => x >= 0 } };
  setup.drags = [];
  const document = { activeElement: null, body: {} };
  const context = { window: { MiftahGame: ns }, document, setTimeout(fn, ms) { const t = { fn, ms, cleared: false, fired: false }; timers.push(t); return t; }, clearTimeout(t) { if (t) t.cleared = true; }, Math: Object.assign(Object.create(Math), { random: () => 0.2 }) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'PuzzleGames.js'), 'utf8'), context);
  const items = chars.map(display => ({ id: display, display, speak: display }));
  const root = new Root(document);
  const ctx = { items, known: [], beginner: false, reducedMotion: () => opts.reduced || false, stage: { innerHTML: '', firstElementChild: root }, reportOutcome: o => outcomes.push(o), beginRound() {}, say: () => true, sfx() {}, correct() {}, confettiAt() {}, done() { opts.doneCount = (opts.doneCount || 0) + 1; }, cancel() {}, pet: { cheer() {} }, setupActionCue: cue => { (opts.cues ||= []).push(cue); return { destroy() { cue.destroyed = true; } }; } };
  const game = new ns.GardenPractice.LetterTrain(ctx);
  
  return { ns, ctx, root, outcomes, timers, game, opts, document };
}
function flush(timers) { for (const t of [...timers]) if (!t.cleared && !t.fired) { t.fired = true; t.fn(); } }
async function settleSequence(timers) { for (let i = 0; i < 8; i += 1) { flush(timers); await Promise.resolve(); await Promise.resolve(); } }
function popExpected(f) { const { game, root } = f; const balloon = root.querySelectorAll('.pz-balloon').find(b => b.dataset.c === game.order[game.at]); assert.ok(balloon); assert.equal(game.pop(balloon), true); }

test('boarding stays put after the refrain; only the child can depart', async () => {
  const f = setup(); const g = f.game;
  popExpected(f); popExpected(f);
  assert.equal(g.phase, 'singing');
  await settleSequence(f.timers);
  assert.equal(g.phase, 'ready');
  flush(f.timers);
  assert.equal(g.ride, 0); assert.equal(g.phase, 'ready');
  assert.equal(f.outcomes.length, 1); assert.equal(f.opts.doneCount, undefined);
});

test('each boarding step retargets the real cue and assisted assembly reports once', () => {
  const f = setup(); const g = f.game;
  assert.equal(f.opts.cues[0].source.dataset.c, g.order[0]); assert.equal(f.opts.cues[0].destination.dataset.i, '0');
  f.opts.cues[0].onShow(); popExpected(f);
  assert.equal(f.opts.cues[1].source.dataset.c, g.order[1]); assert.equal(f.opts.cues[1].destination.dataset.i, '1');
  popExpected(f);
  assert.equal(f.outcomes.length, 1); assert.equal(f.outcomes[0].correct, undefined); assert.equal(f.outcomes[0].affectsStrength, false);
});

test('car replay and real refrain replay stay on the ride without extra outcome reports', async () => {
  const f = setup(); const g = f.game, said = []; f.ctx.say = entry => { said.push(entry.display); return true; };
  popExpected(f); popExpected(f); await settleSequence(f.timers);
  assert.equal(g.ride, 0); assert.equal(await g.hearCar(1), true);
  const before = said.length; g.replayPrompt(); await settleSequence(f.timers);
  assert.ok(said.length > before, 'replayPrompt speaks the refrain again');
  assert.equal(g.phase, 'ready'); assert.equal(f.outcomes.length, 1);
});

test('departure during pending speech cancels the sequence and ignores its late settlement', async () => {
  const f = setup(); let settle; f.ctx.say = () => new Promise(resolve => { settle = resolve; });
  popExpected(f); popExpected(f);
  assert.equal(f.game.phase, 'singing');
  assert.equal(f.game.depart(), true); assert.equal(f.game.phase, 'departing');
  settle(true); await Promise.resolve(); await Promise.resolve();
  assert.equal(f.game.phase, 'departing'); assert.equal(f.game.depart(), false);
});

test('depart rejects stale and duplicate input; the last ride finishes once', async () => {
  const f = setup(); const g = f.game; const token = g.rideToken;
  popExpected(f); popExpected(f); await Promise.resolve(); await Promise.resolve();
  assert.equal(g.depart(token - 1), false); assert.equal(g.depart(token), true); assert.equal(g.depart(token), false);
  flush(f.timers);
  assert.equal(g.ride, 1); assert.equal(g.phase, 'boarding');
  popExpected(f); popExpected(f); await Promise.resolve(); await Promise.resolve();
  assert.equal(g.depart(), true); flush(f.timers);
  assert.equal(g.phase, 'finished');
  flush(f.timers); assert.equal(f.opts.doneCount, 1);
  g.finish(); flush(f.timers); assert.equal(f.opts.doneCount, 1, 'finish and done callbacks are idempotent');
});

test('rejected speech still leaves the child a working drive control', async () => {
  const f = setup(); f.ctx.canListen = () => true; f.ctx.say = () => Promise.reject(Error('unavailable'));
  popExpected(f); popExpected(f); await settleSequence(f.timers);
  assert.equal(f.game.phase, 'ready'); assert.equal(f.root.querySelector('.pz-drive').disabled, false);
  assert.equal(f.game.depart(), true);
});

test('reduced motion still gives a short visible departure delay', async () => {
  const f = setup({ reduced: true }); popExpected(f); popExpected(f); await settleSequence(f.timers);
  assert.equal(f.game.phase, 'ready'); assert.equal(f.game.depart(), true);
  assert.ok(f.timers.some(t => t.ms === 350));
});

test('destroy retires sequence and wait callbacks without advancing or completing', async () => {
  const f = setup(); let settle; f.ctx.say = () => new Promise(resolve => { settle = resolve; });
  popExpected(f); popExpected(f); f.game.wait(500);
  f.game.destroy(); settle(true); flush(f.timers); await Promise.resolve();
  assert.equal(f.game.alive, false); assert.equal(f.game.phase, 'singing'); assert.equal(f.opts.doneCount, undefined);
});


test('old ride balloon, drag, car, drive, and cue callbacks cannot change a later ride', async () => {
  const f = setup(), g = f.game;
  const oldBalloon = f.root.querySelectorAll('.pz-balloon')[0], oldCar = f.root.querySelectorAll('.pz-car')[0], oldDrive = f.root.querySelector('.pz-drive');
  const oldDrag = setup.drags[0], oldCue = f.opts.cues[0];
  popExpected(f); popExpected(f); await settleSequence(f.timers);
  assert.equal(g.depart(), true); flush(f.timers);
  assert.equal(g.phase, 'boarding'); const at = g.at, missed = g.missed, reports = f.outcomes.length;
  oldBalloon.click(); oldCar.click(); oldDrive.click(); oldCue.onShow();
  assert.equal(oldDrag.enabled(), false); assert.equal(oldDrag.drop(10, 10), false);
  assert.equal(g.at, at); assert.equal(g.phase, 'boarding'); assert.equal(g.missed, missed); assert.equal(f.outcomes.length, reports);
});

test('car replay preserves focus on the pressed carriage until speech settles', async () => {
  const f = setup(); popExpected(f); popExpected(f); await settleSequence(f.timers);
  let release; f.ctx.say = () => new Promise(resolve => { release = resolve; });
  const cars = f.root.querySelectorAll('.pz-car'), pressed = cars[1]; f.document.activeElement = pressed;
  pressed.click();
  assert.equal(pressed.disabled, false); assert.equal(cars[0].disabled, true);
  assert.equal(f.document.activeElement, pressed);
  release(true); for (let i = 0; i < 6; i += 1) await Promise.resolve();
  assert.equal(pressed.disabled, false); assert.equal(f.game.phase, 'ready');
});


test('keyboard focus on drive returns to the first balloon after departure', async () => {
  const f = setup(); popExpected(f); popExpected(f); await settleSequence(f.timers);
  const drive = f.root.querySelector('.pz-drive'); f.document.activeElement = drive;
  assert.equal(f.game.depart(), true);
  assert.equal(f.document.activeElement, f.document.body, 'disabling focused drive releases focus');
  flush(f.timers);
  assert.equal(f.document.activeElement, f.root.querySelectorAll('.pz-balloon')[0]);
});
