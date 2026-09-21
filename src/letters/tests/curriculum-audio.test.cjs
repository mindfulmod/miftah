const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '../../..');
const reviewDir = path.join(root, 'docs/letter-garden/reviews/marin-curriculum');
const manifestPath = path.join(reviewDir, 'manifest.json');
const requestPath = path.join(reviewDir, 'request-items.json');
const manifestReady = fs.existsSync(manifestPath);

test('owner-reviewed Dammataan excerpt cannot be reassigned to Damma or Fathataan', () => {
  const { items } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const confirmed = items.find(item => item.text === 'ضَمَّتَانْ'.normalize('NFC'));
  assert.equal(confirmed.status, 'imported');
  assert.equal(confirmed.source, 'batch-1');
  assert.equal(confirmed.start, 3.7);
  assert.equal(confirmed.end, 4.85);
  assert.match(confirmed.evidence, /Owner listened/);
  for (const text of ['ضَمَّة', 'فَتْحَتَانْ']) {
    const pending = items.find(item => item.text === text.normalize('NFC'));
    assert.equal(pending.status, 'needs-review');
    // A later recording may supply these names; the rejected shared batch-1 excerpt must never return.
    assert.equal(pending.source, 'batch-3');
    assert.ok(pending.file && Number.isFinite(pending.start));
    assert.notEqual(pending.sha256, confirmed.sha256);
  }
});

const sha256 = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const resolveReviewFile = file => {
  const fromRoot = path.join(root, file);
  return fs.existsSync(fromRoot) ? fromRoot : path.join(reviewDir, file);
};

function wavInfo(file) {
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.subarray(0, 4).toString(), 'RIFF', `${file} is not RIFF`);
  assert.equal(bytes.subarray(8, 12).toString(), 'WAVE', `${file} is not WAVE`);
  let offset = 12, format, channels, sampleRate, byteRate, bits, dataLength;
  while (offset + 8 <= bytes.length) {
    const id = bytes.subarray(offset, offset + 4).toString();
    const length = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (id === 'fmt ') {
      format = bytes.readUInt16LE(data);
      channels = bytes.readUInt16LE(data + 2);
      sampleRate = bytes.readUInt32LE(data + 4);
      byteRate = bytes.readUInt32LE(data + 8);
      bits = bytes.readUInt16LE(data + 14);
    }
    if (id === 'data') dataLength = length;
    offset = data + length + (length % 2);
  }
  assert.equal(format, 1, `${file} must be PCM`);
  assert.equal(sampleRate, 24000, `${file} must be 24 kHz`);
  assert.ok(channels > 0 && bits > 0 && byteRate > 0 && dataLength >= 0, `${file} has an invalid WAV header`);
  return dataLength / byteRate;
}

test('Marin curriculum manifest maps the complete reviewed request snapshot with auditable local WAV clips', { skip: !manifestReady && 'manifest.json has not been generated yet' }, () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const requested = JSON.parse(fs.readFileSync(requestPath, 'utf8'));
  assert.ok(Array.isArray(manifest.sources));
  assert.ok(Array.isArray(manifest.items));
  assert.equal(manifest.items.length, requested.length);

  const requestedById = new Map(requested.map(item => [item.id, item]));
  assert.equal(requestedById.size, requested.length);
  for (const item of manifest.items) {
    const expected = requestedById.get(item.id);
    assert.ok(expected, `unexpected manifest item ${item.id}`);
    assert.equal(item.text, expected.text, `${item.id} changed its requested text`);
    assert.equal(item.text, item.text.normalize('NFC'), `${item.id} is not NFC`);
    assert.ok(['imported', 'needs-review', 'missing'].includes(item.status), `${item.id} has invalid status`);
  }

  const sources = new Map(manifest.sources.map(source => [source.id, source]));
  assert.equal(sources.size, manifest.sources.length);
  for (const source of manifest.sources) {
    assert.ok(source.id && source.file && source.sha256);
    assert.ok(Number.isFinite(source.duration) && source.duration > 0, `${source.id} has no finite duration`);
    const sourceFile = resolveReviewFile(source.file);
    assert.ok(fs.existsSync(sourceFile), `${source.id} source file is missing`);
    assert.equal(sha256(sourceFile), source.sha256, `${source.id} hash changed`);
  }

  const counts = Object.fromEntries(['imported', 'needs-review', 'missing'].map(status => [status, manifest.items.filter(item => item.status === status).length]));
  assert.ok(manifest.counts && typeof manifest.counts === 'object');
  for (const [status, count] of Object.entries(counts)) assert.equal(manifest.counts[status], count, `${status} count is wrong`);
  if (Object.hasOwn(manifest.counts, 'total')) assert.equal(manifest.counts.total, manifest.items.length);

  const window = { MiftahGame: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'src/letters/LetterVoiceClips.js'), 'utf8'), { window });
  const clips = window.MiftahGame.LETTER_VOICE_CLIPS;
  for (const [key] of Object.entries(clips)) assert.equal(key, key.normalize('NFC'), `runtime key ${key} is not NFC`);

  for (const item of manifest.items) {
    if (item.status !== 'imported') {
      assert.equal(clips[item.text], undefined, `${item.id} is unresolved but runtime mapped`);
      continue;
    }
    assert.ok(item.file && item.source && item.sha256 && item.evidence, `${item.id} lacks import provenance`);
    assert.equal(clips[item.text], item.file, `${item.id} does not have its exact runtime key`);
    assert.ok(item.file.startsWith('assets/audio/letters/marin-curriculum-v1/'), `${item.id} is not in the curriculum audio bundle`);
    const source = sources.get(item.source);
    assert.ok(source, `${item.id} references an unknown source`);
    assert.ok(Number.isFinite(item.start) && Number.isFinite(item.end) && item.start >= 0 && item.end > item.start, `${item.id} has invalid source cut`);
    assert.ok(item.end <= source.duration, `${item.id} extends beyond ${item.source}`);
    const file = resolveReviewFile(item.file);
    assert.ok(fs.existsSync(file), `${item.id} WAV file is missing`);
    assert.equal(sha256(file), item.sha256, `${item.id} WAV hash changed`);
    const duration = wavInfo(file);
    assert.ok(Number.isFinite(item.duration) && item.duration > 0, `${item.id} has invalid manifest duration`);
    assert.ok(Math.abs(duration - item.duration) < 0.02, `${item.id} WAV duration differs from manifest`);
    assert.ok(Math.abs(duration - (item.end - item.start)) < 0.05, `${item.id} WAV duration is outside its source cut`);
  }
});
