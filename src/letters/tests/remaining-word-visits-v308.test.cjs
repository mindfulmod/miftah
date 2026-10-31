const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../../..');
const plain = value => JSON.parse(JSON.stringify(value));

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
  const game = Object.create(ns.LettersGame.prototype);
  Object.assign(game, {
    root: { style: { setProperty() {} } }, sound: { play() {} },
    progress: { done: ['fatha', 'kasra-damma', 'standing', 'long-sounds', 'leen', 'sukoon', 'shaddah', 'shaddah-mix', 'words-2', 'decode'] },
    savedPlace: null, loadJSON: () => game.savedPlace,
    saveJSON: (key, value) => { game.savedPlace = value; return true; },
    renderMeet() {}, startGame() {},
  });
  return { ns, worlds, game };
}

test('decode worlds use their real catalogues, intended length bands, and established game order', async () => {
  const { worlds } = await runtime();
  for (const [id, band, games] of [
    ['decode', [3, 3], ['feed', 'build', 'pop']],
    ['decode-4', [4, 5], ['feed', 'pop', 'pairs']],
  ]) {
    const world = worlds.worlds.find(candidate => candidate.id === id);
    assert.deepEqual(plain(world.wordBand), band);
    assert.deepEqual(plain(world.games), games);
    assert.ok(world.catalogue.length > 8);
    assert.ok(world.catalogue.every(item => item.wordLength >= band[0] && item.wordLength <= band[1]));
    if (id === 'decode') {
      assert.ok(world.catalogue.every(item => item.parts?.length === 3));
      for (const [display, parts] of [
        ['مَـٰلِكِ', ['مَٰ', 'لِ', 'كِ']],
        ['هَـٰذَا', ['هَٰ', 'ذَ', 'ا']],
        ['إِلَـٰهِ', ['إِ', 'لَٰ', 'هِ']],
      ]) {
        const item = world.catalogue.find(item => item.display === display);
        assert.ok(item, 'keep the original printed word');
        assert.deepEqual(plain(item.parts.map(part => part.display)), parts);
        assert.deepEqual(plain(item.parts.map(part => part.speak)), parts);
        assert.ok(item.audioPath, 'keep the original whole-word recording reference');
      }
    }
  }
});

test('unfinished decode visits share a canonical adaptive cohort across each world’s activities', async () => {
  const { ns, worlds, game } = await runtime();
  for (const id of ['decode', 'decode-4']) {
    const world = worlds.worlds.find(candidate => candidate.id === id);
    game.progress.done = [];
    for (const sprout of [false, true]) {
      game.sprout = sprout;
      const count = sprout ? 3 : 4;
      const chosen = game.introWordItems(world, world.items());
      const ids = plain(chosen.map(item => item.id).sort());
      assert.equal(chosen.length, count);
      assert.equal(new Set(ids).size, count);
      assert.ok(chosen.every(item => world.catalogue.find(canonical => canonical.id === item.id) === item));
      for (const activity of world.games) {
        const planned = ns.LettersLearning.planRounds({ items: chosen, rounds: count, activity,
          worldId: id, completedWorldIds: game.progress.done, beginner: true });
        assert.deepEqual(plain(planned.map(round => round.target.id).sort()), ids,
          `${id}/${activity} rehearses the whole selected collection before any repetition`);
      }
    }
    game.sprout = false;
  }
});

test('decode checkpoints preserve canonical IDs, game step, and stars after shuffle without cross-chapter injection', async () => {
  const { worlds, game } = await runtime();
  for (const id of ['decode', 'decode-4']) {
    const world = worlds.worlds.find(candidate => candidate.id === id);
    const other = worlds.worlds.find(candidate => candidate.id !== id && ['decode', 'decode-4'].includes(candidate.id));
    game.progress.done = [];
    game.savedPlace = null;
    game.startWorld(world);
    const selected = game.session.items.map(item => item.id);
    assert.equal(selected.length, 4);
    game.session.gameIndex = 1;
    game.session.starTotal = 3;
    game.rememberPlace(game.session, 0);
    assert.deepEqual(plain(game.savedPlace.wordItemIds), plain(selected));
    world.items = () => world.catalogue.slice().reverse();
    game.startWorld(world);
    assert.deepEqual(plain(game.session.items.map(item => item.id)), plain(selected));
    assert.equal(game.session.guidedWords, true);
    assert.equal(game.session.gameIndex, 1);
    assert.equal(game.session.starTotal, 3);
    game.savedPlace.wordItemIds[0] = other.catalogue[0].id;
    game.startGame = () => {};
    game.startWorld(world);
    assert.equal(game.session.gameIndex, 1);
    assert.equal(game.session.starTotal, 3);
    assert.equal(game.session.items.length, 4);
    assert.ok(game.session.items.every(item => world.catalogue.includes(item)));
    assert.notEqual(game.session.items[0].id, other.catalogue[0].id);
  }
});

test('completed decode replays keep the original shuffled eight-item pool', async () => {
  const { worlds, game } = await runtime();
  for (const id of ['decode', 'decode-4']) {
    const world = worlds.worlds.find(candidate => candidate.id === id);
    const pool = world.items();
    world.items = () => pool;
    game.progress.done = [id];
    game.startWorld(world);
    assert.equal(game.session.items, pool);
    assert.equal(game.session.items.length, 8);
    assert.equal(game.session.guidedWords, false);
  }
});
