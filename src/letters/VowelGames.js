// Vowel Hats (v33, 2026-10-03): the Letter Friends idea, carried into the
// vowel marks. Every mark becomes something a friend WEARS, and each is drawn
// along the mark's own handwriting stroke (LettersStrokes.MARKS), so the
// picture keeps teaching the real shape — the same embedded-mnemonic trick the
// friends use for letters:
//   fatha  ـَ  a feather tucked above the head   (a short slant above)
//   kasra  ـِ  a skateboard underneath           (a short slant below)
//   damma  ـُ  a curly snail-shell cap            (the little curl above)
//   sukoon ـْ  a round bubble resting on top      (the small circle)
//   shadda ـّ  a crown                            (the little "w")
//   tanween     two of the same — two feathers, two boards, two curls
// "بُ" is Batta in her snail cap; "بِ" is Batta on her skateboard.
//
// The Hat Shop game: a friend waits, a syllable is heard ("بُ"), and the child
// gives the friend the right thing to wear. When only one mark is taught yet
// (the fatha chapter), the question turns around: two friends wear the same
// feather — which one says "بَ"? Evidence is the syllable skill, honest as
// always: heard + unassisted = independent listening; a miss makes it
// assisted. Nothing is timed or scored.
(function (ns) {
  const INK = "#4a3620";
  const shuffle = (list) => { const a = list.slice(); for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const F = () => ns.LetterFriends;
  const S = () => ns.LettersStrokes;
  const MARK_IDS = { "َ": "fatha", "ِ": "kasra", "ُ": "damma", "ْ": "sukoon", "ّ": "shadda", "ً": "fathatan", "ٍ": "kasratan", "ٌ": "dammatan" };
  const MARKS = Object.keys(MARK_IDS);
  const baseOf = (text) => [...String(text || "")].find((c) => F()?.FRIENDS?.[c]) || null;
  const markOf = (text) => MARKS.find((m) => String(text || "").includes(m)) || null;

  // The accessory for a mark, in the friend's 0–100 handwriting box. The mark's
  // own stroke is drawn thick in the accessory's colour (with an ink edge), and
  // a few details make it a thing.
  function markArt(mark) {
    const strokes = (S()?.MARKS?.[mark] || []);
    const id = MARK_IDS[mark];
    const color = { fatha: "#ee806f", fathatan: "#ee806f", kasra: "#62cdf4", kasratan: "#62cdf4", damma: "#f3c955", dammatan: "#f3c955", sukoon: "#ccfbef", shadda: "#f3c955" }[id] || "#ee806f";
    const band = (d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" data-ribbon/><path d="${d}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" data-ribbon/>`;
    let extra = "";
    if (id === "fatha" || id === "fathatan") extra = strokes.map((d) => { const m = d.match(/M([\d.]+) ([\d.]+)/); return m ? `<circle cx="${m[1]}" cy="${m[2]}" r="3" fill="#ffe49a" stroke="${INK}" stroke-width="1.6"/>` : ""; }).join("");
    if (id === "kasra" || id === "kasratan") extra = strokes.map((d) => { const n = d.match(/[\d.]+/g).map(Number); const [x1, y1, x2, y2] = n; return `<circle cx="${(x1 + (x2 - x1) * 0.25).toFixed(1)}" cy="${(y1 + (y2 - y1) * 0.25 + 4).toFixed(1)}" r="2.4" fill="${INK}"/><circle cx="${(x1 + (x2 - x1) * 0.75).toFixed(1)}" cy="${(y1 + (y2 - y1) * 0.75 + 4).toFixed(1)}" r="2.4" fill="${INK}"/>`; }).join("");
    if (id === "sukoon") extra = `<circle cx="47" cy="6" r="1.6" fill="#fffdf7"/>`;
    if (id === "shadda") extra = `<circle cx="64" cy="10" r="1.6" fill="#ee806f"/><circle cx="52" cy="6" r="1.6" fill="#ee806f"/><circle cx="40" cy="10" r="1.6" fill="#ee806f"/>`;
    // Worn 1.5× life size around the mark's own spot, so a small hand sees it.
    const [cx, cy] = ["kasra", "kasratan"].includes(id) ? [51, 94] : [51, 9];
    return `<g class="vh-acc" data-mark="${id}" transform="translate(${cx} ${cy}) scale(1.5) translate(${-cx} ${-cy})">${strokes.map(band).join("")}${extra}</g>`;
  }

  // A friend wearing a mark: the friend's own art with the accessory added.
  function wearing(char, mark, size = 140) {
    const svg = F()?.art(char, { size }) || "";
    return mark ? svg.replace(/<\/svg>$/, `<g class="vh-on">${markArt(mark)}</g></svg>`) : svg;
  }

  // An accessory on its own, framed so it fills a button.
  function accessory(mark, size = 84) {
    const above = !["ِ", "ٍ"].includes(mark);
    const box = above ? "18 -12 66 40" : "18 76 66 38";
    return `<svg class="vh-thing" viewBox="${box}" width="${size}" height="${size * 0.6}" aria-hidden="true">${markArt(mark)}</svg>`;
  }

  class HatShop {
    constructor(ctx) {
      this.ctx = ctx; this.alive = true; this.timers = [];
      const known = [...new Set([...(ctx.items || []), ...(ctx.known || [])].map((i) => baseOf(i?.display)).filter(Boolean))];
      // Marks come from the chapter's own syllables when it has them, else
      // from what finished chapters have taught.
      const fromItems = [...new Set((ctx.items || []).map((i) => markOf(i?.display)).filter(Boolean))];
      this.marks = (fromItems.length ? [...new Set([...fromItems, ...(ctx.marks || [])])] : (ctx.marks || [])).filter((m) => MARK_IDS[m]);
      const wanted = (ctx.items || []).filter((i) => baseOf(i?.display) && baseOf(i?.display) !== "ا" && markOf(i?.display)).map((i) => i.display);
      // Alif carries no vowel mark of its own (that needs a hamza: أَ), so it
      // never visits the hat shop — the curriculum leaves it out of syllables too.
      this.letters = known.filter((c) => c !== "ا");
      if (!this.letters.length) this.letters = ["ب"];
      const pool = this.letters.flatMap((c) => this.marks.map((m) => c + m));
      this.queue = [...new Set([...shuffle(wanted), ...shuffle(pool)])].slice(0, ctx.beginner ? 3 : 5);
      this.round = 0;
      ctx.stage.innerHTML = `<div class="vh" role="group" aria-label="The hat shop"></div>`;
      this.root = ctx.stage.firstElementChild;
      ctx.prompt?.(null);
      if (!this.marks.length || !this.queue.length) { this.later(() => ctx.done?.(), 300); return; }
      this.next();
    }
    later(fn, ms) { const t = setTimeout(() => { if (this.alive) fn(); }, ms); this.timers.push(t); }
    syllable(text) { return { id: text, display: text, speak: text }; }
    say(it) {
      let r; try { r = this.ctx.say?.(it); } catch { r = false; }
      if (r?.then) r.then((h) => { if (h === false) this.heard = false; }, () => {});
      return r;
    }
    next() {
      if (this.round >= this.queue.length) return this.finish();
      const target = this.queue[this.round];
      this.target = target; this.char = baseOf(target); this.mark = markOf(target);
      this.missed = false; this.heard = true; this.busy = false;
      // Two ways to ask: choose the hat (several marks taught), or choose the
      // friend (only one mark taught so far).
      this.mode = this.marks.length >= 2 ? "hat" : "friend";
      const n = this.ctx.beginner ? 2 : 3;
      if (this.mode === "hat") {
        this.offered = shuffle([this.mark, ...shuffle(this.marks.filter((m) => m !== this.mark)).slice(0, n - 1)]);
        this.root.innerHTML = `
          <div class="vh-stage"><span class="vh-friend">${wearing(this.char, null, 170)}</span></div>
          <div class="vh-shelf">${this.offered.map((m, i) => `<button type="button" class="vh-choice" data-i="${i}" aria-label="${MARK_IDS[m]}">${accessory(m)}</button>`).join("")}</div>
          ${this.dots()}`;
      } else {
        const others = shuffle(this.letters.filter((c) => c !== this.char)).slice(0, n - 1);
        this.offered = shuffle([this.char, ...others]);
        this.root.innerHTML = `
          <div class="vh-shelf is-friends">${this.offered.map((c, i) => `<button type="button" class="vh-choice is-friend" data-i="${i}" aria-label="${c}${this.mark}">${wearing(c, this.mark, 120)}</button>`).join("")}</div>
          ${this.dots()}`;
      }
      this.root.querySelectorAll(".vh-choice").forEach((b) => b.addEventListener("click", () => this.pick(Number(b.dataset.i), b)));
      this.ctx.beginRound?.(this.syllable(target), "syllable");
      if (this.ctx.canListen?.() === false) { this.heard = false; this.ctx.prompt?.(this.syllable(target)); }
      this.later(() => this.say(this.syllable(target)), 350);
    }
    dots() { return `<div class="pz-progress" aria-hidden="true">${this.queue.map((_, i) => `<i class="${i < this.round ? "is-done" : i === this.round ? "is-on" : ""}"></i>`).join("")}</div>`; }
    replayPrompt() { if (this.target) this.say(this.syllable(this.target)); }
    pick(i, btn) {
      if (this.busy) return;
      const chosenText = this.mode === "hat" ? this.char + this.offered[i] : this.offered[i] + this.mark;
      const correct = chosenText === this.target;
      const independent = !this.missed && this.heard !== false;
      this.ctx.reportOutcome?.({ item: this.syllable(this.target), itemId: this.target, activity: "HatShop", skill: "syllable", correct,
        evidence: independent ? "independent_listening" : "supported_visible_matching", assisted: !!this.missed,
        selectedId: chosenText, choiceIds: this.offered.map((o) => (this.mode === "hat" ? this.char + o : o + this.mark)), affectsStrength: true });
      // Whatever was chosen says its own sound — trying on is how you learn.
      this.say(this.syllable(chosenText));
      if (!correct) {
        this.missed = true;
        this.ctx.sfx?.("softwrong");
        if (!this.ctx.reducedMotion?.()) btn.animate?.([{ rotate: "0deg" }, { rotate: "-8deg" }, { rotate: "8deg" }, { rotate: "0deg" }], { duration: 360 });
        this.root.querySelectorAll(".vh-choice").forEach((b, k) => b.classList.toggle("is-hint", (this.mode === "hat" ? this.offered[k] === this.mark : this.offered[k] === this.char)));
        this.later(() => this.say(this.syllable(this.target)), 900);
        return;
      }
      this.busy = true;
      if (this.mode === "hat") {
        // The hat flies onto the friend.
        const friend = this.root.querySelector(".vh-friend");
        friend.innerHTML = wearing(this.char, this.mark, 170);
        friend.classList.add("is-dressed");
        btn.classList.add("is-taken");
      } else btn.classList.add("is-right");
      this.ctx.tryon?.();
      this.ctx.sfx?.("tryon");
      this.ctx.correct?.();
      this.ctx.confettiAt?.(btn);
      this.ctx.pet?.cheer?.();
      this.later(() => this.ctx.sfx?.(F().get(this.char).call), 500);
      this.later(() => this.say(this.syllable(this.target)), 1100);
      this.round += 1;
      this.later(() => this.next(), 2700);
    }
    finish() { this.busy = true; this.ctx.sfx?.("cheer2"); this.later(() => this.ctx.done?.(), 800); }
    destroy() { this.alive = false; this.timers.forEach(clearTimeout); }
  }

  ns.GardenPractice = ns.GardenPractice || {};
  ns.GardenPractice.HatShop = HatShop;
  ns.VowelGames = { MARK_IDS, markArt, wearing, accessory, baseOf, markOf, KINDS: ["HatShop"] };
})(window.MiftahGame || (window.MiftahGame = {}));
