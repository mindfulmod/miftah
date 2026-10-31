const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../../..');
const source = file => fs.readFileSync(path.join(root, file), 'utf8');
const plain = value => JSON.parse(JSON.stringify(value));
const NOW = 1_800_000_000_000;

async function worlds() {
  const window = { MiftahGame: {} };
  const context = { window, AbortController, setTimeout, clearTimeout,
    fetch: async url => {
      const n = Number(String(url).match(/surah-(\d+)\.json$/)?.[1]);
      const file = path.join(root, 'data', `surah-${n}.json`);
      return fs.existsSync(file) ? { ok: true, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) } : { ok: false, status: 404 };
    } };
  vm.runInNewContext(source('src/data/letters.js'), context);
  vm.runInNewContext(source('src/letters/LettersBoot.js'), context);
  vm.runInNewContext(source('src/letters/LettersWorlds.js'), context);
  const instance = new window.MiftahGame.LettersWorlds();
  await instance.loadWords();
  return { instance, window };
}

function learning() {
  const window = { MiftahGame: {} };
  vm.runInNewContext(source('src/letters/GardenLearning.js'), { window });
  vm.runInNewContext(source('src/letters/LettersLearning.js'), { window });
  return window.MiftahGame.LettersLearning;
}

function gameRuntime() {
  const window = { MiftahGame: { LettersArt: { icon: () => '<svg></svg>' } } };
  const clock = class extends Date { static now() { return NOW; } };
  vm.runInNewContext(source('src/letters/LettersGame.js'), { window, Date: clock, console, Math, JSON, setTimeout, clearTimeout });
  const game = Object.create(window.MiftahGame.LettersGame.prototype);
  game.root = { style: { setProperty() {} } };
  game.sound = { play() {} };
  game.progress = { done: [] };
  game.loadJSON = () => game.savedPlace;
  game.savedPlace = null;
  return game;
}

test('authored first lesson uses the three real tanween marks and only earlier-chapter short vowels', async () => {
  const { instance } = await worlds();
  const lesson = instance.worlds.find(world => world.id === 'tanween').introLesson;
  assert.deepEqual(plain(lesson.items.map(item => item.display)), ['بً', 'بٍ', 'بٌ', 'بَ']);
  assert.deepEqual(plain(lesson.extraItems.map(item => item.display)), ['بَ', 'بِ', 'بُ']);
  assert.deepEqual(plain(lesson.extraItems.map(item => item.prerequisiteWorldIds)), [['fatha'], ['kasra-damma'], ['kasra-damma']]);
  assert.deepEqual(plain(lesson.contrasts), [
    { targetId: 'بً', otherId: 'بَ' }, { targetId: 'بٍ', otherId: 'بِ' },
    { targetId: 'بٌ', otherId: 'بُ' }, { targetId: 'بَ', otherId: 'بً' },
  ]);
});

test('three-round Sprout plan covers each tanween mark with two still visible choices', async () => {
  const { instance } = await worlds();
  const lesson = instance.worlds.find(world => world.id === 'tanween').introLesson;
  const rounds = learning().planRounds({ ...lesson, lessonContrasts: lesson.contrasts, rounds: 3, activity: 'pop', worldId: 'tanween', completedWorldIds: ['fatha', 'kasra-damma'] });
  assert.deepEqual(plain(rounds.map(round => round.target.display)), ['بً', 'بٍ', 'بٌ']);
  for (const round of rounds) {
    assert.equal(round.options.length, 2);
    assert.ok(round.options.includes(round.target));
    assert.equal(round.promptMode, 'match');
    assert.equal(round.movement, 'still');
  }
});

test('authored contrast pair order is stable while choice sides shuffle', async () => {
  const { instance } = await worlds();
  const lesson = instance.worlds.find(world => world.id === 'tanween').introLesson;
  const learningApi = learning();
  const base = { ...lesson, lessonContrasts: lesson.contrasts, rounds: 4, activity: 'pop', challenge: true, worldId: 'tanween', completedWorldIds: ['fatha', 'kasra-damma'] };
  const left = learningApi.planRounds({ ...base, random: () => 0 });
  const right = learningApi.planRounds({ ...base, random: () => 0.99 });
  assert.deepEqual(plain(left.map(round => [round.target.id, round.options.map(item => item.id)])), [
    ['بً', ['بَ', 'بً']], ['بٍ', ['بِ', 'بٍ']], ['بٌ', ['بُ', 'بٌ']], ['بَ', ['بً', 'بَ']],
  ]);
  assert.deepEqual(plain(right.map(round => round.target.id)), plain(left.map(round => round.target.id)));
  assert.ok(left.every((round, index) => round.options[0].id !== right[index].options[0].id));
  assert.ok(left.every(round => round.choiceCount === 2 && round.promptMode === 'match'));
});

test('unavailable contrast reference rejects the authored plan and locked or future extras stay unavailable', () => {
  const b = { id: 'بً', display: 'بً' };
  const short = { id: 'بَ', display: 'بَ' };
  const locked = { id: 'locked', display: 'تَ', locked: true };
  const future = { id: 'future', display: 'ثَ', prerequisiteWorldIds: ['later'] };
  for (const otherId of ['missing', 'locked', 'future']) {
    const rounds = learning().planRounds({ items: [b, short], extraItems: [locked, future],
      lessonContrasts: [{ targetId: b.id, otherId }], rounds: 4, activity: 'pop',
      worldId: 'tanween', completedWorldIds: [] , random: () => 0 });
    assert.equal(new Set(rounds.map(round => round.target.id)).size, 2);
    assert.ok(rounds.every(round => round.options.every(option => !['locked', 'future'].includes(option.id))));
  }
});

test('first visit selects the intro lesson while completed replay keeps the supplied full pool', async () => {
  const { instance } = await worlds();
  const world = instance.worlds.find(item => item.id === 'tanween');
  const game = gameRuntime();
  game.progress.done = ['fatha', 'kasra-damma'];
  game.renderMeet = () => {};
  game.startGame = () => {};
  game.startWorld(world);
  assert.deepEqual(plain(game.session.items.map(item => item.display)), ['بً', 'بٍ', 'بٌ', 'بَ']);
  assert.equal(game.session.lessonContrasts.length, 4);
  game.progress.done = ['tanween'];
  const replayItems = world.items();
  world.items = () => replayItems;
  game.startWorld(world);
  assert.equal(game.session.lessonContrasts, undefined);
  assert.deepEqual(plain(game.session.items.map(item => item.id)), plain(replayItems.map(item => item.id)));
});

test('resume retains step and stars without paying out again and rebuilds the deterministic lesson', async () => {
  const { instance } = await worlds();
  const world = instance.worlds.find(item => item.id === 'tanween');
  const game = gameRuntime();
  game.progress.done = ['fatha', 'kasra-damma'];
  game.savedPlace = { world: 'tanween', gameIndex: 2, starTotal: 6, at: NOW - 1000 };
  let starts = 0;
  game.startGame = () => { starts += 1; };
  game.earnStars = () => { throw new Error('resume must not award stars again'); };
  game.saveStars = () => { throw new Error('resume must not write stars again'); };
  game.startWorld(world);
  assert.equal(starts, 1);
  assert.equal(game.session.gameIndex, 2);
  assert.equal(game.session.starTotal, 6);
  assert.equal(game.session.resumed, true);
  assert.deepEqual(plain(game.session.items.map(item => item.id)), ['بً', 'بٍ', 'بٌ', 'بَ']);
  assert.equal(game.session.lessonContrasts.length, 4);
  assert.deepEqual(game.progress.done, ['fatha', 'kasra-damma']);
});
