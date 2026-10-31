const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../../..');
let inventory;
const audit = async () => inventory ||= (await import('../../../scripts/audit-letter-garden-audio.mjs')).auditAudio();

test('speech inventory covers optional pictures, story variants, reading words and exact vowel distinctions', async () => {
  const result = await audit();
  const texts = new Map(result.entries.map(e => [e.text, e]));
  for (const text of ['بَ', 'بِ', 'بُ', 'بَا', 'بِي', 'بُو', 'بً', 'بٍ', 'بٌ']) assert.ok(texts.has(text), text);
  const ns = {}, context = { window: { MiftahGame: ns } };
  for (const name of ['LetterFriends', 'PictureWords', 'LivingBooks']) vm.runInNewContext(fs.readFileSync(path.join(root, `src/letters/${name}.js`), 'utf8'), context);
  for (const p of [...Object.values(ns.LetterFriends.FRIENDS), ...ns.PictureWords.LIST]) assert.ok(texts.has(p.word.normalize('NFC')), p.word);
  const chars = Object.keys(ns.LetterFriends.FRIENDS);
  for (const book of ns.LivingBooks.BOOKS) for (let i = 0; i < chars.length; i++) {
    for (const page of book.pages([...chars.slice(i), ...chars.slice(0, i)])) {
      for (const line of [book.title, page.text || '', page.reveal || '']) for (const raw of line.split(/\s+/)) {
        const text = raw.replace(/[؟?.!،]/g, '').normalize('NFC').trim();
        if (text) assert.ok(texts.has(text), text);
      }
    }
  }
  for (const n of [1,105,106,107,108,109,110,111,112,113,114]) {
    const surah = JSON.parse(fs.readFileSync(path.join(root, `data/surah-${n}.json`), 'utf8'));
    for (const ayah of surah.ayahs) for (const word of ayah.words) assert.ok(texts.has(word.arabic.normalize('NFC').trim()), word.arabic);
  }
  assert.deepEqual(result.missingFiles, []);
});

test('inventory keeps unsupported pronunciation separate and never marks a new candidate approved', async () => {
  const result = await audit();
  assert.equal(result.entries.find(e => e.text === 'أَذِّ').status, 'needs-generation');
  assert.equal(result.entries.find(e => e.text === 'اْ'), undefined);
  const isolated = result.entries.find(e => e.text === 'دْ');
  assert.equal(isolated.status, 'pronunciation-decision');
  assert.ok(isolated.uses.includes('chapter:decode:target:part'));
  for (const entry of result.entries.filter(e => e.status === 'approved-local')) assert.ok(fs.existsSync(path.join(root, entry.clip)));
  assert.ok(result.entries.find(e => e.text === 'أَبْ').uses.includes('sound-lab'));
  assert.ok(result.entries.find(e => e.text === 'أَبَّ'.normalize('NFC')).uses.includes('sound-lab'));
});
