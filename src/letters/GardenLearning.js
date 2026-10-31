// Derived, per-skill learning signals for the Garden. This module reads the
// existing evidence buckets and never changes saved strength or earned progress.
(function (ns) {
  const DAY = 86400000;
  const REST_DAYS = [1, 2, 4, 7, 14, 21];
  const KINDS = ["listening", "matching", "assisted", "motor"];

  const count = value => Number.isFinite(value) && value > 0 ? value : 0;
  const stamp = value => Number.isFinite(value) && value > 0 ? value : 0;
  const sessions = bucket => [...new Set((Array.isArray(bucket?.sessions) ? bucket.sessions : [])
    .filter(value => typeof value === "string" && value.length))];

  function bucketSummary(bucket) {
    const successes = count(bucket?.r);
    const misses = count(bucket?.w);
    return {
      successes,
      misses,
      attempts: successes + misses,
      streak: count(bucket?.streak),
      last: stamp(bucket?.last),
      sessions: sessions(bucket),
    };
  }

  function readiness(strength, itemId, skill = "letter-name", now = Date.now()) {
    const profile = strength?.skillProfile?.(itemId, skill) || {};
    const evidence = Object.fromEntries(KINDS.map(kind => [kind, bucketSummary(profile[kind])]));
    const recall = evidence.listening;
    const intervalDays = REST_DAYS[Math.min(recall.streak, REST_DAYS.length - 1)];
    const dueAt = recall.last ? recall.last + intervalDays * DAY : 0;
    const ageMs = recall.last ? Math.max(0, now - recall.last) : null;
    const due = !recall.last || now >= dueAt || (recall.misses > 0 && recall.streak === 0);
    const hasIndependentEvidence = recall.attempts > 0;
    const assistedNeedsSupport = evidence.assisted.last > recall.last;
    const accuracy = recall.attempts ? recall.successes / recall.attempts : null;

    return {
      itemId,
      skill,
      evidence,
      independentSuccesses: recall.successes,
      independentMisses: recall.misses,
      independentSessions: recall.sessions.length,
      hasIndependentEvidence,
      // Matching, assistance, and participation are visible separately and
      // never imply that the child remembered a prompt independently.
      familiar: recall.successes > 0,
      assistedNeedsSupport,
      accuracy,
      lastIndependent: recall.last,
      ageMs,
      intervalDays,
      dueAt,
      due,
      needsPractice: !hasIndependentEvidence || due || recall.misses > recall.successes || assistedNeedsSupport,
    };
  }

  function eligible(item) {
    return item && item.id && item.display && item.taught !== false && item.isTaught !== false
      && item.locked !== true && item.unlocked !== false;
  }

  function plan(strength, knownItems, { now = Date.now(), limit = 3, recentIds = [] } = {}) {
    const cap = Math.max(0, Math.min(3, Math.floor(Number(limit) || 0)));
    const items = [...new Map((Array.isArray(knownItems) ? knownItems : [])
      .filter(eligible).map(item => [item.id, item])).values()];
    if (!cap || !items.length) return [];

    const rows = items.map(item => ({
      item,
      state: readiness(strength, item.id, item.skill || item.objective || "letter-name", now),
    }));
    const byId = (a, b) => String(a.item.id).localeCompare(String(b.item.id));

    // A true familiar opener requires at least one independent success. If no
    // item has that evidence, the stable first item opens without a memory claim.
    const opener = rows.filter(row => row.state.familiar)
      .sort((a, b) => b.state.independentSuccesses - a.state.independentSuccesses
        || (a.state.independentMisses - b.state.independentMisses)
        || (b.state.lastIndependent - a.state.lastIndependent)
        || byId(a, b))[0] || rows.slice().sort(byId)[0];
    const rest = rows.filter(row => row !== opener).sort((a, b) => {
      if (a.state.due !== b.state.due) return a.state.due ? -1 : 1;
      const aKnown = a.state.hasIndependentEvidence, bKnown = b.state.hasIndependentEvidence;
      if (aKnown !== bKnown) return aKnown ? -1 : 1;
      const dueAgeA = a.state.lastIndependent ? now - a.state.dueAt : Number.MAX_SAFE_INTEGER;
      const dueAgeB = b.state.lastIndependent ? now - b.state.dueAt : Number.MAX_SAFE_INTEGER;
      if (dueAgeA !== dueAgeB) return dueAgeB - dueAgeA;
      if (a.state.independentMisses !== b.state.independentMisses) return b.state.independentMisses - a.state.independentMisses;
      if (a.state.independentSuccesses !== b.state.independentSuccesses) return a.state.independentSuccesses - b.state.independentSuccesses;
      return byId(a, b);
    });
    const selected = [opener, ...rest].slice(0, cap);
    // Adventures keep their familiar opener and first review priority. Their
    // third place can revisit another TAUGHT letter instead of starving the
    // rest of the garden while beginners still use visible matching support.
    // History is optional; all existing callers retain their original plan.
    if (cap === 3 && rows.length > 3 && Array.isArray(recentIds) && recentIds.length) {
      const recent = new Map(recentIds.filter(id => typeof id === "string").map((id, index) => [id, index]));
      const candidates = rest.filter(row => row !== selected[1]);
      candidates.sort((a, b) => (recent.get(a.item.id) ?? -1) - (recent.get(b.item.id) ?? -1));
      selected[2] = candidates[0];
    }
    return selected.map(row => row.item);
  }

  function support(strength, items, { beginner = false } = {}) {
    return (Array.isArray(items) ? items : []).filter(item => item?.id).map(item => {
      const skill = item.skill || item.objective || "letter-name";
      const state = readiness(strength, item.id, skill);
      const profile = strength?.skillProfile?.(item.id, skill) || {};
      const matching = bucketSummary(profile.matching);
      const listening = state.evidence.listening;
      const assisted = state.evidence.assisted;
      const assistedIsNewest = assisted.last > Math.max(matching.last, listening.last);
      const matchingReady = matching.successes >= 3 && matching.streak >= 2;
      const listeningReady = listening.successes >= 4 && listening.streak >= 2 && listening.sessions.length >= 2;
      const allowRecall = !beginner && !assistedIsNewest && (matchingReady || listeningReady);
      return {
        itemId: item.id,
        choiceCount: listeningReady && !beginner && !assistedIsNewest ? 3 : 2,
        allowRecall,
        beginner: !!beginner,
      };
    });
  }

  ns.GardenLearning = { readiness, plan, support };
})(window.MiftahGame || (window.MiftahGame = {}));
