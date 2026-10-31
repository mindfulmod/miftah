// Deterministic inventory of the current game's speech, including optional toys
// and Quran reading screens. Never changes approved clips or runtime behavior.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const key = text => String(text || '').normalize('NFC').trim();
const hash = text => createHash('sha256').update(text).digest('hex');
const bare = text => text.replace(/[؟?.!،]/g, '');

export async function auditAudio() {
  const sources = {};
  const read = file => {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    sources[file] = hash(content);
    return content;
  };
  const ns = {};
  const context = vm.createContext({ window: { MiftahGame: ns }, console,
    AbortController, setTimeout, clearTimeout,
    fetch: async url => {
      if (!/^data\/surah-\d+\.json$/.test(url)) throw Error(`Unexpected data source: ${url}`);
      return { ok: true, json: async () => JSON.parse(read(url)) };
    },
  });
  for (const file of ['src/data/letters.js', 'src/letters/LettersBoot.js',
    'src/letters/LettersWorlds.js', 'src/letters/LetterVoiceClips.js',
    'src/letters/LettersVoice.js', 'src/letters/LettersStrokes.js',
    'src/letters/LetterFriends.js', 'src/letters/PictureWords.js',
    'src/letters/LivingBooks.js', 'src/letters/SoundLab.js']) {
    vm.runInContext(read(file), context, { filename: file });
  }
  const worlds = new ns.LettersWorlds();
  await worlds.loadWords();
  const voice = new ns.LettersVoice({ clips: ns.LETTER_VOICE_CLIPS });
  const requests = new Map();
  function add(item, use, kind = 'curriculum') {
    const text = key(item.speak || item.display);
    if (!text) return;
    if (!requests.has(text)) requests.set(text, { id: `lg-${hash(text).slice(0, 12)}`, text, uses: [], kinds: [] });
    const entry = requests.get(text);
    if (!entry.uses.includes(use)) entry.uses.push(use);
    if (!entry.kinds.includes(kind)) entry.kinds.push(kind);
    if (item.audioPath) entry.remoteRecitation = true;
    for (const part of item.parts || []) add(part, `${use}:part`, 'assembly-part');
  }
  const done = worlds.worlds.map(w => w.id);
  for (const world of worlds.worlds) {
    for (const item of world.catalogueItems()) add(item, `chapter:${world.id}:target`);
    for (const item of world.meet) add(item, `chapter:${world.id}:meet`);
    for (const item of world.extraItems?.(done) || []) add(item, `chapter:${world.id}:extra`);
    if (world.games.includes('chain')) {
      for (const pair of world.catalogue.filter(item => item.parts?.length === 2 && item.join2)) {
        for (const third of world.extraItems().filter(letter => !pair.parts.some(p => p.display === letter.display))) {
          add({ speak: `${pair.speak}، ${third.speak}` }, `chapter:${world.id}:chain`, 'name-sequence');
        }
      }
    }
  }
  for (const letter of worlds.letters) add({ speak: letter.arName }, 'alphabet', 'letter-name');
  for (const value of Object.values(ns.LETTERS_DATA)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item?.arName) add({ speak: item.arName }, 'mark-names', 'mark-name');
    }
  }
  for (const friend of Object.values(ns.LetterFriends.FRIENDS)) add({ speak: friend.word }, 'letter-friends', 'picture-word');
  for (const picture of ns.PictureWords.LIST) add({ speak: picture.word }, 'picture-words-and-ears-games', 'picture-word');
  // Rotate the cast, so a page factory that takes only its first few friends
  // cannot hide words or gender variants from this inventory.
  const chars = Object.keys(ns.LetterFriends.FRIENDS);
  for (const book of ns.LivingBooks.BOOKS) {
    const lines = [book.title];
    for (let i = 0; i < chars.length; i++) {
      for (const page of book.pages([...chars.slice(i), ...chars.slice(0, i)])) lines.push(page.text || '', page.reveal || '');
    }
    for (const line of lines) for (const word of line.split(/\s+/)) add({ speak: bare(word) }, `book:${book.id}`, 'book-word');
  }
  for (const letter of worlds.letters.filter(letter => letter.char !== 'ا')) {
    for (const mark of Object.keys(ns.GardenPractice.SoundLab.MARK_NAMES)) {
      add(ns.GardenPractice.SoundLab.soundItem(letter.char, mark), 'sound-lab', 'constructed-syllable');

    }
  }
  read('src/letters/SandTable.js'); read('src/letters/VowelGames.js');
  const story = read('src/letters/StoryGarden.js');
  const bismillah = story.match(/const BISMILLAH = (\[[^\n]+\])\.map/);
  if (!bismillah) throw Error('Story speech structure changed: update the audit.');
  for (const text of vm.runInNewContext(bismillah[1])) add({ speak: text }, 'story-bismillah', 'quran-word');
  for (const [number, surah] of worlds.surahs) {
    for (const ayah of surah.ayahs) for (const word of ayah.words) {
      add({ speak: word.arabic, audioPath: word.audioPath }, `ayah:${number}:${ayah.number}`, 'quran-word');
    }
  }
  const game = read('src/letters/LettersGame.js');
  const treasuryLiteral = game.match(/const TREASURY = (\{[\s\S]*?\n  \});/);
  if (!treasuryLiteral) throw Error('Treasury structure changed: update the audit before reporting full coverage.');
  const treasury = vm.runInNewContext(`(${treasuryLiteral[1]})`, {}, { timeout: 1000 });
  for (const [id, [, , , text, audioPath]] of Object.entries(treasury)) {
    add({ speak: text, audioPath: audioPath || 'treasury-word' }, `treasury:${id}`, 'quran-word');
  }
  const clipFiles = Object.values(ns.LETTER_VOICE_CLIPS);
  const missingFiles = [...new Set(clipFiles)].filter(file => !fs.existsSync(path.join(root, file)));
  const nameSet = new Set(worlds.letters.map(l => key(l.arName)));
  const entries = [...requests.values()].map(entry => {
    const clip = ns.LETTER_VOICE_CLIPS[entry.text];
    const sequence = voice.sequence(entry.text);
    const consonantOnly = /^[\u0621-\u064A][\u0651\u0652]$/.test(entry.text);
    const alifMark = /^ا[\u064B-\u0652]$/.test(entry.text);
    const barePart = entry.kinds.includes('assembly-part') && /^[\u0621-\u064A]$/.test(entry.text);
    const status = clip ? (missingFiles.includes(clip) ? 'missing-file' : 'approved-local')
      : sequence ? 'local-name-sequence'
      : consonantOnly || alifMark || barePart ? 'pronunciation-decision' : 'needs-generation';
    let direction = nameSet.has(entry.text) || entry.kinds.includes('mark-name') ? 'names'
      : entry.kinds.includes('quran-word') || entry.remoteRecitation ? 'quran-reading'
      : entry.kinds.some(k => ['picture-word', 'book-word'].includes(k)) ? 'story-words' : 'syllables';
    return { ...entry, status, direction, ...(clip ? { clip } : {}), ...(sequence ? { sequence } : {}),
      ...(status === 'pronunciation-decision' ? { note: 'The current UI requests an isolated consonant or ambiguous alif/mark combination. Specify a supported teaching example before generating; do not invent an unwritten vowel.' } : {}) };
  }).sort((a, b) => a.id.localeCompare(b.id));
  return { schemaVersion: 1, voice: 'marin', sourceHashes: sources,
    policy: 'Owner requested Marin for all Letter Garden speech, including Quran reading screens on 2026-10-20. Approved exact Marin clips take priority; existing fallbacks remain for uncovered requests until replacements are reviewed and integrated.',
    counts: { requests: entries.length, approvedBankClips: clipFiles.length,
      ...Object.fromEntries(['approved-local', 'local-name-sequence', 'needs-generation', 'pronunciation-decision', 'missing-file'].map(s => [s, entries.filter(e => e.status === s).length])) },
    missingFiles, entries };
}

export function writePackage(audit, output) {
  const base = 'Use OpenAI Marin. Generate only this single Arabic item once, with a warm, clear, natural teaching voice for ages 4–6. No labels, translations, commentary, music or added words. Do not concatenate prompts. Preserve all consonants and the exact requested vowel distinctions.';
  const directions = {
    names: `${base} Read the letter or mark NAME, not its phonetic sound.`,
    syllables: `${base} Read the written syllable, not letter names. Preserve short versus long vowels, tanween, glides and doubled consonants. Do not drop written final exercise vowels at the pause or add an unwritten vowel.`,
    'story-words': `${base} Read a natural isolated story word. Respect the written vowels; use pausal form for words without a written case ending.`,
    'quran-reading': `${base} Read the written Quran word carefully. Do not improvise tajweed or claim qualified recitation. Preserve the supplied text and reference for Arabic review; flag ambiguous standalone readings instead of guessing.`,
  };
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'inventory.json'), JSON.stringify(audit, null, 2) + '\n');
  const jobs = audit.entries.filter(e => ['needs-generation', 'missing-file'].includes(e.status)).map(e => ({
    id: e.id, voice: 'marin', input: e.text, instructions: directions[e.direction],
    output: `candidates/${e.id}.wav`, reviewStatus: 'unreviewed', uses: e.uses,
  }));
  fs.writeFileSync(path.join(output, 'generation-requests.jsonl'), jobs.map(e => JSON.stringify(e)).join('\n') + '\n');
  const recoveredPath = path.join(output, 'recovered-candidates.json');
  const recovered = fs.existsSync(recoveredPath) ? JSON.parse(fs.readFileSync(recoveredPath, 'utf8')) : [];
  const reusable = new Set();
  for (const candidate of recovered) {
    const job = jobs.find(j => j.id === candidate.id && j.input === key(candidate.text));
    const file = path.resolve(output, candidate.file);
    if (!file.startsWith(path.resolve(output) + path.sep)) throw Error('Candidate must remain within its review package.');
    if (!fs.existsSync(file) || hash(fs.readFileSync(file)) !== candidate.sha256) throw Error(`Recovered candidate changed: ${candidate.id}`);
    if (job && candidate.reviewStatus !== 'rejected') reusable.add(job.id);
  }
  fs.writeFileSync(path.join(output, 'remaining-generation-requests.jsonl'), jobs.filter(j => !reusable.has(j.id)).map(e => JSON.stringify(e)).join('\n') + '\n');
  fs.writeFileSync(path.join(output, 'pronunciation-decisions.json'), JSON.stringify(audit.entries.filter(e => e.status === 'pronunciation-decision'), null, 2) + '\n');
  fs.writeFileSync(path.join(output, 'COVERAGE.md'), `# Letter Garden audio coverage\n\nGenerated from the current source with \`node scripts/audit-letter-garden-audio.mjs\`.\n\n${Object.entries(audit.counts).map(([k, v]) => `- ${k}: **${v}**`).join('\n')}\n\nApproved-local means an existing owner-approved key and file, not a new pronunciation judgment. Name sequences reuse complete approved names. Missing items are not installed or silently marked approved. Sound Lab and bare assembly requests with unclear standalone pronunciation are held separately. The inventory covers all chapter catalogues, dynamic name chains, all friend/picture words, every book cast, Sound Lab combinations, the 11 reading surahs and the sticker treasury. It does not claim exhaustive arbitrary runtime-string coverage.\n\nEach generation request produces one file. Keep returned files in candidates/ until mapping, decoding, duration, clipping, silence, pronunciation and replay are checked. Preserve exact text and vowel distinctions; never use fuzzy matching.\n`);
  return jobs;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = path.resolve(root, process.argv[2] || 'docs/letter-garden/reviews/marin-complete-20261020');
  const audit = await auditAudio();
  const jobs = writePackage(audit, output);
  console.log(JSON.stringify({ ...audit.counts, generationJobs: jobs.length, output }, null, 2));
}
