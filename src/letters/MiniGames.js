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
    const optionCount = (ctx.level || 0) >= 2 ? 4 : 3;
    return targets.map((target) => {
      const wrong = shuffle(
        ctx.items.concat(ctx.extraItems || []).filter((i) => i.id !== target.id),
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

  function tileHTML(item, hue) {
    const latin = !isArabic(item.display);
    return `
      <svg viewBox="-52 -52 104 104" aria-hidden="true">
        <circle r="46" fill="hsl(${hue} 70% 92%)" stroke="hsl(${hue} 55% 45%)" stroke-width="5"/>
        <circle cx="-14" cy="-18" r="8" fill="#fff" opacity="0.7"/>
        <text y="${latin ? 8 : 17}" text-anchor="middle"
          font-family="${latin ? "ui-rounded, system-ui, sans-serif" : "'Amiri Quran', serif"}"
          font-size="${item.display.length > 3 ? 30 : 42}" fill="#2b2233"
          ${latin ? "" : `direction="rtl"`}>${item.display}</text>
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
      this.bubbles = [];
      ctx.stage.innerHTML = `<div class="pop-sky"></div>`;
      this.sky = ctx.stage.querySelector(".pop-sky");
      this.startRound();
      this.lastTime = performance.now();
      this.tick = this.tick.bind(this);
      requestAnimationFrame(this.tick);
    }

    startRound() {
      const round = this.rounds[this.roundIndex];
      this.ctx.setPrompt(round.target);
      this.ctx.say(round.target);
      for (const b of this.bubbles) b.el.remove();
      this.bubbles = [];
      const lanes = shuffle([0, 1, 2]);
      round.options.forEach((item, i) => this.spawn(item, lanes[i], i * 0.33));
    }

    spawn(item, lane, delay) {
      const el = document.createElement("button");
      el.type = "button";
      el.className = "pop-bubble";
      el.innerHTML = tileHTML(item, this.ctx.hue);
      const laneX = 8 + lane * 30 + Math.random() * 8; // percent
      el.style.left = `${laneX}%`;
      const pace = 1 + 0.22 * (this.ctx.level || 0);
      const bubble = { el, item, y: 1.15 + delay, speed: (0.06 + Math.random() * 0.025) * pace };
      el.style.top = `${bubble.y * 100}%`;
      el.addEventListener("pointerdown", () => this.popAttempt(bubble));
      this.sky.appendChild(el);
      this.bubbles.push(bubble);
    }

    popAttempt(bubble) {
      if (!this.alive || bubble.el.classList.contains("is-popped")) return;
      const round = this.rounds[this.roundIndex];
      if (bubble.item.id === round.target.id) {
        bubble.el.classList.add("is-popped");
        this.ctx.sfx("correct");
        this.ctx.confettiAt(bubble.el);
        this.ctx.say(round.target);
        setTimeout(() => this.advance(), 550);
      } else {
        this.slips += 1;
        this.ctx.sfx("wrong");
        bubble.el.classList.remove("is-shake");
        void bubble.el.offsetWidth;
        bubble.el.classList.add("is-shake");
        this.ctx.say(round.target); // repeat the question, never scold
      }
    }

    advance() {
      this.roundIndex += 1;
      if (this.roundIndex >= this.rounds.length) return this.finish();
      this.startRound();
    }

    tick(now) {
      if (!this.alive) return;
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;
      for (const b of this.bubbles) {
        if (b.el.classList.contains("is-popped")) continue;
        b.y -= b.speed * dt;
        if (b.y < -0.18) b.y = 1.12; // drift forever until popped
        b.el.style.top = `${b.y * 100}%`;
      }
      requestAnimationFrame(this.tick);
    }

    finish() {
      this.alive = false;
      this.ctx.onDone(this.slips);
    }

    destroy() {
      this.alive = false;
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
      ctx.stage.innerHTML = `
        <div class="catch-field"></div>
        <div class="catch-basket">
          <svg viewBox="0 0 120 70" aria-hidden="true">
            <path d="M8 12 L112 12 L98 62 Q60 72 22 62 Z" fill="hsl(${ctx.hue} 55% 55%)" stroke="hsl(${ctx.hue} 50% 38%)" stroke-width="6"/>
            <path d="M8 12 L112 12" stroke="hsl(${ctx.hue} 50% 38%)" stroke-width="10" stroke-linecap="round"/>
          </svg>
        </div>`;
      this.field = ctx.stage.querySelector(".catch-field");
      this.basket = ctx.stage.querySelector(".catch-basket");
      this.basketX = 0.5;
      const move = (event) => {
        const rect = ctx.stage.getBoundingClientRect();
        this.basketX = Math.max(0.08, Math.min(0.92, (event.clientX - rect.left) / rect.width));
        this.basket.style.left = `${this.basketX * 100}%`;
      };
      ctx.stage.addEventListener("pointermove", move);
      ctx.stage.addEventListener("pointerdown", move);
      this.startRound();
      this.lastTime = performance.now();
      this.spawnTimer = 0;
      this.tick = this.tick.bind(this);
      requestAnimationFrame(this.tick);
    }

    startRound() {
      const round = this.rounds[this.roundIndex];
      this.ctx.setPrompt(round.target);
      this.ctx.say(round.target);
    }

    spawn() {
      const round = this.rounds[this.roundIndex];
      // Always keep the target reachable: alternate target / distractor.
      this.spawnFlip = !this.spawnFlip;
      const item = this.spawnFlip
        ? round.target
        : round.options[1 + Math.floor(Math.random() * (round.options.length - 1))] || round.target;
      const el = document.createElement("div");
      el.className = "catch-faller";
      el.innerHTML = tileHTML(item, this.ctx.hue);
      const x = 0.12 + Math.random() * 0.76;
      el.style.left = `${x * 100}%`;
      this.field.appendChild(el);
      const pace = 1 + 0.2 * (this.ctx.level || 0);
      this.fallers.push({ el, item, x, y: -0.15, speed: (0.16 + Math.random() * 0.05) * pace });
    }

    tick(now) {
      if (!this.alive) return;
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.fallers.length < 3) {
        this.spawn();
        this.spawnTimer = 1.1;
      }
      const round = this.rounds[this.roundIndex];
      for (const f of this.fallers.slice()) {
        f.y += f.speed * dt;
        f.el.style.top = `${f.y * 100}%`;
        // Catch zone: bottom strip, basket overlap.
        if (f.y > 0.78 && f.y < 0.9 && Math.abs(f.x - this.basketX) < 0.13) {
          this.remove(f);
          if (f.item.id === round.target.id) {
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
          this.ctx.sfx("wrong");
          this.basket.classList.remove("is-shake");
          void this.basket.offsetWidth;
          this.basket.classList.add("is-shake");
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
      this.ctx.onDone(this.slips);
    }

    destroy() {
      this.alive = false;
    }
  }

  // ---------- Pairs: find the two that belong together ----------
  class PairsGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.slips = 0;
      this.boards = 2;
      this.boardIndex = 0;
      this.buildBoard();
    }

    buildBoard() {
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
      ctx.setPrompt(null); // pairs is self-evident: no target, just matching
      for (const card of this.cards) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "pairs-card";
        el.innerHTML = tileHTML(card, ctx.hue);
        el.addEventListener("pointerdown", () => this.pick(card, el));
        card.el = el;
        grid.appendChild(el);
      }
    }

    pick(card, el) {
      if (el.classList.contains("is-matched")) return;
      this.ctx.say(card);
      if (!this.selected) {
        this.selected = { card, el };
        el.classList.add("is-selected");
        return;
      }
      if (this.selected.el === el) {
        el.classList.remove("is-selected");
        this.selected = null;
        return;
      }
      const first = this.selected;
      this.selected = null;
      first.el.classList.remove("is-selected");
      if (first.card.id === card.id) {
        first.el.classList.add("is-matched");
        el.classList.add("is-matched");
        this.ctx.sfx("correct");
        this.ctx.confettiAt(el);
        this.matched += 1;
        if (this.matched >= 3) setTimeout(() => this.nextBoard(), 650);
      } else {
        this.slips += 1;
        this.ctx.sfx("wrong");
        for (const e of [first.el, el]) {
          e.classList.remove("is-shake");
          void e.offsetWidth;
          e.classList.add("is-shake");
        }
      }
    }

    nextBoard() {
      this.boardIndex += 1;
      if (this.boardIndex >= this.boards) return this.ctx.onDone(this.slips);
      this.buildBoard();
    }

    destroy() {}
  }

  // ---------- Feed: give the hungry creature what it asks for ----------
  class FeedGame {
    constructor(ctx) {
      this.ctx = ctx;
      this.rounds = buildRounds(ctx);
      this.roundIndex = 0;
      this.slips = 0;
      ctx.stage.innerHTML = `
        <div class="feed-scene">
          <div class="feed-creature">${Art.creature({ hue: (ctx.hue + 140) % 360 })}</div>
          <div class="feed-tray"></div>
        </div>`;
      this.creatureEl = ctx.stage.querySelector(".feed-creature");
      this.tray = ctx.stage.querySelector(".feed-tray");
      this.startRound();
    }

    startRound() {
      const round = this.rounds[this.roundIndex];
      this.ctx.setPrompt(round.target);
      this.ctx.say(round.target);
      this.tray.innerHTML = "";
      for (const item of round.options) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "feed-food";
        el.innerHTML = tileHTML(item, this.ctx.hue);
        el.addEventListener("pointerdown", () => this.offer(item, el));
        this.tray.appendChild(el);
      }
    }

    offer(item, el) {
      const round = this.rounds[this.roundIndex];
      if (this.feeding) return;
      if (item.id !== round.target.id) {
        this.slips += 1;
        this.ctx.sfx("wrong");
        el.classList.remove("is-shake");
        void el.offsetWidth;
        el.classList.add("is-shake");
        this.ctx.say(round.target);
        return;
      }
      this.feeding = true;
      // The food flies into the creature's mouth.
      const from = el.getBoundingClientRect();
      const mouth = this.creatureEl.getBoundingClientRect();
      el.style.setProperty("--fly-x", `${mouth.left + mouth.width / 2 - (from.left + from.width / 2)}px`);
      el.style.setProperty("--fly-y", `${mouth.top + mouth.height * 0.68 - (from.top + from.height / 2)}px`);
      el.classList.add("is-flying");
      this.ctx.sfx("correct");
      setTimeout(() => {
        this.creatureEl.classList.remove("is-chomp");
        void this.creatureEl.offsetWidth;
        this.creatureEl.classList.add("is-chomp");
        this.ctx.confettiAt(this.creatureEl);
        this.ctx.say(round.target);
      }, 420);
      setTimeout(() => {
        this.feeding = false;
        this.roundIndex += 1;
        if (this.roundIndex >= this.rounds.length) return this.ctx.onDone(this.slips);
        this.startRound();
      }, 1000);
    }

    destroy() {}
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
          <canvas class="trace-canvas"></canvas>
          <button type="button" class="lg-round-btn trace-clear">${Art.icon("replay", 30)}</button>
        </div>`;
      this.canvas = ctx.stage.querySelector(".trace-canvas");
      ctx.stage.querySelector(".trace-clear").addEventListener("click", () => this.clearDrawing());
      this.drawing = false;
      this.canvas.addEventListener("pointerdown", (e) => this.penDown(e));
      this.canvas.addEventListener("pointermove", (e) => this.penMove(e));
      window.addEventListener("pointerup", (this.penUpBound = () => this.penUp()));
      // The glyph guide needs the Quran font; wait for it, then start.
      const ready = document.fonts && document.fonts.load ? document.fonts.load('100px "Amiri Quran"') : Promise.resolve();
      ready.finally(() => {
        if (this.alive) this.startRound();
      });
    }

    startRound() {
      const target = this.targets[this.roundIndex];
      this.ctx.setPrompt(target);
      this.ctx.say(target);
      const wrap = this.canvas.parentElement;
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      this.canvas.width = w;
      this.canvas.height = h;
      this.g = this.canvas.getContext("2d", { willReadFrequently: true });
      // Guide layer: a huge pale letter with a darker rim.
      const size = Math.min(w, h) * (target.display.length > 1 ? 0.5 : 0.72);
      this.g.clearRect(0, 0, w, h);
      this.g.font = `${size}px "Amiri Quran", serif`;
      this.g.textAlign = "center";
      this.g.textBaseline = "middle";
      this.g.direction = "rtl";
      this.g.fillStyle = "#dbe9f5";
      this.g.fillText(target.display, w / 2, h * 0.52);
      this.g.strokeStyle = "#a9c6de";
      this.g.lineWidth = 2;
      this.g.strokeText(target.display, w / 2, h * 0.52);
      // Remember which pixels belong to the glyph (sampled grid).
      const img = this.g.getImageData(0, 0, w, h).data;
      this.guide = [];
      const step = 5;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          if (img[(y * w + x) * 4 + 3] > 60) this.guide.push([x, y]);
        }
      }
      this.brush = Math.max(20, size * 0.1);
      this.g.lineCap = "round";
      this.g.lineJoin = "round";
      this.g.strokeStyle = `hsl(${this.ctx.hue} 70% 50%)`;
      this.g.lineWidth = this.brush;
      this.paint = new Set(); // painted sample cells, keyed x|y
    }

    clearDrawing() {
      if (this.alive) this.startRound();
    }

    pos(e) {
      const rect = this.canvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top];
    }

    penDown(e) {
      this.drawing = true;
      this.last = this.pos(e);
      this.canvas.setPointerCapture?.(e.pointerId);
    }

    penMove(e) {
      if (!this.drawing || !this.alive) return;
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

    penUp() {
      if (!this.drawing || !this.alive) return;
      this.drawing = false;
      const covered = this.guide.reduce(
        (n, [x, y]) => n + (this.paint.has(`${x}|${y}`) ? 1 : 0),
        0,
      );
      if (this.guide.length && covered / this.guide.length >= 0.6) {
        const target = this.targets[this.roundIndex];
        this.ctx.sfx("correct");
        this.ctx.confettiAt(this.canvas);
        this.ctx.say(target);
        this.alivePause = true;
        setTimeout(() => {
          this.roundIndex += 1;
          if (this.roundIndex >= this.targets.length) return this.finish();
          this.startRound();
        }, 700);
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
            <circle cx="30" cy="30" r="25" fill="#fffdf4" stroke="#e6dcc2" stroke-width="7"/>
            <circle class="burst-ring-fill" cx="30" cy="30" r="25" fill="none" stroke="#f3a53c" stroke-width="7"
              stroke-linecap="round" stroke-dasharray="157" transform="rotate(-90 30 30)"/>
          </svg>
          <span class="burst-count">0</span>
        </div>
        <div class="burst-grid"></div>`;
      this.ringEl = ctx.stage.querySelector(".burst-ring-fill");
      this.countEl = ctx.stage.querySelector(".burst-count");
      this.grid = ctx.stage.querySelector(".burst-grid");
      this.nextTarget();
      this.tick = this.tick.bind(this);
      requestAnimationFrame(this.tick);
      // rAF stalls in hidden/backgrounded tabs — a plain interval guarantees
      // the round still ends on time.
      this.endTimer = setInterval(() => this.tick(performance.now()), 500);
    }

    nextTarget() {
      const pool = shuffle(this.ctx.items);
      this.target = pool[0];
      const tiles = pool.slice(0, Math.min(6, pool.length));
      if (!tiles.includes(this.target)) tiles[0] = this.target;
      this.ctx.setPrompt(this.target);
      this.ctx.say(this.target);
      this.grid.innerHTML = "";
      for (const item of shuffle(tiles)) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "burst-tile";
        el.innerHTML = tileHTML(item, this.ctx.hue);
        el.addEventListener("pointerdown", () => this.tap(item, el));
        this.grid.appendChild(el);
      }
    }

    tap(item, el) {
      if (!this.alive) return;
      if (item.id === this.target.id) {
        this.count += 1;
        this.countEl.textContent = String(this.count);
        this.ctx.sfx("correct");
        el.classList.add("is-popped");
        this.nextTarget();
      } else {
        this.ctx.sfx("wrong");
        el.classList.remove("is-shake");
        void el.offsetWidth;
        el.classList.add("is-shake");
      }
    }

    tick(now) {
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
      requestAnimationFrame(this.tick);
    }

    destroy() {
      this.alive = false;
      clearInterval(this.endTimer);
    }
  }

  ns.LettersMiniGames = {
    pop: PopGame,
    catch: CatchGame,
    pairs: PairsGame,
    feed: FeedGame,
    trace: TraceGame,
    burst: BurstGame,
  };
})(window.MiftahGame || (window.MiftahGame = {}));
