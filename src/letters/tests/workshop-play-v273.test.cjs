const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('an unavailable same-body construction pool returns without a completion reward', () => {
  const fx = setup({ level: 1, items: ['ب', 'ت', 'ث'] });
  let cancelled = 0, completed = 0;
  fx.ctx.cancel = () => { cancelled += 1; };
  fx.ctx.done = () => { completed += 1; };
  const game = new fx.ns.GardenPractice.BuildLetter(fx.ctx);
  assert.equal(game.rounds, 0);
  fx.timers.forEach(timer => timer.fn());
  assert.equal(cancelled, 1);
  assert.equal(completed, 0);
  game.destroy();
});

function classes() {
  const values = new Set();
  return { add: (...xs) => xs.forEach((x) => values.add(x)), remove: (...xs) => xs.forEach((x) => values.delete(x)),
    contains: (x) => values.has(x), toggle: (x, force) => { const on = force === undefined ? !values.has(x) : force; on ? values.add(x) : values.delete(x); return on; } };
}
function node() {
  const listeners = {};
  return { innerHTML: '', classList: classes(), listeners, dataset: {}, disabled: false, inserted: '',
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }, dispatch(type) { for (const fn of listeners[type] || []) fn(); },
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }),
    insertAdjacentHTML(_where, html) { this.inserted += html; }, querySelector: () => null, querySelectorAll: () => [], animate() {} };
}
function setup({ level = 0, items = ['ب', 'ت', 'ث', 'ح', 'د', 'ر'], planned, say = () => true } = {}) {
  const timers = [], outcomes = [], drags = [];
  const friends = Object.fromEntries(items.map((c) => [c, { word: `وَرْد${c}`, call: 'friend-call' }]));
  const ns = {
    LetterFriends: { FRIENDS: friends, art: () => '<svg></svg>', get: (c) => friends[c], look: () => 'plain' },
    LettersStrokes: { LETTERS: { 'ب': ['B', { dot: [50, 84] }], 'ت': ['B', { dot: [58, 32] }, { dot: [42, 32] }], 'ث': ['B', { dot: [50, 22] }, { dot: [60, 34] }, { dot: [40, 34] }], 'ح': ['H'], 'د': ['D'], 'ر': ['R'] } },
    PictureWords: { byChar: (c) => [{ id: `${c}-word`, char: c, word: `وَرْد${c}` }], art: () => '<svg></svg>' },
    PracticeLearning: { profile: () => ({ choiceCount: 3, choices: 3 }), level: () => level,
      orderChars: (_ctx, chars, _skill, count) => planned || chars.slice(0, count) },
    GardenPractice: { draggable: (_el, options) => { drags.push(options); return () => {}; } },
  };
  const frame = node(), tray = node(), friend = node(), builtBody = node(), builtDots = node(), word = node(), hole = node();
  const buttons = Array.from({ length: 3 }, (_, i) => { const b = node(); b.dataset.i = String(i); return b; });
  tray.querySelectorAll = () => buttons;
  const root = node();
  root.querySelector = (selector) => ({ '.ws-frame': frame, '.ws-tray': tray, '.ws-friend': friend, '.ws-built-body': builtBody,
    '.ws-built-dots': builtDots, '.ws-word': word, '.ws-hole': hole }[selector] || null);
  root.querySelectorAll = (selector) => selector === '.ws-piece' || selector === '.pz-tile' ? buttons : [];
  const stage = { firstElementChild: root, set innerHTML(value) { this.html = value; }, get innerHTML() { return this.html; } };
  const ctxItems = items.map((display) => ({ id: display, display }));
  const ctx = { stage, items: ctxItems, completedWorldIds: [], say, beginRound() {}, prompt() {}, reportOutcome: (o) => outcomes.push(o),
    sfx() {}, correct() {}, confettiAt() {}, pet: { cheer() {} }, done() {}, cancel() {}, reducedMotion: () => true };
  const window = { MiftahGame: ns };
  const context = { window, Math, setTimeout: (fn, ms) => { const timer = { fn, ms }; timers.push(timer); return timer; }, clearTimeout() {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'WorkshopGames.js'), 'utf8'), context);
  return { ns, ctx, root, frame, tray, buttons, word, hole, builtBody, timers, outcomes, drags, stage };
}

test('Workshop filters ineligible and conflicting duplicate letters before practice ordering', () => {
  const fx = setup({ planned: ['ت', 'ب'] });
  fx.ctx.items = [
    { id: 'ب', display: 'ب' }, { id: 'ت', display: 'ت', taught: false }, { id: 'ت-good', display: 'ت' },
    { id: 'ث', display: 'ث', isTaught: false }, { id: 'ح', display: 'ح', locked: true }, { id: 'ح-good', display: 'ح' },
    { id: 'د', display: 'د', unlocked: false }, { id: 'ر', display: 'ر', prerequisiteWorldIds: ['future'] },
  ];
  fx.ctx.completedWorldIds = [];
  const game = new fx.ns.GardenPractice.BuildLetter(fx.ctx);
  assert.deepEqual(Array.from(game.known), ['ب'], 'the conflict and every explicit eligibility gate remove blocked declarations');
  assert.deepEqual(Array.from(fx.ns.WorkshopGames.practiceOrder(fx.ctx, ['ب', 'ت'], 'letter-form', 2)), ['ب'], 'a practice planner cannot restore a forbidden item');
  assert.equal(game.rounds, 0);
  game.destroy();
});

test('BuildLetter separates construction steps from choice count and guides the current step', () => {
  for (const [level, expectedStep, expectedChoices] of [[0, 'dots', 2], [1, 'body', 2], [2, 'body', 3]]) {
    const fx = setup({ level });
    const game = new fx.ns.GardenPractice.BuildLetter(fx.ctx);
    assert.equal(game.step, expectedStep);
    assert.equal(game.choices.length, expectedChoices);
    assert.match(fx.frame.inserted, new RegExp(`ws-step-${expectedStep}[^>]*is-active`));
    if (level === 0) assert.equal(fx.builtBody.innerHTML.includes('ws-in'), true, 'sprout starts with its body placed');
    game.destroy();
  }
  const fx = setup({ level: 1 });
  const game = new fx.ns.GardenPractice.BuildLetter(fx.ctx);
  const oldPhase = game.phaseId, bodyChoice = game.choices.findIndex((choice) => choice.key === fx.ns.WorkshopGames.bodyKey(game.target));
  assert.equal(game.pick(bodyChoice, fx.buttons[bodyChoice], oldPhase), true);
  assert.equal(game.step, 'dots');
  assert.match(fx.frame.inserted, /ws-step-body[^>]*is-done/);
  assert.match(fx.frame.inserted, /ws-step-dots[^>]*is-active/);
  const before = game.step;
  assert.equal(game.pick(0, fx.buttons[0], oldPhase), false, 'a stale piece cannot answer on the new step');
  assert.equal(game.step, before);
  game.destroy();
});

test('Body-only letters remain playable as one guided construction step', () => {
  const fx = setup({ level: 0, items: ['ح', 'د', 'ر'] });
  fx.ns.LettersStrokes.LETTERS = { ح: ['H'], د: ['D'], ر: ['R'] };
  const game = new fx.ns.GardenPractice.BuildLetter(fx.ctx);
  assert.equal(game.target, 'ح');
  assert.equal(game.step, 'body');
  assert.equal(game.choices.length, 2);
  game.destroy();
});

test('BuildLetter skips same-shape targets when no distinct answer can be offered', () => {
  const fx = setup({ level: 1, items: ['ب', 'ت'] });
  const game = new fx.ns.GardenPractice.BuildLetter(fx.ctx);
  assert.equal(game.order.length, 0, 'same-body letters cannot form a body choice');
  game.destroy();

  const sprout = setup({ level: 0, items: ['ب', 'ت'] });
  sprout.ns.LettersStrokes.LETTERS.ت = sprout.ns.LettersStrokes.LETTERS.ب;
  const noDistinctDots = new sprout.ns.GardenPractice.BuildLetter(sprout.ctx);
  assert.equal(noDistinctDots.order.length, 0, 'identical dot patterns cannot form a dot choice');
  noDistinctDots.destroy();
});

test('FillGap shows the complete joined reference, offers a receiving hole, and ignores old drags', () => {
  const fx = setup({ items: ['ب', 'ت', 'ث'] });
  fx.ctx.items[0].id = 'curriculum-b';
  let profiled, leveled;
  fx.ns.PracticeLearning.profile = (_ctx, item) => { profiled = item; return { choiceCount: 3 }; };
  fx.ns.PracticeLearning.level = (_ctx, items) => { leveled = items; return 0; };
  fx.ns.gardenBrain = { others: () => ['ق', 'ت', 'ت'] };
  const game = new fx.ns.GardenPractice.FillGap(fx.ctx);
  assert.equal(profiled.id, 'curriculum-b');
  assert.ok(Array.from(leveled).some((item) => item.id === 'curriculum-b'));
  assert.equal(game.offered.length, 2);
  assert.ok(game.offered.every((char) => game.known.includes(char)), 'Garden Brain suggestions stay inside the taught pool');
  const source = fx.root.innerHTML;
  assert.match(source, /class="ws-reference-word" dir="rtl" lang="ar">وَرْد/);
  assert.match(source, /class="ws-reference-initial"[^>]*><i class="is-highlighted">/);
  assert.match(source, /class="ws-hole ws-receiving"/);
  const firstPhase = game.phaseId, drag = fx.drags[0];
  assert.equal(drag.drop(500, 500), false, 'outside release does not answer');
  game.replayPrompt();
  assert.equal(game.missed, true, 'replay records assistance for this matching turn');
  const correct = game.offered.indexOf(game.card.char);
  assert.equal(game.pick(correct, fx.buttons[correct], firstPhase), true);
  assert.match(fx.word.innerHTML, /class="ws-whole">وَرْد/);
  assert.equal(game.pick(correct, fx.buttons[correct], firstPhase), false, 'old tile callbacks cannot affect the next round');
  assert.equal(fx.outcomes[0].evidence, 'supported_visible_matching', 'the shown reference is matching evidence, never listening evidence');
  assert.equal(fx.outcomes[0].itemId, 'curriculum-b');
  assert.ok(fx.outcomes[0].choiceIds.includes('curriculum-b'));
  assert.equal(fx.outcomes[0].assisted, true);
  game.destroy();
});

test('a delayed initial FillGap prompt cannot speak for the next card', () => {
  const spoken = [], fx = setup({ items: ['ب', 'ت', 'ث'], say: (entry) => { spoken.push(entry.display); return true; } });
  const game = new fx.ns.GardenPractice.FillGap(fx.ctx), oldCard = game.card;
  const initialPrompt = fx.timers[0];
  game.round = 1;
  game.next();
  initialPrompt.fn();
  assert.equal(spoken.includes(oldCard.word), false);
  game.destroy();
});

test('a late failed speech result cannot change the next workshop round', async () => {
  let reject;
  const fx = setup({ say: () => new Promise((_resolve, fail) => { reject = fail; }) });
  const game = new fx.ns.GardenPractice.BuildLetter(fx.ctx);
  const before = game.turnId;
  game.say({ display: 'old' });
  game.turnId += 1;
  reject(new Error('audio unavailable'));
  await Promise.resolve();
  assert.equal(game.heard, true);
  assert.equal(game.turnId, before + 1);
  game.destroy();
});
