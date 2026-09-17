const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function setup({ clips = { 'بَاءْ': '/ba.wav' }, state = 'running', fetcher } = {}) {
  const events = [];
  const sources = [];
  const context = {
    state,
    destination: { id: 'destination' },
    resume: async () => { context.state = 'running'; events.push('resume'); },
    decodeAudioData: async bytes => { events.push(`decode:${bytes}`); return { bytes }; },
    createGain: () => ({ gain: { value: 0 }, connect(target) { this.target = target; }, disconnect() { events.push('gain-disconnect'); } }),
    createBufferSource: () => {
      const source = { connect(target) { this.target = target; }, disconnect() { events.push('source-disconnect'); }, start() { events.push('start'); }, stop() { events.push('stop'); }, onended: null };
      sources.push(source);
      return source;
    },
  };
  const fetchCalls = [];
  const fetchImpl = fetcher || (async url => { fetchCalls.push(url); return { ok: true, arrayBuffer: async () => `bytes:${url}` }; });
  const window = { MiftahGame: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../LettersVoice.js'), 'utf8'), { window, fetch: fetchImpl, setTimeout, clearTimeout, Promise });
  const voice = new window.MiftahGame.LettersVoice({ clips, getContext: () => context, fetch: fetchImpl, timeoutMs: 30 });
  return { voice, context, events, sources, fetchCalls };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('exact NFC curriculum name selects a clip, while syllable/name mismatch does not', () => {
  const { voice } = setup();
  assert.equal(voice.available, true);
  assert.equal(voice.has(' بَاءْ '), true);
  assert.equal(voice.has('باء'), false);
  assert.equal(voice.play('باء', {}, () => true), false);
});

test('play resolves through real source end only', async () => {
  const { voice, sources, events } = setup();
  const job = { onstart: () => events.push('onstart'), onend: () => events.push('onend'), onerror: () => events.push('onerror') };
  assert.equal(voice.play('بَاءْ', job), true);
  await flush(); await flush();
  assert.deepEqual(events, ['decode:bytes:/ba.wav', 'start', 'onstart']);
  sources[0].onended();
  assert.deepEqual(events, ['decode:bytes:/ba.wav', 'start', 'onstart', 'source-disconnect', 'gain-disconnect', 'onend']);
});

test('cancel while loading suppresses late start, fallback, and callbacks', async () => {
  let resolveFetch;
  const { voice, events } = setup({ fetcher: async () => ({ ok: true, arrayBuffer: () => new Promise(resolve => { resolveFetch = resolve; }) }) });
  voice.play('بَاءْ', { onstart: () => events.push('onstart'), onend: () => events.push('onend'), onerror: () => events.push('onerror') }, () => { events.push('fallback'); return true; });
  await flush();
  voice.cancel(); resolveFetch('late'); await flush(); await flush();
  assert.equal(events.some(event => ['start', 'onstart', 'onend', 'onerror', 'fallback'].includes(event)), false);
});

test('replay cancellation makes an old source end harmless', async () => {
  const { voice, sources, events } = setup();
  voice.play('بَاءْ', { onend: () => events.push('old-end') }); await flush(); await flush();
  const old = sources[0]; voice.cancel();
  voice.play('بَاءْ', { onend: () => events.push('new-end') }); await flush(); await flush();
  old.onended?.(); sources[1].onended();
  assert.deepEqual(events, ['decode:bytes:/ba.wav', 'start', 'stop', 'source-disconnect', 'gain-disconnect', 'start', 'source-disconnect', 'gain-disconnect', 'new-end']);
});

test('load failure invokes fallback once and does not cache the failure', async () => {
  let calls = 0;
  const { voice } = setup({ fetcher: async () => { calls += 1; throw new Error('nope'); } });
  let fallback = 0, error = 0;
  voice.play('بَاءْ', { onerror: () => error++ }, () => { fallback++; return true; }); await flush(); await flush();
  voice.play('بَاءْ', { onerror: () => error++ }, () => { fallback++; return true; }); await flush(); await flush();
  assert.equal(calls, 2); assert.equal(fallback, 2); assert.equal(error, 0);
});

test('fallback false emits one error', async () => {
  const { voice } = setup({ fetcher: async () => { throw new Error('nope'); } });
  let fallback = 0, error = 0;
  voice.play('بَاءْ', { onerror: () => error++ }, () => { fallback++; return false; }); await flush(); await flush();
  assert.equal(fallback, 1); assert.equal(error, 1);
});

test('suspended context resumes before starting and routes through gain to destination', async () => {
  const { voice, context, sources, events } = setup({ state: 'suspended' });
  voice.play('بَاءْ', { onstart: () => events.push('onstart') }); await flush(); await flush();
  assert.deepEqual(events, ['decode:bytes:/ba.wav', 'resume', 'start', 'onstart']);
  assert.equal(sources[0].target.target, context.destination);
  assert.equal(sources[0].target.gain.value, 0.9);
});

test('suspended resume failure uses fallback exactly once', async () => {
  const { voice, context } = setup({ state: 'suspended' });
  context.resume = async () => { throw new Error('blocked'); };
  let fallback = 0, error = 0;
  voice.play('بَاءْ', { onerror: () => error++ }, () => { fallback++; return true; });
  await flush(); await flush();
  assert.equal(fallback, 1);
  assert.equal(error, 0);
});

test('an interrupted browser audio context is resumed before playing', async () => {
  const { voice, context, sources, events } = setup({ state: 'interrupted' });
  voice.play('بَاءْ', {});
  await flush();
  assert.equal(context.state, 'running');
  assert.ok(events.indexOf('resume') < events.indexOf('start'));
  assert.equal(sources.length, 1);
  voice.cancel();
});

test('resume that resolves while still suspended falls back', async () => {
  const { voice, context } = setup({ state: 'suspended' });
  context.resume = async () => {};
  let fallback = 0;
  voice.play('بَاءْ', {}, () => { fallback++; return true; });
  await flush(); await flush();
  assert.equal(fallback, 1);
});

test('resume that never settles times out into one fallback', async () => {
  const { voice, context } = setup({ state: 'suspended' });
  context.resume = () => new Promise(() => {});
  let fallback = 0;
  voice.play('بَاءْ', {}, () => { fallback++; return true; });
  await new Promise(resolve => setTimeout(resolve, 45));
  assert.equal(fallback, 1);
});

test('natural end disconnects source and gain', async () => {
  const { voice, sources, events } = setup();
  voice.play('بَاءْ', { onend: () => events.push('onend') }); await flush(); await flush();
  sources[0].onended();
  assert.deepEqual(events.slice(-3), ['source-disconnect', 'gain-disconnect', 'onend']);
});

test('cancel during resume suppresses late start and fallback', async () => {
  let resolveResume;
  const { voice, context, events } = setup({ state: 'suspended' });
  context.resume = () => new Promise(resolve => { resolveResume = resolve; });
  voice.play('بَاءْ', { onstart: () => events.push('onstart'), onerror: () => events.push('onerror') }, () => { events.push('fallback'); return true; });
  await flush(); await flush();
  voice.cancel(); resolveResume(); await flush(); await flush();
  assert.equal(events.some(event => ['start', 'onstart', 'onerror', 'fallback'].includes(event)), false);
});
