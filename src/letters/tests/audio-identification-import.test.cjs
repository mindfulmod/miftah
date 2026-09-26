const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { applyIdentification } = require('../../../scripts/apply-letter-garden-audio-identification.cjs');

const root = path.resolve(__dirname, '../../..');
const read = file => fs.readFileSync(path.join(root, file));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const intakeDir = 'docs/letter-garden/reviews/audio-confirmation/retry-recording/';
const intake = JSON.parse(read(intakeDir + 'manifest.json'));
const catalogue = JSON.parse(read('docs/letter-garden/reviews/audio-confirmation/manifest.json'));
const initialSheet = JSON.parse(read('docs/letter-garden/reviews/marin-curriculum/cuts.json'));
const evidenceFile = 'docs/letter-garden/reviews/audio-confirmation/owner-reviews/synthetic-identification.json';
const evidenceHash = hash(Buffer.from('synthetic owner export for unit testing'));
const label = intake.submittedItems.find(item => item.text === 'ثَ');

function makeReview() {
  return {
    kind: 'letter-garden-audio-identification',
    schemaVersion: 2,
    testOnly: false,
    source: { sha256: intake.source.sha256 },
    submittedTextConfirmed: true,
    submittedText: intake.submittedItems.map(item => item.text).join('\n\n'),
    items: intake.items.map((clip, index) => ({
      id: clip.id,
      position: clip.position,
      start: clip.start,
      end: clip.end,
      file: clip.file,
      sha256: clip.sha256,
      decision: index === 0 ? 'correct' : ['fix', 'unsure', 'pending'][index % 3],
      selectedText: index === 0 ? label.text : null,
      played: index === 0 ? { sha256: clip.sha256, playedAt: '2026-09-26T12:00:00.000Z' } : null,
      reviewedAt: '2026-09-26T12:00:00.000Z',
      heard: index === 0 ? 'Exact short vowel heard.' : ''
    }))
  };
}

function importReview(review = makeReview(), sheet = initialSheet, readFile = read) {
  return applyIdentification(review, intake, sheet, catalogue, evidenceFile, evidenceHash, readFile);
}

test('imports only exact owner approvals and registers the source without mutating the old sheet', () => {
  const before = structuredClone(initialSheet);
  const result = importReview();

  assert.deepEqual(initialSheet, before);
  assert.equal(result.approved.length, 1);
  assert.deepEqual(result.approved[0], {
    clipId: intake.items[0].id,
    id: label.id,
    text: label.text,
    sha256: intake.items[0].sha256,
    file: `assets/audio/letters/marin-curriculum-v1/${label.id}-r1.wav`
  });
  assert.equal(result.excluded.length, intake.items.length - 1);
  assert.deepEqual(result.excluded.map(item => item.decision), makeReview().items.slice(1).map(item => item.decision));
  assert.deepEqual(result.remaining, intake.submittedItems.filter(item => item.text !== label.text));

  const imported = result.sheet.cuts.filter(cut => cut.status === 'imported' && cut.ownerReview?.file === evidenceFile);
  assert.equal(imported.length, 1);
  assert.equal(imported[0].text, label.text);
  assert.equal(imported[0].ownerReview.audioSha256, intake.items[0].sha256);
  assert.equal(imported[0].ownerReview.sha256, evidenceHash);
  assert.equal(imported[0].ownerReview.verdict, 'correct');
  assert.deepEqual(result.sheet.sources.filter(source => source.id === 'batch-4'), [{
    id: 'batch-4', file: 'sources/batch-4.mp3', originalFilename: intake.source.originalFilename,
    sha256: intake.source.sha256, duration: intake.source.duration, receivedOn: intake.receivedOn,
    requestFile: '../audio-confirmation/retry-recording/submitted-text.txt',
    title: 'Marin curriculum — owner-reviewed retry recording'
  }]);
});

test('applying the same owner export twice is idempotent and does not duplicate approval or source', () => {
  const first = importReview();
  const second = importReview(makeReview(), first.sheet);

  assert.deepEqual(second.sheet, first.sheet);
  assert.deepEqual(second.approved, first.approved);
  assert.equal(second.sheet.cuts.filter(cut => cut.text === label.text).length,
    first.sheet.cuts.filter(cut => cut.text === label.text).length);
  assert.equal(second.sheet.sources.filter(source => source.id === 'batch-4').length, 1);
});

test('rejects QA exports, stale source or clip hashes, and changed source bytes', () => {
  const qa = makeReview();
  qa.testOnly = true;
  assert.throws(() => importReview(qa), /QA decisions cannot approve game audio/);

  const staleSource = makeReview();
  staleSource.source.sha256 = '0'.repeat(64);
  assert.throws(() => importReview(staleSource), /Different recording/);

  const staleClip = makeReview();
  staleClip.items[0].sha256 = '0'.repeat(64);
  assert.throws(() => importReview(staleClip), /Stale sha256/);

  const changedSourceReader = file => file === intake.source.repositoryFile
    ? Buffer.concat([read(file), Buffer.from('changed')])
    : read(file);
  assert.throws(() => importReview(makeReview(), initialSheet, changedSourceReader), /Source bytes changed/);
});

test('rejects incomplete listening evidence, unknown labels, incomplete inventories, and duplicate clip IDs', () => {
  const noListen = makeReview();
  noListen.items[0].played = null;
  assert.throws(() => importReview(noListen), /Incomplete listen/);

  const unknownLabel = makeReview();
  unknownLabel.items[0].selectedText = 'unknown-label';
  assert.throws(() => importReview(unknownLabel), /Unrecognized selected sound/);

  const missingClip = makeReview();
  missingClip.items.pop();
  assert.throws(() => importReview(missingClip), /Incomplete clip inventory/);

  const duplicateId = makeReview();
  duplicateId.items[1].id = duplicateId.items[0].id;
  assert.throws(() => importReview(duplicateId), /Duplicate clip/);
});

test('rejects duplicate approvals for the same submitted label', () => {
  const duplicate = makeReview();
  duplicate.items[1].decision = 'correct';
  duplicate.items[1].selectedText = label.text;
  duplicate.items[1].played = { sha256: duplicate.items[1].sha256, playedAt: '2026-09-26T12:01:00.000Z' };
  assert.throws(() => importReview(duplicate), /Duplicate approved sound/);
});
