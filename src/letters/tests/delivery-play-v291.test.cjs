const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classes() {
  const values = new Set();
  return {
    add: (...items) => items.forEach(item => values.add(item)),
    remove: (...items) => items.forEach(item => values.delete(item)),
    toggle(item, force) {
      const next = force === undefined ? !values.has(item) : !!force;
      if (next) values.add(item); else values.delete(item);
      return next;
    },
    contains: item => values.has(item),
  };
}

function element(dataset = {}) {
  const handlers = {};
  return {
    dataset, handlers, attrs: {}, disabled: false, isConnected: true, innerHTML: '', style: {},
    classList: classes(),
    setAttribute(name, value) { this.attrs[name] = String(value); },
    addEventListener(name, handler) { handlers[name] = handler; },
    removeEventListener(name, handler) { if (handlers[name] === handler) delete handlers[name]; },
    dispatch(name, event = {}) { handlers[name]?.({ preventDefault() {}, stopImmediatePropagation() {}, ...event }); },
    setPointerCapture(id) { this.pointer = id; },
    hasPointerCapture(id) { return this.pointer === id; },
    releasePointerCapture() { this.pointer = null; },
    getBoundingClientRect() { return this.rect || { left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }; },
    focus() { this.focused = true; },
  };
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const settle = () => new Promise(resolve => setImmediate(resolve));
const defaultItems = () => [
  { id: 'ba', display: 'ب' }, { id: 'ta', display: 'ت' },
  { id: 'tha', display: 'ث' }, { id: 'jim', display: 'ج' },
];

function runtime({
  items = defaultItems(), say = () => Promise.resolve(true), canListen = true,
  reducedMotion = true, practiceProfile, lettersProfile, ctx: overrides = {},
} = {}) {
  const timers = [];
  let packets = [];
  const nodes = {};
  const stage = {
    events: {},
    set innerHTML(html) {
      packets = [...html.matchAll(/class="delivery-packet" data-item="([^"]+)"/g)].map(match => element({ item: match[1] }));
      nodes.destination = element();
      nodes.destination.rect = { left: 100, top: 100, right: 200, bottom: 200, width: 100, height: 100 };
      nodes.listen = element(); nodes.help = element(); nodes.status = element(); nodes.pet = element();
    },
    addEventListener(name, handler) { this.events[name] = handler; },
    removeEventListener(name, handler) { if (this.events[name] === handler) delete this.events[name]; },
    querySelector(selector) {
      return ({ '.delivery-destination': nodes.destination, '.delivery-listen': nodes.listen,
        '.delivery-help': nodes.help, '.delivery-status': nodes.status, '.delivery-pet': nodes.pet })[selector] || null;
    },
    querySelectorAll(selector) { return selector === '.delivery-packet' ? packets : []; },
  };
  const ns = {
    LettersArt: { inkShift: () => ({ dx: 0, dy: 0 }), icon: name => `<${name}>` },
    GardenLearning: { support: () => [] },
  };
  if (practiceProfile) ns.PracticeLearning = { profile: practiceProfile };
  if (lettersProfile) ns.LettersLearning = { profile: lettersProfile };
  const window = { MiftahGame: ns, matchMedia: () => ({ matches: false }) };
  const context = {
    window, performance: { now: () => 0 },
    setTimeout(fn, delay) { const timer = { fn, delay, cleared: false, ran: false }; timers.push(timer); return timer; },
    clearTimeout(timer) { if (timer) timer.cleared = true; },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'GardenPractice.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'LetterDelivery.js'), 'utf8'), context);

  const calls = { prompts: [], outcomes: [], said: [], begins: [], correct: 0, done: 0, paid: 0, cancel: 0 };
  const ctx = {
    stage, items, canListen: () => canListen, reducedMotion: () => reducedMotion,
    worldId: 'current', completedWorldIds: ['done'],
    prompt: (item, meta) => calls.prompts.push([item?.id || null, meta]),
    say: item => { calls.said.push(item.id); return say(item, calls.said.length); },
    beginRound: (item, skill) => calls.begins.push([item.id, skill]),
    reportOutcome: outcome => calls.outcomes.push(outcome),
    correct: () => { calls.correct += 1; },
    done: () => { calls.done += 1; },
    pay: () => { calls.paid += 1; },
    cancel: () => { calls.cancel += 1; },
    ...overrides,
  };
  const game = new ns.LetterDelivery(ctx);
  const activeTimers = () => timers.filter(timer => !timer.cleared && !timer.ran);
  const flushTimers = async () => {
    let guard = 0;
    while (guard++ < 30) {
      const next = activeTimers()[0];
      if (!next) break;
      next.ran = true;
      next.fn();
      await settle();
    }
  };
  return { game, ctx, calls, stage, nodes, timers, activeTimers, flushTimers, get packets() { return packets; } };
}

async function hearInitial(r) {
  await settle();
  assert.equal(r.game.waitingForSpeech, false, 'the initial prompt has settled');
}

test('eligible pool excludes untaught and locked friends, honors current prerequisites, and deduplicates glyphs', () => {
  const items = [
    { id: 'ba', display: 'ب' },
    { id: 'same-glyph', display: 'ب' },
    { id: 'current-prereq', display: 'ت', prerequisiteWorldIds: ['current'] },
    { id: 'done-prereq', display: 'ث', prerequisiteWorldIds: ['done'] },
    { id: 'missing-prereq', display: 'ج', prerequisiteWorldIds: ['locked-world'] },
    { id: 'untaught', display: 'ح', taught: false },
    { id: 'not-taught', display: 'خ', isTaught: false },
    { id: 'locked', display: 'د', locked: true },
    { id: 'unlocked-false', display: 'ذ', unlocked: false },
  ];
  const r = runtime({ items, canListen: false });
  const ids = r.game.items.map(item => item.id);
  assert.deepEqual(ids, ['ba', 'current-prereq', 'done-prereq']);
  assert.equal(new Set(r.game.items.map(item => item.display)).size, r.game.items.length);
  assert.ok(r.game.rounds.every(item => ids.includes(item.id)));
  assert.equal(r.calls.done, 0);
  r.game.destroy();
});

test('PracticeLearning controls the profile; recall is always visible and beginner choices stay at two', async () => {
  const seen = [];
  const r = runtime({
    ctx: { beginner: true },
    practiceProfile: (ctx, item, skill) => {
      seen.push({ ctx, item, skill });
      return { promptMode: 'listen', choiceCount: 4, skill };
    },
  });
  await hearInitial(r);
  assert.equal(seen[0].skill, 'letter-name');
  assert.equal(seen[0].ctx.allowRecall, undefined, 'the caller context is passed through without forcing a policy');
  assert.equal(seen[0].ctx.beginner, true);
  assert.equal(r.game.revealed, true);
  assert.equal(r.calls.prompts.at(-1)[0], r.game.target.id);
  assert.ok(r.packets.length <= 2);
  assert.equal(r.calls.outcomes.length, 0);
  assert.equal(r.calls.paid, 0);
});

test('LettersLearning fallback and no-profile default both begin with visible two-choice matching', async () => {
  let fallbackCalls = 0;
  const fallback = runtime({
    lettersProfile: (item, ctx) => { fallbackCalls += 1; assert.equal(ctx.worldId, 'current'); return { promptMode: 'listen', choiceCount: 3 }; },
  });
  await hearInitial(fallback);
  assert.equal(fallbackCalls, 4, 'the visit freezes a profile for each planned round');
  assert.equal(fallback.game.revealed, false, 'a valid profile can request listening with three choices');
  assert.equal(fallback.packets.length, 3);
  fallback.game.destroy();

  const noProfile = runtime();
  await hearInitial(noProfile);
  assert.equal(noProfile.game.revealed, true);
  assert.equal(noProfile.game.roundProfile.choiceCount, 2);
  assert.equal(noProfile.game.roundProfile.promptMode, 'match');
  assert.equal(noProfile.packets.length, 2);
  noProfile.game.destroy();
});

test('an established PracticeLearning profile may request listening with three choices when recall is allowed', async () => {
  const seen = [];
  const r = runtime({
    ctx: { allowRecall: true, worldId: 'current', userFlag: 'kept' },
    practiceProfile: (ctx, item, skill) => {
      seen.push({ ctx, item, skill });
      return { promptMode: 'listen', choiceCount: 3, skill };
    },
  });
  await hearInitial(r);
  assert.equal(seen[0].ctx.allowRecall, true);
  assert.equal(seen[0].ctx.userFlag, 'kept');
  assert.equal(r.game.revealed, false);
  assert.equal(r.packets.length, 3);
  r.game.destroy();
});

test('allowRecall false keeps a profile visible and caps it at two choices', async () => {
  const r = runtime({
    ctx: { allowRecall: false },
    practiceProfile: () => ({ promptMode: 'listen', choiceCount: 3 }),
  });
  await hearInitial(r);
  assert.equal(r.game.revealed, true);
  assert.ok(r.packets.length <= 2);
  assert.equal(r.calls.prompts.at(-1)[0], r.game.target.id);
  r.game.destroy();
});

test('an assisted round stays in the support profile on the next round', async () => {
  const r = runtime({
    ctx: {
      targets: ['ba'],
    },
    practiceProfile: () => ({ promptMode: 'listen', choiceCount: 3, skill: 'letter-name' }),
  });
  await hearInitial(r);
  assert.equal(r.game.target.id, 'ba');
  r.nodes.help.onclick();
  assert.equal(r.game.offer(r.game.target), true);
  assert.equal(r.calls.outcomes[0].assisted, true);
  assert.equal(r.game.continue(), true);
  await hearInitial(r);
  assert.equal(r.game.revealed, true, 'the previously supported item stays in visible matching');
  assert.equal(r.game.assisted, true);
  assert.equal(r.packets.length, 2);
  r.game.destroy();
});

test('empty and entirely invalid target pools cancel once without completing', () => {
  for (const options of [
    { items: [] },
    { items: defaultItems(), ctx: { targets: ['missing-id'] } },
  ]) {
    const r = runtime(options);
    assert.equal(r.calls.cancel, 1);
    assert.equal(r.calls.done, 0);
    assert.equal(r.calls.correct, 0);
  }
});

test('help releases initially disabled choices while replay speech hangs or rejects, and never earns independent credit', async () => {
  const first = deferred(), replay = deferred();
  const r = runtime({
    practiceProfile: () => ({ promptMode: 'listen', choiceCount: 3, skill: 'letter-name' }),
    say: (_item, attempt) => attempt === 1 ? first.promise : replay.promise,
  });
  assert.ok(r.packets.every(button => button.disabled));
  r.nodes.help.onclick();
  assert.ok(r.packets.every(button => !button.disabled), 'help immediately enables the visible matching choices');
  const correct = r.packets.find(button => button.dataset.item === r.game.target.id);
  correct.onclick();
  assert.equal(r.game.offer(r.game.target), true);
  assert.equal(r.calls.outcomes.length, 1);
  assert.equal(r.calls.outcomes[0].assisted, true);
  assert.equal(r.calls.outcomes[0].independent, false);
  assert.equal(r.calls.paid, 0);
  replay.reject(new Error('voice unavailable'));
  await settle();
  first.resolve(true);
  await settle();
  assert.equal(r.calls.outcomes.length, 1, 'late speech cannot create another outcome');
  assert.equal(r.calls.outcomes[0].independent, false);
  r.game.destroy();
});

test('a correct offer waits for explicit Continue; duplicate and stale controls cannot touch the next round', async () => {
  const r = runtime();
  await hearInitial(r);
  const stalePacket = r.packets.find(button => button.dataset.item === r.game.target.id);
  const staleTarget = r.game.target;
  assert.equal(r.game.offer(staleTarget), true);
  assert.equal(r.game.offer(staleTarget), false);
  assert.equal(r.calls.correct, 1);
  assert.equal(r.calls.outcomes.length, 1);
  assert.equal(r.game.continue(), true);
  assert.equal(r.game.index, 1);
  await r.flushTimers();
  assert.equal(r.game.index, 1, 'later reveal callbacks cannot auto-skip a round');
  assert.equal(r.calls.done, 0);
  const outcomes = r.calls.outcomes.length;
  stalePacket.onclick();
  assert.equal(r.game.selected, null, 'a detached packet cannot select in the next round');
  assert.equal(r.game.continue(), false, 'repeated Continue cannot skip an uncompleted round');
  assert.equal(r.game.offer(staleTarget), false, 'the previous target cannot submit for the next round');
  assert.equal(r.calls.outcomes.length, outcomes);
  assert.equal(r.calls.correct, 1);
  const legitimateWrong = r.packets.find(button => button.dataset.item !== r.game.target.id);
  assert.equal(r.game.offer(r.game.items.find(item => item.id === legitimateWrong.dataset.item)), false);
  assert.equal(r.calls.outcomes.length, outcomes + 1, 'a wrong item in the current choices is still reported');
  assert.equal(r.calls.outcomes.at(-1).correct, false);
  r.game.destroy();
});

test('the child can complete all four rounds, Continue is idempotent, and the toy gives no rewards', async () => {
  const r = runtime();
  for (let round = 0; round < 4; round += 1) {
    await hearInitial(r);
    const target = r.game.target;
    assert.equal(r.game.offer(target), true);
    assert.equal(r.game.continue(), true);
    assert.equal(r.game.index, round + 1);
    await r.flushTimers();
    assert.equal(r.game.index, round + 1, 'reveal callbacks cannot auto-advance');
  }
  assert.equal(r.calls.done, 1);
  assert.equal(r.calls.correct, 4);
  assert.equal(r.calls.outcomes.length, 4);
  assert.equal(r.calls.paid, 0);
  assert.equal(r.game.continue(), false);
});

test('dragging to the 24px padded edge cues the garden; release outside the padding does not answer', async () => {
  const inside = runtime();
  await hearInitial(inside);
  const packet = inside.packets.find(button => button.dataset.item === inside.game.target.id);
  packet.dispatch('pointerdown', { pointerId: 1, clientX: 10, clientY: 10, pointerType: 'touch', button: 0 });
  packet.dispatch('pointermove', { pointerId: 1, clientX: 76, clientY: 150 });
  assert.equal(inside.nodes.destination.classList.contains('is-near'), true);
  packet.dispatch('pointerup', { pointerId: 1, clientX: 76, clientY: 150 });
  assert.equal(inside.calls.correct, 1, '24px outside the destination is accepted');
  assert.equal(inside.calls.outcomes.length, 1);
  inside.game.destroy();

  const outside = runtime();
  await hearInitial(outside);
  const outsidePacket = outside.packets.find(button => button.dataset.item === outside.game.target.id);
  outsidePacket.dispatch('pointerdown', { pointerId: 2, clientX: 10, clientY: 10, pointerType: 'touch', button: 0 });
  outsidePacket.dispatch('pointermove', { pointerId: 2, clientX: 75, clientY: 150 });
  assert.equal(outside.nodes.destination.classList.contains('is-near'), false);
  outsidePacket.dispatch('pointerup', { pointerId: 2, clientX: 75, clientY: 150 });
  assert.equal(outside.calls.correct, 0);
  assert.equal(outside.calls.outcomes.length, 0);
  assert.equal(outside.game.index, 0);
  outside.game.destroy();
});
