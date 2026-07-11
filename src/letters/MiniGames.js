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
  const DIACRITICS = /[ً-ْٰٓ-ٟؐ-ؚۖ-ۭ]/g;

  // Optically centered glyph text. Amiri Quran reserves a large amount of
  // space above its visible ink for stacked marks, so mathematical baseline
  // centering leaves Arabic sitting on the tile's floor. The negative dy is
  // an intentional ink-box correction, not ordinary line-height alignment.
  function glyphText(display, { fill = "#2b2233", maxSize = 44 } = {}) {
    const latin = !isArabic(display);
    const len = [...display.replace(DIACRITICS, "")].length;
    const size = latin
      ? Math.min(maxSize * 0.6, 26)
      : len <= 1 ? maxSize : len <= 2 ? maxSize * 0.9 : len <= 3 ? maxSize * 0.72 : maxSize * 0.58;
    return `<text x="0" y="0" dy="${latin ? "0.06em" : "-0.06em"}" text-anchor="middle"
      dominant-baseline="central"
      font-family="${latin ? "ui-rounded, system-ui, sans-serif" : "'Amiri Quran', serif"}"
      font-size="${size}" fill="${fill}" ${latin ? "" : `direction="rtl"`}>${display}</text>`;
  }

  // Tactile answer card: the same navy outline, warm paper face and shallow
  // physical lift used throughout Letter Garden's new interface system.
  function tileHTML(item, hue) {
    return `
      <svg viewBox="-52 -54 104 106" aria-hidden="true">
        <rect x="-46" y="-38" width="92" height="84" rx="22" fill="#243653"/>
        <rect x="-46" y="-46" width="92" height="84" rx="22" fill="hsl(${hue} 52% 86%)" stroke="#243653" stroke-width="4"/>
        <rect class="tile-face" x="-39" y="-39" width="78" height="70" rx="16" fill="#fffaf0" stroke="#243653" stroke-width="2"/>
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
        bubble.el.classList.remove("is-shake");
        void bubble.el.offsetWidth;
        bubble.el.classList.add("is-shake", "is-no");
        const cross = document.createElement("i");
        cross.className = "pop-cross";
        cross.innerHTML = `<svg viewBox="0 0 64 64"><path d="M18 18 L46 46 M46 18 L18 46" stroke="#c23a2b" stroke-width="10" stroke-linecap="round"/></svg>`;
        bubble.el.appendChild(cross);
        setTimeout(() => {
          bubble.el.classList.remove("is-no");
          cross.remove();
        }, 750);
        if (this.ctx.pulsePrompt) this.ctx.pulsePrompt();
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
        b.y -= b.speed * this.heat.factor() * dt;
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
      this.heat = makeHeat();
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
        f.y += f.speed * this.heat.factor() * dt;
        f.el.style.top = `${f.y * 100}%`;
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
      ctx.setPrompt(null);
      for (const card of this.cards) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "pairs-card";
        el.innerHTML = tileHTML(card, ctx.hue);
        el.addEventListener("pointerdown", () => this.pick(card, el));
        card.el = el;
        grid.appendChild(el);
      }
      // Wordless instruction: one matching pair glows in sync for a moment —
      // "see? these two belong together" — then the child takes over.
      const demoId = this.cards[0].id;
      const demoEls = this.cards.filter((c) => c.id === demoId).map((c) => c.el);
      for (const el of demoEls) el.classList.add("is-demo");
      setTimeout(() => {
        for (const el of demoEls) el.classList.remove("is-demo");
      }, 1500);
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

    drawGuideText(size, x, y) {
      const target = this.targets[this.roundIndex];
      // System Arabic fonts (Geeza Pro, Segoe UI, Noto) hug harakat close to
      // the letter; Amiri Quran floats them a canvas apart at tracing sizes.
      this.g.font = `${size}px "Geeza Pro", "Segoe UI", "Noto Naskh Arabic", "Arial", sans-serif`;
      this.g.textAlign = "center";
      this.g.textBaseline = "middle";
      this.g.direction = "rtl";
      this.g.fillStyle = "#dbe9f5";
      this.g.fillText(target.display, x, y);
      this.g.strokeStyle = "#a9c6de";
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
      let size = Math.min(w, h) * 0.7;
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

    clusterCoverage(cluster) {
      let n = 0;
      for (const key of cluster) if (this.paint.has(key)) n += 1;
      return n / cluster.length;
    }

    penUp() {
      if (!this.drawing || !this.alive) return;
      this.drawing = false;
      if (!this.guide.length) return;
      const covered = this.guide.reduce(
        (n, [x, y]) => n + (this.paint.has(`${x}|${y}`) ? 1 : 0),
        0,
      );
      const total = covered / this.guide.length;
      const missing = (this.clusters || []).filter((c) => this.clusterCoverage(c) < 0.45);
      if (total >= 0.55 && !missing.length) {
        const target = this.targets[this.roundIndex];
        this.ctx.sfx("correct");
        this.ctx.confettiAt(this.canvas);
        this.ctx.say(target);
        setTimeout(() => {
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
      this.heat = makeHeat();
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
        el.innerHTML = tileHTML(item, this.ctx.hue);
        el.addEventListener("pointerdown", () => this.tap(item, el));
        this.grid.appendChild(el);
      }
    }

    tap(item, el) {
      if (!this.alive) return;
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

  // ---------- Build: blend the sounds into a word ----------
  // Synthetic phonics' key moment. The mascot says the whole thing (بَتْ,
  // "bat"); the child taps sound-tiles in order and watches them snap into
  // the slots right-to-left. Each tile speaks as it's placed; a correct
  // build speaks the blended whole. Items must carry `parts`.
  class BuildGame {
    constructor(ctx) {
      this.ctx = ctx;
      const pool = ctx.items.filter((i) => i.parts && i.parts.length >= 2);
      this.targets = shuffle(pool).slice(0, 4);
      this.roundIndex = 0;
      this.slips = 0;
      this.startRound();
    }

    startRound() {
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
            ${target.parts.map(() => `<span class="build-slot"></span>`).join("")}
          </div>
          <div class="build-tray">
            ${this.tray.map((part, i) => `<button type="button" class="build-tile" data-i="${i}">${tileHTML({ display: part.display }, ctx.hue)}</button>`).join("")}
          </div>
        </div>`;
      this.slots = [...ctx.stage.querySelectorAll(".build-slot")];
      for (const btn of ctx.stage.querySelectorAll(".build-tile")) {
        btn.addEventListener("pointerdown", () => this.place(btn));
      }
    }

    place(btn) {
      const target = this.targets[this.roundIndex];
      if (btn.classList.contains("is-used") || this.placed.length >= target.parts.length) return;
      const part = this.tray[Number(btn.dataset.i)];
      const slot = this.slots[this.placed.length];
      slot.innerHTML = tileHTML({ display: part.display }, this.ctx.hue);
      slot.classList.add("is-filled");
      btn.classList.add("is-used");
      this.placed.push({ part, btn, slot });
      this.ctx.say({ display: part.display, speak: part.speak || part.display });

      if (this.placed.length < target.parts.length) return;
      const built = this.placed.every((p, i) => p.part.display === target.parts[i].display);
      if (built) {
        this.ctx.sfx("correct");
        this.ctx.confettiAt(this.ctx.stage.querySelector(".build-slots"));
        // The payoff: the parts become the whole, and the whole speaks.
        setTimeout(() => this.ctx.say(target), 500);
        setTimeout(() => {
          this.roundIndex += 1;
          if (this.roundIndex >= this.targets.length) return this.ctx.onDone(this.slips);
          this.startRound();
        }, 1400);
      } else {
        this.slips += 1;
        this.ctx.sfx("wrong");
        const slotsEl = this.ctx.stage.querySelector(".build-slots");
        slotsEl.classList.remove("is-shake");
        void slotsEl.offsetWidth;
        slotsEl.classList.add("is-shake");
        setTimeout(() => {
          for (const p of this.placed) {
            p.slot.innerHTML = "";
            p.slot.classList.remove("is-filled");
            p.btn.classList.remove("is-used");
          }
          this.placed = [];
          this.ctx.say(target);
        }, 800);
      }
    }

    destroy() {}
  }

  ns.LettersMiniGames = {
    pop: PopGame,
    catch: CatchGame,
    pairs: PairsGame,
    feed: FeedGame,
    trace: TraceGame,
    burst: BurstGame,
    build: BuildGame,
  };
})(window.MiftahGame || (window.MiftahGame = {}));
