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
  const runtimeText = runtime.toString();
  const bank = JSON.parse(runtimeText.match(/Object\.freeze\((\{[\s\S]*?\})\)/)[1]);
  const serviceWorker = read('sw.js');

  for (const item of catalogue.items.filter(item => item.status === 'installed')) {
    for (const part of item.parts) {
      assert.ok(serviceWorker.toString().includes(part.file), `installed audio is missing from precache: ${part.file}`);
    }
  }

  const signatures = intake.baseline.playableSignatures;
  assert.equal(Object.keys(signatures).length, 446);
  const changed = [];
  for (const [id, signature] of Object.entries(signatures)) {
    if (byId.get(id)?.signature !== signature) changed.push(id);
    if (id !== 'lg-390d2843328d') assert.equal(byId.get(id)?.signature, signature, `previous playable signature changed for ${id}`);
  }
  assert.deepEqual(changed, ['lg-390d2843328d'], 'only the rejected Fi candidate may be superseded');

  for (const item of intake.items) {
    const clipPath = intakeDir + item.file;
    assert.ok(!runtime.toString().includes(clipPath), `${item.file} entered the runtime bank`);
    assert.ok(!serviceWorker.toString().includes(clipPath), `${item.file} entered precache`);
    assert.ok(!runtime.toString().includes(item.file), `${item.file} entered the runtime bank`);
    assert.ok(!serviceWorker.toString().includes(item.file), `${item.file} entered precache`);
  }
});

test('batch four installs 15 unique exact approvals and preserves the rejected Fi source only in history', () => {
  const applied = JSON.parse(read(intakeDir + 'applied-review.json'));
  const ownerFile = applied.evidenceFile;
  const owner = JSON.parse(read(ownerFile));
  const conversation = JSON.parse(read('docs/letter-garden/reviews/audio-confirmation/owner-reviews/20260926-retry-conversation.json'));
  const sheet = JSON.parse(read('docs/letter-garden/reviews/marin-curriculum/cuts.json'));
  const runtimeText = read('src/letters/LetterVoiceClips.js').toString();
  const bank = JSON.parse(runtimeText.match(/Object\.freeze\((\{[\s\S]*?\})\)/)[1]);
  const shell = read('sw.js').toString();
  const byText = new Map(catalogue.items.map(item => [item.text, item]));
  const approvedIds = new Set(applied.approved.map(item => item.id));
  const approvedClipIds = new Set(applied.approved.map(item => item.clipId));
  const approvedTexts = new Set(applied.approved.map(item => item.text));
  const correct = owner.items.filter(item => item.decision === 'correct');

  assert.equal(conversation.statement, 'all 16 are fine');
  assert.equal(applied.evidenceSha256, hash(read(ownerFile)));
  assert.equal(correct.length, 15);
  assert.equal(applied.approved.length, 15);
  assert.equal(approvedIds.size, 15);
  assert.equal(approvedClipIds.size, 15);
  assert.equal(approvedTexts.size, 15);
  assert.equal(new Set(applied.approved.map(item => item.sha256)).size, 15);
  assert.equal(applied.approved.length + applied.excluded.length, intake.items.length);
  const registeredSource = catalogue.sources.find(source => source.id === 'marin-curriculum-batch-4');
  assert.equal(registeredSource.sha256, intake.source.sha256);
  assert.equal(registeredSource.duration, intake.source.duration);

  for (const decision of correct) {
    const approval = applied.approved.find(item => item.clipId === decision.id);
    const clip = intake.items.find(item => item.id === decision.id);
    const catalogueItem = byText.get(decision.selectedText);
    const cut = sheet.cuts.find(item => item.text === decision.selectedText);
    assert.ok(approval, `Missing imported approval for ${decision.id}`);
    assert.ok(catalogueItem, `Unknown approved label ${decision.selectedText}`);
    assert.equal(approval.id, catalogueItem.id);
    assert.equal(approval.text, catalogueItem.text);
    assert.equal(approval.sha256, clip.sha256);
    assert.equal(catalogueItem.status, 'installed');
    assert.equal(catalogueItem.source.id, 'marin-curriculum-batch-4');
    assert.equal(catalogueItem.source.start, clip.start);
    assert.equal(catalogueItem.source.end, clip.end);
    assert.equal(catalogueItem.file, approval.file);
    assert.equal(hash(read(approval.file)), clip.sha256);
    assert.equal(bank[approval.text], approval.file);
    assert.ok(shell.includes(approval.file), `Approved audio missing from precache: ${approval.file}`);
    assert.equal(cut.ownerReview.file, ownerFile);
    assert.equal(cut.ownerReview.audioSha256, clip.sha256);
    assert.equal(cut.ownerReview.verdict, 'correct');
  }

  // The release keeps the full 237-key bank and adds exactly these 15 labels.
  const previousInstalled = catalogue.items.filter(item => item.status === 'installed' && !approvedIds.has(item.id));
  assert.equal(previousInstalled.length, 237);
  assert.deepEqual(Object.keys(bank).sort(), [...new Set([...previousInstalled.map(item => item.text), ...approvedTexts])].sort());
  for (const item of previousInstalled) {
    assert.equal(bank[item.text], item.file, `Previous runtime mapping changed: ${item.text}`);
    assert.equal(hash(read(item.file)), item.sha256, `Previous approved bytes changed: ${item.text}`);
  }
  const baseline = intake.baseline.playableSignatures;
  const unchanged = Object.entries(baseline).filter(([id]) => id !== 'lg-390d2843328d');
  assert.equal(unchanged.length, 445);
  for (const [id, signature] of unchanged) assert.equal(byId.get(id)?.signature, signature, `Previous playable signature changed: ${id}`);

  const duplicate = intake.items.find(item => item.id === 'batch4-09');
  const duplicateDecision = owner.items.find(item => item.id === duplicate.id);
  assert.equal(duplicateDecision.selectedText, 'وَ');
  assert.equal(duplicateDecision.decision, 'pending');
  assert.ok(!approvedClipIds.has(duplicate.id));
  assert.ok(applied.excluded.some(item => item.clipId === duplicate.id && item.decision === 'pending'));
  assert.ok(!approvedTexts.has('وُ'));
  assert.equal(conversation.clarification.clipId, duplicate.id);
  assert.equal(conversation.clarification.runtimeDisposition, 'Approved alternate for وَ, preserved in the review archive. Clip 7 is the canonical installed وَ. Never map this alternate to وُ.');
  const canonicalWa = applied.approved.find(item => item.clipId === 'batch4-07');
  assert.equal(bank['وَ'], canonicalWa.file);
  assert.ok(!runtimeText.includes(duplicate.file), 'Duplicate clip 9 must remain archive-only');
  assert.ok(!shell.includes(duplicate.file), 'Duplicate clip 9 must stay out of precache');

  assert.equal(applied.remaining.length, 12);
  for (const item of applied.remaining) {
    assert.notEqual(byText.get(item.text)?.status, 'installed', `${item.text} should retain device-speech fallback`);
    assert.equal(bank[item.text], undefined, `${item.text} should not have a bundled mapping`);
  }

  const fi = sheet.cuts.find(item => item.text === 'فِ');
  const original = fi.reviewHistory.find(item => item.ownerReview?.file === 'docs/letter-garden/reviews/audio-confirmation/owner-reviews/20260925-new-recording.json');
  assert.ok(original, 'Preserve the rejected Fi batch-three review in history');
  assert.equal(original.status, 'needs-review');
  assert.equal(original.ownerReview.verdict, 'fix');
  assert.equal(original.ownerReview.note, 'sounds like fif');
  assert.equal(original.file, 'docs/letter-garden/reviews/marin-curriculum/candidates/lg-390d2843328d.wav');
  assert.equal(hash(read(original.file)), original.sha256);
  assert.notEqual(bank['فِ'], original.file);
  assert.ok(!runtimeText.includes(original.file), 'Rejected Fi original must stay out of runtime');
  assert.ok(!shell.includes(original.file), 'Rejected Fi original must stay out of precache');
});
