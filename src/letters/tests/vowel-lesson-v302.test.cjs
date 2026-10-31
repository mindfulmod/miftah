const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const gameSource = fs.readFileSync(path.join(__dirname, '..', 'LettersGame.js'), 'utf8');
const stateSource = fs.readFileSync(path.join(__dirname, '..', 'LettersState.js'), 'utf8');
const miniSource = fs.readFileSync(path.join(__dirname, '..', 'MiniGames.js'), 'utf8');
const NOW = 1_800_000_000_000;
const plain = value => JSON.parse(JSON.stringify(value));

function runtime() {
  const window = { MiftahGame: { LettersArt: { icon: () => '<svg></svg>' } } };
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

function vowelWorld(id = 'fatha') {
  const items = [1, 2, 3, 4, 5, 6].map(n => ({ id: `v${n}`, display: `د${n}`, parts: [{ id: `d${n}`, display: 'د' }, { id: `a${n}`, display: 'َ' }] }));
  return { id, hue: 20, games: ['blend', 'trace', 'pop'], meet: [{ display: 'د2' }, { display: 'د1' }], catalogue: items, items: () => [items[4], items[1], items[0], items[2], items[3], items[5]] };
}

test('first fatha lesson puts its authored meet examples first and caps selection at four', () => {
  const { game } = runtime();
  const world = vowelWorld();
  const selected = game.introVowelItems(world, world.items());
  assert.deepEqual(plain(selected.map(item => item.id)), ['v2', 'v1', 'v5', 'v3']);
});

test('first kasra-damma lesson honors Sprout three-item cap and deduplicates meet examples', () => {
  const { game } = runtime();
  const world = vowelWorld('kasra-damma');
  world.meet = [{ display: 'د2' }, { display: 'د2' }, { display: 'د1' }];
  game.sprout = true;
  assert.deepEqual(plain(game.introVowelItems(world, world.items()).map(item => item.id)), ['v2', 'v1', 'v5']);
});

test('other worlds and completed vowel worlds keep their supplied item list intact', () => {
  const { game } = runtime();
  for (const id of ['tanween', 'fatha']) {
    const world = vowelWorld(id);
    const supplied = world.items();
    if (id === 'fatha') game.progress.done = ['fatha'];
    assert.equal(game.introVowelItems(world, supplied), supplied);
  }
});

test('resume normalization bounds and deduplicates vowel IDs while dropping invalid entries', () => {
  const window = { MiftahGame: {} };
  vm.runInNewContext(stateSource, { window, localStorage: {}, console });
  const saved = window.MiftahGame.LettersState.normalize('resume', {
    world: 'fatha', gameIndex: 1, at: NOW, vowelItemIds: ['v1', 'v1', 4, '', 'x'.repeat(33), 'v2', 'v3', 'v4', 'v5'],
  }, null);
  assert.deepEqual(plain(saved.vowelItemIds), ['v1', 'v2', 'v3', 'v4']);
});

test('Blend starts with the warmup anchors and retains every selected target without adding targets', () => {
  const window = { MiftahGame: {} };
  vm.runInNewContext(miniSource, { window, console, Math, JSON, setTimeout, clearTimeout });
  const Blend = window.MiftahGame.LettersMiniGames.blend;
  Blend.prototype.startRound = function () {};
  const pool = ['v1', 'v2', 'v3', 'v4'].map((id, i) => ({ id, parts: [{ id: `l${i}`, display: 'د' }, { id: `m${i}`, display: 'َ' }] }));
  const game = new Blend({ items: pool, rounds: 4, warmupItemIds: ['v3', 'v1'], stage: {}, say() {}, setPrompt() {} });
  assert.deepEqual(plain(game.rounds.map(round => round.target.id).slice(0, 2)), ['v3', 'v1']);
  assert.deepEqual([...game.rounds.map(round => round.target.id)].sort(), ['v1', 'v2', 'v3', 'v4']);
  assert.equal(game.rounds.length, 4);
});

test('saved vowel IDs restore the exact authored set when a reload would choose different items', () => {
  const { game } = runtime();
  const world = vowelWorld();
  game.savedPlace = { world: 'fatha', gameIndex: 1, starTotal: 3, at: NOW - 1000, vowelItemIds: ['v4', 'v2'] };
  game.startGame = () => {};
  game.renderMeet = () => { throw new Error('resume must skip the meet screen'); };
  game.startWorld(world);
  assert.deepEqual(plain(game.session.items.map(item => item.id)), ['v4', 'v2']);
  assert.equal(game.session.resumed, true);
  assert.equal(game.session.starTotal, 3);
});

test('invalid or cross-world vowel IDs fall back to the current bounded selection', () => {
  for (const ids of [['missing'], ['v4', 'foreign']]) {
    const { game } = runtime();
    const world = vowelWorld();
    game.savedPlace = { world: 'fatha', gameIndex: 1, starTotal: 2, at: NOW - 1000, vowelItemIds: ids };
    game.startGame = () => {};
    game.startWorld(world);
    assert.deepEqual(plain(game.session.items.map(item => item.id)), ['v2', 'v1', 'v5', 'v3']);
  }
});

test('legacy resume checkpoints keep step and stars and do not write rewards or progress on resume', () => {
  const { game, saves } = runtime();
  game.savedPlace = { world: 'fatha', gameIndex: 2, starTotal: 5, at: NOW - 1000 };
  game.progress.done = [];
  let started = 0;
  game.startGame = () => { started++; };
  game.earnStars = () => { throw new Error('resume must not pay rewards'); };
  game.saveStars = () => { throw new Error('resume must not write stars'); };
  game.startWorld(vowelWorld());
  assert.equal(started, 1);
  assert.equal(game.session.gameIndex, 2);
  assert.equal(game.session.starTotal, 5);
  assert.equal(game.session.resumed, true);
  assert.deepEqual(game.progress.done, []);
  assert.deepEqual(saves, []);
});

test('finishing a guided activity persists its item set through the save schema and reload', () => {
  const { game, ns } = runtime();
  vm.runInNewContext(stateSource, { window: { MiftahGame: ns }, localStorage: {}, console });
  const world = vowelWorld();
  game.renderMeet = () => {};
  game.startWorld(world);
  const selected = game.session.items.map(item => item.id);
  game.session.starTotal = 3;
  game.rememberPlace(game.session, 1);
  const checkpoint = ns.LettersState.normalize('resume', game.savedPlace, null);
  assert.deepEqual(plain(checkpoint.vowelItemIds), plain(selected));
  assert.equal(checkpoint.gameIndex, 1);
  game.savedPlace = checkpoint;
  world.items = () => world.catalogue.slice().reverse();
  game.startGame = () => {};
  game.startWorld(world);
  assert.deepEqual(plain(game.session.items.map(item => item.id)), plain(selected));
  assert.equal(game.session.starTotal, 3);
  assert.equal(game.session.gameIndex, 1);
});
