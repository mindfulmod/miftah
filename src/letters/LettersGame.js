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

  // Shared, wordless activity signs for the first two chapter journeys.
  const journeyPictures = {
    pop: '<ellipse cx="24" cy="29" rx="19" ry="10" fill="#a9e2dc"/><path d="M9 30Q24 24 39 30" fill="none"/><circle cx="24" cy="17" r="8" fill="#fffaf0"/><path d="M20 14L24 12" stroke="#fff"/>',
    trace: '<path d="M9 32L13 22 31 5 42 16 23 34Z" fill="#83a56c"/><path d="M9 32L13 22 23 34Z" fill="#eed4a5"/><path d="M9 32L14 28 16 33Z" fill="#4a3620"/><path d="M9 41H36" fill="none"/>',
    pairs: '<rect x="5" y="8" width="23" height="29" rx="6" fill="#dce8c3"/><rect x="20" y="15" width="23" height="29" rx="6" fill="#fffaf0"/><path d="M25 32Q25 23 36 24Q36 34 25 32" fill="#83a56c"/>',
    feed: '<path d="M8 23H40L36 40H12Z" fill="#e0bc7d"/><path d="M14 24V18A10 10 0 0 1 34 18V24M10 31H38M20 25V38M29 25V38" fill="none"/><path d="M21 17Q10 6 15 5Q26 5 25 17Q26 7 36 9Q37 18 25 19" fill="#83a56c"/>'
  };
  const journeyPicture = name => `<svg viewBox="0 0 48 48" aria-hidden="true"><g stroke="#655239" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${journeyPictures[name] || journeyPictures.pop}</g></svg>`;

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
      this.sound = new ns.LettersSound(new ns.SoundSystem());
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
      // Source-mapped AI names and curriculum clips play locally; uncovered
      // requests keep device speech. No voice-generation service runs in game.
      this.speechTurn = 0;
      this.voice = ns.LettersVoice ? new ns.LettersVoice({
        clips: ns.LETTER_VOICE_CLIPS || {}, getContext: () => this.sound.base?.ctx,
      }) : null;
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
      this.gardenLayout = this.loadJSON("quran-trainer:letters:garden-layout", {version:1,slots:[null,null,null,null]});
      this.applyPhase();
      this.initSparkles();
      this.initAmbient();
      this.initTouchFeedback();
      this.showLoading();
      const initialRevision = this.screenRevision || 0;
      const fontReady = Promise.resolve().then(() => document.fonts?.load?.('64px "Amiri Quran"'));
      const inkReady = fontReady.then(() => Art.warmInk(this.worlds.letters.map(l=>l.char))).then(()=>Art.fitGlyphs?.(this.root));
      // Late font completion still refreshes fitting; it never replaces the current screen.
      this.ready = Promise.all([
        ns.LettersBoot.settle(inkReady,1800),
        ns.LettersBoot.settle(this.worlds.loadWords(),5500)
      ]).then(() => {
        if ((this.screenRevision || 0)!==initialRevision)return;
        this.pet ? this.renderHome() : this.renderHatch();
      });
    }

    showLoading() {
      this.root.classList.toggle('lg-reduce-motion',!!this.reduceMotion);
      this.root.innerHTML=`${Art.backdrop()}<div class="lg-screen lg-loading" role="status" aria-label="Preparing your garden"><div class="loading-flower">${Art.icon('flower',80)}</div><div class="loading-seeds" aria-hidden="true"><i></i><i></i><i></i></div></div>`;
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

    loadProgress() { return this.loadJSON(PROGRESS_KEY,{done:[],skipped:false}); }
    saveProgress() { return this.saveJSON(PROGRESS_KEY,this.progress); }
    loadStars() { return this.loadJSON(STARS_KEY,{}); }
    saveStars() { return this.saveJSON(STARS_KEY,this.stars); }
    loadJSON(key,fallback) {
      if(ns.LettersState)return ns.LettersState.read(key,fallback);
      try {return JSON.parse(localStorage.getItem(key)||'null') ?? fallback;}catch{return fallback;}
    }
    saveJSON(key,value) {
      const saved=ns.LettersState ? ns.LettersState.write(key,value) : (()=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}})();
      if(!saved)this.saveFailed=true;
      return saved;
    }

    // ---------- the Letter Pet ----------

    starBalance() {
      return Math.max(0, (this.wallet.earned || 0) - (this.wallet.spent || 0));
    }

    earnStars(n) {
      if(!Number.isSafeInteger(n)||n<=0)return false;
      this.wallet.earned = (this.wallet.earned || 0) + n;
      this.saveJSON("quran-trainer:letters:wallet", this.wallet);
    }

    spendStars(n) {
      if(!Number.isSafeInteger(n)||n<=0)return false;
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
        <div class="hatch-stage"><div class="hatch-hero"><div class="hatch-nest" aria-hidden="true">${ns.LettersRoomArt.nest()}</div>
          ${hatched
            ? `<button class="hatch-pet" type="button" aria-label="Listen to your new pet">${this.petSVG(220, "open")}</button></div>
               <div class="hatch-hues">${hues.map((h) => `<button type="button" class="hatch-hue${(this.pet?.hue ?? 200) === h ? " is-picked" : ""}" data-hue="${h}" aria-label="${({200:'Blue',320:'Pink',95:'Green',268:'Purple',28:'Orange'})[h]} pet" aria-pressed="${(this.pet?.hue ?? 200) === h}" style="--h:${h}"></button>`).join("")}</div>
               <button type="button" class="lg-big-btn hatch-go" aria-label="Enter the garden">${Art.icon("check", 40)}</button>`
            : `<button type="button" class="hatch-egg" aria-label="Tap the egg to hatch your pet">${Art.egg({ size: 190, cracks })}</button></div>`}
        </div>`,
      );
      // No external exit is exposed during hatching.
      this.wireTopBar(el);
      if (!hatched) {
        const eggBtn = el.querySelector(".hatch-egg");
        let n = cracks;
        eggBtn.addEventListener("click", () => {
          if(!el.isConnected || n>=3)return;
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
      el.querySelector(".hatch-pet").addEventListener("click", () => this.petRecite(null));
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
      const tab=['friends','outfits','colors'].includes(this.wardrobeTab)?this.wardrobeTab:'outfits';
      const previous=this.root.querySelector('.lg-pet');
      this.wardrobeScroll ||= {};
      if(previous?.dataset.wardrobeTab)this.wardrobeScroll[previous.dataset.wardrobeTab]=previous.querySelector('.pet-shelf')?.scrollLeft||0;
      const shelfPositions=[this.wardrobeScroll[tab]||0];
      const roomTop=previous?.querySelector('.pet-room')?.scrollTop || 0;
      const focused=previous?.contains(document.activeElement)?document.activeElement:null;
      const focusKey=focused?.dataset.body?`[data-body="${focused.dataset.body}"]`:
        focused?.dataset.acc?`[data-acc="${focused.dataset.acc}"]`:
        focused?.dataset.petHue?`[data-pet-hue="${focused.dataset.petHue}"]`:
        focused?.dataset.wardrobeTab?`[data-wardrobe-tab="${focused.dataset.wardrobeTab}"]`:null;
      const worn = this.pet.worn || [];
      const species = this.pet.species || "blob";
      const petHues = [200, 320, 95, 268, 28];
      const petHueNames = { 200: "Sky blue", 320: "Berry pink", 95: "Leaf green", 268: "Plum purple", 28: "Honey gold" };
      const ownedBodies = this.pet.bodies || (this.pet.bodies = ["blob"]);
      const bodyShelf = tab==='friends' ? ns.LETTERS_BODIES.map((b) => {
        const owned = b.cost === 0 || ownedBodies.includes(b.id);
        return `<button type="button" class="pet-acc${owned ? " is-owned" : ""}${species === b.id ? " is-worn" : ""}" aria-label="${b.name || b.id}${owned?'':`, ${b.cost} stars`}" aria-pressed="${species === b.id}" data-body="${b.id}">
          <span class="pet-acc-art lg-art-frame">${Art.pet({ hue: this.pet.hue, species: b.id, stage: 1, size: 54 })}</span>
          ${species===b.id?`<span class="pet-selected-mark" aria-hidden="true">${Art.icon('check',16)}</span>`:''}
          ${owned ? "" : `<span class="pet-acc-cost">${Art.icon("star", 12)} ${b.cost}</span>`}
        </button>`;
      }).join("") : "";
      const shelf = tab==='outfits' ? ns.LETTERS_ACCESSORIES.map((acc) => {
        const owned = (this.pet.accessories || []).includes(acc.id);
        const wearing = worn.includes(acc.id);
        return `<button type="button" class="pet-acc${owned ? " is-owned" : ""}${wearing ? " is-worn" : ""}" data-acc="${acc.id}" aria-label="${acc.id}${owned?'':`, ${acc.cost} stars`}" aria-pressed="${wearing}">
          <span class="pet-acc-art lg-art-frame">${Art.pet({ hue: this.pet.hue, species, stage: 1, worn: [acc.id], size: 62 })}</span>
          ${wearing?`<span class="pet-selected-mark" aria-hidden="true">${Art.icon('check',16)}</span>`:''}
          ${owned ? "" : `<span class="pet-acc-cost">${Art.icon("star", 12)} ${acc.cost}</span>`}
        </button>`;
      }).join("") : "";
      // Keep the pet visible while one picture-selected shelf is browsed.
      // Render only that shelf; preserve its scroll and focus after a try-on.
      const el = this.screen(
        "lg-pet",
        `${this.topBar()}
        <div class="pet-stage pet-room" style="--pet-radiance:${this.petRadiance().toFixed(2)}">
          <div class="pet-hero">
            <div class="pet-diorama"><div class="pet-alcove" aria-hidden="true">${ns.LettersRoomArt.alcove()}</div>
            <span class="lg-star-chip">${Art.icon("star", 20)} <b>${this.starBalance()}</b></span>
            <button type="button" aria-label="Play with your pet" class="pet-big${this.petRadiance() > 0.15 ? " is-radiant" : ""}">
              <span class="pet-aura" aria-hidden="true"></span>
              <span class="pet-bubble" hidden></span>
              ${this.petSVG(210)}
            </button></div>
            ${Object.keys(this.skills).length ? `<div class="pet-flower">${Art.skillFlower({ scores: this.skills, size: 92 })}</div>` : ""}
          </div>
          <div class="pet-racks">
            <div class="wardrobe-tabs" role="tablist" aria-label="Wardrobe choices">
              ${['friends','outfits','colors'].map(kind=>`<button type="button" role="tab" id="wardrobe-tab-${kind}" data-wardrobe-tab="${kind}" aria-controls="wardrobe-panel" aria-selected="${tab===kind}" tabindex="${tab===kind?0:-1}" aria-label="Pet ${kind}">${ns.LettersRoomArt.tab(kind)}</button>`).join('')}
            </div>
            <div class="wardrobe-panel" id="wardrobe-panel" role="tabpanel" aria-labelledby="wardrobe-tab-${tab}">
              ${tab==='colors' ? `<div class="pet-color-rack lg-panel" aria-label="Pet color"><div class="pet-color-options">${petHues.map(h=>`<button type="button" class="pet-color-swatch${this.pet.hue===h?' is-picked':''}" data-pet-hue="${h}" aria-pressed="${this.pet.hue===h}" style="--h:${h}" aria-label="${petHueNames[h]}"></button>`).join('')}</div></div>` : `<button type="button" class="wardrobe-prev" aria-label="Previous ${tab}">${Art.icon('next',22)}</button><div class="pet-shelf ${tab==='friends'?'pet-bodies':''} lg-panel">${tab==='friends'?bodyShelf:shelf}</div><button type="button" class="wardrobe-more" aria-label="More ${tab}">${Art.icon('next',22)}</button>`}
            </div>
          </div>
        </div>`,
      );
      el.dataset.wardrobeTab=tab;
      this.wireTopBar(el);
      const tabs=[...el.querySelectorAll('[data-wardrobe-tab]')];
      tabs.forEach((button,index)=>{
        button.onclick=()=>{if(!el.isConnected)return;this.wardrobeTab=button.dataset.wardrobeTab;this.renderPet();};
        button.onkeydown=e=>{const next=e.key==='ArrowRight'?(index+1)%3:e.key==='ArrowLeft'?(index+2)%3:e.key==='Home'?0:e.key==='End'?2:null;if(next===null)return;e.preventDefault();this.wardrobeTab=tabs[next].dataset.wardrobeTab;this.renderPet();this.root.querySelector('[role="tab"][aria-selected="true"]')?.focus();};
      });
      const activeShelf=el.querySelector('.pet-shelf');
      if(activeShelf){
        const prev=el.querySelector('.wardrobe-prev'),more=el.querySelector('.wardrobe-more');
        const sync=()=>{prev.disabled=activeShelf.scrollLeft<2;more.disabled=activeShelf.scrollLeft+activeShelf.clientWidth>=activeShelf.scrollWidth-2;};
        prev.onclick=()=>activeShelf.scrollBy({left:-180,behavior:this.prefersReducedMotion()?'auto':'smooth'});
        more.onclick=()=>activeShelf.scrollBy({left:180,behavior:this.prefersReducedMotion()?'auto':'smooth'});
        activeShelf.addEventListener('scroll',sync,{passive:true});requestAnimationFrame(()=>{if(el.isConnected)sync();});
        if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(sync);observer.observe(activeShelf);this.stopWardrobeResize=()=>observer.disconnect();}
      }
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
      const allOwned = ns.LETTERS_STICKERS.every(sticker=>owned.has(sticker.id));
      const el = this.screen(
        "lg-album",
        `${this.topBar()}
        <div class="album-stage">
          <div class="album-supply">
          <span class="lg-star-chip">${Art.icon("star", 20)} <b>${this.starBalance()}</b></span>
          ${allOwned
            ? `<div class="album-complete" role="img" aria-label="All stickers collected">${Art.icon("star", 40)}</div>`
            : `<button type="button" class="album-pack" aria-label="Open a sticker pack for 5 stars" ${this.starBalance()<5?'disabled':''}>${ns.LettersRoomArt.pack(112)}<span class="pet-acc-cost">${Art.icon("star", 14)} 5</span></button>`}
          </div><div class="album-grid lg-panel">${grid}</div>
        </div>`,
      );
      this.wireTopBar(el);
      const inspect = button => {
        if(!el.isConnected||el.querySelector("dialog"))return;
        const id=button.dataset.sticker;
        const dialog=document.createElement('dialog');
        dialog.className='sticker-inspect';dialog.setAttribute('aria-label',`${id} sticker`);
        dialog.innerHTML=`<div class="sticker-inspect-art lg-art-frame">${Art.sticker({id,size:280})}</div><button type="button" class="lg-round-btn sticker-inspect-close" aria-label="Back to stickers">${Art.icon('check',32)}</button>`;
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
          if(!el.isConnected||pack.disabled)return;
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

    loadStamps() { return this.loadJSON(STAMPS_KEY,{dates:[]}); }

    // Brain Age's calendar stamp: one per day the child plays. Returns true
    // only for the first stamp of the day (that's when the island pays out).
    stampToday() {
      const today = todayStr();
      if (this.stamps.dates.includes(today)) return false;
      this.stamps.dates.push(today);
      this.saveJSON(STAMPS_KEY,this.stamps);
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
      // The local bank matches the exact teaching request, including diacritics.
      // Remote word audioPath is separate from these owner-supplied voice clips.
      return this.speak(item.speak || item.display, onEnd);
    }

    canSpeak(item) {
      if (!this.sound.enabled) return false;
      return 'speechSynthesis' in window || !!(item
        ? this.voice?.has(item.speak || item.display)
        : this.voice?.available);
    }

    stopSpeech() {
      this._learningSpeechCancel?.();
      this._learningSpeechCancel = null;
      this.sound.setSpeaking?.(false);
      this.speechTurn = (this.speechTurn || 0) + 1;
      this.utterance = null;
      this.nativeUtterance = null;
      this.voice?.cancel();
      try { window.speechSynthesis?.cancel(); } catch {}
    }

    speak(text, onEnd) {
      this.stopSpeech();
      if (!text || !this.sound.enabled) return;
      const turn = this.speechTurn;
      let settled = false;
      const job = {
        onstart: () => { if (!settled && turn === this.speechTurn) this.sound.setSpeaking?.(true); },
        onend: () => {
          if (settled || turn !== this.speechTurn) return;
          settled = true;
          this.utterance = this.nativeUtterance = null;
          this.sound.setSpeaking?.(false);
          onEnd?.(turn);
        },
        onerror: () => {
          if (settled || turn !== this.speechTurn) return;
          settled = true;
          this.utterance = this.nativeUtterance = null;
          this.sound.setSpeaking?.(false);
        },
      };
      this.utterance = job;
      this.sound.setSpeaking?.(true);
      const fallback = () => turn === this.speechTurn && this.sound.enabled && this.startNativeSpeech(text, job);
      if (this.voice?.play(text, job, fallback) || fallback()) return job;
      job.onerror();
    }

    startNativeSpeech(text, job) {
      if (!("speechSynthesis" in window)) return false;
      try {
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
        this.nativeUtterance = u; // retain the native engine's active utterance
        u.onstart = event => job.onstart?.(event);
        u.onend = event => job.onend?.(event);
        u.onerror = event => job.onerror?.(event);
        speechSynthesis.speak(u);
        return true;
      } catch { return false; }
    }

    // A learning prompt is usable only after its utterance actually completes.
    // Keep say()'s existing public API for introductions and pet recitation.
    sayForLearning(item) {
      const utterance = this.say(item);
      if (!utterance || typeof utterance !== 'object') return Promise.resolve(false);
      return new Promise(resolve => {
        let settled = false;
        const finish = heard => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          if (this._learningSpeechCancel === cancel) this._learningSpeechCancel = null;
          resolve(heard);
        };
        const cancel = () => finish(false);
        const end = utterance.onend, error = utterance.onerror;
        const timer = setTimeout(cancel, 6500);
        this._learningSpeechCancel = cancel;
        utterance.onend = event => { end?.(event); finish(true); };
        utterance.onerror = event => { error?.(event); finish(false); };
      });
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
      this.stopJourneyPose?.();
      this.stopJourneyPose = null;
      this.onLearningSoundChange = null;
      this.stopWardrobeResize?.();this.stopWardrobeResize=null;
      this.screenRevision=(this.screenRevision||0)+1;
      this.stopMapResize?.();
      this.stopMapResize=null;
      this.cancelMeetPointer?.();
      this.cancelMeetPointer=null;
      this.cancelAdultHold?.();
      this.cancelAdultHold = null;
      this.stopSpeech();
      this.unmountActivityArt?.();
      this.unmountActivityArt=null;
      if (this.game && this.game.destroy) this.game.destroy();
      this.game = null;
      // Perf (iPad, 2026-07-18): while a mini-game runs, the ambient
      // butterfly/firefly layer is invisible behind the play panel anyway —
      // stop compositing it so game frames get the whole budget.
      document.body.classList.toggle("lg-in-game", className === "lg-play");
      document.body.classList.toggle("lg-reward-screen", className === "lg-stars" || className === "lg-party");
      document.body.classList.toggle("lg-wardrobe-screen", className === "lg-pet");
      const garden = (this.isReferenceJourney() || this.isGentleDaily()) && ["lg-meet", "lg-play", "lg-stars", "lg-party"].includes(className);
      const step = this.session?.gameIndex || 0;
      const activity = this.session?.plan?.[step]?.game || this.session?.world.games[step];
      const pond = ["lg-play", "lg-stars"].includes(className) && activity === "pop";
      this.root.classList.toggle("lg-pond-activity", pond);
      this.root.classList.toggle("lg-boat-chapter", garden);
      this.root.classList.toggle("lg-reference-journey", garden);
      this.root.classList.toggle("lg-boat-adventure", this.isBoatAdventure() && garden);
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

    toggleSound() {
      this.sound.toggle ? this.sound.toggle() : (this.sound.enabled = !this.sound.enabled);
      if (!this.sound.enabled) this.stopSpeech();
      this.onLearningSoundChange?.();
      this.game?.onSoundChange?.();
      this.root.querySelectorAll(".lg-sound").forEach(button => {
        button.classList.toggle("is-off", !this.sound.enabled);
        button.setAttribute("aria-pressed", String(this.sound.enabled));
      });
      this.root.querySelectorAll(".gu-sound-toggle").forEach(button => {
        button.textContent = this.sound.enabled ? "Sound is on" : "Sound is off";
        button.setAttribute("aria-pressed", String(this.sound.enabled));
      });
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
        this.toggleSound();
      });
      syncSound();

      // The grown-up corner is gated behind a 3-second hold (spec: specs/02)
      // so a child never wanders in, but a parent opens it in one gesture.
      const dot = el.querySelector(".lg-grownup-dot");
      if (dot) {
        let timer = null;
        let held = null;
        let generation = 0;
        const cancel = () => {
          generation++;
          dot.classList.remove("is-holding");
          if (timer !== null) clearTimeout(timer);
          timer = null;
          held = null;
        };
        const start = source => {
          if (held !== null || !el.isConnected) return;
          held = source;
          const turn = ++generation;
          dot.classList.add("is-holding");
          timer = setTimeout(() => {
            if (turn !== generation) return;
            cancel();
            if (!el.isConnected) return;
            this.sound.play("page");
            this.renderGrownup();
          }, 3000);
        };
        dot.addEventListener("pointerdown", e => {if(e.button===0)start(e.pointerId);});
        dot.addEventListener("pointerup", e => {if(held===e.pointerId)cancel();});
        dot.addEventListener("pointerleave", cancel);
        dot.addEventListener("pointercancel", cancel);
        dot.addEventListener("blur", cancel);
        dot.addEventListener("keydown", e => {
          if(e.key!=="Enter" && e.key!==" ")return;
          e.preventDefault();
          if(!e.repeat)start(e.key);
        });
        dot.addEventListener("keyup", e => {if(held===e.key)cancel();});
        this.cancelAdultHold = cancel;
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
            ${this.saveFailed ? '<p class="gu-save-notice" role="status">This browser could not save the latest changes. Keep this page open and check that browser storage is available.</p>' : ''}
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
      st.setAttribute("aria-pressed", String(this.sound.enabled));
      st.addEventListener("click", () => this.toggleSound());
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
      const GAP = window.innerWidth < 600 ? 170 : 250;
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
        <div class="map-play-places" aria-label="Places to play">
          <button type="button" class="map-practice-garden" aria-label="Open the practice garden" title="Available after your first Boat activity" ${this.progress.done.includes('pack-boat') || Object.keys(this.bests).some(k=>k.startsWith('pack-boat:')) ? '' : 'disabled'}>${ns.LettersGardenArt.practicePicture('DotGarden')}${Art.icon('next',20)}</button>
          <button type="button" class="map-decorate" aria-label="Decorate your garden">${ns.DecoratingGarden.icon(44)}${Art.icon('next',20)}</button>
        </div>
        <div class="map-scroll">
          <div class="map-path" style="height:${height}px">
            <div class="map-landscape" aria-hidden="true"></div>
            <svg class="map-trail" aria-hidden="true"></svg>

            ${worlds
              .map((world, i) => {
                const status = this.statusOf(world);
                const at = `left:${xOf(i)}%; top:${yOf(i)}px`;
                // A mastery plant grows beside every met world, its stage set
                // by how well the child holds that chapter's letters.
                const plant = status !== "locked"
                  ? `<span class="map-plant" style="left:${xOf(i) + (i % 2 === 0 ? -18 : 18)}%; top:${yOf(i) + 40}px">${this.masteryPlant(this.worldMasteryOf(world))}</span>`
                  : "";
                return `
                  ${plant}
                  ${world.id === "pack-boat" ? `<span class="map-boat-landmark" style="left:${xOf(i) + 37}%;top:${yOf(i) - 10}px">${ns.LettersGardenArt.boat({stage: ns.LettersGardenArt.growth(this.progress, this.bests)})}${ns.LettersJourney?.memento(this.progress) || ''}</span>` : ""}
                  ${world.id === "pack-boat" ? "" : `<span class="map-landmark" aria-hidden="true" style="left:${i%2===0?74:26}%; top:${yOf(i)+35}px">${ns.LettersMapArt.landmark(world.biome,i)}</span>`}
                  <div class="map-node" data-node-world="${world.id}" style="${at}"><button type="button" class="map-stop is-${status}" data-world="${world.id}" ${status === "current" ? 'aria-current="step"' : ""} aria-label="${world.id === 'pack-boat' ? 'Boat Letters' : world.icon}${status==='done' ? `, completed, ${this.stars[world.id]||0} of 3 stars` : status==='current' ? ', next chapter' : ', locked'}" ${status === "locked" ? "disabled" : ""}>
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
      el.querySelector(".map-decorate").onclick=()=>this.renderDecoratingGarden();
      // The dotted trail needs real pixel coordinates, so it's drawn after
      // layout against the path's actual width.
      const pathEl = el.querySelector(".map-path");
      const trail = el.querySelector(".map-trail");
      const terrain = el.querySelector(".map-landscape");
      const scroll = el.querySelector(".map-scroll");
      let drawnWidth=0;
      const drawTrail=()=>{
        if(!el.isConnected)return;
      const w = pathEl.clientWidth || 430;
      const landscapeWidth=scroll.clientWidth||w;
      if(landscapeWidth!==drawnWidth){
        drawnWidth=landscapeWidth;
        terrain.style.width=`${landscapeWidth}px`;
        terrain.innerHTML=ns.LettersMapArt.landscape({width:landscapeWidth,height,pathWidth:w,
          stops:worlds.map((world,i)=>({y:yOf(i),biome:world.biome,left:i%2===0})),night:Art.dayPhase()==='night'});
      }
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
      };
      drawTrail();
      if(typeof ResizeObserver!=='undefined'){
        const observer=new ResizeObserver(drawTrail);observer.observe(pathEl);observer.observe(scroll);
        this.stopMapResize=()=>observer.disconnect();
      }else{
        window.addEventListener('resize',drawTrail);
        this.stopMapResize=()=>window.removeEventListener('resize',drawTrail);
      }
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
      const current = el.querySelector(".map-stop.is-current") || el.querySelector(".map-stop.is-door") || (allDone ? Array.from(el.querySelectorAll(".map-stop.is-done")).pop() : null);
      if (current) {
        const scroll=el.querySelector(".map-scroll");
        const node=current.closest(".map-node");
        if(node&&scroll)scroll.scrollTop=node.offsetTop-scroll.clientHeight*(allDone ? .28 : window.innerWidth < 600 ? .50 : .58);
      }
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
        const date=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        cells += `<span class="${cls}" role="img" aria-label="${date}${stamped.has(day)?', played':''}" ${day===today?'aria-current="date"':''}>${stamped.has(day) ? Art.icon("star", 26) : `<i>${day}</i>`}</span>`;
      }
      const el = this.screen(
        "lg-stamps",
        `${this.topBar()}
        <div class="stamps-stage">
          <div class="stamps-moon">${Art.icon("sun", 44)}</div>
          <div class="stamps-grid lg-panel">${cells}</div>
        </div>`,
      );
      this.wireTopBar(el,()=>this.renderGrownup());
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

    startDaily(challenge=false) {
      const world = this.worlds.dailySession(this.progress.done,{challenge});
      if (!world) return;
      this.session = {
        world,
        plan: world.plan || null,
        meetIndex: 0,
        gameIndex: 0,
        starTotal: 0,
        items: world.items(),
        // Distractors come from familiar content; each activity controls
        // how many choices the child sees.
        extraItems: world.extraItems ? world.extraItems(this.progress.done) : [],
        daily: true,
        challenge,
      };
      ns.LettersStrength?.beginReview?.(this.session.items);
      this.startGame();
    }

    // ---------- world flow: meet → games → party ----------

    isGentleDaily() { return !!this.session?.daily && !this.session.challenge; }

    showsRoundProgress() { return this.isReferenceJourney() || this.isGentleDaily(); }

    isReferenceJourney(world = this.session?.world) {
      return world?.id === 'pack-boat' || world?.id === 'pack-smile';
    }

    isBoatAdventure() {
      const s = this.session;
      return !!s && !s.daily && !s.checkup && !s.plan && !!ns.LettersJourney?.forWorld(s.world);
    }

    adventureScene(completed, interactivePet = false) {
      if (!this.isBoatAdventure()) return '';
      return ns.LettersJourney.scene({ completed, interactivePet, items: this.session.items,
        drawings: this.session.journeyDrawings,
        pet: this.petSVG(150, completed === 3 ? 'delighted' : 'proud'),
        growth: ns.LettersGardenArt.growth(this.progress, this.bests) });
    }

    journeyRoute(completed = 0) {
      const world = this.session?.world;
      if (this.isBoatAdventure()) return ns.LettersJourney.route(world, completed);
      if (!this.isReferenceJourney(world) && !this.isGentleDaily()) return '';
      const labels = {pop:'Pond letters',trace:'Draw letters',feed:'Feed a friend',pairs:'Match letters'};
      return `<div class="journey-route" role="list" aria-label="${this.isGentleDaily()?'Daily activities':'Chapter activities'}">${world.games.map((name,i)=>`<span class="journey-stop ${i < completed ? 'is-done' : ''}" role="listitem" aria-label="${labels[name] || name}${i < completed ? ', completed' : ''}">${journeyPicture(name)}${i < completed ? `<i>${Art.icon('check',12)}</i>` : ''}</span>`).join('')}</div>`;
    }

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
        extraItems: world.extraItems ? world.extraItems(this.progress.done) : [],
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
                  (p, i) => `<button type="button" class="meet-piece" aria-label="Join ${p.display}" data-i="${i}" style="--pi:${i}">
                    ${Art.blobCard({ hue: s.world.hue, label: p.display, latin: false })}</button>`,
                )
                .join("")}
            </div>`
          : `<button type="button" class="meet-bud" aria-label="Wake the letter">${ns.LettersRoomArt.bud()}</button>`;
      const el = this.screen(
        "lg-meet",
        `${this.topBar()}
        <div class="meet-stage lg-panel"><div class="meet-display"><div class="lesson-furniture" aria-hidden="true">${ns.LettersRoomArt.lesson()}</div>
          ${opener}
          <button type="button" class="meet-card" aria-label="Listen to ${card.display}" ${hidden}>${bigCard}</button></div>
          ${this.journeyRoute()}
          <div class="meet-dots">${s.world.meet.map((_, i) => `<i class="${i === s.meetIndex ? "is-on" : ""}"></i>`).join("")}</div>
          <div class="meet-nav">
            <button type="button" class="lg-round-btn meet-hear${this.isBoatAdventure() ? ' adventure-companion' : ''}" aria-label="Hear the letter again" ${hidden}>${this.isBoatAdventure() ? `${this.petSVG(66)}<span>${Art.icon('speaker',20)}</span>` : Art.icon("speaker", 36)}</button>
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
      let revealed = isReplay;
      const reveal = () => {
        if (!el.isConnected || revealed) return;
        revealed = true;
        cardEl.hidden = false;
        cardEl.classList.add("is-born");
        el.querySelector(".meet-hear").hidden = false;
        el.querySelector(".meet-next").hidden = false;
        sayWithMe();
      };
      cardEl.addEventListener("click", speakCard);
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
        let pointer = null;
        let dist = 0;
        let px = 0;
        let py = 0;
        let lit = false;
        cardEl.addEventListener("pointerdown", (e) => {
          if(pointer!==null || e.button>0 || e.isPrimary===false || !el.isConnected)return;
          pointer=e.pointerId;
          cardEl.setPointerCapture(pointer);
          px = e.clientX;
          py = e.clientY;
        });
        cardEl.addEventListener("pointermove", (e) => {
          if (e.pointerId!==pointer || lit || !el.isConnected) return;
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
        const release = e => {
          if(e && e.pointerId!==pointer)return;
          const id=pointer;pointer=null;
          if(id!==null && cardEl.hasPointerCapture(id))cardEl.releasePointerCapture(id);
        };
        cardEl.addEventListener("pointerup", release);
        cardEl.addEventListener("pointercancel", release);
        cardEl.addEventListener("lostpointercapture", release);
        this.cancelMeetPointer=release;
      }
      el.querySelector(".meet-hear").addEventListener("click", speakCard);
      el.querySelector(".meet-next").addEventListener("click", () => {
        if(!el.isConnected)return;
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
          piece.addEventListener("click", () => {
            if(!el.isConnected)return;
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
                if(!el.isConnected)return;
                make.classList.add("is-fusing");
                this.sound.play("hatch");
                setTimeout(() => {
                  if(!el.isConnected)return;
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
        bud.addEventListener("click", () => {
          if (bud.disabled || !el.isConnected) return;
          bud.disabled = true;
          bud.classList.add("is-popped");
          this.sound.play("seed");
          setTimeout(() => {
            if (!el.isConnected) return;
            bud.hidden = true;
            reveal();
          }, 320);
        });
      }
    }

    renderMissingItems() {
      const session=this.session;
      const el=this.screen('lg-loading',`${this.topBar()}<div class="loading-flower">${Art.icon('flower',80)}</div><button type="button" class="lg-big-btn retry-words" aria-label="Try loading the letters again">${Art.icon('replay',36)}</button>`);
      this.wireTopBar(el);
      const retry=el.querySelector('.retry-words');
      retry.onclick=async()=>{
        if(retry.disabled || !el.isConnected)return;
        retry.disabled=true;
        await this.worlds.loadWords();
        if(!el.isConnected || this.session!==session)return;
        session.items=session.world.items?.() || [];
        if(session.items.length)this.startGame();else retry.disabled=false;
      };
    }

    startGame() {
      const s = this.session;
      const planStep = s.plan ? s.plan[s.gameIndex] : null;
      const gameName = planStep ? planStep.game : s.world.games[s.gameIndex];
      const gameItems = planStep ? planStep.items : s.items;
      const adventure = this.isBoatAdventure();
      if (adventure) s.boatCelebrationShown = false;
      const canStart = ns.LettersMiniGameCanStart;
      if (!(canStart ? canStart(gameName, gameItems, s.extraItems) : gameItems?.length)) {
        return this.renderMissingItems();
      }
      const el = this.screen(
        "lg-play",
        `${this.topBar()}
        <div class="play-prompt lg-panel">
          <button type="button" class="play-pet" aria-label="Listen to your pet" ${adventure && gameName === 'feed' ? 'hidden' : ''}>${this.petSVG(64)}</button>
          <span class="play-mascot">${Art.keyMascot({ size: 66 })}</span>
          <button type="button" class="play-bubble" aria-label="Hear the letter again" hidden>
            <span class="play-bubble-glyph" data-fit-ink dir="rtl" lang="ar"></span>
            <span class="play-bubble-icon">${Art.icon("speaker", 22)}</span>
          </button>
          <button type="button" class="learning-help lg-round-btn" aria-label="Show the letter" hidden><svg width="26" height="26" viewBox="0 0 40 40" aria-hidden="true"><path d="M3 20Q20 1 37 20Q20 39 3 20Z" fill="#fffaf0" stroke="#4a3620" stroke-width="3"/><circle cx="20" cy="20" r="7" fill="#4e9677"/><circle cx="18" cy="17" r="2" fill="#fffdf7"/></svg></button>
          <span class="play-dots" ${this.showsRoundProgress() ? 'role="progressbar" aria-label="Activity progress" aria-valuemin="0" aria-valuemax="4" aria-valuenow="0"' : ''}>${s.world.games.map((_, i) => `<i class="${i < s.gameIndex ? "is-done" : i === s.gameIndex ? "is-on" : ""}"></i>`).join("")}</span>
        </div>
        ${adventure ? this.journeyRoute(s.gameIndex) : ''}
        <div class="learning-hint" role="status" aria-live="polite" hidden></div>
        <div class="play-stage"></div>`,
      );
      el.dataset.activity = gameName;
      this.wireTopBar(el);
      const stage = el.querySelector(".play-stage");
      const bubble = el.querySelector(".play-bubble");
      const glyph = el.querySelector(".play-bubble-glyph");
      const help = el.querySelector(".learning-help");
      const hint = el.querySelector(".learning-hint");
      let currentTarget = null;
      let presentation = {version:0,hidden:false,heard:false,choiceIds:[]};
      let speechAttempt = 0;
      bubble.addEventListener("click", () => sayWithPose(currentTarget));

      const petEl = el.querySelector(".play-pet");
      let poseTimer = null;
      this.stopJourneyPose = () => {clearTimeout(poseTimer);};
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
        const friend = adventure && gameName === 'feed' ? el.querySelector('.feed-creature') : petEl;
        if (!friend?.isConnected) return;
        friend.dataset.pose = pose;
        friend.innerHTML = this.petSVG(adventure && gameName === 'feed' ? 180 : 64, petMood(pose));
        if (poseTimer) clearTimeout(poseTimer);
        poseLockedUntil = lock ? Date.now() + hold : 0;
        if (hold > 0) {
          poseTimer = setTimeout(() => {
            if (!friend.isConnected) return;
            poseLockedUntil = 0;
            friend.dataset.pose = 'presenting';
            friend.innerHTML = this.petSVG(adventure && gameName === 'feed' ? 180 : 64, petMood(currentTarget ? "presenting" : "idle"));
          }, hold);
        }
      };
      const sayWithPose = (item) => {
        if (Date.now() >= poseLockedUntil) setPetPose("listening", 900);
        const version = presentation.version, attempt = ++speechAttempt;
        const answer = currentTarget?.id;
        return this.sayForLearning(item).then(heard => {
          if (!el.isConnected || version !== presentation.version || attempt !== speechAttempt || answer !== item?.id) return false;
          presentation.heard = heard;
          stage.inert = false;
          if (!heard && presentation.hidden) revealPrompt(true);
          return heard;
        });
      };
      petEl.addEventListener("click", () => {
        setPetPose("success", 900);
        this.petRecite(null);
      });
      // Learning evidence travels on its own explicit channel. Prompt replay
      // and sound effects remain presentation and cannot manufacture verdicts.
      const learning = ns.LettersLearning?.LearningSession
        ? new ns.LettersLearning.LearningSession(ns.LettersStrength)
        : null;
      const revealPrompt = (assisted = true) => {
        if (!el.isConnected || !currentTarget) return;
        if (assisted) learning?.assist();
        presentation.hidden = false;
        stage.inert = false;
        glyph.hidden = false;
        help.hidden = true;
        bubble.classList.remove('is-listening-only');
      };
      help.onclick = () => {revealPrompt(true);sayWithPose(currentTarget);};
      this.onLearningSoundChange = () => {if (!this.sound.enabled) revealPrompt(presentation.hidden);};
      const firstAttempt = !(this.bests[`${s.world.id}:${gameName}`] > 0) && !s.daily && !s.checkup;
      const ctx = {
        stage,
        adventure,
        petReact: pose => {if(adventure)setPetPose(pose, 850, pose === 'proud');},
        onDrawingMade: (item, canvas) => {
          if (!adventure || !el.isConnected || this.session !== s) return;
          // Carry the child's ink into the handoff, not into answer tiles or
          // saved mastery. These tiny pictures live only for this chapter visit.
          try {
            const picture = document.createElement('canvas');
            picture.width = 160; picture.height = 160;
            const scale = Math.min(160 / canvas.width, 160 / canvas.height);
            const width = canvas.width * scale, height = canvas.height * scale;
            picture.getContext('2d').drawImage(canvas, (160-width)/2, (160-height)/2, width, height);
            s.journeyDrawings ||= {};
            s.journeyDrawings[item.display] = picture.toDataURL('image/png');
          } catch { /* A thumbnail must never block drawing completion. */ }
        },
        onPetTap: () => {setPetPose('listening', 900); if(currentTarget)sayWithPose(currentTarget);},
        garden: s.world.id === "pack-boat" || this.isGentleDaily(),
        referenceJourney: this.isReferenceJourney(s.world),
        setRoundProgress: (current,total) => {
          if (!this.showsRoundProgress() || !el.isConnected) return;
          const dots=el.querySelector('.play-dots');
          dots.setAttribute('aria-valuemax', String(total));
          dots.setAttribute('aria-valuenow', String(current-1));
          dots.setAttribute('aria-valuetext', `Round ${current} of ${total}`);
          dots.innerHTML=Array.from({length:total},(_,i)=>`<i class="${i<current-1?'is-done':i===current-1?'is-on':''}"></i>`).join('');
        },
        petArt: (mood = 'listening') => this.petSVG(180,mood),
        reducedMotion: () => this.prefersReducedMotion(),
        items: planStep ? planStep.items : s.items,
        extraItems: s.extraItems,
        activity: gameName,
        worldId: s.world.id,
        completedWorldIds: this.progress.done,
        challenge: !!s.challenge,
        // Existing word/sequence speech has not been qualified for independent
        // decoding; those activities retain a visible model and explicit help.
        allowRecall: s.world.kind === 'letters' || s.daily || s.checkup,
        rounds: planStep?.rounds || 4,
        hue: s.world.hue,
        level: 0,
        beginner: firstAttempt || gameName === 'pairs' && gameItems.some(item => (ns.LettersStrength?.skillProfile?.(item.id,'matching-memory')?.matching?.r || 0) < 3),
        onPauseChange: paused => {if(paused && el.isConnected)this.stopSpeech();},
        say: (item) => sayWithPose(item),
        reportOutcome: (outcome) => {
          const active = outcome.itemId === currentTarget?.id;
          const prompted = active && outcome.evidence === 'supported_visible_matching' && gameName !== 'pairs';
          return learning?.report({...outcome,
            skill: active ? presentation.skill : outcome.skill || ns.LettersLearning?.skillFor({id:outcome.itemId,display:outcome.itemId},gameName),
            activity: gameName,
            choiceIds: outcome.choiceIds || (active ? presentation.choiceIds : []),
            ...(prompted ? {evidence:presentation.hidden && presentation.heard && presentation.choiceIds.length>1 ? 'independent_listening' : 'supported_visible_matching',
              assisted:outcome.assisted || presentation.choiceIds.length===1} : {}),
          });
        },
        clearLearningHint: () => {hint.hidden=true;},
        showLearningHint: (target, selected) => {
          revealPrompt(true);
          if (!selected || (target.id || target.display)===(selected.id || selected.display)) return;
          const feature=ns.LettersLearning?.contrast(target,selected) || 'shape';
          hint.hidden=false;hint.dataset.feature=feature;
          hint.replaceChildren();
          const before=document.createElement('span'),after=document.createElement('span'),arrow=document.createElement('span');
          before.className='learning-compare';after.className='learning-compare is-target';
          before.lang=after.lang='ar';before.dir=after.dir='rtl';
          const putGlyph=(container,display)=>{
            const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
            svg.setAttribute('viewBox','0 0 80 66');svg.setAttribute('aria-hidden','true');
            const text=document.createElementNS('http://www.w3.org/2000/svg','text');
            for(const [name,value] of Object.entries({x:40,y:30,'text-anchor':'middle','font-family':'Amiri Quran, serif','font-size':46,fill:'#4a3620',direction:'rtl','data-fit-box':'40,30,66,56,46'}))text.setAttribute(name,String(value));
            text.textContent=display;svg.append(text);container.append(svg);
          };
          putGlyph(before,selected.display);putGlyph(after,target.display);
          arrow.innerHTML=Art.icon('next',24);arrow.setAttribute('aria-hidden','true');
          hint.append(before,arrow,after);
          hint.setAttribute('aria-label',`Compare ${selected.display} with ${target.display}: ${feature}`);
        },
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
        setPrompt: (item, meta = {}) => {
          currentTarget = item;
          const skill = meta.skill || ns.LettersLearning?.skillFor(item,gameName) || 'recognition';
          learning?.beginPrompt(item,{skill,activity:gameName,choiceIds:meta.choiceIds || []});
          presentation = {version:presentation.version+1,skill,choiceIds:meta.choiceIds || [],heard:false,
            hidden:!!item && meta.promptMode==='listen' && this.canSpeak(item) && (meta.choiceIds || []).length>1};
          stage.inert=presentation.hidden;
          hint.hidden=true;
          glyph.hidden=presentation.hidden;
          help.hidden=!presentation.hidden;
          bubble.classList.toggle('is-listening-only',presentation.hidden);
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
            Art.fitInlineGlyphs?.(el);
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
      this.unmountActivityArt=ns.LettersActivityArt?.mount(stage,gameName);
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
      const bestKey = `${s.world.id}:${s.plan && !s.daily ? "plan" + s.gameIndex : s.world.games[s.gameIndex]}`;
      const prevBest = this.bests[bestKey] || 0;
      if (stars > prevBest) {
        this.earnStars(stars - prevBest);
        this.bests[bestKey] = stars;
        this.saveJSON("quran-trainer:letters:bests", this.bests);
      }
      // Check-up rounds grade a skill: the LATEST score is the petal size —
      // it's a health check, not a high-score board.
      if (s.checkup && s.plan && s.plan[s.gameIndex] && s.plan[s.gameIndex].skill) {
        this.skills[s.plan[s.gameIndex].skill] = { score: stars, at: todayStr() };
        this.saveJSON("quran-trainer:letters:skills", this.skills);
      }
      this.renderStars(stars);
    }

    renderPracticeGarden() {
      const world=this.worlds.worlds.find(w=>w.id==='pack-boat');
      const familiar=this.petKnowledge().map(letter=>({id:letter.char,display:letter.char,speak:letter.arName,objective:'letter-name'}));
      this.session={world,items:familiar.length?familiar:world.items()};
      const choices=['Feed','DotGarden','GardenPaths'];
      if(this.petKnowledge().length)choices.push('LetterDelivery');
      if(this.workshopWorlds().length)choices.push('Workshop');
      if(this.worlds.dailySession(this.progress.done))choices.push('Burst');
      const el=this.screen('lg-meet',`${this.topBar()}<div class="practice-garden-hub"><div class="practice-garden-choices">${choices.map(kind=>`<button type="button" data-kind="${kind}" aria-label="${({Feed:'Feed a friend',DotGarden:'Dot Garden: place the dots',GardenPaths:'Garden Paths: draw letters',LetterDelivery:'Letter Delivery: familiar letters',Workshop:'Word Workshop: build familiar sounds',Burst:'Optional timed letter challenge'})[kind]}">${kind==='LetterDelivery'?ns.LetterDelivery.icon(120):ns.LettersGardenArt.practicePicture(kind,{petArt:kind==='Feed'?this.petSVG(100):''})}<span class="practice-play" aria-hidden="true">${Art.icon('next',24)}</span></button>`).join('')}</div></div>`);
      this.wireTopBar(el);
      el.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>b.dataset.kind==='Burst'?this.startDaily(true):b.dataset.kind==='Workshop'?this.renderWorkshop():this.startPractice(b.dataset.kind,()=>this.renderPracticeGarden()));
    }

    renderDecoratingGarden() {
      this.session=null;
      const el=this.screen('lg-my-garden',`${this.topBar()}<div class="my-garden-stage"></div>`);
      this.wireTopBar(el);
      this.game=new ns.DecoratingGarden({
        stage:el.querySelector('.my-garden-stage'),layout:this.gardenLayout,
        catalog:ns.LettersDecorations.catalog(this),petArt:()=>this.petSVG(112,'proud'),
        reducedMotion:()=>this.prefersReducedMotion(),play:name=>this.sound.play(name),
        onChange:layout=>{if(!el.isConnected)return;this.gardenLayout=layout;this.saveJSON('quran-trainer:letters:garden-layout',layout);},
        onDone:()=>{if(el.isConnected)this.renderHome();}
      });
      if(this.petKnowledge().length){
        const launch=document.createElement('button');launch.type='button';launch.className='decorate-delivery practice-button';
        launch.setAttribute('aria-label','Play Letter Delivery');launch.innerHTML=ns.LetterDelivery.icon(44);
        el.querySelector('.decorate-tools').prepend(launch);
        launch.onclick=()=>{if(!el.isConnected)return;this.startPractice('LetterDelivery',()=>this.renderDecoratingGarden());};
      }
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
      return `<div class="garden-practice-links" aria-label="Optional practice">${['DotGarden','GardenPaths'].map(kind=>`<button type="button" data-practice="${kind}" aria-label="Optional ${kind==='DotGarden'?'Dot Garden':'Garden Paths drawing'} practice">${ns.LettersGardenArt.practicePicture(kind,{petArt:kind==='Feed'?this.petSVG(100):''})}</button>`).join('')}</div>`;
    }
    wirePractice(el,back) {
      el.querySelectorAll('[data-practice]').forEach(b=>b.onclick=()=>this.startPractice(b.dataset.practice,back));
    }
    startPractice(kind,back) {
      if(!['Feed','Workshop','DotGarden','GardenPaths','LetterDelivery'].includes(kind))return back?.();
      if(kind==='LetterDelivery'){const items=this.petKnowledge().map(letter=>({id:letter.char,display:letter.char,speak:letter.arName}));if(!items.length)return back?.();this.session={world:this.worlds.worlds.find(w=>w.id==='pack-boat'),items};}
      const s=this.session;
      if(!s?.world || !(s.items||s.world.items()).length)return back?.();
      const el=this.screen('lg-play',`${this.topBar()}<div class="practice-heading">${this.petSVG(76)}<button class="practice-replay" type="button" aria-label="Hear the letter again"></button></div><div class="practice-stage"></div>`);
      el.dataset.activity=kind==='Feed'?'feed':kind==='Workshop'?'build':kind==='LetterDelivery'?'delivery':kind==='DotGarden'?'dots':'practice';
      if(kind==='LetterDelivery')el.querySelector('.practice-heading').hidden=true;
      if(kind==='Feed'||kind==='Workshop')el.querySelector('.practice-stage').classList.add('play-stage');
      this.wireTopBar(el,back);
      const replay=el.querySelector('.practice-replay');let current=null;
      replay.onclick=()=>{if(this.game?.replayPrompt)this.game.replayPrompt();else if(current)this.sayForLearning(current);};
      const learning=ns.LettersLearning?.LearningSession
        ? new ns.LettersLearning.LearningSession(ns.LettersStrength)
        : null;
      const ctx={stage:el.querySelector('.practice-stage'),items:s.items||s.world.items(),
        activity:kind,worldId:s.world.id,completedWorldIds:this.progress?.done || [],
        reducedMotion:()=>this.prefersReducedMotion(),petArt:()=>this.petSVG(140,'open'),
        canListen:()=>this.canSpeak(),
        prompt:item=>{current=item;
          learning?.beginPrompt(item,{activity:kind,skill:ns.LettersLearning?.skillFor(item,kind==='Workshop'?'build':kind)});
          if(kind==='Workshop' && item)replay.innerHTML=`<svg viewBox="0 0 120 80" aria-hidden="true"><text x="60" y="40" text-anchor="middle" font-family="Amiri Quran, serif" font-size="42" fill="#4a3620" data-fit-box="60,40,94,52,42">${item.display}</text></svg>`;
          else if(item)replay.textContent=item.display;else replay.innerHTML=Art.icon('speaker',32);
        },
        say:item=>{if(kind!=='Workshop')current=item;return this.sayForLearning(item);},
        reportOutcome:outcome=>learning?.report(outcome),
        correct:()=>this.sound.play('correct'),
        done:()=>{if(el.isConnected)back();}};
      if(kind==='Feed')this.game=new ns.LettersMiniGames.feed({...ctx,garden:true,beginner:true,level:0,rounds:4,hue:150,extraItems:[],petArt:()=>this.petSVG(180),setPrompt:ctx.prompt,sfx:name=>this.sound.play(name),confettiAt:target=>this.confettiAt(target),onDone:ctx.done});
      else if(kind==='Workshop')this.game=new ns.LettersMiniGames.build({...ctx,setPrompt:ctx.prompt,sfx:name=>this.sound.play(name),confettiAt:target=>this.confettiAt(target),onDone:ctx.done});
      else if(kind==='LetterDelivery')this.game=new ns.LetterDelivery(ctx);
      else this.game=new ns.GardenPractice[kind](ctx);
      if(kind==='Workshop')this.unmountActivityArt=ns.LettersActivityArt?.mount(ctx.stage,'build');
    }

    gardenReward(finished=false) {
      const world=this.session?.world;
      const stage=ns.LettersGardenArt.chapterGrowth(this.progress,this.bests,world);
      const scene=world?.id==='pack-boat'?ns.LettersGardenArt.boat({stage,terrain:false}):
        ns.LettersGardenArt.habitatReward({biome:world?.biome || 'meadow',stage,habitat:this.biomeDeco(world?.biome)});
      return `<div class="garden-reward${finished?' garden-reward-finished':''}" role="img" aria-label="Garden flowers: ${stage}">${scene}</div>`;
    }

    rewardScene(finished=false,flower=false) {
      return `<div class="reward-scene"><div class="reward-ground" aria-hidden="true">${ns.LettersRoomArt.podium()}</div>${this.gardenReward(finished)}
        ${flower?`<div class="party-flower">${Art.skillFlower({scores:this.skills,size:120})}</div>`:''}
        ${finished?`<div class="party-pair"><div class="party-mascot">${Art.keyMascot({size:120,mood:'open'})}</div><button type="button" class="party-pet" aria-label="Celebrate with your pet"><span class="pet-bubble" hidden></span>${this.petSVG(150,'open')}</button></div>`: `<div class="reward-friend" aria-hidden="true">${this.petSVG(150,'proud')}</div>`}</div>`;
    }

    renderStars(stars) {
      const s = this.session;
      const lastGame = s.gameIndex >= s.world.games.length - 1;
      const adventure = this.isBoatAdventure();
      // Feed closes the picnic and chapter in one celebration. Star accounting
      // already happened in finishGame; the chapter save still uses finishWorld.
      if (adventure && lastGame) {
        if (s.boatCelebrationShown) return;
        s.boatCelebrationShown = true;
        s.gameIndex = s.world.games.length;
        return this.finishWorld();
      }
      const nextStep = adventure ? ns.LettersJourney.forWorld(s.world).steps[s.gameIndex + 1] : null;
      const el = this.screen(
        "lg-stars",
        `${this.topBar()}
        <div class="stars-stage lg-panel">
          ${adventure ? this.adventureScene(s.gameIndex+1) : this.rewardScene()}
          ${this.journeyRoute(s.gameIndex+1)}
          <div class="stars-row" role="img" aria-label="${stars} of 3 stars">
            ${[0, 1, 2].map((i) => `<span class="stars-star ${i < stars ? "is-on" : ""}" style="animation-delay:${i * 220}ms">${Art.icon("star", 74)}</span>`).join("")}
          </div>
          <div class="stars-nav">
            <button type="button" class="lg-round-btn stars-replay" aria-label="Play again">${Art.icon("replay", 34)}</button>
            <button type="button" class="lg-big-btn stars-next" aria-label="${nextStep?.label || 'Continue'}">${nextStep ? `<span class="adventure-next-icon">${ns.LettersJourney.icon(nextStep.game)}</span>` : ''}${Art.icon(lastGame ? "check" : "next", 40)}</button>
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
        this.replayActivity(el);
      });
      el.querySelector(".stars-next").addEventListener("click", () => {
        this.continueActivity(el);
      });
    }

    replayActivity(el, final = false) {
      if (!el.isConnected || el.dataset.journeyConsumed) return;
      el.dataset.journeyConsumed = 'true';
      const s = this.session;
      this.sound.play('click');
      if (final) {
        s.gameIndex = s.world.games.length - 1;
        s.boatCelebrationShown = false;
      }
      s.starTotal -= s.lastStars;
      this.startGame();
    }

    continueActivity(el) {
      if (!el.isConnected || el.dataset.journeyConsumed) return;
      el.dataset.journeyConsumed = 'true';
      const s = this.session;
      this.sound.play('click');
      s.gameIndex += 1;
      if (s.gameIndex >= s.world.games.length) this.finishWorld();
      else this.startGame();
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
      const adventure = this.isBoatAdventure();
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
          ${adventure ? this.adventureScene(3,true) : this.rewardScene(true,flower)}
          ${adventure ? this.journeyRoute(3) : ''}
          <div class="party-stars" role="img" aria-label="${stars} of 3 stars">
            ${[0, 1, 2].map((i) => `<span class="stars-star ${i < stars ? "is-on" : ""}" style="animation-delay:${i * 240}ms">${Art.icon("star", 64)}</span>`).join("")}
          </div>
          <div class="party-actions">${adventure ? `<button type="button" class="lg-round-btn party-replay" aria-label="Play the delivery again">${Art.icon('replay',32)}</button>` : ''}<button type="button" class="party-decorate" aria-label="Decorate with your earned rewards">${ns.DecoratingGarden.icon(50)}</button><button type="button" class="lg-big-btn party-next" aria-label="Return to the garden">${Art.icon(adventure ? "home" : "next", 44)}</button></div>
        </div>`,
      );
      this.sound.play(newlyDone ? "worldClear" : "perfect");
      this.confettiAt(el.querySelector(".party-mascot"), true);
      setTimeout(() => { if (el.isConnected) this.confettiAt(el.querySelector(".party-stars"), true); }, 500);
      if (newlyDone) setTimeout(() => { if (el.isConnected) this.confettiAt(el.querySelector(".party-mascot"), true); }, 900);
      this.wirePractice(el,()=>this.renderParty(stars,false,{flower}));
      const replay = el.querySelector('.party-replay');
      if(replay)replay.onclick=()=>this.replayActivity(el,true);
      const partyPet = el.querySelector(".party-pet");
      partyPet.addEventListener("click", () => {
        this.petRecite(partyPet.querySelector(".pet-bubble"));
        partyPet.querySelector(".pet-bubble").hidden = false;
      });
      el.querySelector(".party-decorate").onclick=()=>{if(el.isConnected)this.renderDecoratingGarden();};
      el.querySelector(".party-next").addEventListener("click", () => {
        if(!el.isConnected)return;
        this.sound.play("page");
        this.renderHome();
      });
    }
  }

  ns.LettersGame = LettersGame;
})(window.MiftahGame || (window.MiftahGame = {}));
