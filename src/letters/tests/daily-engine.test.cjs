const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function burstRuntime(learning) {
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
  if (learning) window.MiftahGame.LettersLearning = learning;
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
  const { autoStart = true, ...ctxOverrides } = overrides;
  const game = new runtime.Burst({
    stage: runtime.stage, items, setPrompt() {}, say() {}, sfx() {},
    onDone: value => done.push(value), onPauseChange: value => pauses.push(value),
    ...ctxOverrides,
  });
  if (autoStart) game.start();
  return { game, done, pauses };
}

test('Burst renders ready without starting its clock or accepting scores, then starts once on Play', () => {
  const runtime = burstRuntime();
  const { game, done } = createBurst(runtime, { autoStart: false });
  assert.equal(game.started, false);
  assert.match(runtime.stage.markup, /aria-label="Start challenge"/);
  assert.equal(runtime.frames.length, 0);
  assert.equal(runtime.intervals.size, 0);
  const choice = lowTargetButton(runtime, game);
  game.tap(game.target, choice);
  assert.equal(game.count, 0);
  assert.equal(game.remaining, 30000);
  assert.deepEqual(done, []);

  runtime.setNow(5000);
  game.start();
  const firstDeadline = game.endsAt;
  assert.equal(game.started, true);
  assert.equal(firstDeadline, 35000);
  assert.equal(runtime.frames.length, 1);
  assert.equal(runtime.intervals.size, 1);
  runtime.setNow(7000);
  game.start();
  assert.equal(game.endsAt, firstDeadline, 'repeated Play does not reset the deadline');
  assert.equal(game.count, 0);
});

test('Burst follows the prepared, ordered learning plan and keeps every round at three choices or fewer', () => {
  const calls = [];
  const plan = [];
  const learning = { planRounds(ctx) {
    calls.push({ ...ctx, items: ctx.items.slice() });
    return plan;
  } };
  const runtime = burstRuntime(learning);
  const items = ['a', 'b', 'c', 'd', 'e'].map(id => ({ id, display: id }));
  plan.push(...items.slice(0, 3).map(target => ({ target, options: items.slice(0, 4), activity: 'burst' })));
  const { game } = createBurst(runtime, { items, autoStart: false, rounds: 50, challenge: true, extraItems: [{ id: 'extra', display: 'x' }] });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].challenge, false);
  assert.deepEqual(Array.from(calls[0].items, item => item.id), ['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(Array.from(calls[0].extraItems || [], item => item.id), []);
  assert.equal(calls[0].rounds, 5);
  assert.equal(game.target.id, 'a');
  assert.ok(runtime.stage.grid.children.length <= 3);

  // A planner change after preparation cannot add choices or replace the visit's targets.
  plan.splice(0, plan.length, { target: items[4], options: items });
  game.start();
  game.tap(game.target, lowTargetButton(runtime, game));
  assert.equal(game.target.id, 'b', 'prepared target order survives planner mutation');
  assert.ok(runtime.stage.grid.children.length <= 3);
});

test('Burst wrong answers teach once, disable that choice, and keep support for the visit', () => {
  const targets = ['a', 'b', 'a'].map(id => ({ id, display: id }));
  const choices = ['a', 'b', 'c', 'd'].map(id => ({ id, display: id }));
  const learning = { planRounds: () => targets.map(target => ({ target, options: choices, activity: 'burst' })) };
  const runtime = burstRuntime(learning);
  const outcomes = [], hints = [];
  const { game } = createBurst(runtime, {
    autoStart: false,
    reportOutcome: outcome => outcomes.push(outcome),
    showLearningHint: (...args) => hints.push(args),
  });
  game.start();
  const wrong = runtime.stage.grid.children.find(el => el.attributes['aria-label'] !== game.target.display);
  wrong.click();
  assert.equal(wrong.disabled, true);
  assert.equal(hints.length, 1);
  assert.equal(outcomes.length, 1);
  assert.equal(outcomes[0].correct, false);
  assert.equal(outcomes[0].assisted, false, 'the missed answer is recorded before support is given');
  assert.equal(outcomes[0].selectedId, wrong.attributes['aria-label']);
  assert.ok(Array.isArray(outcomes[0].choiceIds));
  assert.equal(outcomes[0].activity, 'burst');
  assert.ok(runtime.stage.grid.children.length <= 2, 'the retried round is supported');
  const countAfterWrong = outcomes.length;
  wrong.click();
  assert.equal(outcomes.length, countAfterWrong, 'a disabled wrong choice cannot report twice');

  game.tap(game.target, lowTargetButton(runtime, game));
  assert.equal(outcomes[1].assisted, true, 'the retry is recorded with the support now active');
  assert.equal(game.target.id, 'b');
  game.tap(game.target, lowTargetButton(runtime, game));
  assert.equal(game.target.id, 'a');
  assert.ok(runtime.stage.grid.children.length <= 2, 'support remains in effect later in the visit');
});

test('Burst filters unusable and duplicate items and cancels when no distinct choices remain', () => {
  const runtime = burstRuntime();
  const unusable = [null, {}, { id: 'a', display: '' }, { id: 'a', display: 'A' }, { id: 'a', display: 'duplicate' }, { id: 'b', display: 'B' }, { id: 'c', display: 'A' }];
  const { game } = createBurst(runtime, { autoStart: false, items: unusable });
  assert.ok(['a', 'b'].includes(game.target.id));
  assert.equal(runtime.stage.grid.children.length, 2);
  assert.deepEqual(runtime.stage.grid.children.map(el => el.attributes['aria-label']).sort(), ['A', 'B']);
  game.destroy();

  const emptyRuntime = burstRuntime();
  const cancelled = [];
  const empty = createBurst(emptyRuntime, {
    autoStart: false, items: [{ id: 'locked', display: '' }], cancel: reason => cancelled.push(reason),
  });
  assert.equal(empty.game.alive, false);
  assert.deepEqual(empty.done, []);
  assert.equal(cancelled.length, 1);
  assert.equal(emptyRuntime.intervals.size, 0);
});

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
  assert.ok(runtime.stage.grid.children.length <= 3,'next choices appear without waiting for the flight');
  assert.equal(runtime.stage.grid.attributes['data-count'],String(runtime.stage.grid.children.length));
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


test('Burst preview is exploration and learning starts at explicit Play', () => {
  const runtime = burstRuntime(), prompts = [];
  const { game } = createBurst(runtime, { autoStart:false, setPrompt:(_item,meta)=>prompts.push(meta) });
  assert.equal(prompts.length,1);
  assert.equal(prompts[0].promptMode,'explore');
  game.start();
  assert.equal(prompts.length,2);
  assert.equal(prompts[1].promptMode,'match');
  assert.equal(prompts[1].choiceIds.length,2);
});
