// Living Books (v29, 2026-10-02): picture books that read themselves, and
// grow with the child.
//
// What books teach that games don't, built in:
//   • read-along — every word lights up as it is spoken, one at a time, so the
//     child sees that speech is made of words and print runs right to left
//     (concept of word); any word can be tapped to hear it again;
//   • predictable refrains — the same line on every page ("أَيْنَ بَطَّة؟"), and
//     from the third page the book pauses before the refrain's last word and
//     waits for the child to tap its picture (the "completion" prompt from
//     dialogic reading). It carries on by itself after a while: nothing fails;
//   • lift-the-flap and guess-who pages;
//   • words the child can really decode — every letter and mark taught by a
//     finished chapter (the same honesty filter as the word chapters) — wear a
//     gold underline. Tapping one waits a breath, glowing, so the child can try
//     it first, and then says it;
//   • the same books again and again: the shelf keeps the child's favourites
//     first, and the walk ends on a bedtime book.
// Starring the child's own letter friends, so each book is about friends they
// know. Reading is presentation: nothing is reported or scored.
(function (ns) {
  const F = () => ns.LetterFriends;
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  // Spoken without punctuation, so a recorded word clip matches its key.
  const bare = (w) => String(w || "").replace(/[؟?.!،]/g, "");
  // Feminine friends take هٰذِهِ: names ending in ta marbuta, and the sun.
  const isFem = (char) => { const w = F()?.get(char)?.word || ""; return w.endsWith("ة") || char === "ش"; };
  const thisIs = (char) => `${isFem(char) ? "هٰذِهِ" : "هٰذَا"} ${F().get(char).word}`;
  const pick = (known, n, avoid = []) => {
    const pool = known.filter((c) => !avoid.includes(c));
    const out = [];
    for (const c of pool) { if (out.length >= n) break; out.push(c); }
    return out;
  };

  // Each book builds its pages from the friends this child knows (falling back
  // to the first friends), so the cast is always familiar.
  //   page: { text, refrain?, complete?: [wordIndex, char], art, reveal? }
  const BOOKS = [
    { id: "where", cover: "ب", title: "أَيْنَ بَطَّة؟", kind: "flap",
      pages(known) {
        const others = pick(known, 3, ["ب"]);
        const refrain = "أَيْنَ بَطَّة؟";
        return [
          ...others.map((c) => ({ text: refrain, complete: [1, "ب"], art: { flap: c }, reveal: `${thisIs(c)}.` })),
          { text: refrain, complete: [1, "ب"], art: { flap: "ب" }, reveal: "هٰذِهِ بَطَّة!" },
        ];
      } },
    { id: "what", cover: "ف", title: "مَا هٰذَا؟", kind: "guess",
      pages(known) {
        return pick(known, 4).map((c) => ({ text: "مَا هٰذَا؟", art: { bodiless: c }, reveal: `${thisIs(c)}.` }));
      } },
    { id: "morning", cover: "ش", title: "صَبَاحُ الْخَيْر", kind: "morning",
      pages(known) {
        return [{ text: "صَبَاحُ الْخَيْرِ يَا شَمْس.", art: { sun: true, friend: "ش" } },
          ...pick(known, 4, ["ش"]).map((c) => ({ text: `صَبَاحُ الْخَيْرِ يَا ${F().get(c).word}.`, complete: [3, c], art: { sun: true, friend: c } }))];
      } },
    { id: "night", cover: "د", title: "لَيْلَة سَعِيدَة", kind: "night", bedtime: true,
      pages(known) {
        return [...pick(known, 4).map((c) => ({ text: `لَيْلَة سَعِيدَة يَا ${F().get(c).word}.`, complete: [3, c], art: { night: true, friend: c } })),
          { text: "لَيْلَة سَعِيدَة يَا قَمَر.", art: { night: true, moon: true } }];
      } },
  ];

  const MOON = () => ns.LettersArt?.stickerMotif?.("moon", 120) || "";
  const SUN_SKY = `<svg class="lb-sky" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H300V200H0Z" fill="#ccfbef"/><path d="M0 150Q80 120 160 140Q240 160 300 130V200H0Z" fill="#b7e779"/></svg>`;
  const NIGHT_SKY = `<svg class="lb-sky" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H300V200H0Z" fill="#4a4d84"/><path d="M0 150Q80 120 160 140Q240 160 300 130V200H0Z" fill="#34375f"/>${[[30, 30], [80, 50], [140, 22], [220, 40], [270, 70], [190, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#ffe49a"/>`).join("")}</svg>`;
  const BUSH = `<svg viewBox="0 0 160 130" aria-hidden="true"><path d="M10 124Q0 80 30 70Q24 30 64 32Q80 4 108 26Q150 24 144 66Q166 92 148 124Z" fill="#7fce54" stroke="#4a3620" stroke-width="4" stroke-linejoin="round"/><path d="M40 90Q50 76 64 86M86 60Q98 48 112 58M100 100Q110 88 124 96" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/></svg>`;

  class LivingBook {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      this.timers = [];
      const known = [...new Set([...(ctx.known || []), ...(ctx.items || [])].map((i) => i?.display).filter((c) => F()?.FRIENDS?.[c]))];
      const cast = known.length >= 4 ? known : [...new Set([...known, "ب", "د", "ق", "ف", "س"])];
      this.book = BOOKS.find((b) => b.id === ctx.bookId) || BOOKS[0];
      this.pages = [{ cover: true, text: this.book.title }, ...this.book.pages(cast)];
      this.at = 0;
      ctx.stage.innerHTML = `<div class="lb lb-book-${this.book.kind}" dir="rtl">
        <div class="lb-page">
          <div class="lb-art"></div>
          <p class="lb-text" aria-live="polite"></p>
        </div>
        <div class="lb-nav">
          <button type="button" class="lg-round-btn lb-next" aria-label="Next page">${ns.LettersArt?.icon?.("next", 28) || "‹"}</button>
          <button type="button" class="lg-round-btn lb-again" aria-label="Read this page again">${ns.LettersArt?.icon?.("speaker", 26) || "♪"}</button>
          <button type="button" class="lg-round-btn lb-prev" aria-label="Previous page">${ns.LettersArt?.icon?.("next", 28) || "›"}</button>
        </div>
      </div>`;
      const $ = (s) => ctx.stage.querySelector(s);
      this.artEl = $(".lb-art"); this.textEl = $(".lb-text");
      $(".lb-next").onclick = () => this.turn(1);
      $(".lb-prev").onclick = () => this.turn(-1);
      $(".lb-again").onclick = () => this.read();
      ctx.prompt?.(null);
      this.show();
    }

    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); }

    art(page) {
      const a = page.art || {};
      if (page.cover) return `<span class="lb-cover">${F().art(this.book.cover, { size: 200 })}</span>`;
      if (a.flap) return `<button type="button" class="lb-flap" aria-label="Look behind the bush"><span class="lb-behind">${F().art(a.flap, { size: 150 })}</span><span class="lb-bush">${BUSH}</span></button>`;
      if (a.bodiless) return `<button type="button" class="lb-guess" aria-label="Who is it?">${F().art(a.bodiless, { size: 190 }).replace('class="lf"', 'class="lf is-bodiless"')}</button>`;
      if (a.moon) return `${NIGHT_SKY}<span class="lb-moon">${MOON()}</span>`;
      return `${a.night ? NIGHT_SKY : SUN_SKY}${a.sun ? `<span class="lb-sun">${ns.LettersArt?.stickerMotif?.("sun", 90) || ""}</span>` : ""}<span class="lb-friend${a.night ? " is-asleep" : ""}">${F().art(a.friend, { size: 160 })}</span>${a.night ? '<span class="lb-zz" aria-hidden="true">z z</span>' : ""}`;
    }

    words(text, complete) {
      return text.split(" ").map((w, i) => {
        const decodable = this.ctx.decodable?.(w) ? " is-decodable" : "";
        const blank = complete && complete[0] === i && this.at >= 3;
        return blank
          ? `<button type="button" class="lb-word lb-blank" data-w="${i}" data-word="${w}" aria-label="Say the friend's name">${F().art(complete[1], { size: 54 })}</button>`
          : `<button type="button" class="lb-word${decodable}" data-w="${i}" data-word="${w}">${w}</button>`;
      }).join(" ");
    }

    show() {
      const page = this.pages[this.at];
      this.token = (this.token || 0) + 1;
      this.revealed = !page.reveal;
      this.artEl.innerHTML = this.art(page);
      this.artEl.className = `lb-art${page.cover ? " is-cover" : ""}`;
      this.textEl.innerHTML = this.words(page.text, page.complete);
      this.ctx.stage.querySelector(".lb-next").disabled = this.at >= this.pages.length - 1;
      this.ctx.stage.querySelector(".lb-prev").disabled = this.at <= 0;
      this.textEl.querySelectorAll(".lb-word").forEach((b) => b.addEventListener("click", () => this.tapWord(b)));
      const opener = this.artEl.querySelector(".lb-flap, .lb-guess");
      opener?.addEventListener("click", () => this.open(opener));
      this.later(() => this.read(), 350);
    }

    // Read the line aloud, one word at a time, lighting each as it is heard.
    async read() {
      const token = (this.token = (this.token || 0) + 1);
      const live = () => this.alive && this.token === token;
      const btns = [...this.textEl.querySelectorAll(".lb-word")];
      for (const b of btns) {
        if (!live()) return;
        if (b.classList.contains("lb-blank") && !b.classList.contains("is-filled")) {
          // The book waits for the child to say the friend (tap its picture);
          // after a while it fills the word in by itself.
          b.classList.add("is-waiting");
          await new Promise((ok) => { this.fill = ok; this.later(ok, 6000); });
          this.fill = null;
          if (!live()) return;
          this.fillBlank(b);
        }
        b.classList.add("is-said");
        await this.ctx.say?.({ id: b.dataset.word, display: b.dataset.word, speak: bare(b.dataset.word) });
        if (!live()) return;
        b.classList.remove("is-said");
        b.classList.add("is-read");
        await wait(90);
      }
      if (live() && this.revealed && this.pages[this.at].reveal) this.readReveal(token);
    }

    fillBlank(b) {
      if (b.classList.contains("is-filled")) return;
      b.classList.add("is-filled");
      b.classList.remove("is-waiting");
      b.textContent = b.dataset.word;
    }

    tapWord(b) {
      if (b.classList.contains("lb-blank") && !b.classList.contains("is-filled")) {
        this.ctx.sfx?.("chime");
        this.ctx.pet?.cheer?.();
        this.fill ? this.fill() : this.fillBlank(b);
        return;
      }
      this.token = (this.token || 0) + 1; // a tap interrupts the reading
      const word = { id: b.dataset.word, display: b.dataset.word, speak: bare(b.dataset.word) };
      if (b.classList.contains("is-decodable")) {
        // A word this child can decode: a breath to try it first.
        b.classList.add("is-trying");
        this.later(() => { b.classList.remove("is-trying"); this.ctx.say?.(word); }, 1500);
      } else this.ctx.say?.(word);
    }

    // Flap or guess pages: the answer appears, with its own line read aloud.
    open(el) {
      if (this.revealed) return;
      this.revealed = true;
      el.classList.add("is-open");
      this.artEl.querySelector(".lf.is-bodiless")?.classList.replace("is-bodiless", "is-whole");
      const char = this.pages[this.at].art.flap || this.pages[this.at].art.bodiless;
      this.ctx.sfx?.(this.pages[this.at].art.flap ? "rustle" : "pop");
      this.later(() => this.ctx.sfx?.(F().get(char).call), 350);
      this.later(() => this.readReveal(this.token = (this.token || 0) + 1), 700);
    }

    async readReveal(token) {
      const page = this.pages[this.at];
      if (this.textEl.querySelector(".lb-reveal")) return;
      this.textEl.insertAdjacentHTML("beforeend", `<span class="lb-reveal">${page.reveal.split(" ").map((w, i) => `<button type="button" class="lb-word${this.ctx.decodable?.(w) ? " is-decodable" : ""}" data-word="${w}">${w}</button>`).join(" ")}</span>`);
      const btns = [...this.textEl.querySelectorAll(".lb-reveal .lb-word")];
      btns.forEach((b) => b.addEventListener("click", () => this.tapWord(b)));
      for (const b of btns) {
        if (!this.alive || this.token !== token) return;
        b.classList.add("is-said");
        await this.ctx.say?.({ id: b.dataset.word, display: b.dataset.word, speak: bare(b.dataset.word) });
        b.classList.remove("is-said"); b.classList.add("is-read");
      }
      if (this.at === this.pages.length - 1 && this.alive) this.end();
    }

    turn(dir) {
      const to = this.at + dir;
      if (!this.alive || to < 0 || to >= this.pages.length) return;
      this.at = to;
      this.ctx.sfx?.("page");
      const page = this.ctx.stage.querySelector(".lb-page");
      if (!this.ctx.reducedMotion?.()) page?.animate?.([{ transform: `translateX(${dir * -30}px) rotateY(${dir * 8}deg)`, opacity: 0.2 }, { transform: "none", opacity: 1 }], { duration: 360, easing: "ease-out" });
      this.show();
      if (this.at === this.pages.length - 1 && !this.pages[this.at].reveal) this.later(() => this.end(), 5200);
    }

    // The last page: the book is read. It counts as a read (for favourites)
    // and closes itself gently; the child can still page back.
    end() {
      if (this.ended) return;
      this.ended = true;
      this.ctx.onRead?.(this.book.id);
      this.ctx.pet?.cheer?.();
      this.later(() => this.ctx.done?.(), 3000);
    }

    replayPrompt() { this.read(); }
    destroy() { this.alive = false; this.token = (this.token || 0) + 1; this.timers.forEach(clearTimeout); }
  }

  LivingBook.BOOKS = BOOKS;
  ns.LivingBooks = { BOOKS, isFem, thisIs };
  ns.GardenPractice = ns.GardenPractice || {};
  ns.GardenPractice.LivingBook = LivingBook;
})(window.MiftahGame || (window.MiftahGame = {}));
