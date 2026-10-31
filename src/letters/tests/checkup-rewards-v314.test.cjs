const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const source = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const KEY = 'quran-trainer:letters:';
const plain = value => JSON.parse(JSON.stringify(value));

function runtime(saved = {}) {
  const values = new Map(Object.entries(saved).map(([k, v]) => [KEY + k, JSON.stringify(v)]));
  const localStorage = { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, String(v)) };
  const window = { MiftahGame: { LettersArt: {} } };
  const context = { window, localStorage };
  for (const file of ['LettersState.js', 'LettersGame.js']) vm.runInNewContext(source(file), context);
  const game = Object.create(window.MiftahGame.LettersGame.prototype);
  game.bests = game.loadJSON(KEY + 'bests', {});
  game.skills = game.loadJSON(KEY + 'skills', {});
  game.paid = [];
  game.earnStars = n => game.paid.push(n);
  game.saveJSON = (key, value) => { values.set(key, JSON.stringify(value)); return true; };
  game.renderStars = () => {};
  game.play = (skill, slips, index = 0, plan = [{ game: 'quiz', skill }], extras = {}) => {
    game.session = { checkup: true, plan, gameIndex: index, world: { id: 'checkup', games: plan.map(x => x.game) }, starTotal: 0, ...extras };
    game.finishGame(slips);
  };
  return { game, values };
}

test('checkup plan indexes cannot transfer rewards when new skills unlock', () => {
  const skills = Object.fromEntries(['identify','memorize','write'].map(id => [id,{score:3,best:3,at:'2026-10-20'}]));
  const legacy = {'checkup:plan0':3,'checkup:plan1':3,'checkup:plan2':3};
  const { game } = runtime({ bests:legacy, skills });
  const plan = [
    {game:'pop',skill:'identify'}, {game:'pairs',skill:'memorize'},
    {game:'pop',skill:'visualize'}, {game:'build',skill:'blend'}, {game:'trace',skill:'write'},
  ];
  game.play('visualize',0,2,plan);
  assert.deepEqual(game.paid,[3],'new forms skill must earn despite old writing at plan2');
  game.play('write',0,4,plan);
  assert.deepEqual(game.paid,[3],'moving writing to plan4 cannot pay it again');
  for (const [key,value] of Object.entries(legacy)) assert.equal(game.bests[key],value,'legacy records remain intact');
  assert.equal(game.bests['checkup:skill:visualize'],3);
  assert.equal(game.bests['checkup:skill:write'],3);
});

test('stable skill rewards survive plan reorder and reload without repaying', () => {
  const first = runtime();
  first.game.play('read', 0);
  assert.deepEqual(first.game.paid, [3]);
  const restored = runtime({ bests: plain(first.game.bests), skills: plain(first.game.skills) });
  restored.game.play('other', 0, 0, [{ game: 'different', skill: 'other' }, { game: 'quiz', skill: 'read' }]);
  restored.game.play('read', 0, 1, [{ game: 'different', skill: 'other' }, { game: 'quiz', skill: 'read' }]);
  assert.deepEqual(restored.game.paid, [3]);
  assert.equal(restored.game.bests['checkup:skill:read'], 3);
});

test('saved skill best and score are authoritative; migration does not pay equal or lower results', () => {
  const { game } = runtime({ skills: { history: { best: 3, score: 1, at:'2026-10-20' } } });
  game.play('history', 1);
  assert.deepEqual(game.paid, []);
  assert.equal(game.bests['checkup:skill:history'], 3);
  assert.equal(game.skills.history.best, 3);
  assert.equal(game.skills.history.score, 2);
});

test('saved latest score supplies the baseline and improvements pay only their delta', () => {
  const { game } = runtime({ skills: { motor: { score: 2, at:'2026-10-20' } } });
  game.play('motor', 0);
  assert.deepEqual(game.paid, [1]);
  assert.equal(game.bests['checkup:skill:motor'], 3);
  assert.equal(game.skills.motor.best, 3);
});

test('lower first checkup materializes prior skill best without shrinking it', () => {
  const { game } = runtime({ skills: { focus: { best: 3, score: 2, at:'2026-10-20' } } });
  game.play('focus', 3);
  assert.deepEqual(game.paid, []);
  assert.equal(game.bests['checkup:skill:focus'], 3);
  assert.equal(game.skills.focus.best, 3);
  assert.equal(game.skills.focus.score, 1);
});

test('ordinary chapter and daily activity keys retain their reward behavior', () => {
  const { game } = runtime({ bests: { 'chapter:quiz': 1, 'daily:pop': 2 } });
  game.session = { world: { id: 'chapter', games: ['quiz'] }, gameIndex: 0, starTotal: 0 };
  game.finishGame(0);
  assert.deepEqual(game.paid, [2]);
  game.session = { daily: true, world: { id: 'daily', games: ['pop'] }, gameIndex: 0, starTotal: 0 };
  game.finishGame(0);
  assert.deepEqual(game.paid, [2, 1]);
  assert.equal(game.bests['chapter:quiz'], 3);
  assert.equal(game.bests['daily:pop'], 3);
});
