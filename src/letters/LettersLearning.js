// A small, explicit bridge between mini-game verdicts and durable learning
// evidence. Audio remains presentation: playing "correct" or replaying a prompt
// can never create an outcome by itself.
(function (ns) {
  const TYPES = new Set([
    "supported_visible_matching",
    "independent_listening",
    "assisted_response",
    "motor_assembly_participation",
  ]);

  class LearningSession {
    constructor(strength, clock) {
      this.strength = strength;
      this.clock = clock || (() => performance.now());
      this.round = 0;
      this.current = null;
      this.sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    beginPrompt(item, context = {}) {
      if (!item || !item.id) {
        this.current = null;
        return;
      }
      // Replaying or re-presenting an active prompt is not a new round. A
      // completed round can begin again even when two consecutive targets share
      // the same id.
      if (this.current && !this.current.closed && this.current.itemId === item.id) return;
      this.round += 1;
      this.current = { itemId: item.id, startedAt: this.clock(), assisted: false, closed: false, verdicts: 0, ...context };
    }

    assist() {
      if (this.current && !this.current.closed) this.current.assisted = true;
    }

    report(raw) {
      if (!raw || !raw.itemId) return false;
      const requestedEvidence = raw.evidence || (raw.assisted
        ? "assisted_response"
        : raw.independent ? "independent_listening" : null);
      const requestedCorrect = typeof raw.correct === "boolean"
        ? raw.correct
        : (typeof raw.independent === "boolean" || raw.assisted === true) ? true : undefined;
      if (!TYPES.has(requestedEvidence)) return false;
      if (!this.current || this.current.itemId !== raw.itemId) this.beginPrompt({ id: raw.itemId });
      const state = this.current;
      if (!state || (requestedCorrect === true && state.closed)) return false;

      const assisted = raw.assisted === true || state.assisted;
      const evidence = assisted && typeof requestedCorrect === "boolean"
        ? "assisted_response"
        : requestedEvidence;
      const outcome = {
        itemId: raw.itemId,
        correct: requestedCorrect,
        evidence,
        baseEvidence: requestedEvidence,
        assisted,
        affectsStrength: raw.affectsStrength !== false,
        elapsedMs: Math.max(0, this.clock() - state.startedAt),
        round: this.round,
        sessionId: this.sessionId,
        skill: raw.skill || state.skill || "recognition",
        activity: raw.activity || state.activity || "",
        selectedId: typeof raw.selectedId === "string" ? raw.selectedId : null,
        choiceIds: [...new Set((raw.choiceIds || state.choiceIds || []).filter(id => typeof id === "string"))].slice(0, 8),
      };
      state.verdicts += 1;
      if (requestedCorrect === false) state.assisted = true;
      if (requestedCorrect === true || typeof requestedCorrect !== "boolean") state.closed = true;
      return this.strength?.recordOutcome?.(outcome) !== false ? outcome : false;
    }
  }

  const unique = items => [...new Map((items || []).filter(i => i && i.id && i.display).map(i => [i.id, i])).values()];
  const shuffle = (items, random = Math.random) => {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  function skillFor(item, activity = "") {
    if (["trace", "GardenPaths", "SandTable"].includes(activity)) return "drawing";
    if (activity === "pairs") return "matching-memory";
    // Letter Friends (v26): letter ↔ friend ↔ sound is its own skill.
    if (activity === "FriendFind" || activity === "FriendBook") return "friend";
    if (["build", "blend", "fuse", "unfuse", "chain", "DotGarden"].includes(activity)) return "construction";
    if (item?.promptDisplay && item.promptDisplay !== item.display) return "letter-form";
    if (item?.skill || item?.objective) return item.skill || item.objective;
    if (item?.skel) return "word-reading";
    if (/[ً-ْٰ]/.test(item?.display || "")) return "syllable";
    return Array.from(item?.display || "").length === 1 ? "letter-name" : "sequence-recognition";
  }

  // One dimension changes at a time: match two -> hear two -> hear three ->
  // gently moving three. A new chapter/game always starts with support.
  // Stars and chapter index are deliberately absent from this policy.
  function profile(item, ctx = {}) {
    const skill = ctx.skill || skillFor(item, ctx.activity);
    const strength = ctx.strength || ns.LettersStrength;
    const evidence = strength?.skillProfile?.(item.id, skill) || {};
    const matching = evidence.matching || {};
    const listening = evidence.listening || {};
    const visits = listening.sessions?.length || 0;
    let tier = 0;
    if ((matching.r || 0) >= 3 && (matching.streak || 0) >= 2) tier = 1;
    if ((listening.r || 0) >= 4 && (listening.streak || 0) >= 2 && visits >= 2) tier = 2;
    if ((listening.r || 0) >= 8 && (listening.streak || 0) >= 4 && visits >= 3) tier = 3;
    if ((evidence.assisted?.last || 0) > Math.max(matching.last || 0,listening.last || 0)) tier = 0;
    if (ctx.beginner) tier = 0;
    const recall = tier > 0 && ctx.allowRecall !== false && !item.promptDisplay && !item.skel && ['letter-name','recognition','friend'].includes(skill);
    return {
      skill, tier,
      promptMode: recall ? "listen" : "match",
      choiceCount: ctx.challenge ? 4 : tier >= 2 ? 3 : 2,
      movement: tier >= 3 && !ctx.garden && !ctx.beginner ? "gentle" : "still",
    };
  }

  function planRounds(ctx = {}) {
    const items = unique(ctx.items);
    const count = Math.max(0, Math.min(12, ctx.rounds || 0));
    if (!items.length || !count) return [];
    const random = ctx.random || Math.random;
    const strength = ctx.strength || ns.LettersStrength;
    // Least-seen targets get a turn before another random subset can hide them.
    const targets = shuffle(items, random).sort((a, b) => {
      const seen = i => strength?.skillProfile?.(i.id, ctx.skill || skillFor(i, ctx.activity))?.attempts || 0;
      return seen(a) - seen(b);
    });
    const eligible = item => !ctx.completedWorldIds || !(item.prerequisiteWorldIds || []).some(id => !ctx.completedWorldIds.includes(id) && id !== ctx.worldId);
    const extras = unique(ctx.extraItems).filter(eligible);
    return Array.from({ length: count }, (_, index) => {
      const target = targets[index % targets.length];
      const config = profile(target, ctx);
      const pool = shuffle(unique([...items, ...extras]).filter(i => i.id !== target.id),random);
      const confused=strength?.skillProfile?.(target.id,config.skill)?.confusions || {};
      pool.sort((a,b)=>config.tier<2
        ? Number(contrast(target,a)!=='shape')-Number(contrast(target,b)!=='shape')
        : (confused[b.id] || 0)-(confused[a.id] || 0));
      const options = shuffle([target, ...pool.slice(0, config.choiceCount - 1)], random);
      return { target, options, ...config, promptMode: options.length > 1 ? config.promptMode : "match" };
    });
  }

  function assemblyProfile(item, ctx = {}) {
    const evidence = (ctx.strength || ns.LettersStrength)?.skillProfile?.(item.id, 'construction') || {};
    const successes = (evidence.motor?.r || 0) + (evidence.assisted?.r || 0);
    const pieceBudget = ctx.beginner ? 2 : Math.min(5, 2 + Math.floor(successes / 4));
    return {pieceBudget, decoyCount:ctx.beginner || successes < 2 ? 0 : 1};
  }

  const dotFamilies = ["بتث", "جحخ", "دذ", "رز", "سش", "صض", "طظ", "عغ"];
  function contrast(target, selected) {
    if (!target || !selected || (target.id || target.display) === (selected.id || selected.display)) return null;
    const a = target.display, b = selected.display;
    const plain = value => (value || "").replace(/[ً-ْٰـ]/g, "");
    if (dotFamilies.some(f => f.includes(a) && f.includes(b) && a.length === 1 && b.length === 1)) return "dots";
    if (plain(a) === plain(b)) return "marks";
    return "shape";
  }

  ns.LettersLearning = { LearningSession, evidenceTypes: Array.from(TYPES), skillFor, profile, planRounds, assemblyProfile, contrast };
})(window.MiftahGame || (window.MiftahGame = {}));
