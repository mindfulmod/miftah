const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../..');
const base = 'docs/letter-garden/reviews/audio-confirmation/';
const read = file => fs.readFileSync(path.join(root, file));
const json = file => JSON.parse(read(file));
const hash = file => crypto.createHash('sha256').update(read(file)).digest('hex');
const catalogue = json(base + 'manifest.json');
const assessment = json(base + 'new-recording-assessment.json');
const byId = new Map(catalogue.items.map(item => [item.id, item]));
const queue = catalogue.reviewQueues.find(queue => queue.id === 'new-recording');
const pack = json(base + 'next-recordings.json');

test('the uploaded source is preserved and every requested item is accounted for once', () => {
  assert.equal(hash(assessment.source.file), '224a49929768b1378c21fba0fc112331d555e45ec51fa5da21883edd79a0766e');
  assert.equal(assessment.source.sha256, hash(assessment.source.file));
  const source = catalogue.sources.find(source => source.id === pack.recording.sourceId);
  assert.equal(source.sha256, assessment.source.sha256);
  assert.equal(source.duration, 43.152);
  const ids = [...queue.itemIds, ...assessment.unresolved.map(item => item.id)];
  assert.equal(new Set(ids).size, 100);
  assert.deepEqual(ids.slice().sort(), pack.items.map(item => item.id).sort());
  assert.equal(queue.itemIds.length, queue.expectedCount);
  assert.equal(queue.itemIds.length, assessment.candidates.length);
  for (const item of assessment.unresolved) assert.equal(byId.get(item.id).status, 'unmapped');
});

test('new source cuts remain review-only and never overlap a neighbouring candidate', () => {
  const runtime = read('src/letters/LetterVoiceClips.js').toString();
  const shell = read('sw.js').toString();
  const selected = queue.itemIds.map(id => byId.get(id));
  for (const item of selected) {
    assert.equal(item.status, 'candidate');assert.equal(item.parts.length, 1);
    assert.equal(item.source.id, pack.recording.sourceId);
    assert.equal(hash(item.file), item.sha256);
    assert.ok(item.file.includes('/candidates/'));
    assert.ok(!runtime.includes(item.id));assert.ok(!shell.includes(item.id));
    assert.ok(!assessment.baseline.playableSignatures[item.id]);
    for (const other of selected) {
      if (item.id === other.id) continue;
      assert.ok(Math.min(item.source.end, other.source.end) - Math.max(item.source.start, other.source.start) <= .004,
        `${item.text} overlaps ${other.text}`);
    }
  }
});

test('new recording preparation preserves every prior playable signature and the game voice bank', () => {
  assert.equal(Object.keys(assessment.baseline.playableSignatures).length, 370);
  for (const [id, signature] of Object.entries(assessment.baseline.playableSignatures)) {
    assert.equal(byId.get(id).signature, signature, `Prior audio changed: ${id}`);
    for (const part of byId.get(id).parts) assert.equal(hash(part.file), part.sha256);
  }
  assert.equal(hash('src/letters/LetterVoiceClips.js'), assessment.baseline.runtimeSha256);
  // Later art/shell versions may change; only audio membership is this contract.
  const shell = read('sw.js').toString();
  for (const item of catalogue.items.filter(item => item.status === 'installed')) {
    for (const part of item.parts) assert.ok(shell.includes(part.file));
  }
});
