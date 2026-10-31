// Letter Balloons is an open-ended toy. Popping a balloon has no score,
// completion state, reward, or learning outcome attached to it.
(function (ns) {
  const COLORS = ["#ffa798", "#96ecff", "#b7e779", "#ffe49a", "#b49fcf", "#ee806f"];
  const ARABIC_LETTER = /^[\u0621-\u064a]$/u;
  const eligible = (item, ctx) => !!item?.id && typeof item.display === "string" && ARABIC_LETTER.test(item.display)
    && item.taught !== false && item.isTaught !== false && item.locked !== true && item.unlocked !== false
    && (!ctx.completedWorldIds || !(item.prerequisiteWorldIds || []).some(id => id !== ctx.worldId && !ctx.completedWorldIds.includes(id)));

  function taughtItems(rows, ctx) {
    const items = (Array.isArray(rows) ? rows : []).filter(Boolean);
    // If a glyph has any explicitly blocked alias, do not let another alias
    // smuggle the same visible letter into this free-play toy.
    const blocked = new Set(items.filter(item => !eligible(item, ctx)).map(item => item.display));
    const ids = new Set(), glyphs = new Set();
    return items.filter(item => {
      if (!eligible(item, ctx) || blocked.has(item.display) || ids.has(String(item.id)) || glyphs.has(item.display)) return false;
      ids.add(String(item.id)); glyphs.add(item.display); return true;
    });
  }

  class LetterBalloons {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      this.reduced = !!ctx.reducedMotion?.();
      this.index = 0;
      this.slots = [];
      this.timers = new Set();
      this.speechBusy = false;
      this.speechTimer = null;
      this.speechToken = 0;
      this.queuedItem = null;
      this.latestSelectedItem = null;
      this.mode = 'pop';
      this.chooseMode = ctx.chooseBalloonPlay === true;
      this.inflation = [0, 0, 0];
      this.slotItems = [];
      this.slotColors = [];

      const declared = Array.isArray(ctx.items);
      this.letters = taughtItems(ctx.items, ctx);
      const hasDeclaredMaterial = declared && ctx.items.length > 0;
      if (!this.letters.length && !hasDeclaredMaterial) {
        this.letters = taughtItems(ctx.starter, ctx);
      }

      ctx.stage.innerHTML = `<div class="balloons${this.reduced ? " is-still" : ""}" role="group" aria-label="Letter balloons">${ns.BalloonPlayArt?.clearing?.() || ''}</div>`;
      this.root = ctx.stage.querySelector(".balloons");
      if (!this.letters.length) {
        this.alive = false;
        Promise.resolve().then(() => ctx.cancel?.());
        return;
      }
      this.latestSelectedItem = this.letters[0];
      ctx.prompt?.(this.latestSelectedItem);
      if (this.chooseMode) this.addModeChoices();
      for (let slot = 0; slot < 3; slot += 1) this.add(slot);
      this.observer = typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => this.fitGlyphs()) : null;
      this.observer?.observe(ctx.stage);
      this.fitGlyphs();
    }

    addModeChoices() {
      this.root.classList.add('has-play-choices');
      const choices = document.createElement('div');
      choices.className = 'balloon-modes';
      choices.setAttribute('role', 'group');
      choices.setAttribute('aria-label', 'Choose how to play with balloons');
      this.modeButtons = ['pop', 'pump'].map(mode => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'balloon-mode';
        button.setAttribute('aria-label', mode === 'pop' ? 'Pop balloons' : 'Pump and release balloons');
        button.setAttribute('aria-pressed', String(mode === this.mode));
        button.innerHTML = ns.BalloonPlayArt?.modeIcon?.(mode) || '';
        button.addEventListener('click', () => this.setMode(mode));
        choices.appendChild(button); return button;
      });
      this.root.appendChild(choices);
    }

    setMode(mode) {
      if (!this.alive || !this.chooseMode || !['pop', 'pump'].includes(mode) || mode === this.mode) return false;
      this.pumpCue?.destroy(); this.pumpCue = null;
      for (const timer of this.timers) clearTimeout(timer);
      this.timers.clear();
      this.mode = mode;
      this.root.classList.toggle('is-pump-play', mode === 'pump');
      this.modeButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(['pop', 'pump'][i] === mode)));
      // Change the action, not the child's three familiar letters.
      for (let slot = 0; slot < 3; slot += 1) this.add(slot, this.slotItems[slot]);
      if (mode === 'pump' && !this.pumpShown) {
        this.pumpShown = true;
        this.pumpCue = ns.LettersActionCue?.mount?.({ host:this.root, source:this.slots[0].querySelector('.balloon-pump-handle'), type:'tap', automatic:true, reducedMotion:()=>this.reduced });
      }
      this.ctx.sfx?.('page');
      return true;
    }

    add(slot, retainedItem) {
      if (!this.alive || !this.letters.length || !this.root) return;
      const previous = this.slots[slot];
      previous?.remove?.();
      const item = retainedItem || this.letters[this.index++ % this.letters.length];
      this.slotItems[slot] = item;
      this.inflation[slot] = 0;
      const color = retainedItem ? this.slotColors[slot] : COLORS[(this.index + slot - 1) % COLORS.length];
      this.slotColors[slot] = color;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "balloon";
      button.setAttribute("aria-label", `Pop the ${item.display} balloon`);
      button.setAttribute("data-slot", String(slot));
      button.style.gridColumn = String(slot + 1);
      button.style.gridRow = this.chooseMode ? "2" : "1";
      button.innerHTML = ns.BalloonPlayArt?.balloon?.(color, item.display)
        || ns.BalloonPlayArt?.classic?.(color, item.display) || "";
      button.addEventListener("click", () => this.mode === 'pump' ? this.pump(button, item, slot) : this.pop(button, item, slot));
      this.slots[slot] = button;
      if (this.mode === 'pump') this.drawPump(button, item, slot);
      this.root.appendChild(button);
      this.fitGlyphs();
    }

    drawPump(button, item, slot) {
      const air = this.inflation[slot];
      button.setAttribute('aria-label', air < 3 ? `Pump the ${item.display} balloon, ${air} of 3 pumps` : `Release the ${item.display} balloon`);
      button.setAttribute('data-air', String(air));
      button.innerHTML = ns.BalloonPlayArt?.pump?.(this.slotColors[slot], item.display, air) || '';
      this.fitGlyphs();
    }

    pump(button, item, slot) {
      if (!this.alive || this.mode !== 'pump' || this.slots[slot] !== button || button.disabled) return false;
      this.pumpCue?.destroy(); this.pumpCue = null;
      if (this.inflation[slot] === 3) {
        button.classList.add('is-released');
        this.ctx.sfx?.('page'); this.ctx.pet?.cheer?.();
        this.replaceAfter(button, slot, this.reduced ? 180 : 650);
        return true;
      }
      this.inflation[slot] += 1;
      const changedLetter = this.latestSelectedItem !== item;
      this.latestSelectedItem = item;
      this.drawPump(button, item, slot);
      this.ctx.sfx?.('blob');
      // One name at the first pump, with the same replay control as pop play.
      if (this.inflation[slot] === 1 || changedLetter) this.requestSpeech(item);
      return true;
    }

    fitGlyphs() {
      if (!this.alive) return;
      ns.LettersArt?.fitGlyphs?.(this.root || this.ctx.stage);
    }

    pop(button, item, slot) {
      if (!this.alive || this.slots[slot] !== button || button.classList.contains("is-popped")) return;
      button.classList.add("is-popped");
      this.latestSelectedItem = item;
      this.ctx.sfx?.("pop");
      this.ctx.pet?.cheer?.();
      this.requestSpeech(item);
      this.replaceAfter(button, slot, this.reduced ? 180 : 360);
    }

    replaceAfter(button, slot, delay) {
      const restoreFocus = typeof document !== "undefined" && document.activeElement === button
        && !!button.matches?.(":focus-visible");
      button.disabled = true;
      const timer = setTimeout(() => {
        this.timers.delete(timer);
        if (!this.alive || this.slots[slot] !== button) return;
        button.remove();
        this.add(slot);
        const active = typeof document !== "undefined" ? document.activeElement : null;
        if (restoreFocus && (active === button || active === document.body || active == null)) this.slots[slot]?.focus?.();
      }, delay);
      this.timers.add(timer);
    }

    requestSpeech(item) {
      if (!this.alive || !item) return;
      if (this.speechBusy) { this.queuedItem = item; return; }
      this.speechBusy = true;
      this.latestSelectedItem = item;
      this.ctx.prompt?.(item);
      const token = ++this.speechToken;
      let result;
      try { result = this.ctx.say?.(item); } catch { result = false; }
      if (!result || typeof result.then !== "function") {
        this.settleSpeech(token);
        return;
      }
      this.speechTimer = setTimeout(() => this.settleSpeech(token), 6000);
      Promise.resolve(result).then(() => this.settleSpeech(token), () => this.settleSpeech(token));
    }

    settleSpeech(token) {
      if (!this.alive || !this.speechBusy || token !== this.speechToken) return;
      if (this.speechTimer !== null) clearTimeout(this.speechTimer);
      this.speechTimer = null;
      this.speechBusy = false;
      const next = this.queuedItem;
      this.queuedItem = null;
      if (next) this.requestSpeech(next);
    }

    replayPrompt() {
      if (this.alive && this.latestSelectedItem) this.requestSpeech(this.latestSelectedItem);
    }

    destroy() {
      if (!this.alive) return;
      this.alive = false;
      this.pumpCue?.destroy(); this.pumpCue = null;
      this.observer?.disconnect?.();
      this.observer = null;
      for (const timer of this.timers) clearTimeout(timer);
      this.timers.clear();
      if (this.speechTimer !== null) clearTimeout(this.speechTimer);
      this.speechTimer = null;
      this.queuedItem = null;
      this.speechBusy = false;
      this.speechToken += 1;
      this.slots.forEach(button => button?.remove?.());
      this.slots = [];
    }
  }

  LetterBalloons.taughtItems = taughtItems;
  ns.GardenPractice = ns.GardenPractice || {};
  ns.GardenPractice.LetterBalloons = LetterBalloons;
})(window.MiftahGame || (window.MiftahGame = {}));
