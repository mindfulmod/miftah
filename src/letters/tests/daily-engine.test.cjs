const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function burstRuntime() {
  let now = 0;
  let intervalId = 0;
  const frames = [];
  const intervals = new Map();
  const listeners = new Map();
  const animations = [];
  const makeClassList = () => {
    const values = new Set();
    return {
      add: value => values.add(value),
      remove: value => values.delete(value),
      contains: value => values.has(value),
      toggle(value, force) { force ? values.add(value) : values.delete(value); },
    };
  };
  const makeElement = () => ({
    classList: makeClassList(), style: {}, children: [], attributes: {},
    innerHTML: '', textContent: '',
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(name, fn) { this[name] = fn; },
    removeEventListener(name, fn) { if (this[name] === fn) delete this[name]; },
    appendChild(child) { this.children.push(child); },
    getBoundingClientRect() { return this.rect || { left: 0, top: 0, width: 48, height: 48 }; },
    animate(keyframes, options) {
      const animation = { keyframes, options, cancelled: false, cancel() { this.cancelled = true; } };
      animations.push(animation);
      return animation;
    },
    remove() { this.removed = true; },
  });
  const stage = {
    classList: makeClassList(),
    set innerHTML(value) {
      this.markup = value;
      this.ring = makeElement();
      this.count = makeElement();
      this.pauseButton = makeElement();
      this.grid = makeElement();
      this.caught = makeElement();
      this.grid.contains = el => this.grid.children.includes(el);
      Object.defineProperty(this.grid, 'innerHTML', { get() { return this.markup || ''; }, set(value) { this.markup = value; this.children = []; } });
    },
    querySelector(selector) {
      return ({ '.burst-ring-fill': this.ring, '.burst-count': this.count,
        '.burst-pause': this.pauseButton, '.burst-grid': this.grid,
        '.burst-caught': this.caught })[selector];
    },
  };
  const document = {
    hidden: false,
    createElement: makeElement,
    addEventListener(name, fn) { listeners.set(name, fn); },
    removeEventListener(name, fn) { if (listeners.get(name) === fn) listeners.delete(name); },
  };
  const window = { MiftahGame: { LettersArt: {
    icon: name => `<svg data-icon="${name}"></svg>`,
    inkShift: () => ({ dx: 0, dy: 0 }),
  } } };
  const context = {
    window, document, performance: { now: () => now },
    requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
    setInterval: fn => { const id = ++intervalId; intervals.set(id, fn); return id; },
    clearInterval: id => intervals.delete(id), setTimeout() {},
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'MiniGames.js'), 'utf8'), context);
  return {
    Burst: window.MiftahGame.LettersMiniGames.burst, stage, document, frames, intervals, listeners, animations,
    setNow(value) { now = value; },
  };
}

function createBurst(runtime, overrides = {}) {
  const items = ['a', 'b', 'c', 'd'].map(id => ({ id, display: id }));
  const done = [];
  const pauses = [];
  const game = new runtime.Burst({
    stage: runtime.stage, items, setPrompt() {}, say() {}, sfx() {},
    onDone: value => done.push(value), onPauseChange: value => pauses.push(value),
    ...overrides,
  });
  return { game, done, pauses };
}

test('Burst freezes its budget while hidden and waits for an explicit resume', () => {
  const runtime = burstRuntime();
  const { game, done, pauses } = createBurst(runtime);
  runtime.setNow(5000);
  runtime.document.hidden = true;
  runtime.listeners.get('visibilitychange')();
  assert.equal(game.paused, true);
  assert.equal(game.remaining, 25000);
  assert.equal(runtime.stage.classList.contains('is-paused'), true);
  assert.equal(runtime.stage.grid.inert, true);
  assert.equal(runtime.stage.pauseButton.attributes['aria-label'], 'Resume challenge');

  const count = game.count;
  game.tap(game.target, runtime.stage.grid.children[0]);
  assert.equal(game.count, count, 'paused input is ignored');
  runtime.setNow(90000);
  game.resume();
  assert.equal(game.paused, true, 'resume is rejected while the document is hidden');
  assert.equal(game.endsAt, 30000);
  runtime.document.hidden = false;
  runtime.listeners.get('visibilitychange')();
  game.tick(90000, false);
  assert.equal(game.paused, true);
  assert.deepEqual(done, []);

  game.resume();
  assert.equal(game.endsAt, 115000);
  assert.equal(game.paused, false);
  assert.equal(runtime.stage.grid.inert, false);
  assert.deepEqual(pauses, [true, false]);
  game.tick(114999, false);
  assert.deepEqual(done, []);
  game.tick(115000, false);
  assert.equal(done.length, 1);
});

test('Burst refreshes prompt timing before replaying speech on resume', () => {
  const runtime = burstRuntime();
  const events = [];
  const { game } = createBurst(runtime, {
    setPrompt: item => events.push(`prompt:${item.id}`),
    say: item => events.push(`say:${item.id}`),
  });
  events.length = 0;
  runtime.setNow(2000);
  game.pause();
  runtime.setNow(7000);
  game.resume();
  assert.deepEqual(events, [`prompt:${game.target.id}`, `say:${game.target.id}`]);
});

test('Burst settles a deadline reached before the tab becomes hidden', () => {
  const runtime = burstRuntime();
  const { game, done, pauses } = createBurst(runtime);
  runtime.setNow(30000);
  runtime.document.hidden = true;
  runtime.listeners.get('visibilitychange')();
  assert.equal(game.alive, false);
  assert.equal(done.length, 1);
  assert.deepEqual(pauses, []);
  runtime.listeners.get('visibilitychange')?.();
  game.tick(40000, false);
  assert.equal(done.length, 1, 'deadline and stale callbacks cannot pay twice');
});

test('Burst invalidates stale frames and removes listeners and timers on teardown', () => {
  const runtime = burstRuntime();
  const { game, pauses } = createBurst(runtime);
  const stale = runtime.frames[0];
  runtime.setNow(1000);
  game.pause();
  game.resume();
  const active = runtime.frames[1];
  stale(1100);
  assert.equal(runtime.frames.length, 2, 'stale callback did not schedule a loop');
  active(1200);
  assert.equal(runtime.frames.length, 3, 'active callback schedules one successor');
  game.pause();
  game.destroy();
  assert.equal(runtime.listeners.has('visibilitychange'), false);
  assert.equal(runtime.intervals.size, 0);
  assert.equal(runtime.stage.classList.contains('is-paused'), false);
  assert.equal(runtime.stage.pauseButton.removed, true);
  assert.deepEqual(pauses, [true, false, true, false]);
  runtime.frames[2](50000);
  assert.equal(runtime.frames.length, 3);
});

test('Burst immediately records a correct tap while the receipt animates and old tile cannot score twice',()=>{
 const runtime=burstRuntime(),outcomes=[];
 const {game}=createBurst(runtime,{reportOutcome:outcome=>outcomes.push(outcome)});
 const found=game.target,button=lowTargetButton(runtime,game);
 assert.ok(button);
 game.tap(found,button);
 assert.equal(game.count,1);
 assert.equal(outcomes.filter(outcome=>outcome.correct===true).length,1);
 assert.equal(runtime.stage.grid.children.length,4,'next choices appear without waiting for the flight');
 assert.equal(runtime.stage.grid.attributes['data-count'],'4');
 assert.equal(runtime.stage.caught.classList.contains('is-filled'),true);
 assert.ok(runtime.stage.caught.innerHTML.length>0,'receipt keeps the found glyph');
 assert.equal(runtime.animations.length,1);
 button.click();
 assert.equal(game.count,1,'a detached old choice cannot repeat the answer');
 assert.equal(outcomes.filter(outcome=>outcome.correct===true).length,1);
});

test('Burst receipt stays visible without motion and its flight cancels on pause, destroy, and deadline',()=>{
 const reduced=burstRuntime();
 const lowMotion=createBurst(reduced,{reducedMotion:()=>true}).game;
 lowMotion.tap(lowMotion.target,lowTargetButton(reduced,lowMotion));
 assert.ok(reduced.stage.caught.innerHTML.length>0);
 assert.equal(reduced.animations.length,0);

 const pauseRuntime=burstRuntime(),paused=createBurst(pauseRuntime).game;
 paused.tap(paused.target,lowTargetButton(pauseRuntime,paused));
 const pausedFlight=paused.harvestFlight;assert.ok(pausedFlight);
 pauseRuntime.setNow(5000);paused.pause();
 assert.equal(pausedFlight.cancelled,true);
 assert.equal(paused.remaining,25000);

 const destroyRuntime=burstRuntime(),destroyed=createBurst(destroyRuntime).game;
 destroyed.tap(destroyed.target,lowTargetButton(destroyRuntime,destroyed));
 const destroyedFlight=destroyed.harvestFlight;destroyed.destroy();
 assert.equal(destroyedFlight.cancelled,true);

 const deadlineRuntime=burstRuntime(),finished=createBurst(deadlineRuntime);
 finished.game.tap(finished.game.target,lowTargetButton(deadlineRuntime,finished.game));
 const deadlineFlight=finished.game.harvestFlight;
 deadlineRuntime.setNow(30000);finished.game.tick(30000,false);
 assert.equal(deadlineFlight.cancelled,true);
 assert.equal(finished.done.length,1);
});

function lowTargetButton(runtime,game){
 return runtime.stage.grid.children.find(el=>el.attributes['aria-label']===game.target.display);
}

test('daily sessions use only taught pools and separate gentle from timed play', () => {
  let weakestPool;
  const window = { MiftahGame: { LettersStrength: {
    weakest(pool, count) { weakestPool = pool.slice(); return pool.slice(0, count); },
  } } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'LettersWorlds.js'), 'utf8'), { window });
  const worlds = Object.create(window.MiftahGame.LettersWorlds.prototype);
  const item = id => ({ id, display: id });
  worlds.worlds = [
    { id: 'done-a', items: () => [item('a'), item('b'), item('c')] },
    { id: 'locked', items: () => [item('untaught')] },
    { id: 'done-b', items: () => [item('c'), item('d'), item('e'), item('f'), item('g')] },
  ];
  const gentle = worlds.dailySession(['done-a', 'done-b']);
  const challenge = worlds.dailySession(['done-a', 'done-b'], { challenge: true });
  assert.equal(gentle.id, 'daily');
  assert.deepEqual(Array.from(gentle.games), ['pop', 'feed']);
  assert.deepEqual(Array.from(challenge.games), ['burst']);
  assert.equal(gentle.optional, false);
  assert.equal(challenge.optional, true);
  assert.equal(challenge.timed, true);
  assert.ok(weakestPool.every(entry => entry.id !== 'untaught'));
  assert.ok([...gentle.items(), ...gentle.extraItems()].every(entry => entry.id !== 'untaught'));
  assert.equal(new Set([...gentle.items(), ...gentle.extraItems()].map(entry => entry.id)).size, 7);
});
