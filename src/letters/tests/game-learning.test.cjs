const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function runtime({ learning, timers = [] } = {}) {
  const frames = [];
  const window = {
    MiftahGame: {
      LettersArt: { inkShift: () => ({ dx: 0, dy: 0 }) },
      ...(learning ? { LettersLearning: learning } : {}),
    },
    addEventListener() {}, removeEventListener() {},
  };
  const context = {
    window, performance: { now: () => 0 },
    document: { createElement: () => ({ className: '', innerHTML: '', remove() {} }) },
    requestAnimationFrame: callback => frames.push(callback),
    setTimeout: callback => (timers.push(callback), timers.length),
    clearTimeout() {}, setInterval() {}, clearInterval() {},
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'MiniGames.js'), 'utf8'), context);
  return { ns: window.MiftahGame, frames };
}

function classes(initial = []) {
  const values = new Set(initial);
  return {
    add: (...names) => names.forEach(name => values.add(name)),
    remove: (...names) => names.forEach(name => values.delete(name)),
    contains: name => values.has(name),
  };
}

test('recognition games consume the shared item-evidence round plan unchanged', () => {
  const target = { id: 'baa', display: 'ب' };
  const option = { id: 'taa', display: 'ت' };
  const planned = [{ target, options: [target, option], promptMode: 'listen', skill: 'letter_name', movement: 'still' }];
  let received;
  const { ns } = runtime({ learning: { planRounds(ctx) { received = ctx; return planned; } } });
  const ctx = { items: [target], extraItems: [], rounds: 1, activity: 'pop' };
  const result = ns.LettersRoundBuilder(ctx);
  assert.equal(received, ctx);
  assert.equal(result[0], planned[0]);
});

test('Pop presents round metadata and reports the selected contrast before showing help', () => {
  const { ns } = runtime();
  const target = { id: 'baa', display: 'ب' };
  const selected = { id: 'taa', display: 'ت' };
  const round = { target, options: [target, selected], promptMode: 'listen', skill: 'letter_name', movement: 'still' };
  const events = [];
  const wrongEl = {
    disabled: false, classList: classes(),
    querySelector: () => ({ classList: classes(), offsetWidth: 1 }),
    appendChild() {},
  };
  const targetEl = { classList: classes() };
  const game = Object.create(ns.LettersMiniGames.pop.prototype);
  Object.assign(game, {
    alive: true, advancing: false, roundIndex: 0, rounds: [round],
    bubbles: [{ item: selected, el: wrongEl }, { item: target, el: targetEl }],
    heat: { down() {} },
    ctx: {
      beginner: true,
      reportOutcome: outcome => events.push(['outcome', outcome]),
      showLearningHint: (asked, picked) => events.push(['hint', asked.id, picked.id]),
      sfx() {}, say() {}, pulsePrompt() {},
    },
  });
  game.popAttempt(game.bubbles[0]);
  assert.deepEqual(JSON.parse(JSON.stringify(events[0][1])), {
    itemId: 'baa', correct: false, evidence: 'supported_visible_matching',
    selectedId: 'taa', choiceIds: ['baa', 'taa'], skill: 'letter_name',
    activity: 'pop', affectsStrength: true,
  });
  assert.deepEqual(events[1], ['hint', 'baa', 'taa']);

  const promptCalls = [];
  Object.assign(game, {
    bubbles: [], sky: {}, releaseActiveDrag() {},
    ctx: { setRoundProgress() {}, setPrompt: (...args) => promptCalls.push(args), say() {} },
    spawn() {},
  });
  game.startRound();
  assert.deepEqual(JSON.parse(JSON.stringify(promptCalls[0][1])), {
    promptMode: 'listen', skill: 'letter_name', choiceIds: ['baa', 'taa'], activity: 'pop',
  });
});

test('Pop movement follows the planned round rather than garden stars', () => {
  const { ns } = runtime();
  const make = movement => {
    const style = {};
    const game = Object.create(ns.LettersMiniGames.pop.prototype);
    Object.assign(game, {
      alive: true, lastTime: 0, skyH: 100, roundIndex: 0,
      rounds: [{ movement }],
      bubbles: [{ y: .6, restY: .6, speed: .1, el: { classList: { contains: () => false }, style } }],
      ctx: { garden: true, level: 99, reducedMotion: () => false },
      heat: { factor: () => 1 },
    });
    game.tick(1000);
    return game.bubbles[0].y;
  };
  assert.equal(make('still'), .6);
  assert.ok(make('gentle') < .6);
});

test('Build repair keeps the correct prefix and returns only the first wrong and later pieces', () => {
  const timers = [];
  const { ns } = runtime({ timers });
  const part = display => ({ id: display, display });
  const [a, b, c, x] = ['a', 'b', 'c', 'x'].map(part);
  const target = { id: 'abc', display: 'abc', parts: [a, b, c] };
  const button = index => ({ dataset: { i: String(index) }, disabled: false, classList: classes(), focus() {} });
  const buttons = [button(0), button(1), button(2), button(3)];
  const slot = html => ({ innerHTML: html, disabled: false, classList: classes(['is-filled']), setAttribute() {} });
  const slots = [slot('a'), slot('x'), slot('')];
  const slotsBox = { classList: classes(), offsetWidth: 1 };
  const outcomes = [];
  const game = Object.create(ns.LettersMiniGames.build.prototype);
  Object.assign(game, {
    alive: true, roundIndex: 0, slips: 0, targets: [target], tray: [a, x, c, b], slots,
    placed: [{ part: a, btn: buttons[0], slot: slots[0] }, { part: x, btn: buttons[1], slot: slots[1] }],
    ctx: {
      say() {}, sfx() {}, reportOutcome: value => outcomes.push(value), showLearningHint() {},
      stage: {
        contains: () => true,
        querySelectorAll: selector => selector === '.build-tile' ? buttons : [],
        querySelector: () => slotsBox,
      },
    },
  });
  game.place(buttons[2]);
  assert.equal(timers.length, 1);
  timers[0]();
  assert.equal(game.placed.length, 1);
  assert.equal(game.placed[0].part, a);
  assert.equal(slots[0].innerHTML, 'a');
  assert.equal(slots[1].innerHTML, '');
  assert.equal(slots[2].innerHTML, '');
  assert.equal(outcomes[0].selectedId, 'x');
  assert.deepEqual(JSON.parse(JSON.stringify(outcomes[0].choiceIds)), ['a', 'x', 'c', 'b']);
});
