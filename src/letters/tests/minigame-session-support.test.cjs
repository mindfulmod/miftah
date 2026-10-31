const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function runtime() {
  const frames = [];
  const window = {
    MiftahGame: { LettersArt: { icon: () => '<svg/>', inkShift: () => ({ dx: 0, dy: 0 }) } },
    addEventListener() {}, removeEventListener() {},
  };
  const context = {
    window,
    performance: { now: () => 0 },
    requestAnimationFrame: callback => frames.push(callback),
    setTimeout: () => 1,
    clearTimeout() {},
    document: { createElement: () => ({ className: '', classList: classes(), setAttribute() {}, addEventListener() {}, appendChild() {}, insertAdjacentHTML() {} }) },
  };
  for (const file of ['LettersLearning.js', 'MiniGames.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  }
  return { ns: window.MiftahGame, frames };
}

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

test('a helped target is presented with two still choices on its next prepared round', () => {
  const { ns } = runtime();
  const target = { id: 'baa', display: 'ب' };
  const options = [target, { id: 'taa', display: 'ت' }, { id: 'thaa', display: 'ث' }, { id: 'jeem', display: 'ج' }];
  const presented = [];
  const game = Object.create(ns.LettersMiniGames.pop.prototype);
  Object.assign(game, {
    alive: true, advancing: false, completionReady: false, roundIndex: 0,
    rounds: [{ target, options: options.slice(), promptMode: 'listen', movement: 'gentle' }],
    bubbles: [], sky: { classList: classes(), dataset: {} }, finishEl: { hidden: true },
    nextBtn: { disabled: true }, replayBtn: { disabled: true },
    ctx: {
      supportedItemIds: ['baa'], setRoundProgress() {},
      setPrompt: (item, meta) => presented.push({ item, meta }), say() {},
    },
    spawn() {},
  });

  game.startRound();
  assert.equal(presented[0].item.id, 'baa');
  assert.deepEqual(JSON.parse(JSON.stringify(presented[0].meta.choiceIds)), ['baa', 'taa']);
  assert.equal(presented[0].meta.promptMode, 'match');
  assert.equal(game.rounds[0].movement, 'still');
});

test('Pairs begins a fresh learning round for the same reference on a later board', () => {
  const { ns } = runtime();
  const target = { id: 'baa', display: 'ب' };
  const recorded = [];
  const session = new ns.LettersLearning.LearningSession({ recordOutcome: outcome => (recorded.push(outcome), true) }, () => 10);
  const card = id => ({ id, display: id === 'baa' ? 'ب' : 'ت', el: {
    classList: classes(), setAttribute() {}, insertAdjacentHTML() {},
  } });
  const firstPair = [card('baa'), card('baa')];
  const game = Object.create(ns.LettersMiniGames.pairs.prototype);
  Object.assign(game, {
    alive: true, complete: false, matched: 0, pairCount: 1, boardIndex: 0, boards: 2,
    cards: firstPair, pots: [{ classList: classes(), insertAdjacentHTML() {} }],
    next: { hidden: true, focus() {} },
    ctx: {
      beginRound: (item, meta) => session.beginPrompt({ id: item.id }, meta),
      say() {}, sfx() {}, confettiAt() {}, onDone() {},
      reportOutcome: outcome => session.report({ ...outcome, skill: 'matching-memory', activity: 'pairs' }),
      stage: { classList: classes(), querySelectorAll: () => [] },
    },
  });
  game.pick(firstPair[0], firstPair[0].el);
  game.pick(firstPair[1], firstPair[1].el);
  assert.equal(session.round, 1);
  assert.equal(recorded.length, 1);

  game.buildBoard = () => {
    game.cards = [card('baa'), card('baa')];
    game.pots = [{ classList: classes(), insertAdjacentHTML() {} }];
    game.next = { hidden: true, focus() {} };
    game.matched = 0;
  };
  game.nextBoard();
  game.pick(game.cards[0], game.cards[0].el);
  game.pick(game.cards[1], game.cards[1].el);

  assert.equal(session.round, 2);
  assert.equal(recorded.length, 2);
  assert.deepEqual(recorded.map(outcome => outcome.itemId), ['baa', 'baa']);
  assert.deepEqual(recorded.map(outcome => outcome.round), [1, 2]);
  assert.ok(recorded.every(outcome => outcome.activity === 'pairs' && outcome.skill === 'matching-memory'));
});
