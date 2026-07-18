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
        <path d="M20 17 C8 2 -2 6 3 16 C-2 26 10 32 20 17 Z" fill="hsl(var(--bf-hue) 78% 68%)" stroke="#3a2c48" stroke-width="1.6"/>
        <circle cx="8" cy="12" r="2.2" fill="#fffaf0"/>
      </g>
      <g class="bf-wing bf-r">
        <path d="M20 17 C32 2 42 6 37 16 C42 26 30 32 20 17 Z" fill="hsl(var(--bf-hue) 78% 62%)" stroke="#3a2c48" stroke-width="1.6"/>
        <circle cx="32" cy="12" r="2.2" fill="#fffaf0"/>
      </g>
      <ellipse cx="20" cy="18" rx="2" ry="7" fill="#3a2c48"/>
    </svg>`;

  class LettersGame {
    constructor(root) {
      this.root = root;
      this.sound = new ns.SoundSystem();
      this.recite = new ns.RecitationAudio(() => this.sound.enabled);
      this.worlds = new ns.LettersWorlds();
      this.progress = this.loadProgress();
      this.stars = this.loadStars();
      // Island progression is deliberately NOT wired up for now — the Letter
      // Garden will get its own reward loop later.
      this.island = null;
      this.game = null; // active mini-game instance
      this.stamps = this.loadStamps();
      // Recorded letter clips (assets/audio/letters/<name>.mp3) win over TTS
      // whenever they exist; 404s are remembered so we only knock once.
      this.letterFiles = new Map(
        ns.LETTERS_DATA.packs.flatMap((p) => p.letters).map((l) => [l.char, l.name.toLowerCase()]),
      );
      this.missingClips = new Set();
      this.pet = this.loadJSON("quran-trainer:letters:pet", null);
      this.skills = this.loadJSON("quran-trainer:letters:skills", {});
      this.wallet = this.loadJSON("quran-trainer:letters:wallet", { earned: 0, spent: 0 });
      this.stickers = this.loadJSON("quran-trainer:letters:stickers", { owned: [] });
      this.applyPhase();
      this.initSparkles();
      this.initAmbient();
      this.worlds.loadWords().finally(() => (this.pet ? this.renderHome() : this.renderHatch()));
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
      const n = night ? 7 : 5;
      for (let i = 0; i < n; i += 1) {
        const c = document.createElement("i");
        c.className = night ? "lg-firefly-amb" : "lg-butterfly";
        if (!night) {
          const hues = [340, 45, 275, 200];
          c.style.setProperty("--bf-hue", String(hues[i % hues.length]));
          c.innerHTML = butterflySVG();
        }
        c.style.top = `${8 + Math.random() * 78}%`;
        c.style.setProperty("--amb-dur", `${18 + Math.random() * 20}s`);
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
      s.setProperty("--lg-sky-mid", p.lo);
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
      this.root.addEventListener("pointermove", (e) => {
        if (e.pointerType === "mouse" && e.buttons === 0) return; // drags only, not hover
        const now = performance.now();
        if (now - last < 40 && Math.hypot(e.clientX - lx, e.clientY - ly) < 24) return;
        last = now;
        lx = e.clientX;
        ly = e.clientY;
        const s = document.createElement("i");
        s.className = `lg-spark ${colors[Math.floor(Math.random() * colors.length)]}`;
        s.style.left = `${e.clientX}px`;
        s.style.top = `${e.clientY}px`;
        s.style.setProperty("--sx", `${Math.round(Math.random() * 24 - 12)}px`);
        s.style.setProperty("--sy", `${Math.round(Math.random() * 20 + 6)}px`);
        document.body.appendChild(s);
        setTimeout(() => s.remove(), 750);
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
      const known = this.petKnowledge();
      if (!known.length) {
        this.sound.play("click");
        if (bubbleEl) bubbleEl.textContent = "؟";
        return;
      }
      const letter = known[Math.floor(Math.random() * known.length)];
      if (bubbleEl) bubbleEl.textContent = letter.char;
      this.say({ display: letter.char, speak: letter.arName });
    }

    // First visit: hatch the pet. Three taps crack the egg, then the child
    // picks its colour — all wordless.
    renderHatch(cracks = 0) {
      const hues = [200, 320, 95, 268, 28];
      const hatched = cracks >= 3;
      const el = this.screen(
        "lg-hatch",
        `<div class="hatch-stage">
          ${hatched
            ? `<div class="hatch-pet">${this.petSVG(220, "open")}</div>
               <div class="hatch-hues">${hues.map((h) => `<button type="button" class="hatch-hue${(this.pet?.hue ?? 200) === h ? " is-picked" : ""}" data-hue="${h}" style="--h:${h}"></button>`).join("")}</div>
               <button type="button" class="lg-big-btn hatch-go">${Art.icon("check", 40)}</button>`
            : `<button type="button" class="hatch-egg">${Art.egg({ size: 190, cracks })}</button>`}
        </div>`,
      );
      if (!hatched) {
        el.querySelector(".hatch-egg").addEventListener("pointerdown", () => {
          this.sound.play(cracks >= 2 ? "hatch" : "click");
          if (cracks >= 2) {
            this.pet = this.pet || { hue: 200, species: "blob", worn: [], bodies: ["blob"] };
            this.saveJSON("quran-trainer:letters:pet", this.pet);
            this.confettiAt(el.querySelector(".hatch-egg"), true);
          }
          this.renderHatch(cracks + 1);
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

    // The pet's room: the body shop (new species bought with stars), the
    // dress-up shelf, and the tap-to-recite thought bubble.
    renderPet() {
      const worn = this.pet.worn || [];
      const species = this.pet.species || "blob";
      const ownedBodies = this.pet.bodies || (this.pet.bodies = ["blob"]);
      const bodyShelf = ns.LETTERS_BODIES.map((b) => {
        const owned = ownedBodies.includes(b.id);
        return `<button type="button" class="pet-acc${owned ? " is-owned" : ""}${species === b.id ? " is-worn" : ""}" data-body="${b.id}">
          <span class="pet-acc-art">${Art.pet({ hue: this.pet.hue, species: b.id, stage: 1, size: 54 })}</span>
          ${owned ? "" : `<span class="pet-acc-cost">${Art.icon("star", 12)} ${b.cost}</span>`}
        </button>`;
      }).join("");
      const shelf = ns.LETTERS_ACCESSORIES.map((acc) => {
        const owned = (this.pet.accessories || []).includes(acc.id);
        const wearing = worn.includes(acc.id);
        return `<button type="button" class="pet-acc${owned ? " is-owned" : ""}${wearing ? " is-worn" : ""}" data-acc="${acc.id}">
          <span class="pet-acc-art">${Art.pet({ hue: this.pet.hue, species, stage: 1, worn: [acc.id], size: 62 })}</span>
          ${owned ? "" : `<span class="pet-acc-cost">${Art.icon("star", 12)} ${acc.cost}</span>`}
        </button>`;
      }).join("");
      const el = this.screen(
        "lg-pet",
        `${this.topBar()}
        <div class="pet-stage">
          <span class="lg-star-chip">${Art.icon("star", 20)} <b>${this.starBalance()}</b></span>
          <button type="button" class="pet-big">
            <span class="pet-bubble" hidden></span>
            ${this.petSVG(230)}
          </button>
          ${Object.keys(this.skills).length ? `<div class="pet-flower">${Art.skillFlower({ scores: this.skills, size: 130 })}</div>` : ""}
          <div class="pet-shelf pet-bodies lg-panel">${bodyShelf}</div>
          <div class="pet-shelf lg-panel">${shelf}</div>
        </div>`,
      );
      this.wireTopBar(el);
      const bubble = el.querySelector(".pet-bubble");
      el.querySelector(".pet-big").addEventListener("pointerdown", () => {
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
          `<span class="album-slot${justOpened === s.id ? " is-new" : ""}">${Art.sticker({ id: s.id, owned: owned.has(s.id), size: 78 })}</span>`,
      ).join("");
      const allOwned = owned.size >= ns.LETTERS_STICKERS.length;
      const el = this.screen(
        "lg-album",
        `${this.topBar()}
        <div class="album-stage">
          <span class="lg-star-chip">${Art.icon("star", 20)} <b>${this.starBalance()}</b></span>
          ${allOwned
            ? `<div class="album-complete">${Art.icon("star", 40)}</div>`
            : `<button type="button" class="album-pack">${Art.stickerPack({ size: 104 })}<span class="pet-acc-cost">${Art.icon("star", 14)} 5</span></button>`}
          <div class="album-grid lg-panel">${grid}</div>
        </div>`,
      );
      this.wireTopBar(el);
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

    say(item) {
      if (!item) return;
      if (item.audioPath) {
        this.recite.playWord(item.audioPath);
        return;
      }
      const file = item.display && item.display.length === 1 ? this.letterFiles.get(item.display) : null;
      if (file && !this.missingClips.has(file) && this.sound.enabled) {
        if (!this.clipEl) this.clipEl = new Audio();
        const fallback = () => {
          this.missingClips.add(file);
          this.speak(item.speak || item.display);
        };
        this.clipEl.onerror = fallback;
        this.clipEl.src = `assets/audio/letters/${file}.mp3`;
        const p = this.clipEl.play();
        if (p && p.catch) p.catch(fallback);
        return;
      }
      this.speak(item.speak || item.display);
    }

    // Warm and unhurried: slow rate, slightly lowered pitch, gentle volume,
    // and the best Arabic voice the device offers (premium voices first).
    speak(text) {
      if (!text || !this.sound.enabled || !("speechSynthesis" in window)) return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "ar-SA";
        u.rate = 0.55;
        u.pitch = 0.9;
        u.volume = 0.85;
        const voices = speechSynthesis.getVoices().filter((v) => (v.lang || "").startsWith("ar"));
        const pick =
          voices.find((v) => /premium|enhanced|natural/i.test(v.name)) ||
          voices.find((v) => /majed|laila|mariam|tarik/i.test(v.name)) ||
          voices.find((v) => /google/i.test(v.name)) ||
          voices[0];
        if (pick) u.voice = pick;
        speechSynthesis.speak(u);
      } catch {}
    }

    confettiAt(el, golden) {
      const rect = el.getBoundingClientRect();
      Art.confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, golden);
    }

    // ---------- chrome ----------

    screen(className, inner) {
      if (this.game && this.game.destroy) this.game.destroy();
      this.game = null;
      this.root.innerHTML = `${Art.backdrop()}<div class="lg-screen ${className}">${inner}</div>`;
      return this.root.querySelector(".lg-screen");
    }

    topBar({ home = true } = {}) {
      return `
        <div class="lg-topbar">
          ${home ? `<button type="button" class="lg-round-btn lg-home">${Art.icon("home", 32)}</button>` : "<span></span>"}
          <button type="button" class="lg-round-btn lg-sound">${Art.icon("speaker", 32)}</button>
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
      const syncSound = () => soundBtn.classList.toggle("is-off", !this.sound.enabled);
      soundBtn.addEventListener("click", () => {
        this.sound.toggle ? this.sound.toggle() : (this.sound.enabled = !this.sound.enabled);
        if (!this.sound.enabled) {
          this.recite.stop();
          try { speechSynthesis.cancel(); } catch {}
        }
        syncSound();
      });
      syncSound();
    }

    // ---------- home: the journey map ----------

    // Tiny biome scenery decals stamped along the trail — same tactile SVG
    // language as the rest of the garden (plum ink, candy fills, no black).
    biomeDeco(biome) {
      const ink = "#3a2c48";
      const D = {
        meadow: `<svg viewBox="0 0 64 48"><g stroke="${ink}" stroke-width="2.5" stroke-linecap="round"><path d="M14 42V26M32 44V22M50 42V28" fill="none"/><ellipse cx="14" cy="21" rx="6" ry="7" fill="#ff8fb1"/><ellipse cx="32" cy="16" rx="7" ry="8" fill="#ffc22e"/><ellipse cx="50" cy="23" rx="6" ry="7" fill="#b48be8"/></g></svg>`,
        orchard: `<svg viewBox="0 0 64 48"><g stroke="${ink}" stroke-width="2.5"><rect x="28" y="28" width="8" height="16" rx="3" fill="#b07a4a"/><circle cx="32" cy="19" r="15" fill="#5cc23e"/><circle cx="25" cy="16" r="3.4" fill="#ff6b5e" stroke-width="2"/><circle cx="38" cy="22" r="3.4" fill="#ff6b5e" stroke-width="2"/><circle cx="33" cy="11" r="3.4" fill="#ffc22e" stroke-width="2"/></g></svg>`,
        lagoon: `<svg viewBox="0 0 64 48"><g stroke="${ink}" stroke-width="2.5" stroke-linecap="round" fill="none"><path d="M18 44V20M18 20c-5-1-7-5-7-9 5 0 8 3 7 9ZM26 44V26m0 0c5-1 7-5 7-9-5 0-8 3-7 9Z"/><path d="M8 44c6-4 12-4 18 0s12 4 18 0 8-3 12-1" stroke="#4fb3e8"/></g></svg>`,
        night: `<svg viewBox="0 0 64 48"><g stroke="${ink}" stroke-width="2.5"><path d="M38 8a14 14 0 1 0 12 21A16 16 0 0 1 38 8Z" fill="#ffe9a8"/><circle cx="16" cy="14" r="2.4" fill="#fff7d9" stroke="none"/><circle cx="22" cy="30" r="1.8" fill="#c9f26e" stroke="none"/><circle cx="12" cy="38" r="1.8" fill="#c9f26e" stroke="none"/></g></svg>`,
        peaks: `<svg viewBox="0 0 64 48"><g stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"><path d="M6 44 22 16l14 28Z" fill="#9fb7d9"/><path d="M28 44 44 10l16 34Z" fill="#c3d3ea"/><path d="M44 10l5 10-4 2-4-3-3 2Z" fill="#fffaf0"/></g></svg>`,
        river: `<svg viewBox="0 0 64 48"><g stroke="${ink}" stroke-width="2.5" stroke-linecap="round" fill="none"><path d="M6 18c7-5 14-5 21 0s14 5 21 0 8-4 10-3" stroke="#4fb3e8"/><path d="M6 30c7-5 14-5 21 0s14 5 21 0" stroke="#7fd0f2"/><ellipse cx="18" cy="42" rx="7" ry="4" fill="#e8d9b8"/><ellipse cx="40" cy="43" rx="5" ry="3" fill="#d9c49a"/></g></svg>`,
      };
      return D[biome] || "";
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
        return `<svg viewBox="0 0 48 50">${stem}${leaves}<ellipse cx="24" cy="22" rx="6" ry="8" fill="#ff8fb1" stroke="${ink}" stroke-width="1.5"/><path d="M24 14 C22 18 22 20 24 22 C26 20 26 18 24 14 Z" fill="#ffa9c4"/></svg>`;
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
      const GAP = 200;
      const total = worlds.length + (allDone ? 1 : 0);
      const height = total * GAP + 240;
      const yOf = (i) => height - 150 - i * GAP;
      const xOf = (i) => (i % 2 === 0 ? 28 : 72); // percent of the path width
      const el = this.screen(
        "lg-home",
        `${this.topBar({ home: false })}
        <div class="map-daily-row lg-tray">
          ${daily ? `<button type="button" class="map-daily${stampedToday ? " is-stamped" : ""}">${Art.icon("sun", 34)}${stampedToday ? `<i class="map-daily-check">${Art.icon("check", 16)}</i>` : ""}</button>` : ""}
          ${daily ? `<button type="button" class="map-checkup">${Art.icon("flower", 34)}</button>` : ""}
          <button type="button" class="map-pet">${this.petSVG(46)}</button>
          <button type="button" class="map-album">${Art.icon("star", 26)}<b>${this.starBalance()}</b></button>
          <button type="button" class="map-calendar">${Art.icon("calendar", 30)}</button>
        </div>
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
            ${allDone ? `<a class="map-stop is-door" href="index.html" style="left:${xOf(worlds.length)}%; top:${yOf(worlds.length)}px">${Art.mapStop({ hue: 45, label: "🏝", status: "done", stars: 3, latin: true })}</a>` : ""}
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
                  ${status === "done" ? `<span class="map-bloom" style="${at}">${Art.bloomCluster({ seed: i + 1 })}</span>` : ""}
                  ${plant}
                  <span class="map-deco" style="left:${xOf(i) + (i % 2 === 0 ? 34 : -34)}%; top:${yOf(i) + 46}px">${this.biomeDeco(world.biome)}</span>
                  <button type="button" class="map-stop is-${status}" data-world="${world.id}" ${status === "locked" ? "disabled" : ""} style="${at}">
                    ${Art.mapStop({ hue: world.hue, label: world.icon, status, stars: this.stars[world.id] || 0, latin: !/[؀-ۿ]/.test(world.icon) })}
                  </button>
                  ${status === "current" ? `<span class="map-here" style="left:${xOf(i) + (i % 2 === 0 ? 17 : -17)}%; top:${yOf(i)}px">${Art.keyMascot({ size: 58 })}${this.petSVG(40)}</span>` : ""}
                  ${status === "current" && !this.progress.done.length ? `<span class="map-tap" style="left:${xOf(i)}%; top:${yOf(i) - 96}px; bottom:auto; margin:0;">${Art.icon("arrow", 44)}</span>` : ""}`;
              })
              .join("")}
          </div>
        </div>`,
      );
      this.wireTopBar(el, null);
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
        <path d="${d}" fill="none" stroke="#7fc6a4" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 22"/>`;
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
      el.querySelector(".map-calendar").addEventListener("click", () => {
        this.sound.play("page");
        this.renderStamps();
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

    renderMeet() {
      const s = this.session;
      const card = s.world.meet[s.meetIndex];
      const el = this.screen(
        "lg-meet",
        `${this.topBar()}
        <div class="meet-stage lg-panel">
          <button type="button" class="meet-card">${Art.blobCard({ hue: s.world.hue, label: card.display, latin: !/[؀-ۿ]/.test(card.display) })}</button>
          <div class="meet-dots">${s.world.meet.map((_, i) => `<i class="${i === s.meetIndex ? "is-on" : ""}"></i>`).join("")}</div>
          <div class="meet-nav">
            <button type="button" class="lg-round-btn meet-hear">${Art.icon("speaker", 36)}</button>
            <button type="button" class="lg-big-btn meet-next">${Art.icon("next", 40)}</button>
          </div>
        </div>`,
      );
      this.wireTopBar(el);
      const speakCard = () => this.say(card);
      el.querySelector(".meet-card").addEventListener("pointerdown", speakCard);
      el.querySelector(".meet-hear").addEventListener("click", speakCard);
      el.querySelector(".meet-next").addEventListener("click", () => {
        this.sound.play("page");
        s.meetIndex += 1;
        if (s.meetIndex >= s.world.meet.length) this.startGame();
        else this.renderMeet();
      });
      setTimeout(speakCard, 450);
    }

    startGame() {
      const s = this.session;
      const planStep = s.plan ? s.plan[s.gameIndex] : null;
      const gameName = planStep ? planStep.game : s.world.games[s.gameIndex];
      const el = this.screen(
        "lg-play",
        `${this.topBar()}
        <div class="play-prompt lg-panel">
          <span class="play-pet play-character">${Art.character({ size: 76, pose: "idle" })}</span>
          <span class="play-mascot">${Art.keyMascot({ size: 66 })}</span>
          <button type="button" class="play-bubble" hidden>
            <span class="play-bubble-glyph" dir="rtl" lang="ar"></span>
            <span class="play-bubble-icon">${Art.icon("speaker", 22)}</span>
          </button>
          <span class="play-dots">${s.world.games.map((_, i) => `<i class="${i < s.gameIndex ? "is-done" : i === s.gameIndex ? "is-on" : ""}"></i>`).join("")}</span>
        </div>
        <div class="play-stage"></div>`,
      );
      this.wireTopBar(el);
      const stage = el.querySelector(".play-stage");
      const bubble = el.querySelector(".play-bubble");
      const glyph = el.querySelector(".play-bubble-glyph");
      let currentTarget = null;
      bubble.addEventListener("pointerdown", () => sayWithPose(currentTarget));

      const petEl = el.querySelector(".play-pet");
      let poseTimer = null;
      let poseLockedUntil = 0;
      const setPetPose = (pose, hold = 0, lock = false) => {
        if (!petEl) return;
        petEl.innerHTML = Art.character({ size: 76, pose });
        if (poseTimer) clearTimeout(poseTimer);
        poseLockedUntil = lock ? Date.now() + hold : 0;
        if (hold > 0) {
          poseTimer = setTimeout(() => {
            poseLockedUntil = 0;
            petEl.innerHTML = Art.character({ size: 76, pose: currentTarget ? "presenting" : "idle" });
          }, hold);
        }
      };
      const sayWithPose = (item) => {
        if (Date.now() >= poseLockedUntil) setPetPose("listening", 900);
        this.say(item);
      };
      petEl.addEventListener("pointerdown", () => {
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
        items: planStep ? planStep.items : s.items,
        extraItems: s.extraItems,
        rounds: 4,
        hue: s.world.hue,
        level: this.stars[s.world.id] || 0,
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
            glyph.textContent = shown;
            glyph.classList.toggle("is-latin", !/[؀-ۿ]/.test(shown));
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
        onDone: (slips) => this.finishGame(slips),
      };
      this.game = new ns.LettersMiniGames[gameName](ctx);
    }

    finishGame(slips) {
      const s = this.session;
      const stars = slips === 0 ? 3 : slips <= 2 ? 2 : 1;
      s.starTotal += stars;
      s.lastStars = stars;
      // Stars are also the spending currency for stickers and pet gear —
      // replays and dailies keep earning, so coming back always pays.
      this.earnStars(stars);
      // Check-up rounds grade a skill: the LATEST score is the petal size —
      // it's a health check, not a high-score board.
      if (s.plan && s.plan[s.gameIndex] && s.plan[s.gameIndex].skill) {
        this.skills[s.plan[s.gameIndex].skill] = { score: stars, at: todayStr() };
        this.saveJSON("quran-trainer:letters:skills", this.skills);
      }
      this.renderStars(stars);
    }

    renderStars(stars) {
      const s = this.session;
      const lastGame = s.gameIndex >= s.world.games.length - 1;
      const el = this.screen(
        "lg-stars",
        `${this.topBar()}
        <div class="stars-stage lg-panel">
          <div class="stars-row">
            ${[0, 1, 2].map((i) => `<span class="stars-star ${i < stars ? "is-on" : ""}" style="animation-delay:${i * 220}ms">${Art.icon("star", 74)}</span>`).join("")}
          </div>
          <div class="stars-nav">
            <button type="button" class="lg-round-btn stars-replay">${Art.icon("replay", 34)}</button>
            <button type="button" class="lg-big-btn stars-next">${Art.icon(lastGame ? "check" : "next", 40)}</button>
          </div>
        </div>`,
      );
      this.wireTopBar(el);
      const row = el.querySelector(".stars-row");
      // Climb the star ladder: one bright, rising bell per star as it drops
      // in (synced to the stagger), then the payoff chord once the last one
      // is home — a bigger fanfare the more stars you earned.
      for (let i = 0; i < stars; i += 1) {
        setTimeout(() => this.sound.play(`star${i + 1}`), i * 220 + 150);
      }
      setTimeout(() => {
        this.sound.play(stars === 3 ? "fanfare" : stars === 2 ? "cheer2" : "cheer1");
        this.confettiAt(row, stars === 3);
        if (stars === 3) setTimeout(() => this.confettiAt(row, true), 280);
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
      const el = this.screen(
        "lg-party",
        `<div class="party-stage lg-panel">
          ${flower ? `<div class="party-flower">${Art.skillFlower({ scores: this.skills, size: 200 })}</div>` : ""}
          <div class="party-pair">
            <div class="party-mascot">${Art.keyMascot({ size: flower ? 110 : 150, mood: "open" })}</div>
            <button type="button" class="party-pet">
              <span class="pet-bubble" hidden></span>
              ${this.petSVG(flower ? 95 : 130, "open")}
            </button>
          </div>
          <div class="party-stars">
            ${[0, 1, 2].map((i) => `<span class="stars-star ${i < stars ? "is-on" : ""}" style="animation-delay:${i * 240}ms">${Art.icon("star", 64)}</span>`).join("")}
          </div>
          <button type="button" class="lg-big-btn party-next">${Art.icon("next", 44)}</button>
        </div>`,
      );
      this.sound.play(newlyDone ? "worldClear" : "perfect");
      this.confettiAt(el.querySelector(".party-mascot"), true);
      setTimeout(() => this.confettiAt(el.querySelector(".party-stars"), true), 500);
      if (newlyDone) setTimeout(() => this.confettiAt(el.querySelector(".party-mascot"), true), 900);
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
