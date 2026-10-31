const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture() {
  let now = 0, nextId = 0;
  const timers = new Map(), history = new Map();
  const classes = el => el.className.split(/\s+/).filter(Boolean);
  const node = (className = '', opts = {}) => ({
    className, hidden: !!opts.hidden, disabled: !!opts.disabled, inert: !!opts.inert,
    attrs: { ...(opts.attrs || {}) }, isConnected: opts.connected !== false, children: [],
    rects: opts.visible === false ? 0 : 1, listeners: {}, clicks: 0,
    getAttribute(name) { return this.attrs[name] ?? null; },
    closest(selector) {
      for (let at = this; at; at = at.parentElement) {
        if (selector.includes('[hidden]') && at.hidden) return at;
        if (selector.includes('[inert]') && at.inert) return at;
        if (selector.includes('aria-hidden="true"') && at.attrs['aria-hidden'] === 'true') return at;
      }
      return null;
    },
    getClientRects() { return { length: this.rects }; },
    querySelectorAll(selector) {
      const choices = selector.split(',').map(x => x.trim());
      return this.children.filter(el => choices.some(sel => {
        const required = [...sel.matchAll(/\.([\w-]+)/g)].map(m => m[1]);
        return required.every(name => classes(el).includes(name));
      }));
    },
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    click() { this.clicks++; this.onclick?.(); },
  });
  const root = { nodes: [], isConnected: true, dataset: {}, listeners: {},
    querySelectorAll(selector) {
      const choices = selector.split(',').map(x => x.trim());
      return this.nodes.filter(el => choices.some(sel => {
        const required = [...sel.matchAll(/\.([\w-]+)/g)].map(m => m[1]);
        return required.every(name => classes(el).includes(name));
      }));
    },
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    emit(type) { for (const fn of this.listeners[type] || []) fn({ type }); },
  };
  const context = { window: { MiftahGame: {} }, console,
    getComputedStyle: el => ({ visibility: el.attrs['aria-hidden'] === 'true' ? 'hidden' : 'visible' }),
    setTimeout(fn, ms) { const id = ++nextId; const task = { fn, at: now + ms }; timers.set(id, task); history.set(id, task); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'LettersGame.js'), 'utf8'), context);
  const Game = context.window.MiftahGame.LettersGame;
  const source = fs.readFileSync(path.join(__dirname, '..', 'LettersGame.js'), 'utf8');
  const game = Object.create(Game.prototype);
  Object.assign(game, { root, sound: { enabled: true }, _idleGeneration: 0 });
  let guided = 0; const points = [];
  game.feel = { guide: idle => { assert.equal(idle, true); guided++; }, point: el => points.push(el) };
  async function advance(ms) {
    const end = now + ms;
    while (true) {
      const entry = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!entry) break;
      const [id, task] = entry; timers.delete(id); now = task.at; task.fn();
    }
    now = end;
  }
  function installGuide() {
    const start = source.indexOf('      this.feel.guide = (idle = false) => {');
    const end = source.indexOf('\n      this.feel.point =', start);
    assert.ok(start >= 0 && end > start, 'the live feel.guide closure is present');
    new Function('getComputedStyle', source.slice(start, end)).call(game,
      el => ({ visibility: el.attrs['aria-hidden'] === 'true' ? 'hidden' : 'visible' }));
  }
  return { game, root, node, timers, history, advance, guided: () => guided, points, installGuide };
}

test('feel.guide uses the prompt replay instead of the first arbitrary answer', () => {
  const f = fixture(), stage = f.node('practice-stage');
  const wrong = f.node('pond-answer'); const replay = f.node('play-bubble');
  stage.children = [wrong]; f.root.nodes = [stage, wrong, replay];
  f.installGuide(); f.game.feel.guide(true);
  assert.deepEqual(f.points, [replay]);
});

test('feel.guide never points at an arbitrary answer when a scene has no hint or replay', () => {
  const f = fixture(), stage = f.node('play-stage');
  const answer = f.node('pond-answer'); stage.children = [answer]; f.root.nodes = [stage, answer];
  f.installGuide(); f.game.feel.guide(true);
  assert.deepEqual(f.points, []);
});

test('feel.guide keeps explicit hints first and points to Next first even when muted', () => {
  const hinted = fixture(), stage = hinted.node('practice-stage');
  const hint = hinted.node('pond-answer is-hint'), replay = hinted.node('play-bubble');
  stage.children = [hint]; hinted.root.nodes = [stage, hint, replay];
  hinted.installGuide(); hinted.game.feel.guide(true);
  assert.deepEqual(hinted.points, [hint]);

  const held = fixture(), heldStage = held.node('play-stage');
  const next = held.node('ea-next'), sound = held.node('lg-sound'), heldReplay = held.node('play-bubble');
  heldStage.children = [held.node('pond-answer is-hint')];
  held.root.nodes = [heldStage, next, sound, heldReplay]; held.game.sound.enabled = false;
  held.installGuide(); held.game.feel.guide(true);
  assert.deepEqual(held.points, [next]);
});

test('a held completion points to Next and leaves replay, advance, and rewards untouched', async () => {
  const f = fixture(); let advances = 0, rewards = 0;
  f.game.payPractice = () => { rewards++; };
  const replay = f.node('play-bubble');
  const next = f.node('ea-next'); next.onclick = () => advances++;
  f.root.nodes = [replay, next];
  f.game.watchIdlePrompt(f.root, 10, 2);
  await f.advance(10);
  assert.equal(next.clicks, 0); assert.equal(replay.clicks, 0);
  assert.equal(advances, 0); assert.equal(rewards, 0); assert.equal(f.guided(), 0);
  assert.deepEqual(f.points, [next], 'idle help points directly at the held continuation');
  assert.equal(f.game.idleControls(f.root).next, next);
});

test('a hidden practice replay cannot mask the visible local replay controls', async () => {
  for (const className of ['ea-replay-all', 'wd-ear']) {
    const f = fixture(); let advances = 0;
    const hidden = f.node('practice-replay', { hidden: true });
    const localReplay = f.node(className); localReplay.onclick = () => {};
    const next = f.node('ea-next', { hidden: true }); next.onclick = () => advances++;
    f.root.nodes = [hidden, localReplay, next];
    f.game.watchIdlePrompt(f.root, 5, 1);
    await f.advance(5);
    assert.equal(hidden.clicks, 0, `${className}: hidden shared replay stays untouched`);
    assert.equal(localReplay.clicks, 1, `${className}: visible local replay is selected`);
    assert.equal(next.clicks, 0, `${className}: idle cue does not advance`);
    assert.equal(advances, 0, `${className}: continuation callback is untouched`);
  }
});

test('a completed train points to its ready driver without replaying or leaving by itself', async () => {
  const f = fixture(), replay = f.node('practice-replay'), drive = f.node('pz-drive', {disabled:true});
  f.root.nodes = [replay, drive];
  assert.equal(f.game.idleControls().next, null, 'boarding has no departure action');
  drive.className += ' is-ready'; drive.disabled = false;
  f.game.watchIdlePrompt(f.root, 10, 1);
  await f.advance(10);
  assert.deepEqual(f.points, [drive]);
  assert.equal(drive.clicks, 0); assert.equal(replay.clicks, 0);
  drive.disabled = true;
  assert.equal(f.game.idleControls().next, null, 'departing cannot be invoked again');
});

test('an unanswered visible prompt keeps its replay callback and guidance behavior', async () => {
  const f = fixture(); let replayed = 0;
  const replay = f.node('practice-replay'); replay.onclick = () => replayed++;
  f.root.nodes = [replay];
  f.game.watchIdlePrompt(f.root, 5, 1);
  await f.advance(5);
  assert.equal(replayed, 1); assert.equal(replay.clicks, 1); assert.equal(f.guided(), 1);
});

test('a muted prompt is guided without replaying speech', async () => {
  const f = fixture(); let replayed = 0;
  f.game.sound.enabled = false;
  const replay = f.node('play-bubble'); replay.onclick = () => replayed++;
  f.root.nodes = [replay];
  f.game.watchIdlePrompt(f.root, 5, 1);
  await f.advance(5);
  assert.equal(replayed, 0); assert.equal(f.guided(), 1);
});

test('hidden, disabled, inert, aria-hidden, and disconnected controls are skipped', () => {
  const f = fixture();
  const bad = [f.node('ea-next', { hidden: true }), f.node('wd-next', { disabled: true }),
    f.node('pond-next', { inert: true }), f.node('ea-next', { attrs: { 'aria-hidden': 'true' } }),
    f.node('ea-next', { connected: false }), f.node('practice-replay', { visible: false })];
  const hiddenParent = f.node('', { hidden: true });
  const nested = f.node('ea-next'); nested.parentElement = hiddenParent;
  bad.push(nested);
  const next = f.node('pond-next'), replay = f.node('play-bubble');
  f.root.nodes = [...bad, next, replay];
  const controls = f.game.idleControls(f.root);
  assert.equal(controls.next, next); assert.equal(controls.replay, replay);
});

test('a scene without replay controls stops after its bounded idle cues', async () => {
  const f = fixture(); f.root.nodes = [];
  f.game.watchIdlePrompt(f.root, 4, 2);
  await f.advance(8);
  assert.equal(f.guided(), 2); assert.equal(f.timers.size, 0);
});

test('pointer and keyboard activity rearm the bounded prompt sequence', async () => {
  const f = fixture(), replay = f.node('play-bubble'); f.root.nodes = [replay];
  f.game.watchIdlePrompt(f.root, 5, 2);
  await f.advance(5); assert.equal(replay.clicks, 1);
  f.root.emit('keydown'); await f.advance(5); assert.equal(replay.clicks, 2);
  f.root.emit('pointerdown'); await f.advance(5); assert.equal(replay.clicks, 3);
  assert.equal(f.timers.size, 1, 'a fresh bounded sequence is armed');
});

test('replaced watchers and disconnected or finished screens cannot run stale cues', async () => {
  const f = fixture(), replay = f.node('practice-replay'); f.root.nodes = [replay];
  f.game.watchIdlePrompt(f.root, 5, 2);
  const stale = [...f.history.values()][0];
  f.game.watchIdlePrompt(f.root, 5, 2);
  stale.fn(); assert.equal(replay.clicks, 0); assert.equal(f.guided(), 0);
  f.root.isConnected = false; await f.advance(5);
  assert.equal(replay.clicks, 0); assert.equal(f.guided(), 0);
  f.root.isConnected = true; f.game.watchIdlePrompt(f.root, 5, 2);
  f.root.dataset.practiceFinished = 'true'; await f.advance(5);
  assert.equal(replay.clicks, 0); assert.equal(f.guided(), 0);
});


test('Echo completion directs idle help to Next without replaying or advancing', async () => {
  const f = fixture(), replay = f.node('practice-replay'), next = f.node('pz-echo-next', { hidden:true });
  f.root.nodes = [replay, next];
  assert.equal(f.game.idleControls().next, null);
  next.hidden = false;
  f.game.watchIdlePrompt(f.root, 10, 1);
  await f.advance(10);
  assert.deepEqual(f.points, [next]);
  assert.equal(next.clicks, 0); assert.equal(replay.clicks, 0);
});


test('the solved shadow theatre points idle help at Next without operating the toy', async () => {
  const f = fixture(), next = f.node('sh-next', {hidden:true}), lamp = f.node('sh-light-switch');
  f.root.nodes = [lamp, next];
  assert.equal(f.game.idleControls().next, null);
  next.hidden = false;
  f.game.watchIdlePrompt(f.root, 10, 1); await f.advance(10);
  assert.deepEqual(f.points, [next]); assert.equal(next.clicks, 0); assert.equal(lamp.clicks, 0);
});


test('dot printing idle help points to Next only once the print is complete', async () => {
  const f = fixture(), stamp = f.node('pz-stamp'); f.root.nodes = [stamp];
  assert.equal(f.game.idleControls().next, null);
  stamp.className += ' is-next'; f.game.watchIdlePrompt(f.root, 10, 1); await f.advance(10);
  assert.deepEqual(f.points, [stamp]); assert.equal(stamp.clicks, 0);
});


test('matched turntable points idle help at Next without spinning or advancing', async () => {
  const f = fixture(), next = f.node('pz-same-next', {hidden:true}), turn = f.node('pz-turn');
  f.root.nodes = [turn, next];
  assert.equal(f.game.idleControls().next, null);
  next.hidden = false;
  f.game.watchIdlePrompt(f.root, 10, 1); await f.advance(10);
  assert.deepEqual(f.points, [next]); assert.equal(next.clicks, 0); assert.equal(turn.clicks, 0);
});


test('flap discovery idle guidance points at Next without closing or replaying doors', async () => {
  const f = fixture(), next = f.node('bk-peek-next', {hidden:true}), close = f.node('bk-close-doors');
  f.root.nodes = [close, next]; assert.equal(f.game.idleControls().next, null);
  next.hidden = false; f.game.watchIdlePrompt(f.root, 10, 1); await f.advance(10);
  assert.deepEqual(f.points, [next]); assert.equal(next.clicks, 0); assert.equal(close.clicks, 0);
});

test('filled sorting baskets point to Finish without replaying or submitting', async () => {
  const f=fixture(), next=f.node('bk-sort-finish',{hidden:true}), basket=f.node('bk-basket');
  f.root.nodes=[basket,next]; assert.equal(f.game.idleControls().next,null);
  next.hidden=false; f.game.watchIdlePrompt(f.root,10,1); await f.advance(10);
  assert.deepEqual(f.points,[next]); assert.equal(next.clicks,0); assert.equal(basket.clicks,0);
});

test('trip idle cue points at walking or Finish without triggering friends', async () => {
 const f=fixture(),next=f.node('bk-trip-next',{hidden:true}),friend=f.node('bk-walker');
 f.root.nodes=[friend,next];assert.equal(f.game.idleControls().next,null);
 next.hidden=false;f.game.watchIdlePrompt(f.root,10,1);await f.advance(10);
 assert.deepEqual(f.points,[next]);assert.equal(next.clicks,0);assert.equal(friend.clicks,0);
});

test('shape toy idle guidance points to Next without taking the friend apart', async () => {
 const f=fixture(),next=f.node('bk-shape-next',{hidden:true}),toy=f.node('bk-shape-unbuild');
 f.root.nodes=[toy,next];assert.equal(f.game.idleControls().next,null);
 next.hidden=false;f.game.watchIdlePrompt(f.root,10,1);await f.advance(10);
 assert.deepEqual(f.points,[next]);assert.equal(next.clicks,0);assert.equal(toy.clicks,0);
});

test('market toy idle cue points to Finish without restocking or packing', async () => {
 const f=fixture(),next=f.node('bk-market-finish',{hidden:true}),toy=f.node('bk-packed');f.root.nodes=[toy,next];assert.equal(f.game.idleControls().next,null);
 next.hidden=false;f.game.watchIdlePrompt(f.root,10,1);await f.advance(10);assert.deepEqual(f.points,[next]);assert.equal(next.clicks,0);assert.equal(toy.clicks,0);
});
