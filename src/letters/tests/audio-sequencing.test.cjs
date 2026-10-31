const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load() {
  const window = { MiftahGame: {} };
  const context = { window, Math, String, Number, Array, Object, Set, Map, Promise, Date, setTimeout, clearTimeout };
  for (const file of ['PictureWords.js', 'EarsGames.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  return window.MiftahGame;
}
const tick = () => new Promise(resolve => setImmediate(resolve));
function gameFor(kind, say) {
  const ns = load(), game = Object.create(ns.GardenPractice[kind].prototype);
  const root = { isConnected: true }, stage = { contains: node => node === root };
  Object.assign(game, { ctx: { say }, alive: true, timers: new Set(), waiters: new Map(), pendingSpeech: new Set(), speechToken: 0, roundToken: 1, root, stage });
  return { ns, game, root };
}

test('long spoken picture names stay pending until the real playback promise completes', async () => {
  const spoken = [];
  const { ns, game } = gameFor('OddSound', item => new Promise(resolve => spoken.push({ item, resolve })));
  const choices = ['one', 'two', 'three'].map(word => ({ id: word, word }));
  game.choices = choices; game.mode = 'odd'; game.busy = false; game.answerReady = false;
  const root = { isConnected: true, querySelectorAll: () => [], querySelector: () => null };
  game.root = root; game.stage = { contains: node => node === root };
  const playing = game.playWords(choices, () => {}, game.roundToken, root);
  assert.equal(spoken.length, 1);
  await new Promise(resolve => setTimeout(resolve, 5100));
  assert.equal(spoken.length, 1, 'there is no timer that pretends a long utterance ended');
  spoken[0].resolve(true); await new Promise(resolve => setTimeout(resolve, 190));
  assert.equal(spoken.length, 2);
  spoken[1].resolve(true); await new Promise(resolve => setTimeout(resolve, 190));
  assert.equal(spoken.length, 3);
  spoken[2].resolve(true);
  assert.equal(await playing, true);
  assert.deepEqual(spoken.map(x => x.item.speak), ['one', 'two', 'three']);
  game.destroy();
});

test('rejected and false audio settle as unverified; leaving resolves pending audio immediately', async () => {
  const { game } = gameFor('SameStart', () => Promise.reject(new Error('audio failed')));
  assert.equal(await game.say({ id: 'word', word: 'word' }), false);
  game.ctx.say = () => Promise.resolve(false);
  assert.equal(await game.say({ id: 'word', word: 'word' }), false);
  let resolve;
  game.ctx.say = () => new Promise(r => { resolve = r; });
  const pending = game.say({ id: 'word', word: 'word' }); await tick(); game.destroy();
  assert.equal(await pending, false); resolve(true); await tick();
});

test('a stale round token cannot start another prompt word', async () => {
  const spoken = [];
  const { game, root } = gameFor('OddSound', item => { spoken.push(item.speak); return true; });
  game.roundToken++;
  const played = await game.playWords([{ id: 'old', word: 'old' }], () => {}, game.roundToken - 1, root);
  assert.equal(played, false); assert.deepEqual(spoken, []);
  game.destroy();
});

