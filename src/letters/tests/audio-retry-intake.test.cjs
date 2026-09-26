const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '../../..');
const read = file => fs.readFileSync(path.join(root, file));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const intakeDir = 'docs/letter-garden/reviews/audio-confirmation/retry-recording/';
const intake = JSON.parse(read(intakeDir + 'manifest.json'));
const catalogue = JSON.parse(read('docs/letter-garden/reviews/audio-confirmation/manifest.json'));
const byId = new Map(catalogue.items.map(item => [item.id, item]));

function pcmInfo(wav) {
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE');
  let offset = 12;
  let format;
  let dataBytes;
  while (offset + 8 <= wav.length) {
    const id = wav.toString('ascii', offset, offset + 4);
    const size = wav.readUInt32LE(offset + 4);
    const body = offset + 8;
    assert.ok(body + size <= wav.length, `truncated WAV chunk ${id}`);
    if (id === 'fmt ') {
      format = {
        encoding: wav.readUInt16LE(body),
        channels: wav.readUInt16LE(body + 2),
        sampleRate: wav.readUInt32LE(body + 4),
        blockAlign: wav.readUInt16LE(body + 12),
        bitsPerSample: wav.readUInt16LE(body + 14),
      };
    }
    if (id === 'data') dataBytes = size;
    offset = body + size + (size % 2);
  }
  assert.ok(format && dataBytes !== undefined, 'WAV must contain fmt and data chunks');
  assert.equal(format.encoding, 1, 'clip must use integer PCM');
  assert.equal(format.channels, 1, 'clip must be mono');
  assert.equal(format.bitsPerSample, 16, 'clip must use 16-bit PCM');
  assert.equal(dataBytes % format.blockAlign, 0, 'PCM data must contain whole frames');
  return { ...format, duration: dataBytes / (format.sampleRate * format.blockAlign) };
}

test('retry intake source and all 16 utterance clips match manifest hashes and PCM durations', () => {
  assert.equal(intake.submittedTextConfirmed, true);
  const source = intake.source;
  assert.equal(hash(read(source.repositoryFile)), source.sha256, 'owner source hash changed');
  assert.equal(source.duration, 10.848);
  assert.equal(source.sampleRate, 24000);
  assert.equal(intake.items.length, 16);

  const filenames = new Set();
  const clipHashes = new Set();
  let previousEnd = 0;
  for (const [index, item] of intake.items.entries()) {
    assert.equal(item.position, index + 1);
    assert.equal(item.id, `batch4-${String(index + 1).padStart(2, '0')}`);
    assert.equal(item.mappingStatus, 'unassigned');
    assert.ok(item.start >= previousEnd, `${item.id} overlaps the previous utterance`);
    assert.ok(item.start >= 0 && item.end <= source.duration, `${item.id} exceeds source bounds`);
    assert.ok(item.end > item.start);
    assert.ok(Math.abs(item.duration - (item.end - item.start)) < 0.001, `${item.id} manifest duration disagrees with its source window`);
    previousEnd = item.end;

    assert.ok(!filenames.has(item.file), `${item.file} is reused`);
    filenames.add(item.file);
    const wav = read(intakeDir + item.file);
    assert.equal(hash(wav), item.sha256, `${item.file} hash changed`);
    assert.ok(!clipHashes.has(item.sha256), `${item.file} duplicates another clip`);
    clipHashes.add(item.sha256);
    const pcm = pcmInfo(wav);
    assert.equal(pcm.sampleRate, source.sampleRate, `${item.file} sample rate mismatch`);
    assert.ok(Math.abs(pcm.duration - item.duration) <= 1 / pcm.sampleRate, `${item.file} PCM duration mismatch`);
  }
});

test('confirmed submitted text preserves the requested 27-item order without assigning audio mappings', () => {
  const requested = JSON.parse(read('docs/letter-garden/reviews/audio-confirmation/recording-retry/manifest.json'));
  const submitted = intake.submittedItems;
  assert.equal(intake.submittedTextConfirmedOn, '2026-09-25');
  assert.equal(intake.submittedTextFile, 'submitted-text.txt');
  assert.equal(submitted.length, 27);
  assert.deepEqual(submitted.map(item => item.id), requested.items.map(item => item.id));
  assert.deepEqual(submitted.map(item => item.text), requested.items.map(item => item.text));

  const tokens = read(intakeDir + intake.submittedTextFile).toString('utf8').trim().split(/\s+/u);
  assert.deepEqual(tokens, requested.items.map(item => item.text));
  assert.deepEqual(tokens, submitted.map(item => item.text));

  for (const item of intake.items) {
    assert.equal(item.mappingStatus, 'unassigned', `${item.id} must remain unmapped pending review`);
    assert.ok(!['installed', 'approved'].includes(item.mappingStatus));
  }
});

test('retry intake preserves runtime audio, precache coverage and every previous playable signature', () => {
  const runtime = read('src/letters/LetterVoiceClips.js');
  const serviceWorker = read('sw.js');
  assert.equal(hash(runtime), intake.baseline.runtimeSha256, 'runtime bank differs from recorded baseline');

  for (const item of catalogue.items.filter(item => item.status === 'installed')) {
    for (const part of item.parts) {
      assert.ok(serviceWorker.toString().includes(part.file), `installed audio is missing from precache: ${part.file}`);
    }
  }

  const signatures = intake.baseline.playableSignatures;
  assert.equal(Object.keys(signatures).length, 446);
  for (const [id, signature] of Object.entries(signatures)) {
    assert.equal(byId.get(id)?.signature, signature, `previous playable signature changed for ${id}`);
  }

  for (const item of intake.items) {
    const clipPath = intakeDir + item.file;
    assert.ok(!runtime.toString().includes(clipPath), `${item.file} entered the runtime bank`);
    assert.ok(!serviceWorker.toString().includes(clipPath), `${item.file} entered precache`);
    assert.ok(!runtime.toString().includes(item.file), `${item.file} entered the runtime bank`);
    assert.ok(!serviceWorker.toString().includes(item.file), `${item.file} entered precache`);
  }
});
