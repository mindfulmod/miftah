const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../../..');
const read = p => fs.readFileSync(path.join(root, p));
const json = p => JSON.parse(read(p));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const manifest = json('assets/audio/letters/marin-teacher-v1/manifest.json');
const window = { MiftahGame: {} };
vm.runInNewContext(read('src/letters/LetterVoiceClips.js').toString(), { window });
const bank = window.MiftahGame.LETTER_VOICE_CLIPS;

test('all installed teacher files are exact copies of explicit owner approvals', () => {
  assert.ok(manifest.items.length >= 109);
  const shell = read('sw.js').toString();
  for (const item of manifest.items) {
    const evidence = read(item.approvalFile);
    assert.equal(hash(evidence), item.approvalSHA256);
    const review = JSON.parse(evidence);
    const decision = review.reviews.find(r => r.id === item.id);
    assert.equal(decision.decision, 'correct');
    assert.equal(decision.input, item.text);
    assert.equal(decision.sha256, item.sha256);
    assert.ok(!review.held.some(r => r.id === item.id));
    assert.equal(hash(read(item.file)), item.sha256);
    assert.deepEqual(read(item.file), read(item.sourceFile));
    assert.equal(bank[item.text], item.file);
    assert.ok(shell.includes('"' + item.file + '"'));
  }
});

test('held clips, wrong Timsah attempts and the full carrier phrase never enter the bank', () => {
  const review = json('docs/letter-garden/reviews/marin-api-20261028/teacher-library/batch100-diagnosis.json');

  for (const item of review.held) assert.ok(!manifest.items.some(i => i.sha256 === item.sha256), "Rejected bytes remain excluded even after a replacement is approved");
  const cut = json('docs/letter-garden/reviews/marin-api-20261028/teacher-library/timsah-context/cut-manifest.json');
  const installed = manifest.items.find(i => i.text === 'تِمْسَاح');
  assert.equal(installed.sha256, cut.sha256);
  assert.equal(installed.durationSeconds, 1.45);
  assert.equal(bank['نَقُولُ: تِمْسَاحْ.'], undefined);
  const old = json('docs/letter-garden/reviews/marin-api-20261028/teacher-library/owner-review.json').history.filter(r => r.input === 'تِمْسَاح');
  for (const item of old) assert.notEqual(item.sha256, installed.sha256);
});

test('approved tanwin recordings keep their exact game keys and expose no phonetic aliases', () => {
  const plan=json('docs/letter-garden/reviews/marin-api-20261028/tanwin-check-plan.json');
  for (const job of plan.jobs) {
    const item=manifest.items.find(i=>i.text===job.targetInput);
    assert.ok(item);
    assert.equal(bank[job.targetInput],item.file);
    assert.deepEqual(read(item.file),read('docs/letter-garden/reviews/marin-api-20261028/tanwin-candidates/'+job.id+'.wav'));
    assert.equal(bank[job.input],undefined);
  }
});

test('the latest tanwin batch installs only its 17 exact approvals', () => {
  const review=json('docs/letter-garden/reviews/marin-api-20261028/teacher-library/tanwin-remaining-owner-review.json');
  assert.equal(review.reviews.filter(r=>r.decision==='correct').length,17);
  for(const r of review.reviews){
    if(r.decision==='correct'){
      const i=manifest.items.find(i=>i.text===r.input);assert.equal(i.sha256,r.sha256);assert.equal(bank[r.input],i.file);
    }else{assert.ok(!manifest.items.some(i=>i.sha256===r.sha256));}
  }
});
