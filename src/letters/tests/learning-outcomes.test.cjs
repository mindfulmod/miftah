const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(files, state = {}) {
  let saved = JSON.stringify(state);
  const window = { MiftahGame: {} };
  const context = {
    window,
    performance: { now: () => 0 },
    localStorage: {
      getItem: () => saved,
      setItem: (_key, value) => { saved = value; },
    },
  };
  for (const file of files) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  }
  return { ns: window.MiftahGame, saved: () => JSON.parse(saved) };
}

function miniGames() {
  const window = { MiftahGame: { LettersArt: {} }, addEventListener() {}, removeEventListener() {} };
  const context = { window, setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {}, requestAnimationFrame() {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'MiniGames.js'), 'utf8'), context);
  return window.MiftahGame;
}

function classes() {
  const values = new Set();
  return { add: (...xs) => xs.forEach(x => values.add(x)), remove: (...xs) => xs.forEach(x => values.delete(x)), contains: x => values.has(x) };
}

test('a visibly prompted Pop choice reports supported matching and still informs strength', () => {
  const ns = miniGames();
  const outcomes = [];
  const target = { id: 'ب', display: 'ب' };
  const el = { classList: classes(), disabled: false };
  const bubble = { item: target, el };
  const game = Object.create(ns.LettersMiniGames.pop.prototype);
  Object.assign(game, {
    alive: true, advancing: false, bubbles: [bubble], rounds: [{ target }], roundIndex: 0,
    completionReady: false, timers: new Set(), sky: { classList: { add() {}, remove() {} } }, finishEl: { hidden: true }, nextBtn: { disabled: true }, replayBtn: { disabled: true },
    heat: { up() {}, down() {} },
    ctx: { reportOutcome: o => outcomes.push(o), sfx() {}, confettiAt() {}, say() {} },
  });
  game.popAttempt(bubble);
  assert.deepEqual(JSON.parse(JSON.stringify(outcomes)), [{
    itemId: 'ب', correct: true, evidence: 'supported_visible_matching', affectsStrength: true,
  }]);
});

test('Unfuse motor participation cannot refresh answer strength or recency', () => {
  const ns = miniGames();
  const outcomes = [];
  const pull = { hidden: false };
  const halves = { hidden: true };
  const target = {
    id: 'بت', display: 'بت',
    parts: [{ display: 'ب', speak: 'baa' }, { display: 'ت', speak: 'taa' }],
  };
  const game = Object.create(ns.LettersMiniGames.unfuse.prototype);
  Object.assign(game, {
    alive: true, phase: 'pull', busy: false, whole: null, roundIndex: 0, targets: [target],
    ctx: {
      stage: { querySelector: selector => selector === '.unfuse-pull' ? pull : halves },
      reportOutcome: outcome => outcomes.push(outcome), sfx() {}, confettiAt() {}, say() {},
    },
  });
  game.split();
  assert.deepEqual(JSON.parse(JSON.stringify(outcomes)), [{
    itemId: 'بت', evidence: 'motor_assembly_participation', affectsStrength: false,
  }]);
});

test('learning session distinguishes independent, helped, visible, and assembly evidence', () => {
  const calls = [];
  let now = 100;
  const { ns } = load(['LettersLearning.js']);
  const session = new ns.LettersLearning.LearningSession({ recordOutcome: o => (calls.push(o), true) }, () => now);

  session.beginPrompt({ id: 'ب' });
  now = 200;
  session.report({ itemId: 'ب', correct: true, evidence: 'independent_listening' });
  session.beginPrompt({ id: 'ت' });
  session.report({ itemId: 'ت', correct: false, evidence: 'independent_listening' });
  now = 500;
  session.report({ itemId: 'ت', correct: true, evidence: 'independent_listening' });
  session.beginPrompt(null);
  session.report({ itemId: 'ث', correct: true, evidence: 'supported_visible_matching', affectsStrength: false });
  session.beginPrompt(null);
  session.report({ itemId: 'ج', evidence: 'motor_assembly_participation', affectsStrength: false });

  assert.deepEqual(calls.map(o => o.evidence), [
    'independent_listening',
    'independent_listening',
    'assisted_response',
    'supported_visible_matching',
    'motor_assembly_participation',
  ]);
  assert.equal(calls[2].baseEvidence, 'independent_listening');
  assert.equal(calls[2].assisted, true);
  assert.equal(calls[3].affectsStrength, false);
});

test('Letter Delivery success shape joins the same evidence contract', () => {
  const calls = [];
  const { ns } = load(['LettersLearning.js']);
  const session = new ns.LettersLearning.LearningSession({ recordOutcome: o => (calls.push(o), true) }, () => 10);
  session.report({ activity: 'LetterDelivery', itemId: 'ب', independent: true, assisted: false });
  session.report({ activity: 'LetterDelivery', itemId: 'ت', independent: false, assisted: true });
  assert.deepEqual(calls.map(o => [o.correct, o.evidence]), [
    [true, 'independent_listening'],
    [true, 'assisted_response'],
  ]);
});

test('prompt replay and repeated completion do not duplicate a verdict', () => {
  const calls = [];
  let now = 0;
  const { ns } = load(['LettersLearning.js']);
  const session = new ns.LettersLearning.LearningSession({ recordOutcome: o => (calls.push(o), true) }, () => now);
  session.beginPrompt({ id: 'ب' });
  now = 50;
  session.beginPrompt({ id: 'ب' }); // the speaker/replay path re-presents the active prompt
  assert.equal(calls.length, 0);
  assert.ok(session.report({ itemId: 'ب', correct: true, evidence: 'independent_listening' }));
  assert.equal(session.report({ itemId: 'ب', correct: true, evidence: 'independent_listening' }), false);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].elapsedMs, 50);
});

test('old strength records survive and response speed is neutral', () => {
  const last = Date.now();
  const old = {
    fast: { r: 3, w: 1, streak: 2, fast: 3, slow: 0, last, keepsake: 7 },
    slow: { r: 3, w: 1, streak: 2, fast: 0, slow: 3, last, keepsake: 7 },
  };
  const { ns, saved } = load(['LettersStrength.js'], old);
  assert.equal(ns.LettersStrength.weakness('fast'), ns.LettersStrength.weakness('slow'));
  assert.equal(ns.LettersStrength.mastery('fast'), ns.LettersStrength.mastery('slow'));
  assert.equal(ns.LettersStrength.mastery('fast'), 0.73); // legacy all-fast result is preserved

  ns.LettersStrength.recordOutcome({
    itemId: 'fast', correct: true, elapsedMs: 9000,
    evidence: 'assisted_response', affectsStrength: true,
  });
  const next = saved().fast;
  assert.equal(next.r, 4);
  assert.equal(next.slow, 1);
  assert.equal(next.keepsake, 7);
  assert.equal(next.evidence.assisted_response, 1);
  assert.deepEqual(next.evidenceResults.assisted_response, { r: 1, w: 0, participation: 0 });
});

test('supported evidence is stored without inflating recognition progress', () => {
  const last = Date.now() - 1000;
  const { ns, saved } = load(['LettersStrength.js'], {
    'ب': { r: 2, w: 1, streak: 1, fast: 1, slow: 1, last },
  });
  ns.LettersStrength.recordOutcome({
    itemId: 'ب', correct: true,
    evidence: 'supported_visible_matching', affectsStrength: false,
  });
  const next = saved()['ب'];
  assert.equal(next.r, 2);
  assert.equal(next.w, 1);
  assert.equal(next.last, last);
  assert.equal(next.evidence.supported_visible_matching, 1);
  assert.deepEqual(next.evidenceResults.supported_visible_matching, { r: 1, w: 0, participation: 0 });
  assert.ok(next.evidenceLast >= last);
});

test('per-evidence results retain legacy totals and separate right, wrong, and participation', () => {
  const { ns, saved } = load(['LettersStrength.js'], {
    'ب': {
      r: 1, w: 0, streak: 1, fast: 1, slow: 0, last: Date.now(),
      evidence: { supported_visible_matching: 4 },
    },
  });
  ns.LettersStrength.recordOutcome({ itemId: 'ب', correct: false, evidence: 'supported_visible_matching' });
  ns.LettersStrength.recordOutcome({ itemId: 'ب', correct: true, evidence: 'supported_visible_matching' });
  ns.LettersStrength.recordOutcome({ itemId: 'ب', evidence: 'motor_assembly_participation', affectsStrength: false });
  const next = saved()['ب'];
  assert.equal(next.evidence.supported_visible_matching, 6);
  assert.deepEqual(next.evidenceResults.supported_visible_matching, { r: 1, w: 1, participation: 0 });
  assert.deepEqual(next.evidenceResults.motor_assembly_participation, { r: 0, w: 0, participation: 1 });
  assert.equal(next.r, 2);
  assert.equal(next.w, 1);
});
