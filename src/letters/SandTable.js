// The Sand Table (v28, 2026-10-02): writing with the senses.
//
// Montessori's sandpaper letters, made for a tablet. The child writes a letter
// with a fingertip in a tray of sand: the finger carves a groove, the sand
// whispers while it moves, the tablet buzzes where it can, and when the letter
// is finished its friend rises out of the sand around it ("trace Batta's
// body"). Finger tracing is the research's quiet winner for letter learning.
//
// The guide fades as writing takes hold — the Brain's write skill picks how
// much help each letter gets:
//   0 show    the pen writes it first; the full path, arrows and start dot
//   1 dotted  a dotted path to follow, start dot and arrow
//   2 start   only where to start and which way to go
//   3 memory  hear the letter; the sand is bare (the path is still checked,
//             with the same two-year-old tolerance — it just isn't drawn)
// The tracing engine is the Writing Garden's (LettersStrokes.guide), so
// stroke order, direction, tolerance and gentle snap-back are unchanged.
// Nothing fails. Shown levels report participation; bare-sand letters
// finished without wandering report a real (motor) right answer.
(function (ns) {
  const SVGNS = "http://www.w3.org/2000/svg";
  const LEVELS = ["show", "dotted", "start", "memory"];
  const baseOf = (text) => [...String(text || "")].find((c) => ns.LettersStrokes?.LETTERS?.[c]) || text;

  class SandTable {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      this.timers = [];
      // v35: syllables too — a letter and its mark (بَ بِ بُ بً …) are written
      // with the same engine, the mark's own stroke drawn after the letter.
      const ok = (i) => i?.display && ns.LettersStrokes?.forItem?.(i);
      this.letters = [...new Map((ctx.items || []).filter(ok).map((i) => [i.display, i])).values()].slice(0, ctx.beginner ? 2 : 3);
      // Once marks are taught, one of the letters comes back wearing one.
      const marks = (ctx.marks || []).filter((m) => ns.LettersStrokes?.MARKS?.[m]);
      if (marks.length && !ctx.beginner && this.letters.length >= 2 && [...this.letters[this.letters.length - 1].display].length === 1) {
        const last = this.letters[this.letters.length - 1], mark = marks[Math.floor(Math.random() * marks.length)];
        if (last.display !== "ا") this.letters[this.letters.length - 1] = { id: last.display + mark, display: last.display + mark, speak: last.display + mark };
      }
      this.at = 0;
      ctx.stage.innerHTML = `<div class="sand" role="group" aria-label="Sand table">
        <div class="sand-tray"><div class="sand-paper"></div><svg class="sand-friend" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg></div>
        <div class="sand-tools">
          <button type="button" class="lg-round-btn sand-rake" aria-label="Smooth the sand">${RAKE}</button>
          <span class="sand-progress" aria-hidden="true">${this.letters.map(() => "<i></i>").join("")}</span>
          <span class="sand-hint" aria-hidden="true"></span>
        </div>
      </div>`;
      this.paper = ctx.stage.querySelector(".sand-paper");
      this.friend = ctx.stage.querySelector(".sand-friend");
      this.hint = ctx.stage.querySelector(".sand-hint");
      ctx.stage.querySelector(".sand-rake").onclick = () => this.rake();
      if (this.letters.length) this.next(); else this.later(() => ctx.done?.(), 300);
    }

    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); }

    level(char) {
      const w = ns.gardenBrain?.skills?.(char)?.write || 0;
      const lv = w >= 0.75 ? 3 : w >= 0.5 ? 2 : w >= 0.25 ? 1 : 0;
      return this.ctx.beginner ? Math.min(lv, 1) : lv;
    }

    next() {
      if (this.at >= this.letters.length) return this.finish();
      this.guided?.destroy();
      this.friend.innerHTML = "";
      this.friend.classList.remove("is-up");
      this.snaps = 0;
      const item = this.letters[this.at];
      const char = baseOf(item.display);
      this.lv = this.level(char);
      this.paper.dataset.level = LEVELS[this.lv];
      this.ctx.stage.querySelectorAll(".sand-progress i").forEach((d, i) => { d.className = i < this.at ? "is-done" : i === this.at ? "is-on" : ""; });
      // At "memory" the letter isn't printed anywhere — not even on the replay
      // button — so the child writes it from the sound. 
      if (this.lv >= 3) { this.ctx.prompt?.(null); this.ctx.beginRound?.(item, "drawing"); }
      else this.ctx.prompt?.(item);
      // The reminder is the friend WITHOUT its body: who you're making, not
      // the shape to copy.
      this.hint.innerHTML = this.lv >= 3 ? (ns.LetterFriends?.art(char, { size: 56 }) || "").replace('class="lf"', 'class="lf is-bodiless"') : "";
      this.guided = ns.LettersStrokes.guide(this.paper, ns.LettersStrokes.forItem(item), {
        ink: () => "#a89478",
        reduced: this.lv > 0 || !!this.ctx.reducedMotion?.(),
        onMove: (e) => this.grain(e),
        onSnap: () => { this.snaps += 1; },
        onStroke: () => this.ctx.sfx?.("drip"),
        onDone: () => this.written(item),
      });
      this.later(() => this.ctx.say?.(item), 250);
    }

    // The sand speaks while the finger moves (throttled), and buzzes softly.
    grain(e) {
      if (!e) return;
      const now = performance.now();
      if (now - (this.lastGrain || 0) > 90) { this.lastGrain = now; this.ctx.sfx?.("sand"); }
      if (now - (this.lastBuzz || 0) > 180) { this.lastBuzz = now; try { ns.Haptics?.pulse?.("page"); } catch {} }
    }

    written(item) {
      const char = baseOf(item.display);
      const bare = this.lv >= 2;
      this.ctx.reportOutcome?.({ item, itemId: item.id || char, activity: "SandTable", skill: "drawing", evidence: "motor_assembly_participation",
        correct: bare && this.snaps <= 1 ? true : undefined, affectsStrength: bare });
      // The friend rises out of the sand around the groove.
      const F = ns.LetterFriends;
      if (F?.FRIENDS?.[char]) {
        this.friend.innerHTML = F.dress(char);
        this.later(() => this.friend.classList.add("is-up"), 60);
        this.later(() => this.ctx.sfx?.(F.get(char).call), 500);
        this.later(() => this.ctx.say?.(F.item(char)), 1100);
      }
      this.ctx.correct?.();
      this.ctx.confettiAt?.(this.paper);
      this.ctx.pet?.cheer?.();
      this.at += 1;
      this.later(() => this.next(), 3200);
    }

    rake() {
      if (!this.guided) return;
      this.ctx.sfx?.("rake");
      this.paper.classList.remove("is-raked"); void this.paper.offsetWidth; this.paper.classList.add("is-raked");
      this.guided.reset();
    }

    finish() {
      this.guided?.destroy(); this.guided = null;
      this.ctx.sfx?.("cheer2");
      this.later(() => this.ctx.done?.(), 900);
    }

    replayPrompt() { const item = this.letters[this.at]; if (item) this.ctx.say?.(item); }
    destroy() { this.alive = false; this.timers.forEach(clearTimeout); this.guided?.destroy(); }
  }

  const RAKE = `<svg viewBox="0 0 48 48" width="30" height="30" aria-hidden="true"><path d="M36 6L22 26" stroke="#70501b" stroke-width="4" stroke-linecap="round"/><path d="M10 26H34" stroke="#4a3620" stroke-width="4" stroke-linecap="round"/><path d="M13 26V36M19 26V36M25 26V36M31 26V36" stroke="#4a3620" stroke-width="3" stroke-linecap="round"/></svg>`;

  SandTable.LEVELS = LEVELS;
  ns.GardenPractice = ns.GardenPractice || {};
  ns.GardenPractice.SandTable = SandTable;
})(window.MiftahGame || (window.MiftahGame = {}));
