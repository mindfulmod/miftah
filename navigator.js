"use strict";

/*
 * navigator.js — The Star Navigator, core engine.
 * Owns: profiles & storage, the word engine (disguised FSRS spaced repetition),
 * invisible rubber-band difficulty, WebAudio synth + recitation, the animated
 * night-sea canvas, and the harbor hub (crew dialogue, star map, upgrades).
 * The voyage itself (chart, encounters, boons, boss) lives in navigator-run.js.
 *
 * Storage contract: this game writes ONLY under the "star-navigator:" prefix.
 * Trainer keys (quran-trainer:*) are read — never written — when a profile is
 * linked: its FSRS state is imported into the game's own shadow deck.
 */

window.SN = window.SN || {};

(() => {
  const SN = window.SN;
  const C = window.SN_CONTENT;

  // ------------------------------------------------------------ tiny utils
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (a) => {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const pad3 = (n) => String(n).padStart(3, "0");

  SN.$ = $; SN.esc = esc; SN.shuffle = shuffle; SN.pick = pick;

  // --------------------------------------------------------------- storage
  const LS = {
    get(k, fb) { try { const r = localStorage.getItem(k); return r == null ? fb : JSON.parse(r); } catch { return fb; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };
  const PKEY = "star-navigator:profiles";
  const SOUNDKEY = "star-navigator:sound";
  const metaKey = (id) => `star-navigator:p:${id}:meta`;
  const deckKey = (id) => `star-navigator:p:${id}:deck`;

  const state = {
    profiles: [],       // [{id, name, emblem, linked}]
    activeId: null,
    meta: null,         // active profile's persistent progress
    deck: {},           // key -> card (the game's own FSRS shadow deck)
    fresh: [],          // candidate words not yet in the deck (curriculum order)
    bank: [],           // every loaded word — the distractor pool
    bankKeys: new Set(),
    loaded: new Set(),  // surah numbers fetched
    lexicon: null,      // compressed Quran-wide lemma/root frequency lookup
    ready: false,
  };
  SN.state = state;
  SN.C = C;

  const defaultMeta = () => ({
    pearls: 0, runs: 0, wins: 0, rescuedTotal: 0, bestStreak: 0,
    upgrades: {}, lastRun: null, curriculumIx: 0,
    crew: { yusuf: { beat: 0, reactSeen: 0 }, layla: { beat: 0, reactSeen: 0 }, idris: { beat: 0, reactSeen: 0 } },
    // One Piece model (spec: specs/03-star-navigator-v2.md): a new navigator
    // sails ALONE. Friends are met on the way, and each one's current — the
    // whole build axis — unlocks only when they join. Recruitment IS the
    // mechanics tutorial.
    recruited: { yusuf: false, layla: false, idris: false },
    skill: { acc: 0.6, spd: 0.45 },
    versesCompleted: {},
    equippedKeepsake: null,
    attunedRoot: null,
    vessel: null,
  });

  function loadProfiles() {
    const raw = LS.get(PKEY, { list: [], activeId: null });
    state.profiles = Array.isArray(raw.list) ? raw.list : [];
    state.activeId = raw.activeId;
  }
  function saveProfiles() { LS.set(PKEY, { list: state.profiles, activeId: state.activeId }); }

  function activateProfile(id) {
    const p = state.profiles.find((x) => x.id === id);
    if (!p) return false;
    state.activeId = id;
    const saved = LS.get(metaKey(id), {});
    state.meta = Object.assign(defaultMeta(), saved);
    for (const cid of ["yusuf", "layla", "idris"])
      state.meta.crew[cid] = Object.assign({ beat: 0, reactSeen: 0 }, state.meta.crew[cid]);
    // Default-merge for pre-recruitment profiles: anyone who has already
    // sailed did so WITH the crew — grandfather them in. Only true fresh
    // profiles begin the story alone.
    if (!saved.recruited) {
      const sailed = (state.meta.runs || 0) > 0;
      state.meta.recruited = { yusuf: sailed, layla: sailed, idris: sailed };
    }
    state.deck = LS.get(deckKey(id), {});
    state.fresh = [];
    state.ready = false;
    saveProfiles();
    return true;
  }

  SN.profile = () => state.profiles.find((x) => x.id === state.activeId);
  SN.saveMeta = () => { if (state.activeId) LS.set(metaKey(state.activeId), state.meta); };
  SN.saveDeck = () => { if (state.activeId) LS.set(deckKey(state.activeId), state.deck); };
  SN.saveAll = () => { SN.saveMeta(); SN.saveDeck(); };

  function createProfile({ name, emblem, linked }) {
    const id = "p" + Date.now().toString(36) + Math.floor(Math.random() * 999);
    state.profiles.push({ id, name, emblem, linked: !!linked });
    activateProfile(id);
  }
  function deleteProfile(id) {
    state.profiles = state.profiles.filter((p) => p.id !== id);
    LS.del(metaKey(id)); LS.del(deckKey(id));
    if (state.activeId === id) state.activeId = state.profiles[0]?.id || null;
    saveProfiles();
  }

  // ------------------------------------------- trainer import (read-only)
  const wordKey = (arabic, english) => `${arabic}|||${english}`;

  function trainerSurahs() {
    // The unified strength store (strength.js) is the source of truth when
    // it's on the page; the legacy per-surah scan remains as a fallback.
    if (window.WordStrength) {
      const set = new Set();
      for (const e of window.WordStrength.entries())
        for (const n of e.surahs || []) set.add(n);
      if (set.size) return [...set].sort((a, b) => a - b);
    }
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const m = /^quran-trainer:stats:surah-(\d+)$/.exec(localStorage.key(i));
        if (m) out.push(Number(m[1]));
      }
    } catch {}
    return out.sort((a, b) => a - b);
  }
  SN.trainerHasData = () => trainerSurahs().length > 0;

  // Merge the trainer's words + FSRS state into this profile's shadow deck.
  // If the trainer reviewed a word more recently than the game did, its
  // memory model wins — so voyages always draw from the REAL due queue.
  // (Write-back happens separately through SN.grade's syncBack.)
  function importTrainer() {
    if (window.WordStrength) {
      for (const e of window.WordStrength.entries()) {
        const k = e.id;
        let card = state.deck[k];
        if (!card) {
          card = Object.assign(FSRS.newCard(), {
            k, surah: (e.surahs || [])[0] || 1, arabic: e.arabic, english: e.english,
            display: e.display || e.english, translit: e.translit || "",
            root: e.root || "", audioPath: e.audioPath || "", missPrior: e.miss || 0,
          });
          card.due = Date.now();
          state.deck[k] = card;
        } else {
          card.missPrior = Math.max(card.missPrior || 0, e.miss || 0);
          if (e.audioPath) card.audioPath = e.audioPath;
        }
        const f = e.fsrs;
        if (f && typeof f.stability === "number" && (f.lastReview || 0) > (card.lastReview || 0)) {
          Object.assign(card, {
            stability: f.stability, difficulty: f.difficulty, due: f.due,
            lastReview: f.lastReview ?? null, reps: f.reps || 1, lapses: f.lapses || 0, state: "review",
          });
        }
      }
      return;
    }
    // Legacy fallback: the old split stores, read-only.
    for (const n of trainerSurahs()) {
      const stats = LS.get(`quran-trainer:stats:surah-${n}`, {});
      const review = LS.get(`quran-trainer:review:surah-${n}`, {});
      const reviewBy = {};
      for (const c of review.deck || []) reviewBy[c.id] = c;
      for (const s of Object.values(stats)) {
        if (!s || !s.arabic) continue;
        const k = wordKey(s.arabic, s.english);
        let card = state.deck[k];
        if (!card) {
          card = Object.assign(FSRS.newCard(), {
            k, surah: n, arabic: s.arabic, english: s.english,
            display: s.display || s.english, translit: s.translit || "",
            root: s.root || "", audioPath: s.audioPath || "", missPrior: s.miss || 0,
          });
          card.due = Date.now();
          state.deck[k] = card;
        } else {
          card.missPrior = Math.max(card.missPrior || 0, s.miss || 0);
          if (s.audioPath) card.audioPath = s.audioPath;
        }
        const r = reviewBy[k];
        if (r && typeof r.stability === "number" && (r.lastReview || 0) > (card.lastReview || 0)) {
          Object.assign(card, {
            stability: r.stability, difficulty: r.difficulty, due: r.due,
            lastReview: r.lastReview ?? null, reps: r.reps || 1, lapses: r.lapses || 0, state: "review",
          });
        }
      }
    }
  }

  // ------------------------------------------------------------ word data
  const surahCache = {};
  const ayahCache = {}; // n -> { [ayahNumber]: { translation, words: [wordRec...] } }
  let lexiconPromise = null;

  async function loadLexicon() {
    if (state.lexicon) return state.lexicon;
    if (!lexiconPromise) {
      lexiconPromise = fetch("data/navigator-lexicon.json?v=20260710-nav16")
        .then((res) => {
          if (!res.ok) throw new Error(`navigator lexicon: HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          state.lexicon = data;
          return data;
        })
        .catch((error) => {
          console.warn("Navigator lexical frequencies unavailable.", error);
          return null;
        });
    }
    return lexiconPromise;
  }

  SN.lexicalInfo = (card) => {
    const lexicon = state.lexicon;
    const fallback = { lemma: "", lemmaCount: 0, root: card.root || "", rootCount: 0 };
    if (!lexicon) return fallback;
    const compact = lexicon.byKey?.[card.k] || lexicon.byArabic?.[card.arabic];
    if (!compact) return fallback;
    const lemmaRecord = compact[0] >= 0 ? lexicon.lemmas?.[compact[0]] : null;
    const rootRecord = compact[1] >= 0 ? lexicon.roots?.[compact[1]] : null;
    return {
      lemma: lemmaRecord?.[0] || "",
      lemmaCount: lemmaRecord?.[1] || 0,
      root: rootRecord?.[0] || card.root || "",
      rootCount: rootRecord?.[1] || 0,
    };
  };

  SN.rootTier = (count) => count >= 10 ? 3 : count >= 6 ? 2 : count >= 3 ? 1 : 0;
  SN.rootPerks = [
    "Chart 3 dictionary forms to set this root as your bearing.",
    "Attuned words strike 25% harder.",
    "First attuned word each encounter also finds 1 pearl.",
    "First attuned word each encounter also raises a ward.",
  ];
  SN.rootFamilies = () => {
    const families = new Map();
    for (const card of Object.values(state.deck)) {
      if (!card?.chartedAt) continue;
      const info = SN.lexicalInfo(card);
      const root = info.root || card.root || "";
      if (!root) continue;
      if (!families.has(root)) families.set(root, { root, rootCount: info.rootCount || 0, words: new Map() });
      const family = families.get(root);
      family.rootCount = Math.max(family.rootCount, info.rootCount || 0);
      const lemmaKey = info.lemma || card.arabic;
      if (!family.words.has(lemmaKey)) {
        family.words.set(lemmaKey, {
          lemma: info.lemma || "",
          arabic: card.arabic,
          english: card.display || card.english,
          chartedAt: card.chartedAt,
        });
      }
    }
    return [...families.values()].map((family) => {
      const words = [...family.words.values()].sort((a, b) => a.chartedAt - b.chartedAt);
      const count = words.length;
      const tier = SN.rootTier(count);
      const next = tier === 0 ? 3 : tier === 1 ? 6 : tier === 2 ? 10 : null;
      return { ...family, words, count, tier, next };
    }).sort((a, b) => b.tier - a.tier || b.count - a.count || b.rootCount - a.rootCount);
  };

  async function loadSurah(n) {
    if (surahCache[n]) return surahCache[n];
    const res = await fetch(`data/surah-${n}.json`);
    if (!res.ok) throw new Error(`surah ${n}: HTTP ${res.status}`);
    const data = await res.json();
    const words = [];
    const ayahMap = {};
    for (const a of data.ayahs) {
      const ayahWords = [];
      for (const w of a.words) {
        const rec = {
          k: wordKey(w.arabic, w.english), surah: n, ayah: a.number, pos: w.position,
          arabic: w.arabic, english: w.english, display: w.english,
          translit: w.translit || "", root: w.root || "",
          audioPath: w.audio || `wbw/${pad3(n)}_${pad3(a.number)}_${pad3(w.position)}.mp3`,
        };
        words.push(rec);
        ayahWords.push(rec);
      }
      ayahMap[a.number] = { translation: a.translation || "", words: ayahWords };
    }
    surahCache[n] = words;
    ayahCache[n] = ayahMap;
    return words;
  }

  // Ayah-level lookup for the Word Atlas and verse encounters — only covers
  // surahs already fetched via loadSurah (no eager full-Quran load).
  SN.ayahData = (surah, ayah) => ayahCache[surah]?.[ayah] || null;
  SN.loadedSurahs = () => Object.keys(ayahCache).map(Number).sort((a, b) => a - b);

  function bankAdd(words) {
    for (const w of words) {
      if (state.bankKeys.has(w.k)) continue;
      state.bankKeys.add(w.k);
      state.bank.push(w);
    }
  }

  // Prepare word sources for a voyage: import trainer data (linked profiles),
  // fetch the relevant surahs, and line up never-seen words as candidates.
  SN.prepareWords = async function prepareWords() {
    const p = SN.profile();
    if (p.linked) importTrainer();
    const lexicalReady = loadLexicon();

    let surahs;
    if (p.linked) {
      surahs = trainerSurahs();
      if (!surahs.length) surahs = [1];
    } else {
      const ix = Math.min(state.meta.curriculumIx, C.curriculum.length - 1);
      surahs = C.curriculum.slice(ix, ix + 2);
      if (!surahs.length) surahs = [1];
    }
    const loadedLists = [];
    for (const n of surahs.slice(0, 8)) {
      try { loadedLists.push(await loadSurah(n)); state.loaded.add(n); } catch {}
    }
    for (const list of loadedLists) bankAdd(list);
    await lexicalReady;

    // Fresh candidates: bank words not in the deck, in reading order for the
    // surahs we chose (Al-Fatihah first for kid profiles).
    const freshMap = new Map();
    for (const list of loadedLists)
      for (const w of list) if (!state.deck[w.k] && !freshMap.has(w.k)) freshMap.set(w.k, w);
    state.fresh = [...freshMap.values()];

    // Unlinked profiles advance the curriculum once a surah is fully absorbed.
    if (!p.linked && state.fresh.length === 0 && state.meta.curriculumIx < C.curriculum.length - 1) {
      state.meta.curriculumIx++;
      SN.saveMeta();
      return SN.prepareWords();
    }
    state.ready = true;
  };

  // ------------------------------------------------------- word selection
  // Disguised spaced repetition: ~70% due/weak words, ~20% new, ~10% strong
  // for confidence — with graceful fallbacks when a bucket runs dry.
  const MASTERED_DAYS = 21;
  const cardsArr = () => Object.values(state.deck);
  const isSeen = (c) => (c.reps || 0) > 0;
  const isMastered = (c) => isSeen(c) && (c.stability || 0) >= MASTERED_DAYS;
  const isWeak = (c) => {
    if (!isSeen(c)) return false;
    if (isMastered(c)) return false;
    return c.due <= Date.now() || (c.missPrior || 0) > 0 || (c.lapses || 0) > 0 || (c.stability || 0) < 3;
  };

  SN.masteredCount = () => cardsArr().filter(isMastered).length;
  SN.isSeen = isSeen;
  SN.isMastered = isMastered;

  SN.metrics = () => ({
    runs: state.meta.runs, wins: state.meta.wins, stars: state.meta.wins,
    mastered: SN.masteredCount(), rescued: state.meta.rescuedTotal,
  });

  // --------------------------------------------------------- recruitment
  SN.recruited = (crewId) => !!(state.meta && state.meta.recruited && state.meta.recruited[crewId]);
  SN.recruitedCount = () => ["yusuf", "layla", "idris"].filter(SN.recruited).length;
  SN.recruitCrew = (crewId) => {
    if (!state.meta.recruited) state.meta.recruited = { yusuf: false, layla: false, idris: false };
    state.meta.recruited[crewId] = true;
    SN.saveMeta();
  };
  // The recruitment ladder — one friend per early chapter. Yusuf at the end
  // of the very first voyage (win or lose: surviving your first storm is the
  // set-piece), Layla once the sea has been calmed once, Idris after two —
  // with runs-based mercy gates so a struggling navigator still meets them.
  SN.pendingRecruit = () => {
    const m = state.meta;
    if (!m || !m.recruited) return null;
    if (!m.recruited.yusuf && m.runs >= 1) return "yusuf";
    if (!m.recruited.layla && m.recruited.yusuf && (m.wins >= 1 || m.runs >= 3)) return "layla";
    if (!m.recruited.idris && m.recruited.layla && (m.wins >= 2 || m.runs >= 5)) return "idris";
    return null;
  };

  // Keepsake/vessel unlock state is derived, never persisted separately —
  // same req-vs-metrics shape as the crew dialogue beats.
  SN.keepsakeUnlocked = (relic) => {
    if (relic.crew && !SN.recruited(relic.crew)) return false; // not aboard yet
    if (!relic.unlock) return true;
    const m = SN.metrics();
    for (const [k, v] of Object.entries(relic.unlock)) if ((m[k] || 0) < v) return false;
    return true;
  };
  SN.vesselUnlocked = (vessel) => {
    if (!vessel.crew) return true; // the Miftah — always available
    return (state.meta.crew[vessel.crew]?.beat || 0) >= vessel.unlockBeat;
  };

  // ---------------------------------------------------------- ayah unlocks
  // An ayah is "complete" once every one of its words has been seen at
  // least once in this profile's deck — the bar for the Word Atlas glow
  // and for a verse becoming eligible as its own encounter.
  SN.ayahStatus = (surah, ayah) => {
    const a = SN.ayahData(surah, ayah);
    if (!a) return null;
    let unlocked = 0;
    for (const w of a.words) { const c = state.deck[w.k]; if (c && isSeen(c)) unlocked++; }
    return { total: a.words.length, unlocked, complete: a.words.length > 0 && unlocked === a.words.length };
  };

  // Fully-unlocked, not-yet-recited ayahs within a word-count range, scanned
  // only over surahs already loaded this session (no eager full-Quran fetch).
  SN.eligibleVerses = ({ minWords = 1, maxWords = Infinity } = {}) => {
    const out = [];
    for (const n of SN.loadedSurahs()) {
      const ayahs = ayahCache[n] || {};
      for (const ayahNum of Object.keys(ayahs)) {
        const a = ayahs[ayahNum];
        if (a.words.length < minWords || a.words.length > maxWords) continue;
        const key = `${n}:${ayahNum}`;
        if (state.meta.versesCompleted && state.meta.versesCompleted[key]) continue;
        const status = SN.ayahStatus(n, Number(ayahNum));
        if (status && status.complete) out.push({ surah: n, ayah: Number(ayahNum), translation: a.translation, words: a.words });
      }
    }
    return out;
  };

  SN.completeVerse = (surah, ayah) => {
    state.meta.versesCompleted = state.meta.versesCompleted || {};
    state.meta.versesCompleted[`${surah}:${ayah}`] = Date.now();
    SN.saveMeta();
  };
  SN.versesCompletedCount = () => Object.keys(state.meta.versesCompleted || {}).length;

  // Materialize a fresh candidate into a real card in the deck.
  SN.introduce = (w) => {
    const card = Object.assign(FSRS.newCard(), w, {
      due: Date.now(),
      missPrior: 0,
      discoveryPending: true,
    });
    state.deck[w.k] = card;
    state.fresh = state.fresh.filter((f) => f.k !== w.k);
    SN.saveDeck();
    return card;
  };

  // Draw one word for a question, avoiding the most recent few.
  SN.drawWord = (avoid) => {
    avoid = avoid || new Set();
    const all = cardsArr();
    const notAvoided = (c) => !avoid.has(c.k);
    const weak = all.filter((c) => isWeak(c) && notAvoided(c));
    const learning = all.filter((c) => !isMastered(c) && notAvoided(c)); // includes just-introduced
    const strong = all.filter((c) => isMastered(c) && notAvoided(c));
    const r = Math.random();
    let bucketChain;
    if (r < 0.7) bucketChain = [weak, learning, strong];
    else if (r < 0.9) bucketChain = [learning, weak, strong];
    else bucketChain = [strong, weak, learning];
    for (const b of bucketChain) if (b.length) return pick(b);
    // Deck exhausted by `avoid` — allow a repeat rather than stall.
    const anyone = all.filter((c) => !isMastered(c));
    return anyone.length ? pick(anyone) : all[0] || null;
  };

  // Draw n distinct words (for pairs waves).
  SN.drawWords = (n, avoid) => {
    const got = [];
    const seen = new Set(avoid || []);
    for (let i = 0; i < n * 4 && got.length < n; i++) {
      const c = SN.drawWord(seen);
      if (!c) break;
      if (!seen.has(c.k)) { got.push(c); seen.add(c.k); }
    }
    return got;
  };

  // How many brand-new words an encounter may introduce right now.
  SN.introQuota = () => {
    const seen = cardsArr().filter(isSeen).length;
    if (!state.fresh.length) return 0;
    if (seen < 8) return Math.min(4, state.fresh.length); // young deck: feed it
    return Math.min(2, state.fresh.length);
  };

  // ------------------------------------------------ rubber-band difficulty
  // Invisible Brain Age-style adaptation: rolling accuracy + speed set the
  // option count, distractor similarity, and time pressure. Never shown.
  SN.noteAnswer = (correct, ms, allowed) => {
    const s = state.meta.skill;
    s.acc = s.acc * 0.88 + (correct ? 1 : 0) * 0.12;
    const quick = correct ? clamp01(1 - ms / Math.max(1, allowed)) : 0;
    s.spd = s.spd * 0.9 + quick * 0.1;
  };
  SN.knobs = () => {
    const s = state.meta.skill;
    const level = clamp01(s.acc * 0.7 + s.spd * 0.3);
    return {
      level,
      options: 3 + (level > 0.55 ? 1 : 0) + (level > 0.82 ? 1 : 0),
      timeMs: Math.round(lerp(14000, 7500, level)),
      similarity: clamp01((level - 0.25) * 1.2),
    };
  };

  // Build answer options for a card. mode "meaning": Arabic prompt, English
  // options. mode "arabic": (audio or English) prompt, Arabic options.
  // Distractor similarity scales with skill: same-root and look-alike words
  // sneak in as the learner strengthens.
  const normGloss = (s) => String(s || "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z؀-ۿ]+/g, " ").trim();
  SN.buildOptions = (card, mode, countOverride) => {
    const knobs = SN.knobs();
    const count = Math.max(2, Math.min(5, countOverride || knobs.options));
    const label = (w) => (mode === "arabic" ? w.arabic : (w.display || w.english));
    const correctNorm = mode === "arabic" ? card.arabic : normGloss(card.display || card.english);

    const cands = [];
    const used = new Set([correctNorm]);
    for (const w of state.bank.concat(cardsArr())) {
      if (w.k === card.k) continue;
      const n = mode === "arabic" ? w.arabic : normGloss(w.display || w.english);
      if (!n || used.has(n)) continue;
      if (mode === "arabic" && normGloss(w.english) === normGloss(card.english)) continue;
      used.add(n);
      let score = Math.random() * 0.5;
      if (card.root && w.root && w.root === card.root) score += 4;
      if (w.arabic[0] === card.arabic[0]) score += 1;
      if (Math.abs(w.arabic.length - card.arabic.length) <= 2) score += 1;
      cands.push({ w, score });
    }
    cands.sort((a, b) => b.score - a.score);
    const need = count - 1;
    const similarN = Math.round(need * knobs.similarity);
    const top = cands.slice(0, Math.max(similarN * 3, 6));
    const rest = cands.slice(top.length);
    const chosen = shuffle(top).slice(0, similarN);
    const fillFrom = shuffle(rest.length ? rest : top.slice(similarN));
    for (const c of fillFrom) { if (chosen.length >= need) break; if (!chosen.includes(c)) chosen.push(c); }
    const opts = chosen.map((c) => ({ label: label(c.w), ok: false, word: c.w }));
    opts.push({ label: label(card), ok: true, word: card });
    return shuffle(opts);
  };

  // FSRS grading — the entire "learning tool" hidden inside the combat.
  SN.grade = (card, g) => {
    const graded = FSRS.repeat(card, g, Date.now());
    Object.assign(card, graded);
    if (g >= 3 && card.missPrior) card.missPrior = Math.max(0, card.missPrior - 1);
    syncBack(card, g);
  };

  // The two-way learning contract (specs/03-star-navigator-v2.md): recall
  // evidence flows back into the trainer's unified store — for words the
  // trainer already knows. The store applies asymmetric honesty itself
  // (source "game": misses land full weight, hits land damped). Words the
  // game discovered on its own path are NEVER pushed into the trainer's
  // queue; their progression stays aboard the ship.
  function syncBack(card, g) {
    const WS = window.WordStrength;
    const p = SN.profile();
    if (!WS || !p || !p.linked) return;
    if (!WS.get(card.k)) return; // game-only word — no push
    WS.review(card.k, g, { source: "game" });
  }

  // ----------------------------------------------------------- recitation
  const recite = new (window.MiftahGame.RecitationAudio)(() => SN.audio.enabled);
  SN.recite = (card) => { if (card && card.audioPath) recite.playWord(card.audioPath); };

  // ---------------------------------------------------------- audio synth
  class NavAudio {
    constructor() {
      this.enabled = LS.get(SOUNDKEY, true);
      this.ctx = null; this.master = null; this.amb = null;
    }
    ensure() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!this.ctx) {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.4;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      return this.ctx;
    }
    toggle() {
      this.enabled = !this.enabled;
      LS.set(SOUNDKEY, this.enabled);
      if (this.enabled) this.startAmbient(); else this.stopAmbient();
      return this.enabled;
    }
    tone(f, { at = 0, dur = 0.2, type = "sine", g = 0.16, slide = 0 } = {}) {
      if (!this.enabled) return;
      const ctx = this.ensure(); if (!ctx) return;
      const t0 = ctx.currentTime + at;
      const o = ctx.createOscillator(), gn = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
      gn.gain.setValueAtTime(0.0001, t0);
      gn.gain.exponentialRampToValueAtTime(g, t0 + 0.018);
      gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(gn); gn.connect(this.master);
      o.start(t0); o.stop(t0 + dur + 0.05);
    }
    sweep({ at = 0, dur = 0.3, g = 0.12, from = 500, to = 2400 } = {}) {
      if (!this.enabled) return;
      const ctx = this.ensure(); if (!ctx) return;
      const t0 = ctx.currentTime + at;
      const len = Math.ceil(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 6;
      bp.frequency.setValueAtTime(from, t0);
      bp.frequency.exponentialRampToValueAtTime(to, t0 + dur);
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(g, t0);
      gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(bp); bp.connect(gn); gn.connect(this.master);
      src.start(t0); src.stop(t0 + dur + 0.05);
    }
    click() { this.tone(680, { dur: 0.05, type: "triangle", g: 0.05 }); }
    correct(streak) {
      const scale = [523, 587, 659, 784, 880, 1047, 1175, 1319];
      const i = Math.min(Math.max(streak - 1, 0), scale.length - 1);
      this.tone(scale[Math.max(0, i - 1)], { dur: 0.12, type: "triangle", g: 0.1 });
      this.tone(scale[i], { at: 0.08, dur: 0.22, type: "triangle", g: 0.12 });
    }
    wrong() { this.tone(150, { dur: 0.3, type: "sawtooth", g: 0.1, slide: 85 }); this.sweep({ dur: 0.18, g: 0.05, from: 300, to: 120 }); }
    harpoon() { this.sweep({ dur: 0.28, g: 0.1, from: 600, to: 3200 }); }
    hit() { this.tone(72, { dur: 0.5, g: 0.28, slide: 40 }); }
    pearl() { this.tone(1568, { dur: 0.18, type: "triangle", g: 0.09 }); this.tone(2093, { at: 0.07, dur: 0.2, type: "sine", g: 0.06 }); }
    heal() { this.tone(392, { dur: 0.25, type: "sine", g: 0.1 }); this.tone(523, { at: 0.12, dur: 0.3, type: "sine", g: 0.1 }); }
    boon() { [880, 1174, 1568].forEach((f, i) => this.tone(f, { at: i * 0.09, dur: 0.3, type: "sine", g: 0.08 })); }
    relic() { [392, 523, 784].forEach((f, i) => this.tone(f, { at: i * 0.12, dur: 0.32, type: "triangle", g: 0.09 })); this.tone(196, { dur: 0.5, type: "sine", g: 0.07 }); }
    cursed() { this.tone(98, { dur: 0.9, type: "sawtooth", g: 0.14, slide: 82 }); this.tone(98, { at: 0.45, dur: 0.9, type: "sawtooth", g: 0.1, slide: 82 }); }
    tierUp() {
      [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, { at: i * 0.06, dur: 0.24, type: "triangle", g: 0.09 }));
      this.tone(1568, { at: 0.3, dur: 0.4, type: "sine", g: 0.1 });
    }
    victory() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, { at: i * 0.12, dur: 0.42, type: "triangle", g: 0.11 })); }
    defeat() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, { at: i * 0.22, dur: 0.5, type: "sine", g: 0.1 })); }
    rumble() { this.tone(48, { dur: 1.4, g: 0.3, slide: 36 }); this.sweep({ dur: 1.1, g: 0.05, from: 160, to: 60 }); }
    startAmbient() {
      if (!this.enabled || this.amb) return;
      const ctx = this.ensure(); if (!ctx) return;
      const len = ctx.sampleRate * 3;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.015 * w) / 1.015; d[i] = last * 4; }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420;
      const gn = ctx.createGain(); gn.gain.value = 0.05;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08;
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.03;
      lfo.connect(lfoG); lfoG.connect(gn.gain);
      src.connect(lp); lp.connect(gn); gn.connect(this.master);
      src.start(); lfo.start();
      this.amb = { src, lfo, gn };
    }
    stopAmbient() {
      if (!this.amb) return;
      try { this.amb.src.stop(); this.amb.lfo.stop(); } catch {}
      this.amb = null;
    }
  }
  SN.audio = new NavAudio();
  document.addEventListener("pointerdown", function onFirst() {
    document.removeEventListener("pointerdown", onFirst);
    SN.audio.ensure();
    SN.audio.startAmbient();
  }, { once: true });

  // Relic HUD chips are re-rendered on every run screen (currentsHTML); a
  // single delegated listener survives all of those re-renders.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-relic]");
    if (!btn) return;
    const r = C.relics.find((x) => x.id === btn.dataset.relic);
    if (r) { SN.audio.click(); SN.toast(r.desc); }
  });

  // ------------------------------------------------------------ fx helpers
  const fxLayer = () => $("#fx-layer");
  SN.fx = {
    float(text, x, y, hurt) {
      const el = document.createElement("div");
      el.className = "fx-float" + (hurt ? " hurt" : "");
      el.textContent = text;
      el.style.left = `${x - 20}px`; el.style.top = `${y}px`;
      fxLayer().appendChild(el);
      setTimeout(() => el.remove(), 950);
    },
    beam(fromEl, toEl) {
      if (!fromEl || !toEl) return;
      const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
      const x1 = a.left + a.width * 0.7, y1 = a.top + a.height * 0.3;
      const x2 = b.left + b.width * 0.45, y2 = b.top + b.height * 0.6;
      const len = Math.hypot(x2 - x1, y2 - y1);
      const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
      const el = document.createElement("div");
      el.className = "fx-beam";
      el.style.left = `${x1}px`; el.style.top = `${y1}px`;
      el.style.width = `${len}px`;
      el.style.transform = `rotate(${ang}deg)`;
      fxLayer().appendChild(el);
      this.burst(x2, y2);
      setTimeout(() => el.remove(), 400);
    },
    burst(x, y) {
      const el = document.createElement("div");
      el.className = "fx-burst";
      el.style.left = `${x - 5}px`; el.style.top = `${y - 5}px`;
      fxLayer().appendChild(el);
      setTimeout(() => el.remove(), 500);
    },
    shake() {
      document.body.classList.remove("shake");
      void document.body.offsetWidth;
      document.body.classList.add("shake");
      setTimeout(() => document.body.classList.remove("shake"), 450);
    },
    vignette() {
      const el = document.createElement("div");
      el.className = "vignette";
      fxLayer().appendChild(el);
      setTimeout(() => el.remove(), 600);
    },
  };

  // -------------------------------------------------------------- night sky
  function startSky() {
    const cv = $("#sky");
    const ctx2d = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, stars = [], glows = [], t = 0;
    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      const n = Math.round((W * H) / 8500);
      for (let i = 0; i < n; i++)
        stars.push({ x: Math.random() * W, y: Math.random() * H * 0.62, r: Math.random() * 1.3 + 0.3, p: Math.random() * 6.28, s: 0.4 + Math.random() * 1.4 });
      glows = [];
      for (let i = 0; i < 22; i++)
        glows.push({ x: Math.random() * W, y: H * (0.66 + Math.random() * 0.32), r: Math.random() * 1.6 + 0.6, p: Math.random() * 6.28, v: 4 + Math.random() * 10 });
    }
    size();
    addEventListener("resize", size);
    function frame() {
      t += 0.016;
      ctx2d.clearRect(0, 0, W, H);
      const seaY = H * 0.62;
      let grad = ctx2d.createLinearGradient(0, 0, 0, seaY);
      grad.addColorStop(0, "#0a0f2e"); grad.addColorStop(1, "#0d1433");
      ctx2d.fillStyle = grad; ctx2d.fillRect(0, 0, W, seaY);
      grad = ctx2d.createLinearGradient(0, seaY, 0, H);
      grad.addColorStop(0, "#0a1226"); grad.addColorStop(1, "#070b18");
      ctx2d.fillStyle = grad; ctx2d.fillRect(0, seaY, W, H - seaY);
      // stars
      for (const s of stars) {
        const a = 0.35 + 0.65 * Math.abs(Math.sin(s.p + t * s.s));
        ctx2d.globalAlpha = a;
        ctx2d.fillStyle = "#cfe0ff";
        ctx2d.fillRect(s.x, s.y, s.r, s.r);
      }
      // bioluminescent drift
      for (const g of glows) {
        g.x -= 0.08 * g.v * 0.1;
        if (g.x < -4) g.x = W + 4;
        const a = 0.25 + 0.3 * Math.abs(Math.sin(g.p + t * 0.9));
        ctx2d.globalAlpha = a;
        ctx2d.fillStyle = "#3fd6c0";
        ctx2d.beginPath(); ctx2d.arc(g.x, g.y + Math.sin(t + g.p) * 2, g.r, 0, 6.28); ctx2d.fill();
      }
      ctx2d.globalAlpha = 1;
      if (!document.hidden) requestAnimationFrame(frame);
      else setTimeout(() => requestAnimationFrame(frame), 400);
    }
    requestAnimationFrame(frame);
  }

  // ------------------------------------------------------------ ui plumbing
  SN.render = (html) => {
    SN.particlesReady?.then((particles) => particles?.destroy?.());
    const app = $("#app");
    app.classList.remove("leaving");
    app.innerHTML = `<section class="screen">${html}</section>`;
    window.scrollTo(0, 0);
  };

  SN.toast = (msg) => {
    const root = $("#toast-root");
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = msg;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-visible"));
    setTimeout(() => {
      el.classList.remove("is-visible");
      setTimeout(() => el.remove(), 180);
    }, 2400);
  };

  SN.overlay = (html, { onClose, className = "", dismissible = true } = {}) => {
    const root = $("#overlay-root");
    if (root.hidden) SN._overlayReturnFocus = document.activeElement;
    root.innerHTML = `<div class="sheet${className ? ` ${esc(className)}` : ""}" role="dialog" aria-modal="true" tabindex="-1">${html}</div>`;
    root.hidden = false;
    root.classList.toggle("is-blocking", !dismissible);
    root.onclick = (e) => { if (dismissible && e.target === root) SN.closeOverlay(); };
    const sheet = root.firstElementChild;
    const heading = sheet.querySelector("h2");
    if (heading) {
      heading.id = "navigator-overlay-title";
      sheet.setAttribute("aria-labelledby", heading.id);
    } else {
      sheet.setAttribute("aria-label", "Star Navigator panel");
    }
    root.onkeydown = (event) => {
      if (dismissible && event.key === "Escape") {
        event.preventDefault();
        SN.closeOverlay();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...sheet.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) {
        event.preventDefault();
        sheet.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    SN._onOverlayClose = onClose || null;
    requestAnimationFrame(() => {
      const initialFocus = sheet.querySelector("[data-close], [data-cast], button:not([disabled]), input:not([disabled])");
      (initialFocus || sheet).focus({ preventScroll: true });
    });
    return sheet;
  };
  SN.closeOverlay = () => {
    const root = $("#overlay-root");
    root.hidden = true;
    root.classList.remove("is-blocking");
    root.innerHTML = "";
    root.onclick = null;
    root.onkeydown = null;
    const cb = SN._onOverlayClose; SN._onOverlayClose = null;
    const returnFocus = SN._overlayReturnFocus;
    SN._overlayReturnFocus = null;
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
    if (cb) cb();
  };

  SN.confirm = (msg, onYes) => {
    const sheet = SN.overlay(`
      <div class="sheet-grab"></div>
      <h2>${esc(msg)}</h2>
      <div class="sum-actions">
        <button class="btn btn-gold" data-yes>Yes</button>
        <button class="btn" data-no>No</button>
      </div>`);
    $("[data-yes]", sheet).onclick = () => { SN.closeOverlay(); onYes(); };
    $("[data-no]", sheet).onclick = () => SN.closeOverlay();
  };

  const soundIcon = () => (SN.audio.enabled ? C.icons.sound : C.icons.soundOff);
  SN.hud = () => `
    <div class="hud">
      <a class="hud-home" href="surahs.html" aria-label="Back to Miftah">${C.icons.anchor}<span>Miftah</span></a>
      <span class="spacer"></span>
      <button class="hud-chip" data-hud-profile>${C.emblems.find((e) => e.id === SN.profile().emblem)?.svg || ""}<span>${esc(SN.profile().name)}</span></button>
      <button class="hud-chip" data-hud-pearls>${C.icons.pearl}<span class="pearl-n">${state.meta.pearls}</span></button>
      <button class="hud-chip muted-chip" data-hud-sound aria-label="Toggle sound">${soundIcon()}</button>
    </div>`;
  SN.wireHud = () => {
    const p = $("[data-hud-profile]"); if (p) p.onclick = () => { SN.audio.click(); renderProfiles(); };
    const pe = $("[data-hud-pearls]"); if (pe) pe.onclick = () => { SN.audio.click(); openUpgrades(); };
    const s = $("[data-hud-sound]");
    if (s) s.onclick = () => { const on = SN.audio.toggle(); s.innerHTML = soundIcon(); SN.toast(on ? "Sound on" : "Sound off"); };
  };

  // --------------------------------------------------------------- profiles
  function renderProfiles() {
    const hasTrainer = SN.trainerHasData();
    const linkTaken = state.profiles.some((p) => p.linked);
    const cards = state.profiles.map((p) => `
      <div class="profile-card panel">
        <button class="profile-card-hit" data-open="${p.id}" style="all:unset;cursor:pointer;display:flex;align-items:center;gap:12px;flex:1;min-width:0">
          <span class="emblem">${C.emblems.find((e) => e.id === p.emblem)?.svg || C.emblems[0].svg}</span>
          <span style="min-width:0">
            <span class="p-name">${esc(p.name)}</span>
            <div class="p-meta">${metaLine(p)}</div>
          </span>
        </button>
        ${p.linked ? '<span class="p-link-tag">Linked to Trainer</span>' : ""}
        <button class="p-del" data-del="${p.id}" aria-label="Remove ${esc(p.name)}">✕</button>
      </div>`).join("");

    SN.render(`
      <div class="profiles-hero">
        <span class="astrolabe">${C.astrolabe}</span>
        <h1>The Star Navigator</h1>
        <span class="ar-title ar">ملّاح النجوم</span>
        <p>The night sea speaks in the words you are learning. Chart the constellations — every star up there already has an Arabic name.</p>
      </div>
      <div class="profile-list">${cards}</div>
      <form class="profile-form panel" id="new-profile">
        <div>
          <label for="p-name">Who sails tonight?</label>
          <input type="text" id="p-name" maxlength="14" placeholder="Name" autocomplete="off" style="margin-top:6px" />
        </div>
        <div>
          <label>Choose an emblem</label>
          <div class="emblem-grid" style="margin-top:6px">
            ${C.emblems.map((e, i) => `<button type="button" class="emblem-pick${i === 0 ? " sel" : ""}" data-emblem="${e.id}" aria-label="${e.name}" aria-pressed="${i === 0}">${e.svg}</button>`).join("")}
          </div>
        </div>
        ${hasTrainer && !linkTaken ? `
        <label class="link-row">
          <input type="checkbox" id="p-link" />
          <span>
            <span class="link-title">Link this browser's Trainer progress</span>
            <div class="link-sub">Your trained words and their memory schedule become this navigator's sky. The Trainer's own save is never changed.</div>
          </span>
        </label>` : ""}
        <button class="btn btn-gold btn-big" type="submit">Begin the voyage</button>
      </form>`);

    let emblem = C.emblems[0].id;
    document.querySelectorAll("[data-emblem]").forEach((b) => {
      b.onclick = () => {
        document.querySelectorAll("[data-emblem]").forEach((x) => {
          x.classList.remove("sel");
          x.setAttribute("aria-pressed", "false");
        });
        b.classList.add("sel");
        b.setAttribute("aria-pressed", "true");
        emblem = b.dataset.emblem;
        SN.audio.click();
      };
    });
    document.querySelectorAll("[data-open]").forEach((b) => {
      b.onclick = () => { SN.audio.click(); activateProfile(b.dataset.open); SN.goHarbor(); };
    });
    document.querySelectorAll("[data-del]").forEach((b) => {
      b.onclick = () => {
        const p = state.profiles.find((x) => x.id === b.dataset.del);
        SN.confirm(`Remove ${p.name}'s logbook? Their voyage progress will be lost.`, () => {
          deleteProfile(b.dataset.del);
          renderProfiles();
        });
      };
    });
    $("#new-profile").onsubmit = (e) => {
      e.preventDefault();
      const name = $("#p-name").value.trim();
      if (!name) { $("#p-name").focus(); return; }
      const linked = !!$("#p-link")?.checked;
      createProfile({ name, emblem, linked });
      SN.audio.boon();
      SN.goHarbor();
    };
  }
  function metaLine(p) {
    const m = LS.get(metaKey(p.id), null);
    if (!m || !m.runs) return "New navigator";
    return `${m.runs} voyage${m.runs === 1 ? "" : "s"} · ${m.wins} guardian${m.wins === 1 ? "" : "s"} calmed`;
  }
  SN.renderProfiles = renderProfiles;

  // ----------------------------------------------------------------- harbor
  const CREW_POS = { yusuf: { left: "16%", top: "36%" }, layla: { left: "50%", top: "30%" }, idris: { left: "82%", top: "38%" } };
  const IDLE = {
    yusuf: ["The sea is calm tonight. A fine night for remembering.", "Check your sails, navigator. The reach never sends warning first."],
    layla: ["I'm mid-inventory of the northern sky — talk soon, or hand me that pencil.", "Every star up there is a word waiting for you. No pressure. Some pressure."],
    idris: ["I skipped a stone eleven times today. ELEVEN.", "Do you think the leviathan ever gets tired? I think about this a lot."],
  };

  function nextBeat(crewId) {
    const cr = C.crew.find((c) => c.id === crewId);
    const cs = state.meta.crew[crewId];
    if (cs.beat >= cr.arc.length) return null;
    const beat = cr.arc[cs.beat];
    const m = SN.metrics();
    for (const [k, v] of Object.entries(beat.req)) if ((m[k] || 0) < v) return null;
    return beat;
  }
  function hasStory(crewId) {
    if (nextBeat(crewId)) return true;
    const cs = state.meta.crew[crewId];
    return !!(state.meta.lastRun && cs.reactSeen !== state.meta.lastRun.id);
  }

  const crewAssetVersion = "20260710-nav14";
  const dialogueArt = (crewId) => `assets/navigator/crew-${crewId}-scene.png?v=${crewAssetVersion}`;
  const harborArt = (crewId) => `assets/navigator/crew-${crewId}-avatar.png?v=${crewAssetVersion}`;
  const dialogueMotifs = {
    yusuf: `
      <span class="dlg-lantern-orb"></span>
      <span class="dlg-rope dlg-rope-a"></span>
      <span class="dlg-rope dlg-rope-b"></span>
      <span class="dlg-sail-ghost"></span>`,
    layla: `
      <span class="dlg-astro-ring ring-a"></span>
      <span class="dlg-astro-ring ring-b"></span>
      <span class="dlg-astro-ring ring-c"></span>
      <span class="dlg-star-thread thread-a"></span>
      <span class="dlg-star-thread thread-b"></span>`,
    idris: `
      <span class="dlg-pearl pearl-a"></span>
      <span class="dlg-pearl pearl-b"></span>
      <span class="dlg-pearl pearl-c"></span>
      <span class="dlg-current current-a"></span>
      <span class="dlg-current current-b"></span>`,
  };

  SN.goHarbor = function goHarbor() {
    const m = state.meta;
    // Warm the lexical index so Root Sky frequencies are ready before the
    // player asks for them; the click handlers still await it for certainty.
    loadLexicon();
    // Only friends you've actually MET stand at the dock — before that,
    // their spot on the quay is simply empty water (One Piece rule: the
    // crew is earned, never pre-installed).
    const crewBtns = C.crew.filter((c) => SN.recruited(c.id)).map((c) => `
      <button class="crew-btn${hasStory(c.id) ? " has-story" : ""}" data-crew="${c.id}" style="left:${CREW_POS[c.id].left};top:${CREW_POS[c.id].top}">
        ${hasStory(c.id) ? '<span class="story-dot">!</span>' : ""}
        <span class="portrait portrait-art"><img src="${harborArt(c.id)}" alt="" />${c.portrait}</span>
        <span class="crew-name">${c.name}</span>
      </button>`).join("");

    const last = m.lastRun ? `
      <div class="lastrun-chip panel">Last voyage: <b>${m.lastRun.outcome === "victory" ? "the Watcher calmed ✦" : "the sea prevailed"}</b>
        · ${m.lastRun.rescued} word${m.lastRun.rescued === 1 ? "" : "s"} rescued · ${m.lastRun.banked} pearls brought home</div>` : "";

    SN.render(`
      ${SN.hud()}
      <div class="harbor-scene">${C.harborScene}${crewBtns}</div>
      <div class="harbor-actions">
        <button class="btn btn-gold btn-big" data-sail>⛵ Set sail — the Thurayya Reach</button>
        <div class="harbor-row">
          <button class="btn" data-roots>${C.icons.root} Root Sky</button>
          <button class="btn" data-starmap>${C.icons.map} Star map</button>
          <button class="btn" data-upgrades>${C.icons.hammer} Shipwright</button>
          <button class="btn" data-atlas>${C.icons.book} Word Atlas</button>
        </div>
      </div>
      ${last}
      <div class="harbor-foot">
        <a href="trainer.html">Word Trainer</a>
        <a href="review.html">Review Deck</a>
        <a href="glossary.html">Glossary</a>
      </div>`);

    SN.wireHud();
    $("[data-sail]").onclick = async () => { SN.audio.click(); await loadLexicon(); openDeparture(); };
    $("[data-roots]").onclick = async () => { SN.audio.click(); await loadLexicon(); openRootSky(); };
    $("[data-starmap]").onclick = () => { SN.audio.click(); openStarMap(); };
    $("[data-upgrades]").onclick = () => { SN.audio.click(); openUpgrades(); };
    $("[data-atlas]").onclick = () => { SN.audio.click(); openAtlas(); };
    document.querySelectorAll("[data-crew]").forEach((b) => {
      b.onclick = () => { SN.audio.click(); openDialogue(b.dataset.crew); };
    });
  };

  // ------------------------------------------------------- root constellations
  // Every first-correct word contributes its dictionary form to a root family.
  // Families become selectable tactical bearings at 3 / 6 / 10 forms.
  function openRootSky() {
    const families = SN.rootFamilies();
    const activeRoot = state.meta.attunedRoot || "";
    const chartedWords = families.reduce((sum, family) => sum + family.count, 0);
    const tierName = (tier) => tier ? `Bearing ${["", "I", "II", "III"][tier]}` : "Forming";
    const familyHTML = families.map((family) => {
      const active = family.root === activeRoot;
      const progressTarget = family.next || family.count;
      const progress = progressTarget ? Math.min(100, Math.round((family.count / progressTarget) * 100)) : 100;
      const wordChips = family.words.slice(0, 8).map((word) => `
        <span class="root-word-chip"><b class="ar" lang="ar">${esc(word.lemma || word.arabic)}</b><span>${esc(word.english)}</span></span>`).join("");
      return `<button type="button" class="root-family-card panel${active ? " is-bearing" : ""}${family.tier ? " is-ready" : ""}"
        data-root-bearing="${esc(family.root)}" data-root-tier="${family.tier}" aria-pressed="${active}">
        <span class="root-family-head">
          <span class="root-family-letters ar" lang="ar">${esc([...family.root].join(" · "))}</span>
          <span class="root-tier-badge">${tierName(family.tier)}</span>
        </span>
        <span class="root-family-meta">${family.count} charted form${family.count === 1 ? "" : "s"} · ${family.rootCount.toLocaleString()} Quranic words</span>
        <span class="root-progress"><i style="width:${progress}%"></i></span>
        <span class="root-word-list">${wordChips}</span>
        <span class="root-perk">${family.tier ? SN.rootPerks[family.tier] : `${family.count} / 3 forms — ${SN.rootPerks[0]}`}</span>
        ${family.tier ? `<span class="root-bearing-action">${active ? "Current bearing ✦" : "Set as voyage bearing"}</span>` : ""}
      </button>`;
    }).join("");

    const sheet = SN.overlay(`
      <div class="sheet-grab"></div>
      <button class="sheet-close" data-close aria-label="Close">✕</button>
      <h2>Root Constellations</h2>
      <p class="sheet-sub">Chart related dictionary forms to kindle a root family. At three forms, choose it as your voyage bearing for a tactical advantage.</p>
      <div class="root-sky-summary panel"><b>${families.length}</b><span>families lit</span><b>${chartedWords}</b><span>forms charted</span></div>
      <div class="root-family-list">${familyHTML || `<div class="root-empty panel"><b>The root sky is still dark.</b><span>Correctly recall a new word and add it to your chart. Its family will appear here.</span></div>`}</div>`);

    $("[data-close]", sheet).onclick = () => SN.closeOverlay();
    $$('[data-root-bearing]', sheet).forEach((button) => {
      button.onclick = () => {
        if (!Number(button.dataset.rootTier)) {
          const family = families.find((candidate) => candidate.root === button.dataset.rootBearing);
          SN.toast(`Chart ${Math.max(1, 3 - (family?.count || 0))} more form${3 - (family?.count || 0) === 1 ? "" : "s"} to kindle this bearing.`);
          return;
        }
        state.meta.attunedRoot = button.dataset.rootBearing;
        SN.saveMeta();
        SN.audio.boon();
        openRootSky();
      };
    });
  }
  SN.openRootSky = openRootSky;

  // ------------------------------------------------------------- departure
  // Tapping "Set sail" opens this bottom sheet instead of starting the run
  // directly: vessel row (Phase 4) above the keepsake row (Phase 3), both
  // persisting to meta immediately so a returning player is one tap from
  // sailing. "Cast off" is the only thing that actually starts the voyage.
  function keepsakeHint(r) {
    const [k, v] = Object.entries(r.unlock)[0];
    const verbs = { runs: "Sail", wins: "Calm", rescued: "Rescue", stars: "Chart", mastered: "Master" };
    const nouns = { runs: "voyage", wins: "guardian", rescued: "word", stars: "star", mastered: "word" };
    return `${verbs[k] || "Reach"} ${v} ${nouns[k] || ""}${v === 1 ? "" : "s"}`;
  }

  function openDeparture() {
    let selVessel = state.meta.vessel || "miftah";
    let selKeepsake = state.meta.equippedKeepsake || null;
    const rootFamilies = SN.rootFamilies().filter((family) => family.tier > 0);
    let selRoot = rootFamilies.some((family) => family.root === state.meta.attunedRoot)
      ? state.meta.attunedRoot
      : null;

    const vesselCard = (v) => {
      const unlocked = SN.vesselUnlocked(v);
      const cr = v.crew ? C.crew.find((c) => c.id === v.crew) : null;
      return `<button type="button" class="dep-vessel-card${unlocked ? "" : " locked"}${selVessel === v.id ? " sel" : ""}" data-vessel="${v.id}" aria-pressed="${selVessel === v.id}" ${unlocked ? "" : "disabled"}>
        <span class="dep-vessel-art">${C.shipSVG({}, [], v.id)}</span>
        <span class="dep-vessel-name">${esc(v.name)}${v.meaning ? `<span class="dep-vessel-meaning">${esc(v.meaning)}</span>` : ""}</span>
        <span class="dep-vessel-role">${esc(v.role || "Balanced")}</span>
        <span class="dep-vessel-desc">${unlocked ? esc(v.desc) : `${cr ? esc(cr.name) : "The crew"}'s story continues…`}</span>
        ${unlocked ? `<span class="dep-vessel-stats">${(v.stats || []).map((stat) => `<i>${esc(stat)}</i>`).join("")}</span>` : ""}
      </button>`;
    };
    const keepsakeChip = (r) => {
      const unlocked = SN.keepsakeUnlocked(r);
      return `<button type="button" class="dep-keepsake-chip${unlocked ? "" : " locked"}${selKeepsake === r.id ? " sel" : ""}" data-keepsake="${r.id}" aria-pressed="${selKeepsake === r.id}" ${unlocked ? "" : "disabled"} title="${esc(r.desc)}">
        <span class="dep-keepsake-icon">${r.icon}</span>
        <span class="dep-keepsake-name">${unlocked ? esc(r.name) : keepsakeHint(r)}</span>
      </button>`;
    };

    const rootChoice = (family) => `
      <button type="button" class="dep-root-chip${selRoot === family.root ? " sel" : ""}" data-root-choice="${esc(family.root)}" aria-pressed="${selRoot === family.root}">
        <span class="dep-root-letters ar" lang="ar">${esc([...family.root].join(" · "))}</span>
        <span>Bearing ${["", "I", "II", "III"][family.tier]}</span>
      </button>`;

    function summaryHTML() {
      const vessel = C.vessels.find((candidate) => candidate.id === selVessel) || C.vessels[0];
      const keepsake = C.relics.find((candidate) => candidate.id === selKeepsake) || null;
      const rootFamily = rootFamilies.find((family) => family.root === selRoot) || null;
      const aligned = !!(vessel.crew && keepsake?.crew === vessel.crew);
      return `<div class="loadout-summary-head"><span>Your strategy</span><b>${esc(vessel.role || "Balanced")}</b></div>
        <div class="loadout-summary-grid">
          <span>${C.icons.hull}<b>${vessel.hull} health</b></span>
          <span>${C.icons.current}<b>${esc((vessel.stats || [])[1] || "balanced handling")}</b></span>
        </div>
        <p><b>${esc(vessel.name)}</b> — ${esc(vessel.desc)}</p>
        <p><b>${keepsake ? esc(keepsake.name) : "No keepsake"}</b> — ${keepsake ? esc(keepsake.desc) : "No extra fitting; keep the ship simple."}</p>
        <p><b>${rootFamily ? `Root ${esc([...rootFamily.root].join(" · "))}` : "Open sky"}</b> — ${rootFamily ? esc(SN.rootPerks[rootFamily.tier]) : "No root-specific combat bonus."}</p>
        ${aligned ? `<div class="loadout-synergy">✦ Crew alignment — a matching ship and keepsake add one extra starting current.</div>` : ""}`;
    }

    const sheet = SN.overlay(`
      <div class="sheet-grab"></div>
      <button class="sheet-close" data-close aria-label="Close">✕</button>
      <h2>Ready the ship</h2>
      <p class="sheet-sub">Choose your ship and keepsake before setting off.</p>
      <div class="dep-section-label">Ship</div>
      <div class="dep-vessel-row">${C.vessels.map(vesselCard).join("")}</div>
      <div class="dep-section-label">Keepsake</div>
      <div class="dep-keepsake-row">
        <button type="button" class="dep-keepsake-chip${selKeepsake === null ? " sel" : ""}" data-keepsake="" aria-pressed="${selKeepsake === null}">
          <span class="dep-keepsake-icon">${C.icons.anchor}</span>
          <span class="dep-keepsake-name">None</span>
        </button>
        ${C.relics.filter((r) => r.keepsake).map(keepsakeChip).join("")}
      </div>
      <div class="dep-section-label">Root bearing</div>
      <p class="dep-section-help">Attuned words gain the listed constellation bonus during this voyage.</p>
      <div class="dep-root-row">
        <button type="button" class="dep-root-chip${selRoot === null ? " sel" : ""}" data-root-choice="" aria-pressed="${selRoot === null}">
          <span class="dep-root-letters">✦</span><span>Open sky</span>
        </button>
        ${rootFamilies.map(rootChoice).join("")}
      </div>
      ${rootFamilies.length ? "" : `<p class="dep-root-empty">Chart three dictionary forms from one root family to unlock a bearing.</p>`}
      <div class="loadout-summary panel" id="loadout-summary">${summaryHTML()}</div>
      <div class="sum-actions">
        <button class="btn btn-gold btn-big" data-cast>Cast off ⛵</button>
      </div>`);

    $("[data-close]", sheet).onclick = () => SN.closeOverlay();

    function refreshSel() {
      $$("[data-vessel]", sheet).forEach((b) => {
        const selected = b.dataset.vessel === selVessel;
        b.classList.toggle("sel", selected);
        b.setAttribute("aria-pressed", String(selected));
      });
      $$("[data-keepsake]", sheet).forEach((b) => {
        const selected = (b.dataset.keepsake || null) === selKeepsake;
        b.classList.toggle("sel", selected);
        b.setAttribute("aria-pressed", String(selected));
      });
      $$("[data-root-choice]", sheet).forEach((b) => {
        const selected = (b.dataset.rootChoice || null) === selRoot;
        b.classList.toggle("sel", selected);
        b.setAttribute("aria-pressed", String(selected));
      });
      const summary = $("#loadout-summary", sheet);
      if (summary) summary.innerHTML = summaryHTML();
    }
    sheet.querySelectorAll("[data-vessel]").forEach((b) => {
      b.onclick = () => {
        if (b.disabled) return;
        SN.audio.click();
        selVessel = b.dataset.vessel;
        state.meta.vessel = selVessel;
        SN.saveMeta();
        refreshSel();
      };
    });
    sheet.querySelectorAll("[data-keepsake]").forEach((b) => {
      b.onclick = () => {
        if (b.disabled) return;
        SN.audio.click();
        selKeepsake = b.dataset.keepsake || null;
        state.meta.equippedKeepsake = selKeepsake;
        SN.saveMeta();
        refreshSel();
      };
    });
    sheet.querySelectorAll("[data-root-choice]").forEach((b) => {
      b.onclick = () => {
        SN.audio.click();
        selRoot = b.dataset.rootChoice || null;
        state.meta.attunedRoot = selRoot;
        SN.saveMeta();
        refreshSel();
      };
    });
    $("[data-cast]", sheet).onclick = () => { SN.audio.click(); SN.closeOverlay(); SN.startRun(); };
  }

  // ---------------------------------------------------------------- dialogue
  function openDialogue(crewId) {
    const cr = C.crew.find((c) => c.id === crewId);
    const cs = state.meta.crew[crewId];
    const lines = [];
    let advancesBeat = false;

    if (state.meta.lastRun && cs.reactSeen !== state.meta.lastRun.id) {
      const lr = state.meta.lastRun;
      const pool =
        (lr.flawless && cr.reactive.flawless) ? cr.reactive.flawless :
        (lr.rescued >= 3 && cr.reactive.rescued) ? cr.reactive.rescued :
        lr.outcome === "victory" ? cr.reactive.victory : cr.reactive.defeat;
      lines.push({ s: crewId, t: pick(pool) });
      cs.reactSeen = lr.id;
    }
    const beat = nextBeat(crewId);
    if (beat) { lines.push(...beat.lines); advancesBeat = true; }
    if (!lines.length) lines.push({ s: crewId, t: pick(IDLE[crewId]) });

    let ix = 0;
    SN.render(`
      <div class="dlg-scene dlg-scene-${crewId}">
        <div class="dlg-bg" aria-hidden="true">
          <span class="dlg-grid"></span>
          <span class="dlg-moon"></span>
          <span class="dlg-starscape"></span>
          ${dialogueMotifs[crewId] || ""}
        </div>
        <button class="dlg-back" data-dlg-back aria-label="Return to harbor">‹ Harbor</button>
        <div class="dlg-scene-copy">
          <div class="dlg-kicker">Harbor conversation</div>
          <h1>${esc(cr.name)}</h1>
          <p>${esc(cr.title)} · ${esc(cr.school)}</p>
        </div>
        <div class="dlg-character" aria-hidden="true">
          <img src="${dialogueArt(crewId)}" alt="" />
          <div class="dlg-character-fallback">${cr.portrait}</div>
        </div>
        <div class="dlg-card panel">
          <div class="dlg-speaker" id="dlg-speaker"></div>
          <div class="dlg-text" id="dlg-text"></div>
          <div class="dlg-controls">
            <span class="dlg-progress" id="dlg-progress"></span>
            <button class="btn btn-gold dlg-next" data-dlg-next>Continue</button>
          </div>
        </div>
      </div>`);

    function showLine() {
      const ln = lines[ix];
      const isYou = ln.s === "you";
      const speaker = isYou ? "You" : C.crew.find((c) => c.id === ln.s)?.name || ln.s;
      const scene = $(".dlg-scene");
      scene.classList.toggle("dlg-you-line", isYou);
      scene.classList.toggle("dlg-crew-line", !isYou);
      $("#dlg-speaker").textContent = speaker;
      $("#dlg-speaker").classList.toggle("you", isYou);
      $("#dlg-text").innerHTML = esc(ln.t).replace(/([؀-ۿ][؀-ۿ\s]*[؀-ۿ])/g, '<span class="ar">$1</span>');
      $("#dlg-progress").textContent = `${ix + 1} / ${lines.length}`;
    }
    function finishDialogue({ complete }) {
      const oldBeat = cs.beat;
      if (complete && advancesBeat) cs.beat++;
      if (cs.beat > oldBeat) {
        const unlocked = C.vessels.find((v) => v.crew === crewId && v.unlockBeat > oldBeat && v.unlockBeat <= cs.beat);
        if (unlocked) {
          SN.audio.tierUp();
          SN.toast(`<b>${esc(cr.name)}'s trust</b> — the ${esc(unlocked.name)} waits at the dock ✦`);
        }
      }
      SN.saveMeta();
      SN.goHarbor(); // refresh story badges
    }
    function nextLine() {
      SN.audio.click();
      ix++;
      if (ix < lines.length) { showLine(); return; }
      finishDialogue({ complete: true });
    }
    showLine();
    $("[data-dlg-next]").onclick = nextLine;
    $(".dlg-card").onclick = (e) => { if (!e.target.closest("button")) nextLine(); };
    $("[data-dlg-back]").onclick = () => { SN.audio.click(); finishDialogue({ complete: false }); };
    // Persist the reactive-seen mark even if they close by tapping outside.
    SN.saveMeta();
  }

  // ---------------------------------------------------------------- star map
  function openStarMap() {
    const m = SN.metrics();
    const litFor = (con) => Math.max(0, Math.min(con.stars.length, Math.floor((m[con.metric] || 0) / con.per)));
    const svg = `
      <svg viewBox="0 0 360 430" xmlns="http://www.w3.org/2000/svg">
        ${[...Array(40)].map(() => { const x = Math.random() * 360, y = Math.random() * 430; return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="0.7" fill="#cfe0ff" opacity="${(0.15 + Math.random() * 0.3).toFixed(2)}"/>`; }).join("")}
        ${C.constellations.map((con) => {
          const lit = litFor(con);
          const linesSvg = con.lines
            .filter(([a, b]) => a < lit && b < lit)
            .map(([a, b]) => `<path class="sm-line" d="M${con.stars[a].x} ${con.stars[a].y} L${con.stars[b].x} ${con.stars[b].y}"/>`).join("");
          const starsSvg = con.stars.map((s, i) => `
            <circle class="sm-star${i < lit ? " lit" : ""}" cx="${s.x}" cy="${s.y}" r="${i < lit ? 3.4 : 2.2}"/>
            ${s.name && i < lit ? `<text class="sm-name" x="${s.x + 6}" y="${s.y - 5}">${s.name}</text>` : ""}`).join("");
          return `<g data-con="${con.id}">${linesSvg}${starsSvg}
            <text class="sm-name ${lit ? "" : "dimname"}" x="${con.cx}" y="${con.cy + 62}" text-anchor="middle">${con.name}</text>
            <rect class="sm-hit" x="${con.cx - 68}" y="${con.cy - 66}" width="136" height="140" data-conhit="${con.id}" role="button" tabindex="0" aria-label="${esc(con.name)} constellation"/></g>`;
        }).join("")}
      </svg>`;

    const sheet = SN.overlay(`
      <div class="sheet-grab"></div>
      <button class="sheet-close" data-close aria-label="Close">✕</button>
      <h2>The Charted Sky</h2>
      <p class="sheet-sub">Constellations kindle as you sail, master, and rescue words. Tap one for its story.</p>
      <div class="starmap-svg-holder">${svg}</div>
      <div class="sm-lore panel" id="sm-lore">The sky remembers what you remember. <span class="ar">الثريا</span>, the Seven Sisters, wait at the heart of the reach.</div>`);

    $("[data-close]", sheet).onclick = () => SN.closeOverlay();
    sheet.querySelectorAll("[data-conhit]").forEach((r) => {
      const showLore = () => {
        const con = C.constellations.find((c) => c.id === r.dataset.conhit);
        const lit = litFor(con);
        SN.audio.click();
        $("#sm-lore", sheet).innerHTML = `${con.lore}<div class="sm-progress">${lit} / ${con.stars.length} stars — one per ${con.per > 1 ? con.per + " " : ""}${con.unit}.</div>`;
      };
      r.onclick = showLore;
      r.onkeydown = (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        showLore();
      };
    });
  }
  SN.openStarMap = openStarMap;

  // ------------------------------------------------------------- word atlas
  // Every word met so far, grouped by surah/ayah, tier-colored by mastery.
  // An ayah with every word unlocked gets a golden halo — the sign that it
  // can now surface as a "verse" encounter on the voyage chart.
  function tierClass(card) {
    if (!card) return "atlas-unseen";
    if (isMastered(card)) return "atlas-mastered";
    return "atlas-seen";
  }

  async function openAtlas() {
    // The deck may hold progress from surahs not yet fetched this session
    // (e.g. the player reloaded and hasn't sailed yet) — load those too, so
    // the Atlas always reflects real progress, not just this session's cache.
    const deckSurahs = new Set(cardsArr().map((c) => c.surah).filter((n) => n != null));
    const missing = [...deckSurahs].filter((n) => !ayahCache[n]);
    if (missing.length) {
      const sheet = SN.overlay(`<div class="sheet-grab"></div><p class="sheet-sub" style="text-align:center;padding:24px 0">Reading the stars…</p>`);
      try { await Promise.all(missing.map((n) => loadSurah(n))); } catch {}
      SN.closeOverlay();
    }
    renderAtlas();
  }

  function renderAtlas() {
    const surahs = SN.loadedSurahs();
    const recited = SN.versesCompletedCount();

    const surahHTML = surahs.map((n) => {
      const ayahNums = Object.keys(ayahCache[n] || {}).map(Number).sort((a, b) => a - b);
      const ayahsHTML = ayahNums.map((ayahNum) => {
        const a = SN.ayahData(n, ayahNum);
        const status = SN.ayahStatus(n, ayahNum);
        const key = `${n}:${ayahNum}`;
        const done = !!(state.meta.versesCompleted && state.meta.versesCompleted[key]);
        const wordsHTML = a.words.map((w) => {
          const card = state.deck[w.k];
          return `<span class="atlas-word ${tierClass(card)}" lang="ar">${esc(w.arabic)}</span>`;
        }).join("");
        return `
          <div class="atlas-ayah${status && status.complete ? " atlas-complete" : ""}${done ? " atlas-recited" : ""}">
            <div class="atlas-ayah-head">
              <span class="atlas-ayah-num">${ayahNum}</span>
              ${done ? `<span class="atlas-badge" title="Recited as a Star-Verse">✦</span>` : ""}
            </div>
            <div class="atlas-words">${wordsHTML}</div>
          </div>`;
      }).join("");
      return `
        <div class="atlas-surah panel">
          <div class="atlas-surah-name">Surah ${n}</div>
          <div class="atlas-ayah-list">${ayahsHTML}</div>
        </div>`;
    }).join("");

    const sheet = SN.overlay(`
      <div class="sheet-grab"></div>
      <button class="sheet-close" data-close aria-label="Close">✕</button>
      <h2>Word Atlas</h2>
      <p class="sheet-sub">Every word you've met, gathered by surah and ayah. A golden halo means an ayah is fully unlocked — ready to rise as a Star-Verse. <b class="gold-text">${recited} ayah${recited === 1 ? "" : "s"}</b> recited whole.</p>
      <div class="atlas-list">${surahHTML || `<p class="sheet-sub">Set sail to start charting the sky.</p>`}</div>`);

    $("[data-close]", sheet).onclick = () => SN.closeOverlay();
  }
  SN.openAtlas = openAtlas;

  // ---------------------------------------------------------------- upgrades
  SN.baseMods = () => {
    const vessel = C.vessels.find((v) => v.id === (state.meta.vessel || "miftah")) || C.vessels[0];
    const mods = { hullMax: vessel.hull, dmgMult: 1, timeScale: 1, pearlMult: 1, shieldPerEnc: 0, restBonus: 0, graceMs: 0 };
    for (const u of C.upgrades) {
      const tier = state.meta.upgrades[u.id] || 0;
      if (!tier) continue;
      const m = u.mod(tier);
      if (m.hullMax) mods.hullMax += m.hullMax;
      if (m.dmgMult) mods.dmgMult *= m.dmgMult;
      if (m.pearlMult) mods.pearlMult *= m.pearlMult;
      if (m.startBoon) mods.startBoon = 1;
      if (m.foresight) mods.foresight = 1;
      if (m.restFull) mods.restFull = 1;
    }
    return mods;
  };

  function openUpgrades() {
    const m = state.meta;
    const upgradeEffects = {
      hull: [{ icon: C.icons.hull, label: "max hull" }],
      lantern: [{ icon: C.icons.lanternFit, label: "starting boon" }],
      keel: [{ icon: C.icons.harpoon, label: "damage" }],
      satchel: [{ icon: C.icons.pearl, label: "more pearls" }],
      glass: [{ icon: C.icons.eye, label: "reveal routes" }],
      hearth: [{ icon: C.icons.hearth, label: "full haven rest" }],
    };
    const effectHTML = (u) => (upgradeEffects[u.id] || [])
      .map((e) => `<span class="u-effect">${e.icon}<span>${esc(e.label)}</span></span>`)
      .join("");
    const rows = C.upgrades.map((u) => {
      const tier = m.upgrades[u.id] || 0;
      const next = u.tiers[tier];
      const maxed = !next;
      const showDesc = maxed ? u.tiers[tier - 1].desc : next.desc;
      return `
        <div class="upg-card panel upg-${u.id}">
          <span class="u-icon">${u.icon}</span>
          <span style="min-width:0">
            <div class="u-name">${u.name}${u.tiers.length > 1 ? ` <span style="color:var(--muted);font-weight:600">${"◆".repeat(tier)}${"◇".repeat(u.tiers.length - tier)}</span>` : ""}</div>
            <div class="u-desc">${showDesc}</div>
            <div class="u-effects">${effectHTML(u)}</div>
          </span>
          ${maxed
            ? '<span class="u-owned">FITTED</span>'
            : `<button class="btn btn-gold u-buy" data-buy="${u.id}" ${m.pearls < next.cost ? "disabled" : ""}>${next.cost} ◉</button>`}
        </div>`;
    }).join("");

    const sheet = SN.overlay(`
      <div class="sheet-grab"></div>
      <button class="sheet-close" data-close aria-label="Close">✕</button>
      <h2>The Shipwright</h2>
      <p class="sheet-sub">Pearls worked into permanent fittings for every vessel. Choose the vessel itself when you depart. Balance: <b class="gold-text">${m.pearls} pearls</b>.</p>
      <div class="upg-list">${rows}</div>`);

    $("[data-close]", sheet).onclick = () => SN.closeOverlay();
    sheet.querySelectorAll("[data-buy]").forEach((b) => {
      b.onclick = () => {
        const u = C.upgrades.find((x) => x.id === b.dataset.buy);
        const tier = m.upgrades[u.id] || 0;
        const cost = u.tiers[tier].cost;
        if (m.pearls < cost) return;
        m.pearls -= cost;
        m.upgrades[u.id] = tier + 1;
        SN.saveMeta();
        SN.audio.boon();
        SN.toast(`${u.name} fitted to the ship`);
        openUpgrades();
        const hudPearls = $("[data-hud-pearls] .pearl-n");
        if (hudPearls) hudPearls.textContent = m.pearls;
      };
    });
  }
  SN.openUpgrades = openUpgrades;

  // -------------------------------------------------------------------- boot
  document.addEventListener("DOMContentLoaded", () => {
    startSky();
    loadProfiles();
    if (state.activeId && activateProfile(state.activeId)) SN.goHarbor();
    else renderProfiles();
  });
})();
