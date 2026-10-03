// Water Garden (update 4): a permanent practice toy. Water from a spring runs
// along a channel to three letter-labelled gates. Guided rounds ask for a
// heard, already-taught letter; opening its gate sends water to a flower.
// From round three a channel bend can point away, and turning it is the new
// interaction. Free play afterwards opens any gate and turns any bend.
// Only the guided gate choice reports learning evidence. Bends, free play and
// blooms never report, score or reward.
(function (ns) {
  const LANES = [70, 180, 290];
  const key = item => item?.id || item?.display;
  const escape = text => String(text || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = list => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function scene() {
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
        <g class="wg-bud"><path d="M${x} 270Q${x - 9} 262 ${x - 4} 254Q${x} 258 ${x + 4} 254Q${x + 9} 262 ${x} 270Z" fill="${['#ee806f', '#f3c955', '#ffa798'][i]}" stroke="#4a3620" stroke-width="1.6"/></g>
        <g class="wg-bloom" opacity="0">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="${x}" cy="252" rx="7" ry="11" transform="rotate(${a} ${x} 262)" fill="${['#ee806f', '#f3c955', '#ffa798'][i]}" stroke="#4a3620" stroke-width="1.6"/>`).join('')}<circle cx="${x}" cy="262" r="7" fill="#ffe49a" stroke="#4a3620" stroke-width="1.6"/></g>
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

  class WaterGarden {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      this.items = [...new Map((ctx.items || []).filter(item => key(item)).map(item => [key(item), item])).values()];
      this.guided = this.items.length >= 2;
      this.round = 0;
      this.rounds = this.guided ? 4 : 0;
      this.open = [false, false, false];
      this.away = [false, false, false]; // bend points to the puddle
      this.bloomed = [false, false, false];
      this.timers = new Set();
      ctx.stage.innerHTML = `<div class="water-garden">${scene()}
        <div class="wg-gates">${LANES.map((x, i) => `<button type="button" class="wg-gate-tag" data-lane="${i}" style="left:${(x / 360) * 100}%"></button>`).join('')}</div>
        <div class="wg-bends">${LANES.map((x, i) => `<button type="button" class="wg-bend" data-lane="${i}" style="left:${(x / 360) * 100}%" aria-label="Turn the channel"></button>`).join('')}</div>
        <div class="wg-progress" aria-hidden="true"></div>
        <button type="button" class="lg-big-btn wg-done" aria-label="Back to the practice garden" hidden>${ns.LettersArt?.icon?.('check', 36) || ''}</button>
      </div>`;
      this.root = ctx.stage.querySelector('.water-garden');
      this.svg = this.root.querySelector('.wg-scene');
      this.gates = [...this.root.querySelectorAll('.wg-gate-tag')];
      this.bends = [...this.root.querySelectorAll('.wg-bend')];
      this.gates.forEach((gate, i) => gate.onclick = () => this.tapGate(i));
      this.bends.forEach((bend, i) => bend.onclick = () => this.turnBend(i));
      this.root.querySelector('.wg-done').onclick = () => this.finish();
      if (this.guided) this.startRound(); else this.startFreePlay();
    }

    later(fn, ms) {
      const reduced = this.ctx.reducedMotion?.();
      const timer = setTimeout(() => { this.timers.delete(timer); if (this.alive) fn(); }, reduced ? 0 : ms);
      this.timers.add(timer);
    }

    label(i, item) {
      const gate = this.gates[i];
      gate.dataset.id = key(item) || '';
      gate.innerHTML = item ? `<span lang="ar" dir="rtl">${escape(item.display)}</span>` : '';
      gate.setAttribute('aria-label', item ? `Open the gate ${item.display}` : 'Open the gate');
    }

    startRound() {
      if (!this.alive) return;
      this.busy = false;
      this.closeAll();
      const offered = shuffle(this.items).slice(0, 3);
      while (offered.length < 3) offered.push(offered[offered.length % Math.max(1, offered.length)]);
      this.offered = offered;
      offered.forEach((item, i) => this.label(i, item));
      // A lane with a bloom already prefers a fresh flower as the target.
      const thirsty = [0, 1, 2].filter(i => !this.bloomed[i]);
      this.targetLane = (thirsty.length ? shuffle(thirsty) : shuffle([0, 1, 2]))[0];
      this.target = offered[this.targetLane];
      // Rounds 3–4 introduce the bend: the target's bend starts pointing away.
      this.away = [0, 1, 2].map(i => this.round >= 2 && i === this.targetLane);
      this.paint();
      if (this.away[this.targetLane]) this.later(() => this.wiggle(this.targetLane), 500);
      this.root.querySelector('.wg-progress').innerHTML = Array.from({ length: this.rounds }, (_, i) => `<i class="${i < this.round ? 'is-done' : i === this.round ? 'is-on' : ''}"></i>`).join('');
      // Listening first: the letter stays hidden while audio works and is
      // shown (as help) only when sound is off or after a miss.
      this.listening = this.ctx.canListen?.() !== false;
      this.assisted = !this.listening; this.heard = false;
      this.ctx.prompt?.(this.listening ? null : this.target);
      this.speak();
    }

    speak() {
      let result;
      try { result = this.ctx.say?.(this.target); } catch { result = false; }
      if (result?.then) result.then(heard => { this.heard = heard === true; }, () => { this.heard = false; });
    }
    replayPrompt() { if (this.alive && this.mode !== 'free' && this.target) this.speak(); }
    onSoundChange() { if (this.alive && this.mode !== 'free' && this.target && this.ctx.canListen?.() === false) { this.assisted = true; this.ctx.prompt?.(this.target); } }

    tapGate(i) {
      if (!this.alive || this.busy) return;
      if (this.mode === 'free') { this.open[i] = !this.open[i]; this.flow(i); return; }
      const chosen = this.offered[i], correct = key(chosen) === key(this.target);
      const independent = this.heard && !this.assisted;
      this.ctx.reportOutcome?.({ item: this.target, itemId: key(this.target), activity: 'WaterGarden', correct,
        evidence: independent ? 'independent_listening' : 'supported_visible_matching', skill: 'letter-name',
        selectedId: key(chosen), choiceIds: this.offered.map(key), assisted: !independent, affectsStrength: true });
      if (!correct) {
        // The wrong gate only rattles; no water is wasted and no flower is lost.
        this.assisted = true;
        this.ctx.prompt?.(this.target);
        const board = this.svg.querySelector(`.wg-gate[data-lane="${i}"] .wg-board`);
        board?.animate?.([{ transform: 'translateY(0)' }, { transform: 'translateY(-5px)' }, { transform: 'translateY(0)' }], { duration: 300 });
        this.ctx.sfx?.('softwrong');
        this.gates[i].disabled = true;
        this.later(() => { this.gates[i].disabled = false; }, 700);
        this.speak();
        return;
      }
      this.busy = true;
      this.open[i] = true;
      this.ctx.sfx?.('seed');
      this.flow(i);
    }

    wiggle(i) {
      // A small rock says "I turn" without words; it never moves the answer.
      if (this.ctx.reducedMotion?.()) return;
      const turn = this.svg.querySelector(`.wg-elbow[data-lane="${i}"] .wg-turn`);
      const at = this.away[i] ? -90 : 0;
      turn?.animate?.([0, 14, -6, 10, 0].map(d => ({ transform: `rotate(${at + d}deg)` })), { duration: 900, easing: 'ease-in-out' });
    }

    turnBend(i) {
      if (!this.alive) return;
      // Turning a bend is a toy action, never a letter answer.
      this.away[i] = !this.away[i];
      this.ctx.sfx?.('turn');
      this.paint();
      if (this.open[i]) this.flow(i, true);
    }

    flow(i, fromBend = false) {
      const reduced = this.ctx.reducedMotion?.();
      const lane = this.svg.querySelectorAll(`[data-lane="${i}"].wg-flow, [data-lane="${i}"].wg-flow-light`);
      const open = this.open[i];
      this.paint();
      lane.forEach(path => {
        path.animate?.([{ strokeDashoffset: path.style.strokeDashoffset || (open ? 1 : 0) }, { strokeDashoffset: open ? 0 : 1 }], { duration: reduced ? 1 : fromBend ? 1 : 700, fill: 'forwards', easing: 'ease-in' });
        path.style.strokeDashoffset = open ? '0' : '1';
      });
      if (!open) return;
      this.later(() => this.arrive(i), fromBend ? 120 : 720);
    }

    arrive(i) {
      if (!this.open[i]) return;
      if (this.away[i]) {
        // Water spills into the puddle; the flower stays thirsty until the bend turns.
        const puddle = this.svg.querySelector(`.wg-puddle[data-lane="${i}"]`);
        puddle?.setAttribute('opacity', '1');
        puddle?.animate?.([{ rx: 2, ry: 1 }, { rx: 18, ry: 7 }], { duration: this.ctx.reducedMotion?.() ? 1 : 500, fill: 'forwards' });
        puddle?.setAttribute('rx', '18'); puddle?.setAttribute('ry', '7');
        if (this.mode !== 'free' && i === this.targetLane) this.bends[i].classList.add('is-hint');
        return;
      }
      this.bends[i].classList.remove('is-hint');
      const first = !this.bloomed[i];
      this.bloomed[i] = true;
      this.paint();
      if (first) this.ctx.sfx?.('pour');
      if (this.mode !== 'free' && i === this.targetLane) {
        this.ctx.correct?.();
        this.round += 1;
        this.later(() => this.round >= this.rounds ? this.startFreePlay(true) : this.startRound(), 1300);
      }
    }

    closeAll() {
      this.open = [false, false, false];
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
        elbow?.querySelectorAll('.wg-elbow-water, .wg-inlet-water, .wg-basin-water').forEach(p => p.setAttribute('opacity', this.open[i] ? '1' : '0'));
        elbow?.querySelector('.wg-turn-cue')?.setAttribute('opacity', this.turnable(i) ? '1' : '0');
        const board = this.svg.querySelector(`.wg-gate[data-lane="${i}"] .wg-board`);
        if (board) board.setAttribute('transform', this.open[i] ? 'translate(0 -26)' : '');
        const flower = this.svg.querySelector(`.wg-flower[data-lane="${i}"]`);
        flower?.querySelector('.wg-bloom')?.setAttribute('opacity', this.bloomed[i] ? '1' : '0');
        flower?.querySelector('.wg-bud')?.setAttribute('opacity', this.bloomed[i] ? '0' : '1');
        this.gates[i].classList.toggle('is-open', this.open[i]);
        this.bends[i].setAttribute('aria-pressed', String(this.away[i]));
        this.bends[i].hidden = !this.turnable(i);
      });
    }

    turnable() { return this.mode === 'free' || this.round >= 2; }

    startFreePlay(afterGuided = false) {
      if (!this.alive) return;
      this.mode = 'free';
      this.busy = false;
      this.target = null;
      this.ctx.prompt?.(null);
      const labels = this.offered || shuffle(this.items).slice(0, 3);
      [0, 1, 2].forEach(i => this.label(i, labels[i] || null));
      this.root.classList.add('is-free');
      this.root.querySelector('.wg-progress').innerHTML = '';
      this.root.querySelector('.wg-done').hidden = false;
      this.paint();
      if (afterGuided) this.root.querySelector('.wg-done').focus?.({ preventScroll: true });
    }

    finish() { if (!this.alive) return; this.destroy(); this.ctx.done?.(); }
    destroy() { this.alive = false; this.timers.forEach(clearTimeout); this.timers.clear(); }
  }

  ns.GardenPractice = Object.assign(ns.GardenPractice || {}, { WaterGarden });
  ns.WaterGarden = { scene, LANES };
})(window.MiftahGame || (window.MiftahGame = {}));
