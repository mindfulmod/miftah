const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const gameSource = fs.readFileSync(path.join(__dirname, '..', 'LettersGame.js'), 'utf8');

function extractMethod(name, nextName) {
  const start = gameSource.indexOf(`    ${name}(`);
  const end = gameSource.indexOf(`    ${nextName}(`, start);
  assert.ok(start >= 0 && end > start, `method ${name} should be present`);
  const method = gameSource.slice(start, end).trim();
  return new Function('todayStr', `return ({ ${method} }).${name};`)(() => '2026-10-21');
}

const payPractice = extractMethod('payPractice', 'finishBloom');
const practiceReturn = extractMethod('practiceReturn', 'renderPracticeGarden');

class FakeElement {
  constructor(className = '') {
    this.className = className;
    this.classes = new Set(className.split(/\s+/).filter(Boolean));
    this.attributes = {};
    this.children = [];
    this.disabled = false;
    this.hidden = false;
    this.inert = false;
    this.isConnected = true;
    this.focusCalls = [];
    this.dataset = {};
    this.classList = {
      add: name => this.classes.add(name),
      contains: name => this.classes.has(name),
    };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  focus(options) { this.focusCalls.push(options); }
  replaceChildren(...children) {
    for (const child of this.children) child.parentNode = null;
    this.children = children;
    for (const child of children) child.parentNode = this;
  }
  contains(node) {
    return this.children.includes(node) || this.children.some(child => child.contains?.(node));
  }
  querySelector(selector) {
    const cls = selector.startsWith('.') ? selector.slice(1) : '';
    return this.querySelectorAll(selector).find(node => node.classes.has(cls)) || null;
  }
  querySelectorAll(selector) {
    const cls = selector.startsWith('.') ? selector.slice(1) : '';
    const matches = node => selector === 'button' ? node.tagName === 'button' : !!cls && node.classes.has(cls);
    const found = [];
    const visit = node => {
      for (const child of node.children) {
        if (matches(child)) found.push(child);
        visit(child);
      }
    };
    visit(this);
    return found;
  }
  set innerHTML(html) {
    this._innerHTML = String(html);
    this.replaceChildren();
    const buttons = [...this._innerHTML.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
    for (const [, attrs] of buttons) {
      const button = new FakeElement((attrs.match(/class="([^"]*)"/) || [])[1] || '');
      button.tagName = 'button';
      const label = attrs.match(/aria-label="([^"]*)"/);
      if (label) button.setAttribute('aria-label', label[1]);
      this.appendChild(button);
    }
  }
  get innerHTML() { return this._innerHTML || ''; }
  appendChild(child) { this.children.push(child); child.parentNode = this; return child; }
}

function fixture() {
  const timers = new Map();
  let timerId = 0;
  const sounds = [];
  const calls = [];
  const document = { createElement: () => new FakeElement() };
  const window = { MiftahGame: { LettersArt: { icon: name => `<svg>${name}</svg>` }, PracticeFinishArt: { scene: options => `<scene paid="${options.paid}"/>` } } };
  const context = {
    window, document,
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'PracticeFinish.js'), 'utf8'), context);
  const screen = new FakeElement('lg-play');
  screen.dataset = {};
  screen.querySelector = selector => selector === '.practice-heading' ? heading : null;
  const heading = new FakeElement('practice-heading');
  const stage = new FakeElement('practice-stage');
  screen.appendChild(stage);
  const runTimers = () => {
    const pending = [...timers.entries()];
    timers.clear();
    pending.forEach(([, timer]) => timer.fn());
  };
  return { api: window.MiftahGame.PracticeFinish, screen, stage, heading, timers, runTimers, sounds, calls };
}

test('finish waits for the child to continue; timers never navigate on their own', () => {
  const f = fixture();
  const cleanup = f.api.mount({ screen: f.screen, stage: f.stage, paid: true, go: () => f.calls.push('continue'), sound: cue => f.sounds.push(cue) });
  f.runTimers();
  assert.deepEqual(f.calls, []);
  assert.deepEqual(f.sounds, ['star1']);
  assert.equal(f.screen.dataset.practiceFinished, 'true');
  f.stage.querySelector('.practice-finish-next').onclick();
  assert.deepEqual(f.calls, ['continue']);
  cleanup();
});

test('unpaid finish has no reward sound and the presenter does not alter reward state', () => {
  const f = fixture();
  const wallet = { earned: 7, spent: 2 };
  const before = { ...wallet };
  f.screen.wallet = wallet;
  let writes = 0;
  f.screen.saveJSON = () => { writes++; };
  f.api.mount({ screen: f.screen, stage: f.stage, paid: false, go() {}, sound: cue => f.sounds.push(cue) });
  f.runTimers();
  assert.deepEqual(f.sounds, []);
  assert.deepEqual(wallet, before);
  assert.equal(writes, 0);
  assert.equal(f.timers.size, 0);
});

test('the picture invitation is optional, explicit and shares the one-shot finish guard', () => {
  const picture = 'data:image/png;base64,iVBORw0KGgo=';
  const f = fixture();
  f.api.mount({ screen:f.screen, stage:f.stage, go:()=>f.calls.push('continue'), replay:()=>f.calls.push('replay'),
    creation:{picture,open:()=>f.calls.push('garden')} });
  f.runTimers(); assert.deepEqual(f.calls, []);
  const invitation=f.stage.querySelector('.practice-finish-picture'); assert.ok(invitation);
  invitation.onclick(); f.stage.querySelector('.practice-finish-next').onclick(); invitation.onclick();
  assert.deepEqual(f.calls,['garden']); assert.equal(invitation.disabled,true);
  const g=fixture();g.api.mount({screen:g.screen,stage:g.stage,go:()=>g.calls.push('continue'),creation:{picture,open:()=>g.calls.push('garden')}});
  g.stage.querySelector('.practice-finish-next').onclick();assert.deepEqual(g.calls,['continue']);
});

test('invalid picture sources cannot become invitations, and stale invitations are inert', () => {
  for(const picture of ['https://example.test/picture.png','data:image/png;base64," onload="bad','data:image/png;base64,'+'A'.repeat(60001)]) {
    const f=fixture(); f.api.mount({screen:f.screen,stage:f.stage,go(){},creation:{picture,open(){}}});
    assert.equal(f.stage.querySelector('.practice-finish-picture'),null);
  }
  const f=fixture();const cleanup=f.api.mount({screen:f.screen,stage:f.stage,go(){},creation:{picture:'data:image/png;base64,AAAA',open:()=>f.calls.push('garden')}});
  const invitation=f.stage.querySelector('.practice-finish-picture');cleanup();invitation.onclick();assert.deepEqual(f.calls,[]);
});

test('continue and replay are one-shot choices, with replay available only when supplied', () => {
  const f = fixture();
  f.api.mount({ screen: f.screen, stage: f.stage, go: () => f.calls.push('continue'), replay: () => f.calls.push('replay') });
  const replay = f.stage.querySelector('.practice-finish-replay');
  const next = f.stage.querySelector('.practice-finish-next');
  replay.onclick();
  next.onclick();
  replay.onclick();
  assert.deepEqual(f.calls, ['replay']);
  assert.equal(replay.disabled, true);
  assert.equal(next.disabled, true);

  const g = fixture();
  g.api.mount({ screen: g.screen, stage: g.stage, go() {} });
  assert.equal(g.stage.querySelector('.practice-finish-replay'), null);
});

test('destroying before the earned-star cue cancels sound and makes old controls inert', () => {
  const f = fixture();
  const cleanup = f.api.mount({ screen: f.screen, stage: f.stage, paid: true, go: () => f.calls.push('continue'), sound: cue => f.sounds.push(cue) });
  const next = f.stage.querySelector('.practice-finish-next');
  cleanup();
  f.runTimers();
  next.onclick();
  assert.deepEqual(f.sounds, []);
  assert.deepEqual(f.calls, []);
  assert.equal(next.disabled, true);
});

test('detached or replaced finish roots cannot run callbacks', () => {
  for (const detach of [
    f => { f.screen.isConnected = false; },
    f => { f.stage.replaceChildren(new FakeElement('other-content')); },
  ]) {
    const f = fixture();
    f.api.mount({ screen: f.screen, stage: f.stage, paid: true, go: () => f.calls.push('continue'), sound: cue => f.sounds.push(cue) });
    const oldNext = f.stage.querySelector('.practice-finish-next');
    detach(f);
    f.runTimers();
    oldNext.onclick();
    assert.deepEqual(f.sounds, []);
    assert.deepEqual(f.calls, []);
  }
});

test('finish focuses Continue and removes the live heading from interaction', () => {
  const f = fixture();
  f.api.mount({ screen: f.screen, stage: f.stage, go() {} });
  const focus = f.stage.querySelector('.practice-finish-next').focusCalls;
  assert.equal(focus.length, 1);
  assert.equal(focus[0].preventScroll, true);
  assert.equal(f.heading.hidden, true);
  assert.equal(f.heading.inert, true);
});

function rewardGame({ wallet = { earned: 4 }, legacy = null, failKeys = [] } = {}) {
  const writes = [];
  const game = {
    wallet,
    loadJSON(key) { return key === 'quran-trainer:letters:practice-paid' ? legacy : null; },
    saveJSON(key, value) {
      writes.push([key, structuredClone(value)]);
      return !failKeys.includes(key);
    },
  };
  return { game, writes };
}

test('failed wallet write leaves balance and receipt untouched, so a retry can succeed once', () => {
  const failedKey = 'quran-trainer:letters:wallet';
  const { game, writes } = rewardGame({ failKeys: [failedKey] });
  const originalWallet = game.wallet;
  assert.equal(payPractice.call(game, 'Feed'), false);
  assert.equal(game.wallet, originalWallet);
  assert.deepEqual(game.wallet, { earned: 4 });
  assert.deepEqual(writes.map(([key]) => key), [failedKey]);

  game.saveJSON = (key, value) => { writes.push([key, structuredClone(value)]); return true; };
  assert.equal(payPractice.call(game, 'Feed'), true);
  assert.equal(game.wallet.earned, 5);
  assert.deepEqual(game.wallet.practicePaid, { day: '2026-10-21', kinds: ['Feed'] });
  assert.equal(payPractice.call(game, 'Feed'), false);
  assert.equal(game.wallet.earned, 5);
});

test('a failed legacy mirror cannot reopen a reward already recorded in the wallet ledger', () => {
  const walletKey = 'quran-trainer:letters:wallet';
  const mirrorKey = 'quran-trainer:letters:practice-paid';
  let storedWallet = { earned: 1 };
  let legacy = null;
  const writes = [];
  const game = {
    wallet: storedWallet,
    loadJSON: key => key === mirrorKey ? legacy : null,
    saveJSON(key, value) {
      writes.push(key);
      if (key === walletKey) { storedWallet = structuredClone(value); return true; }
      return false;
    },
  };
  assert.equal(payPractice.call(game, 'SameStart'), true);
  assert.deepEqual(game.wallet.practicePaid, { day: '2026-10-21', kinds: ['SameStart'] });
  game.wallet = structuredClone(storedWallet); // simulate a reload after the mirror failed
  assert.equal(payPractice.call(game, 'SameStart'), false);
  assert.equal(game.wallet.earned, 2);
  assert.deepEqual(writes, [walletKey, mirrorKey]);
});

test('legacy receipts merge with the wallet ledger, enforce the daily cap, and roll over by day', () => {
  const legacy = { day: '2026-10-21', kinds: ['A', 'B', 'C', 'D'] };
  const { game } = rewardGame({ wallet: { earned: 10, practicePaid: { day: '2026-10-21', kinds: ['E'] } }, legacy });
  assert.equal(payPractice.call(game, 'E'), false, 'wallet-ledger duplicate is blocked');
  assert.equal(payPractice.call(game, 'F'), false, 'combined same-day receipts already reached five');
  assert.equal(game.wallet.earned, 10);

  const nextDay = rewardGame({ wallet: { earned: 10, practicePaid: { day: '2026-10-20', kinds: ['A', 'B', 'C', 'D', 'E'] } }, legacy: { day: '2026-10-20', kinds: ['A', 'B', 'C', 'D', 'E'] } });
  assert.equal(payPractice.call(nextDay.game, 'A'), true, 'yesterday does not block a fresh daily reward');
  assert.deepEqual(nextDay.game.wallet.practicePaid, { day: '2026-10-21', kinds: ['A'] });
});

test('invalid reward amounts never modify the wallet or write a receipt', () => {
  for (const earned of [-1, NaN, 'not-a-number', Infinity, Number.MAX_SAFE_INTEGER]) {
    const { game, writes } = rewardGame({ wallet: { earned } });
    const before = game.wallet;
    assert.equal(payPractice.call(game, 'Feed'), false);
    assert.equal(game.wallet, before);
    assert.deepEqual(writes, []);
  }
  for (const kind of ['', null, 2]) {
    const { game, writes } = rewardGame();
    assert.equal(payPractice.call(game, kind), false);
    assert.deepEqual(writes, []);
  }
});

test('returning to the practice hub restores its scroll and focuses the source toy', () => {
  const source = { dataset: { kind: 'FriendPairs' }, focusOptions: null, focus(options) { this.focusOptions = options; } };
  const returnedHub = { scrollTop: 0, querySelectorAll: () => [source] };
  const game = { root: { querySelector: selector => selector === '.practice-garden-hub' ? returnedHub : null } };
  let rendered = 0;
  const oldHub = { scrollTop: 276 };
  practiceReturn.call(game, { querySelector: () => oldHub }, 'FriendPairs', () => { rendered++; })();
  assert.equal(rendered, 1);
  assert.equal(returnedHub.scrollTop, 276);
  assert.deepEqual(source.focusOptions, { preventScroll: true });
});

function practiceStartRuntime(Probe) {
  const timers = [];
  const tried = [];
  const screens = [];
  const window = { MiftahGame: { LettersArt: { icon: () => '<svg/>' }, GardenPractice: { DotGarden: Probe } } };
  const context = {
    window,
    console: { error() {} },
    setTimeout(fn, delay = 0) { const timer = { fn, delay, canceled: false }; timers.push(timer); return timer; },
    clearTimeout(timer) { if (timer) timer.canceled = true; },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'LettersGame.js'), 'utf8'), context);
  const game = Object.create(window.MiftahGame.LettersGame.prototype);
  Object.assign(game, {
    session: { world: { id: 'pack-boat', items: () => [] }, items: [{ id: 'ba', display: 'بَ' }] },
    worlds: { worlds: [{ id: 'pack-boat', games: ['pop'] }] },
    progress: { done: [] },
    wallet: { earned: 0 },
    sound: { play() {} },
    loadJSON(key, fallback) { return key === 'quran-trainer:letters:tried' ? tried.slice() : fallback; },
    saveJSON(key, value) { if (key === 'quran-trainer:letters:tried') tried.splice(0, tried.length, ...value); return true; },
    topBar: () => '<top/>', petSVG: () => '<pet/>', stopSpeech() {}, wireTopBar() {},
    prefersReducedMotion: () => true, canSpeak: () => false, sayForLearning() {},
    confettiAt() {}, fitStage() {}, keepFocus() {}, petLife: () => null,
    screen() {
      const stage = { dataset: {}, classList: { add() {} }, defer(fn, delay = 0) { const timer = { fn, delay, canceled: false }; timers.push(timer); return timer; } };
      const heading = { hidden: false };
      const replay = { hidden: false, setAttribute() {}, textContent: '', innerHTML: '' };
      const el = {
        isConnected: true, dataset: {}, classList: { add() {} },
        querySelector(selector) {
          if (selector === '.practice-stage') return stage;
          if (selector === '.practice-heading') return heading;
          if (selector === '.practice-replay') return replay;
          return null;
        },
      };
      screens.push(el);
      return el;
    },
  });
  const back = () => {
    const el = screens.at(-1);
    if (el) el.isConnected = false;
    game.game = null;
  };
  const flush = (limit = Infinity) => {
    timers.sort((a, b) => a.delay - b.delay);
    while (timers.length && timers[0].delay <= limit) {
      const timer = timers.shift();
      if (!timer.canceled) timer.fn();
    }
  };
  return { game, tried, screens, timers, back, flush };
}

test('only a live successfully constructed practice loses its new marker', () => {
  class LiveGame { constructor(ctx) { this.ctx = ctx; } destroy() {} }
  const live = practiceStartRuntime(LiveGame);
  live.game.startPractice('DotGarden', live.back);
  assert.deepEqual(live.tried, []);
  live.flush(349);
  assert.deepEqual(live.tried, []);
  live.flush(350);
  assert.deepEqual(live.tried, ['DotGarden']);

  const canceled = practiceStartRuntime(class { constructor(ctx) { ctx.stage.defer(() => ctx.cancel(), 300); } destroy() {} });
  canceled.game.startPractice('DotGarden', canceled.back);
  canceled.flush();
  assert.deepEqual(canceled.tried, [], 'deferred empty-plan cancellation keeps the invitation');

  const immediate = practiceStartRuntime(class { constructor(ctx) { ctx.cancel(); } destroy() {} });
  immediate.game.startPractice('DotGarden', immediate.back);
  immediate.flush();
  assert.deepEqual(immediate.tried, [], 'synchronous cancellation keeps the invitation');
});

test('unsupported, empty, throwing, and departed practices never retire the new invitation', () => {
  const unsupported = practiceStartRuntime(class { constructor() {} });
  unsupported.game.startPractice('NotAToy', unsupported.back);
  assert.deepEqual(unsupported.tried, []);

  const empty = practiceStartRuntime(class { constructor() {} });
  empty.game.session.items = [];
  empty.game.startPractice('DotGarden', empty.back);
  empty.flush();
  assert.deepEqual(empty.tried, []);

  const throwing = practiceStartRuntime(class { constructor() { throw new Error('empty'); } });
  throwing.game.startPractice('DotGarden', throwing.back);
  throwing.flush();
  assert.deepEqual(throwing.tried, []);

  const departed = practiceStartRuntime(class { constructor() { this.destroy = () => {}; } });
  departed.game.startPractice('DotGarden', departed.back);
  departed.screens[0].isConnected = false;
  departed.flush();
  assert.deepEqual(departed.tried, []);

  const replaced = practiceStartRuntime(class { constructor() { this.destroy = () => {}; } });
  replaced.game.startPractice('DotGarden', replaced.back);
  replaced.game.game = { destroy() {} };
  replaced.flush();
  assert.deepEqual(replaced.tried, [], 'a later activity invalidates the captured game callback');
});

