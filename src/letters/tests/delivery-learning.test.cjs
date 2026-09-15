const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function classes() {
  const values = new Set();
  return { add: (...xs) => xs.forEach(x => values.add(x)), remove: (...xs) => xs.forEach(x => values.delete(x)),
    toggle: (x, on) => on ? values.add(x) : values.delete(x), contains: x => values.has(x) };
}
function element(dataset = {}) {
  return { dataset, disabled: false, innerHTML: '', style: {}, classList: classes(),
    setAttribute() {}, addEventListener() {}, removeEventListener() {}, focus() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100 }) };
}
function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
function runtime({ profile = () => ({ promptMode: 'listen', choiceCount: 3, skill: 'letter-name' }), say, canListen = true } = {}) {
  const timers = [];
  let packets = [];
  const nodes = {};
  const stage = {
    addEventListener() {}, removeEventListener() {},
    set innerHTML(value) {
      packets = [...value.matchAll(/class="delivery-packet" data-item="([^"]+)"/g)].map(match => element({ item: match[1] }));
      nodes.destination = element(); nodes.listen = element(); nodes.help = element(); nodes.status = element(); nodes.pet = element();
    },
    querySelector(selector) { return ({ '.delivery-destination': nodes.destination, '.delivery-listen': nodes.listen,
      '.delivery-help': nodes.help, '.delivery-status': nodes.status, '.delivery-pet': nodes.pet })[selector]; },
    querySelectorAll(selector) { return selector === '.delivery-packet' ? packets : []; },
  };
  const window = { MiftahGame: { LettersArt: { inkShift: () => ({ dx: 0, dy: 0 }), icon: name => `<${name}>` }, LettersLearning: { profile } } };
  const context = { window,
    setTimeout(fn, delay) { const timer = { fn, delay, cleared: false }; timers.push(timer); return timer; },
    clearTimeout(timer) { timer.cleared = true; },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'GardenPractice.js'), 'utf8'), context);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'LetterDelivery.js'), 'utf8'), context);
  let listenable = canListen;
  const calls = { prompts: [], outcomes: [], correct: 0, said: 0 };
  const ctx = { stage,
    items: ['a', 'b', 'c', 'd'].map(id => ({ id, display: id })),
    canListen: () => listenable, reducedMotion: () => true,
    petArt: '', prompt: (item, meta) => calls.prompts.push([item?.id || null, meta]),
    say: item => { calls.said += 1; return say ? say(item, calls.said) : true; },
    reportOutcome: outcome => calls.outcomes.push(outcome), correct: () => { calls.correct += 1; }, done() {},
  };
  const game = new window.MiftahGame.LetterDelivery(ctx);
  const flushAdvance = () => { const timer = timers.find(value => !value.cleared && value.delay === 0 && !value.ran); if (timer) { timer.ran = true; timer.fn(); } };
  return { game, ctx, nodes, calls, timers, flushAdvance, setListenable: value => { listenable = value; }, get packets() { return packets; } };
}

test('beginner matching profile keeps all Delivery rounds at two visible choices', () => {
  const r = runtime({ profile: () => ({ promptMode: 'match', choiceCount: 2, skill: 'letter-name' }) });
  for (let round = 0; round < 4; round += 1) {
    assert.equal(r.packets.length, 2);
    assert.equal(r.calls.prompts.at(-1)[0], r.game.target.id);
    const target = r.packets.find(button => button.dataset.item === r.game.target.id);
    target.onclick(); r.nodes.destination.onclick(); r.flushAdvance();
  }
  assert.ok(r.calls.outcomes.every(outcome => outcome.independent === false));
});

test('unconfirmed adapters never count as heard, and pending prompts reject delivery', async () => {
  const unknown=runtime({say:()=>undefined});
  assert.equal(unknown.game.revealed,true);assert.equal(unknown.game.speechConfirmed,false);
  const pending=deferred(),r=runtime({say:()=>pending.promise});
  r.game.offer(r.game.target);assert.equal(r.calls.correct,0);assert.equal(r.calls.outcomes.length,0);
  pending.resolve(true);await settle();r.game.offer(r.game.target);assert.equal(r.calls.correct,1);
});

test('visible matching records its own evidence without revealing the correct packet',()=>{
  const r=runtime({profile:()=>({promptMode:'match',choiceCount:2,skill:'letter-name'})});
  assert.equal(r.packets.some(packet=>packet.classList.contains('is-help')),false);
  r.game.offer(r.game.target);
  assert.equal(r.calls.outcomes[0].evidence,'supported_visible_matching');
  assert.equal(r.calls.outcomes[0].independent,false);
});

test('speech API presence does not earn listening credit when playback fails', async () => {
  const failed = deferred();
  const r = runtime({ say: () => failed.promise });
  assert.equal(r.game.waitingForSpeech, true);
  assert.ok(r.packets.every(button => button.disabled));
  failed.resolve(false); await settle();
  assert.equal(r.game.revealed, true);
  assert.equal(r.game.assisted, true);
  assert.equal(r.calls.prompts.at(-1)[0], r.game.target.id);
  assert.equal(r.packets.find(button => button.dataset.item === r.game.target.id).classList.contains('is-help'), true);
});

test('muting during a pending prompt reveals support and ignores its late success', async () => {
  const pending = deferred();
  const r = runtime({ say: () => pending.promise });
  r.setListenable(false); r.game.onSoundChange();
  assert.equal(r.game.revealed, true);
  assert.equal(r.game.assisted, true);
  pending.resolve(true); await settle();
  assert.equal(r.game.speechConfirmed, false);
  assert.equal(r.game.revealed, true);
});

test('replay supersedes a stale speech attempt without causing spurious help', async () => {
  const first = deferred(), replay = deferred();
  const r = runtime({ say: (_item, attempt) => attempt === 1 ? first.promise : replay.promise });
  r.nodes.listen.onclick();
  first.resolve(false); await settle();
  assert.equal(r.game.revealed, false);
  replay.resolve(true); await settle();
  assert.equal(r.game.speechConfirmed, true);
  assert.equal(r.game.assisted, false);
  assert.ok(r.packets.every(button => !button.disabled));

  const wrong = r.packets.find(button => button.dataset.item !== r.game.target.id);
  wrong.onclick(); r.nodes.destination.onclick();
  const target = r.packets.find(button => button.dataset.item === r.game.target.id);
  target.onclick(); r.nodes.destination.onclick();
  assert.equal(r.calls.outcomes.length, 2);
  const choiceIds = Array.from(r.game.options, item => item.id);
  assert.deepEqual(JSON.parse(JSON.stringify(r.calls.outcomes.map(outcome => ({
    correct: outcome.correct, selectedId: outcome.selectedId, choiceIds: outcome.choiceIds,
    skill: outcome.skill, activity: outcome.activity,
  })))), [
    { correct: false, selectedId: wrong.dataset.item, choiceIds, skill: 'letter-name', activity: 'LetterDelivery' },
    { correct: true, selectedId: target.dataset.item, choiceIds, skill: 'letter-name', activity: 'LetterDelivery' },
  ]);
  assert.equal(r.calls.outcomes[1].assisted, true);
});
