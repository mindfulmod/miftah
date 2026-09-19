const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const base = 'docs/letter-garden/reviews/audio-confirmation/';
const read = file => fs.readFileSync(path.join(root, file));
const catalogue = JSON.parse(read(base + 'manifest.json'));
const owner = JSON.parse(read(base + 'owner-reviews/20260919-next100-complete.json'));
const queue = catalogue.reviewQueues.find(queue => queue.id === 'individuals');
const byId = new Map(catalogue.items.map(item => [item.id, item]));

test('new individual queue is playable, unique and contains no previously decided item', () => {
  assert.ok(queue?.individualOnly);
  assert.equal(queue.itemIds.length, queue.expectedCount);
  assert.equal(queue.itemIds.length, 100);
  assert.equal(new Set(queue.itemIds).size, queue.itemIds.length);
  const audioHashes = new Set();
  for (const id of queue.itemIds) {
    const item = byId.get(id);
    assert.ok(!owner.decisions[id]?.verdict, `${id} repeats an owner-reviewed item`);
    assert.equal(item.status, 'candidate');
    assert.equal(item.parts.length, 1);
    assert.ok(item.source);
    assert.equal(crypto.createHash('sha256').update(read(item.file)).digest('hex'), item.sha256);
    assert.ok(!audioHashes.has(item.sha256), 'Different learning requests must not reuse a speculative cut');
    audioHashes.add(item.sha256);
  }
});

test('all prior audio signatures and owner decisions remain valid', () => {
  for (const [id, decision] of Object.entries(owner.decisions)) {
    assert.equal(byId.get(id).signature, decision.signature, id);
  }
});

test('fresh review candidates are excluded from runtime and offline shell', () => {
  const runtime = read('src/letters/LetterVoiceClips.js').toString();
  const shell = read('sw.js').toString();
  for (const id of queue.itemIds) {
    assert.ok(!runtime.includes(id));
    assert.ok(!shell.includes(id));
  }
  const selected = queue.itemIds.map(id => byId.get(id));
  for (let i = 0; i < selected.length; i++) for (let j = i + 1; j < selected.length; j++) {
    const a = selected[i].source, b = selected[j].source;
    if (a.id !== b.id) continue;
    assert.ok(Math.min(a.end, b.end) - Math.max(a.start, b.start) <= .004,
      `Overlapping source assigned to ${selected[i].text} and ${selected[j].text}`);
  }
});
