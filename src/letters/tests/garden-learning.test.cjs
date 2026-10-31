const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'GardenLearning.js'), 'utf8');
const DAY = 86400000;
const now = 20 * DAY;
const plain = value => JSON.parse(JSON.stringify(value));

function runtime(profiles = {}) {
  const window = { MiftahGame: {} };
  vm.runInNewContext(source, { window, Date });
  return {
    api: window.MiftahGame.GardenLearning,
    strength: { skillProfile: (id, skill) => profiles[id]?.[skill] || { attempts: 0 } },
  };
}

const item = (id, extra = {}) => ({ id, display: id, ...extra });
const bucket = (r = 0, w = 0, { streak = r, last = 0, sessions = [] } = {}) => ({ r, w, streak, last, sessions });

test('readiness keeps independent listening separate from matching, help, and motor play', () => {
  const { api, strength } = runtime({
    ب: {
      'letter-name': {
        listening: bucket(0, 0),
        matching: bucket(9, 0, { last: now }),
        assisted: bucket(4, 1, { last: now }),
        motor: { participation: 8, last: now },
      },
    },
  });
  const value = api.readiness(strength, 'ب', 'letter-name', now);
  assert.equal(value.independentSuccesses, 0);
  assert.equal(value.hasIndependentEvidence, false);
  assert.equal(value.familiar, false);
  assert.equal(value.needsPractice, true);
  assert.equal(value.evidence.matching.successes, 9);
  assert.equal(value.evidence.assisted.successes, 4);
  assert.equal(value.evidence.motor.successes, 0);
});

test('readiness spaces only from independent listening time and recall streak', () => {
  const { api, strength } = runtime({
    ب: { 'letter-name': {
      listening: bucket(3, 0, { streak: 2, last: now - 2 * DAY, sessions: ['a', 'b'] }),
      matching: bucket(20, 0, { last: now }),
      assisted: bucket(10, 0, { last: now }),
    } },
  });
  const value = api.readiness(strength, 'ب', 'letter-name', now);
  assert.equal(value.intervalDays, 4);
  assert.equal(value.lastIndependent, now - 2 * DAY);
  assert.equal(value.due, false);
  assert.equal(value.accuracy, 1);
  const due = api.readiness({ skillProfile: () => ({ listening: bucket(1, 0, { streak: 0, last: now - DAY }) }) }, 'ت', 'letter-name', now);
  assert.equal(due.due, true);
});

test('plan selects only taught items, opens with independently familiar material, and is deterministic', () => {
  const { api, strength } = runtime({
    ب: { 'letter-name': { listening: bucket(5, 0, { streak: 1, last: now - DAY, sessions: ['a', 'b'] }) } },
    ت: { 'letter-name': { listening: bucket(1, 2, { streak: 0, last: now - 8 * DAY, sessions: ['a'] }) } },
  });
  const taught = [item('ث'), item('ت'), item('ب'), item('خ', { taught: false }), item('ج', { locked: true })];
  const first = api.plan(strength, taught, { now, limit: 3 });
  const second = api.plan(strength, taught, { now, limit: 3 });
  assert.deepEqual(plain(first.map(row => row.id)), ['ب', 'ت', 'ث']);
  assert.deepEqual(plain(second.map(row => row.id)), plain(first.map(row => row.id)));
  assert.ok(first.every(row => row.taught !== false && row.locked !== true));
  assert.deepEqual(plain(api.plan(strength, [item('ت'), item('ب')], { now: 0, limit: 0 })), []);
});

test('without independent evidence the opener is not inferred from matching success', () => {
  const { api, strength } = runtime({
    ب: { 'letter-name': { matching: bucket(30, 0, { last: now }) } },
  });
  const plan = api.plan(strength, [item('ت'), item('ب')], { now });
  assert.equal(plan[0].id, 'ب');
  assert.equal(api.readiness(strength, plan[0].id, 'letter-name', now).familiar, false);
});

test('support stays gentle until independent successes span two sessions', () => {
  const { api, strength } = runtime({
    ب: { 'letter-name': { matching: bucket(3, 0, { streak: 2 }), listening: bucket(0, 0) } },
    ت: { 'letter-name': { matching: bucket(3, 0, { streak: 2 }), listening: bucket(4, 0, { streak: 2, sessions: ['visit-a', 'visit-b'] }) } },
  });
  assert.deepEqual(plain(api.support(strength, [item('ب'), item('ت')])), [
    { itemId: 'ب', choiceCount: 2, allowRecall: true, beginner: false },
    { itemId: 'ت', choiceCount: 3, allowRecall: true, beginner: false },
  ]);
  assert.deepEqual(plain(api.support(strength, [item('ت')], { beginner: true })), [
    { itemId: 'ت', choiceCount: 2, allowRecall: false, beginner: true },
  ]);
});

test('matching unlocks a first listening opportunity without becoming recall mastery', () => {
  const { api, strength } = runtime({
    ب: { 'letter-name': { matching: bucket(3, 0, { streak: 2 }) } },
  });
  const support = api.support(strength, [item('ب')])[0];
  const state = api.readiness(strength, 'ب', 'letter-name', now);
  assert.deepEqual(plain(support), { itemId: 'ب', choiceCount: 2, allowRecall: true, beginner: false });
  assert.equal(state.independentSuccesses, 0);
  assert.equal(state.familiar, false);
});

test('newer assisted evidence returns the item to visible matching support', () => {
  const { api, strength } = runtime({
    ب: { 'letter-name': {
      matching: bucket(5, 0, { streak: 3, last: now - DAY }),
      listening: bucket(4, 0, { streak: 3, last: now - DAY, sessions: ['a', 'b'] }),
      assisted: bucket(1, 0, { last: now }),
    } },
  });
  const support = api.support(strength, [item('ب')])[0];
  const state = api.readiness(strength, 'ب', 'letter-name', now);
  assert.deepEqual(plain(support), { itemId: 'ب', choiceCount: 2, allowRecall: false, beginner: false });
  assert.equal(state.assistedNeedsSupport, true);
  assert.equal(state.needsPractice, true);
});

test('a recent independent miss is due immediately and due items precede extra unseen items', () => {
  const { api, strength } = runtime({
    ب: { 'letter-name': { listening: bucket(2, 1, { streak: 0, last: now - 1000, sessions: ['a'] }) } },
    ت: { 'letter-name': { listening: bucket(3, 0, { streak: 1, last: now - 5 * DAY, sessions: ['a', 'b'] }) } },
  });
  assert.equal(api.readiness(strength, 'ب', 'letter-name', now).due, true);
  const selected = api.plan(strength, [item('ا'), item('ب'), item('ت'), item('ث')], { now, limit: 3 });
  assert.deepEqual(plain(selected.map(row => row.id)), ['ت', 'ب', 'ا']);
});
