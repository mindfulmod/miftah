// Recording supplement for the v26–v29 features (Letter Friends, Picture
// Words, Living Books). Same format as export-letter-garden-audio.mjs: plain
// Arabic batch files plus a list. Read-only; it never generates audio.
// Run: node scripts/export-friends-audio.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'docs/letter-garden/reviews/fm-curriculum-scripts');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const ns = {};
const ctx = { window: { MiftahGame: ns }, console, setTimeout, clearTimeout };
for (const f of ['src/data/letters.js', 'src/letters/LetterVoiceClips.js', 'src/letters/LettersStrokes.js', 'src/letters/LetterFriends.js', 'src/letters/PictureWords.js', 'src/letters/LivingBooks.js']) vm.runInNewContext(read(f), ctx, { filename: f });
const N = (t) => String(t || '').normalize('NFC').trim();
const have = new Set(Object.keys(ns.LETTER_VOICE_CLIPS).map(N));
const id = (t) => `lg-${createHash('sha256').update(t).digest('hex').slice(0, 12)}`;
const seen = new Set();
const take = (list) => list.map(N).filter((t) => t && !have.has(t) && !seen.has(t) && seen.add(t));

const friends = take(Object.values(ns.LetterFriends.FRIENDS).map((f) => f.word));
const pictures = take(ns.PictureWords.LIST.map((p) => p.word));
const bookWords = [];
for (const b of ns.LivingBooks.BOOKS) for (const p of b.pages(Object.keys(ns.LetterFriends.FRIENDS)))
  for (const w of `${p.text} ${p.reveal || ''}`.split(/\s+/)) bookWords.push(w.replace(/[؟?.!،]/g, ''));
const books = take([...ns.LivingBooks.BOOKS.map((b) => b.title.replace(/[؟?]/g, '')), ...bookWords]);

const batches = [['24-friend-names', friends, 'words'], ['25-picture-words', pictures, 'words'], ['26-book-words', books, 'words']];
for (const [name, items] of batches) fs.writeFileSync(path.join(out, 'batches', `${name}.txt`), items.join('\n\n') + '\n');
const md = [`# Letter Garden — recording supplement for Letter Friends, Picture Words and Living Books`, '',
  `Prepared ${new Date().toISOString().slice(0, 10)}. Same voice (Marin), same "words" direction as FULL-LIST.md, same rules: one batch per generation, save under the batch ID, send back for segmentation and owner listening. Until a clip is approved and mapped, the game uses the device's speech voice for these words.`, '',
  `These are names and simple words read in pausal form (no case endings), exactly as written. Book words are recorded one at a time because the books light each word as it is spoken.`, '',
  ...batches.flatMap(([name, items]) => [`## ${name} (${items.length})`, '', '| ID | Arabic |', '|---|---|', ...items.map((t) => `| ${id(t)} | ${t} |`), '']),
  `Total new clips: ${batches.reduce((n, [, i]) => n + i.length, 0)}.`, ''].join('\n');
fs.writeFileSync(path.join(out, 'FRIENDS-BOOKS-SUPPLEMENT.md'), md);
console.log(batches.map(([n, i]) => `${n}: ${i.length}`).join('\n'));
