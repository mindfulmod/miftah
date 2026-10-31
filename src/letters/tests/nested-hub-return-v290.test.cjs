const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

class Node {
  constructor(kind = null) {
    this.dataset = kind ? { kind } : {};
    this.scrollTop = 0;
    this.focusCalls = [];
    this.buttons = [];
  }
  querySelector(selector) { return selector === '.practice-garden-hub' ? this.hub || null : null; }
  querySelectorAll(selector) { return selector === '[data-kind]' ? this.buttons : []; }
  focus(options) { this.focusCalls.push(options); }
  click() { this.onclick?.(); }
}

function fixture(methodName) {
  const window = { MiftahGame: {
    LettersArt: { icon: () => '<svg></svg>' },
    LettersGardenArt: { practicePicture: () => '<svg></svg>' },
  } };
  const context = vm.createContext({ window });
  const file = path.join(__dirname, '..', 'LettersGame.js');
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  const game = Object.create(window.MiftahGame.LettersGame.prototype);
  const root = { current: null, querySelector(selector) { return selector === '.practice-garden-hub' ? this.current?.hub || null : null; } };
  Object.assign(game, {
    root,
    worlds: { worlds: [{ id: 'pack-boat' }] },
    petKnowledge: () => [{ char: 'ا' }, { char: 'ب' }],
    knownItems: () => [{ id: 'ا' }, { id: 'ب' }],
    loadJSON: (_key, fallback) => fallback,
    topBar: () => '',
    wireTopBar() {},
    screen(_classes, html) {
      const screen = new Node();
      screen.hub = new Node();
      screen.buttons = [...html.matchAll(/data-kind="([^"]+)"/g)].map(([, kind]) => new Node(kind));
      screen.hub.buttons = screen.buttons;
      root.current = screen;
      return screen;
    },
    startPractice(kind, back) { this.launched = { kind, back }; },
  });
  const screen = game[methodName]();
  return { game, screen };
}

for (const [methodName, kind] of [['renderBookCorner', 'FriendBook'], ['renderPuzzleTree', 'EchoParade']]) {
  test(`${methodName} Back returns to the same toy tile with hub scroll and focus restored`, () => {
    const { game, screen } = fixture(methodName);
    screen.hub.scrollTop = 187;
    const source = screen.buttons.find(button => button.dataset.kind === kind);
    assert.ok(source, `${kind} tile is rendered`);
    source.onclick();
    assert.equal(game.launched.kind, kind);

    game.launched.back();
    const returned = game.root.current;
    assert.equal(returned.hub.scrollTop, 187);
    const restored = returned.buttons.find(button => button.dataset.kind === kind);
    assert.ok(restored);
    assert.equal(restored.focusCalls.length, 1);
    assert.equal(restored.focusCalls[0].preventScroll, true);
  });
}
