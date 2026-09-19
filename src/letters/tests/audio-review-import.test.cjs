const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { applyReview } = require('../../../scripts/apply-letter-garden-audio-review.cjs');
const root = path.resolve(__dirname, '../../..');
const read = file => fs.readFileSync(path.join(root, file));
const json = file => JSON.parse(read(file));
const evidence = 'docs/letter-garden/reviews/audio-confirmation/owner-reviews/20260919.json';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const review = json(evidence);
const catalogue = json('docs/letter-garden/reviews/audio-confirmation/manifest.json');
const sheet = json('docs/letter-garden/reviews/marin-curriculum/cuts.json');
// Reconstruct the reviewed cuts from retained history; their original WAV files remain available.
const reviewedSheet = structuredClone(sheet);
for (const cut of reviewedSheet.cuts.filter(cut => cut.revision)) {
  const { file, sha256, ...previous } = cut.reviewHistory.pop();
  Object.assign(cut, previous);
  delete cut.revision;
  if (!cut.reviewHistory.length) delete cut.reviewHistory;
}
const run = (data = review, readFile = read) => applyReview(data, { items: review.items }, reviewedSheet, evidence, hash(read(evidence)), readFile);

test('all owner approvals retain their reviewed audio; every rejected recording is excluded from runtime and precache', () => {
  const current = new Map(catalogue.items.map(item => [item.id, item]));
  const bank = fs.readFileSync(path.join(root, 'src/letters/LetterVoiceClips.js'), 'utf8');
  const shell = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  let approvedClips = 0, rejected = 0;
  for (const old of review.items) {
    const item = current.get(old.id), decision = review.decisions[old.id];
    if (!item.revision) assert.equal(item.signature, old.signature, `${old.id} changed after review`);
    if (decision?.verdict === 'correct') {
      assert.equal(item.signature, old.signature, `${old.id} approval no longer matches`);
      assert.ok(['installed', 'sequence'].includes(item.status));
      for (const part of item.parts) assert.equal(hash(read(part.file)), part.sha256);
      if (item.status === 'installed') { approvedClips++; assert.ok(bank.includes(item.file)); assert.ok(shell.includes(item.file)); }
    }
    if (decision?.verdict === 'fix') {
      rejected++;
      assert.equal(item.status, 'candidate');
      assert.ok(!bank.includes(old.id));
      assert.ok(!shell.includes(old.id));
    }
  }
  assert.equal(approvedClips, 85);
  assert.equal(rejected, 21);
});

test('reapplying exact owner evidence is idempotent and preserves rejection notes', () => {
  const result = run();
  assert.deepEqual(result.sheet, reviewedSheet);
  assert.equal(result.changes.filter(change => change.from !== change.to).length, 0);
  for (const change of result.changes.filter(change => change.verdict === 'fix')) {
    const cut = sheet.cuts.find(cut => cut.text === change.text);
    assert.equal(cut.ownerReview.note, review.decisions[change.id].note);
    assert.equal(cut.ownerReview.sha256, hash(read(evidence)));
  }
});

test('revised cuts retain the rejected originals and cannot inherit their previous review', () => {
  const { current } = require('../../../docs/letter-garden/reviews/audio-confirmation/review-core.js');
  const revisions = catalogue.items.filter(item => item.revision);
  assert.equal(revisions.length, 4);
  for (const item of revisions) {
    const original = review.items.find(old => old.id === item.id);
    assert.equal(item.status, 'candidate');
    assert.notEqual(item.signature, original.signature);
    assert.equal(hash(read(original.parts[0].file)), original.parts[0].sha256);
    assert.equal(hash(read(item.parts[0].file)), item.parts[0].sha256);
    assert.equal(current(item, review).stale, true);
    assert.equal(current(item, review).note, review.decisions[item.id].note);
    assert.equal(current(item, review).heardSignature, '');
  }
  assert.throws(() => applyReview(review, catalogue, sheet, evidence, hash(read(evidence)), read), /Export is stale/);
});

test('import refuses QA decisions, stale mappings, incomplete approvals, and changed audio bytes before writing', () => {
  const id = Object.keys(review.decisions).find(id => review.decisions[id].verdict === 'correct');
  const qa = structuredClone(review); qa.testOnly = true;
  assert.throws(() => run(qa), /QA decisions/);
  const stale = structuredClone(review); stale.decisions[id].signature = '0'.repeat(64);
  assert.throws(() => run(stale), /Decision is stale/);
  const unheard = structuredClone(review); unheard.decisions[id].heardSignature = '';
  assert.throws(() => run(unheard), /Incomplete listen/);
  assert.throws(() => run(review, () => Buffer.from('changed')), /Audio bytes changed/);
});
