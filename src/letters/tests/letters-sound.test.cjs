const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function setup() {
  const calls = [];
  const timers = [];
  const gain = {value: 1, setTargetAtTime(v) { this.value = v; }};
  const base = {
    enabled: true, ctx: {currentTime: 0}, master: {gain},
    unlock() { calls.push('unlock'); return true; },
    play(name) { calls.push(name); },
    streakMelody(streak) { calls.push(`streak:${streak}`); },
    toggle() { this.enabled = !this.enabled; return this.enabled; },
  };
  const window = {MiftahGame:{}};
  let clock = 0;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../LettersSound.js'), 'utf8'), {window, performance:{now:()=>clock}});
  const sound = new window.MiftahGame.LettersSound(base, {
    now: () => clock,
    setTimeout: (fn, ms) => { const t = {fn, at: clock + ms, cancelled:false}; timers.push(t); return t; },
    clearTimeout: (t) => { if (t) t.cancelled = true; },
  });
  const tick = (ms) => { clock += ms; timers.filter(t => !t.cancelled && t.at <= clock).forEach(t => { t.cancelled = true; t.fn(); }); };
  return {sound, base, gain, calls, tick};
}

test('speech ducking restores after end and stale fallback cannot restore early', () => {
  const {sound, gain, tick} = setup();
  sound.setSpeaking(true, 1000);
  assert.equal(gain.value, 0.28);
  tick(500);
  sound.setSpeaking(true, 1000);
  tick(500);
  assert.equal(gain.value, 0.28);
  sound.setSpeaking(false);
  assert.equal(gain.value, 1);
});

test('mute is preserved and immediately drives the adapter gain to zero', () => {
  const {sound, gain, base} = setup();
  sound.toggle();
  assert.equal(base.enabled, false);
  assert.equal(gain.value, 0);
  sound.play('star1');
  assert.equal(gain.value, 0);
});

test('rapid identical rewards are throttled and reward volume is reduced', () => {
  const {sound, gain, calls, tick} = setup();
  sound.play('star1');
  assert.deepEqual(calls, ['unlock', 'star1']);
  assert.equal(gain.value, 0.72);
  sound.play('star1');
  assert.deepEqual(calls, ['unlock', 'star1']);
  tick(261);
  sound.play('star1');
  assert.deepEqual(calls, ['unlock', 'star1', 'unlock', 'star1']);
});

test('replacement speech remains ducked until its own fallback ends', () => {
  const {sound, gain, tick} = setup();
  sound.setSpeaking(true, 1800);
  tick(900);
  sound.setSpeaking(true, 1800);
  tick(1000);
  assert.equal(gain.value, 0.28);
  tick(801);
  assert.equal(gain.value, 1);
});

test('long utterance guard stays ducked until completion or the 15 second cap', () => {
  const {sound, gain, tick} = setup();
  sound.setSpeaking(true);
  tick(5000);
  assert.equal(gain.value, 0.28);
  tick(10001);
  assert.equal(gain.value, 1);
});

test('ordinary cues unlock first and use local material synthesis when available', () => {
  const {sound, base, calls} = setup();
  base.tone = (freq) => calls.push(`tone:${freq}`);
  sound.play('click');
  sound.play('page');
  sound.streakMelody(2);
  assert.deepEqual(calls, ['unlock', 'tone:1250', 'unlock', 'page', 'unlock', 'streak:2']);
});
