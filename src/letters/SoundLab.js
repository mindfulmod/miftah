// Sound Lab: a child-operated sound press. Exploration never awards learning
// evidence or completion. The curriculum still owns which ingredients are taught.
(function (ns) {
  const MARK_NAMES = { "َ": "fatha", "ِ": "kasra", "ُ": "damma", "ْ": "sukoon", "ً": "tanween fath", "ٍ": "tanween kasr", "ٌ": "tanween damm", "ّ": "shadda", "ِّ": "shadda with kasra", "ُّ": "shadda with damma" };
  const PAGE_SIZE = 3;
  const escape = text => String(text || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arrow = reverse => `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 24H36M26 13L37 24L26 35" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" ${reverse?'transform="translate(48 0) scale(-1 1)"':''}/></svg>`;
  const mixIcon = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 16Q10 32 25 32M54 16Q54 32 39 32M32 36V53M23 45L32 54L41 45" fill="none" stroke="#4a3620" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="13" r="6" fill="#62cdf4" stroke="#4a3620" stroke-width="3"/><circle cx="54" cy="13" r="6" fill="#f3c955" stroke="#4a3620" stroke-width="3"/></svg>`;
  function taughtLetters(rows, ctx) {
    // The vowel chapters and hat workshop also exclude bare alif from their
    // consonant+mark catalogues. Keep this toy on the same teaching boundary.
    const eligible = i => i?.id != null && /^[بتثجحخدذرزسشصضطظعغفقكلمنهوي]$/u.test(i.display || '')
      && i.taught !== false && i.isTaught !== false && i.locked !== true && i.unlocked !== false
      && (!ctx.completedWorldIds || !(i.prerequisiteWorldIds || []).some(id => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));
    const pool = (Array.isArray(rows) ? rows : []).filter(Boolean), blocked = new Set(pool.filter(i => !eligible(i)).map(i => i.display));
    const ids = new Set(), glyphs = new Set();
    return pool.filter(i => { if (!eligible(i) || blocked.has(i.display) || ids.has(String(i.id)) || glyphs.has(i.display)) return false; ids.add(String(i.id)); glyphs.add(i.display); return true; });
  }
  // Practice chunks, not vocabulary words: the supporting vowel lets a child
  // hear a closed or doubled consonant. Never add a vowel only in the audio.
  const soundItem = (letter, mark) => {
    const context = letter !== "ا" && (mark === "ْ" || mark.includes("ّ"));
    const focus = letter + (context && mark === "ّ" ? "َّ" : mark);
    const prefix = context ? "أَ" : "";
    const display = prefix + focus;
    return { id: display, display, speak: display, ...(context ? { prefix, focus } : {}) };
  };

  function ink(item) {
    const content = item.focus ? `<tspan>${escape(item.prefix)}</tspan><tspan fill="#7a3512" text-decoration="underline">${escape(item.focus)}</tspan>` : escape(item.display);
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><text data-fit-box="50,50,82,76,60" x="50" y="68" text-anchor="middle" direction="rtl" font-family="'Amiri Quran',serif" font-size="60" fill="#4a3620">${content}</text></svg>`;
  }

  class SoundLab {
    constructor(ctx) {
      this.ctx = ctx; this.alive = true; this.noReplay = true; this.busy = false;
      this.letters = taughtLetters(ctx.items, ctx);
      this.marks = [...new Set((ctx.marks || []).filter(m => MARK_NAMES[m]))];
      if (this.marks.includes('ّ')) {
        if (this.marks.includes('ِ')) this.marks.push('ِّ');
        if (this.marks.includes('ُ')) this.marks.push('ُّ');
      }
      this.pages = { letters: 0, marks: 0 }; this.made = []; this.makeToken = 0; this.makeTimer = null;
      this.letter = this.letters[0] || null; this.mark = null; this.current = null;
      if (!this.letters.length || !this.marks.length) { this.alive = false; Promise.resolve().then(() => ctx.cancel?.()); return; }
      const picker = (kind, label) => `<div class="lab-picker" data-kind="${kind}" role="group" aria-label="${label}"><button type="button" class="lab-page lab-prev" aria-label="Previous ${kind}">${arrow(true)}</button><div class="lab-tray lab-${kind}"></div><button type="button" class="lab-page lab-next" aria-label="More ${kind}">${arrow(false)}</button></div>`;
      ctx.stage.innerHTML = `<div class="lab lab-workshop" role="group" aria-label="Sound workshop">
        <div class="lab-strip" role="group" aria-label="Sounds you made"></div>
        <div class="lab-console">${ns.SoundLabArt?.machine?.() || ''}
          <div class="lab-ingredient is-letter" role="img"></div><div class="lab-ingredient is-mark" role="img" aria-label="Choose a mark"></div>
          <button type="button" class="lab-out" aria-label="Play the sound again" disabled></button>
        </div>
        <button type="button" class="lab-mix" aria-label="Mix the letter and mark" disabled>${mixIcon}</button>
        ${picker('marks', 'Marks')}${picker('letters', 'Letters')}
      </div>`;
      this.root = ctx.stage.querySelector('.lab-workshop');
      this.slotLetter = this.root.querySelector('.lab-ingredient.is-letter'); this.slotMark = this.root.querySelector('.lab-ingredient.is-mark');
      this.out = this.root.querySelector('.lab-out'); this.press = this.root.querySelector('.lab-console');
      this.strip = this.root.querySelector('.lab-strip'); this.mix = this.root.querySelector('.lab-mix');
      this.pickers = Object.fromEntries(['marks','letters'].map(kind => [kind,this.root.querySelector(`[data-kind="${kind}"]`)]));
      for (const kind of ['marks','letters']) {
        this.pickers[kind].querySelector('.lab-prev').onclick = e => this.page(kind, -1, e.detail === 0);
        this.pickers[kind].querySelector('.lab-next').onclick = e => this.page(kind, 1, e.detail === 0);
        this.renderTray(kind);
      }
      this.mix.onclick = () => this.tryMake(); this.out.onclick = () => this.replayPrompt();
      this.renderHistory(); this.refresh(); ctx.prompt?.(this.letter);
      this.observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.fit()) : null;
      this.observer?.observe(ctx.stage); this.fit();
    }
    fit() { if (this.alive) ns.LettersArt?.fitGlyphs?.(this.root); }
    safeSay(item) { if (!this.alive || !item) return; try { Promise.resolve(this.ctx.say?.(item)).catch(() => {}); } catch { /* unavailable playback leaves the toy usable */ } }
    page(kind, delta, keyboard = false) {
      if (!this.alive || !this.pickers[kind]) return;
      const pool = this[kind], next = Math.max(0, Math.min(Math.ceil(pool.length/PAGE_SIZE)-1, this.pages[kind]+delta));
      if (next === this.pages[kind]) return;
      this.pages[kind] = next; this.renderTray(kind); this.ctx.sfx?.('page');
      if (keyboard) this.pickers[kind].querySelector('.lab-tile')?.focus?.();
    }
    renderTray(kind) {
      const picker = this.pickers[kind], from = this.pages[kind]*PAGE_SIZE;
      const pool = this[kind];
      picker.querySelector('.lab-tray').innerHTML = pool.slice(from,from+PAGE_SIZE).map((value,i) => {
        const item = kind === 'letters' ? value : { display:'ـ'+value };
        return `<button type="button" class="lab-tile${kind==='marks'?' is-mark':''}" data-index="${from+i}" aria-label="${kind==='letters'?escape(value.display):MARK_NAMES[value]}" aria-pressed="false">${ink(item)}</button>`;
      }).join('');
      const generation = this.pages[kind];
      picker.querySelectorAll('.lab-tile').forEach(button => button.onclick = () => {
        if (!this.alive || generation !== this.pages[kind] || !button.isConnected) return;
        const value = pool[Number(button.dataset.index)];
        kind === 'letters' ? this.pickLetter(value,button) : this.pickMark(value,button);
      });
      picker.querySelector('.lab-prev').disabled = this.pages[kind] === 0;
      picker.querySelector('.lab-next').disabled = from+PAGE_SIZE >= pool.length;
      this.refreshSelection(); this.fit();
    }
    refreshSelection() {
      for (const kind of ['marks','letters']) this.pickers[kind]?.querySelectorAll('.lab-tile').forEach(button => {
        const value = this[kind][Number(button.dataset.index)], selected = kind === 'letters' ? value?.id === this.letter?.id : value === this.mark;
        button.setAttribute('aria-pressed',String(selected)); button.classList.toggle('is-selected',selected);
      });
    }
    refresh() {
      if (!this.alive) return;
      this.slotLetter.innerHTML = ink(this.letter); this.slotLetter.setAttribute('aria-label',`Selected letter ${this.letter.display}`);
      this.slotMark.innerHTML = this.mark ? ink({display:'ـ'+this.mark}) : '<span class="lab-mark-wait" aria-hidden="true"></span>';
      this.slotMark.setAttribute('aria-label',this.mark ? `Selected ${MARK_NAMES[this.mark]}` : 'Choose a mark');
      this.slotMark.classList.toggle('is-full',!!this.mark);
      // Keep keyboard focus on the press while its brief animation runs.
      // The busy guard in tryMake prevents a second activation.
      this.mix.disabled = !this.mark;
      this.mix.setAttribute('aria-disabled', String(!this.mark || this.busy));
      this.mix.setAttribute('aria-busy', String(this.busy));
      this.mix.classList.toggle('is-ready',!!this.mark && !this.busy);
      this.out.disabled = !this.current || this.busy;
      this.refreshSelection(); this.fit();
    }
    cancelPress() {
      this.makeToken++; if (this.makeTimer !== null) clearTimeout(this.makeTimer); this.makeTimer = null;
      this.busy = false; this.press?.classList.remove('is-running');
    }
    change() {
      this.cancelPress(); this.current = null; this.out.innerHTML = ''; this.out.classList.remove('is-new');
      this.out.setAttribute('aria-label','Play the sound again');
      this.refresh(); this.ctx.prompt?.(this.letter);
    }
    pickLetter(letter, button) {
      if (!this.alive || !this.letters.includes(letter)) return;
      this.letter = letter; this.change(); this.ctx.sfx?.('click'); this.safeSay(letter); this.bump(button);
    }
    pickMark(mark, button) {
      if (!this.alive || !this.marks.includes(mark)) return;
      this.mark = mark; this.change(); this.ctx.sfx?.('click'); this.bump(button);
    }
    bump(button) {
      if (!this.ctx.reducedMotion?.()) button?.animate?.([{transform:'none'},{transform:'translateY(-3px)'},{transform:'none'}],{duration:180,easing:'ease-out'});
    }
    tryMake() {
      if (!this.alive || this.busy || !this.letter || !this.marks.includes(this.mark)) return;
      const item = soundItem(this.letter.display,this.mark);
      if (this.current?.display === item.display) { this.replayPrompt(); return; }
      const token = ++this.makeToken, letter = this.letter, mark = this.mark;
      this.busy = true; this.refresh(); this.press.classList.add('is-running'); this.ctx.sfx?.('turn');
      this.makeTimer = setTimeout(() => {
        if (!this.alive || token !== this.makeToken) return;
        this.makeTimer = null;
        this.busy = false; this.press.classList.remove('is-running');
        this.current = item; this.out.innerHTML = ink(item); this.out.classList.add('is-new');
        this.out.setAttribute('aria-label',`Play ${item.display} again`);
        this.made = [{item,letterId:letter.id,mark},...this.made.filter(entry => entry.item.display !== item.display)].slice(0,8);
        this.renderHistory(); this.refresh(); this.ctx.prompt?.(item); this.ctx.sfx?.('pop'); this.safeSay(item); this.ctx.pet?.cheer?.();
      },this.ctx.reducedMotion?.()?0:320);
    }
    renderHistory() {
      this.strip.innerHTML = this.made.length ? this.made.map((entry,i)=>`<button type="button" class="lab-made" data-made="${i}" aria-label="Play ${escape(entry.item.display)}">${ink(entry.item)}</button>`).join('') : '<span class="lab-history-slot" aria-hidden="true"></span>'.repeat(3);
      this.strip.querySelectorAll('.lab-made').forEach((button,i)=>{const entry=this.made[i];button.onclick=()=>{if(this.alive && button.isConnected)this.revisit(entry);};});
      this.strip.scrollLeft = 0;
    }
    revisit(entry) {
      if (!this.alive || !this.made.includes(entry) || !this.marks.includes(entry.mark)) return;
      const index = this.letters.findIndex(letter => letter.id === entry.letterId); if(index<0)return;
      this.cancelPress(); this.letter = this.letters[index]; this.mark = entry.mark;
      this.pages.letters = Math.floor(index/PAGE_SIZE); this.pages.marks = Math.floor(this.marks.indexOf(entry.mark)/PAGE_SIZE);
      this.current = entry.item; this.out.innerHTML = ink(entry.item); this.out.classList.remove('is-new');
      this.out.setAttribute('aria-label',`Play ${entry.item.display} again`);
      this.renderTray('letters'); this.renderTray('marks'); this.refresh(); this.ctx.prompt?.(entry.item); this.safeSay(entry.item);
    }
    replayPrompt() { if(this.alive && this.current && !this.busy){this.ctx.prompt?.(this.current);this.safeSay(this.current);} }
    destroy() { if(!this.alive)return;this.alive=false;this.cancelPress();this.observer?.disconnect();this.root?.querySelectorAll('*').forEach(el=>el.getAnimations?.().forEach(a=>a.cancel())); }
  }
  SoundLab.MARK_NAMES = MARK_NAMES; SoundLab.soundItem = soundItem; SoundLab.taughtLetters = taughtLetters;
  ns.GardenPractice = ns.GardenPractice || {}; ns.GardenPractice.SoundLab = SoundLab;
})(window.MiftahGame || (window.MiftahGame = {}));
