// Defensive, schema-aware access to Letter Garden's local save data.
(function (ns) {
  const PREFIX = "quran-trainer:letters:";

  const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
  const copy = (value) => {
    if (Array.isArray(value)) return value.slice();
    if (isObject(value)) return { ...value };
    return value;
  };
  const fallbackObject = (fallback) => (isObject(fallback) ? copy(fallback) : {});
  const fallbackArray = (fallback) => (Array.isArray(fallback) ? fallback.slice() : []);
  const strings = (value, fallback) => {
    const source = Array.isArray(value) ? value : fallbackArray(fallback);
    return [...new Set(source.filter((item) => typeof item === "string"))];
  };
  const finite = (value, fallback, min, max, numericStrings) => {
    const number = numericStrings && typeof value === "string" && value.trim() !== "" ? Number(value) : value;
    if (typeof number !== "number" || !Number.isFinite(number) || number < min) return fallback;
    return Math.min(number, max);
  };
  const validDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  };

  function objectMap(value, fallback, normalizeValue) {
    if (!isObject(value)) return fallbackObject(fallback);
    const result = {};
    for (const [id, entry] of Object.entries(value)) {
      const normalized = normalizeValue(entry, id);
      if (normalized !== undefined) Object.defineProperty(result, id, {
        value: normalized,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    return result;
  }

  function normalize(key, value, fallback) {
    const name = key.startsWith(PREFIX) ? key.slice(PREFIX.length) : key;

    if (name === "garden-layout") return ns.LettersDecorations.normalize(value);
    // Family Garden: up to six children, each just an id (pets tell them apart).
    if (name === "profiles") return Array.isArray(value) ? value.filter((p) => p && /^p\d{1,3}$/.test(p.id)).map((p) => ({ id: p.id })).slice(0, 6) : [];
    if (name === "profile") return typeof value === "string" && /^p\d{1,3}$/.test(value) ? value : "p1";
    // The chapter the pet last walked to on the map (a plain world id).
    if (name === "map-pet") return typeof value === "string" && /^[a-z0-9-]{1,40}$/.test(value) ? value : null;
    // Read Together sessions (v7): the last 20, each a date and two id lists.
    if (name === "read-aloud") {
      if (!Array.isArray(value)) return [];
      const ids = (list) => (Array.isArray(list) ? list.filter((v) => typeof v === "string" && v.length <= 24).slice(0, 12) : []);
      return value.filter((v) => v && typeof v === "object" && validDate(v.at)).slice(-20).map((v) => ({ at: v.at, read: ids(v.read), notYet: ids(v.notYet) }));
    }
    // Today's Walk (v25): one day's plan and which stops were walked.
    if (name === "walk") {
      const KINDS = /^(Feed|WaterGarden|LetterHunt|LetterDelivery|GardenPaths|DotGarden|SoundLab|LetterStudio|LetterBalloons|FriendFind|FriendBook)$/;
      if (!isObject(value) || !validDate(value.date) || !Array.isArray(value.stops)) return null;
      const stops = value.stops.filter((st) => isObject(st) && KINDS.test(st.kind)).slice(0, 8).map((st) => ({
        kind: st.kind, skill: typeof st.skill === "string" ? st.skill.slice(0, 12) : "name",
        letters: Array.isArray(st.letters) ? st.letters.filter((c) => typeof c === "string" && c.length <= 2).slice(0, 8) : [] }));
      if (!stops.length) return null;
      const done = Array.isArray(value.done) ? [...new Set(value.done.filter((i) => Number.isInteger(i) && i >= 0 && i < stops.length))] : [];
      return { date: value.date, known: Number.isInteger(value.known) ? value.known : 0, stops, done, stamped: value.stamped === true };
    }
    // Eid gifts already given (v10): "1448-eid-fitr" style tags, last ten.
    if (name === "season-gifts") return Array.isArray(value) ? value.filter((v) => typeof v === "string" && /^\d{4}-eid-(fitr|adha)$/.test(v)).slice(-10) : [];
    // Pet tricks already shown off once (v4): ids from the seven letter families.
    if (name === "tricks-seen") return Array.isArray(value) ? [...new Set(value.filter(v => typeof v === "string" && /^(spin|hop|sway|sing|stretch|juggle|roll)$/.test(v)))] : [];
    // Lands whose gate has already unfurled on the map (the arrival plays once).
    if (name === "lands-seen") return Array.isArray(value) ? [...new Set(value.filter(v => typeof v === "string" && /^(orchard|lagoon|night|peaks|river)$/.test(v)))] : [];
    // Up to eight of the child's own drawing thumbnails (update 5 garden signs).
    if (name === "drawings") {
      if (!isObject(value)) return {};
      const keep = Object.entries(value).filter(([letter, url]) => typeof letter === "string" && letter.length <= 8 &&
        typeof url === "string" && url.length <= 60000 && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(url)).slice(-8);
      return Object.fromEntries(keep);
    }
    if (name === "progress") {
      if (!isObject(value)) return fallbackObject(fallback);
      const result = { ...value };
      result.done = strings(value.done, fallback && fallback.done);
      result.skipped = typeof value.skipped === "boolean" ? value.skipped : !!(fallback && fallback.skipped);
      return result;
    }
    if (name === "stars" || name === "bests") {
      return objectMap(value, fallback, (entry) => {
        const n = finite(entry, undefined, 0, 3, false);
        return n === undefined ? undefined : n;
      });
    }
    if (name === "wallet") {
      if (!isObject(value)) return fallbackObject(fallback);
      const base = isObject(fallback) ? fallback : { earned: 0, spent: 0 };
      return {
        ...value,
        earned: finite(value.earned, finite(base.earned, 0, 0, Infinity, true), 0, Infinity, true),
        spent: finite(value.spent, finite(base.spent, 0, 0, Infinity, true), 0, Infinity, true),
      };
    }
    if (name === "pet") {
      if (!isObject(value)) return copy(fallback);
      const base = isObject(fallback) ? fallback : {};
      const result = { ...value };
      result.hue = finite(value.hue, finite(base.hue, 200, -Infinity, Infinity, false), -Infinity, Infinity, false);
      result.species = typeof value.species === "string" ? value.species : typeof base.species === "string" ? base.species : "blob";
      result.worn = strings(value.worn, base.worn);
      result.accessories = strings(value.accessories, base.accessories);
      result.bodies = strings(value.bodies, base.bodies);
      if (!result.bodies.includes(result.species)) result.bodies.push(result.species);
      return result;
    }
    if (name === "stickers") {
      if (!isObject(value)) return fallbackObject(fallback);
      // freeVisits: sticker-stand visits earned by finishing the daily bouquet (v5).
      const out = { ...value, owned: strings(value.owned, fallback && fallback.owned) };
      delete out.freeVisits;
      if (Number.isInteger(value.freeVisits) && value.freeVisits > 0) out.freeVisits = Math.min(9, value.freeVisits);
      return out;
    }
    if (name === "skills") {
      return objectMap(value, fallback, (entry) => {
        if (!isObject(entry)) return undefined;
        if (typeof entry.score !== "number" || !Number.isFinite(entry.score) || entry.score < 0 || entry.score > 3 || !validDate(entry.at)) return undefined;
        return { ...entry, score: entry.score, at: entry.at };
      });
    }
    if (name === "stamps") {
      if (!isObject(value)) return fallbackObject(fallback);
      const dates = (Array.isArray(value.dates) ? value.dates : fallbackArray(fallback && fallback.dates)).filter(validDate);
      return { ...value, dates: [...new Set(dates)] };
    }
    if (name === "reduced-motion") return typeof value === "boolean" ? value : copy(fallback);
    // Seasons (v21): the household's hemisphere.
    if (name === "hemisphere") return value === "south" ? "south" : "north";
    // Little Sprout (v22) is per child: the youngest players.
    if (name === "sprout") return typeof value === "boolean" ? value : copy(fallback);
    // Gentle mode (v17) is per child, unlike reduced motion.
    if (name === "gentle") return typeof value === "boolean" ? value : copy(fallback);
    if (name === "strength") {
      return objectMap(value, fallback, (entry) => {
        if (!isObject(entry)) return undefined;
        const result = { ...entry };
        for (const field of ["r", "w", "streak", "fast", "slow", "last"]) {
          result[field] = finite(entry[field], 0, 0, Infinity, false);
        }
        return result;
      });
    }
    return value;
  }

  // Family Garden (v9): each child has their own garden. The first child keeps
  // the original keys (so existing progress is theirs, untouched); every other
  // child's keys carry "@id:". Device settings are shared by the household.
  const SHARED = new Set(["reduced-motion", "profiles", "profile", "hemisphere"]);
  const PROFILE_ID = /^p\d{1,3}$/;
  function activeProfile() {
    try { const id = JSON.parse(localStorage.getItem(PREFIX + "profile") || '"p1"'); return PROFILE_ID.test(id) ? id : "p1"; } catch { return "p1"; }
  }
  function scopedFor(id, key) {
    if (!key.startsWith(PREFIX)) return key;
    const name = key.slice(PREFIX.length);
    if (SHARED.has(name) || id === "p1") return key;
    return `${PREFIX}@${id}:${name}`;
  }
  const scoped = (key) => scopedFor(activeProfile(), key);

  function read(key, fallback) {
    return readRaw(scoped(key), key, fallback);
  }

  // Read another child's saved value (the "who's playing?" screen shows pets).
  function readAs(id, key, fallback) {
    return readRaw(scopedFor(PROFILE_ID.test(id) ? id : "p1", key), key, fallback);
  }

  function readRaw(storageKey, key, fallback) {
    let raw;
    try {
      raw = localStorage.getItem(storageKey);
    } catch {
      return copy(fallback);
    }
    if (raw === null) return copy(fallback);

    let value;
    let result;
    let damaged = false;
    try {
      value = JSON.parse(raw);
      result = normalize(key, value, fallback);
      damaged = JSON.stringify(result) !== JSON.stringify(value);
    } catch {
      result = copy(fallback);
      damaged = true;
    }

    if (damaged) {
      try {
        const recoveryKey = `${storageKey}:recovery`;
        if (localStorage.getItem(recoveryKey) === null) localStorage.setItem(recoveryKey, raw);
      } catch {}
    }
    return result;
  }

  let writeFailed = false;
  function write(key, value) {
    try {
      const raw = JSON.stringify(value);
      if (raw === undefined) { writeFailed = true; return false; }
      localStorage.setItem(scoped(key), raw);
      return true;
    } catch {
      writeFailed = true;
      return false;
    }
  }

  function profiles() {
    const list = read(PREFIX + "profiles", []);
    return list.length ? list : [{ id: "p1" }];
  }
  function setActive(id) { if (PROFILE_ID.test(id)) write(PREFIX + "profile", id); }
  function addProfile() {
    const list = profiles();
    let n = 2;
    while (list.some((p) => p.id === `p${n}`)) n += 1;
    const id = `p${n}`;
    write(PREFIX + "profiles", [...list, { id }].slice(0, 6));
    return id;
  }

  ns.LettersState = { read, write, readAs, normalize, hasWriteFailure: () => writeFailed, profiles, activeProfile, setActive, addProfile, scoped };
})(window.MiftahGame || (window.MiftahGame = {}));
