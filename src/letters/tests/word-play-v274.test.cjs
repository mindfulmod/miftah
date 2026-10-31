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
    toggle(name, force) { const next = force === undefined ? !values.has(name) : force; next ? values.add(name) : values.delete(name); return next; },
    contains: (name) => values.has(name),
  };
}

function element(index = 0) {
  const listeners = new Map();
  return {
    dataset: { i: String(index) }, classList: classes(), style: {}, hidden: false, disabled: false,
    isConnected: true, innerHTML: '', focused: false,
    focus() { this.focused = true; },
    addEventListener(type, fn) { const list = listeners.get(type) || []; list.push(fn); listeners.set(type, list); },
    dispatch(type, event = {}) { for (const fn of listeners.get(type) || []) fn(event); },
    setPointerCapture() {}, releasePointerCapture() {}, hasPointerCapture() { return false; },
    getBoundingClientRect() { return { left: 10, top: 10, right: 60, bottom: 60, width: 50, height: 50 }; },
    setAttribute() {}, removeAttribute() {}, animate() { return null; },
  };
}

function runtime({ promptMode = 'match', level = 0, plan, say = () => true } = {}) {
  const timers = new Map();
  let timerId = 0;
  const policyCalls = [];
  const friends = { FRIENDS: Object.fromEntries([..."ابتثجحخدذرزسشصضطظعغفقكلمنهوي"].map((c) => [c, true])), art: () => '<svg></svg>' };
  const ns = {
    LetterFriends: friends,
    LettersArt: { icon: () => '<svg></svg>' },
    PracticeLearning: {
      profile(ctx, item, skill) { policyCalls.push(['profile', item?.id, skill]); return { choiceCount: level ? 3 : 2, promptMode }; },
      level(ctx, items, skill) { policyCalls.push(['level', items.length, skill]); return level; },
      plan(ctx, items, skill, count) { policyCalls.push(['plan', items.map((item) => item.id), skill, count]); return plan ? plan(ctx, items, skill, count) : items.slice(0, count); },
    },
  };
  const root = {
    _html: '', refs: {}, groups: {},
    set innerHTML(value) { this._html = value; }, get innerHTML() { return this._html; },
    querySelector(selector) { return this.refs[selector] || null; },
    querySelectorAll(selector) {
      if (selector === '.wd-card, .wd-piece') return [...(this.groups['.wd-card'] || []), ...(this.groups['.wd-piece'] || [])];
      return this.groups[selector] || [];
    },
    contains(node) { return Object.values(this.refs).includes(node) || Object.values(this.groups).some((nodes) => nodes.includes(node)); },
    classList: classes(),
  };
  const stage = { innerHTML: '', firstElementChild: root };
  const context = {
    window: { MiftahGame: ns, matchMedia: () => ({ matches: false }) },
    setTimeout(fn, ms = 0) { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
    performance: { now: () => 10 },
    Math,
    document: { createElement: () => element() },
  };
  for (const file of ['GardenPractice.js', 'WordGames.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context, { filename: file });
  }
  const runTimers = (ms) => {
    const due = [...timers.entries()].filter(([, timer]) => timer.ms === ms);
    due.forEach(([id, timer]) => { timers.delete(id); timer.fn(); });
  };
  return { ns, stage, root, timers, runTimers, policyCalls, context };
}

const word = (id, display, extra = {}) => ({ id, display, audioPath: `${id}.mp3`, ...extra });

test('word pools remove locked, untaught, prerequisite-blocked, and blocked duplicate displays before planning', () => {
  const { ns, stage, policyCalls } = runtime({ plan: (_ctx, items) => items });
  const allowed = word('allowed', 'بَتَ');
  const second = word('second', 'تَبَ');
  const blockedDuplicate = word('blocked-duplicate', 'تَبَ', { locked: true });
  const blocked = [
    word('untaught', 'ثَبَ', { taught: false }),
    word('is-untaught', 'جَبَ', { isTaught: false }),
    word('locked', 'حَبَ', { locked: true }),
    word('unlocked-false', 'خَبَ', { unlocked: false }),
    word('prerequisite', 'دَبَ', { prerequisiteWorldIds: ['earlier'] }),
    blockedDuplicate,
  ];
  const game = new ns.GardenPractice.ListenFind({ stage, worldId: 'current', completedWorldIds: [], items: [allowed, second, ...blocked],
    canListen: () => true, say: () => true, cancel() {} });
  const planned = policyCalls.find(([name]) => name === 'plan')[1];
  assert.deepEqual(JSON.parse(JSON.stringify(planned)), ['allowed']);
  assert.equal(game.queue.some((item) => blocked.includes(item)), false);
  game.destroy();
});

test('Twin Crown keeps the joined word intact and shows the relevant friend preview before a choice', () => {
  const { ns, stage, root } = runtime();
  root.groups['.wd-card'] = [element(0), element(1)];
  const target = word('crowned', 'رَبَّ');
  const game = new ns.GardenPractice.TwinCrown({ stage, items: [target], say: () => true, cancel() {} });
  assert.match(root.innerHTML, /class="wd-crown-stage"/);
  assert.match(root.innerHTML, /class="wd-twins is-preview"/);
  assert.match(root.innerHTML, /class="wd-preview"/);
  assert.match(root.innerHTML, new RegExp(`class="wd-reference"[^>]*>${target.display}`));
  assert.equal(game.offered.length, 2);
  game.destroy();
});

test('a helper plan cannot restore a forbidden record or produce an empty playable round', () => {
  const forbidden = word('locked', 'بَتَ', { locked: true });
  const { ns, stage } = runtime({ plan: () => [forbidden] });
  let cancelled = 0;
  const game = new ns.GardenPractice.ListenFind({ stage, items: [word('a', 'بَتَ'), word('b', 'تَبَ')],
    say: () => true, cancel() { cancelled += 1; } });
  assert.deepEqual(JSON.parse(JSON.stringify(game.queue)), []);
  assert.equal(cancelled, 1);
});

test('one real choice is unavailable, and a false audio result reveals the listening reference', () => {
  const one = word('only', 'بَتَ');
  const { ns, stage, root } = runtime({ promptMode: 'listen', say: () => false });
  let cancelled = 0;
  new ns.GardenPractice.ListenFind({ stage, items: [one], canListen: () => true, cancel() { cancelled += 1; } });
  assert.equal(cancelled, 1);

  const reference = element(); reference.hidden = true;
  root.refs['.wd-reference'] = reference; root.refs['.wd-ear'] = element(); root.groups['.wd-card'] = [element(0), element(1)];
  const game = new ns.GardenPractice.ListenFind({ stage, items: [word('a', 'بَتَ'), word('b', 'تَبَ')], canListen: () => true, say: () => false, cancel() {} });
  game.say(game.target);
  assert.equal(game.heard, false);
  assert.equal(game.answerReady, true);
  assert.equal(reference.hidden, false);
  game.destroy();
});

test('ListenFind ignores pre-prompt guesses, consumes rejected playback, reveals the reference, and treats replay as help', async () => {
  let rejectAudio;
  const { ns, stage, root } = runtime({ promptMode: 'listen', say: () => new Promise((_resolve, reject) => { rejectAudio = reject; }) });
  const a = word('a', 'بَتَ'), b = word('b', 'تَبَ');
  const refs = element(); refs.hidden = true;
  const ear = element();
  const cards = [element(0), element(1)];
  root.refs['.wd-reference'] = refs; root.refs['.wd-ear'] = ear; root.groups['.wd-card'] = cards;
  const outcomes = [];
  const game = new ns.GardenPractice.ListenFind({ stage, items: [a, b], canListen: () => true,
    say: () => new Promise((_resolve, reject) => { rejectAudio = reject; }), reportOutcome: (outcome) => outcomes.push(outcome), cancel() {} });
  const oldToken = game.roundToken;
  game.pick(0, cards[0], oldToken, game.offered);
  assert.equal(outcomes.length, 0, 'cards are inert before verified sound or reference');
  const pending = game.say(game.target);
  rejectAudio(new Error('audio unavailable'));
  await pending;
  assert.equal(refs.hidden, false);
  assert.equal(game.answerReady, true);
  game.replayPrompt();
  assert.equal(game.missed, true);
  assert.equal(refs.hidden, false);
  game.pick(game.offered.indexOf(game.target.display), cards[game.offered.indexOf(game.target.display)], game.roundToken, game.offered);
  assert.equal(outcomes.at(-1).assisted, true);
  assert.equal(outcomes.at(-1).evidence, 'supported_visible_matching');
  game.destroy();
});

test('a playback timeout reveals ListenFind reference and a stale audio success cannot qualify the next round', async () => {
  let resolveAudio;
  const { ns, stage, root, runTimers } = runtime({ promptMode: 'listen' });
  const refs = element(); refs.hidden = true;
  root.refs['.wd-reference'] = refs; root.refs['.wd-ear'] = element(); root.groups['.wd-card'] = [element(0), element(1)];
  const game = new ns.GardenPractice.ListenFind({ stage, items: [word('a', 'بَتَ'), word('b', 'تَبَ')], canListen: () => true,
    say: () => new Promise((resolve) => { resolveAudio = resolve; }), cancel() {} });
  const firstToken = game.roundToken;
  const pending = game.say(game.target);
  game.round += 1;
  game.next();
  resolveAudio(true);
  await pending;
  assert.notEqual(game.roundToken, firstToken);
  assert.equal(game.heard, false);
  const timeoutPromise = game.say(game.target);
  runTimers(5000);
  await timeoutPromise;
  assert.equal(refs.hidden, false);
  assert.equal(game.heard, false);
  game.destroy();
});

test('WordGap offers only existing NFC clusters, prefers matching marks, and preserves the full joined word', () => {
  const target = word('target', 'بَّتَ');
  const sameMark = word('same-mark', 'ثَّجُ');
  const otherMarks = word('other-marks', 'حُخْ');
  const items = [target, sameMark, otherMarks];
  const { ns, stage, root } = runtime();
  root.refs['.wd-ear'] = element(); root.refs['.wd-hole'] = element(); root.refs['.wd-gapword'] = element();
  root.groups['.wd-piece'] = [element(0), element(1)];
  const game = new ns.GardenPractice.WordGap({ stage, items, say: () => true, cancel() {} });
  const actual = new Set(items.flatMap((item) => ns.WordGames.clusters(item.display)).map((cluster) => cluster.normalize('NFC')));
  assert.ok(game.choiceRecords.every((option) => actual.has(option.display)));
  const sourceCluster = ns.WordGames.clusters(game.target.display)[game.gapIndex];
  const marks = sourceCluster.slice(1).normalize('NFC');
  const nonAnswer = game.choiceRecords.find((option) => option.display !== sourceCluster.normalize('NFC'));
  const availableSameMarks = [...actual].some((cluster) => cluster !== sourceCluster && ns.WordGames.clusters(cluster)[0]?.slice(1).normalize('NFC') === marks);
  if (availableSameMarks) assert.equal(ns.WordGames.clusters(nonAnswer.display)[0].slice(1).normalize('NFC'), marks);
  const answerIndex = game.offered.findIndex((display) => display.normalize('NFC') === sourceCluster.normalize('NFC'));
  const piece = root.groups['.wd-piece'][answerIndex];
  const outcomes = [];
  game.ctx.reportOutcome = (outcome) => outcomes.push(outcome);
  game.pick(answerIndex, piece);
  assert.equal(root.refs['.wd-gapword'].innerHTML, `<button type="button" class="wd-whole" aria-label="Hear completed word ${target.display.normalize('NFC')}"><span data-fit-ink dir="rtl" lang="ar">${target.display.normalize('NFC')}</span></button>`);
  assert.equal(outcomes[0].itemId, 'target');
  assert.ok(outcomes[0].choiceIds.every((id) => ['target', 'same-mark', 'other-marks'].includes(id)));
  game.destroy();
});

test('WordGap never makes tatweel or Quran punctuation a gap, while Arabic letter gaps remain available', () => {
  const target = word('malik', 'مَـٰلِكِ');
  const companion = word('companion', 'مَلِكٌ');
  const other = word('other', 'تَكِتَ');
  const pool = [target, companion, other];
  const { ns, stage, root } = runtime();
  root.refs['.wd-ear'] = element(); root.refs['.wd-hole'] = element(); root.refs['.wd-gapword'] = element();
  root.groups['.wd-piece'] = [element(0), element(1)];
  const candidates = ns.WordGames.gapCandidates(target, pool);
  assert.ok(candidates.length > 0);
  const isArabicLetter = (char) => /^\p{Letter}$/u.test(char) && /\p{Script=Arabic}/u.test(char);
  for (const candidate of candidates) {
    const base = ns.WordGames.clusters(target.display)[candidate.index][0];
    assert.notEqual(base, 'ـ');
    assert.equal(isArabicLetter(base), true);
  }
  const alifWord = word('alif', 'اَتَ');
  assert.ok(ns.WordGames.gapCandidates(alifWord, [...pool, alifWord]).some((candidate) => ns.WordGames.clusters(alifWord.display)[candidate.index][0] === 'ا'));

  const game = new ns.GardenPractice.WordGap({ stage, items: pool, say: () => true, cancel() {} });
  const selected = ns.WordGames.clusters(game.target.display)[game.gapIndex][0];
  assert.notEqual(selected, 'ـ');
  assert.equal(isArabicLetter(selected), true);
  game.destroy();
});

test('WordGap touch drag accepts only the gap and returns false outside; cancellation never answers', () => {
  const { ns, stage, root } = runtime();
  const hole = element(), piece = element(0);
  root.refs['.wd-ear'] = element(); root.refs['.wd-hole'] = hole; root.refs['.wd-gapword'] = element();
  root.groups['.wd-piece'] = [piece, element(1)];
  const game = new ns.GardenPractice.WordGap({ stage, items: [word('a', 'بَتَ'), word('b', 'تَبَ')], say: () => true, cancel() {} });
  const picks = [];
  game.pick = (i) => { picks.push(i); return true; };
  const outside = ns.GardenPractice.draggable(piece, { enabled: () => true, drop: () => false });
  piece.dispatch('pointerdown', { pointerId: 4, pointerType: 'touch', isPrimary: true, clientX: 15, clientY: 15 });
  piece.dispatch('pointermove', { pointerId: 4, isPrimary: true, clientX: 40, clientY: 40 });
  piece.dispatch('pointercancel', { pointerId: 4 });
  assert.deepEqual(picks, []);
  outside();
  game.destroy();
  assert.equal(game.dragResets.length, 0);
});

test('old round handlers and delayed callbacks cannot report or advance the current round', () => {
  const { ns, stage, root, timers } = runtime();
  const a = word('a', 'بَتَ'), b = word('b', 'تَبَ'), c = word('c', 'ثَبَ');
  const cards = [element(0), element(1)];
  root.groups['.wd-card'] = cards;
  root.refs['.wd-ear'] = element(); root.refs['.wd-reference'] = element();
  const outcomes = [];
  const game = new ns.GardenPractice.ListenFind({ stage, items: [a, b, c], say: () => true, reportOutcome: (outcome) => outcomes.push(outcome), cancel() {} });
  const oldHandler = cards[0];
  const oldToken = game.roundToken, oldChoices = game.offered;
  game.round += 1;
  game.next();
  const currentToken = game.roundToken;
  game.pick(0, oldHandler, oldToken, oldChoices);
  assert.equal(outcomes.length, 0);
  assert.notEqual(game.roundToken, oldToken);
  assert.ok([...timers.values()].length > 0);
  game.destroy();
  assert.equal(game.timers.length, 0);
  assert.ok(currentToken > oldToken);
});

test('canonical cluster identity composes and reorders Arabic marks', () => {
  const { ns } = runtime();
  const reordered = 'بَّ';
  assert.equal(ns.WordGames.clusters(reordered).join(''), reordered.normalize('NFC'));
  assert.equal(ns.WordGames.strip('بَّ').normalize('NFC'), 'بت'.replace('ت', 'ب').slice(0, 1));
});

test('each word game holds a correct board until explicit continuation, then finishes once', () => {
  const cases = [
    {
      name: 'TwinCrown',
      items: [word('crown', 'رَبَّ')],
      setup(root) { root.groups['.wd-card'] = [element(0), element(1)]; },
      create(ns, stage, items, outcomes, done) { return new ns.GardenPractice.TwinCrown({ stage, items, say: () => true, reportOutcome: (value) => outcomes.push(value), done, cancel() {} }); },
      answer(game, root) { const i = game.offered.findIndex((choice) => choice.normalize('NFC') === game.target.display.normalize('NFC')); root.groups['.wd-card'][i].dispatch('click'); },
      answerGroup: '.wd-card',
    },
    {
      name: 'ListenFind',
      items: [word('listen-a', 'بَتَ'), word('listen-b', 'تَبَ')],
      setup(root) { root.refs['.wd-ear'] = element(); root.refs['.wd-reference'] = element(); root.groups['.wd-card'] = [element(0), element(1)]; },
      create(ns, stage, items, outcomes, done) { return new ns.GardenPractice.ListenFind({ stage, items, say: () => true, reportOutcome: (value) => outcomes.push(value), done, cancel() {} }); },
      answer(game, root) { const i = game.choiceRecords.findIndex((choice) => choice.id === game.target.id); root.groups['.wd-card'][i].dispatch('click'); },
      answerGroup: '.wd-card',
    },
    {
      name: 'WordGap',
      items: [word('gap-a', 'بَتَ'), word('gap-b', 'تَبَ')],
      setup(root) { root.refs['.wd-ear'] = element(); root.refs['.wd-hole'] = element(); root.refs['.wd-gapword'] = element(); root.groups['.wd-piece'] = [element(0), element(1)]; },
      create(ns, stage, items, outcomes, done) { return new ns.GardenPractice.WordGap({ stage, items, say: () => true, reportOutcome: (value) => outcomes.push(value), done, cancel() {} }); },
      answer(game, root, ns) { const cluster = ns.WordGames.clusters(game.target.display)[game.gapIndex].normalize('NFC'); const i = game.choiceRecords.findIndex((choice) => choice.display.normalize('NFC') === cluster); root.groups['.wd-piece'][i].dispatch('click'); },
      answerGroup: '.wd-piece',
    },
  ];

  for (const scenario of cases) {
    const { ns, stage, root, timers, runTimers } = runtime({ plan: (_ctx, items) => items.slice(0, 1) });
    scenario.setup(root);
    const next = element(); next.hidden = true; root.refs['.wd-next'] = next;
    const outcomes = []; let done = 0;
    const game = scenario.create(ns, stage, scenario.items, outcomes, () => { done += 1; });
    const target = game.target;
    const token = game.roundToken;
    const totalRounds = game.queue.length;
    assert.ok(totalRounds >= 1, `${scenario.name} has a playable round`);
    scenario.answer(game, root, ns);
    assert.equal(outcomes.length, 1, `${scenario.name} reports the answer once`);
    assert.equal(game.awaitingContinue, true, `${scenario.name} enters its hold state`);
    assert.equal(next.hidden, false, `${scenario.name} reveals its continuation control`);
    assert.equal(next.focused, true, `${scenario.name} focuses the continuation control`);
    assert.equal(root.groups[scenario.answerGroup][0].disabled, true, `${scenario.name} disables answered controls`);
    assert.equal(done, 0);

    // Success feedback and speech timers may settle, but they must leave the
    // completed word and its single outcome in place until the learner acts.
    for (const ms of [500, 600, 900, 1600, 2800, 3200]) runTimers(ms);
    assert.equal(game.target, target, `${scenario.name} keeps the successful word visible`);
    assert.equal(game.round, 1, `${scenario.name} does not advance on a timer`);
    assert.equal(outcomes.length, 1);
    game.replayPrompt?.();
    assert.equal(outcomes.length, 1, `${scenario.name} replay does not create another outcome`);

    game.continueRound(token);
    assert.equal(done, 1, `${scenario.name} completes immediately on its last continuation`);
    game.continueRound(token);
    next.onclick({ detail: 0 });
    assert.equal(done, 1, `${scenario.name} calls done only once`);
    game.destroy();
    assert.equal(game.current(token), false, `${scenario.name} invalidates the old round on destroy`);
    assert.equal(timers.size, 0);
  }
});

test('keyboard continuation moves focus to the next ListenFind answer and rejects the old token', () => {
  const { ns, stage, root } = runtime({ plan: (_ctx, items) => items.slice(0, 2) });
  const cards = [element(0), element(1)];
  root.refs['.wd-next'] = element(); root.refs['.wd-ear'] = element(); root.refs['.wd-reference'] = element();
  root.groups['.wd-card'] = cards;
  const game = new ns.GardenPractice.ListenFind({ stage, items: [word('a', 'بَتَ'), word('b', 'تَبَ'), word('c', 'ثَبَ')], say: () => true, cancel() {} });
  const firstToken = game.roundToken;
  const firstAnswer = game.choiceRecords.findIndex((choice) => choice.id === game.target.id);
  cards[firstAnswer].dispatch('click');
  game.continueRound(firstToken, { keyboard: true });
  assert.notEqual(game.roundToken, firstToken);
  const currentToken = game.roundToken;
  game.continueRound(firstToken, { keyboard: true });
  assert.equal(game.roundToken, currentToken, 'a stale token cannot continue the new word');
  assert.ok(cards.some((card) => card.focused), 'keyboard continuation focuses an answer for the next word');
  game.destroy();
});

test('each wrong word choice is consumed once, then a correct choice stays assisted', () => {
  const cases = [
    {
      name: 'TwinCrown', items: [word('crown', 'رَبَّ'), word('crown-2', 'تَبَّ')],
      setup(root) { root.groups['.wd-card'] = [element(0), element(1)]; },
      create(ns, stage, items, outcomes, say, sfx) { return new ns.GardenPractice.TwinCrown({ stage, items, reportOutcome: (value) => outcomes.push(value), say, sfx, cancel() {} }); },
      group: '.wd-card',
      wrong(game) { return game.offered.findIndex((choice) => choice.normalize('NFC') !== game.target.display.normalize('NFC')); },
      correct(game) { return game.offered.findIndex((choice) => choice.normalize('NFC') === game.target.display.normalize('NFC')); },
      skill: 'syllable',
    },
    {
      name: 'ListenFind', items: [word('listen-a', 'بَتَ'), word('listen-b', 'تَبَ'), word('listen-c', 'ثَبَ')],
      setup(root) { root.refs['.wd-ear'] = element(); root.refs['.wd-reference'] = element(); root.groups['.wd-card'] = [element(0), element(1)]; },
      create(ns, stage, items, outcomes, say, sfx) { return new ns.GardenPractice.ListenFind({ stage, items, reportOutcome: (value) => outcomes.push(value), say, sfx, cancel() {} }); },
      group: '.wd-card',
      wrong(game) { return game.choiceRecords.findIndex((choice) => choice.id !== game.target.id); },
      correct(game) { return game.choiceRecords.findIndex((choice) => choice.id === game.target.id); },
      skill: 'word-reading',
    },
    {
      name: 'WordGap', items: [word('gap-a', 'بَتَ'), word('gap-b', 'تَبَ'), word('gap-c', 'ثَبَ')],
      setup(root) { root.refs['.wd-ear'] = element(); root.refs['.wd-hole'] = element(); root.refs['.wd-gapword'] = element(); root.groups['.wd-piece'] = [element(0), element(1)]; },
      create(ns, stage, items, outcomes, say, sfx) { return new ns.GardenPractice.WordGap({ stage, items, reportOutcome: (value) => outcomes.push(value), say, sfx, cancel() {} }); },
      group: '.wd-piece',
      wrong(game, ns) { const answer = game.choiceRecords.findIndex((choice) => choice.display.normalize('NFC') === ns.WordGames.clusters(game.target.display)[game.gapIndex].normalize('NFC')); return answer === 0 ? 1 : 0; },
      correct(game, ns) { return game.choiceRecords.findIndex((choice) => choice.display.normalize('NFC') === ns.WordGames.clusters(game.target.display)[game.gapIndex].normalize('NFC')); },
      skill: 'word-reading',
    },
  ];

  for (const scenario of cases) {
    const { ns, stage, root, timers, runTimers } = runtime({ promptMode: 'listen', plan: (_ctx, items) => items.slice(0, 2) });
    scenario.setup(root);
    let speech = 0;
    const sfx = [];
    const say = () => { speech += 1; return true; };
    const outcomes = [];
    const game = scenario.create(ns, stage, scenario.items, outcomes, say, (name) => sfx.push(name));
    game.answerReady = true;
    runTimers(350);
    const cards = root.groups[scenario.group];
    const rejectedIndex = scenario.wrong(game, ns);
    const rejected = cards[rejectedIndex];
    const choices = game.offered;
    const token = game.roundToken;
    rejected.dispatch('click');
    const firstSpeech = speech;
    const firstWrongSfx = sfx.filter((name) => name === 'softwrong').length;
    const firstOutcomes = outcomes.length;
    const firstTimers = timers.size;
    assert.equal(firstOutcomes, 1, `${scenario.name} reports the first rejection`);
    assert.equal(rejected.disabled, true, `${scenario.name} disables the rejected choice`);
    assert.equal(rejected.classList.contains('is-tried'), true, `${scenario.name} marks it tried`);
    assert.equal(firstWrongSfx, 1, `${scenario.name} plays one rejection sound`);

    rejected.dispatch('click');
    assert.equal(outcomes.length, firstOutcomes, `${scenario.name} retry creates no outcome`);
    assert.equal(sfx.filter((name) => name === 'softwrong').length, firstWrongSfx, `${scenario.name} retry creates no extra sound`);
    assert.equal(speech, firstSpeech, `${scenario.name} retry creates no extra speech`);
    assert.equal(timers.size, firstTimers, `${scenario.name} retry queues no delayed feedback`);

    for (const ms of [500, 600, 1600]) runTimers(ms);
    const settledSpeech = speech;
    rejected.disabled = false;
    game.pick(rejectedIndex, rejected, token, choices);
    assert.equal(outcomes.length, firstOutcomes, `${scenario.name} direct retries remain blocked by the rejected-choice guard`);
    assert.equal(sfx.filter((name) => name === 'softwrong').length, firstWrongSfx, `${scenario.name} direct retry has no extra sound`);
    assert.equal(speech, settledSpeech, `${scenario.name} direct retry has no extra speech`);
    assert.equal(timers.size, 0, `${scenario.name} direct retry queues no delayed feedback`);

    const answerIndex = scenario.correct(game, ns);
    cards[answerIndex].dispatch('click');
    assert.equal(outcomes.length, 2, `${scenario.name} accepts the correction`);
    assert.equal(outcomes[1].correct, true);
    assert.equal(outcomes[1].assisted, true, `${scenario.name} retains the hint assistance on correction`);
    assert.equal(game.awaitingContinue, true);
    game.destroy();
  }

});

test('a fresh round clears rejected choices and stale round handlers remain inert', () => {
  const { ns, stage, root } = runtime({ plan: (_ctx, items) => items.slice(0, 2) });
  root.refs['.wd-ear'] = element(); root.refs['.wd-reference'] = element();
  const cards = [element(0), element(1)];
  root.groups['.wd-card'] = cards;
  const outcomes = [];
  const game = new ns.GardenPractice.ListenFind({ stage, items: [word('a', 'بَتَ'), word('b', 'تَبَ'), word('c', 'ثَبَ')],
    reportOutcome: (value) => outcomes.push(value), say: () => true, cancel() {} });
  game.answerReady = true;
  const oldToken = game.roundToken;
  const oldChoices = game.offered;
  const wrongIndex = game.choiceRecords.findIndex((choice) => choice.id !== game.target.id);
  const rejectedButton = cards[wrongIndex];
  game.pick(wrongIndex, rejectedButton, oldToken, oldChoices);
  assert.equal(outcomes.length, 1);
  assert.equal(game.missed, true);

  game.round += 1;
  const freshCards = [element(0), element(1)];
  root.groups['.wd-card'] = freshCards;
  game.next();
  const newToken = game.roundToken;
  assert.notEqual(newToken, oldToken);
  assert.equal(game.missed, false, 'beginRound resets rejection assistance');
  game.answerReady = true;
  assert.equal(game.validPick(newToken, wrongIndex, freshCards[wrongIndex], game.offered), true, 'the prior rejected index is available in the fresh board');
  game.pick(wrongIndex, rejectedButton, oldToken, oldChoices);
  assert.equal(outcomes.length, 1, 'a stale handler cannot report against the next word');
  const nextAnswer = game.choiceRecords.findIndex((choice) => choice.id === game.target.id);
  game.pick(nextAnswer, freshCards[nextAnswer], newToken, game.offered);
  assert.equal(outcomes.length, 2, 'a fresh-board answer is accepted');
  assert.equal(outcomes[1].correct, true);
  assert.equal(outcomes[1].assisted, false, 'the fresh answer does not inherit prior assistance');
  game.destroy();
});

test('WordGap drag drop rechecks eligibility after a rejected choice', () => {
  const { ns, stage, root } = runtime();
  const hole = element();
  const pieces = [element(0), element(1)];
  root.refs['.wd-ear'] = element(); root.refs['.wd-hole'] = hole; root.refs['.wd-gapword'] = element();
  root.groups['.wd-piece'] = pieces;
  const outcomes = [];
  const game = new ns.GardenPractice.WordGap({ stage, items: [word('a', 'بَتَ'), word('b', 'تَبَ')], reportOutcome: (value) => outcomes.push(value), say: () => true, cancel() {} });
  const answer = ns.WordGames.clusters(game.target.display)[game.gapIndex].normalize('NFC');
  const wrongIndex = game.choiceRecords.findIndex((choice) => choice.display.normalize('NFC') !== answer);
  const dragToHole = (piece, pointerId) => {
    piece.dispatch('pointerdown', { pointerId, pointerType: 'touch', isPrimary: true, clientX: 15, clientY: 15 });
    piece.dispatch('pointermove', { pointerId, isPrimary: true, clientX: 40, clientY: 40 });
    piece.dispatch('pointerup', { pointerId, isPrimary: true, clientX: 40, clientY: 40 });
  };
  dragToHole(pieces[wrongIndex], 21);
  assert.equal(outcomes.length, 1, 'the first drag reports one rejection');
  assert.equal(pieces[wrongIndex].disabled, true);
  dragToHole(pieces[wrongIndex], 22);
  assert.equal(outcomes.length, 1, 'a repeated drag on the consumed piece cannot answer again');
  assert.equal(outcomes[0].correct, false);
  game.destroy();
});
