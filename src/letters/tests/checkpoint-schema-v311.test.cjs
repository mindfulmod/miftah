const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const stateSource = fs.readFileSync(path.join(__dirname, '..', 'LettersState.js'), 'utf8');
function normalize(value) {
  const window = { MiftahGame: {} };
  vm.runInNewContext(stateSource, { window, localStorage: { getItem: () => null, setItem() {} }, Date, Math, JSON });
  return JSON.parse(JSON.stringify(window.MiftahGame.LettersState.normalize('resume', value)));
}

test('resume keeps the root checkpoint and orders valid chapter checkpoints newest first', () => {
  const result = normalize({
    world: 'letters-1', gameIndex: 4, starTotal: 9, at: 100,
    vowelItemIds: ['a1'], wordItemIds: ['w1'], ignored: 'drop',
    others: {
      'words-2': { world: 'words-2', gameIndex: 2, starTotal: 3, at: 300, wordItemIds: ['w2'], extra: true },
      'letters-2': { world: 'letters-2', gameIndex: 1, starTotal: 1, at: 200, vowelItemIds: ['a2'] },
    },
  });
  assert.deepEqual(result, {
    world: 'letters-1', gameIndex: 4, starTotal: 9, at: 100,
    vowelItemIds: ['a1'], wordItemIds: ['w1'],
    others: {
      'words-2': { world: 'words-2', gameIndex: 2, starTotal: 3, at: 300, wordItemIds: ['w2'] },
      'letters-2': { world: 'letters-2', gameIndex: 1, starTotal: 1, at: 200, vowelItemIds: ['a2'] },
    },
  });
  assert.deepEqual(Object.keys(result.others), ['words-2', 'letters-2']);
});

test('resume drops malformed, mismatched, self, nested, and unknown records and fields', () => {
  const result = normalize({ world: 'root-world', at: 5, others: {
    'root-world': { world: 'root-world', at: 40 },
    'other-world': { world: 'wrong-world', at: 50 },
    'bad key!': { world: 'bad key!', at: 70 },
    'null-world': null,
    'nested-world': { world: 'nested-world', at: 30, others: { 'third-world': { world: 'third-world', at: 90 } }, mystery: 1 },
  }, extraRoot: true });
  assert.deepEqual(result, {
    world: 'root-world', gameIndex: 0, starTotal: 0, at: 5,
    others: { 'nested-world': { world: 'nested-world', gameIndex: 0, starTotal: 0, at: 30 } },
  });
  assert.equal(normalize({ world: 'root-world', others: [] }).others, undefined);
});

test('nested checkpoints use the root numeric and item id bounds', () => {
  const result = normalize({ world: 'root-world', others: {
    'other-world': {
      world: 'other-world', gameIndex: 99.9, starTotal: -4, at: Infinity,
      vowelItemIds: ['x'.repeat(33), 'ok', 2], wordItemIds: ['z'.repeat(33),'a','b','a','c','d','e'],
    },
  } });
  assert.deepEqual(result.others['other-world'], {
    world: 'other-world', gameIndex: 12, starTotal: 0, at: 0, vowelItemIds: ['ok'], wordItemIds:['a','b','c','d'],
  });
});

test('resume caps other chapters at the 63 newest timestamps', () => {
  const others = {};
  for (let i = 0; i < 70; i++) {
    const world = `chapter-${String(i).padStart(2, '0')}`;
    others[world] = { world, at: i };
  }
  const result = normalize({ world: 'root-world', others });
  assert.equal(Object.keys(result.others).length, 63);
  assert.equal(result.others['chapter-00'], undefined);
  assert.deepEqual(Object.keys(result.others),Array.from({length:63},(_,i)=>`chapter-${String(69-i).padStart(2,'0')}`));
  assert.equal(result.others['chapter-07'].at, 7);
  assert.equal(result.others['chapter-69'].at, 69);
});

test('legacy resume retains its exact normalized shape when no other chapter is valid', () => {
  assert.deepEqual(normalize({ world: 'letters-1', gameIndex: 3.8, starTotal: 99, at: 10, vowelItemIds: [], wordItemIds: [], unknown: 'drop' }), {
    world: 'letters-1', gameIndex: 3, starTotal: 60, at: 10,
  });
  assert.deepEqual(normalize({ world: 'letters-1', at: 10, others: { 'letters-1': { world: 'letters-1', at: 20 } } }), {
    world: 'letters-1', gameIndex: 0, starTotal: 0, at: 10,
  });
});
