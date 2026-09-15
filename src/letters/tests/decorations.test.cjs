const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function runtime() {
  const window = { MiftahGame: {
    LettersGardenArt: { growth: (progress, bests) => progress.done?.includes('pack-boat') ? 3 : ['pop', 'trace', 'feed'].filter((game) => (bests[`pack-boat:${game}`] || 0) > 0).length },
    LETTERS_STICKERS: ['star', 'palm', 'dove', 'fish', 'boat', 'lantern', 'moon'].map((id) => ({ id })),
  } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'LettersDecorations.js'), 'utf8'), { window });
  return window.MiftahGame.LettersDecorations;
}
function plain(value) { return JSON.parse(JSON.stringify(value)); }

test('catalog gates earned flowers and boat, and filters known owned stickers', () => {
  const d = runtime();
  assert.deepEqual(plain(d.catalog({ progress: { done: [] }, bests: {}, stickers: { owned: ['star', 'moon', 'star'] } })), [
    { id: 'sticker:star', label: 'Star sticker', kind: 'sticker', stickerId: 'star' },
  ]);
  const earned = d.catalog({ progress: { done: [] }, bests: { 'pack-boat:pop': 1, 'pack-boat:trace': 1 }, stickers: { owned: ['palm', 'lantern'] } });
  assert.deepEqual(plain(earned.slice(0, 3)), [
    { id: 'flower:1', label: 'single flower patch', kind: 'flower', count: 1 },
    { id: 'flower:2', label: 'two-flower patch', kind: 'flower', count: 2 },
    { id: 'boat', label: 'paper boat', kind: 'boat' },
  ]);
  assert.deepEqual(plain(earned.slice(3).map(({ id }) => id)), ['sticker:palm', 'sticker:lantern']);
});

test('normalize repairs four slots, dedupes, and preserves unknown strings', () => {
  const d = runtime();
  assert.deepEqual(plain(d.normalize({ version: 9, slots: ['old', 7, 'old', 'future', 'extra'] })), { version: 1, slots: ['old', null, null, 'future'] });
  assert.deepEqual(plain(d.normalize(null)), { version: 1, slots: [null, null, null, null] });
});

test('visibleSlots hides unavailable entries while retaining the saved layout', () => {
  const d = runtime();
  const layout = { version: 1, slots: ['future', 'flower:1', 'sticker:star', null] };
  const visible = d.visibleSlots(layout, [{ id: 'flower:1' }]);
  assert.deepEqual(plain(visible), [null, 'flower:1', null, null]);
  assert.deepEqual(layout.slots, ['future', 'flower:1', 'sticker:star', null]);
});

test('place moves uniquely, replaces, rejects invalid or unowned IDs, and stays immutable', () => {
  const d = runtime();
  const layout = { version: 1, slots: ['future', 'flower:1', 'sticker:star', null] };
  const available = [{ id: 'flower:1' }, { id: 'sticker:star' }];
  assert.equal(d.place(layout, 2, 'sticker:star', available), null);
  assert.equal(d.place(layout, 8, 'flower:1', available), null);
  assert.deepEqual(plain(d.place(layout, 3, 'flower:1', available)), { version: 1, slots: ['future', null, 'sticker:star', 'flower:1'] });
  assert.deepEqual(plain(d.place(layout, 0, 'sticker:star', available)), { version: 1, slots: ['sticker:star', 'flower:1', null, null] });
  assert.deepEqual(layout.slots, ['future', 'flower:1', 'sticker:star', null]);
});

test('remove clears a slot, preserves other including hidden entries, and no-ops cleanly', () => {
  const d = runtime();
  const layout = { version: 1, slots: ['future', 'flower:1', null, null] };
  assert.deepEqual(plain(d.remove(layout, 1)), { version: 1, slots: ['future', null, null, null] });
  assert.equal(d.remove(layout, 2), null);
  assert.equal(d.remove(layout, 4), null);
  assert.deepEqual(layout.slots, ['future', 'flower:1', null, null]);
});
