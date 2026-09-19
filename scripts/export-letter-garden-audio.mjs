// Reproducible, read-only curriculum audit and owner-facing recording scripts.
// Run from anywhere with: node scripts/export-letter-garden-audio.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'docs/letter-garden/reviews/fm-curriculum-scripts');
const preparedOn = new Date().toISOString().slice(0, 10);
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const hash = value => createHash('sha256').update(value).digest('hex');
const normalized = text => text.normalize('NFC').trim();
const ns = {};
const sourceFiles = ['src/data/letters.js', 'src/letters/LettersBoot.js',
  'src/letters/LettersWorlds.js', 'src/letters/LetterVoiceClips.js'];
const loadedData = new Set();
const context = {
  window: { MiftahGame: ns }, AbortController, setTimeout, clearTimeout,
  fetch: async url => {
    assert.match(url, /^data\/surah-\d+\.json$/);
    loadedData.add(url);
    return { ok: true, json: async () => JSON.parse(read(url)) };
  },
};
for (const file of sourceFiles) vm.runInNewContext(read(file), context, { filename: file });
const curriculum = new ns.LettersWorlds();
await curriculum.loadWords();
const names = new Set(curriculum.letters.map(letter => normalized(letter.arName)));
const clips = new Map(Object.entries(ns.LETTER_VOICE_CLIPS).map(([text, file]) => [normalized(text), file]));
const requests = new Map();
function collect(item, world, role, parent = null) {
  const text = normalized(item.speak || item.display || '');
  if (!text) return;
  if (!requests.has(text)) requests.set(text, {
    id: `lg-${hash(text).slice(0, 12)}`, text, uses: [],
  });
  const entry = requests.get(text);
  const use = { world: world.id, role, display: item.display || null,
    parent, ...(item.audioPath ? { existingWordAudioReference: item.audioPath } : {}) };
  if (!entry.uses.some(existing => JSON.stringify(existing) === JSON.stringify(use))) entry.uses.push(use);
  for (const part of item.parts || []) collect(part, world, 'assembly-piece', item.display);
}
const doneIds = curriculum.worlds.map(world => world.id);
for (const world of curriculum.worlds) {
  for (const item of world.catalogueItems()) collect(item, world, 'target');
  for (const item of world.meet) collect(item, world, 'introduction');
  for (const item of world.extraItems?.(doneIds) || []) collect(item, world, 'extra-item');
  // Match ChainGame's complete possible pool, not one random four-round sample.
  if (world.games.includes('chain')) {
    for (const pair of world.catalogue.filter(item => item.parts?.length === 2 && item.join2)) {
      for (const third of world.extraItems().filter(letter =>
        !pair.parts.some(part => part.display === letter.display))) {
        collect({ display: pair.display + third.display, speak: `${pair.speak}، ${third.speak}` },
          world, 'dynamic-chain');
      }
    }
  }
}

const groups = [
  ['missing-names', 'Missing letter names', 'names'],
  ['mark-names', 'Vowel and tanween names', 'names'],
  ['short-vowels', 'Short vowels: fatha, kasra, damma', 'syllables'],
  ['long-vowels', 'Long vowels (also used for standing vowels)', 'syllables'],
  ['tanween', 'Tanween syllables', 'syllables'],
  ['leen', 'Leen: aw and ay glides', 'syllables'],
  ['sukun-shaddah', 'Sukun, shaddah and mixed examples', 'syllables'],
  ['words-2', 'Two-letter word stage', 'words'],
  ['words-3', 'Three-letter word stage', 'words'],
  ['words-4-5', 'Four- and five-letter word stage', 'words'],
].map(([key, title, direction]) => ({ key, title, direction, entries: [] }));
const groupByKey = new Map(groups.map(group => [group.key, group]));
const usedAsTargetIn = (entry, ...worlds) => entry.uses.some(use =>
  worlds.includes(use.world) && ['target', 'introduction'].includes(use.role));
for (const entry of requests.values()) {
  if (clips.has(entry.text)) {
    entry.status = 'already-bundled'; entry.clip = clips.get(entry.text); continue;
  }
  const sequence = entry.text.split('،').map(normalized);
  if (sequence.length > 1 && sequence.every(name => names.has(name))) {
    entry.sequence = sequence;
    entry.missingSequenceClips = sequence.filter(name => !clips.has(name));
    entry.status = entry.missingSequenceClips.length ? 'sequence-needs-name-clips' : 'reuse-name-sequence';
    entry.note = entry.missingSequenceClips.length
      ? 'The local name queue cannot play this prompt until every listed exact name clip exists. Muqattaat entries are the current name-reading model, not qualified recitation.'
      : 'The runtime local queue can play these exact individual name clips. Muqattaat entries are the current name-reading model, not qualified recitation.';
    continue;
  }
  let group;
  if (names.has(entry.text)) group = 'missing-names';
  else if ([...ns.LETTERS_DATA.harakat, ...ns.LETTERS_DATA.tanween]
    .some(mark => normalized(mark.arName) === entry.text)) group = 'mark-names';
  else if (usedAsTargetIn(entry, 'fatha', 'kasra-damma')) group = 'short-vowels';
  else if (usedAsTargetIn(entry, 'standing', 'long-sounds')) group = 'long-vowels';
  else if (usedAsTargetIn(entry, 'tanween')) group = 'tanween';
  else if (usedAsTargetIn(entry, 'leen')) group = 'leen';
  else if (usedAsTargetIn(entry, 'sukoon', 'shaddah', 'shaddah-mix')) group = 'sukun-shaddah';
  else if (usedAsTargetIn(entry, 'words-2')) group = 'words-2';
  else if (usedAsTargetIn(entry, 'decode')) group = 'words-3';
  else if (usedAsTargetIn(entry, 'decode-4')) group = 'words-4-5';
  if (group) {
    entry.status = 'record-and-review'; entry.group = group;
    groupByKey.get(group).entries.push(entry);
  } else {
    entry.status = 'assembly-policy-review';
    entry.note = 'Exact current standalone assembly-piece request. Decide its teaching pronunciation in context before recording; do not automatically replace it with a letter name or add a vowel.';
  }
}

// Keep every letter's short/long/tanween triplet together for easier checking.
const alphabetRank = new Map(curriculum.letters.map((letter, index) => [letter.char, index]));
for (const key of ['short-vowels', 'long-vowels', 'tanween', 'leen']) {
  groupByKey.get(key).entries.sort((a, b) => alphabetRank.get(a.text[0]) - alphabetRank.get(b.text[0]));
}
const baseDirection = `Speak in Arabic with a warm, gentle, natural teaching voice for children aged 4–6. Use clear articulation and a relaxed speaking pace, without whispering, singing or theatrical emphasis. Read every non-empty line exactly once, in order. Leave about one second of silence between lines. Do not say item numbers, labels, translations, instructions or commentary. Do not omit, combine or repeat items.`;
const directions = {
  names: `${baseDirection}\n\nThese lines are names. Say each name as written.`,
  syllables: `${baseDirection}\n\nThese are fully vowelled reading exercises, not letter names. Pronounce each whole line as its written syllable or example. Preserve the short-vowel versus long-vowel contrast, written tanween endings, glides, sukun and doubled consonants. The pause between lines is only a separator: do not drop the written short vowel or tanween at the end of an exercise. Do not add an unwritten vowel.`,
  words: `${baseDirection}\n\nThese are isolated Arabic reading exercises from the game's Quran-word catalogue. Read each complete word in a plain teaching voice. Preserve the written vowels and endings for the exercise, including tanween; do not turn the list into connected sentences or a recitation performance. Preserve consonant distinctions and doubled consonants.`,
};
const write = (file, content) => {
  fs.mkdirSync(path.dirname(path.join(output, file)), { recursive: true });
  fs.writeFileSync(path.join(output, file), content);
};
for (const [kind, direction] of Object.entries(directions)) write(`directions/${kind}.txt`, direction + '\n');
const batches = [];
for (const group of groups) {
  for (let start = 0, part = 1; start < group.entries.length; start += 9, part++) {
    const entries = group.entries.slice(start, start + 9);
    const id = `${String(batches.length + 1).padStart(2, '0')}-${group.key}-${String(part).padStart(2, '0')}`;
    const file = `batches/${id}.txt`;
    // Text field contains Arabic only; punctuation and labels are not spoken targets.
    const script = entries.map(entry => entry.text).join('\n\n') + '\n';
    write(file, script);
    const batch = { id, group: group.key, file, count: entries.length,
      directions: `directions/${group.direction}.txt`, sha256: hash(script),
      entries: entries.map(entry => ({ id: entry.id, text: entry.text })) };
    batches.push(batch);
    entries.forEach((entry, index) => { entry.batch = id; entry.position = index + 1; });
  }
}
const entries = [...requests.values()];
const completed = entries.filter(entry => entry.status === 'already-bundled');
const sequences = entries.filter(entry => entry.status === 'reuse-name-sequence');
const unsupportedSequences = entries.filter(entry => entry.status === 'sequence-needs-name-clips');
const held = entries.filter(entry => entry.status === 'assembly-policy-review');
const recording = entries.filter(entry => entry.status === 'record-and-review');
const counts = { worlds: curriculum.worlds.length, uniqueRequests: entries.length,
  exactLocalClips: clips.size,
  alreadyBundled: completed.length, recordAndReview: recording.length,
  reuseNameSequences: sequences.length, assemblyPolicyReview: held.length,
  sequenceNeedsNameClips: unsupportedSequences.length,
  batches: batches.length, wordEntries: groups.filter(group => group.direction === 'words')
    .reduce((total, group) => total + group.entries.length, 0),
  wordCatalogueEntries: curriculum.worlds.filter(world => world.kind === 'words')
    .reduce((total, world) => total + world.catalogue.length, 0) };
assert.equal(new Set(entries.map(entry => entry.id)).size, entries.length);
assert.equal(new Set(batches.flatMap(batch => batch.entries.map(entry => entry.id))).size, recording.length);
assert.equal(completed.length + sequences.length + unsupportedSequences.length + held.length + recording.length, entries.length);
for (const batch of batches) {
  assert.ok(batch.count > 0 && batch.count <= 9);
  assert.equal(fs.readFileSync(path.join(output, batch.file), 'utf8').trim().split(/\n\n/).length, batch.count);
}
for (const entry of completed) assert.ok(fs.existsSync(path.join(root, entry.clip)), entry.clip);
const batchDir = path.join(output, 'batches');
const currentBatchFiles = new Set(batches.map(batch => batch.file));
if (fs.existsSync(batchDir)) {
  for (const filename of fs.readdirSync(batchDir)) {
    if (!/^\d+-[a-z0-9-]+-\d+\.txt$/.test(filename)) continue;
    const file = `batches/${filename}`;
    if (!currentBatchFiles.has(file)) fs.rmSync(path.join(batchDir, filename));
  }
}
const sources = [...sourceFiles, 'src/letters/MiniGames.js', 'src/letters/LettersGame.js',
  'src/letters/GardenPractice.js', 'src/letters/LetterDelivery.js', ...loadedData]
  .map(file => ({ file, sha256: hash(read(file)) }));
write('manifest.json', JSON.stringify({ scope: 'Current local Letter Garden curriculum, all 22 chapters; intros, target pools, assembly pieces, extras and every dynamic ChainGame prompt. Daily, checkup, practice and pet speech reuse these pools.',
  counts, groups: groups.map(({ key, title, entries }) => ({ key, title, count: entries.length })),
  sources, batches, entries }, null, 2) + '\n');

const lines = [
  '# Letter Garden — complete audio recording list', '',
  `Prepared from the current local curriculum on ${preparedOn}. This is an adult production document; the child-facing game is unchanged.`, '',
  `The audit covers **${counts.worlds} chapters** and **${counts.uniqueRequests} distinct spoken requests**, including introductions, full item catalogues, assembly pieces, distractors, and every possible three-letter chain. Daily practice, checkups, pets and the workshop reuse these requests.`, '',
  `- **${counts.exactLocalClips}** exact local clips are already bundled (letter names, marks, syllables, or words as available): do not regenerate them.`,
  `- **${recording.length}** new items are arranged below in **${batches.length} small recording batches**, including **${counts.wordEntries} word entries**.`,
  `- **${sequences.length}** letter-name sequences are fully supported by the local playback queue; **${unsupportedSequences.length}** still need one or more exact name clips.`,
  `- **${held.length}** standalone assembly pieces need a teaching/pronunciation decision first; their complete list is included below.`, '',
  `The current word-stage catalogue has **${counts.wordCatalogueEntries}** entries and **${counts.wordEntries}** outstanding exact word recording requests after existing local clips are reused. Standing-vowel display forms reuse their matching long-vowel recordings.`, '',
  '## How to record', '',
  '1. Keep Marin and the same voice style used for the existing recording.',
  '2. Work through numbered batches one at a time. Put the matching voice direction in the separate instructions field, and only the Arabic block in the speech text field.',
  '3. Save each download using its batch ID, keeping the original audio file. The filenames and expected item order let us split and map it reliably.',
  '4. Listen against the list and count the items. A requested pause or pronunciation is not guaranteed by a prompt; the earlier full-alphabet generation skipped names. If a batch skips an item, regenerate only the missing items and label that file with the batch ID plus “retry”.',
  '5. Send the recordings back for segmentation, coverage checks and local integration. These scripts do not generate or install audio automatically.', '',
  'Start with batch 01, then the short vowels. Check a short-vowel batch before generating all later batches. The complete list is not a single recommended generation request.', '',
  '**Pronunciation review:** These are exact current curriculum requests, not a newly certified phonetics syllabus. Retain the written teaching endings in the requested word clips. An Arabic educator should check the resulting syllables and Quran-derived words before teaching use, including hamzat al-wasl starts, vowel length, tanween and doubled consonants. No recitation qualification is implied.', '',
  '## Voice directions', '',
];
for (const [kind, direction] of Object.entries(directions)) lines.push(`### ${kind}`, '', '```text', direction, '```', '');
lines.push('## Recording batches', '', '| Family | New clips |', '|---|---:|');
for (const group of groups) lines.push(`| ${group.title} | ${group.entries.length} |`);
lines.push('');
for (const group of groups) {
  lines.push(`### ${group.title}`, '', `Voice direction: **${group.direction}**.`, '');
  for (const batch of batches.filter(batch => batch.group === group.key)) {
    lines.push(`#### ${batch.id} — ${batch.count} items`, '',
      `Save audio as \`${batch.id}.mp3\`. [Arabic-only text file](${batch.file}).`, '',
      '```text', ...batch.entries.map(entry => entry.text).join('\n\n').split('\n'), '```', '');
  }
}
lines.push('## Already bundled exact clips — curriculum reference only', '', `These ${completed.length} requested items currently have exact local clips. Pronunciation review remains separate from file coverage.`, '',
  '```text', ...completed.map(entry => entry.text), '```', '',
  '## Assembly pieces — review before recording', '',
  'These exact strings are currently spoken when individual pieces are tapped. A resting consonant, a bare letter, a long-vowel carrier, or part of a doubled consonant does not always form a useful isolated syllable. Do not record an invented vowel or substitute a name without deciding what that tap should teach. Contexts are provided so these requests are not hidden or mistaken for completed coverage.', '',
  '| Exact request | Seen inside | Chapters |', '|---|---|---|');
for (const entry of held) lines.push(`| ${entry.text} | ${[...new Set(entry.uses.map(use => use.parent).filter(Boolean))].join(' · ')} | ${[...new Set(entry.uses.map(use => use.world))].join(', ')} |`);
lines.push('', '## Letter-name sequences — local queue coverage', '',
  'These prompts name letters separately; they do not blend syllables. The local playback queue uses them only when every exact alphabet-name clip is already bundled.', '',
  'The muqattaat rows reproduce the current game’s generic letter-name teaching strings. Their traditional reading and elongation need separate review; do not treat this table as a recitation script.', '');
for (const worldId of ['join-1', 'join-2', 'muqattaat']) {
  lines.push(`### ${worldId}`, '', '| Display | Current spoken request | Local queue |', '|---|---|---|');
  for (const entry of [...sequences, ...unsupportedSequences].filter(entry => entry.uses.some(use => use.world === worldId))) {
    const support = entry.missingSequenceClips.length ? `Needs: ${entry.missingSequenceClips.join('، ')}` : 'Supported';
    lines.push(`| ${[...new Set(entry.uses.filter(use => use.world === worldId).map(use => use.display))].join(' · ')} | ${entry.text} | ${support} |`);
  }
  if (worldId === 'muqattaat') lines.push('', 'The single-letter ق and ن entries reuse the Qaf and Noon clips already recorded.');
  lines.push('');
}
lines.push('## Reproduction and coverage', '',
  '`node scripts/export-letter-garden-audio.mjs` rebuilds this list directly from the game. No random lesson sample is used as the full inventory.', '',
  'The manifest includes stable text IDs, exact NFC-normalized lookup strings, every usage and parent context, source hashes, batch filenames, item positions and existing word-audio references. Standing-vowel display forms map to the same spoken long-vowel examples; those recordings are requested only once.', '',
  'The word list uses the game’s existing eligibility filters and skeleton deduplication across its 11 source surahs. It covers all current eligible word entries, not every word in every Quran data file. Expanding the curriculum requires rerunning this export.', '',
  'No application code, curriculum rules, progress or runtime audio was changed by preparing this package. No external voice service was called.', '');
write('FULL-LIST.md', lines.join('\n') + '\n');
write('README.txt', `LETTER GARDEN AUDIO RECORDING PACKAGE\n\nOpen FULL-LIST.md for the complete list and recording instructions.\nUse one numbered file in batches/ per generation. Each contains only Arabic speech text.\nUse the matching names, syllables or words direction in directions/.\nSave each original audio download under the batch ID shown in FULL-LIST.md.\n\n${JSON.stringify(counts, null, 2)}\n\nExisting exact clips, local-queue-supported name sequences and assembly-review items are reference sections, not extra batches to generate.\nNo gameplay changes or audio generation performed.\n`);
console.log(JSON.stringify({ output, counts, groups: groups.map(group => ({ group: group.key, count: group.entries.length })) }, null, 2));
