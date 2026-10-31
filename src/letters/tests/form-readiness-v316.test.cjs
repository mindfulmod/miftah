const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const KEY = 'quran-trainer:letters:strength';
const form = { id: 'ب', display: 'بـ', promptDisplay: 'ب', objective: 'letter-form' };
const ready = { r: 3, w: 0, streak: 2, last: 100, sessions: ['visit-a', 'visit-b'] };
const seed = (evidence) => ({ [form.id]: { r: 75, w: 0, streak: 75, skills: { 'letter-form': evidence } } });
function runtime(data = {}, garden = true) {
  let now = 1000;
  const storage = new Map([[KEY, JSON.stringify(data)]]);
  const window = { MiftahGame: {} };
  const context = { window, performance: { now: () => now }, Date: class extends Date { static now() { return now; } },
    localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, String(v)) } };
  for (const name of [...(garden ? ['GardenLearning'] : []), 'LettersLearning', 'LettersStrength'])
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', `${name}.js`), 'utf8'), context);
  const ns = window.MiftahGame;
  return { ns, storage, tick() { now++; }, profile: (ctx = {}, item = form) => ns.LettersLearning.profile(item, ctx) };
}

test('form practice adds one still choice only after successful matching across visits', () => {
  for (const garden of [true, false]) for (const [matching, expected] of [
    [undefined, 2], [{ ...ready, r: 2 }, 2], [{ ...ready, streak: 1 }, 2],
    [{ ...ready, sessions: ['visit-a'] }, 2], [{ ...ready, sessions: ['visit-a', 'visit-a'] }, 2],
    [{ ...ready, sessions: ['visit-a', '', null, 9, ' '] }, 2],
    [{ ...ready, sessions: undefined }, 2], [{ ...ready, sessions: 'invalid' }, 2],
    [ready, 3], [{ ...ready, r: 100, streak: 100, sessions: ['a', 'b', 'c'] }, 3],
  ]) {
    const r = runtime(seed({ matching }), garden), before = r.storage.get(KEY);
    const p = r.profile();
    assert.equal(p.choiceCount, expected, JSON.stringify(matching));
    assert.equal(p.promptMode, 'match'); assert.equal(p.movement, 'still');
    assert.equal(r.profile({ beginner: true }).choiceCount, 2);
    assert.equal(r.storage.get(KEY), before, 'reading support never rewrites progress');
  }
});

test('newer help and a recent miss restore two choices even with old listening successes', () => {
  for (const matching of [{ ...ready, streak: 0 }, { ...ready, streak: 1 }, ready]) {
    const r = runtime(seed({ matching, listening: { r: 99, streak: 99, sessions: ['a', 'b', 'c'], last: 300 }, assisted: { last: 200 } }));
    assert.equal(r.profile().choiceCount, 2);
    assert.equal(r.profile().movement, 'still');
    assert.equal(r.profile().promptMode, 'match');
  }
  const recovered = runtime(seed({ matching: { ...ready, last: 400 }, assisted: { last: 200 } }));
  assert.equal(recovered.profile().choiceCount, 3);
  assert.equal(recovered.profile().tier, 1, 'adding a choice does not also raise distractor tier');
});

test('other learning directions and participation cannot qualify form matching', () => {
  const unrelated = { matching: ready, listening: { ...ready, r: 99, streak: 99 }, motor: ready };
  for (const evidence of [{}, { listening: unrelated.listening }, { motor: ready }, { assisted: ready }]) {
    const data = seed(evidence);
    data[form.id].skills.contextual_forms = unrelated;
    data[form.id].skills['letter-name'] = unrelated;
    data[form.id].skills.construction = unrelated;
    const r = runtime(data);
    assert.equal(r.profile().choiceCount, 2);
    assert.equal(r.profile().promptMode, 'match'); assert.equal(r.profile().movement, 'still');
  }
});

test('real outcomes persist the visit gate, assistance backoff, and recovery', () => {
  const r = runtime(), { LettersLearning: learning, LettersStrength: strength } = r.ns;
  const visit = () => new learning.LearningSession(strength, () => 0);
  const answer = (session, correct, help = false) => {
    session.beginPrompt(form, { skill: 'letter-form', activity: 'pop' });
    if (help) session.assist();
    r.tick(); session.report({ itemId: form.id, correct, evidence: 'supported_visible_matching', affectsStrength: false });
  };
  const first = visit();
  for (let i = 0; i < 4; i++) answer(first, true);
  assert.equal(r.profile().choiceCount, 2, 'one visit does not qualify');
  r.tick(); const second = visit(); answer(second, true);
  assert.equal(r.profile().choiceCount, 3);
  answer(second, false); answer(second, true, true);
  assert.equal(r.profile().choiceCount, 2);
  let saved = JSON.parse(r.storage.get(KEY));
  assert.equal(runtime(saved).profile().choiceCount, 2, 'help survives reload');
  assert.equal(saved[form.id].skills['letter-form'].matching.w, 1);
  assert.equal(saved[form.id].skills['letter-form'].assisted.r, 1);
  answer(second, true); assert.equal(r.profile().choiceCount, 2);
  answer(second, true); assert.equal(r.profile().choiceCount, 3);
  saved = JSON.parse(r.storage.get(KEY));
  assert.equal(runtime(saved).profile().choiceCount, 3);
  assert.equal(saved[form.id].r, 0, 'visual practice never becomes legacy listening success');
});

test('form rounds cap choices by the taught pool and keep all examples visible', () => {
  const r = runtime(seed({ matching: ready })), target = { ...form, worldId: 'join-1' };
  const other = { id: 'ت', display: 'ـت', promptDisplay: 'ت', worldId: 'join-1', taught: true };
  const third = { id: 'ج', display: 'ـجـ', promptDisplay: 'ج', worldId: 'join-1', taught: true };
  const future = { id: 'ق', display: 'قـ', worldId: 'join-2', prerequisiteWorldIds: ['join-2'] };
  for (const [extras, count] of [[[future], 1], [[other, future], 2], [[other, third, future], 3]]) {
    const rounds = r.ns.LettersLearning.planRounds({ items: [target], extraItems: extras, rounds: 4, worldId: 'checkup', completedWorldIds: ['join-1'], random: () => .25 });
    for (const round of rounds) {
      assert.equal(round.options.length, count); assert.equal(round.promptMode, 'match'); assert.equal(round.movement, 'still');
      assert.ok(round.options.every(i => i.worldId === 'join-1'));
      assert.equal(round.target.promptDisplay, 'ب');
    }
  }
});

test('ordinary letter listening, beginner support, and optional challenge retain their rules', () => {
  const data = seed({ matching: ready });
  data[form.id].skills['letter-name'] = { matching: ready };
  let r = runtime(data);
  const letter = { id: 'ب', display: 'ب' };
  assert.equal(r.profile({}, letter).choiceCount, 2); assert.equal(r.profile({}, letter).promptMode, 'listen');
  data[form.id].skills['letter-name'].listening = { r: 8, streak: 4, last: 100, sessions: ['a', 'b', 'c'] };
  r = runtime(data);
  assert.equal(r.profile({}, letter).choiceCount, 3); assert.equal(r.profile({}, letter).movement, 'gentle');
  assert.equal(r.profile({ beginner: true }, letter).choiceCount, 2);
  assert.equal(r.profile({ challenge: true }).choiceCount, 4);
  assert.equal(r.profile({ challenge: true, beginner: true }).choiceCount, 4);
});
