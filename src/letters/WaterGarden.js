// Water Garden (update 4): a permanent practice toy. Water from a spring runs
// along a channel to three letter-labelled gates. Guided rounds ask for a
// heard, already-taught letter; opening its gate sends water to a flower.
// From round three a channel bend can point away, and turning it is the new
// interaction. Free play afterwards opens any gate and turns any bend.
// Only the guided gate choice reports learning evidence. Bends, free play and
// blooms never report, score or reward.
(function (ns) {
  const LANES = [70, 180, 290];
  const gateNow = () => typeof performance === "undefined" ? Date.now() : performance.now();
  const key = item => item?.id || item?.display;
  const escape = text => String(text || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = list => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const EMPTY_GATE = '<span class="wg-empty-gate" aria-hidden="true"><svg viewBox="-32 -32 64 64" width="34" height="34"><path d="M0-28C-4-17-21-6-21 9C-21 24-9 29 0 29C12 29 21 21 21 9C21-6 5-18 0-28Z" fill="#96ecff" stroke="#3a8fc4" stroke-width="2.4"/><path d="M-9-6Q-16 3-15 10" fill="none" stroke="#fffdf7" stroke-width="4" stroke-linecap="round"/></svg></span>';

  function normalizeWaterState(value) {
    const flags = key => Array.from({ length: 3 }, (_, i) => Array.isArray(value?.[key]) && value[key][i] === true);
    return { open: flags('open'), away: flags('away'), bloomed: flags('bloomed') };
  }

  // v58: the three flowers are coral, yellow and lavender. Coral beside pink
  // read as one colour, so the yellow middle flower looked like an odd one out.
  function sceneClassic() {
    const lane = (x, i) => `
      <rect x="${x - 11}" y="92" width="22" height="122" rx="6" fill="#a89478"/>
      <rect x="${x - 7}" y="92" width="14" height="122" rx="4" fill="#c9bda4"/>
      <path class="wg-flow" data-lane="${i}" d="M${x} 92V214" stroke="#62cdf4" stroke-width="8" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
      <path class="wg-flow-light" data-lane="${i}" d="M${x - 2} 96V212" stroke="#96ecff" stroke-width="2.4" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" stroke-dashoffset="1"/>
      <g class="wg-elbow" data-lane="${i}">
        <g class="wg-turn-cue" opacity="0"><path d="M${x - 24} 218A26 26 0 0 0 ${x - 18} 249" stroke="#4a3620" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M${x - 24} 247L${x - 17} 251L${x - 15} 243" stroke="#4a3620" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>
        <g class="wg-turn" style="transform-box:view-box;transform-origin:${x}px 230px">
          <rect x="${x - 7}" y="228" width="14" height="29" rx="5" fill="#a89478" stroke="#4a3620" stroke-width="2.4"/>
          <circle cx="${x}" cy="230" r="18" fill="#a89478" stroke="#4a3620" stroke-width="2.4"/>
          <path d="M${x} 230V253" stroke="#c9bda4" stroke-width="8" stroke-linecap="round"/>
          <path class="wg-elbow-water" d="M${x} 230V253" stroke="#62cdf4" stroke-width="6" stroke-linecap="round" opacity="0"/>
          <circle cx="${x - 18}" cy="230" r="5" fill="#e8743c" stroke="#4a3620" stroke-width="1.6"/>
        </g>
        <path d="M${x} 212V230" stroke="#c9bda4" stroke-width="8" stroke-linecap="round"/>
        <path class="wg-inlet-water" d="M${x} 212V230" stroke="#62cdf4" stroke-width="6" stroke-linecap="round" opacity="0"/>
        <circle cx="${x}" cy="230" r="6" fill="#c9bda4" stroke="#4a3620" stroke-width="1.6"/>
        <circle class="wg-basin-water" cx="${x}" cy="230" r="4" fill="#62cdf4" opacity="0"/>
      </g>
      <ellipse class="wg-puddle" data-lane="${i}" cx="${x + 36}" cy="236" rx="2" ry="1" fill="#96ecff" opacity="0"/>
      <g class="wg-flower" data-lane="${i}" transform="translate(0 12)">
        <path d="M${x} 300Q${x + 2} 284 ${x} 270" stroke="#4e9677" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M${x + 1} 288Q${x - 14} 288 ${x - 13} 276Q${x - 2} 277 ${x + 1} 288" fill="#7fce54"/>
        <g class="wg-bud"><path d="M${x} 270Q${x - 9} 262 ${x - 4} 254Q${x} 258 ${x + 4} 254Q${x + 9} 262 ${x} 270Z" fill="${['#ee806f', '#f3c955', '#b49fcf'][i]}" stroke="#4a3620" stroke-width="1.6"/></g>
        <g class="wg-bloom" opacity="0">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="${x}" cy="252" rx="7" ry="11" transform="rotate(${a} ${x} 262)" fill="${['#ee806f', '#f3c955', '#b49fcf'][i]}" stroke="#4a3620" stroke-width="1.6"/>`).join('')}<circle cx="${x}" cy="262" r="7" fill="#ffe49a" stroke="#4a3620" stroke-width="1.6"/></g>
      </g>
      <g class="wg-gate" data-lane="${i}"><rect x="${x - 17}" y="60" width="6" height="36" rx="2" fill="#a89478" stroke="#4a3620" stroke-width="1.6"/><rect x="${x + 11}" y="60" width="6" height="36" rx="2" fill="#a89478" stroke="#4a3620" stroke-width="1.6"/><g class="wg-board"><rect x="${x - 13}" y="62" width="26" height="30" rx="3" fill="#c9bda4" stroke="#4a3620" stroke-width="2.4"/><path d="M${x - 9} 70H${x + 9}M${x - 9} 78H${x + 9}M${x - 9} 86H${x + 9}" stroke="#a89478" stroke-width="1.6"/></g></g>`;
    return `<svg class="wg-scene" viewBox="0 0 360 320" aria-hidden="true">
      <ellipse cx="180" cy="306" rx="170" ry="14" fill="#2f5c46" opacity=".16"/>
      <path d="M0 52Q180 30 360 52V320H0Z" fill="#b7e779"/>
      <path d="M0 250Q180 232 360 250V320H0Z" fill="#7fce54"/>
      <ellipse cx="180" cy="34" rx="126" ry="22" fill="#a89478"/>
      <ellipse cx="180" cy="31" rx="114" ry="16" fill="#62cdf4"/>
      <ellipse cx="164" cy="27" rx="60" ry="5" fill="#96ecff"/>
      <g fill="#c9bda4" stroke="#4a3620" stroke-width="1.6"><ellipse cx="62" cy="40" rx="12" ry="8"/><ellipse cx="298" cy="40" rx="14" ry="9"/><ellipse cx="96" cy="50" rx="8" ry="5"/></g>
      <rect x="44" y="56" width="272" height="18" rx="8" fill="#a89478"/>
      <rect x="48" y="59" width="264" height="12" rx="6" fill="#62cdf4"/>
      <path d="M54 63H306" stroke="#96ecff" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="10 18"/>
      ${LANES.map(lane).join('')}
    </svg>`;
  }

  const scene = () => ns.WaterPlayArt?.scene?.() || sceneClassic();
  const eligible = (item, ctx) => item?.id && item.display && item.taught !== false && item.isTaught !== false && item.locked !== true && item.unlocked !== false
    && (!ctx.completedWorldIds || !(item.prerequisiteWorldIds || []).some(id => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
  function taughtItems(items, ctx) {
    const rows = (items || []).filter(Boolean), blocked = new Set(rows.filter(item => !eligible(item, ctx)).map(item => item.display));
    const ids = new Set(), displays = new Set();
    return rows.filter(item => { if (!eligible(item, ctx) || blocked.has(item.display) || ids.has(item.id) || displays.has(item.display)) return false; ids.add(item.id); displays.add(item.display); return true; });
  }
  const eye = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M7 32Q32 7 57 32Q32 57 7 32Z" fill="#fffaf0" stroke="#4a3620" stroke-width="4"/><circle cx="32" cy="32" r="12" fill="#7fce54" stroke="#4a3620" stroke-width="3"/><circle cx="28" cy="27" r="3" fill="#fffdf7"/></svg>';

  class WaterGarden {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      this.items = taughtItems(ctx.items, ctx);
      this.guided = this.items.length >= 2;
      this.mode = 'guided';
      this.helped = new Set();
      this.round = 0;
      this.rounds = this.guided ? bounded(ctx.rounds, ctx.adventure ? 4 : ctx.beginner ? 3 : 4, 2, 6) : 0;
      const declared = Array.isArray(ctx.targets) && ctx.targets.length;
      const planned = declared ? ctx.targets.map(id => this.items.find(item => String(item.id) === String(id))).filter(Boolean)
        : ns.PracticeLearning?.plan?.(ctx, this.items, 'letter-name', this.rounds) || this.items;
      const valid = planned.filter(item => this.items.some(known => known.id === item?.id && known.display === item.display));
      this.targets = valid.map(item => item.id);
      const profiles = valid.map(item => ns.PracticeLearning?.profile?.(ctx, item, 'letter-name') || ns.LettersLearning?.profile?.(item, { ...ctx, skill: 'letter-name', challenge: false }) || { choiceCount: 2, promptMode: 'match', tier: 0 });
      this.choiceCount = Math.min(this.items.length, ctx.choiceCount === 2 ? 2 : 3, ...profiles.map(p => p.choiceCount === 3 ? 3 : 2));
      this.allowRecall = ctx.allowRecall !== false && !ctx.beginner && profiles.length > 0 && profiles.every(p => p.promptMode === 'listen');
      // Routing is introduced only after listening with three choices is established.
      // The child's support stays fixed for this visit; free play always permits turning.
      this.bendChallenge = !ctx.beginner && profiles.length > 0 && profiles.every(p => p.tier >= 3);
      this.saved = normalizeWaterState(ctx.waterState);
      this.freePlayRequested = ctx.freePlay === true;
      this.open = [false, false, false];
      this.away = [false, false, false]; // bend points to the puddle
      this.bloomed = this.saved.bloomed.slice();
      this.arrivalTokens = [0, 0, 0];
      this.arrived = [false, false, false];
      this.roundToken = 0;
      this.resolvedRound = false;
      this.guidedDone = false;
      this.finished = false;
      this.speechAttempt = 0;
      this.timers = new Set();
      ctx.stage.innerHTML = `<div class="water-play"><div class="water-garden">${scene()}
        <div class="wg-gates">${LANES.map((x, i) => `<button type="button" class="wg-gate-tag" data-lane="${i}" style="left:${(x / 360) * 100}%"></button><span class="wg-pull-target" data-lane="${i}" style="left:${(x / 360) * 100}%" aria-hidden="true"></span>`).join('')}</div>
        <div class="wg-bends">${LANES.map((x, i) => `<button type="button" class="wg-bend" data-lane="${i}" style="left:${(x / 360) * 100}%" aria-label="Turn the channel"></button>`).join('')}</div>
        <div class="wg-tools"><button type="button" class="wg-help" aria-label="Show the matching letter">${eye}</button><div class="wg-progress" role="progressbar" aria-label="Flowers watered" aria-valuemin="0" aria-valuemax="${this.rounds}" aria-valuenow="0"></div>
        <button type="button" class="wg-next" aria-label="Next flower" hidden>${ns.LettersArt?.icon?.('next', 36) || ''}</button>
        <button type="button" class="wg-done" aria-label="${escape(ctx.returnLabel || 'Back to the practice garden')}" hidden>${ns.LettersArt?.icon?.('check', 36) || ''}</button></div>
      </div></div>`;
      this.root = ctx.stage.querySelector('.water-garden');
      this.svg = this.root.querySelector('.wg-scene');
      this.gates = [...this.root.querySelectorAll('.wg-gate-tag')];
      this.bends = [...this.root.querySelectorAll('.wg-bend')];
      this.gateLifts = [0, 0, 0]; this.gateMotions = [null, null, null]; this.suppressGateClick = [0, 0, 0];
      this.gates.forEach((gate, i) => this.wireGatePull(gate, i));
      this.bends.forEach((bend, i) => bend.onclick = e => { this.keyboard = e?.detail === 0; this.turnBend(i); });
      this.next = this.root.querySelector('.wg-next'); this.help = this.root.querySelector('.wg-help');
      if (this.next) this.next.onclick = () => this.continue();
      if (this.help) this.help.onclick = () => { if (!this.busy && this.mode !== 'free') this.revealModel(); };
      this.root.querySelector('.wg-done').onclick = () => this.finish();
      if (!this.freePlayRequested && this.guided && !this.targets.length) { this.destroy(); Promise.resolve().then(() => ctx.cancel?.()); }
      else if (this.freePlayRequested || !this.guided) this.startFreePlay(); else this.startRound();
    }

    gateTravel(i) { return Math.max(32, Math.min(52, (this.gates[i]?.offsetHeight || 56) * .6)); }
    canPull(i) { return this.alive && !this.finished && !this.busy && !this.waiting && !this.gates[i]?.hidden && !this.gates[i]?.disabled; }
    stopGateMotion(i) {
      const motion = this.gateMotions[i]; this.gateMotions[i] = null;
      if (motion && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(motion.frame);
    }
    drawGateLift(i, value) {
      const lift = Math.max(0, Math.min(1, value)); this.gateLifts[i] = lift;
      this.gates[i]?.style?.setProperty?.('--wg-lift', `${lift * this.gateTravel(i)}px`);
      this.svg?.querySelector(`.wg-gate[data-lane="${i}"] .wg-board`)?.setAttribute('transform', `translate(0 ${-26 * lift})`);
    }
    settleGate(i) {
      if (!this.alive || this.activePull?.i === i) return;
      const to = this.open[i] ? 1 : 0;
      if (this.gateMotions[i]?.to === to) return;
      this.stopGateMotion(i);
      const from = this.gateLifts[i];
      if (this.ctx.reducedMotion?.() || typeof requestAnimationFrame !== 'function' || Math.abs(to-from) < .002) { this.drawGateLift(i,to); return; }
      const motion = { to, from, start: null, frame: null }; this.gateMotions[i] = motion;
      const step = now => {
        if (!this.alive || this.gateMotions[i] !== motion) return;
        if (this.ctx.reducedMotion?.()) { this.drawGateLift(i,to); this.gateMotions[i]=null; return; }
        if (motion.start === null) motion.start = now;
        const t = Math.min(1, (now-motion.start)/180), eased = 1-Math.pow(1-t,3);
        this.drawGateLift(i, from+(to-from)*eased);
        if (t < 1) motion.frame = requestAnimationFrame(step); else this.gateMotions[i] = null;
      };
      motion.frame = requestAnimationFrame(step);
    }
    endGatePull(cancelled = true) {
      const pull = this.activePull; if (!pull) return;
      this.activePull = null;
      const { i, gate, pointer } = pull;
      gate.classList.remove('is-pulling');
      if (gate.hasPointerCapture?.(pointer)) gate.releasePointerCapture?.(pointer);
      if (pull.moved) this.suppressGateClick[i] = gateNow()+400;
      if (!cancelled && pull.dragging && this.canPull(i)) {
        const lift = this.gateLifts[i], delta = pull.delta;
        const change = this.open[i] ? delta < -8 && lift <= .45 : delta > 8 && lift >= .55;
        if (change) { this.keyboard = false; this.tapGate(i); }
      }
      this.settleGate(i);
    }
    wireGatePull(gate, i) {
      gate.onclick = e => {
        if (e?.detail !== 0 && gateNow() < this.suppressGateClick[i]) return;
        this.keyboard = e?.detail === 0; this.tapGate(i);
      };
      gate.addEventListener?.('pointerdown', e => {
        if (!this.canPull(i) || this.activePull || e.isPrimary === false || (e.pointerType === 'mouse' && e.button !== 0)) return;
        this.stopGateMotion(i);
        const rect = gate.getBoundingClientRect(), scale = gate.offsetHeight ? rect.height/gate.offsetHeight : 1;
        this.activePull = { i, gate, pointer:e.pointerId, x:e.clientX, y:e.clientY, scale:scale||1, start:this.gateLifts[i], moved:false, dragging:false, delta:0 };
        gate.setPointerCapture?.(e.pointerId);
      });
      gate.addEventListener?.('pointermove', e => {
        const p = this.activePull; if (!p || p.i !== i || p.pointer !== e.pointerId || e.isPrimary === false) return;
        if (!this.canPull(i)) { this.endGatePull(true); return; }
        const dx = (e.clientX-p.x)/p.scale, dy = (e.clientY-p.y)/p.scale;
        if (Math.hypot(dx,dy)>8) p.moved=true;
        if (!p.dragging && Math.abs(dy)>8 && Math.abs(dy)>Math.abs(dx)*.6) { p.dragging=true; gate.classList.add('is-pulling'); this.actionCue?.destroy(); this.actionCue=null; }
        if (!p.dragging) return;
        p.delta=-dy; this.drawGateLift(i,p.start+p.delta/this.gateTravel(i));
      });
      gate.addEventListener?.('pointerup', e => { if (this.activePull?.i===i && this.activePull.pointer===e.pointerId) { this.endGatePull(false); this.teachGatePull(); } });
      for (const event of ['pointercancel','lostpointercapture']) gate.addEventListener?.(event, e => { if (this.activePull?.i===i && this.activePull.pointer===e.pointerId) { this.endGatePull(true); this.teachGatePull(); } });
    }
    teachGatePull() {
      if (!this.alive || this.busy || this.waiting || this.finished) { this.actionCue?.destroy(); this.actionCue=null; return; }
      const free=this.mode==='free', i=free?this.gates.findIndex(g=>!g.hidden&&!g.disabled):this.targetLane;
      if (i<0 || !this.gates[i]) return;
      const cueKey=`${this.roundToken}:${this.mode}:${i}:${this.open[i]}`;
      if (this.actionCue && this.pullCueKey===cueKey) return;
      this.actionCue?.destroy(); this.actionCue=null; this.pullCueKey=cueKey;
      const destination=this.root.querySelector(`.wg-pull-target[data-lane="${i}"]`);
      if (!destination) return;
      destination.style.setProperty('--wg-pull-offset',`${this.open[i]?0:-this.gateTravel(i)}px`);
      const token=this.roundToken;
      this.actionCue=this.ctx.setupActionCue?.({source:this.gates[i],destination,type:'drag',automatic:this.ctx.firstActionDemo===true&&!(free?this.freePullDemo:this.pullDemo),
        onShow:()=>{if(this.alive&&this.mode!=='free'&&this.roundToken===token)this.revealModel(token);}});
      if (this.actionCue && this.help) this.help.hidden=true;
      if (free)this.freePullDemo=true;else this.pullDemo=true;
    }

    static state(value) { return normalizeWaterState(value); }

    later(fn, ms) {
      const reduced = this.ctx.reducedMotion?.();
      const timer = setTimeout(() => { this.timers.delete(timer); if (this.alive) fn(); }, reduced ? 0 : ms);
      this.timers.add(timer);
    }

    snapshot() { return { open: this.open.slice(), away: this.away.slice(), bloomed: this.bloomed.slice() }; }

    saveGuidedBlooms() {
      if (!this.alive) return;
      try { this.ctx.saveWaterState?.({ bloomed: this.bloomed.slice() }); } catch { /* Persistence must not block play. */ }
    }

    saveFreeState() {
      if (!this.alive || this.mode !== 'free') return;
      try { this.ctx.saveWaterState?.(this.snapshot()); } catch { /* Persistence must not block play. */ }
    }

    label(i, item) {
      const gate = this.gates[i];
      if (!gate) return;
      gate.dataset.id = key(item) || '';
      gate.innerHTML = item ? `<svg viewBox="-40 -40 80 80" aria-hidden="true"><text text-anchor="middle" direction="rtl" font-family="'Amiri Quran',serif" font-size="58" fill="#4a3620" data-fit-box="0,0,58,58,58">${escape(item.display)}</text></svg>` : this.mode === 'free' ? EMPTY_GATE : '';
      gate.insertAdjacentHTML?.('beforeend','<i class="wg-grip" aria-hidden="true"></i>');
      gate.setAttribute('aria-label', item ? `Open the gate ${item.display}` : 'Open the water gate');
      gate.hidden = !item && this.mode !== 'free';
      gate.disabled = gate.hidden;
      gate.classList.remove('is-help', 'is-missed');
      ns.LettersArt?.fitGlyphs?.(gate);
    }

    startRound() {
      if (!this.alive || this.round >= this.rounds) return;
      this.endGatePull(true); this.actionCue?.destroy(); this.actionCue=null;
      this.roundToken += 1;
      const token = this.roundToken;
      this.resolvedRound = false;
      this.busy = false;
      this.waiting = false;
      this.cancelSpeech();
      if (this.next) this.next.hidden = true;
      if (this.help) this.help.disabled = false;
      this.root.classList.remove('is-resolved', 'is-listening');
      this.closeAll(true);
      const scheduledId = this.targets.length ? this.targets[this.round % this.targets.length] : null;
      const scheduled = scheduledId == null ? null : this.items.find(item => String(key(item)) === scheduledId);
      const target = scheduled;
      if (!target || this.items.length < 2) return this.startFreePlay();
      const supported = this.helped.has(key(target)) || this.ctx.supportedItemIds?.includes(key(target));
      const choices = supported ? 2 : this.choiceCount;
      const activeLanes = choices === 2 ? [[0, 1], [1, 2], [2, 0]][this.round % 3] : [0, 1, 2];
      this.activeLanes = activeLanes.slice();
      const distractor = shuffle(this.items.filter(item => key(item) !== key(target)))[0];
      if (!distractor) return this.startFreePlay();
      const targetSlot = shuffle(activeLanes)[0];
      this.targetLane = targetSlot;
      this.target = target;
      this.offered = [null, null, null];
      this.offered[targetSlot] = target;
      const otherSlots = activeLanes.filter(i => i !== targetSlot);
      this.offered[otherSlots[0]] = distractor;
      if (choices === 3) {
        const remaining = this.items.filter(item => key(item) !== key(target) && key(item) !== key(distractor));
        if (remaining.length) this.offered[otherSlots[1]] = shuffle(remaining)[0];
        else this.offered[otherSlots[1]] = distractor;
      }
      this.offered.forEach((item, i) => this.label(i, item));
      // Rounds three and later introduce a misdirected bend on the active target lane.
      // Every offered lane gets the same bend challenge. Pointing only the
      // target away would reveal which letter to choose before the round.
      this.roundBendChallenge = this.bendChallenge && !supported;
      this.away = [0, 1, 2].map(i => this.roundBendChallenge && this.round >= 2 && this.activeLanes.includes(i));
      this.paint();
      this.root.querySelector('.wg-progress').innerHTML = Array.from({ length: this.rounds }, (_, i) => `<i class="${i < this.round ? 'is-done' : i === this.round ? 'is-on' : ''}"></i>`).join('');
      this.root.querySelector('.wg-progress').setAttribute('aria-valuenow', String(this.round));
      // Listening first: the letter stays hidden while audio works and is
      // shown whenever this letter needs matching support.
      this.listening = this.ctx.canListen?.() !== false;
      this.plannedVisible = !!supported || !this.listening || !this.allowRecall;
      this.modelVisible = this.plannedVisible;
      this.assisted = !!supported; this.heard = false;
      this.ctx.prompt?.(this.modelVisible ? this.target : null);
      this.ctx.beginRound?.(this.target, 'letter-name');
      this.speak(token); this.teachGatePull();
      if (this.keyboard) this.gates.find(gate => !gate.hidden && !gate.disabled)?.focus?.({ preventScroll: true });
    }

    revealModel(token = this.roundToken) {
      if (!this.alive || this.busy || this.mode === 'free' || token !== this.roundToken || !this.target) return;
      this.cancelSpeech(); this.setWaiting(false);
      this.assisted = true;
      this.helped.add(key(this.target));
      if (this.modelVisible) { this.gates[this.targetLane]?.classList.add('is-help'); return; }
      this.modelVisible = true;
      this.ctx.prompt?.(this.target);
      this.gates[this.targetLane]?.classList.add('is-help');
    }

    cancelSpeech() {
      this.speechAttempt += 1;
      if (this.speechTimer) { clearTimeout(this.speechTimer); this.timers.delete(this.speechTimer); this.speechTimer = null; }
    }

    setWaiting(waiting) {
      this.waiting = waiting;
      this.root.classList.toggle('is-listening', waiting);
      this.gates.forEach(gate => { gate.disabled = waiting || gate.hidden || this.busy || gate.classList.contains('is-missed'); });
    }

    speak(token = this.roundToken) {
      if (!this.alive || this.busy || this.mode === 'free' || token !== this.roundToken || !this.target) return;
      this.cancelSpeech();
      const attempt = this.speechAttempt, confirmed = this.heard;
      const needsSpeech = !confirmed && !this.modelVisible;
      if (needsSpeech) this.setWaiting(true);
      let result;
      try { result = this.ctx.say?.(this.target); } catch { result = false; }
      const settle = heard => {
        if (!this.alive || this.busy || this.mode === 'free' || token !== this.roundToken || attempt !== this.speechAttempt) return;
        this.cancelSpeech();
        this.heard = confirmed || heard === true;
        if (!this.heard && !this.modelVisible) this.revealModel(token);
        else this.setWaiting(false);
        this.teachGatePull();
      };
      if (result?.then) {
        // This is a speech deadline, not an animation: reduced motion cannot shorten it.
        if (needsSpeech) { this.speechTimer = setTimeout(() => settle(false), 6000); this.timers.add(this.speechTimer); }
        Promise.resolve(result).then(settle, () => settle(false));
      }
      else settle(result === true);
    }
    replayPrompt() {
      if (!this.alive || this.busy || this.mode === 'free' || !this.target) return;
      this.revealModel();
      this.speak(this.roundToken);
    }
    onSoundChange() { if (this.alive && this.mode !== 'free' && this.target && this.ctx.canListen?.() === false) this.revealModel(); }

    tapGate(i) {
      if (!this.alive || this.busy || this.waiting || !Number.isInteger(i) || i < 0 || i > 2 || this.gates[i]?.hidden || this.gates[i]?.disabled) return;
      if (this.mode === 'free') { this.open[i] = !this.open[i]; this.saveFreeState(); this.flow(i); this.teachGatePull(); return; }
      const chosen = this.offered[i], correct = key(chosen) === key(this.target);
      if (!chosen || !this.target) return;
      const independent = this.listening && this.heard === true && !this.assisted && this.allowRecall && !this.modelVisible;
      this.ctx.reportOutcome?.({ item: this.target, itemId: key(this.target), activity: 'WaterGarden', correct,
        evidence: independent ? 'independent_listening' : 'supported_visible_matching', skill: 'letter-name',
        selectedId: key(chosen), choiceIds: this.offered.filter(Boolean).map(key), assisted: this.assisted, independent, round: this.round + 1, affectsStrength: true });
      if (!correct) {
        // A quiet acknowledgement; no water is wasted and no flower is lost.
        this.assisted = true;
        this.revealModel();
        const board = this.svg.querySelector(`.wg-gate[data-lane="${i}"] .wg-board`);
        if (!this.ctx.reducedMotion?.()) board?.animate?.([{ opacity: 1 }, { opacity: .84 }, { opacity: 1 }], { duration: 300, easing: 'ease-in-out' });
        this.ctx.sfx?.('softwrong');
        this.gates[i].disabled = true; this.gates[i].classList.add('is-missed');
        this.speak(this.roundToken);
        return;
      }
      this.busy = true;
      this.actionCue?.destroy(); this.actionCue=null;
      this.cancelSpeech(); this.setWaiting(false);
      if (this.help) this.help.disabled = true;
      this.open[i] = true;
      this.ctx.sfx?.('seed');
      this.flow(i);
    }

    wiggle(i) {
      // One small turn says "I turn" without repeated rocking or moving the answer.
      if (this.ctx.reducedMotion?.()) return;
      const turn = this.svg.querySelector(`.wg-elbow[data-lane="${i}"] .wg-turn`);
      const at = this.away[i] ? -90 : 0;
      turn?.animate?.([0, 6, 0].map(d => ({ transform: `rotate(${at + d}deg)` })), { duration: 900, easing: 'ease-in-out' });
    }

    turnBend(i) {
      if (!this.alive || this.resolvedRound && this.mode !== 'free' || !Number.isInteger(i) || i < 0 || i > 2 || this.bends[i]?.hidden || this.bends[i]?.disabled) return;
      // Turning a bend is a toy action, never a letter answer.
      this.away[i] = !this.away[i];
      this.ctx.sfx?.('turn');
      this.paint();
      if (this.mode === 'free') this.saveFreeState();
      if (this.open[i]) this.flow(i, true);
    }

    flow(i, fromBend = false) {
      const reduced = this.ctx.reducedMotion?.();
      const lane = this.svg.querySelectorAll(`[data-lane="${i}"].wg-flow, [data-lane="${i}"].wg-flow-light`);
      const open = this.open[i];
      const arrival = ++this.arrivalTokens[i], round = this.roundToken;
      if (!fromBend) this.arrived[i] = false;
      this.paint();
      lane.forEach(path => {
        path.getAnimations?.().forEach(animation => animation.cancel());
        if (!reduced && !fromBend) path.animate?.([{ strokeDashoffset: path.style.strokeDashoffset || (open ? 1 : 0) }, { strokeDashoffset: open ? 0 : 1 }], { duration: 700, easing: 'ease-in' });
        path.style.strokeDashoffset = open ? '0' : '1';
      });
      if (!open) return;
      this.later(() => this.arrive(i, arrival, round), fromBend ? 120 : 720);
    }

    arrive(i, arrival = this.arrivalTokens[i], round = this.roundToken) {
      if (!this.alive || !this.open[i] || arrival !== this.arrivalTokens[i] || (this.mode !== 'free' && round !== this.roundToken)) return;
      this.arrived[i] = true; this.paint();
      if (this.away[i]) {
        // Water spills into the puddle; the flower stays thirsty until the bend turns.
        const puddle = this.svg.querySelector(`.wg-puddle[data-lane="${i}"]`);
        puddle?.setAttribute('opacity', '1');
        if (!this.ctx.reducedMotion?.()) puddle?.animate?.([{ rx: 2, ry: 1 }, { rx: 18, ry: 7 }], { duration: 500 });
        puddle?.setAttribute('rx', '18'); puddle?.setAttribute('ry', '7');
        if (this.mode !== 'free' && i === this.targetLane) {
          this.bends[i].classList.add('is-hint');
          this.wiggle(i);
        }
        return;
      }
      this.bends[i].classList.remove('is-hint');
      const first = !this.bloomed[i];
      this.bloomed[i] = true;
      this.paint();
      if (first) this.ctx.sfx?.('pour');
      if (this.mode === 'free') this.saveFreeState();
      if (this.mode !== 'free' && i === this.targetLane) {
        if (this.resolvedRound) return;
        this.resolvedRound = true;
        this.busy = true;
        this.ctx.correct?.();
        this.round += 1;
        this.saveGuidedBlooms();
        this.root.classList.add('is-resolved');
        this.root.querySelector('.wg-progress').innerHTML = Array.from({ length: this.rounds }, (_, n) => `<i class="${n < this.round ? 'is-done' : ''}" aria-hidden="true"></i>`).join('');
        this.root.querySelector('.wg-progress').setAttribute('aria-valuenow', String(this.round));
        this.bends.forEach(bend => { bend.disabled = true; });
        if (this.next) { this.next.hidden = false; this.next.setAttribute('aria-label', this.round >= this.rounds ? 'Play with your water garden' : 'Next flower'); if (this.keyboard) this.next.focus?.({ preventScroll: true }); }
      }
    }

    continue() {
      if (!this.alive || this.mode === 'free' || !this.resolvedRound) return;
      this.resolvedRound = false;
      if (this.round >= this.rounds) this.finishGuided(); else this.startRound();
    }

    finishGuided() {
      if (!this.alive || this.guidedDone) return;
      this.guidedDone = true;
      this.saveGuidedBlooms();
      try { this.ctx.onGuidedDone?.({ bloomed: this.bloomed.slice() }); } catch { /* The free-play handoff still belongs to the child. */ }
      if (this.alive) this.startFreePlay(true);
    }

    closeAll(reset = false) {
      if (reset) { this.open = [false, false, false]; this.away = [false, false, false]; }
      this.arrivalTokens = this.arrivalTokens.map(token => token + 1);
      this.arrived = [false, false, false];
      this.svg?.querySelectorAll('.wg-flow, .wg-flow-light').forEach(path => { path.getAnimations?.().forEach(a => a.cancel()); path.style.strokeDashoffset = '1'; });
      this.svg?.querySelectorAll('.wg-puddle').forEach(p => { p.getAnimations?.().forEach(a => a.cancel()); p.setAttribute('opacity', '0'); p.setAttribute('rx', '2'); p.setAttribute('ry', '1'); });
      this.bends?.forEach(b => b.classList.remove('is-hint'));
    }

    paint() {
      [0, 1, 2].forEach(i => {
        const x = LANES[i];
        // The bend is a turning spout: down feeds the flower, right spills.
        const elbow = this.svg.querySelector(`.wg-elbow[data-lane="${i}"]`);
        const turn = elbow?.querySelector('.wg-turn');
        if (turn) turn.style.transform = this.away[i] ? 'rotate(-90deg)' : '';
        elbow?.querySelectorAll('.wg-elbow-water, .wg-inlet-water, .wg-basin-water').forEach(p => p.setAttribute('opacity', this.open[i] && this.arrived[i] ? '1' : '0'));
        elbow?.querySelector('.wg-turn-cue')?.setAttribute('opacity', this.turnable(i) ? '1' : '0');
        this.settleGate(i);
        const flower = this.svg.querySelector(`.wg-flower[data-lane="${i}"]`);
        flower?.querySelector('.wg-bloom')?.setAttribute('opacity', this.bloomed[i] ? '1' : '0');
        flower?.querySelector('.wg-bud')?.setAttribute('opacity', this.bloomed[i] ? '0' : '1');
        this.gates[i].classList.toggle('is-open', this.open[i]);
        this.gates[i].setAttribute('aria-pressed', String(this.open[i]));
        const item = this.mode==='free' ? this.items[i] : this.offered?.[i];
        const action = this.mode==='free' && this.open[i] ? 'Close' : 'Open';
        this.gates[i].setAttribute('aria-label', item ? `${action} the gate ${item.display}` : `${action} the water gate`);
        this.bends[i].setAttribute('aria-pressed', String(this.away[i]));
        this.bends[i].setAttribute('aria-label', this.away[i] ? 'Turn the water toward the flower' : 'Turn the water toward the puddle');
        this.bends[i].hidden = !this.turnable(i);
        this.bends[i].disabled = this.mode !== 'free' && this.resolvedRound;
        const puddle = this.svg.querySelector(`.wg-puddle[data-lane="${i}"]`), spilled = this.open[i] && this.arrived[i] && this.away[i];
        puddle?.getAnimations?.().forEach(animation => animation.cancel());
        puddle?.setAttribute('opacity', spilled ? '1' : '0');
      });
    }

    turnable(i) { return this.mode === 'free' || (this.roundBendChallenge && this.round >= 2 && this.activeLanes?.includes(i)); }

    startFreePlay(afterGuided = false) {
      if (!this.alive) return;
      this.endGatePull(true); this.actionCue?.destroy(); this.actionCue=null;
      this.closeAll();
      this.cancelSpeech();
      this.mode = 'free';
      this.noReplay = true;
      this.busy = false;
      this.resolvedRound = false;
      this.waiting = false;
      this.target = null;
      this.open = this.saved.open.slice();
      this.away = this.saved.away.slice();
      this.arrived = this.open.slice();
      this.bloomed = this.bloomed.map((bloomed, i) => bloomed || this.saved.bloomed[i]);
      this.ctx.prompt?.(null);
      this.ctx.onFreePlay?.();
      // Free play opens the whole garden, including the lane hidden by a
      // two-choice guided round. Reuse the child's available letters without
      // carrying the guided round's empty slot into the persistent layout.
      const labels = this.items.slice(0, 3);
      [0, 1, 2].forEach(i => this.label(i, labels[i] || null));
      this.root.classList.add('is-free');
      this.root.classList.remove('is-resolved', 'is-listening');
      if (this.next) this.next.hidden = true;
      if (this.help) this.help.hidden = true;
      this.root.querySelector('.wg-progress').innerHTML = '';
      this.root.querySelector('.wg-done').hidden = false;
      this.svg.querySelectorAll('.wg-flow, .wg-flow-light').forEach(path => {
        const lane = Number(path.dataset.lane);
        path.style.strokeDashoffset = this.open[lane] ? '0' : '1';
      });
      this.svg.querySelectorAll('.wg-puddle').forEach(puddle => {
        const lane = Number(puddle.dataset.lane), spilled = this.open[lane] && this.away[lane];
        puddle.setAttribute('opacity', spilled ? '1' : '0');
        puddle.setAttribute('rx', spilled ? '18' : '2');
        puddle.setAttribute('ry', spilled ? '7' : '1');
      });
      this.paint(); this.teachGatePull();
      if (afterGuided) this.root.querySelector('.wg-done').focus?.({ preventScroll: true });
    }

    finish() { if (!this.alive || this.finished) return; this.finished = true; if (this.mode === 'free') this.saveFreeState(); this.destroy(); this.ctx.done?.(); }
    destroy() { if (!this.alive) return; this.alive = false; this.endGatePull(true); this.actionCue?.destroy(); this.gateMotions.forEach((_,i)=>this.stopGateMotion(i)); this.roundToken += 1; this.cancelSpeech(); this.arrivalTokens = this.arrivalTokens.map(token => token + 1); this.timers.forEach(clearTimeout); this.timers.clear(); this.root?.querySelectorAll('*').forEach(el => el.getAnimations?.().forEach(animation => animation.cancel())); }
  }

  function bounded(value, fallback, min, max) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.floor(number))) : fallback;
  }

  ns.GardenPractice = Object.assign(ns.GardenPractice || {}, { WaterGarden });
  ns.WaterGarden = { scene, classic: sceneClassic, LANES };
  ns.WaterGardenState = { normalize: normalizeWaterState };
})(window.MiftahGame || (window.MiftahGame = {}));
