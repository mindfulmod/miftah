// Letter Hunt (v6, 2026-10-01): an I-spy scene for the practice garden. The
// child's own land is drawn as a big picture with six letters they know living
// on things in it — a cloud, a kite, a tree trunk, a rock, a crate, a lily
// pad… The pet asks for one by name; the child finds it, and that thing comes
// alive (the kite flies, the crate opens) while the letter drops into the
// basket. Five finds and the hunt is done.
//
// Honesty matches the Water Garden: with sound on, the prompt is heard, not
// shown (independent listening); with sound off, or after a miss, the letter
// appears in the bubble (supported matching). Every letter tap is reported
// once; taps on plain scenery are play and report nothing.
(function (ns) {
  const INK = "#4a3620";
  const key = (item) => item?.id ?? item?.display;
  const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(([, v]) => v);

  // Each thing draws around (0,0); `label` is where its letter sits.
  const THINGS = {
    cloud: { art: `<path d="M-62 18Q-70-8-44-10Q-36-34-8-26Q8-42 30-26Q58-30 60-4Q72 14 52 22Z" fill="#fffdf7" stroke="#c9bda4" stroke-width="3"/>`, label: [0, 0], size: 40 },
    kite: { art: `<path d="M0-48L34 0L0 52L-34 0Z" fill="#ffa798" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M0-48V52M-34 0H34" stroke="#fffaf0" stroke-width="2.4"/><path d="M0 52Q-14 76 6 92Q-8 108 4 126" fill="none" stroke="${INK}" stroke-width="1.6"/>`, label: [0, 0], size: 34, plate: true },
    trunk: { art: `<path d="M-20 70V-20Q-22-34-8-36H8Q22-34 20-20V70Z" fill="#a89478" stroke="${INK}" stroke-width="3"/><circle cy="-70" r="58" fill="#4e9677"/><path d="M-50-86Q-30-126 10-124Q44-120 54-90Q20-110-50-86Z" fill="#7fce54"/><ellipse cy="14" rx="15" ry="20" fill="#e5dcc8" stroke="#70501b" stroke-width="2.4"/>`, label: [0, 14], size: 30 },
    rock: { art: `<path d="M-56 30Q-60-6-30-20Q-6-34 24-24Q56-16 58 18Q58 34 40 36H-40Q-56 36-56 30Z" fill="#c9bda4" stroke="${INK}" stroke-width="3"/><path d="M-30-12Q-10-22 12-18" fill="none" stroke="#e5dcc8" stroke-width="4" stroke-linecap="round"/>`, label: [0, 8], size: 36 },
    crate: { art: `<path d="M-46-30H46V40H-46Z" fill="#c69434" stroke="${INK}" stroke-width="3"/><path d="M-46-8H46M-46 18H46" stroke="#70501b" stroke-width="2.4"/><circle cx="-24" cy="-38" r="12" fill="#ee806f" stroke="${INK}" stroke-width="2.4"/><circle cx="2" cy="-40" r="12" fill="#f3c955" stroke="${INK}" stroke-width="2.4"/><circle cx="26" cy="-36" r="12" fill="#ee806f" stroke="${INK}" stroke-width="2.4"/><rect x="-28" y="-8" width="56" height="40" rx="8" fill="#fffaf0" stroke="#70501b" stroke-width="2.4"/>`, label: [0, 11], size: 32 },
    lily: { art: `<ellipse cx="0" cy="10" rx="62" ry="22" fill="#4e9677" stroke="${INK}" stroke-width="3"/><path d="M0 10L40-4" stroke="#2f5c46" stroke-width="3"/><ellipse cx="0" cy="6" rx="50" ry="15" fill="#7fce54"/><circle cx="44" cy="-6" r="8" fill="#ffa798" stroke="${INK}" stroke-width="2.4"/>`, label: [-6, 6], size: 32 },
    sail: { art: `<path d="M-50 30H50L36 52H-36Z" fill="#c69434" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M0 30V-70" stroke="${INK}" stroke-width="4"/><path d="M4-66L50 22H4Z" fill="#fffaf0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`, label: [22, -4], size: 30 },
    lantern: { art: `<path d="M0-70V-46" stroke="${INK}" stroke-width="3"/><rect x="-24" y="-46" width="48" height="66" rx="12" fill="#ffe49a" stroke="${INK}" stroke-width="3"/><path d="M-30-46H30M-30 20H30" stroke="#70501b" stroke-width="4" stroke-linecap="round"/>`, label: [0, -13], size: 34 },
    flag: { art: `<path d="M-30 70V-60" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M-28-62H48L34-30L48 2H-28Z" fill="#62cdf4" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`, label: [4, -32], size: 34 },
    shell: { art: `<path d="M-44 24Q-48-24 0-34Q48-24 44 24Z" fill="#ffa798" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M0-30V22M-24-20L-14 22M24-20L14 22" stroke="#ee806f" stroke-width="2.4"/><rect x="-18" y="-6" width="36" height="26" rx="8" fill="#fffaf0" opacity=".9"/>`, label: [0, 7], size: 28 },
    pot: { art: `<path d="M-36-10H36L28 40H-28Z" fill="#c25a49" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-40-20H40V-8H-40Z" fill="#ee806f" stroke="${INK}" stroke-width="3"/><path d="M-10-20Q-30-60-6-70M8-20Q20-56 34-62" fill="none" stroke="#4e9677" stroke-width="4" stroke-linecap="round"/><circle cx="-6" cy="-72" r="9" fill="#f3c955" stroke="${INK}" stroke-width="2.4"/>`, label: [0, 16], size: 30 },
  };
  // Six places per land: x, y in an 800×600 picture, and which thing lives there.
  const LANDS = {
    meadow: { sky: "#96ecff", ground: "#7fce54", far: "#b7e779", spots: [[150, 120, "cloud"], [610, 110, "kite"], [140, 360, "trunk"], [400, 470, "rock"], [640, 450, "pot"], [400, 300, "flag"]] },
    orchard: { sky: "#ccfbef", ground: "#7fce54", far: "#b7e779", spots: [[150, 120, "cloud"], [620, 110, "kite"], [150, 360, "trunk"], [640, 380, "trunk"], [400, 480, "crate"], [400, 300, "flag"]] },
    lagoon: { sky: "#96ecff", ground: "#62cdf4", far: "#b7e779", spots: [[160, 110, "cloud"], [620, 250, "sail"], [190, 470, "lily"], [470, 520, "lily"], [400, 320, "flag"], [640, 470, "shell"]] },
    night: { sky: "#4a4d84", ground: "#2f5c46", far: "#4e9677", spots: [[160, 120, "cloud"], [620, 200, "lantern"], [150, 360, "trunk"], [400, 480, "rock"], [640, 460, "pot"], [400, 260, "lantern"]] },
    peaks: { sky: "#ccfbef", ground: "#b7e779", far: "#e5dcc8", spots: [[160, 110, "cloud"], [620, 120, "kite"], [190, 420, "rock"], [600, 460, "rock"], [400, 330, "flag"], [400, 500, "crate"]] },
    river: { sky: "#96ecff", ground: "#7fce54", far: "#b7e779", spots: [[160, 110, "cloud"], [620, 330, "sail"], [150, 380, "trunk"], [420, 500, "shell"], [640, 500, "lily"], [400, 290, "flag"]] },
  };

  // Upright phones get their own picture: the same six things in two columns,
  // sky things on top, drawn bigger so letters stay finger- and eye-sized.
  const PORTRAIT = [[160, 150], [440, 170], [150, 420], [450, 440], [160, 690], [440, 700]];
  function scene(land, letters, portrait = false) {
    const L = LANDS[land] || LANDS.meadow;
    if (portrait) {
      const order = L.spots.map((s, i) => [s, i]).sort((a, b) => a[0][1] - b[0][1]);
      const night = land === "night";
      const things = order.map(([[, , kind], i], k) => {
        const [x, y] = PORTRAIT[k], t = THINGS[kind], letter = letters[i];
        const glyph = letter ? `<text class="hunt-letter" x="${t.label[0]}" y="${t.label[1]}" text-anchor="middle" dominant-baseline="central" font-family="'Amiri Quran', serif" font-size="${Math.round(t.size * 1.3)}" fill="${INK}" direction="rtl">${letter.display}</text>` : "";
        return `<g class="hunt-spot" data-spot="${i}" data-kind="${kind}" transform="translate(${x} ${y}) scale(1.3)" role="button" tabindex="0" aria-label="${letter ? `Letter ${letter.display}` : "Garden thing"}"><g class="hunt-thing">${t.art}${glyph}</g></g>`;
      }).join("");
      const water = land === "lagoon" || land === "river" ? `<path d="M-20 560Q150 530 300 550Q450 570 620 540V880H-20Z" fill="#62cdf4"/>` : "";
      return `<svg class="hunt-scene is-portrait" viewBox="0 0 600 860" preserveAspectRatio="xMidYMid meet" aria-label="Find the letter in the picture">
        <rect width="600" height="860" fill="${L.sky}"/>${night ? [[60, 50], [240, 30], [520, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fffaf0"/>`).join("") : ""}
        <path d="M-20 330Q150 290 300 315Q460 340 620 300V880H-20Z" fill="${L.far}"/>
        <path d="M-20 470Q200 420 380 460Q500 480 620 450V880H-20Z" fill="${L.ground}"/>${water}${things}</svg>`;
    }
    const night = land === "night";
    const peaks = land === "peaks" ? `<path d="M-20 360L150 150L270 300L400 170L560 330L660 190L820 360Z" fill="#e5dcc8"/><path d="M150 150L176 188L150 180L128 196ZM400 170L424 206L402 198L382 212ZM660 190L684 222L662 214L642 228Z" fill="#fffdf7"/>` : "";
    const water = land === "lagoon" || land === "river" ? `<path d="M-20 430Q200 400 400 420Q600 440 820 410V620H-20Z" fill="#62cdf4"/><path d="M60 470q30-8 60 0M520 500q30-8 60 0" fill="none" stroke="#ccfbef" stroke-width="4" stroke-linecap="round"/>` : "";
    const stars = night ? [[80, 60], [300, 40], [480, 90], [720, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fffaf0"/>`).join("") : "";
    const spots = L.spots.map(([x, y, kind], i) => {
      const t = THINGS[kind], letter = letters[i];
      const glyph = letter ? `<text class="hunt-letter" x="${t.label[0]}" y="${t.label[1]}" text-anchor="middle" dominant-baseline="central" font-family="'Amiri Quran', serif" font-size="${t.size}" fill="${INK}" direction="rtl">${letter.display}</text>` : "";
      return `<g class="hunt-spot" data-spot="${i}" data-kind="${kind}" transform="translate(${x} ${y})" role="button" tabindex="0" aria-label="${letter ? `Letter ${letter.display}` : "Garden thing"}"><g class="hunt-thing">${t.art}${glyph}</g></g>`;
    }).join("");
    return `<svg class="hunt-scene" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-label="Find the letter in the picture">
      <rect width="800" height="600" fill="${L.sky}"/>${stars}${peaks}
      <path d="M-20 360Q200 300 400 340Q620 380 820 320V620H-20Z" fill="${L.far}"/>
      <path d="M-20 420Q260 360 520 410Q680 440 820 400V620H-20Z" fill="${L.ground}"/>${water}
      ${spots}</svg>`;
  }

  class LetterHunt {
    constructor(ctx) {
      this.ctx = ctx;
      this.alive = true;
      this.land = ctx.land || "meadow";
      const pool = shuffle((ctx.items || []).filter((i) => i && i.display));
      this.letters = pool.slice(0, 6);
      this.targets = shuffle(this.letters).slice(0, Math.min(5, this.letters.length));
      this.index = 0;
      this.found = new Set();
      const portrait = (ctx.stage.clientHeight || 0) > (ctx.stage.clientWidth || 1) * 1.05;
      ctx.stage.innerHTML = `<div class="hunt">${scene(this.land, this.letters, portrait)}<div class="hunt-basket" aria-label="Letters found"></div></div>`;
      this.svg = ctx.stage.querySelector(".hunt-scene");
      this.basket = ctx.stage.querySelector(".hunt-basket");
      // A wide, short stage (a phone on its side) would crop the 4:3 scene top
      // and bottom with "slice" — a kite's letter could vanish. Fit it whole.
      const wide = (ctx.stage.clientWidth || 0) > (ctx.stage.clientHeight || 1) * 1.55;
      if (wide && !portrait) { this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet"); this.svg.classList.add("is-fitted"); }
      this.svg.querySelectorAll(".hunt-spot").forEach((spot) => {
        const go = () => this.tap(Number(spot.dataset.spot));
        spot.addEventListener("click", go);
        spot.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      });
      setTimeout(() => this.alive && this.ask(), 500);
    }

    get target() { return this.targets[this.index]; }

    ask() {
      if (!this.alive) return;
      this.missed = false;
      this.heard = this.ctx.canListen?.() !== false;
      this.assisted = !this.heard;
      // Heard, not shown — unless sound is off.
      this.ctx.prompt?.(this.assisted ? this.target : null);
      if (this.heard) this.ctx.say?.(this.target);
      this.ctx.setRoundProgress?.(this.index + 1, this.targets.length);
    }

    replayPrompt() { if (this.alive && this.target) this.ctx.say?.(this.target); }

    wiggle(spot) {
      if (this.ctx.reducedMotion?.()) return;
      spot.querySelector(".hunt-thing")?.animate?.([{ transform: "none" }, { transform: "rotate(-6deg)" }, { transform: "rotate(5deg)" }, { transform: "none" }], { duration: 420 });
    }

    tap(i) {
      if (!this.alive || this.busy) return;
      const spot = this.svg.querySelector(`.hunt-spot[data-spot="${i}"]`);
      const letter = this.letters[i];
      if (!letter || this.found.has(i)) { this.wiggle(spot); this.ctx.sfx?.("rustle"); return; }
      const correct = key(letter) === key(this.target);
      const independent = this.heard && !this.assisted;
      this.ctx.reportOutcome?.({ item: this.target, itemId: key(this.target), activity: "LetterHunt", correct,
        evidence: independent ? "independent_listening" : "supported_visible_matching", skill: "letter-name",
        selectedId: key(letter), choiceIds: this.letters.filter((_, k) => !this.found.has(k)).map(key), assisted: !independent, affectsStrength: true });
      if (!correct) {
        // A miss shows the letter it is looking for; nothing is lost.
        this.assisted = true;
        this.ctx.prompt?.(this.target);
        this.wiggle(spot);
        this.ctx.sfx?.("softwrong");
        return;
      }
      this.busy = true;
      this.found.add(i);
      spot.classList.add("is-found", `is-${spot.dataset.kind}`);
      this.ctx.correct?.();
      this.ctx.confettiAt?.(spot);
      this.ctx.pet?.cheer?.();
      const tag = document.createElement("span");
      tag.className = "hunt-found";
      tag.textContent = letter.display;
      this.basket.appendChild(tag);
      setTimeout(() => {
        if (!this.alive) return;
        this.busy = false;
        this.index += 1;
        if (this.index >= this.targets.length) { this.ctx.pet?.cheer?.(); setTimeout(() => this.alive && this.ctx.done?.(), 900); }
        else this.ask();
      }, 1100);
    }

    destroy() { this.alive = false; }
  }

  LetterHunt.LANDS = LANDS;
  LetterHunt.THINGS = THINGS;
  LetterHunt.scene = scene;
  ns.GardenPractice = ns.GardenPractice || {};
  ns.GardenPractice.LetterHunt = LetterHunt;
})(window.MiftahGame || (window.MiftahGame = {}));
