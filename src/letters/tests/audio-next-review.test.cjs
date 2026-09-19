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

test('completed owner review records all 100 choices and preserves the three correction notes', () => {
  const completed = JSON.parse(read(base + 'owner-reviews/20260919-next100-complete.json'));
  const counts = { correct: 0, fix: 0 };
  for (const id of queue.itemIds) {
    const decision = completed.decisions[id];
    assert.ok(['correct', 'fix'].includes(decision?.verdict));
    assert.equal(decision.signature, byId.get(id).signature);
    counts[decision.verdict]++;
  }
  assert.deepEqual(counts, { correct: 97, fix: 3 });
  assert.equal(completed.decisions['lg-ce62928e95a6'].verdict, 'correct');
  const notes = ['lg-1c562fd4a795', 'lg-513e420f5593', 'lg-c73dc068845c']
    .map(id => completed.decisions[id].note);
  assert.deepEqual(notes, ['sounds ilke ibismi', 'isnt this supposed to be yadaaaa? ', 'cuts off too short']);
});

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

test('reviewed words enter the bank only when approved; 94 name prompts use approved name clips', () => {
  const items = queue.itemIds.map(id => byId.get(id));
  const words = items.slice(0, 6);
  const completed = JSON.parse(read(base + 'owner-reviews/20260919-next100-complete.json'));
  assert.equal(words.filter(item => item.status === 'installed').length, 3);
  assert.equal(words.filter(item => item.status === 'candidate').length, 3);
  const runtime = read('src/letters/LetterVoiceClips.js').toString();
  const shell = read('sw.js').toString();
  for (const item of words) {
    assert.ok(item.source);
    const approved = completed.decisions[item.id].verdict === 'correct';
    assert.equal(item.status === 'installed', approved);
    assert.equal(runtime.includes(item.id), approved);
    assert.equal(shell.includes(item.id), approved);
  }
  const names = new Set(catalogue.items.filter(item => item.status === 'installed' && item.family === 'Letter names').map(item => item.file));
  const sequences = items.filter(item => item.status === 'sequence');
  assert.equal(sequences.length, 94);
  for (const item of sequences) for (const part of item.parts) assert.ok(names.has(part.file));
});
