// A child's stamp-making table. Creative play has no correctness verdicts.
// The visible picture and saved garden sign share the same scene and stamp data.
(function (ns) {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const FONT = "'Amiri Quran', serif";
  const INKS = ['#4a3620', '#c25a49', '#2f5c46', '#3a8fc4', '#70501b'];
  const MAX = 24;
  const arrow = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M10 20H30M22 11L31 20L22 29" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const allowed = (item, ctx) => item?.id && /^[ء-ي]$/u.test(item.display || '') && item.taught !== false && item.isTaught !== false && item.locked !== true && item.unlocked !== false
    && (!ctx.completedWorldIds || !(item.prerequisiteWorldIds || []).some(id => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
  function letters(items, ctx) {
    const rows = (items || []).filter(Boolean), blocked = new Set(rows.filter(item => !allowed(item, ctx)).map(item => item.display));
    const seen = new Set();
    return rows.filter(item => { if (!allowed(item, ctx) || blocked.has(item.display) || seen.has(item.display)) return false; seen.add(item.display); return true; }).slice(0, 28);
  }
  const glyph = (text, color = '#4a3620', size = 40) => `<svg viewBox="-40 -40 80 80" aria-hidden="true"><text data-fit-box="0,0,60,60,${size}" text-anchor="middle" font-family="${FONT}" font-size="${size}" direction="rtl" fill="${color}"${size === 62 ? ' paint-order="stroke" stroke="#fffaf0" stroke-width="4" stroke-linejoin="round"' : ''}>${escape(text)}</text></svg>`;

  class LetterStudio {
    constructor(ctx) {
      this.ctx = ctx; this.alive = true; this.hanging = false; this.finished = false; this.pending = new Set();
      this.letters = letters(ctx.items, ctx); this.stickers = [...new Set((ctx.stickers || []).filter(id => typeof id === 'string'))].slice(0, 12);
      this.colors = ns.DrawingPalette?.colors || INKS.map((value, i) => ({ value, name: `Ink ${i + 1}` }));
      this.ink = ns.DrawingPalette?.startForPet?.(ctx.petHue) || INKS[0];
      this.pick = this.letters[0] ? { kind: 'letter', item: this.letters[0] } : this.stickers[0] ? { kind: 'sticker', id: this.stickers[0] } : null;
      this.stamps = []; this.cursor = [200, 150];
      this.scene = ns.LetterStudioArt?.scene?.(ctx.land) || '<rect width="400" height="300" fill="#ccfbef"/>';
      ctx.stage.innerHTML = `<div class="studio" role="group" aria-label="Letter Studio">
        <div class="studio-easel"><span class="studio-clip" aria-hidden="true"></span>
          <svg class="studio-canvas" viewBox="0 0 400 300" tabindex="0" role="button" aria-label="Stamp your picture. Arrow keys move the stamp, Enter places it.">
            ${this.scene}<g class="studio-stamps"></g><g class="studio-cursor" transform="translate(200 150)" aria-hidden="true"><circle r="36"/><path d="M-43 0H-30M30 0H43M0-43V-30M0 30V43"/></g>
          </svg><span class="studio-invitation" aria-hidden="true">${ns.LetterStudioArt?.stamp?.(64) || ''}</span>
        </div>
        <div class="studio-controls">
          <div class="studio-rail"><div class="studio-inks" role="group" aria-label="Stamp ink">${this.colors.map(c => `<button type="button" class="studio-ink" data-ink="${c.value}" style="--ink:${c.value}" aria-label="${c.name} ink" aria-pressed="${c.value === this.ink}"><span aria-hidden="true"></span></button>`).join('')}</div><button type="button" class="studio-more" data-rail="ink" aria-label="More ink colours">${arrow}</button></div>
          <div class="studio-rail"><div class="studio-tray" role="group" aria-label="Stamps">
            ${this.letters.map((item, i) => `<button type="button" class="studio-stamp" data-letter="${i}" aria-label="${escape(item.display)} stamp" aria-pressed="${i === 0}">${glyph(item.display)}</button>`).join('')}
            ${this.stickers.map(id => `<button type="button" class="studio-stamp is-sticker" data-sticker="${escape(id)}" aria-label="${escape(id)} stamp" aria-pressed="${!this.letters.length && id === this.stickers[0]}">${ns.LettersArt?.stickerMotif?.(id, 48) || ''}</button>`).join('')}
          </div><button type="button" class="studio-more" data-rail="stamps" aria-label="More stamps">${arrow}</button></div>
          <div class="studio-tools"><button type="button" class="studio-undo" aria-label="Take back the last stamp" disabled>${ns.LettersArt.icon('undo', 30)}</button><button type="button" class="studio-hang" aria-label="Hang the picture in your garden" disabled>${ns.LetterStudioArt?.hanger?.(48) || ns.LettersArt.icon('check', 34)}</button></div>
        </div></div>`;
      const find = selector => ctx.stage.querySelector(selector);
      this.root = find('.studio'); this.svg = find('.studio-canvas'); this.layer = find('.studio-stamps'); this.cursorNode = find('.studio-cursor');
      this.undoBtn = find('.studio-undo'); this.hangBtn = find('.studio-hang'); this.hangArt = this.hangBtn.innerHTML;
      ctx.stage.querySelectorAll('.studio-stamp').forEach(button => button.onclick = () => {
        if (!this.editable()) return;
        this.pick = button.dataset.sticker ? { kind: 'sticker', id: button.dataset.sticker } : { kind: 'letter', item: this.letters[Number(button.dataset.letter)] };
        ctx.stage.querySelectorAll('.studio-stamp').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
        this.prompt(); this.speak(); ctx.sfx?.('click');
      });
      ctx.stage.querySelectorAll('.studio-ink').forEach(button => button.onclick = () => {
        if (!this.editable()) return;
        this.ink = button.dataset.ink;
        ctx.stage.querySelectorAll('.studio-ink').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
        ctx.sfx?.('click');
      });
      this.svg.addEventListener('click', event => {
        if (event.detail === 0 || !this.editable()) return;
        const m = this.svg.getScreenCTM?.(); if (!m) return;
        const p = this.svg.createSVGPoint(); p.x = event.clientX; p.y = event.clientY;
        const q = p.matrixTransform(m.inverse()); this.placeAt(q.x, q.y);
      });
      this.svg.addEventListener('keydown', event => {
        if (!this.editable()) return;
        const offsets = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] };
        if (offsets[event.key]) { event.preventDefault(); this.cursor = this.clamp(this.cursor[0] + offsets[event.key][0], this.cursor[1] + offsets[event.key][1]); this.paintCursor(); }
        else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.placeAt(...this.cursor); }
      });
      this.undoBtn.onclick = () => this.undo(); this.hangBtn.onclick = () => this.hang();
      this.rails = [['.studio-inks', '[data-rail="ink"]'], ['.studio-tray', '[data-rail="stamps"]']].map(([row, more]) => {
        const rail = find(row), button = find(more);
        const update = () => {
          if (!this.alive) return;
          // Compare against the whole rail: the arrow must not create its own overflow.
          button.hidden = rail.scrollWidth <= (rail.parentElement?.clientWidth || rail.clientWidth) + 1;
          const max = rail.scrollWidth - rail.clientWidth, end = rail.scrollLeft >= max - 8;
          button.classList.toggle('is-back', end); button.setAttribute('aria-label', end ? 'Back to first choices' : more.includes('ink') ? 'More ink colours' : 'More stamps');
        };
        const revealInk = () => {
          if (row === '.studio-inks' && rail.clientWidth) {
            const selected = rail.querySelector?.('[aria-pressed="true"]');
            const inkBox = selected?.getBoundingClientRect?.(), railBox = rail.getBoundingClientRect?.();
            if (inkBox && railBox && (inkBox.left < railBox.left + 5 || inkBox.right > railBox.right - 5)) rail.scrollLeft += inkBox.left - railBox.left - (rail.clientWidth - inkBox.width) / 2;
          }
        };
        rail.addEventListener('scroll', update, { passive: true });
        button.onclick = () => { if (!this.editable()) return; const max = rail.scrollWidth - rail.clientWidth; rail.scrollTo({ left: rail.scrollLeft >= max - 8 ? 0 : Math.min(max, rail.scrollLeft + rail.clientWidth * .8), behavior: ctx.reducedMotion?.() ? 'auto' : 'smooth' }); };
        return { rail, update, revealInk };
      });
      this.resize = () => { if (this.alive) { this.rails.forEach(row => { row.update(); row.revealInk(); row.update(); }); ns.LettersArt.fitGlyphs?.(this.root); } };
      if (typeof ResizeObserver !== 'undefined') { this.observer = new ResizeObserver(this.resize); this.observer.observe(this.root); }
      this.resize(); this.prompt();
      if (!this.pick) Promise.resolve().then(() => this.alive && ctx.cancel?.());
    }
    editable() { return this.alive && !this.hanging && !this.finished && this.ctx.stage.isConnected !== false; }
    prompt() { this.ctx.prompt?.(this.pick?.kind === 'letter' ? this.pick.item : null); }
    speak() { if (!this.alive || this.pick?.kind !== 'letter') return; try { Promise.resolve(this.ctx.say?.(this.pick.item)).catch(() => {}); } catch {} }
    clamp(x, y) { return [Math.max(48, Math.min(352, x)), Math.max(48, Math.min(252, y))]; }
    paintCursor() { this.cursorNode.setAttribute('transform', `translate(${this.cursor[0]} ${this.cursor[1]})`); }
    placeAt(x, y) {
      if (!this.editable() || !this.pick || !Number.isFinite(x) || !Number.isFinite(y) || this.stamps.length >= MAX) return false;
      // A tap in SVG letterboxing is not a request to stamp the picture.
      if (x < 0 || x > 400 || y < 0 || y > 300) return false;
      [x, y] = this.clamp(x, y); this.cursor = [x, y]; this.paintCursor();
      const stamp = this.pick.kind === 'letter' ? { kind: 'letter', text: this.pick.item.display, x, y, ink: this.ink } : { kind: 'sticker', id: this.pick.id, x, y };
      this.stamps.push(stamp);
      const g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('class', 'studio-placed'); g.setAttribute('transform', `translate(${x} ${y})`);
      g.innerHTML = `<g class="studio-mark">${stamp.kind === 'letter' ? glyph(stamp.text, stamp.ink, 62).replace('<svg ', '<svg x="-40" y="-40" width="80" height="80" ') : this.stickerSVG(stamp.id)}</g>`;
      this.layer.appendChild(g); ns.LettersArt.fitGlyphs?.(g);
      this.speak(); this.ctx.sfx?.('sticker'); this.sync(); return true;
    }
    stickerSVG(id) { return (ns.LettersArt?.stickerMotif?.(id, 80) || '').replace('<svg ', '<svg x="-40" y="-40" '); }
    sync() {
      this.root.classList.toggle('has-stamps', !!this.stamps.length); this.root.classList.toggle('is-full', this.stamps.length >= MAX);
      this.root.classList.remove('save-failed'); this.hangBtn.innerHTML = this.hangArt; this.hangBtn.setAttribute('aria-label', 'Hang the picture in your garden');
      this.undoBtn.disabled = this.hangBtn.disabled = !this.stamps.length;
      this.svg.setAttribute('aria-disabled', String(this.stamps.length >= MAX));
    }
    undo() {
      if (!this.editable() || !this.stamps.length) return false;
      this.stamps.pop(); this.layer.lastElementChild?.remove(); this.ctx.sfx?.('rustle'); this.sync(); return true;
    }
    wait(promise) {
      return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (fn, value) => { if (settled) return; settled = true; clearTimeout(timer); this.pending.delete(cancel); fn(value); };
        const cancel = () => finish(reject, new Error('Picture interrupted'));
        const timer = setTimeout(() => finish(reject, new Error('Picture timed out')), 8000);
        this.pending.add(cancel); Promise.resolve(promise).then(value => finish(resolve, value), error => finish(reject, error));
      });
    }
    async image(source) {
      const img = new Image();
      await this.wait(new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject(new Error('Picture image unavailable')); img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`; }));
      if (!img.width || !img.height) throw new Error('Blank picture image');
      return img;
    }
    async thumbnail(snapshot) {
      if (document.fonts?.load) await this.wait(document.fonts.load(`62px ${FONT}`));
      if (!this.alive) throw new Error('Picture interrupted');
      const c = document.createElement('canvas'); c.width = c.height = 160;
      const g = c.getContext('2d'); if (!g) throw new Error('Canvas unavailable');
      const scene = await this.image(`<svg xmlns="${SVGNS}" width="400" height="300" viewBox="0 0 400 300">${this.scene}</svg>`);
      if (!this.alive) throw new Error('Picture interrupted');
      g.fillStyle = '#fffaf0'; g.fillRect(0, 0, 160, 160); g.save(); g.translate(0, 20); g.scale(.4, .4); g.drawImage(scene, 0, 0, 400, 300);
      for (const st of snapshot) {
        if (!this.alive) throw new Error('Picture interrupted');
        if (st.kind === 'letter') {
          g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.direction = 'rtl'; g.font = `62px ${FONT}`;
          let m = g.measureText(st.text); const size = 62 * Math.min(1, 60 / (m.actualBoundingBoxLeft + m.actualBoundingBoxRight || 1), 60 / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent || 1));
          g.font = `${size}px ${FONT}`; m = g.measureText(st.text); g.fillStyle = st.ink;
          const x = st.x + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2, y = st.y + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
          g.strokeStyle = '#fffaf0'; g.lineWidth = 4; g.lineJoin = 'round'; g.strokeText(st.text, x, y); g.fillText(st.text, x, y);
        } else {
          const source = ns.LettersArt.stickerMotif(st.id, 80).replace('<svg ', `<svg xmlns="${SVGNS}" `);
          const img = await this.image(source); if (!this.alive) throw new Error('Picture interrupted');
          g.drawImage(img, st.x - 40, st.y - 40, 80, 80);
        }
      }
      g.restore(); return c.toDataURL('image/png');
    }
    async hang() {
      if (!this.editable() || !this.stamps.length) return false;
      this.hanging = true; this.root.setAttribute('aria-busy', 'true');
      const buttons = [...this.root.querySelectorAll('button')]; buttons.forEach(button => { button.disabled = true; });
      const snapshot = this.stamps.map(stamp => ({ ...stamp }));
      try {
        const url = await this.thumbnail(snapshot);
        if (!this.alive || !this.ctx.stage.isConnected) return false;
        if (!url || typeof this.ctx.saveDrawing !== 'function') throw new Error('Drawing could not be saved');
        const saved = await this.ctx.saveDrawing(url);
        if (saved === null) {
          if (this.alive) {
            this.hanging = false; this.root.removeAttribute('aria-busy');
            buttons.forEach(button => { button.disabled = false; }); this.sync();
          }
          return false;
        }
        if (saved !== true) throw new Error('Drawing could not be saved');
        if (!this.alive) return false;
        this.finished = true; this.ctx.correct?.(); this.ctx.pet?.cheer?.(); this.ctx.done?.(); return true;
      } catch {
        if (!this.alive) return false;
        this.hanging = false; this.root.removeAttribute('aria-busy'); buttons.forEach(button => { button.disabled = false; }); this.sync();
        this.root.classList.add('save-failed'); this.hangBtn.innerHTML = ns.LettersArt.icon('replay', 34); this.hangBtn.setAttribute('aria-label', 'Picture could not be saved. Try saving again');
        return false;
      }
    }
    replayPrompt() { if (this.editable()) this.speak(); }
    destroy() { this.alive = false; this.observer?.disconnect(); [...this.pending].forEach(cancel => cancel()); }
  }
  LetterStudio.INKS = INKS; LetterStudio.MAX = MAX;
  ns.GardenPractice = ns.GardenPractice || {}; ns.GardenPractice.LetterStudio = LetterStudio;
})(window.MiftahGame || (window.MiftahGame = {}));
