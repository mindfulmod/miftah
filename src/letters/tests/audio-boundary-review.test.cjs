const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Core = require('../../../docs/letter-garden/reviews/audio-confirmation/review-core.js');
const root = path.resolve(__dirname, '../../..');
const read = file => fs.readFileSync(path.join(root, file));
const json = file => JSON.parse(read(file));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const base = 'docs/letter-garden/reviews/audio-confirmation/';
const owner = json(base + 'owner-reviews/20260919-individuals.json');
const manifest = json(base + 'manifest.json');
const latest = json(base + 'owner-reviews/20260919-boundary-recheck.json');
const byId = new Map(manifest.items.map(item => [item.id, item]));
const original = new Map(owner.items.map(item => [item.id, item]));
const queue = manifest.reviewQueues.find(q => q.id === 'boundary-recheck');

test('the 100-item review preserves exactly 46 approvals and 54 rejection notes', () => {
 const prior = manifest.reviewQueues.find(q => q.id === 'individuals');
 const counts = {correct:0,fix:0};
 for (const id of prior.itemIds) {
  const decision = owner.decisions[id];counts[decision.verdict]++;
  assert.ok(decision.verdict === 'correct' || decision.note.length);
  if (decision.verdict === 'correct') {
   const item = byId.get(id);assert.equal(item.status,'installed');
   assert.equal(item.signature,decision.signature);
   assert.equal(hash(read(item.file)),original.get(id).parts[0].sha256);
  }
 }
 assert.deepEqual(counts,{correct:46,fix:54});
});

test('22 recuts preserve originals and only exact new approvals enter the game', () => {
 assert.equal(queue.itemIds.length,22);assert.equal(new Set(queue.itemIds).size,22);
 const bank = read('src/letters/LetterVoiceClips.js').toString(), shell = read('sw.js').toString();
 for (const id of queue.itemIds) {
  const item=byId.get(id),old=original.get(id);
  assert.equal(owner.decisions[id].verdict,'fix');
  const approved=latest.decisions[id].verdict==='correct';
  assert.equal(item.status,approved?'installed':'candidate');
  assert.equal(item.signature,latest.decisions[id].signature);
  assert.equal(item.revision,'r1');assert.notEqual(item.signature,old.signature);
  assert.equal(item.previousParts.length,1);
  assert.equal(hash(read(old.parts[0].file)),old.parts[0].sha256);
  assert.equal(item.previousParts[0].sha256,old.parts[0].sha256);
  assert.equal(hash(read(item.file)),item.sha256);
  assert.equal(Core.current(item,owner).stale,true);
  assert.equal(Core.current(item,owner).note,owner.decisions[id].note);
  assert.equal(Core.current(item,owner).heardSignature,'');
  assert.equal(bank.includes(id),approved);assert.equal(shell.includes(id),approved);
 }
});

test('all remaining flagged individual clips remain unchanged and excluded', () => {
 const assessment=json(base+'boundary-repair-assessment.json');assert.equal(assessment.unresolved.length,32);
 for(const entry of assessment.unresolved){const item=byId.get(entry.id);
  assert.equal(item.status,'candidate');assert.equal(item.signature,owner.decisions[entry.id].signature);
  assert.equal(owner.decisions[entry.id].verdict,'fix');
 }
});

test('latest boundary review installs 17 approvals and holds 3 rejections and 2 questions',()=>{
 const decisions=queue.itemIds.map(id=>latest.decisions[id]);
 assert.equal(decisions.filter(d=>d.verdict==='correct').length,17);
 assert.equal(decisions.filter(d=>d.verdict==='fix').length,3);
 const pending=queue.itemIds.filter(id=>!latest.decisions[id].verdict);
 assert.deepEqual(pending.map(id=>byId.get(id).text),['تً','ثً']);
 for(const id of pending){assert.equal(byId.get(id).status,'candidate');assert.ok(latest.decisions[id].note.length);}
});
