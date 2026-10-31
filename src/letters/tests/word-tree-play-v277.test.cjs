const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classes() {
  const set = new Set();
  return {
    add: (...items) => items.forEach((item) => set.add(item)),
    remove: (...items) => items.forEach((item) => set.delete(item)),
    toggle(item, force) { const next = force === undefined ? !set.has(item) : force; next ? set.add(item) : set.delete(item); return next; },
    contains: (item) => set.has(item),
  };
}

function element(index = 0, rect = { left: 10, top: 10, right: 190, bottom: 150, width: 180, height: 140 }) {
  const listeners = new Map();
  return {
    dataset: { i: String(index) }, classList: classes(), style: {}, isConnected: true,
    addEventListener(type, fn) { const list = listeners.get(type) || []; list.push(fn); listeners.set(type, list); },
    dispatch(type, event = {}) { for (const fn of listeners.get(type) || []) fn(event); },
    getBoundingClientRect() { return rect; },
    setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture() { return false; },
    setAttribute() {}, removeAttribute() {}, animate() { return { cancel() {}, onfinish: null }; },
  };
}

function runtime({ level = 0, choices = 2, plan, beginRound, say = () => true } = {}) {
  const timers = new Map(); let timerId = 0;
  const policy = { level, choices, planCalls: [], profileCalls: [], levelCalls: [] };
  const ns = {
    PracticeLearning: {
      profile(ctx, item, skill) { policy.profileCalls.push([item?.id, skill]); return { choiceCount: policy.choices, promptMode: 'match' }; },
      level(ctx, items, skill) { policy.levelCalls.push([items.map((item) => item.id), skill]); return policy.level; },
      plan(ctx, items, skill, count) { policy.planCalls.push([items.map((item) => item.id), skill, count]); return plan ? plan(ctx, items, skill, count) : items.slice(0, count); },
    },
  };
  const root = {
    html: '', refs: {}, groups: {}, classList: classes(), isConnected: true,
    set innerHTML(value) { this.html = value; }, get innerHTML() { return this.html; },
    querySelector(selector) { return this.refs[selector] || null; },
    querySelectorAll(selector) { return this.groups[selector] || []; },
    contains(node) { return Object.values(this.refs).includes(node) || Object.values(this.groups).some((list) => list.includes(node)); },
  };
  const stage = { innerHTML: '', firstElementChild: root };
  const context = {
    window: { MiftahGame: ns, matchMedia: () => ({ matches: false }) },
    performance: { now: () => 0 },
    setTimeout(fn, ms = 0) { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
    Math, String, Number, Array, Object, JSON, Set, Map,
  };
  for (const file of ['GardenPractice.js', 'WordTree.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context, { filename: file });
  }
  return { ns, stage, root, timers, policy, context };
}

function family(root, id, words, extra = {}) {
  return { id, root, words: words.map(([wordId, arabic, flags = {}]) => ({ id: wordId, arabic, ...flags })), ...extra };
}

function families(count = 3) {
  const data = [
    family('عبد', 'family-abd', [['abd-1', 'عَبْدُ'], ['abd-2', 'عِبَادٌ'], ['abd-3', 'عَابِدٌ']]),
    family('رحم', 'family-rahm', [['rahm-1', 'رَحْمَةٌ'], ['rahm-2', 'رَحِيمٌ'], ['rahm-3', 'رَاحِمٌ']]),
    family('ملك', 'family-mulk', [['mulk-1', 'مَلِكٌ'], ['mulk-2', 'مَالِكٌ'], ['mulk-3', 'مُلْكٌ']]),
    family('حمد', 'family-hamd', [['hamd-1', 'حَمْدٌ'], ['hamd-2', 'مَحْمُودٌ'], ['hamd-3', 'حَامِدٌ']]),
  ];
  return data.slice(0, count);
}

function wireBoard(root, homes = 3) {
  const leaf = element();
  const branches = Array.from({ length: homes }, (_, i) => element(i, {
    left: i * 210, top: 200, right: i * 210 + 180, bottom: 340, width: 180, height: 140,
  }));
  root.refs['.wt-falling'] = leaf;
  root.groups['.wt-home'] = branches;
  return { leaf, branches };
}

test('LeafHome freezes beginner and later home counts from root-family practice evidence', () => {
  const beginnerFx = runtime({ level: 2, choices: 3 });
  wireBoard(beginnerFx.root);
  const beginner = new beginnerFx.ns.GardenPractice.LeafHome({ stage: beginnerFx.stage, families: families(4), beginner: true,
    say: () => true, cancel() {} });
  assert.equal(beginner.visitChoiceCount, 2);
  assert.equal(beginner.homes.length, 2);
  assert.equal(beginnerFx.policy.levelCalls[0][1], 'root-family');
  assert.equal(beginnerFx.policy.planCalls[0][1], 'root-family');
  beginner.destroy();

  const laterFx = runtime({ level: 1, choices: 3 });
  wireBoard(laterFx.root);
  const later = new laterFx.ns.GardenPractice.LeafHome({ stage: laterFx.stage, families: families(4), beginner: false, say: () => true, cancel() {} });
  assert.equal(later.visitChoiceCount, 3);
  assert.equal(later.homes.length, 3);
  laterFx.policy.level = 0; laterFx.policy.choices = 2;
  later.round += 1;
  later.next();
  assert.equal(later.homes.length, 3, 'progression changes during a visit do not change its saved choice count');
  later.destroy();
});

test('LeafHome filters blocked words and aliases before planning, while preserving context IDs', () => {
  const fx = runtime();
  wireBoard(fx.root);
  const data = families(3);
  data[0].words.push(
    { id: 'locked-alias', arabic: 'عَبْدُ', locked: true },
    { id: 'untaught', arabic: 'عَابِدٌ', taught: false },
    { id: 'prerequisite', arabic: 'عِبَادٌ', prerequisiteWorldIds: ['past'] },
    { id: 'invalid', arabic: '---' },
  );
  let planned;
  fx.ns.PracticeLearning.plan = (_ctx, items) => { planned = items.map((item) => item.id); return items; };
  const game = new fx.ns.GardenPractice.LeafHome({ stage: fx.stage, families: data, completedWorldIds: [], worldId: 'current',
    say: () => true, cancel() {} });
  assert.ok(!planned.includes('abd-1'), 'a blocked alias removes the shared display before planning');
  assert.ok(!planned.includes('abd-2'));
  assert.ok(!planned.includes('untaught'));
  assert.ok(!planned.includes('prerequisite'));
  assert.ok(!planned.includes('invalid'));
  assert.ok(game.queue.every((target) => target.item.id && target.item.id !== target.item.display));
  game.destroy();
});

test('an empty or forbidden plan cancels without awarding a finished round', async () => {
  const fx = runtime({ plan: () => [] });
  wireBoard(fx.root);
  let cancelled = 0, done = 0;
  const game = new fx.ns.GardenPractice.LeafHome({ stage: fx.stage, families: families(), say: () => true,
    cancel() { cancelled += 1; }, done() { done += 1; } });
  assert.equal(game.queue.length, 0);
  await Promise.resolve();
  assert.equal(cancelled, 1);
  assert.equal(done, 0);

  const otherFx = runtime({ plan: () => [{ id: 'locked-word', display: 'not-a-local-word' }] });
  wireBoard(otherFx.root);
  let invalidCancelled = 0, invalidDone = 0;
  const blocked = new otherFx.ns.GardenPractice.LeafHome({ stage: otherFx.stage, families: families(), say: () => true,
    cancel() { invalidCancelled += 1; }, done() { invalidDone += 1; } });
  assert.equal(blocked.queue.length, 0, 'unknown plan aliases cannot add another target');
  await Promise.resolve();
  assert.equal(invalidCancelled, 1);
  assert.equal(invalidDone, 0);
  blocked.destroy();
});

test('LeafHome highlights root letters from the first prompt and reports supported matching without recall strength', () => {
  const fx = runtime();
  const { branches } = wireBoard(fx.root);
  const outcomes = [], begun = [];
  const game = new fx.ns.GardenPractice.LeafHome({ stage: fx.stage, families: families(), say: () => true,
    beginRound: (target, skill) => begun.push([target.id, skill]), reportOutcome: (outcome) => outcomes.push(outcome), cancel() {} });
  assert.match(fx.root.html, /wt-falling-word/);
  assert.match(fx.root.html, /wt-l is-root/);
  assert.doesNotMatch(fx.root.html, /wt-falling is-plain/);
  assert.deepEqual(JSON.parse(JSON.stringify(begun[0])), [game.leafItem.id, 'root-family']);
  game.replayPrompt();

  const wrong = game.homes.findIndex((home) => home !== game.home);
  game.pick(wrong, branches[wrong]);
  assert.equal(outcomes[0].correct, false);
  assert.equal(outcomes[0].assisted, true);
  assert.equal(outcomes[0].affectsStrength, false);
  assert.equal(outcomes[0].evidence, 'supported_visible_matching');
  assert.equal(outcomes[0].itemId, game.leafItem.id);
  assert.deepEqual(JSON.parse(JSON.stringify(outcomes[0].choiceIds)), JSON.parse(JSON.stringify(game.homes.map((home) => home.id))));
  [...fx.timers.values()].find((timer) => timer.ms === 360)?.fn();
  const right = game.homes.indexOf(game.home);
  game.pick(right, branches[right]);
  assert.equal(outcomes[1].correct, true);
  assert.equal(outcomes[1].affectsStrength, false);
  assert.ok(branches[right].classList.contains('is-right'));
  assert.match(branches[right].innerHTML, /wt-leaf-arrived/);
  game.destroy();
});

test('LeafHome uses exact branches first, then nearest 28px target; outside drops and stale drags do nothing', () => {
  const fx = runtime();
  const { leaf, branches } = wireBoard(fx.root);
  const outcomes = [];
  const game = new fx.ns.GardenPractice.LeafHome({ stage: fx.stage, families: families(), say: () => true,
    reportOutcome: (outcome) => outcomes.push(outcome), cancel() {} });
  const targetIndex = game.homes.findIndex((home) => home !== game.home);
  const target = branches[targetIndex];
  leaf.dispatch('pointerdown', { pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: 0, clientY: 0 });
  leaf.dispatch('pointermove', { pointerId: 1, isPrimary: true, clientX: 20, clientY: 20 });
  leaf.dispatch('pointerup', { pointerId: 1, isPrimary: true, clientX: targetIndex * 210 + 90, clientY: 270 });
  assert.equal(outcomes.length, 1);
  assert.equal(outcomes[0].correct, false, 'the exact chosen branch receives the leaf');

  game.round += 1;
  const nextLeaf = element();
  const nextBranches = Array.from({ length: 3 }, (_, i) => element(i, {
    left: i * 210, top: 200, right: i * 210 + 180, bottom: 340, width: 180, height: 140,
  }));
  fx.root.refs['.wt-falling'] = nextLeaf;
  fx.root.groups['.wt-home'] = nextBranches;
  game.next();
  const staleToken = game.roundToken - 1;
  const nextIndex = game.homes.indexOf(game.home);
  game.pick(nextIndex, nextBranches[nextIndex], staleToken, game.homeOffer);
  assert.equal(outcomes.length, 1);
  leaf.dispatch('pointerdown', { pointerId: 3, pointerType: 'touch', isPrimary: true, clientX: 0, clientY: 0 });
  leaf.dispatch('pointermove', { pointerId: 3, isPrimary: true, clientX: 20, clientY: 20 });
  leaf.dispatch('pointerup', { pointerId: 3, isPrimary: true, clientX: nextIndex * 210 + 90, clientY: 270 });
  assert.equal(outcomes.length, 1, 'a drag callback from the previous round cannot submit');

  const outsideLeaf = nextLeaf;
  outsideLeaf.dispatch('pointerdown', { pointerId: 2, pointerType: 'touch', isPrimary: true, clientX: 0, clientY: 0 });
  outsideLeaf.dispatch('pointermove', { pointerId: 2, isPrimary: true, clientX: 20, clientY: 20 });
  outsideLeaf.dispatch('pointerup', { pointerId: 2, isPrimary: true, clientX: 1000, clientY: 1000 });
  assert.equal(outcomes.length, 1);
  game.destroy();
  assert.equal(game.dragResets.length, 0);
});

test('the shared branch receiver accepts the full padded 28px edge', () => {
  const fx = runtime();
  const { leaf, branches } = wireBoard(fx.root);
  const outcomes = [];
  const game = new fx.ns.GardenPractice.LeafHome({ stage: fx.stage, families: families(), say: () => true,
    reportOutcome: (outcome) => outcomes.push(outcome), cancel() {} });
  const targetIndex = game.homes.findIndex((home) => home !== game.home), target = branches[targetIndex];
  const rect = target.getBoundingClientRect();
  const edgeX = targetIndex === 0 ? rect.left - 28 : rect.right + 28;
  assert.equal(fx.ns.GardenPractice.inside(target, edgeX, rect.top + rect.height / 2), true);
  assert.equal(outcomes.length, 0, 'checking the padded receiver geometry does not submit an answer by itself');
  game.destroy();
});

test('speech rejections and delayed callbacks are consumed and cannot touch a later round', async () => {
  let reject;
  const fx = runtime();
  wireBoard(fx.root);
  let done = 0, spoken = 0;
  const game = new fx.ns.GardenPractice.LeafHome({ stage: fx.stage, families: families(), say: () => { spoken += 1; return new Promise((_resolve, no) => { reject = no; }); },
    done() { done += 1; }, cancel() {} });
  const current = game.roundToken;
  const pending = game.say(game.leaf, current);
  game.round += 1;
  game.next();
  reject(new Error('audio failed'));
  assert.equal(await pending, false);
  const oldTimers = game.timers.map((timer) => fx.timers.get(timer)?.fn).filter(Boolean);
  const beforeExit = spoken;
  game.destroy();
  oldTimers.forEach((callback) => callback());
  assert.equal(done, 0);
  assert.equal(spoken, beforeExit);
  assert.equal(game.timers.length, 0);
});

test('the gallery keeps its public word shape while LeafHome items preserve supplied IDs', () => {
  const fx = runtime();
  const W = fx.ns.WordTree;
  const result = W.families([{ ayahs: [{ words: [
    { id: 'source-one', arabic: 'عَبْدُ', root: 'عبد', audioPath: 'one.mp3' },
    { arabic: 'عِبَادٌ', root: 'عبد', audioPath: 'two.mp3' },
  ] }] }]);
  assert.equal(result[0].words.find((item) => item.arabic === 'عَبْدُ').id, undefined, 'the public corpus helper keeps its historic gallery shape');
  assert.equal(W.item({ id: 'source-one', arabic: 'عَبْدُ' }).id, 'source-one');
  assert.equal(W.item({ arabic: 'عِبَادٌ' }).id, 'عِبَادٌ');
});

test('duplicate root rows merge before choices, plans cannot substitute an invalid ID by display', () => {
  const fx = runtime({ plan: (_ctx, items) => [{ id: 'not-an-id', display: items[0].display }] });
  wireBoard(fx.root);
  let cancelled = 0, done = 0;
  const dupes = [...families(2), family('عبد', 'duplicate-abd', [['abd-extra', 'عَابِدٌ']])];
  const game = new fx.ns.GardenPractice.LeafHome({ stage: fx.stage, families: dupes, say: () => true,
    cancel() { cancelled += 1; }, done() { done += 1; } });
  assert.equal(game.fams.filter((entry) => entry.root === 'عبد').length, 1);
  assert.equal(game.queue.length, 0);
  return Promise.resolve().then(() => {
    assert.equal(cancelled, 1);
    assert.equal(done, 0);
    game.destroy();
  });
});

test('a locked duplicate root record cannot reopen its words through a second row', async () => {
  const fx = runtime();
  wireBoard(fx.root);
  let cancelled = 0;
  const data = [...families(2), family('عبد', 'locked-family', [['abd-4', 'عَابِدٌ']])];
  data[2].locked = true;
  const game = new fx.ns.GardenPractice.LeafHome({ stage: fx.stage, families: data, say: () => true, cancel() { cancelled += 1; } });
  assert.ok(!game.fams.some((entry) => entry.root === 'عبد'));
  await Promise.resolve();
  assert.equal(cancelled, 1);
  game.destroy();
});

test('shadda does not supply a second visible base letter for doubled roots', async () => {
  const fx = runtime();
  wireBoard(fx.root);
  let cancelled = 0;
  const data = [families(1)[0], family('ربب', 'family-rabb', [['rabb-1', 'رَبِّ'], ['rabb-2', 'رَبُّ']])];
  const game = new fx.ns.GardenPractice.LeafHome({ stage: fx.stage, families: data, say: () => true, cancel() { cancelled += 1; } });
  assert.ok(!game.fams.some((entry) => entry.root === 'ربب'));
  await Promise.resolve();
  assert.equal(cancelled, 1, 'a single written ب plus shadda cannot make a full ربب visual family');
  game.destroy();
});

test('root highlighting follows root order and skips a non-root hamza prefix', () => {
  const fx = runtime();
  const word = 'أَرَأَيْتَ';
  const pieces = fx.ns.WordTree.pieces(word), marks = fx.ns.WordTree.rootMarks(word, 'رأي');
  const visible = pieces.filter((_piece, index) => marks[index]).map((piece) => piece.base).join('');
  assert.equal(visible, 'رأي');
  assert.equal(marks[0], false, 'the prefix hamza is not highlighted as the first root letter');
});

test('wrong feedback locks choices and replay until the guarded cooldown ends', () => {
  const fx = runtime();
  const { leaf, branches } = wireBoard(fx.root);
  let spoken = 0;
  const game = new fx.ns.GardenPractice.LeafHome({ stage: fx.stage, families: families(), say: () => { spoken += 1; return true; }, cancel() {} });
  const wrong = game.homes.findIndex((home) => home !== game.home);
  const count = spoken;
  assert.equal(game.pick(wrong, branches[wrong]), true);
  assert.equal(branches.every((branch) => branch.disabled), true);
  assert.equal(game.replayPrompt(), false);
  assert.equal(spoken, count);
  const cooldown = [...fx.timers.values()].find((timer) => timer.ms === 360);
  cooldown.fn();
  assert.equal(branches.every((branch) => !branch.disabled), true);
  assert.equal(game.replayPrompt(), true);
  game.destroy();
});

test('optional form art receives stable class hooks and the game suppresses duplicate global replay', () => {
  const fx = runtime();
  wireBoard(fx.root);
  fx.ns.FormPlayArt = { leaf: () => '<svg viewBox="0 0 280 150"></svg>', branch: () => '<svg class="scene-art" viewBox="0 0 180 140"></svg>' };
  const game = new fx.ns.GardenPractice.LeafHome({ stage: fx.stage, families: families(), say: () => true, cancel() {} });
  assert.equal(game.noReplay, true);
  assert.match(fx.root.html, /class="wt-leaf-art"/);
  assert.match(fx.root.html, /class="scene-art wt-branch-art"/);
  game.destroy();
});

test('real Ayah Garden families require every root base letter and stay within unlocked branch order', () => {
  const fx = runtime();
  const numbers = [1, 112, 113, 114, 111, 110, 109, 108, 107, 106, 105];
  const corpus = numbers.map((number) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', '..', 'data', `surah-${number}.json`), 'utf8')));
  const publicFamilies = fx.ns.WordTree.families(corpus);
  assert.equal(publicFamilies.length, 22, 'the general gallery corpus remains unchanged');

  const normalize = (char) => 'أإآءؤئ'.includes(char) ? 'ء' : char;
  const hasVisibleRoot = (display, root) => {
    const needed = [...root.normalize('NFC')].filter((char) => /^\p{Letter}$/u.test(char) && /\p{Script=Arabic}$/u.test(char)).map(normalize);
    let at = 0;
    for (const char of [...display.normalize('NFC')]) {
      if (/^\p{Letter}$/u.test(char) && /\p{Script=Arabic}$/u.test(char) && at < needed.length && normalize(char) === needed[at]) at += 1;
    }
    return needed.length > 0 && at === needed.length;
  };
  const launch = (branches) => {
    const stage = { innerHTML: '', firstElementChild: null };
    const root = { html: '', refs: {}, groups: {}, classList: classes(), isConnected: true,
      set innerHTML(value) { this.html = value; }, get innerHTML() { return this.html; },
      querySelector(selector) { return this.refs[selector] || null; }, querySelectorAll(selector) { return this.groups[selector] || []; },
      contains(node) { return Object.values(this.refs).includes(node) || Object.values(this.groups).some((list) => list.includes(node)); } };
    wireBoard(root, 3);
    stage.firstElementChild = root;
    return new fx.ns.GardenPractice.LeafHome({ stage, families: publicFamilies, branches, say: () => true, cancel() {} });
  };
  const early = launch(4);
  assert.deepEqual(JSON.parse(JSON.stringify(early.fams.map((entry) => entry.root))), ['عبد', 'دين']);
  assert.ok(early.targets.every(({ family, word }) => hasVisibleRoot(word.arabic, family.root)));
  assert.ok(!early.fams.some((entry) => ['رأي', 'أنس', 'صلو'].includes(entry.root)), 'unlocked later roots cannot replace sparse early branches');
  early.destroy();

  const later = launch(5);
  assert.deepEqual(JSON.parse(JSON.stringify(later.fams.map((entry) => entry.root))), ['عبد', 'دين', 'رأي']);
  assert.ok(later.targets.every(({ family, word }) => hasVisibleRoot(word.arabic, family.root)));
  later.destroy();
});
