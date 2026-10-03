// The Letter Garden mini-games. Each game receives a context from the shell:
//   { stage, items, extraItems, rounds, hue, say(item), sfx(name), setPrompt(item),
//     reportOutcome({ itemId, correct, evidence, affectsStrength }),
//     confettiAt(el), onDone(slips) }
// and quizzes the world's items with zero written instructions — the prompt
// is always something the child hears (and sees in the mascot's bubble), and
// the answer is always something they tap.
(function (ns) {
  const Art = ns.LettersArt;
  const DrawingPalette = ns.DrawingPalette || {current:()=>"#4e9677",startForPet:()=>"#4e9677",markup:()=>"",wire:()=>[]};

  function reportOutcome(ctx, item, correct, evidence, affectsStrength = true, details = {}) {
    if (!item?.id) return;
    ctx.reportOutcome?.({
      itemId: item.id,
      correct,
      evidence,
      ...details,
      // Participation is useful evidence, but it is not an answer and must not
      // refresh the legacy answer-recency signal.
      affectsStrength: typeof correct === "boolean" ? affectsStrength : false,
    });
  }

  // These games speak the target and keep its glyph visible in the prompt
  // bubble. Their choices still inform strength, but they are supported visual
  // matching rather than independent listening evidence.
  const reportPromptMatch = (ctx, round, correct, selected, activity) => {
    const target = round?.target || round;
    const diagnostics = Array.isArray(round?.options) ? {
      selectedId: selected?.id,
      choiceIds: round.options.map((item) => item.id),
      skill: round.skill,
      activity,
    } : {};
    // The shell owns prompt visibility and knows whether speech actually
    // completed. Request supported evidence here; it upgrades a successful,
    // genuinely audio-only prompt to independent listening.
    reportOutcome(ctx, target, correct, "supported_visible_matching", true, diagnostics);
  };
  const reportAssembly = (ctx, item, correct) =>
    reportOutcome(ctx, item, correct, "motor_assembly_participation");
  const reportVisibleMatch = (ctx, item, correct) =>
    reportOutcome(ctx, item, correct, "supported_visible_matching", false);

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Pick the round's targets and, for each, distractors with different ids.
  // ctx.level (stars already earned on this world) scales the challenge:
  // seasoned replayers face one extra distractor — adaptive, Brain Age style.
  function buildRounds(ctx) {
    if (!ctx.items || !ctx.items.length || !(ctx.rounds > 0)) return [];
    const planned = ns.LettersLearning?.planRounds?.(ctx);
    if (Array.isArray(planned) && planned.length) {
      return planned.filter((round) => round?.target && Array.isArray(round.options) && round.options.length);
    }
    const pool = shuffle(ctx.items);
    const targets = pool.slice(0, ctx.rounds);
    while (targets.length < ctx.rounds) targets.push(pool[targets.length % pool.length]);
    const optionCount = ctx.beginner ? 2 : (ctx.level || 0) >= (ctx.garden ? 3 : 2) ? 4 : 3;
    return targets.map((target) => {
      const wrong = shuffle(
        ctx.items.concat(ctx.beginner ? [] : (ctx.extraItems || [])).filter((i) => i.id !== target.id),
      );
      const seen = new Set([target.id]);
      const options = [target];
      for (const w of wrong) {
        if (options.length >= optionCount) break;
        if (seen.has(w.id)) continue;
        seen.add(w.id);
        options.push(w);
      }
      return { target, options: shuffle(options), promptMode: "match",
        skill: "letter_recognition", movement: ctx.beginner ? "still" : "gentle" };
    });
  }

  function presentRound(ctx, round, activity) {
    ctx.setPrompt(round.target, {
      promptMode: round.promptMode || "match",
      skill: round.skill || "letter_recognition",
      choiceIds: round.options.map((item) => item.id),
      activity,
    });
    ctx.say(round.target);
  }

  function helpAfterWrong(ctx, round, selected) {
    ctx.showLearningHint?.(round.target, selected);
  }

  // Keep constructor preconditions in one place so the shell can route an
  // incomplete or partially loaded curriculum back to its retry screen before
  // any game creates UI or reaches a completion callback.
  function canStartMiniGame(game, items, extraItems) {
    const pool = Array.isArray(items) ? items : [];
    const extras = Array.isArray(extraItems) ? extraItems : [];
    if (!pool.length) return false;
    if (["pop", "catch", "pairs", "feed", "trace", "burst"].includes(game)) return true;
    if (game === "build") return pool.some((item) => item.parts && item.parts.length >= 2);
    if (["blend", "fuse", "unfuse"].includes(game)) {
      return pool.some((item) => item.parts && item.parts.length === 2);
    }
    if (game === "chain") {
      return pool.some((pair) =>
        pair.parts && pair.parts.length === 2 && pair.join2 &&
        extras.some((letter) =>
          letter.display !== pair.parts[0].display && letter.display !== pair.parts[1].display,
        ),
      );
    }
    if (game === "parade") {
      return extras.some((letter) => letter.joins && letter.display) ||
        pool.some((item) => item.parts && item.parts[0] && item.parts[0].display);
    }
    return false;
  }

  const isArabic = (s) => /[؀-ۿ]/.test(s || "");
  const DIACRITICS = /[ً-ْٰٓ-ٟؐ-ؚۖ-ۭ]/g;

  // Optically centered glyph text. Amiri Quran's ink lands all over its huge
  // em box (ط rides high, م hangs low), so the tile measures each string's
  // real ink (Art.inkShift, canvas TextMetrics) and places the baseline so
  // the visible glyph — not the em box — sits dead centre.
  function glyphText(display, { fill = "#23253f", maxSize = 44, fitWidth = 72, fitHeight = 62, scaleByLength = true } = {}) {
    const latin = !isArabic(display);
    const len = [...display.replace(DIACRITICS, "")].length;
    const size = latin
      ? Math.min(maxSize * 0.6, 26)
      : !scaleByLength || len <= 1 ? maxSize : len <= 2 ? maxSize * 0.9 : len <= 3 ? maxSize * 0.72 : maxSize * 0.58;
    const s = Art.inkShift(display, size, latin);
    return `<text data-fit-box="0,0,${fitWidth},${fitHeight},${size}" x="${s.dx.toFixed(1)}" y="${s.dy.toFixed(1)}" text-anchor="middle"
      font-family="${latin ? "ui-rounded, system-ui, sans-serif" : "'Amiri Quran', serif"}"
      font-size="${size}" fill="${fill}" ${latin ? "" : `direction="rtl"`}>${display}</text>`;
  }

  // Tactile answer card: the same navy outline, warm paper face and shallow
  // physical lift used throughout Letter Garden's new interface system.
  function tileHTML(item, hue) {
    return `
      <svg viewBox="-52 -54 104 106" aria-hidden="true">
        <rect x="-46" y="-38" width="92" height="84" rx="22" fill="#4a3620"/>
        <rect x="-46" y="-46" width="92" height="84" rx="22" fill="hsl(${hue} 52% 86%)" stroke="#4a3620" stroke-width="4"/>
        <rect class="tile-face" x="-39" y="-39" width="78" height="70" rx="16" fill="#fffaf0"/><path d="M-28 -32H26" stroke="#fffdf7" stroke-width="4" stroke-linecap="round"/><path d="M-28 29H28" stroke="#e5dcc8" stroke-width="2.4" stroke-linecap="round"/>
        <g transform="translate(0 -4)">${glyphText(item.display, { maxSize: 42 })}</g>
      </svg>`;
  }

  // Big Brain Academy's rubber band: every correct answer heats the round up
  // a little, every miss cools it down — the child always plays at their edge.
  function makeHeat() {
    let heat = 0;
    return {
      up: () => (heat = Math.min(heat + 1, 8)),
      down: () => (heat = Math.max(heat - 2, 0)),
      factor: () => 1 + heat * 0.11,
      value: () => heat,
    };
  }

  // Activity-specific materials share real, optically fitted curriculum ink.
  function workshopTile(display, material = "wood", maxSize = 42) {
    const leaf = material === "leaf";
    return `<svg viewBox="-52 -54 104 110" aria-hidden="true">
      <path d="M-45-31Q-45-47-29-47H31Q45-47 45-31V31Q45 47 29 47H-29Q-45 47-45 31Z" fill="${leaf?'#4e9677':'#a89478'}" stroke="#4a3620" stroke-width="3"/>
      <rect x="-40" y="-43" width="80" height="84" rx="16" fill="${leaf?'#b7e779':'#e5dcc8'}"/>
      <rect x="-35" y="-35" width="70" height="70" rx="13" fill="#fffaf0"/>
      <path d="M-28-39H26" stroke="#fffdf7" stroke-width="3" stroke-linecap="round"/>
      ${glyphText(display,{maxSize,scaleByLength:maxSize<=42,fitWidth:maxSize>42?62:72,fitHeight:maxSize>42?56:62})}
      ${leaf?'<path d="M30 43Q18 36 24 34Q32 32 34 41Q40 31 43 35Q44 40 34 44" fill="#2f5c46"/>':'<path d="M-28 44H24" stroke="#c9bda4" stroke-width="2.4" stroke-linecap="round"/>'}
    </svg>`;
  }

  function orchardFruit(display) {
    return `<svg viewBox="-64 -76 128 150" aria-hidden="true">
      <ellipse cx="0" cy="62" rx="42" ry="7" fill="#4a3620" opacity=".14"/>
      <path d="M0-40Q-8-62 3-68" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/>
      <path d="M2-53Q6-75 31-63Q26-44 2-53Z" fill="#4e9677"/><path d="M5-55Q14-64 25-62" fill="none" stroke="#b7e779" stroke-width="3"/>
      <path d="M0-43C-47-67-65-17-49 23Q-34 67 0 54Q34 67 49 23C65-17 47-67 0-43Z" fill="#c69434" stroke="#4a3620" stroke-width="3"/>
      <path d="M0-40C-43-60-55-17-43 20Q-27 54 0 44Q29 56 44 20C57-18 42-59 0-40Z" fill="#f3c955"/>
      <path d="M-37-19Q-31-40-16-36" fill="none" stroke="#ffe49a" stroke-width="6" stroke-linecap="round"/>
      <rect x="-37" y="-31" width="74" height="64" rx="24" fill="#fffaf0"/>
      ${glyphText(display,{maxSize:40,fill:'#4a3620'})}
    </svg>`;
  }

  function orchardBasket(frontOnly = false) {
    return `<svg viewBox="0 0 180 112" aria-hidden="true">${frontOnly ? '' : `
      <ellipse cx="90" cy="103" rx="72" ry="7" fill="#4a3620" opacity=".16"/>
      <path d="M42 53C39 3 139 3 138 53" fill="none" stroke="#4a3620" stroke-width="8"/>
      <path d="M42 51C42 11 136 11 138 51" fill="none" stroke="#c9bda4" stroke-width="4"/>
      <ellipse cx="90" cy="52" rx="74" ry="17" fill="#4a3620"/>`}
      <path d="M18 53L30 91Q90 110 150 91L162 53Q90 76 18 53Z" fill="#c9bda4" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/>
      <path d="M27 62L37 86Q90 102 143 86L153 62Q90 82 27 62Z" fill="#e5dcc8"/>
      <path d="M25 70Q90 90 155 70M28 83Q90 101 152 83M46 63L51 98M75 70L76 102M105 70L103 102M134 63L129 98" fill="none" stroke="#a89478" stroke-width="2.4"/>
      <path d="M20 52Q90 76 160 52" fill="none" stroke="#fffaf0" stroke-width="4" stroke-linecap="round"/>
      <path d="M85 83Q65 67 64 81Q65 94 87 92Q104 69 115 79Q113 93 91 94" fill="#4e9677" stroke="#4a3620" stroke-width="1.6"/>
    </svg>`;
  }

  function matchingSprout() {
    return `<svg viewBox="0 0 72 86" aria-hidden="true"><ellipse cx="36" cy="79" rx="29" ry="5" fill="#4a3620" opacity=".18"/>
      <g class="pairs-sprout"><path d="M36 59V25" stroke="#2f5c46" stroke-width="4" stroke-linecap="round"/><path d="M35 43Q7 41 13 20Q36 19 35 43M37 34Q40 8 63 13Q64 35 37 34" fill="#7fce54"/><path d="M17 23Q26 26 31 36M43 27Q48 19 57 18" fill="none" stroke="#b7e779" stroke-width="3" stroke-linecap="round"/></g>
      <path d="M14 54H58L53 74Q36 81 19 74Z" fill="#c25a49" stroke="#4a3620" stroke-width="2.4"/><path d="M20 58H52L48 70Q36 75 24 70Z" fill="#ee806f"/><path d="M18 55H54" stroke="#ffa798" stroke-width="4" stroke-linecap="round"/></svg>`;
  }

  // ---------- Pond: hear it, find it, keep it until ready ----------
  class PopGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.rounds = buildRounds(ctx);
      this.roundIndex = 0;
      this.slips = 0;
      this.alive = true;
      this.timers = new Set();
      if (!this.rounds.length) { this.alive = false; ctx.onDone(0); return; }
      this.bubbles = [];
      ctx.stage.innerHTML = `${ns.LettersGardenArt.pond()}<div class="pop-sky"></div><div class="pond-dock" aria-hidden="true"><svg class="pond-dock-pier" viewBox="0 0 300 64" preserveAspectRatio="none"><path d="M30 40V62M150 40V62M270 40V62" stroke="#70501b" stroke-width="8" stroke-linecap="round"/><rect x="4" y="8" width="292" height="38" rx="10" fill="#c69434" stroke="#4a3620" stroke-width="3"/><path d="M8 18H292" stroke="#ffe49a" stroke-width="3" stroke-linecap="round" opacity=".6"/><path d="M78 10V44M150 10V44M222 10V44" stroke="#a89478" stroke-width="2.4"/></svg><span class="pond-dock-slots"></span></div><div class="pond-finish" hidden><button type="button" class="pond-replay lg-round-btn" aria-label="Hear the found letter again">${Art.icon('speaker',30)}</button><button type="button" class="pond-next lg-big-btn" aria-label="Continue">${Art.icon('next',36)}</button></div>`;
      this.sky = ctx.stage.querySelector(".pop-sky");
      this.finishEl = ctx.stage.querySelector('.pond-finish');
      this.nextBtn = ctx.stage.querySelector('.pond-next');
      this.replayBtn = ctx.stage.querySelector('.pond-replay');
      // Update 4: each find is retrieved to a little jetty that fills over the
      // game. Docking happens after the verdict and never reports or scores.
      this.dockEl = ctx.stage.querySelector('.pond-dock');
      this.dockSlots = ctx.stage.querySelector('.pond-dock-slots');
      this.docked = [];
      this.renderDock();
      this.nextBtn.onclick = event => {if(event.detail<2)this.advance();};
      this.replayBtn.onclick = () => this.replayFound();
      // Perf: bubbles move via transform (composited), not top (layout).
      // The sky height is measured once and on resize, never per frame.
      this.skyH = this.sky.clientHeight || 1;
      this.onResize = () => {
        this.skyH = this.sky.clientHeight || 1;
        this.sky.style.setProperty('--pond-height',`${this.skyH}px`);
        this.widePond = this.sky.clientWidth > this.skyH * 1.8 && this.skyH < 260;
        this.sky.dataset.rows = this.laneCount > 2 && !this.widePond ? '2' : '1';
        this.bubbles.forEach(b=>this.layoutBubble(b));
        if(this.completionReady)this.keepFoundVisible();
      };
      this.onResize();
      window.addEventListener("resize", this.onResize);
      this.startRound();
      this.lastTime = performance.now();
      this.tick = this.tick.bind(this);
      this.frame=requestAnimationFrame(this.tick);
    }

    startRound() {
      if (!this.alive) return;
      this.releaseActiveDrag?.();
      this.advancing = false; this.completionReady = false;
      this.found = null;
      this.sky.classList.remove('has-found');
      this.finishEl.hidden = true;
      this.nextBtn.disabled = true; this.replayBtn.disabled = true;
      const round = this.rounds[this.roundIndex];
      this.ctx.setRoundProgress?.(this.roundIndex + 1, this.rounds.length);
      presentRound(this.ctx, round, "pop");
      for (const b of this.bubbles) b.el.remove();
      this.bubbles = [];
      // One lane per option — seasoned replayers get 4 options, so the lane
      // count must follow (a fixed [0,1,2] left the 4th bubble unplaced).
      this.laneCount = round.options.length;
      this.sky.dataset.rows = this.laneCount > 2 && !this.widePond ? '2' : '1';
      const lanes = shuffle([...Array(this.laneCount).keys()]);
      round.options.forEach((item, i) => this.spawn(item, lanes[i]));
    }

    spawn(item, lane) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "pop-bubble";
      el.innerHTML = this.ctx.garden ? ns.LettersGardenArt.seedPacket(glyphText(item.display,{maxSize:44})) : tileHTML(item, this.ctx.hue);
      el.innerHTML += `<span class="pond-contact" aria-hidden="true">${ns.LettersGardenArt.pondFloat()}</span>`;
      el.setAttribute("aria-label", item.display);
      const movement = this.rounds?.[this.roundIndex]?.movement ||
        ((this.ctx.garden || this.ctx.referenceJourney || this.ctx.beginner) ? "still" : "gentle");
      const stationary = movement !== "gentle" || !!this.ctx.reducedMotion?.();
      const bubble = { el, item, lane, stationary, y: .18+lane*.16 };
      this.layoutBubble(bubble);
      el.addEventListener("click", (event) => this.popAttempt(bubble, event));
      this.sky.appendChild(el);
      this.bubbles.push(bubble);
    }

    layoutBubble(bubble) {
      const {el,lane,stationary}=bubble;
      const laneW=84/Math.max(2,this.laneCount||3),grid=stationary&&this.laneCount>2&&!this.widePond;
      el.style.width=`${stationary&&this.ctx.garden&&!this.widePond?32:laneW-2}%`;
      el.style.left=`${stationary?(grid?28+(lane%2)*44:8+(lane+.5)*laneW):6+lane*laneW}%`;
      if(stationary || this.widePond)bubble.y=grid ? .17+Math.floor(lane/2)*.43 : .35;
      bubble.restY=bubble.y;
      el.style.transform=`translate3d(${stationary?'-50%':'0'}, ${bubble.y*this.skyH}px, 0)`;
    }

    pondRipple(bubble, event) {
      // The ring belongs to the water, not to the packet's positioning transform.
      const water = this.sky?.getBoundingClientRect?.();
      if (!water?.width || !water?.height) return;
      const packet = bubble.el.getBoundingClientRect();
      const ring = document.createElement('span');
      ring.className = 'pond-touch-ring';
      ring.setAttribute('aria-hidden', 'true');
      const point = event?.detail > 0 && Number.isFinite(event.clientX);
      const x = point ? event.clientX : packet.left + packet.width / 2;
      // Water reacts at the packet's contact edge, where it stays visible as
      // the paper lifts away instead of hiding underneath the letter.
      const y = packet.top + packet.height * .9;
      ring.style.left = `${Math.max(4, Math.min(96, (x-water.left)/water.width*100))}%`;
      ring.style.top = `${Math.max(4, Math.min(96, (y-water.top)/water.height*100))}%`;
      this.sky.appendChild(ring);
      this.later(() => ring.remove(), 620);
    }

    popAttempt(bubble, event) {
      if (this.alive && this.completionReady && bubble === this.found) {
        // Tapping the found packet again brings it to the jetty (= Continue).
        if (this.clock() - (this.foundAt || 0) > 500) this.advance();
        return;
      }
      if (!this.alive || this.advancing || !this.bubbles.includes(bubble) || bubble.el.classList.contains("is-popped") || bubble.el.classList.contains("is-scaffolded") || bubble.el.classList.contains("is-no")) return;
      this.pondRipple(bubble, event);
      const round = this.rounds[this.roundIndex];
      if (bubble.item.id === round.target.id) {
        this.advancing = true;
        if(this.frame!=null)cancelAnimationFrame(this.frame);
        this.frame=null;
        this.found=bubble;
        bubble.el.classList.remove('is-helpful');
        bubble.el.classList.add("is-found");
        this.sky.classList.add('has-found');
        this.bubbles.forEach(b=>b.el.disabled=b!==bubble);
        this.foundAt = this.clock();
        bubble.el.setAttribute?.("aria-label", `Bring ${bubble.item.display} to the jetty`);
        this.ctx.clearLearningHint?.();
        reportPromptMatch(this.ctx, round, true, bubble.item, "pop");
        this.ctx.sfx("correct");
        this.ctx.confettiAt(bubble.el);
        this.ctx.say(round.target);
        this.ctx.petReact?.('proud');
        this.ctx.pet?.cheer(() => this.ctx.pet?.inspect(bubble.el, 1400));
        this.completionReady = true;
        this.finishEl.hidden = false;
        this.keepFoundVisible();
        this.nextBtn.disabled = false; this.replayBtn.disabled = false;
        this.nextBtn.focus?.({preventScroll:true});
      } else {
        this.slips += 1;
        reportPromptMatch(this.ctx, round, false, bubble.item, "pop");
        helpAfterWrong(this.ctx, round, bubble.item);
        this.ctx.sfx("wrong");
        // A small nudge and the existing comparison invite another try.
        // Shake the inner svg, not the button: the button's transform is the
        // bubble's position now, and the shake animation would override it.
        const svg = bubble.el.querySelector("svg");
        svg.classList.remove("is-shake");
        void svg.offsetWidth;
        svg.classList.add("is-shake");
        bubble.el.classList.add("is-no");
        bubble.el.disabled = true;
        // The pet looks at the child's own pick, then wonders. It never looks at the answer.
        this.ctx.pet?.inspect(bubble.el, 450, () => this.ctx.pet?.ponder());
        const retryRound = this.roundIndex;
        if (this.ctx.beginner) this.bubbles.find(b => b.item.id === round.target.id)?.el.classList.add("is-helpful");
        this.later(() => {
          if (this.advancing || this.roundIndex !== retryRound || !this.bubbles.includes(bubble)) return;
          bubble.el.classList.remove("is-no");
          // Scaffolded retry: the wrong pick quietly leaves the sky.
          bubble.el.classList.add("is-scaffolded");
        }, 750);
        if (this.ctx.pulsePrompt) this.ctx.pulsePrompt();
        this.ctx.say(round.target); // repeat the question, never scold
      }
    }

    advance() {
      if (!this.alive || !this.completionReady) return;
      this.completionReady = false;
      this.nextBtn.disabled = true; this.replayBtn.disabled = true;
      this.dock(this.found);
      this.roundIndex += 1;
      if (this.roundIndex >= this.rounds.length) return this.finish();
      this.startRound();
      this.bubbles[0]?.el.focus?.({preventScroll:true});
      this.lastTime=performance.now();
      this.frame=requestAnimationFrame(this.tick);
    }

    clock() { return globalThis.performance?.now?.() ?? Date.now(); }

    renderDock(fresh = -1) {
      if (!this.dockSlots) return;
      const total = Math.max(1, Math.min(6, this.rounds.length));
      this.dockSlots.style?.setProperty?.('--dock-count', total);
      this.dockSlots.innerHTML = Array.from({ length: total }, (_, i) => {
        const art = this.docked[i];
        return `<i class="pond-dock-slot${art ? ' is-full' : ''}${i === fresh ? ' is-new' : ''}">${art || ''}</i>`;
      }).join('');
    }

    // The found packet sails to its jetty slot. The next round starts at once;
    // the flight is a page-level ghost so it never delays or blocks play.
    dock(found) {
      const art = found?.el?.querySelector?.('svg')?.outerHTML;
      if (!art || !this.dockSlots || this.docked.length >= Math.min(6, this.rounds.length)) return;
      const index = this.docked.length;
      const from = found.el.querySelector('svg').getBoundingClientRect?.();
      this.docked.push(art);
      this.ctx.sfx?.('dock');
      const reduced = !!this.ctx.reducedMotion?.();
      if (reduced || !from?.width || typeof document === 'undefined' || !document.body?.appendChild) { this.renderDock(index); return; }
      this.renderDock();
      const slot = this.dockSlots.children?.[index], to = slot?.getBoundingClientRect?.();
      if (!slot || !to?.width) { this.renderDock(index); return; }
      slot.classList.add('is-waiting');
      const ghost = document.createElement('div');
      ghost.className = 'pond-dock-ghost';
      ghost.setAttribute('aria-hidden', 'true');
      ghost.innerHTML = art;
      Object.assign(ghost.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
      document.body.appendChild(ghost);
      this.ghosts = (this.ghosts || new Set()).add(ghost);
      const dx = to.left + to.width / 2 - (from.left + from.width / 2), dy = to.top + to.height / 2 - (from.top + from.height / 2);
      const scale = Math.min(to.width / from.width, to.height / from.height) * .92;
      const flight = ghost.animate?.([
        { transform: 'none' },
        { transform: `translate(${dx * .5}px, ${dy * .5 - 18}px) rotate(-6deg) scale(${(1 + scale) / 2})`, offset: .55 },
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
      ], { duration: 560, easing: 'cubic-bezier(.3,.7,.3,1)' });
      const land = () => {
        ghost.remove(); this.ghosts?.delete(ghost);
        if (!this.alive) return;
        slot.classList.remove('is-waiting');
        slot.classList.add('is-full', 'is-new');
        slot.innerHTML = art;
        this.ctx.pet?.inspect?.(slot, 600);
      };
      if (flight) flight.onfinish = land; else land();
    }

    keepFoundVisible() {
      if(!this.found || !this.skyH)return;
      const b=this.found,height=b.el.offsetHeight||0;
      const water=this.sky.getBoundingClientRect?.(),dock=this.finishEl.getBoundingClientRect?.();
      const packet=b.el.getBoundingClientRect?.();
      // Only reserve the dock's space when it sits under this packet. In
      // landscape the dock is beside the water, so the full height is available.
      const aboveDock=water&&dock?.width&&packet&&packet.right>dock.left&&packet.left<dock.right;
      const available=aboveDock?Math.min(this.skyH,dock.top-water.top-12):this.skyH;
      const jetty=this.dockEl?.getBoundingClientRect?.(),floor=water&&jetty?.height?Math.max(.04,(jetty.bottom-water.top+4)/this.skyH):.04;
      b.y=Math.max(floor,Math.min(b.y,Math.max(floor,(available-height*1.18)/this.skyH)));
      b.el.style.transform=`translate3d(${b.stationary?'-50%':'0'}, ${b.y*this.skyH}px, 0)`;
    }

    replayFound() {
      if (!this.alive || !this.completionReady) return;
      this.ctx.say(this.rounds[this.roundIndex].target);
      this.ctx.petReact?.('listening');
      this.ctx.pet?.inspect(this.found?.el, 900);
    }

    later(fn, delay) {
      const timer=setTimeout(()=>{this.timers.delete(timer);if(this.alive)fn();},delay);
      this.timers.add(timer);
    }

    tick(now) {
      this.frame=null;
      if (!this.alive || this.advancing) return;
      this.lastTime = now;
      for (const b of this.bubbles) {
        if (b.el.classList.contains("is-scaffolded")) continue;
        const movement = this.rounds?.[this.roundIndex]?.movement ||
          ((this.ctx.garden || this.ctx.referenceJourney || this.ctx.beginner) ? "still" : "gentle");
        const stationary = movement !== "gentle" || !!this.ctx.reducedMotion?.();
        b.stationary=stationary;
        // Water moves a little; taught choices never leave while a child thinks.
        if (!stationary) b.y = b.restY + Math.sin(now * .0015 + (b.lane||0)*1.7) * .018;
        else if (this.ctx.reducedMotion?.() && !this.ctx.garden && !this.ctx.referenceJourney && !this.rounds?.[this.roundIndex]) b.y = 0.35;
        else b.y = stationary ? b.restY : 0.35;
        b.el.style.transform = `translate3d(${stationary ? "-50%" : "0"}, ${b.y * this.skyH}px, 0)`;
      }
      this.frame=requestAnimationFrame(this.tick);
    }

    finish() {
      if (!this.alive) return;
      this.destroy();
      this.ctx.onDone(this.slips);
    }

    destroy() {
      this.alive = false; this.completionReady = false;
      if(this.frame!=null)cancelAnimationFrame(this.frame);
      this.frame=null;
      this.timers?.forEach(clearTimeout); this.timers?.clear();
      this.ghosts?.forEach(ghost => ghost.remove()); this.ghosts?.clear();
      window.removeEventListener("resize", this.onResize);
    }
  }

  // ---------- Catch: slide the basket, catch what you hear ----------
  class CatchGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.rounds = buildRounds(ctx);
      this.roundIndex = 0;
      this.slips = 0;
      this.alive = true;
      if (!this.rounds.length) { this.alive = false; ctx.onDone(0); return; }
      this.fallers = [];
      this.still = !!ctx.reducedMotion?.() || this.rounds[0]?.movement !== "gentle";
      ctx.stage.innerHTML = `
        <div class="catch-field"></div><div class="catch-result" hidden></div>
        <div class="catch-basket" tabindex="0" role="slider" aria-label="Move the basket" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
          ${orchardBasket()}
        </div><div class="catch-basket catch-basket-front" aria-hidden="true">${orchardBasket(true)}</div>`;
      this.field = ctx.stage.querySelector(".catch-field");
      this.basket = ctx.stage.querySelector(".catch-basket");
      // A short collection project (update 4): the basket shows a slot for each
      // fruit to gather and fills as the child catches them.
      this.harvest = [];
      // Fruit sits inside the basket's own drawing, between its interior and rim.
      const back = this.basket?.querySelector?.("svg"), interior = back?.querySelector?.('ellipse[rx="74"]');
      if (interior) interior.insertAdjacentHTML("afterend", '<g class="catch-pile" aria-hidden="true"></g>');
      this.pile = back?.querySelector?.(".catch-pile");
      this.renderPile();
      this.result = ctx.stage.querySelector(".catch-result");
      ctx.stage.classList.toggle("catch-still",this.still);
      if(this.still){this.basket.removeAttribute("role");this.basket.removeAttribute("tabindex");this.basket.setAttribute("aria-hidden","true");}
      // Perf: fallers move via transform, height measured outside the loop.
      this.fieldH = this.field.clientHeight || 1;
      this.onResize = () => {
        this.fieldH = this.field.clientHeight || 1;
        this.positionBasket(this.basketX);
      };
      window.addEventListener("resize", this.onResize);
      this.heat = makeHeat();
      this.basketX = 0.5;
      const move = (event) => {
        if(!this.alive || this.still || this.settling)return;
        const rect = ctx.stage.getBoundingClientRect();
        if (rect.width > 0) this.positionBasket((event.clientX - rect.left) / rect.width);
      };
      this.keyBasket = event => {
        if(!this.alive || this.still || this.settling)return;
        const steps = {ArrowLeft:-.08, ArrowRight:.08};
        if (!(event.key in steps) && event.key !== 'Home' && event.key !== 'End') return;
        event.preventDefault();
        this.positionBasket(event.key === 'Home' ? 0 : event.key === 'End' ? 1 : this.basketX + steps[event.key]);
      };
      this.basket.addEventListener('keydown', this.keyBasket);
      this.moveBasket = move;
      ctx.stage.addEventListener("pointermove", move);
      ctx.stage.addEventListener("pointerdown", move);
      this.frame = null;
      this.tick = this.tick.bind(this);
      this.startRound();
    }

    positionBasket(x) {
      if (!this.alive || this.settling || !Number.isFinite(x)) return;
      const width = this.ctx.stage.getBoundingClientRect().width;
      if (width <= 0) return;
      const edge = Math.min(.5, (this.basket.getBoundingClientRect().width / 2 + 2) / width);
      this.basketX = Math.max(edge, Math.min(1-edge, x));
      this.basket.style.left = `${this.basketX * 100}%`;
      const available = 1-2*edge;
      this.basket.setAttribute('aria-valuenow', String(available > 0 ? Math.round((this.basketX-edge)/available*100) : 50));
    }

    renderPile(fresh = false) {
      if (!this.pile) return;
      const total = Math.max(1, Math.min(6, this.rounds?.length || 1));
      const xs = Array.from({ length: total }, (_, i) => 90 + (i - (total - 1) / 2) * Math.min(30, 132 / total));
      this.pile.innerHTML = `${xs.map((x, i) => {
        const y = 46 - (i % 2) * 5, got = i < (this.harvest || []).length;
        return got
          ? `<g class="pile-fruit${fresh && i === (this.harvest || []).length - 1 ? ' is-new' : ''}"><path d="M${x} ${y - 11}Q${x - 1} ${y - 16} ${x + 2} ${y - 18}" stroke="#4a3620" stroke-width="1.6" fill="none"/><circle cx="${x}" cy="${y}" r="12" fill="#f3c955" stroke="#4a3620" stroke-width="2.4"/><circle cx="${x - 4}" cy="${y - 4}" r="3.5" fill="#ffe49a"/></g>`
          : `<circle class="pile-slot" cx="${x}" cy="${y}" r="11" fill="none" stroke="#c9bda4" stroke-width="2.4" stroke-dasharray="3 4"/>`;
      }).join('')}`;
    }

    startRound(focus = false) {
      if (!this.alive) return;
      this.settling = false;
      this.landing?.cancel();
      this.result.hidden = true;
      this.result.innerHTML = "";
      this.ctx.stage.classList.remove("is-harvested");
      this.positionBasket(.5);
      this.lastTime = performance.now();
      this.spawnTimer = 0;
      this.spawnFlip = false;
      const round = this.rounds[this.roundIndex];
      this.still = !!this.ctx.reducedMotion?.() || round.movement !== "gentle";
      this.ctx.stage.classList.toggle("catch-still", this.still);
      this.clearFallers();
      if (this.still) {
        this.basket.removeAttribute("role");
        this.basket.removeAttribute("tabindex");
        this.basket.setAttribute("aria-hidden", "true");
      } else {
        this.basket.setAttribute("role", "slider");
        this.basket.setAttribute("tabindex", "0");
        this.basket.removeAttribute("aria-hidden");
      }
      this.ctx.setRoundProgress?.(this.roundIndex + 1, this.rounds.length);
      presentRound(this.ctx, round, "catch");
      if(this.still)this.stationaryChoices(round);
      else this.requestTick();
      if (focus) (this.fallers[0]?.el || this.basket).focus?.({preventScroll:true});
    }

    stationaryChoices(round) {
      this.clearFallers();
      this.settling = false;
      round.options.forEach((item,i) => {
        const el=document.createElement('button');
        el.type='button';el.className='catch-faller catch-choice';
        el.setAttribute('aria-label',item.display);
        el.innerHTML=orchardFruit(item.display);
        const x=.18+(round.options.length>1?i*.64/(round.options.length-1):.32);
        el.style.left=`${x*100}%`;el.style.top='25%';
        const f={el,item,x};this.fallers.push(f);this.field.appendChild(el);
        el.addEventListener('click',()=>this.catchStationary(f));
        f.resetDrag=ns.GardenPractice?.draggable(el,{
          enabled:()=>this.alive&&!this.settling&&this.fallers.includes(f),
          onDragMove:(x,y)=>this.basket.classList.toggle('is-near',this.basketContains(x,y)),
          onDragEnd:()=>this.basket.classList.remove('is-near'),
          drop:(x,y,released)=>{if(this.basketContains(x,y))this.catchStationary(f,released);}
        });
      });
    }

    basketContains(x,y) {
      const r=this.basket.getBoundingClientRect();
      return r.width>0&&r.height>0&&x>=r.left-20&&x<=r.right+20&&y>=r.top-12&&y<=r.bottom+20;
    }

    catchesFruit(f,previousY) {
      // The opening is y=52 in the basket's 180×112 artwork. Follow the
      // rendered mouth after resize, not an unrelated fraction of the field.
      const b=this.basket.getBoundingClientRect(),r=f.el.getBoundingClientRect();
      if(!b.width||!b.height||!r.width||!r.height)return false;
      const rim=b.top+b.height*52/112;
      const center=r.top+r.height*.6;
      const before=center-(f.y-previousY)*this.fieldH;
      const halfOpening=b.width*74/180;
      const fruitCore=r.width*.22;
      return center>=rim-12&&before<=rim+12&&Math.abs(r.left+r.width/2-(b.left+b.width/2))<=halfOpening+fruitCore;
    }

    catchStationary(f,releaseRect=null) {
      if(!this.alive || this.settling || !this.fallers.includes(f))return;
      const round=this.rounds[this.roundIndex];
      // Keep the stationary basket in place during a retry; the destination
      // should not move away from a child who is learning to drag.
      if(f.item.id!==round.target.id){
        this.slips++;this.heat.down();reportPromptMatch(this.ctx,round,false,f.item,"catch");helpAfterWrong(this.ctx,round,f.item);this.ctx.sfx('wrong');
        round.options=round.options.filter(o=>o.id!==f.item.id);
        this.remove(f);this.ctx.say(round.target);return;
      }
      this.success(f,releaseRect);
    }

    success(f,releaseRect=null) {
      if (!this.alive || this.settling) return;
      const round = this.rounds[this.roundIndex];
      if (f.item.id !== round.target.id) return;
      const from = releaseRect || f.el.getBoundingClientRect();
      this.settling = true;
      this.ctx.clearLearningHint?.();
      if (this.frame != null) cancelAnimationFrame(this.frame);
      this.frame = null;
      this.heat.up();
      reportPromptMatch(this.ctx, round, true, f.item, "catch");
      this.ctx.sfx("correct");
      this.ctx.say(round.target);
      this.clearFallers();
      this.ctx.stage.classList.add("is-harvested");
      (this.harvest ||= []).push(round.target.display);
      this.renderPile(true);
      this.basket.removeAttribute("role");this.basket.removeAttribute("tabindex");this.basket.setAttribute("aria-hidden","true");
      this.basketX=.5;
      this.basket.style.left="";
      this.result.hidden = false;
      this.result.innerHTML = `<button type="button" class="catch-replay" aria-label="Hear ${round.target.display}">${orchardFruit(round.target.display)}<span class="orchard-listen" aria-hidden="true">${Art.icon('speaker',22)}</span></button><button type="button" class="orchard-next catch-next" aria-label="${this.roundIndex === this.rounds.length - 1 ? 'Finish catching' : 'Next fruit'}">${Art.icon('next',32)}</button>`;
      const replay = this.result.querySelector('.catch-replay');
      const current = this.roundIndex;
      replay.onclick = () => { if(this.alive && this.settling && this.roundIndex === current)this.ctx.say(round.target); };
      const next = this.result.querySelector('.catch-next');
      next.onclick = event => { if(this.roundIndex === current)this.nextRound(event?.detail === 0); };
      next.focus?.({preventScroll:true});
      // Carry the same fruit from its touched/falling location to the basket.
      // Input stays available throughout; leaving cancels this visual-only flight.
      const fruit = replay.querySelector('svg');
      if (!this.ctx.reducedMotion?.() && fruit?.animate) {
        const to = fruit.getBoundingClientRect();
        if (from.width && to.width)this.landing = fruit.animate([
          {transform:`translate(${from.left-to.left}px, ${from.top-to.top}px) scale(${from.width/to.width})`,transformOrigin:'0 0'},
          {transform:'none',transformOrigin:'0 0'}
        ], {duration:320,easing:'cubic-bezier(.2,.7,.25,1)'});
      }
      this.ctx.confettiAt(replay);
    }

    nextRound(focus = false) {
      if (!this.alive || !this.settling) return;
      this.settling = false;
      this.roundIndex++;
      if (this.roundIndex >= this.rounds.length) return this.finish();
      this.startRound(focus);
    }

    requestTick() {
      if (!this.alive || this.still || this.settling || this.frame != null) return;
      this.frame = requestAnimationFrame(now => {this.frame = null;this.tick(now);});
    }

    spawn() {
      const round = this.rounds[this.roundIndex];
      // Always keep the target reachable: alternate target / distractor.
      // (options is shuffled, so the target's slot is unknown — filter it out
      // rather than assuming it sits at index 0.)
      this.spawnFlip = !this.spawnFlip;
      const distractors = round.options.filter((o) => o.id !== round.target.id);
      const item = this.spawnFlip
        ? round.target
        : distractors[Math.floor(Math.random() * distractors.length)] || round.target;
      const el = document.createElement("button");
      el.type = "button";
      el.className = "catch-faller";
      el.setAttribute("aria-label", item.display);
      el.innerHTML = orchardFruit(item.display);
      const x = 0.12 + Math.random() * 0.76;
      el.style.left = `${x * 100}%`;
      this.field.appendChild(el);
      const pace = 1 + 0.2 * (this.ctx.level || 0);
      const f = { el, item, x, y: -0.15, speed: (0.16 + Math.random() * 0.05) * pace };
      el.style.transform = `translate3d(-50%, ${f.y * this.fieldH}px, 0)`;
      this.fallers.push(f);
      el.addEventListener("click",()=>this.catchStationary(f));
    }

    tick(now) {
      if (!this.alive || this.still || this.settling) return;
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.fallers.length < 3) {
        this.spawn();
        this.spawnTimer = 1.1;
      }
      const round = this.rounds[this.roundIndex];
      for (const f of this.fallers.slice()) {
        const previousY=f.y;
        f.y += f.speed * this.heat.factor() * dt;
        f.el.style.transform = `translate3d(-50%, ${f.y * this.fieldH}px, 0)`;
        if (this.catchesFruit(f,previousY)) {
          if (f.item.id === round.target.id) return this.success(f);
          this.remove(f);
          this.slips += 1;
          this.heat.down();
          reportPromptMatch(this.ctx, round, false, f.item, "catch");
          helpAfterWrong(this.ctx, round, f.item);
          this.ctx.sfx("wrong");
          this.basket.classList.remove("is-shake");
          void this.basket.offsetWidth;
          this.basket.classList.add("is-shake");
          // Scaffolded retry: that distractor doesn't fall again this round.
          round.options = round.options.filter(
            (o) => o.id === round.target.id || o.id !== f.item.id,
          );
        } else if (f.y > 1.05) {
          const missedTarget = f.item.id === round.target.id;
          this.remove(f);
          if (missedTarget) {
            // Missing the basket is motor practice, not evidence that the child
            // chose a wrong letter. Slow the stream, replay the prompt, and make
            // the next spawn the target without adding a slip or recording a
            // wrong recognition in the shell's sfx wiretap.
            this.heat.down();
            this.spawnFlip = false;
            this.spawnTimer = Math.min(this.spawnTimer, 0.18);
            presentRound(this.ctx, round, "catch");
            this.ctx.pulsePrompt?.();
          }
        }
      }
      this.requestTick();
    }

    remove(f) {
      f.resetDrag?.();
      f.el.remove();
      this.fallers = this.fallers.filter((x) => x !== f);
    }

    clearFallers() {
      for (const f of (this.fallers || [])) {f.resetDrag?.();f.el.remove();}
      this.fallers = [];
    }

    finish() {
      if (!this.alive) return;
      this.alive = false;
      this.destroy();
      this.ctx.onDone(this.slips);
    }

    destroy() {
      this.alive = false;
      if (this.frame != null) cancelAnimationFrame(this.frame);
      this.frame = null;
      this.landing?.cancel();
      window.removeEventListener("resize", this.onResize);
      this.ctx.stage?.removeEventListener?.("pointermove",this.moveBasket);
      this.ctx.stage?.removeEventListener?.("pointerdown",this.moveBasket);
      this.basket?.removeEventListener?.('keydown',this.keyBasket);
      this.clearFallers();
    }
  }

  // ---------- Pairs: find the two that belong together ----------
  class PairsGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      this.slips = 0;
      this.boards = ctx.rounds === 2 ? 1 : 2;
      this.boardIndex = 0;
      if (ctx.beginner) {
        const seen = new Set();
        this.beginnerPairs = [];
        for (const item of shuffle(ctx.items)) {
          if (seen.has(item.id)) continue;
          seen.add(item.id);
          this.beginnerPairs.push(item);
          if (this.beginnerPairs.length >= 4) break;
        }
      }
      this.buildBoard();
    }

    buildBoard(focus = false) {
      if (!this.alive) return;
      const ctx = this.ctx;
      this.dragResets?.forEach(reset=>reset());
      this.dragResets=[];
      clearTimeout(this.demoTimer);
      this.pairCount = ctx.beginner ? 2 : 3;
      ctx.setRoundProgress?.(this.boardIndex + 1, this.boards);
      // Three pairs. When items carry a `match` (forms worlds), the pair is
      // form ↔ isolated letter; otherwise two copies of the same item.
      const picks = [];
      const seen = new Set();
      if (ctx.beginner) {
        const pool = this.beginnerPairs || [];
        for (const item of pool.slice(this.boardIndex * 2, this.boardIndex * 2 + 2)) {
          seen.add(item.id);
          picks.push(item);
        }
        // Very small curricula still get a complete second board; repeat only
        // after every available familiar item has appeared once.
        for (const item of pool) {
          if (picks.length >= Math.min(2, pool.length)) break;
          if (seen.has(item.id)) continue;
          seen.add(item.id);
          picks.push(item);
        }
      } else {
        for (const item of shuffle(ctx.items)) {
          if (picks.length >= this.pairCount) break;
          if (seen.has(item.id)) continue;
          seen.add(item.id);
          picks.push(item);
        }
      }
      this.pairCount = picks.length;
      this.complete = false;
      const cards = [];
      for (const item of picks) {
        cards.push({ id: item.id, display: item.display, speak: item.speak, audioPath: item.audioPath });
        cards.push({
          id: item.id,
          display: item.match || item.display,
          speak: item.speak,
          audioPath: item.audioPath,
        });
      }
      this.cards = shuffle(cards);
      this.selected = null;
      this.matched = 0;
      ctx.stage.classList.remove('is-paired');
      ctx.stage.innerHTML = `<div class="pairs-grid" data-pair-count="${this.pairCount}"></div><div class="pairs-garden" aria-hidden="true">${picks.map(()=>`<span class="pairs-pot">${matchingSprout()}</span>`).join('')}</div><button type="button" class="orchard-next pairs-next" aria-label="${this.boardIndex === this.boards - 1 ? 'Finish matching' : 'Next matching bed'}" hidden>${Art.icon('next',32)}</button>`;
      const board = this.boardIndex;
      this.next = ctx.stage.querySelector('.pairs-next');
      this.next.onclick = event => { if(this.boardIndex === board)this.nextBoard(event?.detail === 0); };
      this.pots = [...ctx.stage.querySelectorAll('.pairs-pot')];
      const grid = ctx.stage.querySelector(".pairs-grid");
      ctx.setPrompt(null);
      for (const card of this.cards) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "pairs-card";
        el.innerHTML = workshopTile(card.display,"leaf");
        el.setAttribute("aria-label",card.display);
        el.setAttribute("aria-pressed","false");
        el.addEventListener("click", () => this.pick(card, el));
        card.el = el;
        grid.appendChild(el);
        const reset=this.wireDrag(card);
        if(reset)this.dragResets.push(reset);
      }
      // Wordless instruction: one matching pair glows in sync for a moment —
      // "see? these two belong together" — then the child takes over.
      if (!this.cards.length) {this.alive = false;ctx.onDone(this.slips);return;}
      if (focus) this.cards[0].el.focus?.({preventScroll:true});
      const demoId = this.cards[0].id;
      const demoEls = this.cards.filter((c) => c.id === demoId).map((c) => c.el);
      for (const el of demoEls) el.classList.add("is-demo");
      this.demoTimer=setTimeout(() => {
        if (!this.alive || this.boardIndex!==board) return;
        for (const el of demoEls) el.classList.remove("is-demo");
      }, 1500);
    }

    wireDrag(card) {
      const el=card.el;
      return ns.GardenPractice?.draggable(el,{
        enabled:()=>this.alive&&!this.complete&&this.cards.includes(card)&&!el.classList.contains('is-matched'),
        onDragStart:()=>this.beginDrag(card),
        onDragMove:(x,y)=>this.showDropPartner(this.dropPartner(card,x,y)),
        onDragEnd:()=>this.showDropPartner(null),
        drop:(x,y)=>this.dropPair(card,x,y)
      });
    }

    beginDrag(card) {
      if(!this.alive||this.complete||!this.cards.includes(card)||card.el.classList.contains('is-matched'))return;
      // Moving a card chooses a reference; it never guesses a match by itself.
      if(this.selected?.card===card)return;
      if(this.selected){this.selected.el.classList.remove('is-selected');this.selected.el.setAttribute('aria-pressed','false');this.selected=null;}
      this.pick(card,card.el);
    }

    dropPartner(card,x,y) {
      if(!this.alive||this.complete||!this.cards.includes(card))return null;
      let closest=null,distance=Infinity;
      for(const other of this.cards){
        if(other===card||other.el.classList.contains('is-matched'))continue;
        const r=other.el.getBoundingClientRect();
        if(!r.width||!r.height||x<r.left-16||x>r.right+16||y<r.top-16||y>r.bottom+16)continue;
        const d=Math.hypot(x-r.left-r.width/2,y-r.top-r.height/2);
        if(d<distance){closest=other;distance=d;}
      }
      return closest;
    }

    showDropPartner(card) {
      this.cards?.forEach(other=>other.el.classList.toggle('is-near',other===card));
    }

    dropPair(card,x,y) {
      const partner=this.dropPartner(card,x,y);
      if(!partner||card.el.classList.contains('is-matched'))return;
      this.beginDrag(card);
      this.pick(partner,partner.el);
    }

    pick(card, el) {
      if (!this.alive || !this.cards.includes(card)) return;
      if (el.classList.contains("is-matched")) { this.ctx.say(card);return; }
      if (this.complete) return;
      this.cards.forEach(c=>c.el.classList.remove("is-demo"));
      if (!this.selected) {
        this.ctx.say(card);
        this.selected = { card, el };
        el.classList.add("is-selected");
        el.setAttribute("aria-pressed","true");
        return;
      }
      if (this.selected.el === el) {
        el.classList.remove("is-selected");
        el.setAttribute("aria-pressed","false");
        this.selected = null;
        return;
      }
      const first = this.selected;
      this.selected = null;
      first.el.classList.remove("is-selected");
      first.el.setAttribute("aria-pressed","false");
      if (first.card.id === card.id) {
        this.ctx.say(card);
        first.el.classList.add("is-matched");
        el.classList.add("is-matched");
        for (const [node, item] of [[first.el,first.card],[el,card]]) {
          node.setAttribute('aria-label', `Hear ${item.display}`);
          node.insertAdjacentHTML('beforeend', `<span class="orchard-listen" aria-hidden="true">${Art.icon('speaker',18)}</span>`);
        }
        this.pots[this.matched]?.classList.add('is-grown');
        reportVisibleMatch(this.ctx, first.card, true);
        this.ctx.sfx("correct");
        this.ctx.confettiAt(el);
        this.matched += 1;
        if (this.matched >= this.pairCount) {
          this.complete = true;
          this.next.hidden = false;
          this.next.focus?.({preventScroll:true});
          this.ctx.stage.classList.add('is-paired');
        }
      } else {
        // Keep the reference visible: retry means finding its partner, not
        // remembering and selecting the first card all over again.
        this.selected = first;
        first.el.classList.add("is-selected");
        first.el.setAttribute("aria-pressed","true");
        this.ctx.say(first.card);
        this.slips += 1;
        reportVisibleMatch(this.ctx, first.card, false);
        this.ctx.sfx("wrong");
        for (const e of [el]) {
          e.classList.remove("is-shake");
          void e.offsetWidth;
          e.classList.add("is-shake");
        }
      }
    }

    nextBoard(focus = false) {
      if (!this.alive || !this.complete) return;
      this.complete = false;
      this.boardIndex += 1;
      if (this.boardIndex >= this.boards) { this.alive=false; return this.ctx.onDone(this.slips); }
      this.buildBoard(focus);
    }

    destroy() { this.alive = false; this.dragResets?.forEach(reset=>reset()); clearTimeout(this.demoTimer); this.stopHint?.(); }
  }

  // ---------- Feed: deliver a packet and enjoy the picnic together ----------
  class FeedGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      this.rounds = buildRounds(ctx);
      this.roundIndex = 0;
      this.slips = 0;
      this.timers = new Set();
      if (!this.rounds.length) { this.alive = false; ctx.onDone(0); return; }
      ctx.stage.innerHTML = `
        <div class="feed-scene">
          <button type="button" aria-label="Feed your pet or hear the letter again" class="feed-creature">${ctx.petArt ? ctx.petArt() : Art.creature({ hue: (ctx.hue + 140) % 360 })}</button>
          <button type="button" class="feed-basket" aria-label="Deliver the selected seed packet" aria-disabled="true" disabled>${orchardBasket()}<span class="feed-delivered" aria-hidden="true"></span><span class="feed-basket-front" aria-hidden="true">${orchardBasket(true)}</span></button>
          <div class="feed-tray"></div>
          <div class="feed-finish" hidden><button type="button" class="feed-replay lg-round-btn" aria-label="Hear the delivered letter again">${Art.icon("speaker", 30)}</button><button type="button" class="feed-next lg-big-btn" aria-label="Continue">${Art.icon("next", 36)}</button></div>
        </div>`;
      this.creatureEl = ctx.stage.querySelector(".feed-creature");
      this.creatureEl.onclick=()=>{
        if(!this.alive)return;
        if(this.selected&&!this.feeding)this.offer(this.selected.item,this.selected.el);
        else if(ctx.onPetTap)ctx.onPetTap();else ctx.say(this.rounds[this.roundIndex].target);
      };
      this.scene = ctx.stage.querySelector('.feed-scene');
      this.finishEl = ctx.stage.querySelector('.feed-finish');
      this.nextBtn = ctx.stage.querySelector('.feed-next');
      this.replayBtn = ctx.stage.querySelector('.feed-replay');
      this.nextBtn.onclick = () => this.continueDelivery();
      this.replayBtn.onclick = () => this.replayDelivered();
      this.tray = ctx.stage.querySelector(".feed-tray");
      this.dragResets=[];
      this.basket=ctx.stage.querySelector('.feed-basket');
      this.delivered=ctx.stage.querySelector('.feed-delivered');
      if(this.basket)this.basket.onclick=()=>{if(this.selected)this.offer(this.selected.item,this.selected.el);};
      this.startRound();
    }

    startRound() {
      if (!this.alive) return;
      this.dragResets.forEach(reset=>reset());this.dragResets=[];this.selected=null;
      this.feeding = false; this.completionReady = false;
      this.setDeliveryNear(false);
      this.scene.classList.remove('is-delivered');
      this.finishEl.hidden = true;
      this.nextBtn.disabled = true; this.replayBtn.disabled = true;
      if(this.basket){this.basket.classList.remove("is-ready","is-near","is-filled");this.basket.setAttribute("aria-disabled","true");this.basket.disabled=true;}
      if(this.delivered)this.delivered.innerHTML='';
      const round = this.rounds[this.roundIndex];
      this.ctx.setRoundProgress?.(this.roundIndex + 1, this.rounds.length);
      presentRound(this.ctx, round, "feed");
      this.tray.innerHTML = "";
      for (const item of round.options) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "feed-food";
        el.innerHTML = ns.LettersGardenArt.seedPacket(glyphText(item.display,{maxSize:44,fill:"#4a3620"}));
        el.setAttribute("aria-label", item.display);
        if(this.ctx.garden){
          el.setAttribute("aria-pressed","false");
          this.dragResets.push(ns.GardenPractice.draggable(el,{
            enabled:()=>this.alive&&!this.feeding&&!el.disabled,
            onDragStart:()=>{this.ctx.petReact?.('thinking');this.ctx.pet?.watch(el);this.ctx.pet?.reach(el);},
            onDragMove:(x,y)=>this.setDeliveryNear(this.deliveryContains(x,y)),
            onDragEnd:()=>{this.setDeliveryNear(false);this.ctx.petReact?.('presenting');this.ctx.pet?.settle();},
            drop:(x,y,released)=>{if(this.deliveryContains(x,y))this.offer(item,el,released);}
          }));
          el.addEventListener('click',()=>{
            if(!this.alive||this.feeding||el.disabled)return;
            if(this.selected?.el===el){this.selected=null;this.ctx.pet?.settle();el.setAttribute("aria-pressed","false");this.basket.classList.remove("is-ready");this.basket.setAttribute("aria-disabled","true");this.basket.disabled=true;return;}
            this.selected={item,el};
            this.ctx.petReact?.('thinking');
            this.ctx.pet?.watch(el);this.ctx.pet?.reach(el);
            this.basket.classList.add("is-ready");this.basket.setAttribute("aria-disabled","false");this.basket.disabled=false;
            this.tray.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));
          });
        }else el.addEventListener("click", () => this.offer(item, el));
        this.tray.appendChild(el);
      }
    }

    deliveryContains(x,y) {
      const contains=(el,padding=0)=>{
        const r=el?.getBoundingClientRect?.();
        return r&&r.width>0&&r.height>0&&x>=r.left-padding&&x<=r.left+r.width+padding&&y>=r.top-padding&&y<=r.top+r.height+padding;
      };
      // A small drag within the tray is still exploration, never an answer.
      if(contains(this.tray))return false;
      // Children aim for the whole friend. Use the art bounds, not its full-width
      // layout wrapper, and allow a finger-width of room around both destinations.
      const friend=this.creatureEl?.querySelector?.(':scope > svg, :scope > .lg-animal');
      return !!(contains(friend,32)||contains(this.basket,32));
    }

    setDeliveryNear(near) {
      this.basket?.classList.toggle('is-near',near);
      this.creatureEl?.classList.toggle('is-near',near);
    }

    later(fn, delay) {
      const timer=setTimeout(()=>{this.timers.delete(timer);if(this.alive)fn();},delay);
      this.timers.add(timer);
    }

    offer(item, el, releaseRect = null) {
      const round = this.rounds[this.roundIndex];
      if (!this.alive || this.feeding || el.disabled || this.tray?.contains?.(el) === false || el.classList.contains("is-scaffolded")) return;
      if (item.id !== round.target.id) {
        el.disabled=true; this.selected=null;
        el.setAttribute("aria-pressed","false");
        if(this.basket){this.basket.classList.remove("is-ready");this.basket.setAttribute("aria-disabled","true");this.basket.disabled=true;}
        this.slips += 1;
        reportPromptMatch(this.ctx, round, false, item, "feed");
        helpAfterWrong(this.ctx, round, item);
        this.ctx.sfx("wrong");
        el.classList.remove("is-shake");
        void el.offsetWidth;
        el.classList.add("is-shake");
        this.ctx.say(round.target);
        this.ctx.pet?.inspect(el, 450, () => this.ctx.pet?.ponder());
        // Scaffolded retry: the refused food quietly leaves the tray.
        const retryRound=this.roundIndex;
        this.later(() => {if(this.roundIndex===retryRound)el.classList.add("is-scaffolded");}, 650);
        return;
      }
      this.feeding = true;
      this.ctx.clearLearningHint?.();
      this.tray?.querySelectorAll("button").forEach(b=>b.disabled=true);
      // Delivery geometry starts at the actual pointer release, not the old tray slot.
      if(this.basket){this.basket.classList.remove("is-ready");this.basket.setAttribute("aria-disabled","true");this.basket.disabled=true;}
      const base = el.getBoundingClientRect();
      const from = releaseRect || base;
      const mouth = (this.basket || this.creatureEl).getBoundingClientRect();
      el.style.setProperty("--fly-start-x", `${from.left+from.width/2-(base.left+base.width/2)}px`);
      el.style.setProperty("--fly-start-y", `${from.top+from.height/2-(base.top+base.height/2)}px`);
      el.style.setProperty("--fly-x", `${mouth.left + mouth.width / 2 - (base.left + base.width / 2)}px`);
      el.style.setProperty("--fly-y", `${mouth.top + mouth.height * (this.basket ? 0.48 : 0.68) - (base.top + base.height / 2)}px`);
      el.classList.add("is-flying");
      reportPromptMatch(this.ctx, round, true, item, "feed");
      this.ctx.sfx("correct");
      this.ctx.say(round.target);
      const deliveryRound = this.roundIndex;
      this.completionReady = true;
      this.scene.classList.add('is-delivered');
      this.finishEl.hidden = false;
      this.nextBtn.disabled = false; this.replayBtn.disabled = false;
      this.nextBtn.focus?.({preventScroll:true});
      this.later(() => {
        if (!this.completionReady || this.roundIndex !== deliveryRound) return;
        if(this.delivered)this.delivered.innerHTML=el.innerHTML;
        if(this.basket)this.basket.classList.add("is-filled");
        this.ctx.petReact?.("proud");
        this.ctx.pet?.cheer(() => this.ctx.pet?.inspect(this.delivered || this.basket, 1600));
        this.creatureEl.classList.remove("is-chomp");
        void this.creatureEl.offsetWidth;
        this.creatureEl.classList.add("is-chomp");
        this.ctx.confettiAt(this.creatureEl);
      }, this.ctx.reducedMotion?.() ? 0 : 320);
    }

    replayDelivered() {
      if (!this.alive || !this.completionReady) return;
      this.ctx.say(this.rounds[this.roundIndex].target);
      this.ctx.petReact?.('listening');
      this.ctx.pet?.inspect(this.delivered || this.basket, 900);
    }

    continueDelivery() {
      if (!this.alive || !this.completionReady) return;
      this.completionReady = false;
      this.nextBtn.disabled = true; this.replayBtn.disabled = true;
      this.roundIndex += 1;
      if (this.roundIndex >= this.rounds.length) {
        this.destroy();
        return this.ctx.onDone(this.slips);
      }
      this.startRound();
      this.tray.querySelector('button:not(:disabled)')?.focus?.({preventScroll:true});
    }

    destroy() {
      this.alive = false; this.completionReady = false;
      this.dragResets?.forEach(reset=>reset());this.timers?.forEach(clearTimeout);this.timers?.clear();
    }
  }

  // ---------- Trace: write the letter with your finger ----------
  // Brain Age's signature mechanic, kid-sized: a huge pale letter is the
  // guide, the child crayons over it, and covering enough of the glyph wins.
  // Single letters are now guided stroke by stroke (LettersStrokes, v3);
  // joined words keep coverage — covering enough of the glyph wins.
  class TraceGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.inkColor = DrawingPalette.startForPet(ctx.petHue);
      const pool = shuffle(ctx.items).filter((i) => (i.display || "").length <= 3);
      this.targets = (pool.length ? pool : shuffle(ctx.items)).slice(0, Math.min(3, ctx.rounds || 3));
      this.roundIndex = 0;
      this.slips = 0;
      this.alive = true;
      ctx.stage.innerHTML = `
        <div class="trace-wrap">
          <div class="trace-paper"><canvas class="trace-canvas" aria-label="Draw over the letter with your finger"></canvas></div>
          <div class="trace-tools">
            <svg class="trace-crayon" viewBox="0 0 150 40" aria-hidden="true"><path d="M8 20L29 7H128Q140 20 128 33H29Z" fill="var(--drawing-ink)" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M8 20L29 7V33Z" fill="#e5dcc8"/><path d="M8 20L16 15V25Z" fill="var(--drawing-ink)"/><path d="M48 8H110V32H48Z" fill="#fffaf0"/><path d="M57 13H100" stroke="#fffdf7" stroke-width="3" stroke-linecap="round"/><path d="M73 28Q62 17 70 18Q78 18 81 28Q83 13 91 17Q95 24 81 28" fill="var(--drawing-ink)"/></svg>
            ${DrawingPalette.markup()}
            <button type="button" class="lg-round-btn trace-clear" aria-label="Clear your drawing"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 28L27 10Q30 7 33 10L41 18Q43 21 40 24L24 40H20Z" fill="#ee806f" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M10 28L18 20L32 32L24 40H20Z" fill="#fffaf0" stroke="#4a3620" stroke-width="3"/><path d="M30 40H42" stroke="#a89478" stroke-width="3" stroke-linecap="round"/></svg></button>
            <div class="trace-finish" hidden><span class="trace-made" role="status" aria-label="Drawing complete">${Art.icon('check',32)}</span><button type="button" class="lg-big-btn trace-next" aria-label="Next letter" disabled>${Art.icon('next',34)}</button></div>
          </div>
        </div>`;
      this.canvas = ctx.stage.querySelector(".trace-canvas");
      this.clearBtn = ctx.stage.querySelector(".trace-clear");
      this.finishEl = ctx.stage.querySelector('.trace-finish');
      this.nextBtn = ctx.stage.querySelector('.trace-next');
      this.nextBtn.addEventListener('click',()=>this.continueDrawing());
      this.clearBtn.disabled = true;
      this.clearBtn.addEventListener("click", () => this.clearDrawing());
      this.drawing = false;
      this.canvas.addEventListener("pointerdown", (e) => this.penDown(e));
      this.canvas.addEventListener("pointermove", (e) => this.penMove(e));
      this.canvas.addEventListener("pointercancel", (e) => this.cancelStroke(e));
      this.canvas.addEventListener("lostpointercapture", (e) => this.cancelStroke(e));
      window.addEventListener("pointerup", (this.penUpBound = (e) => this.penUp(e)));
      this.paletteButtons = DrawingPalette.wire(ctx.stage,{active:()=>this.alive&&!this.advancing,release:()=>this.cancelStroke(),onChange:color=>{this.inkColor=color;if(this.g)this.g.strokeStyle=color;this.guided?.setInk(color);}});
      // The glyph guide needs the Quran font; wait for it, then start.
      const ready = document.fonts && document.fonts.load ? document.fonts.load('100px "Amiri Quran"') : Promise.resolve();
      ready.finally(() => {
        if (this.alive) this.startRound();
      });
    }

    drawGuideText(size, x, y) {
      const target = this.targets[this.roundIndex];
      // System Arabic fonts (Geeza Pro, Segoe UI, Noto) hug harakat close to
      // the letter; Amiri Quran floats them a canvas apart at tracing sizes.
      this.g.font = `${size}px "Geeza Pro", "Segoe UI", "Noto Naskh Arabic", "Arial", sans-serif`;
      this.g.textAlign = "center";
      this.g.textBaseline = "middle";
      this.g.direction = "rtl";
      this.g.fillStyle = "#e5dcc8";
      this.g.fillText(target.display, x, y);
      this.g.strokeStyle = "#a89478";
      this.g.lineWidth = 2;
      this.g.strokeText(target.display, x, y);
    }

    inkBounds(w, h) {
      const img = this.g.getImageData(0, 0, w, h).data;
      let minX = w, maxX = 0, minY = h, maxY = 0, any = false;
      for (let y = 0; y < h; y += 3) {
        for (let x = 0; x < w; x += 3) {
          if (img[(y * w + x) * 4 + 3] > 60) {
            any = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      return any ? { minX, maxX, minY, maxY } : null;
    }

    startRound() {
      if (!this.alive) return;
      this.canvas?.parentElement?.querySelectorAll?.(".trace-hint")?.forEach((el) => el.remove());
      if (this.clearBtn) this.clearBtn.disabled = true;
      this.advancing = false;
      this.completionReady = false;
      if(this.finishEl)this.finishEl.hidden=true;
      if(this.nextBtn){this.nextBtn.disabled=true;this.nextBtn.setAttribute('aria-label',this.roundIndex===this.targets.length-1?'Finish drawing activity':'Next letter');}
      this.paletteButtons?.forEach(button=>button.disabled=false);
      this.canvas.parentElement.classList.remove('is-complete');
      this.canvas.parentElement.parentElement.classList.remove('is-complete');
      const target = this.targets[this.roundIndex];
      this.ctx.setRoundProgress?.(this.roundIndex + 1, this.targets.length);
      this.ctx.setPrompt(target);
      this.ctx.say(target);
      const wrap = this.canvas.parentElement;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (w <= 0 || h <= 0) { this.g = null; this.guide = []; return; }
      this.canvas.width = w;
      this.canvas.height = h;
      this.g = this.canvas.getContext("2d", { willReadFrequently: true });

      // Amiri Quran's font metrics put the ink far from the em-box centre,
      // so we measure the actual drawn pixels and re-draw with a correction
      // (shrinking first if the glyph would spill past the paper).
      let size = Math.min(w, h) * 0.95;
      this.g.clearRect(0, 0, w, h);
      this.drawGuideText(size, w / 2, h * 0.5);
      let box = this.inkBounds(w, h);
      if (box) {
        const scale = Math.min(1, (0.8 * w) / (box.maxX - box.minX + 1), (0.72 * h) / (box.maxY - box.minY + 1));
        if (scale < 0.98) {
          size *= scale;
          this.g.clearRect(0, 0, w, h);
          this.drawGuideText(size, w / 2, h * 0.5);
          box = this.inkBounds(w, h);
        }
      }
      if (box) {
        const dx = w / 2 - (box.minX + box.maxX) / 2;
        const dy = h / 2 - (box.minY + box.maxY) / 2;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          this.g.clearRect(0, 0, w, h);
          this.drawGuideText(size, w / 2 + dx, h * 0.5 + dy);
        }
      }

      // Remember which pixels belong to the glyph (sampled grid)...
      const img = this.g.getImageData(0, 0, w, h).data;
      this.guide = [];
      const step = 5;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          if (img[(y * w + x) * 4 + 3] > 60) this.guide.push([x, y]);
        }
      }
      // ...and split them into connected clusters. The letter body is one
      // cluster; each dot is its own — and EVERY cluster must be traced, so
      // ب without its dot doesn't pass.
      const cellSet = new Set(this.guide.map(([x, y]) => `${x}|${y}`));
      const seen = new Set();
      this.clusters = [];
      for (const [x, y] of this.guide) {
        const key = `${x}|${y}`;
        if (seen.has(key)) continue;
        const cluster = [];
        const queue = [[x, y]];
        seen.add(key);
        while (queue.length) {
          const [cx, cy] = queue.pop();
          cluster.push(`${cx}|${cy}`);
          for (const [nx, ny] of [[cx - step, cy], [cx + step, cy], [cx, cy - step], [cx, cy + step], [cx - step, cy - step], [cx + step, cy + step], [cx - step, cy + step], [cx + step, cy - step]]) {
            const nkey = `${nx}|${ny}`;
            if (cellSet.has(nkey) && !seen.has(nkey)) {
              seen.add(nkey);
              queue.push([nx, ny]);
            }
          }
        }
        this.clusters.push(cluster);
      }

      this.brush = Math.max(20, size * 0.1);
      this.g.lineCap = "round";
      this.g.lineJoin = "round";
      this.g.strokeStyle = this.inkColor || DrawingPalette.current();
      this.g.lineWidth = this.brush;
      this.paint = new Set(); // painted sample cells, keyed x|y
      // Writing Garden (v3): single letters (with any harakat) are taught
      // stroke by stroke from the handwriting model; joined words keep the
      // coverage trace above.
      this.guided?.destroy();
      this.guided = null;
      const strokes = ns.LettersStrokes?.forItem?.(target);
      if (strokes) {
        this.g.clearRect(0, 0, w, h);
        this.canvas.parentElement.classList.add("is-guided");
        this.guided = ns.LettersStrokes.guide(this.canvas.parentElement, strokes, {
          ink: () => this.inkColor || DrawingPalette.current(),
          reduced: !!this.ctx.reducedMotion?.(),
          onStroke: () => { if (this.clearBtn) this.clearBtn.disabled = false; this.ctx.sfx("seed"); },
          onSnap: () => this.ctx.sfx("drip"),
          onMove: (e) => {
            if (!e) { this.ctx.pet?.settle(); this.watching = false; return; }
            this.penClient = { x: e.clientX, y: e.clientY };
            if (!this.watching) { this.watching = true; this.ctx.petReact?.("thinking"); this.ctx.pet?.watch(() => this.penClient); }
          },
          onDone: () => {
            if (!this.alive || this.advancing) return;
            this.guided.paint(this.canvas, this.inkColor || DrawingPalette.current());
            this.completeDrawing();
          },
        });
      } else {
        this.canvas.parentElement.classList.remove("is-guided");
      }
    }

    clearDrawing() {
      if (this.alive && !this.advancing && this.guided) { this.guided.reset(); this.clearBtn.disabled = true; return; }
      if (this.alive && !this.advancing && this.g) {this.cancelStroke();this.startRound();}
    }

    pos(e) {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0 || this.canvas.width <= 0 || this.canvas.height <= 0) return null;
      // object-fit preserves a child's ink during rotation. Map the finger to
      // that contained image, not to the surrounding letterboxed paper.
      const scale = Math.min(rect.width/this.canvas.width,rect.height/this.canvas.height);
      const left = rect.left+(rect.width-this.canvas.width*scale)/2;
      const top = rect.top+(rect.height-this.canvas.height*scale)/2;
      const x=(e.clientX-left)/scale,y=(e.clientY-top)/scale;
      if(x<0||y<0||x>this.canvas.width||y>this.canvas.height)return null;
      return [x,y];
    }

    cancelStroke(e) {
      if (e && e.pointerId !== this.activePointer) return;
      const id = this.activePointer;
      this.activePointer = null;
      this.drawing = false;
      this.ctx?.pet?.settle();
      if (id != null && this.canvas?.hasPointerCapture?.(id)) this.canvas.releasePointerCapture(id);
    }

    penDown(e) {
      if (!this.alive || this.advancing || !this.g || this.drawing || e.button>0 || e.isPrimary===false) return;
      this.activePointer = e.pointerId;
      this.drawing = true;
      this.last = this.pos(e);
      if (!this.last) { this.drawing = false; this.activePointer = null; return; }
      if (this.clearBtn) this.clearBtn.disabled = false;
      this.canvas.setPointerCapture?.(e.pointerId);
      this.ctx.petReact?.("thinking");
      // Drawing together: the pet follows the pen tip and steadies toward the board.
      this.penClient = { x: e.clientX, y: e.clientY };
      this.ctx.pet?.watch(() => this.penClient);
      this.ctx.pet?.reach(() => this.penClient);
      // A plain tap must leave ink too — kids dot the dots with single taps,
      // and letters like ب can't pass their dot-cluster check without it.
      if (this.g) {
        const [x, y] = this.last;
        const r = this.brush / 2;
        this.g.beginPath();
        this.g.arc(x, y, r, 0, Math.PI * 2);
        this.g.fillStyle = this.g.strokeStyle;
        this.g.fill();
        for (let dy = -r; dy <= r; dy += 5) {
          for (let dx = -r; dx <= r; dx += 5) {
            if (dx * dx + dy * dy > r * r) continue;
            this.paint.add(`${Math.round((x + dx) / 5) * 5}|${Math.round((y + dy) / 5) * 5}`);
          }
        }
      }
    }

    penMove(e) {
      if (!this.drawing || !this.alive || this.advancing || e.pointerId !== this.activePointer) return;
      const point = this.pos(e);
      if (!point) return;
      this.penClient = { x: e.clientX, y: e.clientY };
      const [x, y] = point;
      this.g.beginPath();
      this.g.moveTo(this.last[0], this.last[1]);
      this.g.lineTo(x, y);
      this.g.stroke();
      // Record painted cells along the segment.
      const r = this.brush / 2;
      const steps = Math.max(1, Math.hypot(x - this.last[0], y - this.last[1]) / 4);
      for (let i = 0; i <= steps; i += 1) {
        const px = this.last[0] + ((x - this.last[0]) * i) / steps;
        const py = this.last[1] + ((y - this.last[1]) * i) / steps;
        for (let dy = -r; dy <= r; dy += 5) {
          for (let dx = -r; dx <= r; dx += 5) {
            if (dx * dx + dy * dy > r * r) continue;
            this.paint.add(`${Math.round((px + dx) / 5) * 5}|${Math.round((py + dy) / 5) * 5}`);
          }
        }
      }
      this.last = [x, y];
    }

    clusterCoverage(cluster) {
      let n = 0;
      for (const key of cluster) if (this.paint.has(key)) n += 1;
      return n / cluster.length;
    }

    penUp(e) {
      if (!this.drawing || !this.alive || this.advancing || (e && e.pointerId !== this.activePointer)) return;
      this.cancelStroke();
      if (!this.guide.length) return;
      const covered = this.guide.reduce(
        (n, [x, y]) => n + (this.paint.has(`${x}|${y}`) ? 1 : 0),
        0,
      );
      const total = covered / this.guide.length;
      const missing = (this.clusters || []).filter((c) => this.clusterCoverage(c) < 0.45);
      if (total >= 0.55 && !missing.length) {
        this.completeDrawing();
        return;
      }
      // Body done but a cluster (usually the dots!) still untouched: pulse a
      // gentle ring over the smallest missing cluster to point at it.
      if (total >= 0.4 && missing.length) {
        const smallest = missing.reduce((a, b) => (a.length <= b.length ? a : b));
        let sx = 0, sy = 0;
        for (const key of smallest) {
          const [x, y] = key.split("|").map(Number);
          sx += x;
          sy += y;
        }
        this.canvas.parentElement.querySelectorAll?.('.trace-hint').forEach(el=>el.remove());
        const hint = document.createElementNS('http://www.w3.org/2000/svg','svg');
        hint.setAttribute('class','trace-hint');
        hint.setAttribute('aria-hidden','true');
        hint.setAttribute('viewBox',`0 0 ${this.canvas.width} ${this.canvas.height}`);
        hint.setAttribute('preserveAspectRatio','xMidYMid meet');
        const ring=document.createElementNS('http://www.w3.org/2000/svg','circle');
        ring.setAttribute('cx',String(sx/smallest.length));
        ring.setAttribute('cy',String(sy/smallest.length));
        ring.setAttribute('r',String(Math.max(24,(this.brush||0)*.9)));
        ring.setAttribute('fill','none');
        ring.setAttribute('vector-effect','non-scaling-stroke');
        hint.appendChild(ring);
        this.canvas.parentElement.appendChild(hint);
        this.ctx.sfx("page");
        setTimeout(() => hint.remove(), 1200);
      }
    }

    completeDrawing() {
      if(!this.alive||this.advancing)return;
      this.cancelStroke();
      this.advancing=true;
      this.completionReady=true;
      this.clearBtn.disabled=true;
      this.paletteButtons?.forEach(button=>button.disabled=true);
      this.canvas.parentElement.querySelectorAll?.('.trace-hint').forEach(el=>el.remove());
      this.canvas.parentElement.classList.add('is-complete');
      this.canvas.parentElement.parentElement.classList.add('is-complete');
      this.finishEl.hidden=false;
      this.nextBtn.disabled=false;
      const target=this.targets[this.roundIndex];
      this.ctx.onDrawingMade?.(target, this.canvas);
      reportAssembly(this.ctx,target,true);
      this.ctx.sfx('correct');
      this.ctx.petReact?.('proud');
      this.ctx.pet?.cheer(() => this.ctx.pet?.inspect(this.canvas, 1600));
      this.ctx.confettiAt(this.canvas);
      this.ctx.say(target);
      this.nextBtn.focus?.({preventScroll:true});
    }

    continueDrawing() {
      if(!this.alive||!this.completionReady)return;
      this.completionReady=false;
      this.nextBtn.disabled=true;
      this.roundIndex+=1;
      if(this.roundIndex>=this.targets.length)this.finish();
      else this.startRound();
    }

    finish() {
      this.alive = false;
      this.completionReady = false;
      this.cancelStroke();
      this.guided?.destroy();
      this.canvas?.parentElement?.querySelectorAll?.(".trace-hint")?.forEach((el) => el.remove());
      window.removeEventListener("pointerup", this.penUpBound);
      this.ctx.onDone(this.slips);
    }

    destroy() {
      this.alive = false;
      this.completionReady = false;
      this.cancelStroke();
      this.guided?.destroy();
      window.removeEventListener("pointerup", this.penUpBound);
    }
  }

  // ---------- Burst: the gentle speed round (Calculations x25 spirit) ----------
  // Thirty seconds, a shrinking sun-ring, tap the tile you hear, count only
  // ever goes UP — speed pressure without any way to lose.
  class BurstGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.count = 0;
      this.alive = true;
      this.paused = false;
      this.duration = 30000;
      this.remaining = this.duration;
      this.endsAt = performance.now() + this.remaining;
      this.frameSequence = 0;
      this.pendingFrame = null;
      ctx.stage.innerHTML = `
        <div class="burst-head">
          <svg class="burst-ring" viewBox="0 0 60 60" aria-hidden="true">
            <circle cx="30" cy="30" r="25" fill="#fffaf0" stroke="#c9bda4" stroke-width="6"/>
            <circle class="burst-ring-fill" cx="30" cy="30" r="25" fill="none" stroke="#e8743c" stroke-width="6"
              stroke-linecap="round" stroke-dasharray="157" transform="rotate(-90 30 30)"/>
          </svg>
          <button type="button" class="burst-pause" aria-label="Pause challenge">
            <svg viewBox="0 0 64 64" aria-hidden="true"><rect x="17" y="12" width="10" height="40" rx="4" fill="currentColor"/><rect x="37" y="12" width="10" height="40" rx="4" fill="currentColor"/></svg>
          </button>
        </div>
        <div class="burst-grid"></div>
        <div class="burst-receipt" aria-label="Letters found">
          <span class="burst-caught" aria-hidden="true"><svg viewBox="0 0 70 74"><path d="M12 18Q35 9 58 18V57Q35 67 12 57Z" fill="#e5dcc8"/><path d="M35 49Q16 47 20 28Q40 28 35 49M35 41Q34 21 52 22Q56 42 35 41Z" fill="#4e9677"/></svg></span>
          <span class="burst-count">0</span>
        </div>`;
      this.ringEl = ctx.stage.querySelector(".burst-ring-fill");
      this.countEl = ctx.stage.querySelector(".burst-count");
      this.caughtEl = ctx.stage.querySelector(".burst-caught");
      this.pauseButton = ctx.stage.querySelector(".burst-pause");
      this.grid = ctx.stage.querySelector(".burst-grid");
      this.onPauseClick = () => (this.paused ? this.resume() : this.pause());
      this.pauseButton?.addEventListener?.("click", this.onPauseClick);
      this.onVisibilityChange = () => {
        if (document.hidden) this.pause();
      };
      if (typeof document !== "undefined" && document.addEventListener) {
        document.addEventListener("visibilitychange", this.onVisibilityChange);
      }
      this.heat = makeHeat();
      this.nextTarget();
      this.tick = this.tick.bind(this);
      this.scheduleFrame();
      this.startEndTimer();
      if (typeof document !== "undefined" && document.hidden) this.pause();
    }

    scheduleFrame() {
      if (!this.alive || this.paused || this.pendingFrame != null) return;
      const token = ++this.frameSequence;
      this.pendingFrame = token;
      requestAnimationFrame((now) => {
        if (this.pendingFrame === token) this.pendingFrame = null;
        if (!this.alive || this.paused || token !== this.frameSequence) return;
        this.tick(now);
      });
    }

    startEndTimer() {
      clearInterval(this.endTimer);
      if (!this.alive || this.paused) return;
      this.endTimer = setInterval(() => this.tick(performance.now(), false), 500);
    }

    setPausedUI(paused) {
      this.ctx.stage?.classList?.toggle?.("is-paused", paused);
      if (this.grid) this.grid.inert = paused;
      if (!this.pauseButton) return;
      this.pauseButton.setAttribute("aria-label", paused ? "Resume challenge" : "Pause challenge");
      this.pauseButton.innerHTML = paused
        ? Art.icon("next", 30)
        : `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="17" y="12" width="10" height="40" rx="4" fill="currentColor"/><rect x="37" y="12" width="10" height="40" rx="4" fill="currentColor"/></svg>`;
    }

    pause() {
      if (!this.alive || this.paused) return;
      const now = performance.now();
      // Settle a deadline that elapsed before the pause/visibility event.
      this.tick(now, false);
      if (!this.alive) return;
      this.remaining = Math.max(0, this.endsAt - now);
      this.paused = true;
      this.frameSequence += 1;
      this.pendingFrame = null;
      clearInterval(this.endTimer);
      this.cancelHarvest();
      this.setPausedUI(true);
      this.ctx.onPauseChange?.(true);
    }

    resume() {
      if (!this.alive || !this.paused) return;
      if (typeof document !== "undefined" && document.hidden) return;
      this.paused = false;
      this.endsAt = performance.now() + this.remaining;
      this.setPausedUI(false);
      this.ctx.onPauseChange?.(false);
      // This is a fresh auditory prompt after pause cancelled the old one;
      // announce it again so the shell also restarts response-time evidence.
      this.ctx.setPrompt(this.target);
      this.ctx.say(this.target);
      this.scheduleFrame();
      this.startEndTimer();
    }

    nextTarget() {
      const pool = shuffle(this.ctx.items);
      this.target = pool[0];
      // Rubber band: the grid grows from 4 tiles toward 6 as the streak
      // heats up, and shrinks back after misses.
      const tileCount = Math.min(4 + Math.floor((this.heat ? this.heat.value() : 0) / 2), 6, pool.length);
      const tiles = pool.slice(0, tileCount);
      if (!tiles.includes(this.target)) tiles[0] = this.target;
      this.ctx.setPrompt(this.target);
      this.ctx.say(this.target);
      this.grid.innerHTML = "";
      this.grid.setAttribute("data-count",String(tiles.length));
      for (const item of shuffle(tiles)) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "burst-tile";
        el.innerHTML = workshopTile(item.display,"leaf");
        el.setAttribute("aria-label",item.display);
        el.addEventListener("click", () => this.tap(item, el));
        this.grid.appendChild(el);
      }
    }

    tap(item, el) {
      if (!this.alive || this.paused) return;
      // Input and timer callbacks can arrive in either order at the deadline.
      // Settle the round before accepting a final tap, using the same clock.
      this.tick(performance.now(), false);
      if (!this.alive || !this.grid.contains(el)) return;
      if (item.id === this.target.id) {
        this.count += 1;
        this.heat.up();
        this.countEl.textContent = String(this.count);
        reportPromptMatch(this.ctx, this.target, true);
        this.ctx.sfx("correct");
        this.showHarvest(item,el);
        this.nextTarget();
      } else {
        this.heat.down();
        reportPromptMatch(this.ctx, this.target, false);
        this.ctx.sfx("wrong");
        el.classList.remove("is-shake");
        void el.offsetWidth;
        el.classList.add("is-shake");
      }
    }

    cancelHarvest() {
      this.harvestFlight?.cancel();
      this.harvestFlight=null;
    }

    showHarvest(item,el) {
      this.cancelHarvest();
      if(!this.caughtEl)return;
      const from=el.getBoundingClientRect?.();
      this.caughtEl.innerHTML=workshopTile(item.display,"leaf");
      this.caughtEl.classList.add('is-filled');
      const to=this.caughtEl.getBoundingClientRect?.();
      // This receipt is outside the answer grid. Only the picture moves; the
      // next prompt, clock and answer guards never wait for its animation.
      if(this.ctx.reducedMotion?.()||!from?.width||!to?.width||!this.caughtEl.animate)return;
      this.harvestFlight=this.caughtEl.animate([
        {transform:`translate(${from.left-to.left}px,${from.top-to.top}px) scale(${from.width/to.width})`,opacity:.8},
        {transform:'translate(0,0) scale(1)',opacity:1}
      ],{duration:280,easing:'cubic-bezier(.2,.75,.25,1)'});
    }

    tick(now, schedule = true) {
      if (!this.alive || this.paused) return;
      const left = Math.max(0, this.endsAt - now);
      this.remaining = left;
      this.ringEl.style.strokeDashoffset = String(157 * (1 - left / this.duration));
      if (left <= 0) {
        this.alive = false;
        this.teardown();
        // Stars by harvest: 10+ shines, 6+ solid, anything else still a star.
        this.ctx.onDone(this.count >= 10 ? 0 : this.count >= 6 ? 2 : 3);
        return;
      }
      if (schedule) this.scheduleFrame();
    }

    teardown() {
      this.cancelHarvest();
      clearInterval(this.endTimer);
      this.frameSequence += 1;
      this.pendingFrame = null;
      if (typeof document !== "undefined" && document.removeEventListener) {
        document.removeEventListener("visibilitychange", this.onVisibilityChange);
      }
      this.pauseButton?.removeEventListener?.("click", this.onPauseClick);
      if (this.paused) this.ctx.onPauseChange?.(false);
      this.paused = false;
      this.setPausedUI(false);
      this.pauseButton?.remove?.();
      this.pauseButton = null;
    }

    destroy() {
      this.alive = false;
      this.teardown();
    }
  }

  // ---------- Build: blend the sounds into a word ----------
  // Synthetic phonics' key moment. The mascot says the whole thing (بَتْ,
  // "bat"); the child taps sound-tiles in order and watches them snap into
  // the slots right-to-left. Each tile speaks as it's placed; a correct
  // build speaks the blended whole. Items must carry `parts`.
  class BuildGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      const pool = ctx.items.filter((i) => i.parts && i.parts.length >= 2);
      this.targets = shuffle(pool).slice(0, ctx.rounds || 4);
      if(ctx.beginner)this.targets.sort((a,b)=>a.parts.length-b.parts.length);
      this.roundIndex = 0;
      this.slips = 0;
      this.startRound();
    }

    // Update 4: a finished word leaves the workbench as a labelled parcel and
    // joins a small shelf of things made. Decoration only: a copy flies, the
    // lesson has already advanced, and nothing here scores or saves.
    shipParcel(whole,target){
      (this.made ||= []).push(target.display);
      this.freshParcel=true;
      if(this.ctx.reducedMotion?.()||!whole?.getBoundingClientRect||typeof document==='undefined')return;
      const from=whole.getBoundingClientRect();
      if(!from.width)return;
      // The stage is rebuilt for the next round, so the copy flies on the page.
      const ghost=whole.cloneNode(true);ghost.className='build-ghost';ghost.removeAttribute('aria-label');ghost.setAttribute('aria-hidden','true');
      ghost.style.cssText=`position:fixed;left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px;margin:0;pointer-events:none;z-index:50`;
      document.body.appendChild(ghost);
      queueMicrotask(()=>{
        const to=this.ctx.stage?.querySelector?.('.build-shelf .build-parcel:last-child')?.getBoundingClientRect?.();
        const dx=to?.width?to.left+to.width/2-(from.left+from.width/2):window.innerWidth,dy=to?.width?to.top+to.height/2-(from.top+from.height/2):-60;
        const flight=ghost.animate?.([{transform:'none',opacity:1},{transform:`translate(${dx*.5}px,${dy*.5-30}px) rotate(6deg) scale(.7)`,opacity:1,offset:.6},{transform:`translate(${dx}px,${dy}px) scale(.25)`,opacity:0}],{duration:520,easing:'cubic-bezier(.3,.7,.3,1)'});
        if(flight)flight.onfinish=()=>ghost.remove();else ghost.remove();
      });
    }

    renderShelf(){
      const stage=this.ctx.stage;
      if(!this.made?.length||!stage?.insertAdjacentHTML)return;
      stage.querySelector('.build-shelf')?.remove();
      stage.insertAdjacentHTML('beforeend',`<div class="build-shelf" aria-hidden="true">${this.made.slice(-5).map((word,i,list)=>`<span class="build-parcel${this.freshParcel&&i===list.length-1?' is-new':''}"><svg viewBox="0 0 60 48" aria-hidden="true"><rect x="3" y="8" width="54" height="36" rx="5" fill="#e5dcc8" stroke="#4a3620" stroke-width="2.4"/><path d="M30 8V44M3 22H57" stroke="#c69434" stroke-width="2.4"/><path d="M30 8Q22 0 18 6Q24 10 30 8Q38 0 42 6Q36 10 30 8" fill="none" stroke="#c69434" stroke-width="2.4"/><rect x="11" y="25" width="38" height="16" rx="3" fill="#fffdf7"/><text x="30" y="38" text-anchor="middle" font-family="Amiri Quran, serif" font-size="13" fill="#4a3620" direction="rtl">${String(word).replace(/[&<>"']/g,'')}</text></svg></span>`).join('')}</div>`);
      this.freshParcel=false;
    }

    startRound() {
      if (!this.alive) return;
      const ctx = this.ctx;
      this.ready=false;
      const target = this.targets[this.roundIndex];
      ctx.setPrompt(target, {
        promptMode: "match", skill: "construction",
        choiceIds: target.parts.map((part) => part.id || part.display), activity: "build",
      });
      ctx.say(target);
      this.placed = [];
      const support=ns.LettersLearning?.assemblyProfile(target,ctx);
      this.fixedCount=support?Math.max(0,target.parts.length-support.pieceBudget):0;
      // First encounters demonstrate the sequence without distractors. Later
      // guided rounds add one new choice at a time.
      const decoys = [];
      const decoyLimit = support? support.decoyCount : ctx.beginner && this.roundIndex === 0 ? 0 : 1;
      const seen = new Set(target.parts.map((p) => p.display));
      for (const item of shuffle(ctx.items)) {
        if (decoys.length >= decoyLimit) break;
        for (const part of item.parts || []) {
          if (decoys.length >= decoyLimit) break;
          if (seen.has(part.display)) continue;
          seen.add(part.display);
          decoys.push(part);
        }
      }
      this.tray = shuffle([...target.parts.slice(this.fixedCount), ...decoys]);
      ctx.stage.innerHTML = `
        <div class="build-scene">
          <div class="build-finish" hidden></div>
          <div class="build-slots" dir="rtl">
            ${target.parts.map((_,i) => `<button type="button" class="build-slot" data-slot="${i}" aria-label="Empty building space" disabled></button>`).join("")}
          </div>
          <div class="build-tray">
            ${this.tray.map((part, i) => `<button type="button" class="build-tile" data-i="${i}" aria-label="${part.display}">${workshopTile(part.display)}</button>`).join("")}
          </div>
        </div>`;
      this.slots = [...ctx.stage.querySelectorAll(".build-slot")];
      for(let i=0;i<this.fixedCount;i++){
        const slot=this.slots[i],part=target.parts[i];
        slot.innerHTML=workshopTile(part.display);slot.disabled=true;slot.classList.add('is-filled','is-prepared');
        slot.setAttribute('aria-label',`Prepared piece ${part.display}`);
        this.placed.push({part,slot,btn:null,fixed:true});
      }
      this.slots.forEach((slot,i)=>slot.addEventListener('click',()=>this.returnFrom(i)));
      for (const btn of ctx.stage.querySelectorAll(".build-tile")) {
        btn.addEventListener("click", () => this.place(btn));
      }
    }

    place(btn) {
      const target = this.targets[this.roundIndex];
      if (!this.alive || this.ready || btn.disabled || (this.ctx.stage&&!this.ctx.stage.contains(btn)) || btn.classList.contains("is-scaffolded") || btn.classList.contains("is-used") || this.placed.length >= target.parts.length) return;
      const part = this.tray[Number(btn.dataset.i)];
      const slot = this.slots[this.placed.length];
      slot.innerHTML = workshopTile(part.display)+`<span class="build-undo-cue" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M5 7H11A5 5 0 1 1 10 17M5 7L8 3M5 7L9 10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
      slot.disabled=false;
      slot.setAttribute('aria-label',`Return ${part.display} and following pieces`);
      slot.classList.add("is-filled");
      slot.classList.remove("is-hint");
      btn.classList.add("is-used");btn.disabled=true;
      this.placed.push({ part, btn, slot });
      this.ctx.say({ display: part.display, speak: part.speak || part.display });

      if (this.placed.length < target.parts.length) return;
      this.slots.forEach(slot=>{slot.disabled=true;});
      this.ctx.stage.querySelectorAll(".build-tile").forEach(b=>b.disabled=true);
      const built = this.placed.every((p, i) => p.part.display === target.parts[i].display);
      if (built) {
        reportAssembly(this.ctx, target, true);
        this.ctx.clearLearningHint?.();
        this.ctx.sfx("correct");
        this.ctx.confettiAt(this.ctx.stage.querySelector(".build-slots"));
        // Give the child ownership of the payoff. Animation reveals the word;
        // only the child's Next action can advance the lesson or pay completion.
        const round=this.roundIndex;
        const reveal=()=>{
          if(!this.alive||this.roundIndex!==round||this.ready)return;
          this.ready=true;
          const scene=this.ctx.stage.querySelector('.build-scene'),finish=this.ctx.stage.querySelector('.build-finish');
          scene.classList.add('is-ready');finish.hidden=false;
          finish.innerHTML=`<button type="button" class="build-whole" aria-label="Hear ${target.display}">${workshopTile(target.display)}<span class="build-listen" aria-hidden="true">${Art.icon('speaker',28)}</span></button><button type="button" class="lg-big-btn build-next" aria-label="Next word">${Art.icon('next',32)}</button>`;
          const whole=finish.querySelector('.build-whole'),next=finish.querySelector('.build-next');
          whole.onclick=()=>{if(this.alive&&this.ready&&this.roundIndex===round)this.ctx.say(target);};
          next.onclick=()=>{
            if(!this.alive||!this.ready||this.roundIndex!==round)return;
            this.shipParcel(whole,target);
            this.ready=false;this.roundIndex++;
            if(this.roundIndex>=this.targets.length){this.alive=false;this.ctx.onDone(this.slips);return;}
            this.startRound();this.renderShelf();this.ctx.stage.querySelector('.build-tile:not(:disabled)')?.focus?.({preventScroll:true});
          };
          this.ctx.say(target);next.focus({preventScroll:true});
        };
        if(this.ctx.reducedMotion?.())reveal();else setTimeout(reveal,400);
      } else {
        this.slips += 1;
        const firstWrong = this.placed.findIndex((p, i) => p.part.display !== target.parts[i].display);
        this.slots?.[firstWrong]?.classList.add('is-hint');
        const selected = this.placed[firstWrong]?.part;
        reportOutcome(this.ctx, target, false, "motor_assembly_participation", true, {
          selectedId: selected?.id || selected?.display,
          choiceIds: this.tray.map((part) => part.id || part.display),
          skill: "construction", activity: "build",
        });
        this.ctx.showLearningHint?.(target.parts[firstWrong], selected);
        this.ctx.sfx("wrong");
        // Scaffolded retry: one decoy that led the build astray leaves.
        const strayed = this.placed.slice(firstWrong).find(
          (p) => !target.parts.some((tp) => tp.display === p.part.display));
        const retryRound=this.roundIndex;
        setTimeout(() => {
        if (!this.alive || this.roundIndex!==retryRound) return;
          const removed = this.placed.splice(firstWrong);
          for (const p of removed) {
            p.slot.innerHTML = "";
            p.slot.disabled=true;
            p.slot.setAttribute('aria-label','Empty building space');
            p.slot.classList.remove("is-filled");
            p.btn.classList.remove("is-used");p.btn.disabled=false;
          }
          this.ctx.stage.querySelectorAll(".build-tile").forEach(b=>b.disabled=b.classList.contains("is-scaffolded"));
          this.placed.forEach(p=>{p.slot.disabled=!!p.fixed;if(p.btn)p.btn.disabled=true;});
          if (strayed) {strayed.btn.classList.add("is-scaffolded");strayed.btn.disabled=true;}
          this.ctx.say(target);
        }, 800);
      }
    }

    returnFrom(index) {
      if(!this.alive || !Number.isInteger(index) || index<0 || index>=this.placed.length || this.placed[index]?.fixed ||
        this.placed.length>=this.targets[this.roundIndex].parts.length)return;
      const removed=this.placed.splice(index);
      for(const {slot,btn} of removed){
        slot.innerHTML='';slot.disabled=true;
        slot.setAttribute('aria-label','Empty building space');
        slot.classList.remove('is-filled');btn.classList.remove('is-used');btn.disabled=false;
      }
      // Keep the order of the surviving prefix. A motor correction is not a
      // completed answer, so it neither adds a slip nor triggers reward logic.
      removed[0].btn.focus({preventScroll:true});
      this.ctx.say(this.targets[this.roundIndex]);
    }

    destroy() { this.alive = false; this.stopHint?.(); }
  }

  // Completed creations are toys as well as answers. This desk never emits
  // learning evidence: only the preceding guided merge owns the outcome.
  function joinActionIcon(split) {
    return `<svg viewBox="0 0 64 40" aria-hidden="true"><rect x="4" y="11" width="20" height="24" rx="6" fill="#fffaf0" stroke="#4a3620" stroke-width="3"/><rect x="40" y="11" width="20" height="24" rx="6" fill="#e5dcc8" stroke="#4a3620" stroke-width="3"/><path d="${split ? 'M27 7H9L14 2M9 7L14 12M37 7H55L50 2M55 7L50 12' : 'M6 7H26L21 2M26 7L21 12M58 7H38L43 2M38 7L43 12'}" fill="none" stroke="#4a3620" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function showJoiningResult(game, item, variants = [item]) {
    const ctx=game.ctx, round=game.roundIndex;
    game.releaseActiveDrag?.();
    game.ready=true;
    let current=item, split=false;
    const render=(focus='.join-next', speak=true)=>{
      if(!game.alive || !game.ready || game.roundIndex!==round)return;
      const version=game.resultVersion=(game.resultVersion || 0)+1;
      const active=()=>game.alive && game.ready && game.roundIndex===round && game.resultVersion===version;
      game.scene.classList.add('is-created');
      game.scene.innerHTML=`<div class="join-result${variants.length>1 ? ' has-variants' : ''}${split ? ' is-split' : ''}">
        <div class="join-output">
          <button type="button" class="join-whole" aria-label="Hear ${current.display}"${split ? ' hidden' : ''}>${workshopTile(current.display)}<span class="build-listen" aria-hidden="true">${Art.icon('speaker',28)}</span></button>
          <div class="join-parts"${split ? '' : ' hidden'}>${current.parts.map(part=>`<button type="button" class="join-piece" aria-label="Hear ${part.display}">${workshopTile(part.display)}</button>`).join('')}</div>
        </div>
        ${variants.length>1 ? `<div class="join-variants" role="group" aria-label="Try a different vowel">${variants.map((v,i)=>`<button type="button" class="join-variant" data-variant="${i}" aria-label="Try ${v.display}" aria-pressed="${v===current}">${workshopTile(v.parts[1].display)}</button>`).join('')}</div>` : ''}
        <div class="join-tools"><button type="button" class="join-toggle" aria-label="${split ? 'Join the pieces' : 'Separate the pieces'}">${joinActionIcon(!split)}</button><button type="button" class="join-next" aria-label="Next creation">${Art.icon('next',32)}</button></div>
      </div>`;
      const whole=game.scene.querySelector('.join-whole');
      whole.onclick=()=>{if(active())ctx.say(current);};
      game.scene.querySelectorAll('.join-piece').forEach((el,i)=>{
        el.onclick=()=>{if(active())ctx.say(current.parts[i]);};
      });
      game.scene.querySelector('.join-toggle').onclick=()=>{
        if(!active())return;
        split=!split;render('.join-toggle',!split);
      };
      game.scene.querySelectorAll('.join-variant').forEach((el,i)=>{
        el.onclick=()=>{
          if(!active())return;
          current=variants[i];split=false;render(`[data-variant="${i}"]`);
        };
      });
      game.scene.querySelector('.join-next').onclick=()=>{
        if(!active())return;
        game.ready=false;game.resultVersion++;game.roundIndex++;
        if(game.roundIndex>=game.rounds.length){game.alive=false;ctx.onDone(game.slips);return;}
        game.startRound();ctx.stage.querySelector('.blend-part:not(:disabled)')?.focus?.({preventScroll:true});
      };
      // Keep the pet's replay bubble in sync, without beginning another scored
      // prompt or treating a vowel experiment as independent recognition.
      ctx.setPrompt(current,{promptMode:'explore',skill:'joining'});
      if(speak)ctx.say(current);
      game.scene.querySelector(focus)?.focus?.({preventScroll:true});
    };
    render();
  }

  // ---------- Blend Machine: drag letter and vowel together, hear them fuse ----------
  // The moment of learning to read, made tactile (spec: specs/02-letter-garden-v2.md):
  // the letter and its haraka are two physical friends; push them into each
  // other and the syllable pops out and SPEAKS. Early rounds are pure
  // mechanic joy (only the true pair on stage); later rounds add a decoy
  // vowel, so the child must blend the pair they HEARD.
  class BlendGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      const pool = ctx.items.filter((i) => i.parts && i.parts.length === 2);
      const targets = shuffle(pool).slice(0, ctx.rounds || 4);
      while (targets.length < (ctx.rounds || 4) && pool.length) targets.push(pool[targets.length % pool.length]);
      this.rounds = targets.map((target, r) => {
        let decoy = null;
        if (r >= 2) {
          const other = shuffle(pool).find(
            (i) => i.parts[1].display !== target.parts[1].display &&
              i.parts[1].display !== target.parts[0].display,
          );
          if (other) decoy = other.parts[1];
        }
        return { target, decoy };
      });
      this.roundIndex = 0;
      this.slips = 0;
      this.startRound();
    }

    startRound() {
      if (!this.alive) return;
      this.releaseActiveDrag();
      this.ready=false;
      const ctx = this.ctx;
      const { target, decoy } = this.rounds[this.roundIndex];
      ctx.setPrompt(target, {
        promptMode: "match", skill: "joining",
        choiceIds: [target.parts[0], target.parts[1], ...(decoy ? [decoy] : [])]
          .map((part) => part.id || part.display),
        activity: ctx.activity || "blend",
      });
      ctx.say(target);

      // Letter enters from the right (reading direction), vowels wait left.
      const parts = [
        { part: target.parts[0], kind: "letter", x: 72, y: 46 },
        { part: target.parts[1], kind: "vowel", x: 26, y: decoy ? 28 : 46 },
      ];
      if (decoy) parts.push({ part: decoy, kind: "vowel", x: 26, y: 66 });

      ctx.stage.innerHTML = `
        <div class="blend-scene">
          <div class="blend-glow"></div>
          ${parts
            .map(
              (p, i) => `
            <button type="button" class="blend-part" data-i="${i}" data-kind="${p.kind}" aria-label="${p.part.display}"
              style="left:${p.x}%; top:${p.y}%">${workshopTile(p.part.display)}</button>`,
            )
            .join("")}
        </div>`;

      this.scene = ctx.stage.querySelector(".blend-scene");
      this.parts = parts;
      this.els = [...ctx.stage.querySelectorAll(".blend-part")];
      this.merging = false;
      this.retrying = false;
      this.selected = null;
      this.els.forEach((el) => {el.setAttribute("aria-pressed","false");this.wireDrag(el);});
      // Nudge the pieces toward the middle of the machine so "bring these
      // together" is visible before the child has tried anything.
      if (this.stopHint) this.stopHint();
      this.stopHint = dragHint(this.els, this.scene);
    }

    // Drag with a tap fallback: a real drag pushes a tile around; a simple
    // tap lifts it, and tapping a second tile blends the two — small fingers
    // get both physics and forgiveness.
    wireDrag(el) {
      let startX = 0;
      let startY = 0;
      let baseL = 0;
      let baseT = 0;
      let moved = false;

      el.addEventListener("pointerdown", (e) => {
        if (e.button>0 || e.isPrimary === false || el.__lgPointer != null || this.activeDrag || !this.alive || this.merging || this.retrying || el.classList.contains("is-scaffolded") || el.classList.contains("is-gone")) return;
        const bounds = this.scene.getBoundingClientRect();
        if (!Number.isFinite(bounds.width) || !Number.isFinite(bounds.height) || bounds.width <= 0 || bounds.height <= 0 || !Number.isFinite(this.scene.clientWidth) || !Number.isFinite(this.scene.clientHeight) || this.scene.clientWidth <= 0 || this.scene.clientHeight <= 0) return;
        el.__lgPointer = e.pointerId;
        this.activeDrag = { el, id: e.pointerId };
        el.setPointerCapture(e.pointerId);
        startX = e.clientX;
        startY = e.clientY;
        baseL = el.offsetLeft;
        baseT = el.offsetTop;
        moved = false;
        if (this.stopHint) this.stopHint();
        this.els.forEach(piece=>piece.classList.add("is-touched"));
        el.classList.add("is-held", "is-touched");
        const idx = Number(el.dataset.i);
        const p = this.parts[idx].part;
        this.ctx.say({ display: p.display, speak: p.speak || p.display });
      });

      el.addEventListener("pointermove", (e) => {
        if (!el.classList.contains("is-held") || this.merging || (e.pointerId != null && e.pointerId !== el.__lgPointer)) return;
        const bounds = this.scene.getBoundingClientRect();
        if (!Number.isFinite(bounds.width) || !Number.isFinite(bounds.height) || bounds.width <= 0 || bounds.height <= 0 || !Number.isFinite(this.scene.clientWidth) || !Number.isFinite(this.scene.clientHeight) || this.scene.clientWidth <= 0 || this.scene.clientHeight <= 0) return;
        const dx = (e.clientX - startX) * this.scene.clientWidth / bounds.width;
        const dy = (e.clientY - startY) * this.scene.clientHeight / bounds.height;
        if (Math.hypot(dx, dy) > 8) moved = true;
        if (moved) {
          el.style.left = `${Math.max(el.offsetWidth/2,Math.min(this.scene.clientWidth-el.offsetWidth/2,baseL+dx))}px`;
          el.style.top = `${Math.max(el.offsetHeight/2,Math.min(this.scene.clientHeight-el.offsetHeight/2,baseT+dy))}px`;
          const hit = this.hitOther(el);
          this.els.forEach((o) => o.classList.toggle("is-near", o === hit));
        }
      });

      const cancel = (e) => {
        if (e && e.pointerId !== el.__lgPointer) return;
        const id = el.__lgPointer;
        el.__lgPointer = null;
        if (this.activeDrag?.el === el && (e == null || e.pointerId === this.activeDrag.id)) this.activeDrag = null;
        el.classList.remove("is-held");
        this.els.forEach(o=>o.classList.remove("is-near"));
        if(this.alive&&!this.merging)this.springBack(el);
        if (id != null && el.hasPointerCapture?.(id)) el.releasePointerCapture(id);
      };
      el.addEventListener("pointercancel",cancel);
      el.addEventListener("lostpointercapture",(e)=>{if(el.classList.contains("is-held"))cancel(e);});
      el.addEventListener("pointerup", (e) => {
        if (!el.classList.contains("is-held") || (e.pointerId != null && e.pointerId !== el.__lgPointer)) return;
        // Read the drop while the held geometry still follows the pointer.
        const droppedOn = moved ? this.hitOther(el) : null;
        el.__lgPointer = null;
        if (this.activeDrag?.el === el) this.activeDrag = null;
        el.classList.remove("is-held");
        this.els.forEach((o) => o.classList.remove("is-near"));
        if (el.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
        if (this.merging) return;
        if (moved) {
          if (droppedOn) this.tryBlend(el, droppedOn);
          else this.springBack(el);
          return;
        }
        this.selectPart(el);
      });
      el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.selectPart(el);}});
    }

    selectPart(el) {
      if(!this.alive||this.merging||this.retrying||el.disabled||!this.els.includes(el))return;
      this.stopHint?.();
      this.els.forEach(piece=>piece.classList.add("is-touched"));
      const previous=this.selected;
      this.els.forEach(e=>{e.classList.remove('is-lifted');e.setAttribute('aria-pressed','false');});
      this.selected=null;
      if(previous&&previous!==el){this.tryBlend(previous,el);return;}
      if(previous===el)return;
      this.selected=el;el.classList.add('is-lifted');el.setAttribute('aria-pressed','true');
      this.ctx.say(this.parts[Number(el.dataset.i)].part);
    }

    hitOther(el) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      for (const other of this.els) {
        if (other === el || other.disabled || other.classList.contains("is-scaffolded") || other.classList.contains("is-gone")) continue;
        const o = other.getBoundingClientRect();
        // Generous: a piece dropped anywhere near its partner joins it.
        if (Math.hypot(o.left + o.width / 2 - cx, o.top + o.height / 2 - cy) < r.width * 0.95) {
          return other;
        }
      }
      return null;
    }

    springBack(el) {
      const idx = Number(el.dataset.i);
      el.style.left = `${this.parts[idx].x}%`;
      el.style.top = `${this.parts[idx].y}%`;
    }

    tryBlend(a, b) {
      if (!this.alive || this.merging || this.retrying || (this.els && (!this.els.includes(a)||!this.els.includes(b)))) return;
      const round=this.roundIndex;
      const { target } = this.rounds[round];
      const pa = this.parts[Number(a.dataset.i)];
      const pb = this.parts[Number(b.dataset.i)];
      if (pa.kind === pb.kind) {
        this.springBack(a);
        return; // two vowels can't fuse — just drift home, no penalty
      }
      const displays = new Set([pa.part.display, pb.part.display]);
      const isTarget =
        displays.has(target.parts[0].display) && displays.has(target.parts[1].display);

      if (!isTarget) {
        this.retrying = true;
        this.slips += 1;
        const selected = [pa, pb].find((part) =>
          part.kind === "vowel" && part.part.display !== target.parts[1].display)?.part;
        reportOutcome(this.ctx, target, false, "motor_assembly_participation", true, {
          selectedId: selected?.id || selected?.display,
          choiceIds: this.parts.map((part) => part.part.id || part.part.display),
          skill: "joining", activity: this.ctx.activity || "blend",
        });
        this.ctx.showLearningHint?.(target.parts[1], selected);
        this.ctx.sfx("wrong");
        // Keep the known letter still; the comparison explains the mismatch.
        // Scaffolded retry: the decoy vowel that fooled the fuse drifts off.
        const decoyEl = [a, b].find((el) => {
          const p = this.parts[Number(el.dataset.i)];
          return p.kind === "vowel" && p.part.display !== target.parts[1].display;
        });
        setTimeout(() => {
        if (!this.alive || this.roundIndex!==round) return;
          this.retrying = false;
          a.classList.remove("is-shake");
          b.classList.remove("is-shake");
          this.springBack(a);
          this.springBack(b);
          if (decoyEl) {decoyEl.classList.add("is-scaffolded");decoyEl.disabled=true;}
          this.ctx.say(target);
        }, 550);
        return;
      }

      this.stopHint?.();
      this.merging=true;
      this.releaseActiveDrag();
      for(const el of [a,b]){
        el.disabled=true;el.classList.add('is-fusing');
        el.style.left='50%';el.style.top='46%';
      }
      const reveal=()=>{
        if(!this.alive || this.roundIndex!==round || this.ready)return;
        reportAssembly(this.ctx,target,true);
        this.ctx.clearLearningHint?.();
        // Only authored alternatives already supplied by this lesson qualify.
        // Never build an arbitrary syllable from a decoy or another chapter.
        const variants=[target];
        if(this.ctx.activity!=='fuse')for(const other of this.ctx.items || []){
          if(variants.length===3)break;
          if(other.parts?.length===2 && other.parts[0].display===target.parts[0].display &&
            !variants.some(v=>v.display===other.display))variants.push(other);
        }
        showJoiningResult(this,target,variants);
        this.ctx.sfx('correct');
        this.ctx.confettiAt(this.scene.querySelector('.join-whole'));
      };
      if(this.ctx.reducedMotion?.())reveal();else setTimeout(reveal,420);
    }

    releaseActiveDrag() { const active=this.activeDrag; if (!active) return; const el=active.el; if (el?.hasPointerCapture?.(active.id)) el.releasePointerCapture(active.id); el.__lgPointer=null; el.classList.remove("is-held"); this.activeDrag=null; }
    destroy() { this.alive = false; this.stopHint?.(); this.releaseActiveDrag(); (this.els || []).forEach((el) => { const id=el.__lgPointer; if(id != null && el.hasPointerCapture?.(id)) el.releasePointerCapture(id); el.__lgPointer=null; el.classList.remove("is-held"); }); }
  }

  // ---------- Un-fuse: pull a joined shape apart, find who was hiding ----------
  // The reverse of the fuse — and literally decoding practice. Phase A is
  // pure joy (grab the fused shape, pull, it splits and each letter says its
  // name); phase B is the verdict (three letters wait, "find the one you
  // heard" — the strength model records the single letter).
  // Teach a drag without giving the answer away (2026-07-24). Fuse and Chain both
  // accept a plain tap, so unlike un-fuse they can't dead-end a child — but
  // nothing showed that pieces are meant to travel to a target, and the
  // "is-near" highlight only appears once you're ALREADY dragging.
  //
  // Every draggable nudges a little way toward the target and settles, on a loop,
  // until the child touches something. Deliberately applied to ALL candidates and
  // never just the correct one: Chain is a quiz, so demoing the right tile would
  // hand over the answer.
  function dragHint(tiles, target) {
    if (!tiles.length || !target) return () => {};
    let timer = null;
    const pulse = () => {
      const t = target.getBoundingClientRect();
      const tx = t.left + t.width / 2;
      const ty = t.top + t.height / 2;
      let live = false;
      for (const el of tiles) {
        if (!el.isConnected || el.classList.contains("is-gone")) continue;
        live = true;
        const r = el.getBoundingClientRect();
        const dx = tx - (r.left + r.width / 2);
        const dy = ty - (r.top + r.height / 2);
        const len = Math.hypot(dx, dy) || 1;
        el.style.setProperty("--hint-dx", (dx / len).toFixed(3));
        el.style.setProperty("--hint-dy", (dy / len).toFixed(3));
        el.classList.remove("is-dragdemo");
        void el.offsetWidth;
        el.classList.add("is-dragdemo");
      }
      target.classList.remove("is-drop-target");
      void target.offsetWidth;
      target.classList.add("is-drop-target");
      if (!live) stop();
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
      for (const el of tiles) el.classList.remove("is-dragdemo");
      target.classList.remove("is-drop-target");
    };
    setTimeout(() => timer !== null && pulse(), 1300);
    timer = setInterval(pulse, 3400);
    return stop;
  }

  class UnfuseGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      const pool = ctx.items.filter((i) => i.parts && i.parts.length === 2);
      const count=ctx.rounds || 4;
      this.targets = shuffle(pool).slice(0, count);
      while (this.targets.length < count && pool.length)
        this.targets.push(pool[this.targets.length % pool.length]);
      this.roundIndex = 0;
      this.slips = 0;
      this.startRound();
    }

    startRound() {
      if(!this.alive)return;
      this.stopHint?.();
      this.releasePull();
      this.busy=false;
      this.phase="pull";
      const round=this.roundIndex;
      const ctx = this.ctx;
      const target = this.targets[this.roundIndex];
      ctx.setPrompt(target);
      ctx.say(target);
      // The seam, outward arrows and gentle tug demonstrate pulling. The
      // separate-pieces control provides a direct tap alternative, while the
      // whole tile retains its three-tap fallback and keyboard shortcut.
      const arrow = (dir) =>
        `<span class="unfuse-arrow is-${dir}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 5 L3 12 L9 19" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
      ctx.stage.innerHTML = `
        <div class="unfuse-scene">
          <div class="unfuse-pull">
            ${arrow("l")}
            <button type="button" class="unfuse-whole" aria-label="Pull the letters apart">
              ${workshopTile(target.display)}
              <span class="unfuse-seam" aria-hidden="true"></span>
            </button>
            ${arrow("r")}
          </div>
          <button type="button" class="discovery-tool unfuse-open" aria-label="Separate the pieces">${joinActionIcon(true)}</button>
          <div class="unfuse-discovery" hidden>
            <div class="unfuse-halves" hidden>${target.parts.map((part,i)=>`<button type="button" class="unfuse-half is-${i ? 'l' : 'r'}" aria-label="Hear ${part.display}">${workshopTile(part.display)}<span class="build-listen" aria-hidden="true">${Art.icon('speaker',24)}</span></button>`).join('')}</div>
            <button type="button" class="discovery-next unfuse-find" aria-label="Find a freed letter">${Art.icon('next',32)}</button>
          </div>
          <div class="unfuse-quiz" hidden></div>
        </div>`;
      const whole = ctx.stage.querySelector(".unfuse-whole");
      let sx = 0;
      let sy = 0;
      let pulled = false;
      let taps = 0;
      this.whole = whole;
      // Demonstrate the pull on a loop until the child manages one themselves.
      clearInterval(this.hintTimer);
      const tug = () => {
        if (!this.alive || this.phase!=="pull" || this.roundIndex!==round || pulled || !whole.isConnected) return clearInterval(this.hintTimer);
        whole.classList.remove("is-tugging");
        void whole.offsetWidth;
        whole.classList.add("is-tugging");
      };
      if(!ctx.reducedMotion?.()){setTimeout(tug,1200);this.hintTimer=setInterval(tug,3200);}
      const stopHint = this.stopHint = () => {
        clearInterval(this.hintTimer);
        whole.classList.remove("is-tugging");
      };
      // A double-click on the preceding Next can land here after the rerender.
      ctx.stage.querySelector(".unfuse-open").onclick=(e)=>{if(e?.detail>1)return;if(this.alive&&this.phase==="pull"&&this.roundIndex===round)this.split();};
      whole.addEventListener("keydown", (e) => {
        if(e.key!=="Enter" && e.key!==" ")return;
        e.preventDefault();
        if(e.repeat || !this.alive || this.phase!=="pull" || this.roundIndex!==round || !whole.isConnected)return;
        pulled=true;
        stopHint();
        this.split();
      });
      whole.addEventListener("pointerdown", (e) => {
        if(e.button>0 || e.isPrimary === false || whole.__lgPointer != null || !this.alive || this.phase!=="pull" || this.roundIndex!==round || !whole.isConnected)return;
        if (!this.canStartDrag(whole)) return;
        whole.__lgPointer = e.pointerId;
        whole.setPointerCapture(e.pointerId);
        sx = e.clientX;
        sy = e.clientY;
        pulled = false;
        stopHint(); // they're engaging — stop nagging
        whole.classList.add("is-held");
      });
      whole.addEventListener("pointermove", (e) => {
        if (!whole.classList.contains("is-held") || pulled || e.pointerId !== whole.__lgPointer) return;
        if (!this.canStartDrag(whole)) { release(e); return; }
        const d = Math.hypot(e.clientX - sx, e.clientY - sy);
        // The tile strains as the child pulls, then gives way.
        whole.style.setProperty("--strain", String(Math.min(1, d / 46)));
        if (d > 46) {
          pulled = true;
          this.split();
        }
      });
      const release = (e) => {
        if (e && e.pointerId !== whole.__lgPointer) return;
        const id = whole.__lgPointer; whole.__lgPointer = null;
        whole.classList.remove("is-held");
        whole.style.setProperty("--strain", "0");
        if (id != null && whole.hasPointerCapture?.(id)) whole.releasePointerCapture(id);
      };
      whole.addEventListener("pointercancel",release);
      whole.addEventListener("lostpointercapture",(e)=>{if(whole.classList.contains("is-held"))release(e);});
      whole.addEventListener("pointerup", (e) => {
        if (e.pointerId !== whole.__lgPointer) return;
        release(e);
        if (!pulled && this.alive && this.phase==="pull" && this.roundIndex===round) {
          // A plain tap wobbles and replays the sound — the hint IS the toy.
          whole.classList.remove("is-shake");
          void whole.offsetWidth;
          whole.classList.add("is-shake");
          this.ctx.say(this.targets[this.roundIndex]);
          // No dead ends (locked: no failable moments). If tapping hasn't
          // turned into a pull after a few tries, open it for them — they still
          // see the halves fly apart and still answer the quiz, which is where
          // the learning actually is.
          taps += 1;
          if (taps >= 3) {
            pulled = true;
            stopHint();
            this.split();
          }
        }
      });
    }

    releasePull() {
      const whole=this.whole, id=whole?.__lgPointer;
      if(!whole)return;
      whole.__lgPointer=null;
      whole.classList.remove('is-held');whole.style.setProperty('--strain','0');
      if(id!=null && whole.hasPointerCapture?.(id))whole.releasePointerCapture(id);
    }

    split() {
      if(!this.alive || this.phase!=='pull')return;
      this.phase='explore';this.busy=true;this.releasePull();this.stopHint?.();
      const ctx=this.ctx, round=this.roundIndex, target=this.targets[round];
      clearInterval(this.hintTimer);
      const pull=ctx.stage.querySelector('.unfuse-pull'),halves=ctx.stage.querySelector('.unfuse-halves');
      pull.hidden=true;halves.hidden=false;
      ctx.stage.querySelector('.unfuse-open').hidden=true;
      ctx.stage.querySelector('.unfuse-discovery').hidden=false;
      reportAssembly(ctx,target,undefined);
      ctx.setPrompt?.(target,{promptMode:'explore',skill:'segmenting'});
      ctx.sfx('hatch');ctx.confettiAt(halves);
      // The existing names queue owns sequencing; a fixed second-letter timer
      // must not cut off a slower voice. Each freed letter also has its own replay.
      ctx.say(target);
      (halves.querySelectorAll?.('.unfuse-half') || []).forEach((button,i)=>{
        button.onclick=()=>{if(this.alive&&this.phase==='explore'&&this.roundIndex===round)ctx.say(target.parts[i]);};
      });
      const next=ctx.stage.querySelector('.unfuse-find');
      next.onclick=()=>{if(this.alive&&this.phase==='explore'&&this.roundIndex===round)this.quiz();};
      next.focus?.({preventScroll:true});
    }

    canStartDrag(el) {
      const bounds = el?.getBoundingClientRect?.();
      return !!bounds && Number.isFinite(bounds.width) && Number.isFinite(bounds.height) && bounds.width > 0 && bounds.height > 0;
    }

    quiz() {
      if(!this.alive || this.phase!=="explore")return;
      this.phase="quiz";this.busy=false;
      const round=this.roundIndex;
      const ctx = this.ctx;
      const target = this.targets[round];
      // Ask for one of the two freed letters; a third letter crashes the
      // line-up as the decoy.
      const wanted = target.parts[Math.floor(Math.random() * 2)];
      const decoyPool = (ctx.extraItems || []).filter(
        (l) => l.display !== target.parts[0].display && l.display !== target.parts[1].display,
      );
      const decoy = shuffle(decoyPool)[0];
      const options = shuffle([
        { display: target.parts[0].display, speak: target.parts[0].speak },
        { display: target.parts[1].display, speak: target.parts[1].speak },
        ...(decoy ? [{ display: decoy.display, speak: decoy.speak }] : []),
      ]);
      const promptTarget = { id: wanted.id || wanted.display, display: wanted.display, speak: wanted.speak };
      const quizRound = {
        target: promptTarget, options: options.map((option) => ({ ...option, id: option.id || option.display })),
        promptMode: "match", skill: "segmenting",
      };
      presentRound(ctx, quizRound, "unfuse");
      const quizEl = ctx.stage.querySelector(".unfuse-quiz");
      ctx.stage.querySelector(".unfuse-discovery").hidden = true;
      quizEl.hidden = false;
      quizEl.innerHTML = options
        .map((o, i) => `<button type="button" class="unfuse-pick" data-i="${i}" aria-label="${o.display}">${workshopTile(o.display)}</button>`)
        .join("");
      for (const btn of quizEl.querySelectorAll(".unfuse-pick")) {
        btn.addEventListener("click", () => {
          if(!this.alive||this.phase!=="quiz"||this.roundIndex!==round||btn.disabled)return;
          const o = options[Number(btn.dataset.i)];
          if (o.display === wanted.display) {
            this.busy=true;this.phase='result';
            reportPromptMatch(ctx,quizRound,true,{...o,id:o.id || o.display},'unfuse');
            ctx.clearLearningHint?.();ctx.sfx('correct');ctx.confettiAt(btn);
            ctx.setPrompt(promptTarget,{promptMode:'explore',skill:'segmenting'});
            quizEl.classList.add('is-solved');
            quizEl.innerHTML=`<button type="button" class="unfuse-found" aria-label="Hear ${o.display}">${workshopTile(o.display)}<span class="build-listen" aria-hidden="true">${Art.icon('speaker',24)}</span></button><button type="button" class="discovery-next unfuse-next" aria-label="Next pair">${Art.icon('next',32)}</button>`;
            quizEl.querySelector('.unfuse-found').onclick=()=>{if(this.alive&&this.phase==='result'&&this.roundIndex===round)ctx.say(o);};
            const next=quizEl.querySelector('.unfuse-next');
            next.onclick=()=>{
              if(!this.alive||this.phase!=='result'||this.roundIndex!==round)return;
              this.phase='advancing';this.roundIndex++;
              if(this.roundIndex>=this.targets.length){this.alive=false;ctx.onDone(this.slips);return;}
              this.startRound();this.whole.focus?.({preventScroll:true});
            };
            ctx.say(o);next.focus?.({preventScroll:true});
          } else {
            btn.disabled=true;
            this.slips += 1;
            reportPromptMatch(ctx, quizRound, false, { ...o, id: o.id || o.display }, "unfuse");
            helpAfterWrong(ctx, quizRound, o);
            ctx.sfx("wrong");
            const svg = btn.querySelector("svg");
            svg.classList.remove("is-shake");
            void svg.offsetWidth;
            svg.classList.add("is-shake");
            btn.classList.add("is-scaffolded");
            if (ctx.pulsePrompt) ctx.pulsePrompt();
            ctx.say({ display: wanted.display, speak: wanted.speak });
          }
        });
      }
      quizEl.querySelector(".unfuse-pick")?.focus?.({preventScroll:true});
    }

    destroy() { this.alive=false; this.stopHint?.(); clearInterval(this.hintTimer); this.releasePull(); }
  }

  // ---------- Chain: grow a two-letter join into three ----------
  // The bridge to real words. A fused pair sits on stage; the child heard
  // the full three-name chain and must drag the right third letter on —
  // the chain grows leftward, exactly the direction Arabic reads.
  class ChainGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      const pool = ctx.items.filter((i) => i.parts && i.parts.length === 2 && i.join2);
      const singles = (ctx.extraItems || []).slice();
      this.rounds = shuffle(pool).slice(0, ctx.rounds || 4).map((pair, r) => {
        const candidates = shuffle(
          singles.filter(
            (l) => l.display !== pair.parts[0].display && l.display !== pair.parts[1].display,
          ),
        );
        const third = candidates[0];
        const decoy = r >= 1 ? candidates[1] : null;
        return { pair, third, decoy };
      }).filter((r) => r.third);
      const unique = this.rounds.length;
      while (this.rounds.length < (ctx.rounds || 4) && unique) {
        this.rounds.push(this.rounds[this.rounds.length % unique]);
      }
      this.roundIndex = 0;
      this.slips = 0;
      this.startRound();
    }

    startRound() {
      if(!this.alive)return;
      this.releaseActiveDrag?.();
      this.busy=false;
      this.ready=false;
      const ctx = this.ctx;
      const { pair, third, decoy } = this.rounds[this.roundIndex];
      const chain = {
        id: pair.display + third.display,
        display: pair.display + third.display,
        speak: `${pair.speak}، ${third.speak}`,
        parts: [pair,third],
      };
      this.chain = chain;
      const thirds = [{ l: third, x: 22, y: decoy ? 30 : 50 }];
      if (decoy) thirds.push({ l: decoy, x: 22, y: 68 });
      ctx.setPrompt(chain, {
        promptMode: "match", skill: "joining",
        choiceIds: thirds.map(({ l }) => l.id || l.display), activity: "chain",
      });
      ctx.say(chain);
      ctx.stage.innerHTML = `
        <div class="blend-scene chain-scene chain-bridge" data-skill="joining">
          <div class="blend-glow"></div>
          <span class="chain-base">${workshopTile(pair.display)}</span>
          ${thirds
            .map(
              (t, i) => `<button type="button" class="blend-part chain-third" data-i="${i}" aria-label="${t.l.display}"
                style="left:${t.x}%; top:${t.y}%">${workshopTile(t.l.display)}</button>`,
            )
            .join("")}
        </div>`;
      this.thirds = thirds;
      this.scene = ctx.stage.querySelector(".blend-scene");
      this.base = ctx.stage.querySelector(".chain-base");
      const thirdEls = [...ctx.stage.querySelectorAll(".chain-third")];
      for (const el of thirdEls) this.wireDrag(el);
      if (this.roundIndex === 0 && thirdEls[0]) {
        this.base.classList.add("is-demo");
        thirdEls[0].classList.add("is-demo");
        setTimeout(() => {
          if (!this.alive || this.roundIndex !== 0) return;
          this.base.classList.remove("is-demo");
          thirdEls[0].classList.remove("is-demo");
        }, 1400);
      }
      if (this.stopHint) this.stopHint();
      this.stopHint = dragHint(thirdEls, this.base);
    }

    wireDrag(el) {
      let sx = 0;
      let sy = 0;
      let baseL = 0;
      let baseT = 0;
      let moved = false;
      el.addEventListener("pointerdown", (e) => {
        if (e.button>0 || e.isPrimary === false || el.__lgPointer != null || this.activeDrag || !this.alive || this.busy || el.classList.contains("is-gone") || el.classList.contains("is-scaffolded")) return;
        const scene = this.base.parentElement;
        const bounds = scene.getBoundingClientRect();
        if (!Number.isFinite(bounds.width) || !Number.isFinite(bounds.height) || bounds.width <= 0 || bounds.height <= 0 || !Number.isFinite(scene.clientWidth) || !Number.isFinite(scene.clientHeight) || scene.clientWidth <= 0 || scene.clientHeight <= 0) return;
        el.__lgPointer = e.pointerId;
        this.activeDrag = { el, id: e.pointerId };
        el.setPointerCapture(e.pointerId);
        sx = e.clientX;
        sy = e.clientY;
        baseL = el.offsetLeft;
        baseT = el.offsetTop;
        moved = false;
        if (this.stopHint) this.stopHint();
        el.classList.add("is-held", "is-touched");
        const t = this.thirds[Number(el.dataset.i)].l;
        this.ctx.say({ display: t.display, speak: t.speak });
      });
      el.addEventListener("pointermove", (e) => {
        if (!el.classList.contains("is-held") || (e.pointerId != null && e.pointerId !== el.__lgPointer)) return;
        const scene=this.base.parentElement;const bounds=scene.getBoundingClientRect();
        if (!Number.isFinite(bounds.width) || !Number.isFinite(bounds.height) || bounds.width <= 0 || bounds.height <= 0 || !Number.isFinite(scene.clientWidth) || !Number.isFinite(scene.clientHeight) || scene.clientWidth <= 0 || scene.clientHeight <= 0) return;
        const dx = (e.clientX - sx)*scene.clientWidth/bounds.width;
        const dy = (e.clientY - sy)*scene.clientHeight/bounds.height;
        if (Math.hypot(dx, dy) > 8) moved = true;
        if (moved) {
          el.style.left = `${Math.max(el.offsetWidth/2,Math.min(scene.clientWidth-el.offsetWidth/2,baseL+dx))}px`;
          el.style.top = `${Math.max(el.offsetHeight/2,Math.min(scene.clientHeight-el.offsetHeight/2,baseT+dy))}px`;
          this.base.classList.toggle("is-near", this.hitsBase(el));
        }
      });
      const release = (e)=>{if(e&&e.pointerId!==el.__lgPointer)return;const id=el.__lgPointer;el.__lgPointer=null;if(this.activeDrag?.el===el)this.activeDrag=null;el.classList.remove("is-held");this.base.classList.remove("is-near");if(this.alive&&!this.busy)this.springHome(el);if(id!=null&&el.hasPointerCapture?.(id))el.releasePointerCapture(id);};
      el.addEventListener("pointercancel",release);
      el.addEventListener("lostpointercapture",release);
      el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();this.tryChain(el);}});
      el.addEventListener("pointerup", (e) => {
        if (!el.classList.contains("is-held") || e.pointerId !== el.__lgPointer) return;
        const drop = moved ? this.hitsBase(el) : true; // tap = try it too
        el.__lgPointer=null; if(this.activeDrag?.el===el)this.activeDrag=null; el.classList.remove("is-held");
        if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);
        this.base.classList.remove("is-near");
        if (drop) this.tryChain(el);
        else this.springHome(el);
      });
    }

    hitsBase(el) {
      const r = el.getBoundingClientRect();
      const b = this.base.getBoundingClientRect();
      return (
        Math.hypot(
          b.left + b.width / 2 - (r.left + r.width / 2),
          b.top + b.height / 2 - (r.top + r.height / 2),
        ) < r.width * 0.85
      );
    }

    springHome(el) {
      const t = this.thirds[Number(el.dataset.i)];
      el.style.left = `${t.x}%`;
      el.style.top = `${t.y}%`;
    }

    tryChain(el) {
      if(!this.alive||this.busy||el.disabled||el.classList.contains("is-scaffolded")||(this.ctx.stage&&!this.ctx.stage.contains(el)))return;
      this.busy=true;
      this.stopHint?.();
      const ctx = this.ctx;
      const round=this.roundIndex;
      const { third } = this.rounds[round];
      const picked = this.thirds[Number(el.dataset.i)].l;
      if (picked.display !== third.display) {
        this.slips += 1;
        reportOutcome(ctx, this.chain, false, "supported_visible_matching", true, {
          selectedId: picked.id || picked.display,
          choiceIds: this.thirds.map(({ l }) => l.id || l.display),
          skill: "joining", activity: "chain",
        });
        ctx.showLearningHint?.(third, picked);
        ctx.sfx("wrong");
        const svg = el.querySelector("svg");
        svg.classList.remove("is-shake");
        void svg.offsetWidth;
        svg.classList.add("is-shake");
        setTimeout(() => {
              if(!this.alive || this.roundIndex!==round)return;
          this.busy=false;
          this.springHome(el);
          el.classList.add("is-scaffolded");el.disabled=true;
          ctx.say(this.chain);
        }, 550);
        return;
      }
      this.releaseActiveDrag();
      el.classList.add('is-fusing');el.disabled=true;
      el.style.left='50%';el.style.top='46%';
      const reveal=()=>{
        if(!this.alive || this.roundIndex!==round || this.ready)return;
        reportOutcome(ctx,this.chain,true,'supported_visible_matching',true,{
          selectedId:picked.id || picked.display,
          choiceIds:this.thirds.map(({l})=>l.id || l.display),
          skill:'joining',activity:'chain',
        });
        ctx.clearLearningHint?.();
        showJoiningResult(this,this.chain);
        ctx.sfx('correct');
        ctx.confettiAt(this.scene.querySelector('.join-whole'));
      };
      if(ctx.reducedMotion?.())reveal();else setTimeout(reveal,380);
    }

    releaseActiveDrag() { const active=this.activeDrag; if (!active) return; const el=active.el; if (el?.hasPointerCapture?.(active.id)) el.releasePointerCapture(active.id); el.__lgPointer=null; el.classList.remove("is-held"); this.activeDrag=null; }
    destroy() { this.alive=false; this.stopHint?.(); clearInterval(this.hintTimer); this.releaseActiveDrag(); (this.thirds||[]).forEach((_,i)=>{const el=this.ctx.stage?.querySelector?.(`.chain-third[data-i="${i}"]`);const id=el?.__lgPointer;if(el&&id!=null&&el.hasPointerCapture?.(id))el.releasePointerCapture(id);if(el)el.__lgPointer=null;}); }
  }

  // ---------- Costume parade: one letter, three outfits ----------
  // Explore the three positional forms at the child's pace, naming the same
  // letter throughout. Discovery reports participation only; the existing
  // two-choice recognition check remains a separate, explicit next step.
  class ParadeGame {
    constructor(ctx) {
      this.ctx=ctx;this.alive=true;this.slips=0;
      const joiners=(ctx.extraItems || []).filter(l=>l.joins);
      const pool=joiners.length ? joiners : ctx.items.filter(i=>i.parts?.length)
        .map(i=>({display:i.parts[0].display,speak:i.parts[0].speak,joins:true}));
      this.letters=shuffle([...new Map(pool.map(l=>[l.display,l])).values()]).slice(0,3);
      this.formsOf=ch=>[ch+'ـ','ـ'+ch+'ـ','ـ'+ch];
      this.roundIndex=0;this.startRound();
    }

    cover(index) {
      // A folded outfit with left/right connections hints at position, without
      // showing the letter before its reveal or adding written instructions.
      return `<svg viewBox="0 0 80 88" aria-hidden="true"><path d="M12 12Q40 5 68 12V74Q40 84 12 74Z" fill="#c9bda4"/><path d="M12 9Q40 2 68 9V69Q40 79 12 69Z" fill="#e5dcc8"/><path d="M16 12L37 8V71L16 66ZM43 8L64 12V66L43 71Z" fill="#fffaf0"/><path d="M40 8V73" stroke="#a89478" stroke-width="2.4"/><circle cx="34" cy="42" r="3" fill="#c69434"/><circle cx="46" cy="42" r="3" fill="#c69434"/><path d="${index<2?'M12 60H29':''}${index>0?'M51 60H68':''}" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/></svg>`;
    }

    cleanupGestures() {
      (this.dragResets||[]).forEach(reset=>reset());this.dragResets=[];
      this.formFlight?.cancel();this.formFlight=null;
    }

    startRound() {
      if(!this.alive)return;
      this.cleanupGestures();
      const ctx=this.ctx,round=this.roundIndex,letter=this.letters[round],forms=this.formsOf(letter.display);
      this.phase='explore';this.busy=false;this.dressed=0;
      ctx.setPrompt?.(null,{promptMode:'explore',skill:'contextual_forms',activity:'parade'});
      ctx.say(letter);
      ctx.stage.innerHTML=`<div class="parade-scene">
        <div class="parade-display">
          <button type="button" class="parade-star" aria-label="Hear ${letter.display}">${workshopTile(letter.display,"wood",72)}<span class="build-listen" aria-hidden="true">${Art.icon('speaker',24)}</span></button>
          <button type="button" class="parade-reference" aria-label="Hear original ${letter.display}" hidden>${workshopTile(letter.display)}</button>
        </div>
        <div class="parade-spots" dir="rtl">${forms.map((f,i)=>`<button type="button" class="parade-spot" data-i="${i}" aria-label="Reveal letter form ${i+1}" aria-pressed="false"><span class="parade-mystery" aria-hidden="true">${this.cover(i)}</span><span class="parade-form" hidden>${workshopTile(f,"wood",88)}</span></button>`).join('')}</div>
        <div class="parade-actions"><button type="button" class="discovery-next parade-continue" aria-label="Find this letter" hidden>${Art.icon('next',32)}</button></div>
      </div>`;
      const active=()=>this.alive&&this.phase==='explore'&&this.roundIndex===round;
      const star=ctx.stage.querySelector('.parade-star'),reference=ctx.stage.querySelector('.parade-reference');
      star.onclick=reference.onclick=()=>{if(active())ctx.say(letter);};
      const next=ctx.stage.querySelector('.parade-continue');
      next.onclick=()=>{
        if(!active()||this.dressed<3)return;
        this.phase='advancing';
        const alternate=this.letters.find(item=>item.display!==letter.display);
        if(alternate)this.startTransfer(letter,forms[round % forms.length],alternate);
        else this.advanceRound(round);
      };
      const spots=[...ctx.stage.querySelectorAll('.parade-spot')];
      const display=ctx.stage.querySelector('.parade-display');
      const accepts=(x,y)=>{const r=display?.getBoundingClientRect();return r?.width>0&&r.height>0&&x>=r.left-18&&x<=r.left+r.width+18&&y>=r.top-18&&y<=r.top+r.height+18;};
      spots.forEach((spot,i)=>{
        const choose=(released)=>{
          if(!active())return;
          this.formFlight?.cancel();this.formFlight=null;
          const from=released||spot.getBoundingClientRect?.();
          const form=spot.querySelector('.parade-form');
          if(form.hidden){
            spot.querySelector('.parade-mystery').hidden=true;form.hidden=false;
            spot.classList.add('is-dressed');this.dressed++;ctx.sfx('seed');
            spot.setAttribute('aria-label',`Hear form ${forms[i]}`);
            if(this.dressed===3){
              reportOutcome(ctx,{id:letter.id || letter.display},undefined,'motor_assembly_participation',false,{skill:'contextual_forms',activity:'parade'});
              ctx.confettiAt(ctx.stage.querySelector('.parade-spots'));next.hidden=false;
            }
          }
          star.innerHTML=`${workshopTile(forms[i],"wood",88)}<span class="build-listen" aria-hidden="true">${Art.icon('speaker',24)}</span>`;
          star.setAttribute('aria-label',`Hear form ${forms[i]}`);reference.hidden=false;
          spots.forEach(other=>other.setAttribute('aria-pressed',String(other===spot)));
          ctx.say(letter);
          const art=star.querySelector?.(':scope > svg'),to=art?.getBoundingClientRect?.();
          if(!ctx.reducedMotion?.()&&from?.width&&to?.width&&art.animate){
            this.formFlight=art.animate([
              {transform:`translate(${from.left-to.left}px,${from.top-to.top}px) scale(${from.width/to.width})`,opacity:.75},
              {transform:'translate(0,0) scale(1)',opacity:1}
            ],{duration:240,easing:'cubic-bezier(.2,.75,.25,1)'});
          }
        };
        if(ns.GardenPractice?.draggable)this.dragResets.push(ns.GardenPractice.draggable(spot,{
          enabled:active,
          onDragMove:(x,y)=>display.classList.toggle('is-near',accepts(x,y)),
          onDragEnd:()=>display.classList.remove('is-near'),
          drop:(x,y,released)=>{if(accepts(x,y))choose(released);}
        }));
        spot.addEventListener('click',()=>choose());
      });
    }

    advanceRound(round) {
      if(!this.alive || this.roundIndex!==round || !['result','advancing'].includes(this.phase))return;
      this.phase='advancing';this.roundIndex++;
      if(this.roundIndex>=this.letters.length){this.alive=false;this.cleanupGestures();this.ctx.onDone(this.slips || 0);return;}
      this.startRound();this.ctx.stage.querySelector('.parade-spot')?.focus?.({preventScroll:true});
    }

    startTransfer(letter,form,alternate) {
      if(!this.alive)return;
      this.cleanupGestures();
      this.phase='quiz';this.busy=false;
      const ctx=this.ctx,round=this.roundIndex;
      const target={id:letter.id || letter.display,display:form,speak:letter.speak};
      const options=shuffle([letter,alternate]);
      ctx.setPrompt(target,{promptMode:'match',skill:'contextual_forms',choiceIds:options.map(item=>item.id || item.display),activity:'parade'});
      ctx.say(letter);
      ctx.stage.innerHTML=`<div class="parade-scene parade-transfer">
        <div class="parade-display"><button type="button" class="parade-star" aria-label="Hear form ${form}">${workshopTile(form,"wood",88)}<span class="build-listen" aria-hidden="true">${Art.icon('speaker',24)}</span></button></div>
        <div class="parade-spots">${options.map((item,i)=>`<button type="button" class="parade-spot parade-choice" data-i="${i}" aria-label="${item.display}">${workshopTile(item.display,"wood",72)}</button>`).join('')}</div>
        <div class="parade-actions"><button type="button" class="discovery-next parade-next" aria-label="Next letter" hidden>${Art.icon('next',32)}</button></div>
      </div>`;
      ctx.stage.querySelector('.parade-star').onclick=()=>{if(this.alive&&this.roundIndex===round)ctx.say(letter);};
      const next=ctx.stage.querySelector('.parade-next');
      next.onclick=()=>{if(this.phase==='result')this.advanceRound(round);};
      const buttons=[...ctx.stage.querySelectorAll('.parade-choice')];
      for(const button of buttons){
        button.addEventListener('click',()=>{
          if(!this.alive || this.roundIndex!==round || button.disabled)return;
          const selected=options[Number(button.dataset.i)];
          if(this.phase==='result'){if(selected.display===letter.display)ctx.say(letter);return;}
          if(this.phase!=='quiz')return;
          const details={selectedId:selected.id || selected.display,choiceIds:options.map(item=>item.id || item.display),skill:'contextual_forms',activity:'parade'};
          if(selected.display!==letter.display){
            button.disabled=true;this.slips++;
            reportOutcome(ctx,target,false,'supported_visible_matching',true,details);
            ctx.showLearningHint?.(target,selected);ctx.sfx('wrong');
            button.classList.add('is-scaffolded');ctx.say(letter);return;
          }
          this.busy=true;this.phase='result';
          reportOutcome(ctx,target,true,'supported_visible_matching',true,details);
          ctx.clearLearningHint?.();ctx.sfx('correct');ctx.confettiAt(button);ctx.say(letter);
          buttons.forEach(other=>{if(other!==button){other.disabled=true;other.hidden=true;}});
          button.classList.add('is-found');
          next.hidden=false;next.focus?.({preventScroll:true});
        });
      }
      buttons[0]?.focus?.({preventScroll:true});
    }

    destroy(){this.alive=false;this.cleanupGestures();}
  }

  ns.LettersRoundBuilder = buildRounds;
  ns.LettersMiniGameCanStart = canStartMiniGame;
  ns.LettersMiniGames = {
    pop: PopGame,
    catch: CatchGame,
    pairs: PairsGame,
    feed: FeedGame,
    trace: TraceGame,
    burst: BurstGame,
    build: BuildGame,
    blend: BlendGame,
    // The joining stage (2026-07-18): fuse IS the blend machine — same
    // mechanic, letter+letter instead of letter+haraka.
    fuse: BlendGame,
    unfuse: UnfuseGame,
    chain: ChainGame,
    parade: ParadeGame,
  };
})(window.MiftahGame || (window.MiftahGame = {}));
