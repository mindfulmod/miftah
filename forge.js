"use strict";

/*
 * Memory Forge — a roguelite deckbuilder that runs on the trainer's save data.
 *
 * The conceit: your memory is the arsenal. Every word you've met in the
 * word-by-word trainer exists here as a card, and the card's level is read
 * straight from the FSRS memory model the review screen maintains — a memory
 * stable for weeks is a high-level card, a memory about to lapse is a cracked
 * one. Words that are due (or barely known) turn "hazy": playing them asks you
 * to actually recall their meaning, and a correct recall makes the card strike
 * twice. Losing a run points at the exact words that failed you, with a link
 * into the review forge. The game never writes trainer state — it only reads
 * it — so the single source of truth for learning stays the trainer.
 *
 * Storage read (written by trainer/review pages):
 *   quran-trainer:stats:surah-N   { wordId: {arabic, english, display,
 *                                   translit, root, audioPath, miss, correct} }
 *   quran-trainer:review:surah-N  { deck: [FSRS cards keyed by same wordId] }
 *   quran-trainer:streak          { count, lastDate }
 *   quran-trainer:session         { date, count } (5 ayahs = daily goal)
 * Storage owned by this page:
 *   quran-trainer:forge           { embers, sigils, tierWins, rescuedTotal, runs }
 */

// ---------------------------------------------------------------- constants

const FORGE_KEY = "quran-trainer:forge";
const STREAK_KEY = "quran-trainer:streak";
const SESSION_KEY = "quran-trainer:session";
const SESSION_GOAL_AYAHS = 5; // must match app.js

// Same stability ladder as the review board: dots fill as memory strengthens.
const STABILITY_TIERS = [1, 2, 4, 8, 16, 21];
const MAX_LEVEL = 7;

const START_HP = 30;
const ENERGY_PER_TURN = 3;
const HAND_SIZE = 5;
const RUN_DECK_SIZE = 16;
const MIN_DECK_SIZE = 10;
const HAZY_QUOTA = 4; // weak memories are deliberately drafted in — they need the exercise
const STAGE_HEAL = 6;

const TIERS = [
  {
    id: 0,
    name: "The Whisper",
    desc: "A thin mist tests the edge of your memory.",
  },
  {
    id: 1,
    name: "The Fog",
    desc: "Heavier forgetting. Bring stronger words.",
  },
  {
    id: 2,
    name: "The Blank Page",
    desc: "Where unrehearsed memories go. Mastered words shine here.",
  },
];

// Enemy scripts loop; `charge` telegraphs the big hit that follows it.
// Stats are fixed per tier — your power comes from learning, not from grinding
// the game, so a wall here is a nudge back into the trainer, by design.
const ENEMIES = [
  [
    { name: "Smudge", sprite: "smudge", hp: 14, script: [
      { k: "attack", n: 4 }, { k: "attack", n: 5 }, { k: "block", n: 4 },
    ] },
    { name: "Hollow", sprite: "hollow", hp: 20, script: [
      { k: "hex" }, { k: "attack", n: 6 }, { k: "attack", n: 5 },
    ] },
    { name: "The Fog", sprite: "fogboss", hp: 34, boss: true, script: [
      { k: "hex" }, { k: "attack", n: 6 }, { k: "charge" }, { k: "attack", n: 11 },
    ] },
  ],
  [
    { name: "Deep Smudge", sprite: "smudge", tint: "deep", hp: 22, script: [
      { k: "attack", n: 6 }, { k: "block", n: 5 }, { k: "attack", n: 7 },
    ] },
    { name: "Static", sprite: "static", hp: 27, script: [
      { k: "hex" }, { k: "attack", n: 7 }, { k: "attack", n: 8 },
    ] },
    { name: "The Eraser", sprite: "eraser", hp: 48, boss: true, script: [
      { k: "block", n: 8 }, { k: "attack", n: 9 }, { k: "hex" },
      { k: "charge" }, { k: "attack", n: 14 },
    ] },
  ],
  [
    { name: "Night Static", sprite: "static", tint: "deep", hp: 30, script: [
      { k: "attack", n: 8 }, { k: "hex" }, { k: "attack", n: 9 },
    ] },
    { name: "Deep Hollow", sprite: "hollow", tint: "deep", hp: 36, script: [
      { k: "block", n: 8 }, { k: "attack", n: 10 }, { k: "hex" },
    ] },
    { name: "The Blank Page", sprite: "page", hp: 62, boss: true, script: [
      { k: "hex" }, { k: "attack", n: 10 }, { k: "block", n: 10 },
      { k: "charge" }, { k: "attack", n: 16 },
    ] },
  ],
];

const SIGILS = [
  { id: "lamp", ico: "🪔", name: "Oil Lamp", desc: "+6 max HP, always.", cost: 30 },
  { id: "pen", ico: "🖋", name: "Reed Pen", desc: "Draw +1 card at the start of each battle.", cost: 50 },
  { id: "mihrab", ico: "🕌", name: "Mihrab", desc: "Heal 4 extra after every battle you win.", cost: 60 },
  { id: "inkwell", ico: "🏺", name: "Inkwell", desc: "+1 energy on the first turn of each battle.", cost: 90 },
];

// A taste of Al-Fatihah for brand-new players: enough cards to fight the first
// tier before a single trainer session, each one a real word with real audio.
const STARTER_WORDS = [
  { arabic: "بِسْمِ", english: "In (the) name", translit: "bis'mi", root: "سمو", audioPath: "wbw/001_001_001.mp3" },
  { arabic: "ٱللَّهِ", english: "(of) Allah", translit: "l-lahi", root: "أله", audioPath: "wbw/001_001_002.mp3" },
  { arabic: "ٱلرَّحْمَـٰنِ", english: "the Most Gracious", translit: "l-raḥmāni", root: "رحم", audioPath: "wbw/001_001_003.mp3" },
  { arabic: "ٱلرَّحِيمِ", english: "the Most Merciful", translit: "l-raḥīmi", root: "رحم", audioPath: "wbw/001_001_004.mp3" },
  { arabic: "ٱلْحَمْدُ", english: "All praises and thanks", translit: "al-ḥamdu", root: "حمد", audioPath: "wbw/001_002_001.mp3" },
  { arabic: "لِلَّهِ", english: "(be) to Allah", translit: "lillahi", root: "أله", audioPath: "wbw/001_002_002.mp3" },
  { arabic: "رَبِّ", english: "Lord", translit: "rabbi", root: "ربب", audioPath: "wbw/001_002_003.mp3" },
  { arabic: "ٱلْعَـٰلَمِينَ", english: "of the worlds", translit: "l-ʿālamīna", root: "علم", audioPath: "wbw/001_002_004.mp3" },
  { arabic: "إِيَّاكَ", english: "You Alone", translit: "iyyāka", root: "", audioPath: "wbw/001_005_001.mp3" },
  { arabic: "نَعْبُدُ", english: "we worship", translit: "naʿbudu", root: "عبد", audioPath: "wbw/001_005_002.mp3" },
];

// ---------------------------------------------------------------- helpers

const $ = (id) => document.getElementById(id);

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const glossKey = (g) =>
  (g || "").toLowerCase().replace(/[()[\].,;:!?'"-]/g, "").replace(/\s+/g, " ").trim();

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : fallback;
  } catch {
    return fallback;
  }
};

// Word audio, same shared module (and CDN) the trainer uses. Silent stub if
// the script failed to load — sound is a gift, never a blocker.
const recite =
  window.MiftahGame && window.MiftahGame.RecitationAudio
    ? new window.MiftahGame.RecitationAudio()
    : { playWord() {}, stop() {} };

// ------------------------------------------------------------- tiny synth

// A few soft square-wave blips for hits and chimes; nothing loads, nothing
// blocks, and iOS autoplay rules are respected by lazily creating the context
// on the first user gesture.
const synth = (() => {
  let ctx = null;
  const ensure = () => {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  };
  function tone(freq, dur, type, gainV, when = 0) {
    const c = ensure();
    if (!c) return;
    const t = c.currentTime + when;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gainV, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  return {
    thud() { tone(95, 0.16, "square", 0.11); tone(60, 0.2, "sine", 0.12); },
    guard() { tone(220, 0.1, "triangle", 0.09); tone(330, 0.12, "triangle", 0.06, 0.04); },
    chime() { tone(660, 0.14, "sine", 0.07); tone(990, 0.2, "sine", 0.05, 0.06); },
    spark() { tone(880, 0.09, "square", 0.05); tone(1320, 0.12, "square", 0.04, 0.05); },
    hurt() { tone(140, 0.22, "sawtooth", 0.09); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, "triangle", 0.08, i * 0.11)); },
    lose() { [330, 262, 196].forEach((f, i) => tone(f, 0.3, "sine", 0.09, i * 0.16)); },
  };
})();

// ------------------------------------------------- reading the trainer save

// One merged collection across all surahs. The same word form met in several
// surahs collapses into one card (summed exposures); FSRS state, when the word
// has ever been missed and reviewed, wins over exposure counting.
function loadCollection() {
  const byId = new Map();
  const fsrsById = new Map();

  for (const key of Object.keys(localStorage)) {
    let m = key.match(/^quran-trainer:review:surah-(\d+)$/);
    if (m) {
      const saved = readJSON(key, null);
      const simOffset = (saved && saved.simOffset) || 0;
      for (const c of (saved && saved.deck) || []) {
        if (!c || typeof c.stability !== "number") continue;
        const prev = fsrsById.get(c.id);
        if (!prev || (c.stability || 0) > (prev.stability || 0)) {
          fsrsById.set(c.id, { ...c, surah: Number(m[1]), simOffset });
        }
      }
      continue;
    }
    m = key.match(/^quran-trainer:stats:surah-(\d+)$/);
    if (!m) continue;
    const surah = Number(m[1]);
    const stats = readJSON(key, {});
    for (const [id, s] of Object.entries(stats)) {
      if (!s || !s.arabic) continue;
      const prev = byId.get(id);
      if (prev) {
        prev.miss += s.miss || 0;
        prev.correct += s.correct || 0;
        prev.surahs.push(surah);
      } else {
        byId.set(id, {
          id,
          arabic: s.arabic,
          english: s.english || "",
          display: s.display || s.english || "",
          translit: s.translit || "",
          root: s.root || "",
          audioPath: s.audioPath || "",
          miss: s.miss || 0,
          correct: s.correct || 0,
          surahs: [surah],
        });
      }
    }
  }

  const words = [];
  for (const w of byId.values()) {
    const f = fsrsById.get(w.id);
    words.push(decorateWord(w, f || null));
  }
  return words;
}

// Attach everything the game derives from a word: FSRS strength, level, type.
function decorateWord(w, f) {
  const now = Date.now() + ((f && f.simOffset) || 0);
  let level;
  let retr = 1;
  let due = false;

  if (f && typeof f.stability === "number") {
    const dots = STABILITY_TIERS.filter((t) => f.stability >= t).length;
    level = Math.min(MAX_LEVEL, 1 + dots);
    const elapsedDays = Math.max(0, (now - (f.lastReview ?? now)) / FSRS.DAY);
    retr = FSRS.retrievability(elapsedDays, f.stability);
    due = (f.due || 0) <= now;
  } else {
    // Never missed → never entered the review deck. Exposure builds a card up
    // to level 3; real mastery (4+) only comes from the review forge.
    level = 1 + Math.min(2, Math.floor((w.correct || 0) / 3));
  }

  const hazy = f ? due || retr < 0.75 : (w.correct || 0) <= 1;

  const h = hashStr(w.id);
  const roll = h % 20;
  const type = roll < 9 ? "strike" : roll < 16 ? "ward" : "charm";
  const charmKind = ["insight", "mend", "dim"][(h >>> 5) % 3];

  return Object.assign(w, {
    fsrs: f,
    level,
    retr,
    hazy,
    type,
    charmKind,
    reviewSurah: f ? f.surah : null,
  });
}

function starterCards(existing) {
  const have = new Set(existing.map((w) => w.arabic));
  return STARTER_WORDS.filter((s) => !have.has(s.arabic)).map((s) =>
    decorateWord(
      {
        id: `${s.arabic}|||${s.english}`,
        arabic: s.arabic,
        english: s.english,
        display: s.english,
        translit: s.translit,
        root: s.root,
        audioPath: s.audioPath,
        miss: 0,
        correct: 0,
        surahs: [1],
        starter: true,
      },
      null
    )
  );
}

function loadBoons() {
  const streak = readJSON(STREAK_KEY, {});
  const session = readJSON(SESSION_KEY, {});
  const streakCount = streak.count || 0;
  const streakOn = streakCount >= 3;
  const wirdOn = session.date === todayStr() && (session.count || 0) >= SESSION_GOAL_AYAHS;
  return {
    streakCount,
    streakOn,
    streakHp: streakCount >= 7 ? 8 : streakOn ? 4 : 0,
    wirdOn,
  };
}

function loadForge() {
  const d = readJSON(FORGE_KEY, {});
  return {
    embers: d.embers || 0,
    sigils: d.sigils || {},
    tierWins: Array.isArray(d.tierWins) ? d.tierWins : [0, 0, 0],
    rescuedTotal: d.rescuedTotal || 0,
    runs: d.runs || 0,
  };
}

function saveForge() {
  try {
    localStorage.setItem(FORGE_KEY, JSON.stringify(forge));
  } catch {}
}

// ------------------------------------------------------------- card effects

function baseEffect(card) {
  const L = card.level;
  switch (card.type) {
    case "strike":
      return { verb: "Deal", n: 3 + L, suffix: "damage" };
    case "ward":
      return { verb: "Gain", n: 3 + L, suffix: "block" };
    case "charm":
      if (card.charmKind === "insight") return { verb: "Draw", n: L >= 5 ? 3 : 2, suffix: "cards" };
      if (card.charmKind === "mend") return { verb: "Heal", n: 2 + Math.ceil(L / 2), suffix: "HP" };
      return { verb: "Dim", n: 2 + Math.ceil(L / 2), suffix: "next attack" };
    default:
      return { verb: "", n: 0, suffix: "" };
  }
}

function effectLabel(card) {
  if (card.type === "fog") return "Recall to dispel";
  const e = baseEffect(card);
  return `${e.verb} ${e.n} ${e.suffix}`;
}

// ---------------------------------------------------------------- state

let collection = [];
let boons = loadBoons();
let forge = loadForge();

let run = null; // { tier, stage, deck, rescued:Set, embersEarned, weakSeen }
let battle = null; // per-fight state

// ---------------------------------------------------------------- home

function show(screen) {
  for (const id of ["screen-home", "screen-battle", "screen-result"]) {
    $(id).hidden = id !== screen;
  }
}

function renderCardEl(card, opts = {}) {
  const el = document.createElement("div");
  el.className = `card type-${card.type}`;
  if (card.hazy && card.type !== "fog") el.classList.add("hazy");
  if (card.type === "fog") el.classList.add("fog-card");
  if (opts.resonant) el.classList.add("resonant");

  if (card.type !== "fog") {
    const cost = document.createElement("span");
    cost.className = "card-cost";
    cost.textContent = "1";
    el.appendChild(cost);
  }

  if (card.root) {
    const root = document.createElement("span");
    root.className = "card-root";
    root.lang = "ar";
    root.textContent = card.root;
    el.appendChild(root);
  }

  const ar = document.createElement("div");
  ar.className = "card-arabic";
  ar.lang = "ar";
  ar.textContent = card.type === "fog" ? "؟" : card.arabic;
  el.appendChild(ar);

  // In battle the card face never gives the meaning away — Arabic and
  // transliteration only, so every play is a retrieval attempt (the meaning is
  // revealed after the card resolves). The home arsenal is for browsing, so
  // there the gloss shows.
  const gloss = document.createElement("div");
  gloss.className = "card-gloss";
  gloss.textContent =
    card.type === "fog"
      ? "Fog of Forgetting"
      : opts.inHand
        ? card.translit || "‌"
        : card.english;
  el.appendChild(gloss);

  const eff = document.createElement("div");
  eff.className = "card-effect";
  eff.textContent = effectLabel(card);
  el.appendChild(eff);

  if (card.type !== "fog") {
    const pips = document.createElement("div");
    pips.className = "card-pips";
    for (let i = 1; i <= MAX_LEVEL; i++) {
      const p = document.createElement("span");
      p.className = "card-pip" + (i <= card.level ? (card.level >= MAX_LEVEL ? " on max" : " on") : "");
      pips.appendChild(p);
    }
    el.appendChild(pips);
  }

  if (card.hazy && card.type !== "fog") {
    const tag = document.createElement("span");
    tag.className = "card-haze-tag";
    tag.textContent = "recall ×2";
    el.appendChild(tag);
  }
  return el;
}

function renderHome() {
  boons = loadBoons();
  collection = loadCollection();
  const starters = starterCards(collection);
  const usable = collection.length ? collection : starters;

  // arsenal stats
  const hazyCount = collection.filter((w) => w.hazy).length;
  const mastered = collection.filter((w) => w.level >= MAX_LEVEL).length;
  const avg = collection.length
    ? (collection.reduce((a, w) => a + w.level, 0) / collection.length).toFixed(1)
    : "—";
  $("arsenal-stats").innerHTML = "";
  const stats = [
    [`${collection.length}`, "cards forged"],
    [`${avg}`, "avg level"],
    [`${hazyCount}`, "hazy", "hazy"],
    [`${mastered}`, "mastered"],
    [`${forge.rescuedTotal}`, "rescues"],
  ];
  for (const [b, label, cls] of stats) {
    const s = document.createElement("span");
    s.className = "arsenal-stat" + (cls ? ` ${cls}` : "");
    s.innerHTML = `<b></b>`;
    s.querySelector("b").textContent = b;
    s.appendChild(document.createTextNode(label));
    $("arsenal-stats").appendChild(s);
  }

  // preview: strongest cards + a couple of hazy ones begging for recall
  const strong = usable
    .slice()
    .sort((a, b) => b.level - a.level || (b.correct || 0) - (a.correct || 0))
    .slice(0, 4);
  const hazies = usable.filter((w) => w.hazy && !strong.includes(w)).slice(0, 2);
  const preview = $("arsenal-preview");
  preview.innerHTML = "";
  for (const w of [...strong, ...hazies]) preview.appendChild(renderCardEl(w));

  const note = $("arsenal-note");
  if (!collection.length) {
    note.innerHTML =
      `You haven't trained yet, so the Forge lends you ten words of Al-Fatihah. ` +
      `<a href="trainer.html?surah=1">Learn them properly in the trainer</a> and they become yours — ` +
      `every new word is a new card.`;
  } else {
    note.innerHTML =
      `New words in the <a href="surahs.html">trainer</a> forge new cards. ` +
      `Reviews in the <a href="review.html">review forge</a> raise their level — ` +
      `a memory stable for 3 weeks is a mastered, radiant card.`;
  }

  // boons
  const list = $("boon-list");
  list.innerHTML = "";
  const boonRows = [
    {
      on: boons.streakOn,
      ico: "🔥",
      name: `Streak flame (+${boons.streakHp || 4} max HP)`,
      detail: boons.streakOn
        ? `${boons.streakCount}-day streak — burn bright.`
        : `Reach a 3-day trainer streak to light it. Streak now: ${boons.streakCount}.`,
    },
    {
      on: boons.wirdOn,
      ico: "📿",
      name: "Today's wird (+1 card each battle)",
      detail: boons.wirdOn
        ? "Daily session complete — your mind is warm."
        : `Finish today's ${SESSION_GOAL_AYAHS}-ayah session in the <a href="surahs.html">trainer</a> to earn it.`,
    },
  ];
  for (const b of boonRows) {
    const li = document.createElement("li");
    li.className = `boon ${b.on ? "on" : "off"}`;
    li.innerHTML = `<span class="boon-ico">${b.ico}</span><span><span class="boon-name">${b.name}</span><br>${b.detail}</span>`;
    list.appendChild(li);
  }

  // tiers
  const tierList = $("tier-list");
  tierList.innerHTML = "";
  TIERS.forEach((t, i) => {
    const locked = i > 0 && forge.tierWins[i - 1] === 0;
    const row = document.createElement("div");
    row.className = "tier-row" + (locked ? " locked" : "");
    const info = document.createElement("div");
    info.className = "tier-info";
    info.innerHTML = `<div class="tier-name">${t.name}</div><div class="tier-desc">${
      locked ? `Clear ${TIERS[i - 1].name} to unlock.` : t.desc
    }</div>`;
    row.appendChild(info);
    if (forge.tierWins[i] > 0) {
      const wins = document.createElement("span");
      wins.className = "tier-wins";
      wins.textContent = `✦ ${forge.tierWins[i]} win${forge.tierWins[i] === 1 ? "" : "s"}`;
      row.appendChild(wins);
    }
    const btn = document.createElement("button");
    btn.className = "primary-btn";
    btn.type = "button";
    btn.textContent = "Climb";
    btn.disabled = locked;
    btn.addEventListener("click", () => startRun(i));
    row.appendChild(btn);
    tierList.appendChild(row);
  });

  // sigils
  $("ember-count").textContent = `${forge.embers} embers`;
  const sigilList = $("sigil-list");
  sigilList.innerHTML = "";
  for (const s of SIGILS) {
    const owned = !!forge.sigils[s.id];
    const row = document.createElement("div");
    row.className = "sigil-row" + (owned ? " owned" : "");
    row.innerHTML = `<span class="sigil-ico">${s.ico}</span><span class="sigil-info"><span class="sigil-name">${s.name}</span><div class="sigil-desc">${s.desc}</div></span>`;
    if (owned) {
      const tag = document.createElement("span");
      tag.className = "sigil-owned-tag";
      tag.textContent = "Lit ✦";
      row.appendChild(tag);
    } else {
      const btn = document.createElement("button");
      btn.className = "ghost-btn small sigil-buy";
      btn.type = "button";
      btn.textContent = `${s.cost} embers`;
      btn.disabled = forge.embers < s.cost;
      btn.addEventListener("click", () => {
        if (forge.embers < s.cost) return;
        forge.embers -= s.cost;
        forge.sigils[s.id] = true;
        saveForge();
        synth.chime();
        renderHome();
      });
      row.appendChild(btn);
    }
    sigilList.appendChild(row);
  }

  show("screen-home");
}

// ---------------------------------------------------------------- run

function buildRunDeck() {
  const pool = collection.slice();
  // strongest first…
  pool.sort((a, b) => b.level - a.level || (b.correct || 0) - (a.correct || 0));
  let deck = pool.slice(0, RUN_DECK_SIZE);

  // …but guarantee some hazy words a seat: the forge tempers what is fading.
  const hazies = collection
    .filter((w) => w.hazy && !deck.includes(w))
    .sort((a, b) => (a.retr || 0) - (b.retr || 0));
  const want = Math.min(HAZY_QUOTA, hazies.length);
  const have = deck.filter((w) => w.hazy).length;
  for (let i = 0; i < want - have && deck.length; i++) {
    deck[deck.length - 1 - i] = hazies[i];
  }

  if (deck.length < MIN_DECK_SIZE) {
    deck = deck.concat(starterCards(deck).slice(0, MIN_DECK_SIZE - deck.length));
  }
  // battle instances get a uid so duplicates in hand stay distinct
  return deck.map((w, i) => ({ ...w, uid: `${w.id}#${i}` }));
}

function startRun(tier) {
  collection = loadCollection();
  boons = loadBoons();
  run = {
    tier,
    stage: 0,
    deck: buildRunDeck(),
    rescued: new Map(),
    embersEarned: 0,
    maxHp:
      START_HP + (boons.streakHp || 0) + (forge.sigils.lamp ? 6 : 0),
  };
  run.hp = run.maxHp;
  forge.runs += 1;
  saveForge();
  startBattle();
}

// ---------------------------------------------------------------- battle

function startBattle() {
  const tpl = ENEMIES[run.tier][run.stage];
  battle = {
    enemy: {
      ...tpl,
      hpMax: tpl.hp,
      hp: tpl.hp,
      block: 0,
      dim: 0,
      step: 0,
    },
    draw: shuffle(run.deck),
    discard: [],
    hand: [],
    exhausted: [],
    block: 0,
    energy: ENERGY_PER_TURN + (forge.sigils.inkwell ? 1 : 0),
    turn: 1,
    rootsThisTurn: new Set(),
    over: false,
  };
  const firstDraw =
    HAND_SIZE + (forge.sigils.pen ? 1 : 0) + (boons.wirdOn ? 1 : 0);
  drawCards(firstDraw);
  anim.reset(battle.enemy);
  show("screen-battle");
  $("battle-stage").textContent = `${TIERS[run.tier].name} — ${
    battle.enemy.boss ? "Boss" : `Battle ${run.stage + 1} of ${ENEMIES[run.tier].length}`
  }`;
  hint(
    battle.enemy.boss
      ? "The source of the fog itself. Recall doubles are your sharpest blade."
      : "Play cards with ✦ energy. Hazy cards ask for the meaning — recall it right for a ×2."
  );
  renderBattle();
}

function drawCards(n) {
  for (let i = 0; i < n; i++) {
    if (!battle.draw.length) {
      if (!battle.discard.length) return;
      battle.draw = shuffle(battle.discard);
      battle.discard = [];
    }
    battle.hand.push(battle.draw.pop());
  }
}

function intentFor(enemy) {
  const move = enemy.script[enemy.step % enemy.script.length];
  if (move.k === "attack") {
    const n = Math.max(0, move.n - enemy.dim);
    return { cls: "attack", label: `⚔️ ${n}${enemy.dim ? " (dimmed)" : ""}` };
  }
  if (move.k === "block") return { cls: "block", label: `🛡 ${move.n}` };
  if (move.k === "hex") return { cls: "hex", label: "☁ Hex — fogs your deck" };
  return { cls: "charge", label: "⚡ Gathering the fog…" };
}

function hint(text) {
  $("battle-hint").textContent = text || "";
}

function renderBattle() {
  const e = battle.enemy;
  $("enemy-name").textContent = e.name;
  const intent = intentFor(e);
  const chip = $("enemy-intent");
  chip.className = `intent-chip ${intent.cls}`;
  chip.textContent = intent.label;
  $("enemy-hp-fill").style.width = `${Math.max(0, (e.hp / e.hpMax) * 100)}%`;
  $("enemy-hp-label").textContent = `${Math.max(0, e.hp)} / ${e.hpMax}`;
  const blockChip = $("enemy-block");
  blockChip.hidden = !e.block;
  blockChip.textContent = `🛡 ${e.block}`;

  $("player-hp").textContent = `${run.hp} / ${run.maxHp}`;
  $("player-block").textContent = battle.block;
  $("player-energy").textContent = `${battle.energy}`;
  $("draw-count").textContent = `Draw ${battle.draw.length}`;
  $("discard-count").textContent = `Discard ${battle.discard.length}`;

  const hand = $("hand");
  hand.innerHTML = "";
  battle.hand.forEach((card, idx) => {
    const el = renderCardEl(card, {
      inHand: true,
      resonant: !!card.root && battle.rootsThisTurn.has(card.root),
    });
    if (card.type !== "fog" && battle.energy < 1) el.classList.add("unaffordable");
    el.addEventListener("click", () => onCardClick(idx));
    hand.appendChild(el);
  });

  $("end-turn-btn").disabled = battle.over;
}

let resolving = false; // one card at a time; recall modal is async

async function onCardClick(idx) {
  if (battle.over || resolving) return;
  const card = battle.hand[idx];
  if (!card) return;

  if (card.type === "fog") {
    if (card.attemptTurn === battle.turn) {
      hint("The fog resists — try again next turn.");
      return;
    }
    resolving = true;
    const word = pickRecallWord();
    const ok = await askRecall(word, "Dispel the fog — what does this mean?");
    if (ok) {
      battle.hand.splice(idx, 1);
      battle.exhausted.push(card);
      markRescue(word, true);
      drawCards(1);
      anim.wisp();
      synth.spark();
      hint("The fog dissolves. +1 card.");
    } else {
      card.attemptTurn = battle.turn;
      hint("It thickens… the meaning slipped away.");
    }
    resolving = false;
    renderBattle();
    checkEnd();
    return;
  }

  if (battle.energy < 1) {
    hint("Out of ✦ energy — end the turn.");
    return;
  }

  resolving = true;
  let mult = 1;
  if (card.hazy) {
    const ok = await askRecall(card, "Recall it to strike twice!");
    if (ok === true) {
      mult = 2;
      markRescue(card, true);
    }
  }
  battle.energy -= 1;
  battle.hand.splice(idx, 1);
  battle.discard.push(card);
  resolveCard(card, mult);
  // The reveal comes after the play: exposure without spoiling retrieval.
  hint(`${card.arabic} — “${card.english}”`);
  resolving = false;
  renderBattle();
  checkEnd();
}

function resolveCard(card, mult) {
  const e = battle.enemy;
  const eff = baseEffect(card);
  let total = eff.n * mult;

  // Root resonance: sibling words played in the same turn ring together.
  const resonant = !!card.root && battle.rootsThisTurn.has(card.root);
  if (resonant) total += Math.ceil(eff.n / 2);
  if (card.root) battle.rootsThisTurn.add(card.root);

  if (card.audioPath) recite.playWord(card.audioPath);

  if (card.type === "strike") {
    const soaked = Math.min(e.block, total);
    e.block -= soaked;
    e.hp -= total - soaked;
    anim.hitEnemy(total - soaked, mult > 1, resonant);
    synth.thud();
  } else if (card.type === "ward") {
    battle.block += total;
    anim.floatPlayer(`+${total} 🛡`, "#9cc3ee");
    synth.guard();
  } else if (card.charmKind === "insight") {
    drawCards(total);
    anim.floatPlayer(`+${total} cards`, "#e8d08a");
    synth.chime();
  } else if (card.charmKind === "mend") {
    run.hp = Math.min(run.maxHp, run.hp + total);
    anim.floatPlayer(`+${total} ♥`, "#7fd6a4");
    synth.chime();
  } else {
    e.dim += total;
    anim.floatEnemy(`-${total} ⚔`, "#b99fe0");
    synth.guard();
  }
  if (mult > 1) anim.floatPlayer("RECALLED ×2", "#9db7d8");
  if (resonant) anim.floatPlayer(`رنين resonance +${Math.ceil(eff.n / 2)}`, "#e3b75f");
}

function endTurn() {
  if (battle.over || resolving) return;
  battle.discard.push(...battle.hand.filter((c) => c.type !== "fog"));
  const fogs = battle.hand.filter((c) => c.type === "fog");
  battle.hand = [];

  // enemy acts
  const e = battle.enemy;
  e.block = 0;
  const move = e.script[e.step % e.script.length];
  e.step += 1;
  if (move.k === "attack") {
    const raw = Math.max(0, move.n - e.dim);
    e.dim = 0;
    const soaked = Math.min(battle.block, raw);
    const dmg = raw - soaked;
    battle.block = 0;
    run.hp -= dmg;
    anim.enemyLunge(dmg);
    if (dmg > 0) synth.hurt();
    else synth.guard();
  } else if (move.k === "block") {
    e.block += move.n;
    anim.floatEnemy(`+${move.n} 🛡`, "#9cc3ee");
  } else if (move.k === "hex") {
    battle.discard.push({
      uid: `fog#${Math.random().toString(36).slice(2)}`,
      type: "fog",
      arabic: "؟",
      english: "Fog of Forgetting",
      root: "",
      level: 0,
      hazy: false,
    });
    anim.hexPuff();
    hint("A Fog card slipped into your discard pile. Recall dispels it.");
  } // charge: telegraphs only

  if (run.hp <= 0) {
    run.hp = 0;
    battle.over = true;
    renderBattle();
    setTimeout(() => endRun(false), 700);
    return;
  }

  // new player turn
  battle.turn += 1;
  battle.block = 0;
  battle.energy = ENERGY_PER_TURN;
  battle.rootsThisTurn = new Set();
  battle.hand = fogs; // undispelled fog lingers in hand
  drawCards(HAND_SIZE);
  renderBattle();
}

function checkEnd() {
  const e = battle.enemy;
  if (e.hp <= 0 && !battle.over) {
    battle.over = true;
    e.hp = 0;
    renderBattle();
    anim.enemyDeath();
    const stageEmbers = 5 + 2 * (run.stage + 1) + 2 * run.tier + (e.boss ? 6 : 0);
    run.embersEarned += stageEmbers;
    setTimeout(() => {
      if (run.stage + 1 >= ENEMIES[run.tier].length) {
        endRun(true);
      } else {
        run.stage += 1;
        run.hp = Math.min(
          run.maxHp,
          run.hp + STAGE_HEAL + (forge.sigils.mihrab ? 4 : 0)
        );
        startBattle();
      }
    }, 950);
  }
}

// ---------------------------------------------------------------- recall

// Rescues are the forge's proudest number: a fading word you pulled back
// mid-battle. Each one banks embers even if the run is lost.
function markRescue(word, ok) {
  if (!ok || !word || !word.id) return;
  if (!run.rescued.has(word.id)) {
    run.rescued.set(word.id, word);
    run.embersEarned += 2;
  }
}

function pickRecallWord() {
  const hazies = run.deck.filter((w) => w.hazy);
  const pool = hazies.length ? hazies : run.deck;
  return pool[Math.floor(Math.random() * pool.length)];
}

function recallOptions(word) {
  const banned = new Set([glossKey(word.english)]);
  const sources = shuffle(
    collection.concat(starterCards(collection)).filter((w) => w.english)
  );
  const distractors = [];
  for (const w of sources) {
    if (distractors.length >= 2) break;
    const k = glossKey(w.english);
    if (!k || banned.has(k)) continue;
    banned.add(k);
    distractors.push(w.english);
  }
  // Tiny collections still get three buttons.
  const filler = ["the truth", "a clear light", "those who believe"];
  for (const f of filler) {
    if (distractors.length >= 2) break;
    if (!banned.has(glossKey(f))) distractors.push(f);
  }
  return shuffle([word.english, ...distractors]);
}

function askRecall(word, kicker) {
  return new Promise((resolve) => {
    const modal = $("recall-modal");
    $("recall-kicker").textContent = kicker;
    $("recall-arabic").textContent = word.arabic;
    $("recall-translit").textContent = word.translit || "";
    const verdict = $("recall-verdict");
    verdict.textContent = "";
    verdict.className = "recall-verdict";
    const wrap = $("recall-options");
    wrap.innerHTML = "";
    if (word.audioPath) recite.playWord(word.audioPath);

    let done = false;
    for (const opt of recallOptions(word)) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "recall-option";
      btn.textContent = opt;
      btn.addEventListener("click", () => {
        if (done) return;
        done = true;
        const ok = glossKey(opt) === glossKey(word.english);
        btn.classList.add(ok ? "correct" : "wrong");
        if (!ok) {
          for (const b of wrap.children) {
            if (glossKey(b.textContent) === glossKey(word.english)) {
              b.classList.add("correct");
            }
          }
        }
        verdict.textContent = ok
          ? "Recalled! The memory holds."
          : `It means “${word.english}.” It will come back.`;
        verdict.classList.add(ok ? "good" : "bad");
        if (ok) synth.spark();
        setTimeout(() => {
          modal.hidden = true;
          resolve(ok);
        }, ok ? 750 : 1500);
      });
      wrap.appendChild(btn);
    }
    modal.hidden = false;
  });
}

// ---------------------------------------------------------------- results

function weakestWords() {
  return run.deck
    .filter((w) => !w.starter && w.id)
    .sort((a, b) => (a.retr ?? 1) - (b.retr ?? 1) || a.level - b.level)
    .slice(0, 3);
}

function endRun(won) {
  battle = null;
  forge.embers += run.embersEarned;
  forge.rescuedTotal += run.rescued.size;
  if (won) forge.tierWins[run.tier] += 1;
  saveForge();
  (won ? synth.win : synth.lose)();

  const card = $("result-card");
  card.innerHTML = "";

  const h2 = document.createElement("h2");
  h2.className = won ? "win" : "loss";
  h2.textContent = won
    ? `${TIERS[run.tier].name} lifts!`
    : "The Forgetting closes in…";
  card.appendChild(h2);

  const sub = document.createElement("p");
  sub.className = "result-sub";
  sub.textContent = won
    ? run.tier + 1 < TIERS.length
      ? `Your memory held. ${TIERS[run.tier + 1].name} awaits.`
      : "The Blank Page itself turns over. Your memory is a fortress."
    : "A run lost is a lesson found: these are the words that failed you.";
  card.appendChild(sub);

  const embers = document.createElement("p");
  embers.className = "result-embers";
  embers.textContent = `+${run.embersEarned} embers 🔥 (bank: ${forge.embers})`;
  card.appendChild(embers);

  if (run.rescued.size) {
    const blurb = document.createElement("p");
    blurb.className = "rescue-blurb";
    blurb.textContent = `${run.rescued.size} fading ${
      run.rescued.size === 1 ? "word" : "words"
    } rescued mid-battle — those memories just got stickier.`;
    card.appendChild(blurb);
  }

  const weak = weakestWords();
  if (weak.length) {
    const heading = document.createElement("p");
    heading.className = "result-sub";
    heading.innerHTML = won
      ? "<b>Temper these next</b> — your faintest cards:"
      : "<b>Weakest links</b> — reforge them and return:";
    card.appendChild(heading);

    const list = document.createElement("div");
    list.className = "weak-list";
    for (const w of weak) {
      const row = document.createElement("div");
      row.className = "weak-row";
      const surah = w.reviewSurah || w.surahs[0];
      const href = w.fsrs ? `review.html?surah=${surah}` : `trainer.html?surah=${surah}`;
      const pct = w.fsrs ? `${Math.round((w.retr ?? 0) * 100)}% recall odds` : "barely met";
      row.innerHTML =
        `<span class="weak-arabic" lang="ar"></span>` +
        `<span class="weak-info"><span class="weak-gloss"></span>` +
        `<div class="weak-meta">Level ${w.level} · ${pct}</div></span>`;
      row.querySelector(".weak-arabic").textContent = w.arabic;
      row.querySelector(".weak-gloss").textContent = w.english;
      const a = document.createElement("a");
      a.href = href;
      a.textContent = w.fsrs ? "Reforge ↗" : "Train ↗";
      row.appendChild(a);
      list.appendChild(row);
    }
    card.appendChild(list);
  }

  const actions = document.createElement("div");
  actions.className = "result-actions";
  const again = document.createElement("button");
  again.className = "primary-btn";
  again.type = "button";
  again.textContent = won ? "Climb again" : "Rise again";
  again.addEventListener("click", () => renderHome());
  actions.appendChild(again);
  const toTrainer = document.createElement("a");
  toTrainer.className = "ghost-btn gold";
  toTrainer.href = "surahs.html";
  toTrainer.textContent = "🗝 To the trainer";
  actions.appendChild(toTrainer);
  card.appendChild(actions);

  run = null;
  show("screen-result");
}

// ---------------------------------------------------------------- arena art

// All the pixel art is procedural: sprites are tiny string matrices painted at
// integer scale onto a low-res canvas with smoothing off. No assets to load,
// nothing to license, everything crisp.
const SPRITES = {
  scribe: {
    scale: 5,
    map: { r: "#6a5136", R: "#7d6142", f: "#e8c9a0", h: "#3a2e1e", g: "#e3b75f", G: "#f5d98b", d: "#241f18" },
    rows: [
      "....hhhh......",
      "...hhhhhh.....",
      "...hffffh.....",
      "...hfdfdh.....",
      "...hffffh.....",
      "....ffff......",
      "...RRRRRR.....",
      "..RRRRRRRR..g.",
      ".rRRRRRRRRr.g.",
      ".rRRRRRRRRrgGg",
      ".rrRRRRRRrr.G.",
      "..rRRRRRRr..g.",
      "..rRRRRRRr....",
      "..rRRRRRRr....",
      "..rrRRRRrr....",
      "..rrrRRrrr....",
      "..rrr..rrr....",
      ".ddd....ddd...",
    ],
  },
  smudge: {
    scale: 5,
    map: { a: "#2c3a4d", b: "#46617e", w: "#dbe7f4", d: "#0c0f14" },
    rows: [
      ".....aaaaaa.....",
      "...aabaaaabaa...",
      "..aaaaaaaaaaaa..",
      ".aaawwaaaawwaa..",
      ".aaawdaaaawdaaa.",
      "aaaaaaaaaaaaaaaa",
      "aaaaaaadaaaaaaaa",
      "aabaaaaaaaaabaaa",
      ".aaaaaaaaaaaaaa.",
      "..aaa.aaaa.aaa..",
      "...a...aa...a...",
    ],
  },
  hollow: {
    scale: 5,
    map: { a: "#7e93ab", b: "#9db7d8", d: "#141a22", w: "#e8eef6" },
    rows: [
      ".....aaaa.....",
      "...aaaaaaaa...",
      "..aaabaabaaa..",
      "..aadaaaadaa..",
      "..aadaaaadaa..",
      "..aaaaaaaaaa..",
      "..aaaadaaaaa..",
      "..aaadddaaaa..",
      "..aaaaaaaaaa..",
      "..aaaaaaaaaa..",
      "..aaaaaaaaaa..",
      "..aabaaaabaa..",
      "..aaaaaaaaaa..",
      "..a.aa..aa.a..",
      "..a..a..a..a..",
      ".....a..a.....",
    ],
  },
  static: {
    scale: 5,
    map: { a: "#5a4a7a", b: "#b99fe0", d: "#171122", w: "#efe6ff" },
    rows: [
      "..b........b..",
      ".aab..bb..baa.",
      "..aabaaaabaa..",
      ".aaaaaaaaaaaa.",
      "aaawwaaaawwaaa",
      "aaawdaaaawdaaa",
      ".aaaaaaaaaaaa.",
      "baaaadddaaaab.",
      ".aaaaaaaaaaaa.",
      "..aabaaaabaa..",
      ".aab..aa..baa.",
      "..b...aa...b..",
      ".....b..b.....",
      "....b....b....",
    ],
  },
  fogboss: {
    scale: 6,
    map: { a: "#39496087", A: "#394960", b: "#5a7391", w: "#dbe7f4", d: "#0c0f14" },
    rows: [
      "......bbbb........bbb.........",
      "...bbAAAAAbb....bbAAAbb.......",
      "..bAAAAAAAAAbbbbAAAAAAAbb.....",
      ".bAAAAAAAAAAAAAAAAAAAAAAAbb...",
      "bAAAwwAAAAAAwwAAAAAAAAAAAAAb..",
      "bAAAwdAAAAAAwdAAAAAAAAAAAAAAb.",
      "bAAAAAAAAAAAAAAAAAAAAAAAAAAAb.",
      "bAAAAAAAdddAAAAAAAAAAAAAAAAb..",
      ".bAAAAAdAAAdAAAAAAAAAAAAAAb...",
      "..bAAAAAAAAAAAAAAAAAAAAAb.....",
      "...abAAAAAAbbAAAAAAAbba.......",
      "....a.bbbb...abbbba..a........",
      "....a...a.....a..a............",
      "...............a..............",
    ],
  },
  eraser: {
    scale: 6,
    map: { a: "#c9c2b4", b: "#e4ddcf", d: "#1a1712", r: "#a06a5a", R: "#c8877a" },
    rows: [
      "..rrrrrrrrrrrr....",
      ".rRRRRRRRRRRRRr...",
      ".rRRRRRRRRRRRRr...",
      "..aaaaaaaaaaaa....",
      ".abbbbbbbbbbbba...",
      ".abddbbbbbddbba...",
      ".abddbbbbbddbba...",
      ".abbbbbbbbbbbba...",
      ".abbbbdddbbbbba...",
      ".abbbdbbbdbbbba...",
      ".abbbbbbbbbbbba...",
      ".abbbbbbbbbbbba...",
      ".abbbbbbbbbbbba...",
      ".abbbbbbbbbbbba...",
      ".abbbbbbbbbbbba...",
      "..aaaaaaaaaaaa....",
      "...aa......aa.....",
      "..aaa......aaa....",
    ],
  },
  page: {
    scale: 6,
    map: { a: "#ded8ca", b: "#f2ede1", d: "#0c0f14", s: "#b9b2a2" },
    rows: [
      "..aaaaaaaaaaaaaaaaaa..",
      ".abbbbbbbbbbbbbbbbba..",
      ".abbbbbbbbbbbbbbbbba..",
      ".abbddbbbbbbbbddbbba..",
      ".abbddbbbbbbbbddbbba..",
      ".abbbbbbbbbbbbbbbbba..",
      ".abbbbbbbbbbbbbbbbba..",
      ".abbbbbdddddbbbbbbba..",
      ".abbbbdbbbbbdbbbbbba..",
      ".abbbdbbbbbbbdbbbbba..",
      ".abbbbbbbbbbbbbbbbba..",
      ".asbbbbbbbbbbbbbbsba..",
      ".abbbbbbbbbbbbbbbbba..",
      ".abbbbbbbbbbbbbbbbba..",
      ".abbbbbbbbbbbbbbbbba..",
      ".abbsbbbbbbbbbsbbbba..",
      ".abbbbbbbbbbbbbbbbba..",
      ".abba.abbba.abba.aba..",
      ".ab...ab.ab...ab..a...",
      ".a....a...a....a......",
    ],
  },
};

// tier recolours: the same creature, deeper in the dark
const TINTS = {
  deep: { "#2c3a4d": "#3d2c4d", "#46617e": "#6a4a8e", "#7e93ab": "#8b7ab0", "#9db7d8": "#b99fe0", "#5a4a7a": "#7a3a5a", "#b99fe0": "#e09fbf" },
};

const anim = (() => {
  const canvas = $("arena");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const W = canvas.width;
  const H = canvas.height;
  const GROUND = H - 34;
  const PLAYER_X = 88;
  const ENEMY_X = W - 128;

  const state = {
    enemy: null,
    enemyOffset: 0, // lunge offset
    enemyFlash: 0,
    enemySquash: 0,
    enemyDead: 0,
    playerFlash: 0,
    shake: 0,
    floaties: [],
    particles: [],
    stars: [],
  };
  for (let i = 0; i < 46; i++) {
    state.stars.push({
      x: Math.random() * W,
      y: Math.random() * (GROUND - 40),
      r: Math.random() < 0.85 ? 1 : 2,
      tw: Math.random() * Math.PI * 2,
    });
  }

  function drawSprite(name, x, y, tint, flash, squash) {
    const s = SPRITES[name];
    if (!s) return;
    const px = 3; // logical pixel size inside our already-low-res canvas
    const w = s.rows[0].length * px;
    const h = s.rows.length * px;
    const sy = 1 - squash * 0.25;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, sy);
    for (let r = 0; r < s.rows.length; r++) {
      const row = s.rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === ".") continue;
        let color = s.map[ch] || "#fff";
        if (tint && TINTS[tint] && TINTS[tint][color]) color = TINTS[tint][color];
        if (flash > 0) color = "#f4f7fb";
        ctx.fillStyle = color;
        ctx.fillRect(c * px - w / 2, r * px - h, px, px);
      }
    }
    ctx.restore();
    return { w, h };
  }

  function frame(t) {
    requestAnimationFrame(frame);
    if ($("screen-battle").hidden) return;

    const shx = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
    const shy = state.shake > 0 ? (Math.random() - 0.5) * state.shake : 0;
    state.shake *= 0.86;

    ctx.save();
    ctx.translate(shx, shy);

    // night sky over the scriptorium
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#131722");
    g.addColorStop(0.75, "#171512");
    g.addColorStop(1, "#131109");
    ctx.fillStyle = g;
    ctx.fillRect(-8, -8, W + 16, H + 16);

    for (const s of state.stars) {
      const a = 0.25 + 0.3 * Math.abs(Math.sin(t / 900 + s.tw));
      ctx.fillStyle = `rgba(227, 183, 95, ${a})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }

    // ground
    ctx.fillStyle = "#221d15";
    ctx.fillRect(-8, GROUND, W + 16, H - GROUND + 8);
    ctx.fillStyle = "#2e2820";
    ctx.fillRect(-8, GROUND, W + 16, 3);
    ctx.fillStyle = "#191510";
    for (let x = 12; x < W; x += 34) ctx.fillRect(x, GROUND + 12, 16, 2);

    // lantern glow around the scribe
    const bob = Math.sin(t / 420) * 2;
    const lg = ctx.createRadialGradient(PLAYER_X + 26, GROUND - 44 + bob, 4, PLAYER_X + 26, GROUND - 44 + bob, 74);
    lg.addColorStop(0, "rgba(227, 183, 95, 0.28)");
    lg.addColorStop(1, "rgba(227, 183, 95, 0)");
    ctx.fillStyle = lg;
    ctx.fillRect(PLAYER_X - 60, GROUND - 130, 180, 140);

    drawSprite("scribe", PLAYER_X, GROUND + bob, null, state.playerFlash, 0);
    state.playerFlash = Math.max(0, state.playerFlash - 0.08);

    // enemy
    if (state.enemy && state.enemyDead < 1) {
      const ebob = Math.sin(t / 380 + 2) * 3;
      const jitter = state.enemy.sprite === "static" ? (Math.random() - 0.5) * 2 : 0;
      const ex = ENEMY_X + state.enemyOffset + jitter;
      ctx.globalAlpha = 1 - state.enemyDead;
      drawSprite(
        state.enemy.sprite,
        ex,
        GROUND + ebob,
        state.enemy.tint,
        state.enemyFlash,
        state.enemySquash
      );
      ctx.globalAlpha = 1;
      state.enemyFlash = Math.max(0, state.enemyFlash - 0.09);
      state.enemySquash = Math.max(0, state.enemySquash - 0.06);
      state.enemyOffset *= 0.82;
    }
    if (state.enemyDead > 0 && state.enemyDead < 1) state.enemyDead += 0.04;

    // particles
    for (const p of state.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.age += 1;
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    state.particles = state.particles.filter((p) => p.age < p.life);

    // damage floaties
    ctx.textAlign = "center";
    for (const f of state.floaties) {
      f.y -= 0.55;
      f.age += 1;
      ctx.globalAlpha = Math.max(0, 1 - f.age / 80);
      ctx.font = `700 ${f.big ? 20 : 13}px Inter, sans-serif`;
      ctx.fillStyle = "#000";
      ctx.fillText(f.text, f.x + 1, f.y + 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
    state.floaties = state.floaties.filter((f) => f.age < 80);

    ctx.restore();
  }
  requestAnimationFrame(frame);

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      state.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 3.4,
        vy: -Math.random() * 2.6,
        size: Math.random() < 0.5 ? 2 : 3,
        color,
        age: 0,
        life: 26 + Math.random() * 22,
      });
    }
  }

  return {
    reset(enemy) {
      state.enemy = enemy;
      state.enemyDead = 0;
      state.enemyOffset = 0;
      state.floaties = [];
      state.particles = [];
    },
    hitEnemy(dmg, recalled, resonant) {
      state.enemyFlash = 1;
      state.enemySquash = 1;
      state.shake = Math.min(9, 3 + dmg * 0.4);
      burst(ENEMY_X, GROUND - 40, "#46617e", 10 + Math.min(14, dmg));
      if (resonant) burst(ENEMY_X, GROUND - 55, "#e3b75f", 8);
      state.floaties.push({
        x: ENEMY_X, y: GROUND - 92,
        text: dmg > 0 ? `-${dmg}` : "blocked",
        color: recalled ? "#9db7d8" : "#ee9c86",
        big: recalled || dmg >= 10,
        age: 0,
      });
    },
    enemyLunge(dmg) {
      state.enemyOffset = -46;
      state.playerFlash = dmg > 0 ? 1 : 0;
      state.shake = dmg > 0 ? Math.min(10, 3 + dmg * 0.5) : 2;
      if (dmg > 0) burst(PLAYER_X, GROUND - 44, "#e0635a", 10);
      state.floaties.push({
        x: PLAYER_X, y: GROUND - 100,
        text: dmg > 0 ? `-${dmg}` : "blocked!",
        color: dmg > 0 ? "#e0635a" : "#9cc3ee",
        big: dmg >= 10,
        age: 0,
      });
    },
    floatPlayer(text, color) {
      state.floaties.push({ x: PLAYER_X + 30, y: GROUND - 105, text, color, age: 0 });
    },
    floatEnemy(text, color) {
      state.floaties.push({ x: ENEMY_X, y: GROUND - 92, text, color, age: 0 });
    },
    hexPuff() {
      burst(PLAYER_X + 10, GROUND - 60, "#b99fe0", 16);
    },
    wisp() {
      burst(PLAYER_X + 20, GROUND - 70, "#9db7d8", 14);
    },
    enemyDeath() {
      state.enemyDead = 0.05;
      state.shake = 8;
      burst(ENEMY_X, GROUND - 40, "#46617e", 26);
      burst(ENEMY_X, GROUND - 40, "#e3b75f", 14);
    },
  };
})();

// ---------------------------------------------------------------- wiring

$("end-turn-btn").addEventListener("click", endTurn);
$("retreat-btn").addEventListener("click", () => {
  if (run && !battle?.over) endRun(false);
});

renderHome();
