// The Letter Garden — a wordless, full-screen letters game for children who
// can't yet read anything (Arabic OR English). Everything is communicated
// with art, motion and sound: a journey map, meet-the-letter moments, and a
// carousel of mini-games. It shares the Codex track's storage keys
// (quran-trainer:letters:*), so worlds finished here light up the Codex
// ladder and eventually open the Word Desk; island rewards accrue too.
(function (ns) {
  const PROGRESS_KEY = "quran-trainer:letters:progress";
  const STARS_KEY = "quran-trainer:letters:stars";
  const STAMPS_KEY = "quran-trainer:letters:stamps";
  const Art = ns.LettersArt;

  const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // A small, soft butterfly for the ambient-life layer — wings flap via CSS.
  // Colour comes from the --bf-hue custom property set per instance.
  const butterflySVG = () => `
    <svg viewBox="0 0 40 34" aria-hidden="true">
      <g class="bf-wing bf-l">
        <path d="M20 17 C8 2 -2 6 3 16 C-2 26 10 32 20 17 Z" fill="hsl(var(--bf-hue) 78% 68%)" stroke="#4a3620" stroke-width="1.6"/>
        <circle cx="8" cy="12" r="2.2" fill="#fffaf0"/>
      </g>
      <g class="bf-wing bf-r">
        <path d="M20 17 C32 2 42 6 37 16 C42 26 30 32 20 17 Z" fill="hsl(var(--bf-hue) 78% 62%)" stroke="#4a3620" stroke-width="1.6"/>
        <circle cx="32" cy="12" r="2.2" fill="#fffaf0"/>
      </g>
      <ellipse cx="20" cy="18" rx="2" ry="7" fill="#4a3620"/>
    </svg>`;

  class LettersGame {
    constructor(root) {
      this.root = root;
      this.stopGlyphFit = Art.watchGlyphs?.(root);
      this.sound = new ns.SoundSystem();
      // Haptics ride along with the sound vocabulary: decorating the two cue
      // entry points here means every existing play()/streakMelody() call site
      // buzzes correctly, with nothing new to keep in sync. Deliberately
      // OUTSIDE SoundSystem.play(), which early-returns when muted — a muted
      // tablet is exactly when touch feedback matters most.
      {
        const rawPlay = this.sound.play.bind(this.sound);
        this.sound.play = (name) => {
          if (ns.Haptics) ns.Haptics.pulse(name);
          // Every tappable thing now chimes from one delegated listener, but
          // plenty of handlers still play their own "click" on the following
          // click event. Swallow the duplicate so a single tap is a single
          // sound instead of a stutter.
          if (name === "click") {
            const now = performance.now();
            if (now - (this._lastTapSound || 0) < 220) return;
            this._lastTapSound = now;
          }
          return rawPlay(name);
        };
      }
      if (ns.Haptics) {
        const rawMelody = this.sound.streakMelody.bind(this.sound);
        this.sound.streakMelody = (streak) => {
          ns.Haptics.pulse("correct"); // the melody IS the correct-answer cue
          return rawMelody(streak);
        };
      }
      this.worlds = new ns.LettersWorlds();
      this.progress = this.loadProgress();
      this.stars = this.loadStars();
      // Island progression is deliberately NOT wired up for now — the Letter
      // Garden will get its own reward loop later.
      this.island = null;
      this.game = null; // active mini-game instance
      this.stamps = this.loadStamps();
      // Letter Garden uses generated speech only; no recording probes or playback.
      this.speechTurn = 0;
      // Prime the async voice list now so the FIRST spoken prompt already
      // has the premium Arabic voices to choose from (getVoices() returns []
      // until the browser finishes loading them).
      if ("speechSynthesis" in window) {
        try {
          speechSynthesis.getVoices();
          speechSynthesis.addEventListener?.("voiceschanged", () => speechSynthesis.getVoices(), { once: true });
        } catch {}
      }
      this.pet = this.loadJSON("quran-trainer:letters:pet", null);
      this.reduceMotion = this.loadJSON("quran-trainer:letters:reduced-motion", false);
      this.skills = this.loadJSON("quran-trainer:letters:skills", {});
      this.wallet = this.loadJSON("quran-trainer:letters:wallet", { earned: 0, spent: 0 });
      // Best stars per world+game, so stars pay for improvement not repetition.
      this.bests = this.loadJSON("quran-trainer:letters:bests", {});
      this.stickers = this.loadJSON("quran-trainer:letters:stickers", { owned: [] });
      this.applyPhase();
      this.initSparkles();
      this.initAmbient();
      this.initTouchFeedback();
      // Wait for the Quran font alongside the word data: the glyph tiles
      // measure their ink to centre optically, and measuring against the
      // fallback serif would bake wrong offsets into the first screens.
      const fontReady =
        document.fonts && document.fonts.load
          ? document.fonts.load('64px "Amiri Quran"')
          : Promise.resolve();
      // Optical centering (2026-07-19) needs each letter's true ink extent,
      // which can only be measured by rasterizing actual SVG output (see
      // LettersArt's inkShift comment) — an async pass, so warm the whole
      // fixed alphabet before the first screen ever paints.
      const inkReady = fontReady.then(() =>
        Art.warmInk(this.worlds.letters.map((l) => l.char)),
      );
      Promise.allSettled([this.worlds.loadWords(), inkReady]).then(() =>
        this.pet ? this.renderHome() : this.renderHatch(),
      );
    }

    // Every tappable thing gives way under the finger. One delegated listener
    // beats sprinkling calls through every mini-game, and it can't drift out of
    // sync as games are added.
    //
    // The catch: game pieces are POSITIONED by transform (.catch-faller rides
    // on translateX, bubbles rise on transform), so animating scale on the
    // wrapper would fling them across the screen. Where a transform is already
    // doing layout work, recoil the inner <svg> instead — visually identical,
    // and it never fights the motion system.
    initTouchFeedback() {
      if (!ns.Haptics) return;
      const TAPPABLE =
        "button, .pop-bubble, .catch-faller, .map-stop, .meet-bud, .meet-piece, [data-tap]";
      this.root.addEventListener(
        "pointerdown",
        (e) => {
          this.unlockSpeech();
          // Unlock WebAudio here too, on a real touch. Celebrations, star bells
          // and melodies all fire from setTimeout — outside any gesture — so if
          // the context has never been resumed they are silently dropped and the
          // game feels mute even though every cue is wired. One in-gesture
          // unlock on the very first touch makes all later timed audio work.
          try {
            this.sound.unlock();
          } catch {}
          const el = e.target.closest && e.target.closest(TAPPABLE);
          if (!el) return;
          // Audible confirmation on EVERY tappable, not just the ones whose
          // handlers happen to play something. A child needs to hear that the
          // thing they touched was the thing that responded.
          this.sound.play("click");
          const transformed = getComputedStyle(el).transform !== "none";
          const target = transformed ? el.querySelector(":scope > svg") : el;
          // No inner svg to recoil on a transform-positioned piece: skip the
          // visual rather than break its position. The buzz still fires.
          // On iOS there is no Vibration API at all, so the recoil is the ONLY
          // tactile channel a web app gets. Where we can't buzz, press harder:
          // use the full recoil everywhere instead of the softer button variant.
          const kind = ns.Haptics.supported && el.tagName === "BUTTON" ? "soft" : "tap";
          if (target) ns.Haptics.impact(target, kind);
        },
        { passive: true },
      );
    }

    // Ambient life (spec: specs/02): a few creatures drift across the garden
    // behind everything, so it feels alive even when idle. Day brings
    // butterflies; dusk and night bring fireflies. One persistent layer,
    // pure delight, no gameplay — and it steps aside for reduced-motion.
    initAmbient() {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const phase = Art.dayPhase();
      const night = phase === "night" || phase === "dusk";
      const layer = document.createElement("div");
      layer.className = "lg-ambient";
      layer.setAttribute("aria-hidden", "true");
      // Just 2-3 butterflies by day (a crowd reads as wallpaper, a few read
      // as visitors), and they don't all ride the same conveyor: alternate
      // ones fly the other way, each on its own meandering timing.
      const n = night ? 7 : 2 + Math.round(Math.random());
      for (let i = 0; i < n; i += 1) {
        const c = document.createElement("i");
        c.className = night ? "lg-firefly-amb" : "lg-butterfly";
        const dir = i % 2 === 0 ? 1 : -1;
        if (!night) {
          const hues = [340, 45, 275, 200];
          c.style.setProperty("--bf-hue", String(hues[i % hues.length]));
          c.style.setProperty("--amb-dir", String(dir));
          c.style.setProperty("--flap-dur", `${(0.26 + Math.random() * 0.14).toFixed(2)}s`);
          if (dir === -1) {
            c.style.left = "auto";
            c.style.right = "-60px";
          }
          c.innerHTML = butterflySVG();
        }
        c.style.top = `${8 + Math.random() * 78}%`;
        c.style.setProperty("--amb-dur", `${22 + Math.random() * 20}s`);
        c.style.setProperty("--amb-delay", `${-Math.random() * 30}s`);
        c.style.setProperty("--amb-rise", `${Math.round(Math.random() * 60 - 30)}px`);
        layer.appendChild(c);
      }
      // Mount on body so it survives the screen innerHTML swaps (same pattern
      // as the sparkle trail); a soft overlay drifting across the whole scene.
      document.querySelector(".lg-ambient")?.remove();
      document.body.appendChild(layer);
    }

    // The garden lives on the child's clock: the sky (CSS variables consumed
    // by the body gradient) and the backdrop art both follow the day phase.
    applyPhase() {
      const p = Art.PHASES[Art.dayPhase()] || Art.PHASES.day;
      const s = document.body.style;
      s.setProperty("--lg-sky-hi", p.hi);
      // A true mid band keeps the sky a three-stop gradient instead of
      // flattening the lower two thirds into one colour.
      s.setProperty("--lg-sky-mid", `color-mix(in srgb, ${p.hi} 45%, ${p.lo})`);
      s.setProperty("--lg-sky-lo", p.lo);
    }

    // Sparkle touch trail: dragging a finger anywhere leaves fading star
    // dust. Zero gameplay purpose — pure toy delight.
    initSparkles() {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      let last = 0;
      let lx = 0;
      let ly = 0;
      const colors = ["", "is-pink", "is-blue"];
      // Perf (iPad, 2026-07-18): a fixed pool of spark nodes gets recycled
      // instead of creating/destroying DOM mid-drag — drags happen exactly
      // when mini-games are busiest.
      const POOL = 12;
      const pool = [];
      let next = 0;
      for (let i = 0; i < POOL; i += 1) {
        const s = document.createElement("i");
        s.className = "lg-spark";
        s.style.display = "none";
        document.body.appendChild(s);
        pool.push(s);
      }
      this.root.addEventListener("pointermove", (e) => {
        if (e.pointerType === "mouse" && e.buttons === 0) return; // drags only, not hover
        const now = performance.now();
        if (now - last < 40 && Math.hypot(e.clientX - lx, e.clientY - ly) < 24) return;
        last = now;
        lx = e.clientX;
        ly = e.clientY;
        const s = pool[next];
        next = (next + 1) % POOL;
        s.className = `lg-spark ${colors[Math.floor(Math.random() * colors.length)]}`;
        s.style.display = "";
        s.style.left = `${e.clientX}px`;
        s.style.top = `${e.clientY}px`;
        s.style.setProperty("--sx", `${Math.round(Math.random() * 24 - 12)}px`);
        s.style.setProperty("--sy", `${Math.round(Math.random() * 20 + 6)}px`);
        // Restart the fade animation on the recycled node.
        s.style.animation = "none";
        void s.offsetWidth;
        s.style.animation = "";
      });
    }

    // ---------- storage (shared with the Codex letters track) ----------

    loadProgress() {
      try {
        const data = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
        return { done: Array.isArray(data.done) ? data.done : [], skipped: !!data.skipped };
      } catch {
        return { done: [], skipped: false };
      }
    }

    saveProgress() {
      try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(this.progress));
      } catch {}
    }

    loadStars() {
      try {
        const data = JSON.parse(localStorage.getItem(STARS_KEY) || "{}");
        return data && typeof data === "object" ? data : {};
      } catch {
        return {};
      }
    }

    saveStars() {
      try {
        localStorage.setItem(STARS_KEY, JSON.stringify(this.stars));
      } catch {}
    }

    loadJSON(key, fallback) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || "null");
        return data === null ? fallback : data;
      } catch {
        return fallback;
      }
    }

    saveJSON(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    }

    // ---------- the Letter Pet ----------

    starBalance() {
      return Math.max(0, (this.wallet.earned || 0) - (this.wallet.spent || 0));
    }

    earnStars(n) {
      this.wallet.earned = (this.wallet.earned || 0) + n;
      this.saveJSON("quran-trainer:letters:wallet", this.wallet);
    }

    spendStars(n) {
      if (this.starBalance() < n) return false;
      this.wallet.spent = (this.wallet.spent || 0) + n;
      this.saveJSON("quran-trainer:letters:wallet", this.wallet);
      return true;
    }

    petStage() {
      // Grows with the longer Noorani Qaida ladder: kid after the letter
      // packs, reader once the sounds and marks are all conquered.
      const done = this.progress.done.length;
      return done >= 15 ? 3 : done >= 5 ? 2 : 1;
    }

    // Pet radiance (spec: specs/02) — the companion literally shines brighter
    // as the child LEARNS, not as they spend. Driven by how many letters have
    // grown strong in the quiet strength model, so a glow-up is earned by
    // knowing, never bought. 0..1.
    petRadiance() {
      const strength = ns.LettersStrength;
      if (!strength) return 0;
      const letters = ns.LETTERS_DATA.packs.flatMap((p) => p.letters);
      let met = 0;
      let strong = 0;
      for (const l of letters) {
        const e = strength.map[l.char];
        if (e && e.r + e.w > 0) {
          met += 1;
          if (strength.mastery(l.char) >= 0.7) strong += 1;
        }
      }
      if (met < 3) return 0;
      return Math.min(1, strong / letters.length + 0.05);
    }

    // Everything the child has taught the pet: letters from finished packs.
    petKnowledge() {
      const known = [];
      for (const pack of ns.LETTERS_DATA.packs) {
        if (this.progress.done.includes(`pack-${pack.id}`)) known.push(...pack.letters);
      }
      return known;
    }

    petSVG(size, mood) {
      return Art.pet({
        hue: this.pet ? this.pet.hue : 200,
        species: this.pet ? this.pet.species || "blob" : "blob",
        stage: this.petStage(),
        worn: this.pet ? this.pet.worn || [] : [],
        size,
        mood,
      });
    }

    // Tap the pet, and it recites something the child has taught it — the
    // child's own progress, spoken back by their creature.
    petRecite(bubbleEl) {
      // The bubble carries its own backing art, so only the glyph inside gets
      // the optical-centering nudge — never the bubble itself.
      const setBubble = (text) => {
        if (!bubbleEl) return;
        const s = Art.inkShift(text, 26, false);
        bubbleEl.innerHTML = `<span style="display:inline-block; transform:translate(${s.dx.toFixed(1)}px, ${s.htmlDy.toFixed(1)}px)">${text}</span>`;
      };
      const known = this.petKnowledge();
      if (!known.length) {
        this.sound.play("click");
        setBubble("؟");
        return;
      }
      const letter = known[Math.floor(Math.random() * known.length)];
      setBubble(letter.char);
      this.say({ display: letter.char, speak: letter.arName });
    }

    // First visit: hatch the pet. Three taps crack the egg, then the child
    // picks its colour — all wordless.
    renderHatch(cracks = 0) {
      const hues = [200, 320, 95, 268, 28];
      const hatched = cracks >= 3;
      const el = this.screen(
        "lg-hatch",
        `${this.topBar({ home: false })}
        <div class="hatch-stage">
          ${hatched
            ? `<div class="hatch-pet">${this.petSVG(220, "open")}</div>
               <div class="hatch-hues">${hues.map((h) => `<button type="button" class="hatch-hue${(this.pet?.hue ?? 200) === h ? " is-picked" : ""}" data-hue="${h}" style="--h:${h}"></button>`).join("")}</div>
               <button type="button" class="lg-big-btn hatch-go">${Art.icon("check", 40)}</button>`
            : `<button type="button" class="hatch-egg" aria-label="Tap the egg to hatch your pet">${Art.egg({ size: 190, cracks })}</button>`}
        </div>`,
      );
      // No external exit is exposed during hatching.
      this.wireTopBar(el);
      if (!hatched) {
        const eggBtn = el.querySelector(".hatch-egg");
        let n = cracks;
        eggBtn.addEventListener("pointerdown", () => {
          n += 1;
          this.sound.play(n >= 3 ? "hatch" : "click");
          if (n >= 3) {
            this.pet = this.pet || { hue: 200, species: "blob", worn: [], bodies: ["blob"] };
            this.saveJSON("quran-trainer:letters:pet", this.pet);
            this.confettiAt(eggBtn, true);
            this.renderHatch(3);
            return;
          }
          // Repaint the egg in place instead of re-rendering the screen. The
          // full re-render used to replace this element on the same frame,
          // killing the wobble before it drew — which is exactly why the first
          // taps read as "nothing happened".
          eggBtn.innerHTML = Art.egg({ size: 190, cracks: n });
          const art = eggBtn.querySelector(".art-egg");
          if (art) {
            art.classList.remove("is-wobble");
            void art.offsetWidth;
            art.classList.add("is-wobble");
          }
        });
        return;
      }
      for (const swatch of el.querySelectorAll(".hatch-hue")) {
        swatch.addEventListener("click", () => {
          this.pet.hue = Number(swatch.dataset.hue);
          this.saveJSON("quran-trainer:letters:pet", this.pet);
          this.sound.play("click");
          this.renderHatch(3);
        });
      }
      el.querySelector(".hatch-pet").addEventListener("pointerdown", () => this.petRecite(null));
      el.querySelector(".hatch-go").addEventListener("click", () => {
        this.sound.play("page");
        this.renderHome();
      });
    }

    // Wardrobe shelves swipe horizontally, but the CSS hid the scrollbar
    // (scrollbar-width:none plus a ::-webkit-scrollbar reset) and put nothing in
    // its place — no fade, no arrows, no guaranteed half-cut item. With fixed
    // 82px tiles the last visible one can land flush, so the shelf looks
    // COMPLETE and a child has no reason to swipe. Three cues fix that:
    //   - the edge that has more content fades out, so content visibly continues
    //   - snap points make a swipe land cleanly instead of drifting
    //   - a one-time nudge performs the swipe once, on the child's behalf
    wireShelf(shelf, { demonstrate = true } = {}) {
      const sync = () => {
        const max = shelf.scrollWidth - shelf.clientWidth;
        if (max <= 4) {
          shelf.classList.remove("can-left", "can-right");
          return false;
        }
        shelf.classList.toggle("can-left", shelf.scrollLeft > 4);
        shelf.classList.toggle("can-right", shelf.scrollLeft < max - 4);
        return true;
      };
      shelf.addEventListener("scroll", sync, { passive: true });
      // Layout may not be settled on the frame the screen mounts.
      requestAnimationFrame(() => {
        if (!sync() || !shelf.isConnected || !demonstrate || this.prefersReducedMotion()) return;
        // Demonstrate once per screen, and never fight a child already swiping.
        let touched = false;
        for(const type of ['pointerdown','focusin','wheel'])
          shelf.addEventListener(type, () => (touched = true), { once: true, passive: true });
        setTimeout(() => {
          if (touched || !shelf.isConnected || shelf.scrollLeft > 4 || this.prefersReducedMotion()) return;
          try {
            shelf.scrollTo({ left: 54, behavior: "smooth" });
            setTimeout(() => {
              if (!touched && shelf.isConnected) shelf.scrollTo({ left: 0, behavior: "smooth" });
            }, 620);
          } catch {
            shelf.scrollLeft = 0;
          }
        }, 900);
      });
    }

    // The pet's room: the body shop (new species bought with stars), the
    // dress-up shelf, and the tap-to-recite thought bubble.
    renderPet() {
      const previous=this.root.querySelector('.lg-pet');
      const shelfPositions=previous?[...previous.querySelectorAll('.pet-shelf')].map(shelf=>shelf.scrollLeft):[];
      const roomTop=previous?.querySelector('.pet-room')?.scrollTop || 0;
      const focused=previous?.contains(document.activeElement)?document.activeElement:null;
      const focusKey=focused?.dataset.body?`[data-body="${focused.dataset.body}"]`:
        focused?.dataset.acc?`[data-acc="${focused.dataset.acc}"]`:
        focused?.dataset.petHue?`[data-pet-hue="${focused.dataset.petHue}"]`:null;
      const worn = this.pet.worn || [];
      const species = this.pet.species || "blob";
      const petHues = [200, 320, 95, 268, 28];
      const petHueNames = { 200: "Sky blue", 320: "Berry pink", 95: "Leaf green", 268: "Plum purple", 28: "Honey gold" };
      const ownedBodies = this.pet.bodies || (this.pet.bodies = ["blob"]);
      const bodyShelf = ns.LETTERS_BODIES.map((b) => {
        const owned = b.cost === 0 || ownedBodies.includes(b.id);
        return `<button type="button" class="pet-acc${owned ? " is-owned" : ""}${species === b.id ? " is-worn" : ""}" aria-label="${b.name || b.id}${owned?'':`, ${b.cost} stars`}" aria-pressed="${species === b.id}" data-body="${b.id}">
          <span class="pet-acc-art">${Art.pet({ hue: this.pet.hue, species: b.id, stage: 1, size: 54 })}</span>
          ${species===b.id?`<span class="pet-selected-mark" aria-hidden="true">${Art.icon('check',16)}</span>`:''}
          ${owned ? "" : `<span class="pet-acc-cost">${Art.icon("star", 12)} ${b.cost}</span>`}
        </button>`;
      }).join("");
      const shelf = ns.LETTERS_ACCESSORIES.map((acc) => {
        const owned = (this.pet.accessories || []).includes(acc.id);
        const wearing = worn.includes(acc.id);
        return `<button type="button" class="pet-acc${owned ? " is-owned" : ""}${wearing ? " is-worn" : ""}" data-acc="${acc.id}" aria-label="${acc.id}${owned?'':`, ${acc.cost} stars`}" aria-pressed="${wearing}">
          <span class="pet-acc-art">${Art.pet({ hue: this.pet.hue, species, stage: 1, worn: [acc.id], size: 62 })}</span>
          ${wearing?`<span class="pet-selected-mark" aria-hidden="true">${Art.icon('check',16)}</span>`:''}
          ${owned ? "" : `<span class="pet-acc-cost">${Art.icon("star", 12)} ${acc.cost}</span>`}
        </button>`;
      }).join("");
      // Wardrobe layout (locked 2026-07-18): the pet is pinned large in the
      // top half and never scrolls away; bodies + accessories live on
      // horizontally-swiping shelves below, so a try-on always shows
      // instantly on the big pet.
      const el = this.screen(
        "lg-pet",
        `${this.topBar()}
        <div class="pet-stage pet-room" style="--pet-radiance:${this.petRadiance().toFixed(2)}">
          <div class="pet-hero">
            <span class="lg-star-chip">${Art.icon("star", 20)} <b>${this.starBalance()}</b></span>
            <button type="button" aria-label="Play with your pet" class="pet-big${this.petRadiance() > 0.15 ? " is-radiant" : ""}">
              <span class="pet-aura" aria-hidden="true"></span>
              <span class="pet-bubble" hidden></span>
              ${this.petSVG(210)}
            </button>
            ${Object.keys(this.skills).length ? `<div class="pet-flower">${Art.skillFlower({ scores: this.skills, size: 92 })}</div>` : ""}
          </div>
          <div class="pet-racks">
            <div class="pet-color-rack lg-panel" aria-label="Pet color">
              <span class="pet-color-icon" aria-hidden="true">${Art.icon("flower",24)}</span>
              <div class="pet-color-options">${petHues.map((h) => `<button type="button" class="pet-color-swatch${this.pet.hue === h ? " is-picked" : ""}" data-pet-hue="${h}" aria-pressed="${this.pet.hue === h}" style="--h:${h}" aria-label="${petHueNames[h]}" title="${petHueNames[h]}"></button>`).join("")}</div>
            </div>
            <div class="pet-shelf pet-bodies lg-panel">${bodyShelf}</div>
            <div class="pet-shelf lg-panel">${shelf}</div>
          </div>
        </div>`,
      );
      this.wireTopBar(el);
      [...el.querySelectorAll('.pet-shelf')].forEach((shelf,i)=>{
        shelf.scrollLeft=shelfPositions[i] || 0;
        this.wireShelf(shelf,{demonstrate:!previous});
      });
      el.querySelector('.pet-room').scrollTop=roomTop;
      if(focusKey)el.querySelector(focusKey)?.focus({preventScroll:true});
      for (const swatch of el.querySelectorAll("[data-pet-hue]")) {
        swatch.addEventListener("click", () => {
          this.pet.hue = Number(swatch.dataset.petHue);
          this.saveJSON("quran-trainer:letters:pet", this.pet);
          this.sound.play("click");
          this.renderPet();
        });
      }
      const bubble = el.querySelector(".pet-bubble");
      el.querySelector(".pet-big").addEventListener("click", () => {
        bubble.hidden = false;
        this.petRecite(bubble);
        el.querySelector(".pet-big").classList.remove("is-hop");
        void el.querySelector(".pet-big").offsetWidth;
        el.querySelector(".pet-big").classList.add("is-hop");
      });
      for (const btn of el.querySelectorAll(".pet-acc[data-body]")) {
        btn.addEventListener("click", () => {
          const id = btn.dataset.body;
          const body = ns.LETTERS_BODIES.find((b) => b.id === id);
          const bodies = this.pet.bodies || (this.pet.bodies = ["blob"]);
          if (!bodies.includes(id)) {
            if (!this.spendStars(body.cost)) {
              this.sound.play("wrong");
              btn.classList.remove("is-shake");
              void btn.offsetWidth;
              btn.classList.add("is-shake");
              return;
            }
            bodies.push(id);
            this.sound.play("hatch");
            this.confettiAt(btn, true);
          }
          this.pet.species = id;
          this.saveJSON("quran-trainer:letters:pet", this.pet);
          this.sound.play("click");
          this.renderPet();
        });
      }
      for (const btn of el.querySelectorAll(".pet-acc[data-acc]")) {
        btn.addEventListener("click", () => {
          const id = btn.dataset.acc;
          const acc = ns.LETTERS_ACCESSORIES.find((a) => a.id === id);
          const ownedList = this.pet.accessories || (this.pet.accessories = []);
          if (!ownedList.includes(id)) {
            if (!this.spendStars(acc.cost)) {
              this.sound.play("wrong");
              btn.classList.remove("is-shake");
              void btn.offsetWidth;
              btn.classList.add("is-shake");
              return;
            }
            ownedList.push(id);
            this.sound.play("seed");
            this.confettiAt(btn);
          }
          const wornList = this.pet.worn || (this.pet.worn = []);
          const at = wornList.indexOf(id);
          if (at >= 0) wornList.splice(at, 1);
          else {
            if (wornList.length >= 3) wornList.shift();
            wornList.push(id);
          }
          this.saveJSON("quran-trainer:letters:pet", this.pet);
          this.sound.play("click");
          this.renderPet();
        });
      }
    }

    // ---------- sticker album ----------

    renderAlbum(justOpened = null) {
      const owned = new Set(this.stickers.owned || []);
      const grid = ns.LETTERS_STICKERS.map(
        (s) =>
          owned.has(s.id)
            ? `<button type="button" class="album-slot${justOpened === s.id ? " is-new" : ""}" data-sticker="${s.id}" aria-label="View ${s.id} sticker">${Art.sticker({id:s.id,size:78})}</button>`
            : `<span class="album-slot" role="img" aria-label="Sticker not collected">${Art.sticker({id:s.id,owned:false,size:78})}</span>`,
      ).join("");
      const allOwned = owned.size >= ns.LETTERS_STICKERS.length;
      const el = this.screen(
        "lg-album",
        `${this.topBar()}
        <div class="album-stage">
          <span class="lg-star-chip">${Art.icon("star", 20)} <b>${this.starBalance()}</b></span>
          ${allOwned
            ? `<div class="album-complete">${Art.icon("star", 40)}</div>`
            : `<button type="button" class="album-pack" aria-label="Open a sticker pack for 5 stars">${Art.stickerPack({ size: 104 })}<span class="pet-acc-cost">${Art.icon("star", 14)} 5</span></button>`}
          <div class="album-grid lg-panel">${grid}</div>
        </div>`,
      );
      this.wireTopBar(el);
      const inspect = button => {
        const id=button.dataset.sticker;
        const dialog=document.createElement('dialog');
        dialog.className='sticker-inspect';dialog.setAttribute('aria-label',`${id} sticker`);
        dialog.innerHTML=`<div class="sticker-inspect-art">${Art.sticker({id,size:280})}</div><button type="button" class="lg-round-btn sticker-inspect-close" aria-label="Back to stickers">${Art.icon('check',32)}</button>`;
        el.appendChild(dialog);
        dialog.querySelector('button').onclick=()=>dialog.close();
        dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
        dialog.addEventListener('close',()=>{dialog.remove();if(button.isConnected)button.focus();},{once:true});
        dialog.showModal();
      };
      el.querySelectorAll('[data-sticker]').forEach(button=>button.onclick=()=>inspect(button));
      if(justOpened){const button=el.querySelector(`[data-sticker="${justOpened}"]`);if(button)inspect(button);}
      const pack = el.querySelector(".album-pack");
      if (pack)
        pack.addEventListener("click", () => {
          const unowned = ns.LETTERS_STICKERS.filter((s) => !owned.has(s.id));
          if (!unowned.length) return;
          if (!this.spendStars(5)) {
            this.sound.play("wrong");
            pack.classList.remove("is-shake");
            void pack.offsetWidth;
            pack.classList.add("is-shake");
            return;
          }
          const win = unowned[Math.floor(Math.random() * unowned.length)];
          (this.stickers.owned = this.stickers.owned || []).push(win.id);
          this.saveJSON("quran-trainer:letters:stickers", this.stickers);
          this.sound.play("sticker");
          this.confettiAt(pack, true);
          this.renderAlbum(win.id);
        });
    }

    loadStamps() {
      try {
        const data = JSON.parse(localStorage.getItem(STAMPS_KEY) || "{}");
        return { dates: Array.isArray(data.dates) ? data.dates : [] };
      } catch {
        return { dates: [] };
      }
    }

    // Brain Age's calendar stamp: one per day the child plays. Returns true
    // only for the first stamp of the day (that's when the island pays out).
    stampToday() {
      const today = todayStr();
      if (this.stamps.dates.includes(today)) return false;
      this.stamps.dates.push(today);
      try {
        localStorage.setItem(STAMPS_KEY, JSON.stringify(this.stamps));
      } catch {}
      return true;
    }

    firstOpenIndex() {
      const done = new Set(this.progress.done);
      const idx = this.worlds.worlds.findIndex((w) => !done.has(w.id));
      return idx < 0 ? this.worlds.worlds.length : idx;
    }

    statusOf(world) {
      const idx = this.worlds.worlds.indexOf(world);
      if (this.progress.done.includes(world.id)) return "done";
      return idx === this.firstOpenIndex() ? "current" : "locked";
    }

    // ---------- audio ----------

    // iOS Safari only honours speechSynthesis.speak() from inside a user
    // gesture's synchronous window. Nearly every voicing in this game is
    // deliberately DELAYED — the bud pops for 320ms before the letter is
    // revealed, assembled pieces fuse over 960ms, replays wait 450ms — so on iOS
    // every one of those utterances was being dropped and letters were simply
    // silent, while the WebAudio chimes played normally.
    //
    // Speaking one throwaway utterance inside the first real touch unlocks the
    // queue for the rest of the page session, after which the timed calls are
    // honoured. This keeps the choreography the spec asks for instead of forcing
    // the voice to fire at tap time.
    unlockSpeech() {
      if (this._speechUnlocked || !("speechSynthesis" in window)) return;
      this._speechUnlocked = true;
      try {
        const u = new SpeechSynthesisUtterance(" ");
        u.volume = 0; // inaudible; this exists only to open the queue
        speechSynthesis.speak(u);
      } catch {}
    }

    say(item, onEnd) {
      if (!item) return;
      // Keep names/diacritics from the curriculum, including word displays.
      // audioPath is deliberately ignored: this game uses generated speech only.
      return this.speak(item.speak || item.display, onEnd);
    }

    stopSpeech() {
      this.speechTurn = (this.speechTurn || 0) + 1;
      this.utterance = null;
      try { window.speechSynthesis?.cancel(); } catch {}
    }

    speak(text, onEnd) {
      this.stopSpeech();
      if (!text || !this.sound.enabled || !("speechSynthesis" in window)) return;
      try {
        const turn = this.speechTurn;
        const u = new SpeechSynthesisUtterance(text);
        const voices = speechSynthesis.getVoices().filter((v) => /^ar(?:[-_]|$)/i.test(v.lang || ""));
        const quality = (v) =>
          (/premium|enhanced|natural|neural/i.test(v.name) ? 100 : 0) +
          (/^ar[-_]SA$/i.test(v.lang) ? 10 : 0) +
          (/majed|laila|mariam|tarik/i.test(v.name) ? 2 : 0);
        const pick = voices.sort((a, b) => quality(b) - quality(a))[0];
        if (pick) u.voice = pick;
        u.lang = pick?.lang || "ar-SA";
        // A quieter delivery with a little more space between sounds.
        // Keep native pitch so softening does not distort the letter names.
        u.rate = 0.8;
        u.pitch = 1;
        u.volume = 0.62;
        this.utterance = u; // retain it while the native speech engine plays
        u.onend = () => {
          if (turn !== this.speechTurn) return;
          this.utterance = null;
          if (onEnd) onEnd(turn);
        };
        u.onerror = () => {
          if (turn === this.speechTurn) this.utterance = null;
        };
        speechSynthesis.speak(u);
        return u;
      } catch {}
    }

    prefersReducedMotion() {
      return this.reduceMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    confettiAt(el, golden) {
      if (!el?.isConnected || this.prefersReducedMotion()) return;
      const rect = el.getBoundingClientRect();
      Art.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, golden);
    }

    // ---------- chrome ----------

    screen(className, inner) {
      this.stopSpeech();
      if (this.game && this.game.destroy) this.game.destroy();
      this.game = null;
      // Perf (iPad, 2026-07-18): while a mini-game runs, the ambient
      // butterfly/firefly layer is invisible behind the play panel anyway —
      // stop compositing it so game frames get the whole budget.
      document.body.classList.toggle("lg-in-game", className === "lg-play");
      document.body.classList.toggle("lg-reward-screen", className === "lg-stars" || className === "lg-party");
      const garden = this.session?.world.id === "pack-boat" && ["lg-meet", "lg-play", "lg-stars", "lg-party"].includes(className);
      const step = this.session?.gameIndex || 0;
      const activity = this.session?.plan?.[step]?.game || this.session?.world.games[step];
      const pond = ["lg-play", "lg-stars"].includes(className) && activity === "pop";
      this.root.classList.toggle("lg-pond-activity", pond);
      this.root.classList.toggle("lg-boat-chapter", garden);
      this.root.classList.toggle("lg-reduce-motion", !!this.reduceMotion);
      document.body.classList.toggle("lg-reduce-motion", !!this.reduceMotion);
      document.body.classList.toggle("lg-calm-garden", garden || pond);
      this.root.dataset.gardenPhase = Art.dayPhase();
      const stage = ns.LettersGardenArt.growth(this.progress, this.bests);
      this.root.innerHTML = `${garden || pond ? ns.LettersGardenArt.backdrop(stage) : Art.backdrop()}<div class="lg-screen ${className}">${inner}</div>`;
      return this.root.querySelector(".lg-screen");
    }

    topBar({ home = true } = {}) {
      return `
        <div class="lg-topbar">
          ${home ? `<button type="button" class="lg-round-btn lg-home" aria-label="Home">${Art.icon("home", 32)}</button>` : "<span></span>"}
          <div class="lg-topbar-right">
            <button type="button" class="lg-round-btn lg-sound" aria-label="Toggle sound">${Art.icon("speaker", 32)}</button>
            <button type="button" class="lg-grownup-dot" aria-label="For grown-ups (hold)" title="For grown-ups — hold"></button>
          </div>
        </div>`;
    }

    wireTopBar(el, onHome) {
      const home = el.querySelector(".lg-home");
      if (home)
        home.addEventListener("click", () => {
          this.sound.play("page");
          onHome ? onHome() : this.renderHome();
        });
      const soundBtn = el.querySelector(".lg-sound");
      const syncSound = () => { soundBtn.classList.toggle("is-off", !this.sound.enabled); soundBtn.setAttribute("aria-pressed", String(this.sound.enabled)); };
      soundBtn.addEventListener("click", () => {
        this.sound.toggle ? this.sound.toggle() : (this.sound.enabled = !this.sound.enabled);
        if (!this.sound.enabled) {
          this.stopSpeech();
        }
        syncSound();
      });
      syncSound();

      // The grown-up corner is gated behind a 3-second hold (spec: specs/02)
      // so a child never wanders in, but a parent opens it in one gesture.
      const dot = el.querySelector(".lg-grownup-dot");
      if (dot) {
        let timer = null;
        const start = () => {
          dot.classList.add("is-holding");
          timer = setTimeout(() => {
            dot.classList.remove("is-holding");
            this.sound.play("page");
            this.renderGrownup();
          }, 3000);
        };
        const cancel = () => {
          dot.classList.remove("is-holding");
          if (timer) clearTimeout(timer);
          timer = null;
        };
        dot.addEventListener("pointerdown", start);
        dot.addEventListener("pointerup", cancel);
        dot.addEventListener("pointerleave", cancel);
        dot.addEventListener("pointercancel", cancel);
      }
    }

    // ---------- the grown-up corner (parent-gated) ----------
    // One calm screen for a co-learning adult: how each letter is holding
    // (strong / growing / needs love), the streak of play-days, and three
    // letters worth asking the child to read aloud — the app's own "try this"
    // that turns a strength number into a 30-second family moment.
    renderGrownup() {
      const strength = ns.LettersStrength;
      const letters = ns.LETTERS_DATA.packs.flatMap((p) => p.letters);
      const bucket = (m, seen) => (!seen ? "new" : m >= 0.7 ? "strong" : m >= 0.35 ? "growing" : "love");
      const rows = letters.map((l) => {
        const e = strength && strength.map[l.char];
        const seen = !!(e && e.r + e.w > 0);
        const m = strength ? strength.mastery(l.char) : 0;
        return { l, m, seen, b: bucket(m, seen) };
      });
      const counts = { strong: 0, growing: 0, love: 0, new: 0 };
      rows.forEach((r) => (counts[r.b] += 1));
      // "Ask them to read these" — the shakiest SEEN letters, up to three.
      const askThese = rows
        .filter((r) => r.seen && r.b !== "strong")
        .sort((a, b) => a.m - b.m)
        .slice(0, 3);

      const days = (this.stamps.dates || []).length;

      const grid = rows
        .map(
          (r) => `<span class="gu-cell gu-${r.b}" title="${r.l.name}">
            <span class="gu-ar" dir="rtl" lang="ar">${r.l.char}</span></span>`,
        )
        .join("");

      const askHTML = askThese.length
        ? `<div class="gu-ask-cards">${askThese
            .map(
              (r) => `<div class="gu-ask-card"><span class="gu-ask-ar" dir="rtl" lang="ar">${r.l.char}</span><span class="gu-ask-name">${r.l.name}</span></div>`,
            )
            .join("")}</div>`
        : `<p class="gu-ask-none">Once they've played a little, three letters to practice together will appear here.</p>`;

      const el = this.screen(
        "lg-grownup",
        `${this.topBar({ home: true })}
        <div class="gu-scroll">
          <div class="gu-head lg-panel">
            <h2>For grown-ups</h2>
            <p>A quiet look at how the letters are settling in.</p>
            <div class="gu-stat-row">
              <button type="button" class="gu-stat gu-stamps-link"><b>${days}</b><span>day${days === 1 ? "" : "s"} played</span></button>
              <div class="gu-stat"><b>${counts.strong}</b><span>strong</span></div>
              <div class="gu-stat"><b>${counts.growing}</b><span>growing</span></div>
              <div class="gu-stat"><b>${counts.love}</b><span>needs love</span></div>
            </div>
          </div>
          <div class="gu-section lg-panel">
            <h3>Every letter, at a glance</h3>
            <div class="gu-legend">
              <span><i class="gu-dot gu-strong"></i>strong</span>
              <span><i class="gu-dot gu-growing"></i>growing</span>
              <span><i class="gu-dot gu-love"></i>needs love</span>
              <span><i class="gu-dot gu-new"></i>not yet met</span>
            </div>
            <div class="gu-grid">${grid}</div>
          </div>
          <div class="gu-section lg-panel">
            <h3>Try asking them to read these</h3>
            <p class="gu-sub">A gentle 30 seconds together — no app needed.</p>
            ${askHTML}
          </div>
          <div class="gu-section lg-panel">
            <h3>Sound and motion</h3>
            <button type="button" class="lg-big-btn gu-sound-toggle">${this.sound.enabled ? "Sound is on" : "Sound is off"}</button>
            <button type="button" class="lg-big-btn gu-motion-toggle" aria-pressed="${!!this.reduceMotion}">Reduce motion</button>
          </div>
        </div>`,
      );
      this.wireTopBar(el, null);
      el.querySelector(".gu-motion-toggle").addEventListener("click", () => {
        this.reduceMotion = !this.reduceMotion;
        this.saveJSON("quran-trainer:letters:reduced-motion", this.reduceMotion);
        this.renderGrownup();
      });
      const st = el.querySelector(".gu-sound-toggle");
      st.addEventListener("click", () => {
        this.sound.toggle ? this.sound.toggle() : (this.sound.enabled = !this.sound.enabled);
        st.textContent = this.sound.enabled ? "Sound is on" : "Sound is off";
      });
      // The stamp calendar lives here now, not in the child's toolbar (2026-07-25).
      // A date grid is a parent's artifact: a 4-6 year old has no stable model of
      // weeks, the cells are literal numerals in an otherwise wordless game, and a
      // visible streak is the classic route back to the guilt this project bans.
      // stampToday() and the daily ritual are untouched — only the audience moved.
      // For the child, the mastery garden already says "you keep coming back" in a
      // form they can read: things grow.
      const stampsLink = el.querySelector(".gu-stamps-link");
      if (stampsLink)
        stampsLink.addEventListener("click", () => {
          this.sound.play("page");
          this.renderStamps();
        });
    }

    // ---------- home: the journey map ----------

    // Tiny biome scenery decals stamped along the trail — same tactile SVG
    // language as the rest of the garden (plum ink, candy fills, no black).
    biomeDeco(biome) {
      // A miniature habitat at the existing decorative anchor. Silhouettes,
      // not extra size, distinguish the region from its neighboring stop.
      const D = {
        orchard: `<ellipse cx="32" cy="43" rx="24" ry="4" fill="#7ca66c" opacity=".4"/><path d="M30 42V25M34 32L42 24M30 33L21 25" fill="none" stroke="#90724d" stroke-width="5" stroke-linecap="round"/><path d="M15 28Q5 22 12 14Q10 5 22 6Q30-1 38 6Q50 3 51 15Q61 21 49 28Q39 33 32 28Q23 34 15 28Z" fill="#80a963" stroke="#587a4d" stroke-width="1.8"/><path d="M14 17Q15 9 23 11Q31 4 37 10Q44 7 47 14" fill="none" stroke="#b8cd84" stroke-width="3" stroke-linecap="round"/><g fill="#df8a6d" stroke="#a36c52" stroke-width="1.2"><circle cx="21" cy="21" r="4"/><circle cx="40" cy="24" r="4"/><circle cx="34" cy="13" r="3.6"/></g><path d="M20 16L22 18M39 19L42 20M33 8L35 10" stroke="#5d794b" stroke-width="1.5" stroke-linecap="round"/>`,
        lagoon: `<path d="M5 39Q10 31 29 33Q48 29 59 38Q61 44 34 45Q9 47 5 39Z" fill="#8ac9cb" stroke="#609e9a" stroke-width="1.5"/><path d="M19 40Q20 22 18 9M25 40Q31 21 31 14M15 40Q13 29 7 23" fill="none" stroke="#628954" stroke-width="2.2" stroke-linecap="round"/><path d="M19 34Q8 28 10 15Q19 24 19 34M25 37Q39 31 41 20Q29 27 25 37" fill="#8da965"/><path d="M17 8V17M31 12V21" stroke="#ad8b5c" stroke-width="5" stroke-linecap="round"/><path d="M35 40H49M10 41H17" stroke="#d8efdf" stroke-width="1.8" stroke-linecap="round"/><path d="M42 32Q52 26 56 33L49 35Z" fill="#759c66"/><path d="M48 30Q43 23 48 24Q51 19 53 25Q58 25 53 31Z" fill="#e5acb5" stroke="#ac8490" stroke-width="1"/>`,
        night: `<path d="M8 42Q16 32 30 36Q44 31 56 41Q47 47 32 45Q14 47 8 42Z" fill="#789888"/><path d="M38 5C21 1 17 21 28 27Q40 34 48 21C34 27 27 11 38 5Z" fill="#eddb9c" stroke="#ac9a69" stroke-width="1.5"/><path d="M18 40Q19 32 15 29M41 42Q43 35 48 32" fill="none" stroke="#526e62" stroke-width="2" stroke-linecap="round"/><path d="M17 36Q9 35 10 29Q17 29 17 36M44 37Q54 37 53 30Q46 30 44 37" fill="#b0c39a"/><g fill="#f6e8a5"><circle cx="13" cy="17" r="2"/><circle cx="50" cy="12" r="1.5"/><circle cx="28" cy="37" r="1.6"/></g><g stroke="#c3cfb0" stroke-width="1" fill="none"><path d="M10 13L8 11M16 13L18 11M48 8L46 6M52 8L54 6"/></g>`,
        peaks: `<path d="M4 43L21 12L39 43Z" fill="#a7b6b3" stroke="#7b9290" stroke-width="1.6" stroke-linejoin="round"/><path d="M21 12L25 43H39Z" fill="#8aa0a0"/><path d="M23 43L42 5L61 43Z" fill="#c4d0c7" stroke="#7b9290" stroke-width="1.6" stroke-linejoin="round"/><path d="M42 5L44 42H61Z" fill="#9db4b0"/><path d="M42 5L50 21L44 18L40 23L34 21Z" fill="#fff8e4" stroke="#a4b8ad" stroke-width="1"/><path d="M14 26L21 12L28 25L22 22L19 27Z" fill="#e6eddf"/><path d="M3 43Q17 37 30 42Q44 35 61 43L58 46H7Z" fill="#87a575"/>`,
        river: `<path d="M28 4Q15 12 32 20Q53 31 36 44H56Q66 29 45 20Q26 11 41 4Z" fill="#d7c9a5"/><path d="M31 4Q20 12 36 20Q56 31 40 44H52Q63 30 41 20Q23 11 38 4Z" fill="#8ec9cb"/><path d="M30 10Q28 14 37 18M44 25Q53 31 48 35" fill="none" stroke="#d8efdf" stroke-width="2" stroke-linecap="round"/><path d="M5 40Q7 31 17 34Q23 29 28 39Q17 46 5 40Z" fill="#a5b2a0" stroke="#7e9182" stroke-width="1.4"/><path d="M9 37Q13 34 17 36" fill="none" stroke="#e0e5ca" stroke-width="2" stroke-linecap="round"/><path d="M18 32Q20 20 15 16M21 34Q24 24 29 22" fill="none" stroke="#769a67" stroke-width="2" stroke-linecap="round"/><ellipse cx="29" cy="43" rx="5" ry="2.8" fill="#c0baa1"/>`,
      };
      return biome === "meadow" ? ns.LettersGardenArt.flowerBed({size:76}) : D[biome] ? `<svg viewBox="0 0 64 48" aria-hidden="true">${D[biome]}</svg>` : "";
    }

    // The mastery garden (spec: specs/02): every chapter grows a plant beside
    // its stop that reflects how well the child holds it — seeded when first
    // met, sprouting and budding as strength climbs, in full bloom at mastery.
    // The strength model made beautiful; walking the map = seeing what you know.
    worldMasteryOf(world) {
      try {
        const items = world.items ? world.items() : [];
        return ns.LettersStrength ? ns.LettersStrength.worldMastery(items) : 0;
      } catch {
        return 0;
      }
    }
    masteryPlant(m) {
      const ink = "#3a2c48";
      const stem = `<path d="M24 46 C24 40 23 34 24 26" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>`;
      const leaves = `<path d="M24 38 C16 36 13 30 12 25 C19 25 24 30 24 36 Z" fill="#5cc23e" stroke="${ink}" stroke-width="1.4"/>
        <path d="M24 34 C32 32 35 27 36 22 C29 22 24 27 24 32 Z" fill="#6fce4e" stroke="${ink}" stroke-width="1.4"/>`;
      if (m < 0.15) {
        // seed: a little mound with a green tip
        return `<svg viewBox="0 0 48 50"><ellipse cx="24" cy="45" rx="9" ry="4" fill="#b07a4a"/><path d="M24 44 C23 40 23 39 24 37" stroke="#5cc23e" stroke-width="3" stroke-linecap="round" fill="none"/></svg>`;
      }
      if (m < 0.42) {
        // sprout: short stem + one leaf
        return `<svg viewBox="0 0 48 50"><ellipse cx="24" cy="46" rx="8" ry="3.5" fill="#b07a4a" opacity="0.6"/><path d="M24 46 C24 40 23 36 24 32" stroke="#4e9677" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M24 40 C17 38 14 33 13 29 C20 29 24 33 24 38 Z" fill="#5cc23e" stroke="${ink}" stroke-width="1.4"/></svg>`;
      }
      if (m < 0.72) {
        // bud: full stem, leaves, closed bud
        return `<svg viewBox="0 0 48 50">${stem}${leaves}<ellipse cx="24" cy="22" rx="6" ry="8" fill="#ff8fb1" stroke="${ink}" stroke-width="1.6"/><path d="M24 14 C22 18 22 20 24 22 C26 20 26 18 24 14 Z" fill="#ffa9c4"/></svg>`;
      }
      // bloom: open flower
      const petals = [0, 72, 144, 216, 288]
        .map((a) => `<ellipse cx="24" cy="12" rx="5.5" ry="8" fill="#ff8fb1" stroke="${ink}" stroke-width="1.4" transform="rotate(${a} 24 20)"/>`)
        .join("");
      return `<svg viewBox="0 0 48 50">${stem}${leaves}<g>${petals}<circle cx="24" cy="20" r="5" fill="#ffc22e" stroke="${ink}" stroke-width="1.4"/></g></svg>`;
    }

    renderHome() {
      this.applyPhase();
      this.root.style.setProperty("--lg-hue", "150");
      const worlds = this.worlds.worlds;
      const allDone = this.firstOpenIndex() >= worlds.length;
      const daily = this.worlds.dailySession(this.progress.done);
      const stampedToday = this.stamps.dates.includes(todayStr());
      // A winding trail read bottom-to-top: world 1 sits at the bottom of
      // the scroll, one bend per world, and when everything is done a door
      // to the island crowns the path. Finished stops grow flower gardens.
      const GAP = window.innerWidth < 600 ? 150 : 200;
      const total = worlds.length;
      const height = total * GAP + 240;
      const yOf = (i) => height - 150 - i * GAP;
      const xOf = (i) => (i % 2 === 0 ? 28 : 72); // percent of the path width
      const el = this.screen(
        "lg-home",
        `${this.topBar({ home: false })}
        <div class="map-daily-row lg-tray" aria-label="Garden activities">
          ${daily ? `<button type="button" aria-label="Daily letter practice" class="map-daily${stampedToday ? " is-stamped" : ""}">${Art.icon("sun", 34)}${stampedToday ? `<i class="map-daily-check">${Art.icon("check", 16)}</i>` : ""}</button>` : ""}
          ${daily ? `<button type="button" class="map-checkup" aria-label="Letter check-up">${Art.icon("flower", 34)}</button>` : ""}
          <button type="button" class="map-pet" aria-label="Your pet and wardrobe">${this.petSVG(46)}</button>
          <button type="button" class="map-album" aria-label="Rewards and stickers">${Art.icon("star", 26)}<b>${this.starBalance()}</b></button>
        </div>
        <button type="button" class="map-practice-garden" aria-label="Open the practice garden" title="Available after your first Boat activity" ${this.progress.done.includes('pack-boat') || Object.keys(this.bests).some(k=>k.startsWith('pack-boat:')) ? '' : 'disabled'}>${Art.icon('flower',30)}${Art.icon('next',22)}</button>
        <div class="map-scroll">
          <div class="map-path" style="height:${height}px">
            ${(() => {
              // Soft biome bands behind the trail: one wash of color per
              // chapter of the ladder, feathered so the day-phase sky still
              // owns the mood. Computed from each biome's world range.
              const bands = [];
              let s = 0;
              for (let i = 1; i <= worlds.length; i += 1) {
                if (i === worlds.length || worlds[i].biome !== worlds[s].biome) {
                  const top = yOf(i - 1) - GAP * 0.62;
                  const bottom = yOf(s) + GAP * 0.62;
                  bands.push(`<i class="map-band biome-${worlds[s].biome}" style="top:${Math.max(top, 0)}px;height:${bottom - Math.max(top, 0)}px"></i>`);
                  s = i;
                }
              }
              return bands.join("");
            })()}
            <svg class="map-trail" aria-hidden="true"></svg>

            ${worlds
              .map((world, i) => {
                const status = this.statusOf(world);
                const at = `left:${xOf(i)}%; top:${yOf(i)}px`;
                // A mastery plant grows beside every met world, its stage set
                // by how well the child holds that chapter's letters.
                const plant = status !== "locked"
                  ? `<span class="map-plant" style="left:${xOf(i) + (i % 2 === 0 ? -30 : 30)}%; top:${yOf(i) + 40}px">${this.masteryPlant(this.worldMasteryOf(world))}</span>`
                  : "";
                return `
                  ${plant}
                  ${world.id === "pack-boat" ? `<span class="map-boat-landmark" style="left:${xOf(i) + 37}%;top:${yOf(i) - 10}px">${ns.LettersGardenArt.boat({stage: ns.LettersGardenArt.growth(this.progress, this.bests)})}</span>` : ""}
                  <span class="map-deco" style="left:${xOf(i) + (i % 2 === 0 ? 34 : -34)}%; top:${yOf(i) + 46}px">${world.id === "pack-boat" ? "" : this.biomeDeco(world.biome)}</span>
                  <div class="map-node" data-node-world="${world.id}" style="${at}"><button type="button" class="map-stop is-${status}" data-world="${world.id}" ${status === "current" ? 'aria-current="step"' : ""} aria-label="${world.id === 'pack-boat' ? 'Boat Letters' : world.icon}" ${status === "locked" ? "disabled" : ""}>
                    ${Art.mapStop({ hue: world.hue, label: world.icon, status, stars: this.stars[world.id] || 0, latin: !/[؀-ۿ]/.test(world.icon) })}
                  </button>${status === "done" ? `<span class="map-flower-bed" aria-hidden="true">${ns.LettersGardenArt.flowerBed({size:88})}</span>` : ""}</div>
                  ${status === "current" ? `<span class="map-here" style="left:${xOf(i) + (i % 2 === 0 ? 17 : -17)}%; top:${yOf(i)}px">${this.petSVG(64)}</span>` : ""}
                  ${status === "current" && !this.progress.done.length ? `<span class="map-tap" style="left:${xOf(i)}%; top:${yOf(i) - 96}px; bottom:auto; margin:0;">${Art.icon("arrow", 44)}</span>` : ""}`;
              })
              .join("")}
          </div>
        </div>`,
      );
      // The child-facing map has no external exit. Home elsewhere returns here.
      this.wireTopBar(el);
      el.querySelector(".map-practice-garden").onclick=()=>this.renderPracticeGarden();
      // The dotted trail needs real pixel coordinates, so it's drawn after
      // layout against the path's actual width.
      const pathEl = el.querySelector(".map-path");
      const trail = el.querySelector(".map-trail");
      const w = pathEl.clientWidth || 430;
      trail.setAttribute("viewBox", `0 0 ${w} ${height}`);
      const pts = [];
      for (let i = 0; i < total; i += 1) pts.push([(w * xOf(i)) / 100, yOf(i)]);
      let d = pts.length ? `M ${pts[0][0]} ${pts[0][1]}` : "";
      for (let i = 1; i < pts.length; i += 1) {
        const a = pts[i - 1];
        const b = pts[i];
        d += ` C ${a[0]} ${a[1] - GAP * 0.45}, ${b[0]} ${b[1] + GAP * 0.45}, ${b[0]} ${b[1]}`;
      }
      trail.innerHTML = `
        <path d="${d}" fill="none" stroke="#caa96f" stroke-width="17" stroke-linecap="round" opacity="0.8"/>
        <path d="${d}" fill="none" stroke="#fffaf0" stroke-width="13" stroke-linecap="round"/>
        <path d="${d}" fill="none" stroke="#7fc6a4" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 22"/>`;
      for (const btn of el.querySelectorAll(".map-stop[data-world]")) {
        btn.addEventListener("click", () => {
          const world = worlds.find((w) => w.id === btn.dataset.world);
          if (!world || this.statusOf(world) === "locked") return;
          this.sound.play("click");
          this.startWorld(world);
        });
      }
      const dailyBtn = el.querySelector(".map-daily");
      if (dailyBtn)
        dailyBtn.addEventListener("click", () => {
          this.sound.play("click");
          this.startDaily();
        });
      const checkupBtn = el.querySelector(".map-checkup");
      if (checkupBtn)
        checkupBtn.addEventListener("click", () => {
          this.sound.play("click");
          this.startCheckup();
        });
      el.querySelector(".map-pet").addEventListener("click", () => {
        this.sound.play("page");
        this.renderPet();
      });
      el.querySelector(".map-album").addEventListener("click", () => {
        this.sound.play("page");
        this.renderAlbum();
      });
      // Start the journey at the child's current stop.
      const current = el.querySelector(".map-stop.is-current") || el.querySelector(".map-stop.is-door");
      if (current) current.scrollIntoView({ block: "center" });
    }

    // ---------- the stamp calendar (Brain Age's daily ritual, wordless) ----------

    renderStamps() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = now.getDate();
      const stamped = new Set(
        this.stamps.dates
          .filter((d) => d.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`))
          .map((d) => Number(d.slice(8))),
      );
      let cells = "";
      for (let day = 1; day <= daysInMonth; day += 1) {
        const cls =
          "stamp-cell" +
          (stamped.has(day) ? " is-stamped" : "") +
          (day === today ? " is-today" : "") +
          (day > today ? " is-future" : "");
        cells += `<span class="${cls}">${stamped.has(day) ? Art.icon("star", 26) : `<i>${day}</i>`}</span>`;
      }
      const el = this.screen(
        "lg-stamps",
        `${this.topBar()}
        <div class="stamps-stage">
          <div class="stamps-moon">${Art.icon("sun", 44)}</div>
          <div class="stamps-grid lg-panel">${cells}</div>
        </div>`,
      );
      this.wireTopBar(el);
    }

    // ---------- the check-up (one round per skill → the flower) ----------

    startCheckup() {
      const plan = this.worlds.checkupPlan(this.progress.done);
      if (!plan) return;
      this.root.style.setProperty("--lg-hue", "45");
      this.session = {
        world: { id: "checkup", hue: 45, games: plan.map((p) => p.game) },
        plan,
        gameIndex: 0,
        starTotal: 0,
        items: [],
        extraItems: [],
        checkup: true,
      };
      this.startGame();
    }

    // ---------- daily review session ----------

    startDaily() {
      const world = this.worlds.dailySession(this.progress.done);
      if (!world) return;
      this.session = {
        world,
        meetIndex: 0,
        gameIndex: 0,
        starTotal: 0,
        items: world.items(),
        // The non-bouquet pool rides along as distractors so weak-letter
        // rounds still face a full field of options.
        extraItems: world.extraItems ? world.extraItems() : [],
        daily: true,
      };
      this.startGame();
    }

    // ---------- world flow: meet → games → party ----------

    startWorld(world) {
      // A soft flourish when stepping into a new biome/land (spec: melody
      // moments), so travel between chapters is felt, not just seen.
      if (world.biome && world.biome !== this._lastBiome) {
        this._lastBiome = world.biome;
        this.sound.play("biomeArrival");
      }
      this.root.style.setProperty("--lg-hue", String(world.hue));
      this.session = {
        world,
        meetIndex: 0,
        gameIndex: 0,
        starTotal: 0,
        items: world.items(),
        extraItems: world.extraItems ? world.extraItems() : [],
      };
      if (world.meet.length) this.renderMeet();
      else this.startGame();
    }

    // Make-it-happen intros (locked 2026-07-18): the child CAUSES every
    // reveal instead of watching a card. Three variants:
    //   replay  — finished worlds get one quick tap-to-hear card, then games;
    //   assemble — cards with parts (syllables, joins, muqattaat) arrive as
    //             pieces the child taps together; the fused card is the reveal;
    //   wake    — everything else sleeps inside a sparkle bud until tapped.
    renderMeet() {
      const s = this.session;
      const card = s.world.meet[s.meetIndex];
      const latin = !/[؀-ۿ]/.test(card.display);
      const isReplay = this.progress.done.includes(s.world.id);
      const parts =
        !isReplay && Array.isArray(card.parts) && card.parts.length >= 2 ? card.parts : null;
      const bigCard = Art.blobCard({ hue: s.world.hue, label: card.display, latin });
      const hidden = isReplay ? "" : "hidden";
      const opener = isReplay
        ? ""
        : parts
          ? `<div class="meet-make" dir="rtl">
              ${parts
                .map(
                  (p, i) => `<button type="button" class="meet-piece" data-i="${i}" style="--pi:${i}">
                    ${Art.blobCard({ hue: s.world.hue, label: p.display, latin: false })}</button>`,
                )
                .join("")}
            </div>`
          : `<button type="button" class="meet-bud" aria-label="wake"><span>✨</span></button>`;
      const el = this.screen(
        "lg-meet",
        `${this.topBar()}
        <div class="meet-stage lg-panel">
          ${opener}
          <button type="button" class="meet-card" aria-label="Listen to ${card.display}" ${hidden}>${bigCard}</button>
          <div class="meet-dots">${s.world.meet.map((_, i) => `<i class="${i === s.meetIndex ? "is-on" : ""}"></i>`).join("")}</div>
          <div class="meet-nav">
            <button type="button" class="lg-round-btn meet-hear" aria-label="Hear the letter again" ${hidden}>${Art.icon("speaker", 36)}</button>
            <button type="button" class="lg-big-btn meet-next" aria-label="Continue" ${hidden}>${Art.icon("next", 40)}</button>
          </div>
        </div>`,
      );
      this.wireTopBar(el);
      const cardEl = el.querySelector(".meet-card");
      const speakCard = () => { if (el.isConnected) this.say(card); };
      // Say-it-with-me (spec: specs/02): the game says it, then the card
      // opens its arms and waits — an inviting pause for the child to say it
      // back out loud. No mic; the pause IS the feature, and a soft chime
      // rewards the turn-taking whether or not they spoke.
      const sayWithMe = () => {
        if (!cardEl.isConnected) return;
        cardEl.classList.remove("is-your-turn");
        this.say(card, (turn) => {
          if (!cardEl.isConnected || turn !== this.speechTurn) return;
          cardEl.classList.add("is-your-turn");
          this.sound.play("click");
          setTimeout(() => {
            if (!cardEl.isConnected) return;
            cardEl.classList.remove("is-your-turn");
            // A replay, another prompt, mute or navigation cancels this echo.
            if (turn === this.speechTurn) speakCard();
          }, 1600);
        });
      };
      // The reveal moment all three variants funnel into.
      const reveal = () => {
        if (!el.isConnected) return;
        cardEl.hidden = false;
        cardEl.classList.add("is-born");
        el.querySelector(".meet-hear").hidden = false;
        el.querySelector(".meet-next").hidden = false;
        sayWithMe();
      };
      cardEl.addEventListener("pointerdown", speakCard);
      // Fingers on every new letter (2026-07-25). The owner's read was right —
      // finger involvement is the strongest engagement lever here — but leading a
      // world with the graded trace would put PRODUCTION first, which is the
      // hardest of the five skills and the likeliest place to manufacture the
      // failure the "no failable moments" rule exists to prevent.
      //
      // So the finger goes in the meet screen instead of the grade: drag across
      // the card and the letter warms up, sparkles (the global spark layer gives
      // that for free) and speaks again. Always succeeds, earns nothing, and
      // crucially does NOT gate Next — a toll booth on the intro is on the
      // declined list. It primes motor memory before the scored trace later in
      // the world.
      {
        let down = false;
        let dist = 0;
        let px = 0;
        let py = 0;
        let lit = false;
        cardEl.addEventListener("pointerdown", (e) => {
          down = true;
          px = e.clientX;
          py = e.clientY;
        });
        cardEl.addEventListener("pointermove", (e) => {
          if (!down || lit) return;
          dist += Math.hypot(e.clientX - px, e.clientY - py);
          px = e.clientX;
          py = e.clientY;
          const t = Math.min(1, dist / 210);
          cardEl.style.setProperty("--traced", t.toFixed(3));
          if (t >= 1) {
            lit = true;
            cardEl.classList.add("is-traced");
            this.sound.play("seed");
            this.confettiAt(cardEl);
            speakCard();
          }
        });
        const release = () => (down = false); // progress is kept, never reset
        cardEl.addEventListener("pointerup", release);
        cardEl.addEventListener("pointercancel", release);
      }
      el.querySelector(".meet-hear").addEventListener("click", speakCard);
      el.querySelector(".meet-next").addEventListener("click", () => {
        this.sound.play("page");
        // Replays shorten to a single card — respect that replay is play,
        // not re-teaching.
        if (isReplay) return this.startGame();
        s.meetIndex += 1;
        if (s.meetIndex >= s.world.meet.length) this.startGame();
        else this.renderMeet();
      });

      if (isReplay) {
        setTimeout(sayWithMe, 450);
        return;
      }
      if (parts) {
        // Assemble: each tapped piece speaks and lights up; when every piece
        // is lit they rush together and the whole is born.
        const make = el.querySelector(".meet-make");
        let setCount = 0;
        for (const piece of make.querySelectorAll(".meet-piece")) {
          piece.addEventListener("pointerdown", () => {
            if (piece.classList.contains("is-set")) {
              const p = parts[Number(piece.dataset.i)];
              this.say({ display: p.display, speak: p.speak || p.display });
              return;
            }
            piece.classList.add("is-set");
            const p = parts[Number(piece.dataset.i)];
            this.say({ display: p.display, speak: p.speak || p.display });
            this.sound.play("click");
            setCount += 1;
            if (setCount >= parts.length) {
              setTimeout(() => {
                make.classList.add("is-fusing");
                this.sound.play("hatch");
                setTimeout(() => {
                  make.hidden = true;
                  reveal();
                }, 460);
              }, 500);
            }
          });
        }
        // A soft voice hint so the child knows there's something to hear.
        setTimeout(() => { if (el.isConnected) speakCard(); }, 500);
      } else {
        const bud = el.querySelector(".meet-bud");
        bud.addEventListener("pointerdown", () => {
          bud.classList.add("is-popped");
          this.sound.play("seed");
          setTimeout(() => {
            bud.hidden = true;
            reveal();
          }, 320);
        });
      }
    }

    startGame() {
      const s = this.session;
      const planStep = s.plan ? s.plan[s.gameIndex] : null;
      const gameName = planStep ? planStep.game : s.world.games[s.gameIndex];
      const el = this.screen(
        "lg-play",
        `${this.topBar()}
        <div class="play-prompt lg-panel">
          <button type="button" class="play-pet" aria-label="Listen to your pet">${this.petSVG(64)}</button>
          <span class="play-mascot">${Art.keyMascot({ size: 66 })}</span>
          <button type="button" class="play-bubble" aria-label="Hear the letter again" hidden>
            <span class="play-bubble-glyph" dir="rtl" lang="ar"></span>
            <span class="play-bubble-icon">${Art.icon("speaker", 22)}</span>
          </button>
          <span class="play-dots">${s.world.games.map((_, i) => `<i class="${i < s.gameIndex ? "is-done" : i === s.gameIndex ? "is-on" : ""}"></i>`).join("")}</span>
        </div>
        <div class="play-stage"></div>`,
      );
      el.dataset.activity = gameName;
      this.wireTopBar(el);
      const stage = el.querySelector(".play-stage");
      const bubble = el.querySelector(".play-bubble");
      const glyph = el.querySelector(".play-bubble-glyph");
      let currentTarget = null;
      bubble.addEventListener("pointerdown", () => sayWithPose(currentTarget));

      const petEl = el.querySelector(".play-pet");
      let poseTimer = null;
      let poseLockedUntil = 0;
      // The presenter is the child's own blob pet (squirrel reverted
      // 2026-07-18). Poses map to blob moods: listening/success open the
      // mouth in delight, everything else is the usual happy face.
      // The pet had two usable faces; it now has seven (ART.md §6). Map the poses
      // the game already produces onto them. Note "wrong" resolves to CURIOUS,
      // never sad — an error makes the pet lean in, not droop.
      const petMood = (pose) =>
        ({
          success: "delighted",
          listening: "listening",
          presenting: "neutral",
          wrong: "curious",
          thinking: "thinking",
          proud: "proud",
          sleepy: "sleepy",
          idle: "neutral",
        })[pose] || "neutral";
      const setPetPose = (pose, hold = 0, lock = false) => {
        if (!petEl?.isConnected) return;
        petEl.innerHTML = this.petSVG(64, petMood(pose));
        if (poseTimer) clearTimeout(poseTimer);
        poseLockedUntil = lock ? Date.now() + hold : 0;
        if (hold > 0) {
          poseTimer = setTimeout(() => {
            if (!petEl.isConnected) return;
            poseLockedUntil = 0;
            petEl.innerHTML = this.petSVG(64, petMood(currentTarget ? "presenting" : "idle"));
          }, hold);
        }
      };
      const sayWithPose = (item) => {
        if (Date.now() >= poseLockedUntil) setPetPose("listening", 900);
        this.say(item);
      };
      petEl.addEventListener("click", () => {
        setPetPose("success", 900);
        this.petRecite(null);
      });
      // The quiet strength model listens from here: every game announces its
      // target via setPrompt and its verdicts via sfx("correct"/"wrong"), so
      // one wiretap covers all of them (Pairs passes a null prompt and is
      // deliberately untracked — matching pairs isn't a recall verdict).
      let promptAt = 0;
      const strength = ns.LettersStrength;
      const ctx = {
        stage,
        garden: s.world.id === "pack-boat",
        petArt: () => this.petSVG(180,"listening"),
        reducedMotion: () => this.prefersReducedMotion(),
        items: planStep ? planStep.items : s.items,
        extraItems: s.extraItems,
        rounds: 4,
        hue: s.world.hue,
        level: s.world.id === "pack-boat" ? (this.bests[`${s.world.id}:${gameName}`] || 0) : (this.stars[s.world.id] || 0),
        beginner: s.world.id === "pack-boat" && !(this.bests[`${s.world.id}:${gameName}`] > 0),
        say: (item) => sayWithPose(item),
        // The pet watches the child play: it hops on every right answer and
        // leans in, curious, on a wrong pick — never scolding, never sad.
        sfx: (name) => {
          // Melody moments: correct answers climb a pentatonic run (streak
          // builds a tune); a miss resets it and plays the gentle nudge.
          if (name === "correct") {
            this._streak = (this._streak || 0) + 1;
            this.sound.streakMelody(this._streak);
          } else if (name === "wrong") {
            this._streak = 0;
            this.sound.play(name);
          } else {
            this.sound.play(name);
          }
          if (strength && currentTarget && (name === "correct" || name === "wrong")) {
            strength.record(
              currentTarget.id,
              name === "correct",
              promptAt ? performance.now() - promptAt : NaN,
            );
            if (name === "wrong") promptAt = performance.now(); // re-time the retry
          }
          if (name === "correct" && petEl) {
            setPetPose("success", 1300, true);
            petEl.classList.remove("is-hop", "is-sad");
            void petEl.offsetWidth;
            petEl.classList.add("is-hop");
          }
          if (name === "wrong" && petEl) {
            // Warm, never sad (locked 2026-07-16): the pet just leans in,
            // curious — errors are information, not emotion.
            setPetPose("listening", 1500);
            petEl.classList.remove("is-sad", "is-hop");
          }
        },
        confettiAt: (target) => this.confettiAt(target),
        setPrompt: (item) => {
          currentTarget = item;
          promptAt = item ? performance.now() : 0;
          bubble.hidden = !item;
          if (item) {
            // promptDisplay lets the question differ from the answer tile —
            // the check-up's visualize round shows the isolated letter while
            // the bubbles wear its in-word forms.
            const shown = item.promptDisplay || item.display;
            const latinPrompt = !/[؀-ۿ]/.test(shown);
            glyph.textContent = shown;
            glyph.classList.toggle("is-latin", latinPrompt);
            // Optically centre the ink inside the bubble (same measured-ink
            // correction the SVG tiles use — Amiri's em box is way off).
            const shift = Art.inkShift(shown, latinPrompt ? 22 : 38, latinPrompt);
            glyph.style.transform = `translate(${shift.dx.toFixed(1)}px, ${shift.htmlDy.toFixed(1)}px)`;
            setPetPose("presenting");
          } else {
            setPetPose("idle");
          }
        },
        // "Look here, listen again" — the prompt bubble pulses after a wrong
        // pick so the child's eye returns to the question.
        pulsePrompt: () => {
          bubble.classList.remove("is-pulse");
          void bubble.offsetWidth;
          bubble.classList.add("is-pulse");
        },
        onDone: (slips) => { if (el.isConnected) this.finishGame(slips); },
      };
      this.game = new ns.LettersMiniGames[gameName](ctx);
    }

    finishGame(slips) {
      const s = this.session;
      const stars = slips === 0 ? 3 : slips <= 2 ? 2 : 1;
      s.starTotal += stars;
      s.lastStars = stars;
      // Stars are the spending currency for stickers and pet gear. Pay for
      // PROGRESS, not repetition (2026-07-25): the wallet used to be credited on
      // every finish while replay only rolled back session bookkeeping, so
      // replaying one easy game farmed unlimited currency and the 24-sticker
      // album completed in a couple of sittings.
      //
      // Now a game pays only the amount by which it beats its own previous best,
      // so a first 3-star run pays 3, a replay pays 0, and going 1 -> 3 pays 2.
      // Deliberately NOT a cap or a cooldown: replaying stays free and still gets
      // the full celebration, which keeps the locked "no artificial scarcity"
      // rule intact — you simply don't get paid twice for the same work.
      const bestKey = `${s.world.id}:${s.plan ? "plan" + s.gameIndex : s.world.games[s.gameIndex]}`;
      const prevBest = this.bests[bestKey] || 0;
      if (stars > prevBest) {
        this.earnStars(stars - prevBest);
        this.bests[bestKey] = stars;
        this.saveJSON("quran-trainer:letters:bests", this.bests);
      }
      // Check-up rounds grade a skill: the LATEST score is the petal size —
      // it's a health check, not a high-score board.
      if (s.plan && s.plan[s.gameIndex] && s.plan[s.gameIndex].skill) {
        this.skills[s.plan[s.gameIndex].skill] = { score: stars, at: todayStr() };
        this.saveJSON("quran-trainer:letters:skills", this.skills);
      }
      this.renderStars(stars);
    }

    renderPracticeGarden() {
      const world=this.worlds.worlds.find(w=>w.id==='pack-boat');
      this.session={world,items:world.items()};
      const choices=['Feed','DotGarden','GardenPaths'];
      if(this.workshopWorlds().length)choices.push('Workshop');
      const el=this.screen('lg-meet',`${this.topBar()}<div class="practice-garden-hub"><div class="practice-garden-choices">${choices.map((kind,i)=>`<button type="button" data-kind="${kind}" aria-label="${['Feed a friend','Dot Garden: place the dots','Garden Paths: draw letters','Word Workshop: build familiar sounds'][i]}">${ns.LettersGardenArt.practicePicture(kind)}<span class="practice-play" aria-hidden="true">${Art.icon('next',24)}</span></button>`).join('')}</div></div>`);
      this.wireTopBar(el);
      el.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>b.dataset.kind==='Workshop'?this.renderWorkshop():this.startPractice(b.dataset.kind,()=>this.renderPracticeGarden()));
    }

    // Offer only chapters whose Build mechanic is already familiar. Keep each
    // chapter's own item pool together so unlike sound rules are not mixed.
    workshopWorlds() {
      return this.worlds.worlds.filter(world=>world.games.includes('build') &&
        ((this.progress.done || []).includes(world.id) || this.bests[`${world.id}:build`] > 0))
        .map(world=>({world,items:world.items().filter(item=>item.parts?.length>=2)}))
        .filter(entry=>entry.items.length);
    }

    renderWorkshop() {
      const entries=this.workshopWorlds();
      if(!entries.length)return this.renderPracticeGarden();
      const el=this.screen('lg-meet',`${this.topBar()}<div class="workshop-picker">
        <div class="workshop-sign" aria-hidden="true">${ns.LettersGardenArt.practicePicture('Workshop')}</div>
        <div class="workshop-chapters">${entries.map(({world},i)=>`<button type="button" data-workshop="${i}" aria-label="Practice building ${/[؀-ۿ]/.test(world.icon)?world.icon:'familiar words'}">
          <svg viewBox="0 0 140 110" aria-hidden="true"><rect x="8" y="10" width="124" height="86" rx="20" fill="#e0c79b" stroke="#947a52" stroke-width="3"/><rect x="15" y="16" width="110" height="70" rx="15" fill="#fff8e7"/>${/[؀-ۿ]/.test(world.icon)?`<text x="70" y="50" text-anchor="middle" font-family="Amiri Quran, serif" font-size="40" fill="#4a3620" data-fit-box="70,50,84,46,42">${world.icon}</text>`:`<g transform="translate(43 24)">${Art.icon('book',54)}</g>`}</svg>
          <span class="practice-play" aria-hidden="true">${Art.icon('next',24)}</span></button>`).join('')}</div></div>`);
      this.wireTopBar(el,()=>this.renderPracticeGarden());
      el.querySelectorAll('[data-workshop]').forEach(button=>button.onclick=()=>{
        const {world,items}=entries[Number(button.dataset.workshop)];
        this.session={world,items,gameIndex:world.games.indexOf('build')};
        this.startPractice('Workshop',()=>this.renderWorkshop());
      });
    }

    practiceButtons() {
      return `<div class="garden-practice-links" aria-label="Optional practice">${['DotGarden','GardenPaths'].map(kind=>`<button type="button" data-practice="${kind}" aria-label="Optional ${kind==='DotGarden'?'Dot Garden':'Garden Paths drawing'} practice">${ns.LettersGardenArt.practicePicture(kind)}</button>`).join('')}</div>`;
    }
    wirePractice(el,back) {
      el.querySelectorAll('[data-practice]').forEach(b=>b.onclick=()=>this.startPractice(b.dataset.practice,back));
    }
    startPractice(kind,back) {
      const s=this.session;
      const el=this.screen('lg-play',`${this.topBar()}<div class="practice-heading">${this.petSVG(76)}<button class="practice-replay" type="button" aria-label="Hear the letter again"></button></div><div class="practice-stage"></div>`);
      el.dataset.activity=kind==='Feed'?'feed':kind==='Workshop'?'build':'practice';
      if(kind==='Feed'||kind==='Workshop')el.querySelector('.practice-stage').classList.add('play-stage');
      this.wireTopBar(el,back);
      const replay=el.querySelector('.practice-replay');let current=null;
      replay.onclick=()=>{if(current)this.say(current);};
      const ctx={stage:el.querySelector('.practice-stage'),items:s.items||s.world.items(),
        prompt:item=>{current=item;
          if(kind==='Workshop' && item)replay.innerHTML=`<svg viewBox="0 0 120 80" aria-hidden="true"><text x="60" y="40" text-anchor="middle" font-family="Amiri Quran, serif" font-size="42" fill="#4a3620" data-fit-box="60,40,94,52,42">${item.display}</text></svg>`;
          else replay.textContent=item?item.display:'♫';
        },
        say:item=>{if(kind!=='Workshop')current=item;this.say(item);},correct:()=>this.sound.play('correct'),
        done:()=>{if(el.isConnected)back();}};
      if(kind==='Feed')this.game=new ns.LettersMiniGames.feed({...ctx,garden:true,beginner:true,level:0,rounds:4,hue:150,extraItems:[],petArt:()=>this.petSVG(180),setPrompt:ctx.prompt,sfx:name=>this.sound.play(name),confettiAt:target=>this.confettiAt(target),onDone:ctx.done});
      else if(kind==='Workshop')this.game=new ns.LettersMiniGames.build({...ctx,setPrompt:ctx.prompt,sfx:name=>this.sound.play(name),confettiAt:target=>this.confettiAt(target),onDone:ctx.done});
      else this.game=new ns.GardenPractice[kind](ctx);
    }

    gardenReward(finished=false) {
      const world=this.session?.world;
      const stage=ns.LettersGardenArt.chapterGrowth(this.progress,this.bests,world);
      const scene=world?.id==='pack-boat'?ns.LettersGardenArt.boat({stage}):
        ns.LettersGardenArt.habitatReward({biome:world?.biome || 'meadow',stage,habitat:this.biomeDeco(world?.biome)});
      return `<div class="garden-reward${finished?' garden-reward-finished':''}" role="img" aria-label="Garden flowers: ${stage}">${scene}</div>`;
    }

    renderStars(stars) {
      const s = this.session;
      const lastGame = s.gameIndex >= s.world.games.length - 1;
      const el = this.screen(
        "lg-stars",
        `${this.topBar()}
        <div class="stars-stage lg-panel">
          ${this.gardenReward()}
          <div class="stars-row">
            ${[0, 1, 2].map((i) => `<span class="stars-star ${i < stars ? "is-on" : ""}" style="animation-delay:${i * 220}ms">${Art.icon("star", 74)}</span>`).join("")}
          </div>
          ${s.world.id === "pack-boat" ? this.practiceButtons() : ""}
          <div class="stars-nav">
            <button type="button" class="lg-round-btn stars-replay" aria-label="Play again">${Art.icon("replay", 34)}</button>
            <button type="button" class="lg-big-btn stars-next" aria-label="Continue">${Art.icon(lastGame ? "check" : "next", 40)}</button>
          </div>
        </div>`,
      );
      this.wireTopBar(el);
      this.wirePractice(el,()=>this.renderStars(stars));
      const row = el.querySelector(".stars-row");
      // Climb the star ladder: one bright, rising bell per star as it drops
      // in (synced to the stagger), then the payoff chord once the last one
      // is home — a bigger fanfare the more stars you earned.
      for (let i = 0; i < stars; i += 1) {
        setTimeout(() => { if (el.isConnected) this.sound.play(`star${i + 1}`); }, i * 220 + 150);
      }
      setTimeout(() => {
        if (!el.isConnected) return;
        this.sound.play(stars === 3 ? "fanfare" : stars === 2 ? "cheer2" : "cheer1");
        this.confettiAt(row, stars === 3);
        if (stars === 3) setTimeout(() => { if (el.isConnected) this.confettiAt(row, true); }, 280);
      }, stars * 220 + 200);
      el.querySelector(".stars-replay").addEventListener("click", () => {
        this.sound.play("click");
        s.starTotal -= s.lastStars;
        this.startGame();
      });
      el.querySelector(".stars-next").addEventListener("click", () => {
        this.sound.play("click");
        s.gameIndex += 1;
        if (s.gameIndex >= s.world.games.length) this.finishWorld();
        else this.startGame();
      });
    }

    finishWorld() {
      const s = this.session;
      const worldStars = Math.max(1, Math.round(s.starTotal / s.world.games.length));
      if (s.checkup) {
        // Check-up done: the flower has its new petals. Show it off.
        this.stampToday();
        this.renderParty(worldStars, false, { flower: true });
        return;
      }
      if (s.daily) {
        // Daily review: the day's stamp (and one island payout per day).
        const firstToday = this.stampToday();
        if (firstToday && this.island) this.island.completeStudyStep();
        this.renderParty(worldStars, firstToday);
        return;
      }
      this.stars[s.world.id] = Math.max(this.stars[s.world.id] || 0, worldStars);
      this.saveStars();
      this.stampToday();
      const newlyDone = !this.progress.done.includes(s.world.id);
      if (newlyDone) {
        this.progress.done.push(s.world.id);
        this.saveProgress();
        if (this.island) this.island.completeStudyStep();
      }
      this.renderParty(worldStars, newlyDone);
    }

    renderParty(stars, newlyDone, { flower = false } = {}) {
      // The Quran-word capstone (spec: specs/02 summit): finishing a
      // word-decoding world isn't just another world — it's the child
      // reading real words from the Quran. Mark the moment.
      const isQuranWords = this.session && this.session.world && this.session.world.kind === "words";
      const capstone = isQuranWords && newlyDone
        ? `<div class="party-capstone">✨ ${Art.icon("book", 26)}  ✨</div>`
        : "";
      const el = this.screen(
        "lg-party",
        `<div class="party-stage lg-panel">
          ${capstone}
          ${this.gardenReward(true)}
          ${flower ? `<div class="party-flower">${Art.skillFlower({ scores: this.skills, size: 200 })}</div>` : ""}
          <div class="party-pair">
            <div class="party-mascot">${Art.keyMascot({ size: flower ? 110 : 150, mood: "open" })}</div>
            <button type="button" class="party-pet" aria-label="Celebrate with your pet">
              <span class="pet-bubble" hidden></span>
              ${this.petSVG(flower ? 95 : 130, "open")}
            </button>
          </div>
          <div class="party-stars">
            ${[0, 1, 2].map((i) => `<span class="stars-star ${i < stars ? "is-on" : ""}" style="animation-delay:${i * 240}ms">${Art.icon("star", 64)}</span>`).join("")}
          </div>
          ${this.session?.world.id === "pack-boat" ? this.practiceButtons() : ""}
          <button type="button" class="lg-big-btn party-next" aria-label="Return to the garden">${Art.icon("next", 44)}</button>
        </div>`,
      );
      this.sound.play(newlyDone ? "worldClear" : "perfect");
      this.confettiAt(el.querySelector(".party-mascot"), true);
      setTimeout(() => { if (el.isConnected) this.confettiAt(el.querySelector(".party-stars"), true); }, 500);
      if (newlyDone) setTimeout(() => { if (el.isConnected) this.confettiAt(el.querySelector(".party-mascot"), true); }, 900);
      this.wirePractice(el,()=>this.renderParty(stars,false,{flower}));
      const partyPet = el.querySelector(".party-pet");
      partyPet.addEventListener("pointerdown", () => {
        this.petRecite(partyPet.querySelector(".pet-bubble"));
        partyPet.querySelector(".pet-bubble").hidden = false;
      });
      el.querySelector(".party-next").addEventListener("click", () => {
        this.sound.play("page");
        this.renderHome();
      });
    }
  }

  ns.LettersGame = LettersGame;
})(window.MiftahGame || (window.MiftahGame = {}));
