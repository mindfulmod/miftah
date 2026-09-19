const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '../../..');
const catalogue = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/letter-garden/reviews/audio-confirmation/manifest.json'), 'utf8'));
const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex');

test('audio catalogue has the complete, disjoint 612-entry partition', () => {
  assert.equal(catalogue.items.length, 612);
  assert.equal(new Set(catalogue.items.map((item) => item.id)).size, 612);
  const counts = Object.fromEntries(['installed', 'candidate', 'sequence', 'unmapped', 'policy']
    .map((status) => [status, catalogue.items.filter((item) => item.status === status).length]));
  assert.deepEqual(counts, { installed: 57, candidate: 49, sequence: 149, unmapped: 328, policy: 29 });
});

test('all installed entries point to the current hashed clips and alphabet names are first-class', () => {
  const installed = catalogue.items.filter((item) => item.status === 'installed');
  assert.equal(installed.length, 57);
  for (const item of installed) {
    assert.ok(item.file);
    assert.equal(hash(item.file), item.sha256);
    assert.equal(item.parts.length, 1);
    assert.equal(item.parts[0].text, item.text);
    assert.equal(item.parts[0].sha256, item.sha256);
  }
  const names = installed.filter((item) => item.family === 'Letter names');
  assert.equal(names.length, 28);
  assert.ok(installed.filter((item) => item.family === 'Vowel and tanween names').length === 4);
  assert.equal(installed.filter((item) => item.family === 'Curriculum words').length, 25);
  assert.deepEqual(catalogue.items.slice(0, 28).map((item) => item.family), Array(28).fill('Letter names'));
});

test('exact source cuts stay within their supplied recordings', () => {
  const sourceDurations = new Map(catalogue.sources.map((source) => [source.id, source.duration]));
  for (const item of catalogue.items) {
    if (!item.source) continue;
    assert.ok(sourceDurations.has(item.source.id));
    assert.ok(item.source.start >= 0);
    assert.ok(item.source.end > item.source.start);
    assert.ok(item.source.end <= sourceDurations.get(item.source.id));
  }
});

test('unmapped and policy entries never claim playable audio', () => {
  for (const item of catalogue.items.filter((item) => item.status === 'unmapped' || item.status === 'policy')) {
    assert.equal(item.file, null);
    assert.equal(item.sha256, null);
    assert.deepEqual(item.parts, []);
  }
});
