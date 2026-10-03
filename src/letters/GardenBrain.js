// The Garden Brain (v25, 2026-10-02): one learner model for every letter, and
// the planner that lays out Today's Walk.
//
// The strength model already records every honest outcome, per item and per
// skill. The Brain reads it (it never writes outcomes) and answers two
// questions the game could not ask before:
//
//   1. What does this child hold for each letter? Five skills — name (hear it,
//      find it), sound (it in a syllable), write (trace it), friend (letter ↔
//      friend ↔ sound, v26) and shape (its in-word forms) — each 0..1.
//   2. What should today's walk be? A short trail of 3–6 stops, each an
//      existing activity loaded with the letters that are due, with the
//      weakest skill given an extra stop.
//
// Due-ness is spaced and expanding: a letter just practised rests, and each
// remembered run lets it rest longer (½ → 1 → 2 → 4 → 8 → 16 days). This is
// the retrieval-practice finding for young word learners, kept invisible.
//
// Spec 02 holds: no gates, no timers, nothing failable, nothing the child can
// see ranked. Free play stays open whatever the walk says, and a stop counts
// as walked when the child plays it — never when they "pass" it.
(function (ns) {
  const DAY = 86400000;
  const REST = [0.5, 1, 2, 4, 8, 16];
  const SKILLS = ["name", "sound", "write", "friend", "shape"];
  const HARAKAT = /[ًٌٍَُِّْ]/;

  const clamp = (n) => Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
  const count = (v) => (Number.isFinite(v) && v >= 0 ? v : 0);

  // A tiny seeded shuffle: the same child sees the same walk all day, however
  // many times the map is re-drawn.
  function seeded(seed) {
    let h = 2166136261;
    for (const ch of String(seed)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  }

  class GardenBrain {
    constructor(strength) { this.strength = strength || ns.LettersStrength; }

    entry(id) { return this.strength?.map?.[id] || null; }

    // Skill evidence, smoothed to 0..1: right answers raise it, misses pull it
    // back gently, and plain participation (verdict-free play) counts a little.
    fromProfile(p) {
      if (!p || !p.attempts && !p.motor) return 0;
      let r = 0, w = 0, part = 0;
      for (const k of ["matching", "listening", "assisted", "motor"]) {
        r += count(p[k]?.r) * (k === "listening" ? 1.2 : k === "assisted" ? 0.5 : 1);
        w += count(p[k]?.w);
        part += count(p[k]?.participation);
      }
      return clamp((r + part * 0.4 - w * 0.5) / 5);
    }

    skills(char) {
      const s = this.strength;
      const prof = (skill) => s?.skillProfile?.(char, skill) || { attempts: 0 };
      const name = Math.max(clamp(s?.mastery?.(char) || 0), this.fromProfile(prof("letter-name")), this.fromProfile(prof("recognition")));
      const write = this.fromProfile(prof("drawing"));
      const friend = this.fromProfile(prof("friend"));
      const shape = this.fromProfile(prof("letter-form"));
      // Sound: every syllable item that starts with this letter (بَ بِ بُ بْ…).
      const map = s?.map || {};
      const syl = Object.keys(map).filter((id) => id.startsWith(char) && HARAKAT.test(id) && [...id.replace(/[ًٌٍَُِّْ]/g, "")].length === 1);
      const sound = syl.length ? clamp(syl.reduce((a, id) => a + (s.mastery?.(id) || 0), 0) / Math.max(2, syl.length)) : 0;
      return { name, sound, write, friend, shape };
    }

    // Last time anything was learned about this letter, any skill.
    lastSeen(char) {
      const e = this.entry(char);
      let last = count(e?.last);
      for (const sk of Object.values(e?.skills || {})) for (const b of Object.values(sk || {})) last = Math.max(last, count(b?.last));
      return last;
    }

    // Due score: > 1 means the letter's rest is over. Never-seen letters sit
    // at a steady 1.2 so new material keeps its turn.
    due(char, now = Date.now()) {
      const last = this.lastSeen(char);
      if (!last) return 1.2;
      const streak = Math.min(count(this.entry(char)?.streak), REST.length - 1);
      return (now - last) / (REST[streak] * DAY);
    }

    // The letters a walk should carry, most due first, with one comfortable
    // letter to open on (an easy win is how a session should start).
    dueLetters(known, n = 4, now = Date.now()) {
      const chars = [...new Set((known || []).filter(Boolean))];
      if (!chars.length) return [];
      const rows = chars.map((char) => {
        const sk = this.skills(char);
        const held = (sk.name + sk.friend + sk.write) / 3;
        return { char, held, score: Math.min(3, this.due(char, now)) + (1 - held) };
      }).sort((a, b) => b.score - a.score || (a.char < b.char ? -1 : 1));
      const pick = rows.slice(0, Math.max(1, n - 1)).map((r) => r.char);
      const easy = rows.filter((r) => !pick.includes(r.char)).sort((a, b) => b.held - a.held)[0];
      if (easy) pick.unshift(easy.char);
      return pick.slice(0, n);
    }

    // The child's weakest skill across known letters, among skills a walk can
    // actually practise today.
    weakestSkill(known, available) {
      const avg = {};
      for (const sk of SKILLS) avg[sk] = 0;
      for (const char of known) { const s = this.skills(char); for (const sk of SKILLS) avg[sk] += s[sk] / known.length; }
      return SKILLS.filter((sk) => available.includes(sk)).sort((a, b) => avg[a] - avg[b])[0] || null;
    }

    summary(known) {
      return (known || []).map((char) => ({ char, ...this.skills(char), due: this.due(char) }));
    }

    // Today's Walk. `opts` describes what this child can do today:
    //   known      chars met in finished chapters
    //   sprout     two-year-old mode (three gentle stops)
    //   marks      harakat taught (Sound Lab available)
    //   date       YYYY-MM-DD (seeds the walk), profile id
    // Every stop is { kind, skill, letters } where kind is a practice activity.
    planWalk({ known = [], sprout = false, marks = [], date = "", profile = "p1", huntable = true } = {}) {
      if (!known.length) return null;
      const rand = seeded(`${date}:${profile}:${known.length}`);
      const pickOne = (list) => list[Math.floor(rand() * list.length)];
      const letters = this.dueLetters(known, sprout ? 3 : 4);
      const stops = [];
      const add = (kind, skill, items = letters) => stops.push({ kind, skill, letters: items.slice() });
      if (sprout) {
        add("LetterBalloons", "name", known.slice(0, 6));
        if (known.length >= 2) add("FriendFind", "friend");
        add("FriendBook", "friend", letters.slice(0, 1));
        return { date, stops };
      }
      add("Feed", "name");
      if (known.length >= 2) add("FriendFind", "friend");
      add(pickOne(known.length >= 3 && huntable ? ["WaterGarden", "LetterHunt", "LetterDelivery"] : ["WaterGarden", "LetterDelivery"]), "name");
      // The weakest practisable skill gets the fourth stop.
      const can = ["write", "friend"];
      if (marks.length) can.push("sound");
      const weak = this.weakestSkill(known, can);
      if (weak === "sound") add("SoundLab", "sound");
      else if (weak === "friend" && known.length >= 2) add(pickOne(["FriendFind", "LetterStudio"]), "friend");
      else add(pickOne(["GardenPaths", "DotGarden"]), "write");
      // The walk ends with a quiet book page: one friend, told slowly.
      add("FriendBook", "friend", letters.slice(-1));
      return { date, stops };
    }
  }

  GardenBrain.SKILLS = SKILLS;
  GardenBrain.REST = REST;
  ns.GardenBrain = GardenBrain;
  ns.gardenBrain = new GardenBrain();
})(window.MiftahGame || (window.MiftahGame = {}));
