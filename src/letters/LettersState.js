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
      return { ...value, owned: strings(value.owned, fallback && fallback.owned) };
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

  function read(key, fallback) {
    let raw;
    try {
      raw = localStorage.getItem(key);
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
        const recoveryKey = `${key}:recovery`;
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
      localStorage.setItem(key, raw);
      return true;
    } catch {
      writeFailed = true;
      return false;
    }
  }

  ns.LettersState = { read, write, normalize, hasWriteFailure: () => writeFailed };
})(window.MiftahGame || (window.MiftahGame = {}));
