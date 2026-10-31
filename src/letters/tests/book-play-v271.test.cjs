const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classes() {
  const set = new Set();
  return { add: (...xs) => xs.forEach((x) => set.add(x)), remove: (...xs) => xs.forEach((x) => set.delete(x)),
    contains: (x) => set.has(x), toggle: (x, force) => { const on = force === undefined ? !set.has(x) : force; on ? set.add(x) : set.delete(x); return on; } };
}
function element(rect = { left: 10, top: 10, right: 110, bottom: 110, width: 100, height: 100 }) {
  const handlers = new Map();
  return { classList: classes(), dataset: {}, style: {}, disabled: false, hidden: false, isConnected: true,
    addEventListener(name, fn) { const a = handlers.get(name) || []; a.push(fn); handlers.set(name, a); },
    dispatch(name, event = {}) { for (const fn of handlers.get(name) || []) fn(event); },
    getBoundingClientRect: () => rect, querySelector: () => element(), querySelectorAll: () => [],
    insertAdjacentHTML() {}, setAttribute() {}, animate() {}, closest: () => null };
}
function runtime({ level = 0, letters = ['ب', 'ت', 'ث'], pictures } = {}) {
  const deferred = [];
  const friends = { FRIENDS: Object.fromEntries(letters.map((c) => [c, true])), art: () => '<svg></svg>',
    item: (c) => ({ id: c, display: c, speak: c }), get: (c) => ({ en: c, word: c, call: 'friend-call' }), look: () => 'plain' };
  const allPictures = pictures || letters.flatMap((c) => [{ id: `${c}-one`, char: c, word: c, en: `${c} one` }, { id: `${c}-two`, char: c, word: `${c}2`, en: `${c} two` }]);
  const ns = { LetterFriends: friends,
    PictureWords: { LIST: allPictures, byChar: (c) => allPictures.filter((p) => p.char === c), item: (p) => p, art: () => '<svg></svg>' },
    PracticeLearning: { profile: () => ({ choiceCount: 2, promptMode: 'match' }), level: () => level,
      plan: (_ctx, items, _skill, count) => items.slice(0, count), orderChars: (_ctx, chars, _skill, count) => chars.slice(0, count) },
  };
  const context = { window: { MiftahGame: ns }, Math, setTimeout: (fn, ms) => { const timer = { fn, ms, cleared: false }; deferred.push(timer); return timer; },
    clearTimeout: (timer) => { if (timer) timer.cleared = true; }, document: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'BookGames.js'), 'utf8'), context, { filename: 'BookGames.js' });
  return { ns, deferred, allPictures };
}
function stage(root) { return { innerHTML: '', firstElementChild: root }; }

test('SoundSort drag accepts only a nearby basket, keeps basket taps, and guards the arrival to one current card', () => {
  const { ns, deferred } = runtime({ letters: ['ب', 'ت'], pictures: [
    { id: 'b', char: 'ب', word: 'b', en: 'bee' }, { id: 't', char: 'ت', word: 't', en: 'tea' },
  ] });
  const baskets = ['ب', 'ت'].map((c, i) => { const b = element({ left: i * 140, top: 200, right: i * 140 + 100, bottom: 300, width: 100, height: 100 }); b.dataset.i = String(i); b.contents = element(); b.contents.insertAdjacentHTML = (_where, html) => { b.contents.innerHTML += html; }; b.querySelector = () => b.contents; return b; });
  const slot = element(), dots = element();
  slot.querySelectorAll = () => [0, 1].filter(i => slot.innerHTML.includes('data-card-slot="'+i+'"')).map(i => { const c=element(); c.dataset.cardSlot=String(i); return c; });
  const root = element(); root.querySelector = (s) => s === '.bk-card-slot' ? slot : s === '.bk-dots-slot' ? dots : null;
  root.querySelectorAll = (s) => s === '.bk-basket' ? baskets : [];
  const drags = []; ns.GardenPractice.draggable = (_el, options) => { drags.push(options); return () => {}; };
  const arrivals = []; const originalArt = ns.PictureWords.art; ns.PictureWords.art = (p) => { arrivals.push(p.id); return '<svg></svg>'; };
  const game = new ns.GardenPractice.SoundSort({ stage: stage(root), items: [{ id: 'b', display: 'ب' }, { id: 't', display: 'ت' }],
    reducedMotion: () => true, say: () => true, reportOutcome() {}, cancel() {} });
  assert.equal(drags.length, 2);
  const drag = drags[0];
  assert.equal(drag.drop(500, 500), false, 'outside releases return without an answer');
  const targetBasket = game.baskets.indexOf(game.card.char);
  const wrongBasket = game.baskets.findIndex((c) => c !== game.card.char);
  assert.notEqual(game.baskets[wrongBasket], game.card.char);
  game.drop(wrongBasket, baskets[wrongBasket]);
  assert.equal(game.missed, true, 'basket taps still submit their selected answer');
  assert.ok(baskets[targetBasket].classList.contains('is-hint'), 'basket taps retain the gentle hint path');
  assert.equal(drag.drop(targetBasket * 140 + 100, 250), true, 'the 24px basket margin is inclusive');
  assert.equal(game.busy, true);
  assert.equal(drag.drop(100, 250), false, 'the same picture cannot arrive twice');
  const arrival = deferred.find((t) => t.ms === 0 && !t.cleared); arrival.fn();
  assert.match(baskets[targetBasket].contents.innerHTML, /<i>/, 'the correct basket receives the picture once during flight arrival');
  assert.equal(arrivals.filter((id) => id === game.cards[0].id).length, 2, 'the picture art was rendered once on its card and once on arrival');
  game.destroy(); ns.PictureWords.art = originalArt;
});

test('FriendShapes accepts a piece within the missing-friend margin and leaves its button path active', () => {
  const { ns } = runtime({ letters: ['ب', 'ت'] });
  const hole = element({ left: 100, top: 100, right: 200, bottom: 200, width: 100, height: 100 });
  const pieces = ['ب', 'ت'].map((c, i) => { const b = element(); b.dataset.i = String(i); return b; });
  const root = element(); root.querySelector = (s) => s === '.bk-missing' ? hole : null; root.querySelectorAll = (s) => s === '.bk-piece' ? pieces : [];
  const drags = []; ns.GardenPractice.draggable = (_el, options) => { drags.push(options); return () => {}; };
  const game = new ns.GardenPractice.FriendShapes({ stage: stage(root), items: [{ id: 'b', display: 'ب' }, { id: 't', display: 'ت' }], say: () => true, sfx() {}, cancel() {} });
  assert.equal(drags.length, 2);
  const wrongIndex = game.offered.findIndex((c) => c !== game.target);
  assert.equal(game.pick(wrongIndex, pieces[wrongIndex]), false, 'a wrong tap returns gently');
  assert.equal(game.missed, true);
  const rightIndex = game.offered.indexOf(game.target);
  assert.equal(drags[rightIndex].drop(76, 150), true, 'drop is accepted within 24px of the silhouette');
  assert.equal(drags[rightIndex].drop(76, 150), false, 'a used piece cannot answer again');
  game.destroy();
});

test('PeekFlaps ignores a late failed speech result from a previous door round', async () => {
  const { ns } = runtime({ letters: ['ب', 'ت'], pictures: [
    { id: 'b', char: 'ب', word: 'bee', en: 'bee' }, { id: 't', char: 'ت', word: 'tea', en: 'tea' },
  ] });
  const root = element(), ask = element(); ask.hidden = true;
  root.querySelector = (s) => s === '.bk-ask' ? ask : null;
  root.querySelectorAll = () => [];
  let rejectSpeech;
  const game = new ns.GardenPractice.PeekFlaps({ stage: stage(root), items: [{ id: 'b', display: 'ب' }, { id: 't', display: 'ت' }],
    canListen: () => true, say: () => new Promise((_resolve, reject) => { rejectSpeech = reject; }), cancel() {} });
  const oldRound = game.round, oldToken = game.promptToken, oldWord = game.word;
  game.speakPrompt(oldWord, oldRound, oldToken);
  game.round += 1; game.word = { id: 'new', display: 'new' }; game.setPrompt(game.word); game.missed = false; ask.hidden = true;
  rejectSpeech(new Error('audio failed'));
  await Promise.resolve(); await Promise.resolve();
  assert.equal(game.missed, false);
  assert.equal(ask.hidden, true);
  game.replayPrompt();
  assert.equal(game.missed, true, 'replay or a current speech failure marks the round assisted');
  assert.equal(ask.hidden, false);
  game.destroy();
});

test('HoopoeTrip keeps two taught friends available after earlier friends join the parade', () => {
  const letters = ['ب', 'ت', 'ث', 'ه'];
  const { ns } = runtime({ letters });
  const root = element(); root.querySelectorAll = () => [];
  const game = new ns.GardenPractice.HoopoeTrip({ stage: stage(root), items: letters.map((display) => ({ id: display, display })), say: () => true, cancel() {} });
  const target = game.known.find((c) => c !== 'ت') || game.known[0];
  game.stops = [target]; game.page = 0; game.parade = ['ه', ...game.known.filter((c) => c !== target)];
  game.show();
  assert.ok(game.offered.includes(target));
  assert.ok(game.offered.length >= 2);
  assert.ok(game.offered.every((c) => game.known.includes(c)));
  game.destroy();
});

test('BusyMarket uses only taught goods within the level cap and manual lens changes invalidate auto-skip', () => {
  const known = ['ب', 'ت', 'ث', 'ج', 'ه'];
  const pictures = [...known, 'خ', 'د'].flatMap((c) => [{ id: `${c}-a`, char: c, en: `${c} a` }, { id: `${c}-b`, char: c, en: `${c} b` }]);
  const { ns, deferred } = runtime({ letters: known, pictures });
  const lens = element(), bag = element(), goods = pictures.map((_p, i) => { const b = element(); b.dataset.i = String(i); return b; });
  const root = element(); root.querySelector = (s) => s === '.bk-lens' ? lens : s === '.bk-bag' ? bag : null;
  root.querySelectorAll = (s) => s === '.bk-good' ? goods : [];
  let reports = 0, done = 0;
  const game = new ns.GardenPractice.BusyMarket({ stage: stage(root), items: known.map((display) => ({ id: display, display })), known: [],
    say: () => true, reportOutcome: () => { reports += 1; }, done: () => { done += 1; }, cancel() {} });
  assert.ok(game.goods.length <= 6);
  assert.ok(game.goods.every((p) => known.includes(p.char)));
  assert.ok(game.lenses.every((c) => game.goods.some((p) => p.char === c)));
  const oldLens = game.lenses[game.lens];
  const target = game.goods.findIndex((p) => p.char === oldLens);
  game.tap(target, goods[target]);
  assert.equal(reports, 0, 'free exploration does not report mastery');
  game.goods.forEach((p, i) => { if (p.char === oldLens && !game.found.has(p.id)) game.tap(i, goods[i]); });
  const autoSkip = deferred.filter((t) => t.ms === 1400 && !t.cleared).at(-1);
  assert.ok(autoSkip, 'finishing one lens schedules its skip');
  game.misses = 3;
  game.nextLens(true);
  assert.equal(game.misses, 0, 'each lens starts with a fresh hint counter');
  const manualLens = game.lenses[game.lens];
  autoSkip.fn();
  assert.equal(game.lenses[game.lens], manualLens, 'an old completion timer cannot override the child’s lens choice');
  assert.ok(game.found.has(game.goods[target].id), 'found pictures remain in the shared bag after lens changes');
  assert.equal(done, 0);
  game.destroy();

  const advanced = runtime({ level: 2, letters: ['ب', 'ت', 'ث', 'ج', 'ه', 'خ', 'د'] });
  const advancedRoot = element(), advancedLens = element(), advancedBag = element();
  advancedRoot.querySelector = (s) => s === '.bk-lens' ? advancedLens : s === '.bk-bag' ? advancedBag : null;
  advancedRoot.querySelectorAll = () => [];
  const experienced = new advanced.ns.GardenPractice.BusyMarket({ stage: stage(advancedRoot), items: ['ب', 'ت', 'ث', 'ج', 'ه', 'خ', 'د'].map((display) => ({ id: display, display })), say: () => true, cancel() {} });
  assert.ok(experienced.goods.length <= 12);
  assert.ok(experienced.goods.every((p) => ['ب', 'ت', 'ث', 'ج', 'ه', 'خ', 'د'].includes(p.char)));
  experienced.destroy();
});

test('Book games cannot reintroduce explicitly locked letters through fallback ordering', () => {
  const letters = ['ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د'];
  const { ns } = runtime({ letters });
  const root = element(), lens = element(), bag = element();
  root.querySelector = (s) => s === '.bk-lens' ? lens : s === '.bk-bag' ? bag : null;
  const items = letters.map((display) => ({ id: display, display }));
  items[2].taught = false; items[3].isTaught = false; items[4].locked = true;
  items[5].unlocked = false; items[6].prerequisiteWorldIds = ['unreached'];
  const game = new ns.GardenPractice.BusyMarket({ stage: stage(root), items, known: [{ id: 'ث', display: 'ث' }], completedWorldIds: [], say: () => true });
  assert.ok(game.goods.length > 0);
  assert.ok(game.goods.every((p) => ['ب', 'ت'].includes(p.char)));
  game.destroy();
});

test('The market holds free play after the final find and Finish completes only once', () => {
  const { ns, deferred } = runtime();
  const root = element(), lens = element(), bag = element(), finish = element();
  root.querySelector = (s) => s === '.bk-lens' ? lens : s === '.bk-bag' ? bag : s === '.bk-market-finish' ? finish : null;
  let done = 0;
  const game = new ns.GardenPractice.BusyMarket({ stage: stage(root), items: ['ب', 'ت', 'ث'].map((display) => ({ id: display, display })), say: () => true, done: () => done++ });
  for (let turn = 0; turn < 3; turn++) {
    game.goods.forEach((p, i) => { if (p.char === game.lenses[game.lens]) game.tap(i, element()); });
    game.nextLens(true);
  }
  game.complete(); game.nextLens(true);
  for (let at = 0; at < deferred.length; at++) if (!deferred[at].cleared) deferred[at].fn();
  assert.equal(done, 0);
  assert.equal(game.phase, 'exploring');
  assert.equal(finish.hidden, false);
  game.finish(); game.finish();
  assert.equal(done, 1);
  assert.equal(game.found.size, game.goods.length);
  assert.equal(lens.hidden, true);
  game.destroy();
});

test('Opening the correct flap still names its picture during the reveal', () => {
  const { ns, deferred } = runtime();
  const root = element();
  const spoken = [];
  const game = new ns.GardenPractice.PeekFlaps({ stage: stage(root), items: ['ب', 'ت', 'ث'].map((display) => ({ id: display, display })), say: (item) => { spoken.push(item); return true; } });
  const correct = game.offered.findIndex((item) => item.display === game.target);
  const revealed = game.hidden[correct].item;
  game.lift(correct, element());
  deferred.filter((t) => t.ms === 300).forEach((t) => t.fn());
  assert.ok(spoken.includes(revealed));
  game.destroy();
});

