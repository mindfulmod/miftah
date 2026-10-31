const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classes() {
  const values = new Set();
  return {
    add: (...names) => names.forEach((name) => values.add(name)),
    remove: (...names) => names.forEach((name) => values.delete(name)),
    toggle: (name, force) => {
      const enabled = force === undefined ? !values.has(name) : force;
      enabled ? values.add(name) : values.delete(name);
      return enabled;
    },
    contains: (name) => values.has(name),
  };
}

function element() {
  const events = new Map();
  return {
    classList: classes(), dataset: {}, style: {}, innerHTML: '',
    addEventListener(name, fn) { const list = events.get(name) || []; list.push(fn); events.set(name, list); },
    dispatch(name, event = {}) { for (const fn of events.get(name) || []) fn(event); },
    setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture() { return false; },
    getBoundingClientRect() { return { left: 10, top: 10, right: 110, bottom: 110, width: 100, height: 100 }; },
    setAttribute() {}, removeAttribute() {}, animate() { return null; },
    isConnected: true,
  };
}

function runtime(promptMode = 'match') {
  const friends = { FRIENDS: Object.fromEntries(['ب', 'ت', 'ث', 'ج', 'ه'].map((c) => [c, true])),
    art: () => '<svg></svg>', item: (c) => ({ id: c, display: c, speak: c }),
    get: (c) => ({ en: c, word: c, call: 'friend-call' }) };
  const policyCalls = [];
  const ns = {
    LetterFriends: friends,
    LettersStrokes: { MARKS: {} },
    LettersArt: { icon: () => '<svg></svg>' },
    PictureWords: { byChar: () => [], LIST: [], item: (p) => p, art: () => '<svg></svg>' },
    PracticeLearning: {
      profile(ctx, item, skill) { policyCalls.push(['profile', item?.id, skill]); return { choiceCount: 2, promptMode }; },
      level(ctx, items, skill) { policyCalls.push(['level', items.length, skill]); return 0; },
      plan(ctx, items, skill, count) { policyCalls.push(['plan', items.length, skill, count]); return items.slice(0, count); },
      orderChars(ctx, chars, skill, count) { policyCalls.push(['orderChars', chars.length, skill, count]); return chars.slice(0, count); },
    },
  };
  const window = { MiftahGame: ns, matchMedia: () => ({ matches: false }) };
  const context = { window, performance: { now: () => 10 }, setTimeout: () => 1, clearTimeout() {}, Math,
    document: { createElement: () => element() } };
  for (const file of ['GardenPractice.js', 'BookGames.js', 'WordGames.js', 'VowelGames.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context, { filename: file });
  }
  return { ns, policyCalls, context };
}

test('word screens report visible matching even after audio succeeds, and keep help assisted', () => {
  const { ns } = runtime();
  const outcomes = [];
  const game = Object.create(ns.GardenPractice.ListenFind.prototype);
  Object.assign(game, { ctx: { reportOutcome: (outcome) => outcomes.push(outcome) }, missed: false, heard: true, answerReady: true });
  const target = { id: 'word-a', display: 'بَتَ' };
  game.report(target, target.display, [target.display, 'تَبَ'], 'word-reading');
  game.missed = true;
  game.report(target, target.display, [target.display, 'تَبَ'], 'word-reading');
  assert.equal(outcomes[0].evidence, 'supported_visible_matching');
  assert.equal(outcomes[0].assisted, false);
  assert.equal(outcomes[0].correct, true);
  assert.equal(outcomes[0].affectsStrength, true);
  assert.equal(typeof outcomes[0].correct, 'boolean');
  assert.equal(outcomes[1].evidence, 'supported_visible_matching');
  assert.equal(outcomes[1].assisted, true);
});

test('ListenFind hides its reference only for verified listen prompts and reveals it on voice failure', () => {
  const { ns } = runtime('listen');
  const target = { id: 'word-a', display: 'بَتَ', audioPath: 'word-a.mp3' };
  const other = { id: 'word-b', display: 'تَبَ', audioPath: 'word-b.mp3' };
  const stageRoot = element();
  const reference = element();
  reference.hidden = true;
  stageRoot.querySelector = (selector) => selector === '.wd-ear' ? element() : reference;
  stageRoot.querySelectorAll = () => [];
  const stage = { innerHTML: '', firstElementChild: stageRoot };
  const game = new ns.GardenPractice.ListenFind({ stage, items: [target, other], words: [target, other],
    canListen: () => true, say: () => true, cancel() {} });
  assert.equal(game.listenPrompt, true);
  assert.match(stageRoot.innerHTML, /class="wd-reference"[^>]* hidden/);
  game.say(target);
  assert.equal(game.heard, true);
  assert.equal(reference.hidden, true);

  const failedStageRoot = element();
  const failedReference = element();
  failedReference.hidden = true;
  failedStageRoot.querySelector = (selector) => selector === '.wd-ear' ? element() : failedReference;
  failedStageRoot.querySelectorAll = () => [];
  const failedGame = new ns.GardenPractice.ListenFind({ stage: { innerHTML: '', firstElementChild: failedStageRoot },
    items: [target, other], words: [target, other], canListen: () => true, say: () => false, cancel() {} });
  failedGame.say(target);
  assert.equal(failedReference.hidden, false);
});

test('ListenFind counts independent listening only after current target audio succeeds without help', () => {
  const { ns } = runtime('listen');
  const outcomes = [];
  const game = Object.create(ns.GardenPractice.ListenFind.prototype);
  Object.assign(game, { ctx: { reportOutcome: (outcome) => outcomes.push(outcome) },
    roundProfile: { promptMode: 'listen' }, listenPrompt: true, missed: false, heard: true });
  const target = { id: 'word-a', display: 'بَتَ' };
  game.report(target, target.display, [target.display, 'تَبَ'], 'word-reading');
  assert.equal(outcomes[0].evidence, 'independent_listening');
  game.missed = true;
  game.report(target, target.display, [target.display, 'تَبَ'], 'word-reading');
  assert.equal(outcomes[1].evidence, 'supported_visible_matching');
});

test('late voice confirmations cannot qualify a later prompt in any assigned game family', async () => {
  const { ns } = runtime();
  const cases = [
    { prototype: ns.GardenPractice.PeekFlaps.prototype, family: 'book' },
    { prototype: ns.GardenPractice.ListenFind.prototype, family: 'word' },
    { prototype: ns.GardenPractice.HatShop.prototype, family: 'hat' },
  ];
  for (const { prototype, family } of cases) {
    const pending = [];
    const game = Object.create(prototype);
    const root = element();
    Object.assign(game, { alive: true, root, roundToken: 0, promptToken: 0, timers: [], busy: false,
      ctx: { stage: { firstElementChild: root }, say: () => new Promise((resolve) => pending.push(resolve)) } });
    const first = { id: 'first', display: 'first' }, second = { id: 'second', display: 'second' };
    if (family === 'word') game.beginRound(first);
    else game.setPrompt(first);
    const speech = [];
    speech.push(game.say(first));
    if (family === 'word') game.beginRound(second);
    else game.setPrompt(second);
    pending[0](true);
    await speech[0];
    assert.equal(game.heard, false);
    speech.push(game.say(first));
    pending[1](true);
    await speech[1];
    assert.equal(game.heard, false, 'a wrong-choice recording cannot confirm the active prompt');
    speech.push(game.say(second));
    pending[2](true);
    await speech[2];
    assert.equal(game.heard, true);
  }
});

test('HatShop uses only taught syllables and reports a matching reference as assisted support', () => {
  const { ns, policyCalls } = runtime();
  const stageRoot = element();
  const choiceButtons = [element(), element()];
  stageRoot.querySelector = (selector) => selector === '.vh-target-slot' ? element() : null;
  stageRoot.querySelectorAll = (selector) => selector === '.vh-choice' ? choiceButtons : [];
  const stage = { innerHTML: '', firstElementChild: stageRoot };
  const taught = [
    { id: 'baa', display: 'بَ' },
    { id: 'baa-damma', display: 'بُ' },
    { id: 'taa', display: 'تَ' },
  ];
  const outcomes = [];
  const game = new ns.GardenPractice.HatShop({ stage, items: taught,
    say: () => true, reportOutcome: (outcome) => outcomes.push(outcome), cancel() {} });
  assert.deepEqual(JSON.parse(JSON.stringify(game.queue.map((item) => item.display))), ['بَ', 'بُ', 'تَ']);
  assert.deepEqual(JSON.parse(JSON.stringify(game.letters)), ['ب', 'ت']);
  assert.deepEqual(JSON.parse(JSON.stringify(game.marks)), ['َ', 'ُ']);
  assert.ok(policyCalls.some((call) => call[0] === 'plan' && call[2] === 'syllable'));
  game.promptMode = 'match';
  game.heard = true;
  game.answerReady = true;
  const offeredSnapshot = game.offered;
  const correctIndex = game.offeredItems.findIndex((item) => item.id === game.targetItem.id);
  game.pick(correctIndex, choiceButtons[correctIndex], game.roundToken, offeredSnapshot);
  assert.equal(outcomes[0].evidence, 'supported_visible_matching');
  assert.equal(outcomes[0].correct, true);
  assert.equal(outcomes[0].affectsStrength, true);
  assert.equal(typeof outcomes[0].affectsStrength, 'boolean');
  assert.equal(outcomes[0].assisted, true);
});

test('HatShop accepts only one base with one short vowel or tanween and preserves an explicit empty plan', () => {
  const { ns } = runtime();
  const valid = [
    { id: 'baa', display: 'بَ' },
    { id: 'taa-tanween', display: 'تً' },
  ];
  const invalid = [
    { id: 'word', display: 'بَدَّ' },
    { id: 'sukoon', display: 'بْ' },
    { id: 'shadda', display: 'بّ' },
    { id: 'stacked', display: 'بَّ' },
    { id: 'two-syllables', display: 'بَتَ' },
  ];
  for (const item of valid) assert.equal(ns.VowelGames.hatItem(item), true, item.display);
  for (const item of invalid) assert.equal(ns.VowelGames.hatItem(item), false, item.display);

  const stageRoot = element();
  const stage = { innerHTML: '', firstElementChild: stageRoot };
  let cancelled = 0;
  ns.PracticeLearning.plan = () => [];
  const game = new ns.GardenPractice.HatShop({ stage, items: [...valid, ...invalid],
    known: [{ id: 'jeem', display: 'ج' }], marks: ['ْ', 'ّ'], say: () => true,
    reportOutcome() {}, cancel() { cancelled += 1; } });
  assert.deepEqual(JSON.parse(JSON.stringify(game.queue)), []);
  assert.equal(cancelled, 1);
});

test('HatShop choices use the full taught pool even when the planned rounds have no companion', () => {
  const { ns } = runtime();
  const items = [
    { id: 'baa-fatha', display: 'بَ' },
    { id: 'taa-kasra', display: 'تِ' },
    { id: 'tha-damma', display: 'ثُ' },
    { id: 'baa-damma', display: 'بُ' },
    { id: 'taa-fatha', display: 'تَ' },
  ];
  const planned = items.slice(0, 3);
  ns.PracticeLearning.plan = () => planned;
  const root = element();
  root.querySelector = () => null;
  root.querySelectorAll = () => [];
  const game = new ns.GardenPractice.HatShop({ stage: { innerHTML: '', firstElementChild: root }, items,
    say: () => true, cancel() {} });
  for (const target of planned) {
    assert.equal(game.target, target.display);
    assert.equal(game.offered.length, 2, `${target.display} should have two choices from the full taught pool`);
    game.round += 1;
    game.next();
  }
  game.destroy();
});

test('SoundSort stays available when each taught basket has only its friend-name picture', () => {
  const { ns } = runtime();
  const byChar = {
    'ب': [{ id: 'baa-picture', char: 'ب', word: 'ب', en: 'baa' }],
    'ت': [{ id: 'taa-picture', char: 'ت', word: 'ت', en: 'taa' }],
  };
  ns.PictureWords.byChar = (char) => byChar[char] || [];
  const root = element();
  const slot = element();
  slot.firstElementChild = element();
  slot.querySelectorAll = () => [];
  const dots = element();
  root.querySelector = (selector) => selector === '.bk-card-slot' ? slot : selector === '.bk-dots-slot' ? dots : element();
  root.querySelectorAll = () => [];
  let cancelled = 0;
  const game = new ns.GardenPractice.SoundSort({ stage: { innerHTML: '', firstElementChild: root },
    items: [{ id: 'baa', display: 'ب' }, { id: 'taa', display: 'ت' }], say: () => true,
    cancel() { cancelled += 1; } });
  assert.equal(cancelled, 0);
  assert.equal(game.baskets.length, 2);
  assert.equal(game.cards.length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(game.cards.map((card) => card.word).sort())), ['ب', 'ت']);
  game.destroy();
});

test('WordGap accepts a drop inside the gap; pointer cancellation cannot submit an answer', () => {
  const { ns } = runtime();
  const hole = element(), piece = element();
  piece.dataset.i = '0';
  const root = { querySelector: () => hole, querySelectorAll: () => [piece] };
  const stage = { firstElementChild: root };
  const game = Object.create(ns.GardenPractice.WordGap.prototype);
  Object.assign(game, { alive: true, busy: false, answerReady: true, rejectedChoices: new Set(), roundToken: 7, offered: ['choice-a'],
    root, ctx: { stage }, timers: [], dragResets: [], picks: [],
    pick(i, button, token, choices) { if (token !== this.roundToken || choices !== this.offered || !this.answerReady) return false; this.picks.push(i); return true; } });
  game.wirePieceDrags(game.roundToken, game.offered);
  piece.dispatch('pointerdown', { pointerId: 2, isPrimary: true, pointerType: 'mouse', button: 0, clientX: 0, clientY: 0 });
  piece.dispatch('pointermove', { pointerId: 2, isPrimary: true, clientX: 50, clientY: 50 });
  piece.dispatch('pointerup', { pointerId: 2, isPrimary: true, clientX: 50, clientY: 50 });
  assert.deepEqual(game.picks, [0]);
  // The real shared drag helper never calls `drop` on pointercancel.
  let drops = 0;
  const cancelButton = element();
  const release = ns.GardenPractice.draggable(cancelButton, { enabled: () => true, drop: () => { drops += 1; return true; } });
  cancelButton.dispatch('pointerdown', { pointerId: 1, isPrimary: true, pointerType: 'mouse', button: 0, clientX: 0, clientY: 0 });
  cancelButton.dispatch('pointermove', { pointerId: 1, isPrimary: true, clientX: 20, clientY: 20 });
  cancelButton.dispatch('pointercancel', { pointerId: 1 });
  assert.equal(drops, 0);
  game.destroy();
  assert.equal(game.dragResets.length, 0);
  release();
});

test('the three remaining game families use profile-driven choices and HatShop holds its visit ceiling', () => {
  const files = ['BookGames.js', 'WordGames.js', 'VowelGames.js'];
  for (const file of files) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.match(source, /PracticeLearning/);
  }
  const vowel = fs.readFileSync(path.join(__dirname, '..', 'VowelGames.js'), 'utf8');
  const next = vowel.match(/\n    next\(\) \{([\s\S]*?)\n    charForMode\(/)?.[1] || '';
  assert.match(vowel, /this\.choiceCeiling\s*=/, 'the visit snapshots its supported choice ceiling');
  assert.match(next, /Math\.min\(this\.choiceCeiling/, 'each round consumes the saved ceiling');
  assert.doesNotMatch(next, /ctx\.beginner|this\.choiceCeiling\s*=/, 'round setup cannot change the visit ceiling');
});
