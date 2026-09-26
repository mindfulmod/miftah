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
const retryApplication = json(base + 'retry-recording/applied-review.json');
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
  const laterApprovals = new Set(retryApplication.approved.map(item => item.id));
  for (const item of assessment.unresolved) {
    assert.equal(byId.get(item.id).status, laterApprovals.has(item.id) ? 'installed' : 'unmapped');
  }
});

const reviewFile = base + 'owner-reviews/20260925-new-recording.json';
const owner = json(reviewFile);
const bank = JSON.parse(read('src/letters/LetterVoiceClips.js').toString().match(/Object\.freeze\((\{[\s\S]*?\})\)/)[1]);
const sheet = json('docs/letter-garden/reviews/marin-curriculum/cuts.json');

test('new approvals install the exact heard bytes, rejected clips stay excluded and cuts do not overlap', () => {
  const shell = read('sw.js').toString();
  const selected = queue.itemIds.map(id => byId.get(id));
  assert.equal(selected.filter(item => owner.decisions[item.id].verdict === 'correct').length, 73);
  assert.equal(selected.filter(item => owner.decisions[item.id].verdict === 'fix').length, 3);
  for (const item of selected) {
    const decision = owner.decisions[item.id], snapshot = owner.items.find(old => old.id === item.id);
    const cut = sheet.cuts.find(cut => cut.text === item.text);
    if (cut.ownerReview.file === retryApplication.evidenceFile) {
      const approval = retryApplication.approved.find(entry => entry.id === item.id);
      assert.ok(approval, `Unexpected later approval: ${item.text}`);
      assert.equal(item.status, 'installed');
      assert.equal(item.parts[0].file, approval.file);
      assert.equal(hash(item.file), approval.sha256);
      assert.equal(bank[item.text], approval.file);
      assert.ok(shell.includes(approval.file));
      assert.equal(cut.reviewHistory[0].ownerReview.file, reviewFile);
      assert.equal(cut.reviewHistory[0].ownerReview.verdict, 'fix');
      assert.equal(cut.reviewHistory[0].file, snapshot.parts[0].file);
      assert.equal(cut.reviewHistory[0].sha256, hash(snapshot.parts[0].file));
    } else {
      assert.equal(item.signature, snapshot.signature);
      assert.equal(decision.signature, item.signature);
      assert.equal(item.parts.length, 1);
      assert.equal(item.source.id, pack.recording.sourceId);
      assert.equal(hash(item.file), item.sha256);
      assert.equal(hash(snapshot.parts[0].file), item.sha256, 'Preserve the original reviewed candidate');
      assert.equal(cut.ownerReview.file, reviewFile);
      assert.equal(cut.ownerReview.sha256, hash(reviewFile));
      assert.equal(cut.ownerReview.note, decision.note);
      if (decision.verdict === 'correct') {
        assert.equal(decision.heardSignature, item.signature);
        assert.equal(item.status, 'installed');
        assert.equal(bank[item.text], item.file);
        assert.ok(shell.includes(item.file));
      } else {
        assert.equal(item.status, 'candidate');
        assert.equal(bank[item.text], undefined);
        assert.ok(!shell.includes(item.id));
      }
    }
    assert.ok(!assessment.baseline.playableSignatures[item.id]);
    for (const other of selected) {
      if (item.id === other.id || other.source?.id !== item.source.id) continue;
      assert.ok(Math.min(item.source.end, other.source.end) - Math.max(item.source.start, other.source.start) <= .004,
        `${item.text} overlaps ${other.text}`);
    }
  }
});

test('new approvals preserve every prior playable signature and add only reviewed keys', () => {
  assert.equal(Object.keys(assessment.baseline.playableSignatures).length, 370);
  for (const [id, signature] of Object.entries(assessment.baseline.playableSignatures)) {
    assert.equal(byId.get(id).signature, signature, `Prior audio changed: ${id}`);
    for (const part of byId.get(id).parts) assert.equal(hash(part.file), part.sha256);
  }
  const previousInstalled = owner.items.filter(item => item.status === 'installed');
  assert.equal(previousInstalled.length, 164);
  const additions = queue.itemIds.filter(id => owner.decisions[id].verdict === 'correct').map(id => byId.get(id).text);
  const laterApprovals = retryApplication.approved.map(item => item.text);
  assert.deepEqual(Object.keys(bank).sort(), [...new Set([...previousInstalled.map(item => item.text), ...additions, ...laterApprovals])].sort());
  const shell = read('sw.js').toString();
  for (const item of catalogue.items.filter(item => item.status === 'installed')) {
    for (const part of item.parts) assert.ok(shell.includes(part.file));
  }
});

test('the focused recording retry contains only the three rejections and 24 unresolved requests', () => {
  const retry = json(base + 'recording-retry/manifest.json');
  const expected = [...assessment.unresolved.map(item => item.id), ...queue.itemIds.filter(id => owner.decisions[id].verdict === 'fix')].sort();
  assert.equal(retry.items.length, 27);
  assert.equal(new Set(retry.items.map(item => item.id)).size, 27);
  assert.deepEqual(retry.items.map(item => item.id).sort(), expected);
  assert.deepEqual(retry.batches.flatMap(batch => batch.items.map(item => item.id)).sort(), expected);
  for (const batch of retry.batches) {
    const text = read(base + 'recording-retry/' + batch.file).toString();
    assert.ok(batch.count <= 3);
    assert.equal(text.length, batch.characters);
    assert.ok(text.length <= 999);
    assert.equal(hash(base + 'recording-retry/' + batch.file), batch.sha256);
    assert.deepEqual(text.split('\n\n'), batch.items.map(item => item.text));
    assert.equal(new Set(batch.items.map(item => item.group)).size, 1, 'Keep short and long exercises separate');
  }
  const laterApprovals = new Map(retryApplication.approved.map(item => [item.text, item]));
  for (const item of retry.items) {
    const approval = laterApprovals.get(item.text);
    assert.equal(bank[item.text], approval?.file);
  }
});

test('stale batch-three evidence cannot replace the retry and its rejection is archived', () => {
  const { applyReview } = require('../../../scripts/apply-letter-garden-audio-review.cjs');
  const scoped = { ...owner, decisions: Object.fromEntries(queue.itemIds.map(id => [id, owner.decisions[id]])) };
  assert.throws(() => applyReview(scoped, catalogue, sheet, reviewFile, hash(reviewFile), read), /Export is stale: lg-390d2843328d/);
  const cut = sheet.cuts.find(item => item.text === 'فِ');
  assert.equal(cut.reviewHistory[0].ownerReview.file, reviewFile);
  assert.equal(cut.reviewHistory[0].ownerReview.verdict, 'fix');
  assert.equal(cut.reviewHistory[0].ownerReview.note, 'sounds like fif');
  assert.equal(hash(cut.reviewHistory[0].file), cut.reviewHistory[0].sha256);
});
