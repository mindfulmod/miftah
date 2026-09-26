#!/usr/bin/env node
// Install only exact, fully heard owner approvals from the independent-cut desk.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const BASE = 'docs/letter-garden/reviews/audio-confirmation/retry-recording/';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function applyIdentification(review, intake, sheet, catalogue, evidenceFile, evidenceHash, readFile) {
  assert.equal(review.kind, 'letter-garden-audio-identification');
  assert.equal(review.schemaVersion, 2);
  assert.equal(review.testOnly, false, 'QA decisions cannot approve game audio');
  assert.equal(review.source.sha256, intake.source.sha256, 'Different recording');
  assert.equal(hash(readFile(intake.source.repositoryFile)), intake.source.sha256, 'Source bytes changed');
  assert.equal(review.submittedTextConfirmed, true);
  assert.equal(review.submittedText, intake.submittedItems.map(item => item.text).join('\n\n'), 'Submitted text changed');
  assert.equal(review.items.length, intake.items.length, 'Incomplete clip inventory');
  assert.equal(new Set(review.items.map(item => item.id)).size, intake.items.length, 'Duplicate clip');
  const next = structuredClone(sheet);
  const reviewed = new Map(review.items.map(item => [item.id, item]));
  const requests = new Map(intake.submittedItems.map(item => [item.text, item]));
  const current = new Map(catalogue.items.map(item => [item.id, item]));
  const approved = [], excluded = [], labels = new Set();
  for (const clip of intake.items) {
    const decision = reviewed.get(clip.id);
    assert.ok(decision, `Missing clip: ${clip.id}`);
    for (const field of ['position', 'start', 'end', 'file', 'sha256']) {
      assert.equal(decision[field], clip[field], `Stale ${field}: ${clip.id}`);
    }
    assert.equal(hash(readFile(BASE + clip.file)), clip.sha256, `Clip bytes changed: ${clip.id}`);
    assert.ok(['correct', 'fix', 'unsure', 'pending'].includes(decision.decision), 'Unknown decision');
    if (decision.decision !== 'correct') {
      excluded.push({ clipId: clip.id, selectedText: decision.selectedText, decision: decision.decision, note: decision.heard || '' });
      continue;
    }
    assert.equal(decision.played?.sha256, clip.sha256, `Incomplete listen: ${clip.id}`);
    assert.ok(decision.played?.playedAt && decision.reviewedAt, `Missing listening evidence: ${clip.id}`);
    const request = requests.get(decision.selectedText);
    assert.ok(request, `Unrecognized selected sound: ${clip.id}`);
    assert.ok(!labels.has(request.text), `Duplicate approved sound: ${request.text}`);
    labels.add(request.text);
    const oldIndex = next.cuts.findIndex(cut => cut.text === request.text);
    const old = next.cuts[oldIndex];
    const alreadyApplied = old?.ownerReview?.file === evidenceFile && old.ownerReview.audioSha256 === clip.sha256;
    assert.ok(old?.status !== 'imported' || alreadyApplied, `Cannot replace a prior approval: ${request.text}`);
    if (!alreadyApplied) {
      const oldItem = current.get(request.id);
      const history = [...(old?.reviewHistory || [])];
      if (old && oldItem?.file) history.push({ ...old, reviewHistory: undefined, file: oldItem.file, sha256: oldItem.sha256 });
      const revision = `r${Number(old?.revision?.slice(1) || 0) + 1}`;
      const source = { id: 'marin-curriculum-batch-4', start: clip.start, end: clip.end };
      const signature = hash(JSON.stringify({ text: request.text.normalize('NFC'), files: [clip.sha256], source }));
      const cut = {
        text: request.text, source: 'batch-4', start: clip.start, end: clip.end, status: 'imported', revision,
        evidence: `Owner listened and approved this exact clip and selected its teaching label; ${evidenceFile} (${clip.id}).`,
        note: 'Owner approved this exact clip in the independent-cut audio desk.',
        ownerReview: { file: evidenceFile, sha256: evidenceHash, itemId: request.id, clipId: clip.id, signature,
          audioSha256: clip.sha256, verdict: 'correct', note: decision.heard || '', reviewedAt: decision.reviewedAt },
        ...(history.length ? { reviewHistory: history } : {})
      };
      if (oldIndex < 0) next.cuts.push(cut); else next.cuts[oldIndex] = cut;
    }
    const cut = next.cuts.find(item => item.text === request.text);
    approved.push({ clipId: clip.id, id: request.id, text: request.text, sha256: clip.sha256,
      file: `assets/audio/letters/marin-curriculum-v1/${request.id}-${cut.revision}.wav` });
  }
  if (approved.length && !next.sources.some(source => source.id === 'batch-4')) next.sources.push({
    id: 'batch-4', file: 'sources/batch-4.mp3', originalFilename: intake.source.originalFilename,
    sha256: intake.source.sha256, duration: intake.source.duration, receivedOn: intake.receivedOn,
    requestFile: '../audio-confirmation/retry-recording/submitted-text.txt', title: 'Marin curriculum — owner-reviewed retry recording'
  });
  return { sheet: next, approved, excluded, remaining: intake.submittedItems.filter(item => !labels.has(item.text)) };
}

if (require.main === module) {
  assert.ok(process.argv[2], 'Usage: node scripts/apply-letter-garden-audio-identification.cjs <owner-export.json> [--apply]');
  const absolute = path.resolve(process.argv[2]);
  const relative = path.relative(ROOT, absolute).split(path.sep).join('/');
  assert.ok(!relative.startsWith('../'), 'Preserve owner evidence inside the repository');
  const read = file => fs.readFileSync(path.join(ROOT, file));
  const json = file => JSON.parse(read(file));
  const sheetFile = 'docs/letter-garden/reviews/marin-curriculum/cuts.json';
  const result = applyIdentification(JSON.parse(read(relative)), json(BASE + 'manifest.json'), json(sheetFile),
    json('docs/letter-garden/reviews/audio-confirmation/manifest.json'), relative, hash(read(relative)), read);
  if (process.argv.includes('--apply')) {
    fs.writeFileSync(path.join(ROOT, sheetFile), JSON.stringify(result.sheet, null, 2) + '\n');
    fs.writeFileSync(path.join(ROOT, BASE, 'applied-review.json'), JSON.stringify({ evidenceFile: relative,
      evidenceSha256: hash(read(relative)), approved: result.approved, excluded: result.excluded, remaining: result.remaining }, null, 2) + '\n');
  }
  console.log(JSON.stringify({ applied: process.argv.includes('--apply'), approved: result.approved, excluded: result.excluded, remaining: result.remaining }, null, 2));
}
module.exports = { applyIdentification };
