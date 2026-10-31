const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'LettersGame.js'), 'utf8');

function runtime() {
  const window = { MiftahGame: { LettersArt: { icon: () => '<svg></svg>' } } };
  vm.runInNewContext(source, { window, Date, console, Math, JSON, setTimeout, clearTimeout });
  const game = Object.create(window.MiftahGame.LettersGame.prototype);
  const saved = [];
  Object.assign(game, {
    session: null, stars: {}, progress: { done: [] }, root: { querySelector: () => ({ focus() {} }) },
    loadJSON: () => null, saveJSON: (...args) => saved.push(args), saveStars() {}, saveProgress() {}, stampToday() {},
    renderParty: (...args) => { game.parties.push(args); }, parties: [],
  });
  return { game, saved };
}

function chapter() {
  return { world: { id: 'pack-smile', games: ['pairs', 'trace'], kind: 'letters' }, starTotal: 4, bestStars: 0 };
}

function commitReady(game, bonus = { kind: 'FriendFind', items: [{ id: 'ج' }] }) {
  let selected = 0;
  game.chapterBonus = () => { selected += 1; return bonus; };
  return () => selected;
}

test('chapter commits and shows party immediately while an eligible friend game stays optional', () => {
  const { game } = runtime();
  const count = commitReady(game);
  game.session = chapter();
  let launched = 0;
  game.startPractice = () => { launched += 1; };

  game.finishWorld();

  assert.equal(count(), 1);
  assert.deepEqual(game.progress.done, ['pack-smile']);
  assert.equal(game.stars['pack-smile'], 2);
  assert.equal(game.parties.length, 1);
  assert.equal(launched, 0);
  assert.equal(game.session.friendStop.kind, 'FriendFind');
});

test('friend choice is selected once before first unlock changes replay rotation', () => {
  const { game } = runtime();
  const count = commitReady(game);
  game.session = chapter();
  game.finishWorld();
  game.finishWorld();
  assert.equal(count(), 1);
});

test('a resumed old final checkpoint commits directly without launching the optional bonus', () => {
  const { game } = runtime();
  game.session = chapter();
  game.loadJSON = () => ({ world: 'pack-smile', gameIndex: 2, starTotal: 4 });
  game.chapterBonus = () => ({ kind: 'FriendFind', items: [{}] });
  let launched = 0;
  game.startPractice = () => { launched += 1; };
  game.finishWorld();
  assert.deepEqual(game.progress.done, ['pack-smile']);
  assert.equal(game.parties.length, 1);
  assert.equal(launched, 0);
});

test('explicit friend visit returns to party without repeating chapter completion', () => {
  const { game } = runtime();
  const chapterSession = chapter();
  const screen = { isConnected: true };
  game.session = chapterSession;
  game.screenRevision = 7;
  const bonus = { kind: 'FriendFind', items: [{ id: 'ج' }] };
  let visit;
  game.startPractice = (kind, back, done) => { visit = { kind, back, done }; };

  game.playChapterFriend(screen, chapterSession, bonus, 2);
  const friendSession = game.session;
  assert.equal(visit.kind, 'FriendFind');
  assert.equal(friendSession.chapterBonus, true);
  visit.done();

  assert.equal(game.session, chapterSession);
  assert.deepEqual(game.parties, [[2, false]]);
  assert.deepEqual(game.progress.done, []);
  assert.equal(game.stars['pack-smile'], undefined);
  assert.equal(friendSession.chapterBonus, true);
});

test('duplicate and stale friend callbacks cannot return or render another party', () => {
  const { game } = runtime();
  const chapterSession = chapter();
  game.session = chapterSession;
  game.screenRevision = 1;
  let back;
  game.startPractice = (_kind, cancel, done) => { back = done; assert.equal(typeof cancel, 'function'); };
  game.playChapterFriend({ isConnected: true }, chapterSession, { kind: 'FriendFind', items: [{}] }, 1);
  back(); back();
  assert.equal(game.parties.length, 1);

  game.session = { world: { id: 'elsewhere' } };
  game.screenRevision += 1;
  back();
  assert.equal(game.parties.length, 1);
});

test('starting practice may synchronously cancel and still restores the party once', () => {
  const { game } = runtime();
  const chapterSession = chapter();
  game.session = chapterSession;
  game.screenRevision = 4;
  game.startPractice = (_kind, cancel) => cancel();
  game.playChapterFriend({ isConnected: true }, chapterSession, { kind: 'FriendFind', items: [{}] }, 2);
  assert.equal(game.session, chapterSession);
  assert.deepEqual(game.parties, [[2, false]]);
});

test('daily and checkup completions do not create an optional friend game', () => {
  for (const flags of [{ daily: true }, { checkup: true }]) {
    const { game } = runtime();
    let selected = 0;
    game.chapterBonus = () => { selected += 1; return { kind: 'FriendFind', items: [{}] }; };
    game.session = Object.assign(chapter(), flags);
    game.finishWorld();
    assert.equal(selected, 0);
    assert.equal(game.session.friendStop, undefined);
    assert.equal(game.parties.length, 1);
  }
});

// A superseded visit must not regain the screen even before its first callback.
test('leaving an active friend visit rejects its late completion, and double launch is inert', () => {
  for (const change of ['screen', 'session']) {
    const { game } = runtime();
    const original = chapter();
    game.session = original;
    game.screenRevision = 4;
    let done, launches = 0;
    game.startPractice = (_kind, _cancel, finish) => { done = finish; launches++; };
    const screen = { isConnected: true }, bonus = { kind: 'FriendFind', items: [{}] };
    game.playChapterFriend(screen, original, bonus, 2);
    game.playChapterFriend(screen, original, bonus, 2);
    assert.equal(launches, 1);
    if (change === 'screen') game.screenRevision++;
    else game.session = { world: { id: 'elsewhere' } };
    done();
    assert.equal(game.parties.length, 0);
  }
});
