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
    pop: '<ellipse cx="24" cy="29" rx="19" ry="10" fill="#96ecff"/><path d="M9 30Q24 24 39 30" fill="none"/><circle cx="24" cy="17" r="8" fill="#fffaf0"/><path d="M20 14L24 12" stroke="#fffdf7"/>',
    trace: '<path d="M9 32L13 22 31 5 42 16 23 34Z" fill="#4e9677"/><path d="M9 32L13 22 23 34Z" fill="#e5dcc8"/><path d="M9 32L14 28 16 33Z" fill="#4a3620"/><path d="M9 41H36" fill="none"/>',
    pairs: '<rect x="5" y="8" width="23" height="29" rx="6" fill="#e5dcc8"/><rect x="20" y="15" width="23" height="29" rx="6" fill="#fffaf0"/><path d="M25 32Q25 23 36 24Q36 34 25 32" fill="#4e9677"/>',
    feed: '<path d="M8 23H40L36 40H12Z" fill="#c9bda4"/><path d="M14 24V18A10 10 0 0 1 34 18V24M10 31H38M20 25V38M29 25V38" fill="none"/><path d="M21 17Q10 6 15 5Q26 5 25 17Q26 7 36 9Q37 18 25 19" fill="#4e9677"/>'
  };
  const journeyPicture = name => `<svg viewBox="0 0 48 48" aria-hidden="true"><g stroke="#70501b" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${journeyPictures[name] || journeyPictures.pop}</g></svg>`;

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

  // v4 Growing Friend: one trick per letter family, in qaida order.
  const PET_TRICKS = [
    { id: "spin", family: "boat", name: "Twirl" },
    { id: "hop", family: "smile", name: "Triple hop" },
    { id: "sway", family: "little", name: "Sway dance" },
    { id: "sing", family: "wave", name: "Sing" },
    { id: "stretch", family: "tall", name: "Stretch tall" },
    { id: "juggle", family: "strong", name: "Juggle" },
    { id: "roll", family: "round", name: "Somersault" },
  ];
  const TRICK_GIFTS = [[2, "sprout"], [4, "medal"], [7, "crown"]];
  // v12: which sticker animals visit, and how they move.
  const VISITORS = { bee: "sky", butterfly: "sky", dove: "sky", crow: "sky", hoopoe: "sky", camel: "ground", elephant: "ground", ant: "ground", cat: "ground", spider: "ground", snake: "ground", turtle: "ground", fish: "water", whale: "water" };
  // v19 Quran Treasury: stickers whose word appears in the Quran — [surah,
  // ayah, word position, the word as written, explicit clip path (if the data
  // build stores one), surah name]. Every entry was looked up in data/surah-N.json.
  const TREASURY = {
    elephant: [105, 1, 7, "ٱلْفِيلِ", "", "الفيل"], ant: [27, 18, 6, "ٱلنَّمْلِ", "", "النمل"], hoopoe: [27, 20, 8, "ٱلْهُدْهُدَ", "", "النمل"],
    spider: [29, 41, 9, "ٱلْعَنكَبُوتِ", "", "العنكبوت"], bee: [16, 68, 4, "ٱلنَّحْلِ", "", "النحل"], crow: [5, 31, 3, "غُرَابًۭا", "", "المائدة"],
    butterfly: [101, 4, 4, "كَٱلْفَرَاشِ", "", "القارعة"], fig: [95, 1, 1, "وَٱلتِّينِ", "", "التين"], olive: [95, 1, 2, "وَٱلزَّيْتُونِ", "", "التين"],
    camel: [88, 17, 4, "ٱلْإِبِلِ", "", "الغاشية"], whale: [68, 48, 7, "ٱلْحُوتِ", "", "القلم"], pomegranate: [55, 68, 4, "وَرُمَّانٌۭ", "", "الرحمن"],
    moon: [54, 1, 4, "ٱلْقَمَرُ", "", "القمر"], sun: [91, 1, 1, "وَٱلشَّمْسِ", "", "الشمس"], star: [53, 1, 1, "وَٱلنَّجْمِ", "", "النجم"],
    mountain: [78, 7, 1, "وَٱلْجِبَالَ", "", "النبإ"], dates: [19, 23, 5, "ٱلنَّخْلَةِ", "", "مريم"], grapes: [80, 28, 1, "وَعِنَبًۭا", "", "عبس"],
    snake: [20, 20, 4, "حَيَّةٌۭ", "", "طه"], palm: [55, 11, 3, "وَٱلنَّخْلُ", "", "الرحمن"], lantern: [24, 35, 9, "مِصْبَاحٌ ۖ", "wbw/024_035_011.mp3", "النور"],
    key: [6, 59, 2, "مَفَاتِحُ", "wbw/006_059_003.mp3", "الأنعام"], cloud: [2, 164, 36, "وَٱلسَّحَابِ", "", "البقرة"], fish: [18, 61, 6, "حُوتَهُمَا", "", "الكهف"],
    boat: [18, 71, 6, "ٱلسَّفِينَةِ", "", "الكهف"],
  };
  const pad3 = (n) => String(n).padStart(3, "0");
  const arabicDigits = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
  const treasuryWord = (id) => {
    const e = TREASURY[id];
    if (!e) return null;
    const [s, a, w, arabic, audio, name] = e;
    return { id: `q:${id}`, display: arabic.replace(/\s*[ۖۗۘۙۚۛ]\s*$/, ""), speak: arabic, audioPath: audio || `wbw/${pad3(s)}_${pad3(a)}_${pad3(w)}.mp3`, surah: name, ayah: a };
  };
  // v23: the world-overview button — a folded map.
  // Practice-garden group chips (UI pass 2026-10-03): wordless pictures.
  const PG_CHIPS = {
    play: `<svg viewBox="0 0 40 40" width="34" height="34"><path d="M20 34Q4 24 6 14Q8 6 15 7Q19 8 20 12Q21 8 25 7Q32 6 34 14Q36 24 20 34Z" fill="#ee806f" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/></svg>`,
    read: `<svg viewBox="0 0 40 40" width="34" height="34"><path d="M4 10Q12 6 20 10Q28 6 36 10V32Q28 28 20 32Q12 28 4 32Z" fill="#fffdf7" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M20 10V32" stroke="#4a3620" stroke-width="2.4"/></svg>`,
    think: `<svg viewBox="0 0 40 40" width="34" height="34"><path d="M20 5Q31 5 31 16Q31 22 25 26V30H15V26Q9 22 9 16Q9 5 20 5Z" fill="#ffe49a" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M15 34H25" stroke="#4a3620" stroke-width="3" stroke-linecap="round"/></svg>`,
    write: `<svg viewBox="0 0 40 40" width="34" height="34"><path d="M8 32L10 24L28 6L34 12L16 30Z" fill="#ffa798" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/><path d="M8 32L16 30L10 24Z" fill="#4a3620"/></svg>`,
    explore: `<svg viewBox="0 0 40 40" width="34" height="34"><circle cx="17" cy="17" r="10" fill="#ccfbef" stroke="#4a3620" stroke-width="3"/><path d="M25 25L34 34" stroke="#70501b" stroke-width="4" stroke-linecap="round"/></svg>`,
  };
  const WALK_KEY = "quran-trainer:letters:walk";
  const BOOKS_KEY = "quran-trainer:letters:books";
  // Today's Walk (v25): a little trail of footprints on the map header.
  const WALK_BTN = `<svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><path d="M8 40Q16 30 24 32Q32 34 40 22" fill="none" stroke="#c9bda4" stroke-width="6" stroke-linecap="round" data-ribbon/><g fill="#e8743c" stroke="#4a3620" stroke-width="1.6"><ellipse cx="13" cy="33" rx="3.6" ry="5" transform="rotate(-30 13 33)"/><ellipse cx="24" cy="27" rx="3.6" ry="5" transform="rotate(10 24 27)"/><ellipse cx="35" cy="22" rx="3.6" ry="5" transform="rotate(-20 35 22)"/></g><circle cx="40" cy="10" r="5" fill="#f3c955" stroke="#4a3620" stroke-width="1.6"/></svg>`;
  const WORLD_BTN = `<svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true"><path d="M6 12L17 8L31 12L42 8V36L31 40L17 36L6 40Z" fill="#fffaf0" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M17 8V36M31 12V40" stroke="#a89478" stroke-width="2.4"/><path d="M9 30Q16 24 22 28Q28 32 38 22" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/><circle cx="24" cy="20" r="3.6" fill="#e8743c" stroke="#4a3620" stroke-width="1.6"/></svg>`;
  // v16: the star-chart tab — a four-point star beside a crescent.
  const SKYTAB = `<svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true"><path d="M20 8A16 16 0 1 0 26 40A12 12 0 1 1 20 8Z" fill="#6064a0" stroke="#4a3620" stroke-width="3"/><path d="M34 10Q34 18 42 18Q34 18 34 26Q34 18 26 18Q34 18 34 10Z" fill="#f3c955" stroke="#4a3620" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
  // v8: a little rehal (Quran stand) marks the word shelf.
  const REHAL = `<svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true"><path d="M8 40L24 22L40 40M14 40L24 28L34 40" fill="none" stroke="#70501b" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="M6 20Q15 12 24 18Q33 12 42 20L40 30Q32 24 24 29Q16 24 8 30Z" fill="#fffaf0" stroke="#4a3620" stroke-width="3" stroke-linejoin="round"/><path d="M24 18V29" stroke="#4a3620" stroke-width="2.4"/></svg>`;

  class LettersGame {
    constructor(root) {
      this.root = root;
      this.stopGlyphFit = Art.watchGlyphs?.(root);
      this.sound = new ns.LettersSound(new ns.SoundSystem());
      if (typeof document !== "undefined" && document.addEventListener) this.watchLandVisibility();
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
      try {
        const strong = this.worlds.letters.filter((l) => (ns.LettersStrength?.mastery(l.char) || 0) >= 0.7).length;
        ns.LettersAnalytics?.visit({ days: (this.stamps.dates || []).length, strong });
      } catch {}
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
      // Little Sprout (v22) always includes gentle mode.
      this.sprout = this.loadJSON("quran-trainer:letters:sprout", false);
      this.gentle = this.loadJSON("quran-trainer:letters:gentle", false) || this.sprout;
      this.skills = this.loadJSON("quran-trainer:letters:skills", {});
      this.wallet = this.loadJSON("quran-trainer:letters:wallet", { earned: 0, spent: 0 });
      // Best stars per world+game, so stars pay for improvement not repetition.
      this.bests = this.loadJSON("quran-trainer:letters:bests", {});
      this.stickers = this.loadJSON("quran-trainer:letters:stickers", { owned: [] });
      this.gardenLayout = this.loadJSON("quran-trainer:letters:garden-layout", {version:1,slots:[null,null,null,null]});
      this.savedDrawings = this.loadJSON("quran-trainer:letters:drawings", {});
      // Where the pet waits on the map survives reloads; a locked or unknown
      // chapter falls back to the current lesson when the map draws.
      this.mapPetWorld = this.loadJSON("quran-trainer:letters:map-pet", null);
      this.landsSeen = this.loadJSON("quran-trainer:letters:lands-seen", []);
      this.applyPhase();
      this.initSparkles();
      this.initAmbient();
      this.initTouchFeedback();
      this.initReach();
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
        // Family Garden (v9): with more than one child, ask who is playing first.
        let chosen = false;
        try { chosen = sessionStorage.getItem("lg-profile-chosen") === "1"; } catch {}
        if (!chosen && (ns.LettersState?.profiles?.().length || 1) > 1) return this.renderWhoIsPlaying();
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
    // Reach (2026-10-02): forgiveness for very small hands. A tap that lands on
    // nothing goes to the nearest tappable thing within 32px (44px in gentle
    // mode) — but ONLY when exactly one thing is that close, so a miss between
    // two answers never becomes a wrong answer. Navigation (home, sound, the
    // grown-up dot) and drawing surfaces are never reached for: those need a
    // direct touch. Keyboard and scripted clicks are left alone.
    initReach() {
      const AIM = "button:not([disabled]), [role=button], .pop-bubble, .catch-faller, .map-stop, .meet-bud, .meet-piece, [data-tap]";
      const NEVER = ".lg-topbar, .lg-grownup-dot, canvas, .trace-guided, .studio-canvas, .gu-scroll, input, select, textarea, [aria-disabled=true]";
      if (typeof this.root?.addEventListener !== "function") return;
      this.root.addEventListener("click", (e) => {
        if (!e.isTrusted || e.detail === 0 || !e.target?.closest) return;
        if (e.target.closest(AIM) || e.target.closest(NEVER)) return;
        const scope = e.target.closest("dialog") || this.root;
        const reach = this.sprout ? 52 : this.gentle ? 44 : 32;
        const near = [...scope.querySelectorAll(AIM)].filter(el => {
          if (el.closest(NEVER) || (scope === this.root && el.closest("dialog")) || el.closest("[hidden]")) return false;
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) return false;
          const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right), dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
          return Math.hypot(dx, dy) <= reach;
        });
        if (near.length !== 1) return;
        e.preventDefault();
        e.stopPropagation();
        near[0].click();
      }, true);
    }

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
        if (this.prefersReducedMotion() || this.gentle) return; // the in-app switch, not only the OS setting; calm in gentle mode
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
          this.sound.play(n >= 3 ? "hatch" : "crack");
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
          if(!el.isConnected)return;
          this.pet.hue = Number(swatch.dataset.hue);
          this.saveJSON("quran-trainer:letters:pet", this.pet);
          this.sound.play("click");
          this.renderHatch(3);
        });
      }
      const hatchling = this.petLife(el.querySelector(".hatch-pet"), el);
      if (this.hatchWoke) hatchling?.cheer();
      else { this.hatchWoke = true; hatchling?.wake(() => hatchling.wave()); }
      el.querySelector(".hatch-pet").addEventListener("click", () => { hatchling?.wave(); this.petRecite(null); });
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
      const tab=['friends','outfits','colors','tricks'].includes(this.wardrobeTab)?this.wardrobeTab:'outfits';
      this.grantTrickGifts();
      const previous=this.root.querySelector('.lg-pet');
      const changedOutfit=!!previous&&!this.quietPetRender;this.quietPetRender=false;
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
            <div class="pet-diorama">${ns.LettersRoomArt.floor()}<div class="pet-alcove" aria-hidden="true">${ns.LettersRoomArt.alcove()}</div>
            <span class="lg-star-chip">${Art.icon("star", 20)} <b>${this.starBalance()}</b></span>
            <button type="button" aria-label="Play with your pet" class="pet-big${this.petRadiance() > 0.15 ? " is-radiant" : ""}">
              <span class="pet-aura" aria-hidden="true"></span>
              <span class="pet-bubble" hidden></span>
              ${this.petSVG(210)}
            </button>
            <button type="button" class="room-toy room-ball" aria-label="Roll the ball">${ns.LettersRoomArt.toys?.ball || ""}</button>
            <button type="button" class="room-toy room-drum" aria-label="Play the drum">${ns.LettersRoomArt.toys?.drum || ""}</button>
            <button type="button" class="room-toy room-wand" aria-label="Blow bubbles">${ns.LettersRoomArt.toys?.wand || ""}</button></div>
            ${Object.keys(this.skills).length ? `<div class="pet-flower">${Art.skillFlower({ scores: this.skills, size: 92 })}</div>` : ""}
          </div>
          <div class="pet-racks">
            <div class="wardrobe-tabs" role="tablist" aria-label="Wardrobe choices">
              ${['friends','outfits','colors','tricks'].map(kind=>`<button type="button" role="tab" id="wardrobe-tab-${kind}" data-wardrobe-tab="${kind}" aria-controls="wardrobe-panel" aria-selected="${tab===kind}" tabindex="${tab===kind?0:-1}" aria-label="Pet ${kind}">${ns.LettersRoomArt.tab(kind)}</button>`).join('')}
            </div>
            <div class="wardrobe-panel" id="wardrobe-panel" role="tabpanel" aria-labelledby="wardrobe-tab-${tab}">
              ${tab==='tricks' ? `<div class="pet-trick-stage lg-panel" aria-label="Pet tricks">${PET_TRICKS.map(tr=>{const known=this.petTricks().includes(tr.id);return `<button type="button" class="pet-trick${known?'':' is-seed'}" data-trick="${tr.id}" aria-label="${known?tr.name:'A trick still growing'}">${ns.LettersRoomArt.trick(known?tr.id:'seed')}</button>`;}).join('')}</div>` : tab==='colors' ? `<div class="pet-color-rack lg-panel" aria-label="Pet color"><div class="pet-color-options">${petHues.map(h=>`<button type="button" class="pet-color-swatch${this.pet.hue===h?' is-picked':''}" data-pet-hue="${h}" aria-pressed="${this.pet.hue===h}" style="--h:${h}" aria-label="${petHueNames[h]}"></button>`).join('')}</div></div>` : `<button type="button" class="wardrobe-prev" aria-label="Previous ${tab}">${Art.icon('next',22)}</button><div class="pet-shelf ${tab==='friends'?'pet-bodies':''} lg-panel">${tab==='friends'?bodyShelf:shelf}</div><button type="button" class="wardrobe-more" aria-label="More ${tab}">${Art.icon('next',22)}</button>`}
            </div>
          </div>
        </div>`,
      );
      el.dataset.wardrobeTab=tab;
      this.wireTopBar(el);
      const tabs=[...el.querySelectorAll('[data-wardrobe-tab]')];
      tabs.forEach((button,index)=>{
        button.onclick=()=>{if(!el.isConnected)return;this.wardrobeTab=button.dataset.wardrobeTab;this.quietPetRender=true;this.renderPet();};
        button.onkeydown=e=>{if(!el.isConnected)return;const next=e.key==='ArrowRight'?(index+1)%4:e.key==='ArrowLeft'?(index+3)%4:e.key==='Home'?0:e.key==='End'?3:null;if(next===null)return;e.preventDefault();this.wardrobeTab=tabs[next].dataset.wardrobeTab;this.renderPet();this.root.querySelector('[role="tab"][aria-selected="true"]')?.focus();};
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
          if(!el.isConnected)return;
          this.pet.hue = Number(swatch.dataset.petHue);
          this.saveJSON("quran-trainer:letters:pet", this.pet);
          this.sound.play("click");
          this.renderPet();
        });
      }
      const bubble = el.querySelector(".pet-bubble");
      const roomPet = this.petLife(el.querySelector(".pet-big"), el);
      if (changedOutfit) roomPet?.cheer();
      this.wirePlayroom(el, roomPet);
      this.wireTricks(el, roomPet);
      el.querySelector(".pet-big").addEventListener("click", () => {
        if(!el.isConnected)return;
        roomPet?.wave();
        this.sound.voice?.(this.pet?.species);
        bubble.hidden = false;
        this.petRecite(bubble);
        el.querySelector(".pet-big").classList.remove("is-hop");
        void el.querySelector(".pet-big").offsetWidth;
        el.querySelector(".pet-big").classList.add("is-hop");
      });
      for (const btn of el.querySelectorAll(".pet-acc[data-body]")) {
        btn.addEventListener("click", () => {
          if(!el.isConnected)return;
          const id = btn.dataset.body;
          const body = ns.LETTERS_BODIES.find((b) => b.id === id);
          const bodies = this.pet.bodies || (this.pet.bodies = ["blob"]);
          // Free friends (Lumi, Mina, Rafi) are everyone's from the start.
          // spendStars(0) deliberately refuses, so free ones must not go through
          // it — that refusal was why they shook and could never be chosen.
          if (!bodies.includes(id) && body.cost === 0) bodies.push(id);
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
          if(!el.isConnected)return;
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
          this.sound.play(at >= 0 ? "rustle" : "tryon");
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

    renderAlbum(justOpened = null, { from = null } = {}) {
      const owned = new Set(this.stickers.owned || []);
      const grid = ns.LETTERS_STICKERS.map(
        (s) =>
          owned.has(s.id)
            ? `<button type="button" class="album-slot${justOpened === s.id ? " is-new" : ""}${TREASURY[s.id] ? " is-treasury" : ""}" data-sticker="${s.id}" aria-label="View ${s.id} sticker${TREASURY[s.id] ? ", a Quran word" : ""}">${Art.sticker({id:s.id,size:78})}${TREASURY[s.id] ? `<svg class="treasury-glint" viewBox="-10 -10 20 20" aria-hidden="true"><path d="M0-9Q0 0 9 0Q0 0 0 9Q0 0-9 0Q0 0 0-9Z" fill="#f3c955" stroke="#70501b" stroke-width="1.6"/></svg>` : ""}</button>`
            : `<span class="album-slot" role="img" aria-label="Sticker not collected">${Art.sticker({id:s.id,owned:false,size:78})}</span>`,
      ).join("");
      const allOwned = ns.LETTERS_STICKERS.every(sticker=>owned.has(sticker.id));
      const el = this.screen(
        "lg-album",
        `${this.topBar()}
        <div class="album-stage">
          <div class="album-tabs" role="tablist" aria-label="Collections"><button type="button" role="tab" aria-selected="true" class="album-tab is-on" aria-label="Stickers">${Art.icon("star", 24)}</button><button type="button" role="tab" aria-selected="false" class="album-tab" data-book="letters" aria-label="My letters">${Art.icon("book", 26)}</button>${this.shelfWords().length ? `<button type="button" role="tab" aria-selected="false" class="album-tab" data-book="words" aria-label="Quran words">${REHAL}</button>` : ""}<button type="button" role="tab" aria-selected="false" class="album-tab" data-book="sky" aria-label="Letter stars">${SKYTAB}</button></div>
          <div class="album-supply">
          <span class="lg-star-chip">${Art.icon("star", 20)} <b>${this.starBalance()}</b></span>
          ${allOwned
            ? `<div class="album-complete" role="img" aria-label="All stickers collected">${Art.icon("star", 40)}</div>`
            : `<button type="button" class="album-pack album-stand${this.stickers.freeVisits ? " is-free" : ""}" aria-label="${this.stickers.freeVisits ? "Visit the sticker stand, free" : "Visit the sticker stand for 5 stars"}" ${this.stickers.freeVisits || this.starBalance() >= 5 ? "" : "disabled"}>${ns.LettersRoomArt.stand(118)}${this.stickers.freeVisits ? `<span class="pet-acc-cost stand-gift" aria-hidden="true">${Art.icon("flower", 16)}</span>` : `<span class="pet-acc-cost">${Art.icon("star", 14)} 5</span>`}</button>`}
          </div><div class="album-grid lg-panel">${grid}</div>
        </div>`,
      );
      this.wireTopBar(el);
      const inspect = button => {
        if(!el.isConnected||el.querySelector("dialog"))return;
        const id=button.dataset.sticker;
        const dialog=document.createElement('dialog');
        dialog.className='sticker-inspect';dialog.setAttribute('aria-label',`${id} sticker`);
        const word=treasuryWord(id);
        dialog.innerHTML=`<div class="sticker-inspect-art lg-art-frame">${Art.sticker({id,size:word?220:280})}</div>${word?`<button type="button" class="treasury-plaque" aria-label="Hear ${word.display} from the Quran"><span class="treasury-word" dir="rtl" lang="ar">${word.display}</span><span class="treasury-ref" dir="rtl" lang="ar">${word.surah} ${arabicDigits(word.ayah)}</span>${Art.icon('speaker',22)}</button>`:''}<button type="button" class="lg-round-btn sticker-inspect-close" aria-label="Back to stickers">${Art.icon('check',32)}</button>`;
        el.appendChild(dialog);
        dialog.querySelector('.sticker-inspect-close').onclick=()=>dialog.close();
        // Quran Treasury (v19): this sticker's word, recited from its ayah.
        if(word){const plaque=dialog.querySelector('.treasury-plaque');plaque.onclick=()=>{plaque.classList.remove('is-heard');void plaque.offsetWidth;plaque.classList.add('is-heard');this.say(word);};setTimeout(()=>dialog.open&&this.say(word),500);}
        dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
        dialog.addEventListener('close',()=>{this.stopSpeech();dialog.remove();if(button.isConnected)button.focus();},{once:true});
        dialog.showModal();
      };
      el.querySelectorAll('[data-sticker]').forEach(button=>button.onclick=()=>inspect(button));
      el.querySelector('.album-tab[data-book="letters"]')?.addEventListener("click", () => { if (!el.isConnected) return; this.sound.play("page"); this.renderLetterBook(); });
      el.querySelector('.album-tab[data-book="words"]')?.addEventListener("click", () => { if (!el.isConnected) return; this.sound.play("page"); this.renderWordShelf(); });
      el.querySelector('.album-tab[data-book="sky"]')?.addEventListener("click", () => { if (!el.isConnected) return; this.sound.play("page"); this.renderStarChart(); });
      // A sticker just placed from the pack flies from the ceremony into its slot.
      if(justOpened){const slot=el.querySelector(`[data-sticker="${justOpened}"]`);if(slot)this.landSticker(slot,justOpened,from);}
      // Sticker stand (v5, spec 02 "earn the choice"): three stickers, face up,
      // and the child picks one. Stars are spent (or a free visit used) only
      // when a sticker is chosen; closing the stand costs nothing.
      const pack = el.querySelector(".album-stand");
      if (pack)
        pack.addEventListener("click", () => {
          if(!el.isConnected||pack.disabled)return;
          const unowned = ns.LETTERS_STICKERS.filter((s) => !owned.has(s.id));
          if (!unowned.length) return;
          if (!this.stickers.freeVisits && this.starBalance() < 5) {
            this.sound.play("wrong");
            pack.classList.remove("is-shake");
            void pack.offsetWidth;
            pack.classList.add("is-shake");
            return;
          }
          const offer = unowned.map(s => s.id).sort(() => Math.random() - 0.5).slice(0, 3);
          this.openStickerStand(el, offer);
        });
    }

    landSticker(slot, id, from) {
      slot.scrollIntoView?.({ block: "center" });
      const settle = () => { if (!slot.isConnected) return; slot.classList.remove("is-new"); void slot.offsetWidth; slot.classList.add("is-new"); this.sound.play("pop"); this.sound.play("chime"); };
      const to = slot.getBoundingClientRect?.();
      if (!from || !to?.width || this.prefersReducedMotion() || !document.body?.animate) return settle();
      const ghost = document.createElement("div");
      ghost.className = "sticker-flight";
      ghost.innerHTML = Art.sticker({ id, size: Math.round(from.width) });
      Object.assign(ghost.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
      document.body.appendChild(ghost);
      slot.style.visibility = "hidden";
      const dx = to.left + to.width / 2 - (from.left + from.width / 2), dy = to.top + to.height / 2 - (from.top + from.height / 2), k = to.width / from.width;
      const flight = ghost.animate([{ transform: "none" }, { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(${(1 + k) / 2}) rotate(-8deg)`, offset: 0.55 }, { transform: `translate(${dx}px, ${dy}px) scale(${k})` }], { duration: 760, easing: "cubic-bezier(.4,.1,.3,1)" });
      const done = () => { ghost.remove(); if (slot.isConnected) slot.style.visibility = ""; settle(); };
      flight.onfinish = done; flight.oncancel = done;
    }

    openStickerStand(el, offer) {
      const dialog = document.createElement("dialog");
      dialog.className = "sticker-stand";
      dialog.setAttribute("aria-label", "Choose a sticker");
      const free = !!this.stickers.freeVisits;
      dialog.innerHTML = `<div class="stand-roof" aria-hidden="true">${ns.LettersRoomArt.stand(90)}</div>
        <div class="stand-shelf">${offer.map(id => `<button type="button" class="stand-choice" data-sticker="${id}" aria-label="Choose the ${id} sticker">${Art.sticker({ id, size: 96 })}</button>`).join("")}</div>
        <div class="stand-price" aria-hidden="true">${free ? Art.icon("flower", 22) : `${Art.icon("star", 18)} 5`}</div>
        <span class="pack-friend" aria-hidden="true">${this.petSVG(76)}</span>
        <button type="button" class="lg-round-btn stand-close" aria-label="Leave the stand">${Art.icon("undo", 26)}</button>`;
      el.appendChild(dialog);
      let chosen = false;
      dialog.querySelectorAll(".stand-choice").forEach(button => button.addEventListener("click", () => {
        if (chosen || !el.isConnected) return;
        const id = button.dataset.sticker;
        // Pay at the moment of choosing: a free visit first, otherwise 5 stars.
        if (this.stickers.freeVisits) this.stickers.freeVisits -= 1;
        else if (!this.spendStars(5)) { this.sound.play("wrong"); return; }
        chosen = true;
        (this.stickers.owned = this.stickers.owned || []).push(id);
        this.saveJSON("quran-trainer:letters:stickers", this.stickers);
        this.sound.play("sticker");
        this.sound.voice?.(this.pet?.species);
        button.classList.add("is-chosen");
        dialog.querySelectorAll(".stand-choice").forEach(other => { if (other !== button) other.classList.add("is-passed"); });
        const from = button.querySelector("svg")?.getBoundingClientRect?.();
        setTimeout(() => { if (dialog.open) dialog.close(); dialog.remove(); this.renderAlbum(id, { from: this.prefersReducedMotion() ? null : from }); }, this.prefersReducedMotion() ? 0 : 520);
      }));
      const leave = () => { if (chosen) return; if (dialog.open) dialog.close(); dialog.remove(); };
      dialog.querySelector(".stand-close").addEventListener("click", leave);
      dialog.addEventListener("cancel", e => { e.preventDefault(); leave(); });
      dialog.showModal?.();
    }

    // Growing Friend (v4, 2026-10-01): the pet learns a trick each time one of
    // the seven letter families grows strong in the quiet strength model — a
    // family counts once ¾ of its letters reach mastery 0.6. Learning, not
    // spending, teaches it. Milestones (2, 4, 7 families) also gift an
    // accessory into the wardrobe; nothing is ever taken away.
    strongFamilies() {
      const strength = ns.LettersStrength;
      if (!strength || !ns.LETTERS_DATA) return [];
      return ns.LETTERS_DATA.packs.filter(pack => {
        const strong = pack.letters.filter(l => strength.mastery(l.char) >= 0.6).length;
        return strong >= Math.ceil(pack.letters.length * 0.75);
      }).map(pack => pack.id);
    }

    petTricks() {
      const strong = new Set(this.strongFamilies());
      return PET_TRICKS.filter(tr => strong.has(tr.family)).map(tr => tr.id);
    }

    grantTrickGifts() {
      if (!this.pet) return;
      const n = this.strongFamilies().length, owned = this.pet.accessories || (this.pet.accessories = []);
      let gave = false;
      for (const [at, id] of TRICK_GIFTS) if (n >= at && !owned.includes(id)) { owned.push(id); gave = true; }
      if (gave) this.saveJSON("quran-trainer:letters:pet", this.pet);
    }

    performTrick(el, id, rig) {
      const pet = el.querySelector(".pet-big");
      if (!pet) return;
      pet.classList.remove(...PET_TRICKS.map(tr => `does-${tr.id}`));
      void pet.offsetWidth;
      if (!this.prefersReducedMotion()) pet.classList.add(`does-${id}`);
      this.sound.voice?.(this.pet?.species);
      this.sound.play({ spin: "glow", hop: "boing", sway: "tryon", sing: "chime", stretch: "creak", juggle: "pop", roll: "thud" }[id] || "glow");
      const room = el.querySelector(".pet-diorama");
      if (room && (id === "sing" || id === "juggle")) {
        const fx = document.createElement("span");
        fx.className = `trick-fx is-${id}`;
        fx.setAttribute("aria-hidden", "true");
        fx.innerHTML = id === "sing" ? "<i></i><i></i><i></i>" : "<b></b><b></b><b></b>";
        room.appendChild(fx);
        setTimeout(() => fx.remove(), 1700);
      }
      rig?.cheer?.();
    }

    wireTricks(el, rig) {
      const known = this.petTricks();
      el.querySelectorAll(".pet-trick").forEach(button => button.addEventListener("click", () => {
        if (!el.isConnected) return;
        if (button.classList.contains("is-seed")) { rig?.ponder?.(); return; }
        this.performTrick(el, button.dataset.trick, rig);
      }));
      // A trick learned since last time is shown off once, unasked.
      const seen = this.loadJSON("quran-trainer:letters:tricks-seen", []);
      const fresh = known.find(id => !seen.includes(id));
      if (fresh) {
        this.saveJSON("quran-trainer:letters:tricks-seen", [...seen, fresh]);
        setTimeout(() => { if (!el.isConnected) return; el.querySelector(".pet-big")?.classList.add("is-new-trick"); this.performTrick(el, fresh, rig); this.confettiAt(el.querySelector(".pet-big"), true); }, 700);
      }
    }

    // Playroom (2026-10-01): three toys in the pet's room. Tapping one plays
    // with the pet — a rolled ball, a drum (three quick beats and the pet
    // dances), bubbles to pop. No stars, no needs, nothing to keep up.
    wirePlayroom(el, rig) {
      const reduced = this.prefersReducedMotion();
      const pet = el.querySelector(".pet-big");
      const hop = () => { if (!pet) return; pet.classList.remove("is-hop"); void pet.offsetWidth; pet.classList.add("is-hop"); };
      const replay = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };
      const ball = el.querySelector(".room-ball");
      ball?.addEventListener("click", () => {
        if (!el.isConnected) return;
        replay(ball, "is-rolling");
        this.sound.play("boing");
        rig?.inspect?.(ball, 900, () => { hop(); this.sound.voice?.(this.pet?.species); });
      });
      const drum = el.querySelector(".room-drum");
      let beats = [];
      drum?.addEventListener("click", () => {
        if (!el.isConnected) return;
        replay(drum, "is-beat");
        this.sound.play("drum");
        const now = performance.now();
        beats = [...beats.filter(t => now - t < 1800), now];
        if (beats.length >= 3) { beats = []; replay(pet, "is-dancing"); rig?.cheer?.(); this.sound.voice?.(this.pet?.species); }
        else hop();
      });
      const wand = el.querySelector(".room-wand"), room = el.querySelector(".pet-diorama");
      wand?.addEventListener("click", () => {
        if (!el.isConnected || !room) return;
        this.sound.play("glow");
        room.querySelectorAll(".room-bubble").forEach(b => b.remove());
        rig?.ponder?.();
        for (let i = 0; i < 5; i += 1) {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "room-bubble";
          b.setAttribute("aria-label", "Pop the bubble");
          b.innerHTML = ns.LettersRoomArt.toys.bubble;
          b.style.left = `${14 + i * 15 + Math.random() * 6}%`;
          b.style.animationDelay = `${i * 0.22}s`;
          b.style.setProperty("--sway", `${(i % 2 ? 1 : -1) * (8 + Math.random() * 10)}px`);
          b.addEventListener("click", () => { if (b.classList.contains("is-popped")) return; b.classList.add("is-popped"); this.sound.play("pop"); hop(); setTimeout(() => b.remove(), 260); });
          room.appendChild(b);
          setTimeout(() => b.isConnected && b.remove(), reduced ? 3000 : 5200 + i * 220);
        }
      });
    }

    // My letters (2026-10-01): every letter the child has met, as little garden
    // signs grouped by the land they were met in. Tap one to hear it. Lands not
    // reached yet are unopened seed packets — nothing ahead is revealed.
    renderLetterBook() {
      const worlds = this.worlds.worlds;
      const lands = [];
      for (const world of worlds) {
        const land = world.biome || "meadow";
        let group = lands[lands.length - 1];
        if (!group || group.land !== land) lands.push(group = { land, worlds: [] });
        group.worlds.push(world);
      }
      const sign = (land) => land === "meadow"
        ? `<svg viewBox="-14 -14 28 28" aria-hidden="true">${[0, 72, 144, 216, 288].map(a => `<ellipse cy="-6" rx="4" ry="6" transform="rotate(${a})" fill="#ffa798" stroke="#4a3620" stroke-width="1.6"/>`).join("")}<circle r="3.6" fill="#f3c955" stroke="#4a3620" stroke-width="1.6"/></svg>`
        : `<svg viewBox="-14 -14 28 28" aria-hidden="true">${ns.LettersMapArt?.LAND_SIGNS?.[land] || ""}</svg>`;
      const items = [];
      const sections = lands.map((group, g) => {
        const met = group.worlds.filter(w => this.statusOf(w) !== "locked");
        if (!met.length) return `<section class="book-land is-unopened" data-land="${group.land}"><span class="book-land-sign">${sign(group.land)}</span><span class="book-seed" role="img" aria-label="Not opened yet">${ns.LettersRoomArt.pack(54)}</span></section>`;
        const signs = met.flatMap(w => (w.meet || []).map(card => {
          const i = items.push(card) - 1;
          const latin = !/[؀-ۿ]/.test(card.display);
          // Letter Friends (v26): a letter with a friend shows the friend,
          // fading to the bare letter as the Brain sees it is known.
          const F = ns.LetterFriends;
          if (F?.FRIENDS?.[card.display]) return `<button type="button" class="book-letter is-friend" data-item="${i}" aria-label="${card.display}: ${F.get(card.display).en}">${F.art(card.display, { size: 76, mode: F.look(ns.gardenBrain?.skills(card.display).friend) })}</button>`;
          return `<button type="button" class="book-letter" data-item="${i}" aria-label="Hear ${card.display}">${(Art.letterSign || Art.blobCard)({ hue: w.hue, label: card.display, latin, size: 76 })}</button>`;
        })).join("");
        const plant = this.masteryPlant(Math.max(...met.map(w => this.worldMasteryOf(w))));
        return `<section class="book-land" data-land="${group.land}"><header class="book-land-head"><span class="book-land-sign">${sign(group.land)}</span><span class="book-land-plant" aria-hidden="true">${plant}</span></header><div class="book-letters">${signs}</div></section>`;
      }).join("");
      const el = this.screen(
        "lg-album lg-letter-book",
        `${this.topBar()}
        <div class="album-stage">
          <div class="album-tabs" role="tablist" aria-label="Collections"><button type="button" role="tab" aria-selected="false" class="album-tab" data-book="stickers" aria-label="Stickers">${Art.icon("star", 24)}</button><button type="button" role="tab" aria-selected="true" class="album-tab is-on" aria-label="My letters">${Art.icon("book", 26)}</button>${this.shelfWords().length ? `<button type="button" role="tab" aria-selected="false" class="album-tab" data-book="words" aria-label="Quran words">${REHAL}</button>` : ""}<button type="button" role="tab" aria-selected="false" class="album-tab" data-book="sky" aria-label="Letter stars">${SKYTAB}</button></div>
          <div class="book-pages lg-panel">${sections}</div>
        </div>`,
      );
      this.wireTopBar(el);
      Art.fitGlyphs?.(el);
      el.querySelector('.album-tab[data-book="stickers"]')?.addEventListener("click", () => { if (!el.isConnected) return; this.sound.play("page"); this.renderAlbum(); });
      el.querySelector('.album-tab[data-book="words"]')?.addEventListener("click", () => { if (!el.isConnected) return; this.sound.play("page"); this.renderWordShelf(); });
      el.querySelector('.album-tab[data-book="sky"]')?.addEventListener("click", () => { if (!el.isConnected) return; this.sound.play("page"); this.renderStarChart(); });
      el.querySelectorAll(".book-letter").forEach(button => button.addEventListener("click", () => {
        if (!el.isConnected) return;
        const card = items[Number(button.dataset.item)];
        // A friend opens its page in the Letter Friends book.
        if (button.classList.contains("is-friend")) {
          const pages = items.filter(c => ns.LetterFriends?.FRIENDS?.[c.display]).map(c => ({ id: c.id || c.display, display: c.display, speak: c.speak }));
          this.sound.play("page");
          this.session = { world: this.worlds.worlds.find(w => w.id === "pack-boat"), items: pages, startAt: Math.max(0, pages.findIndex(c => c.display === card.display)) };
          return this.startPractice("FriendBook", () => this.renderLetterBook());
        }
        button.classList.remove("is-said"); void button.offsetWidth; button.classList.add("is-said");
        this.say(card);
      }));
      return el;
    }

    // Quran Word Shelf (v8, 2026-10-01): real words from the short surahs that
    // the child can genuinely decode now — the same honesty filter the word
    // chapters use (every letter and mark taught by a finished chapter). Read
    // it first, then tap to hear Mishary Alafasy recite that very word.
    shelfWords() {
      const pool = this.worlds?.wordPool?.(2, 5, this.progress?.done || []) || [];
      return pool.slice(0, 30);
    }

    renderWordShelf() {
      const words = this.shelfWords();
      if (!words.length) return this.renderLetterBook();
      const byLength = new Map();
      words.forEach((w, i) => { const n = this.worlds.wordTags(w.display).wordLength; if (!byLength.has(n)) byLength.set(n, []); byLength.get(n).push([w, i]); });
      const glint = `<svg class="shelf-glint" viewBox="-10 -10 20 20" aria-hidden="true"><path d="M0-9Q0 0 9 0Q0 0 0 9Q0 0-9 0Q0 0 0-9Z" fill="#f3c955" stroke="#70501b" stroke-width="1.6"/></svg>`;
      const shelves = [...byLength.entries()].sort((a, b) => a[0] - b[0]).map(([n, list]) => `<section class="shelf-row" data-length="${n}"><div class="shelf-words">${list.map(([w, i]) => `<button type="button" class="shelf-word" data-word="${i}" aria-label="Hear ${w.display}" dir="rtl" lang="ar">${glint}<span>${w.display}</span></button>`).join("")}</div><i class="shelf-board" aria-hidden="true"></i></section>`).join("");
      const el = this.screen(
        "lg-album lg-word-shelf",
        `${this.topBar()}
        <div class="album-stage">
          <div class="album-tabs" role="tablist" aria-label="Collections"><button type="button" role="tab" aria-selected="false" class="album-tab" data-book="stickers" aria-label="Stickers">${Art.icon("star", 24)}</button><button type="button" role="tab" aria-selected="false" class="album-tab" data-book="letters" aria-label="My letters">${Art.icon("book", 26)}</button><button type="button" role="tab" aria-selected="true" class="album-tab is-on" aria-label="Quran words">${REHAL}</button><button type="button" role="tab" aria-selected="false" class="album-tab" data-book="sky" aria-label="Letter stars">${SKYTAB}</button></div>
          ${this.ayahGardenOpen() ? `<div class="ayah-doors" role="group" aria-label="Surahs">${this.ayahSurahs().map(s => `<button type="button" class="ayah-door" data-surah="${s.number}" aria-label="Surah ${s.name}" dir="rtl" lang="ar">${s.name}</button>`).join("")}</div>` : ""}
          <div class="shelf-case lg-panel">${shelves}</div>
        </div>`,
      );
      this.wireTopBar(el);
      el.querySelector('.album-tab[data-book="stickers"]')?.addEventListener("click", () => { if (!el.isConnected) return; this.sound.play("page"); this.renderAlbum(); });
      el.querySelector('.album-tab[data-book="letters"]')?.addEventListener("click", () => { if (!el.isConnected) return; this.sound.play("page"); this.renderLetterBook(); });
      el.querySelector('.album-tab[data-book="sky"]')?.addEventListener("click", () => { if (!el.isConnected) return; this.sound.play("page"); this.renderStarChart(); });
      el.querySelectorAll(".ayah-door").forEach(button => button.addEventListener("click", () => { if (!el.isConnected) return; this.sound.play("page"); this.renderAyahGarden(Number(button.dataset.surah)); }));
      el.querySelectorAll(".shelf-word").forEach(button => button.addEventListener("click", () => {
        if (!el.isConnected) return;
        const word = words[Number(button.dataset.word)];
        button.classList.remove("is-heard"); void button.offsetWidth; button.classList.add("is-heard");
        this.say(word);
      }));
      return el;
    }

    // Letter Constellations (v16, 2026-10-02): the night sky as a progress
    // map. Seven constellations, one per letter family. A letter held well is
    // a gold star wearing its letter; one met and still settling is a dim
    // star; one not met yet is a faint dot. Lines join a family once it is
    // met, and turn gold when the family is strong (the trick rule).
    renderStarChart() {
      const strength = ns.LettersStrength;
      const packs = ns.LETTERS_DATA?.packs || [];
      const strong = new Set(this.strongFamilies());
      const centers = [[150, 150], [450, 160], [300, 330], [140, 500], [460, 500], [170, 760], [430, 780]];
      const items = [];
      const groups = packs.map((pack, k) => {
        const [cx, cy] = centers[k] || [300, 450];
        const n = pack.letters.length;
        const pts = pack.letters.map((l, i) => {
          const a = -Math.PI * 0.9 + (i / Math.max(1, n - 1)) * Math.PI * 0.9 + ((k % 2) ? 0.4 : -0.2);
          const r = 92 + ((i * 37 + k * 11) % 23);
          return [cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.75 + ((i % 2) ? 14 : -10)];
        });
        const states = pack.letters.map(l => {
          const e = strength?.map?.[l.char];
          const seen = !!(e && e.r + e.w > 0);
          return !seen ? "unseen" : strength.mastery(l.char) >= 0.7 ? "bright" : "dim";
        });
        const met = states.every(s => s !== "unseen");
        const line = met ? `<polyline points="${pts.map(p => p.map(v => v.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="${strong.has(pack.id) ? "#f3c955" : "#6064a0"}" stroke-width="${strong.has(pack.id) ? 3 : 1.6}" stroke-linecap="round" stroke-linejoin="round"${strong.has(pack.id) ? "" : ' stroke-dasharray="4 6"'}/>` : "";
        const stars = pack.letters.map((l, i) => {
          const [x, y] = pts[i], st = states[i];
          if (st === "unseen") return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.4" fill="#6064a0"/>`;
          const idx = items.push({ id: l.char, display: l.char, speak: l.arName }) - 1;
          const bright = st === "bright";
          return `<g class="chart-star${bright ? " is-bright" : ""}" data-item="${idx}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" role="button" tabindex="0" aria-label="Star ${l.char}">
            ${bright ? `<circle r="38" fill="#ffe49a" opacity=".22"/>` : ""}
            ${bright
              ? `<path d="M0-38V-26M0 26V38M-38 0H-26M26 0H38" stroke="#f3c955" stroke-width="4" stroke-linecap="round"/><circle r="24" fill="#ffe49a" stroke="#70501b" stroke-width="2.4"/>${(() => { const sh = Art.inkShift ? Art.inkShift(l.char, 34) : { dx: 0, dy: 12 }; return `<text x="${sh.dx.toFixed(1)}" y="${sh.dy.toFixed(1)}" text-anchor="middle" font-family="'Amiri Quran', serif" font-size="34" fill="#4a3620" direction="rtl">${l.char}</text>`; })()}`
              : `<path d="M0-18Q0 0 18 0Q0 0 0 18Q0 0-18 0Q0 0 0-18Z" fill="#6064a0" stroke="#4a4d84" stroke-width="1.6"/>`}</g>`;
        }).join("");
        return `<g class="chart-family" data-family="${pack.id}">${line}${stars}</g>`;
      }).join("");
      const dust = Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 137) % 600}" cy="${(i * 211) % 900}" r="${i % 3 ? 1.2 : 1.8}" fill="#fffaf0" opacity="${0.25 + (i % 4) * 0.12}"/>`).join("");
      const el = this.screen("lg-album lg-star-chart", `${this.topBar()}
        <div class="album-stage">
          <div class="album-tabs" role="tablist" aria-label="Collections"><button type="button" role="tab" aria-selected="false" class="album-tab" data-book="stickers" aria-label="Stickers">${Art.icon("star", 24)}</button><button type="button" role="tab" aria-selected="false" class="album-tab" data-book="letters" aria-label="My letters">${Art.icon("book", 26)}</button>${this.shelfWords().length ? `<button type="button" role="tab" aria-selected="false" class="album-tab" data-book="words" aria-label="Quran words">${REHAL}</button>` : ""}<button type="button" role="tab" aria-selected="true" class="album-tab is-on" aria-label="Letter stars">${SKYTAB}</button></div>
          <svg class="star-chart" viewBox="0 0 600 900" aria-label="Your letter stars"><defs><linearGradient id="chart-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#23253f"/><stop offset="1" stop-color="#34375f"/></linearGradient></defs><rect width="600" height="900" rx="28" fill="url(#chart-sky)"/>${dust}<path d="M546 56A30 30 0 1 0 552 112A23 23 0 1 1 546 56Z" fill="#e5dcc8"/>${groups}</svg>
        </div>`);
      this.wireTopBar(el);
      el.querySelector('.album-tab[data-book="stickers"]')?.addEventListener("click", () => { if (!el.isConnected) return; this.sound.play("page"); this.renderAlbum(); });
      el.querySelector('.album-tab[data-book="letters"]')?.addEventListener("click", () => { if (!el.isConnected) return; this.sound.play("page"); this.renderLetterBook(); });
      el.querySelector('.album-tab[data-book="words"]')?.addEventListener("click", () => { if (!el.isConnected) return; this.sound.play("page"); this.renderWordShelf(); });
      el.querySelectorAll(".chart-star").forEach(star => {
        const go = () => { if (!el.isConnected) return; star.classList.remove("is-twinkle"); void star.getBoundingClientRect(); star.classList.add("is-twinkle"); this.say(items[Number(star.dataset.item)]); };
        star.addEventListener("click", go);
        star.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      });
      return el;
    }

    // Ayah Garden (v15, 2026-10-02): follow-along reading of the short surahs,
    // opened once the first word chapter is done. Words sit as big tiles in
    // reading order; play recites the ayah word by word (Alafasy) and lights
    // each word as it is heard; any word can be tapped alone.
    ayahGardenOpen() { return (this.progress?.done || []).includes("words-2") && this.ayahSurahs().length > 0; }
    ayahSurahs() {
      const order = [1, 112, 113, 114, 111, 110, 109, 108, 107, 106, 105];
      return order.map(n => this.worlds?.surahs?.get(n)).filter(Boolean);
    }

    renderAyahGarden(number, ayahIndex = 0) {
      const surah = this.worlds?.surahs?.get(number);
      if (!surah) return this.renderWordShelf();
      const ayah = surah.ayahs[Math.max(0, Math.min(ayahIndex, surah.ayahs.length - 1))];
      const index = surah.ayahs.indexOf(ayah);
      const el = this.screen("lg-album lg-ayah-garden", `${this.topBar()}
        <div class="ayah-stage">
          <div class="ayah-title" dir="rtl" lang="ar">${surah.name}</div>
          <div class="ayah-dots" aria-hidden="true">${surah.ayahs.map((_, i) => `<i class="${i === index ? "is-on" : i < index ? "is-done" : ""}"></i>`).join("")}</div>
          <div class="ayah-words lg-panel" dir="rtl" lang="ar">${ayah.words.map((w, i) => `<button type="button" class="ayah-word" data-word="${i}" aria-label="Hear ${w.arabic}">${w.arabic}</button>`).join("")}</div>
          <div class="ayah-controls">
            <button type="button" class="lg-round-btn ayah-prev" aria-label="Previous ayah" ${index === 0 ? "disabled" : ""}>${Art.icon("next", 26)}</button>
            <button type="button" class="lg-big-btn ayah-play" aria-label="Recite this ayah">${Art.icon("play", 40)}</button>
            <button type="button" class="lg-round-btn ayah-next" aria-label="Next ayah" ${index === surah.ayahs.length - 1 ? "disabled" : ""}>${Art.icon("next", 26)}</button>
          </div>
          <span class="ayah-friend" aria-hidden="true">${this.petSVG(80)}</span>
        </div>`);
      this.wireTopBar(el, () => this.renderWordShelf());
      const words = [...el.querySelectorAll(".ayah-word")];
      let token = 0;
      const light = i => words.forEach((w, k) => { w.classList.toggle("is-reading", k === i); w.classList.toggle("is-read", k < i); });
      const playFrom = (i, mine) => {
        if (!el.isConnected || mine !== token) return;
        if (i >= ayah.words.length) { light(ayah.words.length); this.sound.play("chime"); return; }
        light(i);
        this.say({ display: ayah.words[i].arabic, speak: ayah.words[i].arabic, audioPath: ayah.words[i].audioPath }, () => setTimeout(() => playFrom(i + 1, mine), 220));
      };
      el.querySelector(".ayah-play").onclick = () => { token += 1; playFrom(0, token); };
      words.forEach((button, i) => button.onclick = () => { token += 1; light(-1); button.classList.add("is-reading"); this.say({ display: ayah.words[i].arabic, speak: ayah.words[i].arabic, audioPath: ayah.words[i].audioPath }); });
      el.querySelector(".ayah-prev").onclick = () => { this.stopSpeech(); this.renderAyahGarden(number, index - 1); };
      el.querySelector(".ayah-next").onclick = () => { this.stopSpeech(); this.renderAyahGarden(number, index + 1); };
      Art.fitGlyphs?.(el);
      return el;
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
      // Real Recitation (v14): a real Quran word carries its word-by-word clip;
      // play Mishary Alafasy reciting it rather than a speech engine reading
      // it. Offline or on any failure the same request falls back to the
      // garden's voice, so a learning prompt never stalls.
      if (item.audioPath && this.sound.enabled && ns.RecitationAudio && navigator.onLine !== false) return this.recite(item, onEnd);
      // Keep names/diacritics from the curriculum, including word displays.
      // The local bank matches the exact teaching request, including diacritics.
      return this.speak(item.speak || item.display, onEnd);
    }

    recite(item, onEnd) {
      this.stopSpeech();
      const turn = this.speechTurn;
      const text = item.speak || item.display;
      let settled = false, started = false;
      const done = (ok) => {
        if (settled || turn !== this.speechTurn) return;
        settled = true;
        this.utterance = null;
        this.sound.setSpeaking?.(false);
        if (ok) onEnd?.(turn);
      };
      const job = { onstart: () => { if (!settled && turn === this.speechTurn) this.sound.setSpeaking?.(true); }, onend: () => done(true), onerror: () => done(false) };
      this.utterance = job;
      this.sound.setSpeaking?.(true);
      this.recitation ||= new ns.RecitationAudio(() => this.sound.enabled);
      const r = this.recitation;
      if (!r.el) { r.el = new Audio(); r.el.preload = "auto"; }
      // Fall back to the garden's voice on the SAME job, so callers' hooks hold.
      const fallback = () => {
        if (settled || turn !== this.speechTurn || started) return;
        started = true;
        try { r.el.pause(); } catch {}
        if (!(this.voice?.play(text, job, () => this.startNativeSpeech(text, job)) || this.startNativeSpeech(text, job))) job.onerror();
      };
      r.el.onplaying = () => { started = true; job.onstart?.(); };
      r.el.onended = () => { if (turn === this.speechTurn) job.onend?.(); };
      r.el.onerror = fallback;
      // A clip that never starts (blocked, slow network) hands over quickly.
      setTimeout(() => { if (!started) fallback(); }, 2500);
      r.playWord(item.audioPath);
      return job;
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
      try { this.recitation?.stop(); } catch {}
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
      if (!el?.isConnected || this.prefersReducedMotion() || this.gentle) return;
      const rect = el.getBoundingClientRect();
      Art.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, golden, golden ? null : this.activityMaterial());
    }

    // The material a right answer is made of: a craft chapter's own material
    // first (garland petals, harvest seeds, jar glints, raft wood), otherwise
    // the activity's (pond water, basket seeds, building wood…).
    activityMaterial() {
      const journey = ns.LettersJourney?.forWorld?.(this.session?.world);
      const craft = journey?.craft && { garland: "petals", harvest: "seeds", jars: "glints", raft: "wood" }[journey.kind];
      if (craft) return craft;
      return { pop: "water", catch: "seeds", feed: "seeds", build: "wood", chain: "wood", unfuse: "wood", blend: "glints", fuse: "glints", burst: "glints", trace: "glints", pairs: "petals", parade: "petals" }[this.currentActivity] || "petals";
    }

    // ---------- chrome ----------

    screen(className, inner) {
      this.screenListeners?.abort();
      this.screenListeners = typeof AbortController === 'function' ? new AbortController() : null;
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
      this.currentActivity = className === "lg-play" ? activity : null;
      if (this.currentActivity) ns.LettersAnalytics?.activity(this.currentActivity);
      this.root.classList.toggle("lg-boat-chapter", garden);
      this.root.classList.toggle("lg-reference-journey", garden);
      this.root.classList.toggle("lg-boat-adventure", this.isBoatAdventure() && ["lg-meet", "lg-play", "lg-stars", "lg-party"].includes(className));
      this.root.classList.toggle("lg-reduce-motion", !!this.reduceMotion);
      document.body.classList.toggle("lg-reduce-motion", !!this.reduceMotion);
      document.body.classList.toggle("lg-calm-garden", garden || pond);
      this.root.dataset.gardenPhase = Art.dayPhase();
      const stage = ns.LettersGardenArt.growth(this.progress, this.bests);
      // Activities stand in their chapter's land; home, map and menus keep the meadow.
      const activityLand = ["lg-meet", "lg-play", "lg-stars", "lg-party"].includes(className) ? this.session?.world?.biome : undefined;
      // The land's quiet soundscape plays under its activities and in the
      // child's own garden; home, map and menus are silent between taps.
      // Activity boards take the land's own material (styles: --lg-board).
      if (activityLand && activityLand !== "meadow") this.root.dataset.land = activityLand; else delete this.root.dataset.land;
      this.landBed = activityLand || (className === "lg-my-garden" ? "river" : className === "lg-meet" || className === "lg-play" ? "meadow" : null);
      // Gentle mode (v17): calm senses — no land beds, no weather, no creatures.
      this.root.classList.toggle("lg-gentle", !!this.gentle);
      if (this.gentle) this.landBed = null;
      if (!document.hidden) this.sound?.setLand?.(this.landBed);
      // Today's weather sits behind the screen's content (over the map on home).
      const weather = Art.weatherFor ? Art.weatherFor() : "clear";
      this.root.dataset.weather = weather;
      this.sound?.setRain?.(weather === "drizzle" && !!this.landBed);
      this.root.innerHTML = `${garden || pond ? ns.LettersGardenArt.backdrop(stage) : Art.backdrop(undefined, activityLand)}<div class="lg-screen ${className}">${Art.weatherLayer ? Art.weatherLayer(weather) : ""}${Art.seasonLayer ? Art.seasonLayer(this.season()) : ""}${Art.yearLayer ? Art.yearLayer(Art.yearSeason(new Date(), this.loadJSON("quran-trainer:letters:hemisphere", "north") === "south")) : ""}${inner}</div>`;
      const screenEl = this.root.querySelector(".lg-screen");
      if (this.gentle && className === "lg-play") this.watchIdlePrompt(screenEl);
      return screenEl;
    }

    // Gentle mode: if no finger has touched the screen for 8 seconds, the
    // prompt says itself again (the same as tapping its replay) — twice at most.
    watchIdlePrompt(screenEl) {
      clearTimeout(this._idleTimer);
      let repeats = 0;
      const arm = () => {
        clearTimeout(this._idleTimer);
        if (repeats >= 2) return;
        this._idleTimer = setTimeout(() => {
          if (!screenEl.isConnected) return;
          const replay = screenEl.querySelector(".play-bubble, .practice-replay");
          if (replay && !replay.disabled) { repeats += 1; replay.click(); }
          arm();
        }, 8000);
      };
      screenEl.addEventListener("pointerdown", () => { repeats = 0; arm(); });
      arm();
    }

    topBar({ home = true } = {}) {
      return `
        <div class="lg-topbar">
          ${home ? `<button type="button" class="lg-round-btn lg-home-btn" aria-label="Home">${Art.icon("home", 32)}</button>` : "<span></span>"}
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
      const home = el.querySelector(".lg-home-btn");
      const leave = () => { this.sound.play("page"); onHome ? onHome() : this.renderHome(); };
      // Little Sprout: inside an activity, Home needs a short hold (a ring
      // fills) so a stray tap from a tiny hand doesn't end the game.
      const holdToLeave = this.sprout && /\blg-(play|meet|stars)\b/.test(el.className);
      if (home && holdToLeave) {
        home.classList.add("is-hold");
        let timer = null;
        const stop = () => { clearTimeout(timer); timer = null; home.classList.remove("is-holding"); };
        home.addEventListener("pointerdown", () => { stop(); home.classList.add("is-holding"); timer = setTimeout(() => { stop(); leave(); }, 800); });
        ["pointerup", "pointercancel", "pointerleave"].forEach(type => home.addEventListener(type, stop));
        home.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); leave(); } });
      } else if (home) home.addEventListener("click", leave);
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
          <div class="gu-section lg-panel gu-family">
            <h3>Children</h3>
            <p class="gu-sub">Each child keeps their own garden, pet and progress. Tap a pet to switch.</p>
            <div class="gu-family-pets">${(ns.LettersState?.profiles?.() || [{ id: "p1" }]).map((p, i) => `<button type="button" class="gu-family-pet${p.id === ns.LettersState?.activeProfile?.() ? " is-active" : ""}" data-profile="${p.id}" aria-label="Child ${i + 1}${p.id === ns.LettersState?.activeProfile?.() ? ", playing now" : ""}">${this.profilePet(p.id, 72)}</button>`).join("")}
              ${(ns.LettersState?.profiles?.() || []).length < 6 ? `<button type="button" class="gu-family-add" aria-label="Add a child">${Art.egg({ size: 56 })}<span>Add a child</span></button>` : ""}</div>
          </div>
          <div class="gu-section lg-panel gu-read-together">
            <h3>Read together</h3>
            <p class="gu-sub">Six cards, weakest first. They read each one aloud; you tap whether they read it. A few minutes, side by side.</p>
            <button type="button" class="lg-big-btn gu-read-start">Start reading together</button>
            ${(() => { const last = (this.loadJSON("quran-trainer:letters:read-aloud", []) || []).slice(-1)[0];
              return last ? `<p class="gu-read-last">Last time (${last.at}): read ${last.read.length} of ${last.read.length + last.notYet.length}${last.notYet.length ? ` — still settling: <span dir="rtl" lang="ar">${last.notYet.join(" ")}</span>` : ""}.</p>` : ""; })()}
          </div>
          <div class="gu-section lg-panel">
            <h3>Sound and motion</h3>
            <button type="button" class="lg-big-btn gu-sound-toggle">${this.sound.enabled ? "Sound is on" : "Sound is off"}</button>
            <button type="button" class="lg-big-btn gu-motion-toggle" aria-pressed="${!!this.reduceMotion}">Reduce motion</button>
            <button type="button" class="lg-big-btn gu-hemisphere-toggle" aria-pressed="${this.loadJSON("quran-trainer:letters:hemisphere", "north") === "south"}">Seasons: ${this.loadJSON("quran-trainer:letters:hemisphere", "north") === "south" ? "southern" : "northern"} hemisphere</button>
            <button type="button" class="lg-big-btn gu-sprout-toggle" aria-pressed="${!!this.sprout}">Little sprout (age 2–3)${this.sprout ? " is on" : ""}</button>
            <button type="button" class="lg-big-btn gu-gentle-toggle" aria-pressed="${!!this.gentle}">Gentle mode${this.gentle ? " is on" : ""}</button>
            <p class="gu-sub">Little sprout (this child only) turns on gentle mode, reaches further for near-miss taps, lights up the right answer after a wrong one, and needs a short hold on Home to leave an activity.</p>
            <p class="gu-sub">Gentle mode (this child only): no weather, creatures or background sounds, no timed challenge, bigger buttons, and the question repeats itself if they pause.</p>
          </div>
          <div class="gu-section lg-panel gu-privacy">
            <h3>Privacy</h3>
            <p class="gu-sub">Progress stays on this device. To learn which activities help, the garden sends anonymous counts: which games are opened, when a letter becomes strong, and roughly how many days it has been played. No names, no answers, no cookies, nothing that identifies your child.</p>
            <button type="button" class="lg-big-btn gu-analytics-toggle" aria-pressed="${!!ns.LettersAnalytics?.enabled()}">Anonymous counts ${ns.LettersAnalytics?.enabled() ? "are on" : "are off"}</button>
          </div>
        </div>`,
      );
      this.wireTopBar(el, null);
      el.querySelector(".gu-motion-toggle").addEventListener("click", () => {
        this.reduceMotion = !this.reduceMotion;
        this.saveJSON("quran-trainer:letters:reduced-motion", this.reduceMotion);
        this.renderGrownup();
      });
      el.querySelector(".gu-hemisphere-toggle")?.addEventListener("click", () => {
        const south = this.loadJSON("quran-trainer:letters:hemisphere", "north") === "south";
        this.saveJSON("quran-trainer:letters:hemisphere", south ? "north" : "south");
        this.renderGrownup();
      });
      el.querySelector(".gu-sprout-toggle")?.addEventListener("click", () => {
        this.sprout = !this.sprout;
        this.saveJSON("quran-trainer:letters:sprout", this.sprout);
        this.gentle = this.loadJSON("quran-trainer:letters:gentle", false) || this.sprout;
        this.renderGrownup();
      });
      el.querySelector(".gu-gentle-toggle")?.addEventListener("click", () => {
        if (this.sprout) return; // sprout always keeps gentle on
        this.gentle = !this.gentle;
        this.saveJSON("quran-trainer:letters:gentle", this.gentle);
        this.renderGrownup();
      });
      el.querySelector(".gu-analytics-toggle")?.addEventListener("click", () => {
        ns.LettersAnalytics?.setEnabled(!ns.LettersAnalytics.enabled());
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
      el.querySelector(".gu-read-start")?.addEventListener("click", () => { this.sound.play("page"); this.renderReadTogether(); });
      el.querySelectorAll(".gu-family-pet").forEach(button => button.addEventListener("click", () => {
        if (button.classList.contains("is-active")) return;
        this.switchProfile(button.dataset.profile);
      }));
      el.querySelector(".gu-family-add")?.addEventListener("click", () => {
        // The household's first child becomes "p1" in the list the first time a sibling is added.
        if (!(ns.LettersState.read("quran-trainer:letters:profiles", []) || []).length) ns.LettersState.write("quran-trainer:letters:profiles", [{ id: "p1" }]);
        this.switchProfile(ns.LettersState.addProfile());
      });
      const stampsLink = el.querySelector(".gu-stamps-link");
      if (stampsLink)
        stampsLink.addEventListener("click", () => {
          this.sound.play("page");
          this.renderStamps();
        });
    }

    // Garden Visitors (v12, 2026-10-02): animal stickers the child owns come to
    // their garden — flyers flutter in the sky, swimmers by the water, the rest
    // wander the grass. Up to three a day, a different few each day. Tapping
    // one makes it hop and call, and the pet comes to look. Pure play.
    addGardenVisitors(el) {
      const board = el.querySelector(".decorate-board");
      if (!board || !Art.stickerMotif) return;
      this.addSiblingPets(board);
      const owned = new Set(this.stickers?.owned || []);
      const pool = Object.keys(VISITORS).filter(id => owned.has(id));
      if (!pool.length) return;
      let h = 7;
      for (const c of todayStr()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      const today = pool.map((id, i) => [((h >>> (i % 16)) ^ (i * 2654435761)) >>> 0, id]).sort((a, b) => a[0] - b[0]).slice(0, 3).map(([, id]) => id);
      const spots = { sky: [["3%", "2%"], ["80%", "5%"]], ground: [["4%", "auto"], ["78%", "auto"]], water: [["84%", "auto"]] };
      const used = { sky: 0, ground: 0, water: 0 };
      today.forEach(id => {
        const move = VISITORS[id];
        const spot = spots[move][used[move]++ % spots[move].length];
        const b = document.createElement("button");
        b.type = "button";
        b.className = `garden-visitor is-${move}`;
        b.setAttribute("aria-label", `Visiting ${id}`);
        b.style.left = spot[0];
        if (move === "sky") b.style.top = spot[1]; else b.style.bottom = move === "water" ? "16%" : "3%";
        b.innerHTML = `<span class="visitor-walk">${Art.stickerMotif(id, 56)}</span>`;
        b.addEventListener("click", () => {
          if (!el.isConnected) return;
          b.classList.remove("is-hop"); void b.offsetWidth; b.classList.add("is-hop");
          this.sound.play({ sky: "chime", ground: "boing", water: "splash" }[move]);
          this.game?.rig?.inspect?.(b, 1100, () => this.game?.rig?.cheer?.());
        });
        board.appendChild(b);
      });
    }

    // Garden Together (v20): the hatched pets of this child's siblings.
    siblingPets() {
      const S = ns.LettersState;
      if (!S?.profiles) return [];
      const me = S.activeProfile();
      return S.profiles().filter(p => p.id !== me).map(p => S.readAs(p.id, "quran-trainer:letters:pet", null)).filter(Boolean);
    }

    startTogether() {
      const friends = this.siblingPets();
      if (!friends.length) return this.renderPracticeGarden();
      const go = (pet) => { this.partnerPet = pet; this.startPractice("GardenTogether", () => this.renderPracticeGarden()); };
      if (friends.length === 1) return go(friends[0]);
      // More than one sibling: whose pet is playing with you today?
      const el = this.screen("lg-who", `${this.topBar()}<div class="who-stage"><div class="who-pets" role="group" aria-label="Who is playing with you?">${friends.map((p, i) => `<button type="button" class="who-pet" data-friend="${i}" aria-label="Friend ${i + 1}">${Art.pet({ hue: p.hue ?? 200, species: p.species || "blob", stage: 1, worn: p.worn || [], size: 120 })}</button>`).join("")}</div></div>`);
      this.wireTopBar(el, () => this.renderPracticeGarden());
      el.querySelectorAll("[data-friend]").forEach(b => b.onclick = () => go(friends[Number(b.dataset.friend)]));
    }

    // Sibling Play Dates (v18, 2026-10-02): brothers' and sisters' hatched
    // pets come to play in this child's garden — up to two, on the grass.
    // Tap one: it hops and calls in its own voice, and this child's pet cheers.
    addSiblingPets(board) {
      const S = ns.LettersState;
      if (!S?.profiles) return;
      const me = S.activeProfile();
      const friends = S.profiles().filter(p => p.id !== me).map(p => S.readAs(p.id, "quran-trainer:letters:pet", null)).filter(Boolean).slice(0, 2);
      friends.forEach((pet, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "garden-visitor garden-sibling is-ground";
        b.setAttribute("aria-label", "A friend's pet visiting");
        b.style.left = i ? "60%" : "30%";
        b.style.bottom = "2%";
        b.innerHTML = `<span class="visitor-walk">${Art.pet({ hue: pet.hue ?? 200, species: pet.species || "blob", stage: 1, worn: pet.worn || [], size: 70 })}</span>`;
        b.addEventListener("click", () => {
          if (!board.isConnected) return;
          b.classList.remove("is-hop"); void b.offsetWidth; b.classList.add("is-hop");
          this.sound.voice?.(pet.species);
          this.game?.rig?.inspect?.(b, 1100, () => this.game?.rig?.cheer?.());
        });
        board.appendChild(b);
      });
    }

    // World Overview (v23, 2026-10-02): the six lands stacked like a fold-out
    // map — meadow at the bottom, the riverlands at the top — with a dot per
    // chapter (gold done, pulsing current), the pet where it waits, and mist
    // over lands not reached yet. Tap a land to glide there.
    openWorldOverview(el, scroll, yOf) {
      const worlds = this.worlds.worlds;
      const lands = [];
      worlds.forEach((w, i) => { const last = lands[lands.length - 1]; if (last && last.biome === w.biome) last.idx.push(i); else lands.push({ biome: w.biome, idx: [i] }); });
      const tint = { meadow: "#b7e779", orchard: "#ffe49a", lagoon: "#ccfbef", night: "#6064a0", peaks: "#e5dcc8", river: "#96ecff" };
      const sign = b => b === "meadow" ? `<g>${[0, 72, 144, 216, 288].map(a => `<ellipse cy="-6" rx="4" ry="6" transform="rotate(${a})" fill="#ffa798" stroke="#4a3620" stroke-width="1.6"/>`).join("")}<circle r="3.6" fill="#f3c955" stroke="#4a3620" stroke-width="1.6"/></g>` : (ns.LettersMapArt?.LAND_SIGNS?.[b] || "");
      const petI = Math.max(0, worlds.findIndex(w => w.id === this.mapPetWorld) >= 0 ? worlds.findIndex(w => w.id === this.mapPetWorld) : worlds.findIndex(w => this.statusOf(w) === "current"));
      const H = 110, W = 300, total = lands.length * H;
      const regions = lands.map((land, k) => {
        const y = total - (k + 1) * H;
        const reached = land.idx.some(i => this.statusOf(worlds[i]) !== "locked");
        const dots = land.idx.map((i, j) => {
          const st = this.statusOf(worlds[i]);
          const x = 70 + (j * 170 / Math.max(1, land.idx.length - 1 || 1)) * (land.idx.length > 1 ? 1 : 0) + (land.idx.length === 1 ? 85 : 0);
          const dy = y + 70 - (j % 2) * 18;
          return `${i === petI ? `<g transform="translate(${x} ${dy - 22})"><circle r="10" fill="#fffaf0" stroke="#4a3620" stroke-width="2.4"/><circle cx="-3" cy="-1" r="2" fill="#4a3620"/><circle cx="3" cy="-1" r="2" fill="#4a3620"/></g>` : ""}<circle class="wo-dot${st === "current" ? " is-current" : ""}" cx="${x}" cy="${dy}" r="${st === "current" ? 9 : 7}" fill="${st === "done" ? "#f3c955" : st === "current" ? "#ffa06e" : "#c9bda4"}" stroke="#4a3620" stroke-width="2.4"/>`;
        }).join("");
        const path = land.idx.length > 1 ? `<path d="M70 ${y + 70}H240" stroke="#fffaf0" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 10"/>` : "";
        const mist = reached ? "" : `<g><rect x="0" y="${y}" width="${W}" height="${H}" fill="#fffaf0"/>${[[60, 30], [150, 55], [235, 35]].map(([cx, cy]) => `<path d="M${cx - 40} ${y + cy + 10}Q${cx - 34} ${y + cy - 12} ${cx - 12} ${y + cy - 6}Q${cx} ${y + cy - 24} ${cx + 18} ${y + cy - 8}Q${cx + 40} ${y + cy - 10} ${cx + 40} ${y + cy + 10}Z" fill="#e5dcc8"/>`).join("")}</g>`;
        return `<g class="wo-land${reached ? "" : " is-misty"}" data-land-index="${k}" role="button" tabindex="0" aria-label="${reached ? `Go to the ${land.biome}` : "A land still in the mist"}">
          <rect x="0" y="${y}" width="${W}" height="${H}" fill="${tint[land.biome] || "#b7e779"}"/>${path}${dots}
          <g transform="translate(${W - 34} ${y + 30}) scale(1.4)">${sign(land.biome)}</g>${mist}</g>`;
      }).join("");
      const dialog = document.createElement("dialog");
      dialog.className = "world-overview";
      dialog.setAttribute("aria-label", "The whole world");
      dialog.innerHTML = `<svg class="wo-map" viewBox="0 0 ${W} ${total}" aria-hidden="false"><rect width="${W}" height="${total}" rx="18" fill="#fffaf0"/>${regions}<path d="M${W - 10} 0V${total}" stroke="#62cdf4" stroke-width="16" opacity=".6" data-ribbon/></svg><button type="button" class="lg-round-btn wo-close" aria-label="Back to the map">${Art.icon("check", 28)}</button>`;
      el.appendChild(dialog);
      const close = () => { if (dialog.open) dialog.close(); dialog.remove(); };
      dialog.querySelector(".wo-close").onclick = close;
      dialog.addEventListener("cancel", e => { e.preventDefault(); close(); });
      dialog.querySelectorAll(".wo-land:not(.is-misty)").forEach(g => {
        const go = () => {
          const land = lands[Number(g.dataset.landIndex)];
          const target = land.idx.find(i => this.statusOf(worlds[i]) === "current") ?? land.idx[0];
          close();
          this.sound.play("glow");
          scroll.scrollTo?.({ top: Math.max(0, yOf(target) - scroll.clientHeight * 0.55), behavior: this.prefersReducedMotion() ? "auto" : "smooth" });
        };
        g.addEventListener("click", go);
        g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      });
      dialog.showModal?.();
    }

    // Little Sprout (v22): light up whichever choice on the board shows the
    // target, so the very next tap succeeds. Matches on the visible text.
    glowAnswer(el, target) {
      const want = String(target.display || "").trim();
      if (!want) return;
      const choices = [...el.querySelectorAll("button, [role=button], .pop-bubble, .catch-faller")].filter(c => !c.closest(".lg-topbar, .play-bubble, .practice-replay, .learning-hint, .play-heading") && !c.matches(".play-bubble, .practice-replay") && (c.textContent || "").trim() === want);
      choices.forEach(c => { c.classList.remove("is-sprout-glow"); void c.offsetWidth; c.classList.add("is-sprout-glow"); setTimeout(() => c.classList.remove("is-sprout-glow"), 4200); });
    }

    // Sound Lab (v11): the marks a finished chapter has taught, in qaida order.
    taughtMarks() {
      const done = new Set(this.progress?.done || []);
      const marks = [];
      if (done.has("fatha")) marks.push("\u064E");
      if (done.has("kasra-damma")) marks.push("\u0650", "\u064F");
      if (done.has("tanween")) marks.push("\u064B", "\u064D", "\u064C");
      if (done.has("sukoon")) marks.push("\u0652");
      if (done.has("shaddah")) marks.push("\u0651");
      return marks;
    }

    // Moon Calendar (v10): today's season, and its once-a-year Eid gift — the
    // crescent pin, added to the wardrobe with a little show on the map.
    season() {
      if (this._seasonDay !== todayStr()) { this._seasonDay = todayStr(); this._season = Art.season ? Art.season() : null; }
      return this._season;
    }

    giveSeasonGift(el, rig) {
      const kind = this.season();
      if (!kind || !kind.startsWith("eid") || !this.pet) return;
      const year = Art.hijri?.()?.year;
      const tag = `${year}-${kind}`;
      const given = this.loadJSON("quran-trainer:letters:season-gifts", []);
      if (given.includes(tag)) return;
      this.saveJSON("quran-trainer:letters:season-gifts", [...given, tag].slice(-10));
      const owned = this.pet.accessories || (this.pet.accessories = []);
      if (!owned.includes("moonpin")) owned.push("moonpin");
      if (!(this.pet.worn || []).includes("moonpin")) (this.pet.worn = this.pet.worn || []).push("moonpin");
      this.saveJSON("quran-trainer:letters:pet", this.pet);
      setTimeout(() => {
        if (!el.isConnected) return;
        const walker = el.querySelector(".map-here");
        if (walker) walker.innerHTML = this.petSVG(64);
        this.confettiAt(walker, true);
        this.sound.play("cheer2");
        rig?.cheer?.();
      }, 900);
    }

    // Family Garden (v9, 2026-10-02): siblings each keep their own garden —
    // pet, progress, stickers, strength. Children can't read names, so each is
    // shown by their own pet (or their unhatched egg). Switching reloads, so
    // every system starts clean on the chosen child's data.
    profilePet(id, size) {
      const S = ns.LettersState, pet = S?.readAs?.(id, "quran-trainer:letters:pet", null);
      if (!pet) return Art.egg({ size: Math.round(size * 0.9) });
      return Art.pet({ hue: pet.hue ?? 200, species: pet.species || "blob", stage: 1, worn: pet.worn || [], size });
    }

    switchProfile(id) {
      try { sessionStorage.setItem("lg-profile-chosen", "1"); } catch {}
      ns.LettersState?.setActive?.(id);
      this.stopSpeech?.();
      this.sound?.setLand?.(null);
      setTimeout(() => location.reload(), 120);
    }

    renderWhoIsPlaying() {
      const list = ns.LettersState.profiles();
      const el = this.screen("lg-who", `<div class="who-stage">
          <div class="who-pets" role="group" aria-label="Who is playing?">${list.map((p, i) => `<button type="button" class="who-pet" data-profile="${p.id}" aria-label="Child ${i + 1}">${this.profilePet(p.id, 120)}</button>`).join("")}</div>
        </div>`);
      el.querySelectorAll(".who-pet").forEach(button => button.addEventListener("click", () => {
        if (!el.isConnected) return;
        button.classList.add("is-picked");
        this.sound.play("chime");
        this.switchProfile(button.dataset.profile);
      }));
      return el;
    }

    // Read Together (v7, 2026-10-01). Spec 02's proof that the garden works is
    // the child reading fresh letters to a grown-up outside the app; this makes
    // that ritual a guided few minutes. Six cards from what has been taught,
    // weakest first. The child reads aloud; the grown-up taps "read it" or "not
    // yet" (and can play the sound to check). Results are the grown-up's: kept
    // apart from the quiet strength model and shown back in this corner.
    readTogetherItems() {
      const done = new Set(this.progress.done || []);
      const seen = new Map();
      for (const world of this.worlds.worlds) {
        if (!done.has(world.id)) continue;
        for (const item of world.items() || []) if (item?.id && item.display && !seen.has(item.id)) seen.set(item.id, item);
      }
      let items = [...seen.values()];
      if (!items.length) items = this.petKnowledge().map(l => ({ id: l.char, display: l.char, speak: l.arName }));
      const strength = ns.LettersStrength;
      return strength?.weakest ? strength.weakest(items, 6) : items.slice(0, 6);
    }

    renderReadTogether() {
      const cards = this.readTogetherItems();
      if (!cards.length) return this.renderGrownup();
      const results = { read: [], notYet: [] };
      let i = 0;
      const el = this.screen("lg-grownup lg-read-together", `${this.topBar({ home: true })}
        <div class="rt-stage">
          <div class="rt-dots" aria-hidden="true">${cards.map(() => "<i></i>").join("")}</div>
          <div class="rt-card" role="img"></div>
          <div class="rt-controls">
            <button type="button" class="rt-hear" aria-label="Hear it">${Art.icon("speaker", 30)}<span>Hear it</span></button>
            <button type="button" class="rt-not-yet" aria-label="Not yet">${ns.LettersRoomArt.trick("seed")}<span>Not yet</span></button>
            <button type="button" class="rt-read" aria-label="They read it">${Art.icon("check", 34)}<span>Read it</span></button>
          </div>
          <span class="rt-friend" aria-hidden="true">${this.petSVG(96)}</span>
        </div>`);
      this.wireTopBar(el, () => this.renderGrownup());
      const card = el.querySelector(".rt-card"), dots = [...el.querySelectorAll(".rt-dots i")];
      const rig = this.petLife(el.querySelector(".rt-friend"), el);
      const show = () => {
        const item = cards[i];
        const latin = !/[؀-ۿ]/.test(item.display);
        card.innerHTML = (Art.letterSign || Art.blobCard)({ hue: 150, label: item.display, latin, size: 260 });
        card.setAttribute("aria-label", `Read this: ${item.display}`);
        Art.fitGlyphs?.(el);
        dots.forEach((d, k) => d.className = k < i ? "is-done" : k === i ? "is-on" : "");
      };
      const mark = (ok) => {
        const item = cards[i];
        (ok ? results.read : results.notYet).push(item.display);
        if (ok) { this.sound.play("chime"); rig?.cheer?.(); } else { this.sound.play("rustle"); }
        i += 1;
        if (i < cards.length) return show();
        const history = this.loadJSON("quran-trainer:letters:read-aloud", []) || [];
        history.push({ at: todayStr(), read: results.read, notYet: results.notYet });
        this.saveJSON("quran-trainer:letters:read-aloud", history.slice(-20));
        el.querySelector(".rt-stage").innerHTML = `<div class="rt-done lg-panel">
          <div class="rt-done-art" aria-hidden="true">${this.petSVG(150, "proud")}</div>
          <p><b>${results.read.length} of ${cards.length}</b> read aloud together.</p>
          ${results.notYet.length ? `<p>Still settling: <span dir="rtl" lang="ar">${results.notYet.join(" ")}</span> — worth another look together soon.</p>` : "<p>Every card — lovely reading.</p>"}
          <button type="button" class="lg-big-btn rt-back">Back to the grown-up corner</button></div>`;
        this.sound.play("cheer2");
        this.confettiAt(el.querySelector(".rt-done-art"), true);
        el.querySelector(".rt-back").onclick = () => this.renderGrownup();
      };
      el.querySelector(".rt-hear").onclick = () => this.say(cards[i]);
      el.querySelector(".rt-read").onclick = () => mark(true);
      el.querySelector(".rt-not-yet").onclick = () => mark(false);
      show();
    }

    // ---------- home: the journey map ----------

    // Tiny biome scenery decals stamped along the trail — same tactile SVG
    // language as the rest of the garden (plum ink, candy fills, no black).
    biomeDeco(biome) {
      // A miniature habitat for the reward garden. Later regions reuse their
      // own map landmark (palette, contour and silhouette already match the
      // map), so a chapter's reward shows the place the child walked to.
      if (biome === "meadow") return ns.LettersGardenArt.flowerBed({size:76});
      const mark = ns.LettersMapArt?.landmark?.(biome, 0) || "";
      // The river landing is a jetty; give it its water so it reads alone.
      return biome === "river" ? mark.replace('aria-hidden="true">', 'aria-hidden="true"><ellipse cx="88" cy="146" rx="84" ry="16" fill="#62cdf4"/><path d="M22 144Q88 128 154 144" fill="none" stroke="#96ecff" stroke-width="4" stroke-linecap="round"/>') : mark;
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
      // Four stages, each readable on its own at map size: seed, sprout, bud,
      // flower. Same warm ink as the rest of the garden (never cold navy), all
      // standing in one soil mound so the stages read as one plant growing.
      const ink = "#4a3620";
      const mound = `<ellipse cx="24" cy="46" rx="15" ry="3.5" fill="#2f5c46" opacity="0.18"/><path d="M11 46Q13 38 24 38Q35 38 37 46Z" fill="#a89478" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
      const stem = (top) => `<path d="M24 40C24 34 23 ${top + 8} 24 ${top}" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>`;
      const leaf = (y, side) => `<path d="M24 ${y}C${24 + side * 8} ${y - 1} ${24 + side * 12} ${y - 6} ${24 + side * 13} ${y - 12}C${24 + side * 5} ${y - 12} 24 ${y - 6} 24 ${y}Z" fill="#7fce54" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>`;
      let top;
      if (m < 0.15) {
        top = `<ellipse cx="24" cy="38" rx="5" ry="6.5" fill="#c69434" stroke="${ink}" stroke-width="1.6" transform="rotate(-12 24 38)"/><path d="M24 32Q25 28 27 26" fill="none" stroke="#4e9677" stroke-width="3" stroke-linecap="round"/>`;
      } else if (m < 0.42) {
        top = `${stem(26)}${leaf(30, 1)}`;
      } else if (m < 0.72) {
        top = `${stem(18)}${leaf(34, -1)}${leaf(30, 1)}<path d="M24 6C18 10 18 18 24 20C30 18 30 10 24 6Z" fill="#ffa798" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/><path d="M19 17Q24 22 29 17" fill="none" stroke="#4e9677" stroke-width="2.4" stroke-linecap="round"/>`;
      } else {
        const petals = [0, 72, 144, 216, 288].map(a => `<ellipse cx="24" cy="7" rx="5.5" ry="7.5" fill="#ffa798" stroke="${ink}" stroke-width="1.6" transform="rotate(${a} 24 15)"/>`).join("");
        top = `${stem(20)}${leaf(34, -1)}${leaf(30, 1)}${petals}<circle cx="24" cy="15" r="4.5" fill="#f3c955" stroke="${ink}" stroke-width="1.6"/>`;
      }
      return `<svg viewBox="0 0 48 50" data-plant-stage="${m < 0.15 ? "seed" : m < 0.42 ? "sprout" : m < 0.72 ? "bud" : "flower"}">${mound}${top}</svg>`;
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
      const side = (i) => (i % 2 === 0 ? 17 : -17); // the pet waits beside its stop
      // The pet waits where the child last went; a new learner finds it at the next lesson.
      const currentI = worlds.findIndex(world => this.statusOf(world) === "current");
      const visitedI = worlds.findIndex(world => world.id === this.mapPetWorld);
      const petI = visitedI >= 0 && this.statusOf(worlds[visitedI]) !== "locked" ? visitedI : currentI;
      const el = this.screen(
        "lg-home",
        `${this.topBar({ home: false })}
        <div class="map-daily-row lg-tray" aria-label="Garden activities">
          ${(() => { const walk = this.todaysWalk(); return walk ? `<button type="button" class="map-walk${walk.done.length >= walk.stops.length ? " is-finished" : ""}" aria-label="Today's walk${walk.done.length >= walk.stops.length ? ", finished" : ""}">${WALK_BTN}<span class="walk-steps" aria-hidden="true">${walk.stops.map((_, i) => `<i class="${walk.done.includes(i) ? "is-done" : ""}"></i>`).join("")}</span></button>` : ""; })()}
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
                  ? `<span class="map-plant" data-plant-world="${world.id}" style="left:${xOf(i) + (i % 2 === 0 ? -18 : 18)}%; top:${yOf(i) + 40}px">${this.masteryPlant(this.worldMasteryOf(world))}</span>`
                  : "";
                return `
                  ${plant}
                  ${world.id === "pack-boat" ? `<button type="button" class="map-boat-landmark map-toy" data-toy="boat" aria-label="Sail the paper boat" style="left:${xOf(i) + 37}%;top:${yOf(i) - 10}px">${ns.LettersGardenArt.boat({stage: ns.LettersGardenArt.growth(this.progress, this.bests)})}${ns.LettersJourney?.memento(this.progress) || ''}</button>` : ""}
                  ${world.id === "pack-boat" ? "" : (() => {
                    const kind = ns.LettersMapArt.kind?.(world.biome, i), toy = ns.LettersMapArt.TOYS?.[kind];
                    const at = `left:${i%2===0?74:26}%; top:${yOf(i)+35}px`;
                    return toy ? `<button type="button" class="map-landmark map-toy" data-toy="${kind}" aria-label="${toy}" style="${at}">${ns.LettersMapArt.landmark(world.biome,i)}</button>`
                      : `<span class="map-landmark" aria-hidden="true" style="${at}">${ns.LettersMapArt.landmark(world.biome,i)}</span>`;
                  })()}
                  <div class="map-node" data-node-world="${world.id}" style="${at}"><button type="button" class="map-stop is-${status}" data-world="${world.id}" ${status === "current" ? 'aria-current="step"' : ""} aria-label="${world.id === 'pack-boat' ? 'Boat Letters' : world.icon}${status==='done' ? `, completed, ${this.stars[world.id]||0} of 3 stars` : status==='current' ? ', next chapter' : ', locked'}" ${status === "locked" ? "disabled" : ""}>
                    ${Art.mapStop({ hue: world.hue, label: world.icon, status, stars: this.stars[world.id] || 0, latin: !/[؀-ۿ]/.test(world.icon) })}
                  </button>${status === "done" ? (world.id !== "pack-boat" && ns.LettersJourney?.memento?.(this.progress, world)) || `<span class="map-flower-bed" aria-hidden="true">${ns.LettersGardenArt.flowerBed({size:88})}</span>` : ""}</div>
                  ${i === petI ? `<span class="map-here" data-stop="${i}" style="left:${xOf(i) + side(i)}%; top:${yOf(i)}px">${this.petSVG(64)}</span>` : ""}
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
      const placeWheel = () => {
        if (!el.isConnected) return;
        const w = pathEl.clientWidth || 430, landscapeWidth = scroll.clientWidth || w;
        const brooks = ns.LettersMapArt.brooks?.({width:landscapeWidth,pathWidth:w,stops:worlds.map((world,i)=>({y:yOf(i),biome:world.biome,left:i%2===0}))}) || [];
      pathEl.querySelector(".map-wheel")?.remove();
      if (brooks.length && ns.LettersMapArt.waterwheel) {
        const box = pathEl.getBoundingClientRect(), shift = (landscapeWidth - w) / 2;
        const size = Math.max(70, Math.min(96, window.innerWidth * .18));
        // Guard what a child sees and touches: stop buttons (with stars) and the
        // drawn part of landmarks, plants, flower beds and chapter keepsakes.
        const taken = [...pathEl.querySelectorAll(".map-stop, .map-landmark > svg, .map-boat-landmark > svg, .map-plant, .map-flower-bed, .map-journey-memento > svg, .map-picnic-memento > svg")].map((n) => {
          const r = n.getBoundingClientRect(), inset = n.classList.contains("map-stop") ? -6 : Math.min(r.width, r.height) * .18;
          return { l: r.left - box.left + inset, r: r.right - box.left - inset, t: r.top - box.top + inset, b: r.bottom - box.top - inset };
        });
        const free = (x, y) => {
          const me = { l: x - size / 2, r: x + size / 2, t: y - size * 1.08 * .85, b: y + size * 1.08 * .2 };
          if (me.l < 4 || me.r > w + size * .25) return false;
          return !taken.some((o) => me.l < o.r && o.l < me.r && me.t < o.b && o.t < me.b);
        };
        let spot = null;
        for (const b of brooks) {
          // Try the river mouth first, where the brook has fallen to its lowest.
          for (const f of [.96, 1.04, .9]) for (const dy of [0, -8, 8, -16]) {
            const x = b.x0 + (b.x1 - b.x0) * f - shift, y = (b.y2 ?? b.y) + dy;
            if (!spot && free(x, y)) spot = { x, y };
          }
          if (spot) break;
        }
        if (spot) pathEl.insertAdjacentHTML("beforeend", `<button type="button" class="map-landmark map-toy map-wheel" data-toy="waterwheel" aria-label="${ns.LettersMapArt.TOYS.waterwheel}" style="left:${spot.x.toFixed(1)}px;top:${spot.y.toFixed(1)}px;width:${size.toFixed(0)}px">${ns.LettersMapArt.waterwheel()}</button>`);
      }
      };
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
        <path d="${d}" fill="none" stroke="#c9bda4" stroke-width="17" stroke-linecap="round" data-ribbon opacity="0.8"/>
        <path d="${d}" fill="none" stroke="#fffaf0" stroke-width="13" stroke-linecap="round" data-ribbon/>
        <path d="${d}" fill="none" stroke="#7fce54" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 22"/>`;
      // Bridges carry the trail over each brook; the waterwheel finds a free bank.
      const brooks = ns.LettersMapArt.brooks?.({width:landscapeWidth,pathWidth:w,stops:worlds.map((world,i)=>({y:yOf(i),biome:world.biome,left:i%2===0}))}) || [];
      const line = trail.querySelector("path");
      if (brooks.length && line?.getTotalLength && ns.LettersMapArt.bridge) {
        const total = line.getTotalLength();
        const atY = (y) => { let lo = 0, hi = total; for (let k = 0; k < 24; k += 1) { const m = (lo + hi) / 2; if (line.getPointAtLength(m).y > y) lo = m; else hi = m; } return (lo + hi) / 2; };
        trail.insertAdjacentHTML("beforeend", brooks.map((b) => {
          const L = atY(b.y), p = line.getPointAtLength(L), a = line.getPointAtLength(Math.max(0, L - 6)), c = line.getPointAtLength(Math.min(total, L + 6));
          return `<g class="map-bridge" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${(Math.atan2(c.y - a.y, c.x - a.x) * 180 / Math.PI).toFixed(1)})">${ns.LettersMapArt.bridge()}</g>`;
        }).join(""));
      }
      // Land gates stand just past each boundary bridge, inside the new land.
      if (line?.getTotalLength && ns.LettersMapArt.gate) {
        const total = line.getTotalLength();
        const atY = (y) => { let lo = 0, hi = total; for (let k = 0; k < 24; k += 1) { const m = (lo + hi) / 2; if (line.getPointAtLength(m).y > y) lo = m; else hi = m; } return (lo + hi) / 2; };
        const gates = [];
        for (let i = 0; i < worlds.length - 1; i += 1) {
          const land = worlds[i + 1].biome;
          if (!land || land === worlds[i].biome) continue;
          const brook = brooks.find(b => b.y < yOf(i) && b.y > yOf(i + 1));
          // The pole stands on the far bank beside the bridge, on the side away
          // from the next stop, with its banner hanging over the trail.
          const by = brook ? brook.y : (yOf(i) + yOf(i + 1)) / 2;
          const p = line.getPointAtLength(atY(by - 12));
          const side = (w * xOf(i + 1)) / 100 < p.x ? 1 : -1;
          const reached = this.statusOf(worlds[i + 1]) !== "locked";
          const open = reached && this.landsSeen.includes(land);
          gates.push(`<g class="map-gate-at${reached && !open ? " is-arriving-next" : ""}" data-gate-land="${land}" transform="translate(${(p.x + side * 50).toFixed(1)} ${p.y.toFixed(1)})">${ns.LettersMapArt.gate(land, open, -side)}</g>`);
        }
        trail.insertAdjacentHTML("beforeend", gates.join(""));
      }
      // Seat the waterwheel once layout has settled (after paint and fonts).
      const settle = () => typeof requestAnimationFrame === 'function' ? requestAnimationFrame(() => requestAnimationFrame(placeWheel)) : setTimeout(placeWheel, 0);
      settle(); setTimeout(() => el.isConnected && placeWheel(), 400); document.fonts?.ready?.then(() => el.isConnected && placeWheel());
      };
      drawTrail();
      if(typeof ResizeObserver!=='undefined'){
        const observer=new ResizeObserver(drawTrail);observer.observe(pathEl);observer.observe(scroll);
        this.stopMapResize=()=>observer.disconnect();
      }else{
        window.addEventListener('resize',drawTrail);
        this.stopMapResize=()=>window.removeEventListener('resize',drawTrail);
      }
      const walker = el.querySelector(".map-here");
      const mapRig = this.petLife(walker, el);
      // Travel (update 2): the pet walks the real trail to a tapped chapter, then
      // enters. Tapping where the pet already is, or the same stop again while it
      // walks, enters at once. Reduced motion enters without the walk.
      let travel = null;
      const enter = (world) => {
        if (!el.isConnected) return;
        if (travel?.frame) cancelAnimationFrame(travel.frame);
        travel = null; mapRig?.walk(0);
        if (this.mapPetWorld !== world.id) this.saveJSON("quran-trainer:letters:map-pet", world.id);
        this.mapPetWorld = world.id;
        this.sound.play("click");
        this.startWorld(world);
      };
      const trailPath = () => trail.querySelector("path");
      const lengthAtY = (path, y) => {
        let lo = 0, hi = path.getTotalLength();
        for (let k = 0; k < 24; k += 1) { const mid = (lo + hi) / 2; if (path.getPointAtLength(mid).y > y) lo = mid; else hi = mid; }
        return (lo + hi) / 2;
      };
      const walkTo = (world, i, { stay = false } = {}) => {
        const path = trailPath(), w = pathEl.clientWidth || 430;
        if (!walker || !path?.getTotalLength || this.prefersReducedMotion()) return enter(world);
        const from = travel ? { L: travel.L, off: travel.off } : (() => {
          const at = Number(walker.dataset.stop);
          const start = Math.abs(i - at) > 2 ? i + (i > at ? -2 : 2) : at; // long trips start nearby
          if (start !== at) walker.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
          return { L: lengthAtY(path, yOf(start)), off: (w * side(start)) / 100 };
        })();
        if (travel?.frame) cancelAnimationFrame(travel.frame);
        const L1 = lengthAtY(path, yOf(i)), off1 = (w * side(i)) / 100;
        const dur = Math.max(900, Math.min(2200, 300 + Math.abs(L1 - from.L) * 2.2));
        const t0 = performance.now();
        travel = { world, L: from.L, off: from.off, frame: null };
        this.sound.play("seed");
        let lastX = null;
        const step = (now) => {
          if (!el.isConnected || !travel || travel.world !== world) return;
          const p = Math.min(1, (now - t0) / dur), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          const L = from.L + (L1 - from.L) * e, pt = path.getPointAtLength(L);
          const off = e < .2 ? from.off * (1 - e / .2) : e > .8 ? off1 * ((e - .8) / .2) : 0;
          const x = pt.x + off;
          if (lastX != null && Math.abs(x - lastX) > .4) { const dir = Math.sign(x - lastX); walker.style.setProperty("--face", dir); mapRig?.walk(dir); }
          lastX = x; travel.L = L; travel.off = off;
          walker.style.left = `${x}px`; walker.style.top = `${pt.y}px`;
          if (p < 1) { travel.frame = requestAnimationFrame(step); return; }
          walker.dataset.stop = String(i); walker.style.removeProperty("--face");
          mapRig?.walk(0); this.sound.play("drop");
          travel.frame = null;
          // A welcome walk settles beside the stop instead of entering it.
          setTimeout(() => { if (travel?.world !== world) return; if (!stay) return enter(world); travel = null; this.mapPetWorld = world.id; this.saveJSON("quran-trainer:letters:map-pet", world.id); }, 220);
        };
        travel.frame = requestAnimationFrame(step);
        // Keep the walker in view on long trips.
        const scroller = el.querySelector(".map-scroll");
        if (scroller) scroller.scrollTo?.({ top: Math.max(0, yOf(i) - scroller.clientHeight * .55), behavior: "smooth" });
      };
      worlds.forEach((world, i) => {
        const btn = el.querySelector(`.map-stop[data-world="${world.id}"]`);
        btn?.addEventListener("click", () => {
          if (!el.isConnected) return;
          if (this.statusOf(world) === "locked") { mapRig?.inspect(btn, 500, () => mapRig.ponder()); return; }
          if (travel?.world === world || (!travel && Number(walker?.dataset.stop) === i)) return enter(world);
          walkTo(world, i);
        });
      });
      // Back on the map (2026-10-01): after a chapter is finished the map shows
      // it happen — the keepsake drops onto the stop, its plant grows, the next
      // stop opens and the pet walks there. Then any new land arrives.
      const welcome = this.mapWelcome;
      this.mapWelcome = null;
      this.giveSeasonGift(el, mapRig);
      // World Overview (v23): the whole world on one fold-out page.
      if (typeof el.insertAdjacentHTML === "function") el.insertAdjacentHTML("beforeend", `<button type="button" class="map-world-btn" aria-label="See the whole world">${WORLD_BTN}</button>`);
      const worldBtn = el.querySelector?.(".map-world-btn");
      if (worldBtn) worldBtn.onclick = () => { if (el.isConnected) { this.sound.play("page"); this.openWorldOverview(el, scroll, yOf); } };
      if (welcome) this.playMapWelcome(el, scroll, { welcome, worlds, yOf, walkTo, rig: mapRig, then: () => this.arriveInLand(el, scroll, mapRig) });
      else this.arriveInLand(el, scroll, mapRig);
      // The Story of the Garden (v30): the friends' garden, colour returning to
      // finished lands, and one story moment per visit (graduation, a land's
      // homecoming, or the wind story the first time).
      try { this.storyOnMap?.(el, { worlds, yOf, gap: GAP, welcome: !!welcome }); } catch {}
      // Landmark toys: shake a tree, lift a leaf, light a lantern, sail the boat.
      const sailBoat = (button) => {
        const boat = button.querySelector("svg");
        if (!boat || button.dataset.playing) return false;
        button.dataset.playing = "1";
        if (!this.prefersReducedMotion()) boat.animate?.([
          { transform: "translate(0,0) rotate(0)" }, { transform: "translate(18%,-4%) rotate(-4deg)", offset: .3 },
          { transform: "translate(34%,-2%) rotate(3deg)", offset: .55 }, { transform: "translate(14%,-3%) rotate(-2deg)", offset: .8 },
          { transform: "translate(0,0) rotate(0)" }], { duration: 2600, easing: "ease-in-out" });
        setTimeout(() => { delete button.dataset.playing; }, 2700);
        return true;
      };
      pathEl.addEventListener("click", (event) => {
        const toy = event.target?.closest?.(".map-toy");
        if (!toy || !el.isConnected) return;
        const played = toy.dataset.toy === "boat" ? sailBoat(toy)
          : ns.LettersMapArt.play(toy, toy.dataset.toy, { reduced: this.prefersReducedMotion(), onLand: () => this.sound.play("thud") });
        if (!played) return;
        this.sound.play({ orchard: "rustle", reeds: "ripple", lantern: "glow", waterwheel: "splash", boat: "splash", basket: "rustle" }[toy.dataset.toy] || "seed");
        mapRig?.inspect(toy, 1400, () => mapRig.cheer());
      });
      el.querySelector(".map-walk")?.addEventListener("click", () => { if (!el.isConnected) return; this.sound.play("page"); this.renderWalk(); });
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
      this.sceneRig(el.querySelector(".map-pet"));
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

    // Every chapter with a connected adventure (update 3) shares the reference
    // presentation Boat and ح established: round progress and garden layout.
    // Later-chapter projects are presentation only: their Pop and Catch keep
    // the moving play those chapters were tuned with.
    isReferenceJourney(world = this.session?.world) {
      const journey = ns.LettersJourney?.forWorld(world);
      return world?.id === 'pack-boat' || world?.id === 'pack-smile' || (!!journey && !journey.craft);
    }

    isBoatAdventure() {
      const s = this.session;
      return !!s && !s.daily && !s.checkup && !s.plan && !!ns.LettersJourney?.forWorld(s.world);
    }

    adventureScene(completed, interactivePet = false) {
      if (!this.isBoatAdventure()) return '';
      return ns.LettersJourney.scene({ completed, interactivePet, items: this.session.items,
        kind: ns.LettersJourney.forWorld(this.session.world)?.kind,
        drawings: this.session.journeyDrawings,
        pet: this.petSVG(150, completed === 3 ? 'delighted' : 'proud'),
        growth: ns.LettersGardenArt.growth(this.progress, this.bests) });
    }

    // The pet follows whatever the child presses on this screen (outside the
    // pet itself) until release. Listeners end with the screen.
    petLife(host, scope) {
      const rig = this.sceneRig(host);
      if (!rig || !scope) return rig;
      const signal = this.screenListeners?.signal;
      let holding = false, touched = null, touchedAt = 0, reactedAt = 0, reactedKind = null;
      const pick = event => {
        const item = event.target?.closest?.('button,[role="button"]');
        return item && !host.contains(item) && scope.contains(item) ? item : null;
      };
      scope.addEventListener('pointerdown', event => {
        const item = pick(event);
        if (!item) return;
        holding = true; touched = item; touchedAt = Date.now(); rig.watch(item); rig.reach(item);
      }, { capture: true, signal });
      scope.addEventListener('click', event => {
        const item = pick(event);
        if (item) { touched = item; touchedAt = Date.now(); }
      }, { capture: true, signal });
      // Same answer reaction as activities: only the child's own pick is looked at.
      rig.react = outcome => {
        const now = Date.now();
        if (typeof outcome?.correct !== 'boolean' || now - touchedAt > 2500) return;
        if (now - reactedAt < 600 && reactedKind === outcome.correct) return;
        reactedAt = now; reactedKind = outcome.correct;
        const mine = touched?.isConnected ? touched : null;
        if (outcome.correct) rig.cheer(() => mine?.isConnected && rig.inspect(mine, 1200));
        else if (mine) rig.inspect(mine, 450, () => rig.ponder());
        else rig.ponder();
      };
      const letGo = () => { if (holding) { holding = false; rig.settle(); } };
      window.addEventListener('pointerup', letGo, { signal });
      window.addEventListener('pointercancel', letGo, { signal });
      return rig;
    }

    // Companion life outside activities (meet, stars, party).
    // The rig stops itself when its screen is replaced.
    sceneRig(host) {
      if (!host || !ns.LettersPetRig) return null;
      return ns.LettersPetRig.attach(host, { reducedMotion: () => this.prefersReducedMotion() });
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
    // Land beds stop while the page is hidden and resume where they were.
    watchLandVisibility() {
      if (this._landVisibility) return;
      this._landVisibility = () => this.sound.setLand?.(document.hidden ? null : this.landBed);
      document.addEventListener("visibilitychange", this._landVisibility);
    }

    playMapWelcome(el, scroll, { welcome, worlds, yOf, walkTo, rig, then }) {
      const doneI = worlds.findIndex(w => w.id === welcome.world);
      if (doneI < 0) return then();
      const nextI = worlds.findIndex(w => this.statusOf(w) === "current");
      const reduced = this.prefersReducedMotion();
      const at = (ms, fn) => setTimeout(() => { if (el.isConnected) fn(); }, reduced ? 0 : ms);
      scroll.scrollTo?.({ top: Math.max(0, yOf(doneI) - scroll.clientHeight * 0.55), behavior: reduced ? "auto" : "smooth" });
      const node = el.querySelector(`.map-node[data-node-world="${welcome.world}"]`);
      at(650, () => {
        const keepsake = node?.querySelector(".map-journey-memento, .map-picnic-memento, .map-flower-bed");
        keepsake?.classList.add("is-landing");
        this.sound.play("thud");
        if (keepsake) this.confettiAt(keepsake);
      });
      at(1350, () => {
        el.querySelector(`.map-plant[data-plant-world="${welcome.world}"]`)?.classList.add("is-growing");
        this.sound.play("glow");
      });
      at(2100, () => {
        const next = nextI >= 0 ? el.querySelector(`.map-stop[data-world="${worlds[nextI].id}"]`) : null;
        next?.classList.add("is-opening");
        this.sound.play("pop");
        this.sound.play("chime");
        if (next && !reduced && nextI !== doneI) {
          walkTo(worlds[nextI], nextI, { stay: true });
          setTimeout(() => el.isConnected && then(), 2600);
        } else {
          rig?.cheer?.();
          then();
        }
      });
    }

    // Land arrival (2026-10-01): the first time a new land opens, the map
    // glides to its gate, the banner unfurls with the land's chord, and the pet
    // turns to look. Once per land; reduced motion unfurls without the glide.
    arriveInLand(el, scroll, rig) {
      const next = el.querySelector(".map-gate-at.is-arriving-next");
      if (!next) return;
      const land = next.dataset.gateLand;
      this.landsSeen = [...new Set([...(this.landsSeen || []), land])];
      this.saveJSON("quran-trainer:letters:lands-seen", this.landsSeen);
      const reduced = this.prefersReducedMotion();
      setTimeout(() => {
        if (!el.isConnected) return;
        const r = next.getBoundingClientRect?.(), s = scroll.getBoundingClientRect?.();
        if (r && s && scroll.scrollTo) scroll.scrollTo({ top: scroll.scrollTop + r.top - s.top - s.height * 0.45, behavior: reduced ? "auto" : "smooth" });
        setTimeout(() => {
          if (!el.isConnected) return;
          next.querySelector(".map-gate")?.classList.add("is-open", "is-arriving");
          this.sound.play("biomeArrival");
          setTimeout(() => this.sound.play("chime"), 380);
          rig?.inspect?.(next, 1600, () => rig?.cheer?.());
        }, reduced ? 0 : 900);
      }, reduced ? 0 : 700);
    }

    renderMeet() {
      const s = this.session;
      const card = s.world.meet[s.meetIndex];
      const latin = !/[؀-ۿ]/.test(card.display);
      const isReplay = this.progress.done.includes(s.world.id);
      const parts =
        !isReplay && Array.isArray(card.parts) && card.parts.length >= 2 ? card.parts : null;
      // The letter is the hero: a garden sign, inked in writing direction on reveal.
      const bigCard = (Art.letterSign || Art.blobCard)({ hue: s.world.hue, label: card.display, latin });
      const hidden = isReplay ? "" : "hidden";
      const opener = isReplay
        ? ""
        : parts
          ? `<div class="meet-make" dir="rtl">
              ${parts
                .map(
                  (p, i) => `<button type="button" class="meet-piece" aria-label="Join ${p.display}" data-i="${i}" style="--pi:${i}">
                    ${(Art.letterSign || Art.blobCard)({ hue: s.world.hue, label: p.display, latin: false })}</button>`,
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
          <div class="meet-dots meet-trail" aria-hidden="true">${s.world.meet.map((m, i) => i < s.meetIndex
            // Letters already met ride along as little seed tags; later ones stay unopened seeds.
            ? `<i class="is-met">${(() => { const lat = !/[؀-ۿ]/.test(m.display), fs = lat ? 16 : 24, sh = Art.inkShift ? Art.inkShift(m.display, fs, lat) : { dx: 0, dy: 0 };
                return `<svg viewBox="0 0 36 30" width="36" height="30" aria-hidden="true"><text x="${(18 + sh.dx).toFixed(1)}" y="${(15 + sh.dy).toFixed(1)}" text-anchor="middle" font-family="${lat ? "ui-rounded, system-ui, sans-serif" : "'Amiri Quran', serif"}" font-size="${fs}" fill="#4a3620" ${lat ? "" : 'direction="rtl"'}>${m.display}</text></svg>`; })()}</i>`
            : `<i class="${i === s.meetIndex ? "is-on" : ""}"></i>`).join("")}</div>
          <div class="meet-nav">
            <button type="button" class="lg-round-btn meet-hear adventure-companion" aria-label="Hear the letter again" ${hidden}>${this.petSVG(66)}<span>${Art.icon('speaker',20)}</span></button>
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
        // Letter Friends (v26): after the letter speaks, its friend arrives —
        // wearing the letter as its body — calls once and says its name.
        const F = ns.LetterFriends, char = card.display;
        if (F?.FRIENDS?.[char] && typeof el.querySelector(".meet-display")?.insertAdjacentHTML === "function") setTimeout(() => {
          if (!el.isConnected || el.querySelector(".meet-friend")) return;
          el.querySelector(".meet-display").insertAdjacentHTML("beforeend", `<button type="button" class="meet-friend" aria-label="${F.get(char).en}">${F.art(char, { size: 104, mode: "plain" })}</button>`);
          const btn = el.querySelector(".meet-friend"), grow = () => { const svg = btn.querySelector("svg.lf"); svg?.classList.remove("is-plain"); svg?.classList.add("is-growing"); };
          const greet = () => { if (!el.isConnected) return; grow(); setTimeout(() => { if (!el.isConnected) return; this.sound.play(F.get(char).call); setTimeout(() => el.isConnected && this.say(F.item(char)), 520); }, 380); };
          btn.addEventListener("click", greet);
          setTimeout(greet, 260);
        }, 2300);
      };
      const companion = this.sceneRig(el.querySelector('.adventure-companion'));
      cardEl.addEventListener("click", () => companion?.inspect(cardEl, 1200));
      el.querySelector('.meet-hear')?.addEventListener('click', () => companion?.inspect(cardEl, 1200));
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
          <button type="button" class="play-pet" aria-label="Listen to your pet" ${gameName === 'feed' ? 'hidden' : ''}>${this.petSVG(64)}</button>
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
      // The participating pet (update 1): every activity, every chapter.
      let rig = null;
      const petRig = () => {
        if (!ns.LettersPetRig || !el.isConnected) return null;
        const host = gameName === 'feed' ? el.querySelector('.feed-creature') : petEl;
        if (!rig?.alive && host) rig = ns.LettersPetRig.attach(host, { reducedMotion: () => this.prefersReducedMotion() });
        return rig;
      };
      const pet = ns.LettersPetRig ? {
        watch: target => petRig()?.watch(target), reach: target => petRig()?.reach(target),
        settle: () => petRig()?.settle(), cheer: next => petRig()?.cheer(next),
        inspect: (target, ms, next) => petRig()?.inspect(target, ms, next),
        ponder: next => petRig()?.ponder(next), wave: next => petRig()?.wave(next),
      } : null;
      // Whatever the child presses or drags, the pet follows. Only the child's
      // own touch picks the target, so the pet can never point at an answer.
      let touched = null, touchedAt = 0, holding = false;
      const touchable = target => target?.closest?.('button,[role="button"]');
      stage.addEventListener('pointerdown', event => {
        const item = touchable(event.target);
        if (!item || !stage.contains(item)) return;
        touched = item; touchedAt = Date.now(); holding = true;
        pet?.watch(item); pet?.reach(item);
      }, true);
      stage.addEventListener('click', event => {
        const item = touchable(event.target);
        if (item && stage.contains(item)) { touched = item; touchedAt = Date.now(); }
      }, true);
      const letGo = () => { if (holding) { holding = false; pet?.settle(); } };
      window.addEventListener('pointerup', letGo);
      window.addEventListener('pointercancel', letGo);
      // Answers drive the pet through the learning report every game already
      // sends. Pond, Trace and Feed choreograph their own moments instead.
      const ownChoreography = ['pop', 'trace', 'feed'].includes(gameName);
      let reactedAt = 0, reactedKind = null;
      const reactToOutcome = outcome => {
        const now = Date.now();
        // Burst is timed: the pet stays a quiet watcher so it never competes with the clock.
        if (!pet || ownChoreography || gameName === 'burst' || typeof outcome?.correct !== 'boolean') return;
        // Batch reports repeat one verdict; a quick fix after a miss still celebrates.
        if (now - touchedAt > 2500 || (now - reactedAt < 600 && reactedKind === outcome.correct)) return;
        reactedAt = now; reactedKind = outcome.correct;
        const pick = touched?.isConnected ? touched : null;
        if (outcome.correct) pet.cheer(() => pick?.isConnected && pet.inspect(pick, 1200));
        else if (pick) pet.inspect(pick, 450, () => pet.ponder());
        else pet.ponder();
      };
      this.stopJourneyPose = () => {
        clearTimeout(poseTimer); rig?.destroy(); rig = null;
        window.removeEventListener('pointerup', letGo); window.removeEventListener('pointercancel', letGo);
      };
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
        const friend = gameName === 'feed' ? el.querySelector('.feed-creature') : petEl;
        if (!friend?.isConnected) return;
        friend.dataset.pose = pose;
        friend.innerHTML = this.petSVG(gameName === 'feed' ? 180 : 64, petMood(pose));
        if (poseTimer) clearTimeout(poseTimer);
        poseLockedUntil = lock ? Date.now() + hold : 0;
        if (hold > 0) {
          poseTimer = setTimeout(() => {
            if (!friend.isConnected) return;
            poseLockedUntil = 0;
            friend.dataset.pose = 'presenting';
            friend.innerHTML = this.petSVG(gameName === 'feed' ? 180 : 64, petMood(currentTarget ? "presenting" : "idle"));
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
        pet?.wave();
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
        Art.fitInlineGlyphs?.(el);
      };
      help.onclick = () => {revealPrompt(true);sayWithPose(currentTarget);};
      this.onLearningSoundChange = () => {if (!this.sound.enabled) revealPrompt(presentation.hidden);};
      const firstAttempt = !(this.bests[`${s.world.id}:${gameName}`] > 0) && !s.daily && !s.checkup;
      const ctx = {
        stage,
        adventure,
        petReact: pose => {if(adventure || gameName === 'feed' || gameName === 'pop')setPetPose(pose, 850, pose === 'proud');},
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
            // Keep the newest few so they can become garden signs after a reload.
            const kept = { ...(this.savedDrawings || {}) };
            delete kept[item.display];
            kept[item.display] = s.journeyDrawings[item.display];
            this.savedDrawings = Object.fromEntries(Object.entries(kept).slice(-8));
            this.saveJSON("quran-trainer:letters:drawings", this.savedDrawings);
          } catch { /* A thumbnail must never block drawing completion. */ }
        },
        onPetTap: () => {setPetPose('listening', 900); pet?.wave(); if(currentTarget)sayWithPose(currentTarget);},
        pet,
        garden: ["picnic", "parcel"].includes(ns.LettersJourney?.forWorld(s.world)?.kind) || this.isGentleDaily(),
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
        petHue: this.pet?.hue ?? 200,
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
          reactToOutcome(outcome);
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
          // Little Sprout: errorless — the right answer glows right away.
          if (this.sprout && target) this.glowAnswer(el, target);
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
            // The material answers too, softly under the melody.
            const cue = { water: "ripple", wood: "dock", seeds: "thud", glints: "clink" }[this.activityMaterial()];
            if (cue) this.sound.play(cue);
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
          if(meta.promptMode!=='explore')learning?.beginPrompt(item,{skill,activity:gameName,choiceIds:meta.choiceIds || []});
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
            // Use the same bounded live ink as the answer cards, including
            // vowel marks and descenders; no HTML baseline translation.
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

    // ---------- the Garden Brain's day: Today's Walk (v25) ----------

    // Every letter met in a finished chapter, as speakable items.
    knownItems() {
      return this.petKnowledge().map(letter=>({id:letter.char,display:letter.char,speak:letter.arName,objective:'letter-name'}));
    }

    // The walk is planned once a day per child and kept, so re-drawing the
    // map never reshuffles it. A new day (or a newly finished chapter that
    // changes what the child knows) plans afresh.
    todaysWalk() {
      if(!ns.gardenBrain||!ns.LETTERS_DATA?.packs)return null;
      const known=this.petKnowledge().map(l=>l.char);
      if(!known.length)return null;
      const today=todayStr();
      const saved=this.loadJSON(WALK_KEY,null);
      if(saved&&saved.date===today&&saved.known===known.length&&Array.isArray(saved.stops)&&saved.stops.length)return saved;
      const plan=ns.gardenBrain.planWalk({known,sprout:!!this.sprout,marks:this.taughtMarks(),date:today,
        profile:ns.LettersState?.activeProfile?.()||'p1',huntable:known.length>=3});
      if(!plan)return null;
      const walk={date:today,known:known.length,stops:plan.stops,done:[],stamped:false};
      this.saveJSON(WALK_KEY,walk);
      return walk;
    }

    renderWalk() {
      const walk=this.todaysWalk();
      if(!walk)return this.renderHome();
      this.session=null;
      const n=walk.stops.length, finished=walk.done.length>=n;
      const next=walk.stops.findIndex((_,i)=>!walk.done.includes(i));
      // Stones run right to left, the way an Arabic page turns, and end at
      // the pet's nap spot.
      // Upright screens walk top to bottom instead, zig-zagging down the page.
      const upright=(window.innerWidth||800)<(window.innerHeight||600)*1.05;
      const pos=i=>upright?{x:i%2?28:72,y:9+i*(72/Math.max(1,n-1))}:{x:88-i*(70/Math.max(1,n-1)),y:i%2?34:68};
      const nap=upright?{x:n%2?28:72,y:95}:{x:7,y:46};
      const pts=[...walk.stops.map((_,i)=>pos(i)),nap];
      const d=pts.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join('');
      const petAt=finished?nap:pos(next<0?0:next);
      const el=this.screen('lg-walk',`${this.topBar()}<div class="walk-stage">
        <div class="walk-trail${upright?' is-upright':''}">
          <svg class="walk-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="none" stroke="#e5dcc8" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" data-ribbon/><path d="${d}" fill="none" stroke="#c9bda4" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>
          ${walk.stops.map((stop,i)=>{const p=pos(i),done=walk.done.includes(i);
            return `<button type="button" class="walk-stone${done?' is-done':''}${i===next?' is-next':''}" data-stop="${i}" style="left:${p.x}%;top:${p.y}%" aria-label="Walk stop ${i+1} of ${n}${done?', done':i===next?', next':''}">${stop.kind==='LetterDelivery'?ns.LetterDelivery.icon(90):ns.LettersGardenArt.practicePicture(stop.kind,{petArt:stop.kind==='Feed'?this.petSVG(100):''})}${done?`<span class="walk-check">${Art.icon('check',20)}</span>`:''}</button>`;}).join('')}
          <span class="walk-end" style="left:${nap.x}%;top:${nap.y}%" aria-hidden="true">${ns.LettersRoomArt?.cushion?.()||`<svg viewBox="0 0 80 40"><ellipse cx="40" cy="26" rx="36" ry="12" fill="#ffa798" stroke="#4a3620" stroke-width="3"/><ellipse cx="40" cy="22" rx="24" ry="6" fill="#ee806f"/></svg>`}</span>
          <span class="walk-pet${finished?' walk-nap':''}" style="left:${petAt.x}%;top:${petAt.y}%">${this.petSVG(finished?70:64,finished?'sleepy':undefined)}${finished?'<span class="walk-zz" aria-hidden="true">z z</span>':''}</span>
        </div>
      </div>`);
      this.wireTopBar(el);
      el.querySelectorAll('.walk-stone').forEach(b=>b.addEventListener('click',()=>{if(el.isConnected){this.sound.play('click');this.startWalkStop(Number(b.dataset.stop));}}));
      if(finished&&!walk.stamped){
        // A finished walk earns the day's stamp — the calendar ritual the game
        // already has — and nothing else: no new currency, no streak.
        walk.stamped=true;this.saveJSON(WALK_KEY,walk);
        this.stampToday?.();
        this.sound.play('cheer2');
        this.confettiAt(el.querySelector('.walk-pet'));
      }
      return el;
    }

    startWalkStop(i) {
      const walk=this.todaysWalk(), stop=walk?.stops?.[i];
      if(!stop)return this.renderWalk();
      const byChar=new Map(this.knownItems().map(item=>[item.display,item]));
      let items=(stop.letters||[]).map(c=>byChar.get(c)).filter(Boolean);
      // Choice games need at least three letters on the board; borrow
      // familiar ones rather than show the same letter twice.
      if(items.length<3)for(const item of byChar.values()){if(items.length>=3)break;if(!items.includes(item))items.push(item);}
      if(!items.length)return this.renderWalk();
      const world=this.worlds.worlds.find(w=>w.id==='pack-boat');
      this.session={world,items,startAt:0,walkStop:i,bookId:stop.kind==='LivingBook'?'night':undefined};
      const started=Date.now();
      // A stop counts as walked when it is played — finished, or simply given
      // a fair go. Leaving early is always fine; it just stays open.
      const leave=completed=>{
        const w=this.todaysWalk();
        if(w&&(completed||Date.now()-started>=20000)&&!w.done.includes(i)){w.done=[...w.done,i];this.saveJSON(WALK_KEY,w);}
        this.renderWalk();
      };
      this.startPractice(stop.kind,()=>leave(false),()=>leave(true));
    }

    // Living Books (v29): a word can be read by this child when every letter
    // is in a finished chapter and every mark has been taught — the same
    // honesty filter the word chapters use.
    canDecode(word) {
      const w=String(word||'').replace(/[؟?.!،,]/g,'').normalize('NFC');
      if(!w||!this.worlds?.wordTags)return false;
      const tags=this.worlds.wordTags(w);
      const done=this.progress?.done||[];
      const known=new Set(this.petKnowledge().map(l=>l.char));
      const letters=[...w.replace(/[ً-ْٰٓ-ٟؐ-ؚۖ-ۭـ]/g,'').replace(/[أإآٱ]/g,'ا')];
      return tags.valid&&letters.length>0&&letters.every(c=>known.has(c))&&tags.prerequisiteWorldIds.every(id=>done.includes(id));
    }

    renderBookShelf() {
      const reads=this.loadJSON(BOOKS_KEY,{});
      const books=[...(ns.LivingBooks?.BOOKS||[])].sort((a,b)=>(reads[b.id]||0)-(reads[a.id]||0));
      const F=ns.LetterFriends;
      const el=this.screen('lg-meet lg-book-shelf',`${this.topBar()}<div class="lb-shelf">${books.map(b=>`<button type="button" class="lb-spine" data-book="${b.id}" aria-label="Read ${b.title}"><span class="lb-spine-art">${F?.art(b.cover,{size:110})||''}</span><span class="lb-spine-title" dir="rtl">${b.title}</span>${(reads[b.id]||0)>=3?`<span class="lb-fav" aria-hidden="true">${Art.icon('star',20)}</span>`:''}</button>`).join('')}</div>`);
      this.wireTopBar(el,()=>this.renderBookCorner());
      Art.fitGlyphs?.(el);
      el.querySelectorAll('[data-book]').forEach(b=>b.onclick=()=>{
        this.session={world:this.worlds.worlds.find(w=>w.id==='pack-boat'),items:this.knownItems(),bookId:b.dataset.book};
        this.sound.play('page');
        this.startPractice('LivingBook',()=>this.renderBookShelf());
      });
      return el;
    }

    // The Puzzle Tree (v31): four thinking games from Big Brain Academy.
    renderPuzzleTree() {
      const n=this.petKnowledge().length;
      const P=ns.PuzzleGames, known=this.petKnowledge().map(l=>l.char);
      const kinds=[['EchoParade',2,'Echo parade: hear the friends, tap them in order'],
        ['DotsLast',2,'Dots last: which letter is it?'],['LetterTrain',2,'Letter train: pop the balloons in alphabet order'],
        ['SameLetter',2,'Same letter: find the one that tumbled'],
        // v32: two more from Big Brain Academy.
        ['LanternHunt',2,'Lantern hunt: find the letters in the dark'],['LetterShadows',2,'Letter shadows: whose shadow is it?'],
        // v34: the Letter Workshop.
        ['BuildLetter',2,'Build the letter: a body and its dots'],['FillGap',2,'Fill the gap: which letter starts the word?']]
        .filter(([kind,min])=>n>=min&&(kind!=='DotsLast'||known.some(c=>P?.siblings(c,known).length&&P.dotsOf(c).length)));
      if(!kinds.length)return this.renderPracticeGarden();
      const el=this.screen('lg-meet lg-puzzle-tree',`${this.topBar()}<div class="practice-garden-hub"><div class="practice-garden-choices">${kinds.map(([kind,,label])=>`<button type="button" data-kind="${kind}" aria-label="${label}">${ns.LettersGardenArt.practicePicture(kind)}<span class="practice-play" aria-hidden="true">${Art.icon('next',24)}</span></button>`).join('')}</div></div>`);
      this.wireTopBar(el,()=>this.renderPracticeGarden());
      el.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{
        this.session={world:this.worlds.worlds.find(w=>w.id==='pack-boat'),items:this.knownItems()};
        this.startPractice(b.dataset.kind,()=>this.renderPuzzleTree());
      });
      return el;
    }

    // The Book Corner (v27): every picture-book game on one shelf.
    renderBookCorner() {
      const n=this.petKnowledge().length;
      const kinds=[['FriendBook',1,'The Letter Friends book'],['FriendFind',2,'Find my friend'],['PeekFlaps',2,'Peekaboo flaps'],['SoundSort',2,'Sort the pictures'],
        ['FriendShapes',2,'Friend shapes'],['HoopoeTrip',2,"The hoopoe's trip"],['BusyMarket',1,'Busy market'],['LivingBooks',0,'Living books: picture books that read with you']].filter(([,min])=>n>=min);
      if(!kinds.length)return this.renderPracticeGarden();
      const el=this.screen('lg-meet lg-book-corner',`${this.topBar()}<div class="practice-garden-hub"><div class="practice-garden-choices">${kinds.map(([kind,,label])=>`<button type="button" data-kind="${kind}" aria-label="${label}">${ns.LettersGardenArt.practicePicture(kind)}<span class="practice-play" aria-hidden="true">${Art.icon('next',24)}</span></button>`).join('')}</div></div>`);
      this.wireTopBar(el,()=>this.renderPracticeGarden());
      el.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{
        if(b.dataset.kind==='LivingBooks')return this.renderBookShelf();
        this.session={world:this.worlds.worlds.find(w=>w.id==='pack-boat'),items:this.knownItems()};
        this.startPractice(b.dataset.kind,()=>this.renderBookCorner());
      });
      return el;
    }

    renderPracticeGarden() {
      const world=this.worlds.worlds.find(w=>w.id==='pack-boat');
      const familiar=this.petKnowledge().map(letter=>({id:letter.char,display:letter.char,speak:letter.arName,objective:'letter-name'}));
      this.session={world,items:familiar.length?familiar:world.items()};
      // The Sand Table (v28) sits beside the other writing toys.
      const choices=['Feed','DotGarden','GardenPaths','SandTable','WaterGarden'];
      // Letter Balloons (v24): free play for the youngest — first for a little sprout.
      if(this.sprout)choices.unshift('LetterBalloons');else choices.push('LetterBalloons');
      // Letter Friends (v26): find a friend, and read the friends' book.
      // Letter Friends (v26) and the picture-book games (v27) live together in
      // the Book Corner; it sits second, right after feeding a friend.
      if(this.petKnowledge().length)choices.splice(1,0,'BookCorner');
      // The Puzzle Tree (v31): Big Brain Academy-style thinking games.
      if(this.petKnowledge().length>=2)choices.splice(2,0,'PuzzleTree');
      if(this.petKnowledge().length>=3)choices.push('LetterHunt');
      if(this.petKnowledge().length&&this.taughtMarks().length)choices.push('SoundLab');
      // Vowel Hats (v33): the marks as things friends wear.
      if(this.petKnowledge().length&&this.taughtMarks().length)choices.push('HatShop');
      if(this.petKnowledge().length)choices.push('LetterStudio');
      if(this.petKnowledge().length>=4&&this.siblingPets().length)choices.push('GardenTogether');
      if(this.petKnowledge().length)choices.push('LetterDelivery');
      if(this.workshopWorlds().length)choices.push('Workshop');
      if(this.worlds.dailySession(this.progress.done)&&!this.gentle)choices.push('Burst');
      // UI pass (2026-10-03): the garden had grown into one long list of
      // look-alike tiles. Now they sit in five wordless, colour-coded groups —
      // play with friends, books, puzzles, writing, explore — each with a
      // picture chip, so a child can find "the writing ones" by colour.
      const groups=[['play',['LetterBalloons','Feed','LetterDelivery','GardenTogether']],['read',['BookCorner']],['think',['PuzzleTree','Burst']],
        ['write',['SandTable','GardenPaths','DotGarden']],['explore',['HatShop','WaterGarden','LetterHunt','SoundLab','LetterStudio','Workshop']]]
        .map(([g,kinds])=>[g,kinds.filter(k=>choices.includes(k))]).filter(([,kinds])=>kinds.length);
      if(this.sprout)groups.sort((a,b)=>(b[1].includes('LetterBalloons'))-(a[1].includes('LetterBalloons')));
      const tileOf=kind=>`<button type="button" data-kind="${kind}" aria-label="${({Feed:'Feed a friend',DotGarden:'Dot Garden: place the dots',GardenPaths:'Garden Paths: draw letters',WaterGarden:'Water Garden: open the letter gates',LetterDelivery:'Letter Delivery: familiar letters',Workshop:'Word Workshop: build familiar sounds',Burst:'Optional timed letter challenge',LetterHunt:'Letter Hunt: find the letter in the picture',SoundLab:'Sound Lab: join a letter and a mark',LetterStudio:'Letter Studio: make a picture',GardenTogether:'Garden Together: play with a brother or sister',LetterBalloons:'Letter Balloons: pop and hear the letters',FriendFind:'Find my friend',FriendBook:'The Letter Friends book',BookCorner:'The Book Corner: picture-book games',SandTable:'The Sand Table: write in the sand',PuzzleTree:'The Puzzle Tree: thinking games',HatShop:'The hat shop: dress a friend in its vowel'})[kind]}">${kind==='LetterDelivery'?ns.LetterDelivery.icon(120):ns.LettersGardenArt.practicePicture(kind,{petArt:kind==='Feed'?this.petSVG(100):''})}<span class="practice-play" aria-hidden="true">${Art.icon('next',24)}</span></button>`;
      const el=this.screen('lg-meet lg-practice-garden',`${this.topBar()}<div class="practice-garden-hub">${groups.map(([g,kinds])=>`<section class="pg-group" data-group="${g}"><span class="pg-chip" aria-hidden="true">${PG_CHIPS[g]}</span><div class="practice-garden-choices">${kinds.map(tileOf).join('')}</div></section>`).join('')}</div>`);
      this.wireTopBar(el);
      el.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>b.dataset.kind==='Burst'?this.startDaily(true):b.dataset.kind==='Workshop'?this.renderWorkshop():b.dataset.kind==='GardenTogether'?this.startTogether():b.dataset.kind==='BookCorner'?this.renderBookCorner():b.dataset.kind==='PuzzleTree'?this.renderPuzzleTree():this.startPractice(b.dataset.kind,()=>this.renderPracticeGarden()));
    }

    renderDecoratingGarden() {
      this.session=null;
      const el=this.screen('lg-my-garden',`${this.topBar()}<div class="my-garden-stage"></div>`);
      this.wireTopBar(el);
      this.game=new ns.DecoratingGarden({
        stage:el.querySelector('.my-garden-stage'),layout:this.gardenLayout,
        catalog:ns.LettersDecorations.catalog(this),petArt:()=>this.petSVG(112,'proud'),petRig:host=>this.sceneRig(host),
        reducedMotion:()=>this.prefersReducedMotion(),play:name=>this.sound.play(name),
        onChange:layout=>{if(!el.isConnected)return;this.gardenLayout=layout;this.saveJSON('quran-trainer:letters:garden-layout',layout);},
        onDone:()=>{if(el.isConnected)this.renderHome();}
      });
      this.addGardenVisitors(el);
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
          <svg viewBox="0 0 140 110" aria-hidden="true"><rect x="8" y="10" width="124" height="86" rx="20" fill="#c9bda4" stroke="#a89478" stroke-width="3"/><rect x="15" y="16" width="110" height="70" rx="15" fill="#fffaf0"/>${/[؀-ۿ]/.test(world.icon)?`<text x="70" y="50" text-anchor="middle" font-family="Amiri Quran, serif" font-size="40" fill="#4a3620" data-fit-box="70,50,84,46,42">${world.icon}</text>`:`<g transform="translate(43 24)">${Art.icon('book',54)}</g>`}</svg>
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
    startPractice(kind,back,onDone) {
      if(!['Feed','Workshop','DotGarden','GardenPaths','WaterGarden','LetterDelivery','LetterHunt','SoundLab','LetterStudio','GardenTogether','LetterBalloons','FriendFind','FriendBook','PeekFlaps','SoundSort','HoopoeTrip','FriendShapes','BusyMarket','SandTable','LivingBook','EchoParade','DotsLast','LetterTrain','SameLetter','LanternHunt','LetterShadows','HatShop','BuildLetter','FillGap'].includes(kind))return back?.();
      if(kind==='LetterDelivery'){const items=this.petKnowledge().map(letter=>({id:letter.char,display:letter.char,speak:letter.arName}));if(!items.length)return back?.();this.session={world:this.worlds.worlds.find(w=>w.id==='pack-boat'),items};}
      const s=this.session;
      if(!s?.world || !(s.items||s.world.items()).length)return back?.();
      const el=this.screen('lg-play',`${this.topBar()}<div class="practice-heading">${kind==='Feed'?'':this.petSVG(76)}<button class="practice-replay" type="button" aria-label="Hear the letter again"></button></div><div class="practice-stage"></div>`);
      el.dataset.activity=kind==='Feed'?'feed':kind==='Workshop'?'build':kind==='LetterDelivery'?'delivery':kind==='DotGarden'?'dots':kind==='WaterGarden'?'water':kind==='LetterHunt'?'hunt':kind==='SoundLab'?'lab':kind==='LetterStudio'?'studio':kind==='GardenTogether'?'together':kind==='LetterBalloons'?'balloons':kind==='FriendFind'?'friend':kind==='FriendBook'?'friend-book':ns.BookGames?.KINDS?.includes(kind)?`book-${kind.toLowerCase()}`:kind==='SandTable'?'sand':kind==='LivingBook'?'living-book':ns.PuzzleGames?.KINDS?.includes(kind)||ns.ShadowGames?.KINDS?.includes(kind)||ns.WorkshopGames?.KINDS?.includes(kind)?`puzzle-${kind.toLowerCase()}`:kind==='HatShop'?'hats':'practice';
      if(kind==='LetterDelivery'||kind==='GardenTogether'||kind==='FriendBook'||kind==='LivingBook')el.querySelector('.practice-heading').hidden=true;
      if(kind==='Feed'||kind==='Workshop')el.querySelector('.practice-stage').classList.add('play-stage');
      this.wireTopBar(el,back);
      const replay=el.querySelector('.practice-replay');let current=null;
      replay.onclick=()=>{if(this.game?.replayPrompt)this.game.replayPrompt();else if(current)this.sayForLearning(current);};
      const learning=ns.LettersLearning?.LearningSession
        ? new ns.LettersLearning.LearningSession(ns.LettersStrength)
        : null;
      let friend=null;
      const ctx={stage:el.querySelector('.practice-stage'),items:s.items||s.world.items(),
        activity:kind,worldId:s.world.id,completedWorldIds:this.progress?.done || [],
        reducedMotion:()=>this.prefersReducedMotion(),petArt:()=>this.petSVG(140,'open'),
        petHue:this.pet?.hue ?? 200,
        canListen:()=>this.canSpeak(),
        prompt:item=>{current=item;
          learning?.beginPrompt(item,{activity:kind,skill:ns.LettersLearning?.skillFor(item,kind==='Workshop'?'build':kind)});
          if(kind==='Workshop' && item)replay.innerHTML=`<svg viewBox="0 0 120 80" aria-hidden="true"><text x="60" y="40" text-anchor="middle" font-family="Amiri Quran, serif" font-size="42" fill="#4a3620" data-fit-box="60,40,94,52,42">${item.display}</text></svg>`;
          else if(item)replay.textContent=item.display;else replay.innerHTML=Art.icon('speaker',32);
        },
        say:item=>{if(kind!=='Workshop')current=item;return this.sayForLearning(item);},
        reportOutcome:outcome=>{if(kind!=='Feed'&&kind!=='Burst')friend?.react?.(outcome);return learning?.report(outcome);},
        pet:{watch:t=>friend?.watch(t),reach:t=>friend?.reach(t),settle:()=>friend?.settle(),cheer:n=>friend?.cheer(n),
          inspect:(t,ms,n)=>friend?.inspect(t,ms,n),ponder:n=>friend?.ponder(n),wave:n=>friend?.wave(n)},
        correct:()=>this.sound.play('correct'),
        sfx:name=>this.sound.play(name),
        // Letter Hunt draws the child's newest land; its finds burst in petals.
        land:kind==='LetterHunt'||kind==='LetterStudio'?([...this.worlds.worlds].reverse().find(w=>this.statusOf(w)!=='locked')?.biome || 'meadow'):undefined,
        confettiAt:target=>this.confettiAt(target),
        marks:kind==='SoundLab'||kind==='HatShop'||kind==='SandTable'?this.taughtMarks():undefined,
        petA:kind==='GardenTogether'?this.petSVG(96):undefined,
        starter:kind==='LetterBalloons'?(ns.LETTERS_DATA?.packs?.[0]?.letters||[]).map(l=>({id:l.char,display:l.char,speak:l.arName})):undefined,
        petB:kind==='GardenTogether'&&this.partnerPet?Art.pet({hue:this.partnerPet.hue??200,species:this.partnerPet.species||'blob',stage:1,worn:this.partnerPet.worn||[],size:96}):undefined,
        voice:k=>this.sound.voice?.(k===0?this.pet?.species:this.partnerPet?.species),
        stickers:kind==='LetterStudio'?(this.stickers?.owned||[]).filter(id=>VISITORS[id]):undefined,
        // Letter Studio pictures hang in the garden as signs (the drawings store).
        saveDrawing:url=>{const kept={...(this.savedDrawings||{})};const n=1+Object.keys(kept).filter(k=>/^art\d$/.test(k)).length%3;delete kept[`art${n}`];kept[`art${n}`]=url;this.savedDrawings=Object.fromEntries(Object.entries(kept).slice(-8));this.saveJSON('quran-trainer:letters:drawings',this.savedDrawings);},
        // Letter Friends (v26): distractors and book pages come from every letter met.
        known:kind==='FriendFind'||kind==='FriendBook'||kind==='LivingBook'||ns.BookGames?.KINDS?.includes(kind)||ns.PuzzleGames?.KINDS?.includes(kind)||ns.ShadowGames?.KINDS?.includes(kind)||ns.WorkshopGames?.KINDS?.includes(kind)||kind==='HatShop'?this.knownItems():undefined,
        // Living Books (v29): which book, which words this child can decode,
        // and a read count so favourites come first on the shelf.
        bookId:kind==='LivingBook'?s.bookId:undefined,
        decodable:kind==='LivingBook'?word=>this.canDecode(word):undefined,
        onRead:kind==='LivingBook'?id=>{const reads={...this.loadJSON(BOOKS_KEY,{})};reads[id]=(reads[id]||0)+1;this.saveJSON(BOOKS_KEY,reads);}:undefined,
        // Picture-book games (v27) start a learning round per question without
        // showing the answer on the replay button.
        beginRound:(item,skill='friend')=>learning?.beginPrompt(item,{activity:kind,skill}),
        startAt:kind==='FriendBook'?(s.startAt||0):undefined,
        beginner:kind==='FriendFind'||kind==='SandTable'||ns.BookGames?.KINDS?.includes(kind)||ns.PuzzleGames?.KINDS?.includes(kind)||ns.ShadowGames?.KINDS?.includes(kind)||ns.WorkshopGames?.KINDS?.includes(kind)||kind==='HatShop'?!!this.sprout:undefined,
        done:()=>{if(el.isConnected)(onDone||back)();}};
      if(kind==='Feed')this.game=new ns.LettersMiniGames.feed({...ctx,garden:true,beginner:true,level:0,rounds:4,hue:150,extraItems:[],petArt:()=>this.petSVG(180),setPrompt:ctx.prompt,sfx:name=>this.sound.play(name),confettiAt:target=>this.confettiAt(target),onDone:ctx.done});
      else if(kind==='Workshop')this.game=new ns.LettersMiniGames.build({...ctx,setPrompt:ctx.prompt,sfx:name=>this.sound.play(name),confettiAt:target=>this.confettiAt(target),onDone:ctx.done});
      else if(kind==='LetterDelivery')this.game=new ns.LetterDelivery(ctx);
      else this.game=new ns.GardenPractice[kind](ctx);
      if(kind==='Workshop'||kind==='Feed')this.unmountActivityArt=ns.LettersActivityArt?.mount(ctx.stage,kind==='Feed'?'feed':'build');
      if(kind!=='LetterDelivery')friend=this.petLife(kind==='Feed'?el.querySelector('.feed-creature'):el.querySelector('.practice-heading'),ctx.stage);
    }

    gardenReward(finished=false) {
      const world=this.session?.world;
      const stage=ns.LettersGardenArt.chapterGrowth(this.progress,this.bests,world);
      const scene=world?.id==='pack-boat'?ns.LettersGardenArt.boat({stage,terrain:false}):
        ns.LettersGardenArt.habitatReward({biome:world?.biome || 'meadow',stage,habitat:this.biomeDeco(world?.biome),terrain:false});
      return `<div class="garden-reward${finished?' garden-reward-finished':''}" role="img" aria-label="Garden flowers: ${stage}">${scene}</div>`;
    }

    rewardScene(finished=false,flower=false) {
      return `<div class="reward-scene">${ns.LettersRoomArt.floor()}<div class="reward-ground" aria-hidden="true">${ns.LettersRoomArt.podium()}</div>${this.gardenReward(finished)}
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
            <button type="button" class="lg-big-btn stars-next" aria-label="${nextStep?.label || 'Continue'}">${nextStep ? `<span class="adventure-next-icon">${ns.LettersJourney.icon(nextStep.game, ns.LettersJourney.forWorld(s.world)?.kind)}</span>` : ''}${Art.icon(lastGame ? "check" : "next", 40)}</button>
          </div>
        </div>`,
      );
      this.wireTopBar(el);
      this.wirePractice(el,()=>this.renderStars(stars));
      // A craft chapter's step lands with the sound of its material.
      const craftKind = ns.LettersJourney?.forWorld?.(s.world)?.craft && ns.LettersJourney.forWorld(s.world).kind;
      const craftCue = { garland: "thread", harvest: "thud", jars: "clink", raft: "dock" }[craftKind];
      if (craftCue) setTimeout(() => { if (el.isConnected) this.sound.play(craftCue); }, 420);
      // The pet celebrates, then looks over the packets it is carrying onward.
      const friend = this.sceneRig(el.querySelector('.adventure-friend, .reward-friend'));
      friend?.cheer(() => friend.inspect(el.querySelector('.adventure-cargo, .reward-ground'), 1600));
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

    // The friend stop (v32, 2026-10-03): every chapter can end with one of the
    // newer games, chosen to fit its letters, so children meet them on the
    // main journey instead of only in the practice garden's corners.
    chapterBonus(world) {
      if (!world || !ns.GardenPractice) return null;
      const F = ns.LetterFriends;
      const letters = (world.meet || []).map(m => m.display).filter(c => F?.FRIENDS?.[c]);
      const items = letters.map(c => ({ id: c, display: c, speak: (ns.LETTERS_DATA?.packs || []).flatMap(p => p.letters).find(l => l.char === c)?.arName || c }));
      const sib = c => ns.PuzzleGames?.siblings?.(c, letters).length > 0;
      const pick = {
        "pack-boat": "FriendFind", "pack-smile": "DotsLast", "pack-little": "FriendFind", "pack-wave": "DotsLast",
        "pack-tall": "FriendFind", "pack-strong": "LetterShadows", "pack-round": "FriendFind",
        "join-1": "LetterShadows", "join-2": "SameLetter", muqattaat: "EchoParade", sukoon: "LanternHunt",
        fatha: "HatShop", "kasra-damma": "HatShop", tanween: "HatShop",
        // v35: the long-vowel chapters sing their syllables in Echo Parade.
        standing: "EchoParade", "long-sounds": "EchoParade", leen: "EchoParade",
      }[world.id];
      if (!pick || !ns.GardenPractice[pick]) return null;
      if (pick === "DotsLast" && !letters.some(sib)) return null;
      // Joining and later chapters review everything learned; letter chapters
      // use their own new letters.
      if (pick === "EchoParade" && world.kind === "syllables") return { kind: pick, items: (world.items?.() || []).filter(i => ns.LetterFriends?.FRIENDS?.[[...String(i.display)][0]] && [...String(i.display)][0] !== "ا") };
      // Vowel chapters dress the friends in their own syllables (v33).
      if (pick === "HatShop") return { kind: pick, items: (world.items?.() || []).filter(i => ns.VowelGames?.baseOf(i.display) && ns.VowelGames?.markOf(i.display)) };
      const review = world.kind !== "letters" && pick !== "EchoParade";
      return { kind: pick, items: review || !items.length ? this.knownItems() : items };
    }

    finishWorld() {
      const s = this.session;
      if (!s.checkup && !s.daily && !s.bonusDone) {
        const bonus = this.chapterBonus(s.world);
        if (bonus && bonus.items.length) {
          s.bonusDone = true;
          const chapter = s;
          this.session = { world: s.world, items: bonus.items, startAt: 0, chapterBonus: true };
          const resume = () => { this.session = chapter; this.finishWorld(); };
          return this.startPractice(bonus.kind, resume, resume);
        }
      }
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
        // Earn the choice (v5): the day's first bouquet earns a sticker-stand visit.
        if (firstToday && this.stickers) { this.stickers.freeVisits = Math.min(9, (this.stickers.freeVisits || 0) + 1); this.saveJSON("quran-trainer:letters:stickers", this.stickers); }
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
        this.mapWelcome = { world: s.world.id };
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
        ? `<div class="party-capstone"><svg class="party-glint" viewBox="-10 -10 20 20" aria-hidden="true"><path d="M0-9Q0 0 9 0Q0 0 0 9Q0 0-9 0Q0 0 0-9Z" fill="#f3c955" stroke="#70501b" stroke-width="1.6"/></svg>${Art.icon("book", 26)}<svg class="party-glint" viewBox="-10 -10 20 20" aria-hidden="true"><path d="M0-9Q0 0 9 0Q0 0 0 9Q0 0-9 0Q0 0 0-9Z" fill="#f3c955" stroke="#70501b" stroke-width="1.6"/></svg></div>`
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
          <div class="party-actions">${adventure ? `<button type="button" class="lg-round-btn party-replay" aria-label="${ns.LettersJourney.REPLAY?.[ns.LettersJourney.forWorld(this.session?.world)?.kind] || 'Play the delivery again'}">${Art.icon('replay',32)}</button>` : ''}<button type="button" class="party-decorate" aria-label="Decorate with your earned rewards">${ns.DecoratingGarden.icon(50)}</button><button type="button" class="lg-big-btn party-next" aria-label="Return to the garden">${Art.icon("home", 44)}</button></div>
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
      const partyRig = this.sceneRig(partyPet);
      partyRig?.cheer(() => partyRig.inspect(el.querySelector('.adventure-basket, .adventure-cargo, .party-flower, .party-mascot'), 1600));
      partyPet.addEventListener("click", () => {
        if(!el.isConnected)return;
        partyRig?.cheer();
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
