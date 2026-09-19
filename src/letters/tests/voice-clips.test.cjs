const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function setup({ clips = { 'بَاءْ': '/ba.wav' }, state = 'running', fetcher, gapMs = 1, names = ['بَاءْ'], startImpl } = {}) {
  const events = [];
  const sources = [];
  const context = {
    state,
    destination: { id: 'destination' },
    resume: async () => { context.state = 'running'; events.push('resume'); },
    decodeAudioData: async bytes => { events.push(`decode:${bytes}`); return { bytes }; },
    createGain: () => ({ gain: { value: 0 }, connect(target) { this.target = target; }, disconnect() { events.push('gain-disconnect'); } }),
    createBufferSource: () => {
      const ordinal = sources.length + 1;
      const source = { connect(target) { this.target = target; }, disconnect() { events.push('source-disconnect'); }, start() { if (startImpl?.(ordinal)) throw new Error('start failed'); events.push('start'); }, stop() { events.push('stop'); }, onended: null };
      sources.push(source);
      return source;
    },
  };
  const fetchCalls = [];
  const fetchImpl = fetcher || (async url => { fetchCalls.push(url); return { ok: true, arrayBuffer: async () => `bytes:${url}` }; });
  const window = { MiftahGame: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../LettersVoice.js'), 'utf8'), { window, fetch: fetchImpl, setTimeout, clearTimeout, Promise });
  const voice = new window.MiftahGame.LettersVoice({ clips, getContext: () => context, fetch: fetchImpl, timeoutMs: 30, gapMs, names });
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

test('a comma-separated phrase preloads exact clips and plays them as one job', async () => {
  const { voice, sources, events, fetchCalls } = setup({ clips: { 'بَاءْ': '/ba.wav', 'تَاءْ': '/ta.wav' }, names: ['بَاءْ', 'تَاءْ'] });
  const job = { onstart: () => events.push('onstart'), onend: () => events.push('onend') };
  assert.equal(voice.play('بَاءْ، تَاءْ', job), true);
  await flush(); await flush();
  assert.deepEqual(fetchCalls.sort(), ['/ba.wav', '/ta.wav']);
  assert.deepEqual(events, ['decode:bytes:/ba.wav', 'decode:bytes:/ta.wav', 'start', 'onstart']);
  sources[0].onended();
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.deepEqual(events.filter(event => event === 'onstart'), ['onstart']);
  assert.equal(sources.length, 2);
  sources[1].onended();
  assert.deepEqual(events.slice(-3), ['source-disconnect', 'gain-disconnect', 'onend']);
});

test('an exact phrase clip takes precedence over its comma-separated components', async () => {
  const { voice, fetchCalls } = setup({ clips: { 'بَاءْ': '/ba.wav', 'تَاءْ': '/ta.wav', 'بَاءْ، تَاءْ': '/phrase.wav' }, names: ['بَاءْ', 'تَاءْ'] });
  assert.equal(voice.play('بَاءْ، تَاءْ', {}), true);
  await flush(); await flush();
  assert.deepEqual(fetchCalls, ['/phrase.wav']);
});

test('a missing sequence component leaves the full phrase for device fallback', () => {
  const { voice } = setup({ clips: { 'بَاءْ': '/ba.wav' }, names: ['بَاءْ', 'تَاءْ'] });
  assert.equal(voice.play('بَاءْ، تَاءْ', {}, () => { throw new Error('must not use local fallback'); }), false);
});

test('cancel during the natural sequence gap prevents the next clip and completion', async () => {
  const { voice, sources, events } = setup({ clips: { 'بَاءْ': '/ba.wav', 'تَاءْ': '/ta.wav' }, names: ['بَاءْ', 'تَاءْ'], gapMs: 20 });
  voice.play('بَاءْ، تَاءْ', { onend: () => events.push('onend') });
  await flush(); await flush();
  sources[0].onended();
  voice.cancel();
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(sources.length, 1);
  assert.equal(events.includes('onend'), false);
});

test('a later clip load failure falls back before any sequence clip starts', async () => {
  const { voice, events } = setup({
    clips: { 'بَاءْ': '/ba.wav', 'تَاءْ': '/ta.wav' },
    names: ['بَاءْ', 'تَاءْ'],
    fetcher: async url => url === '/ta.wav' ? { ok: false, arrayBuffer: async () => 'bad' } : { ok: true, arrayBuffer: async () => 'good' },
  });
  let fallback = 0;
  voice.play('بَاءْ، تَاءْ', {}, () => { fallback++; return true; });
  await flush(); await flush();
  assert.equal(fallback, 1);
  assert.equal(events.includes('start'), false);
});

test('has reports only a fully covered sequence of registered letter names', () => {
  const { voice } = setup({ clips: { 'بَاءْ': '/ba.wav', 'تَاءْ': '/ta.wav', 'بَتْ': '/bat.wav' }, names: ['بَاءْ', 'تَاءْ'] });
  assert.equal(voice.has('بَاءْ، تَاءْ'), true);
  assert.equal(voice.has('بَاءْ، تَاءْ،'), false);
  assert.equal(voice.has('بَاءْ، ثَاءْ'), false);
  assert.equal(voice.has('بَتْ، تَاءْ'), false);
  assert.equal(voice.play('بَتْ، تَاءْ', {}), false);
});

test('a second source start failure reports one error without repeating fallback', async () => {
  const { voice, sources, events } = setup({
    clips: { 'بَاءْ': '/ba.wav', 'تَاءْ': '/ta.wav' }, names: ['بَاءْ', 'تَاءْ'], startImpl: ordinal => ordinal === 2,
  });
  let fallback = 0, error = 0, ended = 0;
  voice.play('بَاءْ، تَاءْ', { onerror: () => error++, onend: () => ended++ }, () => { fallback++; return true; });
  await flush(); await flush();
  sources[0].onended();
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(fallback, 0);
  assert.equal(error, 1);
  assert.equal(ended, 0);
  assert.equal(events.filter(event => event === 'start').length, 1);
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
