const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const tick = () => new Promise(resolve => setImmediate(resolve));
const ba = { display: 'ب', speak: 'بَاءْ' };

function setup({ native = true, fetcher, clock, omit = [] } = {}) {
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
    setTimeout: clock?.setTimeout || setTimeout, clearTimeout: clock?.clearTimeout || clearTimeout, fetch: async url => {
      requests.push(url);
      return fetcher ? fetcher(url) : { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
    } };
  for (const file of ['../data/letters.js', 'LetterVoiceClips.js', 'LettersVoice.js', 'LettersGame.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), sandbox);
  }
  const ns = window.MiftahGame;
  const game = Object.create(ns.LettersGame.prototype);
  game.sound = { enabled: true, base: { ctx }, setSpeaking: active => duck.push(active) };
  game.voice = new ns.LettersVoice({ clips: Object.fromEntries(Object.entries(ns.LETTER_VOICE_CLIPS).filter(([key]) => !omit.includes(key))), getContext: () => ctx });
  return { game, spoken, sources, requests, duck };
}

function fakeClock() {
  const timers = new Map(); let id = 0;
  return { setTimeout: (fn, ms) => { timers.set(++id, { fn, ms }); return id; },
    clearTimeout: key => timers.delete(key),
    fire(ms) { const entry = [...timers].find(([, timer]) => timer.ms === ms); assert.ok(entry, `timer ${ms} exists`); timers.delete(entry[0]); entry[1].fn(); } };
}

test('a silent learning timeout cancels a late clip download before it can start', async () => {
  const clock = fakeClock(); let release;
  const { game, sources, spoken } = setup({ clock, fetcher: () => new Promise(resolve => { release = resolve; }) });
  const heard = game.sayForLearning(ba);
  await tick(); clock.fire(2000);
  assert.equal(await heard, false);
  release({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  await tick();
  assert.equal(sources.length, 0); assert.equal(spoken.length, 0);
});

test('a playing prompt timeout stops its source and cannot end or unduck its replacement', async () => {
  const clock = fakeClock();
  const { game, sources, duck } = setup({ clock });
  const first = game.sayForLearning(ba); await tick();
  const staleEnd = sources[0].onended;
  clock.fire(6500); assert.equal(await first, false); assert.equal(sources[0].stopped, true);
  const next = game.sayForLearning(ba); await tick();
  staleEnd(); assert.equal(duck.at(-1), true); assert.equal(game.utterance !== null, true);
  sources[1].onended(); assert.equal(await next, true);
});

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

test('an approved Marin word wins even when a reading screen supplies a remote recitation path', async () => {
  const { game, sources, spoken, requests } = setup();
  game.recite = () => { throw Error('approved Marin must take priority'); };
  const heard = game.sayForLearning({ speak: 'أَعُوذُ', audioPath: 'remote-quran-word.mp3' });
  await tick(); assert.match(requests[0], /marin-curriculum-v1/); assert.equal(spoken.length, 0);
  sources[0].onended(); assert.equal(await heard, true);
});

test('new alphabet names and curriculum words use exact imported recordings until their source ends', async () => {
  const { game, spoken, sources, requests } = setup();
  for (const text of ['سِينْ', 'وَاوْ', 'يَاءْ', 'هُوَ', 'تَرَ', 'أَعُوذُ', 'يُوَسْوِسُ', 'صِرَٰطَ', 'دِينِ', 'ٱلْحَطَبِ', 'ضَمَّة', 'فَتْحَتَانْ', 'خَ', 'ظِ', 'عُ', 'بَا', 'جِي', 'قُو', 'ثَ', 'ثِ', 'ثُ', 'غَ', 'غِ', 'فِ', 'وَ', 'وِ', 'ثَا', 'صَا', 'صِي', 'صُو', 'ضَا', 'ضِي', 'ضُو']) {
    let complete = false;
    const heard = game.sayForLearning({ speak: text }).then(value => { complete = true; return value; });
    await tick();
    assert.equal(complete, false);
    assert.equal(sources.at(-1).started, true);
    assert.match(requests.at(-1), /marin-curriculum-v1\/lg-[a-f0-9]+(?:-r[1-9][0-9]*)?\.wav$/);
    sources.at(-1).onended();
    assert.equal(await heard, true);
  }
  assert.equal(spoken.length, 0);
});

test('owner-rejected words use the existing exact-text fallback without loading rejected recordings', () => {
  const { game, spoken, requests } = setup({ omit: ['ذَاتَ', 'ٱلنَّاسِ', 'ٱلْحَمْدُ', 'فَ', 'قِ'] });
  for (const text of ['ذَاتَ', 'ٱلنَّاسِ', 'ٱلْحَمْدُ', 'فَ', 'قِ']) game.say({ speak: text });
  assert.deepEqual(spoken.map(u => u.text), ['ذَاتَ', 'ٱلنَّاسِ', 'ٱلْحَمْدُ', 'فَ', 'قِ']);
  assert.deepEqual(requests, []);
});

test('unmapped short vowels, long vowels, and tanween preserve their distinct curriculum TTS', () => {
  const { game, spoken } = setup({ omit: ['ذِ', 'وُو', 'وٌ'] });
  for (const text of ['ذِ', 'وُو', 'وٌ']) game.say({ display: 'ذ', speak: text });
  assert.deepEqual(spoken.map(u => u.text), ['ذِ', 'وُو', 'وٌ']);
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
  assert.equal(game.canSpeak({ speak: 'أَذِّ' }), false);
  const heard = game.sayForLearning(ba);
  await tick(); sources[0].onended();
  assert.equal(await heard, true);
  const broken = setup({ native: false, fetcher: async () => { throw Error('missing'); } });
  assert.equal(await broken.game.sayForLearning(ba), false);
});

// Exercise the production speech route for the new exact-key local bank.
test('every newly approved teacher clip completes through local playback without native or remote speech', async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../assets/audio/letters/marin-teacher-v1/manifest.json')));
  const { game, sources, spoken, requests } = setup();
  game.recite = () => { throw Error('approved teacher clip must take priority'); };
  for (const item of manifest.items) {
    const heard = game.sayForLearning({ speak: item.text, audioPath: 'remote-unused.mp3' });
    await tick(); assert.equal(requests.at(-1), item.file);
    assert.equal(sources.at(-1).started, true);sources.at(-1).onended();assert.equal(await heard, true);
  }
  assert.equal(spoken.length, 0);
});
