const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const read = file => fs.readFileSync(path.join(root, file));
const base = 'docs/letter-garden/reviews/audio-confirmation/';
const catalogue = JSON.parse(read(base + 'manifest.json'));
const owner = JSON.parse(read(base + 'owner-reviews/20260919-revisions.json'));
const queue = catalogue.reviewQueues.find(queue => queue.id === 'next100');
const byId = new Map(catalogue.items.map(item => [item.id, item]));

test('next 100 queue is complete, playable and excludes every previously decided item', () => {
  assert.equal(queue.itemIds.length, 100);
  assert.equal(new Set(queue.itemIds).size, 100);
  for (const id of queue.itemIds) {
    const item = byId.get(id);
    assert.ok(item?.parts.length, `${id} has no audio`);
    assert.ok(!owner.decisions[id]?.verdict, `${id} repeats a completed review`);
    for (const part of item.parts) {
      assert.equal(crypto.createHash('sha256').update(read(part.file)).digest('hex'), part.sha256);
    }
  }
});

test('six new word candidates remain outside the bank; 94 name prompts use only approved name clips', () => {
  const items = queue.itemIds.map(id => byId.get(id));
  const words = items.filter(item => item.status === 'candidate');
  assert.equal(words.length, 6);
  assert.deepEqual(items.slice(0, 6), words);
  const runtime = read('src/letters/LetterVoiceClips.js').toString();
  const shell = read('sw.js').toString();
  for (const item of words) {
    assert.ok(item.source);
    assert.ok(!runtime.includes(item.id));
    assert.ok(!shell.includes(item.id));
  }
  const names = new Set(catalogue.items.filter(item => item.status === 'installed' && item.family === 'Letter names').map(item => item.file));
  const sequences = items.filter(item => item.status === 'sequence');
  assert.equal(sequences.length, 94);
  for (const item of sequences) for (const part of item.parts) assert.ok(names.has(part.file));
});
