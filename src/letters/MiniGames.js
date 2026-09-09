// The Letter Garden mini-games. Each game receives a context from the shell:
//   { stage, items, extraItems, rounds, hue, say(item), sfx(name), setPrompt(item),
//     confettiAt(el), onDone(slips) }
// and quizzes the world's items with zero written instructions — the prompt
// is always something the child hears (and sees in the mascot's bubble), and
// the answer is always something they tap.
(function (ns) {
  const Art = ns.LettersArt;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Pick the round's targets and, for each, distractors with different ids.
  // ctx.level (stars already earned on this world) scales the challenge:
  // seasoned replayers face one extra distractor — adaptive, Brain Age style.
  function buildRounds(ctx) {
    const pool = shuffle(ctx.items);
    const targets = pool.slice(0, ctx.rounds);
    while (targets.length < ctx.rounds) targets.push(pool[targets.length % pool.length]);
    const optionCount = ctx.beginner ? 2 : (ctx.level || 0) >= (ctx.garden ? 3 : 2) ? 4 : 3;
    return targets.map((target) => {
      const wrong = shuffle(
        ctx.items.concat(ctx.beginner ? [] : (ctx.extraItems || [])).filter((i) => i.id !== target.id),
      );
      const seen = new Set([target.id]);
      const options = [target];
      for (const w of wrong) {
        if (options.length >= optionCount) break;
        if (seen.has(w.id)) continue;
        seen.add(w.id);
        options.push(w);
      }
      return { target, options: shuffle(options) };
    });
  }

  const isArabic = (s) => /[؀-ۿ]/.test(s || "");
  const DIACRITICS = /[ً-ْٰٓ-ٟؐ-ؚۖ-ۭ]/g;

  // Optically centered glyph text. Amiri Quran's ink lands all over its huge
  // em box (ط rides high, م hangs low), so the tile measures each string's
  // real ink (Art.inkShift, canvas TextMetrics) and places the baseline so
  // the visible glyph — not the em box — sits dead centre.
  function glyphText(display, { fill = "#2b2233", maxSize = 44 } = {}) {
    const latin = !isArabic(display);
    const len = [...display.replace(DIACRITICS, "")].length;
    const size = latin
      ? Math.min(maxSize * 0.6, 26)
      : len <= 1 ? maxSize : len <= 2 ? maxSize * 0.9 : len <= 3 ? maxSize * 0.72 : maxSize * 0.58;
    const s = Art.inkShift(display, size, latin);
    return `<text data-fit-box="0,0,72,62,${size}" x="${s.dx.toFixed(1)}" y="${s.dy.toFixed(1)}" text-anchor="middle"
      font-family="${latin ? "ui-rounded, system-ui, sans-serif" : "'Amiri Quran', serif"}"
      font-size="${size}" fill="${fill}" ${latin ? "" : `direction="rtl"`}>${display}</text>`;
  }

  // Tactile answer card: the same navy outline, warm paper face and shallow
  // physical lift used throughout Letter Garden's new interface system.
  function tileHTML(item, hue) {
    return `
      <svg viewBox="-52 -54 104 106" aria-hidden="true">
        <rect x="-46" y="-38" width="92" height="84" rx="22" fill="#4a3620"/>
        <rect x="-46" y="-46" width="92" height="84" rx="22" fill="hsl(${hue} 52% 86%)" stroke="#4a3620" stroke-width="4"/>
        <rect class="tile-face" x="-39" y="-39" width="78" height="70" rx="16" fill="#fffaf0"/><path d="M-28 -32H26" stroke="#fff" stroke-width="4" stroke-linecap="round"/><path d="M-28 29H28" stroke="#e5dcc8" stroke-width="2" stroke-linecap="round"/>
        <g transform="translate(0 -4)">${glyphText(item.display, { maxSize: 42 })}</g>
      </svg>`;
  }

  // Big Brain Academy's rubber band: every correct answer heats the round up
  // a little, every miss cools it down — the child always plays at their edge.
  function makeHeat() {
    let heat = 0;
    return {
      up: () => (heat = Math.min(heat + 1, 8)),
      down: () => (heat = Math.max(heat - 2, 0)),
      factor: () => 1 + heat * 0.11,
      value: () => heat,
    };
  }

  // Activity-specific materials share real, optically fitted curriculum ink.
  function workshopTile(display, material = "wood") {
    const leaf = material === "leaf";
    return `<svg viewBox="-52 -54 104 110" aria-hidden="true">
      <path d="M-45-31Q-45-47-29-47H31Q45-47 45-31V31Q45 47 29 47H-29Q-45 47-45 31Z" fill="${leaf?'#739367':'#b58a56'}" stroke="#655239" stroke-width="3"/>
      <rect x="-40" y="-43" width="80" height="84" rx="16" fill="${leaf?'#e5edcc':'#eed4a5'}"/>
      <rect x="-35" y="-35" width="70" height="70" rx="13" fill="#fffaf0"/>
      <path d="M-28-39H26" stroke="#fffdf4" stroke-width="3" stroke-linecap="round"/>
      ${glyphText(display,{maxSize:42})}
      ${leaf?'<path d="M30 43Q18 36 24 34Q32 32 34 41Q40 31 43 35Q44 40 34 44" fill="#6c8c58"/>':'<path d="M-28 44H24" stroke="#b59462" stroke-width="2" stroke-linecap="round"/>'}
    </svg>`;
  }

  // ---------- Bubble Pop: hear it, find it, pop it ----------
  class PopGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.rounds = buildRounds(ctx);
      this.roundIndex = 0;
      this.slips = 0;
      this.alive = true;
      this.heat = makeHeat();
      this.bubbles = [];
      ctx.stage.innerHTML = `${ns.LettersGardenArt.pond()}<div class="pop-sky"></div>`;
      this.sky = ctx.stage.querySelector(".pop-sky");
      // Perf: bubbles move via transform (composited), not top (layout).
      // The sky height is measured once and on resize, never per frame.
      this.skyH = this.sky.clientHeight || 1;
      this.onResize = () => (this.skyH = this.sky.clientHeight || 1);
      window.addEventListener("resize", this.onResize);
      this.startRound();
      this.lastTime = performance.now();
      this.tick = this.tick.bind(this);
      requestAnimationFrame(this.tick);
    }

    startRound() {
      if (!this.alive) return;
      this.advancing = false;
      const round = this.rounds[this.roundIndex];
      this.ctx.setPrompt(round.target);
      this.ctx.say(round.target);
      for (const b of this.bubbles) b.el.remove();
      this.bubbles = [];
      // One lane per option — seasoned replayers get 4 options, so the lane
      // count must follow (a fixed [0,1,2] left the 4th bubble unplaced).
      this.laneCount = round.options.length;
      const lanes = shuffle([...Array(this.laneCount).keys()]);
      round.options.forEach((item, i) => this.spawn(item, lanes[i], i * 0.33));
    }

    spawn(item, lane, delay) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "pop-bubble";
      el.innerHTML = this.ctx.garden ? `<svg viewBox="-52 -66 104 132" aria-hidden="true">
          <path d="M-43-58Q0-66 43-58L46 52Q0 65-46 52Z" fill="#e9c995" stroke="#59452e" stroke-width="3"/>
          <path d="M-40-48Q0-53 40-48M-41 47Q0 54 41 47" fill="none" stroke="#b28c57" stroke-width="2" stroke-dasharray="3 3"/>
          <rect x="-39" y="-38" width="78" height="78" rx="16" fill="#fffaf0"/>
          ${glyphText(item.display,{maxSize:44})}
          <path d="M0-48Q-15-60-17-51Q-15-44 0-46Q14-60 18-53Q18-45 0-46" fill="#739463"/>
        </svg>` : tileHTML(item, this.ctx.hue);
      el.setAttribute("aria-label", item.display);
      const laneW = 84 / Math.max(2, this.laneCount || 3);
      const gardenGrid = this.ctx.garden && this.laneCount > 2;
      const laneX = this.ctx.garden ? (gardenGrid ? 28 + (lane % 2) * 44 : 8 + (lane + 0.5) * laneW) : 6 + lane * laneW;
      el.style.width = `${this.ctx.garden ? 32 : laneW - 2}%`;
      el.style.left = `${laneX}%`;
      const pace = 1 + 0.22 * (this.ctx.level || 0);
      const bubble = { el, item, y: this.ctx.garden ? (gardenGrid ? .18 + Math.floor(lane / 2) * .40 : .35) : 1.15 + delay, speed: (0.06 + Math.random() * 0.025) * pace };
      bubble.restY = bubble.y;
      el.style.transform = `translate3d(${this.ctx.garden ? "-50%" : "0"}, ${bubble.y * this.skyH}px, 0)`;
      el.addEventListener("click", () => this.popAttempt(bubble));
      this.sky.appendChild(el);
      this.bubbles.push(bubble);
    }

    popAttempt(bubble) {
      if (!this.alive || this.advancing || !this.bubbles.includes(bubble) || bubble.el.classList.contains("is-popped") || bubble.el.classList.contains("is-scaffolded") || bubble.el.classList.contains("is-no")) return;
      const round = this.rounds[this.roundIndex];
      if (bubble.item.id === round.target.id) {
        this.advancing = true;
        bubble.el.classList.add("is-popped");
        this.bubbles.forEach(b=>b.el.disabled=true);
        this.heat.up();
        this.ctx.sfx("correct");
        this.ctx.confettiAt(bubble.el);
        this.ctx.say(round.target);
        setTimeout(() => this.advance(), 550);
      } else {
        this.slips += 1;
        this.heat.down();
        this.ctx.sfx("wrong");
        // Rich wrong-pick feedback: the bubble shakes, tints red and wears a
        // ✗ for a beat, while the prompt bubble pulses — "look HERE, listen
        // again" — before the target sound repeats.
        // Shake the inner svg, not the button: the button's transform is the
        // bubble's position now, and the shake animation would override it.
        const svg = bubble.el.querySelector("svg");
        svg.classList.remove("is-shake");
        void svg.offsetWidth;
        svg.classList.add("is-shake");
        bubble.el.classList.add("is-no");
        bubble.el.disabled = true;
        const retryRound = this.roundIndex;
        const cross = document.createElement("i");
        cross.className = "pop-cross";
        cross.innerHTML = `<svg viewBox="0 0 64 64"><path d="M18 18 L46 46 M46 18 L18 46" stroke="#c23a2b" stroke-width="10" stroke-linecap="round"/></svg>`;
        if (!this.ctx.beginner) bubble.el.appendChild(cross);
        if (this.ctx.beginner) this.bubbles.find(b => b.item.id === round.target.id)?.el.classList.add("is-helpful");
        setTimeout(() => {
          if (!this.alive || this.roundIndex !== retryRound || !this.bubbles.includes(bubble)) return;
          bubble.el.classList.remove("is-no");
          cross.remove();
          // Scaffolded retry: the wrong pick quietly leaves the sky.
          bubble.el.classList.add("is-scaffolded");
        }, 750);
        if (this.ctx.pulsePrompt) this.ctx.pulsePrompt();
        this.ctx.say(round.target); // repeat the question, never scold
      }
    }

    advance() {
      if (!this.alive) return;
      this.roundIndex += 1;
      if (this.roundIndex >= this.rounds.length) return this.finish();
      this.startRound();
    }

    tick(now) {
      if (!this.alive) return;
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;
      for (const b of this.bubbles) {
        if (b.el.classList.contains("is-popped") || b.el.classList.contains("is-scaffolded")) continue;
        if (!this.ctx.garden && !this.ctx.beginner && !this.ctx.reducedMotion?.()) b.y -= b.speed * this.heat.factor() * dt;
        else b.y = this.ctx.garden ? b.restY : 0.35;
        if (b.y < -0.18) b.y = 1.12; // drift forever until popped
        b.el.style.transform = `translate3d(${this.ctx.garden ? "-50%" : "0"}, ${b.y * this.skyH}px, 0)`;
      }
      requestAnimationFrame(this.tick);
    }

    finish() {
      this.alive = false;
      this.ctx.onDone(this.slips);
    }

    destroy() {
      this.alive = false;
      window.removeEventListener("resize", this.onResize);
    }
  }

  // ---------- Catch: slide the basket, catch what you hear ----------
  class CatchGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.rounds = buildRounds(ctx);
      this.roundIndex = 0;
      this.slips = 0;
      this.alive = true;
      this.fallers = [];
      this.still = !!ctx.reducedMotion?.();
      ctx.stage.innerHTML = `
        <svg class="catch-canopy" viewBox="0 0 600 90" preserveAspectRatio="none" aria-hidden="true"><path d="M-10 4Q60 80 151 24M610 3Q544 71 455 21" fill="none" stroke="#907049" stroke-width="10" stroke-linecap="round"/><g fill="#83a56c" stroke="#647e50" stroke-width="2"><path d="M31 24Q18 62 62 53Q66 27 31 24M90 36Q96 4 129 13Q132 37 90 36M552 21Q574 47 539 57Q520 37 552 21M502 35Q504 8 473 11Q459 36 502 35"/></g></svg><div class="catch-field"></div>
        <div class="catch-basket" tabindex="0" role="slider" aria-label="Move the basket" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
          ${ns.LettersGardenArt.seedBasket()}
        </div>`;
      this.field = ctx.stage.querySelector(".catch-field");
      this.basket = ctx.stage.querySelector(".catch-basket");
      ctx.stage.classList.toggle("catch-still",this.still);
      if(this.still){this.basket.removeAttribute("role");this.basket.removeAttribute("tabindex");this.basket.setAttribute("aria-hidden","true");}
      // Perf: fallers move via transform, height measured outside the loop.
      this.fieldH = this.field.clientHeight || 1;
      this.onResize = () => {
        this.fieldH = this.field.clientHeight || 1;
        this.positionBasket(this.basketX);
      };
      window.addEventListener("resize", this.onResize);
      this.heat = makeHeat();
      this.basketX = 0.5;
      const move = (event) => {
        if(this.still)return;
        const rect = ctx.stage.getBoundingClientRect();
        if (rect.width > 0) this.positionBasket((event.clientX - rect.left) / rect.width);
      };
      this.keyBasket = event => {
        const steps = {ArrowLeft:-.08, ArrowRight:.08};
        if (!(event.key in steps) && event.key !== 'Home' && event.key !== 'End') return;
        event.preventDefault();
        this.positionBasket(event.key === 'Home' ? 0 : event.key === 'End' ? 1 : this.basketX + steps[event.key]);
      };
      this.basket.addEventListener('keydown', this.keyBasket);
      this.moveBasket = move;
      ctx.stage.addEventListener("pointermove", move);
      ctx.stage.addEventListener("pointerdown", move);
      this.startRound();
      this.lastTime = performance.now();
      this.spawnTimer = 0;
      this.tick = this.tick.bind(this);
      requestAnimationFrame(this.tick);
    }

    positionBasket(x) {
      if (!this.alive || !Number.isFinite(x)) return;
      const width = this.ctx.stage.getBoundingClientRect().width;
      if (width <= 0) return;
      const edge = Math.min(.5, (this.basket.getBoundingClientRect().width / 2 + 2) / width);
      this.basketX = Math.max(edge, Math.min(1-edge, x));
      this.basket.style.left = `${this.basketX * 100}%`;
      const available = 1-2*edge;
      this.basket.setAttribute('aria-valuenow', String(available > 0 ? Math.round((this.basketX-edge)/available*100) : 50));
    }

    startRound() {
      const round = this.rounds[this.roundIndex];
      this.ctx.setPrompt(round.target);
      this.ctx.say(round.target);
      if(this.still)this.stationaryChoices(round);
    }

    stationaryChoices(round) {
      this.clearFallers();
      this.settling = false;
      round.options.forEach((item,i) => {
        const el=document.createElement('button');
        el.type='button';el.className='catch-faller catch-choice';
        el.setAttribute('aria-label',item.display);
        el.innerHTML=workshopTile(item.display,'leaf');
        const x=.18+(round.options.length>1?i*.64/(round.options.length-1):.32);
        el.style.left=`${x*100}%`;el.style.top='25%';
        const f={el,item,x};this.fallers.push(f);this.field.appendChild(el);
        el.addEventListener('click',()=>this.catchStationary(f));
      });
    }

    catchStationary(f) {
      if(!this.alive || this.settling || !this.fallers.includes(f))return;
      const round=this.rounds[this.roundIndex];
      this.positionBasket(f.x);
      if(f.item.id!==round.target.id){
        this.slips++;this.heat.down();this.ctx.sfx('wrong');
        round.options=round.options.filter(o=>o.id!==f.item.id);
        this.remove(f);this.ctx.say(round.target);return;
      }
      this.settling=true;f.el.disabled=true;f.el.style.top='72%';
      this.heat.up();this.ctx.sfx('correct');this.ctx.say(round.target);
      setTimeout(()=>{
        if(!this.alive)return;
        this.roundIndex++;
        if(this.roundIndex>=this.rounds.length)return this.finish();
        this.startRound();
      },550);
    }

    spawn() {
      const round = this.rounds[this.roundIndex];
      // Always keep the target reachable: alternate target / distractor.
      // (options is shuffled, so the target's slot is unknown — filter it out
      // rather than assuming it sits at index 0.)
      this.spawnFlip = !this.spawnFlip;
      const distractors = round.options.filter((o) => o.id !== round.target.id);
      const item = this.spawnFlip
        ? round.target
        : distractors[Math.floor(Math.random() * distractors.length)] || round.target;
      const el = document.createElement("div");
      el.className = "catch-faller";
      el.innerHTML = workshopTile(item.display,"leaf");
      const x = 0.12 + Math.random() * 0.76;
      el.style.left = `${x * 100}%`;
      this.field.appendChild(el);
      const pace = 1 + 0.2 * (this.ctx.level || 0);
      const f = { el, item, x, y: -0.15, speed: (0.16 + Math.random() * 0.05) * pace };
      el.style.transform = `translate3d(-50%, ${f.y * this.fieldH}px, 0)`;
      this.fallers.push(f);
    }

    tick(now) {
      if (!this.alive || this.still) return;
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.fallers.length < 3) {
        this.spawn();
        this.spawnTimer = 1.1;
      }
      const round = this.rounds[this.roundIndex];
      for (const f of this.fallers.slice()) {
        f.y += f.speed * this.heat.factor() * dt;
        f.el.style.transform = `translate3d(-50%, ${f.y * this.fieldH}px, 0)`;
        // Catch zone: bottom strip, basket overlap.
        if (f.y > 0.78 && f.y < 0.9 && Math.abs(f.x - this.basketX) < 0.13) {
          this.remove(f);
          if (f.item.id === round.target.id) {
            this.heat.up();
            this.ctx.sfx("correct");
            this.ctx.confettiAt(this.basket);
            this.ctx.say(round.target);
            this.roundIndex += 1;
            if (this.roundIndex >= this.rounds.length) return this.finish();
            this.clearFallers();
            this.startRound();
            return requestAnimationFrame(this.tick);
          }
          this.slips += 1;
          this.heat.down();
          this.ctx.sfx("wrong");
          this.basket.classList.remove("is-shake");
          void this.basket.offsetWidth;
          this.basket.classList.add("is-shake");
          // Scaffolded retry: that distractor doesn't fall again this round.
          round.options = round.options.filter(
            (o) => o.id === round.target.id || o.id !== f.item.id,
          );
        } else if (f.y > 1.05) {
          this.remove(f);
        }
      }
      requestAnimationFrame(this.tick);
    }

    remove(f) {
      f.el.remove();
      this.fallers = this.fallers.filter((x) => x !== f);
    }

    clearFallers() {
      for (const f of this.fallers) f.el.remove();
      this.fallers = [];
    }

    finish() {
      this.alive = false;
      this.destroy();
      this.ctx.onDone(this.slips);
    }

    destroy() {
      this.alive = false;
      window.removeEventListener("resize", this.onResize);
      this.ctx.stage.removeEventListener("pointermove",this.moveBasket);
      this.ctx.stage.removeEventListener("pointerdown",this.moveBasket);
      this.basket.removeEventListener('keydown',this.keyBasket);
      this.clearFallers();
    }
  }

  // ---------- Pairs: find the two that belong together ----------
  class PairsGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      this.slips = 0;
      this.boards = 2;
      this.boardIndex = 0;
      this.buildBoard();
    }

    buildBoard() {
      if (!this.alive) return;
      const ctx = this.ctx;
      // Three pairs. When items carry a `match` (forms worlds), the pair is
      // form ↔ isolated letter; otherwise two copies of the same item.
      const picks = [];
      const seen = new Set();
      for (const item of shuffle(ctx.items)) {
        if (picks.length >= 3) break;
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        picks.push(item);
      }
      const cards = [];
      for (const item of picks) {
        cards.push({ id: item.id, display: item.display, speak: item.speak, audioPath: item.audioPath });
        cards.push({
          id: item.id,
          display: item.match || item.display,
          speak: item.speak,
          audioPath: item.audioPath,
        });
      }
      this.cards = shuffle(cards);
      this.selected = null;
      this.matched = 0;
      ctx.stage.innerHTML = `<div class="pairs-grid"></div>`;
      const grid = ctx.stage.querySelector(".pairs-grid");
      ctx.setPrompt(null);
      for (const card of this.cards) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "pairs-card";
        el.innerHTML = workshopTile(card.display,"leaf");
        el.setAttribute("aria-label",card.display);
        el.setAttribute("aria-pressed","false");
        el.addEventListener("click", () => this.pick(card, el));
        card.el = el;
        grid.appendChild(el);
      }
      // Wordless instruction: one matching pair glows in sync for a moment —
      // "see? these two belong together" — then the child takes over.
      const demoId = this.cards[0].id;
      const demoEls = this.cards.filter((c) => c.id === demoId).map((c) => c.el);
      for (const el of demoEls) el.classList.add("is-demo");
      setTimeout(() => {
        if (!this.alive) return;
        for (const el of demoEls) el.classList.remove("is-demo");
      }, 1500);
    }

    pick(card, el) {
      if (!this.alive || el.classList.contains("is-matched")) return;
      this.cards.forEach(c=>c.el.classList.remove("is-demo"));
      if (!this.selected) {
        this.ctx.say(card);
        this.selected = { card, el };
        el.classList.add("is-selected");
        el.setAttribute("aria-pressed","true");
        return;
      }
      if (this.selected.el === el) {
        el.classList.remove("is-selected");
        el.setAttribute("aria-pressed","false");
        this.selected = null;
        return;
      }
      const first = this.selected;
      this.selected = null;
      first.el.classList.remove("is-selected");
      first.el.setAttribute("aria-pressed","false");
      if (first.card.id === card.id) {
        this.ctx.say(card);
        first.el.classList.add("is-matched");
        el.classList.add("is-matched");
        first.el.disabled=true;el.disabled=true;
        this.ctx.sfx("correct");
        this.ctx.confettiAt(el);
        this.matched += 1;
        if (this.matched >= 3) setTimeout(() => this.nextBoard(), 650);
      } else {
        // Keep the reference visible: retry means finding its partner, not
        // remembering and selecting the first card all over again.
        this.selected = first;
        first.el.classList.add("is-selected");
        first.el.setAttribute("aria-pressed","true");
        this.ctx.say(first.card);
        this.slips += 1;
        this.ctx.sfx("wrong");
        for (const e of [el]) {
          e.classList.remove("is-shake");
          void e.offsetWidth;
          e.classList.add("is-shake");
        }
      }
    }

    nextBoard() {
      if (!this.alive) return;
      this.boardIndex += 1;
      if (this.boardIndex >= this.boards) { this.alive=false; return this.ctx.onDone(this.slips); }
      this.buildBoard();
    }

    destroy() { this.alive = false; this.stopHint?.(); }
  }

  // ---------- Feed: give the hungry creature what it asks for ----------
  class FeedGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      this.rounds = buildRounds(ctx);
      this.roundIndex = 0;
      this.slips = 0;
      ctx.stage.innerHTML = `
        <div class="feed-scene">
          <div class="feed-creature">${ctx.garden && ctx.petArt ? ctx.petArt() : Art.creature({ hue: ctx.garden ? 150 : (ctx.hue + 140) % 360 })}</div>
          ${ctx.garden ? `<button type="button" class="feed-basket" aria-label="Deliver the selected seed packet" aria-disabled="true" disabled>${ns.LettersGardenArt.seedBasket()}</button>` : ""}
          <div class="feed-tray"></div>
        </div>`;
      this.creatureEl = ctx.stage.querySelector(".feed-creature");
      this.tray = ctx.stage.querySelector(".feed-tray");
      this.dragResets=[];
      this.basket=ctx.stage.querySelector('.feed-basket');
      if(this.basket)this.basket.onclick=()=>{if(this.selected)this.offer(this.selected.item,this.selected.el);};
      this.startRound();
    }

    startRound() {
      if (!this.alive) return;
      this.dragResets.forEach(reset=>reset());this.dragResets=[];this.selected=null;
      if(this.basket){this.basket.classList.remove("is-ready","is-filled");this.basket.setAttribute("aria-disabled","true");this.basket.disabled=true;}
      const round = this.rounds[this.roundIndex];
      this.ctx.setPrompt(round.target);
      this.ctx.say(round.target);
      this.tray.innerHTML = "";
      for (const item of round.options) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "feed-food";
        el.innerHTML = this.ctx.garden ? `<svg viewBox="-52 -66 104 132" aria-hidden="true">
          <path d="M-43-58Q0-66 43-58L46 52Q0 65-46 52Z" fill="#e9c995" stroke="#59452e" stroke-width="3"/>
          <path d="M-40-48Q0-53 40-48M-41 47Q0 54 41 47" fill="none" stroke="#b28c57" stroke-width="2" stroke-dasharray="3 3"/>
          <rect x="-39" y="-38" width="78" height="78" rx="16" fill="#fffaf0"/>
          ${glyphText(item.display,{maxSize:44})}
          <path d="M0-48Q-15-60-17-51Q-15-44 0-46Q14-60 18-53Q18-45 0-46" fill="#739463"/>
        </svg>` : tileHTML(item, this.ctx.hue);
        el.setAttribute("aria-label", item.display);
        if(this.ctx.garden){
          el.setAttribute("aria-pressed","false");
          this.dragResets.push(ns.GardenPractice.draggable(el,{enabled:()=>this.alive&&!this.feeding&&!el.disabled,drop:(x,y)=>{if(ns.GardenPractice.inside(this.basket,x,y))this.offer(item,el);}}));
          el.addEventListener('click',()=>{
            if(!this.alive||this.feeding||el.disabled)return;
            if(this.selected?.el===el){this.selected=null;el.setAttribute("aria-pressed","false");this.basket.classList.remove("is-ready");this.basket.setAttribute("aria-disabled","true");this.basket.disabled=true;return;}
            this.selected={item,el};
            this.basket.classList.add("is-ready");this.basket.setAttribute("aria-disabled","false");this.basket.disabled=false;
            this.tray.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));
          });
        }else el.addEventListener("click", () => this.offer(item, el));
        this.tray.appendChild(el);
      }
    }

    offer(item, el) {
      const round = this.rounds[this.roundIndex];
      if (!this.alive || this.feeding || el.disabled || el.classList.contains("is-scaffolded")) return;
      if (item.id !== round.target.id) {
        el.disabled=true; this.selected=null;
        el.setAttribute("aria-pressed","false");
        if(this.basket){this.basket.classList.remove("is-ready");this.basket.setAttribute("aria-disabled","true");this.basket.disabled=true;}
        this.slips += 1;
        this.ctx.sfx("wrong");
        el.classList.remove("is-shake");
        void el.offsetWidth;
        el.classList.add("is-shake");
        this.ctx.say(round.target);
        // Scaffolded retry: the refused food quietly leaves the tray.
        const retryRound=this.roundIndex;
        setTimeout(() => {if(this.alive&&this.roundIndex===retryRound)el.classList.add("is-scaffolded");}, 650);
        return;
      }
      this.feeding = true;
      this.tray?.querySelectorAll("button").forEach(b=>b.disabled=true);
      // Match the delivery destination to the interaction: basket for seeds, mouth for food.
      if(this.basket){this.basket.classList.remove("is-ready");this.basket.setAttribute("aria-disabled","true");this.basket.disabled=true;}
      const from = el.getBoundingClientRect();
      const mouth = (this.basket || this.creatureEl).getBoundingClientRect();
      el.style.setProperty("--fly-x", `${mouth.left + mouth.width / 2 - (from.left + from.width / 2)}px`);
      el.style.setProperty("--fly-y", `${mouth.top + mouth.height * (this.basket ? 0.48 : 0.68) - (from.top + from.height / 2)}px`);
      el.classList.add("is-flying");
      this.ctx.sfx("correct");
      setTimeout(() => {
        if (!this.alive) return;
        if(this.basket)this.basket.classList.add("is-filled");
        this.creatureEl.classList.remove("is-chomp");
        void this.creatureEl.offsetWidth;
        this.creatureEl.classList.add("is-chomp");
        this.ctx.confettiAt(this.creatureEl);
        this.ctx.say(round.target);
      }, 420);
      setTimeout(() => {
        if (!this.alive) return;
        this.feeding = false;
        this.roundIndex += 1;
        if (this.roundIndex >= this.rounds.length) { this.alive = false; return this.ctx.onDone(this.slips); }
        this.startRound();
      }, 1000);
    }

    destroy() { this.alive = false; this.dragResets?.forEach(reset=>reset()); }
  }

  // ---------- Trace: write the letter with your finger ----------
  // Brain Age's signature mechanic, kid-sized: a huge pale letter is the
  // guide, the child crayons over it, and covering enough of the glyph wins.
  // No stroke-order pedantry — coverage is the goal, scribbling feels great.
  class TraceGame {
    constructor(ctx) {
      this.ctx = ctx;
      const pool = shuffle(ctx.items).filter((i) => (i.display || "").length <= 3);
      this.targets = (pool.length ? pool : shuffle(ctx.items)).slice(0, 3);
      this.roundIndex = 0;
      this.slips = 0;
      this.alive = true;
      ctx.stage.innerHTML = `
        <div class="trace-wrap">
          <div class="trace-paper"><canvas class="trace-canvas" aria-label="Draw over the letter with your finger"></canvas></div>
          <div class="trace-tools">
            <svg class="trace-crayon" viewBox="0 0 150 40" aria-hidden="true"><path d="M8 20L29 7H128Q140 20 128 33H29Z" fill="#579475" stroke="#4a5940" stroke-width="3" stroke-linejoin="round"/><path d="M8 20L29 7V33Z" fill="#e5c68e"/><path d="M8 20L16 15V25Z" fill="#387258"/><path d="M48 8H110V32H48Z" fill="#cce4b8"/><path d="M57 13H100" stroke="#f9ffe9" stroke-width="3" stroke-linecap="round"/><path d="M73 28Q62 17 70 18Q78 18 81 28Q83 13 91 17Q95 24 81 28" fill="#65965c"/></svg>
            <button type="button" class="lg-round-btn trace-clear" aria-label="Clear your drawing"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 28L27 10Q30 7 33 10L41 18Q43 21 40 24L24 40H20Z" fill="#eb9d9a" stroke="#59452e" stroke-width="3" stroke-linejoin="round"/><path d="M10 28L18 20L32 32L24 40H20Z" fill="#fff4db" stroke="#59452e" stroke-width="3"/><path d="M30 40H42" stroke="#927f62" stroke-width="3" stroke-linecap="round"/></svg></button>
          </div>
        </div>`;
      this.canvas = ctx.stage.querySelector(".trace-canvas");
      ctx.stage.querySelector(".trace-clear").addEventListener("click", () => this.clearDrawing());
      this.drawing = false;
      this.canvas.addEventListener("pointerdown", (e) => this.penDown(e));
      this.canvas.addEventListener("pointermove", (e) => this.penMove(e));
      this.canvas.addEventListener("pointercancel", () => { this.drawing = false; });
      this.canvas.addEventListener("lostpointercapture", () => { this.drawing = false; });
      window.addEventListener("pointerup", (this.penUpBound = () => this.penUp()));
      // The glyph guide needs the Quran font; wait for it, then start.
      const ready = document.fonts && document.fonts.load ? document.fonts.load('100px "Amiri Quran"') : Promise.resolve();
      ready.finally(() => {
        if (this.alive) this.startRound();
      });
    }

    drawGuideText(size, x, y) {
      const target = this.targets[this.roundIndex];
      // System Arabic fonts (Geeza Pro, Segoe UI, Noto) hug harakat close to
      // the letter; Amiri Quran floats them a canvas apart at tracing sizes.
      this.g.font = `${size}px "Geeza Pro", "Segoe UI", "Noto Naskh Arabic", "Arial", sans-serif`;
      this.g.textAlign = "center";
      this.g.textBaseline = "middle";
      this.g.direction = "rtl";
      this.g.fillStyle = "#e2e9cf";
      this.g.fillText(target.display, x, y);
      this.g.strokeStyle = "#9bae80";
      this.g.lineWidth = 2;
      this.g.strokeText(target.display, x, y);
    }

    inkBounds(w, h) {
      const img = this.g.getImageData(0, 0, w, h).data;
      let minX = w, maxX = 0, minY = h, maxY = 0, any = false;
      for (let y = 0; y < h; y += 3) {
        for (let x = 0; x < w; x += 3) {
          if (img[(y * w + x) * 4 + 3] > 60) {
            any = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      return any ? { minX, maxX, minY, maxY } : null;
    }

    startRound() {
      if (!this.alive) return;
      this.advancing = false;
      const target = this.targets[this.roundIndex];
      this.ctx.setPrompt(target);
      this.ctx.say(target);
      const wrap = this.canvas.parentElement;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      this.canvas.width = w;
      this.canvas.height = h;
      this.g = this.canvas.getContext("2d", { willReadFrequently: true });

      // Amiri Quran's font metrics put the ink far from the em-box centre,
      // so we measure the actual drawn pixels and re-draw with a correction
      // (shrinking first if the glyph would spill past the paper).
      let size = Math.min(w, h) * 0.95;
      this.g.clearRect(0, 0, w, h);
      this.drawGuideText(size, w / 2, h * 0.5);
      let box = this.inkBounds(w, h);
      if (box) {
        const scale = Math.min(1, (0.8 * w) / (box.maxX - box.minX + 1), (0.72 * h) / (box.maxY - box.minY + 1));
        if (scale < 0.98) {
          size *= scale;
          this.g.clearRect(0, 0, w, h);
          this.drawGuideText(size, w / 2, h * 0.5);
          box = this.inkBounds(w, h);
        }
      }
      if (box) {
        const dx = w / 2 - (box.minX + box.maxX) / 2;
        const dy = h / 2 - (box.minY + box.maxY) / 2;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          this.g.clearRect(0, 0, w, h);
          this.drawGuideText(size, w / 2 + dx, h * 0.5 + dy);
        }
      }

      // Remember which pixels belong to the glyph (sampled grid)...
      const img = this.g.getImageData(0, 0, w, h).data;
      this.guide = [];
      const step = 5;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          if (img[(y * w + x) * 4 + 3] > 60) this.guide.push([x, y]);
        }
      }
      // ...and split them into connected clusters. The letter body is one
      // cluster; each dot is its own — and EVERY cluster must be traced, so
      // ب without its dot doesn't pass.
      const cellSet = new Set(this.guide.map(([x, y]) => `${x}|${y}`));
      const seen = new Set();
      this.clusters = [];
      for (const [x, y] of this.guide) {
        const key = `${x}|${y}`;
        if (seen.has(key)) continue;
        const cluster = [];
        const queue = [[x, y]];
        seen.add(key);
        while (queue.length) {
          const [cx, cy] = queue.pop();
          cluster.push(`${cx}|${cy}`);
          for (const [nx, ny] of [[cx - step, cy], [cx + step, cy], [cx, cy - step], [cx, cy + step], [cx - step, cy - step], [cx + step, cy + step], [cx - step, cy + step], [cx + step, cy - step]]) {
            const nkey = `${nx}|${ny}`;
            if (cellSet.has(nkey) && !seen.has(nkey)) {
              seen.add(nkey);
              queue.push([nx, ny]);
            }
          }
        }
        this.clusters.push(cluster);
      }

      this.brush = Math.max(20, size * 0.1);
      this.g.lineCap = "round";
      this.g.lineJoin = "round";
      this.g.strokeStyle = "#4e9677";
      this.g.lineWidth = this.brush;
      this.paint = new Set(); // painted sample cells, keyed x|y
    }

    clearDrawing() {
      if (this.alive && !this.advancing) {this.drawing=false;this.startRound();}
    }

    pos(e) {
      const rect = this.canvas.getBoundingClientRect();
      return [(e.clientX - rect.left) * this.canvas.width / rect.width, (e.clientY - rect.top) * this.canvas.height / rect.height];
    }

    penDown(e) {
      if (!this.alive || this.advancing || !this.g || this.drawing || e.button>0) return;
      this.drawing = true;
      this.last = this.pos(e);
      this.canvas.setPointerCapture?.(e.pointerId);
      // A plain tap must leave ink too — kids dot the dots with single taps,
      // and letters like ب can't pass their dot-cluster check without it.
      if (this.g) {
        const [x, y] = this.last;
        const r = this.brush / 2;
        this.g.beginPath();
        this.g.arc(x, y, r, 0, Math.PI * 2);
        this.g.fillStyle = this.g.strokeStyle;
        this.g.fill();
        for (let dy = -r; dy <= r; dy += 5) {
          for (let dx = -r; dx <= r; dx += 5) {
            if (dx * dx + dy * dy > r * r) continue;
            this.paint.add(`${Math.round((x + dx) / 5) * 5}|${Math.round((y + dy) / 5) * 5}`);
          }
        }
      }
    }

    penMove(e) {
      if (!this.drawing || !this.alive || this.advancing) return;
      const [x, y] = this.pos(e);
      this.g.beginPath();
      this.g.moveTo(this.last[0], this.last[1]);
      this.g.lineTo(x, y);
      this.g.stroke();
      // Record painted cells along the segment.
      const r = this.brush / 2;
      const steps = Math.max(1, Math.hypot(x - this.last[0], y - this.last[1]) / 4);
      for (let i = 0; i <= steps; i += 1) {
        const px = this.last[0] + ((x - this.last[0]) * i) / steps;
        const py = this.last[1] + ((y - this.last[1]) * i) / steps;
        for (let dy = -r; dy <= r; dy += 5) {
          for (let dx = -r; dx <= r; dx += 5) {
            if (dx * dx + dy * dy > r * r) continue;
            this.paint.add(`${Math.round((px + dx) / 5) * 5}|${Math.round((py + dy) / 5) * 5}`);
          }
        }
      }
      this.last = [x, y];
    }

    clusterCoverage(cluster) {
      let n = 0;
      for (const key of cluster) if (this.paint.has(key)) n += 1;
      return n / cluster.length;
    }

    penUp() {
      if (!this.drawing || !this.alive || this.advancing) return;
      this.drawing = false;
      if (!this.guide.length) return;
      const covered = this.guide.reduce(
        (n, [x, y]) => n + (this.paint.has(`${x}|${y}`) ? 1 : 0),
        0,
      );
      const total = covered / this.guide.length;
      const missing = (this.clusters || []).filter((c) => this.clusterCoverage(c) < 0.45);
      if (total >= 0.55 && !missing.length) {
        this.advancing = true;
        const target = this.targets[this.roundIndex];
        this.ctx.sfx("correct");
        this.ctx.confettiAt(this.canvas);
        this.ctx.say(target);
        setTimeout(() => {
          if (!this.alive) return;
          this.roundIndex += 1;
          if (this.roundIndex >= this.targets.length) return this.finish();
          this.startRound();
        }, 700);
        return;
      }
      // Body done but a cluster (usually the dots!) still untouched: pulse a
      // gentle ring over the smallest missing cluster to point at it.
      if (total >= 0.4 && missing.length) {
        const smallest = missing.reduce((a, b) => (a.length <= b.length ? a : b));
        let sx = 0, sy = 0;
        for (const key of smallest) {
          const [x, y] = key.split("|").map(Number);
          sx += x;
          sy += y;
        }
        const hint = document.createElement("i");
        hint.className = "trace-hint";
        hint.style.left = `${sx / smallest.length}px`;
        hint.style.top = `${sy / smallest.length}px`;
        this.canvas.parentElement.appendChild(hint);
        this.ctx.sfx("page");
        setTimeout(() => hint.remove(), 1200);
      }
    }

    finish() {
      this.alive = false;
      window.removeEventListener("pointerup", this.penUpBound);
      this.ctx.onDone(this.slips);
    }

    destroy() {
      this.alive = false;
      window.removeEventListener("pointerup", this.penUpBound);
    }
  }

  // ---------- Burst: the gentle speed round (Calculations x25 spirit) ----------
  // Thirty seconds, a shrinking sun-ring, tap the tile you hear, count only
  // ever goes UP — speed pressure without any way to lose.
  class BurstGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.count = 0;
      this.alive = true;
      this.duration = 30000;
      this.endsAt = performance.now() + this.duration;
      ctx.stage.innerHTML = `
        <div class="burst-head">
          <svg class="burst-ring" viewBox="0 0 60 60" aria-hidden="true">
            <circle cx="30" cy="30" r="25" fill="#fffdf4" stroke="#e6dcc2" stroke-width="6"/>
            <circle class="burst-ring-fill" cx="30" cy="30" r="25" fill="none" stroke="#f3a53c" stroke-width="6"
              stroke-linecap="round" stroke-dasharray="157" transform="rotate(-90 30 30)"/>
          </svg>
          <span class="burst-count">0</span>
        </div>
        <div class="burst-grid"></div>`;
      this.ringEl = ctx.stage.querySelector(".burst-ring-fill");
      this.countEl = ctx.stage.querySelector(".burst-count");
      this.grid = ctx.stage.querySelector(".burst-grid");
      this.heat = makeHeat();
      this.nextTarget();
      this.tick = this.tick.bind(this);
      requestAnimationFrame(this.tick);
      // rAF stalls in hidden/backgrounded tabs — a plain interval guarantees
      // the round still ends on time.
      this.endTimer = setInterval(() => this.tick(performance.now(), false), 500);
    }

    nextTarget() {
      const pool = shuffle(this.ctx.items);
      this.target = pool[0];
      // Rubber band: the grid grows from 4 tiles toward 6 as the streak
      // heats up, and shrinks back after misses.
      const tileCount = Math.min(4 + Math.floor((this.heat ? this.heat.value() : 0) / 2), 6, pool.length);
      const tiles = pool.slice(0, tileCount);
      if (!tiles.includes(this.target)) tiles[0] = this.target;
      this.ctx.setPrompt(this.target);
      this.ctx.say(this.target);
      this.grid.innerHTML = "";
      for (const item of shuffle(tiles)) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "burst-tile";
        el.innerHTML = workshopTile(item.display,"leaf");
        el.setAttribute("aria-label",item.display);
        el.addEventListener("click", () => this.tap(item, el));
        this.grid.appendChild(el);
      }
    }

    tap(item, el) {
      if (!this.alive) return;
      // Input and timer callbacks can arrive in either order at the deadline.
      // Settle the round before accepting a final tap, using the same clock.
      this.tick(performance.now(), false);
      if (!this.alive || !this.grid.contains(el)) return;
      if (item.id === this.target.id) {
        this.count += 1;
        this.heat.up();
        this.countEl.textContent = String(this.count);
        this.ctx.sfx("correct");
        el.classList.add("is-popped");
        this.nextTarget();
      } else {
        this.heat.down();
        this.ctx.sfx("wrong");
        el.classList.remove("is-shake");
        void el.offsetWidth;
        el.classList.add("is-shake");
      }
    }

    tick(now, schedule = true) {
      if (!this.alive) return;
      const left = Math.max(0, this.endsAt - now);
      this.ringEl.style.strokeDashoffset = String(157 * (1 - left / this.duration));
      if (left <= 0) {
        this.alive = false;
        clearInterval(this.endTimer);
        // Stars by harvest: 10+ shines, 6+ solid, anything else still a star.
        this.ctx.onDone(this.count >= 10 ? 0 : this.count >= 6 ? 2 : 3);
        return;
      }
      if(schedule)requestAnimationFrame(this.tick);
    }

    destroy() {
      this.alive = false;
      clearInterval(this.endTimer);
    }
  }

  // ---------- Build: blend the sounds into a word ----------
  // Synthetic phonics' key moment. The mascot says the whole thing (بَتْ,
  // "bat"); the child taps sound-tiles in order and watches them snap into
  // the slots right-to-left. Each tile speaks as it's placed; a correct
  // build speaks the blended whole. Items must carry `parts`.
  class BuildGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      const pool = ctx.items.filter((i) => i.parts && i.parts.length >= 2);
      this.targets = shuffle(pool).slice(0, 4);
      this.roundIndex = 0;
      this.slips = 0;
      this.startRound();
    }

    startRound() {
      if (!this.alive) return;
      const ctx = this.ctx;
      const target = this.targets[this.roundIndex];
      ctx.setPrompt(target);
      ctx.say(target);
      this.placed = [];
      // Tray: the real parts plus two decoy parts from other items.
      const decoys = [];
      const seen = new Set(target.parts.map((p) => p.display));
      for (const item of shuffle(ctx.items)) {
        if (decoys.length >= 2) break;
        for (const part of item.parts || []) {
          if (decoys.length >= 2) break;
          if (seen.has(part.display)) continue;
          seen.add(part.display);
          decoys.push(part);
        }
      }
      this.tray = shuffle([...target.parts, ...decoys]);
      ctx.stage.innerHTML = `
        <div class="build-scene">
          <div class="build-slots" dir="rtl">
            ${target.parts.map((_,i) => `<button type="button" class="build-slot" data-slot="${i}" aria-label="Empty building space" disabled></button>`).join("")}
          </div>
          <div class="build-tray">
            ${this.tray.map((part, i) => `<button type="button" class="build-tile" data-i="${i}" aria-label="${part.display}">${workshopTile(part.display)}</button>`).join("")}
          </div>
        </div>`;
      this.slots = [...ctx.stage.querySelectorAll(".build-slot")];
      this.slots.forEach((slot,i)=>slot.addEventListener('click',()=>this.returnFrom(i)));
      for (const btn of ctx.stage.querySelectorAll(".build-tile")) {
        btn.addEventListener("click", () => this.place(btn));
      }
    }

    place(btn) {
      const target = this.targets[this.roundIndex];
      if (!this.alive || btn.disabled || (this.ctx.stage&&!this.ctx.stage.contains(btn)) || btn.classList.contains("is-scaffolded") || btn.classList.contains("is-used") || this.placed.length >= target.parts.length) return;
      const part = this.tray[Number(btn.dataset.i)];
      const slot = this.slots[this.placed.length];
      slot.innerHTML = workshopTile(part.display)+`<span class="build-undo-cue" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M5 7H11A5 5 0 1 1 10 17M5 7L8 3M5 7L9 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
      slot.disabled=false;
      slot.setAttribute('aria-label',`Return ${part.display} and following pieces`);
      slot.classList.add("is-filled");
      btn.classList.add("is-used");btn.disabled=true;
      this.placed.push({ part, btn, slot });
      this.ctx.say({ display: part.display, speak: part.speak || part.display });

      if (this.placed.length < target.parts.length) return;
      this.slots.forEach(slot=>{slot.disabled=true;});
      this.ctx.stage.querySelectorAll(".build-tile").forEach(b=>b.disabled=true);
      const built = this.placed.every((p, i) => p.part.display === target.parts[i].display);
      if (built) {
        this.ctx.sfx("correct");
        this.ctx.confettiAt(this.ctx.stage.querySelector(".build-slots"));
        // The payoff: the parts become the whole, and the whole speaks.
        setTimeout(() => { if(!this.alive)return;
          this.ctx.stage.querySelector('.build-slots').innerHTML=`<div class="build-whole">${workshopTile(target.display)}</div>`;
          this.ctx.say(target);
        }, 500);
        setTimeout(() => {
        if (!this.alive) return;
          this.roundIndex += 1;
          if (this.roundIndex >= this.targets.length) { this.alive=false; return this.ctx.onDone(this.slips); }
          this.startRound();
        }, 1400);
      } else {
        this.slips += 1;
        this.ctx.sfx("wrong");
        const slotsEl = this.ctx.stage.querySelector(".build-slots");
        slotsEl.classList.remove("is-shake");
        void slotsEl.offsetWidth;
        slotsEl.classList.add("is-shake");
        // Scaffolded retry: one decoy that led the build astray leaves.
        const strayed = this.placed.find(
          (p) => !target.parts.some((tp) => tp.display === p.part.display),
        );
        setTimeout(() => {
        if (!this.alive) return;
          for (const p of this.placed) {
            p.slot.innerHTML = "";
            p.slot.disabled=true;
            p.slot.setAttribute('aria-label','Empty building space');
            p.slot.classList.remove("is-filled");
            p.btn.classList.remove("is-used");p.btn.disabled=false;
          }
          this.ctx.stage.querySelectorAll(".build-tile").forEach(b=>b.disabled=b.classList.contains("is-scaffolded"));
          this.placed = [];
          if (strayed) {strayed.btn.classList.add("is-scaffolded");strayed.btn.disabled=true;}
          this.ctx.say(target);
        }, 800);
      }
    }

    returnFrom(index) {
      if(!this.alive || !Number.isInteger(index) || index<0 || index>=this.placed.length ||
        this.placed.length>=this.targets[this.roundIndex].parts.length)return;
      const removed=this.placed.splice(index);
      for(const {slot,btn} of removed){
        slot.innerHTML='';slot.disabled=true;
        slot.setAttribute('aria-label','Empty building space');
        slot.classList.remove('is-filled');btn.classList.remove('is-used');btn.disabled=false;
      }
      // Keep the order of the surviving prefix. A motor correction is not a
      // completed answer, so it neither adds a slip nor triggers reward logic.
      removed[0].btn.focus({preventScroll:true});
      this.ctx.say(this.targets[this.roundIndex]);
    }

    destroy() { this.alive = false; this.stopHint?.(); }
  }

  // ---------- Blend Machine: drag letter and vowel together, hear them fuse ----------
  // The moment of learning to read, made tactile (spec: specs/02-letter-garden-v2.md):
  // the letter and its haraka are two physical friends; push them into each
  // other and the syllable pops out and SPEAKS. Early rounds are pure
  // mechanic joy (only the true pair on stage); later rounds add a decoy
  // vowel, so the child must blend the pair they HEARD.
  class BlendGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      const pool = ctx.items.filter((i) => i.parts && i.parts.length === 2);
      const targets = shuffle(pool).slice(0, 4);
      while (targets.length < 4 && pool.length) targets.push(pool[targets.length % pool.length]);
      this.rounds = targets.map((target, r) => {
        let decoy = null;
        if (r >= 2) {
          const other = shuffle(pool).find(
            (i) => i.parts[1].display !== target.parts[1].display,
          );
          if (other) decoy = other.parts[1];
        }
        return { target, decoy };
      });
      this.roundIndex = 0;
      this.slips = 0;
      this.startRound();
    }

    startRound() {
      if (!this.alive) return;
      const ctx = this.ctx;
      const { target, decoy } = this.rounds[this.roundIndex];
      ctx.setPrompt(target);
      ctx.say(target);

      // Letter enters from the right (reading direction), vowels wait left.
      const parts = [
        { part: target.parts[0], kind: "letter", x: 72, y: 46 },
        { part: target.parts[1], kind: "vowel", x: 26, y: decoy ? 28 : 46 },
      ];
      if (decoy) parts.push({ part: decoy, kind: "vowel", x: 26, y: 66 });

      ctx.stage.innerHTML = `
        <div class="blend-scene">
          <div class="blend-glow"></div>
          ${parts
            .map(
              (p, i) => `
            <button type="button" class="blend-part" data-i="${i}" data-kind="${p.kind}" aria-label="${p.part.display}"
              style="left:${p.x}%; top:${p.y}%">${workshopTile(p.part.display)}</button>`,
            )
            .join("")}
        </div>`;

      this.scene = ctx.stage.querySelector(".blend-scene");
      this.parts = parts;
      this.els = [...ctx.stage.querySelectorAll(".blend-part")];
      this.merging = false;
      this.retrying = false;
      this.selected = null;
      this.els.forEach((el) => {el.setAttribute("aria-pressed","false");this.wireDrag(el);});
      // Nudge the pieces toward the middle of the machine so "bring these
      // together" is visible before the child has tried anything.
      if (this.stopHint) this.stopHint();
      this.stopHint = dragHint(this.els, this.scene);
    }

    // Drag with a tap fallback: a real drag pushes a tile around; a simple
    // tap lifts it, and tapping a second tile blends the two — small fingers
    // get both physics and forgiveness.
    wireDrag(el) {
      let startX = 0;
      let startY = 0;
      let baseL = 0;
      let baseT = 0;
      let moved = false;

      el.addEventListener("pointerdown", (e) => {
        if (e.button>0 || !this.alive || this.merging || this.retrying || el.classList.contains("is-scaffolded") || el.classList.contains("is-gone")) return;
        el.setPointerCapture(e.pointerId);
        startX = e.clientX;
        startY = e.clientY;
        baseL = el.offsetLeft;
        baseT = el.offsetTop;
        moved = false;
        if (this.stopHint) this.stopHint();
        el.classList.add("is-held");
        const idx = Number(el.dataset.i);
        const p = this.parts[idx].part;
        this.ctx.say({ display: p.display, speak: p.speak || p.display });
      });

      el.addEventListener("pointermove", (e) => {
        if (!el.classList.contains("is-held") || this.merging) return;
        const bounds = this.scene.getBoundingClientRect();
        const dx = (e.clientX - startX) * this.scene.clientWidth / bounds.width;
        const dy = (e.clientY - startY) * this.scene.clientHeight / bounds.height;
        if (Math.hypot(dx, dy) > 8) moved = true;
        if (moved) {
          el.style.left = `${Math.max(el.offsetWidth/2,Math.min(this.scene.clientWidth-el.offsetWidth/2,baseL+dx))}px`;
          el.style.top = `${Math.max(el.offsetHeight/2,Math.min(this.scene.clientHeight-el.offsetHeight/2,baseT+dy))}px`;
          const hit = this.hitOther(el);
          this.els.forEach((o) => o.classList.toggle("is-near", o === hit));
        }
      });

      const cancel = () => {
        el.classList.remove("is-held");
        this.els.forEach(o=>o.classList.remove("is-near"));
        if(this.alive&&!this.merging)this.springBack(el);
      };
      el.addEventListener("pointercancel",cancel);
      el.addEventListener("lostpointercapture",()=>{if(el.classList.contains("is-held"))cancel();});
      el.addEventListener("pointerup", () => {
        if (!el.classList.contains("is-held")) return;
        el.classList.remove("is-held");
        this.els.forEach((o) => o.classList.remove("is-near"));
        if (this.merging) return;
        if (moved) {
          const other = this.hitOther(el);
          if (other) this.tryBlend(el, other);
          else this.springBack(el);
          return;
        }
        this.selectPart(el);
      });
      el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.selectPart(el);}});
    }

    selectPart(el) {
      if(!this.alive||this.merging||this.retrying||el.disabled||!this.els.includes(el))return;
      this.stopHint?.();
      const previous=this.selected;
      this.els.forEach(e=>{e.classList.remove('is-lifted');e.setAttribute('aria-pressed','false');});
      this.selected=null;
      if(previous&&previous!==el){this.tryBlend(previous,el);return;}
      if(previous===el)return;
      this.selected=el;el.classList.add('is-lifted');el.setAttribute('aria-pressed','true');
      this.ctx.say(this.parts[Number(el.dataset.i)].part);
    }

    hitOther(el) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      for (const other of this.els) {
        if (other === el || other.disabled || other.classList.contains("is-scaffolded") || other.classList.contains("is-gone")) continue;
        const o = other.getBoundingClientRect();
        if (Math.hypot(o.left + o.width / 2 - cx, o.top + o.height / 2 - cy) < r.width * 0.72) {
          return other;
        }
      }
      return null;
    }

    springBack(el) {
      const idx = Number(el.dataset.i);
      el.style.left = `${this.parts[idx].x}%`;
      el.style.top = `${this.parts[idx].y}%`;
    }

    tryBlend(a, b) {
      if (!this.alive || this.merging || this.retrying || (this.els && (!this.els.includes(a)||!this.els.includes(b)))) return;
      const { target } = this.rounds[this.roundIndex];
      const pa = this.parts[Number(a.dataset.i)];
      const pb = this.parts[Number(b.dataset.i)];
      if (pa.kind === pb.kind) {
        this.springBack(a);
        return; // two vowels can't fuse — just drift home, no penalty
      }
      const displays = new Set([pa.part.display, pb.part.display]);
      const isTarget =
        displays.has(target.parts[0].display) && displays.has(target.parts[1].display);

      if (!isTarget) {
        this.retrying = true;
        this.slips += 1;
        this.ctx.sfx("wrong");
        a.classList.add("is-shake");
        b.classList.add("is-shake");
        // Scaffolded retry: the decoy vowel that fooled the fuse drifts off.
        const decoyEl = [a, b].find((el) => {
          const p = this.parts[Number(el.dataset.i)];
          return p.kind === "vowel" && p.part.display !== target.parts[1].display;
        });
        setTimeout(() => {
        if (!this.alive) return;
          this.retrying = false;
          a.classList.remove("is-shake");
          b.classList.remove("is-shake");
          this.springBack(a);
          this.springBack(b);
          if (decoyEl) {decoyEl.classList.add("is-scaffolded");decoyEl.disabled=true;}
          this.ctx.say(target);
        }, 550);
        return;
      }

      this.stopHint?.();
      // The fuse: both tiles rush to the middle, squash, and the syllable is born.
      this.merging = true;
      const scene = this.scene.getBoundingClientRect();
      for (const el of [a, b]) {
        el.classList.add("is-fusing");
        el.style.left = "50%";
        el.style.top = "46%";
      }
      setTimeout(() => {
        if (!this.alive) return;
        a.classList.add("is-gone");
        b.classList.add("is-gone");
        const born = document.createElement("div");
        born.className = "blend-born";
        born.innerHTML = workshopTile(target.display);
        this.scene.appendChild(born);
        this.ctx.sfx("correct");
        this.ctx.say(target);
        this.ctx.confettiAt(born);
      }, 420);
      setTimeout(() => {
        if (!this.alive) return;
        this.roundIndex += 1;
        if (this.roundIndex >= this.rounds.length) { this.alive=false; return this.ctx.onDone(this.slips); }
        this.merging = false;
      this.retrying = false;
        this.startRound();
      }, 1800);
    }

    destroy() { this.alive = false; this.stopHint?.(); }
  }

  // ---------- Un-fuse: pull a joined shape apart, find who was hiding ----------
  // The reverse of the fuse — and literally decoding practice. Phase A is
  // pure joy (grab the fused shape, pull, it splits and each letter says its
  // name); phase B is the verdict (three letters wait, "find the one you
  // heard" — the strength model records the single letter).
  // Teach a drag without giving the answer away (2026-07-24). Fuse and Chain both
  // accept a plain tap, so unlike un-fuse they can't dead-end a child — but
  // nothing showed that pieces are meant to travel to a target, and the
  // "is-near" highlight only appears once you're ALREADY dragging.
  //
  // Every draggable nudges a little way toward the target and settles, on a loop,
  // until the child touches something. Deliberately applied to ALL candidates and
  // never just the correct one: Chain is a quiz, so demoing the right tile would
  // hand over the answer.
  function dragHint(tiles, target) {
    if (!tiles.length || !target) return () => {};
    let timer = null;
    const pulse = () => {
      const t = target.getBoundingClientRect();
      const tx = t.left + t.width / 2;
      const ty = t.top + t.height / 2;
      let live = false;
      for (const el of tiles) {
        if (!el.isConnected || el.classList.contains("is-gone")) continue;
        live = true;
        const r = el.getBoundingClientRect();
        const dx = tx - (r.left + r.width / 2);
        const dy = ty - (r.top + r.height / 2);
        const len = Math.hypot(dx, dy) || 1;
        el.style.setProperty("--hint-dx", (dx / len).toFixed(3));
        el.style.setProperty("--hint-dy", (dy / len).toFixed(3));
        el.classList.remove("is-dragdemo");
        void el.offsetWidth;
        el.classList.add("is-dragdemo");
      }
      target.classList.remove("is-drop-target");
      void target.offsetWidth;
      target.classList.add("is-drop-target");
      if (!live) stop();
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
      for (const el of tiles) el.classList.remove("is-dragdemo");
      target.classList.remove("is-drop-target");
    };
    setTimeout(() => timer !== null && pulse(), 1300);
    timer = setInterval(pulse, 3400);
    return stop;
  }

  class UnfuseGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      const pool = ctx.items.filter((i) => i.parts && i.parts.length === 2);
      this.targets = shuffle(pool).slice(0, 4);
      while (this.targets.length < 4 && pool.length)
        this.targets.push(pool[this.targets.length % pool.length]);
      this.roundIndex = 0;
      this.slips = 0;
      this.startRound();
    }

    startRound() {
      if(!this.alive)return;
      this.busy=false;
      const ctx = this.ctx;
      const target = this.targets[this.roundIndex];
      ctx.setPrompt(target);
      ctx.say(target);
      // Discoverability (2026-07-24): this is the ONLY game that needs a drag —
      // every other one is tapped — and the tile looked exactly like a tappable
      // one, so a child taps it forever and nothing happens. Three wordless
      // affordances now say "pull me apart": a seam down the middle, arrows
      // pointing out, and an idle tug that DEMONSTRATES the gesture.
      const arrow = (dir) =>
        `<span class="unfuse-arrow is-${dir}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 5 L3 12 L9 19" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;
      ctx.stage.innerHTML = `
        <div class="unfuse-scene">
          <div class="unfuse-pull">
            ${arrow("l")}
            <button type="button" class="unfuse-whole" aria-label="Pull the letters apart">
              ${workshopTile(target.display)}
              <span class="unfuse-seam" aria-hidden="true"></span>
            </button>
            ${arrow("r")}
          </div>
          <div class="unfuse-halves" hidden>
            <span class="unfuse-half is-r">${workshopTile(target.parts[0].display)}</span>
            <span class="unfuse-half is-l">${workshopTile(target.parts[1].display)}</span>
          </div>
          <div class="unfuse-quiz" hidden></div>
        </div>`;
      const whole = ctx.stage.querySelector(".unfuse-whole");
      let sx = 0;
      let sy = 0;
      let pulled = false;
      let taps = 0;
      // Demonstrate the pull on a loop until the child manages one themselves.
      clearInterval(this.hintTimer);
      const tug = () => {
        if (!this.alive || pulled || !whole.isConnected) return clearInterval(this.hintTimer);
        whole.classList.remove("is-tugging");
        void whole.offsetWidth;
        whole.classList.add("is-tugging");
      };
      setTimeout(tug, 1200);
      this.hintTimer = setInterval(tug, 3200);
      const stopHint = () => {
        clearInterval(this.hintTimer);
        whole.classList.remove("is-tugging");
      };
      whole.addEventListener("pointerdown", (e) => {
        if(!this.alive||this.busy)return;
        whole.setPointerCapture(e.pointerId);
        sx = e.clientX;
        sy = e.clientY;
        pulled = false;
        stopHint(); // they're engaging — stop nagging
        whole.classList.add("is-held");
      });
      whole.addEventListener("pointermove", (e) => {
        if (!whole.classList.contains("is-held") || pulled) return;
        const d = Math.hypot(e.clientX - sx, e.clientY - sy);
        // The tile strains as the child pulls, then gives way.
        whole.style.setProperty("--strain", String(Math.min(1, d / 46)));
        if (d > 46) {
          pulled = true;
          this.split();
        }
      });
      whole.addEventListener("pointercancel",()=>{whole.classList.remove("is-held");whole.style.setProperty("--strain","0");});
      whole.addEventListener("pointerup", () => {
        whole.classList.remove("is-held");
        whole.style.setProperty("--strain", "0");
        if (!pulled) {
          // A plain tap wobbles and replays the sound — the hint IS the toy.
          whole.classList.remove("is-shake");
          void whole.offsetWidth;
          whole.classList.add("is-shake");
          this.ctx.say(this.targets[this.roundIndex]);
          // No dead ends (locked: no failable moments). If tapping hasn't
          // turned into a pull after a few tries, open it for them — they still
          // see the halves fly apart and still answer the quiz, which is where
          // the learning actually is.
          taps += 1;
          if (taps >= 3) {
            pulled = true;
            stopHint();
            this.split();
          }
        }
      });
    }

    split() {
      if(!this.alive||this.busy)return;
      this.busy=true;
      const ctx = this.ctx;
      clearInterval(this.hintTimer);
      const target = this.targets[this.roundIndex];
      const pull = ctx.stage.querySelector(".unfuse-pull");
      const halves = ctx.stage.querySelector(".unfuse-halves");
      if (pull) pull.hidden = true;
      halves.hidden = false;
      ctx.sfx("hatch");
      ctx.confettiAt(halves);
      // Each freed letter introduces itself, right one (read first) first.
      ctx.say({ display: target.parts[0].display, speak: target.parts[0].speak });
      setTimeout(
        () => {if(this.alive)ctx.say({ display: target.parts[1].display, speak: target.parts[1].speak });},
        900,
      );
      setTimeout(() => this.quiz(), 1900);
    }

    quiz() {
      if(!this.alive)return;
      this.busy=false;
      const ctx = this.ctx;
      const target = this.targets[this.roundIndex];
      // Ask for one of the two freed letters; a third letter crashes the
      // line-up as the decoy.
      const wanted = target.parts[Math.floor(Math.random() * 2)];
      const decoyPool = (ctx.extraItems || []).filter(
        (l) => l.display !== target.parts[0].display && l.display !== target.parts[1].display,
      );
      const decoy = shuffle(decoyPool)[0];
      const options = shuffle([
        { display: target.parts[0].display, speak: target.parts[0].speak },
        { display: target.parts[1].display, speak: target.parts[1].speak },
        ...(decoy ? [{ display: decoy.display, speak: decoy.speak }] : []),
      ]);
      ctx.setPrompt({ id: wanted.display, display: wanted.display, speak: wanted.speak });
      ctx.say({ display: wanted.display, speak: wanted.speak });
      const quizEl = ctx.stage.querySelector(".unfuse-quiz");
      ctx.stage.querySelector(".unfuse-halves").hidden = true;
      quizEl.hidden = false;
      quizEl.innerHTML = options
        .map((o, i) => `<button type="button" class="unfuse-pick" data-i="${i}" aria-label="${o.display}">${workshopTile(o.display)}</button>`)
        .join("");
      for (const btn of quizEl.querySelectorAll(".unfuse-pick")) {
        btn.addEventListener("click", () => {
          if(!this.alive||this.busy||btn.disabled)return;
          const o = options[Number(btn.dataset.i)];
          if (o.display === wanted.display) {
            this.busy=true;
            ctx.sfx("correct");
            ctx.confettiAt(btn);
            ctx.say({ display: o.display, speak: o.speak });
            setTimeout(() => {
              if(!this.alive)return;
              this.roundIndex += 1;
              if (this.roundIndex >= this.targets.length) {this.alive=false;return ctx.onDone(this.slips);}
              this.startRound();
            }, 900);
          } else {
            btn.disabled=true;
            this.slips += 1;
            ctx.sfx("wrong");
            const svg = btn.querySelector("svg");
            svg.classList.remove("is-shake");
            void svg.offsetWidth;
            svg.classList.add("is-shake");
            setTimeout(() => btn.classList.add("is-scaffolded"), 600);
            if (ctx.pulsePrompt) ctx.pulsePrompt();
            ctx.say({ display: wanted.display, speak: wanted.speak });
          }
        });
      }
    }

    destroy() { this.alive=false; this.stopHint?.(); clearInterval(this.hintTimer); }
  }

  // ---------- Chain: grow a two-letter join into three ----------
  // The bridge to real words. A fused pair sits on stage; the child heard
  // the full three-name chain and must drag the right third letter on —
  // the chain grows leftward, exactly the direction Arabic reads.
  class ChainGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      const pool = ctx.items.filter((i) => i.parts && i.parts.length === 2 && i.join2);
      const singles = (ctx.extraItems || []).slice();
      this.rounds = shuffle(pool).slice(0, 4).map((pair, r) => {
        const candidates = shuffle(
          singles.filter(
            (l) => l.display !== pair.parts[0].display && l.display !== pair.parts[1].display,
          ),
        );
        const third = candidates[0];
        const decoy = r >= 1 ? candidates[1] : null;
        return { pair, third, decoy };
      }).filter((r) => r.third);
      const unique = this.rounds.length;
      while (this.rounds.length < 4 && unique) {
        this.rounds.push(this.rounds[this.rounds.length % unique]);
      }
      this.roundIndex = 0;
      this.slips = 0;
      this.startRound();
    }

    startRound() {
      if(!this.alive)return;
      this.busy=false;
      const ctx = this.ctx;
      const { pair, third, decoy } = this.rounds[this.roundIndex];
      const chain = {
        id: pair.display + third.display,
        display: pair.display + third.display,
        speak: `${pair.speak}، ${third.speak}`,
      };
      this.chain = chain;
      ctx.setPrompt(chain);
      ctx.say(chain);
      const thirds = [{ l: third, x: 22, y: decoy ? 30 : 50 }];
      if (decoy) thirds.push({ l: decoy, x: 22, y: 68 });
      ctx.stage.innerHTML = `
        <div class="blend-scene chain-scene">
          <div class="blend-glow"></div>
          <span class="chain-base">${workshopTile(pair.display)}</span>
          ${thirds
            .map(
              (t, i) => `<button type="button" class="blend-part chain-third" data-i="${i}" aria-label="${t.l.display}"
                style="left:${t.x}%; top:${t.y}%">${workshopTile(t.l.display)}</button>`,
            )
            .join("")}
        </div>`;
      this.thirds = thirds;
      this.base = ctx.stage.querySelector(".chain-base");
      const thirdEls = [...ctx.stage.querySelectorAll(".chain-third")];
      for (const el of thirdEls) this.wireDrag(el);
      if (this.stopHint) this.stopHint();
      this.stopHint = dragHint(thirdEls, this.base);
    }

    wireDrag(el) {
      let sx = 0;
      let sy = 0;
      let baseL = 0;
      let baseT = 0;
      let moved = false;
      el.addEventListener("pointerdown", (e) => {
        if (e.button>0 || !this.alive || this.busy || el.classList.contains("is-gone") || el.classList.contains("is-scaffolded")) return;
        el.setPointerCapture(e.pointerId);
        sx = e.clientX;
        sy = e.clientY;
        baseL = el.offsetLeft;
        baseT = el.offsetTop;
        moved = false;
        if (this.stopHint) this.stopHint();
        el.classList.add("is-held");
        const t = this.thirds[Number(el.dataset.i)].l;
        this.ctx.say({ display: t.display, speak: t.speak });
      });
      el.addEventListener("pointermove", (e) => {
        if (!el.classList.contains("is-held")) return;
        const scene=this.base.parentElement;const bounds=scene.getBoundingClientRect();
        const dx = (e.clientX - sx)*scene.clientWidth/bounds.width;
        const dy = (e.clientY - sy)*scene.clientHeight/bounds.height;
        if (Math.hypot(dx, dy) > 8) moved = true;
        if (moved) {
          el.style.left = `${Math.max(el.offsetWidth/2,Math.min(scene.clientWidth-el.offsetWidth/2,baseL+dx))}px`;
          el.style.top = `${Math.max(el.offsetHeight/2,Math.min(scene.clientHeight-el.offsetHeight/2,baseT+dy))}px`;
          this.base.classList.toggle("is-near", this.hitsBase(el));
        }
      });
      el.addEventListener("pointercancel",()=>{el.classList.remove("is-held");this.base.classList.remove("is-near");if(this.alive&&!this.busy)this.springHome(el);});
      el.addEventListener("lostpointercapture",()=>{if(el.classList.contains("is-held")){el.classList.remove("is-held");this.base.classList.remove("is-near");if(this.alive&&!this.busy)this.springHome(el);}});
      el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();this.tryChain(el);}});
      el.addEventListener("pointerup", (e) => {
        if (!el.classList.contains("is-held")) return;
        el.classList.remove("is-held");
        if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);
        this.base.classList.remove("is-near");
        const drop = moved ? this.hitsBase(el) : true; // tap = try it too
        if (drop) this.tryChain(el);
        else this.springHome(el);
      });
    }

    hitsBase(el) {
      const r = el.getBoundingClientRect();
      const b = this.base.getBoundingClientRect();
      return (
        Math.hypot(
          b.left + b.width / 2 - (r.left + r.width / 2),
          b.top + b.height / 2 - (r.top + r.height / 2),
        ) < r.width * 0.85
      );
    }

    springHome(el) {
      const t = this.thirds[Number(el.dataset.i)];
      el.style.left = `${t.x}%`;
      el.style.top = `${t.y}%`;
    }

    tryChain(el) {
      if(!this.alive||this.busy||el.disabled||el.classList.contains("is-scaffolded")||(this.ctx.stage&&!this.ctx.stage.contains(el)))return;
      this.busy=true;
      this.stopHint?.();
      const ctx = this.ctx;
      const { third } = this.rounds[this.roundIndex];
      const picked = this.thirds[Number(el.dataset.i)].l;
      if (picked.display !== third.display) {
        this.slips += 1;
        ctx.sfx("wrong");
        const svg = el.querySelector("svg");
        svg.classList.remove("is-shake");
        void svg.offsetWidth;
        svg.classList.add("is-shake");
        setTimeout(() => {
              if(!this.alive)return;
          this.busy=false;
          this.springHome(el);
          el.classList.add("is-scaffolded");el.disabled=true;
          ctx.say(this.chain);
        }, 550);
        return;
      }
      el.classList.add("is-fusing");el.disabled=true;
      el.style.left = "50%";
      el.style.top = "46%";
      setTimeout(() => {
              if(!this.alive)return;
        el.classList.add("is-gone");
        this.base.innerHTML = workshopTile(this.chain.display);
        this.base.classList.add("is-grown");
        ctx.sfx("correct");
        ctx.say(this.chain);
        ctx.confettiAt(this.base);
      }, 380);
      setTimeout(() => {
              if(!this.alive)return;
        this.roundIndex += 1;
        if (this.roundIndex >= this.rounds.length) {this.alive=false;return ctx.onDone(this.slips);}
        this.startRound();
      }, 1900);
    }

    destroy() { this.alive=false; this.stopHint?.(); clearInterval(this.hintTimer); }
  }

  // ---------- Costume parade: one letter, three outfits ----------
  // The gentle one. A letter stands center stage; three dressing spots wait
  // in reading order. Each tap dresses the letter in that position's
  // costume and speaks its name. No verdicts (like Pairs, deliberately
  // untracked) — this is recognition by wandering, not testing.
  class ParadeGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      const TATWEEL = "ـ";
      const joiners = (ctx.extraItems || []).filter((l) => l.joins);
      const pool = joiners.length
        ? joiners
        : ctx.items.filter((i) => i.parts).map((i) => ({ display: i.parts[0].display, speak: i.parts[0].speak, joins: true }));
      this.letters = shuffle(pool).slice(0, 3);
      this.formsOf = (ch) => [ch + TATWEEL, TATWEEL + ch + TATWEEL, TATWEEL + ch];
      this.roundIndex = 0;
      ctx.setPrompt(null);
      this.startRound();
    }

    startRound() {
      if(!this.alive)return;
      this.busy=false;
      const ctx = this.ctx;
      const letter = this.letters[this.roundIndex];
      const forms = this.formsOf(letter.display);
      ctx.say({ display: letter.display, speak: letter.speak });
      ctx.stage.innerHTML = `
        <div class="parade-scene">
          <span class="parade-star">${workshopTile(letter.display)}</span>
          <div class="parade-spots" dir="rtl">
            ${forms
              .map(
                (f, i) => `<button type="button" class="parade-spot" data-i="${i}" aria-label="Reveal letter form ${i+1}">
                  <span class="parade-mystery" aria-hidden="true"><svg viewBox="0 0 64 64"><path d="M15 49V20Q32 7 49 20V49" fill="#dce7bd" stroke="#7c9163" stroke-width="3"/><path d="M31 16V49M15 49H49" stroke="#7c9163" stroke-width="3"/><path d="M23 32L18 36L23 40M41 32L46 36L41 40" fill="none" stroke="#fffaf0" stroke-width="3" stroke-linecap="round"/></svg></span>
                  <span class="parade-form" hidden>${workshopTile(f)}</span>
                </button>`,
              )
              .join("")}
          </div>
        </div>`;
      this.dressed = 0;
      for (const spot of ctx.stage.querySelectorAll(".parade-spot")) {
        spot.addEventListener("click", () => {
          if (!this.alive || !spot.querySelector(".parade-form").hidden) return;
          spot.querySelector(".parade-mystery").hidden = true;
          spot.querySelector(".parade-form").hidden = false;
          spot.classList.add("is-dressed");
          ctx.sfx("seed");
          ctx.say({ display: letter.display, speak: letter.speak });
          this.dressed += 1;
          if (this.dressed >= 3) {
            ctx.confettiAt(ctx.stage.querySelector(".parade-spots"));
            setTimeout(() => {
              if(!this.alive)return;
              this.roundIndex += 1;
              if (this.roundIndex >= this.letters.length) {this.alive=false;return ctx.onDone(0);}
              this.startRound();
            }, 1200);
          }
        });
      }
    }

    destroy() { this.alive=false; this.stopHint?.(); clearInterval(this.hintTimer); }
  }

  ns.LettersRoundBuilder = buildRounds;
  ns.LettersMiniGames = {
    pop: PopGame,
    catch: CatchGame,
    pairs: PairsGame,
    feed: FeedGame,
    trace: TraceGame,
    burst: BurstGame,
    build: BuildGame,
    blend: BlendGame,
    // The joining stage (2026-07-18): fuse IS the blend machine — same
    // mechanic, letter+letter instead of letter+haraka.
    fuse: BlendGame,
    unfuse: UnfuseGame,
    chain: ChainGame,
    parade: ParadeGame,
  };
})(window.MiftahGame || (window.MiftahGame = {}));
