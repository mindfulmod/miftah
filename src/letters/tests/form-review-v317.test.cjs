const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const NOW = 1000000000;
const items = Array.from('بتثجحخسشصض', id => ({ id, display: `${id}ـ`, promptDisplay: id, objective: 'letter-form', worldId: 'join-1' }));
const comfortable = { r: 3, w: 0, streak: 3, last: NOW - 60000, sessions: ['a', 'b'] };
function planner(profiles = {}) {
  const window = { MiftahGame: {} }, context = { window, Date: class extends Date { static now() { return NOW; } } };
  for (const n of ['GardenLearning', 'LettersLearning']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', `${n}.js`), 'utf8'), context);
  const strength = { skillProfile: (id, skill) => profiles[id]?.[skill] || {} };
  return (seed = 1, ctx = {}) => {
    let n = seed;
    const random = () => ((n = (1664525 * n + 1013904223) >>> 0) / 0x100000000);
    return window.MiftahGame.LettersLearning.planRounds({ items, strength, random, worldId: 'checkup', rounds: 4, ...ctx });
  };
}
const formData = () => Object.fromEntries(items.map(i => [i.id, { 'letter-form': { matching: { ...comfortable } } }]));

test('a supported form revisit follows a familiar opener across varied target orderings', () => {
  for (const kind of ['help', 'miss']) {
    const data = formData();
    data['ح']['letter-form'] = kind === 'help'
      ? { matching: { ...comfortable, r: 99 }, assisted: { r: 1, last: NOW - 1000 } }
      : { matching: { ...comfortable, r: 99, w: 1, streak: 0, last: NOW - 1000 } };
    const before = JSON.stringify(data), plan = planner(data);
    for (let seed = 1; seed <= 100; seed++) {
      const rounds = plan(seed), ids = Array.from(rounds, r => r.target.id);
      assert.notEqual(ids[0], 'ح', `${kind}: difficult form is not the opener`);
      assert.equal(ids[1], 'ح', `${kind}: revisit is included second`);
      assert.equal(rounds[0].options.length, 3); assert.equal(rounds[1].options.length, 2);
      assert.equal(new Set(ids).size, 4);
      assert.ok(rounds.every(r => r.promptMode === 'match' && r.movement === 'still'));
    }
    assert.equal(JSON.stringify(data), before, 'scheduling never rewrites evidence');
  }
});

test('form familiarity uses this task and cannot be borrowed from other evidence', () => {
  const data = formData();
  for (const i of items) data[i.id]['letter-form'] = {};
  data['ب']['letter-form'].matching = comfortable;
  data['ض'] = { 'letter-form': { listening: { ...comfortable, r: 99 }, motor: { ...comfortable, r: 99 } },
    contextual_forms: { matching: { ...comfortable, r: 99 } }, 'letter-name': { listening: { ...comfortable, r: 99 } } };
  for (let seed = 1; seed <= 20; seed++) assert.equal(planner(data)(seed)[0].target.id, 'ب');
});

test('matching success after older help can provide an opener without inventing recall', () => {
  const data = formData();
  for (const i of items) data[i.id]['letter-form'] = { matching: { ...comfortable, streak: 0, w: 1 } };
  data['ث']['letter-form'] = { matching: { ...comfortable, last: NOW - 1000 }, assisted: { last: NOW - 2000 } };
  const rounds = planner(data)();
  assert.equal(rounds[0].target.id, 'ث'); assert.equal(rounds[0].promptMode, 'match');
  assert.equal(rounds[0].choiceCount, 3);
});

test('new form visits preserve varied coverage before any repeat', () => {
  const plan = planner(), signatures = new Set();
  for (let seed = 1; seed <= 20; seed++) {
    const rounds = plan(seed, { rounds: 12 }), ids = Array.from(rounds, r => r.target.id);
    assert.equal(new Set(ids.slice(0, 10)).size, 10);
    assert.equal(ids[10], ids[0]); assert.equal(ids[11], ids[1]);
    assert.ok(rounds.every(r => r.options.length === 2 && r.promptMode === 'match'));
    signatures.add(ids.slice(0, 4).join());
  }
  assert.ok(signatures.size > 1);
});

test('other practice activities keep their established evidence-based opener', () => {
  for (const [skill, bucket] of [['drawing', 'motor'], ['construction', 'motor'], ['joining', 'motor'], ['matching-memory', 'matching'], ['segmenting', 'matching']]) {
    const data = Object.fromEntries(items.map(i => [i.id, { [skill]: { [bucket]: comfortable } }]));
    data['ث'][skill][bucket] = { ...comfortable, r: 10 };
    data['ح'][skill].assisted = { last: NOW - 1000 };
    const rounds = planner(data)(5, { skill });
    assert.equal(rounds[0].target.id, 'ث', skill); assert.equal(rounds[1].target.id, 'ح', skill);
  }
  const data = Object.fromEntries(items.map(i => [i.id, { 'letter-name': { matching: comfortable } }]));
  data['ش']['letter-name'].listening = { ...comfortable, r: 10 };
  assert.equal(planner(data)(4, { skill: 'letter-name' })[0].target.id, 'ش');
});
