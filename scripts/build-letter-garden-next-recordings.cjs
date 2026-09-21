#!/usr/bin/env node
// Fixed handoff inventory: recording requests must never masquerade as playable reviews.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const base = path.join(root, 'docs/letter-garden/reviews/audio-confirmation');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const selection = read(path.join(base, 'next-recordings.json'));
const catalogue = read(path.join(base, 'manifest.json'));
const owner = read(path.join(base, selection.sourceReview));
const byId = new Map(catalogue.items.map(item => [item.id, item]));
assert.ok(['awaiting-recording', 'recording-received'].includes(selection.status));
const received = selection.status === 'recording-received';
assert.equal(selection.items.length, 100);
assert.equal(new Set(selection.items.map(item => item.id)).size, 100);
for (const item of selection.items) {
  const current = byId.get(item.id);
  assert.equal(current?.text, item.text);
  if (!received) {
    assert.equal(current.status, 'unmapped', `New audio now exists for ${item.id}; update the handoff explicitly`);
    assert.equal(current.parts.length, 0);
  } else {
    assert.ok(['unmapped','candidate','installed'].includes(current.status));
  }
  assert.ok(!owner.decisions[item.id]?.verdict, `Already reviewed: ${item.id}`);
}
const files = new Map();
const write = (name, text) => files.set(name, text);
const batches = [];
for (const group of new Set(selection.items.map(item => item.group))) {
  const items = selection.items.filter(item => item.group === group);
  for (let start = 0; start < items.length; start += 8) {
    const entries = items.slice(start, start + 8);
    const id = `${String(batches.length + 1).padStart(2, '0')}-${group}`;
    const text = entries.map(item => item.text).join('\n\n');
    const file = `batches/${id}.txt`;
    assert.ok(text.length <= 999);
    write(file, text);
    batches.push({ id, file, family: entries[0].family, direction: entries[0].direction,
      characters: text.length, count: entries.length, sha256: crypto.createHash('sha256').update(text).digest('hex'),
      items: entries.map(({id, text}) => ({id, text})) });
  }
}
for (const kind of ['names', 'syllables']) write(`directions/${kind}.txt`, fs.readFileSync(path.join(root,
  `docs/letter-garden/reviews/fm-curriculum-scripts/directions/${kind}.txt`), 'utf8').trim());
write('manifest.json', JSON.stringify({...selection, batches}, null, 2) + '\n');
const esc = text => String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const textarea = (id, text, label, lang = 'en') => `<label for="${id}">${label}</label><textarea id="${id}" readonly lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}" rows="${lang === 'ar' ? 4 : 5}">${esc(text)}</textarea><button type="button" data-copy="${id}">Copy ${label.toLowerCase()}</button>`;
const freshQueue = catalogue.reviewQueues.find(queue => queue.id === 'new-recording');
const ready = received ? freshQueue?.itemIds.length || 0 : 0;
const intro = received
  ? `<h1>Recording received. ${ready} clips are ready to review.</h1>
<p class="intro">Your file <strong>${esc(selection.recording.originalFilename)}</strong> is preserved unchanged. ${ready} of the 100 requested items have new candidate cuts; ${100-ready} still need a reliable cut or replacement. Candidates are excluded from the game until you approve them.</p>
<p class="intro"><strong>Next: <a href="../index.html?section=new-recording">review the new clips</a>.</strong> Check the consonant, short versus long vowel, and both cut edges. Leave this page open and tell me “done” when your decisions are saved. Do not regenerate the entire list yet.</p>
<p class="hint">The original 100-item script below is retained for reference. This page is the recording inventory; listening and decisions happen in the review desk. All earlier approvals and notes are preserved.</p>`
  : `<h1>Next 100 items: new recordings needed</h1>
<p class="intro"><strong>This is a recording pack, not a listening queue.</strong> These 100 distinct items need audio: 2 vowel names, 35 short vowels and 63 long vowels. None repeats an item you had already reviewed when the pack was prepared.</p>
<p class="intro"><strong>Next: generate batch 02 first and attach its audio in Codex.</strong> Use Marin, put the syllable direction in the voice-instructions field, and put only the Arabic text in the speech field. Check that pilot before generating the rest.</p>`;
write('index.html', `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Letter Garden · Next 100 recording requests</title><link rel="stylesheet" href="../review.css?v=9">
<style>textarea[lang="ar"]{font-size:1.65rem;line-height:1.9} .batch-meta{margin-top:.4rem} .jump{display:flex;gap:1rem;flex-wrap:wrap} .items{margin-top:1.5rem} label{display:block;margin-top:1rem} textarea{width:100%;box-sizing:border-box} h2{scroll-margin-top:1rem}</style></head>
<body><main><header><p class="eyebrow">LETTER GARDEN · ADULT AUDIO PREPARATION</p>
${intro}
<p class="hint">There are ${batches.length} files of at most eight items, all below your 999-character limit. Short batches and requested one-second pauses reduce the risk of merged or skipped items; the generated audio still needs checking. Do not read the labels or filenames aloud.</p>
<p class="jump">${received ? '<a href="../index.html?section=new-recording">Review the new recording →</a>' : '<a href="#batch-02-short-vowels">Start with batch 02 ↓</a>'}<a href="../next-recordings-100.zip" download>Download all 100 scripts</a><a href="../index.html?section=boundary-recheck">Return to saved reviews</a></p>
<p class="hint">About your two questions: <span lang="ar" dir="rtl">تً</span> is “tan” and <span lang="ar" dir="rtl">ثً</span> is “than” (th as in “thin”). “Tun/thun” would be <span lang="ar" dir="rtl">تٌ / ثٌ</span>. Both clips remain pending because you did not save a decision. You can finish those two in the review desk when ready.</p>
</header><section aria-label="Voice instructions"><h2>${received ? 'Original voice instructions (reference)' : 'Voice instructions'}</h2>
${textarea('syllables-direction',files.get('directions/syllables.txt'),'Syllable direction')}
<details><summary>Direction for batch 01 · vowel names</summary>${textarea('names-direction',files.get('directions/names.txt'),'Names direction')}</details>
<p id="copy-status" role="status" aria-live="polite">Copy the direction and Arabic text into their separate fields.</p></section>
<section class="items" aria-label="100 recording requests">
${batches.map(batch => `<article class="item"><h2 id="batch-${batch.id}">Batch ${batch.id}</h2><p class="batch-meta">${batch.count} items · ${batch.characters} / 999 characters · use the ${batch.direction === 'names' ? 'names' : 'syllable'} direction</p>${textarea('text-'+batch.id,files.get(batch.file),'Arabic text for batch '+batch.id,'ar')}<p>Save as <strong>${batch.id}.mp3</strong> · <a href="${batch.file}" download>Download Arabic text</a></p></article>`).join('\n')}
</section><p class="hint">${received ? 'Your file is already received. Review the new clips before generating replacements.' : 'Attach original downloaded audio files in Codex. I will split and map them, then provide a listening queue.'} No upload, voice generation or game change happens on this page.</p></main>
<script>document.addEventListener('click',async event=>{const button=event.target.closest('[data-copy]');if(!button)return;const input=document.getElementById(button.dataset.copy),status=document.getElementById('copy-status');try{await navigator.clipboard.writeText(input.value);status.textContent='Copied. Paste into the matching field on the voice site.';button.textContent='Copied ✓';}catch{input.focus();input.select();status.textContent='Text selected. Press Command+C or Ctrl+C to copy.';}});</script></body></html>\n`);
write('README.txt', `LETTER GARDEN — NEXT 100 RECORDING REQUESTS\n\n${received ? 'RECORDING RECEIVED. Open ../index.html?section=new-recording through the preview to review candidate clips. Do not regenerate the full list. These scripts are retained as the original request inventory.' : 'No audio is included. Start with 02-short-vowels.txt and the syllables direction. Generate that pilot and attach its audio before generating the rest.'}\nPut directions/ text in the voice-instructions field and only batches/ text in the speech field. Use Marin. Keep requested pauses between items. Every text is below 999 characters.\nThe 14 batches contain 2 vowel names, 35 short vowels and 63 long vowels. They do not include any prior reviewed clip.\nOpen index.html through the local preview for copy controls.\n`);
const output = path.join(base, 'next-recordings');
for (const [file, text] of files) {
  const target = path.join(output, file);
  if (process.argv.includes('--check')) assert.equal(fs.readFileSync(target,'utf8'),text,`Stale ${file}`);
  else { fs.mkdirSync(path.dirname(target), {recursive:true});fs.writeFileSync(target,text); }
}
console.log(JSON.stringify({items:selection.items.length,batches:batches.length,maxCharacters:Math.max(...batches.map(b=>b.characters)),status:selection.status}));
