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
      this.wallet = this.loadJSON("quran-trainer:letters:wallet", { earned: 0, spent: 0 });
      this.stickers = this.loadJSON("quran-trainer:letters:stickers", { owned: [] });
      this.worlds.loadWords().finally(() => (this.pet ? this.renderHome() : this.renderHatch()));
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
      const done = this.progress.done.length;
      return done >= 10 ? 3 : done >= 4 ? 2 : 1;
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
            ? `<div class="hatch-pet">${this.petSVG(180, "open")}</div>
               <div class="hatch-hues">${hues.map((h) => `<button type="button" class="hatch-hue${(this.pet?.hue ?? 200) === h ? " is-picked" : ""}" data-hue="${h}" style="--h:${h}"></button>`).join("")}</div>
               <button type="button" class="lg-big-btn hatch-go">${Art.icon("check", 40)}</button>`
            : `<button type="button" class="hatch-egg">${Art.egg({ size: 190, cracks })}</button>`}
        </div>`,
      );
      if (!hatched) {
        el.querySelector(".hatch-egg").addEventListener("pointerdown", () => {
          this.sound.play(cracks >= 2 ? "hatch" : "click");
          if (cracks >= 2) {
            this.pet = this.pet || { hue: 200, worn: [] };
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

    // The pet's room: dress-up shelf plus the tap-to-recite thought bubble.
    renderPet() {
      const worn = this.pet.worn || [];
      const shelf = ns.LETTERS_ACCESSORIES.map((acc) => {
        const owned = (this.pet.accessories || []).includes(acc.id);
        const wearing = worn.includes(acc.id);
        return `<button type="button" class="pet-acc${owned ? " is-owned" : ""}${wearing ? " is-worn" : ""}" data-acc="${acc.id}">
          <span class="pet-acc-art">${Art.pet({ hue: this.pet.hue, stage: 1, worn: [acc.id], size: 62 })}</span>
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
            ${this.petSVG(190)}
          </button>
          <div class="pet-shelf">${shelf}</div>
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
      for (const btn of el.querySelectorAll(".pet-acc")) {
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
          <div class="album-grid">${grid}</div>
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
          this.sound.play("hatch");
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

    renderHome() {
      this.root.style.setProperty("--lg-hue", "150");
      const worlds = this.worlds.worlds;
      const allDone = this.firstOpenIndex() >= worlds.length;
      const daily = this.worlds.dailySession(this.progress.done);
      const stampedToday = this.stamps.dates.includes(todayStr());
      // The path reads bottom-to-top: world 1 sits at the bottom of the
      // scroll, and when everything is done a door to the island crowns it.
      const el = this.screen(
        "lg-home",
        `${this.topBar({ home: false })}
        <div class="map-daily-row">
          ${daily ? `<button type="button" class="map-daily${stampedToday ? " is-stamped" : ""}">${Art.icon("sun", 34)}${stampedToday ? `<i class="map-daily-check">${Art.icon("check", 16)}</i>` : ""}</button>` : ""}
          <button type="button" class="map-pet">${this.petSVG(46)}</button>
          <button type="button" class="map-album">${Art.icon("star", 26)}<b>${this.starBalance()}</b></button>
          <button type="button" class="map-calendar">${Art.icon("calendar", 30)}</button>
        </div>
        <div class="map-scroll">
          <div class="map-path">
            ${allDone ? `<div class="map-row is-left"><a class="map-stop is-door" href="index.html">${Art.mapStop({ hue: 45, label: "🏝", status: "done", stars: 3, latin: true })}</a></div>` : ""}
            ${worlds
              .map((world, i) => {
                const status = this.statusOf(world);
                const side = i % 2 === 0 ? "is-left" : "is-right";
                return `<div class="map-row ${side}">
                  <button type="button" class="map-stop is-${status}" data-world="${world.id}" ${status === "locked" ? "disabled" : ""}>
                    ${Art.mapStop({ hue: world.hue, label: world.icon, status, stars: this.stars[world.id] || 0, latin: !/[؀-ۿ]/.test(world.icon) })}
                  </button>
                  ${status === "current" ? `<span class="map-here">${Art.keyMascot({ size: 66 })}</span>` : ""}
                </div>`;
              })
              .reverse()
              .join("")}
          </div>
        </div>`,
      );
      this.wireTopBar(el, null);
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
          <div class="stamps-grid">${cells}</div>
        </div>`,
      );
      this.wireTopBar(el);
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
        extraItems: [],
        daily: true,
      };
      this.startGame();
    }

    // ---------- world flow: meet → games → party ----------

    startWorld(world) {
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
        <div class="meet-stage">
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
      const gameName = s.world.games[s.gameIndex];
      const el = this.screen(
        "lg-play",
        `${this.topBar()}
        <div class="play-prompt">
          <span class="play-pet">${this.petSVG(56)}</span>
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
      bubble.addEventListener("pointerdown", () => this.say(currentTarget));

      const petEl = el.querySelector(".play-pet");
      petEl.addEventListener("pointerdown", () => this.petRecite(null));
      const ctx = {
        stage,
        items: s.items,
        extraItems: s.extraItems,
        rounds: 4,
        hue: s.world.hue,
        level: this.stars[s.world.id] || 0,
        say: (item) => this.say(item),
        // The pet watches the child play: it hops on every right answer.
        sfx: (name) => {
          this.sound.play(name);
          if (name === "correct" && petEl) {
            petEl.classList.remove("is-hop");
            void petEl.offsetWidth;
            petEl.classList.add("is-hop");
          }
        },
        confettiAt: (target) => this.confettiAt(target),
        setPrompt: (item) => {
          currentTarget = item;
          bubble.hidden = !item;
          if (item) {
            glyph.textContent = item.display;
            glyph.classList.toggle("is-latin", !/[؀-ۿ]/.test(item.display));
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
      this.renderStars(stars);
    }

    renderStars(stars) {
      const s = this.session;
      const lastGame = s.gameIndex >= s.world.games.length - 1;
      const el = this.screen(
        "lg-stars",
        `${this.topBar()}
        <div class="stars-stage">
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
      this.sound.play(stars === 3 ? "perfect" : "ayahComplete");
      this.confettiAt(el.querySelector(".stars-row"), stars === 3);
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

    renderParty(stars, newlyDone) {
      const el = this.screen(
        "lg-party",
        `<div class="party-stage">
          <div class="party-pair">
            <div class="party-mascot">${Art.keyMascot({ size: 150, mood: "open" })}</div>
            <button type="button" class="party-pet">
              <span class="pet-bubble" hidden></span>
              ${this.petSVG(130, "open")}
            </button>
          </div>
          <div class="party-stars">
            ${[0, 1, 2].map((i) => `<span class="stars-star ${i < stars ? "is-on" : ""}" style="animation-delay:${i * 240}ms">${Art.icon("star", 64)}</span>`).join("")}
          </div>
          <button type="button" class="lg-big-btn party-next">${Art.icon("next", 44)}</button>
        </div>`,
      );
      this.sound.play(newlyDone ? "record" : "perfect");
      this.confettiAt(el.querySelector(".party-mascot"), true);
      setTimeout(() => this.confettiAt(el.querySelector(".party-stars"), true), 500);
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
