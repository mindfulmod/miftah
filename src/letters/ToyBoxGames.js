// The Toy Box (v42–v47, 2026-10-08): six classic toddler toys, each rebuilt
// around the Letter Friends so playing with the toy IS meeting the letters.
//
//   FriendPairs   (v42) the memory card game: every friend has a twin card —
//                 its own letter. Turn two over; a friend and its letter make
//                 a pair. A quick peek at the start keeps it kind for 2–3s.
//   DotNests      (v43) nests hold dots like eggs. How many dots has this
//                 letter? Pop it into the nest with that many. Older children
//                 then sort by WHERE the dots sit: up in the tree or down on
//                 the ground. The dots are the whole difference between
//                 ب ت ث, so counting and placing them is the core skill.
//   FriendJigsaw  (v44) a friend in two or four pieces; a glowing gap asks
//                 for its piece. Older children also see one piece from a
//                 different friend, so the friend's look must be known.
//   BathTime      (v45) a friend hiding under bubble foam in the tub (was
//                 mud until 2026-10-13). Scrub, and the suds pop away; halfway, "who is in the bath?" — a brave
//                 early guess from part of the letter.
//   LetterFishing (v46) fish swim by carrying letters; hear a letter, catch
//                 its fish. A wrong fish wriggles free and says its own name.
//   ColourFriend  (v47) a colouring page of a friend. Colour its letter body
//                 and it says its name; hang the finished page in the garden.
//
// The house rules hold: nothing is timed, a miss is a soft sound and a hint,
// evidence is honest (memory and puzzle games never claim letter knowledge),
// reduced motion is respected, and Little Sprout gets the gentlest version.
(function (ns) {
  const INK = "#4a3620";
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // Smart Choices (v50): the Garden Brain picks the wrong answers.
  const smart = (target, pool, n, skill, beginner) => (ns.gardenBrain?.others ? ns.gardenBrain.others(target, pool, n, { skill, beginner }) : shuffle(pool.filter((c) => c !== target)).slice(0, n));
  const F = () => ns.LetterFriends;
  const S = () => ns.LettersStrokes;
  const nameOf = (c) => (ns.LETTERS_DATA?.packs || []).flatMap((p) => p.letters).find((l) => l.char === c)?.arName || c;
  const item = (c) => ({ id: c, display: c, speak: nameOf(c) });
  const knownChars = (ctx) => [...new Set([...(ctx.items || []), ...(ctx.known || [])].map((i) => i?.display).filter((c) => F()?.FRIENDS?.[c]))];
  const firstsOf = (ctx, pool) => (ctx.items || []).map((i) => i?.display).filter((c) => pool.includes(c));
  const dotsOf = (c) => (S()?.LETTERS?.[c] || []).filter((s) => s && s.dot).map((s) => s.dot);
  // Where a letter's dots sit: clearly above its body, clearly below, or
  // neither (ج keeps its dot inside the bowl, so it never plays "where").
  const sideOf = (c) => {
    const d = dotsOf(c);
    if (!d.length) return null;
    if (d.every(([, y]) => y < 36)) return "above";
    if (d.every(([, y]) => y > 78)) return "below";
    return null;
  };
  let uid = 0;

  class Base {
    constructor(ctx, cls, label) {
      this.ctx = ctx; this.alive = true; this.timers = [];
      ctx.stage.innerHTML = `<div class="tb ${cls}" role="group" aria-label="${label}"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
    }
    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); return t; }
    dots(n, at) { return `<div class="tb-progress" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < at ? "is-done" : i === at ? "is-on" : ""}"></i>`).join("")}</div>`; }
    still() { return !!this.ctx.reducedMotion?.(); }
    wobble(el) { if (!this.still()) el?.animate?.([{ rotate: "0deg" }, { rotate: "-7deg" }, { rotate: "7deg" }, { rotate: "0deg" }], { duration: 360 }); }
    cheer(el) { this.ctx.correct?.(); this.ctx.confettiAt?.(el); this.ctx.pet?.cheer?.(); }
    say(it) {
      let r;
      try { r = this.ctx.say?.(it); } catch { r = false; }
      if (r?.then) r.then((h) => { if (h === false) this.heard = false; }, () => {});
      return r;
    }
    report(target, chosen, offered, { skill = "letter-name", listening = false, affects = true } = {}) {
      const correct = chosen === target;
      const independent = listening && !this.missed && this.heard !== false;
      this.ctx.reportOutcome?.({ item: item(target), itemId: target, activity: this.constructor.name, skill, correct,
        evidence: independent ? "independent_listening" : "supported_visible_matching", assisted: !!this.missed,
        selectedId: chosen, choiceIds: offered, affectsStrength: affects });
      return correct;
    }
    // A game that is played, not answered: one honest participation record.
    played(c, skill = "friend") {
      this.ctx.reportOutcome?.({ item: item(c), itemId: c, activity: this.constructor.name, skill, correct: true,
        evidence: "supported_visible_matching", assisted: !!this.missed, affectsStrength: false });
    }
    finish(ms = 800) { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), ms); }
    replayPrompt() {}
    destroy() { this.alive = false; this.timers.forEach(clearTimeout); }
  }

  // ---------- v42 Friend Pairs ----------
  const CARD_BACK = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 18Q78 30 74 62Q62 84 50 86Q38 84 26 62Q22 30 50 18Z" fill="#7fce54" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M50 26V82M50 46L64 38M50 58L36 50M50 70L62 64" fill="none" stroke="#2f5c46" stroke-width="3" stroke-linecap="round"/></svg>`;

  class FriendPairs extends Base {
    constructor(ctx) {
      super(ctx, "tb-pairs", "Friend pairs");
      this.noReplay = true;
      const known = knownChars(ctx);
      this.pool = [...new Set([...firstsOf(ctx, known), ...shuffle(known)])];
      this.boards = ctx.beginner ? 1 : 2; this.board = 0;
      if (this.pool.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.deal();
    }
    deal() {
      if (this.board >= this.boards) return this.finish();
      const n = Math.min(this.ctx.beginner ? 2 : this.board ? 4 : 3, this.pool.length);
      // The second board turns the pool on, so it brings new friends.
      const start = (this.board * 3) % this.pool.length;
      const chars = Array.from({ length: n }, (_, i) => this.pool[(start + i) % this.pool.length]);
      this.cards = shuffle(chars.flatMap((c) => [{ c, face: "friend" }, { c, face: "letter" }]));
      this.open = []; this.pairs = 0; this.missed = false;
      const cols = this.cards.length <= 4 ? 2 : this.cards.length <= 6 ? 3 : 4;
      this.root.innerHTML = `<div class="tb-cards" style="--cols:${cols}">${this.cards.map((k, i) => `<button type="button" class="tb-card" data-i="${i}" aria-label="A card, face down"><span class="tb-card-back" aria-hidden="true">${CARD_BACK}</span><span class="tb-card-face is-${k.face}" aria-hidden="true">${F().art(k.c, { size: 96, mode: k.face === "friend" ? "full" : "plain" })}</span></button>`).join("")}</div>${this.dots(this.boards, this.board)}`;
      this.root.querySelectorAll(".tb-card").forEach((b) => b.addEventListener("click", () => this.flip(Number(b.dataset.i), b)));
      // A peek first: every card shows itself, then turns over.
      this.busy = true;
      this.later(() => this.showAll(true), 300);
      this.later(() => { this.showAll(false); this.busy = false; }, this.ctx.beginner ? 2800 : 2100);
    }
    showAll(up) { this.root.querySelectorAll(".tb-card:not(.is-matched)").forEach((b) => b.classList.toggle("is-up", up)); }
    card(i) { return this.root.querySelector(`.tb-card[data-i="${i}"]`); }
    flip(i, b) {
      if (this.busy || b.classList.contains("is-up")) return;
      const k = this.cards[i];
      b.classList.add("is-up");
      b.setAttribute("aria-label", k.face === "friend" ? F().get(k.c).en : k.c);
      this.ctx.sfx?.("turn");
      // Every card says who it is: a friend its name, a letter its name.
      this.say(k.face === "friend" ? F().item(k.c) : item(k.c));
      this.open.push(i);
      if (this.open.length < 2) return;
      const [a, z] = this.open; this.open = [];
      const A = this.cards[a], Z = this.cards[z];
      this.busy = true;
      if (A.c === Z.c) {
        this.later(() => {
          [a, z].forEach((j) => this.card(j)?.classList.add("is-matched"));
          this.cheer(this.card(z));
          this.ctx.sfx?.(F().get(A.c).call);
          this.played(A.c);
        }, 450);
        this.pairs += 1;
        this.later(() => { this.busy = false; if (this.pairs * 2 >= this.cards.length) this.cleared(); }, 1300);
        return;
      }
      this.missed = true;
      // A mismatch is how memory is played, not a mistake: no "hm?", the
      // cards just turn back with a page-flip.
      // Encouragement pass (v57): after three mismatches the cards peek again,
      // so memory never turns into guessing until a child gives up.
      this.mismatches = (this.mismatches || 0) + 1;
      const peek = this.mismatches >= 3;
      if (peek) this.mismatches = 0;
      this.later(() => {
        [a, z].forEach((j) => { const el = this.card(j); el?.classList.remove("is-up"); el?.setAttribute("aria-label", "A card, face down"); });
        this.ctx.sfx?.("turn");
        if (!peek) { this.busy = false; return; }
        this.later(() => this.showAll(true), 250);
        this.later(() => { this.showAll(false); this.busy = false; }, 1900);
      }, 1400);
    }
    cleared() {
      this.busy = true;
      this.root.querySelector(".tb-cards")?.classList.add("is-cleared");
      this.ctx.sfx?.("chime");
      this.board += 1;
      this.later(() => this.deal(), 1700);
    }
  }

  // ---------- v43 Dot Nests ----------
  // A nest holding n dots (round, ink-dark, like a letter's own dots).
  const NEST = (n) => {
    const at = { 0: [], 1: [[50, 30]], 2: [[37, 32], [63, 32]], 3: [[33, 34], [67, 34], [50, 21]] }[n] || [];
    const feather = n ? "" : `<path d="M44 44Q52 26 64 30Q56 40 44 44Z" fill="#ffa798" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
    return `<svg viewBox="0 0 100 70" aria-hidden="true">${feather}${at.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9.5" fill="${INK}"/><circle cx="${x - 3}" cy="${y - 3}" r="2.4" fill="#a89478"/>`).join("")}<path d="M10 44Q50 40 90 44Q86 66 50 66Q14 66 10 44Z" fill="#c69434" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M18 50Q50 56 82 50M24 58Q50 62 76 58" fill="none" stroke="#70501b" stroke-width="2.4" stroke-linecap="round"/></svg>`;
  };
  const TREE = `<svg class="tb-tree" viewBox="0 0 300 220" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><path d="M138 220V96Q150 70 168 92V220Z" fill="#c69434" stroke="${INK}" stroke-width="3"/><path d="M160 110Q200 92 236 96" fill="none" stroke="#c69434" stroke-width="8" stroke-linecap="round"/>${[[150, 50, 56], [100, 70, 40], [204, 64, 44], [150, 18, 34]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#7fce54"/>`).join("")}<path d="M0 206Q150 192 300 206V220H0Z" fill="#b7e779"/></svg>`;

  class DotNests extends Base {
    constructor(ctx) {
      super(ctx, "tb-nests", "Dot nests");
      this.noReplay = true;
      const known = knownChars(ctx);
      const counts = new Set(known.map((c) => dotsOf(c).length));
      if (counts.size < 2) { this.later(() => ctx.done?.(), 300); return; }
      const order = [...new Set([...firstsOf(ctx, known), ...shuffle(known)])];
      // Make sure a dotless letter and a dotted one both visit.
      const pick = order.slice(0, ctx.beginner ? 3 : 4);
      if (pick.every((c) => dotsOf(c).length) || pick.every((c) => !dotsOf(c).length)) {
        const other = order.find((c) => !!dotsOf(c).length !== !!dotsOf(pick[0]).length);
        if (other) pick[pick.length - 1] = other;
      }
      this.queue = shuffle(pick).map((c) => ({ c, mode: "count" }));
      const ups = known.filter((c) => sideOf(c) === "above"), downs = known.filter((c) => sideOf(c) === "below");
      if (!ctx.beginner && ups.length && downs.length) this.queue.push(...shuffle([shuffle(ups)[0], shuffle(downs)[0]]).map((c) => ({ c, mode: "where" })));
      this.round = 0;
      this.next();
    }
    next() {
      if (this.round >= this.queue.length) return this.finish();
      const q = this.queue[this.round];
      this.q = q; this.missed = false; this.busy = false;
      const want = q.mode === "count" ? dotsOf(q.c).length : sideOf(q.c);
      this.want = want;
      if (q.mode === "count") {
        const others = shuffle([0, 1, 2, 3].filter((n) => n !== want)).slice(0, this.ctx.beginner ? 1 : 2);
        this.offered = [want, ...others].sort((x, y) => x - y);
      } else this.offered = ["above", "below"];
      const letter = `<span class="tb-letter">${F().art(q.c, { size: 150, mode: "plain" })}</span>`;
      this.root.innerHTML = q.mode === "count"
        ? `<div class="tb-branch">${letter}</div>
           <div class="tb-nest-row">${this.offered.map((n, i) => `<button type="button" class="tb-nest" data-i="${i}" aria-label="A nest with ${n} dots">${NEST(n)}</button>`).join("")}</div>
           ${this.dots(this.queue.length, this.round)}`
        : `<div class="tb-where">${TREE}
             <button type="button" class="tb-nest is-high" data-i="0" aria-label="The nest up in the tree">${NEST(0)}</button>
             <button type="button" class="tb-nest is-low" data-i="1" aria-label="The nest down on the ground">${NEST(0)}</button>
             ${letter}</div>
           ${this.dots(this.queue.length, this.round)}`;
      this.root.querySelectorAll(".tb-nest").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      this.ctx.beginRound?.(item(q.c), "letter-form");
      this.later(() => this.say(item(q.c)), 300);
    }
    pick(i, btn) {
      if (this.busy) return;
      const choice = this.offered[i];
      const key = (v) => `${this.q.c}:${v}`;
      const right = this.report(key(this.want), key(choice), this.offered.map(key), { skill: "letter-form" });
      if (!right) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        this.root.querySelectorAll(".tb-nest").forEach((b, k) => b.classList.toggle("is-hint", this.offered[k] === this.want));
        return;
      }
      this.busy = true;
      // The letter hops into its nest and its friend pops up to say hello.
      const letter = this.root.querySelector(".tb-letter");
      if (letter && !this.still()) {
        const a = letter.getBoundingClientRect(), z = btn.getBoundingClientRect();
        letter.animate?.([{ transform: "none" }, { transform: `translate(${z.left + z.width / 2 - a.left - a.width / 2}px, ${z.top - a.top - a.height / 2}px) scale(.5)`, opacity: 0.2 }], { duration: 520, easing: "ease-in", fill: "forwards" });
      }
      this.later(() => { btn.classList.add("is-home"); btn.insertAdjacentHTML("beforeend", `<span class="tb-nest-friend">${F().art(this.q.c, { size: 78 })}</span>`); this.ctx.sfx?.(F().get(this.q.c).call); }, 480);
      this.cheer(btn);
      this.ctx.sfx?.("chick");
      this.round += 1;
      this.later(() => this.next(), 2300);
    }
  }

  // ---------- v44 Friend Jigsaw ----------
  // Regions of the friend's -6…106 picture box: halves, or quarters.
  const REGIONS = { 2: [[-6, -6, 56, 112], [50, -6, 56, 112]], 4: [[-6, -6, 56, 56], [50, -6, 56, 56], [-6, 50, 56, 56], [50, 50, 56, 56]] };
  class FriendJigsaw extends Base {
    constructor(ctx) {
      super(ctx, "tb-jigsaw", "Friend jigsaw");
      this.noReplay = true;
      this.known = knownChars(ctx);
      this.order = [...new Set([...firstsOf(ctx, this.known), ...shuffle(this.known)])].slice(0, ctx.beginner ? 2 : 3);
      this.n = ctx.beginner ? 2 : 4;
      this.round = 0;
      if (!this.order.length) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    // The friend on a little sky-and-grass picture, so every piece — even a
    // corner of slim alif — carries something to match by.
    scene(c, size) {
      const sky = `<g class="tb-scene"><path d="M-6 -6H106V106H-6Z" fill="#ccfbef"/><path d="M-6 78Q24 68 50 76T106 72V106H-6Z" fill="#b7e779"/><path d="M-6 90Q40 82 106 92V106H-6Z" fill="#7fce54"/><circle cx="88" cy="10" r="10" fill="#f3c955"/><path d="M4 18q6-6 12 0q6-4 10 2H4Z" fill="#fffdf7"/>${[[14, 96], [66, 98], [92, 88]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#ffa798"/>`).join("")}</g>`;
      return F().art(c, { size }).replace(/(<svg[^>]*>)/, `$1${sky}`);
    }
    piece(c, r, size) {
      const [x, y, w, h] = REGIONS[this.n][r];
      return this.scene(c, size).replace(/viewBox="[^"]*"/, `viewBox="${x} ${y} ${w} ${h}"`).replace(/width="\d+" height="\d+"/, `width="${Math.round((size * w) / 112)}" height="${Math.round((size * h) / 112)}"`);
    }
    next() {
      if (this.round >= this.order.length) return this.finish();
      const c = this.order[this.round];
      this.c = c; this.missed = false; this.busy = false;
      this.todo = shuffle(Array.from({ length: this.n }, (_, i) => i));
      this.root.innerHTML = `
        <div class="tb-board is-${this.n}"><span class="tb-ghost">${F().art(c, { size: 240, mode: "plain" })}</span>
          ${REGIONS[this.n].map((_, r) => `<span class="tb-slot" data-r="${r}"></span>`).join("")}</div>
        <div class="tb-tray"></div>
        ${this.dots(this.order.length, this.round)}`;
      this.ask();
    }
    ask() {
      const slot = this.todo[0];
      this.root.querySelectorAll(".tb-slot").forEach((s) => s.classList.toggle("is-wanted", Number(s.dataset.r) === slot));
      // The pieces still to place, plus (for older children) one piece of a
      // different friend cut from the same spot.
      const pieces = this.todo.map((r) => ({ c: this.c, r }));
      const decoy = !this.ctx.beginner && smart(this.c, this.known, 1, "friend", false)[0];
      if (decoy) pieces.push({ c: decoy, r: slot });
      this.pieces = shuffle(pieces);
      const size = this.n === 2 ? 170 : 200;
      this.root.querySelector(".tb-tray").innerHTML = this.pieces.map((p, i) => `<button type="button" class="tb-piece" data-i="${i}" aria-label="A puzzle piece">${this.piece(p.c, p.r, size)}</button>`).join("");
      this.root.querySelectorAll(".tb-piece").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
    }
    pick(i, btn) {
      if (this.busy) return;
      const p = this.pieces[i], slot = this.todo[0];
      if (p.c !== this.c || p.r !== slot) {
        this.missed = true;
        this.wobble(btn);
        if (p.c !== this.c) this.say(F().item(p.c)); // "that's someone else"
        // Encouragement pass (v57): the piece that fits glows.
        this.root.querySelectorAll(".tb-piece").forEach((b, k) => b.classList.toggle("is-hint", this.pieces[k].c === this.c && this.pieces[k].r === slot));
        this.ctx.sfx?.("softwrong");
        return;
      }
      this.ctx.sfx?.("click");
      const el = this.root.querySelector(`.tb-slot[data-r="${slot}"]`);
      el.classList.remove("is-wanted"); el.classList.add("is-placed");
      el.innerHTML = this.piece(this.c, slot, 240);
      this.todo.shift();
      if (this.todo.length) { this.ask(); return; }
      // Whole again: the friend comes alive and says hello.
      this.busy = true;
      this.root.querySelector(".tb-tray").innerHTML = "";
      const board = this.root.querySelector(".tb-board");
      board.classList.add("is-whole");
      board.insertAdjacentHTML("beforeend", `<span class="tb-whole">${this.scene(this.c, 240)}</span>`);
      this.cheer(board);
      this.played(this.c);
      this.later(() => this.ctx.sfx?.(F().get(this.c).call), 300);
      this.later(() => this.say(F().item(this.c)), 800);
      this.later(() => this.say(item(this.c)), 2000);
      this.round += 1;
      this.later(() => this.next(), 3400);
    }
  }

  // ---------- v45 Bath Time ----------
  // 2026-10-18 (construction detail): a clawfoot tub — a rolled rim, side
  // panel lines, a tap with two handles and a spout, ball-and-claw feet, and
  // a shine. Same footprint, so the bubbles and the friend still fit.
  const TUB = `<g transform="translate(100 82)"><rect x="-4" y="-2" width="8" height="14" rx="3" fill="#c9bda4" stroke="${INK}" stroke-width="2.4"/><path d="M0 0Q0 -12 -12 -12H-16" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M0 0Q0 -12 -12 -12H-16" fill="none" stroke="#c9bda4" stroke-width="3" stroke-linecap="round"/><circle cx="-7" cy="-2" r="3.5" fill="#ee806f" stroke="${INK}" stroke-width="1.6"/><circle cx="7" cy="-2" r="3.5" fill="#62cdf4" stroke="${INK}" stroke-width="1.6"/></g>
    <path d="M-4 98H104Q102 120 84 122H16Q-2 120 -4 98Z" fill="#96ecff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M8 106Q50 112 92 106" fill="none" stroke="#62cdf4" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="14" cy="108" rx="5" ry="2.4" fill="#fffdf7" opacity=".6"/>
    <rect x="-10" y="92" width="120" height="8" rx="4" fill="#fffdf7" stroke="${INK}" stroke-width="3"/>
    ${[[12, 122], [88, 122]].map(([x, y]) => `<path d="M${x} ${y}L${x + (x < 50 ? -4 : 4)} ${y + 6}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><circle cx="${x + (x < 50 ? -5 : 5)}" cy="${y + 8}" r="3.5" fill="#f3c955" stroke="${INK}" stroke-width="1.6"/>`).join("")}`;
  class BathTime extends Base {
    constructor(ctx) {
      super(ctx, "tb-bath", "Bath time");
      this.known = knownChars(ctx);
      this.order = [...new Set([...firstsOf(ctx, this.known), ...shuffle(this.known)])].slice(0, ctx.beginner ? 2 : 3);
      this.ask = !ctx.beginner && this.known.length >= 2;
      this.round = 0;
      if (!this.order.length) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.order.length) return this.finish();
      const c = this.order[this.round];
      this.c = c; this.missed = false; this.busy = false; this.clean = false; this.answered = !this.ask;
      // Bubbles (2026-10-13; was mud): overlapping suds on a grid over the
      // friend's picture box. Brown mud read as dirty — even as something
      // worse — at a glance; a tub of foam is the fun of bath time.
      // The class names stay "mud" so the scrub logic is unchanged.
      const blobs = [];
      // v58: a rounded cloud of mud, not a square block — a square read as a
      // brown wall in the tub. The oval still covers every friend's shape (the
      // picture box's corners are empty); dark spots are scattered at random,
      // because a fixed every-fifth pattern lined up into stripes.
      for (let y = -2; y <= 100; y += 11) for (let x = -2; x <= 102; x += 11) {
        if (((x - 50) / 66) ** 2 + ((y - 49) / 64) ** 2 > 1) continue;
        blobs.push([x + Math.random() * 4 - 2, y + Math.random() * 4 - 2, 8.6 + Math.random() * 2.4, FOAM[Math.floor(Math.random() * FOAM.length)]]);
      }
      this.total = blobs.length;
      const friend = F().art(c, { size: 112 }).replace(/^<svg/, '<svg x="-6" y="-6"');
      this.root.innerHTML = `
        <div class="tb-tub-wrap"><svg class="tb-tub" viewBox="-12 -12 124 144" aria-label="A friend hiding in the bubbles">
          <g class="tb-bath-friend">${friend}</g>
          <g class="tb-mud">${blobs.map(([x, y, r, tint]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${tint}" stroke="#96ecff" stroke-width="1.6"/>`).join("")}</g>
          <g class="tb-foam-shine" aria-hidden="true">${blobs.filter((b, k) => k % 3 === 0).map(([x, y, r]) => `<path data-at="${x.toFixed(1)},${y.toFixed(1)}" d="M${(x - r * 0.5).toFixed(1)} ${(y - r * 0.15).toFixed(1)}Q${(x - r * 0.45).toFixed(1)} ${(y - r * 0.55).toFixed(1)} ${(x - r * 0.05).toFixed(1)} ${(y - r * 0.6).toFixed(1)}" fill="none" stroke="#fffdf7" stroke-width="1.6" stroke-linecap="round"/>`).join("")}</g>
          ${TUB}<g class="tb-bubbles"></g>
        </svg><span class="tb-sponge-cursor" aria-hidden="true">${SPONGE}</span></div>
        <div class="tb-bath-tools"><button type="button" class="tb-sponge" aria-label="Scrub">${SPONGE}</button><div class="tb-guess" hidden></div></div>
        ${this.dots(this.order.length, this.round)}`;
      this.svg = this.root.querySelector(".tb-tub");
      this.mud = this.root.querySelector(".tb-mud");
      this.bubbles = this.root.querySelector(".tb-bubbles");
      const scrub = (e) => { if (e.type === "pointerdown" || e.buttons) { this.follow(e); const p = this.toBox(e); if (p) this.scrubAt(p.x, p.y, 13); } };
      this.svg.addEventListener("pointerdown", scrub);
      this.svg.addEventListener("pointermove", scrub);
      const lift = () => this.cursor?.classList.remove("is-scrubbing");
      this.svg.addEventListener("pointerup", lift);
      this.svg.addEventListener("pointerleave", lift);
      this.cursor = this.root.querySelector(".tb-sponge-cursor");
      // The sponge button scrubs a patch too — for a keyboard, a switch, or a
      // child who prefers tapping.
      this.root.querySelector(".tb-sponge").addEventListener("click", () => {
        const left = [...this.mud.children];
        const b = left[Math.floor(Math.random() * left.length)];
        if (b) this.scrubAt(Number(b.getAttribute("cx")), Number(b.getAttribute("cy")), 22);
      });
      this.ctx.beginRound?.(item(c), "friend");
      this.ctx.sfx?.("splash");
    }
    // "Who is in the bath?" — the replay button plays the friend's own call.
    replayPrompt() { if (this.c && !this.clean) this.ctx.sfx?.(F().get(this.c).call); }
    // Feel pass (v56): the sponge is in the child's hand. It trails the finger
    // a little (lag reads as weight and friction — the oldest pseudo-haptic
    // trick) and tilts the way it is being dragged. Reduced motion: it simply
    // sits under the finger.
    follow(e) {
      const wrap = this.cursor?.parentElement;
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      // On big screens the game is zoomed (v53): screen pixels → layout pixels.
      const k = wrap.offsetWidth ? r.width / wrap.offsetWidth : 1;
      this.aim = [(e.clientX - r.left) / k, (e.clientY - r.top) / k];
      this.cursor.classList.add("is-scrubbing");
      if (this.still() || !this.pos) { this.pos = this.aim.slice(); this.place(0); }
      if (this.still() || this.raf) return;
      const step = () => {
        this.raf = 0;
        if (!this.alive || !this.cursor?.isConnected) return;
        const [ax, ay] = this.aim, [px, py] = this.pos;
        const nx = px + (ax - px) * 0.28, ny = py + (ay - py) * 0.28;
        this.pos = [nx, ny];
        this.place(Math.max(-18, Math.min(18, (nx - px) * 1.6)));
        if (Math.hypot(ax - nx, ay - ny) > 0.5) this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    }
    place(tilt) {
      const [x, y] = this.pos;
      this.cursor.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%) rotate(${tilt.toFixed(1)}deg)`;
    }
    toBox(e) {
      const m = this.svg.getScreenCTM?.();
      if (!m) return null;
      const pt = this.svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(m.inverse());
    }
    scrubAt(x, y, r) {
      if (this.clean) return;
      let gone = 0;
      for (const b of [...this.mud.children]) {
        if (Math.hypot(Number(b.getAttribute("cx")) - x, Number(b.getAttribute("cy")) - y) <= r) { b.remove(); gone += 1; }
      }
      if (!gone) return;
      const now = performance.now();
      if (!this.lastSound || now - this.lastSound > 140) { this.ctx.sfx?.("pop"); this.lastSound = now; }
      // Their shine goes with them.
      this.root.querySelectorAll(".tb-foam-shine path").forEach((sh) => { const [sx, sy] = sh.dataset.at.split(",").map(Number); if (Math.hypot(sx - x, sy - y) <= r) sh.remove(); });
      // Little suds fly off where the foam comes away.
      if (!this.still() && this.bubbles.children.length < 22) {
        for (let k = 0; k < 2; k += 1) {
          const a = Math.random() * Math.PI * 2, d = 10 + Math.random() * 10;
          this.bubbles.insertAdjacentHTML("beforeend", `<circle class="tb-fleck" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.6 + Math.random() * 1.6).toFixed(1)}" fill="#fffaf0" stroke="#96ecff" stroke-width="1.6" style="--dx:${(Math.cos(a) * d).toFixed(1)}px;--dy:${(Math.sin(a) * d - 6).toFixed(1)}px"/>`);
          const fleck = this.bubbles.lastElementChild;
          this.later(() => fleck.remove(), 500);
        }
      }
      if (this.bubbles.children.length < 14) {
        this.bubbles.insertAdjacentHTML("beforeend", `<circle class="tb-bubble" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(3 + Math.random() * 4).toFixed(1)}" fill="#ccfbef" stroke="${INK}" stroke-width="1.6"/>`);
        const bub = this.bubbles.lastElementChild;
        this.later(() => bub.remove(), 900);
      }
      const done = 1 - this.mud.children.length / this.total;
      if (!this.answered && !this.guessing && done >= 0.35) this.offerGuess();
      if (done >= 0.72 && this.answered) this.washAll();
    }
    offerGuess() {
      this.guessing = true;
      const others = smart(this.c, this.known, 2, "friend", this.ctx.beginner);
      this.offered = shuffle([this.c, ...others]);
      const box = this.root.querySelector(".tb-guess");
      box.hidden = false;
      box.innerHTML = this.offered.map((o, i) => `<button type="button" class="tb-guess-letter" data-i="${i}" aria-label="${o}">${F().art(o, { size: 64, mode: "plain" })}</button>`).join("");
      box.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => this.guess(Number(b.dataset.i), b)));
      this.ctx.sfx?.("chime");
    }
    guess(i, btn) {
      if (this.answered) return;
      const chosen = this.offered[i];
      // Most of the friend may still be muddy: an early right answer is real
      // recognition; once it is nearly clean, it is seeing, so it is assisted.
      if (1 - this.mud.children.length / this.total > 0.8) this.missed = true;
      const right = this.report(this.c, chosen, this.offered, { skill: "friend" });
      this.say(item(chosen));
      if (!right) {
        this.missed = true;
        this.ctx.sfx?.("softwrong"); this.wobble(btn);
        // Encouragement pass (v57): the right letter glows after a miss.
        this.root.querySelectorAll(".tb-guess-letter").forEach((b, k) => b.classList.toggle("is-hint", this.offered[k] === this.c));
        return;
      }
      this.answered = true;
      btn.classList.add("is-right");
      this.washAll();
    }
    washAll() {
      if (this.clean) return;
      this.clean = true; this.busy = true;
      this.root.querySelector(".tb-guess").hidden = true;
      const blobs = [...this.mud.children];
      this.root.querySelector(".tb-foam-shine")?.replaceChildren();
      if (this.still()) blobs.forEach((b) => b.remove());
      else blobs.forEach((b, k) => this.later(() => b.remove(), Math.min(600, k * 8)));
      this.ctx.sfx?.("splash");
      this.later(() => {
        this.root.querySelector(".tb-bath-friend")?.classList.add("is-clean");
        this.cheer(this.svg);
        if (!this.ask) this.played(this.c);
        this.ctx.sfx?.(F().get(this.c).call);
      }, 650);
      this.later(() => this.say(F().item(this.c)), 1200);
      this.later(() => this.say(item(this.c)), 2300);
      this.round += 1;
      this.later(() => { this.guessing = false; this.next(); }, 3600);
    }
  }
  const FOAM = ["#fffaf0", "#fffaf0", "#ccfbef", "#e6d6f0"];
  const SPONGE = `<svg viewBox="0 0 100 80" aria-hidden="true"><path d="M14 30Q12 16 28 16H74Q90 16 88 30V54Q90 68 74 68H28Q12 68 14 54Z" fill="#f3c955" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>${[[32, 32], [52, 44], [70, 30], [38, 54], [68, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.4" fill="#c69434"/>`).join("")}<circle cx="86" cy="14" r="7" fill="#ccfbef" stroke="${INK}" stroke-width="2.4"/><circle cx="74" cy="6" r="4" fill="#ccfbef" stroke="${INK}" stroke-width="2.4"/></svg>`;

  // ---------- v46 Letter Fishing ----------
  const FISH = (color) => `<svg viewBox="0 0 120 70" aria-hidden="true"><path d="M8 35L26 18V52Z" fill="${color}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M24 35Q40 6 76 8Q112 12 114 35Q112 58 76 62Q40 64 24 35Z" fill="${color}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="98" cy="28" r="4" fill="${INK}"/><path d="M104 42q-4 3-8 1" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M60 10Q66 2 76 8" fill="${color}" stroke="${INK}" stroke-width="2.4"/></svg>`;
  const FISH_COLORS = ["#ffa798", "#f3c955", "#96ecff", "#b7e779", "#b49fcf", "#ee806f"];
  // 2026-10-18 (construction detail): a real pail in coral, so it stands out
  // from the blue water — rounded body, a rim, two bands, rivets, a wire
  // handle with a grip, and water showing inside.
  const BUCKET = `<svg viewBox="0 0 100 90" aria-hidden="true"><path d="M16 24Q50 -14 84 24" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/><path d="M16 24Q50 -14 84 24" fill="none" stroke="#c9bda4" stroke-width="3" stroke-linecap="round"/><rect x="40" y="2" width="20" height="9" rx="4.5" fill="#c69434" stroke="${INK}" stroke-width="2.4"/><path d="M16 26H84Q82 84 72 86H28Q18 84 16 26Z" fill="#ee806f" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M19 44H81M21 66H79" stroke="#c25a49" stroke-width="3" stroke-linecap="round"/><ellipse cx="50" cy="26" rx="36" ry="7" fill="#62cdf4" stroke="${INK}" stroke-width="3"/><path d="M34 26Q42 23 50 26" fill="none" stroke="#ccfbef" stroke-width="2.4" stroke-linecap="round"/><circle cx="16" cy="26" r="4" fill="#c9bda4" stroke="${INK}" stroke-width="2.4"/><circle cx="84" cy="26" r="4" fill="#c9bda4" stroke="${INK}" stroke-width="2.4"/><ellipse cx="28" cy="54" rx="4" ry="9" fill="#fffdf7" opacity=".5"/></svg>`;

  class LetterFishing extends Base {
    constructor(ctx) {
      super(ctx, "tb-fishing", "Letter fishing");
      this.known = knownChars(ctx);
      this.asks = [...new Set([...firstsOf(ctx, this.known), ...shuffle(this.known)])].slice(0, ctx.beginner ? 3 : 4);
      this.round = 0;
      if (this.known.length < 2) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    next() {
      if (this.round >= this.asks.length) return this.finish();
      const target = this.asks[this.round];
      this.target = target; this.missed = false; this.heard = true; this.busy = false;
      const n = this.ctx.beginner ? 3 : 5;
      const others = smart(target, this.known, this.known.length, "name", this.ctx.beginner);
      this.fish = shuffle([target, ...Array.from({ length: n - 1 }, (_, i) => others[i % others.length])]);
      this.root.innerHTML = `
        <div class="tb-pond" style="--n:${n}">
          <svg class="tb-water" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden="true"><path d="M0 18Q75 8 150 18T300 18V200H0Z" fill="#62cdf4"/><path d="M0 18Q75 8 150 18T300 18" fill="none" stroke="#ccfbef" stroke-width="4"/>${[[40, 70], [210, 120], [120, 170]].map(([x, y]) => `<path d="M${x} ${y}q14-6 28 0" fill="none" stroke="#96ecff" stroke-width="4" stroke-linecap="round"/>`).join("")}</svg>
          ${this.fish.map((c, i) => `<button type="button" class="tb-fish" data-i="${i}" style="--row:${i};--dur:${(26 + Math.random() * 12).toFixed(1)}s;--delay:${(-Math.random() * 30).toFixed(1)}s;--x:${(4 + Math.random() * 52).toFixed(0)}%" aria-label="A fish carrying ${c}"><span class="tb-fish-body">${FISH(FISH_COLORS[i % FISH_COLORS.length])}</span><span class="tb-fish-letter">${F().art(c, { size: 50, mode: "plain" })}</span></button>`).join("")}
          <span class="tb-line" aria-hidden="true"></span>
          <span class="tb-bucket" aria-label="Fish caught">${BUCKET}<span class="tb-bucket-in"></span></span>
        </div>
        ${this.dots(this.asks.length, this.round)}`;
      this.root.querySelectorAll(".tb-fish").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      this.ctx.beginRound?.(item(target), "letter-name");
      if (this.ctx.canListen?.() === false) { this.ctx.prompt?.(item(target)); this.heard = false; }
      this.later(() => this.say(item(target)), 350);
    }
    cast(b) {
      const pond = this.root.querySelector(".tb-pond"), line = this.root.querySelector(".tb-line");
      if (!pond || !line) return;
      const p = pond.getBoundingClientRect(), r = b.getBoundingClientRect();
      line.style.left = `${r.left + r.width * 0.62 - p.left}px`;
      line.style.height = `${r.top + r.height * 0.4 - p.top}px`;
      line.classList.remove("is-cast"); void line.offsetWidth; line.classList.add("is-cast");
    }
    pick(i, b) {
      if (this.busy || b.classList.contains("is-caught")) return;
      const c = this.fish[i];
      this.cast(b);
      const right = this.report(this.target, c, [...new Set(this.fish)], { listening: true });
      this.say(item(c));
      if (!right) {
        // It wriggles off the hook and swims on, saying its own name.
        this.missed = true;
        this.ctx.sfx?.("softwrong");
        b.classList.add("is-wriggle");
        this.later(() => b.classList.remove("is-wriggle"), 700);
        this.root.querySelectorAll(".tb-fish").forEach((f, k) => f.classList.toggle("is-hint", this.fish[k] === this.target));
        return;
      }
      this.busy = true;
      // Freeze the fish where it is, then reel it up and into the bucket.
      const left = getComputedStyle(b).left;
      b.style.left = left;
      b.classList.add("is-caught");
      this.ctx.sfx?.("splash");
      this.cheer(b);
      this.later(() => {
        b.classList.add("is-up");
        this.root.querySelector(".tb-bucket-in")?.insertAdjacentHTML("beforeend", `<i>${F().art(c, { size: 26, mode: "plain" })}</i>`);
      }, 350);
      this.round += 1;
      this.later(() => this.next(), 2400);
    }
    replayPrompt() { if (this.target && !this.busy) this.say(item(this.target)); }
  }

  // ---------- v47 Colour a Friend ----------
  const CRAYONS = ["#ee806f", "#f3c955", "#7fce54", "#62cdf4", "#b49fcf", "#ffa798", "#c69434", "#fffdf7"];
  const PAPER = "#fffdf7";
  class ColourFriend extends Base {
    constructor(ctx) {
      super(ctx, "tb-colour", "Colour a friend");
      this.noReplay = true;
      const known = knownChars(ctx);
      this.chars = [...new Set([...firstsOf(ctx, known), ...shuffle(known)])].slice(0, 3);
      if (!this.chars.length) { this.later(() => ctx.done?.(), 300); return; }
      this.crayon = CRAYONS[0];
      this.page(this.chars[0]);
    }
    page(c) {
      this.c = c; this.named = false; this.coloured = new Set();
      this.root.innerHTML = `
        <div class="tb-paper">${F().art(c, { size: 280 })}</div>
        <div class="tb-crayons">${CRAYONS.map((col, i) => `<button type="button" class="tb-crayon${i ? "" : " is-on"}" data-c="${col}" style="--crayon:${col}" aria-label="Crayon ${i + 1}"><svg viewBox="0 0 40 80" aria-hidden="true"><path d="M8 22L20 2L32 22V76H8Z" fill="${col}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M8 34H32M8 64H32" stroke="${INK}" stroke-width="2.4"/></svg></button>`).join("")}</div>
        <div class="tb-colour-tools">${this.chars.length > 1 ? `<button type="button" class="tb-next-page" aria-label="Another friend">${F().art(this.chars[(this.chars.indexOf(c) + 1) % this.chars.length], { size: 54 })}</button>` : ""}<button type="button" class="tb-hang" aria-label="Hang it in the garden" hidden><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8L50 22" stroke="${INK}" stroke-width="4"/><path d="M18 22H82V88H18Z" fill="#fffaf0" stroke="#c69434" stroke-width="8"/><path d="M34 56l12 12 22-24" fill="none" stroke="#4e9677" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>`;
      // Make a colouring page: every painted part turns to paper, the ink stays.
      const svg = this.root.querySelector(".tb-paper svg");
      this.svg = svg;
      let n = 0;
      svg.querySelectorAll(".lf-dress [fill], .lf-fill-dot").forEach((el) => {
        const f = (el.getAttribute("fill") || "").toLowerCase();
        if (!f || f === "none" || f === INK || el.classList.contains("lf-eye")) return;
        el.setAttribute("fill", PAPER); el.dataset.part = String(n++);
      });
      svg.querySelectorAll(".lf-fill").forEach((el) => { el.setAttribute("stroke", PAPER); el.dataset.part = String(n++); el.dataset.body = "1"; });
      // The thick ink edge of the body colours the body too (a bigger target).
      svg.querySelectorAll(".lf-ink").forEach((el, k) => { el.dataset.bodyEdge = String(k); });
      this.parts = n;
      svg.addEventListener("click", (e) => this.paint(e.target));
      // Keyboard and switch access (v54): every part can be reached with Tab
      // and coloured with Enter or Space.
      svg.removeAttribute("aria-hidden");
      svg.setAttribute("role", "group");
      svg.setAttribute("aria-label", "Colouring page");
      svg.querySelectorAll("[data-part]").forEach((el, k) => {
        el.setAttribute("tabindex", "0"); el.setAttribute("role", "button");
        el.setAttribute("aria-label", el.dataset.body ? "The letter" : `Part ${k + 1}`);
        el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.paint(el); } });
      });
      this.root.querySelectorAll(".tb-crayon").forEach((b) => b.addEventListener("click", () => {
        this.crayon = b.dataset.c;
        this.root.querySelectorAll(".tb-crayon").forEach((o) => o.classList.toggle("is-on", o === b));
        this.ctx.sfx?.("click");
      }));
      this.root.querySelector(".tb-next-page")?.addEventListener("click", () => { this.ctx.sfx?.("page"); this.page(this.chars[(this.chars.indexOf(this.c) + 1) % this.chars.length]); });
      this.root.querySelector(".tb-hang").addEventListener("click", () => this.hang());
      this.ctx.sfx?.("page");
    }
    paint(target) {
      let el = target?.closest?.("[data-part], [data-body-edge]");
      if (!el) return;
      if (el.dataset.bodyEdge != null) el = this.svg.querySelectorAll(".lf-fill")[Number(el.dataset.bodyEdge)] || null;
      if (!el) return;
      if (el.dataset.body) this.svg.querySelectorAll(".lf-fill").forEach((p) => { p.setAttribute("stroke", this.crayon); this.coloured.add(p.dataset.part); });
      else { el.setAttribute("fill", this.crayon); this.coloured.add(el.dataset.part); }
      this.ctx.sfx?.("blob");
      // Colouring the letter body: the friend says its name, then its letter.
      if (el.dataset.body && !this.named) {
        this.named = true;
        this.svg.classList.add("is-wiggle");
        this.later(() => this.svg.classList.remove("is-wiggle"), 600);
        this.say(F().item(this.c));
        this.later(() => this.say(item(this.c)), 1200);
        this.played(this.c);
      }
      // v58: colouring the letter itself is enough to hang the picture. Three
      // parts were needed, and on a phone 14 of 28 friends (م, ر, ع…) only had
      // a third part under 20px — a nose or a dot a toddler can't hit.
      if (this.named || this.coloured.size >= Math.min(3, this.parts)) this.root.querySelector(".tb-hang").hidden = false;
    }
    async hang() {
      if (this.busy) return;
      this.busy = true;
      // Draw the page onto a small canvas so the garden can hang it as a sign.
      let url = null;
      try {
        const c = document.createElement("canvas"); c.width = 160; c.height = 160;
        const g = c.getContext("2d");
        g.fillStyle = PAPER; g.fillRect(0, 0, 160, 160);
        const src = this.svg.outerHTML.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/width="\d+" height="\d+"/, 'width="160" height="160"');
        const img = new Image();
        await new Promise((ok) => { img.onload = ok; img.onerror = ok; img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(src)}`; });
        if (img.width) g.drawImage(img, 0, 0, 160, 160);
        url = c.toDataURL("image/png");
      } catch { url = null; }
      if (!this.alive) return;
      if (url) this.ctx.saveDrawing?.(url);
      this.root.querySelector(".tb-paper")?.classList.add("is-hung");
      this.cheer(this.svg);
      this.finish(1400);
    }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  Object.assign(ns.GardenPractice, { FriendPairs, DotNests, FriendJigsaw, BathTime, LetterFishing, ColourFriend });
  ns.ToyBoxGames = { KINDS: ["FriendPairs", "DotNests", "FriendJigsaw", "BathTime", "LetterFishing", "ColourFriend"], sideOf, dotsOf };
})(window.MiftahGame || (window.MiftahGame = {}));
