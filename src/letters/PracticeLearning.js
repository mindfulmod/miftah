// The optional toys share the chapter's gentle learning policy. Their visual
// and motor successes stay in their own skill; they never stand in for hearing.
(function (ns) {
  const eligible = (item, ctx) => item && item.taught !== false && item.isTaught !== false
    && item.locked !== true && item.unlocked !== false
    && (!ctx.completedWorldIds || !(item.prerequisiteWorldIds || []).some(id => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
  const unique = (items, ctx) => [...new Map((items || []).filter(i => i?.id && i.display && eligible(i, ctx)).map(i => [i.id, i])).values()];
  const strength = ctx => ctx.strength || ns.LettersStrength;
  const state = (ctx, item, skill) => strength(ctx)?.skillProfile?.(item.id, skill) || {};
  const bucket = (evidence, skill) => skill === 'first-sound'
    ? evidence.listening || {}
    : ['construction', 'drawing', 'joining', 'alphabet-order', 'syllable-beats'].includes(skill)
      ? evidence.motor || {} : evidence.matching || {};
  const helped = (ctx, item, evidence, practice) => ctx.supportedItemIds?.includes(item.id)
    || (evidence.assisted?.last || 0) > Math.max(practice.last || 0, evidence.listening?.last || 0);

  function level(ctx, items, skill = 'letter-form') {
    const targets = unique(items, ctx);
    if (ctx.beginner || !targets.length) return 0;
    // A mixed board takes the least-established target's support level.
    return Math.min(...targets.map(item => {
      const evidence = state(ctx, item, skill), practice = bucket(evidence, skill);
      if (helped(ctx, item, evidence, practice)) return 0;
      const visits = new Set((practice.sessions || []).filter(Boolean)).size;
      if (practice.r >= 6 && practice.streak >= 3 && visits >= 3) return 2;
      return practice.r >= 3 && practice.streak >= 2 && visits >= 2 ? 1 : 0;
    }));
  }

  function profile(ctx, item, skill = 'letter-name') {
    const base = ns.LettersLearning?.profile?.(item, { ...ctx, skill, challenge: false })
      || { tier: 0, choiceCount: 2, promptMode: 'match', movement: 'still' };
    const evidence = state(ctx, item, skill), practice = bucket(evidence, skill);
    if (ctx.beginner || helped(ctx, item, evidence, practice)) return { ...base, choiceCount: 2, promptMode: 'match', movement: 'still', tier: 0 };
    const visual = !['letter-name', 'recognition', 'friend', 'syllable', 'word-reading'].includes(skill);
    if (visual) return { ...base, choiceCount: level(ctx, [item], skill) ? 3 : 2, promptMode: 'match', movement: 'still' };
    return { ...base, choiceCount: Math.min(3, base.choiceCount), promptMode: ctx.canListen?.() === false ? 'match' : base.promptMode };
  }

  function plan(ctx, items, skill = 'letter-form', count = 4) {
    const pool = unique(items, ctx);
    const random = ctx.random || Math.random;
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const review = item => {
      const evidence = state(ctx, item, skill), practice = bucket(evidence, skill);
      const listening = evidence.listening || {};
      const best = listening.r > 0 ? listening : practice;
      const support = helped(ctx, item, evidence, practice);
      return { familiar: best.r > 0 && !support, support:!!support, due: support || !best.last || Date.now() - best.last >= 86400000,
        successes: best.r || 0, misses: best.w || 0 };
    };
    const opener = pool.find(item => review(item).familiar);
    const rest = pool.filter(item => item !== opener).sort((a, b) => {
      const x = review(a), y = review(b);
      return Number(y.support) - Number(x.support) || Number(y.due) - Number(x.due) || y.misses - x.misses || x.successes - y.successes;
    });
    return [...(opener ? [opener] : []), ...rest].slice(0, Math.max(0, count));
  }

  function orderChars(ctx, chars, skill = 'letter-form', count = chars.length) {
    const declared = [...(ctx.items || []), ...(ctx.known || [])];
    const forbidden = new Set(declared.filter(i => !eligible(i, ctx)).map(i => i.display));
    const items = [...new Set(chars)].filter(c => !forbidden.has(c)).map(c => ({ id: c, display: c }));
    return plan(ctx, items, skill, count).map(i => i.display);
  }

  function hatItems(ctx, worlds) {
    const valid = item => /^[ابتثجحخدذرزسشصضطظعغفقكلمنهوي][ًٌٍَُِ]$/u.test(item?.display || '') && !item.display.startsWith('ا');
    const known = new Set([...(ctx.known || []), ...(ctx.items || [])].filter(i => eligible(i, ctx)).map(i => i.display));
    const done = new Set(ctx.completedWorldIds || []);
    const shelves = (worlds || []).filter(w => ['fatha', 'kasra-damma', 'tanween'].includes(w.id) && (done.has(w.id) || ctx.worldId === w.id));
    const taught = shelves.flatMap(w => w.catalogue || w.items?.() || []).filter(i => valid(i) && known.has([...i.display][0]));
    // Current chapter syllables are already introduced, even before its finish.
    return unique([...(ctx.items || []).filter(valid), ...taught], ctx);
  }

  ns.PracticeLearning = { profile, level, plan, orderChars, hatItems };
})(window.MiftahGame || (window.MiftahGame = {}));
