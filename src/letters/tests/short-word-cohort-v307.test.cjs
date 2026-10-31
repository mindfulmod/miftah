const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const gameSource = fs.readFileSync(path.join(__dirname, '..', 'LettersGame.js'), 'utf8');
const stateSource = fs.readFileSync(path.join(__dirname, '..', 'LettersState.js'), 'utf8');
const NOW = 1_800_000_000_000;
const plain = value => JSON.parse(JSON.stringify(value));

function runtime(planner = () => []) {
  const window = { MiftahGame: {
    LettersArt: { icon: () => '<svg></svg>' },
    LettersLearning: { planRounds: planner },
  } };
  const clock = class extends Date { static now() { return NOW; } };
  vm.runInNewContext(gameSource, { window, Date: clock, console, Math, JSON, setTimeout, clearTimeout });
  const game = Object.create(window.MiftahGame.LettersGame.prototype);
  const saves = [];
  game.root = { style: { setProperty() {} } };
  game.sound = { play() {} };
  game.progress = { done: [] };
  game.loadJSON = key => key === 'quran-trainer:letters:resume' ? game.savedPlace : null;
  game.saveJSON = (key, value) => { saves.push([key, value]); if (key === 'quran-trainer:letters:resume') game.savedPlace = value; return true; };
  game.savedPlace = null;
  return { game, ns: window.MiftahGame, saves };
}

function wordsWorld(id = 'words-2') {
  const items = Array.from({ length: 8 }, (_, n) => ({
    id: `w${n + 1}`, display: `كلمة${n + 1}`,
    parts: [{ id: `p${n + 1}a`, display: 'بَ' }, { id: `p${n + 1}b`, display: 'تَ' }],
  }));
  return {
    id, hue: 20, games: ['feed', 'build', 'pop'], meet: [], catalogue: items,
    items: () => [items[6], items[2], items[5], items[0], items[4], items[1], items[7], items[3]],
  };
}

function useState(ns) {
  vm.runInNewContext(stateSource, { window: { MiftahGame: ns }, localStorage: {}, console });
}

test('unfinished words-2 uses adaptive feed targets first, deduplicates them, and fills to four', () => {
  const planned = [];
  const { game } = runtime(ctx => {
    planned.push(ctx);
    const byId = Object.fromEntries(ctx.items.map(item => [item.id, item]));
    return [{ target: { id: 'foreign', display: 'untrusted' } },
      { target: { ...byId.w6, display: 'untrusted' } },
      ...['w2', 'w6', 'w8'].map(id => ({ target: byId[id] }))];
  });
  const world = wordsWorld();
  const selected = game.introWordItems(world, world.items());
  assert.deepEqual(plain(selected.map(item => item.id)), ['w6', 'w2', 'w8', 'w7']);
  assert.equal(selected[0], world.catalogue[5], 'use the canonical item even when the planner supplies a copy');
  assert.equal(planned.length, 1);
  assert.equal(planned[0].rounds, 4);
  assert.equal(planned[0].activity, 'feed');
});

test('Sprout keeps the unfinished word cohort to three adaptive targets', () => {
  const { game } = runtime(ctx => ['w3', 'w4', 'w5'].map(id => ({ target: ctx.items.find(item => item.id === id) })));
  game.sprout = true;
  const world = wordsWorld();
  assert.deepEqual(plain(game.introWordItems(world, world.items()).map(item => item.id)), ['w3', 'w4', 'w5']);
});

test('other worlds and completed words-2 replay return the original item array', () => {
  const { game } = runtime(() => { throw new Error('planner should not run'); });
  const world = wordsWorld('words-3');
  let supplied = world.items();
  assert.equal(game.introWordItems(world, supplied), supplied);
  world.id = 'words-2';
  game.progress.done = ['words-2'];
  supplied = world.items();
  assert.equal(game.introWordItems(world, supplied), supplied);
});

test('resume normalization deduplicates word IDs and accepts only bounded strings', () => {
  const { ns } = runtime();
  useState(ns);
  const saved = ns.LettersState.normalize('resume', {
    world: 'words-2', gameIndex: 1, at: NOW,
    wordItemIds: ['w1', 'w1', 4, '', 'x'.repeat(33), 'w2', 'w3', 'w4', 'w5'],
  }, null);
  assert.deepEqual(plain(saved.wordItemIds), ['w1', 'w2', 'w3', 'w4']);
});

test('normalized rememberPlace checkpoint restores its saved cohort after current items shuffle', () => {
  const { game, ns } = runtime(ctx => ctx.items.slice(0, 4).map(item => ({ target: item })));
  useState(ns);
  const world = wordsWorld();
  game.renderMeet = () => {};
  game.startGame = () => {};
  game.startWorld(world);
  const selected = game.session.items.map(item => item.id);
  game.session.starTotal = 3;
  game.rememberPlace(game.session, 1);
  const checkpoint = ns.LettersState.normalize('resume', game.savedPlace, null);
  assert.deepEqual(plain(checkpoint.wordItemIds), plain(selected));
  assert.equal(checkpoint.gameIndex, 1);
  game.savedPlace = checkpoint;
  world.items = () => world.catalogue.slice().reverse();
  game.startGame = () => {};
  game.startWorld(world);
  assert.deepEqual(plain(game.session.items.map(item => item.id)), plain(selected));
  assert.equal(game.session.starTotal, 3);
  assert.equal(game.session.gameIndex, 1);
  assert.equal(game.session.guidedWords, true);
});

test('invalid and cross-world word checkpoints keep step and stars without reward writes', () => {
  for (const ids of [['missing'], ['w4', 'foreign']]) {
    const { game, saves } = runtime(() => []);
    const world = wordsWorld();
    game.savedPlace = { world: 'words-2', gameIndex: 2, starTotal: 5, at: NOW - 1000, wordItemIds: ids };
    game.startGame = () => {};
    game.earnStars = () => { throw new Error('resume must not pay rewards'); };
    game.saveStars = () => { throw new Error('resume must not write stars'); };
    game.startWorld(world);
    assert.deepEqual(plain(game.session.items.map(item => item.id)), ['w7', 'w3', 'w6', 'w1']);
    assert.equal(game.session.gameIndex, 2);
    assert.equal(game.session.starTotal, 5);
    assert.deepEqual(saves, []);
  }
});

test('legacy checkpoint resumes the bounded cohort and marks guidance only for the unfinished word lesson', () => {
  const { game, saves } = runtime(() => []);
  const world = wordsWorld();
  game.savedPlace = { world: 'words-2', gameIndex: 1, starTotal: 2, at: NOW - 1000 };
  game.startGame = () => {};
  game.startWorld(world);
  assert.deepEqual(plain(game.session.items.map(item => item.id)), ['w7', 'w3', 'w6', 'w1']);
  assert.equal(game.session.guidedWords, true);
  assert.equal(game.session.starTotal, 2);
  assert.deepEqual(saves, []);

  const replay = runtime(() => []);
  replay.game.progress.done = ['words-2'];
  replay.game.startGame = () => {};
  replay.game.startWorld(world);
  assert.equal(replay.game.session.guidedWords, false);
});


test('missing-content Retry preserves a small fresh cohort or the saved canonical cohort', async () => {
  for (const resumed of [false, true]) {
    const { game, saves } = runtime(ctx => ctx.items.slice(0, 4).map(target => ({ target })));
    const world = wordsWorld();
    const catalogue = world.catalogue;
    world.catalogue = [];
    world.items = () => world.catalogue.slice().reverse();
    if (resumed) game.savedPlace = { world: world.id, gameIndex: 1, starTotal: 2, at: NOW, wordItemIds: ['w2', 'w7', 'w4', 'w1'] };
    const retry = { disabled: false };
    game.topBar = () => '';
    game.petSVG = () => '';
    game.wireTopBar = () => {};
    game.screen = () => ({ isConnected: true, querySelector: () => retry });
    game.worlds = { loadWords: async () => { world.catalogue = catalogue; } };
    const started = [];
    game.startGame = () => {
      if (!game.session.items.length) return game.renderMissingItems();
      started.push(game.session.items.map(item => item.id));
    };
    game.startWorld(world);
    assert.equal(started.length, 0);
    await retry.onclick();
    assert.deepEqual(plain(started), [resumed ? ['w2', 'w7', 'w4', 'w1'] : ['w8', 'w7', 'w6', 'w5']]);
    assert.equal(game.session.gameIndex, resumed ? 1 : 0);
    assert.equal(game.session.starTotal, resumed ? 2 : 0);
    assert.equal(saves.length, 0, 'loading data does not pay rewards or overwrite the checkpoint');
  }
});


test('a late word-content retry cannot replace a session the child has left', async () => {
  const { game, saves } = runtime();
  const world = wordsWorld();
  game.session = { world, items: [] };
  const retry = { disabled: false };
  let loaded;
  game.worlds = { loadWords: () => new Promise(resolve => { loaded = resolve; }) };
  game.topBar = () => '';
  game.petSVG = () => '';
  game.wireTopBar = () => {};
  game.screen = () => ({ isConnected: true, querySelector: () => retry });
  game.startGame = () => { throw new Error('old recovery must not start another game'); };
  game.renderMissingItems();
  const recovering = retry.onclick();
  const nextVisit = { world: { id: 'decode' }, items: [{ id: 'next-word' }] };
  game.session = nextVisit;
  loaded();
  await recovering;
  assert.equal(game.session, nextVisit);
  assert.deepEqual(game.session.items, [{ id: 'next-word' }]);
  assert.equal(saves.length, 0);
});
