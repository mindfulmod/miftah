// The Letter Friends book (v26, 2026-10-02): an alphabet book, one spread per
// letter, told the way a grown-up reads "B is for ball" — slowly, in order,
// and the same every time (children ask for the same page again and again;
// that repetition is the point).
//
// A spread: the plain letter, which grows into its friend → the letter's
// name → the friend's call → the friend's name, with its first letter lit.
// Tap the friend to hear it all again; turn pages through every friend met.
// The walk ends on one of these pages, like a bedtime book.
//
// Nothing is reported or scored: reading is presentation, not evidence.
(function (ns) {
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));

  class FriendBook {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      const F = ns.LetterFriends;
      const seen = new Map();
      for (const i of [...(ctx.items || []), ...(ctx.known || [])]) if (i?.display && F?.FRIENDS?.[i.display] && !seen.has(i.display)) seen.set(i.display, i);
      this.pages = [...seen.values()];
      this.at = Math.max(0, Math.min(this.pages.length - 1, ctx.startAt || 0));
      this.turns = 0;
      ctx.stage.innerHTML = `<div class="fb" dir="rtl">
        <div class="fb-spread">
          <button type="button" class="fb-friend" aria-label="Hear it again"></button>
          <div class="fb-caption"><span class="fb-letter"></span><span class="fb-word-wrap"><i class="fb-mark" aria-hidden="true"></i><span class="fb-word"></span></span></div>
        </div>
        <div class="fb-nav">
          <button type="button" class="lg-round-btn fb-next" aria-label="Next page">${ns.LettersArt?.icon?.("next", 28) || "‹"}</button>
          <button type="button" class="lg-big-btn fb-close" aria-label="Close the book">${ns.LettersArt?.icon?.("check", 32) || "✓"}</button>
          <button type="button" class="lg-round-btn fb-prev" aria-label="Previous page">${ns.LettersArt?.icon?.("next", 28) || "›"}</button>
        </div>
      </div>`;
      const $ = (s) => ctx.stage.querySelector(s);
      this.friendBtn = $(".fb-friend");
      this.letterEl = $(".fb-letter");
      this.wordEl = $(".fb-word");
      this.mark = $(".fb-mark");
      this.friendBtn.onclick = () => this.tell();
      // RTL book: "next" sits on the left, like turning an Arabic page.
      $(".fb-next").onclick = () => this.turn(1);
      $(".fb-prev").onclick = () => this.turn(-1);
      $(".fb-close").onclick = () => { this.ctx.sfx?.("page"); this.ctx.done?.(); };
      ctx.prompt?.(null);
      if (this.pages.length) this.show(); else ctx.done?.();
    }

    show() {
      const F = ns.LetterFriends;
      const page = this.pages[this.at];
      const char = page.display, friend = F.get(char);
      this.friendBtn.innerHTML = F.art(char, { size: 220, mode: "plain" });
      this.friendBtn.setAttribute("aria-label", `${char}: ${friend.en}. Hear it again`);
      this.letterEl.textContent = char;
      this.wordEl.textContent = friend.word;
      this.mark.style.opacity = "0";
      this.ctx.stage.querySelector(".fb-next").disabled = this.at >= this.pages.length - 1;
      this.ctx.stage.querySelector(".fb-prev").disabled = this.at <= 0;
      this.tell();
    }

    // Light the first letter of the friend's name. Arabic shaping means the
    // first letter can't be its own coloured span (that would break the join),
    // and range rects are unreliable inside shaped text, so the first letter's
    // width is measured as (whole word − word without it) on a canvas, then
    // scaled to the laid-out word. The word reads right to left, so the
    // first letter is at its right edge.
    markFirst() {
      try {
        const word = this.wordEl.textContent;
        let end = 1;
        while (end < word.length && /[ًٌٍَُِّْٰ]/.test(word[end])) end += 1;
        const g = (this.canvas ||= document.createElement("canvas")).getContext("2d");
        g.font = getComputedStyle(this.wordEl).font; g.direction = "rtl";
        const full = g.measureText(word).width, rest = g.measureText(word.slice(end)).width;
        const r = this.wordEl.getBoundingClientRect(), box = this.wordEl.parentElement.getBoundingClientRect();
        if (!full || !r.width) return;
        const w = Math.max(full - rest, full * 0.18) * (r.width / full);
        Object.assign(this.mark.style, { left: `${r.right - box.left - w - 4}px`, width: `${w + 8}px`, opacity: "1" });
      } catch {}
    }

    async tell() {
      if (!this.alive || this.telling) return;
      this.telling = true;
      const token = (this.token = (this.token || 0) + 1);
      const F = ns.LetterFriends;
      const page = this.pages[this.at];
      const svg = this.friendBtn.querySelector("svg.lf");
      const live = () => this.alive && this.token === token;
      try {
        await this.ctx.say?.(page);
        if (!live()) return;
        svg?.classList.remove("is-plain");
        svg?.classList.add("is-growing");
        await wait(this.ctx.reducedMotion?.() ? 100 : 650);
        if (!live()) return;
        this.ctx.sfx?.(F.get(page.display).call);
        await wait(600);
        if (!live()) return;
        this.markFirst();
        await this.ctx.say?.(F.item(page.display));
      } finally {
        if (this.token === token) this.telling = false;
      }
    }

    turn(dir) {
      const to = this.at + dir;
      if (!this.alive || to < 0 || to >= this.pages.length) return;
      this.at = to;
      this.turns += 1;
      this.token = (this.token || 0) + 1;
      this.telling = false;
      this.ctx.sfx?.("page");
      const spread = this.ctx.stage.querySelector(".fb-spread");
      if (!this.ctx.reducedMotion?.()) spread?.animate?.([{ transform: `translateX(${dir * -24}px)`, opacity: 0.2 }, { transform: "none", opacity: 1 }], { duration: 320, easing: "ease-out" });
      this.show();
    }

    replayPrompt() { this.tell(); }
    destroy() { this.alive = false; this.token = (this.token || 0) + 1; }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  ns.GardenPractice.FriendBook = FriendBook;
})(window.MiftahGame || (window.MiftahGame = {}));
