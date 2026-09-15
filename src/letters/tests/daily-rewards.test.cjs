const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const source = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const key = name => `quran-trainer:letters:${name}`;
const plain = value => JSON.parse(JSON.stringify(value));

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    getItem(name) { return values.has(name) ? values.get(name) : null; },
    setItem(name, value) { values.set(name, String(value)); },
  };
}

function runtime(initial = {}) {
  const localStorage = storage(initial);
  const window = { MiftahGame: { LettersArt: {} } };
  const context = { window, localStorage };
  for (const file of ['LettersDecorations.js', 'LettersState.js', 'LettersGame.js']) {
    vm.runInNewContext(source(file), context);
  }
  return { ns: window.MiftahGame, localStorage };
}

function shell(ns, localStorage) {
  const game = Object.create(ns.LettersGame.prototype);
  game.bests = game.loadJSON(key('bests'), {});
  game.wallet = game.loadJSON(key('wallet'), { earned: 0, spent: 0 });
  game.skills = {};
  game.renderStars = () => {};
  return game;
}

test('legacy daily activity best keys pay only improvements and replays pay zero', () => {
  const { ns, localStorage } = runtime({
    [key('bests')]: JSON.stringify({ 'daily:pop': 1, 'daily:feed': 2, 'daily:burst': 1 }),
    [key('wallet')]: JSON.stringify({ earned: 0, spent: 0 }),
  });
  const game = shell(ns, localStorage);
  const play = (activity, slips) => {
    game.session = { world: { id: 'daily', games: [activity] }, gameIndex: 0, starTotal: 0 };
    const before = game.wallet.earned;
    game.finishGame(slips);
    return game.wallet.earned - before;
  };

  assert.equal(play('pop', 0), 2, 'daily:pop improves from one star to three');
  assert.equal(play('pop', 0), 0, 'daily:pop replay pays nothing');
  assert.equal(play('feed', 2), 0, 'daily:feed equal best pays nothing');
  assert.equal(play('feed', 0), 1, 'daily:feed pays only its one-star improvement');
  assert.equal(play('feed', 0), 0, 'daily:feed replay pays nothing');
  assert.equal(play('burst', 2), 1, 'daily:burst retains and improves its legacy key');
  assert.equal(play('burst', 2), 0, 'daily:burst replay pays nothing');

  assert.equal(game.wallet.earned, 4);
  assert.deepEqual(plain(game.bests), {
    'daily:pop': 3, 'daily:feed': 3, 'daily:burst': 2,
  });
  assert.deepEqual(JSON.parse(localStorage.values.get(key('bests'))), plain(game.bests));
  assert.equal(JSON.parse(localStorage.values.get(key('wallet'))).earned, 4);
});

test('daily completion stamps and rewards the island once without advancing chapters', () => {
  const rawProgress = JSON.stringify({ done: ['pack-boat'], skipped: false });
  const rawStars = JSON.stringify({ 'pack-boat': 3 });
  const { ns, localStorage } = runtime({
    [key('progress')]: rawProgress,
    [key('stars')]: rawStars,
    [key('stamps')]: JSON.stringify({ dates: [] }),
  });
  const game = Object.create(ns.LettersGame.prototype);
  game.progress = game.loadProgress();
  game.stars = game.loadStars();
  game.stamps = game.loadStamps();
  let islandRewards = 0;
  const parties = [];
  game.island = { completeStudyStep() { islandRewards += 1; } };
  game.renderParty = (stars, firstToday) => parties.push({ stars, firstToday });

  game.session = { daily: true, world: { id: 'daily', games: ['pop', 'feed'] }, starTotal: 6 };
  game.finishWorld();
  game.session = { daily: true, challenge: true, world: { id: 'daily', games: ['burst'] }, starTotal: 2 };
  game.finishWorld();

  assert.deepEqual(plain(game.progress), { done: ['pack-boat'], skipped: false });
  assert.deepEqual(plain(game.stars), { 'pack-boat': 3 });
  assert.equal(game.progress.done.includes('daily'), false);
  assert.equal(game.stamps.dates.length, 1);
  assert.equal(new Set(game.stamps.dates).size, 1);
  assert.equal(islandRewards, 1);
  assert.deepEqual(parties, [{ stars: 3, firstToday: true }, { stars: 2, firstToday: false }]);
  assert.equal(JSON.parse(localStorage.values.get(key('stamps'))).dates.length, 1);
  assert.equal(localStorage.values.get(key('progress')), rawProgress, 'chapter progress is not rewritten');
  assert.equal(localStorage.values.get(key('stars')), rawStars, 'chapter stars are not rewritten');
});

test('garden layout uses its own key and the production decoration normalizer', () => {
  const rawProgress = JSON.stringify({ done: ['pack-boat'], skipped: false });
  const { ns, localStorage } = runtime({
    [key('progress')]: rawProgress,
    [key('garden-layout')]: JSON.stringify({ version: 99, slots: ['boat', 'boat', 4, 'sticker:star', 'extra'] }),
  });
  const game = Object.create(ns.LettersGame.prototype);
  const fallback = { version: 1, slots: [null, null, null, null] };
  const layout = game.loadJSON(key('garden-layout'), fallback);
  assert.deepEqual(plain(layout), { version: 1, slots: ['boat', null, null, 'sticker:star'] });

  const available = [{ id: 'boat' }, { id: 'sticker:star' }];
  const moved = ns.LettersDecorations.place(layout, 1, 'sticker:star', available);
  assert.equal(game.saveJSON(key('garden-layout'), moved), true);
  assert.deepEqual(JSON.parse(localStorage.values.get(key('garden-layout'))), {
    version: 1, slots: ['boat', 'sticker:star', null, null],
  });
  assert.equal(localStorage.values.get(key('progress')), rawProgress);
});
