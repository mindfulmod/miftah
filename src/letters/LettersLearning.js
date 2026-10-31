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
    const garden = ns.GardenLearning?.support?.(strength, [{ ...item, skill }], { beginner: !!ctx.beginner })?.[0];
    let tier = 0;
    if ((matching.r || 0) >= 3 && (matching.streak || 0) >= 2) tier = 1;
    if ((listening.r || 0) >= 4 && (listening.streak || 0) >= 2 && visits >= 2) tier = 2;
    if ((listening.r || 0) >= 8 && (listening.streak || 0) >= 4 && visits >= 3) tier = 3;
    if ((evidence.assisted?.last || 0) > Math.max(matching.last || 0,listening.last || 0)) tier = 0;
    if (ctx.beginner) tier = 0;
    // Form recognition always keeps its visible model. It earns a third
    // still choice through successful matching across visits, not listening.
    const visualForm = skill === 'letter-form';
    const matchingVisits = new Set((Array.isArray(matching.sessions) ? matching.sessions : [])
      .filter(id => typeof id === 'string' && id.trim())).size;
    const formReady = !ctx.beginner && (matching.r || 0) >= 3 && (matching.streak || 0) >= 2
      && matchingVisits >= 2 && (evidence.assisted?.last || 0) <= (matching.last || 0);
    const recall = (garden ? garden.allowRecall : tier > 0) && ctx.allowRecall !== false && !item.promptDisplay && !item.skel && ['letter-name','recognition','friend'].includes(skill);
    return {
      skill, tier,
      promptMode: recall ? "listen" : "match",
      choiceCount: ctx.challenge ? 4 : visualForm ? (formReady ? 3 : 2) : garden ? garden.choiceCount : tier >= 2 ? 3 : 2,
      movement: !visualForm && tier >= 3 && !ctx.garden && !ctx.beginner ? "gentle" : "still",
    };
  }

  function planRounds(ctx = {}) {
    const items = unique(ctx.items);
    const count = Math.max(0, Math.min(12, ctx.rounds || 0));
    if (!items.length || !count) return [];
    const random = ctx.random || Math.random;
    const strength = ctx.strength || ns.LettersStrength;
    const eligible = item => !ctx.completedWorldIds || !(item.prerequisiteWorldIds || []).some(id => !ctx.completedWorldIds.includes(id) && id !== ctx.worldId);
    const extras = unique(ctx.extraItems).filter(item => item.taught!==false&&item.isTaught!==false&&item.locked!==true&&item.unlocked!==false&&eligible(item)
      && (!ctx.completedWorldIds || item.taught === true || item.isTaught === true
        || item.prerequisiteWorldIds?.length || ctx.completedWorldIds.includes(item.worldId)));
    // An authored first lesson can isolate one newly taught distinction.
    // Resolve IDs against the supplied lesson and eligible review material;
    // ordinary visits retain the adaptive planner below.
    const contrastPool = unique([...items, ...extras]);
    const contrasts = (Array.isArray(ctx.lessonContrasts) ? ctx.lessonContrasts : []).map(pair => ({
      target: items.find(item => item.id === pair?.targetId),
      other: contrastPool.find(item => item.id === pair?.otherId),
    })).filter(pair => pair.target && pair.other && pair.target.id !== pair.other.id && pair.target.display !== pair.other.display);
    if (contrasts.length && contrasts.length === ctx.lessonContrasts.length) {
      return Array.from({ length: count }, (_, index) => {
        const { target, other } = contrasts[index % contrasts.length];
        return { target, options: shuffle([target, other], random), ...profile(target, ctx),
          choiceCount: 2, promptMode: "match", movement: "still" };
      });
    }
    const now = Date.now();
    const practiceBucketFor = skill => ['drawing','construction','joining'].includes(skill) ? 'motor'
      : ['matching-memory','segmenting','letter-form'].includes(skill) ? 'matching' : null;
    const reviewState = item => {
      const skill=ctx.skill || skillFor(item,ctx.activity);
      const practiceBucket=practiceBucketFor(skill);
      if(!practiceBucket)return ns.GardenLearning?.readiness?.(strength,item.id,skill,now);
      const evidence=strength?.skillProfile?.(item.id,skill)||{},practice=evidence[practiceBucket]||{};
      // Practice is scheduled in its own skill. It is never reclassified as
      // remembered letter names or independent listening.
      const helped=(evidence.assisted?.last||0)>(practice.last||0);
      const formMiss=skill==='letter-form'&&(practice.w||0)>0&&!(practice.streak>0);
      return {familiar:(practice.r||0)>0&&!helped&&!formMiss,due:helped||formMiss||!practice.last||now-practice.last>=86400000,
        independentMisses:practice.w||0,independentSuccesses:practice.r||0};
    };
    const familiar = item => {
      const state = reviewState(item);
      return state ? state.familiar : (strength?.skillProfile?.(item.id, ctx.skill || skillFor(item, ctx.activity))?.listening?.r || 0) > 0;
    };
    // Begin with success in this task, then schedule due/weak targets.
    // Visible form matching is practice, not independent recall. Preserve
    // lesson coverage before repeating any target.
    const targets = shuffle(items, random);
    const opener = targets.filter(familiar).sort((a, b) => {
      const profileFor = item => {
        const skill=ctx.skill||skillFor(item,ctx.activity),evidence=strength?.skillProfile?.(item.id,skill)||{};
        return evidence[practiceBucketFor(skill)||'listening']||{};
      };
      const ap = profileFor(a), bp = profileFor(b);
      return (bp.r || 0) - (ap.r || 0) || (ap.w || 0) - (bp.w || 0) || (bp.last || 0) - (ap.last || 0);
    })[0] || targets[0];
    const rest = targets.filter(item => item !== opener).sort((a, b) => {
      const state = reviewState;
      const as = state(a), bs = state(b);
      if (as && bs) {
        if (as.due !== bs.due) return as.due ? -1 : 1;
        if (as.independentMisses !== bs.independentMisses) return bs.independentMisses - as.independentMisses;
        if (as.independentSuccesses !== bs.independentSuccesses) return as.independentSuccesses - bs.independentSuccesses;
      }
      const seen = item => strength?.skillProfile?.(item.id, ctx.skill || skillFor(item, ctx.activity))?.attempts || 0;
      return seen(a) - seen(b);
    });
    const orderedTargets = [opener, ...rest];
    return Array.from({ length: count }, (_, index) => {
      const target = orderedTargets[index < items.length ? index : (index - items.length) % items.length];
      const config = profile(target, ctx);
      const pool = shuffle(unique([...items, ...extras]).filter(i => i.id !== target.id),random);
      const confused=strength?.skillProfile?.(target.id,config.skill)?.confusions || {};
      const targetSkill = skillFor(target);
      const practiceFamily = item => skillFor(item) !== targetSkill ? 2
        : ['syllable','word-reading'].includes(targetSkill) && target.worldId && item.worldId !== target.worldId ? 1 : 0;
      pool.sort((a,b)=>{
        // A mixed daily bouquet still needs focused questions: compare a word
        // with a taught word, not whichever isolated letter shuffled first.
        if (ctx.worldId === 'daily' && !ctx.challenge) {
          const family = practiceFamily(a) - practiceFamily(b);
          if (family) return family;
        }
        return config.tier<2
          ? Number(contrast(target,a)!=='shape')-Number(contrast(target,b)!=='shape')
          : (confused[b.id] || 0)-(confused[a.id] || 0);
      });
      const options = shuffle([target, ...pool.slice(0, config.choiceCount - 1)], random);
      return { target, options, ...config, promptMode: options.length > 1 ? config.promptMode : "match" };
    });
  }

  function matchingProfile(item, ctx = {}) {
    const evidence = (ctx.strength || ns.LettersStrength)?.skillProfile?.(item.id, 'matching-memory') || {};
    const matching = evidence.matching || {};
    // Lifetime successes do not mean the child is comfortable today. Keep
    // the smaller board after a miss or newer help, using this skill only.
    const ready = !ctx.beginner && (matching.r || 0) >= 3 && (matching.streak || 0) >= 2
      && (evidence.assisted?.last || 0) <= (matching.last || 0);
    return { pairCount: ready ? 3 : 2 };
  }

  function assemblyProfile(item, ctx = {}) {
    const evidence = (ctx.strength || ns.LettersStrength)?.skillProfile?.(item.id, ctx.skill || 'construction') || {};
    // Successful construction practice can add pieces gradually, but mere
    // participation, errors, and assisted responses cannot. Require practice
    // across visits so one short burst never raises the task tier.
    const motor = evidence.motor || {};
    const visits = new Set((motor.sessions || []).filter(id => typeof id === 'string' && id)).size;
    const assistedIsNewest = (evidence.assisted?.last || 0) > (motor.last || 0);
    const successes = assistedIsNewest ? 0 : motor.r || 0;
    const streak = assistedIsNewest ? 0 : motor.streak || 0;
    let pieceBudget = 2;
    if (successes >= 3 && streak >= 2 && visits >= 2) pieceBudget = 3;
    if (successes >= 6 && streak >= 3 && visits >= 3) pieceBudget = 4;
    if (successes >= 10 && streak >= 4 && visits >= 4) pieceBudget = 5;
    if (ctx.beginner) pieceBudget = 2;
    const pieces=Math.min(5,item.parts?.length||2);
    // Expose the full construction first. A decoy comes on a later practice
    // step, rather than alongside a newly added piece.
    const decoyAt=pieces<=2?4:pieces===3?5:pieces===4?8:12;
    const decoyCount=!ctx.beginner&&streak>=2&&pieceBudget>=pieces&&successes>=decoyAt&&visits>=Math.max(2,pieces-1)?1:0;
    return {pieceBudget,decoyCount};
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

  ns.LettersLearning = { LearningSession, evidenceTypes: Array.from(TYPES), skillFor, profile, planRounds, matchingProfile, assemblyProfile, contrast };
})(window.MiftahGame || (window.MiftahGame = {}));
