#!/usr/bin/env node
/* Build the Letter Garden audio approval catalogue from the checked-in review sources. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex');
const hashText = (value) => crypto.createHash('sha256').update(value, 'utf8').digest('hex');
const nfc = (value) => String(value).normalize('NFC');
const rel = (file) => file ? file.replaceAll('\\', '/') : null;

const fmFile = 'docs/letter-garden/reviews/fm-curriculum-scripts/manifest.json';
const marinFile = 'docs/letter-garden/reviews/marin-curriculum/manifest.json';
const cutsFile = 'docs/letter-garden/reviews/marin-curriculum/cuts.json';
const batchFile = 'docs/letter-garden/reviews/marin-letters/batch.json';
const fm = readJson(fmFile);
const marin = readJson(marinFile);
const cuts = readJson(cutsFile);
const requestedGroups = new Map(readJson('docs/letter-garden/reviews/marin-curriculum/request-items.json').map(item => [item.id, item.group]));
const original = readJson(batchFile);

const sourceDefinitions = [
  {
    id: 'marin-letters-original', title: 'Original alphabet recording (25 names)',
    file: 'docs/letter-garden/reviews/marin-letters/original.mp3',
    duration: original.sourceSeconds,
  },
  {
    id: 'marin-curriculum-batch-1', title: 'Marin curriculum — supplied batch 1',
    file: 'docs/letter-garden/reviews/marin-curriculum/sources/batch-1.mp3', duration: marin.sources[0].duration,
    transcriptText: fs.readFileSync(path.join(ROOT, 'docs/letter-garden/reviews/marin-curriculum/request-1.txt'), 'utf8').trim(),
  },
  {
    id: 'marin-curriculum-batch-2', title: 'Marin curriculum — supplied batch 2',
    file: 'docs/letter-garden/reviews/marin-curriculum/sources/batch-2.mp3', duration: marin.sources[1].duration,
    transcriptText: fs.readFileSync(path.join(ROOT, 'docs/letter-garden/reviews/marin-curriculum/request-2.txt'), 'utf8').trim(),
  },
];
const sources = sourceDefinitions.map((source) => ({ ...source, file: rel(source.file), sha256: sha256(source.file) }));

const batchById = new Map();
for (const batch of fm.batches) for (const entry of batch.entries) batchById.set(entry.id, batch);
const fmByText = new Map(fm.entries.map((entry) => [nfc(entry.text), entry]));
const marinById = new Map(marin.items.map((entry) => [entry.id, entry]));
const marinByText = new Map(marin.items.map((entry) => [nfc(entry.text), entry]));
const cutByText = new Map();
for (const cut of cuts.cuts) cutByText.set(nfc(cut.text), cut);

const letterFamilies = new Map([
  ['mark-names', 'Vowel and tanween names'], ['short-vowels', 'Short vowels'],
  ['long-vowels', 'Long vowels'], ['tanween', 'Tanween syllables'], ['leen', 'Leen glides'],
  ['sukun-shaddah', 'Sukun and shaddah examples'], ['words-2', 'Two-letter words'],
  ['words-3', 'Three-letter words'], ['words-4-5', 'Four- and five-letter words'],
]);
function familyFor(entry) {
  const batch = batchById.get(entry.id);
  if (batch) return letterFamilies.get(batch.group) || batch.group;
  if (entry.status === 'reuse-name-sequence') return 'Letter-name sequences';
  if (entry.status === 'assembly-policy-review') return 'Assembly policy review';
  if (entry.status === 'already-bundled') {
    const group = requestedGroups.get(entry.id);
    if (['short-vowels', 'long-vowels', 'tanween', 'leen', 'sukun-shaddah'].includes(group)) return letterFamilies.get(group);
    if (original.letters.some((letter) => nfc(letter.input) === nfc(entry.text))) return 'Letter names';
    if (new Set(['فَتْحَة', 'كَسْرَة', 'كَسْرَتَانْ', 'ضَمَّتَانْ']).has(nfc(entry.text))) return 'Vowel and tanween names';
    return 'Curriculum words';
  }
  return 'Letter names';
}

// Parse the actual runtime bank. This deliberately follows the current source, rather than
// copying a historical manifest mapping.
const voiceSource = fs.readFileSync(path.join(ROOT, 'src/letters/LetterVoiceClips.js'), 'utf8');
const voiceBank = new Map();
for (const match of voiceSource.matchAll(/"((?:[^"\\]|\\.)+)":\s*"([^"]+)"/g)) {
  voiceBank.set(nfc(JSON.parse(`"${match[1]}"`)), rel(match[2]));
}

function playable(file) {
  const normalized = rel(file);
  if (!normalized || !fs.existsSync(path.join(ROOT, normalized))) return null;
  return { file: normalized, sha256: sha256(normalized) };
}
function sourceFor(item) {
  if (!item || item.source == null || item.start == null || item.end == null) return undefined;
  const sourceId = item.source.startsWith('batch-') ? `marin-curriculum-${item.source}` : item.source;
  return { id: sourceId, start: item.start, end: item.end };
}
function signature(text, fileHashes, source) {
  return hashText(JSON.stringify({ text: nfc(text), files: fileHashes, source: source || null }));
}
function uses(entry) {
  return (entry.uses || []).map((use) => ({
    world: use.world, role: use.role, display: use.display, parent: use.parent ?? null,
  }));
}
function noteFor(entry, status, marinItem) {
  if (status === 'sequence') return 'Plays the exact existing letter-name clips as ordered parts; this is a sequence of names, not syllable stitching.';
  if (status === 'policy') return entry.note || 'Context is catalogued for review, but this assembly is governed by policy and has no fake playable audio.';
  if (status === 'unmapped') return entry.note || 'No local playable clip is mapped; do not invent a voice mapping.';
  if (status === 'candidate') return marinItem?.note || entry.note || 'Candidate cut requires pronunciation approval.';
  return marinItem?.note || entry.note || 'Installed in the current voice bank.';
}

const installedEntries = fm.entries.filter((entry) => entry.status === 'already-bundled');
const candidateEntries = fm.entries.filter((entry) => entry.status === 'record-and-review' && marinById.get(entry.id)?.file);
const sequenceEntries = fm.entries.filter((entry) => entry.status === 'reuse-name-sequence');
const policyEntries = fm.entries.filter((entry) => entry.status === 'assembly-policy-review');
const unmappedEntries = fm.entries.filter((entry) => entry.status === 'record-and-review' && !marinById.get(entry.id)?.file);

function makeItem(entry, status) {
  const text = nfc(entry.text);
  const marinItem = marinById.get(entry.id) || marinByText.get(text);
  const cut = cutByText.get(text);
  let file = null;
  let parts = [];
  let source;
  if (status === 'installed') {
    file = playable(voiceBank.get(text) || entry.clip);
    if (!file) throw new Error(`Installed item has no current voice-bank file: ${entry.id} ${text}`);
    source = sourceFor(marinItem) || sourceFor(cut);
    parts = [{ text, ...file }];
  } else if (status === 'candidate') {
    file = playable(marinItem.file);
    if (!file) throw new Error(`Candidate cut missing: ${entry.id} ${marinItem.file}`);
    source = sourceFor(marinItem) || sourceFor(cut);
    parts = [{ text, ...file }];
  } else if (status === 'sequence') {
    const sequence = entry.sequence || [];
    parts = sequence.map((partText) => {
      const partFile = playable(voiceBank.get(nfc(partText)));
      if (!partFile) throw new Error(`Sequence part has no current clip: ${entry.id} ${partText}`);
      return { text: nfc(partText), ...partFile };
    });
  }
  const fileHashes = parts.map((part) => part.sha256);
  const item = {
    id: entry.id, text, displays: [...new Set((entry.uses || []).map((use) => use.display).filter(Boolean))],
    family: familyFor(entry), status, note: noteFor(entry, status, marinItem), uses: uses(entry),
    file: file?.file || null, sha256: file?.sha256 || null, parts,
  };
  if (source) item.source = source;
  if (marinItem?.revision) item.revision = marinItem.revision;
  const previous = cut?.reviewHistory?.at(-1);
  if (previous?.file && ['candidate', 'installed'].includes(status) && marinItem?.revision) {
    const old = playable(previous.file);
    if (!old || old.sha256 !== previous.sha256) throw Error(`Previous reviewed clip changed: ${entry.id}`);
    item.previousParts = [{ text, ...old }];
  }
  item.signature = signature(text, fileHashes, source);
  return item;
}

// Keep names first for an approval pass, then the curriculum's original order.
const ordered = [
  ...installedEntries,
  ...candidateEntries,
  ...sequenceEntries,
  ...unmappedEntries,
  ...policyEntries,
];
const statusMap = new Map();
for (const entry of installedEntries) statusMap.set(entry.id, 'installed');
for (const entry of candidateEntries) statusMap.set(entry.id, 'candidate');
for (const entry of sequenceEntries) statusMap.set(entry.id, 'sequence');
for (const entry of unmappedEntries) statusMap.set(entry.id, 'unmapped');
for (const entry of policyEntries) statusMap.set(entry.id, 'policy');
if (new Set(ordered.map((entry) => entry.id)).size !== fm.counts.uniqueRequests) throw new Error('Catalogue source entries are not unique or complete');

const items = ordered.map((entry) => makeItem(entry, statusMap.get(entry.id)));
const queueFiles = ['next-100.json', 'next-individuals.json', 'boundary-recheck.json', 'additional-glides.json'];
const reviewQueues = [];
const byId = new Map(items.map(item => [item.id, item]));
for (const name of queueFiles) {
  const file = 'docs/letter-garden/reviews/audio-confirmation/' + name;
  if (!fs.existsSync(path.join(ROOT, file))) continue;
  const queue = readJson(file);
  if (!/^[a-z][a-z0-9-]*$/.test(queue.id) || reviewQueues.some(q => q.id === queue.id)
      || !queue.itemIds.length || new Set(queue.itemIds).size !== queue.itemIds.length) throw Error('Review queues must have unique IDs and distinct items');
  if (queue.itemIds.length !== queue.expectedCount) {
    // Preserve the original 100-item queue's pre-count schema.
    if (queue.id !== 'next100' || queue.itemIds.length !== 100) throw Error('Review queue count does not match its declaration');
  }
  for (const id of queue.itemIds) {
    const item = byId.get(id);
    if (!item?.parts.length) throw Error(`Review queue has no playable audio: ${id}`);
    if (queue.revisionOnly && (!item.revision || !item.previousParts?.length || !['candidate', 'installed'].includes(item.status))) throw Error(`Revision queue has no before/after recording: ${id}`);
    if (queue.individualOnly && (item.parts.length !== 1 || item.status === 'sequence')) throw Error(`Individual queue contains a sequence: ${id}`);
  }
  reviewQueues.push(queue);
}
const counts = Object.fromEntries(['installed', 'candidate', 'sequence', 'unmapped', 'policy'].map((status) => [status, items.filter((item) => item.status === status).length]));
const out = {
  schemaVersion: 1,
  summary: {
    total: items.length, installed: counts.installed, candidate: counts.candidate,
    sequence: counts.sequence, unmapped: counts.unmapped, policy: counts.policy,
    policyNote: 'Assembly-policy items expose context only; no synthetic playable audio is assigned.',
  },
  sources,
  reviewQueues,
  items,
};
const outputFile = path.join(ROOT, 'docs/letter-garden/reviews/audio-confirmation/manifest.json');
fs.mkdirSync(path.dirname(outputFile), { recursive: true });
const rendered = `${JSON.stringify(out, null, 2)}\n`;
if (process.argv.includes('--check')) {
  if (!fs.existsSync(outputFile) || fs.readFileSync(outputFile, 'utf8') !== rendered) {
    console.error('Audio catalogue is stale; run node scripts/build-letter-garden-audio-review.cjs');
    process.exitCode = 1;
  }
} else {
  fs.writeFileSync(outputFile, rendered);
}
console.log(JSON.stringify({ output: rel(path.relative(ROOT, outputFile)), summary: out.summary }, null, 2));
