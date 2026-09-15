const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');

const root = path.join(__dirname, '../../..');
const swSource = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const origin = 'https://miftah.test';

class Response {
  constructor(body, { ok = true } = {}) {
    this.body = body;
    this.ok = ok;
  }
  clone() { return new Response(this.body, { ok: this.ok }); }
}

const href = (request) => new URL(typeof request === 'string' ? request : request.url, origin).href;
const bare = (request) => {
  const url = new URL(href(request));
  url.search = '';
  return url.href;
};

class Cache {
  constructor() {
    this.entries = new Map();
    this.added = [];
    this.puts = [];
  }
  async addAll(entries) {
    this.added.push(...entries);
    for (const entry of entries) this.entries.set(href(entry), new Response(`precache:${entry}`));
  }
  async match(request, options = {}) {
    if (!options.ignoreSearch) return this.entries.get(href(request));
    const key = bare(request);
    return [...this.entries].find(([candidate]) => bare(candidate) === key)?.[1];
  }
  async put(request, response) {
    this.puts.push(href(request));
    this.entries.set(href(request), response);
  }
}

function runtime() {
  const listeners = {};
  const stores = new Map();
  let network = async (request) => new Response(`network:${href(request)}`);
  const caches = {
    open: async (name) => {
      if (!stores.has(name)) stores.set(name, new Cache());
      return stores.get(name);
    },
    keys: async () => [...stores.keys()],
    delete: async (name) => stores.delete(name),
  };
  const self = {
    addEventListener: (name, listener) => { listeners[name] = listener; },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  };
  vm.runInNewContext(swSource, {
    self,
    caches,
    URL,
    location: { origin },
    fetch: (request) => network(request),
    Promise,
    Set,
    Error,
  }, { filename: 'sw.js' });

  const install = async () => {
    let pending;
    listeners.install({ waitUntil: (promise) => { pending = promise; } });
    await pending;
  };
  const request = async (url) => {
    let pending;
    listeners.fetch({
      request: { method: 'GET', url: href(url) },
      respondWith: (promise) => { pending = promise; },
    });
    return pending && await pending;
  };
  return {
    install,
    request,
    stores,
    setNetwork: (next) => { network = next; },
  };
}

test('install precaches the complete local Letter Garden entry graph and Quran word pool', async () => {
  const app = runtime();
  await app.install();
  const shell = [...app.stores].find(([name]) => name.startsWith('shell-'))?.[1];
  const data = [...app.stores].find(([name]) => name.startsWith('data-'))?.[1];
  assert.ok(shell);
  assert.ok(data);

  const expectedShell = [
    'letters.html',
    'styles/letters.css',
    'styles/letters-animals.css',
    'styles/letters-art-pass.css',
    'styles/letters-map-world.css',
    'styles/letters-activities.css',
    'src/data/letters.js',
    'src/data/animals.js',
    'src/core/SoundSystem.js',
    'src/core/Haptics.js',
    'src/systems/ProgressionSystem.js',
    'src/letters/LettersAnimalArt.js',
    'src/letters/LettersArt.js',
    'src/letters/LettersDecorations.js',
    'src/letters/LettersState.js',
    'src/letters/LettersBoot.js',
    'src/letters/LettersStrength.js',
    'src/letters/LettersWorlds.js',
    'src/letters/GardenPractice.js',
    'src/letters/MiniGames.js',
    'src/letters/LettersGardenArt.js',
    'src/letters/LettersMapArt.js',
    'src/letters/LettersActivityArt.js',
    'src/letters/DecoratingGarden.js',
    'src/letters/LettersGame.js',
    'vendor/fonts/fonts.css',
    'vendor/fonts/amiri-quran-400-arabic.woff2',
    'vendor/fonts/amiri-quran-400-latin.woff2',
  ];
  for (const asset of expectedShell) {
    assert.ok(shell.added.includes(asset), `${asset} is not in the shell precache`);
    assert.ok(fs.existsSync(path.join(root, asset)), `${asset} does not resolve locally`);
  }
  assert.ok(shell.added.includes('today.html'), 'existing app-shell entries must remain');
  assert.ok(shell.added.includes('src/core/RecitationAudio.js'), 'existing shared dependencies must remain');

  const expectedData = [1, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114]
    .map((number) => `data/surah-${number}.json`);
  assert.deepEqual(data.added, expectedData);
  for (const asset of expectedData) assert.ok(fs.existsSync(path.join(root, asset)), `${asset} does not resolve locally`);
});

test('Letter Garden keeps its original self-hosted Amiri Quran face and WOFF2 closure', () => {
  const html = fs.readFileSync(path.join(root, 'letters.html'), 'utf8');
  assert.match(html, /href="vendor\/fonts\/fonts\.css"/);
  assert.doesNotMatch(html, /fonts\.(?:googleapis|gstatic)\.com/);

  const stylesheetPath = path.join(root, 'vendor/fonts/fonts.css');
  const stylesheet = fs.readFileSync(stylesheetPath, 'utf8');
  assert.match(stylesheet, /font-family:\s*"Amiri Quran"/);
  assert.match(stylesheet, /font-weight:\s*400/);

  const fontURLs = [...stylesheet.matchAll(/url\(([^)]+)\)/g)]
    .map((match) => match[1].replace(/["']/g, ''))
    .filter((fontURL) => fontURL.startsWith('amiri-quran-'));
  assert.deepEqual(fontURLs, ['amiri-quran-400-arabic.woff2', 'amiri-quran-400-latin.woff2']);
  for (const fontURL of fontURLs) {
    const bytes = fs.readFileSync(path.resolve(path.dirname(stylesheetPath), fontURL));
    assert.equal(bytes.subarray(0, 4).toString(), 'wOF2');
  }

  const sha256 = (asset) => createHash('sha256').update(fs.readFileSync(path.join(root, asset))).digest('hex');
  assert.equal(sha256('vendor/fonts/amiri-quran-400-arabic.woff2'), '9b208435b7ed5f5000b3b17396604194cb8af08bf955662142f42b00db0d5639');
  assert.equal(sha256('vendor/fonts/amiri-quran-400-latin.woff2'), '1a014fa9368c5419754e5a11d38527094e4a37c54858adc4f4e8c5061ba87c7e');
});

test('versioned shell requests hit the bare precache while offline', async () => {
  const app = runtime();
  await app.install();
  app.setNetwork(async () => { throw new Error('offline'); });
  const response = await app.request('/src/letters/LettersMapArt.js?v=20260915-world-journeys1');
  assert.equal(response.body, 'precache:src/letters/LettersMapArt.js');
});

test('data remains network-first, updates its cache, and falls back ignoring query versions', async () => {
  const app = runtime();
  await app.install();
  app.setNetwork(async (request) => new Response(`fresh:${href(request)}`));
  const online = await app.request('/data/surah-105.json?v=first');
  assert.equal(online.body, 'fresh:https://miftah.test/data/surah-105.json?v=first');

  app.setNetwork(async () => { throw new Error('offline'); });
  const offline = await app.request('/data/surah-105.json?v=second');
  assert.equal(offline.body, 'fresh:https://miftah.test/data/surah-105.json?v=first');
});
