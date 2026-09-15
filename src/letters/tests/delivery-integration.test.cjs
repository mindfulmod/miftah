const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function runtime({knowledge = [{char: 'ب', arName: 'بَاءْ'}, {char: 'ت', arName: 'تَاءْ'}], reduced = true, enabled = true, listen = true} = {}) {
  const window = {MiftahGame: {LettersArt: {icon: () => '<svg></svg>'}}};
  if (listen) window.speechSynthesis = {};
  const context = {window, document: {body: {classList: {toggle() {}}}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'LettersGame.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'LetterDelivery.js'), 'utf8'), context);
  const ns = window.MiftahGame;
  const stage = {
    innerHTML: '',
    addEventListener() {},
    removeEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
  let currentEl = null;
  let activityEl = null;
  let captured = null;
  let screens = 0;
  class DeliveryProbe {
    constructor(ctx) { captured = ctx; this.destroyed = false; this.destroy = () => { this.destroyed = true; }; }
  }
  ns.LetterDelivery = DeliveryProbe;
  const game = Object.create(ns.LettersGame.prototype);
  game.progress = {done: ['pack-smile']};
  game.petKnowledge = () => knowledge;
  game.worlds = {worlds: [{id: 'pack-boat', games: ['pop']}]};
  game.sound = {enabled};
  game.reduceMotion = reduced;
  game.prefersReducedMotion = () => reduced;
  game.topBar = () => '<div class="topbar"></div>';
  game.stopSpeech = () => {};
  game.petSVG = () => '<svg></svg>';
  game.wireTopBar = () => {};
  game.screen = (className) => {
    if (currentEl) currentEl.isConnected = false;
    if (game.game?.destroy) game.game.destroy();
    game.game = null;
    const el = {
      isConnected: true,
      dataset: {},
      querySelector(selector) {
        if (selector === '.practice-stage') return stage;
        if (selector === '.practice-heading') return {hidden: false};
        if (selector === '.practice-replay') return {onclick: null, innerHTML: '', textContent: ''};
        return null;
      },
    };
    currentEl = el;
    if (className === 'lg-play') activityEl = el;
    screens += 1;
    return el;
  };
  const previousGame = ns.LetterDelivery;
  const originalStart = game.startPractice;
  // Keep the production branch while letting the probe own the activity.
  game.startPractice = originalStart;
  const backCalls = [];
  const back = () => { backCalls.push(true); game.screen('lg-meet'); };
  return {
    game, ns, stage, back, backCalls, screens,
    get captured() { return captured; },
    get activity() { return game.game; },
    get currentEl() { return currentEl; },
    get activityEl() { return activityEl; },
    get screenCount() { return screens; },
    speakAvailable: context.speechSynthesis !== undefined,
    previousGame,
  };
}

test('Letter Delivery normalizes completed-pack knowledge and passes speech/motion settings', () => {
  const r = runtime({reduced: true, enabled: true, listen: true});
  let awards = 0;
  r.game.earnStars = () => { awards += 1; };
  r.game.startPractice('LetterDelivery', r.back);
  assert.deepEqual(JSON.parse(JSON.stringify(r.captured.items)), [
    {id: 'ب', display: 'ب', speak: 'بَاءْ'},
    {id: 'ت', display: 'ت', speak: 'تَاءْ'},
  ]);
  assert.equal(r.captured.reducedMotion(), true);
  assert.equal(r.captured.canListen(), true);
  assert.deepEqual(r.game.progress.done, ['pack-smile']);
  assert.equal(awards, 0);
  assert.equal(r.game.session.world.id, 'pack-boat');
  assert.equal(r.game.session.gameIndex, undefined);
  r.captured.done();
  assert.equal(r.backCalls.length, 1);
  assert.equal(r.activity, null);
  assert.equal(r.activityEl.isConnected, false);
});

test('Letter Delivery keeps reduced-motion and listen capability observable', () => {
  const r = runtime({reduced: false, enabled: false, listen: false});
  r.game.startPractice('LetterDelivery', r.back);
  assert.equal(r.captured.reducedMotion(), false);
  assert.equal(r.captured.canListen(), false);
});

test('empty completed-pack knowledge returns through back without opening or awarding', () => {
  const r = runtime({knowledge: []});
  let awards = 0;
  r.game.earnStars = () => { awards += 1; };
  r.game.startPractice('LetterDelivery', r.back);
  assert.equal(r.backCalls.length, 1);
  assert.equal(r.screenCount, 1);
  assert.equal(r.captured, null);
  assert.equal(awards, 0);
  assert.equal(r.game.progress.done.includes('pack-boat'), false);
});
