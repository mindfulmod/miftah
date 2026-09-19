const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const tick = () => new Promise(resolve => setImmediate(resolve));
const ba = { display: 'ب', speak: 'بَاءْ' };

function setup({ native = true, fetcher } = {}) {
  const spoken = [], sources = [], requests = [], duck = [];
  const speechSynthesis = { cancel() {}, getVoices: () => [], speak: utterance => spoken.push(utterance) };
  const window = { MiftahGame: {} };
  if (native) window.speechSynthesis = speechSynthesis;
  const ctx = {
    state: 'running', destination: {}, decodeAudioData: async () => ({ duration: .8 }),
    createGain: () => ({ gain: { value: 0 }, connect() {}, disconnect() {} }),
    createBufferSource() {
      const source = { connect() {}, disconnect() {}, start() { this.started = true; }, stop() { this.stopped = true; } };
      sources.push(source); return source;
    },
  };
  const sandbox = { window, speechSynthesis, SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    setTimeout, clearTimeout, fetch: async url => {
      requests.push(url);
      return fetcher ? fetcher(url) : { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
    } };
  for (const file of ['../data/letters.js', 'LetterVoiceClips.js', 'LettersVoice.js', 'LettersGame.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), sandbox);
  }
  const ns = window.MiftahGame;
  const game = Object.create(ns.LettersGame.prototype);
  game.sound = { enabled: true, base: { ctx }, setSpeaking: active => duck.push(active) };
  game.voice = new ns.LettersVoice({ clips: ns.LETTER_VOICE_CLIPS, getContext: () => ctx });
  return { game, spoken, sources, requests, duck };
}

test('bundled names count as heard only when the actual audio source ends', async () => {
  const { game, spoken, sources, requests, duck } = setup();
  let complete = false;
  const heard = game.sayForLearning(ba).then(value => { complete = true; return value; });
  await tick();
  assert.equal(complete, false);
  assert.equal(spoken.length, 0);
  assert.match(requests[0], /marin-v1\/ba\.wav$/);
  assert.equal(sources[0].started, true);
  sources[0].onended();
  assert.equal(await heard, true);
  assert.equal(duck.at(-1), false);
});

test('new alphabet names and curriculum words use exact imported recordings until their source ends', async () => {
  const { game, spoken, sources, requests } = setup();
  for (const text of ['سِينْ', 'وَاوْ', 'يَاءْ', 'هُوَ']) {
    let complete = false;
    const heard = game.sayForLearning({ speak: text }).then(value => { complete = true; return value; });
    await tick();
    assert.equal(complete, false);
    assert.equal(sources.at(-1).started, true);
    assert.match(requests.at(-1), /marin-curriculum-v1\/lg-[a-f0-9]+\.wav$/);
    sources.at(-1).onended();
    assert.equal(await heard, true);
  }
  assert.equal(spoken.length, 0);
});

test('unmapped short vowels, long vowels, and tanween preserve their distinct curriculum TTS', () => {
  const { game, spoken } = setup();
  for (const text of ['بَ', 'بَا', 'بً']) game.say({ display: 'ب', speak: text });
  assert.deepEqual(spoken.map(u => u.text), ['بَ', 'بَا', 'بً']);
});

test('joined-name lessons finish only after every locally recorded name has ended', async () => {
  const { game, sources, spoken } = setup({ native: false });
  game.voice.gapMs = 0;
  let complete = false;
  const heard = game.sayForLearning({ speak: 'سِينْ، وَاوْ، يَاءْ' }).then(value => { complete = true; return value; });
  await tick();
  for (let index = 0; index < 3; index++) {
    assert.equal(complete, false);
    assert.equal(sources[index].started, true);
    sources[index].onended();
    if (index < 2) await new Promise(resolve => setTimeout(resolve, 5));
  }
  assert.equal(await heard, true);
  assert.equal(spoken.length, 0);
});

test('a clip fetch failure falls back to native speech without prematurely ending the learning prompt', async () => {
  const { game, spoken } = setup({ fetcher: async () => { throw Error('offline miss'); } });
  let complete = false;
  const heard = game.sayForLearning(ba).then(value => { complete = true; return value; });
  await tick();
  assert.equal(complete, false);
  assert.equal(spoken.length, 1);
  spoken[0].onend();
  assert.equal(await heard, true);
});

test('replay cancels the old learning prompt and stale source callbacks cannot finish its replacement', async () => {
  const { game, sources } = setup();
  const first = game.sayForLearning(ba);
  await tick();
  const staleEnd = sources[0].onended;
  let secondDone = false;
  const second = game.sayForLearning(ba).then(value => { secondDone = true; return value; });
  await tick();
  assert.equal(await first, false);
  assert.equal(sources[0].stopped, true);
  staleEnd();
  await tick();
  assert.equal(secondDone, false);
  sources[1].onended();
  assert.equal(await second, true);
});

test('muting a loading clip cancels learning and prevents late playback or fallback', async () => {
  let resolveFetch;
  const { game, sources, spoken } = setup({ fetcher: () => new Promise(resolve => { resolveFetch = resolve; }) });
  const heard = game.sayForLearning(ba);
  game.sound.enabled = false;
  game.stopSpeech();
  resolveFetch({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  await tick();
  assert.equal(await heard, false);
  assert.equal(sources.length, 0);
  assert.equal(spoken.length, 0);
  assert.equal(game.say(ba), undefined);
});

test('bundled names remain playable without a browser speech engine; missing or broken names remain unassisted by audio', async () => {
  const { game, sources } = setup({ native: false });
  assert.equal(game.canSpeak(ba), true);
  assert.equal(game.canSpeak({ speak: 'سِينْ' }), true);
  assert.equal(game.canSpeak({ speak: 'سِينْ، وَاوْ، يَاءْ' }), true);
  assert.equal(game.canSpeak({ speak: 'بَ' }), false);
  const heard = game.sayForLearning(ba);
  await tick(); sources[0].onended();
  assert.equal(await heard, true);
  const broken = setup({ native: false, fetcher: async () => { throw Error('missing'); } });
  assert.equal(await broken.game.sayForLearning(ba), false);
});
