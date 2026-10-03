// The Picture-Book Games (v27, 2026-10-02). Five games, each one a thing
// picture books do that the garden didn't:
//
//   PeekFlaps    lift-the-flap (Where's Spot?): hear a word, lift the flap
//                wearing the letter it starts with — a surprise every time.
//   SoundSort    the classic phonics sort: pictures go in the basket of the
//                letter their name starts with.
//   HoopoeTrip   a cumulative tale (The House That Jack Built): the hoopoe
//                gathers a friend on every page and the refrain grows.
//   FriendShapes the friend is missing its body — which letter is it?
//   BusyMarket   a busy page (Richard Scarry): a letter lens finds every
//                thing on the stalls whose name starts with it. Free play.
//
// Honesty is the same everywhere in the garden: a word that was HEARD and
// answered with a plain letter is independent listening; anything with a
// picture or friend that shows the letter is supported matching; any round
// after a miss is assisted. Exploring (Busy Market, flap peeks) reports
// nothing. All association evidence is the "friend" skill (letter ↔ picture
// ↔ sound), which the Brain reads. Nothing fails; a miss only wobbles.
(function (ns) {
  const INK = "#4a3620";
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const F = () => ns.LetterFriends;
  const P = () => ns.PictureWords;
  const letterItems = (ctx) => [...new Map([...(ctx.items || []), ...(ctx.known || [])].filter((i) => i?.display && F()?.FRIENDS?.[i.display]).map((i) => [i.display, i])).values()];

  // Shared plumbing: timers that die with the game, speech that remembers
  // whether it was heard, progress dots, and the one honest report.
  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.timers = [];
      ctx.stage.innerHTML = `<div class="bk ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
    }
    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); return t; }
    say(item) {
      let r;
      try { r = this.ctx.say?.(item); } catch { r = false; }
      if (r?.then) r.then((heard) => { if (heard === true) this.heard = true; }, () => {});
      else if (r === true) this.heard = true;
      return r;
    }
    dots(n, at) { return `<div class="bk-progress" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < at ? "is-done" : i === at ? "is-on" : ""}"></i>`).join("")}</div>`; }
    // Each new question is a new learning round, even when the answer is the
    // same letter as last time (two pictures for one basket).
    begin(target) { this.ctx.beginRound?.({ id: target, display: target }); }
    report(target, chosen, offered, { listening = false } = {}) {
      const correct = chosen === target;
      const independent = listening && !this.missed && this.heard;
      this.ctx.reportOutcome?.({ item: { id: target, display: target }, itemId: target, activity: this.constructor.name, skill: "friend", correct,
        evidence: independent ? "independent_listening" : "supported_visible_matching", assisted: !!this.missed,
        selectedId: chosen, choiceIds: offered, affectsStrength: true });
      return correct;
    }
    wobble(el) { if (!this.ctx.reducedMotion?.()) el?.animate?.([{ transform: "rotate(0)" }, { transform: "rotate(-6deg)" }, { transform: "rotate(6deg)" }, { transform: "rotate(0)" }], { duration: 360 }); }
    cheer(el) { this.ctx.correct?.(); this.ctx.confettiAt?.(el); this.ctx.pet?.cheer?.(); }
    replayPrompt() {}
    destroy() { this.alive = false; this.timers.forEach(clearTimeout); }
  }

  // ---------- Peekaboo Flaps ----------
  const FLAP = (i) => `<svg class="bk-flap-door" viewBox="0 0 100 110" aria-hidden="true"><path d="M8 104V30Q8 6 50 6Q92 6 92 30V104Z" fill="${["#7fce54", "#b7e779", "#4e9677", "#7fce54"][i % 4]}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M22 34Q30 22 40 30M58 24Q68 18 76 28M30 62Q38 52 48 60M60 70Q70 62 78 72" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/></svg>`;

  class PeekFlaps extends Base {
    constructor(ctx) {
      super(ctx, "bk-flaps", "Peekaboo flaps");
      this.letters = letterItems(ctx);
      this.rounds = 4; this.round = 0;
      if (this.letters.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    // What hides behind a letter: one of its pictures, or else its friend.
    hider(char) {
      const pics = P()?.byChar(char) || [];
      if (pics.length) { const p = pics[Math.floor(Math.random() * pics.length)]; return { item: P().item(p), art: P().art(p, 84) }; }
      return { item: F().item(char), art: F().art(char, { size: 84 }) };
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      this.busy = false; this.missed = false; this.heard = false;
      const n = Math.min(this.ctx.beginner ? 3 : 4, this.letters.length);
      const pool = this.round < this.letters.length ? this.letters : shuffle(this.letters);
      const target = (this.ctx.items || []).filter((i) => F()?.FRIENDS?.[i.display])[this.round % Math.max(1, (this.ctx.items || []).length)] || pool[this.round % pool.length];
      this.offered = shuffle([target, ...shuffle(this.letters.filter((l) => l.display !== target.display)).slice(0, n - 1)]);
      this.target = target.display;
      this.hidden = this.offered.map((l) => this.hider(l.display));
      this.word = this.hidden[this.offered.indexOf(target)].item;
      this.begin(this.target);
      this.listening = this.ctx.canListen?.() !== false;
      this.root.innerHTML = `
        ${this.listening ? "" : `<div class="bk-ask"><span class="bk-pic">${this.hidden[this.offered.indexOf(target)].art}</span></div>`}
        <div class="bk-hedge">${this.offered.map((l, i) => `<button type="button" class="bk-flap" data-i="${i}" aria-label="Flap ${l.display}"><span class="bk-behind" aria-hidden="true">${this.hidden[i].art}</span><span class="bk-door">${FLAP(i)}<span class="bk-door-letter">${F().art(l.display, { size: 64, mode: "plain" })}</span></span></button>`).join("")}</div>
        ${this.dots(this.rounds, this.round)}`;
      this.root.querySelectorAll(".bk-flap").forEach((b) => b.addEventListener("click", () => this.lift(Number(b.dataset.i), b)));
      this.later(() => this.say(this.word), 300);
    }
    replayPrompt() { if (this.word) this.say(this.word); }
    lift(i, flap) {
      if (this.busy || flap.classList.contains("is-open")) return;
      const chosen = this.offered[i].display;
      const right = this.report(this.target, chosen, this.offered.map((o) => o.display), { listening: this.listening });
      flap.classList.add("is-open");
      this.ctx.sfx?.("creak");
      this.later(() => this.say(this.hidden[i].item), 300);
      if (right) {
        this.busy = true;
        this.later(() => this.cheer(flap), 250);
        this.round += 1;
        this.later(() => this.next(), 2600);
        return;
      }
      // A different friend is behind this one — say hello, close up, try again.
      this.missed = true;
      this.later(() => { flap.classList.remove("is-open"); this.say(this.word); }, 1700);
      this.root.querySelectorAll(".bk-flap").forEach((b, k) => b.classList.toggle("is-hint", this.offered[k].display === this.target));
    }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 700); }
  }

  // ---------- Sound Sort ----------
  const BASKET = `<svg class="bk-basket-art" viewBox="0 0 120 70" aria-hidden="true"><path d="M8 18H112L100 66H20Z" fill="#c69434" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M14 32H106M18 48H102M40 18L44 66M80 18L76 66" stroke="#70501b" stroke-width="2.4"/><path d="M4 18H116" stroke="${INK}" stroke-width="6" stroke-linecap="round"/></svg>`;

  class SoundSort extends Base {
    constructor(ctx) {
      super(ctx, "bk-sort", "Sort the pictures");
      const known = letterItems(ctx).map((l) => l.display);
      const withPics = known.filter((c) => (P()?.byChar(c) || []).length);
      // Prefer the walk's letters, then any letter that has pictures.
      const want = (ctx.items || []).map((i) => i.display).filter((c) => withPics.includes(c));
      const policy = ns.LettersLearning?.profile?.({ id: want[0] || withPics[0], display: want[0] || withPics[0] }, { skill: "friend", beginner: ctx.beginner }) || { tier: 0, choiceCount: 2 };
      const n = Math.min(policy.choiceCount >= 3 ? 3 : 2, withPics.length);
      this.baskets = [...new Set([...want, ...shuffle(withPics)])].slice(0, n);
      // At first the baskets wear their friends (support); later, plain letters.
      this.plain = (policy.tier || 0) >= 1;
      const friendWords = new Set(this.baskets.map((c) => F().get(c).word));
      this.cards = shuffle(this.baskets.flatMap((c) => shuffle(P().byChar(c).filter((p) => this.plain || !friendWords.has(p.word))).slice(0, 2)));
      if (this.cards.length < 2 || this.baskets.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.at = 0;
      this.root.innerHTML = `<div class="bk-card-slot"></div><div class="bk-baskets">${this.baskets.map((c, i) => `<button type="button" class="bk-basket" data-i="${i}" aria-label="Basket ${c}"><span class="bk-basket-label">${F().art(c, { size: 74, mode: this.plain ? "plain" : "full" })}</span>${BASKET}<span class="bk-basket-in" aria-hidden="true"></span></button>`).join("")}</div><div class="bk-dots-slot"></div>`;
      this.slot = this.root.querySelector(".bk-card-slot");
      this.root.querySelectorAll(".bk-basket").forEach((b) => b.addEventListener("click", () => this.drop(Number(b.dataset.i), b)));
      this.deal();
    }
    deal() {
      if (this.at >= this.cards.length) return this.finish();
      this.busy = false; this.missed = false; this.heard = false;
      this.card = this.cards[this.at];
      this.begin(this.card.char);
      this.slot.innerHTML = `<button type="button" class="bk-card" aria-label="Hear the picture's name">${P().art(this.card, 110)}</button>`;
      this.slot.firstElementChild.onclick = () => this.say(P().item(this.card));
      this.root.querySelector(".bk-dots-slot").innerHTML = this.dots(this.cards.length, this.at);
      this.root.querySelectorAll(".bk-basket").forEach((b) => b.classList.remove("is-hint"));
      this.later(() => this.say(P().item(this.card)), 250);
    }
    replayPrompt() { if (this.card) this.say(P().item(this.card)); }
    drop(i, basket) {
      if (this.busy || !this.card) return;
      const chosen = this.baskets[i];
      const right = this.report(this.card.char, chosen, this.baskets, { listening: this.plain });
      if (!right) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(basket);
        this.root.querySelectorAll(".bk-basket").forEach((b, k) => b.classList.toggle("is-hint", this.baskets[k] === this.card.char));
        this.later(() => this.say(P().item(this.card)), 450);
        return;
      }
      this.busy = true;
      const card = this.slot.firstElementChild;
      const a = card.getBoundingClientRect?.(), b = basket.getBoundingClientRect?.();
      if (a && b && !this.ctx.reducedMotion?.()) card.animate?.([{ transform: "none" }, { transform: `translate(${b.left + b.width / 2 - a.left - a.width / 2}px, ${b.top - a.top}px) scale(.4)`, opacity: 0.2 }], { duration: 520, easing: "ease-in", fill: "forwards" });
      this.later(() => {
        basket.querySelector(".bk-basket-in").insertAdjacentHTML("beforeend", `<i>${P().art(this.card, 34)}</i>`);
        this.cheer(basket); this.ctx.sfx?.("drop");
        this.say(P().item(this.card));
      }, this.ctx.reducedMotion?.() ? 0 : 520);
      this.at += 1;
      this.later(() => this.deal(), 2000);
    }
    finish() { this.card = null; this.busy = true; this.slot.innerHTML = ""; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 900); }
  }

  // ---------- The Hoopoe's Trip ----------
  class HoopoeTrip extends Base {
    constructor(ctx) {
      super(ctx, "bk-trip", "The hoopoe's trip");
      const known = letterItems(ctx).filter((l) => l.display !== "ه");
      const firsts = (ctx.items || []).map((i) => i.display).filter((c) => c !== "ه" && known.some((k) => k.display === c));
      this.stops = [...new Set([...firsts, ...shuffle(known.map((k) => k.display))])].slice(0, ctx.beginner ? 3 : 4);
      this.parade = ["ه"];
      this.page = 0;
      if (this.stops.length < 1 || known.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.known = known.map((k) => k.display);
      this.show();
    }
    paradeHTML() { return `<div class="bk-parade" aria-label="Friends on the trip">${this.parade.map((c, i) => `<span class="bk-walker" style="--i:${i}">${F().art(c, { size: i ? 64 : 76 })}</span>`).join("")}</div>`; }
    show() {
      if (this.page >= this.stops.length) return this.home();
      this.busy = false; this.missed = false;
      const target = this.stops[this.page];
      const n = Math.min(this.ctx.beginner ? 2 : 3, this.known.length);
      this.offered = shuffle([target, ...shuffle(this.known.filter((c) => c !== target && !this.parade.includes(c))).slice(0, n - 1)]);
      this.begin(target);
      this.root.innerHTML = `${this.paradeHTML()}
        <div class="bk-sign"><svg viewBox="0 0 120 120" aria-hidden="true"><path d="M56 60V116" stroke="#70501b" stroke-width="8" stroke-linecap="round"/><path d="M14 16H106V64H14Z" fill="#fffaf0" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></svg><span>${F().art(target, { size: 62, mode: "plain" })}</span></div>
        <div class="bk-waiting">${this.offered.map((c, i) => `<button type="button" class="bk-friend" data-i="${i}" aria-label="${F().get(c).en}">${F().art(c, { size: 96 })}</button>`).join("")}</div>
        ${this.dots(this.stops.length, this.page)}`;
      this.root.querySelectorAll(".bk-friend").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      this.say({ id: target, display: target, speak: ns.LETTERS_DATA?.packs?.flatMap((p) => p.letters).find((l) => l.char === target)?.arName || target });
    }
    pick(i, btn) {
      if (this.busy) return;
      const target = this.stops[this.page], chosen = this.offered[i];
      if (!this.report(target, chosen, this.offered)) {
        this.missed = true; this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".bk-friend").forEach((b, k) => b.classList.toggle("is-hint", this.offered[k] === target));
        return;
      }
      this.busy = true;
      this.cheer(btn);
      this.ctx.sfx?.(F().get(target).call);
      this.parade.push(target);
      this.root.querySelector(".bk-parade").outerHTML = this.paradeHTML();
      this.root.querySelector(".bk-walker:last-child")?.classList.add("is-new");
      // The refrain grows: every friend so far, newest first, like the tale.
      this.refrain([...this.parade].reverse().slice(0, 5));
      this.page += 1;
    }
    async refrain(chars) {
      await new Promise((ok) => this.later(ok, 500));
      for (const c of chars) {
        if (!this.alive) return;
        const el = [...this.root.querySelectorAll(".bk-walker")][this.parade.indexOf(c)];
        el?.classList.add("is-saying");
        await this.ctx.say?.(F().item(c));
        el?.classList.remove("is-saying");
      }
      this.later(() => this.show(), 500);
    }
    home() {
      this.root.innerHTML = `${this.paradeHTML()}<div class="bk-home" aria-hidden="true"><svg viewBox="0 0 160 120"><path d="M20 112V58L80 18L140 58V112Z" fill="#ffa798" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M64 112V78H96V112" fill="#c25a49" stroke="${INK}" stroke-width="3"/><path d="M8 62L80 10L152 62" fill="none" stroke="#c25a49" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`;
      this.root.classList.add("is-home");
      this.ctx.sfx?.("cheer2"); this.ctx.pet?.cheer?.();
      this.later(() => this.ctx.done?.(), 2600);
    }
  }

  // ---------- Friend Shapes ----------
  class FriendShapes extends Base {
    constructor(ctx) {
      super(ctx, "bk-shapes", "Friend shapes");
      this.letters = letterItems(ctx).map((l) => l.display);
      this.order = [...new Set([...(ctx.items || []).map((i) => i.display).filter((c) => this.letters.includes(c)), ...shuffle(this.letters)])];
      this.rounds = Math.min(4, this.order.length); this.round = 0;
      if (this.letters.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.rounds) return this.finish();
      this.busy = false; this.missed = false;
      const target = this.order[this.round];
      const n = Math.min(this.ctx.beginner ? 2 : 3, this.letters.length);
      this.offered = shuffle([target, ...shuffle(this.letters.filter((c) => c !== target)).slice(0, n - 1)]);
      this.target = target;
      this.begin(target);
      this.root.innerHTML = `<div class="bk-missing"><span class="bk-missing-friend">${F().art(target, { size: 190 }).replace('class="lf"', 'class="lf is-bodiless"')}</span></div>
        <div class="bk-pieces">${this.offered.map((c, i) => `<button type="button" class="bk-piece" data-i="${i}" aria-label="${c}">${F().art(c, { size: 96, mode: "plain" })}</button>`).join("")}</div>
        ${this.dots(this.rounds, this.round)}`;
      this.root.querySelectorAll(".bk-piece").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      this.ctx.sfx?.(F().get(target).call);
    }
    pick(i, btn) {
      if (this.busy) return;
      const chosen = this.offered[i];
      if (!this.report(this.target, chosen, this.offered)) {
        this.missed = true; this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".bk-piece").forEach((b, k) => b.classList.toggle("is-hint", this.offered[k] === this.target));
        return;
      }
      this.busy = true;
      btn.classList.add("is-used");
      this.root.querySelector(".lf.is-bodiless")?.classList.replace("is-bodiless", "is-whole");
      this.later(() => { this.cheer(this.root.querySelector(".bk-missing")); this.ctx.sfx?.(F().get(this.target).call); }, 300);
      this.later(() => this.ctx.say?.(F().item(this.target)), 900);
      this.round += 1;
      this.later(() => this.next(), 2600);
    }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 700); }
  }

  // ---------- Busy Market (free play) ----------
  const STALLS = `<svg class="bk-stalls" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 230H400V300H0Z" fill="#e5dcc8"/>
    ${[0, 1, 2].map((k) => { const x = 10 + k * 132; return `<path d="M${x} 40H${x + 116}V226H${x}Z" fill="#fffaf0"/><path d="M${x - 4} 40L${x + 12} 12H${x + 104}L${x + 120} 40Z" fill="${["#ee806f", "#62cdf4", "#7fce54"][k]}"/><path d="M${x} 100H${x + 116}M${x} 164H${x + 116}" stroke="#c9bda4" stroke-width="4"/>`; }).join("")}
  </svg>`;

  class BusyMarket extends Base {
    constructor(ctx) {
      super(ctx, "bk-market", "Busy market");
      const known = letterItems(ctx).map((l) => l.display);
      // Lenses are known letters that have pictures; the stalls also sell
      // things for other letters, so there is something to tell apart.
      this.lenses = shuffle(known.filter((c) => (P()?.byChar(c) || []).length)).slice(0, 3);
      if (!this.lenses.length) { this.later(() => ctx.done?.(), 300); return; }
      const goods = new Map();
      for (const c of this.lenses) for (const p of P().byChar(c)) goods.set(p.id, p);
      for (const p of shuffle(P().LIST)) { if (goods.size >= (ctx.beginner ? 6 : 12)) break; goods.set(p.id, p); }
      this.goods = shuffle([...goods.values()]);
      this.lens = 0;
      this.found = new Set();
      const slots = this.goods.map((_, i) => ({ x: 6 + (i % 3) * 33 + (i % 2 ? 7 : 2), y: 8 + Math.floor(i / 3) * 22 }));
      this.root.innerHTML = `<div class="bk-lens-row"><button type="button" class="bk-lens" aria-label="Change the letter lens"></button><span class="bk-bag" aria-label="Found"></span></div>
        <div class="bk-scene">${STALLS}${this.goods.map((p, i) => `<button type="button" class="bk-good" data-i="${i}" style="left:${slots[i].x}%;top:${slots[i].y}%" aria-label="${p.en}">${P().art(p, 58)}</button>`).join("")}</div>`;
      this.lensBtn = this.root.querySelector(".bk-lens");
      this.bag = this.root.querySelector(".bk-bag");
      this.lensBtn.onclick = () => this.nextLens(true);
      this.root.querySelectorAll(".bk-good").forEach((b) => b.addEventListener("click", () => this.tap(Number(b.dataset.i), b)));
      this.showLens();
    }
    showLens() {
      const c = this.lenses[this.lens];
      this.lensBtn.innerHTML = `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="52" cy="52" r="40" fill="#ccfbef" stroke="${INK}" stroke-width="6"/><path d="M82 82L110 110" stroke="#70501b" stroke-width="12" stroke-linecap="round" data-ribbon/></svg><span>${F().art(c, { size: 56, mode: F().look(ns.gardenBrain?.skills(c).friend) })}</span>`;
      this.bag.innerHTML = "";
      this.ctx.say?.({ id: c, display: c, speak: ns.LETTERS_DATA?.packs?.flatMap((p) => p.letters).find((l) => l.char === c)?.arName || c });
    }
    nextLens(manual) {
      this.lens = (this.lens + 1) % this.lenses.length;
      if (!manual) this.done = (this.done || 0) + 1;
      this.ctx.sfx?.("click");
      this.showLens();
    }
    tap(i, btn) {
      const p = this.goods[i], c = this.lenses[this.lens];
      this.ctx.say?.(P().item(p));
      if (p.char !== c || this.found.has(p.id)) { this.wobble(btn); return; }
      this.found.add(p.id);
      btn.classList.add("is-found");
      this.bag.insertAdjacentHTML("beforeend", `<i>${P().art(p, 34)}</i>`);
      this.ctx.sfx?.("pop"); this.ctx.confettiAt?.(btn);
      const left = this.goods.filter((g) => g.char === c && !this.found.has(g.id)).length;
      if (!left) {
        this.ctx.pet?.cheer?.();
        if ((this.done || 0) + 1 >= this.lenses.length) { this.later(() => { this.ctx.sfx?.("cheer2"); this.ctx.done?.(); }, 1400); return; }
        this.later(() => this.nextLens(false), 1400);
      }
    }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { PeekFlaps, SoundSort, HoopoeTrip, FriendShapes, BusyMarket });
  ns.BookGames = { KINDS: ["PeekFlaps", "SoundSort", "HoopoeTrip", "FriendShapes", "BusyMarket"] };
})(window.MiftahGame || (window.MiftahGame = {}));
