const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classList() {
  const values = new Set();
  return { add: (...xs) => xs.forEach(x => values.add(x)), remove: (...xs) => xs.forEach(x => values.delete(x)),
    contains: x => values.has(x), toggle(x, force) { const on = force === undefined ? !values.has(x) : force; on ? values.add(x) : values.delete(x); return on; } };
}
function element(cls = '', dataset = {}) {
  const listeners = {};
  const node = { className: cls, classList: classList(), dataset, listeners, innerHTML: '', hidden: false, isConnected: true,
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    fire(type, event = {}) { for (const fn of listeners[type] || []) fn({ preventDefault() {}, stopPropagation() {}, ...event, type, target: event.target || this }); },
    setAttribute(name, value) { this[name] = value; }, animate() {},
    getBoundingClientRect() { return this.rect || { left: 100, top: 100, right: 200, bottom: 200, width: 100, height: 100 }; } };
  node.classList.add(...cls.split(/\s+/).filter(Boolean));
  return node;
}
class Root {
  constructor() { this.isConnected = true; }
  set innerHTML(value) {
    this.html = value; this.nodes = {};
    for (const match of value.matchAll(/<([a-z][\w-]*)([^>]*)>/gi)) {
      const [, tag, attrs] = match, cls = attrs.match(/class="([^"]+)"/)?.[1] || '';
      const dataset = Object.fromEntries([...attrs.matchAll(/data-([\w-]+)="([^"]+)"/g)].map(m => [m[1], m[2]]));
      const node = element(cls, dataset);
      node.tagName = tag.toUpperCase();
      node.hidden = /\shidden(?:\s|>)/.test(attrs);
      node.textContent = value.slice(match.index + match[0].length).split('<')[0];
      for (const c of cls.split(/\s+/).filter(Boolean)) (this.nodes[c] ||= []).push(node);
      if (/data-drop-target/.test(attrs)) (this.nodes.dropTarget ||= []).push(node);
    }
  }
  querySelectorAll(selector) {
    const data = selector.match(/\[data-drop-target\]/);
    if (data) return this.nodes.dropTarget || [];
    const name = selector.match(/^\.([\w-]+)/)?.[1];
    return this.nodes[name] || [];
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}

const syllable = (id, display, flags = {}) => ({ id, display, speak: display, ...flags });
const baseItems = () => [
  syllable('ba', 'بَ'), syllable('bu', 'بُ'),
  syllable('ta', 'تَ'), syllable('tu', 'تُ'), syllable('tha', 'ثَ'), syllable('thu', 'ثُ'),
  syllable('ja', 'جَ'), syllable('ju', 'جُ'),
];
function setup({ items = baseItems(), profile = () => ({ choiceCount: 2, promptMode: 'listen' }), level = () => 0,
  plan, say = () => true, canListen = () => true, drags = true, beginner = false } = {}) {
  const timers = [], outcomes = [], prompts = [], dragBindings = [], calls = [];
  const root = new Root();
  const chars = [...new Set(items.map(i => [...i.display.normalize('NFD')][0]).filter(Boolean))];
  const ns = {
    LetterFriends: { FRIENDS: Object.fromEntries(chars.map(c => [c, {}])), art: (c, opts = {}) => `<svg class="lf" data-mode="${opts.mode || 'plain'}">${c}</svg>` },
    LettersStrokes: { MARKS: { 'َ': ['M 20 8 L 38 3'], 'ُ': ['M 46 14 Q 60 2 53 13 Z'], 'ِ': ['M 20 90 L 38 96'] } },
    PracticeLearning: { profile, level, plan: plan || ((_ctx, pool, _skill, n) => pool.slice(0, n)) },
    GardenPractice: drags ? { inside: (el, x, y) => { const r = el.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; },
      draggable(node, options) { dragBindings.push({ node, options }); return () => {}; } } : {},
  };
  const scope = vm.createContext({ window: { MiftahGame: ns }, Math: Object.assign(Object.create(Math), { random: () => .37 }),
    setTimeout(fn, ms) { const timer = { fn, ms, cleared: false }; timers.push(timer); return timer; }, clearTimeout(timer) { if (timer) timer.cleared = true; }, Promise });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'VowelGames.js'), 'utf8'), scope);
  const ctx = { items, beginner, completedWorldIds: [], worldId: 'practice', canListen, reducedMotion: () => true,
    stage: { innerHTML: '', get firstElementChild() { return root; } }, say(item) { calls.push(item); return say(item); },
    prompt(item) { prompts.push(item?.display || null); }, beginRound() {}, reportOutcome(outcome) { outcomes.push(outcome); },
    cancel() { calls.push('cancel'); }, done() {}, sfx() {}, tryon() {}, correct() {}, confettiAt() {}, pet: { cheer() {} },
  };
  const game = new ns.GardenPractice.HatShop(ctx);
  const run = (ms) => timers.filter(t => t.ms === ms && !t.cleared).forEach(t => t.fn());
  return { ns, ctx, game, root, timers, run, outcomes, prompts, dragBindings, calls };
}

test('HatShop excludes forbidden and duplicate displays before planning and keeps original item ids', () => {
  const items = [
    ...baseItems(),
    syllable('locked-copy', 'بَ', { locked: true }),
    syllable('unlocked-copy', 'تَ', { unlocked: false }),
    syllable('not-taught', 'تُ', { isTaught: false }),
    syllable('future', 'ثُ', { prerequisiteWorldIds: ['later'] }),
  ];
  const { game, ns, ctx } = setup({ items, plan: (_ctx, pool) => [items[8], items[11], 'unknown', ...pool] });
  assert.deepEqual(Array.from(game.eligibleSyllables, x => x.id), ['bu', 'tha', 'ja', 'ju']);
  assert.ok(game.queue.every(item => ['bu', 'tha', 'ja', 'ju'].includes(item.id)));
  assert.ok(game.queue.every(item => game.eligibleSyllables.includes(item)));
  assert.equal(ns.VowelGames.eligibleSyllables({ ...ctx, items }).length, 4);
});

test('choice count and prompt support are frozen for the visit, with distractors from eligible syllables', () => {
  const { game } = setup({ profile: () => ({ choiceCount: 8, promptMode: 'listen' }), level: () => 0 });
  assert.equal(game.choiceCeiling, 2);
  assert.equal(game.visitPromptMode, 'listen');
  assert.equal(game.offeredItems.length, 2);
  assert.ok(game.offeredItems.every(item => game.eligibleSyllables.includes(item)));
  assert.equal(game.offeredItems.find(item => item.display === game.target).id, game.targetItem.id);
  game.next();
  assert.equal(game.choiceCeiling, 2);
  assert.equal(game.visitPromptMode, 'listen');
});

test('later practice can use three real choices while keeping the visit ceiling fixed', () => {
  let levels = 0;
  const items = [...baseItems(), syllable('b-tanween', 'بً')];
  const { game } = setup({ items, profile: () => ({ choiceCount: 3, promptMode: 'listen' }), level: () => (++levels === 1 ? 1 : 0) });
  assert.equal(game.choiceCeiling, 3);
  assert.equal(game.offeredItems.length, 3);
  game.next();
  assert.equal(game.choiceCeiling, 3);
  assert.equal(game.offeredItems.length, 3);
  assert.equal(levels, 1, 'support is measured once and held for the visit');
});

test('failed, unavailable, replayed, and timed out prompts reveal the reference; early guesses cannot strengthen', () => {
  let resolve;
  const pending = setup({ say: () => new Promise(done => { resolve = done; }) });
  const game = pending.game;
  pending.run(350);
  const targetIndex = game.offeredItems.findIndex(item => item.id === game.targetItem.id);
  const button = pending.root.querySelectorAll('.vh-choice')[targetIndex];
  game.pick(targetIndex, button);
  assert.equal(pending.outcomes[0].affectsStrength, false);
  assert.equal(pending.outcomes[0].assisted, true);
  resolve(true);
  return Promise.resolve().then(async () => {
    assert.equal(game.heard, false, 'speech completing after an answer cannot change prompt confidence');
    const failed = setup({ say: () => false });
    failed.run(350);
    assert.equal(failed.root.querySelector('.vh-reference').hidden, false);
    const rejected = setup({ say: () => Promise.reject(new Error('audio unavailable')) });
    rejected.run(350);
    await Promise.resolve();
    assert.equal(rejected.root.querySelector('.vh-reference').hidden, false);
    const unavailable = setup({ say: () => undefined });
    unavailable.run(350);
    assert.equal(unavailable.root.querySelector('.vh-reference').hidden, false);
    const timeout = setup({ say: () => new Promise(() => {}) });
    timeout.run(5000);
    assert.equal(timeout.root.querySelector('.vh-reference').hidden, false);
    const replay = setup();
    replay.game.replayPrompt();
    assert.equal(replay.game.assisted, true);
    assert.equal(replay.root.querySelector('.vh-reference').hidden, false);
  });
});

test('only verified listening or an available reference can strengthen a HatShop response', () => {
  const verified = setup({ say: () => true });
  verified.run(350);
  const verifiedIndex = verified.game.offeredItems.findIndex(item => item.id === verified.game.targetItem.id);
  verified.game.pick(verifiedIndex, verified.root.querySelectorAll('.vh-choice')[verifiedIndex]);
  assert.equal(verified.outcomes[0].evidence, 'independent_listening');
  assert.equal(verified.outcomes[0].assisted, false);
  assert.equal(verified.outcomes[0].affectsStrength, true);

  const failed = setup({ say: () => false });
  failed.run(350);
  const failedIndex = failed.game.offeredItems.findIndex(item => item.id === failed.game.targetItem.id);
  failed.game.pick(failedIndex, failed.root.querySelectorAll('.vh-choice')[failedIndex]);
  assert.equal(failed.outcomes[0].evidence, 'supported_visible_matching');
  assert.equal(failed.outcomes[0].assisted, true);
  assert.equal(failed.outcomes[0].affectsStrength, true);
});

test('rejected try-on feedback speech is handled without changing verified prompt confidence', async () => {
  let calls = 0;
  const result = setup({ say: () => (++calls === 1 ? true : Promise.reject(new Error('feedback clip missing'))) });
  result.run(350);
  assert.equal(result.game.heard, true);
  const wrong = result.game.offeredItems.findIndex(item => item.id !== result.game.targetItem.id);
  result.game.pick(wrong, result.root.querySelectorAll('.vh-choice')[wrong]);
  await Promise.resolve();
  assert.equal(result.game.heard, true);
  assert.equal(result.game.missed, true);
  assert.equal(result.outcomes[0].affectsStrength, true);
});

test('stale click and drag handlers cannot answer a later round; drops need the target or its 28px margin', () => {
  const { game, root, dragBindings, outcomes } = setup();
  const oldButton = root.querySelectorAll('.vh-choice')[0], oldDrag = dragBindings[0];
  const destination = root.querySelector('[data-drop-target]');
  assert.equal(oldDrag.options.drop(70, 150), false);
  assert.equal(oldDrag.options.drop(75, 150), true, 'the drop margin extends 28px left of the target');
  const count = outcomes.length;
  game.next();
  oldButton.fire('click');
  assert.equal(outcomes.length, count);
  assert.equal(oldDrag.options.drop(150, 150), false, 'a callback retained from the previous round is stale');
});

test('friend mode offers only taught syllables and the chosen friend visibly arrives in the nook', () => {
  const items = [syllable('ba', 'بَ'), syllable('ta', 'تَ'), syllable('tha', 'ثَ')];
  const { game, root, outcomes } = setup({ items, profile: () => ({ choiceCount: 3, promptMode: 'match' }) });
  assert.equal(game.mode, 'friend');
  assert.ok(game.offeredItems.every(item => items.includes(item)));
  const correct = game.offeredItems.findIndex(item => item.id === game.targetItem.id);
  game.pick(correct, root.querySelectorAll('.vh-choice')[correct]);
  const slot = root.querySelector('.vh-target-slot');
  assert.match(slot.innerHTML, /<svg/);
  assert.equal(slot.classList.contains('is-arrived'), true);
  assert.equal(outcomes[0].itemId, game.targetItem.id);
  assert.deepEqual(Array.from(outcomes[0].choiceIds).sort(), Array.from(game.offeredItems, item => item.id).sort());
});

