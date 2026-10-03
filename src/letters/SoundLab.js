// Sound Lab (v11, 2026-10-02): the blend machine as a free-play toy. Any
// letter the child knows + any mark their finished chapters have taught →
// the machine hums, presses out the syllable and says it. Pure exploration:
// nothing is reported, nothing is scored, nothing can be wrong. Recent sounds
// collect on a strip to play again.
(function (ns) {
  const INK = "#4a3620";
  const MARK_NAMES = { "َ": "fatha", "ِ": "kasra", "ُ": "damma", "ْ": "sukoon", "ً": "tanween fath", "ٍ": "tanween kasr", "ٌ": "tanween damm", "ّ": "shadda" };
  const machine = `<svg class="lab-machine" viewBox="0 0 320 210" aria-hidden="true">
    <ellipse cx="160" cy="202" rx="130" ry="7" fill="#2f5c46" opacity=".18"/>
    <path d="M40 70H280V180Q280 196 264 196H56Q40 196 40 180Z" fill="#62cdf4" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M52 82H268V120H52Z" fill="#ccfbef" stroke="${INK}" stroke-width="3"/>
    <path d="M70 70L100 30H140L150 70M250 70L220 30H180L170 70" fill="#f3c955" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <g class="lab-gear" transform="translate(160 158)"><circle r="20" fill="#c69434" stroke="${INK}" stroke-width="3"/>${[0, 45, 90, 135].map((a) => `<path d="M-4-26H4V26H-4Z" fill="#c69434" stroke="${INK}" stroke-width="2.4" transform="rotate(${a})"/>`).join("")}<circle r="8" fill="#ffe49a" stroke="${INK}" stroke-width="2.4"/></g>
    <path d="M100 196V206M220 196V206" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
  </svg>`;

  class SoundLab {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      this.letters = (ctx.items || []).filter((i) => i?.display && [...i.display].length === 1);
      this.marks = (ctx.marks || []).filter((m) => MARK_NAMES[m]);
      this.letter = null;
      this.mark = null;
      this.made = [];
      ctx.stage.innerHTML = `<div class="lab">
        <div class="lab-strip" aria-label="Sounds you made"></div>
        <div class="lab-bench">
          <button type="button" class="lab-slot is-letter" aria-label="Letter slot"></button>
          <span class="lab-plus" aria-hidden="true">+</span>
          <button type="button" class="lab-slot is-mark" aria-label="Mark slot"></button>
        </div>
        <div class="lab-press">${machine}<button type="button" class="lab-out" aria-label="Play the sound again" hidden></button></div>
        <div class="lab-tray lab-marks" role="group" aria-label="Marks">${this.marks.map((m) => `<button type="button" class="lab-tile is-mark" data-mark="${m}" aria-label="${MARK_NAMES[m]}">ـ${m}</button>`).join("")}</div>
        <div class="lab-tray lab-letters" role="group" aria-label="Letters">${this.letters.map((l, i) => `<button type="button" class="lab-tile" data-letter="${i}" aria-label="${l.display}">${l.display}</button>`).join("")}</div>
      </div>`;
      const $ = (sel) => ctx.stage.querySelector(sel);
      this.slotLetter = $(".lab-slot.is-letter");
      this.slotMark = $(".lab-slot.is-mark");
      this.out = $(".lab-out");
      this.strip = $(".lab-strip");
      this.press = $(".lab-press");
      ctx.stage.querySelectorAll(".lab-tile[data-letter]").forEach((b) => b.addEventListener("click", () => this.pickLetter(this.letters[Number(b.dataset.letter)], b)));
      ctx.stage.querySelectorAll(".lab-tile[data-mark]").forEach((b) => b.addEventListener("click", () => this.pickMark(b.dataset.mark, b)));
      this.slotLetter.addEventListener("click", () => { if (this.letter) this.ctx.say?.(this.letter); });
      this.out.addEventListener("click", () => this.current && this.ctx.say?.(this.current));
      ctx.prompt?.(null);
    }

    pickLetter(letter, button) {
      if (!this.alive || !letter) return;
      this.letter = letter;
      this.slotLetter.textContent = letter.display;
      this.slotLetter.classList.add("is-full");
      this.ctx.sfx?.("click");
      this.ctx.say?.(letter);
      this.bump(button);
      this.tryMake();
    }

    pickMark(mark, button) {
      if (!this.alive) return;
      this.mark = mark;
      this.slotMark.textContent = `ـ${mark}`;
      this.slotMark.classList.add("is-full");
      this.ctx.sfx?.("click");
      this.bump(button);
      this.tryMake();
    }

    bump(button) {
      if (this.ctx.reducedMotion?.()) return;
      button?.animate?.([{ transform: "none" }, { transform: "translateY(-6px) scale(1.08)" }, { transform: "none" }], { duration: 260 });
    }

    tryMake() {
      if (!this.letter || !this.mark || this.busy) return;
      this.busy = true;
      const display = this.letter.display + this.mark;
      const item = { id: display, display, speak: display };
      this.press.classList.remove("is-running"); void this.press.offsetWidth; this.press.classList.add("is-running");
      this.ctx.sfx?.("turn");
      setTimeout(() => {
        if (!this.alive) return;
        this.busy = false;
        this.current = item;
        this.out.hidden = false;
        // The pressed-out sound is a little garden sign: its ink is measured and
        // centred, so harakat below or above never fall off the card.
        const sign = ns.LettersArt?.letterSign;
        if (sign) this.out.innerHTML = sign({ hue: 150, label: display, size: 120 }); else this.out.textContent = display;
        ns.LettersArt?.fitGlyphs?.(this.out);
        this.out.classList.remove("is-new"); void this.out.offsetWidth; this.out.classList.add("is-new");
        this.ctx.sfx?.("pop");
        this.ctx.say?.(item);
        this.ctx.pet?.cheer?.();
        if (!this.made.some((m) => m.display === display)) {
          this.made = [item, ...this.made].slice(0, 8);
          this.strip.innerHTML = this.made.map((m, i) => `<button type="button" class="lab-made" data-made="${i}" aria-label="Play ${m.display}">${m.display}</button>`).join("");
          this.strip.querySelectorAll(".lab-made").forEach((b) => b.addEventListener("click", () => this.ctx.say?.(this.made[Number(b.dataset.made)])));
        }
        // Keep the letter; let the child try another mark on it right away.
        this.mark = null;
        this.slotMark.textContent = "";
        this.slotMark.classList.remove("is-full");
      }, this.ctx.reducedMotion?.() ? 0 : 650);
    }

    replayPrompt() { if (this.current) this.ctx.say?.(this.current); }
    destroy() { this.alive = false; }
  }

  SoundLab.MARK_NAMES = MARK_NAMES;
  ns.GardenPractice = ns.GardenPractice || {};
  ns.GardenPractice.SoundLab = SoundLab;
})(window.MiftahGame || (window.MiftahGame = {}));
