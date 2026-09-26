const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const base = 'docs/letter-garden/reviews/audio-confirmation/';
const read = file => fs.readFileSync(path.join(root, file));
const json = file => JSON.parse(read(file));
const catalogue = json(base + 'manifest.json');
const owner = json(base + 'owner-reviews/20260919-boundary-recheck.json');
const byId = new Map(catalogue.items.map(item => [item.id, item]));
const pack = json(base + 'next-recordings/manifest.json');

test('original 100 requests remain a distinct inventory after the recording arrives', () => {
  assert.equal(pack.status, 'recording-received');
  assert.equal(pack.items.length, 100);
  assert.equal(new Set(pack.items.map(item => item.id)).size, 100);
  assert.ok(!catalogue.reviewQueues.some(queue => queue.id === pack.id));
  for (const request of pack.items) {
    const item = byId.get(request.id);
    assert.equal(item.text, request.text);
    assert.ok(['unmapped','candidate','installed'].includes(item.status));
    assert.equal(item.parts.length, item.status === 'unmapped' ? 0 : 1);
    if (item.parts.length) assert.equal(item.source.id, pack.recording.sourceId);
    assert.ok(!owner.decisions[item.id]?.verdict);
  }
});

test('recording scripts contain every requested item once and fit the text-field limit', () => {
  const ids = [];
  assert.equal(pack.batches.length, 14);
  for (const batch of pack.batches) {
    const bytes = read(base + 'next-recordings/' + batch.file);
    const text = bytes.toString();
    assert.ok(text.length <= 999);
    assert.equal(text.length, batch.characters);
    assert.ok(batch.count <= 8);
    assert.deepEqual(text.split('\n\n'), batch.items.map(item => item.text));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), batch.sha256);
    ids.push(...batch.items.map(item => item.id));
  }
  assert.deepEqual(ids, pack.items.map(item => item.id));
});

test('nine newly approved glides retain the exact reviewed bytes in runtime', () => {
  const queue = catalogue.reviewQueues.find(queue => queue.id === 'additional-glides');
  const latest = json(base + 'owner-reviews/20260921-glides-complete.json');
  const runtime = read('src/letters/LetterVoiceClips.js').toString();
  const shell = read('sw.js').toString();
  assert.equal(queue.itemIds.length, 9);
  for (const id of queue.itemIds) {
    const item = byId.get(id);
    assert.ok(!owner.decisions[id]?.verdict);
    assert.equal(item.status, 'installed');
    assert.equal(latest.decisions[id].verdict, 'correct');
    assert.equal(latest.decisions[id].signature, item.signature);
    assert.equal(latest.decisions[id].heardSignature, item.signature);
    assert.equal(item.parts.length, 1);
    assert.equal(crypto.createHash('sha256').update(read(item.file)).digest('hex'), item.sha256);
    assert.ok(runtime.includes(item.file));assert.ok(shell.includes(item.file));
    for (const other of catalogue.items) {
      if (id === other.id || other.source?.id !== item.source.id) continue;
      assert.ok(Math.min(item.source.end, other.source.end) - Math.max(item.source.start, other.source.start) <= .004,
        `New ${item.text} overlaps ${other.text}`);
    }
  }
});
