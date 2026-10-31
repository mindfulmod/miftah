// A small, child-led visit to the sand table. Drawing practice stays motor
// evidence; seeing a path or finishing a stroke never proves letter recall.
(function (ns) {
  const LEVELS = ["show", "dotted", "start", "memory"];
  const normal = text => typeof text === 'string' ? text.normalize('NFC') : '';
  const baseOf = text => [...String(text || '')].find(c => ns.LettersStrokes?.LETTERS?.[c]);
  const allowed = (item, ctx) => item?.id != null && normal(item.display) && item.taught !== false && item.isTaught !== false
    && item.locked !== true && item.unlocked !== false
    && (!ctx.completedWorldIds || !(item.prerequisiteWorldIds || []).some(id => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
  function eligible(items, ctx) {
    const rows = (items || []).filter(Boolean), blocked = new Set(rows.filter(i => !allowed(i, ctx)).map(i => normal(i.display)));
    const seen = new Set();
    return rows.filter(i => {
      const display = normal(i.display);
      if (!allowed(i, ctx) || blocked.has(display) || seen.has(display) || !ns.LettersStrokes?.forItem?.({ ...i, display })) return false;
      seen.add(display); return true;
    }).map(i => ({ ...i, display: normal(i.display) }));
  }
  function planned(ctx, pool, count) {
    if (typeof ns.PracticeLearning?.plan !== 'function') return pool.slice(0, count);
    const result = ns.PracticeLearning.plan(ctx, pool.slice(), 'drawing', count);
    if (!Array.isArray(result)) return [];
    const byId = new Map(pool.map(i => [String(i.id), i]));
    return [...new Set(result.map(i => byId.get(String(typeof i === 'object' ? i?.id : i))).filter(Boolean))].slice(0, count);
  }
  const arrow = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 24H36M26 13L37 24L26 35" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const eye = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 24Q24 4 42 24Q24 44 6 24Z" fill="#fffaf0" stroke="#4a3620" stroke-width="3"/><circle cx="24" cy="24" r="8" fill="#62cdf4" stroke="#4a3620" stroke-width="3"/><circle cx="25" cy="23" r="3" fill="#4a3620"/><circle cx="27" cy="20" r="2" fill="#fffdf7"/></svg>`;

  class SandTable {
    constructor(ctx) {
      this.ctx = ctx; this.alive = true; this.round = 0; this.drawVersion = 0; this.speechVersion = 0;
      this.timers = new Set(); this.reported = new Set(); this.at = 0;
      const pool = eligible(ctx.items, ctx);
      this.letters = planned(ctx, pool, ctx.beginner ? 2 : 3);
      // A taught syllable may return at the end; never manufacture a letter +
      // random mark, or replace the curriculum's item identity with its glyph.
      const syllables = eligible([...(ctx.items || []), ...(ctx.syllables || [])], ctx)
        .filter(i => [...i.display].length > 1 && !i.display.startsWith('ا'));
      if (!ctx.beginner && this.letters.length >= 2 && [...this.letters.at(-1).display].length === 1 && syllables.length) {
        const marked = planned(ctx, syllables, 1)[0];
        if (marked) this.letters[this.letters.length - 1] = marked;
      }
      this.levels = this.letters.map(item => this.level(item)); // frozen for this visit
      ctx.stage.innerHTML = `<div class="sand" role="group" aria-label="Sand table">
        <div class="sand-setting" aria-hidden="true">${ns.SandPlayArt?.setting?.() || ''}</div>
        <div class="sand-tray"><div class="sand-paper"></div><svg class="sand-friend" viewBox="-8 -8 116 116" aria-hidden="true"></svg><span class="sand-grains" aria-hidden="true"><i></i><i></i><i></i></span></div>
        <div class="sand-tools"><button type="button" class="sand-rake" aria-label="Smooth the sand">${ns.SandPlayArt?.rake?.(48) || eye}</button>
          <button type="button" class="sand-help" aria-label="Show me how to draw">${eye}</button>
          <span class="sand-progress" role="progressbar" aria-label="Letters drawn" aria-valuemin="0" aria-valuemax="${this.letters.length}" aria-valuenow="0">${this.letters.map(() => '<i></i>').join('')}</span>
          <button type="button" class="sand-next" aria-label="Next letter" disabled>${arrow}</button></div></div>`;
      this.root = ctx.stage.querySelector('.sand'); this.paper = ctx.stage.querySelector('.sand-paper');
      this.friend = ctx.stage.querySelector('.sand-friend'); this.grains = ctx.stage.querySelector('.sand-grains');
      this.tray = ctx.stage.querySelector('.sand-tray');
      this.nextButton = ctx.stage.querySelector('.sand-next'); this.helpButton = ctx.stage.querySelector('.sand-help');
      this.rakeButton = ctx.stage.querySelector('.sand-rake'); this.progress = ctx.stage.querySelector('.sand-progress');
      this.rakeButton.onclick = () => this.rake(); this.helpButton.onclick = () => this.help(); this.nextButton.onclick = () => this.advance();
      if (this.letters.length) this.next(); else this.later(() => ctx.cancel?.(), 0);
    }
    live() { return this.alive && this.ctx.stage.isConnected !== false && !this.finished; }
    later(fn, ms) {
      const round = this.round;
      const timer = setTimeout(() => { this.timers.delete(timer); if (this.live() && round === this.round) fn(); }, ms);
      this.timers.add(timer); return timer;
    }
    clearTimers() { this.timers.forEach(clearTimeout); this.timers.clear(); }
    level(item) {
      if (this.ctx.beginner) return 0;
      const lv = ns.PracticeLearning?.level?.(this.ctx, [item], 'drawing');
      if (!(lv > 0)) return 0;
      if (lv < 2) return 1;
      const evidence = (this.ctx.strength || ns.LettersStrength)?.skillProfile?.(item.id, 'drawing') || {};
      const motor = evidence.motor || {}, visits = new Set((motor.sessions || []).filter(Boolean)).size;
      return this.ctx.canListen?.() !== false && motor.r >= 10 && motor.streak >= 4 && visits >= 4 ? 3 : 2;
    }
    next() {
      if (!this.live()) return;
      if (this.at >= this.letters.length) return this.finish();
      this.clearTimers(); this.round++; this.speechVersion++;
      this.item = this.letters[this.at]; this.lv = this.levels[this.at]; this.assisted = false; this.snaps = 0;
      this.paper.dataset.level = LEVELS[this.lv];
      if (this.lv >= 3) { this.ctx.prompt?.(null); this.ctx.beginRound?.(this.item, 'drawing'); }
      else this.ctx.prompt?.(this.item);
      this.ctx.stage.querySelectorAll('.sand-progress i').forEach((dot, i) => { dot.className = i < this.at ? 'is-done' : i === this.at ? 'is-on' : ''; });
      this.progress.setAttribute('aria-valuenow', String(this.at));
      this.nextButton.setAttribute('aria-label', this.at === this.letters.length - 1 ? 'Finish sand drawing' : 'Next letter');
      this.draw(true); this.speak();
    }
    draw(demo = false) {
      this.guided?.destroy(); const version = ++this.drawVersion;
      this.ready = false; this.nextButton.disabled = true; this.helpButton.disabled = false;
      this.root.classList.remove('is-ready'); this.friend.innerHTML = ''; this.friend.classList.remove('is-up');
      this.grains.classList.remove('is-moving');
      const item = this.item, round = this.round;
      const current = () => this.live() && this.round === round && version === this.drawVersion && !this.ready;
      this.guided = ns.LettersStrokes.guide(this.paper, ns.LettersStrokes.forItem(item), {
        ink: () => '#a89478', reduced: !demo || this.lv > 0 || !!this.ctx.reducedMotion?.(),
        onMove: e => { if (current()) this.grain(e); },
        onSnap: () => { if (current()) { this.snaps++; this.assisted = true; } },
        onStroke: () => { if (current()) this.ctx.sfx?.('drip'); },
        onDone: () => { if (current()) this.written(item); },
      });
      // Harakat can reach y=99; leave room for the full rounded guide stroke.
      this.guided.svg?.setAttribute?.('viewBox', '-8 -8 116 116');
    }
    speak() {
      if (!this.live() || !this.item) return;
      const round = this.round, token = ++this.speechVersion, item = this.item;
      const current = () => this.live() && this.round === round && token === this.speechVersion && !this.ready;
      let settled = false;
      const heard = value => { settled = true; if (current() && value !== true && this.lv >= 3) this.revealPath(); };
      try { Promise.resolve(this.ctx.say?.(item)).then(heard, () => heard(false)); } catch { heard(false); }
      if (this.lv >= 3) this.later(() => { if (current() && !settled) this.revealPath(); }, 5000);
    }
    grain(event) {
      if (!event) { this.grains.classList.remove('is-moving'); return; }
      const now = performance.now();
      if (now - (this.lastGrain || 0) > 90) { this.lastGrain = now; this.ctx.sfx?.('sand'); }
      if (now - (this.lastBuzz || 0) > 180) { this.lastBuzz = now; try { ns.Haptics?.pulse?.('page'); } catch {} }
      if (this.ctx.reducedMotion?.()) return;
      const r = this.tray.getBoundingClientRect();
      if (!r.width || !r.height) return;
      this.grains.style.left = `${Math.max(0, Math.min(100, (event.clientX - r.left) / r.width * 100))}%`;
      this.grains.style.top = `${Math.max(0, Math.min(100, (event.clientY - r.top) / r.height * 100))}%`;
      this.grains.classList.add('is-moving');
    }
    written(item) {
      if (!this.live() || this.ready || item !== this.item) return;
      this.ready = true; this.speechVersion++; this.clearTimers(); this.grains.classList.remove('is-moving');
      this.root.classList.add('is-ready'); this.nextButton.disabled = false; this.helpButton.disabled = true;
      this.progress.setAttribute('aria-valuenow', String(this.at + 1));
      this.ctx.stage.querySelectorAll('.sand-progress i').forEach((dot, i) => { dot.className = i <= this.at ? 'is-done' : ''; });
      if (!this.reported.has(item.id)) {
        this.reported.add(item.id);
        this.ctx.reportOutcome?.({ item, itemId: item.id, activity: 'SandTable', skill: 'drawing', evidence: 'motor_assembly_participation',
          correct: true, assisted: this.assisted || this.snaps > 0, affectsStrength: false });
      }
      const char = baseOf(item.display);
      if (ns.LetterFriends?.FRIENDS?.[char]) { this.friend.innerHTML = ns.LetterFriends.dress(char); this.friend.classList.add('is-up'); }
      this.ctx.correct?.(); this.ctx.pet?.cheer?.();
      // No timer advances the page. The child can enjoy it, smooth it, or go on.
    }
    revealPath() {
      if (!this.live() || this.ready) return;
      this.assisted = true; this.lv = 0; this.paper.dataset.level = 'show';
      this.ctx.prompt?.(this.item); this.ctx.sfx?.('rustle');
    }
    help() {
      if (!this.live() || this.ready) return;
      this.revealPath();
      this.guided?.demonstrate?.({ reduced: !!this.ctx.reducedMotion?.() });
    }
    rake() {
      if (!this.live() || !this.guided) return;
      this.clearTimers(); this.speechVersion++; this.assisted = true;
      this.ctx.sfx?.('rake');
      this.paper.classList.remove('is-raked'); void this.paper.offsetWidth; this.paper.classList.add('is-raked');
      // Replace the guide to retire its demo and pointer ownership atomically.
      this.draw(false);
      if (this.lv >= 3) this.revealPath();
    }
    advance() {
      if (!this.live() || !this.ready) return;
      this.ready = false; this.nextButton.disabled = true; this.at++; this.next();
    }
    finish() {
      if (!this.live()) return;
      this.finished = true; this.clearTimers(); this.speechVersion++; this.drawVersion++;
      this.guided?.destroy(); this.guided = null; this.ctx.done?.();
    }
    replayPrompt() { this.speak(); }
    destroy() {
      if (!this.alive) return;
      this.alive = false; this.clearTimers(); this.speechVersion++; this.drawVersion++;
      this.guided?.destroy(); this.guided = null;
    }
  }
  SandTable.LEVELS = LEVELS;
  ns.GardenPractice = ns.GardenPractice || {};
  ns.GardenPractice.SandTable = SandTable;
})(window.MiftahGame || (window.MiftahGame = {}));
