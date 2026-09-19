#!/usr/bin/env node
// Apply an explicitly supplied owner export, never browser QA or stale audio decisions.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function applyReview(review, catalogue, sheet, evidenceFile, evidenceHash, readFile) {
  assert.equal(review.kind, 'letter-garden-audio-review');
  assert.equal(review.schemaVersion, 1);
  assert.equal(review.testOnly, false, 'QA decisions cannot approve game audio');
  const current = new Map(catalogue.items.map(item => [item.id, item]));
  const reviewed = new Map(review.items.map(item => [item.id, item]));
  const next = structuredClone(sheet);
  const cuts = new Map(next.cuts.map(cut => [cut.text.normalize('NFC'), cut]));
  const changes = [];
  for (const [id, decision] of Object.entries(review.decisions)) {
    if (!decision.verdict) continue;
    assert.ok(['correct', 'fix', 'unsure'].includes(decision.verdict), `Unknown verdict: ${id}`);
    const item = current.get(id), snapshot = reviewed.get(id);
    assert.ok(item && snapshot, `Unknown review item: ${id}`);
    assert.equal(snapshot.text, item.text, `Text changed: ${id}`);
    assert.equal(snapshot.signature, item.signature, `Export is stale: ${id}`);
    assert.equal(decision.signature, item.signature, `Decision is stale: ${id}`);
    assert.ok(item.parts.length, `No playable audio: ${id}`);
    for (const part of item.parts) assert.equal(hash(readFile(part.file)), part.sha256, `Audio bytes changed: ${id}`);
    if (decision.verdict === 'correct') assert.equal(decision.heardSignature, item.signature, `Incomplete listen: ${id}`);
    const cut = cuts.get(item.text);
    // Alphabet files and name sequences are already installed; keep their evidence in the export.
    if (!cut) {
      assert.equal(decision.verdict, 'correct', `Rejected legacy clip requires a manual mapping change: ${id}`);
      continue;
    }
    assert.equal(item.parts.length, 1, `Never import a name sequence as a word: ${id}`);
    assert.equal(item.source?.id, `marin-curriculum-${cut.source}`);
    assert.equal(item.source.start, cut.start);
    assert.equal(item.source.end, cut.end);
    const status = decision.verdict === 'correct' ? 'imported' : 'needs-review';
    cut.ownerReview = { file: evidenceFile, sha256: evidenceHash, itemId: id,
      signature: item.signature, audioSha256: item.parts[0].sha256,
      verdict: decision.verdict, note: decision.note || '', reviewedAt: decision.updatedAt };
    if (decision.verdict === 'correct') {
      if (!cut.evidence?.includes('Owner listened and approved this exact clip')) {
        cut.evidence = [cut.evidence, `Owner listened and approved this exact clip; ${evidenceFile} (${id}).`].filter(Boolean).join(' ');
      }
      cut.note = 'Owner approved this exact clip in the audio confirmation desk.';
    } else {
      cut.note = `Owner ${decision.verdict === 'fix' ? 'rejected' : 'was unsure about'} this exact clip: ${decision.note || 'no note'}. Excluded from the game pending a new reviewed cut or recording.`;
    }
    changes.push({ id, text: item.text, from: cut.status, to: status, verdict: decision.verdict, note: decision.note || '' });
    cut.status = status;
  }
  return { sheet: next, changes };
}

if (require.main === module) {
  const input = process.argv[2];
  assert.ok(input, 'Usage: node scripts/apply-letter-garden-audio-review.cjs <saved-owner-export.json> [--apply]');
  const absolute = path.resolve(input);
  const relative = path.relative(ROOT, absolute).split(path.sep).join('/');
  assert.ok(!relative.startsWith('../'), 'Preserve the owner export in the repository before applying it');
  const bytes = fs.readFileSync(absolute);
  const readJson = file => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  const sheetFile = 'docs/letter-garden/reviews/marin-curriculum/cuts.json';
  const result = applyReview(JSON.parse(bytes), readJson('docs/letter-garden/reviews/audio-confirmation/manifest.json'),
    readJson(sheetFile), relative, hash(bytes), file => fs.readFileSync(path.join(ROOT, file)));
  if (process.argv.includes('--apply')) fs.writeFileSync(path.join(ROOT, sheetFile), JSON.stringify(result.sheet, null, 2) + '\n');
  console.log(JSON.stringify({ applied: process.argv.includes('--apply'), changes: result.changes.filter(change => change.from !== change.to),
    evidenceRecorded: result.changes.length }, null, 2));
}
module.exports = { applyReview };
