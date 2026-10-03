// The Letter Garden's quiet strength model (spec: specs/02-letter-garden-v2.md).
//
// Explicit learning outcomes feed it — never sound-effect names — and it never
// surfaces as a gate, a test, or a score the
// child can see. Its one job: know which letters/skills are shaky so the
// daily world can quietly dress the weakest ones up as a fresh bouquet.
//
// Keyed by item id (the same ids worlds use: "ب", "بَ", a decode word…), so
// the same letter aggregates across worlds and games.
//
// Storage: quran-trainer:letters:strength → { [id]: {r, w, streak, fast, slow, last} }
//   r/w     lifetime right/wrong counts
//   streak  current consecutive-right run (a miss resets it)
//   fast/slow historical response-timing counters (retained for compatibility;
//             timing does not make a correct answer weaker)
//   last    ms epoch of the latest answer
//   evidence counts by evidence type, including observations that deliberately
//            do not change r/w (such as Pairs and verdict-free motor play)
(function (ns) {
  const KEY = "quran-trainer:letters:strength";
  const REVIEW_KEY = "quran-trainer:letters:review";
  const FAST_MS = 3500;
  const DAY = 86400000;

  class LettersStrength {
    constructor() {
      const state = ns.LettersState;
      if (state) {
        this.map = state.read(KEY, {});
      } else try {
        const raw = localStorage.getItem(KEY);
        const data = raw ? JSON.parse(raw) : {};
        this.map = data && typeof data === "object" ? data : {};
      } catch {
        this.map = {};
      }
      let review;
      try { review = state ? state.read(REVIEW_KEY, {}) : JSON.parse(localStorage.getItem(REVIEW_KEY) || '{}'); } catch {}
      this.review = { cursor: Math.max(0, Number.isSafeInteger(review?.cursor) ? review.cursor : 0),
        recent: Array.isArray(review?.recent) ? review.recent.filter(id => typeof id === 'string').slice(-12) : [] };
    }

    save() {
      if (ns.LettersState) return ns.LettersState.write(KEY, this.map);
      try {
        localStorage.setItem(KEY, JSON.stringify(this.map));
        return true;
      } catch {
        return false;
      }
    }

    record(id, correct, elapsedMs) {
      if (!id) return;
      const e = this.map[id] || { r: 0, w: 0, streak: 0, fast: 0, slow: 0, last: 0 };
      if (correct) {
        e.r += 1;
        e.streak += 1;
        if (Number.isFinite(elapsedMs) && elapsedMs >= 0 && elapsedMs <= FAST_MS) e.fast += 1;
        else e.slow += 1;
      } else {
        e.w += 1;
        e.streak = 0;
      }
      e.last = Date.now();
      this.map[id] = e;
      this.save();
      ns.LettersAnalytics?.letterStrength(id, this.mastery(id));
    }

    recordOutcome(outcome) {
      if (!outcome || !outcome.itemId || !outcome.evidence) return false;
      const id = outcome.itemId;
      const e = this.map[id] || { r: 0, w: 0, streak: 0, fast: 0, slow: 0, last: 0 };
      e.evidence = e.evidence && typeof e.evidence === "object" ? e.evidence : {};
      e.evidence[outcome.evidence] = (e.evidence[outcome.evidence] || 0) + 1;
      e.evidenceResults = e.evidenceResults && typeof e.evidenceResults === "object" ? e.evidenceResults : {};
      const result = e.evidenceResults[outcome.evidence];
      const counts = result && typeof result === "object"
        ? result
        : { r: 0, w: 0, participation: 0 };
      counts.r = Number.isFinite(counts.r) && counts.r >= 0 ? counts.r : 0;
      counts.w = Number.isFinite(counts.w) && counts.w >= 0 ? counts.w : 0;
      counts.participation = Number.isFinite(counts.participation) && counts.participation >= 0 ? counts.participation : 0;
      if (outcome.correct === true) counts.r += 1;
      else if (outcome.correct === false) counts.w += 1;
      else counts.participation += 1;
      e.evidenceResults[outcome.evidence] = counts;
      this.recordSkill(e, outcome);
      if (outcome.affectsStrength !== false && typeof outcome.correct === "boolean") {
        if (outcome.correct) {
          e.r += 1;
          e.streak += 1;
          if (Number.isFinite(outcome.elapsedMs) && outcome.elapsedMs >= 0 && outcome.elapsedMs <= FAST_MS) e.fast += 1;
          else e.slow += 1;
        } else {
          e.w += 1;
          e.streak = 0;
        }
      }
      if (outcome.affectsStrength !== false) e.last = Date.now();
      e.evidenceLast = Date.now();
      this.map[id] = e;
      this.save();
      ns.LettersAnalytics?.letterStrength(id, this.mastery(id));
      return true;
    }

    recordSkill(entry, outcome) {
      // New evidence is additive. Historical r/w cannot tell us whether a
      // prompt was hidden or a child received help, so it is never backfilled.
      const skill = typeof outcome.skill === 'string' ? outcome.skill : 'recognition';
      entry.skills = entry.skills && typeof entry.skills === 'object' && !Array.isArray(entry.skills) ? entry.skills : {};
      const previous = Object.prototype.hasOwnProperty.call(entry.skills, skill) ? entry.skills[skill] : null;
      const state = previous && typeof previous === 'object' ? previous : {};
      const kind = ({supported_visible_matching:'matching', independent_listening:'listening', assisted_response:'assisted', motor_assembly_participation:'motor'})[outcome.evidence];
      if (!kind) return;
      const old = state[kind] || {};
      const number = value => Number.isFinite(value) && value >= 0 ? value : 0;
      const bucket = {r:number(old.r),w:number(old.w),streak:number(old.streak),participation:number(old.participation),last:number(old.last),sessions:Array.isArray(old.sessions)?old.sessions.filter(s=>typeof s==='string').slice(-4):[]};
      if (outcome.correct === true) { bucket.r++; bucket.streak++; }
      else if (outcome.correct === false) { bucket.w++; bucket.streak=0; }
      else bucket.participation++;
      bucket.last = Date.now();
      if (outcome.correct === true && outcome.sessionId && !bucket.sessions.includes(outcome.sessionId)) bucket.sessions = [...bucket.sessions, outcome.sessionId].slice(-4);
      state[kind] = bucket;
      if (outcome.correct === false && outcome.selectedId && outcome.selectedId !== outcome.itemId) {
        const before = state.confusions && typeof state.confusions === 'object' ? state.confusions : {};
        state.confusions = Object.fromEntries(Object.entries({...before,[outcome.selectedId]:number(before[outcome.selectedId])+1}).slice(-8));
      }
      state.lastActivity = outcome.activity || '';
      Object.defineProperty(entry.skills, skill, {value:state,enumerable:true,writable:true,configurable:true});
    }

    skillProfile(id, skill) {
      const entry = this.map[id]?.skills?.[skill];
      if (!entry || typeof entry !== 'object') return {attempts:0};
      const count = value => Number.isFinite(value) && value >= 0 ? value : 0;
      const attempts = ['matching','listening','assisted','motor'].reduce((n,key)=>n+count(entry[key]?.r)+count(entry[key]?.w),0);
      return {...entry,attempts};
    }

    reviewItems(pool, n = 6) {
      const items = [...new Map(pool.filter(item=>item?.id).map(item=>[item.id,item])).values()];
      const cursor = this.review?.cursor || 0;
      const recent = new Set(this.review?.recent || []);
      const rows = items.map((item,index)=>{
        const skill = ns.LettersLearning?.skillFor(item) || item.objective || 'recognition';
        const p = this.skillProfile(item.id, skill);
        const independent = p.listening || {};
        const matching = p.matching || {};
        const last = independent.last || 0;
        const days = last ? Math.max(0,Math.min(14,(Date.now()-last)/DAY)) : 14;
        const score = days*.2 + Math.min(4,p.assisted?.r || 0)*.25 + Math.min(4,independent.w || 0)*.5 - Math.min(4,independent.streak || 0)*.3 - (recent.has(item.id)?5:0);
        return {item,p,score,comfortable:(independent.r || 0)>=2 || (matching.r || 0)>=3,order:(index-cursor+items.length*100)%Math.max(1,items.length)};
      }).sort((a,b)=>b.score-a.score || a.order-b.order);
      const chosen=[];
      const add = row => {if(row && chosen.length<n && !chosen.some(i=>i.id===row.item.id))chosen.push(row.item);};
      // An easy opening, two due reviews, one lightly practised item, then
      // remaining due material. Rendering this plan never changes its cursor.
      add(rows.find(row=>row.comfortable && !recent.has(row.item.id)) || rows.find(row=>row.comfortable));
      rows.slice(0,2).forEach(add);
      add(rows.find(row=>row.p.attempts<3 && !chosen.some(i=>i.id===row.item.id)));
      rows.forEach(add);
      return chosen;
    }

    beginReview(items) {
      const ids = [...new Set((items || []).map(i=>i?.id).filter(Boolean))];
      this.review = {cursor:((this.review?.cursor || 0)+1)%100000,
        recent:[...(this.review?.recent || []),...ids].slice(-12)};
      if (ns.LettersState) return ns.LettersState.write(REVIEW_KEY, this.review);
      try {localStorage.setItem(REVIEW_KEY,JSON.stringify(this.review));return true;} catch {return false;}
    }

    // Weakness score — higher = needs more love. Three honest signals:
    //   • Laplace-smoothed error rate (never-seen items land mid-scale, so
    //     new material still gets its turn in the bouquet);
    //   • staleness — days untouched drift an item back toward "due";
    //   • a hot streak pushes an item away (it's fine, leave it alone).
    weakness(id) {
      const e = this.map[id];
      if (!e) return 1.5; // unseen: worth a look, not an emergency
      const errorRate = (e.w + 1) / (e.r + e.w + 2); // smoothed 0..1
      const staleDays = Math.max(0, Math.min((Date.now() - e.last) / DAY, 14));
      return errorRate * 3 + staleDays * 0.07 - Math.min(e.streak, 4) * 0.3;
    }

    // Mastery of a single skill, 0..1 — the friendly inverse of weakness,
    // driving the mastery garden's growth. A never-seen skill is 0 (a bare
    // seed); accurate, repeated, well-remembered work approaches 1 (full bloom).
    mastery(id) {
      const e = this.map[id];
      if (!e) return 0;
      const seen = e.r + e.w;
      if (!seen) return 0;
      const accuracy = e.r / seen; // 0..1
      const hasCorrect = e.r > 0 ? 1 : 0;
      const streakBoost = Math.min(e.streak, 5) / 5;
      // Keep the old 60/20/20 shape, but make the former timing component a
      // speed-neutral credit for any correct response. This can preserve or
      // increase existing growth; it never takes earned growth away because a
      // child answered carefully.
      const exposure = Math.min(seen / 4, 1);
      return Math.max(0, Math.min(1, (accuracy * 0.6 + hasCorrect * 0.2 + streakBoost * 0.2) * exposure));
    }

    // Average mastery across a world's items, 0..1 — one number for how well
    // the child holds a whole chapter, for the map's mastery plants.
    worldMastery(items) {
      if (!items || !items.length) return 0;
      const sum = items.reduce((a, item) => a + this.mastery(item.id), 0);
      return sum / items.length;
    }

    // The daily bouquet: the n weakest of the given items (stable ids),
    // shuffled so the child never senses a ranking.
    weakest(items, n) {
      const scored = items
        .map((item) => ({ item, score: this.weakness(item.id) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, n)
        .map((s) => s.item);
      for (let i = scored.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [scored[i], scored[j]] = [scored[j], scored[i]];
      }
      return scored;
    }
  }

  ns.LettersStrength = new LettersStrength();
})(window.MiftahGame || (window.MiftahGame = {}));
