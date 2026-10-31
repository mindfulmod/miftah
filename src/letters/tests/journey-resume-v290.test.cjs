const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'LettersGame.js'), 'utf8');
const NOW = 1_800_000_000_000;

function runtime() {
  const window = { MiftahGame: { LettersArt: { icon: () => '<svg></svg>' } } };
  const clock = class extends Date { static now() { return NOW; } };
  vm.runInNewContext(source, { window, Date: clock, console, Math, JSON, setTimeout, clearTimeout });
  const game = Object.create(window.MiftahGame.LettersGame.prototype);
  const saves = [];
  game.root = { style: { setProperty() {} } };
  game.sound = { play() {} };
  game.progress = { done: [] };
  game.loadJSON = key => key === 'quran-trainer:letters:resume' ? game.savedPlace : null;
  game.savedPlace = null;
  game.saveJSON = (key, value) => { saves.push([key, value]); if (key === 'quran-trainer:letters:resume') game.savedPlace = value; return true; };
  return { game, ns: window.MiftahGame, saves };
}

function world() {
  return { id: 'pack-smile', hue: 20, games: ['pairs', 'trace', 'pop'], meet: [{ display: 'ج' }], items: () => [{ id: 'ج', display: 'ج' }] };
}

test('an intermediate saved integer resumes the next activity and restores its star total', () => {
  const { game } = runtime();
  game.savedPlace = { world: 'pack-smile', gameIndex: 2, starTotal: 5, at: NOW - 1000 };
  const calls = [];
  game.startGame = () => calls.push('game');
  game.renderMeet = () => calls.push('meet');

  game.startWorld(world());

  assert.deepEqual(calls, ['game']);
  assert.equal(game.session.gameIndex, 2);
  assert.equal(game.session.starTotal, 5);
  assert.equal(game.session.resumed, true);
});

test('bedtime and longer breaks preserve the next activity, stars and map progress without writes', () => {
  for (const hours of [6, 18, 24 * 7, 24 * 365]) {
    const { game, saves } = runtime(), chapter = world();
    game.savedPlace = {world: chapter.id, gameIndex: 1, starTotal: 3, at: NOW - hours * 3600000};
    let played = 0;
    game.startGame = () => played++;
    game.renderMeet = () => { throw new Error('a break must not restart the introduction'); };
    game.earnStars = () => { throw new Error('resuming must not pay rewards'); };
    game.startWorld(chapter);
    assert.equal(played, 1);
    assert.equal(game.session.gameIndex, 1);
    assert.equal(game.session.starTotal, 3);
    assert.equal(game.session.resumed, true);
    assert.equal(game.partwayOf(chapter), 1 / 3);
    assert.equal(saves.length, 0);
  }
});

test('an overnight word visit restores its canonical collection in the saved order', () => {
  const {game} = runtime();
  const catalogue = ['لَمْ','مِنْ','هُوَ','قُلْ'].map(id => ({id,display:id}));
  const chapter = {...world(),id:'words-2',catalogue,items:()=>catalogue.slice().reverse()};
  const ids = ['هُوَ','لَمْ','قُلْ','مِنْ'];
  game.savedPlace = {world:chapter.id,gameIndex:1,starTotal:3,at:NOW-18*3600000,wordItemIds:ids};
  game.startGame = () => {};
  game.renderMeet = () => { throw new Error('resume should enter the saved game'); };
  game.startWorld(chapter);
  assert.deepEqual(Array.from(game.session.items, item => item.id), ids);
  assert.ok(game.session.items.every(item => catalogue.includes(item)));
  assert.equal(game.session.gameIndex, 1);
  assert.equal(game.session.starTotal, 3);
});

test('a saved final-step index finishes without replaying the last game or paying its stars again', () => {
  const { game } = runtime();
  game.savedPlace = { world: 'pack-smile', gameIndex: 3, starTotal: 8, at: NOW - 18 * 3600000 };
  game.stars = {};
  game.saveStars = () => {};
  game.stampToday = () => {};
  game.chapterBonus = () => null;
  let played = 0, paid = 0, parties = 0;
  game.startGame = () => { played += 1; };
  game.renderMeet = () => { throw new Error('an old final checkpoint must not restart the introduction'); };
  game.earnStars = () => { paid += 1; };
  game.renderParty = (stars, newlyDone) => { parties += 1; assert.equal(stars, 3); assert.equal(newlyDone, true); };

  game.startWorld(world());

  assert.equal(game.session.gameIndex, 3);
  assert.equal(game.session.starTotal, 8);
  assert.equal(game.session.resumed, true);
  assert.equal(played, 0);
  assert.equal(paid, 0);
  assert.equal(parties, 1);
  assert.deepEqual(game.progress.done, ['pack-smile']);
  assert.equal(game.savedPlace, null, 'finishing clears the stale resume checkpoint');
});

test('a final checkpoint commits the chapter directly and clears without opening the optional friend game', () => {
  const makeReady = game => {
    let selected = 0;
    game.stars = {};
    game.saveStars = () => {};
    game.stampToday = () => {};
    game.chapterBonus = () => { selected += 1; return { kind: 'FriendFind', items: [{ id: 'ج', display: 'ج' }] }; };
    game.startPractice = () => { throw new Error('a final checkpoint must not launch an optional game'); };
    game.startGame = () => { throw new Error('a final checkpoint must not restart a game'); };
    game.renderParty = () => {};
    return () => selected;
  };

  const first = runtime();
  first.game.savedPlace = { world: 'pack-smile', gameIndex: 3, starTotal: 8, at: NOW - 1000 };
  const firstSelected = makeReady(first.game);
  first.game.startWorld(world());
  assert.equal(firstSelected(), 1, 'the party may prepare its optional friend choice');
  assert.equal(first.game.savedPlace, null, 'the stale checkpoint clears at completion');
  assert.deepEqual(first.game.progress.done, ['pack-smile']);
});

test('invalid, fractional, mismatched, future and out-of-range checkpoints restart the chapter', () => {
  const cases = [
    { world: 'pack-smile', gameIndex: 1.5, starTotal: 2, at: NOW - 1 },
    { world: 'other-world', gameIndex: 1, starTotal: 2, at: NOW - 1 },
    { world: 'pack-smile', gameIndex: -1, starTotal: 2, at: NOW - 1 },
    { world: 'pack-smile', gameIndex: 4, starTotal: 2, at: NOW - 1 },
    { world: 'pack-smile', gameIndex: 1, starTotal: 2, at: NOW + 1 },
    ...[undefined, null, 0, -1, String(NOW), NaN, Infinity].map(at => ({world:'pack-smile',gameIndex:1,starTotal:2,at})),
  ];
  for (const place of cases) {
    const { game } = runtime();
    game.savedPlace = place;
    const calls = [];
    game.startGame = () => calls.push('game');
    game.renderMeet = () => calls.push('meet');
    game.startWorld(world());
    assert.deepEqual(calls, ['meet'], JSON.stringify(place));
    assert.equal(game.session.gameIndex, 0);
    assert.equal(game.session.starTotal, 0);
  }
});

test('map progress accepts valid past integer checkpoints and shows the final stars handoff as complete', () => {
  const { game } = runtime();
  const chapter = world();
  game.savedPlace = { world: chapter.id, gameIndex: 3, starTotal: 8, at: NOW - 1000 };
  assert.equal(game.partwayOf(chapter), 1);
  for (const place of [
    { world: chapter.id, gameIndex: 1.5, at: NOW - 1 },
    { world: chapter.id, gameIndex: 4, at: NOW - 1 },
    { world: chapter.id, gameIndex: 1, at: NOW + 1 },
    ...[undefined, null, 0, -1, String(NOW), NaN, Infinity].map(at => ({world:chapter.id,gameIndex:1,at})),
  ]) {
    game.savedPlace = place;
    assert.equal(game.partwayOf(chapter), 0);
  }
});

test('ordinary chapter replay does not repeat star payment but can pay a new best delta', () => {
  const { game } = runtime();
  const paid = [];
  game.bests = {};
  game.earnStars = amount => paid.push(amount);
  game.saveJSON = () => true;
  game.renderStars = () => {};
  game.session = { world: world(), gameIndex: 0, starTotal: 0 };

  game.finishGame(2); // two stars on the first run
  const replayScreen = { isConnected: true, dataset: {} };
  game.sound = { play() {} };
  game.startGame = () => {};
  game.replayActivity(replayScreen);
  game.finishGame(2); // same score on replay
  game.replayActivity({ isConnected: true, dataset: {} });
  game.finishGame(0); // one-star improvement

  assert.deepEqual(paid, [2, 1]);
  assert.equal(game.bests['pack-smile:pairs'], 3);
});
