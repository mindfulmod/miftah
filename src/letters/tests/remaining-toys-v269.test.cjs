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
  const ns = {
    LettersLearning: { profile: (_item, ctx) => ({ choiceCount: 3, promptMode: ctx.canListen?.() === false ? 'match' : 'listen' }) },
    LettersStrength: { skillProfile: () => ({}) },
    LetterFriends: {
      FRIENDS: { 'ب': {}, 'ت': {}, 'ث': {} },
      art: () => '<svg/>', item: c => ({ id: c, display: c }),
      get: c => ({ en: c, call: `friend-${c}`, word: c }),
    },
    LettersStrokes: { LETTERS: { 'ب': [{ dot: [50, 20] }], 'ت': [{ dot: [50, 20] }, { dot: [70, 20] }], 'ث': [{ dot: [30, 20] }, { dot: [50, 20] }, { dot: [70, 20] }] } },
  };
  const context = { window: { MiftahGame: ns }, Math, Date, setTimeout: () => 1, clearTimeout() {}, performance: { now: () => 1 } };
  for (const file of ['PracticeLearning.js', 'ToyBoxGames.js', 'WorkshopGames.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context, { filename: file });
  }
  return ns;
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

test('practice choices stay gentle for helped children and visual profiles never ask for listening', () => {
  const ns = runtime();
  const helped = { beginner: false, supportedItemIds: ['ب'], canListen: () => true, items: [{ id: 'ب', display: 'ب' }] };
  const profile = ns.ToyBoxGames.practiceProfile(helped, 'ب', 'letter-name');
  assert.equal(profile.choiceCount, 2);
  assert.equal(profile.promptMode, 'match');

  const visual = ns.ToyBoxGames.practiceProfile({ beginner: false, items: [{ id: 'ب', display: 'ب' }], canListen: () => true }, 'ب', 'letter-form');
  assert.equal(visual.promptMode, 'match');
  assert.equal(visual.choiceCount, 2);
});

test('memory participation feeds only supported matching evidence', () => {
  const ns = runtime(), outcomes = [], events = [];
  const game = Object.create(ns.GardenPractice.FriendPairs.prototype);
  Object.assign(game, { ctx: {
    beginRound: (target, skill) => events.push(['begin', target.id, skill]),
    reportOutcome: outcome => { events.push(['report']); outcomes.push(outcome); },
  }, missed: false });
  game.played('ب', 'matching-memory');
  assert.equal(outcomes.length, 1);
  assert.deepEqual(events, [['begin', 'ب', 'matching-memory'], ['report']], 'each real match opens its own round before recording it');
  assert.equal(outcomes[0].skill, 'matching-memory');
  assert.equal(outcomes[0].evidence, 'supported_visible_matching');
  assert.equal(outcomes[0].correct, true);
  assert.equal(outcomes[0].affectsStrength, false);
});

test('free scrubbing and colouring report motor participation without friend-answer verdicts', () => {
  const ns = runtime(), source = fs.readFileSync(path.join(__dirname, '..', 'ToyBoxGames.js'), 'utf8');
  const cases = [
    [ns.GardenPractice.BathTime.prototype, 'scrubbing'],
    [ns.GardenPractice.ColourFriend.prototype, 'drawing'],
  ];
  for (const [prototype, skill] of cases) {
    const events = [], outcomes = [];
    const game = Object.create(prototype);
    Object.assign(game, { constructor: { name: skill }, missed: false, ctx: {
      beginRound: (target, startedSkill) => events.push(['begin', target.id, startedSkill]),
      reportOutcome: outcome => { events.push(['report']); outcomes.push(outcome); },
    } });
    game.participated('ب', skill);
    assert.deepEqual(events, [['begin', 'ب', skill], ['report']]);
    assert.equal(outcomes[0].skill, skill);
    assert.equal(outcomes[0].evidence, 'motor_assembly_participation');
    assert.equal(Object.hasOwn(outcomes[0], 'correct'), false, 'free practice records no verdict');
    assert.equal(outcomes[0].affectsStrength, false);
  }
  assert.match(source, /if \(!this\.ask\) this\.participated\(this\.c, "scrubbing"\)/);
  assert.match(source, /this\.participated\(this\.c, "drawing"\)/);
  assert.match(source, /this\.ctx\.beginRound\?\.\(realItem\(this\.ctx, c\), "drawing"\)/);
});

test('a zero-dot nest is a real choice and does not become a dead tap', () => {
  const ns = runtime(), outcomes = [];
  const game = Object.create(ns.GardenPractice.DotNests.prototype);
  const nest = node();
  nest.dataset.i = '0';
  Object.assign(game, {
    alive: true, busy: false, q: { c: 'ب' }, want: 1, offered: [0, 1], roundToken: 2, currentNodes: [nest],
    ctx: { items: [{ id: 'ba-real', display: 'ب' }], reportOutcome: outcome => outcomes.push(outcome), sfx() {}, reducedMotion: () => true },
    root: { contains: el => el === nest, querySelectorAll: () => [nest] },
  });
  assert.equal(game.pick(0, nest, 2), false, 'a wrong tap remains a wrong answer');
  assert.equal(outcomes.length, 1);
  assert.equal(outcomes[0].itemId, 'ba-real');
  assert.equal(outcomes[0].correct, false);
  assert.equal(game.pick(0, nest, 2, true), true, 'the same wrong choice is handled when received as a drop');
  assert.equal(outcomes.length, 2, 'both deliberate attempts retain their feedback');
});

test('BuildLetter completion cannot turn form memory into independent-listening evidence', () => {
  const ns = runtime(), outcomes = [];
  const tray = node(), friend = node(), frame = node();
  const game = Object.create(ns.GardenPractice.BuildLetter.prototype);
  Object.assign(game, {
    target: 'ب', round: 0, fromMemory: true, missed: false, timers: [],
    root: { querySelector: selector => ({ '.ws-tray': tray, '.ws-friend': friend, '.ws-frame': frame })[selector] },
    ctx: { reportOutcome: outcome => outcomes.push(outcome), correct() {}, confettiAt() {}, pet: { cheer() {} }, sfx() {} },
    later() {},
  });
  game.complete();
  assert.equal(outcomes.length, 1);
  assert.equal(outcomes[0].skill, 'letter-form');
  assert.equal(outcomes[0].evidence, 'supported_visible_matching');
});

test('BuildLetter drag uses a generous receiving cue, accepts the release, and keeps tap wiring', () => {
  const ns = runtime(), button = node(), tray = node(), frame = node();
  tray.querySelectorAll = () => [button];
  const drag = {};
  ns.GardenPractice.draggable = (el, options) => { drag.el = el; drag.options = options; return () => { drag.reset = true; }; };
  const game = Object.create(ns.GardenPractice.BuildLetter.prototype);
  let tapped = 0, dropped = 0;
  Object.assign(game, {
    alive: true, busy: false, timers: [], dragResets: [], root: { querySelector: selector => selector === '.ws-tray' ? tray : frame, contains: () => true },
    pick: () => (dropped += 1, true),
  });
  game.tray(['<svg/>']);
  assert.equal(typeof button.listeners.click, 'function');
  drag.options.onDragMove(80, 100);
  assert.equal(frame.classList.contains('is-near'), true, '28px release margin still lights the receiver');
  assert.equal(drag.options.drop(100, 100), true);
  assert.equal(dropped, 1);
  assert.equal(drag.options.drop(40, 40), false);
  button.listeners.click(); tapped += 1;
  assert.equal(tapped, 1, 'tap fallback remains wired');
  game.destroy();
  assert.equal(drag.reset, true);
});

test('BuildLetter accepts the body drag before moving to the dot step', () => {
  const ns = runtime(), game = Object.create(ns.GardenPractice.BuildLetter.prototype);
  Object.assign(game, {
    alive: true, busy: false, step: 'body', target: 'ب', choices: [{ key: '' }], dragResets: [],
    root: { querySelector: () => node(), querySelectorAll: () => [] }, ctx: { sfx() {} },
    place() {}, offer() {}, updateGuidance() {},
  });
  assert.equal(game.pick(0, node()), true);
  assert.equal(game.step, 'dots');
});

test('Fishing earns listening credit only after the live round prompt resolves successfully', async () => {
  const ns = runtime(), outcomes = [];
  const promptResolvers = [];
  const game = Object.create(ns.GardenPractice.LetterFishing.prototype);
  Object.assign(game, {
    alive: true, busy: false, timers: [], dragResets: [], target: 'ب', promptVersion: 4, listenPrompt: true, heard: false,
    ctx: { say: () => new Promise(resolve => promptResolvers.push(resolve)), reportOutcome: outcome => outcomes.push(outcome) },
  });
  const pending = game.presentPrompt('ب', 4);
  game.report('ب', 'ب', ['ب', 'ت'], { listening: true });
  assert.equal(outcomes[0].evidence, 'supported_visible_matching', 'pending audio cannot claim listening evidence');
  outcomes.length = 0;
  promptResolvers[0](true);
  assert.equal(await pending, true);
  game.report('ب', 'ب', ['ب', 'ت'], { listening: true });
  assert.equal(outcomes[0].evidence, 'independent_listening');

  game.heard = false;
  game.promptVersion = 5;
  const stale = game.presentPrompt('ب', 5);
  game.promptVersion = 6;
  promptResolvers[1](true);
  assert.equal(await stale, true, 'the spoken prompt can finish even when its round has moved on');
  assert.equal(game.heard, false);
  const afterDestroy = game.presentPrompt('ب', 6);
  game.destroy();
  promptResolvers[2](true);
  await afterDestroy;
  assert.equal(game.heard, false, 'destroyed games ignore late prompt completion');
});

test('jigsaw drop detection accepts the wide slot edge and ignores stale or distant releases', () => {
  const ns = runtime(), slot = node({ left: 100, top: 100, width: 40, height: 40 });
  const game = Object.create(ns.GardenPractice.FriendJigsaw.prototype);
  Object.assign(game, { alive: true, busy: false, todo: [0], root: { querySelector: () => slot } });
  assert.equal(game.receivingSlot(75, 120), slot);
  assert.equal(game.receivingSlot(71, 120), null);
  game.todo.shift();
  assert.equal(game.receivingSlot(100, 100), null);
  game.alive = false;
  game.todo = [0];
  assert.equal(game.receivingSlot(100, 100), null);
});
