const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../../..');
const plain = value => JSON.parse(JSON.stringify(value));
const expected = ['بَوْ', 'بَيْ', 'بُو', 'بِي'];
const pairs = [['بَوْ', 'بُو'], ['بَيْ', 'بِي'], ['بُو', 'بَوْ'], ['بِي', 'بَيْ']];

async function runtime() {
  const window = { MiftahGame: { LettersArt: { icon: () => '<svg></svg>' } } };
  const context = { window, console, Date, setTimeout, clearTimeout, AbortController,
    fetch: async url => {
      const n = Number(String(url).match(/surah-(\d+)\.json$/)?.[1]);
      const file = path.join(root, 'data', `surah-${n}.json`);
      return fs.existsSync(file) ? { ok: true, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) } : { ok: false, status: 404 };
    } };
  for (const file of ['src/data/letters.js', ...['LettersBoot', 'LettersWorlds', 'GardenLearning', 'LettersLearning', 'LettersGame'].map(name => `src/letters/${name}.js`)]) {
    vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  }
  const ns = window.MiftahGame, worlds = new ns.LettersWorlds();
  await worlds.loadWords();
  const world = worlds.worlds.find(w => w.id === 'leen');
  const game = Object.create(ns.LettersGame.prototype);
  Object.assign(game, {
    root: { style: { setProperty() {} } }, sound: { play() {} },
    progress: { done: ['fatha', 'kasra-damma', 'standing', 'long-sounds'] },
    savedPlace: null, loadJSON: () => game.savedPlace,
    renderMeet() {}, startGame() {},
  });
  return { ns, worlds, world, game };
}

test('first glide lesson reuses both taught glides and their canonical long-vowel twins', async () => {
  const { worlds, world } = await runtime();
  const lesson = world.introLesson, long = worlds.worlds.find(w => w.id === 'long-sounds');
  assert.deepEqual(plain(lesson.items.map(item => item.display)), expected);
  assert.deepEqual(plain(lesson.contrasts.map(pair => [pair.targetId, pair.otherId])), pairs);
  assert.deepEqual(plain(lesson.extraItems.map(item => item.prerequisiteWorldIds)), [['long-sounds'], ['long-sounds']]);
  for (const item of lesson.items) {
    assert.equal(item, [...world.catalogue, ...long.catalogue].find(c => c.id === item.id));
    assert.equal(item.speak, item.display);
    assert.equal(item.parts.length, 2);
  }
  assert.deepEqual(plain(lesson.items.slice(0, 2).map(item => item.parts)), [
    [{ display: 'بَ', speak: 'بَ' }, { display: 'وْ', speak: '' }],
    [{ display: 'بَ', speak: 'بَ' }, { display: 'يْ', speak: '' }],
  ]);
});

test('recognition and building plans keep the four comparisons, randomize sides and cover both glides in Sprout', async () => {
  const { ns, world } = await runtime();
  const lesson = world.introLesson;
  for (const activity of ['pop', 'build', 'feed']) {
    const ctx = { ...lesson, lessonContrasts: lesson.contrasts, worldId: 'leen', completedWorldIds: ['long-sounds'], activity, rounds: 4 };
    const left = ns.LettersLearning.planRounds({ ...ctx, random: () => 0 });
    const right = ns.LettersLearning.planRounds({ ...ctx, random: () => .99 });
    assert.deepEqual(plain(left.map(round => round.target.id)), expected);
    left.forEach((round, i) => {
      assert.deepEqual(plain(round.options.map(item => item.id).sort()), pairs[i].slice().sort());
      assert.notEqual(round.options[0].id, right[i].options[0].id);
      assert.equal(round.promptMode, 'match');
      assert.equal(round.choiceCount, 2);
      assert.equal(round.movement, 'still');
    });
    const sprout = ns.LettersLearning.planRounds({ ...ctx, rounds: 3, beginner: true });
    assert.deepEqual(plain(sprout.map(round => round.target.id)), expected.slice(0, 3));
  }
});

test('first visit uses the authored set, while completed replay retains all ten mixed syllables', async () => {
  const { world, game } = await runtime();
  game.startWorld(world);
  assert.deepEqual(plain(game.session.items.map(item => item.id)), expected);
  const replay = world.items();
  assert.equal(replay.length, 10);
  assert.equal(new Set(replay.map(item => [...item.display][0])).size, 5);
  world.items = () => replay;
  game.progress.done.push('leen');
  game.startWorld(world);
  assert.equal(game.session.items, replay);
  assert.equal(game.session.lessonContrasts, undefined);
});

test('old middle checkpoints retain their step and stars while rebuilding the introductory set', async () => {
  const { world, game } = await runtime();
  let starts = 0;
  game.startGame = () => starts++;
  game.earnStars = game.saveStars = () => { throw new Error('resume must not pay again'); };
  for (const step of [1, 2]) {
    game.savedPlace = { world: 'leen', gameIndex: step, starTotal: step * 3, at: Date.now() - 1000 };
    game.startWorld(world);
    assert.equal(game.session.gameIndex, step);
    assert.equal(game.session.starTotal, step * 3);
    assert.equal(game.session.resumed, true);
    assert.deepEqual(plain(game.session.items.map(item => item.id)), expected);
    assert.equal(game.progress.done.includes('leen'), false);
  }
  assert.equal(starts, 2);
});

test('the glide chapter keeps its curriculum position and existing activities', async () => {
  const { worlds, world } = await runtime();
  const ids = worlds.worlds.map(w => w.id), i = ids.indexOf('leen');
  assert.deepEqual(plain(ids.slice(i - 1, i + 2)), ['long-sounds', 'leen', 'sukoon']);
  assert.deepEqual(plain(world.games), ['pop', 'build', 'feed']);
  assert.deepEqual(plain(world.meet.map(card => card.display)), ['بَوْ', 'بَيْ']);
});
