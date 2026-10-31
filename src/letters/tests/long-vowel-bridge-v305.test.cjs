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

const lessonCases = [
  { id: 'standing', items: ['بٰ', 'بٖ', 'بٗ', 'بَ'], pairs: [['بٰ', 'بَ'], ['بٖ', 'بِ'], ['بٗ', 'بُ'], ['بَ', 'بٰ']], games: ['pop', 'feed', 'catch'] },
  { id: 'long-sounds', items: ['بَا', 'بِي', 'بُو', 'بَ'], pairs: [['بَا', 'بَ'], ['بِي', 'بِ'], ['بُو', 'بُ'], ['بَ', 'بَا']], games: ['build', 'pop', 'pairs'] },
];

test('standing and long-sound first lessons use authored forms, short-vowel extras, and four ordered contrasts', async () => {
  const { instance } = await worlds();
  for (const spec of lessonCases) {
    const world = instance.worlds.find(item => item.id === spec.id);
    const lesson = world.introLesson;
    assert.deepEqual(plain(lesson.items.map(item => item.display)), spec.items);
    assert.deepEqual(plain(lesson.extraItems.map(item => item.display)), ['بَ', 'بِ', 'بُ']);
    assert.deepEqual(plain(lesson.extraItems.map(item => item.prerequisiteWorldIds)), [['fatha'], ['kasra-damma'], ['kasra-damma']]);
    assert.deepEqual(plain(lesson.contrasts.map(pair => [pair.targetId, pair.otherId])), spec.pairs);
  }
});

test('standing and long-sound cards reuse canonical speech and build parts', async () => {
  const { instance } = await worlds();
  const standing = instance.worlds.find(item => item.id === 'standing');
  const longSounds = instance.worlds.find(item => item.id === 'long-sounds');
  const short = Object.fromEntries(['fatha', 'kasra-damma'].flatMap(id => instance.worlds.find(item => item.id === id).catalogue.map(item => [item.display, item])));
  for (const [display, twin] of [['بٰ', 'بَا'], ['بٖ', 'بِي'], ['بٗ', 'بُو']]) {
    const card = standing.catalogue.find(item => item.display === display);
    const longCard = longSounds.catalogue.find(item => item.display === twin);
    assert.equal(card.speak, longCard.speak);
    assert.equal(card.speak, twin);
    assert.deepEqual(plain(card.parts), [{ display: 'ب', speak: 'بَاءْ' }, { display: `ـ${display.slice(1)}`, speak: longCard.speak.slice(0, 2) + (display === 'بٰ' ? 'ا' : display === 'بٖ' ? 'ي' : 'و') }]);
  }
  for (const spec of lessonCases) {
    const world = instance.worlds.find(item => item.id === spec.id);
    for (const [targetDisplay, shortDisplay] of spec.pairs.slice(0, 3)) {
      const target = world.catalogue.find(item => item.display === targetDisplay);
      const extra = world.introLesson.extraItems.find(item => item.display === shortDisplay);
      assert.deepEqual(plain(extra.parts), plain(short[shortDisplay].parts));
      assert.equal(world.introLesson.items.find(item => item.id === target.id), target, 'intro target reuses the authored object');
      if (spec.id === 'long-sounds') {
        const letter = { 'بَا': 'ا', 'بِي': 'ي', 'بُو': 'و' }[targetDisplay];
        assert.deepEqual(plain(target.parts.map(part => part.display)), [shortDisplay, letter]);
        assert.equal(target.speak, targetDisplay);
      }
    }
  }
});

test('three-round Sprout contrast plans cover each new long form with two still-visible choices', async () => {
  const { instance } = await worlds();
  const api = learning();
  for (const spec of lessonCases) {
    const lesson = instance.worlds.find(item => item.id === spec.id).introLesson;
    const rounds = api.planRounds({ ...lesson, lessonContrasts: lesson.contrasts, rounds: 3, activity: 'pop', worldId: spec.id,
      completedWorldIds: ['fatha', 'kasra-damma'], beginner: true });
    assert.deepEqual(plain(rounds.map(round => round.target.display)), spec.items.slice(0, 3));
    for (const round of rounds) {
      assert.equal(round.options.length, 2);
      assert.ok(round.options.includes(round.target));
      assert.equal(round.promptMode, 'match');
      assert.equal(round.movement, 'still');
    }
  }
});

test('each long-vowel lesson keeps the same authored target schedule across its chapter activities', async () => {
  const { instance } = await worlds();
  const api = learning();
  for (const spec of lessonCases) {
    const lesson = instance.worlds.find(item => item.id === spec.id).introLesson;
    const plans = spec.games.map(activity => api.planRounds({ ...lesson, lessonContrasts: lesson.contrasts, rounds: 4, activity,
      worldId: spec.id, completedWorldIds: ['fatha', 'kasra-damma'], random: () => 0.73 }));
    const schedule = plans[0].map(round => round.target.id);
    for (const rounds of plans) {
      assert.deepEqual(plain(rounds.map(round => round.target.id)), plain(schedule));
      for (const [i, round] of rounds.entries()) {
        assert.deepEqual(plain(round.options.map(item => item.id).sort()), plain(spec.pairs[i].slice().sort()));
        assert.equal(round.choiceCount, 2);
        assert.equal(round.promptMode, 'match');
        assert.equal(round.movement, 'still');
      }
    }
  }
});

test('first visit selects each intro shell while completed replay keeps the supplied full item pool', async () => {
  const { instance } = await worlds();
  for (const spec of lessonCases) {
    const world = instance.worlds.find(item => item.id === spec.id);
    const game = gameRuntime();
    game.progress.done = ['fatha', 'kasra-damma'];
    game.renderMeet = () => {};
    game.startGame = () => {};
    game.startWorld(world);
    assert.deepEqual(plain(game.session.items.map(item => item.display)), spec.items);
    assert.equal(game.session.lessonContrasts.length, 4);
    game.progress.done = [spec.id];
    const replayItems = world.items();
    assert.equal(replayItems.length, spec.id === 'standing' ? 18 : 12);
    assert.ok(new Set(replayItems.map(item => [...item.display][0])).size > 1);
    world.items = () => replayItems;
    game.startWorld(world);
    assert.equal(game.session.lessonContrasts, undefined);
    assert.deepEqual(plain(game.session.items.map(item => item.id)), plain(replayItems.map(item => item.id)));
  }
});

test('resuming either lesson retains its step and stars without reward calls or progress changes', async () => {
  const { instance } = await worlds();
  for (const spec of lessonCases) {
    const world = instance.worlds.find(item => item.id === spec.id);
    const game = gameRuntime();
    game.progress.done = ['fatha', 'kasra-damma'];
    game.savedPlace = { world: spec.id, gameIndex: 2, starTotal: 6, at: NOW - 1000 };
    let starts = 0;
    game.startGame = () => { starts += 1; };
    game.earnStars = () => { throw new Error('resume must not award stars again'); };
    game.saveStars = () => { throw new Error('resume must not write stars again'); };
    game.startWorld(world);
    assert.equal(starts, 1);
    assert.equal(game.session.gameIndex, 2);
    assert.equal(game.session.starTotal, 6);
    assert.equal(game.session.resumed, true);
    assert.deepEqual(plain(game.session.items.map(item => item.display)), spec.items);
    assert.equal(game.session.lessonContrasts.length, 4);
    assert.deepEqual(plain(game.progress.done), ['fatha', 'kasra-damma']);
  }
});

test('curriculum order and established chapter activity arrays remain stable', async () => {
  const { instance } = await worlds();
  const ids = instance.worlds.map(world => world.id);
  const at = ids.indexOf('fatha');
  assert.deepEqual(plain(ids.slice(at, at + 5)), ['fatha', 'kasra-damma', 'tanween', 'standing', 'long-sounds']);
  for (const spec of lessonCases) {
    assert.deepEqual(plain(instance.worlds.find(world => world.id === spec.id).games), spec.games);
  }
  assert.deepEqual(plain(instance.worlds.find(world => world.id === 'fatha').games), ['blend', 'pop', 'trace']);
  assert.deepEqual(plain(instance.worlds.find(world => world.id === 'kasra-damma').games), ['blend', 'pop', 'catch']);
  assert.deepEqual(plain(instance.worlds.find(world => world.id === 'tanween').games), ['pop', 'build', 'feed']);
});
