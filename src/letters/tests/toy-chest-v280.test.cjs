const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Element {
  constructor(tag = 'div', attrs = {}) {
    this.tagName = tag.toUpperCase();
    this.attributes = { ...attrs };
    this.dataset = {};
    for (const [key, value] of Object.entries(attrs)) {
      if (key.startsWith('data-')) this.dataset[key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
    }
    this.children = [];
    this.parentNode = null;
    this.isConnected = true;
    this.scrollTop = 0;
    this.clientHeight = 300;
    this.scrollHeight = 300;
    this.scrollCalls = [];
    this._text = '';
    this._html = '';
    this.handlers = {};
    this.focusCalls = [];
    this.classList = {
      contains: name => this.className.split(/\s+/).includes(name),
      add: name => { if (!this.classList.contains(name)) this.className = `${this.className} ${name}`.trim(); },
      remove: name => { this.className = this.className.split(/\s+/).filter(x => x !== name).join(' '); },
    };
  }
  get className() { return this.attributes.class || ''; }
  set className(value) { this.attributes.class = value; }
  get tabIndex() { return Number(this.attributes.tabindex ?? -1); }
  set tabIndex(value) { this.attributes.tabindex = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value);
  }
  addEventListener(type, fn) { this.handlers[type] = fn; }
  removeEventListener(type) { delete this.handlers[type]; }
  focus(options) { this.focusCalls.push(options); }
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    let root = this;
    while (root.parentNode) root = root.parentNode;
    if (child.classList.contains('tc-shelf-scroll') && root.shelfDimensions) Object.assign(child, root.shelfDimensions);
    return child;
  }
  replaceChildren(...children) { this.children.forEach(child => { child.parentNode = null; }); this.children = []; children.forEach(child => this.appendChild(child)); }
  set innerHTML(html) {
    this._html = String(html);
    this._text = '';
    this.replaceChildren();
    const stack = [this];
    const tokens = this._html.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g) || [];
    for (const token of tokens) {
      if (token.startsWith('<!--') || token.startsWith('</') || token.startsWith('<!')) {
        if (token.startsWith('</') && stack.length > 1) stack.pop();
        continue;
      }
      if (!token.startsWith('<')) { stack.at(-1)._text += token; continue; }
      const tag = token.match(/^<([\w-]+)/)?.[1];
      if (!tag) continue;
      const attrs = {};
      for (const m of token.slice(tag.length + 1).matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[m[1]] = m[2] ?? '';
      const node = new Element(tag, attrs);
      stack.at(-1).appendChild(node);
      if (!/\/>$/.test(token) && !['img', 'input', 'br', 'hr', 'meta', 'link'].includes(tag)) stack.push(node);
    }
  }
  get innerHTML() { return this._html; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this._text = String(value); this.replaceChildren(); }
  matches(selector) {
    if (selector.includes('][')) {
      const parts = selector.match(/\[[^\]]+\]/g) || [];
      return parts.length > 0 && parts.every(part => this.matches(part));
    }
    const attr = selector.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);
    if (attr) return this.getAttribute(attr[1]) !== null && (attr[2] === undefined || this.getAttribute(attr[1]) === attr[2]);
    if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
    return this.tagName.toLowerCase() === selector.toLowerCase();
  }
  querySelectorAll(selector) {
    const results = [];
    const visit = node => node.children.forEach(child => {
      if (child.matches(selector)) results.push(child);
      visit(child);
    });
    visit(this);
    return results;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  click() { (this.handlers.click || this.onclick)?.({ currentTarget: this }); }
  dispatchKey(key) { (this.handlers.keydown || this.onkeydown)?.({ key, preventDefault() { this.defaultPrevented = true; } }); }
  dispatch(type) { (this.handlers[type] || this[`on${type}`])?.({ currentTarget: this }); }
  scrollTo(options) { this.scrollCalls.push(options); this.scrollTop = typeof options === 'number' ? options : options.top; }
}

function loadChest() {
  const api = {};
  const observers = [];
  class FakeResizeObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
    trigger() { this.callback([{ target: this.target }]); }
  }
  const context = vm.createContext({ window: { MiftahGame: { ToyChest: api } }, document: {}, ResizeObserver: FakeResizeObserver });
  const file = path.join(__dirname, '..', 'ToyChest.js');
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  return { api: context.window.MiftahGame.ToyChest, observers };
}

function fixture(state = {}, { clientHeight = 300, scrollHeight = 300, reducedMotion = false } = {}) {
  const { api: chest, observers } = loadChest();
  const host = new Element('div');
  host.shelfDimensions = { clientHeight, scrollHeight };
  const launched = [];
  const families = [];
  const groups = [
    ['play', ['Feed', 'LetterFishing']],
    ['listen', []],
    ['read', ['BookCorner']],
    ['think', ['FriendPairs']],
    ['write', ['SandTable']],
    ['explore', ['WaterGarden']],
  ];
  const mounted = chest.mount({
    host, groups, state,
    tile: kind => `<button type="button" data-kind="${kind}" aria-label="${kind}"></button>`,
    familyArt: id => `<svg data-art="${id}"></svg>`,
    onLaunch: kind => launched.push(kind),
    onFamily: id => families.push(id),
    reducedMotion: () => reducedMotion,
  });
  return { host, mounted, launched, families, state, groups, observers };
}

test('mount shows one eligible family, hides empty families, and maintains tab semantics', () => {
  const f = fixture({ family: 'play', positions: {} });
  const room = f.host;
  const tabs = room.querySelectorAll('[role="tab"]');
  assert.deepEqual(tabs.map(tab => tab.dataset.family), ['play', 'read', 'think', 'write', 'explore']);
  assert.deepEqual(tabs.map(tab => tab.getAttribute('aria-selected')), ['true', 'false', 'false', 'false', 'false']);
  assert.deepEqual(tabs.map(tab => tab.getAttribute('tabindex')), ['0', '-1', '-1', '-1', '-1']);
  assert.deepEqual(room.querySelectorAll('.tc-panel').map(panel => panel.getAttribute('aria-labelledby')), [tabs[0].getAttribute('id')]);
  assert.deepEqual(room.querySelectorAll('[data-kind]').map(button => button.dataset.kind), ['Feed', 'LetterFishing']);
  f.mounted.destroy();
});

test('family selection changes the visible shelf and arrow/home/end keys move the roving tab', () => {
  const f = fixture({ family: 'play', positions: {} });
  const tabs = f.host.querySelectorAll('[role="tab"]');
  tabs[0].dispatchKey('ArrowRight');
  assert.deepEqual(f.host.querySelectorAll('[role="tab"]').map(tab => tab.getAttribute('aria-selected')), ['false', 'true', 'false', 'false', 'false']);
  assert.deepEqual(f.host.querySelectorAll('.tc-panel').map(panel => panel.getAttribute('aria-labelledby')), [f.host.querySelector('[role="tab"][data-family="read"]').getAttribute('id')]);
  f.host.querySelectorAll('[role="tab"]')[1].dispatchKey('End');
  assert.equal(f.host.querySelector('[role="tab"][data-family="explore"]')?.getAttribute('aria-selected'), 'true');
  f.host.querySelectorAll('[role="tab"]')[4].dispatchKey('Home');
  assert.equal(f.host.querySelector('[role="tab"][data-family="play"]')?.getAttribute('aria-selected'), 'true');
  assert.deepEqual(f.families, ['read', 'explore', 'play']);
  f.mounted.destroy();
});

test('switching families remembers shelf positions and invalidates the previous toy control', () => {
  const f = fixture({ family: 'play', positions: {} });
  const staleFeed = f.host.querySelector('[data-kind="Feed"]');
  f.host.querySelector('.tc-shelf-scroll').scrollTop = 91;
  f.host.querySelector('[role="tab"][data-family="read"]').click();
  staleFeed.click();
  assert.deepEqual(f.launched, []);
  f.host.querySelector('.tc-shelf-scroll').scrollTop = 44;
  f.host.querySelector('[role="tab"][data-family="play"]').click();
  assert.equal(f.host.querySelector('.tc-shelf-scroll').scrollTop, 91);
  assert.equal(f.state.positions.read, 44);
  f.mounted.destroy();
});

test('shelf position survives family switches and remount, then launch focuses the source toy', () => {
  const state = { family: 'play', positions: {} };
  const first = fixture(state);
  first.host.querySelector('.tc-shelf-scroll').scrollTop = 183;
  first.host.querySelector('[data-kind="Feed"]').click();
  assert.equal(state.positions.play, 183);
  assert.equal(state.focusKind, 'Feed');
  assert.deepEqual(first.launched, ['Feed']);
  first.mounted.destroy();

  const second = fixture(state);
  assert.equal(second.host.querySelector('.tc-shelf-scroll').scrollTop, 183);
  assert.equal(second.host.querySelector('[data-kind="Feed"]').focusCalls[0]?.preventScroll, true);
  second.mounted.destroy();
});

test('launch controls are one-shot; stale controls and detached or destroyed rooms cannot route', () => {
  const f = fixture({ family: 'play', positions: {} });
  const oldFeed = f.host.querySelector('[data-kind="Feed"]');
  oldFeed.click();
  oldFeed.click();
  assert.deepEqual(f.launched, ['Feed']);
  const stale = f.host.querySelector('[role="tab"][data-family="read"]');
  stale.click();
  assert.deepEqual(f.families, []);
  f.mounted.destroy();
  stale.click();
  assert.deepEqual(f.families, []);

  const detached = fixture({ family: 'play', positions: {} });
  const tab = detached.host.querySelector('[role="tab"][data-family="read"]');
  detached.host.isConnected = false;
  tab.click();
  assert.deepEqual(detached.families, []);
  detached.mounted.destroy();
});

test('invalid saved family falls back to first eligible family and ineligible groups stay absent', () => {
  const f = fixture({ family: 'removed-family', positions: {} });
  assert.equal(f.state.family, 'play');
  assert.deepEqual(f.host.querySelectorAll('[role="tab"]').map(tab => tab.dataset.family), ['play', 'read', 'think', 'write', 'explore']);
  f.mounted.destroy();
});

test('no eligible family clears the host and returns a safe destroy handle', () => {
  const { api: chest } = loadChest();
  const host = new Element('div');
  host.innerHTML = '<div>old screen</div>';
  const mounted = chest.mount({ host, groups: [['listen', []]], state: {}, tile: () => '', familyArt: () => '' });
  assert.equal(host.children.length, 0);
  assert.doesNotThrow(() => mounted.destroy());
});

test('overflow control advances in steps, changes direction at the end, and returns to the top', () => {
  const f = fixture({ family: 'play', positions: {} }, { clientHeight: 300, scrollHeight: 900 });
  const scroller = f.host.querySelector('.tc-shelf-scroll');
  const more = f.host.querySelector('.tc-more');
  assert.equal(more.hidden, false);
  assert.equal(more.getAttribute('aria-label'), 'More toys below');
  more.click();
  assert.equal(scroller.scrollCalls[0].top, 225);
  assert.equal(scroller.scrollCalls[0].behavior, 'smooth');
  scroller.dispatch('scroll');
  assert.equal(more.getAttribute('aria-label'), 'More toys below');
  more.click();
  more.click();
  scroller.dispatch('scroll');
  assert.equal(scroller.scrollTop, 600);
  assert.equal(more.getAttribute('aria-label'), 'Back to first toys');
  more.click();
  assert.equal(scroller.scrollCalls.at(-1).top, 0);
  assert.equal(scroller.scrollCalls.at(-1).behavior, 'smooth');
  assert.deepEqual(f.launched, []);
  assert.deepEqual(f.families, []);
  f.mounted.destroy();
});

test('overflow control stays hidden without overflow and refreshes when shelf size changes', () => {
  const f = fixture({ family: 'play', positions: {} });
  const scroller = f.host.querySelector('.tc-shelf-scroll');
  const more = f.host.querySelector('.tc-more');
  assert.equal(more.hidden, true);
  scroller.scrollHeight = 920;
  f.observers[0].trigger();
  assert.equal(more.hidden, false);
  scroller.clientHeight = 1000;
  f.observers[0].trigger();
  assert.equal(more.hidden, true);
  f.mounted.destroy();
  assert.equal(f.observers[0].disconnected, true);
});

test('reduced motion makes overflow navigation immediate and never launches a toy', () => {
  const f = fixture({ family: 'play', positions: {} }, { clientHeight: 240, scrollHeight: 800, reducedMotion: true });
  f.host.querySelector('.tc-more').click();
  assert.equal(f.host.querySelector('.tc-shelf-scroll').scrollCalls[0].top, 180);
  assert.equal(f.host.querySelector('.tc-shelf-scroll').scrollCalls[0].behavior, 'auto');
  assert.deepEqual(f.launched, []);
  assert.deepEqual(f.families, []);
  f.mounted.destroy();
});

test('overflow handler ignores stale clicks after destroy or detach', () => {
  const destroyed = fixture({ family: 'play', positions: {} }, { clientHeight: 200, scrollHeight: 800 });
  const oldButton = destroyed.host.querySelector('.tc-more');
  const scroller = destroyed.host.querySelector('.tc-shelf-scroll');
  destroyed.mounted.destroy();
  oldButton.click();
  assert.deepEqual(scroller.scrollCalls, []);

  const detached = fixture({ family: 'play', positions: {} }, { clientHeight: 200, scrollHeight: 800 });
  const detachedButton = detached.host.querySelector('.tc-more');
  const detachedScroller = detached.host.querySelector('.tc-shelf-scroll');
  detached.host.isConnected = false;
  detachedButton.click();
  assert.deepEqual(detachedScroller.scrollCalls, []);
  detached.mounted.destroy();
});
